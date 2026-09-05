import React from 'react';
import { useApp } from '../../context/AppContext';
import { useKeyboardVisibility } from '../../utils/useKeyboardVisibility';
import {
  Home,
  Radio,
  Calendar,
  Scissors,
  Settings,
} from 'lucide-react';

interface BusinessBottomNavProps {
  onOpenReports?: () => void;
}

export const BusinessBottomNav: React.FC<BusinessBottomNavProps> = () => {
  const {
    activeBusinessTab,
    setActiveBusinessTab,
    currentThemeConfig,
    colorThemeMode,
    appointments,
    businessUser,
    salons,
  } = useApp();

  const isKeyboardVisible = useKeyboardVisibility();

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonAppointments = appointments.filter(a => a.salonId === salon?.id);

  const pendingLiveCount = salonAppointments.filter(a => a.status === 'pending').length;
  const activeBookingsCount = salonAppointments.filter(
    a => a.status === 'confirmed' || a.status === 'in_progress'
  ).length;

  const navItems = [
    {
      id: 'overview',
      label: 'Home',
      icon: Home,
      action: () => setActiveBusinessTab('overview'),
      badge: undefined,
    },
    {
      id: 'customers',
      label: 'Live',
      icon: Radio,
      action: () => setActiveBusinessTab('customers'),
      badge: pendingLiveCount > 0 ? pendingLiveCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
      badgePulse: true,
    },
    {
      id: 'calendar',
      label: 'Bookings',
      icon: Calendar,
      action: () => setActiveBusinessTab('calendar'),
      badge: activeBookingsCount > 0 ? activeBookingsCount : undefined,
      badgeColor: 'bg-blue-600 text-white',
      badgePulse: false,
    },
    {
      id: 'services',
      label: 'Services',
      icon: Scissors,
      action: () => setActiveBusinessTab('services'),
      badge: undefined,
    },
    {
      id: 'profile',
      label: 'Settings',
      icon: Settings,
      action: () => setActiveBusinessTab('profile'),
      badge: undefined,
    },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg transition-all duration-200 lg:hidden ${
        isKeyboardVisible ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      } ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
          : 'bg-slate-950/95 border-slate-800/90 text-slate-400 shadow-[0_-4px_25px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="grid grid-cols-5 max-w-md mx-auto px-1 py-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive =
            item.id === 'profile'
              ? activeBusinessTab === 'profile' ||
                activeBusinessTab === 'settings' ||
                activeBusinessTab === 'hours' ||
                activeBusinessTab === 'reviews'
              : activeBusinessTab === item.id;

          return (
            <button
              key={item.id}
              id={`biz-bottom-nav-${item.id}`}
              type="button"
              onClick={item.action}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              className="flex min-h-11 flex-col items-center justify-center py-1 px-0.5 relative group transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset"
            >
              <div
                className={`relative p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'scale-105'
                    : 'opacity-70 group-hover:opacity-100'
                }`}
                style={
                  isActive
                    ? {
                        color: currentThemeConfig.primaryHex,
                        backgroundColor: `${currentThemeConfig.primaryHex}15`,
                      }
                    : undefined
                }
              >
                <Icon className="w-5 h-5" />

                {/* Badge indicator */}
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                      item.badgeColor || 'bg-amber-500 text-slate-950'
                    } ${item.badgePulse ? 'animate-pulse' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] sm:text-[11px] whitespace-nowrap tracking-tight font-medium mt-0.5 transition-colors ${
                  isActive
                    ? 'font-bold'
                    : isLight
                    ? 'text-slate-600'
                    : 'text-slate-400'
                }`}
                style={
                  isActive
                    ? { color: currentThemeConfig.primaryHex }
                    : undefined
                }
              >
                {item.label}
              </span>

              {isActive && (
                <span
                  className="absolute bottom-0 w-6 h-0.5 rounded-full"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 0 8px ${currentThemeConfig.glowHex}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
