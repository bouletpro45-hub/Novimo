/* =========================================================
   COMMUN.JS — ce qui est partagé par toutes les pages du site
     1. la barre latérale (pliante / dépliante)
     2. tes coordonnées et tes prix (depuis reglages.js)
     3. les apparitions au défilement
   Tu n'as normalement pas besoin de modifier ce fichier :
   les onglets se règlent dans reglages.js.
   ========================================================= */

document.documentElement.classList.add('js');

const R = (typeof REGLAGES_SITE !== 'undefined') ? REGLAGES_SITE : {};

/* Petites icônes dessinées (traits de 24 x 24) */
const ICONES = {
  maison:    'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  eclair:    'M13 2L4 14h7l-1 8 9-12h-7z',
  grille:    'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  etiquette: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM8 8h.01',
  devis:     'M6 2h9l5 5v15H6zM14 2v6h6M9 13h8M9 17h6',
  lettre:    'M3 5h18v14H3zM3 6l9 7 9-7',
  personne:  'M12 12a4 4 0 1 0 0-8a4 4 0 1 0 0 8zM4 21a8 8 0 0 1 16 0',
  graphique: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  chevron:   'M15 6l-6 6 6 6',
  menu:      'M4 7h16M4 12h16M4 17h16',
  fermer:    'M6 6l12 12M18 6L6 18',
  film:      'M4 4h16v16H4zM4 9h16M4 15h16M9 4v5M15 4v5M9 15v5M15 15v5',
  bulle:     'M4 5h16v11H9l-5 4z',
  question:  'M12 21a9 9 0 1 0 0-18a9 9 0 1 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01'
};
function icone(nom) {
  return '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + (ICONES[nom] || '') + '"/></svg>';
}

/* Mémoriser un petit choix (menu replié ou non) dans le navigateur */
function memoire(cle, valeur) {
  try {
    if (valeur === undefined) return localStorage.getItem('novimo-' + cle);
    localStorage.setItem('novimo-' + cle, valeur);
  } catch (e) { return null; }
}

/* Construit un lien e-mail avec un objet et un message déjà écrits */
function lienMail(objet, message) {
  return 'mailto:' + R.email +
    '?subject=' + encodeURIComponent(objet) +
    '&body=' + encodeURIComponent(message || 'Bonjour,\n\nJe suis intéressé(e) par une animation pour mon entreprise.\n\nNom de l\'entreprise :\nSecteur d\'activité :\nCe que je veux mettre en avant :\n\nMerci !');
}

/* Rend un texte "inoffensif" avant de l'afficher (protège contre le code caché
   dans les informations envoyées par les visiteurs) */
