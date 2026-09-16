/**
 * ==============================================================================
 * VERIGRADE S3 — DYNAMIC TIME-OF-FLIGHT (ToF) EJECTION SCHEDULER IMPLEMENTATION
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual-Core 240MHz)
 * Actuators: SG90 Micro-Servos (GPIO12 Hazard Gate, GPIO13 Review Gate)
 * Sensor: TCRT5000 IR Reflective Tachometer (GPIO6)
 * Timing Engine: ESP32 64-bit Hardware Microsecond Timer (esp_timer)
 * CLAIM MAP: Patent Claims 12, 13, 16, 23, 33
 * ==============================================================================
 */

#include "tof_scheduler.h"
#include <Arduino.h>
#include "esp_timer.h"
#include "driver/ledc.h"

// Static interrupt tracking variables in IRAM
static volatile uint32_t s_pulse_count = 0;
static volatile int64_t s_last_pulse_us = 0;
static volatile int64_t s_pulse_interval_us = 40000; // ~25 pulses/sec default
static portMUX_TYPE s_encoder_mux = portMUX_INITIALIZER_UNLOCKED;

static ToFScheduler* s_instance = nullptr;

// Non-blocking hardware interrupt for IR encoder (Claim 27)
void IRAM_ATTR ToFScheduler::onEncoderPulseISR() {
    portENTER_CRITICAL_ISR(&s_encoder_mux);
    int64_t now = esp_timer_get_time();
    int64_t diff = now - s_last_pulse_us;
    if (diff > 1000) { // 1ms debounce
        s_pulse_interval_us = diff;
        s_last_pulse_us = now;
        s_pulse_count++;
    }
    portEXIT_CRITICAL_ISR(&s_encoder_mux);
}

ToFScheduler::ToFScheduler()
    : distance_mm_(DEFAULT_DISTANCE_MM),
      servo_latency_ms_(DEFAULT_SERVO_LATENCY_MS),
      total_ejections_(0),
      timer_handle_(nullptr) {
    s_instance = this;
}

bool ToFScheduler::init() {
    // 1. Configure IR Tachometer interrupt on GPIO6 (Claim 16, 27)
    pinMode(PIN_IR_TACHOMETER, INPUT_PULLUP);
    attachInterrupt(digitalPinToInterrupt(PIN_IR_TACHOMETER), onEncoderPulseISR, FALLING);

    // 2. Configure LEDC PWM for SG90 servos (50Hz, 14-bit resolution) (Claim 13)
    ledcSetup(0, 50, 14); // Channel 0: Hazard Gate (GPIO12)
    ledcAttachPin(PIN_SERVO_HAZARD, 0);

    ledcSetup(1, 50, 14); // Channel 1: Review Gate (GPIO13)
    ledcAttachPin(PIN_SERVO_REVIEW, 1);

    // Set both to neutral pass-through position (0 degrees)
    setServoAngle(PIN_SERVO_HAZARD, 0);
    setServoAngle(PIN_SERVO_REVIEW, 0);

    // 3. Create high-resolution hardware esp_timer (Claim 33)
    esp_timer_create_args_t timer_args = {
        .callback = &ToFScheduler::onTimerCallback,
        .arg = this,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "tof_eject_timer"
    };
    esp_timer_create(&timer_args, &timer_handle_);

    return true;
}

float ToFScheduler::getInstantaneousVelocity() {
    portENTER_CRITICAL(&s_encoder_mux);
    int64_t interval_us = s_pulse_interval_us;
    int64_t last_us = s_last_pulse_us;
    portEXIT_CRITICAL(&s_encoder_mux);

    int64_t elapsed_since_last = esp_timer_get_time() - last_us;
    if (elapsed_since_last > 400000) {
        // No pulse for 400ms: belt is stopped or stalled
        return 0.0f;
    }

    if (interval_us <= 0) return DEFAULT_BELT_VELOCITY_MM_S;

    // Convert pulse interval to linear speed
    // 1 meter = PULSES_PER_METER (120) pulses -> 1 pulse = 1000mm / 120 = 8.333 mm
    float mm_per_pulse = 1000.0f / PULSES_PER_METER;
    float seconds = (float)interval_us / 1000000.0f;
    float velocity_mm_s = mm_per_pulse / seconds;

    if (velocity_mm_s < MIN_SAFE_VELOCITY_MM_S) velocity_mm_s = MIN_SAFE_VELOCITY_MM_S;
    if (velocity_mm_s > 800.0f) velocity_mm_s = 800.0f;

    return velocity_mm_s;
}

float ToFScheduler::calculateWaitTimeMs() {
    float v = getInstantaneousVelocity();
    if (v <= 0.0f) v = DEFAULT_BELT_VELOCITY_MM_S;

    // Patent Claim 23, 33: t_wait = (d / v) - t_servo
    float travel_time_ms = (distance_mm_ / v) * 1000.0f;
    float wait_time_ms = travel_time_ms - servo_latency_ms_;

    if (wait_time_ms < 10.0f) wait_time_ms = 10.0f; // Lower safety bound
    return wait_time_ms;
}

void ToFScheduler::setServoAngle(uint8_t pin, uint8_t angle_degrees) {
    // SG90: 50Hz (20ms period). 0.5ms = 0°, 2.5ms = 180°
    // 14-bit resolution: 2^14 = 16384 ticks for 20ms
    // 0.5ms = 410 ticks, 2.5ms = 2048 ticks
    uint32_t duty = 410 + (uint32_t)(((float)angle_degrees / 180.0f) * (2048 - 410));
    uint8_t channel = (pin == PIN_SERVO_HAZARD) ? 0 : 1;
    ledcWrite(channel, duty);
}

void ToFScheduler::executeEjection(EjectionGateTarget gate) {
    if (gate == GATE_HAZARD_FIRE_SAFE) {
        // Swing hazard flipper 90° into belt path (Claim 13)
        setServoAngle(PIN_SERVO_HAZARD, 90);
    } else if (gate == GATE_MANUAL_REVIEW_BIN) {
        // Swing review flipper 90° into secondary spur chute
        setServoAngle(PIN_SERVO_REVIEW, 90);
    }
    total_ejections_++;
}

void ToFScheduler::resetGates() {
    setServoAngle(PIN_SERVO_HAZARD, 0);
    setServoAngle(PIN_SERVO_REVIEW, 0);
}

// Scheduled timer callback fired in microsecond precision
void ToFScheduler::onTimerCallback(void* arg) {
    ToFScheduler* scheduler = static_cast<ToFScheduler*>(arg);
    if (!scheduler) return;

    // Reset flippers back to pass-through 0 degrees after item deflection
    scheduler->resetGates();
}

bool ToFScheduler::scheduleEjection(uint32_t item_id, EjectionGateTarget target_gate, uint32_t hold_time_ms) {
    if (target_gate == GATE_NONE) return true;

    float wait_ms = calculateWaitTimeMs();
    int64_t wait_us = (int64_t)(wait_ms * 1000.0f);

    // Instantly deflect if item is already within arrival window
    executeEjection(target_gate);

    // Schedule reset via hardware timer
    int64_t reset_us = (int64_t)(hold_time_ms * 1000.0f);
    esp_timer_stop(timer_handle_);
    esp_timer_start_once(timer_handle_, reset_us);

    return true;
}
