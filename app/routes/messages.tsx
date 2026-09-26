import { Link,useSearchParams } from 'react-router';
import { MessageCircle,ChevronRight } from 'lucide-react';
import { useApp } from '../lib/context';
import { useApi } from '../lib/api';
import type { InboxConversation } from '../lib/types';
import { AuthRequired,Loading,ErrorNotice,Empty,StatusBadge } from '../components/ui';

export default function Messages(){
  const {session,t}=useApp();
  const [params]=useSearchParams();
  const merchant=params.get('view')==='merchant';
  const {data,error,loading,refresh}=useApi<{conversations:InboxConversation[]}>(session.user?`/api/conversations${merchant?'?view=merchant':''}`:null,15000);
  if(!session.user)return <AuthRequired/>;
  return <section className="narrow-page">
    <header className="page-intro"><h1>{t('Messages','消息')}</h1></header>
    {error&&<ErrorNotice message={error} retry={refresh}/>}
    {loading&&!data?<Loading/>:data?.conversations.length?<section className="inbox-list" aria-label={t('Conversations','对话')}>
      {data.conversations.map(item=>item.kind==='booking' ? item.booking.locked&&!item.booking.name ?
        <section key={item.id} className="inbox-row"><MessageCircle/><section className="inbox-copy"><h3>{t('New booking request','新的预约请求')}</h3><Link to="/merchant">{t('Open your workspace to continue','前往工作台查看')}</Link></section></section>
        :<Link className="inbox-row" to={`/bookings/${item.id}${merchant?'?view=merchant':''}`} key={item.id}>
          <span className="avatar">{(merchant?item.booking.customer_name:item.booking.merchant_name)?.slice(0,1)}</span>
          <section className="inbox-copy"><h3>{merchant?item.booking.customer_name:item.booking.merchant_name}</h3><p>{item.booking.name}</p><StatusBadge status={item.booking.status}/></section><ChevronRight size={20}/>
        </Link>
        :<Link className={`inbox-row support-inbox-row${item.unread?' is-unread':''}`} to={`/messages/${item.id}${merchant?'?view=merchant':''}`} key={item.id}>
          <span className="avatar"><MessageCircle size={19}/></span>
          <section className="inbox-copy"><small className="inbox-kind">{item.kind==='app_feedback'?t('Feedback','反馈'):t('Customer Service','客户服务')}</small><h3>{item.kind==='app_feedback'?item.subject:t('Hotlah Customer Service','Hotlah 客户服务')}</h3><p>{session.admin&&item.owner_id!==session.user!.id?`${item.owner_name}${item.merchant_account?` · ${t('Nailist','美甲师')}`:''}`:item.last_message??t('How can we help?','我们能帮您什么？')}</p></section>
          {item.unread>0&&<span className="inbox-unread" aria-label={t(`${item.unread} unread messages`,`${item.unread} 条未读消息`)}>{item.unread}</span>}
          <ChevronRight size={20}/>
        </Link>)}
    </section>:<Empty title={t('Your conversations live here','在这里管理对话')} description={t('Booking chats, feedback and Customer Service will appear here.','预约对话、反馈和客户服务消息会显示在这里。')}/>}
  </section>;
}
