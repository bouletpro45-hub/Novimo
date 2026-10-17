/* =========================================================
   🎬 MODELES.JS — le catalogue de la page "Modèles"
   ---------------------------------------------------------
   Chaque modèle = une animation prête que le client personnalise.
     fichier : l'animation (à la racine du dossier motion-design)
     formats : 'vertical' (9:16), 'carre' (1:1), 'paysage' (16:9)
     duree   : en secondes (sert au tri et aux filtres)
     tarif   : 'modele', 'modeleLong' ou 'modeleSpot' (prix dans reglages.js)
     textes  : les textes de départ (le client les change dans l'éditeur)
     palette : les couleurs de départ (voir PALETTES_MODELES)
   Pour ajouter un modèle : copie un bloc { ... }, change l'id et les textes.
   ========================================================= */

const PALETTES_MODELES = {
  citron:  { nom: 'Noir et citron',   fond: '#0b0c09', fond2: '#1c1e15', accent: '#d4ff3f', texte: '#f2f0e8', texteDoux: '#a3a59a' },
  nuit:    { nom: 'Nuit et or',       fond: '#0b1430', fond2: '#1c2f63', accent: '#e6b85c', texte: '#f6efe0', texteDoux: '#b9bfd6' },
  rose:    { nom: 'Bordeaux et rose', fond: '#3a0d1a', fond2: '#62182d', accent: '#ffb3c1', texte: '#fff1f3', texteDoux: '#e6b9c3' },
  foret:   { nom: 'Forêt et menthe',  fond: '#0d2a22', fond2: '#174536', accent: '#7ff0c4', texte: '#effaf5', texteDoux: '#a9cfc0' },
  ocean:   { nom: 'Océan',            fond: '#06243a', fond2: '#0b3a5c', accent: '#4fd1ff', texte: '#eaf7ff', texteDoux: '#9cc3d8' },
  lavande: { nom: 'Lavande',          fond: '#1b1530', fond2: '#2c2350', accent: '#b9a6ff', texte: '#f3f0ff', texteDoux: '#b7aed6' },
  mono:    { nom: 'Noir et blanc',    fond: '#0a0a0a', fond2: '#1c1c1c', accent: '#ffffff', texte: '#ffffff', texteDoux: '#9a9a9a' },
  creme:   { nom: 'Crème et rouge',   fond: '#f4ede1', fond2: '#ffffff', accent: '#d7322a', texte: '#1d1a17', texteDoux: '#6e655c' },
  corail:  { nom: 'Pêche et corail',  fond: '#fff4ee', fond2: '#ffe3d6', accent: '#ff5a36', texte: '#2a1610', texteDoux: '#8a5d4e' },
  papier:  { nom: 'Papier et encre',  fond: '#f4f2ec', fond2: '#e8e5dc', accent: '#161616', texte: '#161616', texteDoux: '#6f6c64' },
  sable:   { nom: 'Sable et terre',   fond: '#e9dfcf', fond2: '#dccdb5', accent: '#8a5a35', texte: '#2b2119', texteDoux: '#6e5e4f' },
  luxe:    { nom: 'Noir et or',       fond: '#0f0e0c', fond2: '#1c1a16', accent: '#c9a96a', texte: '#f2ece0', texteDoux: '#9c9484' },
  beton:   { nom: 'Béton et orange',  fond: '#d6d4cf', fond2: '#f0eeea', accent: '#ff4d00', texte: '#111111', texteDoux: '#444444' },
  retro:   { nom: 'Rétro 70s',        fond: '#f4e4c1', fond2: '#f0cf8f', accent: '#e4572e', texte: '#3a2214', texteDoux: '#2f6f62' },
  neon:    { nom: 'Néon rose',        fond: '#07051a', fond2: '#160f3a', accent: '#ff2ea6', texte: '#fdf4ff', texteDoux: '#a59fd6' },
  pastel:  { nom: 'Pastel violet',    fond: '#fde7ef', fond2: '#fffaf0', accent: '#7b5cff', texte: '#2b2145', texteDoux: '#7a6e93' },
  menthe:  { nom: 'Menthe et corail', fond: '#dff5ec', fond2: '#ffffff', accent: '#ff7a59', texte: '#173a30', texteDoux: '#55796d' },
  suisse:  { nom: 'Blanc et rouge',   fond: '#f3f2ee', fond2: '#ffffff', accent: '#e3241b', texte: '#111111', texteDoux: '#5f5f5f' }
};

