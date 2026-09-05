import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Salon, ServiceItem, StaffMember } from '../../types';
import { StaffAvatar } from '../common/StaffAvatar';
import { getRecommendedAiBanner } from '../../utils/aiBannerGenerator';
import { isSlotInPast, getLocalDateString, parseTimeSlotHoursMinutes } from '../../utils/dateTimeUtils';
import {
  generateTimeSlotsForDate,
  getSalonScheduleForDate,
  format12Hour,
} from '../../utils/salonUtils';
import {
  X,
  Clock,
  User,
  Scissors,
  CheckCircle2,
  CreditCard,
  Building,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
  Receipt,
  MapPin,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const BookingFlowModal: React.FC = () => {
  const {
    bookingModalOpen,
    setBookingModalOpen,
    preselectedSalon,
    preselectedService,
    preselectedStaff,
    setPreselectedSalon,
    setPreselectedService,
    setPreselectedStaff,
    services,
    staffMembers,
    appointments,
    customerUser,
    createAppointment,
    setActiveCustomerTab,
    salons,
    currentThemeConfig,
    colorThemeMode,
    formatPrice,
    t,
  } = useApp();

  const isLight = colorThemeMode === 'light';

  const salon = preselectedSalon || salons[0];
  const salonServices = services.filter(s => s.salonId === salon?.id);
  const salonStaff = staffMembers.filter(st => st.salonId === salon?.id);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [entryMode, setEntryMode] = useState<'shop' | 'service' | 'stylist'>('shop');
  const [serviceCategory, setServiceCategory] = useState<string>('All');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [anyStaff, setAnyStaff] = useState(false);

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return getLocalDateString(new Date());
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pay_at_salon' | 'card'>('pay_at_salon');
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Helper to convert any time slot string ("09:00", "09:00 AM", "14:30", "02:30 PM") into minutes from midnight
  const getSlotMinutes = (timeStr: string): number => {
    const { hour, minute } = parseTimeSlotHoursMinutes(timeStr);
    return hour * 60 + minute;
  };

  /**
   * Returns all specialists who are active and free from overlapping bookings for the
   * full duration of the selected service at the given time slot:
   * [slotStartMin, slotStartMin + serviceDuration) vs [apptStartMin, apptStartMin + apptDuration)
   */
  const getAvailableStaffForSlot = (date: string, timeSlot: string) => {
    const slotStartMin = getSlotMinutes(timeSlot);
    const serviceDuration = selectedService?.durationMinutes || 45;
    const slotEndMin = slotStartMin + serviceDuration;

    return salonStaff.filter(staff => {
      if (!staff.isAvailable) return false;

      // Ensure no overlapping active booking for this staff member:
      // Overlap condition: [slotStartMin, slotEndMin) overlaps with [apptRangeStart, apptRangeEnd)
      // iff (slotStartMin < apptRangeEnd && slotEndMin > apptStartMin)
      const hasConflict = appointments.some(appointment => {
        if (appointment.staffId !== staff.id) return false;
        if (!['pending', 'confirmed', 'in_progress', 'rescheduled_by_business'].includes(appointment.status)) {
          return false;
        }

        const apptDuration = appointment.durationMinutes || 45;

        // 1. Check primary scheduled booking interval
        if (appointment.date === date && appointment.timeSlot) {
          const apptStartMin = getSlotMinutes(appointment.timeSlot);
          const apptEndMin = apptStartMin + apptDuration;

          if (slotStartMin < apptEndMin && slotEndMin > apptStartMin) {
            return true;
          }
        }

        // 2. Check proposed reschedule interval if pending customer confirmation on this date
        if (
          appointment.status === 'rescheduled_by_business' &&
          appointment.suggestedDate === date &&
          appointment.suggestedTimeSlot
        ) {
          const propStartMin = getSlotMinutes(appointment.suggestedTimeSlot);
          const propEndMin = propStartMin + apptDuration;

          if (slotStartMin < propEndMin && slotEndMin > propStartMin) {
            return true;
          }
        }

        return false;
      });

      return !hasConflict;
    });
  };

  const quickNotesOptions = [
    'Skin fade textured top',
    'Quiet appointment',
    'Sensitive skin',
    '+ Scalp massage',
    '+ Beard line-up',
    'Allergic to menthol',
  ];

  const serviceCategories = ['All', ...Array.from(new Set(salonServices.map(s => s.category)))];

  const filteredServices = salonServices.filter(
    s => serviceCategory === 'All' || s.category === serviceCategory
  );

  useEffect(() => {
    if (!bookingModalOpen) return;

    if (preselectedStaff && !preselectedService) {
      setEntryMode('stylist');
      setSelectedStaff(preselectedStaff);
      setAnyStaff(false);
      setSelectedService(salonServices[0] || null);
      setCurrentStep(1);
    } else if (preselectedService) {
      setEntryMode('service');
      setSelectedService(preselectedService);
      if (preselectedStaff) {
        setSelectedStaff(preselectedStaff);
        setAnyStaff(false);
        setCurrentStep(3);
      } else {
        setSelectedStaff(null);
        setAnyStaff(false);
        setCurrentStep(2);
      }
    } else {
      setEntryMode('shop');
      setSelectedService(salonServices[0] || null);
      setSelectedStaff(null);
      setAnyStaff(false);
      setCurrentStep(1);
    }
  }, [bookingModalOpen, preselectedSalon, preselectedService, preselectedStaff]);

  // Dynamically compute slots and schedule for selected date using salon's actual hours and overrides
  const currentDaySlotsResult = useMemo(() => {
    return generateTimeSlotsForDate(
      selectedDate,
      salon?.workingHours,
      salon?.specialSchedules,
      30,
      salon?.isOpenNow
    );
  }, [selectedDate, salon?.workingHours, salon?.specialSchedules, salon?.isOpenNow]);

  const visibleSlotGroups = currentDaySlotsResult.visibleSlotGroups;
  const allAvailableSlotsForDate = useMemo(() => {
    return visibleSlotGroups.flatMap(g => g.slots);
  }, [visibleSlotGroups]);

  const totalVisibleSlots = allAvailableSlotsForDate.length;
  const selectedDaySchedule = currentDaySlotsResult.schedule;

  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayResult = generateTimeSlotsForDate(
        dateStr,
        salon?.workingHours,
        salon?.specialSchedules,
        30,
        salon?.isOpenNow
      );
      return {
        dateStr,
        dayName,
        formattedDate,
        isOpen: dayResult.schedule.isOpen,
        hasAnyFutureSlots: dayResult.hasAnyFutureSlots,
        isSpecial: dayResult.schedule.isSpecial,
        specialTitle: dayResult.schedule.specialTitle,
        isClosedReason: dayResult.schedule.isClosedReason,
        formattedHours: dayResult.schedule.isOpen
          ? `${dayResult.schedule.formattedOpen} - ${dayResult.schedule.formattedClose}`
          : 'Closed',
      };
    });
  }, [today, salon?.workingHours, salon?.specialSchedules, salon?.isOpenNow]);

  // If today has no future slots when opening booking modal, default to next available open day
  useEffect(() => {
    if (!bookingModalOpen) return;
    const todayStr = getLocalDateString(new Date());
    const todayResult = generateTimeSlotsForDate(
      todayStr,
      salon?.workingHours,
      salon?.specialSchedules,
      30,
      salon?.isOpenNow
    );
    if (!todayResult.hasAnyFutureSlots) {
      const nextOpenDay = days.find(d => d.hasAnyFutureSlots);
      if (nextOpenDay) {
        setSelectedDate(nextOpenDay.dateStr);
      } else {
        setSelectedDate(todayStr);
      }
    } else {
      setSelectedDate(todayStr);
    }
  }, [bookingModalOpen, salon?.workingHours, salon?.specialSchedules, salon?.isOpenNow, days]);

  // Keep selectedTimeSlot aligned with valid future slots whenever date changes
  useEffect(() => {
    if (!selectedDate) return;
    if (allAvailableSlotsForDate.length > 0) {
      const isSlotValidAndFree = (s: string) => {
        if (!s || isSlotInPast(selectedDate, s) || !allAvailableSlotsForDate.includes(s)) return false;
        const avail = getAvailableStaffForSlot(selectedDate, s);
        return selectedStaff ? avail.some(st => st.id === selectedStaff.id) : avail.length > 0;
      };

      if (!isSlotValidAndFree(selectedTimeSlot)) {
        const firstFreeSlot = allAvailableSlotsForDate.find(s => isSlotValidAndFree(s));
        setSelectedTimeSlot(firstFreeSlot || allAvailableSlotsForDate[0]);
      }
    } else {
      setSelectedTimeSlot('');
    }
  }, [selectedDate, allAvailableSlotsForDate, selectedStaff, selectedService]);

  const handleConfirmBooking = () => {
    if (!selectedService) return;

    if (isSlotInPast(selectedDate, selectedTimeSlot)) {
      setBookingError('Please select a future appointment time.');
      setCurrentStep(3);
      return;
    }

    const availableStaff = getAvailableStaffForSlot(selectedDate, selectedTimeSlot);
    const assignedStaff = anyStaff
      ? availableStaff[0]
      : selectedStaff;

    if (!assignedStaff || !availableStaff.some(staff => staff.id === assignedStaff.id)) {
      setBookingError('That time is no longer available for the selected stylist. Please choose another slot or select any available specialist.');
      setCurrentStep(3);
      return;
    }

    setBookingError(null);

    const bookingId = createAppointment({
      salonId: salon.id,
      salonName: salon.name,
      salonAddress: salon.address,
      salonPhone: salon.phone,
      salonImage: salon.image,
      customerId: customerUser.id,
      customerName: customerUser.name,
      customerPhone: customerUser.phone,
      customerEmail: customerUser.email,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      servicePrice: selectedService.price,
      durationMinutes: selectedService.durationMinutes,
      staffId: assignedStaff.id,
      staffName: assignedStaff.name,
      staffAvatar: assignedStaff.avatar,
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      paymentMethod,
      notes,
    });

    setConfirmedBookingId(bookingId);
    setCurrentStep(5);
  };

  const handleClose = () => {
    setBookingModalOpen(false);
    setCurrentStep(1);
    setConfirmedBookingId(null);
    setBookingError(null);
    setPreselectedSalon(null);
    setPreselectedService(null);
    setPreselectedStaff(null);
  };

  const handleFinishAndGoToBookings = () => {
    handleClose();
    setActiveCustomerTab('bookings');
  };

  useEffect(() => {
    if (!bookingModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [bookingModalOpen]);

  if (!bookingModalOpen || !salon) return null;

  const handleCopyTicket = (id: string) => {
    navigator.clipboard?.writeText?.(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAddQuickNote = (tag: string) => {
    if (!notes.includes(tag)) {
      setNotes(prev => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!selectedService) return;
      if (entryMode === 'stylist' && selectedStaff) {
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (!selectedStaff && !anyStaff) {
        setAnyStaff(true);
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!selectedDate || !selectedTimeSlot || isSlotInPast(selectedDate, selectedTimeSlot)) {
        setBookingError('Please select a valid upcoming appointment time slot.');
        return;
      }
      setBookingError(null);
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      if (entryMode === 'stylist') {
        setCurrentStep(1);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 4) {
      setCurrentStep(3);
    }
  };

  const handleStepClick = (targetStep: number) => {
    if (targetStep === 1) {
      setCurrentStep(1);
    } else if (targetStep === 2) {
      if (selectedService) setCurrentStep(2);
    } else if (targetStep === 3) {
      if (selectedService) {
        if (!selectedStaff && !anyStaff) {
          setAnyStaff(true);
        }
        setCurrentStep(3);
      }
    } else if (targetStep === 4) {
      if (selectedService && (selectedStaff || anyStaff) && selectedDate && selectedTimeSlot) {
        setCurrentStep(4);
      }
    }
  };

  return (
    <div
      id="booking-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="booking-flow-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-flow-title"
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl p-5 sm:p-7 max-h-[92vh] flex flex-col justify-between transition-colors animate-in zoom-in-95 duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
        style={{
          boxShadow: `0 20px 50px -10px ${currentThemeConfig.glowHex}`,
        }}
      >
        <div>
          <div className={`flex items-center justify-between pb-3.5 border-b ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm shrink-0"
                style={{
                  backgroundColor: `${currentThemeConfig.primaryHex}15`,
                  borderColor: `${currentThemeConfig.primaryHex}40`,
                  color: currentThemeConfig.primaryHex,
                }}
              >
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3
                    id="booking-flow-title"
                    className={`text-base font-extrabold font-['Outfit',sans-serif] ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {salon.name}
                  </h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${currentThemeConfig.primaryHex}15`,
                      borderColor: `${currentThemeConfig.primaryHex}35`,
                      color: currentThemeConfig.primaryHex,
                    }}
                  >
                    Instant Booking
                  </span>
                </div>
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span className="truncate max-w-[240px] sm:max-w-xs">{salon.address}</span>
                </p>
              </div>
            </div>

            <button
              id="close-booking-modal-btn"
              type="button"
              onClick={handleClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {currentStep < 5 && (
            <div className="mt-4 pt-1">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { step: 1, label: 'Service', icon: Scissors },
                  { step: 2, label: 'Stylist', icon: User },
                  { step: 3, label: 'Time', icon: Clock },
                  { step: 4, label: 'Confirm', icon: CheckCircle2 },
                ].map(s => {
                  const isCompleted = currentStep > s.step;
                  const isCurrent = currentStep === s.step;

                  return (
                    <div
                      key={s.step}
                      id={`booking-step-pill-${s.step}`}
                      onClick={() => handleStepClick(s.step)}
                      className={`space-y-1.5 text-center cursor-pointer transition-all ${
                        isCompleted ? 'opacity-90' : isCurrent ? 'opacity-100' : 'opacity-50'
                      }`}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor:
                            isCurrent || isCompleted
                              ? currentThemeConfig.primaryHex
                              : isLight
                              ? '#e2e8f0'
                              : '#1e293b',
                        }}
                      />

                      <div className="flex items-center justify-center gap-1">
                        <span
                          className={`text-[10px] sm:text-xs font-bold transition-colors ${
                            isCurrent
                              ? isLight ? 'text-slate-900 font-extrabold' : 'text-white font-extrabold'
                              : isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}
                          style={{
                            color: isCurrent ? currentThemeConfig.primaryHex : undefined,
                          }}
                        >
                          {isCompleted ? '✓' : s.step}. {s.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="my-5 overflow-y-auto flex-1 pr-1 max-h-[52vh] custom-scrollbar">
          {currentStep === 1 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    1. Choose Service
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Select from {salonServices.length} specialized salon treatments
                  </p>
                </div>
              </div>

              {selectedStaff && !anyStaff && (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                  style={{ borderColor: `${currentThemeConfig.primaryHex}40` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StaffAvatar
                      name={selectedStaff.name}
                      avatar={selectedStaff.avatar}
                      gender={selectedStaff.gender}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest block opacity-75" style={{ color: currentThemeConfig.primaryHex }}>
                        Stylist Selected
                      </span>
                      <h5 className={`text-xs font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedStaff.name}{' '}
                        <span className="font-normal text-slate-400">({selectedStaff.roleTitle})</span>
                      </h5>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors hover:underline shrink-0"
                    style={{
                      color: currentThemeConfig.primaryHex,
                      borderColor: `${currentThemeConfig.primaryHex}40`,
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              {serviceCategories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                  {serviceCategories.map(cat => {
                    const isSelected = serviceCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setServiceCategory(cat)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                          borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-3">
                {filteredServices.map(srv => {
                  const isSelected = selectedService?.id === srv.id;
                  const discountPercent =
                    srv.originalPrice && srv.originalPrice > srv.price
                      ? Math.round(((srv.originalPrice - srv.price) / srv.originalPrice) * 100)
                      : null;

                  return (
                    <div
                      key={srv.id}
                      id={`select-service-${srv.id}`}
                      onClick={() => setSelectedService(srv)}
                      className={`p-3 rounded-2xl cursor-pointer transition-all border flex gap-3.5 items-center ${
                        isSelected
                          ? isLight
                            ? 'border-2 shadow-md ring-2 ring-emerald-500/10'
                            : 'border-2 shadow-md ring-1'
                          : isLight
                          ? 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                      style={{
                        backgroundColor: isSelected
                          ? `${currentThemeConfig.primaryHex}12`
                          : undefined,
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {(() => {
                          const fallback = getRecommendedAiBanner(srv.name, srv.category, srv.genderTarget || 'Unisex').imageUrl;
                          const imgUrl = srv.image || (srv as any).bannerImage || fallback;
                          return (
                            <img
                              src={imgUrl}
                              alt={srv.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                e.currentTarget.src = fallback;
                              }}
                            />
                          );
                        })()}

                        <div className="absolute top-1 left-1">
                          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider">
                            {srv.genderTarget || 'Unisex'}
                          </span>
                        </div>

                        {discountPercent && (
                          <div className="absolute bottom-1 right-1">
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-black font-extrabold text-[9px]">
                              {discountPercent}% OFF
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-extrabold text-xs sm:text-sm truncate ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}
                          >
                            {srv.name}
                          </span>
                          {srv.isPopular && (
                            <span
                              className="text-[9px] font-black px-1.5 py-0.5 rounded border flex items-center gap-0.5"
                              style={{
                                backgroundColor: `${currentThemeConfig.primaryHex}20`,
                                borderColor: `${currentThemeConfig.primaryHex}50`,
                                color: currentThemeConfig.primaryHex,
                              }}
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              Popular
                            </span>
                          )}
                        </div>

                        <p className={`text-[11px] mt-1 line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {srv.description}
                        </p>

                        <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                          <span
                            className="font-bold px-2 py-0.5 rounded-md border"
                            style={{
                              backgroundColor: `${currentThemeConfig.primaryHex}10`,
                              borderColor: `${currentThemeConfig.primaryHex}30`,
                              color: currentThemeConfig.primaryHex,
                            }}
                          >
                            ⏱ {srv.durationMinutes} mins
                          </span>
                          <span className={`font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {srv.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end justify-between h-20 sm:h-24 py-1">
                        <div>
                          <div className="flex items-baseline justify-end gap-1.5">
                            <span
                              className={`text-base sm:text-lg font-black font-mono ${
                                isLight ? 'text-slate-900' : 'text-white'
                              }`}
                            >
                              {formatPrice(srv.price)}
                            </span>
                          </div>
                          {srv.originalPrice && srv.originalPrice > srv.price && (
                            <span className="text-[11px] font-mono text-slate-400 line-through block">
                              {formatPrice(srv.originalPrice)}
                            </span>
                          )}
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'text-white shadow-sm'
                              : isLight
                              ? 'border-slate-300 bg-white'
                              : 'border-slate-700 bg-slate-900'
                          }`}
                          style={{
                            backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                            borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                          }}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    2. Select Specialist
                  </h4>
                  <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Choose your preferred professional or get the fastest available slot
                  </p>
                </div>
              </div>

              {selectedService && (
                <div
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 animate-in fade-in duration-200 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                  style={{ borderColor: `${currentThemeConfig.primaryHex}40` }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border"
                      style={{
                        backgroundColor: `${currentThemeConfig.primaryHex}15`,
                        borderColor: `${currentThemeConfig.primaryHex}35`,
                        color: currentThemeConfig.primaryHex,
                      }}
                    >
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest block opacity-75" style={{ color: currentThemeConfig.primaryHex }}>
                        Treatment Selected
                      </span>
                      <h5 className={`text-xs font-extrabold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {selectedService.name}{' '}
                        <span className="font-extrabold" style={{ color: currentThemeConfig.primaryHex }}>
                          • {formatPrice(selectedService.price)}
                        </span>
                      </h5>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-colors hover:underline shrink-0"
                    style={{
                      color: currentThemeConfig.primaryHex,
                      borderColor: `${currentThemeConfig.primaryHex}40`,
                    }}
                  >
                    Change
                  </button>
                </div>
              )}

              <div
                id="select-stylist-any"
                onClick={() => {
                  setAnyStaff(true);
                  setSelectedStaff(null);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                  anyStaff
                    ? isLight
                      ? 'border-2 shadow-md ring-2 ring-emerald-500/10'
                      : 'border-2 shadow-md ring-1'
                    : isLight
                    ? 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
                style={{
                  backgroundColor: anyStaff ? `${currentThemeConfig.primaryHex}12` : undefined,
                  borderColor: anyStaff ? currentThemeConfig.primaryHex : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl border flex items-center justify-center font-bold text-sm shadow-sm shrink-0"
                    style={{
                      backgroundColor: `${currentThemeConfig.primaryHex}20`,
                      borderColor: `${currentThemeConfig.primaryHex}40`,
                      color: currentThemeConfig.primaryHex,
                    }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h5 className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Any Available Specialist
                      </h5>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-600 font-bold">
                        Fastest Slot
                      </span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      We'll assign the first available certified stylist at your time.
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ml-2 ${
                    anyStaff
                      ? 'text-white shadow-sm'
                      : isLight
                      ? 'border-slate-300 bg-white'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                  style={{
                    backgroundColor: anyStaff ? currentThemeConfig.primaryHex : undefined,
                    borderColor: anyStaff ? currentThemeConfig.primaryHex : undefined,
                  }}
                >
                  {anyStaff && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                {salonStaff.map(st => {
                  const isSelected = !anyStaff && selectedStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      id={`select-stylist-${st.id}`}
                      onClick={() => {
                        setSelectedStaff(st);
                        setAnyStaff(false);
                      }}
                      className={`p-3.5 rounded-2xl cursor-pointer transition-all border flex items-center justify-between ${
                        isSelected
                          ? isLight
                            ? 'border-2 shadow-md ring-2 ring-emerald-500/10'
                            : 'border-2 shadow-md ring-1'
                          : isLight
                          ? 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${currentThemeConfig.primaryHex}12` : undefined,
                        borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <StaffAvatar
                          name={st.name}
                          avatar={st.avatar}
                          gender={st.gender}
                          size="md"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h5 className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {st.name}
                            </h5>
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-bold">
                              ★{st.rating}
                            </span>
                          </div>
                          <p
                            className="text-[11px] font-bold mt-0.5"
                            style={{ color: currentThemeConfig.primaryHex }}
                          >
                            {st.roleTitle}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Specialties: {st.specialties.join(', ')}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all shrink-0 ml-2 ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : isLight
                            ? 'border-slate-300 bg-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                          borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    3. Select Date
                  </h4>
                  <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Selected: <strong>{selectedDate}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {days.map(d => {
                    const isSelected = selectedDate === d.dateStr;
                    return (
                      <button
                        key={d.dateStr}
                        type="button"
                        id={`date-select-${d.dateStr}`}
                        onClick={() => {
                          setSelectedDate(d.dateStr);
                          setBookingError(null);
                        }}
                        className={`p-2.5 rounded-2xl text-center transition-all border relative cursor-pointer ${
                          isSelected
                            ? 'text-white shadow-md font-bold'
                            : isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                          borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                          boxShadow: isSelected ? `0 4px 12px ${currentThemeConfig.glowHex}` : undefined,
                        }}
                      >
                        <span className="text-[10px] block font-medium opacity-80 uppercase tracking-tight">
                          {d.dayName}
                        </span>
                        <span className="text-sm font-extrabold block my-0.5">
                          {d.formattedDate.split(' ')[1]}
                        </span>
                        <span className="text-[9px] block opacity-70">
                          {d.formattedDate.split(' ')[0]}
                        </span>
                        {!d.isOpen ? (
                          <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[8px] font-black bg-rose-500/20 text-rose-400">
                            Closed
                          </span>
                        ) : !d.hasAnyFutureSlots && d.dateStr === getLocalDateString(new Date()) ? (
                          <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[8px] font-black bg-amber-500/20 text-amber-400">
                            Ended
                          </span>
                        ) : d.isSpecial ? (
                          <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[8px] font-black bg-emerald-500/20 text-emerald-400">
                            Special
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day Operating Hours Banner */}
              <div
                className={`p-2.5 px-3 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                  !selectedDaySchedule.isOpen
                    ? isLight
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-rose-950/30 border-rose-900/50 text-rose-300'
                    : selectedDaySchedule.isSpecial
                    ? isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-950/30 border-amber-900/50 text-amber-300'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                    : 'bg-slate-900/70 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0 opacity-75" />
                  <span className="font-semibold truncate">
                    {!selectedDaySchedule.isOpen
                      ? selectedDaySchedule.isClosedReason || 'Shop Closed for Selected Date'
                      : selectedDaySchedule.isSpecial
                      ? `Special Hours: ${selectedDaySchedule.formattedOpen} - ${selectedDaySchedule.formattedClose} (${selectedDaySchedule.specialTitle || 'Special Schedule'})`
                      : `Operating Hours: ${selectedDaySchedule.formattedOpen} - ${selectedDaySchedule.formattedClose}`}
                  </span>
                </div>
                <span className="text-[10px] font-bold shrink-0 opacity-75">
                  {days.find(d => d.dateStr === selectedDate)?.dayName || selectedDate}
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                    Available Time Slots
                  </h4>
                  {selectedTimeSlot && totalVisibleSlots > 0 ? (
                    <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: currentThemeConfig.primaryHex }}>
                      <Clock className="w-3 h-3" />
                      <span>Slot: {selectedTimeSlot}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      {totalVisibleSlots > 0
                        ? `${totalVisibleSlots} slots available`
                        : !selectedDaySchedule.isOpen
                        ? 'Shop Closed'
                        : 'No upcoming slots today'}
                    </span>
                  )}
                </div>

                {!selectedDaySchedule.isOpen ? (
                  <div
                    className={`p-5 rounded-2xl border text-center space-y-3 animate-in fade-in duration-200 ${
                      isLight
                        ? 'bg-rose-50/80 border-rose-200/80 text-rose-950'
                        : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm">
                        {salon.name} is Closed on {days.find(d => d.dateStr === selectedDate)?.dayName || 'Selected Date'}
                      </h5>
                      <p className={`text-[11px] mt-1 max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {selectedDaySchedule.isClosedReason || 'This salon does not operate on this day.'} Please choose another date from the schedule above.
                      </p>
                    </div>
                    {days.find(d => d.hasAnyFutureSlots) && (
                      <button
                        type="button"
                        id="view-next-open-day-btn"
                        onClick={() => {
                          const nextOpenDay = days.find(d => d.hasAnyFutureSlots);
                          if (nextOpenDay) setSelectedDate(nextOpenDay.dateStr);
                          setBookingError(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: currentThemeConfig.primaryHex,
                          boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                        }}
                      >
                        <span>View Open Slots for {days.find(d => d.hasAnyFutureSlots)?.dayName} ({days.find(d => d.hasAnyFutureSlots)?.formattedDate})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : totalVisibleSlots === 0 ? (
                  <div
                    className={`p-5 rounded-2xl border text-center space-y-3 animate-in fade-in duration-200 ${
                      isLight
                        ? 'bg-amber-50/80 border-amber-200/80 text-amber-950'
                        : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs sm:text-sm">
                        All Booking Slots for {days.find(d => d.dateStr === selectedDate)?.dayName || 'Today'} Have Concluded
                      </h5>
                      <p className={`text-[11px] mt-1 max-w-sm mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Salon hours for today have closed (closing time: {selectedDaySchedule.formattedClose}). Select tomorrow or an upcoming date to reserve your appointment.
                      </p>
                    </div>
                    {days[1] && (
                      <button
                        type="button"
                        id="book-tomorrow-quick-btn"
                        onClick={() => {
                          setSelectedDate(days[1].dateStr);
                          setBookingError(null);
                        }}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white shadow-md transition-all active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                        style={{
                          backgroundColor: currentThemeConfig.primaryHex,
                          boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                        }}
                      >
                        <span>Book for Tomorrow ({days[1].formattedDate})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleSlotGroups.map(grp => (
                      <div key={grp.period} className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                            {grp.period}
                          </span>
                          <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                            {grp.timeRange}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {grp.slots.map(slot => {
                            const isSelected = selectedTimeSlot === slot;
                            const isUnavailable = selectedStaff
                              ? !getAvailableStaffForSlot(selectedDate, slot).some(
                                  staff => staff.id === selectedStaff.id
                                )
                              : getAvailableStaffForSlot(selectedDate, slot).length === 0;
                            return (
                              <button
                                key={slot}
                                type="button"
                                id={`slot-${slot.replace(/[^a-zA-Z0-9]/g, '')}`}
                                disabled={isUnavailable}
                                aria-label={`${slot}${isUnavailable ? ', stylist unavailable' : ', available'}`}
                                onClick={() => {
                                  setSelectedTimeSlot(slot);
                                  setBookingError(null);
                                }}
                                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                  isSelected
                                    ? 'text-white shadow-md'
                                    : isUnavailable
                                    ? 'opacity-40 cursor-not-allowed line-through bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                                    : isLight
                                    ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                                }`}
                                style={{
                                  backgroundColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                                  borderColor: isSelected ? currentThemeConfig.primaryHex : undefined,
                                  boxShadow: isSelected ? `0 2px 8px ${currentThemeConfig.glowHex}` : undefined,
                                }}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {bookingError && (
                <div role="alert" className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <h4 className={`text-xs font-extrabold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                  4. Review & Confirm Booking
                </h4>
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Please verify your salon details and choose your preferred checkout method.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-3 text-xs ${
                  isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
                style={{ borderColor: `${currentThemeConfig.primaryHex}40` }}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Salon</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{salon.name}</span>
                </div>
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Service</span>
                  <div className="text-right">
                    <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedService?.name}</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>⏱ {selectedService?.durationMinutes} mins</span>
                  </div>
                </div>
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Stylist</span>
                  <span
                    className="font-bold"
                    style={{ color: currentThemeConfig.primaryHex }}
                  >
                    {anyStaff ? 'Any Available Specialist' : selectedStaff?.name}
                  </span>
                </div>
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Date & Time</span>
                  <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {selectedDate} at {selectedTimeSlot}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{t('booking.total', 'Total Due')}</span>
                  <span className="text-lg font-black font-mono" style={{ color: currentThemeConfig.primaryHex }}>
                    {formatPrice(selectedService?.price || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Special Notes or Style Requests (Optional)
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickNotesOptions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddQuickNote(tag)}
                      className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                        notes.includes(tag)
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 font-bold'
                          : isLight
                          ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Skin fade with textured top, allergic to menthol..."
                  className={`w-full rounded-xl px-3 py-2.5 text-xs border focus:outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                      : 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pay_at_salon')}
                    className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all ${
                      paymentMethod === 'pay_at_salon'
                        ? isLight
                          ? 'border-2 shadow-sm ring-2 ring-emerald-500/10'
                          : 'border-2 shadow-sm ring-1'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: paymentMethod === 'pay_at_salon' ? `${currentThemeConfig.primaryHex}15` : undefined,
                      borderColor: paymentMethod === 'pay_at_salon' ? currentThemeConfig.primaryHex : undefined,
                    }}
                  >
                    <Building
                      className="w-4 h-4 mb-1.5"
                      style={{ color: currentThemeConfig.primaryHex }}
                    />
                    <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>Pay at Salon</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cash, Card, or Apple Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-left text-xs font-medium transition-all ${
                      paymentMethod === 'card'
                        ? isLight
                          ? 'border-2 shadow-sm ring-2 ring-emerald-500/10'
                          : 'border-2 shadow-sm ring-1'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    style={{
                      backgroundColor: paymentMethod === 'card' ? `${currentThemeConfig.primaryHex}15` : undefined,
                      borderColor: paymentMethod === 'card' ? currentThemeConfig.primaryHex : undefined,
                    }}
                  >
                    <CreditCard
                      className="w-4 h-4 mb-1.5"
                      style={{ color: currentThemeConfig.primaryHex }}
                    />
                    <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>Instant Digital Card</span>
                    <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Secure fast checkout</span>
                  </button>
                </div>
              </div>

              <div className={`p-3 rounded-xl border flex items-start gap-2 text-[11px] ${
                isLight ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
              }`}>
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Free cancellation up to 2 hours before scheduled slot. Instant confirmation notification sent.</span>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center py-3 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span
                  className="text-xs font-extrabold tracking-widest uppercase block"
                  style={{ color: currentThemeConfig.primaryHex }}
                >
                  BOOKING CONFIRMED
                </span>
                <h3 className={`text-xl font-black mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  You're all set to look good!
                </h3>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Your appointment is saved. An instant SMS and confirmation receipt have been generated.
                </p>
              </div>

              <div
                className={`p-4 rounded-2xl border text-left text-xs space-y-2.5 shadow-md ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-slate-950 border-slate-800 text-slate-100'
                }`}
                style={{ borderColor: `${currentThemeConfig.primaryHex}50` }}
              >
                <div className={`flex items-center justify-between pb-2 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => confirmedBookingId && handleCopyTicket(confirmedBookingId)}
                    className="text-[11px] font-mono font-bold flex items-center gap-1.5 hover:underline"
                    style={{ color: currentThemeConfig.primaryHex }}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>TICKET #{confirmedBookingId}</span>
                    {copiedId && <span className="text-[10px] text-emerald-500 font-sans">(Copied!)</span>}
                  </button>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm">
                    CONFIRMED
                  </span>
                </div>

                <div>
                  <p className={`font-extrabold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedService?.name}</p>
                  <p className="font-bold text-xs" style={{ color: currentThemeConfig.primaryHex }}>
                    {salon.name}
                  </p>
                </div>

                <div className={`grid grid-cols-2 gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                  <div>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Date & Time</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{selectedDate} @ {selectedTimeSlot}</span>
                  </div>
                  <div>
                    <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Specialist</span>
                    <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {anyStaff ? 'Assigned Stylist' : selectedStaff?.name}
                    </span>
                  </div>
                </div>

                <div className={`pt-2 border-t flex items-center justify-between text-[11px] ${isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'}`}>
                  <span>Salon Phone: <strong className={isLight ? 'text-slate-900' : 'text-white'}>{salon.phone}</strong></span>
                  <a
                    href={`tel:${salon.phone}`}
                    className="font-bold underline"
                    style={{ color: currentThemeConfig.primaryHex }}
                  >
                    Call Studio
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`pt-3.5 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
          {currentStep === 5 ? (
            <button
              id="view-my-booking-pass-btn"
              type="button"
              onClick={handleFinishAndGoToBookings}
              className="w-full py-3 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
              style={{
                backgroundColor: currentThemeConfig.primaryHex,
                boxShadow: `0 4px 16px ${currentThemeConfig.glowHex}`,
              }}
            >
              <span>View in My Salon Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              {currentStep > 1 ? (
                <button
                  type="button"
                  id="booking-prev-step-btn"
                  onClick={handlePrevStep}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  id={`booking-next-step-${currentStep}`}
                  onClick={handleNextStep}
                  disabled={
                    (currentStep === 1 && !selectedService) ||
                    (currentStep === 3 &&
                      (!selectedTimeSlot ||
                        isSlotInPast(selectedDate, selectedTimeSlot) ||
                        totalVisibleSlots === 0))
                  }
                  className="px-6 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 14px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  <span>
                    {currentStep === 1
                      ? entryMode === 'stylist' && selectedStaff
                        ? 'Continue to Date & Time'
                        : 'Continue to Stylist'
                      : currentStep === 2
                      ? 'Continue to Date & Time'
                      : 'Review Booking'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  id="confirm-booking-final-btn"
                  onClick={handleConfirmBooking}
                  className="px-6 py-2.5 rounded-2xl text-white font-extrabold text-xs shadow-lg transition-all flex items-center gap-2 active:scale-95"
                  style={{
                    backgroundColor: currentThemeConfig.primaryHex,
                    boxShadow: `0 4px 16px ${currentThemeConfig.glowHex}`,
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t('booking.confirm', 'Confirm Appointment')} ({formatPrice(selectedService?.price || 0)})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