function esc(texte) {
  return String(texte == null ? '' : texte).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/* Écrit un prix joliment : 35 -> "35 €" */
function euros(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

/* =====================================================
   1. BARRE LATÉRALE
   ===================================================== */
/* Le logo Novimo (même dessin que logo.svg) : un N penché, lancé vers l'avant */
const LOGO_SYMBOLE = '<svg viewBox="0 0 100 100" aria-hidden="true"><rect class="logo-fond" width="100" height="100" rx="26"/>' +
  '<path class="logo-n" transform="translate(6 0) skewX(-12) translate(10.6 0)" d="M30 76V24h13l15 27V24h13v52H58L43 49v27z"/>' +
  '<path class="logo-vitesse" d="M13 41h11M17 55h8"/></svg>';
/* Le nom : "novimo" en minuscules, le point du i est un petit triangle "lecture" */
const LOGO_NOM = 'nov<span class="i-lecture">ı</span>mo';
function logoNovimo() {
  return '<span class="logo-symbole">' + LOGO_SYMBOLE + '</span><span class="logo-fin">' + LOGO_NOM + '</span>';
}

(function construireBarre() {
  const page = document.body.dataset.page || 'accueil';

  const liens = (R.onglets || []).map((o) =>
    '<a class="onglet" href="' + o.lien + '" data-cible="' + (o.lien.split('#')[1] || '') + '" title="' + o.nom + '">' +
      icone(o.icone) + '<span class="onglet-nom">' + o.nom + '</span></a>'
  ).join('');

  const barre = document.createElement('aside');
  barre.className = 'laterale';
  barre.id = 'laterale';
  barre.setAttribute('aria-label', 'Menu principal');
  barre.innerHTML =
    '<a class="laterale-logo" href="index.html#haut" aria-label="Novimo, accueil">' + logoNovimo() + '</a>' +
    '<button class="fermer-menu" type="button" aria-label="Fermer le menu">' + icone('fermer') + '</button>' +
    '<nav class="laterale-liens">' + liens + '</nav>' +
    '<a class="bouton laterale-action" href="devis.html" title="Demander mon devis gratuit">' + icone('devis') + '<span class="onglet-nom">Devis gratuit</span></a>' +
    '<button class="replier" type="button" aria-expanded="true">' + icone('chevron') + '<span class="onglet-nom">Replier le menu</span></button>';

  const haut = document.createElement('header');
  haut.className = 'barre-mobile';
  haut.innerHTML =
    '<a class="laterale-logo" href="index.html#haut" aria-label="Novimo, accueil">' + logoNovimo() + '</a>' +
    '<button class="ouvrir-menu" type="button" aria-label="Ouvrir le menu" aria-controls="laterale" aria-expanded="false">' + icone('menu') + '</button>';

  // Bouton "Se connecter / S'inscrire" en haut à droite ("Mon compte" si déjà connecté)
  const dejaConnecte = Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k));
  const texteCompte = dejaConnecte ? 'Mon compte' : 'Se connecter';
  const lienCompte = (classe) => '<a class="' + classe + '" href="compte.html" title="' + (dejaConnecte ? 'Mon compte' : 'Se connecter ou créer un compte') + '">' +
    icone('personne') + '<span>' + texteCompte + '</span>' + (dejaConnecte ? '' : '<span class="compte-ou">/ S’inscrire</span>') + '</a>';
  haut.querySelector('.ouvrir-menu').insertAdjacentHTML('beforebegin',
    lienCompte('compte-haut compte-haut-mobile').replace('<span>Se connecter</span>', '<span>Connexion</span>'));
  if (page !== 'compte') document.body.insertAdjacentHTML('afterbegin', lienCompte('compte-haut compte-haut-ordi'));

  const voile = document.createElement('div');
  voile.className = 'voile';

  document.body.prepend(voile);
  document.body.prepend(barre);
  document.body.prepend(haut);

  const html = document.documentElement;
  const boutonReplier = barre.querySelector('.replier');
  const boutonOuvrir = haut.querySelector('.ouvrir-menu');

  // --- Ordinateur : replier / déplier ---
  // Le logo "se déroule" à chaque ouverture du menu
  function animerLogo() {
    barre.querySelectorAll('.laterale-logo').forEach((l) => {
      l.classList.remove('logo-roule');
      void l.offsetWidth;
      l.classList.add('logo-roule');
    });
  }
  function replier(oui) {
    if (!oui && html.classList.contains('menu-replie')) animerLogo();
    html.classList.toggle('menu-replie', oui);
    boutonReplier.setAttribute('aria-expanded', String(!oui));
    boutonReplier.querySelector('.onglet-nom').textContent = oui ? 'Déplier le menu' : 'Replier le menu';
    boutonReplier.title = oui ? 'Déplier le menu' : 'Replier le menu';
    memoire('menu-replie', oui ? '1' : '0');
  }
  replier(memoire('menu-replie') === '1');
  boutonReplier.addEventListener('click', () => replier(!html.classList.contains('menu-replie')));

  // --- Téléphone : ouvrir / fermer le tiroir ---
  function ouvrir(oui) {
    if (oui && !html.classList.contains('menu-ouvert')) animerLogo();
    html.classList.toggle('menu-ouvert', oui);
    boutonOuvrir.setAttribute('aria-expanded', String(oui));
    if (oui) barre.querySelector('.onglet').focus();
  }
  boutonOuvrir.addEventListener('click', () => ouvrir(true));
  barre.querySelector('.fermer-menu').addEventListener('click', () => ouvrir(false));
  voile.addEventListener('click', () => ouvrir(false));
  barre.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => ouvrir(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ouvrir(false); });

  // --- Onglet actif ---
  const onglets = Array.from(barre.querySelectorAll('.onglet'));
  function activer(cible) {
    onglets.forEach((o) => o.classList.toggle('actif', o.dataset.cible === cible));
  }
  if (page !== 'accueil') {
    onglets.forEach((o) => o.classList.toggle('actif', o.getAttribute('href') === page + '.html'));
  } else {
    // Sur l'accueil : l'onglet suit la section affichée à l'écran
    const sections = onglets.map((o) => document.getElementById(o.dataset.cible)).filter(Boolean);
    const espion = new IntersectionObserver((entrees) => {
      entrees.forEach((e) => { if (e.isIntersecting) activer(e.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => espion.observe(s));
    activer('haut');
  }
})();

/* Pastille "messages non lus" sur l'onglet Messages
   (seulement sur les pages qui chargent api.js, et si on est connecté) */
window.addEventListener('DOMContentLoaded', async () => {
  if (typeof NovimoAPI === 'undefined' || !NovimoAPI.actif || document.body.dataset.page === 'messages') return;
  try {
    if (!(await NovimoAPI.utilisateur())) return;
    const r = await NovimoAPI.messagerie('compteur');
    if (!r.nonLus) return;
    document.querySelectorAll('.onglet[href="messages.html"]').forEach((o) => {
      o.insertAdjacentHTML('beforeend', '<span class="pastille-menu" aria-label="' + r.nonLus + ' non lu(s)">' + r.nonLus + '</span>');
    });
  } catch (e) { /* messagerie pas encore installée : pas de pastille */ }
});

/* =====================================================
   2. COORDONNÉES ET PRIX
   ===================================================== */
document.querySelectorAll('[data-r]').forEach((el) => {
  const cle = el.dataset.r;
  if (R[cle]) el.textContent = (cle === 'email' ? '' : '@') + R[cle];
});
document.querySelectorAll('[data-mail]').forEach((el) => { el.href = lienMail(el.dataset.mail); });
document.querySelectorAll('[data-reseau="instagram"]').forEach((el) => { el.href = 'https://www.instagram.com/' + R.instagram + '/'; });
document.querySelectorAll('[data-reseau="tiktok"]').forEach((el) => { el.href = 'https://www.tiktok.com/@' + R.tiktok; });
document.querySelectorAll('.annee').forEach((el) => { el.textContent = new Date().getFullYear(); });

// Liste des tarifs (page d'accueil) construite depuis reglages.js
const listeTarifs = document.getElementById('liste-tarifs');
if (listeTarifs && R.tarifs) {
  // Économie d'un pack par rapport aux animations achetées séparément
  const economiePack = (t) => (t.contenu || []).reduce((s, id) => {
    const a = R.tarifs.find((x) => x.id === id);
    return s + (a ? a.prix : 0);
  }, 0) - t.prix;

  // Une carte de tarif
  const carte = (t) =>
    '<li data-entree' + (t.contenu ? ' class="pack"' : t.apercu ? ' class="avec-apercu"' : '') + '>' +
      (t.contenu && economiePack(t) > 0 ? '<span class="bulle bulle-pack">' + euros(economiePack(t)) + ' d\'économie</span>' : '') +
      (t.etiquette ? '<span class="bulle bulle-format">' + t.etiquette + '</span>' : '') +
      '<h3>' + t.nom + '</h3><p>' + t.description + '</p>' +
      '<div class="prix-bloc"><span class="prix">' + euros(t.prix) + '</span>' +
      (t.prixPro ? '<span class="prix-pro">Freelance : dès ' + euros(t.prixPro) + '</span>' : '') +
      '</div>' +
      (t.apercu ? '<img class="tarif-apercu" src="' + t.apercu + '" width="560" height="747" loading="lazy" alt="Exemple de système de logo Novimo : logo principal, logotype, symbole, icône d’appli et monochrome">' : '') +
      '</li>';

  // Les cartes sont rangées par groupe (Réseaux sociaux, YouTube et TV...)
  const groupes = R.groupes || [{ id: undefined, nom: '', detail: '' }];
  listeTarifs.innerHTML = groupes.map((g) => {
    const cartes = R.tarifs.filter((t) => !g.id || t.groupe === g.id);
    if (!cartes.length) return '';
    return '<div class="groupe-tarifs">' +
      (g.nom ? '<div class="groupe-tete" data-entree><h3 class="groupe-titre">' + g.nom + '</h3><p>' + g.detail + '</p></div>' : '') +
      '<ul class="grille-tarifs">' + cartes.map(carte).join('') + '</ul></div>';
  }).join('');
}

// La source de la comparaison de prix
document.querySelectorAll('[data-source]').forEach((el) => {
  if (R.comparaison) el.textContent = R.comparaison.source;
});

/* =====================================================
   3. APPARITIONS AU DÉFILEMENT
   (lancées une fois que chaque page a construit son contenu)
   ===================================================== */
window.addEventListener('DOMContentLoaded', () => {
  const observateur = new IntersectionObserver((entrees) => {
    entrees.filter((e) => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = (i * 80) + 'ms';
      e.target.classList.add('visible');
      observateur.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-entree]').forEach((el) => observateur.observe(el));
});

/* =====================================================
   HABILLAGE IPHONE : barre d'état, Dynamic Island et barre
   du bas autour de chaque vidéo montrée dans un téléphone
   ===================================================== */
(function habillerTelephones() {
  const icones =
    '<svg viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>' +
    '<svg viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.5 5.6 9a3.4 3.4 0 0 1 4.8 0zM3.5 6.9a6.4 6.4 0 0 1 9 0l-1.4 1.4a4.4 4.4 0 0 0-6.2 0zM1.2 4.6a9.6 9.6 0 0 1 13.6 0l-1.4 1.4a7.6 7.6 0 0 0-10.8 0z"/></svg>' +
    '<svg viewBox="0 0 27 13" aria-hidden="true"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".45"/><rect x="2.5" y="2.5" width="19" height="8" rx="2"/><path d="M25 4.5v4a2 2 0 0 0 0-4z" opacity=".45"/></svg>';

  document.querySelectorAll('.telephone').forEach((tel) => {
    const ecran = tel.querySelector('.ecran');
    if (!ecran || tel.querySelector('.tel-ecran')) return;
    const vitre = document.createElement('div');
    vitre.className = 'tel-ecran';
    ecran.replaceWith(vitre);
    vitre.appendChild(ecran);
    if (!tel.classList.contains('telephone-paysage')) {
      vitre.insertAdjacentHTML('afterbegin', '<div class="tel-etat" aria-hidden="true"><span>9:41</span><span class="tel-icones">' + icones + '</span></div>');
      vitre.insertAdjacentHTML('beforeend', '<div class="tel-pied" aria-hidden="true"><img src="logo.svg" alt=""><b>novimo</b><span>Sponsorisé</span></div>');
    }
    vitre.insertAdjacentHTML('beforeend', '<span class="tel-barre-accueil" aria-hidden="true"></span>');
  });
})();
