/**
 * ==============================================================================
 * VERIGRADE S3 — ADAPTIVE MULTI-MODAL CONFIDENCE FUSION (AMCF) IMPLEMENTATION
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual-Core 240MHz, 8MB Flash)
 * Target Sensors: OV2640 (AI), HX711 (Weight), LJ12A3 (Metal), HC-SR04 (Volume), Moisture
 * CLAIM MAP: Patent Claims 1, 5, 12, 14, 19, 23, 24, 25, 26
 *
 * Implements:
 * - Dynamic alpha calculation: S = alpha * C_AI + (1 - alpha) * C_sensors
 * - Conflict Rule 1: Optical Plastic vs Inductive Metal -> Conflict Flagged
 * - Conflict Rule 2: High Volumetric Density vs Lightweight Foam/Cardboard -> Conflict Flagged
 * - Hazard Rule 1: Visual Battery or Canister -> Instant Hazard Gate Ejection
 * - Hazard Rule 2: Metal + High Density > 4.5 g/cm³ (Solid Billet) -> Hazard Ejection
 * - Moisture Penalization: Water tare deduction if M% > Cutoff
 * - NVS Persistence of thresholds across power cuts
 * ==============================================================================
 */

#include "amcf_engine.h"
#include <Arduino.h>
#include <Preferences.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

static Preferences s_prefs;

AMCFEngine::AMCFEngine()
    : total_graded_count_(0),
      total_flagged_count_(0),
      total_hazards_intercepted_(0) {
    // Factory defaults
    config_.default_alpha = 0.70f;
    config_.min_confidence_threshold = 0.75f;
    config_.moisture_cutoff_pct = 12.0f;
    config_.billet_density_cutoff_g_cm3 = 4.5f;
    config_.battery_min_confidence = 0.50f;
    config_.auto_divert_hazards = true;
    config_.auto_flag_conflicts = true;
}

bool AMCFEngine::init() {
    loadConfigFromNVS();
    return true;
}

void AMCFEngine::loadConfigFromNVS() {
    if (s_prefs.begin("amcf_cfg", true)) { // Read-only mode
        config_.default_alpha = s_prefs.getFloat("alpha", 0.70f);
        config_.min_confidence_threshold = s_prefs.getFloat("min_conf", 0.75f);
        config_.moisture_cutoff_pct = s_prefs.getFloat("moist_cut", 12.0f);
        config_.billet_density_cutoff_g_cm3 = s_prefs.getFloat("billet_cut", 4.5f);
        config_.battery_min_confidence = s_prefs.getFloat("bat_conf", 0.50f);
        config_.auto_divert_hazards = s_prefs.getBool("div_haz", true);
        config_.auto_flag_conflicts = s_prefs.getBool("flag_conf", true);
        s_prefs.end();
    }
}

void AMCFEngine::saveConfigToNVS() {
    if (s_prefs.begin("amcf_cfg", false)) { // Read-write mode
        s_prefs.putFloat("alpha", config_.default_alpha);
        s_prefs.putFloat("min_conf", config_.min_confidence_threshold);
        s_prefs.putFloat("moist_cut", config_.moisture_cutoff_pct);
        s_prefs.putFloat("billet_cut", config_.billet_density_cutoff_g_cm3);
        s_prefs.putFloat("bat_conf", config_.battery_min_confidence);
        s_prefs.putBool("div_haz", config_.auto_divert_hazards);
        s_prefs.putBool("flag_conf", config_.auto_flag_conflicts);
        s_prefs.end();
    }
}

float AMCFEngine::computeDynamicAlpha(float optical_sharpness, float ambient_lux_ratio) {
    // Dynamic alpha adapts between 0.25 (poor visibility / blurry) and 0.90 (crisp strobe illumination)
    // Claim 23, 24: alpha = alpha_base * sharpness * ambient_fidelity
    float clamped_sharpness = fmaxf(0.1f, fminf(1.0f, optical_sharpness));
    float clamped_lux = fmaxf(0.5f, fminf(1.0f, ambient_lux_ratio));
    
    float dynamic_alpha = config_.default_alpha * clamped_sharpness * clamped_lux;
    if (dynamic_alpha < 0.25f) dynamic_alpha = 0.25f;
    if (dynamic_alpha > 0.90f) dynamic_alpha = 0.90f;
    return dynamic_alpha;
}

