import { Salon } from '../types';

export interface BookingSlotTime {
  timeStr: string;      // e.g. "09:30 AM"
  hour24: number;       // 9
  minute: number;       // 30
  formattedSlot: string; // "09:30 AM"
}

/**
 * Get current date and time parts in target timezone (default to user's system timezone if undefined)
 */
export const getNowInTargetTimezone = (targetTimeZone?: string): {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
  dateString: string; // YYYY-MM-DD
} => {
  const now = new Date();
  if (!targetTimeZone) {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return { year, month, date, hours, minutes, seconds, dateString };
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: targetTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string): number => {
      const p = parts.find(pt => pt.type === type);
      return p ? parseInt(p.value, 10) : 0;
    };
    const year = getPart('year');
    const month = getPart('month');
    const date = getPart('day');
    const hours = getPart('hour');
    const minutes = getPart('minute');
    const seconds = getPart('second');
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return { year, month, date, hours, minutes, seconds, dateString };
  } catch {
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return { year, month, date, hours, minutes, seconds, dateString };
  }
};

/**
 * Returns YYYY-MM-DD formatted date string in local or target timezone (never skewed UTC)
 */
export const getLocalDateString = (d: Date = new Date(), targetTimeZone?: string): string => {
  if (targetTimeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const parts = formatter.formatToParts(d);
      const year = parts.find(p => p.type === 'year')?.value;
      const month = parts.find(p => p.type === 'month')?.value;
      const day = parts.find(p => p.type === 'day')?.value;
      if (year && month && day) return `${year}-${month}-${day}`;
    } catch {
      // Fallback to local device calendar
    }
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses a standard 12-hour time slot (e.g. "09:30 AM", "4:15 PM") into 24-hour hour & minute numbers
 */
export const parseTimeSlot = (timeSlotStr: string): { hours: number; minutes: number } => {
  if (!timeSlotStr) return { hours: 0, minutes: 0 };
  const clean = timeSlotStr.trim().toUpperCase();
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
  if (!match) return { hours: 0, minutes: 0 };

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3];

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
};

/**
 * Validates if a booking slot is in the past for a given target date.
 * If targetTimeZone is provided, evaluates against current time in that timezone.
 */
export const isSlotInPast = (selectedDateStr: string, timeSlotStr: string, targetTimeZone?: string): boolean => {
  if (!selectedDateStr || !timeSlotStr) return false;

  const nowTz = getNowInTargetTimezone(targetTimeZone);
  const todayStr = nowTz.dateString;

  if (selectedDateStr < todayStr) {
    return true;
  }

  if (selectedDateStr === todayStr) {
    const slot = parseTimeSlot(timeSlotStr);
    const slotTotalMinutes = slot.hours * 60 + slot.minutes;
    const currentTotalMinutes = nowTz.hours * 60 + nowTz.minutes;
    // Buffer by 5 minutes
    return slotTotalMinutes <= currentTotalMinutes + 5;
  }

  return false;
};

/**
 * Checks if a time slot on a specific date is within the next N hours from now.
 */
export const isSlotWithinNextHours = (
  selectedDateStr: string,
  timeSlotStr: string,
  hoursWindow: number = 4,
  targetTimeZone?: string
): boolean => {
  if (!selectedDateStr || !timeSlotStr) return false;

  const nowTz = getNowInTargetTimezone(targetTimeZone);
  const todayStr = nowTz.dateString;

  if (selectedDateStr !== todayStr) return false;

  const slot = parseTimeSlot(timeSlotStr);
  const slotTotalMinutes = slot.hours * 60 + slot.minutes;
  const currentTotalMinutes = nowTz.hours * 60 + nowTz.minutes;

  const diffMinutes = slotTotalMinutes - currentTotalMinutes;
  return diffMinutes >= 0 && diffMinutes <= hoursWindow * 60;
};

/**
 * Finds the first valid upcoming slot from an array of slots for a given date.
 */
export const getFirstAvailableSlot = (
  dateStr: string,
  slots: string[],
  bookedSlots: string[] = [],
  targetTimeZone?: string
): string | null => {
  for (const slot of slots) {
    if (!bookedSlots.includes(slot) && !isSlotInPast(dateStr, slot, targetTimeZone)) {
      return slot;
    }
  }
  return null;
};
