import React from 'react';
import { ShieldCheck, Lock, KeyRound, CheckCircle2, EyeOff, Server } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SecurityBadgeProps {
  variant?: 'compact' | 'card' | 'banner' | 'pill';
  title?: string;
  subtitle?: string;
  showDetails?: boolean;
  className?: string;
}

export const SecurityBadge: React.FC<SecurityBadgeProps> = ({
  variant = 'compact',
  title = 'Secure Connection',
  subtitle = 'Your session is served over an encrypted HTTPS connection.',
  showDetails = false,
  className = '',
}) => {
  const { currentThemeConfig, colorThemeMode } = useApp();
  const isLight = colorThemeMode === 'light';

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${
          isLight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
        } ${className}`}
      >
        <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
        <span className="truncate">{title}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-2 p-2.5 px-3 rounded-2xl border text-xs font-semibold ${
          isLight
            ? 'bg-slate-50/80 border-slate-200 text-slate-700'
            : 'bg-slate-900/80 border-slate-800 text-slate-300'
        } ${className}`}
      >
        <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-bold block text-[11px] text-slate-900 dark:text-white leading-tight">
            {title}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight truncate">
              {subtitle}
            </span>
          )}
        </div>
        <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
          HTTPS
        </span>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white border-emerald-200/80 text-slate-800'
            : 'bg-gradient-to-r from-emerald-950/30 via-slate-900 to-slate-900 border-emerald-800/40 text-slate-200'
        } ${className}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <Lock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                {title}
              </h4>
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white px-1.5 py-0.2 rounded-md">
                HTTPS
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 shrink-0 self-start sm:self-center">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Encrypted in Transit</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border space-y-3.5 transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-slate-900 border-slate-800'
      } ${className}`}
    >
      <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {title}
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
          <Lock className="w-4 h-4 text-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold block text-[11px] text-slate-900 dark:text-white">
              Login Protected
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
              Your account is gated behind sign-in verification.
            </span>
          </div>
        </div>

        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <EyeOff className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold block text-[11px] text-slate-900 dark:text-white">
              Private By Default
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
              Personal contact details are only shown to the salon you book with.
            </span>
          </div>
        </div>

        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          <Server className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold block text-[11px] text-slate-900 dark:text-white">
              Encrypted Connection
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
              All traffic between the app and our servers uses HTTPS/TLS.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
