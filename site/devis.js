/* =========================================================
   DEVIS.JS — le calcul du devis en direct
     1. construit la liste des animations et des options (depuis reglages.js)
     2. recalcule le total à chaque clic
     3. "Envoyer ma demande" -> ouvre un e-mail déjà rempli
        "Enregistrer en PDF"  -> ouvre l'impression du navigateur
   Les prix se changent dans reglages.js, pas ici.
   ========================================================= */

const TARIFS = R.tarifs || [];
const OPTIONS = R.options || [];

const quantites = {};          // ex. { logo: 1, pub: 0 ... }
const optionsChoisies = {};    // ex. { express: true }
TARIFS.forEach((t) => { quantites[t.id] = 0; });
OPTIONS.forEach((o) => { optionsChoisies[o.id] = false; });

const $ = (id) => document.getElementById(id);

/* ---------- 1. Construction des listes ---------- */

// Un intertitre avant chaque groupe (Réseaux sociaux, YouTube et TV...)
const GROUPES = R.groupes || [];
let groupePrecedent = null;
$('produits').innerHTML = TARIFS.map((t) => {
  let intertitre = '';
  if (t.groupe && t.groupe !== groupePrecedent) {
    const g = GROUPES.find((x) => x.id === t.groupe);
    if (g) intertitre = '<li class="produits-groupe"><strong>' + g.nom + '</strong> ' + g.detail + '</li>';
    groupePrecedent = t.groupe;
  }
  return intertitre +
  '<li class="produit" data-id="' + t.id + '">' +
    '<div class="produit-texte"><h3>' + t.nom + '</h3><p>' + t.description + '</p></div>' +
    '<span class="produit-prix">' + euros(t.prix) +
      (t.prixPro ? '<small>Freelance : dès ' + euros(t.prixPro) + '</small>' : '') + '</span>' +
    '<div class="compteur" role="group" aria-label="Quantité ' + t.nom + '">' +
      '<button type="button" data-pas="-1" aria-label="Retirer un ' + t.nom + '">−</button>' +
      '<output aria-live="polite">0</output>' +
      '<button type="button" data-pas="1" aria-label="Ajouter un ' + t.nom + '">+</button>' +
    '</div>' +
  '</li>';
}).join('');

$('options').innerHTML = OPTIONS.map((o) =>
  '<label class="option">' +
    '<input type="checkbox" data-option="' + o.id + '">' +
    '<span class="interrupteur" aria-hidden="true"></span>' +
    '<span class="option-texte"><strong>' + o.nom + '</strong><span>' + o.detail + '</span></span>' +
    '<span class="option-prix">+' + euros(o.prix) + (o.parAnimation ? ' / animation' : '') + '</span>' +
  '</label>'
).join('');

/* ---------- Pré-remplissage depuis l'adresse ----------
   ex. devis.html?logo=1&commerce=Chez%20Mila (lien envoyé par l'essai en direct) */
