# Novimo — résumé du projet (à donner à une autre IA)

## 1. Le projet en deux phrases
**Novimo** est une petite entreprise de **motion design** : je crée des logos animés, des petites pubs et des spots vidéo pour des marques. Le projet contient le **site vitrine + espace client** (devis, compte, messagerie, FAQ, dashboard admin) et une **bibliothèque de modèles d'animation** en HTML/CSS/JS qui servent aussi à fabriquer mes propres pubs vidéo.

- Slogan : « Votre marque, en mouvement. »
- Réseaux : Instagram **@novimo_md**, TikTok **@novimo.com**
- E-mail admin / réception des devis : **bouletpro45@gmail.com**
- Domaine prévu (pas encore acheté) : `novimo.fr` (actuellement écrit `https://www.novimo.fr` dans le code)

## 2. Identité visuelle
| Élément | Valeur |
|---|---|
| Fond | `#0b0c09` (presque noir) |
| Accent | `#d4ff3f` (vert citron) |
| Texte | `#f2f0e8` (blanc cassé) |
| Police | Bricolage Grotesque (Google Fonts) |
| Logo | carré citron avec un « N » italique et des traits de vitesse, mot « novimo » en minuscules |

## 3. Tarifs (affichés sur le site et recalculés côté serveur)
| Offre | Prix |
|---|---|
| Logo animé | 297 € |
| Petite pub | 147 € |
| Pack | 389 € |
| Spot 30 s | 743 € |
| Spot 60 s | 1487 € |
| Modèle court | 89 € |
| Modèle long | 137 € |
| Modèle spot | 447 € |

Options : express +59 €, retouche +47 €, format paysage +37 €/animation. Acompte : 30 %.

