// =====================================================================
//  PREFEITO — vida no mapa: ocorrências, shows, feira de domingo,
//  placas das empresas interessadas, guindastes nas obras, pássaros,
//  viaturas com sirene e postes acesos à noite.
// =====================================================================

Object.assign(CidadeScene.prototype, {

  iniciarVida() {
    const hd = (k, fn, opt) => { if (!this.textures.exists(k)) this.textures.addCanvas(k, Art.hdDe(fn, opt || { grao: false })); };
    for (const t in TIPOS_OCORRENCIA) { hd('oc_' + t, () => Art.ocorrencia(t, false, Art.rng(7))); hd('oc_' + t + '_r', () => Art.ocorrencia(t, true, Art.rng(7))); }
    hd('chama0', () => Art.chama(0)); hd('chama1', () => Art.chama(1));
    hd('alerta', () => Art.alerta('#d6332a', '!'));
    hd('palco', () => Art.palco('#d64b4b'));
    ['#d64b4b', '#3d8bd1', '#e0a82e', '#3fa45b'].forEach((c, i) => hd('barraca' + i, () => Art.barraca(c)));
    hd('guind_t', () => Art.guindasteTorre()); hd('guind_b', () => Art.guindasteBraco());
    hd('andaime', () => Art.andaime());
    hd('passaro0', () => Art.passaro(0)); hd('passaro1', () => Art.passaro(1));
    ['#f2d33a', '#ff8ad0', '#8ad8ff'].forEach((c, i) => hd('nota' + i, () => Art.notaMusical(c)));
    hd('operario_tex', () => { const [c, g] = Art.canvas(10, 18); Art.operario(g, 0, 1); return c; });
    hd('cone', () => { const [c, g] = Art.canvas(12, 12); Art.cone(g, 0, 1); return c; });
    if (!this.textures.exists('luzposte')) this.textures.addCanvas('luzposte', Art.brilhoLuz());
    // viaturas com giroflex (2 quadros)
    const viatura = (modo, q) => {
      const c = Art.carro('#f4f1e8', modo), g = c.getContext('2d');
      const [a, b] = q ? ['#3d6bff', '#ff3b3b'] : ['#ff3b3b', '#3d6bff'];
      if (modo === 'h') { g.fillStyle = a; g.fillRect(10, 1, 3, 2); g.fillStyle = b; g.fillRect(13, 1, 3, 2); g.fillStyle = '#2a3a6b'; g.fillRect(3, 9, 20, 1); }
      else { g.fillStyle = a; g.fillRect(4, 6, 4, 2); g.fillStyle = b; g.fillRect(8, 6, 4, 2); }
      return c;
    };
    for (const m of ['h', 'frente', 'tras']) for (const q of [0, 1]) hd('vtr_' + m + q, () => viatura(m, q));

    this.oc = {};       // ocorrências desenhadas
    this.evs = {};      // eventos desenhados
    this.pins = {};     // propostas de empresas
    this.obrasViz = {}; // guindastes e placas de obra
    this.passaros = [];
    this.relogioVida = 0;
    this.feira = null;
    this.pracaGente = [];

    // postes acesos à noite
    this.luzes = Mapa.postes.map(p => this.add.image(p.x, p.y, 'luzposte').setBlendMode(Phaser.BlendModes.ADD).setDepth(57).setAlpha(0).setScale(1.2));

    const tudo = () => { this.atualizarOcorrencias(); this.atualizarEventos(); this.atualizarPropostas(); this.atualizarObras(); };
    Sim.on('inicio', tudo);
    Sim.on('ocorrencia', () => this.atualizarOcorrencias());
    Sim.on('evento', () => this.atualizarEventos());
    Sim.on('dia', () => { this.atualizarEventos(); this.atualizarObras(); });
    Sim.on('proposta', () => this.atualizarPropostas());
    Sim.on('mudou', () => { this.atualizarPropostas(); this.atualizarObras(); this.atualizarOcorrencias(); });
    Sim.on('obra', () => this.atualizarObras());
    Sim.on('mes', tudo);
    Sim.on('acordo', () => { this.atualizarPropostas(); this.atualizarObras(); });
    if (Sim.S) tudo();
  },

  // ---------------------------------------------------- ocorrências
  atualizarOcorrencias() {
    const S = Sim.S; if (!S || !S.ocorrencias) return;
    const vivos = new Set();
    for (const o of S.ocorrencias) {
      vivos.add(o.id);
      if (o.x == null) {
        const t = TIPOS_OCORRENCIA[o.tipo];
        const p = (t.local === 'rua' ? Mapa.pontoRua : t.local === 'terreno' ? Mapa.pontoTerreno : Mapa.pontoCasa)(o.bairro, Art.rng(o.seed || 1));
        if (!p) { o.x = -999; o.y = -999; } else { o.x = p.x; o.y = p.y; }
      }
      const chave = o.status + (o.carrosSairam ? 's' : '');
      const atual = this.oc[o.id];
      if (atual && atual.chave === chave) continue;
      if (atual) atual.objs.forEach(x => x.destroy());
      this.oc[o.id] = this.desenharOcorrencia(o, chave);
    }
    for (const id in this.oc) if (!vivos.has(id)) { this.oc[id].objs.forEach(x => x.destroy()); delete this.oc[id]; }
  },
  desenharOcorrencia(o, chave) {
    const objs = [], x = o.x, y = o.y, prof = 22 + (y + 48) / 100000;
    const reparo = o.status === 'reparo';
    if (o.tipo !== 'acidente' || reparo) objs.push(this.add.image(x, y, 'oc_' + o.tipo + (reparo ? '_r' : '')).setOrigin(0).setScale(0.5).setDepth(prof));
    let chamas = [];
    if (o.tipo === 'incendio' && !reparo) {
      for (let i = 0; i < 4; i++) {
        const c = this.add.image(x + 12 + i * 10, y + 14 + (i % 2) * 6, 'chama' + (i % 2)).setOrigin(0).setScale(0.5 + Math.random() * 0.25).setDepth(prof + 0.001);
        c.fase = Math.random(); chamas.push(c); objs.push(c);
      }
    }
    if (o.tipo === 'acidente' && !reparo && !o.carrosSairam) {
      const c1 = this.add.image(x + 10, y + 18, 'car_h0').setOrigin(0).setScale(0.5).setAngle(-18).setDepth(prof);
      const c2 = this.add.image(x + 30, y + 14, 'car_h1').setOrigin(0).setScale(0.5).setAngle(25).setDepth(prof);
      const v = this.add.image(x + 46, y + 30, 'vtr_h0').setOrigin(0).setScale(0.5).setDepth(prof + 0.001); v.giroflex = true;
      objs.push(c1, c2, v, this.add.image(x + 4, y + 30, 'cone').setOrigin(0).setScale(0.5).setDepth(prof));
    }
    let alerta = null;
    if (!reparo) {
      alerta = this.add.image(x + 21, y - 16, 'alerta').setOrigin(0).setScale(0.6).setDepth(64);
      this.tweens.add({ targets: alerta, y: alerta.y - 6, yoyo: true, repeat: -1, duration: 520, ease: 'Sine.easeInOut' });
      alerta.ocId = o.id;
      objs.push(alerta);
    }
    return { chave, objs, alerta, chamas };
  },

  // --------------------------------------------------------- eventos
  atualizarEventos() {
    const S = Sim.S; if (!S || !S.eventos) return;
    const vivos = new Set();
    for (const ev of S.eventos) {
      if (ev.status === 'feito') continue;
      vivos.add(ev.id);
      const atual = this.evs[ev.id];
      if (atual && atual.status === ev.status) continue;
      if (atual) this.apagarEvento(atual);
      this.evs[ev.id] = ev.loteId === 'P4' && this.praca ? Object.assign(this.desenharEventoPraca(ev), { naPraca: true }) : this.desenharEvento(ev);
    }
    for (const id in this.evs) if (!vivos.has(id)) { this.apagarEvento(this.evs[id]); delete this.evs[id]; }
  },
  apagarEvento(e) {
    if (e.naPraca) return this.limparEventoPraca(e);
    e.objs.forEach(x => x.destroy()); if (e.timer) e.timer.remove();
  },
  desenharEvento(ev) {
    const l = Sim.S.lotes.find(x => x.id === ev.loteId); if (!l) return { status: ev.status, objs: [] };
    const X = l.x * TILE, Y = l.y * TILE, objs = [];
    const t = TIPOS_EVENTO[ev.tipo];
    if (ev.status === 'agendado') {
      const key = 'plc_ev_' + ev.tipo;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, Art.hdDe(() => Art.placaEmpresa('#9b5bc9', '♪'), { grao: false }));
      const p = this.add.image(X + 64, Y + 54, key).setOrigin(0).setScale(0.5).setDepth(40);
      const txt = this.add.text(X + 48, Y + 32, `${t.nome.split(' ')[0]} ${ev.quando}`, { fontFamily: '"Nunito", sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: '#6b3a8a', padding: { x: 4, y: 1 } }).setResolution(2).setDepth(41);
      objs.push(p, txt);
      return { status: ev.status, objs };
    }
    // acontecendo: palco, público, prefeito e notas musicais
    objs.push(this.add.image(X, Y - 18, 'palco').setOrigin(0).setScale(0.5).setDepth(45 + (Y + 62) / 100000));
    const n = Math.min(40, Math.max(10, Math.round((ev.publico || 1000) / 60)));
    for (let i = 0; i < n; i++) {
      const px = X - 14 + Math.random() * 120, py = Y + 64 + Math.random() * 44;
      const p = this.add.image(px, py, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(46 + py / 100000);
      this.tweens.add({ targets: p, y: py - 3, yoyo: true, repeat: -1, duration: 260 + Math.random() * 160, delay: Math.random() * 400 });
      objs.push(p);
    }
    objs.push(this.add.image(X + 80, Y + 58, 'prefeito').setOrigin(0).setScale(0.5).setDepth(46 + (Y + 80) / 100000));
    const timer = this.time.addEvent({ delay: 450, loop: true, callback: () => {
      const nota = this.add.image(X + 30 + Math.random() * 40, Y + 6, 'nota' + Math.floor(Math.random() * 3)).setScale(0.6).setDepth(66);
      this.tweens.add({ targets: nota, y: nota.y - 40, x: nota.x + (Math.random() - .5) * 30, alpha: 0, duration: 1600, onComplete: () => nota.destroy() });
      // fogos à noite nos shows grandes
      if (t.custo >= 250e3 && Sim.horaDoDia() > 19 && Math.random() < 0.25) this.fogos(X + 48 + (Math.random() - .5) * 160, Y - 80 - Math.random() * 60);
    } });
    return { status: ev.status, objs, timer };
  },
  fogos(x, y) {
    const cores = [0xff5a5a, 0xffd84a, 0x6ad1ff, 0x9dff7a, 0xff8ae0];
    const cor = Phaser.Utils.Array.GetRandom(cores);
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * Math.PI * 2;
      const c = this.add.image(x, y, 'confete').setScale(0.5).setDepth(76).setTint(cor).setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({ targets: c, x: x + Math.cos(a) * 40, y: y + Math.sin(a) * 40 + 10, alpha: 0, duration: 1100, ease: 'Quad.easeOut', onComplete: () => c.destroy() });
    }
  },

  // -------------------------------------------- propostas no mapa
  atualizarPropostas() {
    const S = Sim.S; if (!S || !S.propostas) return;
    const vivos = new Set();
    for (const p of S.propostas) {
      if (!p.loteId) continue;
      const l = S.lotes.find(x => x.id === p.loteId); if (!l) continue;
      const k = p.id + ':' + p.loteId;
      vivos.add(k);
      if (this.pins[k]) continue;
      const c = Empresas.cat(p.catId);
      const tex = 'plc_' + p.catId;
      if (!this.textures.exists(tex)) this.textures.addCanvas(tex, Art.hdDe(() => Art.placaEmpresa(c.cor, c.nome[0]), { grao: false }));
      const pin = 'pin_' + p.catId;
      if (!this.textures.exists(pin)) this.textures.addCanvas(pin, Art.hdDe(() => Art.alerta(c.cor, '$'), { grao: false }));
      const X = l.x * TILE, Y = l.y * TILE;
      const placa = this.add.image(X + 30, Y + 40, tex).setOrigin(0).setScale(0.5).setDepth(40);
      const ic = this.add.image(X + 37, Y + 12, pin).setOrigin(0).setScale(0.65).setDepth(64);
      this.tweens.add({ targets: ic, y: ic.y - 7, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' });
      const nome = this.add.text(X + 48, Y + 80, c.nome, { fontFamily: '"Nunito", sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: '#2a2a33', padding: { x: 4, y: 1 } })
        .setOrigin(0.5, 0).setResolution(2).setDepth(41).setAlpha(0.9);
      ic.propId = p.id; placa.propId = p.id;
      this.pins[k] = { objs: [placa, ic, nome], alvo: [ic, placa] };
    }
    for (const k in this.pins) if (!vivos.has(k)) { this.pins[k].objs.forEach(x => x.destroy()); delete this.pins[k]; }
  },

  // -------------------------------------------- obras com guindaste
  atualizarObras() {
    const S = Sim.S; if (!S) return;
    const vivos = new Set();
    for (const l of S.lotes) {
      const emp = l.empresa ? (S.empresas || []).find(e => e.id === l.empresa && e.status === 'instalacao') : null;
      const obraPub = l.obra && !l.obra.parada;
      if (!emp && !obraPub) continue;
      const k = 'L' + l.id;
      vivos.add(k);
      if (this.obrasViz[k]) continue;
      const X = l.x * TILE, Y = l.y * TILE, objs = [];
      objs.push(this.add.image(X + 64, Y - 46, 'guind_t').setOrigin(0).setScale(0.5).setDepth(33 + (Y + 64) / 100000));
      const braco = this.add.image(X + 20, Y - 46, 'guind_b').setOrigin(0).setScale(0.5).setDepth(34);
      objs.push(braco);
      const gancho = this.add.rectangle(X + 30, Y - 40, 2, 22, 0x3a3a40).setOrigin(0.5, 0).setDepth(34);
      this.tweens.add({ targets: gancho, x: X + 64, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: gancho, height: 34, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      objs.push(gancho);
      const cor = emp ? emp.cor : '#2f6aa5', letra = emp ? emp.nome[0] : 'P';
      const tex = 'plc_obra_' + letra + cor;
      if (!this.textures.exists(tex)) this.textures.addCanvas(tex, Art.hdDe(() => Art.placaEmpresa(cor, letra), { grao: false }));
      objs.push(this.add.image(X + 2, Y + 66, tex).setOrigin(0).setScale(0.5).setDepth(40));
      const rot = emp ? `Em breve: ${emp.nome}` : `Obra: ${PREDIOS[l.obra.tipo] ? PREDIOS[l.obra.tipo].nome : ''}`;
      objs.push(this.add.text(X + 48, Y + 98, rot, { fontFamily: '"Nunito", sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: emp ? '#2a2a33' : '#2f6aa5', padding: { x: 4, y: 1 } })
        .setOrigin(0.5, 0).setResolution(2).setDepth(41).setAlpha(0.92));
      objs.push(this.add.image(X + 70, Y + 74, 'operario_tex').setOrigin(0).setScale(0.5).setDepth(42));
      this.obrasViz[k] = { objs };
    }
    // lojas pequenas em obra: andaime por cima
    for (const it of (S.crescimento || [])) {
      if (!it.empresa || it.x == null || it.x < 0) continue;
      const e = (S.empresas || []).find(x => x.id === it.empresa);
      if (!e || e.status !== 'instalacao') continue;
      const k = 'C' + it.id; vivos.add(k);
      if (this.obrasViz[k]) continue;
      this.obrasViz[k] = { objs: [this.add.image(it.x * TILE, it.y * TILE, 'andaime').setOrigin(0).setScale(0.5).setDepth(11 + it.y * 0.01)] };
    }
    for (const k in this.obrasViz) if (!vivos.has(k)) { this.obrasViz[k].objs.forEach(x => x.destroy()); delete this.obrasViz[k]; }
  },

  // ------------------------------------------------- vida ambiente
  atualizarVida(time, dt, vel) {
    this.atualizarPraca(time, dt, vel);
    // chamas e giroflex piscando
    const q = Math.floor(time / 220) % 2;
    for (const id in this.oc) for (const c of this.oc[id].chamas) { c.setTexture('chama' + ((q + (c.fase > 0.5 ? 1 : 0)) % 2)); }
    for (const id in this.oc) for (const o of this.oc[id].objs) if (o.giroflex) o.setTexture('vtr_h' + q);
    for (const ag of this.agentes) if (ag.sirene) {
      const m = ag.f.eixo === 'x' ? 'h' : ag.f.dir > 0 ? 'frente' : 'tras';
      ag.spr.setTexture('vtr_' + m + q);
    }
    // pássaros
    for (const p of this.passaros) { p.x += p.vx * dt; p.y += p.vy * dt; p.setTexture('passaro' + (Math.floor(time / 180 + p.fase) % 2)); }
    this.passaros = this.passaros.filter(p => { if (p.x < -200 || p.x > MAP_W * TILE + 200) { p.destroy(); return false; } return true; });

    // tarefas mais lentas: duas vezes por segundo (tempo real, mesmo com a tela lenta)
    if (time - (this.ultimoVida || 0) < 500) return;
    this.ultimoVida = time;
    const S = Sim.S; if (!S) return;
    const h = Sim.horaDoDia();
    // postes: acendem ao anoitecer
    const noite = h >= 18 ? Math.min(1, (h - 18) / 1.5) : h < 6.5 ? Math.max(0, (6.5 - h) / 0.5) * 0.6 : 0;
    for (const l of this.luzes) l.setAlpha(noite * 0.85);
    // pássaros de dia
    if (vel > 0 && h > 6.5 && h < 18 && Math.random() < 0.04 && this.passaros.length < 14) this.bando();
    // viatura ou ambulância de vez em quando
    if (vel > 0 && Math.random() < 0.02 && !this.agentes.some(a => a.sirene)) {
      const carros = this.agentes.filter(a => a.tipo === 'carro');
      const ag = Phaser.Utils.Array.GetRandom(carros); if (ag) { ag.sirene = true; ag.vel = 110; }
    }
    // feira de domingo e gente na praça
    const domingo = new Date(S.ano, S.mes, S.dia).getDay() === 0;
    this.mostrarFeira(domingo && h >= 6.5 && h < 13.5);
    this.mostrarPraca(h >= 7 && h < 21);
  },
  bando() {
    const W = MAP_W * TILE, H = MAP_H * TILE, cam = this.cameras.main;
    const esq = Math.random() < 0.5, n = 4 + Math.floor(Math.random() * 4);
    const y0 = cam.worldView.y + Math.random() * cam.worldView.height;
    const x0 = esq ? cam.worldView.x - 60 : cam.worldView.right + 60;
    for (let i = 0; i < n; i++) {
      const p = this.add.image(x0 + (esq ? -1 : 1) * i * 14, y0 + (i % 2 ? 8 : -8) * Math.ceil(i / 2), 'passaro0').setScale(0.55).setDepth(78);
      p.vx = (esq ? 1 : -1) * (70 + Math.random() * 10); p.vy = -6 + Math.random() * 12; p.fase = Math.random() * 2;
      this.passaros.push(p);
    }
  },
  mostrarFeira(sim) {
    const P = this.praca;
    if (sim && P && (P.ev || P.prot)) sim = false;
    if (sim && !this.feira && P) {
      const pos = [[P.X + 16, P.Y + 226], [P.X + 60, P.Y + 226], [P.X + 196, P.Y + 226], [P.X + 240, P.Y + 226], [P.X + 30, P.Y + 30], [P.X + 220, P.Y + 30]];
      const objs = pos.map(([x, y], i) => this.add.image(x, y, 'barraca' + (i % 4)).setOrigin(0).setScale(0.5).setDepth(12 + (y + 30) / 100000));
      for (let i = 0; i < 18; i++) {
        const [x, y] = this.pontoPraca();
        const p = this.add.image(x, y, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(12 + (y + 18) / 100000);
        this.tweens.add({ targets: p, x: x + (Math.random() - 0.5) * 50, duration: 2500 + Math.random() * 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        objs.push(p);
      }
      this.feira = objs;
    } else if (!sim && this.feira) { this.feira.forEach(o => o.destroy()); this.feira = null; }
  },
  mostrarPraca(sim) {
    const S = Sim.S;
    const pracas = S.lotes.filter(l => l.predio === 'praca' && !l.central);
    const alvo = sim ? pracas.length * 4 : 0;
    while (this.pracaGente.length > alvo) this.pracaGente.pop().destroy();
    while (this.pracaGente.length < alvo) {
      const l = pracas[this.pracaGente.length % pracas.length];
      const x = l.x * TILE + 10 + Math.random() * 70, y = l.y * TILE + 30 + Math.random() * 50;
      const p = this.add.image(x, y, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(12 + y / 100000);
      this.tweens.add({ targets: p, x: x + (Math.random() - 0.5) * 40, y: y + (Math.random() - 0.5) * 20, duration: 3000 + Math.random() * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pracaGente.push(p);
    }
  },

  // ------------------------------------------------------- cliques
  alvoVida(w) {
    const dentro = o => o && o.visible !== false && o.getBounds && Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(o.getBounds()), 4, 4).contains(w.x, w.y);
    for (const id in this.oc) if (dentro(this.oc[id].alerta)) return { tipo: 'ocorrencia', id };
    for (const k in this.pins) for (const o of this.pins[k].alvo) if (dentro(o)) return { tipo: 'proposta', id: o.propId };
    return null;
  },
  cliqueVida(w) {
    const a = this.alvoVida(w); if (!a) return false;
    if (a.tipo === 'ocorrencia') UI.abrirOcorrencia(a.id);
    if (a.tipo === 'proposta') UI.abrirNegociacao(a.id);
    return true;
  },
});
