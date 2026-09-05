import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import {
  ALL_COUNTRY_LOCALES,
  CountryLocaleData,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  SUPPORTED_CURRENCIES,
  CurrencyInfo,
} from '../../utils/localeConfig';
import {
  COUNTRY_DIAL_CODES,
  CountryDialInfo,
} from '../../utils/countryCodes';
import {
  Globe,
  Search,
  Check,
  X,
  Coins,
  Languages,
  Phone,
  CheckCircle2,
} from 'lucide-react';

interface LocaleRegionSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'country' | 'language';

export const LocaleRegionSwitcherModal: React.FC<LocaleRegionSwitcherModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeCountry,
    setActiveCountryCode,
    activeLanguage,
    setActiveLanguage,
    customCurrency,
    setCustomCurrency,
    customDialCode,
    setCustomDialCode,
    currencyCode,
    currencySymbol,
    dialCode,
    setIsAutoRegionEnabled,
    formatPrice,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('country');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSavedFeedback, setShowSavedFeedback] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const isLight = colorThemeMode === 'light';

  const triggerFeedback = () => {
    setShowSavedFeedback(true);
    setTimeout(() => setShowSavedFeedback(false), 2000);
  };

  const handleSelectCountry = (country: CountryLocaleData) => {
    setActiveCountryCode(country.code);
    setIsAutoRegionEnabled(false);
    triggerFeedback();
  };

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    setActiveLanguage(langCode);
    setIsAutoRegionEnabled(false);
    triggerFeedback();
  };

  const handleSelectCurrency = (currCode: string | null) => {
    setCustomCurrency(currCode);
    setIsAutoRegionEnabled(false);
    triggerFeedback();
  };

  const handleSelectDialCode = (code: string | null) => {
    setCustomDialCode(code);
    setIsAutoRegionEnabled(false);
    triggerFeedback();
  };

  const filteredCountries = ALL_COUNTRY_LOCALES.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.nativeName.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q) ||
      c.dialCode.includes(q)
    );
  });

  const filteredCurrencies = SUPPORTED_CURRENCIES.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  const filteredDialCodes = COUNTRY_DIAL_CODES.filter(d => {
    const q = searchQuery.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.dialCode.includes(q) ||
      d.code.toLowerCase().includes(q)
    );
  });

  return createPortal(
    <div
      id="locale-switcher-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="locale-switcher-dialog"
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200 transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
        style={{
          boxShadow: `0 20px 50px -10px ${currentThemeConfig.glowHex}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight ? 'bg-white border-slate-100' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all shrink-0"
              style={{
                backgroundColor: currentThemeConfig.primaryHex || '#0EA36F',
                boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
              }}
            >
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-['Outfit',sans-serif]">
                Region & Currency
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Select your preferred Country, Language
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-locale-modal-btn"
            onClick={onClose}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3">
          <div
            className={`p-1 rounded-2xl border flex items-center gap-1 overflow-x-auto custom-scrollbar ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            {[
              {
                id: 'country',
                label: `Country (${activeCountry.flag} ${activeCountry.code})`,
                icon: Globe,
              },
              {
                id: 'language',
                label: `Language (${SUPPORTED_LANGUAGES.find(l => l.code === activeLanguage)?.nativeName || 'EN'})`,
                icon: Languages,
              },
            ].map(tab => {
              const isCurrent = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as TabType);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'text-white shadow-sm'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={{
                    backgroundColor: isCurrent ? currentThemeConfig.primaryHex : undefined,
                  }}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar for Country */}
        {activeTab === 'country' && (
          <div className="px-5 pt-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search country name, native name, code (+971, +91), or currency..."
                className={`w-full pl-10 pr-4 py-2.5 text-xs font-medium rounded-2xl border focus:outline-none transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400 focus:bg-white'
                    : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                }`}
              />
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {/* TAB 1: COUNTRY & REGION */}
          {activeTab === 'country' && (
            <div className="space-y-1.5 pr-0.5">
              {filteredCountries.map(country => {
                const isSelected = activeCountry.code === country.code;
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full p-2.5 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-slate-100 border-slate-300 text-slate-900'
                          : 'bg-slate-800 border-slate-700 text-white'
                        : isLight
                        ? 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-800'
                        : 'bg-slate-900 border-transparent hover:bg-slate-850 hover:border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-2xl shrink-0 leading-none">{country.flag}</span>
                      <div className="truncate">
                        <p className="text-xs sm:text-sm font-bold truncate flex items-center gap-1.5">
                          <span>{country.name}</span>
                          <span className={`text-[11px] font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            ({country.nativeName})
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 2: LANGUAGE */}
          {activeTab === 'language' && (
            <div>
              <p className={`text-xs mb-3 font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Choose your preferred interface language. Selecting Arabic automatically enables right-to-left (RTL) reading.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isSelected = activeLanguage === lang.code;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleSelectLanguage(lang.code)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-slate-100 border-slate-400 shadow-sm text-slate-900'
                            : 'bg-slate-800 border-slate-600 shadow-md text-white'
                          : isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200'
                      }`}
                      style={{
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl leading-none">{lang.flag}</span>
                        <div>
                          <span className="text-sm font-bold block">{lang.nativeName}</span>
                          <span className="text-xs text-slate-400">{lang.name} ({lang.dir.toUpperCase()})</span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CURRENCY OVERRIDE */}
          {activeTab === 'currency' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Override currency independently from your active country ({activeCountry.name}).
                </p>
                {customCurrency && (
                  <button
                    type="button"
                    onClick={() => handleSelectCurrency(null)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Reset to Country Currency ({activeCountry.currency})
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {filteredCurrencies.map(curr => {
                  const isSelected = currencyCode === curr.code;
                  const isCountryDefault = activeCountry.currency === curr.code;

                  return (
                    <button
                      key={curr.code}
                      type="button"
                      onClick={() => handleSelectCurrency(isCountryDefault ? null : curr.code)}
                      className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-slate-100 border-slate-400 shadow-xs text-slate-900'
                            : 'bg-slate-800 border-slate-600 shadow-xs text-white'
                          : isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200'
                      }`}
                      style={{
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 leading-none">{curr.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono">{curr.code}</span>
                            <span className="text-xs text-slate-400">• {curr.name}</span>
                            {isCountryDefault && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                                Default for {activeCountry.code}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Symbol: <strong>{curr.symbol}</strong> ({curr.symbolNative})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-mono font-bold text-slate-500">
                          {formatPrice(100, { overrideCurrencyCode: curr.code })}
                        </span>
                        {isSelected && (
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: currentThemeConfig.primaryHex }}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: CALLING DIAL CODE */}
          {activeTab === 'dialCode' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Select the default country calling code for phone validation and logins.
                </p>
                {customDialCode && (
                  <button
                    type="button"
                    onClick={() => handleSelectDialCode(null)}
                    className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                  >
                    Reset to Country Code ({activeCountry.dialCode})
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {filteredDialCodes.map(item => {
                  const isSelected = dialCode === item.dialCode;
                  const isCountryDefault = activeCountry.dialCode === item.dialCode;

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectDialCode(isCountryDefault ? null : item.dialCode)}
                      className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-slate-100 border-slate-400 shadow-xs text-slate-900'
                            : 'bg-slate-800 border-slate-600 shadow-xs text-white'
                          : isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-200'
                      }`}
                      style={{
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl shrink-0 leading-none">{item.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono">{item.dialCode}</span>
                            <span className="text-xs text-slate-400">• {item.name}</span>
                            {isCountryDefault && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                                Default for {activeCountry.code}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Example: {item.placeholder} ({item.patternDescription})
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 ml-2"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-semibold min-w-0">
            {showSavedFeedback ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preference Saved!</span>
              </span>
            ) : (
              <>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Active:</span>
                <span className={`font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeCountry.flag} {activeCountry.name} ({currencyCode})
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            id="apply-locale-settings-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl text-white text-xs font-extrabold transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
            }}
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
