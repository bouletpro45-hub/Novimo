/* =========================================================
   DASHBOARD.JS — ton tableau de bord (réservé à l'admin)
     1. récupère les devis et les comptes (ou des exemples en mode démo)
     2. calcule les chiffres : comptes, devis, gains
     3. dessine les graphiques (SVG fait maison, avec infobulles)
     4. liste tous les devis, avec le changement de statut
   Les "gains" = acomptes reçus (à leur date) + soldes reçus (à leur date).
   ========================================================= */

const $d = (id) => document.getElementById(id);
const JOUR = 24 * 60 * 60 * 1000;
const POURCENT = R.acompte || 30;
document.querySelectorAll('.r-pourcent').forEach((el) => { el.textContent = POURCENT; });

let DEVIS = [];
let PROFILS = [];
let DEMO = false;

const STATUTS_TDB = {
  en_cours: 'En cours',
  signe:    'Acompte reçu',
  cloture:  'Clôturé (soldé)',
  annule:   'Annulé'
};

/* =====================================================
   1. LES DONNÉES
   ===================================================== */

// Données d'exemple (mode démo) : toujours les mêmes, pour pouvoir comparer
function donneesExemple() {
  let graine = 42;
  const hasard = () => { graine = (graine * 16807) % 2147483647; return (graine - 1) / 2147483646; };
  const maintenant = Date.now();
  const profils = Array.from({ length: 27 }, (_, i) => ({ id: 'p' + i, cree_le: new Date(maintenant - hasard() * 200 * JOUR).toISOString() }));
  const commerces = ['Chez Mila', 'Garage du Pont', 'Fournil des Lilas', 'Café Bruma', 'Fleurs de Lune', 'Pizzeria Sole', 'Boucherie Martin', 'Atelier Vélo'];
  const poids = { logo: 5, pub: 4, pack: 3, spot30: 2, spot60: 1 };
  const tirer = () => {
    const liste = R.tarifs.flatMap((t) => Array(poids[t.id] || 1).fill(t));
    return liste[Math.floor(hasard() * liste.length)];
  };

  const devis = [];
  for (let i = 0; i < 46; i++) {
    const cree = maintenant - Math.pow(hasard(), 1.3) * 185 * JOUR;
    const choisis = [tirer()];
    if (hasard() < 0.3) { const autre = tirer(); if (autre.id !== choisis[0].id) choisis.push(autre); }
    const lignes = choisis.map((t) => ({ texte: t.nom, montant: t.prix }));
    const total = lignes.reduce((s, l) => s + l.montant, 0);
    const acompte = Math.round(total * POURCENT) / 100;
    const age = (maintenant - cree) / JOUR;
    let statut = 'en_cours';
    const tirage = hasard();
    if (age > 30) statut = tirage < 0.65 ? 'cloture' : tirage < 0.8 ? 'signe' : tirage < 0.92 ? 'annule' : 'en_cours';
    else if (age > 5) statut = tirage < 0.25 ? 'cloture' : tirage < 0.65 ? 'signe' : 'en_cours';
    let acompteLe = null, soldeLe = null;
    if (statut === 'signe' || statut === 'cloture') acompteLe = Math.min(cree + (1 + hasard() * 5) * JOUR, maintenant);
    if (statut === 'cloture') {
      soldeLe = acompteLe + (5 + hasard() * 18) * JOUR;
      if (soldeLe > maintenant) { soldeLe = null; statut = 'signe'; }
    }
    devis.push({
      id: 'd' + i,
      numero: 'NOV-EX' + String(1000 + i),
      cree_le: new Date(cree).toISOString(),
      email: 'client' + (i % 31) + '@exemple.fr',
      commerce: commerces[i % commerces.length],
      type_commerce: '', prenom: '', telephone: '', message: '',
      lignes: lignes,
      prestations: choisis.map((t) => ({ id: t.id, nom: t.nom, quantite: 1 })),
      total: total, acompte: acompte, statut: statut,
      acompte_recu_le: acompteLe ? new Date(acompteLe).toISOString() : null,
      solde_recu_le: soldeLe ? new Date(soldeLe).toISOString() : null
    });
  }
  // "premier devis" = le plus ancien devis de chaque adresse e-mail
  const vus = new Set();
  devis.slice().sort((a, b) => new Date(a.cree_le) - new Date(b.cree_le)).forEach((d) => {
    d.premier_devis = !vus.has(d.email);
    vus.add(d.email);
  });
  return { devis: devis.sort((a, b) => new Date(b.cree_le) - new Date(a.cree_le)), profils };
}

