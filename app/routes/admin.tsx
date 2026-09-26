import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArrowLeft,ArrowRight,Check,Clock,Eye,MousePointerClick,Pencil,ShieldCheck,Store,Users } from 'lucide-react';
import { useApp } from '../lib/context';
import { useApi,post } from '../lib/api';
import { ErrorNotice,Loading,Empty,HotlahTabs } from '../components/ui';
import { MERCHANT_STYLES,money } from '../lib/types';
import type { MerchantType } from '../lib/types';

type AdminInsights={users:number;merchants:number;pendingMerchants:number;approvedMerchants:number;services:number;activeServices:number;requests:number;pendingBookings:number;approvedBookings:number;completed:number;newCustomers:number;impressions:number;views:number;ctr:number};
type AdminMerchant={id:string;name:string;area:string;type:MerchantType;approved:number;subscribed:number;created_at:string;owner_name:string;owner_email:string;services:number;bookings:number;completed:number;new_customers:number;impressions:number;views:number;ctr:number};
type AdminOverview={settings:Record<string,string>;insights:AdminInsights;merchants:AdminMerchant[]};
type MerchantDetail={merchant:{id:string;name:string;area:string;type:MerchantType;work_types:MerchantType[];shop_link:string;bio:string;address:string;phone:string;lat:number;lng:number;styles:string[];hours:{open:string;close:string;days:number[]};policy:string;auto_approve:number;approved:number;subscribed:number;created_at:string;owner_name:string;owner_email:string};services:{id:string;name:string;name_zh:string;price:number;duration:number;active:number;promoted:number}[];insights:Record<string,number>};
const dayLabels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function Metric({label,value,note,icon:Icon}:{label:string;value:string|number;note?:string;icon:typeof Users}){
  return <article className="admin-metric"><Icon size={19}/><small>{label}</small><strong>{value}</strong>{note&&<small className="muted">{note}</small>}</article>;
}

