/**
 * ==============================================================================
 * VERIGRADE S3 — POWER MANAGEMENT FINITE STATE MACHINE HEADER (power_fsm.h)
 * ==============================================================================
 * Hardware: ESP32-S3 (Xtensa Dual-Core 240MHz, Ultra-Low Power Coprocessor)
 * CLAIM MAP: Patent Claims 7, 21, 31
 *
 * States:
 * 1. POWER_STATE_DEEP_SLEEP: 15uA quiescent draw, wake on timer or motion
 * 2. POWER_STATE_MONITOR: Low CPU clock 80MHz, HC-SR04 ultrasonic ping every 100ms
 * 3. POWER_STATE_ACTIVE: 240MHz, L298N belt motor ON, OV2640 camera & HX711 active
 * 4. POWER_STATE_UPLOAD: Belt parked, WiFi/SIM800L synchronization
 * ==============================================================================
 */

#ifndef POWER_FSM_H
#define POWER_FSM_H

#include <stdint.h>
#include <stdbool.h>

enum VeriGradePowerState {
    POWER_STATE_DEEP_SLEEP = 0,
    POWER_STATE_MONITOR = 1,
    POWER_STATE_ACTIVE = 2,
    POWER_STATE_UPLOAD = 3
};

class PowerFSM {
public:
    PowerFSM();
    void init();
    void update(bool item_detected, bool batch_pending, bool network_available);

    VeriGradePowerState getCurrentState() const { return current_state_; }
    void transitionTo(VeriGradePowerState new_state);

    // Motor driver control based on power state
    void setMotorRunning(bool run);
    bool isMotorRunning() const { return motor_running_; }

    // Sleep helpers
    void enterDeepSleep(uint32_t sleep_duration_sec);

private:
    VeriGradePowerState current_state_;
    uint32_t state_entered_time_ms_;
    uint32_t last_activity_time_ms_;
    bool motor_running_;
    uint8_t conveyor_speed_pwm_;
};

#endif // POWER_FSM_H
