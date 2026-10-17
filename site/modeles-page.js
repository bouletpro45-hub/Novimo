/* =========================================================
   MODELES-PAGE.JS — la page "Modèles"
     1. les filtres (format, usage, durée, prix) et le tri
     2. la grille : les aperçus ne tournent que quand on les voit
     3. l'éditeur : textes, couleurs, police, format -> aperçu en direct
     4. "Commander" -> la page devis, déjà remplie
   Le catalogue est dans modeles.js, les prix dans reglages.js.
   ========================================================= */

const RATIOS = { vertical: '9:16', carre: '1:1', paysage: '16:9' };
const NOMS_SYMBOLES_MODELES = { etoile: 'Étoile', ciseaux: 'Ciseaux', 'lune-ble': 'Lune et blé', aucun: 'Aucun' };
const tarifDe = (m) => (R.tarifs || []).find((t) => t.id === m.tarif) || { prix: 0, nom: '' };
const prixDe = (m) => tarifDe(m).prix;
const $m = (id) => document.getElementById(id);

/* L'adresse de l'animation avec les réglages du client */
function adresseModele(m, format, reglages) {
  const p = new URLSearchParams({ integre: '1', format });
  Object.entries(m.fixe || {}).forEach(([k, v]) => p.set(k, v));
  Object.entries(reglages.textes || {}).forEach(([k, v]) => p.set(k, v));
  const pal = PALETTES_MODELES[reglages.palette];
  if (pal) ['fond', 'fond2', 'accent', 'texte', 'texteDoux'].forEach((k) => p.set(k, pal[k]));
  if (reglages.police) p.set('police', reglages.police);
  if (reglages.symbole) p.set('symbole', reglages.symbole);
  return m.fichier + '?' + p.toString();
}
const reglagesDepart = (m) => ({ textes: Object.assign({}, m.textes), palette: m.palette, police: '', symbole: (m.textes || {}).symbole || '' });

/* ---------- 1. Les filtres ---------- */
const filtre = { format: '', categorie: '', style: '', duree: '', prix: '', tri: 'populaires' };

$m('filtre-categorie').innerHTML = ['Tous'].concat(CATEGORIES_MODELES).map((c, i) =>
  '<button type="button" data-categorie="' + (i ? esc(c) : '') + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + esc(c) + '</button>').join('');

function choisirBouton(zone, bouton) {
  zone.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === bouton ? 'true' : 'false'));
}
$m('filtre-format').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('filtre-format'), b); filtre.format = b.dataset.format; afficherGrille();
});
$m('filtre-style').innerHTML = ['Tous les styles'].concat(STYLES_MODELES).map((c, i) =>
  '<button type="button" data-style="' + (i ? esc(c) : '') + '" aria-pressed="' + (i ? 'false' : 'true') + '">' + esc(c) + '</button>').join('');
$m('filtre-style').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('filtre-style'), b); filtre.style = b.dataset.style; afficherGrille();
});
$m('filtre-categorie').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('filtre-categorie'), b); filtre.categorie = b.dataset.categorie; afficherGrille();
});
['duree', 'prix', 'tri'].forEach((k) => $m('filtre-' + k).addEventListener('change', (e) => { filtre[k] = e.target.value; afficherGrille(); }));
$m('tout-afficher').addEventListener('click', () => {
  Object.assign(filtre, { format: '', categorie: '', style: '', duree: '', prix: '' });
  choisirBouton($m('filtre-style'), $m('filtre-style').querySelector('button'));
  choisirBouton($m('filtre-format'), $m('filtre-format').querySelector('button'));
  choisirBouton($m('filtre-categorie'), $m('filtre-categorie').querySelector('button'));
  $m('filtre-duree').value = ''; $m('filtre-prix').value = '';
  afficherGrille();
});

const dansIntervalle = (valeur, texte) => {
  if (!texte) return true;
  const [min, max] = texte.split('-').map(Number);
  return valeur >= min && valeur <= max;
};
function modelesFiltres() {
  const liste = MODELES.filter((m) =>
    (!filtre.format || m.formats.includes(filtre.format)) &&
    (!filtre.categorie || m.categorie === filtre.categorie) &&
    (!filtre.style || m.style === filtre.style) &&
    dansIntervalle(m.duree, filtre.duree) &&
    dansIntervalle(prixDe(m), filtre.prix));
  const tris = {
    populaires: (a, b) => (a.populaire || 99) - (b.populaire || 99),
    'prix-asc': (a, b) => prixDe(a) - prixDe(b) || a.duree - b.duree,
    'prix-desc': (a, b) => prixDe(b) - prixDe(a) || b.duree - a.duree,
    'duree-asc': (a, b) => a.duree - b.duree,
    'duree-desc': (a, b) => b.duree - a.duree
  };
  return liste.sort(tris[filtre.tri]);
}

