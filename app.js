// albatre — découverte automatique des coupes géologiques.
//
// coupes.json contient la liste ORDONNÉE des fiches (ordre géographique
// ouest → est, Seine vers Somme). Pour chaque entrée, on va chercher le
// fichier coupe.json déposé à la racine du dépôt/URL de la fiche
// (généré par l'app terrain lors de l'export du circuit).

// URL de l'app terrain, qui seule sait charger/afficher un paquet de circuit
// (le paquet lui-même n'est que des données : waypoints.json, manifest.json,
// photos/, mbtiles/… — pas de page web à ouvrir directement).
const TERRAIN_APP_URL = 'https://bernardhoyez.github.io/terrain/';

const container = document.getElementById('coupes');
const loadingMsg = document.getElementById('loading-msg');

async function chargerCoupes() {
  let liste;
  try {
    const res = await fetch('coupes.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('coupes.json introuvable');
    liste = await res.json();
  } catch (err) {
    afficherErreur("Impossible de charger la liste des coupes (coupes.json).");
    console.error(err);
    return;
  }

  if (!Array.isArray(liste) || liste.length === 0) {
    afficherVide();
    return;
  }

  const resultats = await Promise.all(liste.map(chargerUneCoupe));
  const coupesValides = resultats.filter(Boolean);

  loadingMsg?.remove();

  if (coupesValides.length === 0) {
    afficherVide();
    return;
  }

  coupesValides.forEach((coupe) => container.appendChild(construireCarte(coupe)));
  construireCarteSituation(coupesValides);
}

async function chargerUneCoupe(entree) {
  // entree.url = URL de base de la fiche (dépôt externe ou dossier local),
  // avec ou sans slash final.
  const base = entree.url.endsWith('/') ? entree.url : entree.url + '/';
  try {
    const res = await fetch(base + 'coupe.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`coupe.json introuvable pour ${base}`);
    const data = await res.json();
    return {
      url: entree.url,
      titre: data.titre || 'Coupe sans titre',
      secteur: data.secteur || null,
      vignette: data.vignette ? base + data.vignette : null,
      date: data.date || null,
      nb_points: data.nb_points ?? null,
      lat: typeof data.lat === 'number' ? data.lat : null,
      lon: typeof data.lon === 'number' ? data.lon : null
    };
  } catch (err) {
    console.warn('Fiche ignorée :', entree.url, err);
    return null;
  }
}

function construireCarte(coupe) {
  const a = document.createElement('a');
  a.className = 'coupe-card';
  a.href = /^https?:\/\//i.test(coupe.url)
    ? TERRAIN_APP_URL + '?circuit=' + encodeURIComponent(coupe.url)
    : coupe.url;
  a.target = '_blank';
  a.rel = 'noopener';

  const thumb = document.createElement('div');
  thumb.className = 'coupe-thumb';
  if (coupe.vignette) {
    const img = document.createElement('img');
    img.src = coupe.vignette;
    img.alt = '';
    img.loading = 'lazy';
    thumb.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'no-thumb';
    span.textContent = 'Pas de vignette';
    thumb.appendChild(span);
  }

  const body = document.createElement('div');
  body.className = 'coupe-body';

  if (coupe.secteur && (coupe.secteur.point_ouest || coupe.secteur.point_est)) {
    const secteur = document.createElement('p');
    secteur.className = 'coupe-secteur';
    secteur.textContent = `${coupe.secteur.point_ouest || '?'} → ${coupe.secteur.point_est || '?'}`;
    body.appendChild(secteur);
  }

  const titre = document.createElement('h3');
  titre.className = 'coupe-title';
  titre.textContent = coupe.titre;
  body.appendChild(titre);

  const meta = document.createElement('p');
  meta.className = 'coupe-meta';
  const parts = [];
  if (coupe.date) parts.push(formaterDate(coupe.date));
  if (coupe.nb_points !== null) parts.push(`${coupe.nb_points} points`);
  meta.textContent = parts.join(' · ');
  if (parts.length) body.appendChild(meta);

  a.appendChild(thumb);
  a.appendChild(body);
  return a;
}

function construireCarteSituation(coupes) {
  const mapEl = document.getElementById('carte');
  if (!mapEl || typeof L === 'undefined') return;

  const coupesGeolocalisees = coupes.filter((c) => c.lat !== null && c.lon !== null);
  if (coupesGeolocalisees.length === 0) {
    mapEl.remove();
    return;
  }

  const map = L.map('carte', { scrollWheelZoom: false }).setView([49.85, 0.7], 10);

  // Fond IGN Géoplateforme, sans clé : estompage (relief niveaux de gris,
  // sans toponymie) + trait de côte. Rendu d'origine, non retouché — testé
  // avec plusieurs filtres CSS (contraste/luminosité/saturation) et aucun
  // n'a fait mieux que la tuile IGN telle quelle.
  L.tileLayer(
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
    '&LAYER=IGNF_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW&STYLE=normal' +
    '&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    { attribution: 'Fond : IGN — Géoplateforme (estompage)', maxZoom: 17, minZoom: 6 }
  ).addTo(map);

  L.tileLayer(
    'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
    '&LAYER=ELEVATION.LEVEL0&STYLE=normal' +
    '&FORMAT=image/png&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
    { attribution: 'Trait de côte IGN', maxZoom: 18, minZoom: 6, opacity: 0.9 }
  ).addTo(map);

  const points = [];
  coupesGeolocalisees.forEach((coupe) => {
    const marqueur = L.circleMarker([coupe.lat, coupe.lon], {
      radius: 8, color: '#fff', weight: 2, fillColor: '#A05A34', fillOpacity: 1
    }).addTo(map);

    const lien = /^https?:\/\//i.test(coupe.url)
      ? TERRAIN_APP_URL + '?circuit=' + encodeURIComponent(coupe.url)
      : coupe.url;

    const metaParts = [];
    if (coupe.date) metaParts.push(formaterDate(coupe.date));
    if (coupe.nb_points !== null) metaParts.push(`${coupe.nb_points} points`);

    marqueur.bindPopup(
      `<div class="carte-tip"><strong>${coupe.titre}</strong><br>` +
      `${metaParts.join(' · ')}<br>` +
      `<a href="${lien}" target="_blank" rel="noopener">Ouvrir la fiche →</a></div>`,
      { closeButton: true, autoClose: true, closeOnClick: true }
    );

    points.push([coupe.lat, coupe.lon]);
  });

  if (points.length > 1) {
    map.fitBounds(L.latLngBounds(points), { padding: [30, 30] });
  } else if (points.length === 1) {
    map.setView(points[0], 12);
  }
}

function formaterDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return iso;
  }
}

function afficherVide() {
  container.innerHTML = '<p class="empty">Aucune coupe publiée pour le moment.</p>';
}

function afficherErreur(msg) {
  container.innerHTML = `<p class="error">${msg}</p>`;
}

chargerCoupes();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW non enregistré :', err));
  });
}