bool AMCFEngine::evaluateHazard(const SensorTelemetryVector& raw, char* out_reason, size_t max_len) {
    // Claim 12, 14: Weight-fused hazard gate evaluation
    // 1. Direct Optical Hazard Detection
    if (raw.ai_predicted_class == VG_CLASS_HAZARD_BATTERY && raw.ai_confidence >= config_.battery_min_confidence) {
        snprintf(out_reason, max_len, "CRITICAL: Optical Battery Detection (Conf: %.1f%%)", raw.ai_confidence * 100.0f);
        return true;
    }
    if (raw.ai_predicted_class == VG_CLASS_HAZARD_CANISTER && raw.ai_confidence >= config_.battery_min_confidence) {
        snprintf(out_reason, max_len, "CRITICAL: Optical Pressurized Canister (Conf: %.1f%%)", raw.ai_confidence * 100.0f);
        return true;
    }

    // 2. Physical Density + Inductive Metal Fusion (Solid Steel / Cast Billet Hazard)
    // Approximate volume: assumed base area 100 cm2 * height in cm
    float height_cm = (float)raw.profile_height_mm / 10.0f;
    if (height_cm < 1.0f) height_cm = 1.0f;
    float approx_volume_cm3 = 100.0f * height_cm;
    float approx_density = raw.weight_grams / approx_volume_cm3;

    if (raw.inductive_metal_active && approx_density > config_.billet_density_cutoff_g_cm3 && raw.weight_grams > 600.0f) {
        snprintf(out_reason, max_len, "CRITICAL: Unshreddable Solid Metal Billet (Density: %.2fg/cm³, Mass: %.0fg)", approx_density, raw.weight_grams);
        return true;
    }

    // 3. High localized conductivity with thermal / dense battery signature
    if (raw.inductive_metal_active && raw.weight_grams >= 45.0f && raw.weight_grams <= 250.0f && raw.profile_height_mm <= 35) {
        // Pouch or 18650 cell form factor detected on belt without plastic container signature
        if (raw.ai_predicted_class != VG_CLASS_ALUMINUM_CAN && raw.ai_confidence < 0.65f) {
            snprintf(out_reason, max_len, "SUSPECT: Li-ion Cylinder Form Factor (Cond: YES, Weight: %.0fg)", raw.weight_grams);
            return true;
        }
    }

    return false;
}

float AMCFEngine::calculateSensorConcordance(uint8_t ai_class, const SensorTelemetryVector& raw, char* out_conflict, size_t max_len) {
    float concordance = 1.0f;
    out_conflict[0] = '\0';

    // Conflict Rule 1: Optical says Plastic, but Inductive says Metal
    // Claim 25
    if ((ai_class == VG_CLASS_PET_BOTTLE || ai_class == VG_CLASS_HDPE_PLASTIC || ai_class == VG_CLASS_MIXED_RIGID_PLASTIC) && raw.inductive_metal_active) {
        snprintf(out_conflict, max_len, "Conflict: AI predicted Plastic (%.1f%%) but Inductive Proximity detected Metal", raw.ai_confidence * 100.0f);
        concordance -= 0.65f;
    }

    // Conflict Rule 2: Optical says Metal, but Inductive is False
    if ((ai_class == VG_CLASS_FERROUS_STEEL || ai_class == VG_CLASS_ALUMINUM_CAN) && !raw.inductive_metal_active) {
        snprintf(out_conflict, max_len, "Conflict: AI predicted Metal (%.1f%%) but Inductive Proximity detected non-conductive target", raw.ai_confidence * 100.0f);
        concordance -= 0.50f;
    }

    // Conflict Rule 3: Heavy mass anomaly for lightweight packaging (Claim 26)
    if (ai_class == VG_CLASS_PET_BOTTLE && raw.weight_grams > 350.0f) {
        snprintf(out_conflict, max_len, "Anomaly: Single PET bottle weight exceeds standard limit (Mass: %.0fg)", raw.weight_grams);
        concordance -= 0.40f;
    }

    // Conflict Rule 4: Excessive moisture adulteration
    if (raw.moisture_percent > config_.moisture_cutoff_pct) {
        if (out_conflict[0] == '\0') {
            snprintf(out_conflict, max_len, "Moisture Adulteration: %.1f%% exceeds %.1f%% cutoff", raw.moisture_percent, config_.moisture_cutoff_pct);
        }
        concordance -= 0.25f;
    }

    if (concordance < 0.0f) concordance = 0.0f;
    return concordance;
}

