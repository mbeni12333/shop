import type { UiState } from 'instantsearch.js';
import { SEARCH_INDEX } from './search-client';

export type SearchRoute = Record<string, string | string[] | undefined>;
const publicKey = (attr: string) =>
  attr === 'tags.name'
    ? 'tag'
    : attr === 'categories'
      ? 'categorie'
      : attr === 'brand'
        ? 'marque'
        : attr === 'tier'
          ? 'gamme'
          : attr.replace(/^facets\./, '');
const indexKey = (key: string) =>
  key === 'tag'
    ? 'tags.name'
    : key === 'categorie'
      ? 'categories'
      : key === 'marque'
        ? 'brand'
        : key === 'gamme'
          ? 'tier'
          : `facets.${key}`;
export const searchStateMapping = {
  stateToRoute(ui: UiState): SearchRoute {
    const state = ui[SEARCH_INDEX] ?? {};
    const route: SearchRoute = {};
    if (state.query) route.q = state.query;
    if (state.sortBy?.includes(':price:'))
      route.tri = state.sortBy.endsWith(':desc') ? 'decroissant' : 'croissant';
    if (state.page && state.page > 1) route.page = String(state.page);
    for (const [attr, values] of Object.entries(state.refinementList ?? {}))
      if (values.length) route[publicKey(attr)] = values;
    const range = state.range?.price?.split(':');
    if (range?.[0]) route.min = range[0];
    if (range?.[1]) route.budget = range[1];
    return route;
  },
  routeToState(route: SearchRoute): UiState {
    const one = (key: string) =>
      Array.isArray(route[key]) ? route[key][0] : route[key];
    const refinementList: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(route))
      if (
        value &&
        (['categorie', 'marque', 'gamme', 'tag'].includes(key) ||
          key.startsWith('spec_'))
      )
        refinementList[indexKey(key)] = Array.isArray(value) ? value : [value];
    const min = one('min');
    const max = one('budget');
    return {
      [SEARCH_INDEX]: {
        query: one('q') ?? '',
        refinementList,
        ...(min || max
          ? { range: { price: `${min ?? ''}:${max ?? ''}` } }
          : {}),
        sortBy:
          one('tri') === 'croissant'
            ? `${SEARCH_INDEX}:price:asc`
            : one('tri') === 'decroissant'
              ? `${SEARCH_INDEX}:price:desc`
              : SEARCH_INDEX,
        page: Math.max(1, Number(one('page')) || 1),
      },
    };
  },
};

export function routeFromURL(url: URL): SearchRoute {
  const route: SearchRoute = {};
  url.searchParams.forEach((_value, key) => {
    const values = url.searchParams.getAll(key);
    route[key] = values.length > 1 ? values : values[0];
  });
  return route;
}
export function routeURL(
  route: SearchRoute,
  location: { origin: string; pathname: string },
) {
  const url = new URL(location.pathname, location.origin);
  for (const [key, value] of Object.entries(route))
    for (const item of Array.isArray(value) ? value : value ? [value] : [])
      url.searchParams.append(key, item);
  return url.href;
}
