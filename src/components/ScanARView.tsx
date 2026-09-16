/**
 * ==============================================================================
 * VERIGRADE S3 — AR OPTICAL SCANNER VIEW (ScanARView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 3, 23 (Optical Inspection & AR Diagnostics)
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  RefreshCw, 
  ShieldAlert, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  Recycle, 
  Scale, 
  Flame, 
  Maximize2 
} from 'lucide-react';
import { MaterialCategory, GradedItem } from '../types';

interface ScanARViewProps {
  onLogItem: (item: GradedItem) => void;
}

interface SampleTarget {
  id: number;
  name: string;
  category: MaterialCategory;
  imageUrl: string;
  confidence: number;
  estWeight: number;
  decompositionYears: number;
  recyclabilityRating: string;
  isHazard: boolean;
  hazardDetails?: string;
  sensorCorrelation: string;
}

const SAMPLE_TARGETS: SampleTarget[] = [
  {
    id: 1,
    name: 'PET Beverage Bottle (Clear)',
    category: 'PET_BOTTLE',
    imageUrl: 'https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?w=800&auto=format&fit=crop&q=80',
    confidence: 0.94,
    estWeight: 32.5,
    decompositionYears: 450,
    recyclabilityRating: 'Grade A (98% High Value)',
    isHazard: false,
    sensorCorrelation: 'Inductive: Inactive | Optical IR: Transparent polymer peak at 1660nm'
  },
  {
    id: 2,
    name: 'Crushed Aluminum Beverage Can',
    category: 'ALUMINUM_CAN',
    imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop&q=80',
    confidence: 0.96,
    estWeight: 14.8,
    decompositionYears: 200,
    recyclabilityRating: 'Grade A+ (100% Infinitely Recyclable)',
    isHazard: false,
    sensorCorrelation: 'Inductive: High Amplitude Signal | Ultrasonic Profile: 120mm peak'
  },
  {
    id: 3,
    name: 'Lithium-Ion Pouch Battery (Hazard)',
    category: 'HAZARD_BATTERY',
    imageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    confidence: 0.92,
    estWeight: 55.0,
    decompositionYears: 100,
    recyclabilityRating: 'Hazardous (E-Waste Only)',
    isHazard: true,
    hazardDetails: 'FIRE / EXPLOSION HAZARD: Immediate SG90 Gate Diversion to Chute B Required',
    sensorCorrelation: 'Inductive: Ferrous/Metal Active | Load: Dense concentrated mass (55g)'
  },
  {
    id: 4,
    name: 'Corrugated Cardboard OCC',
    category: 'CARDBOARD_OCC',
    imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80',
    confidence: 0.88,
    estWeight: 140.0,
    decompositionYears: 2,
    recyclabilityRating: 'Grade B (Moisture Dependent)',
    isHazard: false,
    sensorCorrelation: 'Capacitive Moisture ADC: 7.8% (Dry, Accepted) | Inductive: Inactive'
  }
];

export const ScanARView: React.FC<ScanARViewProps> = ({ onLogItem }) => {
  const [selectedTargetIdx, setSelectedTargetIdx] = useState<number>(0);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const current = SAMPLE_TARGETS[selectedTargetIdx];

  // Optional real device camera request
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setUseWebcam(true);
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError('Camera unavailable in current environment. Using simulated optical feeds.');
      setUseWebcam(false);
    }
  };

  const handleNextTarget = () => {
    setIsScanning(true);
    setTimeout(() => {
      setSelectedTargetIdx((prev) => (prev + 1) % SAMPLE_TARGETS.length);
      setIsScanning(false);
    }, 400);
  };

  const handleLogCurrent = () => {
    const now = new Date();
    const item: GradedItem = {
      id: Date.now() % 100000,
      timestamp: now.toTimeString().split(' ')[0],
      device_id: 'VGR3-9842-X7',
      image_url: current.imageUrl,
      material_class: current.category,
      ai_confidence: current.confidence,
      fusion_score: current.isHazard ? 0.99 : current.confidence - 0.02,
      dynamic_alpha: 0.75,
      sensors: {
        weight_grams: current.estWeight,
        moisture_percent: current.category === 'CARDBOARD_OCC' ? 7.8 : 3.5,
        profile_height_mm: 150,
        inductive_metal: current.category === 'ALUMINUM_CAN' || current.isHazard,
        optical_sharpness: 0.92
      },
      is_hazard: current.isHazard,
      requires_human_review: current.isHazard,
      diverted: current.isHazard,
      decision_rule: current.isHazard ? 'HAZARD_OVERRIDE_TRIGGERED' : 'AMCF_ACCEPTED_VERIFIED',
      conflict_explanation: current.isHazard ? current.hazardDetails : undefined,
      payout_value: current.isHazard ? 0 : 0.025
    };

    onLogItem(item);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-12" id="scan-ar-view">
      {/* Title & Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121] font-heading flex items-center gap-2">
            <Camera className="w-6 h-6 text-[#1B5E20]" />
            <span>AR Optical Waste Classifier</span>
          </h1>
          <p className="text-xs text-gray-500">
            Simulates ESP32-S3 OV2640 camera with active bounding reticle & sensor correlation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!useWebcam ? (
            <button
              onClick={startCamera}
              className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 text-xs font-semibold text-gray-700 flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Use Real Camera</span>
            </button>
          ) : (
            <button
              onClick={() => setUseWebcam(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-200 text-xs font-semibold text-gray-700"
            >
              Stop Camera
            </button>
          )}

          <button
            onClick={handleNextTarget}
            className="px-3 py-1.5 rounded-lg bg-[#1B5E20] hover:bg-[#0D3311] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Cycle Waste Target</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
          {cameraError}
        </div>
      )}

      {/* Main AR Viewport */}
      <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-2xl overflow-hidden bg-black border-2 border-[#1B5E20]/40 shadow-xl">
        {/* Background Visual Stream */}
        {useWebcam ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={current.imageUrl}
            alt={current.name}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isScanning ? 'opacity-40' : 'opacity-90'
            }`}
            crossOrigin="anonymous"
          />
        )}

        {/* Optical HUD Reticle & Crosshairs */}
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          {/* Top HUD Stats */}
          <div className="flex items-center justify-between text-white/90 text-xs font-mono drop-shadow-md">
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>FOV: 68° OV2640</span>
              <span>•</span>
              <span>15 FPS</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20">
              STROBE: 8000K 50ms SYNC
            </div>
          </div>

          {/* Central Target Bounding Box */}
          <div className="relative mx-auto w-48 h-48 sm:w-64 sm:h-64 border-2 border-[#A5D6A7]/80 rounded-2xl flex items-center justify-center animate-pulse">
            {/* Corner Markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

            <span className="text-[11px] font-mono font-bold text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
              LOCK: {(current.confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* Bottom Diagnostics Strip */}
          <div className="bg-black/70 backdrop-blur-md p-3 rounded-xl border border-white/20 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono text-emerald-400">
                {current.sensorCorrelation}
              </p>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              Patent Claim 3 & 4 Active
            </span>
          </div>
        </div>
      </div>

      {/* AR Diagnostic Bounding Card */}
      <div className={`vg-card p-5 border-2 transition-all ${
        current.isHazard ? 'border-red-500 bg-red-50/30' : 'border-[#1B5E20]/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                current.isHazard ? 'bg-red-600 text-white' : 'bg-[#1B5E20] text-white'
              }`}>
                {current.category.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono font-bold text-gray-500">
                Confidence: {(current.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#212121] font-heading">
              {current.name}
            </h2>
          </div>

          <button
            onClick={handleLogCurrent}
            id="btn-log-scanned-item"
            className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all ${
              current.isHazard
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-[#1B5E20] hover:bg-[#0D3311] text-white'
            }`}
          >
            {current.isHazard ? <Flame className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <span>{current.isHazard ? 'Log & Fire Divert Chute' : 'Grade & Add to Tally'}</span>
          </button>
        </div>

        {/* Hazard Banner */}
        {current.isHazard && (
          <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-red-800 text-xs font-semibold mb-4 flex items-center gap-2 animate-shake">
            <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
            <span>{current.hazardDetails}</span>
          </div>
        )}

        {/* Environmental & Scrap Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Scale className="w-3.5 h-3.5 text-[#1B5E20]" />
              <span className="font-semibold uppercase tracking-wider">Estimated Mass</span>
            </div>
            <p className="text-base font-bold font-mono text-gray-900">
              {current.estWeight.toFixed(1)} grams
            </p>
            <p className="text-[10px] text-gray-400">HX711 baseline: ±0.5g</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#00695C]" />
              <span className="font-semibold uppercase tracking-wider">Decomposition</span>
            </div>
            <p className="text-base font-bold font-mono text-gray-900">
              ~{current.decompositionYears} years
            </p>
            <p className="text-[10px] text-gray-400">Prevented landfill persistence</p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200">
            <div className="flex items-center gap-1.5 text-gray-500 mb-1">
              <Recycle className="w-3.5 h-3.5 text-amber-700" />
              <span className="font-semibold uppercase tracking-wider">Recyclability</span>
            </div>
            <p className="text-base font-bold text-gray-900">
              {current.recyclabilityRating}
            </p>
            <p className="text-[10px] text-gray-400">Secondary smelting grade</p>
          </div>
        </div>
      </div>
    </div>
  );
};
