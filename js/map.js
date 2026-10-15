// =====================================================================
//  PREFEITO — mapa da cidade + cena Phaser (visão de gestão)
//  v2: tiles de 32px e visão 3/4 "deitada" (estilo Stardew Valley)
// =====================================================================

const Mapa = (() => {
  // ruas: avenidas têm 2 tiles de largura
  const RUAS_H = [
    { y: 20, h: 2, x1: 0, x2: 79, avenida: true },
    { y: 9,  h: 1, x1: 0, x2: 67 },
    { y: 31, h: 1, x1: 0, x2: 67 },
  ];
  const RUAS_V = [
    { x: 37, w: 2, y1: 0, y2: 49, avenida: true },
    { x: 14, w: 1, y1: 0, y2: 41 },
    { x: 27, w: 1, y1: 0, y2: 41 },
    { x: 47, w: 1, y1: 0, y2: 41 },
    { x: 58, w: 1, y1: 0, y2: 41 },
  ];
  const RIO = { y1: 42, y2: 44 };
  const FAIXAS_X = [[0, 13, 'oeste'], [15, 26, 'oeste'], [28, 36, 'centro'], [39, 46, 'centro'], [48, 57, 'distrito'], [59, 67, 'distrito']];
  const FAIXAS_Y = [[0, 8], [10, 19], [22, 30], [32, 41]];
  const CALC = 6; // largura da calçada em px

  // placas das cidades vizinhas (posição em tiles)
  const PLACAS = [
    { rival: 'ribeirao', x: 0.3, y: 18.6, seta: '←' },
    { rival: 'cerrado',  x: 73.5, y: 18.6, seta: '→' },
    { rival: 'monte',    x: 39.3, y: 0.5, seta: '↑' },
    { rival: 'pedra',    x: 39.3, y: 45.5, seta: '↓' },
    { rival: 'serra',    x: 59.2, y: 0.5, seta: '↑' },
  ];

  let grid = null;           // 0 grama, 1 rua, 2 água
  let ocupado = null;        // tiles com decoração/lote
  const casasPorBairro = {}; // posições (px) de casas para os balões
  const chamines = [];
  const blocosBairro = {};   // quarteirões de cada bairro (para o crescimento natural)
  let desenhos = [];         // decoração a desenhar em ordem de profundidade

  function idx(x, y) { return y * MAP_W + x; }
  function tipo(x, y) { if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return 1; return grid[idx(x, y)]; }

  function construirGrid() {
    grid = new Uint8Array(MAP_W * MAP_H);
    ocupado = new Uint8Array(MAP_W * MAP_H);
    for (let y = RIO.y1; y <= RIO.y2; y++) for (let x = 0; x < MAP_W; x++) grid[idx(x, y)] = 2;
    for (const r of RUAS_H) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x1; x <= r.x2; x++) grid[idx(x, y)] = 1;
    for (const r of RUAS_V) for (let x = r.x; x < r.x + r.w; x++) for (let y = r.y1; y <= r.y2; y++) grid[idx(x, y)] = 1;
    for (const l of LOTES_INICIAIS) for (let y = l.y; y < l.y + 3; y++) for (let x = l.x; x < l.x + 3; x++) ocupado[idx(x, y)] = 1;
  }

  function livre(x, y, w, h, bloco) {
    if (x + w - 1 > bloco[2] || y + h - 1 > bloco[3]) return false;
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (grid[idx(xx, yy)] !== 0 || ocupado[idx(xx, yy)]) return false;
    }
    return true;
  }
  function marcar(x, y, w, h) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) ocupado[idx(xx, yy)] = 1; }

  function bairroDoBloco(fx, fy) {
    if (fx === 'centro') return 'centro';
    if (fx === 'distrito') return 'distrito';
    return fy[0] < 20 ? 'nobre' : 'operaria';
  }

  function bairroNoTile(tx, ty) {
    for (const b of BAIRROS) { const [x1, y1, x2, y2] = b.rect; if (tx >= x1 && tx <= x2 && ty >= y1 && ty <= y2) return b.id; }
    return null;
  }

  // agenda um desenho; "base" é o y (px) do pé do objeto, usado para ordenar
  function agendar(base, fn) { desenhos.push({ base, fn }); }

  // ---------------------------------------------------- desenho do chão
  function desenharChao() {
    construirGrid();
    desenhos = [];
    const W = MAP_W * TILE, H = MAP_H * TILE;
    const [c, g] = Art.canvas(W, H);
    const { r, P } = Art;
    const rand = Art.rng(2029);

    // grama: cor base + manchas suaves de luz e sombra (o detalhe fino vem depois, em 2x)
    const [cD, gD] = Art.canvas(W, H);   // camada de decoração (casas, árvores, postes)
    r(g, 0, 0, W, H, P.grama);
    for (let i = 0; i < 900; i++) {
      const x = rand() * W, y = rand() * H, rr = 30 + rand() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, rr);
      const claro = rand() < 0.5;
      gr.addColorStop(0, claro ? 'rgba(150,205,90,.22)' : 'rgba(55,105,35,.20)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }

    // rio
    const ry1 = RIO.y1 * TILE, ry2 = (RIO.y2 + 1) * TILE;
    r(g, 0, ry1, W, ry2 - ry1, P.agua);
    r(g, 0, ry1 + 6, W, 10, P.agua2);
    r(g, 0, ry2 - 22, W, 16, P.agua3);
    for (let i = 0; i < 900; i++) {
      const x = Math.floor(rand() * W), y = ry1 + 10 + Math.floor(rand() * (ry2 - ry1 - 20));
      r(g, x, y, 4 + Math.floor(rand() * 8), 1, rand() < 0.5 ? P.agua2 : P.espuma);
    }
    // margens de terra e grama + taboas
    r(g, 0, ry1, W, 5, P.terra); r(g, 0, ry1 + 5, W, 2, P.terra2);
    r(g, 0, ry2 - 5, W, 5, P.terra); r(g, 0, ry2 - 7, W, 2, P.agua3);
    for (let x = 0; x < W; x += 6 + Math.floor(rand() * 30)) {
      if (rand() < 0.5) { r(g, x, ry1 + 2, 2, 9, '#4f8a2c'); r(g, x + 3, ry1 + 1, 2, 10, '#5e9c36'); r(g, x + 3, ry1 - 1, 2, 3, '#7a5634'); }
    }
    // vitórias-régias
    for (let i = 0; i < 60; i++) { const x = Math.floor(rand() * W), y = ry1 + 18 + Math.floor(rand() * 50); r(g, x, y, 6, 3, '#4f9e3f'); r(g, x + 1, y, 2, 1, '#6fbd52'); }

    // ruas
    for (let y = 0; y < MAP_H; y++) for (let x = 0; x < MAP_W; x++) {
      if (grid[idx(x, y)] !== 1) continue;
      const px = x * TILE, py = y * TILE;
      const ponte = y >= RIO.y1 && y <= RIO.y2;
      r(g, px, py, TILE, TILE, ponte ? '#8a857c' : P.asfalto);
      if (!ponte) for (let k = 0; k < 14; k++) r(g, px + Math.floor(rand() * 31), py + Math.floor(rand() * 31), 2, 1, rand() < .5 ? P.asfalto2 : P.asfalto3);
      else for (let k = 0; k < TILE; k += 8) r(g, px, py + k, TILE, 1, '#77726a');
      // calçadas com padrão de lajotas onde a rua encosta em grama
      const calcada = (cx, cy, w, h) => {
        r(g, cx, cy, w, h, P.calcada);
        for (let k = 0; k < Math.max(w, h); k += 8) { if (w > h) r(g, cx + k, cy, 1, h, P.calcada2); else r(g, cx, cy + k, w, 1, P.calcada2); }
      };
      if (tipo(x, y - 1) === 0) { calcada(px, py, TILE, CALC); r(g, px, py + CALC, TILE, 2, P.meioFio); }
      if (tipo(x, y + 1) === 0) { calcada(px, py + TILE - CALC, TILE, CALC); r(g, px, py + TILE - CALC - 2, TILE, 2, P.meioFio); }
      if (tipo(x - 1, y) === 0) { calcada(px, py, CALC, TILE); r(g, px + CALC, py, 2, TILE, P.meioFio); }
      if (tipo(x + 1, y) === 0) { calcada(px + TILE - CALC, py, CALC, TILE); r(g, px + TILE - CALC - 2, py, 2, TILE, P.meioFio); }
      if (ponte) {
        // guarda-corpo da ponte
        if (tipo(x - 1, y) === 2) { r(g, px, py, 4, TILE, '#d8d2c4'); r(g, px + 4, py, 1, TILE, '#6e6a63'); }
        if (tipo(x + 1, y) === 2) { r(g, px + TILE - 4, py, 4, TILE, '#d8d2c4'); r(g, px + TILE - 5, py, 1, TILE, '#6e6a63'); }
      }
    }
    // faixas amarelas das avenidas
    for (const rr of RUAS_H) if (rr.avenida) for (let x = rr.x1 * TILE; x < (rr.x2 + 1) * TILE; x += 24) {
      if (!RUAS_V.some(v => x + 12 > v.x * TILE - 4 && x < (v.x + v.w) * TILE + 4)) r(g, x, (rr.y + 1) * TILE - 2, 12, 3, P.faixa);
    }
    for (const rr of RUAS_V) if (rr.avenida) for (let y = rr.y1 * TILE; y < (rr.y2 + 1) * TILE; y += 24) {
      if (!RUAS_H.some(h => y + 12 > h.y * TILE - 4 && y < (h.y + h.h) * TILE + 4)) r(g, (rr.x + 1) * TILE - 2, y, 3, 12, P.faixa);
    }
    // faixas de pedestre no cruzamento central
    for (let i = 0; i < 6; i++) {
      r(g, 36 * TILE + 6, 20 * TILE + 4 + i * 10, 22, 5, '#ecece6');
      r(g, 39 * TILE + 4, 20 * TILE + 4 + i * 10, 22, 5, '#ecece6');
      r(g, 37 * TILE + 4 + i * 10, 19 * TILE + 6, 5, 22, '#ecece6');
      r(g, 37 * TILE + 4 + i * 10, 22 * TILE + 4, 5, 22, '#ecece6');
    }

    // postes nas calçadas das avenidas
    for (let x = 1; x < 68; x += 4) {
      if (tipo(x, 19) === 0) agendar(20 * TILE + 2, () => Art.poste(gD, x * TILE + 12, 20 * TILE - 26));
      if (tipo(x, 22) === 0) agendar(22 * TILE + 30, () => Art.poste(gD, x * TILE + 12, 22 * TILE + 2));
    }
    for (let y = 1; y < 42; y += 4) {
      if (tipo(36, y) === 0 && tipo(37, y) === 1) agendar(y * TILE + 28, () => Art.poste(gD, 37 * TILE + 0, y * TILE));
      if (tipo(39, y) === 0 && tipo(38, y) === 1) agendar(y * TILE + 28, () => Art.poste(gD, 38 * TILE + 24, y * TILE));
    }

    // decoração dos quarteirões
    for (const fx of FAIXAS_X) for (const fy of FAIXAS_Y) {
      const bloco = [fx[0], fy[0], fx[1], fy[1]];
      const bairro = bairroDoBloco(fx[2], fy);
      casasPorBairro[bairro] = casasPorBairro[bairro] || [];
      (blocosBairro[bairro] = blocosBairro[bairro] || []).push(bloco);
      decorarBloco(gD, bloco, bairro, rand);
    }

    // áreas bloqueadas: roça, mato e celeiro
    for (const b of BLOQUEADOS) {
      const [x1, y1, x2, y2] = b.rect;
      for (let y = y1; y <= y2; y += 3) for (let x = x1; x <= x2; x += 4) {
        if (tipo(x, y) !== 0) continue;
        const v = rand();
        if (v < 0.5 && livreBloq(x, y, 4, 3, b.rect)) { const xx = x, yy = y; agendar(yy * TILE, () => Art.plantacao(gD, xx * TILE + 4, yy * TILE + 4, 4 * TILE - 8, 3 * TILE - 8, rand)); }
        else if (v < 0.85) { const ax = x * TILE + Math.floor(rand() * 90), ay = y * TILE + 16 + Math.floor(rand() * 50); if (tipo(Math.floor((ax + 16) / TILE), Math.floor((ay + 30) / TILE)) === 0 && tipo(Math.floor((ax + 30) / TILE), Math.floor((ay + 30) / TILE)) === 0) agendar(ay + 32, () => Art.arvore(gD, ax, ay, rand)); }
      }
    }

    // desenha tudo de trás para a frente (efeito de profundidade)
    desenhos.sort((a, b) => a.base - b.base);
    Art.iniciarColeta();
    for (const d of desenhos) d.fn();
    const sombras = Art.terminarColeta();
    return montarBlocos(c, cD, sombras, rand);
  }

  // ------------------------------------------- composição em alta resolução
  // o mapa vira 4 blocos 2x: chão suavizado + detalhe fino + sombras macias + decoração
  const BLOCO_W = MAP_W * TILE / 2, BLOCO_H = MAP_H * TILE / 2;
  function montarBlocos(cBase, cDec, sombras, rand) {
    const blocos = [];
    for (let by = 0; by < 2; by++) for (let bx = 0; bx < 2; bx++) {
      const ox = bx * BLOCO_W, oy = by * BLOCO_H;
      const c2 = Art.escala2x(cBase, ox, oy, BLOCO_W, BLOCO_H);
      const g2 = c2.getContext('2d');
      detalheChao(g2, ox, oy, rand);
      const minhas = sombras.filter(s => s.x + s.w > ox - 8 && s.x < ox + BLOCO_W + 8 && s.y + s.h > oy - 8 && s.y < oy + BLOCO_H + 8)
        .map(s => ({ x: s.x - ox, y: s.y - oy, w: s.w, h: s.h }));
      Art.sombrasMacias(g2, minhas, 2, 4, 0.32);
      const d2 = Art.escala2x(cDec, ox, oy, BLOCO_W, BLOCO_H);
      Art.grao(d2.getContext('2d'), d2.width, d2.height, Art.rng(bx * 7 + by * 13 + 5), 0.05, 0.06);
      g2.drawImage(d2, 0, 0);
      // véu escuro e borda tracejada sobre as áreas bloqueadas
      for (const b of BLOQUEADOS) {
        const [x1, y1, x2, y2] = b.rect;
        const X = (x1 * TILE - ox) * 2, Y = (y1 * TILE - oy) * 2, Wb = (x2 - x1 + 1) * TILE * 2, Hb = (y2 - y1 + 1) * TILE * 2;
        if (X > c2.width || Y > c2.height || X + Wb < 0 || Y + Hb < 0) continue;
        g2.fillStyle = 'rgba(28,20,40,.45)'; g2.fillRect(X, Y, Wb, Hb);
        g2.fillStyle = 'rgba(255,240,210,.65)';
        for (let x = X; x < X + Wb; x += 28) { g2.fillRect(x, Y, 14, 3); g2.fillRect(x, Y + Hb - 3, 14, 3); }
        for (let y = Y; y < Y + Hb; y += 28) { g2.fillRect(X, y, 3, 14); g2.fillRect(X + Wb - 3, y, 3, 14); }
      }
      blocos.push({ canvas: c2, x: ox, y: oy });
    }
    return blocos;
  }

  // detalhe fino em 2x: folhas de grama, flores, grão do asfalto, brilho da água
  function detalheChao(g, ox, oy, rand) {
    const T2 = TILE * 2;
    const tons = ['#5c9a30', '#7fc048', '#4c8628', '#93d058', '#69aa3a'];
    const flores = ['#fff6e0', '#f7d23a', '#f2668a', '#b98af0', '#ffffff'];
    const tx0 = Math.floor(ox / TILE), ty0 = Math.floor(oy / TILE);
    for (let ty = ty0; ty < ty0 + BLOCO_H / TILE; ty++) for (let tx = tx0; tx < tx0 + BLOCO_W / TILE; tx++) {
      const X = (tx * TILE - ox) * 2, Y = (ty * TILE - oy) * 2, t = tipo(tx, ty);
      if (t === 0) {
        for (let i = 0; i < 46; i++) {
          const x = X + Math.floor(rand() * T2), y = Y + Math.floor(rand() * T2);
          g.fillStyle = tons[Math.floor(rand() * tons.length)];
          const alt = 2 + Math.floor(rand() * 3);
          g.fillRect(x, y, 1, alt);
          if (rand() < 0.35) { g.fillRect(x - 1, y + 1, 1, alt - 1); g.fillRect(x + 1, y + 1, 1, alt - 1); }
        }
        if (rand() < 0.22) {
          const x = X + Math.floor(rand() * (T2 - 8)), y = Y + Math.floor(rand() * (T2 - 8));
          const cor = flores[Math.floor(rand() * flores.length)];
          for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) { g.fillStyle = cor; g.fillRect(x + dx, y + dy, 1, 1); }
          g.fillStyle = '#f2c13a'; g.fillRect(x + 1, y + 1, 1, 1);
        }
      } else if (t === 1) {
        for (let i = 0; i < 40; i++) {
          g.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.12)';
          g.fillRect(X + Math.floor(rand() * T2), Y + Math.floor(rand() * T2), rand() < .3 ? 2 : 1, 1);
        }
        if (rand() < 0.04) { // rachadura
          g.fillStyle = 'rgba(30,28,34,.45)';
          let x = X + 10 + rand() * 40, y = Y + 10 + rand() * 40;
          for (let k = 0; k < 10; k++) { g.fillRect(Math.floor(x), Math.floor(y), 1, 1); x += rand() * 2 - 0.5; y += rand() * 2 - 0.3; }
        }
      } else if (t === 2) {
        for (let i = 0; i < 6; i++) {
          g.fillStyle = rand() < 0.6 ? 'rgba(255,255,255,.35)' : 'rgba(190,230,255,.5)';
          g.fillRect(X + Math.floor(rand() * T2), Y + 12 + Math.floor(rand() * (T2 - 24)), 3 + Math.floor(rand() * 8), 1);
        }
      }
    }
  }

  function livreBloq(x, y, w, h, rect) {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
      if (xx > rect[2] || yy > rect[3] || xx >= MAP_W || yy >= MAP_H) return false;
      if (grid[idx(xx, yy)] !== 0) return false;
    }
    return true;
  }

  function decorarBloco(g, bloco, bairro, rand) {
    const [x1, y1, x2, y2] = bloco;
    const casa = (x, y, w, h, fn) => {
      marcar(x, y, w, h);
      const sx = x * TILE, sy = y * TILE;
      const sub = Art.rng(Math.floor(rand() * 1e9));
      agendar((y + h) * TILE, () => fn(g, sx, sy, sub));
      casasPorBairro[bairro].push({ x: (x + w / 2) * TILE, y: y * TILE + 12 });
    };
    if (bairro === 'distrito') {
      for (let y = y1; y <= y2; y += 3) for (let x = x1; x <= x2; x += 4) {
        const v = rand();
        if (v < 0.35 && livre(x, y, 4, 3, bloco)) { casa(x, y, 4, 3, Art.fabrica); chamines.push({ x: x * TILE + 106, y: y * TILE }); }
        else if (v < 0.55 && livre(x, y, 3, 2, bloco)) casa(x, y, 3, 2, Art.galpao);
        else if (v < 0.65 && livre(x, y, 2, 2, bloco)) casa(x, y, 2, 2, Art.casa);
      }
    } else if (bairro === 'nobre') {
      for (let y = y1; y <= y2; y += 3) for (let x = x1; x <= x2; x += 3) {
        if (rand() < 0.55 && livre(x, y, 3, 3, bloco)) casa(x, y, 3, 3, Art.mansao);
      }
    } else {
      const fn = bairro === 'centro' ? Art.sobrado : Art.casa;
      const dens = bairro === 'centro' ? 0.62 : 0.55;
      for (let y = y1; y <= y2; y += 2) for (let x = x1; x <= x2; x += 2) {
        if (rand() < dens && livre(x, y, 2, 2, bloco)) casa(x, y, 2, 2, fn);
      }
    }
    // sobras viram árvores (ou arbustos rente à rua)
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) {
      if (grid[idx(x, y)] !== 0 || ocupado[idx(x, y)]) continue;
      const p = bairro === 'nobre' ? 0.16 : bairro === 'distrito' ? 0.07 : 0.09;
      if (rand() < p) {
        ocupado[idx(x, y)] = 2;
        const sx = x * TILE, sy = y * TILE, sub = Art.rng(Math.floor(rand() * 1e9));
        if (y === y1) agendar(sy + 30, () => { Art.arbusto(g, sx + 4, sy + 14, 24, 14); Art.flores(g, sx + 8, sy + 10, sub, 3); });
        else agendar(sy + 31, () => Art.arvore(g, sx, sy, sub, bairro === 'nobre' && sub() < 0.3 ? 'coqueiro' : undefined));
      }
    }
  }

  // ---------------------------------------- crescimento natural da cidade
  // marca um espaço já usado (jogo carregado) ou acha um espaço livre no bairro
  function marcarCelula(x, y, w, h) { if (ocupado) marcar(x, y, w, h); }
  function reservarCelula(bairro, w, h, seed) {
    const blocos = blocosBairro[bairro]; if (!blocos || !ocupado) return null;
    const rnd = Art.rng(seed || 1);
    const cands = [];
    for (const b of blocos) for (let y = b[1]; y <= b[3] - h + 1; y++) for (let x = b[0]; x <= b[2] - w + 1; x++) cands.push([x, y, b]);
    for (let i = cands.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [cands[i], cands[j]] = [cands[j], cands[i]]; }
    const cabe = (x, y, b, aceitaArvore) => {
      if (x + w - 1 > b[2] || y + h - 1 > b[3]) return false;
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
        const o = ocupado[idx(xx, yy)];
        if (grid[idx(xx, yy)] !== 0 || (o && !(aceitaArvore && o === 2))) return false;
      }
      return true;
    };
    for (const pass of [false, true]) for (const [x, y, b] of cands) {
      if (cabe(x, y, b, pass)) { marcar(x, y, w, h); casasPorBairro[bairro] && casasPorBairro[bairro].push({ x: (x + w / 2) * TILE, y: y * TILE + 12 }); return { x, y }; }
    }
    return null;
  }

  // faixas de trânsito para carros e pedestres
  function faixas() {
    const carros = [], pedestres = [];
    for (const r of RUAS_H) {
      const xa = r.x1 * TILE, xb = (r.x2 + 1) * TILE;
      if (r.avenida) { carros.push({ eixo: 'x', pos: r.y * TILE + 9, a: xa, b: xb, dir: -1 }); carros.push({ eixo: 'x', pos: (r.y + 1) * TILE + 6, a: xa, b: xb, dir: 1 }); }
      else carros.push({ eixo: 'x', pos: r.y * TILE + 8, a: xa, b: xb, dir: Math.random() < .5 ? 1 : -1 });
      pedestres.push({ eixo: 'x', pos: r.y * TILE - 13, a: xa, b: xb });
      pedestres.push({ eixo: 'x', pos: (r.y + r.h) * TILE - 19, a: xa, b: xb });
    }
    for (const r of RUAS_V) {
      const ya = r.y1 * TILE, yb = (r.y2 + 1) * TILE;
      if (r.avenida) { carros.push({ eixo: 'y', pos: r.x * TILE + 8, a: ya, b: yb, dir: 1 }); carros.push({ eixo: 'y', pos: (r.x + 1) * TILE + 8, a: ya, b: yb, dir: -1 }); }
      else carros.push({ eixo: 'y', pos: r.x * TILE + 8, a: ya, b: yb, dir: Math.random() < .5 ? 1 : -1 });
      const fim = Math.min(yb, RIO.y1 * TILE - 24);
      pedestres.push({ eixo: 'y', pos: r.x * TILE - 2, a: ya, b: fim });
      pedestres.push({ eixo: 'y', pos: (r.x + r.w) * TILE - 8, a: ya, b: fim });
    }
    return { carros, pedestres };
  }

  return { desenharChao, bairroNoTile, casasPorBairro, chamines, faixas, PLACAS, RIO, BLOCO_W, BLOCO_H, reservarCelula, marcarCelula };
})();