/* ---------- 2. La grille ---------- */
// Les aperçus ne sont chargés que quand la carte est à l'écran (sinon la page rame)
const observateur = new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    const zone = e.target;
    if (e.isIntersecting && !zone.querySelector('iframe')) {
      const f = document.createElement('iframe');
      f.src = zone.dataset.src;
      f.title = zone.dataset.titre;
      f.tabIndex = -1;
      zone.appendChild(f);
    } else if (!e.isIntersecting) {
      const f = zone.querySelector('iframe');
      if (f) f.remove();
    }
  });
}, { rootMargin: '200px 0px' });

function afficherGrille() {
  const liste = modelesFiltres();
  const grille = $m('grille-modeles');
  grille.querySelectorAll('.carte-modele-ecran').forEach((z) => observateur.unobserve(z));
  $m('compte-modeles').textContent = liste.length + ' modèle' + (liste.length > 1 ? 's' : '');
  $m('aucun-modele').hidden = liste.length > 0;
  grille.innerHTML = liste.map((m) => {
    const format = filtre.format || m.formats[0];
    return '<li class="carte-modele" data-id="' + m.id + '">' +
      '<button type="button" class="carte-modele-vue" data-ouvrir="' + m.id + '" aria-label="Personnaliser ' + esc(m.nom) + '">' +
        '<span class="carte-modele-ecran ecran-' + format + '" data-src="' + esc(adresseModele(m, format, reglagesDepart(m))) + '" data-titre="Aperçu : ' + esc(m.nom) + '"></span>' +
        '<span class="carte-modele-survol">Personnaliser</span>' +
      '</button>' +
      '<div class="carte-modele-texte">' +
        '<div><h3>' + esc(m.nom) + '</h3><p>' + esc(m.style) + ' · ' + esc(m.categorie) + ' · ' + m.duree + ' s</p></div>' +
        '<span class="carte-modele-prix">' + euros(prixDe(m)) + '</span>' +
      '</div>' +
      '<div class="carte-modele-formats">' + m.formats.map((f) => '<span>' + RATIOS[f] + '</span>').join('') + '</div>' +
    '</li>';
  }).join('');
  grille.querySelectorAll('.carte-modele-ecran').forEach((z) => observateur.observe(z));
}
$m('grille-modeles').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ouvrir]');
  if (b) ouvrirEditeur(b.dataset.ouvrir);
});

/* ---------- 3. L'éditeur ---------- */
let modele = null;      // le modèle ouvert
let reglages = null;    // ses réglages en cours
let formatEd = 'vertical';
let minuteurEd;

function ouvrirEditeur(id) {
  modele = MODELES.find((m) => m.id === id);
  if (!modele) return;
  reglages = reglagesDepart(modele);
  formatEd = (filtre.format && modele.formats.includes(filtre.format)) ? filtre.format : modele.formats[0];

  $m('ed-cat').textContent = modele.style + ' · ' + modele.categorie;
  $m('ed-nom').textContent = modele.nom;
  $m('ed-infos').textContent = modele.duree + ' secondes · ' + modele.formats.map((f) => RATIOS[f]).join(', ') + ' · ' + euros(prixDe(modele));

  // les formats
  $m('ed-formats').innerHTML = modele.formats.map((f) =>
    '<button type="button" data-format="' + f + '" aria-pressed="' + (f === formatEd) + '"><i class="ratio r-' + f + '" aria-hidden="true"></i>' + RATIOS[f] + '</button>').join('');

  // les champs de texte
  $m('ed-champs').innerHTML = (modele.champs || []).map(([cle, nom]) =>
    '<label class="studio-champ"><span>' + esc(nom) + '</span>' +
    '<input type="text" data-cle="' + cle + '" maxlength="' + (cle === 'ligne1' && modele.fixe && modele.fixe.style === 'citation' ? 120 : 80) + '" value="' + esc(reglages.textes[cle] || '') + '" autocomplete="off"></label>').join('');

  // couleurs (pas pour les modèles "style appli" qui ont leurs propres couleurs)
  $m('ed-bloc-couleurs').hidden = !modele.palette;
  $m('ed-palettes').innerHTML = Object.entries(PALETTES_MODELES).map(([cle, p]) =>
    '<button type="button" class="carte-ambiance" data-palette="' + cle + '" aria-pressed="' + (cle === reglages.palette) + '">' +
    '<span class="ambiance-vue" style="background:' + p.fond + '"><i style="background:' + p.accent + '"></i><b style="color:' + p.texte + '">Aa</b></span>' + p.nom + '</button>').join('');

  // police (seulement pour les modèles de pret.html)
  $m('ed-bloc-police').hidden = !['pret.html', 'directions.html'].includes(modele.fichier);
  $m('ed-polices').innerHTML = POLICES_MODELES.map((p, i) =>
    '<button type="button" data-police="' + (i ? p : '') + '" aria-pressed="' + (i === 0) + '" style="font-family:\'' + p + '\', system-ui">' + p + '</button>').join('');
  chargerPolicesApercu();

  // symbole (modèles "logo")
  $m('ed-bloc-symbole').hidden = !modele.symboles;
  $m('ed-symboles').innerHTML = Object.entries(NOMS_SYMBOLES_MODELES).map(([cle, nom]) =>
    '<button type="button" data-symbole="' + cle + '" aria-pressed="' + (cle === reglages.symbole) + '">' + nom + '</button>').join('');

  $m('ed-note').hidden = !modele.note;
  $m('ed-note').textContent = modele.note || '';
  $m('ed-commander-texte').textContent = 'Commander · ' + euros(prixDe(modele));

  mettreAJourEditeur(true);
  $m('editeur').showModal();
  $m('editeur').querySelector('.editeur-panneau').scrollTop = 0;
}

