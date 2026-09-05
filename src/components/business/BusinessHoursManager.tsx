import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { WorkingDayHour } from '../../types';
import { CheckCircle2, Save } from 'lucide-react';

export const BusinessHoursManager: React.FC = () => {
  const { businessUser, salons, updateSalonProfile, currentThemeConfig, colorThemeMode } = useApp();
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const isLight = colorThemeMode === 'light';

  const [hours, setHours] = useState<WorkingDayHour[]>(salon.workingHours);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleToggleOpen = (index: number) => {
    setHours(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, isOpen: !item.isOpen } : item))
    );
  };

  const handleTimeChange = (index: number, field: 'open' | 'close', val: string) => {
    setHours(prev =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSalonProfile(salon.id, {
      workingHours: hours,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span
            className="text-xs font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-md inline-block"
            style={{
              backgroundColor: `${currentThemeConfig.primaryHex}20`,
              color: currentThemeConfig.primaryHex,
            }}
          >
            Operating Schedule
          </span>
          <h1 className={`text-xl sm:text-2xl font-black mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Working Hours
          </h1>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto hover:opacity-95"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        >
          <Save className="w-4 h-4" />
          <span>Save Weekly Schedule</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Working hours updated successfully! Customers can now book slots accordingly.</span>
        </div>
      )}

      <div
        className={`p-4 sm:p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="space-y-3">
          {hours.map((dayItem, idx) => (
            <div
              key={dayItem.day}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                dayItem.isOpen
                  ? isLight
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-950/80 border-slate-800'
                  : isLight
                  ? 'bg-slate-100/40 border-slate-200/50 opacity-60'
                  : 'bg-slate-950/40 border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 w-full sm:w-36 justify-between sm:justify-start">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleOpen(idx)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                      dayItem.isOpen ? '' : isLight ? 'bg-slate-300' : 'bg-slate-800'
                    }`}
                    style={{
                      backgroundColor: dayItem.isOpen ? currentThemeConfig.primaryHex : undefined,
                    }}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        dayItem.isOpen ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {dayItem.day}
                  </span>
                </div>

                <span className="sm:hidden text-[11px] font-bold">
                  {dayItem.isOpen ? (
                    <span className="text-emerald-500">Open</span>
                  ) : (
                    <span className="text-rose-400">Closed</span>
                  )}
                </span>
              </div>

              {dayItem.isOpen ? (
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Opens:</span>
                    <input
                      type="text"
                      value={dayItem.open}
                      onChange={e => handleTimeChange(idx, 'open', e.target.value)}
                      className={`border rounded-lg px-2.5 py-1 font-mono text-xs w-24 focus:outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-slate-500'
                      }`}
                    />
                  </div>

                  <span className="text-slate-400 font-bold">—</span>

                  <div className="flex items-center gap-1">
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Closes:</span>
                    <input
                      type="text"
                      value={dayItem.close}
                      onChange={e => handleTimeChange(idx, 'close', e.target.value)}
                      className={`border rounded-lg px-2.5 py-1 font-mono text-xs w-24 focus:outline-none ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-900 focus:border-slate-500'
                          : 'bg-slate-900 border-slate-700 text-white focus:border-slate-500'
                      }`}
                    />
                  </div>
                </div>
              ) : (
                <span className="hidden sm:inline-block text-xs font-semibold text-rose-500 bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                  Closed on this day
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Smart Save Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-50 flex items-center gap-2 group">
        <button
          type="button"
          onClick={handleSave}
          aria-label="Save Weekly Schedule"
          className={`px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl sm:rounded-3xl font-black text-xs sm:text-sm text-white shadow-2xl transition-all duration-300 flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 cursor-pointer border border-white/20 backdrop-blur-md relative ${
            savedSuccess ? 'bg-emerald-600 border-emerald-400 ring-4 ring-emerald-500/30' : ''
          }`}
          style={{
            backgroundColor: savedSuccess ? '#10b981' : currentThemeConfig.primaryHex,
            boxShadow: savedSuccess
              ? '0 12px 35px rgba(16, 185, 129, 0.45)'
              : `0 12px 35px ${currentThemeConfig.glowHex}`,
          }}
          title="Smart Easy-Access Save • Save Schedule"
        >
          {savedSuccess ? (
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-in zoom-in-75 duration-200" />
          ) : (
            <Save className="w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-200 group-hover:rotate-6" />
          )}
          <span className="tracking-wide">
            {savedSuccess ? 'Schedule Saved!' : 'Save Schedule'}
          </span>
        </button>
      </div>
    </div>
  );
};
