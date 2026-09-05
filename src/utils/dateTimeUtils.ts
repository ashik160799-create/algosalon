import { Salon } from '../types';

export const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const TIMEZONE_REGISTRY: Record<string, { timeZone: string; label: string; offsetLabel: string }> = {
  AE: { timeZone: 'Asia/Dubai', label: 'Gulf Standard Time (GST)', offsetLabel: 'UTC+4' },
  SA: { timeZone: 'Asia/Riyadh', label: 'Arabia Standard Time (AST)', offsetLabel: 'UTC+3' },
  QA: { timeZone: 'Asia/Qatar', label: 'Arabia Standard Time (AST)', offsetLabel: 'UTC+3' },
  KW: { timeZone: 'Asia/Kuwait', label: 'Arabia Standard Time (AST)', offsetLabel: 'UTC+3' },
  OM: { timeZone: 'Asia/Muscat', label: 'Gulf Standard Time (GST)', offsetLabel: 'UTC+4' },
  BH: { timeZone: 'Asia/Bahrain', label: 'Arabia Standard Time (AST)', offsetLabel: 'UTC+3' },
  IN: { timeZone: 'Asia/Kolkata', label: 'India Standard Time (IST)', offsetLabel: 'UTC+5:30' },
  US: { timeZone: 'America/New_York', label: 'Eastern Daylight Time (EDT)', offsetLabel: 'UTC-4' },
  GB: { timeZone: 'Europe/London', label: 'British Summer Time (BST)', offsetLabel: 'UTC+1' },
  CA: { timeZone: 'America/Toronto', label: 'Eastern Daylight Time (EDT)', offsetLabel: 'UTC-4' },
  AU: { timeZone: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)', offsetLabel: 'UTC+10' },
  SG: { timeZone: 'Asia/Singapore', label: 'Singapore Time (SGT)', offsetLabel: 'UTC+8' },
  MY: { timeZone: 'Asia/Kuala_Lumpur', label: 'Malaysia Time (MYT)', offsetLabel: 'UTC+8' },
  EG: { timeZone: 'Africa/Cairo', label: 'Eastern European Time (EET)', offsetLabel: 'UTC+2' },
  PK: { timeZone: 'Asia/Karachi', label: 'Pakistan Standard Time (PKT)', offsetLabel: 'UTC+5' },
  DE: { timeZone: 'Europe/Berlin', label: 'Central European Time (CEST)', offsetLabel: 'UTC+2' },
  FR: { timeZone: 'Europe/Paris', label: 'Central European Time (CEST)', offsetLabel: 'UTC+2' },
  IT: { timeZone: 'Europe/Rome', label: 'Central European Time (CEST)', offsetLabel: 'UTC+2' },
  ES: { timeZone: 'Europe/Madrid', label: 'Central European Time (CEST)', offsetLabel: 'UTC+2' },
  JP: { timeZone: 'Asia/Tokyo', label: 'Japan Standard Time (JST)', offsetLabel: 'UTC+9' },
};

export function getSalonTimezone(salon?: Salon | { address?: string; city?: string } | null): {
  timeZone: string;
  label: string;
  code: string;
} {
  if (!salon) {
    return { timeZone: 'Asia/Dubai', label: 'GST (UTC+4)', code: 'GST' };
  }

  const text = `${salon.city || ''} ${salon.address || ''}`.toLowerCase();

  if (text.includes('london') || text.includes('mercer road') || text.includes('uk')) {
    return { timeZone: 'Europe/London', label: 'BST / GMT (London)', code: 'BST' };
  }
  if (text.includes('los angeles') || text.includes('pinecrest') || text.includes('ca')) {
    return { timeZone: 'America/Los_Angeles', label: 'PDT / PST (Los Angeles)', code: 'PDT' };
  }
  if (text.includes('new york') || text.includes('lexington') || text.includes('ny')) {
    return { timeZone: 'America/New_York', label: 'EDT / EST (New York)', code: 'EDT' };
  }
  if (text.includes('mumbai') || text.includes('delhi') || text.includes('india') || text.includes('bandra')) {
    return { timeZone: 'Asia/Kolkata', label: 'IST (India)', code: 'IST' };
  }
  if (text.includes('riyadh') || text.includes('saudi') || text.includes('olaya')) {
    return { timeZone: 'Asia/Riyadh', label: 'AST (Riyadh)', code: 'AST' };
  }

  return { timeZone: 'Asia/Dubai', label: 'GST (Dubai • UTC+4)', code: 'GST' };
}

export function getCustomerTimezone(countryCode?: string): {
  timeZone: string;
  label: string;
  code: string;
} {
  let detectedTz = 'Asia/Dubai';
  try {
    if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) detectedTz = tz;
    }
  } catch (e) {
  }

  if (countryCode && TIMEZONE_REGISTRY[countryCode]) {
    const reg = TIMEZONE_REGISTRY[countryCode];
    return {
      timeZone: reg.timeZone,
      label: `${reg.label} (${reg.offsetLabel})`,
      code: reg.timeZone.split('/')[1]?.replace('_', ' ') || countryCode,
    };
  }

  const shortCode = detectedTz.split('/').pop()?.replace('_', ' ') || 'Local';
  return {
    timeZone: detectedTz,
    label: `${shortCode} (${detectedTz})`,
    code: shortCode,
  };
}

