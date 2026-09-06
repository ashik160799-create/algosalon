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

export function getSalonTimezone(salon?: Salon | { address?: string; city?: string; timezone?: string } | null): {
  timeZone: string;
  label: string;
  code: string;
} {
  if (!salon) {
    return { timeZone: 'Asia/Dubai', label: 'GST (Dubai • UTC+4)', code: 'GST' };
  }

  // 1. Authoritative: Use explicit database salon.timezone if present
  if (salon.timezone && typeof salon.timezone === 'string') {
    const tz = salon.timezone.trim();
    const matched = Object.values(TIMEZONE_REGISTRY).find(r => r.timeZone.toLowerCase() === tz.toLowerCase());
    if (matched) {
      return {
        timeZone: matched.timeZone,
        label: `${matched.label} (${matched.offsetLabel})`,
        code: matched.timeZone.split('/').pop()?.replace('_', ' ') || 'GST',
      };
    }
    const shortCode = tz.split('/').pop()?.replace('_', ' ') || tz;
    return {
      timeZone: tz,
      label: `${shortCode} (${tz})`,
      code: shortCode,
    };
  }

  // 2. Fallback to address/city heuristic
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

/**
 * Authoritative converter: Converts salon-local date and time into an exact single UTC instant Date.
 * Works seamlessly across all timezones without browser/client timezone skew.
 */
export function salonTimeToUtcInstant(
  dateStr: string,
  timeSlotStr: string,
  salonTimeZone: string = 'Asia/Dubai'
): Date {
  if (!dateStr) return new Date();
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0], 10) || new Date().getFullYear();
  const month = parseInt(dateParts[1], 10) || 1;
  const day = parseInt(dateParts[2], 10) || 1;
  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);

  let guessTime = Date.UTC(year, month - 1, day, hour, minute, 0);

  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: salonTimeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    const getParts = (t: number) => {
      const parts = dtf.formatToParts(new Date(t));
      let y = 0, m = 0, d = 0, h = 0, min = 0, s = 0;
      for (const p of parts) {
        if (p.type === 'year') y = parseInt(p.value, 10);
        if (p.type === 'month') m = parseInt(p.value, 10);
        if (p.type === 'day') d = parseInt(p.value, 10);
        if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
        if (p.type === 'minute') min = parseInt(p.value, 10);
        if (p.type === 'second') s = parseInt(p.value, 10);
      }
      return Date.UTC(y, m - 1, d, h, min, s);
    };

    const formattedAtGuess = getParts(guessTime);
    const targetLocalUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const diff = formattedAtGuess - targetLocalUtc;
    guessTime = guessTime - diff;

    const secondCheck = getParts(guessTime);
    if (secondCheck !== targetLocalUtc) {
      guessTime = guessTime - (secondCheck - targetLocalUtc);
    }
    return new Date(guessTime);
  } catch {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  }
}

/**
 * Formats an authoritative UTC instant into standard display format for a target timezone.
 */
export function formatUtcInstantDisplay(
  utcDate: Date,
  targetTimeZone?: string
): string {
  if (!utcDate || isNaN(utcDate.getTime())) return '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimeZone || 'Asia/Dubai',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const parts = formatter.formatToParts(utcDate);
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
  } catch {
    const d = new Date(utcDate);
    const day = String(d.getUTCDate()).padStart(2, '0');
    const mon = MONTH_NAMES_SHORT[d.getUTCMonth()] || 'Jan';
    const year = String(d.getUTCFullYear());
    let rawH = d.getUTCHours();
    const m = String(d.getUTCMinutes()).padStart(2, '0');
    const ampm = rawH >= 12 ? 'PM' : 'AM';
    rawH = rawH % 12;
    if (rawH === 0) rawH = 12;
    const h = String(rawH).padStart(2, '0');
    return `${day}_${mon}_${year}__${h}:${m}${ampm}`;
  }
}

