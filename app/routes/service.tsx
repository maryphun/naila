import { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import type { Route } from './+types/service';
import { Heart, MapPin, Clock, ArrowRight, Check, LockKeyhole, Star } from 'lucide-react';
import { serverApi } from '../lib/server.server';
import { useApp } from '../lib/context';
import { post } from '../lib/api';
import type { Service, Merchant, Booking } from '../lib/types';
import { money, friendlyDate, STYLE_ZH } from '../lib/types';
import { bookingTime } from '../lib/booking-schedule';
import { PageHeader, Modal, ErrorNotice } from '../components/ui';
import { BookingSchedule, type BookingTimeSelection } from '../components/booking-schedule';

export const loader = ({ request, context, params }: Route.LoaderArgs) =>
  serverApi<{ service: Service; merchant: Merchant; reviews: { id: string; rating: number; body: string; name: string }[] }>(request, context, `/api/services/${params.id}`);

export const meta = ({ loaderData }: Route.MetaArgs) => [{ title: `${loaderData?.service.name ?? 'Service'} — Hotlah` }];

export default function ServicePage() {
  const { service: s, merchant: m, reviews } = useLoaderData<typeof loader>();
  const { t, lang, saved, toggleSaved, session, setAuthOpen, toast } = useApp();
  const navigate = useNavigate();
  const [selection, setSelection] = useState<BookingTimeSelection | null>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState('');

  useEffect(() => {
    post('/api/events', { merchantId: s.merchant_id, kind: 'view' }).catch(() => {});
  }, [s.merchant_id]);

  const request = async () => {
    if (!selection) return;
    setBusy(true);
    setError('');
    try {
      const result = await post<{ booking: Booking }>('/api/bookings', {
        serviceId: s.id,
        date: selection.date,
        minute: selection.minute,
        message,
        requestKey,
      });
      setOpen(false);
      navigate(`/bookings/${result.booking.id}`);
      toast(t('Your request is on its way.', '预约请求已发送。'));
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const startRequest = () => {
    if (!session.user) {
      setAuthOpen(true);
      return;
    }
    setRequestKey(crypto.randomUUID());
    setError('');
    setOpen(true);
  };

  return <div className="detail-page">
    <PageHeader title={t('The details', '服务详情')} action={<button className="icon-button" aria-label="Save service" aria-pressed={saved.includes(s.id)} onClick={() => toggleSaved(s.id)}><Heart size={22} fill={saved.includes(s.id) ? 'currentColor' : 'none'} /></button>} />
    <div className="detail-layout">
      <div className="detail-story">
        <img className="detail-photo" src={s.image} width="1000" height="750" alt={t(`${s.style} manicure example`, `${STYLE_ZH[s.style] ?? s.style}美甲示例`)} />
        <div className="detail-copy">
          <div className="tags"><span>{lang === 'zh' ? STYLE_ZH[s.style] : s.style}</span><span>{s.shape}</span></div>
          <h1>{lang === 'zh' ? s.name_zh : s.name}</h1>
          <p className="detail-price">{money(s.price)} <span><Clock size={15} />{s.duration} {t('min', '分钟')}</span></p>
          <p className="description">{s.description}</p>
          <div className="nailist-line"><div className="avatar">{m.name.slice(0, 1)}</div><div><Link className="nailist-profile-link" to={`/nailists/${m.id}`}>{m.name}</Link><p className="location-line"><MapPin size={14} />{m.area} · {t(m.type === 'home' ? 'Home studio' : m.type === 'mobile' ? 'Mobile nailist' : 'Nail studio', m.type === 'home' ? '家庭工作室' : m.type === 'mobile' ? '上门服务' : '美甲店')}</p></div><span className="verified"><Check size={14} />{t('Approved', '已审核')}</span></div>
          <p className="muted">{m.bio}</p>
          {m.type === 'home' && <p className="privacy-note"><LockKeyhole size={16} />{t('Exact address shared after your booking is approved.', '预约确认后提供详细地址。')}</p>}
          <details className="detail-disclosure"><summary>{t('Before you book', '预约须知')}</summary><p>{m.policy}</p><p>{t('Pay your nailist at the appointment. Hotlah does not collect your service payment.', '服务费用在预约当天直接支付给美甲师，Hotlah 不收取服务费。')}</p></details>
          <details className="detail-disclosure"><summary>{t(`Reviews (${reviews.length})`, `评价 (${reviews.length})`)}</summary>{reviews.length ? reviews.map(r => <div className="review" key={r.id}><strong>{r.name}</strong><span><Star size={14} /> {r.rating}/5</span><p>{r.body}</p></div>) : <p className="muted">{t('A new discovery. Be the first to leave a review after your appointment.', '新的发现。完成预约后，留下第一条评价。')}</p>}</details>
        </div>
      </div>
      <BookingSchedule
        serviceId={s.id}
        workingDays={m.hours.days}
        price={s.price}
        lang={lang}
        selection={selection}
        onSelectionChange={setSelection}
        onRequest={startRequest}
      />
    </div>
    <Modal open={open} onOpenChange={value => { if (!busy) setOpen(value); }} title={t('One step closer', '离心仪美甲更近一步')}>
      <div className="request-summary"><img src={s.image} alt="" /><div><h3>{lang === 'zh' ? s.name_zh : s.name}</h3><p>{m.name}</p><strong>{money(s.price)}</strong></div></div>
      <p>{selection && `${friendlyDate(selection.date, lang)} · ${bookingTime(selection.minute)}`}</p>
      <label className="field">{t('A note for your nailist (optional)', '给美甲师留言（选填）')}<textarea rows={4} maxLength={1500} value={message} onChange={event => setMessage(event.target.value)} placeholder={t('A shorter shape? A different colour? Let them know.', '想要短一点的甲型或其他颜色？告诉美甲师吧。')} /></label>
      <p className="small muted">{t('No payment now. Your appointment is confirmed only after approval.', '现在无需付款。美甲师批准后，预约才算确认。')}</p>
      {error && <ErrorNotice message={error} />}
      <button className="button primary full" disabled={busy} onClick={request}>{t(busy ? 'Sending…' : 'Send booking request', busy ? '发送中…' : '发送预约请求')}<ArrowRight size={18} /></button>
    </Modal>
  </div>;
}
