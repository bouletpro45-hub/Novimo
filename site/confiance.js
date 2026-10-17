/* =========================================================
   CONFIANCE.JS — chargé sur toutes les pages, après commun.js
     1. HTTPS obligatoire (sauf sur ton ordinateur en local)
     2. la bannière cookies (accepter / refuser, aussi simple l'un que l'autre)
     3. la mesure d'audience, SEULEMENT si la personne a accepté
        -> les visites arrivent dans ton tableau de bord (table "visites" de Supabase)
   ========================================================= */

/* ---------- 1. HTTPS obligatoire ---------- */
(function forcerHttps() {
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || location.protocol === 'file:';
  if (location.protocol === 'http:' && !local) location.replace('https://' + location.host + location.pathname + location.search + location.hash);
})();

const Consentement = (function () {
  const CLE = 'novimo-consentement';
  const DUREE_MAX = 1000 * 60 * 60 * 24 * 30 * 13;   // la CNIL demande de redemander au bout de 13 mois au plus

  function lire() {
    try {
      const v = JSON.parse(localStorage.getItem(CLE) || 'null');
      if (!v || Date.now() - v.le > DUREE_MAX) return null;
      return v.mesure ? 'oui' : 'non';
    } catch (e) { return null; }
  }
  function ecrire(oui) {
    try { localStorage.setItem(CLE, JSON.stringify({ mesure: oui, le: Date.now() })); } catch (e) { /* navigation privée */ }
    if (!oui) { try { localStorage.removeItem('novimo-visiteur'); } catch (e) { /* rien */ } }
  }

  /* ---------- 2. La bannière ---------- */
  function afficherBanniere() {
    if (document.getElementById('banniere-cookies')) return;
    const b = document.createElement('section');
    b.id = 'banniere-cookies';
    b.className = 'banniere-cookies';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookies et mesure d’audience');
    b.innerHTML =
      '<p><strong>Un petit cookie de mesure ?</strong> Il nous dit seulement combien de personnes visitent le site et quelles pages leur plaisent. ' +
      'Aucune publicité, aucune revente. <a href="confidentialite.html#cookies">En savoir plus</a></p>' +
      '<div class="banniere-boutons">' +
        '<button type="button" class="bouton-fantome" data-choix="non">Refuser</button>' +
        '<button type="button" class="bouton" data-choix="oui">Accepter</button>' +
      '</div>';
    document.body.appendChild(b);
    b.addEventListener('click', (e) => {
      const bouton = e.target.closest('[data-choix]');
      if (!bouton) return;
      const oui = bouton.dataset.choix === 'oui';
      ecrire(oui);
      b.remove();
      if (oui) mesurer();
    });
  }

  /* ---------- 3. La mesure d'audience (première partie, sans service tiers) ---------- */
  function appareil() {
    const l = window.innerWidth;
    return l < 700 ? 'mobile' : l < 1100 ? 'tablette' : 'ordinateur';
  }
  function source() {
    const p = new URLSearchParams(location.search);
    if (p.get('utm_source')) return p.get('utm_source').slice(0, 40);
    try {
      const r = document.referrer ? new URL(document.referrer).hostname.replace(/^www\./, '') : '';
      return r && r !== location.hostname.replace(/^www\./, '') ? r.slice(0, 60) : 'direct';
    } catch (e) { return 'direct'; }
  }
  function mesurer() {
    const C = (typeof CONFIG_NOVIMO !== 'undefined') ? CONFIG_NOVIMO : null;
    if (!C || !C.supabaseUrl || !C.supabaseCleAnon) return;
    const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && !/analytics-test/.test(location.search);
    let pasDeStats = false;
    try { pasDeStats = localStorage.getItem('novimo-pas-de-stats') === '1'; } catch (e) { /* rien */ }
    if (local || pasDeStats || document.body.dataset.page === 'dashboard') return;   // tes propres visites ne comptent pas

    let visiteur = null;
    try {
      visiteur = localStorage.getItem('novimo-visiteur');
      if (!visiteur) { visiteur = Math.random().toString(36).slice(2, 12); localStorage.setItem('novimo-visiteur', visiteur); }
    } catch (e) { /* rien */ }

    fetch(C.supabaseUrl + '/rest/v1/visites', {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: C.supabaseCleAnon,
        Authorization: 'Bearer ' + C.supabaseCleAnon,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ page: location.pathname.split('/').pop() || 'index.html', source: source(), appareil: appareil(), visiteur })
    }).catch(() => { /* la mesure ne doit jamais gêner la visite */ });
  }

  // Au chargement : on demande, ou on applique le choix déjà fait
  document.addEventListener('DOMContentLoaded', () => {
    // Ouvrir le tableau de bord marque ce navigateur comme le tien : tes visites ne comptent plus
    if (document.body.dataset.page === 'dashboard') { try { localStorage.setItem('novimo-pas-de-stats', '1'); } catch (e) { /* rien */ } }
    const choix = lire();
    if (choix === null) afficherBanniere();
    else if (choix === 'oui') mesurer();
    // Le lien "Gérer les cookies" (pied de page) rouvre la bannière
    document.querySelectorAll('[data-cookies]').forEach((lien) => lien.addEventListener('click', (e) => {
      e.preventDefault();
      afficherBanniere();
    }));
  });

  return { lire, afficherBanniere };
})();
