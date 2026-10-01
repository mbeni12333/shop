const base = require('./lighthouserc.json');
const { pageProps } = require('./.next/server/pages/produits.json');
const products = pageProps.products;
if (
  !products.length ||
  products.some((product) => product.catalogSource !== 'research')
) {
  throw new Error(
    'Build with EDOCTOR_RESEARCH_PREVIEW=1 and no GraphQL URL before measuring the research preview.',
  );
}
const photographed = products.find((product) => product.image);
if (!photographed)
  throw new Error(
    'A photographed research product is required for this measurement.',
  );

module.exports = {
  ci: {
    ...base.ci,
    collect: {
      ...base.ci.collect,
      url: [
        'http://localhost:3109/',
        `http://localhost:3109/categorie/${photographed.category}`,
        `http://localhost:3109/produit/${photographed.slug}`,
      ],
    },
    upload: { target: 'filesystem', outputDir: 'lighthouse-research-reports' },
  },
};
