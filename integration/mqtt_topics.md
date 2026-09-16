# VERIGRADE S3 — MQTT TOPIC SPECIFICATION & JSON SCHEMAS
**Protocol:** MQTT v3.1.1 / v5.0 over TLS (Port 8883) or WebSocket (Port 9001)  
**QoS Level:** QoS 1 for Transactions/Payouts, QoS 0 for High-Rate Belt Telemetry  
**CLAIM MAP:** Patent Claims 1, 9, 10, 12, 23, 29, 32

---

## 1. Topic Hierarchy Overview

| Topic Path | Direction | Frequency | Description |
| :--- | :--- | :--- | :--- |
| `vgr3/belt/item` | Device $\to$ Cloud/App | Event-driven (~2 Hz) | Raw sensor & AI vision telemetry per item |
| `vgr3/belt/speed` | Device $\to$ Cloud/App | Periodic (1 Hz) | Instantaneous conveyor linear speed & pulse count |
| `vgr3/grade/decision` | Device $\to$ Cloud/App | Event-driven | Final AMCF decision, dynamic $\alpha$, conflict rules |
| `vgr3/review/flagged` | Device $\to$ Cloud/App | Event-driven (irregular) | Items diverted to manual review spur for human verification |
| `vgr3/review/correct` | App $\to$ Device/Cloud | Operator action | Human correction override feeding retraining pool |
| `vgr3/payout/print` | App/Cloud $\to$ Device | Session end | Triggers 58mm ESC/POS physical thermal receipt print |
| `vgr3/reputation/sms` | App/Cloud $\to$ Device | Session end | Triggers SIM800L cellular SMS receipt dispatch |
| `vgr3/audit/report` | Device/App $\to$ Cloud | Shift / Truck complete | Truckload aggregate composition & EPR audit manifest |
| `vgr3/config/prices` | Cloud $\to$ Device/App | Dynamic config | Real-time commodity price per kg table update |

---

## 2. Topic Schemas & Payloads

### `vgr3/belt/item`
**Description:** Broadcasted by ESP32-S3 `aiTask` when an item passes through the optical inspection zone.
```json
{
  "item_id": 1042,
  "timestamp_ms": 1773658291000,
  "device_id": "VGR3-9842-X7",
  "sensors": {
    "weight_grams": 48.5,
    "moisture_percent": 6.2,
    "profile_height_mm": 215,
    "inductive_metal": false,
    "optical_sharpness": 0.91
  },
  "ai_inference": {
    "model_version": "v1.2.0-int8",
    "top_class_id": 1,
    "top_class_name": "PET_BOTTLE",
    "confidence": 0.895
  }
}
```

---

### `vgr3/belt/speed`
**Description:** Conveyor kinematics from TCRT5000 infrared tachometer.
```json
{
  "device_id": "VGR3-9842-X7",
  "instantaneous_velocity_mm_s": 248.6,
  "pulse_count": 14209,
  "motor_pwm": 180,
  "tof_wait_time_ms": 1221.8,
  "belt_status": "RUNNING"
}
```

---

### `vgr3/grade/decision`
**Description:** AMCF engine fusion outcome showing dynamic alpha and rule execution.
```json
{
  "item_id": 1042,
  "device_id": "VGR3-9842-X7",
  "final_class_id": 1,
  "final_class_name": "PET_BOTTLE",
  "composite_score": 0.887,
  "dynamic_alpha": 0.72,
  "is_hazard": false,
  "diverted": false,
  "requires_human_review": false,
  "decision_rule": "AMCF_ACCEPTED_VERIFIED",
  "conflict_explanation": ""
}
```

---

### `vgr3/review/flagged`
**Description:** Generated when conflict occurs (e.g., optical plastic vs. inductive metal) or confidence < 0.75.
```json
{
  "item_id": 1045,
  "timestamp": "2026-09-16T14:31:02Z",
  "device_id": "VGR3-9842-X7",
  "ai_prediction": { "class_id": 1, "name": "PET_BOTTLE", "confidence": 0.82 },
  "sensor_evidence": {
    "weight_grams": 164.0,
    "inductive_metal": true,
    "moisture_percent": 4.1
  },
  "fusion_score": 0.44,
  "conflict_reason": "Conflict: AI predicted Plastic (82.0%) but Inductive Proximity detected Metal",
  "image_url": "/api/snapshots/item_1045.jpg"
}
```

---

### `vgr3/review/correct`
**Description:** Sent by PWA when a human operator corrects a flagged item. Feeds closed-loop retraining pool.
```json
{
  "item_id": 1045,
  "operator_id": "OP-04",
  "original_class": "PET_BOTTLE",
  "corrected_class": "ALUMINUM_CAN",
  "notes": "Crushed soda can with dirty outer PET sleeve",
  "timestamp": "2026-09-16T14:32:15Z"
}
```

---

### `vgr3/payout/print`
**Description:** Command payload to print physical 58mm ESC/POS thermal receipt on UART1.
```json
{
  "receipt_number": 68912,
  "trader_id": 402,
  "trader_name": "Ramesh Kumar",
  "items": [
    { "name": "PET Plastic", "net_kg": 42.5, "rate": 0.45, "total": 19.12 },
    { "name": "Aluminum", "net_kg": 14.2, "rate": 1.20, "total": 17.04 },
    { "name": "OCC Cardboard", "net_kg": 85.0, "rate": 0.12, "total": 10.20 }
  ],
  "gross_weight_kg": 145.8,
  "moisture_penalty_kg": 4.1,
  "net_weight_kg": 141.7,
  "total_payout": 46.36,
  "reputation_score": 782,
  "hmac_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

---

### `vgr3/reputation/sms`
**Description:** Instructs SIM800L to transmit transaction SMS to unbanked trader.
```json
{
  "recipient_phone": "+919876543210",
  "trader_id": 402,
  "message": "VeriGrade S3: Paid $46.36 for 141.7kg clean scrap. New Reputation Score: 782/850 (Tier-1 Micro-Credit). Receipt #68912"
}
```
