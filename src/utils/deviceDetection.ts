/**
 * Automatic Device Data Detection & Synchronization Engine
 * Conforming to global privacy and legal guidelines:
 * - Collects system appearance (light/dark)
 * - Language (Locale / navigator.language)
 * - Country & Timezone (Intl / GPS / fallback)
 * - Dial Code & Phone Mapping
 * - Zone Location (GPS city if permitted, otherwise timezone/locale fallback)
 * - Currency mapping
 * - Local-first privacy compliance (no third-party behavioral tracking)
 */

import { COUNTRY_LOCALE_REGISTRY, CountryLocaleData, SupportedLanguage, TRANSLATIONS } from './localeConfig';

export interface DeviceTelemetryProfile {
  appearance: 'light' | 'dark';
  language: SupportedLanguage;
  rawLocale: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  countryPhoneCode: string;
  zoneLocation: string;
  timezone: string;
  currencyCode: string;
  currencySymbol: string;
  currencySymbolNative: string;
  exchangeRateFromAED: number;
  locationPermissionStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
  locationSource: 'gps' | 'sim' | 'ip' | 'timezone' | 'manual' | 'default';
  isGpsAccurate: boolean;
  latitude?: number;
  longitude?: number;
  timestamp: string;
}

// Timezone to city/country mapping dictionary for accurate resolution without GPS
const TIMEZONE_ZONE_MAP: Record<string, { countryCode: string; zone: string }> = {
  'Asia/Dubai': { countryCode: 'AE', zone: 'Dubai, UAE' },
  'Asia/Abu_Dhabi': { countryCode: 'AE', zone: 'Abu Dhabi, UAE' },
  'Asia/Muscat': { countryCode: 'OM', zone: 'Muscat, Oman' },
  'Asia/Riyadh': { countryCode: 'SA', zone: 'Riyadh, Saudi Arabia' },
  'Asia/Qatar': { countryCode: 'QA', zone: 'Doha, Qatar' },
  'Asia/Kuwait': { countryCode: 'KW', zone: 'Kuwait City, Kuwait' },
  'Asia/Bahrain': { countryCode: 'BH', zone: 'Manama, Bahrain' },
  'Asia/Amman': { countryCode: 'JO', zone: 'Amman, Jordan' },
  'Asia/Kolkata': { countryCode: 'IN', zone: 'Mumbai, India' },
  'Asia/Calcutta': { countryCode: 'IN', zone: 'New Delhi, India' },
  'Asia/Dhaka': { countryCode: 'BD', zone: 'Dhaka, Bangladesh' },
  'Asia/Karachi': { countryCode: 'PK', zone: 'Karachi, Pakistan' },
  'Asia/Singapore': { countryCode: 'SG', zone: 'Singapore' },
  'Asia/Kuala_Lumpur': { countryCode: 'MY', zone: 'Kuala Lumpur, Malaysia' },
  'Asia/Manila': { countryCode: 'PH', zone: 'Manila, Philippines' },
  'Asia/Tokyo': { countryCode: 'JP', zone: 'Tokyo, Japan' },
  'Europe/London': { countryCode: 'GB', zone: 'London, UK' },
  'Europe/Paris': { countryCode: 'FR', zone: 'Paris, France' },
  'Europe/Berlin': { countryCode: 'DE', zone: 'Berlin, Germany' },
  'Europe/Rome': { countryCode: 'IT', zone: 'Rome, Italy' },
  'Europe/Madrid': { countryCode: 'ES', zone: 'Madrid, Spain' },
  'Europe/Istanbul': { countryCode: 'TR', zone: 'Istanbul, Turkey' },
  'America/New_York': { countryCode: 'US', zone: 'New York, USA' },
  'America/Los_Angeles': { countryCode: 'US', zone: 'Los Angeles, USA' },
  'America/Chicago': { countryCode: 'US', zone: 'Chicago, USA' },
  'America/Denver': { countryCode: 'US', zone: 'Denver, USA' },
  'America/Phoenix': { countryCode: 'US', zone: 'Phoenix, USA' },
  'America/Toronto': { countryCode: 'CA', zone: 'Toronto, Canada' },
  'America/Vancouver': { countryCode: 'CA', zone: 'Vancouver, Canada' },
  'America/Montreal': { countryCode: 'CA', zone: 'Montreal, Canada' },
  'Australia/Sydney': { countryCode: 'AU', zone: 'Sydney, Australia' },
  'Australia/Melbourne': { countryCode: 'AU', zone: 'Melbourne, Australia' },
  'Australia/Brisbane': { countryCode: 'AU', zone: 'Brisbane, Australia' },
  'Australia/Perth': { countryCode: 'AU', zone: 'Perth, Australia' },
  'Africa/Cairo': { countryCode: 'EG', zone: 'Cairo, Egypt' },
};

