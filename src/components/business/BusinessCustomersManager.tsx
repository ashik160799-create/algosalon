import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  PhoneCall,
  Crown,
  X,
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Sparkles,
  Info,
  CalendarDays,
  UserCheck,
  Filter,
  User,
} from 'lucide-react';

interface BusinessCustomersManagerProps {
  onBackToOverview?: () => void;
}

// Clean WhatsApp Icon SVG
const WhatsAppIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-4 h-4',
  color = '#25D366',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.91C21.95 9.26 20.92 6.77 19.05 4.9C17.18 3.03 14.69 2 12.04 2Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17.82 16.07C17.58 16.75 16.43 17.37 15.9 17.43C15.4 17.49 14.76 17.52 12.24 16.48C9.01 15.14 6.94 11.85 6.78 11.63C6.62 11.41 5.48 9.9 5.48 8.33C5.48 6.76 6.3 5.99 6.59 5.67C6.88 5.35 7.22 5.27 7.43 5.27C7.64 5.27 7.85 5.27 8.03 5.28C8.22 5.29 8.47 5.21 8.72 5.81C8.97 6.41 9.58 7.91 9.66 8.06C9.74 8.22 9.79 8.41 9.69 8.62C9.59 8.83 9.53 8.96 9.38 9.14C9.22 9.32 9.05 9.54 8.91 9.68C8.75 9.84 8.58 10.01 8.77 10.33C8.96 10.65 9.61 11.71 10.57 12.57C11.81 13.67 12.86 14.01 13.18 14.17C13.5 14.33 13.69 14.31 13.88 14.09C14.07 13.87 14.7 13.14 14.92 12.81C15.14 12.48 15.36 12.54 15.66 12.65C15.96 12.76 17.57 13.55 17.9 13.71C18.23 13.87 18.45 13.95 18.53 14.09C18.61 14.23 18.61 14.91 18.37 15.59L17.82 16.07Z"
      fill={color}
    />
  </svg>
);

