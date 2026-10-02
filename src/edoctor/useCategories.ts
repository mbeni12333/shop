import { useEffect, useState } from 'react';
import type { Category } from './model';

/**
 * The taxonomy is rendered in the header on every page, including the
 * client-only ones that have no `getStaticProps` of their own. Pages that
 * already fetched it pass it down as `initial`; otherwise it is loaded once and
 * shared by every mounted shell.
 */
let cache: Category[] | null = null;
let inflight: Promise<Category[]> | null = null;

export function useCategories(initial?: Category[]) {
  const [categories, setCategories] = useState<Category[]>(
    initial ?? cache ?? [],
  );

  useEffect(() => {
    if (initial) {
      cache = initial;
      setCategories(initial);
      return;
    }
    if (cache) {
      setCategories(cache);
      return;
    }
    let active = true;
    inflight =
      inflight ??
      fetch('/api/categories')
        .then((response) => {
          if (!response.ok) throw new Error('Taxonomie indisponible');
          return response.json();
        })
        .then((data: Category[]) => {
          cache = data;
          return data;
        })
        .catch(() => [])
        .finally(() => {
          inflight = null;
        });
    inflight.then((data) => {
      if (active) setCategories(data);
    });
    return () => {
      active = false;
    };
  }, [initial]);

  return categories;
}
