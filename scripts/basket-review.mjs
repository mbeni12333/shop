import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.REVIEW_URL || 'http://127.0.0.1:3108';
const browser = await chromium.launch({ headless: false, slowMo: 350 });
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
});
await mkdir('test-results/visible', { recursive: true });
try {
  const page = await context.newPage();
  await page.goto(origin);
  // Fictional local lines demonstrate recovery; no backend product or order is created.
  await page.evaluate(() => {
    const line = {
      productId: 101,
      variationId: 0,
      quantity: 2,
      name: 'Test local — ligne conservée',
      price: 125,
    };
    localStorage.setItem(
      'edoctor-basket-v1',
      JSON.stringify([
        null,
        line,
        { ...line, quantity: 3 },
        {
          ...line,
          productId: 102,
          name: 'Test local — prix à vérifier',
          price: 'broken',
        },
      ]),
    );
  });
  await page.goto(`${origin}/panier`);
  await expect(page.locator('.basket-lines article')).toHaveCount(2);
  await expect(
    page.getByLabel('Quantité Test local — ligne conservée'),
  ).toHaveValue('5');
  await expect(page.locator('.basket-total')).toContainText('À confirmer');
  await page.screenshot({
    path: 'test-results/visible/basket-recovery-desktop.png',
    fullPage: true,
  });
  const other = await context.newPage();
  await other.setViewportSize({ width: 393, height: 852 });
  await other.goto(`${origin}/panier`);
  await expect(
    other.getByLabel('Quantité Test local — ligne conservée'),
  ).toHaveValue('5');
  await page.getByLabel('Quantité Test local — ligne conservée').fill('4');
  await expect(
    other.getByLabel('Quantité Test local — ligne conservée'),
  ).toHaveValue('4');
  await other.screenshot({
    path: 'test-results/visible/basket-recovery-mobile.png',
    fullPage: true,
  });
  await other
    .getByRole('button', {
      name: 'Retirer Test local — prix à vérifier',
      exact: true,
    })
    .click();
  await expect(page.locator('.basket-total')).toContainText('500');
  await expect(page.locator('.basket-lines article')).toHaveCount(1);
  await page.screenshot({
    path: 'test-results/visible/basket-tabs-synchronized.png',
    fullPage: true,
  });
  await other.bringToFront();
  console.log(
    'Visible desktop/mobile basket recovery and real cross-tab synchronization passed. Fictional local basket only. Chromium left open.',
  );
  await new Promise((resolve) => {
    browser.once('disconnected', resolve);
    process.once('SIGINT', async () => {
      await browser.close();
      resolve();
    });
    process.once('SIGTERM', async () => {
      await browser.close();
      resolve();
    });
  });
} catch (error) {
  console.error(error);
  await browser.close();
  process.exitCode = 1;
}
