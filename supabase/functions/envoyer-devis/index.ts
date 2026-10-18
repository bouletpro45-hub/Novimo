// =========================================================
// FONCTION SERVEUR "envoyer-devis" (Supabase Edge Function)
// ---------------------------------------------------------
// Appelée par la page devis quand le client clique sur "Envoyer mon devis".
//   0. anti-spam : piège à robots, envoi trop rapide, trop d'envois par IP / e-mail
//   1. vérifie les informations reçues et RECALCULE LE PRIX ici, sur le serveur
//      (le prix envoyé par le navigateur n'est jamais cru sur parole)
//   2. enregistre le devis dans la base
//   3. envoie le PDF par e-mail : à toi (admin) ET au client (via Brevo)
//
// Client du site anglais (langue = 'en') :
//   - lui reçoit l'e-mail et le PDF en anglais ;
//   - toi, tu reçois l'e-mail en français, avec la mention « Client étranger »,
//     et le PDF en français (pdfAdmin, fabriqué par la page devis) ;
//   - les prix sont en DOLLARS (devise = 'USD'), enregistrés dans la colonne "devise".
//
// Secrets à créer dans Supabase > Edge Functions > Secrets :
//   BREVO_API_KEY     ta clé API Brevo
//   EMAIL_EXPEDITEUR  l'adresse validée dans Brevo (ex. bouletpro45@gmail.com)
//   EMAIL_ADMIN       l'adresse qui reçoit les devis (bouletpro45@gmail.com)
// (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.)
// =========================================================

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const repondre = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });

// ---------------------------------------------------------
// LES PRIX OFFICIELS (côté serveur)
// ⚠️ À garder IDENTIQUES à site/reglages.js (tarifs, options, acompte).
//    Si tu changes un prix dans reglages.js, change-le aussi ici puis redéploie.
//    en = le nom anglais, usd = le prix en DOLLARS du site anglais (bloc en: { prix } de reglages.js)
// ---------------------------------------------------------
const TARIFS: Record<string, { nom: string; en: string; prix: number; usd: number; contenu?: number }> = {
  logo:       { nom: 'Logo animé',       en: 'Animated logo',  prix: 297,  usd: 337 },
  pub:        { nom: 'Petite pub',       en: 'Short ad',       prix: 147,  usd: 167 },
  pack:       { nom: 'Pack lancement',   en: 'Launch pack',    prix: 389,  usd: 447, contenu: 2 },
  systemeLogo: { nom: 'Système de logo', en: 'Logo system',    prix: 397,  usd: 457 },
  spot30:     { nom: 'Spot 30 secondes', en: '30-second spot', prix: 743,  usd: 857 },
  spot60:     { nom: 'Spot 60 secondes', en: '60-second spot', prix: 1487, usd: 1697 },
  modele:     { nom: 'Modèle court',     en: 'Short template', prix: 89,   usd: 97 },
  modeleLong: { nom: 'Modèle long',      en: 'Long template',  prix: 137,  usd: 157 },
  modeleSpot: { nom: 'Modèle spot',      en: 'Spot template',  prix: 447,  usd: 517 }
};
const OPTIONS: Record<string, { nom: string; en: string; prix: number; usd: number; parAnimation: boolean; pasPour: string[] }> = {
  express:  { nom: 'Livraison express',   en: 'Express delivery',      prix: 59, usd: 67, parAnimation: false, pasPour: ['spot30', 'spot60', 'systemeLogo'] },
  retouche: { nom: 'Retouches en plus',   en: 'Extra revisions',       prix: 47, usd: 57, parAnimation: false, pasPour: [] },
  paysage:  { nom: 'Format paysage 16:9', en: '16:9 landscape format', prix: 37, usd: 43, parAnimation: true,  pasPour: ['spot30', 'spot60', 'systemeLogo'] }
};
const POURCENT_ACOMPTE = 30;

// Refait le calcul de devis.js à partir des quantités et des options choisies
// (lignes en français, et lignesEn en anglais pour un client étranger)
// dollars = true : les prix en dollars du site anglais
function calculerDevis(quantites: Record<string, number>, options: string[], dollars: boolean) {
  const lignes: { texte: string; montant: number }[] = [];
  const lignesEn: { texte: string; montant: number }[] = [];
  let total = 0;
  for (const [id, t] of Object.entries(TARIFS)) {
    const q = quantites[id] || 0;
    if (!q) continue;
    const prix = dollars ? t.usd : t.prix;
    lignes.push({ texte: (q > 1 ? q + ' × ' : '') + t.nom, montant: q * prix });
    lignesEn.push({ texte: (q > 1 ? q + ' × ' : '') + t.en, montant: q * prix });
    total += q * prix;
  }
  for (const [id, o] of Object.entries(OPTIONS)) {
    if (!options.includes(id)) continue;
    const concernees = Object.entries(TARIFS).reduce((n, [tid, t]) =>
      o.pasPour.includes(tid) ? n : n + (quantites[tid] || 0) * (t.contenu || 1), 0);
    if (!concernees) continue;
    const fois = o.parAnimation ? concernees : 1;
    const enPlus = fois > 1 ? ' (' + fois + ' animations)' : '';
    const prix = dollars ? o.usd : o.prix;
    lignes.push({ texte: o.nom + enPlus, montant: fois * prix });
    lignesEn.push({ texte: o.en + enPlus, montant: fois * prix });
    total += fois * prix;
  }
  return { lignes, lignesEn, total, acompte: Math.round(total * POURCENT_ACOMPTE) / 100 };
}

