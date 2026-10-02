import type { ServerResponse } from 'node:http';

export type Customer = { databaseId: number; name: string; email: string };

export async function authQuery<T>(
  query: string,
  variables: Record<string, unknown> = {},
  token?: string,
): Promise<T> {
  const url = process.env.GRAPHQL_URL || process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (!url) throw new Error('Authentication unavailable');

  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new Error('Authentication unavailable');

  const result = await response.json();

  if (result.errors?.length || !result.data)
    throw new Error('Authentication failed');

  return result.data;
}

export function sessionCookie(name: string, token: string, maxAge: number) {
  const secure = (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    ''
  ).startsWith('https:');

  return `${name}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

export function tokenLifetime(token: string, maximum: number) {
  // Decode expiry only. Identity is always verified by WordPress.

  try {
    const exp = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString(),
    ).exp;

    return typeof exp === 'number'
      ? Math.max(0, Math.min(maximum, Math.floor(exp - Date.now() / 1000)))
      : maximum;
  } catch {
    return maximum;
  }
}

export function clearSession(res: ServerResponse) {
  res.setHeader('Set-Cookie', [
    sessionCookie('ed_auth', '', 0),
    sessionCookie('ed_refresh', '', 0),
  ]);
}

export async function customerSession(
  cookies: Partial<Record<string, string>>,
  res: ServerResponse,
): Promise<Customer | null> {
  const viewer = async (token: string) =>
    (
      await authQuery<{ viewer: Customer | null }>(
        'query CustomerSession { viewer { databaseId name email } }',
        {},
        token,
      )
    ).viewer;

  if (cookies.ed_auth) {
    try {
      const user = await viewer(cookies.ed_auth);
      if (user) return user;
    } catch {}
  }

  if (cookies.ed_refresh) {
    try {
      const { refreshToken: result } = await authQuery<{
        refreshToken: { authToken: string; success: boolean };
      }>(
        'mutation RefreshSession($token:String!){refreshToken(input:{refreshToken:$token}){authToken success}}',
        { token: cookies.ed_refresh },
      );

      if (result.success && result.authToken) {
        const user = await viewer(result.authToken);

        if (user) {
          res.setHeader(
            'Set-Cookie',
            sessionCookie(
              'ed_auth',
              result.authToken,
              tokenLifetime(result.authToken, 3600),
            ),
          );
          return user;
        }
      }
    } catch {}
  }

  if (cookies.ed_auth || cookies.ed_refresh) clearSession(res);

  return null;
}
