/**
 * ==============================================================================
 * VERIGRADE S3 — ATOMIC SD CARD LOGGER & NVS RECOVERY HEADER (sd_logger.h)
 * ==============================================================================
 * Hardware: MicroSD Card via SPI (CS GPIO11, MOSI, MISO, SCK) + NVS
 * CLAIM MAP: Patent Claims 1, 6, 15 (Atomic Evidence Persistence)
 * ==============================================================================
 */

#ifndef SD_LOGGER_H
#define SD_LOGGER_H

#include <stdint.h>
#include <stdbool.h>
#include "amcf_engine.h"

#define PIN_SD_CS 11

struct SessionState {
    uint32_t session_id;
    uint32_t trader_id;
    uint32_t item_count;
    float gross_weight_kg;
    float total_payout_amount;
    bool session_open;
};

class SDLogger {
public:
    SDLogger();
    bool init();

    // Log full item classification event atomically to append-only CSV
    bool logItemEvent(const SensorTelemetryVector& raw, const AMCFDecision& decision);

    // Session recovery in case of abrupt scrap-yard power disconnection
    bool restoreSessionFromNVS(SessionState& session);
    bool saveSessionToNVS(const SessionState& session);
    bool closeSession(uint32_t session_id);

    // CSV Rotation
    void checkAndRotateLogs();

    bool isSDReady() const { return sd_initialized_; }

private:
    bool sd_initialized_;
    char current_log_filename_[32];
    uint32_t records_in_current_file_;
};

#endif // SD_LOGGER_H
