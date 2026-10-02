import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from '@/edoctor/Link';
import Shell from '@/edoctor/Shell';
import { useBasket } from '@/edoctor/Basket';
import { money, type Category, type Product } from '@/edoctor/model';
import { categories, productBySlug } from '@/edoctor/server';
import Breadcrumbs from '@/edoctor/Breadcrumbs';
import { Button } from '@/edoctor/ui/button';
import { Label } from '@/edoctor/ui/label';
import Icon from '@/edoctor/Icon';
import { trackConversion } from '@/edoctor/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/edoctor/ui/select';

export default function ProductPage({
  product: p,
  categories,
}: {
  product: Product;
  categories: Category[];
}) {
  const { add } = useBasket();
  const [variation, setVariation] = useState(0);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    setAdded(false);
    setVariation(0);
  }, [p.id]);
  const index = useMemo(
    () => new Map(categories.map((item) => [item.slug, item])),
    [categories],
  );
  // WooCommerce files a product in as many categories as it deserves; only the
  // categories that actually exist are linked, and none is dropped.
  const productCategories = p.categories
    .map((slug) => index.get(slug))
    .filter((item): item is Category => Boolean(item));
  const category = productCategories[0];
  const selected = p.variations.find((v) => v.id === variation);
  const price = selected ? selected.price : p.price;
  const available =
    p.purchasable &&
    (p.variations.length ? Boolean(selected?.stock) : p.stock) &&
    price !== null;
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  const json = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.description,
    ...(p.image ? { image: p.image } : {}),
    brand: { '@type': 'Brand', name: p.brand },
    ...(p.price !== null && p.purchasable && origin && !p.variations.length
      ? {
          offers: {
            '@type': 'Offer',
            url: `${origin}/produit/${p.slug}`,
            priceCurrency: 'EUR',
            price: p.price,
            availability: p.stock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          },
        }
      : {}),
  };
  return (
    <Shell
      title={p.name}
      description={p.description.slice(0, 160)}
      categories={categories}
      noindex={price === null}
    >
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(json).replace(/</g, '\\u003c'),
          }}
        />
      </Head>
      <div className="wrap page-section">
        <Breadcrumbs
          items={[
            { name: 'Accueil', href: '/' },
            ...(category
              ? [
                  {
                    name: category.name,
                    href: `/categorie/${category.slug}`,
                  },
                ]
              : []),
            ...productCategories.slice(1).map((item) => ({
              name: item.name,
              href: `/categorie/${item.slug}`,
            })),
            { name: p.name, href: `/produit/${p.slug}` },
          ]}
        />
        <div className="product-detail">
          <div className="detail-picture">
            {p.image ? (
              <Image
                src={p.image}
                alt={p.name}
                fill
                priority
                sizes="(max-width:700px) 90vw,550px"
              />
            ) : (
              <p>Visuel à venir</p>
            )}
          </div>
          <div>
            <span className="eyebrow">
              {[p.brand, p.tier].filter(Boolean).join(' · ')}
            </span>
            <nav className="detail-categories" aria-label="Catégories">
              <ul>
                {productCategories.map((item) => (
                  <li key={item.slug}>
                    <Link href={`/categorie/${item.slug}`}>{item.name}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <h1>{p.name}</h1>
            <p className="intro">{p.description}</p>
            <p className="detail-price">
              {money(price)}
              {price !== null && <small> HT</small>}
            </p>
            {p.variations.length > 0 && (
              <div className="detail-variation">
                <Label htmlFor="variation">Configuration</Label>
                <Select
                  value={String(variation)}
                  onValueChange={(value) => {
                    setVariation(Number(value));
                    setAdded(false);
                  }}
                >
                  <SelectTrigger id="variation">
                    <SelectValue placeholder="Choisir une configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {p.variations.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={String(v.id)}
                        disabled={!v.stock}
                      >
                        {v.name} — {money(v.price)}
                        {!v.stock ? ' · indisponible' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <p>
              {available
                ? 'Disponible à la commande'
                : p.variations.length && !variation
                  ? 'Sélectionnez une configuration'
                  : 'Disponibilité à confirmer'}
            </p>
            <div className="actions">
              <Button
                disabled={!available}
                onClick={() => {
                  add({
                    productId: p.id,
                    variationId: variation,
                    quantity: 1,
                    name: p.name + (selected ? ` — ${selected.name}` : ''),
                    price,
                  });
                  setAdded(true);
                  trackConversion('add_to_cart', {
                    source: 'product',
                    count: 1,
                  });
                }}
              >
                <Icon name={added ? 'check' : 'cart'} />
                {added ? 'Ajouté au panier' : 'Ajouter au panier'}
              </Button>
              <Link
                className="text-link"
                href={`/contact?produit=${encodeURIComponent(p.name)}`}
              >
                Demander conseil ↗
              </Link>
            </div>
            <p role="status">
              {added && (
                <>
                  Ajouté au panier.{' '}
                  <Link href="/panier">Voir mon panier →</Link>
                </>
              )}
            </p>
            <p className="caption">
              Prix et disponibilité vérifiés avant commande. Les modalités
              d’expédition sont confirmées avant règlement.
            </p>
          </div>
        </div>
        {!!Object.keys(p.attributes).length && (
          <section className="section">
            <h2>Dans le détail.</h2>
            <dl className="specs">
              {Object.entries(p.attributes).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {!!p.uses.length && (
          <section className="section">
            <h2>Pour quels usages.</h2>
            <ul className="use-list">
              {p.uses.map((use) => (
                <li key={use}>{use}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Shell>
  );
}

export const getStaticPaths = () => ({ paths: [], fallback: 'blocking' });

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const product = await productBySlug(params.slug);
  return product
    ? { props: { product, categories: await categories() }, revalidate: 300 }
    : { notFound: true, revalidate: 60 };
}
