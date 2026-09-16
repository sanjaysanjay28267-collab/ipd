/**
 * ==============================================================================
 * VERIGRADE S3 — SIM800L GSM/GPRS SMS CLIENT HEADER (sim800l_sms.h)
 * ==============================================================================
 * Hardware: SIM800L Module on UART2 (TX GPIO1, RX GPIO2)
 * CLAIM MAP: Patent Claims 4, 15 (Offline Scrap-Yard Cellular Dispatch)
 * ==============================================================================
 */

#ifndef SIM800L_SMS_H
#define SIM800L_SMS_H

#include <stdint.h>
#include <stdbool.h>

#define PIN_SIM_TX 1
#define PIN_SIM_RX 2

struct QueuedSMS {
    char recipient_phone[20];
    char message_text[160];
    uint8_t retry_count;
    bool active;
};

class SIM800LSMS {
public:
    SIM800LSMS();
    bool init(uint32_t baud_rate = 9600);

    // Queue an SMS to the offline ring buffer
    bool queueSMS(const char* phone_number, const char* message);

    // Process queued SMS in background FreeRTOS commsTask
    void processQueue();

    // High-priority synchronous dispatch for shredder hazard alarms
    bool sendEmergencyHazardAlert(const char* supervisor_phone, const char* hazard_type, float weight_g);

    bool isNetworkRegistered() const { return network_registered_; }
    uint8_t getSignalQuality() const { return signal_csq_; }

private:
    bool sendATCommand(const char* cmd, const char* expected_reply, uint32_t timeout_ms = 2000);
    bool checkNetworkRegistration();

    QueuedSMS sms_buffer_[8];
    uint8_t queue_head_;
    uint8_t queue_tail_;
    bool network_registered_;
    uint8_t signal_csq_;
    uint32_t last_network_check_ms_;
};

#endif // SIM800L_SMS_H