/**
 * Detects system appearance (defaults strictly to 'light' for ALGO Salon Light Boutique)
 */
export function detectSystemAppearance(): 'light' | 'dark' {
  // ALGO Salon standard default is strictly 'light' (Light Boutique White/Green)
  return 'light';
}

/**
 * Detects system language preference for UI translations ONLY
 * Never used to deduce Country, Currency, or Dial Code
 */
export function detectSystemLanguage(): { language: SupportedLanguage; rawLocale: string } {
  let rawLocale = 'en-AE';
  try {
    if (typeof navigator !== 'undefined') {
      rawLocale = navigator.language || (navigator.languages && navigator.languages[0]) || 'en-AE';
    }
  } catch {
    // ignore
  }

  const cleanLang = rawLocale.split(/[-_]/)[0].toLowerCase();
  const supported: SupportedLanguage = (cleanLang in TRANSLATIONS) ? (cleanLang as SupportedLanguage) : 'en';

  return {
    language: supported,
    rawLocale,
  };
}

/**
 * Detects default Timezone ("TimeZone.getDefault()")
 */
export function detectSystemTimezone(): string {
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dubai';
    }
  } catch {
    // ignore
  }
  return 'Asia/Dubai';
}

/**
 * Synchronous local device data probe (Instant 0-millisecond execution for Splash initialization)
 * Strictly prioritizes Timezone Geo-Resolution over locale string to prevent language mismatch bugs.
 */
