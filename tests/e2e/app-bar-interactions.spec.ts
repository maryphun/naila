import {test,expect} from '@playwright/test';

async function touch(page:import('@playwright/test').Page,type:'touchstart'|'touchmove'|'touchend',y:number){
  return page.evaluate(({type,y})=>{
    const target=document.querySelector('main')!;
    const contact=new Touch({identifier:1,target,clientX:180,clientY:y});
    const event=new TouchEvent(type,{bubbles:true,cancelable:true,touches:type==='touchend'?[]:[contact],changedTouches:[contact]});
    target.dispatchEvent(event);
    return event.defaultPrevented;
  },{type,y});
}

test('app bar hides on downward scroll and returns on upward scroll without moving content',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  const header=page.locator('.site-header');
  const main=page.locator('main');
  await expect(header).not.toHaveClass(/is-hidden/);
  const initialTop=await main.evaluate(element=>(element as HTMLElement).offsetTop);
  await page.evaluate(()=>{document.querySelector<HTMLElement>('.app-shell')!.style.minHeight='2000px';window.scrollTo({top:400,behavior:'instant'});});
  await expect(header).toHaveClass(/is-hidden/);
  await expect.poll(()=>header.evaluate(element=>element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  expect(await main.evaluate(element=>(element as HTMLElement).offsetTop)).toBe(initialTop);
  await page.evaluate(()=>window.scrollTo({top:398,behavior:'instant'}));
  await expect(header).toHaveClass(/is-hidden/);
  for(let y=397;y>=392;y--){
    await page.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);
    await page.waitForTimeout(25);
  }
  await expect(header).not.toHaveClass(/is-hidden/);
  await page.locator('.bottom-nav').getByRole('link',{name:'Account'}).click();
  await expect(page.locator('.bottom-nav [aria-current="page"]')).toHaveText('Account');
  await expect(header).not.toHaveClass(/is-hidden/);
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
});

test('pulling at the top resists, cancels below threshold, and refreshes above it',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  const indicator=page.locator('.pull-refresh-indicator');
  const main=page.locator('main');
  let release:()=>void=()=>{},requests=0;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route(/\/_.data(?:\?|$)/,async route=>{requests++;await held;await route.continue();});
  try{
    await touch(page,'touchstart',300);
    expect(await touch(page,'touchmove',350)).toBe(true);
    await expect(indicator).toHaveAttribute('data-phase','pulling');
    await expect.poll(()=>main.evaluate(element=>new DOMMatrix(getComputedStyle(element).transform).m42)).toBeGreaterThan(0);
    await touch(page,'touchend',350);
    await expect(indicator).toHaveAttribute('data-phase','idle');
    await expect(main).toHaveCSS('transform','none');
    expect(requests).toBe(0);

    await touch(page,'touchstart',300);
    expect(await touch(page,'touchmove',450)).toBe(true);
    await expect(indicator).toHaveAttribute('data-phase','ready');
    await touch(page,'touchend',450);
    await expect(indicator).toHaveAttribute('data-phase','refreshing');
    await expect(indicator).toHaveAttribute('role','status');
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await expect.poll(()=>requests).toBeGreaterThan(0);
  }finally{release();}
  await expect(indicator).toHaveAttribute('data-phase','idle');
  await expect(main).toHaveCSS('transform','none');
  expect(await page.evaluate(()=>window.scrollY)).toBe(0);
});

test('pull interaction respects reduced motion',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await touch(page,'touchstart',300);
  await touch(page,'touchmove',450);
  await expect(page.locator('.pull-refresh-indicator')).toHaveAttribute('data-phase','ready');
  const main=page.locator('main');
  await expect(main).toHaveCSS('transition-duration','0s');
  await expect.poll(()=>main.evaluate(element=>new DOMMatrix(getComputedStyle(element).transform).m42)).toBeLessThanOrEqual(32);
  await touch(page,'touchend',450);
});

test('pull-to-refresh also waits for mounted API-backed tab content',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'customer'}});
  await page.goto('/bookings');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await expect(page.getByRole('heading',{name:'Your bookings'})).toBeVisible();
  let release:()=>void=()=>{},requests=0;
  const held=new Promise<void>(resolve=>{release=resolve;});
  await page.route(/\/api\/bookings(?:\?|$)/,async route=>{requests++;await held;await route.continue();});
  try{
    await touch(page,'touchstart',300);
    await touch(page,'touchmove',450);
    await touch(page,'touchend',450);
    await expect.poll(()=>requests).toBeGreaterThan(0);
    await expect(page.locator('.pull-refresh-indicator')).toHaveAttribute('data-phase','refreshing');
    await expect(page.getByRole('heading',{name:'Your bookings'})).toBeVisible();
  }finally{release();}
  await expect(page.locator('.pull-refresh-indicator')).toHaveAttribute('data-phase','idle');
});
