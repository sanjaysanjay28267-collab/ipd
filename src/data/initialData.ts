/**
 * ==============================================================================
 * VERIGRADE S3 — INITIAL DATA & SIMULATION SEEDS (initialData.ts)
 * ==============================================================================
 */

import { Trader, PriceEntry, FlaggedItem, TruckloadAudit, GradedItem } from '../types';

export const INITIAL_TRADERS: Trader[] = [
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
    average_moisture: 7.2,
    avatar_seed: 'Ramesh'
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
    average_moisture: 8.1,
    avatar_seed: 'Priya'
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
    average_moisture: 13.5,
    avatar_seed: 'Suresh'
  },
  {
    id: 415,
    pin: '0000',
    name: 'Anil Verma (New Collector)',
    phone: '+91 91234 56780',
    tier: 'TIER_3_NEW',
    reputation_score: 490,
    cumulative_kg: 850,
    clean_streak_count: 6,
    total_transactions: 9,
    correction_count: 3,
    average_moisture: 14.8,
    avatar_seed: 'Anil'
  }
];

export const INITIAL_PRICES: PriceEntry[] = [
  { class_id: 'PET_BOTTLE', name: 'PET Bottles (Clear/Blue)', price_per_kg: 0.48, max_allowed_moisture: 8.0, unit: 'kg' },
  { class_id: 'HDPE_PLASTIC', name: 'HDPE Milk/Shampoo Jugs', price_per_kg: 0.58, max_allowed_moisture: 6.0, unit: 'kg' },
  { class_id: 'ALUMINUM_CAN', name: 'UBC Aluminum Beverage Cans', price_per_kg: 1.35, max_allowed_moisture: 5.0, unit: 'kg' },
  { class_id: 'FERROUS_STEEL', name: 'Clean Ferrous Scrap / Tins', price_per_kg: 0.26, max_allowed_moisture: 5.0, unit: 'kg' },
  { class_id: 'CARDBOARD_OCC', name: 'OCC Corrugated Cardboard', price_per_kg: 0.14, max_allowed_moisture: 12.0, unit: 'kg' },
  { class_id: 'MIXED_RIGID_PLASTIC', name: 'Mixed Rigid Plastics (PP/PS)', price_per_kg: 0.22, max_allowed_moisture: 10.0, unit: 'kg' }
];

export const INITIAL_FLAGGED_ITEMS: FlaggedItem[] = [
  {
    id: 1045,
    timestamp: '14:28:12',
    image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=400&auto=format&fit=crop&q=80',
    ai_prediction: {
      class_name: 'PET_BOTTLE',
      confidence: 0.82
    },
    sensors: {
      weight_grams: 164.0,
      moisture_percent: 4.2,
      profile_height_mm: 185,
      inductive_metal: true,
      optical_sharpness: 0.88
    },
    fusion_score: 0.44,
    conflict_reason: 'Conflict: AI predicted Plastic (82.0%) but Inductive Proximity detected Metal',
    resolved: false
  },
  {
    id: 1049,
    timestamp: '14:31:40',
    image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=400&auto=format&fit=crop&q=80',
    ai_prediction: {
      class_name: 'PET_BOTTLE',
      confidence: 0.74
    },
    sensors: {
      weight_grams: 485.0,
      moisture_percent: 18.4,
      profile_height_mm: 220,
      inductive_metal: false,
      optical_sharpness: 0.79
    },
    fusion_score: 0.52,
    conflict_reason: 'Anomaly: Measured Mass 485g exceeds normal PET envelope (<60g). Internal water/sand adulteration suspected.',
    resolved: false
  },
  {
    id: 1053,
    timestamp: '14:34:05',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80',
    ai_prediction: {
      class_name: 'CARDBOARD_OCC',
      confidence: 0.89
    },
    sensors: {
      weight_grams: 820.0,
      moisture_percent: 28.5,
      profile_height_mm: 45,
      inductive_metal: false,
      optical_sharpness: 0.85
    },
    fusion_score: 0.58,
    conflict_reason: 'Moisture Adulteration: 28.5% exceeds 12.0% contractual moisture cutoff.',
    resolved: false
  }
];

export const INITIAL_TRUCKLOAD_AUDIT: TruckloadAudit = {
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
};

export const RECENT_ITEMS_STREAM: GradedItem[] = [
  {
    id: 1060,
    timestamp: '14:38:21',
    device_id: 'VGR3-9842-X7',
    image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=400&auto=format&fit=crop&q=80',
    material_class: 'PET_BOTTLE',
    ai_confidence: 0.94,
    fusion_score: 0.93,
    dynamic_alpha: 0.76,
    sensors: {
      weight_grams: 32.5,
      moisture_percent: 4.8,
      profile_height_mm: 210,
      inductive_metal: false,
      optical_sharpness: 0.91
    },
    is_hazard: false,
    requires_human_review: false,
    diverted: false,
    decision_rule: 'AMCF_ACCEPTED_VERIFIED',
    payout_value: 0.016
  },
  {
    id: 1061,
    timestamp: '14:38:25',
    device_id: 'VGR3-9842-X7',
    image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80',
    material_class: 'ALUMINUM_CAN',
    ai_confidence: 0.96,
    fusion_score: 0.97,
    dynamic_alpha: 0.72,
    sensors: {
      weight_grams: 14.8,
      moisture_percent: 3.1,
      profile_height_mm: 125,
      inductive_metal: true,
      optical_sharpness: 0.94
    },
    is_hazard: false,
    requires_human_review: false,
    diverted: false,
    decision_rule: 'AMCF_ACCEPTED_VERIFIED',
    payout_value: 0.020
  },
  {
    id: 1062,
    timestamp: '14:38:29',
    device_id: 'VGR3-9842-X7',
    image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80',
    material_class: 'CARDBOARD_OCC',
    ai_confidence: 0.88,
    fusion_score: 0.86,
    dynamic_alpha: 0.70,
    sensors: {
      weight_grams: 120.0,
      moisture_percent: 7.5,
      profile_height_mm: 35,
      inductive_metal: false,
      optical_sharpness: 0.86
    },
    is_hazard: false,
    requires_human_review: false,
    diverted: false,
    decision_rule: 'AMCF_ACCEPTED_VERIFIED',
    payout_value: 0.017
  },
  {
    id: 1063,
    timestamp: '14:38:34',
    device_id: 'VGR3-9842-X7',
    image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
    material_class: 'HAZARD_BATTERY',
    ai_confidence: 0.91,
    fusion_score: 0.99,
    dynamic_alpha: 0.50,
    sensors: {
      weight_grams: 68.0,
      moisture_percent: 2.0,
      profile_height_mm: 22,
      inductive_metal: true,
      optical_sharpness: 0.89
    },
    is_hazard: true,
    requires_human_review: true,
    diverted: true,
    decision_rule: 'HAZARD_OVERRIDE_TRIGGERED',
    conflict_explanation: 'CRITICAL: Lithium Pouch Cell Detected. SG90 Diversion Gate Actuated to Fire-Safe Chute.',
    payout_value: 0.0
  }
];
