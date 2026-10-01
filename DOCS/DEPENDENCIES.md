# Dépendances et audit du 1 octobre 2026

Le contrôle **en ligne** après mise à jour constate zéro vulnérabilité connue dans les dépendances de production (`npm audit --omit=dev --audit-level=high`). Ce contrôle est intégré à la CI avant les constructions publiées. Un résultat d’audit hors ligne ne prouve pas l’absence d’alertes actuelles.

Next.js est passé de 16.2.12 à 16.3.8 après identification des [alertes du serveur Windows](https://github.com/advisories/GHSA-p293-qw3h-jr36), de [l’optimisation AVIF](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4) et de [ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j). Le verrou npm est actualisé. Aucun changement n’est appliqué au verrou pnpm historique préexistant.

Deux correctifs ciblés concernent les outils de mesure : `tmp` ≥0.2.6 et `uuid` ≥11.1.1 sous Lighthouse CI. Ils ne nécessitent pas la rétrogradation forcée de Lighthouse proposée par npm. Voir les avis [tmp](https://github.com/advisories/GHSA-ph9p-34f9-6g65) et [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq).

## Alerte restante dans les outils de développement

L’audit complet affiche encore six paquets de gravité élevée, qui remontent tous à `extract-zip` ≤2.0.1 via Lighthouse/Puppeteer : `extract-zip`, `@puppeteer/browsers`, `puppeteer-core`, `lighthouse`, `@lhci/utils` et `@lhci/cli`. L’[avis de traversée par liens symboliques](https://github.com/advisories/GHSA-7pqw-9j4j-h8q3) ne propose pas de version corrigée au moment du contrôle. Ils sont des dépendances de développement ; ce constat n’est pas un audit intégral réussi.

Les mesures locales utilisent le Chromium Playwright déjà installé, indiqué par `CHROME_PATH`, et aucun téléchargement ou extraction d’archive fournie par un utilisateur. Les installations CI utilisent `--ignore-scripts`. Ne pas utiliser l’outil d’extraction sur des archives non fiables. Une correction amont, ou un remplacement testé de cette chaîne d’outillage, reste nécessaire pour supprimer toutes les alertes de développement.

## Formatage PHP

`@prettier/plugin-php` est une dépendance de développement. La configuration du dépôt couvre les fichiers PHP purs, avec une cible syntaxique de formatage 7.4 et une indentation de quatre espaces. Cela ne certifie pas les versions de WordPress, WooCommerce ou PHP en production. La syntaxe du bridge est contrôlée séparément avec `php -l` ; les paiements exigent toujours des tests sur WordPress de staging.
