import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

// Public gallery inspection in a new browser, without personal sessions.
const browser = await chromium.launch({ headless: false });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await mkdir('catalog/media-research', { recursive: true });
const results = [];
try {
  for (const model of ['nh-d15-g2', 'nh-u12s-chromax-black']) {
    const url = `https://www.noctua.at/en/products/${model}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(5000);
    const rejectOptional = page.getByRole('button', {
      name: 'Reject optional',
      exact: true,
    });
    if (await rejectOptional.isVisible()) await rejectOptional.click();
    const title = await page.title();
    const blocked = /security checkpoint|verify.*human|captcha/i.test(
      title + (await page.locator('body').innerText()),
    );
    const assets = blocked
      ? []
      : await page.locator('img').evaluateAll((images) =>
          images
            .map((image) => ({
              alt: image.alt,
              url: image.currentSrc || image.src,
            }))
            .filter((image) => image.url.startsWith('https://')),
        );
    results.push({
      model,
      url,
      title,
      blocked,
      assets,
      inspectedAt: new Date().toISOString(),
    });
    await page.screenshot({
      path: `catalog/media-research/${model}-gallery.png`,
      fullPage: false,
    });
    console.log(
      `${model}: ${blocked ? 'Public gallery verification blocked; no assets collected.' : `${assets.length} public DOM image links inspected.`}`,
    );
  }
  await writeFile(
    'catalog/media-research/noctua-links.json',
    `${JSON.stringify(results, null, 2)}\n`,
  );
} finally {
  await browser.close();
}