export function parseTimeSlotHoursMinutes(timeSlotStr: string): { hour: number; minute: number } {
  if (!timeSlotStr) return { hour: 12, minute: 0 };
  const clean = timeSlotStr.trim().toUpperCase();
  const isPM = clean.includes('PM');
  const isAM = clean.includes('AM');
  const match = clean.match(/(\d{1,2}):(\d{2})/);
  if (!match) return { hour: 12, minute: 0 };
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  if (isPM && hour < 12) hour += 12;
  if (isAM && hour === 12) hour = 0;
  return { hour, minute };
}

export function parseAppointmentDateTime(dateStr: string, timeSlotStr: string): Date {
  if (!dateStr) return new Date();
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0], 10) || new Date().getFullYear();
  const month = (parseInt(dateParts[1], 10) || 1) - 1;
  const day = parseInt(dateParts[2], 10) || 1;
  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);
  return new Date(year, month, day, hour, minute, 0);
}

export function formatBookingDateTime(
  dateStr: string,
  timeSlotStr: string,
  targetTimeZone?: string
): string {
  if (!dateStr) return '';
  const dateObj = parseAppointmentDateTime(dateStr, timeSlotStr);

  if (targetTimeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimeZone,
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const parts = formatter.formatToParts(dateObj);
      let day = '';
      let mon = '';
      let year = '';
      let hour = '';
      let minute = '';
      let dayPeriod = 'AM';

      for (const part of parts) {
        if (part.type === 'day') day = part.value.padStart(2, '0');
        if (part.type === 'month') mon = part.value;
        if (part.type === 'year') year = part.value;
        if (part.type === 'hour') hour = part.value.padStart(2, '0');
        if (part.type === 'minute') minute = part.value.padStart(2, '0');
        if (part.type === 'dayPeriod') dayPeriod = part.value.toUpperCase();
      }

      const sanitizedMon = mon.slice(0, 3);
      return `${day}_${sanitizedMon}_${year}__${hour}:${minute}${dayPeriod}`;
    } catch (e) {
    }
  }

  const day = String(dateObj.getDate()).padStart(2, '0');
  const mon = MONTH_NAMES_SHORT[dateObj.getMonth()] || 'Jan';
  const year = String(dateObj.getFullYear());

  let rawH = dateObj.getHours();
  const m = String(dateObj.getMinutes()).padStart(2, '0');
  const ampm = rawH >= 12 ? 'PM' : 'AM';
  rawH = rawH % 12;
  if (rawH === 0) rawH = 12;
  const h = String(rawH).padStart(2, '0');

  return `${day}_${mon}_${year}__${h}:${m}${ampm}`;
}

export interface DualTimezoneResult {
  standardFormatted: string;
  customerFormatted: string;
  salonFormatted: string;
  customerTzLabel: string;
  salonTzLabel: string;
  customerTzCode: string;
  salonTzCode: string;
  isSameTimezone: boolean;
  isPast: boolean;
}

export function getDualBookingTime(
  dateStr: string,
  timeSlotStr: string,
  salon?: Salon | { address?: string; city?: string } | null,
  customerCountryCode?: string
): DualTimezoneResult {
  const salonTz = getSalonTimezone(salon);
  const customerTz = getCustomerTimezone(customerCountryCode);

  const salonFormatted = formatBookingDateTime(dateStr, timeSlotStr, salonTz.timeZone);
  const customerFormatted = formatBookingDateTime(dateStr, timeSlotStr, customerTz.timeZone);
  const standardFormatted = formatBookingDateTime(dateStr, timeSlotStr);

  const isSameTimezone =
    salonTz.timeZone === customerTz.timeZone || salonFormatted === customerFormatted;

  const isPast = isPastDateTime(dateStr, timeSlotStr);

  return {
    standardFormatted,
    customerFormatted,
    salonFormatted,
    customerTzLabel: `Customer Time • ${customerTz.code}`,
    salonTzLabel: `Salon Time • ${salonTz.code}`,
    customerTzCode: customerTz.code,
    salonTzCode: salonTz.code,
    isSameTimezone,
    isPast,
  };
}

export function getLocalDateString(d: Date = new Date()): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isPastDateTime(dateStr: string, timeSlotStr?: string): boolean {
  if (!dateStr) return false;
  const now = new Date();
  const appointmentDate = parseAppointmentDateTime(dateStr, timeSlotStr || '11:59 PM');
  return appointmentDate.getTime() < now.getTime();
}

export function isSlotInPast(dateStr: string, timeSlotStr: string): boolean {
  if (!dateStr || !timeSlotStr) return false;
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);
  const slotMinutes = hour * 60 + minute;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slotMinutes <= currentMinutes;
}

export function isSlotWithinNextHours(dateStr: string, timeSlotStr: string, hours = 4): boolean {
  if (!dateStr || !timeSlotStr) return false;
  const now = new Date();
  const todayStr = getLocalDateString(now);

  if (dateStr !== todayStr) return false;

  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);
  const slotMinutes = hour * 60 + minute;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return slotMinutes >= currentMinutes && slotMinutes <= currentMinutes + hours * 60;
}

export function getFirstAvailableSlot(
  dateStr: string,
  allSlots: string[],
  fallback = '11:00 AM'
): string {
  const available = allSlots.filter(slot => !isSlotInPast(dateStr, slot));
  if (available.length > 0) return available[0];
  return allSlots[0] || fallback;
}
