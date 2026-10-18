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
// ---------------------------------------------------------
const TARIFS: Record<string, { nom: string; prix: number; contenu?: number }> = {
  logo:       { nom: 'Logo animé',       prix: 297 },
  pub:        { nom: 'Petite pub',       prix: 147 },
  pack:       { nom: 'Pack lancement',   prix: 389, contenu: 2 },
  systemeLogo: { nom: 'Système de logo', prix: 397 },
  spot30:     { nom: 'Spot 30 secondes', prix: 743 },
  spot60:     { nom: 'Spot 60 secondes', prix: 1487 },
  modele:     { nom: 'Modèle court',     prix: 89 },
  modeleLong: { nom: 'Modèle long',      prix: 137 },
  modeleSpot: { nom: 'Modèle spot',      prix: 447 }
};
const OPTIONS: Record<string, { nom: string; prix: number; parAnimation: boolean; pasPour: string[] }> = {
  express:  { nom: 'Livraison express',   prix: 59, parAnimation: false, pasPour: ['spot30', 'spot60', 'systemeLogo'] },
  retouche: { nom: 'Retouches en plus',   prix: 47, parAnimation: false, pasPour: [] },
  paysage:  { nom: 'Format paysage 16:9', prix: 37, parAnimation: true,  pasPour: ['spot30', 'spot60', 'systemeLogo'] }
};
const POURCENT_ACOMPTE = 30;

// Refait le calcul de devis.js à partir des quantités et des options choisies
function calculerDevis(quantites: Record<string, number>, options: string[]) {
  const lignes: { texte: string; montant: number }[] = [];
  let total = 0;
  for (const [id, t] of Object.entries(TARIFS)) {
    const q = quantites[id] || 0;
    if (!q) continue;
    lignes.push({ texte: (q > 1 ? q + ' × ' : '') + t.nom, montant: q * t.prix });
    total += q * t.prix;
  }
  for (const [id, o] of Object.entries(OPTIONS)) {
    if (!options.includes(id)) continue;
    const concernees = Object.entries(TARIFS).reduce((n, [tid, t]) =>
      o.pasPour.includes(tid) ? n : n + (quantites[tid] || 0) * (t.contenu || 1), 0);
    if (!concernees) continue;
    const fois = o.parAnimation ? concernees : 1;
    lignes.push({ texte: o.nom + (fois > 1 ? ' (' + fois + ' animations)' : ''), montant: fois * o.prix });
    total += fois * o.prix;
  }
  return { lignes, total, acompte: Math.round(total * POURCENT_ACOMPTE) / 100 };
}