// Empreinte de l'IP (on ne garde jamais l'IP elle-même)
async function empreinte(texte: string) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('novimo:' + texte));
  return Array.from(new Uint8Array(octets)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Rend un texte sans danger dans un e-mail HTML
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
// 297 -> "297 €" ; en dollars : "$337" (anglais) ou "337 $" (français)
const euros = (n: number, anglais = false, dollars = false) => {
  const format = { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 };
  const symbole = dollars ? '$' : '€';
  return anglais ? symbole + Number(n).toLocaleString('en-US', format) : Number(n).toLocaleString('fr-FR', format) + ' ' + symbole;
};
const texteCourt = (s: unknown, max: number) => String(s ?? '').trim().slice(0, max);

// Lit un secret en tolérant une espace oubliée dans son nom ou sa valeur
const lireSecret = (nom: string) => {
  const trouve = Object.entries(Deno.env.toObject()).find(([cle]) => cle.trim() === nom);
  return (trouve?.[1] ?? '').trim();
};

async function envoyerEmail(destinataire: string, sujet: string, html: string, pdf: string, nomFichier: string) {
  const cle = lireSecret('BREVO_API_KEY');
  if (!cle) throw new Error('Secret BREVO_API_KEY absent ou vide');
  const reponse = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': cle, 'Content-Type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: 'Novimo', email: lireSecret('EMAIL_EXPEDITEUR') },
      to: [{ email: destinataire }],
      subject: sujet,
      htmlContent: html,
      attachment: [{ content: pdf, name: nomFichier }]
    })
  });
  if (!reponse.ok) throw new Error('Brevo ' + reponse.status + ' : ' + (await reponse.text()));
}

// Le tableau des prix d'un e-mail
// Taux pour montrer l'équivalent en euros d'un devis en dollars (même valeur que tauxDollar dans reglages.js)
const TAUX_DOLLAR = 0.86;

