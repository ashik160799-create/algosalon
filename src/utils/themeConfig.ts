import { ThemeConfig, ColorThemeId } from '../types';

export const THEME_PRESETS: Record<ColorThemeId, ThemeConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Spa',
    tagline: 'Luxe Botanical Wellness, Mint Jade & Crisp White / Green Boutique',
    primaryHex: '#0EA36F',
    secondaryHex: '#0b8457',
    accentHex: '#34d399',
    glowHex: 'rgba(14, 163, 111, 0.35)',
    previewGradient: 'from-emerald-500 via-teal-500 to-emerald-700',
    badgeClass: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/40',
  },
  amethyst: {
    id: 'amethyst',
    name: 'Spot-Pro Violet',
    tagline: 'Official ALGO Signature Royal Violet, Deep Indigo & Neon Lilac',
    primaryHex: '#7c3aed',
    secondaryHex: '#581c87',
    accentHex: '#c084fc',
    glowHex: 'rgba(124, 58, 237, 0.4)',
    previewGradient: 'from-violet-600 via-purple-600 to-indigo-900',
    badgeClass: 'bg-violet-600 text-white border-violet-400',
  },
  white_block: {
    id: 'white_block',
    name: 'White / Black Block',
    tagline: 'Crisp Architectural White Canvas & Jet Black Minimalist Blocks',
    primaryHex: '#18181b',
    secondaryHex: '#09090b',
    accentHex: '#71717a',
    glowHex: 'rgba(24, 24, 27, 0.4)',
    previewGradient: 'from-white via-zinc-400 to-black',
    badgeClass: 'bg-zinc-900 text-white border-zinc-700',
  },
  white_yellow: {
    id: 'white_yellow',
    name: 'White / Electric Yellow',
    tagline: 'Bright White Canvas, Vivid Canary Sunshine Yellow & Amber Glow',
    primaryHex: '#eab308',
    secondaryHex: '#ca8a04',
    accentHex: '#fef08a',
    glowHex: 'rgba(234, 179, 8, 0.45)',
    previewGradient: 'from-white via-yellow-400 to-amber-500',
    badgeClass: 'bg-yellow-400 text-black border-yellow-500 font-bold',
  },
  white_purple: {
    id: 'white_purple',
    name: 'White / Royal Purple',
    tagline: 'Pure White Luxury Canvas, Imperial Royal Purple & Lilac Sheen',
    primaryHex: '#9333ea',
    secondaryHex: '#6b21a8',
    accentHex: '#d8b4fe',
    glowHex: 'rgba(147, 51, 234, 0.45)',
    previewGradient: 'from-white via-purple-500 to-violet-900',
    badgeClass: 'bg-purple-600 text-white border-purple-400',
  },
  white_pink: {
    id: 'white_pink',
    name: 'White / Vibrant Pink',
    tagline: 'Crisp White Canvas, Electric Hot Pink & Soft Bubblegum Glow',
    primaryHex: '#ec4899',
    secondaryHex: '#be185d',
    accentHex: '#f472b6',
    glowHex: 'rgba(236, 72, 153, 0.45)',
    previewGradient: 'from-white via-pink-400 to-rose-600',
    badgeClass: 'bg-pink-500 text-white border-pink-300 font-semibold',
  },
  monochrome: {
    id: 'monochrome',
    name: 'Noir + Electric Blue',
    tagline: 'High-Contrast Noir Black, Crisp White & Electric Blue',
    primaryHex: '#2563eb',
    secondaryHex: '#1d4ed8',
    accentHex: '#38bdf8',
    glowHex: 'rgba(37, 99, 235, 0.35)',
    previewGradient: 'from-zinc-950 via-blue-900 to-blue-500',
    badgeClass: 'bg-blue-600 text-white border-blue-500',
  },
  gold: {
    id: 'gold',
    name: 'Haute Gold',
    tagline: 'Opulent Warm Gold & Noir Obsidian',
    primaryHex: '#d97706',
    secondaryHex: '#b45309',
    accentHex: '#fbbf24',
    glowHex: 'rgba(217, 119, 6, 0.35)',
    previewGradient: 'from-amber-500 via-yellow-500 to-amber-700',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  rosegold: {
    id: 'rosegold',
    name: 'Rose Gold & Blush',
    tagline: 'Chic Haute Glamour & Warm Rose',
    primaryHex: '#e11d48',
    secondaryHex: '#be123c',
    accentHex: '#fb7185',
    glowHex: 'rgba(225, 29, 72, 0.35)',
    previewGradient: 'from-rose-500 via-pink-500 to-rose-700',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Cyber Sapphire',
    tagline: 'Electric Cobalt, Cyan & Night Blue',
    primaryHex: '#2563eb',
    secondaryHex: '#1d4ed8',
    accentHex: '#38bdf8',
    glowHex: 'rgba(37, 99, 235, 0.35)',
    previewGradient: 'from-blue-500 via-cyan-500 to-indigo-600',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  coral: {
    id: 'coral',
    name: 'Sunset Ruby',
    tagline: 'Vibrant Fire Tangerine & Coral Glow',
    primaryHex: '#ea580c',
    secondaryHex: '#c2410c',
    accentHex: '#fb923c',
    glowHex: 'rgba(234, 88, 12, 0.35)',
    previewGradient: 'from-orange-500 via-amber-500 to-red-600',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  },
};

export function getContrastTextColor(hexColor?: string): string {
  if (!hexColor) return '#ffffff';
  const cleanHex = hexColor.replace('#', '');
  if (cleanHex.length !== 6) return '#ffffff';
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#09090b' : '#ffffff';
}

export function getThemePrimaryTextClass(themeId?: ColorThemeId): string {
  if (themeId === 'white_yellow') {
    return 'text-slate-950 font-black';
  }
  return 'text-white font-bold';
}
