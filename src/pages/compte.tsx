import type { GetServerSideProps } from 'next';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { Button } from '@/edoctor/ui/button';
import { Input } from '@/edoctor/ui/input';
import { Label } from '@/edoctor/ui/label';
import Shell from '@/edoctor/Shell';
import { customerSession, type Customer } from '@/edoctor/auth-server';
export default function Account({
  url,
  customer,
}: {
  url: string;
  customer: Customer | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(customer ? '/api/logout' : '/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.get('username'),
          password: form.get('password'),
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Connexion indisponible.');
      await router.replace('/compte');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Réessayez dans un instant.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Shell title="Mon compte" noindex>
      <div className="wrap page-section narrow">
        <span className="eyebrow">VOTRE ESPACE EDOCTOR</span>
        <h1>
          {customer
            ? `Bonjour ${customer.name}.`
            : 'Heureux de vous retrouver.'}
        </h1>
        <p>
          {customer
            ? customer.email
            : 'Connectez-vous avec votre compte EDoctor.'}
        </p>
        <form onSubmit={submit} className="account-form">
          {!customer && (
            <>
              <Label htmlFor="username">E-mail ou identifiant</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                required
                maxLength={254}
              />
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                maxLength={1024}
              />
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <Button disabled={busy} type="submit">
            {busy
              ? 'Un instant…'
              : customer
                ? 'Se déconnecter'
                : 'Se connecter'}
          </Button>
        </form>
        {url && (
          <p>
            <a href={url}>
              Commandes, informations et récupération du mot de passe ↗
            </a>
          </p>
        )}
      </div>
    </Shell>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'private, no-store');
  return {
    props: {
      customer: await customerSession(req.cookies, res),
      url:
        process.env.WOOCOMMERCE_ACCOUNT_URL ||
        (process.env.WORDPRESS_URL
          ? `${process.env.WORDPRESS_URL.replace(/\/$/, '')}/my-account/`
          : ''),
    },
  };
};
