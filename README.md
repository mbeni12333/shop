# EDoctor

Boutique française de matériel informatique neuf, avec accompagnement export vers l’Algérie. Next.js Pages Router utilise Apollo, WPGraphQL et WooGraphQL ; WooCommerce conserve les produits, prix, stocks, comptes et commandes. La recherche utilise Meilisearch auto-hébergé.

## Développement

Node.js 24 et npm sont requis. Le verrou utilisé est `package-lock.json`.

```sh
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
```

Renseigner les variables selon [le guide de configuration](DOCS/EDOCTOR-SETUP.md). Sans backend configuré, les pages présentent des états vides explicites. Elles ne créent pas de faux produits, prix ou stocks.

## Interface et recherche

Les composants shadcn/Radix partagent la palette, les rayons et les contrôles de 48 px d’EDoctor. La référence interne `/interne/design-system` est hors navigation et non indexée. Les illustrations d’univers restent des SVG EDoctor ; les commandes utilisent Lucide.

GSAP anime la composition matérielle, les illustrations au pointeur, les apparitions de catégories et la confirmation panier. Les effets se nettoient au démontage et respectent la réduction des mouvements. Les panneaux Radix gardent leurs transitions CSS courtes ; aucune propriété n’est animée simultanément par CSS et GSAP.

Une recherche globale fournit les suggestions. React InstantSearch gère les filtres, les budgets et le tri, avec une URL partageable et l’historique Next.js. Avec les deux variables publiques Meilisearch configurées, l’adaptateur officiel est utilisé. Sinon, les mêmes widgets interrogent exclusivement un instantané WooGraphQL ; le header passe par `/api/search`. Une panne Meilisearch affiche une erreur sans inventer de résultats.

Le worker `node scripts/sync-search.mjs --watch` reconstruit un index temporaire à partir des produits WooCommerce publiés, attend les tâches et échange l’index atomiquement. La clé serveur reste hors navigateur.

Les événements `edoctor:conversion` restent locaux et inactifs sans consentement explicite (`edoctor-analytics-consent=granted`). Brancher l’outil de mesure et son gestionnaire de consentement avant le suivi des conversions. Aucun texte de recherche ni identifiant client n’est envoyé.

## Vérifications

```sh
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:catalog
npm run catalog:audit
```

`npm run format` harmonise les fichiers source, styles, scripts et documents. Les sorties de compilation, rapports, verrous et fichiers générés sont exclus.

Le bridge PHP est également formaté. [Le suivi des dépendances](DOCS/DEPENDENCIES.md) distingue l’audit de production et les alertes restantes dans les outils de mesure.

Les tests du catalogue construisent des fixtures fictives dans `.next-catalog-test`, séparément de la production. Ils ne certifient pas les paiements réels. [Le compte rendu de validation](DOCS/VALIDATION.md) précise les résultats et les vérifications encore nécessaires.

`node scripts/test-catalog.mjs --serve` fournit un aperçu isolé avec des références fictives clairement identifiées. `--skip-build` réutilise la construction de test. `--measure` mesure trois passages mobiles de l’accueil, d’une catégorie et d’un produit ; rapports dans `lighthouse-catalog-reports`.

## Organisation

- `src/edoctor` : composants partagés, panier, filtres, recherche et accès GraphQL.
- `src/pages` : routes françaises et API serveur. Les anciennes URL norvégiennes sont redirigées par `next.config.ts`.
- `public/univers/vector` : illustrations détaillées des quatorze catégories.
- `wordpress/edoctor-bridge` : extension GraphQL, transfert sécurisé du panier et demandes de conseil.
- `catalog` : recherche fabricant et photos sourcées ; sélection encore partielle, aucun import WooCommerce réalisé.
- `skills/edoctor-storefront` : conventions EDoctor versionnées.
- `Dockerfile`, `compose.yaml` et `.github/workflows/edoctor-release.yml` : construction, recherche persistante et livraison Coolify avec validation de production.

Les paramètres commerciaux inconnus restent à configurer. Le commerce demeure fermé par défaut dans le bridge WordPress.

## Origine et licence

Adaptation du dépôt [mbeni12333/shop](https://github.com/mbeni12333/shop), issu du travail de [w3bdesign/nextjs-woocommerce](https://github.com/w3bdesign/nextjs-woocommerce). La licence [AGPL-3.0](LICENSE) et les attributions d’origine sont conservées. Les photos commerciales suivent les droits documentés dans leurs fichiers de provenance, sans être assimilées à la licence du code.

Les anciens rapports d’analyse dans `DOCS` décrivent le dépôt d’origine ; utiliser `EDOCTOR-SETUP.md` et `VALIDATION.md` pour l’état actuel.
