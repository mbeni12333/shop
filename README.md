# EDoctor

Boutique française de matériel informatique neuf, avec accompagnement export vers l’Algérie. Next.js Pages Router utilise Apollo, WPGraphQL et WooGraphQL ; WooCommerce conserve les produits, prix, stocks, comptes et commandes. La recherche utilise Meilisearch auto-hébergé.

## Développement

Node.js 24 et npm sont requis. Le verrou utilisé est `package-lock.json`. Le verrou pnpm historique est conservé avec ses modifications préexistantes, mais n’est pas utilisé par la construction EDoctor.

```sh
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
```

Renseigner les variables selon [le guide de configuration](DOCS/EDOCTOR-SETUP.md). Sans backend configuré, les pages présentent des états vides explicites. Elles ne créent pas de faux produits, prix ou stocks.

Pour examiner la boutique avec les références déjà étudiées, activer `EDOCTOR_RESEARCH_PREVIEW=1` dans `.env.local`, sans URL GraphQL, puis reconstruire. L’aperçu contient actuellement 45 références dans cinq catégories et deux photos fabricant autorisées. Les autres visuels restent signalés comme manquants. Aucun prix de vente ni stock n’est inventé ; le paiement et l’indexation sont désactivés. Un backend GraphQL configuré garde toujours la priorité.

`npm run seed:generate` reconstruit cet aperçu à partir des fichiers de recherche et copie les photos dont la provenance a été validée. `npm run seed:check` vérifie que les données et photos correspondent aux sources. Ce mécanisme n’importe rien dans WooCommerce.

## Vérifications

```sh
npm run format:check
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run test:catalog
npm run test:research
npm run seed:check
npm run catalog:audit
```

`npm run format` harmonise les fichiers source, styles, scripts et documents. Les sorties de compilation, rapports, verrous et fichiers générés sont exclus.

Le bridge PHP est également formaté. [Le suivi des dépendances](DOCS/DEPENDENCIES.md) distingue l’audit de production et les alertes restantes dans les outils de mesure.

Les tests du catalogue construisent des fixtures fictives dans `.next-catalog-test`, séparément de la production. Ils ne certifient pas les paiements réels. [Le compte rendu de validation](DOCS/VALIDATION.md) précise les résultats et les vérifications encore nécessaires.

Les tests de l’aperçu recherché construisent `.next-research-test` et contrôlent les filtres immédiats, les références, la recherche locale, le paiement fermé et la disposition ordinateur/mobile.

Après construction de l’aperçu, `npm run lhci:research` mesure trois fois l’accueil, une catégorie peuplée et une fiche avec photo. Le contrôle refuse une construction sans données de recherche ; les rapports restent dans `lighthouse-research-reports`. Utiliser `CHROME_PATH` pour choisir le Chromium isolé de mesure.

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
