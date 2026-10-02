import type { Product } from './model';
import { attributeKey } from './filters';
import { OFFER_FILTER, isCurrentOffer } from './offers';

export type SearchDocument = Product & {
  objectID: string;
  facets: Record<string, string[]>;
};
type FilterGroup = string | FilterGroup[];
export type SearchRequest = {
  indexName: string;
  params?: {
    query?: string;
    page?: number;
    hitsPerPage?: number;
    facets?: string[];
    facetFilters?: FilterGroup;
    numericFilters?: FilterGroup;
    filters?: string;
  };
};
const flatten = (group: FilterGroup): string[] =>
  typeof group === 'string' ? [group] : group.flatMap(flatten);
export const searchDocument = (product: Product): SearchDocument => ({
  ...product,
  objectID: String(product.id),
  facets: Object.fromEntries(
    Object.entries(product.attributes)
      .filter(
        ([key]) =>
          !['marque', 'gamme', 'usage'].includes(key.toLocaleLowerCase('fr')),
      )
      .map(([key, value]) => [
        attributeKey(key),
        value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
      ]),
  ),
});

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe');
function facetValues(doc: SearchDocument, attr: string): string[] {
  if (attr.startsWith('facets.')) return doc.facets[attr.slice(7)] ?? [];
  if (attr === 'tags.name') return (doc.tags || []).map((tag) => tag.name);
  if (attr === 'categories') return doc.categories;
  if (attr === 'brand') return doc.brand ? [doc.brand] : [];
  if (attr === 'tier') return doc.tier ? [doc.tier] : [];
  if (attr === 'price') return doc.price !== null ? [String(doc.price)] : [];
  return [];
}
function matchesFacet(doc: SearchDocument, filter: string) {
  const colon = filter.indexOf(':');
  return facetValues(doc, filter.slice(0, colon)).includes(
    filter.slice(colon + 1).replace(/^"|"$/g, ''),
  );
}

/** WooGraphQL snapshot adapter used when Meilisearch has not been configured.
 * It shares InstantSearch's UI contract; it never supplies invented products. */
export function searchSnapshot(
  documents: SearchDocument[],
  request: SearchRequest,
) {
  const p = request.params ?? {};
  const facetFilters =
    typeof p.facetFilters === 'string'
      ? [p.facetFilters]
      : (p.facetFilters ?? []);
  const numericFilters =
    typeof p.numericFilters === 'string'
      ? [p.numericFilters]
      : (p.numericFilters ?? []);
  const started = Date.now();
  const terms = fold(p.query ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const category = p.filters?.match(/^categories\s*=\s*"([^"]*)"/)?.[1];
  const base = documents.filter(
    (doc) =>
      (!category || doc.categories.includes(category)) &&
      (!p.filters?.includes(OFFER_FILTER) || isCurrentOffer(doc)) &&
      terms.every((term) =>
        fold(
          [
            doc.name,
            doc.sku,
            doc.brand,
            doc.description,
            ...Object.values(doc.attributes),
          ].join(' '),
        ).includes(term),
      ),
  );
  const numeric = (doc: SearchDocument) =>
    numericFilters.every((group) =>
      flatten(group).some((filter) => {
        const match = filter.match(/^price\s*(>=|<=|=|>|<)\s*([\d.]+)$/);
        if (!match) return true;
        if (doc.price === null) return false;
        const value = Number(match[2]);
        return match[1] === '>='
          ? doc.price >= value
          : match[1] === '<='
            ? doc.price <= value
            : match[1] === '>'
              ? doc.price > value
              : match[1] === '<'
                ? doc.price < value
                : doc.price === value;
      }),
    );
  const filtered = base.filter(
    (doc) =>
      numeric(doc) &&
      facetFilters.every((group) =>
        flatten(group).some((filter) => matchesFacet(doc, filter)),
      ),
  );
  const descending = request.indexName.endsWith(':price:desc');
  filtered.sort((a, b) =>
    request.indexName.includes(':price:')
      ? a.price === null
        ? b.price === null
          ? a.name.localeCompare(b.name, 'fr')
          : 1
        : b.price === null
          ? -1
          : (a.price - b.price) * (descending ? -1 : 1)
      : a.name.localeCompare(b.name, 'fr', { numeric: true }),
  );
  const facets: Record<string, Record<string, number>> = {};
  const facetNames = p.facets?.includes('*')
    ? [
        'categories',
        'tags.name',
        'brand',
        'tier',
        ...new Set(
          documents.flatMap((doc) =>
            Object.keys(doc.facets).map((key) => `facets.${key}`),
          ),
        ),
      ]
    : (p.facets ?? []);
  for (const name of facetNames) {
    facets[name] = {};
    const facetDocs = base.filter(
      (doc) =>
        numeric(doc) &&
        facetFilters.every((group) =>
          flatten(group).some(
            (filter) =>
              filter.startsWith(`${name}:`) || matchesFacet(doc, filter),
          ),
        ),
    );
    for (const doc of facetDocs)
      for (const value of facetValues(doc, name))
        facets[name][value] = (facets[name][value] ?? 0) + 1;
  }
  const prices = base
    .filter((doc) =>
      facetFilters.every((group) =>
        flatten(group).some((filter) => matchesFacet(doc, filter)),
      ),
    )
    .map((doc) => doc.price)
    .filter((price): price is number => price !== null);
  const page = Math.max(0, p.page ?? 0);
  const limit = Math.min(100, Math.max(1, p.hitsPerPage ?? 24));
  return {
    hits: filtered.slice(page * limit, (page + 1) * limit),
    nbHits: filtered.length,
    page,
    nbPages: Math.ceil(filtered.length / limit),
    hitsPerPage: limit,
    facets,
    facets_stats: prices.length
      ? { price: { min: Math.min(...prices), max: Math.max(...prices) } }
      : {},
    exhaustiveNbHits: true,
    exhaustiveFacetsCount: true,
    processingTimeMS: Date.now() - started,
    query: p.query ?? '',
    params: '',
  };
}
