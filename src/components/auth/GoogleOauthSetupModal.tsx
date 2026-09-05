import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ExternalLink,
  Copy,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GoogleOauthSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinueWithEmail?: () => void;
  errorMessage?: string | null;
}

export const GoogleOauthSetupModal: React.FC<GoogleOauthSetupModalProps> = ({
  isOpen,
  onClose,
  onContinueWithEmail,
  errorMessage,
}) => {
  const { colorThemeMode, currentThemeConfig } = useApp();
  const isLight = colorThemeMode === 'light';
  const primaryColor = currentThemeConfig?.primaryHex || '#0EA36F';
  const [copied, setCopied] = useState(false);

  const supabaseUrl = 'https://mmmthrlbikllhdupslrz.supabase.co';
  const callbackUrl = `${supabaseUrl}/auth/v1/callback`;

  const handleCopy = () => {
    navigator.clipboard.writeText(callbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border text-left relative overflow-hidden ${
            isLight
              ? 'bg-white border-zinc-200 text-zinc-900 shadow-zinc-400/30'
              : 'bg-zinc-950 border-zinc-800 text-white shadow-black/80'
          }`}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-500/10 border border-blue-500/30 text-blue-500">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.98 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black font-['Outfit',sans-serif]">
                  Supabase Google OAuth Status
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Provider Setup
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                Live Supabase client is connected to: <code className="font-mono text-zinc-900 dark:text-zinc-200">mmmthrlbikllhdupslrz</code>
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 text-xs space-y-2 mb-4">
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">
              The application code is already fully configured with{' '}
              <code className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                supabase.auth.signInWithOAuth(&#123; provider: 'google' &#125;)
              </code>
              .
            </p>
            {errorMessage && (
              <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 font-medium text-[11px]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Supabase Message: {errorMessage}</span>
              </div>
            )}
            <p className="text-zinc-600 dark:text-zinc-400">
              To activate 1-click Google authentication with your custom domain or project, follow these two quick steps in your Supabase project:
            </p>
          </div>

          {/* Setup Steps */}
          <div className="space-y-3 mb-5 text-xs">
            <div className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div className="flex-1 space-y-1.5">
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  Add Authorized Redirect URI in Google Cloud Console
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={callbackUrl}
                    className="flex-1 px-2.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div className="flex-1">
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  Enable Google in Supabase Dashboard
                </p>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] mt-0.5">
                  Go to <strong>Authentication → Providers → Google</strong>, toggle <strong>Enabled</strong>, paste your <em>Client ID</em> and <em>Client Secret</em>, and click <strong>Save</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {onContinueWithEmail && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContinueWithEmail();
                }}
                className="w-full sm:flex-1 py-3 px-4 rounded-2xl text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.99] cursor-pointer"
                style={{
                  backgroundColor: primaryColor,
                }}
              >
                <span>Continue with Gmail / Email</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto py-3 px-5 rounded-2xl border font-bold text-xs sm:text-sm transition-colors cursor-pointer ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
              }`}
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
