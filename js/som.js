// =====================================================================
//  PREFEITO 8-BIT — música e efeitos sonoros (Web Audio, sem arquivos)
//  Música: baião 8-bit em loop (melodia em onda quadrada, baixo em onda
//  triangular, zabumba/triângulo com ruído). Efeitos: blips curtos.
//  O navegador só libera áudio depois de um clique: Som.iniciar() é
//  chamado no primeiro clique da tela inicial.
// =====================================================================

const Som = (() => {
  let ctx = null, master = null, busMusica = null, busSfx = null, ruido = null;
  const pref = { musica: true, sfx: true, volMusica: 0.5, volSfx: 0.7 };
  try { Object.assign(pref, JSON.parse(localStorage.getItem('prefeito8bit_som') || '{}')); } catch (e) {}
  const salvarPref = () => { try { localStorage.setItem('prefeito8bit_som', JSON.stringify(pref)); } catch (e) {} };

  function iniciar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    busMusica = ctx.createGain(); busMusica.gain.value = pref.musica ? 0.16 * pref.volMusica * 2 : 0; busMusica.connect(master);
    busSfx = ctx.createGain(); busSfx.gain.value = pref.sfx ? 0.35 * pref.volSfx : 0; busSfx.connect(master);
    // buffer de ruído branco para percussão e efeitos
    ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    proximoPasso = ctx.currentTime + 0.1;
    setInterval(agendar, 25);
  }

  // ------------------------------------------------------------- notas
  const NOMES = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) { const m = /^([A-G]#?)(\d)$/.exec(n); const midi = (+m[2] + 1) * 12 + NOMES[m[1]]; return 440 * Math.pow(2, (midi - 69) / 12); }

  function tom(t, f, dur, { tipo = 'square', vol = 0.3, bus = busMusica, deslize = 0, ataque = 0.005 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo; o.frequency.setValueAtTime(f, t);
    if (deslize) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * deslize), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + ataque);
    g.gain.setValueAtTime(vol, t + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.02);
  }
  function batida(t, dur, { vol = 0.2, filtro = 6000, tipoFiltro = 'highpass', bus = busMusica } = {}) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = ruido; f.type = tipoFiltro; f.frequency.value = filtro;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + 0.02);
  }
  function zabumba(t, vol = 0.5) { tom(t, 120, 0.18, { tipo: 'sine', vol, deslize: 0.4 }); }

  // ------------------------------------------------------------ música
  // melodia: [nota, duração em semicolcheias] · cada compasso = 16
  const A1 = [['E5', 2], ['G5', 2], ['C6', 4], ['B5', 2], ['G5', 2], ['E5', 4],
              ['A5', 4], ['G5', 2], ['E5', 2], ['C5', 4], ['D5', 2], ['E5', 2],
              ['F5', 2], ['A5', 2], ['C6', 4], ['A5', 2], ['F5', 2], ['A5', 2], ['G5', 2],
              ['G5', 6], ['F5', 2], ['E5', 2], ['D5', 2], ['B4', 4]];
  const A2 = A1.slice(0, 19).concat([['G5', 4], ['A5', 2], ['B5', 2], ['C6', 8]]);
  const B1 = [['A5', 4], ['A5', 2], ['G5', 2], ['F5', 4], ['C5', 4],
              ['B4', 2], ['D5', 2], ['G5', 4], ['F5', 2], ['E5', 2], ['D5', 4],
              ['E5', 4], ['G5', 2], ['B5', 2], ['A5', 4], ['G5', 4],
              ['A5', 6], ['G5', 2], ['E5', 4], ['D5', 4]];
  const MELODIA = [...A1, ...A2, ...B1, ...A2];
  // acordes (raiz do baixo) por compasso
  const BAIXO = ['C3', 'A2', 'F2', 'G2', 'C3', 'A2', 'F2', 'G2', 'F2', 'G2', 'E2', 'A2', 'C3', 'A2', 'F2', 'C3'];
  const QUINTA = { C3: 'G2', A2: 'E2', F2: 'C3', G2: 'D3', E2: 'B2' };
  // linha do baixo em ritmo de baião: [passo, qual nota, duração]
  const BAIAO = [[0, 'r', 3], [3, 'q', 3], [6, 'r8', 2], [8, 'r', 3], [11, 'q', 3], [14, 'r8', 2]];

  // converte a melodia numa tabela passo → nota
  const PASSOS = 16 * BAIXO.length;
  const melodiaPasso = new Array(PASSOS).fill(null);
  { let p = 0; for (const [n, d] of MELODIA) { melodiaPasso[p] = [n, d]; p += d; } }

  const BPM = 104, SEMI = 60 / BPM / 4;
  let passo = 0, proximoPasso = 0;

  function oitava(n, k) { const m = /^([A-G]#?)(\d)$/.exec(n); return m[1] + (+m[2] + k); }
  function tocarPasso(p, t) {
    const comp = Math.floor(p / 16), dentro = p % 16;
    const raiz = BAIXO[comp];
    // melodia
    const m = melodiaPasso[p];
    if (m) tom(t, freq(m[0]), m[1] * SEMI * 0.92, { tipo: 'square', vol: 0.11 });
    // eco suave da melodia uma oitava abaixo (parece sanfona)
    if (m && dentro % 4 === 0) tom(t, freq(oitava(m[0], -1)), m[1] * SEMI * 0.8, { tipo: 'triangle', vol: 0.06 });
    // baixo
    for (const [ps, qual, d] of BAIAO) if (ps === dentro) {
      const n = qual === 'r' ? raiz : qual === 'q' ? QUINTA[raiz] : oitava(raiz, 1);
      tom(t, freq(n), d * SEMI * 0.9, { tipo: 'triangle', vol: 0.28 });
    }
    // percussão: zabumba, triângulo e chocalho
    if (dentro === 0 || dentro === 3 || dentro === 8 || dentro === 11) zabumba(t, dentro % 8 === 0 ? 0.45 : 0.3);
    if (dentro % 2 === 0) batida(t, 0.04, { vol: dentro % 4 === 2 ? 0.07 : 0.035, filtro: 8000 });
    if (dentro === 4 || dentro === 12) batida(t, 0.09, { vol: 0.08, filtro: 1800, tipoFiltro: 'bandpass' });
    if (dentro % 4 === 1 || dentro % 4 === 3) tom(t, 2637, 0.05, { tipo: 'sine', vol: 0.02 }); // triângulo
  }
  function agendar() {
    if (!ctx) return;
    while (proximoPasso < ctx.currentTime + 0.12) {
      if (pref.musica) tocarPasso(passo, proximoPasso);
      passo = (passo + 1) % PASSOS;
      proximoPasso += SEMI;
    }
  }

  // ----------------------------------------------------------- efeitos
  const EFEITOS = {
    clique:   t => tom(t, 1200, 0.04, { vol: 0.15, bus: busSfx }),
    abrir:    t => { tom(t, 660, 0.05, { vol: 0.12, bus: busSfx }); tom(t + 0.05, 990, 0.06, { vol: 0.12, bus: busSfx }); },
    moeda:    t => { tom(t, freq('B5'), 0.07, { vol: 0.2, bus: busSfx }); tom(t + 0.07, freq('E6'), 0.25, { vol: 0.2, bus: busSfx }); },
    gasto:    t => { tom(t, freq('E5'), 0.07, { vol: 0.16, bus: busSfx }); tom(t + 0.07, freq('A4'), 0.18, { vol: 0.16, bus: busSfx }); },
    obra:     t => { for (let i = 0; i < 3; i++) { batida(t + i * 0.13, 0.08, { vol: 0.35, filtro: 900, tipoFiltro: 'bandpass', bus: busSfx }); tom(t + i * 0.13, 180, 0.06, { tipo: 'square', vol: 0.1, bus: busSfx }); } },
    aprovado: t => ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tom(t + i * 0.09, freq(n), 0.18, { vol: 0.18, bus: busSfx })),
    rejeitado:t => { tom(t, 330, 0.18, { vol: 0.18, bus: busSfx, deslize: 0.7 }); tom(t + 0.18, 220, 0.35, { vol: 0.18, bus: busSfx, deslize: 0.6 }); },
    aviso:    t => { tom(t, freq('A5'), 0.1, { tipo: 'sine', vol: 0.25, bus: busSfx }); tom(t + 0.12, freq('E6'), 0.3, { tipo: 'sine', vol: 0.25, bus: busSfx }); },
    jornal:   t => { batida(t, 0.25, { vol: 0.2, filtro: 2500, tipoFiltro: 'bandpass', bus: busSfx }); batida(t + 0.12, 0.2, { vol: 0.15, filtro: 3500, tipoFiltro: 'bandpass', bus: busSfx }); },
    fanfarra: t => { ['G4', 'C5', 'E5', 'G5', 'E5', 'G5', 'C6'].forEach((n, i) => tom(t + i * 0.1, freq(n), i === 6 ? 0.5 : 0.12, { vol: 0.2, bus: busSfx })); batida(t + 0.7, 0.6, { vol: 0.15, filtro: 5000, bus: busSfx }); },
    vitoria:  t => { ['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'].forEach((n, i) => tom(t + i * 0.13, freq(n), i === 6 ? 0.8 : 0.15, { vol: 0.22, bus: busSfx })); },
    derrota:  t => { ['E5', 'D#5', 'D5', 'C#5'].forEach((n, i) => tom(t + i * 0.28, freq(n), 0.3, { vol: 0.2, bus: busSfx, deslize: i === 3 ? 0.5 : 0 })); },
    balao:    t => tom(t, 1500, 0.06, { tipo: 'sine', vol: 0.08, bus: busSfx, deslize: 1.6 }),
  };
  function sfx(nome) {
    if (!ctx || !pref.sfx || !EFEITOS[nome]) return;
    EFEITOS[nome](ctx.currentTime + 0.01);
  }

  // ------------------------------------------------------------ ajustes
  function aplicarVolumes() {
    if (!ctx) return;
    busMusica.gain.setTargetAtTime(pref.musica ? 0.16 * pref.volMusica * 2 : 0, ctx.currentTime, 0.1);
    busSfx.gain.setTargetAtTime(pref.sfx ? 0.35 * pref.volSfx : 0, ctx.currentTime, 0.05);
  }
  function alternarMusica() { pref.musica = !pref.musica; aplicarVolumes(); salvarPref(); return pref.musica; }
  function alternarSfx() { pref.sfx = !pref.sfx; aplicarVolumes(); salvarPref(); return pref.sfx; }

  return { iniciar, sfx, alternarMusica, alternarSfx, get pref() { return pref; } };
})();
