export interface CountryDialInfo {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
  placeholder: string;
  minDigits: number;
  maxDigits: number;
  patternDescription: string;
  validationRegex?: RegExp;
}

export const COUNTRY_DIAL_CODES: CountryDialInfo[] = [
  {
    code: 'AE',
    name: 'United Arab Emirates',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '54 429 8306',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 50, 52, 54, 55, 56, 58',
    validationRegex: /^(?:50|52|54|55|56|58)\d{7}$/,
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 6, 7, 8, 9',
    validationRegex: /^[6-9]\d{9}$/,
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    dialCode: '+966',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 5',
    validationRegex: /^5\d{8}$/,
  },
  {
    code: 'QA',
    name: 'Qatar',
    dialCode: '+974',
    flag: '🇶🇦',
    placeholder: '3312 3456',
    minDigits: 8,
    maxDigits: 8,
    patternDescription: '8 digits starting with 3, 5, 6, 7',
    validationRegex: /^[3567]\d{7}$/,
  },
  {
    code: 'KW',
    name: 'Kuwait',
    dialCode: '+965',
    flag: '🇰🇼',
    placeholder: '9123 4567',
    minDigits: 8,
    maxDigits: 8,
    patternDescription: '8 digits starting with 5, 6, 9',
    validationRegex: /^[569]\d{7}$/,
  },
  {
    code: 'OM',
    name: 'Oman',
    dialCode: '+968',
    flag: '🇴🇲',
    placeholder: '9123 4567',
    minDigits: 8,
    maxDigits: 8,
    patternDescription: '8 digits starting with 7, 9',
    validationRegex: /^[79]\d{7}$/,
  },
  {
    code: 'BH',
    name: 'Bahrain',
    dialCode: '+973',
    flag: '🇧🇭',
    placeholder: '3600 1234',
    minDigits: 8,
    maxDigits: 8,
    patternDescription: '8 digits starting with 3, 6',
    validationRegex: /^[36]\d{7}$/,
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '(555) 000-0000',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits (area code + number)',
    validationRegex: /^[2-9]\d{9}$/,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    minDigits: 10,
    maxDigits: 11,
    patternDescription: '10-11 digits starting with 7 (mobile)',
    validationRegex: /^7\d{9,10}$/,
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '(555) 000-0000',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits (area code + number)',
    validationRegex: /^[2-9]\d{9}$/,
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 4 (mobile)',
    validationRegex: /^4\d{8}$/,
  },
  {
    code: 'SG',
    name: 'Singapore',
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '9123 4567',
    minDigits: 8,
    maxDigits: 8,
    patternDescription: '8 digits starting with 8, 9',
    validationRegex: /^[89]\d{7}$/,
  },
  {
    code: 'MY',
    name: 'Malaysia',
    dialCode: '+60',
    flag: '🇲🇾',
    placeholder: '12-345 6789',
    minDigits: 9,
    maxDigits: 10,
    patternDescription: '9-10 digits starting with 1',
    validationRegex: /^1\d{8,9}$/,
  },
  {
    code: 'EG',
    name: 'Egypt',
    dialCode: '+20',
    flag: '🇪🇬',
    placeholder: '100 123 4567',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 10, 11, 12, 15',
    validationRegex: /^1[0125]\d{8}$/,
  },
  {
    code: 'PK',
    name: 'Pakistan',
    dialCode: '+92',
    flag: '🇵🇰',
    placeholder: '300 1234567',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 3',
    validationRegex: /^3\d{9}$/,
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    dialCode: '+880',
    flag: '🇧🇩',
    placeholder: '1712 345678',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 1',
    validationRegex: /^1\d{9}$/,
  },
  {
    code: 'PH',
    name: 'Philippines',
    dialCode: '+63',
    flag: '🇵🇭',
    placeholder: '917 123 4567',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 9',
    validationRegex: /^9\d{9}$/,
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 23456789',
    minDigits: 10,
    maxDigits: 11,
    patternDescription: '10-11 digits starting with 15, 16, 17',
    validationRegex: /^1[567]\d{8,9}$/,
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 6, 7',
    validationRegex: /^[67]\d{8}$/,
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '312 345 6789',
    minDigits: 9,
    maxDigits: 10,
    patternDescription: '9-10 digits starting with 3',
    validationRegex: /^3\d{8,9}$/,
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 6, 7',
    validationRegex: /^[67]\d{8}$/,
  },
  {
    code: 'CH',
    name: 'Switzerland',
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '78 123 45 67',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 7',
    validationRegex: /^7\d{8}$/,
  },
  {
    code: 'NL',
    name: 'Netherlands',
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 6',
    validationRegex: /^6\d{8}$/,
  },
  {
    code: 'TR',
    name: 'Turkey',
    dialCode: '+90',
    flag: '🇹🇷',
    placeholder: '532 123 4567',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 5',
    validationRegex: /^5\d{9}$/,
  },
  {
    code: 'JO',
    name: 'Jordan',
    dialCode: '+962',
    flag: '🇯🇴',
    placeholder: '7 9012 3456',
    minDigits: 9,
    maxDigits: 9,
    patternDescription: '9 digits starting with 7',
    validationRegex: /^7\d{8}$/,
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    flag: '🇯🇵',
    placeholder: '90-1234-5678',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 70, 80, 90',
    validationRegex: /^[789]0\d{8}$/,
  },
  {
    code: 'KR',
    name: 'South Korea',
    dialCode: '+82',
    flag: '🇰🇷',
    placeholder: '10-1234-5678',
    minDigits: 10,
    maxDigits: 10,
    patternDescription: '10 digits starting with 10',
    validationRegex: /^10\d{8}$/,
  },
];

