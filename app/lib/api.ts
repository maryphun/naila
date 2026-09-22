import { useCallback, useEffect, useState } from 'react';
export async function apiRequest<T = {ok:boolean}>(path:string, options?:RequestInit):Promise<T> {
  const response=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options?.headers}});
  const result=await response.json() as T & {error?:string};
  if(!response.ok)throw new Error(result.error??'Something went wrong. Please try again.');
  return result as T;
}
export const post=<T = {ok:boolean}>(path:string,data:unknown={},method='POST')=>apiRequest<T>(path,{method,body:JSON.stringify(data)});
export function useApi<T>(path:string|null,interval=0) {
  const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [revision,setRevision]=useState(0);
  const refresh=useCallback(()=>setRevision(n=>n+1),[]);
  useEffect(()=>{
    if(!path){setData(null);setLoading(false);return;}
    let alive=true;const controller=new AbortController();
    setLoading(true);setError('');
    const load=()=>apiRequest<T>(path,{signal:controller.signal}).then(value=>{if(alive){setData(value);setError('');}}).catch(e=>{if(alive&&e.name!=='AbortError')setError(e.message);}).finally(()=>{if(alive)setLoading(false);});
    load();const timer=interval?setInterval(()=>{if(document.visibilityState==='visible')load();},interval):undefined;
    return()=>{alive=false;controller.abort();clearInterval(timer);};
  },[path,revision,interval]);
  return {data,error,loading,refresh};
}
