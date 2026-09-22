import { Bell,Search,CalendarDays,MessageCircle,UserRound,ArrowUpRight,ArrowRight,ArrowLeftRight,ChartNoAxesCombined,Check,Heart,LogIn,Globe2 } from 'lucide-react';
import { Link,NavLink,useLocation } from 'react-router';
import { useEffect,useState } from 'react';
import { useApp } from '../lib/context';
import { apiRequest,post,useApi } from '../lib/api';
import type { Notice } from '../lib/types';
import { Modal } from './ui';

export function Shell({children}:{children:React.ReactNode}) {
  const {session,t,lang,setLang,authOpen,setAuthOpen,demoLogin,toastMessage}=useApp();
  const location=useLocation();const merchant=location.pathname.startsWith('/merchant')||new URLSearchParams(location.search).get('view')==='merchant';
  const [noticesOpen,setNoticesOpen]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const notices=useApi<{notifications:Notice[]}>(session.user?'/api/notifications':null,30000);
  const unread=notices.data?.notifications.filter(n=>!n.read).length??0;
  useEffect(()=>{setError('');window.scrollTo({top:0,behavior:'instant'});},[location.pathname]);
  const items=merchant?[{to:'/merchant',label:t('Today','今日'),icon:CalendarDays,end:true},{to:'/merchant/calendar',label:t('Calendar','日历'),icon:CalendarDays},{to:'/messages?view=merchant',label:t('Messages','消息'),icon:MessageCircle},{to:'/merchant/business',label:t('Business','经营'),icon:ChartNoAxesCombined}]:[{to:'/',label:t('Explore','发现'),icon:Search,end:true},{to:'/bookings',label:t('Bookings','预约'),icon:CalendarDays},{to:'/messages',label:t('Messages','消息'),icon:MessageCircle},{to:'/account',label:t('Account','我的'),icon:UserRound}];
  const signIn=async(provider:string)=>{setBusy(provider);setError('');try{const response=await post<{url:string}>('/api/auth/sign-in/social',{provider,callbackURL:location.pathname});if(response.url)window.location.assign(response.url);}catch(e){setError((e as Error).message);}finally{setBusy('');}};
  return <div className={`app-shell ${merchant?'merchant-shell':''}`}>
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="site-header"><div className="header-inner"><Link to={merchant?'/merchant':'/'} className="wordmark" aria-label="Hotlah home">Hotlah<span className="brand-dot">.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation">{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`desktop-nav-link ${isActive?'active':''}`}><Icon size={17}/>{label}</NavLink>)}</nav>
      <div className="header-actions"><button className="language-button" onClick={()=>setLang(lang==='en'?'zh':'en')} aria-label={lang==='en'?'切换中文':'Switch to English'}><span className={lang==='en'?'selected':''}>EN</span><span className="language-divider">/</span><span className={lang==='zh'?'selected':''}>中文</span></button>
      {session.user?<button className="icon-button notification-button" onClick={()=>{setNoticesOpen(true);post('/api/notifications/read').then(notices.refresh);}} aria-label={t('Notifications','通知')}><Bell size={21}/>{unread>0&&<span className="notification-dot"/>}</button>:<button className="desktop-signin" onClick={()=>setAuthOpen(true)}>{t('Sign in','登录')}<ArrowUpRight size={16}/></button>}
      {merchant&&<Link className="icon-button" to="/" aria-label={t('Switch to customer view','切换顾客视图')}><ArrowLeftRight size={20}/></Link>}</div>
    </div></header>
    <main id="main-content" className="main-content">{children}</main>
    <footer className="desktop-footer"><Link to="/" className="wordmark">Hotlah<span className="brand-dot">.</span></Link><span>{t('Good nails. Great local talent.','好美甲，就在您身边。')}</span><Link to={session.merchant?'/merchant':'/join'}>{t('For nailists','美甲师入口')}<ArrowUpRight size={15}/></Link></footer>
    {session.demo&&<div className="preview-label">{t('Local preview · example studios and prices','本地预览 · 示例工作室及价格')}</div>}
    <nav className="bottom-nav" aria-label={t('Main navigation','主导航')}>{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`bottom-link ${isActive?'active':''}`}><span className="nav-icon"><Icon size={23} strokeWidth={1.65}/></span><span>{label}</span></NavLink>)}</nav>
    {toastMessage&&<div className="toast" role="status"><Check size={18}/>{toastMessage}</div>}
    <Modal open={authOpen} onOpenChange={setAuthOpen} title={t('A little closer to your next set','离心仪的美甲更近一步')} description={t('Sign in to book, chat and keep your favourites together.','登录以预约、聊天和保存您喜爱的美甲。')}>
      <div className="auth-buttons">{(['google','apple','facebook'] as const).map(provider=><button className="button secondary full" key={provider} disabled={!session.providers[provider]||!!busy} onClick={()=>signIn(provider)}><LogIn size={18}/>{t('Continue with','使用')+' '+provider[0].toUpperCase()+provider.slice(1)}{!session.providers[provider]&&<span className="small muted">{t('Not connected','未连接')}</span>}</button>)}</div>
      {session.demo&&<div className="demo-signin"><p className="small muted">{t('Try the local preview. No real account needed.','体验本地预览，无需真实账户。')}</p><button className="button primary full" disabled={!!busy} onClick={async()=>{setBusy('demo');try{await demoLogin('customer');}catch(e){setError((e as Error).message);}finally{setBusy('');}}}>{t('Explore as a customer','以顾客身份体验')}<ArrowRight size={18}/></button></div>}
      {error&&<p className="field-error" role="alert">{error}</p>}
      <p className="auth-note">{t('Free to discover. Pay your nailist at your appointment.','免费探索，到店后直接向美甲师付款。')}</p>
    </Modal>
    <Modal open={noticesOpen} onOpenChange={setNoticesOpen} title={t('Your updates','您的动态')}><div className="notification-list">{notices.data?.notifications.length?notices.data.notifications.map(n=><Link key={n.id} to={merchant?'/merchant':`/bookings/${n.booking_id}`} onClick={()=>setNoticesOpen(false)}><Bell size={20}/><span><strong>{n.title}</strong><small>{n.body}</small></span><ArrowRight size={16}/></Link>):<p className="muted">{t('All caught up. Your booking updates will appear here.','暂无新动态，预约更新会显示在这里。')}</p>}</div></Modal>
  </div>;
}
