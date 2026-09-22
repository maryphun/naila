import { test, expect, type Locator, type Page } from '@playwright/test';

async function expectUnclipped(control: Locator) {
  const clippedBy = await control.evaluate(el => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const ring = style.outlineStyle === 'none' ? 0 : Math.max(0, parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset));
    const clipped: string[] = [];
    for (let parent = el.parentElement; parent; parent = parent.parentElement) {
      const css = getComputedStyle(parent);
      const box = parent.getBoundingClientRect();
      const left = box.left + parent.clientLeft;
      const top = box.top + parent.clientTop;
      if ((css.overflowX !== 'visible' && (rect.left - ring < left - 1 || rect.right + ring > left + parent.clientWidth + 1)) ||
          (css.overflowY !== 'visible' && (rect.top - ring < top - 1 || rect.bottom + ring > top + parent.clientHeight + 1))) {
        clipped.push(parent.tagName + '.' + parent.className);
      }
      if (parent.tagName === 'DIALOG') break;
    }
    return clipped;
  });
  expect(clippedBy, 'control and focus outline must fit inside every clipping ancestor').toEqual([]);
}

async function expectCentered(page: Page, dialog: Locator) {
  await expect(dialog).toBeVisible();
  await expect.poll(async () => dialog.evaluate(el => {
    const box = el.getBoundingClientRect();
    return Math.max(
      Math.abs(box.x + box.width / 2 - window.innerWidth / 2),
      Math.abs(box.y + box.height / 2 - window.innerHeight / 2),
    );
  })).toBeLessThanOrEqual(1);
  const box = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeInViewport();
  await close.hover();
  await expectUnclipped(close);
  await close.focus();
  await close.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await expectUnclipped(close);
  // A close-button tooltip is its own Escape layer; dismiss it before testing
  // the dialog's Escape handling below.
  await dialog.getByRole('heading').first().focus();
  await page.mouse.move(0, 0);
  await expect(page.getByRole('tooltip')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('hotlah:style-seen', '1'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const size of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 500 }, { width: 1440, height: 900 }]) {
  test('shared popups stay centered at ' + size.width + '×' + size.height, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/account');
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    const signIn = page.getByRole('button', { name: 'Sign in', exact: true });
    await signIn.click();
    const login = page.getByRole('dialog', { name: 'A little closer to your next set' });
    await expectCentered(page, login);
    await expect(login.getByRole('button', { name: 'Continue with Apple, coming soon' })).toBeVisible();
    await login.getByRole('button', { name: 'Close', exact: true }).hover();
    await page.screenshot({ path: '.impeccable/review/dialog-login-' + size.width + '.png', animations: 'disabled' });
    await page.mouse.move(0, 0);
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    // The end of a tall login dialog must remain reachable on short screens.
    await login.locator('.auth-note').scrollIntoViewIfNeeded();
    await expect(login.locator('.auth-note')).toBeInViewport();
    await page.keyboard.press('Escape');
    await expect(signIn).toBeFocused();

    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expectCentered(page, page.getByRole('dialog', { name: 'Make it your kind' }));
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Choose a style', exact: true }).click();
    const styles = page.getByRole('dialog', { name: 'What’s your nail mood?' });
    await expectCentered(page, styles);
    await styles.getByRole('button', { name: 'French', exact: true }).focus();
    await expectUnclipped(styles.getByRole('button', { name: 'French', exact: true }));
    await page.keyboard.press('Escape');
    const locationTrigger = page.getByRole('button', { name: 'Kuala Lumpur & Selangor', exact: true });
    await locationTrigger.click();
    const location = page.getByRole('dialog', { name: 'Find your neighbourhood.' });
    await expectCentered(page, location);
    await location.getByRole('button', { name: /Use my location/ }).focus();
    await expectUnclipped(location.getByRole('button', { name: /Use my location/ }));
    await expect(location.getByRole('button', { name: 'Search this area', exact: true })).toBeInViewport();
    await page.screenshot({ path: '.impeccable/review/dialog-location-' + size.width + '.png', animations: 'disabled' });
    await location.getByRole('button', { name: 'Banting', exact: true }).scrollIntoViewIfNeeded();
    await expect(location.getByRole('button', { name: 'Banting', exact: true })).toBeInViewport();
    await expect(location.getByRole('heading', { name: 'Find your neighbourhood.', exact: true })).toBeInViewport();
    await expect(location.getByRole('button', { name: 'Search this area', exact: true })).toBeInViewport();
    await location.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(location).toHaveCount(0);
  });
}
