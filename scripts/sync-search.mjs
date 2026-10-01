import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
const host = process.env.MEILI_URL,
  key = process.env.MEILI_ADMIN_KEY,
  graphql = process.env.GRAPHQL_URL;
const stateDir = process.env.SYNC_STATE_DIR || '.sync-state';
if (!host || !key || !graphql)
  throw new Error('MEILI_URL, MEILI_ADMIN_KEY and GRAPHQL_URL are required');
async function api(path, method = 'GET', data) {
  const r = await fetch(host + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    ...(data ? { body: JSON.stringify(data) } : {}),
    signal: AbortSignal.timeout(20000),
  });
  if (!r.ok) {
    const e = new Error(`Meilisearch ${r.status}`);
    e.status = r.status;
    throw e;
  }
  return r.status === 204 ? {} : r.json();
}
async function wait(task) {
  if (task.taskUid === undefined) return;
  for (let i = 0; i < 120; i++) {
    const t = await api(`/tasks/${task.taskUid}`);
    if (t.status === 'succeeded') return;
    if (t.status === 'failed' || t.status === 'canceled')
      throw new Error(`Index task ${t.status}`);
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Index task timeout');
}
async function ensure(uid) {
  try {
    await api(`/indexes/${uid}`);
  } catch (e) {
    if (e.status !== 404) throw e;
    await wait(await api('/indexes', 'POST', { uid, primaryKey: 'id' }));
  }
}
async function products() {
  const rows = [];
  let after = null;
  for (let page = 0; page < 100; page++) {
    const r = await fetch(graphql, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'query Index($after:String){products(first:100,after:$after,where:{status:"publish"}){nodes{databaseId slug name sku description(format:RAW) image{sourceUrl} edoctorDetails} pageInfo{hasNextPage endCursor}}}',
        variables: { after },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error(`GraphQL ${r.status}`);
    const result = await r.json();
    if (result.errors) throw new Error('GraphQL schema or backend error');
    for (const p of result.data.products.nodes) {
      if (!p.edoctorDetails) continue;
      rows.push({
        ...JSON.parse(p.edoctorDetails),
        id: p.databaseId,
        slug: p.slug,
        name: p.name,
        sku: p.sku || '',
        description: p.description.replace(/<[^>]*>/g, ''),
        image: p.image?.sourceUrl || '',
      });
    }
    if (!result.data.products.pageInfo.hasNextPage) return rows;
    after = result.data.products.pageInfo.endCursor;
  }
  throw new Error('Catalog pagination limit');
}
async function sync() {
  const rows = await products();
  const digest = createHash('sha256')
    .update(JSON.stringify(rows))
    .digest('hex');
  let previous = '';
  try {
    previous = await readFile(`${stateDir}/digest`, 'utf8');
  } catch {}
  await ensure('products');
  // A saved digest can survive loss of the search volume. Check the live index
  // before skipping, so unchanged WordPress data can rebuild an empty index.
  const stats = await api('/indexes/products/stats');
  if (
    previous === digest &&
    stats.numberOfDocuments === rows.length &&
    !stats.isIndexing &&
    !process.argv.includes('--force')
  )
    return;
  await ensure('products_next');
  await wait(await api('/indexes/products_next/documents', 'DELETE'));
  await wait(
    await api('/indexes/products_next/settings', 'PATCH', {
      searchableAttributes: [
        'name',
        'sku',
        'brand',
        'description',
        'attributes',
      ],
      filterableAttributes: ['category', 'brand', 'tier', 'stock', 'price'],
      sortableAttributes: ['price', 'name'],
      displayedAttributes: ['*'],
    }),
  );
  for (let i = 0; i < rows.length; i += 100)
    await wait(
      await api(
        '/indexes/products_next/documents',
        'POST',
        rows.slice(i, i + 100),
      ),
    );
  await wait(
    await api('/swap-indexes', 'POST', [
      { indexes: ['products', 'products_next'] },
    ]),
  );
  await mkdir(stateDir, { recursive: true });
  await writeFile(`${stateDir}/digest`, digest);
  console.log(`Indexed ${rows.length} published products`);
}
do {
  try {
    await sync();
  } catch (error) {
    console.error('Search sync failed:', error.message);
    if (!process.argv.includes('--watch')) process.exitCode = 1;
  }
  if (process.argv.includes('--watch'))
    await new Promise((r) => setTimeout(r, 60000));
} while (process.argv.includes('--watch'));
