import { readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const expectedCategories = [
  'pc-fixes',
  'portables',
  'processeurs',
  'cartes-graphiques',
  'cartes-meres',
  'ram',
  'ssd',
  'boitiers',
  'alimentations',
  'refroidissement',
  'ecrans',
  'claviers',
  'souris',
  'casques',
];
const expectedTiers = ['entree', 'milieu', 'haut'];
const rows = [];
const failures = [];
for (const file of (await readdir('catalog/research')).filter(
  (file) => file.endsWith('.json') && file !== 'audit.json',
)) {
  const data = JSON.parse(await readFile(`catalog/research/${file}`, 'utf8'));
  if (data.targetTotal !== 126 || data.categoryTarget !== 9)
    failures.push(`${file}: objectif incorrect`);
  if (!Array.isArray(data.products)) {
    failures.push(`${file}: produits absents`);
    continue;
  }
  rows.push(...data.products);
}
const skus = new Set();
const references = new Set();
function validGtin(value) {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(value)) return false;
  const digits = [...value].map(Number);
  const check = digits.pop();
  const sum = digits
    .reverse()
    .reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0,
    );
  return (10 - (sum % 10)) % 10 === check;
}
for (const row of rows) {
  const id = row.sku || '(SKU absent)';
  for (const field of [
    'sku',
    'name',
    'descriptionFr',
    'selectionRationale',
    'selectionStatus',
    'imageStatus',
  ]) {
    if (typeof row[field] !== 'string' || !row[field].trim())
      failures.push(`${id}: ${field} absent`);
  }
  if (skus.has(id)) failures.push(`${id}: SKU en double`);
  skus.add(id);
  if (
    !expectedCategories.includes(row.category) ||
    !expectedTiers.includes(row.tier)
  )
    failures.push(`${id}: catégorie/gamme inconnue`);
  if (row.manufacturerPartNumber) {
    if (references.has(row.manufacturerPartNumber))
      failures.push(`${id}: référence fabricant en double`);
    references.add(row.manufacturerPartNumber);
  } else if (!id.startsWith('EDO-'))
    failures.push(`${id}: référence inconnue sans SKU interne explicite`);
  if (row.gtin !== null && !validGtin(row.gtin))
    failures.push(`${id}: GTIN invalide`);
  if (
    !row.attributes ||
    !Object.keys(row.attributes).length ||
    Object.values(row.attributes).some(
      (value) => typeof value !== 'string' || !value.trim(),
    )
  )
    failures.push(`${id}: attributs invalides`);
  if (!Array.isArray(row.sources) || !row.sources.length)
    failures.push(`${id}: sources absentes`);
  for (const source of row.sources || []) {
    if (
      !/^https:\/\//.test(source.url) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(source.verifiedAt) ||
      !source.kind
    )
      failures.push(`${id}: source non datée ou invalide`);
  }
  for (const field of ['images', 'priceObservations', 'missing'])
    if (!Array.isArray(row[field]))
      failures.push(`${id}: ${field} doit être explicite`);
  if (row.edoctorSalePrice !== null || row.edoctorStock !== null)
    failures.push(
      `${id}: données commerciales non autorisées dans la recherche`,
    );
  for (const price of row.priceObservations || []) {
    if (
      !(price.amount > 0) ||
      !price.currency ||
      !price.taxBasis ||
      !price.observedAt ||
      !price.url ||
      !price.verification
    )
      failures.push(`${id}: observation de prix incomplète`);
  }
  for (const image of row.images || []) {
    try {
      const imageRoot = resolve('catalog/images');
      const localImage = resolve(image.path);
      const localProvenance = resolve(image.provenancePath);
      for (const path of [localImage, localProvenance]) {
        const inside = relative(imageRoot, path);
        if (inside.startsWith('..') || isAbsolute(inside))
          throw new Error('chemin hors du dossier images');
      }
      const bytes = await readFile(localImage);
      const provenance = JSON.parse(await readFile(localProvenance, 'utf8'));
      const metadata = await sharp(bytes).metadata();
      const stats = await sharp(bytes).stats();
      if (
        metadata.format !== 'png' ||
        !metadata.hasAlpha ||
        stats.channels.at(-1).min !== 0 ||
        stats.channels.at(-1).max !== 255
      )
        throw new Error('PNG transparent absent');
      if (
        provenance.sha256 !== createHash('sha256').update(bytes).digest('hex')
      )
        throw new Error('empreinte différente du fichier vérifié');
      if (
        provenance.sourceUrl !== image.sourceUrl ||
        provenance.rightsUrl !== image.rightsUrl ||
        !provenance.rightsVerifiedAt ||
        provenance.visualReview !== 'reviewed_on_edoctor_background'
      )
        throw new Error('provenance, droits ou contrôle visuel incomplets');
    } catch (error) {
      failures.push(`${id}: image invalide (${error.message})`);
    }
  }
}
const categories = expectedCategories.map((category) => ({
  category,
  count: rows.filter((row) => row.category === category).length,
  tiers: Object.fromEntries(
    expectedTiers.map((tier) => [
      tier,
      rows.filter((row) => row.category === category && row.tier === tier)
        .length,
    ]),
  ),
}));
for (const category of categories) {
  if (
    category.count &&
    (category.count !== 9 ||
      Object.values(category.tiers).some((count) => count !== 3))
  )
    failures.push(`${category.category}: répartition différente de 3/3/3`);
}
const report = {
  status: failures.length ? 'invalid_research' : 'valid_partial_research',
  target: 126,
  researched: rows.length,
  remaining: 126 - rows.length,
  categories,
  manufacturerReferencesMissing: rows
    .filter((row) => !row.manufacturerPartNumber)
    .map((row) => row.sku),
  gtinMissing: rows.filter((row) => !row.gtin).length,
  withoutPriceObservation: rows.filter((row) => !row.priceObservations.length)
    .length,
  withoutProductImages: rows.filter((row) => !row.images.length).length,
  provisionalSelections: rows.filter((row) =>
    row.selectionStatus.startsWith('provisional'),
  ).length,
  failures,
  limitations:
    'Ce contrôle valide les données de recherche, pas les caractéristiques dans les sources, les droits des images, leur transparence, les CSV ou un import WooCommerce. Le catalogue final n’est pas livré.',
};
await writeFile(
  'catalog/research/audit.json',
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(
  `${report.status}: ${rows.length}/126 candidats, ${report.remaining} à documenter, ${report.withoutProductImages} sans photo.`,
);
for (const failure of failures) console.error(failure);
if (
  failures.length ||
  (process.argv.includes('--complete') &&
    (rows.length !== 126 ||
      report.manufacturerReferencesMissing.length ||
      report.withoutProductImages ||
      report.withoutPriceObservation ||
      report.provisionalSelections))
)
  process.exitCode = 1;
