import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.REVIEW_URL || 'http://127.0.0.1:3108';
await mkdir('test-results/visible', { recursive: true });
const browser = await chromium.launch({ headless: false, slowMo: 200 });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
try {
  await page.goto(`${origin}/categorie/processeurs`);
  await expect(page.locator('.product-card')).toHaveCount(9);
  await page
    .getByRole('combobox', { name: 'Socket', exact: true })
    .selectOption('AM5');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await page.screenshot({ path: 'test-results/visible/catalog-wide.png' });
  await page.goto(`${origin}/recherche`);
  const input = page.getByRole('searchbox', {
    name: 'Recherche dans la sélection',
  });
  await input.pressSequentially('NH-D15');
  await expect(input).toHaveValue('NH-D15');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('.product-card a').click();
  await expect(page.locator('.detail-picture img')).not.toHaveJSProperty(
    'naturalWidth',
    0,
  );
  await page.screenshot({ path: 'test-results/visible/research-product.png' });
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['mobile', 393, 852],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}/contact`);
    const welcome = page.locator('.contact-welcome');
    await welcome.scrollIntoViewIfNeeded();
    await expect(welcome.locator('img')).not.toHaveJSProperty(
      'naturalWidth',
      0,
    );
    await welcome.screenshot({
      path: `test-results/visible/contact-welcome-${name}.png`,
    });
    await page.goto(`${origin}/categorie/processeurs`);
    const toggle = page.getByRole('button', { name: /^Affiner la sélection/ });
    if (await toggle.isVisible()) await toggle.click();
    await page.locator('.catalog-sidebar').scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `test-results/visible/catalog-filters-${name}.png`,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
    ).toBe(false);
  }
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(`${origin}/produits`);
  console.log(
    'Research catalogue, fast typing, full product photo and welcoming mascot checked. Isolated Chromium left open.',
  );
  await new Promise((resolve) => {
    browser.once('disconnected', resolve);
    process.once('SIGINT', async () => {
      await browser.close();
      resolve();
    });
  });
} catch (error) {
  console.error(error);
  await browser.close();
  process.exitCode = 1;
}