export function probeInitialDeviceData(): DeviceTelemetryProfile {
  const appearance = detectSystemAppearance();
  const { language, rawLocale } = detectSystemLanguage();
  const timezone = detectSystemTimezone();

  let detectedCountryCode = '';
  let zoneLocation = '';
  let locationSource: DeviceTelemetryProfile['locationSource'] = 'default';

  // 1. Direct Timezone Match
  if (TIMEZONE_ZONE_MAP[timezone]) {
    detectedCountryCode = TIMEZONE_ZONE_MAP[timezone].countryCode;
    zoneLocation = TIMEZONE_ZONE_MAP[timezone].zone;
    locationSource = 'timezone';
  } else {
    // Fuzzy timezone match
    if (timezone.includes('Dubai') || timezone.includes('Abu_Dhabi')) {
      detectedCountryCode = 'AE';
      zoneLocation = 'Dubai, UAE';
      locationSource = 'timezone';
    } else if (timezone.includes('Muscat')) {
      detectedCountryCode = 'OM';
      zoneLocation = 'Muscat, Oman';
      locationSource = 'timezone';
    } else if (timezone.includes('Riyadh')) {
      detectedCountryCode = 'SA';
      zoneLocation = 'Riyadh, Saudi Arabia';
      locationSource = 'timezone';
    } else if (timezone.includes('Kolkata') || timezone.includes('Calcutta')) {
      detectedCountryCode = 'IN';
      zoneLocation = 'Mumbai, India';
      locationSource = 'timezone';
    } else if (timezone.includes('London')) {
      detectedCountryCode = 'GB';
      zoneLocation = 'London, UK';
      locationSource = 'timezone';
    } else if (timezone.includes('New_York') || timezone.includes('Los_Angeles') || timezone.includes('Chicago')) {
      detectedCountryCode = 'US';
      zoneLocation = 'New York, USA';
      locationSource = 'timezone';
    } else if (timezone.includes('Toronto') || timezone.includes('Vancouver')) {
      detectedCountryCode = 'CA';
      zoneLocation = 'Toronto, Canada';
      locationSource = 'timezone';
    } else if (timezone.includes('Sydney') || timezone.includes('Melbourne')) {
      detectedCountryCode = 'AU';
      zoneLocation = 'Sydney, Australia';
      locationSource = 'timezone';
    } else if (timezone.includes('Qatar') || timezone.includes('Doha')) {
      detectedCountryCode = 'QA';
      zoneLocation = 'Doha, Qatar';
      locationSource = 'timezone';
    } else if (timezone.includes('Kuwait')) {
      detectedCountryCode = 'KW';
      zoneLocation = 'Kuwait City, Kuwait';
      locationSource = 'timezone';
    } else if (timezone.includes('Bahrain')) {
      detectedCountryCode = 'BH';
      zoneLocation = 'Manama, Bahrain';
      locationSource = 'timezone';
    }
  }

  // Fallback to default AE if completely unknown
  if (!detectedCountryCode || !COUNTRY_LOCALE_REGISTRY[detectedCountryCode]) {
    detectedCountryCode = 'AE';
    zoneLocation = 'Dubai Marina, UAE';
    locationSource = 'default';
  }

  const countryInfo: CountryLocaleData = COUNTRY_LOCALE_REGISTRY[detectedCountryCode] || COUNTRY_LOCALE_REGISTRY.AE;

  if (!zoneLocation) {
    zoneLocation = countryInfo.defaultCity || 'Dubai Marina, UAE';
  }

  return {
    appearance,
    language,
    rawLocale,
    countryCode: countryInfo.code,
    countryName: countryInfo.name,
    countryFlag: countryInfo.flag,
    countryPhoneCode: countryInfo.dialCode,
    zoneLocation,
    timezone,
    currencyCode: countryInfo.currency,
    currencySymbol: countryInfo.symbol,
    currencySymbolNative: countryInfo.symbolNative,
    exchangeRateFromAED: countryInfo.exchangeRateFromAED,
    locationPermissionStatus: 'prompt',
    locationSource,
    isGpsAccurate: false,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Enhanced asynchronous GPS location detection with immediate graceful fallback
 */
export async function attemptGpsEnhancement(
  baseProfile: DeviceTelemetryProfile,
  timeoutMs: number = 3500
): Promise<DeviceTelemetryProfile> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      ...baseProfile,
      locationPermissionStatus: 'unsupported',
    };
  }

  return new Promise((resolve) => {
    let hasResolved = false;

    const timer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve({
          ...baseProfile,
          locationPermissionStatus: 'denied',
        });
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);

        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        let resolvedZone = baseProfile.zoneLocation;
        let resolvedCountry = baseProfile.countryCode;

        // GPS bounding box detection for physical precision
        if (lat >= 22.5 && lat <= 26.5 && lng >= 51.5 && lng <= 56.5) {
          resolvedCountry = 'AE';
          resolvedZone = 'Dubai Marina, UAE';
        } else if (lat >= 21.0 && lat <= 27.0 && lng >= 56.0 && lng <= 60.0) {
          resolvedCountry = 'OM';
          resolvedZone = 'Muscat, Oman';
        } else if (lat >= 8 && lat <= 36 && lng >= 68 && lng <= 97) {
          resolvedCountry = 'IN';
          resolvedZone = 'Mumbai, India';
        } else if (lat >= 16 && lat <= 32 && lng >= 34 && lng <= 55) {
          resolvedCountry = 'SA';
          resolvedZone = 'Riyadh, Saudi Arabia';
        } else if (lat >= 24 && lat <= 27 && lng >= 50.5 && lng <= 51.7) {
          resolvedCountry = 'QA';
          resolvedZone = 'Doha, Qatar';
        } else if (lat >= 28.5 && lat <= 30.5 && lng >= 46.5 && lng <= 48.5) {
          resolvedCountry = 'KW';
          resolvedZone = 'Kuwait City, Kuwait';
        } else if (lat >= 25.5 && lat <= 26.5 && lng >= 50.3 && lng <= 50.8) {
          resolvedCountry = 'BH';
          resolvedZone = 'Manama, Bahrain';
        } else if (lat >= 25 && lat <= 49 && lng >= -125 && lng <= -66) {
          resolvedCountry = 'US';
          resolvedZone = 'New York, USA';
        } else if (lat >= 50 && lat <= 59 && lng >= -8 && lng <= 2) {
          resolvedCountry = 'GB';
          resolvedZone = 'London, UK';
        } else if (lat >= 41 && lat <= 51 && lng >= -5 && lng <= 9.5) {
          resolvedCountry = 'FR';
          resolvedZone = 'Paris, France';
        } else if (lat >= 47 && lat <= 55 && lng >= 5.8 && lng <= 15) {
          resolvedCountry = 'DE';
          resolvedZone = 'Berlin, Germany';
        } else if (lat >= 43 && lat <= 70 && lng >= -141 && lng <= -52) {
          resolvedCountry = 'CA';
          resolvedZone = 'Toronto, Canada';
        } else if (lat >= -44 && lat <= -10 && lng >= 113 && lng <= 154) {
          resolvedCountry = 'AU';
          resolvedZone = 'Sydney, Australia';
        }

        const countryInfo = COUNTRY_LOCALE_REGISTRY[resolvedCountry] || COUNTRY_LOCALE_REGISTRY[baseProfile.countryCode] || COUNTRY_LOCALE_REGISTRY.AE;

        resolve({
          ...baseProfile,
          countryCode: countryInfo.code,
          countryName: countryInfo.name,
          countryFlag: countryInfo.flag,
          countryPhoneCode: countryInfo.dialCode,
          zoneLocation: resolvedZone,
          currencyCode: countryInfo.currency,
          currencySymbol: countryInfo.symbol,
          currencySymbolNative: countryInfo.symbolNative,
          exchangeRateFromAED: countryInfo.exchangeRateFromAED,
          locationPermissionStatus: 'granted',
          locationSource: 'gps',
          isGpsAccurate: true,
          latitude: lat,
          longitude: lng,
          timestamp: new Date().toISOString(),
        });
      },
      () => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timer);
        resolve({
          ...baseProfile,
          locationPermissionStatus: 'denied',
        });
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Persists and synchronizes the detected telemetry to local storage
 */
