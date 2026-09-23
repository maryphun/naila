import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { bodyLimit } from 'hono/body-limit';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { actorFor, auth, isAdmin, isLocalDemo } from './auth';
import { assertMerchantAccess, bookingSql, checkFuture, computeSlots, dayInMalaysia, getSlots, minutes, notify, ownedBooking, publicCatalogueSql, publicMerchant, sanitizeBooking, validDate } from './domain';
import { localDate } from '../app/lib/types';
import type { BookingRow } from './domain';
import type { ApiContext, Actor } from './env';
import type { Service } from '../app/lib/types';

export const api = new Hono<ApiContext>();
const uuid = () => crypto.randomUUID();
const requireActor = (actor: Actor | null) => { if (!actor) throw new HTTPException(401, { message: 'Please sign in to continue.' }); return actor; };
const requireAdmin = (c: Parameters<typeof actorFor>[0]) => {
  const actor=requireActor(c.get('actor'));
  if(!isAdmin(actor,c.env,c.get('demo')))throw new HTTPException(403,{message:'Administrator access is required.'});
  return actor;
};
api.use('/api/*', bodyLimit({ maxSize: 5 * 1024 * 1024, onError: c => c.json({ error: 'Please choose a photo smaller than 5 MB.' }, 413) }));
api.use('/api/*', async (c, next) => {
  c.header('Cache-Control', 'no-store');
  c.header('X-Content-Type-Options', 'nosniff');
  const origin = c.req.header('Origin');
  if (!['GET','HEAD','OPTIONS'].includes(c.req.method) && !c.req.path.startsWith('/api/auth/')) {
    if (origin && origin !== new URL(c.req.url).origin) throw new HTTPException(403, { message: 'This request must come from Hotlah.' });
    if (c.req.header('Sec-Fetch-Site') === 'cross-site') throw new HTTPException(403, { message: 'Cross-site request rejected.' });
    if (!c.req.header('Content-Type')?.includes('application/json') && !c.req.path.startsWith('/api/uploads')) throw new HTTPException(415, { message: 'Use a JSON request.' });
  }
  c.set('demo', isLocalDemo(c.env, c.req.url));
  c.set('actor', await actorFor(c));
  await next();
});
api.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
  if (error instanceof z.ZodError) return c.json({ error: error.issues[0]?.message ?? 'Please check the form.' }, 400);
  if (/SLOT_TAKEN|SLOT_BLOCKED|APPOINTMENT_EXISTS/.test(error.message)) return c.json({ error: 'That time is no longer available. Please choose another time.' }, 409);
  console.error('Hotlah API error:', error.message);
  return c.json({ error: 'Something went wrong. Please try again.' }, 500);
});

