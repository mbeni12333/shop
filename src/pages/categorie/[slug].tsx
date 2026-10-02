import { useMemo } from 'react';
import Link from '@/edoctor/Link';
import Image from 'next/image';
import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog, categories, categoryIndex } from '@/edoctor/server';
import { artFor, type Category, type Product } from '@/edoctor/model';
import Breadcrumbs from '@/edoctor/Breadcrumbs';

export default function CategoryPage({
  products,
  category,
  categories,
}: {
  products: Product[];
  category: Category;
  categories: Category[];
}) {
  const index = useMemo(
    () => new Map(categories.map((item) => [item.slug, item])),
    [categories],
  );
  const art = artFor(category.slug);
  return (
    <Shell
      title={category.name}
      categories={categories}
      noindex={!category.count}
    >
      <div className="wrap page-section">
        <Breadcrumbs
          items={[
            { name: 'Accueil', href: '/' },
            { name: 'Univers', href: '/categories' },
            { name: category.name, href: `/categorie/${category.slug}` },
          ]}
        />
        <div className="category-hero">
          <div>
            <span className="eyebrow">L’UNIVERS EDOCTOR</span>
            <h1>{category.name}</h1>
            <p className="intro">
              {category.description || art.tagline}. Trouvez l’équipement adapté
              à votre usage et à votre budget.
            </p>
            <Link
              className="text-link"
              href={`/contact?produit=${encodeURIComponent(category.name)}`}
            >
              Un conseil pour choisir ? ↗
            </Link>
          </div>
          <Image
            src={`/univers/${art.art}`}
            alt={`Illustration de l’univers ${category.name}`}
            width={400}
            height={290}
            sizes="(max-width:767px) 240px, 270px"
          />
        </div>
        <Catalog
          products={products}
          categoriesBySlug={index}
          singleCategory
          categorySlug={category.slug}
        />
      </div>
    </Shell>
  );
}

export const getStaticPaths = async () => ({
  paths: (await categories()).map((category) => ({
    params: { slug: category.slug },
  })),
  // A category created in WordPress must be reachable without a rebuild.
  fallback: 'blocking' as const,
});

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const index = await categoryIndex();
  const category = index.get(params.slug);
  if (!category) return { notFound: true, revalidate: 300 };
  const products = (await catalog()).filter((product) =>
    product.categories.includes(params.slug),
  );
  return {
    props: { category, products, categories: [...index.values()] },
    revalidate: 300,
  };
}
