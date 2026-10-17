/* =========================================================
   MESSAGERIE.JS — la page Messagerie
     - pas de compte : invitation à se connecter (on revient ici après)
     - client : ses demandes, une nouvelle demande par catégorie,
                et la discussion une fois la demande acceptée
     - admin  : « Acceptées » | « Demandes » (triées par catégorie) | « Archives »,
                accepter / refuser / archiver, et répondre
   Les messages passent par la fonction serveur "messagerie" (chiffrés en base).
   ========================================================= */

const $m = (id) => document.getElementById(id);

// Les catégories proposées au client (les mêmes clés que dans la fonction serveur)
const CATEGORIES_MSG = [
  { id: 'projet',      nom: 'Nouveau projet ou devis',      detail: 'Logo, pub, spot : parlez-nous de votre idée.' },
  { id: 'modele',      nom: 'Personnaliser un modèle',      detail: 'Une question sur un modèle prêt.' },
  { id: 'suivi',       nom: 'Suivi de ma commande',         detail: 'Où en est ma vidéo, les délais.' },
  { id: 'retouches',   nom: 'Retouches sur ma vidéo',       detail: 'Ce que vous voulez changer.' },
  { id: 'paiement',    nom: 'Paiement ou facture',          detail: 'Acompte, solde, facture.' },
  { id: 'partenariat', nom: 'Partenariat ou collaboration', detail: 'Créateurs, agences, marques.' },
  { id: 'autre',       nom: 'Autre question',               detail: 'Tout le reste.' }
];
const STATUTS_MSG = {
  demande:  { texte: 'En attente', classe: 'statut-en-cours' },
  acceptee: { texte: 'Acceptée',   classe: 'statut-signe' },
  refusee:  { texte: 'Refusée',    classe: 'statut-annule' },
  fermee:   { texte: 'Archivée',   classe: 'statut-annule' }
};

let ADMIN = false;
let CONVERSATIONS = [];
let ouverte = null;          // id de la conversation affichée
let onglet = 'acceptee';     // onglet de l'admin
let dernierFil = '';         // pour ne redessiner les messages que s'ils ont changé

const quand = (iso) => {
  const d = new Date(iso);
  const aujourdhui = new Date().toDateString() === d.toDateString();
  return aujourdhui ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};
function vue(id) { ['vue-demo', 'vue-connexion', 'vue-messagerie'].forEach((v) => { $m(v).hidden = v !== id; }); }
function panneau(id) {
  ['msg-vide', 'msg-formulaire', 'msg-fil'].forEach((p) => { $m(p).hidden = p !== id; });
  $m('vue-messagerie').classList.toggle('panneau-ouvert', id !== 'msg-vide');
}

/* =====================================================
   1. LA LISTE DES CONVERSATIONS
   ===================================================== */
function ligneConversation(c) {
  const s = STATUTS_MSG[c.statut] || STATUTS_MSG.demande;
  return '<button type="button" class="msg-ligne' + (c.id === ouverte ? ' active' : '') + (c.nonLu ? ' non-lu' : '') + '" data-id="' + esc(c.id) + '">' +
    '<span class="msg-ligne-haut"><b>' + esc(ADMIN ? (c.nom || c.email) : c.categorieNom) + '</b><time>' + quand(c.maj_le) + '</time></span>' +
    '<span class="msg-ligne-sujet">' + esc(c.sujet) + '</span>' +
    (ADMIN ? '' : '<span class="statut ' + s.classe + '">' + s.texte + '</span>') +
    '</button>';
}

function afficherListe() {
  const boite = $m('msg-conversations');
  let html = '';
  if (ADMIN) {
    const parStatut = (st) => CONVERSATIONS.filter((c) => st === 'archive' ? (c.statut === 'refusee' || c.statut === 'fermee') : c.statut === st);
    $m('n-acceptee').textContent = parStatut('acceptee').length;
    $m('n-demande').textContent = parStatut('demande').length;
    const liste = parStatut(onglet);
    if (onglet === 'demande') {
      // Les demandes, rangées par catégorie
      CATEGORIES_MSG.forEach((cat) => {
        const dansCat = liste.filter((c) => c.categorie === cat.id);
        if (dansCat.length) html += '<h3 class="msg-groupe">' + cat.nom + ' <span>' + dansCat.length + '</span></h3>' + dansCat.map(ligneConversation).join('');
      });
    } else {
      html = liste.map(ligneConversation).join('');
    }
    if (!liste.length) html = '<p class="msg-aucune">' + ({ acceptee: 'Aucune conversation acceptée.', demande: 'Aucune demande en attente. 🎉', archive: 'Rien dans les archives.' })[onglet] + '</p>';
  } else {
    html = CONVERSATIONS.length ? CONVERSATIONS.map(ligneConversation).join('')
      : '<p class="msg-aucune">Pas encore de conversation. Cliquez sur « Nouvelle demande » pour nous écrire.</p>';
  }
  boite.innerHTML = html;
}

async function chargerListe() {
  const r = await NovimoAPI.messagerie('liste');
  ADMIN = r.admin;
  CONVERSATIONS = r.conversations;
  afficherListe();
}

