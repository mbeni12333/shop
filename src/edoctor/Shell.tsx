import Head from 'next/head';
import Footer from './Footer';
import CatalogStatus from './CatalogStatus';
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
          <Link className="header-account" href="/compte">
            Mon compte
          </Link>
          <MobileNav categories={categories} />
        </div>
        <Navigation categories={categories} />
      </header>
      <main id="contenu">
        <CatalogStatus />
        {children}
      </main>
      <Footer categories={categories} />
    </>
  );
}
