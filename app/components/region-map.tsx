import { useState } from 'react';
import { Minus,Plus,ArrowUp } from 'lucide-react';
import { useApp } from '../lib/context';
import regions from '../data/regions.json';

export function RegionMap({value,onSelect}:{value:string;onSelect:(value:string)=>void}){
  const {t}=useApp();const [zoom,setZoom]=useState(1);
  return <div className="region-map">
    <div className="map-toolbar"><span>{t('Tap a district to explore','轻点地区开始探索')}</span><div><button className="icon-button" aria-label={t('Zoom out','缩小地图')} disabled={zoom===1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}><Minus size={17}/></button><button className="icon-button" aria-label={t('Zoom in','放大地图')} disabled={zoom===2} onClick={()=>setZoom(z=>Math.min(2,z+.5))}><Plus size={17}/></button></div></div>
    <div className="map-viewport" tabIndex={0} aria-label={t('Scrollable district map','可滚动地区地图')}>
      <svg viewBox={'0 0 '+regions.width+' '+regions.height} style={{width:zoom*100+'%'}} role="group" aria-label={t('Kuala Lumpur and Selangor district map','吉隆坡及雪兰莪地区地图')}>
        <text x="35" y="285" className="map-water"><tspan x="35">STRAIT OF</tspan><tspan x="35" dy="15">MALACCA</tspan></text>
        {regions.regions.map(r=><g key={r.name}>
          <path d={r.path} className={value===r.name?'selected':''} fillRule="evenodd" tabIndex={0} role="button" aria-label={'Select '+r.name} aria-pressed={value===r.name} onClick={()=>onSelect(r.name)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(r.name);}}}/>
          <text x={r.center[0]} y={r.center[1]} className="district-label" pointerEvents="none" textAnchor="middle">{r.name.split(' ').length>1?r.name.split(' ').map((word,i)=><tspan key={i} x={r.center[0]} dy={i?12:0}>{word}</tspan>):r.name}</text>
        </g>)}
      </svg>
    </div>
    <div className="map-caption"><span><span className="map-key"/>{t('Selected district','已选地区')}</span><span>N <ArrowUp size={12}/></span></div>
    <p className="map-attribution">{t('District boundaries','地区边界')}: <a href={regions.url} target="_blank" rel="noreferrer">DOSM Malaysia</a></p>
  </div>;
}
