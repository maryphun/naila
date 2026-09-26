import type { FormEvent,ReactNode } from 'react';
import { Send } from 'lucide-react';
import type { Language,Message } from '../lib/types';
import { useApp } from '../lib/context';
import { ErrorNotice } from './ui';

export function MessageThread({messages,currentUserId,lang,title,empty,placeholder,body,onBodyChange,onSend,busy,closed=false,failure,footer}:{
  messages:Message[];currentUserId:string;lang:Language;title:string;empty:string;placeholder:string;body:string;
  onBodyChange:(body:string)=>void;onSend:()=>void;busy:boolean;closed?:boolean;failure:string;footer?:ReactNode;
}){
  const {t}=useApp();
  const submit=(event:FormEvent)=>{event.preventDefault();if(!busy&&!closed&&body.trim())onSend();};
  return <section className="chat-panel">
    <header className="chat-intro"><h2>{title}</h2></header>
    <section className="message-list" aria-live="polite">{messages.length?messages.map(message=><article key={message.id} className={`message ${message.sender_id===currentUserId?'mine':''}`}>
      <small>{message.sender_id===currentUserId?t('You','您'):message.sender_name}</small>
      <p>{message.body}</p>
      <time>{new Date(message.created_at.replace(' ','T')+'Z').toLocaleTimeString(lang==='zh'?'zh-CN':'en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Asia/Kuala_Lumpur'})}</time>
    </article>):<p className="chat-empty">{empty}</p>}</section>
    {failure&&<ErrorNotice message={failure}/>}
    <form className="message-composer" onSubmit={submit}><input aria-label={t('Message','消息')} placeholder={placeholder} value={body} onChange={event=>onBodyChange(event.target.value)} maxLength={1500} disabled={closed}/><button className="icon-button send-button" type="submit" aria-label={t('Send message','发送消息')} disabled={busy||!body.trim()||closed}><Send size={20}/></button></form>
    {footer}
  </section>;
}
