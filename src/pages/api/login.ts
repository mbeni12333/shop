import type { NextApiRequest, NextApiResponse } from 'next';

import { sameOrigin } from '@/edoctor/security';

import { authQuery, sessionCookie, tokenLifetime } from '@/edoctor/auth-server';

export const config = { api: { bodyParser: { sizeLimit: '8kb' } } };

export default async function login(req: NextApiRequest, res: NextApiResponse) {
  if (!sameOrigin(req, res)) return;

  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    username.length > 254 ||
    typeof password !== 'string' ||
    !password ||
    password.length > 1024
  )
    return res
      .status(400)
      .json({ error: 'Saisissez votre identifiant et votre mot de passe.' });

  try {
    const { login: result } = await authQuery<{
      login: { authToken: string; refreshToken: string };
    }>(
      'mutation Login($username:String!,$password:String!){login(input:{provider:PASSWORD,credentials:{username:$username,password:$password}}){authToken refreshToken}}',
      { username: username.trim(), password },
    );

    if (!result?.authToken || !result.refreshToken)
      throw new Error('Authentication failed');

    res.setHeader('Set-Cookie', [
      sessionCookie(
        'ed_auth',
        result.authToken,
        tokenLifetime(result.authToken, 3600),
      ),
      sessionCookie(
        'ed_refresh',
        result.refreshToken,
        tokenLifetime(result.refreshToken, 604800),
      ),
    ]);

    return res.status(200).json({ ok: true });
  } catch {
    return res
      .status(401)
      .json({
        error:
          'Connexion impossible. Vérifiez vos identifiants ou réessayez dans un instant.',
      });
  }
}
