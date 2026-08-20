// albatre — découverte automatique des coupes géologiques.
//
// coupes.json contient la liste ORDONNÉE des fiches (ordre géographique
// ouest → est, Seine vers Somme). Pour chaque entrée, on va chercher le
// fichier coupe.json déposé à la racine du dépôt/URL de la fiche
// (généré par l'app terrain lors de l'export du circuit).

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
      nb_points: data.nb_points ?? null
    };
  } catch (err) {
    console.warn('Fiche ignorée :', entree.url, err);
    return null;
  }
}

function construireCarte(coupe) {
  const a = document.createElement('a');
  a.className = 'coupe-card';
  a.href = coupe.url;
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
