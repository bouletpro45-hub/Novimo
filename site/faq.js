/* =========================================================
   FAQ.JS — la page FAQ
     1. recherche dans les questions et les réponses
     2. une seule question ouverte à la fois
     3. les données "FAQPage" pour Google (fabriquées depuis la page)
   ========================================================= */

const questionsFaq = Array.from(document.querySelectorAll('.question'));

/* ---------- 1. Recherche ---------- */
const sansAccents = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
document.getElementById('faq-filtre').addEventListener('input', (e) => {
  const mots = sansAccents(e.target.value.trim()).split(/\s+/).filter(Boolean);
  let visibles = 0;
  questionsFaq.forEach((q) => {
    const texte = sansAccents(q.textContent);
    const ok = mots.every((m) => texte.includes(m));
    q.hidden = !ok;
    if (ok) visibles++;
    q.open = ok && mots.length > 0 && visibles <= 3;   // on ouvre les premiers résultats
  });
  document.querySelectorAll('.faq-groupe').forEach((g) => { g.hidden = !g.querySelector('.question:not([hidden])'); });
  document.getElementById('faq-vide').hidden = visibles > 0;
});

/* ---------- 2. Une seule question ouverte à la fois ---------- */
questionsFaq.forEach((q) => q.addEventListener('toggle', () => {
  if (q.open && !document.getElementById('faq-filtre').value) questionsFaq.forEach((autre) => { if (autre !== q) autre.open = false; });
}));

/* ---------- 3. Données structurées pour Google ---------- */
const donneesFaq = document.createElement('script');
donneesFaq.type = 'application/ld+json';
donneesFaq.textContent = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: questionsFaq.map((q) => ({
    '@type': 'Question',
    name: q.querySelector('summary').textContent.trim(),
    acceptedAnswer: { '@type': 'Answer', text: q.querySelector('.reponse').textContent.trim().replace(/\s+/g, ' ') }
  }))
});
document.head.appendChild(donneesFaq);
