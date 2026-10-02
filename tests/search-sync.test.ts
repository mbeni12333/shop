import { test } from 'node:test';
import assert from 'node:assert/strict';
import { syncSearch, documentFromWoo } from '../scripts/sync-search.mjs';

const node = {
  databaseId: 1,
  name: 'Produit de test',
  slug: 'test',
  sku: 'TEST',
  description: '<p>Test</p>',
  image: null,
  edoctorDetails: JSON.stringify({
    categories: ['processeurs'],
    attributes: { Socket: 'AM4, AM5' },
    price: 100,
  }),
};
test('WooCommerce attribute tokens are identical in the index and the storefront', () => {
  assert.deepEqual(documentFromWoo(node).facets, {
    spec_socket: ['AM4', 'AM5'],
  });
  assert.throws(() => documentFromWoo({ ...node, edoctorDetails: '{}' }));
});
test('sync waits for all tasks before swapping and does not send credentials to GraphQL', async () => {
  const calls: string[] = [];
  let uid = 0;
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input);
    calls.push(`${init?.method ?? 'GET'} ${url}`);
    if (url === 'https://woo.test/graphql') {
      assert.ok(!JSON.stringify(init?.headers).includes('secret'));
      return Response.json({
        data: { products: { nodes: [node], pageInfo: { hasNextPage: false } } },
      });
    }
    if (url.includes('/tasks/')) return Response.json({ status: 'succeeded' });
    if (init?.method === 'GET') return Response.json({ uid: 'products' });
    return Response.json({ taskUid: ++uid });
  };
  assert.deepEqual(
    await syncSearch({
      graphqlURL: 'https://woo.test/graphql',
      meiliURL: 'https://meili.test',
      key: 'secret',
      fetcher,
    }),
    { count: 1 },
  );
  const swap = calls.findIndex((call) => call.includes('/swap-indexes'));
  const documents = calls.findIndex((call) => call.endsWith('/documents'));
  assert.ok(swap > documents);
  assert.ok(calls[documents + 1].includes('/tasks/'));
});
test('a backend failure or failed indexing task never replaces the live index', async () => {
  for (const failGraphql of [true, false]) {
    let swapped = false;
    const fetcher: typeof fetch = async (input, init) => {
      const url = String(input);
      if (url.includes('/swap-indexes')) swapped = true;
      if (url.includes('/graphql'))
        return failGraphql
          ? new Response('', { status: 503 })
          : Response.json({
              data: {
                products: { nodes: [node], pageInfo: { hasNextPage: false } },
              },
            });
      if (url.includes('/tasks/')) return Response.json({ status: 'failed' });
      return Response.json({ taskUid: 1 });
    };
    await assert.rejects(
      syncSearch({
        graphqlURL: 'https://woo.test/graphql',
        meiliURL: 'https://meili.test',
        key: 'secret',
        fetcher,
      }),
    );
    assert.equal(swapped, false);
  }
});
