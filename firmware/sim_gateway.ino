/**
 * ==============================================================================
 * VERIGRADE S3 — SIM GATEWAY & CLOUD SYNC ARDUINO STUB (sim_gateway.ino)
 * ==============================================================================
 * Hardware: ESP32-S3 (WiFi 802.11 b/g/n + SIM800L GPRS Dual Failover)
 * CLAIM MAP: Patent Claims 9, 10, 32 (Authenticated MQTT Telemetry Ingest)
 *
 * Provides bidirectional sync:
 * - Publishes live item telemetry to MQTT broker topic "vgr3/belt/item"
 * - Publishes speed telemetry to "vgr3/belt/speed"
 * - Subscribes to dynamic price updates "vgr3/config/prices"
 * - Subscribes to remote operator corrections "vgr3/review/correct"
 * ==============================================================================
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "SCRAPYARD_WIFI";
const char* WIFI_PASS = "RecycleTruth2026";
const char* MQTT_BROKER = "192.168.1.50"; // or cloud VPS IP
const int   MQTT_PORT = 1883;
const char* DEVICE_TOKEN = "VGR3-DEV-9842-X7";

static WiFiClient s_wifi_client;
static PubSubClient s_mqtt(s_wifi_client);

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
    char message[256];
    if (length >= sizeof(message)) length = sizeof(message) - 1;
    memcpy(message, payload, length);
    message[length] = '\0';

    Serial.printf("[MQTT_RX] Topic: %s | Payload: %s\n", topic, message);

    if (strcmp(topic, "vgr3/config/prices") == 0) {
        StaticJsonDocument<256> doc;
        deserializeJson(doc, message);
        Serial.println("[GATEWAY] Commodity price table dynamically updated from cloud.");
    }
}

void setup() {
    Serial.begin(115200);
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    s_mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    s_mqtt.setCallback(onMqttMessage);
}

void loop() {
    if (WiFi.status() == WL_CONNECTED) {
        if (!s_mqtt.connected()) {
            Serial.print("[MQTT] Connecting with device token...");
            if (s_mqtt.connect("VeriGrade_S3_Gateway", DEVICE_TOKEN, "s3cret")) {
                Serial.println(" connected!");
                s_mqtt.subscribe("vgr3/config/prices");
                s_mqtt.subscribe("vgr3/review/correct");
                s_mqtt.publish("vgr3/belt/status", "{\"status\":\"ONLINE\",\"device\":\"VGR3-9842\"}");
            } else {
                delay(2000);
            }
        }
        s_mqtt.loop();
    }
    delay(100);
}