/* =====================================================
   2. LES CALCULS
   ===================================================== */

// Chaque paiement reçu devient un "événement" daté
function paiements() {
  const ev = [];
  DEVIS.forEach((d) => {
    if (d.statut === 'annule') return;
    if (d.acompte_recu_le) ev.push({ t: +new Date(d.acompte_recu_le), v: Number(d.acompte) });
    if (d.solde_recu_le) ev.push({ t: +new Date(d.solde_recu_le), v: Number(d.total) - Number(d.acompte) });
  });
  return ev;
}
const sommeDepuis = (ev, depuis) => ev.filter((e) => e.t >= depuis).reduce((s, e) => s + e.v, 0);
const debutDuJour = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };

function gainsParJour(ev, nbJours) {
  const aujourdhui = debutDuJour(Date.now());
  return Array.from({ length: nbJours }, (_, i) => {
    const debut = aujourdhui - (nbJours - 1 - i) * JOUR;
    return {
      date: debut,
      label: new Date(debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      v: ev.filter((e) => e.t >= debut && e.t < debut + JOUR).reduce((s, e) => s + e.v, 0)
    };
  });
}

function gainsParMois(ev, nbMois) {
  const now = new Date();
  return Array.from({ length: nbMois }, (_, i) => {
    const debut = new Date(now.getFullYear(), now.getMonth() - (nbMois - 1 - i), 1);
    const fin = new Date(debut.getFullYear(), debut.getMonth() + 1, 1);
    return {
      label: debut.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      long: debut.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      v: ev.filter((e) => e.t >= +debut && e.t < +fin).reduce((s, e) => s + e.v, 0)
    };
  });
}

// Prestations les plus demandées dans le PREMIER devis de chaque client
function prestationsPremierDevis() {
  const compte = {};
  DEVIS.filter((d) => d.premier_devis).forEach((d) => {
    (d.prestations || []).forEach((p) => {
      compte[p.id] = compte[p.id] || { label: p.nom, v: 0 };
      compte[p.id].v += 1;   // nombre de premiers devis qui contiennent cette prestation
    });
  });
  return Object.values(compte).sort((a, b) => b.v - a.v);
}

/* =====================================================
   3. LES GRAPHIQUES (SVG)
   ===================================================== */
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (nom, attrs, parent) => {
  const el = document.createElementNS(NS, nom);
  Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
  if (parent) parent.appendChild(el);
  return el;
};
const texteSvg = (contenu, attrs, parent) => { const t = svgEl('text', attrs, parent); t.textContent = contenu; return t; };

// Un maximum "rond" pour l'axe (ex. 437 -> 500)
function maxRond(v) {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= v);
}
const eurCourt = (n) => n >= 1000 ? (n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + ' k€' : Math.round(n) + ' €';

// L'infobulle (une seule pour toute la page) — textContent uniquement
const bulle = $d('infobulle');
function montrerBulle(valeur, label, x, y) {
  bulle.replaceChildren();
  const fort = document.createElement('strong'); fort.textContent = valeur;
  const petit = document.createElement('span'); petit.textContent = label;
  bulle.append(fort, petit);
  bulle.hidden = false;
  const l = bulle.offsetWidth;
  bulle.style.left = Math.min(Math.max(8, x - l / 2), innerWidth - l - 8) + 'px';
  bulle.style.top = Math.max(8, y - bulle.offsetHeight - 14) + 'px';
}
const cacherBulle = () => { bulle.hidden = true; };

// Grille horizontale discrète + étiquettes de l'axe des montants
function grille(svg, max, x0, x1, y) {
  [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
    const yy = y(max * f);
    svgEl('line', { x1: x0, x2: x1, y1: yy, y2: yy, class: f === 0 ? 'axe' : 'grille' }, svg);
    texteSvg(eurCourt(max * f), { x: x0 - 8, y: yy + 4, 'text-anchor': 'end', class: 'etiquette' }, svg);
  });
}

