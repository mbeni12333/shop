import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.REVIEW_URL || 'http://127.0.0.1:3108';
await mkdir('test-results/visible', { recursive: true });
// A fresh Chromium context has no personal cookies, accounts or browser profile.
const browser = await chromium.launch({ headless: false, slowMo: 450 });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
async function capture(name) {
  await page.waitForTimeout(2000);
  await page.screenshot({
    path: `test-results/visible/${name}.png`,
    fullPage: !name.includes('mobile'),
  });
  console.log(`Verified: ${name}`);
}
try {
  await page.goto(origin);
  await expect(page.locator('.hero')).toHaveCSS(
    'background-color',
    'rgb(242, 237, 252)',
  );
  await expect(
    page.getByRole('heading', { name: /Votre prochain/, level: 1 }),
  ).toBeVisible();
  await capture('01-home-desktop');
  await page.getByRole('link', { name: 'Explorer la boutique' }).click();
  await expect(page.locator('.category-directory > a')).toHaveCount(14);
  for (const card of await page.locator('.category-directory > a').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator('img')).toHaveJSProperty('complete', true);
    await expect(card.locator('img')).not.toHaveJSProperty('naturalWidth', 0);
    await page.waitForTimeout(650);
  }
  await page.evaluate(() => scrollTo(0, 0));
  await capture('02-categories-desktop');
  await page.locator('.category-directory > a').first().click();
  await expect(
    page.getByRole('heading', { name: 'PC fixes', exact: true }),
  ).toBeVisible();
  await capture('03-category-desktop');
  await page.goto(`${origin}/guide`);
  await page.getByLabel('Votre usage').selectOption('gaming');
  await page.getByLabel('Budget maximum HT').fill('1200');
  await page.getByRole('button', { name: /Voir les choix/ }).click();
  await expect(page.getByRole('heading', { name: /Affinons/ })).toBeVisible();
  await capture('04-guide-desktop');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto(origin);
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await expect(
    page.getByRole('navigation', { name: 'Navigation principale' }),
  ).toBeVisible();
  await capture('05-mobile-menu');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('navigation', { name: 'Navigation principale' }),
  ).toBeHidden();
  await capture('06-home-mobile');
  expect(errors).toEqual([]);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${origin}/categories`);
  console.log(
    'Visible review passed. Browser left open for inspection; stop this process to close only this test browser.',
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
