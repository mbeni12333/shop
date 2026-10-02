import { Button } from '@/edoctor/ui/button';
import { useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from '@/edoctor/Link';
import Shell from '@/edoctor/Shell';
import { ProductGrid } from '@/edoctor/Catalog';
import { artFor, type Category, type Product } from '@/edoctor/model';
import { catalog, categories as wooCategories } from '@/edoctor/server';
import HardwareHero from '@/edoctor/HardwareHero';
import { useDiscoveryMotion } from '@/edoctor/motion';
export default function Home({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const scope = useRef<HTMLDivElement>(null);
  useDiscoveryMotion(scope);
  const index = useMemo(
    () => new Map(categories.map((item) => [item.slug, item])),
    [categories],
  );
  const featured = categories
    .filter((category) => artFor(category.slug).featured)
    .sort((a, b) => artFor(a.slug).order - artFor(b.slug).order);
  return (
    <Shell
      title="Votre prochain équipement commence ici"
      categories={categories}
    >
      <div className="wrap" ref={scope}>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow pill">
              LE BON MATÉRIEL, LE BON CONSEIL
            </span>
            <h1>
              Votre prochain
              <br />
              coup de <em>puissance.</em>
            </h1>
            <p>
              Pour jouer, créer ou travailler. Trouvez le matériel qui vous
              ressemble, avec un expert à vos côtés, de la France à l’Algérie.
            </p>
            <div className="actions">
              <Button asChild>
                <Link href="/categories">Explorer la boutique ↗</Link>
              </Button>
              <Link className="text-link" href="/contact">
                Je me laisse guider →
              </Link>
            </div>
            <div className="hero-note">
              <span className="check">✓</span> Du conseil humain. Des choix
              éclairés.
            </div>
          </div>
          <div className="hero-visual" data-interactive-art>
            <div className="hero-orbit" />
            <HardwareHero />
            <span className="floating-note">
              ✦ Bien équipé.
              <br />
              <strong>Bien accompagné.</strong>
            </span>
          </div>
        </section>
        <div className="trust-strip">
          <div>
            <span>01</span>
            <p>
              <strong>Le matériel neuf</strong>Des références pour vos usages
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              <strong>Un interlocuteur à l’écoute</strong>On vous aide à faire
              le bon choix
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              <strong>Cap sur l’Algérie</strong>Un accompagnement à chaque étape
            </p>
          </div>
        </div>
        {!!featured.length && (
          <section className="section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">À CHAQUE ENVIE, SON ÉQUIPEMENT</span>
                <h2>
                  Entrez dans votre univers<span>.</span>
                </h2>
              </div>
              <Link className="text-link" href="/categories">
                Tous les univers ↗
              </Link>
            </div>
            <div className="universe-grid">
              {featured.map((category) => (
                <Link
                  className="universe-card"
                  data-discover
                  data-interactive-art
                  key={category.slug}
                  href={`/categorie/${category.slug}`}
                >
                  <div>
                    <h3>{category.name}</h3>
                    <span>
                      {category.description || artFor(category.slug).tagline}
                    </span>
                  </div>
                  <Image
                    data-art-layer
                    src={`/univers/${artFor(category.slug).art}`}
                    alt=""
                    width={400}
                    height={290}
                    sizes="(max-width:639px) calc(100vw - 96px), (max-width:1023px) 300px, 220px"
                  />
                  <span className="round-arrow" aria-hidden>
                    ↗
                  </span>
                </Link>
              ))}
            </div>
            <p className="caption">
              Illustrations d’univers — les références exactes figurent sur les
              fiches produits.
            </p>
          </section>
        )}
        {!!products.length && (
          <section className="section selection">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PENSÉ POUR VOUS</span>
                <h2>
                  À découvrir chez EDoctor<span>.</span>
                </h2>
              </div>
              <Link className="text-link" href="/produits">
                Voir la sélection ↗
              </Link>
            </div>
            <ProductGrid products={products} categoriesBySlug={index} />
          </section>
        )}
        <section className="advice-banner">
          <div>
            <span className="eyebrow">PAS BESOIN D’ÊTRE UN EXPERT</span>
            <h2>
              Un doute ?<br />
              ED est dans votre équipe.
            </h2>
            <p>
              Votre usage, votre budget, vos envies.
              <br />
              On part de vous pour trouver le bon équipement.
            </p>
            <Button asChild>
              <Link href="/contact">Trouver mon équipement ↗</Link>
            </Button>
          </div>
          <Image
            src="/brand/ed-welcome.png"
            alt="ED vous aide à choisir votre équipement"
            width={1024}
            height={1536}
            sizes="(max-width:440px) calc(100vw - 96px), 320px"
          />
        </section>
        <section className="section export-section">
          <div>
            <span className="eyebrow">DE LA FRANCE À L’ALGÉRIE</span>
            <h2>
              La distance change.
              <br />
              L’attention reste.
            </h2>
          </div>
          <div>
            <p>
              Un achat de matériel mérite des réponses claires. Nous vous
              accompagnons pour choisir votre équipement et confirmer ensemble
              les modalités de paiement et d’expédition.
            </p>
            <Link className="text-link" href="/livraison">
              Comprendre l’accompagnement export ↗
            </Link>
          </div>
        </section>
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  const [products, categories] = await Promise.all([
    catalog(),
    wooCategories(),
  ]);
  return {
    props: { products: products.slice(0, 4), categories },
    revalidate: 300,
  };
}