// Charge les polices proposées une seule fois, pour que les boutons les montrent
let policesChargees = false;
function chargerPolicesApercu() {
  if (policesChargees) return;
  policesChargees = true;
  const lien = document.createElement('link');
  lien.rel = 'stylesheet';
  lien.href = 'https://fonts.googleapis.com/css2?' + POLICES_MODELES.map((p) => 'family=' + p.replace(/ /g, '+')).join('&') + '&display=swap';
  document.head.appendChild(lien);
}

// Recharge l'aperçu (tout de suite, ou après une petite pause quand on tape)
function mettreAJourEditeur(immediat) {
  clearTimeout(minuteurEd);
  const faire = () => {
    $m('ed-ecran').className = 'editeur-ecran ecran-' + formatEd;
    $m('ed-apercu').src = adresseModele(modele, formatEd, reglages);
    $m('ed-commander').href = lienDevis();
  };
  if (immediat) faire(); else minuteurEd = setTimeout(faire, 450);
}

$m('ed-champs').addEventListener('input', (e) => {
  const c = e.target.closest('[data-cle]'); if (!c) return;
  reglages.textes[c.dataset.cle] = c.value;
  mettreAJourEditeur(false);
});
$m('ed-formats').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('ed-formats'), b); formatEd = b.dataset.format; mettreAJourEditeur(true);
});
$m('ed-palettes').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('ed-palettes'), b); reglages.palette = b.dataset.palette; mettreAJourEditeur(true);
});
$m('ed-polices').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('ed-polices'), b); reglages.police = b.dataset.police; mettreAJourEditeur(true);
});
$m('ed-symboles').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  choisirBouton($m('ed-symboles'), b); reglages.symbole = b.dataset.symbole; mettreAJourEditeur(true);
});
$m('ed-rejouer').addEventListener('click', () => {
  const f = $m('ed-apercu');
  if (f.contentWindow) f.contentWindow.postMessage('novimo-rejouer', '*');
});
$m('ed-form').addEventListener('submit', (e) => e.preventDefault());
$m('ed-fermer').addEventListener('click', () => $m('editeur').close());
// un clic sur le fond sombre ferme l'éditeur
$m('editeur').addEventListener('click', (e) => { if (e.target === $m('editeur')) $m('editeur').close(); });
// à la fermeture, on coupe l'aperçu (il ne tourne plus pour rien)
$m('editeur').addEventListener('close', () => { $m('ed-apercu').removeAttribute('src'); });

/* ---------- 4. Commander : le devis, déjà rempli ---------- */
function lienDevis() {
  const t = reglages.textes;
  const pal = PALETTES_MODELES[reglages.palette];
  const lignes = [
    'Modèle choisi : ' + modele.nom + ' (réf. ' + modele.id + ', style ' + modele.style + ')',
    'Formats : ' + modele.formats.map((f) => RATIOS[f]).join(', ') + ' (aperçu regardé en ' + RATIOS[formatEd] + ')',
    pal ? 'Couleurs : ' + pal.nom : '',
    reglages.police ? 'Police des titres : ' + reglages.police : '',
    reglages.symbole ? 'Symbole : ' + NOMS_SYMBOLES_MODELES[reglages.symbole] : ''
  ].concat((modele.champs || []).map(([cle, nom]) => '- ' + nom + ' : ' + (t[cle] || '')));
  const p = new URLSearchParams({ commerce: t.marque && t.marque !== 'Votre marque' ? t.marque : '' });
  p.set(modele.tarif, '1');
  p.set('message', lignes.filter(Boolean).join('\n') + '\n\nAperçu : ' + new URL(adresseModele(modele, formatEd, reglages), location.href).href);
  return 'devis.html?' + p.toString();
}

/* Ouvrir directement un modèle avec modeles.html#soldes */
afficherGrille();
if (location.hash.length > 1) ouvrirEditeur(decodeURIComponent(location.hash.slice(1)));