// Les polices proposées pour les titres (Google Fonts)
const POLICES_MODELES = ['Bricolage Grotesque', 'Anton', 'Playfair Display', 'Space Grotesk', 'DM Serif Display', 'Inter', 'Fraunces', 'Unbounded', 'Fredoka'];

// Les directions artistiques (filtre "Style")
const STYLES_MODELES = ['Audacieux', 'Minimaliste', 'Moderne', 'Éditorial', 'Brutaliste', 'Rétro', 'Néon', 'Pastel', 'Suisse'];

// Les catégories (filtre "Usage")
const CATEGORIES_MODELES = ['Promo et ventes', 'Nouveautés', 'Événements', 'Logo et marque', 'Infos pratiques', 'Réseaux sociaux', 'Recrutement', 'YouTube et TV'];

/* Les champs modifiables de chaque style du fichier pret.html
   (cle = nom du réglage, nom = ce qui est affiché au client) */
const CHAMPS_PRET = {
  promo:     [['ligne1', 'Accroche'], ['ligne2', 'Le gros texte (ex. -30%)'], ['ligne3', 'Détail de l\'offre'], ['ligne4', 'Date ou condition'], ['appel', 'Bouton'], ['marque', 'Votre marque']],
  nouveau:   [['ligne1', 'Le mot qui apparaît'], ['ligne2', 'Nom du produit'], ['ligne3', 'Petite phrase'], ['appel', 'Bouton'], ['marque', 'Votre marque']],
  evenement: [['ligne1', 'Jour (ex. 12)'], ['ligne2', 'Mois'], ['ligne3', 'Nom de l\'événement'], ['ligne4', 'Heure et lieu'], ['appel', 'Bouton'], ['marque', 'Votre marque']],
  chiffres:  [['ligne1', 'Titre'], ['chiffre1', 'Chiffre 1'], ['texte1', 'Légende 1'], ['chiffre2', 'Chiffre 2'], ['texte2', 'Légende 2'], ['chiffre3', 'Chiffre 3'], ['texte3', 'Légende 3'], ['marque', 'Votre marque']],
  recrute:   [['ligne1', 'Titre'], ['ligne2', 'Le poste'], ['ligne3', 'Contrat'], ['ligne4', 'Lieu'], ['appel', 'Bouton'], ['marque', 'Votre marque']],
  horaires:  [['ligne1', 'Titre'], ['ligne2', 'Petite pastille'], ['liste', 'Horaires (jour : heures, séparés par |)'], ['marque', 'Votre marque']],
  merci:     [['ligne1', 'Le grand mot'], ['ligne2', 'Le chiffre fêté'], ['ligne3', 'Petite phrase'], ['marque', 'Votre marque']],
  citation:  [['ligne1', 'La citation'], ['ligne2', 'Auteur'], ['marque', 'Votre marque']],
  lancement: [['ligne1', 'Titre'], ['ligne2', 'Adresse du site ou de l\'appli'], ['ligne3', 'Petite phrase'], ['appel', 'Bouton'], ['marque', 'Votre marque']],
  teaser:    [['ligne1', 'Le mot'], ['ligne2', 'La date'], ['marque', 'Votre marque']]
};
const DUREES_PRET = { promo: 8, nouveau: 7, evenement: 9, chiffres: 9, recrute: 8, horaires: 9, merci: 7, citation: 10, lancement: 8, teaser: 6 };

// Raccourci pour les modèles de pret.html (tous les formats, prix "court")
const pret = (id, nom, categorie, style, palette, textes, extra) => Object.assign({
  id, nom, categorie, palette, textes,
  fichier: 'pret.html',
  fixe: { style },
  formats: ['vertical', 'carre', 'paysage'],
  duree: DUREES_PRET[style],
  tarif: 'modele',
  champs: CHAMPS_PRET[style]
}, extra || {});