function MerchantEditor({id,onBack,onChanged}:{id:string;onBack:()=>void;onChanged:()=>void}){
  const {toast}=useApp();
  const detail=useApi<MerchantDetail>(`/api/admin/merchants/${id}`);
  const [busy,setBusy]=useState(false);
  if(detail.error)return <ErrorNotice message={detail.error} retry={detail.refresh}/>;
  if(detail.loading||!detail.data)return <Loading/>;
  const {merchant,services,insights}=detail.data;
  const review=async(approved:boolean)=>{setBusy(true);try{await post(`/api/admin/merchants/${id}`,{approved});detail.refresh();onChanged();toast(approved?'Merchant approved and notified.':'Merchant unpublished and notified.');}catch(error){toast((error as Error).message);}finally{setBusy(false);}};
  const save=async(event:React.FormEvent<HTMLFormElement>)=>{
    event.preventDefault();const form=new FormData(event.currentTarget);setBusy(true);
    try{
      const workTypes=[form.get('primary_type'),form.get('secondary_type')].filter(Boolean);
      if(new Set(workTypes).size!==workTypes.length)throw new Error('Choose two different ways of working.');
      await post(`/api/admin/merchants/${id}`,{name:form.get('name'),area:form.get('area'),work_types:workTypes,shop_link:form.get('shop_link'),bio:form.get('bio'),address:form.get('address'),phone:form.get('phone'),lat:Number(form.get('lat')),lng:Number(form.get('lng')),styles:MERCHANT_STYLES.filter(style=>form.get(`style-${style}`)==='on'),hours:{open:form.get('open'),close:form.get('close'),days:dayLabels.map((_,day)=>day).filter(day=>form.get(`day-${day}`)==='on')},policy:form.get('policy'),auto_approve:form.get('auto_approve')==='on'},'PATCH');
      detail.refresh();onChanged();toast('Merchant profile saved.');
    }catch(error){toast((error as Error).message);}finally{setBusy(false);}
  };
  return <article className="admin-detail">
    <header className="page-header"><button className="icon-button" onClick={onBack} aria-label="Back to merchants"><ArrowLeft/></button><h1>Merchant review</h1><i aria-hidden="true"/></header>
    <header className="admin-merchant-identity"><small className={'business-status '+(merchant.approved?'approved':'')}>{merchant.approved?<Check size={13}/>:<Clock size={13}/>} {merchant.approved?'Published':'Awaiting approval'}</small><h2>{merchant.name}</h2><p>{merchant.owner_name} · {merchant.owner_email}</p><small className="muted">Applied {merchant.created_at.slice(0,10)} · {merchant.subscribed?'Subscribed':'Free access'}</small></header>
    <section className="admin-review-actions"><button className={'button '+(merchant.approved?'secondary':'primary')} disabled={busy} onClick={()=>review(!merchant.approved)}>{merchant.approved?'Unpublish merchant':'Approve merchant'}</button></section>
    <section><h2>Merchant insights</h2><dl className="admin-insight-rows">{[['Booking requests','requests'],['Pending requests','pending'],['Approved appointments','approved'],['Completed appointments','completed'],['Unique customers','newCustomers'],['30-day impressions','impressions'],['30-day service views','views'],['30-day CTR','ctr']].map(([label,key])=><section key={key}><dt>{label}</dt><dd>{insights[key]??0}{key==='ctr'?'%':''}</dd></section>)}</dl></section>
    <section className="admin-editor-section"><h2>Edit merchant information</h2><p className="muted small">Changes apply immediately. Existing booking snapshots are not changed.</p><form className="form-stack" onSubmit={save}>
      <label className="field">Studio / nailist name<input name="name" required minLength={2} maxLength={80} defaultValue={merchant.name}/></label>
      <label className="field">Area<input name="area" required minLength={2} maxLength={100} defaultValue={merchant.area}/></label>
      <fieldset className="form-grid"><legend>How they work</legend><label className="field">Primary<select name="primary_type" defaultValue={merchant.work_types[0]??merchant.type}><option value="home">Home studio</option><option value="studio">Nail studio</option><option value="mobile">Mobile nailist</option></select></label><label className="field">Second (optional)<select name="secondary_type" defaultValue={merchant.work_types[1]??''}><option value="">None</option><option value="home">Home studio</option><option value="studio">Nail studio</option><option value="mobile">Mobile nailist</option></select></label></fieldset>
      <label className="field">Public biography<textarea name="bio" maxLength={1200} defaultValue={merchant.bio}/></label>
      <label className="field">Private appointment address<textarea name="address" required minLength={5} maxLength={250} defaultValue={merchant.address}/></label>
      <label className="field">Phone number<input name="phone" inputMode="tel" pattern="\+?\d{9,15}" defaultValue={merchant.phone}/></label>
      <label className="field">Business link<input name="shop_link" type="url" maxLength={500} defaultValue={merchant.shop_link}/></label>
      {merchant.shop_link&&<a className="text-button" href={merchant.shop_link} target="_blank" rel="noopener noreferrer">Open submitted link</a>}
      <fieldset className="form-grid"><legend>Map position</legend><label className="field">Latitude<input name="lat" type="number" step="any" min="-90" max="90" required defaultValue={merchant.lat}/></label><label className="field">Longitude<input name="lng" type="number" step="any" min="-180" max="180" required defaultValue={merchant.lng}/></label></fieldset>
      <fieldset className="admin-choice-grid"><legend>Nail specialties</legend>{MERCHANT_STYLES.map(style=><label className="check-chip" key={style}><input type="checkbox" name={`style-${style}`} defaultChecked={merchant.styles.includes(style)}/>{style}</label>)}</fieldset>
      <fieldset><legend>Business days</legend><section className="weekday-picker">{dayLabels.map((day,index)=><label key={day} className={merchant.hours.days.includes(index)?'selected':''}><input type="checkbox" name={`day-${index}`} defaultChecked={merchant.hours.days.includes(index)}/><span>{day}</span></label>)}</section></fieldset>
      <fieldset className="form-grid"><legend>Business hours</legend><label className="field">Opens<input name="open" type="time" required defaultValue={merchant.hours.open}/></label><label className="field">Closes<input name="close" type="time" required defaultValue={merchant.hours.close}/></label></fieldset>
      <label className="field">Cancellation policy<textarea name="policy" required minLength={10} maxLength={1500} defaultValue={merchant.policy}/></label>
      <label className="toggle-row"><span>Automatically approve requests</span><input type="checkbox" name="auto_approve" defaultChecked={!!merchant.auto_approve}/></label>
      <button className="button primary full" disabled={busy}>Save merchant information</button>
    </form></section>
    <section className="admin-services"><h2>Service menu</h2>{services.length?<ul>{services.map(service=><li key={service.id}><span><strong>{service.name}</strong><small className="muted">{service.duration} min · {service.active?'Available':'Hidden'}{service.promoted?' · Featured':''}</small></span><strong>{money(service.price)}</strong></li>)}</ul>:<p className="quiet-state">This merchant has not created any services yet.</p>}</section>
  </article>;
}

