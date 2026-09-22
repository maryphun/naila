import type { RouterContextProvider } from 'react-router';
import { cloudflareContext } from '../../server/router-context';
import { api } from '../../server/api';
import type { Env } from '../../server/env';
export async function serverApi<T>(request:Request,context:Readonly<RouterContextProvider>,path:string):Promise<T> {
  const {env}=context.get(cloudflareContext);
  const response=await api.fetch(new Request(new URL(path,request.url),{headers:request.headers}),env);
  if(!response.ok)throw new Response('Not found',{status:response.status});
  return response.json() as Promise<T>;
}
