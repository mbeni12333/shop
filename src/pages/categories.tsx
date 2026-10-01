import Link from '@/edoctor/Link';
import Image from 'next/image';
import Shell from '@/edoctor/Shell';
import { categories } from '@/edoctor/model';
export default function Categories() {
  return (
    <Shell title="Tous les univers">
      <div className="wrap page-section">
        <span className="eyebrow">LA BOUTIQUE EDOCTOR</span>
        <h1>Quel est votre prochain projet ?</h1>
        <p className="intro">
          Un ordinateur complet ou la pièce qui fait la différence. Explorez nos
          univers.
        </p>
        <div className="category-directory">
          {categories.map((c) => (
            <Link key={c[0]} href={`/categorie/${c[0]}`}>
              <Image
                className="category-directory-picture"
                src={`/univers/${c[3]}`}
                alt=""
                width={400}
                height={290}
                sizes="(max-width:639px) 80vw, (max-width:1023px) 40vw, 330px"
              />
              <h2>
                {c[1]} <span aria-hidden>↗</span>
              </h2>
              <p>{c[2]}</p>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}
