import { categoryArt, type Category } from './model';

// Editorial design preview only. Connected stores always use WooCommerce taxonomy.
const names: Record<string, string> = {
  'pc-fixes': 'PC fixes',
  portables: 'PC portables',
  processeurs: 'Processeurs',
  'cartes-graphiques': 'Cartes graphiques',
  'cartes-meres': 'Cartes mères',
  ram: 'Mémoire RAM',
  ssd: 'SSD & stockage',
  boitiers: 'Boîtiers',
  alimentations: 'Alimentations',
  refroidissement: 'Refroidissement',
  ecrans: 'Écrans',
  claviers: 'Claviers',
  souris: 'Souris',
  casques: 'Casques',
};

export const previewUniverses: Category[] = Object.entries(categoryArt).map(
  ([slug, art]) => ({
    slug,
    name: names[slug],
    description: art.tagline,
    count: 0,
    image: '',
  }),
);
