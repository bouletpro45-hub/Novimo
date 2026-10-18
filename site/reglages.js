/* =========================================================
   🎛️  REGLAGES.JS — LE fichier à modifier pour ton site
   ---------------------------------------------------------
   Tout ce qui est ici est utilisé par TOUTES les pages :
   change un prix ici, il change sur l'accueil ET sur les devis.
   Rappel : garde les guillemets ' ' et les virgules.
   ========================================================= */

const REGLAGES_SITE = {

  /* ---------- Tes coordonnées ---------- */
  email:     'bouletpro45@gmail.com', // ← ton adresse e-mail pro (affichée dans Contact)
  instagram: 'novimo_md',             // ← ton pseudo Instagram (sans le @)
  tiktok:    'novimo.com',            // ← ton pseudo TikTok (sans le @)

  /* ---------- Devis ---------- */
  emailDevis: 'bouletpro45@gmail.com', // ← l'adresse qui reçoit les devis (PDF) — elle n'est pas affichée sur le site
  acompte: 30,                         // ← pourcentage du prix total à verser à la signature

  /* ---------- Tes animations et leurs prix (en euros) ----------
     prix    : TON prix
     prixPro : le prix de DÉPART d'un motion designer freelance pour la même chose
               (source : baromètre Malt repris par Le Freelance, prix hors taxes).
               Il sert à afficher la comparaison "moitié moins cher".
               ⚠️ Pour que la phrase reste vraie, garde toujours prix ≤ prixPro / 2. */
  comparaison: {
    source: 'baromètre Malt des motion designers freelances, repris par Le Freelance (prix hors taxes)'
  },
  /* Les groupes de tarifs (affichés comme deux familles sur le site) */
  groupes: [
    { id: 'reseaux', nom: 'Réseaux sociaux', detail: 'Formats courts, en carré et en vertical, pour Instagram, TikTok et les stories.' },
    { id: 'identite', nom: 'Identité de marque', detail: 'Votre logo créé sur mesure, puis décliné pour tous les usages.' },
    { id: 'longs',   nom: 'YouTube et TV',   detail: 'Spots plus longs, au format horizontal 16:9 en Full HD (1920 × 1080).' },
    { id: 'modeles', nom: 'Modèles prêts',   detail: 'Une vidéo de la page Modèles, refaite avec vos textes, vos couleurs et votre logo.' }
  ],

  tarifs: [
    { id: 'logo',  groupe: 'reseaux', nom: 'Logo animé',     prix: 297, prixPro: 600,  description: 'Votre logo qui se dessine, environ quatre secondes. Idéal en début ou en fin de vidéo.' },
    { id: 'pub',   groupe: 'reseaux', nom: 'Petite pub',     prix: 147, prixPro: 300,  description: 'Six à huit secondes : votre marque, votre offre, votre compte.' },
    { id: 'pack',  groupe: 'reseaux', nom: 'Pack lancement', prix: 389, prixPro: 900,  description: 'Le logo animé et la petite pub, aux couleurs de votre marque.',
      contenu: ['logo', 'pub'] },  // contenu : les animations comprises dans le pack

    // Création de logo (pas une animation) : pas de prixPro, faute de source fiable pour la comparaison.
    // apercu : image affichée dans la carte de l'accueil (dans site/)
    { id: 'systemeLogo', groupe: 'identite', nom: 'Système de logo', prix: 397, etiquette: 'Sur mesure · 5 versions', apercu: 'systeme-logo.webp',
      description: 'On crée votre logo sur mesure, puis ses 5 versions : logo principal, logotype, symbole, icône d’appli et monochrome. Même identité, prête pour les réseaux, le site et l’impression.' },

    // prixPro du spot 60 s : "vidéo explicative de 60 secondes : dès 3 000 €" (même source).
    // prixPro du spot 30 s : la source ne donne pas de prix -> ESTIMATION = moitié du 60 s.
    { id: 'spot30', groupe: 'longs', nom: 'Spot 30 secondes', prix: 743,  prixPro: 1500, etiquette: '16:9 · 30 s',
      description: 'Une vraie pub : votre marque, vos produits, votre offre et où vous trouver. Pour YouTube, un écran en vitrine ou une diffusion TV.' },
    { id: 'spot60', groupe: 'longs', nom: 'Spot 60 secondes', prix: 1487, prixPro: 3000, etiquette: '16:9 · 60 s',
      description: 'Le temps de raconter votre histoire : votre savoir-faire, vos produits phares, vos horaires. Idéal pour YouTube et la TV locale.' },

    // Les modèles prêts (page Modèles) : moins chers car l'animation existe déjà.
    // Chaque modèle de site/modeles.js dit lequel de ces 3 prix s'applique.
    { id: 'modele',     groupe: 'modeles', nom: 'Modèle court',  prix: 89,  etiquette: 'jusqu’à 10 s',
      description: 'Un modèle prêt de moins de 10 secondes, à vos textes et à vos couleurs. Tous les formats inclus.' },
    { id: 'modeleLong', groupe: 'modeles', nom: 'Modèle long',   prix: 137, etiquette: '10 à 20 s',
      description: 'Un modèle prêt de 10 à 20 secondes (vitrine, appli, menu…), personnalisé pour vous.' },
    { id: 'modeleSpot', groupe: 'modeles', nom: 'Modèle spot',   prix: 447, etiquette: '16:9 · 30 s',
      description: 'Le spot de 30 secondes de la page Modèles, refait avec vos offres, vos étapes et votre appel à l’action.' }
  ],

  /* ---------- Les options du devis ----------
     parAnimation: true  -> le prix est multiplié par le nombre d'animations
     parAnimation: false -> prix fixe, une seule fois
     pasPour : animations auxquelles l'option ne s'applique pas */
  options: [
    { id: 'express',  nom: 'Livraison express',   detail: 'Première version sous 24 heures (formats courts).', prix: 59, parAnimation: false, pasPour: ['spot30', 'spot60', 'systemeLogo'] },
    { id: 'retouche', nom: 'Retouches en plus',   detail: 'Une troisième série de modifications.',             prix: 47, parAnimation: false },
    { id: 'paysage',  nom: 'Format paysage 16:9', detail: 'Pour vos formats courts (déjà inclus dans les spots).', prix: 37, parAnimation: true, pasPour: ['spot30', 'spot60', 'systemeLogo'] }
  ],

  /* ---------- Les onglets de la barre latérale ----------
     icone : 'maison', 'eclair', 'grille', 'film', 'etiquette', 'devis', 'bulle', 'question', 'personne' ou 'lettre' */
  onglets: [
    { nom: 'Accueil',      lien: 'index.html#haut',         icone: 'maison' },
    { nom: 'Essayer',      lien: 'index.html#essai',        icone: 'eclair' },
    { nom: 'Réalisations', lien: 'index.html#realisations', icone: 'grille' },
    { nom: 'Modèles',      lien: 'modeles.html',            icone: 'film' },
    { nom: 'Tarifs',       lien: 'index.html#tarifs',       icone: 'etiquette' },
    { nom: 'Devis',        lien: 'devis.html',              icone: 'devis' },
    { nom: 'Messages',     lien: 'messages.html',           icone: 'bulle' },
    { nom: 'FAQ',          lien: 'faq.html',                icone: 'question' },
    { nom: 'Mon compte',   lien: 'compte.html',             icone: 'personne' },
    { nom: 'Contact',      lien: 'index.html#contact',      icone: 'lettre' }
  ]
};
