import { pathToFileURL } from 'node:url';

export const attributeKey = (label) =>
  `spec_${label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim()
    .replace(/[^a-z0-9]+/g, '_')}`;
export function documentFromWoo(node) {
  const detail = JSON.parse(node.edoctorDetails);
  if (
    !Number.isInteger(node.databaseId) ||
    !node.slug ||
    !node.name ||
    !Array.isArray(detail.categories) ||
    !detail.attributes ||
    !(
      detail.price === null ||
      (Number.isFinite(detail.price) && detail.price >= 0)
    )
  )
    throw new Error('Produit WooCommerce invalide : index précédent conservé');
  return {
    ...detail,
    id: node.databaseId,
    objectID: String(node.databaseId),
    slug: node.slug,
    name: node.name,
    sku: node.sku || '',
    description: (node.description || '').replace(/<[^>]*>/g, ''),
    image: node.image?.sourceUrl || '',
    facets: Object.fromEntries(
      Object.entries(detail.attributes)
        .filter(
          ([label]) =>
            !['marque', 'gamme', 'usage'].includes(label.toLowerCase()),
        )
        .map(([label, value]) => [
          attributeKey(label),
          String(value)
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
        ]),
    ),
  };
}

export async function syncSearch({
  graphqlURL,
  meiliURL,
  key,
  fetcher = fetch,
}) {
  if (!graphqlURL || !meiliURL || !key)
    throw new Error('Configurer GRAPHQL_URL, MEILI_URL et MEILI_ADMIN_KEY');
  const api = async (path, method = 'GET', body) => {
    const response = await fetcher(`${meiliURL.replace(/\/$/, '')}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      const error = new Error(`Meilisearch : HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    return response.status === 204 ? null : response.json();
  };
  const wait = async (task) => {
    if (!Number.isInteger(task?.taskUid))
      throw new Error('Tâche Meilisearch invalide');
    for (let attempt = 0; attempt < 120; attempt++) {
      const result = await api(`/tasks/${task.taskUid}`);
      if (result.status === 'succeeded') return;
      if (['failed', 'canceled'].includes(result.status))
        throw new Error('Indexation échouée : index précédent conservé');
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    throw new Error('Indexation trop longue : index précédent conservé');
  };
  const documents = [];
  let after = null;
  for (let page = 0; ; page++) {
    if (page >= 100) throw new Error('Pagination WooGraphQL incomplète');
    const response = await fetcher(graphqlURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query:
          'query Catalog($after:String){products(first:100,after:$after,where:{status:"publish"}){nodes{databaseId slug name sku description image{sourceUrl} edoctorDetails} pageInfo{hasNextPage endCursor}}}',
        variables: { after },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error('WooGraphQL indisponible : index précédent conservé');
    const payload = await response.json();
    if (
      payload.errors?.length ||
      !payload.data?.products?.pageInfo ||
      !Array.isArray(payload.data.products.nodes)
    )
      throw new Error('Réponse WooGraphQL invalide');
    documents.push(...payload.data.products.nodes.map(documentFromWoo));
    const info = payload.data.products.pageInfo;
    if (!info.hasNextPage) break;
    if (!info.endCursor || info.endCursor === after)
      throw new Error('Pagination WooGraphQL invalide');
    after = info.endCursor;
  }
  if (new Set(documents.map((doc) => doc.id)).size !== documents.length)
    throw new Error('Identifiants produits dupliqués');
  const staging = `products_build_${Date.now()}`;
  try {
    await wait(
      await api('/indexes', 'POST', { uid: staging, primaryKey: 'id' }),
    );
    const attributes = [
      ...new Set(
        documents.flatMap((doc) =>
          Object.keys(doc.facets).map((key) => `facets.${key}`),
        ),
      ),
    ];
    await wait(
      await api(`/indexes/${staging}/settings`, 'PATCH', {
        searchableAttributes: [
          'name',
          'sku',
          'brand',
          'description',
          'attributes',
        ],
        filterableAttributes: [
          'categories',
          'brand',
          'tier',
          'price',
          'stock',
          'onSale',
          'purchasable',
          ...attributes,
        ],
        sortableAttributes: ['price', 'name'],
        pagination: { maxTotalHits: Math.max(1000, documents.length) },
      }),
    );
    for (let offset = 0; offset < documents.length; offset += 500)
      await wait(
        await api(
          `/indexes/${staging}/documents`,
          'POST',
          documents.slice(offset, offset + 500),
        ),
      );
    try {
      await api('/indexes/products');
    } catch (error) {
      if (error.status !== 404) throw error;
      await wait(
        await api('/indexes', 'POST', { uid: 'products', primaryKey: 'id' }),
      );
    }
    await wait(
      await api('/swap-indexes', 'POST', [{ indexes: ['products', staging] }]),
    );
    return { count: documents.length };
  } finally {
    try {
      await wait(await api(`/indexes/${staging}`, 'DELETE'));
    } catch {
      /* Cleanup failure must not undo a successful swap. */
    }
  }
}

async function main() {
  const run = () =>
    syncSearch({
      graphqlURL: process.env.GRAPHQL_URL,
      meiliURL: process.env.MEILI_URL,
      key: process.env.MEILI_ADMIN_KEY,
    });
  do {
    try {
      const result = await run();
      console.log(
        `Index WooCommerce synchronisé : ${result.count} produits publiés.`,
      );
    } catch (error) {
      console.error(error.message);
      if (!process.argv.includes('--watch')) {
        process.exitCode = 1;
        break;
      }
    }
    if (!process.argv.includes('--watch')) break;
    await new Promise((resolve) => setTimeout(resolve, 60000));
  } while (true);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  void main();
