import { chromium } from '@playwright/test';
const browser=await chromium.launch({channel:'msedge'});
const page=await browser.newPage();
await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
for(const [name,width] of [['user-1294',1294],['mobile',390]]){
 await page.setViewportSize({width,height:856});
 await page.goto('http://127.0.0.1:5173/');
 await page.waitForLoadState('networkidle');
 await page.evaluate(()=>document.fonts.ready);
 await page.screenshot({path:`.impeccable/review/cleanup-${name}.png`,fullPage:true});
}
await browser.close();
