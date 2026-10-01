import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';

const products = [
  ['NH-D15-G2', 'Noctua NH-D15 G2 Standard'],
  ['NH-U12S-CHROMAX-BLACK', 'Noctua NH-U12S chromax.black'],
];
const cards = await Promise.all(
  products.map(async ([sku, name]) => {
    const bytes = await readFile(
      `catalog/images/refroidissement/${sku}/principal.png`,
    );
    return `<figure><div class="photo"><img src="data:image/png;base64,${bytes.toString('base64')}" alt="${name}"></div><figcaption>${name}<small>Original fabricant · PNG transparent</small></figcaption></figure>`;
  }),
);
const browser = await chromium.launch({ headless: false });
try {
  const page = await browser.newPage({
    viewport: { width: 1100, height: 700 },
  });
  await page.setContent(
    `<html lang="fr"><style>body{margin:0;padding:40px;background:#FCFBFE;font:16px 'Segoe UI',Arial;color:#242033}h1{font-size:32px}main{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0;background:white;border:1px solid #DDD7E6;border-radius:16px;overflow:hidden}.photo{height:390px;padding:24px;background:#F2EDFC}img{width:100%;height:100%;object-fit:contain}figcaption{padding:24px;font-weight:600}small{display:block;color:#686274;font-weight:400;margin-top:8px}</style><h1>Photos originales du catalogue</h1><main>${cards.join('')}</main></html>`,
  );
  await page.waitForTimeout(2000);
  await mkdir('test-results/visual', { recursive: true });
  await page.screenshot({
    path: 'test-results/visual/noctua-transparent.png',
    fullPage: true,
  });
  console.log(
    'Two original product images rendered on the EDoctor pale purple background.',
  );
} finally {
  await browser.close();
}
