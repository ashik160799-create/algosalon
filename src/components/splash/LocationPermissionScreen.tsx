import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  Check,
  Loader2,
  MapPin,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface LocationPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
  targetRole?: 'customer' | 'business';
  actionType?: 'explore' | 'signin';
}

export const LocationPermissionScreen: React.FC<LocationPermissionScreenProps> = ({
  onAllow,
  onSkip,
  targetRole = 'customer',
  actionType = 'explore',
}) => {
  const { currentThemeConfig, colorThemeMode, requestLocationPermission, userLocation } = useApp();
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const isLight = colorThemeMode === 'light';

  const handleAllowClick = async () => {
    setIsLocating(true);
    try {
      await requestLocationPermission();
      setLocationSuccess(true);
      setTimeout(() => {
        setIsLocating(false);
        onAllow();
      }, 700);
    } catch {
      setIsLocating(false);
      onAllow();
    }
  };

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center select-none my-auto">
      <span
        className="mb-3 self-end text-[11px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1"
        style={{
          backgroundColor: `${currentThemeConfig.primaryHex}15`,
          color: currentThemeConfig.primaryHex,
        }}
      >
        <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
        <span>Nearby Discovery</span>
      </span>

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -12 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className={`w-full p-6 sm:p-8 rounded-[36px] border flex flex-col items-center text-center shadow-2xl relative overflow-hidden transition-all ${
          isLight
            ? 'bg-white border-zinc-200/90 shadow-purple-500/10'
            : 'bg-zinc-950 border-zinc-800 shadow-black'
        }`}
      >
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-25"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-15"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        />

        <div className="relative my-4 sm:my-6 flex items-center justify-center">
          <div
            className={`w-48 h-48 sm:w-56 sm:h-56 rounded-[48px] flex items-center justify-center relative transition-all ${
              isLight ? 'bg-[#F4F3F8]' : 'bg-zinc-900/80 border border-zinc-800/80'
            }`}
            style={{
              clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)',
            }}
          >
            <motion.div
              animate={{
                scale: [1, 1.25, 1.4],
                opacity: [0.35, 0.15, 0],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              className="absolute w-28 h-28 rounded-full border-2 pointer-events-none"
              style={{ borderColor: currentThemeConfig.primaryHex }}
            />

            <div
              className="absolute top-5 right-7 w-5 h-5 rounded-full border-2 opacity-50"
              style={{ borderColor: isLight ? '#CBD5E1' : '#64748B' }}
            />
            <div
              className="absolute top-9 left-10 w-2 h-2 rounded-full opacity-40"
              style={{ backgroundColor: isLight ? '#94A3B8' : '#64748B' }}
            />
            <div
              className="absolute bottom-12 left-4 w-4 h-4 rounded-full opacity-35"
              style={{ backgroundColor: isLight ? '#CBD5E1' : '#475569' }}
            />
            <div
              className="absolute bottom-7 right-10 w-2.5 h-2.5 rounded-full opacity-45"
              style={{ backgroundColor: isLight ? '#94A3B8' : '#64748B' }}
            />
            <div
              className="absolute top-16 right-4 w-1.5 h-1.5 rounded-full opacity-40"
              style={{ backgroundColor: isLight ? '#94A3B8' : '#64748B' }}
            />
            <div
              className="absolute bottom-16 right-16 w-2 h-2 rounded-full opacity-30"
              style={{ backgroundColor: isLight ? '#CBD5E1' : '#64748B' }}
            />

            <motion.div
              animate={
                isLocating
                  ? { y: [0, -8, 0], scale: [1, 1.05, 1] }
                  : { y: [0, -4, 0] }
              }
              transition={{
                duration: isLocating ? 0.8 : 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative z-10 flex flex-col items-center filter drop-shadow-[0_12px_18px_rgba(0,0,0,0.16)]"
            >
              <svg
                width="84"
                height="102"
                viewBox="0 0 84 102"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M42 0C18.794 0 0 18.794 0 42C0 67.5 35.8 98.4 39.3 101.4C40.1 102.1 41 102.5 42 102.5C43 102.5 43.9 102.1 44.7 101.4C48.2 98.4 84 67.5 84 42C84 18.794 65.206 0 42 0Z"
                  fill={isLight ? '#FFFFFF' : '#1E293B'}
                  className="transition-colors duration-300"
                />
                <circle
                  cx="42"
                  cy="40"
                  r="17"
                  fill={isLight ? '#F8FAFC' : '#0F172A'}
                />
                <circle
                  cx="42"
                  cy="40"
                  r="10"
                  fill={currentThemeConfig.primaryHex}
                />
              </svg>
            </motion.div>
          </div>
        </div>

        <h2
          className={`text-2xl sm:text-[28px] font-black tracking-tight font-['Outfit',sans-serif] leading-tight mt-2 ${
            isLight ? 'text-zinc-950' : 'text-white'
          }`}
        >
          Would you like to explore places nearby?
        </h2>

        <p
          className={`mt-2.5 text-xs sm:text-sm font-semibold max-w-[280px] leading-relaxed ${
            isLight ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          Share your location to sort nearby salons and available specialists. You can continue without sharing it.
        </p>

        {locationSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Location Detected ({userLocation})</span>
          </motion.div>
        )}

        <div className="w-full mt-7 sm:mt-8 space-y-3">
          <button
            id="btn-allow-location-services"
            type="button"
            disabled={isLocating}
            onClick={handleAllowClick}
            className="w-full py-4 px-6 rounded-full text-white font-extrabold text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-80 cursor-pointer"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 12px 28px -6px ${currentThemeConfig.glowHex}`,
            }}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Locating Nearby Salons...</span>
              </>
            ) : locationSuccess ? (
              <>
                <Check className="w-5 h-5" />
                <span>Location Enabled!</span>
              </>
            ) : (
              <span>Allow Location Services</span>
            )}
          </button>

          <button
            id="btn-maybe-later-location"
            type="button"
            disabled={isLocating}
            onClick={onSkip}
            className={`w-full min-h-11 py-2 text-xs sm:text-sm font-bold tracking-tight transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              isLight
                ? 'text-zinc-600 hover:text-zinc-950'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Maybe later
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 w-full flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Location is optional and is used only to sort nearby salons.</span>
        </div>
      </motion.div>
    </div>
  );
};
