/* =========================================================
   🇬🇧 MODELES-EN.JS — la traduction anglaise du catalogue (modeles.js)
   ---------------------------------------------------------
   Chargé seulement sur modeles-en.html, juste après modeles.js.
   Pour un nouveau modèle : ajoute son id ici avec son nom et ses textes en anglais
   (sinon il s'affiche en français sur le site anglais).
   ========================================================= */

// Les noms affichés (filtres, couleurs, symboles, champs du formulaire)
const LIBELLES_EN = {
  // styles
  'Audacieux': 'Bold', 'Minimaliste': 'Minimalist', 'Moderne': 'Modern', 'Éditorial': 'Editorial', 'Brutaliste': 'Brutalist',
  'Rétro': 'Retro', 'Néon': 'Neon', 'Pastel': 'Pastel', 'Suisse': 'Swiss',
  // usages
  'Promo et ventes': 'Promos and sales', 'Nouveautés': 'New arrivals', 'Événements': 'Events', 'Logo et marque': 'Logo and brand',
  'Infos pratiques': 'Practical info', 'Réseaux sociaux': 'Social media', 'Recrutement': 'Hiring', 'YouTube et TV': 'YouTube and TV',
  // champs
  'Accroche': 'Hook', 'Le gros texte (ex. -30%)': 'The big text (e.g. -30%)', 'Détail de l\'offre': 'Offer details', 'Date ou condition': 'Date or condition',
  'Bouton': 'Button', 'Votre marque': 'Your brand', 'Le mot qui apparaît': 'The word that appears', 'Nom du produit': 'Product name',
  'Petite phrase': 'Short sentence', 'Jour (ex. 12)': 'Day (e.g. 12)', 'Mois': 'Month', 'Nom de l\'événement': 'Event name', 'Heure et lieu': 'Time and place',
  'Titre': 'Title', 'Chiffre 1': 'Number 1', 'Légende 1': 'Caption 1', 'Chiffre 2': 'Number 2', 'Légende 2': 'Caption 2', 'Chiffre 3': 'Number 3', 'Légende 3': 'Caption 3',
  'Le poste': 'The job', 'Contrat': 'Contract', 'Lieu': 'Location', 'Petite pastille': 'Small badge', 'Horaires (jour : heures, séparés par |)': 'Opening hours (day: hours, separated by |)',
  'Le grand mot': 'The big word', 'Le chiffre fêté': 'The milestone', 'La citation': 'The quote', 'Auteur': 'Author',
  'Adresse du site ou de l\'appli': 'Website or app address', 'Le mot': 'The word', 'La date': 'The date',
  'Votre activité': 'Your business', 'Le gros texte': 'The big text', 'Détail': 'Details', 'Texte du badge rond': 'Round badge text',
  'Appel à l\'action': 'Call to action', 'Votre compte': 'Your account', 'Petit titre': 'Small title', 'Prix': 'Price',
  'Texte qui tourne': 'Rotating text', 'Slogan': 'Tagline', 'Grand message (| = à la ligne)': 'Big message (| = new line)', 'Petite bulle': 'Small bubble',
  'Texte des bandeaux': 'Banner text', 'Phrase (| = à la ligne, *mot* = en couleur)': 'Sentence (| = new line, *word* = in colour)',
  'Petit nom en haut': 'Small name at the top', 'Ligne du bas': 'Bottom line', 'Phrase': 'Sentence', 'Pastille': 'Badge',
  'Accroche 1 (| = à la ligne)': 'Hook 1 (| = new line)', 'Accroche 2': 'Hook 2', 'Titre des offres': 'Offers title', 'Titre des étapes': 'Steps title',
  'Slogan de fin': 'Closing tagline', 'Bouton de fin': 'Closing button', 'Texte dans le cadre': 'Text in the frame', 'Phrase de fin (| = à la ligne)': 'Closing sentence (| = new line)',
  'Grand titre (| = à la ligne)': 'Big title (| = new line)', 'Info en plus': 'Extra info', 'Bouton (vide = pas de bouton)': 'Button (empty = no button)'
};

