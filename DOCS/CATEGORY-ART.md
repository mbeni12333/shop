# Illustrations des catégories

Les quatorze univers utilisent les SVG de `public/univers/vector`, partagés entre l’accueil, la page des catégories, les pages de catégorie et les menus de navigation. La mascotte n’est pas une icône de catégorie.

Les illustrations écran et carte graphique reprennent le design system HTML fourni. Les douze autres reprennent ses formes pleines, sa palette gris/violet, ses détails matériels et son ombre au sol. Ce sont des illustrations éditoriales, pas des photographies de références vendues.

Conserver le matériel entier dans le `viewBox`, sans recadrage. Les composants utilisent `object-contain` et les menus réservent une surface de 80 × 64 px à chaque illustration. Garder les petits pictogrammes pour les commandes de navigation.

## Revue locale

`node scripts/vector-review.mjs` produit une galerie des quatorze SVG. Avec `VISIBLE_REVIEW=1`, une fenêtre Chromium isolée reste ouverte pour inspection. `node scripts/navigation-review.mjs` contrôle aussi les menus sur ordinateur et mobile avec l’aperçu local sur le port 3108.

Vérification du 1 octobre 2026 : galerie examinée, contrôle des menus ordinateur/mobile réussi, construction de production réussie et 14 tests unitaires réussis. Le connecteur Browser intégré étant indisponible (`Transport closed`), la revue visible utilise Chromium dans un contexte neuf, sans profil personnel.
