/* =========================================================
   MOTEUR.JS — le "moteur" commun à toutes les animations
   ---------------------------------------------------------
   Il s'occupe de tout ce qui n'est pas créatif :
     - créer la scène 1080x1080 ou 1080x1920 et l'adapter à la fenêtre
     - les boutons Rejouer / Format / Mode propre et les raccourcis clavier
     - charger les polices Google Fonts choisies dans les réglages
     - fournir des outils simples aux modèles : anim(), lettres(), mots()...
   Tu n'as normalement pas besoin de modifier ce fichier.
   ========================================================= */

(function () {

  /* ---------- Les courbes d'accélération ----------
     Une courbe décrit COMMENT un objet bouge dans le temps.
     C'est ce qui fait la différence entre un rendu "amateur"
     (mouvement linéaire, robotique) et un rendu "pro". */
  const COURBES = {
    douce:    'cubic-bezier(0.16, 1, 0.3, 1)',   // part vite, arrive tout en douceur (la plus utilisée)
    fluide:   'cubic-bezier(0.65, 0, 0.35, 1)',  // accélère puis freine (idéal pour les transitions)
    rebond:   'cubic-bezier(0.34, 1.56, 0.64, 1)', // dépasse un peu puis revient (effet "pop")
    sortie:   'cubic-bezier(0.7, 0, 0.84, 0)',   // démarre lentement puis file (pour faire disparaître)
    lineaire: 'linear'                           // vitesse constante (rotations infinies)
  };

  const FORMATS = {
    carre:    { largeur: 1080, hauteur: 1080, nom: 'Carré 1080×1080' },
    vertical: { largeur: 1080, hauteur: 1920, nom: 'Vertical 1080×1920' },
    paysage:  { largeur: 1920, hauteur: 1080, nom: 'Paysage 1920×1080' },  // YouTube, TV
    portrait: { largeur: 1080, hauteur: 1440, nom: 'Portrait 1080×1440' }   // carrousel TikTok / Instagram (3:4)
  };

  /* Paramètres dans l'adresse (utilisés par le site Novimo) :
     ex. logo-reveal.html?integre=1&format=vertical&marque=Chez%20Mila&accent=%23ff5a36
     -> "integre" cache les boutons et rejoue l'animation en boucle. */
  const PARAMS = new URLSearchParams(location.search);
  const INTEGRE = PARAMS.has('integre');

  const etat = {
    // format demandé dans l'adresse (#vertical, ?format=paysage...), vérifié au démarrage
    format: PARAMS.get('format') || location.hash.replace('#', '') || 'carre',
    propre: false,
    decalage: 0,        // secondes d'attente avant le début (utile en mode propre)
    animations: [],
    dejaAnime: new WeakSet(),
    fin: 0,             // durée totale calculée automatiquement
    sons: [],           // les sons prévus par le modèle (voir commun/son.js)
    reglages: null,
    construire: null
  };

  let cadre, scene, infoDuree, boutonFormat;

  /* =====================================================
     OUTILS mis à disposition des modèles (objet "S")
     ===================================================== */

  /* anim(élément, étapes, début, durée, courbe, options)
     -> anime un élément. "début" et "durée" sont en SECONDES.
        étapes = [ {état de départ}, {état d'arrivée} ] */
  function anim(el, etapes, debut, duree, courbe, options) {
    options = options || {};
    const vitesse = etat.reglages.vitesse || 1;
    const infini = options.iterations === Infinity;

    // Si l'élément a déjà une animation, la suivante ne doit pas
    // "écraser" son état de départ : on utilise fill "forwards".
    const fill = etat.dejaAnime.has(el) || infini ? 'forwards' : 'both';
    etat.dejaAnime.add(el);

    const a = el.animate(etapes, Object.assign({
      delay: (etat.decalage + debut / vitesse) * 1000,
      duration: (duree / vitesse) * 1000,
      easing: COURBES[courbe || 'douce'] || courbe,
      fill: fill
    }, options));

    etat.animations.push(a);
    if (!infini) etat.fin = Math.max(etat.fin, (debut + duree) / vitesse);
    return a;
  }

  /* tenir(secondes) -> garde l'image finale affichée au moins jusqu'à ce moment */
  function tenir(secondes) {
    etat.fin = Math.max(etat.fin, secondes / (etat.reglages.vitesse || 1));
  }

  /* son('whoosh', début, options) -> joue un son à ce moment (en secondes).
     Il faut charger commun/son.js dans le modèle ; sinon, rien ne se passe. */
  function son(nom, debut, options) {
    etat.sons.push({ nom: nom, t: debut / (etat.reglages.vitesse || 1), opt: options || {} });
  }

  /* creer('div', 'classe', parent) -> crée un élément et l'ajoute */
  function creer(balise, classe, parent, texte) {
    const el = document.createElement(balise);
    if (classe) el.className = classe;
    if (texte !== undefined) el.textContent = texte;
    if (parent) parent.appendChild(el);
    return el;
  }

  /* lettres(parent, "Texte") -> découpe un texte en lettres animables */
  function lettres(parent, texte) {
    return Array.from(texte).map((c) => creer('span', 'lettre', parent, c === ' ' ? ' ' : c));
  }

  /* mots(parent, "Une phrase") -> découpe en mots, chacun dans un masque */
  function mots(parent, texte) {
    const liste = [];
    texte.trim().split(/\s+/).forEach((m, i) => {
      if (i > 0) parent.appendChild(document.createTextNode(' '));
      const masque = creer('span', 'masque', parent);
      liste.push(creer('span', 'mot', masque, m));
    });
    return liste;
  }

  /* ajuster(élément, largeurMax) -> réduit la taille du texte s'il est trop long
     (pratique quand un client a un nom très long) */
  function ajuster(el, largeurMax, cibles) {
    cibles = cibles || [el];
    let taille = parseFloat(getComputedStyle(el).fontSize);
    const largeur = () => Math.max.apply(null, cibles.map((c) => c.offsetWidth));
    let securite = 80;
    while (largeur() > largeurMax && taille > 12 && securite--) {
      taille *= 0.95;
      el.style.fontSize = taille + 'px';
    }
  }

  /* symbole('lune-ble', parent) -> insère un symbole de la bibliothèque.
     On peut aussi donner directement du code SVG qui commence par "<". */
  function symbole(nom, parent) {
    const boite = creer('div', 'symbole-boite', parent);
    let contenu = '';
    if (typeof nom === 'string' && nom.trim().startsWith('<')) contenu = nom;
    else if (window.Symboles && window.Symboles[nom]) contenu = window.Symboles[nom]();
    boite.innerHTML =
      '<svg viewBox="0 0 200 200" fill="currentColor" stroke="currentColor" stroke-width="' +
      (etat.reglages.epaisseurTrait || 3.2) + '" stroke-linecap="round" stroke-linejoin="round">' + contenu + '</svg>';
    // Chaque forme : longueur normalisée à 1 (pour l'effet "dessin") et remplissage de départ
    boite.querySelectorAll('svg *').forEach((f) => {
      f.setAttribute('pathLength', '1');
      f.setAttribute('fill-opacity', f.dataset.remplissage || '0');
    });
    return boite;
  }

  /* dessiner(symbole, début, durée) -> les traits se dessinent un par un,
     puis les formes se remplissent */
  function dessiner(boite, debut, duree) {
    const traits = Array.from(boite.querySelectorAll('.trait'));
    const n = traits.length || 1;
    const dureeTrait = duree * 0.55;
    traits.forEach((t, i) => {
      const d = debut + (n > 1 ? (duree - dureeTrait) * (i / (n - 1)) : 0);
      anim(t, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], d, dureeTrait, 'fluide');
    });
    boite.querySelectorAll('[data-remplissage]').forEach((f, i) => {
      anim(f, [{ fillOpacity: 0 }, { fillOpacity: f.dataset.remplissage }], debut + duree * 0.75 + i * 0.02, 0.6, 'douce');
    });
  }

  /* hasard(graine) -> générateur de nombres "au hasard" mais toujours identiques
     (les étoiles restent à la même place à chaque fois qu'on rejoue) */
  function hasard(graine) {
    let s = graine || 1;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  /* etoiles(scène, nombre) -> petites étoiles qui scintillent en fond */
  function etoiles(parent, nombre) {
    const r = hasard(7);
    const f = FORMATS[etat.format];
    for (let i = 0; i < nombre; i++) {
      const e = creer('span', 'etoile-fond', parent);
      const taille = 2 + r() * 4;
      e.style.width = e.style.height = taille + 'px';
      e.style.left = (r() * f.largeur) + 'px';
      e.style.top = (r() * f.hauteur) + 'px';
      const max = 0.25 + r() * 0.55;
      anim(e, [{ opacity: 0 }, { opacity: max }], r() * 1.2, 1.2, 'douce');
      anim(e, [{ opacity: max }, { opacity: max * 0.2 }], 1.2 + r() * 2, 1.4 + r() * 2, 'fluide',
        { iterations: Infinity, direction: 'alternate' });
    }
  }

  /* =====================================================
     FONCTIONNEMENT DE LA PAGE
     ===================================================== */

  /* Télécharge les polices depuis Google Fonts (il faut Internet ;
     sans Internet, une police de secours est utilisée). */
  function chargerPolices(polices) {
    const noms = Object.values(polices || {}).filter(Boolean);
    // Toutes les polices n'ont pas l'italique ou le gras : on essaie
    // plusieurs variantes, de la plus complète à la plus simple.
    const variantes = [':ital,wght@0,400;0,700;1,400', ':wght@400;700', ''];
    return Promise.all(noms.map((nom) => new Promise((fini) => {
      const essayer = (n) => {
        if (n >= variantes.length) return fini();
        const lien = document.createElement('link');
        lien.rel = 'stylesheet';
        lien.href = 'https://fonts.googleapis.com/css2?family=' +
          encodeURIComponent(nom).replace(/%20/g, '+') + variantes[n] + '&display=swap';
        lien.onload = () => {
          Promise.all(['400', '700', 'italic 400'].map((g) =>
            document.fonts.load(g + ' 60px "' + nom + '"').catch(() => {}))).then(fini);
        };
        lien.onerror = () => { lien.remove(); essayer(n + 1); };
        document.head.appendChild(lien);
      };
      essayer(0);
    })));
  }

  function appliquerCouleurs() {
    const R = etat.reglages;
    const c = R.couleurs || {};
    const p = R.polices || {};
    const css = {
      '--fond': c.fond, '--fond2': c.fond2, '--accent': c.accent,
      '--texte': c.texte, '--texte-doux': c.texteDoux,
      '--police-titre': p.titre ? '"' + p.titre + '"' : null,
      '--police-texte': p.texte ? '"' + p.texte + '"' : null
    };
    Object.entries(css).forEach(([k, v]) => { if (v) scene.style.setProperty(k, v); });
  }

  function redimensionner() {
    const f = FORMATS[etat.format];
    const zone = cadre.getBoundingClientRect();
    const echelle = Math.min(zone.width / f.largeur, zone.height / f.hauteur);
    scene.style.width = f.largeur + 'px';
    scene.style.height = f.hauteur + 'px';
    scene.style.transform =
      'translate(' + (zone.width - f.largeur * echelle) / 2 + 'px,' +
      (zone.height - f.hauteur * echelle) / 2 + 'px) scale(' + echelle + ')';
  }

  function rejouer() {
    etat.animations.forEach((a) => a.cancel());
    etat.animations = [];
    etat.dejaAnime = new WeakSet();
    etat.fin = 0;
    etat.sons = [];
    scene.innerHTML = '';
    scene.className = etat.format;
    redimensionner();
    etat.construire(scene, etat.reglages, outils());
    if (infoDuree) infoDuree.textContent = 'Durée ≈ ' + etat.fin.toFixed(1).replace('.', ',') + ' s';
    // Le son (jamais dans le site : les aperçus restent muets)
    if (window.Son && !INTEGRE) Son.jouer(etat.sons, etat.decalage);

    // Intégré dans le site : on rejoue en boucle, avec une pause sur l'image finale
    clearTimeout(etat.boucle);
    if (INTEGRE) etat.boucle = setTimeout(() => {
      // On prévient la page qui contient l'animation (ex. le carrousel du site) qu'elle est finie
      if (window.parent !== window) window.parent.postMessage('novimo-fin', '*');
      rejouer();
    }, (etat.fin + 1.8) * 1000);
  }

  /* Remplace les réglages par ceux donnés dans l'adresse (si présents) */
  function lireParametres(R) {
    PARAMS.forEach((valeur, cle) => {
      if (typeof R[cle] === 'string') R[cle] = valeur;
      else if (R.couleurs && typeof R.couleurs[cle] === 'string') R.couleurs[cle] = valeur;
    });
  }

  // Les formats proposés par le modèle (REGLAGES.formats), carré + vertical par défaut
  function formatsDuModele() {
    return (etat.reglages.formats || ['carre', 'vertical']).filter((f) => FORMATS[f]);
  }

  function changerFormat() {
    const liste = formatsDuModele();
    etat.format = liste[(liste.indexOf(etat.format) + 1) % liste.length];
    history.replaceState(null, '', etat.format === liste[0] ? '#' : '#' + etat.format);
    boutonFormat.textContent = '⇄ ' + FORMATS[etat.format].nom;
    rejouer();
  }

  function modePropre(actif) {
    etat.propre = actif;
    document.body.classList.toggle('propre', actif);
    etat.decalage = actif ? 1.2 : 0; // 1,2 s d'image fixe pour avoir le temps de lancer l'enregistrement
    if (actif && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (!actif && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setTimeout(rejouer, 350); // on attend que le plein écran soit en place
  }

  function outils() {
    return {
      format: etat.format,
      vertical: etat.format === 'vertical',
      largeur: FORMATS[etat.format].largeur,
      hauteur: FORMATS[etat.format].hauteur,
      anim, tenir, son, creer, lettres, mots, ajuster, symbole, dessiner, etoiles, hasard
    };
  }

  function creerInterface() {
    cadre = creer('div', '', document.body); cadre.id = 'cadre';
    scene = creer('div', '', cadre); scene.id = 'scene';

    const barre = creer('div', '', document.body); barre.id = 'barre';
    const bRejouer = creer('button', 'principal', barre, '↻ Rejouer');
    boutonFormat = creer('button', '', barre, '⇄ ' + FORMATS[etat.format].nom);
    if (formatsDuModele().length < 2) boutonFormat.disabled = true;   // un seul format possible
    const bPropre = creer('button', '', barre, '● Mode propre (enregistrer)');
    // Boutons du son, seulement si le modèle charge commun/son.js
    if (window.Son) {
      const bSon = creer('button', '', barre, '🔊 Son activé');
      bSon.onclick = () => {
        Son.actif = !Son.actif;
        bSon.textContent = Son.actif ? '🔊 Son activé' : '🔇 Son coupé';
        rejouer();
      };
      const bWav = creer('button', '', barre, '⬇ Bande-son (.wav)');
      bWav.onclick = () => {
        bWav.disabled = true;
        Son.exporter(etat.sons, etat.fin + 0.5, (etat.reglages.titrePage || 'bande-son').replace(/[^\w-]+/g, '-') + '.wav')
          .finally(() => { bWav.disabled = false; });
      };
    }
    infoDuree = creer('span', 'info', barre, '');
    const aide = creer('span', 'info', barre);
    aide.innerHTML = '<kbd>R</kbd> rejouer · <kbd>F</kbd> format · <kbd>P</kbd> mode propre · <kbd>Échap</kbd> quitter';

    bRejouer.onclick = rejouer;
    boutonFormat.onclick = changerFormat;
    bPropre.onclick = () => modePropre(true);

    // En mode propre : un clic = rejouer, un double-clic = quitter
    cadre.addEventListener('click', () => { if (etat.propre) rejouer(); });
    cadre.addEventListener('dblclick', () => { if (etat.propre) modePropre(false); });

    document.addEventListener('keydown', (e) => {
      const t = e.key.toLowerCase();
      if (t === 'r' || t === ' ') { e.preventDefault(); rejouer(); }
      else if (t === 'f') changerFormat();
      else if (t === 'p') modePropre(!etat.propre);
      else if (t === 'escape' && etat.propre) modePropre(false);
    });
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && etat.propre) modePropre(false);
    });
    window.addEventListener('resize', redimensionner);
    // La page qui contient l'animation peut demander de la rejouer depuis le début
    window.addEventListener('message', (e) => { if (e.data === 'novimo-rejouer') rejouer(); });
  }

  /* =====================================================
     POINT D'ENTRÉE : Studio.demarrer(REGLAGES, construire)
     ===================================================== */
  window.Studio = {
    demarrer: function (reglages, construire) {
      lireParametres(reglages);
      etat.reglages = reglages;
      if (!formatsDuModele().includes(etat.format)) etat.format = formatsDuModele()[0];
      etat.construire = construire;
      if (INTEGRE) document.body.classList.add('integre');
      if (reglages.titrePage) document.title = reglages.titrePage;
      const polices = chargerPolices(reglages.polices);
      creerInterface();
      appliquerCouleurs();
      redimensionner();
      // On attend que les polices soient chargées (3 s max) pour mesurer les textes correctement
      Promise.race([polices, new Promise((r) => setTimeout(r, 3000))]).then(rejouer);
    }
  };
})();