// Courbe des gains par jour, avec réticule qui suit la souris
function courbe(conteneur, points, surligner) {
  conteneur.replaceChildren();
  const W = Math.max(conteneur.clientWidth, 280), H = 260;
  const m = { g: 52, d: 14, h: 14, b: 30 };
  const max = maxRond(Math.max(...points.map((p) => p.v)));
  const n = points.length;
  const x = (i) => m.g + i * (W - m.g - m.d) / (n - 1);
  const y = (v) => m.h + (1 - v / max) * (H - m.h - m.b);
  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, tabindex: 0, role: 'img', 'aria-label': 'Courbe des gains par jour' }, conteneur);

  // les 7 derniers jours en surbrillance
  if (surligner) {
    const pas = (W - m.g - m.d) / (n - 1);
    const xs = x(n - surligner) - pas / 2;
    svgEl('rect', { x: xs, y: m.h, width: W - m.d - xs, height: H - m.h - m.b, class: 'zone-recente', rx: 6 }, svg);
    texteSvg(surligner + ' derniers jours', { x: W - m.d - 6, y: m.h + 14, 'text-anchor': 'end', class: 'etiquette' }, svg);
  }
  grille(svg, max, m.g, W - m.d, y);

  const chemin = points.map((p, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(p.v).toFixed(1)).join(' ');
  svgEl('path', { d: chemin + ' L' + x(n - 1) + ' ' + y(0) + ' L' + x(0) + ' ' + y(0) + ' Z', class: 'aire' }, svg);
  svgEl('path', { d: chemin, class: 'ligne' }, svg);
  const pasEtiquette = W < 520 ? 10 : 5;   // moins de dates sur petit écran (sinon elles se chevauchent)
  points.forEach((p, i) => {
    if (i % pasEtiquette === (n - 1) % pasEtiquette) texteSvg(p.label, { x: x(i), y: H - 8, 'text-anchor': 'middle', class: 'etiquette' }, svg);
  });

  // réticule
  const reticule = svgEl('g', { class: 'reticule', visibility: 'hidden' }, svg);
  const trait = svgEl('line', { y1: m.h, y2: H - m.b }, reticule);
  const point = svgEl('circle', { r: 5 }, reticule);
  let actuel = n - 1;
  function viser(i, evt) {
    actuel = Math.max(0, Math.min(n - 1, i));
    const p = points[actuel];
    trait.setAttribute('x1', x(actuel)); trait.setAttribute('x2', x(actuel));
    point.setAttribute('cx', x(actuel)); point.setAttribute('cy', y(p.v));
    reticule.setAttribute('visibility', 'visible');
    const r = svg.getBoundingClientRect();
    montrerBulle(euros(p.v), p.label, evt && evt.clientX ? evt.clientX : r.left + x(actuel) * r.width / W, r.top + y(p.v) * r.height / H);
  }
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    const xs = (e.clientX - r.left) * W / r.width;
    viser(Math.round((xs - m.g) / ((W - m.g - m.d) / (n - 1))), e);
  });
  svg.addEventListener('pointerleave', () => { reticule.setAttribute('visibility', 'hidden'); cacherBulle(); });
  svg.addEventListener('focus', () => viser(actuel));
  svg.addEventListener('blur', () => { reticule.setAttribute('visibility', 'hidden'); cacherBulle(); });
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); viser(actuel - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); viser(actuel + 1); }
  });
}

// Barre aux coins du haut arrondis (4 px), posée sur l'axe
function cheminBarre(bx, by, l, h, r) {
  r = Math.min(r, l / 2, h);
  return 'M' + bx + ' ' + (by + h) + ' V' + (by + r) + ' Q' + bx + ' ' + by + ' ' + (bx + r) + ' ' + by +
    ' H' + (bx + l - r) + ' Q' + (bx + l) + ' ' + by + ' ' + (bx + l) + ' ' + (by + r) + ' V' + (by + h) + ' Z';
}

