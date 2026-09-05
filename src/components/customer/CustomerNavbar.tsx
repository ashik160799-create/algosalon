import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AlgoLogo } from '../common/AlgoLogo';
import { ThemeSwitcherModal } from '../common/ThemeSwitcherModal';
import { LocaleRegionSwitcherModal } from '../common/LocaleRegionSwitcherModal';
import {
  Home,
  Calendar,
  Heart,
  User,
  Bell,
  Store,
  Sparkles,
  ChevronDown,
  Palette,
  Trash2,
} from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const {
    customerUser,
    activeCustomerTab,
    setActiveCustomerTab,
    switchRole,
    logout,
    setShowSplash,
    notifications,
    markNotificationRead,
    deleteNotification,
    clearAllNotifications,
    appointments,
    currentThemeConfig,
    colorThemeMode,
    activeCountry,
    isLocaleModalOpen,
    setIsLocaleModalOpen,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const customerNotifs = notifications.filter(n => n.userType === 'customer');
  const unreadNotifsCount = customerNotifs.filter(n => !n.read).length;

  const activeBookingsCount = appointments.filter(
    a =>
      a.customerId === customerUser.id &&
      (a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled_by_business' || a.status === 'in_progress')
  ).length;

  const isLight = colorThemeMode === 'light';

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b shadow-sm transition-colors ${
        isLight
          ? 'bg-white/95 border-slate-200 text-slate-900'
          : 'bg-slate-950/95 border-slate-800/80 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setActiveCustomerTab('discover')}
            className="cursor-pointer flex items-center gap-2.5 transition-transform active:scale-95"
          >
            <AlgoLogo size={32} />
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">
              ALGO SALON
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveCustomerTab('discover')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeCustomerTab === 'discover'
                ? 'bg-primary text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            style={activeCustomerTab === 'discover' ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
          >
            <Home className="w-4 h-4" />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCustomerTab('bookings')}
            className={`relative px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeCustomerTab === 'bookings'
                ? 'bg-primary text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            style={activeCustomerTab === 'bookings' ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
          >
            <Calendar className="w-4 h-4" />
            <span>My Bookings</span>
            {activeBookingsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                {activeBookingsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveCustomerTab('saved')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeCustomerTab === 'saved'
                ? 'bg-primary text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            style={activeCustomerTab === 'saved' ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
          >
            <Heart className="w-4 h-4" />
            <span>Saved Salons</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCustomerTab('profile')}
            className={`px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all ${
              activeCustomerTab === 'profile'
                ? 'bg-primary text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:bg-slate-100'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            style={activeCustomerTab === 'profile' ? { backgroundColor: currentThemeConfig.primaryHex } : undefined}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
        </nav>

        {/* Right Actions: Theme, Region, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Region / Locale Button */}
          <button
            type="button"
            onClick={() => setIsLocaleModalOpen(true)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                : 'border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title="Country / Language / Currency"
          >
            <span className="text-sm">{activeCountry.flag}</span>
            <span className="hidden sm:inline uppercase">{activeCountry.code}</span>
          </button>

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={() => setThemeModalOpen(true)}
            className={`p-2 rounded-xl border transition-colors ${
              isLight
                ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                : 'border-slate-800 hover:bg-slate-800 text-slate-300'
            }`}
            title="Switch Theme & Style"
          >
            <Palette className="w-4 h-4" style={{ color: currentThemeConfig.primaryHex }} />
          </button>

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`relative p-2 rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div
                className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border shadow-2xl overflow-hidden z-50 animate-fadeIn ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="p-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold">Notifications</h3>
                  </div>
                  {customerNotifs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => clearAllNotifications()}
                      className="text-xs text-rose-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear all</span>
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                  {customerNotifs.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead(notif.id)}
                      className={`p-3.5 flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                        notif.read
                          ? isLight
                            ? 'hover:bg-slate-50'
                            : 'hover:bg-slate-800/40 opacity-75'
                          : isLight
                          ? 'bg-emerald-50/50 hover:bg-emerald-50 font-medium'
                          : 'bg-emerald-950/20 hover:bg-emerald-950/40'
                      }`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <h4 className="text-xs font-bold truncate">{notif.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block">{notif.timestamp}</span>
                      </div>

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {customerNotifs.length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400">
                      <p>No notifications yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Role Switch Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-2xl border transition-all ${
                isLight
                  ? 'border-slate-200 hover:bg-slate-100 text-slate-800'
                  : 'border-slate-800 hover:bg-slate-800 text-slate-200'
              }`}
            >
              <span className="text-xs font-bold hidden sm:inline max-w-[100px] truncate">
                {customerUser.name || 'Account'}
              </span>
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white shadow-sm"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                {customerUser.name ? customerUser.name.charAt(0).toUpperCase() : 'C'}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 rounded-3xl border shadow-2xl p-2 z-50 animate-fadeIn ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold truncate">{customerUser.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{customerUser.email}</p>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCustomerTab('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>My Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      switchRole('business');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-indigo-500"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Switch to Business Suite</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <ThemeSwitcherModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
      />

      <LocaleRegionSwitcherModal
        isOpen={isLocaleModalOpen}
        onClose={() => setIsLocaleModalOpen(false)}
      />
    </header>
  );
};
