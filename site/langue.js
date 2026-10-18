/* =========================================================
   LANGUE.JS — français / anglais (chargé dans le <head> de chaque page)
     1. la langue de la page : <html lang="fr"> ou <html lang="en">
        -> les pages anglaises sont les mêmes fichiers avec "-en" :
           index.html <-> index-en.html, devis.html <-> devis-en.html…
     2. t('texte français', 'English text') : le bon texte selon la page
        tr(objet, 'nom') : lit objet.en.nom sur une page anglaise (réglages, catalogue)
        lien('devis.html') : le lien vers la page dans la même langue
     3. le sélecteur de langue (à la première visite, puis avec le bouton FR · EN)
   Le choix est gardé dans le navigateur (clé "novimo-langue").
   ========================================================= */

// Une page avec <html data-langue-auto> (la page 404) suit la langue choisie par le visiteur :
// ses textes anglais sont dans des attributs data-en="…"
const LANGUE_AUTO = document.documentElement.hasAttribute('data-langue-auto') && (function () {
  try { return localStorage.getItem('novimo-langue') === 'en'; } catch (e) { return false; }
})();
if (LANGUE_AUTO) {
  document.documentElement.lang = 'en';
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-en]').forEach((el) => { el.innerHTML = el.dataset.en; });
    document.querySelectorAll('[data-lien-langue]').forEach((a) => { a.setAttribute('href', Langue.versLangue('en', a.getAttribute('href'))); });
    if (document.documentElement.dataset.titreEn) document.title = document.documentElement.dataset.titreEn;
  });
}
const LANGUE = document.documentElement.lang === 'en' ? 'en' : 'fr';
const EN = LANGUE === 'en';
const t = (fr, en) => (EN ? en : fr);
// Le prix dans la devise de la page : euros (site français) ou dollars (site anglais, bloc en: { prix })
const DEVISE = EN ? 'USD' : 'EUR';
const prixLocal = (objet, champ) => Number(tr(objet, champ || 'prix')) || 0;
const tr = (objet, champ) => (EN && objet && objet.en && objet.en[champ] != null ? objet.en[champ] : (objet || {})[champ]);

const Langue = (function () {
  // Les pages qui existent dans les deux langues
  const PAGES = ['index', 'devis', 'modeles', 'faq', 'cgu', 'confidentialite', 'compte', 'messages'];
  const CLE = 'novimo-langue';

  function lireChoix() { try { return localStorage.getItem(CLE); } catch (e) { return null; } }
  function ecrireChoix(l) { try { localStorage.setItem(CLE, l); } catch (e) { /* navigation privée */ } }

  // "devis.html#x" -> "devis-en.html#x" (ou l'inverse), seulement pour les pages bilingues
  function versLangue(langue, href) {
    const m = String(href).match(/^([a-z]+?)(-en)?\.html(.*)$/);
    if (!m || !PAGES.includes(m[1])) return href;
    return m[1] + (langue === 'en' ? '-en' : '') + '.html' + m[3];
  }
  const lien = (href) => versLangue(LANGUE, href);

  // La page actuelle ("" = l'accueil du dossier)
  const fichier = location.pathname.split('/').pop() || 'index.html';
  const nomPage = (fichier.match(/^([a-z]+?)(-en)?\.html$/) || [])[1];
  const bilingue = PAGES.includes(nomPage);

  function allerVers(langue) {
    location.replace(versLangue(langue, nomPage + '.html') + location.search + location.hash);
  }

  // 1. Le visiteur a déjà choisi une autre langue : on l'y emmène tout de suite
  const choix = lireChoix();
  if (bilingue && (choix === 'fr' || choix === 'en') && choix !== LANGUE) allerVers(choix);

  /* ---------- 2. Le sélecteur ---------- */
  let fenetre = null;
  function ouvrir() {
    if (!bilingue) return;
    if (!fenetre) {
      fenetre = document.createElement('dialog');
      fenetre.className = 'choix-langue';
      fenetre.setAttribute('aria-labelledby', 'choix-langue-titre');
      fenetre.innerHTML =
        '<span class="fenetre-icone" aria-hidden="true"><img src="logo.svg" alt=""></span>' +
        '<h2 id="choix-langue-titre">Choisissez votre langue<span>Choose your language</span></h2>' +
        '<div class="choix-langue-boutons">' +
          '<button type="button" data-langue="fr" lang="fr"><b>FR</b><span>Français</span><small>Continuer en français</small></button>' +
          '<button type="button" data-langue="en" lang="en"><b>EN</b><span>English</span><small>Continue in English</small></button>' +
        '</div>';
      fenetre.addEventListener('click', (e) => {
        const b = e.target.closest('[data-langue]');
        if (!b) return;
        ecrireChoix(b.dataset.langue);
        if (b.dataset.langue !== LANGUE) return allerVers(b.dataset.langue);
        fenetre.close();
      });
      // Échap : sans choix, on garde la langue de la page
      fenetre.addEventListener('cancel', () => { if (!lireChoix()) ecrireChoix(LANGUE); });
      fenetre.addEventListener('close', () => document.dispatchEvent(new Event('novimo-langue-choisie')));
      document.body.appendChild(fenetre);
    }
    if (!fenetre.open) fenetre.showModal();
    const actuel = fenetre.querySelector('[data-langue="' + LANGUE + '"]');
    if (actuel) actuel.focus();
  }

  // Le petit bouton "FR · EN" qui ramène au sélecteur
  function bouton(classe) {
    return '<button type="button" class="bouton-langue ' + (classe || '') + '" data-ouvrir-langue title="' + t('Changer de langue', 'Change language') + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>' +
      '<span><b' + (EN ? '' : ' class="actuelle"') + '>FR</b> · <b' + (EN ? ' class="actuelle"' : '') + '>EN</b></span></button>';
  }
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ouvrir-langue]')) ouvrir(); });

  // 3. Première visite : on demande
  const enAttente = bilingue && !choix;
  if (enAttente) document.addEventListener('DOMContentLoaded', ouvrir);

  return {
    lien, versLangue, ouvrir, bouton, bilingue,
    // vrai tant que le visiteur n'a pas encore choisi sa langue
    enAttente: () => Boolean(fenetre && fenetre.open) || (enAttente && !fenetre)
  };
})();
const lien = Langue.lien;
