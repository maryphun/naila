export type Language = 'en' | 'zh';
export type BookingStatus = 'pending' | 'approved' | 'completed' | 'cancelled' | 'declined' | 'expired';
export type MerchantType = 'home' | 'studio' | 'mobile';
export interface Service {
  id: string; merchant_id: string; name: string; name_zh: string; description: string;
  price: number; duration: number; buffer: number; image: string; style: string; shape: string;
  active: number; promoted: number; merchant_name: string; area: string; type: MerchantType;
  lat: number; lng: number; distance?: number;
  next_available?: {date:string;minute:number} | null;
}
export interface Merchant {
  id: string; name: string; area: string; type: MerchantType; bio: string; styles: string[];
  hours: { open: string; close: string; days: number[] }; policy: string;
  auto_approve?: number; approved?: number; subscribed?: number; address?: string; phone?: string;
}
export interface Booking {
  id: string; merchant_id?: string; user_id?: string; service_id?: string; date?: string;
  start_minute?: number; end_minute?: number; name?: string; price?: number; duration?: number;
  image?: string; status: BookingStatus; locked: number; created_at?: string;
  merchant_name?: string; customer_name?: string; area?: string; type?: MerchantType;
  address?: string; contact_available?: boolean; policy?: string; has_review?: number;
}
export interface Message { id: string; sender_id: string; body: string; created_at: string; sender_name: string }
export interface Notice { id: string; title: string; body: string; booking_id: string; read: number; created_at: string }
export interface SessionInfo {
  user: { id: string; name: string; email: string; image?: string | null } | null;
  merchant: Merchant | null; demo: boolean; admin: boolean;
  providers: { google: boolean; apple: boolean; facebook: boolean };
}
export const STYLES = ['French', 'Cat eye', 'Glazed', 'Minimal', 'Hand-painted', 'Chrome', '3D art', 'Korean', 'Chinese', 'Mirror', 'Magnet'] as const;
export const MERCHANT_STYLES = [...STYLES, 'Other'] as const;
export const STYLE_ZH: Record<string, string> = { French: '法式', 'Cat eye': '猫眼', Glazed: '珍珠光泽', Minimal: '简约', 'Hand-painted': '手绘', Chrome: '金属光泽', '3D art': '立体装饰', Korean: '韩式', Chinese: '中式', Mirror: '镜面', Magnet: '磁吸', Other: '其他' };
export const money = (cents: number) => `RM ${new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(cents / 100)}`;
export const time = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
export function localDate(offset = 0): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const date = new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00+08:00`);
  date.setUTCDate(date.getUTCDate() + offset);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
export const friendlyDate = (date: string, lang: Language = 'en') => new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(`${date}T12:00:00+08:00`));
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (n: number) => n * Math.PI / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
