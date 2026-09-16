/**
 * ==============================================================================
 * VERIGRADE S3 — ATOMIC SD CARD LOGGER & NVS RECOVERY IMPLEMENTATION
 * ==============================================================================
 * Hardware: MicroSD Card via SPI (CS GPIO11) + ESP32 NVS
 * CLAIM MAP: Patent Claims 1, 6, 15
 * ==============================================================================
 */

#include "sd_logger.h"
#include <Arduino.h>
#include <SPI.h>
#include <FS.h>
#include <SD.h>
#include <Preferences.h>
#include <stdio.h>

static Preferences s_session_prefs;

SDLogger::SDLogger()
    : sd_initialized_(false),
      records_in_current_file_(0) {
    snprintf(current_log_filename_, sizeof(current_log_filename_), "/vgr3_log_001.csv");
}

bool SDLogger::init() {
    if (!SD.begin(PIN_SD_CS)) {
        Serial.println("[SD_LOGGER] SD initialization failed! Will cache to NVS ring buffer.");
        sd_initialized_ = false;
        return false;
    }

    sd_initialized_ = true;

    // Write CSV header if file doesn't exist
    if (!SD.exists(current_log_filename_)) {
        File file = SD.open(current_log_filename_, FILE_WRITE);
        if (file) {
            file.println("item_id,timestamp_ms,weight_g,moisture_pct,height_mm,inductive_metal,ai_class,ai_conf,dynamic_alpha,final_class,is_hazard,decision_rule,conflict_reason");
            file.close();
        }
    }

    return true;
}

bool SDLogger::logItemEvent(const SensorTelemetryVector& raw, const AMCFDecision& decision) {
    if (!sd_initialized_) return false;

    // Atomic append with flush to prevent corruption on scrap-yard brownout
    File file = SD.open(current_log_filename_, FILE_APPEND);
    if (!file) return false;

    char line_buffer[256];
    snprintf(line_buffer, sizeof(line_buffer),
        "%lu,%lu,%.1f,%.1f,%u,%d,%u,%.3f,%.2f,%u,%d,\"%s\",\"%s\"",
        raw.item_id,
        raw.timestamp_ms,
        raw.weight_grams,
        raw.moisture_percent,
        raw.profile_height_mm,
        raw.inductive_metal_active ? 1 : 0,
        raw.ai_predicted_class,
        raw.ai_confidence,
        decision.dynamic_alpha,
        decision.final_class,
        decision.is_hazard ? 1 : 0,
        decision.decision_rule,
        decision.conflict_explanation
    );

    file.println(line_buffer);
    file.flush(); // Ensure data is physically committed to flash
    file.close();

    records_in_current_file_++;
    checkAndRotateLogs();
    return true;
}

void SDLogger::checkAndRotateLogs() {
    if (records_in_current_file_ >= 5000) {
        static uint16_t file_idx = 2;
        snprintf(current_log_filename_, sizeof(current_log_filename_), "/vgr3_log_%03u.csv", file_idx++);
        File file = SD.open(current_log_filename_, FILE_WRITE);
        if (file) {
            file.println("item_id,timestamp_ms,weight_g,moisture_pct,height_mm,inductive_metal,ai_class,ai_conf,dynamic_alpha,final_class,is_hazard,decision_rule,conflict_reason");
            file.close();
        }
        records_in_current_file_ = 0;
    }
}

bool SDLogger::saveSessionToNVS(const SessionState& session) {
    if (!s_session_prefs.begin("vg_session", false)) return false;
    s_session_prefs.putUInt("sess_id", session.session_id);
    s_session_prefs.putUInt("trader_id", session.trader_id);
    s_session_prefs.putUInt("items", session.item_count);
    s_session_prefs.putFloat("gross_kg", session.gross_weight_kg);
    s_session_prefs.putFloat("payout", session.total_payout_amount);
    s_session_prefs.putBool("is_open", session.session_open);
    s_session_prefs.end();
    return true;
}

bool SDLogger::restoreSessionFromNVS(SessionState& session) {
    if (!s_session_prefs.begin("vg_session", true)) return false;
    session.session_id = s_session_prefs.getUInt("sess_id", 0);
    session.trader_id = s_session_prefs.getUInt("trader_id", 0);
    session.item_count = s_session_prefs.getUInt("items", 0);
    session.gross_weight_kg = s_session_prefs.getFloat("gross_kg", 0.0f);
    session.total_payout_amount = s_session_prefs.getFloat("payout", 0.0f);
    session.session_open = s_session_prefs.getBool("is_open", false);
    s_session_prefs.end();
    return session.session_open;
}

bool SDLogger::closeSession(uint32_t session_id) {
    if (!s_session_prefs.begin("vg_session", false)) return false;
    s_session_prefs.putBool("is_open", false);
    s_session_prefs.end();
    return true;
}
