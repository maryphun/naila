import { useEffect,useRef,useState } from 'react';
import { useParams,useSearchParams } from 'react-router';
import { useApp } from '../lib/context';
import { post,useApi } from '../lib/api';
import type { Message,SupportConversation } from '../lib/types';
import { AuthRequired,ErrorNotice,Loading,PageHeader } from '../components/ui';
import { MessageThread } from '../components/message-thread';

export default function SupportConversationPage(){
  const {id}=useParams();
  const [params]=useSearchParams();
  const {session,t,lang}=useApp();
  const {data,error,loading,refresh}=useApi<{conversation:SupportConversation;messages:Message[]}>(session.user&&id?`/api/conversations/${id}`:null,10000);
  const [body,setBody]=useState('');
  const [busy,setBusy]=useState(false);
  const [failure,setFailure]=useState('');
  const sending=useRef(false),lastRead=useRef('');
  const back=params.get('view')==='merchant'?'/messages?view=merchant':'/messages';
  const latestMessage=data?.messages.at(-1)?.id??'empty';
  useEffect(()=>{
    if(!data||!id||lastRead.current===latestMessage)return;
    lastRead.current=latestMessage;
    post(`/api/conversations/${id}/read`).then(()=>window.dispatchEvent(new Event('hotlah:notifications-changed'))).catch(()=>{lastRead.current='';});
  },[data,id,latestMessage]);
  if(!session.user)return <AuthRequired/>;
  if(loading&&!data)return <section className="narrow-page"><PageHeader title={t('Messages','消息')} back={back}/><Loading/></section>;
  if(error&&!data)return <section className="narrow-page"><PageHeader title={t('Messages','消息')} back={back}/><ErrorNotice message={error} retry={refresh}/></section>;
  if(!data)return null;
  const conversation=data.conversation;
  const isFeedback=conversation.type==='app_feedback';
  const title=isFeedback?conversation.subject??t('Feedback','反馈'):t('Hotlah Customer Service','Hotlah 客户服务');
  const send=async()=>{
    if(sending.current||!body.trim())return;
    sending.current=true;setBusy(true);setFailure('');
    try{await post(`/api/conversations/${id}/messages`,{body});setBody('');refresh();}
    catch(cause){setFailure((cause as Error).message);}
    finally{sending.current=false;setBusy(false);}
  };
  return <section className="conversation-page support-conversation-page">
    <PageHeader title={title} back={back}/>
    <header className="support-thread-context">
      <span className="inbox-kind">{isFeedback?t('Feedback','反馈'):t('Customer Service','客户服务')}</span>
      {session.admin&&conversation.owner_id!==session.user.id&&<p>{conversation.owner_name} · {conversation.owner_email}{conversation.merchant_account?` · ${t('Nailist','美甲师')}`:''}</p>}
      {isFeedback&&conversation.category&&<p>{({feature_request:t('Feature request','功能建议'),ui_ux:t('UI / UX','界面与体验'),bug:t('Bug','问题反馈'),merchant_tools:t('Merchant tools','商家工具'),booking_experience:t('Booking experience','预约体验'),other:t('Other','其他')} as Record<string,string>)[conversation.category]}</p>}
    </header>
    <MessageThread messages={data.messages} currentUserId={session.user.id} lang={lang} title={t('Chat','聊天')} empty={t('How can we help?','我们能帮您什么？')} placeholder={t('Write a message…','输入消息…')} body={body} onBodyChange={setBody} onSend={send} busy={busy} failure={failure}/>
  </section>;
}
