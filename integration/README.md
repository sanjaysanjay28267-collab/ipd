# VERIGRADE S3 — INTEGRATION & DEPLOYMENT GUIDE
**The Waste Truth Infrastructure • "See it. Weigh it. Trust it."**

---

## 🚀 3-Step Quickstart Integration

### Step 1: Flash Firmware to ESP32-S3
Connect your ESP32-S3 DevKit via USB-C:
```bash
cd firmware
pio run --target upload
pio device monitor -b 115200
```
Verify the boot banner:
```
[BOOT] VeriGrade S3 — The Waste Truth Infrastructure v1.0.4
[BOOT] All FreeRTOS tasks pinned and running.
```

### Step 2: Boot the Offline-First Backend
The backend runs on Raspberry Pi, Ubuntu mini-PC, or cloud VPS:
```bash
npm install
npm run build
npm start
```
The server will bind to `http://0.0.0.0:3000` with the embedded MQTT broker on port 1883 and WebSocket live feed on `/ws/belt`.

### Step 3: Launch the PWA
Open `http://localhost:3000` on your mobile phone, tablet, or rugged touch monitor.  
Add to Home Screen (PWA standalone mode supported).  
Enter default Trader PIN `1234` or pair with hardware using device token `VGR3-DEV-9842-X7`.

---

## 🔌 Integrating into Existing Scrap Yard Software

### Using the JavaScript / TypeScript SDK (`integration_sdk.js`)
Include in your browser or Node.js project:
```javascript
const sdk = VeriGradeSDK.init('YOUR_DEVICE_TOKEN', {
  baseUrl: 'http://192.168.1.50:3000'
});

// 1. Listen for real-time items on conveyor
sdk.onItem((item) => {
  console.log(`[BELT] Item #${item.item_id}: ${item.class_name}, ${item.weight_grams}g, M: ${item.moisture_percent}%`);
});

// 2. Intercept items requiring human operator review
sdk.onFlagged((conflict) => {
  console.warn(`[REVIEW NEEDED] Item #${conflict.item_id}: ${conflict.conflict_explanation}`);
});

// 3. Submit correction to AI retraining pool
await sdk.submitCorrection(1042, 4 /* ALUMINUM_CAN */, 'Crushed can with plastic label');

// 4. Print physical 58mm receipt
await sdk.printReceipt(sessionTally);
```

### Direct C/C++ Firmware Callbacks (`arduino_hooks.h`)
In your custom Arduino / ESP-IDF project, simply include `arduino_hooks.h` and register listeners:
```c
#include "arduino_hooks.h"

void myCustomClassifier(const VeriGradeItemEvent_t* event) {
    if (event->is_hazard) {
        digitalWrite(ALARM_STROBE_PIN, HIGH);
    }
}

void setup() {
    vg_register_on_item_graded(myCustomClassifier);
}
```

---

## ☁️ "Bring Your Own Cloud" (Firebase / Firestore Swap)
While VeriGrade S3 ships with an ultra-lightweight, zero-config local SQLite engine for offline scrap-yard resilience, you can easily synchronize to Google Cloud Firestore:

1. In `/server.ts` or `src/services/db.ts`, initialize the Firebase Admin SDK:
   ```typescript
   import { initializeApp, cert } from 'firebase-admin/app';
   import { getFirestore } from 'firebase-admin/firestore';
   
   const db = getFirestore();
   ```
2. Mirror the append-only `events` stream into a Firestore collection:
   ```typescript
   export async function persistEventToCloud(itemEvent) {
     await db.collection('verigrade_events').doc(String(itemEvent.item_id)).set(itemEvent);
   }
   ```
3. The schema maps 1-to-1 with Firestore documents:
   - `/traders/{traderId}`
   - `/events/{itemId}`
   - `/payouts/{payoutId}`
   - `/reputation/{traderId}`
   - `/audit_truckloads/{truckId}`
