export interface Env {
  DB: D1Database;
  MEDIA?: R2Bucket;
  DEMO_MODE?: string;
  APP_URL: string;
  BETTER_AUTH_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  FACEBOOK_CLIENT_ID?: string;
  FACEBOOK_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ADMIN_EMAILS?: string;
}
export interface Actor { id: string; name: string; email: string; image?: string | null }
export type ApiContext = { Bindings: Env; Variables: { actor: Actor | null; demo: boolean } };
