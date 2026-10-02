# Configuration EDoctor

## Architecture

Next.js conserve le Pages Router. Apollo interroge WPGraphQL et WooGraphQL côté serveur pour les produits publiés, variantes et articles. WordPress reste la source des prix, stocks et commandes. Le plugin `wordpress/edoctor-bridge` ajoute les métadonnées GraphQL EDoctor ; son endpoint REST signé sert uniquement au formulaire de conseil.

Les pages publiques utilisent ISR avec un délai de secours de cinq minutes. Le plugin demande une revalidation après modification. Panier, compte et transfert de paiement portent des en-têtes privés sans cache partagé. Le panier local n'est jamais une autorité pour le prix : WooCommerce reconstruit ses lignes et recalcule stock, fiscalité, livraison et total.

Meilisearch est un index de recherche public dérivé du catalogue GraphQL, pas un second catalogue commercial. Le worker remplace l'index par échange atomique et réessaie après un échec. Ne lancer qu'un worker par index.

## Installation de test

1. Copier `.env.example` vers `.env.local`, sans versionner de secrets. Renseigner `GRAPHQL_URL`, `WORDPRESS_URL`, `SITE_URL` et les paramètres publics. `SITE_URL` doit être l'origine exacte du navigateur, protocole et port compris.
2. Installer WooCommerce, WPGraphQL, WooGraphQL et le plugin EDoctor sur un WordPress de test. Vérifier la compatibilité de leurs versions et du champ `Product.edoctorDetails` dans l'éditeur GraphQL.
3. Créer les quatorze catégories avec les slugs de `src/edoctor/model.ts`. Créer les attributs Marque, Gamme, Usage et les attributs techniques homogènes. Le Guide ED a été retiré.
4. Configurer une page de paiement WooCommerce classique avec le shortcode `[woocommerce_checkout]`. L'intégration du paiement accompagné aux blocs Checkout n'est pas fournie. Utiliser des comptes et passerelles de test.
5. Ajouter dans `wp-config.php`, avant la fin de configuration, des constantes `EDOCTOR_CHECKOUT_SECRET`, `EDOCTOR_REVALIDATE_SECRET`, `EDOCTOR_STOREFRONT_URL`, `EDOCTOR_COMMERCE_READY` et `EDOCTOR_EXPORT_READY`. Les secrets doivent correspondre à ceux du serveur Next.js ; garder les deux drapeaux à `false` jusqu'à validation commerciale.
6. Exécuter `npm ci`, `npm run build`, `npm test`, puis `npm run test:e2e`. Le dernier contrôle démarre sa propre version compilée sur le port 3107, sans backend commercial.

Le transfert de panier utilise un jeton HMAC court et à usage unique, envoyé par formulaire POST vers WordPress. Il ne transporte aucun prix client. HTTPS est requis en production. Le mode accompagné crée une commande en attente ; il ne confirme jamais un règlement BaridiMob/BaridiWeb.

## Paramètres et clés

### Catalogue préparatoire

Les 45 références documentées dans `catalog/research` restent un travail de préparation. Elles ne sont plus injectées comme aperçu commercial. `npm run catalog:audit` bloque l’export tant que les identités, photos autorisées, prix et disponibilité restent incomplets. Le design se vérifie avec `npm run test:catalog`, sans modifier WooCommerce.

### Configuration commerciale

`NEXT_PUBLIC_*` et `IMAGE_HOSTS` sont intégrés pendant la construction : reconstruire l'image après modification. `IMAGE_HOSTS` contient les hôtes HTTPS des photos séparés par des virgules. Les secrets et URL serveur sont fournis à l'exécution.

La clé Meilisearch exposée au navigateur n'autorise que `search` sur `products`. La clé du worker autorise les opérations d'indexation, réglages, statistiques, tâches et échange (`indexes.swap`) sur `products` et `products_build_*`. La clé maître reste dans le service Meilisearch. Restreindre les clés, servir la recherche en HTTPS, ne jamais compiler une clé maître ou d'indexation dans Next.js. Voir les [droits des clés](https://specs.meilisearch.dev/specifications/text/0085-api-keys.html) et [l'échange d'index](https://www.meilisearch.com/blog/zero-downtime-index-deployment).

## Docker et Coolify

Le Dockerfile produit un serveur standalone exécuté sans privilèges avec contrôle de santé. `compose.yaml` décrit le storefront, Meilisearch et le worker avec volumes persistants. Le moteur Docker doit être disponible pour vérifier localement la construction et le démarrage.

Le workflow `edoctor-release.yml` vérifie le projet puis publie dans GHCR une image portant le SHA du commit. Le job de déploiement attend l'environnement GitHub `production` : y activer les reviewers requis. Renseigner les variables publiques de construction et les secrets `COOLIFY_API_URL`, `COOLIFY_TOKEN`, `COOLIFY_RESOURCE_UUID` et `COOLIFY_SEARCH_WORKER_UUID`. Les deux UUID doivent désigner des applications Coolify de type Docker Image, qui acceptent `docker_registry_image_tag` : storefront et worker. Voir [l'API officielle](https://coolify.io/docs/api/endpoints/applications/update-application-by-uuid).

Configurer le worker avec la commande `node scripts/sync-search.mjs --watch`, sans domaine public et sans contrôle de santé HTTP du storefront. Lui fournir les variables serveur de recherche, le volume `.sync-state` inscriptible par l'UID 1001, et l'accès réseau privé au service Meilisearch. Le workflow met à jour les deux références d'image avant de demander leur redéploiement. WordPress demeure sur son hébergement actuel.

`compose.yaml` reste une alternative de stack complet : sa mise à jour consiste à définir `STOREFRONT_IMAGE` au même SHA puis redéployer le stack dans Coolify. Ne pas utiliser un UUID de service Compose avec le job d'API d'application fourni. Choisir l'une de ces deux topologies avant activation du déploiement automatique.

Pour un retour arrière, conserver le SHA ou digest de la version précédente, modifier la référence d'image et redéployer. Une régression de schéma WordPress ou de Meilisearch nécessite aussi une procédure compatible avec leurs données ; un retour d'image seul ne restaure pas les bases.

## Sauvegarde et restauration

Sauvegarder la base WordPress, ses médias et sa configuration suivant la procédure de l'hébergeur. Exporter les snapshots/dumps Meilisearch hors du volume, avec accès limité et rétention définie. Le snapshot quotidien sur le même disque n'est pas une sauvegarde indépendante. Tester la restauration sur une instance isolée ; une restauration de version différente doit suivre la procédure officielle de Meilisearch. Le cache Next.js et l'état du worker sont reconstructibles à partir de WordPress.

## À renseigner avant ouverture

- Identité légale, SIREN/SIRET, TVA, adresse et coordonnées de contact ; responsable des données et durée de conservation des demandes.
- Domaines, accès hébergement, WordPress de test, versions plugins, adresse de compte client et hôtes médias.
- Prix de vente HT, procédure fiscale d'export et preuves requises, stock réel, fournisseurs et autorisations d'images.
- Transporteur, destinations couvertes, tarif tout compris, frais éventuels, délais vérifiables et procédure douanière.
- Passerelle carte et mode test, compte de virement, processus accompagné BaridiMob/BaridiWeb et preuve de confirmation du règlement.
- Conditions de vente, garanties, retours, frais et traitement des litiges, validés pour la procédure réellement utilisée.

Sans tarif d'export confirmé, garder `EDOCTOR_EXPORT_READY=false` : demande accompagnée avant encaissement. Ne pas assimiler le tarif technique « sur devis » à une livraison gratuite. Les pages légales provisoires ne suffisent pas à ouvrir commercialement.
