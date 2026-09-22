import { Link,useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../lib/context';
import { MerchantForm } from '../components/merchant-form';
import { PageHeader,AuthRequired } from '../components/ui';
export default function Join(){
  const {t,session,refreshSession,toast}=useApp();const navigate=useNavigate();
  return <div className="narrow-page"><PageHeader title={t('Set up your studio','设置您的店铺')} back="/account"/>
    {session.merchant?<div className="empty-state"><h2>{t(session.merchant.approved?'Your workspace is ready':'Your application is in review',session.merchant.approved?'工作台已准备好':'申请正在审核中')}</h2><p>{t('Build your menu and update your profile in Your business.','在经营空间中建立菜单并更新资料。')}</p><Link to="/merchant/business" className="button primary">{t('Manage my business','管理经营空间')}<ArrowRight size={18}/></Link></div>
    :session.user?<MerchantForm onSaved={async()=>{await refreshSession();toast(t('Application sent. Let’s build your menu.','申请已提交。接下来建立服务菜单。'));navigate('/merchant/business?welcome=1');}}/>:<AuthRequired merchant/>}
  </div>;
}
