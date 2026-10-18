# 🎬 Guide de ta boîte à outils motion

Tout tient dans ce dossier, sans rien installer. Chaque animation est une page web qui s'ouvre dans ton navigateur (Chrome, Edge, Firefox…).

```
motion-design/
├── index.html            ← page d'accueil (liens vers les 3 modèles)
├── logo-reveal.html      ← modèle 1 : logo animé (~4 s)
├── texte-anime.html      ← modèle 2 : phrase d'accroche (~5 s)
├── promo-commerce.html   ← modèle 3 : petite pub en 3 écrans (~8 s)
├── GUIDE.md              ← ce guide
└── commun/               ← le "moteur" partagé (ne pas toucher, ne pas séparer)
    ├── moteur.js         ← boutons, formats, outils d'animation
    ├── symboles.js       ← les symboles dessinés (lune-blé, ciseaux, étoile)
    └── studio.css        ← styles communs
```

> ⚠️ Le dossier `commun/` doit toujours rester **à côté** des fichiers `.html`. Si tu déplaces ou envoies un modèle, prends tout le dossier `motion-design`.

---

## 1. Ouvrir et rejouer une animation

1. **Double-clique** sur `index.html` (ou directement sur un des modèles).
2. L'animation se lance toute seule.
3. En bas de l'écran, tu as :

| Bouton | Touche | Ce que ça fait |
|---|---|---|
| ↻ **Rejouer** | `R` ou `Espace` | relance l'animation depuis le début |
| ⇄ **Carré / Vertical** | `F` | passe de 1080×1080 (post Insta) à 1080×1920 (TikTok, Reels, story) |
| ● **Mode propre** | `P` | plein écran sans boutons, pour enregistrer |
| | `Échap` | quitte le mode propre |

La **durée** de l'animation est affichée à côté des boutons (pratique pour savoir quand arrêter l'enregistrement).

En mode propre : **un clic** = rejouer, **un double-clic** = quitter.

💡 Les polices (Fraunces, Inter) sont téléchargées depuis Google Fonts : **il faut être connecté à Internet**, sinon une police de secours (Georgia) s'affiche à la place.

---

## 2. Créer une version pour un nouveau client

### Étape 1 — Dupliquer le modèle
Copie-colle le fichier, par exemple `logo-reveal.html` → `logo-salon-mila.html`, **dans le même dossier**.

