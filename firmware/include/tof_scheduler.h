/**
 * ==============================================================================
 * VERIGRADE S3 — DYNAMIC TIME-OF-FLIGHT (ToF) EJECTION SCHEDULER HEADER
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual-Core 240MHz)
 * Actuators: SG90 Micro-Servos (GPIO12 Hazard Gate, GPIO13 Review Gate)
 * Sensor: TCRT5000 IR Reflective Tachometer (GPIO6)
 * Timing Engine: ESP32 64-bit Hardware Microsecond Timer (esp_timer)
 * CLAIM MAP: Patent Claims 12, 13, 16, 23, 33
 *
 * Formula:
 * t_wait = (d / v(t)) - t_servo
 * where:
 * - d: distance from inspection zone to ejection gate (default: 320 mm)
 * - v(t): instantaneous belt speed from IR tachometer pulses (mm/s)
 * - t_servo: mechanical actuation delay of SG90 flipper (default: 65 ms)
 * ==============================================================================
 */

#ifndef TOF_SCHEDULER_H
#define TOF_SCHEDULER_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_timer.h"

// Hardware Pin Mappings
#define PIN_IR_TACHOMETER     6   // TCRT5000 Pulse interrupt
#define PIN_SERVO_HAZARD     12   // SG90 Hazard Diverter (Active 90°, Pass 0°)
#define PIN_SERVO_REVIEW     13   // SG90 Review Diverter (Active 90°, Pass 0°)

// Geometric & Kinematic Constants
#define DEFAULT_DISTANCE_MM       320.0f  // Inspection zone to diverter
#define DEFAULT_SERVO_LATENCY_MS   65.0f  // Mechanical gate swing time
#define PULSES_PER_METER          120.0f  // Slotted wheel encoder resolution
#define MIN_SAFE_VELOCITY_MM_S     50.0f  // Below this, belt considered stalled
#define DEFAULT_BELT_VELOCITY_MM_S 250.0f

enum EjectionGateTarget {
    GATE_NONE = 0,
    GATE_HAZARD_FIRE_SAFE = 1,
    GATE_MANUAL_REVIEW_BIN = 2
};

struct EjectionJob {
    uint32_t item_id;
    EjectionGateTarget gate;
    int64_t scheduled_fire_time_us;
    uint32_t duration_ms;
    bool in_use;
};

class ToFScheduler {
public:
    ToFScheduler();
    bool init();

    // ISR handler invoked on every TCRT5000 edge (IR encoder)
    static void IRAM_ATTR onEncoderPulseISR();

    // Live instantaneous belt speed calculation
    float getInstantaneousVelocity(); // mm/s

    // Calculate dynamic time of flight delay: t_wait = (d / v) - t_servo
    float calculateWaitTimeMs();

    // Schedule an ejection job
    bool scheduleEjection(uint32_t item_id, EjectionGateTarget target_gate, uint32_t hold_time_ms = 400);

    // Direct servo position setting (LEDC PWM 50Hz)
    void setServoAngle(uint8_t pin, uint8_t angle_degrees);

    // Diagnostic stats
    uint32_t getTotalEjections() const { return total_ejections_; }

private:
    static void onTimerCallback(void* arg);
    void executeEjection(EjectionGateTarget gate);
    void resetGates();

    float distance_mm_;
    float servo_latency_ms_;
    uint32_t total_ejections_;
    esp_timer_handle_t timer_handle_;
};

#endif // TOF_SCHEDULER_H
