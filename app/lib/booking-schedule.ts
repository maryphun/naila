export type AvailabilitySlot = { minute: number; available: boolean };

export function preferredBookingStart(slots: AvailabilitySlot[], preferredMinute = 14 * 60) {
  return slots.filter(slot => slot.available).reduce<AvailabilitySlot | null>((nearest, slot) =>
    !nearest || Math.abs(slot.minute - preferredMinute) < Math.abs(nearest.minute - preferredMinute) ? slot : nearest, null);
}

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

/** The hour dial is disabled only when an entire hour has no bookable starts. */
export function unavailableHourIntervals(slots: AvailabilitySlot[]) {
  const availableHours = new Set(slots.filter(slot => slot.available).map(slot => Math.floor(slot.minute / 60)));
  const intervals: string[] = [];
  let start: number | null = null;

  for (let hour = 0; hour <= 24; hour++) {
    const unavailable = hour < 24 && !availableHours.has(hour);
    if (unavailable && start === null) start = hour;
    if (!unavailable && start !== null) {
      intervals.push(`${bookingTime(start * 60)} - ${bookingTime(hour * 60 - 1)}`);
      start = null;
    }
  }

  return intervals;
}
