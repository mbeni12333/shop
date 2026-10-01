import Head from 'next/head';
import Shell from '@/edoctor/Shell';
import { posts, plainText, type Post } from '@/edoctor/server';
import sanitizeHtml from 'sanitize-html';
import Breadcrumbs from '@/edoctor/Breadcrumbs';
export default function Article({
  article: p,
  html,
}: {
  article: Post;
  html: string;
}) {
  return (
    <Shell
      title={plainText(p.title)}
      description={plainText(p.excerpt).slice(0, 160)}
    >
      <Head>
        <meta
          property="og:locale"
          content={p.edoctorLanguage === 'ar' ? 'ar_DZ' : 'fr_FR'}
        />
      </Head>
      <article
        className="wrap page-section prose"
        lang={p.edoctorLanguage || 'fr'}
        dir={p.edoctorLanguage === 'ar' ? 'rtl' : 'ltr'}
      >
        <Breadcrumbs
          items={[
            { name: 'Accueil', href: '/' },
            { name: 'Le journal ED', href: '/blog' },
            { name: plainText(p.title), href: `/blog/${p.slug}` },
          ]}
        />
        <h1>{plainText(p.title)}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </Shell>
  );
}
export const getStaticPaths = () => ({ paths: [], fallback: 'blocking' });
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const article = (await posts()).find((p) => p.slug === params.slug);
  if (!article) return { notFound: true, revalidate: 60 };
  const html = sanitizeHtml(article.content, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'bdi', 'img'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['lang', 'dir'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    transformTags: {
      img: (_tag, attrs) => ({
        tagName: 'img',
        attribs: { ...attrs, loading: 'lazy' },
      }),
    },
  });
  return { props: { article, html }, revalidate: 300 };
}
