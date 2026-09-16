/**
 * ==============================================================================
 * VERIGRADE S3 — ESC/POS 58MM THERMAL RECEIPT PRINTER HEADER (receipt_printer.h)
 * ==============================================================================
 * Hardware: 58mm Thermal Printer on UART1 (TX GPIO17, RX GPIO18, 9600/19200 baud)
 * CLAIM MAP: Patent Claims 1, 3 (Cryptographic Physical Receipt Settlement)
 * ==============================================================================
 */

#ifndef RECEIPT_PRINTER_H
#define RECEIPT_PRINTER_H

#include <stdint.h>
#include <stdbool.h>

#define PIN_PRINTER_TX 17
#define PIN_PRINTER_RX 18

struct ReceiptLineItem {
    char material_name[20];
    float weight_kg;
    float moisture_deduction_kg;
    float net_weight_kg;
    float rate_per_kg;
    float line_total;
};

struct PayoutReceipt {
    uint32_t receipt_number;
    uint32_t timestamp_sec;
    char trader_name[32];
    uint32_t trader_id;
    char device_id[16];
    ReceiptLineItem items[8];
    uint8_t item_count;
    float total_gross_kg;
    float total_moisture_penalty_kg;
    float total_net_kg;
    float total_payout_amount;
    uint16_t trader_reputation_score;
    char hmac_signature[33]; // Truncated HMAC-SHA256 hex
};

class ReceiptPrinter {
public:
    ReceiptPrinter();
    bool init(uint32_t baud_rate = 9600);

    // ESC/POS Command sequences
    void printReceipt(const PayoutReceipt& receipt);
    void feedLines(uint8_t lines);
    void cutPaper();

private:
    void sendCommand(const uint8_t* cmd, size_t len);
    void printCenteredText(const char* text, bool bold = false, bool double_height = false);
    void printDivider(char ch = '-');
    void printRow(const char* left, const char* right);
    void printQRCode(const char* data);
};

#endif // RECEIPT_PRINTER_H
