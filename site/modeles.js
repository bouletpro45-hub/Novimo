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
  corail:  { nom: 'Pêche et corail',  fond: '#fff4ee', fond2: '#ffe3d6', accent: '#ff5a36', texte: '#2a1610', texteDoux: '#8a5d4e' }
};

// Les polices proposées pour les titres (Google Fonts)
const POLICES_MODELES = ['Bricolage Grotesque', 'Anton', 'Playfair Display', 'Space Grotesk', 'DM Serif Display', 'Inter'];

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
