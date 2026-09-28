import { test,expect } from '@playwright/test';

test('merchant palette covers controls and dialogs and resets in customer view',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.request.post('/api/demo/login',{data:{role:'merchant'}});
  await page.goto('/account');
  const entry=page.getByRole('link',{name:'Open nailist workspace'});
  await expect(entry).toHaveCSS('background-color','rgb(254, 220, 219)');
  await page.screenshot({path:'.impeccable/review/nailist-entry-390.png'});

  await entry.click();
  const shell=page.locator('.merchant-shell');
  await expect(shell).toHaveCSS('background-color','rgb(253, 247, 247)');
  await expect(shell.locator('.site-header')).toHaveCSS('background-color','rgb(253, 247, 247)');
  await expect(shell.locator('.bottom-nav')).toHaveCSS('background-color','rgb(253, 247, 247)');
  await expect(page.locator('.loading')).toHaveCount(0);
  const primary=page.getByRole('link',{name:'Manage services'});
  await expect(primary).toHaveCSS('background-color','rgb(147, 70, 94)');
  await expect(primary).toHaveCSS('color','rgb(255, 252, 252)');
  const contrast=await primary.evaluate(element=>{
    const style=getComputedStyle(element);
    const luminance=(color:string)=>{const [r,g,b]=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(value=>{const c=value/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;});return r*.2126+g*.7152+b*.0722;};
    const fg=luminance(style.color),bg=luminance(style.backgroundColor);
    return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(4.5);
  console.log('Merchant primary-action text contrast:',contrast.toFixed(2)+':1');
  await page.screenshot({path:'.impeccable/review/nailist-workspace-390.png'});

  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Calendar',exact:true}).click();
  await page.getByRole('button',{name:'Block time',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'A little time off'});
  await expect(dialog).toHaveCSS('opacity','1');
  await expect(dialog).toHaveCSS('background-color','rgb(253, 247, 247)');
  await expect(dialog.getByLabel('From')).toHaveCSS('background-color','rgb(255, 252, 252)');
  await expect(dialog.getByRole('button',{name:'Block this time'})).toHaveCSS('background-color','rgb(147, 70, 94)');
  await page.screenshot({path:'.impeccable/review/merchant-palette-dialog-390.png'});
  await page.setViewportSize({width:1024,height:900});
  await page.screenshot({path:'.impeccable/review/merchant-palette-dialog-1024.png'});
  await page.keyboard.press('Escape');
  await page.setViewportSize({width:390,height:844});

  await page.goto('/merchant/business?tab=profile');
  await expect(page.getByLabel('Studio / nailist name')).toBeVisible();
  await expect(page.locator('.choice-row.selected')).toHaveCSS('background-color','rgb(254, 220, 219)');
  await page.screenshot({path:'.impeccable/review/merchant-palette-profile-390.png'});
  await page.getByRole('tab',{name:'Menu',exact:true}).click();
  await expect(page.getByRole('tab',{name:'Menu',exact:true})).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('tabpanel')).toHaveCSS('opacity','1');
  await expect(page.getByRole('button',{name:'Add service',exact:true})).toBeVisible();
  await page.screenshot({path:'.impeccable/review/merchant-palette-menu-390.png'});
  await page.goto('/messages?view=merchant');
  await expect(page.locator('html')).toHaveAttribute('data-astryx-theme','hotlah-merchant');

  await page.getByRole('link',{name:'Switch to customer view'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-astryx-theme','neutral');
  await expect(page.locator('.app-shell')).toHaveCSS('background-color','rgb(250, 249, 239)');
  expect(await page.locator('.language-segmented').evaluate(element=>getComputedStyle(element,'::before').backgroundColor)).toBe('rgb(255, 211, 49)');
});
