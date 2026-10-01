import snapshot from '../data/research-products.json';
import type { Product } from './model';

// Preview is explicit and can never take over a configured WooGraphQL backend.
export const researchPreviewEnabled = () =>
  process.env.EDOCTOR_RESEARCH_PREVIEW === '1' &&
  !process.env.GRAPHQL_URL &&
  !process.env.NEXT_PUBLIC_GRAPHQL_URL;
export const researchCatalog = (): Product[] =>
  snapshot.products.map((product) => ({
    ...product,
    catalogSource: 'research',
    attributes: Object.fromEntries(
      Object.entries(product.attributes).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ),
  }));
