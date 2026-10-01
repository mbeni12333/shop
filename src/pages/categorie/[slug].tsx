import Link from 'next/link';
import Image from 'next/image';
import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog } from '@/edoctor/server';
import { categories, type Product } from '@/edoctor/model';
import Breadcrumbs from '@/edoctor/Breadcrumbs';
export default function Category({
  products,
  slug,
}: {
  products: Product[];
  slug: string;
}) {
  const c = categories.find((c) => c[0] === slug)!;
  return (
    <Shell
      title={c[1]}
      noindex={products.some((product) => product.catalogSource === 'research')}
    >
      <div className="wrap page-section">
        <Breadcrumbs
          items={[
            { name: 'Accueil', href: '/' },
            { name: 'Univers', href: '/categories' },
            { name: c[1], href: `/categorie/${c[0]}` },
          ]}
        />
        <div className="category-hero">
          <div>
            <span className="eyebrow">L’UNIVERS EDOCTOR</span>
            <h1>{c[1]}</h1>
            <p className="intro">
              {c[2]}. Trouvez l’équipement adapté à votre usage et à votre
              budget.
            </p>
            <Link
              className="text-link"
              href={`/contact?produit=${encodeURIComponent(c[1])}`}
            >
              Un conseil pour choisir ? ↗
            </Link>
          </div>
          <Image
            src={`/univers/${c[3]}`}
            alt={`Illustration de l’univers ${c[1]}`}
            width={400}
            height={290}
            sizes="(max-width:767px) 240px, 270px"
          />
        </div>
        <Catalog products={products} />
      </div>
    </Shell>
  );
}
export const getStaticPaths = () => ({
  paths: categories.map((c) => ({ params: { slug: c[0] } })),
  fallback: false,
});
export async function getStaticProps({ params }: { params: { slug: string } }) {
  return {
    props: {
      slug: params.slug,
      products: (await catalog()).filter((p) => p.category === params.slug),
    },
    revalidate: 300,
  };
}
