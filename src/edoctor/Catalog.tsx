import Image from 'next/image';
import Link from './Link';
import FilterPanel from './FilterPanel';
import { useCatalogQuery } from './useCatalogQuery';
import { catalogFacets, filterProducts, queryValue } from './filters';
import { type Product, money, categoryName, categories } from './model';
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/produit/${product.slug}`}>
        <div className="product-picture">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 600px) 85vw, (max-width: 1000px) 45vw, 280px"
            />
          ) : (
            <span className="picture-pending">Visuel à venir</span>
          )}
        </div>
        <div className="product-copy">
          <span className="eyebrow">
            {product.brand || categoryName(product.category)}
          </span>
          <h3>{product.name}</h3>
          <p>
            {Object.entries(product.attributes)
              .slice(0, 2)
              .map(([label, value]) => `${label} : ${value}`)
              .join(' · ') || product.description.slice(0, 85)}
          </p>
          <div className="product-bottom">
            <strong>
              {money(product.price)}
              {product.price !== null && <small> HT</small>}
            </strong>
            <span aria-hidden>↗</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length)
    return (
      <div className="empty-state">
        <h3>Votre prochain équipement se prépare.</h3>
        <p>
          Notre sélection sera disponible ici dès sa publication. Parlez-nous de
          votre besoin pour être accompagné.
        </p>
        <Link className="button secondary" href="/contact">
          Contacter EDoctor ↗
        </Link>
      </div>
    );
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
export function Catalog({
  products,
  showSearch = false,
}: {
  products: Product[];
  showSearch?: boolean;
}) {
  const { query, update, clear } = useCatalogQuery();
  const selectedCategory = queryValue(query, 'categorie');
  const categoryProducts = selectedCategory
    ? products.filter((product) => product.category === selectedCategory)
    : products;
  const facets = catalogFacets(categoryProducts);
  const hasPrices = categoryProducts.some((product) => product.price !== null);
  const categoryChoices = categories.filter((category) =>
    products.some((product) => product.category === category[0]),
  );
  const filtered = filterProducts(products, query);
  const active = [
    'marque',
    'gamme',
    'budget',
    'tri',
    'q',
    'categorie',
    ...facets.map((facet) => facet.key),
  ].some((key) => queryValue(query, key));
  return (
    <>
      {products.some((product) => product.catalogSource === 'research') && (
        <div className="research-notice">
          <strong>Sélection en préparation.</strong> Références étudiées, prix
          et disponibilité à confirmer avec EDoctor.
        </div>
      )}
      <div className="catalog-layout">
        <FilterPanel>
          {showSearch && (
            <label>
              Recherche dans la sélection
              <input
                type="search"
                placeholder="Nom, marque, référence…"
                value={queryValue(query, 'q')}
                onChange={(event) => update('q', event.target.value)}
              />
            </label>
          )}
          {categoryChoices.length > 1 && (
            <label>
              Catégorie
              <select
                value={selectedCategory}
                onChange={(event) => update('categorie', event.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {categoryChoices.map((category) => (
                  <option value={category[0]} key={category[0]}>
                    {category[1]}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            Marque
            <select
              value={queryValue(query, 'marque')}
              onChange={(event) => update('marque', event.target.value)}
            >
              <option value="">Toutes les marques</option>
              {[
                ...new Set(
                  categoryProducts
                    .map((product) => product.brand)
                    .filter(Boolean),
                ),
              ]
                .sort()
                .map((brand) => (
                  <option key={brand}>{brand}</option>
                ))}
            </select>
          </label>
          <label>
            Gamme
            <select
              value={queryValue(query, 'gamme')}
              onChange={(event) => update('gamme', event.target.value)}
            >
              <option value="">Toutes les gammes</option>
              {[
                ...new Set(
                  categoryProducts
                    .map((product) => product.tier)
                    .filter(Boolean),
                ),
              ].map((tier) => (
                <option key={tier}>{tier}</option>
              ))}
            </select>
          </label>
          <label>
            Budget maximum HT (€)
            <input
              type="number"
              disabled={!hasPrices}
              min="0"
              placeholder="En euros"
              value={queryValue(query, 'budget')}
              onChange={(event) => update('budget', event.target.value)}
            />
            {!hasPrices && (
              <small className="filter-help">
                Les prix de vente sont à confirmer.
              </small>
            )}
          </label>
          <label>
            Trier
            <select
              value={queryValue(query, 'tri')}
              onChange={(event) => update('tri', event.target.value)}
            >
              <option value="">Nom</option>
              <option value="croissant" disabled={!hasPrices}>
                Prix croissant
              </option>
              <option value="decroissant" disabled={!hasPrices}>
                Prix décroissant
              </option>
            </select>
          </label>
          {facets.map((facet) => (
            <label key={facet.key}>
              {facet.label}
              <select
                value={queryValue(query, facet.key)}
                onChange={(event) => update(facet.key, event.target.value)}
              >
                <option value="">Tous les choix</option>
                {facet.values.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          ))}
        </FilterPanel>
        <div className="catalog-results">
          <div className="filter-summary">
            <p className="muted" role="status">
              {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
            </p>
            {active && (
              <button type="button" className="text-link" onClick={clear}>
                Effacer les filtres
              </button>
            )}
          </div>
          {products.length > 0 && !filtered.length ? (
            <div className="empty-state">
              <h3>Aucun produit avec ces critères.</h3>
              <p>
                Élargissez votre budget ou retirez un filtre pour retrouver la
                sélection.
              </p>
              <button className="button secondary" onClick={clear}>
                Voir toute la sélection
              </button>
            </div>
          ) : (
            <ProductGrid products={filtered} />
          )}
        </div>
      </div>
    </>
  );
}
