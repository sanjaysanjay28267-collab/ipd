/**
 * ==============================================================================
 * VERIGRADE S3 — SIM800L GSM/GPRS SMS CLIENT IMPLEMENTATION
 * ==============================================================================
 * Hardware: SIM800L Module on UART2 (TX GPIO1, RX GPIO2)
 * CLAIM MAP: Patent Claims 4, 15
 * ==============================================================================
 */

#include "sim800l_sms.h"
#include <Arduino.h>
#include <HardwareSerial.h>
#include <stdio.h>
#include <string.h>

static HardwareSerial s_sim_serial(2); // UART2

SIM800LSMS::SIM800LSMS()
    : queue_head_(0),
      queue_tail_(0),
      network_registered_(false),
      signal_csq_(0),
      last_network_check_ms_(0) {
    memset(sms_buffer_, 0, sizeof(sms_buffer_));
}

bool SIM800LSMS::init(uint32_t baud_rate) {
    s_sim_serial.begin(baud_rate, SERIAL_8N1, PIN_SIM_RX, PIN_SIM_TX);
    delay(500);

    // Initial handshake
    sendATCommand("AT", "OK", 1000);
    sendATCommand("ATE0", "OK", 1000); // Echo off
    sendATCommand("AT+CMGF=1", "OK", 1000); // SMS Text Mode
    sendATCommand("AT+CNMI=0,0,0,0,0", "OK", 1000); // Disable spontaneous SMS notifications

    checkNetworkRegistration();
    return true;
}

bool SIM800LSMS::sendATCommand(const char* cmd, const char* expected_reply, uint32_t timeout_ms) {
    while (s_sim_serial.available()) s_sim_serial.read(); // Clear input buffer

    s_sim_serial.println(cmd);
    uint32_t start = millis();
    char reply_buf[128];
    uint8_t idx = 0;

    while (millis() - start < timeout_ms) {
        while (s_sim_serial.available()) {
            char c = s_sim_serial.read();
            if (idx < sizeof(reply_buf) - 1) {
                reply_buf[idx++] = c;
                reply_buf[idx] = '\0';
                if (strstr(reply_buf, expected_reply) != nullptr) {
                    return true;
                }
            }
        }
        delay(5);
    }
    return false;
}

bool SIM800LSMS::checkNetworkRegistration() {
    while (s_sim_serial.available()) s_sim_serial.read();
    s_sim_serial.println("AT+CREG?");
    uint32_t start = millis();
    char reply_buf[64];
    uint8_t idx = 0;

    while (millis() - start < 1500) {
        while (s_sim_serial.available()) {
            char c = s_sim_serial.read();
            if (idx < sizeof(reply_buf) - 1) {
                reply_buf[idx++] = c;
                reply_buf[idx] = '\0';
            }
        }
    }

    // Look for +CREG: 0,1 (Home network) or +CREG: 0,5 (Roaming)
    if (strstr(reply_buf, ",1") != nullptr || strstr(reply_buf, ",5") != nullptr) {
        network_registered_ = true;
    } else {
        network_registered_ = false;
    }

    return network_registered_;
}

bool SIM800LSMS::queueSMS(const char* phone_number, const char* message) {
    uint8_t next_head = (queue_head_ + 1) % 8;
    if (next_head == queue_tail_ && sms_buffer_[queue_tail_].active) {
        // Buffer full, drop oldest
        queue_tail_ = (queue_tail_ + 1) % 8;
    }

    QueuedSMS& item = sms_buffer_[queue_head_];
    strncpy(item.recipient_phone, phone_number, sizeof(item.recipient_phone) - 1);
    strncpy(item.message_text, message, sizeof(item.message_text) - 1);
    item.retry_count = 0;
    item.active = true;

    queue_head_ = next_head;
    return true;
}

void SIM800LSMS::processQueue() {
    uint32_t now = millis();
    if (now - last_network_check_ms_ > 30000) {
        checkNetworkRegistration();
        last_network_check_ms_ = now;
    }

    if (!network_registered_) return;
    if (queue_head_ == queue_tail_ && !sms_buffer_[queue_tail_].active) return;

    QueuedSMS& item = sms_buffer_[queue_tail_];
    if (!item.active) {
        queue_tail_ = (queue_tail_ + 1) % 8;
        return;
    }

    // Execute SMS send
    char cmd[32];
    snprintf(cmd, sizeof(cmd), "AT+CMGS=\"%s\"", item.recipient_phone);
    s_sim_serial.println(cmd);

    // Wait for '>' prompt
    uint32_t wait_prompt = millis();
    bool got_prompt = false;
    while (millis() - wait_prompt < 2000) {
        if (s_sim_serial.available() && s_sim_serial.read() == '>') {
            got_prompt = true;
            break;
        }
        delay(10);
    }

    if (got_prompt) {
        s_sim_serial.print(item.message_text);
        s_sim_serial.write(0x1A); // Ctrl+Z to send

        // Wait for OK
        if (sendATCommand("", "OK", 5000)) {
            item.active = false;
            queue_tail_ = (queue_tail_ + 1) % 8;
            return;
        }
    }

    // Failed, increment retry
    item.retry_count++;
    if (item.retry_count >= 3) {
        // Give up on this SMS
        item.active = false;
        queue_tail_ = (queue_tail_ + 1) % 8;
    }
}

bool SIM800LSMS::sendEmergencyHazardAlert(const char* supervisor_phone, const char* hazard_type, float weight_g) {
    char alert_msg[160];
    snprintf(alert_msg, sizeof(alert_msg),
             "[VERIGRADE ALERT] Shredder Hazard Intercepted! Type: %s | Mass: %.0fg | Ejection Gate: FIRED. Inspection required.",
             hazard_type, weight_g);

    return queueSMS(supervisor_phone, alert_msg);
}
