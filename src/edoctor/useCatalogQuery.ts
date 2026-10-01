import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

type Query = Record<string, string | string[] | undefined>;

// Inputs and results update synchronously. URL writes are delayed briefly so
// asynchronous shallow navigation cannot replace freshly typed characters.
export function useCatalogQuery() {
  const router = useRouter();
  const [draft, setDraft] = useState<Query | null>(null);
  const latest = useRef<Query | null>(null);
  const revision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const cancel = () => {
      clearTimeout(timer.current);
      revision.current++;
      latest.current = null;
      setDraft(null);
    };
    const navigate = (_url: string, options: { shallow: boolean }) => {
      if (!options.shallow) cancel();
    };
    router.events.on('routeChangeStart', navigate);
    window.addEventListener('popstate', cancel);
    return () => {
      clearTimeout(timer.current);
      revision.current++;
      router.events.off('routeChangeStart', navigate);
      window.removeEventListener('popstate', cancel);
    };
  }, [router.events]);

  function replace(next: Query) {
    latest.current = next;
    setDraft(next);
    const current = ++revision.current;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await router.replace(
          { pathname: router.pathname, query: next },
          undefined,
          { shallow: true, scroll: false },
        );
      } catch {
        // A route change may supersede the shallow update. The current URL
        // remains authoritative once the latest pending write is finished.
      } finally {
        if (revision.current === current) {
          latest.current = null;
          setDraft(null);
        }
      }
    }, 150);
  }

  function update(key: string, value: string) {
    const next = { ...(latest.current ?? router.query) };
    if (value) next[key] = value;
    else delete next[key];
    if (key === 'categorie')
      for (const name of Object.keys(next))
        if (name.startsWith('spec_') || name === 'marque') delete next[name];
    replace(next);
  }

  return {
    query: draft ?? (router.isReady ? router.query : {}),
    update,
    clear: () => replace(router.query.slug ? { slug: router.query.slug } : {}),
  };
}
