/**
 * ==============================================================================
 * VERIGRADE S3 — REAL-TIME CONVEYOR BELT VIEW (LiveBeltView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 3, 4, 12, 18, 23
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Gauge, 
  ShieldAlert, 
  Play, 
  Pause, 
  Plus, 
  Flame, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';
import { GradedItem, DevicePairingState } from '../types';

interface LiveBeltViewProps {
  items: GradedItem[];
  onAddItem: (item: GradedItem) => void;
  pairingState: DevicePairingState;
  onUnlockProMode: () => void;
}

export const LiveBeltView: React.FC<LiveBeltViewProps> = ({
  items,
  onAddItem,
  pairingState,
  onUnlockProMode
}) => {
  const [beltSpeed, setBeltSpeed] = useState<number>(248.5);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastEjection, setLastEjection] = useState<string | null>(null);

  // Dynamic belt speed perturbation simulation (simulating motor ripple)
  useEffect(() => {
    if (!isSimulating) return;
    const timer = setInterval(() => {
      setBeltSpeed(prev => {
        const delta = (Math.random() - 0.5) * 4.0;
        return Math.max(210, Math.min(285, prev + delta));
      });
    }, 1500);
    return () => clearInterval(timer);
  }, [isSimulating]);

  const generateSimulatedItem = (type: 'PET' | 'ALUMINUM' | 'HAZARD' | 'CARDBOARD') => {
    const nextId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1000;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    let newItem: GradedItem;

    if (type === 'HAZARD') {
      newItem = {
        id: nextId,
        timestamp: timeStr,
        device_id: 'VGR3-9842-X7',
        image_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80',
        material_class: 'HAZARD_BATTERY',
        ai_confidence: 0.94,
        fusion_score: 0.99,
        dynamic_alpha: 0.50,
        sensors: {
          weight_grams: 54.0,
          moisture_percent: 2.1,
          profile_height_mm: 18,
          inductive_metal: true,
          optical_sharpness: 0.92
        },
        is_hazard: true,
        requires_human_review: true,
        diverted: true,
        decision_rule: 'HAZARD_OVERRIDE_TRIGGERED',
        conflict_explanation: 'FIRE HAZARD: Lithium-ion pouch cell detected. SG90 gate fired in 45ms to safety chamber.',
        payout_value: 0.0
      };
      setLastEjection(`🚨 Intercepted HAZARD Battery #${nextId} -> Fire Chamber Chute`);
    } else if (type === 'ALUMINUM') {
      newItem = {
        id: nextId,
        timestamp: timeStr,
        device_id: 'VGR3-9842-X7',
        image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80',
        material_class: 'ALUMINUM_CAN',
        ai_confidence: 0.95,
        fusion_score: 0.96,
        dynamic_alpha: 0.74,
        sensors: {
          weight_grams: 14.5,
          moisture_percent: 3.2,
          profile_height_mm: 118,
          inductive_metal: true,
          optical_sharpness: 0.95
        },
        is_hazard: false,
        requires_human_review: false,
        diverted: false,
        decision_rule: 'AMCF_ACCEPTED_VERIFIED',
        payout_value: 0.02
      };
      setLastEjection(`✓ Sorted Aluminum Can #${nextId} to Bin B`);
    } else if (type === 'CARDBOARD') {
      newItem = {
        id: nextId,
        timestamp: timeStr,
        device_id: 'VGR3-9842-X7',
        image_url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80',
        material_class: 'CARDBOARD_OCC',
        ai_confidence: 0.86,
        fusion_score: 0.84,
        dynamic_alpha: 0.68,
        sensors: {
          weight_grams: 165.0,
          moisture_percent: 14.8,
          profile_height_mm: 42,
          inductive_metal: false,
          optical_sharpness: 0.82
        },
        is_hazard: false,
        requires_human_review: true,
        diverted: false,
        decision_rule: 'AMCF_ACCEPTED_MOISTURE_WARN',
        conflict_explanation: 'Moisture elevated: 14.8% (Contractual limit: 12.0%). Tare deduction flagged.',
        payout_value: 0.023
      };
      setLastEjection(`Cardboard #${nextId} sorted (Moisture tare flagged)`);
    } else {
      // PET
      newItem = {
        id: nextId,
        timestamp: timeStr,
        device_id: 'VGR3-9842-X7',
        image_url: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=400&auto=format&fit=crop&q=80',
        material_class: 'PET_BOTTLE',
        ai_confidence: 0.93,
        fusion_score: 0.92,
        dynamic_alpha: 0.78,
        sensors: {
          weight_grams: 34.0,
          moisture_percent: 5.1,
          profile_height_mm: 205,
          inductive_metal: false,
          optical_sharpness: 0.90
        },
        is_hazard: false,
        requires_human_review: false,
        diverted: false,
        decision_rule: 'AMCF_ACCEPTED_VERIFIED',
        payout_value: 0.016
      };
      setLastEjection(`✓ Sorted PET Bottle #${nextId} to Bin A`);
    }

    onAddItem(newItem);
  };

  // If Pro Mode is not unlocked, show tasteful lock banner
  if (!pairingState.pro_mode_unlocked) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-[#212121] mb-2 font-heading">
          Live Conveyor Telemetry (Pro Mode)
        </h2>
        <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
          The high-frequency live feed displays real-time item telemetry, load-cell readings, and SG90 servo gate actuation directly from the ESP32-S3.
        </p>
        <button
          onClick={onUnlockProMode}
          className="px-6 py-3 rounded-xl bg-[#1B5E20] hover:bg-[#0D3311] text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2 mx-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Connect Device / Unlock Live Belt</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" id="live-belt-view">
      {/* Top Instrumentation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conveyor Kinematics Gauge */}
        <div className="vg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Conveyor Velocity v(t)
            </span>
            <p className="text-2xl font-bold font-mono text-[#1B5E20] mt-0.5">
              {beltSpeed.toFixed(1)} <span className="text-sm font-normal text-gray-500">mm/s</span>
            </p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              TCRT5000 Tach: 120 pulses/rev
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#E8F5E9] text-[#1B5E20]">
            <Gauge className="w-8 h-8" />
          </div>
        </div>

        {/* ToF Ejection Scheduler Timing */}
        <div className="vg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              ToF Ejection Delay
            </span>
            <p className="text-2xl font-bold font-mono text-[#00695C] mt-0.5">
              {((350 / beltSpeed) * 1000 - 45).toFixed(0)} <span className="text-sm font-normal text-gray-500">ms</span>
            </p>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              d = 350mm, t_servo = 45ms
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#E0F2F1] text-[#00695C]">
            <Activity className="w-8 h-8" />
          </div>
        </div>

        {/* Reject / Divert Counter */}
        <div className="vg-card p-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Diverted / Hazards
            </span>
            <p className="text-2xl font-bold font-mono text-red-600 mt-0.5">
              {items.filter(i => i.diverted || i.is_hazard).length} <span className="text-sm font-normal text-gray-500">items</span>
            </p>
            <p className="text-[11px] text-red-500 font-medium mt-0.5">
              Fire protection chamber active
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-red-50 text-red-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Real-Time Conveyor Belt Simulator Controls */}
      <div className="bg-white rounded-xl p-4 border border-[#E0E0DC] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Hardware Simulation:
          </span>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isSimulating ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'Belt Active' : 'Belt Paused'}</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500 mr-1">Inject Item:</span>
          <button
            onClick={() => generateSimulatedItem('PET')}
            className="px-2.5 py-1.5 rounded-lg bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#1B5E20] text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> PET Bottle
          </button>
          <button
            onClick={() => generateSimulatedItem('ALUMINUM')}
            className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Aluminum Can
          </button>
          <button
            onClick={() => generateSimulatedItem('CARDBOARD')}
            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Wet OCC
          </button>
          <button
            onClick={() => generateSimulatedItem('HAZARD')}
            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-all flex items-center gap-1 border border-red-200 animate-pulse"
          >
            <Flame className="w-3.5 h-3.5" /> Li-ion Hazard
          </button>
        </div>
      </div>

      {lastEjection && (
        <div className="bg-[#1B5E20]/5 border border-[#1B5E20]/20 rounded-xl p-3 flex items-center justify-between text-xs font-medium text-[#1B5E20] animate-fadeIn">
          <span>{lastEjection}</span>
          <span className="text-[10px] text-gray-400 font-mono">ESP32-S3 Core 1 Actuated</span>
        </div>
      )}

      {/* Real-time Item Feed Stream */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[#212121] font-heading flex items-center gap-2">
            <span>Classified Scrap Items Stream</span>
            <span className="text-xs font-normal text-gray-500">({items.length} logged on this shift)</span>
          </h2>
          <span className="text-xs font-mono text-[#00695C] bg-[#E0F2F1] px-2 py-0.5 rounded">
            FreeRTOS commsTask @ 115200 baud
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item) => {
            const isHazard = item.is_hazard;
            const isReview = item.requires_human_review && !isHazard;

            return (
              <div
                key={item.id}
                className={`vg-card p-4 transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 ${
                  isHazard
                    ? 'border-l-red-500 bg-red-50/20'
                    : isReview
                    ? 'border-l-amber-500 bg-amber-50/20'
                    : 'border-l-[#1B5E20]'
                }`}
              >
                {/* Left: Thumbnail & Classification */}
                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <img
                      src={item.image_url}
                      alt={item.material_class}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                    {isHazard && (
                      <div className="absolute inset-0 bg-red-600/30 flex items-center justify-center">
                        <Flame className="w-6 h-6 text-white animate-bounce" />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-gray-400">
                        #{item.id}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {item.timestamp}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isHazard
                            ? 'bg-red-100 text-red-700'
                            : isReview
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.material_class.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">AI Conf:</span>
                        <span>{(item.ai_confidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">AMCF Fusion:</span>
                        <span>{(item.fusion_score * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700">α:</span>
                        <span className="font-mono text-indigo-700">{item.dynamic_alpha.toFixed(2)}</span>
                      </div>
                    </div>

                    {item.conflict_explanation && (
                      <p className="text-xs font-medium text-amber-800 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>{item.conflict_explanation}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Sensor Evidence Strip & Decision Tag */}
                <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end lg:items-center gap-2 md:gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                      <span className="block text-[10px] text-gray-400 uppercase">Mass</span>
                      <span className="font-bold text-gray-800 font-mono">{item.sensors.weight_grams.toFixed(1)}g</span>
                    </div>
                    <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                      <span className="block text-[10px] text-gray-400 uppercase">Moisture</span>
                      <span className={`font-bold font-mono ${item.sensors.moisture_percent > 12 ? 'text-amber-600' : 'text-gray-800'}`}>
                        {item.sensors.moisture_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
                      <span className="block text-[10px] text-gray-400 uppercase">Metal</span>
                      <span className={`font-bold font-mono ${item.sensors.inductive_metal ? 'text-blue-600' : 'text-gray-400'}`}>
                        {item.sensors.inductive_metal ? 'YES' : 'NO'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-700 block">
                      +${item.payout_value.toFixed(3)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono block">
                      {item.decision_rule}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
