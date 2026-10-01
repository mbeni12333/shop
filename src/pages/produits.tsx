import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog } from '@/edoctor/server';
import type { Product } from '@/edoctor/model';
export default function Products({ products }: { products: Product[] }) {
  return (
    <Shell
      title="Tous les produits"
      noindex={products.some((product) => product.catalogSource === 'research')}
    >
      <div className="wrap page-section">
        <h1>Votre prochain équipement.</h1>
        <Catalog products={products} />
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  return { props: { products: await catalog() }, revalidate: 300 };
}