// Empreinte de l'IP (on ne garde jamais l'IP elle-même)
async function empreinte(texte: string) {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('novimo:' + texte));
  return Array.from(new Uint8Array(octets)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Rend un texte sans danger dans un e-mail HTML
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);
const euros = (n: number) => Number(n).toLocaleString('fr-FR', { minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2, maximumFractionDigits: 2 }) + ' €';
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: ENTETES });
  if (req.method !== 'POST') return repondre({ ok: false, erreur: 'Méthode non autorisée' }, 405);

  let d: Record<string, any>;
  try { d = await req.json(); } catch { return repondre({ ok: false, erreur: 'Données illisibles' }, 400); }

  /* ---------- 0. Anti-spam ---------- */
  // Le champ "site_web" est invisible pour les humains : s'il est rempli, c'est un robot.
  // On répond "ok" pour ne pas lui apprendre qu'il a été repéré, mais on ne fait rien.
  if (texteCourt(d.site_web, 200)) return repondre({ ok: true, numero: d.numero, emailEnvoye: true });
  // Un humain met au moins quelques secondes à remplir le formulaire
  if ((Number(d.tempsRemplissage) || 0) < 4000) return repondre({ ok: false, erreur: 'Envoi trop rapide, vérifiez vos informations et réessayez' });

  /* ---------- 1. Vérifications ---------- */
  const email = texteCourt(d.email, 120).toLowerCase();
  const numero = texteCourt(d.numero, 40);
  const commerce = texteCourt(d.commerce, 60);
  const telephone = texteCourt(d.tel, 30);
  const pdf = typeof d.pdf === 'string' ? d.pdf : '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return repondre({ ok: false, erreur: 'Adresse e-mail invalide' });
  if (!/^NOV-\d{8}-[A-Z0-9]{4}$/.test(numero)) return repondre({ ok: false, erreur: 'numero de devis invalide' });
  if (commerce.length < 2) return repondre({ ok: false, erreur: 'Nom de l’entreprise manquant' });
  if (telephone && !/^[+0-9 ().-]{6,20}$/.test(telephone)) return repondre({ ok: false, erreur: 'Numéro de téléphone invalide' });
  if (d.accord !== true) return repondre({ ok: false, erreur: 'Accord sur l’utilisation des données manquant' });
  if (!pdf || pdf.length > 3_000_000) return repondre({ ok: false, erreur: 'PDF manquant ou trop lourd' });

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
  const { lignes, total, acompte } = calculerDevis(quantites, optionsChoisies);
  if (!lignes.length) return repondre({ ok: false, erreur: 'Aucune animation choisie' });
  if (Math.abs(Number(d.total) - total) > 0.01) return repondre({ ok: false, erreur: 'Les prix ont changé : rechargez la page pour avoir le bon devis' });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Anti-abus : 10 devis maximum par heure depuis une même connexion
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const ipHash = ip ? await empreinte(ip) : null;
  const uneHeureAvant = new Date(Date.now() - 3600_000).toISOString();
  if (ipHash) {
    const { count } = await admin.from('devis').select('id', { count: 'exact', head: true }).eq('ip_hash', ipHash).gte('cree_le', uneHeureAvant);
    if ((count ?? 0) >= 10) return repondre({ ok: false, erreur: 'Trop de devis envoyés, réessayez dans une heure' }, 429);
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
  if ((recents ?? 0) >= 5) return repondre({ ok: false, erreur: 'Trop de devis envoyés, réessayez dans une heure' }, 429);

  // Premier devis de cette adresse ? (pour les statistiques)
  const { count: anciens } = await admin.from('devis').select('id', { count: 'exact', head: true }).eq('email', email);

  /* ---------- 2. Enregistrement ---------- */
  const { error } = await admin.from('devis').insert({
    numero, user_id: userId, email, commerce,
    type_commerce: texteCourt(d.type, 60), prenom: texteCourt(d.prenom, 60),
    telephone, message: texteCourt(d.message, 800),
    lignes, prestations, options: optionsChoisies,
    total, acompte, premier_devis: (anciens ?? 0) === 0, ip_hash: ipHash
  });
  if (error) {
    if (error.code === '23505') return repondre({ ok: false, erreur: 'numero déjà utilisé' });
    return repondre({ ok: false, erreur: 'Enregistrement impossible' }, 500);
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
  const tableau = lignes.map((l) => '<tr><td>' + esc(l.texte) + '</td><td align="right">' + euros(l.montant) + '</td></tr>').join('');
  const recap = '<table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">' + tableau +
    '<tr><td><b>Total</b></td><td align="right"><b>' + euros(total) + '</b></td></tr>' +
    '<tr><td>Acompte à la signature (' + pourcent + ' %)</td><td align="right">' + euros(acompte) + '</td></tr></table>';
  const fichier = 'Devis-' + numero + '.pdf';
  let emailEnvoye = true;
  try {
    // À toi : toutes les informations
    await envoyerEmail(lireSecret('EMAIL_ADMIN'), 'Nouveau devis ' + numero + ' — ' + commerce,
      '<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Nouveau devis ' + esc(numero) + '</h2>' +
      '<p><b>' + esc(commerce) + '</b> (' + esc(texteCourt(d.type, 60)) + ')<br>' + esc(texteCourt(d.prenom, 60)) + '<br>' + esc(email) + '<br>' + esc(telephone) + '</p>' +
      recap + '<p><b>Son idée :</b><br>' + esc(texteCourt(d.message, 800)).replace(/\n/g, '<br>') + '</p>' +
      '<p>Le PDF complet est en pièce jointe.</p></div>', pdf, fichier);
    // Au client : sa copie
    await envoyerEmail(email, 'Votre devis Novimo ' + numero,
      '<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Merci pour votre demande !</h2>' +
      '<p>Bonjour' + (d.prenom ? ' ' + esc(texteCourt(d.prenom, 60)) : '') + ',<br>voici votre devis <b>' + esc(numero) + '</b> pour <b>' + esc(commerce) + '</b>.</p>' +
      recap + '<p><b>' + pourcent + ' % du prix total devront être versés à la signature du devis.</b></p>' +
      '<p>Le PDF est en pièce jointe. Je reviens vers vous très vite pour confirmer le prix et le délai.</p><p>— Novimo</p></div>', pdf, fichier);
  } catch (err) {
    console.error(err);
    emailEnvoye = false;   // le devis est quand même enregistré
  }

  return repondre({ ok: true, numero, emailEnvoye });
});
