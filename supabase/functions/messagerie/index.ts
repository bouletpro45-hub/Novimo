// =========================================================
// FONCTION SERVEUR "messagerie" (Supabase Edge Function)
// ---------------------------------------------------------
// Toute la messagerie passe par ici (le site n'a AUCUN accès direct aux tables) :
//   - un client connecté crée une demande (catégorie + sujet + message),
//     puis discute quand l'admin l'a acceptée
//   - l'admin voit les demandes (par catégorie), les accepte ou les refuse, et répond
//
// CHIFFREMENT : chaque sujet et chaque message est chiffré en AES-256-GCM
// avant d'être enregistré. La clé ne quitte jamais le serveur :
//   - secret MESSAGERIE_CLE s'il existe (Edge Functions > Secrets),
//   - sinon une clé dérivée (HKDF) de la clé secrète du projet.
//   ⚠️ Si tu changes l'une ou l'autre, les anciens messages deviennent illisibles.
//
// Secrets utilisés : EMAIL_ADMIN, BREVO_API_KEY, EMAIL_EXPEDITEUR (déjà créés pour les devis)
// =========================================================

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ENTETES = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};
const repondre = (corps: unknown, statut = 200) => new Response(JSON.stringify(corps), { status: statut, headers: ENTETES });
const erreur = (texte: string, statut = 400) => repondre({ ok: false, erreur: texte }, statut);

// Les catégories de demande (les mêmes que dans site/messagerie.js)
const CATEGORIES: Record<string, string> = {
  projet: 'Nouveau projet ou devis',
  modele: 'Personnaliser un modèle',
  suivi: 'Suivi de ma commande',
  retouches: 'Retouches sur ma vidéo',
  paiement: 'Paiement ou facture',
  partenariat: 'Partenariat ou collaboration',
  autre: 'Autre question'
};
const STATUTS_ADMIN = ['acceptee', 'refusee', 'fermee'];

const lireSecret = (nom: string) => {
  const trouve = Object.entries(Deno.env.toObject()).find(([cle]) => cle.trim() === nom);
  return (trouve?.[1] ?? '').trim();
};
const texteCourt = (s: unknown, max: number) => String(s ?? '').replace(/\u0000/g, '').trim().slice(0, max);
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c]);

/* ---------- Chiffrement AES-256-GCM ---------- */
let clePromesse: Promise<CryptoKey> | null = null;
function cle() {
  if (!clePromesse) clePromesse = (async () => {
    const dediee = lireSecret('MESSAGERIE_CLE');
    const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(dediee || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!), 'HKDF', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('novimo-messagerie'), info: new TextEncoder().encode('v1') },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  })();
  return clePromesse;
}
const enBase64 = (o: Uint8Array) => btoa(String.fromCharCode(...o));
const deBase64 = (t: string) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));
async function chiffrer(texte: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const chiffre = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cle(), new TextEncoder().encode(texte)));
  return 'v1:' + enBase64(iv) + ':' + enBase64(chiffre);
}
async function dechiffrer(paquet: string) {
  try {
    const [, iv, donnees] = paquet.split(':');
    const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: deBase64(iv) }, await cle(), deBase64(donnees));
    return new TextDecoder().decode(clair);
  } catch { return '(message illisible)'; }
}