// Barres verticales (gains par mois)
function barresVerticales(conteneur, items) {
  conteneur.replaceChildren();
  const W = Math.max(conteneur.clientWidth, 260), H = 260;
  const m = { g: 52, d: 8, h: 22, b: 30 };
  const max = maxRond(Math.max(...items.map((i) => i.v)));
  const bande = (W - m.g - m.d) / items.length;
  const y = (v) => m.h + (1 - v / max) * (H - m.h - m.b);
  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Gains par mois' }, conteneur);
  grille(svg, max, m.g, W - m.d, y);
  items.forEach((it, i) => {
    const l = Math.min(bande * 0.58, 56);
    const bx = m.g + i * bande + (bande - l) / 2;
    const g = svgEl('g', { class: 'barre', tabindex: 0, 'aria-label': it.long + ' : ' + euros(it.v) }, svg);
    svgEl('rect', { x: m.g + i * bande, y: m.h, width: bande, height: H - m.h - m.b, class: 'zone-clic' }, g);  // zone de survol plus grande
    if (it.v > 0) svgEl('path', { d: cheminBarre(bx, y(it.v), l, y(0) - y(it.v), 4), class: 'barre-forme' }, g);
    texteSvg(it.v > 0 ? eurCourt(it.v) : '', { x: bx + l / 2, y: y(it.v) - 7, 'text-anchor': 'middle', class: 'valeur' }, g);
    texteSvg(it.label, { x: bx + l / 2, y: H - 8, 'text-anchor': 'middle', class: 'etiquette' }, svg);
    const montrer = (e) => { const r = g.getBoundingClientRect(); montrerBulle(euros(it.v), it.long, e && e.clientX ? e.clientX : r.left + r.width / 2, r.top); };
    g.addEventListener('pointermove', montrer);
    g.addEventListener('focus', () => montrer());
    g.addEventListener('pointerleave', cacherBulle);
    g.addEventListener('blur', cacherBulle);
  });
}

// Barres horizontales classées (prestations)
function barresHorizontales(conteneur, items) {
  conteneur.replaceChildren();
  if (!items.length) { const p = document.createElement('p'); p.className = 'compte-aide'; p.textContent = 'Pas encore de premier devis.'; conteneur.append(p); return; }
  const W = Math.max(conteneur.clientWidth, 260), haut = 34, ecart = 12;
  const H = items.length * (haut + ecart);
  const g0 = Math.min(150, W * 0.38), d0 = 44;
  const max = Math.max(...items.map((i) => i.v));
  const total = items.reduce((s, i) => s + i.v, 0);
  const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'Prestations demandées au premier devis' }, conteneur);
  items.forEach((it, i) => {
    const yy = i * (haut + ecart);
    const l = Math.max(4, (W - g0 - d0) * it.v / max);
    const g = svgEl('g', { class: 'barre', tabindex: 0, 'aria-label': it.label + ' : ' + it.v }, svg);
    svgEl('rect', { x: 0, y: yy, width: W, height: haut, class: 'zone-clic' }, g);
    texteSvg(it.label, { x: 0, y: yy + haut / 2 + 5, class: 'etiquette etiquette-ligne' }, g);
    svgEl('rect', { x: g0, y: yy + 4, width: l, height: haut - 8, rx: 4, class: 'barre-forme' }, g);
    texteSvg(String(it.v), { x: g0 + l + 8, y: yy + haut / 2 + 5, class: 'valeur' }, g);
    const montrer = (e) => { const r = g.getBoundingClientRect(); montrerBulle(it.v + ' premier(s) devis', it.label + ' · ' + Math.round(it.v / total * 100) + ' %', e && e.clientX ? e.clientX : r.left + r.width / 2, r.top); };
    g.addEventListener('pointermove', montrer);
    g.addEventListener('focus', () => montrer());
    g.addEventListener('pointerleave', cacherBulle);
    g.addEventListener('blur', cacherBulle);
  });
}

// Tableau "Voir les données" sous chaque graphique
function tableDonnees(conteneur, entetes, lignes) {
  const t = document.createElement('table');
  const tr0 = t.createTHead().insertRow();
  entetes.forEach((e) => { const th = document.createElement('th'); th.textContent = e; tr0.appendChild(th); });
  const corps = t.createTBody();
  lignes.forEach((l) => { const tr = corps.insertRow(); l.forEach((c) => { tr.insertCell().textContent = c; }); });
  conteneur.replaceChildren(t);
}

/* =====================================================
   4. AFFICHAGE
   ===================================================== */
