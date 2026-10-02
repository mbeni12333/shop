import type { NextApiRequest, NextApiResponse } from 'next';
import { categories } from '@/edoctor/server';
import type { Category } from '@/edoctor/model';

/**
 * The taxonomy is a shared navigation resource: rather than duplicating a
 * `getStaticProps`/`getServerSideProps` call on every page, client-side routes
 * that have no taxonomy of their own fetch it once through this endpoint.
 */
export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<Category[]>,
) {
  try {
    res.setHeader(
      'Cache-Control',
      'public, max-age=60, s-maxage=3600, stale-while-revalidate=86400',
    );
    res.status(200).json(await categories());
  } catch (error) {
    console.error('categories', error);
    res.status(503).json([]);
  }
}
