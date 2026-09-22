import { Link } from 'react-router';
import { ArrowRight,MapPin } from 'lucide-react';
import type { Booking } from '../lib/types';
import { money,friendlyDate,time } from '../lib/types';
import { useApp } from '../lib/context';
import { StatusBadge } from './ui';
export function BookingCard({booking:b,merchant=false}:{booking:Booking;merchant?:boolean}){const {t,lang}=useApp();return <Link className="booking-card" to={`/bookings/${b.id}${merchant?'?view=merchant':''}`}><img src={b.image} alt=""/><div className="booking-info"><StatusBadge status={b.status}/><h3>{b.name}</h3><p>{merchant?b.customer_name:b.merchant_name}</p><strong>{b.date&&friendlyDate(b.date,lang)} · {time(b.start_minute??0)}</strong><p className="small muted">{money(b.price??0)} · {b.duration} {t('min','分钟')}</p></div><ArrowRight size={20}/></Link>;}