$m('msg-conversations').addEventListener('click', (e) => {
  const b = e.target.closest('.msg-ligne');
  if (b) ouvrir(b.dataset.id);
});
$m('msg-onglets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-onglet]');
  if (!b) return;
  onglet = b.dataset.onglet;
  $m('msg-onglets').querySelectorAll('[data-onglet]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
  afficherListe();
});

/* =====================================================
   2. UNE CONVERSATION
   ===================================================== */
async function ouvrir(id, silencieux) {
  ouverte = id;
  if (!silencieux) { panneau('msg-fil'); $m('fil-messages').innerHTML = '<li class="msg-chargement">Chargement…</li>'; dernierFil = ''; afficherListe(); }
  let r;
  try { r = await NovimoAPI.messagerie('fil', { conversation: id }); }
  catch (err) { if (!silencieux) $m('fil-messages').innerHTML = '<li class="msg-chargement">' + esc(err.message) + '</li>'; return; }
  if (ouverte !== id) return;   // on a changé de conversation entre-temps
  const c = r.conversation;
  const s = STATUTS_MSG[c.statut] || STATUTS_MSG.demande;
  $m('fil-categorie').textContent = c.categorieNom;
  $m('fil-sujet').textContent = c.sujet;
  $m('fil-qui').textContent = ADMIN ? (c.nom ? c.nom + ' · ' : '') + c.email : 'Avec Novimo';
  $m('fil-statut').className = 'statut ' + s.classe;
  $m('fil-statut').textContent = s.texte;

  // Boutons de l'admin selon le statut
  $m('fil-actions').hidden = !ADMIN;
  if (ADMIN) $m('fil-actions').querySelectorAll('[data-statut]').forEach((b) => { b.hidden = b.dataset.statut === c.statut || (c.statut === 'acceptee' && b.dataset.statut === 'refusee'); });

  // Peut-on écrire ?
  const ferme = c.statut === 'refusee' || c.statut === 'fermee';
  const peutEcrire = !ferme && (ADMIN || c.statut === 'acceptee');
  $m('fil-ecrire').hidden = !peutEcrire;
  $m('fil-attente').hidden = peutEcrire;
  $m('fil-attente').textContent = ferme ? 'Cette conversation est fermée. Pour une nouvelle question, créez une nouvelle demande.'
    : 'Votre demande est bien reçue ⏳ Dès qu’elle est acceptée, vous pourrez discuter ici (on vous prévient aussi par e-mail).';

  // Les bulles (redessinées seulement si quelque chose a changé)
  const empreinte = r.messages.map((m) => m.id).join(',');
  if (empreinte !== dernierFil) {
    dernierFil = empreinte;
    const moi = ADMIN ? 'admin' : 'client';
    $m('fil-messages').innerHTML = r.messages.map((m) =>
      '<li class="msg-bulle' + (m.auteur === moi ? ' moi' : '') + '">' +
        '<p>' + esc(m.texte).replace(/\n/g, '<br>') + '</p>' +
        '<time datetime="' + esc(m.cree_le) + '">' + (m.auteur === 'admin' ? 'Novimo' : (ADMIN ? 'Client' : 'Vous')) + ' · ' + quand(m.cree_le) + '</time>' +
      '</li>').join('');
    $m('fil-messages').scrollTop = $m('fil-messages').scrollHeight;
  }
  // La pastille "non lu" disparaît
  const dansListe = CONVERSATIONS.find((x) => x.id === id);
  if (dansListe && dansListe.nonLu) { dansListe.nonLu = false; afficherListe(); }
}

// Envoyer un message (Entrée envoie, Maj + Entrée va à la ligne)
$m('fil-texte').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $m('fil-ecrire').requestSubmit(); }
});
$m('fil-texte').addEventListener('input', () => {
  const t = $m('fil-texte');
  t.style.height = 'auto';
  t.style.height = Math.min(t.scrollHeight, 160) + 'px';
});
$m('fil-ecrire').addEventListener('submit', async (e) => {
  e.preventDefault();
  const texte = $m('fil-texte').value.trim();
  if (!texte || !ouverte) return;
  $m('fil-envoyer').disabled = true;
  try {
    await NovimoAPI.messagerie('envoyer', { conversation: ouverte, message: texte });
    $m('fil-texte').value = '';
    $m('fil-texte').style.height = 'auto';
    await ouvrir(ouverte, true);
    chargerListe();
  } catch (err) {
    alert(err.message);
  }
  $m('fil-envoyer').disabled = false;
  $m('fil-texte').focus();
});

// Admin : accepter / refuser / archiver
$m('fil-actions').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-statut]');
  if (!b || !ouverte) return;
  if (b.dataset.statut === 'refusee' && !confirm('Refuser cette demande ? Le client ne pourra plus écrire dans cette conversation.')) return;
  b.disabled = true;
  try {
    await NovimoAPI.messagerie('statut', { conversation: ouverte, statut: b.dataset.statut });
    await chargerListe();
    await ouvrir(ouverte, true);
  } catch (err) { alert(err.message); }
  b.disabled = false;
});

