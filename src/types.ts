/**
 * ==============================================================================
 * VERIGRADE S3 — SHARED TYPES AND INTERFACES (types.ts)
 * ==============================================================================
 * Product: VeriGrade S3 — The Waste Truth Infrastructure
 * CLAIM MAP: Patent Claims 1, 3, 4, 12, 23, 29
 * ==============================================================================
 */

export type MaterialCategory = 
  | 'PET_BOTTLE'
  | 'HDPE_PLASTIC'
  | 'CARDBOARD_OCC'
  | 'ALUMINUM_CAN'
  | 'FERROUS_STEEL'
  | 'MIXED_RIGID_PLASTIC'
  | 'HAZARD_BATTERY'
  | 'HAZARD_CANISTER'
  | 'HAZARD_BILLET'
  | 'FLAGGED_REVIEW';

export interface SensorTelemetry {
  weight_grams: number;
  moisture_percent: number;
  profile_height_mm: number;
  inductive_metal: boolean;
  optical_sharpness: number;
}

export interface GradedItem {
  id: number;
  timestamp: string;
  device_id: string;
  image_url: string;
  material_class: MaterialCategory;
  ai_confidence: number;
  fusion_score: number;
  dynamic_alpha: number;
  sensors: SensorTelemetry;
  is_hazard: boolean;
  requires_human_review: boolean;
  diverted: boolean;
  decision_rule: string;
  conflict_explanation?: string;
  payout_value: number; // in USD or local currency
}

export interface Trader {
  id: number;
  pin: string;
  name: string;
  phone: string;
  tier: 'TIER_1_PRIME' | 'TIER_2_VERIFIED' | 'TIER_3_NEW';
  reputation_score: number; // 300 to 850
  cumulative_kg: number;
  clean_streak_count: number;
  total_transactions: number;
  correction_count: number;
  average_moisture: number;
  avatar_seed?: string;
}

export interface ReputationBreakdown {
  score: number;
  tier: string;
  max_credit_limit: number;
  formula: string;
  components: {
    volume_points: number;       // Max 192.5 pts (35% weight * 550 range)
    accuracy_points: number;     // Max 165 pts (30% weight)
    clean_streak_points: number; // Max 137.5 pts (25% weight)
    moisture_points: number;     // Max 55 pts (10% weight)
    baseline: number;            // 300 pts
  };
  metrics: {
    verified_kg: number;
    correction_rate_pct: number;
    hazard_free_streak: number;
    mean_moisture_pct: number;
  };
}

export interface PriceEntry {
  class_id: MaterialCategory;
  name: string;
  price_per_kg: number;
  max_allowed_moisture: number;
  unit: string;
}

export interface PayoutLineItem {
  name: string;
  category: MaterialCategory;
  gross_kg: number;
  moisture_penalty_kg: number;
  net_kg: number;
  rate_per_kg: number;
  line_total: number;
}

export interface PayoutTally {
  receipt_number: number;
  timestamp: string;
  trader: Trader;
  device_id: string;
  items: PayoutLineItem[];
  total_gross_kg: number;
  total_moisture_penalty_kg: number;
  total_net_kg: number;
  total_payout: number;
  reputation_score: number;
  hmac_signature: string;
}

export interface FlaggedItem {
  id: number;
  timestamp: string;
  image_url: string;
  ai_prediction: {
    class_name: MaterialCategory;
    confidence: number;
  };
  sensors: SensorTelemetry;
  fusion_score: number;
  conflict_reason: string;
  resolved: boolean;
  corrected_class?: MaterialCategory;
  operator_notes?: string;
}

export interface TruckloadAudit {
  truck_id: string;
  manifest_id: string;
  arrival_time: string;
  driver_name: string;
  gross_weight_metric_tons: number;
  tare_weight_metric_tons: number;
  net_weight_metric_tons: number;
  composition: {
    category: MaterialCategory;
    percentage: number;
    weight_kg: number;
  }[];
  contamination_rate_pct: number;
  hazards_intercepted_count: number;
  epr_compliance_status: 'COMPLIANT' | 'WARNING' | 'BREACH';
  epr_certificate_hash: string;
}

export interface DevicePairingState {
  is_paired: boolean;
  device_id: string;
  device_ip: string;
  firmware_version: string;
  battery_level_pct: number;
  belt_speed_mm_s: number;
  pro_mode_unlocked: boolean;
  last_ping_ms: number;
}
