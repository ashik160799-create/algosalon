import { Salon, WorkingDayHour } from '../types';
import { getNowInTargetTimezone } from './dateTimeUtils';

/**
 * Maps salon address/city to IANA timezone identifier
 */
export const getSalonTimezone = (salonOrLocation?: Salon | { address?: string; city?: string } | string | null): string => {
  if (!salonOrLocation) return 'Asia/Dubai';
  const text = (typeof salonOrLocation === 'string' ? salonOrLocation : `${salonOrLocation.address || ''} ${salonOrLocation.city || ''}`).toLowerCase();

  if (text.includes('saudi') || text.includes('riyadh') || text.includes('jeddah') || text.includes('dammam')) return 'Asia/Riyadh';
  if (text.includes('qatar') || text.includes('doha')) return 'Asia/Qatar';
  if (text.includes('kuwait')) return 'Asia/Kuwait';
  if (text.includes('bahrain') || text.includes('manama')) return 'Asia/Bahrain';
  if (text.includes('oman') || text.includes('muscat')) return 'Asia/Muscat';
  if (text.includes('london') || text.includes('uk') || text.includes('united kingdom')) return 'Europe/London';
  if (text.includes('paris') || text.includes('france')) return 'Europe/Paris';
  if (text.includes('berlin') || text.includes('germany')) return 'Europe/Berlin';
  if (text.includes('tokyo') || text.includes('japan')) return 'Asia/Tokyo';
  if (text.includes('seoul') || text.includes('korea')) return 'Asia/Seoul';
  if (text.includes('mumbai') || text.includes('delhi') || text.includes('india') || text.includes('bangalore')) return 'Asia/Kolkata';
  if (text.includes('karachi') || text.includes('lahore') || text.includes('pakistan')) return 'Asia/Karachi';
  if (text.includes('dhaka') || text.includes('bangladesh')) return 'Asia/Dhaka';
  if (text.includes('singapore')) return 'Asia/Singapore';
  if (text.includes('new york') || text.includes('ny') || text.includes('usa')) return 'America/New_York';
  if (text.includes('toronto') || text.includes('canada')) return 'America/Toronto';
  if (text.includes('sydney') || text.includes('australia')) return 'Australia/Sydney';

  return 'Asia/Dubai';
};

/**
 * Formats a 24h or 12h time string to standard clean 12-hour format e.g. "09:00 AM", "10:30 PM"
 */
export const format12Hour = (timeStr?: string): string => {
  if (!timeStr) return '';
  const clean = timeStr.trim();
  if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
    return clean;
  }
  const parts = clean.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, '0');
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${meridiem}`;
};

/**
 * Computes live open/closed status for a salon based on its business hours and local timezone.
 */
export const computeSalonLiveStatus = (
  openingTime?: string,
  closingTime?: string,
  daysSchedule?: WorkingDayHour[],
  isOpenNowOverride?: boolean,
  salonOrTimezone?: Salon | { address?: string; city?: string } | string | null
): {
  isOpen: boolean;
  statusText: string;
  badgeColor: string;
  nextChangeText: string;
} => {
  if (isOpenNowOverride === false) {
    return {
      isOpen: false,
      statusText: 'Closed Currently',
      badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      nextChangeText: 'Opens tomorrow',
    };
  }

  const targetTimezone = typeof salonOrTimezone === 'string' && salonOrTimezone.includes('/')
    ? salonOrTimezone
    : getSalonTimezone(salonOrTimezone);

  const nowTz = getNowInTargetTimezone(targetTimezone);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDayName = daysOfWeek[new Date(nowTz.year, nowTz.month - 1, nowTz.date).getDay()];

  let openStr = openingTime || '09:00 AM';
  let closeStr = closingTime || '10:00 PM';

  if (daysSchedule && daysSchedule.length > 0) {
    const todaySched = daysSchedule.find(d => d.day.toLowerCase() === currentDayName.toLowerCase());
    if (todaySched) {
      if (todaySched.isClosed) {
        return {
          isOpen: false,
          statusText: 'Closed Today',
          badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
          nextChangeText: 'Opens on next scheduled day',
        };
      }
      openStr = todaySched.open || openStr;
      closeStr = todaySched.close || closeStr;
    }
  }

  const parseToMinutes = (tStr: string): number => {
    const clean = tStr.trim().toUpperCase();
    const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const meridiem = match[3];
    if (meridiem === 'PM' && h < 12) h += 12;
    if (meridiem === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  const openMins = parseToMinutes(openStr);
  const closeMins = parseToMinutes(closeStr);
  const currentMins = nowTz.hours * 60 + nowTz.minutes;

  const isOpen = currentMins >= openMins && currentMins < closeMins;

  if (isOpen) {
    const remainingMins = closeMins - currentMins;
    if (remainingMins <= 60) {
      return {
        isOpen: true,
        statusText: `Closing Soon (${remainingMins}m)`,
        badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
        nextChangeText: `Closes at ${format12Hour(closeStr)}`,
      };
    }
    return {
      isOpen: true,
      statusText: 'Open Now',
      badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      nextChangeText: `Closes at ${format12Hour(closeStr)}`,
    };
  } else {
    return {
      isOpen: false,
      statusText: 'Closed',
      badgeColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
      nextChangeText: `Opens at ${format12Hour(openStr)}`,
    };
  }
};

/**
 * Returns Google Maps directions URL for a salon
 */
export const getSalonMapUrl = (salon: Salon): string => {
  if (salon.latitude && salon.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`;
  }
  const query = encodeURIComponent(`${salon.name}, ${salon.address}, ${salon.city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};