// =====================================================================
//  Cena principal
// =====================================================================
class CidadeScene extends Phaser.Scene {
  constructor() { super('cidade'); }

  create() {
    const W = MAP_W * TILE, H = MAP_H * TILE;
    // texturas
    // todas as texturas são geradas em 2x (alta resolução) e exibidas com escala 0.5
    const blocos = Mapa.desenharChao();
    blocos.forEach((b, i) => this.textures.addCanvas('chao' + i, b.canvas));
    for (const t of [...Object.keys(PREDIOS), ...Object.keys(ESPECIAIS), 'lote_publico', 'lote_particular', 'obra']) this.textures.addCanvas('p_' + t, Art.hdDe(() => Art.predio(t), { seed: t.length }));
    this.textures.addCanvas('prefeito', Art.hdDe(() => Art.prefeito(), { grao: false }));
    this.textures.addCanvas('balao', Art.hdDe(() => Art.balao(false), { grao: false }));
    this.textures.addCanvas('balao_bom', Art.hdDe(() => Art.balao(true), { grao: false }));
    this.textures.addCanvas('confete', Art.hdDe(() => Art.confete(), { grao: false }));
    this.textures.addCanvas('fumaca', Art.hdDe(() => Art.fumaca(), { grao: false }));
    this.textures.addCanvas('nuvem', this.texturaNuvem());
    { const [c, g] = Art.canvas(8, 2); g.fillStyle = '#ffffff'; g.fillRect(0, 0, 8, 2); this.textures.addCanvas('brilho', c); }
    const corCarros = ['#d64b4b', '#3d8bd1', '#f4f1e8', '#2a2a33', '#e0a82e', '#4caf6a', '#9a9aa6'];
    corCarros.forEach((cor, i) => {
      this.textures.addCanvas('car_h' + i, Art.hdDe(() => Art.carro(cor, 'h'), { grao: false }));
      this.textures.addCanvas('car_f' + i, Art.hdDe(() => Art.carro(cor, 'frente'), { grao: false }));
      this.textures.addCanvas('car_t' + i, Art.hdDe(() => Art.carro(cor, 'tras'), { grao: false }));
    });
    const camisas = ['#e23b3b', '#3d8bd1', '#f2d33a', '#2c9a48', '#f08a5d', '#9a6bbd', '#f4f1e8', '#e66a8a'];
    const peles = ['#f1c9a5', '#d9a77a', '#a86f4c', '#7a4a2e', '#5c3a24'];
    const cabelos = ['#2a1a10', '#6b4a2a', '#1c1c24', '#c99a4a', '#8a3a1a'];
    const calcas = ['#2f3b5a', '#4a4a52', '#5a3a2a', '#3d6b8f'];
    for (let i = 0; i < 16; i++) this.textures.addCanvas('pes' + i, Art.hdDe(() => Art.pessoa(camisas[i % camisas.length], peles[(i * 3) % peles.length], cabelos[(i * 7) % cabelos.length], calcas[i % calcas.length], i % 4 === 1), { grao: false }));

    blocos.forEach((b, i) => this.add.image(b.x, b.y, 'chao' + i).setOrigin(0).setScale(0.5).setDepth(0));
    this.ambiente(W, H);
    this.criarLuz();

    // nomes dos bairros (aparecem com zoom afastado)
    this.rotulos = [];
    for (const b of BAIRROS) {
      const [x1, y1, x2, y2] = b.rect;
      const t = this.add.text((x1 + x2 + 1) / 2 * TILE, (y1 + y2 + 1) / 2 * TILE, b.nome.toUpperCase(), { fontFamily: '"Nunito", "Segoe UI", sans-serif', fontSize: '30px', fontStyle: 'bold', color: '#ffffff', stroke: '#1c1c24', strokeThickness: 8 })
        .setOrigin(0.5).setResolution(2).setDepth(80).setAlpha(0);
      this.rotulos.push(t);
    }
    for (const b of BLOQUEADOS) {
      const [x1, y1, x2, y2] = b.rect;
      const [lx, ly] = b.rotulo || [(x1 + x2 + 1) / 2, (y1 + y2 + 1) / 2];
      this.add.text(lx * TILE, ly * TILE, b.nome.toUpperCase() + '\nexpansão futura', { fontFamily: '"Nunito", "Segoe UI", sans-serif', fontSize: '22px', color: '#f6f2e6', align: 'center', stroke: '#1c1c24', strokeThickness: 6 })
        .setOrigin(0.5).setResolution(2).setDepth(5);
    }
    // placas das cidades rivais
    for (const p of Mapa.PLACAS) {
      const rv = RIVAIS.find(r => r.id === p.rival);
      const t = this.add.text(p.x * TILE + 4, p.y * TILE + 3, `${p.seta} ${rv.nome} ${rv.km} km`, { fontFamily: '"Nunito", "Segoe UI", sans-serif', fontSize: '15px', color: '#ffffff', backgroundColor: '#1f7a3e', padding: { x: 5, y: 1 } })
        .setResolution(2).setDepth(41);
      this.add.rectangle(t.x - 2, t.y - 2, t.width + 4, t.height + 4, 0xf6f2e6).setOrigin(0).setDepth(40);
    }

    // lotes
    this.spritesLote = {};
    this.grafObras = this.add.graphics().setDepth(30);
    this.destaque = this.add.graphics().setDepth(31);
    this.selecionado = null;

    // trânsito
    this.faixas = Mapa.faixas();
    this.agentes = [];
    for (let i = 0; i < 18; i++) this.novoCarro();
    for (let i = 0; i < 26; i++) this.novoPedestre();

    // balões da população
    this.baloes = [];
    this.tempoBalao = 4;

    // fumaça das fábricas
    this.time.addEvent({ delay: 900, loop: true, callback: () => this.fumacinha() });

    // câmera
    const cam = this.cameras.main;
    this.limites = { x: -200, y: -120, w: W + 260, h: H + 180 }; // folga para a barra e o menu
    cam.setBounds(this.limites.x, this.limites.y, this.limites.w, this.limites.h);
    cam.setBackgroundColor('#2a3a24');
    cam.setRoundPixels(true);
    this.ajustarZoomInicial();
    cam.centerOn(40 * TILE, 19 * TILE);
    this.controles();
    this.scale.on('resize', () => this.limitarZoom());

    this.atualizarLotes();
    Sim.on('mudou', () => this.atualizarLotes());
    Sim.on('obra', () => this.atualizarLotes());
    Sim.on('inicio', () => { this.atualizarLotes(); this.atualizarCrescimento(); });
    Sim.on('crescimento', () => this.atualizarCrescimento());
    Sim.on('inauguracao', l => this.inauguracao(l));
    Sim.on('mes', () => { this.atualizarLotes(); this.atualizarCrescimento(); });
    Sim.on('acordo', () => { this.atualizarLotes(); this.atualizarCrescimento(); });
    Sim.on('inauguracaoEmpresa', e => { this.atualizarLotes(); const l = Sim.S.lotes.find(x => x.id === e.loteId); if (l) this.inauguracao(l); });
    window.Cena = this;
  }

