import React from 'react';
import { useApp } from '../../context/AppContext';

interface AlgoLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'splash';
  showText?: boolean;
  variant?: 'light' | 'dark' | 'glass';
  className?: string;
  subtext?: string;
  hideTagline?: boolean;
  layout?: 'horizontal' | 'vertical';
  badgeStyle?: 'pill' | 'text';
  taglineUppercase?: boolean;
}

function hexToRgb(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
  );
}

function mixHex(hex1: string, hex2: string, weight: number): string {
  try {
    const c1 = hexToRgb(hex1);
    const c2 = hexToRgb(hex2);
    const w = Math.max(0, Math.min(1, weight));
    return rgbToHex(
      c1.r * (1 - w) + c2.r * w,
      c1.g * (1 - w) + c2.g * w,
      c1.b * (1 - w) + c2.b * w
    );
  } catch {
    return hex1;
  }
}

export const AlgoLogo: React.FC<AlgoLogoProps> = ({
  size = 'md',
  showText = true,
  variant,
  className = '',
  subtext,
  hideTagline = false,
  layout = 'horizontal',
  badgeStyle = 'pill',
  taglineUppercase = true,
}) => {
  let themeConfig;
  let colorThemeMode = 'dark';
  try {
    const app = useApp();
    themeConfig = app?.currentThemeConfig;
    if (app?.colorThemeMode) {
      colorThemeMode = app.colorThemeMode;
    }
  } catch (e) {
  }

  const isLight = colorThemeMode === 'light';
  const isLightText = variant === 'light' ? true : variant === 'dark' ? false : !isLight;

  const primary = themeConfig?.primaryHex || '#0EA36F';
  const secondary = themeConfig?.secondaryHex || '#0b8457';
  const accent = themeConfig?.accentHex || '#34d399';
  const themeId = themeConfig?.id || 'default';

  const borderStop0 = mixHex(accent, '#ffffff', 0.2);
  const borderStop35 = primary;
  const borderStop70 = secondary;
  const borderStop100 = mixHex(secondary, '#000000', 0.45);

  const scissorStop0 = mixHex(secondary, '#000000', 0.7);
  const scissorStop40 = mixHex(primary, '#000000', 0.6);
  const scissorStop75 = mixHex(secondary, '#000000', 0.35);
  const scissorStop100 = mixHex(secondary, '#000000', 0.85);

  const bladeHighlight0 = mixHex(primary, '#ffffff', 0.1);
  const bladeHighlight50 = mixHex(secondary, '#000000', 0.5);
  const bladeHighlight100 = mixHex(secondary, '#000000', 0.85);

  const pinBody0 = primary;
  const pinBody30 = secondary;
  const pinBody70 = mixHex(secondary, '#000000', 0.45);
  const pinBody100 = mixHex(secondary, '#000000', 0.85);

  const pinBevel0 = mixHex(accent, '#ffffff', 0.6);
  const pinBevel50 = accent;
  const pinBevel100 = primary;

  const targetReticle0 = '#ffffff';
  const targetReticle50 = mixHex(accent, '#ffffff', 0.45);
  const targetReticle100 = accent;

  const targetDiscBg = mixHex(secondary, '#000000', 0.88);
  const scissorPivotStroke = mixHex(secondary, '#000000', 0.7);

  const mapCardGrad0 = mixHex(accent, '#ffffff', 0.88);
  const mapCardGrad100 = '#e2e8f0';
  const mapPinFill = primary;

  const iconDimensions = {
    sm: { width: 36, height: 36, radius: 10 },
    md: { width: 48, height: 48, radius: 14 },
    lg: { width: 72, height: 72, radius: 20 },
    xl: { width: 96, height: 96, radius: 26 },
    splash: { width: 120, height: 120, radius: 32 },
  }[size];

  const uid = `algoLogo_${themeId}`;

  const isVertical = layout === 'vertical';

  return (
    <div
      className={`flex select-none ${
        isVertical
          ? 'flex-col items-center text-center gap-3'
          : 'items-center gap-3.5'
      } ${className}`}
    >
      <div
        className="relative flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105"
        style={{
          width: iconDimensions.width,
          height: iconDimensions.height,
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}_borderGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={borderStop0} />
              <stop offset="35%" stopColor={borderStop35} />
              <stop offset="70%" stopColor={borderStop70} />
              <stop offset="100%" stopColor={borderStop100} />
            </linearGradient>

            <linearGradient id={`${uid}_cardBg`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="85%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#f1f5f9" />
            </linearGradient>

            <linearGradient id={`${uid}_scissorGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={scissorStop0} />
              <stop offset="40%" stopColor={scissorStop40} />
              <stop offset="75%" stopColor={scissorStop75} />
              <stop offset="100%" stopColor={scissorStop100} />
            </linearGradient>

            <linearGradient id={`${uid}_bladeHighlight`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={bladeHighlight0} />
              <stop offset="50%" stopColor={bladeHighlight50} />
              <stop offset="100%" stopColor={bladeHighlight100} />
            </linearGradient>

            <linearGradient id={`${uid}_pinBodyGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={pinBody0} />
              <stop offset="30%" stopColor={pinBody30} />
              <stop offset="70%" stopColor={pinBody70} />
              <stop offset="100%" stopColor={pinBody100} />
            </linearGradient>

            <linearGradient id={`${uid}_pinBevelGrad`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={pinBevel0} />
              <stop offset="50%" stopColor={pinBevel50} />
              <stop offset="100%" stopColor={pinBevel100} />
            </linearGradient>

            <linearGradient id={`${uid}_targetReticleGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={targetReticle0} />
              <stop offset="50%" stopColor={targetReticle50} />
              <stop offset="100%" stopColor={targetReticle100} />
            </linearGradient>

            <linearGradient id={`${uid}_mapCardGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mapCardGrad0} />
              <stop offset="100%" stopColor={mapCardGrad100} />
            </linearGradient>

            <filter id={`${uid}_depthShadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.35" />
            </filter>

            <filter id={`${uid}_pinShadow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="2" dy="5" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.45" />
            </filter>
          </defs>

          <rect
            x="8"
            y="8"
            width="184"
            height="184"
            rx="46"
            fill={`url(#${uid}_cardBg)`}
            stroke={`url(#${uid}_borderGrad)`}
            strokeWidth="8"
          />

          <g transform="translate(102, 94) rotate(-5)" opacity="0.9">
            <path
              d="M 6 12 L 56 0 C 62 0 66 4 66 10 L 66 60 C 66 66 60 70 54 70 L 6 64 C 2 64 0 60 0 56 L 0 18 C 0 14 2 12 6 12 Z"
              fill={`url(#${uid}_mapCardGrad)`}
              stroke="#cbd5e1"
              strokeWidth="1.5"
            />
            <line x1="8" y1="28" x2="62" y2="16" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="4" y1="46" x2="64" y2="38" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="22" y1="12" x2="30" y2="65" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <line x1="44" y1="8" x2="52" y2="66" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
            <line x1="12" y1="36" x2="58" y2="58" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />

            <g transform="translate(48, 48) scale(0.65)">
              <path
                d="M 10 0 C 4.5 0 0 4.5 0 10 C 0 16 10 24 10 24 C 10 24 20 16 20 10 C 20 4.5 15.5 0 10 0 Z"
                fill={mapPinFill}
              />
              <circle cx="10" cy="9" r="3.5" fill="#ffffff" />
            </g>
          </g>

          <g filter={`url(#${uid}_depthShadow)`}>
            <g transform="translate(62, 66)">
              <path
                d="M -24 -24 C -28 -34 -18 -40 -12 -34 C -8 -28 -14 -22 -20 -18 Z"
                fill={`url(#${uid}_scissorGrad)`}
              />
              <circle
                cx="-12"
                cy="-6"
                r="22"
                fill="none"
                stroke={`url(#${uid}_scissorGrad)`}
                strokeWidth="10"
              />
            </g>

            <g transform="translate(56, 138)">
              <circle
                cx="-6"
                cy="0"
                r="22"
                fill="none"
                stroke={`url(#${uid}_scissorGrad)`}
                strokeWidth="10"
              />
            </g>

            <path
              d="M 64 68 L 94 102 L 86 110 L 54 78 Z"
              fill={`url(#${uid}_scissorGrad)`}
            />

            <path
              d="M 62 130 L 94 102 L 102 110 L 70 138 Z"
              fill={`url(#${uid}_scissorGrad)`}
            />

            <path
              d="M 94 102 L 136 156 C 138 159 135 162 131 162 L 118 154 L 86 110 Z"
              fill={`url(#${uid}_bladeHighlight)`}
            />

            <path
              d="M 94 102 L 126 56 C 128 53 132 54 133 58 L 128 72 L 102 110 Z"
              fill={`url(#${uid}_scissorGrad)`}
            />

            <circle cx="94" cy="106" r="6" fill="#ffffff" stroke={scissorPivotStroke} strokeWidth="2" />
            <circle cx="94" cy="106" r="2.5" fill={scissorPivotStroke} />
          </g>

          <g filter={`url(#${uid}_pinShadow)`}>
            <path
              d="M 132 38 C 108 38 90 56 90 80 C 90 108 126 148 130.5 152.5 C 131.3 153.5 132.7 153.5 133.5 152.5 C 138 148 174 108 174 80 C 174 56 156 38 132 38 Z"
              fill={`url(#${uid}_pinBodyGrad)`}
              stroke="#ffffff"
              strokeWidth="2.5"
            />

            <path
              d="M 104 74 C 104 58 116 46 132 46 C 144 46 154 53 158 64"
              stroke={`url(#${uid}_pinBevelGrad)`}
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.85"
            />

            <circle cx="132" cy="78" r="23" fill={targetDiscBg} stroke={`url(#${uid}_pinBevelGrad)`} strokeWidth="2.5" />

            <circle cx="132" cy="78" r="16" fill="none" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2.5" />

            <circle cx="132" cy="78" r="8" fill="none" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2" />

            <circle cx="132" cy="78" r="3" fill="#ffffff" />

            <line x1="132" y1="58" x2="132" y2="65" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="132" y1="91" x2="132" y2="98" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="112" y1="78" x2="119" y2="78" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2.5" strokeLinecap="round" />
            <line x1="145" y1="78" x2="152" y2="78" stroke={`url(#${uid}_targetReticleGrad)`} strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </svg>
      </div>

      {showText && (
        <div className={`inline-flex flex-col ${isVertical ? 'items-center' : 'items-end'} whitespace-nowrap min-w-0`}>
          <div className="flex items-center gap-1.5 sm:gap-2 leading-none">
            <span
              className={`font-black tracking-tight font-['Outfit',sans-serif] ${
                isLightText ? 'text-white' : 'text-slate-950'
              } ${
                size === 'splash'
                  ? 'text-3xl sm:text-4xl'
                  : size === 'xl'
                  ? 'text-2xl'
                  : size === 'lg'
                  ? 'text-xl'
                  : size === 'sm'
                  ? 'text-base sm:text-lg'
                  : 'text-lg sm:text-xl'
              }`}
            >
              ALGO
            </span>

            {badgeStyle === 'pill' ? (
              <span
                style={{
                  backgroundColor: primary,
                  boxShadow: `0 3px 10px ${primary}40`,
                }}
                className={`font-black text-white px-2 py-0.5 rounded-lg font-['Outfit',sans-serif] uppercase tracking-wide ${
                  size === 'splash'
                    ? 'text-2xl sm:text-3xl px-3 py-1 rounded-xl'
                    : size === 'xl'
                    ? 'text-xl px-2.5 py-0.5'
                    : size === 'lg'
                    ? 'text-base px-2 py-0.5'
                    : size === 'sm'
                    ? 'text-xs sm:text-sm px-1.5 py-0.5'
                    : 'text-sm sm:text-base px-2 py-0.5'
                }`}
              >
                Salon
              </span>
            ) : (
              <span
                style={{ color: primary }}
                className={`font-extrabold ${
                  size === 'splash'
                    ? 'text-3xl sm:text-4xl'
                    : size === 'xl'
                    ? 'text-2xl'
                    : size === 'lg'
                    ? 'text-xl'
                    : size === 'sm'
                    ? 'text-base'
                    : 'text-lg'
                }`}
              >
                Salon
              </span>
            )}

            {subtext && size === 'sm' && (
              <span
                style={{
                  backgroundColor: `${primary}20`,
                  color: primary,
                }}
                className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider"
              >
                {subtext}
              </span>
            )}
          </div>

          {!hideTagline && (
            <div className={`flex items-center gap-1.5 self-end ${isVertical ? 'mt-1.5' : 'mt-0.5 sm:mt-1'}`}>
              <span
                className={`font-black font-sans text-right self-end ${
                  taglineUppercase
                    ? 'uppercase tracking-[0.24em] text-[9px] sm:text-[10px] pr-0.5'
                    : 'tracking-wide text-[10px] sm:text-[11px]'
                } ${isLightText ? 'text-slate-300' : 'text-slate-600'}`}
              >
                {taglineUppercase ? 'BY SPOT-PRO' : 'by Spot-Pro'}
              </span>
              {subtext && size !== 'sm' && (
                <span
                  style={{
                    backgroundColor: `${primary}20`,
                    color: primary,
                  }}
                  className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ml-1"
                >
                  {subtext}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
