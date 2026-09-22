import { test, expect } from '@playwright/test';
import { STYLES } from '../../app/lib/types';

test('photo picker selects new styles, preserves dismissal and resets saved filters', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hotlah:style-seen', '1'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  const trigger = page.getByRole('button', { name: 'Choose a style', exact: true });
  const dialog = page.getByRole('dialog', { name: 'What’s your nail mood?' });
  for (const style of ['Korean', 'Chinese', 'Mirror', 'Magnet']) {
    await trigger.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('img')).toHaveCount(STYLES.length);
    await expect.poll(() => dialog.locator('img').evaluateAll(images =>
      images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)
    )).toBe(true);
    await dialog.getByRole('button', { name: style, exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('.style-strip').getByRole('button', { name: style, exact: true })).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('hotlah:style'))).toBe(style);
  }
  await page.reload();
  await expect(page.locator('.style-strip').getByRole('button', { name: 'Magnet', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await trigger.click();
  await expect(dialog.getByRole('button', { name: 'Magnet', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('hotlah:style'))).toBe('Magnet');
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await page.reload();
  await expect(page.locator('.style-strip').getByRole('button', { name: 'All styles', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.service-card').first()).toBeVisible();
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await trigger.click();
    expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    const box = await dialog.boundingBox();
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    await expect(dialog.getByRole('heading')).toBeInViewport();
    await expect(dialog.getByRole('button', { name: 'Show me everything', exact: true })).toBeInViewport();
    await page.screenshot({ path: '.impeccable/review/styles-' + width + '.png', animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Show me everything', exact: true }).click();
  }
  await page.getByRole('button', { name: '切换中文' }).click();
  await page.getByRole('button', { name: '选择款式', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: '韩式', exact: true }).click();
  await expect(page.locator('.style-strip').getByRole('button', { name: '韩式', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('first visit opens the photo picker and dismissing it keeps all services available', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'What’s your nail mood?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveCount(STYLES.length);
  await dialog.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('.service-card').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
  await expect(dialog).toHaveCount(0);
});
