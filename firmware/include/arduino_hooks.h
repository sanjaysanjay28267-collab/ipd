/**
 * ==============================================================================
 * VERIGRADE S3 FIRMWARE — EXTENSIBLE ARDUINO HOOKS (arduino_hooks.h)
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual Core 240MHz, 8MB Flash)
 * CLAIM MAP: Patent Claims 1, 9, 10, 23, 29 (Event Hooks & Integration)
 *
 * Allows downstream developers to cleanly intercept:
 * - Real-time item classification and sensor telemetry (onItemGraded)
 * - User correction feedback from PWA/Dashboard (onCorrectionReceived)
 * - Dynamic commodity pricing updates from backend (onPriceTableUpdated)
 * - Hazard ejection events (onHazardDiverted)
 * ==============================================================================
 */

#ifndef ARDUINO_HOOKS_H
#define ARDUINO_HOOKS_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Sensor Raw Telemetry Vector passed to callbacks
typedef struct {
    uint32_t item_id;
    uint32_t timestamp_ms;
    float weight_grams;
    float moisture_percent;
    uint16_t profile_height_mm;
    bool inductive_metal_triggered;
    uint8_t ai_class_id;
    float ai_confidence;
    float fusion_score;
    uint8_t final_class_id;
    bool is_hazard;
    bool is_flagged_for_review;
    char reason[64];
} VeriGradeItemEvent_t;

// User Correction Struct
typedef struct {
    uint32_t item_id;
    uint8_t original_class_id;
    uint8_t corrected_class_id;
    char operator_notes[64];
    uint32_t timestamp_ms;
} VeriGradeCorrectionEvent_t;

// Price Table Item
typedef struct {
    uint8_t class_id;
    char material_name[24];
    float price_per_kg;
    float max_allowed_moisture;
} VeriGradePriceEntry_t;

// Function Pointer Callbacks
typedef void (*OnItemGradedCallback_t)(const VeriGradeItemEvent_t* event);
typedef void (*OnCorrectionReceivedCallback_t)(const VeriGradeCorrectionEvent_t* correction);
typedef void (*OnPriceTableUpdatedCallback_t)(const VeriGradePriceEntry_t* prices, uint8_t count);
typedef void (*OnHazardDivertedCallback_t)(uint32_t item_id, const char* hazard_type, float weight_g);

// Registration Functions
void vg_register_on_item_graded(OnItemGradedCallback_t cb);
void vg_register_on_correction_received(OnCorrectionReceivedCallback_t cb);
void vg_register_on_price_table_updated(OnPriceTableUpdatedCallback_t cb);
void vg_register_on_hazard_diverted(OnHazardDivertedCallback_t cb);

// Trigger Dispatchers (Invoked internally by FreeRTOS tasks)
void vg_dispatch_item_graded(const VeriGradeItemEvent_t* event);
void vg_dispatch_correction_received(const VeriGradeCorrectionEvent_t* correction);
void vg_dispatch_price_table_updated(const VeriGradePriceEntry_t* prices, uint8_t count);
void vg_dispatch_hazard_diverted(uint32_t item_id, const char* hazard_type, float weight_g);

#ifdef __cplusplus
}
#endif

#endif // ARDUINO_HOOKS_H
