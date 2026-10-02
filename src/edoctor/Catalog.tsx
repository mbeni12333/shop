import Image from 'next/image';
import { useEffect, useState } from 'react';
import Link from './Link';
import dynamic from 'next/dynamic';
import { type Category, type Product, money } from './model';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import Icon from './Icon';
import { trackConversion } from './analytics';

const InstantCatalog = dynamic(() => import('./InstantCatalog'), {
  ssr: false,
  loading: () => <p role="status">Chargement des filtres…</p>,
});
export function ProductCard({
  product,
  categoriesBySlug,
}: {
  product: Product;
  categoriesBySlug: Map<string, Category>;
}) {
  const category = categoriesBySlug.get(product.categories[0]);
  return (
    <Card className="product-card" role="article">
      <Link
        href={`/produit/${product.slug}`}
        onClick={() => trackConversion('product_open', { source: 'catalog' })}
      >
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
            {product.brand || category?.name || ''}
          </span>
          <h2>{product.name}</h2>
          <p>
            {Object.entries(product.attributes)
              .slice(0, 2)
              .map(([label, value]) => `${label} : ${value}`)
              .join(' · ') || product.description.slice(0, 85)}
          </p>
          <Badge variant="secondary" className="product-availability">
            {product.variations.length
              ? 'Configurations disponibles'
              : product.stock && product.purchasable
                ? 'Disponible'
                : 'Sur demande'}
          </Badge>
          <div className="product-bottom">
            <strong>
              {money(product.price)}
              {product.price !== null && <small> HT</small>}
            </strong>
            <Icon name="arrow" />
          </div>
        </div>
      </Link>
    </Card>
  );
}

export function ProductGrid({
  products,
  categoriesBySlug,
  onReset,
}: {
  products: Product[];
  categoriesBySlug: Map<string, Category>;
  onReset?: () => void;
}) {
  if (!products.length)
    return (
      <div className="empty-state">
        <h3>Aucun produit avec ces critères.</h3>
        <p>
          Élargissez votre budget ou retirez un filtre pour retrouver la
          sélection.
        </p>
        {onReset && (
          <Button variant="secondary" onClick={onReset}>
            Voir toute la sélection
          </Button>
        )}
      </div>
    );
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          categoriesBySlug={categoriesBySlug}
        />
      ))}
    </div>
  );
}

export function Catalog({
  products,
  categoriesBySlug,
  emptyState,
  singleCategory = false,
  categorySlug,
}: {
  products: Product[];
  categoriesBySlug: Map<string, Category>;
  emptyState?: {
    title: string;
    body: string;
    cta?: { href: string; label: string };
  };
  singleCategory?: boolean;
  categorySlug?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!products.length)
    return (
      <div className="empty-state">
        <h3>
          {emptyState?.title ?? 'Aucun produit disponible pour le moment.'}
        </h3>
        <p>
          {emptyState?.body ??
            'Parlez-nous de votre besoin, nous vous aiderons à choisir votre équipement.'}
        </p>
        <Button asChild variant="outline">
          <Link href={emptyState?.cta?.href ?? '/contact'}>
            {emptyState?.cta?.label ?? 'Demander conseil'}
            <Icon name="arrow" />
          </Link>
        </Button>
      </div>
    );
  if (!mounted)
    return (
      <ProductGrid
        products={products.slice(0, 24)}
        categoriesBySlug={categoriesBySlug}
      />
    );
  return (
    <InstantCatalog
      products={products}
      categoriesBySlug={categoriesBySlug}
      categorySlug={
        categorySlug ??
        (singleCategory ? products[0]?.categories[0] : undefined)
      }
    />
  );
}
