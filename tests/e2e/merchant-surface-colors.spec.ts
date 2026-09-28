import { test,expect } from '@playwright/test';

test('nailist entry and workspace use distinct blush surfaces',async({page})=>{
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
  await page.screenshot({path:'.impeccable/review/nailist-workspace-390.png'});
  await page.setViewportSize({width:320,height:700});
  await page.screenshot({path:'.impeccable/review/nailist-workspace-320.png'});
});
