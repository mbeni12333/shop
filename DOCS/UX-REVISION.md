# Révision UX — 2 octobre 2026

## Interface

- Recherche inline shadcn Command : saisie directe, suggestions ancrées sous le champ, flèches/Entrée, Échap, fermeture au clic extérieur. Aucun dialogue modal. L’état accessible ouvert/fermé suit réellement la liste.
- En-tête sur une ligne sur petit écran, contrôles de 48 px, panier accessible et suppression des bordures imbriquées. Navigation orientée univers, composants, périphériques, PC, offres et conseil ; livraison accessible dans le contenu et le pied de page.
- Quatorze univers SVG dans l’aperçu de configuration ; dès que WooGraphQL expose le catalogue, les catégories WooCommerce remplacent cette présentation. Une panne réseau continue de remonter comme erreur et ne remplace pas un catalogue connecté par cet aperçu.
- Cartes shadcn plus compactes, deux colonnes sur mobile et quatre sur ordinateur. Hero raccourci, sélection immédiatement après le hero, aide d’ED placée après l’exploration des équipements.
- Assemblage GSAP expressif du matériel, courte suspension des éléments, cartes qui apparaissent en groupe et illustrations réactives au pointeur/focus. Réduction des mouvements respectée.
- Parcours SVG animé en boucle : commande, préparation, Colissimo International, réception en Algérie. Pause/reprise disponible ; animation suspendue hors écran. Le délai confirmé par l’utilisateur est présenté comme **4 jours ouvrés estimés après remise à Colissimo International**, distinct du temps de préparation.
- `/offres` et sélection d’accueil utilisent uniquement les promotions déclarées par WooCommerce, avec prix connu, stock et achat disponibles. Le bridge fournit `onSale` et `publishedAt`. Sans promotion, l’accueil propose les produits publiés ou les univers ; aucun prix ni pourcentage de remise n’est inventé.

## Connexion WordPress

Le fichier d’environnement de l’utilisateur est pris en compte, sans modification ni affichage des identifiants. L’endpoint répond en HTTP 200 mais rejette `products` et `productCategories` : WPGraphQL est présent, WooGraphQL manque, ce que l’utilisateur a confirmé.

Pour exposer le catalogue à cette boutique :

1. Installer et activer **WPGraphQL for WooCommerce / WooGraphQL**, en complément de WooCommerce et WPGraphQL. [Documentation officielle](https://woographql.com/docs).
2. Installer et activer le plugin du dossier `wordpress/edoctor-bridge`, qui expose les prix HT, attributs, variantes et promotions.
3. Revalider les catégories et fiches réelles, puis synchroniser Meilisearch. Les clés REST WooCommerce ne remplacent pas l’extension GraphQL dans cette architecture.

L’introspection publique n’a pas été activée ; la détection utilise une lecture publique minimale du catalogue. Aucune installation distante, écriture WooCommerce, commande réelle ou import n’a été effectué.

## Validation

29 tests unitaires et 50 tests navigateur passent : 28 sur le catalogue fictif et 22 sur les pages publiques (deux autres scénarios exclus selon le viewport). Ils couvrent notamment les offres, la pause du schéma, la recherche inline, les URL/historique des filtres, les fiches simples et variables, l’ajout au panier, les quantités et la persistance. TypeScript, formatage, constructions et syntaxe PHP passent. Les données commerciales réelles et le paiement restent à valider après activation des extensions.

Les mesures Lighthouse du bilan précédent concernent l’ancienne composition ; elles ne certifient pas les performances de cette révision.
