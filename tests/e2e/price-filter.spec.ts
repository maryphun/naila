import {test,expect} from '@playwright/test';

test('maximum price slider keeps RM 300 numeric and reserves the final step for Unlimited',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('hotlah:style-seen','1'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated','true');
  await page.getByRole('button',{name:'Filters'}).click();
  const slider=page.getByRole('slider',{name:'Maximum price'});
  const field=page.locator('label.field',{has:slider});
  await expect(slider).toHaveAttribute('min','10');
  await expect(slider).toHaveAttribute('max','310');
  await expect(slider).toHaveAttribute('step','10');
  await expect(slider).toHaveValue('200');

  await slider.focus();
  await slider.press('End');
  await expect(slider).toHaveValue('310');
  await expect(slider).toHaveAttribute('aria-valuetext','Unlimited');
  await expect(field).toContainText('Maximum price — Unlimited');

  await slider.press('ArrowLeft');
  await expect(slider).toHaveValue('300');
  await expect(field).toContainText('Maximum price — RM 300');
  await slider.press('ArrowRight');
  await expect(field).toContainText('Maximum price — Unlimited');

  await slider.press('Home');
  await expect(slider).toHaveValue('10');
  await expect(field).toContainText('Maximum price — RM 10');
  await expect(page.getByRole('button',{name:'Show 0 services'})).toBeVisible();
  await slider.press('ArrowRight');
  await expect(slider).toHaveValue('20');
  for(let step=0;step<10;step++)await slider.press('ArrowRight');
  await expect(slider).toHaveValue('120');
  await expect(field).toContainText('Maximum price — RM 120');

  await slider.press('End');
  await expect(page.getByRole('button',{name:/Show [1-9]\d* services/})).toBeVisible();
});
