import { test,expect } from '@playwright/test';
import type { Merchant,Service } from '../../app/lib/types';

test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));});

test('guided registration preserves a draft, validates steps and submits for review',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'customer'}});
  let payload:Record<string,unknown>|undefined;
  // Exercise the registration UI without turning the shared demo customer into a merchant.
  await page.route('**/api/merchant',async route=>{
    if(route.request().method()==='POST'){payload=route.request().postDataJSON();await route.fulfill({status:503,json:{error:'Please try again shortly.'}});}
    else await route.continue();
  });
  await page.goto('/join');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByLabel('Studio / nailist name').fill('Little Moon Nails');
  await page.getByRole('radio',{name:/Home studio/}).check();
  await page.screenshot({path:'.impeccable/review/registration-390.png',fullPage:true});
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Exact address').fill('12 Example Street, Petaling Jaya');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Choose at least one specialty.');
  await page.getByRole('checkbox',{name:'French',exact:true}).check();
  await page.getByRole('checkbox',{name:'Other',exact:true}).check();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await expect(page.getByLabel('Exact address')).toHaveValue('12 Example Street, Petaling Jaya');
  await page.reload();
  await expect(page.getByLabel('Studio / nailist name')).toHaveValue('Little Moon Nails');
  for(let i=0;i<3;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('switch',{name:/Automatically approve/})).not.toBeChecked();
  await page.getByRole('textbox',{name:'Close',exact:true}).fill('09:00');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('closing time after opening');
  await page.getByRole('textbox',{name:'Close',exact:true}).fill('19:00');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await expect(page.getByRole('heading',{name:'A final look before you join.'})).toBeVisible();
  await page.getByRole('button',{name:'Submit for review'}).click();
  await expect(page.getByRole('alert')).toContainText('Please try again shortly.');
  expect(payload).toMatchObject({name:'Little Moon Nails',type:'home',styles:['French','Other'],auto_approve:false,address:'12 Example Street, Petaling Jaya'});
  expect(payload).not.toHaveProperty('approved');
  await expect(page.getByRole('button',{name:'Submit for review'})).toBeEnabled();
});

test('merchant can edit a service, retain unsaved work and persist changes',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'merchant'}});
  const {services}=await (await page.request.get('/api/merchant')).json() as {services:Service[]};
  const service=services[0];
  const restore={...service,active:!!service.active,promoted:!!service.promoted};
  try{
    await page.goto('/merchant/business');
    await page.screenshot({path:'.impeccable/review/menu-390.png',fullPage:true});
    await page.getByRole('button',{name:'Edit '+service.name,exact:true}).click();
    await page.getByLabel('Service name · English').fill('Updated French set');
    await page.getByRole('button',{name:'Back to menu',exact:true}).click();
    await page.getByRole('button',{name:'Keep editing',exact:true}).click();
    await expect(page.getByLabel('Service name · English')).toHaveValue('Updated French set');
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByLabel('Price · MYR').fill('99');
    await page.getByRole('combobox',{name:'Nail style',exact:true}).selectOption('Other');
    await page.getByLabel('Break after · minutes').fill('20');
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.screenshot({path:'.impeccable/review/service-review-390.png',fullPage:true});
    await page.getByRole('button',{name:'Save service',exact:true}).click();
    await expect(page.locator('.merchant-menu-item').filter({hasText:'Updated French set'})).toContainText('RM 99');
    await page.reload();
    await expect(page.locator('.merchant-menu-item').filter({hasText:'Updated French set'})).toBeVisible();
    const result=await (await page.request.get('/api/merchant')).json();
    expect(result.services.find((s:Service)=>s.id===service.id)).toMatchObject({price:9900,buffer:20,style:'Other'});
  }finally{expect((await page.request.patch('/api/merchant/services/'+service.id,{data:restore})).ok()).toBe(true);}
});

test('merchant profile updates persist and reject public contact details',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'merchant'}});
  const {merchant}=await (await page.request.get('/api/merchant')).json() as {merchant:Merchant};
  const restore={...merchant,auto_approve:!!merchant.auto_approve};
  try{
    await page.goto('/merchant/business?tab=profile');
    await page.getByLabel('Studio / nailist name').fill('Studio Mei Updated');
    for(let i=0;i<4;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.getByRole('button',{name:'Save changes',exact:true}).click();
    await expect(page.locator('.business-identity')).toContainText('Studio Mei Updated');
    await page.reload();
    await expect(page.getByLabel('Studio / nailist name')).toHaveValue('Studio Mei Updated');
    const invalid=await page.request.patch('/api/merchant',{data:{...restore,bio:'Find me at https://example.com'}});
    expect(invalid.status()).toBe(400);
  }finally{expect((await page.request.patch('/api/merchant',{data:restore})).ok()).toBe(true);}
});

test('location picker stages selections, zooms and filters with a 1 km slider',async({page,context})=>{
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({latitude:3.11,longitude:101.62});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('button',{name:'Kuala Lumpur & Selangor',exact:true}).click();
  await page.getByRole('button',{name:'Select Petaling',exact:true}).click();
  const selectedDistrict=page.getByRole('button',{name:'Select Petaling',exact:true});
  await expect(selectedDistrict).toHaveAttribute('aria-pressed','true');
  await expect(selectedDistrict).toHaveCSS('outline-style','none');
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await expect(page.locator('.map-viewport svg')).toHaveAttribute('style',/150%/);
  await page.getByRole('button',{name:'Zoom out',exact:true}).click();
  const range=page.getByRole('slider',{name:'Search distance'});
  await expect(range).toHaveAttribute('step','1');
  await range.focus();await page.keyboard.press('ArrowRight');
  await expect(range).toHaveValue('26');
  await page.getByRole('button',{name:/Use my location/}).click();
  await expect(page.getByRole('button',{name:/Using your location/})).toBeVisible();
  await range.focus();await page.keyboard.press('Home');
  await expect(range).toHaveValue('1');
  await page.getByRole('button',{name:'Search this area',exact:true}).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Lovely nails, nearby'})).toBeVisible();
  await expect(page.locator('.service-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Kuala Lumpur & Selangor',exact:true}).click();
  await page.getByRole('button',{name:'Select Klang',exact:true}).click();
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await expect(page.locator('.service-card')).toHaveCount(2);
  for(const width of [320,390,1440]){
    await page.setViewportSize({width,height:900});
    await page.getByRole('button',{name:'Kuala Lumpur & Selangor',exact:true}).click();
    const dialog=page.locator('.location-dialog');
    expect(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
    await page.screenshot({path:'.impeccable/review/map-'+width+'.png',fullPage:false});
    await page.getByRole('button',{name:'Close',exact:true}).click();
  }
});
