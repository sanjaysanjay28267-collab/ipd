/**
 * ==============================================================================
 * VERIGRADE S3 — FLAGGED REVIEW & CLOSED-LOOP RETRAINING (ReviewView.tsx)
 * ==============================================================================
 * CLAIM MAP: Patent Claims 1, 23 (Closed-Loop Model Retraining Pool)
 */

import React, { useState } from 'react';
import { 
  CheckSquare, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Send, 
  Sparkles, 
  Info,
  Scale,
  Droplets,
  Layers
} from 'lucide-react';
import { FlaggedItem, MaterialCategory } from '../types';

interface ReviewViewProps {
  flaggedItems: FlaggedItem[];
  onResolveCorrection: (itemId: number, correctedClass: MaterialCategory, notes: string) => void;
}

const CATEGORIES: { id: MaterialCategory; label: string }[] = [
  { id: 'PET_BOTTLE', label: 'PET Bottle (Clear/Blue)' },
  { id: 'HDPE_PLASTIC', label: 'HDPE Jug / Rigid Bottle' },
  { id: 'ALUMINUM_CAN', label: 'Aluminum Beverage Can' },
  { id: 'FERROUS_STEEL', label: 'Ferrous Steel / Tin Can' },
  { id: 'CARDBOARD_OCC', label: 'OCC Corrugated Cardboard' },
  { id: 'MIXED_RIGID_PLASTIC', label: 'Mixed Rigid Plastic (PP/PS)' },
  { id: 'HAZARD_BATTERY', label: 'Hazard: Lithium-Ion Battery' }
];

export const ReviewView: React.FC<ReviewViewProps> = ({
  flaggedItems,
  onResolveCorrection
}) => {
  const [selectedItem, setSelectedItem] = useState<FlaggedItem | null>(
    flaggedItems.find(i => !i.resolved) || null
  );
  const [correctedClass, setCorrectedClass] = useState<MaterialCategory>('ALUMINUM_CAN');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const pendingItems = flaggedItems.filter(i => !i.resolved);
  const resolvedItems = flaggedItems.filter(i => i.resolved);

  const handleSubmit = () => {
    if (!selectedItem) return;
    setSubmitting(true);

    setTimeout(() => {
      onResolveCorrection(selectedItem.id, correctedClass, notes);
      setSuccessMessage(`Item #${selectedItem.id} re-labeled as ${correctedClass}. Dispatched to closed-loop retraining dataset.`);
      setSubmitting(false);
      setNotes('');
      const next = pendingItems.find(i => i.id !== selectedItem.id);
      setSelectedItem(next || null);

      setTimeout(() => setSuccessMessage(null), 5000);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12" id="review-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#212121] font-heading flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#1B5E20]" />
            <span>Sensor Contradiction & Flagged Reviews</span>
          </h1>
          <p className="text-xs text-gray-500">
            Human-in-the-loop operator arbitration feeds the closed-loop edge AI retraining pool (Patent Claim 23)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
            {pendingItems.length} Pending
          </span>
          <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
            {resolvedItems.length} Corrected
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Review Workplace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 cols: Queue of Flagged Items */}
        <div className="lg:col-span-5 space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Review Queue
          </h2>

          {pendingItems.length === 0 ? (
            <div className="vg-card p-6 text-center text-gray-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-gray-800">All Flagged Items Resolved!</p>
              <p className="text-xs text-gray-400 mt-1">Conveyor edge fusion is running with high confidence.</p>
            </div>
          ) : (
            pendingItems.map((item) => {
              const isSelected = selectedItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`vg-card p-3 cursor-pointer transition-all border-l-4 ${
                    isSelected
                      ? 'border-l-[#1B5E20] ring-2 ring-[#1B5E20]/20 bg-emerald-50/20'
                      : 'border-l-amber-500 hover:border-l-amber-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image_url}
                      alt="Flagged Scrap"
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
                      crossOrigin="anonymous"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-gray-700">
                          #{item.id}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {item.timestamp}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-amber-800 line-clamp-1 mt-0.5">
                        {item.conflict_reason}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                        <span>AI: {item.ai_prediction.class_name.split('_')[0]}</span>
                        <span>•</span>
                        <span>Mass: {item.sensors.weight_grams.toFixed(0)}g</span>
                        <span>•</span>
                        <span>Metal: {item.sensors.inductive_metal ? 'YES' : 'NO'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right 7 cols: Inspection & Tap-to-Correct Panel */}
        <div className="lg:col-span-7">
          {selectedItem ? (
            <div className="vg-card p-6 space-y-5">
              <div className="flex items-start justify-between border-b border-gray-100 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    INSPECTING ITEM #{selectedItem.id}
                  </span>
                  <h2 className="text-base font-bold text-[#212121] mt-0.5">
                    Multi-Modal Evidence Breakdown
                  </h2>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full">
                  Conflict Flagged
                </span>
              </div>

              {/* Contradiction Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-amber-900">AMCF Fusion Contradiction Explanation:</p>
                  <p className="text-xs text-amber-800 mt-0.5">{selectedItem.conflict_reason}</p>
                </div>
              </div>

              {/* Photo & Sensor Telemetry Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-4/3 border border-gray-200">
                  <img
                    src={selectedItem.image_url}
                    alt="Inspection Snapshot"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded">
                    OV2640 Snapshot (8000K Strobe)
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">AI Vision Model</span>
                    <span className="font-bold text-gray-900">{selectedItem.ai_prediction.class_name}</span>
                    <span className="text-gray-500 font-mono ml-2">({(selectedItem.ai_prediction.confidence * 100).toFixed(1)}% conf)</span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Inductive Proximity Sensor</span>
                    <span className={`font-bold font-mono ${selectedItem.sensors.inductive_metal ? 'text-blue-700' : 'text-gray-600'}`}>
                      {selectedItem.sensors.inductive_metal ? 'METAL DETECTED (Conductive Core)' : 'NO METAL (Dielectric)'}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold block">Load Cell & Moisture ADC</span>
                    <span className="font-bold font-mono text-gray-900">
                      {selectedItem.sensors.weight_grams.toFixed(1)}g
                    </span>
                    <span className="text-gray-500 font-mono ml-2">| Moisture: {selectedItem.sensors.moisture_percent.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Operator Correction Form */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Select Ground Truth Material Class:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCorrectedClass(cat.id)}
                        className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all ${
                          correctedClass === cat.id
                            ? 'bg-[#E8F5E9] border-[#1B5E20] text-[#1B5E20] font-bold shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Operator Audit Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Crushed soda can wrapped in outer plastic label"
                    className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:border-[#1B5E20] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    id="btn-submit-correction"
                    className="px-5 py-2.5 rounded-xl bg-[#1B5E20] hover:bg-[#0D3311] text-white font-semibold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Dispatching...' : 'Submit Ground Truth to AI Retraining Pool'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="vg-card p-12 text-center text-gray-400">
              <Info className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Select an item from the review queue on the left to inspect multi-modal evidence.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