// Les noms des couleurs
const COULEURS_EN = {
  citron: 'Black and lime', nuit: 'Night and gold', rose: 'Burgundy and pink', foret: 'Forest and mint', ocean: 'Ocean', lavande: 'Lavender',
  mono: 'Black and white', creme: 'Cream and red', corail: 'Peach and coral', papier: 'Paper and ink', sable: 'Sand and earth', luxe: 'Black and gold',
  beton: 'Concrete and orange', retro: '70s retro', neon: 'Neon pink', pastel: 'Pastel purple', menthe: 'Mint and coral', suisse: 'White and red'
};

// Les modèles : nom anglais + textes de départ anglais (+ note)
const MODELES_EN = {
  /* ---------- Promos and sales ---------- */
  'soldes': ['Sale', { ligne1: 'Winter sale', ligne2: '-30%', ligne3: 'on the whole shop', ligne4: 'Until 31 January', appel: 'Shop now', marque: 'Your brand' }],
  'black-friday': ['Black Friday', { ligne1: 'Black Friday', ligne2: '-50%', ligne3: 'this weekend only', ligne4: '24 hours only', appel: 'See the deals', marque: 'Your brand' }],
  'fete-des-meres': ['Mother’s Day offer', { ligne1: 'Mother’s Day', ligne2: '-15%', ligne3: 'on all gift boxes', ligne4: 'Free delivery', appel: 'Give a gift', marque: 'Your brand' }],
  'code-promo': ['Promo code', { ligne1: 'Promo code', ligne2: 'WELCOME', ligne3: '10% off your first order', ligne4: 'Valid for 7 days', appel: 'Order now', marque: 'Your brand' }],
  'promo-boutique': ['Offer of the week', { marque: 'Your brand', typeCommerce: 'Your business', accroche: 'This week only', offre: '-20%', detailOffre: 'on a selection', texteBadge: 'SPECIAL OFFER', appel: 'Follow us', reseau: '@yourbrand', infos: 'Open 7 days a week' }],

  /* ---------- New arrivals ---------- */
  'nouvelle-collection': ['New collection', { ligne1: 'New', ligne2: 'Spring collection', ligne3: 'Available now', appel: 'Discover', marque: 'Your brand' }],
  'nouveau-menu': ['New menu', { ligne1: 'New', ligne2: 'The summer menu', ligne3: 'Taste it from today', appel: 'Book a table', marque: 'Your brand' }],
  'produit-vedette': ['Featured product', { marque: 'Your brand', slogan: 'Your tagline', surtitre: 'New', nomProduit: 'Your best seller', prix: '$49', anneau: 'YOUR BRAND ✦ NEW ✦ ' }],
  'teaser': ['“Coming soon” teaser', { ligne1: 'Coming soon', ligne2: 'On 1 March', marque: 'Your brand' }],
  'teaser-lavande': ['Elegant teaser', { ligne1: 'Reveal', ligne2: 'This Friday, 6 pm', marque: 'Your brand' }],

  /* ---------- Events ---------- */
  'soiree': ['Opening night', { ligne1: '12', ligne2: 'March', ligne3: 'Opening night', ligne4: '7 pm · 12 Arts Street, Lyon', appel: 'Free entry', marque: 'Your brand' }],
  'atelier': ['Workshop or masterclass', { ligne1: '24', ligne2: 'April', ligne3: 'Discovery workshop', ligne4: '2 pm · limited places', appel: 'Sign me up', marque: 'Your brand' }],
  'webinaire': ['Webinar', { ligne1: '05', ligne2: 'June', ligne3: 'Free webinar', ligne4: '12.30 pm · online', appel: 'Save my seat', marque: 'Your brand' }],

  /* ---------- Logo and brand ---------- */
  'logo-dessine': ['Self-drawing logo', { marque: 'Your brand', slogan: 'Your tagline here', symbole: 'etoile' }],
  'logo-citron': ['Neon logo', { marque: 'Your brand', slogan: 'Your tagline here', symbole: 'ciseaux' }],
  'typo-choc': ['Bold type', { marque: 'Your brand', slogan: 'Your tagline', annonce: 'YOUR | MESSAGE', info: 'One more piece of info', bandeau: 'YOUR BRAND ✦ ' }],
  'citation': ['Your manifesto', { ligne1: 'We don’t sell products, we create memories.', ligne2: 'The founder', marque: 'Your brand' }],
  'citation-claire': ['Light quote', { ligne1: 'Handmade, with patience and a lot of love.', ligne2: 'The team', marque: 'Your brand' }],
  'texte-anime': ['Word-by-word sentence', { phrase: 'Your *message* | that makes | people want more, | in *8 seconds*.', etiquette: 'Your brand', signature: '@yourbrand' }],

  /* ---------- Practical info ---------- */
  'horaires': ['Opening hours', { ligne1: 'Our opening hours', ligne2: 'Open today', liste: 'Monday – Friday: 9 am – 7 pm|Saturday: 10 am – 6 pm|Sunday: closed', marque: 'Your brand' }],
  'horaires-fetes': ['Holiday hours', { ligne1: 'Over the holidays', ligne2: 'Special hours', liste: '24 December: 9 am – 4 pm|25 December: closed|31 December: 9 am – 4 pm', marque: 'Your brand' }],
  'chiffres': ['Your key figures', { ligne1: 'In a few numbers', chiffre1: '12', texte1: 'years of experience', chiffre2: '3000', texte2: 'customers', chiffre3: '100', texte3: '% homemade', marque: 'Your brand' }],
  'menu-ecran': ['Menu or price list', { surTitre: 'The menu', marque: 'Your brand', phrase: 'Your introduction sentence.', pastille: 'Something that matters' },
    'The menu lines (products and prices) are remade with you after you order.'],

  /* ---------- Social media ---------- */
  'merci-abonnes': ['Thank you followers', { ligne1: 'Thank you!', ligne2: '10,000 followers', ligne3: 'You are amazing', marque: '@yourbrand' }],
  'merci-clients': ['Thank you customers', { ligne1: 'Thank you', ligne2: '1 year already', ligne3: 'Thanks for following us from the start', marque: 'Your brand' }],
  'lancement-site': ['Website launch', { ligne1: 'We’re live!', ligne2: 'www.yourwebsite.com', ligne3: 'Our new website is open', appel: 'Visit', marque: 'Your brand' }],
  'lancement-appli': ['App launch', { ligne1: 'Out now!', ligne2: 'App Store · Google Play', ligne3: 'Our app is here', appel: 'Download', marque: 'Your brand' }],
  'vitrine-appli': ['App style', {}, 'The screens (score, icon, button) are remade with your text and colours after you order.'],
  'vitrine-cafe': ['App style · café', {}, 'The screens are remade with your text and colours after you order.'],

  /* ---------- Hiring ---------- */
  'recrute': ['We’re hiring', { ligne1: 'We’re hiring', ligne2: 'Sales assistant', ligne3: 'Permanent', ligne4: 'Lyon', appel: 'Apply', marque: 'Your brand' }],
  'recrute-stage': ['Internship offer', { ligne1: 'Internship', ligne2: 'Marketing assistant', ligne3: '6 months', ligne4: 'Remote possible', appel: 'Apply', marque: 'Your brand' }],

  /* ---------- YouTube and TV ---------- */
  'spot-30': ['30-second spot', { marque: 'Your brand', slogan: 'Your tagline, in motion.', accroche1: 'Your hook|on two lines.', accroche2: 'Your promise|here.', titreOffres: 'Our offers', titreEtapes: 'How it works', appel: 'Contact us', reseau: '@yourbrand' },
    'The offers, prices and steps are remade with you after you order.'],
  'tous-ecrans': ['All your screens', { marque: 'Your brand', contenu: 'Your ad here', conclusion: 'One video.|All your screens.' }],

  /* ---------- Art directions (directions.html) : [small title, big title, details, extra info, button] ---------- */
  'mini-soldes': ['Subtle sale', ['Limited edition', '20% off|the collection', 'Hand-picked pieces, gentle prices.', 'Until 15 March', 'Discover']],
  'mini-collection': ['Clean collection', ['New collection', 'Spring|summer', 'Simple lines, real materials.', 'In store', 'See the collection']],
  'mini-expo': ['Private view', ['Exhibition', 'Shapes|& silences', 'Private view on Thursday 12 June at 7 pm.', 'Free entry', 'Book']],
  'mini-recrute': ['Understated job ad', ['We’re hiring', 'Product|designer', 'Permanent · Paris · Partly remote', 'Applications open', 'Apply']],
  'mini-manifeste': ['Minimal manifesto', ['Manifesto', 'Less,|but better.', 'Your brand sentence, simply.', '', 'Learn more']],
  'mini-fermeture': ['Exceptional closure', ['Notice', 'Exceptional|closure', 'The shop will be closed on Monday 14 July.', 'Reopening Tuesday 9 am', '']],
  'mod-flash': ['Flash sale', ['Flash sale', '-40%|today', 'On the whole online shop', 'Code: FLASH40', 'Shop now']],
  'mod-appli': ['App available', ['New', 'Your app|is here', 'Book in 3 taps, wherever you are.', 'iOS and Android', 'Download']],
  'mod-live': ['Free live', ['Free live', 'Boost your|online sales', 'Thursday 8 pm · 45 minutes', 'Limited places', 'Sign up']],
  'mod-recrute': ['We’re hiring (modern)', ['We’re hiring', 'Full-stack|developer', 'Join a team of 12 enthusiasts.', 'Permanent · Lyon', 'Apply']],
  'mod-abonnes': ['Follower milestone', ['Thank you', '50,000|followers', 'You are the best community.', '@yourbrand', '']],
  'mod-produit': ['Product launch', ['New', 'The Air 2|model', 'Lighter, faster, longer-lasting.', 'From $129', 'Order']],
  'mod-video': ['New video', ['New video', 'Our 5|tips', 'To sell better on Instagram.', 'Episode 12', 'Watch']],
  'edi-collection': ['Magazine cover', ['Collection', 'Indian|summer', 'An ode to light and natural materials.', 'No. 07', 'Discover']],
  'edi-soiree': ['Private party', ['Private party', 'A night|in Paris', '21 June, by invitation only.', 'No. 12', 'RSVP']],
  'edi-vision': ['Our vision', ['Our vision', 'Elegance|is an attitude', 'The founder', 'Manifesto', '']],
  'edi-menu': ['Seasonal menu', ['The menu', 'Autumn|menu', 'Porcini, squash and chestnuts.', 'Tuesday to Saturday', 'Book a table']],
  'edi-ventes': ['Private sales', ['Private sales', 'Thirty percent|off', 'On a selection of exceptional pieces.', '3 to 7 May', 'Enter']],
  'edi-recrute': ['House hiring', ['Careers', 'Head|waiter', 'Our house is hiring for the season.', 'Permanent · Bordeaux', 'Apply']],
  'edi-reportage': ['Documentary', ['Documentary', 'The hands|of the craft', 'Meet our artisans.', 'Episode 3', 'Watch']],
  'bru-soldes': ['Raw sale', ['Sale', '-70%|everything|must go', 'Last days', 'Limited stock', 'Go']],
  'bru-drop': ['Streetwear drop', ['Drop', 'New|capsule', 'Friday 6 pm, online', '100 pieces', 'See the drop']],
  'bru-concert': ['Gig tonight', ['Live', 'Gig|tonight', 'Le Bloc · 9 pm · $15', 'Almost sold out', 'Tickets']],
  'bru-recrute': ['Looking for talent', ['Hiring', 'Looking|for talent', 'Internships and apprenticeships', 'Join us', 'Apply']],
  'bru-annonce': ['Big announcement', ['Announcement', 'Big|news', 'We’ll tell you everything tomorrow.', 'Stay tuned', 'Follow']],
  'bru-local': ['Made here', ['Brand', 'Made|here.', 'Made locally since 2012.', 'Made in France', 'Discover']],
  'ret-happy': ['Happy hour', ['Happy hour', '2 for 1|cocktails', 'Every Thursday from 6 to 8 pm', 'At the bar', 'Come along!']],
  'ret-ouverture': ['Grand opening', ['Grand opening', 'The diner|is open', 'Burgers, milkshakes and good vibes', 'Saturday 10 am', 'On our way']],
  'ret-glaces': ['New flavour', ['New', 'Homemade|ice cream', 'Six flavours, made every morning.', 'All summer', 'Taste']],
  'ret-anniv': ['10 years together', ['Thank you', '10 years|together', 'Thanks for being part of the adventure.', 'Since 2016', '']],
  'ret-horaires': ['Summer hours', ['Summer hours', 'Open|7 days', 'From 8 am to 10 pm, all summer.', 'Terrace open', '']],
  'ret-job': ['Summer job', ['Summer job', 'Waiters|wanted', 'Family atmosphere, generous tips', 'July – August', 'Apply']],
  'neo-soiree': ['Neon night', ['This Saturday', 'Neon|night', 'DJ set · 11 pm – 5 am', 'Entry $10', 'Book']],
  'neo-tournoi': ['Live tournament', ['Live on Twitch', 'Tournament|tonight', '8 pm · prizes to win', '@yourchannel', 'Join']],
  'neo-cyber': ['Cyber Monday', ['Cyber Monday', '-60%|online', 'On all tech', '24 hours only', 'Shop now']],
  'neo-version': ['New version', ['Coming soon', 'Version|2.0', 'Faster. Stronger.', '01.03', 'Discover']],
  'neo-teaser': ['Neon teaser', ['Teaser', 'Something|is coming', 'Stay tuned', 'Soon', '']],
  'neo-chaine': ['New channel', ['New video', 'Every|Wednesday', 'One video a week, at 6 pm.', '@yourchannel', 'Subscribe']],
  'pas-anniv': ['Birthday', ['Birthday', '3 years|already!', 'Free cake for all our customers on Saturday.', 'Saturday 2 pm', 'Let’s celebrate']],
  'pas-atelier': ['Kids’ workshop', ['Workshop', 'Salt dough|& glitter', 'For ages 4 – 10, snack included', 'Wednesday 3 pm', 'Sign up']],
  'pas-douceurs': ['Sweet little prices', ['Small price', '-25%|on treats', 'All week in store', 'Until Sunday', 'Yum!']],
  'pas-merci': ['Yay 1,000 followers', ['Yay', '1,000|followers!', 'Thank you for all the love.', '@yourbrand', '']],
  'pas-parfum': ['Flavour of the moment', ['New', 'Strawberry|& basil', 'Available from today!', 'Spring edition', 'Taste']],
  'pas-livraison': ['Free delivery', ['Good news', 'Free|delivery', 'On orders over $30, nationwide.', 'All month', 'Order']],
  'sui-expo': ['Exhibition poster', ['Exhibition 04', 'Typography|& poster', '3 to 28 February, North gallery.', 'Free entry', 'Programme']],
  'sui-conference': ['Talk', ['Talk', 'Design|and society', 'Tuesday 6.30 pm · Lecture hall B', 'Free', 'Sign up']],
  'sui-recrute': ['Studio job offer', ['Job 12', 'Art|director', 'Independent studio, 8 people.', 'Permanent · Geneva', 'Apply']],
  'sui-studio': ['Studio introduction', ['Studio', 'Form|follows|function', 'Architecture · Graphic design · Objects', 'Since 1998', 'Portfolio']],
  'sui-livres': ['Bookshop offer', ['Offer', '-30%|on books', 'A selection of art and design books', 'Until 30.11', 'See']],
  'sui-horaires': ['New opening hours', ['New hours', 'Mon – Sat|9 am – 7 pm', 'Sunday: closed', 'From 1 September', '']]
};

// On range tout dans le catalogue : m.en = { nom, textes, note }
MODELES.forEach((m) => {
  const e = MODELES_EN[m.id];
  if (!e) return;
  let textes = e[1];
  if (Array.isArray(textes)) {
    const [ligne1, ligne2, ligne3, ligne4, appel] = textes;
    textes = { ligne1, ligne2, ligne3, ligne4, appel, marque: 'Your brand' };
  }
  m.en = { nom: e[0], textes: Object.assign({}, m.textes, textes), note: e[2] || '' };
});
Object.entries(COULEURS_EN).forEach(([cle, nom]) => { if (PALETTES_MODELES[cle]) PALETTES_MODELES[cle].en = { nom }; });
