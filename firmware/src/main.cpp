/**
 * ==============================================================================
 * VERIGRADE S3 — FIRMWARE MAIN ENTRY POINT & FreeRTOS TASK DISPATCHER
 * ==============================================================================
 * Product: VeriGrade S3 — The Waste Truth Infrastructure
 * Architecture: ESP32-S3 (Xtensa Dual-Core 240MHz, 8MB Octal Flash, 512KB SRAM)
 * Framework: Arduino + FreeRTOS (Core 0: Comm/Logging/Sensors, Core 1: TinyML/Control)
 * CLAIM MAP: Patent Claims 1, 2, 7, 8, 11, 12, 13, 20, 22, 27
 *
 * HARDWARE PIN ALLOCATIONS:
 * - HC-SR04 Ultrasonic: Trig GPIO4 / Echo GPIO5 (2.2k/3.3k Divider)
 * - TCRT5000 IR Tachometer: GPIO6 (Edge-count Interrupt)
 * - LJ12A3 Inductive Metal: GPIO7 (NPN Open-Collector, Internal Pullup)
 * - Moisture ADC1_CH7: GPIO8 (Capacitive/Resistive)
 * - HX711 Load Cell: DT GPIO9 / SCK GPIO10
 * - MicroSD Card SPI: CS GPIO11 (MISO, MOSI, SCK on default HSPI)
 * - SG90 Micro-Servos: GPIO12 (Hazard Gate), GPIO13 (Review Gate)
 * - L298N Motor Driver: ENA PWM GPIO14 / IN1 GPIO15
 * - High-CRI LED Strobe: GPIO16 (Exposure Strobe Switch)
 * - Thermal Printer: UART1 TX GPIO17 / RX GPIO18 (58mm ESC/POS)
 * - I2C 0.96" OLED: SDA GPIO21 / SCL GPIO22
 * - SIM800L Cellular: UART2 TX GPIO1 / RX GPIO2
 * ==============================================================================
 */

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "HX711.h"

#include "amcf_engine.h"
#include "tof_scheduler.h"
#include "power_fsm.h"
#include "sd_logger.h"
#include "receipt_printer.h"
#include "sim800l_sms.h"
#include "arduino_hooks.h"

// Hardware Pin Definitions
#define PIN_US_TRIG       4
#define PIN_US_ECHO       5
#define PIN_IR_ENCODER    6
#define PIN_INDUCTIVE     7
#define PIN_MOISTURE_ADC  8
#define PIN_HX711_DT      9
#define PIN_HX711_SCK    10
#define PIN_SD_CS        11
#define PIN_SERVO_HAZ    12
#define PIN_SERVO_REV    13
#define PIN_MOTOR_ENA    14
#define PIN_MOTOR_IN1    15
#define PIN_STROBE_LED   16
#define PIN_PRINTER_TX   17
#define PIN_PRINTER_RX   18
#define PIN_OLED_SDA     21
#define PIN_OLED_SCL     22
#define PIN_SIM_TX        1
#define PIN_SIM_RX        2

// Calibration Constants
#define HX711_CALIBRATION_FACTOR -420.5f // Calibrated for 5kg cantilever load cell
#define US_SOUND_SPEED_MM_US      0.343f // Acoustic speed at 20°C

// FreeRTOS Inter-Task Communication Queues and Mutexes
static QueueHandle_t s_sensor_queue = nullptr;
static QueueHandle_t s_decision_queue = nullptr;
static SemaphoreHandle_t s_i2c_mutex = nullptr;

// Peripheral Objects
static HX711 s_scale;
static Adafruit_SSD1306 s_display(128, 64, &Wire, -1);
static AMCFEngine s_amcf;
static ToFScheduler s_tof;
static PowerFSM s_power_fsm;
static SDLogger s_sd;
static ReceiptPrinter s_printer;
static SIM800LSMS s_sim;

// Global Atomic Item Counter
static volatile uint32_t s_global_item_counter = 1000;

// Registered External C Hooks
static OnItemGradedCallback_t s_hook_item_graded = nullptr;
static OnCorrectionReceivedCallback_t s_hook_correction = nullptr;
static OnPriceTableUpdatedCallback_t s_hook_prices = nullptr;
static OnHazardDivertedCallback_t s_hook_hazard = nullptr;

