import { useEffect, useMemo, useRef, useState } from 'react';
import {
  InstantSearch,
  Configure,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  useInstantSearch,
  usePagination,
  useRange,
  useRefinementList,
  useSearchBox,
  useSortBy,
} from 'react-instantsearch';
import { createInstantSearchRouterNext } from 'react-instantsearch-router-nextjs';
import singletonRouter from 'next/router';
import type { Category, Product } from './model';
import type { SearchDocument } from './search-engine';
import { attributeKey } from './filters';
import { createSearchClient, SEARCH_INDEX } from './search-client';
import {
  routeFromURL,
  routeURL,
  searchStateMapping,
  type SearchRoute,
} from './search-routing';
import { ProductGrid } from './Catalog';
import FilterPanel from './FilterPanel';
import Icon from './Icon';
import { trackConversion } from './analytics';
import { useResultsMotion } from './motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Slider } from './ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

function Facet({
  attribute,
  label,
  knownValues,
  names,
}: {
  attribute: string;
  label: string;
  knownValues: string[];
  names?: Map<string, string>;
}) {
  const { items, refine } = useRefinementList({
    attribute,
    operator: 'or',
    limit: 1000,
    sortBy: ['name:asc'],
  });
  const [term, setTerm] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { items: current } = useCurrentRefinements();
  const selected = new Set(
    current
      .filter((group) => group.attribute === attribute)
      .flatMap((group) =>
        group.refinements.map((refinement) => String(refinement.value)),
      ),
  );
  const remembered = useRef(new Set(knownValues));
  items.forEach((item) => remembered.current.add(item.value));
  selected.forEach((value) => remembered.current.add(value));
  const choices = [...remembered.current]
    .map((value) => {
      const item = items.find((item) => item.value === value);
      return item
        ? { ...item, isRefined: item.isRefined || selected.has(value) }
        : {
            value,
            label: value,
            count: 0,
            isRefined: selected.has(value),
          };
    })
    .sort(
      (a, b) =>
        Number(b.isRefined) - Number(a.isRefined) ||
        (names?.get(a.value) ?? a.label).localeCompare(
          names?.get(b.value) ?? b.label,
          'fr',
          { numeric: true },
        ),
    );
  const matching = choices.filter(
    (item) =>
      item.isRefined ||
      (names?.get(item.value) ?? item.label)
        .toLocaleLowerCase('fr')
        .includes(term.toLocaleLowerCase('fr')),
  );
  const visible =
    term || expanded
      ? matching
      : matching.filter((item, index) => index < 8 || item.isRefined);
  return (
    <AccordionItem value={attribute}>
      <AccordionTrigger>
        {label}
        {!!selected.size && (
          <span aria-hidden className="facet-selected-count">
            {selected.size}
          </span>
        )}
      </AccordionTrigger>
      <AccordionContent role="group" aria-label={label}>
        {choices.length > 8 && (
          <Input
            type="search"
            aria-label={`Rechercher dans ${label}`}
            placeholder={`Rechercher…`}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            className="facet-search"
          />
        )}
        <div className="filter-choices">
          {visible.map((item) => {
            const id = `facet-${attribute}-${encodeURIComponent(item.value)}`;
            return (
              <div className="filter-choice" key={item.value}>
                <Checkbox
                  id={id}
                  checked={item.isRefined}
                  disabled={!item.count && !item.isRefined}
                  onCheckedChange={() => {
                    refine(item.value);
                    trackConversion('filter_change', { source: 'catalog' });
                  }}
                />
                <label htmlFor={id}>
                  {names?.get(item.value) ?? item.label}
                </label>
                <span className="facet-count">{item.count}</span>
              </div>
            );
          })}
        </div>
        {!matching.length && <p className="muted">Aucune valeur trouvée.</p>}
        {choices.length > 8 && !term && (
          <Button
            variant="link"
            className="facet-show-more"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded
              ? 'Voir moins'
              : `Voir plus (${Math.max(0, choices.length - 8)})`}
          </Button>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function PersistentFacet({ attribute }: { attribute: string }) {
  useRefinementList({ attribute, operator: 'or', limit: 1000 });
  return null;
}

function PersistentPrice() {
  useRange({ attribute: 'price', precision: 2 });
  return null;
}

function PriceRange({ prices }: { prices: number[] }) {
  const { start, refine } = useRange({
    attribute: 'price',
    precision: 2,
  });
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const low =
    typeof start[0] === 'number' && Number.isFinite(start[0])
      ? Math.max(min, start[0])
      : min;
  const high =
    typeof start[1] === 'number' && Number.isFinite(start[1])
      ? Math.min(max, start[1])
      : max;
  const [draft, setDraft] = useState([String(low), String(high)]);
  useEffect(() => {
    setDraft([String(low), String(high)]);
  }, [low, high]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return null;
  const commit = () => {
    const a = draft[0].trim() ? Number(draft[0]) : min;
    const b = draft[1].trim() ? Number(draft[1]) : max;
    const lower = Math.min(max, Math.max(min, Number.isFinite(a) ? a : min));
    const upper = Math.min(max, Math.max(lower, Number.isFinite(b) ? b : max));
    refine([
      lower <= min ? undefined : lower,
      upper >= max ? undefined : upper,
    ]);
    setDraft([String(lower), String(upper)]);
    trackConversion('filter_change', { source: 'catalog' });
  };
  return (
    <AccordionItem value="price">
      <AccordionTrigger>Budget HT</AccordionTrigger>
      <AccordionContent>
        <div className="price-inputs">
          {['Minimum', 'Maximum'].map((label, index) => (
            <div key={label}>
              <label htmlFor={`price-${index}`}>{label} €</label>
              <Input
                id={`price-${index}`}
                type="number"
                inputMode="decimal"
                min={min}
                max={max}
                step="0.01"
                value={draft[index]}
                onChange={(e) =>
                  setDraft((current) =>
                    current.map((v, i) => (i === index ? e.target.value : v)),
                  )
                }
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    commit();
                  }
                }}
              />
            </div>
          ))}
        </div>
        <Slider
          min={min}
          max={max}
          step={1}
          value={[low, Math.max(low, high)]}
          thumbLabels={[
            'Budget minimum HT en euros',
            'Budget maximum HT en euros',
          ]}
          onValueChange={([a, b]) =>
            refine([a <= min ? undefined : a, b >= max ? undefined : b])
          }
          onValueCommit={() =>
            trackConversion('filter_change', { source: 'catalog' })
          }
        />
        <p className="filter-range-hint">
          {min.toLocaleString('fr-FR')} € – {max.toLocaleString('fr-FR')} €
        </p>
      </AccordionContent>
    </AccordionItem>
  );
}

function Results({
  products,
  index,
  categorySlug,
}: {
  products: Product[];
  index: Map<string, Category>;
  categorySlug?: string;
}) {
  const { items: hits } = useHits<SearchDocument>();
  const { results, status, refresh, error } = useInstantSearch({
    catchError: true,
  });
  const { query, refine: search } = useSearchBox();
  const { items: active } = useCurrentRefinements({
    excludedAttributes: ['query'],
  });
  const { refine: clear, canRefine } = useClearRefinements({
    excludedAttributes: ['query'],
  });
  const {
    currentRefinement: order,
    options,
    refine: sort,
  } = useSortBy({
    items: [
      { label: 'Pertinence', value: SEARCH_INDEX },
      { label: 'Prix croissant', value: `${SEARCH_INDEX}:price:asc` },
      { label: 'Prix décroissant', value: `${SEARCH_INDEX}:price:desc` },
    ],
  });
  const {
    currentRefinement: page,
    nbPages,
    refine: paginate,
  } = usePagination();
  const count = active.reduce(
    (sum, group) =>
      sum + (group.attribute === 'price' ? 1 : group.refinements.length),
    0,
  );
  const names = new Map([...index.values()].map((c) => [c.slug, c.name]));
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
  const categoryValues = unique(products.flatMap((p) => p.categories));
  const selectedCategories =
    active
      .find((g) => g.attribute === 'categories')
      ?.refinements.map((r) => String(r.value)) ?? [];
  const scoped =
    selectedCategories.length === 1
      ? products.filter((p) => p.categories.includes(selectedCategories[0]))
      : products;
  const technical =
    categorySlug ||
    selectedCategories.length === 1 ||
    unique(products.flatMap((p) => p.categories)).length === 1;
  const attrs = technical
    ? unique(scoped.flatMap((p) => Object.keys(p.attributes))).filter(
        (label) =>
          !['marque', 'gamme', 'usage'].includes(label.toLocaleLowerCase('fr')),
      )
    : [];
  const prices = products
    .map((p) => p.price)
    .filter((v): v is number => v !== null);
  const lastHits = useRef<SearchDocument[]>([]);
  if (status === 'idle') lastHits.current = hits;
  const shown =
    status === 'error' || status === 'loading' || status === 'stalled'
      ? lastHits.current.length
        ? lastHits.current
        : hits
      : hits;
  const motionScope = useResultsMotion(shown.map((p) => p.id).join(','));
  return (
    <>
      <PersistentFacet attribute="brand" />
      {!categorySlug && categoryValues.length > 1 && (
        <PersistentFacet attribute="categories" />
      )}
      {unique(products.map((p) => p.tier)).length > 1 && (
        <PersistentFacet attribute="tier" />
      )}
      {!!prices.length && <PersistentPrice />}
      {attrs.map((label) => (
        <PersistentFacet
          key={label}
          attribute={`facets.${attributeKey(label)}`}
        />
      ))}
      {query && (
        <div className="catalog-query">
          <p>
            Résultats pour <strong>« {query} »</strong>
          </p>
          <Button
            variant="ghost"
            onClick={() => search('')}
            aria-label="Effacer la recherche"
          >
            <Icon name="close" /> Effacer
          </Button>
        </div>
      )}
      <div className="catalog-layout">
        <FilterPanel
          resultCount={results.nbHits}
          hasFilters={count > 0}
          activeCount={count}
        >
          <Accordion
            type="multiple"
            defaultValue={['categories', 'brand', 'price']}
          >
            {!categorySlug && categoryValues.length > 1 && (
              <Facet
                attribute="categories"
                label="Catégorie"
                knownValues={categoryValues}
                names={names}
              />
            )}
            <Facet
              attribute="brand"
              label="Marque"
              knownValues={unique(products.map((p) => p.brand))}
            />
            {unique(products.map((p) => p.tier)).length > 1 && (
              <Facet
                attribute="tier"
                label="Gamme"
                knownValues={unique(products.map((p) => p.tier))}
              />
            )}
            {!!prices.length && <PriceRange prices={prices} />}
            {attrs.map((label) => (
              <Facet
                key={label}
                attribute={`facets.${attributeKey(label)}`}
                label={label}
                knownValues={unique(
                  scoped.flatMap((p) =>
                    (p.attributes[label] ?? '').split(',').map((v) => v.trim()),
                  ),
                )}
              />
            ))}
          </Accordion>
          {canRefine && (
            <Button variant="ghost" onClick={() => clear()}>
              Réinitialiser les filtres
            </Button>
          )}
        </FilterPanel>
        <div className="catalog-results">
          <div className="results-toolbar">
            <p className="muted" role="status">
              {results.nbHits} produit{results.nbHits !== 1 ? 's' : ''}
              {(status === 'loading' || status === 'stalled') && (
                <span className="search-updating"> · Actualisation…</span>
              )}
            </p>
            <Select value={order} onValueChange={sort}>
              <SelectTrigger
                aria-label="Trier les produits"
                className="catalog-sort w-48 max-w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.value !== SEARCH_INDEX && !prices.length}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!!active.length && (
            <div className="active-filters">
              <ul className="filter-badges">
                {active.flatMap((group) =>
                  group.refinements.map((refinement) => {
                    const value =
                      group.attribute === 'categories'
                        ? (names.get(String(refinement.value)) ??
                          refinement.label)
                        : group.attribute === 'price'
                          ? `${refinement.operator === '>=' ? 'Dès' : 'Jusqu’à'} ${refinement.value} €`
                          : group.attribute.startsWith('facets.')
                            ? `${attrs.find((label) => `facets.${attributeKey(label)}` === group.attribute) ?? 'Caractéristique'} : ${refinement.label}`
                            : refinement.label;
                    return (
                      <li key={`${group.attribute}-${refinement.label}`}>
                        <Badge variant="secondary" className="filter-badge">
                          {value}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Retirer le filtre ${value}`}
                            onClick={() => group.refine(refinement)}
                          >
                            <Icon name="close" />
                          </Button>
                        </Badge>
                      </li>
                    );
                  }),
                )}
              </ul>
              <Button variant="link" onClick={() => clear()}>
                Tout effacer
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="search-error" role="alert">
              <p>
                La recherche est temporairement indisponible.{' '}
                {shown.length
                  ? 'Les derniers résultats restent affichés.'
                  : 'Réessayez dans un instant.'}
              </p>
              <Button variant="outline" onClick={refresh}>
                Réessayer
              </Button>
              <span className="sr-only">{error?.name}</span>
            </div>
          )}
          <div
            ref={motionScope}
            aria-busy={status === 'loading' || status === 'stalled'}
          >
            {(status !== 'error' || shown.length > 0) && (
              <ProductGrid
                products={shown}
                categoriesBySlug={index}
                onReset={() => {
                  clear();
                  search('');
                }}
              />
            )}
          </div>
          {nbPages > 1 && (
            <nav className="catalog-pagination" aria-label="Pagination">
              <Button
                variant="outline"
                disabled={!page}
                onClick={() => paginate(page - 1)}
              >
                Précédent
              </Button>
              <span>
                Page {page + 1} sur {nbPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= nbPages - 1}
                onClick={() => paginate(page + 1)}
              >
                Suivant
              </Button>
            </nav>
          )}
        </div>
      </div>
    </>
  );
}

export default function InstantCatalog({
  products,
  categoriesBySlug,
  categorySlug,
}: {
  products: Product[];
  categoriesBySlug: Map<string, Category>;
  categorySlug?: string;
}) {
  const client = useMemo(() => createSearchClient(products), [products]);
  const routing = useMemo(
    () => ({
      router: createInstantSearchRouterNext<SearchRoute>({
        singletonRouter,
        routerOptions: {
          writeDelay: 150,
          cleanUrlOnDispose: false,
          createURL: ({ routeState, location }) =>
            routeURL(routeState, location),
          parseURL: ({ location }) => routeFromURL(new URL(location.href)),
        },
      }),
      stateMapping: searchStateMapping,
    }),
    [],
  );
  return (
    <InstantSearch
      indexName={SEARCH_INDEX}
      searchClient={client}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure
        hitsPerPage={24}
        {...(categorySlug
          ? { filters: `categories = ${JSON.stringify(categorySlug)}` }
          : {})}
      />
      <Results
        products={products}
        index={categoriesBySlug}
        categorySlug={categorySlug}
      />
    </InstantSearch>
  );
}
