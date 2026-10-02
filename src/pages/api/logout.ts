import type { NextApiRequest, NextApiResponse } from 'next';

import { sameOrigin } from '@/edoctor/security';

import { clearSession } from '@/edoctor/auth-server';

export default function logout(req: NextApiRequest, res: NextApiResponse) {
  if (!sameOrigin(req, res)) return;

  clearSession(res);

  res.status(200).json({ ok: true });
}
