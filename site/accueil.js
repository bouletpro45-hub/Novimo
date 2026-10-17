/* =========================================================
   ACCUEIL.JS — ce qui est propre à la page d'accueil
     1. l'essai en direct : le logo animé se refait quand on tape
     2. l'apparition du grand titre, mot par mot
   ========================================================= */

/* ---------- 1. Essai en direct ---------- */

// Les palettes proposées (fond, lueur, accent, texte, texte doux)
const PALETTES = [
  { nom: 'Nuit et or',       fond: '#0b1430', fond2: '#1c2f63', accent: '#e6b85c', texte: '#f6efe0', texteDoux: '#b9bfd6' },
  { nom: 'Noir et citron',   fond: '#0f100d', fond2: '#262a1a', accent: '#d4ff3f', texte: '#f2f0e8', texteDoux: '#b4b2a8' },
  { nom: 'Bordeaux et rose', fond: '#3a0d1a', fond2: '#62182d', accent: '#ffb3c1', texte: '#fff1f3', texteDoux: '#e6b9c3' },
  { nom: 'Forêt et menthe',  fond: '#0d2a22', fond2: '#174536', accent: '#7ff0c4', texte: '#effaf5', texteDoux: '#a9cfc0' },
  { nom: 'Crème et rouge',   fond: '#f4ede1', fond2: '#ffffff', accent: '#d7322a', texte: '#1d1a17', texteDoux: '#6e655c' }
];
const NOMS_SYMBOLES = { 'ciseaux': 'Ciseaux', 'lune-ble': 'Lune et blé', 'etoile': 'Étoile', 'aucun': 'Sans symbole' };

const champNom = document.getElementById('champ-nom');
const champSlogan = document.getElementById('champ-slogan');
const apercu = document.getElementById('apercu');
const boutonEssai = document.getElementById('bouton-essai');
const zonePastilles = document.getElementById('choix-couleurs');

let palette = PALETTES[1];
let symbole = 'ciseaux';

// Une carte par ambiance : un aperçu des couleurs + son nom
PALETTES.forEach((p, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'carte-ambiance';
  b.setAttribute('aria-pressed', i === 1 ? 'true' : 'false');
  b.innerHTML = '<span class="ambiance-vue" style="background:' + p.fond + '"><i style="background:' + p.accent + '"></i><b style="color:' + p.texte + '">Aa</b></span>' + p.nom;
  b.addEventListener('click', () => {
    palette = p;
    document.getElementById('essai').style.setProperty('--e-accent', p.accent);
    zonePastilles.querySelectorAll('.carte-ambiance').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    mettreAJour();
  });
  zonePastilles.appendChild(b);
});