export function formatBookingDateTime(
  dateStr: string,
  timeSlotStr: string,
  targetTimeZone?: string
): string {
  if (!dateStr) return '';
  const utcInstant = salonTimeToUtcInstant(dateStr, timeSlotStr, targetTimeZone || 'Asia/Dubai');
  return formatUtcInstantDisplay(utcInstant, targetTimeZone);
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
  utcInstant: Date;
}

export function getDualBookingTime(
  dateStr: string,
  timeSlotStr: string,
  salon?: Salon | { address?: string; city?: string; timezone?: string } | null,
  customerCountryCode?: string
): DualTimezoneResult {
  const salonTz = getSalonTimezone(salon);
  const customerTz = getCustomerTimezone(customerCountryCode);

  // Authoritative: Convert selected Salon Date & Time into single UTC instant
  const utcInstant = salonTimeToUtcInstant(dateStr, timeSlotStr, salonTz.timeZone);

  const salonFormatted = formatUtcInstantDisplay(utcInstant, salonTz.timeZone);
  const customerFormatted = formatUtcInstantDisplay(utcInstant, customerTz.timeZone);
  const standardFormatted = salonFormatted;

  const isSameTimezone =
    salonTz.timeZone === customerTz.timeZone || salonFormatted === customerFormatted;

  const now = new Date();
  const isPast = utcInstant.getTime() < now.getTime();

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
    utcInstant,
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

export function getNowInTargetTimezone(targetTimeZone?: string): { todayStr: string; currentMinutes: number } {
  const now = new Date();
  if (!targetTimeZone) {
    return {
      todayStr: getLocalDateString(now),
      currentMinutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    let year = '', month = '', day = '', hour = 0, minute = 0;
    for (const part of parts) {
      if (part.type === 'year') year = part.value;
      if (part.type === 'month') month = part.value;
      if (part.type === 'day') day = part.value;
      if (part.type === 'hour') hour = parseInt(part.value, 10);
      if (part.type === 'minute') minute = parseInt(part.value, 10);
    }
    return {
      todayStr: `${year}-${month}-${day}`,
      currentMinutes: (hour % 24) * 60 + minute,
    };
  } catch {
    return {
      todayStr: getLocalDateString(now),
      currentMinutes: now.getHours() * 60 + now.getMinutes(),
    };
  }
}

export function isSlotInPast(dateStr: string, timeSlotStr: string, targetTimeZone?: string): boolean {
  if (!dateStr || !timeSlotStr) return false;
  const { todayStr, currentMinutes } = getNowInTargetTimezone(targetTimeZone);

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);
  const slotMinutes = hour * 60 + minute;

  return slotMinutes <= currentMinutes;
}

export function isSlotWithinNextHours(dateStr: string, timeSlotStr: string, hours = 4, targetTimeZone?: string): boolean {
  if (!dateStr || !timeSlotStr) return false;
  const { todayStr, currentMinutes } = getNowInTargetTimezone(targetTimeZone);

  if (dateStr !== todayStr) return false;

  const { hour, minute } = parseTimeSlotHoursMinutes(timeSlotStr);
  const slotMinutes = hour * 60 + minute;

  return slotMinutes >= currentMinutes && slotMinutes <= currentMinutes + hours * 60;
}

export function getFirstAvailableSlot(
  dateStr: string,
  allSlots: string[],
  fallback = '11:00 AM',
  targetTimeZone?: string
): string {
  const available = allSlots.filter(slot => !isSlotInPast(dateStr, slot, targetTimeZone));
  if (available.length > 0) return available[0];
  return allSlots[0] || fallback;
}

/**
 * Formats an ISO string or date into a human-friendly relative time label
 * e.g. "Just now", "5m ago", "2h ago", "Yesterday", "3d ago", "2w ago"
 */
export function formatTimeAgo(dateOrIso?: string): string {
  if (!dateOrIso) return 'Just now';
  if (dateOrIso === 'Just now') return 'Just now';

  try {
    const d = new Date(dateOrIso);
    if (isNaN(d.getTime())) return dateOrIso;

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    if (diffMs < 0) return 'Just now';

    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return 'Just now';

    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 4) return `${diffWeeks}w ago`;

    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return dateOrIso;
  }
}
