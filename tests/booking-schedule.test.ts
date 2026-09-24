import { describe, expect, it } from 'vitest';
import { bookingTime, clockToMinute, isWorkingDay, preferredBookingStart, unavailableHourIntervals } from '../app/lib/booking-schedule';

describe('booking schedule', () => {
  it('disables merchant off-days in the calendar', () => {
    expect(isWorkingDay(new Date(2030, 0, 6), [1, 2, 3, 4, 5, 6])).toBe(false);
    expect(isWorkingDay(new Date(2030, 0, 7), [1, 2, 3, 4, 5, 6])).toBe(true);
  });

  it('dims only hours without any available start', () => {
    expect(unavailableHourIntervals([
      { minute: 600, available: true },
      { minute: 630, available: false },
      { minute: 660, available: true },
    ])).toEqual(['12:00 AM - 9:59 AM', '12:00 PM - 11:59 PM']);
  });

  it('blocks the full clock when no appointments are available', () => {
    expect(unavailableHourIntervals([])).toEqual(['12:00 AM - 11:59 PM']);
  });

  it('shows 12-hour times and converts AM/PM selections to booking minutes', () => {
    expect(bookingTime(0)).toBe('12:00 AM');
    expect(bookingTime(720)).toBe('12:00 PM');
    expect(bookingTime(810)).toBe('1:30 PM');
    expect(clockToMinute('12', '00', 'AM')).toBe(0);
    expect(clockToMinute('12', '00', 'PM')).toBe(720);
    expect(clockToMinute('1', '30', 'PM')).toBe(810);
    expect(clockToMinute('1', '30')).toBeNull();
  });

  it('opens at 2 PM when possible and otherwise uses the closest available start', () => {
    expect(preferredBookingStart([{ minute: 600, available: true }, { minute: 840, available: true }])?.minute).toBe(840);
    expect(preferredBookingStart([{ minute: 600, available: true }, { minute: 780, available: true }])?.minute).toBe(780);
    expect(preferredBookingStart([{ minute: 840, available: false }, { minute: 870, available: true }])?.minute).toBe(870);
  });
});
