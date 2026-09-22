import { test,expect } from '@playwright/test';

test('discovery removes promotional copy but keeps lower breathing room',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
 for(const width of [1294,390]){
  await page.setViewportSize({width,height:856});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(page.locator('.discovery-intro > p')).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Small studios. Big talent.'})).toHaveCount(0);
  await expect(page.locator('.discovery-spacer')).toHaveCSS('height',width>700?'120px':'92px');
  await expect(page.locator('.discovery-spacer')).toHaveCSS('margin-top','12px');
  await expect(page.locator('.service-card')).toHaveCount(6);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
