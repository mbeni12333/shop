import type { NextApiRequest, NextApiResponse } from 'next';
import { catalog } from '@/edoctor/server';
import {
  searchDocument,
  searchSnapshot,
  type SearchRequest,
} from '@/edoctor/search-engine';

let lastGood: Awaited<ReturnType<typeof catalog>> | null = null;
let refreshedAt = 0;
let inflight: Promise<void> | null = null;
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const requests = req.body?.requests;
  if (
    !Array.isArray(requests) ||
    requests.length > 20 ||
    !requests.every(
      (r) =>
        r &&
        typeof r.indexName === 'string' &&
        r.indexName.startsWith('products') &&
        (!r.params?.query ||
          (typeof r.params.query === 'string' && r.params.query.length <= 200)),
    )
  )
    return res.status(400).end();
  try {
    if (!lastGood || Date.now() - refreshedAt > 60_000) {
      inflight ??= catalog()
        .then((data) => {
          lastGood = data;
          refreshedAt = Date.now();
        })
        .finally(() => {
          inflight = null;
        });
      await inflight;
    }
    return res.json({
      results: (requests as SearchRequest[]).map((request) =>
        searchSnapshot((lastGood ?? []).map(searchDocument), request),
      ),
    });
  } catch {
    return res
      .status(503)
      .json({ error: 'Recherche temporairement indisponible' });
  }
}
