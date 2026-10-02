import { useMemo, useRef } from 'react';
import Image from 'next/image';
import Shell from '@/edoctor/Shell';
import Link from '@/edoctor/Link';
import { categories } from '@/edoctor/server';
import { artFor, type Category } from '@/edoctor/model';
import { useDiscoveryMotion } from '@/edoctor/motion';
import Icon from '@/edoctor/Icon';

export default function CategoriesPage({
  categories,
}: {
  categories: Category[];
}) {
  const scope = useRef<HTMLDivElement>(null);
  useDiscoveryMotion(scope);
  const ordered = useMemo(
    () =>
      categories
        .slice()
        .sort((a, b) => artFor(a.slug).order - artFor(b.slug).order),
    [categories],
  );
  return (
    <Shell title="Tous les univers" categories={categories}>
      <div className="wrap page-section" ref={scope}>
        <span className="eyebrow">LA BOUTIQUE EDOCTOR</span>
        <h1>Quel est votre prochain projet ?</h1>
        <p className="intro">
          Un ordinateur complet ou la pièce qui fait la différence. Explorez nos
          univers.
        </p>
        <div className="category-directory">
          {ordered.map((category) => (
            <Link
              key={category.slug}
              href={`/categorie/${category.slug}`}
              data-discover
              data-interactive-art
            >
              <Image
                data-art-layer
                className="category-directory-picture"
                src={`/univers/${artFor(category.slug).art}`}
                alt=""
                width={400}
                height={290}
                sizes="(max-width:639px) 80vw, (max-width:1023px) 40vw, 330px"
              />
              <h2>
                {category.name} <Icon name="arrow" />
              </h2>
              <p>{category.description || artFor(category.slug).tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}

export async function getStaticProps() {
  return { props: { categories: await categories() }, revalidate: 300 };
}
