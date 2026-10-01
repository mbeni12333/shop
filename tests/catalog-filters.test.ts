import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogFacets, filterProducts } from '../src/edoctor/filters';
import type { Product } from '../src/edoctor/model';

const product = (id: number, overrides: Partial<Product>): Product => ({
  id,
  slug: `fixture-${id}`,
  sku: `TEST-${id}`,
  name: `Produit de test ${id}`,
  category: 'processeurs',
  brand: 'AMD',
  tier: 'Milieu de gamme',
  description: '',
  image: '',
  price: 200,
  stock: true,
  purchasable: true,
  uses: [],
  variations: [],
  attributes: { Socket: 'AM5', Cœurs: '6', TDP: '65 W' },
  ...overrides,
});
const products = [
  product(1, {
    price: 100,
    attributes: { Socket: 'AM4', Cœurs: '6', TDP: '65 W' },
  }),
  product(2, { price: 230 }),
  product(3, {
    price: 500,
    brand: 'Intel',
    tier: 'Haut de gamme',
    attributes: { Socket: 'LGA1851', Cœurs: '24', TDP: '125 W' },
  }),
  product(4, { price: null }),
];

test('technical filters are meaningful for the category and support French accents', () => {
  const facets = catalogFacets(products);
  assert.deepEqual(
    facets.map((facet) => facet.label),
    ['Socket', 'Cœurs', 'TDP'],
  );
  assert.equal(facets[1].key, 'spec_coeurs');
  assert.deepEqual(
    filterProducts(products, {
      spec_socket: 'AM5',
      budget: '250',
      marque: 'AMD',
    }).map((product) => product.id),
    [2],
  );
  assert.deepEqual(
    filterProducts(products, { gamme: 'Haut de gamme', spec_coeurs: '24' }).map(
      (product) => product.id,
    ),
    [3],
  );
});

test('sorting keeps prices on request last and does not mutate source order', () => {
  assert.deepEqual(
    filterProducts(products, { tri: 'decroissant' }).map(
      (product) => product.id,
    ),
    [3, 2, 1, 4],
  );
  assert.deepEqual(
    filterProducts(products, { tri: 'croissant' }).map((product) => product.id),
    [1, 2, 3, 4],
  );
  assert.deepEqual(
    products.map((product) => product.id),
    [1, 2, 3, 4],
  );
  assert.equal(filterProducts(products, { budget: '0' }).length, 0);
  assert.equal(filterProducts(products, { budget: 'invalid' }).length, 4);
});

test('mixed-category catalog avoids combining unrelated technical attributes', () => {
  assert.deepEqual(
    catalogFacets([
      ...products,
      product(5, { category: 'ssd', attributes: { Capacité: '1 To' } }),
    ]),
    [],
  );
  assert.equal(
    filterProducts(products, { marque: ['AMD', 'Intel'] }).length,
    4,
  );
});
