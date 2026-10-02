import {
  searchDocument,
  searchSnapshot,
  type SearchRequest,
} from './search-engine';
import type { Product } from './model';

export const SEARCH_INDEX = 'products';
export const meiliConfigured = Boolean(
  process.env.NEXT_PUBLIC_MEILI_URL && process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY,
);
const loadRemote = () =>
  import('@meilisearch/instant-meilisearch').then(
    ({ instantMeiliSearch }) =>
      instantMeiliSearch(
        process.env.NEXT_PUBLIC_MEILI_URL!,
        process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY!,
        {
          primaryKey: 'id',
          finitePagination: true,
          keepZeroFacets: true,
          httpClient: undefined,
          requestInit: undefined,
        },
      ).searchClient,
  );
let remoteClient: ReturnType<typeof loadRemote> | undefined;

export function createSearchClient(products?: Product[]) {
  const documents = products?.map(searchDocument);
  return {
    async search(requests: SearchRequest[]) {
      if (meiliConfigured) {
        const client = await (remoteClient ??= loadRemote());
        const search = client.search as unknown as (
          requests: SearchRequest[],
        ) => Promise<unknown>;
        return search(requests);
      }
      if (documents)
        return {
          results: requests.map((request) =>
            searchSnapshot(documents, request),
          ),
        };
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests }),
      });
      if (!response.ok)
        throw new Error('Recherche temporairement indisponible');
      return response.json();
    },
  };
}
