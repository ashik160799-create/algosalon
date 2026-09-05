import React, { createContext, useContext, useState, useEffect } from 'react';
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
import { THEME_PRESETS } from '../utils/themeConfig';
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
} from '../utils/accountRegistry';
import { parseTimeSlotHoursMinutes, getLocalDateString } from '../utils/dateTimeUtils';
import { supabaseALGOsalonClient, isSupabaseConfigured } from '../supabaseALGOsalonClient';
import {
  fetchSalonsFromDb,
  createBookingInDb,
  setAppointmentStatusInDb,
  subscribeToAppointments,
  fetchAppointmentsFromDb,
  fetchReviewsFromDb,
  createReviewInDb,
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
  fetchBusinessProfileFromDb,
  fetchCustomerProfileFromDb,
  updateCustomerProfileInDb,
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
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'status'>, initialStatus?: AppointmentStatus) => string;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, reason?: string) => void;
  acceptAppointment: (appointmentId: string) => void;
  suggestNewAppointmentTime: (appointmentId: string, newDate: string, newTimeSlot: string, note?: string) => void;
  declineAppointment: (appointmentId: string, reason: string, apology?: string) => void;
  customerAcceptSuggestedTime: (appointmentId: string) => void;
  customerDeclineSuggestedTime: (appointmentId: string, note?: string) => void;
  cancelAppointment: (appointmentId: string) => void;
  isCustomerVip: (customerIdOrName: string, salonId?: string) => boolean;
  getCustomerCompletedCount: (customerIdOrName: string, salonId?: string) => number;

  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'date'>) => void;
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
    localStorage.setItem('algosalon_color_theme', activeColorTheme);
  }, [activeColorTheme]);

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
    return localStorage.getItem('algosalon_auth_token');
  });

  const isAuthenticated = Boolean(authToken);

  const checkIsAuthenticated = (): boolean => {
    return Boolean(localStorage.getItem('algosalon_auth_token'));
  };

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    // 1. On app start: check local storage for a saved auth token.
    // If a valid token exists -> go to Home screen (showSplash = false)
    // If returning from Google OAuth or Magic link redirect -> go to app (showSplash = false)
    // If no token exists -> go to Login / Splash screen (showSplash = true)
    const token = localStorage.getItem('algosalon_auth_token');
    if (token) return false;
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
    return (localStorage.getItem('algosalon_role') as Role) || 'customer';
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

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
    const saved = localStorage.getItem('algosalon_business');
    if (saved) {
      try {
        return JSON.parse(saved);
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
        return JSON.parse(saved);
      } catch {
        return INITIAL_SALONS;
      }
    }
    return INITIAL_SALONS;
  });

  const [services, setServices] = useState<ServiceItem[]>(() => {
    const saved = localStorage.getItem('algosalon_services');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_SERVICES;
      }
    }
    return INITIAL_SERVICES;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem('algosalon_staff');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_STAFF;
      }
    }
    return INITIAL_STAFF;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('algosalon_appointments');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_APPOINTMENTS;
      }
    }
    return INITIAL_APPOINTMENTS;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('algosalon_reviews');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_REVIEWS;
      }
    }
    return INITIAL_REVIEWS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('algosalon_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
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
    return localStorage.getItem('algosalon_user_location') || 'Dubai, Downtown';
  });

  const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean | null>(() => {
    const saved = localStorage.getItem('algosalon_location_permission');
    if (saved === 'granted') return true;
    if (saved === 'denied') return false;
    return null;
  });

  const requestLocationPermission = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationPermissionGranted(false);
      localStorage.setItem('algosalon_location_permission', 'denied');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermissionGranted(true);
          localStorage.setItem('algosalon_location_permission', 'granted');
          refreshDeviceTelemetry(true);
          resolve(true);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocationPermissionGranted(false);
          localStorage.setItem('algosalon_location_permission', 'denied');
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  // Keep local storage synced for core collections
  useEffect(() => {
    localStorage.setItem('algosalon_salons', JSON.stringify(salons));
  }, [salons]);

  useEffect(() => {
    localStorage.setItem('algosalon_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('algosalon_staff', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('algosalon_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('algosalon_reviews', JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem('algosalon_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('algosalon_customer', JSON.stringify(customerUser));
  }, [customerUser]);

  useEffect(() => {
    localStorage.setItem('algosalon_business', JSON.stringify(businessUser));
  }, [businessUser]);

  useEffect(() => {
    localStorage.setItem('algosalon_role', currentRole);
  }, [currentRole]);

  // Initial DB Hydration & Realtime Subscriptions
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // 1. Fetch public salon catalog
    fetchSalonsFromDb().then(dbData => {
      if (dbData) {
        if (dbData.salons && dbData.salons.length > 0) setSalons(dbData.salons);
        if (dbData.services && dbData.services.length > 0) setServices(dbData.services);
        if (dbData.staff && dbData.staff.length > 0) setStaffMembers(dbData.staff);
      }
    });

    // 2. Fetch authenticated data if logged in
    if (authToken) {
      if (currentRole === 'customer' && customerUser.id) {
        fetchAppointmentsFromDb({ customerId: customerUser.id }).then(dbAppts => {
          if (dbAppts && dbAppts.length > 0) setAppointments(dbAppts);
        });
      } else if (currentRole === 'business' && businessUser.salonId) {
        fetchAppointmentsFromDb({ salonId: businessUser.salonId }).then(dbAppts => {
          if (dbAppts && dbAppts.length > 0) setAppointments(dbAppts);
        });
      }
    }
  }, [authToken, currentRole, customerUser.id, businessUser.salonId]);

  // Realtime subscription setup
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const unsubAppts = subscribeToAppointments((updatedAppt) => {
      setAppointments(prev => {
        const index = prev.findIndex(a => a.id === updatedAppt.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedAppt };
          return next;
        } else {
          return [updatedAppt, ...prev];
        }
      });
    });

    const unsubReviews = subscribeToReviews((updatedReview) => {
      setReviews(prev => {
        const index = prev.findIndex(r => r.id === updatedReview.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedReview };
          return next;
        } else {
          return [updatedReview, ...prev];
        }
      });
    });

    const unsubNotifs = subscribeToNotifications((updatedNotif) => {
      setNotifications(prev => {
        const index = prev.findIndex(n => n.id === updatedNotif.id);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedNotif };
          return next;
        } else {
          return [updatedNotif, ...prev];
        }
      });
    });

    return () => {
      unsubAppts();
      unsubReviews();
      unsubNotifs();
    };
  }, []);

  // Role switching
  const switchRole = (targetRole: Role): boolean => {
    if (targetRole === currentRole) return true;
    setCurrentRole(targetRole);
    return true;
  };

  const promptRoleSwitch = (targetRole: Role) => {
    if (targetRole === currentRole) return;
    const currentEmail = currentRole === 'customer' ? customerUser.email : businessUser.email;
    const acct = findAccountByEmail(currentEmail);
    setRoleSwitchTarget(targetRole);
    setRoleSwitchAccount(acct || null);
    setRoleSwitchModalOpen(true);
  };

  const closeRoleSwitchModal = () => {
    setRoleSwitchModalOpen(false);
    setRoleSwitchTarget(null);
    setRoleSwitchAccount(null);
  };

  const confirmRoleSwitch = () => {
    if (roleSwitchTarget) {
      setCurrentRole(roleSwitchTarget);
    }
    closeRoleSwitchModal();
  };

  const clearAllSessionData = () => {
    localStorage.removeItem('algosalon_auth_token');
    localStorage.removeItem('algosalon_role');
    localStorage.removeItem('algosalon_customer');
    localStorage.removeItem('algosalon_business');
    setAuthToken(null);
    setCurrentRole('customer');
    setCustomerUser(INITIAL_CUSTOMER);
    setBusinessUser(INITIAL_BUSINESS_USER);
    setShowSplash(true);
  };

  const signupCustomer = (user: Partial<CustomerUser>, token?: string): CustomerUser => {
    const fullUser: CustomerUser = {
      ...INITIAL_CUSTOMER,
      ...user,
      id: user.id || `c-${Date.now()}`,
    };
    const finalToken = token || `token-cust-${Date.now()}`;
    setCustomerUser(fullUser);
    setAuthToken(finalToken);
    setCurrentRole('customer');
    localStorage.setItem('algosalon_auth_token', finalToken);
    localStorage.setItem('algosalon_role', 'customer');
    localStorage.setItem('algosalon_customer', JSON.stringify(fullUser));
    setShowSplash(false);
    return fullUser;
  };

  const signupBusiness = (
    user: Partial<BusinessUser>,
    salonData?: Partial<Salon>,
    token?: string
  ): BusinessUser => {
    const finalSalonId = salonData?.id || user.salonId || `s-${Date.now()}`;
    const fullUser: BusinessUser = {
      ...INITIAL_BUSINESS_USER,
      ...user,
      id: user.id || `b-${Date.now()}`,
      salonId: finalSalonId,
      salonName: salonData?.name || user.salonName || 'My Salon',
    };

    if (salonData) {
      const newSalon: Salon = {
        id: finalSalonId,
        name: salonData.name || fullUser.salonName,
        tagline: salonData.tagline || 'Luxury Salon & Spa',
        description: salonData.description || 'Welcome to our premium salon experience.',
        address: salonData.address || 'Dubai, UAE',
        city: salonData.city || 'Dubai',
        distanceKm: 0.1,
        lat: salonData.lat || 25.1972,
        lng: salonData.lng || 55.2744,
        phone: salonData.phone || fullUser.phone,
        rating: 5.0,
        reviewCount: 0,
        priceRange: salonData.priceRange || '$$',
        image: salonData.image || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        gallery: salonData.gallery || [
          'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop&q=80',
        ],
        workingHours: salonData.workingHours || CONTEXT_DEFAULT_WORKING_HOURS,
        amenities: salonData.amenities || ['Free Wi-Fi', 'AC', 'Card Accepted'],
        categories: salonData.categories || ['Haircut', 'Coloring', 'Styling'],
        featured: false,
        isOpenNow: true,
      };

      setSalons(prev => [newSalon, ...prev]);
    }

    const finalToken = token || `token-biz-${Date.now()}`;
    setBusinessUser(fullUser);
    setAuthToken(finalToken);
    setCurrentRole('business');
    localStorage.setItem('algosalon_auth_token', finalToken);
    localStorage.setItem('algosalon_role', 'business');
    localStorage.setItem('algosalon_business', JSON.stringify(fullUser));
    setShowSplash(false);
    return fullUser;
  };

  const fetchFreshUserProfile = (tokenOverride?: string) => {
    const token = tokenOverride || authToken;
    const role = currentRole;
    return {
      customer: customerUser,
      business: businessUser,
      role,
      token,
    };
  };

  const updateCustomerProfile = (updates: Partial<CustomerUser>) => {
    setCustomerUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('algosalon_customer', JSON.stringify(next));
      return next;
    });

    if (customerUser.email) {
      updateRegisteredAccount(customerUser.email, {
        fullName: updates.name,
        phone: updates.phone,
        avatar: updates.avatar,
      });
    }

    if (isSupabaseConfigured() && customerUser.id) {
      updateCustomerProfileInDb(customerUser.id, {
        full_name: updates.name,
        phone_e164: updates.phone,
        avatar_url: updates.avatar,
      });
    }
  };

  const updateBusinessProfile = (updates: Partial<BusinessUser>) => {
    setBusinessUser(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('algosalon_business', JSON.stringify(next));
      return next;
    });

    if (businessUser.email) {
      updateRegisteredAccount(businessUser.email, {
        fullName: updates.name,
        phone: updates.phone,
        avatar: updates.avatar,
        salonName: updates.salonName,
      });
    }
  };

  const loginAsCustomer = (user: Partial<CustomerUser>, token?: string) => {
    const fullUser: CustomerUser = {
      ...INITIAL_CUSTOMER,
      ...user,
      id: user.id || `c-${Date.now()}`,
    };
    const finalToken = token || `token-cust-${Date.now()}`;
    setCustomerUser(fullUser);
    setAuthToken(finalToken);
    setCurrentRole('customer');
    localStorage.setItem('algosalon_auth_token', finalToken);
    localStorage.setItem('algosalon_role', 'customer');
    localStorage.setItem('algosalon_customer', JSON.stringify(fullUser));
    setShowSplash(false);
  };

  const loginAsBusiness = (user: Partial<BusinessUser>, salonId?: string, token?: string) => {
    const finalSalonId = salonId || user.salonId || 'salon-1';
    const fullUser: BusinessUser = {
      ...INITIAL_BUSINESS_USER,
      ...user,
      id: user.id || `b-${Date.now()}`,
      salonId: finalSalonId,
    };
    const finalToken = token || `token-biz-${Date.now()}`;
    setBusinessUser(fullUser);
    setAuthToken(finalToken);
    setCurrentRole('business');
    localStorage.setItem('algosalon_auth_token', finalToken);
    localStorage.setItem('algosalon_role', 'business');
    localStorage.setItem('algosalon_business', JSON.stringify(fullUser));
    setShowSplash(false);
  };

  const logout = () => {
    clearAllSessionData();
  };

  const logoutCustomer = () => {
    clearAllSessionData();
  };

  const logoutBusiness = () => {
    clearAllSessionData();
  };

  const deleteAccount = async (): Promise<boolean> => {
    try {
      const emailToDelete = currentRole === 'customer' ? customerUser.email : businessUser.email;
      if (emailToDelete) {
        deleteAccountByEmail(emailToDelete);
      }
      if (isSupabaseConfigured()) {
        await deleteAccountInSupabase();
      }
      clearAllSessionData();
      return true;
    } catch (err) {
      console.error('Delete account error:', err);
      clearAllSessionData();
      return true;
    }
  };

  const updateSalonProfile = (salonId: string, updates: Partial<Salon>) => {
    setSalons(prev =>
      prev.map(s => {
        if (s.id === salonId) {
          return { ...s, ...updates };
        }
        return s;
      })
    );

    if (isSupabaseConfigured()) {
      updateSalonProfileInDb(salonId, updates as any);
    }
  };

  const toggleFavoriteSalon = (salonId: string) => {
    setCustomerUser(prev => {
      const isFav = prev.savedSalons.includes(salonId);
      const nextFavs = isFav ? prev.savedSalons.filter(id => id !== salonId) : [...prev.savedSalons, salonId];
      const updatedUser = { ...prev, savedSalons: nextFavs };
      localStorage.setItem('algosalon_customer', JSON.stringify(updatedUser));

      if (isSupabaseConfigured() && prev.id) {
        if (isFav) {
          removeFavoriteInDb(prev.id, salonId);
        } else {
          addFavoriteInDb(prev.id, salonId);
        }
      }

      return updatedUser;
    });
  };

  const addService = (srv: Omit<ServiceItem, 'id'>) => {
    const newService: ServiceItem = {
      ...srv,
      id: `srv-${Date.now()}`,
    };
    setServices(prev => [newService, ...prev]);

    if (isSupabaseConfigured()) {
      addServiceInDb(srv as any);
    }
  };

  const updateService = (serviceId: string, updates: Partial<ServiceItem>) => {
    setServices(prev =>
      prev.map(s => {
        if (s.id === serviceId) {
          return { ...s, ...updates };
        }
        return s;
      })
    );

    if (isSupabaseConfigured()) {
      updateServiceInDb(serviceId, updates as any);
    }
  };

  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));

    if (isSupabaseConfigured()) {
      deleteServiceInDb(serviceId);
    }
  };

  const addStaffMember = (staff: Omit<StaffMember, 'id'>) => {
    const newStaff: StaffMember = {
      ...staff,
      id: `staff-${Date.now()}`,
    };
    setStaffMembers(prev => [newStaff, ...prev]);

    if (isSupabaseConfigured()) {
      addStaffInDb(staff as any);
    }
  };

  const updateStaffMember = (staffId: string, updates: Partial<StaffMember>) => {
    setStaffMembers(prev =>
      prev.map(s => {
        if (s.id === staffId) {
          return { ...s, ...updates };
        }
        return s;
      })
    );

    if (isSupabaseConfigured()) {
      updateStaffInDb(staffId, updates as any);
    }
  };

  const deleteStaffMember = (staffId: string) => {
    setStaffMembers(prev => prev.filter(s => s.id !== staffId));

    if (isSupabaseConfigured()) {
      deleteStaffInDb(staffId);
    }
  };

  const createAppointment = (
    data: Omit<Appointment, 'id' | 'createdAt' | 'status'>,
    initialStatus: AppointmentStatus = 'pending'
  ): string => {
    const newId = `appt-${Date.now()}`;
    const newAppt: Appointment = {
      ...data,
      id: newId,
      status: initialStatus,
      createdAt: new Date().toISOString(),
    };

    setAppointments(prev => [newAppt, ...prev]);

    // Create notification for salon business user
    const salon = salons.find(s => s.id === data.salonId);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      recipientRole: 'business',
      recipientId: data.salonId,
      title: 'New Booking Request',
      message: `${data.customerName} requested a ${data.serviceName} appointment on ${data.date} at ${data.time}`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'booking',
      appointmentId: newId,
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (isSupabaseConfigured()) {
      createBookingInDb({
        salon_id: data.salonId,
        customer_id: data.customerId,
        service_id: data.serviceId,
        staff_id: data.staffId,
        appointment_date: data.date,
        start_time: data.time,
        total_price: data.price,
        status: initialStatus,
      });
      createNotificationInDb(newNotif as any);
    }

    return newId;
  };

  const updateAppointmentStatus = (appointmentId: string, status: AppointmentStatus, reason?: string) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === appointmentId) {
          return { ...a, status, declineReason: reason || a.declineReason };
        }
        return a;
      })
    );

    if (isSupabaseConfigured()) {
      setAppointmentStatusInDb(appointmentId, status, reason);
    }
  };

  const acceptAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'confirmed');

    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientRole: 'customer',
        recipientId: appt.customerId,
        title: 'Booking Confirmed!',
        message: `Your appointment for ${appt.serviceName} at ${appt.salonName} on ${appt.date} at ${appt.time} has been confirmed.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking',
        appointmentId,
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured()) createNotificationInDb(notif as any);
    }
  };

  const suggestNewAppointmentTime = (
    appointmentId: string,
    newDate: string,
    newTimeSlot: string,
    note?: string
  ) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === appointmentId) {
          return {
            ...a,
            status: 'suggested',
            suggestedDate: newDate,
            suggestedTime: newTimeSlot,
            businessNote: note,
          };
        }
        return a;
      })
    );

    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientRole: 'customer',
        recipientId: appt.customerId,
        title: 'Reschedule Suggested',
        message: `${appt.salonName} suggested a new time for your ${appt.serviceName} appointment: ${newDate} at ${newTimeSlot}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking',
        appointmentId,
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured()) createNotificationInDb(notif as any);
    }
  };

  const declineAppointment = (appointmentId: string, reason: string, apology?: string) => {
    updateAppointmentStatus(appointmentId, 'declined', reason);

    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientRole: 'customer',
        recipientId: appt.customerId,
        title: 'Booking Declined',
        message: `Your booking for ${appt.serviceName} at ${appt.salonName} could not be accepted. Reason: ${reason}`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking',
        appointmentId,
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured()) createNotificationInDb(notif as any);
    }
  };

  const customerAcceptSuggestedTime = (appointmentId: string) => {
    setAppointments(prev =>
      prev.map(a => {
        if (a.id === appointmentId && a.suggestedDate && a.suggestedTime) {
          return {
            ...a,
            date: a.suggestedDate,
            time: a.suggestedTime,
            status: 'confirmed',
            suggestedDate: undefined,
            suggestedTime: undefined,
          };
        }
        return a;
      })
    );

    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientRole: 'business',
        recipientId: appt.salonId,
        title: 'Reschedule Accepted',
        message: `${appt.customerName} accepted your suggested time for ${appt.serviceName} on ${appt.suggestedDate || appt.date} at ${appt.suggestedTime || appt.time}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking',
        appointmentId,
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured()) createNotificationInDb(notif as any);
    }
  };

  const customerDeclineSuggestedTime = (appointmentId: string, note?: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled', note || 'Customer declined suggested time');

    const appt = appointments.find(a => a.id === appointmentId);
    if (appt) {
      const notif: NotificationItem = {
        id: `notif-${Date.now()}`,
        recipientRole: 'business',
        recipientId: appt.salonId,
        title: 'Reschedule Declined',
        message: `${appt.customerName} declined the suggested time for ${appt.serviceName}.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'booking',
        appointmentId,
      };
      setNotifications(prev => [notif, ...prev]);
      if (isSupabaseConfigured()) createNotificationInDb(notif as any);
    }
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const isCustomerVip = (customerIdOrName: string, salonId?: string): boolean => {
    const count = getCustomerCompletedCount(customerIdOrName, salonId);
    return count >= 3;
  };

  const getCustomerCompletedCount = (customerIdOrName: string, salonId?: string): number => {
    return appointments.filter(
      a =>
        (a.customerId === customerIdOrName || a.customerName === customerIdOrName) &&
        (salonId ? a.salonId === salonId : true) &&
        a.status === 'completed'
    ).length;
  };

  const addReview = (review: Omit<Review, 'id' | 'date'>) => {
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      date: getLocalDateString(new Date()),
    };
    setReviews(prev => [newRev, ...prev]);

    // Recalculate salon rating
    const salonReviews = [...reviews.filter(r => r.salonId === review.salonId), newRev];
    const avg = salonReviews.reduce((sum, r) => sum + r.rating, 0) / salonReviews.length;
    updateSalonProfile(review.salonId, {
      rating: Number(avg.toFixed(1)),
      reviewCount: salonReviews.length,
    });

    if (isSupabaseConfigured()) {
      createReviewInDb(review as any);
    }
  };

  const replyToReview = (reviewId: string, replyMessage: string) => {
    setReviews(prev =>
      prev.map(r => {
        if (r.id === reviewId) {
          return {
            ...r,
            reply: {
              id: `reply-${Date.now()}`,
              authorName: businessUser.name || 'Salon Manager',
              date: getLocalDateString(new Date()),
              comment: replyMessage,
            },
          };
        }
        return r;
      })
    );

    if (isSupabaseConfigured()) {
      replyToReviewInDb(reviewId, replyMessage);
    }
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => {
        if (n.id === id) return { ...n, read: true };
        return n;
      })
    );

    if (isSupabaseConfigured()) {
      markNotificationReadInDb(id);
    }
  };

  const markAllNotificationsRead = (role?: Role) => {
    const filterRole = role || currentRole;
    setNotifications(prev =>
      prev.map(n => {
        if (n.recipientRole === filterRole) {
          return { ...n, read: true };
        }
        return n;
      })
    );

    if (isSupabaseConfigured()) {
      markAllNotificationsReadInDb(filterRole);
    }
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    if (isSupabaseConfigured()) {
      deleteNotificationInDb(id);
    }
  };

  const clearAllNotifications = (role?: Role) => {
    const filterRole = role || currentRole;
    setNotifications(prev => prev.filter(n => n.recipientRole !== filterRole));

    if (isSupabaseConfigured()) {
      clearAllNotificationsInDb(filterRole);
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
