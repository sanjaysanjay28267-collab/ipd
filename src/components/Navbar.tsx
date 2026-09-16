/**
 * ==============================================================================
 * VERIGRADE S3 — HEADER NAVBAR COMPONENT (Navbar.tsx)
 * ==============================================================================
 */

import React from 'react';
import { ShieldCheck, Wifi, Cpu, Sparkles, User, LogOut } from 'lucide-react';
import { Trader, DevicePairingState } from '../types';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeTrader: Trader | null;
  onLogoutTrader: () => void;
  pairingState: DevicePairingState;
  onTogglePairing: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeTrader,
  onLogoutTrader,
  pairingState,
  onTogglePairing
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAFAF7]/95 backdrop-blur-md border-b border-[#E0E0DC] px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo & Tagline */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
          id="vg-header-brand"
        >
          <img 
            src="/logo.svg" 
            alt="VeriGrade S3 Logo" 
            className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
          />
        </div>

        {/* Status Indicators & Navigation Pills */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hardware Connection Pill */}
          <button
            onClick={onTogglePairing}
            id="btn-hardware-status"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all shadow-xs ${
              pairingState.is_paired
                ? 'bg-[#E8F5E9] text-[#1B5E20] border border-[#A5D6A7] hover:bg-[#C8E6C9]'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
            title="Click to toggle ESP32-S3 Hardware Pairing"
          >
            <Cpu className={`w-3.5 h-3.5 ${pairingState.is_paired ? 'text-[#1B5E20]' : 'text-amber-700 animate-pulse'}`} />
            <span className="hidden sm:inline">ESP32-S3:</span>
            <span>{pairingState.is_paired ? 'ONLINE' : 'UNPAIRED'}</span>
          </button>

          {/* Pro Mode Badge */}
          {pairingState.pro_mode_unlocked && (
            <div 
              id="chip-pro-mode"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>PRO MODE</span>
            </div>
          )}

          {/* Patent & Dossier Direct Button */}
          <button
            onClick={() => onNavigate('patent')}
            id="btn-nav-patent"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentView === 'patent'
                ? 'bg-[#1B5E20] text-white shadow-xs'
                : 'bg-white border border-[#E0E0DC] text-[#1B5E20] hover:bg-[#E8F5E9]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Patent & Spec</span>
            <span className="md:hidden">Patent</span>
          </button>

          {/* Active Trader Status */}
          {activeTrader ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E0E0DC]" id="trader-active-pill">
              <div 
                onClick={() => onNavigate('reputation')}
                className="cursor-pointer flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-[#E0E0DC] hover:border-[#1B5E20] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#1B5E20] text-white flex items-center justify-center text-xs font-bold">
                  {activeTrader.name.charAt(0)}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-xs font-semibold text-[#212121] leading-tight">{activeTrader.name}</p>
                  <p className="text-[10px] text-[#00695C] font-mono">Score: {activeTrader.reputation_score}</p>
                </div>
              </div>
              <button
                onClick={onLogoutTrader}
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Sign out trader"
                id="btn-logout-trader"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              id="btn-login-trader"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B5E20] text-white text-xs font-medium hover:bg-[#0D3311] transition-colors shadow-xs"
            >
              <User className="w-3.5 h-3.5" />
              <span>Trader PIN</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
