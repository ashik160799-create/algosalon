import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  Store,
  User,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { RegisteredAccount } from '../../utils/accountRegistry';

interface RoleSwitchPinModalProps {
  isOpen: boolean;
  targetRole: 'customer' | 'business';
  targetAccount: RegisteredAccount | null;
  onClose: () => void;
  onSuccess: () => void;
  onRedirectToAuth: (mode: 'login' | 'signup') => void;
}

export const RoleSwitchPinModal: React.FC<RoleSwitchPinModalProps> = ({
  isOpen,
  targetRole,
  targetAccount,
  onClose,
  onSuccess,
  onRedirectToAuth,
}) => {
  const { currentThemeConfig, colorThemeMode } = useApp();
  const isLight = colorThemeMode === 'light';

  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
      setIsShaking(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setTimeout(() => {
      setLockoutTimer(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [lockoutTimer]);

  if (!isOpen || !targetAccount) return null;

  const expectedCode = targetAccount.appCode || '1234';

  const handleDigitChange = (val: string) => {
    if (lockoutTimer > 0) return;
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setPin(clean);
    if (error) setError(null);

    if (clean.length === 4) {
      verifyPin(clean);
    }
  };

  const verifyPin = (inputPin: string) => {
    if (inputPin === expectedCode) {
      setFailedAttempts(0);
      setError(null);
      onSuccess();
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      if (nextFailures >= 5) {
        setLockoutTimer(30);
        setError('Too many failed attempts. For security, please wait 30 seconds or tap Forgot App Code to reset via email.');
      } else {
        setError('Incorrect App Code. Try 1234 or tap Forgot App Code below.');
      }
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
        inputRef.current?.focus();
      }, 500);
    }
  };

  const isBusiness = targetRole === 'business';
  const displayName =
    (isBusiness ? targetAccount.businessName || targetAccount.name : targetAccount.name) ||
    targetAccount.email;

  return (
    <div
      id="role-switch-pin-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="role-switch-pin-card"
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl relative space-y-5 transition-all animate-in zoom-in-95 duration-200 ${
          isShaking ? 'animate-shake' : ''
        } ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/50'
            : 'bg-slate-900/95 border-slate-800 text-white shadow-black/80'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
            isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-500 hover:text-white hover:bg-slate-800'
          }`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg relative"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 8px 25px -5px ${currentThemeConfig.glowHex}`,
            }}
          >
            {isBusiness ? <Store className="w-7 h-7" /> : <User className="w-7 h-7" />}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white dark:border-slate-900">
              <ShieldCheck className="w-3 h-3" />
            </span>
          </div>

          <div>
            <h3 className={`text-lg sm:text-xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isBusiness ? 'Open Business Hub' : 'Open Customer Portal'}
            </h3>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Enter the 4-digit App Code for{' '}
              <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>
            </p>
          </div>
        </div>

        {/* Hidden Input for Native Keyboards */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          disabled={lockoutTimer > 0}
          onChange={e => handleDigitChange(e.target.value)}
          className="sr-only"
          autoFocus
          aria-label="4-Digit App Code"
        />

        {/* 4 Digit Boxes */}
        <div
          className="flex items-center justify-center gap-3 py-2 cursor-pointer"
          onClick={() => inputRef.current?.focus()}
        >
          {[0, 1, 2, 3].map(index => {
            const digit = pin[index];
            const isFilled = digit !== undefined;
            const isCurrent = index === pin.length;

            return (
              <div
                key={index}
                className={`w-13 h-15 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-mono font-black transition-all ${
                  isFilled
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : isCurrent
                    ? 'border-slate-400 dark:border-slate-500 bg-slate-100/50 dark:bg-slate-800/50 ring-2 ring-emerald-500/30'
                    : isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-400'
                    : 'border-slate-800 bg-slate-950 text-slate-600'
                }`}
              >
                {isFilled ? (showPin ? digit : '•') : ''}
              </div>
            );
          })}
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className={`text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'
            }`}
          >
            {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showPin ? 'Hide PIN' : 'Show PIN numbers'}</span>
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Alternative Actions: Forgot PIN or New Account */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-center">
          <div className="flex items-center justify-between text-xs font-bold px-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onRedirectToAuth('login');
              }}
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Forgot App Code?
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onRedirectToAuth('signup');
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>New Account</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
