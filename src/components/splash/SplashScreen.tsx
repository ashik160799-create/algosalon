import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlgoLogo } from '../common/AlgoLogo';
import { ThemeSwitcherModal } from '../common/ThemeSwitcherModal';
import { LocaleRegionSwitcherModal } from '../common/LocaleRegionSwitcherModal';
import { LocationPermissionScreen } from './LocationPermissionScreen';
import { CustomerAuthFlow } from '../auth/CustomerAuthFlow';
import { BusinessAuthFlow } from '../auth/BusinessAuthFlow';
import { UnifiedAuthFlow } from '../auth/UnifiedAuthFlow';
import { useApp } from '../../context/AppContext';
import { useScreenAdaptation } from '../../utils/useScreenAdaptation';
import {
  Store,
  Scissors,
  ArrowRight,
  ArrowUp,
  ShieldCheck,
  Palette,
  LogIn,
  CheckCircle2,
  CalendarCheck,
  CreditCard,
  Tag,
  Clock,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronUp,
  Play,
  Pause,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  Star,
  Zap,
  Check,
  Globe,
  Crown,
  TrendingUp,
} from 'lucide-react';

import { supabaseALGOsalonClient } from '../../supabaseALGOsalonClient';
import { del } from 'idb-keyval';
import { getBackgroundImage } from '../../services/supabaseService';

// Primary Screen 2 Background Image from Supabase Storage bucket app-background-images (Direct Public CDN)
const SALON_HAIRCUT_IMAGE = 'https://mmmthrlbikllhdupslrz.supabase.co/storage/v1/object/public/app-background-images/Splash%20Screen%202/Image%202.png';
const APP_BACKGROUNDS_BUCKET = 'app-background-images';

// Global eager preloader & GPU texture decode on script evaluation for instant Screen 2 paint
if (typeof window !== 'undefined') {
  const eagerImg = new Image();
  eagerImg.src = SALON_HAIRCUT_IMAGE;
  if (typeof eagerImg.decode === 'function') {
    eagerImg.decode().catch(() => {});
  }
}

// 4 Signature Platform Benefits for Customer Role
const CUSTOMER_FEATURE_CARDS = [
  {
    id: 'zero_fees',
    title: 'Zero Booking Fees',
    subtitle: '100% free reservations',
    icon: Clock,
  },
  {
    id: 'instant_confirmation',
    title: 'Instant Confirmation',
    subtitle: 'Live slot booking',
    icon: CalendarCheck,
  },
  {
    id: 'pay_at_salon',
    title: 'Pay at Salon',
    subtitle: 'Cash, Card & Online',
    icon: CreditCard,
  },
  {
    id: 'upfront_pricing',
    title: 'Upfront Pricing',
    subtitle: (currency: string, symbol: string) => `In ${currency} (${symbol})`,
    icon: Tag,
  },
];

// 4 Signature Platform Benefits for Salon Business Partner Role
const PARTNER_FEATURE_CARDS = [
  {
    id: 'smart_calendar',
    title: 'Smart Calendar',
    subtitle: 'Live slot & chair booking',
    icon: CalendarCheck,
  },
  {
    id: 'client_growth',
    title: 'Grow Client Reach',
    subtitle: 'Verified local discovery',
    icon: Zap,
  },
  {
    id: 'zero_fixed_fees',
    title: 'Zero Fixed Fees',
    subtitle: 'Pay-as-you-grow model',
    icon: Crown,
  },
  {
    id: 'business_analytics',
    title: 'Salon Analytics',
    subtitle: 'Revenue & staff metrics',
    icon: Store,
  },
];