document.querySelectorAll('#choix-symbole button').forEach((b) => {
  b.addEventListener('click', () => {
    symbole = b.dataset.symbole;
    document.querySelectorAll('#choix-symbole button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
    b.setAttribute('aria-pressed', 'true');
    mettreAJour();
  });
});

// Les idées de noms : un clic remplit le nom et le slogan
document.querySelectorAll('[data-idee]').forEach((b) => b.addEventListener('click', () => {
  const [nom, slogan] = b.dataset.idee.split('|');
  champNom.value = nom;
  champSlogan.value = slogan;
  mettreAJour();
}));

/* Les étapes : 0 = nom, 1 = ambiance, 2 = symbole, 3 = c'est prêt */
let etape = 0;
const etapes = document.querySelectorAll('.studio-etape');
const boutonsEtape = document.querySelectorAll('.studio-etapes button');
const suivant = document.getElementById('studio-suivant');
const retour = document.getElementById('studio-retour');
function allerEtape(n) {
  etape = Math.max(0, Math.min(3, n));
  etapes.forEach((e) => { e.hidden = Number(e.dataset.etape) !== etape; });
  boutonsEtape.forEach((b, i) => {
    if (i === Math.min(etape, 2)) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    b.classList.toggle('fait', i < etape);
  });
  document.getElementById('studio-barre').style.transform = 'scaleX(' + (etape / 3) + ')';
  retour.hidden = etape === 0 || etape === 3;
  suivant.hidden = etape === 3;
  document.getElementById('studio-suivant-texte').textContent = etape === 2 ? 'Voir mon logo' : 'Suivant';
  if (etape === 3 && apercu.contentWindow) apercu.contentWindow.postMessage('novimo-rejouer', '*');
}
suivant.addEventListener('click', () => allerEtape(etape + 1));
retour.addEventListener('click', () => allerEtape(etape - 1));
document.querySelectorAll('[data-aller]').forEach((b) => b.addEventListener('click', () => allerEtape(Number(b.dataset.aller))));
allerEtape(0);

// Recharge l'animation avec les nouveaux réglages,
// et prépare le lien vers le devis (déjà rempli avec ces choix)
function mettreAJour() {
  const nom = champNom.value.trim() || 'Votre marque';
  const slogan = champSlogan.value.trim();
  const params = new URLSearchParams({
    integre: '1',
    marque: nom,
    slogan: slogan,
    symbole: symbole,
    fond: palette.fond, fond2: palette.fond2, accent: palette.accent,
    texte: palette.texte, texteDoux: palette.texteDoux
  });
  apercu.src = 'logo-reveal.html?' + params.toString();
  // un reflet passe sur l'aperçu pendant qu'il se refait
  const ecran = apercu.parentElement;
  ecran.classList.remove('recharge');
  void ecran.offsetWidth;
  ecran.classList.add('recharge');

  boutonEssai.href = 'devis.html?' + new URLSearchParams({
    logo: '1',
    commerce: nom,
    message: 'Logo animé essayé sur le site :\n- Slogan : ' + slogan +
      '\n- Couleurs : ' + palette.nom + '\n- Symbole : ' + NOMS_SYMBOLES[symbole]
  }).toString();
}

// On attend que la personne arrête de taper (0,6 s) avant de relancer
let minuteur;
[champNom, champSlogan].forEach((c) => c.addEventListener('input', () => {
  clearTimeout(minuteur);
  minuteur = setTimeout(mettreAJour, 600);
}));
document.getElementById('formulaire').addEventListener('submit', (e) => e.preventDefault());
// Entrée dans le nom : on passe au slogan
champNom.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); champSlogan.focus(); } });
champSlogan.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); allerEtape(1); } });
// Le bouton "Rejouer" relance l'animation sans la recharger
document.getElementById('essai-rejouer').addEventListener('click', () => {
  if (apercu.contentWindow) apercu.contentWindow.postMessage('novimo-rejouer', '*');
});
mettreAJour();

/* ---------- 2. Le grand titre : chaque mot monte l'un après l'autre ---------- */
// (les mots dans <span class="accent"> gardent leur couleur)
const titre = document.querySelector('.titre-accueil');
let numeroMot = 0;
const mots = [];
titre.childNodes.forEach((n) => {
  const enAccent = n.nodeType === 1 && n.classList.contains('accent');
  n.textContent.split(/\s+/).filter(Boolean).forEach((m) => {
    mots.push('<span class="mot-accueil' + (enAccent ? ' accent' : '') +
      '" style="transition-delay:' + (numeroMot++ * 90) + 'ms">' + m + '</span>');
  });
});
titre.innerHTML = mots.join(' ');
setTimeout(() => titre.classList.add('visible'), 80);

/* ---------- 3. Le carrousel tournant des réalisations ----------
   - la vidéo du centre est "active" ; les autres sont inclinées sur les côtés
   - on passe à la suivante quand la vidéo active a fini (ou avec les flèches,
     les points, un clic sur une vidéo de côté, ou en glissant le doigt) */