const params = new URLSearchParams(location.search);
TARIFS.forEach((t) => {
  const n = parseInt(params.get(t.id), 10);
  if (n > 0) quantites[t.id] = Math.min(n, 20);
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
$('r-date').textContent = maintenant.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/* ---------- 2. Le calcul ---------- */

function calculer() {
  const lignes = [];
  let total = 0;
  let nbAnimations = 0;
  let totalAnimations = 0; // prix Novimo des animations seules (sans options)
  let totalPro = 0;        // prix de départ d'un freelance pour les mêmes animations

  TARIFS.forEach((t) => {
    const q = quantites[t.id];
    if (!q) return;
    lignes.push({ texte: (q > 1 ? q + ' × ' : '') + t.nom, montant: q * t.prix });
    total += q * t.prix;
    totalAnimations += q * t.prix;
    totalPro += q * (t.prixPro || t.prix);
    nbAnimations += q * (t.contenu ? t.contenu.length : 1); // un pack compte pour plusieurs animations
  });

  OPTIONS.forEach((o) => {
    if (!optionsChoisies[o.id]) return;
    // Combien d'animations sont concernées par cette option ? (pasPour = exclues)
    const concernees = TARIFS.reduce((n, t) =>
      (o.pasPour || []).includes(t.id) ? n : n + quantites[t.id] * (t.contenu ? t.contenu.length : 1), 0);
    if (concernees === 0) return;
    const fois = o.parAnimation ? concernees : 1;
    lignes.push({ texte: o.nom + (fois > 1 ? ' (' + fois + ' animations)' : ''), montant: fois * o.prix });
    total += fois * o.prix;
  });

  return { lignes, total, nbAnimations, totalAnimations, totalPro };
}

let totalAffiche = 0;
let numeroDefilement = 0;

function afficher() {
  const { lignes, total, totalAnimations, totalPro } = calculer();

  // La comparaison avec un freelance
  const economie = totalPro - totalAnimations;
  $('r-eco').hidden = economie <= 0;
  $('r-eco').innerHTML = 'Pour ces animations, un freelance demande dès ' + euros(totalPro) +
    '.<br><strong>Vous économisez au moins ' + euros(economie) + '.</strong>';

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
  $('r-client').textContent = $('d-commerce').value.trim() || 'votre commerce';
  $('r-acompte').textContent = euros(acompteDe(total));

  // Le total "défile" jusqu'à sa nouvelle valeur.
  // (si on reclique pendant le défilement, l'ancien défilement s'arrête)
  const depart = totalAffiche;
  const debut = performance.now();
  const duree = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
  const ceDefilement = ++numeroDefilement;
  (function etape(t) {
    if (ceDefilement !== numeroDefilement) return;
    const p = duree ? Math.min(1, Math.max(0, (t - debut) / duree)) : 1;
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
  const pack = TARIFS.find((t) => t.contenu);
  const trio = pack ? pack.contenu.filter((id) => TARIFS.some((t) => t.id === id)) : [];
  const astuce = $('astuce-pack');
  const economiePack = trio.reduce((s, id) => s + TARIFS.find((t) => t.id === id).prix, 0) - (pack ? pack.prix : 0);
  if (pack && trio.length && economiePack > 0 && trio.every((id) => quantites[id] >= 1)) {
    astuce.innerHTML = 'Avec le ' + pack.nom.toLowerCase() + ', vous économisez ' +
      euros(economiePack) + '. <button type="button" id="passer-pack">Passer au pack</button>';
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
  $('r-client').textContent = $('d-commerce').value.trim() || 'votre commerce';
});
$('devis').addEventListener('submit', (e) => e.preventDefault());

/* ---------- 3. Envoyer / télécharger le PDF ---------- */

const emailValide = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
const telValide = (t) => !t || /^[+0-9 ().-]{6,20}$/.test(t);
const debutRemplissage = Date.now();   // anti-spam : un robot remplit tout en une fraction de seconde

/* Chaque champ a sa règle et son message, affiché juste en dessous */
const REGLES = [
  { id: 'd-commerce', erreur: 'err-commerce', ok: (v) => v.length >= 2, message: 'Indiquez le nom de votre entreprise ou de votre marque (2 lettres minimum).' },
  { id: 'd-prenom',   erreur: 'err-prenom',   ok: (v) => !v || /^[\p{L}' -]{1,40}$/u.test(v), message: 'Votre prénom ne doit contenir que des lettres.' },
  { id: 'd-email',    erreur: 'err-email',    ok: emailValide, message: 'Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.' },
  { id: 'd-tel',      erreur: 'err-tel',      ok: telValide, message: 'Numéro invalide : chiffres, espaces et + seulement (ex. 06 12 34 56 78).' },
  { id: 'd-accord',   erreur: 'err-accord',   ok: () => $('d-accord').checked, message: 'Cochez cette case pour que nous puissions traiter votre demande.' }
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
    $('erreur').textContent = 'Ajoutez au moins une animation avec le bouton +.';
    document.querySelector('.produit button[data-pas="1"]').focus();
    return false;
  }
  const fautifs = REGLES.filter((r) => !verifierChamp(r));
  if (fautifs.length) {
    $('erreur').textContent = fautifs.length === 1 ? 'Un champ est à corriger.' : fautifs.length + ' champs sont à corriger.';
    $(fautifs[0].id).focus();
    return false;
  }
  return true;
}

// Toutes les informations du devis, rassemblées (pour le PDF et l'envoi)
function donneesDevis() {
  const { lignes, total, totalPro, totalAnimations } = calculer();
  return {
    numero: numeroDevis,
    date: new Date().toISOString(),
    commerce: $('d-commerce').value.trim(),
    type: $('d-type').value,
    prenom: $('d-prenom').value.trim(),
    email: $('d-email').value.trim(),
    tel: $('d-tel').value.trim(),
    message: $('d-message').value.trim(),
    lignes: lignes,
    // le détail des prestations choisies (sert aux statistiques du tableau de bord)
    prestations: TARIFS.filter((t) => quantites[t.id] > 0).map((t) => ({ id: t.id, nom: t.nom, quantite: quantites[t.id] })),
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

$('envoyer').addEventListener('click', async () => {
  if (!verifier()) return;
  const d = donneesDevis();
  const bouton = $('envoyer');

  /* --- Mode démo (Supabase pas encore branché) : PDF téléchargé + e-mail préparé --- */
  if (!NovimoAPI.actif) {
    creerPdfDevis(d).save('Devis-' + d.numero + '.pdf');
    const corps = 'Bonjour,\n\nVoici ma demande de devis n° ' + d.numero + ' (le PDF est joint).\n\n' +
      d.lignes.map((l) => '- ' + l.texte + ' : ' + euros(l.montant)).join('\n') +
      '\n\nTotal : ' + euros(d.total) + ' — acompte de ' + d.acomptePourcent + ' % à la signature : ' + euros(d.acompte) +
      '\n\nCommerce : ' + d.commerce + ' (' + d.type + ')\nE-mail : ' + d.email + '\nTéléphone : ' + (d.tel || '-') +
      '\n\nMon idée :\n' + (d.message || '-') + '\n\nMerci !';
    window.location.href = 'mailto:' + (R.emailDevis || R.email) +
      '?subject=' + encodeURIComponent('Demande de devis ' + d.numero + ' — ' + d.commerce) +
      '&body=' + encodeURIComponent(corps);
    message('Votre PDF vient d\'être téléchargé : <strong>joignez-le à l\'e-mail</strong> qui s\'ouvre, puis envoyez-le.', true);
    return;
  }

  /* --- Mode en ligne : la fonction serveur enregistre le devis et envoie les e-mails --- */
  bouton.disabled = true;
  bouton.textContent = 'Envoi en cours…';
  try {
    let resultat = null;
    for (let essai = 0; essai < 2; essai++) {
      try {
        const pdf = creerPdfDevis(d).output('datauristring').split(',')[1];
        resultat = await NovimoAPI.envoyerDevis(d, pdf);
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
      creerPdfDevis(d).save('Devis-' + d.numero + '.pdf');
      message('Devis bien reçu ! L\'e-mail de confirmation n\'a pas pu partir : votre PDF vient d\'être téléchargé.', true);
    } else {
      message('Devis envoyé ! Vous allez recevoir le PDF à l\'adresse <strong>' + esc(d.email) + '</strong>. Je vous réponds très vite.', true);
    }
    bouton.textContent = 'Devis envoyé ✓';
  } catch (err) {
    bouton.disabled = false;
    bouton.textContent = 'Envoyer mon devis';
    message('L\'envoi n\'a pas marché (' + err.message + '). Réessayez, ou téléchargez le PDF et envoyez-le par e-mail.');
  }
});

$('imprimer').addEventListener('click', () => {
  if (verifier()) creerPdfDevis(donneesDevis()).save('Devis-' + numeroDevis + '.pdf');
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
  setTimeout(() => fenetre.showModal(), 700);
  const ignorer = () => {
    try { sessionStorage.setItem('novimo-compte-ignore', '1'); } catch (e) { /* rien */ }
    fenetre.close();
  };
  $('ignorer-compte').addEventListener('click', ignorer);
  fenetre.addEventListener('cancel', ignorer);   // touche Échap
  // après la connexion, la page Compte nous renverra ici
  $('creer-compte').addEventListener('click', () => {
    try { sessionStorage.setItem('novimo-retour', 'devis.html'); } catch (e) { /* rien */ }
  });
}

afficher();
