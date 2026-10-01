import { timingSafeEqual } from 'node:crypto';
import type { NextApiRequest, NextApiResponse } from 'next';
export function equalSecret(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
export function sameOrigin(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Méthode non autorisée' });
    return false;
  }
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const origin = req.headers.origin;
  if (!site || origin !== new URL(site).origin) {
    res.status(403).json({ error: 'Origine non autorisée' });
    return false;
  }
  return true;
}
export function validateLines(
  lines: unknown,
): lines is { productId: number; variationId: number; quantity: number }[] {
  return (
    Array.isArray(lines) &&
    lines.length > 0 &&
    lines.length <= 50 &&
    lines.every(
      (l) =>
        l &&
        Number.isSafeInteger(l.productId) &&
        l.productId > 0 &&
        Number.isSafeInteger(l.variationId) &&
        l.variationId >= 0 &&
        Number.isSafeInteger(l.quantity) &&
        l.quantity >= 1 &&
        l.quantity <= 20,
    ) &&
    new Set(lines.map((l) => `${l.productId}:${l.variationId}`)).size ===
      lines.length
  );
}
