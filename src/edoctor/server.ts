import {
  ApolloClient,
  ApolloError,
  InMemoryCache,
  HttpLink,
  gql,
} from '@apollo/client';
import type { Category, Product } from './model';
import { previewUniverses } from './preview-universes';

export const configured = () =>
  Boolean(process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL);

let capability: { expires: number; available: boolean } | undefined;
let capabilityRequest: Promise<boolean> | undefined;
/** Missing WooGraphQL is a setup state; transport/server errors still propagate. */
export async function commerceConfigured(): Promise<boolean> {
  if (!configured()) return false;
  if (capability && capability.expires > Date.now())
    return capability.available;
  if (!capabilityRequest) {
    capabilityRequest = query(
      'query StorefrontCapabilities { products(first: 1) { nodes { databaseId } } productCategories(first: 1) { nodes { slug } } }',
    )
      .then(() => true)
      .catch((error: unknown) => {
        if (
          error instanceof ApolloError &&
          error.graphQLErrors.some((item) =>
            /Cannot query field "(?:products|productCategories)" on type "RootQuery"/.test(
              item.message,
            ),
          )
        )
          return false;
        throw error;
      })
      .then((available) => {
        capability = { available, expires: Date.now() + 60_000 };
        return available;
      })
      .finally(() => {
        capabilityRequest = undefined;
      });
  }
  return capabilityRequest;
}

export async function query<T>(
  source: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const uri = process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!uri) throw new Error('WooGraphQL non configuré');
  // A fresh server client per request prevents cache/session leaks between customers.
  const client = new ApolloClient({
    ssrMode: true,
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri,
      fetch: (url, options) =>
        fetch(url, {
          ...options,
          cache: 'no-store',
          signal: AbortSignal.timeout(12000),
        }),
    }),
  });
  const result = await client.query<T>({
    query: gql(source),
    variables,
    fetchPolicy: 'no-cache',
  });
  return result.data;
}

/** WooCommerce is the single source of truth for the taxonomy. */
export async function categories(): Promise<Category[]> {
  // Preserve the illustrated local design preview without seeding fake products.
  // Never substitute this presentation list for a connected WooCommerce store.
  if (!(await commerceConfigured())) return previewUniverses;
  const result: {
    productCategories: {
      nodes: {
        slug: string;
        name: string;
        description: string | null;
        count: number;
        image?: { sourceUrl: string } | null;
      }[];
    };
  } = await query(`
    query Categories {
      productCategories(first: 100, where: { hideEmpty: false }) {
        nodes { slug name description count image { sourceUrl } }
      }
    }
  `);
  return result.productCategories.nodes.map((node) => ({
    slug: node.slug,
    name: node.name,
    description: plainText(node.description || ''),
    count: node.count,
    image: node.image?.sourceUrl || '',
  }));
}

/**
 * Categories indexed by slug. Callers that need a display name must read it
 * from here rather than from a hardcoded table.
 */
export async function categoryIndex(): Promise<Map<string, Category>> {
  return new Map(
    (await categories()).map((category) => [category.slug, category]),
  );
}

// edoctorDetails extends WooGraphQL Product with normalized HT prices and all variants.
const fields = `databaseId slug name sku description(format: RAW) image { sourceUrl } edoctorDetails`;
type Node = {
  databaseId: number;
  slug: string;
  name: string;
  sku: string;
  description: string;
  image?: { sourceUrl: string };
  edoctorDetails: string;
};
export function normalize(node: Node): Product {
  const detail = JSON.parse(node.edoctorDetails);
  return {
    ...detail,
    categories: detail.categories ?? [],
    id: node.databaseId,
    slug: node.slug,
    name: node.name,
    sku: node.sku || '',
    description: plainText(node.description || ''),
    image: node.image?.sourceUrl || '',
  };
}
export async function catalog(): Promise<Product[]> {
  if (!(await commerceConfigured())) return [];
  let after: string | null = null;
  const all: Product[] = [];
  for (let page = 0; page < 100; page++) {
    const result: {
      products: {
        nodes: Node[];
        pageInfo: { hasNextPage: boolean; endCursor: string };
      };
    } = await query(
      `query Catalog($after:String) { products(first:100, after:$after, where:{status:"publish"}) { nodes { ${fields} } pageInfo { hasNextPage endCursor } } }`,
      { after },
    );
    all.push(...result.products.nodes.map(normalize));
    if (!result.products.pageInfo.hasNextPage) return all;
    after = result.products.pageInfo.endCursor;
  }
  throw new Error('Pagination du catalogue trop volumineuse');
}
export async function productBySlug(slug: string): Promise<Product | null> {
  if (!(await commerceConfigured())) return null;
  const result = await query<{ product: Node | null }>(
    `query Product($slug:ID!){product(id:$slug,idType:SLUG){${fields}}}`,
    { slug },
  );
  return result.product ? normalize(result.product) : null;
}
export type Post = {
  databaseId: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
};
export async function posts(): Promise<Post[]> {
  if (!configured()) return [];
  const all: Post[] = [];
  let after: string | null = null;
  for (let page = 0; page < 100; page++) {
    const result: {
      posts: {
        nodes: Post[];
        pageInfo: { hasNextPage: boolean; endCursor: string };
      };
    } = await query(
      `query Posts($after:String){posts(first:100,after:$after,where:{status:PUBLISH}){nodes{databaseId slug title content excerpt date} pageInfo{hasNextPage endCursor}}}`,
      { after },
    );
    all.push(...result.posts.nodes);
    if (!result.posts.pageInfo.hasNextPage) return all;
    after = result.posts.pageInfo.endCursor;
  }
  throw new Error('Pagination du blog trop volumineuse');
}
export const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8217;/g, '’')
    .replace(/&nbsp;/g, ' ');
