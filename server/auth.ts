import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import { getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';
import type { Context } from 'hono';
import * as schema from './auth-schema';
import type { ApiContext, Actor, Env } from './env';

export function auth(env: Env) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.APP_URL,
    basePath: '/api/auth',
    database: drizzleAdapter(drizzle(env.DB, { schema }), { provider: 'sqlite', schema, transaction: false }),
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } } : {}),
      ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET ? { apple: { clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET } } : {}),
      ...(env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET ? { facebook: { clientId: env.FACEBOOK_CLIENT_ID, clientSecret: env.FACEBOOK_CLIENT_SECRET } } : {}),
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
        allowDifferentEmails: false,
        requireLocalEmailVerified: false,
      },
    },
    trustedOrigins: [env.APP_URL],
    rateLimit: { enabled: true, storage: 'memory', window: 60, max: 30 },
  });
}
export function isLocalDemo(env: Env, url: string) {
  return env.DEMO_MODE === 'true' && ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(url).hostname);
}
export async function actorFor(c: Context<ApiContext>): Promise<Actor | null> {
  if (c.get('demo') && c.env.BETTER_AUTH_SECRET) {
    const token = getCookie(c, 'hotlah_preview');
    if (token) {
      try {
        const payload = await verify(token, c.env.BETTER_AUTH_SECRET, 'HS256');
        if (typeof payload.sub === 'string' && payload.sub.startsWith('demo-'))
          return await c.env.DB.prepare('SELECT id,name,email,image FROM user WHERE id=?').bind(payload.sub).first<Actor>();
      } catch { /* An expired or invalid cookie is an anonymous session. */ }
    }
  }
  if (!c.env.BETTER_AUTH_SECRET) return null;
  const result = await auth(c.env).api.getSession({ headers: c.req.raw.headers });
  return result?.user ?? null;
}
export function isAdmin(actor: Actor | null, env: Env, demo: boolean) {
  if (!actor) return false;
  return demo && actor.id === 'demo-admin' || (env.ADMIN_EMAILS ?? '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(actor.email.toLowerCase());
}
