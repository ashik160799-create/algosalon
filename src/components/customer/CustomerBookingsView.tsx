import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Appointment, Salon } from '../../types';
import { ReviewModal } from './ReviewModal';
import { CallContactModal } from '../common/CallContactModal';
import { getSalonMapUrl } from '../../utils/salonUtils';
import { getDualBookingTime } from '../../utils/dateTimeUtils';
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
    activeCountry,
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
  const cancelledCount = customerBookings.filter(a => a.status === 'cancelled' || a.status === 'declined_by_business').length;

  const filteredBookings = customerBookings.filter(appt => {
    // Status filter
    if (activeStatusTab === 'upcoming') {
      const isUpcoming =
        appt.status === 'confirmed' ||
        appt.status === 'pending' ||
        appt.status === 'rescheduled_by_business' ||
        appt.status === 'in_progress';
      if (!isUpcoming) return false;
    } else if (activeStatusTab === 'completed') {
      if (appt.status !== 'completed') return false;
    } else if (activeStatusTab === 'cancelled') {
      if (appt.status !== 'cancelled' && appt.status !== 'declined_by_business') return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSalon = appt.salonName?.toLowerCase().includes(q);
      const matchService = appt.serviceName?.toLowerCase().includes(q);
      const matchStaff = appt.staffName?.toLowerCase().includes(q);
      const matchId = appt.id?.toLowerCase().includes(q);
      return matchSalon || matchService || matchStaff || matchId;
    }

    return true;
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRebook = (appt: Appointment) => {
    const parentSalon = salons.find(s => s.id === appt.salonId);
    const matchedService = services.find(s => s.id === appt.serviceId);

    if (parentSalon) {
      setPreselectedSalon(parentSalon);
      setPreselectedService(matchedService || null);
      setBookingModalOpen(true);
    }
  };

  const handleOpenMap = (salonId: string) => {
    const salon = salons.find(s => s.id === salonId);
    if (salon) {
      const mapUrl = getSalonMapUrl(salon);
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div id="customer-bookings-root" className="min-h-screen pb-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">My Bookings</h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Track upcoming visits, reschedule requests, and receipt archives
          </p>
        </div>

        {/* Explore Button */}
        <button
          type="button"
          onClick={() => setActiveCustomerTab('discover')}
          className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95"
          style={{ backgroundColor: currentThemeConfig.primaryHex }}
        >
          <Compass className="w-4 h-4" />
          <span>Book New Service</span>
        </button>
      </div>

      {/* Tabs & Search Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        {/* Status Category Pills */}
        <div
          className={`p-1.5 rounded-2xl border flex items-center gap-1 overflow-x-auto no-scrollbar ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveStatusTab('upcoming')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeStatusTab === 'upcoming'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Upcoming</span>
            {upcomingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-primary text-white">
                {upcomingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeStatusTab === 'completed'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Past & Completed</span>
            {completedCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {completedCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusTab('cancelled')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeStatusTab === 'cancelled'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Cancelled</span>
            {cancelledCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {cancelledCount}
              </span>
            )}
          </button>
        </div>

        {/* Mini Search Input */}
        <div
          className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search booking..."
            className="w-full sm:w-44 bg-transparent text-xs focus:outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Bookings List Cards */}
      <div className="space-y-4">
        {filteredBookings.map(appt => {
          const salon = salons.find(s => s.id === appt.salonId);
          const dualTime = getDualBookingTime(appt.date, appt.time, salon?.timeZone);

          return (
            <div
              key={appt.id}
              id={`booking-card-${appt.id}`}
              className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                isLight
                  ? 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Service Title & Status Pill */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-extrabold truncate">{appt.serviceName}</h3>
                    <span className="text-xs font-bold text-primary">{formatPrice(appt.price)}</span>
                  </div>
                  <p
                    onClick={() => {
                      if (salon) setSelectedSalon(salon);
                    }}
                    className={`text-xs font-semibold cursor-pointer hover:underline mt-0.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  >
                    {appt.salonName}
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  {appt.status === 'confirmed' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed</span>
                    </span>
                  )}

                  {appt.status === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      <span>Pending Confirmation</span>
                    </span>
                  )}

                  {appt.status === 'rescheduled_by_business' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5 animate-bounce">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Reschedule Offered</span>
                    </span>
                  )}

                  {appt.status === 'completed' && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Completed</span>
                    </span>
                  )}

                  {(appt.status === 'cancelled' || appt.status === 'declined_by_business') && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{appt.status === 'declined_by_business' ? 'Declined' : 'Cancelled'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Middle Row: Schedule Info, Stylist, Dual-Time Alert */}
              <div className="py-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Date & Time with Dual Zone Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span>{appt.date}</span>
                    <span>•</span>
                    <Clock className="w-4 h-4 text-primary shrink-0 ml-1" />
                    <span>{appt.time}</span>
                  </div>

                  {dualTime.isDifferentTimeZone && (
                    <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-medium flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Salon Local Time: <strong>{dualTime.salonFormattedTime}</strong> ({dualTime.salonTimeZoneAbbr})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-500 pt-0.5">
                    <span>Stylist: <strong>{appt.staffName || 'Any Available Stylist'}</strong></span>
                  </div>
                </div>

                {/* Address & Booking Reference */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{appt.salonAddress || 'Dubai, UAE'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-0.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Ref: {appt.id}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyId(appt.id)}
                      className="text-primary hover:underline font-semibold"
                    >
                      {copiedId === appt.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Reschedule Suggestion Action Banner */}
              {appt.status === 'rescheduled_by_business' && appt.suggestedDate && (
                <div className="mb-3.5 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    <AlertCircle className="w-4 h-4 text-indigo-600" />
                    <span>The salon proposed a new time for your appointment:</span>
                  </div>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold pl-6">
                    Proposed Date: {appt.suggestedDate} at {appt.suggestedTime}
                  </p>
                  {appt.rescheduleReason && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 pl-6 italic">
                      "{appt.rescheduleReason}"
                    </p>
                  )}
                  <div className="flex items-center gap-2 pl-6 pt-1">
                    <button
                      type="button"
                      onClick={() => customerAcceptSuggestedTime(appt.id)}
                      className="px-4 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all active:scale-95"
                    >
                      Accept New Time
                    </button>
                    <button
                      type="button"
                      onClick={() => customerDeclineSuggestedTime(appt.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Decline & Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Decline Reason Note if Declined */}
              {appt.status === 'declined_by_business' && appt.declineReason && (
                <div className="mb-3.5 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300">
                  <span className="font-bold">Decline Reason: </span>
                  <span>{appt.declineReason}</span>
                </div>
              )}

              {/* Bottom Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                {/* Left Actions: Map & Call */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenMap(appt.salonId)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                      isLight
                        ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                        : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-500" />
                    <span>Directions</span>
                  </button>

                  {salon && (
                    <button
                      type="button"
                      onClick={() => setContactSalon(salon)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                        isLight
                          ? 'border-slate-200 hover:bg-slate-100 text-slate-700'
                          : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Contact Salon</span>
                    </button>
                  )}
                </div>

                {/* Right Actions: Cancel / Rebook / Review */}
                <div className="flex items-center gap-2">
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <>
                      {cancelConfirmId === appt.id ? (
                        <div className="flex items-center gap-1.5 animate-fadeIn">
                          <span className="text-[11px] text-rose-500 font-semibold">Cancel booking?</span>
                          <button
                            type="button"
                            onClick={() => {
                              cancelAppointment(appt.id);
                              setCancelConfirmId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500 text-white active:scale-95"
                          >
                            Yes, Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancelConfirmId(null)}
                            className="px-2 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCancelConfirmId(appt.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}

                  {appt.status === 'completed' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setReviewingAppointment(appt)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 flex items-center gap-1.5 transition-colors"
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>Leave Review</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRebook(appt)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                        style={{ backgroundColor: currentThemeConfig.primaryHex }}
                      >
                        <Repeat className="w-3.5 h-3.5" />
                        <span>Book Again</span>
                      </button>
                    </>
                  )}

                  {(appt.status === 'cancelled' || appt.status === 'declined_by_business') && (
                    <button
                      type="button"
                      onClick={() => handleRebook(appt)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-white shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                      style={{ backgroundColor: currentThemeConfig.primaryHex }}
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span>Rebook</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredBookings.length === 0 && (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <CalendarX className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold">No {activeStatusTab} bookings found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                {activeStatusTab === 'upcoming'
                  ? "You don't have any upcoming salon appointments. Explore verified studios to book your next session."
                  : `No ${activeStatusTab} bookings in your account history.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveCustomerTab('discover')}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white shadow-md active:scale-95"
              style={{ backgroundColor: currentThemeConfig.primaryHex }}
            >
              Explore Top Salons
            </button>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {reviewingAppointment && (
        <ReviewModal
          appointment={reviewingAppointment}
          onClose={() => setReviewingAppointment(null)}
        />
      )}

      {/* Contact Salon Modal */}
      {contactSalon && (
        <CallContactModal
          isOpen={Boolean(contactSalon)}
          onClose={() => setContactSalon(null)}
          phoneNumber={contactSalon.phone}
          salonName={contactSalon.name}
        />
      )}
    </div>
  );
};
