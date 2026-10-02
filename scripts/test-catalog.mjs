import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

// Deliberately fictional fixtures, used only by this loopback test backend.
const node = (id, name, categories, overrides = {}) => ({
  databaseId: id,
  slug: `test-${id}`,
  name,
  sku: `FIXTURE-${id}`,
  description: 'Référence fictive réservée aux tests. Aucun prix commercial.',
  image: null,
  edoctorDetails: JSON.stringify({
    categories,
    brand: 'Marque test',
    tier: 'Milieu de gamme',
    price: 200,
    stock: true,
    purchasable: true,
    attributes: { Socket: 'AM5', Cœurs: '6', TDP: '65 W' },
    uses: ['gaming', 'bureautique'],
    variations: [],
    ...overrides,
  }),
});
const products = [
  node(1, 'Processeur test AM4', ['processeurs'], {
    price: 100,
    attributes: { Socket: 'AM4', Cœurs: '6', TDP: '65 W' },
  }),
  node(2, 'Processeur test AM5', ['processeurs'], {
    price: 230,
    onSale: true,
    publishedAt: '2026-10-01T10:00:00Z',
  }),
  node(3, 'Processeur test LGA', ['processeurs'], {
    brand: 'Autre marque test',
    tier: 'Haut de gamme',
    price: 500,
    attributes: { Socket: 'LGA1851', Cœurs: '24', TDP: '125 W' },
  }),
  node(4, 'Processeur test sur demande', ['processeurs'], {
    price: null,
    purchasable: false,
  }),
  node(5, 'Portable test configurable', ['portables'], {
    price: null,
    attributes: { RAM: '16 Go, 32 Go', Stockage: '1 To' },
    variations: [
      { id: 51, name: '16 Go — 1 To', price: 750, stock: true },
      { id: 52, name: '32 Go — 1 To', price: 950, stock: true },
      { id: 53, name: '64 Go — 2 To', price: 1400, stock: false },
    ],
  }),
  node(6, 'Portable test indisponible', ['portables'], {
    stock: false,
    price: 600,
  }),
  // A product filed under two WooCommerce categories at once.
  node(7, 'Processeur test polyvalent', ['processeurs', 'pc-fixes'], {
    price: 300,
  }),
];
// WooCommerce owns the taxonomy; the storefront only maps slugs to artwork.
const categories = [
  {
    slug: 'pc-fixes',
    name: 'PC fixes',
    description: 'Un ordinateur à votre mesure',
    count: 1,
    image: null,
  },
  {
    slug: 'portables',
    name: 'Portables',
    description: 'La puissance vous accompagne',
    count: 2,
    image: null,
  },
  {
    slug: 'processeurs',
    name: 'Processeurs',
    description: 'Le cœur de votre configuration',
    count: 5,
    image: null,
  },
];
const posts = [
  {
    databaseId: 101,
    slug: 'article-test',
    title: 'Choisir son processeur',
    date: '2026-10-01T10:00:00',
    excerpt: '<p>Guide fictif de test.</p>',
    content:
      '<p>Un processeur <bdi dir="ltr">Ryzen 7 — 32 Go — 120 Hz</bdi> convient à votre usage.</p><script>window.fixtureUnsafe=true</script>',
  },
];
let queries = 0;
const server = createServer(async (request, response) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  try {
    const { query, variables = {} } = JSON.parse(body);
    queries++;
    let data;
    if (query.includes('query StorefrontCapabilities'))
      data = { products: { nodes: [] }, productCategories: { nodes: [] } };
    else if (query.includes('query Categories'))
      data = { productCategories: { nodes: categories } };
    else if (query.includes('query Catalog'))
      data = {
        products: {
          nodes: products,
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      };
    else if (query.includes('query Product'))
      data = {
        product:
          products.find((product) => product.slug === variables.slug) || null,
      };
    else if (query.includes('query Posts'))
      data = {
        posts: {
          nodes: posts,
          pageInfo: { hasNextPage: false, endCursor: null },
        },
      };
    else throw new Error('Unexpected GraphQL fixture operation');
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ data }));
  } catch (error) {
    response.writeHead(400);
    response.end(JSON.stringify({ errors: [{ message: error.message }] }));
  }
});
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(3111, '127.0.0.1', resolve);
});
const previousNextEnv = await readFile('next-env.d.ts', 'utf8').catch(
  () => null,
);
const env = {
  ...process.env,
  EDOCTOR_BUILD_DIR: '.next-catalog-test',
  NEXT_PUBLIC_MEILI_URL: '',
  NEXT_PUBLIC_MEILI_SEARCH_KEY: '',
  GRAPHQL_URL: 'http://127.0.0.1:3111/graphql',
  NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3112',
  CHECKOUT_SECRET: '',
  WORDPRESS_URL: '',
};
function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], {
      env,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(new Error(`Command exited ${code}`)),
    );
  });
}
try {
  if (!process.argv.includes('--skip-build'))
    await run('node_modules/next/dist/bin/next', ['build', '--webpack']);
  if (process.argv.includes('--serve')) {
    console.log('Catalogue fictif de vérification : http://127.0.0.1:3112');
    await run('node_modules/next/dist/bin/next', [
      'start',
      '--hostname',
      '127.0.0.1',
      '--port',
      '3112',
    ]);
  } else if (process.argv.includes('--measure')) {
    env.CHROME_PATH = (await import('playwright')).chromium.executablePath();
    await run('node_modules/@lhci/cli/src/cli.js', [
      'autorun',
      '--config=lighthouserc.catalog.cjs',
    ]);
  } else
    await run('node_modules/@playwright/test/cli.js', [
      'test',
      '--config=playwright.catalog.config.ts',
    ]);
  if (!queries) throw new Error('The fixture backend was never queried');
  console.log(
    `Catalog fixture suite completed with ${queries} GraphQL requests. No real WooCommerce was modified.`,
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => server.close(resolve));
  if (previousNextEnv !== null)
    await writeFile('next-env.d.ts', previousNextEnv);
}
