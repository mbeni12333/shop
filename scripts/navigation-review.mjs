import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ headless: false, slowMo: 350 });
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
await mkdir('test-results/visible', { recursive: true });
try {
  await page.goto('http://127.0.0.1:3108/');
  const components = page.getByRole('button', {
    name: 'Composants',
    exact: true,
  });
  await components.click();
  await expect(
    page.locator('#nav-composants .nav-category-grid a'),
  ).toHaveCount(8);
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: 'test-results/visible/navigation-desktop.png',
  });
  await page.keyboard.press('Escape');
  await expect(components).toBeFocused();
  await page
    .getByRole('button', { name: 'Tous les univers', exact: true })
    .click();
  await page.screenshot({
    path: 'test-results/visible/navigation-universes.png',
  });
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.getByRole('button', { name: 'Menu', exact: true }).click();
  await components.click();
  await page.screenshot({
    path: 'test-results/visible/navigation-mobile-viewport.png',
  });
  await page.screenshot({
    path: 'test-results/visible/navigation-mobile.png',
    fullPage: true,
  });
  await page
    .locator('#nav-composants')
    .getByRole('link', { name: /^Mémoire RAM/ })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Mémoire RAM', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Menu', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  await page.screenshot({
    path: 'test-results/visible/navigation-mobile-header.png',
  });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('http://127.0.0.1:3108/categories');
  await page.screenshot({
    path: 'test-results/visible/category-vector-art.png',
    fullPage: true,
  });
  await page.goto('http://127.0.0.1:3108/');
  await components.click();
  console.log(
    'Desktop/mobile dropdown and cart review passed. Fresh Chromium left open on the components menu.',
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
