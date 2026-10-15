// =====================================================================
//  PREFEITO — pixel art desenhada por código (v2: 32px, visão 3/4)
//  Estilo "deitado" tipo Stardew Valley: fachadas altas e visíveis,
//  telhados vistos de frente, contorno escuro, sombras para baixo/direita.
//  Cada função devolve ou desenha num <canvas>; dá para trocar por
//  sprites feitos à mão sem mexer no resto do jogo.
// =====================================================================

const Art = (() => {
  const P = {
    grama: '#72ad3f', grama2: '#649d36', grama3: '#84bf4c', grama4: '#93cc59', gramaEsc: '#4d852b',
    asfalto: '#57555f', asfalto2: '#4e4c56', asfalto3: '#625f6a', faixa: '#f0c84a',
    calcada: '#c9c0b0', calcada2: '#b8ae9d', meioFio: '#8e8577',
    agua: '#3f86d4', agua2: '#559be3', agua3: '#3270b8', espuma: '#bfe3ff',
    terra: '#b88a54', terra2: '#9e7343', terra3: '#cfa06a',
    contorno: '#33241c', sombra: 'rgba(28,36,18,.32)',
    branco: '#f6f2e6', creme: '#efe4c8',
    vidro: '#8fd3ea', vidro2: '#5aa6c8', vidro3: '#cdeffa',
    madeira: '#8a5a32', madeira2: '#6e4526', madeira3: '#a8743f',
  };
  // [claro, médio, escuro]
  const TELHADOS = [
    ['#d9614a', '#bf4b38', '#9b3a2c'], ['#e07a44', '#c66334', '#a14e28'], ['#5b84c9', '#456db0', '#355690'],
    ['#5ea56b', '#478c55', '#367043'], ['#8d8a9c', '#74717f', '#5c5966'], ['#b2689f', '#985387', '#7a406c'],
  ];
  const PAREDES = [
    ['#f3e6c4', '#d9c9a2'], ['#f0d677', '#d4b85a'], ['#a9d6ea', '#88b9d0'], ['#f4b9a7', '#d99a88'],
    ['#cfe6a3', '#b0c985'], ['#f2f0ea', '#d6d2c8'], ['#f3c98f', '#d8ab72'], ['#d6c2ec', '#b9a3d2'],
  ];

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
  function r(g, x, y, w, h, cor) { if (w <= 0 || h <= 0) return; g.fillStyle = cor; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function borda(g, x, y, w, h, cor) { r(g, x, y, w, 1, cor); r(g, x, y + h - 1, w, 1, cor); r(g, x, y, 1, h, cor); r(g, x + w - 1, y, 1, h, cor); }
  function caixa(g, x, y, w, h, cor, cont) { r(g, x, y, w, h, cor); borda(g, x, y, w, h, cont || P.contorno); }
  function sombra(g, x, y, w, h) { if (coletor) coletor.push({ x, y, w, h }); else r(g, x, y, w, h, P.sombra); }

  // --------------------------------------------------------- elementos
  function janela(g, x, y, w, h, opt = {}) {
    const moldura = opt.moldura || P.branco;
    caixa(g, x - 1, y - 1, w + 2, h + 2, moldura);
    r(g, x, y, w, h, P.vidro2);
    r(g, x, y, w, Math.ceil(h / 2), P.vidro);
    r(g, x + 1, y + 1, 2, 2, P.vidro3);
    if (opt.cruz !== false) { r(g, x + Math.floor(w / 2), y, 1, h, moldura); if (h > 7) r(g, x, y + Math.floor(h / 2), w, 1, moldura); }
    if (opt.persiana) { r(g, x - 4, y - 1, 3, h + 2, opt.persiana); r(g, x + w + 1, y - 1, 3, h + 2, opt.persiana); }
    if (opt.floreira) {
      r(g, x - 1, y + h + 1, w + 2, 3, P.madeira);
      for (let i = 0; i < w; i += 3) r(g, x + i, y + h - 1, 2, 2, ['#e8506a', '#f2d33a', '#f08ac0'][i % 3]);
    } else r(g, x - 2, y + h + 1, w + 4, 2, 'rgba(0,0,0,.18)');
  }
  function porta(g, x, y, w, h, cor = P.madeira) {
    caixa(g, x - 1, y - 1, w + 2, h + 1, P.branco);
    r(g, x, y, w, h, cor);
    r(g, x + 2, y + 2, w - 4, Math.floor(h / 2) - 3, 'rgba(255,255,255,.12)');
    r(g, x + 2, y + Math.floor(h / 2) + 1, w - 4, Math.floor(h / 2) - 3, 'rgba(0,0,0,.12)');
    r(g, x + w - 3, y + Math.floor(h / 2), 1, 2, '#f2d33a');
  }
  // telhado visto de frente (trapézio com telhas)
  function telhadoFrente(g, x, y, w, h, c, chamine) {
    for (let i = 0; i < h; i++) {
      const inset = Math.round((h - 1 - i) * 0.45);
      r(g, x + inset, y + i, w - inset * 2, 1, i % 4 === 3 ? c[2] : (i < 3 ? c[0] : c[1]));
      // telhas: marcas verticais alternadas
      if (i % 4 !== 3) for (let k = x + inset + ((i >> 2) % 2 ? 2 : 4); k < x + w - inset - 1; k += 5) r(g, k, y + i, 1, 1, c[2]);
    }
    // contorno
    for (let i = 0; i < h; i++) { const inset = Math.round((h - 1 - i) * 0.45); r(g, x + inset - 1, y + i, 1, 1, P.contorno); r(g, x + w - inset, y + i, 1, 1, P.contorno); }
    r(g, x + Math.round((h - 1) * .45), y - 1, w - Math.round((h - 1) * .45) * 2, 1, P.contorno);
    r(g, x - 1, y + h, w + 2, 2, P.contorno);
    r(g, x, y + h, w, 1, c[2]);
    if (chamine) { const cx = x + Math.floor(w * .72); caixa(g, cx, y - 6, 6, 9, '#b0563f'); r(g, cx, y - 7, 6, 2, '#7a3a2a'); }
  }
  // telhado de duas águas com oitão (triângulo de frente)
  function telhadoOitao(g, x, y, w, h, c, parede) {
    const meio = x + w / 2;
    for (let i = 0; i < h; i++) {
      const half = Math.round((i + 1) / h * (w / 2 + 2));
      r(g, meio - half, y + i, half * 2, 1, i % 3 === 2 ? c[2] : c[1]);
      // oitão (parede triangular)
      const hp = Math.round((i + 1) / h * (w / 2 - 6));
      if (i > 4) r(g, meio - hp, y + i, hp * 2, 1, parede[0]);
      r(g, meio - half - 1, y + i, 1, 1, P.contorno); r(g, meio + half, y + i, 1, 1, P.contorno);
    }
    r(g, meio - 1, y - 1, 2, 2, P.contorno);
    r(g, x - 3, y + h, w + 6, 2, P.contorno);
    // janelinha redonda no oitão
    if (h > 14) { r(g, meio - 2, y + h - 9, 4, 4, P.vidro2); borda(g, meio - 3, y + h - 10, 6, 6, P.branco); }
  }
  function parede(g, x, y, w, h, cor) {
    caixa(g, x, y, w, h, cor[0]);
    r(g, x + 1, y + 1, w - 2, 3, cor[1]);           // sombra do beiral
    r(g, x + 1, y + h - 4, w - 2, 3, cor[1]);       // rodapé
    r(g, x + w - 4, y + 1, 3, h - 2, 'rgba(0,0,0,.07)');
  }
  function arbusto(g, x, y, w, h, cores = ['#3f8a35', '#4f9e3f', '#6fbd52']) {
    r(g, x + 1, y + 2, w - 2, h - 2, cores[0]); r(g, x, y + 3, w, h - 4, cores[0]);
    r(g, x + 2, y + 1, w - 4, h - 4, cores[1]); r(g, x + 3, y + 2, Math.max(2, w / 3), 2, cores[2]);
    r(g, x + 1, y + h - 1, w - 2, 1, P.contorno);
  }
  function flores(g, x, y, rand, n = 4) {
    for (let i = 0; i < n; i++) { const fx = x + Math.floor(rand() * 12), fy = y + Math.floor(rand() * 5); r(g, fx, fy, 2, 2, pick(rand, ['#f25c78', '#f2d33a', '#ffffff', '#b07ae8', '#f08a3c'])); }
  }
  function poste(g, x, y) {
    r(g, x + 2, y + 26, 5, 2, P.sombra);
    r(g, x + 3, y + 4, 2, 23, '#3f4048'); r(g, x + 1, y + 26, 6, 2, '#3f4048');
    r(g, x, y, 8, 4, '#3f4048'); r(g, x + 1, y + 3, 6, 2, '#ffe9a0');
  }
  function cerca(g, x, y, w, cor = '#f2ebdb') {
    r(g, x, y + 3, w, 2, cor); r(g, x, y + 8, w, 2, cor);
    for (let i = 0; i < w; i += 6) { r(g, x + i, y, 3, 12, cor); r(g, x + i, y + 11, 3, 1, 'rgba(0,0,0,.25)'); }
  }

  // ------------------------------------------------------------- árvores
  // desenha com a base em (x, y+32); a copa sobe meio tile
  function arvore(g, x, y, rand, tipo) {
    tipo = tipo || pick(rand, ['redonda', 'redonda', 'redonda', 'ipe', 'pinheiro']);
    sombra(g, x + 8, y + 27, 20, 5);
    if (tipo === 'coqueiro') {
      for (let i = 0; i < 26; i++) r(g, x + 14 + Math.round(Math.sin(i / 6) * 2), y + 30 - i, 4, 1, i % 3 ? '#9a7246' : '#7a5634');
      const f = ['#3f9b45', '#2f7d37'];
      for (let k = 0; k < 5; k++) { const ang = -2.8 + k * 0.7; for (let i = 0; i < 12; i++) r(g, x + 16 + Math.cos(ang) * i, y + 4 + Math.sin(ang) * i * 0.6 + i * 0.35, 3, 2, f[i % 2]); }
      r(g, x + 14, y + 4, 5, 4, '#8a6a2a');
      return;
    }
    if (tipo === 'pinheiro') {
      r(g, x + 14, y + 22, 4, 9, P.madeira2);
      const c = ['#2e6e3a', '#3b8547', '#52a45a'];
      for (let i = 0; i < 26; i++) {
        const half = Math.round(2 + (i % 9) * 1.1 + i * 0.25);
        r(g, x + 16 - half, y - 4 + i, half * 2, 1, i % 9 < 3 ? c[2] : i % 9 < 6 ? c[1] : c[0]);
      }
      r(g, x + 15, y - 6, 2, 2, c[1]);
      return;
    }
    // redonda / ipê
    const ipe = tipo === 'ipe';
    const c = ipe ? pick(rand, [['#c99a1c', '#f2c53a', '#ffe27a'], ['#b8467a', '#e46aa2', '#f7a8cc']]) : pick(rand, [['#2f7a34', '#3e9445', '#62b85a'], ['#3a7f2c', '#4f9a35', '#7cc452']]);
    r(g, x + 13, y + 18, 6, 13, P.madeira2); r(g, x + 14, y + 18, 2, 13, P.madeira3);
    r(g, x + 10, y + 29, 12, 2, P.madeira2);
    // copa em camadas (contorno + 3 tons)
    const blobs = [[16, 8, 13], [9, 12, 8], [23, 12, 8], [16, 2, 9], [12, 16, 7], [21, 16, 7]];
    for (const [bx, by, rr] of blobs) for (let yy = -rr; yy <= rr; yy++) { const ww = Math.round(Math.sqrt(rr * rr - yy * yy)); r(g, x + bx - ww - 1, y + by + yy - 8, ww * 2 + 2, 1, P.contorno); }
    for (const [bx, by, rr] of blobs) for (let yy = -rr + 1; yy < rr; yy++) { const ww = Math.round(Math.sqrt(rr * rr - yy * yy)) - 1; r(g, x + bx - ww, y + by + yy - 8, ww * 2, 1, yy > rr / 3 ? c[0] : c[1]); }
    r(g, x + 9, y - 6, 6, 3, c[2]); r(g, x + 17, y - 9, 5, 3, c[2]); r(g, x + 6, y + 2, 4, 2, c[2]);
    for (let i = 0; i < 6; i++) r(g, x + 6 + Math.floor(rand() * 20), y - 6 + Math.floor(rand() * 18), 2, 2, ipe ? c[2] : c[0]);
  }

  // ------------------------------------------------------------- casas
  // casa térrea, 2x2 tiles (64x64)
  function casa(g, ox, oy, rand) {
    const tc = pick(rand, TELHADOS), pc = pick(rand, PAREDES);
    const w = 48 + Math.floor(rand() * 3) * 4, x = ox + Math.floor((64 - w) / 2);
    const oitao = rand() < 0.45;
    sombra(g, x + 4, oy + 56, w, 6);
    // quintal/grama da frente
    const yWall = oy + 30, hWall = 26;
    parede(g, x, yWall, w, hWall, pc);
    if (oitao) telhadoOitao(g, x - 2, oy + 6, w + 4, 24, tc, pc); else telhadoFrente(g, x - 3, oy + 8, w + 6, 22, tc, rand() < 0.5);
    const pd = x + 6 + Math.floor(rand() * (w - 22));
    porta(g, pd, yWall + 8, 9, 17, pick(rand, [P.madeira, '#3d6b8f', '#7a3a3a', '#4e7a45']));
    r(g, pd - 2, yWall + hWall - 1, 13, 2, '#b3aa9a'); // degrau
    const pers = rand() < 0.4 ? pick(rand, ['#3d6b8f', '#4e7a45', '#9b3a2c']) : null;
    const flor = rand() < 0.35;
    if (pd - x > 18) janela(g, x + 6, yWall + 8, 9, 8, { persiana: pers, floreira: flor });
    if (x + w - (pd + 9) > 18) janela(g, x + w - 16, yWall + 8, 9, 8, { persiana: pers, floreira: flor });
    // muro baixo e portão (bem brasileiro)
    if (rand() < 0.55) {
      const mc = pick(rand, ['#e8e0cc', '#d9cbb0', '#f2e6c8']);
      r(g, ox + 2, oy + 59, 60, 4, mc); r(g, ox + 2, oy + 62, 60, 1, 'rgba(0,0,0,.25)');
      r(g, pd - 1, oy + 59, 11, 4, '#4a4a52'); for (let i = 0; i < 11; i += 2) r(g, pd - 1 + i, oy + 59, 1, 4, '#76767f');
    } else flores(g, x + w - 14, oy + 58, rand, 3);
  }

  // sobrado comercial com platibanda (Centro), 2x2 tiles
  function sobrado(g, ox, oy, rand) {
    const pc = pick(rand, PAREDES);
    const x = ox + 3, w = 58;
    sombra(g, x + 4, oy + 58, w, 5);
    // fachada alta de 2 andares
    caixa(g, x, oy + 6, w, 52, pc[0]);
    // platibanda com cornija
    r(g, x - 1, oy + 4, w + 2, 6, pc[1]); borda(g, x - 1, oy + 3, w + 2, 8, P.contorno); r(g, x, oy + 10, w, 1, 'rgba(0,0,0,.25)');
    if (rand() < 0.5) { r(g, x + w / 2 - 8, oy + 1, 16, 4, pc[1]); borda(g, x + w / 2 - 9, oy, 18, 5, P.contorno); }
    // 1º andar: janelas com sacadinha
    for (const jx of [x + 6, x + 25, x + 44]) {
      janela(g, jx, oy + 15, 8, 10, { cruz: true });
      if (rand() < 0.5) { r(g, jx - 2, oy + 25, 12, 1, '#3f4048'); for (let k = 0; k < 12; k += 3) r(g, jx - 2 + k, oy + 22, 1, 4, '#3f4048'); }
    }
    r(g, x + 1, oy + 30, w - 2, 2, pc[1]);
    // térreo: loja
    const loja = rand() < 0.75;
    if (loja) {
      const toldo = pick(rand, ['#d64b4b', '#3d8bd1', '#e0a82e', '#3fa45b', '#9b5bc9']);
      for (let i = 0; i < w - 2; i += 6) { r(g, x + 1 + i, oy + 33, 3, 6, toldo); r(g, x + 4 + i, oy + 33, 3, 6, '#f6f2e6'); }
      for (let i = 0; i < w - 2; i += 3) r(g, x + 1 + i, oy + 39, 2, 1, toldo);
      r(g, x, oy + 32, w, 1, P.contorno);
      r(g, x + 3, oy + 41, w - 6, 16, '#5b4636');
      r(g, x + 5, oy + 43, 20, 13, P.vidro2); r(g, x + 5, oy + 43, 20, 6, P.vidro); r(g, x + 6, oy + 44, 3, 3, P.vidro3);
      r(g, x + 33, oy + 43, 20, 13, P.vidro2); r(g, x + 33, oy + 43, 20, 6, P.vidro); r(g, x + 34, oy + 44, 3, 3, P.vidro3);
      r(g, x + 27, oy + 43, 4, 14, '#3d2c22');
      // mercadorias na vitrine
      for (let i = 0; i < 5; i++) r(g, x + 7 + i * 4, oy + 52, 2, 3, pick(rand, ['#e8506a', '#f2d33a', '#5aa9ef', '#62b85a']));
      if (rand() < 0.4) { r(g, x + 2, oy + 57, 6, 4, '#a8743f'); r(g, x + 3, oy + 55, 4, 2, '#e8506a'); } // caixote de frutas
    } else {
      janela(g, x + 6, oy + 38, 9, 9, { persiana: pick(rand, ['#3d6b8f', '#4e7a45']) });
      porta(g, x + 25, oy + 38, 9, 19, P.madeira2);
      janela(g, x + 43, oy + 38, 9, 9, { persiana: pick(rand, ['#3d6b8f', '#4e7a45']) });
    }
  }

  // casarão com piscina (Jardim Nobre), 3x3 tiles (96x96)
  // lojinha térrea com toldo e letreiro (comércio que abre sozinho), 2x2 tiles
  function loja(g, ox, oy, rand, corLetreiro) {
    const pc = pick(rand, PAREDES);
    const x = ox + 4, w = 56;
    sombra(g, x + 4, oy + 58, w, 5);
    caixa(g, x, oy + 22, w, 36, pc[0]);
    r(g, x - 1, oy + 18, w + 2, 7, pc[1]); borda(g, x - 1, oy + 17, w + 2, 9, P.contorno);
    // letreiro
    const cl = corLetreiro || pick(rand, ['#d64b4b', '#3d8bd1', '#e0a82e', '#3fa45b', '#9b5bc9']);
    caixa(g, x + 10, oy + 8, w - 20, 11, cl);
    r(g, x + 12, oy + 9, w - 24, 2, 'rgba(255,255,255,.35)');
    for (let i = 0; i < 6; i++) r(g, x + 15 + i * 5, oy + 13, 3, 2, '#fff6e0');
    r(g, x + 14, oy + 19, 2, 3, '#3f4048'); r(g, x + w - 16, oy + 19, 2, 3, '#3f4048');
    // toldo listrado
    const toldo = pick(rand, ['#d64b4b', '#3d8bd1', '#e0a82e', '#3fa45b']);
    for (let i = 0; i < w - 2; i += 6) { r(g, x + 1 + i, oy + 27, 3, 7, toldo); r(g, x + 4 + i, oy + 27, 3, 7, '#f6f2e6'); }
    for (let i = 0; i < w - 2; i += 3) r(g, x + 1 + i, oy + 34, 2, 1, toldo);
    r(g, x, oy + 26, w, 1, P.contorno);
    // vitrine e porta de enrolar aberta
    r(g, x + 4, oy + 38, 22, 18, P.vidro2); r(g, x + 4, oy + 38, 22, 7, P.vidro); r(g, x + 5, oy + 39, 3, 3, P.vidro3);
    borda(g, x + 3, oy + 37, 24, 20, '#3d2c22');
    for (let i = 0; i < 5; i++) r(g, x + 6 + i * 4, oy + 51, 2, 4, pick(rand, ['#e8506a', '#f2d33a', '#5aa9ef', '#62b85a', '#f6f2e6']));
    r(g, x + 31, oy + 37, 21, 21, '#3d2c22'); r(g, x + 32, oy + 38, 19, 4, '#9a9aa6');
    for (let k = 0; k < 4; k++) r(g, x + 32, oy + 38 + k, 19, 1, k % 2 ? '#7d7d88' : '#b5b5c0');
    r(g, x + 32, oy + 42, 19, 16, '#5b4636');
    // calçada e vasinho
    r(g, ox + 2, oy + 58, 60, 4, '#cfc6b5'); r(g, ox + 2, oy + 61, 60, 1, 'rgba(0,0,0,.25)');
    if (rand() < 0.5) { r(g, x + w - 4, oy + 52, 5, 6, '#a8743f'); arbusto(g, x + w - 6, oy + 46, 9, 7); }
  }
  function mansao(g, ox, oy, rand) {
    const tc = pick(rand, TELHADOS.slice(0, 4));
    const pc = pick(rand, [PAREDES[0], PAREDES[5], PAREDES[6]]);
    r(g, ox + 2, oy + 2, 92, 92, P.grama3);
    for (let i = 0; i < 30; i++) r(g, ox + 4 + Math.floor(rand() * 88), oy + 4 + Math.floor(rand() * 88), 2, 1, P.grama4);
    // cerca viva nos fundos e muro na frente
    arbusto(g, ox + 2, oy + 2, 92, 8);
    r(g, ox + 2, oy + 88, 92, 6, '#efe7d6'); r(g, ox + 2, oy + 93, 92, 1, 'rgba(0,0,0,.3)'); r(g, ox + 2, oy + 88, 92, 1, '#fffaf0');
    // casa de 2 andares
    const x = ox + 8, w = 56;
    sombra(g, x + 5, oy + 66, w, 6);
    parede(g, x, oy + 26, w, 40, pc);
    telhadoFrente(g, x - 4, oy + 10, w + 8, 16, tc, true);
    janela(g, x + 6, oy + 31, 10, 9, { persiana: '#ffffff' }); janela(g, x + 23, oy + 31, 10, 9, { persiana: '#ffffff' }); janela(g, x + 40, oy + 31, 10, 9, { persiana: '#ffffff' });
    r(g, x + 1, oy + 44, w - 2, 2, pc[1]);
    janela(g, x + 6, oy + 50, 12, 10, {}); porta(g, x + 24, oy + 48, 10, 18, '#5a3a22'); janela(g, x + 39, oy + 50, 12, 10, {});
    // varanda
    r(g, x - 2, oy + 46, w + 4, 2, P.madeira); for (let i = 0; i < w + 4; i += 14) r(g, x - 2 + i, oy + 46, 2, 20, P.branco);
    // piscina
    if (rand() < 0.75) {
      caixa(g, ox + 68, oy + 40, 22, 30, '#e9e2d0');
      r(g, ox + 70, oy + 42, 18, 26, P.agua2); r(g, ox + 70, oy + 42, 18, 3, P.agua3);
      for (let i = 0; i < 4; i++) r(g, ox + 72 + Math.floor(rand() * 12), oy + 48 + Math.floor(rand() * 16), 4, 1, P.espuma);
      arvore(g, ox + 66, oy + 10, rand, 'coqueiro');
    } else { arvore(g, ox + 64, oy + 30, rand, 'ipe'); arvore(g, ox + 66, oy + 10, rand, 'coqueiro'); }
    // garagem com carro
    r(g, ox + 10, oy + 70, 30, 17, '#d8d0bf');
    carroLateral(g, ox + 12, oy + 72, pick(rand, ['#d33a3a', '#2a2a33', '#f4f1e8', '#3466c2', '#8c8c96']));
    flores(g, ox + 46, oy + 72, rand, 6); arbusto(g, ox + 46, oy + 76, 16, 9);
  }

  function fabrica(g, ox, oy, rand) {
    // 4x3 tiles (128x96)
    const tijolo = pick(rand, [['#b4573f', '#9a4733'], ['#c4a07a', '#a88660'], ['#9fa8ae', '#848d93']]);
    r(g, ox + 2, oy + 4, 124, 90, '#a99c88');
    for (let i = 0; i < 40; i++) r(g, ox + 4 + Math.floor(rand() * 120), oy + 70 + Math.floor(rand() * 22), 3, 1, '#968a77');
    // chaminé
    caixa(g, ox + 100, oy + 2, 12, 44, '#a64a38');
    for (let i = 6; i < 44; i += 10) r(g, ox + 101, oy + 2 + i, 10, 3, '#f2ede2');
    r(g, ox + 99, oy, 14, 4, '#5a2a20');
    // dente-de-serra visto de frente
    const xs = ox + 6, wTot = 92;
    for (let k = 0; k < 4; k++) {
      const bx = xs + k * 23;
      for (let i = 0; i < 16; i++) { r(g, bx, oy + 22 + i, Math.round(i * 1.4) + 1, 1, '#8a909a'); r(g, bx + Math.round(i * 1.4) + 1, oy + 22 + i, 23 - Math.round(i * 1.4) - 1, 1, i < 3 ? '#cfe6f2' : '#a9c7d6'); }
      r(g, bx, oy + 22, 1, 16, P.contorno);
    }
    r(g, xs - 1, oy + 38, wTot + 2, 2, P.contorno);
    // parede de tijolos
    caixa(g, xs, oy + 39, wTot, 33, tijolo[0]);
    for (let yy = oy + 42; yy < oy + 70; yy += 4) { r(g, xs + 1, yy, wTot - 2, 1, tijolo[1]); for (let xx = xs + ((yy >> 2) % 2 ? 4 : 1); xx < xs + wTot - 1; xx += 7) r(g, xx, yy - 3, 1, 3, tijolo[1]); }
    for (let i = 0; i < 4; i++) janela(g, xs + 6 + i * 13, oy + 44, 9, 9, { cruz: true, moldura: '#d8d8d8' });
    // portão de carga
    caixa(g, xs + 60, oy + 46, 26, 26, '#6f747c'); for (let yy = oy + 48; yy < oy + 72; yy += 3) r(g, xs + 61, yy, 24, 1, '#5a5e65');
    r(g, xs + 58, oy + 42, 30, 3, '#f2c13a');
    // placa com logotipo
    caixa(g, xs + 6, oy + 59, 46, 10, '#1f3f6e'); r(g, xs + 9, oy + 62, 22, 2, '#f6f2e6'); r(g, xs + 9, oy + 65, 14, 1, '#9fc0e6'); r(g, xs + 40, oy + 61, 8, 6, '#f2c13a');
    sombra(g, xs + 4, oy + 72, wTot, 5);
    // caminhão de lado
    caminhao(g, ox + 8, oy + 76, pick(rand, ['#f4f1e8', '#e0a82e', '#3d8bd1']));
    // pallets
    for (let i = 0; i < 3; i++) { caixa(g, ox + 86 + i * 11, oy + 80, 9, 8, '#a8743f'); r(g, ox + 87 + i * 11, oy + 83, 7, 1, '#7a5634'); }
  }

  function galpao(g, ox, oy, rand) {
    // 3x2 tiles (96x64), telhado em arco de metal
    const tc = pick(rand, [['#c9d2dc', '#a9b4c0', '#8994a0'], ['#d97b4a', '#bd6238', '#994d2b'], ['#7ab0d8', '#5f97c2', '#4a7ca3']]);
    sombra(g, ox + 8, oy + 58, 84, 5);
    for (let i = 0; i < 20; i++) {
      const inset = Math.round(Math.pow((20 - i) / 20, 2) * 10);
      r(g, ox + 4 + inset, oy + 4 + i, 88 - inset * 2, 1, i < 6 ? tc[0] : tc[1]);
      for (let k = ox + 8 + inset; k < ox + 92 - inset; k += 6) r(g, k, oy + 4 + i, 1, 1, tc[2]);
      r(g, ox + 3 + inset, oy + 4 + i, 1, 1, P.contorno); r(g, ox + 92 - inset, oy + 4 + i, 1, 1, P.contorno);
    }
    r(g, ox + 3, oy + 24, 90, 2, P.contorno);
    caixa(g, ox + 4, oy + 25, 88, 33, '#e3dccb');
    r(g, ox + 5, oy + 26, 86, 3, '#c9c0ac');
    for (const dx of [10, 52]) { caixa(g, ox + dx, oy + 34, 32, 24, '#7d828a'); for (let yy = oy + 36; yy < oy + 58; yy += 3) r(g, ox + dx + 1, yy, 30, 1, '#6a6e75'); }
    r(g, ox + 44, oy + 30, 6, 4, '#f2c13a');
  }

  function plantacao(g, x, y, w, h, rand) {
    const tipo = rand();
    r(g, x, y, w, h, tipo < 0.5 ? '#9b7443' : '#8f7a3c');
    for (let yy = y + 2; yy < y + h - 2; yy += 6) {
      r(g, x + 1, yy + 3, w - 2, 1, 'rgba(0,0,0,.15)');
      for (let xx = x + 2; xx < x + w - 3; xx += 4) {
        if (tipo < 0.5) { r(g, xx, yy, 3, 3, '#5ea83d'); r(g, xx + 1, yy - 1, 1, 1, '#86c95a'); } // café/hortaliça
        else { r(g, xx + 1, yy - 2, 1, 5, '#d8b84a'); r(g, xx, yy - 2, 3, 1, '#f0d06a'); }       // cana/milho
      }
    }
    borda(g, x, y, w, h, '#6e5230');
  }

  // ------------------------------------------------- prédios públicos 96x96
  function predio(tipo) {
    const [c, g] = canvas(96, 96);
    const rand = rng(tipo.length * 131 + tipo.charCodeAt(0));
    const gramado = () => { r(g, 1, 1, 94, 94, P.grama3); for (let i = 0; i < 40; i++) r(g, 2 + Math.floor(rand() * 92), 2 + Math.floor(rand() * 92), 2, 1, P.grama4); };
    const piso = (cor = '#d8cfbd') => { r(g, 1, 1, 94, 94, cor); for (let yy = 4; yy < 94; yy += 8) r(g, 1, yy, 94, 1, 'rgba(0,0,0,.06)'); };
    switch (tipo) {
      case 'prefeitura': {
        gramado();
        r(g, 36, 76, 24, 19, '#d8cfbd'); // caminho
        arbusto(g, 4, 80, 26, 10); arbusto(g, 66, 80, 26, 10); flores(g, 8, 78, rand, 6); flores(g, 72, 78, rand, 6);
        sombra(g, 10, 74, 80, 5);
        // corpo
        caixa(g, 8, 30, 80, 44, '#f4efe3');
        r(g, 9, 31, 78, 4, '#ddd5c4');
        // frontão triangular
        for (let i = 0; i < 14; i++) { const hw = Math.round(i * 2.6); r(g, 48 - hw, 16 + i, hw * 2, 1, i < 2 ? '#fffaf0' : '#e8e0cf'); r(g, 48 - hw - 1, 16 + i, 1, 1, P.contorno); r(g, 48 + hw, 16 + i, 1, 1, P.contorno); }
        r(g, 10, 29, 76, 3, '#cfc6b4'); borda(g, 10, 28, 76, 4, P.contorno);
        // relógio
        caixa(g, 44, 19, 8, 8, '#ffffff'); r(g, 47, 21, 1, 3, P.contorno); r(g, 47, 23, 3, 1, P.contorno);
        // colunas
        for (let i = 0; i < 6; i++) { const cx = 14 + i * 13; caixa(g, cx, 34, 6, 34, '#fffaf0'); r(g, cx + 4, 35, 1, 32, '#ddd5c4'); r(g, cx - 1, 33, 8, 2, '#e8e0cf'); r(g, cx - 1, 67, 8, 2, '#e8e0cf'); }
        // portas e janelas entre colunas
        janela(g, 23, 42, 4, 10, { cruz: false }); janela(g, 62, 42, 4, 10, { cruz: false }); janela(g, 75, 42, 4, 10, { cruz: false }); janela(g, 10 + 0, 42, 2, 10, { cruz: false });
        porta(g, 42, 46, 12, 22, '#6e4526');
        // escadaria
        for (let i = 0; i < 4; i++) r(g, 30 - i * 3, 68 + i * 2, 36 + i * 6, 2, i % 2 ? '#cfc6b4' : '#e2dacb');
        r(g, 21, 76, 54, 1, P.contorno);
        // mastros: Brasil, São Paulo e município
        const mastro = (x, f) => { r(g, x, 2, 1, 28, '#5a5a62'); f(x + 1, 3); };
        mastro(4, (x, y) => { r(g, x, y, 12, 8, '#2c9a48'); r(g, x + 3, y + 2, 6, 4, '#f2d33a'); r(g, x + 5, y + 3, 2, 2, '#2d4fa3'); });
        mastro(86, (x, y) => { r(g, x, y, 9, 7, '#f6f2e6'); for (let i = 0; i < 7; i += 2) r(g, x, y + i, 9, 1, '#1c1c24'); r(g, x, y, 4, 3, '#d63a3a'); });
        break;
      }
      case 'camara': {
        gramado();
        r(g, 38, 78, 20, 17, '#d8cfbd'); arbusto(g, 4, 82, 30, 9); arbusto(g, 62, 82, 30, 9);
        sombra(g, 10, 76, 80, 5);
        caixa(g, 8, 36, 80, 40, '#ead9b8'); r(g, 9, 37, 78, 3, '#d3c19e');
        // cúpula
        for (let i = 0; i < 18; i++) { const hw = Math.round(Math.sqrt(1 - Math.pow((18 - i) / 18, 2)) * 18); r(g, 48 - hw, 12 + i, hw * 2, 1, i < 5 ? '#a3cbd9' : '#7ea6b8'); r(g, 48 - hw - 1, 12 + i, 1, 1, P.contorno); r(g, 48 + hw, 12 + i, 1, 1, P.contorno); }
        for (let i = 0; i < 4; i++) r(g, 36 + i * 8, 18, 1, 12, '#6890a2');
        r(g, 47, 6, 2, 7, '#5a5a62'); r(g, 46, 5, 4, 2, '#f2c13a');
        caixa(g, 26, 29, 44, 8, '#d3c19e');
        for (let i = 0; i < 5; i++) janela(g, 14 + i * 15, 44, 7, 12, { cruz: true });
        porta(g, 41, 58, 14, 18, '#5a3a22');
        caixa(g, 33, 49, 30, 6, '#7a5634'); r(g, 36, 51, 24, 2, '#f2d33a'); // placa
        for (let i = 0; i < 3; i++) r(g, 26 - i * 3, 76 + i * 2, 44 + i * 6, 2, i % 2 ? '#cfc6b4' : '#e2dacb');
        break;
      }
      case 'igreja': {
        piso('#e2d8c4');
        sombra(g, 16, 82, 70, 5);
        // nave
        caixa(g, 16, 40, 64, 42, '#f8f4ea');
        telhadoFrente(g, 12, 30, 72, 10, ['#d9614a', '#bf4b38', '#9b3a2c']);
        // torre central
        caixa(g, 38, 6, 20, 76, '#fbf8f0');
        for (let i = 0; i < 8; i++) { const hw = Math.round(i * 1.4); r(g, 48 - hw, 0 + i, hw * 2, 1, '#bf4b38'); }
        r(g, 47, -2 + 2, 2, 6, '#f2c13a'); r(g, 45, 3, 6, 1, '#f2c13a'); // cruz
        caixa(g, 43, 12, 10, 10, '#5b4a3a'); r(g, 46, 15, 4, 5, '#c9a43a'); // sino
        // rosácea e porta em arco
        r(g, 44, 28, 8, 8, '#e66a8a'); r(g, 46, 29, 4, 6, '#5aa9ef'); r(g, 47, 31, 2, 2, '#f2d33a'); borda(g, 43, 27, 10, 10, P.contorno);
        caixa(g, 42, 60, 12, 22, '#6e4526'); r(g, 43, 58, 10, 3, '#6e4526'); r(g, 47, 61, 1, 21, '#4a2e18');
        janela(g, 22, 50, 6, 14, { cruz: false, moldura: '#d9c9a2' }); janela(g, 68, 50, 6, 14, { cruz: false, moldura: '#d9c9a2' });
        r(g, 36, 82, 24, 3, '#cfc6b4');
        arvore(g, 0, 56, rand, 'redonda'); arvore(g, 66, 58, rand, 'ipe');
        break;
      }
      case 'praca': {
        gramado();
        // caminhos em cruz com pedra portuguesa
        r(g, 42, 1, 12, 94, '#e6dcc8'); r(g, 1, 42, 94, 12, '#e6dcc8');
        for (let i = 0; i < 94; i += 6) { r(g, 44 + (i % 12 ? 0 : 4), 1 + i, 4, 2, '#3a3a40'); r(g, 1 + i, 46 + (i % 12 ? 0 : 4), 2, 4, '#3a3a40'); }
        // coreto (marca registrada da praça brasileira)
        sombra(g, 30, 60, 40, 4);
        for (let i = 0; i < 10; i++) { const hw = 6 + Math.round(i * 1.6); r(g, 48 - hw, 30 + i, hw * 2, 1, i % 3 === 2 ? '#2f7a4a' : '#3f9b5c'); r(g, 48 - hw - 1, 30 + i, 1, 1, P.contorno); r(g, 48 + hw, 30 + i, 1, 1, P.contorno); }
        r(g, 46, 26, 4, 4, '#f2c13a');
        r(g, 31, 40, 34, 2, P.contorno);
        for (let i = 0; i < 5; i++) r(g, 33 + i * 7, 42, 2, 14, '#f6f2e6');
        r(g, 32, 48, 32, 1, '#f6f2e6');
        caixa(g, 30, 56, 36, 5, '#e2d8c4');
        // bancos e postes
        for (const [bx, by] of [[10, 34], [70, 34], [10, 60], [70, 60]]) { r(g, bx, by, 14, 3, P.madeira3); r(g, bx, by + 3, 14, 1, P.madeira2); r(g, bx + 1, by + 4, 2, 3, '#3f4048'); r(g, bx + 11, by + 4, 2, 3, '#3f4048'); }
        poste(g, 34, 62); poste(g, 56, 62);
        arvore(g, 2, 14, rand, 'ipe'); arvore(g, 64, 14, rand, 'redonda'); arvore(g, 2, 62, rand, 'redonda'); arvore(g, 64, 62, rand, 'ipe');
        flores(g, 22, 18, rand, 6); flores(g, 60, 78, rand, 6);
        break;
      }
      case 'escola': {
        piso('#d8cfbd');
        // quadra de esportes
        caixa(g, 4, 66, 56, 28, '#3d8f5a'); r(g, 6, 68, 52, 24, '#4aa36a'); r(g, 31, 68, 1, 24, '#f6f2e6'); borda(g, 6, 68, 52, 24, '#f6f2e6'); borda(g, 26, 75, 11, 10, '#f6f2e6');
        r(g, 6, 76, 2, 8, '#f2c13a'); r(g, 56, 76, 2, 8, '#f2c13a');
        // prédio
        sombra(g, 8, 62, 84, 5);
        parede(g, 6, 30, 84, 32, ['#f2c64e', '#d9a83a']);
        telhadoFrente(g, 2, 14, 92, 16, TELHADOS[2]);
        for (let i = 0; i < 6; i++) if (i !== 3) janela(g, 10 + i * 13, 36, 8, 9, { cruz: true });
        porta(g, 47, 42, 12, 20, '#3d6b8f');
        caixa(g, 40, 32, 26, 7, '#2f5592'); r(g, 43, 34, 20, 1, '#f6f2e6'); r(g, 43, 36, 14, 1, '#f6f2e6'); // placa ESCOLA
        r(g, 2, 33, 4, 0, '#000');
        // mastro com bandeira
        r(g, 80, 54, 1, 0, '#000');
        r(g, 72, 66, 1, 26, '#5a5a62'); r(g, 73, 66, 12, 8, '#2c9a48'); r(g, 76, 68, 6, 4, '#f2d33a'); r(g, 78, 69, 2, 2, '#2d4fa3');
        arvore(g, 64, 64, rand, 'redonda');
        break;
      }
      case 'ubs': {
        piso('#d8cfbd');
        sombra(g, 8, 70, 84, 5);
        parede(g, 6, 30, 84, 40, ['#f8f8f8', '#dcdce4']);
        r(g, 6, 22, 84, 9, '#e8e8ee'); borda(g, 5, 21, 86, 10, P.contorno); // laje
        r(g, 7, 44, 82, 4, '#3d8bd1'); r(g, 7, 48, 82, 1, '#2d6ea8');
        // cruz vermelha
        caixa(g, 40, 2, 16, 18, '#f8f8f8'); r(g, 46, 5, 4, 12, '#e23b3b'); r(g, 42, 9, 12, 4, '#e23b3b');
        janela(g, 12, 32, 10, 9, {}); janela(g, 28, 32, 10, 9, {}); janela(g, 58, 32, 10, 9, {}); janela(g, 74, 32, 10, 9, {});
        caixa(g, 40, 50, 16, 20, P.vidro2); r(g, 41, 51, 14, 8, P.vidro); r(g, 47, 51, 1, 19, '#dcdce4');
        r(g, 36, 47, 24, 3, '#f8f8f8'); borda(g, 36, 46, 24, 4, P.contorno); // marquise
        ambulancia(g, 60, 74);
        arbusto(g, 4, 76, 30, 10); flores(g, 8, 74, rand, 5);
        break;
      }
      case 'hospital': {
        piso('#d4ccbc');
        sombra(g, 6, 76, 88, 5);
        caixa(g, 4, 10, 88, 66, '#f8f8f8');
        r(g, 5, 11, 86, 4, '#e2e2ea'); r(g, 4, 8, 88, 3, '#cfcfd8'); borda(g, 3, 7, 90, 5, P.contorno);
        for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) if (!(row === 0 && i === 3)) janela(g, 9 + i * 12, 18 + row * 15, 6, 8, { cruz: false });
        // cruz e "H"
        caixa(g, 42, 14, 12, 12, '#e23b3b'); r(g, 46, 16, 4, 8, '#ffffff'); r(g, 44, 18, 8, 4, '#ffffff');
        r(g, 5, 62, 86, 3, '#3d8bd1');
        caixa(g, 34, 64, 28, 12, P.vidro2); r(g, 35, 65, 26, 5, P.vidro);
        r(g, 30, 60, 36, 4, '#f8f8f8'); borda(g, 30, 59, 36, 5, P.contorno);
        ambulancia(g, 64, 80); ambulancia(g, 4, 80);
        break;
      }
      case 'creche': {
        gramado();
        sombra(g, 8, 58, 56, 5);
        parede(g, 6, 30, 56, 28, ['#fbe3a1', '#e8c97a']);
        telhadoOitao(g, 4, 6, 60, 24, ['#f08aa8', '#e66a8a', '#c9536f'], ['#fbe3a1']);
        janela(g, 11, 36, 8, 8, { moldura: '#5fb0e8' }); janela(g, 49, 36, 8, 8, { moldura: '#7bd36b' });
        porta(g, 28, 38, 12, 20, '#f08a5d');
        for (let i = 0; i < 7; i++) r(g, 8 + i * 8, 52, 4, 4, ['#e23b3b', '#f2d33a', '#5aa9ef', '#62b85a'][i % 4]); // bandeirinhas
        // parquinho: balanço, escorregador, caixa de areia
        r(g, 68, 30, 2, 26, '#e23b3b'); r(g, 90, 30, 2, 26, '#e23b3b'); r(g, 66, 28, 28, 3, '#e23b3b');
        r(g, 74, 31, 1, 14, '#5a5a62'); r(g, 84, 31, 1, 14, '#5a5a62'); r(g, 72, 45, 6, 2, '#3d6b8f'); r(g, 82, 45, 6, 2, '#3d6b8f');
        r(g, 10, 66, 3, 22, '#5aa9ef'); for (let i = 0; i < 20; i++) r(g, 13 + i, 66 + i, 3, 2, '#5aa9ef'); r(g, 8, 64, 8, 3, '#5aa9ef');
        caixa(g, 58, 70, 30, 18, '#a8743f'); r(g, 59, 71, 28, 16, '#ecd9a0'); r(g, 66, 76, 4, 3, '#e23b3b'); r(g, 76, 79, 3, 3, '#f2d33a');
        break;
      }
      case 'guarda': {
        piso('#c9c1b2');
        sombra(g, 8, 64, 84, 5);
        parede(g, 6, 28, 84, 36, ['#e8e8ee', '#cfcfd8']);
        telhadoFrente(g, 2, 12, 92, 16, ['#3a5590', '#2a3f73', '#1f305a']);
        r(g, 7, 34, 82, 5, '#2a3f73');
        // brasão
        caixa(g, 41, 2, 14, 16, '#2a3f73'); r(g, 44, 5, 8, 9, '#f2c13a'); r(g, 47, 4, 2, 12, '#f2c13a'); r(g, 46, 7, 4, 4, '#2a3f73');
        janela(g, 12, 43, 10, 9, {}); janela(g, 74, 43, 10, 9, {});
        porta(g, 30, 42, 12, 22, '#2a3f73');
        caixa(g, 50, 42, 20, 22, '#6f747c'); for (let yy = 44; yy < 64; yy += 3) r(g, 51, yy, 18, 1, '#5a5e65');
        viatura(g, 8, 72); viatura(g, 52, 74);
        break;
      }
      case 'bombeiros': {
        piso('#c9c1b2');
        sombra(g, 6, 70, 76, 5);
        caixa(g, 4, 22, 74, 48, '#c4483a');
        for (let yy = 25; yy < 70; yy += 4) { r(g, 5, yy, 72, 1, '#a63a2e'); for (let xx = (yy >> 2) % 2 ? 8 : 4; xx < 77; xx += 8) r(g, xx, yy - 3, 1, 3, '#a63a2e'); }
        r(g, 3, 18, 76, 5, '#f6f2e6'); borda(g, 3, 18, 76, 5, P.contorno);
        // portões, um aberto com o caminhão
        caixa(g, 10, 38, 26, 32, '#3a2a22'); caminhaoBombeiro(g, 12, 52);
        caixa(g, 44, 38, 26, 32, '#e8e0cc'); for (let yy = 40; yy < 70; yy += 4) r(g, 45, yy, 24, 1, '#c9c0ac');
        janela(g, 14, 27, 7, 6, {}); janela(g, 30, 27, 7, 6, {}); janela(g, 48, 27, 7, 6, {}); janela(g, 62, 27, 7, 6, {});
        // torre de treino
        caixa(g, 80, 4, 14, 66, '#e8e0cc'); for (let yy = 10; yy < 66; yy += 12) janela(g, 84, yy, 5, 5, { cruz: false }); r(g, 79, 2, 16, 3, '#c4483a');
        r(g, 4, 74, 88, 4, '#f2c13a'); for (let i = 4; i < 92; i += 8) r(g, i, 74, 4, 4, '#2a2a33');
        break;
      }
      case 'cultura': {
        piso('#d8cfbd');
        sombra(g, 8, 72, 82, 5);
        caixa(g, 6, 14, 84, 58, '#7b4fa0');
        r(g, 7, 15, 82, 5, '#9a6bbd');
        // marquise com luzes
        caixa(g, 18, 40, 60, 10, '#3a2050');
        for (let i = 0; i < 14; i++) r(g, 20 + i * 4, 41, 2, 2, i % 2 ? '#ffe9a0' : '#f2c13a'), r(g, 20 + i * 4, 47, 2, 2, i % 2 ? '#f2c13a' : '#ffe9a0');
        r(g, 26, 44, 44, 2, '#f6f2e6');
        // arcos art déco
        for (let i = 0; i < 4; i++) { caixa(g, 12 + i * 20, 22, 12, 16, '#5a3577'); r(g, 13 + i * 20, 23, 10, 5, '#ffcf6a'); }
        // máscaras do teatro
        caixa(g, 8, 52, 12, 12, '#f2c13a'); r(g, 11, 55, 2, 2, P.contorno); r(g, 15, 55, 2, 2, P.contorno); r(g, 11, 59, 6, 1, P.contorno);
        caixa(g, 76, 52, 12, 12, '#e66a8a'); r(g, 79, 55, 2, 2, P.contorno); r(g, 83, 55, 2, 2, P.contorno); r(g, 80, 60, 4, 1, P.contorno);
        caixa(g, 34, 52, 28, 20, '#3a2050'); r(g, 35, 53, 26, 18, '#c43a3a'); r(g, 47, 53, 2, 18, '#8a2a2a'); // cortina
        // cartazes
        caixa(g, 22, 54, 8, 12, '#f6f2e6'); r(g, 23, 56, 6, 4, '#3d8bd1'); caixa(g, 66, 54, 8, 12, '#f6f2e6'); r(g, 67, 56, 6, 4, '#e0a82e');
        break;
      }
      case 'lote_publico': {
        r(g, 1, 1, 94, 94, P.terra);
        for (let i = 0; i < 120; i++) r(g, 2 + Math.floor(rand() * 90), 2 + Math.floor(rand() * 90), 3, 1, rand() < .5 ? P.terra2 : P.terra3);
        for (let i = 0; i < 6; i++) { const px = 6 + Math.floor(rand() * 80), py = 10 + Math.floor(rand() * 70); r(g, px, py, 4, 3, '#9a9488'); r(g, px, py, 4, 1, '#bdb6a8'); }
        cerca(g, 2, 2, 92); cerca(g, 2, 82, 30); cerca(g, 64, 82, 30);
        // placa da prefeitura
        r(g, 34, 44, 2, 22, P.madeira2); r(g, 60, 44, 2, 22, P.madeira2);
        caixa(g, 28, 26, 40, 22, '#f6f2e6'); r(g, 29, 27, 38, 5, '#2c9a48');
        r(g, 32, 35, 30, 2, '#8a8a8a'); r(g, 32, 39, 22, 2, '#8a8a8a'); r(g, 32, 43, 26, 1, '#b0b0b0');
        sombra(g, 30, 66, 34, 3);
        break;
      }
      case 'lote_particular': {
        r(g, 1, 1, 94, 94, '#6f9e3c');
        for (let i = 0; i < 160; i++) { const tx = 2 + Math.floor(rand() * 90), ty = 2 + Math.floor(rand() * 88); r(g, tx, ty, 1, 4, rand() < .5 ? '#8bbf4e' : '#557f2b'); r(g, tx + 1, ty + 1, 1, 3, '#7aa844'); }
        arbusto(g, 8, 60, 18, 10, ['#557f2b', '#6f9e3c', '#8bbf4e']); arbusto(g, 66, 20, 20, 12, ['#557f2b', '#6f9e3c', '#8bbf4e']);
        // cerca de arame
        for (let i = 2; i < 94; i += 8) { r(g, i, 4, 2, 10, '#8a7a5a'); r(g, i, 82, 2, 10, '#8a7a5a'); }
        r(g, 2, 7, 92, 1, '#a9a9a9'); r(g, 2, 11, 92, 1, '#a9a9a9'); r(g, 2, 85, 92, 1, '#a9a9a9'); r(g, 2, 89, 92, 1, '#a9a9a9');
        r(g, 46, 46, 2, 20, P.madeira2);
        caixa(g, 30, 30, 34, 18, '#c43a3a'); r(g, 34, 35, 26, 2, '#f6f2e6'); r(g, 34, 40, 18, 2, '#f6f2e6');
        break;
      }
      case 'obra': {
        r(g, 1, 1, 94, 94, P.terra);
        for (let i = 0; i < 90; i++) r(g, 2 + Math.floor(rand() * 90), 2 + Math.floor(rand() * 90), 3, 1, P.terra2);
        // estrutura de concreto com andaime
        sombra(g, 16, 66, 56, 4);
        caixa(g, 14, 22, 52, 44, '#b9b6ae');
        for (let yy = 22; yy < 66; yy += 11) r(g, 14, yy, 52, 3, '#9a978f');
        for (let xx = 14; xx < 66; xx += 13) r(g, xx, 22, 3, 44, '#9a978f');
        for (let xx = 10; xx < 72; xx += 8) r(g, xx, 18, 1, 50, '#d9a83a');
        for (let yy = 22; yy < 66; yy += 11) r(g, 10, yy + 8, 62, 1, '#d9a83a');
        // guindaste
        r(g, 78, 6, 4, 64, '#f2c13a'); for (let yy = 8; yy < 70; yy += 5) r(g, 78, yy, 4, 1, '#c99a1c');
        r(g, 30, 6, 64, 4, '#f2c13a'); r(g, 84, 2, 8, 6, '#3d4a5a');
        r(g, 40, 10, 1, 18, '#3f4048'); caixa(g, 36, 28, 9, 6, '#7a7a84');
        // betoneira e operário
        caixa(g, 74, 72, 16, 12, '#e8e8e8'); r(g, 76, 74, 12, 7, '#f2a33a');
        r(g, 24, 74, 4, 8, '#f2a33a'); r(g, 24, 71, 4, 3, '#f2d33a'); r(g, 25, 82, 1, 3, '#2f3b5a'); r(g, 27, 82, 1, 3, '#2f3b5a');
        // tapume
        for (let i = 1; i < 95; i += 10) { r(g, i, 86, 9, 9, '#e0e0d8'); r(g, i, 88, 9, 2, '#f2a33a'); }
        break;
      }
    }
    return c;
  }

  // ------------------------------------------------- empresas privadas 96x96
  function escurecer(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.max(0, Math.min(255, Math.round(v * f))));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function letreiro(g, x, y, w, h, cor) {
    caixa(g, x, y, w, h, cor);
    r(g, x + 1, y + 1, w - 2, 2, escurecer(cor, 1.25));
    r(g, x + 4, y + Math.floor(h / 2) - 1, w - 16, 2, '#f6f2e6');
    r(g, x + w - 9, y + 3, 5, h - 6, '#f6f2e6');
  }
  function estacionamento(g, x, y, w, h, rand) {
    r(g, x, y, w, h, '#6a6872'); for (let i = x + 4; i < x + w - 4; i += 14) r(g, i, y + 2, 1, h - 4, '#f6f2e6');
    for (let i = x + 6; i < x + w - 20; i += 28) if (rand() < .75) carroLateral(g, i, y + Math.floor(h / 2) - 7, pick(rand, ['#d33a3a', '#2a2a33', '#f4f1e8', '#3466c2', '#8c8c96', '#e0a82e']));
  }
  function empresa(tipo, cor, seed) {
    const [c, g] = canvas(96, 96);
    const rand = rng(seed || 7);
    const cor2 = escurecer(cor, 0.75);
    switch (tipo) {
      case 'fabrica': {
        r(g, 1, 1, 94, 94, '#a99c88');
        for (let i = 0; i < 40; i++) r(g, 2 + Math.floor(rand() * 92), 70 + Math.floor(rand() * 22), 3, 1, '#968a77');
        caixa(g, 76, 2, 12, 40, '#a64a38'); for (let i = 6; i < 40; i += 10) r(g, 77, 2 + i, 10, 3, '#f2ede2'); r(g, 75, 0, 14, 4, '#5a2a20');
        for (let k = 0; k < 3; k++) { const bx = 4 + k * 23; for (let i = 0; i < 16; i++) { r(g, bx, 20 + i, Math.round(i * 1.4) + 1, 1, '#8a909a'); r(g, bx + Math.round(i * 1.4) + 1, 20 + i, 23 - Math.round(i * 1.4) - 1, 1, i < 3 ? '#cfe6f2' : '#a9c7d6'); } r(g, bx, 20, 1, 16, P.contorno); }
        r(g, 3, 36, 72, 2, P.contorno);
        caixa(g, 4, 37, 70, 33, '#e8e2d4'); r(g, 5, 38, 68, 6, cor);
        for (let i = 0; i < 3; i++) janela(g, 9 + i * 12, 50, 7, 7, { cruz: false, moldura: '#d8d8d8' });
        caixa(g, 46, 46, 24, 24, '#6f747c'); for (let yy = 48; yy < 70; yy += 3) r(g, 47, yy, 22, 1, '#5a5e65');
        letreiro(g, 8, 58, 30, 10, cor2);
        sombra(g, 6, 70, 70, 4);
        caminhao(g, 6, 76, cor);
        for (let i = 0; i < 3; i++) { caixa(g, 58 + i * 11, 80, 9, 8, '#a8743f'); r(g, 59 + i * 11, 83, 7, 1, '#7a5634'); }
        break;
      }
      case 'logistica': {
        r(g, 1, 1, 94, 94, '#a6a39a');
        for (let k = 0; k < 2; k++) {
          const yy = 4 + k * 40;
          for (let i = 0; i < 12; i++) { const ins = Math.round(Math.pow((12 - i) / 12, 2) * 6); r(g, 4 + ins, yy + i, 88 - ins * 2, 1, i < 4 ? '#d8dee6' : '#b8c2cc'); }
          r(g, 3, yy + 12, 90, 2, P.contorno);
          caixa(g, 4, yy + 13, 88, 20, '#ece6d8'); r(g, 5, yy + 14, 86, 4, cor);
          for (let d = 0; d < 5; d++) { caixa(g, 8 + d * 17, yy + 20, 13, 13, '#6f747c'); for (let s = yy + 22; s < yy + 33; s += 3) r(g, 9 + d * 17, s, 11, 1, '#5a5e65'); }
        }
        caminhao(g, 4, 80, cor); caminhao(g, 50, 80, '#f4f1e8');
        break;
      }
      case 'escritorio': {
        r(g, 1, 1, 94, 94, '#d8cfbd');
        sombra(g, 22, 74, 60, 5);
        caixa(g, 20, 6, 58, 68, '#3a4a5c');
        for (let row = 0; row < 7; row++) for (let col = 0; col < 5; col++) { r(g, 24 + col * 11, 12 + row * 8, 8, 5, row % 2 ? '#7ec8e3' : '#9fd8ee'); r(g, 24 + col * 11, 12 + row * 8, 3, 2, '#cdeffa'); }
        r(g, 20, 4, 58, 4, cor); borda(g, 19, 3, 60, 6, P.contorno);
        caixa(g, 40, 62, 18, 12, P.vidro2); r(g, 41, 63, 16, 5, P.vidro);
        letreiro(g, 24, 54, 22, 7, cor);
        arbusto(g, 4, 60, 14, 12); arbusto(g, 80, 60, 14, 12);
        estacionamento(g, 4, 78, 88, 16, rand);
        break;
      }
      case 'mercado': {
        r(g, 1, 1, 94, 94, '#d8cfbd');
        sombra(g, 6, 50, 86, 5);
        caixa(g, 4, 10, 88, 40, '#f2ede2');
        r(g, 4, 8, 88, 6, cor); borda(g, 3, 7, 90, 8, P.contorno);
        caixa(g, 18, 15, 60, 13, cor); r(g, 22, 19, 40, 4, '#f6f2e6'); r(g, 66, 17, 8, 9, '#f2c13a');
        for (let i = 0; i < 88; i += 8) { r(g, 4 + i, 30, 4, 5, cor); r(g, 8 + i, 30, 4, 5, '#f6f2e6'); }
        caixa(g, 10, 36, 76, 14, P.vidro2); r(g, 11, 37, 74, 5, P.vidro); r(g, 44, 37, 8, 13, '#3d2c22');
        for (let i = 0; i < 5; i++) r(g, 14 + i * 6, 46, 4, 3, pick(rand, ['#e8506a', '#f2d33a', '#5aa9ef', '#62b85a']));
        estacionamento(g, 2, 56, 92, 38, rand);
        r(g, 84, 54, 6, 8, '#9a9488'); for (let i = 0; i < 3; i++) r(g, 85, 55 + i * 2, 4, 1, '#c9c2b2'); // carrinhos
        break;
      }
      case 'faculdade': {
        r(g, 1, 1, 94, 94, P.grama3);
        for (let i = 0; i < 30; i++) r(g, 2 + Math.floor(rand() * 92), 2 + Math.floor(rand() * 92), 2, 1, P.grama4);
        r(g, 40, 64, 16, 31, '#e6dcc8');
        sombra(g, 8, 62, 82, 5);
        caixa(g, 6, 22, 84, 40, '#f0e6d2');
        telhadoFrente(g, 2, 10, 92, 12, [escurecer(cor, 1.2), cor, cor2]);
        for (let i = 0; i < 6; i++) { const cx = 12 + i * 14; caixa(g, cx, 26, 5, 30, '#fffaf0'); r(g, cx + 3, 27, 1, 28, '#ddd5c4'); }
        for (let i = 0; i < 5; i++) janela(g, 19 + i * 14, 32, 4, 12, { cruz: false });
        porta(g, 42, 44, 12, 18, '#5a3a22');
        caixa(g, 30, 23, 36, 6, cor2); r(g, 33, 25, 30, 2, '#f6f2e6');
        for (let i = 0; i < 6; i++) { const px = 10 + Math.floor(rand() * 76), py = 68 + Math.floor(rand() * 20); r(g, px, py, 3, 3, '#d9a77a'); r(g, px, py + 3, 3, 4, pick(rand, ['#e23b3b', '#3d8bd1', '#f2d33a', '#2c9a48'])); }
        arvore(g, 2, 64, rand, 'ipe'); arvore(g, 64, 64, rand, 'redonda');
        break;
      }
      case 'hotel': {
        r(g, 1, 1, 94, 94, '#d8cfbd');
        sombra(g, 16, 78, 70, 5);
        caixa(g, 14, 8, 68, 70, '#f3e6c4');
        r(g, 14, 6, 68, 4, cor); borda(g, 13, 5, 70, 6, P.contorno);
        for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) { janela(g, 19 + col * 12, 14 + row * 11, 6, 6, { cruz: false }); if (row < 4) r(g, 18 + col * 12, 21 + row * 11, 8, 1, '#3f4048'); }
        // letreiro vertical
        caixa(g, 4, 12, 9, 46, cor); for (let i = 0; i < 5; i++) r(g, 6, 16 + i * 8, 5, 4, '#ffe9a0');
        // marquise
        caixa(g, 34, 66, 28, 4, cor2); r(g, 36, 70, 2, 8, '#3f4048'); r(g, 58, 70, 2, 8, '#3f4048');
        caixa(g, 40, 70, 16, 8, P.vidro2);
        r(g, 30, 78, 36, 17, '#a33a3a'); // tapete vermelho / entrada
        carroLateral(g, 64, 80, '#2a2a33');
        arbusto(g, 2, 80, 22, 12);
        break;
      }
      case 'hospital': {
        r(g, 1, 1, 94, 94, '#d4ccbc');
        sombra(g, 6, 70, 86, 5);
        caixa(g, 4, 8, 88, 62, '#f8f8f8');
        r(g, 4, 6, 88, 4, cor); borda(g, 3, 5, 90, 6, P.contorno);
        for (let row = 0; row < 3; row++) for (let i = 0; i < 7; i++) if (!(row === 0 && i === 3)) janela(g, 9 + i * 12, 16 + row * 14, 6, 7, { cruz: false });
        caixa(g, 42, 12, 12, 12, cor); r(g, 46, 14, 4, 8, '#ffffff'); r(g, 44, 16, 8, 4, '#ffffff');
        r(g, 5, 56, 86, 3, cor);
        caixa(g, 34, 58, 28, 12, P.vidro2); r(g, 35, 59, 26, 5, P.vidro);
        estacionamento(g, 2, 76, 92, 18, rand);
        break;
      }
    }
    return c;
  }

  // =================================================== alta resolução
  // Todo desenho é feito em 1x e depois:
  //  1) ampliado 2x com Scale2x (suaviza diagonais e curvas da pixel art);
  //  2) recebe grão fino de material (textura em 2x);
  //  3) ganha sombras desfocadas no lugar das sombras duras.
  // No jogo as texturas 2x são exibidas com escala 0.5.
  let coletor = null;               // quando ativo, sombra() só registra
  function escala2x(src, sx = 0, sy = 0, w = src.width, h = src.height) {
    const sd = src.getContext('2d').getImageData(sx, sy, w, h);
    const s = new Uint32Array(sd.data.buffer);
    const [dst, gd] = canvas(w * 2, h * 2);
    const out = gd.createImageData(w * 2, h * 2);
    const d = new Uint32Array(out.data.buffer);
    const W2 = w * 2;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x, P = s[i];
        const A = y > 0 ? s[i - w] : P, D = y < h - 1 ? s[i + w] : P;
        const C = x > 0 ? s[i - 1] : P, B = x < w - 1 ? s[i + 1] : P;
        const o = y * 2 * W2 + x * 2;
        d[o]          = (C === A && C !== D && A !== B) ? A : P;
        d[o + 1]      = (A === B && A !== C && B !== D) ? B : P;
        d[o + W2]     = (D === C && D !== B && C !== A) ? C : P;
        d[o + W2 + 1] = (B === D && B !== A && D !== C) ? D : P;
      }
    }
    gd.putImageData(out, 0, 0);
    return dst;
  }
  // grão fino só onde já existe desenho (não pinta o transparente)
  function grao(g, w, h, rand, qtd = 0.08, forca = 0.07) {
    g.save(); g.globalCompositeOperation = 'source-atop';
    const n = Math.floor(w * h * qtd);
    for (let i = 0; i < n; i++) {
      g.fillStyle = rand() < 0.5 ? `rgba(255,255,255,${forca})` : `rgba(40,25,10,${forca * 1.2})`;
      g.fillRect(Math.floor(rand() * w), Math.floor(rand() * h), 1, 1);
    }
    g.restore();
  }
  // desenha todas as sombras numa camada e desfoca uma vez só (rápido)
  function sombrasMacias(g, sombras, escala = 2, desfoque = 3, alfa = 0.3) {
    if (!sombras.length) return;
    const W = g.canvas.width, H = g.canvas.height;
    const [m, gm] = canvas(W, H);
    gm.fillStyle = 'rgb(22,30,12)';
    for (const s of sombras) {
      gm.beginPath();
      gm.ellipse((s.x + s.w / 2) * escala, (s.y + s.h / 2) * escala, (s.w / 2 + 1) * escala, (s.h / 2 + 1) * escala, 0, 0, Math.PI * 2);
      gm.fill();
    }
    g.save(); g.globalAlpha = alfa; g.filter = `blur(${desfoque}px)`; g.drawImage(m, 0, 0); g.restore();
  }
  // desenha em 1x, devolve canvas 2x suavizado e texturizado
  function hd(w, h, desenhar, opt = {}) {
    const [c1, g1] = canvas(w, h);
    coletor = [];
    desenhar(g1);
    const sombras = coletor; coletor = null;
    const c2 = escala2x(c1);
    const g2 = c2.getContext('2d');
    if (opt.grao !== false) grao(g2, w * 2, h * 2, rng(w * 31 + h * 17 + (opt.seed || 0)), 0.06, 0.06);
    sombrasMacias(g2, sombras, 2, 3, opt.alfaSombra || 0.26);
    return c2;
  }
  // versão HD de qualquer função que devolve um canvas pronto
  function hdDe(fn, opt = {}) {
    coletor = [];
    const c1 = fn();
    const sombras = coletor; coletor = null;
    const c2 = escala2x(c1);
    const g2 = c2.getContext('2d');
    if (opt.grao !== false) grao(g2, c2.width, c2.height, rng(c2.width * 7 + (opt.seed || 1)), 0.06, 0.06);
    sombrasMacias(g2, sombras, 2, 3, 0.26);
    return c2;
  }
  function iniciarColeta() { coletor = []; }
  function terminarColeta() { const s = coletor || []; coletor = null; return s; }

  // ------------------------------------------------------- ícones (24x24)
  function icone(nome) {
    return hd(24, 24, g => {
      const C = P.contorno;
      const ouro = ['#f7d35a', '#e0a82e', '#a8741a'];
      switch (nome) {
        case 'financas':
          for (let i = 0; i < 4; i++) { caixa(g, 2, 16 - i * 3, 11, 4, ouro[1]); r(g, 3, 17 - i * 3, 9, 1, ouro[0]); }
          caixa(g, 11, 6, 11, 15, '#6e9e3a'); r(g, 12, 7, 9, 3, '#8fc152'); r(g, 14, 11, 5, 1, '#f6f2e6'); r(g, 14, 13, 5, 1, '#f6f2e6'); r(g, 14, 15, 5, 1, '#f6f2e6'); r(g, 16, 10, 1, 7, '#f6f2e6');
          r(g, 13, 3, 7, 4, '#6e9e3a'); borda(g, 13, 3, 7, 4, C);
          break;
        case 'impostos':
          caixa(g, 4, 2, 15, 20, '#fbf3df'); r(g, 15, 2, 4, 4, '#d9c9a2'); borda(g, 15, 2, 4, 4, C);
          for (let i = 0; i < 3; i++) r(g, 7, 7 + i * 3, 8, 1, '#b8a888');
          r(g, 7, 16, 3, 3, '#c0392b'); r(g, 13, 17, 3, 3, '#c0392b'); for (let i = 0; i < 7; i++) r(g, 9 + i, 21 - i, 1, 1, '#c0392b');
          break;
        case 'empresas':
          caixa(g, 2, 10, 20, 12, '#c4483a'); r(g, 3, 11, 18, 2, '#e06a5a');
          for (let k = 0; k < 3; k++) { for (let i = 0; i < 5; i++) r(g, 3 + k * 6, 10 - i, 6 - i, 1, '#8a909a'); }
          caixa(g, 16, 1, 4, 10, '#7a3a2a'); r(g, 16, 3, 4, 1, '#f6f2e6');
          r(g, 5, 15, 3, 3, P.vidro); r(g, 10, 15, 3, 3, P.vidro); caixa(g, 15, 15, 5, 7, '#5a5e65');
          r(g, 18, 0, 3, 1, '#cfcfd6');
          break;
        case 'licitacoes':
          caixa(g, 2, 6, 13, 16, '#fbf3df'); for (let i = 0; i < 4; i++) r(g, 4, 9 + i * 3, 9, 1, '#b8a888');
          r(g, 5, 19, 6, 1, '#3d6b8f');
          // martelo
          for (let i = 0; i < 8; i++) r(g, 11 + i, 13 - i, 2, 2, P.madeira);
          caixa(g, 15, 1, 8, 6, '#8a5a32'); r(g, 16, 2, 6, 1, '#b07a48');
          break;
        case 'camara':
          r(g, 2, 20, 20, 2, '#cfc6b4'); borda(g, 2, 20, 20, 2, C);
          caixa(g, 3, 10, 18, 10, '#f4efe3');
          for (let i = 0; i < 4; i++) r(g, 5 + i * 4, 12, 2, 8, '#d9d2c0');
          for (let i = 0; i < 6; i++) { const hw = Math.round(Math.sqrt(1 - Math.pow((6 - i) / 6, 2)) * 6); r(g, 12 - hw, 3 + i, hw * 2, 1, '#7ea6b8'); }
          r(g, 2, 9, 20, 2, '#d3c19e'); borda(g, 2, 9, 20, 2, C); r(g, 11, 0, 2, 3, '#f2c13a');
          break;
        case 'promessas':
          caixa(g, 3, 3, 18, 18, '#fbf3df'); r(g, 3, 3, 18, 3, '#e8d7b0'); borda(g, 3, 3, 18, 3, C);
          for (let i = 0; i < 3; i++) { caixa(g, 6, 8 + i * 4, 3, 3, '#ffffff'); r(g, 11, 9 + i * 4, 7, 1, '#b8a888'); }
          for (let i = 0; i < 3; i++) { r(g, 6 + i, 11 + i - 3 + 1, 1, 1, '#2c9a48'); }
          r(g, 7, 9, 1, 1, '#2c9a48'); r(g, 6, 8, 1, 1, '#2c9a48'); r(g, 8, 10, 1, 1, '#2c9a48'); r(g, 9, 9, 1, 1, '#2c9a48'); r(g, 10, 8, 1, 1, '#2c9a48');
          r(g, 7, 13, 1, 1, '#2c9a48'); r(g, 8, 14, 1, 1, '#2c9a48'); r(g, 9, 13, 1, 1, '#2c9a48'); r(g, 10, 12, 1, 1, '#2c9a48');
          break;
        case 'populacao':
          for (const [x, cor, pele] of [[2, '#3d8bd1', '#d9a77a'], [12, '#e66a8a', '#a86f4c']]) {
            caixa(g, x + 2, 3, 7, 7, pele); r(g, x + 2, 3, 7, 2, '#3a2a1a'); r(g, x + 4, 6, 1, 1, C); r(g, x + 7, 6, 1, 1, C);
            caixa(g, x, 11, 11, 11, cor); r(g, x + 1, 12, 9, 2, 'rgba(255,255,255,.25)');
          }
          break;
        case 'regiao':
          for (let k = 0; k < 3; k++) caixa(g, 2 + k * 7, 4 + (k % 2), 7, 16, ['#cde6a8', '#a9d18a', '#cde6a8'][k]);
          r(g, 4, 9, 14, 1, '#5aa9ef'); r(g, 9, 14, 10, 1, '#c99a5e');
          caixa(g, 14, 2, 6, 6, '#e23b3b'); r(g, 16, 8, 2, 4, '#e23b3b'); r(g, 16, 4, 2, 2, '#ffffff');
          break;
        case 'ouvidoria':
          caixa(g, 2, 3, 20, 14, '#ffffff'); r(g, 3, 4, 18, 2, '#eef2f6');
          for (let i = 0; i < 4; i++) r(g, 6 - i, 17 + i, 4, 1, '#ffffff'), r(g, 5 - i, 17 + i, 1, 1, C);
          r(g, 6, 8, 12, 1, '#9aa8b8'); r(g, 6, 11, 9, 1, '#9aa8b8'); r(g, 17, 10, 2, 3, '#e23b3b');
          break;
        case 'jornal':
          caixa(g, 2, 4, 20, 16, '#ece4cf'); r(g, 4, 6, 16, 3, '#3d2410');
          r(g, 4, 11, 7, 6, '#9a8f7a'); for (let i = 0; i < 4; i++) r(g, 13, 11 + i * 2, 7, 1, '#9a8f7a');
          r(g, 2, 20, 20, 1, '#c9bfa6');
          break;
        case 'recursos':
          caixa(g, 4, 8, 16, 14, '#c99a4a'); r(g, 5, 9, 14, 3, '#e3b968');
          r(g, 8, 4, 8, 5, '#c99a4a'); borda(g, 8, 4, 8, 5, C); r(g, 7, 7, 10, 2, '#7a5634');
          r(g, 7, 13, 10, 7, '#2c9a48'); for (let i = 0; i < 3; i++) { r(g, 12 - i, 14 + i, 1 + i * 2, 1, '#f2d33a'); r(g, 12 - i, 19 - i, 1 + i * 2, 1, '#f2d33a'); } r(g, 11, 16, 3, 1, '#2d4fa3');
          break;
      }
    }, { grao: false });
  }

  // ------------------------------------------- moldura de madeira (24x24)
  function moldura(fundo = '#f6dfb1') {
    const [c, g] = canvas(24, 24);
    const esc = '#3b1f0e', mad = '#b8652a', madC = '#e2974d', madE = '#8a4519';
    r(g, 1, 0, 22, 24, esc); r(g, 0, 1, 24, 22, esc);
    r(g, 1, 1, 22, 22, mad); r(g, 2, 1, 20, 1, madC); r(g, 1, 2, 1, 20, madC);
    r(g, 2, 22, 20, 1, madE); r(g, 22, 2, 1, 20, madE);
    for (const [x, y] of [[3, 3], [19, 3], [3, 19], [19, 19]]) { r(g, x, y, 2, 2, '#f2c46b'); r(g, x + 1, y + 1, 1, 1, '#7a3a12'); } // pregos
    r(g, 6, 5, 12, 1, madC); r(g, 6, 18, 12, 1, madE);
    r(g, 5, 6, 14, 12, esc); r(g, 6, 5, 12, 14, esc);
    r(g, 6, 6, 12, 12, fundo);
    return c.toDataURL();
  }

  // ---------------------------------------------------------- veículos
  function carroLateral(g, x, y, cor) {
    // 26x14 visto de lado
    r(g, x + 2, y + 12, 24, 2, P.sombra);
    caixa(g, x, y + 5, 26, 7, cor);
    caixa(g, x + 5, y, 15, 6, cor);
    r(g, x + 7, y + 1, 5, 4, P.vidro); r(g, x + 13, y + 1, 5, 4, P.vidro2);
    r(g, x + 1, y + 6, 24, 1, 'rgba(255,255,255,.25)');
    r(g, x + 24, y + 7, 2, 2, '#ffe9a0'); r(g, x, y + 7, 1, 2, '#e23b3b');
    for (const wx of [x + 4, x + 18]) { r(g, wx, y + 10, 5, 4, '#1c1c24'); r(g, wx + 2, y + 11, 1, 2, '#9a9aa6'); }
  }
  function carroFrente(g, x, y, cor, tras) {
    // 16x22 visto de frente (descendo) ou de trás (subindo)
    r(g, x + 2, y + 20, 14, 2, P.sombra);
    caixa(g, x, y + 2, 16, 18, cor);
    r(g, x + 2, y + 4, 12, 6, tras ? P.vidro2 : P.vidro); r(g, x + 3, y + 5, 3, 2, P.vidro3);
    r(g, x + 1, y + 11, 14, 1, 'rgba(0,0,0,.2)');
    r(g, x + 1, y + 14, 3, 2, tras ? '#e23b3b' : '#ffe9a0'); r(g, x + 12, y + 14, 3, 2, tras ? '#e23b3b' : '#ffe9a0');
    r(g, x + 5, y + 16, 6, 2, '#2a2a33');
    r(g, x, y + 19, 3, 3, '#1c1c24'); r(g, x + 13, y + 19, 3, 3, '#1c1c24');
  }
  function caminhao(g, x, y, cor) {
    r(g, x + 2, y + 16, 44, 2, P.sombra);
    caixa(g, x, y, 32, 14, cor); r(g, x + 2, y + 2, 28, 2, 'rgba(0,0,0,.08)');
    caixa(g, x + 32, y + 4, 12, 10, '#c43a3a'); r(g, x + 36, y + 6, 6, 4, P.vidro);
    for (const wx of [x + 4, x + 22, x + 36]) { r(g, wx, y + 13, 6, 5, '#1c1c24'); r(g, wx + 2, y + 15, 2, 1, '#9a9aa6'); }
  }
  function ambulancia(g, x, y) {
    caixa(g, x, y, 30, 13, '#f8f8f8'); caixa(g, x + 22, y + 3, 8, 10, '#f8f8f8'); r(g, x + 24, y + 4, 5, 4, P.vidro);
    r(g, x + 1, y + 6, 20, 2, '#e23b3b'); r(g, x + 8, y + 2, 4, 9, '#e23b3b'); r(g, x + 6, y + 4, 8, 4, '#e23b3b');
    r(g, x + 12, y - 2, 4, 2, '#3d8bd1');
    for (const wx of [x + 3, x + 21]) r(g, wx, y + 11, 5, 4, '#1c1c24');
  }
  function viatura(g, x, y) {
    carroLateral(g, x, y, '#f6f2e6'); r(g, x + 1, y + 8, 24, 2, '#2a3f73'); r(g, x + 9, y - 2, 3, 2, '#e23b3b'); r(g, x + 12, y - 2, 3, 2, '#3d8bd1');
  }
  function caminhaoBombeiro(g, x, y) {
    caixa(g, x, y + 2, 22, 14, '#e23b3b'); r(g, x + 15, y + 4, 5, 5, P.vidro); r(g, x + 1, y + 1, 14, 2, '#d8d8d8');
    r(g, x + 2, y + 10, 12, 1, '#f2c13a'); r(g, x + 2, y + 15, 5, 4, '#1c1c24'); r(g, x + 15, y + 15, 5, 4, '#1c1c24');
  }

  // --------------------------------------------------------- personagens
  function pessoa(camisa, pele, cabelo, calca, saia) {
    const [c, g] = canvas(10, 19);
    r(g, 2, 17, 7, 2, P.sombra);
    // cabeça
    r(g, 2, 1, 6, 6, pele); r(g, 2, 0, 6, 2, cabelo); r(g, 1, 1, 1, 4, cabelo); r(g, 8, 1, 1, 3, cabelo);
    r(g, 3, 4, 1, 1, '#2a1a10'); r(g, 6, 4, 1, 1, '#2a1a10');
    borda(g, 1, 0, 8, 8, 'rgba(51,36,28,.0)');
    // corpo
    r(g, 2, 7, 6, 6, camisa); r(g, 1, 8, 1, 4, camisa); r(g, 8, 8, 1, 4, camisa);
    r(g, 1, 12, 1, 1, pele); r(g, 8, 12, 1, 1, pele);
    if (saia) { r(g, 2, 12, 6, 3, calca); r(g, 3, 15, 1, 2, pele); r(g, 6, 15, 1, 2, pele); }
    else { r(g, 2, 13, 6, 2, calca); r(g, 2, 15, 2, 2, calca); r(g, 6, 15, 2, 2, calca); }
    r(g, 2, 17, 2, 1, '#2a2a33'); r(g, 6, 17, 2, 1, '#2a2a33');
    return c;
  }
  function prefeito() {
    const [c, g] = canvas(12, 22);
    r(g, 2, 20, 9, 2, P.sombra);
    r(g, 3, 1, 6, 6, '#d9a77a'); r(g, 3, 0, 6, 2, '#3a2a1a'); r(g, 2, 1, 1, 3, '#3a2a1a'); r(g, 9, 1, 1, 2, '#3a2a1a');
    r(g, 4, 4, 1, 1, '#2a1a10'); r(g, 7, 4, 1, 1, '#2a1a10'); r(g, 5, 6, 2, 1, '#a8603a');
    r(g, 2, 7, 8, 8, '#22263a'); r(g, 1, 8, 1, 6, '#22263a'); r(g, 10, 8, 1, 6, '#22263a');
    r(g, 5, 7, 2, 4, '#f6f2e6'); r(g, 5, 8, 2, 3, '#c43a3a');
    // faixa de prefeito verde e amarela
    for (let i = 0; i < 8; i++) r(g, 2 + i, 7 + i, 1, 2, i % 2 ? '#f2d33a' : '#2c9a48');
    r(g, 1, 14, 1, 1, '#d9a77a'); r(g, 10, 14, 1, 1, '#d9a77a');
    r(g, 3, 15, 2, 5, '#1a1a26'); r(g, 7, 15, 2, 5, '#1a1a26'); r(g, 3, 20, 2, 1, '#000'); r(g, 7, 20, 2, 1, '#000');
    return c;
  }
  function carro(cor, modo) {
    if (modo === 'h') { const [c, g] = canvas(26, 15); carroLateral(g, 0, 1, cor); return c; }
    const [c, g] = canvas(16, 22); carroFrente(g, 0, 0, cor, modo === 'tras'); return c;
  }
  function balao(positivo) {
    const [c, g] = canvas(22, 26);
    r(g, 2, 0, 18, 18, P.contorno); r(g, 0, 2, 22, 14, P.contorno);
    r(g, 2, 2, 18, 14, '#ffffff'); r(g, 3, 1, 16, 1, '#ffffff'); r(g, 1, 3, 1, 12, '#ffffff'); r(g, 20, 3, 1, 12, '#ffffff'); r(g, 3, 16, 16, 1, '#ffffff');
    r(g, 2, 14, 18, 2, '#dcdce4');
    r(g, 8, 18, 6, 2, P.contorno); r(g, 9, 20, 4, 2, P.contorno); r(g, 10, 22, 2, 2, P.contorno); r(g, 9, 17, 4, 2, '#ffffff'); r(g, 10, 19, 2, 2, '#ffffff');
    if (positivo) {
      r(g, 6, 5, 2, 3, '#2c9a48'); r(g, 14, 5, 2, 3, '#2c9a48');
      r(g, 5, 10, 2, 2, '#2c9a48'); r(g, 15, 10, 2, 2, '#2c9a48'); r(g, 7, 12, 8, 2, '#2c9a48');
    } else { r(g, 9, 3, 4, 8, '#e23b3b'); r(g, 9, 12, 4, 3, '#e23b3b'); }
    return c;
  }
  function confete() { const [c, g] = canvas(3, 3); r(g, 0, 0, 3, 3, '#fff'); return c; }
  function fumaca() { const [c, g] = canvas(12, 12); r(g, 2, 0, 8, 12, '#e8e8e8'); r(g, 0, 2, 12, 8, '#e8e8e8'); r(g, 2, 2, 4, 4, '#ffffff'); r(g, 6, 8, 4, 2, '#cfcfd6'); return c; }

  return { P, rng, canvas, r, borda, caixa, empresa, hd, hdDe, escala2x, grao, sombrasMacias, iniciarColeta, terminarColeta, icone, moldura, casa, sobrado, mansao, loja, fabrica, galpao, arvore, plantacao, predio, pessoa, prefeito, carro, balao, confete, fumaca, poste, cerca, flores, arbusto };
})();
