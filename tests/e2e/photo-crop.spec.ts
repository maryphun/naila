import { test,expect } from '@playwright/test';
import { MAX_MEDIA_BYTES } from '../../app/lib/media';

test('merchant previews a crop and uploads only after confirmation',async({page})=>{
  await page.request.post('/api/demo/login',{data:{role:'merchant'}});
  await page.goto('/merchant/business');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('button',{name:'Add service'}).click();
  await page.getByLabel('Service photo').setInputFiles({name:'too-large.png',mimeType:'image/png',buffer:Buffer.alloc(MAX_MEDIA_BYTES+1)});
  await expect(page.getByRole('alert')).toContainText('up to 5 MB');
  await expect(page.getByRole('dialog',{name:'Crop your service photo'})).toHaveCount(0);

  const sample=Buffer.from(await page.evaluate(()=>{
    const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
    const context=canvas.getContext('2d')!;
    context.fillStyle='#ebb68c';context.fillRect(0,0,1200,900);
    context.fillStyle='#b44b67';context.fillRect(420,220,360,440);
    return canvas.toDataURL('image/png').split(',')[1];
  }),'base64');
  let uploads=0;
  await page.route('**/api/uploads',async route=>{
    uploads++;
    expect(route.request().headers()['content-type']).toBe('image/webp');
    expect(route.request().postDataBuffer()!.byteLength).toBeLessThan(sample.byteLength);
    await route.fulfill({status:201,json:{url:'/images/french.webp'}});
  });
  await page.getByLabel('Service photo').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:sample});
  await expect(page.getByRole('dialog',{name:'Crop your service photo'})).toBeVisible();
  await expect(page.getByText('Preview · this is how the photo appears on your nail menu')).toBeVisible();
  await page.getByRole('slider',{name:'Photo zoom'}).fill('1.5');
  await expect(page.getByRole('button',{name:'Crop and upload'})).toBeEnabled();
  await expect(page.getByRole('dialog',{name:'Crop your service photo'})).toHaveCSS('opacity','1');
  await page.screenshot({path:'.impeccable/review/photo-crop-390.png'});
  await page.setViewportSize({width:320,height:700});
  await expect(page.getByRole('button',{name:'Crop and upload'})).toBeInViewport();
  await page.screenshot({path:'.impeccable/review/photo-crop-320.png'});
  expect(uploads).toBe(0);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Crop your service photo'})).toHaveCount(0);
  expect(uploads).toBe(0);

  await page.getByLabel('Service photo').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:sample});
  await page.getByRole('button',{name:'Crop and upload'}).click();
  await expect(page.getByRole('dialog',{name:'Crop your service photo'})).toHaveCount(0);
  await expect(page.getByAltText('Your service photo')).toBeVisible();
  expect(uploads).toBe(1);
});