export function persistDeviceTelemetry(profile: DeviceTelemetryProfile): void {
  try {
    localStorage.setItem('algosalon_device_profile', JSON.stringify(profile));
    localStorage.setItem('algosalon_country_code', profile.countryCode);
    localStorage.setItem('algosalon_app_language', profile.language);
    localStorage.setItem('algosalon_user_location', profile.zoneLocation);
    localStorage.setItem('algosalon_theme_mode', profile.appearance);
    localStorage.setItem('algosalon_location_permission', profile.locationPermissionStatus === 'granted' ? 'true' : 'false');
    localStorage.setItem('algosalon_last_device_sync', profile.timestamp);
  } catch {
    // Storage access might be restricted in some sandboxes
  }
}

/**
 * Automatically syncs and updates device data profile with fresh system readings.
 * Preserves accurate GPS data if previously obtained.
 */
export function syncDeviceData(previousProfile?: DeviceTelemetryProfile | null): DeviceTelemetryProfile {
  const fresh = probeInitialDeviceData();

  if (previousProfile && previousProfile.isGpsAccurate && previousProfile.latitude && previousProfile.longitude) {
    return {
      ...fresh,
      latitude: previousProfile.latitude,
      longitude: previousProfile.longitude,
      zoneLocation: previousProfile.zoneLocation || fresh.zoneLocation,
      countryCode: previousProfile.countryCode || fresh.countryCode,
      countryName: previousProfile.countryName || fresh.countryName,
      countryFlag: previousProfile.countryFlag || fresh.countryFlag,
      countryPhoneCode: previousProfile.countryPhoneCode || fresh.countryPhoneCode,
      currencyCode: previousProfile.currencyCode || fresh.currencyCode,
      currencySymbol: previousProfile.currencySymbol || fresh.currencySymbol,
      currencySymbolNative: previousProfile.currencySymbolNative || fresh.currencySymbolNative,
      exchangeRateFromAED: previousProfile.exchangeRateFromAED || fresh.exchangeRateFromAED,
      locationPermissionStatus: previousProfile.locationPermissionStatus,
      locationSource: previousProfile.locationSource,
      isGpsAccurate: true,
      timestamp: new Date().toISOString(),
    };
  }

  return fresh;
}