void vg_register_on_item_graded(OnItemGradedCallback_t cb) { s_hook_item_graded = cb; }
void vg_register_on_correction_received(OnCorrectionReceivedCallback_t cb) { s_hook_correction = cb; }
void vg_register_on_price_table_updated(OnPriceTableUpdatedCallback_t cb) { s_hook_prices = cb; }
void vg_register_on_hazard_diverted(OnHazardDivertedCallback_t cb) { s_hook_hazard = cb; }

void vg_dispatch_item_graded(const VeriGradeItemEvent_t* event) {
    if (s_hook_item_graded) s_hook_item_graded(event);
}

// Ultrasonic Height Measurement (Divider Safe GPIO4/5)
static uint16_t measureProfileHeightMM() {
    digitalWrite(PIN_US_TRIG, LOW);
    delayMicroseconds(2);
    digitalWrite(PIN_US_TRIG, HIGH);
    delayMicroseconds(10);
    digitalWrite(PIN_US_TRIG, LOW);

    unsigned long duration = pulseIn(PIN_US_ECHO, HIGH, 25000); // 25ms timeout (~4m max)
    if (duration == 0) return 0;

    float distance_mm = (duration * US_SOUND_SPEED_MM_US) / 2.0f;
    const float BELT_BED_DISTANCE_MM = 350.0f; // Fixed mounting clearance
    if (distance_mm >= BELT_BED_DISTANCE_MM) return 0;

    return (uint16_t)(BELT_BED_DISTANCE_MM - distance_mm);
}

// Moisture ADC Oversampling (GPIO8)
static float measureMoisturePercent() {
    uint32_t sum = 0;
    const uint8_t SAMPLES = 16;
    for (uint8_t i = 0; i < SAMPLES; i++) {
        sum += analogRead(PIN_MOISTURE_ADC);
        delayMicroseconds(100);
    }
    float raw_avg = (float)sum / (float)SAMPLES;
    // Map 12-bit ADC (0 - 4095) to estimated moisture %
    // Dry air/plastic: < 400. Saturated paper/sludge: > 2800
    if (raw_avg < 400.0f) return 1.5f;
    float pct = ((raw_avg - 400.0f) / 2400.0f) * 65.0f;
    if (pct > 95.0f) pct = 95.0f;
    return pct;
}

// -----------------------------------------------------------------------------
// FreeRTOS Task 1: sensorTask (Pinned to Core 0)
// High-rate physical sensor polling (Load Cell, Ultrasonic, Metal, Moisture)
// -----------------------------------------------------------------------------
static void sensorTask(void* pvParameters) {
    TickType_t last_wake = xTaskGetTickCount();
    float stable_tare = 0.0f;

    while (1) {
        vTaskDelayUntil(&last_wake, pdMS_TO_TICKS(50)); // 20 Hz loop

        // 1. Check for physical item presence via ultrasonic or weight delta
        uint16_t profile_height = measureProfileHeightMM();
        float weight = 0.0f;
        if (s_scale.is_ready()) {
            weight = s_scale.get_units(1); // 1 sample for speed
            if (weight < 0.0f) weight = 0.0f;
        }

        bool inductive_active = (digitalRead(PIN_INDUCTIVE) == LOW); // Active-low NPN

        // Detect item entering optical inspection zone
        if (profile_height > 12 || weight > 10.0f || inductive_active) {
            SensorTelemetryVector telemetry;
            memset(&telemetry, 0, sizeof(SensorTelemetryVector));

            telemetry.item_id = s_global_item_counter++;
            telemetry.timestamp_ms = millis();
            telemetry.weight_grams = weight;
            telemetry.profile_height_mm = profile_height;
            telemetry.inductive_metal_active = inductive_active;
            telemetry.moisture_percent = measureMoisturePercent();
            telemetry.optical_sharpness = 0.88f; // Synchronized strobe illuminance

            // Mock edge inference or real MobileNet-V2 hook
            if (inductive_active) {
                telemetry.ai_predicted_class = (weight > 400.0f) ? VG_CLASS_FERROUS_STEEL : VG_CLASS_ALUMINUM_CAN;
                telemetry.ai_confidence = 0.92f;
            } else if (telemetry.moisture_percent > 25.0f && profile_height < 30) {
                telemetry.ai_predicted_class = VG_CLASS_CARDBOARD_OCC;
                telemetry.ai_confidence = 0.84f;
            } else {
                telemetry.ai_predicted_class = VG_CLASS_PET_BOTTLE;
                telemetry.ai_confidence = 0.89f;
            }

            // Post to AI inference / Fusion queue
            xQueueSend(s_sensor_queue, &telemetry, 0);

            // Debounce delay to let item pass inspection window
            vTaskDelay(pdMS_TO_TICKS(350));
        }
    }
}

