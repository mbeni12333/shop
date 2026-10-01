import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  researchCatalog,
  researchPreviewEnabled,
} from '../src/edoctor/research-catalog';
import { catalog, productBySlug } from '../src/edoctor/server';

test('all researched products have distinct identities and no invented commercial data', () => {
  const products = researchCatalog();
  assert.equal(products.length, 45);
  assert.equal(new Set(products.map((product) => product.id)).size, 45);
  assert.equal(new Set(products.map((product) => product.slug)).size, 45);
  for (const product of products) {
    assert.equal(product.price, null);
    assert.equal(product.stock, false);
    assert.equal(product.purchasable, false);
    assert.ok(product.research?.sources.length);
    assert.ok(Object.keys(product.attributes).length);
  }
  assert.equal(products.filter((product) => product.image).length, 2);
});
test('explicit preview cannot replace WooGraphQL and resolves researched product details', async () => {
  const keys = [
    'EDOCTOR_RESEARCH_PREVIEW',
    'GRAPHQL_URL',
    'NEXT_PUBLIC_GRAPHQL_URL',
  ] as const;
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  try {
    process.env.EDOCTOR_RESEARCH_PREVIEW = '1';
    delete process.env.GRAPHQL_URL;
    delete process.env.NEXT_PUBLIC_GRAPHQL_URL;
    assert.equal(researchPreviewEnabled(), true);
    const products = await catalog();
    assert.equal(products.length, 45);
    const product = await productBySlug(products[0].slug);
    assert.equal(product?.sku, products[0].sku);
    assert.ok(product?.research);
    assert.equal(await productBySlug('unknown-model'), null);
    process.env.GRAPHQL_URL = 'https://example.invalid/graphql';
    assert.equal(researchPreviewEnabled(), false);
    delete process.env.GRAPHQL_URL;
    process.env.EDOCTOR_RESEARCH_PREVIEW = '0';
    assert.equal(researchPreviewEnabled(), false);
    assert.deepEqual(await catalog(), []);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
