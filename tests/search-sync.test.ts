import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('search rebuilds after index loss, propagates deletions and keeps the live index on GraphQL failure', async () => {
  const indexes = new Map<string, any[]>();
  let source = [
    {
      databaseId: 1,
      slug: 'test-ssd',
      name: 'SSD de test',
      sku: 'fixture',
      description: '<p>Test</p>',
      edoctorDetails: JSON.stringify({
        category: 'ssd',
        price: 100,
        attributes: {},
      }),
    },
  ];
  let graphqlFailure = false;
  let swaps = 0;
  const server = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    const data = body ? JSON.parse(body) : undefined;
    const path = req.url!;
    res.setHeader('Content-Type', 'application/json');
    const reply = (value: unknown) => res.end(JSON.stringify(value));
    if (path === '/graphql')
      return reply(
        graphqlFailure
          ? { errors: [{ message: 'Unavailable' }] }
          : {
              data: {
                products: { nodes: source, pageInfo: { hasNextPage: false } },
              },
            },
      );
    if (path.startsWith('/tasks/')) return reply({ status: 'succeeded' });
    if (path === '/indexes' && req.method === 'POST') {
      indexes.set(data.uid, []);
      return reply({ taskUid: 1 });
    }
    if (path === '/swap-indexes') {
      const live = indexes.get('products')!;
      indexes.set('products', indexes.get('products_next')!);
      indexes.set('products_next', live);
      swaps++;
      return reply({ taskUid: 1 });
    }
    const match = path.match(
      /^\/indexes\/([^/]+)(?:\/(stats|documents|settings))?$/,
    );
    if (!match || !indexes.has(match[1])) {
      res.statusCode = 404;
      return reply({ message: 'Missing' });
    }
    const [, uid, endpoint] = match;
    if (!endpoint) return reply({ uid });
    if (endpoint === 'stats')
      return reply({
        numberOfDocuments: indexes.get(uid)!.length,
        isIndexing: false,
      });
    if (endpoint === 'documents' && req.method === 'DELETE')
      indexes.set(uid, []);
    if (endpoint === 'documents' && req.method === 'POST')
      indexes.get(uid)!.push(...data);
    return reply({ taskUid: 1 });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as { port: number };
  const origin = `http://127.0.0.1:${address.port}`;
  const state = await mkdtemp(join(tmpdir(), 'edoctor-sync-'));
  const run = () =>
    promisify(execFile)(process.execPath, ['scripts/sync-search.mjs'], {
      env: {
        ...process.env,
        MEILI_URL: origin,
        MEILI_ADMIN_KEY: 'fixture',
        GRAPHQL_URL: `${origin}/graphql`,
        SYNC_STATE_DIR: state,
      },
    });
  try {
    await run();
    assert.equal(indexes.get('products')!.length, 1);
    assert.equal(swaps, 1);
    await run();
    assert.equal(swaps, 1, 'unchanged catalog skips reindex');
    indexes.clear();
    await run();
    assert.equal(indexes.get('products')!.length, 1);
    assert.equal(swaps, 2);
    graphqlFailure = true;
    await assert.rejects(run());
    assert.equal(indexes.get('products')!.length, 1);
    assert.equal(swaps, 2);
    graphqlFailure = false;
    source = [];
    await run();
    assert.equal(indexes.get('products')!.length, 0);
    assert.equal(swaps, 3);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(state, { recursive: true, force: true });
  }
});
