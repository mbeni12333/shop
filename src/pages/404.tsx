import Link from 'next/link';
import Shell from '@/edoctor/Shell';
export default function Missing() {
  return (
    <Shell title="Page introuvable" noindex>
      <div className="wrap page-section narrow">
        <span className="eyebrow">404</span>
        <h1>On vous remet sur la bonne voie.</h1>
        <p>Cette page n’existe plus ou son adresse a changé.</p>
        <Link className="button" href="/categories">
          Explorer les univers ↗
        </Link>
      </div>
    </Shell>
  );
}
