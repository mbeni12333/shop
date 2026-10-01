import type { NextApiRequest, NextApiResponse } from 'next';
export default function health(_req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok' });
}
