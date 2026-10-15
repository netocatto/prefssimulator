// =====================================================================
//  PREFEITO — interface (HTML por cima do mapa)
// =====================================================================

const UI = (() => {
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = v => Sim.fmtDinheiro(v);
  const pct = v => Math.round(v * 100) + '%';
  const num = v => Math.round(v).toLocaleString('pt-BR');
  let painel = null;       // { tipo, arg }
  let modalAberto = false;
  let modalFila = [];
  let rascunho = null;     // rascunho do projeto de impostos

  // ------------------------------------------------------------- helpers
  function barra(v, max = 100, cor = 'var(--ouro)', marca) {
    const w = Sim.clamp(v / max * 100, 0, 100);
    return `<span class="barra"><i style="width:${w}%;background:${cor}"></i>${marca != null ? `<b style="left:${marca / max * 100}%"></b>` : ''}</span>`;
  }
  function corAprov(v) { return v >= 60 ? 'var(--verde)' : v >= 45 ? 'var(--ouro)' : 'var(--vermelho)'; }
  function corCob(v) { return v >= 0.85 ? 'var(--verde)' : v >= 0.55 ? 'var(--ouro)' : 'var(--vermelho)'; }
  function pill(st) {
    const m = { cumprida: ['ok', 'Cumprida'], mantida: ['ok', 'Mantida'], andamento: ['and', 'Em andamento'], quebrada: ['ruim', 'Quebrada'] }[st];
    return `<span class="pill ${m[0]}">${m[1]}</span>`;
  }
  function dataHoje() { const S = Sim.S; return `${S.dia} de ${MESES[S.mes].toLowerCase()} de ${S.ano}`; }

  // --------------------------------------------------------------- HUD
  function atualizarHUD() {
    const S = Sim.S; if (!S) return;
    $('#h-cidade').textContent = S.cidade;
    $('#h-mandato').textContent = `${S.mandato}º mandato · ${S.inicioMandato}–${S.inicioMandato + 1}`;
    const sem = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][new Date(S.ano, S.mes, S.dia).getDay()];
    $('#h-data').textContent = `${sem}, ${S.dia} de ${MESES[S.mes].toLowerCase()} de ${S.ano}`;
    const fin = S.ultimoFinanceiro;
    $('#h-caixa').innerHTML = `<small>Caixa</small><span class="${S.caixa < 0 ? 'neg' : ''}">${D(S.caixa)}</span><em class="${fin && fin.saldo < 0 ? 'neg' : 'pos'}">${fin ? (fin.saldo >= 0 ? '+' : '') + D(fin.saldo) + '/mês' : ''}</em>`;
    const ap = Sim.aprovCidade();
    $('#h-aprov').innerHTML = `<small>Aprovação</small>${barra(ap, 100, corAprov(ap))}<span style="color:${corAprov(ap)}">${Math.round(ap)}%</span>`;
    $('#h-pop').innerHTML = `Habitantes <b>${num(Sim.popTotal())}</b>`;
    $('#h-desemp').innerHTML = `Desemprego <b class="${S.desemprego > 9 ? 'neg' : ''}">${S.desemprego.toFixed(1).replace('.', ',')}%</b>`;
    const meses = (S.inicioMandato + 1 - S.ano) * 12 + (9 - S.mes);
    $('#h-eleicao').innerHTML = S.eleicaoFeita ? 'Eleição <b>encerrada</b>' :
      `Eleição <b>${meses <= 0 ? 'este mês!' : 'em ' + meses + (meses === 1 ? ' mês' : ' meses')}</b>`;
    document.querySelectorAll('[data-vel]').forEach(b => b.classList.toggle('ativo', +b.dataset.vel === Jogo.velocidade));
    // indicador na Câmara se houver pedido
    const pedidos = S.vereadores.filter(v => v.pedido).length;
    $('#m-camara').dataset.badge = S.projeto ? '!' : pedidos ? pedidos : '';
    $('#m-ouvidoria').dataset.badge = '';
    const nl = Vida.naoLidos();
    $('#m-avisos').dataset.badge = nl ? (nl > 9 ? '9+' : nl) : '';
    $('#m-eventos').dataset.badge = Vida.protestoAtivo() ? '!' : Vida.eventoHoje() ? '♪' : '';
    $('#m-recursos').dataset.badge = (S.ofertasRecursos && S.ofertasRecursos.length) ? S.ofertasRecursos.length : '';
    $('#m-licitacoes').dataset.badge = S.lotes.some(l => l.obra && l.obra.parada) ? '!' : '';
    $('#m-empresas').dataset.badge = (S.cobrancas && S.cobrancas.length) ? '!' : (S.propostas && S.propostas.length) ? S.propostas.length : '';
  }
  // cor da luz ambiente conforme a hora: amanhecer rosado, entardecer laranja, noite azul
  function corDaHora(h) {
    const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
    if (h < 7.5) return [255, 160, 130, lerp(0.25, 0, (h - 6) / 1.5)];
    if (h < 16) return [0, 0, 0, 0];
    if (h < 18.5) return [255, 130, 40, lerp(0, 0.22, (h - 16) / 2.5)];
    if (h < 20.5) { const t = (h - 18.5) / 2; return [lerp(255, 12, t), lerp(130, 18, t), lerp(40, 60, t), lerp(0.22, 0.62, t)]; }
    return [12, 18, 60, 0.62];
  }
  function atualizarDiaBar() {
    const S = Sim.S; if (!S || !$('#inicio').hidden) return;
    $('#h-diaBar').style.width = (S.tempoDia / Sim.duracaoDia() * 100) + '%';
    const h = Sim.horaDoDia();
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 6) * 10;
    $('#h-hora').textContent = `${String(hh % 24).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    const c = corDaHora(h), cor = `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${(c[3] * 0.75).toFixed(2)})`;
    if (cor !== ultimaCor) { $('#luz').style.backgroundColor = cor; ultimaCor = cor; }
    $('.relogio').classList.toggle('noite', h >= 18.5);
  }
  let ultimaCor = '';
  function dormir() {
    if (!Jogo.rodando()) return;
    const v = $('#sono'); v.classList.add('ativo');
    Som.sfx('clique');
    setTimeout(() => { Sim.dormir(); atualizarHUD(); renderPainelSeVivo(); atualizarDiaBar(); setTimeout(() => v.classList.remove('ativo'), 120); }, 450);
  }
  function tooltipsVelocidade() {
    const S = Sim.S; if (!S) return;
    const seg = Sim.duracaoDia();
    const fmt = x => x >= 60 ? `${Math.round(x / 60)} min` : `${Math.round(x)} s`;
    document.querySelectorAll('[data-vel]').forEach(b => {
      const v = +b.dataset.vel;
      b.title = v === 0 ? 'Pausar (espaço)' : `${v === 1 ? 'Velocidade normal' : v + 'x mais rápido'}: 1 dia = ${fmt(seg / v)}`;
    });
  }

  // ------------------------------------------------------------- painel
  function abrir(tipo, arg) {
    const mesmo = painel && painel.tipo === tipo && painel.arg === arg;
    painel = { tipo, arg };
    if (tipo === 'impostos') rascunho = null;
    if (!mesmo) $('#painel-corpo').innerHTML = '';
    document.querySelectorAll('.menu button').forEach(b => b.classList.toggle('ativo', b.dataset.p === tipo));
    renderPainel();
    $('#painel').hidden = false;
    posicionarPainel();
  }
  // escala única da interface: tudo cresce e encolhe junto com a tela
  let escala = 1;
  function escalaUI() {
    const w = window.innerWidth, h = window.innerHeight;
    escala = Math.min(w / 1440, h / 860);
    escala = h < 520 ? Sim.clamp(escala, 0.62, 0.8) : Sim.clamp(escala, 0.72, 1.4);
    document.documentElement.style.setProperty('--ui', escala.toFixed(3));
    posicionarPainel();
  }
  // o painel fica entre o relógio e a barra de ícones; em tela estreita cobre a parte de cima
  function posicionarPainel() {
    const p = $('#painel'), z = escala;
    const rel = document.querySelector('.relogio').getBoundingClientRect();
    const barra = document.querySelector('.barra-icones').getBoundingClientRect();
    const estreita = window.innerWidth / z < 980 || window.innerHeight < 520;
    p.classList.toggle('cheio', estreita);
    const topo = estreita ? 8 : rel.bottom + 8;
    const fundo = Math.max(8, window.innerHeight - barra.top + 8);
    p.style.top = Math.round(topo / z) + 'px';
    p.style.bottom = Math.round(fundo / z) + 'px';
  }
  // recolher/expandir a placa da cidade e o relógio (bom para celular pequeno)
  function ligarRecolher() {
    let pref = null;
    try { pref = JSON.parse(localStorage.getItem('prefeito_hud_recolhido') || 'null'); } catch (e) {}
    if (!pref) { const peq = window.innerWidth < 820 || window.innerHeight < 520; pref = { placa: peq, relogio: peq }; }
    const aplicar = () => {
      for (const k of ['placa', 'relogio']) {
        const el = document.querySelector('.' + k), b = el.querySelector('.recolher');
        el.classList.toggle('recolhido', !!pref[k]);
        b.textContent = pref[k] ? '+' : '–';
        b.setAttribute('aria-expanded', String(!pref[k]));
      }
      posicionarPainel();
    };
    document.querySelectorAll('[data-recolher]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      pref[b.dataset.recolher] = !pref[b.dataset.recolher];
      try { localStorage.setItem('prefeito_hud_recolhido', JSON.stringify(pref)); } catch (er) {}
      aplicar();
    }));
    aplicar();
  }
  function fechar() {
    painel = null; $('#painel').hidden = true;
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('ativo'));
  }
  function renderPainel() {
    if (!painel || !Sim.S) return;
    const corpo = $('#painel-corpo');
    const abertos = [...corpo.querySelectorAll('details[open]')].map(d => d.dataset.k);
    const rolagem = corpo.scrollTop;
    const r = RENDER[painel.tipo](painel.arg);
    $('#painel-titulo').textContent = r.titulo;
    corpo.innerHTML = r.html;
    corpo.querySelectorAll('details[data-k]').forEach(d => { if (abertos.includes(d.dataset.k)) d.open = true; });
    corpo.scrollTop = rolagem;
    if (r.depois) r.depois(corpo);
  }
  const PAINEIS_VIVOS = ['lote', 'populacao', 'promessas', 'camara', 'bairro', 'ouvidoria', 'empresas', 'avisos', 'eventos', 'ocorrencia', 'praca'];
  const PAINEIS_MENSAIS = ['financas', 'regiao', 'jornal', 'licitacoes', 'recursos'];

  const RENDER = {};

  // ---------------------------------------------------------- finanças
  RENDER.financas = () => {
    const S = Sim.S;
    const fin = Sim.calcularFinancas(false);
    const ult = S.ultimoFinanceiro;
    const nomesR = { iptu: 'IPTU residencial', iptuInd: 'IPTU de indústrias', iss: 'ISS', itbi: 'ITBI', lixo: 'Taxa de lixo', fpm: 'FPM (federal)', icms: 'Cota do ICMS (estadual)', ipva: 'Cota do IPVA (estadual)', convenios: 'Verbas federais e estaduais (convênios)', issEmp: 'ISS das empresas atraídas', icmsEmp: 'ICMS das empresas atraídas', iptuEmp: 'IPTU das empresas atraídas', fundeb: 'FUNDEB (por matrícula)', sus: 'Repasse do SUS' };
    const nomesD = { admin: 'Administração e folha', saude: 'Saúde', educacao: 'Educação', seguranca: 'Segurança', urbano: 'Lixo, ruas e iluminação', cultura: 'Cultura e lazer', previdencia: 'Previdência dos servidores', divida: 'Dívidas e precatórios', camara: 'Repasse à Câmara', decimo: '13º salário', obras: 'Parcelas de obras', contratos: 'Contratos de serviços' };
    const linhas = (obj, nomes) => Object.entries(obj).filter(([k, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<tr><td>${nomes[k]}</td><td class="n">${D(v)}</td></tr>`).join('');
    const af = S.anoFiscal;
    const ps = af.baseCalculo ? af.saude / af.baseCalculo : fin.pctSaude;
    const pe = af.baseCalculo ? af.educacao / af.baseCalculo : fin.pctEducacao;
    const hist = S.historico.slice(-12);
    let graf = '';
    if (hist.length) {
      const max = Math.max(1, ...hist.map(h => Math.abs(h.caixa)));
      graf = `<div class="mini">${hist.map(h => `<span title="${MESES_CURTO[h.mes]}/${h.ano}: ${D(h.caixa)}"><i class="${h.caixa < 0 ? 'neg' : ''}" style="height:${Math.max(3, Math.abs(h.caixa) / max * 100)}%"></i><em>${MESES_CURTO[h.mes][0]}</em></span>`).join('')}</div>`;
    }
    const orc = S.orcamento;
    const impOrc = k => {
      const est = Sim.estimar(() => { const a = Sim.S.orcamento[k]; Sim.S.orcamento[k] = 1; return () => { Sim.S.orcamento[k] = a; }; });
      // est mede "voltar a 100%"; o impacto do nível atual é o inverso
      return `Comparado a 100%: <b class="${tomSaldo(-est.saldo)}">${sinal(-est.saldo)}/mês</b> · aprovação <b class="${tomAprov(-est.aprov)}">${pts(-est.aprov)}</b>`;
    };
    const slider = (k, nome, ef) => `<label class="slider"><span>${nome} <b id="o-${k}">${Math.round(orc[k] * 100)}%</b></span>
      <input type="range" id="orc-${k}" min="80" max="130" step="5" value="${Math.round(orc[k] * 100)}" data-k="${k}"><small>${ef}</small><small class="imp-vivo" id="imp-${k}">${impOrc(k)}</small></label>`;
    return {
      titulo: 'Finanças da Prefeitura',
      html: `
        <div class="destaque"><div><small>Caixa hoje</small><strong class="${S.caixa < 0 ? 'neg' : ''}">${D(S.caixa)}</strong></div>
          <div><small>Previsão do mês</small><strong class="${fin.saldo < 0 ? 'neg' : 'pos'}">${fin.saldo >= 0 ? '+' : ''}${D(fin.saldo)}</strong></div></div>
        ${graf ? '<h3>Caixa nos últimos meses</h3>' + graf : ''}
        <h3>Mínimos da Constituição (acumulado do ano)</h3>
        <div class="indice"><span>Saúde <b class="${ps < .15 ? 'neg' : 'pos'}">${(ps * 100).toFixed(1).replace('.', ',')}%</b> <small>mínimo 15%</small></span>${barra(ps * 100, 40, ps < .15 ? 'var(--vermelho)' : 'var(--verde)', 15)}</div>
        <div class="indice"><span>Educação <b class="${pe < .25 ? 'neg' : 'pos'}">${(pe * 100).toFixed(1).replace('.', ',')}%</b> <small>mínimo 25%</small></span>${barra(pe * 100, 40, pe < .25 ? 'var(--vermelho)' : 'var(--verde)', 25)}</div>
        <p class="nota">Em dezembro o Tribunal de Contas confere. Abaixo do mínimo, as contas são rejeitadas e a oposição ganha força.</p>
        <h3>Orçamento por área</h3>
        ${slider('saude', 'Saúde (custeio)', 'Mais verba melhora o atendimento e o índice de 15%.')}
        ${slider('educacao', 'Educação (custeio)', 'Mais verba melhora as escolas e o índice de 25%.')}
        ${slider('urbano', 'Lixo, ruas e iluminação', 'Cortar aqui deixa a cidade suja e irrita todo mundo.')}
        ${slider('admin', 'Administração e folha', 'Cortar economiza, mas os trabalhadores reclamam.')}
        <div class="duas">
          <div><h3>Receitas ${ult ? '(mês passado)' : '(previsão)'}</h3><table>${linhas((ult || fin).R, nomesR)}<tr class="tot"><td>Total</td><td class="n">${D((ult || fin).receitaTotal)}</td></tr></table></div>
          <div><h3>Despesas ${ult ? '(mês passado)' : '(previsão)'}</h3><table>${linhas((ult || fin).D, nomesD)}<tr class="tot"><td>Total</td><td class="n">${D((ult || fin).despesaTotal)}</td></tr></table></div>
        </div>`,
      depois: el => el.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('input', () => {
        Sim.S.orcamento[inp.dataset.k] = +inp.value / 100;
        el.querySelector('#o-' + inp.dataset.k).textContent = inp.value + '%';
        el.querySelector('#imp-' + inp.dataset.k).innerHTML = impOrc(inp.dataset.k);
        atualizarHUD();
      })) ,
    };
  };

  // ---------------------------------------------------------- impostos
  RENDER.impostos = () => {
    const S = Sim.S;
    if (!rascunho) {
      rascunho = {};
      for (const k in Sim.CAMPOS_IMPOSTO) {
        const pend = S.leisPendentes.find(l => l.campo === k);
        rascunho[k] = pend ? pend.valor : Sim.lerImposto(k);
      }
    }
    const linhas = Object.entries(Sim.CAMPOS_IMPOSTO).map(([k, c]) => {
      const atual = Sim.lerImposto(k);
      const pend = S.leisPendentes.find(l => l.campo === k);
      const base = pend ? pend.valor : atual;
      const mudou = Math.abs(rascunho[k] - base) > 1e-9;
      return `<div class="imposto ${mudou ? 'mudou' : ''}">
        <div class="top"><span>${c.nome}</span><b>${Sim.fmtImposto(k, rascunho[k])}</b></div>
        <input type="range" id="imp-${k.replace('.', '-')}" data-k="${k}" min="${c.min}" max="${c.max}" step="${c.passo}" value="${rascunho[k]}" ${S.projeto ? 'disabled' : ''}>
        <small>Em vigor: ${Sim.fmtImposto(k, atual)}${pend ? ` · aprovado ${Sim.fmtImposto(k, pend.valor)} a partir de ${Sim.fmtMesIndex(pend.mesIndex)}` : ''}${k === 'iss' ? ` · média dos vizinhos ${Sim.issMedioVizinhos().toFixed(2).replace('.', ',')}%` : ''}</small>
      </div>`;
    }).join('');
    const mud = mudancasRascunho();
    let prev = '';
    if (mud.length) {
      // impacto estimado na receita
      const orig = JSON.parse(JSON.stringify(S.impostos));
      const f0 = Sim.calcularFinancas(false).receitaTotal;
      for (const m of mud) { const [a, b] = m.campo.split('.'); if (b) S.impostos[a][b] = m.para; else S.impostos[a] = m.para; }
      const f1 = Sim.calcularFinancas(false).receitaTotal;
      S.impostos = orig;
      const sim = S.vereadores.filter(v => Sim.preverVoto(v, mud) >= 50).length;
      const sobe = mud.some(m => m.para > m.de);
      prev = `<div class="projeto">
        <h3>Projeto de lei</h3>
        <ul>${mud.map(m => `<li>${Sim.CAMPOS_IMPOSTO[m.campo].nome}: ${Sim.fmtImposto(m.campo, m.de)} → <b>${Sim.fmtImposto(m.campo, m.para)}</b></li>`).join('')}</ul>
        ${(() => { const est = Sim.estimar(() => { const orig = JSON.parse(JSON.stringify(S.impostos)); for (const m of mud) { const [a, b] = m.campo.split('.'); if (b) S.impostos[a][b] = m.para; else S.impostos[a] = m.para; } return () => { S.impostos = orig; }; });
          return impactos([['Receita estimada', `${sinal(f1 - f0)}/mês`, tomSaldo(f1 - f0)], ...linhasAprov(est)], 'Impacto quando entrar em vigor'); })()}
        <p>Previsão na Câmara: <b class="${sim >= 6 ? 'pos' : 'neg'}">cerca de ${sim} votos a favor</b> (precisa de 6)</p>
        ${sobe ? '<p class="nota">Aumentos só valem a partir de 1º de janeiro do ano seguinte e no mínimo 90 dias depois (anterioridade e noventena). Reduções valem na hora.</p>' : ''}
        ${S.promessas.includes('impostos') && sobe ? '<p class="alerta">Você prometeu não aumentar impostos. Se aprovado, a promessa é quebrada.</p>' : ''}
        <button class="btn primario" id="enviar-projeto">Enviar à Câmara</button>
      </div>`;
    }
    const tram = S.projeto ? `<div class="projeto tram"><h3>Projeto em tramitação</h3><ul>${S.projeto.mudancas.map(m => `<li>${Sim.CAMPOS_IMPOSTO[m.campo].nome}: ${Sim.fmtImposto(m.campo, m.de)} → <b>${Sim.fmtImposto(m.campo, m.para)}</b></li>`).join('')}</ul>
      <p>Votação na sessão do dia ${S.projeto.sessao.dia}${S.projeto.sessao.mesIndex !== S.mesIndex ? ' do próximo mês' : ''}. Converse com os vereadores no painel da Câmara.</p></div>` : '';
    return {
      titulo: 'Impostos e taxas',
      html: `<p class="nota">Mexa nos valores e envie o projeto. Toda mudança precisa passar pela Câmara de Vereadores.</p>${tram}${linhas}${prev}`,
      depois: el => {
        el.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('change', () => { rascunho[inp.dataset.k] = +inp.value; renderPainel(); }));
        el.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('input', () => { inp.parentElement.querySelector('.top b').textContent = Sim.fmtImposto(inp.dataset.k, +inp.value); }));
        const b = el.querySelector('#enviar-projeto');
        if (b) b.addEventListener('click', () => {
          const sess = Sim.enviarProjeto(mudancasRascunho());
          if (sess) toast(`Projeto enviado. Votação no dia ${sess.dia}${sess.mesIndex !== Sim.S.mesIndex ? ' do próximo mês' : ''}.`);
          rascunho = null; renderPainel(); atualizarHUD();
        });
      },
    };
  };
  function mudancasRascunho() {
    const S = Sim.S, out = [];
    if (!rascunho) return out;
    for (const k in rascunho) {
      const pend = S.leisPendentes.find(l => l.campo === k);
      const de = pend ? pend.valor : Sim.lerImposto(k);
      if (Math.abs(rascunho[k] - de) > 1e-9) out.push({ campo: k, de, para: rascunho[k] });
    }
    return out;
  }

  // ------------------------------------------------------------- câmara
  RENDER.camara = () => {
    const S = Sim.S;
    const ordem = { base: 0, indep: 1, opos: 2 };
    const vs = S.vereadores.slice().sort((a, b) => ordem[a.lado] - ordem[b.lado] || b.lealdade - a.lealdade);
    const nomeLado = { base: 'Base aliada', indep: 'Independente', opos: 'Oposição' };
    const cadeiras = vs.map(v => `<i class="cad ${v.lado}" title="${esc(v.nome)}"></i>`).join('');
    const lista = vs.map(v => `
      <div class="ver">
        <div class="ver-top"><span class="dot ${v.lado}"></span><b>${esc(v.nome)}</b><small>${v.partido} · ${Sim.bairroById(v.bairro).nome}</small></div>
        <div class="ver-leal"><small>${nomeLado[v.lado]} · lealdade</small>${barra(v.lealdade, 100, corAprov(v.lealdade))}<small>${Math.round(v.lealdade)}</small></div>
        <div class="ver-acoes">
          <button class="btn" data-reuniao="${v.id}" ${v.reuniaoMes === S.mesIndex ? 'disabled' : ''} title="Grátis · +${v.lado === 'opos' ? 3 : 5} de lealdade · uma vez por mês">${v.reuniaoMes === S.mesIndex ? 'Reunião feita' : `Reunião (+${v.lado === 'opos' ? 3 : 5} lealdade)`}</button>
          ${v.pedido ? `<button class="btn ouro" data-pedido="${v.id}">Atender: ${esc(v.pedido.texto)}</button>` : '<small class="nota">Sem pedidos no momento</small>'}
        </div>
        ${v.pedido ? impactos([['Custo único', D(v.pedido.valor), 'neg'], ['Lealdade do vereador', `+18 (${Math.round(v.lealdade)} → ${Math.min(100, Math.round(v.lealdade + 18))})`, 'pos'], [`Aprovação em ${Sim.bairroById(v.bairro).nome}`, '+1,5 ponto', 'pos']]) : ''}
      </div>`).join('');
    const tram = S.projeto ? `<div class="projeto tram"><h3>Em pauta: projeto de impostos</h3><p>Votação no dia ${S.projeto.sessao.dia}${S.projeto.sessao.mesIndex !== S.mesIndex ? ' do próximo mês' : ''}. Previsão hoje: <b>${S.vereadores.filter(v => Sim.preverVoto(v, S.projeto.mudancas) >= 50).length} votos a favor</b> de 6 necessários.</p></div>` : '';
    return {
      titulo: 'Câmara de Vereadores',
      html: `<div class="plenario">${cadeiras}</div>
        <p class="nota">11 cadeiras. Projetos precisam de 6 votos. Reuniões aumentam a lealdade uma vez por mês; atender pedidos custa dinheiro, mas conquista votos e agrada o bairro do vereador.</p>
        ${tram}${lista}`,
      depois: el => {
        el.querySelectorAll('[data-reuniao]').forEach(b => b.addEventListener('click', () => { const g = Sim.reuniao(b.dataset.reuniao); if (g) toast(`Reunião produtiva: +${g} de lealdade`); renderPainel(); }));
        el.querySelectorAll('[data-pedido]').forEach(b => b.addEventListener('click', () => { Sim.atenderPedido(b.dataset.pedido); toast('Pedido atendido. O vereador ficou mais fiel.'); renderPainel(); atualizarHUD(); }));
      },
    };
  };

  // ----------------------------------------------------------- promessas
  RENDER.promessas = () => {
    const S = Sim.S;
    const cov = Sim.calcularCobertura();
    const progresso = id => {
      const c = S.termo.construidos;
      switch (id) {
        case 'hospital': return S.lotes.some(l => l.obra && l.obra.tipo === 'hospital') ? 'Obra em andamento' : `${c.hospital || 0} de 1 inaugurado`;
        case 'creche': return `Cobertura atual ${pct(Sim.coberturaCidade(cov, 'creche'))} · meta 90%`;
        case 'empregos': return `Desemprego atual ${S.desemprego.toFixed(1).replace('.', ',')}% · meta 6%`;
        case 'escolas': return `${c.escola || 0} de 2 inauguradas`;
        case 'seguranca': return `Cobertura atual ${pct(Sim.coberturaCidade(cov, 'seguranca'))} · meta 90%`;
        case 'iptu': return `IPTU médio ${S.termo.iptuInicio.toFixed(2).replace('.', ',')}% no início do mandato`;
        case 'impostos': return S.termo.aumentou ? 'Um aumento foi aprovado' : 'Nenhum aumento aprovado até agora';
        case 'bombeiros': return `${c.bombeiros || 0} de 1 inaugurado`;
        case 'cultura': return `${c.cultura || 0} de 1 inaugurado`;
        case 'contas': return S.termo.mesNegativo ? 'O caixa ficou negativo em algum mês' : 'Caixa positivo em todos os meses';
      }
    };
    const proms = S.promessas.map(id => {
      const p = PROMESSAS.find(x => x.id === id);
      return `<div class="prom"><div class="prom-top"><b>${p.titulo}</b>${pill(Sim.statusPromessa(id, cov))}</div><small>${p.desc}</small><small class="prog">${progresso(id)}</small><span class="peso">${'■'.repeat(p.peso)}${'□'.repeat(3 - p.peso)} peso na eleição</span></div>`;
    }).join('');
    const ult = [...S.jornais].reverse().find(j => j.pesquisa);
    const meses = (S.inicioMandato + 1 - S.ano) * 12 + (9 - S.mes);
    return {
      titulo: 'Promessas e eleição',
      html: `<div class="destaque"><div><small>Eleição</small><strong>${S.eleicaoFeita ? 'Encerrada' : `outubro de ${S.inicioMandato + 1}`}</strong></div><div><small>Faltam</small><strong>${S.eleicaoFeita ? '—' : meses <= 0 ? 'dias' : meses + ' meses'}</strong></div></div>
        <h3>Suas promessas de campanha</h3>${proms}
        <p class="nota">Na eleição, promessa que não foi cumprida conta como quebrada.</p>
        <h3>Oposição</h3>
        <div class="rival"><b>${esc(S.candidato.nome)}</b> <small>${PARTIDOS[S.candidato.partido]}</small><p>"${esc(S.candidato.bordao)}"</p>
        <div class="indice"><span>Força da campanha</span>${barra(S.candidato.forca, 100, 'var(--vermelho)')}</div></div>
        ${ult ? `<h3>Última pesquisa (${MESES_CURTO[ult.mes]}/${ult.ano})</h3><div class="pesq"><div><span>${esc(S.prefeito)}</span>${barra(ult.pesquisa.voce, 100, 'var(--verde)')}<b>${Math.round(ult.pesquisa.voce)}%</b></div><div><span>${esc(S.candidato.nome)}</span>${barra(ult.pesquisa.rival, 100, 'var(--vermelho)')}<b>${Math.round(ult.pesquisa.rival)}%</b></div><small>Instituto Datavox · margem de erro de 3 pontos</small></div>` : '<p class="nota">As pesquisas eleitorais começam 9 meses antes da eleição e saem no jornal.</p>'}`,
    };
  };

  // ---------------------------------------------------------- população
  RENDER.populacao = () => {
    const S = Sim.S;
    const cov = Sim.calcularCobertura();
    const grupos = GRUPOS.map(g => { const v = Sim.aprovGrupo(g.id); return `<div class="linha-barra"><span>${g.nome}</span>${barra(v, 100, corAprov(v))}<b>${Math.round(v)}%</b></div>`; }).join('');
    const bairros = BAIRROS.map(b => { const v = Sim.aprovBairro(b.id); return `<div class="linha-barra clic" data-bairro="${b.id}"><span>${b.nome}</span>${barra(v, 100, corAprov(v))}<b>${Math.round(v)}%</b></div>`; }).join('');
    const cats = Object.keys(CATS);
    const tabela = `<div class="tabela-wrap"><table class="cob"><tr><th></th>${cats.map(c => `<th>${CATS[c].nome}</th>`).join('')}</tr>
      ${BAIRROS.map(b => `<tr><td>${b.nome}</td>${cats.map(c => `<td style="color:${corCob(cov[b.id][c])}">${pct(Math.min(1, cov[b.id][c]))}</td>`).join('')}</tr>`).join('')}
      <tr class="tot"><td>Cidade</td>${cats.map(c => `<td style="color:${corCob(Sim.coberturaCidade(cov, c))}">${pct(Sim.coberturaCidade(cov, c))}</td>`).join('')}</tr></table></div>`;
    return {
      titulo: 'População e aprovação',
      html: `<h3>Aprovação por grupo</h3>${grupos}<h3>Aprovação por bairro</h3>${bairros}
        <h3>Cobertura dos serviços públicos</h3>${tabela}
        <p class="nota">Cobertura é quanto da demanda o serviço consegue atender. Abaixo de 55% vira reclamação na certa.</p>`,
      depois: el => el.querySelectorAll('[data-bairro]').forEach(d => d.addEventListener('click', () => abrir('bairro', d.dataset.bairro))),
    };
  };

  RENDER.bairro = id => {
    const S = Sim.S, b = Sim.bairroById(id);
    const cov = Sim.calcularCobertura()[id];
    const grupos = GRUPOS.filter(g => b.comp[g.id] >= 0.05).map(g => { const v = S.bairros[id].aprov[g.id]; return `<div class="linha-barra"><span>${g.nome} <small>${Math.round(b.comp[g.id] * 100)}%</small></span>${barra(v, 100, corAprov(v))}<b>${Math.round(v)}%</b></div>`; }).join('');
    const servs = Object.keys(CATS).map(c => `<div class="linha-barra"><span>${CATS[c].nome}</span>${barra(Math.min(1, cov[c]) * 100, 100, corCob(cov[c]))}<b>${pct(Math.min(1, cov[c]))}</b></div>`).join('');
    const vers = S.vereadores.filter(v => v.bairro === id).map(v => v.nome).join(', ');
    const aprov = Sim.aprovBairro(id);
    return {
      titulo: b.nome,
      html: `<div class="destaque"><div><small>Moradores</small><strong>${num(S.bairros[id].pop)}</strong></div><div><small>Aprovação</small><strong style="color:${corAprov(aprov)}">${Math.round(aprov)}%</strong></div><div><small>IPTU</small><strong>${Sim.fmtImposto('iptu.' + id, S.impostos.iptu[id])}</strong></div></div>
        <p class="nota">Valor venal médio dos imóveis: ${D(b.venal)}. Vereadores do bairro: ${vers || 'nenhum'}.</p>
        <h3>Quem mora aqui</h3>${grupos}<h3>Serviços</h3>${servs}`,
    };
  };

  // ------------------------------------------------------------- região
  RENDER.regiao = () => {
    const S = Sim.S;
    const media = Sim.issMedioVizinhos();
    const linhas = S.rivais.map(r => `<tr><td><b>${r.nome}</b><small>${r.perfil}</small></td><td>${r.dir}, ${r.km} km</td><td class="n">${num(r.pop)}</td><td class="n">${r.iss.toFixed(2).replace('.', ',')}%</td><td class="n" style="color:${corAprov(r.aprov)}">${Math.round(r.aprov)}%</td></tr>`).join('');
    return {
      titulo: 'Região',
      html: `<div class="destaque"><div><small>Seu ISS</small><strong>${S.impostos.iss.toFixed(2).replace('.', ',')}%</strong></div><div><small>Média vizinha</small><strong>${media.toFixed(2).replace('.', ',')}%</strong></div><div><small>Sua população</small><strong>${num(Sim.popTotal())}</strong></div></div>
        <p class="nota">Se o seu ISS ficar acima da média dos vizinhos, comércio e indústria migram aos poucos para lá. Em breve as cidades vizinhas vão disputar empresas com você nas negociações.</p>
        <div class="tabela-wrap"><table class="regiao"><tr><th>Cidade</th><th>Direção</th><th>Pop.</th><th>ISS</th><th>Aprov. do prefeito</th></tr>${linhas}</table></div>`,
    };
  };

  // ---------------------------------------------------------- ouvidoria
  // o que cada fator significa para a população e o que resolve
  const NECESSIDADES = {
    'cat:saude':     { nome: 'Atendimento de saúde', bom: 'Atendimento de saúde', faz: 'Construir UBS ou hospital, ou contratar gestão das UBS', cat: 'saude' },
    'cat:educacao':  { nome: 'Vagas nas escolas', bom: 'Escolas', faz: 'Construir escola ou reforçar a merenda', cat: 'educacao' },
    'cat:creche':    { nome: 'Vagas em creche', bom: 'Creches', faz: 'Construir creche (procure recursos federais)', cat: 'creche' },
    'cat:seguranca': { nome: 'Segurança', bom: 'Segurança', faz: 'Base da Guarda Municipal ou câmeras', cat: 'seguranca' },
    'cat:incendio':  { nome: 'Bombeiros longe', bom: 'Bombeiros', faz: 'Construir posto de bombeiros', cat: 'incendio' },
    'cat:lazer':     { nome: 'Lazer e cultura', bom: 'Lazer e cultura', faz: 'Praça, Centro Cultural ou Wi-Fi nas praças', cat: 'lazer' },
    'iptu':          { nome: 'IPTU caro', bom: 'IPTU baixo', faz: 'Reduzir o IPTU dos bairros afetados' },
    'iss':           { nome: 'ISS alto para o comércio', bom: 'ISS baixo', faz: 'Reduzir o ISS' },
    'lixo':          { nome: 'Taxa de lixo cara', bom: 'Taxa de lixo baixa', faz: 'Reduzir a taxa de lixo' },
    'emprego':       { nome: 'Desemprego', bom: 'Emprego', faz: 'Atrair empresas e exigir mão de obra local' },
    'urbano':        { nome: 'Ruas sujas e esburacadas', bom: 'Cidade limpa', faz: 'Mais verba para lixo e ruas, coleta ou tapa-buraco' },
    'atraso':        { nome: 'Salários e contas atrasados', bom: '', faz: 'Equilibrar o caixa urgentemente' },
    'poluicao':      { nome: 'Poluição das fábricas', bom: '', faz: 'Exigir compensação ambiental das empresas' },
  };
  RENDER.ouvidoria = () => {
    const S = Sim.S;
    const r = Sim.resumoNecessidades();
    const nomeB = id => Sim.bairroById(id).nome, nomeG = id => GRUPOS.find(g => g.id === id).nome;
    const covCidade = c => pct(Sim.coberturaCidade(r.cov, c));
    const probs = r.problemas.map((p, i) => {
      const n = NECESSIDADES[p.k] || { nome: p.k, faz: '' };
      return `<div class="nec">
        <div class="nec-top"><span class="nec-n">${i + 1}</span><b>${n.nome}</b><span class="nec-peso">${Math.round(p.peso * 100)}% das queixas</span></div>
        ${barra(p.peso * 100, 60, i === 0 ? 'var(--vermelho)' : 'var(--ouro)')}
        <small>Mais sentido em ${p.bairros.map(nomeB).join(' e ')} · por ${p.grupos.map(nomeG).join(' e ').toLowerCase()}${n.cat ? ` · cobertura atual ${covCidade(n.cat)}` : ''}</small>
        <small class="nec-faz">O que resolve: ${n.faz}</small>
      </div>`;
    }).join('');
    const elogios = r.elogios.map(e => NECESSIDADES[e.k] && NECESSIDADES[e.k].bom).filter(Boolean);
    return {
      titulo: 'Ouvidoria',
      html: `<p class="nota">Resumo do que a população mais cobra da prefeitura agora.</p>
        <h3>O que a população precisa</h3>${probs || '<p class="vazio">Ninguém está reclamando de nada importante. Aproveite!</p>'}
        ${elogios.length ? `<h3>O que está agradando</h3><p class="elogios">${elogios.join(' · ')}</p>` : ''}
        <p class="nota">As falas que aparecem sobre as casas são moradores comentando a cidade. A equipe da Ouvidoria responde sozinha; aqui fica só o resumo.</p>`,
    };
  };

  // -------------------------------------------------------------- jornal
  RENDER.jornal = () => {
    const S = Sim.S;
    const itens = [...S.jornais].reverse().map((j, i) => `<button class="edicao" data-j="${S.jornais.length - 1 - i}"><small>Edição ${j.edicao} · ${MESES[j.mes]} ${j.ano}</small><b>${esc(j.manchete.texto)}</b></button>`).join('');
    return {
      titulo: 'Arquivo do jornal',
      html: itens || '<p class="vazio">O primeiro jornal sai no fim do mês.</p>',
      depois: el => el.querySelectorAll('[data-j]').forEach(b => b.addEventListener('click', () => mostrarJornal(Sim.S.jornais[+b.dataset.j]))),
    };
  };

  // --------------------------------------------------------------- lote
  RENDER.lote = id => {
    const S = Sim.S;
    const l = S.lotes.find(x => x.id === id);
    const b = Sim.bairroById(l.bairro);
    if (l.empresa) {
      const e = Sim.S.empresas.find(x => x.id === l.empresa); const c = Empresas.cat(e.catId);
      return { titulo: c.nome, html: `<div class="emp-top"><span class="logo-emp grande" style="background:${c.cor}">${c.nome[0]}</span><div><b>${SETORES[c.setor]}</b><small>${nomeLocal(e)}</small></div>${tag(STATUS_EMP[e.status])}</div>
        <p>${esc(c.desc)}</p>
        <div class="destaque"><div><small>Empregos</small><strong>${num(c.empregos)}</strong></div><div><small>Rende à prefeitura</small><strong>${D(receitaEmpresa(e))}/mês</strong></div></div>
        <button class="btn primario" id="ir-emp">Ver todas as empresas</button>`,
        depois: el => el.querySelector('#ir-emp').addEventListener('click', () => abrir('empresas')) };
    }
    if (l.predio && ESPECIAIS[l.predio]) {
      const txt = { prefeitura: 'Seu gabinete. Em breve: reuniões com secretários.', camara: 'Onde os 11 vereadores votam seus projetos.', igreja: 'Patrimônio histórico da cidade. Palco da festa do padroeiro.' }[l.predio];
      return { titulo: ESPECIAIS[l.predio].nome, html: `<p>${txt}</p><p class="nota">${b.nome}</p>${l.predio === 'camara' ? '<button class="btn primario" id="ir-camara">Abrir a Câmara</button>' : ''}`,
        depois: el => { const bt = el.querySelector('#ir-camara'); if (bt) bt.addEventListener('click', () => abrir('camara')); } };
    }
    if (l.predio) {
      const t = PREDIOS[l.predio];
      const cov = Sim.calcularCobertura()[l.bairro][t.cat];
      const manut = t.manut * (2 - (l.qualidade || 1));
      return { titulo: t.nome, html: `<p>${t.desc}</p>
        ${impactos([['Atende', t.cat === 'educacao' || t.cat === 'creche' ? num(t.cap) + ' vagas' : num(t.cap) + ' pessoas'], ['Manutenção', D(manut) + '/mês', 'neg'], ['Servidores', t.func], l.qualidade && l.qualidade !== 1 ? ['Qualidade da construção', pct(l.qualidade), l.qualidade < 1 ? 'neg' : 'pos'] : null])}
        <div class="linha-barra"><span>${CATS[t.cat].nome} em ${b.nome}</span>${barra(Math.min(1, cov) * 100, 100, corCob(cov))}<b>${pct(Math.min(1, cov))}</b></div>` };
    }
    if (l.obra) {
      const t = PREDIOS[l.obra.tipo];
      const p = Sim.progressoObra(l);
      return { titulo: 'Obra: ' + t.nome, html: `<p>${b.nome}</p>${barra(p * 100, 100, 'var(--ouro)')}
        <div class="destaque"><div><small>Andamento</small><strong>${Math.round(p * 100)}%</strong></div><div><small>Faltam</small><strong>${l.obra.mesesRest} ${l.obra.mesesRest === 1 ? 'mês' : 'meses'}</strong></div><div><small>Parcela</small><strong>${D(l.obra.parcela)}/mês</strong></div></div>
        ${impactos([['Construtora', esc(l.obra.construtora || 'Prefeitura')], ['Custo total', D(l.obra.custo), 'neg'], ['Parcela', D(l.obra.parcela) + '/mês', 'neg']])}
        ${l.obra.eventos && l.obra.eventos.length ? `<p class="alerta">${l.obra.eventos.join(' · ')}</p>` : ''}
        ${l.obra.parada ? '<p class="alerta">A obra está parada. Faça uma nova licitação para terminar.</p><button class="btn primario" id="retomar">Nova licitação para terminar</button>' : '<p class="nota">As parcelas saem do caixa no fim de cada mês.</p>'}`,
        depois: el => { const b = el.querySelector('#retomar'); if (b) b.addEventListener('click', () => licitacaoObra(l, l.obra.tipo, true)); } };
    }
    // lote vazio: opções de construção, cada uma com o impacto estimado
    const opcoes = Object.entries(PREDIOS).map(([k, t]) => {
      const est = estimarPredio(l, k);
      const cvb = Recursos.convenioPara('predio', k);
      return `<details class="opcao" data-k="${k}"><summary><span class="op-top"><b>${t.nome}${cvb ? ` <span class="pill ok">Verba ${D(cvb.valor)}</span>` : ''}</b><span class="op-resumo">${D(t.custo + (l.tipo === 'particular' ? l.desapropriacao : 0))} · ${t.meses} meses · <span class="${tomAprov(est.aprov)}">${pts(est.aprov)}</span></span></span></summary>
        <small>${t.desc}</small>
        ${impactos(impactoPredio(l, k, est))}
        <button class="btn primario" data-construir="${k}">Abrir licitação</button>
      </details>`;
    }).join('');
    return {
      titulo: `Lote ${l.id} · ${b.nome}`,
      html: `<p>${l.tipo === 'particular' ? `Terreno particular. Para construir, a prefeitura precisa desapropriar e indenizar o dono: <b>${D(l.desapropriacao)}</b> a mais.` : 'Terreno público, pronto para receber uma obra.'}</p>
        <p class="nota">Toque numa opção para ver custos, manutenção, população atendida e efeito na aprovação.</p>${opcoes}`,
      depois: el => el.querySelectorAll('[data-construir]').forEach(bt => bt.addEventListener('click', () => licitacaoObra(l, bt.dataset.construir))),
    };
  };

  // ------------------------------------------------- impactos (helper)
  // linhas = [[rótulo, valor, tom]] · tom: 'pos' | 'neg' | ''
  function impactos(linhas, titulo) {
    const ls = linhas.filter(Boolean).map(([r, v, t]) => `<div><dt>${r}</dt><dd class="${t || ''}">${v}</dd></div>`).join('');
    return `<dl class="impactos">${titulo ? `<p class="imp-tit">${titulo}</p>` : ''}${ls}</dl>`;
  }
  const sinal = v => (v >= 0 ? '+' : '−') + D(Math.abs(v)).replace('−', '');
  function pts(v) { const a = Math.abs(v); return (v >= 0 ? '+' : '−') + (a < 0.05 ? '0' : a.toFixed(1).replace('.', ',')) + (a >= 0.95 && a < 1.05 ? ' ponto' : ' pontos'); }
  const tomAprov = v => v > 0.05 ? 'pos' : v < -0.05 ? 'neg' : '';
  const tomSaldo = v => v > 1000 ? 'pos' : v < -1000 ? 'neg' : '';
  function maisAfetado(est) {
    const ent = Object.entries(est.grupos).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    if (!ent || Math.abs(ent[1]) < 0.3) return null;
    return `${GRUPOS.find(g => g.id === ent[0]).nome} ${pts(ent[1])}`;
  }
  function linhasAprov(est) {
    return [['Aprovação na cidade', pts(est.aprov), tomAprov(est.aprov)], maisAfetado(est) ? ['Grupo mais afetado', maisAfetado(est), tomAprov(Object.values(est.grupos).sort((a, b) => Math.abs(b) - Math.abs(a))[0])] : null];
  }

  // estimativa de um prédio pronto no lote
  function estimarPredio(l, tipo) {
    return Sim.estimar(() => { const a = l.predio, q = l.qualidade; l.predio = tipo; l.qualidade = 1; return () => { l.predio = a; l.qualidade = q; }; });
  }
  function impactoPredio(l, tipo, est) {
    const t = PREDIOS[tipo];
    const atende = t.cat === 'educacao' || t.cat === 'creche' ? `${num(t.cap)} vagas` : `${num(t.cap)} pessoas`;
    const c0 = Math.min(1, est.cov0[l.bairro][t.cat]), c1 = Math.min(1, est.cov1[l.bairro][t.cat]);
    return [
      ['Custo estimado da obra', D(t.custo + (l.tipo === 'particular' ? l.desapropriacao : 0)) + (l.tipo === 'particular' ? ' (com desapropriação)' : ''), 'neg'],
      ['Prazo', `${t.meses} meses`],
      ['Manutenção', `${D(t.manut)}/mês`, 'neg'],
      ['Efeito no saldo mensal (pronto)', `${sinal(est.saldo)}/mês`, tomSaldo(est.saldo)],
      ['População atendida', atende],
      [`${CATS[t.cat].nome} em ${Sim.bairroById(l.bairro).nome}`, `${pct(c0)} → ${pct(c1)}`, c1 > c0 ? 'pos' : ''],
      ['Empregos públicos', `${t.func} servidores`],
      ...linhasAprov(est),
    ];
  }

  // ------------------------------------------------- licitação de obra
  function licitacaoObra(l, tipo, retomada) {
    const t = PREDIOS[tipo];
    const lances = retomada ? Licitacoes.lancesRetomada(l) : Licitacoes.lancesObra(l.id, tipo);
    const menor = lances[0].valor;
    const cv = retomada ? null : Recursos.convenioPara('predio', tipo);
    const card = (lc, i) => {
      const P = PERFIS_OBRA[lc.perfil];
      const manut = t.manut * (2 - lc.qualidade);
      return `<div class="lance ${lc.perfil}">
        <div class="lance-top"><b>${esc(lc.construtora)}</b><span class="pill ${lc.perfil === 'barata' ? 'ruim' : lc.perfil === 'solida' ? 'ok' : 'and'}">${P.rotulo}</span></div>
        <small>${P.desc}</small>
        ${impactos([
          ['Valor do contrato', D(lc.valor), 'neg'],
          cv ? ['Pago pela verba', D(Recursos.cobertura(cv, lc.valor)), 'pos'] : null,
          cv ? ['Custo para a prefeitura', D(lc.valor - Recursos.cobertura(cv, lc.valor)), 'neg'] : null,
          ['Parcela', `${D(lc.valor / lc.meses)}/mês por ${lc.meses} ${lc.meses === 1 ? 'mês' : 'meses'}`],
          retomada ? null : ['Manutenção depois de pronto', `${D(manut)}/mês`, manut < t.manut ? 'pos' : manut > t.manut ? 'neg' : ''],
          ['Risco de aditivo (até +25%)', pct(lc.riscos.aditivo), lc.riscos.aditivo > .2 ? 'neg' : ''],
          ['Risco de atraso', pct(lc.riscos.atraso), lc.riscos.atraso > .2 ? 'neg' : ''],
          ['Risco de abandono', pct(lc.riscos.abandono), lc.riscos.abandono > .05 ? 'neg' : ''],
        ])}
        ${lc.padrinho ? `<p class="alerta">Indicada pelo vereador ${esc(lc.padrinho.nome)}: ele ganha +15 de lealdade, mas o Ministério Público pode investigar.</p>` : ''}
        <button class="btn primario" data-lance="${i}">${lc.valor === menor ? 'Contratar (menor preço)' : 'Contratar mesmo assim'}</button>
      </div>`;
    };
    modal(`<div class="licit">
      <small class="eyebrow">${retomada ? 'Nova licitação para terminar a obra' : 'Licitação · menor preço'} · Lote ${l.id} · ${Sim.bairroById(l.bairro).nome}</small>
      <h2>${t.nome}</h2>
      <p class="nota">Três construtoras entregaram propostas. Pela lei vence o menor preço; escolher outra exige justificativa e a oposição vai explorar.</p>
      ${cv ? `<p class="verba">Verba disponível: ${D(cv.valor)} (${esc(cv.nome)}). Ela paga a obra, com contrapartida da prefeitura de ${pct(cv.contra)}.</p>` : ''}
      <div class="lances">${lances.map(card).join('')}</div>
      <button class="btn" id="cancelar-lic">Cancelar a licitação</button></div>`, el => {
      el.classList.add('largo');
      el.querySelector('#cancelar-lic').addEventListener('click', fecharModal);
      el.querySelectorAll('[data-lance]').forEach(b => b.addEventListener('click', () => {
        const lc = lances[+b.dataset.lance];
        if (retomada) Licitacoes.retomar(l.id, lc);
        else Sim.construir(l.id, tipo, lc, lc.valor !== menor);
        fecharModal();
        toast(`${lc.construtora} contratada: ${D(lc.valor)} · ${lc.meses} meses · parcela de ${D(lc.valor / lc.meses)}/mês`);
        renderPainel(); atualizarHUD();
      }));
    });
  }

  // ---------------------------------------------- licitação de serviço
  function estimarContrato(id, custoMes, qualidade) {
    return Sim.estimar(() => { Sim.S.contratos.push({ id: '_tmp', servId: id, custoMes, qualidade }); return () => { Sim.S.contratos = Sim.S.contratos.filter(c => c.id !== '_tmp'); }; });
  }
  function licitacaoServico(id) {
    const sv = Licitacoes.serv(id);
    const lances = Licitacoes.lancesServico(id);
    const durs = sv.duracaoMax ? [sv.duracaoMax] : [12, 24, 48];
    let dur = durs[Math.min(1, durs.length - 1)];
    const cv = Recursos.convenioPara('servico', id);
    const render = () => {
      const cards = lances.map((lc, i) => {
        const P = PERFIS_SERVICO[lc.perfil];
        const custo = Math.round(lc.custoMes * Licitacoes.descontoDuracao(dur) / 1e3) * 1e3;
        const est = estimarContrato(id, custo, lc.qualidade);
        return `<div class="lance ${lc.perfil}">
          <div class="lance-top"><b>${esc(lc.empresa)}</b><span class="pill ${lc.perfil === 'barato' ? 'ruim' : lc.perfil === 'bom' ? 'ok' : 'and'}">${P.rotulo}</span></div>
          ${impactos([
            ['Custo do contrato', `${D(custo)}/mês`, 'neg'],
            ['Total em ' + dur + ' meses', D(custo * dur)],
            cv ? ['Pago pela verba', D(Recursos.cobertura(cv, custo * dur)), 'pos'] : null,
            sv.economia ? ['Economia na estrutura própria', `${D(sv.economia)}/mês`, 'pos'] : null,
            ['Efeito no saldo mensal', `${sinal(est.saldo)}/mês`, tomSaldo(est.saldo)],
            ['Qualidade do serviço', pct(lc.qualidade), lc.qualidade < .8 ? 'neg' : 'pos'],
            ['Chance de falha por mês', pct(lc.falha), lc.falha > .05 ? 'neg' : ''],
            ...linhasAprov(est),
          ])}
          <button class="btn primario" data-lance="${i}">Assinar contrato</button>
        </div>`;
      }).join('');
      return `<div class="licit"><small class="eyebrow">Licitação de serviço</small><h2>${sv.nome}</h2>
        <p>${sv.desc}</p><p class="pos">${sv.beneficio}</p>
        ${cv ? `<p class="verba">Verba disponível: ${D(cv.valor)} (${esc(cv.nome)}) para ajudar a pagar este contrato.</p>` : ''}
        <div class="duracao"><span>Duração do contrato</span>${durs.map(d => `<button class="op ${d === dur ? 'sel' : ''}" data-dur="${d}">${d} meses${Licitacoes.descontoDuracao(d) < 1 ? ` (−${Math.round((1 - Licitacoes.descontoDuracao(d)) * 100)}%)` : ''}</button>`).join('')}</div>
        <div class="lances">${cards}</div>
        <p class="nota">Romper o contrato antes do fim custa multa de 3 meses.</p>
        <button class="btn" id="cancelar-lic">Cancelar a licitação</button></div>`;
    };
    const ligar = el => {
      el.querySelector('#cancelar-lic').addEventListener('click', fecharModal);
      el.querySelectorAll('[data-dur]').forEach(b => b.addEventListener('click', () => { dur = +b.dataset.dur; el.innerHTML = render(); ligar(el); }));
      el.querySelectorAll('[data-lance]').forEach(b => b.addEventListener('click', () => {
        const c = Licitacoes.contratar(id, lances[+b.dataset.lance], dur); Som.sfx("moeda");
        fecharModal(); toast(`Contrato assinado: ${D(c.custoMes)}/mês por ${dur} meses`); renderPainel(); atualizarHUD();
      }));
    };
    modal(render(), el => { el.classList.add('largo'); ligar(el); });
  }

  RENDER.licitacoes = () => {
    const S = Sim.S; Licitacoes.garantir();
    const ativos = Licitacoes.ativos().map(c => {
      const sv = Licitacoes.serv(c.servId);
      return `<div class="emp-card"><div class="emp-top"><div><b>${sv.nome}</b><small>${esc(c.empresa)} · até ${Sim.fmtMesIndex(c.fim)}</small></div><span class="pill ${c.qualidade >= .95 ? 'ok' : c.qualidade < .8 ? 'ruim' : 'and'}">Qualidade ${pct(c.qualidade)}</span></div>
        ${impactos([['Custo', `${D(c.custoMes)}/mês`, 'neg'], sv.economia ? ['Economia', `${D(sv.economia)}/mês`, 'pos'] : null, ['Benefício', sv.beneficio, 'pos'], c.falhas ? ['Falhas registradas', c.falhas, 'neg'] : null])}
        <button class="btn" data-rescindir="${c.id}">Romper contrato (multa ${D(Licitacoes.multaRescisao(c))})</button></div>`;
    }).join('');
    const obras = S.lotes.filter(l => l.obra).map(l => {
      const o = l.obra, t = PREDIOS[o.tipo];
      return `<div class="emp-card"><div class="emp-top"><div><b>${t.nome}</b><small>${esc(o.construtora || 'Prefeitura')} · Lote ${l.id}</small></div>${o.parada ? '<span class="pill ruim">Parada</span>' : `<span class="pill and">${o.mesesRest} ${o.mesesRest === 1 ? 'mês' : 'meses'}</span>`}</div>
        ${o.eventos && o.eventos.length ? `<small class="alerta">${o.eventos.join(' · ')}</small>` : ''}
        ${o.parada ? `<button class="btn primario" data-retomar="${l.id}">Nova licitação para terminar</button>` : ''}</div>`;
    }).join('');
    const disponiveis = SERVICOS.filter(sv => !Licitacoes.contratoAtivo(sv.id)).map(sv => {
      const est = estimarContrato(sv.id, sv.custo, PERFIS_SERVICO.medio.qualidade);
      return `<div class="emp-card"><div class="emp-top"><div><b>${sv.nome}</b><small>${sv.desc}</small></div></div>
        ${impactos([['Custo de referência', `${D(sv.custo)}/mês`, 'neg'], sv.economia ? ['Economia', `${D(sv.economia)}/mês`, 'pos'] : null, ['Efeito no saldo', `${sinal(est.saldo)}/mês`, tomSaldo(est.saldo)], ['Benefício', sv.beneficio, 'pos'], ...linhasAprov(est)])}
        <button class="btn primario" data-licitar="${sv.id}">Abrir licitação</button></div>`;
    }).join('');
    return {
      titulo: 'Licitações e contratos',
      html: `<p class="nota">Toda obra pública passa por licitação: clique num lote vazio para abrir uma. Aqui você também contrata empresas para prestar serviços por um valor fixo mensal.</p>
        ${obras ? `<h3>Obras em andamento</h3>${obras}` : ''}
        <h3>Contratos de serviço ativos</h3>${ativos || '<p class="vazio">Nenhum contrato ativo.</p>'}
        <h3>Contratar serviço</h3>${disponiveis}`,
      depois: el => {
        el.querySelectorAll('[data-licitar]').forEach(b => b.addEventListener('click', () => licitacaoServico(b.dataset.licitar)));
        el.querySelectorAll('[data-retomar]').forEach(b => b.addEventListener('click', () => { const l = Sim.S.lotes.find(x => x.id === b.dataset.retomar); licitacaoObra(l, l.obra.tipo, true); }));
        el.querySelectorAll('[data-rescindir]').forEach(b => b.addEventListener('click', () => {
          if (b.dataset.confirma) { Licitacoes.rescindir(b.dataset.rescindir); renderPainel(); atualizarHUD(); }
          else { b.dataset.confirma = '1'; b.textContent = 'Confirmar rompimento'; b.classList.add('perigo'); }
        }));
      },
    };
  };

  // ----------------------------------------------------------- recursos
  const ESFERA = { federal: 'Federal', estadual: 'Estadual', emenda: 'Emenda parlamentar' };
  function custoReferencia(tipo, alvo) { return tipo === 'predio' ? PREDIOS[alvo].custo : Licitacoes.serv(alvo).custo * 12; }
  function linhasOferta(of) {
    if (of.tipo === 'livre') return [['Valor', D(of.valor), 'pos'], ['Para', 'Livre uso: entra direto no caixa'], ['Contrapartida da prefeitura', 'nenhuma'], ['Prazo', 'Aceitou, recebeu']];
    if (of.tipo === 'evento') return [['Valor', D(of.valor), 'pos'], ['Para', 'Shows, festas e feiras (painel Eventos)'], ['Contrapartida da prefeitura', pct(of.contra) + ' do custo do evento'], ['Prazo para usar', `${of.prazo} meses`], ['Se não usar no prazo', 'a verba é perdida', 'neg']];
    const ref = custoReferencia(of.tipo, of.alvo);
    const cob = Math.min(of.valor, ref * (1 - of.contra));
    return [
      ['Valor', D(of.valor), 'pos'],
      ['Para', Recursos.nomeAlvo(of.tipo, of.alvo)],
      ['Contrapartida da prefeitura', of.contra ? pct(of.contra) + ' do custo' : 'nenhuma'],
      [of.tipo === 'predio' ? 'Paga de uma obra de ' + D(ref) : 'Paga de 12 meses de contrato (' + D(ref) + ')', `${D(cob)} (${pct(cob / ref)})`, 'pos'],
      ['Prazo para usar', `${of.prazo} meses`],
      ['Se não usar no prazo', 'a verba é perdida e a oposição explora', 'neg'],
    ];
  }
  function mostrarOferta(of) {
    const como = of.tipo === 'livre' ? 'O dinheiro entra direto no caixa e pode ser usado no que você quiser.' : of.tipo === 'evento' ? 'Para usar, agende um show ou festa no painel Eventos: a verba paga parte do custo.' : of.tipo === 'predio' ? `Para usar, abra a licitação de ${PREDIOS[of.alvo].nome} em qualquer lote vazio.` : `Para usar, abra a licitação de ${Licitacoes.serv(of.alvo).nome} no painel de Licitações.`;
    modal(`<div class="oferta"><small class="eyebrow">${ESFERA[of.esfera]} · recurso aprovado</small>
      <h2 class="pos">${D(of.valor)} ${esc(of.origem)}</h2>
      <p>${esc(of.nome)}</p>
      ${impactos(linhasOferta(of))}
      <p class="nota">${como}</p>
      <div class="acoes"><button class="btn primario" id="aceitar-of">Aceitar a verba</button><button class="btn" id="depois-of">Decidir depois</button><button class="btn" id="recusar-of">Recusar</button></div>
    </div>`, el => {
      el.querySelector('#aceitar-of').addEventListener('click', () => { const ok = Recursos.aceitar(of.id); fecharModal(); toast(ok ? `Verba aceita: ${D(of.valor)}. ${como}` : 'Não foi possível aceitar: a prefeitura está bloqueada.', ok ? 'ouro' : ''); renderPainel(); atualizarHUD(); });
      el.querySelector('#depois-of').addEventListener('click', () => { fecharModal(); toast(`A oferta fica no painel Recursos até ${Sim.fmtMesIndex(of.expira)}.`); });
      el.querySelector('#recusar-of').addEventListener('click', () => { Recursos.recusar(of.id); fecharModal(); renderPainel(); atualizarHUD(); });
    });
  }
  RENDER.recursos = () => {
    const S = Sim.S; Recursos.garantir();
    const bloq = Recursos.bloqueio();
    const gov = esf => { const g = S.governos[esf], a = Recursos.alinhamento(esf); return `<div><small>${esf === 'federal' ? 'Governo Federal' : 'Governo do Estado'}</small><strong>${esc(g.chefe)}</strong><span class="${a.tom}">${g.partido} · ${a.txt}</span></div>`; };
    const ofertas = S.ofertasRecursos.map(of => `<div class="emp-card"><div class="emp-top"><div><b>${D(of.valor)} ${esc(of.origem)}</b><small>${esc(of.nome)} · responder até ${Sim.fmtMesIndex(of.expira)}</small></div></div>
      ${impactos(linhasOferta(of))}<div class="acoes"><button class="btn primario" data-aceitar="${of.id}">Aceitar</button><button class="btn" data-recusar="${of.id}">Recusar</button></div></div>`).join('');
    const ativos = S.convenios.filter(c => c.status === 'aceito').map(c => `<div class="emp-card"><div class="emp-top"><div><b>${D(c.valor)} para ${Recursos.nomeAlvo(c.tipo, c.alvo).toLowerCase()}</b><small>${esc(c.nome)}</small></div><span class="pill ${c.prazoMes - S.mesIndex <= 3 ? 'ruim' : 'and'}">Usar até ${Sim.fmtMesIndex(c.prazoMes)}</span></div>
      <small class="nota">${c.tipo === 'predio' ? 'Abra a licitação desse prédio em um lote vazio.' : 'Abra a licitação desse serviço no painel Licitações.'}</small></div>`).join('');
    const usados = S.convenios.filter(c => c.status === 'usado').length, perdidos = S.convenios.filter(c => c.status === 'perdido').length;
    const pedidos = S.pedidosRecursos.map(pd => { const p = Recursos.prog(pd.progId); return `<li>${esc(p.nome)} <small>resposta até ${Sim.fmtMesIndex(pd.resposta)}</small></li>`; }).join('');
    const cartaoProg = p => {
      const pode = Recursos.podePedir(p);
      const c = Recursos.chance(p);
      return `<div class="emp-card"><div class="emp-top"><div><b>${esc(p.nome)}</b><small>${ESFERA[p.esfera]} · para ${Recursos.nomeAlvo(p.tipo, p.alvo).toLowerCase()}</small></div><span class="pill ${c >= .55 ? 'ok' : c >= .35 ? 'and' : 'ruim'}">Chance ${pct(c)}</span></div>
        ${impactos([['Custo do projeto técnico', D(p.projeto), 'neg'], ['Verba possível', `${D(p.valor[0] * 0.75)} a ${D(p.valor[1])}`, 'pos'], ['Contrapartida', pct(p.contra)], p.tipo === 'livre' ? ['Uso', 'livre: entra no caixa ao aceitar'] : ['Prazo de uso se aprovado', `${p.prazo} meses`], ['Resposta', 'em 1 a 2 meses']])}
        ${pode.ok ? `<button class="btn primario" data-pedir="${p.id}">Pedir recurso</button>` : `<small class="alerta">${pode.motivo}</small>`}</div>`;
    };
    const progsLivres = Recursos.PROGRAMAS.filter(p => p.tipo === 'livre' || p.tipo === 'evento').map(cartaoProg).join('');
    const progs = Recursos.PROGRAMAS.filter(p => p.tipo !== 'livre' && p.tipo !== 'evento').map(cartaoProg).join('');
    return {
      titulo: 'Recursos federais e estaduais',
      html: `<div class="destaque gov">${gov('federal')}${gov('estadual')}</div>
        ${bloq ? `<p class="alerta">${bloq}</p>` : '<p class="pos">Cadastro regular: a cidade pode receber verbas.</p>'}
        <p class="nota">Governos aliados aprovam mais. Prefeito bem avaliado também. Deputados mandam emendas de vez em quando.</p>
        ${ofertas ? `<h3>Ofertas para responder</h3>${ofertas}` : ''}
        <h3>Verbas garantidas</h3>${ativos || '<p class="vazio">Nenhuma verba esperando uso.</p>'}
        ${usados || perdidos ? `<p class="nota">${usados} já ${usados === 1 ? 'usada' : 'usadas'} · ${perdidos} ${perdidos === 1 ? 'perdida' : 'perdidas'} por prazo</p>` : ''}
        ${pedidos ? `<h3>Pedidos em análise</h3><ul class="futuras">${pedidos}</ul>` : ''}
        <h3>Verbas sem obra definida</h3><p class="nota">Dinheiro de livre uso (vai para o caixa) e apoio a shows e festas.</p>${progsLivres}
        <h3>Programas para obras e serviços</h3>${progs}`,
      depois: el => {
        el.querySelectorAll('[data-pedir]').forEach(b => b.addEventListener('click', () => { if (Recursos.pedir(b.dataset.pedir)) { toast('Projeto enviado. A resposta sai em 1 a 2 meses.'); renderPainel(); atualizarHUD(); } }));
        el.querySelectorAll('[data-aceitar]').forEach(b => b.addEventListener('click', () => { Recursos.aceitar(b.dataset.aceitar); renderPainel(); atualizarHUD(); }));
        el.querySelectorAll('[data-recusar]').forEach(b => b.addEventListener('click', () => { Recursos.recusar(b.dataset.recusar); renderPainel(); atualizarHUD(); }));
      },
    };
  };

  // ----------------------------------------------------------- avisos
  function irPara(alvo) {
    if (!alvo || !window.Cena) return;
    const S = Sim.S, cam = Cena.cameras.main;
    if (alvo.ocorrencia) { const o = S.ocorrencias.find(x => x.id === alvo.ocorrencia); if (o && o.x > -900) { cam.pan(o.x + 32, o.y + 24, 600, 'Sine.easeInOut'); abrir('ocorrencia', o.id); return; } }
    if (alvo.lote) { const l = S.lotes.find(x => x.id === alvo.lote); if (l) cam.pan((l.x + (l.w || 3) / 2) * TILE, (l.y + (l.h || 3) / 2) * TILE, 600, 'Sine.easeInOut'); if (l && l.central) abrir('praca'); }
  }
  RENDER.avisos = () => {
    const S = Sim.S; Vida.garantir();
    const lista = S.avisos.slice(0, 40).map((a, i) => `<div class="aviso ${a.tipo || ''} ${a.lido ? '' : 'novo'}">
        <span class="aviso-data">${a.data}</span><p>${esc(a.txt)}</p>
        ${a.alvo && (a.alvo.lote || (a.alvo.ocorrencia && S.ocorrencias.some(o => o.id === a.alvo.ocorrencia))) ? `<button class="btn btn-p" data-ir="${i}">Ver no mapa</button>` : ''}</div>`).join('');
    const abertas = S.ocorrencias.filter(o => o.status === 'aberta');
    const ocs = abertas.map(o => { const t = TIPOS_OCORRENCIA[o.tipo]; const resta = o.criada + t.prazo - Vida.hoje();
      return `<button class="ocorr" data-oc="${o.id}"><b>${t.nome}</b><small>${Sim.bairroById(o.bairro).nome} · resolver por ${D(t.custo)} · ${resta <= 1 ? 'último dia' : 'faltam ' + resta + ' dias'}</small></button>`; }).join('');
    setTimeout(() => Vida.marcarLidos(), 1200);
    return {
      titulo: 'Avisos',
      html: `${ocs ? `<h3>Problemas esperando a prefeitura</h3><div class="ocorrs">${ocs}</div>` : '<p class="pos">Nenhum problema na rua agora.</p>'}
        <h3>Últimos avisos</h3>${lista || '<p class="vazio">Nenhum aviso ainda.</p>'}`,
      depois: el => {
        el.querySelectorAll('[data-ir]').forEach(b => b.addEventListener('click', () => irPara(S.avisos[+b.dataset.ir].alvo)));
        el.querySelectorAll('[data-oc]').forEach(b => b.addEventListener('click', () => irPara({ ocorrencia: b.dataset.oc })));
      },
    };
  };

  // ------------------------------------------------------ ocorrência
  RENDER.ocorrencia = id => {
    const S = Sim.S, o = S.ocorrencias.find(x => x.id === id);
    if (!o) return { titulo: 'Ocorrência', html: '<p class="pos">Resolvido! A rua já está normal.</p>' };
    const t = TIPOS_OCORRENCIA[o.tipo], resta = o.criada + t.prazo - Vida.hoje();
    const status = o.status === 'reparo'
      ? `<p class="pos">${o.auto === 'bombeiros' ? 'Os bombeiros da cidade estão no local.' : o.auto === 'contrato' ? 'A empresa contratada já está resolvendo.' : 'A equipe da prefeitura está trabalhando.'} Termina em ${Math.max(1, o.fim - Vida.hoje())} ${o.fim - Vida.hoje() > 1 ? 'dias' : 'dia'}.</p>`
      : `${impactos([['Custo', D(t.custo), 'neg'], ['Tempo de reparo', `${t.dias} ${t.dias > 1 ? 'dias' : 'dia'}`], ['Moradores do bairro', 'aprovação sobe um pouco', 'pos'],
          ['Se ninguém resolver', `${pts(t.efeito)} no humor do bairro (${Sim.bairroById(o.bairro).nome}) em ${Math.max(0, resta)} ${resta === 1 ? 'dia' : 'dias'}`, 'neg']])}
        <button class="btn primario" id="resolver-oc">${t.acao} (${D(t.custo)})</button>
        ${t.servico ? `<p class="nota">Dica: com o contrato de ${Licitacoes.serv(t.servico).nome.toLowerCase()} (Licitações), isso se resolve sozinho.</p>` : ''}
        ${t.predio ? '<p class="nota">Dica: com um Posto de Bombeiros na cidade, incêndios são apagados sozinhos.</p>' : ''}`;
    return {
      titulo: t.nome,
      html: `<p><b>${Sim.bairroById(o.bairro).nome}</b></p><p>${t.desc}</p>${status}<button class="btn" id="ver-oc">Ver no mapa</button>`,
      depois: el => {
        const b = el.querySelector('#resolver-oc');
        if (b) b.addEventListener('click', () => { if (Vida.resolver(o.id)) { Som.sfx('obra'); renderPainel(); atualizarHUD(); } });
        el.querySelector('#ver-oc').addEventListener('click', () => { if (window.Cena && o.x > -900) Cena.cameras.main.pan(o.x + 32, o.y + 24, 600, 'Sine.easeInOut'); });
      },
    };
  };

  // ---------------------------------------------------- Praça Central
  RENDER.praca = () => {
    const S = Sim.S; Vida.garantir();
    const p = Vida.protestoAtivo(), hoje = Vida.eventoHoje();
    const agend = S.eventos.filter(e => e.status === 'agendado' && e.loteId === 'P4').map(e => `<li><b>${TIPOS_EVENTO[e.tipo].nome}</b> <small>${e.quando}</small></li>`).join('');
    const temGuarda = S.lotes.some(l => l.predio === 'guarda');
    const chanceDiscurso = Math.round(Sim.clamp(Sim.aprovCidade() / 80, 0.25, 0.8) * 100);
    let prot = '';
    if (p) {
      const g = GRUPOS.find(x => x.id === p.grupo).nome.toLowerCase();
      prot = `<div class="protesto">
        <small class="eyebrow">Protesto acontecendo</small>
        <h3 class="faixa-prot">${esc(p.faixa)}</h3>
        <p>${p.pessoas.toLocaleString('pt-BR')} pessoas, a maioria ${g}, cobram <b>${esc(p.nomeTema)}</b>. Gritam: "${esc(p.slogans[0])}"</p>
        ${p.resposta ? `<p class="${p.resposta === 'vaia' ? 'neg' : 'pos'}">${{ comissao: 'Você recebeu uma comissão. Os manifestantes vão embora amanhã.', aplauso: 'Você discursou e foi aplaudido.', vaia: 'Você discursou e foi vaiado.' }[p.resposta] || ''}</p>` : `
        <div class="resp-prot">
          <button class="carta" data-resp="comissao"><b>Receber uma comissão</b><small>Conversa com os líderes no gabinete. Seguro: o grupo fica um pouco mais satisfeito.</small></button>
          <button class="carta" data-resp="discurso"><b>Descer e discursar na praça</b><small>Arriscado: ${chanceDiscurso}% de chance de aplauso (depende da sua aprovação). Se vaiarem, a oposição cresce.</small></button>
          ${temGuarda ? `<button class="carta perigo-c" data-resp="guarda"><b>Mandar a Guarda dispersar</b><small>Acaba na hora, mas o grupo, os jovens e a imprensa não perdoam.</small></button>` : ''}
        </div>
        <p class="nota">Se ninguém da prefeitura aparecer, o protesto termina em 2 dias e o grupo fica mais irritado.</p>`}
      </div>`;
    }
    return {
      titulo: 'Praça Central',
      html: `${prot}
        ${hoje && hoje.loteId === 'P4' ? `<div class="destaque"><div><small>Hoje na praça</small><strong>${TIPOS_EVENTO[hoje.tipo].nome}</strong><span>${(hoje.publico || 0).toLocaleString('pt-BR')} pessoas</span></div></div>` : ''}
        <p class="nota">O coração da cidade: chafariz, coreto, bancos e pipoqueiro. Aqui acontecem os shows, a quermesse, a feira de domingo e também os protestos.</p>
        ${agend ? `<h3>Programação</h3><ul class="futuras">${agend}</ul>` : '<p class="vazio">Nenhum evento marcado.</p>'}
        <button class="btn primario" id="ir-eventos">Organizar um evento na praça</button>`,
      depois: el => {
        el.querySelectorAll('[data-resp]').forEach(b => b.addEventListener('click', () => { Vida.responderProtesto(b.dataset.resp); Som.sfx(b.dataset.resp === 'guarda' ? 'rejeitado' : 'clique'); renderPainel(); atualizarHUD(); }));
        el.querySelector('#ir-eventos').addEventListener('click', () => abrir('eventos'));
      },
    };
  };

  // ---------------------------------------------------------- eventos
  RENDER.eventos = () => {
    const S = Sim.S; Vida.garantir();
    const hoje = Vida.eventoHoje();
    const agend = S.eventos.filter(e => e.status === 'agendado').map(e => `<li><b>${TIPOS_EVENTO[e.tipo].nome}</b> <small>${e.quando} · ${esc(e.local)}</small></li>`).join('');
    const feitos = S.eventos.filter(e => e.status === 'feito').slice(-4).reverse().map(e => `<li>${TIPOS_EVENTO[e.tipo].nome} <small>${e.quando} · ${(e.publico || 0).toLocaleString('pt-BR')} pessoas${e.chuva ? ' · choveu' : ''}</small></li>`).join('');
    const gruposTxt = ef => Object.entries(ef).map(([k, v]) => `${GRUPOS.find(g => g.id === k).nome.toLowerCase()} ${v > 0 ? '+' : ''}${String(v).replace('.', ',')}`).join(', ');
    const cards = Object.entries(TIPOS_EVENTO).map(([id, t]) => {
      const pode = Vida.podeAgendar(id), pv = Vida.previsao(id), locs = Vida.locais(id);
      const pat = pv.patrocinio;
      return `<div class="emp-card evento-card">
        <div class="emp-top"><div><b>${t.nome}</b><small>${t.desc}</small></div></div>
        ${impactos([['Custo total', D(t.custo)], pat.valor ? ['Patrocínio das empresas', `−${D(pat.valor)} (${esc(pat.nomes.join(', '))}${pat.mais ? ` e mais ${pat.mais}` : ''})`, 'pos'] : ['Patrocínio', 'nenhuma empresa na cidade ainda'],
          pv.verba ? ['Verba de evento (Recursos)', `−${D(pv.verba)}`, 'pos'] : null, ['Custo para a prefeitura', D(pv.liquido), 'neg'],
          ['Público esperado', `~${pv.publico.toLocaleString('pt-BR')} pessoas`], ['Preparação', `${t.prep} dias`], ['Humor dos grupos', gruposTxt(pv.efeitos), 'pos'],
          t.risco ? ['Risco', 'briga se a segurança da cidade for fraca', 'neg'] : null])}
        ${pode.ok ? `<div class="evento-acao">${locs.length > 1 ? `<select data-loc="${id}">${locs.map(l => `<option value="${l.loteId}">${esc(l.nome)}</option>`).join('')}</select>` : `<small class="nota">${esc(locs[0].nome)}</small>`}
          <button class="btn primario" data-agendar="${id}">Agendar para ${Vida.dataDe(Vida.hoje() + t.prep)}</button></div>` : `<small class="alerta">${pode.motivo}</small>`}
      </div>`;
    }).join('');
    const cans = S.eventos.filter(e => e.status === 'feito' && Vida.hoje() - e.dia < 30).length;
    return {
      titulo: 'Eventos e shows',
      html: `${Vida.protestoAtivo() ? `<p class="alerta">Tem protesto na Praça Central agora. <button class="btn btn-p" id="ver-prot">Ver</button></p>` : ''}${hoje ? `<div class="destaque"><div><small>Hoje</small><strong>${TIPOS_EVENTO[hoje.tipo].nome}</strong><span>${esc(hoje.local)} · ${(hoje.publico || 0).toLocaleString('pt-BR')} pessoas</span></div></div>` : ''}
        <p class="nota">Tudo acontece na Praça Central (os eventos pequenos também podem ir para as praças de bairro). Não precisa de Centro Cultural; com ele, os shows grandes atraem mais gente. As empresas da cidade patrocinam parte do custo.</p>
        ${cans ? `<p class="alerta">${cans} ${cans === 1 ? 'evento' : 'eventos'} nos últimos 30 dias: o público anima menos com festa toda semana.</p>` : ''}
        ${agend ? `<h3>Agendados</h3><ul class="futuras">${agend}</ul>` : ''}
        <h3>Organizar</h3>${cards}
        ${feitos ? `<h3>Últimos eventos</h3><ul class="futuras">${feitos}</ul>` : ''}`,
      depois: el => {
        const vp = el.querySelector('#ver-prot'); if (vp) vp.addEventListener('click', () => irPara({ lote: 'P4' }));
        el.querySelectorAll('[data-agendar]').forEach(b => b.addEventListener('click', () => {
          const sel = el.querySelector(`[data-loc="${b.dataset.agendar}"]`);
          if (Vida.agendar(b.dataset.agendar, sel ? sel.value : null)) { Som.sfx('moeda'); renderPainel(); atualizarHUD(); }
        }));
      },
    };
  };

  // ----------------------------------------------------------- empresas
  const STATUS_EMP = { camara: ['and', 'Na Câmara'], instalacao: ['and', 'Em obra'], operando: ['ok', 'Funcionando'], fechou: ['ruim', 'Fechou'], cancelada: ['ruim', 'Cancelada'] };
  const STATUS_CP = { pendente: ['and', 'Pendente'], cumprida: ['ok', 'Cumprida'], atrasada: ['ruim', 'Atrasada'] };
  const tag = ([c, t]) => `<span class="pill ${c}">${t}</span>`;
  function receitaEmpresa(e) {
    const c = Empresas.cat(e.catId), S = Sim.S;
    if (e.status !== 'operando') return 0;
    const iss = c.iss * Empresas.aliquotaISS(e) / 100;
    let iptu = 0;
    if (e.bairro !== 'rural') iptu = c.venal * Empresas.taxaIPTU(c, e.bairro) / 100 / 12 * Empresas.fatorIPTU(e);
    return iss + c.icms + iptu;
  }
  function nomeLocal(e) { return e.bairro === 'rural' ? 'Zona rural' : e.pequeno || !e.loteId ? `Ponto comercial · ${Sim.bairroById(e.bairro).nome}` : `Lote ${e.loteId} · ${Sim.bairroById(e.bairro).nome}`; }
  // termômetro: o que a população acha da vinda da empresa
  function termometro(p, completo) {
    const o = Empresas.opiniao(p);
    const cor = ['var(--vermelho)', '#e07a2e', 'var(--ouro)', '#7cbf4a', 'var(--verde)'][o.nivel];
    const grupos = completo ? `<div class="opi-grupos">${GRUPOS.map(g => `<span title="${g.nome}: ${o.grupos[g.id]}% a favor"><small>${g.nome}</small><i><b style="height:${o.grupos[g.id]}%;background:${o.grupos[g.id] >= 55 ? 'var(--verde)' : o.grupos[g.id] >= 45 ? 'var(--ouro)' : 'var(--vermelho)'}"></b></i><em>${o.grupos[g.id]}</em></span>`).join('')}</div>` : '';
    const mot = o.motivos.map(m => `<li class="${m.positivo ? 'pos' : 'neg'}">${m.positivo ? '▲' : '▼'} ${esc(m.txt)}</li>`).join('');
    return `<div class="opiniao ${completo ? 'completo' : ''}">
      <div class="opi-top"><span>O que a população acha</span><b style="color:${cor}">${o.txt} · ${o.total}% a favor</b></div>
      <div class="opi-escala"><i style="left:${o.total}%"></i></div>
      ${grupos}${completo ? `<ul class="opi-motivos">${mot}</ul><p class="nota">Fechar o acordo mexe com o humor de cada grupo conforme o termômetro. Recusar uma empresa querida também custa.</p>` : ''}
    </div>`;
  }

  RENDER.empresas = () => {
    const S = Sim.S; Empresas.garantirEstado();
    const props = S.propostas.map(p => {
      const c = Empresas.cat(p.catId);
      return `<div class="emp-card">
        <div class="emp-top"><span class="logo-emp" style="background:${c.cor}">${c.nome[0]}</span><div><b>${esc(c.nome)}</b><small>${SETORES[c.setor]} · ${num(c.empregos)} empregos · ${D(c.invest)}</small></div></div>
        <small>${esc(c.desc)}</small>
        ${p.rival ? `<small class="alerta">${p.rival.nome} também quer esta empresa</small>` : ''}
        ${c.local === 'pequeno' ? `<small class="nota">Ponto comercial no bairro ${Sim.bairroById(p.bairro).nome}</small>` : ''}
        ${termometro(p, false)}
        <div class="emp-acoes"><small class="nota">Responder até ${Sim.fmtMesIndex(p.expira)}</small><button class="btn primario" data-negociar="${p.id}">Negociar</button></div>
      </div>`;
    }).join('');
    const lista = S.empresas.filter(e => e.status !== 'cancelada').slice().reverse().map(e => {
      const c = Empresas.cat(e.catId);
      const prog = e.status === 'instalacao' ? Math.round((1 - e.mesesRest / e.mesesTotal) * 100) : null;
      const inc = [];
      const ii = e.incentivos;
      if (ii.iptuAnos) inc.push(`${ii.iptuPct == null || ii.iptuPct >= 1 ? 'IPTU isento' : Math.round(ii.iptuPct * 100) + '% off no IPTU'} por ${ii.iptuAnos} anos`);
      if (ii.issAnos) inc.push(`ISS ${String(ii.issTaxa || 2).replace('.', ',')}% por ${ii.issAnos} anos`);
      if (ii.doacao) inc.push('terreno doado'); else if (ii.terrenoDesc) inc.push(`terreno com ${Math.round(ii.terrenoDesc * 100)}% de desconto`);
      if (ii.itbiPct) inc.push(ii.itbiPct >= 1 ? 'ITBI isento' : `ITBI com ${Math.round(ii.itbiPct * 100)}% off`);
      if (e.incentivos.infra) inc.push(`obras ${D(e.incentivos.infra)}`);
      return `<div class="emp-card">
        <div class="emp-top"><span class="logo-emp" style="background:${c.cor}">${c.nome[0]}</span><div><b>${esc(c.nome)}</b><small>${nomeLocal(e)} · ${num(c.empregos)} empregos</small></div>${tag(STATUS_EMP[e.status])}</div>
        ${prog != null ? `<div class="linha-barra"><span>Obra</span>${barra(prog, 100, 'var(--ouro)')}<b>${prog}%</b></div>` : ''}
        ${e.status === 'operando' ? `<small>Rende à prefeitura <b class="pos">${D(receitaEmpresa(e))}/mês</b> · satisfação da empresa ${Math.round(e.satisfacao)}%</small>` : ''}
        ${inc.length ? `<small class="nota">Incentivos: ${inc.join(' · ')}</small>` : ''}
        ${e.contrapartidas.length ? `<ul class="cps">${e.contrapartidas.map(cp => `<li>${CONTRAPARTIDAS[cp.id].nome} ${tag(STATUS_CP[cp.status])}${cp.status === 'pendente' && cp.prazo != null ? ` <small>prazo ${Sim.fmtMesIndex(cp.prazo)}</small>` : ''}</li>`).join('')}</ul>` : ''}
      </div>`;
    }).join('');
    const fut = Empresas.futuras().slice(0, 6).map(c => `<li><b>${esc(c.nome)}</b> <small>${SETORES[c.setor]} · ${num(c.empregos)} empregos · a partir de ${num(c.minPop)} habitantes</small></li>`).join('');
    return {
      titulo: 'Empresas e investimentos',
      html: `<div class="destaque"><div><small>Propostas abertas</small><strong>${S.propostas.length}</strong></div><div><small>Empresas na cidade</small><strong>${S.empresas.filter(e => e.status === 'operando').length}</strong></div><div><small>Empregos gerados</small><strong>${num(S.empresas.filter(e => e.status === 'operando').reduce((s, e) => s + e.empregos, 0))}</strong></div></div>
        <p class="nota">Comércio local que abriu sozinho: <b>${(S.negocios || []).length}</b> ${(S.negocios || []).length === 1 ? 'negócio' : 'negócios'} (cerca de ${num((S.negocios || []).length * 6)} empregos). Ele cresce quando a aprovação, os serviços e o ISS ajudam.</p>
        <div class="prospec">${impactos([['Custo', D(Empresas.CUSTO_PROSPECCAO), 'neg'], ['Resultado', 'uma proposta em cerca de 10 dias'], ['Pode repetir', 'a cada 3 meses']], 'Prospectar investidores numa feira na capital')}
          <button class="btn ouro" id="prospectar" ${Empresas.podeProspectar() ? '' : 'disabled'}>${Empresas.podeProspectar() ? 'Prospectar empresas' : (Sim.S.prospeccaoDia ? 'Missão em andamento' : 'Disponível em breve')}</button></div>
        <h3>Propostas na mesa</h3>${props || '<p class="vazio">Nenhuma empresa batendo à porta agora. Novas propostas chegam a cada poucos meses.</p>'}
        <h3>Acordos fechados</h3>${lista || '<p class="vazio">Nenhum acordo ainda.</p>'}
        ${fut ? `<h3>Quando a cidade crescer</h3><ul class="futuras">${fut}</ul>` : ''}`,
      depois: el => {
        el.querySelectorAll('[data-negociar]').forEach(b => b.addEventListener('click', () => {
          const p = Sim.S.propostas.find(x => x.id === b.dataset.negociar); if (p) mesaNegociacao(p);
        }));
        const pr = el.querySelector('#prospectar');
        if (pr) pr.addEventListener('click', () => { if (Empresas.prospectar()) { toast('Equipe enviada à feira de investimentos. Aguarde uma proposta.'); renderPainel(); atualizarHUD(); } });
      },
    };
  };

  // um item negociável da mesa: botões por parte (desconto, prazo, alíquota, valor)
  function blocoPedido(p, ped, i, l) {
    const d = PEDIDOS_EMPRESA[ped.tipo], S = Sim.S, v = ped.dado || {};
    const op = (campo, val, txt, sel) => `<button class="op ${sel ? 'sel' : ''}" data-ped="${i}" data-campo="${campo}" data-v="${val}">${txt}</button>`;
    const pct = x => Math.round(x * 100) + '%';
    const prazo = ativo => `<div class="linha-op"><span>Prazo</span><div class="ops"><button class="op mini-op" data-ped="${i}" data-delta="-1" ${ativo && v.anos > 1 ? '' : 'disabled'}>−</button><b class="anos">${ativo ? v.anos + (v.anos === 1 ? ' ano' : ' anos') : '—'}</b><button class="op mini-op" data-ped="${i}" data-delta="1" ${ativo ? '' : 'disabled'}>+</button></div></div>`;
    let corpo = '';
    switch (ped.tipo) {
      case 'isencaoIPTU':
        corpo = `<div class="linha-op"><span>Desconto</span><div class="ops">${OPCOES_NEG.pct.map(x => op('pct', x, x ? (x >= 1 ? 'Isento' : pct(x)) : 'Nenhum', Math.abs((v.pct || 0) - x) < 1e-6)).join('')}</div></div>${prazo(v.pct > 0)}`;
        break;
      case 'reducaoISS': {
        const taxas = OPCOES_NEG.taxasISS.filter(t => t < S.impostos.iss).sort((a, b) => b - a);
        corpo = `<div class="linha-op"><span>Alíquota</span><div class="ops">${op('taxa', 'null', `Normal (${String(S.impostos.iss).replace('.', ',')}%)`, !v.taxa || !v.anos || v.taxa >= S.impostos.iss)}${taxas.map(t => op('taxa', t, String(t).replace('.', ',') + '%', v.taxa === t && v.anos > 0)).join('')}</div></div>${prazo(v.taxa && v.anos > 0)}`;
        break;
      }
      case 'doacaoTerreno': {
        if (!Empresas.pedidoAplica(p, ped)) return `<div class="ped"><b>${d.nome}</b><small>${l ? 'Terreno particular: a empresa compra direto do dono.' : 'Não usa terreno público.'}</small></div>`;
        const valor = VALOR_LOTE[l.bairro] || 1e6;
        corpo = `<div class="linha-op"><span>Preço</span><div class="ops">${OPCOES_NEG.terreno.map(x => op('pct', x, x >= 1 ? 'Doar' : x ? `${pct(x)} off (${D(valor * (1 - x))})` : `Cheio (${D(valor)})`, Math.abs((v.pct || 0) - x) < 1e-6)).join('')}</div></div>`;
        break;
      }
      case 'infra': {
        const vals = Empresas.opcoesDe(p, ped).map(x => x.valor);
        corpo = `<div class="linha-op"><span>Valor</span><div class="ops">${[...new Set(vals)].map(x => op('valor', x, x ? D(x) : 'Não', (v.valor || 0) === x)).join('')}</div></div>`;
        break;
      }
      case 'isencaoITBI':
        corpo = `<div class="linha-op"><span>Desconto</span><div class="ops">${OPCOES_NEG.itbi.map(x => op('pct', x, x >= 1 ? 'Isento' : x ? pct(x) : 'Cheio', Math.abs((v.pct || 0) - x) < 1e-6)).join('')}</div></div>`;
        break;
    }
    const at = Empresas.atendido(ped), atPct = Math.round(at * 100);
    const nivel = ped.peso >= 1.5 ? 'ess' : ped.peso >= 1 ? 'imp' : 'des';
    const topo = ped.extra
      ? `<div class="ped-top"><b>${d.nome}</b><span class="pri pri-extra">Oferta extra</span><button class="op mini-op" data-tirar="${ped.tipo}" title="Retirar">✕</button></div><small>A empresa não pediu isto; ajuda um pouco.</small>`
      : `<div class="ped-top"><b>${d.nome}</b><span class="pri pri-${nivel}">${Empresas.PRIORIDADES[ped.peso]}</span></div><small>Pedem: ${Empresas.descPedido(ped.tipo, ped.pedido)} · você oferece: <b>${Empresas.descPedido(ped.tipo, ped.dado)}</b></small>`;
    const medidor = ped.extra ? '' : `<div class="atende"><i><b style="width:${Math.min(100, atPct)}%;background:${at >= 0.999 ? 'var(--verde)' : at >= 0.5 ? 'var(--ouro)' : 'var(--vermelho)'}"></b></i><small>${atPct >= 100 ? (atPct > 100 ? 'Mais do que pediram' : 'Atende o pedido') : `Atende ${atPct}% do pedido`}</small></div>`;
    return `<div class="ped ${ped.extra ? 'extra' : ''}">${topo}${corpo}${medidor}</div>`;
  }

  // mesa de negociação
  function mesaNegociacao(p, estado) {
    const c = Empresas.cat(p.catId), S = Sim.S;
    const render = () => {
      const av = Empresas.avaliar(p);
      const l = Empresas.loteDe(p);
      Empresas.migrarProposta(p);
      const pedidos = p.pedidos.map((ped, i) => blocoPedido(p, ped, i, l)).join('');
      const tiposExtra = Object.keys(PEDIDOS_EMPRESA).filter(t => !p.pedidos.some(x => x.tipo === t) && !(t === 'doacaoTerreno' && !(l && l.tipo === 'publico')));
      const extras = tiposExtra.length ? `<div class="extras"><small>Oferecer também (a empresa não pediu, vale menos para ela):</small><div class="ops">${tiposExtra.map(t => `<button class="op" data-extra="${t}">+ ${PEDIDOS_EMPRESA[t].nome}</button>`).join('')}</div></div>` : '';
      const prios = p.pedidos.filter(x => !x.extra).slice().sort((a, b) => b.peso - a.peso).map(x => `<span class="pri pri-${x.peso >= 1.5 ? 'ess' : x.peso >= 1 ? 'imp' : 'des'}">${PEDIDOS_EMPRESA[x.tipo].curto}: ${Empresas.PRIORIDADES[x.peso]}</span>`).join('');
      const cps = Object.entries(CONTRAPARTIDAS).filter(([id, cp]) => !cp.soPoluente || c.poluicao).map(([id, cp]) =>
        { const k = Empresas.custoContrapartida(c, id), pz = k < 5 ? ['leve', 'Leve para eles'] : k < 10 ? ['medio', 'Peso médio'] : ['pesado', 'Pesado para eles'];
          return `<button class="cp ${p.exigidas.includes(id) ? 'sel' : ''}" data-cp="${id}" aria-pressed="${p.exigidas.includes(id)}"><b>${cp.nome}</b><small>${cp.desc}</small><span class="peso-cp ${pz[0]}">${pz[1]}</span></button>`; }).join('');
      const lotes = Empresas.lotesCompativeis(c.local).concat(l && !Empresas.lotesCompativeis(c.local).includes(l) ? [l] : []);
      const selLote = c.local === 'rural' ? '<p class="nota">Vai se instalar na zona rural, fora do perímetro urbano.</p>' :
        c.local === 'pequeno' ? `<p class="nota">Vai alugar um ponto comercial no bairro ${Sim.bairroById(p.bairro).nome}. Não precisa de lote.</p>` :
        `<label class="local">Terreno <select id="sel-lote">${lotes.map(x => `<option value="${x.id}" ${x.id === p.loteId ? 'selected' : ''}>Lote ${x.id} · ${Sim.bairroById(x.bairro).nome} (${x.tipo === 'publico' ? 'público' : 'particular'})</option>`).join('')}</select></label>`;
      const segs = [0, 1, 2, 3, 4].map(n => `<i class="${n <= av.termo.nivel ? 'on n' + av.termo.nivel : ''}"></i>`).join('');
      const votos = Empresas.preverCamara(p);
      const falas = p.falas.slice(-3).map(f => `<p class="fala ${f.quem}"><b>${f.quem === 'empresa' ? esc(c.negociador) : 'Você'}</b>${esc(f.txt)}</p>`).join('');
      return `<div class="mesa">
        <header class="mesa-top"><span class="logo-emp grande" style="background:${c.cor}">${c.nome[0]}</span>
          <div><small class="eyebrow">${SETORES[c.setor]} · mesa de negociação</small><h2>${esc(c.nome)}</h2><p class="nota">${esc(c.desc)}</p></div></header>
        <div class="mesa-nums"><span>Investimento <b>${D(c.invest)}</b></span><span>Empregos <b>${num(c.empregos)}</b></span><span>Obra <b>${c.meses} meses</b></span><span>Paciência <b>${'■'.repeat(Math.max(0, p.paciencia))}${'□'.repeat(Math.max(0, (p.pacMax || 3) - p.paciencia))}</b></span></div>
        ${(() => { const a = Empresas.atratividade(); const n = a.total >= 18 ? ['ok', 'muito alto'] : a.total >= 10 ? ['ok', 'alto'] : a.total >= 4 ? ['and', 'médio'] : ['ruim', 'baixo'];
          return `<div class="atrativ"><span>Interesse das empresas pela cidade: <b class="pill ${n[0]}">${n[1]}</b></span><small>${a.partes.filter(x => x.valor).map(x => `${x.nome} ${x.valor > 0 ? '+' : ''}${String(x.valor).replace('.', ',')}`).join(' · ')}</small></div>`; })()}
        ${p.rival ? `<p class="alerta">${p.rival.nome} está oferecendo condições melhores. A empresa vai pedir mais.</p>` : ''}
        <div class="falas">${falas}</div>
        <div class="mesa-cols">
          <section><h3>A empresa pede</h3><div class="prios"><small>O que mais importa para eles:</small>${prios}</div>${pedidos}${extras}${selLote}</section>
          <section><h3>A prefeitura exige em troca</h3><div class="cps-grid">${cps}</div></section>
        </div>
        <div class="termo"><span>Clima da negociação</span><div class="segs">${segs}</div><b>${av.termo.txt}</b></div>
        ${termometro(p, true)}
        <div class="mesa-res">
          <span>Empregos para moradores <b>~${num(av.empregosLocais)}</b></span>
          <span>Receita para a prefeitura <b class="pos">${D(av.receitaMes)}/mês</b>${av.receitaMes < av.receitaMesCheia - 1 ? ` <small>(${D(av.receitaMesCheia)} sem incentivos)</small>` : ''}</span>
          <span>Custo de obras para a prefeitura <b class="${av.custoUnico ? 'neg' : ''}">${D(av.custoUnico)}</b></span>
          ${av.vendaLote ? `<span>Venda do terreno <b class="pos">+${D(av.vendaLote)}</b></span>` : ''}
          <span>Câmara ${av.precisaCamara ? `<b class="${votos >= 6 ? 'pos' : 'neg'}">~${votos} votos a favor</b> <small>(precisa de 6)</small>` : '<b>não precisa votar</b>'}</span>
        </div>
        ${p._sug ? `<div class="sugestao"><span>Sugestão da empresa: <b>${p._sug.map(x => esc(Empresas.descPedido(x.tipo, x.v))).join(' + ')}</b></span><button class="btn ouro" id="usar-sug">Colocar na proposta</button></div>` : ''}
        <div class="acoes"><button class="btn primario" id="propor">Apresentar proposta</button><button class="btn" id="sondar" ${p.sondagens > 0 ? '' : 'disabled'} title="A empresa diz o que falta para fechar. Não gasta paciência.">Perguntar o que falta (${p.sondagens})</button><button class="btn" id="depois">Pensar depois</button><button class="btn" id="recusar">Recusar a empresa</button></div>
      </div>`;
    };
    const ligar = el => {
      el.querySelectorAll('[data-ped]').forEach(b => b.addEventListener('click', () => {
        const ped = p.pedidos[+b.dataset.ped], campo = b.dataset.campo;
        const d = { ...ped.dado };
        if (b.dataset.delta) d.anos = Math.max(1, Math.min(Math.max(10, ped.pedido.anos || 0), (d.anos || 0) + +b.dataset.delta));
        else d[campo] = b.dataset.v === 'null' ? null : +b.dataset.v;
        if (ped.tipo === 'isencaoIPTU') { if (!d.pct) d.anos = 0; else if (!d.anos) d.anos = ped.pedido.anos || 2; }
        if (ped.tipo === 'reducaoISS') { if (!d.taxa) d.anos = 0; else if (!d.anos) d.anos = ped.pedido.anos || 2; }
        ped.dado = d; p._sug = null; atualizar(el);
      }));
      el.querySelectorAll('[data-extra]').forEach(b => b.addEventListener('click', () => { Empresas.oferecerExtra(p, b.dataset.extra); atualizar(el); }));
      el.querySelectorAll('[data-tirar]').forEach(b => b.addEventListener('click', () => { Empresas.removerExtra(p, b.dataset.tirar); atualizar(el); }));
      const so = el.querySelector('#sondar'); if (so) so.addEventListener('click', () => { const r = Empresas.sondar(p); p._sug = r.sugestao || null; atualizar(el); });
      const us = el.querySelector('#usar-sug'); if (us) us.addEventListener('click', () => { for (const sg of p._sug) { const ped = p.pedidos.find(x => x.tipo === sg.tipo); if (ped) ped.dado = { ...sg.v }; } p._sug = null; atualizar(el); });
      el.querySelectorAll('[data-cp]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.cp; p.exigidas = p.exigidas.includes(id) ? p.exigidas.filter(x => x !== id) : [...p.exigidas, id]; atualizar(el);
      }));
      const sl = el.querySelector('#sel-lote'); if (sl) sl.addEventListener('change', () => { p.loteId = sl.value; atualizar(el); });
      el.querySelector('#depois').addEventListener('click', () => { fecharModal(); renderPainel(); });
      el.querySelector('#recusar').addEventListener('click', () => { Empresas.recusar(p); fecharModal(); renderPainel(); atualizarHUD(); });
      el.querySelector('#propor').addEventListener('click', () => {
        const r = Empresas.proporRodada(p);
        if (r === 'contra') { atualizar(el); return; }
        const ultima = p.falas[p.falas.length - 1].txt;
        const e = Sim.S.empresas.find(x => x.catId === p.catId);
        el.innerHTML = r === 'aceita'
          ? `<div class="mesa fim"><small class="eyebrow">Acordo fechado</small><h2 class="pos">Aperto de mão com ${esc(c.nome)}</h2><p class="fala empresa"><b>${esc(c.negociador)}</b>${esc(ultima)}</p>
             <p>${e && e.status === 'camara' ? `Os incentivos vão a votação na Câmara no dia ${e.sessao.dia}${e.sessao.mesIndex !== Sim.S.mesIndex ? ' do próximo mês' : ''}. Converse com os vereadores para garantir os votos.` : `A obra começa agora e leva ${c.meses} meses.`}</p>
             <button class="btn primario" id="ok">Continuar</button></div>`
          : `<div class="mesa fim"><small class="eyebrow">Negociação encerrada</small><h2 class="neg">${esc(c.nome)} desistiu</h2><p class="fala empresa"><b>${esc(c.negociador)}</b>${esc(ultima)}</p><button class="btn primario" id="ok">Continuar</button></div>`;
        el.querySelector('#ok').addEventListener('click', () => { fecharModal(); renderPainel(); atualizarHUD(); });
        atualizarHUD();
      });
    };
    const atualizar = el => { const sc = el.scrollTop; el.innerHTML = render(); ligar(el); el.scrollTop = sc; };
    modal(render(), el => { el.classList.add('largo'); ligar(el); });
  }

  function mostrarCobranca({ empresa: e, cp }) {
    const c = Empresas.cat(e.catId);
    const multa = Math.round(c.invest * 0.02 / 1e4) * 1e4;
    modal(`<div class="cobranca"><small class="eyebrow">Fiscalização · ${dataHoje()}</small>
      <h2>${esc(e.nome)} não cumpriu o acordo</h2>
      <p>A empresa prometeu <b>${CONTRAPARTIDAS[cp.id].nome.toLowerCase()}</b> e não entregou no prazo. Os moradores de ${e.bairro === 'rural' ? 'Vila Operária' : Sim.bairroById(e.bairro).nome} estão cobrando a prefeitura.</p>
      <div class="opcoes-dec">
        <button class="carta" data-d="multar"><b>Multar em ${D(multa)}</b><small>Dinheiro no caixa e mais 6 meses de prazo. A empresa fica irritada e pode ir embora.</small></button>
        <button class="carta" data-d="prazo"><b>Dar mais 6 meses</b><small>A relação melhora, mas a população acha a prefeitura frouxa.</small></button>
        <button class="carta" data-d="justica"><b>Processar na Justiça</b><small>Quase certeza de cumprimento, mas leva até um ano e desgasta a relação.</small></button>
      </div></div>`, el => el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => {
        Empresas.decidirCobranca(e.id, cp.id, b.dataset.d); fecharModal(); renderPainel(); atualizarHUD();
      })));
  }

  function mostrarVotacaoEmpresa(r) {
    modal(`<div class="votacao"><small class="eyebrow">Sessão da Câmara · ${dataHoje()}</small>
      <h2 class="${r.aprovado ? 'pos' : 'neg'}">Incentivos para ${esc(r.empresa.nome)} ${r.aprovado ? 'aprovados' : 'rejeitados'}: ${r.sim} a ${r.nao}</h2>
      <div class="votos">${r.votos.map(v => `<div class="voto ${v.sim ? 'sim' : 'nao'}"><span>${v.sim ? 'SIM' : 'NÃO'}</span><b>${esc(v.nome)}</b><small>${v.partido}</small></div>`).join('')}</div>
      <p>${r.aprovado ? 'A obra começa agora.' : 'Sem os incentivos, a empresa desistiu da cidade.'}</p>
      <button class="btn primario" id="ok-ve">Continuar</button></div>`, el => el.querySelector('#ok-ve').addEventListener('click', fecharModal));
  }

  // ------------------------------------------------------------- toasts
  // nada de notificação na tela: tudo vai para a lista de Avisos
  function toast(txt, tipo) { if (Sim.S) Vida.aviso(txt, tipo); }

  // -------------------------------------------------------------- modal
  function modal(html, depois) {
    if (modalAberto) { modalFila.push([html, depois]); return; }
    modalAberto = true;
    $('#modal-corpo').innerHTML = html;
    $('#modal').hidden = false;
    if (depois) depois($('#modal-corpo'));
    const foco = $('#modal-corpo').querySelector('button'); if (foco) foco.focus();
  }
  function fecharModal() {
    modalAberto = false; $('#modal').hidden = true; $('#modal-corpo').classList.remove('largo');
    if (modalFila.length) { const [h, d] = modalFila.shift(); modal(h, d); }
  }

  function mostrarJornal(j) {
    const S = Sim.S;
    const f = j.financas;
    modal(`<article class="jornal">
      <header><small>Edição nº ${j.edicao} · ${MESES[j.mes]} de ${j.ano} · R$ 3,00</small><h1>Correio de ${esc(S.cidade)}</h1></header>
      <h2>${esc(j.manchete.texto)}</h2>${j.manchete.sub ? `<p class="linha-fina">${esc(j.manchete.sub)}</p>` : ''}
      <div class="colunas">
        <div>${j.outras.map(o => `<p><b>${esc(o.texto)}</b>${o.sub ? `<br><small>${esc(o.sub)}</small>` : ''}</p>`).join('')}</div>
        <aside>
          <h4>Contas do mês</h4>
          <p>Receitas ${D(f.receita)}<br>Despesas ${D(f.despesa)}<br><b class="${f.saldo < 0 ? 'neg' : ''}">Saldo ${f.saldo >= 0 ? '+' : ''}${D(f.saldo)}</b><br>Caixa ${D(f.caixa)}</p>
          <h4>Aprovação</h4><p class="grande">${Math.round(j.aprov)}%</p>
          ${j.pesquisa ? `<h4>Pesquisa Datavox</h4><p>${esc(S.prefeito)} <b>${Math.round(j.pesquisa.voce)}%</b><br>${esc(S.candidato.nome)} <b>${Math.round(j.pesquisa.rival)}%</b><br><small>Eleição em ${j.mesesAteEleicao} ${j.mesesAteEleicao === 1 ? 'mês' : 'meses'}</small></p>` : ''}
        </aside>
      </div>
      <button class="btn primario" id="fechar-jornal">Virar a página</button>
    </article>`, el => el.querySelector('#fechar-jornal').addEventListener('click', fecharModal));
  }

  function mostrarVotacao(r) {
    const vig = r.vigencias.map(v => `<li>${Sim.CAMPOS_IMPOSTO[v.campo].nome}: ${v.mesIndex === Sim.S.mesIndex ? 'vale a partir de agora' : 'vale a partir de ' + Sim.fmtMesIndex(v.mesIndex)}</li>`).join('');
    modal(`<div class="votacao">
      <small class="eyebrow">Sessão da Câmara · ${dataHoje()}</small>
      <h2 class="${r.aprovado ? 'pos' : 'neg'}">Projeto ${r.aprovado ? 'aprovado' : 'rejeitado'}: ${r.sim} a ${r.nao}</h2>
      <ul class="mudancas">${r.mudancas.map(m => `<li>${Sim.CAMPOS_IMPOSTO[m.campo].nome}: ${Sim.fmtImposto(m.campo, m.de)} → ${Sim.fmtImposto(m.campo, m.para)}</li>`).join('')}</ul>
      <div class="votos">${r.votos.map(v => `<div class="voto ${v.sim ? 'sim' : 'nao'}"><span>${v.sim ? 'SIM' : 'NÃO'}</span><b>${esc(v.nome)}</b><small>${v.partido}</small></div>`).join('')}</div>
      ${r.aprovado ? `<ul class="vig">${vig}</ul>` : '<p class="nota">Converse com os vereadores e tente de novo com outra proposta.</p>'}
      <button class="btn primario" id="ok-vot">Continuar</button></div>`, el => el.querySelector('#ok-vot').addEventListener('click', fecharModal));
  }

  function mostrarEleicao(r) {
    const S = Sim.S;
    const bairros = BAIRROS.map(b => `<div class="linha-barra"><span>${b.nome}</span>${barra(r.porBairro[b.id], 100, r.porBairro[b.id] > 50 ? 'var(--verde)' : 'var(--vermelho)', 50)}<b>${Math.round(r.porBairro[b.id])}%</b></div>`).join('');
    const proms = r.promessas.map(p => `<li>${p.titulo} ${pill(p.status)}</li>`).join('');
    modal(`<div class="eleicao ${r.venceu ? 'venceu' : 'perdeu'}">
      <small class="eyebrow">Eleição municipal · outubro de ${r.ano}</small>
      <h2>${r.venceu ? 'REELEITO!' : 'Derrota nas urnas'}</h2>
      <div class="placar"><div><span>${esc(S.prefeito)}</span><strong>${r.total.toFixed(1).replace('.', ',')}%</strong></div><div><span>${esc(r.candidato.nome)}</span><strong>${r.rival.toFixed(1).replace('.', ',')}%</strong></div></div>
      <h3>Votos por bairro</h3>${bairros}
      <h3>Promessas</h3><ul class="proms">${proms}</ul>
      ${r.venceu ? `<p>Você governa ${esc(S.cidade)} por mais dois anos. Escolha as promessas da nova campanha.</p><button class="btn primario" id="novo-mandato">Escolher novas promessas</button>`
        : `<p>Foram ${S.mandato} ${S.mandato === 1 ? 'mandato' : 'mandatos'} e ${S.mesIndex} meses no cargo.</p><button class="btn primario" id="novo-jogo">Voltar ao menu</button>`}
    </div>`, el => {
      const a = el.querySelector('#novo-mandato'); if (a) a.addEventListener('click', () => { fecharModal(); escolherPromessas(true); });
      const b = el.querySelector('#novo-jogo'); if (b) b.addEventListener('click', () => { Sim.salvar(); location.reload(); });
    });
  }

  function cartoesPromessas(selecionadas) {
    return PROMESSAS.map(p => `<button class="carta ${selecionadas.includes(p.id) ? 'sel' : ''}" data-prom="${p.id}" aria-pressed="${selecionadas.includes(p.id)}">
      <b>${p.titulo}</b><small>${p.desc}</small><span class="peso">${'■'.repeat(p.peso)}${'□'.repeat(3 - p.peso)}</span></button>`).join('');
  }

  function escolherPromessas(reeleicao) {
    let sel = [];
    const html = () => `<div class="escolha"><small class="eyebrow">Campanha do ${Sim.S.mandato + 1}º mandato</small><h2>Escolha 3 promessas</h2>
      <p class="nota">Promessas difíceis (■■■) valem mais votos, mas pesam mais se forem quebradas.</p>
      <div class="cartas">${cartoesPromessas(sel)}</div>
      <button class="btn primario" id="ok-prom" ${sel.length === 3 ? '' : 'disabled'}>Começar o novo mandato (${sel.length}/3)</button></div>`;
    const ligar = el => {
      el.querySelectorAll('[data-prom]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.prom;
        if (sel.includes(id)) sel = sel.filter(x => x !== id); else if (sel.length < 3) sel.push(id);
        el.innerHTML = html(); ligar(el);
      }));
      el.querySelector('#ok-prom').addEventListener('click', () => { if (sel.length !== 3) return; Sim.novoMandato(sel); fecharModal(); toast('Novo mandato começou!'); atualizarHUD(); });
    };
    modal(html(), ligar);
  }

  function abrirVoz(msg) {
    painel = { tipo: 'voz', arg: msg };
    const g = GRUPOS.find(x => x.id === msg.grupo).nome;
    $('#painel-titulo').textContent = 'Voz do povo';
    $('#painel-corpo').innerHTML = `<div class="voz grande ${msg.positivo ? 'boa' : ''}"><div class="voz-top"><b>${esc(msg.nome)}</b><small>${g} · ${Sim.bairroById(msg.bairro).nome}</small></div><p>"${esc(msg.texto)}"</p></div>
      ${msg.ouvida ? '' : '<button class="btn primario" id="ouvir">Registrar e responder</button>'}
      <button class="btn" id="ir-ouv">Ver a Ouvidoria</button>`;
    $('#painel').hidden = false;
    const b = $('#ouvir'); if (b) b.addEventListener('click', () => { Sim.ouvir(msg); toast(`${msg.nome} se sentiu ouvido(a).`); abrir('ouvidoria'); });
    $('#ir-ouv').addEventListener('click', () => abrir('ouvidoria'));
  }

  // ------------------------------------------------------- tela inicial
  // menu com os jogos salvos + formulário de novo jogo
  function telaInicial() {
    const el = $('#inicio');
    let vista = Sim.listarSaves().length ? 'menu' : 'novo';
    let sel = [], ritmo = 'medio', dific = 'medio', confirmar = null;
    const logo = `<div class="logo"><h1>PREFEITO</h1><small>Governe uma cidade do interior paulista e conquiste a reeleição</small></div>`;
    const quando = t => { if (!t) return ''; const d = new Date(t); return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
    const menu = () => {
      const saves = Sim.listarSaves();
      const linhas = saves.map(s => `<div class="save ${s.fim ? 'fim' : ''}">
          <div class="save-info"><b>${esc(s.cidade)}</b>
            <small>${esc(s.prefeito || '')} · ${s.mandato || 1}º mandato · ${MESES_CURTO[s.mes]} ${s.ano}</small>
            <small>${(DIFICULDADES[s.dificuldade] || DIFICULDADES.medio).nome} · ${s.ritmo ? RITMOS[s.ritmo].nome : 'Clássico'}${s.aprov != null ? ' · aprovação ' + s.aprov + '%' : ''} · caixa ${D(s.caixa || 0)}</small>
            <small class="quando">${s.fim ? 'Mandato encerrado' : 'Salvo em ' + quando(s.atualizado)}</small></div>
          <div class="save-acoes">${s.fim ? '' : `<button class="btn primario" data-jogar="${s.id}">Jogar</button>`}
            <button class="btn ${confirmar === s.id ? 'perigo' : ''}" data-apagar="${s.id}">${confirmar === s.id ? 'Confirmar' : 'Apagar'}</button></div>
        </div>`).join('');
      el.innerHTML = `${logo}<div class="inicio-caixa moldura">
        <h3>Seus jogos salvos</h3>
        <div class="saves">${linhas || '<p class="nota">Nenhum jogo salvo.</p>'}</div>
        <button class="btn ouro largo" id="ir-novo">Novo jogo</button>
        <p class="nota">Cada cidade é salva sozinha no fim de cada dia, neste navegador.</p></div>`;
      el.querySelectorAll('[data-jogar]').forEach(b => b.addEventListener('click', () => {
        if (Sim.carregar(b.dataset.jogar)) comecar(); else toast('Não foi possível abrir esse jogo.');
      }));
      el.querySelectorAll('[data-apagar]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.apagar;
        if (confirmar === id) { Sim.apagarSave(id); confirmar = null; if (!Sim.listarSaves().length) vista = 'novo'; }
        else confirmar = id;
        render();
      }));
      el.querySelector('#ir-novo').addEventListener('click', () => { vista = 'novo'; render(); });
    };
    const novo = () => {
      const nome = $('#in-cidade') ? $('#in-cidade').value : '';
      const pref = $('#in-prefeito') ? $('#in-prefeito').value : '';
      const cartasRitmo = Object.entries(RITMOS).map(([id, r]) => `<button class="carta curta ${ritmo === id ? 'sel' : ''}" data-ritmo="${id}" aria-pressed="${ritmo === id}"><b>${r.nome}</b><small>${r.desc}</small></button>`).join('');
      const cartasDif = Object.entries(DIFICULDADES).map(([id, d]) => `<button class="carta curta ${dific === id ? 'sel' : ''} dif-${id}" data-dif="${id}" aria-pressed="${dific === id}"><b>${d.nome}</b><small>${d.desc}</small><span class="caixa-ini">Caixa inicial ${D(d.caixa)}</span></button>`).join('');
      el.innerHTML = `${logo}<div class="inicio-caixa moldura">
        <div class="campos">
          <label for="in-cidade">Nome da sua cidade<input id="in-cidade" maxlength="24" value="${esc(nome)}" autocomplete="off"></label>
          <label for="in-prefeito">Seu nome (prefeito ou prefeita)<input id="in-prefeito" maxlength="24" value="${esc(pref)}" autocomplete="off"></label>
        </div>
        <h3>Ritmo do jogo</h3>
        <div class="cartas tres">${cartasRitmo}</div>
        <h3>Dificuldade</h3>
        <div class="cartas tres">${cartasDif}</div>
        <h3>Escolha 3 promessas de campanha</h3>
        <p class="nota">Você governa uma cidade de 25 mil habitantes no interior paulista. Mandato de 2 anos, reeleições sem limite. Promessas difíceis (■■■) valem mais votos.</p>
        <div class="cartas">${cartoesPromessas(sel)}</div>
        <div class="inicio-botoes">${Sim.listarSaves().length ? '<button class="btn" id="voltar">Voltar</button>' : ''}
        <button class="btn primario largo" id="posse" ${sel.length === 3 ? '' : 'disabled'}>Tomar posse (${sel.length}/3 promessas)</button></div>
      </div>`;
      el.querySelectorAll('[data-prom]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.prom;
        if (sel.includes(id)) sel = sel.filter(x => x !== id); else if (sel.length < 3) sel.push(id);
        render();
      }));
      el.querySelectorAll('[data-ritmo]').forEach(b => b.addEventListener('click', () => { ritmo = b.dataset.ritmo; render(); }));
      el.querySelectorAll('[data-dif]').forEach(b => b.addEventListener('click', () => { dific = b.dataset.dif; render(); }));
      const v = el.querySelector('#voltar'); if (v) v.addEventListener('click', () => { vista = 'menu'; render(); });
      el.querySelector('#posse').addEventListener('click', () => {
        const c = $('#in-cidade').value.trim();
        if (!c) { $('#in-cidade').focus(); $('#in-cidade').classList.add('erro'); toast('Dê um nome para a sua cidade.'); return; }
        Sim.novoJogo({ cidade: c, prefeito: $('#in-prefeito').value.trim() || 'Prefeito(a)', promessas: sel, ritmo, dificuldade: dific });
        comecar();
      });
    };
    const render = () => {
      const y = el.scrollTop;
      if (vista === 'menu') menu(); else novo();
      el.scrollTop = y;
    };
    render();
    el.hidden = false;
  }

  function comecar() {
    tooltipsVelocidade();
    $('#inicio').hidden = true;
    $('#hud').hidden = false;
    Jogo.velocidade = 1;
    atualizarHUD();
    if (Sim.S.mesIndex === 0 && Sim.S.dia === 1 && !(Sim.S.avisos || []).length) {
      toast(`Bem-vindo à prefeitura de ${Sim.S.cidade}! Clique nos lotes para construir. Arraste o mapa para andar; roda do mouse ou pinça para zoom.`);
    }
  }

  // ------------------------------------------------------------- ligação
  function init() {
    // moldura de madeira e ícones desenhados em pixel art
    document.documentElement.style.setProperty('--moldura', `url(${Art.moldura()})`);
    document.querySelectorAll('.barra-icones button[data-ico]').forEach(b => { b.style.backgroundImage = `url(${Art.icone(b.dataset.ico).toDataURL()})`; });
    document.querySelectorAll('.menu button').forEach(b => b.addEventListener('click', () => {
      if (painel && painel.tipo === b.dataset.p) fechar(); else abrir(b.dataset.p);
    }));
    $('#fechar-painel').addEventListener('click', fechar);
    window.addEventListener('resize', escalaUI);
    escalaUI();
    document.querySelectorAll('[data-vel]').forEach(b => b.addEventListener('click', () => { Jogo.velocidade = +b.dataset.vel; atualizarHUD(); }));
    $('#pular').addEventListener('click', () => {
      if (!Jogo.rodando()) return;
      Sim.pularMes(); atualizarHUD(); renderPainelSeVivo();
    });
    $('#dormir').addEventListener('click', dormir);
    ligarRecolher();
    $('#ir-menu').addEventListener('click', () => { Sim.salvar(); location.reload(); });
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || !Sim.S || !$('#inicio').hidden) return;
      if (e.key === 'Escape') { if (modalAberto) return; fechar(); }
      if ((e.key === 'z' || e.key === 'Z') && !modalAberto) { dormir(); return; }
      if ((e.key === 'r' || e.key === 'R') && !modalAberto) { abrir('recursos'); return; }
      if ((e.key === 'e' || e.key === 'E') && !modalAberto) { abrir('eventos'); return; }
      if ((e.key === 'v' || e.key === 'V') && !modalAberto) { abrir('avisos'); return; }
      if (e.key === ' ') { e.preventDefault(); Jogo.velocidade = Jogo.velocidade ? 0 : 1; atualizarHUD(); }
      const atalhos = ['licitacoes', 'financas', 'impostos', 'empresas', 'camara', 'promessas', 'populacao', 'regiao', 'ouvidoria', 'jornal'];
      const n = parseInt(e.key, 10);
      if (n >= 0 && n <= 9 && e.key.length === 1 && !modalAberto) abrir(atalhos[n]);
    });

    // ---- som
    const ligarAudio = () => Som.iniciar();
    document.addEventListener('pointerdown', ligarAudio, { once: true });
    document.addEventListener('keydown', ligarAudio, { once: true });
    document.addEventListener('click', e => { if (e.target.closest('button, .carta, summary')) Som.sfx('clique'); });
    const botoesSom = () => { $('#som-musica').classList.toggle('desl', !Som.pref.musica); $('#som-sfx').classList.toggle('desl', !Som.pref.sfx); };
    $('#som-musica').addEventListener('click', () => { Som.iniciar(); Som.alternarMusica(); botoesSom(); });
    $('#som-sfx').addEventListener('click', () => { Som.iniciar(); Som.alternarSfx(); botoesSom(); });
    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.key === 'm' || e.key === 'M') { Som.alternarMusica(); botoesSom(); }
      if (e.key === 'n' || e.key === 'N') { Som.alternarSfx(); botoesSom(); }
    });
    botoesSom();
    Sim.on('proposta', () => Som.sfx('aviso'));
    Sim.on('ofertaRecurso', () => Som.sfx('moeda'));
    Sim.on('recursoNegado', () => Som.sfx('rejeitado'));
    Sim.on('mes', () => Som.sfx('jornal'));
    Sim.on('votacao', r => Som.sfx(r.aprovado ? 'aprovado' : 'rejeitado'));
    Sim.on('votacaoEmpresa', r => Som.sfx(r.aprovado ? 'aprovado' : 'rejeitado'));
    Sim.on('acordo', () => Som.sfx('aprovado'));
    Sim.on('inauguracao', () => Som.sfx('fanfarra'));
    Sim.on('inauguracaoEmpresa', () => Som.sfx('fanfarra'));
    Sim.on('obra', () => Som.sfx('obra'));
    Sim.on('cobranca', () => Som.sfx('rejeitado'));
    Sim.on('obraParada', () => Som.sfx('rejeitado'));
    Sim.on('eleicao', r => Som.sfx(r.venceu ? 'vitoria' : 'derrota'));

    Sim.on('dia', () => { atualizarHUD(); renderPainelSeVivo(); });
    Sim.on('mudou', () => atualizarHUD());
    Sim.on('aviso', () => { atualizarHUD(); if (painel && painel.tipo === 'avisos') renderPainelSeVivo(); });
    Sim.on('evento', () => { atualizarHUD(); if (painel && painel.tipo === 'eventos') renderPainel(); });
    Sim.on('protesto', () => { atualizarHUD(); if (painel && (painel.tipo === 'praca' || painel.tipo === 'eventos')) renderPainel(); });
    Sim.on('ocorrencia', () => { if (painel && (painel.tipo === 'ocorrencia' || painel.tipo === 'avisos')) renderPainel(); });
    Sim.on('mes', j => { atualizarHUD(); if (painel && PAINEIS_MENSAIS.includes(painel.tipo)) renderPainel(); if (j) mostrarJornal(j); });
    Sim.on('votacao', r => mostrarVotacao(r));
    Sim.on('eleicao', r => { mostrarEleicao(r); atualizarHUD(); });
    Sim.on('inauguracao', l => toast(`Inaugurado: ${PREDIOS[l.predio].nome}!`, 'ouro'));
    Sim.on('proposta', p => { toast(`Nova proposta: ${p.nome} quer se instalar na cidade!`, 'ouro'); atualizarHUD(); });
    Sim.on('votacaoEmpresa', r => mostrarVotacaoEmpresa(r));
    Sim.on('ofertaRecurso', of => { atualizarHUD(); mostrarOferta(of); });
    Sim.on('recursoNegado', p => toast(`Pedido negado: ${p.nome}. Tente de novo em 6 meses.`));
    Sim.on('cobranca', c => mostrarCobranca(c));
    Sim.on('inauguracaoEmpresa', e => toast(`${e.nome} abriu as portas: ${e.empregos} vagas!`, 'ouro'));
    setInterval(atualizarDiaBar, 200);
    telaInicial();
  }
  function renderPainelSeVivo() { if (painel && PAINEIS_VIVOS.includes(painel.tipo)) renderPainel(); }

  function novaVoz(msg) { atualizarHUD(); Som.sfx('balao'); }

  return {
    init, toast, corDaHora,
    abrirOcorrencia: id => abrir('ocorrencia', id),
    abrirPraca: () => abrir('praca'),
    abrirNegociacao: id => { const p = Sim.S.propostas.find(x => x.id === id); if (p) mesaNegociacao(p); }, abrirLote: id => abrir('lote', id), abrirBairro: id => abrir('bairro', id), abrirVoz, novaVoz,
    bloqueado: () => modalAberto || !$('#inicio').hidden,
    modalAberto: () => modalAberto,
    painelAberto: () => painel && painel.tipo,
  };
})();
