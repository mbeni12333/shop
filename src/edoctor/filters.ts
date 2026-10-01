import type { Product } from './model';
import { categoryName } from './model';

type Query = Record<string, string | string[] | undefined>;
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .trim();
const priorities: Record<string, string[]> = {
  'pc-fixes': ['processeur', 'carte graphique', 'ram', 'stockage'],
  portables: [
    'processeur',
    'carte graphique',
    'ram',
    'stockage',
    'taille ecran',
  ],
  processeurs: ['socket', 'coeurs', 'tdp', 'graphique integre'],
  'cartes-graphiques': [
    'gpu',
    'memoire video',
    'vram',
    'longueur',
    'puissance',
  ],
  'cartes-meres': ['socket', 'chipset', 'format', 'type memoire'],
  ram: [
    'type memoire',
    'capacite',
    'format',
    'debit teste',
    'latence',
    'profil',
  ],
  ssd: ['capacite', 'interface', 'format'],
  boitiers: ['format', 'format carte mere', 'longueur gpu'],
  alimentations: ['puissance', 'certification', 'modularite', 'norme atx'],
  refroidissement: ['type', 'socket', 'taille radiateur', 'hauteur'],
  ecrans: ['taille', 'resolution', 'frequence', 'dalle'],
  claviers: ['disposition', 'format', 'connexion', 'switches'],
  souris: ['connexion', 'poids', 'capteur'],
  casques: ['connexion', 'microphone', 'poids'],
};
export const attributeKey = (label: string) =>
  `spec_${fold(label).replace(/[^a-z0-9]+/g, '_')}`;
export const queryValue = (query: Query, key: string) =>
  typeof query[key] === 'string' ? (query[key] as string) : '';

export function catalogFacets(products: Product[]) {
  const category = new Set(products.map((product) => product.category));
  // On the all-products page, avoid comparing category-specific units together.
  if (category.size !== 1) return [];
  const preferred = priorities[products[0]?.category] || [];
  const labels = [
    ...new Set(products.flatMap((product) => Object.keys(product.attributes))),
  ];
  return preferred.flatMap((name) => {
    const label = labels.find((label) => fold(label) === name);
    if (!label) return [];
    const values = [
      ...new Set(
        products.map((product) => product.attributes[label]).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
    return values.length > 1
      ? [{ label, key: attributeKey(label), values }]
      : [];
  });
}

export function filterProducts(products: Product[], query: Query) {
  const category = queryValue(query, 'categorie');
  const terms = fold(queryValue(query, 'q')).split(/\s+/).filter(Boolean);
  const brand = queryValue(query, 'marque');
  const tier = queryValue(query, 'gamme');
  const budget = queryValue(query, 'budget');
  const ceiling =
    budget && Number.isFinite(Number(budget)) && Number(budget) >= 0
      ? Number(budget)
      : null;
  const facets = catalogFacets(
    category
      ? products.filter((product) => product.category === category)
      : products,
  );
  const filtered = products.filter(
    (product) =>
      (!category || product.category === category) &&
      terms.every((term) =>
        fold(
          [
            product.name,
            product.sku,
            product.brand,
            categoryName(product.category),
            product.description,
            ...Object.values(product.attributes),
          ].join(' '),
        ).includes(term),
      ) &&
      (!brand || product.brand === brand) &&
      (!tier || product.tier === tier) &&
      (ceiling === null ||
        (product.price !== null && product.price <= ceiling)) &&
      facets.every(
        (facet) =>
          !queryValue(query, facet.key) ||
          product.attributes[facet.label] === queryValue(query, facet.key),
      ),
  );
  const order = queryValue(query, 'tri');
  return filtered.sort((a, b) => {
    // Unknown prices always come last, including descending order.
    if (order === 'croissant' || order === 'decroissant') {
      if (a.price === null)
        return b.price === null ? a.name.localeCompare(b.name, 'fr') : 1;
      if (b.price === null) return -1;
      return order === 'croissant' ? a.price - b.price : b.price - a.price;
    }
    return a.name.localeCompare(b.name, 'fr');
  });
}
