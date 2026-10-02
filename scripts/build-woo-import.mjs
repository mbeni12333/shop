/**
 * Validates the research sources against what a WooCommerce import would
 * require, and refuses to emit anything while the catalogue is incomplete.
 *
 * The tool deliberately never fills a gap. A missing price, GTIN, stock
 * statement, licensed photo or source URL is reported and stops the export,
 * because a CSV row with a plausible-looking placeholder is worse than no row:
 * it would publish an invented specification to customers.
 *
 *   node scripts/build-woo-import.mjs           report and exit 1 while incomplete
 *   node scripts/build-woo-import.mjs --write   write the CSVs (complete runs only)
 */
import { access, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const dataRoot = resolve('catalog/research');
const outRoot = resolve('catalog/woo');
const write = process.argv.includes('--write');

// WooCommerce product importer columns. Provenance travels in meta columns so a
// row can always be traced back to the observation that justified it.
const COLUMNS = [
  'Type',
  'SKU',
  'Name',
  'Published',
  'Categories',
  'Attributes',
  'Description',
  'Short description',
  'Regular price',
  'Tax status',
  'Tax class',
  'In stock?',
  'Stock',
  'Images',
  'Meta: _edoctor_source_url',
  'Meta: _edoctor_verified_at',
  'Meta: _edoctor_source_kind',
  'Meta: _edoctor_selection_status',
];

// The category importer has its own contract; reusing the product header would
// produce a file Woo cannot read.
const CATEGORY_COLUMNS = ['Category name', 'Slug', 'Parent', 'Description'];

const isObject = (value) => value && typeof value === 'object';
const nonEmpty = (value) =>
  typeof value === 'string' ? value.trim().length > 0 : Boolean(value);

/**
 * A boolean is a statement, not a value: `edoctorStock: false` is an explicit
 * "out of stock" observation and must never be reported as missing data.
 */
const isKnownBoolean = (value) => typeof value === 'boolean';
const isKnownPrice = (value) =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

/**
 * A photo is only usable once it is on disk, comes from a traceable URL and
 * carries a rights record. A bare image URL is not enough to publish.
 */
async function imageGaps(entry) {
  if (!Array.isArray(entry.images) || !entry.images.length)
    return ['photo exacte avec droits'];
  for (const image of entry.images) {
    if (!isObject(image)) return ['photo exacte avec droits'];
    for (const field of ['path', 'sourceUrl', 'rightsUrl', 'provenancePath'])
      if (!nonEmpty(image[field])) return ['photo exacte avec droits'];
    for (const field of ['path', 'provenancePath'])
      if (!(await exists(resolve(image[field]))))
        return ['photo exacte avec droits'];
  }
  return [];
}

/** A row is importable only when every field a customer would rely on exists. */
async function gaps(entry) {
  const missing = [];
  if (!nonEmpty(entry.sku)) missing.push('SKU');
  if (!nonEmpty(entry.name)) missing.push('nom');
  if (!nonEmpty(entry.category)) missing.push('catégorie');
  if (!isKnownPrice(entry.edoctorSalePrice)) missing.push('prix de vente HT');
  if (!isKnownBoolean(entry.edoctorStock)) missing.push('disponibilité');
  if (!nonEmpty(entry.gtin)) missing.push('GTIN');
  if (!Array.isArray(entry.sources) || !entry.sources.length)
    missing.push('source vérifiée');
  else if (entry.sources.some((s) => !nonEmpty(s?.verifiedAt)))
    missing.push('date de vérification');
  missing.push(...(await imageGaps(entry)));
  return missing;
}

async function readEntries() {
  const files = (await readdir(dataRoot)).filter((f) => f.endsWith('.json'));
  const entries = [];
  for (const file of files) {
    if (file === 'audit.json') continue;
    const parsed = JSON.parse(await readFile(resolve(dataRoot, file), 'utf8'));
    if (!isObject(parsed) || !Array.isArray(parsed.products)) continue;
    for (const product of parsed.products)
      entries.push({ file, entry: product });
  }
  return entries;
}

const cell = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const rows = (columns, records) =>
  [columns, ...records].map((record) => record.map(cell).join(',')).join('\n');

async function main() {
  const entries = await readEntries();
  const assessed = await Promise.all(
    entries.map(async (item) => ({ ...item, gaps: await gaps(item.entry) })),
  );
  const blocked = assessed.filter(({ gaps: missing }) => missing.length > 0);

  const byGap = new Map();
  for (const { gaps: missing } of blocked)
    for (const gap of missing) byGap.set(gap, (byGap.get(gap) || 0) + 1);

  console.log(`Références analysées : ${entries.length}`);
  console.log(`Importables         : ${entries.length - blocked.length}`);
  console.log(`Bloquées            : ${blocked.length}`);
  if (byGap.size) {
    console.log('\nDonnées manquantes (aucune valeur n est inventée) :');
    for (const [gap, count] of [...byGap].sort((a, b) => b[1] - a[1]))
      console.log(`  - ${gap} : ${count}`);
  }

  if (blocked.length) {
    console.log(
      '\nExport refusé : le catalogue est incomplet. Un CSV ne sera produit que ' +
        'chaque référence disposera d’une source vérifiée, d’un prix, d’un GTIN ' +
        'et d’une photo dont les droits sont acquis.',
    );
    process.exitCode = 1;
    return;
  }

  if (!write) return;

  // The research files record a slug, which is Woo's own identifier. The name is
  // seeded from that slug so the file imports cleanly, and must be reconciled
  // with the live taxonomy before the categories go live.
  const slugs = [...new Set(entries.map(({ entry }) => entry.category))].sort();
  await mkdir(outRoot, { recursive: true });
  await writeFile(
    resolve(outRoot, 'categories.csv'),
    rows(
      CATEGORY_COLUMNS,
      slugs.map((slug) => [slug, slug, '', '']),
    ),
    'utf8',
  );
  await writeFile(
    resolve(outRoot, 'products.csv'),
    rows(
      COLUMNS,
      entries.map(({ entry }) => [
        'simple',
        entry.sku,
        entry.name,
        'publish',
        entry.category,
        Object.entries(entry.attributes || {})
          .map(([label, value]) => `${label}: ${value}`)
          .join(' | '),
        entry.descriptionFr || '',
        '',
        entry.edoctorSalePrice,
        'taxable',
        '',
        entry.edoctorStock ? 'yes' : 'no',
        entry.edoctorStock ? '' : '0',
        entry.images.map((image) => image.path).join(' | '),
        entry.sources.map((source) => source.url).join(' | '),
        entry.sources.map((source) => source.verifiedAt).join(' | '),
        entry.sources.map((source) => source.kind).join(' | '),
        entry.selectionStatus || '',
      ]),
    ),
    'utf8',
  );
  console.log(`\nCSV écrits dans ${outRoot}`);
  console.log(
    'Les noms de catégories sont amorcés depuis les slugs : à réconcilier avec ' +
      'la taxonomie Woo réelle avant mise en ligne.',
  );
}

await main();
