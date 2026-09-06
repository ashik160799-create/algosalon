import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Role,
  CustomerUser,
  BusinessUser,
  Salon,
  ServiceItem,
  StaffMember,
  Appointment,
  Review,
  NotificationItem,
  AppointmentStatus,
  ColorThemeId,
  ColorThemeMode,
  ThemeConfig,
} from '../types';
import { THEME_PRESETS, getContrastTextColor } from '../utils/themeConfig';
import { getRecommendedAiBanner } from '../utils/aiBannerGenerator';
import {
  CountryLocaleData,
  COUNTRY_LOCALE_REGISTRY,
  DetectedRegionResult,
  detectDeviceRegion,
  formatLocalizedPrice,
  SupportedLanguage,
  TRANSLATIONS,
  getCurrencyInfo,
  SUPPORTED_CURRENCIES,
} from '../utils/localeConfig';
import {
  DeviceTelemetryProfile,
  probeInitialDeviceData,
  attemptGpsEnhancement,
  persistDeviceTelemetry,
  syncDeviceData,
} from '../utils/deviceDetection';
import {
  INITIAL_CUSTOMER,
  INITIAL_BUSINESS_USER,
  INITIAL_SALONS,
  INITIAL_SERVICES,
  INITIAL_STAFF,
  INITIAL_APPOINTMENTS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS,
} from '../data/mockData';
import {
  RegisteredAccount,
  getRegisteredAccounts,
  findAccountByEmail,
  isEmailRegistered,
  registerNewAccount,
  updateAccountAppCode,
  updateRegisteredAccount,
  accountToCustomerUser,
  accountToBusinessUser,
  normalizeEmail,
  deleteAccountByEmail,
  generateSecurePin,
} from '../utils/accountRegistry';
import {
  parseTimeSlotHoursMinutes,
  getLocalDateString,
  salonTimeToUtcInstant,
  getSalonTimezone,
} from '../utils/dateTimeUtils';
import { supabaseALGOsalonClient, isSupabaseConfigured } from '../supabaseALGOsalonClient';
import {
  fetchSalonsFromDb,
  createBookingInDb,
  setAppointmentStatusInDb,
  subscribeToAppointments,
  fetchAppointmentsFromDb,
  fetchReviewsFromDb,
  createReviewInDb,
  updateSalonRatingInDb,
  replyToReviewInDb,
  subscribeToReviews,
  fetchFavoritesFromDb,
  addFavoriteInDb,
  removeFavoriteInDb,
  fetchNotificationsFromDb,
  createNotificationInDb,
  markNotificationReadInDb,
  markAllNotificationsReadInDb,
  deleteNotificationInDb,
  clearAllNotificationsInDb,
  subscribeToNotifications,
  addServiceInDb,
  updateServiceInDb,
  deleteServiceInDb,
  addStaffInDb,
  updateStaffInDb,
  deleteStaffInDb,
  updateSalonProfileInDb,
  registerBusinessSalonInDb,
  fetchBusinessProfileFromDb,
  fetchCustomerProfileFromDb,
  updateCustomerProfileInDb,
  syncAccountIdentityToSupabase,
  deleteAccountInSupabase,
  signOutSupabase,
} from '../services/supabaseService';
import { calculateDistanceKm } from '../utils/salonUtils';

interface AppContextType {
  activeColorTheme: ColorThemeId;
  setActiveColorTheme: (themeId: ColorThemeId) => void;
  colorThemeMode: ColorThemeMode;
  setColorThemeMode: (mode: ColorThemeMode) => void;
  toggleColorThemeMode: () => void;
  currentThemeConfig: ThemeConfig;

  activeCountry: CountryLocaleData;
  activeCountryCode: string;
  setActiveCountryCode: (code: string) => void;
  activeLanguage: SupportedLanguage;
  setActiveLanguage: (lang: SupportedLanguage) => void;
  customCurrency: string | null;
  setCustomCurrency: (currency: string | null) => void;
  customDialCode: string | null;
  setCustomDialCode: (dialCode: string | null) => void;
  currencyCode: string;
  setManualOverride: (settings: {
    countryCode?: string;
    language?: SupportedLanguage;
    currency?: string | null;
    dialCode?: string | null;
  }) => void;
  isAutoRegionEnabled: boolean;
  setIsAutoRegionEnabled: (enabled: boolean) => void;
  detectedLocaleInfo: DetectedRegionResult;
  deviceTelemetry: DeviceTelemetryProfile;
  refreshDeviceTelemetry: (allowGpsPrompt?: boolean) => Promise<DeviceTelemetryProfile>;
  syncDeviceDataNow: () => DeviceTelemetryProfile;
  lastDeviceSyncTime: string;
  isDeviceAutoSyncActive: boolean;
  setIsDeviceAutoSyncActive: (active: boolean) => void;
  resetToDeviceLocale: () => void;
  formatPrice: (amountInAED: number, options?: { useNativeSymbol?: boolean; compact?: boolean; overrideCurrencyCode?: string }) => string;
  t: (key: string, fallback?: string) => string;
  currencySymbol: string;
  dialCode: string;
  isLocaleModalOpen: boolean;
  setIsLocaleModalOpen: (open: boolean) => void;

  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  switchRole: (targetRole: Role) => boolean;
  authToken: string | null;
  isAuthenticated: boolean;
  checkIsAuthenticated: () => boolean;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authMode: 'login' | 'signup';
  setAuthMode: (mode: 'login' | 'signup') => void;
  authTargetRole: Role;
  setAuthTargetRole: (role: Role) => void;

  roleSwitchModalOpen: boolean;
  roleSwitchTarget: Role | null;
  roleSwitchAccount: RegisteredAccount | null;
  promptRoleSwitch: (targetRole: Role) => void;
  closeRoleSwitchModal: () => void;
  confirmRoleSwitch: () => void;

  customerUser: CustomerUser;
  businessUser: BusinessUser;
  clearAllSessionData: () => void;
  signupCustomer: (user: Partial<CustomerUser>, token?: string) => CustomerUser;
  signupBusiness: (user: Partial<BusinessUser>, salonData?: Partial<Salon>, token?: string) => BusinessUser;
  fetchFreshUserProfile: (tokenOverride?: string) => {
    customer: CustomerUser;
    business: BusinessUser;
    role: Role;
    token: string | null;
  };
  updateCustomerProfile: (updates: Partial<CustomerUser>) => void;
  updateBusinessProfile: (updates: Partial<BusinessUser>) => void;
  loginAsCustomer: (user: Partial<CustomerUser>, token?: string) => void;
  loginAsBusiness: (user: Partial<BusinessUser>, salonId?: string, token?: string) => void;
  logout: () => void;
  logoutCustomer: () => void;
  logoutBusiness: () => void;
  deleteAccount: () => Promise<boolean>;

  salons: Salon[];
  selectedSalon: Salon | null;
  setSelectedSalon: (salon: Salon | null) => void;
  updateSalonProfile: (salonId: string, updates: Partial<Salon>) => void;
  toggleFavoriteSalon: (salonId: string) => void;

  services: ServiceItem[];
  addService: (service: Omit<ServiceItem, 'id'>) => void;
  updateService: (serviceId: string, updates: Partial<ServiceItem>) => void;
  deleteService: (serviceId: string) => void;

