/**
 * ==============================================================================
 * VERIGRADE S3 — ESC/POS 58MM THERMAL RECEIPT PRINTER IMPLEMENTATION
 * ==============================================================================
 * Hardware: 58mm Thermal Printer on UART1 (TX GPIO17, RX GPIO18)
 * CLAIM MAP: Patent Claims 1, 3
 * ==============================================================================
 */

#include "receipt_printer.h"
#include <Arduino.h>
#include <HardwareSerial.h>
#include <stdio.h>
#include <string.h>

static HardwareSerial s_printer_serial(1); // UART1

ReceiptPrinter::ReceiptPrinter() {}

bool ReceiptPrinter::init(uint32_t baud_rate) {
    s_printer_serial.begin(baud_rate, SERIAL_8N1, PIN_PRINTER_RX, PIN_PRINTER_TX);
    delay(100);

    // ESC @ (Initialize printer)
    const uint8_t init_cmd[] = { 0x1B, 0x40 };
    sendCommand(init_cmd, sizeof(init_cmd));
    return true;
}

void ReceiptPrinter::sendCommand(const uint8_t* cmd, size_t len) {
    s_printer_serial.write(cmd, len);
}

void ReceiptPrinter::printCenteredText(const char* text, bool bold, bool double_height) {
    // ESC a 1 (Center justification)
    uint8_t align_cmd[] = { 0x1B, 0x61, 0x01 };
    sendCommand(align_cmd, sizeof(align_cmd));

    // Bold control: ESC E n
    uint8_t bold_cmd[] = { 0x1B, 0x45, (uint8_t)(bold ? 0x01 : 0x00) };
    sendCommand(bold_cmd, sizeof(bold_cmd));

    // Size control: GS ! n
    uint8_t size_cmd[] = { 0x1D, 0x21, (uint8_t)(double_height ? 0x11 : 0x00) };
    sendCommand(size_cmd, sizeof(size_cmd));

    s_printer_serial.println(text);

    // Reset size & bold
    uint8_t reset_size[] = { 0x1D, 0x21, 0x00, 0x1B, 0x45, 0x00 };
    sendCommand(reset_size, sizeof(reset_size));
}

void ReceiptPrinter::printDivider(char ch) {
    // Left align
    uint8_t align_left[] = { 0x1B, 0x61, 0x00 };
    sendCommand(align_left, sizeof(align_left));

    char buf[33];
    for (int i = 0; i < 32; i++) buf[i] = ch;
    buf[32] = '\0';
    s_printer_serial.println(buf);
}

void ReceiptPrinter::printRow(const char* left, const char* right) {
    uint8_t align_left[] = { 0x1B, 0x61, 0x00 };
    sendCommand(align_left, sizeof(align_left));

    // 32 characters total width for 58mm paper (Font A)
    char row_buf[36];
    int left_len = strlen(left);
    int right_len = strlen(right);
    int spaces = 32 - left_len - right_len;
    if (spaces < 1) spaces = 1;

    char space_buf[34];
    for (int i = 0; i < spaces; i++) space_buf[i] = ' ';
    space_buf[spaces] = '\0';

    snprintf(row_buf, sizeof(row_buf), "%s%s%s", left, space_buf, right);
    s_printer_serial.println(row_buf);
}

void ReceiptPrinter::feedLines(uint8_t lines) {
    // ESC d n
    uint8_t feed_cmd[] = { 0x1B, 0x64, lines };
    sendCommand(feed_cmd, sizeof(feed_cmd));
}

void ReceiptPrinter::cutPaper() {
    // GS V 66 0 (Partial cut)
    uint8_t cut_cmd[] = { 0x1D, 0x56, 0x42, 0x00 };
    sendCommand(cut_cmd, sizeof(cut_cmd));
}

void ReceiptPrinter::printReceipt(const PayoutReceipt& receipt) {
    // 1. Branded Header (Claim 1, 3)
    printCenteredText("VERIGRADE S3", true, true);
    printCenteredText("The Waste Truth Infrastructure", false, false);
    printCenteredText("See it. Weigh it. Trust it.", false, false);
    printDivider('=');

    // 2. Metadata
    char num_buf[32];
    snprintf(num_buf, sizeof(num_buf), "RCT #%06lu", receipt.receipt_number);
    printRow(num_buf, receipt.device_id);

    char trader_buf[32];
    snprintf(trader_buf, sizeof(trader_buf), "TRADER: %s", receipt.trader_name);
    char id_buf[16];
    snprintf(id_buf, sizeof(id_buf), "ID: %lu", receipt.trader_id);
    printRow(trader_buf, id_buf);

    printDivider('-');

    // 3. Header Row
    printRow("ITEM / NET KG", "RATE     TOTAL");
    printDivider('-');

    // 4. Line Items
    for (uint8_t i = 0; i < receipt.item_count; i++) {
        const ReceiptLineItem& item = receipt.items[i];
        char left_col[24];
        snprintf(left_col, sizeof(left_col), "%s (%.1fkg)", item.material_name, item.net_weight_kg);

        char right_col[24];
        snprintf(right_col, sizeof(right_col), "$%.2f  $%.2f", item.rate_per_kg, item.line_total);

        printRow(left_col, right_col);

        if (item.moisture_deduction_kg > 0.05f) {
            char moist_note[32];
            snprintf(moist_note, sizeof(moist_note), "  (Moist tare: -%.1f kg)", item.moisture_deduction_kg);
            s_printer_serial.println(moist_note);
        }
    }

    printDivider('=');

    // 5. Totals
    char gross_buf[24];
    snprintf(gross_buf, sizeof(gross_buf), "%.2f kg", receipt.total_gross_kg);
    printRow("GROSS WEIGHT:", gross_buf);

    if (receipt.total_moisture_penalty_kg > 0.05f) {
        char penalty_buf[24];
        snprintf(penalty_buf, sizeof(penalty_buf), "-%.2f kg", receipt.total_moisture_penalty_kg);
        printRow("MOISTURE TARE DEDUCTION:", penalty_buf);
    }

    char net_buf[24];
    snprintf(net_buf, sizeof(net_buf), "%.2f kg", receipt.total_net_kg);
    printRow("VERIFIED NET WEIGHT:", net_buf);

    printDivider('-');

    char payout_buf[24];
    snprintf(payout_buf, sizeof(payout_buf), "$%.2f", receipt.total_payout_amount);
    printCenteredText("TOTAL PAYOUT", true, false);
    printCenteredText(payout_buf, true, true);

    printDivider('-');

    // 6. Reputation & Microcredit Score (Claim 29)
    char rep_buf[32];
    snprintf(rep_buf, sizeof(rep_buf), "REPUTATION SCORE: %u / 850", receipt.trader_reputation_score);
    printCenteredText(rep_buf, true, false);
    printCenteredText("Eligible for Tier-1 Micro-Credit", false, false);

    printDivider('-');

    // 7. Cryptographic Proof & QR
    printCenteredText("VERIFICATION HMAC:", false, false);
    char hmac_display[36];
    snprintf(hmac_display, sizeof(hmac_display), "%.16s...", receipt.hmac_signature);
    printCenteredText(hmac_display, false, false);

    feedLines(3);
    printCenteredText("SIGNATURE / THUMBPRINT", false, false);
    feedLines(2);
    printDivider('_');
    feedLines(3);
    cutPaper();
}
