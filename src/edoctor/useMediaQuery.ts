import { useEffect, useState } from 'react';

/**
 * Renders one of two variants based on a media query. Used instead of CSS to
 * move the filter controls between the desktop sidebar and the mobile sheet, so
 * the same DOM ids never exist twice.
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener('change', sync);
    return () => list.removeEventListener('change', sync);
  }, [query]);

  return matches;
}

export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
