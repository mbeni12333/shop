import { chromium } from '@playwright/test';
import { readFile, readdir, mkdir } from 'node:fs/promises';
const directory = 'public/univers/vector';
const files = (await readdir(directory)).filter((file) =>
  file.endsWith('.svg'),
);
const cards = await Promise.all(
  files.map(
    async (file) =>
      `<figure>${await readFile(`${directory}/${file}`, 'utf8')}<figcaption>${file.replace('.svg', '')}</figcaption></figure>`,
  ),
);
const visible = process.env.VISIBLE_REVIEW === '1';
const browser = await chromium.launch({ headless: !visible });
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 1400 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html lang="fr"><head><style>body{margin:0;padding:32px;background:#FCFBFE;color:#242033;font:16px 'Segoe UI',Arial,sans-serif}main{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}figure{margin:0;padding:16px;background:#F2EDFC;border-radius:16px}svg{width:100%;height:190px}figcaption{text-align:center;margin-top:12px;font-weight:600}</style></head><body><main>${cards.join('')}</main></body></html>`,
  );
  await mkdir('test-results/visual', { recursive: true });
  await page.screenshot({
    path: 'test-results/visual/vector-gallery.png',
    fullPage: true,
  });
  console.log(
    `${files.length} vector illustrations rendered for visual review.`,
  );
  if (visible) {
    console.log('Isolated illustration preview left open for inspection.');
    await new Promise((resolve) => {
      browser.once('disconnected', resolve);
      process.once('SIGINT', async () => {
        await browser.close();
        resolve();
      });
    });
  }
} finally {
  await browser.close();
}
