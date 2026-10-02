import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { trackConversion } from './analytics';
import { Command, CommandInput, CommandList } from './ui/command';

const SearchResults = dynamic(() => import('./SearchResults'), {
  ssr: false,
  loading: () => (
    <CommandList>
      <p className="search-feedback" role="status">
        Recherche…
      </p>
    </CommandList>
  ),
});

export default function Search() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('keydown', shortcut);
    document.addEventListener('pointerdown', outside);
    router.events.on('routeChangeStart', close);
    return () => {
      document.removeEventListener('keydown', shortcut);
      document.removeEventListener('pointerdown', outside);
      router.events.off('routeChangeStart', close);
    };
  }, [router.events]);
  const go = (path: string) => {
    trackConversion('search', { source: 'header' });
    setOpen(false);
    input.current?.blur();
    void router.push(path);
  };
  return (
    <Command
      ref={root}
      shouldFilter={false}
      loop
      className="inline-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setOpen(false);
        }
      }}
    >
      <CommandInput
        ref={input}
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        placeholder="Rechercher…"
        aria-label="Rechercher un produit"
        aria-expanded={open}
        onKeyDown={(event) => {
          if (
            event.key === 'Enter' &&
            query.trim() &&
            (!open ||
              !root.current?.querySelector('[cmdk-item][data-selected="true"]'))
          ) {
            event.preventDefault();
            event.stopPropagation();
            go('/recherche?q=' + encodeURIComponent(query.trim()));
          }
        }}
      />
      {open && (
        <div className="search-suggestions">
          <SearchResults query={query} go={go} />
        </div>
      )}
    </Command>
  );
}
