/* =========================================================
   API.JS — le lien entre le site et le service en ligne (Supabase)
   ---------------------------------------------------------
   Toutes les pages passent par "NovimoAPI" :
     - connexion / inscription (Google ou lien par e-mail)
     - envoi d'un devis (enregistré + e-mails avec le PDF)
     - lecture des devis (les siens pour un client, tous pour l'admin)
   Si config.js est vide, NovimoAPI.actif vaut false
   et chaque page passe en "mode démo".
   ========================================================= */

const NovimoAPI = (function () {
  const C = (typeof CONFIG_NOVIMO !== 'undefined') ? CONFIG_NOVIMO : {};
  const actif = Boolean(C.supabaseUrl && C.supabaseCleAnon && window.supabase);
  const client = actif ? window.supabase.createClient(C.supabaseUrl, C.supabaseCleAnon) : null;

  // L'adresse de la page Compte (pour revenir après la connexion)
  const pageCompte = () => location.origin + location.pathname.replace(/[^/]*$/, 'compte.html');

  function verifierActif() {
    if (!actif) throw new Error('Le service en ligne n\'est pas encore configuré (config.js).');
  }

  return {
    actif,
    client,
    emailAdmin: (C.emailAdmin || '').toLowerCase(),

    /* ---------- Compte ---------- */
    async utilisateur() {
      if (!actif) return null;
      const { data } = await client.auth.getSession();
      return data.session ? data.session.user : null;
    },
    estAdmin(utilisateur) {
      return Boolean(utilisateur) && (utilisateur.email || '').toLowerCase() === this.emailAdmin;
    },
    connexionGoogle() {
      verifierActif();
      return client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: pageCompte() } });
    },
    connexionParLien(email) {
      verifierActif();
      // Pas de mot de passe : la personne reçoit un lien. Si elle n'a pas de compte, il est créé.
      return client.auth.signInWithOtp({ email, options: { emailRedirectTo: pageCompte() } });
    },
    deconnexion() {
      return actif ? client.auth.signOut({ scope: 'local' }) : Promise.resolve();
    },
    quandConnexionChange(fonction) {
      // setTimeout : appeler Supabase directement ici le bloquerait (la déconnexion ne finissait jamais)
      if (actif) client.auth.onAuthStateChange(() => setTimeout(fonction, 0));
    },

    /* ---------- Devis ---------- */
    // Envoie le devis à la fonction serveur "envoyer-devis" :
    // elle l'enregistre et envoie le PDF par e-mail (à toi + au client)
    async envoyerDevis(donnees, pdfBase64) {
      verifierActif();
      const { data, error } = await client.functions.invoke('envoyer-devis', {
        body: Object.assign({}, donnees, { pdf: pdfBase64 })
      });
      if (error) throw error;
      if (!data || !data.ok) throw new Error((data && data.erreur) || 'L\'envoi a échoué.');
      return data;
    },

    // Les devis de la personne connectée
    async mesDevis() {
      verifierActif();
      const u = await this.utilisateur();
      if (!u) return [];
      const { data, error } = await client.from('devis').select('*').eq('user_id', u.id).order('cree_le', { ascending: false });
      if (error) throw error;
      return data;
    },

    // Tableau de bord : tous les devis + les comptes (refusé par la base si on n'est pas admin)
    async donneesAdmin() {
      verifierActif();
      const [devis, profils] = await Promise.all([
        client.from('devis').select('*').order('cree_le', { ascending: false }),
        client.from('profils').select('id, cree_le')
      ]);
      if (devis.error) throw devis.error;
      if (profils.error) throw profils.error;
      return { devis: devis.data, profils: profils.data };
    },

    // Tableau de bord : les visites des 30 derniers jours (mesure d'audience)
    // Renvoie null si la table "visites" n'existe pas encore (voir supabase/ajout-2026-10-17.sql)
    async visites() {
      verifierActif();
      const depuis = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const { data, error } = await client.from('visites').select('cree_le, page, source, appareil, visiteur')
        .gte('cree_le', depuis).order('cree_le', { ascending: false }).limit(10000);
      if (error) return null;
      return data;
    },

    /* ---------- Messagerie ---------- */
    // Tout passe par la fonction serveur "messagerie" (messages chiffrés côté serveur).
    // action : 'liste', 'fil', 'nouvelle', 'envoyer', 'statut' ou 'compteur'
    async messagerie(action, donnees) {
      verifierActif();
      const { data, error } = await client.functions.invoke('messagerie', { body: Object.assign({ action }, donnees || {}) });
      if (error) {
        // Le serveur a répondu avec un message d'erreur clair : on le récupère
        let texte = error.message;
        try { const corps = await error.context.json(); if (corps && corps.erreur) texte = corps.erreur; } catch (e) { /* rien */ }
        throw new Error(texte);
      }
      if (!data || !data.ok) throw new Error((data && data.erreur) || 'La messagerie ne répond pas.');
      return data;
    },

    // Dashboard : changer le statut d'un devis
    //   'signe'   = acompte reçu   -> compte dans les gains
    //   'cloture' = solde reçu     -> le reste compte dans les gains
    //   'annule', 'en_cours'
    async changerStatut(devis, statut) {
      verifierActif();
      const maintenant = new Date().toISOString();
      const champs = { statut };
      if ((statut === 'signe' || statut === 'cloture') && !devis.acompte_recu_le) champs.acompte_recu_le = maintenant;
      if (statut === 'cloture' && !devis.solde_recu_le) champs.solde_recu_le = maintenant;
      if (statut === 'signe') champs.solde_recu_le = null;   // retour en arrière : le solde n'est plus compté
      if (statut === 'en_cours' || statut === 'annule') { champs.acompte_recu_le = null; champs.solde_recu_le = null; }
      const { error } = await client.from('devis').update(champs).eq('id', devis.id);
      if (error) throw error;
      return Object.assign({}, devis, champs);
    }
  };
})();
