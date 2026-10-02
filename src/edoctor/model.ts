/**
 * WooCommerce owns categories, attributes and prices. Nothing in this file may
 * invent a category: the storefront only ships the *presentation* metadata that
 * WordPress has no field for (editorial tagline, illustrated universe art, nav
 * grouping), keyed by the WooCommerce category slug.
 */
import type { IconName as CategoryIcon } from './Icon';

export type Category = {
  slug: string;
  name: string;
  description: string;
  count: number;
  image: string;
};

export type CategoryArt = {
  /** File under /univers, e.g. 'vector/ram.svg'. */
  art: string;
  /** Lucide glyph used in the navigation and on cards. */
  icon: CategoryIcon;
  /** Nav order inside its group. */
  order: number;
  tagline: string;
  nav: 'standalone' | 'composants' | 'peripheriques';
  /** Shown on the homepage universe grid. */
  featured: boolean;
};

export const categoryArt: Record<string, CategoryArt> = {
  'pc-fixes': {
    art: 'vector/pc-fixes.svg',
    icon: 'pc-fixes',
    order: 1,
    tagline: 'Un ordinateur à votre mesure',
    nav: 'standalone',
    featured: true,
  },
  portables: {
    art: 'vector/portables.svg',
    icon: 'portables',
    order: 2,
    tagline: 'La puissance vous accompagne',
    nav: 'standalone',
    featured: true,
  },
  processeurs: {
    art: 'vector/processeurs.svg',
    icon: 'processeurs',
    order: 3,
    tagline: 'Le cœur de votre configuration',
    nav: 'composants',
    featured: false,
  },
  'cartes-graphiques': {
    art: 'vector/cartes-graphiques.svg',
    icon: 'cartes-graphiques',
    order: 4,
    tagline: 'Donnez vie à chaque détail',
    nav: 'composants',
    featured: true,
  },
  'cartes-meres': {
    art: 'vector/cartes-meres.svg',
    icon: 'cartes-meres',
    order: 5,
    tagline: 'Une base solide',
    nav: 'composants',
    featured: false,
  },
  ram: {
    art: 'vector/ram.svg',
    icon: 'ram',
    order: 6,
    tagline: 'Plus de fluidité au quotidien',
    nav: 'composants',
    featured: false,
  },
  ssd: {
    art: 'vector/ssd.svg',
    icon: 'ssd',
    order: 7,
    tagline: 'Vos idées, sans attente',
    nav: 'composants',
    featured: false,
  },
  boitiers: {
    art: 'vector/boitiers.svg',
    icon: 'boitiers',
    order: 8,
    tagline: 'Une place pour chaque composant',
    nav: 'composants',
    featured: false,
  },
  alimentations: {
    art: 'vector/alimentations.svg',
    icon: 'alimentations',
    order: 9,
    tagline: 'Une énergie maîtrisée',
    nav: 'composants',
    featured: false,
  },
  refroidissement: {
    art: 'vector/refroidissement.svg',
    icon: 'refroidissement',
    order: 10,
    tagline: 'Gardez la tête froide',
    nav: 'composants',
    featured: false,
  },
  ecrans: {
    art: 'vector/ecrans.svg',
    icon: 'ecrans',
    order: 11,
    tagline: 'Voyez plus grand',
    nav: 'peripheriques',
    featured: true,
  },
  claviers: {
    art: 'vector/claviers.svg',
    icon: 'claviers',
    order: 12,
    tagline: 'Chaque touche compte',
    nav: 'peripheriques',
    featured: false,
  },
  souris: {
    art: 'vector/souris.svg',
    icon: 'souris',
    order: 13,
    tagline: 'La précision en main',
    nav: 'peripheriques',
    featured: false,
  },
  casques: {
    art: 'vector/casques.svg',
    icon: 'casques',
    order: 14,
    tagline: 'Entrez dans votre univers',
    nav: 'peripheriques',
    featured: false,
  },
};

/** Fallback illustration for a WooCommerce category that has no artwork yet. */
export const fallbackArt: CategoryArt = {
  art: 'vector/univers.svg',
  icon: 'univers',
  order: 99,
  tagline: 'Sélection EDoctor',
  nav: 'composants',
  featured: false,
};

export const artFor = (slug: string) => categoryArt[slug] ?? fallbackArt;

export type Product = {
  id: number;
  slug: string;
  name: string;
  sku: string;
  /** WooCommerce product_cat slugs; the storefront never hardcodes these. */
  categories: string[];
  brand: string;
  tier: string;
  description: string;
  image: string;
  price: number | null;
  onSale?: boolean;
  publishedAt?: string;
  stock: boolean;
  purchasable: boolean;
  attributes: Record<string, string>;
  uses: string[];
  variations: {
    id: number;
    name: string;
    price: number | null;
    stock: boolean;
  }[];
};

export type BasketLine = {
  productId: number;
  variationId: number;
  quantity: number;
  name: string;
  price: number | null;
};

export const money = (value: number | null) =>
  value === null
    ? 'Prix sur demande'
    : new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(value);

/** Opaque marker so a caller can hide a page that has no source of truth. */
export const hasCatalog = (products: Product[]) => products.length > 0;