(function carrousel() {
  const racine = document.getElementById('carrousel');
  if (!racine) return;
  const diapos = Array.from(racine.querySelectorAll('.diapo'));
  const zonePoints = racine.querySelector('.carrousel-points');
  const n = diapos.length;
  let actif = 0;
  let secours;

  // Un point par vidéo
  const points = diapos.map((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', 'Vidéo ' + (i + 1));
    b.addEventListener('click', () => aller(i));
    zonePoints.appendChild(b);
    return b;
  });

  function placer() {
    diapos.forEach((d, i) => {
      // position par rapport à la vidéo active : -1 = gauche, 0 = centre, +1 = droite...
      let ecart = i - actif;
      if (ecart > n / 2) ecart -= n;
      if (ecart < -n / 2) ecart += n;
      const cote = Math.sign(ecart);
      const loin = Math.abs(ecart);
      // Si la vidéo saute d'un côté à l'autre, elle ne traverse pas l'écran :
      // elle réapparaît directement de l'autre côté, en fondu
      const avant = d.dataset.ecart === undefined ? ecart : parseInt(d.dataset.ecart, 10);
      const saut = Math.abs(ecart - avant) > 1;
      d.dataset.ecart = ecart;
      if (saut) {
        d.style.transition = 'none';
        d.style.opacity = 0;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          d.style.transition = '';
          d.style.opacity = loin === 1 ? 0.55 : 0;
        }));
      }
      d.style.transform = loin === 0 ? 'none'
        : 'translateX(' + (ecart * 78) + '%) translateZ(' + (-260 * loin) + 'px) rotateY(' + (-cote * 38) + 'deg)';
      if (!saut) d.style.opacity = loin === 0 ? 1 : loin === 1 ? 0.55 : 0;
      d.style.filter = loin === 0 ? 'none' : 'brightness(0.6)';
      d.style.zIndex = 10 - loin;
      d.classList.toggle('active', loin === 0);
      d.setAttribute('aria-hidden', loin === 0 ? 'false' : 'true');
    });
    points.forEach((p, i) => p.setAttribute('aria-selected', i === actif ? 'true' : 'false'));
  }

  function aller(i) {
    actif = (i + n) % n;
    placer();
    // la nouvelle vidéo active repart du début
    const fenetre = diapos[actif].querySelector('iframe').contentWindow;
    if (fenetre) fenetre.postMessage('novimo-rejouer', '*');
    // sécurité : si on ne reçoit pas le signal de fin, on avance quand même
    clearTimeout(secours);
    secours = setTimeout(() => aller(actif + 1), 20000);
  }

  // Quand la vidéo active a fini, on passe à la suivante
  window.addEventListener('message', (e) => {
    if (e.data !== 'novimo-fin') return;
    const active = diapos[actif].querySelector('iframe');
    if (active && e.source === active.contentWindow) aller(actif + 1);
  });

  racine.querySelectorAll('.carrousel-fleche').forEach((b) =>
    b.addEventListener('click', () => aller(actif + parseInt(b.dataset.sens, 10))));
  diapos.forEach((d, i) => d.addEventListener('click', () => { if (i !== actif) aller(i); }));

  // Glisser le doigt (ou la souris) vers la gauche / droite
  let departX = null;
  racine.addEventListener('pointerdown', (e) => { departX = e.clientX; });
  racine.addEventListener('pointerup', (e) => {
    if (departX === null) return;
    const dx = e.clientX - departX;
    if (Math.abs(dx) > 50) aller(actif + (dx < 0 ? 1 : -1));
    departX = null;
  });
  // Clavier : flèches gauche / droite quand le carrousel a le focus
  racine.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') aller(actif + 1);
    if (e.key === 'ArrowLeft') aller(actif - 1);
  });

  placer();
  secours = setTimeout(() => aller(actif + 1), 20000);
})();

/* =====================================================
   ORDINATEUR : 3 vidéos 16:9 qui défilent sur l'écran
   - on passe à la suivante quand la vidéo a fini, ou avec les flèches / points
   - ✏️ pour changer un exemple, modifie la liste ci-dessous
   ===================================================== */
