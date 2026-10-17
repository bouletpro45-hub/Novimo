/* =========================================================
   SYMBOLES.JS — la bibliothèque de symboles dessinés
   ---------------------------------------------------------
   Chaque symbole est un petit dessin SVG dans un carré de
   200 x 200. Deux sortes de formes :
     class="trait"            -> la ligne se dessine pendant l'animation
     data-remplissage="0.2"   -> la forme se remplit ensuite
                                 (0 = vide, 1 = plein)
   Les couleurs viennent automatiquement de la couleur "accent".

   Pour ajouter un symbole : copie un bloc existant, change son
   nom et son dessin, puis écris ce nom dans les RÉGLAGES.
   ========================================================= */

window.Symboles = {

  /* ---- Lune + épi de blé (boulangerie Fournil Lune) ---- */
  'lune-ble': function () {
    // Le croissant de lune : un grand cercle moins un cercle décalé
    const lune = '<path class="trait" data-remplissage="0.16" d="M 128 38 A 68 68 0 1 0 128 162 A 70 70 0 0 1 128 38 Z"/>';

    // L'épi : une tige courbe (courbe de Bézier) + des grains de chaque côté
    const P0 = [104, 172], P1 = [124, 120], P2 = [148, 52];
    const point = (t) => [
      (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t * t * P2[0],
      (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t * t * P2[1]
    ];
    const angle = (t) => {
      const dx = 2 * (1 - t) * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
      const dy = 2 * (1 - t) * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
      return Math.atan2(dy, dx) * 180 / Math.PI;
    };
    const grain = 'M 0 0 C 5 -5 12 -5 19 0 C 12 5 5 5 0 0 Z';

    let epi = `<path class="trait" d="M ${P0[0]} ${P0[1]} Q ${P1[0]} ${P1[1]} ${P2[0]} ${P2[1]}"/>`;
    // petite feuille en bas de la tige
    const [fx, fy] = point(0.22);
    epi += `<path class="trait" data-remplissage="0.5" d="M 0 0 C 10 -7 24 -8 34 -3 C 22 2 10 4 0 0 Z" transform="translate(${fx} ${fy}) rotate(${angle(0.22) + 48})"/>`;
    // grains par paires
    [0.44, 0.57, 0.70, 0.83].forEach((t) => {
      const [x, y] = point(t);
      for (const cote of [-1, 1]) {
        epi += `<path class="trait" data-remplissage="1" d="${grain}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(angle(t) + cote * 34).toFixed(1)})"/>`;
      }
    });
    // grain du sommet
    epi += `<path class="trait" data-remplissage="1" d="${grain}" transform="translate(${P2[0]} ${P2[1]}) rotate(${angle(1).toFixed(1)})"/>`;

    // deux petites étoiles scintillantes
    const scintille = (x, y, s) =>
      `<path class="trait" data-remplissage="1" d="M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z"/>`;

    return lune + epi + scintille(44, 38, 11) + scintille(182, 150, 8);
  },

  /* ---- Ciseaux (coiffeur, barbier) ---- */
  'ciseaux': function () {
    return [
      '<circle class="trait" data-remplissage="0.16" cx="70" cy="152" r="20"/>',
      '<circle class="trait" data-remplissage="0.16" cx="130" cy="152" r="20"/>',
      '<path class="trait" d="M 82 136 L 142 38"/>',
      '<path class="trait" d="M 118 136 L 58 38"/>',
      '<circle class="trait" data-remplissage="1" cx="100" cy="106" r="5"/>'
    ].join('');
  },

  /* ---- Étoile (symbole passe-partout) ---- */
  'etoile': function () {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 78 : 34;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      d += (i === 0 ? 'M ' : ' L ') + (100 + r * Math.cos(a)).toFixed(1) + ' ' + (104 + r * Math.sin(a)).toFixed(1);
    }
    return `<path class="trait" data-remplissage="0.16" d="${d} Z"/><circle class="trait" cx="100" cy="104" r="92"/>`;
  },

  /* ---- Aucun symbole ---- */
  'aucun': function () { return ''; }
};
