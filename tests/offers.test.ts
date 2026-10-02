import { test } from 'node:test';
import assert from 'node:assert/strict';
import { currentOffers, OFFER_FILTER } from '../src/edoctor/offers';
import { searchDocument, searchSnapshot } from '../src/edoctor/search-engine';
import type { Product } from '../src/edoctor/model';

test('offers require a published sale flag, known price and purchasable stock', () => {
  const base = { onSale: true, price: 100, stock: true, purchasable: true };
  const products = [
    { ...base, id: 1, publishedAt: '2026-10-01' },
    { ...base, id: 2, publishedAt: '2026-10-02' },
    { ...base, id: 3, onSale: undefined },
    { ...base, id: 4, price: null },
    { ...base, id: 5, stock: false },
    { ...base, id: 6, purchasable: false },
  ] as Product[];
  assert.deepEqual(
    currentOffers(products).map((product) => product.id),
    [2, 1],
  );
  assert.deepEqual(
    products.map((product) => product.id),
    [1, 2, 3, 4, 5, 6],
  );
});

test('the offers constraint survives search and category filtering', () => {
  const base = {
    name: 'Test',
    sku: '',
    description: '',
    brand: '',
    attributes: {},
    categories: ['ram'],
    price: 100,
    stock: true,
    purchasable: true,
    onSale: true,
  } as Product;
  const documents = [
    { ...base, id: 1 },
    { ...base, id: 2, onSale: false },
    { ...base, id: 3, stock: false },
    { ...base, id: 4, categories: ['ssd'] },
  ].map(searchDocument);
  const result = searchSnapshot(documents, {
    indexName: 'products',
    params: { filters: 'categories = "ram" AND ' + OFFER_FILTER },
  });
  assert.deepEqual(
    result.hits.map((product) => product.id),
    [1],
  );
});
