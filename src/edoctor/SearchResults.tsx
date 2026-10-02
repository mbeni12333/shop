import { useMemo } from 'react';
import Image from 'next/image';
import {
  InstantSearch,
  Configure,
  useHits,
  useInstantSearch,
} from 'react-instantsearch';
import { createSearchClient, SEARCH_INDEX } from './search-client';
import type { SearchDocument } from './search-engine';
import { money } from './model';
import Icon from './Icon';
import { CommandGroup, CommandItem, CommandList } from './ui/command';
import { Button } from './ui/button';

function Suggestions({
  query,
  go,
}: {
  query: string;
  go: (path: string) => void;
}) {
  const { items } = useHits<SearchDocument>();
  const { status } = useInstantSearch({ catchError: true });
  const all = () => {
    if (query.trim()) go(`/recherche?q=${encodeURIComponent(query.trim())}`);
  };
  return (
    <CommandList aria-busy={status === 'loading' || status === 'stalled'}>
      {status === 'error' ? (
        <p className="search-feedback" role="alert">
          La recherche est indisponible.{' '}
          <Button variant="link" onClick={all}>
            Ouvrir les résultats
          </Button>
        </p>
      ) : query.trim().length < 2 ? (
        <p className="search-feedback">
          Un nom, une référence… et on vous aide à trouver.
        </p>
      ) : (
        <>
          {!items.length && status === 'idle' && (
            <p className="search-feedback">
              Aucun produit trouvé. Essayez une autre référence.
            </p>
          )}
          {items.length > 0 && (
            <CommandGroup heading="Dans la boutique">
              {items.map((product) => (
                <CommandItem
                  key={product.id}
                  value={String(product.id)}
                  onSelect={() => go(`/produit/${product.slug}`)}
                  className="search-hit"
                >
                  <span className="search-hit-image">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt=""
                        width={48}
                        height={48}
                        sizes="48px"
                      />
                    ) : (
                      <Icon name="univers" />
                    )}
                  </span>
                  <span className="search-hit-copy">
                    <strong>{product.name}</strong>
                    <small>
                      {[product.brand, product.sku].filter(Boolean).join(' · ')}
                    </small>
                  </span>
                  <span className="search-suggestion-price">
                    {money(product.price)}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup>
            <CommandItem value="all-results" onSelect={all}>
              Voir tous les résultats <Icon name="arrow" />
            </CommandItem>
          </CommandGroup>
        </>
      )}
    </CommandList>
  );
}

export default function SearchResults({
  query,
  go,
}: {
  query: string;
  go: (path: string) => void;
}) {
  const client = useMemo(() => createSearchClient(), []);
  return (
    <InstantSearch
      indexName={SEARCH_INDEX}
      searchClient={client}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure hitsPerPage={6} query={query} />
      <Suggestions query={query} go={go} />
    </InstantSearch>
  );
}
