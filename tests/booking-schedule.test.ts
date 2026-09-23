import { describe, expect, it } from 'vitest';
import { bookingTime, clockToMinute, isWorkingDay, unavailableIntervals } from '../app/lib/booking-schedule';

describe('booking schedule', () => {
  it('disables merchant off-days in the calendar', () => {
    expect(isWorkingDay(new Date(2030, 0, 6), [1, 2, 3, 4, 5, 6])).toBe(false);
    expect(isWorkingDay(new Date(2030, 0, 7), [1, 2, 3, 4, 5, 6])).toBe(true);
  });

  it('blocks all times except available 30-minute starts', () => {
    expect(unavailableIntervals([
      { minute: 600, available: true },
      { minute: 630, available: false },
      { minute: 660, available: true },
    ])).toEqual(['12:00 AM - 9:59 AM', '10:30 AM - 10:59 AM', '11:30 AM - 11:59 PM']);
  });

  it('blocks the full clock when no appointments are available', () => {
    expect(unavailableIntervals([])).toEqual(['12:00 AM - 11:59 PM']);
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
});
