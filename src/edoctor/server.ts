import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import type { Category, Product } from './model';
export const configured = () =>
  Boolean(process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL);
export async function query<T>(
  source: string,
  variables: Record<string, unknown> = {},
  strict = false,
): Promise<T> {
  const uri = process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL;
  if (!uri) throw new Error('WPGraphQL non configuré');
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
  try {
    const result = await client.query<T>({
      query: gql(source),
      variables,
      fetchPolicy: 'no-cache',
    });
    return result.data;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (
      !strict &&
      /Cannot query field "(?:products|productCategories|product)" on type "RootQuery"/.test(
        message,
      )
    ) {
      console.warn('EDoctor: public catalog bridge is not installed.');
      return {
        products: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        },
        productCategories: { nodes: [] },
        product: null,
      } as T;
    }
    throw error;
  }
}
/** WooCommerce is the single source of truth for the taxonomy. */
export async function categories(): Promise<Category[]> {
  if (!configured()) return [];
  const result: {
    productCategories: {
      nodes: {
        slug: string;
        name: string;
        description: string | null;
        count: number;
        parent?: { node: { slug: string } } | null;
        image?: { sourceUrl: string } | null;
      }[];
    };
  } = await query(`
    query Categories {
      productCategories(first: 100, where: { hideEmpty: false }) {
        nodes { slug name description count parent { node { slug } } image { sourceUrl } }
      }
    }
  `);
  return result.productCategories.nodes.map((node) => ({
    slug: node.slug,
    name: node.name,
    description: plainText(node.description || ''),
    count: node.count,
    parent: node.parent?.node.slug || null,
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
// edoctorDetails extends WPGraphQL Product with normalized HT prices and all variants.
const fields = `databaseId slug name sku description image { sourceUrl } edoctorDetails`;
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
    tags: detail.tags ?? [],
    id: node.databaseId,
    slug: node.slug,
    name: node.name,
    sku: node.sku || '',
    description: plainText(node.description || ''),
    image: node.image?.sourceUrl || '',
  };
}
export async function catalog(): Promise<Product[]> {
  if (!configured()) return [];
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
  if (!configured()) return null;
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
