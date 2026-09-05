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
      (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled_by_business')
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
              id={`bottom-nav-${tab.id}`}
              type="button"
              onClick={() => setActiveCustomerTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${tab.label}${tab.badge ? `, ${tab.badge} active` : ''}`}
              className={`relative flex min-h-11 items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                isActive
                  ? 'text-white shadow-md font-bold scale-[1.02]'
                  : isLight
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      color: '#ffffff',
                      boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {!!tab.badge && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[14px] h-3.5 px-1 rounded-full text-[9px] flex items-center justify-center font-bold shadow ${
                      isActive
                        ? isLight
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-rose-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-xs tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
