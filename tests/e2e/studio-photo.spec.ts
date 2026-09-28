import { test,expect } from '@playwright/test';
import { MAX_MEDIA_BYTES } from '../../app/lib/media';
import type { Merchant,Service } from '../../app/lib/types';

test('merchant crops a studio photo and it appears in discovery and on the nailist page',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.request.post('/api/demo/login',{data:{role:'merchant'}});
  const {merchant}=await (await page.request.get('/api/merchant')).json() as {merchant:Merchant};
  const restore={...merchant,image:merchant.image??'',auto_approve:!!merchant.auto_approve};
  try{
    await page.goto('/merchant/business?tab=profile');
    await page.getByLabel('Studio photo').setInputFiles({name:'too-large.png',mimeType:'image/png',buffer:Buffer.alloc(MAX_MEDIA_BYTES+1)});
    await expect(page.getByRole('alert')).toContainText('up to 5 MB');
    await expect(page.getByRole('dialog',{name:'Crop your studio photo'})).toHaveCount(0);

    const sample=Buffer.from(await page.evaluate(()=>{
      const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=900;
      const context=canvas.getContext('2d')!;
      context.fillStyle='#efd6c3';context.fillRect(0,0,1200,900);
      context.fillStyle='#a46971';context.fillRect(260,180,680,540);
      return canvas.toDataURL('image/png').split(',')[1];
    }),'base64');
    await page.getByLabel('Studio photo').setInputFiles({name:'studio.png',mimeType:'image/png',buffer:sample});
    const cropDialog=page.getByRole('dialog',{name:'Crop your studio photo'});
    await expect(cropDialog).toBeVisible();
    await expect(cropDialog).toHaveCSS('opacity','1');
    await expect(page.getByText('Preview · your studio image in discovery and on your nailist page')).toBeVisible();
    await page.screenshot({path:'.impeccable/review/studio-crop-390.png'});
    await page.setViewportSize({width:320,height:700});
    await expect(page.getByRole('button',{name:'Crop and upload'})).toBeInViewport();
    await page.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Crop and upload'}).click();
    await expect(page.getByRole('dialog',{name:'Crop your studio photo'})).toHaveCount(0);
    const image=await page.getByAltText('Your studio photo').getAttribute('src');
    expect(image).toMatch(/^\/api\/media\/[a-f0-9-]+\.webp$/);

    await page.locator('.setup-progress').getByRole('button',{name:/Review/}).click();
    await expect(page.getByAltText('Your studio photo preview')).toHaveAttribute('src',image!);
    await page.getByRole('button',{name:'Save changes'}).click();
    await expect.poll(async()=>((await (await page.request.get('/api/merchant')).json()).merchant as Merchant).image).toBe(image);
    const catalog=(await (await page.request.get('/api/catalog')).json()).services as Service[];
    expect(catalog.find(service=>service.merchant_id===merchant.id)?.merchant_image).toBe(image);

    await page.goto('/');
    await page.getByRole('radiogroup',{name:'Discover by'}).getByRole('radio',{name:'Nailists'}).click();
    const card=page.locator('.merchant-card').filter({hasText:merchant.name});
    await expect(card.locator('img')).toHaveAttribute('src',image!);
    await page.screenshot({path:'.impeccable/review/studio-discovery-390.png'});
    await card.getByRole('link',{name:`View ${merchant.name}'s menu`}).click();
    await expect(page.locator('.nailist-hero')).toHaveAttribute('src',image!);
    await page.screenshot({path:'.impeccable/review/studio-profile-390.png'});
  }finally{
    expect((await page.request.patch('/api/merchant',{data:restore})).ok()).toBe(true);
  }
});
