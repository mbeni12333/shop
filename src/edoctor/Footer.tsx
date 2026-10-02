import Link from './Link';
import type { Category } from './model';
export default function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <Link className="footer-brand" href="/">
            EDoctor<span>.</span>
          </Link>
          <p>
            Le bon matériel.
            <br />
            Un vrai interlocuteur.
            <br />
            De la France à l’Algérie.
          </p>
        </div>
        <div>
          <h2>Votre boutique</h2>
          <Link href="/categories">Tous les univers</Link>
          <Link href="/offres">Les offres du moment</Link>
          {categories.slice(0, 5).map((c) => (
            <Link key={c.slug} href={`/categorie/${c.slug}`}>
              {c.name}
            </Link>
          ))}
          <Link href="/blog">Conseils & découvertes</Link>
        </div>
        <div>
          <h2>À vos côtés</h2>
          <Link href="/livraison">Livraison & export</Link>
          <Link href="/paiement">Moyens de paiement</Link>
          <Link href="/garanties">Garanties & retours</Link>
          <Link href="/contact">Parlons de votre projet</Link>
        </div>
        <div>
          <h2>Informations</h2>
          <Link href="/compte">Mon compte</Link>
          <Link href="/mentions-legales">Mentions légales</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/conditions">Conditions de vente</Link>
        </div>
      </div>
      <div className="wrap footer-bottom">
        © {new Date().getFullYear()} EDoctor{' '}
        <span>
          Prix en euros · modalités d’export confirmées avant règlement
        </span>
      </div>
    </footer>
  );
}