const MODELES = [
  /* ---------- Promo et ventes ---------- */
  pret('soldes', 'Soldes', 'Promo et ventes', 'promo', 'citron',
    { ligne1: 'Soldes d\'hiver', ligne2: '-30%', ligne3: 'sur toute la boutique', ligne4: 'Jusqu\'au 31 janvier', appel: 'J\'en profite', marque: 'Votre marque' }, { populaire: 1 }),
  pret('black-friday', 'Black Friday', 'Promo et ventes', 'promo', 'mono',
    { ligne1: 'Black Friday', ligne2: '-50%', ligne3: 'seulement ce week-end', ligne4: '24 h chrono', appel: 'Voir les offres', marque: 'Votre marque' }),
  pret('fete-des-meres', 'Offre fête des mères', 'Promo et ventes', 'promo', 'rose',
    { ligne1: 'Fête des mères', ligne2: '-15%', ligne3: 'sur tous les coffrets', ligne4: 'Livraison offerte', appel: 'Offrir', marque: 'Votre marque' }),
  pret('code-promo', 'Code promo', 'Promo et ventes', 'promo', 'ocean',
    { ligne1: 'Code promo', ligne2: 'BIENVENUE', ligne3: '10 % sur votre première commande', ligne4: 'Valable 7 jours', appel: 'Commander', marque: 'Votre marque' }),
  { id: 'promo-boutique', nom: 'Offre de la semaine', categorie: 'Promo et ventes', fichier: 'promo-commerce.html',
    formats: ['vertical', 'carre'], duree: 10, tarif: 'modele', palette: 'nuit', populaire: 3,
    textes: { marque: 'Votre marque', typeCommerce: 'Votre activité', accroche: 'Cette semaine seulement', offre: '-20%', detailOffre: 'sur une sélection', texteBadge: 'OFFRE SPÉCIALE', appel: 'Suivez-nous', reseau: '@votremarque', infos: 'Ouvert 7 jours sur 7' },
    champs: [['marque', 'Votre marque'], ['typeCommerce', 'Votre activité'], ['accroche', 'Accroche'], ['offre', 'Le gros texte'], ['detailOffre', 'Détail'], ['texteBadge', 'Texte du badge rond'], ['appel', 'Appel à l\'action'], ['reseau', 'Votre compte'], ['infos', 'Infos pratiques']] },

  /* ---------- Nouveautés ---------- */
  pret('nouvelle-collection', 'Nouvelle collection', 'Nouveautés', 'nouveau', 'creme',
    { ligne1: 'Nouveau', ligne2: 'Collection printemps', ligne3: 'Disponible dès maintenant', appel: 'Découvrir', marque: 'Votre marque' }, { populaire: 2 }),
  pret('nouveau-menu', 'Nouveau menu', 'Nouveautés', 'nouveau', 'corail',
    { ligne1: 'Nouveau', ligne2: 'Le menu d\'été', ligne3: 'À goûter dès aujourd\'hui', appel: 'Réserver', marque: 'Votre marque' }),
  { id: 'produit-vedette', nom: 'Produit vedette', categorie: 'Nouveautés', fichier: 'produit-vedette.html',
    formats: ['vertical', 'carre', 'paysage'], duree: 9, tarif: 'modele', palette: 'citron',
    textes: { marque: 'Votre marque', slogan: 'Votre slogan', surtitre: 'Nouveauté', nomProduit: 'Votre produit phare', prix: '49 €', anneau: 'VOTRE MARQUE ✦ NOUVEAUTÉ ✦ ' },
    champs: [['surtitre', 'Petit titre'], ['nomProduit', 'Nom du produit'], ['prix', 'Prix'], ['anneau', 'Texte qui tourne'], ['marque', 'Votre marque'], ['slogan', 'Slogan']] },
  pret('teaser', 'Teaser « Bientôt »', 'Nouveautés', 'teaser', 'mono',
    { ligne1: 'Bientôt', ligne2: 'Le 1er mars', marque: 'Votre marque' }),
  pret('teaser-lavande', 'Teaser élégant', 'Nouveautés', 'teaser', 'lavande',
    { ligne1: 'Révélation', ligne2: 'Ce vendredi, 18 h', marque: 'Votre marque' }),

  /* ---------- Événements ---------- */
  pret('soiree', 'Soirée d\'ouverture', 'Événements', 'evenement', 'citron',
    { ligne1: '12', ligne2: 'Mars', ligne3: 'Soirée d\'ouverture', ligne4: '19 h · 12 rue des Arts, Lyon', appel: 'Entrée libre', marque: 'Votre marque' }),
  pret('atelier', 'Atelier ou masterclass', 'Événements', 'evenement', 'foret',
    { ligne1: '24', ligne2: 'Avril', ligne3: 'Atelier découverte', ligne4: '14 h · places limitées', appel: 'Je m\'inscris', marque: 'Votre marque' }),
  pret('webinaire', 'Webinaire', 'Événements', 'evenement', 'ocean',
    { ligne1: '05', ligne2: 'Juin', ligne3: 'Webinaire gratuit', ligne4: '12 h 30 · en ligne', appel: 'Réserver ma place', marque: 'Votre marque' }),

  /* ---------- Logo et marque ---------- */
  { id: 'logo-dessine', nom: 'Logo qui se dessine', categorie: 'Logo et marque', fichier: 'logo-reveal.html',
    formats: ['carre', 'vertical'], duree: 5, tarif: 'modele', palette: 'nuit', populaire: 4,
    textes: { marque: 'Votre marque', slogan: 'Votre slogan ici', symbole: 'etoile' },
    champs: [['marque', 'Votre marque'], ['slogan', 'Slogan']], symboles: true },
  { id: 'logo-citron', nom: 'Logo néon', categorie: 'Logo et marque', fichier: 'logo-reveal.html',
    formats: ['carre', 'vertical'], duree: 5, tarif: 'modele', palette: 'citron',
    textes: { marque: 'Votre marque', slogan: 'Votre slogan ici', symbole: 'ciseaux' },
    champs: [['marque', 'Votre marque'], ['slogan', 'Slogan']], symboles: true },
  { id: 'typo-choc', nom: 'Typo choc', categorie: 'Logo et marque', fichier: 'typo-choc.html',
    formats: ['vertical', 'carre', 'paysage'], duree: 8, tarif: 'modele', palette: 'citron', populaire: 5,
    textes: { marque: 'Votre marque', slogan: 'Votre slogan', annonce: 'VOTRE | MESSAGE', info: 'Une info en plus', bandeau: 'VOTRE MARQUE ✦ ' },
    champs: [['annonce', 'Grand message (| = à la ligne)'], ['info', 'Petite bulle'], ['bandeau', 'Texte des bandeaux'], ['marque', 'Votre marque'], ['slogan', 'Slogan']] },
  pret('citation', 'Votre manifeste', 'Logo et marque', 'citation', 'nuit',
    { ligne1: 'On ne vend pas des produits, on crée des souvenirs.', ligne2: 'La fondatrice', marque: 'Votre marque' }),
  pret('citation-claire', 'Citation claire', 'Logo et marque', 'citation', 'creme',
    { ligne1: 'Fait main, avec patience et beaucoup d\'amour.', ligne2: 'L\'équipe', marque: 'Votre marque' }),
  { id: 'texte-anime', nom: 'Phrase mot à mot', categorie: 'Réseaux sociaux', fichier: 'texte-anime.html',
    formats: ['carre', 'vertical'], duree: 9, tarif: 'modele', palette: 'nuit',
    textes: { phrase: 'Votre *message* | qui donne | envie, | en *8 secondes*.', etiquette: 'Votre marque', signature: '@votremarque' },
    champs: [['phrase', 'Phrase (| = à la ligne, *mot* = en couleur)'], ['etiquette', 'Petit nom en haut'], ['signature', 'Ligne du bas']] },

  /* ---------- Infos pratiques ---------- */
  pret('horaires', 'Horaires d\'ouverture', 'Infos pratiques', 'horaires', 'foret',
    { ligne1: 'Nos horaires', ligne2: 'Ouvert aujourd\'hui', liste: 'Lundi – Vendredi : 9 h – 19 h|Samedi : 10 h – 18 h|Dimanche : fermé', marque: 'Votre marque' }),
  pret('horaires-fetes', 'Horaires des fêtes', 'Infos pratiques', 'horaires', 'rose',
    { ligne1: 'Pendant les fêtes', ligne2: 'Horaires spéciaux', liste: '24 décembre : 9 h – 16 h|25 décembre : fermé|31 décembre : 9 h – 16 h', marque: 'Votre marque' }),
  pret('chiffres', 'Vos chiffres clés', 'Infos pratiques', 'chiffres', 'citron',
    { ligne1: 'En quelques chiffres', chiffre1: '12', texte1: 'ans d\'expérience', chiffre2: '3000', texte2: 'clients', chiffre3: '100', texte3: '% fait maison', marque: 'Votre marque' }),
  { id: 'menu-ecran', nom: 'Menu ou carte des prix', categorie: 'YouTube et TV', fichier: 'menu-vitrine.html',
    formats: ['paysage'], duree: 13, tarif: 'modeleLong', palette: 'creme',
    textes: { surTitre: 'La carte', marque: 'Votre marque', phrase: 'Votre phrase de présentation.', pastille: 'Une info qui compte' },
    champs: [['surTitre', 'Petit titre'], ['marque', 'Votre marque'], ['phrase', 'Phrase'], ['pastille', 'Pastille']],
    note: 'Les lignes de la carte (produits et prix) sont refaites avec vous après la commande.' },

  /* ---------- Réseaux sociaux ---------- */
  pret('merci-abonnes', 'Merci aux abonnés', 'Réseaux sociaux', 'merci', 'citron',
    { ligne1: 'Merci !', ligne2: '10 000 abonnés', ligne3: 'Vous êtes incroyables', marque: '@votremarque' }),
  pret('merci-clients', 'Merci aux clients', 'Réseaux sociaux', 'merci', 'corail',
    { ligne1: 'Merci', ligne2: '1 an déjà', ligne3: 'Merci de nous suivre depuis le début', marque: 'Votre marque' }),
  pret('lancement-site', 'Lancement de site', 'Réseaux sociaux', 'lancement', 'ocean',
    { ligne1: 'C\'est en ligne !', ligne2: 'www.votresite.fr', ligne3: 'Notre nouveau site est ouvert', appel: 'Visiter', marque: 'Votre marque' }),
  pret('lancement-appli', 'Lancement d\'appli', 'Réseaux sociaux', 'lancement', 'lavande',
    { ligne1: 'Disponible !', ligne2: 'App Store · Google Play', ligne3: 'Notre appli est sortie', appel: 'Télécharger', marque: 'Votre marque' }),
  { id: 'vitrine-appli', nom: 'Style appli', categorie: 'Réseaux sociaux', fichier: 'vitrine-ui.html',
    formats: ['vertical', 'carre', 'paysage'], duree: 16, tarif: 'modeleLong', textes: {}, fixe: { demo: 'novimo' }, champs: [],
    note: 'Les écrans (score, icône, bouton) sont refaits avec vos textes et vos couleurs après la commande.' },
  { id: 'vitrine-cafe', nom: 'Style appli · café', categorie: 'Réseaux sociaux', fichier: 'vitrine-ui.html',
    formats: ['vertical', 'carre', 'paysage'], duree: 16, tarif: 'modeleLong', textes: {}, fixe: { demo: 'cafe' }, champs: [],
    note: 'Les écrans sont refaits avec vos textes et vos couleurs après la commande.' },

  /* ---------- Recrutement ---------- */
  pret('recrute', 'On recrute', 'Recrutement', 'recrute', 'citron',
    { ligne1: 'On recrute', ligne2: 'Vendeur ou vendeuse', ligne3: 'CDI', ligne4: 'Lyon', appel: 'Postulez', marque: 'Votre marque' }),
  pret('recrute-stage', 'Offre de stage', 'Recrutement', 'recrute', 'ocean',
    { ligne1: 'Stage', ligne2: 'Assistant marketing', ligne3: '6 mois', ligne4: 'Télétravail possible', appel: 'Candidater', marque: 'Votre marque' }),

  /* ---------- YouTube et TV ---------- */
  { id: 'spot-30', nom: 'Spot 30 secondes', categorie: 'YouTube et TV', fichier: 'spot-30s.html',
    formats: ['paysage'], duree: 30, tarif: 'modeleSpot', palette: 'citron', populaire: 6,
    textes: { marque: 'Votre marque', slogan: 'Votre slogan, en mouvement.', accroche1: 'Votre accroche|en deux lignes.', accroche2: 'Votre promesse|ici.', titreOffres: 'Nos offres', titreEtapes: 'Comment ça marche', appel: 'Contactez-nous', reseau: '@votremarque' },
    champs: [['marque', 'Votre marque'], ['accroche1', 'Accroche 1 (| = à la ligne)'], ['accroche2', 'Accroche 2'], ['titreOffres', 'Titre des offres'], ['titreEtapes', 'Titre des étapes'], ['slogan', 'Slogan de fin'], ['appel', 'Bouton de fin'], ['reseau', 'Votre compte']],
    note: 'Les offres, prix et étapes sont refaits avec vous après la commande.' },
  { id: 'tous-ecrans', nom: 'Tous vos écrans', categorie: 'YouTube et TV', fichier: 'formats-ecrans.html',
    formats: ['paysage'], duree: 13, tarif: 'modeleLong', palette: 'citron',
    textes: { marque: 'Votre marque', contenu: 'Votre pub ici', conclusion: 'Une seule vidéo.|Tous vos écrans.' },
    champs: [['contenu', 'Texte dans le cadre'], ['conclusion', 'Phrase de fin (| = à la ligne)']] }
];

