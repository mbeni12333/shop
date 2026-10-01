import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac } from 'node:crypto';
import { sameOrigin } from '@/edoctor/security';
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!sameOrigin(req, res)) return;
  const { name, email, message, consent, website } = req.body || {};
  if (website) return res.status(400).json({ error: 'Demande non valide.' });
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.length > 100 ||
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 200 ||
    typeof message !== 'string' ||
    message.trim().length < 10 ||
    message.length > 4000 ||
    consent !== 'yes'
  )
    return res
      .status(400)
      .json({ error: 'Vérifiez les champs et votre consentement.' });
  const secret = process.env.CHECKOUT_SECRET;
  const endpoint = process.env.WORDPRESS_URL;
  if (!secret || !endpoint)
    return res.status(503).json({
      error:
        'Le formulaire n’est pas encore connecté. Réessayez ultérieurement.',
    });
  const payload = JSON.stringify({
    name,
    email,
    message,
    timestamp: Math.floor(Date.now() / 1000),
  });
  try {
    const result = await fetch(
      `${endpoint.replace(/\/$/, '')}/wp-json/edoctor/v1/contact`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ED-Signature': createHmac('sha256', secret)
            .update(payload)
            .digest('hex'),
        },
        body: payload,
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!result.ok) throw new Error('contact');
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({
      error:
        'Votre demande n’a pas pu être enregistrée. Réessayez dans quelques instants.',
    });
  }
}
export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };
