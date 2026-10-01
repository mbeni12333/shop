import {
  readFile,
  readdir,
  mkdir,
  writeFile,
  copyFile,
} from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import { format } from 'prettier';
import { categories } from '../src/edoctor/model.ts';

const root = resolve('.');
const dataRoot = resolve('catalog/research');
const imageRoot = resolve('catalog/images');
const output = 'src/data/research-products.json';
const checking = process.argv.includes('--check');
const groups = new Map();
const tiers = {
  entree: 'Entrée de gamme',
  milieu: 'Milieu de gamme',
  haut: 'Haut de gamme',
};
const seen = new Set();
const images = [];
const sourceFiles = (await readdir(dataRoot))
  .filter((name) => name.endsWith('.json') && name !== 'audit.json')
  .sort();
for (const filename of sourceFiles) {
  const dataset = JSON.parse(
    await readFile(resolve(dataRoot, filename), 'utf8'),
  );
  if (!Array.isArray(dataset.products))
    throw new Error(`Dataset missing products: ${filename}`);
  for (const item of dataset.products) {
    if (
      !item.sku ||
      seen.has(item.sku) ||
      !categories.some((category) => category[0] === item.category) ||
      !tiers[item.tier]
    )
      throw new Error(`Invalid or duplicate research reference: ${item.sku}`);
    seen.add(item.sku);
    if (
      !item.attributes ||
      !Object.values(item.attributes).every(
        (value) => typeof value === 'string',
      )
    )
      throw new Error(`Invalid attributes: ${item.sku}`);
    const brand = item.name.startsWith('be quiet!')
      ? 'be quiet!'
      : item.name.split(' ')[0];
    const slug = `recherche-${item.name}-${item.sku}`
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-$/, '');
    let image = '';
    if (item.images.length) {
      const original = item.images[0];
      const source = resolve(root, original.path);
      const inside = relative(imageRoot, source);
      if (isAbsolute(inside) || inside.startsWith('..'))
        throw new Error(`Image outside catalog: ${item.sku}`);
      const bytes = await readFile(source);
      const provenance = JSON.parse(
        await readFile(resolve(root, original.provenancePath), 'utf8'),
      );
      if (
        !original.rightsUrl ||
        provenance.visualReview !== 'reviewed_on_edoctor_background' ||
        createHash('sha256').update(bytes).digest('hex') !== provenance.sha256
      )
        throw new Error(`Unverified image: ${item.sku}`);
      const name = `${slug}.png`;
      image = `/research-products/${name}`;
      images.push({
        source,
        target: `public/research-products/${name}`,
        bytes,
      });
    }
    const attributes = Object.fromEntries(
      Object.entries(item.attributes).map(([key, value]) => [
        key === 'Enveloppe thermique (TDP)' ? 'TDP' : key,
        value,
      ]),
    );
    const product = {
      id:
        Number.parseInt(
          createHash('sha256').update(item.sku).digest('hex').slice(0, 12),
          16,
        ) + 1,
      slug,
      name: item.name,
      sku: item.sku,
      category: item.category,
      brand,
      tier: tiers[item.tier],
      description: item.descriptionFr,
      image,
      price: null,
      stock: false,
      purchasable: false,
      attributes,
      uses: [],
      variations: [],
      catalogSource: 'research',
      research: {
        manufacturerPartNumber: item.manufacturerPartNumber,
        sources: item.sources,
        rationale: item.selectionRationale,
        missing: item.missing,
      },
    };
    const group = groups.get(item.category) || [];
    group.push(product);
    groups.set(item.category, group);
  }
}
// A balanced preview on the home page, without changing the tier assignments.
for (const group of groups.values())
  group.sort((a, b) => Number(Boolean(b.image)) - Number(Boolean(a.image)));
const products = [];
for (
  let index = 0;
  index < Math.max(...[...groups.values()].map((group) => group.length));
  index++
) {
  for (const category of categories)
    if (groups.get(category[0])?.[index])
      products.push(groups.get(category[0])[index]);
}
if (
  new Set(products.map((product) => product.id)).size !== products.length ||
  new Set(products.map((product) => product.slug)).size !== products.length
)
  throw new Error('Seed identity collision');
const serialized = await format(JSON.stringify({ sourceFiles, products }), {
  parser: 'json',
});
if (checking) {
  if ((await readFile(output, 'utf8')) !== serialized)
    throw new Error('Research snapshot stale; run npm run seed:generate');
  for (const image of images)
    if (!image.bytes.equals(await readFile(image.target)))
      throw new Error(`Seed photo differs from original: ${image.target}`);
} else {
  await mkdir('src/data', { recursive: true });
  await mkdir('public/research-products', { recursive: true });
  await writeFile(output, serialized);
  for (const image of images) await copyFile(image.source, image.target);
}
console.log(
  `${checking ? 'Verified' : 'Generated'} ${products.length} research products and ${images.length} authorized original photos. No sale prices, stock or WooCommerce import.`,
);