api.on(['GET','POST'], ['/api/auth/*'], async c => {
  if (!c.env.BETTER_AUTH_SECRET) return c.json({ error: 'Sign-in is not configured yet.' }, 503);
  return await auth(c.env).handler(c.req.raw);
});
api.get('/api/session', async c => {
  const actor = c.get('actor');
  const merchant = actor ? await c.env.DB.prepare('SELECT * FROM merchants WHERE user_id=?').bind(actor.id).first<Record<string, unknown>>() : null;
  return c.json({ user: actor, demo: c.get('demo'), admin: isAdmin(actor,c.env,c.get('demo')), merchant: merchant ? { ...publicMerchant(merchant), approved: merchant.approved, auto_approve: merchant.auto_approve, subscribed: merchant.subscribed } : null,
    providers: { google: !!(c.env.GOOGLE_CLIENT_ID && c.env.GOOGLE_CLIENT_SECRET), apple: !!(c.env.APPLE_CLIENT_ID && c.env.APPLE_CLIENT_SECRET), facebook: !!(c.env.FACEBOOK_CLIENT_ID && c.env.FACEBOOK_CLIENT_SECRET) } });
});
api.post('/api/demo/login', async c => {
  if (!c.get('demo') || !c.env.BETTER_AUTH_SECRET) throw new HTTPException(404);
  const { role } = z.object({ role: z.enum(['customer','merchant','admin']) }).parse(await c.req.json());
  const token = await sign({ sub: `demo-${role}`, exp: Math.floor(Date.now()/1000) + 86400 }, c.env.BETTER_AUTH_SECRET, 'HS256');
  setCookie(c,'hotlah_preview',token,{httpOnly:true,sameSite:'Lax',path:'/',maxAge:86400});
  return c.json({ ok: true });
});
api.post('/api/logout', async c => {
  deleteCookie(c,'hotlah_preview',{path:'/'});
  const response=c.json({ok:true});
  if (c.env.BETTER_AUTH_SECRET) {
    const signedOut=await auth(c.env).api.signOut({headers:c.req.raw.headers,asResponse:true}).catch(()=>null);
    for(const cookie of signedOut?.headers.getSetCookie()??[])response.headers.append('Set-Cookie',cookie);
  }
  return response;
});
api.get('/api/catalog', async c => {
  const result = await c.env.DB.prepare(`${publicCatalogueSql} ORDER BY s.promoted DESC,s.rowid`).all<Service>();
  const first=localDate(),last=localDate(13);
  const hours=await c.env.DB.prepare('SELECT id,hours FROM merchants WHERE approved=1').all<{id:string;hours:string}>();
  const occupied=await c.env.DB.prepare(`SELECT merchant_id,date,start_minute,end_minute FROM bookings WHERE status IN ('approved','completed') AND date BETWEEN ? AND ? UNION ALL SELECT merchant_id,date,start_minute,end_minute FROM blocks WHERE date BETWEEN ? AND ?`).bind(first,last,first,last).all<{merchant_id:string;date:string;start_minute:number;end_minute:number}>();
  const schedules=new Map(hours.results.map(m=>[m.id,JSON.parse(m.hours)]));
  const services=result.results.map(service=>{
    let next_available:Service['next_available']=null;
    for(let offset=0;offset<14&&!next_available;offset++){
      const date=localDate(offset);
      const slot=computeSlots(schedules.get(service.merchant_id),date,service.duration,service.buffer,occupied.results.filter(b=>b.merchant_id===service.merchant_id&&b.date===date)).find(s=>s.available);
      if(slot)next_available={date,minute:slot.minute};
    }
    return {...service,next_available};
  });
  return c.json({ services, demo: c.get('demo') });
});
api.get('/api/merchants/:id', async c => {
  const merchant = await c.env.DB.prepare('SELECT * FROM merchants WHERE id=? AND approved=1').bind(c.req.param('id')).first<Record<string,unknown>>();
  if (!merchant) throw new HTTPException(404, {message:'This nailist is not available.'});
  const services = await c.env.DB.prepare(`${publicCatalogueSql} AND m.id=? ORDER BY s.promoted DESC,s.rowid`).bind(c.req.param('id')).all<Service>();
  if (!services.results.length) throw new HTTPException(404, {message:'This nailist is not available.'});
  const first=localDate(),last=localDate(13);
  const occupied=await c.env.DB.prepare(`SELECT date,start_minute,end_minute FROM bookings WHERE merchant_id=? AND status IN ('approved','completed') AND date BETWEEN ? AND ? UNION ALL SELECT date,start_minute,end_minute FROM blocks WHERE merchant_id=? AND date BETWEEN ? AND ?`).bind(c.req.param('id'),first,last,c.req.param('id'),first,last).all<{date:string;start_minute:number;end_minute:number}>();
  const schedule=JSON.parse(String(merchant.hours));
  const menu=services.results.map(service=>{
    let next_available:Service['next_available']=null;
    for(let offset=0;offset<14&&!next_available;offset++){
      const date=localDate(offset);
      const slot=computeSlots(schedule,date,service.duration,service.buffer,occupied.results.filter(b=>b.date===date)).find(s=>s.available);
      if(slot)next_available={date,minute:slot.minute};
    }
    return {...service,next_available};
  });
  const reviews=await c.env.DB.prepare(`SELECT r.id,r.rating,r.body,r.created_at,u.name FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN user u ON u.id=b.user_id WHERE b.merchant_id=? ORDER BY r.created_at DESC LIMIT 20`).bind(c.req.param('id')).all();
  return c.json({merchant:publicMerchant(merchant),services:menu,reviews:reviews.results});
});
api.get('/api/services/:id', async c => {
  const service = await c.env.DB.prepare(`${publicCatalogueSql} AND s.id=?`).bind(c.req.param('id')).first<Service>();
  if (!service) throw new HTTPException(404, {message:'This service is not available.'});
  const merchant = await c.env.DB.prepare('SELECT * FROM merchants WHERE id=?').bind(service.merchant_id).first<Record<string,unknown>>();
  const reviews = await c.env.DB.prepare(`SELECT r.id,r.rating,r.body,r.created_at,u.name FROM reviews r JOIN bookings b ON b.id=r.booking_id JOIN user u ON u.id=b.user_id WHERE b.merchant_id=? ORDER BY r.created_at DESC LIMIT 20`).bind(service.merchant_id).all();
  return c.json({service,merchant:publicMerchant(merchant!),reviews:reviews.results});
});
api.get('/api/services/:id/availability', async c => {
  const service = await c.env.DB.prepare(`${publicCatalogueSql} AND s.id=?`).bind(c.req.param('id')).first<Service>();
  if (!service) throw new HTTPException(404);
  const date = c.req.query('date') ?? dayInMalaysia();
  return c.json({date,slots:await getSlots(c.env,service,date)});
});
api.get('/api/bookings', async c => {
  const actor = requireActor(c.get('actor'));
  const merchant = c.req.query('view') === 'merchant';
  const rows = await c.env.DB.prepare(`${bookingSql} WHERE ${merchant ? 'm.user_id' : 'b.user_id'}=? ORDER BY CASE WHEN b.status='pending' THEN 0 WHEN b.status='approved' THEN 1 ELSE 2 END,b.date DESC,b.start_minute`).bind(actor.id).all<BookingRow>();
  return c.json({bookings:rows.results.map(row=>sanitizeBooking(row,actor))});
});
api.post('/api/bookings', async c => {
  const actor = requireActor(c.get('actor'));
  const data = z.object({ serviceId:z.string().max(100),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),minute:z.number().int().min(0).max(1439),message:z.string().trim().max(1500).default(''),requestKey:z.string().uuid() }).parse(await c.req.json());
  const existing = await c.env.DB.prepare(`${bookingSql} WHERE b.user_id=? AND b.request_key=?`).bind(actor.id,data.requestKey).first<BookingRow>();
  if (existing) return c.json({booking:sanitizeBooking(existing,actor)});
  const service = await c.env.DB.prepare(`${publicCatalogueSql} AND s.id=?`).bind(data.serviceId).first<Service>();
  if (!service) throw new HTTPException(404,{message:'This service is no longer available.'});
  const merchant = await c.env.DB.prepare('SELECT user_id FROM merchants WHERE id=?').bind(service.merchant_id).first<{user_id:string}>();
  if (merchant?.user_id === actor.id) throw new HTTPException(400,{message:'You cannot book your own service.'});
  checkFuture(data.date,data.minute);
  if (!(await getSlots(c.env,service,data.date)).some(s=>s.minute===data.minute && s.available)) throw new HTTPException(409,{message:'That time is no longer available.'});
  if (/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(data.message)) throw new HTTPException(400,{message:'Please keep contact details out of the request. Contact options unlock after approval.'});
  const id=uuid();
  const statements=[c.env.DB.prepare('INSERT INTO bookings(id,merchant_id,user_id,service_id,date,start_minute,end_minute,name,price,duration,image,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,service.merchant_id,actor.id,service.id,data.date,data.minute,data.minute+service.duration+service.buffer,service.name,service.price,service.duration,service.image,data.requestKey)];
  if(data.message) statements.push(c.env.DB.prepare('INSERT INTO messages(id,booking_id,sender_id,body) VALUES(?,?,?,?)').bind(uuid(),id,actor.id,data.message));
  try { await c.env.DB.batch(statements); }
  catch(error) {
    if(String(error).includes('UNIQUE')) {
      const duplicate=await c.env.DB.prepare(`${bookingSql} WHERE b.user_id=? AND b.request_key=?`).bind(actor.id,data.requestKey).first<BookingRow>();
      if(duplicate)return c.json({booking:sanitizeBooking(duplicate,actor)});
    }
    throw error;
  }
  await notify(c.env,merchant!.user_id,id,'New booking request','You have a new booking request. Open Hotlah to continue.');
  const booking=await ownedBooking(c.env,id,actor);
  await notify(c.env,actor.id,id,booking.status==='approved'?'Booking approved':'Request sent',booking.status==='approved'?'Your appointment is confirmed. Open Hotlah for the details.':'Your booking request was sent. Your appointment is not confirmed yet.');
  return c.json({booking:sanitizeBooking(booking,actor)},201);
});
api.get('/api/bookings/:id', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await ownedBooking(c.env,c.req.param('id'),actor);
  assertMerchantAccess(row,actor);
  const messages=await c.env.DB.prepare('SELECT m.*,u.name sender_name FROM messages m JOIN user u ON u.id=m.sender_id WHERE m.booking_id=? ORDER BY m.created_at,m.rowid').bind(row.id).all();
  return c.json({booking:sanitizeBooking(row,actor),messages:messages.results});
});
api.post('/api/bookings/:id/status', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await ownedBooking(c.env,c.req.param('id'),actor);
  const {status}=z.object({status:z.enum(['approved','declined','cancelled'])}).parse(await c.req.json());
  const merchant=row.merchant_user_id===actor.id;
  if(status==='cancelled' ? row.user_id!==actor.id : !merchant) throw new HTTPException(403);
  assertMerchantAccess(row,actor);
  if(status==='cancelled' ? !['pending','approved'].includes(row.status) : row.status!=='pending') throw new HTTPException(409,{message:'This booking has already changed. Refresh and try again.'});
  if(status==='approved') checkFuture(row.date!,row.start_minute!);
  const update=await c.env.DB.prepare('UPDATE bookings SET status=?,locked=0 WHERE id=? AND status=?').bind(status,row.id,row.status).run();
  if(!update.meta.changes)throw new HTTPException(409,{message:'This booking has already changed.'});
  await notify(c.env,merchant?row.user_id!:row.merchant_user_id,row.id,`Booking ${status}`,`Your booking has been ${status}. Open Hotlah to see the latest details.`);
  return c.json({ok:true});
});
api.post('/api/bookings/:id/messages', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await ownedBooking(c.env,c.req.param('id'),actor);
  assertMerchantAccess(row,actor);
  if(['cancelled','declined','expired'].includes(row.status)) throw new HTTPException(409,{message:'This conversation is closed. You can send a new booking request.'});
  const {body}=z.object({body:z.string().trim().min(1).max(1500)}).parse(await c.req.json());
  if(row.status==='pending' && /https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(body))throw new HTTPException(400,{message:'Contact details unlock after approval. Please keep this conversation in Hotlah for now.'});
  await c.env.DB.prepare('INSERT INTO messages(id,booking_id,sender_id,body) VALUES(?,?,?,?)').bind(uuid(),row.id,actor.id,body).run();
  await notify(c.env,actor.id===row.user_id?row.merchant_user_id:row.user_id!,row.id,'New message','You have a new message in Hotlah.');
  return c.json({ok:true},201);
});
api.post('/api/bookings/:id/contact', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await ownedBooking(c.env,c.req.param('id'),actor);
  const {kind}=z.object({kind:z.enum(['call','whatsapp'])}).parse(await c.req.json());
  if(row.user_id!==actor.id || !['approved','completed'].includes(row.status))throw new HTTPException(403);
  const digits=row.phone.replace(/\D/g,'');
  if(!digits)throw new HTTPException(409,{message:'This nailist has not added a contact number. You can message them here.'});
  await c.env.DB.prepare('INSERT OR IGNORE INTO events(id,merchant_id,kind,visitor,day) VALUES(?,?,?,?,?)').bind(uuid(),row.merchant_id,kind,actor.id,dayInMalaysia()).run();
  return c.json({url:kind==='call'?`tel:+${digits}`:`https://wa.me/${digits}`});
});
api.post('/api/bookings/:id/review', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await ownedBooking(c.env,c.req.param('id'),actor);
  if(row.user_id!==actor.id || row.status!=='completed')throw new HTTPException(403,{message:'Reviews open after a completed appointment.'});
  if(row.has_review)throw new HTTPException(409,{message:'You already reviewed this appointment.'});
  const data=z.object({rating:z.number().int().min(1).max(5),body:z.string().trim().min(5).max(1000)}).parse(await c.req.json());
  await c.env.DB.prepare('INSERT INTO reviews(id,booking_id,rating,body) VALUES(?,?,?,?)').bind(uuid(),row.id,data.rating,data.body).run();
  return c.json({ok:true},201);
});
api.get('/api/notifications', async c => {
  const actor=requireActor(c.get('actor'));
  return c.json({notifications:(await c.env.DB.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(actor.id).all()).results});
});
api.post('/api/notifications/read', async c => {
  const actor=requireActor(c.get('actor'));
  await c.env.DB.prepare('UPDATE notifications SET read=1 WHERE user_id=?').bind(actor.id).run();
  return c.json({ok:true});
});

