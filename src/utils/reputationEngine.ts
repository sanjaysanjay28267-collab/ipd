/**
 * ==============================================================================
 * VERIGRADE S3 — EXPLAINABLE REPUTATION & MICRO-CREDIT ENGINE (reputationEngine.ts)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 29, 30
 *
 * Mathematically bounded: 300 to 850 (equivalent to credit bureau ranges)
 * Weights:
 * - 35% Verified Cumulative Weight (Volume) [Up to 1,000 kg]
 * - 30% Historical Accuracy Rate (1 - Corrections / Total)
 * - 25% Consecutive Clean Hazard-Free Streak [Up to 50 deliveries]
 * - 10% Low Moisture Adulteration Ratio [Optimal < 5%, Penalized > 15%]
 * ==============================================================================
 */

import { Trader, ReputationBreakdown } from '../types';

export function calculateReputationScore(trader: Trader): ReputationBreakdown {
  const verifiedKg = trader.cumulative_kg;
  const totalTransactions = Math.max(1, trader.total_transactions);
  const corrections = trader.correction_count;
  const cleanStreak = trader.clean_streak_count;
  const avgMoisture = trader.average_moisture;

  // 1. Volume Factor (35% weight -> 550 * 0.35 = 192.5 max points)
  const volumeFactor = Math.min(1.0, verifiedKg / 1000.0);
  const volumePoints = volumeFactor * 192.5;

  // 2. Accuracy Factor (30% weight -> 550 * 0.30 = 165.0 max points)
  const correctionRate = corrections / totalTransactions;
  const accuracyFactor = Math.max(0.0, 1.0 - correctionRate);
  const accuracyPoints = accuracyFactor * 165.0;

  // 3. Clean Streak Factor (25% weight -> 550 * 0.25 = 137.5 max points)
  const streakFactor = Math.min(1.0, cleanStreak / 50.0);
  const cleanStreakPoints = streakFactor * 137.5;

  // 4. Moisture Factor (10% weight -> 550 * 0.10 = 55.0 max points)
  // Baseline acceptable moisture up to 15%
  const moistureFactor = Math.max(0.0, 1.0 - Math.min(1.0, avgMoisture / 15.0));
  const moisturePoints = moistureFactor * 55.0;

  const baseline = 300.0;
  const totalScore = Math.round(baseline + volumePoints + accuracyPoints + cleanStreakPoints + moisturePoints);
  const clampedScore = Math.max(300, Math.min(850, totalScore));

  let tier = 'TIER_3_NEW (Probationary)';
  let maxCreditLimit = 50; // $50 micro-advance

  if (clampedScore >= 750) {
    tier = 'TIER_1_PRIME (Instant Daily Settlement + $1,500 Revolving Line)';
    maxCreditLimit = 1500;
  } else if (clampedScore >= 650) {
    tier = 'TIER_2_VERIFIED (Standard Settlement + $500 Micro-Credit)';
    maxCreditLimit = 500;
  }

  const formula = 'R = 300 + 550 × [ 0.35·min(1, W/1000) + 0.30·(1 - N_corr/N_tot) + 0.25·min(1, Streak/50) + 0.10·(1 - min(1, Moist/15)) ]';

  return {
    score: clampedScore,
    tier,
    max_credit_limit: maxCreditLimit,
    formula,
    components: {
      volume_points: Math.round(volumePoints * 10) / 10,
      accuracy_points: Math.round(accuracyPoints * 10) / 10,
      clean_streak_points: Math.round(cleanStreakPoints * 10) / 10,
      moisture_points: Math.round(moisturePoints * 10) / 10,
      baseline
    },
    metrics: {
      verified_kg: verifiedKg,
      correction_rate_pct: Math.round(correctionRate * 1000) / 10,
      hazard_free_streak: cleanStreak,
      mean_moisture_pct: avgMoisture
    }
  };
}
