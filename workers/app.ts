import { createRequestHandler,RouterContextProvider } from 'react-router';
import { cloudflareContext } from '../server/router-context';
import { api } from '../server/api';
import { maintain } from '../server/domain';
import type { Env } from '../server/env';

const handler = createRequestHandler(() => import('virtual:react-router/server-build'), import.meta.env.MODE);
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (new URL(request.url).pathname.startsWith('/api/')) return api.fetch(request,env,ctx);
    const context=new RouterContextProvider();
    context.set(cloudflareContext,{env,ctx});
    const response=await handler(request,context);
    response.headers.set('X-Content-Type-Options','nosniff');
    response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy','geolocation=(self), camera=(), microphone=()');
    return response;
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) { ctx.waitUntil(maintain(env)); },
} satisfies ExportedHandler<Env>;
