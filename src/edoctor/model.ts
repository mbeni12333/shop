export const categories = [
  [
    'pc-fixes',
    'PC fixes',
    'Un ordinateur à votre mesure',
    'vector/pc-fixes.svg',
  ],
  [
    'portables',
    'PC portables',
    'La puissance vous accompagne',
    'vector/portables.svg',
  ],
  [
    'processeurs',
    'Processeurs',
    'Le cœur de votre configuration',
    'vector/processeurs.svg',
  ],
  [
    'cartes-graphiques',
    'Cartes graphiques',
    'Donnez vie à chaque détail',
    'vector/cartes-graphiques.svg',
  ],
  [
    'cartes-meres',
    'Cartes mères',
    'Une base solide',
    'vector/cartes-meres.svg',
  ],
  ['ram', 'Mémoire RAM', 'Plus de fluidité au quotidien', 'vector/ram.svg'],
  ['ssd', 'Stockage SSD', 'Vos idées, sans attente', 'vector/ssd.svg'],
  [
    'boitiers',
    'Boîtiers',
    'Une place pour chaque composant',
    'vector/boitiers.svg',
  ],
  [
    'alimentations',
    'Alimentations',
    'Une énergie maîtrisée',
    'vector/alimentations.svg',
  ],
  [
    'refroidissement',
    'Refroidissement',
    'Gardez la tête froide',
    'vector/refroidissement.svg',
  ],
  ['ecrans', 'Écrans', 'Voyez plus grand', 'vector/ecrans.svg'],
  ['claviers', 'Claviers', 'Chaque touche compte', 'vector/claviers.svg'],
  ['souris', 'Souris', 'La précision en main', 'vector/souris.svg'],
  ['casques', 'Casques', 'Entrez dans votre univers', 'vector/casques.svg'],
] as const;
export type Product = {
  catalogSource?: 'research';
  research?: {
    manufacturerPartNumber: string | null;
    sources: { url: string; verifiedAt: string; kind: string }[];
    rationale: string;
    missing: string[];
  };
  id: number;
  slug: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  tier: string;
  description: string;
  image: string;
  price: number | null;
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
export const categoryName = (slug: string) =>
  categories.find((c) => c[0] === slug)?.[1] || slug;
