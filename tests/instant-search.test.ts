import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  searchDocument,
  searchSnapshot,
  type SearchRequest,
} from '../src/edoctor/search-engine';
import {
  routeFromURL,
  routeURL,
  searchStateMapping,
} from '../src/edoctor/search-routing';
import type { Product } from '../src/edoctor/model';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';

const product = (
  id: number,
  price: number | null,
  brand: string,
  socket: string,
): Product => ({
  id,
  slug: `test-${id}`,
  name: `Processeur ${id}`,
  sku: `TEST-${id}`,
  categories: ['processeurs'],
  brand,
  tier: '',
  description: '',
  image: '',
  price,
  stock: true,
  purchasable: price !== null,
  attributes: { Socket: socket },
  uses: [],
  variations: [],
});
const docs = [
  product(1, 100, 'A', 'AM4, AM5'),
  product(2, 300, 'A', 'AM5'),
  product(3, null, 'B', 'LGA1851'),
].map(searchDocument);
test('InstantSearch snapshot supports OR values, AND groups, disjunctive counts and exact tokens', () => {
  const result = searchSnapshot(docs, {
    indexName: 'products',
    params: {
      facetFilters: [
        ['brand:A'],
        ['facets.spec_socket:AM4', 'facets.spec_socket:AM5'],
      ],
      facets: ['facets.spec_socket'],
    },
  });
  assert.equal(result.nbHits, 2);
  assert.deepEqual(result.facets['facets.spec_socket'], { AM4: 1, AM5: 2 });
  assert.equal(
    searchSnapshot(docs, {
      indexName: 'products',
      params: { facetFilters: ['facets.spec_socket:AM'] },
    }).nbHits,
    0,
  );
  assert.equal(
    searchSnapshot(docs, {
      indexName: 'products',
      params: { numericFilters: ['price>=150', 'price<=350'] },
    }).nbHits,
    1,
  );
});
test('price ordering puts unknown prices last and pagination does not mutate the snapshot', () => {
  const result = searchSnapshot(docs, {
    indexName: 'products:price:desc',
    params: { hitsPerPage: 1, page: 1 },
  });
  assert.equal(result.hits[0].id, 1);
  assert.equal(result.nbPages, 3);
  assert.equal(docs[0].id, 1);
});
test('search routes round-trip multiple values, French characters, budget, sort and page', () => {
  const state = {
    products: {
      query: 'écran OLED',
      refinementList: {
        brand: ['A', 'B'],
        'facets.spec_socket': ['AM4', 'AM5'],
      },
      range: { price: '100:400' },
      sortBy: 'products:price:desc',
      page: 2,
    },
  };
  const url = routeURL(searchStateMapping.stateToRoute(state), {
    origin: 'https://example.test',
    pathname: '/categorie/processeurs',
  });
  assert.deepEqual(
    searchStateMapping.routeToState(routeFromURL(new URL(url))),
    state,
  );
  assert.equal(new URL(url).pathname, '/categorie/processeurs');
});

test('the official Meilisearch adapter translates multiselect, budget and sort and rejects service failure', async (context) => {
  let requestBody = '';
  let unavailable = false;
  const { searchClient } = instantMeiliSearch(
    'https://search.test',
    'search-only-test-key',
    {
      primaryKey: 'id',
      finitePagination: true,
      keepZeroFacets: true,
      requestInit: undefined,
      httpClient: async (_url, init) => {
        if (unavailable) throw new Error('Service unavailable');
        requestBody = String(init?.body);
        const { queries } = JSON.parse(requestBody);
        return {
          results: queries.map((query: { indexUid: string; q: string }) => ({
            indexUid: query.indexUid,
            query: query.q,
            hits: [docs[0]],
            processingTimeMs: 1,
            page: 1,
            hitsPerPage: 24,
            totalHits: 1,
            totalPages: 1,
            facetDistribution: { brand: { A: 1, B: 0 } },
            facetStats: { price: { min: 100, max: 300 } },
          })),
        };
      },
    },
  );
  const search = searchClient.search as unknown as (
    requests: SearchRequest[],
  ) => Promise<{
    results: { nbHits: number; hits: { objectID: string | number }[] }[];
  }>;
  const response = await search([
    {
      indexName: 'products:price:asc',
      params: {
        query: 'Processeur',
        hitsPerPage: 24,
        facets: ['brand', 'price'],
        facetFilters: [['brand:A', 'brand:B']],
        numericFilters: ['price<=300'],
      },
    },
  ]);
  assert.equal(response.results[0].nbHits, 1);
  assert.equal(String(response.results[0].hits[0].objectID), '1');
  assert.match(requestBody, /brand/);
  assert.match(requestBody, /price:asc/);
  assert.deepEqual(JSON.parse(requestBody).queries[0].filter, [
    '"price"<=300',
    ['"brand"="A"', '"brand"="B"'],
  ]);
  unavailable = true;
  context.mock.method(console, 'error', () => {});
  await assert.rejects(
    search([{ indexName: 'products', params: { query: 'different' } }]),
  );
});
