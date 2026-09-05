import { ColorThemeId, ThemeConfig } from '../types';

export const THEME_PRESETS: Record<ColorThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Luxe',
    badge: 'Signature',
    primaryHex: '#10b981',
    glowHex: 'rgba(16, 185, 129, 0.35)',
    borderHex: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'from-emerald-500/20 via-slate-900 to-slate-950',
    accentText: 'text-emerald-400',
    heroTagline: 'Pure Luxury & Precision Grooming',
    contrastText: '#ffffff',
  },
  gold: {
    id: 'gold',
    name: 'Royal Gold & Amber',
    badge: 'Prestige',
    primaryHex: '#f59e0b',
    glowHex: 'rgba(245, 158, 11, 0.35)',
    borderHex: 'rgba(245, 158, 11, 0.4)',
    bgGradient: 'from-amber-500/20 via-slate-900 to-slate-950',
    accentText: 'text-amber-400',
    heroTagline: 'Royal Indulgence & Modern Elegance',
    contrastText: '#ffffff',
  },
  cyan: {
    id: 'cyan',
    name: 'Cyber Ice & Cyan',
    badge: 'Futuristic',
    primaryHex: '#06b6d4',
    glowHex: 'rgba(6, 182, 212, 0.35)',
    borderHex: 'rgba(6, 182, 212, 0.4)',
    bgGradient: 'from-cyan-500/20 via-slate-900 to-slate-950',
    accentText: 'text-cyan-400',
    heroTagline: 'Ultra-Modern Grooming Studio',
    contrastText: '#ffffff',
  },
  purple: {
    id: 'purple',
    name: 'Neon Violet & Orchid',
    badge: 'Vibrant',
    primaryHex: '#8b5cf6',
    glowHex: 'rgba(139, 92, 246, 0.35)',
    borderHex: 'rgba(139, 92, 246, 0.4)',
    bgGradient: 'from-purple-500/20 via-slate-900 to-slate-950',
    accentText: 'text-purple-400',
    heroTagline: 'Haute Coiffure & Avant-Garde Style',
    contrastText: '#ffffff',
  },
  rose: {
    id: 'rose',
    name: 'Velvet Rose & Crimson',
    badge: 'Romantic',
    primaryHex: '#f43f5e',
    glowHex: 'rgba(244, 63, 94, 0.35)',
    borderHex: 'rgba(244, 63, 94, 0.4)',
    bgGradient: 'from-rose-500/20 via-slate-900 to-slate-950',
    accentText: 'text-rose-400',
    heroTagline: 'Sensory Sanctuary & Beauty Artistry',
    contrastText: '#ffffff',
  },
  white: {
    id: 'white',
    name: 'White / Electric Yellow',
    badge: 'High Visibility',
    primaryHex: '#eab308',
    glowHex: 'rgba(234, 179, 8, 0.35)',
    borderHex: 'rgba(234, 179, 8, 0.5)',
    bgGradient: 'from-yellow-400/25 via-slate-900 to-slate-950',
    accentText: 'text-yellow-400',
    heroTagline: 'High-Impact Vibrant Aesthetics',
    contrastText: '#09090b',
  },
};

/**
 * Calculates a high-contrast text color (dark vs light) based on hex background luminance.
 * Ensures accessibility on high-brightness themes such as Electric Yellow.
 */
export const getContrastTextColor = (hexColor: string, defaultColor: string = '#ffffff'): string => {
  if (!hexColor) return defaultColor;
  let clean = hexColor.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return defaultColor;

  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);

  // Perceived luminance calculation according to WCAG standards
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#09090b' : '#ffffff';
};
