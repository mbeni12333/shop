import { useMemo } from 'react';
import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog, categories as wooCategories } from '@/edoctor/server';
import type { Category, Product } from '@/edoctor/model';

export default function SearchPage({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const index = useMemo(
    () => new Map(categories.map((item) => [item.slug, item])),
    [categories],
  );
  return (
    <Shell title="Recherche" categories={categories} noindex>
      <div className="wrap page-section">
        <h1>Qu’avez-vous en tête ?</h1>
        <Catalog products={products} categoriesBySlug={index} />
      </div>
    </Shell>
  );
}

export async function getStaticProps() {
  const [products, categories] = await Promise.all([
    catalog(),
    wooCategories(),
  ]);
  return { props: { products, categories }, revalidate: 300 };
}
