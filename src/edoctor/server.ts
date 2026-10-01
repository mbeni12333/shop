import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';
import type { Product } from './model';
import { researchCatalog, researchPreviewEnabled } from './research-catalog';

export const configured = () =>
  Boolean(process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL);
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
    id: node.databaseId,
    slug: node.slug,
    name: node.name,
    sku: node.sku || '',
    description: plainText(node.description || ''),
    image: node.image?.sourceUrl || '',
  };
}
export async function catalog(): Promise<Product[]> {
  if (!configured())
    return researchPreviewEnabled()
      ? researchCatalog().map(({ research: _details, ...product }) => product)
      : [];
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
  if (!configured())
    return researchPreviewEnabled()
      ? researchCatalog().find((product) => product.slug === slug) || null
      : null;
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
  edoctorLanguage: string;
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
      `query Posts($after:String){posts(first:100,after:$after,where:{status:PUBLISH}){nodes{databaseId slug title content excerpt date edoctorLanguage} pageInfo{hasNextPage endCursor}}}`,
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
