/* =========================================================
   COMPTE.JS — la page "Mon compte"
     - pas connecté : bouton Google ou lien de connexion par e-mail
     - connecté     : la liste de ses devis et leur statut
   ========================================================= */

const $c = (id) => document.getElementById(id);

// Les statuts d'un devis, en mots simples pour le client
const STATUTS = {
  en_cours: { texte: 'En cours',         classe: 'statut-en-cours' },
  signe:    { texte: 'Acompte reçu',     classe: 'statut-signe' },
  cloture:  { texte: 'Terminé et payé',  classe: 'statut-cloture' },
  annule:   { texte: 'Annulé',           classe: 'statut-annule' }
};

function montrer(vue) {
  ['vue-demo', 'vue-connexion', 'vue-espace'].forEach((id) => { $c(id).hidden = id !== vue; });
}

let tourAffichage = 0;   // seul le dernier affichage demandé compte
async function rafraichir() {
  if (!NovimoAPI.actif) return montrer('vue-demo');
  const tour = ++tourAffichage;
  const u = await NovimoAPI.utilisateur();
  if (tour !== tourAffichage) return;
  if (!u) return montrer('vue-connexion');

  // Venu depuis la page devis ou la messagerie pour créer son compte : on l'y ramène
  let retour = null;
  try { retour = sessionStorage.getItem('novimo-retour'); sessionStorage.removeItem('novimo-retour'); } catch (e) { /* rien */ }
  if (retour && /^(devis|messages)\.html(\?[\w=&%.-]*)?$/.test(retour)) return location.replace(retour);

  montrer('vue-espace');
  const nom = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || '';
  $c('bonjour').textContent = 'Bonjour' + (nom ? ' ' + nom.split(' ')[0] : '') + ' !';
  $c('email-connecte').textContent = 'Connecté avec ' + u.email;
  $c('lien-dashboard').hidden = !NovimoAPI.estAdmin(u);
  resumeMessagerie();

  try {
    const devis = await NovimoAPI.mesDevis();
    $c('aucun-devis').hidden = devis.length > 0;
    $c('liste-devis').innerHTML = devis.map((d, i) => {
      const s = STATUTS[d.statut] || STATUTS.en_cours;
      const date = new Date(d.cree_le).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const contenu = (d.lignes || []).map((l) => esc(l.texte)).join(' · ');
      return '<li class="ligne-devis">' +
        '<div><strong>' + esc(d.numero) + '</strong><span>' + date + ' · ' + contenu + '</span></div>' +
        '<div class="ligne-devis-prix"><b>' + euros(Number(d.total)) + '</b><span>acompte ' + euros(Number(d.acompte)) + '</span></div>' +
        '<span class="statut ' + s.classe + '">' + s.texte + '</span>' +
        '<button class="bouton-fantome bouton-pdf" type="button" data-i="' + i + '">PDF</button>' +
        '</li>';
    }).join('');
    // Re-télécharger le PDF d'un ancien devis
    $c('liste-devis').querySelectorAll('.bouton-pdf').forEach((b) => b.addEventListener('click', () => {
      const d = devis[b.dataset.i];
      creerPdfDevis({
        numero: d.numero, date: d.cree_le, commerce: d.commerce, type: d.type_commerce, prenom: d.prenom,
        email: d.email, tel: d.telephone, message: d.message, lignes: d.lignes, total: d.total,
        acompte: d.acompte, acomptePourcent: R.acompte, contact: R.email
      }).save('Devis-' + d.numero + '.pdf');
    }));
  } catch (err) {
    $c('aucun-devis').hidden = false;
    $c('aucun-devis').textContent = 'Impossible de charger vos devis pour le moment (' + err.message + ').';
  }
}

/* ---------- Connexion ---------- */
$c('btn-google').addEventListener('click', async () => {
  try { await NovimoAPI.connexionGoogle(); }
  catch (err) { $c('message-connexion').textContent = 'Connexion Google impossible : ' + err.message; }
});

$c('form-lien').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $c('email-lien').value.trim();
  const bouton = $c('btn-lien');
  const valide = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  $c('email-lien').setAttribute('aria-invalid', String(!valide));
  if (!valide) {
    $c('message-connexion').textContent = 'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.';
    $c('email-lien').focus();
    return;
  }
  bouton.disabled = true;
  try {
    const { error } = await NovimoAPI.connexionParLien(email);
    if (error) throw error;
    $c('message-connexion').innerHTML = 'C\'est envoyé ! Ouvrez l\'e-mail reçu à <strong>' + esc(email) + '</strong> et cliquez sur le lien pour vous connecter.';
    // Anti-spam : on ne peut redemander un lien qu'au bout d'une minute
    setTimeout(() => { bouton.disabled = false; }, 60000);
    return;
  } catch (err) {
    $c('message-connexion').textContent = 'Envoi impossible : ' + err.message;
  }
  bouton.disabled = false;
});

$c('btn-deconnexion').addEventListener('click', async () => {
  // on repasse tout de suite sur l'écran de connexion, sans attendre ni recharger
  tourAffichage++;
  $c('liste-devis').innerHTML = '';
  $c('message-connexion').textContent = '';
  montrer('vue-connexion');
  try { await NovimoAPI.deconnexion(); } catch (err) { console.error(err); }
  rafraichir();
});

NovimoAPI.quandConnexionChange(rafraichir);
rafraichir();

/* ---------- Le résumé de la messagerie ----------
   Admin : conversations acceptées | demandes en attente (par catégorie)
   Client : ses conversations et les réponses non lues */
async function resumeMessagerie() {
  let r;
  try { r = await NovimoAPI.messagerie('liste'); } catch (e) { return; }   // messagerie pas encore installée
  const conv = r.conversations;
  const demandes = conv.filter((c) => c.statut === 'demande');
  const acceptees = conv.filter((c) => c.statut === 'acceptee');
  const nonLus = conv.filter((c) => c.nonLu).length;
  $c('bloc-messages').hidden = false;
  if (r.admin) {
    $c('bm-titre').textContent = 'Messages : ' + acceptees.length + ' acceptée' + (acceptees.length > 1 ? 's' : '') + ' | ' + demandes.length + ' demande' + (demandes.length > 1 ? 's' : '');
    $c('bm-texte').textContent = nonLus ? nonLus + ' conversation(s) avec du nouveau.' : 'Rien de nouveau pour le moment.';
    const parCategorie = {};
    demandes.forEach((c) => { parCategorie[c.categorieNom] = (parCategorie[c.categorieNom] || 0) + 1; });
    $c('bm-categories').innerHTML = Object.entries(parCategorie).sort((a, b) => b[1] - a[1])
      .map(([nom, n]) => '<span>' + esc(nom) + ' · ' + n + '</span>').join('');
  } else {
    $c('bm-titre').textContent = 'Mes messages';
    $c('bm-texte').textContent = !conv.length ? 'Une question, un projet ? Écrivez-nous directement sur le site.'
      : nonLus ? 'Vous avez ' + nonLus + ' nouvelle(s) réponse(s) de Novimo.'
      : conv.length + ' conversation' + (conv.length > 1 ? 's' : '') + (demandes.length ? ', dont ' + demandes.length + ' en attente.' : '.');
    $c('bm-lien').textContent = conv.length ? 'Ouvrir la messagerie' : 'Écrire un message';
  }
}
