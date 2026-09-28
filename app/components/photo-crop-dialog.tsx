import { useEffect, useRef, useState } from 'react';
import { Crop, RotateCcw } from 'lucide-react';
import { useApp } from '../lib/context';
import { compressCroppedPhoto, cropRect, moveCrop } from '../lib/photo-crop';
import type { CropPosition } from '../lib/photo-crop';
import { Modal } from './ui';

const previewWidth = 620;
const previewHeight = 400;

export function PhotoCropDialog({file,onCancel,onApply,kind='service'}:{file:File;onCancel:()=>void;onApply:(photo:File)=>Promise<void>;kind?:'service'|'studio'}) {
  const {t,lang}=useApp();
  const studio=kind==='studio';
  const [image,setImage]=useState<HTMLImageElement|null>(null);
  const [position,setPosition]=useState<CropPosition>({centerX:0,centerY:0,zoom:1});
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const canvas=useRef<HTMLCanvasElement>(null);
  const pointer=useRef<{id:number;x:number;y:number}|null>(null);

  useEffect(()=>{
    const url=URL.createObjectURL(file);
    const photo=new Image();
    photo.onload=()=>{
      setImage(photo);
      setPosition({centerX:photo.naturalWidth/2,centerY:photo.naturalHeight/2,zoom:1});
    };
    photo.onerror=()=>setError(lang==='zh'?'无法打开这张照片。请选择另一张。':'This photo could not be opened. Please choose another.');
    photo.src=url;
    return ()=>{photo.onload=null;photo.onerror=null;URL.revokeObjectURL(url);};
  },[file,lang]);

  useEffect(()=>{
    const surface=canvas.current;
    if(!surface||!image)return;
    const context=surface.getContext('2d');
    if(!context)return;
    const rect=cropRect(image.naturalWidth,image.naturalHeight,position);
    context.clearRect(0,0,previewWidth,previewHeight);
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(image,rect.x,rect.y,rect.width,rect.height,0,0,previewWidth,previewHeight);
  },[image,position]);

  const reset=()=>{if(image)setPosition({centerX:image.naturalWidth/2,centerY:image.naturalHeight/2,zoom:1});};
  const drag=(deltaX:number,deltaY:number)=>{
    if(!image||!canvas.current)return;
    const rect=cropRect(image.naturalWidth,image.naturalHeight,position);
    const bounds=canvas.current.getBoundingClientRect();
    setPosition(current=>moveCrop(image.naturalWidth,image.naturalHeight,current,-deltaX*rect.width/bounds.width,-deltaY*rect.height/bounds.height));
  };
  const apply=async()=>{
    if(!image||busy)return;
    setBusy(true);setError('');
    try{await onApply(await compressCroppedPhoto(image,position,file.type));}
    catch(e){setError((e as Error).message);setBusy(false);}
  };
  return <Modal open onOpenChange={open=>{if(!open&&!busy)onCancel();}} title={studio?t('Crop your studio photo','裁剪工作室照片'):t('Crop your service photo','裁剪服务照片')} description={studio?t('Frame your studio for discovery and your nailist page. Only the cropped photo will be uploaded.','调整工作室照片构图，用于发现页及美甲师主页。仅上传裁剪后的照片。'):t('Drag to frame your work, then adjust the zoom. Only this cropped photo will be uploaded.','拖动照片调整构图，再调节缩放。仅上传裁剪后的照片。')} className="photo-crop-dialog" purpose="form">
    <section className="photo-crop-body">
      <figure className="photo-crop-preview"><canvas ref={canvas} width={previewWidth} height={previewHeight} tabIndex={image&&!busy?0:-1} role="img" aria-label={studio?t('Studio photo preview. Drag or use arrow keys to reposition.','工作室照片预览。拖动或使用方向键调整位置。'):t('Menu photo preview. Drag or use arrow keys to reposition.','菜单照片预览。拖动或使用方向键调整位置。')} onPointerDown={event=>{if(!image||busy)return;pointer.current={id:event.pointerId,x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}} onPointerMove={event=>{const last=pointer.current;if(!last||last.id!==event.pointerId)return;drag(event.clientX-last.x,event.clientY-last.y);pointer.current={...last,x:event.clientX,y:event.clientY};}} onPointerUp={event=>{if(pointer.current?.id===event.pointerId)pointer.current=null;}} onPointerCancel={()=>{pointer.current=null;}} onKeyDown={event=>{if(!image||busy||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key))return;event.preventDefault();const rect=cropRect(image.naturalWidth,image.naturalHeight,position);const amountX=rect.width*.05,amountY=rect.height*.05;setPosition(current=>moveCrop(image.naturalWidth,image.naturalHeight,current,event.key==='ArrowLeft'?-amountX:event.key==='ArrowRight'?amountX:0,event.key==='ArrowUp'?-amountY:event.key==='ArrowDown'?amountY:0));}}/><figcaption>{studio?t('Preview · your studio image in discovery and on your nailist page','预览 · 您的工作室照片在发现页和美甲师主页中的效果'):t('Preview · this is how the photo appears on your nail menu','预览 · 照片在美甲菜单中的显示效果')}</figcaption></figure>
      {!image&&!error&&<p role="status" className="muted">{t('Preparing photo…','正在准备照片…')}</p>}
      <label className="photo-crop-zoom">{t('Zoom','缩放')}<input type="range" min="1" max="3" step="0.05" value={position.zoom} disabled={!image||busy} onChange={event=>setPosition(current=>({...current,zoom:Number(event.target.value)}))} aria-label={t('Photo zoom','照片缩放')}/><output>{Math.round(position.zoom*100)}%</output></label>
      <button type="button" className="text-button photo-crop-reset" onClick={reset} disabled={!image||busy}><RotateCcw size={16}/>{t('Reset crop','重置裁剪')}</button>
      {error&&<p role="alert" className="field-error photo-crop-error">{error}</p>}
      <footer className="photo-crop-actions"><button type="button" className="button secondary" onClick={onCancel} disabled={busy}>{t('Cancel','取消')}</button><button type="button" className="button primary" onClick={()=>void apply()} disabled={!image||busy}><Crop size={17}/>{busy?t('Compressing & uploading…','正在压缩并上传…'):t('Crop and upload','裁剪并上传')}</button></footer>
    </section>
  </Modal>;
}
