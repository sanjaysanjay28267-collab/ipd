/**
 * ==============================================================================
 * VERIGRADE S3 — REPUTATION SCORE & MICRO-CREDIT VIEW (ReputationView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 29, 30 (Reputation Scoring Engine & Micro-Credit)
 */

import React, { useState } from 'react';
import { 
  Award, 
  Send, 
  FileText, 
  CheckCircle, 
  TrendingUp, 
  ShieldCheck, 
  Smartphone, 
  Download, 
  Percent, 
  Scale, 
  Droplets,
  Sparkles
} from 'lucide-react';
import { Trader } from '../types';
import { calculateReputationScore } from '../utils/reputationEngine';

interface ReputationViewProps {
  trader: Trader;
  onSendSMS: (traderId: number) => void;
}

export const ReputationView: React.FC<ReputationViewProps> = ({
  trader,
  onSendSMS
}) => {
  const breakdown = calculateReputationScore(trader);
  const [smsSent, setSmsSent] = useState<boolean>(false);

  const scorePct = ((breakdown.score - 300) / 550) * 100;

  const handleTriggerSMS = () => {
    onSendSMS(trader.id);
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 4000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12" id="reputation-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121] font-heading flex items-center gap-2">
            <Award className="w-6 h-6 text-[#1B5E20]" />
            <span>Reputation Score & Micro-Credit Underwriting</span>
          </h1>
          <p className="text-xs text-gray-500">
            Objective scrap verification builds creditworthiness for informal recyclers (Patent Claim 29)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerSMS}
            className="px-4 py-2 rounded-xl bg-[#00695C] hover:bg-[#004D40] text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Smartphone className="w-4 h-4" />
            <span>{smsSent ? 'SMS Sent to Phone!' : 'Send SMS Receipt'}</span>
          </button>
        </div>
      </div>

      {/* Main Scorecard Banner */}
      <div className="vg-card p-6 border-2 border-[#1B5E20]/20 bg-gradient-to-br from-white via-[#FAFAF7] to-[#E8F5E9]/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Circular / Arch Score Gauge */}
          <div className="text-center md:text-left flex items-center gap-6">
            <div className="relative w-32 h-32 rounded-full border-8 border-gray-100 flex items-center justify-center bg-white shadow-inner">
              <div 
                className="absolute inset-0 rounded-full border-8 border-[#1B5E20] transition-all duration-1000"
                style={{
                  clipPath: `polygon(50% 50%, 0% 100%, 0% 0%, 100% 0%, 100% 100%)`,
                  opacity: 0.9
                }}
              />
              <div className="text-center z-10">
                <span className="text-3xl font-black text-[#1B5E20] font-heading block leading-none">
                  {breakdown.score}
                </span>
                <span className="text-[10px] font-bold text-gray-400 font-mono uppercase mt-0.5 block">
                  / 850 Points
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[#00695C] bg-[#E0F2F1] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {breakdown.tier}
              </span>
              <h2 className="text-xl font-bold text-[#212121] mt-2 font-heading">
                {trader.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Phone: {trader.phone} • {trader.total_transactions} verified belt deliveries
              </p>
            </div>
          </div>

          {/* Underwriting Credit Terms */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs max-w-sm w-full space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Revolving Micro-Credit Line:</span>
              <span className="font-bold text-emerald-800 text-sm font-mono">${breakdown.max_credit_limit}.00 USD</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Settlement Terms:</span>
              <span className="font-semibold text-gray-800">T+0 Same-Day Cash/UPI</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-medium">Underwriting Algorithm:</span>
              <span className="font-mono text-[11px] text-[#00695C]">Patent Claim 29/30</span>
            </div>
          </div>
        </div>

        {/* Linear Range Meter */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-[11px] font-bold text-gray-500 mb-1">
            <span>300 (Probationary)</span>
            <span className="text-amber-700">650 (Standard Credit)</span>
            <span className="text-emerald-700">750 (Tier-1 Prime)</span>
            <span>850 (Max)</span>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-amber-400" style={{ width: '63.6%' }} title="300-650" />
            <div className="h-full bg-teal-500" style={{ width: '18.2%' }} title="650-750" />
            <div className="h-full bg-emerald-600" style={{ width: '18.2%' }} title="750-850" />
          </div>
        </div>
      </div>

      {/* Explainable Formula & Exact Points Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Mathematical Components */}
        <div className="vg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider">
              Mathematical Score Breakdown
            </h3>
            <span className="text-[10px] font-mono text-gray-400">Baseline: 300 pts</span>
          </div>

          <p className="text-[11px] font-mono bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700 leading-relaxed">
            {breakdown.formula}
          </p>

          <div className="space-y-3 text-xs">
            {/* Component 1: Volume */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-[#1B5E20]" />
                  Cumulative Verified Mass (35% wt)
                </span>
                <span className="font-mono text-[#1B5E20] font-bold">
                  +{breakdown.components.volume_points} / 192.5 pts
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1B5E20]" 
                  style={{ width: `${(breakdown.components.volume_points / 192.5) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] text-gray-400">Volume: {breakdown.metrics.verified_kg} kg verified</span>
            </div>

            {/* Component 2: Accuracy */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#00695C]" />
                  Historical Sorting Accuracy (30% wt)
                </span>
                <span className="font-mono text-[#00695C] font-bold">
                  +{breakdown.components.accuracy_points} / 165.0 pts
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00695C]" 
                  style={{ width: `${(breakdown.components.accuracy_points / 165.0) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] text-gray-400">Correction rate: {breakdown.metrics.correction_rate_pct}%</span>
            </div>

            {/* Component 3: Clean Streak */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                  Hazard-Free Consecutive Streak (25% wt)
                </span>
                <span className="font-mono text-amber-700 font-bold">
                  +{breakdown.components.clean_streak_points} / 137.5 pts
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-600" 
                  style={{ width: `${(breakdown.components.clean_streak_points / 137.5) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] text-gray-400">Streak: {breakdown.metrics.hazard_free_streak} consecutive deliveries without battery</span>
            </div>

            {/* Component 4: Moisture */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-700" />
                  Moisture Adulteration Control (10% wt)
                </span>
                <span className="font-mono text-blue-700 font-bold">
                  +{breakdown.components.moisture_points} / 55.0 pts
                </span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600" 
                  style={{ width: `${(breakdown.components.moisture_points / 55.0) * 100}%` }} 
                />
              </div>
              <span className="text-[10px] text-gray-400">Mean moisture: {breakdown.metrics.mean_moisture_pct}% (threshold 15%)</span>
            </div>
          </div>
        </div>

        {/* Right: SMS Receipt & Certificate Proof Preview */}
        <div className="space-y-4">
          {/* SMS Notification Card */}
          <div className="vg-card p-5">
            <h3 className="text-sm font-bold text-[#212121] uppercase tracking-wider mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gray-600" />
              <span>SIM800L Cellular SMS Preview</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              Direct cellular push to feature phones in non-smartphone environments
            </p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-mono text-emerald-950 space-y-1">
              <div className="flex justify-between text-[10px] text-emerald-700 font-bold">
                <span>SMS FROM: VERIGRADE_S3</span>
                <span>TO: {trader.phone}</span>
              </div>
              <p className="pt-1">
                VeriGrade S3: Paid $46.36 for 141.7kg clean scrap. New Reputation Score: {breakdown.score}/850 (Tier-1 Micro-Credit). Receipt #68912
              </p>
            </div>
          </div>

          {/* Micro-Credit Certificate for Banks */}
          <div className="vg-card p-5 border border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#1B5E20]" />
                <h3 className="text-sm font-bold text-gray-900">
                  Bank Micro-Credit Certificate
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-400">HMAC-SHA256</span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Certified underwriting proof for micro-finance institutions & cooperatives.
            </p>
            <button
              onClick={() => alert(`Certificate downloaded: VGR3-CREDIT-${trader.id}-SCORE-${breakdown.score}.pdf`)}
              className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Signed Credit Certificate (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
