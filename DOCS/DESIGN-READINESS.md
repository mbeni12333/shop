# EDoctor — bilan du design et de la préparation au lancement

État vérifié le 2 octobre 2026. L’interface est implémentée et les parcours locaux passent les tests fonctionnels. Le lancement commercial reste à valider : les performances mobiles n’atteignent pas encore les objectifs du projet et les services commerciaux réels ne sont pas configurés dans cet environnement.

## Interface livrée

- Tokens partagés pour palette, typographie, espacements, rayons, contrôles de 48 px, icônes et durées. Composants shadcn/Radix adaptés à la direction violette EDoctor, avec états de focus, sélection, chargement, erreur et indisponibilité.
- Référence interne `/interne/design-system`, exclue de la navigation publique, du sitemap et de l’indexation.
- NavigationMenu sur ordinateur ; Sheet et Accordion sous 1280 px, fermeture après navigation et restauration du focus. En-tête stable et recherche globale unique avec suggestions, clavier et fermeture par Échap.
- Guide, breadcrumb visible, recherche catalogue redondante et aperçu « Sélection en préparation » retirés. Les catégories et données produit viennent de WooCommerce.
- Cartes produit uniformes : photographie disponible, titre, deux caractéristiques, prix HT et disponibilité fournis par la source. Aucune donnée commerciale inconnue n’est inventée.
- Filtres React InstantSearch personnalisés : Accordion, cases et compteurs, recherche et expansion des longues listes, budget à deux poignées et champs synchronisés, badges supprimables, tri et état conservés dans l’URL et l’historique. Sheet mobile avec critères immédiats et bouton fixe de retour aux résultats. Les filtres restent montés à la fermeture du panneau.
- Valeurs combinées avec OU dans un groupe et ET entre groupes ; conservation des sélections à compteur nul. Résultats conservés pendant l’actualisation, état de service indisponible distinct du catalogue vide et de l’absence de résultat.
- GSAP avec nettoyage et réduction des mouvements : assemblage du matériel en 800 ms, réaction au pointeur sur ordinateur, découverte des sections, transitions courtes des résultats et confirmation du panier. Actions du hero utilisables immédiatement. SVG écran corrigé et composition régénérée.
- Événements locaux anonymes de recherche, ouverture produit, filtres et ajout au panier, uniquement après consentement. Aucun collecteur distant ni mesure de conversion ne sont activés.
- Synchronisation WooCommerce → Meilisearch : construction d’un index temporaire, contrôle des tâches et échange atomique pour conserver l’index existant en cas d’échec.

## Validation obtenue

TypeScript, formatage, constructions de production et du catalogue de test, syntaxe PHP : réussis. **27 tests unitaires et 48 tests navigateur réussis**. Deux scénarios sont volontairement exclus sur les projets où ils répètent le balayage responsive ou exigent le menu ordinateur.

Vérification responsive à 390, 768, 1024 et 1440 px : navigation, recherche, filtres, cartes, fiches et panier ; clavier, réduction des mouvements, changements de route, URL et historique. Aucun débordement horizontal observé dans ces scénarios. Vérification manuelle finale dans le navigateur : filtre Socket AM5 sur mobile, trois résultats et badge conservés après fermeture du panneau ; composition complète du hero à 1440 px.

Le jeu représentatif contient sept produits fictifs, simples et variables, et trois catégories. Il vérifie les prix, les attributs multivalués, les sélections multiples, le panier et les états d’erreur. L’adaptateur officiel Meilisearch est testé avec réponses HTTP simulées, y compris une panne. Cela ne certifie pas un serveur Meilisearch réel, les grandes listes d’attributs, les photographies réelles ou les plugins WooCommerce de production.

### Trois mesures mobiles par page

Mesures Lighthouse locales sur la construction de production du catalogue fictif, sans photographies produit, avec Chromium et profil mobile. Les seuils restent performance ≥ 90, LCP ≤ 2 500 ms et CLS ≤ 0,1.

| Page      | Scores des trois passages | Score médian | LCP médian |
| --------- | ------------------------- | ------------ | ---------- |
| Accueil   | 69 / 77 / 70              | 70           | 3 455 ms   |
| Catégorie | 56 / 58 / 58              | 58           | 4 337 ms   |
| Produit   | 64 / 67 / 71              | 67           | 3 762 ms   |

Accessibilité, bonnes pratiques et SEO : 100 sur les neuf passages. CLS entre 0 et 0,004. **Les assertions performance et LCP échouent** ; les seuils n’ont pas été abaissés. Les chargements différés de la recherche et de l’adaptateur réduisent le travail initial, mais ne suffisent pas. Ces mesures ne remplacent pas un appareil réel, un audit manuel complet d’accessibilité ou une mesure de conversion.

Rapports locaux : `lighthouse-catalog-reports/` ; assertions : `.lighthouseci/assertion-results.json`. Reproduction : `node scripts/test-catalog.mjs --measure`.

## Travail restant, dans l’ordre

1. Réduire le coût initial de rendu et d’hydratation ; mesurer à nouveau les trois pages avec les mêmes seuils, puis avec les photos du catalogue réel.
2. Configurer le staging WooCommerce et Meilisearch, synchroniser le catalogue publié et vérifier les changements de prix, stock et attributs, les grandes listes de facettes, la panne et la récupération du service. Les URLs et clés commerciales locales sont actuellement absentes.
3. Finaliser les 45 brouillons après stabilisation visuelle. L’audit actuel donne **0 référence importable et 45 bloquées** : prix de vente HT et disponibilité manquants pour les 45, photographie exacte autorisée manquante pour 43, GTIN manquant pour 39. Aucun CSV commercial ni import WooCommerce n’a été effectué.
4. Valider le parcours WooCommerce réel, les variantes, la session panier et le paiement en sandbox, puis confirmer les informations commerciales et d’export nécessaires à l’ouverture.
5. Raccorder un outil de mesure au consentement du site et évaluer la conversion après lancement. Aucune amélioration de conversion n’est présumée.

Aucun déploiement, import commercial ou paiement réel n’a été effectué pendant cette intervention.
