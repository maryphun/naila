import * as Dialog from '@radix-ui/react-dialog';
import { X,ArrowLeft,LoaderCircle,LockKeyhole,CalendarDays,Search,ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import type { ReactNode } from 'react';
import { useApp } from '../lib/context';
import type { BookingStatus } from '../lib/types';

export function Modal({open,onOpenChange,title,description,children,className=''}:{open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;children:ReactNode;className?:string}) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className={`dialog-content ${className}`} aria-describedby={description?'dialog-description':undefined}>
    <div className="dialog-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close className="icon-button" aria-label="Close"><X size={21}/></Dialog.Close></div>
    {description&&<Dialog.Description id="dialog-description" className="muted dialog-description">{description}</Dialog.Description>}{children}
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
export function PageHeader({title,back='/',action}:{title:string;back?:string;action?:ReactNode}) {
  return <div className="page-header"><Link to={back} className="icon-button back-button" aria-label="Go back"><ArrowLeft size={23}/></Link><h1>{title}</h1>{action??<span className="header-spacer"/>}</div>;
}
export function Loading(){return <div className="loading" role="status"><LoaderCircle className="spin" size={25}/><span>Loading…</span></div>;}
export function ErrorNotice({message,retry}:{message:string;retry?:()=>void}){return <div className="error-notice" role="alert"><p>{message}</p>{retry&&<button className="text-button" onClick={retry}>Try again <ArrowRight size={16}/></button>}</div>;}
export function Empty({title,description,action}:{title:string;description:string;action?:ReactNode}){return <div className="empty-state"><div className="empty-symbol"><CalendarDays size={34} strokeWidth={1.4}/></div><h2>{title}</h2><p className="muted">{description}</p>{action}</div>;}
export function StatusBadge({status}:{status:BookingStatus}) {
  const {t}=useApp();
  const labels:Record<BookingStatus,[string,string]>={pending:['Pending approval','等待确认'],approved:['Confirmed','已确认'],completed:['Completed','已完成'],cancelled:['Cancelled','已取消'],declined:['Declined','已拒绝'],expired:['Expired','已过期']};
  return <span className={`status-badge ${status}`}><span/>{t(...labels[status])}</span>;
}
export function AuthRequired({merchant=false}:{merchant?:boolean}) {
  const {t,setAuthOpen,session}=useApp();
  return <Empty title={t(merchant?'Your studio, at a glance':'Your next appointment starts here',merchant?'您的工作室，一目了然':'从这里开始下一次美甲预约')} description={t(merchant?'Sign in to manage your requests and appointments.':'Sign in to keep your bookings, messages and favourite nailists together.',merchant?'登录以管理预约请求和日程。':'登录后，集中管理预约、消息和喜爱的美甲师。')} action={<button className="button primary" onClick={()=>setAuthOpen(true)}>{t('Sign in','登录')} <ArrowRight size={18}/></button>}/>;
}
export function LockedRequest({onSubscribe}:{onSubscribe:()=>void}) {
  const {t}=useApp();return <div className="locked-request"><LockKeyhole size={26} strokeWidth={1.5}/><div><h3>{t('New booking request','新的预约请求')}</h3><p>{t('Subscribe to view this request and respond.','订阅后查看并回复此请求。')}</p></div><button className="button primary" onClick={onSubscribe}>{t('View subscription','查看订阅')}<ArrowRight size={18}/></button></div>;
}
export function SubscriptionModal({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}) {
  const {t,session}=useApp();return <Modal open={open} onOpenChange={onOpenChange} title={t('Keep your next chapter growing','让您的事业继续成长')}><div className="subscription-copy"><LockKeyhole size={34}/><p>{t('Your new booking requests are waiting. A Hotlah subscription gives you access to view and respond to them.','新的预约请求正在等待。订阅 Hotlah 后即可查看并回复。')}</p><div className="notice">{t(session.demo?'This is a preview of the subscription gate. No payment is collected. Live pricing and checkout will be configured before billing is enabled.':'Subscriptions are not available yet. Hotlah will publish pricing before enabling merchant billing.',session.demo?'这是订阅限制预览，不会收取费用。正式收费前将设置价格和结账流程。':'订阅尚未开放。正式收费前，Hotlah 会公布价格。')}</div><p className="small muted">{t('Existing confirmed appointments and booking history stay available.','已确认的预约和历史记录仍可访问。')}</p><button className="button secondary full" onClick={()=>onOpenChange(false)}>{t('Back to my workspace','返回工作台')}</button></div></Modal>;
}
