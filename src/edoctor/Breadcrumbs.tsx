import Head from 'next/head';

type Crumb = { name: string; href: string };

/**
 * Structured data only. The visible breadcrumb was removed to reclaim the
 * vertical space above the page heading; the BreadcrumbList schema is kept
 * because it is still the cheapest way to describe the hierarchy to search
 * engines and to assistive technology reaching the JSON-LD.
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL;
  let schema: unknown = null;
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
  if (!schema) return null;
  return (
    <Head>
      <script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(schema).replace(/</g, '\\u003c'),
        }}
      />
    </Head>
  );
}