// -----------------------------------------------------------------------------
// FreeRTOS Task 2: aiTask (Pinned to Core 1)
// AMCF Multi-Modal Fusion, Dynamic Alpha, & ToF Ejection Dispatch
// -----------------------------------------------------------------------------
static void aiTask(void* pvParameters) {
    SensorTelemetryVector telemetry;

    while (1) {
        if (xQueueReceive(s_sensor_queue, &telemetry, portMAX_DELAY) == pdTRUE) {
            // Trigger Camera Strobe LED synchronously (GPIO16)
            digitalWrite(PIN_STROBE_LED, HIGH);
            delayMicroseconds(1200); // 1.2ms high-intensity strobe pulse
            digitalWrite(PIN_STROBE_LED, LOW);

            // Execute AMCF Decision (Claim 23)
            AMCFDecision decision = s_amcf.evaluate(telemetry);

            // Schedule physical ejection if flagged or hazard (Claim 12, 13, 23)
            if (decision.is_hazard) {
                s_tof.scheduleEjection(telemetry.item_id, GATE_HAZARD_FIRE_SAFE, 600);
                s_sim.sendEmergencyHazardAlert("+919876543210", "LITHIUM_BATTERY_SHREDDER_GATE", telemetry.weight_grams);
                if (s_hook_hazard) s_hook_hazard(telemetry.item_id, "LITHIUM_BATTERY", telemetry.weight_grams);
            } else if (decision.divert_ejection_gate) {
                s_tof.scheduleEjection(telemetry.item_id, GATE_MANUAL_REVIEW_BIN, 450);
            }

            // Dispatch to registered C hooks
            VeriGradeItemEvent_t hook_event;
            hook_event.item_id = telemetry.item_id;
            hook_event.timestamp_ms = telemetry.timestamp_ms;
            hook_event.weight_grams = telemetry.weight_grams;
            hook_event.moisture_percent = telemetry.moisture_percent;
            hook_event.profile_height_mm = telemetry.profile_height_mm;
            hook_event.inductive_metal_triggered = telemetry.inductive_metal_active;
            hook_event.ai_class_id = telemetry.ai_predicted_class;
            hook_event.ai_confidence = telemetry.ai_confidence;
            hook_event.fusion_score = decision.composite_score;
            hook_event.final_class_id = decision.final_class;
            hook_event.is_hazard = decision.is_hazard;
            hook_event.is_flagged_for_review = decision.requires_human_review;
            strncpy(hook_event.reason, decision.decision_rule, sizeof(hook_event.reason));
            vg_dispatch_item_graded(&hook_event);

            // Send to logger task
            xQueueSend(s_decision_queue, &decision, 0);

            // Update local OLED display
            if (xSemaphoreTake(s_i2c_mutex, pdMS_TO_TICKS(50)) == pdTRUE) {
                s_display.clearDisplay();
                s_display.setTextSize(1);
                s_display.setTextColor(SSD1306_WHITE);
                s_display.setCursor(0, 0);
                s_display.printf("VERIGRADE S3 #%lu", telemetry.item_id);
                s_display.setCursor(0, 16);
                s_display.printf("CLASS: %u | SCORE: %.0f%%", decision.final_class, decision.composite_score * 100.0f);
                s_display.setCursor(0, 30);
                s_display.printf("MASS: %.0fg | M: %.1f%%", telemetry.weight_grams, telemetry.moisture_percent);
                s_display.setCursor(0, 46);
                if (decision.is_hazard) {
                    s_display.print("STATUS: ** HAZARD GATE **");
                } else if (decision.requires_human_review) {
                    s_display.print("STATUS: * REVIEW SPUR *");
                } else {
                    s_display.print("STATUS: VERIFIED OK");
                }
                s_display.display();
                xSemaphoreGive(s_i2c_mutex);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// FreeRTOS Task 3: loggerTask (Pinned to Core 0)
// Power-cut safe SD card logging
// -----------------------------------------------------------------------------
static void loggerTask(void* pvParameters) {
    AMCFDecision decision;
    while (1) {
        if (xQueueReceive(s_decision_queue, &decision, portMAX_DELAY) == pdTRUE) {
            SensorTelemetryVector dummy;
            memset(&dummy, 0, sizeof(dummy));
            dummy.item_id = s_global_item_counter;
            dummy.timestamp_ms = millis();
            s_sd.logItemEvent(dummy, decision);
        }
    }
}

// -----------------------------------------------------------------------------
// FreeRTOS Task 4: commsTask (Pinned to Core 0)
// SIM800L Cellular / MQTT network dispatch
// -----------------------------------------------------------------------------
static void commsTask(void* pvParameters) {
    while (1) {
        s_sim.processQueue();
        vTaskDelay(pdMS_TO_TICKS(1000));
    }
}

// -----------------------------------------------------------------------------
// FreeRTOS Task 5: motorTask (Pinned to Core 1)
// Power FSM & Conveyor Belt Speed Controller
// -----------------------------------------------------------------------------
static void motorTask(void* pvParameters) {
    while (1) {
        s_power_fsm.update(true, false, true);
        vTaskDelay(pdMS_TO_TICKS(500));
    }
}

void setup() {
    Serial.begin(115200);
    delay(200);
    Serial.println("\n[BOOT] VeriGrade S3 — The Waste Truth Infrastructure v1.0.4");

    // 1. GPIO Pin Configurations
    pinMode(PIN_US_TRIG, OUTPUT);
    pinMode(PIN_US_ECHO, INPUT);
    pinMode(PIN_INDUCTIVE, INPUT_PULLUP);
    pinMode(PIN_STROBE_LED, OUTPUT);
    digitalWrite(PIN_STROBE_LED, LOW);

    // 2. Peripheral Mutexes & Queues
    s_i2c_mutex = xSemaphoreCreateMutex();
    s_sensor_queue = xQueueCreate(8, sizeof(SensorTelemetryVector));
    s_decision_queue = xQueueCreate(8, sizeof(AMCFDecision));

    // 3. I2C OLED Display Initializer (Claim 11)
    Wire.begin(PIN_OLED_SDA, PIN_OLED_SCL);
    if (s_display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        s_display.clearDisplay();
        s_display.setTextSize(1);
        s_display.setTextColor(SSD1306_WHITE);
        s_display.setCursor(10, 20);
        s_display.println("VERIGRADE S3 BOOT");
        s_display.setCursor(10, 36);
        s_display.println("AMCF Engine Online");
        s_display.display();
    }

    // 4. Subsystem Initializers
    s_scale.begin(PIN_HX711_DT, PIN_HX711_SCK);
    s_scale.set_scale(HX711_CALIBRATION_FACTOR);
    s_scale.tare();

    s_amcf.init();
    s_tof.init();
    s_power_fsm.init();
    s_sd.init();
    s_printer.init(9600);
    s_sim.init(9600);

    // 5. Pin FreeRTOS tasks across Core 0 and Core 1 (Claim 2)
    xTaskCreatePinnedToCore(sensorTask, "sensorTask", 4096, NULL, 3, NULL, 0);
    xTaskCreatePinnedToCore(aiTask,     "aiTask",     8192, NULL, 4, NULL, 1);
    xTaskCreatePinnedToCore(motorTask,  "motorTask",  2048, NULL, 1, NULL, 1);
    xTaskCreatePinnedToCore(commsTask,  "commsTask",  4096, NULL, 2, NULL, 0);
    xTaskCreatePinnedToCore(loggerTask, "loggerTask", 4096, NULL, 2, NULL, 0);

    Serial.println("[BOOT] All FreeRTOS tasks pinned and running.");
}

void loop() {
    // Arduino loop remains idle; FreeRTOS scheduler handles all tasks
    vTaskDelay(pdMS_TO_TICKS(1000));
}
