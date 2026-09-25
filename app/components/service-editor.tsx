import { useRef,useState } from 'react';
import { ArrowLeft,ArrowRight,Camera,Check } from 'lucide-react';
import { MERCHANT_STYLES,STYLE_ZH,money } from '../lib/types';
import type { Service } from '../lib/types';
import { useApp } from '../lib/context';
import { post } from '../lib/api';
import { ErrorNotice } from './ui';

export function ServiceEditor({initial,onSaved,onCancel}:{initial?:Service;onSaved:()=>void;onCancel:()=>void}){
  const {t,lang}=useApp();
  const [step,setStep]=useState(0),[busy,setBusy]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('');
  const [values,setValues]=useState({name:initial?.name??'',name_zh:initial?.name_zh??'',description:initial?.description??'',price:initial?String(initial.price/100):'',duration:String(initial?.duration??75),buffer:String(initial?.buffer??15),image:initial?.image??'',style:initial?.style??MERCHANT_STYLES[0],shape:initial?.shape??'Any',active:initial?!!initial.active:true,promoted:!!initial?.promoted});
  const form=useRef<HTMLFormElement>(null),heading=useRef<HTMLHeadingElement>(null);
  const change=<K extends keyof typeof values>(key:K,value:typeof values[K])=>setValues(v=>({...v,[key]:value}));
  const go=(value:number)=>{setStep(value);setError('');requestAnimationFrame(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:'instant'});});};
  const upload=async(file:File)=>{
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError(t('Choose a JPG, PNG or WebP photo smaller than 5 MB.','请选择小于5 MB的JPG、PNG或WebP照片。'));return;}
    setUploading(true);setError('');
    try{const response=await fetch('/api/uploads',{method:'POST',body:file,headers:{'Content-Type':file.type}});const result=await response.json() as {url:string;error?:string};if(!response.ok)throw new Error(result.error??t('Photo upload failed. Please try again.','照片上传失败，请重试。'));change('image',result.url);}
    catch(e){setError((e as Error).message);}finally{setUploading(false);}
  };
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();if(busy||uploading||!form.current?.reportValidity())return;
    if(step===0&&!values.image){setError(t('Add a photo of this service to continue.','请添加此服务的照片以继续。'));return;}
    if(step<2){go(step+1);return;}
    setBusy(true);setError('');
    try{await post('/api/merchant/services'+(initial?'/'+initial.id:''),{...values,price:Math.round(Number(values.price)*100),duration:Number(values.duration),buffer:Number(values.buffer)},initial?'PATCH':'POST');onSaved();}
    catch(e){setError((e as Error).message);}finally{setBusy(false);}
  };
  const labels=[t('The service','服务信息'),t('Price & time','价格与时间'),t('Review','确认')];
  return <form ref={form} className="guided-form service-editor" onSubmit={save}>
    <button type="button" className="text-button" onClick={onCancel} disabled={busy||uploading}><ArrowLeft size={17}/>{t('Back to menu','返回菜单')}</button>
    <nav className="setup-progress" aria-label={t('Service setup progress','服务设置进度')}><ol>{labels.map((label,i)=><li key={label} className={step===i?'current':i<step?'complete':''}><button type="button" disabled={i>step||busy||uploading} onClick={()=>go(i)} aria-current={i===step?'step':undefined}><span>{i<step?<Check size={13}/>:i+1}</span>{label}</button></li>)}</ol></nav>
    <header className="guide-intro"><h2 ref={heading} tabIndex={-1}>{step===0?t(initial?'Refresh your signature.':'Your next signature service.',initial?'更新您的招牌服务。':'添加您的招牌服务。'):step===1?t('A price. A little time.','定好价格，留好时间。'):t('Here’s how it will look.','看看最终效果。')}</h2><p>{step===0?t('A clear photo and a helpful name make choosing easier.','清晰照片和准确名称，让顾客更容易选择。'):step===1?t('Customers pay you at the appointment. Timing determines which slots they can request.','顾客到店时付款。服务时长决定可预约的时段。'):t('Check your service, then choose whether customers can book it.','确认服务信息，再决定是否开放预约。')}</p></header>
    <fieldset className="guide-fields" disabled={busy||uploading}>
      {step===0&&<><label className={'service-upload '+(values.image?'has-image':'')}>{values.image?<img src={values.image} alt={t('Your service photo','您的服务照片')}/>:<Camera size={32} strokeWidth={1.5}/>}<span>{uploading?t('Uploading photo…','上传照片中…'):values.image?t('Change photo','更换照片'):t('Add a photo of your work','添加作品照片')}</span><small>JPG, PNG, WebP · {t('up to 5 MB','不超过5 MB')}</small><input type="file" aria-label={t('Service photo','服务照片')} accept="image/jpeg,image/png,image/webp" onChange={e=>{if(e.target.files?.[0])void upload(e.target.files[0]);e.target.value='';}}/></label><label className="field">{t('Service name · English','服务名称 · 英文')}<input required minLength={3} maxLength={100} value={values.name} onChange={e=>change('name',e.target.value)} placeholder="e.g. Soft French gel manicure"/></label><label className="field">{t('Service name · Chinese (optional)','服务名称 · 中文（选填）')}<input maxLength={100} value={values.name_zh} onChange={e=>change('name_zh',e.target.value)}/></label><label className="field">{t('What’s included','服务内容')}<textarea required minLength={10} maxLength={1600} value={values.description} onChange={e=>change('description',e.target.value)} placeholder={t('Include preparation, nail art and any extras.','说明前期护理、美甲图案和包含的附加服务。')}/></label></>}
      {step===1&&<><label className="field">{t('Price · MYR','价格 · MYR')}<input required inputMode="decimal" type="number" min="0" max="10000" step="0.01" placeholder="88.00" value={values.price} onChange={e=>change('price',e.target.value)}/></label><div className="form-grid"><label className="field">{t('Duration · minutes','服务时长 · 分钟')}<input required type="number" min="15" max="480" step="1" value={values.duration} onChange={e=>change('duration',e.target.value)}/></label><label className="field">{t('Break after · minutes','服务后休息 · 分钟')}<input required type="number" min="0" max="120" step="1" value={values.buffer} onChange={e=>change('buffer',e.target.value)}/></label></div><p className="inline-help">{t('The break gives you time to clean up before your next customer. It is included when reserving your calendar.','服务后的休息时间便于整理，并会计入日历占用时间。')}</p><label className="field">{t('Nail style','美甲款式')}<select value={values.style} onChange={e=>change('style',e.target.value)}>{MERCHANT_STYLES.map(s=><option key={s} value={s}>{lang==='zh'?STYLE_ZH[s]:s}</option>)}</select></label><label className="field">{t('Nail shape','甲型')}<select value={values.shape} onChange={e=>change('shape',e.target.value)}>{['Any','Almond','Round','Squoval','Square','Coffin'].map((s,i)=><option key={s} value={s}>{lang==='zh'?['不限','杏仁形','圆形','方圆形','方形','棺形'][i]:s}</option>)}</select></label></>}
      {step===2&&<><article className="service-preview"><img src={values.image} alt={values.name}/><div><span className="small muted">{lang==='zh'?STYLE_ZH[values.style]??values.style:values.style} · {values.duration} {t('min','分钟')}</span><h3>{lang==='zh'&&values.name_zh?values.name_zh:values.name}</h3><p>{values.description}</p><strong>{money(Math.round(Number(values.price)*100))}</strong></div></article><label className="toggle-row"><span><strong>{t('Available for booking','开放预约')}</strong><small>{t('Turn off to keep this service hidden.','关闭后，此服务将隐藏。')}</small></span><input role="switch" type="checkbox" checked={values.active} onChange={e=>change('active',e.target.checked)}/></label><label className="toggle-row"><span><strong>{t('Feature this service','推广此服务')}</strong><small>{t('Free during launch. Helps it appear higher in discovery.','上线初期免费，可提高发现页中的排序。')}</small></span><input role="switch" type="checkbox" checked={values.promoted} onChange={e=>change('promoted',e.target.checked)}/></label><p className="inline-help">{t('Existing bookings keep the service and price agreed when requested.','已有预约保留提交请求时的服务信息和价格。')}</p></>}
    </fieldset>
    {uploading&&<p role="status">{t('Uploading photo…','上传照片中…')}</p>}{error&&<ErrorNotice message={error}/>}
    <div className="guide-actions">{step>0&&<button type="button" className="button secondary" disabled={busy||uploading} onClick={()=>go(step-1)}><ArrowLeft size={17}/>{t('Back','返回')}</button>}<button type="submit" className="button primary" disabled={busy||uploading}>{busy?t('Saving…','保存中…'):step===2?t('Save service','保存服务'):t('Continue','继续')}<ArrowRight size={17}/></button></div>
  </form>;
}
