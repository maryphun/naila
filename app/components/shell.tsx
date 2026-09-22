import { Bell,Search,CalendarDays,MessageCircle,UserRound,ArrowUpRight,ArrowRight,ArrowLeftRight,ChartNoAxesCombined,Check } from 'lucide-react';
import { Link,NavLink,useLocation } from 'react-router';
import { useEffect,useState } from 'react';
import { useApp } from '../lib/context';
import { post,useApi } from '../lib/api';
import type { Notice } from '../lib/types';
import { Modal } from './ui';

type SocialProvider='google'|'facebook'|'apple';
function ProviderIcon({provider}:{provider:SocialProvider}){
  if(provider==='google')return <svg className="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.43l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.86A6 6 0 0 1 6.08 12c0-.65.11-1.28.31-1.86V7.52H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.48l3.35-2.62Z"/><path fill="#EA4335" d="M12 6.01c1.47 0 2.78.5 3.82 1.49l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.52l3.35 2.62C7.18 7.77 9.39 6.01 12 6.01Z"/></svg>;
  if(provider==='facebook')return <svg className="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1877F2"/><path fill="#fff" d="M15.88 14.89l.44-2.89h-2.77v-1.88c0-.79.39-1.56 1.63-1.56h1.26V6.1s-1.14-.2-2.24-.2c-2.28 0-3.77 1.38-3.77 3.88V12H7.9v2.89h2.53v6.98a10.18 10.18 0 0 0 3.12 0v-6.98h2.33Z"/></svg>;
  return <svg className="provider-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 12.54c-.02-2.13 1.74-3.17 1.82-3.22a3.9 3.9 0 0 0-3.08-1.67c-1.3-.14-2.56.78-3.22.78-.67 0-1.68-.77-2.77-.75a4.08 4.08 0 0 0-3.43 2.09c-1.49 2.57-.38 6.35 1.05 8.43.72 1.03 1.56 2.17 2.65 2.13 1.07-.04 1.47-.68 2.76-.68 1.28 0 1.65.68 2.77.65 1.15-.02 1.88-1.02 2.57-2.06a8.4 8.4 0 0 0 1.18-2.4 3.7 3.7 0 0 1-2.3-3.3ZM14.94 6.27a3.76 3.76 0 0 0 .86-2.7 3.83 3.83 0 0 0-2.49 1.28 3.56 3.56 0 0 0-.89 2.6 3.17 3.17 0 0 0 2.52-1.18Z"/></svg>;
}

export function Shell({children}:{children:React.ReactNode}) {
  const {session,t,lang,setLang,authOpen,setAuthOpen,demoLogin,toastMessage}=useApp();
  const location=useLocation();const merchant=location.pathname.startsWith('/merchant')||new URLSearchParams(location.search).get('view')==='merchant';
  const [noticesOpen,setNoticesOpen]=useState(false),[busy,setBusy]=useState(''),[error,setError]=useState('');
  const notices=useApi<{notifications:Notice[]}>(session.user?'/api/notifications':null,30000);
  const unread=notices.data?.notifications.filter(n=>!n.read).length??0;
  const enabledProviders=(['google','facebook','apple'] as const).filter(provider=>session.providers[provider]);
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
    <nav className="legal-links" aria-label={t('Legal information','法律信息')}><Link to="/privacy">{t('Privacy','隐私')}</Link><span aria-hidden="true">·</span><Link to="/data-deletion">{t('Data deletion','数据删除')}</Link></nav>
    {session.demo&&<div className="preview-label">{t('Local preview · example studios and prices','本地预览 · 示例工作室及价格')}</div>}
    <nav className="bottom-nav" aria-label={t('Main navigation','主导航')}>{items.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end} className={({isActive})=>`bottom-link ${isActive?'active':''}`}><span className="nav-icon"><Icon size={23} strokeWidth={1.65}/></span><span>{label}</span></NavLink>)}</nav>
    {toastMessage&&<div className="toast" role="status"><Check size={18}/>{toastMessage}</div>}
    <Modal open={authOpen} onOpenChange={setAuthOpen} title={t('A little closer to your next set','离心仪的美甲更近一步')} description={t('Sign in to book, chat and keep your favourites together.','登录以预约、聊天和保存您喜爱的美甲。')}>
      <div className="auth-buttons">{enabledProviders.map(provider=><button className="button secondary full provider-button" data-provider={provider} key={provider} disabled={!!busy} onClick={()=>signIn(provider)}><ProviderIcon provider={provider}/><span>{t('Continue with','使用')+' '+provider[0].toUpperCase()+provider.slice(1)}</span></button>)}<button className="button secondary full provider-button provider-button-disabled" data-provider="apple" disabled aria-label={t('Continue with Apple, coming soon','使用 Apple 登录，即将推出')}><ProviderIcon provider="apple"/><span>{t('Continue with Apple','使用 Apple 登录')}</span><span className="provider-status">{t('Coming soon','即将推出')}</span></button></div>
      {!enabledProviders.length&&!session.demo&&<p className="muted">{t('Sign-in is temporarily unavailable. Please try again later.','登录暂时不可用，请稍后再试。')}</p>}
      {session.demo&&<div className="demo-signin"><p className="small muted">{t('Try the local preview. No real account needed.','体验本地预览，无需真实账户。')}</p><button className="button primary full" disabled={!!busy} onClick={async()=>{setBusy('demo');try{await demoLogin('customer');}catch(e){setError((e as Error).message);}finally{setBusy('');}}}>{t('Explore as a customer','以顾客身份体验')}<ArrowRight size={18}/></button></div>}
      {error&&<p className="field-error" role="alert">{error}</p>}
      <p className="auth-note">{t('Free to discover. Pay your nailist at your appointment.','免费探索，到店后直接向美甲师付款。')}</p>
    </Modal>
    <Modal open={noticesOpen} onOpenChange={setNoticesOpen} title={t('Your updates','您的动态')}><div className="notification-list">{notices.data?.notifications.length?notices.data.notifications.map(n=><Link key={n.id} to={merchant?'/merchant':`/bookings/${n.booking_id}`} onClick={()=>setNoticesOpen(false)}><Bell size={20}/><span><strong>{n.title}</strong><small>{n.body}</small></span><ArrowRight size={16}/></Link>):<p className="muted">{t('All caught up. Your booking updates will appear here.','暂无新动态，预约更新会显示在这里。')}</p>}</div></Modal>
  </div>;
}
