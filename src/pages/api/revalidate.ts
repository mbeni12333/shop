import type { NextApiRequest, NextApiResponse } from 'next';
import { equalSecret } from '@/edoctor/security';
import { categories } from '@/edoctor/model';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  const secret = process.env.REVALIDATE_SECRET;
  if (
    !secret ||
    !equalSecret(String(req.headers.authorization || ''), `Bearer ${secret}`)
  )
    return res.status(401).end();
  const slugs = req.body?.slugs;
  if (
    !Array.isArray(slugs) ||
    slugs.length > 100 ||
    !slugs.every(
      (s) => typeof s === 'string' && /^[a-zA-Z0-9%_-]{1,200}$/.test(s),
    )
  )
    return res.status(400).json({ error: 'Slugs invalides' });
  const paths = [
    '/',
    '/produits',
    '/guide',
    '/blog',
    ...categories.map((c) => `/categorie/${c[0]}`),
    ...slugs.flatMap((s) => [`/produit/${s}`, `/blog/${s}`]),
  ];
  try {
    for (const path of paths) await res.revalidate(path);
    return res.json({ ok: true });
  } catch {
    return res
      .status(503)
      .json({ error: 'Actualisation incomplète, réessayer' });
  }
}
