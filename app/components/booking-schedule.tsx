import { useEffect, useRef, useState } from 'react';
import { Calendar, type ISODateString } from '@astryxdesign/core/Calendar';
import { ArrowRight, CalendarDays, Check, Clock3 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { friendlyDate, localDate, money, type Language } from '../lib/types';
import { bookingTime, clockToMinute, isWorkingDay, unavailableIntervals, type AvailabilitySlot } from '../lib/booking-schedule';
import { ErrorNotice, Loading } from './ui';

export type BookingTimeSelection = { date: string; minute: number };

function ClockPopup({ date, slots, lang, onSelect, onClose, onError }: {
  date: string;
  slots: AvailabilitySlot[];
  lang: Language;
  onSelect: (minute: number) => void;
  onClose: () => void;
  onError: (message: string) => void;
}) {
  const host = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    let picker: import('timepicker-ui').TimepickerUI | undefined;
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.tabIndex = -1;
    input.className = 'booking-clock-anchor';
    input.setAttribute('aria-label', lang === 'zh' ? '预约开始时间' : 'Appointment start time');
    input.value = bookingTime(slots.find(slot => slot.available)!.minute);
    host.current?.appendChild(input);

    import('timepicker-ui').then(({ TimepickerUI }) => {
      if (!active || !host.current) return;
      picker = new TimepickerUI(input, {
        clock: {
          type: '12h',
          incrementMinutes: 30,
          disabledTime: { interval: unavailableIntervals(slots) },
        },
        ui: { mode: 'clock', theme: 'basic', cssClass: 'hotlah-booking-clock', editable: false },
        labels: {
          ok: lang === 'zh' ? '选择时间' : 'Choose time',
          cancel: lang === 'zh' ? '取消' : 'Cancel',
          time: lang === 'zh' ? '选择开始时间' : 'Choose a start time',
          mobileTime: lang === 'zh' ? '选择开始时间' : 'Choose a start time',
        },
        callbacks: {
          onCancel: onClose,
          onConfirm: ({ hour, minutes, type }) => {
            const minute = clockToMinute(hour, minutes, type);
            if (minute === null || !slots.some(slot => slot.minute === minute && slot.available)) {
              onError(lang === 'zh' ? '此时间无法预约，请选择未变灰的时间。' : 'That time is unavailable. Choose a time that is not dimmed.');
              onClose();
              return;
            }
            onSelect(minute);
            onClose();
          },
        },
      });
      picker.create();
      picker.open();
    }).catch(() => {
      if (active) {
        onError(lang === 'zh' ? '无法打开时间选择器，请重试。' : 'The time picker could not open. Please try again.');
        onClose();
      }
    });

    return () => {
      active = false;
      picker?.destroy();
      host.current?.replaceChildren();
    };
  }, [date, slots, lang, onSelect, onClose, onError]);

  return <section ref={host} className="booking-clock-host" aria-label={friendlyDate(date, lang)} />;
}

export function BookingSchedule({ serviceId, workingDays, price, lang, selection, onSelectionChange, onRequest }: {
  serviceId: string;
  workingDays: number[];
  price: number;
  lang: Language;
  selection: BookingTimeSelection | null;
  onSelectionChange: (selection: BookingTimeSelection | null) => void;
  onRequest: () => void;
}) {
  const [date, setDate] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clockOpen, setClockOpen] = useState(false);
  const today = localDate();
  const lastDate = localDate(89);
  const openSlots = slots.filter(slot => slot.available);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSlots([]);
    apiRequest<{ slots: AvailabilitySlot[] }>(`/api/services/${serviceId}/availability?date=${date}`, { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        setSlots(result.slots);
        setClockOpen(result.slots.some(slot => slot.available));
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [date, revision, serviceId]);

  const chooseDate = (value: ISODateString) => {
    setDate(value);
    setClockOpen(false);
    setSlots([]);
    setError('');
    onSelectionChange(null);
    setRevision(current => current + 1);
  };

  return <section className="availability-panel" aria-labelledby="booking-schedule-title">
    <header className="schedule-heading">
      <strong className="schedule-step">01</strong>
      <h2 id="booking-schedule-title">{lang === 'zh' ? '选择预约日期' : 'Choose your day'}</h2>
      <CalendarDays aria-hidden="true" size={23} />
    </header>
    <p className="schedule-intro">{lang === 'zh' ? '先选日期，再从时钟中挑选可预约的开始时间。' : 'Pick a day first, then choose an available start time on the clock.'}</p>
    <Calendar
      mode="single"
      min={today as ISODateString}
      max={lastDate as ISODateString}
      dateConstraints={[day => isWorkingDay(day, workingDays)]}
      value={date as ISODateString | undefined}
      onChange={value => chooseDate(value as ISODateString)}
      weekStartsOn="mon"
      hasOutsideDays={false}
    />
    <p className="schedule-key">{lang === 'zh' ? '变灰的日期是美甲师休息日，或不在预约期限内。' : 'Dimmed dates are studio days off or outside the booking window.'}</p>
    {date && <section className="schedule-time-stage" aria-live="polite">
      <header className="schedule-heading schedule-heading-secondary">
        <strong className="schedule-step">02</strong>
        <h3>{lang === 'zh' ? '选择开始时间' : 'Choose a start time'}</h3>
        <Clock3 aria-hidden="true" size={21} />
      </header>
      <p className="schedule-chosen-date">{friendlyDate(date, lang)} · {lang === 'zh' ? '马来西亚时间' : 'Malaysia time'}</p>
      {loading ? <Loading /> : error ? <ErrorNotice message={error} retry={() => setRevision(current => current + 1)} /> : openSlots.length ? <button className="schedule-clock-trigger" type="button" onClick={() => setClockOpen(true)}>
        <Clock3 aria-hidden="true" size={23} />
        <strong>{selection?.date === date ? bookingTime(selection.minute) : lang === 'zh' ? '打开时钟选时间' : 'Open clock to pick a time'}</strong>
        <small>{lang === 'zh' ? `${openSlots.length} 个时段可预约` : `${openSlots.length} times available`}</small>
      </button> : <p className="schedule-unavailable">{lang === 'zh' ? '这一天没有可预约的时间，请选其他日期。' : 'No times are available on this day. Choose another date.'}</p>}
      {clockOpen && !loading && openSlots.length > 0 && <ClockPopup
        date={date}
        slots={slots}
        lang={lang}
        onSelect={minute => onSelectionChange({ date, minute })}
        onClose={() => setClockOpen(false)}
        onError={setError}
      />}
    </section>}
    <p className="schedule-promise"><Check aria-hidden="true" size={17} />{lang === 'zh' ? '预约当天付款' : 'Pay at your appointment'}</p>
    <p className="small muted">{lang === 'zh' ? '美甲师将确认您的预约。您可在预约页面取消。' : 'Your nailist will confirm the request. You can cancel from your booking.'}</p>
    <footer className="booking-cta">
      <p className="schedule-total"><strong>{money(price)}</strong><small>{selection ? `${friendlyDate(selection.date, lang)} · ${bookingTime(selection.minute)}` : lang === 'zh' ? '先选择日期和时间' : 'Choose a day and time'}</small></p>
      <button className="button primary" type="button" disabled={!selection} onClick={onRequest}>{lang === 'zh' ? '预约' : 'Request'}<ArrowRight aria-hidden="true" size={18} /></button>
    </footer>
  </section>;
}