/* ---------- Les modèles "directions artistiques" (fichier directions.html) ----------
   Une mise en page par DA, déclinée pour chaque usage.
   Ordre des textes : [petit titre, grand titre (| = à la ligne), détail, info, bouton] */
const CHAMPS_DA = [['ligne1', 'Petit titre'], ['ligne2', 'Grand titre (| = à la ligne)'], ['ligne3', 'Détail'], ['ligne4', 'Info en plus'], ['appel', 'Bouton (vide = pas de bouton)'], ['marque', 'Votre marque']];
const NOMS_DA = { minimal: 'Minimaliste', moderne: 'Moderne', editorial: 'Éditorial', brutal: 'Brutaliste', retro: 'Rétro', neon: 'Néon', pastel: 'Pastel', suisse: 'Suisse' };
const da = (id, nom, categorie, cle, palette, [ligne1, ligne2, ligne3, ligne4, appel]) => ({
  id, nom, categorie, palette, style: NOMS_DA[cle],
  textes: { ligne1, ligne2, ligne3, ligne4, appel, marque: 'Votre marque' },
  fichier: 'directions.html',
  fixe: { da: cle },
  formats: ['vertical', 'carre', 'paysage'],
  duree: 8,
  tarif: 'modele',
  champs: CHAMPS_DA
});

