import { test,expect } from '@playwright/test';

test('bottom navigation responds before Explore and Account route data resolves',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/account');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');

  let releaseExplore:()=>void=()=>{};
  const exploreHeld=new Promise<void>(resolve=>{releaseExplore=resolve;});
  await page.route(/\/_.data(?:\?|$)/,async route=>{await exploreHeld;await route.continue();});
  await page.evaluate(()=>{
    const timing={blankAt:0,loadingAt:0};
    (window as typeof window & {pendingTabTiming:typeof timing}).pendingTabTiming=timing;
    const main=document.querySelector('main')!;
    new MutationObserver(()=>{
      const pending=main.querySelector('.tab-pending-screen');
      if(pending&&!timing.blankAt)timing.blankAt=performance.now();
      if(pending?.classList.contains('is-loading')&&!timing.loadingAt)timing.loadingAt=performance.now();
    }).observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  });
  try{
    await page.locator('.bottom-nav').getByRole('link',{name:'Explore'}).click();
    await expect(page.locator('.bottom-nav [aria-current="page"]')).toHaveText('Explore');
    const pendingExplore=page.locator('main .explore-page.tab-pending-screen');
    await expect(pendingExplore).toBeEmpty();
    await expect(pendingExplore).not.toHaveAttribute('role','status');
    const blankHeight=await page.locator('main').evaluate(element=>element.getBoundingClientRect().height);
    await expect(page).toHaveURL(/\/account$/);
    await expect(pendingExplore).toHaveAttribute('role','status');
    await expect(pendingExplore.locator('.astryx-skeleton').first()).toBeVisible();
    await expect(pendingExplore).toHaveCSS('animation-duration','0.165s');
    const loadingHeight=await page.locator('main').evaluate(element=>element.getBoundingClientRect().height);
    expect(loadingHeight).toBe(blankHeight);
    const {blankAt,loadingAt}=await page.evaluate(()=>(window as typeof window & {pendingTabTiming:{blankAt:number;loadingAt:number}}).pendingTabTiming);
    expect(loadingAt-blankAt).toBeGreaterThanOrEqual(490);
  }finally{releaseExplore();}
  await expect(page.locator('main .explore-page:not(.tab-pending-screen)')).toBeVisible();
  await page.unroute(/\/_.data(?:\?|$)/);

  let releaseAccount:()=>void=()=>{};
  const accountHeld=new Promise<void>(resolve=>{releaseAccount=resolve;});
  await page.route(/\/account.data(?:\?|$)/,async route=>{await accountHeld;await route.continue();});
  try{
    await page.locator('.bottom-nav').getByRole('link',{name:'Account'}).click();
    await expect(page.locator('.bottom-nav [aria-current="page"]')).toHaveText('Account');
    const pendingAccount=page.locator('main .account-page.tab-pending-screen');
    await expect(pendingAccount).toBeEmpty();
    await expect(page).toHaveURL(/\/$/);
  }finally{releaseAccount();}
  await expect(page.locator('main .account-page:not(.tab-pending-screen)')).toBeVisible();
  await page.waitForTimeout(550);
  await expect(page.locator('main .tab-pending-screen')).toHaveCount(0);
});

test('delayed loading reveal respects reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/account');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  let releaseExplore:()=>void=()=>{};
  const exploreHeld=new Promise<void>(resolve=>{releaseExplore=resolve;});
  await page.route(/\/_.data(?:\?|$)/,async route=>{await exploreHeld;await route.continue();});
  try{
    await page.locator('.bottom-nav').getByRole('link',{name:'Explore'}).click();
    const pendingExplore=page.locator('main .explore-page.tab-pending-screen');
    await expect(pendingExplore).toBeEmpty();
    await expect(pendingExplore).toHaveAttribute('role','status');
    await expect(pendingExplore).toHaveCSS('animation-name','none');
  }finally{releaseExplore();}
});
