import Image from 'next/image';
import Link from '@/edoctor/Link';
import Shell from '@/edoctor/Shell';
import { ProductGrid } from '@/edoctor/Catalog';
import { categories, type Product } from '@/edoctor/model';
import { catalog } from '@/edoctor/server';
export default function Home({ products }: { products: Product[] }) {
  return (
    <Shell
      title="Votre prochain équipement commence ici"
      noindex={products.some((product) => product.catalogSource === 'research')}
    >
      <div className="wrap">
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
              <Link className="button" href="/categories">
                Explorer la boutique ↗
              </Link>
              <Link className="text-link" href="/guide">
                Je me laisse guider →
              </Link>
            </div>
            <div className="hero-note">
              <span className="check">✓</span> Du conseil humain. Des choix
              éclairés.
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-orbit" />
            <Image
              src="/brand/hardware-setup.svg"
              alt="Illustration d’un ordinateur, d’un écran, d’un clavier et d’une souris"
              width={760}
              height={560}
              priority
              sizes="(max-width:1023px) 90vw, 48vw"
            />
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
            {[categories[0], categories[1], categories[3], categories[10]].map(
              (c) => (
                <Link
                  className="universe-card"
                  key={c[0]}
                  href={`/categorie/${c[0]}`}
                >
                  <div>
                    <h3>{c[1]}</h3>
                    <span>{c[2]}</span>
                  </div>
                  <Image
                    src={`/univers/${c[3]}`}
                    alt=""
                    width={400}
                    height={290}
                    sizes="(max-width:639px) calc(100vw - 96px), (max-width:1023px) 300px, 220px"
                  />
                  <span className="round-arrow" aria-hidden>
                    ↗
                  </span>
                </Link>
              ),
            )}
          </div>
          <p className="caption">
            Illustrations d’univers — les références exactes figurent sur les
            fiches produits.
          </p>
        </section>
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
          <ProductGrid products={products} />
        </section>
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
            <Link className="button" href="/guide">
              Trouver mon équipement ↗
            </Link>
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
  return {
    props: { products: (await catalog()).slice(0, 4) },
    revalidate: 300,
  };
}
