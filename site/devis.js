/* =========================================================
   DEVIS.JS — le calcul du devis en direct
     1. construit la liste des animations et des options (depuis reglages.js)
     2. recalcule le total à chaque clic
     3. "Envoyer ma demande" -> ouvre un e-mail déjà rempli
        "Enregistrer en PDF"  -> ouvre l'impression du navigateur
   Les prix se changent dans reglages.js, pas ici.
   Sur le site anglais (devis-en.html) : tout est en anglais pour le client,
   et tu reçois quand même le devis en français (mention « client étranger »).
   ========================================================= */

const TARIFS = R.tarifs || [];
const OPTIONS = R.options || [];

const quantites = {};          // ex. { logo: 1, pub: 0 ... }
const optionsChoisies = {};    // ex. { express: true }
TARIFS.forEach((a) => { quantites[a.id] = 0; });
OPTIONS.forEach((o) => { optionsChoisies[o.id] = false; });

const $ = (id) => document.getElementById(id);

// Le nom d'une animation ou d'une option dans une langue donnée ('fr' ou 'en')
const nomEn = (objet, langue) => (langue === 'en' && objet.en && objet.en.nom) || objet.nom;

/* ---------- 1. Construction des listes ---------- */

// Un intertitre avant chaque groupe (Réseaux sociaux, YouTube et TV...)
const GROUPES = R.groupes || [];
let groupePrecedent = null;
$('produits').innerHTML = TARIFS.map((a) => {
  let intertitre = '';
  if (a.groupe && a.groupe !== groupePrecedent) {
    const g = GROUPES.find((x) => x.id === a.groupe);
    if (g) intertitre = '<li class="produits-groupe"><strong>' + tr(g, 'nom') + '</strong> ' + tr(g, 'detail') + '</li>';
    groupePrecedent = a.groupe;
  }
  return intertitre +
  '<li class="produit" data-id="' + a.id + '">' +
    '<div class="produit-texte"><h3>' + tr(a, 'nom') + '</h3><p>' + tr(a, 'description') + '</p></div>' +
    '<span class="produit-prix">' + euros(prixLocal(a)) +
      (a.prixPro ? '<small>' + t('Freelance : dès ', 'Freelancer: from ') + euros(prixLocal(a, 'prixPro')) + '</small>' : '') + '</span>' +
    '<div class="compteur" role="group" aria-label="' + t('Quantité ', 'Quantity ') + tr(a, 'nom') + '">' +
      '<button type="button" data-pas="-1" aria-label="' + t('Retirer un ', 'Remove one ') + tr(a, 'nom') + '">−</button>' +
      '<output aria-live="polite">0</output>' +
      '<button type="button" data-pas="1" aria-label="' + t('Ajouter un ', 'Add one ') + tr(a, 'nom') + '">+</button>' +
    '</div>' +
  '</li>';
}).join('');

$('options').innerHTML = OPTIONS.map((o) =>
  '<label class="option">' +
    '<input type="checkbox" data-option="' + o.id + '">' +
    '<span class="interrupteur" aria-hidden="true"></span>' +
    '<span class="option-texte"><strong>' + tr(o, 'nom') + '</strong><span>' + tr(o, 'detail') + '</span></span>' +
    '<span class="option-prix">+' + euros(prixLocal(o)) + (o.parAnimation ? ' / animation' : '') + '</span>' +
  '</label>'
).join('');

/* ---------- Pré-remplissage depuis l'adresse ----------
   ex. devis.html?logo=1&commerce=Chez%20Mila (lien envoyé par l'essai en direct) */
const params = new URLSearchParams(location.search);
TARIFS.forEach((a) => {
  const n = parseInt(params.get(a.id), 10);
  if (n > 0) quantites[a.id] = Math.min(n, 20);
});
if (params.get('commerce')) $('d-commerce').value = params.get('commerce');
if (params.get('message')) $('d-message').value = params.get('message');

