export type AvailabilitySlot = { minute: number; available: boolean };

export function bookingTime(minute: number) {
  const hour = Math.floor(minute / 60);
  return `${hour % 12 || 12}:${String(minute % 60).padStart(2, '0')} ${hour < 12 ? 'AM' : 'PM'}`;
}

export function clockToMinute(hour?: string, minutes?: string, period?: string) {
  const h = Number(hour);
  const m = Number(minutes);
  if (!Number.isInteger(h) || h < 1 || h > 12 || !Number.isInteger(m) || m < 0 || m > 59 || (period !== 'AM' && period !== 'PM')) return null;
  return (h % 12 + (period === 'PM' ? 12 : 0)) * 60 + m;
}

export function isWorkingDay(date: Date, days: number[]) {
  return days.includes(date.getDay());
}

/** The clock accepts time ranges, while availability is expressed as 30-minute starts. */
export function unavailableIntervals(slots: AvailabilitySlot[]) {
  const available = new Set(slots.filter(slot => slot.available).map(slot => slot.minute));
  const intervals: string[] = [];
  let start: number | null = null;

  for (let minute = 0; minute <= 1440; minute += 30) {
    const unavailable = minute < 1440 && !available.has(minute);
    if (unavailable && start === null) start = minute;
    if (!unavailable && start !== null) {
      intervals.push(`${bookingTime(start)} - ${bookingTime(minute - 1)}`);
      start = null;
    }
  }

  return intervals;
}