export const SplashScreen: React.FC = () => {
  const {
    setCurrentRole,
    setShowSplash,
    currentThemeConfig,
    colorThemeMode,
    activeCountry,
    refreshDeviceTelemetry,
    isLocaleModalOpen,
    setIsLocaleModalOpen,
  } = useApp();

  const screen = useScreenAdaptation();

  const [selectedRole, setSelectedRole] = useState<'customer' | 'business'>('customer');
  const [activeFlow, setActiveFlow] = useState<
    'intro' | 'welcome' | 'auth' | 'experience' | 'location_permission' | 'customer_auth' | 'business_auth'
  >(() => {
    try {
      const pending = localStorage.getItem('algosalon_pending_auth');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed?.emailInput || (parsed?.step && parsed.step !== 'email_entry')) {
          return 'auth';
        }
      }
    } catch {
      // ignore
    }
    return 'intro';
  });
  const [pendingAction, setPendingAction] = useState<'explore' | 'signin'>('explore');
  const [flowInitialMode, setFlowInitialMode] = useState<'new' | 'existing'>('new');
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  // Animation phase for the multi-stage intro (0: logo, 1: aura sweep, 2: green crest, 3: barber reveal, 4: welcome screen)
  const [introPhase, setIntroPhase] = useState<number>(() => {
    try {
      const pending = localStorage.getItem('algosalon_pending_auth');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed?.emailInput || (parsed?.step && parsed.step !== 'email_entry')) {
          return 4;
        }
      }
    } catch {
      // ignore
    }
    return 0;
  });
  const [isIntroPlaying, setIsIntroPlaying] = useState<boolean>(() => {
    try {
      const pending = localStorage.getItem('algosalon_pending_auth');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed?.emailInput || (parsed?.step && parsed.step !== 'email_entry')) {
          return false;
        }
      }
    } catch {
      // ignore
    }
    return true;
  });
  const [isIntroPaused, setIsIntroPaused] = useState<boolean>(false);
  const [screen2BgUrl, setScreen2BgUrl] = useState<string>(() => {
    // Clear legacy cached data or deleted old image URL if present
    localStorage.removeItem('algosalon_screen2_bg_cached_data');
    const saved = localStorage.getItem('algosalon_screen2_bg_url');
    if (saved && saved.includes('1788503584034')) {
      localStorage.removeItem('algosalon_screen2_bg_url');
      return SALON_HAIRCUT_IMAGE;
    }
    return saved || SALON_HAIRCUT_IMAGE;
  });
  const introTimerRef = useRef<NodeJS.Timeout[]>([]);

  // Eager preloading & non-blocking public CDN asset sync
  useEffect(() => {
    let mounted = true;

    const preloadImage = (url: string) => {
      if (!url) return;
      const img = new Image();
      img.src = url;
      if (typeof img.decode === 'function') {
        img.decode().catch(() => {});
      }
    };

    // Preload current background into browser cache & GPU memory immediately
    preloadImage(screen2BgUrl);
    if (screen2BgUrl !== SALON_HAIRCUT_IMAGE) {
      preloadImage(SALON_HAIRCUT_IMAGE);
    }

    // Clean up legacy heavy IndexedDB entries in background
    try {
      del('algosalon_screen2_bg_cached_meta_v3').catch(() => {});
      del('algosalon_screen2_bg_cached_data').catch(() => {});
    } catch {
      // Safe ignore
    }

    // Resolve any custom background URL without blocking splash boot
    getBackgroundImage()
      .then((source) => {
        if (mounted && source && source !== screen2BgUrl && !localStorage.getItem('algosalon_screen2_bg_url')) {
          setScreen2BgUrl(source);
          preloadImage(source);
        }
      })
      .catch(() => {});

    const handleBgChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setScreen2BgUrl(customEvent.detail);
        preloadImage(customEvent.detail);
      }
    };
    window.addEventListener('algosalon_bg_changed', handleBgChange);

    return () => {
      mounted = false;
      window.removeEventListener('algosalon_bg_changed', handleBgChange);
    };
  }, [screen2BgUrl]);

  const isLight = colorThemeMode === 'light';
  const primaryColor = currentThemeConfig?.primaryHex || '#0EA36F';
  const glowColor = currentThemeConfig?.glowHex || 'rgba(14,163,111,0.35)';

  // Automatically probe and prepare device telemetry on mount without blocking the user
  useEffect(() => {
    const runAutoPreparation = async () => {
      try {
        await refreshDeviceTelemetry(false);
      } catch {
        // Fallbacks are preserved
      }
    };
    runAutoPreparation();
  }, []);

  // Run the multi-phase animated intro on mount or replay
  const startIntroSequence = useCallback(() => {
    // Clear any active timers
    introTimerRef.current.forEach(clearTimeout);
    introTimerRef.current = [];

    setIntroPhase(0);
    setIsIntroPlaying(true);
    setIsIntroPaused(false);
    setActiveFlow('intro');

    // Stage 0: 0s -> 1.25s (Card 1: Zero Booking Fees)
    const t1 = setTimeout(() => {
      setIntroPhase(1); // Stage 1: 1.25s -> 2.5s (Card 2: Instant Confirmation)
    }, 1250);

    const t2 = setTimeout(() => {
      setIntroPhase(2); // Stage 2: 2.5s -> 3.75s (Card 3: Pay at Salon)
    }, 2500);

    const t3 = setTimeout(() => {
      setIntroPhase(3); // Stage 3: 3.75s -> 5.0s (Card 4: Upfront Pricing)
    }, 3750);

    const t4 = setTimeout(() => {
      setIntroPhase(4); // Stage 4: 5.0s+ (Welcome Splash Screen 2)
      setIsIntroPlaying(false);
      setActiveFlow('welcome');
    }, 5000);

    introTimerRef.current = [t1, t2, t3, t4];
  }, []);

  // 1. On app start (splash screen): check local storage for a saved auth token.
  // - If a valid token exists -> go to Home screen, and restore the last used account type.
  // - If an active signup / verification session exists -> restore directly to auth flow without splash!
  // - If user has already seen intro in this tab session -> skip 5s intro.
  // - If no token exists -> go to Login screen / intro flow without defaulting to Home.
  useEffect(() => {
    const savedToken = localStorage.getItem('algosalon_auth_token');
    if (savedToken) {
      const savedRole = (localStorage.getItem('algosalon_role') as 'customer' | 'business') || 'customer';
      setCurrentRole(savedRole);
      setShowSplash(false);
      return;
    }

    // Check if user was in the middle of email verification or signup
    try {
      const pending = localStorage.getItem('algosalon_pending_auth');
      if (pending) {
        const parsed = JSON.parse(pending);
        if (parsed?.emailInput || (parsed?.step && parsed.step !== 'email_entry')) {
          setActiveFlow('auth');
          setIsIntroPlaying(false);
          setIntroPhase(4);
          return;
        }
      }
    } catch {
      // ignore
    }

    // Check if user already saw or skipped the intro during this browser tab session
    const sessionSeen = sessionStorage.getItem('algosalon_session_intro_seen');
    if (sessionSeen) {
      setIntroPhase(4);
      setIsIntroPlaying(false);
      setActiveFlow('welcome');
      return;
    }

    sessionStorage.setItem('algosalon_session_intro_seen', 'true');

    // No token exists -> start intro sequence and guide user into login
    startIntroSequence();
    return () => {
      introTimerRef.current.forEach(clearTimeout);
    };
  }, [setCurrentRole, setShowSplash, startIntroSequence]);

  // Allow user to skip intro directly to the Welcome screen
  const skipToWelcome = () => {
    introTimerRef.current.forEach(clearTimeout);
    setIntroPhase(4);
    setIsIntroPlaying(false);
    setActiveFlow('welcome');
  };

  // Keyboard navigation support for desktop and laptops (Space/Enter to get started, Esc to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && activeFlow === 'intro') {
        skipToWelcome();
      } else if ((e.key === 'Enter' || e.key === ' ') && activeFlow === 'welcome') {
        e.preventDefault();
        setActiveFlow('auth');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFlow]);

  const handleGetStarted = () => {
    sessionStorage.setItem('algosalon_session_intro_seen', 'true');
    setActiveFlow('auth');
  };

  const handleAuthSuccess = (role: 'customer' | 'business', _isNewUser: boolean) => {
    setSelectedRole(role);
    setCurrentRole(role);
    localStorage.setItem('algosalon_role', role);
    localStorage.setItem('algosalon_seen_splash', 'true');
    localStorage.removeItem('algosalon_pending_auth');
    if (role === 'customer') {
      setActiveFlow('location_permission');
    } else {
      setShowSplash(false);
    }
  };

  const handleDirectExplore = (role: 'customer' | 'business' = 'customer') => {
    const token = localStorage.getItem('algosalon_auth_token');
    setSelectedRole(role);
    setCurrentRole(role);
    if (!token) {
      setPendingAction('explore');
      setActiveFlow('auth');
    } else {
      setPendingAction('explore');
      setActiveFlow('location_permission');
    }
  };

  const handlePrimaryAction = () => {
    const token = localStorage.getItem('algosalon_auth_token');
    setCurrentRole(selectedRole);
    if (!token) {
      setPendingAction('signin');
      setActiveFlow('auth');
    } else {
      setPendingAction('signin');
      setActiveFlow('location_permission');
    }
  };

  const currentCards = selectedRole === 'business' ? PARTNER_FEATURE_CARDS : CUSTOMER_FEATURE_CARDS;
  const activeIntroCard = currentCards[introPhase] || currentCards[0];
  const IntroIcon = activeIntroCard.icon;

  return (
    <div
      id="splash-screen-root"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-y-auto custom-scrollbar select-none"
      style={{
        backgroundColor: isLight ? '#f8fafc' : '#090d16',
        color: isLight ? '#0f172a' : '#f8fafc',
      }}
    >
      {/* Background Ambience and Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[120px] opacity-25 transition-all duration-700"
          style={{ backgroundColor: primaryColor }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[120px] opacity-20 transition-all duration-700"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Top Header Bar */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <AlgoLogo size="sm" showText={true} />
        </div>

        <div className="flex items-center gap-2">
          {/* Region & Language Selector */}
          <button
            type="button"
            id="splash-country-switcher-btn"
            onClick={() => setIsLocaleModalOpen(true)}
            className={`px-3 py-1.5 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-800'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-200'
            }`}
          >
            <span className="text-sm">{activeCountry.flag}</span>
            <span className="hidden sm:inline">{activeCountry.code}</span>
            <span className="text-[11px] text-slate-400 font-mono">({activeCountry.currency})</span>
          </button>

          {/* Theme Palette Switcher */}
          <button
            type="button"
            id="splash-theme-switcher-btn"
            onClick={() => setThemeModalOpen(true)}
            className={`p-2 rounded-full border transition-all cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Switch Theme"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Flow Content */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-2 flex-1 flex flex-col items-center justify-center relative z-20">
        <AnimatePresence mode="wait">
          {/* FLOW 1: INTRO ANIMATION */}
          {activeFlow === 'intro' && (
            <motion.div
              key="intro-flow"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-6"
            >
              {/* Central Dynamic Feature Card */}
              <div
                className={`w-full p-8 rounded-3xl border shadow-2xl transition-all relative overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-slate-200' : 'bg-slate-900/90 border-slate-800 shadow-black'
                }`}
                style={{
                  boxShadow: `0 20px 50px -10px ${glowColor}`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg mb-4"
                  style={{ backgroundColor: primaryColor }}
                >
                  <IntroIcon className="w-8 h-8" />
                </div>

                <h3 className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeIntroCard.title}
                </h3>
                <p className={`text-xs sm:text-sm font-semibold mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {typeof activeIntroCard.subtitle === 'function'
                    ? activeIntroCard.subtitle(activeCountry.currency, activeCountry.currencySymbol)
                    : activeIntroCard.subtitle}
                </p>

                {/* Progress Indicators */}
                <div className="flex items-center justify-center gap-1.5 mt-6">
                  {currentCards.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === introPhase
                          ? 'w-8 bg-emerald-500'
                          : 'w-2 bg-slate-300 dark:bg-slate-700'
                      }`}
                      style={{
                        backgroundColor: idx === introPhase ? primaryColor : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={skipToWelcome}
                  className="px-6 py-2.5 rounded-full text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  Skip to Welcome
                </button>
              </div>
            </motion.div>
          )}

          {/* FLOW 2: WELCOME SCREEN */}
          {activeFlow === 'welcome' && (
            <motion.div
              key="welcome-flow"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="w-full max-w-lg mx-auto flex flex-col items-center text-center space-y-6"
            >
              <div
                className={`w-full p-6 sm:p-8 rounded-[36px] border shadow-2xl relative overflow-hidden transition-all ${
                  isLight ? 'bg-white border-slate-200/90 shadow-slate-200/60' : 'bg-slate-900/95 border-slate-800 shadow-black'
                }`}
                style={{
                  boxShadow: `0 20px 50px -10px ${glowColor}`,
                }}
              >
                {/* Role Switcher Pills */}
                <div
                  className={`p-1.5 rounded-2xl border grid grid-cols-2 gap-1.5 mb-6 ${
                    isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedRole('customer')}
                    className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'customer'
                        ? 'text-white shadow-md'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: selectedRole === 'customer' ? primaryColor : 'transparent',
                    }}
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('business')}
                    className={`py-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedRole === 'business'
                        ? 'text-white shadow-md'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: selectedRole === 'business' ? primaryColor : 'transparent',
                    }}
                  >
                    <Store className="w-4 h-4" />
                    <span>Salon Partner</span>
                  </button>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
                  {currentCards.map(c => {
                    const CardIcon = c.icon;
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                          isLight
                            ? 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="p-2 rounded-xl text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <CardIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-xs sm:text-sm font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {c.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {typeof c.subtitle === 'function'
                              ? c.subtitle(activeCountry.currency, activeCountry.currencySymbol)
                              : c.subtitle}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Primary Action Button */}
                <div className="space-y-3">
                  <button
                    type="button"
                    id="splash-get-started-btn"
                    onClick={handleGetStarted}
                    className="w-full py-4 px-6 rounded-2xl text-white font-black text-sm sm:text-base tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2 group active:scale-[0.98] cursor-pointer"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 12px 28px -6px ${glowColor}`,
                    }}
                  >
                    <span>{selectedRole === 'business' ? 'Enter Partner Portal' : 'Get Started'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDirectExplore(selectedRole)}
                    className={`w-full py-2 text-xs sm:text-sm font-bold transition-colors hover:underline ${
                      isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Explore without account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* FLOW 3: UNIFIED AUTH FLOW */}
          {activeFlow === 'auth' && (
            <motion.div
              key="auth-flow"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className={`w-full max-w-md p-6 sm:p-8 rounded-[36px] border shadow-2xl transition-all ${
                isLight ? 'bg-white border-slate-200 shadow-slate-200' : 'bg-slate-900 border-slate-800 shadow-black'
              }`}
              style={{
                boxShadow: `0 20px 50px -10px ${glowColor}`,
              }}
            >
              <UnifiedAuthFlow
                initialRole={selectedRole}
                initialMode={flowInitialMode}
                onComplete={() => {
                  if (selectedRole === 'customer') {
                    setActiveFlow('location_permission');
                  } else {
                    setShowSplash(false);
                  }
                }}
                onCancel={() => setActiveFlow('welcome')}
              />
            </motion.div>
          )}

          {/* FLOW 4: LOCATION PERMISSION */}
          {activeFlow === 'location_permission' && (
            <LocationPermissionScreen
              targetRole={selectedRole}
              actionType={pendingAction}
              onAllow={() => setShowSplash(false)}
              onSkip={() => setShowSplash(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Copyright */}
      <div className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between text-[11px] text-slate-400 relative z-20">
        <span>© 2026 ALGO SALON Platform</span>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Verified Security</span>
        </div>
      </div>

      {/* Modals */}
      <ThemeSwitcherModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />
      <LocaleRegionSwitcherModal
        isOpen={isLocaleModalOpen}
        onClose={() => setIsLocaleModalOpen(false)}
      />
    </div>
  );
};