export default function Admin(){
  const {session,toast}=useApp();
  const [params,setParams]=useSearchParams();
  const tab=params.get('tab')??'overview';
  const [merchantId,setMerchantId]=useState<string|null>(null);
  const {data,loading,error,refresh}=useApi<AdminOverview>(session.admin?'/api/admin':null);
  if(!session.admin)return <Empty title="Administrator access required" description={session.user?'This signed-in email is not listed in ADMIN_EMAILS.':'Sign in with an approved Hotlah administrator email.'}/>;
  if(merchantId)return <MerchantEditor id={merchantId} onBack={()=>setMerchantId(null)} onChanged={refresh}/>;
  return <article className="admin-page">
    <header className="page-intro admin-intro"><ShieldCheck size={28}/><h1>Hotlah administration</h1><p>Review marketplace health and keep merchant information accurate.</p><small className="muted">Signed in as {session.user?.email}</small></header>
    <HotlahTabs id="admin" value={tab} onChange={value=>setParams({tab:value})} label="Administrator sections" tabs={[{value:'overview',label:'Insights'},{value:'merchants',label:'Merchants'},{value:'settings',label:'Settings'}]}/>
    {error?<ErrorNotice message={error} retry={refresh}/>:loading?<Loading/>:data&&<section id={`admin-${tab}-panel`} role="tabpanel" aria-labelledby={`admin-${tab}-tab`}>
      {tab==='overview'&&<><header className="section-heading"><span><h2>Platform insights</h2><p>Reach covers the last 30 days. Account and booking totals are all-time.</p></span></header><section className="admin-metric-grid motion-stagger"><Metric icon={Users} label="Registered accounts" value={data.insights.users}/><Metric icon={Store} label="Merchant profiles" value={data.insights.merchants} note={`${data.insights.pendingMerchants} awaiting review`}/><Metric icon={Eye} label="Discovery impressions" value={data.insights.impressions}/><Metric icon={MousePointerClick} label="Service CTR" value={`${data.insights.ctr.toFixed(1)}%`}/><Metric icon={ArrowRight} label="Booking requests" value={data.insights.requests} note={`${data.insights.pendingBookings} pending`}/><Metric icon={Check} label="Completed appointments" value={data.insights.completed}/></section><section className="admin-summary-list"><h2>Marketplace health</h2><dl><section><dt>Approved merchants</dt><dd>{data.insights.approvedMerchants}</dd></section><section><dt>Active services</dt><dd>{data.insights.activeServices}</dd></section><section><dt>Approved appointments</dt><dd>{data.insights.approvedBookings}</dd></section><section><dt>Unique merchant–customer relationships</dt><dd>{data.insights.newCustomers}</dd></section></dl></section></>}
      {tab==='merchants'&&<><header className="section-heading"><span><h2>Merchant applications</h2><p>Pending applications appear first.</p></span><strong className="count-badge">{data.insights.pendingMerchants}</strong></header><section className="admin-merchant-list motion-stagger">{data.merchants.map(merchant=><article key={merchant.id} className="admin-merchant-row"><span><small className={'business-status '+(merchant.approved?'approved':'')}>{merchant.approved?<Check size={12}/>:<Clock size={12}/>} {merchant.approved?'Published':'Pending'}</small><h3>{merchant.name}</h3><p>{merchant.area} · {merchant.type}</p><small className="muted">{merchant.owner_email} · {merchant.services} services · {merchant.bookings} requests</small></span><button className="icon-button" aria-label={`Review ${merchant.name}`} onClick={()=>setMerchantId(merchant.id)}><Pencil size={18}/></button></article>)}</section>{!data.merchants.length&&<p className="quiet-state">No merchant applications yet.</p>}</>}
      {tab==='settings'&&<><h2>Platform settings</h2><form className="form-stack admin-settings" onSubmit={async event=>{event.preventDefault();const form=new FormData(event.currentTarget);try{await post('/api/admin/settings',{allowance:Number(form.get('allowance')),billingEnabled:form.get('billing')==='on'});refresh();toast('Platform settings saved.');}catch(error){toast((error as Error).message);}}}><label className="field">Unique-customer allowance<input name="allowance" type="number" min="0" max="100000" required defaultValue={data.settings.allowance}/></label><label className="toggle-row"><span>Enable subscription gate</span><input type="checkbox" name="billing" defaultChecked={data.settings.billing_enabled==='true'}/></label><p className="notice">Live billing cannot be enabled until a verified subscription provider is connected. Merchants never see their exact remaining allowance.</p><button className="button primary">Save settings</button></form></>}
    </section>}
  </article>;
}
