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
    a => a.customerId === customerUser.id && (a.status === 'confirmed' || a.status === 'pending')
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
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="customer-brand-logo-btn"
              onClick={() => setActiveCustomerTab('discover')}
              className="text-left focus:outline-none flex items-center transition-transform hover:opacity-90 active:scale-95"
              title="ALGO Salon - Discover"
            >
              <AlgoLogo size="sm" hideTagline={false} />
            </button>
          </div>

          <nav
            className={`hidden md:flex items-center gap-1 p-1 rounded-full text-xs font-semibold border transition-colors shrink-0 ${
              isLight
                ? 'bg-slate-100/90 border-slate-200/90'
                : 'bg-slate-900/90 border-slate-800/90'
            }`}
          >
            <button
              id="nav-tab-discover"
              type="button"
              onClick={() => setActiveCustomerTab('discover')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeCustomerTab === 'discover'
                  ? 'text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              style={
                activeCustomerTab === 'discover'
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 10px -1px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <Home className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              id="nav-tab-bookings"
              type="button"
              onClick={() => setActiveCustomerTab('bookings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all relative ${
                activeCustomerTab === 'bookings'
                  ? 'text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              style={
                activeCustomerTab === 'bookings'
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 10px -1px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Booking</span>
              {activeBookingsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeBookingsCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-saved"
              type="button"
              onClick={() => setActiveCustomerTab('saved')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all relative ${
                activeCustomerTab === 'saved'
                  ? 'text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              style={
                activeCustomerTab === 'saved'
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 10px -1px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <Heart className="w-3.5 h-3.5" />
              <span>Saved</span>
              {customerUser.savedSalonIds.length > 0 && (
                <span className="text-[10px] opacity-75 font-mono">
                  ({customerUser.savedSalonIds.length})
                </span>
              )}
            </button>

            <button
              id="nav-tab-profile"
              type="button"
              onClick={() => setActiveCustomerTab('profile')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all ${
                activeCustomerTab === 'profile'
                  ? 'text-white shadow-sm font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              style={
                activeCustomerTab === 'profile'
                  ? {
                      backgroundColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 2px 10px -1px ${currentThemeConfig.glowHex}`,
                    }
                  : undefined
              }
            >
              <User className="w-3.5 h-3.5" />
              <span>Profile</span>
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="customer-navbar-locale-btn"
              type="button"
              onClick={() => setIsLocaleModalOpen(true)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-full border text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs ${
                isLight
                  ? 'bg-slate-100/90 border-slate-200 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900/90 border-slate-800 text-slate-200 hover:bg-slate-800'
              }`}
              title={`Region: ${activeCountry.name} (${activeCountry.currency}, ${activeCountry.dialCode}) - Click to change`}
              aria-label="Region, Currency and Language Settings"
            >
              <span className="text-sm leading-none">{activeCountry.flag}</span>
              <span className="font-mono text-[11px] font-extrabold">{activeCountry.currency}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden 2xl:inline">{activeCountry.dialCode}</span>
            </button>

            <button
              id="customer-navbar-theme-btn"
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className={`relative p-2 rounded-full border transition-all ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
              }`}
              title="Customize Theme & Salon Palettes"
              aria-label="Theme & Salon Palettes"
            >
              <Palette className="w-4 h-4" style={{ color: currentThemeConfig.primaryHex }} />
              <span
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              />
            </button>

            <div className="relative">
              <button
                id="customer-notifications-btn"
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileDropdownOpen(false);
                }}
                className={`relative p-2 rounded-full border transition-colors ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-950'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifsCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse"
                    style={{ backgroundColor: currentThemeConfig.primaryHex }}
                  >
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-2xl p-4 z-50 animate-fadeIn ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4" style={{ color: currentThemeConfig.accentHex }} />
                      <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Notifications</span>
                    </div>
                    {customerNotifs.length > 0 && (
                      <button
                        onClick={() => clearAllNotifications('customer')}
                        className={`text-[11px] ${isLight ? 'text-slate-500 hover:text-slate-900' : 'text-slate-400 hover:text-white'}`}
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className={`mt-3 max-h-72 overflow-y-auto space-y-2.5 divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
                    {customerNotifs.length === 0 ? (
                      <div className={`text-center py-6 text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        No notifications yet.
                      </div>
                    ) : (
                      customerNotifs.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationRead(n.id);
                            if (n.appointmentId) {
                              setActiveCustomerTab('bookings');
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`pt-2 cursor-pointer transition-colors ${
                            !n.read
                              ? isLight
                                ? 'p-2 rounded-xl border border-slate-200 bg-slate-50'
                                : 'p-2 rounded-xl border border-slate-700 bg-slate-950/60'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{n.title}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{n.timestamp}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(n.id);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <p className={`text-xs mt-0.5 leading-tight ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                id="customer-profile-menu-btn"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  setNotificationsOpen(false);
                }}
                className={`flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-full border transition-all text-xs focus:outline-none ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <img
                  src={customerUser.avatar}
                  alt={customerUser.name}
                  className={`w-7 h-7 rounded-full object-cover ring-1 ${isLight ? 'ring-slate-300' : 'ring-slate-700'}`}
                />
                <span className={`hidden sm:inline font-semibold max-w-[90px] truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {customerUser.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-2xl p-2 z-50 text-xs animate-fadeIn ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <div className={`p-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <p className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{customerUser.name}</p>
                    <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{customerUser.email}</p>
                    <div
                      className={`mt-2 flex items-center justify-between px-2 py-1 rounded border text-[10px] font-semibold ${
                        isLight
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-slate-950 border-slate-800 text-amber-400'
                      }`}
                    >
                      <span>Loyalty Points</span>
                      <strong className={`font-bold ${isLight ? 'text-amber-950' : 'text-white'}`}>{customerUser.loyaltyPoints} pts</strong>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setThemeModalOpen(true);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Palette className="w-3.5 h-3.5" style={{ color: currentThemeConfig.accentHex }} />
                      Change Colors & Theme
                    </button>
                    <button
                      onClick={() => {
                        setActiveCustomerTab('bookings');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      My Appointments
                    </button>
                    <button
                      onClick={() => {
                        setActiveCustomerTab('saved');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 text-pink-500" />
                      Favorite Salons
                    </button>
                    <button
                      onClick={() => {
                        setActiveCustomerTab('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        isLight ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      Account Settings
                    </button>
                  </div>

                  <div className={`pt-1 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <button
                      onClick={() => {
                        setShowSplash(true);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 ${
                        isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      View Splash Screen
                    </button>
                    <button
                      onClick={() => {
                        switchRole('business');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 font-medium ${
                        isLight ? 'text-amber-800 hover:bg-amber-50' : 'text-amber-300 hover:bg-amber-950/30'
                      }`}
                    >
                      <Store className="w-3.5 h-3.5 text-amber-500" />
                      Switch to Salon Business Hub
                    </button>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ThemeSwitcherModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      <LocaleRegionSwitcherModal isOpen={isLocaleModalOpen} onClose={() => setIsLocaleModalOpen(false)} />
    </header>
  );
};
