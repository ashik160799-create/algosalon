import React, { useState, useEffect } from 'react';
import { Delete, Eye, EyeOff, ArrowLeft, KeyRound, HelpCircle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';

export interface PinPadProps {
  value?: string;
  onChange?: (val: string) => void;
  length?: number;
  label?: string;
  title?: string;
  subtitle?: string;
  error?: string | null;
  errorMessage?: string | null;
  onComplete?: (pin: string) => void;
  onForgotPin?: () => void;
  onBack?: () => void;
  onClearError?: () => void;
  showNumpad?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
  value,
  onChange,
  length = 4,
  label,
  title,
  subtitle,
  error,
  errorMessage,
  onComplete,
  onForgotPin,
  onBack,
  onClearError,
  showNumpad = true,
}) => {
  const { currentThemeConfig, colorThemeMode } = useApp();
  const [internalValue, setInternalValue] = useState('');
  const [mask, setMask] = useState(true);
  const isLight = colorThemeMode === 'light';
  const primaryColor = currentThemeConfig?.primaryHex || '#0EA36F';
  const glowColor = currentThemeConfig?.glowHex || 'rgba(14,163,111,0.35)';

  const isControlled = value !== undefined && onChange !== undefined;
  const safeValue = (isControlled ? value : internalValue) || '';
  const displayError = error || errorMessage || null;

  const handleUpdate = (nextVal: string) => {
    if (displayError && onClearError) {
      onClearError();
    }

    if (isControlled) {
      onChange?.(nextVal);
    } else {
      setInternalValue(nextVal);
    }

    if (nextVal.length === length && onComplete) {
      onComplete(nextVal);
    }
  };

  const handleKeyPress = (num: number) => {
    if (displayError && onClearError) {
      onClearError();
    }

    // If already at full length or error is showing, typing a new digit starts fresh
    if (safeValue.length >= length || displayError) {
      handleUpdate(num.toString());
      return;
    }

    const next = safeValue + num.toString();
    handleUpdate(next);
  };

  const handleDelete = () => {
    if (displayError && onClearError) {
      onClearError();
    }
    if (safeValue.length > 0) {
      handleUpdate(safeValue.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (displayError && onClearError) {
      onClearError();
    }
    handleUpdate('');
  };

  // Keyboard support for desktop and physical keyboards
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [safeValue, length, displayError, isControlled]);

  return (
    <div className="w-full flex flex-col items-center select-none text-center">
      {/* Header section if onBack / Title / Subtitle is provided */}
      {(onBack || title || subtitle) && (
        <div className="w-full mb-3">
          <div className="flex items-center justify-between w-full mb-2">
            {onBack ? (
              <button
                type="button"
                id="pinpad-back-btn"
                onClick={onBack}
                className={`flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                    : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-md"
              style={{
                backgroundColor: `${primaryColor}20`,
                color: primaryColor,
              }}
            >
              <KeyRound className="w-5 h-5" />
            </div>

            <button
              type="button"
              id="pinpad-mask-toggle-btn"
              onClick={() => setMask(!mask)}
              className={`text-[11px] font-bold flex items-center gap-1 py-1 px-2.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'border-zinc-300 text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200'
                  : 'border-zinc-700 text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800'
              }`}
            >
              {mask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{mask ? 'Show' : 'Hide'}</span>
            </button>
          </div>

          {title && (
            <h2
              className={`text-xl sm:text-2xl font-black font-['Outfit',sans-serif] tracking-tight ${
                isLight ? 'text-zinc-950' : 'text-white'
              }`}
            >
              {title}
            </h2>
          )}

          {subtitle && (
            <p
              className={`mt-1 text-xs font-semibold max-w-xs mx-auto leading-relaxed ${
                isLight ? 'text-zinc-700' : 'text-zinc-300'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {label && !title && (
        <div className="w-full flex items-center justify-between mb-2 px-1">
          <span
            className={`text-xs font-bold ${
              isLight ? 'text-zinc-800' : 'text-zinc-200'
            }`}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={() => setMask(!mask)}
            className={`text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-300 hover:text-white'
            }`}
          >
            {mask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{mask ? 'Show' : 'Hide'}</span>
          </button>
        </div>
      )}

      {/* PIN Digit Indicators with Shake on Error */}
      <motion.div
        animate={displayError ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-center gap-3 my-2"
      >
        {Array.from({ length }).map((_, idx) => {
          const char = safeValue[idx];
          const isFilled = char !== undefined && char !== '';
          const isCurrent = safeValue.length === idx;

          return (
            <motion.div
              key={idx}
              initial={false}
              animate={{
                scale: isCurrent ? 1.06 : 1,
                borderColor: isCurrent
                  ? primaryColor
                  : displayError
                  ? '#ef4444'
                  : isFilled
                  ? isLight
                    ? '#71717a'
                    : '#a1a1aa'
                  : isLight
                  ? '#e4e4e7'
                  : '#27272a',
              }}
              className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black font-mono transition-all shadow-sm ${
                isLight ? 'bg-zinc-50' : 'bg-zinc-900/90'
              }`}
              style={{
                boxShadow: isCurrent
                  ? `0 0 0 3px ${glowColor}`
                  : displayError
                  ? '0 0 0 2px rgba(239,68,68,0.2)'
                  : 'none',
              }}
            >
              {isFilled ? (
                mask ? (
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: displayError ? '#ef4444' : primaryColor }}
                  />
                ) : (
                  <span className={displayError ? 'text-red-500' : isLight ? 'text-zinc-950' : 'text-white'}>
                    {char}
                  </span>
                )
              ) : (
                <span
                  className={`text-base font-bold ${
                    isLight ? 'text-zinc-400' : 'text-zinc-500'
                  }`}
                >
                  •
                </span>
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {displayError && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-1.5 mt-1"
        >
          <p className="text-xs text-red-500 font-bold text-center">
            {displayError}
          </p>
          <button
            type="button"
            id="pinpad-retry-quick-btn"
            onClick={() => {
              handleClear();
              handleKeyPress(1);
              handleKeyPress(2);
              handleKeyPress(3);
              handleKeyPress(4);
            }}
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:opacity-80 transition-opacity flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Fill Demo PIN (1234)</span>
          </button>
        </motion.div>
      )}

      {/* Forgot App Code link */}
      {onForgotPin && (
        <button
          type="button"
          id="pinpad-forgot-pin-btn"
          onClick={onForgotPin}
          className={`mt-2 text-xs font-bold underline underline-offset-4 transition-colors cursor-pointer flex items-center gap-1 mx-auto ${
            isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-300 hover:text-white'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Forgot App Code PIN?</span>
        </button>
      )}

      {showNumpad && (
        <div className="mt-3.5 w-full max-w-[280px] grid grid-cols-3 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              type="button"
              id={`pinpad-key-${num}`}
              onClick={() => handleKeyPress(num)}
              className={`h-12 sm:h-14 rounded-2xl text-lg sm:text-xl font-bold font-mono transition-all duration-150 active:scale-95 border flex items-center justify-center cursor-pointer ${
                isLight
                  ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-900 shadow-sm'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-white'
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            id="pinpad-key-clear"
            onClick={handleClear}
            className={`h-12 sm:h-14 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center cursor-pointer ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}
          >
            Clear
          </button>

          <button
            type="button"
            id="pinpad-key-0"
            onClick={() => handleKeyPress(0)}
            className={`h-12 sm:h-14 rounded-2xl text-lg sm:text-xl font-bold font-mono transition-all duration-150 active:scale-95 border flex items-center justify-center cursor-pointer ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-900 shadow-sm'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-white'
            }`}
          >
            0
          </button>

          <button
            type="button"
            id="pinpad-key-delete"
            onClick={handleDelete}
            aria-label="Delete last digit"
            className={`h-12 sm:h-14 rounded-2xl text-xs font-bold transition-all duration-150 active:scale-95 border flex items-center justify-center cursor-pointer ${
              isLight
                ? 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-200'
            }`}
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

