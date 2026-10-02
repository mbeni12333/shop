import Image from 'next/image';
import Link from './Link';
import { ProductGrid } from './Catalog';
import { artFor, type Category, type Product } from './model';
import { Button } from './ui/button';

export default function HomeOffers({
  products,
  categories,
  sale,
}: {
  products: Product[];
  categories: Category[];
  sale: boolean;
}) {
  const discovery = categories
    .filter((item) =>
      ['portables', 'cartes-graphiques', 'processeurs'].includes(item.slug),
    )
    .slice(0, 3);
  return (
    <section className="home-offers" id="offres" aria-labelledby="offers-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            VOTRE BUDGET. VOTRE NOUVEL ÉQUIPEMENT.
          </span>
          <h2 id="offers-title">
            {sale
              ? 'Les offres du moment.'
              : products.length
                ? 'À découvrir maintenant.'
                : 'Le bon matériel pour votre budget.'}
          </h2>
        </div>
        <Button variant="ghost" asChild>
          <Link href={sale ? '/offres' : '/produits'}>
            {sale ? 'Toutes les offres' : 'Toute la boutique'} ↗
          </Link>
        </Button>
      </div>
      {products.length ? (
        <ProductGrid
          products={products}
          categoriesBySlug={
            new Map(categories.map((item) => [item.slug, item]))
          }
        />
      ) : (
        <div className="budget-discovery">
          {discovery.map((item) => (
            <Link
              key={item.slug}
              href={'/categorie/' + item.slug}
              data-interactive-art
            >
              <Image
                data-art-layer
                src={'/univers/' + artFor(item.slug).art}
                alt=""
                width={160}
                height={116}
              />
              <div>
                <h3>{item.name}</h3>
                <p>{artFor(item.slug).tagline}</p>
                <span className="text-link">Explorer ↗</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
