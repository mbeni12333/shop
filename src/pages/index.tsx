import { Button } from '@/edoctor/ui/button';
import { Card } from '@/edoctor/ui/card';
import { useRef } from 'react';
import Image from 'next/image';
import Link from '@/edoctor/Link';
import Shell from '@/edoctor/Shell';
import { artFor, type Category, type Product } from '@/edoctor/model';
import { catalog, categories as wooCategories } from '@/edoctor/server';
import HardwareHero from '@/edoctor/HardwareHero';
import HomeOffers from '@/edoctor/HomeOffers';
import ShippingJourney from '@/edoctor/ShippingJourney';
import { currentOffers } from '@/edoctor/offers';
import { useDiscoveryMotion } from '@/edoctor/motion';

export default function Home({
  products,
  categories,
  sale,
}: {
  products: Product[];
  categories: Category[];
  sale: boolean;
}) {
  const scope = useRef<HTMLDivElement>(null);
  useDiscoveryMotion(scope);
  const featured = [...categories]
    .sort((a, b) => artFor(a.slug).order - artFor(b.slug).order)
    .slice(0, 8);
  return (
    <Shell
      title="Votre prochain équipement commence ici"
      categories={categories}
    >
      <div className="wrap" ref={scope}>
        <section className="hero hero-compact">
          <div className="hero-copy">
            <span className="eyebrow">VOTRE ENVIE DE MIEUX S’ÉQUIPER</span>
            <h1>
              Votre prochain équipement.
              <br />
              <em>Bien choisi.</em>
            </h1>
            <p>
              Du matériel neuf, le conseil d’ED et votre budget en tête. Trouvez
              l’équipement qui vous ressemble.
            </p>
            <div className="actions">
              <Button asChild>
                <Link href="#offres">Voir la sélection ↗</Link>
              </Button>
              <Link className="text-link" href="/categories">
                Tous les univers →
              </Link>
            </div>
            <div className="hero-note">
              <span className="check">✓</span> Un vrai interlocuteur pour faire
              le bon choix.
            </div>
          </div>
          <div className="hero-visual" data-interactive-art>
            <div className="hero-orbit" />
            <HardwareHero />
          </div>
        </section>
        <HomeOffers products={products} categories={categories} sale={sale} />
        <section className="section home-universes">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TROUVEZ VOTRE TERRAIN DE JEU</span>
              <h2>À chaque envie, son univers.</h2>
            </div>
            <Link className="text-link" href="/categories">
              Les univers ↗
            </Link>
          </div>
          <div className="universe-grid">
            {featured.map((category) => (
              <Card asChild key={category.slug}>
                <Link
                  className="universe-card"
                  href={'/categorie/' + category.slug}
                  data-discover
                  data-interactive-art
                >
                  <Image
                    data-art-layer
                    src={'/univers/' + artFor(category.slug).art}
                    alt=""
                    width={240}
                    height={174}
                    sizes="(max-width:639px) 40vw, 220px"
                  />
                  <div>
                    <h3>{category.name}</h3>
                    <span>{artFor(category.slug).tagline}</span>
                  </div>
                  <span className="round-arrow" aria-hidden>
                    ↗
                  </span>
                </Link>
              </Card>
            ))}
          </div>
        </section>
        <section className="advice-banner advisor-choice">
          <Image
            src="/brand/ed-welcome.png"
            alt="ED vous accompagne pour choisir votre équipement"
            width={1024}
            height={1536}
            sizes="180px"
          />
          <div>
            <span className="eyebrow">AVANT DE CHOISIR, PARLONS DE VOUS</span>
            <h2>Le bon choix commence par une bonne question.</h2>
            <p>
              Votre usage, votre budget, votre configuration actuelle. ED vous
              aide à trouver ce qui fera vraiment la différence.
            </p>
            <Button asChild>
              <Link href="/contact">Décrire mon projet à ED ↗</Link>
            </Button>
          </div>
        </section>
        <ShippingJourney />
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  const [catalogue, categories] = await Promise.all([
    catalog(),
    wooCategories(),
  ]);
  const offers = currentOffers(catalogue);
  const products = (
    offers.length
      ? offers
      : [...catalogue].sort((a, b) =>
          (b.publishedAt || '').localeCompare(a.publishedAt || ''),
        )
  ).slice(0, 4);
  return {
    props: { products, categories, sale: offers.length > 0 },
    revalidate: 300,
  };
}
