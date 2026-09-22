import { createContext,useContext,useEffect,useState,useCallback } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import type { Language,SessionInfo } from './types';
import { apiRequest,post } from './api';

interface AppState {
  session:SessionInfo; refreshSession:()=>Promise<void>;
  lang:Language;setLang:(lang:Language)=>void;t:(en:string,zh:string)=>string;
  saved:string[];toggleSaved:(id:string)=>void;
  authOpen:boolean;setAuthOpen:(open:boolean)=>void;
  toast:(message:string)=>void;toastMessage:string;
  demoLogin:(role:'customer'|'merchant'|'admin')=>Promise<void>;
}
const Context=createContext<AppState|null>(null);
export function AppProvider({initial,language,children}:{initial:SessionInfo;language:Language;children:ReactNode}) {
  const [session,setSession]=useState(initial),[lang,setLanguage]=useState<Language>(language),[saved,setSaved]=useState<string[]>([]),[authOpen,setAuthOpen]=useState(false),[toastMessage,setToast]=useState('');
  const navigate=useNavigate();
  useEffect(()=>{try{setSaved(JSON.parse(localStorage.getItem('hotlah:saved')??'[]'));}catch{setSaved([]);}},[]);
  useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-Hans':'en';document.documentElement.dataset.hydrated='true';},[lang]);
  useEffect(()=>{if(!toastMessage)return;const timer=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(timer);},[toastMessage]);
  const setLang=(next:Language)=>{setLanguage(next);document.cookie=`hotlah_lang=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;};
  const refreshSession=useCallback(async()=>{setSession(await apiRequest<SessionInfo>('/api/session'));},[]);
  const toggleSaved=(id:string)=>setSaved(previous=>{const next=previous.includes(id)?previous.filter(x=>x!==id):[...previous,id];localStorage.setItem('hotlah:saved',JSON.stringify(next));return next;});
  const demoLogin=async(role:'customer'|'merchant'|'admin')=>{await post('/api/demo/login',{role});await refreshSession();setAuthOpen(false);if(role==='merchant')navigate('/merchant');if(role==='admin')navigate('/admin');};
  return <Context.Provider value={{session,refreshSession,lang,setLang,t:(en,zh)=>lang==='zh'?zh:en,saved,toggleSaved,authOpen,setAuthOpen,toast:setToast,toastMessage,demoLogin}}>{children}</Context.Provider>;
}
export function useApp(){const value=useContext(Context);if(!value)throw new Error('AppProvider missing');return value;}
