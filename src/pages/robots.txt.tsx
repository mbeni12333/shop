export default function Robots() {
  return null;
}
export function getServerSideProps({
  res,
}: {
  res: {
    setHeader: (k: string, v: string) => void;
    write: (s: string) => void;
    end: () => void;
  };
}) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  res.setHeader('Content-Type', 'text/plain');
  res.write(
    origin && !researchPreviewEnabled()
      ? `User-agent: *\nDisallow: /api/\nDisallow: /panier\nDisallow: /compte\nDisallow: /recherche\nSitemap: ${origin}/sitemap.xml\n`
      : 'User-agent: *\nDisallow: /\n',
  );
  res.end();
  return { props: {} };
}
import { researchPreviewEnabled } from '@/edoctor/research-catalog';
