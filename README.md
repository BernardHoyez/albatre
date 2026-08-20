# Albâtre

Catalogue statique présentant une succession de coupes géologiques dans les
falaises de craie de la Côte d'Albâtre (Seine → Somme). Déployé sur GitHub
Pages : `bernardhoyez.github.io/albatre`.

## Principe

Contrairement à `falaises-de-craie` ou `rollevillerando`, **le contenu de
chaque fiche n'est pas hébergé dans ce dépôt**. Chaque fiche (coupe) est un
paquet complet exporté par l'app [terrain](https://bernardhoyez.github.io/terrain),
déployé sur son propre dépôt/URL (par ex. `bernardhoyez.github.io/spots-etretat`).

Ce site `albatre` n'est qu'un **catalogue** : il liste les URLs de ces fiches
et va chercher leurs métadonnées à distance pour construire les vignettes.

## Ajouter une nouvelle coupe

1. Déployer le paquet exporté par terrain sur son propre dépôt/URL. Ce paquet
   doit contenir, à sa racine, un fichier `coupe.json` (voir format ci-dessous)
   et l'image de vignette qu'il référence.
   *(Pour l'instant cette génération automatique n'existe pas encore côté
   terrain — voir la section « À faire » plus bas. En attendant, `coupe.json`
   peut être rédigé/copié à la main dans le paquet déployé.)*
2. Dans `coupes.json`, ajouter une entrée `{ "url": "https://.../" }` pointant
   vers cette fiche, **à la bonne place dans la liste** : les fiches sont
   affichées dans l'ordre du fichier, qui doit rester géographique
   (ouest → est, de la Seine vers la Somme).
3. Committer et pousser. Le site va chercher `coupe.json` à chaque
   chargement, aucune autre action n'est nécessaire.

## Format de `coupe.json`

Déposé à la racine de chaque fiche externe :

```json
{
  "titre": "Falaise d'Amont — La Manneporte",
  "secteur": {
    "point_ouest": "Plage d'Étretat",
    "point_est": "Chemin des Douaniers, La Manneporte"
  },
  "vignette": "vignette.jpg",
  "date": "2026-08-19",
  "nb_points": 12,
  "url_visite": "https://bernardhoyez.github.io/spots-etretat/"
}
```

- `vignette` est un chemin **relatif à la racine de la fiche**.
- `secteur` correspond aux deux points remarquables délimitant le tronçon
  (généralement deux accès à la mer).
- Une fiche dont `coupe.json` est absent ou inaccessible (CORS, 404) est
  simplement ignorée par le catalogue — sans faire échouer l'affichage des
  autres.

## Contrainte technique : CORS

Le catalogue lit `coupe.json` par un `fetch()` cross-origin. GitHub Pages
sert ses fichiers avec des en-têtes CORS ouverts par défaut, donc une fiche
hébergée sur `*.github.io` fonctionne sans configuration supplémentaire. Si
une fiche est un jour hébergée ailleurs, vérifier que la plateforme autorise
les requêtes cross-origin sur les fichiers statiques.

## Exemple fourni

`coupes/exemple-etretat/` est une fiche factice livrée avec le site pour
démonstration (à supprimer, ou à laisser en fin de liste, une fois de vraies
coupes ajoutées). Elle contient un `coupe.json`, une vignette et une page de
secours minimale.

## Déploiement (GitHub Pages)

1. Créer le dépôt `albatre` sur GitHub.
2. Pousser l'ensemble de ces fichiers sur la branche par défaut.
3. Dans Settings → Pages, activer GitHub Pages sur cette branche (dossier
   racine).
4. Le site est servi sur `bernardhoyez.github.io/albatre`.

## À faire (chantier séparé, côté app terrain)

L'onglet « Générer un circuit » de terrain doit être complété pour générer
automatiquement, dans le paquet exporté :
- un fichier `coupe.json` (titre, secteur, vignette, date, nb de points),
- la vignette elle-même,

sur le modèle du `<dossier>.json` déjà produit par le paquet Déploiement de
geotour. Cela évitera la rédaction manuelle de `coupe.json` pour chaque
nouvelle fiche.

## Service worker

`sw.js` suit le pattern « brise-cache » standard (voir skill
`pwa-sw-brise-cache`) : `CACHE_NAME` versionné, purge des anciens caches à
l'activation, activation immédiate. Penser à incrémenter `CACHE_NAME` à
chaque modification d'un fichier statique du site (HTML/CSS/JS/manifest).
`coupes.json` et les `coupe.json` distants ne sont volontairement jamais mis
en cache par le service worker : ils doivent toujours refléter l'état actuel
du catalogue et des fiches.
