import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog, categories as loadCategories } from '@/edoctor/server';
import { currentOffers } from '@/edoctor/offers';
import type { Category, Product } from '@/edoctor/model';

export default function Offers({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  return (
    <Shell
      title="Les offres du moment"
      categories={categories}
      noindex={!products.length}
    >
      <div className="wrap page-section">
        <span className="eyebrow">PLUS DE POSSIBILITÉS POUR VOTRE BUDGET</span>
        <h1>Les offres du moment.</h1>
        <p className="intro">
          Du matériel neuf pour votre prochain projet. Les promotions
          disponibles, au même endroit.
        </p>
        <Catalog
          offersOnly
          products={products}
          categoriesBySlug={
            new Map(categories.map((category) => [category.slug, category]))
          }
          emptyState={{
            title: 'Quelle est votre prochaine configuration ?',
            body: 'Aucune promotion publiée pour le moment. Explorez les univers ou demandez à ED une sélection adaptée à votre budget.',
            cta: { href: '/categories', label: 'Explorer les univers' },
          }}
        />
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  const [products, categories] = await Promise.all([
    catalog(),
    loadCategories(),
  ]);
  return {
    props: { products: currentOffers(products), categories },
    revalidate: 300,
  };
}
