import { Salon, ServiceItem, WorkingDayHour, SpecialDateSchedule } from '../types';
import { isSlotInPast, getLocalDateString } from './dateTimeUtils';

export function format12Hour(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export interface SalonDayScheduleResult {
  isOpen: boolean;
  open: string;
  close: string;
  formattedOpen: string;
  formattedClose: string;
  isSpecial: boolean;
  specialTitle?: string;
  specialReason?: string;
  isClosedReason?: string;
}

export function getSalonScheduleForDate(
  dateStr: string,
  workingHours?: WorkingDayHour[],
  specialSchedules?: SpecialDateSchedule[],
  isOpenNowOverride?: boolean
): SalonDayScheduleResult {
  const todayStr = getLocalDateString(new Date());

  // If business owner explicitly shut down the shop (isOpenNow === false), close today immediately
  if (isOpenNowOverride === false && dateStr === todayStr) {
    return {
      isOpen: false,
      open: '09:00',
      close: '21:00',
      formattedOpen: '9:00 AM',
      formattedClose: '9:00 PM',
      isSpecial: false,
      isClosedReason: 'Shop Closed / Offline (Paused by Salon Owner)',
    };
  }

  // 1. Check special schedules override
  if (specialSchedules && specialSchedules.length > 0) {
    const special = specialSchedules.find(s => s.date === dateStr);
    if (special) {
      if (!special.isOpen) {
        return {
          isOpen: false,
          open: '09:00',
          close: '21:00',
          formattedOpen: '9:00 AM',
          formattedClose: '9:00 PM',
          isSpecial: true,
          specialTitle: special.title,
          specialReason: special.reason,
          isClosedReason: special.reason || special.title || 'Special Holiday Closure',
        };
      } else if (special.open && special.close) {
        return {
          isOpen: true,
          open: special.open,
          close: special.close,
          formattedOpen: format12Hour(special.open),
          formattedClose: format12Hour(special.close),
          isSpecial: true,
          specialTitle: special.title,
          specialReason: special.reason,
        };
      }
    }
  }

  // 2. Default working hours weekly schedule
  if (!workingHours || workingHours.length === 0) {
    return {
      isOpen: true,
      open: '09:00',
      close: '21:00',
      formattedOpen: '9:00 AM',
      formattedClose: '9:00 PM',
      isSpecial: false,
    };
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = daysOfWeek[targetDate.getDay()];

  const match = workingHours.find(wh => wh.day.toLowerCase() === dayName.toLowerCase());
  if (!match) {
    return {
      isOpen: true,
      open: '09:00',
      close: '21:00',
      formattedOpen: '9:00 AM',
      formattedClose: '9:00 PM',
      isSpecial: false,
    };
  }

  return {
    isOpen: match.isOpen,
    open: match.open || '09:00',
    close: match.close || '21:00',
    formattedOpen: format12Hour(match.open || '09:00'),
    formattedClose: format12Hour(match.close || '21:00'),
    isSpecial: false,
    isClosedReason: !match.isOpen ? `Store Closed on ${match.day}s` : undefined,
  };
}

export interface SlotPeriodGroup {
  period: 'Morning' | 'Afternoon' | 'Evening' | 'Night';
  timeRange: string;
  slots: string[];
}

export interface DaySlotsResult {
  schedule: SalonDayScheduleResult;
  allSlots: string[];
  allSlotGroups: SlotPeriodGroup[];
  visibleSlotGroups: SlotPeriodGroup[];
  totalAvailableSlots: number;
  hasAnyFutureSlots: boolean;
}

export function generateTimeSlotsForDate(
  dateStr: string,
  workingHours?: WorkingDayHour[],
  specialSchedules?: SpecialDateSchedule[],
  stepMinutes: number = 30,
  isOpenNowOverride?: boolean
): DaySlotsResult {
  const schedule = getSalonScheduleForDate(dateStr, workingHours, specialSchedules, isOpenNowOverride);

  if (!schedule.isOpen) {
    return {
      schedule,
      allSlots: [],
      allSlotGroups: [],
      visibleSlotGroups: [],
      totalAvailableSlots: 0,
      hasAnyFutureSlots: false,
    };
  }

  const [openH, openM] = (schedule.open || '09:00').split(':').map(n => parseInt(n, 10) || 0);
  const [closeH, closeM] = (schedule.close || '21:00').split(':').map(n => parseInt(n, 10) || 0);

  const openMin = openH * 60 + openM;
  let closeMin = closeH * 60 + closeM;
  if (closeMin <= openMin) {
    closeMin += 24 * 60; // Next day rollover (e.g., closing at 01:00 AM)
  }

  const morningSlots: string[] = [];
  const afternoonSlots: string[] = [];
  const eveningSlots: string[] = [];
  const nightSlots: string[] = [];

  for (let m = openMin; m < closeMin; m += stepMinutes) {
    const rawH = Math.floor(m / 60) % 24;
    const min = m % 60;
    const h12 = rawH % 12 === 0 ? 12 : rawH % 12;
    const ampm = rawH >= 12 ? 'PM' : 'AM';
    const slotStr = `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;

    if (rawH < 12) {
      morningSlots.push(slotStr);
    } else if (rawH < 17) {
      afternoonSlots.push(slotStr);
    } else if (rawH < 20) {
      eveningSlots.push(slotStr);
    } else {
      nightSlots.push(slotStr);
    }
  }

  const allSlotGroups: SlotPeriodGroup[] = [];

  const addGroup = (period: 'Morning' | 'Afternoon' | 'Evening' | 'Night', slots: string[]) => {
    if (slots.length === 0) return;
    const first = slots[0];
    const last = slots[slots.length - 1];
    allSlotGroups.push({
      period,
      timeRange: first === last ? first : `${first} - ${last}`,
      slots,
    });
  };

  addGroup('Morning', morningSlots);
  addGroup('Afternoon', afternoonSlots);
  addGroup('Evening', eveningSlots);
  addGroup('Night', nightSlots);

  const allSlots = allSlotGroups.flatMap(g => g.slots);

  // Filter out slots that have already passed if date is Today or in the past
  const visibleSlotGroups: SlotPeriodGroup[] = allSlotGroups
    .map(grp => {
      const futureSlots = grp.slots.filter(slot => !isSlotInPast(dateStr, slot));
      if (futureSlots.length === 0) return null;
      const first = futureSlots[0];
      const last = futureSlots[futureSlots.length - 1];
      return {
        period: grp.period,
        timeRange: first === last ? first : `${first} - ${last}`,
        slots: futureSlots,
      };
    })
    .filter((g): g is SlotPeriodGroup => g !== null);

  const totalAvailableSlots = visibleSlotGroups.reduce((acc, g) => acc + g.slots.length, 0);

  return {
    schedule,
    allSlots,
    allSlotGroups,
    visibleSlotGroups,
    totalAvailableSlots,
    hasAnyFutureSlots: totalAvailableSlots > 0,
  };
}

export interface LiveStatusResult {
  isOpen: boolean;
  statusText: string;
  badgeLabel: string;
  badgeClass: string;
  closingTimeFormatted?: string;
  openingTimeFormatted?: string;
}

export function computeSalonLiveStatus(
  workingHours?: WorkingDayHour[],
  specialSchedules?: SpecialDateSchedule[],
  isOpenNowOverride?: boolean
): LiveStatusResult {
  if (isOpenNowOverride === false) {
    return {
      isOpen: false,
      statusText: 'Shop Closed • Offline / Paused by Salon Owner',
      badgeLabel: 'Shop Closed',
      badgeClass: 'bg-rose-950/80 border border-rose-500/40 text-rose-300',
    };
  }

  const now = new Date();
  const todayYMD = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Check special holiday / custom date override
  if (specialSchedules && specialSchedules.length > 0) {
    const specialToday = specialSchedules.find(s => s.date === todayYMD);
    if (specialToday) {
      if (!specialToday.isOpen) {
        return {
          isOpen: false,
          statusText: `Closed Today • ${specialToday.title}`,
          badgeLabel: 'Holiday Closed',
          badgeClass: 'bg-rose-950/80 border border-rose-500/40 text-rose-300',
        };
      } else if (specialToday.open && specialToday.close) {
        const [openH, openM] = specialToday.open.split(':').map(n => parseInt(n, 10) || 0);
        const [closeH, closeM] = specialToday.close.split(':').map(n => parseInt(n, 10) || 0);
        const openMin = openH * 60 + openM;
        const closeMin = closeH * 60 + closeM;
        const formattedOpen = format12Hour(specialToday.open);
        const formattedClose = format12Hour(specialToday.close);

        if (currentMinutes < openMin) {
          return {
            isOpen: false,
            statusText: `Special Hours • Opens today at ${formattedOpen}`,
            badgeLabel: `Opens ${formattedOpen}`,
            badgeClass: 'bg-amber-950/80 border border-amber-500/40 text-amber-300',
            openingTimeFormatted: formattedOpen,
          };
        }
        if (currentMinutes >= openMin && currentMinutes < closeMin) {
          return {
            isOpen: true,
            statusText: `Special Hours • Closes ${formattedClose} (${specialToday.title})`,
            badgeLabel: 'Special Hours',
            badgeClass: 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300',
            closingTimeFormatted: formattedClose,
          };
        }
        return {
          isOpen: false,
          statusText: `Closed for today • ${specialToday.title}`,
          badgeLabel: 'Closed',
          badgeClass: 'bg-slate-900/90 border border-slate-700 text-slate-400',
        };
      }
    }
  }

  if (!workingHours || workingHours.length === 0) {
    return {
      isOpen: true,
      statusText: 'Open today',
      badgeLabel: 'Open',
      badgeClass: 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300',
    };
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = daysOfWeek[now.getDay()];

  const todaySchedule = workingHours.find(
    wh => wh.day.toLowerCase() === todayName.toLowerCase()
  );

  if (!todaySchedule || !todaySchedule.isOpen) {
    const todayIndex = now.getDay();
    let nextOpenSchedule: WorkingDayHour | undefined;
    let daysAhead = 1;
    for (let i = 1; i <= 7; i++) {
      const nextDayName = daysOfWeek[(todayIndex + i) % 7];
      const found = workingHours.find(wh => wh.day.toLowerCase() === nextDayName.toLowerCase() && wh.isOpen);
      if (found) {
        nextOpenSchedule = found;
        daysAhead = i;
        break;
      }
    }

    const nextDayLabel = daysAhead === 1 ? 'Tomorrow' : (nextOpenSchedule?.day || 'Soon');
    const openTime = nextOpenSchedule?.open ? format12Hour(nextOpenSchedule.open) : '9 AM';

    return {
      isOpen: false,
      statusText: `Closed today • Opens ${nextDayLabel} ${openTime}`,
      badgeLabel: 'Closed',
      badgeClass: 'bg-slate-900/90 border border-slate-700 text-slate-400',
    };
  }

  const [openH, openM] = todaySchedule.open.split(':').map(n => parseInt(n, 10) || 0);
  const [closeH, closeM] = todaySchedule.close.split(':').map(n => parseInt(n, 10) || 0);

  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  const formattedOpen = format12Hour(todaySchedule.open);
  const formattedClose = format12Hour(todaySchedule.close);

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: `Closed • Opens today at ${formattedOpen}`,
      badgeLabel: `Opens ${formattedOpen}`,
      badgeClass: 'bg-amber-950/80 border border-amber-500/40 text-amber-300',
      openingTimeFormatted: formattedOpen,
    };
  }

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    const minutesRemaining = closeMinutes - currentMinutes;
    if (minutesRemaining <= 45) {
      return {
        isOpen: true,
        statusText: `Closing soon • Closes ${formattedClose}`,
        badgeLabel: 'Closing Soon',
        badgeClass: 'bg-amber-900/80 border border-amber-400 text-amber-200 animate-pulse',
        closingTimeFormatted: formattedClose,
      };
    }

    return {
      isOpen: true,
      statusText: `Open now • Closes ${formattedClose}`,
      badgeLabel: 'Open now',
      badgeClass: 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300',
      closingTimeFormatted: formattedClose,
    };
  }

  return {
    isOpen: false,
    statusText: `Closed for today • Opens tomorrow`,
    badgeLabel: 'Closed',
    badgeClass: 'bg-slate-900/90 border border-slate-700 text-slate-400',
  };
}

export function getSalonStartingPrice(salon: Salon, services: ServiceItem[]): number {
  if (salon.startingPrice) return salon.startingPrice;
  const salonServices = services.filter(s => s.salonId === salon.id);
  if (salonServices.length === 0) return 30;
  return Math.min(...salonServices.map(s => s.price));
}

export function getSalonMapUrl(salon: {
  name: string;
  address: string;
  city?: string;
  mapUrl?: string;
  lat?: number;
  lng?: number;
}): string {
  if (salon.mapUrl && salon.mapUrl.trim().length > 0) {
    const trimmed = salon.mapUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  const query = `${salon.name}, ${salon.address}${salon.city ? ', ' + salon.city : ''}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function getCleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/[^\d+]/g, '');
}