MODELES.push(
  /* Minimaliste : beaucoup d'air, traits fins */
  da('mini-soldes', 'Soldes discrètes', 'Promo et ventes', 'minimal', 'papier', ['Édition limitée', 'Moins 20 %|sur la collection', 'Des pièces choisies, à prix doux.', 'Jusqu’au 15 mars', 'Découvrir']),
  da('mini-collection', 'Collection épurée', 'Nouveautés', 'minimal', 'mono', ['Nouvelle collection', 'Printemps|été', 'Des lignes simples, des matières vraies.', 'En boutique', 'Voir la collection']),
  da('mini-expo', 'Vernissage', 'Événements', 'minimal', 'papier', ['Exposition', 'Formes|& silences', 'Vernissage le jeudi 12 juin à 19 h.', 'Entrée libre', 'Réserver']),
  da('mini-recrute', 'Offre d’emploi sobre', 'Recrutement', 'minimal', 'sable', ['Nous recrutons', 'Designer|produit', 'CDI · Paris · Télétravail partiel', 'Candidatures ouvertes', 'Postuler']),
  da('mini-manifeste', 'Manifeste minimal', 'Logo et marque', 'minimal', 'mono', ['Manifeste', 'Moins,|mais mieux.', 'Votre phrase de marque, simplement.', '', 'En savoir plus']),
  da('mini-fermeture', 'Fermeture exceptionnelle', 'Infos pratiques', 'minimal', 'papier', ['Information', 'Fermeture|exceptionnelle', 'Le magasin sera fermé le lundi 14 juillet.', 'Réouverture mardi 9 h', '']),

  /* Moderne : formes floues, carte en verre */
  da('mod-flash', 'Offre flash', 'Promo et ventes', 'moderne', 'lavande', ['Offre flash', '-40 %|aujourd’hui', 'Sur toute la boutique en ligne', 'Code : FLASH40', 'J’en profite']),
  da('mod-appli', 'Appli disponible', 'Réseaux sociaux', 'moderne', 'ocean', ['Nouveau', 'Votre appli|est là', 'Réservez en 3 clics, où que vous soyez.', 'iOS et Android', 'Télécharger']),
  da('mod-live', 'Live gratuit', 'Événements', 'moderne', 'citron', ['Live gratuit', 'Boostez vos|ventes en ligne', 'Jeudi 20 h · 45 minutes', 'Places limitées', 'S’inscrire']),
  da('mod-recrute', 'On recrute (moderne)', 'Recrutement', 'moderne', 'nuit', ['On recrute', 'Développeur|full-stack', 'Rejoignez une équipe de 12 passionnés.', 'CDI · Lyon', 'Postuler']),
  da('mod-abonnes', 'Cap des abonnés', 'Réseaux sociaux', 'moderne', 'foret', ['Merci', '50 000|abonnés', 'Vous êtes la meilleure communauté.', '@votremarque', '']),
  da('mod-produit', 'Lancement produit', 'Nouveautés', 'moderne', 'citron', ['Nouveauté', 'Le modèle|Air 2', 'Plus léger, plus rapide, plus durable.', 'Dès 129 €', 'Commander']),
  da('mod-video', 'Nouvelle vidéo', 'YouTube et TV', 'moderne', 'ocean', ['Nouvelle vidéo', 'Nos 5|astuces', 'Pour mieux vendre sur Instagram.', 'Épisode 12', 'Regarder']),

  /* Éditorial : une couverture de magazine */
  da('edi-collection', 'Couverture de magazine', 'Nouveautés', 'editorial', 'creme', ['Collection', 'L’Été|indien', 'Une ode à la lumière et aux matières naturelles.', 'N°07', 'Découvrir']),
  da('edi-soiree', 'Soirée privée', 'Événements', 'editorial', 'luxe', ['Soirée privée', 'Une nuit|à Paris', 'Le 21 juin, sur invitation.', 'N°12', 'Répondre']),
  da('edi-vision', 'Notre vision', 'Logo et marque', 'editorial', 'luxe', ['Notre vision', 'L’élégance|est une attitude', 'La fondatrice', 'Manifeste', '']),
  da('edi-menu', 'Menu de saison', 'Infos pratiques', 'editorial', 'creme', ['La carte', 'Menu|d’automne', 'Cèpes, potimarron et châtaignes.', 'Du mardi au samedi', 'Réserver']),
  da('edi-ventes', 'Ventes privées', 'Promo et ventes', 'editorial', 'rose', ['Ventes privées', 'Trente pour cent|de remise', 'Sur une sélection de pièces d’exception.', 'Du 3 au 7 mai', 'Accéder']),
  da('edi-recrute', 'Maison qui recrute', 'Recrutement', 'editorial', 'nuit', ['Carrières', 'Chef|de rang', 'Notre maison recrute pour la saison.', 'CDI · Bordeaux', 'Candidater']),
  da('edi-reportage', 'Reportage', 'YouTube et TV', 'editorial', 'creme', ['Reportage', 'Les mains|du métier', 'Rencontre avec nos artisans.', 'Épisode 3', 'Regarder']),

  /* Brutaliste : gros blocs, bords épais, bandeaux */
  da('bru-soldes', 'Soldes brutes', 'Promo et ventes', 'brutal', 'beton', ['Soldes', '-70%|tout doit|partir', 'Derniers jours', 'Stock limité', 'Foncer']),
  da('bru-drop', 'Drop streetwear', 'Nouveautés', 'brutal', 'citron', ['Drop', 'Nouvelle|capsule', 'Vendredi 18 h, en ligne', '100 pièces', 'Voir le drop']),
  da('bru-concert', 'Concert ce soir', 'Événements', 'brutal', 'corail', ['Live', 'Concert|ce soir', 'Le Bloc · 21 h · 15 €', 'Presque complet', 'Billets']),
  da('bru-recrute', 'On cherche des talents', 'Recrutement', 'brutal', 'mono', ['Recrute', 'On cherche|des talents', 'Stages et alternances', 'Rejoins-nous', 'Postule']),
  da('bru-annonce', 'Grosse annonce', 'Réseaux sociaux', 'brutal', 'beton', ['Annonce', 'Grosse|nouvelle', 'On vous dit tout demain.', 'Restez connectés', 'Suivre']),
  da('bru-local', 'Fait ici', 'Logo et marque', 'brutal', 'citron', ['Marque', 'Fait|ici.', 'Produit localement, depuis 2012.', 'Made in France', 'Découvrir']),

  /* Rétro : soleil, arcs 70s, lettres qui rebondissent */
  da('ret-happy', 'Happy hour', 'Promo et ventes', 'retro', 'retro', ['Happy hour', '2 pour 1|cocktails', 'Tous les jeudis de 18 h à 20 h', 'Au bar', 'Venez !']),
  da('ret-ouverture', 'Grande ouverture', 'Événements', 'retro', 'corail', ['Grande ouverture', 'Le diner|est ouvert', 'Burgers, milkshakes et bonne humeur', 'Samedi 10 h', 'On arrive']),
  da('ret-glaces', 'Nouveau parfum', 'Nouveautés', 'retro', 'retro', ['Nouveau', 'Glaces|maison', 'Six parfums, faits chaque matin.', 'Tout l’été', 'Goûter']),
  da('ret-anniv', '10 ans ensemble', 'Réseaux sociaux', 'retro', 'sable', ['Merci', '10 ans|ensemble', 'Merci de faire partie de l’aventure.', 'Depuis 2016', '']),
  da('ret-horaires', 'Horaires d’été', 'Infos pratiques', 'retro', 'corail', ['Horaires d’été', 'Ouvert|7 j / 7', 'De 8 h à 22 h, tout l’été.', 'Terrasse ouverte', '']),
  da('ret-job', 'Job d’été', 'Recrutement', 'retro', 'retro', ['Job d’été', 'Serveurs|recherchés', 'Ambiance familiale, pourboires généreux', 'Juillet – août', 'Postuler']),

  /* Néon : grille synthwave, titre qui s'allume */
  da('neo-soiree', 'Soirée néon', 'Événements', 'neon', 'neon', ['Ce samedi', 'Neon|night', 'DJ set · 23 h – 5 h', 'Entrée 10 €', 'Réserver']),
  da('neo-tournoi', 'Tournoi en live', 'Réseaux sociaux', 'neon', 'ocean', ['Live Twitch', 'Tournoi|ce soir', '20 h · récompenses à gagner', '@votrechaine', 'Rejoindre']),
  da('neo-cyber', 'Cyber Monday', 'Promo et ventes', 'neon', 'neon', ['Cyber Monday', '-60 %|en ligne', 'Sur toute la tech', '24 h seulement', 'J’en profite']),
  da('neo-version', 'Nouvelle version', 'Nouveautés', 'neon', 'lavande', ['Bientôt', 'Version|2.0', 'Plus rapide. Plus fort.', '01.03', 'Découvrir']),
  da('neo-teaser', 'Teaser néon', 'Logo et marque', 'neon', 'citron', ['Teaser', 'Quelque chose|arrive', 'Restez connectés', 'Bientôt', '']),
  da('neo-chaine', 'Nouvelle chaîne', 'YouTube et TV', 'neon', 'ocean', ['Nouvelle vidéo', 'Chaque|mercredi', 'Une vidéo par semaine, à 18 h.', '@votrechaine', 'S’abonner']),

  /* Pastel : formes douces, lettres qui sautillent */
  da('pas-anniv', 'Anniversaire', 'Événements', 'pastel', 'pastel', ['Anniversaire', '3 ans|déjà !', 'Gâteau offert à tous nos clients samedi.', 'Samedi 14 h', 'On fête ça']),
  da('pas-atelier', 'Atelier enfants', 'Événements', 'pastel', 'menthe', ['Atelier', 'Pâte à sel|& paillettes', 'Pour les 4 – 10 ans, goûter compris', 'Mercredi 15 h', 'Inscrire']),
  da('pas-douceurs', 'Petits prix doux', 'Promo et ventes', 'pastel', 'corail', ['Petit prix', '-25 %|sur les douceurs', 'Toute la semaine en boutique', 'Jusqu’à dimanche', 'Miam !']),
  da('pas-merci', 'Youpi 1 000 abonnés', 'Réseaux sociaux', 'pastel', 'pastel', ['Youpi', '1 000|abonnés !', 'Merci pour tout cet amour.', '@votremarque', '']),
  da('pas-parfum', 'Parfum du moment', 'Nouveautés', 'pastel', 'menthe', ['Nouveau', 'Fraise|& basilic', 'Disponible dès aujourd’hui !', 'Édition printemps', 'Goûter']),
  da('pas-livraison', 'Livraison offerte', 'Infos pratiques', 'pastel', 'corail', ['Bonne nouvelle', 'Livraison|offerte', 'Dès 30 € d’achat, partout en France.', 'Tout le mois', 'Commander']),

  /* Suisse : grille stricte, aplat de couleur */
  da('sui-expo', 'Affiche d’exposition', 'Événements', 'suisse', 'suisse', ['Exposition 04', 'Typographie|& affiche', 'Du 3 au 28 février, galerie Nord.', 'Entrée libre', 'Programme']),
  da('sui-conference', 'Conférence', 'Événements', 'suisse', 'papier', ['Conférence', 'Design|et société', 'Mardi 18 h 30 · Amphi B', 'Gratuit', 'S’inscrire']),
  da('sui-recrute', 'Offre de studio', 'Recrutement', 'suisse', 'suisse', ['Offre 12', 'Directeur|artistique', 'Studio indépendant, 8 personnes.', 'CDI · Genève', 'Postuler']),
  da('sui-studio', 'Présentation de studio', 'Logo et marque', 'suisse', 'mono', ['Studio', 'Forme|suit|fonction', 'Architecture · Graphisme · Objets', 'Depuis 1998', 'Portfolio']),
  da('sui-livres', 'Offre librairie', 'Promo et ventes', 'suisse', 'suisse', ['Offre', '-30 %|sur les livres', 'Sélection d’ouvrages d’art et de design', 'Jusqu’au 30.11', 'Voir']),
  da('sui-horaires', 'Nouveaux horaires', 'Infos pratiques', 'suisse', 'citron', ['Nouveaux horaires', 'Lun – Sam|9 h – 19 h', 'Dimanche : fermé', 'Dès le 1er septembre', ''])
);

// Les premiers modèles (pret.html et les autres) : leur style par défaut
MODELES.forEach((m) => {
  if (m.style) return;
  m.style = /teaser/.test(m.id) ? 'Minimaliste' : m.id === 'citation-claire' ? 'Éditorial' : 'Audacieux';
});
