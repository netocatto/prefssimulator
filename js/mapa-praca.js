// =====================================================================
//  PREFEITO — Praça Central (um quarteirão inteiro no Centro)
//  Chafariz com água, coreto, árvores, bancos, pombos, pipoqueiro e
//  gente passeando. Shows, quermesses, feiras e protestos acontecem
//  aqui, todos animados.
// =====================================================================

Object.assign(CidadeScene.prototype, {

  criarPracaCentral(l) {
    const X = l.x * TILE, Y = l.y * TILE, W = (l.w || 9) * TILE, H = (l.h || 10) * TILE;
    this.praca = { l, X, Y, W, H, cx: X + W / 2, cy: Y + 168, gente: [], pombos: [], sentados: [], ev: null, prot: null, gotas: [] };
    const P = this.praca;
    const hd = (k, fn) => { if (!this.textures.exists(k)) this.textures.addCanvas(k, Art.hdDe(fn, { grao: false })); };
    hd('praca_chao', () => Art.pracaChao(W, H));
    hd('coreto', () => Art.coreto());
    hd('banco', () => Art.banco());
    hd('banca', () => Art.banca());
    hd('pipoqueiro', () => Art.pipoqueiro());
    hd('pomba0', () => Art.pomba(0)); hd('pomba1', () => Art.pomba(1));
    ['#c4302b', '#2f6aa5', '#2c9a48', '#1c1c24'].forEach((c, i) => { hd('cartaz' + i, () => Art.cartaz(c, 0)); hd('cartazb' + i, () => Art.cartaz(c, 1)); });
    hd('carro_som', () => Art.carroSom());
    hd('gota', () => Art.gota());
    hd('bandeirinhas', () => Art.bandeirinhas(W - 20));
    hd('fogueira', () => Art.fogueira());
    hd('poste_p', () => { const [c, g] = Art.canvas(10, 30); Art.poste(g, 1, 0); return c; });
    for (const [k, tipo, seed] of [['arv_p0', 'ipe', 3], ['arv_p1', 'ipe', 8], ['arv_p2', 'redonda', 5], ['arv_p3', 'redonda', 11], ['arv_p4', 'ipe', 21]]) {
      hd(k, () => { const [c, g] = Art.canvas(40, 40); Art.arvore(g, 4, 4, Art.rng(seed), tipo); return c; });
    }
    // dançarinos e guardas
    const camisas = ['#e23b3b', '#3d8bd1', '#f2d33a', '#2c9a48', '#f08a5d', '#9a6bbd', '#f4f1e8', '#e66a8a'];
    const peles = ['#f1c9a5', '#d9a77a', '#a86f4c', '#7a4a2e', '#5c3a24'];
    const cabelos = ['#2a1a10', '#6b4a2a', '#1c1c24', '#c99a4a', '#8a3a1a'];
    const calcas = ['#2f3b5a', '#4a4a52', '#5a3a2a', '#3d6b8f'];
    for (let i = 0; i < 16; i++) {
      const pele = peles[(i * 3) % peles.length];
      hd('danca' + i, () => Art.pessoaBracos(Art.pessoa(camisas[i % camisas.length], pele, cabelos[(i * 7) % cabelos.length], calcas[i % calcas.length], i % 4 === 1), pele));
    }
    hd('guarda_p', () => Art.pessoa('#2f4fa0', '#d9a77a', '#1c1c24', '#1c2a4a', false));

    // chão e objetos fixos
    this.add.image(X, Y, 'praca_chao').setOrigin(0).setScale(0.5).setDepth(1);
    const prof = y => 12 + y / 100000;
    P.coreto = this.add.image(X + 104, Y + 14, 'coreto').setOrigin(0).setScale(0.5).setDepth(prof(Y + 92));
    const arvs = [[X + 6, Y + 96], [X + 44, Y + 120], [X + 10, Y + 170], [X + 48, Y + 186], [W + X - 46, Y + 96], [W + X - 84, Y + 122], [W + X - 50, Y + 168], [W + X - 86, Y + 186], [X + 4, Y + 18], [W + X - 42, Y + 18]];
    arvs.forEach(([x, y], i) => this.add.image(x, y, 'arv_p' + (i % 5)).setOrigin(0).setScale(0.5).setDepth(prof(y + 36)));
    const bancos = [[X + 100, Y + 112], [X + 168, Y + 112], [X + 100, Y + 214], [X + 168, Y + 214], [X + 30, Y + 226], [W + X - 52, Y + 226]];
    bancos.forEach(([x, y]) => this.add.image(x, y, 'banco').setOrigin(0).setScale(0.5).setDepth(prof(y + 10)));
    P.bancos = bancos;
    this.add.image(X + 12, Y + 236, 'banca').setOrigin(0).setScale(0.5).setDepth(prof(Y + 268));
    P.pipoca = this.add.image(X + W - 40, Y + 238, 'pipoqueiro').setOrigin(0).setScale(0.5).setDepth(prof(Y + 266));
    this.tweens.add({ targets: P.pipoca, y: P.pipoca.y - 1, yoyo: true, repeat: -1, duration: 900 });
    for (const [x, y] of [[X + 2, Y + 70], [X + W - 12, Y + 70], [X + 2, Y + 262], [X + W - 12, Y + 262]]) {
      this.add.image(x, y, 'poste_p').setOrigin(0).setScale(1).setDepth(prof(y + 30));
      if (this.luzes) this.luzes.push(this.add.image(x + 5, y + 4, 'luzposte').setBlendMode(Phaser.BlendModes.ADD).setDepth(57).setAlpha(0).setScale(1.2));
    }
    // chafariz: gotas em arco que caem de volta na bacia
    for (let i = 0; i < 26; i++) {
      const g = this.add.image(P.cx, P.cy - 16, 'gota').setScale(0.5).setDepth(prof(P.cy + 1)).setAlpha(0.9);
      g.t = Math.random(); g.ang = Math.random() * Math.PI * 2; g.alc = 10 + Math.random() * 18; g.vel = 0.9 + Math.random() * 0.5;
      P.gotas.push(g);
    }
    // pombos
    for (let i = 0; i < 9; i++) {
      const [x, y] = this.pontoPraca();
      const pb = this.add.image(x, y, 'pomba0').setOrigin(0).setScale(0.5).setDepth(prof(y + 5));
      pb.fase = Math.random() * 3; pb.casa = [x, y];
      P.pombos.push(pb);
    }
    // gente passeando e sentada
    for (let i = 0; i < 12; i++) this.novoPasseante();
    bancos.slice(0, 4).forEach(([x, y], i) => {
      const p = this.add.image(x + 4 + i % 2 * 6, y - 8, 'pes' + ((i * 5) % 16)).setOrigin(0).setScale(0.5).setDepth(prof(y + 9));
      P.sentados.push(p);
    });
    Sim.on('protesto', p => this.atualizarProtesto(p));
    Sim.on('inicio', () => this.atualizarProtesto());
    this.atualizarProtesto();
  },

  // ponto livre para andar dentro da praça (fora do chafariz, coreto e canteiros)
  pontoPraca(zona) {
    const P = this.praca;
    for (let i = 0; i < 60; i++) {
      let x, y;
      if (zona === 'baixo') { x = 14 + Math.random() * (P.W - 40); y = 226 + Math.random() * 66; }
      else if (zona === 'meio') { x = 14 + Math.random() * (P.W - 40); y = 104 + Math.random() * 186; }
      else { x = 14 + Math.random() * (P.W - 40); y = 22 + Math.random() * 272; }
      const fx = (x - 144) / 52, fy = (y - 168) / 40;
      if (fx * fx + fy * fy < 1) continue;                       // chafariz
      if (x > 96 && x < 192 && y < 100) continue;                // coreto
      if ((x < 92 || x > P.W - 94) && y > 100 && y < 222) continue; // canteiros
      return [P.X + x, P.Y + y];
    }
    return [P.X + 140, P.Y + 260];
  },
  novoPasseante() {
    const P = this.praca, [x, y] = this.pontoPraca();
    const p = this.add.image(x, y, 'pes' + Math.floor(Math.random() * 16)).setOrigin(0).setScale(0.5).setDepth(12 + y / 100000);
    p.alvo = this.pontoPraca(); p.vel = 10 + Math.random() * 10; p.espera = Math.random() * 3; p.fase = Math.random() * 6;
    P.gente.push(p);
  },

  // chamado todo quadro pelo atualizarVida
  atualizarPraca(time, dt, vel) {
    const P = this.praca; if (!P) return;
    const ritmo = vel === 0 ? 0.25 : 1;
    // chafariz
    for (const g of P.gotas) {
      g.t += dt * g.vel * 0.9;
      if (g.t >= 1) { g.t = 0; g.ang = Math.random() * Math.PI * 2; g.alc = 10 + Math.random() * 18; }
      g.x = P.cx + Math.cos(g.ang) * g.alc * g.t;
      g.y = P.cy - 16 + Math.sin(g.ang) * g.alc * 0.6 * g.t - Math.sin(Math.PI * g.t) * 20 + g.t * 14;
      g.setAlpha(0.95 - g.t * 0.4);
    }
    // passeantes
    const h = Sim.horaDoDia();
    const ocupada = P.ev || P.prot;
    const alvoN = ocupada ? 4 : h >= 22 || h < 6.5 ? 2 : 12;
    while (P.gente.length > alvoN) P.gente.pop().destroy();
    while (P.gente.length < alvoN) this.novoPasseante();
    for (const p of P.gente) {
      if (p.espera > 0) { p.espera -= dt * ritmo; continue; }
      const dx = p.alvo[0] - p.x, dy = p.alvo[1] - p.y, d = Math.hypot(dx, dy);
      if (d < 2) { p.alvo = this.pontoPraca(); p.espera = Math.random() * 4; continue; }
      const st = Math.min(d, p.vel * dt * ritmo);
      p.x += dx / d * st; p.y += dy / d * st;
      p.setFlipX(dx < 0);
      p.fase += dt * 9 * ritmo;
      p.setDepth(12 + (p.y + 10) / 100000);
    }
    // pombos ciscando; voam quando a praça lota
    for (const pb of P.pombos) {
      if (ocupada && !pb.voando) {
        pb.voando = true;
        this.tweens.add({ targets: pb, x: pb.x + (Math.random() - 0.5) * 300, y: pb.y - 260, alpha: 0, duration: 1800, ease: 'Quad.easeIn' });
      } else if (!ocupada && pb.voando) {
        pb.voando = false; pb.x = pb.casa[0]; pb.y = pb.casa[1]; pb.setAlpha(0);
        this.tweens.add({ targets: pb, alpha: 1, duration: 800 });
      }
      if (!pb.voando) pb.setTexture('pomba' + (Math.floor(time / 300 + pb.fase) % 2));
    }
    // quadrilha girando na quermesse
    if (P.ev && P.ev.roda) {
      P.ev.ang += dt * 0.9 * ritmo;
      P.ev.roda.forEach((p, i) => {
        const a = P.ev.ang + i / P.ev.roda.length * Math.PI * 2;
        p.x = P.ev.rc[0] + Math.cos(a) * 46; p.y = P.ev.rc[1] + Math.sin(a) * 20;
        p.setFlipX(Math.sin(a) > 0); p.setDepth(12 + (p.y + 10) / 100000);
      });
    }
    // chamas da fogueira
    if (P.ev && P.ev.chamas) { const q = Math.floor(time / 200) % 2; P.ev.chamas.forEach((c, i) => c.setTexture('chama' + ((q + i) % 2))); }
    // dançarinos: braços para cima no ritmo da música
    if (P.ev && P.ev.publico) {
      const batida = Math.floor(time / 420) % 2;
      for (const p of P.ev.publico) p.setTexture((batida ^ p.lado ? 'danca' : 'pes') + p.n);
      if (P.ev.luzes && h > 18) P.ev.luzes.forEach((b, i) => { b.setVisible(true); b.rotation = Math.sin(time / 900 + i * 2) * 0.6; });
      else if (P.ev.luzes) P.ev.luzes.forEach(b => b.setVisible(false));
    }
    // manifestantes: cartazes sobem e descem, punhos para cima
    if (P.prot && P.prot.gente) {
      const q = Math.floor(time / 600) % 2;
      for (const p of P.prot.gente) {
        if (p.cartaz) p.cartaz.setTexture((q ^ p.lado ? 'cartazb' : 'cartaz') + p.cor);
        else if (!p.fugindo) p.setTexture((q ^ p.lado ? 'danca' : 'pes') + p.n);
        if (p.cartaz) { p.cartaz.x = p.x - 3; p.cartaz.y = p.y - 15 + (q ^ p.lado ? -2 : 0); }
      }
    }
  },

  // ---------------------------------------------------- eventos na praça
  desenharEventoPraca(ev) {
    const P = this.praca, t = TIPOS_EVENTO[ev.tipo], objs = [], prof = y => 12 + y / 100000;
    const X = P.X, Y = P.Y;
    if (ev.status === 'agendado') {
      const key = 'plc_ev_' + ev.tipo;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, Art.hdDe(() => Art.placaEmpresa('#9b5bc9', '♪'), { grao: false }));
      objs.push(this.add.image(X + 132, Y + 270, key).setOrigin(0).setScale(0.5).setDepth(prof(Y + 290)));
      objs.push(this.add.text(X + 144, Y + 300, `${t.nome} · ${ev.quando}`, { fontFamily: '"Nunito", sans-serif', fontSize: '11px', fontStyle: 'bold', color: '#fff', backgroundColor: '#6b3a8a', padding: { x: 4, y: 1 } })
        .setOrigin(0.5, 0).setResolution(2).setDepth(41));
      return { status: ev.status, objs };
    }
    const est = { status: ev.status, objs, timers: [] };
    P.ev = est;
    const grande = ev.tipo === 'show_regional' || ev.tipo === 'show_nacional' || ev.tipo === 'show_internacional';
    const musica = ev.tipo !== 'feira_cultural';
    // palco: coreto nos eventos pequenos, palco gigante nos grandes
    let palcoX = X + 144, palcoY = Y + 50;
    if (grande) {
      P.coreto.setVisible(false);
      const pl = this.add.image(X + 96, Y + 8, 'palco').setOrigin(0).setScale(0.5).setDepth(prof(Y + 90));
      objs.push(pl);
      if (ev.tipo !== 'show_regional') { const pl2 = this.add.image(X + 24, Y + 30, 'palco').setOrigin(0).setScale(0.32).setDepth(prof(Y + 80)); const pl3 = this.add.image(X + 202, Y + 30, 'palco').setOrigin(0).setScale(0.32).setDepth(prof(Y + 80)); objs.push(pl2, pl3); }
      // canhões de luz (aparecem à noite)
      est.luzes = [];
      for (const [bx, cor] of [[X + 104, 0xff6ad5], [X + 144, 0xfff3a0], [X + 184, 0x6ad8ff]]) {
        const gr = this.add.graphics({ x: bx, y: Y + 20 }).setDepth(70).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
        gr.fillStyle(cor, 0.16).fillTriangle(0, 0, -34, 230, 34, 230);
        est.luzes.push(gr); objs.push(gr);
      }
    } else if (musica) {
      // banda tocando no coreto
      for (let i = 0; i < 3; i++) {
        const m = this.add.image(X + 126 + i * 13, Y + 50, 'pes' + (i * 5 % 16)).setOrigin(0).setScale(0.5).setDepth(prof(Y + 93));
        this.tweens.add({ targets: m, y: m.y - 2, yoyo: true, repeat: -1, duration: 300 + i * 40 });
        objs.push(m);
      }
    }
    // quermesse: bandeirinhas, fogueira, barracas e quadrilha
    if (ev.tipo === 'quermesse') {
      for (const yy of [Y + 96, Y + 214]) {
        const b = this.add.image(X + 10, yy, 'bandeirinhas').setOrigin(0).setScale(0.5).setDepth(68);
        this.tweens.add({ targets: b, y: yy + 2, yoyo: true, repeat: -1, duration: 1400 + Math.random() * 400, ease: 'Sine.easeInOut' });
        objs.push(b);
      }
      const fx = X + 144, fy = Y + 262;
      objs.push(this.add.image(fx - 8, fy, 'fogueira').setOrigin(0).setScale(0.5).setDepth(prof(fy + 8)));
      est.chamas = [0, 1, 2].map(i => { const c = this.add.image(fx - 6 + i * 4, fy - 9, 'chama' + (i % 2)).setOrigin(0).setScale(0.45).setDepth(prof(fy + 9)); objs.push(c); return c; });
      est.timers.push(this.time.addEvent({ delay: 140, loop: true, callback: () => {
        const f = this.add.image(fx + (Math.random() - 0.5) * 10, fy - 6, 'brilho').setScale(0.25).setTint(0xffb040).setDepth(69).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: f, y: f.y - 30 - Math.random() * 20, x: f.x + (Math.random() - 0.5) * 16, alpha: 0, duration: 900, onComplete: () => f.destroy() });
      } }));
      // quadrilha em roda
      est.roda = []; est.ang = 0; est.rc = [X + 144, Y + 250];
      for (let i = 0; i < 12; i++) { const p = this.add.image(0, 0, 'pes' + (i % 16)).setOrigin(0).setScale(0.5); est.roda.push(p); objs.push(p); }
    }
    if (ev.tipo === 'quermesse' || ev.tipo === 'feira_cultural') {
      const bars = ev.tipo === 'feira_cultural'
        ? [[X + 16, Y + 228], [X + 60, Y + 228], [X + 196, Y + 228], [X + 240, Y + 228], [X + 96, Y + 120], [X + 160, Y + 120], [X + 30, Y + 30], [X + 220, Y + 30]]
        : [[X + 16, Y + 226], [X + 236, Y + 226], [X + 30, Y + 30], [X + 220, Y + 30]];
      bars.forEach(([x, y], i) => objs.push(this.add.image(x, y, 'barraca' + (i % 4)).setOrigin(0).setScale(0.5).setDepth(prof(y + 30))));
    }
    // público
    const n = Math.min(70, Math.max(14, Math.round((ev.publico || 1000) / (grande ? 120 : 50))));
    est.publico = [];
    const zona = ev.tipo === 'feira_cultural' ? null : 'meio';
    for (let i = 0; i < n; i++) {
      const [px, py] = this.pontoPraca(zona);
      const k = Math.floor(Math.random() * 16);
      const p = this.add.image(px, py, 'pes' + k).setOrigin(0).setScale(0.5).setDepth(prof(py + 18));
      p.n = k; p.lado = Math.random() < 0.5 ? 1 : 0;
      if (ev.tipo === 'feira_cultural') {
        const alvo = this.pontoPraca();
        this.tweens.add({ targets: p, x: alvo[0], y: alvo[1], duration: 4000 + Math.random() * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        this.tweens.add({ targets: p, y: py - 3, yoyo: true, repeat: -1, duration: 260 + Math.random() * 160, delay: Math.random() * 400 });
        est.publico.push(p);
      }
      objs.push(p);
    }
    // o prefeito aparece
    const pf = this.add.image(X + 196, Y + 96, 'prefeito').setOrigin(0).setScale(0.5).setDepth(prof(Y + 118));
    this.tweens.add({ targets: pf, y: pf.y - 2, yoyo: true, repeat: -1, duration: 500 });
    objs.push(pf);
    // notas, confete e fogos
    if (musica) est.timers.push(this.time.addEvent({ delay: grande ? 250 : 450, loop: true, callback: () => {
      const nota = this.add.image(palcoX + (Math.random() - 0.5) * 60, palcoY, 'nota' + Math.floor(Math.random() * 3)).setScale(0.6).setDepth(72);
      this.tweens.add({ targets: nota, y: nota.y - 50, x: nota.x + (Math.random() - .5) * 40, alpha: 0, duration: 1800, onComplete: () => nota.destroy() });
      const hh = Sim.horaDoDia();
      if (grande && Math.random() < 0.06) this.confetePraca(palcoX, palcoY + 40);
      if ((grande || ev.tipo === 'quermesse') && hh > 19 && Math.random() < (grande ? 0.3 : 0.1)) this.fogos(X + 40 + Math.random() * (P.W - 80), Y - 40 - Math.random() * 80);
    } }));
    return est;
  },
  confetePraca(x, y) {
    const cores = [0xe23b3b, 0xf2d33a, 0x2c9a48, 0x3d8bd1, 0xffffff, 0xff8ad0];
    for (let i = 0; i < 40; i++) {
      const c = this.add.image(x + (Math.random() - .5) * 60, y, 'confete').setScale(0.5).setDepth(73).setTint(Phaser.Utils.Array.GetRandom(cores));
      this.tweens.add({ targets: c, x: c.x + (Math.random() - .5) * 200, y: c.y - 30 - Math.random() * 60, duration: 500, ease: 'Quad.easeOut',
        onComplete: () => this.tweens.add({ targets: c, y: c.y + 140, alpha: 0, duration: 2000, onComplete: () => c.destroy() }) });
    }
  },
  limparEventoPraca(est) {
    if (!est) return;
    (est.timers || []).forEach(t => t.remove());
    est.objs.forEach(o => o.destroy());
    if (this.praca && this.praca.ev === est) { this.praca.ev = null; this.praca.coreto.setVisible(true); }
  },

  // ---------------------------------------------------- protestos
  atualizarProtesto(evento) {
    const P = this.praca; if (!P || !Sim.S) return;
    const p = Vida.protestoAtivo ? Vida.protestoAtivo() : null;
    // dispersão pela Guarda: animação antes de sumir
    if (evento && evento.resposta === 'guarda' && P.prot) { this.dispersar(); return; }
    if (!p) { if (P.prot) this.encerrarProtestoMapa(); return; }
    if (P.prot && P.prot.id === p.id) {
      if (p.resposta && P.prot.resposta !== p.resposta) { P.prot.resposta = p.resposta; this.respostaAnimada(p.resposta); }
      return;
    }
    if (P.prot) this.encerrarProtestoMapa();
    this.desenharProtesto(p);
  },
  desenharProtesto(p) {
    const P = this.praca, X = P.X, Y = P.Y, prof = y => 12 + y / 100000;
    const est = { id: p.id, objs: [], gente: [], timers: [], resposta: p.resposta || null };
    P.prot = est;
    const n = Math.min(54, Math.max(14, Math.round(p.pessoas / 40)));
    const grupo = this.add.container(0, 0).setDepth(0);
    for (let i = 0; i < n; i++) {
      const [x, y] = this.pontoPraca(i < n * 0.7 ? 'baixo' : 'meio');
      const k = Math.floor(Math.random() * 16);
      const pe = this.add.image(x, y, 'pes' + k).setOrigin(0).setScale(0.5).setDepth(prof(y + 18));
      pe.n = k; pe.lado = Math.random() < 0.5 ? 1 : 0;
      if (Math.random() < 0.45) { pe.cor = Math.floor(Math.random() * 4); pe.cartaz = this.add.image(x - 3, y - 15, 'cartaz' + pe.cor).setOrigin(0).setScale(0.5).setDepth(prof(y + 18.5)); est.objs.push(pe.cartaz); }
      this.tweens.add({ targets: pe, y: y - 2, yoyo: true, repeat: -1, duration: 380 + Math.random() * 200, delay: Math.random() * 300 });
      est.gente.push(pe); est.objs.push(pe);
    }
    // marcha lenta de um lado para o outro
    est.timers.push(this.time.addEvent({ delay: 50, loop: true, callback: () => {
      const dx = Math.sin(this.time.now / 2600) * 0.35;
      for (const pe of est.gente) if (!pe.fugindo) pe.x += dx;
    } }));
    // faixa com o tema
    const faixa = this.add.text(X + P.W / 2, Y + 236, p.faixa, { fontFamily: '"Nunito", sans-serif', fontSize: '13px', fontStyle: 'bold', color: '#c4302b', backgroundColor: '#f6f2e6', padding: { x: 10, y: 3 } })
      .setOrigin(0.5).setResolution(2).setDepth(66);
    this.tweens.add({ targets: faixa, angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 1300, ease: 'Sine.easeInOut' });
    const seg1 = this.add.image(faixa.x - faixa.width / 2 - 6, Y + 238, 'pes3').setOrigin(0).setScale(0.5).setDepth(prof(Y + 256));
    const seg2 = this.add.image(faixa.x + faixa.width / 2 - 2, Y + 238, 'pes9').setOrigin(0).setScale(0.5).setDepth(prof(Y + 256));
    est.objs.push(faixa, seg1, seg2); est.faixa = faixa;
    // carro de som com ondas sonoras
    const cs = this.add.image(X + P.W - 46, Y + 286, 'carro_som').setOrigin(0).setScale(0.5).setDepth(prof(Y + 300));
    est.objs.push(cs);
    est.timers.push(this.time.addEvent({ delay: 700, loop: true, callback: () => {
      const o = this.add.circle(cs.x + 6, cs.y + 2, 4).setStrokeStyle(1.5, 0xffffff, 0.9).setDepth(71);
      this.tweens.add({ targets: o, radius: 22, alpha: 0, duration: 900, onComplete: () => o.destroy() });
    } }));
    // gritos de guerra em balões
    est.timers.push(this.time.addEvent({ delay: 2200, loop: true, callback: () => {
      if (!est.gente.length) return;
      const pe = Phaser.Utils.Array.GetRandom(est.gente);
      const txt = est.resposta === 'vaia' ? Phaser.Utils.Array.GetRandom(['Fora!', 'Uuuuh!', 'Mentiroso!']) : est.resposta === 'aplauso' || est.resposta === 'comissao' ? Phaser.Utils.Array.GetRandom(['Vamos cobrar!', 'Queremos resposta!', 'Isso aí!']) : Phaser.Utils.Array.GetRandom(p.slogans);
      this.gritar(pe.x + 5, pe.y - 6, txt, est.resposta === 'aplauso');
    } }));
    if (est.resposta) this.respostaAnimada(est.resposta);
  },
  gritar(x, y, txt, bom) {
    const t = this.add.text(x, y, txt, { fontFamily: '"Nunito", sans-serif', fontSize: '12px', fontStyle: 'bold', color: bom ? '#2c6a2a' : '#8a1f12', backgroundColor: '#fff6e2', padding: { x: 5, y: 2 } })
      .setOrigin(0.5, 1).setResolution(2).setDepth(74).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: y - 10, duration: 250, onComplete: () => this.tweens.add({ targets: t, alpha: 0, y: y - 24, delay: 1400, duration: 500, onComplete: () => t.destroy() }) });
  },
  // o prefeito sai da prefeitura e vai até a praça
  respostaAnimada(r) {
    const P = this.praca, est = P.prot; if (!est) return;
    const ini = [(Sim.S.lotes.find(l => l.id === 'P1').x + 1.5) * TILE, (Sim.S.lotes.find(l => l.id === 'P1').y + 3) * TILE];
    const fim = [P.X + P.W / 2 + 10, P.Y + 214];
    const pf = this.add.image(ini[0], ini[1], 'prefeito').setOrigin(0).setScale(0.5).setDepth(13);
    est.objs.push(pf);
    const acomp = [];
    if (r === 'comissao') for (let i = 0; i < 2; i++) { const a = this.add.image(ini[0] + 10 + i * 8, ini[1] + 4, 'pes6').setOrigin(0).setScale(0.5).setDepth(13); acomp.push(a); est.objs.push(a); }
    this.tweens.add({ targets: [pf, ...acomp], x: `-=${ini[0] - fim[0]}`, y: `-=${ini[1] - fim[1]}`, duration: 3000, ease: 'Sine.easeInOut', onComplete: () => {
      pf.setDepth(12 + (fim[1] + 22) / 100000);
      if (r === 'aplauso') { this.confetePraca(fim[0], fim[1]); for (let i = 0; i < 5; i++) this.time.delayedCall(i * 400, () => { const pe = Phaser.Utils.Array.GetRandom(est.gente); if (pe) this.gritar(pe.x + 5, pe.y - 6, 'Boa, prefeito!', true); }); }
      if (r === 'vaia') { for (let i = 0; i < 6; i++) this.time.delayedCall(i * 250, () => { const pe = Phaser.Utils.Array.GetRandom(est.gente); if (pe) this.gritar(pe.x + 5, pe.y - 6, 'Uuuuh!', false); });
        this.time.delayedCall(2600, () => this.tweens.add({ targets: pf, x: ini[0], y: ini[1], duration: 2400 })); }
      if (r === 'comissao') {
        // alguns manifestantes baixam os cartazes e conversam
        est.gente.slice(0, Math.ceil(est.gente.length / 2)).forEach(pe => { if (pe.cartaz) pe.cartaz.setAlpha(0.4); });
        this.gritar(fim[0] + 5, fim[1] - 6, 'Vamos conversar!', true);
      }
      this.tweens.add({ targets: pf, y: pf.y - 2, yoyo: true, repeat: -1, duration: 450 });
    } });
  },
  // a Guarda chega em fila e o povo corre
  dispersar() {
    const P = this.praca, est = P.prot; if (!est) return;
    est.timers.forEach(t => t.remove()); est.timers = [];
    const guardas = [];
    for (let i = 0; i < 8; i++) {
      const g = this.add.image(P.X + P.W + 30 + i * 4, P.Y + 220 + i * 9, 'guarda_p').setOrigin(0).setScale(0.5).setDepth(13 + i * 0.001);
      guardas.push(g); est.objs.push(g);
      this.tweens.add({ targets: g, x: P.X + P.W - 40 - (i % 2) * 12, duration: 1400, ease: 'Sine.easeOut' });
    }
    this.time.delayedCall(1300, () => {
      for (const pe of est.gente) {
        pe.fugindo = true; this.tweens.killTweensOf(pe);
        const dir = pe.x < P.cx ? -1 : 1;
        const dx = dir < 0 ? P.X - 80 - Math.random() * 60 : P.X + P.W + 80 + Math.random() * 60;
        pe.setFlipX(dir < 0).setTexture('pes' + pe.n);
        this.tweens.add({ targets: pe, x: dx, y: pe.y + (Math.random() - 0.5) * 60, duration: 1500 + Math.random() * 900, ease: 'Quad.easeIn' });
        if (pe.cartaz) this.tweens.add({ targets: pe.cartaz, y: pe.cartaz.y + 14, angle: 80, alpha: 0.7, duration: 600 });
      }
      if (est.faixa) this.tweens.add({ targets: est.faixa, angle: 30, y: est.faixa.y + 12, alpha: 0.5, duration: 500 });
    });
    this.time.delayedCall(4200, () => this.encerrarProtestoMapa());
  },
  encerrarProtestoMapa() {
    const P = this.praca, est = P && P.prot; if (!est) return;
    est.timers.forEach(t => t.remove());
    est.objs.forEach(o => { this.tweens.killTweensOf(o); o.destroy(); });
    P.prot = null;
  },
});
