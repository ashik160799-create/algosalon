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
  const contrastColor = currentThemeConfig?.contrastText || '#ffffff';

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
    setSelectedRole('customer');
    setCurrentRole('customer');
    localStorage.setItem('algosalon_role', 'customer');
    setPendingAction('explore');
    setActiveFlow('auth');
  };

  const handleJoinUs = () => {
    sessionStorage.setItem('algosalon_session_intro_seen', 'true');
    setSelectedRole('business');
    setCurrentRole('business');
    localStorage.setItem('algosalon_role', 'business');
    setPendingAction('explore');
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
      setPendingAction('explore');
      setActiveFlow('auth');
    } else {
      setPendingAction('explore');
      setActiveFlow('location_permission');
    }
  };

  const handleSignIn = () => {
    setCurrentRole(selectedRole);
    setPendingAction('signin');
    setActiveFlow('auth');
  };

  const handleLocationResolved = () => {
    localStorage.setItem('algosalon_seen_splash', 'true');
    localStorage.setItem('algosalon_location_prompted', 'true');
    setCurrentRole(selectedRole);
    setShowSplash(false);
  };

  const handleFlowComplete = () => {
    localStorage.setItem('algosalon_seen_splash', 'true');
    setCurrentRole(selectedRole);
    setShowSplash(false);
  };

  // Responsive layout flags
  const isLandscapeCompact = screen.isLandscape && screen.height < 600;
  const isWideDesktop = screen.isDesktop && screen.width >= 1024;

  return (
    <div
      className={`min-h-[100dvh] w-full flex flex-col justify-between relative overflow-x-hidden overflow-y-auto font-['Plus_Jakarta_Sans',sans-serif] select-none transition-colors duration-300 ${
        isLight ? 'bg-[#FAFAFA] text-zinc-950' : 'bg-[#000000] text-white'
      }`}
    >
      {/* Dynamic Background Pattern */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          activeFlow === 'intro' && introPhase >= 3 ? 'opacity-10' : 'opacity-100'
        } ${
          isLight
            ? 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]'
        } bg-[size:28px_28px]`}
      />

      {/* Invisible eager image element ensuring browser preheats texture decoding before Screen 2 appears */}
      <img
        src={screen2BgUrl}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="sr-only pointer-events-none opacity-0 fixed -top-[9999px] -left-[9999px] w-1 h-1"
      />

      {/* Desktop/Tablet Ambient Lighting Aura */}
      {isWideDesktop && (
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-25"
          style={{ backgroundColor: primaryColor }}
        />
      )}

      {/* Top Navigation & Telemetry Bar (Adapts across Mobile, Tablet, Desktop) */}
      {activeFlow !== 'welcome' && activeFlow !== 'intro' && (
        <header className="w-full flex items-center justify-between max-w-5xl mx-auto z-30 pt-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              id="splash-back-btn"
              type="button"
              onClick={() => {
                if (activeFlow === 'auth') {
                  setActiveFlow('welcome');
                } else if (activeFlow === 'location_permission') {
                  setActiveFlow('auth');
                } else if (activeFlow === 'experience') {
                  setActiveFlow('welcome');
                } else {
                  setActiveFlow('welcome');
                }
              }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all shadow-sm cursor-pointer ${
                isLight
                  ? 'bg-white/95 hover:bg-zinc-100 border-zinc-300 text-zinc-900'
                  : 'bg-zinc-900/95 hover:bg-zinc-800 border-zinc-700 text-zinc-100'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Region & Currency Badge */}
            <button
              id="splash-region-btn"
              type="button"
              onClick={() => setIsLocaleModalOpen(true)}
              aria-label="Switch Region and Currency"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm backdrop-blur-md group ${
                isLight
                  ? 'bg-white/95 hover:bg-zinc-100 border-zinc-300 text-zinc-900'
                  : 'bg-zinc-900/95 hover:bg-zinc-800 border-zinc-700 text-zinc-100'
              }`}
              title={`Region: ${activeCountry.name} (${activeCountry.currency})`}
            >
              <span className="text-sm">{activeCountry.flag}</span>
              <span className="font-extrabold text-[11px]">{activeCountry.currency}</span>
            </button>

            {/* Theme Switcher Button */}
            <button
              id="splash-theme-btn"
              type="button"
              onClick={() => setThemeModalOpen(true)}
              aria-label="Open Theme and Color Palette Settings"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm backdrop-blur-md group ${
                isLight
                  ? 'bg-white/95 hover:bg-zinc-100 border-zinc-300 text-zinc-900 hover:text-black'
                  : 'bg-zinc-900/95 hover:bg-zinc-800 border-zinc-700 text-zinc-100 hover:text-white'
              }`}
            >
              <Palette
                className="w-3.5 h-3.5 transition-transform group-hover:rotate-12"
                style={{ color: primaryColor }}
              />
              <span className="hidden xs:inline">Theme</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Responsive Stage */}
      <main className={`w-full flex-1 flex flex-col justify-center items-center relative z-20 my-auto ${activeFlow === 'welcome' || activeFlow === 'intro' ? 'p-0 h-full' : 'px-3 sm:px-6 py-4'}`}>
        <AnimatePresence mode="wait">
          {/* ========================================================= */}
          {/* 1. CINEMATIC MULTI-STAGE INTRO ANIMATION (Edge-to-Edge)   */}
          {/* ========================================================= */}
          {activeFlow === 'intro' && (
            <motion.div
              key="intro_sequence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={skipToWelcome}
              className="w-full h-full min-h-[100dvh] flex-1 flex flex-col justify-between items-center text-center relative overflow-hidden p-0 m-0 cursor-pointer transform-gpu will-change-[opacity]"
            >
              {/* Matched Growing Green Brand Glow Aura behind logo/visual */}
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{
                  opacity: introPhase >= 1 ? [0.25, 0.55, 0.4] : 0,
                  scale: introPhase >= 1 ? [0.7, 1.25, 1.1] : 0.6,
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[90px] pointer-events-none z-10 ${
                  isWideDesktop ? 'w-[520px] h-[520px]' : 'w-80 h-80'
                }`}
                style={{
                  background: `radial-gradient(circle, ${primaryColor} 0%, ${primaryColor}40 50%, transparent 75%)`,
                }}
              />

              {/* Secondary Growing Radial Emerald Pulse for depth */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: introPhase >= 2 ? [0.15, 0.35, 0.2] : 0,
                  scale: introPhase >= 2 ? [0.9, 1.35, 1.05] : 0.8,
                }}
                transition={{
                  duration: 3.8,
                  repeat: Infinity,
                  repeatType: 'mirror',
                  ease: 'easeInOut',
                }}
                className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full blur-[110px] pointer-events-none z-10"
                style={{ backgroundColor: `${primaryColor}55` }}
              />

              {/* Top Header Inside Screen 1 */}
              <header className="relative z-30 w-full max-w-6xl mx-auto flex items-center justify-between pt-2.5 sm:pt-3.5 px-3 sm:px-6">
                <div
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all ${
                    isLight
                      ? 'bg-white/90 border-zinc-200/90 text-zinc-950 shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                      : 'bg-black/85 border-white/20 text-white shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                  }`}
                >
                  <div className="relative flex items-center justify-center">
                    <Globe
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: primaryColor }}
                    />
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-ping"
                      style={{ backgroundColor: primaryColor }}
                    />
                    <span
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs font-extrabold tracking-tight">
                    Worldwide Salon Network
                  </span>

                  {/* Form Factor Adaptive Indicator */}
                  {isWideDesktop && (
                    <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 ml-0.5">
                      <Monitor className="w-2.5 h-2.5" />
                      <span>Responsive Web</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {/* Single Clean Exit Action: Skip Button */}
                  <button
                    id="intro-skip-btn"
                    type="button"
                    onClick={skipToWelcome}
                    aria-label="Skip Intro Animation"
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all backdrop-blur-md group cursor-pointer ${
                      isLight
                        ? 'bg-white/95 hover:bg-zinc-100 border-zinc-200/90 text-zinc-900 shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'bg-black/85 hover:bg-zinc-900/90 border-white/20 text-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                    }`}
                  >
                    <span>Skip</span>
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                  {/* Quick Region & Currency Badge */}
                  <button
                    id="intro-region-btn"
                    type="button"
                    onClick={() => setIsLocaleModalOpen(true)}
                    aria-label="Switch Region and Currency"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all backdrop-blur-md group cursor-pointer ${
                      isLight
                        ? 'bg-white/95 hover:bg-zinc-100 border-zinc-200/90 text-zinc-900 shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'bg-black/85 hover:bg-zinc-900/90 border-white/20 text-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                    }`}
                    title={`Region: ${activeCountry.name} (${activeCountry.currency})`}
                  >
                    <span className="text-xs">{activeCountry.flag}</span>
                    <span className="font-extrabold text-[10px] sm:text-[11px]">{activeCountry.currency}</span>
                  </button>

                  {/* Theme Switcher Button */}
                  <button
                    id="intro-theme-btn"
                    type="button"
                    onClick={() => setThemeModalOpen(true)}
                    aria-label="Open Theme and Color Palette Settings"
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all backdrop-blur-md group cursor-pointer ${
                      isLight
                        ? 'bg-white/95 hover:bg-zinc-100 border-zinc-200/90 text-zinc-900 hover:text-black shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'bg-black/85 hover:bg-zinc-900/90 border-white/20 text-zinc-100 hover:text-white shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                    }`}
                  >
                    <Palette
                      className="w-3 h-3 transition-transform group-hover:rotate-12"
                      style={{ color: primaryColor }}
                    />
                    <span className="hidden xs:inline">Theme</span>
                  </button>
                </div>
              </header>

              {/* Centered Logo & Branding Assembly with Balanced Vertical Rhythm */}
              <div className="my-auto flex flex-col items-center justify-center z-20 text-center max-w-lg px-4">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center"
                >
                  {/* Logo Squircle Icon */}
                  <div
                    className={`relative p-2.5 sm:p-3 rounded-[28px] sm:rounded-[36px] border shadow-2xl transition-all duration-500 ${
                      isLight
                        ? 'bg-white border-zinc-200/90 shadow-emerald-500/15'
                        : 'bg-zinc-950 border-zinc-800 shadow-black'
                    }`}
                  >
                    <AlgoLogo
                      size={screen.isMobile && screen.width < 380 ? 'lg' : 'splash'}
                      showText={false}
                    />
                  </div>

                  {/* Typography: "ALGO [SALON]" + "BY SPOT-PRO" */}
                  <div className="mt-4 inline-flex flex-col items-end">
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <span
                        className={`text-3xl sm:text-5xl font-black tracking-tight font-['Outfit',sans-serif] ${
                          isLight ? 'text-zinc-950' : 'text-white'
                        }`}
                      >
                        ALGO
                      </span>
                      <span
                        className="px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-xl font-black text-2xl sm:text-4xl tracking-tight shadow-xl font-['Outfit',sans-serif] uppercase"
                        style={{
                          backgroundColor: primaryColor,
                          color: contrastColor,
                          boxShadow: `0 8px 24px -4px ${glowColor}`,
                        }}
                      >
                        SALON
                      </span>
                    </div>

                    {/* BY SPOT-PRO tagline */}
                    <p
                      className={`mt-1.5 text-[10px] sm:text-xs font-black tracking-[0.24em] uppercase font-sans text-right self-end pr-1 sm:pr-1.5 ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      BY SPOT-PRO
                    </p>
                  </div>
                </motion.div>

                {/* Multi-stage animation progress dots */}
                <div className="mt-5 flex items-center justify-center gap-2">
                  {[0, 1, 2, 3].map((step) => (
                    <button
                      key={step}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIntroPhase(step);
                      }}
                      aria-label={`Step ${step + 1}: ${(selectedRole === 'business' ? PARTNER_FEATURE_CARDS : CUSTOMER_FEATURE_CARDS)[step]?.title}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        introPhase === step
                          ? 'w-7 shadow-md'
                          : introPhase > step
                          ? 'w-2.5 opacity-70'
                          : 'w-2.5 opacity-30'
                      }`}
                      style={{
                        backgroundColor:
                          introPhase === step
                            ? primaryColor
                            : isLight
                            ? '#27272a'
                            : '#ffffff',
                      }}
                    />
                  ))}
                </div>

                {/* 4 Cards sliding automatically with direct interactive carousel support */}
                <div className="mt-3.5 w-full max-w-[290px] sm:max-w-[320px] h-[68px] sm:h-[72px] relative flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    {introPhase <= 3 && (() => {
                      const activeIndex = Math.min(Math.max(introPhase, 0), 3);
                      const featureCards = selectedRole === 'business' ? PARTNER_FEATURE_CARDS : CUSTOMER_FEATURE_CARDS;
                      const activeCard = featureCards[activeIndex] || featureCards[0];
                      const IconComponent = activeCard.icon;
                      const subtitleText =
                        typeof activeCard.subtitle === 'function'
                          ? activeCard.subtitle(activeCountry.currency, activeCountry.symbol)
                          : activeCard.subtitle;

                      return (
                        <motion.div
                          key={`intro_card_${activeCard.id}_${activeIndex}`}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                          className="w-full absolute inset-0 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIntroPhase((prev) => (prev + 1) % 4);
                          }}
                        >
                          <div
                            className={`w-full h-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${
                              isLight
                                ? 'bg-zinc-50/95 border-zinc-300/90 shadow-sm hover:border-zinc-400'
                                : 'bg-zinc-900/95 border-zinc-800/90 shadow-md hover:border-zinc-700'
                            }`}
                          >
                            <div
                              className="p-2 rounded-xl shrink-0 flex items-center justify-center"
                              style={{
                                backgroundColor: `${primaryColor}20`,
                                color: primaryColor,
                              }}
                            >
                              <IconComponent className="w-4 h-4 shrink-0" />
                            </div>
                            <div className="min-w-0 flex-1 flex flex-col items-center justify-center text-center">
                              <span
                                className={`block text-xs sm:text-sm font-extrabold leading-snug text-center truncate w-full ${
                                  isLight ? 'text-zinc-950' : 'text-white'
                                }`}
                              >
                                {activeCard.title}
                              </span>
                              <span
                                className={`block text-[11px] font-medium leading-tight mt-0.5 text-center truncate w-full ${
                                  isLight ? 'text-zinc-700' : 'text-zinc-300'
                                }`}
                              >
                                {subtitleText}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom Subtle Navigation Prompt */}
              <motion.footer
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="z-30 pb-4 sm:pb-6 pt-1 flex flex-col items-center gap-1.5 px-4"
              >
                <span
                  className={`text-[11px] sm:text-xs font-medium tracking-wide ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  Swipe cards or tap dots to explore • Tap Skip anytime
                </span>
              </motion.footer>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 2. THE WELCOME / GET STARTED SCREEN (Splash Screen 2)     */}
          {/* ========================================================= */}
          {activeFlow === 'welcome' && (
            <motion.div
              key="welcome_screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="w-full h-full min-h-[100dvh] flex-1 flex flex-col justify-between items-center text-center relative overflow-hidden p-0 m-0 transform-gpu will-change-[opacity]"
            >
              {/* Background Salon Haircut Photography with Crisp Balanced Gradient & Ambient Aura */}
              <div className="absolute inset-0 z-0 overflow-hidden transform-gpu">
                {/* Haircut Photography - Crisp, deliberate, and clearly visible */}
                <img
                  src={screen2BgUrl}
                  alt="Professional stylist cutting client hair with scissors and comb in salon"
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== SALON_HAIRCUT_IMAGE) {
                      target.src = SALON_HAIRCUT_IMAGE;
                    }
                  }}
                  className="w-full h-full object-cover object-[center_32%] transition-transform duration-700 opacity-100 dark:opacity-95 transform-gpu"
                />

                {/* Refined gradient scrim allowing photography to shine through while ensuring AA text contrast */}
                <div
                  className={`absolute inset-0 transition-colors duration-500 ${
                    isLight
                      ? 'bg-gradient-to-b from-white/10 via-white/15 to-white/92 backdrop-blur-[0.3px]'
                      : 'bg-gradient-to-b from-black/80 via-black/45 to-black/92 backdrop-blur-[0.3px]'
                  }`}
                />

                {/* Primary Growing Green Radiant Aura */}
                <motion.div
                  initial={{ scale: 0.85, opacity: 0.25 }}
                  animate={{
                    opacity: [0.25, 0.55, 0.25],
                    scale: [0.9, 1.25, 0.9],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    repeatType: 'reverse',
                    ease: 'easeInOut',
                  }}
                  className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] sm:w-[540px] h-[380px] sm:h-[540px] rounded-full blur-[110px] pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${primaryColor} 0%, ${primaryColor}35 50%, transparent 80%)`,
                  }}
                />

                {/* Secondary Bottom Ambient Glow */}
                <motion.div
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.85, 1.2, 0.85],
                  }}
                  transition={{
                    duration: 2.8,
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                  }}
                  className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[320px] sm:w-[440px] h-[240px] rounded-full blur-[90px] pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse at bottom, ${primaryColor} 0%, ${primaryColor}30 60%, transparent 80%)`,
                  }}
                />
              </div>

              {/* Top Section: Header & Top-Left 'Welcome' Heading (Occupies top region down to ~50% device center line) */}
              <div className="relative z-20 w-full flex flex-col justify-start shrink-0 min-h-[36vh] sm:min-h-[40vh]">
                {/* Header: Top Right Replay Intro Button Only */}
                <header className="w-full max-w-6xl mx-auto flex items-center justify-end pt-2.5 sm:pt-3.5 px-3 sm:px-6">
                  <div
                    className={`hidden flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all ${
                      isLight
                        ? 'bg-white/90 border-zinc-200/90 text-zinc-950 shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                        : 'bg-black/85 border-white/20 text-white shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      <Globe
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: primaryColor }}
                      />
                      <span
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-ping"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                    <span className="text-[11px] sm:text-xs font-extrabold tracking-tight">
                      Worldwide Salon Network
                    </span>

                    {/* Form Factor Adaptive Indicator */}
                    {isWideDesktop && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80 text-zinc-800 dark:text-zinc-300 ml-0.5">
                        <Monitor className="w-2.5 h-2.5" />
                        <span>Responsive Web</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 sm:gap-1.5">
                    {/* Replay Intro Icon Button - Floating without background container */}
                    <button
                      id="welcome-replay-intro-btn"
                      type="button"
                      onClick={startIntroSequence}
                      aria-label="Replay Intro Animation"
                      title="Replay Intro Animation"
                      className="flex items-center justify-center p-1.5 rounded-full transition-all group cursor-pointer text-zinc-900 hover:text-black hover:scale-110 active:scale-95 bg-transparent border-0 shadow-none focus:outline-none"
                    >
                      <RotateCcw className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:-rotate-90 transition-transform duration-300 drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)]" />
                    </button>

                    {/* Quick Region & Currency Badge */}
                    <button
                      id="welcome-region-btn"
                      type="button"
                      onClick={() => setIsLocaleModalOpen(true)}
                      aria-label="Switch Region and Currency"
                      className={`hidden items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all backdrop-blur-md group cursor-pointer ${
                        isLight
                          ? 'bg-white/95 hover:bg-zinc-100 border-zinc-200/90 text-zinc-900 shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                          : 'bg-black/85 hover:bg-zinc-900/90 border-white/20 text-zinc-100 shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                      }`}
                      title={`Region: ${activeCountry.name} (${activeCountry.currency})`}
                    >
                      <span className="text-xs">{activeCountry.flag}</span>
                      <span className="font-extrabold text-[10px] sm:text-[11px]">{activeCountry.currency}</span>
                    </button>

                    {/* Theme Switcher Button */}
                    <button
                      id="welcome-theme-btn"
                      type="button"
                      onClick={() => setThemeModalOpen(true)}
                      aria-label="Open Theme and Color Palette Settings"
                      className={`hidden items-center gap-1 px-2 py-1 rounded-lg sm:rounded-xl border text-[11px] sm:text-xs font-bold transition-all backdrop-blur-md group cursor-pointer ${
                        isLight
                          ? 'bg-white/95 hover:bg-zinc-100 border-zinc-200/90 text-zinc-900 hover:text-black shadow-[0_1px_6px_rgba(255,255,255,0.9),0_1px_3px_rgba(0,0,0,0.05)]'
                          : 'bg-black/85 hover:bg-zinc-900/90 border-white/20 text-zinc-100 hover:text-white shadow-[0_0_8px_rgba(255,255,255,0.18),0_1px_3px_rgba(255,255,255,0.22)]'
                      }`}
                    >
                      <Palette
                        className="w-3 h-3 transition-transform group-hover:rotate-12"
                        style={{ color: primaryColor }}
                      />
                      <span className="hidden xs:inline">Theme</span>
                    </button>
                  </div>
                </header>

              </div>

              {/* Middle Section Spacer: Preserves exact page alignment without text obscuring background image */}
              <div className="relative z-20 flex-1 w-full pointer-events-none" />

              {/* Bottom Footer Area */}
              <footer className="relative z-20 w-full max-w-md mx-auto text-center pt-2 pb-4 sm:pb-6 px-4 flex flex-col items-center gap-3.5">
                {/* 3. Position Alignment: 'Get Started' CTA Button directly above '100% Verified Salons' */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="w-full max-w-sm relative"
                >
                  {/* Glowing halo behind Get Started button */}
                  <motion.div
                    animate={{
                      scale: [1, 1.06, 1],
                      opacity: [0.45, 0.85, 0.45],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      ease: 'easeInOut',
                    }}
                    className="absolute inset-0 rounded-2xl sm:rounded-full blur-md -z-10 pointer-events-none"
                    style={{
                      backgroundColor: primaryColor,
                    }}
                  />

                  <button
                    id="welcome-get-started-btn"
                    type="button"
                    onClick={handleGetStarted}
                    className="w-full py-3.5 sm:py-4 px-8 rounded-2xl sm:rounded-full text-zinc-950 font-black text-lg sm:text-xl tracking-tight transition-all duration-200 shadow-2xl flex items-center justify-center gap-3 group active:scale-[0.98] cursor-pointer hover:brightness-105"
                    style={{
                      backgroundColor: primaryColor,
                      boxShadow: `0 12px 30px -4px ${glowColor}`,
                    }}
                  >
                    <span>Get Started</span>
                    <motion.div
                      animate={{
                        y: [0, -3, 0],
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        repeatType: 'mirror',
                        ease: 'easeInOut',
                      }}
                      className="flex items-center justify-center bg-zinc-950/15 p-1 rounded-full"
                    >
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-0.5" />
                    </motion.div>
                  </button>
                </motion.div>

                {/* Business Partner Link: 'Are you a Shop business Partner ? join us' */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold relative px-2 -mt-1"
                >
                  <span
                    className="text-zinc-900 font-extrabold tracking-tight"
                    style={{
                      textShadow: '0 0 8px #FFFFFF, 0 0 16px rgba(255, 255, 255, 0.95)',
                    }}
                  >
                    Are you a Shop business Partner ?
                  </span>
                  <button
                    id="welcome-join-partner-btn"
                    type="button"
                    onClick={handleJoinUs}
                    className="inline-flex items-center gap-1 font-black underline underline-offset-4 hover:opacity-85 transition-all cursor-pointer group active:scale-95"
                    style={{
                      color: primaryColor,
                      textShadow: '0 0 8px #FFFFFF, 0 0 16px rgba(255, 255, 255, 0.95)',
                    }}
                  >
                    <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span>join us</span>
                  </button>
                </motion.div>

                {/* '100% Verified Salons' Security & Copyright */}
                <div className="w-full flex flex-col items-center justify-center gap-1.5 relative px-2">
                  {/* Soft White Glow behind Security & Copyright text: 90% center, 60% mid-diffusion */}
                  <div
                    className="absolute inset-0 -inset-x-4 rounded-full blur-[20px] pointer-events-none -z-10"
                    style={{
                      background: 'radial-gradient(ellipse, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.65) 60%, transparent 85%)',
                    }}
                  />
                  <div
                    className="text-[10.5px] xs:text-[11px] sm:text-xs md:text-sm font-black text-black tracking-tight leading-snug text-center flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1"
                    style={{
                      textShadow: '0 0 8px #FFFFFF, 0 0 16px rgba(255, 255, 255, 0.95)',
                    }}
                  >
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <ShieldCheck
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 drop-shadow-[0_0_6px_rgba(255,255,255,0.95)]"
                        style={{ color: primaryColor }}
                      />
                      <span>100% Verified Salons</span>
                    </span>
                    <span className="text-zinc-600 font-bold select-none">•</span>
                    <span className="whitespace-nowrap">100% Safe &amp; Encrypted</span>
                    <span className="text-zinc-600 font-bold select-none">•</span>
                    <span className="whitespace-nowrap">100% Free Booking</span>
                  </div>
                  <p
                    className="text-[10px] sm:text-[11px] font-black tracking-wide text-zinc-950 text-center"
                    style={{
                      textShadow: '0 0 6px #FFFFFF, 0 0 12px rgba(255, 255, 255, 0.9)',
                    }}
                  >
                    © 2026 ALGO SALON by Spot-Pro • All Rights Reserved
                  </p>
                </div>
              </footer>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3. SCREEN 3: NEW AUTH SCREEN (Unified Google / Email)     */}
          {/* ========================================================= */}
          {activeFlow === 'auth' && (
            <motion.div
              key="screen3_auth_portal"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col items-center justify-center text-center my-auto ${
                isWideDesktop ? 'max-w-lg' : 'max-w-md'
              }`}
            >
              <UnifiedAuthFlow
                initialRole={selectedRole}
                onAuthSuccess={handleAuthSuccess}
                onBackToWelcome={() => {
                  localStorage.removeItem('algosalon_pending_auth');
                  setActiveFlow('welcome');
                }}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 4. EXPERIENCE & ROLE SELECTOR (Clean, High Affordance)     */}
          {/* ========================================================= */}
          {activeFlow === 'experience' && (
            <motion.div
              key="experience_portal"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col items-center justify-center text-center my-auto ${
                isWideDesktop ? 'max-w-lg' : 'max-w-md'
              } ${
                isLight
                  ? 'bg-white/95 border border-zinc-200/90 rounded-3xl p-5 sm:p-7 shadow-xl shadow-zinc-200/60 backdrop-blur-md'
                  : 'bg-zinc-950/90 border border-zinc-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black backdrop-blur-md'
              }`}
            >
              {/* Logo Header */}
              <div className="flex flex-col items-center mb-4 sm:mb-5">
                <div
                  className={`p-2 rounded-2xl border transition-all duration-300 shadow-md ${
                    isLight
                      ? 'bg-white border-zinc-200 shadow-zinc-300/40'
                      : 'bg-zinc-950 border-zinc-800 shadow-black'
                  }`}
                >
                  <AlgoLogo size="md" showText={false} />
                </div>
                {/* Typography: "ALGO [SALON]" + "BY SPOT-PRO" matching Screen 1 alignment */}
                <div className="mt-2 inline-flex flex-col items-end">
                  <div className="flex items-center justify-center gap-2">
                    <span
                      className={`text-2xl sm:text-3xl font-black tracking-tight font-['Outfit',sans-serif] ${
                        isLight ? 'text-zinc-950' : 'text-white'
                      }`}
                    >
                      ALGO
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-lg font-black text-xl sm:text-2xl tracking-tight shadow-md font-['Outfit',sans-serif] uppercase"
                      style={{
                        backgroundColor: primaryColor,
                        color: contrastColor,
                        boxShadow: `0 4px 14px -2px ${glowColor}`,
                      }}
                    >
                      SALON
                    </span>
                  </div>
                  <span
                    className={`mt-1 text-[10px] sm:text-[11px] font-black tracking-[0.24em] uppercase font-sans text-right self-end pr-0.5 ${
                      isLight ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    BY SPOT-PRO
                  </span>
                </div>
                <p
                  className={`mt-1 text-xs font-semibold tracking-wide ${
                    isLight ? 'text-zinc-600' : 'text-zinc-400'
                  }`}
                >
                  Select your role to continue
                </p>
              </div>

              {/* Role Selection Cards with High Clickable Affordance */}
              <div className="w-full grid grid-cols-2 gap-3 mb-4">
                {/* Customer Role Card */}
                <button
                  id="splash-role-customer"
                  type="button"
                  onClick={() => setSelectedRole('customer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer group ${
                    selectedRole === 'customer'
                      ? isLight
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : isLight
                      ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        backgroundColor:
                          selectedRole === 'customer'
                            ? `${primaryColor}25`
                            : isLight
                            ? '#e4e4e7'
                            : '#27272a',
                        color:
                          selectedRole === 'customer'
                            ? primaryColor
                            : isLight
                            ? '#3f3f46'
                            : '#d4d4d8',
                      }}
                    >
                      <Scissors className="w-4 h-4" />
                    </div>
                    {selectedRole === 'customer' && (
                      <CheckCircle2
                        className="w-4 h-4 shrink-0"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`block text-xs sm:text-sm font-extrabold ${
                        selectedRole === 'customer'
                          ? isLight
                            ? 'text-zinc-950'
                            : 'text-white'
                          : isLight
                          ? 'text-zinc-800'
                          : 'text-zinc-200'
                      }`}
                    >
                      I&apos;m a Customer
                    </span>
                    <span
                      className={`block text-[11px] font-medium leading-tight mt-0.5 ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      Book top salons &amp; stylists
                    </span>
                  </div>
                </button>

                {/* Salon Partner Role Card */}
                <button
                  id="splash-role-business"
                  type="button"
                  onClick={() => setSelectedRole('business')}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between relative cursor-pointer group ${
                    selectedRole === 'business'
                      ? isLight
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                      : isLight
                      ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                      : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-2">
                    <div
                      className="p-2 rounded-xl"
                      style={{
                        backgroundColor:
                          selectedRole === 'business'
                            ? `${primaryColor}25`
                            : isLight
                            ? '#e4e4e7'
                            : '#27272a',
                        color:
                          selectedRole === 'business'
                            ? primaryColor
                            : isLight
                            ? '#3f3f46'
                            : '#d4d4d8',
                      }}
                    >
                      <Store className="w-4 h-4" />
                    </div>
                    {selectedRole === 'business' && (
                      <CheckCircle2
                        className="w-4 h-4 shrink-0"
                        style={{ color: primaryColor }}
                      />
                    )}
                  </div>
                  <div>
                    <span
                      className={`block text-xs sm:text-sm font-extrabold ${
                        selectedRole === 'business'
                          ? isLight
                            ? 'text-zinc-950'
                            : 'text-white'
                          : isLight
                          ? 'text-zinc-800'
                          : 'text-zinc-200'
                      }`}
                    >
                      Salon Partner
                    </span>
                    <span
                      className={`block text-[11px] font-medium leading-tight mt-0.5 ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      Manage slots, staff &amp; growth
                    </span>
                  </div>
                </button>
              </div>

              {/* 2 Streamlined Key Value Highlights (Role-Specific) */}
              <div className="w-full mb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`role_highlights_${selectedRole}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="w-full grid grid-cols-2 gap-2 text-left"
                  >
                    {(selectedRole === 'customer'
                      ? [
                          {
                            icon: ShieldCheck,
                            title: 'Zero Booking Fees',
                            desc: '100% free reservations',
                          },
                          {
                            icon: Zap,
                            title: 'Instant Confirmation',
                            desc: 'Guaranteed salon slots',
                          },
                        ]
                      : [
                          {
                            icon: Sparkles,
                            title: 'Smart Calendar',
                            desc: 'Live slots & staff rosters',
                          },
                          {
                            icon: TrendingUp,
                            title: 'Grow Client Reach',
                            desc: 'Zero fixed listing fees',
                          },
                        ]
                    ).map((highlight, idx) => {
                      const Icon = highlight.icon;
                      return (
                        <div
                          key={`highlight_${idx}`}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                            isLight
                              ? 'bg-zinc-50 border-zinc-200'
                              : 'bg-zinc-900/80 border-zinc-800'
                          }`}
                        >
                          <Icon
                            className="w-3.5 h-3.5 shrink-0"
                            style={{ color: primaryColor }}
                          />
                          <div className="min-w-0 flex-1">
                            <span
                              className={`block text-[11px] font-extrabold truncate ${
                                isLight ? 'text-zinc-950' : 'text-white'
                              }`}
                            >
                              {highlight.title}
                            </span>
                            <span
                              className={`block text-[10px] font-medium truncate ${
                                isLight ? 'text-zinc-600' : 'text-zinc-400'
                              }`}
                            >
                              {highlight.desc}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Primary Action Button */}
              <div className="w-full">
                <button
                  id="splash-primary-cta-btn"
                  type="button"
                  onClick={handlePrimaryAction}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-2xl font-extrabold text-base sm:text-lg tracking-tight transition-all duration-200 shadow-xl flex items-center justify-center gap-2.5 group active:scale-[0.99] cursor-pointer"
                  style={{
                    backgroundColor: primaryColor,
                    color: contrastColor,
                    boxShadow: `0 12px 24px -4px ${glowColor}`,
                  }}
                >
                  <span>
                    {selectedRole === 'customer'
                      ? 'Explore & Book Salons'
                      : 'Enter Business Portal'}
                  </span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Sign In Link */}
              <div className="mt-3.5 flex items-center justify-center gap-1.5 text-xs font-semibold">
                <span className={isLight ? 'text-zinc-600' : 'text-zinc-400'}>
                  Already registered?
                </span>
                <button
                  id="splash-signin-link"
                  type="button"
                  onClick={handleSignIn}
                  className="underline underline-offset-4 hover:opacity-80 transition-opacity font-extrabold flex items-center gap-1 cursor-pointer"
                  style={{ color: primaryColor }}
                >
                  <LogIn className="w-3.5 h-3.5 inline" />
                  <span>
                    {selectedRole === 'customer'
                      ? 'Sign In as Customer'
                      : 'Sign In as Salon Partner'}
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 4. NEARBY LOCATION PERMISSION                             */}
          {/* ========================================================= */}
          {activeFlow === 'location_permission' && (
            <motion.div
              key="location_permission_flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className={`w-full flex flex-col items-center justify-center text-center my-auto ${isWideDesktop ? 'max-w-lg' : 'max-w-md'}`}
            >
              <LocationPermissionScreen
                targetRole={selectedRole}
                actionType={pendingAction}
                onAllow={handleLocationResolved}
                onSkip={handleLocationResolved}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 5. CUSTOMER AUTHENTICATION                                */}
          {/* ========================================================= */}
          {activeFlow === 'customer_auth' && (
            <motion.div
              key="customer_auth_flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className={`w-full p-5 sm:p-6 rounded-3xl border shadow-2xl transition-all my-auto ${
                isWideDesktop ? 'max-w-lg' : 'max-w-md'
              } ${
                isLight
                  ? 'bg-white border-zinc-200 text-zinc-950 shadow-zinc-300/50'
                  : 'bg-zinc-950 border-zinc-800 text-white shadow-black'
              }`}
            >
              <CustomerAuthFlow
                initialMode={flowInitialMode}
                onComplete={handleFlowComplete}
                onCancel={() => setActiveFlow('welcome')}
              />
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 6. SALON BUSINESS AUTHENTICATION                          */}
          {/* ========================================================= */}
          {activeFlow === 'business_auth' && (
            <motion.div
              key="business_auth_flow"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className={`w-full p-5 sm:p-6 rounded-3xl border shadow-2xl transition-all my-auto ${
                isWideDesktop ? 'max-w-lg' : 'max-w-md'
              } ${
                isLight
                  ? 'bg-white border-zinc-200 text-zinc-950 shadow-zinc-300/50'
                  : 'bg-zinc-950 border-zinc-800 text-white shadow-black'
              }`}
            >
              <BusinessAuthFlow
                initialMode={flowInitialMode}
                onComplete={handleFlowComplete}
                onCancel={() => setActiveFlow('welcome')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Universal Footer with Security & Copyright */}
      {activeFlow !== 'welcome' && (
        <footer className="w-full max-w-5xl mx-auto text-center z-20 pb-3 px-4">
          <div className="flex flex-col items-center justify-center gap-1">
            <p
              className={`text-xs font-semibold flex items-center justify-center gap-1.5 ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}
            >
              <ShieldCheck
                className="w-4 h-4 shrink-0"
                style={{ color: primaryColor }}
              />
              <span>100% Verified Salons • Safe & Encrypted</span>
            </p>

            <p
              className={`text-[10px] font-medium tracking-wide ${
                isLight ? 'text-zinc-500' : 'text-zinc-400'
              }`}
            >
              © 2026 ALGO SALON by Spot-Pro • All Rights Reserved
            </p>
          </div>
        </footer>
      )}

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
