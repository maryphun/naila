import { useEffect } from 'react';
import { useLoaderData } from 'react-router';
import { Check, MapPin, Star } from 'lucide-react';
import type { Route } from './+types/nailist';
import { serverApi } from '../lib/server.server';
import { useApp } from '../lib/context';
import { STYLE_ZH } from '../lib/types';
import type { Merchant, Service } from '../lib/types';
import { post } from '../lib/api';
import { PageHeader } from '../components/ui';
import { ServiceCard } from '../components/service-card';

type Review={id:string;rating:number;body:string;name:string};
export const loader=({request,context,params}:Route.LoaderArgs)=>serverApi<{merchant:Merchant;services:Service[];reviews:Review[]}>(request,context,`/api/merchants/${params.id}`);
export const meta=({loaderData}:Route.MetaArgs)=>[{title:`${loaderData?.merchant.name??'Nailist'} — Hotlah`}];

export default function NailistPage(){
  const {merchant,services,reviews}=useLoaderData<typeof loader>();
  const {t,lang}=useApp();
  useEffect(()=>{post('/api/events',{merchantId:merchant.id,kind:'view'}).catch(()=>{});},[merchant.id]);
  const label=t(merchant.type==='home'?'Home studio':merchant.type==='mobile'?'Mobile nailist':'Nail studio',merchant.type==='home'?'家庭工作室':merchant.type==='mobile'?'上门美甲师':'美甲店');
  return <article className="nailist-page">
    <PageHeader title={t('Nailist','美甲师')}/>
    <img className="nailist-hero" src={services[0].image} alt={t(`${merchant.name}'s nail work`,`${merchant.name} 的美甲作品`)} width="1000" height="750"/>
    <header className="nailist-intro">
      <h1>{merchant.name}</h1>
      <p className="nailist-type">{label} <Check size={14}/> {t('Approved','已审核')}</p>
      <p className="location-line"><MapPin size={16}/>{merchant.area}</p>
      {merchant.bio&&<p className="nailist-bio">{merchant.bio}</p>}
      {merchant.styles.length>0&&<p className="nailist-styles">{merchant.styles.map(style=>lang==='zh'?STYLE_ZH[style]??style:style).join(' · ')}</p>}
    </header>
    <section className="nailist-menu" aria-labelledby="nailist-menu-title">
      <header className="section-heading"><h2 id="nailist-menu-title">{t('Services & prices','服务与价格')}</h2><p className="muted small">{services.length} {t(services.length===1?'service':'services','项服务')}</p></header>
      <section className="service-grid">{services.map(service=><ServiceCard service={service} hideMerchant key={service.id}/>)}</section>
    </section>
    <section className="nailist-reviews" aria-labelledby="nailist-reviews-title">
      <h2 id="nailist-reviews-title">{t(`Reviews (${reviews.length})`,`评价 (${reviews.length})`)}</h2>
      {reviews.length?reviews.map(review=><article className="review" key={review.id}><strong>{review.name}</strong><span><Star size={14}/> {review.rating}/5</span><p>{review.body}</p></article>):<p className="muted small">{t('No reviews yet. Reviews come from completed appointments.','暂无评价。评价来自已完成的预约。')}</p>}
    </section>
  </article>;
}
