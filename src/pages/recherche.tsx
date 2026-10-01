import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Shell from '@/edoctor/Shell';
import { Catalog } from '@/edoctor/Catalog';
import { catalog } from '@/edoctor/server';
import { researchPreviewEnabled } from '@/edoctor/research-catalog';
import type { Product } from '@/edoctor/model';
const Search = dynamic(() => import('@/edoctor/Search'), {
  ssr: false,
  loading: () => <p>Chargement de la recherche…</p>,
});
export default function SearchPage({ products }: { products: Product[] }) {
  const router = useRouter();
  const q = typeof router.query.q === 'string' ? router.query.q : '';
  return (
    <Shell title="Recherche" noindex>
      <div className="wrap page-section">
        <h1>Qu’avez-vous en tête ?</h1>
        {products.length ? (
          <Catalog products={products} showSearch />
        ) : (
          router.isReady && <Search key={q} initialQuery={q} />
        )}
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  return {
    props: { products: researchPreviewEnabled() ? await catalog() : [] },
    revalidate: 300,
  };
}
