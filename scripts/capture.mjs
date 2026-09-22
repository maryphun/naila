import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
await mkdir('.impeccable/review',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext();await context.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
for(const [name,width,height,path,role] of [['mobile',390,844,'/','customer'],['desktop',1440,1000,'/','customer'],['service-mobile',390,844,'/services/french-gel','customer'],['chat-mobile',390,844,'/bookings/demo-booking','customer'],['merchant-mobile',390,844,'/merchant','merchant'],['merchant-desktop',1440,1000,'/merchant','merchant']]){
 await context.request.post('http://127.0.0.1:5173/api/demo/login',{data:{role}});await page.setViewportSize({width,height});await page.goto('http://127.0.0.1:5173'+path);await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`.impeccable/review/${name}.png`,fullPage:true});
}
console.log(JSON.stringify({errors}));await browser.close();
