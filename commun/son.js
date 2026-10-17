/* =========================================================
   son.js : effets sonores et musique de fond, fabriqués par
   le navigateur (Web Audio). Aucun fichier audio, donc aucun
   problème de droits d'auteur.

   Dans un modèle, on place un son comme une animation :
     S.son('whoosh', 2.3);                     // à 2,3 s
     S.son('compteur', 7, { duree: 0.7, n: 12 });
     S.son('musique', 0, { duree: 20, drop: 2.6 });

   Sons disponibles : whoosh, frappe, clavier, pop, tick, compteur, boum,
   barre, ding, caisse, tremble, montee, succes, musique.
   ========================================================= */
(function () {
  const VOLUME = 0.9;          // volume général
  const VOLUME_MUSIQUE = 0.45; // la musique reste discrète sous les effets

  let ctx = null, sortie = null, bus = null;
  const bruits = new WeakMap();

  /* ---------- petites briques ---------- */

  // Un buffer de bruit blanc (2 s), réutilisé par tous les sons
  function bruit(c) {
    if (bruits.has(c)) return bruits.get(c);
    const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    bruits.set(c, b);
    return b;
  }

  // Un volume qui monte puis redescend (attaque, puis chute jusqu'à "fin")
  function enveloppe(c, o, t, volume, attaque, fin) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(volume, t + attaque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
    g.connect(o);
    return g;
  }

  function oscillateur(c, type, freq, t, fin) {
    const s = c.createOscillator();
    s.type = type;
    s.frequency.setValueAtTime(freq, t);
    s.start(t);
    s.stop(t + fin + 0.05);
    return s;
  }

  function sourceBruit(c, t, fin) {
    const s = c.createBufferSource();
    s.buffer = bruit(c);
    s.loop = true;
    s.start(t, Math.random());
    s.stop(t + fin + 0.05);
    return s;
  }

  function filtre(c, type, freq, q) {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (q) f.Q.value = q;
    return f;
  }

  // Une note "piano doux" (triangle + harmonique)
  function note(c, o, t, freq, volume, fin) {
    const g = enveloppe(c, o, t, volume, 0.01, fin);
    oscillateur(c, 'triangle', freq, t, fin).connect(g);
    const g2 = enveloppe(c, o, t, volume * 0.25, 0.01, fin * 0.5);
    oscillateur(c, 'sine', freq * 2, t, fin).connect(g2);
  }

  /* ---------- les effets ---------- */
  const EFFETS = {
    // Souffle de transition (bruit filtré qui balaie)
    whoosh(c, o, t) {
      const f = filtre(c, 'bandpass', 300, 1.4);
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(3200, t + 0.2);
      f.frequency.exponentialRampToValueAtTime(700, t + 0.45);
      f.connect(enveloppe(c, o, t, 0.55, 0.18, 0.48));
      sourceBruit(c, t, 0.5).connect(f);
    },

    // Une touche de clavier (petit clic sec, un peu différent à chaque fois)
    frappe(c, o, t) {
      const f = filtre(c, 'bandpass', 2200 + Math.random() * 1800, 1.6);
      f.connect(enveloppe(c, o, t, 0.22, 0.001, 0.035));
      sourceBruit(c, t, 0.04).connect(f);
    },
    // Quelqu'un qui tape au clavier : n frappes réparties sur "duree"
    clavier(c, o, t, opt) {
      const n = opt.n || 20, duree = opt.duree || 2;
      for (let i = 0; i < n; i++) EFFETS.frappe(c, o, t + (i + Math.random() * 0.6) * duree / n);
    },

    /* ---- Effets d'interface (pour les démos de site) ---- */
    // Clic de souris : double petit "tic" sec
    clic(c, o, t) {
      // chaque clic est un peu différent (hauteur au hasard) pour ne jamais sonner pareil
      const f = filtre(c, 'highpass', 1400 + Math.random() * 900);
      f.connect(enveloppe(c, o, t, 0.35, 0.001, 0.025));
      sourceBruit(c, t, 0.03).connect(f);
      const s = oscillateur(c, 'sine', 2600 + Math.random() * 1200, t + 0.035, 0.03);
      s.connect(enveloppe(c, o, t + 0.035, 0.1, 0.001, 0.025));
    },
    // Zoom avant : un balayage qui monte, avec un souffle
    zoom(c, o, t) {
      const s = oscillateur(c, 'sine', 180, t, 0.6);
      s.frequency.exponentialRampToValueAtTime(1400, t + 0.5);
      s.connect(enveloppe(c, o, t, 0.18, 0.3, 0.6));
      const f = filtre(c, 'highpass', 600);
      f.frequency.setValueAtTime(600, t);
      f.frequency.exponentialRampToValueAtTime(5000, t + 0.5);
      f.connect(enveloppe(c, o, t, 0.3, 0.35, 0.55));
      sourceBruit(c, t, 0.6).connect(f);
    },
    // Glissement latéral (passage d'une page à l'autre)
    glisse(c, o, t) {
      const f = filtre(c, 'lowpass', 4000, 2);
      f.frequency.setValueAtTime(5000, t);
      f.frequency.exponentialRampToValueAtTime(500, t + 0.35);
      f.connect(enveloppe(c, o, t, 0.45, 0.04, 0.4));
      sourceBruit(c, t, 0.45).connect(f);
    },
    // Rideau : des lamelles qui claquent en cascade
    rideau(c, o, t) {
      [0, 0.05, 0.1, 0.15, 0.2].forEach((d, i) => {
        const f = filtre(c, 'bandpass', 900 + i * 350, 3);
        f.connect(enveloppe(c, o, t + d, 0.3, 0.002, 0.06));
        sourceBruit(c, t + d, 0.07).connect(f);
      });
    },
    // Retournement 3D : un "vouf" qui descend
    flip(c, o, t) {
      const s = oscillateur(c, 'triangle', 900, t, 0.35);
      s.frequency.exponentialRampToValueAtTime(140, t + 0.3);
      s.connect(enveloppe(c, o, t, 0.22, 0.01, 0.35));
      const f = filtre(c, 'bandpass', 1500, 1);
      f.connect(enveloppe(c, o, t, 0.25, 0.05, 0.3));
      sourceBruit(c, t, 0.3).connect(f);
    },
    // Petit carillon montant (connexion réussie)
    carillon(c, o, t) {
      [659.25, 987.77, 1318.5].forEach((fr, i) => note(c, o, t + i * 0.09, fr, 0.18, 0.9));
    },
    // Envoi : un "fiou" qui monte vite
    envoi(c, o, t) {
      const s = oscillateur(c, 'sine', 300, t, 0.3);
      s.frequency.exponentialRampToValueAtTime(2400, t + 0.22);
      s.connect(enveloppe(c, o, t, 0.25, 0.02, 0.28));
    },
    // Scintillement (confettis, étoiles)
    scintille(c, o, t) {
      for (let i = 0; i < 9; i++) note(c, o, t + i * 0.045, 1800 + Math.random() * 2400, 0.06, 0.35);
    },
    // Notification de mail : trois notes douces
    mail(c, o, t) {
      [880, 1108.73, 1318.5].forEach((fr, i) => note(c, o, t + i * 0.13, fr, 0.2, 0.8));
    },
    // Message envoyé : "bloup" qui monte
    bloup(c, o, t) {
      const s = oscillateur(c, 'sine', 420, t, 0.18);
      s.frequency.exponentialRampToValueAtTime(980, t + 0.12);
      s.connect(enveloppe(c, o, t, 0.4, 0.005, 0.18));
    },
    // Message reçu : deux gouttes
    recu(c, o, t) {
      [[1046.5, 0], [1567.98, 0.1]].forEach(([fr, d]) => {
        const s = oscillateur(c, 'sine', fr, t + d, 0.25);
        s.frequency.exponentialRampToValueAtTime(fr * 0.7, t + d + 0.2);
        s.connect(enveloppe(c, o, t + d, 0.3, 0.004, 0.25));
      });
    },
    // "En train d'écrire…" : petites bulles très douces
    ecrit(c, o, t, opt) {
      const n = opt.n || 6;
      for (let i = 0; i < n; i++) {
        const s = oscillateur(c, 'sine', 520 + (i % 3) * 90, t + i * 0.2, 0.08);
        s.connect(enveloppe(c, o, t + i * 0.2, 0.05, 0.01, 0.08));
      }
    },
    // Chargement : un petit bourdonnement qui tourne
    chargement(c, o, t, opt) {
      const duree = opt.duree || 0.6;
      const s = oscillateur(c, 'triangle', 330, t, duree);
      const lfo = oscillateur(c, 'sine', 9, t, duree);
      const prof = c.createGain(); prof.gain.value = 40;
      lfo.connect(prof); prof.connect(s.frequency);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.1);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
      g.connect(o); s.connect(g);
    },
    // Impact très grave (le logo final)
    impact(c, o, t) {
      const s = oscillateur(c, 'sine', 90, t, 1.4);
      s.frequency.exponentialRampToValueAtTime(30, t + 1.2);
      s.connect(enveloppe(c, o, t, 0.6, 0.005, 1.4));
      const f = filtre(c, 'lowpass', 2500);
      f.frequency.setValueAtTime(2500, t);
      f.frequency.exponentialRampToValueAtTime(200, t + 0.6);
      f.connect(enveloppe(c, o, t, 0.5, 0.002, 0.7));
      sourceBruit(c, t, 0.7).connect(f);
    },
    // Badge qui apparaît : petit "tchiing" métallique
    badge(c, o, t) {
      [2637, 3520].forEach((fr, i) => {
        const s = oscillateur(c, 'square', fr, t + i * 0.06, 0.4);
        const f = filtre(c, 'bandpass', fr, 8);
        s.connect(f); f.connect(enveloppe(c, o, t + i * 0.06, 0.12, 0.002, 0.4));
      });
    },
    // Notification de téléphone : une note claire, plus aiguë selon opt.ton (0, 1, 2…)
    notif(c, o, t, opt) {
      const base = [784, 988, 1175, 1397][(opt.ton || 0) % 4];
      note(c, o, t, base, 0.22, 0.7);
      note(c, o, t + 0.08, base * 1.5, 0.12, 0.6);
    },
    // Aspiration : un souffle qui gonfle puis se coupe net (transition "aspirée")
    aspire(c, o, t) {
      const f = filtre(c, 'bandpass', 300, 1.2);
      f.frequency.setValueAtTime(300, t);
      f.frequency.exponentialRampToValueAtTime(3500, t + 0.4);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.5, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      g.connect(o); f.connect(g);
      sourceBruit(c, t, 0.45).connect(f);
    },
    // Coupure "glitch" (début de vidéo)
    glitch(c, o, t) {
      for (let i = 0; i < 6; i++) {
        const d = i * 0.035;
        const s = oscillateur(c, 'square', 80 + Math.random() * 900, t + d, 0.03);
        s.connect(enveloppe(c, o, t + d, 0.12, 0.001, 0.03));
      }
    },

    // Petite bulle qui éclate (apparition d'un élément)
    pop(c, o, t, opt) {
      const s = oscillateur(c, 'sine', opt.aigu ? 1100 : 750, t, 0.14);
      s.frequency.exponentialRampToValueAtTime(opt.aigu ? 300 : 170, t + 0.12);
      s.connect(enveloppe(c, o, t, 0.5, 0.005, 0.15));
    },

    tick(c, o, t) {
      const f = filtre(c, 'highpass', 1500);
      f.connect(enveloppe(c, o, t, 0.12, 0.002, 0.035));
      oscillateur(c, 'square', 2400, t, 0.04).connect(f);
    },

    // Des ticks qui ralentissent, calés sur un compteur qui monte (courbe "douce")
    compteur(c, o, t, opt) {
      const n = opt.n || 10, duree = opt.duree || 0.8;
      for (let i = 0; i < n; i++) {
        const p = i / n;
        EFFETS.tick(c, o, t + duree * (1 - Math.sqrt(1 - p)));
      }
    },

    // Impact grave (gros chiffre qui tombe)
    boum(c, o, t) {
      const s = oscillateur(c, 'sine', 150, t, 0.6);
      s.frequency.exponentialRampToValueAtTime(42, t + 0.4);
      s.connect(enveloppe(c, o, t, 0.9, 0.005, 0.6));
      const f = filtre(c, 'lowpass', 900);
      f.connect(enveloppe(c, o, t, 0.35, 0.002, 0.09));
      sourceBruit(c, t, 0.1).connect(f);
    },

    // Coup de feutre qui barre (prix rayé)
    barre(c, o, t) {
      const f = filtre(c, 'bandpass', 6000, 0.8);
      f.frequency.setValueAtTime(6000, t);
      f.frequency.exponentialRampToValueAtTime(1800, t + 0.25);
      f.connect(enveloppe(c, o, t, 0.4, 0.02, 0.28));
      sourceBruit(c, t, 0.3).connect(f);
    },

    // Notification de téléphone
    ding(c, o, t) {
      note(c, o, t, 1318.5, 0.3, 0.7);
      note(c, o, t + 0.12, 1760, 0.3, 0.9);
    },

    // "Ka-ching" de caisse (bon prix)
    caisse(c, o, t) {
      const f = filtre(c, 'highpass', 3000);
      f.connect(enveloppe(c, o, t, 0.3, 0.002, 0.06));
      sourceBruit(c, t, 0.07).connect(f);
      note(c, o, t + 0.05, 2093, 0.22, 0.5);
      note(c, o, t + 0.12, 2637, 0.22, 0.7);
    },

    // Bourdonnement qui tremble ("immobile ?")
    tremble(c, o, t, opt) {
      const duree = opt.duree || 0.6;
      const f = filtre(c, 'lowpass', 500);
      const g = enveloppe(c, o, t, 0.3, 0.02, duree);
      f.connect(g);
      const s = oscillateur(c, 'sawtooth', 70, t, duree);
      const lfo = oscillateur(c, 'square', 18, t, duree);
      const prof = c.createGain(); prof.gain.value = 12;
      lfo.connect(prof); prof.connect(s.frequency);
      s.connect(f);
    },

    // Montée de tension avant la fin
    montee(c, o, t, opt) {
      const duree = opt.duree || 1.2;
      const f = filtre(c, 'bandpass', 400, 2);
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(6000, t + duree);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.35, t + duree);
      g.gain.exponentialRampToValueAtTime(0.0001, t + duree + 0.05);
      g.connect(o); f.connect(g);
      sourceBruit(c, t, duree).connect(f);
    },

    // Petit accord joyeux (logo final)
    succes(c, o, t) {
      [523.25, 659.25, 783.99, 1046.5].forEach((fr, i) => note(c, o, t + i * 0.07, fr, 0.2, 1.4));
    },

    /* Musique de fond légère, 120 BPM : nappe d'accords, basse, rythme.
       opt.duree = longueur, opt.drop = moment où la batterie démarre. */
    musique(c, o, t, opt) {
      const duree = opt.duree || 20, drop = opt.drop || 0, temps = 0.5;
      const m = c.createGain();
      m.gain.setValueAtTime(0.0001, t);
      m.gain.exponentialRampToValueAtTime(VOLUME_MUSIQUE, t + 0.4);
      m.gain.setValueAtTime(VOLUME_MUSIQUE, t + duree - 1.5);
      m.gain.exponentialRampToValueAtTime(0.0001, t + duree);
      m.connect(o);

      // La → Fa → Do → Sol (une mesure de 4 temps chacun)
      const accords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]];
      const basses = [55, 43.65, 65.41, 49];
      const mesure = temps * 4;

      for (let b = 0; b * mesure < duree; b++) {
        const tm = t + b * mesure, i = b % 4;
        // Nappe : deux scies légèrement désaccordées, très filtrées
        const fp = filtre(c, 'lowpass', 1100);
        const gp = c.createGain();
        gp.gain.setValueAtTime(0.0001, tm);
        gp.gain.exponentialRampToValueAtTime(0.05, tm + 0.3);
        gp.gain.setValueAtTime(0.05, tm + mesure - 0.25);
        gp.gain.exponentialRampToValueAtTime(0.0001, tm + mesure);
        fp.connect(gp); gp.connect(m);
        accords[i].forEach((fr) => {
          [-6, 6].forEach((d) => {
            const s = oscillateur(c, 'sawtooth', fr, tm, mesure);
            s.detune.value = d;
            s.connect(fp);
          });
        });
        // Petit arpège en croches par-dessus
        for (let k = 0; k < 8; k++) {
          note(c, m, tm + k * temps / 2, accords[i][k % 3] * 2, 0.045, 0.3);
        }
      }

      for (let k = 0; k * temps < duree - 0.5; k++) {
        const tb = t + k * temps;
        const avecBatterie = k * temps >= drop;
        // Charleston sur les contretemps (dès le début, très léger)
        const fh = filtre(c, 'highpass', 8000);
        fh.connect(enveloppe(c, m, tb + temps / 2, avecBatterie ? 0.14 : 0.07, 0.002, 0.05));
        sourceBruit(c, tb + temps / 2, 0.06).connect(fh);
        if (!avecBatterie) continue;
        // Grosse caisse sur chaque temps
        const gk = oscillateur(c, 'sine', 120, tb, 0.25);
        gk.frequency.exponentialRampToValueAtTime(45, tb + 0.12);
        gk.connect(enveloppe(c, m, tb, 0.7, 0.003, 0.25));
        // Claquement sur les temps 2 et 4
        if (k % 2 === 1) {
          const fc = filtre(c, 'bandpass', 1500, 0.9);
          fc.connect(enveloppe(c, m, tb, 0.3, 0.002, 0.14));
          sourceBruit(c, tb, 0.15).connect(fc);
        }
        // Basse
        const fb = filtre(c, 'lowpass', 280);
        fb.connect(enveloppe(c, m, tb, 0.35, 0.01, 0.4));
        oscillateur(c, 'sawtooth', basses[Math.floor(k / 4) % 4] * (k % 2 ? 2 : 1), tb, 0.4).connect(fb);
      }
    }
  };

  /* ---------- lecture ---------- */

  // Chaîne de sortie : volume général + compresseur (pour que tout se tienne)
  function chaine(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -22; comp.ratio.value = 4;
    const g = c.createGain(); g.gain.value = VOLUME;
    const gonfle = c.createGain(); gonfle.gain.value = 2.0;      // remonte le tout après compression
    const limiteur = c.createDynamicsCompressor();              // empêche de saturer
    limiteur.threshold.value = -4; limiteur.ratio.value = 20;
    limiteur.attack.value = 0.002; limiteur.release.value = 0.1;
    g.connect(comp); comp.connect(gonfle); gonfle.connect(limiteur); limiteur.connect(c.destination);
    return g;
  }

  function planifier(c, o, liste, t0) {
    liste.forEach((e) => {
      if (EFFETS[e.nom]) EFFETS[e.nom](c, o, t0 + e.t, e.opt || {});
      else console.warn('Son inconnu :', e.nom);
    });
  }

  // Encode un AudioBuffer en fichier .wav (16 bits)
  function enWav(buffer) {
    const canaux = buffer.numberOfChannels, n = buffer.length, taux = buffer.sampleRate;
    const vue = new DataView(new ArrayBuffer(44 + n * canaux * 2));
    const ecrire = (pos, txt) => { for (let i = 0; i < txt.length; i++) vue.setUint8(pos + i, txt.charCodeAt(i)); };
    ecrire(0, 'RIFF'); vue.setUint32(4, 36 + n * canaux * 2, true); ecrire(8, 'WAVE');
    ecrire(12, 'fmt '); vue.setUint32(16, 16, true); vue.setUint16(20, 1, true);
    vue.setUint16(22, canaux, true); vue.setUint32(24, taux, true);
    vue.setUint32(28, taux * canaux * 2, true); vue.setUint16(32, canaux * 2, true); vue.setUint16(34, 16, true);
    ecrire(36, 'data'); vue.setUint32(40, n * canaux * 2, true);
    const donnees = [];
    for (let k = 0; k < canaux; k++) donnees.push(buffer.getChannelData(k));
    let pos = 44;
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < canaux; k++) {
        const v = Math.max(-1, Math.min(1, donnees[k][i]));
        vue.setInt16(pos, v < 0 ? v * 0x8000 : v * 0x7fff, true);
        pos += 2;
      }
    }
    return new Blob([vue], { type: 'audio/wav' });
  }

  window.Son = {
    actif: true,

    // Joue la liste de sons ; "decalage" = secondes d'attente (mode propre)
    jouer(liste, decalage) {
      this.arreter();
      if (!this.actif || !liste.length) return;
      // Le navigateur n'autorise le son qu'après un clic ou une touche
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
      if (!ctx) { ctx = new AudioContext(); sortie = chaine(ctx); }
      ctx.resume();
      bus = ctx.createGain();
      bus.connect(sortie);
      planifier(ctx, bus, liste, ctx.currentTime + (decalage || 0) + 0.03);
    },

    // Coupe tout ce qui est prévu (on débranche simplement l'ancien bus)
    arreter() {
      if (bus) { bus.disconnect(); bus = null; }
    },

    // Fabrique la bande-son complète en .wav (pour CapCut, Premiere...)
    async exporter(liste, duree, nomFichier) {
      const taux = 44100;
      const c = new OfflineAudioContext(2, Math.ceil(taux * duree), taux);
      planifier(c, chaine(c), liste, 0);
      const rendu = await c.startRendering();
      const lien = document.createElement('a');
      lien.href = URL.createObjectURL(enWav(rendu));
      lien.download = nomFichier || 'bande-son.wav';
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      setTimeout(() => URL.revokeObjectURL(lien.href), 5000);
    }
  };
})();
