import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const origin = process.env.REVIEW_URL || 'http://localhost:3108';
await mkdir('test-results/visual', { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, width, height] of [
    ['desktop', 1440, 1000],
    ['tablet', 768, 1024],
    ['mobile', 393, 852],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.goto(origin, { waitUntil: 'networkidle' });
    for (const selector of ['.hero', '.universe-grid', '.advice-banner']) {
      const panel = page.locator(selector);
      await panel.scrollIntoViewIfNeeded();
      await panel.locator('img').evaluateAll(async (images) => {
        await Promise.all(
          images.map((image) =>
            image.complete
              ? Promise.resolve()
              : new Promise((resolve) => {
                  image.onload = resolve;
                  image.onerror = resolve;
                }),
          ),
        );
      });
      await panel.screenshot({
        path: `test-results/visual/${name}-${selector.slice(1)}.png`,
      });
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/visual/${name}-home.png`,
      fullPage: true,
    });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log('Visual review saved in test-results/visual');