(function ordinateur() {
  const racine = document.getElementById('ordinateur');
  if (!racine) return;

  // Le clavier du MacBook : une rangée = une liste de largeurs de touches
  const clavier = racine.querySelector('.mac-clavier');
  if (clavier) {
    const RANGEES = [
      { h: 0.62, touches: Array(14).fill(1) },                          // touches de fonction
      { h: 1, touches: Array(13).fill(1).concat(1.5) },
      { h: 1, touches: [1.5].concat(Array(13).fill(1)) },
      { h: 1, touches: [1.8].concat(Array(11).fill(1), 1.8) },
      { h: 1, touches: [2.35].concat(Array(10).fill(1), 2.35) },
      { h: 1, touches: [1, 1, 1, 1.25, 5.4, 1.25, 1, 'fleches'] }
    ];
    RANGEES.forEach((r) => {
      const rangee = document.createElement('div');
      rangee.className = 'mac-rangee';
      rangee.style.flexGrow = r.h;
      r.touches.forEach((l) => {
        const t = document.createElement('span');
        if (l === 'fleches') { t.className = 'mac-fleches'; t.style.flexGrow = 3; t.innerHTML = '<i></i><i></i><i></i><i></i>'; }
        else t.style.flexGrow = l;
        rangee.appendChild(t);
      });
      clavier.appendChild(rangee);
    });
  }
  const EXEMPLES = [
    {
      bulle: 'Spot 30 secondes · 16:9',
      titre: 'Pour YouTube, <span class="accent">la TV</span> et votre vitrine',
      texte: 'Une vraie pub en six scènes : votre nom, l\u2019accroche, vos offres, votre argument, comment commander et l\u2019appel à l\u2019action. Ici, le spot de Novimo.',
      src: 'spot-30s.html?integre=1&format=paysage',
      nom: 'Spot de 30 secondes de Novimo'
    },
    {
      bulle: 'Écran de vitrine · 16:9',
      titre: 'Votre carte, <span class="accent">sur grand écran</span>',
      texte: 'Vos produits et vos prix qui s’affichent un par un, avec un bandeau qui défile : pour la TV de votre boutique ou votre vitrine.',
      src: 'menu-vitrine.html?integre=1&format=paysage',
      nom: 'Animation menu de vitrine en 16:9'
    },
    {
      bulle: 'Tous formats · 16:9',
      titre: 'Un seul studio, <span class="accent">tous vos écrans</span>',
      texte: 'La même animation livrée en carré pour Instagram, en vertical pour TikTok et les Reels, et en 16:9 pour YouTube et la TV.',
      src: 'formats-ecrans.html?integre=1&format=paysage',
      nom: 'Animation des formats carré, vertical et 16:9'
    }
  ];
  const iframe = racine.querySelector('iframe');
  const zonePoints = racine.querySelector('.carrousel-points');
  let actif = 0;
  let secours;

  const points = EXEMPLES.map((ex, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', ex.nom);
    b.addEventListener('click', () => aller(i));
    zonePoints.appendChild(b);
    return b;
  });

  function aller(i) {
    actif = (i + EXEMPLES.length) % EXEMPLES.length;
    const ex = EXEMPLES[actif];
    // les textes changent en fondu
    const texte = racine.querySelector('.exemple-spot-texte');
    texte.classList.add('change');
    setTimeout(() => {
      document.getElementById('ordi-bulle').textContent = ex.bulle;
      document.getElementById('ordi-titre').innerHTML = ex.titre;
      document.getElementById('ordi-texte').textContent = ex.texte;
      texte.classList.remove('change');
    }, 250);
    iframe.src = ex.src;
    iframe.title = ex.nom;
    points.forEach((p, j) => p.setAttribute('aria-selected', j === actif ? 'true' : 'false'));
    // sécurité : si on ne reçoit pas le signal de fin, on avance quand même
    clearTimeout(secours);
    secours = setTimeout(() => aller(actif + 1), 40000);
  }

  window.addEventListener('message', (e) => {
    if (e.data === 'novimo-fin' && e.source === iframe.contentWindow) aller(actif + 1);
  });
  racine.querySelectorAll('.carrousel-fleche').forEach((b) =>
    b.addEventListener('click', () => aller(actif + parseInt(b.dataset.sens, 10))));

  points[0].setAttribute('aria-selected', 'true');
  secours = setTimeout(() => aller(1), 40000);
})();
