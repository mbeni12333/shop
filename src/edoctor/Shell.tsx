import Head from 'next/head';
import Image from 'next/image';
import Link from './Link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBasket } from './Basket';
import Icon from './Icon';
import Navigation from './Navigation';

export default function Shell({
  children,
  title,
  description = 'Matériel informatique neuf, conseil personnalisé et accompagnement export de la France vers l’Algérie.',
  noindex = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  noindex?: boolean;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = () => setMenu(false);
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && menu) {
        close();
        menuToggle.current?.focus();
      }
    };
    router.events.on('routeChangeStart', close);
    document.addEventListener('keydown', escape);
    return () => {
      router.events.off('routeChangeStart', close);
      document.removeEventListener('keydown', escape);
    };
  }, [router.events, menu]);
  const { lines } = useBasket();
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const path = router.asPath.split('?')[0];
  return (
    <>
      <Head>
        <title>{title} | EDoctor</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#6840c6" />
        <meta
          name="robots"
          content={
            noindex || !base || router.asPath.includes('?')
              ? 'noindex,follow'
              : 'index,follow'
          }
        />
        {base && <link rel="canonical" href={`${base}${path}`} />}
        <meta property="og:title" content={`${title} | EDoctor`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
      </Head>
      <a className="skip-link" href="#contenu">
        Aller au contenu
      </a>
      <div className="announcement">
        Une entreprise française. À vos côtés, jusqu’en Algérie.{' '}
        <Link href="/livraison">
          Notre accompagnement export <span aria-hidden>↗</span>
        </Link>
      </div>
      <header className="site-header">
        <div className="wrap header-main">
          <Link href="/" className="brand" aria-label="EDoctor — accueil">
            <Image src="/brand/logo.jpg" alt="" width={52} height={52} />
            <span>
              EDoctor<small>LE MATÉRIEL. LE CONSEIL EN PLUS.</small>
            </span>
          </Link>
          <form className="header-search" action="/recherche">
            <label className="sr-only" htmlFor="header-q">
              Rechercher un produit
            </label>
            <input
              id="header-q"
              name="q"
              placeholder="Un produit, une marque, une envie…"
            />
            <button aria-label="Rechercher">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
            </button>
          </form>
          <Link className="header-advice" href="/contact">
            Un conseil ? <strong>On vous écoute ↗</strong>
          </Link>
          <Link className="basket-link" href="/panier">
            <Icon name="cart" />
            <span className="basket-label">Panier</span>
            <span className="basket-count">
              {lines.reduce((sum, l) => sum + l.quantity, 0)}
            </span>
          </Link>
          <button
            ref={menuToggle}
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="main-nav"
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? 'close' : 'menu'} />
            <span>Menu</span>
          </button>
        </div>
        <Navigation mobileOpen={menu} />
      </header>
      <main id="contenu">{children}</main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div>
            <Link className="footer-brand" href="/">
              EDoctor<span>.</span>
            </Link>
            <p>
              Le bon matériel.
              <br />
              Un vrai interlocuteur.
              <br />
              De la France à l’Algérie.
            </p>
          </div>
          <div>
            <h2>Votre boutique</h2>
            <Link href="/categories">Tous les univers</Link>
            <Link href="/guide">Le guide ED</Link>
            <Link href="/blog">Conseils & découvertes</Link>
          </div>
          <div>
            <h2>À vos côtés</h2>
            <Link href="/livraison">Livraison & export</Link>
            <Link href="/paiement">Moyens de paiement</Link>
            <Link href="/garanties">Garanties & retours</Link>
            <Link href="/contact">Parlons de votre projet</Link>
          </div>
          <div>
            <h2>Informations</h2>
            <Link href="/compte">Mon compte</Link>
            <Link href="/mentions-legales">Mentions légales</Link>
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions de vente</Link>
            <a href="https://github.com/mbeni12333/shop">
              Code source · AGPL-3.0
            </a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          © {new Date().getFullYear()} EDoctor{' '}
          <span>
            Prix en euros · modalités d’export confirmées avant règlement
          </span>
        </div>
      </footer>
    </>
  );
}