/* ---------- Notification par e-mail (sans le contenu, pour la confidentialité) ---------- */
async function prevenir(destinataire: string, sujet: string, html: string) {
  const cleBrevo = lireSecret('BREVO_API_KEY');
  if (!cleBrevo || !destinataire) return;
  try {
    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': cleBrevo, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ sender: { name: 'Novimo', email: lireSecret('EMAIL_EXPEDITEUR') }, to: [{ email: destinataire }], subject: sujet, htmlContent: html })
    });
  } catch (e) { console.error(e); }   // un e-mail raté ne bloque pas la messagerie
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: ENTETES });
  if (req.method !== 'POST') return erreur('Méthode non autorisée', 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  /* ---------- Qui parle ? (compte obligatoire) ---------- */
  const jeton = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: auth } = jeton ? await admin.auth.getUser(jeton) : { data: null };
  const u = auth?.user;
  if (!u) return erreur('Connectez-vous pour utiliser la messagerie', 401);
  const emailAdmin = (lireSecret('EMAIL_ADMIN') || 'bouletpro45@gmail.com').toLowerCase();
  const estAdmin = (u.email ?? '').toLowerCase() === emailAdmin;
  const nom = texteCourt(u.user_metadata?.full_name || u.user_metadata?.name || '', 80);

  let d: Record<string, any>;
  try { d = await req.json(); } catch { return erreur('Données illisibles'); }
  const action = texteCourt(d.action, 20);

  // Une conversation, si la personne a le droit de la voir
  async function conversation(id: unknown) {
    const { data } = await admin.from('conversations').select('*').eq('id', texteCourt(id, 40)).maybeSingle();
    if (!data || (!estAdmin && data.user_id !== u!.id)) return null;
    return data;
  }
  async function resume(c: Record<string, any>) {
    return {
      id: c.id, categorie: c.categorie, categorieNom: CATEGORIES[c.categorie], sujet: await dechiffrer(c.sujet_chiffre),
      statut: c.statut, cree_le: c.cree_le, maj_le: c.maj_le,
      nonLu: estAdmin ? c.non_lu_admin : c.non_lu_client,
      ...(estAdmin ? { email: c.email, nom: c.nom } : {})
    };
  }

  /* ---------- La liste des conversations ---------- */
  if (action === 'liste') {
    let q = admin.from('conversations').select('*').order('maj_le', { ascending: false }).limit(300);
    if (!estAdmin) q = q.eq('user_id', u.id);
    const { data, error } = await q;
    if (error) return erreur('Lecture impossible', 500);
    return repondre({ ok: true, admin: estAdmin, categories: CATEGORIES, conversations: await Promise.all((data ?? []).map(resume)) });
  }

  /* ---------- Les messages d'une conversation ---------- */
  if (action === 'fil') {
    const c = await conversation(d.conversation);
    if (!c) return erreur('Conversation introuvable', 404);
    const { data } = await admin.from('messages').select('id, auteur, contenu_chiffre, cree_le').eq('conversation_id', c.id).order('cree_le').limit(500);
    await admin.from('conversations').update(estAdmin ? { non_lu_admin: false } : { non_lu_client: false }).eq('id', c.id);
    const messages = await Promise.all((data ?? []).map(async (m) => ({ id: m.id, auteur: m.auteur, texte: await dechiffrer(m.contenu_chiffre), cree_le: m.cree_le })));
    return repondre({ ok: true, conversation: await resume(c), messages });
  }

  /* ---------- Une nouvelle demande (client) ---------- */
  if (action === 'nouvelle') {
    if (estAdmin) return erreur('L’administrateur répond aux demandes, il n’en crée pas');
    const categorie = texteCourt(d.categorie, 20);
    const sujet = texteCourt(d.sujet, 120);
    const message = texteCourt(d.message, 2000);
    if (!CATEGORIES[categorie]) return erreur('Choisissez une catégorie');
    if (sujet.length < 3) return erreur('Indiquez un sujet (3 caractères minimum)');
    if (message.length < 10) return erreur('Votre message est trop court (10 caractères minimum)');
    // Anti-spam : 3 demandes en attente maximum, 5 nouvelles demandes par jour
    const hier = new Date(Date.now() - 86400_000).toISOString();
    const [{ count: enAttente }, { count: duJour }] = await Promise.all([
      admin.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', u.id).eq('statut', 'demande'),
      admin.from('conversations').select('id', { count: 'exact', head: true }).eq('user_id', u.id).gte('cree_le', hier)
    ]);
    if ((enAttente ?? 0) >= 3) return erreur('Vous avez déjà 3 demandes en attente : nous vous répondons très vite');
    if ((duJour ?? 0) >= 5) return erreur('Trop de demandes aujourd’hui, réessayez demain', 429);

    const { data: c, error } = await admin.from('conversations').insert({
      user_id: u.id, email: u.email, nom, categorie, sujet_chiffre: await chiffrer(sujet)
    }).select().single();
    if (error || !c) return erreur('Création impossible', 500);
    await admin.from('messages').insert({ conversation_id: c.id, auteur: 'client', contenu_chiffre: await chiffrer(message) });
    await prevenir(emailAdmin, 'Nouvelle demande de message — ' + CATEGORIES[categorie],
      '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Nouvelle demande de <b>' + esc(nom || u.email) + '</b> dans la catégorie <b>' + esc(CATEGORIES[categorie]) + '</b>.</p>' +
      '<p>Le message est chiffré : ouvrez la messagerie de votre compte Novimo pour le lire et l’accepter.</p></div>');
    return repondre({ ok: true, conversation: await resume(c) });
  }

  /* ---------- Envoyer un message ---------- */
  if (action === 'envoyer') {
    const c = await conversation(d.conversation);
    if (!c) return erreur('Conversation introuvable', 404);
    const message = texteCourt(d.message, 2000);
    if (!message) return erreur('Message vide');
    if (c.statut === 'refusee' || c.statut === 'fermee') return erreur('Cette conversation est fermée');
    if (!estAdmin && c.statut !== 'acceptee') return erreur('Votre demande est en attente : vous pourrez écrire dès qu’elle sera acceptée');
    if (!estAdmin) {
      const ilYAUneHeure = new Date(Date.now() - 3600_000).toISOString();
      const { count } = await admin.from('messages').select('id', { count: 'exact', head: true }).eq('conversation_id', c.id).eq('auteur', 'client').gte('cree_le', ilYAUneHeure);
      if ((count ?? 0) >= 40) return erreur('Trop de messages d’un coup, patientez un peu', 429);
    }
    await admin.from('messages').insert({ conversation_id: c.id, auteur: estAdmin ? 'admin' : 'client', contenu_chiffre: await chiffrer(message) });
    // Répondre à une demande l'accepte automatiquement
    const maj: Record<string, unknown> = { maj_le: new Date().toISOString(), ...(estAdmin ? { non_lu_client: true } : { non_lu_admin: true }) };
    if (estAdmin && c.statut === 'demande') maj.statut = 'acceptee';
    await admin.from('conversations').update(maj).eq('id', c.id);
    if (estAdmin && !c.non_lu_client) {
      await prevenir(c.email, 'Novimo vous a répondu',
        '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Bonjour,</p><p>Vous avez une nouvelle réponse de Novimo dans votre messagerie.</p>' +
        '<p>Connectez-vous à votre compte sur le site pour la lire.</p><p>— Novimo</p></div>');
    }
    return repondre({ ok: true });
  }

  /* ---------- Accepter / refuser / fermer (admin) ---------- */
  if (action === 'statut') {
    if (!estAdmin) return erreur('Réservé à l’administrateur', 403);
    const c = await conversation(d.conversation);
    if (!c) return erreur('Conversation introuvable', 404);
    const statut = texteCourt(d.statut, 20);
    if (!STATUTS_ADMIN.includes(statut)) return erreur('Statut inconnu');
    await admin.from('conversations').update({ statut, maj_le: new Date().toISOString(), non_lu_client: true }).eq('id', c.id);
    if (statut === 'acceptee') {
      await prevenir(c.email, 'Votre demande a été acceptée',
        '<div style="font-family:Arial,sans-serif;font-size:14px"><p>Bonjour,</p><p>Votre demande « ' + esc(CATEGORIES[c.categorie]) + ' » a été acceptée : vous pouvez maintenant discuter avec Novimo dans la messagerie de votre compte.</p><p>— Novimo</p></div>');
    }
    return repondre({ ok: true });
  }

  /* ---------- Combien de non-lus ? (pour la pastille du menu) ---------- */
  if (action === 'compteur') {
    let q = admin.from('conversations').select('id', { count: 'exact', head: true });
    q = estAdmin ? q.eq('non_lu_admin', true).neq('statut', 'refusee') : q.eq('user_id', u.id).eq('non_lu_client', true);
    const { count } = await q;
    return repondre({ ok: true, nonLus: count ?? 0, admin: estAdmin });
  }

  return erreur('Action inconnue');
});
