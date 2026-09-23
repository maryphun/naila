import { Link } from 'react-router';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useApp } from '../lib/context';
import { money, STYLE_ZH } from '../lib/types';
import type { Service } from '../lib/types';

export function MerchantCard({services}:{services:Service[]}) {
  const {t,lang}=useApp();
  const lead=services[0];
  const price=Math.min(...services.map(service=>service.price));
  const styles=[...new Set(services.map(service=>service.style))].slice(0,3);
  const available=services.some(service=>!!service.next_available);
  return <article className="service-card merchant-card">
    <Link className="service-photo" to={`/nailists/${lead.merchant_id}`} aria-label={t(`View ${lead.merchant_name}'s menu`,`查看 ${lead.merchant_name} 的服务菜单`)}>
      <img src={lead.image} alt="" width="1000" height="750" loading="lazy"/>
    </Link>
    <section className="service-content">
      <p className="service-meta"><span>{t(lead.type==='home'?'Home studio':lead.type==='mobile'?'Mobile nailist':'Nail studio',lead.type==='home'?'家庭工作室':lead.type==='mobile'?'上门美甲师':'美甲店')}</span><span>{services.length} {t(services.length===1?'matching service':'matching services','项匹配服务')}</span></p>
      <Link className="service-title" to={`/nailists/${lead.merchant_id}`}><h3>{lead.merchant_name}</h3><ArrowUpRight size={20}/></Link>
      <p className="location-line"><MapPin size={14}/>{lead.area}{lead.distance!==undefined&&` · ${lead.distance.toFixed(1)} km`}</p>
      <p className="merchant-specialties">{styles.map(style=>lang==='zh'?STYLE_ZH[style]??style:style).join(' · ')}</p>
      <p className={`next-availability ${available?'':'unavailable'}`}>{available?t('Times available to request','有可申请时段'):t('No times in the next 14 days','未来14天暂无时段')}</p>
      <footer className="service-bottom"><strong>{t('From','起价')} {money(price)}</strong><span>{t('View menu','查看菜单')} <ArrowUpRight size={14}/></span></footer>
    </section>
  </article>;
}
