import { test,expect } from '@playwright/test';

test.beforeEach(async({page})=>{await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));});

test('customers can discover nailists and open their menus',async({page,request})=>{
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('radiogroup',{name:'Discover by'}).getByRole('radio',{name:'Nailists'}).click();
  await expect(page.getByRole('heading',{name:'Meet local nailists'})).toBeVisible();
  await expect(page.locator('.merchant-card')).toHaveCount(3);
  await page.getByRole('textbox',{name:'Search services or nailists'}).fill('Studio Mei');
  await expect(page.locator('.merchant-card')).toHaveCount(1);
  await page.getByRole('link',{name:"View Studio Mei's menu"}).click();
  await expect(page.getByRole('heading',{name:'Studio Mei',exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Services & prices'})).toBeVisible();
  await expect(page.getByRole('link',{name:'French gel manicure',exact:true})).toBeVisible();
  const {merchant,services}=await (await request.get('/api/merchants/studio-mei')).json();
  expect(merchant).not.toHaveProperty('phone');
  expect(merchant).not.toHaveProperty('address');
  expect(services.every((service:{active:number})=>service.active===1)).toBe(true);
  expect((await request.get('/api/merchants/does-not-exist')).status()).toBe(404);
});

test('style filters narrow nailists by their matching services',async({page})=>{
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('radiogroup',{name:'Discover by'}).getByRole('radio',{name:'Nailists'}).click();
  await page.getByRole('button',{name:'Cat eye',exact:true}).click();
  await expect(page.locator('.merchant-card')).toHaveCount(1);
  await expect(page.locator('.merchant-card')).toContainText('Luna Nails');
});