document.querySelectorAll('[data-retour]').forEach((b) => b.addEventListener('click', () => {
  ouverte = null;
  panneau('msg-vide');
  afficherListe();
}));

/* =====================================================
   3. NOUVELLE DEMANDE (client)
   ===================================================== */
$m('msg-categories').innerHTML = CATEGORIES_MSG.map((c) =>
  '<label class="msg-categorie"><input type="radio" name="categorie" value="' + c.id + '">' +
  '<span><b>' + c.nom + '</b><small>' + c.detail + '</small></span></label>').join('');

// Arrivée depuis un autre lien (ex. messages.html?categorie=modele&sujet=…)
const paramsMsg = new URLSearchParams(location.search);

function ouvrirFormulaire() {
  ouverte = null;
  panneau('msg-formulaire');
  afficherListe();
  const cat = paramsMsg.get('categorie');
  if (cat) { const r = document.querySelector('input[name="categorie"][value="' + CSS.escape(cat) + '"]'); if (r) r.checked = true; }
  if (paramsMsg.get('sujet') && !$m('msg-sujet').value) $m('msg-sujet').value = paramsMsg.get('sujet').slice(0, 120);
}
$m('msg-nouveau').addEventListener('click', ouvrirFormulaire);
$m('msg-message').addEventListener('input', () => { $m('msg-compteur').textContent = $m('msg-message').value.length + ' / 2000'; });

function erreurChamp(id, texte, champ) {
  $m(id).textContent = texte || '';
  $m(id).hidden = !texte;
  if (champ) champ.setAttribute('aria-invalid', String(Boolean(texte)));
  return !texte;
}
$m('msg-formulaire').addEventListener('submit', async (e) => {
  e.preventDefault();
  const categorie = (document.querySelector('input[name="categorie"]:checked') || {}).value;
  const sujet = $m('msg-sujet').value.trim();
  const message = $m('msg-message').value.trim();
  const ok = [
    erreurChamp('err-categorie', categorie ? '' : 'Choisissez la catégorie qui correspond le mieux à votre demande.'),
    erreurChamp('err-sujet', sujet.length >= 3 ? '' : 'Indiquez un sujet (3 caractères minimum).', $m('msg-sujet')),
    erreurChamp('err-message', message.length >= 10 ? '' : 'Votre message est trop court (10 caractères minimum).', $m('msg-message'))
  ].every(Boolean);
  if (!ok) { $m('msg-form-statut').textContent = ''; return; }

  const bouton = $m('msg-envoyer-demande');
  bouton.disabled = true;
  $m('msg-form-statut').textContent = 'Envoi…';
  try {
    const r = await NovimoAPI.messagerie('nouvelle', { categorie, sujet, message });
    $m('msg-formulaire').reset();
    $m('msg-compteur').textContent = '0 / 2000';
    $m('msg-form-statut').textContent = '';
    await chargerListe();
    ouvrir(r.conversation.id);
  } catch (err) {
    $m('msg-form-statut').textContent = err.message;
  }
  bouton.disabled = false;
});

/* =====================================================
   4. DÉMARRAGE + mise à jour automatique
   ===================================================== */
(async function demarrer() {
  if (!NovimoAPI.actif) return vue('vue-demo');
  const u = await NovimoAPI.utilisateur();
  if (!u) {
    vue('vue-connexion');
    // après la connexion, la page Compte nous ramène ici
    $m('msg-creer-compte').addEventListener('click', () => {
      try { sessionStorage.setItem('novimo-retour', 'messages.html' + location.search); } catch (e) { /* rien */ }
    });
    return;
  }
  vue('vue-messagerie');
  try { await chargerListe(); }
  catch (err) { $m('msg-conversations').innerHTML = '<p class="msg-aucune">' + esc(err.message) + '</p>'; return; }

  if (ADMIN) {
    $m('msg-onglets').hidden = false;
    $m('msg-titre').innerHTML = 'Vos <span class="accent">messages</span>';
    $m('msg-intro').textContent = 'Les demandes arrivent dans « Demandes », rangées par catégorie. Acceptez-les (ou répondez directement) pour ouvrir la discussion.';
    // S'il y a des demandes en attente, on les montre d'abord
    if (CONVERSATIONS.some((c) => c.statut === 'demande')) $m('msg-onglets').querySelector('[data-onglet="demande"]').click();
    $m('msg-vide-texte').textContent = 'Choisissez une conversation à gauche.';
  } else {
    $m('msg-nouveau').hidden = false;
    $m('msg-vide-texte').textContent = 'Choisissez une conversation, ou créez une nouvelle demande.';
    if (!CONVERSATIONS.length || paramsMsg.get('categorie')) ouvrirFormulaire();
  }
  if (paramsMsg.get('conversation')) ouvrir(paramsMsg.get('conversation'));

  // Mise à jour automatique : la conversation ouverte toutes les 6 s, la liste toutes les 20 s
  setInterval(() => { if (!document.hidden && ouverte && !$m('msg-fil').hidden) ouvrir(ouverte, true); }, 6000);
  setInterval(() => { if (!document.hidden) chargerListe().catch(() => {}); }, 20000);
})();
