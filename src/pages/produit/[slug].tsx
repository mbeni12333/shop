import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Shell from '@/edoctor/Shell';
import { useBasket } from '@/edoctor/Basket';
import { categoryName, money, type Product } from '@/edoctor/model';
import { productBySlug } from '@/edoctor/server';
import Breadcrumbs from '@/edoctor/Breadcrumbs';
export default function ProductPage({ product: p }: { product: Product }) {
  const { add } = useBasket();
  const [variation, setVariation] = useState(0);
  const [added, setAdded] = useState(false);
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
      noindex={p.catalogSource === 'research'}
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
            {
              name: categoryName(p.category),
              href: `/categorie/${p.category}`,
            },
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
              {p.brand} · {p.tier}
            </span>
            <h1>{p.name}</h1>
            <p className="intro">{p.description}</p>
            {p.catalogSource === 'research' && (
              <p className="research-notice">
                Référence étudiée pour la sélection EDoctor. Prix, disponibilité
                et modalités de commande à confirmer avec un conseiller.
              </p>
            )}
            <p className="detail-price">
              {money(price)}
              {price !== null && <small> HT</small>}
            </p>
            {p.variations.length > 0 && (
              <label>
                Configuration
                <select
                  value={variation}
                  onChange={(e) => {
                    setVariation(Number(e.target.value));
                    setAdded(false);
                  }}
                >
                  <option value="0">Choisir une configuration</option>
                  {p.variations.map((v) => (
                    <option key={v.id} value={v.id} disabled={!v.stock}>
                      {v.name} — {money(v.price)}
                      {!v.stock ? ' · indisponible' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p>
              {available
                ? 'Disponible à la commande'
                : p.variations.length && !variation
                  ? 'Sélectionnez une configuration'
                  : 'Disponibilité à confirmer'}
            </p>
            <div className="actions">
              <button
                className="button"
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
                }}
              >
                Ajouter au panier
              </button>
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
        <section className="section">
          <h2>Dans le détail.</h2>
          <dl className="specs">
            {Object.entries(p.attributes).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>
                  <bdi>{v}</bdi>
                </dd>
              </div>
            ))}
          </dl>
        </section>
        {p.research && (
          <section className="section research-sources">
            <h2>Référence et sources.</h2>
            <p>
              Référence fabricant :{' '}
              <bdi>{p.research.manufacturerPartNumber || 'À confirmer'}</bdi>
            </p>
            <p>{p.research.rationale}</p>
            <ul>
              {p.research.sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consulter la fiche fabricant ↗
                  </a>{' '}
                  <span>
                    · vérifiée le{' '}
                    {new Date(source.verifiedAt).toLocaleDateString('fr-FR', {
                      timeZone: 'UTC',
                    })}
                  </span>
                </li>
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
    ? { props: { product }, revalidate: 300 }
    : { notFound: true, revalidate: 60 };
}
