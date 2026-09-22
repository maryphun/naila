import { describe,it,expect,beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { computeSlots,sanitizeBooking,validDate,assertMerchantAccess } from '../server/domain';
import type { BookingRow } from '../server/domain';
describe('availability and privacy',()=>{
 it('rejects malformed and impossible dates',()=>{expect(validDate('2027-02-30')).toBe(false);expect(validDate('2027-99-01')).toBe(false);expect(validDate('2028-02-29')).toBe(true);});
 it('respects buffer, business hours and overlapping appointments',()=>{const slots=computeSlots({open:'10:00',close:'13:00',days:[0,1,2,3,4,5,6]},'2030-01-01',60,15,[{start_minute:660,end_minute:735}],0);expect(slots.find(s=>s.minute===600)?.available).toBe(false);expect(slots.find(s=>s.minute===630)?.available).toBe(false);expect(slots.at(-1)?.minute).toBe(690);});
 it('returns no times on a closed day',()=>expect(computeSlots({open:'10:00',close:'19:00',days:[]},'2030-01-01',60,15,[],0)).toEqual([]));
 const row={id:'b',merchant_user_id:'merchant',user_id:'customer',locked:1,subscribed:0,status:'pending',name:'Secret service',address:'Secret address',phone:'60123456789',request_key:'secret'} as BookingRow;
 it('server redacts all locked merchant details',()=>{expect(sanitizeBooking(row,{id:'merchant',name:'M',email:'m@test'})).toEqual({id:'b',status:'pending',locked:1});expect(()=>assertMerchantAccess(row,{id:'merchant',name:'M',email:'m@test'})).toThrow();});
 it('customer sees own request but not phone or private address before approval',()=>{const result=sanitizeBooking(row,{id:'customer',name:'C',email:'c@test'});expect(result.name).toBe('Secret service');expect(result).not.toHaveProperty('address');expect(result).not.toHaveProperty('phone');expect(result).not.toHaveProperty('request_key');});
});
describe('transactional booking invariants',()=>{
 let db:DatabaseSync;
 beforeEach(()=>{db=new DatabaseSync(':memory:');db.exec(readFileSync('database/migrations/0001_initial.sql','utf8'));db.exec(readFileSync('database/seed.sql','utf8'));});
 const insert=(db:DatabaseSync,id:string,user='demo-customer',minute=600)=>db.prepare('INSERT INTO bookings(id,merchant_id,user_id,service_id,date,start_minute,end_minute,name,price,duration,image,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id,'studio-mei',user,'french-gel','2030-01-01',minute,minute+90,'French',8800,75,'/images/french.webp',id);
 it('counts a returning customer only once',()=>{const before=db.prepare('SELECT COUNT(*) n FROM acquisitions WHERE merchant_id=?').get('studio-mei')!.n;insert(db,'repeat-1');insert(db,'repeat-2');expect(db.prepare('SELECT COUNT(*) n FROM acquisitions WHERE merchant_id=?').get('studio-mei')!.n).toBe(before);});
 it('restores one credit, never duplicates it',()=>{db.exec("UPDATE bookings SET status='cancelled' WHERE id='demo-booking'");expect(db.prepare("SELECT credited FROM acquisitions WHERE booking_id='demo-booking'").get()!.credited).toBe(1);db.exec("UPDATE bookings SET status='declined' WHERE id='demo-booking'");expect(db.prepare("SELECT SUM(credited) n FROM acquisitions WHERE merchant_id='studio-mei'").get()!.n).toBe(1);});
 it('locks requests at allowance and disables automatic approval',()=>{db.exec("UPDATE settings SET value='true' WHERE key='billing_enabled'; UPDATE settings SET value='0' WHERE key='allowance'; UPDATE merchants SET auto_approve=1 WHERE id='studio-mei'");insert(db,'locked');expect(db.prepare("SELECT status,locked FROM bookings WHERE id='locked'").get()).toMatchObject({status:'pending',locked:1});});
 it('rejects overlapping approvals and blocking confirmed times',()=>{insert(db,'a');insert(db,'b');db.exec("UPDATE bookings SET status='approved' WHERE id='a'");expect(()=>db.exec("UPDATE bookings SET status='approved' WHERE id='b'")).toThrow('SLOT_TAKEN');expect(()=>db.exec("INSERT INTO blocks VALUES('x','studio-mei','2030-01-01',610,650)")).toThrow('APPOINTMENT_EXISTS');});
 it('rejects reviews before completion',()=>{expect(()=>db.exec("INSERT INTO reviews(id,booking_id,rating,body) VALUES('r','demo-booking',5,'Lovely')")).toThrow('NOT_COMPLETED');});
});