const hoursSchema=z.object({open:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),close:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),days:z.array(z.number().int().min(0).max(6)).min(1)}).refine(h=>minutes(h.close)>minutes(h.open),'Closing time must be after opening time.');
const merchantSchema=z.object({name:z.string().trim().min(2).max(80),area:z.string().min(2).max(100),type:z.enum(['home','studio','mobile']),bio:z.string().trim().max(1200),address:z.string().trim().min(5).max(250),phone:z.string().regex(/^(\+?\d{9,15})?$/,'Use a phone number with country code, e.g. +60123456789.'),styles:z.array(z.string().max(30)).min(1).max(15),hours:hoursSchema,policy:z.string().trim().min(10).max(1500),auto_approve:z.boolean()});
const adminMerchantSchema=merchantSchema.extend({lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180)});
api.get('/api/merchant', async c => {
  const actor=requireActor(c.get('actor'));
  const row=await c.env.DB.prepare('SELECT * FROM merchants WHERE user_id=?').bind(actor.id).first<Record<string,unknown>>();
  if(!row)throw new HTTPException(404,{message:'Create your nailist profile first.'});
  const services=await c.env.DB.prepare('SELECT * FROM services WHERE merchant_id=? ORDER BY rowid').bind(row.id).all();
  const blocks=await c.env.DB.prepare('SELECT * FROM blocks WHERE merchant_id=? AND date>=? ORDER BY date,start_minute').bind(row.id,dayInMalaysia()).all();
  return c.json({merchant:{...publicMerchant(row),address:row.address,phone:row.phone,auto_approve:row.auto_approve,approved:row.approved,subscribed:row.subscribed},services:services.results,blocks:blocks.results});
});
api.post('/api/merchant', async c => {
  const actor=requireActor(c.get('actor'));
  const data=merchantSchema.parse(await c.req.json());
  if(/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(`${data.name} ${data.bio} ${data.policy}`))throw new HTTPException(400,{message:'Keep public text free of contact links and phone numbers. Use the private phone field instead.'});
  const existing=await c.env.DB.prepare('SELECT id FROM merchants WHERE user_id=?').bind(actor.id).first<{id:string}>();
  if(existing)throw new HTTPException(409,{message:'You already have a nailist profile.'});
  const id=uuid();
  await c.env.DB.prepare('INSERT INTO merchants(id,user_id,name,area,type,bio,address,phone,styles,hours,policy,auto_approve) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,actor.id,data.name,data.area,data.type,data.bio,data.address,data.phone,JSON.stringify(data.styles),JSON.stringify(data.hours),data.policy,Number(data.auto_approve)).run();
  return c.json({id},201);
});
api.patch('/api/merchant', async c => {
  const actor=requireActor(c.get('actor'));
  const data=merchantSchema.parse(await c.req.json());
  if(/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(`${data.name} ${data.bio} ${data.policy}`))throw new HTTPException(400,{message:'Keep public text free of contact links and phone numbers. Use the private phone field instead.'});
  const result=await c.env.DB.prepare('UPDATE merchants SET name=?,area=?,type=?,bio=?,address=?,phone=?,styles=?,hours=?,policy=?,auto_approve=? WHERE user_id=?').bind(data.name,data.area,data.type,data.bio,data.address,data.phone,JSON.stringify(data.styles),JSON.stringify(data.hours),data.policy,Number(data.auto_approve),actor.id).run();
  if(!result.meta.changes)throw new HTTPException(404);
  return c.json({ok:true});
});
async function merchantId(c: Parameters<typeof actorFor>[0]) {
  const actor=requireActor(c.get('actor'));
  const row=await c.env.DB.prepare('SELECT id FROM merchants WHERE user_id=?').bind(actor.id).first<{id:string}>();
  if(!row)throw new HTTPException(403,{message:'A nailist account is required.'});
  return row.id;
}
api.post('/api/merchant/blocks', async c => {
  const id=await merchantId(c);
  const data=z.object({date:z.string(),start:z.string().regex(/^\d{2}:\d{2}$/),end:z.string().regex(/^\d{2}:\d{2}$/)}).parse(await c.req.json());
  if(!validDate(data.date) || data.date<dayInMalaysia() || minutes(data.end)<=minutes(data.start) || minutes(data.end)>1440)throw new HTTPException(400,{message:'Choose a valid date and time range.'});
  await c.env.DB.prepare('INSERT INTO blocks(id,merchant_id,date,start_minute,end_minute) VALUES(?,?,?,?,?)').bind(uuid(),id,data.date,minutes(data.start),minutes(data.end)).run();
  return c.json({ok:true},201);
});
api.delete('/api/merchant/blocks/:id', async c => {
  const id=await merchantId(c);
  await c.env.DB.prepare('DELETE FROM blocks WHERE id=? AND merchant_id=?').bind(c.req.param('id'),id).run();
  return c.json({ok:true});
});
const serviceSchema=z.object({name:z.string().trim().min(3).max(100),name_zh:z.string().trim().max(100),description:z.string().trim().min(10).max(1600),price:z.number().int().min(0).max(1000000),duration:z.number().int().min(15).max(480),buffer:z.number().int().min(0).max(120),image:z.string().regex(/^\/(images|api\/media)\/[a-zA-Z0-9._-]+$/),style:z.string().min(2).max(40),shape:z.string().max(30),active:z.boolean(),promoted:z.boolean()});
api.post('/api/merchant/services', async c => {
  const merchant=await merchantId(c); const data=serviceSchema.parse(await c.req.json());
  if(/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(`${data.name} ${data.description}`))throw new HTTPException(400,{message:'Please remove public contact links or phone numbers from your service.'}); const id=uuid();
  await c.env.DB.prepare('INSERT INTO services(id,merchant_id,name,name_zh,description,price,duration,buffer,image,style,shape,active,promoted) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').bind(id,merchant,data.name,data.name_zh,data.description,data.price,data.duration,data.buffer,data.image,data.style,data.shape,Number(data.active),Number(data.promoted)).run();
  return c.json({id},201);
});
api.patch('/api/merchant/services/:id', async c => {
  const merchant=await merchantId(c); const data=serviceSchema.parse(await c.req.json());
  if(/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(`${data.name} ${data.description}`))throw new HTTPException(400,{message:'Please remove public contact links or phone numbers from your service.'});
  const result=await c.env.DB.prepare('UPDATE services SET name=?,name_zh=?,description=?,price=?,duration=?,buffer=?,image=?,style=?,shape=?,active=?,promoted=? WHERE id=? AND merchant_id=?').bind(data.name,data.name_zh,data.description,data.price,data.duration,data.buffer,data.image,data.style,data.shape,Number(data.active),Number(data.promoted),c.req.param('id'),merchant).run();
  if(!result.meta.changes)throw new HTTPException(404);
  return c.json({ok:true});
});
api.get('/api/merchant/insights', async c => {
  const merchant=await merchantId(c);
  const counts=await c.env.DB.prepare('SELECT kind,COUNT(*) count FROM events WHERE merchant_id=? AND day>=date(?,\'-30 days\') GROUP BY kind').bind(merchant,dayInMalaysia()).all<{kind:string;count:number}>();
  const events=Object.fromEntries(counts.results.map(x=>[x.kind,x.count]));
  const bookings=await c.env.DB.prepare('SELECT status,COUNT(*) count FROM bookings WHERE merchant_id=? GROUP BY status').bind(merchant).all<{status:string;count:number}>();
  const acquired=await c.env.DB.prepare('SELECT COUNT(*) count FROM acquisitions WHERE merchant_id=?').bind(merchant).first<{count:number}>();
  return c.json({impressions:events.impression??0,views:events.view??0,requests:bookings.results.reduce((sum,b)=>sum+b.count,0),completed:bookings.results.find(b=>b.status==='completed')?.count??0,newCustomers:acquired?.count??0,ctr:events.impression?Math.round((events.view??0)/events.impression*1000)/10:0});
});
api.get('/api/merchant/customers', async c => {
  const merchant=await merchantId(c);
  const rows=await c.env.DB.prepare(`SELECT u.id,u.name,COUNT(*) appointments,MAX(b.date) last_visit FROM bookings b JOIN user u ON u.id=b.user_id JOIN merchants m ON m.id=b.merchant_id WHERE b.merchant_id=? AND (b.locked=0 OR m.subscribed=1) GROUP BY u.id ORDER BY last_visit DESC`).bind(merchant).all();
  return c.json({customers:rows.results.map(row=>({...row,bookings:row.appointments,last_booking:row.last_visit}))});
});
api.post('/api/events', async c => {
  const data=z.object({merchantId:z.string().max(100),kind:z.enum(['impression','view'])}).parse(await c.req.json());
  let visitor=getCookie(c,'hotlah_visitor');
  if(!visitor || !/^[a-f0-9-]{36}$/.test(visitor)){visitor=uuid();setCookie(c,'hotlah_visitor',visitor,{httpOnly:true,sameSite:'Lax',path:'/',maxAge:2592000});}
  const exists=await c.env.DB.prepare('SELECT id FROM merchants WHERE id=? AND approved=1').bind(data.merchantId).first();
  if(exists)await c.env.DB.prepare('INSERT OR IGNORE INTO events(id,merchant_id,kind,visitor,day) VALUES(?,?,?,?,?)').bind(uuid(),data.merchantId,data.kind,c.get('actor')?.id??visitor,dayInMalaysia()).run();
  return c.json({ok:true});
});
api.post('/api/uploads', async c => {
  await merchantId(c);
  if(!c.env.MEDIA)throw new HTTPException(503,{message:'Photo storage is not connected yet.'});
  const data=await c.req.raw.arrayBuffer(); const bytes=new Uint8Array(data);
  const jpeg=bytes[0]===0xff && bytes[1]===0xd8;
  const png=bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
  const webp=String.fromCharCode(...bytes.slice(0,4))==='RIFF' && String.fromCharCode(...bytes.slice(8,12))==='WEBP';
  if(!jpeg&&!png&&!webp)throw new HTTPException(400,{message:'Please upload a JPEG, PNG, or WebP photo.'});
  const ext=jpeg?'jpg':png?'png':'webp'; const key=`${uuid()}.${ext}`;
  await c.env.MEDIA.put(key,data,{httpMetadata:{contentType:jpeg?'image/jpeg':`image/${ext}`}});
  return c.json({url:`/api/media/${key}`},201);
});
api.get('/api/media/:key', async c => {
  const key=c.req.param('key');if(!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(key))throw new HTTPException(404);
  const object=await c.env.MEDIA?.get(key);if(!object)throw new HTTPException(404);
  c.header('Content-Type',object.httpMetadata?.contentType??'image/jpeg');c.header('Cache-Control','public, max-age=86400');
  return c.body(object.body);
});
api.get('/api/admin', async c => {
  requireAdmin(c);
  const since=localDate(-29);
  const [settings,users,merchantTotals,serviceTotals,bookingTotals,acquisitions,eventTotals,merchants]=await Promise.all([
    c.env.DB.prepare('SELECT * FROM settings').all<{key:string;value:string}>(),
    c.env.DB.prepare('SELECT COUNT(*) count FROM user').first<{count:number}>(),
    c.env.DB.prepare('SELECT COUNT(*) total,COALESCE(SUM(CASE WHEN approved=1 THEN 1 ELSE 0 END),0) approved,COALESCE(SUM(CASE WHEN approved=0 THEN 1 ELSE 0 END),0) pending FROM merchants').first<{total:number;approved:number;pending:number}>(),
    c.env.DB.prepare('SELECT COUNT(*) total,COALESCE(SUM(CASE WHEN active=1 THEN 1 ELSE 0 END),0) active FROM services').first<{total:number;active:number}>(),
    c.env.DB.prepare("SELECT COUNT(*) requests,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) pending,COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) approved,COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END),0) completed FROM bookings").first<{requests:number;pending:number;approved:number;completed:number}>(),
    c.env.DB.prepare('SELECT COUNT(*) count FROM acquisitions').first<{count:number}>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN kind='impression' THEN 1 ELSE 0 END),0) impressions,COALESCE(SUM(CASE WHEN kind='view' THEN 1 ELSE 0 END),0) views FROM events WHERE day>=?").bind(since).first<{impressions:number;views:number}>(),
    c.env.DB.prepare(`SELECT m.id,m.name,m.area,m.type,m.approved,m.subscribed,m.created_at,u.name owner_name,u.email owner_email,
      (SELECT COUNT(*) FROM services s WHERE s.merchant_id=m.id) services,
      (SELECT COUNT(*) FROM bookings b WHERE b.merchant_id=m.id) bookings,
      (SELECT COUNT(*) FROM bookings b WHERE b.merchant_id=m.id AND b.status='completed') completed,
      (SELECT COUNT(*) FROM acquisitions a WHERE a.merchant_id=m.id) new_customers,
      (SELECT COUNT(*) FROM events e WHERE e.merchant_id=m.id AND e.kind='impression' AND e.day>=?) impressions,
      (SELECT COUNT(*) FROM events e WHERE e.merchant_id=m.id AND e.kind='view' AND e.day>=?) views
      FROM merchants m JOIN user u ON u.id=m.user_id ORDER BY m.approved ASC,m.created_at DESC`).bind(since,since).all<Record<string,unknown>>()
  ]);
  const impressions=eventTotals?.impressions??0,views=eventTotals?.views??0;
  return c.json({
    settings:Object.fromEntries(settings.results.map(x=>[x.key,x.value])),
    insights:{users:users?.count??0,merchants:merchantTotals?.total??0,pendingMerchants:merchantTotals?.pending??0,approvedMerchants:merchantTotals?.approved??0,services:serviceTotals?.total??0,activeServices:serviceTotals?.active??0,requests:bookingTotals?.requests??0,pendingBookings:bookingTotals?.pending??0,approvedBookings:bookingTotals?.approved??0,completed:bookingTotals?.completed??0,newCustomers:acquisitions?.count??0,impressions,views,ctr:impressions?Math.round(views/impressions*1000)/10:0},
    merchants:merchants.results.map(row=>({...row,ctr:Number(row.impressions)?Math.round(Number(row.views)/Number(row.impressions)*1000)/10:0}))
  });
});
api.get('/api/admin/merchants/:id', async c => {
  requireAdmin(c);
  const id=c.req.param('id'),since=localDate(-29);
  const merchant=await c.env.DB.prepare('SELECT m.*,u.name owner_name,u.email owner_email FROM merchants m JOIN user u ON u.id=m.user_id WHERE m.id=?').bind(id).first<Record<string,unknown>>();
  if(!merchant)throw new HTTPException(404,{message:'Merchant not found.'});
  const [services,bookingTotals,customers,eventTotals]=await Promise.all([
    c.env.DB.prepare('SELECT id,name,name_zh,price,duration,active,promoted FROM services WHERE merchant_id=? ORDER BY rowid').bind(id).all(),
    c.env.DB.prepare("SELECT COUNT(*) requests,COALESCE(SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END),0) pending,COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) approved,COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END),0) completed FROM bookings WHERE merchant_id=?").bind(id).first<Record<string,number>>(),
    c.env.DB.prepare('SELECT COUNT(*) count FROM acquisitions WHERE merchant_id=?').bind(id).first<{count:number}>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(CASE WHEN kind='impression' THEN 1 ELSE 0 END),0) impressions,COALESCE(SUM(CASE WHEN kind='view' THEN 1 ELSE 0 END),0) views FROM events WHERE merchant_id=? AND day>=?").bind(id,since).first<{impressions:number;views:number}>()
  ]);
  const impressions=eventTotals?.impressions??0,views=eventTotals?.views??0;
  return c.json({merchant:{...publicMerchant(merchant),address:merchant.address,phone:merchant.phone,lat:merchant.lat,lng:merchant.lng,auto_approve:merchant.auto_approve,approved:merchant.approved,subscribed:merchant.subscribed,created_at:merchant.created_at,owner_name:merchant.owner_name,owner_email:merchant.owner_email},services:services.results,insights:{...(bookingTotals??{}),newCustomers:customers?.count??0,impressions,views,ctr:impressions?Math.round(views/impressions*1000)/10:0}});
});
api.post('/api/admin/settings', async c => {
  const actor=requireAdmin(c);
  const data=z.object({allowance:z.number().int().min(0).max(100000),billingEnabled:z.boolean()}).parse(await c.req.json());
  if(data.billingEnabled&&!c.get('demo'))throw new HTTPException(409,{message:'Connect and verify a subscription provider before enabling billing on the live platform.'});
  await c.env.DB.batch([c.env.DB.prepare('UPDATE settings SET value=? WHERE key=\'allowance\'').bind(String(data.allowance)),c.env.DB.prepare('UPDATE settings SET value=? WHERE key=\'billing_enabled\'').bind(String(data.billingEnabled)),c.env.DB.prepare('INSERT INTO audit_log(id,actor_id,action,detail) VALUES(?,?,?,?)').bind(uuid(),actor.id,'settings.updated',JSON.stringify(data))]);
  return c.json({ok:true});
});
api.post('/api/admin/merchants/:id', async c => {
  const actor=requireAdmin(c);
  const {approved}=z.object({approved:z.boolean()}).parse(await c.req.json());
  const merchant=await c.env.DB.prepare('SELECT id,user_id,name,approved FROM merchants WHERE id=?').bind(c.req.param('id')).first<{id:string;user_id:string;name:string;approved:number}>();
  if(!merchant)throw new HTTPException(404,{message:'Merchant not found.'});
  const statements=[c.env.DB.prepare('UPDATE merchants SET approved=? WHERE id=?').bind(Number(approved),merchant.id),c.env.DB.prepare('INSERT INTO audit_log(id,actor_id,action,detail) VALUES(?,?,?,?)').bind(uuid(),actor.id,'merchant.reviewed',JSON.stringify({id:merchant.id,approved}))];
  if(Boolean(merchant.approved)!==approved){const title=approved?'Your Hotlah studio is approved':'Your Hotlah studio is no longer published',body=approved?`${merchant.name} is now visible to customers. You can start receiving booking requests.`:`${merchant.name} has been removed from customer discovery. Open Hotlah or contact support for details.`;statements.push(c.env.DB.prepare('INSERT INTO notifications(id,user_id,booking_id,title,body) VALUES(?,?,NULL,?,?)').bind(uuid(),merchant.user_id,title,body),c.env.DB.prepare('INSERT INTO outbox(id,user_id,subject,body) VALUES(?,?,?,?)').bind(uuid(),merchant.user_id,title,body));}
  await c.env.DB.batch(statements);
  return c.json({ok:true});
});
api.patch('/api/admin/merchants/:id', async c => {
  const actor=requireAdmin(c),id=c.req.param('id');
  const data=adminMerchantSchema.parse(await c.req.json());
  if(/https?:\/\/|www\.|\+?\d[\d\s().-]{7,}\d/i.test(`${data.name} ${data.bio} ${data.policy}`))throw new HTTPException(400,{message:'Keep public text free of contact links and phone numbers. Use the private phone field instead.'});
  const result=await c.env.DB.prepare('UPDATE merchants SET name=?,area=?,type=?,bio=?,address=?,phone=?,lat=?,lng=?,styles=?,hours=?,policy=?,auto_approve=? WHERE id=?').bind(data.name,data.area,data.type,data.bio,data.address,data.phone,data.lat,data.lng,JSON.stringify(data.styles),JSON.stringify(data.hours),data.policy,Number(data.auto_approve),id).run();
  if(!result.meta.changes)throw new HTTPException(404,{message:'Merchant not found.'});
  await c.env.DB.prepare('INSERT INTO audit_log(id,actor_id,action,detail) VALUES(?,?,?,?)').bind(uuid(),actor.id,'merchant.profile.updated',JSON.stringify({id,fields:Object.keys(data)})).run();
  return c.json({ok:true});
});
api.post('/api/demo/access', async c => {
  if(!c.get('demo'))throw new HTTPException(404);
  const id=await merchantId(c);const {restricted}=z.object({restricted:z.boolean()}).parse(await c.req.json());
  await c.env.DB.batch([c.env.DB.prepare('UPDATE settings SET value=? WHERE key=\'billing_enabled\'').bind(String(restricted)),c.env.DB.prepare('UPDATE settings SET value=? WHERE key=\'allowance\'').bind(restricted?'0':'20'),c.env.DB.prepare('UPDATE merchants SET subscribed=0 WHERE id=?').bind(id),c.env.DB.prepare(`UPDATE bookings SET locked=? WHERE merchant_id=? AND status='pending'`).bind(Number(restricted),id)]);
  return c.json({ok:true});
});
api.notFound(c=>c.json({error:'Not found.'},404));