// avecEuros = true (ton e-mail, devis en dollars) : l'équivalent en euros à côté de chaque montant
function tableauPrix(lignes: { texte: string; montant: number }[], total: number, acompte: number, anglais: boolean, dollars: boolean, avecEuros = false) {
  const m = (n: number) => euros(n, anglais, dollars) +
    (avecEuros && dollars ? ' <span style="color:#6e7068">(≈ ' + euros(Math.round(n * TAUX_DOLLAR * 100) / 100) + ')</span>' : '');
  const lignesHtml = lignes.map((l) => '<tr><td>' + esc(l.texte) + '</td><td align="right">' + m(l.montant) + '</td></tr>').join('');
  return '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + lignesHtml +
    '<tr><td><b>Total</b></td><td align="right"><b>' + m(total) + '</b></td></tr>' +
    '<tr><td>' + (anglais ? 'Deposit on signature (' + POURCENT_ACOMPTE + '%)' : 'Acompte à la signature (' + POURCENT_ACOMPTE + ' %)') +
    '</td><td align="right">' + m(acompte) + '</td></tr></table>';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: ENTETES });
  if (req.method !== 'POST') return repondre({ ok: false, erreur: 'Méthode non autorisée' }, 405);

  let d: Record<string, any>;
  try { d = await req.json(); } catch { return repondre({ ok: false, erreur: 'Données illisibles' }, 400); }

  // Client du site anglais ? Ses messages d'erreur et ses e-mails sont en anglais.
  const anglais = d.langue === 'en';
  // Site anglais = prix en dollars
  const dollars = d.devise === 'USD';
  const devise = dollars ? 'USD' : 'EUR';
  const msg = (fr: string, en: string) => (anglais ? en : fr);

  /* ---------- 0. Anti-spam ---------- */
  // Le champ "site_web" est invisible pour les humains : s'il est rempli, c'est un robot.
  // On répond "ok" pour ne pas lui apprendre qu'il a été repéré, mais on ne fait rien.
  if (texteCourt(d.site_web, 200)) return repondre({ ok: true, numero: d.numero, emailEnvoye: true });
  // Un humain met au moins quelques secondes à remplir le formulaire
  if ((Number(d.tempsRemplissage) || 0) < 4000) return repondre({ ok: false, erreur: msg('Envoi trop rapide, vérifiez vos informations et réessayez', 'Sent too fast, check your details and try again') });

  /* ---------- 1. Vérifications ---------- */
  const email = texteCourt(d.email, 120).toLowerCase();
  const numero = texteCourt(d.numero, 40);
  const commerce = texteCourt(d.commerce, 60);
  const telephone = texteCourt(d.tel, 30);
  const pdf = typeof d.pdf === 'string' ? d.pdf : '';
  // Ta copie en français (seulement pour un client du site anglais)
  const pdfAdmin = anglais && typeof d.pdfAdmin === 'string' && d.pdfAdmin.length <= 3_000_000 ? d.pdfAdmin : pdf;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return repondre({ ok: false, erreur: msg('Adresse e-mail invalide', 'Invalid email address') });
  if (!/^NOV-\d{8}-[A-Z0-9]{4}$/.test(numero)) return repondre({ ok: false, erreur: 'numero de devis invalide' });
  if (commerce.length < 2) return repondre({ ok: false, erreur: msg('Nom de l’entreprise manquant', 'Business name missing') });
  if (telephone && !/^[+0-9 ().-]{6,20}$/.test(telephone)) return repondre({ ok: false, erreur: msg('Numéro de téléphone invalide', 'Invalid phone number') });
  if (d.accord !== true) return repondre({ ok: false, erreur: msg('Accord sur l’utilisation des données manquant', 'Consent to the use of your data is missing') });
  if (!pdf || pdf.length > 3_000_000) return repondre({ ok: false, erreur: msg('PDF manquant ou trop lourd', 'PDF missing or too large') });

  // Les quantités et options choisies : seules des valeurs connues sont acceptées
  const quantites: Record<string, number> = {};
  const prestations: { id: string; nom: string; quantite: number }[] = [];
  for (const p of (Array.isArray(d.prestations) ? d.prestations.slice(0, 20) : [])) {
    const id = texteCourt(p?.id, 30);
    const q = Math.floor(Number(p?.quantite) || 0);
    if (!TARIFS[id] || q < 1 || q > 20) continue;
    quantites[id] = q;
    prestations.push({ id, nom: TARIFS[id].nom, quantite: q });
  }
  const optionsChoisies = (Array.isArray(d.options) ? d.options : []).map((o: unknown) => texteCourt(o, 20)).filter((o: string) => OPTIONS[o]);

  // LE PRIX EST CALCULÉ ICI. Si le navigateur annonce autre chose, la demande est refusée.
  const { lignes, lignesEn, total, acompte } = calculerDevis(quantites, optionsChoisies, dollars);
  if (!lignes.length) return repondre({ ok: false, erreur: msg('Aucune animation choisie', 'No animation chosen') });
  if (Math.abs(Number(d.total) - total) > 0.01) return repondre({ ok: false, erreur: msg('Les prix ont changé : rechargez la page pour avoir le bon devis', 'Prices have changed: reload the page to get the right quote') });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Anti-abus : 10 devis maximum par heure depuis une même connexion
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const ipHash = ip ? await empreinte(ip) : null;
  const uneHeureAvant = new Date(Date.now() - 3600_000).toISOString();
  const tropDeDevis = msg('Trop de devis envoyés, réessayez dans une heure', 'Too many quotes sent, try again in an hour');
  if (ipHash) {
    const { count } = await admin.from('devis').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('cree_le', uneHeureAvant);
    if ((count ?? 0) >= 10) return repondre({ ok: false, erreur: tropDeDevis }, 429);
  }

  // Si le client est connecté, on rattache le devis à son compte
  let userId: string | null = null;
  const jeton = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  if (jeton) {
    const { data } = await admin.auth.getUser(jeton);
    userId = data?.user?.id ?? null;
  }

  // Anti-abus : 5 devis maximum par heure pour une même adresse
  const { count: recents } = await admin.from('devis').select('id', { count: 'exact', head: true }).eq('email', email).gte('cree_le', uneHeureAvant);
  if ((recents ?? 0) >= 5) return repondre({ ok: false, erreur: tropDeDevis }, 429);

  // Premier devis de cette adresse ? (pour les statistiques)
  const { count: anciens } = await admin.from('devis').select('id', { count: 'exact', head: true }).eq('email', email);

  /* ---------- 2. Enregistrement ---------- */
  const ligne: Record<string, unknown> = {
    numero, user_id: userId, email, commerce,
    type_commerce: texteCourt(d.type, 60), prenom: texteCourt(d.prenom, 60),
    telephone, message: texteCourt(d.message, 800),
    lignes, prestations, options: optionsChoisies,
    total, acompte, premier_devis: (anciens ?? 0) === 0, ip_hash: ipHash, devise
  };
  let { error } = await admin.from('devis').insert(ligne);
  // Colonne "devise" pas encore créée (voir supabase/ajout-2026-10-18.sql) : on enregistre quand même
  if (error && /devise/.test(error.message || '')) {
    delete ligne.devise;
    if (dollars) ligne.type_commerce = '[USD] ' + texteCourt(d.type, 54);
    ({ error } = await admin.from('devis').insert(ligne));
  }
  if (error) {
    if (error.code === '23505') return repondre({ ok: false, erreur: 'numero déjà utilisé' });
    return repondre({ ok: false, erreur: msg('Enregistrement impossible', 'Could not save the quote') }, 500);
  }

  /* ---------- 3. Les e-mails (avec le PDF en pièce jointe) ---------- */
  const pourcent = POURCENT_ACOMPTE;

  // Ménage RGPD (durées annoncées dans la politique de confidentialité) :
  // empreintes d'IP effacées après 30 jours, visites supprimées après 25 mois
  const il30jours = new Date(Date.now() - 30 * 86400_000).toISOString();
  const il25mois = new Date(Date.now() - 760 * 86400_000).toISOString();
  await Promise.all([
    admin.from('devis').update({ ip_hash: null }).lt('cree_le', il30jours).not('ip_hash', 'is', null),
    admin.from('visites').delete().lt('cree_le', il25mois)
  ]).catch(() => { /* le ménage ne doit pas bloquer l'envoi */ });

  const etranger = anglais ? '[Client étranger] ' : '';
  let emailEnvoye = true;
  try {
    // À toi : toutes les informations, toujours en français
    await envoyerEmail(lireSecret('EMAIL_ADMIN'), etranger + 'Nouveau devis ' + numero + ' — ' + commerce,
      '<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Nouveau devis ' + esc(numero) + '</h2>' +
      (anglais ? '<p style="display:inline-block;padding:6px 12px;border-radius:999px;background:#d4ff3f;color:#0b0c09;font-weight:bold">🌍 Client étranger : il a fait son devis sur le site anglais (e-mail et PDF envoyés en anglais). Réponds-lui en anglais.' + (dollars ? ' Montants en dollars américains (USD).' : '') + '</p>' : '') +
      '<p><b>' + esc(commerce) + '</b> (' + esc(texteCourt(d.type, 60)) + ')<br>' + esc(texteCourt(d.prenom, 60)) + '<br>' + esc(email) + '<br>' + esc(telephone) + '</p>' +
      tableauPrix(lignes, total, acompte, false, dollars, true) + (dollars ? '<p style="color:#6e7068;font-size:12px">Équivalent en euros au taux de ' + TAUX_DOLLAR + ' € pour 1 $.</p>' : '') + '<p><b>Son idée :</b><br>' + esc(texteCourt(d.message, 800)).replace(/\n/g, '<br>') + '</p>' +
      '<p>Le PDF complet (en français) est en pièce jointe.</p></div>', pdfAdmin, 'Devis-' + numero + '.pdf');

    // Au client : sa copie, dans sa langue
    if (anglais) {
      await envoyerEmail(email, 'Your Novimo quote ' + numero,
        '<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Thank you for your request!</h2>' +
        '<p>Hello' + (d.prenom ? ' ' + esc(texteCourt(d.prenom, 60)) : '') + ',<br>here is your quote <b>' + esc(numero) + '</b> for <b>' + esc(commerce) + '</b>.</p>' +
        tableauPrix(lignesEn, total, acompte, true, dollars) + '<p><b>' + pourcent + '% of the total price is payable when the quote is signed.</b> Prices are in ' + (dollars ? 'US dollars' : 'euros') + '.</p>' +
        '<p>The PDF is attached. I will get back to you very soon to confirm the price and timing.</p><p>— Novimo</p></div>', pdf, 'Quote-' + numero + '.pdf');
    } else {
      await envoyerEmail(email, 'Votre devis Novimo ' + numero,
        '<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Merci pour votre demande !</h2>' +
        '<p>Bonjour' + (d.prenom ? ' ' + esc(texteCourt(d.prenom, 60)) : '') + ',<br>voici votre devis <b>' + esc(numero) + '</b> pour <b>' + esc(commerce) + '</b>.</p>' +
        tableauPrix(lignes, total, acompte, false, dollars) + '<p><b>' + pourcent + ' % du prix total devront être versés à la signature du devis.</b></p>' +
        '<p>Le PDF est en pièce jointe. Je reviens vers vous très vite pour confirmer le prix et le délai.</p><p>— Novimo</p></div>', pdf, 'Devis-' + numero + '.pdf');
    }
  } catch (err) {
    console.error(err);
    emailEnvoye = false;   // le devis est quand même enregistré
  }

  return repondre({ ok: true, numero, emailEnvoye });
});