### Étape 2 — Ouvrir le fichier pour le modifier
Clic droit sur le fichier → **Ouvrir avec** → **Bloc-notes** (ou mieux, un éditeur gratuit comme VS Code si tu l'as déjà).

### Étape 3 — Modifier le bloc RÉGLAGES
Tout en haut du fichier, tu trouves ce bloc. **Change seulement ce qui est entre les guillemets `' '`** :

```js
const REGLAGES = {
  marque: 'Fournil Lune',             // ← le nom du client
  slogan: 'Pain cuit avant l\'aube',  // ← son slogan
  symbole: 'lune-ble',                // ← 'lune-ble', 'ciseaux', 'etoile' ou 'aucun'

  couleurs: {
    fond:      '#0b1430',   // ← couleur du fond
    fond2:     '#1c2f63',   // ← couleur de la lueur
    accent:    '#e6b85c',   // ← couleur principale de la marque
    texte:     '#f6efe0',
    texteDoux: '#b9bfd6'
  },
  ...
```

Enregistre (`Ctrl + S`), puis **actualise** la page dans le navigateur (`F5`).

### Les pièges à éviter ✋
- **Apostrophe** dans un texte : écris `\'` → `'L\'atelier'`. Sinon, la page reste vide.
- Ne supprime pas les **virgules** à la fin des lignes, ni les guillemets.
- Si la page devient noire/vide après une modification : tu as sûrement cassé un guillemet ou une virgule. Fais `Ctrl + Z` dans l'éditeur jusqu'à ce que ça remarche.

### Choisir les couleurs
Les couleurs s'écrivent en code **hexadécimal** (`#` + 6 caractères). Pour en trouver :
- tape **« color picker »** dans Google : un sélecteur de couleur apparaît, copie le code `#…` ;
- si le client a un logo, demande-lui ses codes couleurs, ou utilise la pipette d'un outil de dessin.

Astuce de pro : un **fond sombre** + **un seul accent vif** donne presque toujours un rendu élégant.

### Changer les polices
Dans `polices`, mets le nom exact d'une police de [fonts.google.com](https://fonts.google.com) :
```js
polices: { titre: 'Playfair Display', texte: 'Montserrat' },
```
Idées : `Bebas Neue` (garage, sport), `Playfair Display` (restaurant chic), `Poppins` (moderne), `Pacifico` (fun, glacier), `DM Serif Display` (salon de coiffure).

### Régler la vitesse
`vitesse: 1` est la vitesse normale. `0.8` = plus lent et posé, `1.2` = plus dynamique.

### Spécificités de chaque modèle

**Texte animé** — dans `phrase` :
- `|` = retour à la ligne
- `*mot*` = mot mis en valeur (couleur accent + soulignement qui se trace)
```js
phrase: 'Votre *coupe* | parfaite, | sans *rendez-vous*.',
```
`rythme` = temps entre deux mots (0.26 s par défaut).

**Promo commerce** — 3 écrans à remplir : `marque` + `typeCommerce`, puis `accroche` + `offre` + `detailOffre`, puis `appel` + `reseau` + `infos`. Pour allonger un écran, change `TRANSITION_1` et `TRANSITION_2` au début de la partie « L'ANIMATION ».

Les textes trop longs **rétrécissent automatiquement** pour ne pas dépasser de l'image.

**Vitrine UI** (`vitrine-ui.html`) — le style « interface d'appli » : une forme lumineuse se transforme en pilule, puis en carte de score (le chiffre défile), en icône, en bouton qu'on touche, et finit sur le logo du commerce.
- `demo` choisit la démo jouée : `'garage'`, `'coiffeur'` ou `'cafe'` (ou dans l'adresse : `vitrine-ui.html?demo=cafe`).
- Pour un client : copie une démo dans `demos`, donne-lui un nouveau nom, et change les textes, la couleur `accent`, les icônes et les chiffres.
- Les chiffres (`valeur`) doivent être des **nombres entiers** ; `max` est la valeur qui remplit la jauge à 100 %.

**Typo choc** (`typo-choc.html`) — énergique, pour les salons, salles de sport, boutiques mode.
- `mots` : 2 à 4 mots courts en majuscules qui claquent un par un.
- `annonce` : la grande phrase sur deux lignes (`|` = retour à la ligne). `info` : la bulle blanche. `bandeau` : le texte qui défile.
- `fond` et `fond2` sont les deux couleurs qui alternent.

**Produit vedette** (`produit-vedette.html`) — chaleureux, pour cafés, boulangeries, épiceries fines.
- `produit` : `'tasse'` (dessinée) ou un symbole (`'lune-ble'`, `'ciseaux'`, `'etoile'`).
- `surtitre`, `nomProduit`, `prix`, `notes` (3 petites bulles), `anneau` (le texte qui tourne en cercle).

**Spot 30 secondes** (`spot-30s.html`) — format **paysage 16:9** (1920 × 1080) pour YouTube, un écran en vitrine ou la TV. Six scènes : logo, accroche (`accroche1`, `accroche2`), offres (`offres` : nom, détail, prix), comparaison (`comparaison`), étapes (`etapes`), appel à l'action (`appel`, `reseau`). Les moments de chaque scène sont dans `T` au début de la partie « L'ANIMATION ».
- Pour enregistrer en 16:9 : mode propre (`P`) sur un écran d'ordinateur, qui est déjà horizontal.
- ⚠️ Pour une **diffusion TV**, la chaîne demande un fichier « prêt à diffuser » (format, son normé, validation ARPP en France) : un simple enregistrement d'écran ne suffit pas toujours. Demande ses exigences au client avant d'accepter.

Les 3 styles et le spot sont réglés **aux couleurs de Novimo** (c'est ce que montre ton site). Pour un client, change le bloc RÉGLAGES. Le style appli garde aussi 3 démos de commerces imaginaires (`?demo=garage`, `coiffeur`, `cafe`) comme point de départ.

**Sur le site**, ces 3 styles tournent dans le **carrousel** de la section Réalisations (`site/index.html`). Pour ajouter une vidéo au carrousel, copie un bloc `<figure class="diapo">` et change l'adresse de l'`iframe`.

### Les symboles
Disponibles : `'lune-ble'` (boulangerie), `'ciseaux'` (coiffeur), `'etoile'` (passe-partout), `'aucun'`.
Pour en ajouter un, ouvre `commun/symboles.js` : chaque symbole est un petit dessin SVG commenté. Copie un bloc existant et modifie-le.

---

## 3. Enregistrer l'animation en vidéo

Le principe : on lance le **mode propre**, on **filme l'écran**, puis on **recadre** la vidéo.

### 💻 Sur Windows 11 (le plus simple)
1. Ouvre ton animation, choisis le format (carré ou vertical).
2. Appuie sur `Win + Maj + R` → l'**Outil Capture** passe en mode vidéo.
3. **Sélectionne la zone** de l'animation, puis clique sur **Démarrer**.
4. Clique sur la page puis appuie sur `P` (mode propre). Tu as 1,2 seconde d'image fixe avant le début : c'est voulu, ça te laisse le temps.
5. Attends la fin (regarde la durée affichée), puis arrête l'enregistrement.
6. La vidéo est dans `Vidéos > Captures d'écran` (ou enregistre-la depuis l'Outil Capture).

Autre option : `Win + Alt + R` (Xbox Game Bar) enregistre toute la fenêtre du navigateur.

### 🍏 Sur Mac
`Cmd + Maj + 5` → **Enregistrer la partie sélectionnée** → entoure l'animation → Enregistrer.

### 📱 Sur téléphone
L'enregistreur d'écran est intégré :
- **iPhone** : Centre de contrôle → bouton ⏺ « Enregistrement de l'écran ».
- **Android** : volet des réglages rapides → « Enregistrement d'écran ».

Pour ouvrir les fichiers sur le téléphone, copie le dossier `motion-design` complet dessus (câble, Google Drive…) et ouvre `index.html` avec le navigateur. Ça marche bien sur Android avec Chrome ; sur iPhone, l'ouverture de fichiers locaux est plus capricieuse : dans ce cas, **enregistre plutôt sur ordinateur** et envoie-toi la vidéo.

👉 Le **format vertical** rend mieux quand il est filmé sur un téléphone (son écran est déjà vertical). Sur un écran d'ordinateur horizontal, la vidéo verticale sera plus petite.

### ✂️ Couper et recadrer
- **Windows** : **Clipchamp** (déjà installé sur Windows 11) ou l'appli **Photos** → Modifier → Rogner/Découper.
- **Mac / iPhone** : appli **Photos** → Modifier → recadrer, couper le début et la fin.
- **Android** : appli **Galerie** → Modifier.

Coupe le début (la seconde d'image fixe et le moment où tu appuies sur `P`) et garde 1 à 2 secondes sur l'image finale. Exporte en **1080p**.

### ✅ Check-list avant de livrer au client
- [ ] Orthographe du nom, du slogan et du @ vérifiée
- [ ] Bon format (carré pour un post, vertical pour TikTok/Reels/story)
- [ ] Aucun bouton ni curseur de souris visible dans la vidéo
- [ ] La vidéo commence et finit proprement (pas de saccade)
- [ ] Une version avec et une sans musique (la musique s'ajoute dans CapCut, Clipchamp ou directement dans TikTok/Instagram, avec les sons autorisés par la plateforme)

---

## 4. Ton site vitrine Novimo

Il est dans le dossier `site/`. Double-clique sur `site/index.html` pour l'ouvrir.

```
site/
├── reglages.js  ← ⭐ LE fichier à modifier : coordonnées, prix, options, onglets
├── index.html   ← la page d'accueil (textes)
├── devis.html   ← la page de devis
├── compte.html  ← la page "Mon compte" (voir partie 5)
├── dashboard.html ← ton tableau de bord, réservé à toi (voir partie 5)
├── config.js    ← 🔑 les clés de Supabase (voir partie 5)
├── style.css    ← l'apparence (couleurs, tailles, largeur du menu)
├── commun.js    ← le menu latéral, les contacts, les apparitions (partagé)
├── accueil.js   ← l'essai en direct de l'accueil
└── devis.js     ← le calcul du devis
```

**Ce qu'il contient** :
- **L'accueil** : tes animations qui tournent en boucle, un **essai en direct** (le visiteur tape le nom de son commerce et voit son logo animé), tes tarifs, et tes contacts.
- **La page Devis** : le client choisit ses animations (boutons − et +), ses options (interrupteurs), remplit ses infos, et voit le **total se calculer en direct**. S'il prend les trois animations séparément, le site lui propose le pack (moins cher). Ensuite :
  - il indique son **e-mail** (obligatoire) et coche la case d'accord ;
  - le récapitulatif affiche l'**acompte de 30 % à verser à la signature** (pourcentage réglable : `acompte` dans `reglages.js`) ;
  - **Envoyer mon devis** → le PDF complet part par e-mail **à toi** (`emailDevis` dans `reglages.js`) **et au client** (une fois Supabase branché, voir partie 5) ;
  - **Télécharger le PDF** → un PDF propre : logo, numéro, date, lignes, total, acompte de 30 %, reste à régler, idée du client et cadre de signature.
  - Depuis l'essai en direct, « Je veux cette animation » ouvre le devis **déjà rempli** (logo animé + nom + couleurs choisies).
- **Le menu latéral**, sur toutes les pages : sur ordinateur, le bouton « Replier le menu » (en bas) le réduit aux icônes, et le site s'en souvient. Sur téléphone, il se cache et s'ouvre avec le bouton ☰ en haut à droite.

### À modifier avant de le montrer
Presque tout se passe dans **`site/reglages.js`** :
1. **Tes coordonnées** : `email`, `instagram`, `tiktok`. Tous les liens et tous les devis se mettent à jour.
2. **Tes prix** : dans `tarifs`, change les nombres après `prix:` (ex. `prix: 300`). Les prix de l'accueil **et** des devis changent ensemble.
   - `prixPro:` est le prix de **départ** d'un motion designer freelance pour la même chose (source : baromètre Malt, repris par Le Freelance). Le site s'en sert pour afficher « Freelance : dès 600 € » et, dans le devis, « Vous économisez au moins … ».
   - ⚠️ Le site affirme « Moitié moins cher qu'un pro ». C'est une **publicité comparative** : la loi exige qu'elle soit exacte et vérifiable. Garde donc toujours `prix` **inférieur ou égal à la moitié** de `prixPro`, et mets à jour les `prixPro` si les tarifs du marché changent.
   - `groupe:` range chaque offre dans une famille (`'reseaux'` = Réseaux sociaux, `'longs'` = YouTube et TV). Les familles se règlent dans `groupes`.
   - Le `prixPro` du **spot 30 s** est une **estimation** (la moitié du prix pro d'une vidéo de 60 s), car la source ne donne pas de prix pour 30 s.
3. **Les options du devis** (`pasPour:` liste les offres auxquelles une option ne s'applique pas, ex. l'express pour les spots) : dans `options` (express, retouches, format paysage). Tu peux en supprimer ou en ajouter une en copiant une ligne.
4. **Les onglets du menu** : dans `onglets`. Pour en ajouter un, copie une ligne et change le nom, le lien et l'icône.

Et ailleurs :
5. **Le délai** : la section « Comment ça se passe » de `index.html` annonce un premier aperçu « sous 48 heures ». Change-le si ce n'est pas réaliste pour toi (cours, examens…).
6. **La couleur Novimo** : dans `site/style.css`, ligne `--accent: #d4ff3f;` (le vert citron).

💡 Tant que Supabase n'est pas branché (partie 5), la page devis télécharge le PDF et ouvre un e-mail vers toi : c'est le client qui l'envoie depuis sa messagerie.

⚠️ Le site utilise les animations du dossier parent (`../logo-reveal.html`…). Garde donc toujours `site/` **à l'intérieur** de `motion-design/`.

Quand tu auras de vrais clients (avec leur accord), remplace Fournil Lune dans la section « Réalisations » par leurs animations : c'est ce qui convaincra le plus.

---

## 5. Comptes, devis par e-mail et tableau de bord

Ces trois fonctions ont besoin d'un **service en ligne** : **Supabase** (base de données + connexion) et **Brevo** (envoi des e-mails). Les deux sont **gratuits** pour démarrer. Tant que ce n'est pas branché, le site marche en **mode démo** :
- **Devis** : « Envoyer mon devis » télécharge le PDF et ouvre un e-mail vers toi (le client joint le PDF lui-même) ;
- **Mon compte** : affiche « Bientôt disponible » ;
- **Tableau de bord** (`site/dashboard.html`) : montre des **données d'exemple** pour que tu voies à quoi il ressemble.

👨‍👩‍👦 **Fais ces étapes avec un parent** : certains services demandent d'être majeur pour créer un compte développeur, et il faudra peut-être une carte bancaire pour vérifier l'identité (rien n'est facturé sur les offres gratuites).

### Ce qui a été préparé pour toi

```
motion-design/
├── site/
│   ├── config.js          ← 🔑 tu colles ici l'URL et la clé "anon" de Supabase
│   ├── api.js             ← le lien entre le site et Supabase (ne pas toucher)
│   ├── pdf-devis.js       ← fabrique le PDF du devis (logo, lignes, acompte 30 %, signature)
│   ├── compte.html/.js    ← la page "Mon compte" (Google ou lien par e-mail)
│   ├── dashboard.html/.js ← ton tableau de bord (réservé à ton adresse)
│   └── confidentialite.html ← ⚠️ modèle à compléter (obligatoire, RGPD)
└── supabase/
    ├── schema.sql                      ← à coller une fois dans Supabase
    └── functions/envoyer-devis/index.ts ← la fonction qui enregistre le devis et envoie les e-mails
```

### Étape 1 — Mettre le site en ligne
La connexion Google ne marche **pas** sur un fichier ouvert en double-clic : il faut une vraie adresse. Le plus simple : **Netlify** (netlify.com) → « Add new site » → « Deploy manually » → glisse le dossier **`motion-design`** entier. Tu obtiens une adresse du type `https://novimo.netlify.app`. Ton site est alors à `https://novimo.netlify.app/site/`.

### Étape 2 — Créer le projet Supabase
1. Crée un compte sur **supabase.com**, puis **New project** (choisis une région en **Europe**, ex. Paris ou Francfort).
2. Menu **SQL Editor** → **New query** → colle tout le contenu de `supabase/schema.sql` → **Run**. Les tables et les protections sont créées.
3. Menu **Project Settings → API** : copie **Project URL** et la clé **anon public** dans `site/config.js`.
   ⚠️ Ne copie **jamais** la clé `service_role` dans le site : elle est secrète.

### Étape 3 — Brevo, pour envoyer les e-mails avec le PDF
1. Crée un compte sur **brevo.com** (offre gratuite : 300 e-mails/jour).
2. **Expéditeurs** : ajoute et valide `bouletpro45@gmail.com` (Brevo t'envoie un code).
3. **SMTP & API → Clés API** : crée une clé et copie-la.
4. 💡 Les e-mails envoyés « au nom » d'une adresse Gmail arrivent parfois dans les spams. Quand tu auras un nom de domaine (ex. `novimo.fr`, environ 10 €/an), valide-le dans Brevo et utilise `contact@novimo.fr` comme expéditeur.

### Étape 4 — La fonction "envoyer-devis"
1. Dans Supabase, menu **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nom : `envoyer-devis` (exactement). Colle le contenu de `supabase/functions/envoyer-devis/index.ts` → **Deploy**.
3. Dans les réglages de la fonction, **désactive "Verify JWT"** (tout visiteur doit pouvoir envoyer un devis ; la fonction fait ses propres vérifications).
4. **Edge Functions → Secrets** : ajoute
   - `BREVO_API_KEY` = ta clé Brevo
   - `EMAIL_EXPEDITEUR` = `bouletpro45@gmail.com` (l'adresse validée dans Brevo)
   - `EMAIL_ADMIN` = `bouletpro45@gmail.com` (celle qui reçoit les devis)

### Étape 5 — La connexion (Google + lien par e-mail)
1. Supabase → **Authentication → URL Configuration** :
   - **Site URL** : `https://novimo.netlify.app/site/`
   - **Redirect URLs** : ajoute `https://novimo.netlify.app/site/compte.html`
2. **Lien par e-mail** : déjà actif. Mais l'envoi d'e-mails intégré de Supabase est très limité (quelques e-mails par heure). Dans **Authentication → Emails → SMTP Settings**, branche le **SMTP de Brevo** (les identifiants sont dans Brevo → SMTP & API).
3. **Google** :
   - Va sur **console.cloud.google.com** → crée un projet → **API et services → Écran de consentement OAuth** (type « Externe », nom « Novimo »).
   - **Identifiants → Créer → ID client OAuth → Application Web**. Dans « URI de redirection autorisés », colle l'adresse donnée par Supabase (Authentication → Providers → Google → « Callback URL », du type `https://xxxx.supabase.co/auth/v1/callback`).
   - Copie l'**ID client** et le **code secret** dans Supabase → **Authentication → Providers → Google** → active → enregistre.

### Étape 6 — Vérifier que tout marche
1. Remets le dossier `motion-design` sur Netlify (glisse-le à nouveau) pour que `config.js` rempli soit en ligne.
2. Fais un **devis test** avec ton adresse : tu dois recevoir **deux** e-mails avec le PDF (la copie client et la tienne).
3. Va sur **Mon compte**, connecte-toi avec **Google** en utilisant `bouletpro45@gmail.com` : le bouton **Tableau de bord** apparaît.
4. Dans le tableau de bord, passe ton devis test en « Acompte reçu » : les gains des 7 derniers jours augmentent de 30 % du total.

### Comment marchent les statuts et les gains
| Statut | Quand l'utiliser | Effet sur les gains |
|---|---|---|
| **En cours** | le devis vient d'arriver | rien |
| **Acompte reçu** | le client a signé et payé les 30 % | + l'acompte, à la date du jour |
| **Clôturé (soldé)** | le client a payé le reste | + le solde, à la date du jour |
| **Annulé** | le projet ne se fait pas | retiré des gains |

« Devis en cours » compte les devis **En cours** et **Acompte reçu**. « Prestations au premier devis » regarde uniquement le **premier** devis de chaque adresse e-mail.

### Sécurité : ce qui protège tes données
- Le tableau de bord vérifie ton adresse, **mais la vraie protection est dans la base** (`schema.sql`, fonction `est_admin`) : même en trichant sur la page, personne d'autre ne peut lire les devis.
- Un client ne voit **que ses propres** devis.
- Si tu changes d'adresse admin : modifie-la dans `schema.sql` (relance-le) **et** dans `site/config.js`.
- Les prix sont recalculés sur la page du client : vérifie toujours le montant avant de confirmer un devis par e-mail.

---

## 6. Pour aller plus loin (quand tu seras à l'aise)

Sous le bloc RÉGLAGES, la partie **« L'ANIMATION »** décrit la chorégraphie, ligne par ligne :

```js
S.anim(element, [ {départ}, {arrivée} ], début, durée, 'courbe');
```

- **début** et **durée** sont en secondes ;
- **courbe** décrit comment ça bouge :
  - `'douce'` : part vite, arrive tout en douceur (la plus « pro », à utiliser partout) ;
  - `'fluide'` : accélère puis freine (transitions) ;
  - `'rebond'` : dépasse un peu puis revient (effet « pop ») ;
  - `'sortie'` : pour faire disparaître quelque chose.

Change un chiffre, enregistre, actualise : c'est la meilleure façon d'apprendre. 🚀

---

## ✅ Avant la mise en ligne (ajouté le 17/10/2026)

1. **Base de données** : dans Supabase > SQL Editor, colle `supabase/ajout-2026-10-17.sql` et clique sur **Run** (mesure d'audience + anti-spam). À faire **avant** l'étape 2.
2. **Fonction serveur** : redéploie `supabase/functions/envoyer-devis/index.ts` (Edge Functions > envoyer-devis > Code > coller > Deploy). Elle recalcule maintenant les prix elle-même : si tu changes un prix dans `site/reglages.js`, change-le aussi en haut de ce fichier.
3. **Ton domaine** : remplace `https://www.novimo.fr` partout (pages `site/*.html`, `sitemap.xml`, `robots.txt`) par ta vraie adresse.
4. **Pages légales** : remplace les `[crochets]` dans `site/confidentialite.html` et `site/cgu.html` (nom, statut, SIRET, adresse, hébergeur, médiateur).
5. **Hébergement** : sur Vercel (dossier racine = `site`), `vercel.json` ajoute les en-têtes de sécurité ; Vercel force le HTTPS et sert `404.html` tout seul. (Sur un hébergeur Apache, c'est `.htaccess` qui s'en charge.)
6. **Supabase > Authentication > URL Configuration** : ajoute ton domaine dans *Site URL* et *Redirect URLs*.

---

## 💬 Messagerie et FAQ (ajouté le 17/10/2026)

- **FAQ** : `site/faq.html`. Pour ajouter une question, copie un bloc `<details class="question">…</details>`. La recherche et les données pour Google se font toutes seules.
- **Messagerie** : `site/messages.html` + `site/messagerie.js`, et la fonction serveur `supabase/functions/messagerie` (déjà déployée).
  - Réservée aux comptes. Le client choisit une catégorie (projet, modèle, suivi, retouches, paiement, partenariat, autre).
  - Toi (bouletpro45) : onglets **Acceptées | Demandes** (triées par catégorie) | Archives. Répondre à une demande l'accepte automatiquement.
  - Un e-mail te prévient à chaque nouvelle demande, et le client est prévenu quand tu réponds (sans le contenu, qui reste chiffré).
  - Les messages sont chiffrés (AES-256) dans la base. ⚠️ Ne régénère pas la clé secrète (service_role) du projet Supabase : les anciens messages deviendraient illisibles.
  - Pour changer les catégories : modifie-les **aux deux endroits** (`CATEGORIES_MSG` dans `messagerie.js` et `CATEGORIES` dans la fonction serveur), puis ajoute la nouvelle clé dans la règle `check` de la table `conversations`.

---

## 🎞️ Exporter une animation en MP4 (sans filmer l'écran)

Le serveur local doit tourner, puis dans un terminal :
```
python outils/rendu_mp4.py "http://localhost:8765/pub-site.html" "videos/ma-pub.mp4" 60
```
- `60` = images par seconde (30 suffit pour les formats courts).
- Pour une vidéo verticale, ajoute la taille : `… 60 1080 1920` (et `?format=vertical` dans l'adresse si le modèle a plusieurs formats).
- Le son est ajouté automatiquement si la page charge `commun/son.js`.
- Il faut Chrome, le module Python `websockets` et ffmpeg (celui installé avec Medal est utilisé ; le chemin est en haut du script).
