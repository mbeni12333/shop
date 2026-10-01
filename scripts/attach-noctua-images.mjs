import { readFile, writeFile } from 'node:fs/promises';

if (!process.argv.includes('--reviewed'))
  throw new Error(
    'Inspect the original photos on the EDoctor background before passing --reviewed.',
  );
const file = 'catalog/research/refroidissement.json';
const data = JSON.parse(await readFile(file, 'utf8'));
for (const sku of ['NH-D15-G2', 'NH-U12S-CHROMAX-BLACK']) {
  const row = data.products.find((product) => product.sku === sku);
  if (!row) throw new Error(`${sku}: missing research row`);
  const provenancePath = `catalog/images/refroidissement/${sku}/provenance.json`;
  const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
  provenance.visualReview = 'reviewed_on_edoctor_background';
  provenance.visualReviewedAt = new Date().toISOString();
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
  row.images = [
    {
      path: provenance.path,
      sourceUrl: provenance.sourceUrl,
      rightsUrl: provenance.rightsUrl,
      provenancePath,
    },
  ];
  row.imageStatus = 'official_original_transparent_png_reviewed';
  row.missing = row.missing.filter(
    (item) => item !== 'Photo exacte avec alpha',
  );
}
await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(
  'Two visually reviewed original photos linked to the matching product rows.',
);