/* ---------- Numéro et date du devis ---------- */
const maintenant = new Date();
const aaaammjj = maintenant.toISOString().slice(0, 10).replace(/-/g, '');
// ex. NOV-20261016-K7Q2 (4 caractères au hasard pour qu'il soit unique)
const hasard4 = () => Array.from({ length: 4 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
let numeroDevis = 'NOV-' + aaaammjj + '-' + hasard4();
$('r-numero').textContent = numeroDevis;
const POURCENT_ACOMPTE = R.acompte || 30;
document.querySelectorAll('.r-pourcent').forEach((el) => { el.textContent = POURCENT_ACOMPTE; });
const acompteDe = (total) => Math.round(total * POURCENT_ACOMPTE) / 100;
$('r-date').textContent = maintenant.toLocaleDateString(t('fr-FR', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- 2. Le calcul ----------
   langue : la langue des lignes du devis (celle de la page, ou 'fr' pour ta copie) */

function calculer(langue) {
  langue = langue || LANGUE;
  const lignes = [];
  let total = 0;
  let nbAnimations = 0;
  let totalAnimations = 0; // prix Novimo des animations seules (sans options)
  let totalPro = 0;        // prix de départ d'un freelance pour les mêmes animations

  TARIFS.forEach((a) => {
    const q = quantites[a.id];
    if (!q) return;
    lignes.push({ texte: (q > 1 ? q + ' × ' : '') + nomEn(a, langue), montant: q * prixLocal(a) });
    total += q * prixLocal(a);
    totalAnimations += q * prixLocal(a);
    totalPro += q * (prixLocal(a, 'prixPro') || prixLocal(a));
    nbAnimations += q * (a.contenu ? a.contenu.length : 1); // un pack compte pour plusieurs animations
  });

  OPTIONS.forEach((o) => {
    if (!optionsChoisies[o.id]) return;
    // Combien d'animations sont concernées par cette option ? (pasPour = exclues)
    const concernees = TARIFS.reduce((n, a) =>
      (o.pasPour || []).includes(a.id) ? n : n + quantites[a.id] * (a.contenu ? a.contenu.length : 1), 0);
    if (concernees === 0) return;
    const fois = o.parAnimation ? concernees : 1;
    lignes.push({ texte: nomEn(o, langue) + (fois > 1 ? ' (' + fois + ' animations)' : ''), montant: fois * prixLocal(o) });
    total += fois * prixLocal(o);
  });

  return { lignes, total, nbAnimations, totalAnimations, totalPro };
}

let totalAffiche = 0;
let numeroDefilement = 0;
const clientParDefaut = t('votre entreprise', 'your business');

function afficher() {
  const { lignes, total, totalAnimations, totalPro } = calculer();

  // La comparaison avec un freelance
  const economie = totalPro - totalAnimations;
  $('r-eco').hidden = economie <= 0;
  $('r-eco').innerHTML = t('Pour ces animations, un freelance demande dès ', 'For these animations, a freelancer charges from ') + euros(totalPro) +
    '.<br><strong>' + t('Vous économisez au moins ', 'You save at least ') + euros(economie) + '.</strong>';

  // Les compteurs
  document.querySelectorAll('.produit').forEach((li) => {
    const q = quantites[li.dataset.id];
    li.querySelector('output').textContent = q;
    li.classList.toggle('choisi', q > 0);
    li.querySelector('[data-pas="-1"]').disabled = q === 0;
  });

  // Les lignes du récapitulatif
  $('r-lignes').innerHTML = lignes.map((l) =>
    '<li><span>' + l.texte + '</span><span>' + euros(l.montant) + '</span></li>').join('');
  $('r-vide').hidden = lignes.length > 0;
  $('r-client').textContent = $('d-commerce').value.trim() || clientParDefaut;
  $('r-acompte').textContent = euros(acompteDe(total));

  // Le total "défile" jusqu'à sa nouvelle valeur.
  // (si on reclique pendant le défilement, l'ancien défilement s'arrête)
  const depart = totalAffiche;
  const debut = performance.now();
  const duree = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
  const ceDefilement = ++numeroDefilement;
  (function etape(temps) {
    if (ceDefilement !== numeroDefilement) return;
    const p = duree ? Math.min(1, Math.max(0, (temps - debut) / duree)) : 1;
    const doux = 1 - Math.pow(1 - p, 3);
    totalAffiche = Math.round(depart + (total - depart) * doux);
    $('r-total').textContent = euros(totalAffiche);
    if (p < 1) requestAnimationFrame(etape);
  })(debut);
  // Filet de sécurité : la bonne valeur est toujours affichée à la fin
  setTimeout(() => {
    if (ceDefilement === numeroDefilement) { totalAffiche = total; $('r-total').textContent = euros(total); }
  }, duree + 50);

  // Astuce : proposer le pack quand on a pris séparément tout ce qu'il contient
  const pack = TARIFS.find((a) => a.contenu);
  const trio = pack ? pack.contenu.filter((id) => TARIFS.some((a) => a.id === id)) : [];
  const astuce = $('astuce-pack');
  const economiePack = trio.reduce((s, id) => s + prixLocal(TARIFS.find((a) => a.id === id)), 0) - (pack ? prixLocal(pack) : 0);
  if (pack && trio.length && economiePack > 0 && trio.every((id) => quantites[id] >= 1)) {
    astuce.innerHTML = t('Avec le ' + pack.nom.toLowerCase() + ', vous économisez ' + euros(economiePack) + '.',
      'With the ' + tr(pack, 'nom').toLowerCase() + ', you save ' + euros(economiePack) + '.') +
      ' <button type="button" id="passer-pack">' + t('Passer au pack', 'Switch to the pack') + '</button>';
    astuce.hidden = false;
    $('passer-pack').addEventListener('click', () => {
      trio.forEach((id) => { quantites[id] -= 1; });
      quantites[pack.id] += 1;
      afficher();
    });
  } else {
    astuce.hidden = true;
  }

  $('erreur').textContent = '';
}

/* ---------- Les clics ---------- */

$('produits').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-pas]');
  if (!b) return;
  const id = b.closest('.produit').dataset.id;
  quantites[id] = Math.max(0, Math.min(20, quantites[id] + parseInt(b.dataset.pas, 10)));
  afficher();
});

$('options').addEventListener('change', (e) => {
  if (e.target.dataset.option) {
    optionsChoisies[e.target.dataset.option] = e.target.checked;
    afficher();
  }
});

$('d-commerce').addEventListener('input', () => {
  $('r-client').textContent = $('d-commerce').value.trim() || clientParDefaut;
});
$('devis').addEventListener('submit', (e) => e.preventDefault());

/* ---------- 3. Envoyer / télécharger le PDF ---------- */

const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const telValide = (n) => !n || /^[+0-9 ().-]{6,20}$/.test(n);
const debutRemplissage = Date.now();   // anti-spam : un robot remplit tout en une fraction de seconde

/* Chaque champ a sa règle et son message, affiché juste en dessous */
const REGLES = [
  { id: 'd-commerce', erreur: 'err-commerce', ok: (v) => v.length >= 2, message: t('Indiquez le nom de votre entreprise ou de votre marque (2 lettres minimum).', 'Enter the name of your business or brand (at least 2 letters).') },
  { id: 'd-prenom',   erreur: 'err-prenom',   ok: (v) => !v || /^[\p{L}' -]{1,40}$/u.test(v), message: t('Votre prénom ne doit contenir que des lettres.', 'Your first name can only contain letters.') },
  { id: 'd-email',    erreur: 'err-email',    ok: emailValide, message: t('Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.', 'Enter a valid email address, for example name@domain.com.') },
  { id: 'd-tel',      erreur: 'err-tel',      ok: telValide, message: t('Numéro invalide : chiffres, espaces et + seulement (ex. 06 12 34 56 78).', 'Invalid number: digits, spaces and + only (e.g. +44 20 7946 0958).') },
  { id: 'd-accord',   erreur: 'err-accord',   ok: () => $('d-accord').checked, message: t('Cochez cette case pour que nous puissions traiter votre demande.', 'Tick this box so we can process your request.') }
];
function verifierChamp(r) {
  const champ = $(r.id);
  const valeur = champ.type === 'checkbox' ? '' : champ.value.trim();
  const ok = r.ok(valeur);
  champ.setAttribute('aria-invalid', String(!ok));
  $(r.erreur).textContent = ok ? '' : r.message;
  $(r.erreur).hidden = ok;
  return ok;
}
// Le message disparaît dès que le champ est corrigé
REGLES.forEach((r) => {
  const champ = $(r.id);
  const evenement = champ.type === 'checkbox' ? 'change' : 'blur';
  champ.addEventListener(evenement, () => { if (champ.value.trim() || champ.type === 'checkbox' || champ.hasAttribute('aria-invalid')) verifierChamp(r); });
  champ.addEventListener('input', () => { if (champ.getAttribute('aria-invalid') === 'true') verifierChamp(r); });
});

function verifier() {
  const { lignes } = calculer();
  if (!lignes.length) {
    $('erreur').textContent = t('Ajoutez au moins une animation avec le bouton +.', 'Add at least one animation with the + button.');
    document.querySelector('.produit button[data-pas="1"]').focus();
    return false;
  }
  const fautifs = REGLES.filter((r) => !verifierChamp(r));
  if (fautifs.length) {
    $('erreur').textContent = fautifs.length === 1 ? t('Un champ est à corriger.', 'One field needs fixing.')
      : fautifs.length + t(' champs sont à corriger.', ' fields need fixing.');
    $(fautifs[0].id).focus();
    return false;
  }
  return true;
}

// Toutes les informations du devis, rassemblées (pour le PDF et l'envoi)
// langue : celle des lignes et du PDF ('fr' pour ta copie d'un client étranger)
function donneesDevis(langue) {
  langue = langue || LANGUE;
  const { lignes, total, totalPro, totalAnimations } = calculer(langue);
  return {
    numero: numeroDevis,
    date: new Date().toISOString(),
    langue: langue,
    devise: DEVISE,              // 'EUR' (site français) ou 'USD' (site anglais)
    clientEtranger: EN,
    commerce: $('d-commerce').value.trim(),
    type: $('d-type').value,
    prenom: $('d-prenom').value.trim(),
    email: $('d-email').value.trim(),
    tel: $('d-tel').value.trim(),
    message: $('d-message').value.trim(),
    lignes: lignes,
    // le détail des prestations choisies (sert aux statistiques du tableau de bord)
    prestations: TARIFS.filter((a) => quantites[a.id] > 0).map((a) => ({ id: a.id, nom: a.nom, quantite: quantites[a.id] })),
    options: OPTIONS.filter((o) => optionsChoisies[o.id]).map((o) => o.id),
    accord: $('d-accord').checked,
    // anti-spam (vérifiés par le serveur)
    site_web: $('d-site-web').value,
    tempsRemplissage: Date.now() - debutRemplissage,
    total: total,
    acompte: acompteDe(total),
    acomptePourcent: POURCENT_ACOMPTE,
    economie: totalPro - totalAnimations,
    contact: R.email
  };
}

function message(texte, succes) {
  $('erreur').textContent = succes ? '' : texte;
  $('succes').hidden = !succes;
  if (succes) $('succes').innerHTML = texte;
}

const texteBoutonEnvoyer = $('envoyer').textContent;
$('envoyer').addEventListener('click', async () => {
  if (!verifier()) return;
  const d = donneesDevis();
  const bouton = $('envoyer');

  /* --- Mode démo (Supabase pas encore branché) : PDF téléchargé + e-mail préparé --- */
  if (!NovimoAPI.actif) {
    creerPdfDevis(d).save(t('Devis-', 'Quote-') + d.numero + '.pdf');
    const corps = t('Bonjour,\n\nVoici ma demande de devis n° ', 'Hello,\n\nHere is my quote request no. ') + d.numero + t(' (le PDF est joint).\n\n', ' (PDF attached).\n\n') +
      d.lignes.map((l) => '- ' + l.texte + ' : ' + euros(l.montant)).join('\n') +
      '\n\nTotal : ' + euros(d.total) + t(' — acompte de ', ' — deposit of ') + d.acomptePourcent + t(' % à la signature : ', '% on signature: ') + euros(d.acompte) +
      t('\n\nCommerce : ', '\n\nBusiness: ') + d.commerce + ' (' + d.type + ')\nE-mail : ' + d.email + t('\nTéléphone : ', '\nPhone: ') + (d.tel || '-') +
      t('\n\nMon idée :\n', '\n\nMy idea:\n') + (d.message || '-') + t('\n\nMerci !', '\n\nThank you!');
    window.location.href = 'mailto:' + (R.emailDevis || R.email) +
      '?subject=' + encodeURIComponent((EN ? '[Client étranger] ' : '') + t('Demande de devis ', 'Quote request ') + d.numero + ' — ' + d.commerce) +
      '&body=' + encodeURIComponent(corps);
    message(t('Votre PDF vient d\'être téléchargé : <strong>joignez-le à l\'e-mail</strong> qui s\'ouvre, puis envoyez-le.',
      'Your PDF has just been downloaded: <strong>attach it to the email</strong> that opens, then send it.'), true);
    return;
  }

  /* --- Mode en ligne : la fonction serveur enregistre le devis et envoie les e-mails --- */
  bouton.disabled = true;
  bouton.textContent = t('Envoi en cours…', 'Sending…');
  try {
    let resultat = null;
    for (let essai = 0; essai < 2; essai++) {
      try {
        const pdf = creerPdfDevis(d).output('datauristring').split(',')[1];
        // Client étranger : ta copie à toi est en français
        const pdfAdmin = EN ? creerPdfDevis(Object.assign(donneesDevis('fr'), { numero: d.numero })).output('datauristring').split(',')[1] : null;
        resultat = await NovimoAPI.envoyerDevis(d, pdf, pdfAdmin);
        break;
      } catch (err) {
        // numéro déjà pris (très rare) : on en tire un autre et on réessaie une fois
        if (essai === 0 && /numero/i.test(String(err.message))) {
          numeroDevis = d.numero = 'NOV-' + aaaammjj + '-' + hasard4();
          $('r-numero').textContent = numeroDevis;
        } else throw err;
      }
    }
    if (resultat && resultat.emailEnvoye === false) {
      // enregistré, mais l'e-mail n'est pas parti : on donne le PDF tout de suite
      creerPdfDevis(d).save(t('Devis-', 'Quote-') + d.numero + '.pdf');
      message(t('Devis bien reçu ! L\'e-mail de confirmation n\'a pas pu partir : votre PDF vient d\'être téléchargé.',
        'Quote received! The confirmation email could not be sent: your PDF has just been downloaded.'), true);
    } else {
      message(t('Devis envoyé ! Vous allez recevoir le PDF à l\'adresse <strong>', 'Quote sent! You will receive the PDF at <strong>') + esc(d.email) +
        t('</strong>. Je vous réponds très vite.', '</strong>. I will get back to you very soon.'), true);
    }
    bouton.textContent = t('Devis envoyé ✓', 'Quote sent ✓');
  } catch (err) {
    bouton.disabled = false;
    bouton.textContent = texteBoutonEnvoyer;
    message(t('L\'envoi n\'a pas marché (', 'Sending failed (') + err.message +
      t('). Réessayez, ou téléchargez le PDF et envoyez-le par e-mail.', '). Try again, or download the PDF and send it by email.'));
  }
});

$('imprimer').addEventListener('click', () => {
  if (verifier()) creerPdfDevis(donneesDevis()).save(t('Devis-', 'Quote-') + numeroDevis + '.pdf');
});

// Si la personne est connectée à son compte, on remplit son e-mail et son prénom
NovimoAPI.utilisateur().then((u) => {
  if (!u) return proposerCompte();
  if (!$('d-email').value) $('d-email').value = u.email || '';
  $('r-email').textContent = $('d-email').value;
  const nom = (u.user_metadata && (u.user_metadata.full_name || u.user_metadata.name)) || '';
  if (!$('d-prenom').value && nom) $('d-prenom').value = nom.split(' ')[0];
});
$('d-email').addEventListener('input', () => { $('r-email').textContent = $('d-email').value.trim(); });

/* Pas connecté : on propose (sans obliger) de créer un compte gratuit.
   "Continuer sans compte" ferme la fenêtre ; on ne la remontre plus pendant la visite. */
function proposerCompte() {
  const fenetre = $('proposer-compte');
  if (!NovimoAPI.actif || !fenetre || !fenetre.showModal) return;
  try { if (sessionStorage.getItem('novimo-compte-ignore')) return; } catch (e) { /* navigation privée */ }
  // Première visite : on attend que le visiteur ait choisi sa langue
  if (Langue.enAttente()) {
    document.addEventListener('novimo-langue-choisie', proposerCompte, { once: true });
    return;
  }
  setTimeout(() => fenetre.showModal(), 700);
  const ignorer = () => {
    try { sessionStorage.setItem('novimo-compte-ignore', '1'); } catch (e) { /* rien */ }
    fenetre.close();
  };
  $('ignorer-compte').addEventListener('click', ignorer);
  fenetre.addEventListener('cancel', ignorer);   // touche Échap
  // après la connexion, la page Compte nous renverra ici
  $('creer-compte').addEventListener('click', () => {
    try { sessionStorage.setItem('novimo-retour', lien('devis.html')); } catch (e) { /* rien */ }
  });
}

afficher();