## 4. Technique
- **Front-end** : HTML + CSS + JavaScript « vanilla » (aucun framework, aucun build). Les URL des fichiers CSS/JS portent `?v=8` pour casser le cache.
- **Back-end** : **Supabase** (base Postgres + Auth + Edge Functions en TypeScript/Deno).
  - Connexion par e-mail/mot de passe et Google OAuth.
  - **RLS activé sur toutes les tables.**
  - Tables principales : `devis` (avec `ip_hash`), `visites` (analytics maison), `conversations`, `messages`.
  - Edge Function **`envoyer-devis`** : recalcule les prix côté serveur (on ne fait jamais confiance au prix envoyé par le navigateur), anti-spam (champ piège `site_web`, temps de remplissage minimum, IP hachée), consentement obligatoire, validation des champs, envoi de l'e-mail via **Brevo**.
  - Edge Function **`messagerie`** : messages **chiffrés AES-256-GCM** (clé dérivée par HKDF d'un secret serveur), réservée aux utilisateurs connectés.
  - La clé `service_role` n'est **jamais** dans le front-end ; les secrets sont uniquement dans Supabase.
- **Hébergement prévu** : Netlify (`netlify.toml` prêt) ; `.htaccess` fourni aussi pour un hébergeur Apache. Les deux forcent le HTTPS et ajoutent des en-têtes de sécurité.

## 5. Arborescence (dossier `motion-design/`)
```
motion-design/
├── site/                     ← le site
│   ├── index.html            accueil (un seul appel à l'action clair : « Demander mon devis »)
│   ├── modeles.html          catalogue des modèles d'animation
│   ├── devis.html            formulaire de devis (validé + anti-spam)
│   ├── messages.html         messagerie chiffrée (compte obligatoire, catégories)
│   ├── faq.html              FAQ
│   ├── compte.html           espace client
│   ├── dashboard.html        dashboard admin (visible seulement par l'admin)
│   ├── confidentialite.html  politique RGPD
│   ├── cgu.html              CGU + mentions légales
│   ├── reglages.js           réglages globaux (onglets, e-mail, réseaux…)
│   ├── commun.js             barre latérale, icônes, badge « non lu »
│   ├── api.js                appels Supabase / Edge Functions
│   ├── confiance.js          HTTPS, bannière cookies, analytics (seulement après consentement)
│   ├── compte.js, devis.js, messagerie.js, faq.js, dashboard.js
│   ├── style.css
│   └── og-image.jpg, favicons, site.webmanifest
├── commun/
│   ├── moteur.js             moteur d'animation (timeline, export, mode propre)
│   └── son.js                effets sonores + musique synthétisés (Web Audio)
├── *.html (racine)           modèles d'animation + mes pubs
├── outils/rendu_mp4.py       export d'une animation HTML en MP4
├── videos/                   les pubs exportées
├── supabase/                 schema.sql, migrations SQL, functions/
├── 404.html, sitemap.xml, robots.txt, favicon.ico, netlify.toml, .htaccess
└── GUIDE.md                  guide complet (mise en ligne, messagerie, export MP4)
```

## 6. Le moteur d'animation (`commun/moteur.js` + `commun/son.js`)
- Chaque animation appelle `Studio.demarrer(REGLAGES, construire)`. Les textes/couleurs modifiables sont dans l'objet `REGLAGES` en haut du fichier.
- Animation des éléments avec `S.anim(element, keyframes, début, durée, courbe)` (Web Animations API). Autres aides : `S.creer`, `S.lettres`, `S.ajuster`, `S.son`…
- Les sons sont **générés par le code** (aucun fichier audio) : whoosh, clic, notification, impact, ding, musique 120 BPM, etc. Bouton « ⬇ Bande-son (.wav) » pour exporter le son.
- `?integre=1` dans l'URL : cache l'interface et boucle. Touche **P** : mode « propre » pour filmer l'écran.
- **Export MP4** : `python outils/rendu_mp4.py <url> <sortie.mp4> [fps] [largeur] [hauteur]`. Le script pilote Chrome sans fenêtre, capture l'animation image par image et assemble avec ffmpeg (+ la bande-son WAV).

## 7. Ce qui a été fait
**Site :**
- Pages RGPD, CGU/mentions légales, FAQ, 404 personnalisée.
- Clés et logique sensible sorties du front-end vers les Edge Functions.
- HTTPS forcé, bannière cookies, analytics maison (avec consentement), balises meta title/description, image de partage (OG), favicon, sitemap + robots.txt.
- Textes alternatifs, images compressées, contrastes corrigés, site responsive (testé sans débordement sur mobile), liens cassés réparés (39 liens vérifiés).
- Formulaire de devis validé avec protection anti-spam ; tests passés : prix truqué refusé, envoi trop rapide refusé, champ piège, consentement manquant, téléphone invalide.
- Messagerie chiffrée avec catégories ; côté admin, vue « Acceptées | Demandes » triée par catégorie ; accessible depuis la barre latérale et la page Contact. **Testée et validée.**
- Liens Instagram et TikTok ajoutés. « Tableau de bord » renommé « Dashboard ». Le bouton Dashboard est caché aux comptes non admin.
- Les 10 pages sont testées : aucune erreur JavaScript.

**Vidéos (dans `videos/`) :**
- `pub-site-novimo.mp4` : 16:9, 39,5 s, 1920×1080, 60 i/s. Un utilisateur utilise le site : notifications d'intro, connexion, devis, e-mail reçu, messagerie avec réponse rapide.
- `pub-appli-novimo.mp4` : 9:16, 20 s. Pub « premium » avec un iPhone 3D sur un bureau en bois, en 4 plans : macro sur la tranche, rotation avec statistiques en direct, record avec éclat de lumière, écran de fin.
- `pub-appli-mac-novimo.mp4` : la même pub avec un MacBook à la place de l'iPhone.
- Sources HTML : `pub-site.html`, `pub-appli.html`, `pub-appli-mac.html`, ainsi que `tiktok-novimo.html` et `tiktok-code.html`.

## 8. Ce qu'il reste à faire pour la mise en ligne
1. **Acheter le domaine**, puis remplacer `https://www.novimo.fr` dans les pages, `sitemap.xml`, `robots.txt` et le réglage `site:` des vidéos si le nom change.
2. **Héberger sur Netlify** (glisser le dossier ou relier un dépôt Git), puis brancher le domaine.
3. **Supabase → Authentication → URL Configuration** : mettre la « Site URL » et les « Redirect URLs » du vrai domaine.
4. **Google Cloud (OAuth)** : ajouter le domaine dans les « origines autorisées » et les « URI de redirection ».
5. **Brevo** : authentifier le domaine (DKIM/DMARC) pour que les e-mails n'arrivent pas en spam.
6. Remplir les `[crochets]` dans `confidentialite.html` et `cgu.html` (statut micro-entreprise, SIRET, responsable légal…).
7. Supprimer les 6 devis de TEST dans Supabase.
8. Tout retester une fois en ligne : connexion, Google, devis, e-mail, messagerie, dashboard.

## 9. Règles à respecter si tu modifies le projet
- Garder du **JS vanilla**, sans framework ni étape de build. Les noms de variables et les commentaires sont **en français**.
- Ne **jamais** mettre de clé secrète (surtout `service_role`) dans les fichiers du site.
- Les prix sont toujours vérifiés côté serveur, dans `envoyer-devis`.
- Après une modification de CSS/JS, incrémenter le `?v=` dans les pages.
- Respecter la direction artistique : fond sombre, accent citron, Bricolage Grotesque.
