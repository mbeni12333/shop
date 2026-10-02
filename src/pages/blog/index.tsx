import Link from '@/edoctor/Link';
import Shell from '@/edoctor/Shell';
import { posts, plainText, type Post } from '@/edoctor/server';
export default function Blog({ articles }: { articles: Post[] }) {
  return (
    <Shell title="Le journal ED">
      <div className="wrap page-section narrow">
        <span className="eyebrow">COMPRENDRE. CHOISIR. PROFITER.</span>
        <h1>Le journal ED.</h1>
        <p className="intro">
          Conseils et découvertes pour mieux choisir votre matériel.
        </p>
        <div className="blog-list">
          {articles.length ? (
            articles.map((p) => (
              <article key={p.databaseId}>
                <time dateTime={p.date}>
                  {new Date(p.date).toLocaleDateString('fr-FR', {
                    timeZone: 'Europe/Paris',
                  })}
                </time>
                <h2>
                  <Link href={`/blog/${p.slug}`}>{plainText(p.title)}</Link>
                </h2>
                <p>{plainText(p.excerpt)}</p>
                <Link className="text-link" href={`/blog/${p.slug}`}>
                  Lire l’article ↗
                </Link>
              </article>
            ))
          ) : (
            <p className="notice">
              Les premiers articles arrivent prochainement.
            </p>
          )}
        </div>
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  return { props: { articles: await posts() }, revalidate: 300 };
}
