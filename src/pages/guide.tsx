import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import { ProductGrid } from '@/edoctor/Catalog';
import { catalog } from '@/edoctor/server';
import { categories, type Product } from '@/edoctor/model';
export default function Guide({ products }: { products: Product[] }) {
  const [usage, setUsage] = useState('bureautique');
  const [category, setCategory] = useState('portables');
  const [budget, setBudget] = useState(800);
  const [submitted, setSubmitted] = useState(false);
  const research = products.some(
    (product) => product.catalogSource === 'research',
  );
  const candidates = products
    .filter(
      (product) =>
        product.catalogSource === 'research' && product.category === category,
    )
    .slice(0, 3);
  const results = products
    .filter(
      (p) =>
        p.category === category &&
        p.uses.includes(usage) &&
        p.price !== null &&
        p.price <= budget &&
        p.stock,
    )
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 6);
  return (
    <Shell title="Le guide ED" noindex={research}>
      <div className="wrap page-section">
        <span className="eyebrow">ON PART DE VOUS</span>
        <h1>Le bon équipement, sans hésiter.</h1>
        <p className="intro">
          Dites-nous ce qui compte. Nous comparons votre besoin aux
          caractéristiques renseignées, sans dépasser votre budget.
        </p>
        <form
          className="guide-form"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <label>
            Votre usage
            <select value={usage} onChange={(e) => setUsage(e.target.value)}>
              <option value="bureautique">Travailler & étudier</option>
              <option value="gaming">Jouer</option>
              <option value="creation">Créer & monter</option>
            </select>
          </label>
          <label>
            Votre équipement
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option value={c[0]} key={c[0]}>
                  {c[1]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Budget maximum HT (€)
            <input
              type="number"
              min="1"
              required
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
            />
          </label>
          <button className="button">Voir les choix adaptés ↗</button>
        </form>
        {submitted && (
          <section className="section">
            <h2>
              {research && candidates.length
                ? 'Références à comparer avec un conseiller.'
                : results.length
                  ? 'Ces références correspondent à vos critères.'
                  : 'Affinons votre recherche ensemble.'}
            </h2>
            {research && candidates.length && (
              <p className="research-notice">
                Ces références sont en cours de sélection. Un conseiller
                confirmera leur adéquation à votre usage, leur prix et votre
                budget avant commande.
              </p>
            )}
            <ProductGrid products={research ? candidates : results} />
          </section>
        )}
      </div>
    </Shell>
  );
}
export async function getStaticProps() {
  return { props: { products: await catalog() }, revalidate: 300 };
}
