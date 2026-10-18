/* =========================================================
   PDF-DEVIS.JS — fabrique le PDF d'un devis (avec jsPDF)
   ---------------------------------------------------------
   creerPdfDevis(devis) renvoie un document PDF A4 contenant
   toutes les informations : client, lignes, total, acompte
   de 30 % à la signature, idée du client, zone de signature.
   devis.langue = 'en' -> PDF en anglais (client étranger), sinon en français.
   devis.devise = 'USD' -> montants en dollars (devis du site anglais).
   Utilisé par la page devis ET par le tableau de bord.
   ========================================================= */

function creerPdfDevis(d) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const L = 210, MARGE = 18;
  const NOIR = [11, 12, 9], CITRON = [212, 255, 63], GRIS = [110, 112, 104], CLAIR = [242, 240, 232];
  const anglais = d.langue === 'en';
  const lg = (fr, en) => (anglais ? en : fr);

  // Les polices standard du PDF ne connaissent pas certains caractères : on les remplace
  const t = (s) => String(s == null ? '' : s)
    .replace(/[  ]/g, ' ').replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[−–—]/g, '-').replace(/[✦★]/g, '*');
  // Montant dans la devise du devis : euros, ou dollars (devis du site anglais)
  const symbole = d.devise === 'USD' ? '$' : '€';
  const eur = (n) => {
    const [ent, dec] = Number(n || 0).toFixed(2).split('.');
    if (anglais) return symbole + ent.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (dec === '00' ? '' : '.' + dec);
    return ent.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec === '00' ? '' : ',' + dec) + ' ' + symbole;
  };
  const dateFr = new Date(d.date || Date.now()).toLocaleDateString(lg('fr-FR', 'en-GB'), { day: 'numeric', month: 'long', year: 'numeric' });
  const pourcent = d.acomptePourcent || 30;
  const slogan = lg('Motion design pour les marques et les entreprises', 'Motion design for brands and businesses');

  /* ---------- En-tête noir avec le logo ---------- */
  doc.setFillColor(...NOIR); doc.rect(0, 0, L, 42, 'F');
  doc.setFillColor(...CITRON); doc.roundedRect(MARGE, 11, 20, 20, 5, 5, 'F');
  // le "N" penché du logo (même dessin que logo.svg, à l'échelle 1/5)
  doc.setFillColor(...NOIR); doc.setDrawColor(...NOIR); doc.setLineWidth(0.6); doc.setLineJoin('round');
  doc.lines([[2.211, -10.4], [2.6, 0], [1.852, 5.4], [1.148, -5.4], [2.6, 0], [-2.211, 10.4], [-2.6, 0], [-1.852, -5.4], [-1.148, 5.4]],
    MARGE + 6.089, 11 + 15.2, [1, 1], 'FD', true);
  // les deux traits de vitesse
  doc.setLineWidth(1.2); doc.setLineCap('round');
  doc.line(MARGE + 2.6, 11 + 8.2, MARGE + 4.8, 11 + 8.2);
  doc.line(MARGE + 3.4, 11 + 11, MARGE + 5, 11 + 11);
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
  doc.text('novimo', MARGE + 26, 24.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 202, 192);
  doc.text(t(slogan), MARGE + 26, 30.5);

  doc.setTextColor(...CITRON); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text(lg('DEVIS', 'QUOTE'), L - MARGE, 20, { align: 'right' });
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(t(lg('N° ', 'No. ') + d.numero), L - MARGE, 27, { align: 'right' });
  doc.text(t(dateFr), L - MARGE, 32.5, { align: 'right' });

  /* ---------- Le client ---------- */
  let y = 56;
  doc.setTextColor(...GRIS); doc.setFontSize(9); doc.text(lg('POUR', 'FOR'), MARGE, y);
  // Ta copie d'un devis venu du site anglais
  if (d.clientEtranger && !anglais) {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...NOIR);
    doc.setFillColor(...CITRON); doc.roundedRect(L - MARGE - 42, y - 4.6, 42, 7, 2, 2, 'F');
    doc.text(t('CLIENT ÉTRANGER'), L - MARGE - 21, y, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  }
  doc.setTextColor(...NOIR); doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(t(d.commerce), MARGE, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const infos = [d.type, d.prenom, d.email, d.tel].filter(Boolean).map(t);
  infos.forEach((ligne, i) => doc.text(ligne, MARGE, y + 14 + i * 5));
  y += 16 + infos.length * 5 + 6;

  /* ---------- Les lignes du devis ---------- */
  doc.setFillColor(...CLAIR); doc.rect(MARGE, y, L - 2 * MARGE, 9, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...GRIS);
  doc.text(t(lg('DÉSIGNATION', 'DESCRIPTION')), MARGE + 4, y + 6);
  doc.text(lg('MONTANT', 'AMOUNT'), L - MARGE - 4, y + 6, { align: 'right' });
  y += 9;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11); doc.setTextColor(...NOIR);
  (d.lignes || []).forEach((l) => {
    y += 9;
    doc.text(t(l.texte), MARGE + 4, y);
    doc.text(t(eur(l.montant)), L - MARGE - 4, y, { align: 'right' });
    doc.setDrawColor(225, 223, 215); doc.setLineWidth(0.2); doc.line(MARGE, y + 3.5, L - MARGE, y + 3.5);
  });

  /* ---------- Total, acompte, reste ---------- */
  y += 14;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Total', MARGE + 4, y);
  doc.text(t(eur(d.total)), L - MARGE - 4, y, { align: 'right' });

  y += 6;
  doc.setFillColor(...CITRON); doc.roundedRect(MARGE, y, L - 2 * MARGE, 13, 3, 3, 'F');
  doc.setFontSize(11); doc.setTextColor(...NOIR);
  doc.text(t(lg('Acompte à verser à la signature (' + pourcent + ' %)', 'Deposit due on signature (' + pourcent + '%)')), MARGE + 4, y + 8.3);
  doc.text(t(eur(d.acompte)), L - MARGE - 4, y + 8.3, { align: 'right' });
  y += 20;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text(t(lg('Reste à régler', 'Balance due')), MARGE + 4, y);
  doc.text(t(eur(Number(d.total) - Number(d.acompte))), L - MARGE - 4, y, { align: 'right' });

  /* ---------- Mentions ---------- */
  y += 12;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(t(lg(pourcent + ' % du prix total devront être versés à la signature du devis.',
    pourcent + '% of the total price is payable when the quote is signed.')), MARGE, y);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRIS);
  const mentions = doc.splitTextToSize(t(lg(
    'Prix indicatif, confirmé par e-mail avant de commencer. Inclus : deux séries de retouches et une vidéo MP4 Full HD. Formats courts livrés en carré et en vertical, spots en 16:9.' + (d.devise === 'USD' ? ' Montants en dollars américains (USD).' : '') + ' Devis valable 30 jours à compter du ' + dateFr + '.',
    'Indicative price, confirmed by email before we start. Included: two rounds of revisions and a Full HD MP4 video. Short formats delivered square and vertical, spots in 16:9. Prices in US dollars. Quote valid for 30 days from ' + dateFr + '.')), L - 2 * MARGE);
  doc.text(mentions, MARGE, y + 6);
  y += 6 + mentions.length * 4.5;

  /* ---------- L'idée du client ---------- */
  if (d.message) {
    y += 6;
    doc.setTextColor(...GRIS); doc.setFontSize(9); doc.text(t(lg('VOTRE IDÉE', 'YOUR IDEA')), MARGE, y);
    doc.setTextColor(...NOIR); doc.setFontSize(10);
    const idee = doc.splitTextToSize(t(d.message), L - 2 * MARGE).slice(0, 14);
    doc.text(idee, MARGE, y + 6);
    y += 6 + idee.length * 4.8;
  }

  /* ---------- Signature ---------- */
  const ySign = Math.max(y + 10, 238);
  doc.setDrawColor(...NOIR); doc.setLineWidth(0.3);
  doc.roundedRect(L - MARGE - 85, ySign, 85, 32, 3, 3, 'S');
  doc.setFontSize(9); doc.setTextColor(...GRIS);
  doc.text(t(lg('Bon pour accord, date et signature du client :', 'Approved: date and client signature')), L - MARGE - 81, ySign + 6);

  /* ---------- Pied de page ---------- */
  doc.setFontSize(8); doc.setTextColor(...GRIS);
  doc.text(t('Novimo - ' + slogan + ' - ' + (d.contact || '')), L / 2, 290, { align: 'center' });

  return doc;
}
