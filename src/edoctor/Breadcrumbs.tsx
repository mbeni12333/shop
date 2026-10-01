import Head from 'next/head';
import Link from './Link';

type Crumb = { name: string; href: string };
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  let schema = null;
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (base) {
    try {
      const origin = new URL(base);
      if (origin.protocol === 'https:' || origin.protocol === 'http:') {
        schema = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: new URL(item.href, origin).href,
          })),
        };
      }
    } catch {
      /* An unconfigured domain must never produce invented URLs. */
    }
  }
  return (
    <>
      {schema && (
        <Head>
          <script
            id="breadcrumb-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
            }}
          />
        </Head>
      )}
      <nav className="breadcrumbs" aria-label="Fil d’Ariane">
        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={item.href}>
              {index > 0 && <span aria-hidden="true">/</span>}
              {index === items.length - 1 ? (
                <span aria-current="page">
                  <bdi>{item.name}</bdi>
                </span>
              ) : (
                <Link href={item.href}>
                  <bdi>{item.name}</bdi>
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
