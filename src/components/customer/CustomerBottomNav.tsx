import React from 'react';
import { useApp } from '../../context/AppContext';
import { useKeyboardVisibility } from '../../utils/useKeyboardVisibility';
import {
  Home,
  Calendar,
  Heart,
  User,
} from 'lucide-react';

export const CustomerBottomNav: React.FC = () => {
  const {
    activeCustomerTab,
    setActiveCustomerTab,
    customerUser,
    appointments,
    currentThemeConfig,
    colorThemeMode,
  } = useApp();

  const isKeyboardVisible = useKeyboardVisibility();

  const activeBookingsCount = appointments.filter(
    a =>
      a.customerId === customerUser.id &&
      (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled_by_business' || a.status === 'in_progress')
  ).length;

  const savedCount = customerUser.savedSalonIds?.length || 0;

  const tabs: Array<{
    id: 'discover' | 'bookings' | 'saved' | 'profile';
    label: string;
    icon: typeof Home;
    badge?: number;
  }> = [
    { id: 'discover', label: 'Home', icon: Home },
    { id: 'bookings', label: 'Bookings', icon: Calendar, badge: activeBookingsCount },
    { id: 'saved', label: 'Saved', icon: Heart, badge: savedCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const isLight = colorThemeMode === 'light';

  return (
    <nav
      id="customer-bottom-navigation"
      aria-label="Customer Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden backdrop-blur-xl border-t transition-all duration-200 ${
        isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      } ${
        isLight
          ? 'bg-white/90 border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]'
          : 'bg-slate-950/90 border-slate-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="max-w-md mx-auto px-3 py-2 flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeCustomerTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveCustomerTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-primary font-bold'
                  : isLight
                  ? 'text-slate-400 hover:text-slate-600'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                  style={isActive ? { color: currentThemeConfig.primaryHex } : undefined}
                />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white min-w-[16px] text-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 transition-colors duration-200 ${
                  isActive ? 'font-bold text-primary' : 'font-medium'
                }`}
                style={isActive ? { color: currentThemeConfig.primaryHex } : undefined}
              >
                {tab.label}
              </span>

              {isActive && (
                <div
                  className="absolute -bottom-1 w-5 h-1 rounded-full bg-primary"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
