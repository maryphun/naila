import { test,expect } from '@playwright/test';
test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));});
test('brand mark and installable app icons are exposed',async({page,request})=>{await page.goto('/');await expect(page.getByRole('link',{name:'Hotlah home'}).first().locator('img.brand-mark')).toHaveAttribute('src','/brand-mark.png');await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href','/favicon-32.png');await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href','/apple-touch-icon.png');const manifest=await (await request.get('/manifest.webmanifest')).json();expect(manifest.icons).toEqual(expect.arrayContaining([expect.objectContaining({src:'/icon-192.png',sizes:'192x192'}),expect.objectContaining({src:'/icon-512.png',sizes:'512x512'})]));for(const asset of ['/brand-mark.png','/favicon-32.png','/apple-touch-icon.png','/icon-192.png','/icon-512.png'])expect((await request.get(asset)).ok()).toBe(true);});
test('customer can browse, filter, save and send a request',async({page})=>{
 await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');await expect(page.getByRole('textbox',{name:'Search services or nailists'})).toBeVisible();
 await page.getByRole('button',{name:'Cat eye',exact:true}).click();await expect(page.locator('.service-card')).toHaveCount(1);
 await page.getByRole('button',{name:'All styles',exact:true}).click();await page.getByRole('button',{name:'Save service'}).first().click();
 await page.getByRole('link',{name:'French gel manicure',exact:true}).click();await expect(page.getByRole('heading',{name:'Choose your day'})).toBeVisible();
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').nth(1).click();
 await expect(page.locator('.tp-ui-wrapper.hotlah-booking-clock')).toBeVisible();
 await page.locator('.tp-ui-wrapper.hotlah-booking-clock .tp-ui-ok-btn').click();
 await expect(page.getByRole('button',{name:'Request',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Request',exact:true}).click();
 await page.getByRole('button',{name:'Explore as a customer'}).click();await page.getByRole('button',{name:'Request',exact:true}).click();
 await page.getByLabel('A note for your nailist (optional)').fill('I would love a shorter almond shape.');await page.getByRole('button',{name:'Send booking request'}).click();
 await expect(page.getByText('Pending approval',{exact:true})).toBeVisible();await expect(page.getByText('I would love a shorter almond shape.')).toBeVisible();
 await page.getByRole('textbox',{name:'Message',exact:true}).fill('Thank you, looking forward to it.');await page.getByRole('button',{name:'Send message'}).click();await expect(page.getByText('Thank you, looking forward to it.')).toBeVisible();
 await page.getByRole('button',{name:'Cancel booking',exact:true}).click();await page.getByRole('button',{name:'Yes, cancel booking'}).click();await expect(page.getByText('Cancelled',{exact:true})).toBeVisible();
});
test('booking clock keeps hours visible and removes the minute dial',async({page})=>{
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:600,available:true},{minute:630,available:false},{minute:660,available:true}]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
 await expect(clock.getByText('AM',{exact:true})).toBeVisible();
 await expect(clock.getByText('PM',{exact:true})).toBeVisible();
 await expect(clock.locator('.tp-ui-minutes')).toBeHidden();
 await expect(clock.locator('.tp-ui-minutes-time')).toHaveCount(0);
 await expect(clock.getByRole('button',{name:'11:00 AM'})).toBeVisible();
 await expect(clock.getByRole('button',{name:'11:00 AM'})).toBeEnabled();
 await expect(clock.getByRole('button',{name:'11:30 AM'})).toBeDisabled();
 await expect(clock.locator('.tp-ui-hour-time-12',{hasText:'10'})).not.toHaveClass(/tp-ui-tips-disabled/);
 const ten=await clock.locator('.tp-ui-hour-time-12',{hasText:'10'}).boundingBox();
 expect(ten).not.toBeNull();
 await page.mouse.click(ten!.x+ten!.width/2,ten!.y+ten!.height/2);
 await expect(clock.locator('.tp-ui-hour-time-12')).toHaveCount(12);
 await expect(clock.getByRole('button',{name:'10:00 AM'})).toBeEnabled();
 await expect(clock.getByRole('button',{name:'10:30 AM'})).toBeDisabled();
 await clock.locator('.tp-ui-cancel-btn').click();
 await expect(clock).toHaveCount(0);
 await page.getByRole('button',{name:/Open clock to pick a time/}).click();
 await expect(clock).toBeVisible();
});
test('a half-hour-only opening remains bookable without a minute dial',async({page})=>{
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:630,available:true}]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
 await expect(clock.getByRole('button',{name:'10:00 AM'})).toBeDisabled();
 await expect(clock.getByRole('button',{name:'10:30 AM'})).toBeVisible();
 await expect(clock.getByRole('button',{name:'10:30 AM'})).toBeEnabled();
 await clock.locator('.tp-ui-ok-btn').click();
 await expect(page.locator('.schedule-clock-trigger')).toContainText('10:30 AM');
});
test('booking clock keeps afternoon availability in 12-hour format',async({page})=>{
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:780,available:true}]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
 await expect(clock.getByText('PM',{exact:true})).toBeVisible();
 await clock.locator('.tp-ui-ok-btn').click();
 await expect(page.locator('.schedule-clock-trigger')).toContainText('1:00 PM');
 await expect(page.locator('.schedule-total')).toContainText('1:00 PM');
});
test('booking clock opens at 2 PM and fits a narrow phone',async({page})=>{
 await page.setViewportSize({width:320,height:700});
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:840,available:true},{minute:870,available:true}]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
 await expect(clock.locator('.tp-ui-hour')).toHaveValue('02');
 await expect(clock.locator('.tp-ui-pm')).toHaveClass(/active/);
 await expect(clock.getByRole('button',{name:'2:00 PM'})).toHaveAttribute('aria-pressed','true');
 await expect(clock.getByRole('button',{name:'2:00 PM'})).toBeVisible();
 const bounds=await clock.boundingBox();expect(bounds).not.toBeNull();
 expect(bounds!.x).toBeGreaterThanOrEqual(0);
 expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(320);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
 await expect(clock.locator('.tp-ui-footer')).toBeVisible();
});
test('booking clock remains operable on a short phone',async({page})=>{
 await page.setViewportSize({width:320,height:568});
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:840,available:true},{minute:870,available:true}]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
 const bounds=await clock.boundingBox();expect(bounds).not.toBeNull();
 expect(bounds!.y).toBeGreaterThanOrEqual(0);
 expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(568);
 await clock.getByRole('button',{name:'2:30 PM'}).click();
 await clock.locator('.tp-ui-ok-btn').click();
 await expect(page.locator('.schedule-clock-trigger')).toContainText('2:30 PM');
});
test('booking clock supports touch hour and start selection',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[{minute:780,available:true},{minute:840,available:true}]})}));
  await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().tap();
  const clock=page.locator('.tp-ui-wrapper.hotlah-booking-clock');await expect(clock).toBeVisible();
  const oneTip=clock.locator('.tp-ui-hour-time-12',{hasText:/^1$/});
  await oneTip.tap();
  await expect(clock.getByRole('button',{name:'1:00 PM'})).toBeVisible();
  await clock.getByRole('button',{name:'1:00 PM'}).tap();
  await clock.locator('.tp-ui-ok-btn').tap();
  await expect(page.locator('.schedule-clock-trigger')).toContainText('1:00 PM');
 }finally{await context.close();}
});
test('bottom navigation responds to the first touch after scrolling',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage();
 try{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBeGreaterThan(0);
  await page.locator('.bottom-nav').getByRole('link',{name:'Bookings'}).tap();
  await expect(page).toHaveURL(/\/bookings$/);
  await expect(page.locator('.bottom-nav').getByRole('link',{name:'Bookings'})).toHaveClass(/active/);
 }finally{await context.close();}
});
test('a fully booked date keeps the request unavailable',async({page})=>{
 await page.route(/\/api\/services\/french-gel\/availability\?date=/,route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({slots:[]})}));
 await page.goto('/services/french-gel');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
 await page.locator('.availability-panel .astryx-calendar-day:not(:disabled)').first().click();
 await expect(page.getByText('No times are available on this day. Choose another date.')).toBeVisible();
 await expect(page.getByRole('button',{name:'Request',exact:true})).toBeDisabled();
 await expect(page.locator('.tp-ui-wrapper.hotlah-booking-clock')).toHaveCount(0);
});
test('subscription gate redacts details and blocks direct access',async({page})=>{
 await page.request.post('/api/demo/login',{data:{role:'merchant'}});await page.request.post('/api/demo/access',{data:{restricted:true}});
 try{await page.goto('/merchant');await expect(page.getByRole('heading',{name:'New booking request'}).first()).toBeVisible();const response=await page.request.get('/api/bookings?view=merchant');const {bookings}=await response.json();const locked=bookings.find((b:{locked:number;status:string})=>b.locked&&b.status==='pending');expect(locked).toBeTruthy();expect(Object.keys(locked).sort()).toEqual(['id','locked','status']);expect((await page.request.get(`/api/bookings/${locked.id}`)).status()).toBe(403);expect((await page.request.post(`/api/bookings/${locked.id}/status`,{data:{status:'approved'}})).status()).toBe(403);expect(bookings.some((b:{status:string;name?:string})=>b.status==='approved'&&b.name)).toBeTruthy();}finally{await page.request.post('/api/demo/access',{data:{restricted:false}});}
});
test('API requires authentication and withholds private contact information',async({request})=>{expect((await request.get('/api/bookings')).status()).toBe(401);const result=await request.get('/api/services/french-gel');const data=await result.json();expect(data.merchant).not.toHaveProperty('phone');expect(data.merchant).not.toHaveProperty('address');expect((await request.post('/api/demo/login',{data:{role:'customer'},headers:{Origin:'https://untrusted.example'}})).status()).toBe(403);});
test('sign-in shows a disabled Apple option with its provider icon',async({page})=>{await page.goto('/account');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('button',{name:'Explore as a customer'})).toBeVisible();const apple=page.getByRole('button',{name:'Continue with Apple, coming soon'});await expect(apple).toBeVisible();await expect(apple).toBeDisabled();await expect(apple.locator('svg')).toHaveCount(1);});
test('Astryx dialogs and tabs provide keyboard behavior',async({page})=>{await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');const filters=page.getByRole('button',{name:'Filters'});await filters.click();const dialog=page.getByRole('dialog',{name:'Make it your kind'});await expect(dialog).toBeVisible();await expect(page.getByRole('heading',{name:'Make it your kind'})).toBeFocused();await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);await expect(filters).toBeFocused();await page.request.post('/api/demo/login',{data:{role:'customer'}});await page.goto('/bookings');const upcoming=page.getByRole('tab',{name:'Upcoming'}),history=page.getByRole('tab',{name:'History'});await expect(upcoming).toHaveAttribute('aria-selected','true');await upcoming.focus();await upcoming.press('ArrowRight');await expect(history).toBeFocused();await history.press('Enter');await expect(history).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveAttribute('aria-labelledby','bookings-history-tab');});
test('sign out clears the browser session',async({page})=>{await page.request.post('/api/demo/login',{data:{role:'customer'}});await page.goto('/account');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');const response=page.waitForResponse(r=>r.url().endsWith('/api/logout'));await page.getByRole('button',{name:'Sign out',exact:true}).click();expect((await response).ok()).toBe(true);await expect.poll(async()=>((await (await page.request.get('/api/session')).json()).user)).toBeNull();await page.goto('/account');await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible();});
test('last account action keeps its complete outline',async({page})=>{await page.goto('/account');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');await expect(page.locator('.account-actions>.option-row').last()).toHaveCSS('border-bottom-width','1px');});
test('public legal pages load without authentication and are linked',async({page,request})=>{for(const path of ['/privacy','/data-deletion'])expect((await request.get(path)).status()).toBe(200);await page.goto('/privacy');await expect(page.getByRole('heading',{name:'Privacy policy'})).toBeVisible();await expect(page.getByRole('link',{name:'hotlahmalaysia@gmail.com',exact:true})).toHaveAttribute('href','mailto:hotlahmalaysia@gmail.com');await expect(page.getByRole('link',{name:'Data deletion',exact:true})).toBeVisible();await page.goto('/data-deletion');await expect(page.getByRole('heading',{name:'Delete your Hotlah data'})).toBeVisible();await expect(page.getByRole('link',{name:'hotlahmalaysia@gmail.com',exact:true})).toHaveAttribute('href','mailto:hotlahmalaysia@gmail.com?subject=Hotlah%20account%20deletion');await expect(page.getByText('Contact address required')).toHaveCount(0);});
test('catalogue next availability corresponds to a requestable slot',async({request})=>{const {services}=await (await request.get('/api/catalog')).json();for(const service of services){if(!service.next_available)continue;const {slots}=await (await request.get(`/api/services/${service.id}/availability?date=${service.next_available.date}`)).json();expect(slots.some((s:{minute:number;available:boolean})=>s.minute===service.next_available.minute&&s.available)).toBe(true);}});
test('language switch and geographic region selector work',async({page})=>{await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');await page.getByRole('button',{name:'Kuala Lumpur & Selangor',exact:true}).click();await expect(page.getByRole('button',{name:'Select Petaling',exact:true})).toBeVisible();await page.getByRole('button',{name:'Select Petaling',exact:true}).click();await page.getByRole('button',{name:'Search this area',exact:true}).click();await expect(page.locator('.service-card')).toHaveCount(6);const language=page.getByRole('radiogroup',{name:'Language'}).first();await expect(language.getByRole('radio',{name:'EN'})).toHaveAttribute('aria-checked','true');await language.getByRole('radio',{name:'中文'}).click();await expect(page.locator('html')).toHaveAttribute('lang','zh-Hans');await expect(page.getByRole('radiogroup',{name:'语言'}).first().locator('[aria-checked="true"]')).toHaveCount(1);});
test('discovery view uses a centered single-select segmented control',async({page})=>{await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');await expect(page.getByRole('heading',{name:'Find your next set.'})).toHaveCount(0);const control=page.getByRole('radiogroup',{name:'Discover by'});await expect(control.locator('[aria-checked="true"]')).toHaveCount(1);await expect(control.getByRole('radio',{name:'Services'})).toHaveAttribute('aria-checked','true');await control.getByRole('radio',{name:'Nailists'}).click();await expect(control.locator('[aria-checked="true"]')).toHaveCount(1);await expect(control.getByRole('radio',{name:'Nailists'})).toHaveAttribute('aria-checked','true');await expect(page.getByRole('heading',{name:'Meet local nailists'})).toBeVisible();const controlBox=await control.boundingBox();const mainBox=await page.locator('.main-content').boundingBox();expect(controlBox).not.toBeNull();expect(mainBox).not.toBeNull();expect(Math.abs((controlBox!.x+controlBox!.width/2)-(mainBox!.x+mainBox!.width/2))).toBeLessThanOrEqual(1);});
test('every viewport keeps the centered phone interface without overflow',async({page})=>{await page.request.post('/api/demo/login',{data:{role:'customer'}});for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});for(const path of ['/','/services/french-gel','/bookings','/messages','/account','/privacy','/data-deletion']){await page.goto(path);await expect(page.locator('main')).toBeVisible();await expect(page.locator('.bottom-nav')).toBeVisible();await expect(page.locator('.desktop-nav')).toBeHidden();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);const shell=await page.locator('.app-shell').boundingBox();const nav=await page.locator('.bottom-nav').boundingBox();const clientWidth=await page.evaluate(()=>document.documentElement.clientWidth);expect(shell).not.toBeNull();expect(nav).not.toBeNull();expect(shell!.width).toBeLessThanOrEqual(430);expect(Math.abs(shell!.x-(clientWidth-shell!.width)/2)).toBeLessThanOrEqual(1);expect(Math.abs(nav!.x-shell!.x)).toBeLessThanOrEqual(1);expect(Math.abs(nav!.width-shell!.width)).toBeLessThanOrEqual(1);}await page.goto('/');expect(await page.locator('.service-grid').evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);expect(await page.locator('.style-strip').evaluate(strip=>getComputedStyle(strip).flexWrap)).toBe('nowrap');expect(await page.locator('.style-strip>.chip').evaluateAll(chips=>new Set(chips.map(chip=>Math.round(chip.getBoundingClientRect().top))).size)).toBe(1);}});
test('style chips stay on one horizontally scrollable row',async({page})=>{await page.setViewportSize({width:320,height:844});await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');const strip=page.locator('.style-strip');await expect(strip).toBeVisible();expect(await strip.evaluate(element=>element.scrollWidth>element.clientWidth)).toBe(true);expect(await strip.locator('.chip').evaluateAll(chips=>new Set(chips.map(chip=>Math.round(chip.getBoundingClientRect().top))).size)).toBe(1);await strip.hover();await page.mouse.wheel(0,240);await expect.poll(()=>strip.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);});
test('guest account uses the Hotlah sheep avatar',async({page})=>{await page.goto('/account');const avatar=page.locator('.account-summary>.avatar.large');await expect(avatar).toBeVisible();expect(await avatar.evaluate(element=>getComputedStyle(element).backgroundImage)).toContain('brand-mark.png');expect(await avatar.evaluate(element=>getComputedStyle(element).fontSize)).toBe('0px');});
test('administrator can open insights, review merchants, and update merchant information',async({page})=>{await page.request.post('/api/demo/login',{data:{role:'admin'}});const session=await (await page.request.get('/api/session')).json();expect(session.admin).toBe(true);await page.goto('/account');await page.getByRole('link',{name:'Open administrator workspace'}).click();await expect(page.getByRole('heading',{name:'Hotlah administration'})).toBeVisible();await expect(page.getByText('Platform insights')).toBeVisible();await page.getByRole('tab',{name:'Merchants'}).click();await page.getByRole('button',{name:/Review Studio Mei/}).click();await expect(page.getByRole('heading',{name:'Merchant review'})).toBeVisible();const detailResponse=await page.request.get('/api/admin/merchants/studio-mei');expect(detailResponse.ok()).toBe(true);const detail=await detailResponse.json();const merchant=detail.merchant;const update=await page.request.patch('/api/admin/merchants/studio-mei',{data:{name:merchant.name,area:merchant.area,type:merchant.type,bio:merchant.bio,address:merchant.address,phone:merchant.phone,lat:merchant.lat,lng:merchant.lng,styles:merchant.styles,hours:merchant.hours,policy:merchant.policy,auto_approve:!!merchant.auto_approve}});expect(update.ok()).toBe(true);});
test('administrator APIs reject ordinary customers',async({page})=>{await page.request.post('/api/demo/login',{data:{role:'customer'}});expect((await page.request.get('/api/admin')).status()).toBe(403);expect((await page.request.get('/api/admin/merchants/studio-mei')).status()).toBe(403);expect((await page.request.patch('/api/admin/merchants/studio-mei',{data:{}})).status()).toBe(403);});