export interface PhoneValidationResult {
  isValid: boolean;
  country: CountryDialInfo;
  dialCode: string;
  nationalNumber: string;
  fullE164: string;
  error?: string;
  formattedDisplay: string;
}

export function parsePhoneNumber(raw: string, defaultCountryCode: string = 'AE'): {
  country: CountryDialInfo;
  dialCode: string;
  nationalNumber: string;
  formattedDisplay: string;
} {
  const fallbackCountry = COUNTRY_DIAL_CODES.find(c => c.code === defaultCountryCode) || COUNTRY_DIAL_CODES[0];
  if (!raw) {
    return {
      country: fallbackCountry,
      dialCode: fallbackCountry.dialCode,
      nationalNumber: '',
      formattedDisplay: '',
    };
  }
  const clean = raw.trim();
  const digitsOnly = clean.replace(/[^\d+]/g, '');
  const sortedCountries = [...COUNTRY_DIAL_CODES].sort((a, b) => b.dialCode.length - a.dialCode.length);

  for (const country of sortedCountries) {
    const codeWithPlus = country.dialCode;
    const codeDigits = country.dialCode.replace('+', '');
    if (digitsOnly.startsWith(codeWithPlus)) {
      const national = digitsOnly.slice(codeWithPlus.length);
      return {
        country,
        dialCode: country.dialCode,
        nationalNumber: national,
        formattedDisplay: `${country.flag} ${country.dialCode} ${formatDigits(national, country.code)}`,
      };
    }
    if (digitsOnly.startsWith(codeDigits) && digitsOnly.length > codeDigits.length + 5) {
      const national = digitsOnly.slice(codeDigits.length);
      return {
        country,
        dialCode: country.dialCode,
        nationalNumber: national,
        formattedDisplay: `${country.flag} ${country.dialCode} ${formatDigits(national, country.code)}`,
      };
    }
  }

  const national = digitsOnly.replace(/^\+/, '');
  return {
    country: fallbackCountry,
    dialCode: fallbackCountry.dialCode,
    nationalNumber: national,
    formattedDisplay: `${fallbackCountry.flag} ${fallbackCountry.dialCode} ${formatDigits(national, fallbackCountry.code)}`,
  };
}

export function validatePhoneNumber(
  rawInput: string,
  countryCode: string = 'AE'
): PhoneValidationResult {
  const parsed = parsePhoneNumber(rawInput, countryCode);
  const digits = parsed.nationalNumber.replace(/\D/g, '');
  const targetCountry = parsed.country;

  if (!digits) {
    return {
      isValid: false,
      country: targetCountry,
      dialCode: targetCountry.dialCode,
      nationalNumber: '',
      fullE164: '',
      error: 'Please enter a valid phone number',
      formattedDisplay: '',
    };
  }

  if (digits.length < targetCountry.minDigits) {
    return {
      isValid: false,
      country: targetCountry,
      dialCode: targetCountry.dialCode,
      nationalNumber: digits,
      fullE164: `${targetCountry.dialCode}${digits}`,
      error: `Number is too short for ${targetCountry.name}. Required: ${targetCountry.minDigits} digits (${targetCountry.patternDescription}).`,
      formattedDisplay: `${targetCountry.flag} ${targetCountry.dialCode} ${digits}`,
    };
  }

  if (digits.length > targetCountry.maxDigits) {
    return {
      isValid: false,
      country: targetCountry,
      dialCode: targetCountry.dialCode,
      nationalNumber: digits,
      fullE164: `${targetCountry.dialCode}${digits}`,
      error: `Number is too long for ${targetCountry.name}. Max allowed: ${targetCountry.maxDigits} digits.`,
      formattedDisplay: `${targetCountry.flag} ${targetCountry.dialCode} ${digits}`,
    };
  }

  if (targetCountry.validationRegex && !targetCountry.validationRegex.test(digits)) {
    return {
      isValid: false,
      country: targetCountry,
      dialCode: targetCountry.dialCode,
      nationalNumber: digits,
      fullE164: `${targetCountry.dialCode}${digits}`,
      error: `Invalid format for ${targetCountry.name}. Expected: ${targetCountry.patternDescription}`,
      formattedDisplay: `${targetCountry.flag} ${targetCountry.dialCode} ${formatDigits(digits, targetCountry.code)}`,
    };
  }

  return {
    isValid: true,
    country: targetCountry,
    dialCode: targetCountry.dialCode,
    nationalNumber: digits,
    fullE164: `${targetCountry.dialCode}${digits}`,
    formattedDisplay: `${targetCountry.flag} ${targetCountry.dialCode} ${formatDigits(digits, targetCountry.code)}`,
  };
}

export function formatDigits(national: string, countryCode: string): string {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  if (countryCode === 'AE' && digits.length >= 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (countryCode === 'IN' && digits.length === 10) {
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (countryCode === 'SA' && digits.length === 9) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
  }
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function formatFullPhone(dialCode: string, nationalNumber: string): string {
  const cleanDigits = nationalNumber.replace(/\D/g, '');
  const prefix = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return `${prefix}${cleanDigits}`;
}
