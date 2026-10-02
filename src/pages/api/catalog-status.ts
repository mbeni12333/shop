import type { NextApiRequest, NextApiResponse } from 'next';
import { configured, query } from '@/edoctor/server';
export default async function status(
  _req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!configured()) throw new Error('Not configured');
    await query(
      'query CatalogStatus { products(first:1) { nodes { databaseId } } }',
      {},
      true,
    );
    res.status(200).json({ available: true });
  } catch {
    res.status(503).json({ available: false });
  }
}