  staffMembers: StaffMember[];
  addStaffMember: (staff: Omit<StaffMember, 'id'>) => void;
  updateStaffMember: (staffId: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (staffId: string) => void;

  appointments: Appointment[];
  createAppointment: (
    data: Omit<Appointment, 'id' | 'createdAt' | 'status'>,
    initialStatus?: AppointmentStatus
  ) => Promise<{ success: boolean; appointmentId?: string; error?: string }>;
  updateAppointmentStatus: (
    appointmentId: string,
    status: AppointmentStatus,
    reason?: string
  ) => Promise<{ success: boolean; error?: string }>;
  acceptAppointment: (appointmentId: string) => void;
  suggestNewAppointmentTime: (appointmentId: string, newDate: string, newTimeSlot: string, note?: string) => void;
  declineAppointment: (appointmentId: string, reason: string, apology?: string) => void;
  customerAcceptSuggestedTime: (appointmentId: string) => void;
  customerDeclineSuggestedTime: (appointmentId: string, note?: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  isCustomerVip: (customerIdOrName: string, salonId?: string) => boolean;
  getCustomerCompletedCount: (customerIdOrName: string, salonId?: string) => number;

  reviews: Review[];
  addReview: (
    review: Omit<Review, 'id' | 'date'>
  ) => Promise<{ success: boolean; reviewId?: string; error?: string }>;
  replyToReview: (reviewId: string, replyMessage: string) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (role?: Role) => void;
  deleteNotification: (id: string) => void;
  clearAllNotifications: (role?: Role) => void;

  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  activeCustomerTab: 'discover' | 'bookings' | 'saved' | 'profile';
  setActiveCustomerTab: (tab: 'discover' | 'bookings' | 'saved' | 'profile') => void;

  activeBusinessTab: 'overview' | 'calendar' | 'services' | 'staff' | 'hours' | 'reviews' | 'profile' | 'reports' | 'settings' | 'customers';
  setActiveBusinessTab: (tab: 'overview' | 'calendar' | 'services' | 'staff' | 'hours' | 'reviews' | 'profile' | 'reports' | 'settings' | 'customers') => void;

  bookingModalOpen: boolean;
  setBookingModalOpen: (open: boolean) => void;
  preselectedSalon: Salon | null;
  setPreselectedSalon: (salon: Salon | null) => void;
  preselectedService: ServiceItem | null;
  setPreselectedService: (service: ServiceItem | null) => void;
  preselectedStaff: StaffMember | null;
  setPreselectedStaff: (staff: StaffMember | null) => void;

  userLocation: string;
  setUserLocation: (loc: string) => void;
  locationPermissionGranted: boolean | null;
  setLocationPermissionGranted: (granted: boolean | null) => void;
  requestLocationPermission: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CONTEXT_DEFAULT_WORKING_HOURS = [
  { day: 'Monday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Tuesday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Wednesday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Thursday', isOpen: true, open: '09:00', close: '21:00' },
  { day: 'Friday', isOpen: true, open: '09:00', close: '22:00' },
  { day: 'Saturday', isOpen: true, open: '09:00', close: '22:00' },
  { day: 'Sunday', isOpen: true, open: '10:00', close: '19:00' },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Probed system & device data initialized immediately without blocking UI
  const [deviceTelemetry, setDeviceTelemetry] = useState<DeviceTelemetryProfile>(() => {
    const saved = localStorage.getItem('algosalon_device_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return probeInitialDeviceData();
  });

  const detectedLocaleInfo = React.useMemo(() => detectDeviceRegion(), []);

  const [isAutoRegionEnabled, setIsAutoRegionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('algosalon_auto_region');
    return saved !== null ? saved === 'true' : true;
  });

  const [activeCountryCode, setActiveCountryCodeState] = useState<string>(() => {
    const saved = localStorage.getItem('algosalon_country_code');
    if (saved && COUNTRY_LOCALE_REGISTRY[saved]) {
      return saved;
    }
    return deviceTelemetry.countryCode || detectedLocaleInfo.countryCode || 'AE';
  });

  const [activeLanguage, setActiveLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('algosalon_app_language') as SupportedLanguage;
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
    return deviceTelemetry.language || (detectedLocaleInfo.languageCode as SupportedLanguage) || 'en';
  });

  const [customCurrency, setCustomCurrencyState] = useState<string | null>(() => {
    return localStorage.getItem('algosalon_custom_currency');
  });

  const [customDialCode, setCustomDialCodeState] = useState<string | null>(() => {
    return localStorage.getItem('algosalon_custom_dial_code');
  });

  const [isLocaleModalOpen, setIsLocaleModalOpen] = useState(false);

  const activeCountry = COUNTRY_LOCALE_REGISTRY[activeCountryCode] || COUNTRY_LOCALE_REGISTRY.AE;
  const currencyCode = customCurrency || activeCountry.currency;
  const currencySymbol = customCurrency ? getCurrencyInfo(customCurrency).symbol : activeCountry.symbol;
  const dialCode = customDialCode || activeCountry.dialCode;

  const setCustomCurrency = (curr: string | null) => {
    setCustomCurrencyState(curr);
    if (curr) {
      localStorage.setItem('algosalon_custom_currency', curr);
      setIsAutoRegionEnabled(false);
      localStorage.setItem('algosalon_auto_region', 'false');
    } else {
      localStorage.removeItem('algosalon_custom_currency');
    }
  };

  const setCustomDialCode = (dial: string | null) => {
    setCustomDialCodeState(dial);
    if (dial) {
      localStorage.setItem('algosalon_custom_dial_code', dial);
      setIsAutoRegionEnabled(false);
      localStorage.setItem('algosalon_auto_region', 'false');
    } else {
      localStorage.removeItem('algosalon_custom_dial_code');
    }
  };

  const setActiveCountryCode = (code: string) => {
    if (COUNTRY_LOCALE_REGISTRY[code]) {
      setActiveCountryCodeState(code);
      localStorage.setItem('algosalon_country_code', code);
      setIsAutoRegionEnabled(false);
      localStorage.setItem('algosalon_auto_region', 'false');
    }
  };

  const setActiveLanguage = (lang: SupportedLanguage) => {
    if (TRANSLATIONS[lang]) {
      setActiveLanguageState(lang);
      localStorage.setItem('algosalon_app_language', lang);
      setIsAutoRegionEnabled(false);
      localStorage.setItem('algosalon_auto_region', 'false');
    }
  };

  const setManualOverride = (settings: {
    countryCode?: string;
    language?: SupportedLanguage;
    currency?: string | null;
    dialCode?: string | null;
  }) => {
    setIsAutoRegionEnabled(false);
    localStorage.setItem('algosalon_auto_region', 'false');

    if (settings.countryCode && COUNTRY_LOCALE_REGISTRY[settings.countryCode]) {
      setActiveCountryCodeState(settings.countryCode);
      localStorage.setItem('algosalon_country_code', settings.countryCode);
    }

    if (settings.language && TRANSLATIONS[settings.language]) {
      setActiveLanguageState(settings.language);
      localStorage.setItem('algosalon_app_language', settings.language);
    }

    if (settings.currency !== undefined) {
      setCustomCurrencyState(settings.currency);
      if (settings.currency) {
        localStorage.setItem('algosalon_custom_currency', settings.currency);
      } else {
        localStorage.removeItem('algosalon_custom_currency');
      }
    }

    if (settings.dialCode !== undefined) {
      setCustomDialCodeState(settings.dialCode);
      if (settings.dialCode) {
        localStorage.setItem('algosalon_custom_dial_code', settings.dialCode);
      } else {
        localStorage.removeItem('algosalon_custom_dial_code');
      }
    }
  };

  const [lastDeviceSyncTime, setLastDeviceSyncTime] = useState<string>(() => {
    return localStorage.getItem('algosalon_last_device_sync') || new Date().toISOString();
  });

  const [isDeviceAutoSyncActive, setIsDeviceAutoSyncActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('algosalon_device_auto_sync');
    return saved !== null ? saved === 'true' : true;
  });

  const refreshDeviceTelemetry = async (allowGpsPrompt: boolean = false): Promise<DeviceTelemetryProfile> => {
    const base = probeInitialDeviceData();
    let enhanced = base;

    if (allowGpsPrompt && typeof navigator !== 'undefined' && navigator.geolocation) {
      enhanced = await attemptGpsEnhancement(base, 3500);
    }

    setDeviceTelemetry(enhanced);
    persistDeviceTelemetry(enhanced);
    setLastDeviceSyncTime(enhanced.timestamp);

    if (isAutoRegionEnabled) {
      setActiveCountryCodeState(enhanced.countryCode);
      setActiveLanguageState(enhanced.language);
      setUserLocation(enhanced.zoneLocation);
      localStorage.setItem('algosalon_user_location', enhanced.zoneLocation);
      setCustomCurrencyState(null);
      setCustomDialCodeState(null);
      localStorage.removeItem('algosalon_custom_currency');
      localStorage.removeItem('algosalon_custom_dial_code');
    }

    return enhanced;
  };

  /**
   * Automatically synchronizes device data with local system state.
   * Runs non-intrusively in background and updates telemetry & local persistence.
   */
  const syncDeviceDataNow = React.useCallback((): DeviceTelemetryProfile => {
    let syncedProfile: DeviceTelemetryProfile = probeInitialDeviceData();

    setDeviceTelemetry(prev => {
      syncedProfile = syncDeviceData(prev);
      persistDeviceTelemetry(syncedProfile);
      return syncedProfile;
    });

    const nowIso = new Date().toISOString();
    setLastDeviceSyncTime(nowIso);

    // If auto region is enabled, align active country/language seamlessly
    if (isAutoRegionEnabled && syncedProfile.countryCode) {
      setActiveCountryCodeState(syncedProfile.countryCode);
      setActiveLanguageState(syncedProfile.language);
      setUserLocation(syncedProfile.zoneLocation);
      localStorage.setItem('algosalon_user_location', syncedProfile.zoneLocation);
      localStorage.setItem('algosalon_country_code', syncedProfile.countryCode);
      localStorage.setItem('algosalon_app_language', syncedProfile.language);
    }

    return syncedProfile;
  }, [isAutoRegionEnabled]);

  /**
   * Device Data Auto-Sync Timer/Interval
   * Automatically syncs device data every 10 seconds (10,000 ms) in the background.
   */
  useEffect(() => {
    if (!isDeviceAutoSyncActive) return;

    // Run initial synchronization
    syncDeviceDataNow();

    // Set up recurring 10-second interval timer
    const intervalTimer = setInterval(() => {
      syncDeviceDataNow();
    }, 10000);

    return () => {
      clearInterval(intervalTimer);
    };
  }, [isDeviceAutoSyncActive, syncDeviceDataNow]);

  useEffect(() => {
    localStorage.setItem('algosalon_device_auto_sync', String(isDeviceAutoSyncActive));
  }, [isDeviceAutoSyncActive]);

  const resetToDeviceLocale = () => {
    const initial = probeInitialDeviceData();
    setDeviceTelemetry(initial);
    persistDeviceTelemetry(initial);
    setActiveCountryCodeState(initial.countryCode);
    setActiveLanguageState(initial.language);
    setCustomCurrencyState(null);
    setCustomDialCodeState(null);
    setIsAutoRegionEnabled(true);
    setUserLocation(initial.zoneLocation);
    localStorage.setItem('algosalon_user_location', initial.zoneLocation);
    localStorage.setItem('algosalon_country_code', initial.countryCode);
    localStorage.setItem('algosalon_app_language', initial.language);
    localStorage.setItem('algosalon_auto_region', 'true');
    localStorage.removeItem('algosalon_custom_currency');
    localStorage.removeItem('algosalon_custom_dial_code');
  };

  useEffect(() => {
    const isArabic = activeLanguage === 'ar';
    document.documentElement.setAttribute('lang', activeLanguage);
    document.documentElement.setAttribute('dir', isArabic ? 'rtl' : 'ltr');
  }, [activeLanguage]);

  useEffect(() => {
    localStorage.setItem('algosalon_auto_region', String(isAutoRegionEnabled));
  }, [isAutoRegionEnabled]);

  const formatPrice = (
    amountInAED: number,
    options?: { useNativeSymbol?: boolean; compact?: boolean; overrideCurrencyCode?: string }
  ): string => {
    return formatLocalizedPrice(amountInAED, activeCountry, {
      overrideCurrencyCode: options?.overrideCurrencyCode || customCurrency || undefined,
      ...options,
    });
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || fallback || key;
  };

  const pendingReviewPromises = useRef<
    Map<string, Promise<{ success: boolean; reviewId?: string; error?: string }>>
  >(new Map());

  const [activeColorTheme, setActiveColorTheme] = useState<ColorThemeId>(() => {
    const saved = localStorage.getItem('algosalon_color_theme');
    return (saved as ColorThemeId) || 'emerald';
  });

  const [colorThemeMode, setColorThemeMode] = useState<ColorThemeMode>(() => {
    const saved = localStorage.getItem('algosalon_theme_mode');
    return (saved as ColorThemeMode) || 'light';
  });

  const toggleColorThemeMode = () => {
    setColorThemeMode(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const currentThemeConfig = THEME_PRESETS[activeColorTheme] || THEME_PRESETS.emerald;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeColorTheme);
    const contrastColor = currentThemeConfig.contrastText || getContrastTextColor(currentThemeConfig.primaryHex);
    document.documentElement.style.setProperty('--theme-primary', currentThemeConfig.primaryHex);
    document.documentElement.style.setProperty('--theme-secondary', currentThemeConfig.secondaryHex);
    document.documentElement.style.setProperty('--theme-accent', currentThemeConfig.accentHex);
    document.documentElement.style.setProperty('--theme-primary-glow', currentThemeConfig.glowHex);
    document.documentElement.style.setProperty('--theme-contrast-text', contrastColor);
    localStorage.setItem('algosalon_color_theme', activeColorTheme);
  }, [activeColorTheme, currentThemeConfig]);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', colorThemeMode);
    if (colorThemeMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('algosalon_theme_mode', colorThemeMode);
  }, [colorThemeMode]);

  const [authToken, setAuthToken] = useState<string | null>(() => {
    const token = localStorage.getItem('algosalon_auth_token');
    if (isSupabaseConfigured() && token && token.startsWith('algosalon_tk_')) {
      localStorage.removeItem('algosalon_auth_token');
      return null;
    }
    return token;
  });

  const isAuthenticated = Boolean(
    authToken && (!isSupabaseConfigured() || !authToken.startsWith('algosalon_tk_'))
  );

  const checkIsAuthenticated = (): boolean => {
    const token = localStorage.getItem('algosalon_auth_token');
    if (!token) return false;
    if (isSupabaseConfigured() && token.startsWith('algosalon_tk_')) {
      return false;
    }
    return true;
  };

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // 1. On app start: check local storage for a saved auth token.
    // If a valid token exists -> go to Home screen (showSplash = false)
    // If returning from Google OAuth or Magic link redirect -> go to app (showSplash = false)
    // If no token exists -> go to Login / Splash screen (showSplash = true)
    const token = localStorage.getItem('algosalon_auth_token');
    if (token && (!isSupabaseConfigured() || !token.startsWith('algosalon_tk_'))) {
      return false;
    }
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      if (
        hash.includes('access_token') ||
        hash.includes('type=') ||
        hash.includes('refresh_token') ||
        search.includes('code=')
      ) {
        return false;
      }
    }
    return true;
  });

  const [currentRole, setCurrentRole] = useState<Role>(() => {
    const saved = (localStorage.getItem('algosalon_role') as Role) || 'customer';
    if (saved === 'business') {
      const registered = getRegisteredAccounts();
      const hasRealBiz = registered.some(
        a => a.role === 'business' && a.email && !['marcus@algosalon.com', 'partner@algosalon.com'].includes(a.email.toLowerCase())
      );
      if (!hasRealBiz) {
        localStorage.setItem('algosalon_role', 'customer');
        return 'customer';
      }
    }
    return saved;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authTargetRole, setAuthTargetRole] = useState<Role>('customer');

  const [roleSwitchModalOpen, setRoleSwitchModalOpen] = useState(false);
  const [roleSwitchTarget, setRoleSwitchTarget] = useState<Role | null>(null);
  const [roleSwitchAccount, setRoleSwitchAccount] = useState<RegisteredAccount | null>(null);

  const [customerUser, setCustomerUser] = useState<CustomerUser>(() => {
    const saved = localStorage.getItem('algosalon_customer');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_CUSTOMER;
      }
    }
    return INITIAL_CUSTOMER;
  });

  const [businessUser, setBusinessUser] = useState<BusinessUser>(() => {
    const saved = localStorage.getItem('algosalon_business_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.email && ['marcus@algosalon.com', 'partner@algosalon.com'].includes(parsed.email.toLowerCase())) {
          return INITIAL_BUSINESS_USER;
        }
        return parsed;
      } catch {
        return INITIAL_BUSINESS_USER;
      }
    }
    return INITIAL_BUSINESS_USER;
  });

  const [salons, setSalons] = useState<Salon[]>(() => {
    const saved = localStorage.getItem('algosalon_salons');
    if (saved) {
      try {
        const parsed: Salon[] = JSON.parse(saved);
        // Clear out deprecated unsplash stock logo presets if still in storage
        return parsed.map(s => {
          if (
            s.logo &&
            (s.logo.includes('photo-1599305445671-ac291c95aaa9') ||
              s.logo.includes('photo-1522337360788-8b13dee7a37e') ||
              s.logo.includes('photo-1503951914875-452162b0f3f1') ||
              s.logo.includes('photo-1585747860715-2ba37e788b70'))
          ) {
            return { ...s, logo: '' };
          }
          return s;
        });
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_SALONS;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_SALONS;
  });

  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('algosalon_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_SERVICES;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_SERVICES;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('algosalon_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_STAFF;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_STAFF;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('algosalon_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_APPOINTMENTS;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_APPOINTMENTS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('algosalon_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_REVIEWS;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_REVIEWS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('algosalon_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return isSupabaseConfigured() ? [] : INITIAL_NOTIFICATIONS;
      }
    }
    return isSupabaseConfigured() ? [] : INITIAL_NOTIFICATIONS;
  });

  // ---------------------------------------------------------------------------
  // Live Supabase Cloud Sync & Real-time Subscriptions
  // (Hydrates live database rows when connected; seamlessly preserves local storage otherwise)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    let isMounted = true;

    // 1. Hydrate published salons, services, and staff
    fetchSalonsFromDb().then(result => {
      if (!isMounted || !result) return;
      if (result.salons && result.salons.length > 0) {
        setSalons(result.salons);
        setBusinessUser(prev =>
          prev.salonId === 'salon-1' || !prev.salonId
            ? { ...prev, salonId: result.salons[0].id }
            : prev
        );
      }
      if (result.services && result.services.length > 0) setServices(result.services);
      if (result.staff && result.staff.length > 0) setStaffMembers(result.staff);
    }).catch(err => {
      console.warn('[AppContext] Failed to hydrate salons from db:', err);
    });

    // 2. Hydrate appointments (replace initial mock data with live database appointments)
    fetchAppointmentsFromDb().then(liveApts => {
      if (!isMounted || !liveApts) return;
      setAppointments(prev => {
        const nonMock = prev.filter(a => !a.id.startsWith('apt-'));
        const liveIds = new Set(liveApts.map(a => a.id));
        const unsynced = nonMock.filter(a => !liveIds.has(a.id));
        const combined = [...liveApts, ...unsynced];
        localStorage.setItem('algosalon_appointments', JSON.stringify(combined));
        return combined;
      });
    }).catch(err => {
      console.warn('[AppContext] Failed to hydrate appointments from db:', err);
    });

    // 3. Hydrate reviews (replace initial mock reviews with live database reviews)
    fetchReviewsFromDb().then(liveReviews => {
      if (!isMounted || !liveReviews) return;
      setReviews(prev => {
        const nonMock = prev.filter(r => !r.id.startsWith('rev-'));
        const liveIds = new Set(liveReviews.map(r => r.id));
        const unsynced = nonMock.filter(r => !liveIds.has(r.id));
        const combined = [...liveReviews, ...unsynced];
        localStorage.setItem('algosalon_reviews', JSON.stringify(combined));
        return combined;
      });
    }).catch(err => {
      console.warn('[AppContext] Failed to hydrate reviews from db:', err);
    });

    // 4. Real-time Reviews subscription
    const unsubscribeReviews = subscribeToReviews(() => {
      if (!isMounted) return;
      fetchReviewsFromDb().then(liveReviews => {
        if (!isMounted || !liveReviews) return;
        setReviews(prev => {
          const nonMock = prev.filter(r => !r.id.startsWith('rev-'));
          const liveIds = new Set(liveReviews.map(r => r.id));
          const unsynced = nonMock.filter(r => !liveIds.has(r.id));
          const combined = [...liveReviews, ...unsynced];
          localStorage.setItem('algosalon_reviews', JSON.stringify(combined));
          return combined;
        });
      }).catch(err => {
        console.warn('[AppContext] Failed to refresh reviews on realtime update:', err);
      });
    });

    // 5. Real-time updates via Supabase WebSockets
    const unsubscribeAppointments = subscribeToAppointments(payload => {
      if (!isMounted) return;
      if (payload.eventType === 'INSERT' && payload.new) {
        const row = payload.new;
        setAppointments(prev => {
          if (prev.some(a => a.id === row.id)) return prev;
          const startDate = new Date(row.starts_at);
          const endDate = row.ends_at ? new Date(row.ends_at) : null;
          const durationMinutes = (endDate && !isNaN(endDate.getTime()) && !isNaN(startDate.getTime()))
            ? Math.max(15, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
            : 45;
          const dateStr = getLocalDateString(startDate);
          const timeSlotStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
          const newApt: Appointment = {
            id: row.id,
            salonId: row.salon_id,
            salonName: 'ALGO Salon',
            salonAddress: 'Downtown',
            salonPhone: '',
            salonImage: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600',
            customerId: row.customer_id || 'guest',
            customerName: row.customer_display_name || 'Client',
            customerPhone: row.customer_phone_e164 || '',
            customerEmail: row.customer_email || '',
            serviceId: row.service_id,
            serviceName: row.service_name || 'Service',
            servicePrice: Math.round((row.quoted_price_minor || 0) / 100),
            durationMinutes,
            staffId: row.staff_id,
            staffName: row.staff_name || 'Staff',
            staffAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            date: dateStr,
            timeSlot: timeSlotStr,
            status: row.status as AppointmentStatus,
            paymentMethod: row.payment_method || 'pay_at_salon',
            notes: row.customer_notes,
            createdAt: row.created_at,
          };
          return [newApt, ...prev];
        });
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        const row = payload.new;
        setAppointments(prev =>
          prev.map(a => {
            if (a.id !== row.id) return a;
            const startDate = new Date(row.starts_at);
            const dateStr = !isNaN(startDate.getTime()) ? getLocalDateString(startDate) : a.date;
            const timeSlotStr = !isNaN(startDate.getTime())
              ? `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`
              : a.timeSlot;

            let suggestedDate: string | undefined;
            let suggestedTimeSlot: string | undefined;
            if (row.proposed_starts_at) {
              const propStart = new Date(row.proposed_starts_at);
              if (!isNaN(propStart.getTime())) {
                suggestedDate = getLocalDateString(propStart);
                suggestedTimeSlot = `${String(propStart.getHours()).padStart(2, '0')}:${String(propStart.getMinutes()).padStart(2, '0')}`;
              }
            }

            return {
              ...a,
              date: dateStr,
              timeSlot: timeSlotStr,
              status: row.status as AppointmentStatus,
              declineReason: row.decline_reason,
              suggestedDate,
              suggestedTimeSlot,
              suggestedNote: row.status === 'rescheduled_by_business' ? row.decline_reason : undefined,
            };
          })
        );
      }
    });

    // 6. Real-time Supabase Auth state changes (handles Google OAuth redirect & email verification)
    const { data: authSubscription } = supabaseALGOsalonClient.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_OUT') {
          setAuthToken(null);
          localStorage.removeItem('algosalon_auth_token');
          setCustomerUser(INITIAL_CUSTOMER);
          setBusinessUser(INITIAL_BUSINESS_USER);
          return;
        }

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') && session?.user) {
          const authUser = session.user;
          const userEmail = authUser.email || '';
          const userName =
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            userEmail.split('@')[0] ||
            'Valued Client';
          // Extract Google OAuth profile picture from avatar_url or standard OpenID picture claim
          const userAvatar = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '';

          // Role determination: check local registry, pending OAuth intent, and Supabase salon membership
          const metaRole = authUser.user_metadata?.role;
          const regAccount = findAccountByEmail(userEmail);
          const bizProfile = await fetchBusinessProfileFromDb(authUser.id);
          const pendingOAuthRole = typeof window !== 'undefined' ? localStorage.getItem('algosalon_pending_oauth_role') : null;
          if (pendingOAuthRole) {
            localStorage.removeItem('algosalon_pending_oauth_role');
          }

          const isBusiness =
            regAccount?.role === 'business' ||
            (!regAccount && (pendingOAuthRole === 'business' || !!bizProfile || metaRole === 'business'));

          let custProfile: any = null;

          if (isBusiness) {
            const chosenAvatar = userAvatar || regAccount?.avatar || '';
            const resolvedBizPhone =
              bizProfile?.phone ||
              authUser.phone ||
              authUser.user_metadata?.phone ||
              regAccount?.phone ||
              '';
            const resolvedBizName =
              regAccount?.businessName ||
              bizProfile?.businessName ||
              authUser.user_metadata?.business_name ||
              'My Salon Studio';
            const resolvedOwnerName =
              regAccount?.name ||
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              (userName !== userEmail.split('@')[0] ? userName : 'Salon Director');
            const resolvedBizAppCode =
              authUser.user_metadata?.app_code ||
              regAccount?.appCode ||
              '';

            const bizData: Partial<BusinessUser> = {
              id: authUser.id,
              name: resolvedOwnerName,
              email: userEmail,
              signUpGmail: userEmail,
              isGmailLinked: true,
              phone: resolvedBizPhone,
              businessName: resolvedBizName,
              salonId: regAccount?.salonId || bizProfile?.salonId || salons[0]?.id || 'salon-1',
              ownerRole: regAccount?.ownerRole || bizProfile?.ownerRole || 'Owner & Salon Director',
              appCode: resolvedBizAppCode,
            };

            setBusinessUser(prev => ({ ...prev, ...bizData }));
            localStorage.setItem('algosalon_business_user', JSON.stringify({ ...INITIAL_BUSINESS_USER, ...bizData }));
            setCurrentRole('business');
            localStorage.setItem('algosalon_role', 'business');

            if (!regAccount) {
              registerNewAccount({
                id: authUser.id,
                email: userEmail,
                role: 'business',
                name: resolvedOwnerName,
                businessName: resolvedBizName,
                phone: resolvedBizPhone,
                appCode: resolvedBizAppCode,
                avatar: chosenAvatar,
              });
            } else {
              updateRegisteredAccount(userEmail, {
                id: authUser.id,
                name: resolvedOwnerName,
                businessName: resolvedBizName,
                phone: resolvedBizPhone,
                appCode: resolvedBizAppCode,
                avatar: chosenAvatar,
              });
              if (resolvedBizAppCode) {
                updateAccountAppCode(userEmail, resolvedBizAppCode);
              }
            }
          } else {
            // Customer role: fetch profile from public.profiles and auth metadata
            custProfile = await fetchCustomerProfileFromDb(authUser.id);
            const chosenAvatar = userAvatar || custProfile?.avatar || regAccount?.avatar || '';
            const resolvedName =
              custProfile?.name ||
              authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              regAccount?.name ||
              (userName !== userEmail.split('@')[0] ? userName : 'Valued Client');
            const resolvedPhone =
              custProfile?.phone ||
              authUser.phone ||
              authUser.user_metadata?.phone ||
              regAccount?.phone ||
              '';
            const resolvedGender =
              custProfile?.gender ||
              authUser.user_metadata?.gender ||
              regAccount?.gender ||
              'Male';
            const resolvedAppCode =
              authUser.user_metadata?.app_code ||
              regAccount?.appCode ||
              '';

            const custData: CustomerUser = {
              id: authUser.id,
              email: userEmail,
              name: resolvedName,
              phone: resolvedPhone,
              avatar: chosenAvatar,
              gender: resolvedGender as any,
              dateOfBirth: regAccount?.dateOfBirth || '',
              nationality: regAccount?.nationality || '',
              appCode: resolvedAppCode,
              savedSalonIds: custProfile?.savedSalonIds || [],
              loyaltyPoints: custProfile?.loyaltyPoints || 0,
            };

            setCustomerUser(custData);
            localStorage.setItem('algosalon_customer', JSON.stringify(custData));
            setCurrentRole('customer');
            localStorage.setItem('algosalon_role', 'customer');

            // Ensure account exists in accountRegistry
            if (!regAccount) {
              registerNewAccount({
                id: authUser.id,
                email: userEmail,
                role: 'customer',
                name: resolvedName,
                phone: resolvedPhone,
                gender: resolvedGender,
                appCode: resolvedAppCode,
                avatar: chosenAvatar,
              });
            } else {
              updateRegisteredAccount(userEmail, {
                id: authUser.id,
                name: resolvedName,
                phone: resolvedPhone,
                gender: resolvedGender,
                appCode: resolvedAppCode,
                avatar: chosenAvatar,
              });
              if (resolvedAppCode) {
                updateAccountAppCode(userEmail, resolvedAppCode);
              }
            }
          }

          if (session.access_token) {
            setAuthToken(session.access_token);
            localStorage.setItem('algosalon_auth_token', session.access_token);

            const isGoogleOAuth = authUser.app_metadata?.provider === 'google';
            const hasCompleteProfile = !!(
              authUser.user_metadata?.app_code ||
              regAccount?.appCode ||
              (isBusiness ? !!bizProfile : !!custProfile?.name)
            );

            if (isGoogleOAuth && hasCompleteProfile) {
              setShowSplash(false);
              setAuthModalOpen(false);
              localStorage.removeItem('algosalon_pending_auth');
            } else if (!hasCompleteProfile) {
              // Incomplete profile (e.g. newly verified magic link): guide user to complete profile & PIN
              const targetRole = isBusiness ? 'business' : 'customer';
              setAuthTargetRole(targetRole);
              setAuthMode('signup');
              setAuthModalOpen(true);
              setShowSplash(false);
            } else {
              setShowSplash(false);
              setAuthModalOpen(false);
              localStorage.removeItem('algosalon_pending_auth');
            }

            // Clean OAuth & Magic Link hash or code from URL
            if (typeof window !== 'undefined') {
              const hash = window.location.hash || '';
              const search = window.location.search || '';
              if (hash.includes('access_token') || hash.includes('error=') || search.includes('code=') || search.includes('error=')) {
                window.history.replaceState(null, '', window.location.pathname);
              }
            }
          }

          fetchFavoritesFromDb(authUser.id).then(liveFavs => {
            if (!isMounted || !liveFavs) return;
            setCustomerUser(prev => ({
              ...prev,
              savedSalonIds: Array.from(new Set([...prev.savedSalonIds, ...liveFavs])),
            }));
          }).catch(err => {
            console.warn('[AppContext] Failed to fetch favorites for authUser:', err);
          });

          fetchNotificationsFromDb(authUser.id).then(liveNotifs => {
            if (!isMounted || !liveNotifs) return;
            setNotifications(prev => {
              const nonMock = prev.filter(n => n.id !== 'notif-1' && n.id !== 'notif-2');
              const liveIds = new Set(liveNotifs.map(n => n.id));
              const unsynced = nonMock.filter(n => !liveIds.has(n.id));
              const combined = [...liveNotifs, ...unsynced];
              localStorage.setItem('algosalon_notifications', JSON.stringify(combined));
              return combined;
            });
          }).catch(err => {
            console.warn('[AppContext] Failed to fetch notifications for authUser:', err);
          });
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribeAppointments();
      unsubscribeReviews();
      authSubscription?.subscription?.unsubscribe();
    };
  }, []);

  // Hydrate user-specific favorites & notifications whenever user or role changes
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    let isMounted = true;

    if (customerUser?.id) {
      fetchFavoritesFromDb(customerUser.id).then(liveFavs => {
        if (!isMounted || !liveFavs || liveFavs.length === 0) return;
        setCustomerUser(prev => ({
          ...prev,
          savedSalonIds: Array.from(new Set([...prev.savedSalonIds, ...liveFavs])),
        }));
      }).catch(err => {
        console.warn('[AppContext] Failed to fetch favorites for customerUser:', err);
      });
    }

    const currentUserId = currentRole === 'customer' ? customerUser?.id : businessUser?.id;
    if (currentUserId) {
      fetchNotificationsFromDb(currentUserId, currentRole).then(liveNotifs => {
        if (!isMounted || !liveNotifs) return;
        setNotifications(prev => {
          const nonMock = prev.filter(n => n.id !== 'notif-1' && n.id !== 'notif-2');
          const liveIds = new Set(liveNotifs.map(n => n.id));
          const unsynced = nonMock.filter(n => !liveIds.has(n.id));
          const combined = [...liveNotifs, ...unsynced];
          localStorage.setItem('algosalon_notifications', JSON.stringify(combined));
          return combined;
        });
      }).catch(err => {
        console.warn('[AppContext] Failed to fetch notifications for user/role:', err);
      });

      const unsubscribeUserNotifs = subscribeToNotifications(currentUserId, notif => {
        if (!isMounted) return;
        setNotifications(prev => {
          if (prev.some(n => n.id === notif.id)) return prev;
          return [notif, ...prev];
        });
      });

      return () => {
        isMounted = false;
        unsubscribeUserNotifs();
      };
    }
  }, [customerUser?.id, businessUser?.id, currentRole]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCustomerTab, setActiveCustomerTab] = useState<'discover' | 'bookings' | 'saved' | 'profile'>('discover');
  const [activeBusinessTab, setActiveBusinessTab] = useState<
    'overview' | 'calendar' | 'services' | 'staff' | 'hours' | 'reviews' | 'profile' | 'reports' | 'settings' | 'customers'
  >('overview');

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [preselectedSalon, setPreselectedSalon] = useState<Salon | null>(null);
  const [preselectedService, setPreselectedService] = useState<ServiceItem | null>(null);
  const [preselectedStaff, setPreselectedStaff] = useState<StaffMember | null>(null);

  const [userLocation, setUserLocation] = useState<string>(() => {
    return localStorage.getItem('algosalon_user_location') || 'Dubai Marina, UAE';
  });

  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(() => {
    const saved = localStorage.getItem('algosalon_location_permission');
    return saved !== null ? saved === 'true' : null;
  });

  const requestLocationPermission = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setLocationPermissionGranted(false);
      localStorage.setItem('algosalon_location_permission', 'false');
      await refreshDeviceTelemetry(false);
      return false;
    }

    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        async position => {
          setLocationPermissionGranted(true);
          localStorage.setItem('algosalon_location_permission', 'true');
          localStorage.setItem('algosalon_location_prompted', 'true');
          const enhanced = await refreshDeviceTelemetry(true);
          setIsAutoRegionEnabled(true);
          localStorage.setItem('algosalon_auto_region', 'true');
          setActiveCountryCodeState(enhanced.countryCode);
          localStorage.setItem('algosalon_country_code', enhanced.countryCode);
          setActiveLanguageState(enhanced.language);
          localStorage.setItem('algosalon_app_language', enhanced.language);
          setCustomCurrencyState(null);
          setCustomDialCodeState(null);
          localStorage.removeItem('algosalon_custom_currency');
          localStorage.removeItem('algosalon_custom_dial_code');
          setUserLocation(enhanced.zoneLocation);
          localStorage.setItem('algosalon_user_location', enhanced.zoneLocation);

          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          if (userLat && userLng) {
            setSalons(prevSalons =>
              prevSalons.map(s => {
                if (s.lat && s.lng) {
                  const dist = calculateDistanceKm(userLat, userLng, s.lat, s.lng);
                  return { ...s, distanceKm: dist };
                }
                return s;
              })
            );
          }
          resolve(true);
        },
        async error => {
          setLocationPermissionGranted(false);
          localStorage.setItem('algosalon_location_permission', 'false');
          localStorage.setItem('algosalon_location_prompted', 'true');
          // Graceful non-blocking fallback
          await refreshDeviceTelemetry(false);
          resolve(false);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    });
  };

  /**
   * 1. Clear ALL old local storage data (token, user profile, account type, session state)
   * before saving a new account's data on signup.
   */
  const clearAllSessionData = () => {
    localStorage.removeItem('algosalon_auth_token');
    localStorage.removeItem('algosalon_role');
    localStorage.removeItem('algosalon_customer');
    localStorage.removeItem('algosalon_business_user');
    localStorage.removeItem('algosalon_seen_splash');
    localStorage.removeItem('algosalon_appointments');
    localStorage.removeItem('algosalon_notifications');
    localStorage.removeItem('algosalon_salons');
    localStorage.removeItem('algosalon_services');
    localStorage.removeItem('algosalon_staff');
    localStorage.removeItem('algosalon_reviews');
    localStorage.removeItem('algosalon_favorites');
    localStorage.removeItem('algosalon_pending_auth');
    localStorage.removeItem('algosalon_location_prompted');
    localStorage.removeItem('algosalon_location_permission');
  };

  /**
   * Signup for Customer:
   * - Clears ALL old local storage data first
   * - Generates fresh auth token
   * - Constructs clean fresh profile (no stale cached demo state)
   * - Resets global Context state fully
   * - Saves fresh profile to localStorage under new token
   */
  const signupCustomer = (userData: Partial<CustomerUser>, token?: string): CustomerUser => {
    clearAllSessionData();

    let effectiveToken = token || null;
    if (isSupabaseConfigured()) {
      supabaseALGOsalonClient.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setAuthToken(session.access_token);
          localStorage.setItem('algosalon_auth_token', session.access_token);
        }
      }).catch(err => {
        console.warn('[AppContext] Failed to get session during signupCustomer:', err);
      });
    } else if (!effectiveToken) {
      effectiveToken = `algosalon_tk_cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const freshCustomer: CustomerUser = {
      id: userData.id || (isSupabaseConfigured() ? '' : `cust-${Date.now()}`),
      name: userData.name?.trim() || 'Valued Client',
      email: userData.email?.trim() || '',
      phone: userData.phone?.trim() || '',
      avatar: userData.avatar || '',
      gender: userData.gender || 'Prefer not to say',
      dateOfBirth: userData.dateOfBirth || '',
      nationality: userData.nationality || '',
      appCode: userData.appCode || generateSecurePin(),
      savedSalonIds: userData.savedSalonIds || [],
      loyaltyPoints: userData.loyaltyPoints ?? 0,
    };

    // Ensure account is registered in unique registry
    const regResult = registerNewAccount({
      id: freshCustomer.id,
      email: freshCustomer.email,
      role: 'customer',
      name: freshCustomer.name,
      appCode: freshCustomer.appCode,
      phone: freshCustomer.phone,
      avatar: freshCustomer.avatar,
      gender: freshCustomer.gender,
      dateOfBirth: freshCustomer.dateOfBirth,
      nationality: freshCustomer.nationality,
    });
    if (!regResult.success && regResult.existingAccount) {
      updateRegisteredAccount(freshCustomer.email, {
        name: freshCustomer.name,
        phone: freshCustomer.phone,
        avatar: freshCustomer.avatar,
        gender: freshCustomer.gender,
        dateOfBirth: freshCustomer.dateOfBirth,
        nationality: freshCustomer.nationality,
      });
    }

    setCustomerUser(freshCustomer);
    setAuthToken(effectiveToken);
    if (effectiveToken) {
      localStorage.setItem('algosalon_auth_token', effectiveToken);
    }
    localStorage.setItem('algosalon_role', 'customer');
    localStorage.setItem('algosalon_customer', JSON.stringify(freshCustomer));
    localStorage.setItem('algosalon_seen_splash', 'true');
    localStorage.setItem('algosalon_appointments', JSON.stringify([]));

    const welcomeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: freshCustomer.id,
      userType: 'customer',
      title: `Welcome, ${freshCustomer.name.split(' ')[0] || 'Client'}!`,
      message: 'Your client account is active. Explore top-tier salons and book appointments in real time.',
      date: new Date().toISOString(),
      type: 'system',
      read: false,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('algosalon_notifications', JSON.stringify([welcomeNotif]));

    // Fully reset Global Context state
    setCurrentRole('customer');
    setCustomerUser(freshCustomer);
    setAppointments([]);
    setNotifications([welcomeNotif]);
    setAuthModalOpen(false);

    return freshCustomer;
  };

  /**
   * Signup for Business:
   * - Clears ALL old local storage data first
   * - Generates fresh auth token
   * - Creates fresh Salon & Business user profiles
   * - Resets global Context state fully
   * - Saves fresh profile to localStorage
   */
  const signupBusiness = (
    userData: Partial<BusinessUser>,
    salonData?: Partial<Salon>,
    token?: string
  ): BusinessUser => {
    clearAllSessionData();

    let effectiveToken = token || null;
    if (isSupabaseConfigured()) {
      supabaseALGOsalonClient.auth.getSession().then(({ data: { session } }) => {
        if (session?.access_token) {
          setAuthToken(session.access_token);
          localStorage.setItem('algosalon_auth_token', session.access_token);
        }
      }).catch(err => {
        console.warn('[AppContext] Failed to get session during signupBusiness:', err);
      });
    } else if (!effectiveToken) {
      effectiveToken = `algosalon_tk_biz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    const newSalonId = salonData?.id || `salon-${Date.now()}`;
    const freshSalon: Salon = {
      id: newSalonId,
      name: salonData?.name || userData.businessName || 'My Salon Studio',
      tagline: salonData?.tagline || 'Modern Barbering & Salon Studio',
      description: salonData?.description || 'Premier grooming and styling destination.',
      address: salonData?.address || 'Downtown Boulevard',
      city: salonData?.city || 'Dubai',
      mapUrl: salonData?.mapUrl || 'https://maps.google.com',
      distanceKm: 0.5,
      lat: 25.2048,
      lng: 55.2708,
      phone: salonData?.phone || userData.phone || '+971 50 123 4567',
      rating: 5.0,
      reviewCount: 0,
      priceRange: '$$$',
      logo: salonData?.logo || '',
      image: salonData?.image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop&q=80',
      coverImage: salonData?.coverImage || 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop&q=80',
      amenities: ['Free High-Speed Wi-Fi', 'Air Conditioned', 'Card & Apple Pay'],
      isOpenNow: true,
      isVerified: true,
      trnNumber: '100492817200003',
      licenseNumber: 'CN-2894109',
      categories: userData.category ? [userData.category] : ['Hair & Styling'],
      documents: [],
      workingHours: CONTEXT_DEFAULT_WORKING_HOURS,
    };

    const freshBusiness: BusinessUser = {
      id: userData.id || (isSupabaseConfigured() ? '' : `biz-${Date.now()}`),
      name: userData.name?.trim() || 'Salon Director',
      email: userData.email?.trim() || '',
      phone: userData.phone?.trim() || '',
      salonId: newSalonId,
      ownerRole: userData.ownerRole?.trim() || 'Owner & Salon Director',
      businessName: userData.businessName?.trim() || freshSalon.name,
      category: userData.category || 'Hair & Styling',
      location: userData.location || freshSalon.city,
      appCode: userData.appCode || generateSecurePin(),
      signUpGmail: userData.signUpGmail?.trim() || userData.email?.trim() || '',
      isGmailLinked: true,
    };

    // Ensure account is registered in unique registry
    const regResult = registerNewAccount({
      id: freshBusiness.id,
      email: freshBusiness.email,
      role: 'business',
      name: freshBusiness.name,
      appCode: freshBusiness.appCode,
      phone: freshBusiness.phone,
      businessName: freshBusiness.businessName,
      category: freshBusiness.category,
      location: freshBusiness.location,
      salonId: freshBusiness.salonId,
      ownerRole: freshBusiness.ownerRole,
      signUpGmail: freshBusiness.signUpGmail,
    });
    if (!regResult.success && regResult.existingAccount) {
      updateRegisteredAccount(freshBusiness.email, {
        name: freshBusiness.name,
        phone: freshBusiness.phone,
        businessName: freshBusiness.businessName,
        category: freshBusiness.category,
        location: freshBusiness.location,
        salonId: freshBusiness.salonId,
        ownerRole: freshBusiness.ownerRole,
      });
    }

    if (effectiveToken) {
      localStorage.setItem('algosalon_auth_token', effectiveToken);
      setAuthToken(effectiveToken);
    }
    localStorage.setItem('algosalon_role', 'business');
    localStorage.setItem('algosalon_business_user', JSON.stringify(freshBusiness));
    localStorage.setItem('algosalon_seen_splash', 'true');
    localStorage.setItem('algosalon_appointments', JSON.stringify([]));

    setSalons(prev => {
      const exists = prev.some(s => s.id === newSalonId);
      const updated = exists ? prev.map(s => (s.id === newSalonId ? freshSalon : s)) : [freshSalon, ...prev];
      localStorage.setItem('algosalon_salons', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      registerBusinessSalonInDb({
        name: freshSalon.name,
        phone: freshSalon.phone,
        city: freshSalon.city,
        address: freshSalon.address,
        categories: freshSalon.categories,
        coverImage: freshSalon.coverImage,
      }).then(res => {
        if (res.success && res.salonId) {
          freshBusiness.salonId = res.salonId;
          freshSalon.id = res.salonId;
          setBusinessUser(prev => ({ ...prev, salonId: res.salonId }));
          localStorage.setItem('algosalon_business_user', JSON.stringify({ ...freshBusiness, salonId: res.salonId }));
        }
      }).catch(err => {
        console.warn('registerBusinessSalonInDb error on signup:', err);
      });
    }

    setCurrentRole('business');
    setBusinessUser(freshBusiness);
    setAppointments([]);
    setShowSplash(false);
    setAuthModalOpen(false);

    return freshBusiness;
  };

  /**
   * Fetch fresh user profile from current session storage, ensuring Settings
   * and components never display stale cached data.
   */
  const fetchFreshUserProfile = (tokenOverride?: string) => {
    const token = tokenOverride || localStorage.getItem('algosalon_auth_token') || authToken;
    const role = (localStorage.getItem('algosalon_role') as Role) || currentRole || 'customer';

    let freshCustomer = customerUser;
    let freshBusiness = businessUser;

    const savedCust = localStorage.getItem('algosalon_customer');
    if (savedCust) {
      try {
        freshCustomer = JSON.parse(savedCust);
        setCustomerUser(freshCustomer);
      } catch {
        // ignore JSON parse error
      }
    }

    const savedBiz = localStorage.getItem('algosalon_business_user');
    if (savedBiz) {
      try {
        freshBusiness = JSON.parse(savedBiz);
        setBusinessUser(freshBusiness);
      } catch {
        // ignore JSON parse error
      }
    }

    return { customer: freshCustomer, business: freshBusiness, role, token };
  };

  const updateCustomerProfile = (updates: Partial<CustomerUser>) => {
    setCustomerUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('algosalon_customer', JSON.stringify(updated));
      return updated;
    });

    const activeEmail = customerUser.email || updates.email;
    if (activeEmail) {
      updateRegisteredAccount(activeEmail, updates);
      if (updates.appCode) {
        updateAccountAppCode(activeEmail, updates.appCode);
      }
    }

    updateCustomerProfileInDb(customerUser.id || '', updates).catch(err => {
      console.warn('Background sync customer profile error:', err);
    });
  };

  const updateBusinessProfile = (updates: Partial<BusinessUser>) => {
    setBusinessUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('algosalon_business_user', JSON.stringify(updated));
      return updated;
    });

    const activeEmail = businessUser.email || updates.email;
    if (activeEmail) {
      updateRegisteredAccount(activeEmail, updates);
      if (updates.appCode) {
        updateAccountAppCode(activeEmail, updates.appCode);
      }
      syncAccountIdentityToSupabase(activeEmail, 'business', {
        full_name: updates.name || businessUser.name,
        name: updates.name || businessUser.name,
        phone: updates.phone || businessUser.phone,
        business_name: updates.businessName || businessUser.businessName,
        app_code: updates.appCode || businessUser.appCode,
      }).catch(err => {
        console.warn('Background sync business identity error:', err);
      });
    }
  };

  const loginAsCustomer = (userUpdates: Partial<CustomerUser>, token?: string) => {
    let resolvedToken = token;
    if (!resolvedToken && isSupabaseConfigured() && supabaseALGOsalonClient) {
      const stored = localStorage.getItem('algosalon_auth_token');
      if (stored && !stored.startsWith('algosalon_tk_')) {
        resolvedToken = stored;
      }
    } else if (!resolvedToken && !isSupabaseConfigured()) {
      resolvedToken = localStorage.getItem('algosalon_auth_token') || `algosalon_tk_cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    setAuthToken(resolvedToken || null);
    if (resolvedToken) {
      localStorage.setItem('algosalon_auth_token', resolvedToken);
    } else {
      localStorage.removeItem('algosalon_auth_token');
    }
    localStorage.setItem('algosalon_role', 'customer');
    localStorage.setItem('algosalon_seen_splash', 'true');

    setCustomerUser(prev => {
      const updated = { ...prev, ...userUpdates };
      localStorage.setItem('algosalon_customer', JSON.stringify(updated));
      return updated;
    });
    setCurrentRole('customer');
    setAuthModalOpen(false);

    if (!resolvedToken && isSupabaseConfigured() && supabaseALGOsalonClient) {
      supabaseALGOsalonClient.auth.getSession().then(({ data }) => {
        if (data?.session?.access_token) {
          setAuthToken(data.session.access_token);
          localStorage.setItem('algosalon_auth_token', data.session.access_token);
        }
      }).catch(() => {});
    }
  };

  const loginAsBusiness = (userUpdates: Partial<BusinessUser>, salonId?: string, token?: string) => {
    let resolvedToken = token;
    if (!resolvedToken && isSupabaseConfigured() && supabaseALGOsalonClient) {
      const stored = localStorage.getItem('algosalon_auth_token');
      if (stored && !stored.startsWith('algosalon_tk_')) {
        resolvedToken = stored;
      }
    } else if (!resolvedToken && !isSupabaseConfigured()) {
      resolvedToken = localStorage.getItem('algosalon_auth_token') || `algosalon_tk_biz_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }

    setAuthToken(resolvedToken || null);
    if (resolvedToken) {
      localStorage.setItem('algosalon_auth_token', resolvedToken);
    } else {
      localStorage.removeItem('algosalon_auth_token');
    }
    localStorage.setItem('algosalon_role', 'business');
    localStorage.setItem('algosalon_seen_splash', 'true');

    setBusinessUser(prev => {
      const updated = {
        ...prev,
        ...userUpdates,
        salonId: salonId || userUpdates.salonId || prev.salonId || 'salon-1',
      };
      localStorage.setItem('algosalon_business_user', JSON.stringify(updated));
      return updated;
    });
    setCurrentRole('business');
    setShowSplash(false);
    setAuthModalOpen(false);

    if (!resolvedToken && isSupabaseConfigured() && supabaseALGOsalonClient) {
      supabaseALGOsalonClient.auth.getSession().then(({ data }) => {
        if (data?.session?.access_token) {
          setAuthToken(data.session.access_token);
          localStorage.setItem('algosalon_auth_token', data.session.access_token);
        }
      }).catch(() => {});
    }
  };

  /**
   * 2. Logout: clears the auth token AND the saved account type from local storage completely,
   * checks all storage keys related to session, and navigates to Login/Splash.
   */
  const logout = () => {
    clearAllSessionData();
    signOutSupabase().catch(() => {});

    setAuthToken(null);
    setCustomerUser(INITIAL_CUSTOMER);
    setBusinessUser(INITIAL_BUSINESS_USER);
    setCurrentRole('customer');
    setAuthModalOpen(false);
    setShowSplash(true);
  };

  const logoutCustomer = () => {
    logout();
  };

  const logoutBusiness = () => {
    logout();
  };

  /**
   * Permanently deletes user account, OAuth identities, and database records from Supabase
   * and local account registry, then clears all session data and redirects to splash.
   */
  const deleteAccount = async (): Promise<boolean> => {
    try {
      const currentEmail = currentRole === 'customer' 
        ? customerUser.email 
        : (businessUser.email || businessUser.signUpGmail);
      const currentUserId = currentRole === 'customer' 
        ? customerUser.id 
        : businessUser.id;

      // 1. Delete from Supabase database tables & auth (including OAuth identities)
      await deleteAccountInSupabase(currentEmail, currentUserId);

      // If business has separate signup Gmail, clean that up as well
      if (currentRole === 'business' && businessUser.signUpGmail && businessUser.signUpGmail !== currentEmail) {
        await deleteAccountInSupabase(businessUser.signUpGmail).catch(() => {});
      }

      // 2. Delete from registered accounts registry in localStorage
      if (currentEmail) {
        deleteAccountByEmail(currentEmail);
      }
      if (businessUser.signUpGmail && businessUser.signUpGmail !== currentEmail) {
        deleteAccountByEmail(businessUser.signUpGmail);
      }

      // 3. Clean up in-memory context state
      if (currentRole === 'customer') {
        if (customerUser.id) {
          setAppointments(prev => prev.filter(a => a.customerId !== customerUser.id));
          setNotifications(prev => prev.filter(n => n.userId !== customerUser.id));
        }
      } else if (currentRole === 'business') {
        const salonId = businessUser.salonId;
        if (salonId) {
          setSalons(prev => prev.filter(s => s.id !== salonId));
          setServices(prev => prev.filter(s => s.salonId !== salonId));
          setStaffMembers(prev => prev.filter(st => st.salonId !== salonId));
          setAppointments(prev => prev.filter(a => a.salonId !== salonId));
        }
      }

      // 4. Clear all session data & sign out
      clearAllSessionData();
      await signOutSupabase().catch(() => {});

      // 5. Reset state & navigate to Splash
      setAuthToken(null);
      setCustomerUser(INITIAL_CUSTOMER);
      setBusinessUser(INITIAL_BUSINESS_USER);
      setCurrentRole('customer');
      setAuthModalOpen(false);
      setShowSplash(true);

      return true;
    } catch (err) {
      console.error('deleteAccount failed:', err);
      return false;
    }
  };

  /**
   * 3. Account switching in profile settings (business/customer):
   * Enforces user security requirement:
   * - Checks if the device already has an existing account for targetRole.
   * - If YES -> prompts for 4-digit App Code (PIN) -> once verified -> routes directly to Home page.
   * - If NO (new on this device) -> redirects to Auth modal (signup/login) to sign in or create an account.
   */
  const promptRoleSwitch = (targetRole: Role) => {
    const registered = getRegisteredAccounts();
    const existing = registered.find(a => a.role === targetRole);

    if (existing) {
      setRoleSwitchAccount(existing);
      setRoleSwitchTarget(targetRole);
      setRoleSwitchModalOpen(true);
    } else {
      setAuthTargetRole(targetRole);
      setAuthMode('signup');
      setAuthModalOpen(true);
    }
  };

  const closeRoleSwitchModal = () => {
    setRoleSwitchModalOpen(false);
    setRoleSwitchTarget(null);
    setRoleSwitchAccount(null);
  };

  const confirmRoleSwitch = () => {
    if (!roleSwitchTarget || !roleSwitchAccount) return;

    if (roleSwitchTarget === 'business') {
      const bizUser = accountToBusinessUser(roleSwitchAccount);
      loginAsBusiness(bizUser, roleSwitchAccount.salonId);
      setActiveBusinessTab('overview');
    } else {
      const custUser = accountToCustomerUser(roleSwitchAccount);
      loginAsCustomer(custUser);
      setActiveCustomerTab('discover');
    }

    closeRoleSwitchModal();
  };

  const switchRole = (targetRole: Role): boolean => {
    promptRoleSwitch(targetRole);
    return true;
  };

  const updateSalonProfile = (salonId: string, updates: Partial<Salon>) => {
    setSalons(prev => {
      const updated = prev.map(s => (s.id === salonId ? { ...s, ...updates } : s));
      localStorage.setItem('algosalon_salons', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      updateSalonProfileInDb(salonId, updates).catch(err => {
        console.warn('Background Supabase updateSalonProfile error:', err);
      });
    }
  };

  const toggleFavoriteSalon = (salonId: string) => {
    const isCurrentlySaved = customerUser.savedSalonIds.includes(salonId);
    setCustomerUser(prev => {
      const isSaved = prev.savedSalonIds.includes(salonId);
      const newSaved = isSaved
        ? prev.savedSalonIds.filter(id => id !== salonId)
        : [...prev.savedSalonIds, salonId];
      const updated = { ...prev, savedSalonIds: newSaved };
      localStorage.setItem('algosalon_customer', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured() && customerUser?.id) {
      if (isCurrentlySaved) {
        removeFavoriteInDb(customerUser.id, salonId).catch(err => {
          console.warn('Background remove favorite error:', err);
        });
      } else {
        addFavoriteInDb(customerUser.id, salonId).catch(err => {
          console.warn('Background add favorite error:', err);
        });
      }
    }
  };

  const addService = (service: Omit<ServiceItem, 'id'>) => {
    const tempId = `srv-${Date.now()}`;
    const newService: ServiceItem = {
      ...service,
      id: tempId,
    };
    setServices(prev => {
      const updated = [newService, ...prev];
      localStorage.setItem('algosalon_services', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      addServiceInDb(service).then(res => {
        if (res.success && res.serviceId) {
          setServices(prev =>
            prev.map(s => (s.id === tempId ? { ...s, id: res.serviceId! } : s))
          );
        }
      }).catch(err => {
        console.warn('Background Supabase addService error:', err);
      });
    }
  };

  const updateService = (serviceId: string, updates: Partial<ServiceItem>) => {
    setServices(prev => {
      const updated = prev.map(s => (s.id === serviceId ? { ...s, ...updates } : s));
      localStorage.setItem('algosalon_services', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      updateServiceInDb(serviceId, updates).catch(err => {
        console.warn('Background Supabase updateService error:', err);
      });
    }
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => {
      const updated = prev.filter(s => s.id !== serviceId);
      localStorage.setItem('algosalon_services', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      deleteServiceInDb(serviceId).catch(err => {
        console.warn('Background Supabase deleteService error:', err);
      });
    }
  };

  const addStaffMember = (staff: Omit<StaffMember, 'id'>) => {
    const tempId = `staff-${Date.now()}`;
    const newStaff: StaffMember = {
      ...staff,
      id: tempId,
    };
    setStaffMembers(prev => {
      const updated = [newStaff, ...prev];
      localStorage.setItem('algosalon_staff', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      addStaffInDb(staff).then(res => {
        if (res.success && res.staffId) {
          setStaffMembers(prev =>
            prev.map(st => (st.id === tempId ? { ...st, id: res.staffId! } : st))
          );
        }
      }).catch(err => {
        console.warn('Background Supabase addStaff error:', err);
      });
    }
  };

  const updateStaffMember = (staffId: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev => {
      const updated = prev.map(s => (s.id === staffId ? { ...s, ...updates } : s));
      localStorage.setItem('algosalon_staff', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      updateStaffInDb(staffId, updates).catch(err => {
        console.warn('Background Supabase updateStaff error:', err);
      });
    }
  };

  const deleteStaffMember = (staffId: string) => {
    setStaffMembers(prev => {
      const updated = prev.filter(s => s.id !== staffId);
      localStorage.setItem('algosalon_staff', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      deleteStaffInDb(staffId).catch(err => {
        console.warn('Background Supabase deleteStaff error:', err);
      });
    }
  };

  const createAppointment = async (
    data: Omit<Appointment, 'id' | 'createdAt' | 'status'>,
    initialStatus: AppointmentStatus = 'pending'
  ): Promise<{ success: boolean; appointmentId?: string; error?: string }> => {
    if (isSupabaseConfigured() && !isAuthenticated) {
      return { success: false, error: 'Authentication required to book an appointment' };
    }

    let resolvedAppointmentId = `apt-${Date.now()}`;

    // If Supabase is configured, validate and create booking in DB first
    if (isSupabaseConfigured()) {
      const salonObj = salons.find(s => s.id === data.salonId);
      const tz = getSalonTimezone(salonObj);
      const bookingInstant = salonTimeToUtcInstant(data.date, data.timeSlot || '10:00', tz.timeZone);

      try {
        const res = await createBookingInDb({
          salonId: data.salonId,
          serviceId: data.serviceId,
          staffId: data.staffId,
          startsAt: bookingInstant.toISOString(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
        });

        if (!res.success || !res.appointmentId) {
          console.warn('Booking rejected by backend:', res.error);
          return {
            success: false,
            error: res.error || 'The requested slot is unavailable or rejected by the salon server.',
          };
        }

        resolvedAppointmentId = res.appointmentId;
      } catch (err: any) {
        console.error('Error creating booking in Supabase:', err);
        return { success: false, error: err.message || 'Network error while placing booking.' };
      }
    }

    const newAppointment: Appointment = {
      ...data,
      id: resolvedAppointmentId,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    setAppointments(prev => {
      const updated = [newAppointment, ...prev];
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    // Local optimistic notification update for UI responsiveness
    const newNotifs: NotificationItem[] = [
      {
        id: `notif-${Date.now()}-biz`,
        title: initialStatus === 'pending' ? 'New Booking Request' : 'New Appointment Booked',
        message: `${data.customerName} requested ${data.serviceName} with ${data.staffName} for ${data.date} at ${data.timeSlot}.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'business',
        linkTab: initialStatus === 'pending' ? 'customers' : 'calendar',
      },
      {
        id: `notif-${Date.now()}-cust`,
        title: initialStatus === 'pending' ? 'Booking Request Submitted' : 'Booking Confirmed',
        message: `Your booking for ${data.serviceName} at ${data.salonName} on ${data.date} at ${data.timeSlot} has been placed.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'customer',
        linkTab: 'bookings',
      },
    ];

    setNotifications(prev => {
      const updated = [...newNotifs, ...prev];
      localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
      return updated;
    });

    return { success: true, appointmentId: resolvedAppointmentId };
  };

  const updateAppointmentStatus = async (
    appointmentId: string,
    status: AppointmentStatus,
    reason?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    const previousStatus = targetApt?.status;

    // Optimistically update appointment
    setAppointments(prev => {
      const updated = prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status,
              ...(reason ? { declineReason: reason } : {}),
            }
          : a
      );
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    if (targetApt) {
      // Synchronize status update to Supabase (RPC automatically handles DB notifications)
      if (isSupabaseConfigured()) {
        try {
          const res = await setAppointmentStatusInDb({
            appointmentId,
            status,
            reason,
          });

          if (!res.success) {
            console.warn('Backend rejected appointment status change:', res.error);
            // Revert local state to previous status
            if (previousStatus) {
              setAppointments(prev => {
                const reverted = prev.map(a =>
                  a.id === appointmentId ? { ...a, status: previousStatus } : a
                );
                localStorage.setItem('algosalon_appointments', JSON.stringify(reverted));
                return reverted;
              });
            }
            return { success: false, error: res.error };
          }
        } catch (err: any) {
          console.warn('Background status sync error:', err);
          if (previousStatus) {
            setAppointments(prev => {
              const reverted = prev.map(a =>
                a.id === appointmentId ? { ...a, status: previousStatus } : a
              );
              localStorage.setItem('algosalon_appointments', JSON.stringify(reverted));
              return reverted;
            });
          }
          return { success: false, error: err.message };
        }
      }

      let notifTitle = 'Appointment Update';
      let notifMsg = `Your appointment for ${targetApt.serviceName} status has been updated to ${status}.`;

      if (status === 'in_progress') {
        notifTitle = 'Service In Progress ✂️';
        notifMsg = `Your appointment with ${targetApt.staffName} for ${targetApt.serviceName} is now in progress!`;
      } else if (status === 'completed') {
        notifTitle = 'Appointment Completed ✨';
        notifMsg = `Thank you for visiting ${targetApt.salonName}! Your ${targetApt.serviceName} session is completed. Please consider leaving a review.`;
      } else if (status === 'cancelled') {
        notifTitle = 'Appointment Cancelled';
        notifMsg = `Your appointment for ${targetApt.serviceName} on ${targetApt.date} at ${targetApt.timeSlot} was cancelled.${reason ? ` Reason: ${reason}` : ''}`;
      } else if (status === 'confirmed') {
        notifTitle = 'Appointment Confirmed 🎉';
        notifMsg = `Your appointment for ${targetApt.serviceName} on ${targetApt.date} at ${targetApt.timeSlot} is confirmed.`;
      }

      const custNotif: NotificationItem = {
        id: `notif-${Date.now()}-status-${status}`,
        title: notifTitle,
        message: notifMsg,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'customer',
        linkTab: 'bookings',
      };
      setNotifications(prev => {
        const updated = [custNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });
    }

    return { success: true };
  };

  const acceptAppointment = (appointmentId: string) => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    updateAppointmentStatus(appointmentId, 'confirmed');

    if (targetApt) {
      const custNotif: NotificationItem = {
        id: `notif-${Date.now()}-accept`,
        title: 'Booking Request Accepted! 🎉',
        message: `Your appointment for ${targetApt.serviceName} on ${targetApt.date} at ${targetApt.timeSlot} has been accepted by ${targetApt.salonName}.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'customer',
        linkTab: 'bookings',
      };
      setNotifications(prev => {
        const updated = [custNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const suggestNewAppointmentTime = (
    appointmentId: string,
    newDate: string,
    newTimeSlot: string,
    note?: string
  ) => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    setAppointments(prev => {
      const updated = prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'rescheduled_by_business' as AppointmentStatus,
              suggestedDate: newDate,
              suggestedTimeSlot: newTimeSlot,
              suggestedNote: note,
            }
          : a
      );
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    // Synchronize reschedule proposal to Supabase
    if (isSupabaseConfigured()) {
      const salonObj = salons.find(s => s.id === targetApt?.salonId);
      const tz = getSalonTimezone(salonObj);
      const proposedStart = salonTimeToUtcInstant(newDate, newTimeSlot || '10:00', tz.timeZone);

      const durationMin = targetApt?.durationMinutes || 45;
      const proposedEnd = new Date(proposedStart.getTime() + durationMin * 60000);

      setAppointmentStatusInDb({
        appointmentId,
        status: 'rescheduled_by_business',
        reason: note,
        proposedStartsAt: proposedStart.toISOString(),
        proposedEndsAt: proposedEnd.toISOString(),
      }).catch(err => {
        console.warn('Background Supabase suggestNewAppointmentTime error:', err);
      });
    }

    if (targetApt) {
      const custNotif: NotificationItem = {
        id: `notif-${Date.now()}-resched`,
        title: 'New Time Proposed by Salon',
        message: `${targetApt.salonName} suggested rescheduling ${targetApt.serviceName} to ${newDate} at ${newTimeSlot}.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'customer',
        linkTab: 'bookings',
      };
      setNotifications(prev => {
        const updated = [custNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });

      if (isSupabaseConfigured() && targetApt.customerId) {
        createNotificationInDb({
          userId: targetApt.customerId,
          userType: 'customer',
          title: custNotif.title,
          message: custNotif.message,
          type: 'booking',
          linkTab: 'bookings',
          appointmentId: targetApt.id,
        }).catch(err => console.warn('Background Supabase resched notif error:', err));
      }
    }
  };

  const declineAppointment = (appointmentId: string, reason: string, apology?: string) => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    const combinedReason = apology ? `${reason} (Note: ${apology})` : reason;
    setAppointments(prev => {
      const updated = prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'cancelled' as AppointmentStatus,
              declineReason: reason,
              declineApology: apology,
            }
          : a
      );
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      setAppointmentStatusInDb({
        appointmentId,
        status: 'cancelled',
        reason: combinedReason,
      }).catch(err => {
        console.warn('Background Supabase decline appointment error:', err);
      });
    }

    if (targetApt) {
      const custNotif: NotificationItem = {
        id: `notif-${Date.now()}-decline`,
        title: 'Booking Request Update',
        message: `Your booking request for ${targetApt.serviceName} could not be accepted. Reason: ${reason}`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'customer',
        linkTab: 'bookings',
      };
      setNotifications(prev => {
        const updated = [custNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });

      if (isSupabaseConfigured() && targetApt.customerId) {
        createNotificationInDb({
          userId: targetApt.customerId,
          userType: 'customer',
          title: custNotif.title,
          message: custNotif.message,
          type: 'booking',
          linkTab: 'bookings',
          appointmentId: targetApt.id,
        }).catch(err => console.warn('Background Supabase decline notif error:', err));
      }
    }
  };

  const customerAcceptSuggestedTime = (appointmentId: string) => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    const effectiveDate = targetApt?.suggestedDate || targetApt?.date;
    const effectiveTimeSlot = targetApt?.suggestedTimeSlot || targetApt?.timeSlot;

    setAppointments(prev => {
      const updated = prev.map(a => {
        if (a.id === appointmentId) {
          return {
            ...a,
            date: a.suggestedDate || a.date,
            timeSlot: a.suggestedTimeSlot || a.timeSlot,
            status: 'confirmed' as AppointmentStatus,
            suggestedDate: undefined,
            suggestedTimeSlot: undefined,
            suggestedNote: undefined,
          };
        }
        return a;
      });
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      let proposedStartIso: string | undefined;
      let proposedEndIso: string | undefined;

      if (effectiveDate && effectiveTimeSlot) {
        const salonObj = salons.find(s => s.id === targetApt?.salonId);
        const tz = getSalonTimezone(salonObj);
        const st = salonTimeToUtcInstant(effectiveDate, effectiveTimeSlot, tz.timeZone);
        proposedStartIso = st.toISOString();
        const durationMin = targetApt?.durationMinutes || 45;
        proposedEndIso = new Date(st.getTime() + durationMin * 60000).toISOString();
      }

      setAppointmentStatusInDb({
        appointmentId,
        status: 'confirmed',
        reason: 'Customer accepted rescheduled time',
        proposedStartsAt: proposedStartIso,
        proposedEndsAt: proposedEndIso,
      }).catch(err => {
        console.warn('Background Supabase accept suggested time error:', err);
      });
    }

    if (targetApt) {
      const bizNotif: NotificationItem = {
        id: `notif-${Date.now()}-resched-accepted`,
        title: 'Rescheduled Booking Confirmed! 🎉',
        message: `${targetApt.customerName} accepted the proposed time for ${targetApt.serviceName} on ${effectiveDate} at ${effectiveTimeSlot}.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'business',
        linkTab: 'calendar',
      };
      setNotifications(prev => {
        const updated = [bizNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });

      if (isSupabaseConfigured() && businessUser?.id) {
        createNotificationInDb({
          userId: businessUser.id,
          userType: 'business',
          title: bizNotif.title,
          message: bizNotif.message,
          type: 'booking',
          linkTab: bizNotif.linkTab,
          appointmentId: targetApt.id,
        }).catch(err => console.warn('Background Supabase resched accept biz notif error:', err));
      }
    }
  };

  const customerDeclineSuggestedTime = (appointmentId: string, note?: string) => {
    const targetApt = appointments.find(a => a.id === appointmentId);
    const declineMsg = note || 'Customer declined suggested rescheduled time';

    setAppointments(prev => {
      const updated = prev.map(a =>
        a.id === appointmentId
          ? {
              ...a,
              status: 'cancelled' as AppointmentStatus,
              declineReason: declineMsg,
            }
          : a
      );
      localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      setAppointmentStatusInDb({
        appointmentId,
        status: 'cancelled',
        reason: declineMsg,
      }).catch(err => {
        console.warn('Background Supabase customer decline suggested time error:', err);
      });
    }

    if (targetApt) {
      const bizNotif: NotificationItem = {
        id: `notif-${Date.now()}-resched-declined`,
        title: 'Rescheduled Proposal Declined',
        message: `${targetApt.customerName} declined the proposed time for ${targetApt.serviceName}.`,
        date: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        read: false,
        userType: 'business',
        linkTab: 'calendar',
      };
      setNotifications(prev => {
        const updated = [bizNotif, ...prev];
        localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
        return updated;
      });

      if (isSupabaseConfigured() && businessUser?.id) {
        createNotificationInDb({
          userId: businessUser.id,
          userType: 'business',
          title: bizNotif.title,
          message: bizNotif.message,
          type: 'booking',
          linkTab: bizNotif.linkTab,
          appointmentId: targetApt.id,
        }).catch(err => console.warn('Background Supabase resched decline biz notif error:', err));
      }
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const getCustomerCompletedCount = (customerIdOrName: string, salonId?: string): number => {
    return appointments.filter(
      a =>
        (a.customerId === customerIdOrName || a.customerName === customerIdOrName) &&
        (!salonId || a.salonId === salonId) &&
        a.status === 'completed'
    ).length;
  };

  const isCustomerVip = (customerIdOrName: string, salonId?: string): boolean => {
    if (!customerIdOrName) return false;
    const completedCount = getCustomerCompletedCount(customerIdOrName, salonId);
    if (completedCount >= 2) return true;

    // Check if customer has any VIP appointment or high tier booking
    return appointments.some(
      a =>
        (a.customerId === customerIdOrName || a.customerName === customerIdOrName) &&
        (!salonId || a.salonId === salonId) &&
        (a.serviceName?.toLowerCase().includes('vip') || a.servicePrice >= 60)
    );
  };

  const addReview = async (
    reviewData: Omit<Review, 'id' | 'date'>
  ): Promise<{ success: boolean; reviewId?: string; error?: string }> => {
    // Prevent duplicate review if already reviewed
    if (reviewData.appointmentId && reviews.some(r => r.appointmentId === reviewData.appointmentId)) {
      return { success: false, error: 'You have already reviewed this visit.' };
    }

    const tempId = `rev-${Date.now()}`;
    const newRev: Review = {
      ...reviewData,
      id: tempId,
      date: getLocalDateString(),
    };

    // Optimistically update reviews list
    setReviews(prev => {
      const updated = [newRev, ...prev];
      localStorage.setItem('algosalon_reviews', JSON.stringify(updated));
      return updated;
    });

    // Mark appointment as reviewed in local state and localStorage
    if (reviewData.appointmentId) {
      setAppointments(prev => {
        const updated = prev.map(a =>
          a.id === reviewData.appointmentId ? { ...a, reviewed: true } : a
        );
        localStorage.setItem('algosalon_appointments', JSON.stringify(updated));
        return updated;
      });
    }

    // Recalculate Salon Rating & Review Count
    const salonExistingReviews = reviews.filter(r => r.salonId === reviewData.salonId);
    const updatedSalonReviews = [newRev, ...salonExistingReviews];
    const newReviewCount = updatedSalonReviews.length;
    const newAvgRating = Number(
      (updatedSalonReviews.reduce((sum, r) => sum + r.rating, 0) / newReviewCount).toFixed(1)
    );

    setSalons(prev => {
      const updated = prev.map(s =>
        s.id === reviewData.salonId
          ? { ...s, rating: newAvgRating, reviewCount: newReviewCount }
          : s
      );
      localStorage.setItem('algosalon_salons', JSON.stringify(updated));
      return updated;
    });

    // Also update staff rating if matched
    if (reviewData.staffName) {
      setStaffMembers(prev => {
        const updated = prev.map(st => {
          if (st.salonId === reviewData.salonId && st.name === reviewData.staffName) {
            const stCount = (st.reviewsCount || 0) + 1;
            const stRating = Number(
              (((st.rating || 5.0) * (st.reviewsCount || 0) + reviewData.rating) / stCount).toFixed(1)
            );
            return { ...st, rating: stRating, reviewsCount: stCount };
          }
          return st;
        });
        localStorage.setItem('algosalon_staff', JSON.stringify(updated));
        return updated;
      });
    }

    if (isSupabaseConfigured()) {
      const creationPromise = createReviewInDb({
        appointmentId: reviewData.appointmentId,
        salonId: reviewData.salonId,
        customerId: reviewData.customerId,
        customerName: reviewData.customerName,
        customerAvatar: reviewData.customerAvatar,
        rating: reviewData.rating,
        comment: reviewData.comment,
        serviceName: reviewData.serviceName,
        staffName: reviewData.staffName,
      });

      pendingReviewPromises.current.set(tempId, creationPromise);

      try {
        const res = await creationPromise;
        if (res.success && res.reviewId) {
          setReviews(prev =>
            prev.map(r => (r.id === tempId ? { ...r, id: res.reviewId! } : r))
          );
          // Sync rating and review count to Supabase
          updateSalonRatingInDb(reviewData.salonId, newAvgRating, newReviewCount).catch(err =>
            console.warn('Background Supabase salon rating update error:', err)
          );
          pendingReviewPromises.current.delete(tempId);
          return { success: true, reviewId: res.reviewId };
        } else {
          // Rollback optimistic updates on failure / duplicate
          console.warn('Review creation in DB failed:', res.error);
          setReviews(prev => {
            const reverted = prev.filter(r => r.id !== tempId);
            localStorage.setItem('algosalon_reviews', JSON.stringify(reverted));
            return reverted;
          });
          if (reviewData.appointmentId) {
            setAppointments(prev => {
              const reverted = prev.map(a =>
                a.id === reviewData.appointmentId ? { ...a, reviewed: false } : a
              );
              localStorage.setItem('algosalon_appointments', JSON.stringify(reverted));
              return reverted;
            });
          }
          pendingReviewPromises.current.delete(tempId);
          return { success: false, error: res.error || 'Failed to submit review' };
        }
      } catch (err: any) {
        console.warn('Background Supabase review error:', err);
        setReviews(prev => {
          const reverted = prev.filter(r => r.id !== tempId);
          localStorage.setItem('algosalon_reviews', JSON.stringify(reverted));
          return reverted;
        });
        if (reviewData.appointmentId) {
          setAppointments(prev => {
            const reverted = prev.map(a =>
              a.id === reviewData.appointmentId ? { ...a, reviewed: false } : a
            );
            localStorage.setItem('algosalon_appointments', JSON.stringify(reverted));
            return reverted;
          });
        }
        pendingReviewPromises.current.delete(tempId);
        return { success: false, error: err.message || 'Error saving review' };
      }
    }

    return { success: true, reviewId: tempId };
  };

  const replyToReview = async (reviewId: string, replyMessage: string) => {
    setReviews(prev => {
      const updated = prev.map(r =>
        r.id === reviewId
          ? {
              ...r,
              reply: replyMessage,
              businessReply: {
                date: getLocalDateString(),
                message: replyMessage,
              },
            }
          : r
      );
      localStorage.setItem('algosalon_reviews', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      let targetDbId = reviewId;

      // If reply is issued while tempId is still resolving in DB, await the real ID
      if (reviewId.startsWith('rev-') && pendingReviewPromises.current.has(reviewId)) {
        try {
          const pendingRes = await pendingReviewPromises.current.get(reviewId);
          if (pendingRes?.success && pendingRes?.reviewId) {
            targetDbId = pendingRes.reviewId;
          }
        } catch (e) {
          console.warn('Pending review promise failed:', e);
        }
      }

      replyToReviewInDb(targetDbId, replyMessage).catch(err => {
        console.warn('Background Supabase review reply error:', err);
      });
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      markNotificationReadInDb(id).catch(err => {
        console.warn('Background Supabase mark notification read error:', err);
      });
    }
  };

  const markAllNotificationsRead = (role?: Role) => {
    setNotifications(prev => {
      const updated = prev.map(n => {
        if (!role || typeof role !== 'string' || n.userType === role) {
          return { ...n, read: true };
        }
        return n;
      });
      localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      const targetUserId = role === 'business' ? businessUser?.id : customerUser?.id;
      if (targetUserId) {
        markAllNotificationsReadInDb(targetUserId, role).catch(err => {
          console.warn('Background Supabase mark all read error:', err);
        });
      }
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      deleteNotificationInDb(id).catch(err => {
        console.warn('Background Supabase delete notification error:', err);
      });
    }
  };

  const clearAllNotifications = (role?: Role) => {
    setNotifications(prev => {
      const updated = (role && typeof role === 'string')
        ? prev.filter(n => n.userType !== role)
        : [];
      localStorage.setItem('algosalon_notifications', JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      const targetUserId = role === 'business' ? businessUser?.id : customerUser?.id;
      if (targetUserId) {
        clearAllNotificationsInDb(targetUserId, role).catch(err => {
          console.warn('Background Supabase clear notifications error:', err);
        });
      }
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeColorTheme,
        setActiveColorTheme,
        colorThemeMode,
        setColorThemeMode,
        toggleColorThemeMode,
        currentThemeConfig,

        activeCountry,
        activeCountryCode,
        setActiveCountryCode,
        activeLanguage,
        setActiveLanguage,
        customCurrency,
        setCustomCurrency,
        customDialCode,
        setCustomDialCode,
        currencyCode,
        setManualOverride,
        isAutoRegionEnabled,
        setIsAutoRegionEnabled,
        detectedLocaleInfo,
        deviceTelemetry,
        refreshDeviceTelemetry,
        syncDeviceDataNow,
        lastDeviceSyncTime,
        isDeviceAutoSyncActive,
        setIsDeviceAutoSyncActive,
        resetToDeviceLocale,
        formatPrice,
        t,
        currencySymbol,
        dialCode,
        isLocaleModalOpen,
        setIsLocaleModalOpen,

        currentRole,
        setCurrentRole,
        switchRole,
        authToken,
        isAuthenticated,
        checkIsAuthenticated,
        showSplash,
        setShowSplash,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        authTargetRole,
        setAuthTargetRole,

        roleSwitchModalOpen,
        roleSwitchTarget,
        roleSwitchAccount,
        promptRoleSwitch,
        closeRoleSwitchModal,
        confirmRoleSwitch,

        customerUser,
        businessUser,
        clearAllSessionData,
        signupCustomer,
        signupBusiness,
        fetchFreshUserProfile,
        updateCustomerProfile,
        updateBusinessProfile,
        loginAsCustomer,
        loginAsBusiness,
        logout,
        logoutCustomer,
        logoutBusiness,
        deleteAccount,

        salons,
        selectedSalon,
        setSelectedSalon,
        updateSalonProfile,
        toggleFavoriteSalon,

        services,
        addService,
        updateService,
        deleteService,

        staffMembers,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,

        appointments,
        createAppointment,
        updateAppointmentStatus,
        acceptAppointment,
        suggestNewAppointmentTime,
        declineAppointment,
        customerAcceptSuggestedTime,
        customerDeclineSuggestedTime,
        cancelAppointment,
        isCustomerVip,
        getCustomerCompletedCount,

        reviews,
        addReview,
        replyToReview,

        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,

        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        activeCustomerTab,
        setActiveCustomerTab,

        activeBusinessTab,
        setActiveBusinessTab,

        bookingModalOpen,
        setBookingModalOpen,
        preselectedSalon,
        setPreselectedSalon,
        preselectedService,
        setPreselectedService,
        preselectedStaff,
        setPreselectedStaff,

        userLocation,
        setUserLocation,
        locationPermissionGranted,
        setLocationPermissionGranted,
        requestLocationPermission,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
