import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AppointmentStatus, Appointment } from '../../types';
import { isSlotWithinNextHours } from '../../utils/dateTimeUtils';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Check,
  AlertCircle,
  Play,
  Zap,
  CalendarRange,
  ArrowUpDown,
  Phone,
  PhoneForwarded,
  MessageSquare,
  Copy,
  Sparkles,
  CheckCircle,
  SlidersHorizontal,
  RotateCcw,
  Crown,
  User,
  Users,
  CalendarDays,
  Filter,
  X,
  MessageCircle,
} from 'lucide-react';

// Clean WhatsApp Icon SVG Component
const WhatsAppIcon: React.FC<{ className?: string; color?: string }> = ({
  className = 'w-3.5 h-3.5',
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

// Consistent Alphanumeric Serial Number Formatter for Bookings - Formats serial number as #BKG-[Capital Letter][4 Digits] e.g. #BKG-A3245, #BKG-C5438
const formatBookingId = (aptId: string) => {
  if (!aptId) return '#BKG-A1001';
  // If it already matches BKG-[A-Z][0-9]{4}, preserve it
  const match = aptId.match(/(?:BKG|REQ)-([A-Z][0-9]{4})/i);
  if (match) {
    return `#BKG-${match[1].toUpperCase()}`;
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
  return `#BKG-${letter}${digits}`;
};

// Helper to format booking date & time slot cleanly e.g. "Today • 04:30 PM", "Wed, 2 Sep • 05:30 PM"
const formatBookingSlotDisplay = (dateStr: string, timeSlot: string) => {
  if (!dateStr) return timeSlot || '';
  try {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    let dayPrefix = '';
    if (dateStr === today) {
      dayPrefix = 'Today';
    } else if (dateStr === tomorrow) {
      dayPrefix = 'Tomorrow';
    } else {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dayPrefix = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      } else {
        dayPrefix = dateStr;
      }
    }
    return `${dayPrefix} • ${timeSlot}`;
  } catch {
    return `${dateStr} • ${timeSlot}`;
  }
};

export const BusinessAppointments: React.FC = () => {
  const {
    businessUser,
    salons,
    services,
    staffMembers,
    appointments,
    createAppointment,
    updateAppointmentStatus,
    acceptAppointment,
    isCustomerVip,
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

  // Main navigation tab - default to UPCOMING QUEUE
  const [filterStatus, setFilterStatus] = useState<
    'upcoming' | 'in_progress' | 'completed' | 'cancelled' | 'all'
  >('upcoming');

  // Sub-Status Filter for "ALL BOOKINGS" tab
  const [subStatusFilter, setSubStatusFilter] = useState<string>('all');

  // Client Tier Filter (Inside ALL BOOKINGS): All, VIP, or Guest / Regular
  const [filterClientTier, setFilterClientTier] = useState<'all' | 'vip' | 'guest'>('all');

  // Date Filter (Inside ALL BOOKINGS): all, today, tomorrow, this_week, past, future, custom
  const [filterDate, setFilterDate] = useState<
    'all' | 'today' | 'tomorrow' | 'this_week' | 'past' | 'future' | 'custom'
  >('all');
  const [customSelectedDate, setCustomSelectedDate] = useState<string>('');

  // Staff & Search
  const [filterStaff, setFilterStaff] = useState<string>('all');
  const [searchClient, setSearchClient] = useState('');
  const [sortBy, setSortBy] = useState<'chronological' | 'newest'>('chronological');
  // Smart filter when Date Queue is chosen: 'all' | 'next_4h' | 'today' | 'tomorrow' | 'this_week' | 'vip_first'
  const [dateQueueSmartFilter, setDateQueueSmartFilter] = useState<
    'all' | 'next_4h' | 'today' | 'tomorrow' | 'this_week' | 'vip_first'
  >('all');

  // Active Contact Popover Menu state
  const [activeContactMenuId, setActiveContactMenuId] = useState<string | null>(null);

  // Walk-in modal state
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('+971544298306');
  const [walkinServiceId, setWalkinServiceId] = useState(salonServices[0]?.id || '');
  const [walkinStaffId, setWalkinStaffId] = useState(salonStaff[0]?.id || '');
  const [walkinTimeSlot, setWalkinTimeSlot] = useState('03:00 PM');
  const [walkinDate, setWalkinDate] = useState(new Date().toISOString().split('T')[0]);
  const [walkinNotes, setWalkinNotes] = useState('');

  // Status Change Confirmation / Cancel Modal state
  const [cancelModalApt, setCancelModalApt] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('Client requested cancellation');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [statusSuccessToast, setStatusSuccessToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Helper to parse time slot to minutes for chronological queue sorting
  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const clean = timeStr.trim().toUpperCase();
    const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper to get normalized date timestamp for sorting
  const getAppointmentTimestamp = (apt: Appointment): number => {
    try {
      const datePart = apt.date || '2026-01-01';
      const timeMinutes = parseTimeToMinutes(apt.timeSlot);
      const dateObj = new Date(datePart);
      return dateObj.getTime() + timeMinutes * 60 * 1000;
    } catch {
      return 0;
    }
  };

  // Today, tomorrow, this week strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const weekEndStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, []);

  // Filter and automatically sort appointments into a logical queue
  const filteredAppointments = useMemo(() => {
    return salonAppointments
      .filter(apt => {
        const isVip = isCustomerVip(apt.customerId || apt.customerName, salon.id);

        // 1. Client Tier Filter (Only applies or active in ALL BOOKINGS view or if chosen)
        if (filterStatus === 'all') {
          if (filterClientTier === 'vip' && !isVip) return false;
          if (filterClientTier === 'guest' && isVip) return false;
        }

        // 2. Main Status Tab Filter
        let matchStatus = true;
        if (filterStatus === 'upcoming') {
          matchStatus = apt.status === 'confirmed';
        } else if (filterStatus === 'in_progress') {
          matchStatus = apt.status === 'in_progress';
        } else if (filterStatus === 'completed') {
          matchStatus = apt.status === 'completed';
        } else if (filterStatus === 'cancelled') {
          matchStatus = apt.status === 'cancelled';
        } else if (filterStatus === 'all') {
          // If in "All Bookings" view, check sub-status filter if user selected one
          if (subStatusFilter === 'completed') {
            matchStatus = apt.status === 'completed';
          } else if (subStatusFilter === 'cancelled') {
            matchStatus = apt.status === 'cancelled';
          } else if (subStatusFilter === 'in_progress') {
            matchStatus = apt.status === 'in_progress';
          } else if (subStatusFilter === 'confirmed' || subStatusFilter === 'upcoming') {
            matchStatus = apt.status === 'confirmed';
          } else if (subStatusFilter === 'pending') {
            matchStatus = apt.status === 'pending' || apt.status === 'rescheduled_by_business';
          }
        }

        if (!matchStatus) return false;

        // 3. Staff Filter
        const matchStaff = filterStaff === 'all' || apt.staffId === filterStaff;
        if (!matchStaff) return false;

        // 4. Date Filter (Applied when in "ALL BOOKINGS" view or when Date Queue Smart Filter is active)
        if (filterStatus === 'all') {
          let matchDate = true;
          if (filterDate === 'today') {
            matchDate = apt.date === todayStr;
          } else if (filterDate === 'tomorrow') {
            matchDate = apt.date === tomorrowStr;
          } else if (filterDate === 'this_week') {
            matchDate = apt.date >= todayStr && apt.date <= weekEndStr;
          } else if (filterDate === 'past') {
            matchDate = apt.date < todayStr;
          } else if (filterDate === 'future') {
            matchDate = apt.date >= todayStr;
          } else if (filterDate === 'custom') {
            matchDate = !customSelectedDate || apt.date === customSelectedDate;
          }
          if (!matchDate) return false;
        }

        // Smart Filter for Date Queue mode (if active across queues)
        if (sortBy === 'chronological' && dateQueueSmartFilter !== 'all') {
          if (dateQueueSmartFilter === 'next_4h') {
            if (apt.date !== todayStr || !isSlotWithinNextHours(apt.date, apt.timeSlot, 4)) {
              return false;
            }
          }
          if (dateQueueSmartFilter === 'today' && apt.date !== todayStr) {
            return false;
          }
          if (dateQueueSmartFilter === 'tomorrow' && apt.date !== tomorrowStr) {
            return false;
          }
          if (dateQueueSmartFilter === 'this_week' && !(apt.date >= todayStr && apt.date <= weekEndStr)) {
            return false;
          }
        }

        // 5. Search Query
        const q = searchClient.trim().toLowerCase();
        if (q) {
          const bookingCode = formatBookingId(apt.id).toLowerCase();
          const cleanBookingCode = bookingCode.replace('#', '');
          const serialOnly = cleanBookingCode.replace('bkg-', '');
          const matchSearch =
            apt.customerName.toLowerCase().includes(q) ||
            apt.customerPhone.includes(q) ||
            apt.serviceName.toLowerCase().includes(q) ||
            apt.id.toLowerCase().includes(q) ||
            bookingCode.includes(q) ||
            cleanBookingCode.includes(q) ||
            serialOnly.includes(q) ||
            apt.staffName.toLowerCase().includes(q) ||
            apt.date.includes(q);
          if (!matchSearch) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'chronological') {
          // Active In-Progress appointments take priority in chronological view
          if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
          if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;

          // If VIP Priority is active under Smart Queue
          if (dateQueueSmartFilter === 'vip_first') {
            const isVipA = isCustomerVip(a.customerId || a.customerName, salon.id);
            const isVipB = isCustomerVip(b.customerId || b.customerName, salon.id);
            if (isVipA && !isVipB) return -1;
            if (isVipB && !isVipA) return 1;
          }

          const timeA = getAppointmentTimestamp(a);
          const timeB = getAppointmentTimestamp(b);
          return timeA - timeB; // Earliest scheduled date/time first
        } else {
          // Newest created first
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      });
  }, [
    salonAppointments,
    filterStatus,
    filterClientTier,
    subStatusFilter,
    filterStaff,
    filterDate,
    customSelectedDate,
    searchClient,
    sortBy,
    dateQueueSmartFilter,
    todayStr,
    tomorrowStr,
    weekEndStr,
    isCustomerVip,
    salon.id,
  ]);

  const pendingRequestsCount = useMemo(() => {
    return salonAppointments.filter(a => a.status === 'pending').length;
  }, [salonAppointments]);

  // Dynamic status and tier counts
  const counts = useMemo(() => {
    return {
      upcoming: salonAppointments.filter(a => a.status === 'confirmed').length,
      in_progress: salonAppointments.filter(a => a.status === 'in_progress').length,
      completed: salonAppointments.filter(a => a.status === 'completed').length,
      cancelled: salonAppointments.filter(a => a.status === 'cancelled').length,
      all: salonAppointments.length,
      vip: salonAppointments.filter(a => isCustomerVip(a.customerId || a.customerName, salon.id)).length,
      guest: salonAppointments.filter(a => !isCustomerVip(a.customerId || a.customerName, salon.id)).length,
      confirmed: salonAppointments.filter(a => a.status === 'confirmed').length,
      next_4h: salonAppointments.filter(a => a.date === todayStr && isSlotWithinNextHours(a.date, a.timeSlot, 4)).length,
      today: salonAppointments.filter(a => a.date === todayStr).length,
      tomorrow: salonAppointments.filter(a => a.date === tomorrowStr).length,
      this_week: salonAppointments.filter(a => a.date >= todayStr && a.date <= weekEndStr).length,
    };
  }, [salonAppointments, isCustomerVip, salon.id, todayStr, tomorrowStr, weekEndStr]);

  const hasActiveAllBookingsFilters =
    filterStatus === 'all' &&
    (filterClientTier !== 'all' ||
      filterDate !== 'all' ||
      customSelectedDate !== '' ||
      subStatusFilter !== 'all' ||
      filterStaff !== 'all' ||
      searchClient.trim() !== '');

  const handleResetAllBookingsFilters = () => {
    setSubStatusFilter('all');
    setFilterClientTier('all');
    setFilterDate('all');
    setCustomSelectedDate('');
    setFilterStaff('all');
    setSearchClient('');
  };

  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus, customMsg?: string) => {
    updateAppointmentStatus(appointmentId, newStatus, customMsg);

    const target = appointments.find(a => a.id === appointmentId);
    const clientName = target ? target.customerName : 'Client';

    let label = 'Appointment updated';
    let actionLabel: string | undefined = undefined;
    let onAction: (() => void) | undefined = undefined;

    if (newStatus === 'in_progress') {
      label = `${clientName} moved to In-Progress ✂️`;
      actionLabel = 'View In-Progress';
      onAction = () => setFilterStatus('in_progress');
    } else if (newStatus === 'completed') {
      label = `Service completed for ${clientName} ✨`;
      actionLabel = 'View Completed';
      onAction = () => setFilterStatus('completed');
    } else if (newStatus === 'confirmed') {
      label = `Appointment confirmed for ${clientName} 👍`;
      actionLabel = 'View Upcoming';
      onAction = () => setFilterStatus('upcoming');
    } else if (newStatus === 'cancelled') {
      label = `Appointment cancelled for ${clientName}`;
      actionLabel = 'View Cancelled';
      onAction = () => setFilterStatus('cancelled');
    }

    setStatusSuccessToast({ message: label, actionLabel, onAction });
    setTimeout(() => setStatusSuccessToast(null), 4000);
  };

  const handleConfirmCancel = () => {
    if (!cancelModalApt) return;
    const finalReason = cancelReason === 'Other' ? customCancelReason.trim() || 'Cancelled by salon' : cancelReason;
    handleStatusChange(cancelModalApt.id, 'cancelled', finalReason);
    setCancelModalApt(null);
    setCancelReason('Client requested cancellation');
    setCustomCancelReason('');
  };

  const handleAddWalkin = (e: React.FormEvent) => {
    e.preventDefault();
    const service = salonServices.find(s => s.id === walkinServiceId) || salonServices[0];
    const staff = salonStaff.find(st => st.id === walkinStaffId) || salonStaff[0];

    createAppointment(
      {
        salonId: salon.id,
        salonName: salon.name,
        salonAddress: salon.address,
        salonPhone: salon.phone,
        salonImage: salon.image,
        customerId: `walkin-${Date.now()}`,
        customerName: walkinName.trim() || 'Walk-in Guest',
        customerPhone: walkinPhone.trim() || '+971 54 429 8306',
        customerEmail: 'guest@walkin.com',
        serviceId: service.id,
        serviceName: service.name,
        servicePrice: service.price,
        durationMinutes: service.durationMinutes,
        staffId: staff.id,
        staffName: staff.name,
        staffAvatar: staff.avatar,
        date: walkinDate,
        timeSlot: walkinTimeSlot,
        paymentMethod: 'pay_at_salon',
        notes: walkinNotes.trim() || 'Walk-in guest registered by front desk.',
      },
      'confirmed'
    );

    setWalkinModalOpen(false);
    setWalkinName('');
    setWalkinNotes('');
    setStatusSuccessToast({ message: 'Walk-in booking created and added to queue!' });
    setTimeout(() => setStatusSuccessToast(null), 3500);
  };

  const handleWhatsApp = (apt: Appointment, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const cleanPhone = apt.customerPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${apt.customerName}, this is ${salon.name} regarding your appointment for ${apt.serviceName} on ${apt.date} at ${apt.timeSlot}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            In-Progress
          </span>
        );
      case 'confirmed':
        return (
          <span className="px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase bg-sky-500/10 text-sky-500 border border-sky-500/25 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Confirmed
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1.5">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.8 rounded-full text-[10px] font-black uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  // Main tabs sequence as requested: "UPCOMING QUEUE" --> "IN-PROGRESS" --> "COMPLETED" --> "CANCELLED" --> "ALL BOOKINGS"
  const navigationTabs = [
    { id: 'upcoming', label: 'Upcoming Queue', count: counts.upcoming, icon: Sparkles },
    { id: 'in_progress', label: 'In-Progress', count: counts.in_progress, icon: Play },
    { id: 'completed', label: 'Completed', count: counts.completed, icon: Check },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle },
    { id: 'all', label: 'All Bookings', count: counts.all, icon: SlidersHorizontal },
  ] as const;

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* Toast Notification */}
      {statusSuccessToast && (
        <div className="fixed bottom-20 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-8 z-50 max-w-md px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs font-bold truncate">{statusSuccessToast.message}</span>
          </div>
          {statusSuccessToast.actionLabel && statusSuccessToast.onAction && (
            <button
              type="button"
              onClick={() => {
                statusSuccessToast.onAction?.();
                setStatusSuccessToast(null);
              }}
              className="px-2.5 py-1 rounded-xl text-[11px] font-black uppercase tracking-tight bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer shadow-xs shrink-0 ml-1"
            >
              {statusSuccessToast.actionLabel} &rarr;
            </button>
          )}
        </div>
      )}

      {/* Header Bar with Notification Badge on the Right */}
      <div className="flex items-center justify-between gap-2.5 sm:gap-3.5 min-h-[38px]">
        <div className="min-w-0">
          <h1 className={`text-xl sm:text-2xl font-black truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Booking Status
          </h1>
        </div>

        {/* Notification Badge to the right of Booking Status header */}
        {pendingRequestsCount > 0 && (
          <button
            id="btn-header-pending-requests"
            type="button"
            onClick={() => setActiveBusinessTab('customers')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-xs font-black border transition-all hover:scale-105 active:scale-95 shadow-xs shrink-0 cursor-pointer animate-in fade-in duration-200 ${
              isLight
                ? 'bg-amber-50 border-amber-300/90 text-amber-950 hover:bg-amber-100'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-100 hover:bg-amber-900/60'
            }`}
            style={{
              boxShadow: `0 2px 10px -2px ${currentThemeConfig.glowHex}`,
            }}
            title="Review guest requests awaiting decision"
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate max-w-[140px] xs:max-w-none">
              {pendingRequestsCount} Request{pendingRequestsCount > 1 ? 's' : ''} Awaiting Decision
            </span>
            <span className="text-[10px] text-amber-500 font-black shrink-0">&rarr;</span>
          </button>
        )}
      </div>

      {/* Search Box placed directly below Booking Status headline */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          id="bookings-search-input"
          type="text"
          value={searchClient}
          onChange={e => setSearchClient(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === 'Escape') {
              (e.target as HTMLElement).blur();
            }
          }}
          placeholder="Search client, phone, stylist, service, #BKG-A3245, C5438..."
          className={`w-full pl-10 pr-9 py-2.5 text-xs font-semibold rounded-2xl border focus:outline-none transition-all ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900 focus:border-slate-400 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-white focus:border-slate-700 shadow-xs'
          }`}
        />
        {searchClient && (
          <button
            type="button"
            onClick={() => setSearchClient('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Top Navigation Hub */}
      <div
        className={`p-3 sm:p-4 rounded-3xl border shadow-sm space-y-2.5 sm:space-y-3 ${
          isLight ? 'bg-white border-slate-200/90' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Main Tab Sequence: UPCOMING QUEUE --> IN-PROGRESS --> COMPLETED --> CANCELLED --> ALL BOOKINGS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {navigationTabs.map(st => {
            const isSelected = filterStatus === st.id;
            const IconComp = st.icon;
            return (
              <button
                key={st.id}
                id={`filter-bookings-tab-${st.id}`}
                type="button"
                onClick={() => {
                  setFilterStatus(st.id);
                  if (st.id !== 'all') {
                    setSubStatusFilter('all');
                  }
                }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl font-black uppercase text-[10px] sm:text-[11px] tracking-tight shrink-0 transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'text-white border-transparent shadow-md'
                    : isLight
                    ? 'bg-slate-100/90 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border-slate-200/80'
                    : 'bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/80'
                }`}
                style={{
                  backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                  boxShadow: isSelected ? `0 4px 12px -2px ${currentThemeConfig.glowHex}` : undefined,
                }}
              >
                <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{st.label}</span>
                {st.count > 0 && (
                  <span
                    className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                      isSelected
                        ? 'bg-black/25 text-white'
                        : isLight
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {st.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter Row: Sorting Toggle (Date Queue icon only & Newest) + Stylist Filter + '+' icon 'New Walk-in' button */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sorting Toggle: Date Queue (Icon Only) & Newest */}
            <div
              className={`flex items-center p-0.5 sm:p-1 rounded-2xl border text-xs shrink-0 ${
                isLight ? 'bg-slate-200/90 border-slate-300 shadow-2xs' : 'bg-slate-800 border-slate-700 shadow-2xs'
              }`}
            >
              <button
                type="button"
                id="btn-sort-chronological"
                onClick={() => setSortBy('chronological')}
                className={`p-1.5 sm:p-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                  sortBy === 'chronological'
                    ? 'text-white font-black shadow-xs'
                    : isLight
                    ? 'text-slate-800 hover:text-slate-950 hover:bg-white/80'
                    : 'text-slate-200 hover:text-white hover:bg-slate-700/80'
                }`}
                style={{
                  backgroundColor: sortBy === 'chronological' ? currentThemeConfig.primaryHex : undefined,
                }}
                title="Sort by Appointment Date & Time Queue (Date Queue)"
                aria-label="Date Queue"
              >
                <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
              <button
                type="button"
                id="btn-sort-newest"
                onClick={() => setSortBy('newest')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  sortBy === 'newest'
                    ? 'text-white font-black shadow-xs'
                    : isLight
                    ? 'text-slate-800 hover:text-slate-950 hover:bg-white/80'
                    : 'text-slate-200 hover:text-white hover:bg-slate-700/80'
                }`}
                style={{
                  backgroundColor: sortBy === 'newest' ? currentThemeConfig.primaryHex : undefined,
                }}
                title="Sort by Recently Created"
              >
                <span className="whitespace-nowrap">Newest</span>
              </button>
            </div>

            {/* Stylist Filter */}
            <select
              value={filterStaff}
              onChange={e => setFilterStaff(e.target.value)}
              className={`px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-semibold rounded-2xl border focus:outline-none cursor-pointer shrink-0 ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="all">All Stylists</option>
              {salonStaff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* New Walk-in Action: Display '+' icon and 'New Walk-in' text with pristine alignment */}
          <button
            id="add-walkin-btn"
            type="button"
            onClick={() => setWalkinModalOpen(true)}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl sm:rounded-2xl font-black text-[11px] sm:text-xs text-white shadow-xs transition-all flex items-center gap-1.5 hover:opacity-95 active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ml-auto"
            style={{
              backgroundColor: currentThemeConfig.primaryHex,
              boxShadow: `0 2px 10px ${currentThemeConfig.glowHex}`,
            }}
            title="Register New Walk-in Client"
            aria-label="New Walk-in"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5] shrink-0" />
            <span>New Walk-in</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COMPACT "ALL BOOKINGS" SPECIAL FILTER PANEL (Polished UI)     */}
        {/* ------------------------------------------------------------- */}
        {filterStatus === 'all' && (
          <div
            className={`p-3.5 rounded-2xl border flex flex-col gap-3 text-xs animate-in fade-in slide-in-from-top-1 duration-150 ${
              isLight ? 'bg-slate-50 border-slate-200/90' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            {/* Top row: Client Tier & Date Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Client Tier Filter */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Filter className="w-3 h-3 text-slate-400" /> Client:
                </span>
                <div className={`flex items-center p-1 rounded-xl border flex-1 ${isLight ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-900 border-slate-800'}`}>
                  <button
                    type="button"
                    id="filter-tier-all"
                    onClick={() => setFilterClientTier('all')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      filterClientTier === 'all'
                        ? isLight
                          ? 'bg-slate-900 text-white shadow-xs font-black'
                          : 'bg-slate-700 text-white shadow-xs font-black'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>All</span>
                    {counts.all > 0 && <span className="text-[10px] opacity-75 font-normal">({counts.all})</span>}
                  </button>

                  <button
                    type="button"
                    id="filter-tier-vip"
                    onClick={() => setFilterClientTier('vip')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-black transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      filterClientTier === 'vip'
                        ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                        : 'text-amber-500 hover:bg-amber-500/10'
                    }`}
                  >
                    <Crown className="w-3 h-3 fill-current" />
                    <span>VIP</span>
                    {counts.vip > 0 && <span className="text-[10px] opacity-90 font-bold">({counts.vip})</span>}
                  </button>

                  <button
                    type="button"
                    id="filter-tier-guest"
                    onClick={() => setFilterClientTier('guest')}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                      filterClientTier === 'guest'
                        ? isLight
                          ? 'bg-slate-800 text-white shadow-xs font-black'
                          : 'bg-slate-700 text-white shadow-xs font-black'
                        : isLight
                        ? 'text-slate-600 hover:text-slate-900'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Guest</span>
                    {counts.guest > 0 && <span className="text-[10px] opacity-75 font-normal">({counts.guest})</span>}
                  </button>
                </div>
              </div>

              {/* Date Filter & Date Picker */}
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <CalendarDays className="w-3 h-3 text-slate-400" /> Date:
                </span>
                <div className="flex items-center gap-1.5 flex-1">
                  <select
                    id="filter-date-select"
                    value={filterDate}
                    onChange={e => {
                      const val = e.target.value as any;
                      setFilterDate(val);
                      if (val !== 'custom') setCustomSelectedDate('');
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border focus:outline-none cursor-pointer ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                        : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  >
                    <option value="all">All Dates{counts.all > 0 ? ` (${counts.all})` : ''}</option>
                    <option value="today">Today ({todayStr})</option>
                    <option value="tomorrow">Tomorrow ({tomorrowStr})</option>
                    <option value="this_week">This Week (7d)</option>
                    <option value="future">Upcoming Dates</option>
                    <option value="past">Past History</option>
                    <option value="custom">📅 Custom Date...</option>
                  </select>

                  {filterDate === 'custom' && (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="date"
                        value={customSelectedDate}
                        onChange={e => setCustomSelectedDate(e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-xl border focus:outline-none cursor-pointer ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                      {customSelectedDate && (
                        <button
                          type="button"
                          onClick={() => setCustomSelectedDate('')}
                          className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {hasActiveAllBookingsFilters && (
                    <button
                      type="button"
                      onClick={handleResetAllBookingsFilters}
                      className="px-2.5 py-1.5 rounded-xl text-[10px] font-black text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 cursor-pointer transition-all shrink-0"
                      title="Reset All Filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom row: Sub-status Chips with smooth scroll */}
            <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Status:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar flex-1">
                {[
                  { id: 'all', label: 'All Statuses', count: counts.all },
                  { id: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle2, color: 'text-emerald-500' },
                  { id: 'cancelled', label: 'Cancelled', count: counts.cancelled, icon: XCircle, color: 'text-rose-500' },
                  { id: 'confirmed', label: 'Confirmed', count: counts.confirmed, icon: Sparkles, color: 'text-sky-500' },
                  { id: 'in_progress', label: 'In-Progress', count: counts.in_progress, icon: Play, color: 'text-amber-500' },
                ].map(chip => {
                  const isChipActive = subStatusFilter === chip.id;
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      id={`substatus-filter-${chip.id}`}
                      onClick={() => setSubStatusFilter(chip.id)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                        isChipActive
                          ? isLight
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-black'
                            : 'bg-white text-slate-950 border-white shadow-2xs font-black'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                      }`}
                    >
                      {ChipIcon && <ChipIcon className={`w-3 h-3 ${isChipActive ? (isLight ? 'text-white' : 'text-slate-950') : chip.color || 'text-slate-400'}`} />}
                      <span>{chip.label}</span>
                      {chip.count > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                            isChipActive
                              ? isLight
                                ? 'bg-white/20 text-white'
                                : 'bg-black/20 text-slate-950'
                              : isLight
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {chip.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointment Cards List */}
      <div className="space-y-3.5">
        {filteredAppointments.length === 0 ? (
          <div
            className={`p-10 text-center rounded-3xl border ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <CalendarIcon className="w-10 h-10 text-slate-400 mx-auto mb-2.5 opacity-60" />
            <h3 className={`text-sm font-black ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              No Bookings Found in this View
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no appointments matching the selected tab or active filters.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3.5">
              {filterStatus === 'all' && hasActiveAllBookingsFilters && (
                <button
                  type="button"
                  onClick={handleResetAllBookingsFilters}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white shadow-xs cursor-pointer"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  Reset Filters
                </button>
              )}
              <button
                type="button"
                onClick={() => setWalkinModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                + New Walk-in Booking
              </button>
            </div>
          </div>
        ) : (
          filteredAppointments.map(apt => {
            const isVip = isCustomerVip(apt.customerId || apt.customerName, salon.id);
            const bookingCode = formatBookingId(apt.id);
            const slotDisplay = formatBookingSlotDisplay(apt.date, apt.timeSlot);

            return (
              <div
                key={apt.id}
                id={`appointment-card-${apt.id}`}
                className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-150 ${
                  apt.status === 'in_progress'
                    ? isLight
                      ? 'bg-amber-50/50 border-amber-300 ring-2 ring-amber-400/30 shadow-sm'
                      : 'bg-amber-950/20 border-amber-500/50 ring-2 ring-amber-500/20 shadow-md'
                    : isLight
                    ? 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-750 shadow-xs'
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  {/* 1. Header: #BKG-A3245, Date & Time Slot, Tier Badge, Status Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-2 flex-wrap">
                      <h3 className={`text-sm sm:text-base font-black tracking-tight leading-tight ${isLight ? 'text-slate-950' : 'text-white'}`}>
                        {bookingCode}
                      </h3>
                      <span className="text-xs text-slate-300 dark:text-slate-700 select-none">•</span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {slotDisplay}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {/* Tier Badge: VIP / Guest */}
                      {isVip ? (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-2.5 h-2.5 fill-current" /> VIP
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          GUEST
                        </span>
                      )}

                      {/* Status Badge */}
                      {getStatusBadge(apt.status)}
                    </div>
                  </div>

                  {/* 2. Customer & Specialist Profiles with Avatars & "with" connector */}
                  <div className="flex items-center justify-between gap-2 sm:gap-4 py-0.5">
                    {/* Left: Customer Profile & Phone */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={
                            apt.customerAvatar ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
                          }
                          alt={apt.customerName}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-2xs"
                          referrerPolicy="no-referrer"
                        />
                        {isVip && (
                          <span className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                            <Crown className="w-2 h-2 fill-current" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-black truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {apt.customerName}
                        </h4>
                        <a
                          href={`tel:${apt.customerPhone}`}
                          className="text-[11px] font-mono font-medium text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 mt-0.5 truncate hover:underline"
                          title="Click to call"
                        >
                          <Phone className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                          <span>{apt.customerPhone}</span>
                        </a>
                      </div>
                    </div>

                    {/* Center "with" label */}
                    <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 px-1 shrink-0 select-none">
                      with
                    </div>

                    {/* Right: Specialist */}
                    <div className="flex items-center justify-end gap-2.5 min-w-0 flex-1 text-right">
                      <div className="min-w-0">
                        <h4 className={`text-xs sm:text-sm font-black truncate leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                          {apt.staffName}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          Specialist stylist
                        </p>
                      </div>
                      <img
                        src={
                          apt.staffAvatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={apt.staffName}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800 shadow-2xs shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* 3. Service Details Strip & Integrated Contact Popover Action */}
                  <div className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isLight ? 'bg-slate-50/90 border-slate-200/80' : 'bg-slate-950/50 border-slate-800/80'
                  }`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                      <span className={`font-black text-xs truncate ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                        {apt.serviceName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                      <span className="font-black text-amber-500 shrink-0">
                        {activeCountry?.currency || 'AED'} {apt.servicePrice}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700 select-none">•</span>
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                        {apt.durationMinutes} mins
                      </span>
                    </div>

                    {/* Contact Popover Button */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        id={`btn-contact-${apt.id}`}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveContactMenuId(activeContactMenuId === apt.id ? null : apt.id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                          activeContactMenuId === apt.id
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : isLight
                            ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                        }`}
                        title="Contact client (Call / WhatsApp / SMS)"
                      >
                        <PhoneForwarded className="w-3 h-3 text-emerald-500" />
                        <span>Contact</span>
                      </button>

                      {/* Contact Options Dropdown Menu */}
                      {activeContactMenuId === apt.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={e => {
                              e.stopPropagation();
                              setActiveContactMenuId(null);
                            }}
                          />
                          <div
                            className={`absolute right-0 top-full mt-1.5 z-40 w-52 p-1.5 rounded-2xl border shadow-xl animate-in fade-in zoom-in-95 duration-150 ${
                              isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-750 text-slate-100'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                                {apt.customerName}
                              </p>
                              <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 truncate">
                                {apt.customerPhone}
                              </p>
                            </div>

                            {/* Option 1: Direct Call */}
                            <a
                              href={`tel:${apt.customerPhone}`}
                              onClick={() => setActiveContactMenuId(null)}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                                isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                                <Phone className="w-3.5 h-3.5" />
                              </div>
                              <span>Call Client</span>
                            </a>

                            {/* Option 2: WhatsApp Chat */}
                            <button
                              type="button"
                              onClick={e => {
                                handleWhatsApp(apt, e);
                                setActiveContactMenuId(null);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                                isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-500 shrink-0">
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                              </div>
                              <span>WhatsApp Chat</span>
                            </button>

                            {/* Option 3: SMS Message */}
                            <a
                              href={`sms:${apt.customerPhone}?body=${encodeURIComponent(
                                `Hi ${apt.customerName}, this is ${salon.name} regarding your appointment on ${apt.date} at ${apt.timeSlot}.`
                              )}`}
                              onClick={() => setActiveContactMenuId(null)}
                              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                                isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-500 shrink-0">
                                <MessageSquare className="w-3.5 h-3.5" />
                              </div>
                              <span>Send SMS</span>
                            </a>

                            {/* Option 4: Copy Phone Number */}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(apt.customerPhone);
                                setStatusSuccessToast({ message: `Copied ${apt.customerPhone} to clipboard!` });
                                setTimeout(() => setStatusSuccessToast(null), 2500);
                                setActiveContactMenuId(null);
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer text-left ${
                                isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                                <Copy className="w-3.5 h-3.5" />
                              </div>
                              <span>Copy Phone</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes / Reason Messages */}
                  {apt.notes && (
                    <div
                      className={`text-xs px-3 py-2 rounded-xl border flex items-start gap-2 ${
                        isLight
                          ? 'bg-amber-50/60 border-amber-200/70 text-amber-950'
                          : 'bg-slate-950/80 border-slate-800 text-slate-200'
                      }`}
                    >
                      <span
                        className={`font-black text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${
                          isLight ? 'bg-amber-200/80 text-amber-900' : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        NOTE
                      </span>
                      <span className={`italic font-medium leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        "{apt.notes}"
                      </span>
                    </div>
                  )}

                  {apt.status === 'cancelled' && apt.declineReason && (
                    <div className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl border border-rose-500/20 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Cancellation Reason:</strong> {apt.declineReason}
                        {apt.declineApology && (
                          <p className="text-[11px] text-rose-400 mt-0.5 italic">"{apt.declineApology}"</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 4. Actions Row */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    {/* Status Feedback / Controls */}
                    {apt.status === 'completed' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Service Completed</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1 ${
                            isLight ? 'border-slate-200 text-slate-600 hover:bg-slate-100' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                          }`}
                          title="Reopen appointment"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reopen</span>
                        </button>
                      </div>
                    )}

                    {apt.status === 'cancelled' && (
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold text-rose-500 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Booking Cancelled</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'confirmed', 'Restored by Salon Manager')}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl bg-sky-500/10 text-sky-500 hover:bg-sky-500/20 border border-sky-500/25 cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restore</span>
                        </button>
                      </div>
                    )}

                    {apt.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2 w-full">
                        <button
                          type="button"
                          onClick={() => setCancelModalApt(apt)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10 border border-rose-500/30 flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept Booking</span>
                        </button>
                      </div>
                    )}

                    {apt.status === 'confirmed' && (
                      <div className="flex items-center justify-between w-full">
                        <button
                          type="button"
                          onClick={() => setCancelModalApt(apt)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1"
                          title="Cancel booking"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(apt.id, 'completed')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Done</span>
                          </button>
                          <button
                            type="button"
                            id={`start-service-btn-${apt.id}`}
                            onClick={() => handleStatusChange(apt.id, 'in_progress')}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md hover:opacity-95 cursor-pointer transition-all"
                            style={{
                              backgroundColor: currentThemeConfig.primaryHex,
                              boxShadow: `0 4px 12px ${currentThemeConfig.glowHex}`,
                            }}
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Service</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {apt.status === 'in_progress' && (
                      <div className="flex items-center justify-between w-full">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(apt.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1"
                          title="Revert to confirmed"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revert</span>
                        </button>

                        <button
                          type="button"
                          id={`complete-service-btn-${apt.id}`}
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="px-4 py-1.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
                        >
                          <Check className="w-4 h-4" />
                          <span>Finish & Complete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Walk-in Booking Modal */}
      {walkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div
              className="p-5 border-b flex items-center justify-between text-white"
              style={{
                background: `linear-gradient(135deg, ${currentThemeConfig.primaryHex}, #0f172a)`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-white" />
                <div>
                  <h2 className="text-base font-black">Register New Walk-in Client</h2>
                  <p className="text-xs text-white/80">Add client directly to salon queue</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWalkinModalOpen(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWalkin} className="p-5 space-y-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Client Name *</label>
                <input
                  type="text"
                  required
                  value={walkinName}
                  onChange={e => setWalkinName(e.target.value)}
                  placeholder="e.g. John Doe / Walk-in Guest"
                  className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={walkinPhone}
                    onChange={e => setWalkinPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">Date *</label>
                  <input
                    type="date"
                    required
                    value={walkinDate}
                    onChange={e => setWalkinDate(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none cursor-pointer ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-slate-600'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">Service *</label>
                  <select
                    value={walkinServiceId}
                    onChange={e => setWalkinServiceId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    {salonServices.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({activeCountry?.currency || 'AED'} {s.price} • {s.durationMinutes}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-black uppercase text-slate-400">Stylist *</label>
                  <select
                    value={walkinStaffId}
                    onChange={e => setWalkinStaffId(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-2xl border focus:outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                    }`}
                  >
                    {salonStaff.map(st => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Time Slot *</label>
                <div className="grid grid-cols-4 gap-2">
                  {['10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM', '08:30 PM'].map(
                    slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setWalkinTimeSlot(slot)}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold text-center border cursor-pointer transition-all ${
                          walkinTimeSlot === slot
                            ? 'text-white border-transparent shadow-xs'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                        style={{
                          backgroundColor: walkinTimeSlot === slot ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {slot}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase text-slate-400">Special Notes</label>
                <input
                  type="text"
                  value={walkinNotes}
                  onChange={e => setWalkinNotes(e.target.value)}
                  placeholder="e.g. VIP preference, beard trim requested, etc."
                  className={`w-full px-3.5 py-2 rounded-2xl border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl font-black text-white shadow-md cursor-pointer hover:opacity-95"
                  style={{ backgroundColor: currentThemeConfig.primaryHex }}
                >
                  Confirm & Add to Queue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl border shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/10">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Cancel Appointment
                </h3>
                <p className="text-xs text-slate-400">
                  Client: <strong className="text-slate-200">{cancelModalApt.customerName}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-400 uppercase text-[10px]">Select Reason:</label>
              {[
                'Client requested cancellation',
                'Client no-show / uncontactable',
                'Stylist emergency / unavailable',
                'Double booking conflict',
                'Other',
              ].map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    cancelReason === reason
                      ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 font-bold'
                      : isLight
                      ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancelReason"
                    value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className="text-rose-500 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}

              {cancelReason === 'Other' && (
                <input
                  type="text"
                  value={customCancelReason}
                  onChange={e => setCustomCancelReason(e.target.value)}
                  placeholder="Specify cancellation note..."
                  className={`w-full px-3 py-2 text-xs rounded-xl border mt-2 focus:outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
                  }`}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setCancelModalApt(null)}
                className="px-4 py-2 rounded-xl font-bold text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl font-black text-white bg-rose-600 hover:bg-rose-500 cursor-pointer shadow-md"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
