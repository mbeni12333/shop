import Link from '@/edoctor/Link';
import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import { useBasket } from '@/edoctor/Basket';
import { money } from '@/edoctor/model';
import BasketQuantity from '@/edoctor/BasketQuantity';
import { Button } from '@/edoctor/ui/button';
import Icon from '@/edoctor/Icon';
export default function Basket() {
  const { lines, ready, quantity, clear } = useBasket();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function checkout() {
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: lines.map(({ productId, variationId, quantity }) => ({
            productId,
            variationId,
            quantity,
          })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.url;
      const input = document.createElement('input');
      input.name = 'edoctor_token';
      input.type = 'hidden';
      input.value = data.token;
      form.append(input);
      document.body.append(form);
      window.addEventListener('pagehide', clear, { once: true });
      form.submit();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Réessayez dans un instant.');
      setBusy(false);
    }
  }
  return (
    <Shell title="Votre panier" noindex>
      <div className="wrap page-section narrow">
        <span className="eyebrow">BIENTÔT ENTRE VOS MAINS</span>
        <h1>Votre panier.</h1>
        {!ready ? (
          <p>Chargement du panier…</p>
        ) : !lines.length ? (
          <div className="empty-state">
            <h2>Une envie d’équipement ?</h2>
            <p>Votre panier est encore vide.</p>
            <Button asChild>
              <Link href="/categories">Explorer les univers ↗</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="basket-lines">
              {lines.map((l, i) => (
                <article key={`${l.productId}-${l.variationId}`}>
                  <div>
                    <h2>{l.name}</h2>
                    <p>
                      {l.price === null
                        ? 'Prix à confirmer'
                        : `${money(l.price)} HT`}{' '}
                      · prix indicatif mémorisé
                    </p>
                  </div>
                  <BasketQuantity
                    name={l.name}
                    value={l.quantity}
                    onChange={(n) => quantity(i, n)}
                  />
                  <Button
                    variant="ghost"
                    onClick={() => quantity(i, 0)}
                    aria-label={`Retirer ${l.name}`}
                  >
                    Retirer
                  </Button>
                </article>
              ))}
            </div>
            <div className="basket-total">
              Sous-total indicatif HT{' '}
              <strong>
                {lines.some((l) => l.price === null)
                  ? 'À confirmer'
                  : money(
                      lines.reduce(
                        (s, l) => s + (l.price || 0) * l.quantity,
                        0,
                      ),
                    )}
              </strong>
            </div>
            <div className="basket-checkout">
              <p>
                Le paiement WooCommerce vérifie les prix, le stock et les frais.
                Si les modalités d’export nécessitent une confirmation,
                choisissez l’accompagnement d’un conseiller.
              </p>
              <Button onClick={checkout} disabled={busy}>
                {busy
                  ? 'Vérification du panier…'
                  : 'Continuer vers le paiement'}
                <Icon name="arrow" />
              </Button>
              {error && <p role="alert">{error}</p>}
              <Link href="/contact">Besoin d’aide avec votre commande ?</Link>
            </div>
          </>
        )}
      </div>
    </Shell>
  );
}
export const getServerSideProps = ({
  res,
}: {
  res: { setHeader: (name: string, value: string) => void };
}) => {
  res.setHeader('Cache-Control', 'private, no-store');
  return { props: {} };
};
