import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const sources = [
  {
    sku: 'NH-D15-G2',
    filename: 'nh_d15_g2_11-improved.png',
    productPage: 'https://www.noctua.at/en/products/nh-d15-g2',
  },
  {
    sku: 'NH-U12S-CHROMAX-BLACK',
    filename: 'nh_u12s_chromax_black_1.png',
    productPage: 'https://www.noctua.at/en/products/nh-u12s-chromax-black',
  },
];
const gallery = JSON.parse(
  await readFile('catalog/media-research/noctua-links.json', 'utf8'),
);
for (const source of sources) {
  const url = `https://cdn.noctua.at/media/${source.filename}`;
  const observed = gallery.some(
    (page) =>
      page.url === source.productPage &&
      !page.blocked &&
      page.assets.some(
        (asset) =>
          new URL(asset.url).searchParams.get('url') === url ||
          asset.url === url,
      ),
  );
  if (!observed)
    throw new Error(
      `${source.sku}: source not observed on the exact official product page`,
    );
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`${source.sku}: download HTTP ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(bytes).metadata();
  const stats = await sharp(bytes).stats();
  if (
    metadata.format !== 'png' ||
    !metadata.hasAlpha ||
    stats.channels.at(-1).min !== 0 ||
    stats.channels.at(-1).max !== 255
  )
    throw new Error(
      `${source.sku}: original is not a transparent PNG with opaque product pixels`,
    );
  const folder = `catalog/images/refroidissement/${source.sku}`;
  await mkdir(folder, { recursive: true });
  const path = `${folder}/principal.png`;
  await writeFile(path, bytes);
  const provenance = {
    path,
    sourceUrl: url,
    productPage: source.productPage,
    rightsUrl: 'https://www.noctua.at/en/press',
    rightsVerifiedAt: '2026-10-01',
    rights:
      'Manufacturer-created media: royalty-free non-exclusive permission until cancelled. Recheck before publication.',
    downloadedAt: new Date().toISOString(),
    sha256: createHash('sha256').update(bytes).digest('hex'),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    alphaMin: stats.channels.at(-1).min,
    alphaMax: stats.channels.at(-1).max,
    transformations: [],
    visualReview: 'pending',
  };
  await writeFile(
    `${folder}/provenance.json`,
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
  console.log(
    `${source.sku}: original PNG ${metadata.width}×${metadata.height}, alpha 0–255, no transformation.`,
  );
}
