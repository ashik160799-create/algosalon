import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AlgoLogo } from '../common/AlgoLogo';
import { ThemeSwitcherModal } from '../common/ThemeSwitcherModal';
import { LocaleRegionSwitcherModal } from '../common/LocaleRegionSwitcherModal';
import { BusinessNotificationDrawer } from './BusinessNotificationDrawer';
import {
  Store,
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  User,
  Bell,
  Sparkles,
  ChevronDown,
  Palette,
  Sun,
  Moon,
  BarChart3,
  Settings,
} from 'lucide-react';

export const BusinessNavbar: React.FC = () => {
  const {
    businessUser,
    activeBusinessTab,
    setActiveBusinessTab,
    switchRole,
    logout,
    setShowSplash,
    salons,
    updateSalonProfile,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    appointments,
    currentThemeConfig,
    colorThemeMode,
    toggleColorThemeMode,
    activeCountry,
    isLocaleModalOpen,
    setIsLocaleModalOpen,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  const isLight = colorThemeMode === 'light';
  const activeSalon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const businessNotifs = notifications.filter(n => n.userType === 'business');
  const unreadCount = businessNotifs.filter(n => !n.read).length;

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayBookingsCount = appointments.filter(
    a => a.salonId === activeSalon.id && a.date === todayStr && a.status === 'confirmed'
  ).length;

  const pendingRequestsCount = appointments.filter(
    a => a.salonId === activeSalon.id && a.status === 'pending'
  ).length;

  const toggleSalonOpenState = () => {
    updateSalonProfile(activeSalon.id, {
      isOpenNow: !activeSalon.isOpenNow,
    });
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-md border-b shadow-sm transition-colors ${
        isLight ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-950/95 border-slate-800 text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 w-full">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="business-brand-logo-btn"
              onClick={() => setActiveBusinessTab('overview')}
              className="text-left focus:outline-none flex items-center transition-transform hover:opacity-90 active:scale-95 shrink-0"
              title="ALGO Salon Partner Hub"
            >
              <AlgoLogo size="sm" subtext="PARTNER" />
            </button>

            <div
              className={`hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-2xl border shrink-0 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}
            >
              {activeSalon.logo ? (
                <img
                  src={activeSalon.logo}
                  alt={activeSalon.name}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  {(activeSalon.name?.trim() || 'A').charAt(0).toUpperCase()}
                </span>
              )}
              <div className="text-xs">
                <span className={`font-bold block truncate max-w-[140px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeSalon.name}
                </span>
              </div>
              <button
                onClick={toggleSalonOpenState}
                className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  activeSalon.isOpenNow
                    ? isLight
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                    : isLight
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {activeSalon.isOpenNow ? '● OPEN' : '● CLOSED'}
              </button>
            </div>
          </div>

          <nav
            className={`hidden lg:flex items-center gap-0.5 xl:gap-1 p-1 rounded-2xl border text-xs font-semibold shrink-0 ${
              isLight ? 'bg-slate-100/90 border-slate-200/90' : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <button
              id="biz-nav-overview"
              onClick={() => setActiveBusinessTab('overview')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs ${
                activeBusinessTab === 'overview'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'overview' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              id="biz-nav-customers"
              onClick={() => setActiveBusinessTab('customers')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs relative ${
                activeBusinessTab === 'customers'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'customers' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customers</span>
              {pendingRequestsCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>

            <button
              id="biz-nav-staff"
              onClick={() => setActiveBusinessTab('staff')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs ${
                activeBusinessTab === 'staff'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'staff' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staff</span>
            </button>

            <button
              id="biz-nav-services"
              onClick={() => setActiveBusinessTab('services')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs ${
                activeBusinessTab === 'services'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'services' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Services</span>
            </button>

            <button
              id="biz-nav-calendar"
              onClick={() => setActiveBusinessTab('calendar')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs relative ${
                activeBusinessTab === 'calendar'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'calendar' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Bookings</span>
              {todayBookingsCount > 0 && (
                <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-slate-950 text-[9px] flex items-center justify-center font-bold">
                  {todayBookingsCount}
                </span>
              )}
            </button>

            <button
              id="biz-nav-reports"
              onClick={() => setActiveBusinessTab('reports')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs ${
                activeBusinessTab === 'reports'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'reports' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reports</span>
            </button>

            <button
              id="biz-nav-profile"
              onClick={() => setActiveBusinessTab('profile')}
              className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl transition-all text-[11px] xl:text-xs ${
                activeBusinessTab === 'profile' || activeBusinessTab === 'settings'
                  ? 'text-white shadow font-bold'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              style={{
                backgroundColor: activeBusinessTab === 'profile' || activeBusinessTab === 'settings' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="biz-navbar-locale-btn"
              type="button"
              onClick={() => setIsLocaleModalOpen(true)}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all hover:scale-105 active:scale-95 shadow-xs ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
              }`}
              title={`Region: ${activeCountry.name} (${activeCountry.currency}, ${activeCountry.dialCode}) - Click to configure`}
            >
              <span className="text-sm leading-none">{activeCountry.flag}</span>
              <span className="font-mono text-[11px] font-extrabold">{activeCountry.currency}</span>
              <span className="text-[10px] text-slate-400 font-mono hidden 2xl:inline">{activeCountry.dialCode}</span>
            </button>

            <button
              id="biz-theme-mode-toggle"
              type="button"
              onClick={toggleColorThemeMode}
              className={`p-1.5 sm:p-2 rounded-xl border transition-all ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80 hover:text-slate-950'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
              }`}
              title={isLight ? 'Switch to Dark Mode (Noir)' : 'Switch to Light Mode (Clean)'}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              id="biz-header-theme-btn"
              type="button"
              onClick={() => setThemeModalOpen(true)}
              className={`hidden md:inline-flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm group ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200/80'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200'
              }`}
              title="Change Color Theme & Palette"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              />
              <span className={`hidden 2xl:inline text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                {currentThemeConfig.name}
              </span>
              <Palette className={`w-3.5 h-3.5 ${isLight ? 'text-slate-500 group-hover:text-slate-900' : 'text-slate-400 group-hover:text-white'}`} />
            </button>

            <button
              id="switch-to-customer-btn"
              onClick={() => switchRole('customer')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Switch to Customer Booking App"
            >
              <User className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden xl:inline">Customer View</span>
              <span className="xl:hidden">Customer</span>
            </button>

            {/* Slide-out Notifications Trigger */}
            <div className="relative">
              <button
                id="biz-notifications-btn"
                onClick={() => setNotificationsOpen(true)}
                className={`relative p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-slate-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title="View Shop Notifications"
                aria-label="Open notifications slide-out panel"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center font-bold animate-pulse shadow-xs"
                    style={{ backgroundColor: currentThemeConfig.primaryHex }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="relative">
              <button
                id="biz-profile-menu-btn"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all text-xs cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
                title="Business Profile & Settings"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs overflow-hidden"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  {activeSalon.logo ? (
                    <img
                      src={activeSalon.logo}
                      alt={activeSalon.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{activeSalon.name.charAt(0) || 'S'}</span>
                  )}
                </div>
                <span className={`hidden sm:inline font-bold max-w-[110px] truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {activeSalon.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-72 rounded-2xl border shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                  style={{
                    boxShadow: `0 15px 35px -5px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  {/* Shop & Business Profile Header */}
                  <div className={`p-3 rounded-xl border mb-1.5 ${
                    isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shrink-0 overflow-hidden shadow-xs"
                        style={{ backgroundColor: currentThemeConfig.primaryHex }}
                      >
                        {activeSalon.logo ? (
                          <img
                            src={activeSalon.logo}
                            alt={activeSalon.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{activeSalon.name.charAt(0) || 'S'}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className={`font-extrabold truncate text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {activeSalon.name}
                          </p>
                          <span
                            className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-sm shrink-0"
                            style={{
                              backgroundColor: `${currentThemeConfig.primaryHex}20`,
                              color: currentThemeConfig.primaryHex,
                            }}
                          >
                            SHOP
                          </span>
                        </div>
                        <p className={`text-[11px] truncate font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {businessUser.ownerRole || 'Salon Director & Business Admin'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Core Navigation Actions */}
                  <div className="py-1 space-y-0.5">
                    <button
                      onClick={() => {
                        setActiveBusinessTab('overview');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer ${
                        activeBusinessTab === 'overview'
                          ? isLight
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-slate-800 text-white'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                      <span>Business Dashboard</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveBusinessTab('profile');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer ${
                        activeBusinessTab === 'profile' || activeBusinessTab === 'settings'
                          ? isLight
                            ? 'bg-slate-100 text-slate-900'
                            : 'bg-slate-800 text-white'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Store className="w-4 h-4 text-purple-500" />
                      <span>Salon Settings & Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setThemeModalOpen(true);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Palette className="w-4 h-4" style={{ color: currentThemeConfig.accentHex }} />
                      <div className="flex items-center justify-between flex-1">
                        <span>Colors & Theme</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: currentThemeConfig.primaryHex }}
                        />
                      </div>
                    </button>
                  </div>

                  {/* Secondary portal & auth actions */}
                  <div className={`pt-1.5 mt-1 border-t space-y-0.5 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                    <button
                      onClick={() => {
                        switchRole('customer');
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-bold transition-colors cursor-pointer ${
                        isLight
                          ? 'text-purple-700 hover:bg-purple-50 bg-purple-50/50'
                          : 'text-purple-300 hover:bg-purple-950/50 bg-purple-950/20'
                      }`}
                    >
                      <User className="w-4 h-4 text-purple-500" />
                      <span>Switch to Customer Portal</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowSplash(true);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                        isLight
                          ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>View Splash Screen</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
      <BusinessNotificationDrawer isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </header>
  );
};
