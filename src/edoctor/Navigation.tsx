import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from './Link';
import Icon from './Icon';
import { artFor, type Category } from './model';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from './ui/navigation-menu';

function CategoryLinks({
  items,
  path,
  mobile = false,
}: {
  items: Category[];
  path: string;
  mobile?: boolean;
}) {
  return (
    <ul className="nav-category-grid">
      {items.map((category) => {
        const link = (
          <Link
            href={`/categorie/${category.slug}`}
            aria-current={
              path === `/categorie/${category.slug}` ? 'page' : undefined
            }
          >
            <span className="nav-category-art">
              <Image
                src={`/univers/${artFor(category.slug).art}`}
                alt=""
                width={80}
                height={58}
                sizes="80px"
              />
            </span>
            <span>
              <strong>{category.name}</strong>
              <small>
                {category.description || artFor(category.slug).tagline}
              </small>
            </span>
          </Link>
        );
        return (
          <li key={category.slug}>
            {mobile ? (
              link
            ) : (
              <NavigationMenuLink asChild>{link}</NavigationMenuLink>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function Navigation({
  categories,
  mobileOpen = false,
  idPrefix = 'nav',
}: {
  categories: Category[];
  mobileOpen?: boolean;
  idPrefix?: string;
}) {
  const router = useRouter();
  const path = router.asPath.split('?')[0];
  const [value, setValue] = useState('');
  useEffect(() => {
    setValue('');
  }, [path]);
  const sorted = [...categories].sort(
    (a, b) => artFor(a.slug).order - artFor(b.slug).order,
  );
  const roots = sorted.filter(
    (c) => !c.parent || !sorted.some((p) => p.slug === c.parent),
  );
  const groups = [
    { section: 'univers', label: 'Tous les univers', items: sorted },
    ...roots.map((root) => ({
      section: root.slug,
      label: root.name,
      items: sorted.filter((c) => c.parent === root.slug),
    })),
  ].filter((g) => g.items.length);
  const links = (
    <>
      <Link className="nav-item" href="/compte">
        Mon compte
      </Link>
      {!categories.length && (
        <Link className="nav-item" href="/categories">
          <Icon name="univers" />
          Tous les univers
        </Link>
      )}
      <Link
        className="nav-item nav-offers"
        href="/offres"
        aria-current={path === '/offres' ? 'page' : undefined}
      >
        Les offres du moment
      </Link>
      <Link
        className="nav-item"
        href="/contact"
        aria-current={path === '/contact' ? 'page' : undefined}
      >
        Un conseil pour choisir ?
      </Link>
    </>
  );
  if (mobileOpen)
    return (
      <nav
        id={`${idPrefix}-main`}
        className="mobile-navigation"
        aria-label="Navigation principale"
      >
        <Accordion type="single" collapsible>
          {groups.map(({ section, label, items }) => (
            <AccordionItem
              value={section}
              key={section}
              id={`${idPrefix}-${section}`}
            >
              <AccordionTrigger>{label}</AccordionTrigger>
              <AccordionContent>
                <CategoryLinks items={items} path={path} mobile />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {links}
      </nav>
    );
  return (
    <div className="desktop-navigation wrap">
      <NavigationMenu
        aria-label="Navigation principale"
        id={`${idPrefix}-main`}
        className="main-nav"
        value={value}
        onValueChange={setValue}
        delayDuration={100}
        skipDelayDuration={250}
      >
        <NavigationMenuList className="main-nav-list">
          {groups.map(({ section, label, items }) => (
            <NavigationMenuItem value={section} key={section}>
              <NavigationMenuTrigger className="nav-item">
                {label}
              </NavigationMenuTrigger>
              <NavigationMenuContent
                id={`${idPrefix}-${section}`}
                className="nav-panel"
              >
                <div className="nav-panel-heading">
                  <h2>{label}</h2>
                  <Link href="/categories">
                    Explorer les univers <Icon name="arrow" />
                  </Link>
                </div>
                <CategoryLinks items={items} path={path} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          ))}
          {sorted
            .filter(
              (c) =>
                roots.includes(c) &&
                !sorted.some((child) => child.parent === c.slug),
            )
            .slice(0, 3)
            .map((category) => (
              <NavigationMenuItem key={category.slug}>
                <NavigationMenuLink asChild>
                  <Link
                    className="nav-item"
                    href={`/categorie/${category.slug}`}
                    aria-current={
                      path === `/categorie/${category.slug}`
                        ? 'page'
                        : undefined
                    }
                  >
                    {category.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          <NavigationMenuItem className="nav-editorial">
            {links}
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}
