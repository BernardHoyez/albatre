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

1. Générer le paquet du circuit dans l'app terrain (onglet 🛠️ Générer un
   circuit) — `coupe.json` et la vignette sont produits automatiquement,
   à la racine du paquet. Vérifier/ajuster les champs **Point ouest / Point
   est** avant de générer (voir le README de terrain).
2. Déployer ce paquet sur son propre dépôt/URL.
3. Dans `coupes.json`, ajouter une entrée `{ "url": "https://.../" }` pointant
   vers cette fiche, **à la bonne place dans la liste** : les fiches sont
   affichées dans l'ordre du fichier, qui doit rester géographique
   (ouest → est, de la Seine vers la Somme).
4. Committer et pousser. Le site va chercher `coupe.json` à chaque
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
  "lat": 49.7062,
  "lon": 0.2044,
  "vignette": "vignette.jpg",
  "date": "2026-08-19",
  "nb_points": 12,
  "url_visite": "https://bernardhoyez.github.io/spots-etretat/"
}
```

- `lat`/`lon` sont les coordonnées du 1er waypoint du circuit, extraites
  automatiquement par terrain lors de la génération du paquet — utilisées
  pour placer un marqueur sur la carte de situation. Une fiche sans ces
  champs (ancien paquet généré avant cette évolution) reste affichée dans
  la grille mais n'apparaît simplement pas sur la carte.
- `vignette` est un chemin **relatif à la racine de la fiche**.
- `secteur` correspond aux deux points remarquables délimitant le tronçon
  (généralement deux accès à la mer).
- Une fiche dont `coupe.json` est absent ou inaccessible (CORS, 404) est
  simplement ignorée par le catalogue — sans faire échouer l'affichage des
  autres.

## Carte de situation

Une carte (fond IGN Géoplateforme — estompage en niveaux de gris + trait de
côte, sans toponymie, gratuit et sans clé) affiche un marqueur par coupe
géolocalisée. Clic sur un marqueur → pop-up avec le titre et un lien vers la
fiche (même mécanisme que les vignettes, voir « Lien de la fiche »
ci-dessous). Le rendu du fond est volontairement laissé tel quel : plusieurs
filtres CSS (contraste/luminosité/saturation) ont été testés et aucun n'a
amélioré la lisibilité par rapport à la tuile IGN d'origine.

## Lien de la fiche

Le paquet exporté par terrain n'est que des données (`waypoints.json`,
`manifest.json`, `photos/`…), sans page web propre. Le catalogue fait donc
pointer chaque vignette vers l'app terrain elle-même, avec le circuit en
paramètre :

```
https://bernardhoyez.github.io/terrain/?circuit=<url encodée de la fiche>
```

(Exception : la fiche de démonstration locale `coupes/exemple-etretat/`,
qui a sa propre page statique et reste donc liée directement — voir
`app.js`, `TERRAIN_APP_URL`.)

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

## Statut

`coupe.json` (et sa vignette) est généré automatiquement par l'app terrain
depuis l'onglet 🛠️ Générer un circuit — plus besoin de rédaction manuelle.
Confirmé en production avec la fiche Mesnil-Val/Criel.

## Service worker

`sw.js` suit le pattern « brise-cache » standard (voir skill
`pwa-sw-brise-cache`) : `CACHE_NAME` versionné, purge des anciens caches à
l'activation, activation immédiate. Penser à incrémenter `CACHE_NAME` à
chaque modification d'un fichier statique du site (HTML/CSS/JS/manifest).
`coupes.json` et les `coupe.json` distants ne sont volontairement jamais mis
en cache par le service worker : ils doivent toujours refléter l'état actuel
du catalogue et des fiches.
