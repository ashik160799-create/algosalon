import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { THEME_PRESETS } from '../../utils/themeConfig';
import { Palette, Sun, Moon, Check, Sparkles, X, Image as ImageIcon, Upload, RotateCcw } from 'lucide-react';
import { AlgoLogo } from '../common/AlgoLogo';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BACKGROUND_PRESETS = [
  {
    id: 'female_stylist_male_client',
    label: 'Female Stylist & Male Client Barber',
    url: '/images/splash-haircut-stylist.jpg',
  },
  {
    id: 'woman_stylist_salon',
    label: 'Stylist Cutting Hair',
    url: '/images/splash-haircut-woman-stylist.jpg',
  },
  {
    id: 'luxury_salon_suite',
    label: 'Luxury Salon Sanctuary',
    url: '/images/splash-stylist-woman-client.jpg',
  },
];

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({ isOpen, onClose }) => {
  const {
    activeColorTheme,
    setActiveColorTheme,
    colorThemeMode,
    setColorThemeMode,
    currentThemeConfig,
  } = useApp();

  const defaultSupabaseBg = 'https://mmmthrlbikllhdupslrz.supabase.co/storage/v1/object/public/app-background-images/Splash%20Screen%202/Image%202.png';
  const [activeBgUrl, setActiveBgUrl] = useState<string>(
    () => localStorage.getItem('algosalon_screen2_bg_url') || defaultSupabaseBg
  );
  const [customBgInput, setCustomBgInput] = useState<string>('');

  const handleApplyBg = (url: string) => {
    setActiveBgUrl(url);
    localStorage.setItem('algosalon_screen2_bg_url', url);
    window.dispatchEvent(new CustomEvent('algosalon_bg_changed', { detail: url }));
  };

  const handleResetBg = () => {
    setActiveBgUrl(defaultSupabaseBg);
    setCustomBgInput('');
    localStorage.removeItem('algosalon_screen2_bg_url');
    window.dispatchEvent(new CustomEvent('algosalon_bg_changed', { detail: defaultSupabaseBg }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          handleApplyBg(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Prevent background page scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const themeList = Object.values(THEME_PRESETS);
  const isLight = colorThemeMode === 'light';

  return createPortal(
    <div
      id="theme-switcher-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 py-6 sm:py-10 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="theme-switcher-dialog"
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] my-auto shrink-0 animate-in zoom-in-95 duration-200 transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
        style={{
          boxShadow: `0 20px 50px -10px ${currentThemeConfig.glowHex}`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between px-5 py-4 border-b shrink-0 sticky top-0 z-20 ${
            isLight ? 'bg-white/95 backdrop-blur-md border-slate-100' : 'bg-slate-900/95 backdrop-blur-md border-slate-800'
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
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2
                className={`text-base font-extrabold flex items-center gap-1.5 font-['Outfit',sans-serif] ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                Customize App Appearance
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Choose your luxury salon color scheme & canvas mode
              </p>
            </div>
          </div>

          <button
            id="close-theme-modal-btn"
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-slate-100 border border-slate-200/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1 ${
            isLight ? 'bg-white' : 'bg-slate-900'
          }`}
        >
          <div
            className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${
              isLight
                ? 'bg-slate-50/90 border-slate-200'
                : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div>
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wider block mb-1 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Live Adaptive Brand Logo
              </span>
              <AlgoLogo size="md" hideTagline={false} />
            </div>
            <div className="text-right">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white shadow-sm transition-all"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex || '#0EA36F',
                }}
              >
                {currentThemeConfig.name}
              </span>
              <p className={`text-[10px] mt-1 font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Auto-reactive brand colors
              </p>
            </div>
          </div>

          <div>
            <label
              className={`text-xs font-extrabold uppercase tracking-wider block mb-2 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Canvas Atmosphere
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="mode-dark-btn"
                type="button"
                onClick={() => setColorThemeMode('dark')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  colorThemeMode === 'dark'
                    ? 'bg-slate-950 border-2 text-white shadow-md'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
                style={{
                  borderColor: colorThemeMode === 'dark' ? currentThemeConfig.primaryHex : undefined,
                }}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    colorThemeMode === 'dark'
                      ? 'bg-slate-900 text-indigo-400'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold block ${
                        colorThemeMode === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      Dark Luxury
                    </span>
                    {colorThemeMode === 'dark' && (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: currentThemeConfig.primaryHex }} />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">Obsidian luxury & neon glow</div>
                </div>
              </button>

              <button
                id="mode-light-btn"
                type="button"
                onClick={() => setColorThemeMode('light')}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                  colorThemeMode === 'light'
                    ? 'bg-emerald-50/50 border-2 text-slate-900 shadow-sm'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                }`}
                style={{
                  borderColor: colorThemeMode === 'light' ? currentThemeConfig.primaryHex : undefined,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `${currentThemeConfig.primaryHex}20`,
                    color: currentThemeConfig.primaryHex,
                  }}
                >
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold block ${
                        colorThemeMode === 'light' ? 'text-slate-900' : 'text-slate-300'
                      }`}
                    >
                      Light Boutique
                    </span>
                    {colorThemeMode === 'light' && (
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" style={{ color: currentThemeConfig.primaryHex }} />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500">Crisp high-contrast salon</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label
                className={`text-xs font-extrabold uppercase tracking-wider block ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                Curated Salon Palettes ({themeList.length})
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Instant theme preview</span>
            </div>

            <div className="space-y-2.5">
              {themeList.map(item => {
                const isSelected = activeColorTheme === item.id;
                return (
                  <button
                    key={item.id}
                    id={`theme-select-${item.id}`}
                    type="button"
                    onClick={() => setActiveColorTheme(item.id)}
                    className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? isLight
                          ? 'border-2 shadow-sm ring-2 ring-emerald-500/10'
                          : 'border-2 shadow-md ring-1'
                        : isLight
                        ? 'bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/80 hover:border-slate-300'
                        : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                    }`}
                    style={{
                      backgroundColor: isSelected
                        ? `${item.primaryHex}15`
                        : undefined,
                      borderColor: isSelected ? item.primaryHex : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-11 h-11 rounded-2xl shrink-0 flex items-center justify-center text-white shadow-sm relative overflow-hidden ring-1 ring-black/10"
                        style={{
                          background: `linear-gradient(135deg, ${item.primaryHex}, ${item.secondaryHex})`,
                        }}
                      >
                        <div
                          className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white shadow-sm"
                          style={{ backgroundColor: item.accentHex }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            className={`text-sm font-extrabold tracking-tight ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {item.name}
                          </h4>
                          {isSelected && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-sm"
                              style={{ backgroundColor: item.primaryHex }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-xs line-clamp-1 mt-0.5 ${
                            isLight ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {item.tagline}
                        </p>

                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full ring-1 ring-black/10 shadow-xs"
                              style={{ backgroundColor: item.primaryHex }}
                            />
                            <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {item.primaryHex}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full ring-1 ring-black/10 shadow-xs"
                              style={{ backgroundColor: item.accentHex }}
                            />
                            <span className={`text-[10px] font-mono font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {item.accentHex}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ml-2 transition-all ${
                        isSelected
                          ? 'text-white shadow-sm'
                          : isLight
                          ? 'border border-slate-300 bg-white'
                          : 'border border-slate-700 bg-slate-900'
                      }`}
                      style={{
                        backgroundColor: isSelected ? item.primaryHex : undefined,
                        borderColor: isSelected ? item.primaryHex : undefined,
                      }}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Screen 2 Background Image Customizer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 px-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-500" />
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Splash Screen 2 Background Image
                </h3>
              </div>
              <button
                type="button"
                onClick={handleResetBg}
                className="text-[11px] font-semibold text-slate-500 hover:text-emerald-500 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Default
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {BACKGROUND_PRESETS.map((preset) => {
                const isBgSelected = activeBgUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyBg(preset.url)}
                    className={`relative h-20 rounded-xl overflow-hidden border-2 transition-all text-left cursor-pointer ${
                      isBgSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : isLight
                        ? 'border-slate-200 hover:border-slate-300'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-1.5 flex flex-col justify-end">
                      <span className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
                        {preset.label}
                      </span>
                    </div>
                    {isBgSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Upload or Custom Image URL */}
            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                <div className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  isLight
                    ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-800 bg-slate-800/80 text-slate-200 hover:bg-slate-800'
                }`}>
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  Upload Image File
                </div>
              </label>

              <div className="flex-1 flex items-center gap-1.5">
                <input
                  type="url"
                  placeholder="Paste image URL..."
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  className={`w-full py-2 px-3 rounded-xl border text-xs transition-all ${
                    isLight
                      ? 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                      : 'border-slate-800 bg-slate-900 text-white placeholder:text-slate-500'
                  }`}
                />
                {customBgInput && (
                  <button
                    type="button"
                    onClick={() => {
                      if (customBgInput.trim()) {
                        handleApplyBg(customBgInput.trim());
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          className={`px-5 py-4 border-t flex items-center justify-between shrink-0 sticky bottom-0 z-20 ${
            isLight ? 'bg-slate-50/95 backdrop-blur-md border-slate-200' : 'bg-slate-900/95 backdrop-blur-md border-slate-800'
          }`}
        >
          <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Active:{' '}
            <strong className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {currentThemeConfig.name}
            </strong>{' '}
            ({colorThemeMode === 'light' ? 'Light Boutique' : 'Dark Luxury'})
          </div>
          <button
            id="theme-done-btn"
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl font-extrabold text-xs text-white shadow-md transition-all active:scale-95 hover:brightness-105"
            style={{
              backgroundColor: currentThemeConfig.primaryHex || '#0EA36F',
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
