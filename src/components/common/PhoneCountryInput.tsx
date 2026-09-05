import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  COUNTRY_DIAL_CODES,
  CountryDialInfo,
  parsePhoneNumber,
  validatePhoneNumber,
} from '../../utils/countryCodes';
import { useApp } from '../../context/AppContext';

interface PhoneCountryInputProps {
  id?: string;
  value: string;
  onChange: (fullPhone: string, dialCode: string, nationalNumber: string, isValid?: boolean) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  className?: string;
  showValidationHint?: boolean;
}

export const PhoneCountryInput: React.FC<PhoneCountryInputProps> = ({
  id = 'phone-input',
  value,
  onChange,
  label,
  placeholder,
  required = false,
  autoFocus = false,
  className = '',
  showValidationHint = true,
}) => {
  const { currentThemeConfig, colorThemeMode, activeCountryCode } = useApp();
  const isLight = colorThemeMode === 'light';

  const parsed = parsePhoneNumber(value, activeCountryCode);
  const [selectedCountry, setSelectedCountry] = useState<CountryDialInfo>(parsed.country);
  const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const p = parsePhoneNumber(value, activeCountryCode);
    setSelectedCountry(p.country);
    setNationalNumber(p.nationalNumber);
  }, [value, activeCountryCode]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  const validation = validatePhoneNumber(
    `${selectedCountry.dialCode}${nationalNumber.replace(/\D/g, '')}`,
    selectedCountry.code
  );

  const handleSelectCountry = (country: CountryDialInfo) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setSearchQuery('');
    const full = `${country.dialCode}${nationalNumber.replace(/\D/g, '')}`;
    const valResult = validatePhoneNumber(full, country.code);
    onChange(full, country.dialCode, nationalNumber, valResult.isValid);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/[^\d\s-]/g, '');
    setNationalNumber(cleanDigits);
    const digitsOnly = cleanDigits.replace(/\D/g, '');
    const full = `${selectedCountry.dialCode}${digitsOnly}`;
    const valResult = validatePhoneNumber(full, selectedCountry.code);
    onChange(full, selectedCountry.dialCode, cleanDigits, valResult.isValid);
  };

  const filteredCountries = COUNTRY_DIAL_CODES.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  const hasDigits = nationalNumber.replace(/\D/g, '').length > 0;

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className={`block text-xs font-bold ${
              isLight ? 'text-slate-900' : 'text-slate-100'
            }`}
          >
            {label}
          </label>
          <span className="text-[10px] text-slate-400 font-medium">
            {selectedCountry.name} ({selectedCountry.dialCode})
          </span>
        </div>
      )}

      <div className="relative flex items-stretch gap-2" ref={dropdownRef}>
        <button
          type="button"
          id={`${id}-country-btn`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-1.5 px-3 py-3 rounded-2xl border text-xs font-extrabold transition-all shrink-0 select-none shadow-xs cursor-pointer ${
            isLight
              ? 'bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-900 focus:border-slate-500'
              : 'bg-slate-900 hover:bg-slate-850 border-slate-700 text-white focus:border-slate-500'
          }`}
          style={{
            borderColor: isDropdownOpen ? currentThemeConfig.primaryHex : undefined,
          }}
          aria-haspopup="listbox"
          aria-expanded={isDropdownOpen}
        >
          <span className="text-base leading-none" role="img" aria-label={selectedCountry.name}>
            {selectedCountry.flag}
          </span>
          <span className="font-mono">{selectedCountry.dialCode}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div className="relative flex-1">
          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            id={id}
            required={required}
            autoFocus={autoFocus}
            value={nationalNumber}
            onChange={handleNumberChange}
            placeholder={placeholder || selectedCountry.placeholder}
            className={`w-full border rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold font-mono placeholder-slate-400 focus:outline-none transition-all shadow-xs ${
              isLight
                ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-slate-500 focus:bg-white'
                : 'bg-slate-900 border-slate-700 text-white focus:border-slate-500 focus:bg-slate-950'
            }`}
          />
          {hasDigits && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {validation.isValid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
            </div>
          )}
        </div>

        {isDropdownOpen && (
          <div
            className={`absolute top-full left-0 mt-2 w-72 sm:w-80 rounded-2xl border shadow-2xl z-50 p-2.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 shadow-slate-400/30'
                : 'bg-slate-900 border-slate-800 text-white shadow-black/80'
            }`}
          >
            <div className="pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5 px-1">
                Popular Calling Codes
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { code: 'AE', dial: '+971', label: 'UAE' },
                  { code: 'IN', dial: '+91', label: 'India' },
                  { code: 'SA', dial: '+966', label: 'KSA' },
                  { code: 'QA', dial: '+974', label: 'Qatar' },
                  { code: 'US', dial: '+1', label: 'US' },
                  { code: 'GB', dial: '+44', label: 'UK' },
                ].map(pop => {
                  const target = COUNTRY_DIAL_CODES.find(c => c.code === pop.code);
                  if (!target) return null;
                  const isSelected = selectedCountry.code === target.code;
                  return (
                    <button
                      key={pop.code}
                      type="button"
                      onClick={() => handleSelectCountry(target)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold shrink-0 flex items-center gap-1 border transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-xs'
                          : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      }`}
                      style={{
                        backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <span>{target.flag}</span>
                      <span>{pop.label}</span>
                      <span className="text-[10px] opacity-80">{pop.dial}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search country or code (+971, +91...)"
                className={`w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-xl border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                }`}
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar pr-1">
              {filteredCountries.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No country matched "{searchQuery}"
                </div>
              ) : (
                filteredCountries.map(country => {
                  const isSelected = selectedCountry.code === country.code;
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleSelectCountry(country)}
                      className={`w-full px-2.5 py-2 rounded-xl flex items-center justify-between text-xs font-bold transition-all text-left cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-slate-800 text-white'
                          : isLight
                          ? 'hover:bg-slate-50 text-slate-700'
                          : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0 leading-none">{country.flag}</span>
                        <span className="truncate">{country.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="font-mono font-medium text-[11px] text-slate-400">
                          {country.dialCode}
                        </span>
                        {isSelected && (
                          <Check
                            className="w-3.5 h-3.5 stroke-[2.5]"
                            style={{ color: currentThemeConfig.primaryHex }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {showValidationHint && (
        <div className="flex items-center justify-between px-1 text-[11px]">
          {hasDigits ? (
            validation.isValid ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Valid {selectedCountry.name} mobile number</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{validation.error}</span>
              </span>
            )
          ) : (
            <span className="text-slate-400 font-normal">
              Pattern: {selectedCountry.patternDescription}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