function afficherTout() {
  $d('contenu-tdb').hidden = false;

  // Compteurs
  $d('k-comptes').textContent = PROFILS.length;
  $d('k-en-cours').textContent = DEVIS.filter((d) => d.statut === 'en_cours' || d.statut === 'signe').length;
  $d('k-clotures').textContent = DEVIS.filter((d) => d.statut === 'cloture').length;
  $d('k-total').textContent = DEVIS.length;

  // Gains
  const ev = paiements();
  const maintenant = Date.now();
  const sixMois = new Date(); sixMois.setMonth(sixMois.getMonth() - 6);
  $d('g-7').textContent = euros(sommeDepuis(ev, maintenant - 7 * JOUR));
  $d('g-30').textContent = euros(sommeDepuis(ev, maintenant - 30 * JOUR));
  $d('g-6m').textContent = euros(sommeDepuis(ev, +sixMois));
  $d('g-total').textContent = euros(sommeDepuis(ev, 0));

  // Graphiques
  const jours = gainsParJour(ev, 30);
  const mois = gainsParMois(ev, 6);
  const presta = prestationsPremierDevis();
  const dessiner = () => {
    courbe($d('graph-30j'), jours, 7);
    barresVerticales($d('graph-6m'), mois);
    barresHorizontales($d('graph-presta'), presta);
  };
  dessiner();
  clearTimeout(window.__minuteurTdb);
  window.onresize = () => { clearTimeout(window.__minuteurTdb); window.__minuteurTdb = setTimeout(dessiner, 150); };
  tableDonnees($d('table-30j'), ['Jour', 'Gains'], jours.map((j) => [j.label, euros(j.v)]));
  tableDonnees($d('table-6m'), ['Mois', 'Gains'], mois.map((j) => [j.long, euros(j.v)]));
  tableDonnees($d('table-presta'), ['Prestation', 'Premiers devis'], presta.map((p) => [p.label, String(p.v)]));

  afficherListe();
}

function afficherListe() {
  const corps = $d('lignes-devis');
  corps.replaceChildren();
  DEVIS.forEach((d) => {
    const tr = corps.insertRow();
    const cellule = (texte, classe) => { const c = tr.insertCell(); c.textContent = texte; if (classe) c.className = classe; return c; };
    cellule(d.numero, 'gras');
    cellule(new Date(d.cree_le).toLocaleDateString('fr-FR'));
    const client = tr.insertCell();
    const nom = document.createElement('strong'); nom.textContent = d.commerce;
    const mail = document.createElement('small'); mail.textContent = d.email;
    client.append(nom, mail);
    cellule((d.lignes || []).map((l) => l.texte).join(', '));
    cellule(euros(Number(d.total)), 'nombre-cellule');
    cellule(euros(Number(d.acompte)), 'nombre-cellule');

    // Changer le statut
    const cs = tr.insertCell();
    const choix = document.createElement('select');
    choix.className = 'choix-statut statut-' + d.statut.replace('_', '-');
    choix.setAttribute('aria-label', 'Statut du devis ' + d.numero);
    Object.entries(STATUTS_TDB).forEach(([v, t]) => { const o = new Option(t, v, false, v === d.statut); choix.add(o); });
    choix.addEventListener('change', async () => {
      choix.disabled = true;
      try {
        const nouveau = DEMO ? simulerStatut(d, choix.value) : await NovimoAPI.changerStatut(d, choix.value);
        DEVIS = DEVIS.map((x) => (x.id === d.id ? nouveau : x));
        afficherTout();
      } catch (err) {
        alert('Impossible de changer le statut : ' + err.message);
        choix.value = d.statut;
        choix.disabled = false;
      }
    });
    cs.appendChild(choix);

    // Télécharger le PDF
    const cp = tr.insertCell();
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bouton-fantome bouton-pdf'; b.textContent = 'PDF';
    b.addEventListener('click', () => creerPdfDevis({
      numero: d.numero, date: d.cree_le, commerce: d.commerce, type: d.type_commerce, prenom: d.prenom,
      email: d.email, tel: d.telephone, message: d.message, lignes: d.lignes, total: d.total,
      acompte: d.acompte, acomptePourcent: POURCENT, contact: R.email
    }).save('Devis-' + d.numero + '.pdf'));
    cp.appendChild(b);
  });
}

// Mode démo : même logique que NovimoAPI.changerStatut, sans base de données
function simulerStatut(d, statut) {
  const maintenant = new Date().toISOString();
  const n = Object.assign({}, d, { statut });
  if ((statut === 'signe' || statut === 'cloture') && !n.acompte_recu_le) n.acompte_recu_le = maintenant;
  if (statut === 'cloture' && !n.solde_recu_le) n.solde_recu_le = maintenant;
  if (statut === 'en_cours' || statut === 'annule') { n.acompte_recu_le = null; n.solde_recu_le = null; }
  if (statut === 'signe') n.solde_recu_le = null;
  return n;
}

