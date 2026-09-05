import { ALL_COUNTRY_LOCALES, CountryLocaleData, DEFAULT_COUNTRY_LOCALE } from './localeConfig';

export interface DetectedDeviceContext {
  countryCode: string;
  dialCode: string;
  currency: string;
  language: string;
  isRtl: boolean;
  timeZone: string;
  detectionSource: 'gps' | 'timezone' | 'browser_language' | 'default';
  isAutoDetected: boolean;
}

const TIMEZONE_ZONE_MAP: Record<string, string> = {
  'Asia/Dubai': 'AE',
  'Asia/Riyadh': 'SA',
  'Asia/Qatar': 'QA',
  'Asia/Kuwait': 'KW',
  'Asia/Bahrain': 'BH',
  'Asia/Muscat': 'OM',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Zurich': 'CH',
  'Europe/Amsterdam': 'NL',
  'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR',
  'Asia/Kolkata': 'IN',
  'Asia/Calcutta': 'IN',
  'Asia/Karachi': 'PK',
  'Asia/Dhaka': 'BD',
  'Asia/Singapore': 'SG',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Manila': 'PH',
  'Asia/Amman': 'JO',
  'Africa/Cairo': 'EG',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
};

export const detectCountryFromGps = (lat: number, lon: number): string | null => {
  // Check smaller GCC territories before Saudi Arabia
  if (lat >= 25.5 && lat <= 26.5 && lon >= 50.3 && lon <= 50.9) return 'BH'; // Bahrain
  if (lat >= 24.5 && lat <= 26.3 && lon >= 50.7 && lon <= 51.7) return 'QA'; // Qatar
  if (lat >= 28.5 && lat <= 30.1 && lon >= 46.5 && lon <= 48.5) return 'KW'; // Kuwait
  if (lat >= 22.5 && lat <= 26.1 && lon >= 51.5 && lon <= 56.4) return 'AE'; // UAE
  if (lat >= 16.5 && lat <= 26.4 && lon >= 51.8 && lon <= 59.9) return 'OM'; // Oman
  if (lat >= 16.0 && lat <= 32.2 && lon >= 34.5 && lon <= 55.7) return 'SA'; // Saudi Arabia

  // South Asia
  if (lat >= 23.5 && lat <= 37.1 && lon >= 60.8 && lon <= 77.9) return 'PK'; // Pakistan
  if (lat >= 20.5 && lat <= 26.7 && lon >= 88.0 && lon <= 92.7) return 'BD'; // Bangladesh
  if (lat >= 8.0 && lat <= 35.5 && lon >= 68.0 && lon <= 97.5) return 'IN';  // India

  // East Asia
  if (lat >= 24.0 && lat <= 45.6 && lon >= 122.9 && lon <= 153.9) return 'JP'; // Japan
  if (lat >= 33.0 && lat <= 38.7 && lon >= 124.5 && lon <= 131.0) return 'KR'; // South Korea

  // Europe
  if (lat >= 49.8 && lat <= 60.9 && lon >= -8.2 && lon <= 1.8) return 'GB'; // UK
  if (lat >= 41.3 && lat <= 51.1 && lon >= -5.2 && lon <= 9.6) return 'FR'; // France
  if (lat >= 47.2 && lat <= 55.1 && lon >= 5.8 && lon <= 15.1) return 'DE'; // Germany
  if (lat >= 45.8 && lat <= 47.8 && lon >= 5.9 && lon <= 10.5) return 'CH'; // Switzerland
  if (lat >= 50.7 && lat <= 53.6 && lon >= 3.3 && lon <= 7.3) return 'NL';  // Netherlands

  // North America
  if (lat >= 24.4 && lat <= 49.4 && lon >= -125.0 && lon <= -66.9) return 'US';
  if (lat >= 41.7 && lat <= 83.1 && lon >= -141.0 && lon <= -52.6) return 'CA';

  // Australia
  if (lat >= -44.0 && lat <= -10.0 && lon >= 113.0 && lon <= 154.0) return 'AU';

  return null;
};

export const getSystemLocaleContext = (): DetectedDeviceContext => {
  let detectedCountryCode = 'AE';
  let detectionSource: 'gps' | 'timezone' | 'browser_language' | 'default' = 'default';

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_ZONE_MAP[tz]) {
      detectedCountryCode = TIMEZONE_ZONE_MAP[tz];
      detectionSource = 'timezone';
    }
  } catch {
    // ignore
  }

  const country = ALL_COUNTRY_LOCALES.find(c => c.code === detectedCountryCode) || DEFAULT_COUNTRY_LOCALE;

  return {
    countryCode: country.code,
    dialCode: country.dialCode,
    currency: country.currency,
    language: country.defaultLanguage,
    isRtl: country.defaultLanguage === 'ar',
    timeZone: country.timeZone,
    detectionSource,
    isAutoDetected: true,
  };
};
