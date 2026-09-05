import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Salon } from '../../types';
import { ReviewModal } from './ReviewModal';
import { CallContactModal } from '../common/CallContactModal';
import { getSalonMapUrl } from '../../utils/salonUtils';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Repeat,
  Sparkles,
  Search,
  Check,
  CalendarX,
  Compass,
  Receipt,
  Navigation,
  ExternalLink,
} from 'lucide-react';

export const CustomerBookingsView: React.FC = () => {
  const {
    appointments,
    customerUser,
    cancelAppointment,
    customerAcceptSuggestedTime,
    customerDeclineSuggestedTime,
    setPreselectedSalon,
    setPreselectedService,
    setSelectedSalon,
    setBookingModalOpen,
    setActiveCustomerTab,
    salons,
    services,
    currentThemeConfig,
    colorThemeMode,
    formatPrice,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const [activeStatusTab, setActiveStatusTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [reviewingAppointment, setReviewingAppointment] = useState<Appointment | null>(null);
  const [contactSalon, setContactSalon] = useState<Salon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const customerBookings = appointments.filter(a => a.customerId === customerUser.id);

  const upcomingCount = customerBookings.filter(
    a => a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled_by_business' || a.status === 'in_progress'
  ).length;
  const completedCount = customerBookings.filter(a => a.status === 'completed').length;
  const cancelledCount = customerBookings.filter(a => a.status === 'cancelled').length;

  const filteredBookings = customerBookings.filter(apt => {
    let matchesTab = false;
    if (activeStatusTab === 'upcoming') {
      matchesTab =
        apt.status === 'confirmed' ||
        apt.status === 'pending' ||
        apt.status === 'rescheduled_by_business' ||
        apt.status === 'in_progress';
    } else if (activeStatusTab === 'completed') {
      matchesTab = apt.status === 'completed';
    } else {
      matchesTab = apt.status === 'cancelled';
    }

    if (!matchesTab) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      apt.salonName.toLowerCase().includes(q) ||
      apt.serviceName.toLowerCase().includes(q) ||
      apt.staffName.toLowerCase().includes(q) ||
      apt.id.toLowerCase().includes(q)
    );
  });

  const handleRebook = (apt: Appointment) => {
    const salon = salons.find(s => s.id === apt.salonId) || salons[0];
    const service = services.find(s => s.id === apt.serviceId) || services[0];
    setPreselectedSalon(salon);
    setPreselectedService(service);
    setBookingModalOpen(true);
  };

  const handleViewSalon = (salonId: string) => {
    const salon = salons.find(s => s.id === salonId);
    if (salon) {
      setSelectedSalon(salon);
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard?.writeText?.(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmCancel = (id: string) => {
    cancelAppointment(id);
    setCancelConfirmId(null);
  };

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span
            className="text-xs font-extrabold uppercase tracking-widest block mb-1"
            style={{ color: currentThemeConfig.primaryHex }}
          >
            Booking Management
          </span>
          <h1
            className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit',sans-serif] ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            My Salon Appointments
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            Manage your scheduled sessions, pass tickets, and share stylist reviews.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 shadow-sm'
                : 'bg-slate-900 border-slate-800 text-slate-300'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" style={{ color: currentThemeConfig.primaryHex }} />
            <span>Total: {customerBookings.length} Bookings</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          id="booking-status-tab-bar"
          role="tablist"
          aria-label="Filter bookings by status"
          className={`p-1.5 rounded-2xl border transition-colors flex items-center gap-1.5 w-full sm:max-w-md ${
            isLight
              ? 'bg-white border-slate-200 shadow-sm'
              : 'bg-slate-900/90 border-slate-800 shadow-md'
          }`}
        >
          <button
            id="tab-upcoming-bookings"
            role="tab"
            aria-selected={activeStatusTab === 'upcoming'}
            onClick={() => setActiveStatusTab('upcoming')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-xs font-bold ${
              activeStatusTab === 'upcoming'
                ? 'text-white shadow-md'
                : isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            style={{
              backgroundColor: activeStatusTab === 'upcoming' ? currentThemeConfig.primaryHex : 'transparent',
              boxShadow: activeStatusTab === 'upcoming' ? `0 4px 14px ${currentThemeConfig.glowHex}` : undefined,
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Upcoming</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeStatusTab === 'upcoming'
                  ? 'bg-white/20 text-white border border-white/30'
                  : isLight
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              {upcomingCount}
            </span>
          </button>

          <button
            id="tab-completed-bookings"
            role="tab"
            aria-selected={activeStatusTab === 'completed'}
            onClick={() => setActiveStatusTab('completed')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-xs font-bold ${
              activeStatusTab === 'completed'
                ? 'text-white shadow-md'
                : isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            style={{
              backgroundColor: activeStatusTab === 'completed' ? currentThemeConfig.primaryHex : 'transparent',
              boxShadow: activeStatusTab === 'completed' ? `0 4px 14px ${currentThemeConfig.glowHex}` : undefined,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeStatusTab === 'completed'
                  ? 'bg-white/20 text-white border border-white/30'
                  : isLight
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
              }`}
            >
              {completedCount}
            </span>
          </button>

          <button
            id="tab-cancelled-bookings"
            role="tab"
            aria-selected={activeStatusTab === 'cancelled'}
            onClick={() => setActiveStatusTab('cancelled')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 text-xs font-bold ${
              activeStatusTab === 'cancelled'
                ? 'text-white shadow-md'
                : isLight
                ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
            style={{
              backgroundColor: activeStatusTab === 'cancelled' ? currentThemeConfig.primaryHex : 'transparent',
              boxShadow: activeStatusTab === 'cancelled' ? `0 4px 14px ${currentThemeConfig.glowHex}` : undefined,
            }}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                activeStatusTab === 'cancelled'
                  ? 'bg-white/20 text-white border border-white/30'
                  : isLight
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
              }`}
            >
              {cancelledCount}
            </span>
          </button>
        </div>

        {customerBookings.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`} />
            <input
              type="text"
              placeholder="Search salon or service..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full text-xs rounded-xl pl-9 pr-3 py-2.5 border transition-all focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-slate-700'
              }`}
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredBookings.map(apt => {
          return (
            <div
              key={apt.id}
              className={`p-5 sm:p-6 rounded-3xl border transition-all duration-200 space-y-4 ${
                isLight
                  ? 'bg-white border-slate-200/90 shadow-sm hover:shadow-md'
                  : 'bg-slate-900/90 border-slate-800 shadow-lg hover:border-slate-700'
              }`}
            >
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <div className="flex items-center gap-3.5">
                  <img
                    src={apt.salonImage}
                    alt={apt.salonName}
                    onClick={() => handleViewSalon(apt.salonId)}
                    className="w-13 h-13 rounded-2xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 cursor-pointer transition-transform hover:scale-105"
                  />
                  <div>
                    <h3
                      onClick={() => handleViewSalon(apt.salonId)}
                      className={`text-base sm:text-lg font-bold cursor-pointer transition-colors ${
                        isLight ? 'text-slate-900 hover:text-slate-700' : 'text-white hover:text-slate-200'
                      }`}
                    >
                      {apt.salonName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const s = salons.find(item => item.id === apt.salonId);
                          const mapUrl = s ? getSalonMapUrl(s) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(apt.salonName + ' ' + apt.salonAddress)}`;
                          window.open(mapUrl, '_blank', 'noopener,noreferrer');
                        }}
                        className={`text-xs flex items-center gap-1 font-medium hover:underline cursor-pointer group/map ${
                          isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Get directions in Google Maps"
                      >
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0 group-hover/map:scale-110 transition-transform" />
                        <span className="truncate">{apt.salonAddress}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover/map:opacity-100 transition-opacity text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize flex items-center gap-1.5 ${
                      apt.status === 'in_progress'
                        ? isLight
                          ? 'bg-amber-50 border border-amber-300 text-amber-900'
                          : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                        : apt.status === 'confirmed'
                        ? isLight
                          ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                          : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                        : apt.status === 'pending'
                        ? isLight
                          ? 'bg-amber-50 border border-amber-300 text-amber-800'
                          : 'bg-amber-950/80 border border-amber-500/50 text-amber-300'
                        : apt.status === 'rescheduled_by_business'
                        ? isLight
                          ? 'bg-purple-50 border border-purple-300 text-purple-800'
                          : 'bg-purple-950/80 border border-purple-500/50 text-purple-300'
                        : apt.status === 'completed'
                        ? isLight
                          ? 'bg-blue-50 border border-blue-300 text-blue-800'
                          : 'bg-blue-950/80 border border-blue-500/50 text-blue-300'
                        : isLight
                        ? 'bg-rose-50 border border-rose-300 text-rose-800'
                        : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
                    }`}
                  >
                    {apt.status === 'in_progress' && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    )}
                    {apt.status === 'confirmed' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {apt.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />}
                    {apt.status === 'rescheduled_by_business' && <Repeat className="w-3.5 h-3.5 text-purple-500" />}
                    {apt.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
                    {apt.status === 'cancelled' && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                    <span>
                      {apt.status === 'in_progress'
                        ? 'In Progress ✂️'
                        : apt.status === 'confirmed'
                        ? 'Confirmed'
                        : apt.status === 'pending'
                        ? 'Awaiting Salon'
                        : apt.status === 'rescheduled_by_business'
                        ? 'New Time Proposed'
                        : apt.status === 'completed'
                        ? 'Completed'
                        : 'Cancelled'}
                    </span>
                  </span>
                </div>
              </div>

              {apt.status === 'rescheduled_by_business' && (
                <div className={`p-4 rounded-2xl border space-y-3 ${
                  isLight
                    ? 'bg-purple-50/80 border-purple-200 text-purple-950'
                    : 'bg-purple-950/40 border-purple-800/80 text-purple-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <h4 className="text-xs font-black uppercase tracking-wide">
                      Salon Suggested a New Time for this Booking
                    </h4>
                  </div>
                  <div className="text-xs space-y-1">
                    <p className="font-semibold">
                      Proposed Slot: <span className="font-extrabold text-purple-700 dark:text-purple-300">{apt.suggestedDate || apt.date} at {apt.suggestedTimeSlot || 'Alternative Time'}</span>
                    </p>
                    {apt.suggestedNote && (
                      <p className="text-[11px] italic opacity-90">
                        Salon Note: "{apt.suggestedNote}"
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => customerAcceptSuggestedTime(apt.id)}
                      className="px-4 py-2 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept Proposed Time (Confirm)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => customerDeclineSuggestedTime(apt.id)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-all"
                    >
                      <span>Decline Time</span>
                    </button>
                  </div>
                </div>
              )}

              {apt.status === 'cancelled' && (apt.declineReason || apt.declineApology) && (
                <div className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                  isLight
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Cancellation Details from Salon:</span>
                  </div>
                  {apt.declineReason && (
                    <p className="font-medium">
                      Reason: <strong className="font-bold">{apt.declineReason}</strong>
                    </p>
                  )}
                  {apt.declineApology && (
                    <p className="text-[11px] italic opacity-85">
                      "{apt.declineApology}"
                    </p>
                  )}
                </div>
              )}

              <div
                className={`grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs p-4 rounded-2xl border transition-colors ${
                  isLight
                    ? 'bg-slate-50/80 border-slate-200/80'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div className="space-y-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Service Booked
                  </span>
                  <span className={`font-bold text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {apt.serviceName}
                  </span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className="font-extrabold text-sm"
                      style={{ color: currentThemeConfig.primaryHex }}
                    >
                      {formatPrice(apt.servicePrice)}
                    </span>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                      isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-300'
                    }`}>
                      ⏱ {apt.durationMinutes} mins
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Stylist / Specialist
                  </span>
                  <div className="flex items-center gap-2 pt-0.5">
                    <img
                      src={apt.staffAvatar}
                      alt={apt.staffName}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300 dark:ring-slate-700"
                    />
                    <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {apt.staffName}
                    </span>
                  </div>
                  <span className={`text-[11px] block font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Payment: <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>{apt.paymentMethod === 'pay_at_salon' ? 'Pay at Salon' : 'Card'}</strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className={`text-[10px] uppercase font-bold tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Scheduled Time
                  </span>
                  <div className={`flex items-center gap-1.5 font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <Calendar className="w-4 h-4" style={{ color: currentThemeConfig.primaryHex }} />
                    <span>{apt.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${currentThemeConfig.primaryHex}15`,
                        color: currentThemeConfig.primaryHex,
                      }}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>{apt.timeSlot}</span>
                    </span>
                  </div>
                </div>
              </div>

              {apt.notes && (
                <div className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-start gap-2 ${
                  isLight
                    ? 'bg-amber-50/70 border-amber-200/80 text-amber-900'
                    : 'bg-amber-950/25 border-amber-800/40 text-amber-200'
                }`}>
                  <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">Your Note:</span>
                  <span className="leading-relaxed">{apt.notes}</span>
                </div>
              )}

              {cancelConfirmId === apt.id && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150 ${
                  isLight ? 'bg-rose-50 border-rose-200 text-rose-950' : 'bg-rose-950/50 border-rose-800 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold">Are you sure you want to cancel this booking?</span>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCancelConfirmId(null)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        isLight ? 'bg-white border border-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Keep Booking
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmCancel(apt.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                    >
                      Yes, Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex flex-wrap items-center justify-between gap-3 pt-3 border-t ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const s = salons.find(item => item.id === apt.salonId);
                      const mapUrl = s ? getSalonMapUrl(s) : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(apt.salonName + ' ' + apt.salonAddress)}`;
                      window.open(mapUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600'
                        : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-900/50 text-rose-400'
                    }`}
                    title="Get directions to salon"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const s = salons.find(item => item.id === apt.salonId) || {
                        id: apt.salonId,
                        name: apt.salonName,
                        tagline: 'Partner Salon',
                        description: '',
                        logo: apt.salonImage,
                        image: apt.salonImage,
                        rating: 4.9,
                        reviewCount: 120,
                        address: apt.salonAddress,
                        city: 'Dubai',
                        phone: apt.salonPhone,
                        email: 'contact@algosalon.com',
                        genderTarget: 'Unisex',
                        categories: [apt.serviceCategory || 'Styling'],
                        workingHours: [],
                        priceRange: '$$',
                        isVerified: true,
                        isFeatured: false,
                        isOpenNow: true,
                        distanceKm: 2.1,
                        staffIds: [apt.staffId],
                        serviceIds: [apt.serviceId],
                        amenities: ['Wi-Fi', 'Coffee'],
                      };
                      setContactSalon(s as Salon);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isLight
                        ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600'
                        : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-900/50 text-emerald-400'
                    }`}
                    title="Call or message salon"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call ({apt.salonPhone})</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {apt.status === 'confirmed' && cancelConfirmId !== apt.id && (
                    <button
                      type="button"
                      onClick={() => setCancelConfirmId(apt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        isLight
                          ? 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600'
                          : 'bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300'
                      }`}
                    >
                      Cancel Booking
                    </button>
                  )}

                  {apt.status === 'completed' && (
                    <button
                      type="button"
                      onClick={() => setReviewingAppointment(apt)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        apt.reviewed
                          ? isLight
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-slate-800 text-amber-300 border border-amber-500/20'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{apt.reviewed ? 'Review Submitted' : 'Rate & Review'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRebook(apt)}
                    className="px-4 py-1.5 rounded-xl text-white text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 active:scale-95"
                    style={{
                      backgroundColor: currentThemeConfig.primaryHex,
                      boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
                    }}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>{apt.status === 'completed' ? 'Book Again' : apt.status === 'cancelled' ? 'Re-Book' : 'Book Another'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBookings.length === 0 && (
          <div
            className={`p-10 sm:p-12 rounded-3xl border text-center space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border shadow-sm"
              style={{
                backgroundColor: `${currentThemeConfig.primaryHex}15`,
                borderColor: `${currentThemeConfig.primaryHex}35`,
                color: currentThemeConfig.primaryHex,
              }}
            >
              {activeStatusTab === 'upcoming' && <Sparkles className="w-7 h-7" />}
              {activeStatusTab === 'completed' && <CheckCircle2 className="w-7 h-7" />}
              {activeStatusTab === 'cancelled' && <CalendarX className="w-7 h-7" />}
            </div>

            <div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                No {activeStatusTab.charAt(0).toUpperCase() + activeStatusTab.slice(1)} Appointments
              </h3>
              <p className={`text-xs sm:text-sm max-w-sm mx-auto mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {activeStatusTab === 'upcoming' &&
                  'You currently have no scheduled appointments. Discover top-rated salons nearby and book in seconds.'}
                {activeStatusTab === 'completed' &&
                  'Your past salon visits will appear here with instant review options and 1-tap rebooking.'}
                {activeStatusTab === 'cancelled' &&
                  'You have no cancelled appointments. Everything is on schedule!'}
              </p>
            </div>

            <button
              type="button"
              id="empty-booking-explore-btn"
              onClick={() => setActiveCustomerTab('discover')}
              className="px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 mx-auto transition-transform active:scale-95"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 14px -2px ${currentThemeConfig.glowHex}`,
              }}
            >
              <Compass className="w-4 h-4" />
              <span>Explore Salons & Services</span>
            </button>
          </div>
        )}
      </div>

      {reviewingAppointment && (
        <ReviewModal
          appointment={reviewingAppointment}
          onClose={() => setReviewingAppointment(null)}
        />
      )}

      <CallContactModal
        salon={contactSalon}
        isOpen={!!contactSalon}
        onClose={() => setContactSalon(null)}
      />
    </div>
  );
};