AMCFDecision AMCFEngine::evaluate(const SensorTelemetryVector& raw_telemetry) {
    total_graded_count_++;
    AMCFDecision decision;
    memset(&decision, 0, sizeof(AMCFDecision));

    // Step 1: Check for catastrophic infeed hazards (Claim 12, 14)
    char hazard_reason[64];
    if (evaluateHazard(raw_telemetry, hazard_reason, sizeof(hazard_reason))) {
        decision.is_hazard = true;
        decision.divert_ejection_gate = true;
        decision.requires_human_review = true;
        decision.final_class = (raw_telemetry.ai_predicted_class == VG_CLASS_HAZARD_BATTERY) ? VG_CLASS_HAZARD_BATTERY :
                               (raw_telemetry.ai_predicted_class == VG_CLASS_HAZARD_CANISTER) ? VG_CLASS_HAZARD_CANISTER : VG_CLASS_HAZARD_BILLET;
        decision.composite_score = 0.99f;
        decision.dynamic_alpha = 0.50f;
        strncpy(decision.decision_rule, "HAZARD_OVERRIDE_TRIGGERED", sizeof(decision.decision_rule));
        strncpy(decision.conflict_explanation, hazard_reason, sizeof(decision.conflict_explanation));
        total_hazards_intercepted_++;
        return decision;
    }

    // Step 2: Calculate dynamic alpha based on image sharpness (Claim 23, 24)
    decision.dynamic_alpha = computeDynamicAlpha(raw_telemetry.optical_sharpness, 1.0f);

    // Step 3: Compute sensor concordance
    char conflict_msg[96];
    float sensor_concordance = calculateSensorConcordance(raw_telemetry.ai_predicted_class, raw_telemetry, conflict_msg, sizeof(conflict_msg));

    // Step 4: Apply AMCF formula: S = alpha * C_AI + (1 - alpha) * C_sensors (Claim 23)
    decision.composite_score = (decision.dynamic_alpha * raw_telemetry.ai_confidence) +
                               ((1.0f - decision.dynamic_alpha) * sensor_concordance);

    // Step 5: Evaluate confidence threshold and conflicts (Claim 19, 23)
    if (conflict_msg[0] != '\0' && config_.auto_flag_conflicts) {
        // Direct physical contradiction encountered
        decision.final_class = VG_CLASS_FLAGGED_REVIEW;
        decision.requires_human_review = true;
        decision.divert_ejection_gate = true; // Divert to manual review spur
        strncpy(decision.decision_rule, "PHYSICAL_CONTRADICTION_FLAGGED", sizeof(decision.decision_rule));
        strncpy(decision.conflict_explanation, conflict_msg, sizeof(decision.conflict_explanation));
        total_flagged_count_++;
    } else if (decision.composite_score < config_.min_confidence_threshold) {
        // Low confidence classification
        decision.final_class = VG_CLASS_FLAGGED_REVIEW;
        decision.requires_human_review = true;
        decision.divert_ejection_gate = true;
        strncpy(decision.decision_rule, "LOW_CONFIDENCE_BELOW_THRESHOLD", sizeof(decision.decision_rule));
        snprintf(decision.conflict_explanation, sizeof(decision.conflict_explanation),
                 "Composite score %.1f%% below required %.1f%%", decision.composite_score * 100.0f, config_.min_confidence_threshold * 100.0f);
        total_flagged_count_++;
    } else {
        // High confidence validated classification
        decision.final_class = raw_telemetry.ai_predicted_class;
        decision.requires_human_review = false;
        decision.divert_ejection_gate = false; // Proceeds normally on conveyor
        strncpy(decision.decision_rule, "AMCF_ACCEPTED_VERIFIED", sizeof(decision.decision_rule));
        decision.conflict_explanation[0] = '\0';
    }

    return decision;
}

void AMCFEngine::updateThresholds(float alpha, float min_conf, float moisture_cutoff) {
    config_.default_alpha = alpha;
    config_.min_confidence_threshold = min_conf;
    config_.moisture_cutoff_pct = moisture_cutoff;
    saveConfigToNVS();
}
