import { useState } from 'react';
import { Plus,Trash2 } from 'lucide-react';
import { useApp } from '../lib/context';
import { useApi,post } from '../lib/api';
import type { Booking } from '../lib/types';
import { localDate,time,friendlyDate } from '../lib/types';
import { PageHeader,AuthRequired,Loading,ErrorNotice,Modal,HotlahSegmentedControl } from '../components/ui';
import { BookingCard } from '../components/booking-card';

type TimeBlock={id:string;date:string;start_minute:number;end_minute:number};
export default function Calendar(){
  const {session,t,lang,toast}=useApp();
  const [date,setDate]=useState(localDate()),[open,setOpen]=useState(false),[blockMode,setBlockMode]=useState<'time'|'day'>('time'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const bookings=useApi<{bookings:Booking[]}>(session.merchant?'/api/bookings?view=merchant':null);
  const data=useApi<{blocks:TimeBlock[]}>(session.merchant?'/api/merchant':null);
  if(!session.user)return <AuthRequired merchant/>;

  const showBlockDialog=()=>{setBlockMode('time');setError('');setOpen(true);};
  const save=async(e:React.FormEvent<HTMLFormElement>)=>{
    e.preventDefault();
    const form=new FormData(e.currentTarget);
    setBusy(true);setError('');
    try{
      await post('/api/merchant/blocks',blockMode==='day'?{date,allDay:true}:{date,start:form.get('start'),end:form.get('end')});
      data.refresh();setOpen(false);
      toast(blockMode==='day'?t('Whole day blocked. Your availability is updated.','已屏蔽全天，可预约时间已更新。'):t('Time blocked. Your availability is updated.','时段已屏蔽，可预约时间已更新。'));
    }catch(error){setError((error as Error).message);}
    finally{setBusy(false);}
  };
  const blocks=data.data?.blocks.filter(block=>block.date===date)??[];
  return <div className="narrow-page">
    <PageHeader title={t('Your calendar','您的日历')} back="/merchant"/>
    <div className="section-heading"><label className="field">{t('Choose date','选择日期')}<input type="date" min={localDate()} value={date} onChange={e=>setDate(e.target.value)}/></label><button className="button primary" onClick={showBlockDialog}><Plus size={18}/>{t('Block time','屏蔽时段')}</button></div>
    <h2>{friendlyDate(date,lang)}</h2>
    {bookings.loading?<Loading/>:<div className="booking-list motion-stagger">{bookings.data?.bookings.filter(booking=>booking.date===date&&booking.status==='approved').map(booking=><BookingCard key={booking.id} booking={booking} merchant/>)}</div>}
    <h3 className="subheading">{t('Unavailable times','不可预约时段')}</h3>
    {blocks.map(block=>{const allDay=block.start_minute===0&&block.end_minute===1440;return <div key={block.id} className="option-row"><span>{allDay?t('Whole day','全天'):`${time(block.start_minute)} – ${time(block.end_minute)}`}</span><button className="icon-button" aria-label={allDay?t('Remove whole-day block','移除全天屏蔽'):t('Remove time block','移除时段屏蔽')} onClick={async()=>{try{await post(`/api/merchant/blocks/${block.id}`,{},'DELETE');data.refresh();}catch(error){toast((error as Error).message);}}}><Trash2 size={18}/></button></div>;})}
    {!blocks.length&&<p className="muted">{t('No time blocks for this day. Your usual business hours apply.','当天没有屏蔽时段，按正常营业时间开放预约。')}</p>}
    {data.error&&<ErrorNotice message={data.error}/>}
    <Modal open={open} onOpenChange={next=>{if(!busy)setOpen(next);}} title={t('A little time off','留点休息时间')} description={t('Existing confirmed appointments cannot be blocked.','无法屏蔽已确认的预约时段。')}>
      <form className="form-stack" onSubmit={save}>
        <p>{friendlyDate(date,lang)}</p>
        <HotlahSegmentedControl value={blockMode} onChange={value=>{setBlockMode(value as 'time'|'day');setError('');}} label={t('Block duration','屏蔽范围')} options={[{value:'time',label:t('Specific time','指定时段')},{value:'day',label:t('Whole day','全天')}]} size="sm"/>
        {blockMode==='time'?<div className="form-grid"><label className="field">{t('From','开始')}<input name="start" type="time" defaultValue="13:00" required/></label><label className="field">{t('Until','结束')}<input name="end" type="time" defaultValue="14:00" required/></label></div>:<p className="muted small">{t('No new appointments will be available on this date.','当天将不再开放新预约。')}</p>}
        {error&&<ErrorNotice message={error}/>}
        <button className="button primary full" disabled={busy}>{busy?t('Saving…','保存中…'):blockMode==='day'?t('Block whole day','屏蔽全天'):t('Block this time','屏蔽此时段')}</button>
      </form>
    </Modal>
  </div>;
}
