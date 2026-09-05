import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { THEME_PRESETS } from '../../utils/themeConfig';
import { ColorThemeId } from '../../types';
import { Palette, Sun, Moon } from 'lucide-react';
import { ThemeSwitcherModal } from './ThemeSwitcherModal';

export const ThemeFloatingWidget: React.FC = () => {
  const {
    activeColorTheme,
    setActiveColorTheme,
    colorThemeMode,
    toggleColorThemeMode,
    currentThemeConfig,
  } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const themeKeys: ColorThemeId[] = [
    'emerald',
    'amethyst',
    'white_block',
    'white_yellow',
    'white_purple',
    'white_pink',
    'monochrome',
    'gold',
    'rosegold',
    'sapphire',
    'coral',
  ];

  return (
    <>
      <aside
        id="floating-theme-dock"
        aria-label="Color Theme Dock"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 shadow-2xl transition-all"
        style={{
          boxShadow: `0 8px 30px -4px ${currentThemeConfig.glowHex}`,
        }}
      >
        {isExpanded ? (
          <>
            <div className="flex items-center gap-1.5 pl-1.5 pr-1">
              {themeKeys.map(themeId => {
                const config = THEME_PRESETS[themeId];
                const isSelected = activeColorTheme === themeId;
                return (
                  <button
                    key={themeId}
                    id={`quick-theme-${themeId}`}
                    type="button"
                    title={`${config.name} Theme`}
                    onClick={() => setActiveColorTheme(themeId)}
                    className={`w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center relative ${
                      isSelected
                        ? 'scale-110 ring-2 ring-white shadow-md'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${config.primaryHex}, ${config.accentHex})`,
                    }}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow" />}
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-slate-700 mx-0.5" />

            <button
              id="quick-toggle-mode-btn"
              type="button"
              onClick={toggleColorThemeMode}
              title={colorThemeMode === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {colorThemeMode === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white text-[10px] px-1.5"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            id="open-theme-widget-btn"
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow transition-all hover:scale-105"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
            }}
            title="Open Theme & Color Palette Studio"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Theme</span>
          </button>
        )}
      </aside>

      <ThemeSwitcherModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
