import Head from 'next/head';
import Image from 'next/image';
import Link from './Link';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useBasket } from './Basket';
import Icon from './Icon';
import Navigation from './Navigation';
import Search from './Search';
import { Button } from '@/edoctor/ui/button';
import { useBasketMotion } from './motion';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/edoctor/ui/sheet';
import type { Category } from './model';
import { useCategories } from './useCategories';

/** On small screens the primary navigation moves into a sheet. */
function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const close = () => setOpen(false);
    router.events.on('routeChangeStart', close);
    return () => router.events.off('routeChangeStart', close);
  }, [router.events]);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon"
          className="menu-toggle"
        >
          <Icon name="menu" />
          <span className="sr-only">Ouvrir le menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="mobile-nav-sheet"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus();
        }}
      >
        <SheetTitle>Menu</SheetTitle>
        <SheetDescription className="sr-only">
          Explorez les catégories et les services EDoctor.
        </SheetDescription>
        <Navigation categories={categories} mobileOpen idPrefix="nav-mobile" />
      </SheetContent>
    </Sheet>
  );
}

export default function Shell({
  children,
  title,
  description = 'Matériel informatique neuf, conseil personnalisé et accompagnement export de la France vers l’Algérie.',
  categories: initialCategories,
  noindex = false,
}: {
  children: ReactNode;
  title: string;
  description?: string;
  categories?: Category[];
  noindex?: boolean;
}) {
  const router = useRouter();
  const { lines, ready } = useBasket();
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const basketRef = useBasketMotion(count, ready);
  const categories = useCategories(initialCategories);
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  const path = router.asPath.split('?')[0];
  return (
    <>
      <Head>
        <title>{`${title} | EDoctor`}</title>
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
        Votre prochain équipement. Notre conseil, jusqu’en Algérie.{' '}
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
          <div className="header-search">
            <Search />
          </div>
          <Link className="header-advice" href="/contact">
            Un conseil ? <strong>On vous écoute ↗</strong>
          </Link>
          <Link ref={basketRef} className="basket-link" href="/panier">
            <Icon name="cart" />
            <span className="basket-label">Panier</span>
            <span className="basket-count">{count}</span>
          </Link>
          <MobileNav categories={categories} />
        </div>
        <Navigation categories={categories} />
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
