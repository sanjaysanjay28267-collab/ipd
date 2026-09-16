/**
 * ==============================================================================
 * VERIGRADE S3 — TRADER PIN LOGIN SCREEN (LoginView.tsx)
 * ==============================================================================
 */

import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Trader } from '../types';

interface LoginViewProps {
  traders: Trader[];
  onSelectTrader: (trader: Trader) => void;
  onCancel: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  traders,
  onSelectTrader,
  onCancel
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleKeypadPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        validatePin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const validatePin = (inputPin: string) => {
    const matched = traders.find(t => t.pin === inputPin);
    if (matched) {
      onSelectTrader(matched);
    } else {
      setError('Invalid PIN. Please try again.');
      setPin('');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 max-w-md mx-auto" id="login-container">
      {/* Brand Card */}
      <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-[#E0E0DC] text-center">
        <div className="flex justify-center mb-3">
          <img src="/logo.svg" alt="VeriGrade S3 Logo" className="h-16 w-auto object-contain" />
        </div>
        
        <p className="text-xs font-semibold text-[#00695C] uppercase tracking-wider mb-1">
          Scrap Yard Point-of-Sale Access
        </p>
        <h2 className="text-xl font-bold text-[#212121] mb-2 font-heading">
          Enter Trader PIN
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          Shared device authentication for informal waste collectors & aggregators.
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-[#1B5E20] border-[#1B5E20] scale-110'
                  : 'border-gray-300 bg-gray-50'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-medium mb-4 animate-shake">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto mb-6">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
            return (
              <button
                key={key}
                id={`keypad-${key}`}
                onClick={() => {
                  if (key === 'C') setPin('');
                  else if (key === '⌫') handleBackspace();
                  else handleKeypadPress(key);
                }}
                className="h-12 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-[#E8F5E9] active:text-[#1B5E20] text-lg font-semibold text-[#212121] border border-[#E0E0DC] transition-all flex items-center justify-center shadow-2xs"
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Quick Demo Selectors */}
        <div className="border-t border-[#E0E0DC] pt-4 text-left">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Quick Select Test Account:
          </p>
          <div className="space-y-1.5">
            {traders.slice(0, 3).map((trader) => (
              <button
                key={trader.id}
                onClick={() => onSelectTrader(trader)}
                className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-[#E8F5E9] transition-colors border border-transparent hover:border-[#A5D6A7]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#1B5E20]/10 text-[#1B5E20] flex items-center justify-center font-bold">
                    {trader.name.charAt(0)}
                  </div>
                  <span className="font-medium text-[#212121]">{trader.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-500">PIN: {trader.pin}</span>
                  <span className="text-[10px] font-semibold text-[#00695C] bg-[#E0F2F1] px-1.5 py-0.5 rounded">
                    {trader.reputation_score} pts
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button
            onClick={onCancel}
            className="text-xs text-gray-500 hover:text-[#212121] underline"
          >
            Continue as Guest / Operator
          </button>
        </div>
      </div>
    </div>
  );
};
