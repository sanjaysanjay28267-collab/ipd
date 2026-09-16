/**
 * ==============================================================================
 * VERIGRADE S3 — HOME DASHBOARD VIEW (HomeView.tsx)
 * ==============================================================================
 */

import React from 'react';
import { 
  Activity, 
  Scale, 
  ShieldAlert, 
  DollarSign, 
  Camera, 
  Receipt, 
  CheckSquare, 
  Award, 
  FileSpreadsheet, 
  ArrowUpRight, 
  Sparkles,
  Cpu,
  Layers,
  FileCode
} from 'lucide-react';
import { Trader, DevicePairingState } from '../types';

interface HomeViewProps {
  onNavigate: (view: string) => void;
  activeTrader: Trader | null;
  pairingState: DevicePairingState;
  onTogglePairing: () => void;
  flaggedCount: number;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  activeTrader,
  pairingState,
  onTogglePairing,
  flaggedCount
}) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" id="home-view">
      {/* Welcome & Live Status Header Banner */}
      <div className="bg-gradient-to-br from-[#1B5E20] via-[#00695C] to-[#0D3311] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none">
          <Layers className="w-80 h-80 transform translate-x-16 -translate-y-6" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white tracking-wide uppercase">
                {pairingState.is_paired ? 'Hardware Synchronized' : 'Standalone Mode'}
              </span>
              {pairingState.pro_mode_unlocked && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-400 text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> PRO MODE ACTIVE
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading">
              {activeTrader ? `Welcome, ${activeTrader.name}` : 'VeriGrade S3 Conveyor Terminal'}
            </h1>
            <p className="text-white/80 text-sm mt-1 max-w-xl">
              Objective multi-modal scrap sorting, sub-second shredder hazard diversion, and verifiable micro-credit reputation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => onNavigate('live')}
              id="btn-quick-live-belt"
              className="px-4 py-2.5 rounded-xl bg-white text-[#1B5E20] font-semibold text-sm hover:bg-gray-100 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Activity className="w-4 h-4 text-[#1B5E20]" />
              <span>Open Live Belt</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('scan')}
              id="btn-quick-ar-scan"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 backdrop-blur-xs border border-white/20"
            >
              <Camera className="w-4 h-4" />
              <span>AR Optical Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Yard Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="stats-grid">
        <div className="vg-card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified Mass</span>
            <div className="p-2 rounded-xl bg-[#E8F5E9] text-[#1B5E20]">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#212121] font-heading">
            {activeTrader ? (activeTrader.cumulative_kg / 1000).toFixed(2) : '3.84'} <span className="text-sm font-normal text-gray-500">tons</span>
          </p>
          <p className="text-[11px] text-[#00695C] font-medium mt-1">
            Zero moisture tare deducted
          </p>
        </div>

        <div className="vg-card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Payouts</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#212121] font-heading">
            $1,428<span className="text-sm font-normal text-gray-500">.50</span>
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            28 batches settled with thermal receipts
          </p>
        </div>

        <div className="vg-card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Shredder Hazards</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-600 font-heading">
            4 <span className="text-xs font-semibold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DIVERTED</span>
          </p>
          <p className="text-[11px] text-gray-500 font-medium mt-1">
            2 Li-ion batteries + 2 pressure canisters
          </p>
        </div>

        <div className="vg-card p-4">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reputation Score</span>
            <div className="p-2 rounded-xl bg-[#E0F2F1] text-[#00695C]">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#00695C] font-heading">
            {activeTrader ? activeTrader.reputation_score : 782} <span className="text-xs text-gray-400">/ 850</span>
          </p>
          <p className="text-[11px] text-[#1B5E20] font-semibold mt-1">
            ★ Tier-1 Micro-Credit Approved
          </p>
        </div>
      </div>

      {/* Hardware Telemetry Strip */}
      <div className="bg-white rounded-xl p-4 border border-[#E0E0DC] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${pairingState.is_paired ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span className="font-semibold text-gray-700">ESP32-S3 Firmware v1.0.4:</span>
          <span className="font-mono text-gray-600">Belt: 248.5 mm/s (120 pulses/m)</span>
          <span className="hidden sm:inline text-gray-300">|</span>
          <span className="hidden sm:inline font-mono text-gray-600">HX711: Zeroed (0.0g)</span>
          <span className="hidden md:inline text-gray-300">|</span>
          <span className="hidden md:inline font-mono text-gray-600">SG90 Gates: Armed & Ready</span>
        </div>
        <button
          onClick={onTogglePairing}
          className="text-xs font-semibold text-[#1B5E20] hover:text-[#0D3311] underline cursor-pointer"
        >
          {pairingState.is_paired ? 'Simulate Reconnect / Reset' : 'Connect ESP32-S3 Device'}
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-bold text-[#212121] mb-3 font-heading flex items-center justify-between">
          <span>System Operation Modules</span>
          <span className="text-xs font-normal text-gray-500">Choose a functional view</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Action 1: Live Belt */}
          <div 
            onClick={() => onNavigate('live')}
            className="vg-card p-5 cursor-pointer hover:border-[#1B5E20] hover:shadow-md transition-all group"
            id="card-action-live"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#1B5E20] group-hover:scale-110 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-[#1B5E20] transition-colors">
              Conveyor Live Feed & Ejection
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Real-time stream of incoming scrap items, multi-modal sensor fusion values, and SG90 hazard flipper states.
            </p>
          </div>

          {/* Action 2: AR Scan */}
          <div 
            onClick={() => onNavigate('scan')}
            className="vg-card p-5 cursor-pointer hover:border-[#00695C] hover:shadow-md transition-all group"
            id="card-action-scan"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-[#E0F2F1] text-[#00695C] group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                Camera AR
              </span>
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-[#00695C] transition-colors">
              Point-and-Grade AR Scanner
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Inspect waste packaging through device camera with overlay for material classification, decomposition time, and recyclability.
            </p>
          </div>

          {/* Action 3: Payout & Receipt */}
          <div 
            onClick={() => onNavigate('payout')}
            className="vg-card p-5 cursor-pointer hover:border-amber-600 hover:shadow-md transition-all group"
            id="card-action-payout"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 group-hover:scale-110 transition-transform">
                <Receipt className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Settlement
              </span>
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-amber-800 transition-colors">
              Session Payout & Thermal Receipt
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Calculate running composition tallies, deduct contractual moisture penalties, and print physical 58mm ESC/POS receipts.
            </p>
          </div>

          {/* Action 4: Flagged Review */}
          <div 
            onClick={() => onNavigate('review')}
            className="vg-card p-5 cursor-pointer hover:border-[#1B5E20] hover:shadow-md transition-all group relative"
            id="card-action-review"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                <CheckSquare className="w-6 h-6" />
              </div>
              {flaggedCount > 0 && (
                <span className="text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                  {flaggedCount} Pending
                </span>
              )}
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-[#1B5E20] transition-colors">
              Flagged Items & Retraining
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Review sensor contradiction items (e.g. plastic vs metal) and submit human corrections that feed closed-loop AI retraining.
            </p>
          </div>

          {/* Action 5: Reputation & Micro-credit */}
          <div 
            onClick={() => onNavigate('reputation')}
            className="vg-card p-5 cursor-pointer hover:border-[#00695C] hover:shadow-md transition-all group"
            id="card-action-reputation"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-[#E8F5E9] text-[#1B5E20] group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Credit Score
              </span>
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-[#00695C] transition-colors">
              Reputation & Micro-Credit
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Inspect the explainable credit scoring formula (volume, clean streak, moisture) and generate SMS or certified proof for banks.
            </p>
          </div>

          {/* Action 6: MRF Audit */}
          <div 
            onClick={() => onNavigate('audit')}
            className="vg-card p-5 cursor-pointer hover:border-gray-700 hover:shadow-md transition-all group"
            id="card-action-audit"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-3 rounded-xl bg-gray-100 text-gray-700 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full">
                MRF / EPR
              </span>
            </div>
            <h3 className="font-bold text-[#212121] text-base group-hover:text-gray-900 transition-colors">
              MRF Truckload Audit & EPR
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Generate certified composition tallies per truckload and export compliance manifests for Extended Producer Responsibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
