import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';
import { StaffAvatar } from '../common/StaffAvatar';
import { isSlotInPast, isSlotWithinNextHours } from '../../utils/dateTimeUtils';
import {
  Store,
  MapPin,
  ShieldCheck,
  DollarSign,
  Users,
  Scissors,
  Calendar,
  Box,
  CreditCard,
  BarChart3,
  Power,
  CheckCircle2,
  X,
  Upload,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

export const BusinessOverview: React.FC = () => {
  const {
    businessUser,
    salons,
    services,
    staffMembers,
    appointments,
    updateSalonProfile,
    setActiveBusinessTab,
    currentThemeConfig,
    colorThemeMode,
    activeCountry,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonAppointments = appointments.filter(a => a.salonId === salon.id);
  const salonServices = services.filter(s => s.salonId === salon.id);
  const salonStaff = staffMembers.filter(s => s.salonId === salon.id);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(activeCountry.currency);

  React.useEffect(() => {
    setSelectedCurrency(activeCountry.currency);
  }, [activeCountry.currency]);

  const isAcceptingOnline = salon.isOpenNow ?? true;

  const [showDocsModal, setShowDocsModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);

  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'submitted' | 'verified'>('pending');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const totalRevenue = useMemo(() => {
    return salonAppointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed')
      .reduce((acc, curr) => acc + curr.servicePrice, 0);
  }, [salonAppointments]);

  const todayDateStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const todayUpcomingAppointments = useMemo(() => {
    return salonAppointments.filter(apt => {
      // Strictly upcoming confirmed queue items only
      if (apt.status !== 'confirmed') return false;
      // Future dates or today's time slots that have not passed
      if (apt.date > todayDateStr) return true;
      if (apt.date === todayDateStr) return !isSlotInPast(apt.date, apt.timeSlot);
      return false;
    });
  }, [salonAppointments, todayDateStr]);

  const todayUpcomingCount = todayUpcomingAppointments.length;

  const todayInProgressAppointments = useMemo(() => {
    return salonAppointments.filter(apt => {
      // Must be scheduled for today only
      if (apt.date !== todayDateStr) return false;
      // Active in-progress guests for today (including VIP guest list)
      return apt.status === 'in_progress';
    });
  }, [salonAppointments, todayDateStr]);

  const todayInProgressCount = todayInProgressAppointments.length;

  const uniqueCustomersList = useMemo(() => {
    const map = new Map<string, { name: string; email?: string; phone?: string; totalSpent: number; bookingsCount: number; lastDate: string }>();
    salonAppointments.forEach(apt => {
      const existing = map.get(apt.customerName) || {
        name: apt.customerName,
        totalSpent: 0,
        bookingsCount: 0,
        lastDate: apt.date,
      };
      existing.totalSpent += apt.servicePrice;
      existing.bookingsCount += 1;
      existing.lastDate = apt.date;
      map.set(apt.customerName, existing);
    });
    return Array.from(map.values());
  }, [salonAppointments]);

  const [inventoryItems] = useState([
    { id: '1', sku: 'SKU-OIL-01', name: 'Argan Beard & Scalp Oil 50ml', stock: 18, price: 65, category: 'Hair Care' },
    { id: '2', sku: 'SKU-POM-02', name: 'Matte Clay High Hold Pomade', stock: 24, price: 45, category: 'Styling' },
    { id: '3', sku: 'SKU-SHP-03', name: 'Keratin Nourish Shampoo 250ml', stock: 12, price: 80, category: 'Care' },
    { id: '4', sku: 'SKU-BLD-04', name: 'Japanese Barber Razor Blades 100pk', stock: 8, price: 110, category: 'Equipment' },
  ]);

  const handleToggleOnlineStatus = () => {
    const newState = !isAcceptingOnline;
    updateSalonProfile(salon.id, { isOpenNow: newState });
  };

  const handleUploadDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setVerificationStatus('submitted');
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto">
      {/* Redesigned Compact Professional Top Header Shop Card */}
      <div
        className={`p-2.5 sm:p-3 sm:py-3 rounded-2xl sm:rounded-3xl border transition-all shadow-xs ${
          isLight
            ? 'bg-white border-slate-200/90 shadow-slate-100/60'
            : 'bg-slate-900/95 border-slate-800 shadow-black/40'
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: Compact Shop Logo + Name & Location & Status */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Shop Brand Logo (Compact Height) */}
            <div
              onClick={() => setActiveBusinessTab('settings')}
              title="Click to view & edit Shop Profile in Settings"
              className="relative shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border overflow-hidden shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-105 group"
              style={{
                borderColor: `${currentThemeConfig.primaryHex}35`,
                backgroundColor: isLight ? '#f8fafc' : '#0f172a',
              }}
            >
              {salon.logo ? (
                <img
                  src={salon.logo}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-black text-lg sm:text-xl text-white uppercase select-none"
                  style={{
                    background: `linear-gradient(135deg, ${currentThemeConfig.primaryHex}, #0f172a)`,
                  }}
                >
                  <span className="font-['Outfit',sans-serif] tracking-tight">
                    {(salon.name?.trim() || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Status indicator beacon on logo */}
              <span
                className={`absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                  isLight ? 'border-white' : 'border-slate-900'
                } ${isAcceptingOnline ? 'bg-emerald-500 shadow-xs' : 'bg-rose-500'}`}
                title={isAcceptingOnline ? 'Shop Online & Accepting' : 'Shop Offline'}
              />
            </div>

            {/* Shop Name & Location info in modern single/dual compact rows */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 select-none"
                  style={{
                    backgroundColor: `${currentThemeConfig.primaryHex}18`,
                    color: currentThemeConfig.primaryHex,
                  }}
                >
                  SHOP
                </span>
                <h1
                  className={`text-sm sm:text-base font-black leading-tight tracking-tight truncate ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}
                >
                  {salon.name || 'Spot-Pro Signature Studio'}
                </h1>
                <CheckCircle2
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: currentThemeConfig.primaryHex }}
                  title="Verified Partner Studio"
                />
              </div>

              {/* Location & Live Operating Status Row */}
              <div className="flex items-center gap-2 text-xs mt-0.5 flex-wrap">
                <div className="flex items-center gap-1 min-w-0 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[170px] sm:max-w-xs font-medium">
                    {salon.address ? `${salon.address}, ` : ''}{salon.city || 'Metro Hub'}
                  </span>
                </div>

                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

                {/* Operating Status Pill */}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                    isAcceptingOnline
                      ? isLight
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : isLight
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isAcceptingOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                    }`}
                  />
                  <span>{isAcceptingOnline ? 'Online' : 'Closed'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Modern Compact Toggle Switch / Power Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id="shop-power-toggle-btn"
              type="button"
              onClick={handleToggleOnlineStatus}
              title={isAcceptingOnline ? 'Switch to Shop Closed' : 'Switch to Shop Open'}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl border text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95 ${
                isAcceptingOnline
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                  : isLight
                  ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-400 hover:bg-rose-900'
              }`}
            >
              <Power className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">{isAcceptingOnline ? 'Shop Open' : 'Shop Closed'}</span>
              <span className="xs:hidden">{isAcceptingOnline ? 'Open' : 'Closed'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Offline Alert Banner if Shop is Closed */}
      {!isAcceptingOnline && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 ${
            isLight
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-500">
              <Power className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-xs sm:text-sm">
                Shop Currently Closed / Offline
              </p>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-rose-700' : 'text-rose-300/80'}`}>
                Your studio is marked as Closed. Today's customer online booking slots are paused. Click "Shop Closed" button above to turn back Open.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleOnlineStatus}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] shadow-sm shrink-0 cursor-pointer active:scale-95 transition-all"
          >
            Reopen Shop
          </button>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-1.5 h-4 rounded-full"
            style={{ backgroundColor: currentThemeConfig.primaryHex }}
          />
          <h2 className={`text-xs font-extrabold uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
            BUSINESS MANAGEMENT HUB
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 sm:gap-4">
        {/* 1. Customers / Live Requests (Equal Width) */}
        <button
          id="hub-card-customers"
          type="button"
          onClick={() => setActiveBusinessTab('customers')}
          className={`col-span-12 sm:col-span-6 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] group relative flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow hover:shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 shadow-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                <Users className="w-5 h-5" />
              </div>

              {/* Right Side: Badges + Arrow Container */}
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 max-w-[70%]">
                {salonAppointments.filter(a => a.status === 'pending').length > 0 && (
                  <span
                    id="today-pending-customers-badge"
                    className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs animate-pulse flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping shrink-0" />
                    <span>{`${salonAppointments.filter(a => a.status === 'pending').length} Pending`}</span>
                  </span>
                )}
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-300'}`} />
              </div>
            </div>

            <h3 className={`text-base font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Live Requests
            </h3>
            {uniqueCustomersList.length > 0 && (
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {uniqueCustomersList.length} {uniqueCustomersList.length === 1 ? 'Customer' : 'Customers'}
              </p>
            )}
          </div>
        </button>

        {/* 2. Appointments (Equal Width) */}
        <button
          id="hub-card-appointments"
          type="button"
          onClick={() => setActiveBusinessTab('calendar')}
          className={`col-span-12 sm:col-span-6 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] group relative flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow hover:shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 shadow-sm"
                style={{
                  backgroundColor: `${currentThemeConfig.primaryHex}18`,
                  color: currentThemeConfig.primaryHex,
                }}
              >
                <Calendar className="w-5 h-5" />
              </div>

              {/* Right Side: Badges + Arrow Container */}
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0 max-w-[75%]">
                {todayUpcomingCount > 0 && (
                  <span
                    id="today-upcoming-appointments-badge"
                    className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs shadow-blue-500/30 animate-pulse flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                    <span>{`${todayUpcomingCount} Upcoming`}</span>
                  </span>
                )}
                {todayInProgressCount > 0 && (
                  <span
                    id="today-inprogress-appointments-badge"
                    className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-xs shadow-purple-500/30 animate-pulse flex items-center gap-1 shrink-0 whitespace-nowrap"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                    <span>{`${todayInProgressCount} In-Progress`}</span>
                  </span>
                )}
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-300'}`} />
              </div>
            </div>

            <h3 className={`text-base font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Appointments
            </h3>
            {salonAppointments.length > 0 && (
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                All bookings {salonAppointments.length}
              </p>
            )}
          </div>
        </button>

        {/* 3. Services (Equal Width) */}
        <button
          id="hub-card-services"
          type="button"
          onClick={() => setActiveBusinessTab('services')}
          className={`col-span-12 sm:col-span-6 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] group relative flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow hover:shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 shadow-sm bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <Scissors className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-300'}`} />
              </div>
            </div>

            <h3 className={`text-base font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Services
            </h3>
            {salonServices.length > 0 && (
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {salonServices.length} {salonServices.length === 1 ? 'Service' : 'Services'}
              </p>
            )}
          </div>
        </button>

        {/* 4. Staff (Equal Width) */}
        <button
          id="hub-card-staff"
          type="button"
          onClick={() => setActiveBusinessTab('staff')}
          className={`col-span-12 sm:col-span-6 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.015] active:scale-[0.99] group relative flex flex-col justify-between ${
            isLight
              ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow hover:shadow-lg'
          }`}
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 shadow-sm bg-purple-500/10 text-purple-600 dark:text-purple-400"
              >
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
                <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-300'}`} />
              </div>
            </div>

            <h3 className={`text-base font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Staff
            </h3>
            {salonStaff.length > 0 && (
              <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {salonStaff.length} {salonStaff.length === 1 ? 'Stylist' : 'Stylists'}
              </p>
            )}
          </div>
        </button>

        {/* 5. Financial Reports & Analytics (Full width 12 columns - Includes Inventory & Payroll inside) */}
        <button
          id="hub-card-reports"
          type="button"
          onClick={() => setActiveBusinessTab('reports')}
          className={`col-span-12 p-4 sm:p-5 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] group relative ${
            isLight
              ? 'bg-white border-slate-200/80 hover:border-slate-300 shadow-sm hover:shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow hover:shadow-lg'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200 shadow-sm bg-sky-500/10 text-sky-600 dark:text-sky-400"
            >
              <BarChart3 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                Financials
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
                Inventory
              </span>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
                Staff Payroll
              </span>
              <ArrowRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1 duration-200 ${isLight ? 'text-slate-400 group-hover:text-slate-600' : 'text-slate-600 group-hover:text-slate-300'}`} />
            </div>
          </div>
          <h3 className={`text-base sm:text-lg font-extrabold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Financial Reports & Business Analytics
          </h3>
          <p className={`text-xs mt-1 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {selectedCurrency} {totalRevenue.toLocaleString()} Revenue • Tax Reports, Product Inventory & Staff Payroll Statements
          </p>
        </button>
      </div>

      {/* Verification Docs Modal */}
      {showDocsModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200" onClick={() => setShowDocsModal(false)}>
          <div
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-200 my-auto ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Business License Verification
              </h3>
              <button onClick={() => setShowDocsModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                Upload your registered trade license or national business tax registration to earn verified status on ALGO.
              </p>

              <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="font-bold text-slate-700 dark:text-slate-200">Click to upload license (PDF / PNG)</span>
                <span className="text-[10px] text-slate-400 mt-1">Maximum file size 10MB</span>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleUploadDocument} className="hidden" />
              </label>

              {uploadedFileName && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-semibold truncate">{uploadedFileName}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow transition-all active:scale-95"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
