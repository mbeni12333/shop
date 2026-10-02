/**
 * Proves the WooCommerce export contract without touching the real research
 * data: a complete entry must import cleanly, and every field a customer would
 * rely on must block the export when it is absent or unstated.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const script = resolve('scripts/build-woo-import.mjs');

let root = '';
let researchDir = '';
let imageDir = '';

const entry = {
  sku: 'TEST-1',
  manufacturerPartNumber: 'MPN-1',
  gtin: '1234567890123',
  name: 'Produit vérifié',
  category: 'processeurs',
  tier: 'unique',
  descriptionFr: 'Description vérifiée.',
  attributes: { Cores: '8' },
  sources: [
    {
      url: 'https://example.test/product',
      verifiedAt: '2026-10-01',
      kind: 'manufacturer_specs',
    },
  ],
  selectionStatus: 'retenu',
  edoctorSalePrice: 199.9,
  edoctorStock: true,
  images: [
    {
      path: 'catalog/images/test/principal.png',
      sourceUrl: 'https://example.test/principal.png',
      rightsUrl: 'https://example.test/press',
      provenancePath: 'catalog/images/test/provenance.json',
    },
  ],
  imageStatus: 'droits acquises',
  missing: [],
};

type Source = { url: string; verifiedAt: string; kind: string };
type Photo = {
  path: string;
  sourceUrl: string;
  rightsUrl: string;
  provenancePath: string;
};
type Entry = typeof entry;
// Research entries legitimately carry nulls for unobserved fields, and a null is
// exactly what the validator has to reject.
type Override = { [K in keyof Entry]?: Entry[K] | null };

const writeEntry = async (overrides: Override = {}) => {
  await writeFile(
    join(researchDir, 'processeurs.json'),
    JSON.stringify({ status: 'ok', products: [{ ...entry, ...overrides }] }),
    'utf8',
  );
};

const audit = () => run(process.execPath, [script], { cwd: root });
const exportCsv = () =>
  run(process.execPath, [script, '--write'], { cwd: root });
const readProduct = async () =>
  (await readFile(join(root, 'catalog/woo/products.csv'), 'utf8')).split('\n');

before(async () => {
  root = await mkdtemp(join(tmpdir(), 'woo-import-'));
  researchDir = join(root, 'catalog', 'research');
  imageDir = join(root, 'catalog', 'images', 'test');
  await mkdir(researchDir, { recursive: true });
  await mkdir(imageDir, { recursive: true });
  await writeFile(join(imageDir, 'principal.png'), 'placeholder', 'utf8');
  await writeFile(join(imageDir, 'provenance.json'), '{}', 'utf8');
});

after(async () => {
  await rm(root, { recursive: true, force: true });
});

describe('woo import export', () => {
  it('exports a fully documented reference in the Woo shape', async () => {
    await writeEntry();
    await exportCsv();

    const [header, row, ...extra] = await readProduct();
    assert.equal(extra.length, 0, 'one header and one product row');
    assert.ok(header.includes('SKU'));
    assert.ok(header.includes('Meta: _edoctor_source_url'));
    assert.ok(row.includes('TEST-1'));
    assert.ok(row.includes('199.9'));
    assert.ok(row.includes('yes'));
    // Images travel as an on-disk path, never as a bare remote URL.
    assert.ok(row.includes('catalog/images/test/principal.png'));

    const categories = await readFile(
      join(root, 'catalog/woo/categories.csv'),
      'utf8',
    );
    // The category file carries its own header, not the product header.
    assert.equal(
      categories.split('\n')[0],
      'Category name,Slug,Parent,Description',
    );
    assert.ok(categories.includes('processeurs'));
  });

  it('treats an explicit out-of-stock statement as data, not a gap', async () => {
    await writeEntry({ edoctorStock: false });
    await exportCsv();
    const row = (await readProduct())[1];
    assert.ok(row.includes('no'));
  });

  const cases: [string, Override, string][] = [
    ['price', { edoctorSalePrice: null }, 'prix de vente HT'],
    ['unknown availability', { edoctorStock: null }, 'disponibilité'],
    ['gtin', { gtin: null }, 'GTIN'],
    ['photo', { images: [] }, 'photo exacte avec droits'],
    [
      'photo without a rights record',
      { images: [{ ...entry.images[0], rightsUrl: '' }] },
      'photo exacte avec droits',
    ],
    [
      'photo absent from disk',
      { images: [{ ...entry.images[0], path: 'catalog/images/absent.png' }] },
      'photo exacte avec droits',
    ],
    ['source', { sources: [] }, 'source vérifiée'],
    [
      'verification date',
      { sources: [{ ...entry.sources[0], verifiedAt: '' }] },
      'date de vérification',
    ],
  ];

  for (const [label, overrides, expected] of cases)
    it(`refuses to export without a ${label}`, async () => {
      await writeEntry(overrides);
      await assert.rejects(exportCsv(), /Command failed/);
      const { stdout } = await audit().catch((error) => error);
      assert.match(stdout, new RegExp(expected));
    });

  it('never rewrites a CSV for an incomplete catalogue', async () => {
    await writeEntry();
    await exportCsv();
    const before_ = (await readProduct())[1];

    await writeEntry({ edoctorSalePrice: null });
    await assert.rejects(exportCsv(), /Command failed/);
    const after_ = (await readProduct())[1];

    // A stale file must not be presented as a fresh export.
    assert.equal(after_, before_);
  });
});

describe('repository catalogue', () => {
  it('is still refused, and no production CSV exists', async () => {
    const { stdout } = await audit().catch((error) => error);
    assert.match(stdout, /Références analysées/);
    assert.match(stdout, /Export refusé/);
    await assert.rejects(
      readFile(resolve('catalog/woo/products.csv'), 'utf8'),
      /ENOENT/,
    );
  });
});
