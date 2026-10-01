import { catalog, posts } from '@/edoctor/server';
import { categories } from '@/edoctor/model';
import { researchPreviewEnabled } from '@/edoctor/research-catalog';
export default function Sitemap() {
  return null;
}
const xml = (s: string) =>
  s.replace(
    /[<>&'\"]/g,
    (c) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[c]!,
  );
export async function getServerSideProps({
  res,
}: {
  res: {
    setHeader: (k: string, v: string) => void;
    write: (s: string) => void;
    end: () => void;
    statusCode: number;
  };
}) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin || researchPreviewEnabled()) {
    res.statusCode = 503;
    res.end();
    return { props: {} };
  }
  try {
    const [products, articles] = await Promise.all([catalog(), posts()]);
    const paths = [
      '/',
      '/categories',
      '/produits',
      '/guide',
      '/blog',
      '/livraison',
      '/paiement',
      '/garanties',
      '/contact',
      ...categories.map((c) => `/categorie/${c[0]}`),
      ...products.map((p) => `/produit/${p.slug}`),
      ...articles.map((p) => `/blog/${p.slug}`),
    ];
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=3600',
    );
    res.write(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${xml(origin + p)}</loc></url>`).join('')}</urlset>`,
    );
    res.end();
  } catch {
    res.statusCode = 503;
    res.end();
  }
  return { props: {} };
}
