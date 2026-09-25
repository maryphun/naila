import { Link,useNavigate } from 'react-router';
import { ArrowRight,Store,LogOut,Heart,Globe,ShieldCheck } from 'lucide-react';
import { useApp } from '../lib/context';
import { post,useApi } from '../lib/api';
import type { Service } from '../lib/types';
import { ServiceCard } from '../components/service-card';
import { HotlahSegmentedControl } from '../components/ui';

export default function Account(){
  const {t,lang,setLang,session,setAuthOpen,saved,demoLogin,refreshSession,toast}=useApp();
  const navigate=useNavigate();
  const {data}=useApi<{services:Service[]}>('/api/catalog');
  return <article className="account-page">
    <header className="page-intro"><h1>{t('Your little corner','您的专属空间')}</h1></header>
    <section className="account-summary"><span className="avatar large">{session.user?.name.slice(0,1)??'h.'}</span><span>{session.user?.name&&<h2>{session.user.name}</h2>}{session.user?.email&&<p className="muted">{session.user.email}</p>}</span>{!session.user&&<button className="button primary" onClick={()=>setAuthOpen(true)}>{t('Sign in','登录')}</button>}</section>
    <section className="account-actions">
      {session.admin&&<Link className="option-row admin-entry" to="/admin"><span><ShieldCheck size={20}/>{t('Open administrator workspace','进入管理员工作台')}</span><ArrowRight size={20}/></Link>}
      <section className="option-row language-option-row"><span><Globe size={20}/>{t('Language','语言')}</span><HotlahSegmentedControl className="account-language-segmented" size="sm" value={lang} onChange={value=>setLang(value as 'en'|'zh')} label={t('Language','语言')} options={[{value:'en',label:'EN'},{value:'zh',label:'中文'}]}/></section>
      <Link className="option-row" to={session.merchant?'/merchant':'/join'}><span><Store size={20}/>{t(session.merchant?'Open nailist workspace':'Are you a nailist?',session.merchant?'进入美甲师工作台':'您是美甲师吗？')}</span><ArrowRight size={20}/></Link>
      {session.user&&<button className="option-row" onClick={async()=>{await post('/api/logout',{});await refreshSession();navigate('/');}}><span><LogOut size={20}/>{t('Sign out','退出登录')}</span></button>}
    </section>
    <section><header className="section-heading"><h2><Heart size={22}/>{t('Saved for later','收藏的心动款式')}</h2><span className="muted">{saved.length}</span></header>{saved.length?<section className="service-grid motion-stagger">{data?.services.filter(s=>saved.includes(s.id)).map(s=><ServiceCard key={s.id} service={s}/>)}</section>:<p className="muted">{t('Tap the heart on a service to keep it here.','点击服务上的爱心，即可收藏在这里。')}</p>}</section>
    {session.demo&&<details className="demo-tools"><summary>Local preview tools</summary><p>Try both sides of Hotlah using fictional accounts. These controls only exist on localhost.</p><section className="button-pair">{(['customer','merchant','admin'] as const).map(role=><button className="button secondary" key={role} onClick={()=>demoLogin(role).catch(e=>toast(e.message))}>{role}</button>)}</section></details>}
  </article>;
}
