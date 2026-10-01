import { useMemo } from 'react';
import { instantMeiliSearch } from '@meilisearch/instant-meilisearch';
import {
  InstantSearch,
  SearchBox,
  Hits,
  RefinementList,
  Pagination,
  Stats,
  ClearRefinements,
  useInstantSearch,
} from 'react-instantsearch';
import { ProductCard } from './Catalog';
import type { Product } from './model';
import { categoryName } from './model';
import FilterPanel from './FilterPanel';
function SearchStatus() {
  const { status, error } = useInstantSearch({ catchError: true });
  return (
    <p role="status">
      {status === 'error'
        ? 'La recherche est momentanément indisponible. Consultez les catégories ou réessayez.'
        : status === 'stalled'
          ? 'Recherche en cours…'
          : error
            ? 'Une erreur est survenue.'
            : ''}
    </p>
  );
}
export default function Search({ initialQuery }: { initialQuery: string }) {
  const host = process.env.NEXT_PUBLIC_MEILI_URL;
  const key = process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY;
  const client = useMemo(
    () =>
      host && key
        ? instantMeiliSearch(host, key, {
            primaryKey: 'id',
            finitePagination: true,
            httpClient: undefined,
            requestInit: undefined,
          }).searchClient
        : null,
    [host, key],
  );
  if (!client)
    return (
      <div className="notice">
        La recherche se prépare. En attendant, explorez les univers depuis le
        menu.
      </div>
    );
  return (
    <InstantSearch
      searchClient={client}
      indexName="products"
      initialUiState={{ products: { query: initialQuery } }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <span id="catalog-search-label" className="sr-only">
        Rechercher dans le catalogue
      </span>
      <SearchBox
        inputProps={{ 'aria-labelledby': 'catalog-search-label' }}
        searchAsYouType
        placeholder="Rechercher un produit, une marque, une référence…"
        translations={{
          submitButtonTitle: 'Rechercher',
          resetButtonTitle: 'Effacer',
        }}
      />
      <div className="catalog-layout search-layout">
        <FilterPanel>
          <fieldset className="search-facet">
            <legend>Catégorie</legend>
            <RefinementList
              attribute="category"
              transformItems={(items) =>
                items.map((item) => ({
                  ...item,
                  label: categoryName(item.value),
                }))
              }
            />
          </fieldset>
          <fieldset className="search-facet">
            <legend>Marque</legend>
            <RefinementList attribute="brand" />
          </fieldset>
          <fieldset className="search-facet">
            <legend>Gamme</legend>
            <RefinementList attribute="tier" />
          </fieldset>
          <ClearRefinements
            translations={{ resetButtonText: 'Effacer les filtres' }}
          />
        </FilterPanel>
        <div className="catalog-results">
          <SearchStatus />
          <Stats
            translations={{
              rootElementText: ({ nbHits }) =>
                `${nbHits} résultat${nbHits > 1 ? 's' : ''}`,
            }}
          />
          <Hits
            hitComponent={({ hit }) => (
              <ProductCard product={hit as unknown as Product} />
            )}
          />
          <Pagination />
        </div>
      </div>
    </InstantSearch>
  );
}
