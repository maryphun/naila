import { test,expect } from '@playwright/test';

test('bottom navigation responds before Explore and Account route data resolves',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/account');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');

  let releaseExplore:()=>void=()=>{};
  const exploreHeld=new Promise<void>(resolve=>{releaseExplore=resolve;});
  await page.route(/\/_.data(?:\?|$)/,async route=>{await exploreHeld;await route.continue();});
  try{
    await page.locator('.bottom-nav').getByRole('link',{name:'Explore'}).click();
    await expect(page.locator('.bottom-nav [aria-current="page"]')).toHaveText('Explore');
    await expect(page.locator('main .explore-page.tab-pending-screen')).toBeVisible();
    await expect(page).toHaveURL(/\/account$/);
  }finally{releaseExplore();}
  await expect(page.locator('main .explore-page:not(.tab-pending-screen)')).toBeVisible();
  await page.unroute(/\/_.data(?:\?|$)/);

  let releaseAccount:()=>void=()=>{};
  const accountHeld=new Promise<void>(resolve=>{releaseAccount=resolve;});
  await page.route(/\/account.data(?:\?|$)/,async route=>{await accountHeld;await route.continue();});
  try{
    await page.locator('.bottom-nav').getByRole('link',{name:'Account'}).click();
    await expect(page.locator('.bottom-nav [aria-current="page"]')).toHaveText('Account');
    await expect(page.locator('main .account-page.tab-pending-screen')).toBeVisible();
    await expect(page).toHaveURL(/\/$/);
  }finally{releaseAccount();}
  await expect(page.locator('main .account-page:not(.tab-pending-screen)')).toBeVisible();
});
