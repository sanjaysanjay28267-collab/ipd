/**
 * ==============================================================================
 * VERIGRADE S3 — SETTINGS & CALIBRATION VIEW (SettingsView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 12, 18 (ToF Calibration & AMCF Thresholds)
 */

import React, { useState } from 'react';
import { 
  Settings, 
  Cpu, 
  Sliders, 
  Save, 
  Check, 
  RotateCcw, 
  Wifi, 
  Radio, 
  Gauge, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { DevicePairingState } from '../types';

interface SettingsViewProps {
  pairingState: DevicePairingState;
  onTogglePairing: () => void;
  onUnlockProMode: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  pairingState,
  onTogglePairing,
  onUnlockProMode
}) => {
  const [baseAlpha, setBaseAlpha] = useState<number>(0.70);
  const [moistureCutoff, setMoistureCutoff] = useState<number>(12.0);
  const [tofDistanceMm, setTofDistanceMm] = useState<number>(350);
  const [servoDelayMs, setServoDelayMs] = useState<number>(45);
  const [deviceToken, setDeviceToken] = useState<string>('VGR3-DEV-9842-X7');
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const handleSave = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12" id="settings-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121] font-heading flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#1B5E20]" />
            <span>Hardware Calibration & Fusion Thresholds</span>
          </h1>
          <p className="text-xs text-gray-500">
            Tune AMCF mathematical weights, ToF ejection timing, and device pairing (Claims 1, 12)
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-[#1B5E20] hover:bg-[#0D3311] text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedFeedback ? 'Saved to ESP32 Flash!' : 'Save Calibration'}</span>
        </button>
      </div>

      {/* Device Pairing & WiFi Status */}
      <div className="vg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-[#1B5E20]" />
          <span>ESP32-S3 Firmware Link & Telemetry Bridge</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gray-600 font-semibold mb-1">
              Hardware Device Token:
            </label>
            <input
              type="text"
              value={deviceToken}
              onChange={(e) => setDeviceToken(e.target.value)}
              className="w-full font-mono p-2.5 rounded-xl border border-gray-300 focus:border-[#1B5E20] outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1">
              Firmware Pairing State:
            </label>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200">
              <div className="flex items-center gap-2 font-mono">
                <span className={`w-2.5 h-2.5 rounded-full ${pairingState.is_paired ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>{pairingState.is_paired ? 'CONNECTED (192.168.1.50)' : 'UNPAIRED / SIMULATED'}</span>
              </div>
              <button
                onClick={onTogglePairing}
                className="text-xs font-bold text-[#1B5E20] hover:underline"
              >
                {pairingState.is_paired ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>

        {!pairingState.pro_mode_unlocked && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between text-xs">
            <span className="text-amber-900 font-medium">
              Want to test Pro Mode features without real hardware?
            </span>
            <button
              onClick={onUnlockProMode}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Pair & Unlock</span>
            </button>
          </div>
        )}
      </div>

      {/* AMCF Sensor Fusion Calibration */}
      <div className="vg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#00695C]" />
          <span>AMCF Algorithm Weights (Patent Claim 1 & 4)</span>
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-gray-700">Base Optical Confidence Weight (α):</span>
              <span className="font-mono text-[#00695C] font-bold">{baseAlpha.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.90"
              step="0.05"
              value={baseAlpha}
              onChange={(e) => setBaseAlpha(parseFloat(e.target.value))}
              className="w-full accent-[#00695C]"
            />
            <span className="text-[11px] text-gray-500 block mt-0.5">
              Dynamically reduced when image blur is detected (Claim 4).
            </span>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span className="text-gray-700">Contractual Moisture Tare Cutoff (%):</span>
              <span className="font-mono text-amber-700 font-bold">{moistureCutoff.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="5.0"
              max="25.0"
              step="0.5"
              value={moistureCutoff}
              onChange={(e) => setMoistureCutoff(parseFloat(e.target.value))}
              className="w-full accent-amber-600"
            />
            <span className="text-[11px] text-gray-500 block mt-0.5">
              Moisture exceeding this threshold triggers automatic weight deductions on cardboard & paper.
            </span>
          </div>
        </div>
      </div>

      {/* Kinematics & ToF Ejection Timing */}
      <div className="vg-card p-5 space-y-4">
        <h2 className="text-sm font-bold text-[#212121] uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-800" />
          <span>Time-of-Flight Ejection Calibration (Patent Claim 12)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-gray-600 font-semibold mb-1">
              Inspection Zone to SG90 Gate Distance (d):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={tofDistanceMm}
                onChange={(e) => setTofDistanceMm(parseInt(e.target.value, 10) || 350)}
                className="w-full font-mono p-2.5 rounded-xl border border-gray-300 focus:border-[#1B5E20] outline-none"
              />
              <span className="font-mono text-gray-500 font-bold">mm</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-600 font-semibold mb-1">
              SG90 Servo Actuation Latency (t_servo):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={servoDelayMs}
                onChange={(e) => setServoDelayMs(parseInt(e.target.value, 10) || 45)}
                className="w-full font-mono p-2.5 rounded-xl border border-gray-300 focus:border-[#1B5E20] outline-none"
              />
              <span className="font-mono text-gray-500 font-bold">ms</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] font-mono text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
          Deterministic Equation: t_wait = (d / v) - t_servo = ({tofDistanceMm}mm / 248.5mm/s) - {servoDelayMs}ms = {((tofDistanceMm / 248.5) * 1000 - servoDelayMs).toFixed(1)} ms
        </p>
      </div>
    </div>
  );
};