  texturaNuvem() {
    const [c, g] = Art.canvas(420, 260);
    g.filter = 'blur(22px)'; g.fillStyle = '#1e2a40';
    for (const [x, y, rx, ry] of [[150, 140, 90, 55], [230, 120, 100, 65], [300, 150, 80, 50], [200, 170, 120, 45]]) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); }
    return c;
  }
  ambiente(W, H) {
    // sombras de nuvens passando devagar sobre a cidade
    this.nuvens = [];
    for (let i = 0; i < 4; i++) {
      const n = this.add.image(Math.random() * W, Math.random() * H, 'nuvem').setDepth(58).setAlpha(0.10 + Math.random() * 0.05).setScale(1.4 + Math.random());
      n.vel = 6 + Math.random() * 6;
      this.nuvens.push(n);
    }
    // brilhos no rio
    const ry1 = Mapa.RIO.y1 * TILE, ry2 = (Mapa.RIO.y2 + 1) * TILE;
    for (let i = 0; i < 36; i++) {
      const b = this.add.image(Math.random() * W, ry1 + 10 + Math.random() * (ry2 - ry1 - 20), 'brilho').setScale(0.5 + Math.random() * 0.5, 0.5).setDepth(1).setAlpha(0);
      this.tweens.add({ targets: b, alpha: { from: 0, to: 0.7 }, yoyo: true, duration: 700 + Math.random() * 900, delay: Math.random() * 4000, repeat: -1, repeatDelay: Math.random() * 3000 });
    }
  }

  // luz do dia e vinheta desenhadas dentro do Phaser (mais leve que camadas HTML por cima do mapa)
  criarLuz() {
    const [c, g] = Art.canvas(256, 160);
    const gr = g.createRadialGradient(128, 72, 10, 128, 72, 150);
    gr.addColorStop(0, 'rgba(255,214,150,0.05)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(40,18,0,0.30)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 160);
    this.textures.addCanvas('vinheta', c);
    this.vinheta = this.add.image(0, 0, 'vinheta').setScrollFactor(0).setDepth(901);
    this.corLuz = '';
  }
  ajustarLuz() {
    const cam = this.cameras.main, w = this.scale.width / cam.zoom + 4, h = this.scale.height / cam.zoom + 4;
    this.vinheta.setPosition(this.scale.width / 2, this.scale.height / 2).setDisplaySize(w, h);
  }

  ajustarZoomInicial() {
    const z = Phaser.Math.Clamp(this.scale.width / (24 * TILE), 0.9, 2);
    this.cameras.main.setZoom(z);
    this.limitarZoom();
  }
  zoomMin() { return Math.max(this.scale.width / this.limites.w, this.scale.height / this.limites.h); }
  zoomMax() { return 2; } // texturas 2x: zoom 2 mostra cada pixel 1:1
  limitarZoom() { const cam = this.cameras.main; cam.setZoom(Phaser.Math.Clamp(cam.zoom, this.zoomMin(), this.zoomMax())); }

  controles() {
    const cam = this.cameras.main;
    this.input.addPointer(1);
    let arrasto = null, pinca = null;
    this.input.on('pointerdown', p => {
      if (this.input.pointer1.isDown && this.input.pointer2.isDown) {
        pinca = { d: Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y), z: cam.zoom };
        arrasto = null; return;
      }
      arrasto = { x: p.x, y: p.y, sx: cam.scrollX, sy: cam.scrollY, moveu: false };
    });
    this.input.on('pointermove', p => {
      if (pinca && this.input.pointer1.isDown && this.input.pointer2.isDown) {
        const d = Phaser.Math.Distance.Between(this.input.pointer1.x, this.input.pointer1.y, this.input.pointer2.x, this.input.pointer2.y);
        cam.setZoom(Phaser.Math.Clamp(pinca.z * d / pinca.d, this.zoomMin(), this.zoomMax())); return;
      }
      if (arrasto && p.isDown) {
        const dx = p.x - arrasto.x, dy = p.y - arrasto.y;
        if (Math.abs(dx) + Math.abs(dy) > 6) arrasto.moveu = true;
        if (arrasto.moveu) { cam.scrollX = arrasto.sx - dx / cam.zoom; cam.scrollY = arrasto.sy - dy / cam.zoom; }
      }
      this.hover(p);
    });
    this.input.on('pointerup', p => {
      if (pinca) { if (!this.input.pointer1.isDown && !this.input.pointer2.isDown) pinca = null; arrasto = null; return; }
      if (arrasto && !arrasto.moveu) this.clique(p);
      arrasto = null;
    });
    this.input.on('wheel', (p, objs, dx, dy) => {
      const antes = cam.getWorldPoint(p.x, p.y);
      cam.setZoom(Phaser.Math.Clamp(cam.zoom * (dy > 0 ? 0.88 : 1.14), this.zoomMin(), this.zoomMax()));
      const depois = cam.getWorldPoint(p.x, p.y);
      cam.scrollX += antes.x - depois.x; cam.scrollY += antes.y - depois.y;
    });
    // false = não "sequestra" as teclas: assim dá para digitar W, A, S, D nos campos de texto
    this.teclas = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,PLUS,MINUS,NUMPAD_ADD,NUMPAD_SUBTRACT', false);
    this.input.keyboard.disableGlobalCapture();
    const zoom = f => { if (!this.digitando()) cam.setZoom(Phaser.Math.Clamp(cam.zoom * f, this.zoomMin(), this.zoomMax())); };
    this.input.keyboard.on('keydown-PLUS', () => zoom(1.15));
    this.input.keyboard.on('keydown-NUMPAD_ADD', () => zoom(1.15));
    this.input.keyboard.on('keydown-MINUS', () => zoom(1 / 1.15));
    this.input.keyboard.on('keydown-NUMPAD_SUBTRACT', () => zoom(1 / 1.15));
  }

  // true quando o jogador está escrevendo num campo de texto ou na tela inicial
  digitando() {
    const a = document.activeElement;
    return (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) || !document.querySelector('#inicio').hidden;
  }

  loteNoPonto(wx, wy) {
    const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
    if (!Sim.S) return null;
    return Sim.S.lotes.find(l => tx >= l.x && tx < l.x + 3 && ty >= l.y && ty < l.y + 3) || null;
  }

  hover(p) {
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const l = this.loteNoPonto(w.x, w.y);
    const b = this.baloes.find(bb => bb.spr.getBounds().contains(w.x, w.y));
    this.hoverLote = l;
    this.game.canvas.style.cursor = (l || b) ? 'pointer' : 'grab';
  }

  clique(p) {
    if (!Sim.S || UI.bloqueado()) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    const b = this.baloes.find(bb => bb.spr.getBounds().contains(w.x, w.y));
    if (b) { UI.abrirVoz(b.msg); this.removerBalao(b); return; }
    const l = this.loteNoPonto(w.x, w.y);
    if (l) { this.selecionado = l.id; UI.abrirLote(l.id); return; }
    const bairro = Mapa.bairroNoTile(Math.floor(w.x / TILE), Math.floor(w.y / TILE));
    if (bairro) UI.abrirBairro(bairro);
  }

  focar(l) {
    this.cameras.main.pan((l.x + 1.5) * TILE, (l.y + 1.5) * TILE, 600, 'Sine.easeInOut');
  }

  atualizarLotes() {
    const lotes = Sim.S ? Sim.S.lotes : LOTES_INICIAIS.map(l => ({ ...l, predio: l.ocupado || null }));
    for (const l of lotes) {
      let key;
      const emp = l.empresa && Sim.S ? Sim.S.empresas.find(e => e.id === l.empresa) : null;
      if (emp && emp.status === 'instalacao') key = 'p_obra';
      else if (emp && emp.status === 'operando') {
        key = 'emp_' + emp.id;
        if (!this.textures.exists(key)) this.textures.addCanvas(key, Art.hdDe(() => Art.empresa(emp.sprite || 'escritorio', emp.cor, emp.id.length * 977 + emp.catId.length)));
      }
      else if (l.obra) key = 'p_obra';
      else if (l.predio) key = 'p_' + l.predio;
      else key = l.tipo === 'particular' ? 'p_lote_particular' : 'p_lote_publico';
      let s = this.spritesLote[l.id];
      if (!s) { s = this.add.image(l.x * TILE, l.y * TILE, key).setOrigin(0).setScale(0.5).setDepth(10 + l.y * 0.01); this.spritesLote[l.id] = s; }
      else if (s.texture.key !== key) s.setTexture(key);
    }
  }

  // casas e lojas que surgem sozinhas conforme a cidade cresce
  atualizarCrescimento() {
    if (!Sim.S) return;
    if (!this.spritesCres) this.spritesCres = {};
    const itens = Sim.S.crescimento || [];
    const vivos = new Set();
    const TAM = { casa: [2, 2], sobrado: [2, 2], loja: [2, 2], mansao: [3, 3] };
    // primeiro marca o que já tem lugar (jogo carregado), depois acha lugar para os novos
    for (const it of itens) if (it.x != null && it.x >= 0 && !this.spritesCres[it.id]) Mapa.marcarCelula(it.x, it.y, ...TAM[it.tipo]);
    for (const it of itens) {
      vivos.add(it.id);
      if (this.spritesCres[it.id]) continue;
      let novo = false;
      if (it.x == null) {
        const c = Mapa.reservarCelula(it.bairro, ...TAM[it.tipo], it.seed);
        if (!c) { it.x = -1; it.y = -1; continue; }
        it.x = c.x; it.y = c.y; novo = true;
      }
      if (it.x < 0) continue;
      const variante = it.tipo === 'loja' ? (it.cor || '') + (it.seed % 3) : it.seed % 6;
      const key = 'cres_' + it.tipo + '_' + variante;
      if (!this.textures.exists(key)) {
        const [w, h] = TAM[it.tipo];
        const rand = Art.rng(it.seed % 6 + 11);
        this.textures.addCanvas(key, Art.hd(w * TILE, h * TILE, g => {
          if (it.tipo === 'loja') Art.loja(g, 0, 0, rand, it.cor);
          else Art[it.tipo](g, 0, 0, rand);
        }, { seed: it.seed % 97 }));
      }
      const spr = this.add.image(it.x * TILE, it.y * TILE, key).setOrigin(0).setScale(0.5).setDepth(10 + it.y * 0.01);
      this.spritesCres[it.id] = spr;
      if (novo) {
        spr.setAlpha(0); spr.y -= 10;
        this.tweens.add({ targets: spr, alpha: 1, y: it.y * TILE, duration: 700, ease: 'Bounce.easeOut' });
      }
    }
    for (const id in this.spritesCres) if (!vivos.has(id)) { this.spritesCres[id].destroy(); delete this.spritesCres[id]; }
  }

  // ------------------------------------------------------------ trânsito
  texturaCarro(f, cor) {
    if (f.eixo === 'x') return 'car_h' + cor;
    return (f.dir > 0 ? 'car_f' : 'car_t') + cor;
  }
  novoCarro() {
    const f = Phaser.Utils.Array.GetRandom(this.faixas.carros);
    const cor = Math.floor(Math.random() * 7);
    const spr = this.add.image(0, 0, this.texturaCarro(f, cor)).setOrigin(0).setScale(0.5).setDepth(20);
    spr.setFlipX(f.eixo === 'x' && f.dir < 0);
    const ag = { tipo: 'carro', spr, f, t: f.a + Math.random() * (f.b - f.a), vel: 50 + Math.random() * 40 };
    this.agentes.push(ag);
    this.posicionar(ag);
  }
  novoPedestre() {
    const f = Phaser.Utils.Array.GetRandom(this.faixas.pedestres);
    const spr = this.add.image(0, 0, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(21);
    const ag = { tipo: 'pessoa', spr, f, t: f.a + Math.random() * (f.b - f.a), vel: 12 + Math.random() * 12, dir: Math.random() < .5 ? 1 : -1, fase: Math.random() * 10 };
    spr.setFlipX(ag.dir < 0);
    this.agentes.push(ag);
    this.posicionar(ag);
  }
  posicionar(ag) {
    if (ag.f.eixo === 'x') { ag.spr.x = ag.t; ag.spr.y = ag.f.pos; } else { ag.spr.x = ag.f.pos; ag.spr.y = ag.t; }
    ag.spr.setDepth((ag.tipo === 'carro' ? 20 : 21) + ag.spr.y / 100000);
  }
  moverAgentes(dt, vel) {
    const fator = vel === 0 ? 0 : Math.min(2.2, 0.8 + vel * 0.3);
    for (const ag of this.agentes) {
      const dir = ag.tipo === 'carro' ? ag.f.dir : ag.dir;
      ag.t += dir * ag.vel * dt * fator;
      if (ag.t < ag.f.a - 30 || ag.t > ag.f.b + 8) {
        const lista = ag.tipo === 'carro' ? this.faixas.carros : this.faixas.pedestres;
        ag.f = Phaser.Utils.Array.GetRandom(lista);
        if (ag.tipo === 'carro') {
          ag.spr.setTexture(this.texturaCarro(ag.f, Math.floor(Math.random() * 7))).setFlipX(ag.f.eixo === 'x' && ag.f.dir < 0);
          ag.t = ag.f.dir > 0 ? ag.f.a - 26 : ag.f.b;
        } else { ag.dir = Math.random() < .5 ? 1 : -1; ag.t = ag.dir > 0 ? ag.f.a : ag.f.b; ag.spr.setFlipX(ag.dir < 0); }
      }
      this.posicionar(ag);
      if (ag.tipo === 'pessoa' && fator > 0) { ag.fase += dt * 9; if (Math.sin(ag.fase) > 0) ag.spr.y -= 1; }
    }
  }

  fumacinha() {
    if (!Jogo.rodando() || Jogo.velocidade === 0) return;
    for (const ch of Mapa.chamines) {
      if (Math.random() < 0.5) continue;
      const s = this.add.image(ch.x, ch.y - 4, 'fumaca').setScale(0.5).setDepth(25).setAlpha(0.85);
      this.tweens.add({ targets: s, y: ch.y - 56, x: ch.x + 14 + Math.random() * 12, alpha: 0, scale: 1.1, duration: 2800, onComplete: () => s.destroy() });
    }
  }

  // --------------------------------------------------------------- balões
  criarBalao() {
    const msg = Sim.vozDoPovo();
    const casas = Mapa.casasPorBairro[msg.bairro];
    if (!casas || !casas.length) return;
    const pos = Phaser.Utils.Array.GetRandom(casas);
    const spr = this.add.image(pos.x - 11, pos.y - 26, msg.positivo ? 'balao_bom' : 'balao').setOrigin(0).setScale(0.5).setDepth(60);
    this.tweens.add({ targets: spr, y: spr.y - 5, yoyo: true, repeat: -1, duration: 650, ease: 'Sine.easeInOut' });
    this.baloes.push({ spr, msg, vida: 45 });
    UI.novaVoz(msg);
  }
  removerBalao(b) { b.spr.destroy(); this.baloes = this.baloes.filter(x => x !== b); }

  // ------------------------------------------------------------ inauguração
  inauguracao(l) {
    const cx = (l.x + 1.5) * TILE, by = (l.y + 3) * TILE;
    this.focar(l);
    const grupo = [];
    grupo.push(this.add.image(cx - 6, by - 26, 'prefeito').setOrigin(0).setScale(0.5).setDepth(70));
    for (let i = 0; i < 12; i++) {
      const p = this.add.image(cx - 48 + (i % 6) * 17 + Math.random() * 4, by - 6 + Math.floor(i / 6) * 12, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(69 + i * 0.01);
      this.tweens.add({ targets: p, y: p.y - 3, yoyo: true, repeat: 8, duration: 220 + Math.random() * 120, delay: Math.random() * 300 });
      grupo.push(p);
    }
    const fitaE = this.add.rectangle(cx - 30, by - 10, 28, 3, 0xe23b3b).setOrigin(0).setDepth(68);
    const fitaD = this.add.rectangle(cx + 2, by - 10, 28, 3, 0xe23b3b).setOrigin(0).setDepth(68);
    grupo.push(fitaE, fitaD);
    this.time.delayedCall(1200, () => { this.tweens.add({ targets: fitaE, angle: 40, duration: 300 }); this.tweens.add({ targets: fitaD, angle: -40, duration: 300 }); });
    const cores = [0xe23b3b, 0xf2d33a, 0x2c9a48, 0x3d8bd1, 0xffffff];
    for (let i = 0; i < 60; i++) {
      const c = this.add.image(cx + (Math.random() - .5) * 40, by - 30, 'confete').setScale(0.5).setDepth(71).setTint(Phaser.Utils.Array.GetRandom(cores));
      this.tweens.add({ targets: c, x: c.x + (Math.random() - .5) * 140, y: c.y - 40 - Math.random() * 60, duration: 500, ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({ targets: c, y: c.y + 100, alpha: 0, duration: 1800, onComplete: () => c.destroy() }) });
    }
    this.time.delayedCall(5000, () => grupo.forEach(o => o.destroy()));
  }

  update(time, delta) {
    const dt = Math.min(0.1, delta / 1000);
    const vel = Jogo.rodando() ? Jogo.velocidade : 0;
    if (this.vinheta) this.ajustarLuz();
    for (const n of this.nuvens) { n.x += n.vel * dt; if (n.x > MAP_W * TILE + 300) { n.x = -300; n.y = Math.random() * MAP_H * TILE; } }
    if (vel > 0) Sim.avancar(dt * vel);
    this.moverAgentes(dt, vel);

    // teclado
    const cam = this.cameras.main, k = this.teclas, v = 900 * dt / cam.zoom;
    if (!this.digitando()) {
      if (k.A.isDown || k.LEFT.isDown) cam.scrollX -= v;
      if (k.D.isDown || k.RIGHT.isDown) cam.scrollX += v;
      if (k.W.isDown || k.UP.isDown) cam.scrollY -= v;
      if (k.S.isDown || k.DOWN.isDown) cam.scrollY += v;
    }

    // rótulos aparecem com zoom afastado
    const alvo = cam.zoom < 0.75 ? 0.95 : 0;
    for (const t of this.rotulos) t.alpha += (alvo - t.alpha) * 0.15;

    // balões
    if (vel > 0) {
      this.tempoBalao -= dt * Math.min(vel, 3);
      if (this.tempoBalao <= 0 && this.baloes.length < 4) { this.criarBalao(); this.tempoBalao = 10 + Math.random() * 10; }
      for (const b of this.baloes.slice()) { b.vida -= dt; if (b.vida <= 0) this.removerBalao(b); }
    }

    // obras e destaque
    const g = this.grafObras; g.clear();
    if (Sim.S) for (const l of Sim.S.lotes) {
      let p;
      if (l.obra) p = Sim.progressoObra(l);
      else if (l.empresa) { const e = Sim.S.empresas.find(x => x.id === l.empresa); if (!e || e.status !== 'instalacao') continue; p = 1 - e.mesesRest / e.mesesTotal; }
      else continue;
      g.fillStyle(0x1c1c24, 1).fillRect(l.x * TILE + 8, l.y * TILE - 12, 80, 9);
      g.fillStyle(0xf2c13a, 1).fillRect(l.x * TILE + 10, l.y * TILE - 10, Math.max(2, 76 * p), 5);
    }
    const d = this.destaque; d.clear();
    const sel = Sim.S && this.selecionado && UI.painelAberto() === 'lote' ? Sim.S.lotes.find(l => l.id === this.selecionado) : null;
    for (const [l, cor, a] of [[this.hoverLote, 0xffffff, 0.7], [sel, 0xf2d33a, 1]]) {
      if (!l) continue;
      d.lineStyle(3, cor, a).strokeRect(l.x * TILE - 2, l.y * TILE - 2, 3 * TILE + 4, 3 * TILE + 4);
    }
  }
}
