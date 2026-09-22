import { useState } from 'react';
import { Navigation,Check,MapPin,ArrowRight } from 'lucide-react';
import { useApp } from '../lib/context';
import { Modal } from './ui';
import { RegionMap } from './region-map';
import regions from '../data/regions.json';

export type SearchLocation={area:string;coords:[number,number]|null;radius:number};
const neighbourhoods=['Petaling Jaya','Damansara','Subang','Shah Alam','Cheras','Ampang','Puchong','Kajang','Banting'];
export function LocationPicker({value,onApply,onClose}:{value:SearchLocation;onApply:(value:SearchLocation)=>void;onClose:()=>void}){
  const {t}=useApp();const [draft,setDraft]=useState(value),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const choose=(area:string)=>{setDraft(d=>({...d,area,coords:null}));setError('');};
  const locate=()=>{
    if(!navigator.geolocation){setError(t('Location is unavailable. Choose a district or neighbourhood below.','无法定位，请在下方选择地区。'));return;}
    setBusy(true);setError('');
    navigator.geolocation.getCurrentPosition(p=>{setDraft(d=>({...d,coords:[p.coords.latitude,p.coords.longitude],area:'All areas'}));setBusy(false);},()=>{setError(t('We couldn’t get your location. Allow location access or choose an area below.','无法获取位置。请允许定位或在下方选择地区。'));setBusy(false);},{timeout:10000});
  };
  return <Modal open onOpenChange={open=>{if(!open)onClose();}} className="location-dialog" title={t('Find your neighbourhood.','找到您的附近好店。')} description={t('Explore KL & Selangor, a little closer to you.','探索吉隆坡与雪兰莪的附近美甲师。')}>
    <div className="location-body">
      <button className={'location-current '+(draft.coords?'selected':'')} disabled={busy} onClick={locate}><Navigation size={20}/><span><strong>{busy?t('Finding you…','定位中…'):draft.coords?t('Using your location','已使用您的位置'):t('Use my location','使用我的位置')}</strong><small>{t('Discover nailists within your chosen distance','按您选择的距离寻找美甲师')}</small></span>{draft.coords?<Check size={18}/>:<ArrowRight size={18}/>}</button>
      {error&&<p className="field-error" role="alert">{error}</p>}
      <RegionMap value={draft.area} onSelect={choose}/>
      <div className="distance-control"><label htmlFor="search-radius">{t('Search distance','搜索距离')}<output htmlFor="search-radius">{draft.radius} km</output></label><input id="search-radius" type="range" min="1" max="50" step="1" value={draft.radius} onChange={e=>setDraft(d=>({...d,radius:Number(e.target.value)}))} aria-valuetext={draft.radius+' kilometres'} aria-describedby="radius-help"/><div className="range-labels"><span>1 km</span><span>50 km</span></div><p id="radius-help">{draft.coords?t('Straight-line distance from your location.','距您当前位置的直线距离。'):t('Use your location above to apply this distance. Area selection searches the whole area.','使用上方定位来应用距离。选择地区时将搜索整个地区。')}</p></div>
      <label className="field">{t('District','地区')}<select value={regions.regions.some(r=>r.name===draft.area)||draft.area==='All areas'?draft.area:''} onChange={e=>choose(e.target.value)}><option value="All areas">{t('All KL & Selangor','整个吉隆坡及雪兰莪')}</option><option value="" disabled>{t('Neighbourhood selected','已选择街区')}</option>{regions.regions.map(r=><option key={r.name}>{r.name}</option>)}</select></label>
      <div className="neighbourhood-picker"><h3>{t('Or pick a neighbourhood','或选择一个街区')}</h3><div className="chips-wrap">{neighbourhoods.map(area=><button key={area} className={'chip '+(draft.area===area?'selected':'')} aria-pressed={draft.area===area} onClick={()=>choose(area)}>{area}</button>)}</div></div>
    </div>
    <footer className="location-apply"><div><MapPin size={17}/><span>{draft.coords?t('Within '+draft.radius+' km of you','您周边 '+draft.radius+' 公里'):draft.area==='All areas'?t('All KL & Selangor','整个吉隆坡及雪兰莪'):draft.area}</span></div><button className="button primary full" disabled={busy} onClick={()=>onApply(draft)}>{t('Search this area','搜索此地区')}<ArrowRight size={17}/></button></footer>
  </Modal>;
}
