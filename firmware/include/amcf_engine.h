/**
 * ==============================================================================
 * VERIGRADE S3 — ADAPTIVE MULTI-MODAL CONFIDENCE FUSION (AMCF) ENGINE HEADER
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual-Core 240MHz, 8MB Flash)
 * Target Sensors: OV2640 (AI), HX711 (Weight), LJ12A3 (Metal), HC-SR04 (Volume), Moisture
 * CLAIM MAP: Patent Claims 1, 5, 12, 14, 19, 23, 24, 25, 26
 *
 * Thresholds:
 * - Alpha Default: 0.70 (dynamic range: 0.20 to 0.95 based on optical clarity)
 * - Minimum Acceptance Confidence: 0.75
 * - Ambiguous Review Range: [0.35, 0.75)
 * - Maximum Allowable Moisture (PET/Cardboard): 12.0%
 * - Critical Metal Density (Solid Billet Hazard): > 4.5 g/cm³
 * - Battery Density Range: 1.8 to 3.2 g/cm³ with conductivity or thermal envelope
 * ==============================================================================
 */

#ifndef AMCF_ENGINE_H
#define AMCF_ENGINE_H

#include <stdint.h>
#include <stdbool.h>

// Material Categories
enum VeriGradeMaterialClass {
    VG_CLASS_PET_BOTTLE = 1,
    VG_CLASS_HDPE_PLASTIC = 2,
    VG_CLASS_CARDBOARD_OCC = 3,
    VG_CLASS_ALUMINUM_CAN = 4,
    VG_CLASS_FERROUS_STEEL = 5,
    VG_CLASS_MIXED_RIGID_PLASTIC = 6,
    VG_CLASS_HAZARD_BATTERY = 90,
    VG_CLASS_HAZARD_CANISTER = 91,
    VG_CLASS_HAZARD_BILLET = 92,
    VG_CLASS_FLAGGED_REVIEW = 99
};

// Raw multi-modal sensor telemetry evidence vector
struct SensorTelemetryVector {
    uint32_t item_id;
    uint32_t timestamp_ms;
    float weight_grams;          // From HX711 load cell
    float moisture_percent;      // From ADC GPIO8 (0.0 to 100.0%)
    uint16_t profile_height_mm;  // From HC-SR04 ultrasonic
    bool inductive_metal_active; // From LJ12A3 NPN inductive sensor
    uint8_t ai_predicted_class;  // MobileNet-V2 TinyML top-1 class
    float ai_confidence;         // Softmax confidence [0.0 - 1.0]
    float optical_sharpness;     // Laplacian variance / illumination quality [0.0 - 1.0]
};

// Fusion Decision Outcome
struct AMCFDecision {
    uint8_t final_class;
    float composite_score;
    float dynamic_alpha;
    bool is_hazard;
    bool divert_ejection_gate;
    bool requires_human_review;
    char decision_rule[64];
    char conflict_explanation[96];
};

// Configuration persisted in NVS
struct AMCFConfig {
    float default_alpha;
    float min_confidence_threshold;
    float moisture_cutoff_pct;
    float billet_density_cutoff_g_cm3;
    float battery_min_confidence;
    bool auto_divert_hazards;
    bool auto_flag_conflicts;
};

class AMCFEngine {
public:
    AMCFEngine();
    bool init();
    void loadConfigFromNVS();
    void saveConfigToNVS();

    // Core Fusion Algorithm: S = alpha * C_AI + (1 - alpha) * C_sensors
    AMCFDecision evaluate(const SensorTelemetryVector& raw_telemetry);

    // Dynamic Alpha Modulation based on exposure and sharpness
    float computeDynamicAlpha(float optical_sharpness, float ambient_lux_ratio);

    // Hazard evaluation logic (battery, pressurized canister, solid billet)
    bool evaluateHazard(const SensorTelemetryVector& raw, char* out_reason, size_t max_len);

    // Sensor concordance calculation
    float calculateSensorConcordance(uint8_t ai_class, const SensorTelemetryVector& raw, char* out_conflict, size_t max_len);

    // Setters for dynamic runtime tuning
    void updateThresholds(float alpha, float min_conf, float moisture_cutoff);
    const AMCFConfig& getConfig() const { return config_; }

private:
    AMCFConfig config_;
    uint32_t total_graded_count_;
    uint32_t total_flagged_count_;
    uint32_t total_hazards_intercepted_;
};

#endif // AMCF_ENGINE_H
