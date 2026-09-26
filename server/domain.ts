import { HTTPException } from 'hono/http-exception';
import type { Booking, MerchantType, Service } from '../app/lib/types';
import type { Actor, Env } from './env';

export const publicCatalogueSql = `SELECT s.*,m.name merchant_name,m.area,m.type,m.work_types merchant_work_types,m.lat,m.lng FROM services s JOIN merchants m ON m.id=s.merchant_id WHERE m.approved=1 AND s.active=1`;
export const bookingSql = `SELECT b.*,m.name merchant_name,m.area,m.type,m.address,m.phone,m.policy,m.user_id merchant_user_id,m.subscribed,u.name customer_name,(SELECT COUNT(*) FROM reviews r WHERE r.booking_id=b.id) has_review FROM bookings b JOIN merchants m ON m.id=b.merchant_id JOIN user u ON u.id=b.user_id`;
export interface BookingRow extends Booking { merchant_user_id: string; phone: string; subscribed: number; request_key: string }
export function merchantWorkTypes(row: {work_types?:unknown;merchant_work_types?:unknown;type?:unknown}): MerchantType[] {
  const values=JSON.parse(String(row.work_types??row.merchant_work_types??'[]')) as unknown;
  const types=Array.isArray(values)?values.filter((type):type is MerchantType=>type==='home'||type==='studio'||type==='mobile'):[];
  return types.length?types:[row.type==='studio'||row.type==='mobile'?row.type:'home'];
}
export function publicMerchant(row: Record<string, unknown>) {
  return { id: row.id, name: row.name, area: row.area, type: row.type, work_types: merchantWorkTypes(row), bio: row.bio,
    styles: JSON.parse(String(row.styles)), hours: JSON.parse(String(row.hours)), policy: row.policy };
}
export function sanitizeBooking(row: BookingRow, actor: Actor): Booking {
  const owner = row.merchant_user_id === actor.id;
  if (owner && row.locked && !row.subscribed) return { id: row.id, status: row.status, locked: 1 };
  const { merchant_user_id: _owner, phone, subscribed: _paid, request_key: _key, address, ...safe } = row;
  const approved = ['approved', 'completed'].includes(row.status);
  return { ...safe, locked: owner && row.subscribed ? 0 : row.locked,
    ...(approved || owner ? { address } : {}), contact_available: approved && !!phone };
}
export async function ownedBooking(env: Env, id: string, actor: Actor): Promise<BookingRow> {
  const row = await env.DB.prepare(`${bookingSql} WHERE b.id=? AND (b.user_id=? OR m.user_id=?)`).bind(id, actor.id, actor.id).first<BookingRow>();
  if (!row) throw new HTTPException(404, { message: 'Booking not found.' });
  return row;
}
export function assertMerchantAccess(row: BookingRow, actor: Actor) {
  if (row.merchant_user_id === actor.id && row.locked && !row.subscribed)
    throw new HTTPException(403, { message: 'A subscription is required to open this request.' });
}
export function minutes(value: string) { const [h, m] = value.split(':').map(Number); return h * 60 + m; }
export function validDate(date: string) { const parsed=new Date(date+'T00:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0,10)===date; }
export function dayInMalaysia(date = new Date()) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
export function checkFuture(date: string, minute: number) {
  if (!validDate(date) || new Date(`${date}T${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}:00+08:00`).getTime() <= Date.now())
    throw new HTTPException(400, { message: 'Please choose a future appointment time.' });
  if (new Date(date).getTime() > Date.now() + 90 * 86400000) throw new HTTPException(400, { message: 'Please book within the next 90 days.' });
}
export function computeSlots(hours: { open: string; close: string; days: number[] }, date: string, duration: number, buffer: number, occupied: { start_minute: number; end_minute: number }[], now = Date.now()) {
  if (!hours.days.includes(new Date(date + 'T12:00:00Z').getUTCDay())) return [];
  const slots: { minute: number; available: boolean }[] = [];
  for (let minute = minutes(hours.open); minute + duration + buffer <= minutes(hours.close); minute += 30) {
    const stamp = new Date(`${date}T${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}:00+08:00`).getTime();
    slots.push({ minute, available: stamp > now && !occupied.some(o => o.start_minute < minute + duration + buffer && o.end_minute > minute) });
  }
  return slots;
}
export async function getSlots(env: Env, service: Service, date: string) {
  if (!validDate(date)) throw new HTTPException(400, { message: 'Invalid date.' });
  const merchant = await env.DB.prepare('SELECT hours FROM merchants WHERE id=?').bind(service.merchant_id).first<{ hours: string }>();
  const occupied = await env.DB.prepare(`SELECT start_minute,end_minute FROM bookings WHERE merchant_id=? AND date=? AND status IN ('approved','completed') UNION ALL SELECT start_minute,end_minute FROM blocks WHERE merchant_id=? AND date=?`).bind(service.merchant_id, date, service.merchant_id, date).all<{ start_minute: number; end_minute: number }>();
  return computeSlots(JSON.parse(merchant!.hours), date, service.duration, service.buffer, occupied.results);
}
export async function notify(env: Env, userId: string, bookingId: string, title: string, body: string) {
  await env.DB.batch([
    env.DB.prepare('INSERT INTO notifications(id,user_id,booking_id,title,body) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(), userId, bookingId, title, body),
    env.DB.prepare('INSERT INTO outbox(id,user_id,subject,body) VALUES(?,?,?,?)').bind(crypto.randomUUID(), userId, title, body),
  ]);
}
export async function maintain(env: Env) {
  const due = await env.DB.prepare(`SELECT id,user_id FROM bookings WHERE status='approved' AND date < ?`).bind(dayInMalaysia()).all<{ id: string; user_id: string }>();
  for (const booking of due.results) {
    const change = await env.DB.prepare(`UPDATE bookings SET status='completed' WHERE id=? AND status='approved'`).bind(booking.id).run();
    if (change.meta.changes) await notify(env, booking.user_id, booking.id, 'How was your appointment?', 'Your appointment date has passed. You can now leave a review in Hotlah.');
  }
  // Unapproved requests remain pending, including subscription-locked requests.
  // Only approved appointments are automatically completed after their booking date.
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) return;
  const mail = await env.DB.prepare(`SELECT o.*,u.email FROM outbox o JOIN user u ON u.id=o.user_id WHERE o.sent=0 AND o.attempts<5 ORDER BY o.created_at LIMIT 20`).all<{ id: string; email: string; subject: string; body: string }>();
  for (const item of mail.results) {
    if (item.email.endsWith('.test')) continue;
    await env.DB.prepare('UPDATE outbox SET attempts=attempts+1 WHERE id=?').bind(item.id).run();
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': item.id }, body: JSON.stringify({ from: env.EMAIL_FROM, to: item.email, subject: item.subject, text: `${item.body}\n\nOpen Hotlah: ${env.APP_URL}/bookings` }) });
    if (response.ok) await env.DB.prepare('UPDATE outbox SET sent=1 WHERE id=?').bind(item.id).run();
  }
}
