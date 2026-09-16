/**
 * ==============================================================================
 * VERIGRADE S3 — BACKEND API SERVER & EVENT MIRROR (server.ts)
 * ==============================================================================
 * Product: VeriGrade S3 — The Waste Truth Infrastructure
 * Engine: Node.js + Express + Append-Only Datastore + SSE Live Stream
 * CLAIM MAP: Patent Claims 1, 3, 4, 9, 10, 12, 23, 29, 32
 * ==============================================================================
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Persistent Data Storage Paths
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory & File-backed Cache
interface InMemoryDb {
  events: any[];
  traders: any[];
  payouts: any[];
  corrections: any[];
  audit_reports: any[];
  prices: any[];
}

const DB_FILE = path.join(DATA_DIR, 'verigrade_db.json');

let db: InMemoryDb = {
  events: [],
  traders: [
    {
      id: 402,
      pin: '1234',
      name: 'Ramesh Kumar',
      phone: '+91 98765 43210',
      tier: 'TIER_1_PRIME',
      reputation_score: 782,
      cumulative_kg: 14280,
      clean_streak_count: 64,
      total_transactions: 112,
      correction_count: 4,
      average_moisture: 7.2
    },
    {
      id: 405,
      pin: '5678',
      name: 'Priya Sharma',
      phone: '+91 98112 33445',
      tier: 'TIER_1_PRIME',
      reputation_score: 745,
      cumulative_kg: 9850,
      clean_streak_count: 42,
      total_transactions: 78,
      correction_count: 5,
      average_moisture: 8.1
    },
    {
      id: 410,
      pin: '9012',
      name: 'Suresh Patel',
      phone: '+91 97234 56789',
      tier: 'TIER_2_VERIFIED',
      reputation_score: 638,
      cumulative_kg: 4200,
      clean_streak_count: 18,
      total_transactions: 34,
      correction_count: 6,
      average_moisture: 13.5
    }
  ],
  payouts: [],
  corrections: [],
  audit_reports: [
    {
      truck_id: 'TRK-KA-04-E-8812',
      manifest_id: 'MNF-2026-0916-004',
      arrival_time: '2026-09-16 11:45 AM',
      driver_name: 'Mohammed Aslam',
      gross_weight_metric_tons: 14.85,
      tare_weight_metric_tons: 6.20,
      net_weight_metric_tons: 8.65,
      composition: [
        { category: 'PET_BOTTLE', percentage: 38.4, weight_kg: 3321.6 },
        { category: 'HDPE_PLASTIC', percentage: 22.1, weight_kg: 1911.6 },
        { category: 'CARDBOARD_OCC', percentage: 21.5, weight_kg: 1859.7 },
        { category: 'ALUMINUM_CAN', percentage: 10.2, weight_kg: 882.3 },
        { category: 'FERROUS_STEEL', percentage: 5.8, weight_kg: 501.7 },
        { category: 'MIXED_RIGID_PLASTIC', percentage: 2.0, weight_kg: 173.0 }
      ],
      contamination_rate_pct: 1.8,
      hazards_intercepted_count: 2,
      epr_compliance_status: 'COMPLIANT',
      epr_certificate_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    }
  ],
  prices: [
    { class_id: 'PET_BOTTLE', name: 'PET Bottles (Clear/Blue)', price_per_kg: 0.48, max_allowed_moisture: 8.0, unit: 'kg' },
    { class_id: 'HDPE_PLASTIC', name: 'HDPE Milk/Shampoo Jugs', price_per_kg: 0.58, max_allowed_moisture: 6.0, unit: 'kg' },
    { class_id: 'ALUMINUM_CAN', name: 'UBC Aluminum Beverage Cans', price_per_kg: 1.35, max_allowed_moisture: 5.0, unit: 'kg' },
    { class_id: 'FERROUS_STEEL', name: 'Clean Ferrous Scrap / Tins', price_per_kg: 0.26, max_allowed_moisture: 5.0, unit: 'kg' },
    { class_id: 'CARDBOARD_OCC', name: 'OCC Corrugated Cardboard', price_per_kg: 0.14, max_allowed_moisture: 12.0, unit: 'kg' },
    { class_id: 'MIXED_RIGID_PLASTIC', name: 'Mixed Rigid Plastics (PP/PS)', price_per_kg: 0.22, max_allowed_moisture: 10.0, unit: 'kg' }
  ]
};

// Load saved data if available
if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    db = JSON.parse(raw);
  } catch (err) {
    console.error('[DB] Failed to parse existing db, using in-memory defaults:', err);
  }
}

function saveDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Save failed:', err);
  }
}

// SSE Clients List for Live Conveyor Feed
const sseClients: any[] = [];

function broadcastSSE(event: string, data: any) {
  sseClients.forEach(client => {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  });
}

// -----------------------------------------------------------------------------
// REST API ENDPOINTS (Module B1)
// -----------------------------------------------------------------------------

// 1. Ingest Item Classification from Firmware (Claim 1, 23)
app.post('/api/ingest', (req, res) => {
  const item = req.body;
  if (!item.item_id) {
    return res.status(400).json({ error: 'item_id required' });
  }

  const record = {
    ...item,
    received_at: new Date().toISOString()
  };

  db.events.unshift(record);
  if (db.events.length > 500) db.events.pop();
  saveDb();

  // Broadcast to live web dashboard
  broadcastSSE('ITEM_GRADED', record);

  res.json({ status: 'INGESTED', item_id: item.item_id });
});

// 2. Live Belt Telemetry SSE Channel
app.get('/api/belt/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', device: 'VGR3-9842-X7' })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.findIndex(c => c.id === clientId);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 3. Traders & Auth (PIN check for shared scrap-yard phones) (Claim 9)
app.get('/api/traders', (req, res) => {
  res.json(db.traders.map(t => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    tier: t.tier,
    reputation_score: t.reputation_score,
    cumulative_kg: t.cumulative_kg
  })));
});

app.post('/api/traders/login', (req, res) => {
  const { pin } = req.body;
  const trader = db.traders.find(t => t.pin === pin);
  if (!trader) {
    return res.status(401).json({ error: 'Invalid PIN' });
  }
  res.json({
    status: 'AUTHENTICATED',
    trader: {
      id: trader.id,
      name: trader.name,
      phone: trader.phone,
      tier: trader.tier,
      reputation_score: trader.reputation_score
    },
    token: `VGR3-SESSION-${trader.id}-${Date.now()}`
  });
});

app.get('/api/traders/:id/ledger', (req, res) => {
  const traderId = parseInt(req.params.id, 10);
  const trader = db.traders.find(t => t.id === traderId);
  if (!trader) return res.status(404).json({ error: 'Trader not found' });

  const payouts = db.payouts.filter(p => p.trader_id === traderId);
  res.json({
    trader,
    payout_history: payouts
  });
});

// 4. Reputation Engine API (Claim 29, 30)
app.get('/api/reputation/:id', (req, res) => {
  const traderId = parseInt(req.params.id, 10);
  const trader = db.traders.find(t => t.id === traderId);
  if (!trader) return res.status(404).json({ error: 'Trader not found' });

  // Explainable weighted formula breakdown
  const verifiedKg = trader.cumulative_kg;
  const totalTransactions = Math.max(1, trader.total_transactions);
  const corrections = trader.correction_count;
  const cleanStreak = trader.clean_streak_count;
  const avgMoisture = trader.average_moisture;

  const volumeFactor = Math.min(1.0, verifiedKg / 1000.0);
  const volumePoints = volumeFactor * 192.5;

  const correctionRate = corrections / totalTransactions;
  const accuracyFactor = Math.max(0.0, 1.0 - correctionRate);
  const accuracyPoints = accuracyFactor * 165.0;

  const streakFactor = Math.min(1.0, cleanStreak / 50.0);
  const cleanStreakPoints = streakFactor * 137.5;

  const moistureFactor = Math.max(0.0, 1.0 - Math.min(1.0, avgMoisture / 15.0));
  const moisturePoints = moistureFactor * 55.0;

  const baseline = 300.0;
  const totalScore = Math.round(baseline + volumePoints + accuracyPoints + cleanStreakPoints + moisturePoints);
  const clampedScore = Math.max(300, Math.min(850, totalScore));

  res.json({
    trader_id: trader.id,
    trader_name: trader.name,
    score: clampedScore,
    formula: 'R = 300 + 550 × [ 0.35·min(1, W/1000) + 0.30·(1 - N_corr/N_tot) + 0.25·min(1, Streak/50) + 0.10·(1 - min(1, Moist/15)) ]',
    breakdown: {
      volume_points: Math.round(volumePoints * 10) / 10,
      accuracy_points: Math.round(accuracyPoints * 10) / 10,
      clean_streak_points: Math.round(cleanStreakPoints * 10) / 10,
      moisture_points: Math.round(moisturePoints * 10) / 10,
      baseline: 300
    },
    metrics: {
      verified_kg: verifiedKg,
      correction_rate_pct: Math.round(correctionRate * 1000) / 10,
      clean_streak: cleanStreak,
      average_moisture_pct: avgMoisture
    },
    micro_credit: {
      eligible: clampedScore >= 650,
      approved_limit_usd: clampedScore >= 750 ? 1500 : clampedScore >= 650 ? 500 : 50,
      interest_subsidy_pct: clampedScore >= 750 ? 4.5 : 2.0
    }
  });
});

app.post('/api/reputation/sms', (req, res) => {
  const { trader_id, custom_message } = req.body;
  const trader = db.traders.find(t => t.id === trader_id);
  const message = custom_message || `VeriGrade S3: Score verified at ${trader?.reputation_score || 780}/850. Micro-credit line approved.`;

  console.log(`[SIM800L_DISPATCH] Sending SMS to ${trader?.phone || '+91-UNKNOWN'}: ${message}`);
  res.json({
    status: 'QUEUED_FOR_CELLULAR_DISPATCH',
    recipient: trader?.phone,
    message
  });
});

// 5. Payouts & Physical Receipt Print (Claim 1, 3)
app.get('/api/payouts', (req, res) => {
  res.json(db.payouts);
});

app.post('/api/payouts', (req, res) => {
  const payout = req.body;
  payout.id = Date.now();
  payout.created_at = new Date().toISOString();
  db.payouts.unshift(payout);
  saveDb();
  res.json({ status: 'RECORDED', payout });
});

app.post('/api/payouts/print', (req, res) => {
  const tally = req.body;
  console.log(`[THERMAL_PRINTER] ESC/POS 58mm printing receipt #${tally.receipt_number} for Trader ${tally.trader?.name}`);
  res.json({
    status: 'PRINT_JOB_DISPATCHED',
    receipt_number: tally.receipt_number,
    baud: 9600,
    port: 'UART1_GPIO17'
  });
});

// 6. Flagged Items & Closed-Loop Retraining Pool (Claim 23)
app.get('/api/corrections', (req, res) => {
  res.json(db.corrections);
});

app.post('/api/corrections', (req, res) => {
  const { item_id, original_class, corrected_class, notes } = req.body;
  const record = {
    id: Date.now(),
    item_id,
    original_class,
    corrected_class,
    notes,
    timestamp: new Date().toISOString()
  };

  db.corrections.unshift(record);
  saveDb();

  console.log(`[RETRAINING_POOL] Item #${item_id} re-labeled to ${corrected_class}. Pool size: ${db.corrections.length}`);
  res.json({ status: 'RETRAINING_POOL_UPDATED', record });
});

// 7. Dynamic Price Table API
app.get('/api/config/prices', (req, res) => {
  res.json(db.prices);
});

app.put('/api/config/prices', (req, res) => {
  const newPrices = req.body;
  if (Array.isArray(newPrices)) {
    db.prices = newPrices;
    saveDb();
    broadcastSSE('PRICES_UPDATED', newPrices);
    return res.json({ status: 'PRICES_UPDATED', count: newPrices.length });
  }
  res.status(400).json({ error: 'Expected array of prices' });
});

// 8. MRF Truckload Audit & EPR Compliance (Claim 1)
app.get('/api/audit/:truckId', (req, res) => {
  const truck = db.audit_reports.find(a => a.truck_id === req.params.truckId) || db.audit_reports[0];
  res.json(truck);
});

// 9. Hardware Status & Pairing
app.get('/api/firmware/status', (req, res) => {
  res.json({
    firmware_version: '1.0.4-esp32s3',
    device_id: 'VGR3-9842-X7',
    uptime_seconds: 38410,
    free_sram_bytes: 318490,
    flash_size_mb: 8,
    tasks: [
      { name: 'sensorTask', core: 0, state: 'RUNNING' },
      { name: 'aiTask', core: 1, state: 'RUNNING' },
      { name: 'motorTask', core: 1, state: 'RUNNING' },
      { name: 'commsTask', core: 0, state: 'BLOCKED' },
      { name: 'loggerTask', core: 0, state: 'BLOCKED' }
    ],
    belt_speed_mm_s: 248.5,
    pro_mode: true
  });
});

// -----------------------------------------------------------------------------
// Vite Middleware / Static Asset Serving
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VERIGRADE S3] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
