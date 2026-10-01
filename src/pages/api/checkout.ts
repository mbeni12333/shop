import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac, randomBytes } from 'node:crypto';
import { sameOrigin, validateLines } from '@/edoctor/security';
import { researchPreviewEnabled } from '@/edoctor/research-catalog';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!sameOrigin(req, res)) return;
  if (researchPreviewEnabled())
    return res.status(503).json({
      error:
        'Le paiement est désactivé dans cet aperçu. Contactez EDoctor pour confirmer votre sélection.',
    });
  if (!validateLines(req.body?.lines))
    return res.status(400).json({
      error: 'Le panier contient des lignes invalides. Actualisez-le.',
    });
  const secret = process.env.CHECKOUT_SECRET;
  const wp = process.env.WORDPRESS_URL;
  if (!secret || secret.length < 32 || !wp)
    return res.status(503).json({
      error:
        'Le paiement se prépare. Contactez un conseiller pour votre commande.',
    });
  const payload = Buffer.from(
    JSON.stringify({
      lines: req.body.lines.map(
        ({
          productId,
          variationId,
          quantity,
        }: {
          productId: number;
          variationId: number;
          quantity: number;
        }) => ({ productId, variationId, quantity }),
      ),
      exp: Math.floor(Date.now() / 1000) + 120,
      jti: randomBytes(24).toString('hex'),
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('hex');
  return res.json({
    url: `${wp.replace(/\/$/, '')}/?edoctor_checkout=1`,
    token: `${payload}.${signature}`,
  });
}
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
