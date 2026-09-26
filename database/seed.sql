-- LOCAL PREVIEW ONLY. Do not execute against a live customer database.
INSERT OR IGNORE INTO user(id,name,email,emailVerified,createdAt,updatedAt) VALUES
 ('demo-customer','Alicia Tan','alicia@example.test',1,0,0),
 ('demo-merchant','Mei','mei@example.test',1,0,0),
 ('demo-luna','Luna','luna@example.test',1,0,0),
 ('demo-jo','Jo','jo@example.test',1,0,0),
 ('demo-customer-2','Sarah Lee','sarah@example.test',1,0,0),
 ('demo-admin','Hotlah admin','admin@example.test',1,0,0);
INSERT OR IGNORE INTO merchants(id,user_id,name,area,type,bio,address,phone,lat,lng,styles,approved,hours) VALUES
 ('studio-mei','demo-merchant','Studio Mei','Petaling Jaya','home','Thoughtful details, beautifully you. A quiet, one-to-one nail appointment in my little SS2 home studio. Specialising in natural finishes and delicate nail art.','Demo address · 12, Jalan SS2/24, Petaling Jaya','',3.1185,101.6228,'["French","Minimal","Glazed"]',1,'{"open":"10:00","close":"19:00","days":[0,1,2,3,4,5,6]}'),
 ('luna-nails','demo-luna','Luna Nails','Damansara','studio','A little shimmer for your everyday. Specialising in magnetic gel, chrome and personalised colours.','Demo address · Damansara Uptown','',3.135,101.621,'["Cat eye","Chrome","Glazed"]',1,'{"open":"10:00","close":"20:00","days":[0,1,2,3,4,5,6]}'),
 ('nails-by-jo','demo-jo','Nails by Jo','Subang Jaya','mobile','Tiny details with a big personality. Hand-painted art and fresh sets, brought to your doorstep in Subang Jaya.','Service area: Subang Jaya','',3.056,101.584,'["Hand-painted","3D art","Minimal"]',1,'{"open":"10:00","close":"18:00","days":[0,1,2,3,4,5,6]}');
INSERT OR IGNORE INTO services(id,merchant_id,name,name_zh,description,price,duration,buffer,image,style,shape,promoted) VALUES
 ('french-gel','studio-mei','French gel manicure','法式凝胶美甲','The classic, with your own little twist. Includes a gentle shape, cuticle care, nude gel base and fine French tips. Choose your preferred length and shape at your appointment.',8800,75,15,'/images/french.webp','French','Almond',0),
 ('cat-eye','luna-nails','Champagne cat-eye','香槟猫眼美甲','A soft magnetic shimmer that catches the light just right. Includes nail preparation, cuticle care, your choice of cat-eye colour and a glossy finish.',10800,90,15,'/images/cat-eye.webp','Cat eye','Almond',0),
 ('cherry-art','nails-by-jo','Little cherry nail art','樱桃手绘美甲','A playful little detail on a fresh pink base. Includes nail preparation, gel colour and two hand-painted cherry accent nails. Mobile service within Subang Jaya.',9800,90,15,'/images/cherry.webp','Hand-painted','Round',0),
 ('glazed-pearl','studio-mei','Glazed pearl manicure','珍珠光泽美甲','Barely-there colour, a beautiful pearly finish. A complete gel manicure with soft milky colour and a delicate layer of chrome.',9800,75,15,'/images/glazed.webp','Glazed','Squoval',0),
 ('minimal-gel','nails-by-jo','Your everyday gel set','简约纯色美甲','Clean, considered and effortlessly you. Choose one gel colour with a shape and cuticle tidy. The perfect everyday manicure.',6800,60,15,'/images/french.webp','Minimal','Any',0),
 ('chrome-glow','luna-nails','Soft chrome glow','柔光镜面美甲','A luminous chrome finish over your chosen gel base. Nail preparation, cuticle care and a lasting topcoat are included.',11800,90,15,'/images/glazed.webp','Chrome','Almond',0);
INSERT OR IGNORE INTO bookings(id,merchant_id,user_id,service_id,date,start_minute,end_minute,name,price,duration,image,request_key) VALUES
 ('demo-booking','studio-mei','demo-customer','french-gel',date('now','+8 hours','+2 days'),840,930,'French gel manicure',8800,75,'/images/french.webp','seed-alicia'),
 ('demo-confirmed','studio-mei','demo-customer-2','glazed-pearl',date('now','+8 hours'),630,720,'Glazed pearl manicure',9800,75,'/images/glazed.webp','seed-sarah');
UPDATE bookings SET status='approved' WHERE id='demo-confirmed' AND status='pending';
INSERT OR IGNORE INTO messages(id,conversation_id,sender_id,body) VALUES('demo-message','demo-booking','demo-customer','Hi Mei, could I have a shorter almond shape?');
INSERT OR IGNORE INTO notifications(id,user_id,booking_id,title,body) VALUES('demo-notification','demo-merchant','demo-booking','New booking request','You have a new booking request to review.');
