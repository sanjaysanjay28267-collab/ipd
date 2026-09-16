/**
 * ==============================================================================
 * VERIGRADE S3 — RESPONSIVE BOTTOM NAVIGATION (BottomNav.tsx)
 * ==============================================================================
 */

import React from 'react';
import { 
  Home, 
  Activity, 
  Camera, 
  Receipt, 
  CheckSquare, 
  Award, 
  FileSpreadsheet, 
  Settings, 
  Lock,
  FileCode
} from 'lucide-react';

interface BottomNavProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isProMode: boolean;
  flaggedCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onNavigate,
  isProMode,
  flaggedCount
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, requiresPro: false },
    { id: 'live', label: 'Live Belt', icon: Activity, requiresPro: true },
    { id: 'scan', label: 'AR Scan', icon: Camera, requiresPro: false },
    { id: 'payout', label: 'Payout', icon: Receipt, requiresPro: false },
    { id: 'review', label: 'Review', icon: CheckSquare, requiresPro: true, badge: flaggedCount },
    { id: 'reputation', label: 'Reputation', icon: Award, requiresPro: false },
    { id: 'audit', label: 'MRF Audit', icon: FileSpreadsheet, requiresPro: true },
    { id: 'settings', label: 'Settings', icon: Settings, requiresPro: false }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E0E0DC] px-2 py-1 shadow-lg sm:py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isLocked = item.requiresPro && !isProMode;

          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-200 min-w-[52px] ${
                isActive 
                  ? 'text-[#1B5E20] font-semibold scale-105' 
                  : 'text-gray-500 hover:text-[#1B5E20]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                
                {/* Notification Badge for flagged review items */}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}

                {/* Lock indicator if not paired with firmware yet */}
                {isLocked && (
                  <span className="absolute -top-1.5 -right-2.5 bg-gray-200 text-gray-700 p-0.5 rounded-full" title="Connect VeriGrade device to unlock">
                    <Lock className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight line-clamp-1">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