/* =====================================================
   5. AUDIENCE (table "visites")
   ===================================================== */
const NOMS_PAGES = {
  'index.html': 'Accueil', '': 'Accueil', 'modeles.html': 'Modèles', 'devis.html': 'Devis',
  'compte.html': 'Mon compte', 'confidentialite.html': 'Confidentialité', 'cgu.html': 'CGU / CGV', '404.html': 'Page introuvable'
};
function classement(conteneur, comptes, total) {
  const items = Object.entries(comptes).sort((a, b) => b[1] - a[1]).slice(0, 6);
  conteneur.innerHTML = items.length ? items.map(([nom, n]) =>
    '<li><span class="classement-nom">' + esc(nom) + '</span><span class="classement-barre"><i style="width:' + Math.max(4, n / items[0][1] * 100) + '%"></i></span>' +
    '<span class="classement-n">' + n + ' <small>(' + Math.round(n / total * 100) + ' %)</small></span></li>').join('')
    : '<li class="compte-aide">Pas encore de visite.</li>';
}
function afficherAudience(visites) {
  if (!visites) {
    $d('audience-vide').hidden = false;
    $d('audience-vide').textContent = 'La mesure d’audience n’est pas encore activée : colle le fichier supabase/ajout-2026-10-17.sql dans Supabase > SQL Editor, puis clique sur Run.';
    return;
  }
  const visiteurs = new Set(visites.map((v) => v.visiteur || v.cree_le)).size;
  const mobiles = visites.filter((v) => v.appareil === 'mobile').length;
  const devis30 = DEVIS.filter((d) => Date.now() - new Date(d.cree_le) < 30 * JOUR).length;
  $d('a-vues').textContent = visites.length;
  $d('a-visiteurs').textContent = visiteurs;
  $d('a-mobile').textContent = (visites.length ? Math.round(mobiles / visites.length * 100) : 0) + ' %';
  $d('a-conversion').textContent = (visiteurs ? Math.round(devis30 / visiteurs * 1000) / 10 : 0).toLocaleString('fr-FR') + ' %';
  const pages = {}, sources = {};
  visites.forEach((v) => {
    const p = NOMS_PAGES[v.page] || v.page;
    pages[p] = (pages[p] || 0) + 1;
    sources[v.source || 'direct'] = (sources[v.source || 'direct'] || 0) + 1;
  });
  classement($d('a-pages'), pages, visites.length);
  classement($d('a-sources'), sources, visites.length);
}

function refuser(texte, lienCompte) {
  $d('acces-refuse').hidden = false;
  $d('acces-texte').innerHTML = '';
  $d('acces-texte').textContent = texte + ' ';
  if (lienCompte) {
    const a = document.createElement('a'); a.href = 'compte.html'; a.textContent = 'Se connecter';
    $d('acces-texte').appendChild(a);
  }
}

/* =====================================================
   DÉMARRAGE : qui a le droit de voir la page ?
   ===================================================== */
(async function demarrer() {
  if (!NovimoAPI.actif) {
    DEMO = true;
    const ex = donneesExemple();
    DEVIS = ex.devis; PROFILS = ex.profils;
    $d('bandeau-demo').hidden = false;
    afficherTout();
    // visites d'exemple
    const pagesEx = ['index.html', 'index.html', 'modeles.html', 'devis.html', 'index.html', 'modeles.html'];
    const sourcesEx = ['direct', 'instagram.com', 'google.com', 'tiktok.com', 'direct', 'google.com'];
    return afficherAudience(Array.from({ length: 240 }, (_, i) => ({
      cree_le: new Date(Date.now() - (i % 30) * JOUR).toISOString(), page: pagesEx[i % 6], source: sourcesEx[(i * 7) % 6],
      appareil: i % 3 ? 'mobile' : 'ordinateur', visiteur: 'v' + (i % 95)
    })));
  }
  const u = await NovimoAPI.utilisateur();
  if (!u) return refuser('Connectez-vous avec le compte administrateur pour voir cette page.', true);
  if (!NovimoAPI.estAdmin(u)) return refuser('Cette page est réservée à l\'administrateur.');
  try {
    const donnees = await NovimoAPI.donneesAdmin();
    DEVIS = donnees.devis; PROFILS = donnees.profils;
    afficherTout();
    afficherAudience(await NovimoAPI.visites());
  } catch (err) {
    refuser('Impossible de charger les données (' + err.message + ').');
  }
})();
