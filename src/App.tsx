/**
 * ==============================================================================
 * VERIGRADE S3 — CORE APPLICATION ENTRY (App.tsx)
 * ==============================================================================
 * Product: VeriGrade S3 — The Waste Truth Infrastructure
 * CLAIM MAP: Patent Claims 1, 3, 4, 12, 18, 23, 29, 31, 32
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Trader, 
  GradedItem, 
  FlaggedItem, 
  PriceEntry, 
  TruckloadAudit, 
  DevicePairingState, 
  MaterialCategory 
} from './types';
import { 
  INITIAL_TRADERS, 
  INITIAL_PRICES, 
  INITIAL_FLAGGED_ITEMS, 
  INITIAL_TRUCKLOAD_AUDIT, 
  RECENT_ITEMS_STREAM 
} from './data/initialData';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { HomeView } from './components/HomeView';
import { LiveBeltView } from './components/LiveBeltView';
import { ScanARView } from './components/ScanARView';
import { PayoutView } from './components/PayoutView';
import { ReviewView } from './components/ReviewView';
import { ReputationView } from './components/ReputationView';
import { AuditView } from './components/AuditView';
import { SettingsView } from './components/SettingsView';
import { PatentDossierView } from './components/PatentDossierView';
import { LoginView } from './components/LoginView';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [traders, setTraders] = useState<Trader[]>(INITIAL_TRADERS);
  const [activeTrader, setActiveTrader] = useState<Trader | null>(INITIAL_TRADERS[0]);
  const [prices, setPrices] = useState<PriceEntry[]>(INITIAL_PRICES);
  const [items, setItems] = useState<GradedItem[]>(RECENT_ITEMS_STREAM);
  const [flaggedItems, setFlaggedItems] = useState<FlaggedItem[]>(INITIAL_FLAGGED_ITEMS);
  const [auditData, setAuditData] = useState<TruckloadAudit>(INITIAL_TRUCKLOAD_AUDIT);
  
  const [pairingState, setPairingState] = useState<DevicePairingState>({
    is_paired: true,
    device_id: 'VGR3-9842-X7',
    device_ip: '192.168.1.50',
    firmware_version: '1.0.4-esp32s3',
    battery_level_pct: 94,
    belt_speed_mm_s: 248.5,
    pro_mode_unlocked: true,
    last_ping_ms: Date.now()
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Connect to SSE stream from server for live ingest
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource('/api/belt/stream');
      evtSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.item_id) {
            // New item received
            console.log('[SSE] Live item received:', payload);
          }
        } catch (e) {
          // ignore keepalive
        }
      };
      evtSource.addEventListener('ITEM_GRADED', (e: any) => {
        try {
          const item = JSON.parse(e.data);
          handleAddItem(item);
        } catch (err) {}
      });
    } catch (e) {
      console.warn('SSE stream unavailable in offline mode:', e);
    }

    return () => {
      if (evtSource) evtSource.close();
    };
  }, []);

  const triggerCelebration = (msg: string) => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleUnlockProMode = () => {
    setPairingState(prev => ({
      ...prev,
      is_paired: true,
      pro_mode_unlocked: true
    }));
    triggerCelebration('PRO MODE UNLOCKED: High-frequency telemetry, review queue & audit exports activated!');
  };

  const handleTogglePairing = () => {
    if (pairingState.is_paired) {
      setPairingState(prev => ({ ...prev, is_paired: false }));
      setToastMessage('ESP32-S3 Hardware Link Paused (Simulated Mode)');
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      handleUnlockProMode();
    }
  };

  const handleAddItem = (newItem: GradedItem) => {
    setItems(prev => [newItem, ...prev]);

    // If requires human review, add to flagged items
    if (newItem.requires_human_review && !newItem.is_hazard) {
      const flagged: FlaggedItem = {
        id: newItem.id,
        timestamp: newItem.timestamp,
        image_url: newItem.image_url,
        ai_prediction: {
          class_name: newItem.material_class,
          confidence: newItem.ai_confidence
        },
        sensors: newItem.sensors,
        fusion_score: newItem.fusion_score,
        conflict_reason: newItem.conflict_explanation || 'Classification confidence below 0.75 threshold',
        resolved: false
      };
      setFlaggedItems(prev => [flagged, ...prev]);
    }

    // Update active trader statistics
    if (activeTrader && !newItem.is_hazard) {
      const addedGrams = newItem.sensors.weight_grams;
      setActiveTrader(prev => {
        if (!prev) return null;
        return {
          ...prev,
          cumulative_kg: prev.cumulative_kg + addedGrams / 1000,
          clean_streak_count: prev.clean_streak_count + 1,
          total_transactions: prev.total_transactions + 1
        };
      });
    }
  };

  const handleResolveCorrection = (itemId: number, correctedClass: MaterialCategory, notes: string) => {
    setFlaggedItems(prev => 
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            resolved: true,
            corrected_class: correctedClass,
            operator_notes: notes
          };
        }
        return item;
      })
    );

    // Update the item class in items list
    setItems(prev => 
      prev.map(i => {
        if (i.id === itemId) {
          return {
            ...i,
            material_class: correctedClass,
            requires_human_review: false,
            decision_rule: 'OPERATOR_GROUND_TRUTH_OVERRIDE'
          };
        }
        return i;
      })
    );

    // Increment correction count for active trader to test reputation formula
    if (activeTrader) {
      setActiveTrader(prev => {
        if (!prev) return null;
        return {
          ...prev,
          correction_count: prev.correction_count + 1
        };
      });
    }

    // Inform backend retraining pool
    fetch('/api/corrections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_id: itemId,
        corrected_class: correctedClass,
        notes
      })
    }).catch(() => {});
  };

  const handleSendSMS = async (traderId: number) => {
    try {
      await fetch('/api/reputation/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trader_id: traderId })
      });
    } catch (err) {}
  };

  return (
    <div className="min-h-screen flex flex-col facility-backdrop text-[#212121]">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        activeTrader={activeTrader}
        onLogoutTrader={() => setActiveTrader(null)}
        pairingState={pairingState}
        onTogglePairing={handleTogglePairing}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-[#1B5E20] text-white px-4 py-2.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2 border border-emerald-400 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 mb-16">
        {currentView === 'login' && (
          <LoginView
            traders={traders}
            onSelectTrader={(t) => {
              setActiveTrader(t);
              setCurrentView('home');
              setToastMessage(`Signed in as ${t.name} (PIN verified)`);
              setTimeout(() => setToastMessage(null), 3000);
            }}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'home' && (
          <HomeView
            onNavigate={setCurrentView}
            activeTrader={activeTrader}
            pairingState={pairingState}
            onTogglePairing={handleTogglePairing}
            flaggedCount={flaggedItems.filter(i => !i.resolved).length}
          />
        )}

        {currentView === 'live' && (
          <LiveBeltView
            items={items}
            onAddItem={handleAddItem}
            pairingState={pairingState}
            onUnlockProMode={handleUnlockProMode}
          />
        )}

        {currentView === 'scan' && (
          <ScanARView
            onLogItem={(item) => {
              handleAddItem(item);
              setToastMessage(`Graded item #${item.id}: ${item.material_class.replace(/_/g, ' ')}`);
              setTimeout(() => setToastMessage(null), 3000);
            }}
          />
        )}

        {currentView === 'payout' && (
          <PayoutView
            prices={prices}
            onUpdatePrices={setPrices}
            activeTrader={activeTrader}
            items={items}
          />
        )}

        {currentView === 'review' && (
          <ReviewView
            flaggedItems={flaggedItems}
            onResolveCorrection={handleResolveCorrection}
          />
        )}

        {currentView === 'reputation' && (
          <ReputationView
            trader={activeTrader || traders[0]}
            onSendSMS={handleSendSMS}
          />
        )}

        {currentView === 'audit' && (
          <AuditView
            auditData={auditData}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            pairingState={pairingState}
            onTogglePairing={handleTogglePairing}
            onUnlockProMode={handleUnlockProMode}
          />
        )}

        {currentView === 'patent' && (
          <PatentDossierView />
        )}
      </main>

      {/* Responsive Bottom Navigation Bar */}
      <BottomNav
        currentView={currentView}
        onNavigate={setCurrentView}
        isProMode={pairingState.pro_mode_unlocked}
        flaggedCount={flaggedItems.filter(i => !i.resolved).length}
      />
    </div>
  );
}