export const BusinessCustomersManager: React.FC<BusinessCustomersManagerProps> = () => {
  const {
    businessUser,
    salons,
    staffMembers,
    appointments,
    acceptAppointment,
    suggestNewAppointmentTime,
    declineAppointment,
    isCustomerVip,
    currentThemeConfig,
    colorThemeMode,
    setActiveBusinessTab,
    activeCountry,
  } = useApp();

  const isLight = colorThemeMode === 'light';
  const salon = salons.find(s => s.id === businessUser.salonId) || salons[0];
  const salonAppointments = appointments.filter(a => a.salonId === salon.id);
  const salonStaff = staffMembers.filter(s => s.salonId === salon.id);

  const [activeFilter, setActiveFilter] = useState<
    'pending' | 'rescheduled' | 'confirmed' | 'cancelled' | 'all'
  >('pending');
  const [clientTierFilter, setClientTierFilter] = useState<'all' | 'guest' | 'vip'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Call modal state
  const [callModalApt, setCallModalApt] = useState<Appointment | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Suggest time modal state
  const [suggestModalApt, setSuggestModalApt] = useState<Appointment | null>(null);
  const [suggestDate, setSuggestDate] = useState('');
  const [suggestTimeSlot, setSuggestTimeSlot] = useState('04:00 PM');
  const [suggestStaffId, setSuggestStaffId] = useState('');
  const [suggestNote, setSuggestNote] = useState('');

  // Decline modal state
  const [declineModalApt, setDeclineModalApt] = useState<Appointment | null>(null);
  const [selectedDeclineReason, setSelectedDeclineReason] = useState('Fully Booked at Requested Slot');
  const [customDeclineReason, setCustomDeclineReason] = useState('');
  const [declineApology, setDeclineApology] = useState('');

  // Helper date & code formatters - Formats serial number as #REQ-[Capital Letter][4 Digits] e.g. #REQ-A3245, #REQ-C5438
  const formatRequestCode = (aptId: string) => {
    if (!aptId) return '#REQ-A1001';
    // If it already matches REQ-[A-Z][0-9]{4}, preserve it
    const match = aptId.match(/REQ-([A-Z][0-9]{4})/i);
    if (match) {
      return `#REQ-${match[1].toUpperCase()}`;
    }

    // Deterministic alphanumeric mapping (1 Capital Letter + 4 Digits)
    let hash = 0;
    for (let i = 0; i < aptId.length; i++) {
      hash = (hash << 5) - hash + aptId.charCodeAt(i);
      hash |= 0;
    }
    const absHash = Math.abs(hash);
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const letter = letters[absHash % letters.length];
    const digits = String((absHash % 9000) + 1000);
    return `#REQ-${letter}${digits}`;
  };

  const formatCreatedAt = (isoDate?: string) => {
    if (!isoDate) return 'Aug 31, 07:18 PM';
    try {
      const d = new Date(isoDate);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()] || 'Aug';
      const day = d.getDate();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      if (hours === 0) hours = 12;
      const hourStr = String(hours).padStart(2, '0');
      return `${month} ${day}, ${hourStr}:${minutes} ${ampm}`;
    } catch {
      return 'Aug 31, 07:18 PM';
    }
  };

  const formatBookingSlotDisplay = (dateStr: string, timeSlotStr: string) => {
    try {
      if (!dateStr) return timeSlotStr || 'Sat, 5 Sep · 03:30 PM';
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);

      const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const dayName = daysShort[d.getDay()] || 'Sat';
      const monthName = monthsShort[d.getMonth()] || 'Sep';

      return `${dayName}, ${day} ${monthName} · ${timeSlotStr}`;
    } catch {
      return `${dateStr} · ${timeSlotStr}`;
    }
  };

  const formatCurrencyPrice = (price: number) => {
    const currency = activeCountry.currency || 'AED';
    return `${currency} ${price}`;
  };

  // Filtered Appointments with enhanced search logic (#REQ-C5438, C5438, 5438, customer name, phone, etc.)
  const filteredAppointments = useMemo(() => {
    return salonAppointments.filter(apt => {
      const isVipClient = isCustomerVip(apt.customerId || apt.customerName, salon.id);
      
      if (activeFilter === 'pending' && apt.status !== 'pending') return false;
      if (activeFilter === 'rescheduled' && apt.status !== 'rescheduled_by_business') return false;
      if (activeFilter === 'confirmed' && apt.status !== 'confirmed') return false;
      if (activeFilter === 'cancelled' && apt.status !== 'cancelled') return false;

      // Tier filter in All Requests (Guest vs VIP)
      if (clientTierFilter === 'vip' && !isVipClient) return false;
      if (clientTierFilter === 'guest' && isVipClient) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const reqCode = formatRequestCode(apt.id).toLowerCase(); // e.g. "#req-c5438"
      const reqCodeNoHash = reqCode.replace('#', ''); // "req-c5438"
      const reqCodeRaw = reqCode.replace('#req-', ''); // "c5438"
      const reqDigits = reqCodeRaw.replace(/^[a-z]/i, ''); // "5438"

      return (
        reqCode.includes(q) ||
        reqCodeNoHash.includes(q) ||
        reqCodeRaw.includes(q) ||
        reqDigits.includes(q) ||
        apt.id.toLowerCase().includes(q) ||
        apt.customerName.toLowerCase().includes(q) ||
        apt.customerPhone.includes(q) ||
        apt.serviceName.toLowerCase().includes(q) ||
        apt.staffName.toLowerCase().includes(q) ||
        apt.date.includes(q)
      );
    });
  }, [salonAppointments, activeFilter, clientTierFilter, searchQuery, isCustomerVip, salon.id]);

  const pendingCount = salonAppointments.filter(a => a.status === 'pending').length;
  const vipCount = salonAppointments.filter(a => isCustomerVip(a.customerId || a.customerName, salon.id)).length;
  const guestCount = salonAppointments.filter(a => !isCustomerVip(a.customerId || a.customerName, salon.id)).length;
  const rescheduledCount = salonAppointments.filter(a => a.status === 'rescheduled_by_business').length;
  const confirmedCount = salonAppointments.filter(a => a.status === 'confirmed').length;

  // Action handlers
  const handleDirectCall = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCallModalApt(apt);
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleWhatsApp = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = apt.customerPhone.replace(/[^0-9]/g, '');
    const reqCode = formatRequestCode(apt.id);
    const message = encodeURIComponent(
      `Hello ${apt.customerName}, this is ${salon.name} regarding your booking request (${reqCode}) for ${apt.serviceName} on ${apt.date} at ${apt.timeSlot}. How can we assist you today?`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const handleAccept = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    acceptAppointment(apt.id);
    const reqCode = formatRequestCode(apt.id);
    showToast(`Request ${reqCode} for ${apt.customerName} has been accepted and confirmed!`, 'success');
  };

  const handleOpenSuggestModal = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSuggestModalApt(apt);
    setSuggestDate(apt.date);
    setSuggestTimeSlot(apt.timeSlot === '03:30 PM' ? '04:30 PM' : '03:30 PM');
    setSuggestStaffId(apt.staffId || salonStaff[0]?.id || '');
    setSuggestNote(
      `Hello ${apt.customerName}, our specialist ${apt.staffName} has an earlier/later opening at this proposed time. Would this new time suit your schedule?`
    );
  };

  const handleConfirmSuggestTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestModalApt) return;
    suggestNewAppointmentTime(suggestModalApt.id, suggestDate, suggestTimeSlot, suggestNote);
    const reqCode = formatRequestCode(suggestModalApt.id);
    showToast(`Alternate time proposed to ${suggestModalApt.customerName} for ${suggestDate} at ${suggestTimeSlot}.`, 'info');
    setSuggestModalApt(null);
  };

  const handleOpenDeclineModal = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeclineModalApt(apt);
    setSelectedDeclineReason('Fully Booked at Requested Slot');
    setCustomDeclineReason('');
    setDeclineApology(
      `Dear ${apt.customerName}, thank you for choosing ${salon.name}. We sincerely apologize that we cannot accommodate your appointment on ${apt.date} at ${apt.timeSlot} due to schedule capacity. We would be delighted to welcome you at another time!`
    );
  };

  const handleConfirmDecline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!declineModalApt) return;
    const finalReason =
      selectedDeclineReason === 'Other Reason (Specify below)'
        ? customDeclineReason.trim() || 'Salon Unavailable'
        : selectedDeclineReason;

    declineAppointment(declineModalApt.id, finalReason, declineApology);
    const reqCode = formatRequestCode(declineModalApt.id);
    showToast(`Request ${reqCode} has been declined and the customer was notified.`, 'info');
    setDeclineModalApt(null);
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-[58px] sm:top-[68px] left-3 sm:left-auto right-3 sm:right-6 z-50 max-w-md animate-in slide-in-from-top-2 duration-300">
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs font-bold backdrop-blur-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                : 'bg-slate-900/95 border-slate-700 text-white'
            }`}
            style={{
              boxShadow: `0 10px 30px -5px ${currentThemeConfig.glowHex}`,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-sky-400 shrink-0" />
              )}
              <span className="truncate">{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-300 shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Header with Notification Badge on the Right */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3.5 min-h-[38px]">
        <div className="min-w-0">
          <h1 className={`text-xl sm:text-2xl font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Live Requests List
          </h1>
        </div>

        {/* Pending Decision Notification badge on the right */}
        {pendingCount > 0 && (
          <button
            id="btn-header-pending-requests"
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black border transition-all hover:scale-105 active:scale-95 shadow-xs shrink-0 cursor-pointer animate-in fade-in duration-200 ${
              isLight
                ? 'bg-amber-50 border-amber-300/90 text-amber-950 hover:bg-amber-100'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-100 hover:bg-amber-900/60'
            }`}
            style={{
              boxShadow: `0 2px 10px -2px ${currentThemeConfig.glowHex}`,
            }}
            title="Review pending decision requests"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate max-w-[140px] xs:max-w-none">
              {pendingCount} Pending Decision{pendingCount > 1 ? 's' : ''}
            </span>
            <span className="text-[10px] text-amber-500 font-black shrink-0">&rarr;</span>
          </button>
        )}
      </div>

      {/* Search & Filter Tabs */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            id="search-customer-requests-input"
            type="text"
            placeholder="Search request #REQ-A3245, C5438, customer name, specialist, or service..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                (e.target as HTMLElement).blur();
              }
            }}
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border text-xs font-medium outline-none transition-all ${
              isLight
                ? 'bg-white border-slate-200 text-slate-900 focus:border-slate-400 shadow-xs'
                : 'bg-slate-900/90 border-slate-800 text-white focus:border-slate-700'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              id="filter-pending-requests"
              type="button"
              onClick={() => setActiveFilter('pending')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'pending'
                  ? 'text-white shadow'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: activeFilter === 'pending' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Decision</span>
              {pendingCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black ml-0.5">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="filter-rescheduled"
              type="button"
              onClick={() => setActiveFilter('rescheduled')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'rescheduled'
                  ? 'text-white shadow'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: activeFilter === 'rescheduled' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <CalendarDays className="w-3.5 h-3.5 text-sky-400" />
              <span>Rescheduled{rescheduledCount > 0 ? ` (${rescheduledCount})` : ''}</span>
            </button>

            <button
              id="filter-all-requests"
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'all'
                  ? 'text-white shadow'
                  : isLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              style={{
                backgroundColor: activeFilter === 'all' ? currentThemeConfig.primaryHex : undefined,
              }}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Requests{salonAppointments.length > 0 ? ` (${salonAppointments.length})` : ''}</span>
            </button>
          </div>

          {/* Client Tier Filter (Guest & VIP clients) inside All Requests view */}
          {activeFilter === 'all' && (
            <div
              id="all-requests-client-filter-bar"
              className={`flex items-center gap-1.5 p-1 rounded-xl border text-xs self-start sm:self-auto ${
                isLight
                  ? 'bg-slate-100/90 border-slate-200/90'
                  : 'bg-slate-900/90 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-1 px-2 text-[11px] font-bold text-slate-400 select-none">
                <Filter className="w-3 h-3 text-slate-400" />
                <span>Filter Client:</span>
              </div>

              <button
                id="filter-tier-all"
                type="button"
                onClick={() => setClientTierFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  clientTierFilter === 'all'
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                All{salonAppointments.length > 0 ? ` (${salonAppointments.length})` : ''}
              </button>

              <button
                id="filter-tier-guest"
                type="button"
                onClick={() => setClientTierFilter('guest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  clientTierFilter === 'guest'
                    ? isLight
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                      : 'bg-slate-800 text-white shadow-xs border border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <User className="w-3 h-3 text-slate-400" />
                <span>Guest{guestCount > 0 ? ` (${guestCount})` : ''}</span>
              </button>

              <button
                id="filter-tier-vip"
                type="button"
                onClick={() => setClientTierFilter('vip')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  clientTierFilter === 'vip'
                    ? isLight
                      ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-amber-950/60 text-amber-200 border border-amber-600/40 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Crown className="w-3 h-3 text-amber-500" />
                <span>VIP{vipCount > 0 ? ` (${vipCount})` : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer Requests List */}
      <div className="space-y-3.5">
        {filteredAppointments.length === 0 ? (
          <div
            className={`p-10 text-center rounded-3xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <Users className="w-10 h-10 text-slate-400 mx-auto mb-2 opacity-60" />
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              No Customer Requests Found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no customer bookings in this category right now.
            </p>
            {activeFilter !== 'pending' && (
              <button
                onClick={() => setActiveFilter('pending')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer"
                style={{ backgroundColor: currentThemeConfig.primaryHex }}
              >
                Back to Pending Decisions
              </button>
            )}
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const reqCode = formatRequestCode(apt.id);
            const reqTime = formatCreatedAt(apt.createdAt);
            const bookingDateTimeStr = formatBookingSlotDisplay(apt.date, apt.timeSlot);
            const isVipClient = isCustomerVip(apt.customerId || apt.customerName, salon.id) || apt.isVip;

            return (
              <div
                key={apt.id}
                id={`request-card-${apt.id}`}
                className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-none ${
                  isLight
                    ? 'bg-white border-slate-200/90 hover:border-slate-300'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-750'
                }`}
              >
                {/* 1. Header: #REQ-A3245 / #REQ-C5438, Timestamp, VIP/Guest Badge, High Visibility Status Badge */}
                <div className="flex items-start justify-between gap-2 pb-2.5">
                  <div className="min-w-0">
                    <h2 className={`text-base sm:text-lg font-black tracking-tight leading-tight truncate ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {reqCode}
                    </h2>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                      {reqTime}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {/* VIP / Guest Tier Badge on Header */}
                    {isVipClient ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-500" /> VIP
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        GUEST
                      </span>
                    )}

                    {/* Highly Visible Status Tag */}
                    {apt.status === 'pending' ? (
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wider uppercase flex items-center gap-1 border select-none ${
                        isLight
                          ? 'bg-amber-100/90 text-amber-950 border-amber-300/90 shadow-2xs'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-2xs'
                      }`}>
                        <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                        <span>PENDING REVIEW</span>
                      </span>
                    ) : apt.status === 'confirmed' ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-700 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-500" /> ACCEPTED
                      </span>
                    ) : apt.status === 'rescheduled_by_business' ? (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-500" /> SUGGESTION SENT
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-700">
                        DECLINED
                      </span>
                    )}
                  </div>
                </div>

                {/* 2. Customer & Specialist Profiles with Avatars & "with" connector */}
                <div className="py-1 flex items-center justify-between gap-2 sm:gap-4">
                  {/* Left: Customer Profile with Guest / VIP label */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <img
                      src={
                        apt.customerAvatar ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={apt.customerName}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-black truncate leading-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {apt.customerName}
                      </h3>
                      <p className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${
                        isVipClient 
                          ? 'text-amber-500 font-black' 
                          : isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        {isVipClient ? (
                          <>
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>VIP</span>
                          </>
                        ) : (
                          <span>Guest</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Center "with" label */}
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 px-1 shrink-0 select-none">
                    with
                  </div>

                  {/* Right: Specialist */}
                  <div className="flex items-center justify-end gap-2.5 sm:gap-3 min-w-0 flex-1 text-right">
                    <div className="min-w-0">
                      <h3 className={`text-sm sm:text-base font-black truncate leading-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {apt.staffName}
                      </h3>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        Specialist stylist
                      </p>
                    </div>
                    <img
                      src={
                        apt.staffAvatar ||
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
                      }
                      alt={apt.staffName}
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shrink-0 shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* 3. Details: Service, Date & time, Price */}
                <div className="my-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs sm:text-sm">
                  {/* Service Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Service
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {apt.serviceName}
                      </span>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 select-none">
                        {apt.durationMinutes || 35}m
                      </span>
                    </div>
                  </div>

                  {/* Date & Time Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Date & time
                    </span>
                    <span className={`font-black ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {bookingDateTimeStr}
                    </span>
                  </div>

                  {/* Price Row */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                      Price
                    </span>
                    <span className={`font-black text-sm sm:text-base ${isLight ? 'text-slate-950' : 'text-white'}`}>
                      {formatCurrencyPrice(apt.servicePrice)}
                    </span>
                  </div>

                  {/* Customer Notes if provided */}
                  {apt.notes && (
                    <div className="pt-1 text-xs text-slate-400 dark:text-slate-500 italic flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                      <span>Note from client: "{apt.notes}"</span>
                    </div>
                  )}

                  {/* Suggested time info if in rescheduled status */}
                  {apt.status === 'rescheduled_by_business' && apt.suggestedDate && (
                    <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800 text-xs text-sky-950 dark:text-sky-200 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span>Proposed slot: {formatBookingSlotDisplay(apt.suggestedDate, apt.suggestedTimeSlot || '')}</span>
                      </div>
                      {apt.suggestedNote && (
                        <p className="text-[11px] text-sky-800 dark:text-sky-300 italic pl-5">
                          "{apt.suggestedNote}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Decline reason if in cancelled status */}
                  {apt.status === 'cancelled' && apt.declineReason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <span>Decline Reason: <strong>{apt.declineReason}</strong></span>
                    </div>
                  )}
                </div>

                {/* 4. Action Buttons (Two Rows with Streamlined Height) */}
                <div className="pt-1.5 space-y-2">
                  {/* Row 1: Communication Buttons ("Call", "WhatsApp") */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id={`call-customer-btn-${apt.id}`}
                      onClick={e => handleDirectCall(apt, e)}
                      className={`py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-750 text-slate-100'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Call</span>
                    </button>

                    <button
                      type="button"
                      id={`whatsapp-customer-btn-${apt.id}`}
                      onClick={e => handleWhatsApp(apt, e)}
                      className={`py-2 sm:py-2.5 px-3 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-2xs cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-slate-750 text-slate-100'
                      }`}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  </div>

                  {/* Row 2: Decision Actions ("Accept", "Suggest time", "Decline") */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      id={`accept-request-btn-${apt.id}`}
                      onClick={e => handleAccept(apt, e)}
                      disabled={apt.status === 'confirmed'}
                      className={`py-2 sm:py-2.5 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs cursor-pointer ${
                        apt.status === 'confirmed'
                          ? 'bg-emerald-500 text-white border-emerald-500 cursor-default opacity-90'
                          : isLight
                          ? 'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-slate-900'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-emerald-950/40 hover:border-emerald-600 hover:text-emerald-300 text-white'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 text-slate-900 dark:text-white" />
                      <span>{apt.status === 'confirmed' ? 'Accepted' : 'Accept'}</span>
                    </button>

                    <button
                      type="button"
                      id={`suggest-time-btn-${apt.id}`}
                      onClick={e => handleOpenSuggestModal(apt, e)}
                      className="py-2 sm:py-2.5 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl border border-sky-200/80 dark:border-sky-800/70 bg-[#eef5fa] dark:bg-sky-950/50 hover:bg-[#e4eff6] dark:hover:bg-sky-900/60 text-slate-900 dark:text-white text-xs sm:text-sm font-black flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs cursor-pointer text-center"
                    >
                      <Clock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="leading-tight truncate">Suggest time</span>
                    </button>

                    <button
                      type="button"
                      id={`decline-request-btn-${apt.id}`}
                      onClick={e => handleOpenDeclineModal(apt, e)}
                      disabled={apt.status === 'cancelled'}
                      className={`py-2 sm:py-2.5 px-2 sm:px-2.5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-1 transition-all active:scale-[0.98] shadow-2xs cursor-pointer ${
                        apt.status === 'cancelled'
                          ? 'bg-rose-500 text-white border-rose-500 cursor-default opacity-80'
                          : isLight
                          ? 'bg-white border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-slate-900'
                          : 'bg-slate-800/80 border-slate-700 hover:bg-rose-950/40 hover:border-rose-600 hover:text-rose-300 text-white'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 text-rose-500" />
                      <span>{apt.status === 'cancelled' ? 'Declined' : 'Decline'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. CALL & CONTACT MODAL */}
      {/* ------------------------------------------------------------- */}
      {callModalApt && (
        <div
          id="customer-call-modal-backdrop"
          onClick={() => setCallModalApt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            id="customer-call-modal"
            onClick={e => e.stopPropagation()}
            className={`relative w-full max-w-md rounded-3xl border shadow-2xl p-6 transition-all animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
            }`}
            style={{
              boxShadow: `0 20px 40px -10px ${currentThemeConfig.glowHex}`,
            }}
          >
            <button
              type="button"
              onClick={() => setCallModalApt(null)}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Profile Header */}
            <div className="flex items-center gap-3.5 pr-8">
              <img
                src={callModalApt.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                alt={callModalApt.customerName}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className={`text-base font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {callModalApt.customerName}
                  </h3>
                  {isCustomerVip(callModalApt.customerId || callModalApt.customerName, salon.id) && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-0.5">
                      <Crown className="w-3 h-3" /> VIP
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  Requested {callModalApt.serviceName} with {callModalApt.staffName}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {callModalApt.date} at {callModalApt.timeSlot}
                </p>
              </div>
            </div>

            {/* Phone Number Display Box */}
            <div
              className={`mt-5 p-4 rounded-2xl border flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="p-2.5 rounded-xl text-white shadow-xs shrink-0"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Customer Phone Number
                  </span>
                  <span className={`text-base font-black font-mono truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {callModalApt.customerPhone}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="copy-customer-phone-btn"
                onClick={e => handleCopyPhone(callModalApt.customerPhone, e)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shrink-0 ${
                  copiedPhone
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                }`}
              >
                {copiedPhone ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Direct Call & WhatsApp Actions */}
            <div className="mt-4 space-y-2.5">
              <a
                href={`tel:${callModalApt.customerPhone.replace(/[^0-9+]/g, '')}`}
                className="w-full py-3 px-4 rounded-2xl text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:opacity-95 active:scale-98"
                style={{
                  backgroundColor: currentThemeConfig.primaryHex,
                  boxShadow: `0 6px 18px -2px ${currentThemeConfig.glowHex}`,
                }}
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Call Now ({callModalApt.customerPhone})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleWhatsApp(callModalApt);
                  setCallModalApt(null);
                }}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4" color="#ffffff" />
                <span>Chat via WhatsApp</span>
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-400 mt-4">
              ALGO SALON Customer Direct Connect
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SUGGEST ALTERNATE TIME MODAL */}
      {/* ------------------------------------------------------------- */}
      {suggestModalApt && (
        <div
          id="suggest-time-modal-backdrop"
          onClick={() => setSuggestModalApt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            id="suggest-time-modal"
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-lg max-h-[90vh] rounded-3xl border overflow-y-auto shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121316] border-slate-800 text-white'
            }`}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md bg-inherit">
              <div>
                <span
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  Customer Decision Hub
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  Suggest Alternate Appointment Time
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSuggestModalApt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSuggestTime} className="p-6 space-y-4">
              {/* Customer Request Summary Pill */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <img
                  src={suggestModalApt.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                  alt={suggestModalApt.customerName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold truncate">
                    {suggestModalApt.customerName} • {formatRequestCode(suggestModalApt.id)}
                  </p>
                  <p className="text-slate-400 text-[11px] truncate">
                    Requested: {suggestModalApt.serviceName} on {suggestModalApt.date} @ {suggestModalApt.timeSlot}
                  </p>
                </div>
              </div>

              {/* Propose Alternate Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Proposed Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={suggestDate}
                    onChange={e => setSuggestDate(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-xs font-mono outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Proposed Time Slot *
                  </label>
                  <select
                    value={suggestTimeSlot}
                    onChange={e => setSuggestTimeSlot(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-2xl border text-xs font-mono outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {[
                      '09:00 AM',
                      '10:00 AM',
                      '11:00 AM',
                      '12:00 PM',
                      '01:00 PM',
                      '02:00 PM',
                      '03:00 PM',
                      '03:30 PM',
                      '04:00 PM',
                      '04:30 PM',
                      '05:00 PM',
                      '06:00 PM',
                      '07:00 PM',
                      '08:00 PM',
                    ].map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Note / Message to Customer */}
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Message to Customer
                </label>
                <textarea
                  rows={3}
                  value={suggestNote}
                  onChange={e => setSuggestNote(e.target.value)}
                  placeholder="Explain why this slot is better or any special offer..."
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSuggestModalApt(null)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  <Clock className="w-4 h-4" />
                  <span>Send Proposal to Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. DECLINE BOOKING REQUEST MODAL */}
      {/* ------------------------------------------------------------- */}
      {declineModalApt && (
        <div
          id="decline-booking-modal-backdrop"
          onClick={() => setDeclineModalApt(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div
            id="decline-booking-modal"
            onClick={e => e.stopPropagation()}
            className={`w-full max-w-lg max-h-[90vh] rounded-3xl border overflow-y-auto shadow-2xl ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#121316] border-slate-800 text-white'
            }`}
          >
            <div className="sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between backdrop-blur-md bg-inherit">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
                  Decline Decision
                </span>
                <h3 className="text-lg font-black tracking-tight">
                  Decline Customer Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeclineModalApt(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDecline} className="p-6 space-y-4">
              <div
                className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                  isLight ? 'bg-rose-50/50 border-rose-200' : 'bg-rose-950/20 border-rose-900/60'
                }`}
              >
                <img
                  src={declineModalApt.customerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                  alt={declineModalApt.customerName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold truncate">
                    {declineModalApt.customerName} • {formatRequestCode(declineModalApt.id)}
                  </p>
                  <p className="text-slate-400 text-[11px] truncate">
                    {declineModalApt.serviceName} on {declineModalApt.date} @ {declineModalApt.timeSlot}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Select Decline Reason *
                </label>
                <select
                  value={selectedDeclineReason}
                  onChange={e => setSelectedDeclineReason(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-2xl border text-xs font-semibold outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <option value="Fully Booked at Requested Slot">Fully Booked at Requested Slot</option>
                  <option value="Stylist Unavailable / On Leave">Stylist Unavailable / On Leave</option>
                  <option value="Shop Closed / Emergency Maintenance">Shop Closed / Emergency Maintenance</option>
                  <option value="Outside Operating Hours">Outside Operating Hours</option>
                  <option value="Other Reason (Specify below)">Other Reason (Specify below)</option>
                </select>
              </div>

              {selectedDeclineReason === 'Other Reason (Specify below)' && (
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5">
                    Specify Custom Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={customDeclineReason}
                    onChange={e => setCustomDeclineReason(e.target.value)}
                    placeholder="e.g. Renovation work in progress..."
                    className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">
                  Apology Message Sent to Customer
                </label>
                <textarea
                  rows={3}
                  value={declineApology}
                  onChange={e => setDeclineApology(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeclineModalApt(null)}
                  className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-colors ${
                    isLight
                      ? 'border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-1.5"
                >
                  <X className="w-4 h-4" />
                  <span>Confirm Decline & Notify</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

