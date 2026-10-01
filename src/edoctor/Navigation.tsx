import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from './Link';
import Icon from './Icon';
import { categories } from './model';

type Section = 'univers' | 'composants' | 'peripheriques';
const groups = {
  univers: {
    label: 'Tous les univers',
    title: 'Votre matériel, par catégorie',
    icon: 'univers',
    items: categories,
  },
  composants: {
    label: 'Composants',
    title: 'Construisez votre configuration',
    icon: 'processeurs',
    items: categories.slice(2, 10),
  },
  peripheriques: {
    label: 'Périphériques',
    title: 'Complétez votre équipement',
    icon: 'ecrans',
    items: categories.slice(10),
  },
} as const;

export default function Navigation({ mobileOpen }: { mobileOpen: boolean }) {
  const [open, setOpen] = useState<Section | null>(null);
  const root = useRef<HTMLElement>(null);
  const triggers = useRef<Partial<Record<Section, HTMLButtonElement | null>>>(
    {},
  );
  const focusRequested = useRef<Section | null>(null);
  const router = useRouter();
  useEffect(() => {
    const close = () => setOpen(null);
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    router.events.on('routeChangeStart', close);
    document.addEventListener('pointerdown', outside);
    return () => {
      router.events.off('routeChangeStart', close);
      document.removeEventListener('pointerdown', outside);
    };
  }, [router.events]);
  useEffect(() => {
    if (!mobileOpen) setOpen(null);
  }, [mobileOpen]);
  useEffect(() => {
    if (open && focusRequested.current === open) {
      root.current
        ?.querySelector<HTMLAnchorElement>(`#nav-${open} .nav-category-grid a`)
        ?.focus();
      focusRequested.current = null;
    }
  }, [open]);
  function disclosure(section: Section) {
    const group = groups[section];
    return (
      <div className="nav-group" key={section}>
        <button
          className={`nav-item ${open === section ? 'is-active' : ''}`}
          ref={(button) => {
            triggers.current[section] = button;
          }}
          aria-expanded={open === section}
          aria-controls={`nav-${section}`}
          onClick={() => setOpen(open === section ? null : section)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (open === section)
                root.current
                  ?.querySelector<HTMLAnchorElement>(
                    `#nav-${section} .nav-category-grid a`,
                  )
                  ?.focus();
              else {
                focusRequested.current = section;
                setOpen(section);
              }
            }
          }}
        >
          <Icon name={group.icon} />
          <span>{group.label}</span>
          <Icon name="chevron" className="nav-chevron" />
        </button>
        {open === section && (
          <div className="nav-panel" id={`nav-${section}`}>
            <div className="nav-panel-heading">
              <h2>{group.title}</h2>
              <Link href="/categories">
                Voir tous les univers <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="nav-category-grid">
              {group.items.map((category) => (
                <li key={category[0]}>
                  <Link
                    href={`/categorie/${category[0]}`}
                    aria-current={
                      router.asPath.split('?')[0] ===
                      `/categorie/${category[0]}`
                        ? 'page'
                        : undefined
                    }
                  >
                    <span className="nav-category-art">
                      <Image
                        src={`/univers/${category[3]}`}
                        alt=""
                        width={400}
                        height={290}
                        sizes="80px"
                      />
                    </span>
                    <span>
                      <strong>{category[1]}</strong>
                      <small>{category[2]}</small>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
  return (
    <nav
      ref={root}
      id="main-nav"
      className={`wrap main-nav ${mobileOpen ? 'is-open' : ''}`}
      aria-label="Navigation principale"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(null);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          triggers.current[open]?.focus();
          setOpen(null);
        }
      }}
    >
      {disclosure('univers')}
      <Link className="nav-item" href="/categorie/pc-fixes">
        <Icon name="pc-fixes" />
        <span>PC fixes</span>
      </Link>
      <Link className="nav-item" href="/categorie/portables">
        <Icon name="portables" />
        <span>Portables</span>
      </Link>
      {disclosure('composants')}
      {disclosure('peripheriques')}
      <Link className="nav-item" href="/guide">
        <Icon name="guide" />
        <span>Le guide ED</span>
      </Link>
      <Link className="nav-item" href="/blog">
        <Icon name="book" />
        <span>Le journal ED</span>
      </Link>
      <Link className="nav-item nav-export" href="/livraison">
        <Icon name="export" />
        <span>France → Algérie</span>
      </Link>
    </nav>
  );
}
