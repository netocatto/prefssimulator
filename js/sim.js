// =====================================================================
//  PREFEITO — simulação (sem nada de desenho aqui)
//  Estado único em Sim.S. A cena e a interface só leem o estado e
//  chamam as ações (construir, enviar projeto, atender vereador...).
// =====================================================================

const Sim = (() => {
  let S = null;
  const listeners = {};

  // ----------------------------------------------------------------- util
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const diasNoMes = (m, y) => new Date(y, m + 1, 0).getDate();
  const bairroById = id => BAIRROS.find(b => b.id === id);

  function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }
  function emit(ev, data) { (listeners[ev] || []).forEach(fn => fn(data)); }

  function noticia(prioridade, texto, sub) {
    S.eventosMes.push({ prioridade, texto, sub: sub || '' });
  }

  // ------------------------------------------------------------ novo jogo
  // opts = { cidade, prefeito, promessas, ritmo, dificuldade }
  function novoJogo(opts) {
    const dif = DIFICULDADES[opts.dificuldade] || DIFICULDADES.medio;
    const promessas = opts.promessas;
    S = {
      versao: 2,
      saveId: 's' + Date.now().toString(36),
      cidade: opts.cidade,
      prefeito: opts.prefeito || 'Prefeito(a)',
      ritmo: opts.ritmo || 'rapido', segDia: (RITMOS[opts.ritmo] || RITMOS.rapido).seg,
      dificuldade: opts.dificuldade || 'medio',
      mods: { admin: dif.admin, previdencia: dif.previdencia, divida: dif.divida, desemprego: dif.desemprego },
      crescimento: [], negocios: [],
      ano: ANO_INICIAL, mes: 0, dia: 1, mesIndex: 0,
      tempoDia: 0,            // segundos reais acumulados no dia atual
      caixa: dif.caixa,
      bairros: {},
      impostos: { iptu: { centro: 1.0, operaria: 1.0, nobre: 1.0, distrito: 1.0 }, iptuInd: 1.5, iss: 3.0, itbi: 2.0, lixo: 18 },
      orcamento: { admin: 1.0, saude: 1.0, educacao: 1.0, urbano: 1.0 },
      leisPendentes: [],      // aumentos aprovados aguardando a noventena/anterioridade
      projeto: null,          // projeto de lei em tramitação na Câmara
      vereadores: VEREADORES.map(v => ({ ...v, lealdade: clamp(v.lealdade + dif.lealdade, 5, 95), pedido: null, pedidoEm: 0, reuniaoMes: -1 })),
      lotes: LOTES_INICIAIS.map(l => ({ ...l, predio: l.ocupado || null, obra: null })),
      servicos: 1.0, industria: dif.industria, desemprego: dif.desemprego,
      humor: { global: dif.humor, grupos: {}, bairros: {} },  // começa com lua de mel
      rivais: RIVAIS.map(r => ({ ...r })),
      candidato: { ...CANDIDATOS_RIVAIS[0], forca: dif.rival },
      mandato: 1, inicioMandato: ANO_INICIAL,
      promessas: [], termo: null,
      historico: [], jornais: [], ouvidoria: [],
      anoFiscal: { baseCalculo: 0, saude: 0, educacao: 0 },
      eventosMes: [], ultimoFinanceiro: null,
      eleicaoFeita: false, fimDeJogo: false,
      propostas: [], empresas: [], empresasUsadas: [], proxProposta: 0, cobrancas: [], contratos: [], pedidosRecursos: [], ofertasRecursos: [], convenios: [],
    };
    for (const b of BAIRROS) {
      S.bairros[b.id] = { pop: b.pop, aprov: {} };
    }
    // pedidos iniciais dos vereadores
    S.vereadores.forEach((v, i) => { if (i % 3 === 0) novoPedido(v); });
    iniciarMandato(promessas);
    Recursos.garantir();
    // aprovação inicial = alvo + lua de mel
    const alvo = calcularAlvos();
    for (const b of BAIRROS) for (const g of GRUPOS) S.bairros[b.id].aprov[g.id] = clamp(alvo[b.id][g.id], 0, 100);
    S.ultimoFinanceiro = calcularFinancas(false);
    noticia(5, `${S.prefeito} toma posse e promete: "${PROMESSAS.find(p => p.id === promessas[0]).titulo}"`, 'Cerimônia lotou a Câmara de Vereadores');
    salvar();
    emit('inicio');
    return S;
  }

  function iniciarMandato(promessas) {
    S.promessas = promessas.slice(0, 3);
    S.termo = {
      aumentou: false, mesNegativo: false,
      construidos: {},
      iptuInicio: iptuMedio(),
    };
    S.eleicaoFeita = false;
  }

  function iptuMedio() {
    let soma = 0, pop = 0;
    for (const b of BAIRROS) { soma += S.impostos.iptu[b.id] * S.bairros[b.id].pop; pop += S.bairros[b.id].pop; }
    return soma / pop;
  }

  // ----------------------------------------------------------- população
  const popTotal = () => BAIRROS.reduce((s, b) => s + S.bairros[b.id].pop, 0);
  const domicilios = id => S.bairros[id].pop / 3;

  // ------------------------------------------------------------ cobertura
  // cobertura[bairro][categoria] entre 0 e 1.2
  function calcularCobertura() {
    const total = popTotal();
    const cov = {};
    const predios = S.lotes.filter(l => l.predio && PREDIOS[l.predio]);
    const extras = Empresas.coberturaExtra().concat(Licitacoes.coberturaExtra());
    for (const b of BAIRROS) {
      cov[b.id] = {};
      const pop = S.bairros[b.id].pop;
      for (const c in CATS) {
        let disp = 0;
        for (const l of predios) {
          const t = PREDIOS[l.predio];
          if (t.cat !== c) continue;
          if (l.bairro === b.id) disp += t.cap;
          else disp += t.cap * t.spill * pop / Math.max(1, total - S.bairros[l.bairro].pop);
        }
        for (const ex of extras) {
          if (ex.cat !== c) continue;
          if (ex.bairro === b.id) disp += ex.cap;
          else if (!ex.local) disp += ex.cap * 0.2 * pop / Math.max(1, total - S.bairros[ex.bairro].pop);
        }
        let q = 1;
        if (c === 'saude') q = 0.7 + 0.3 * S.orcamento.saude;
        if (c === 'educacao' || c === 'creche') q = 0.7 + 0.3 * S.orcamento.educacao;
        const demanda = pop * CATS[c].demanda;
        cov[b.id][c] = clamp(CATS[c].base + (disp / demanda) * q, 0, 1.2);
      }
    }
    return cov;
  }

  function coberturaCidade(cov, c) {
    let s = 0, p = 0;
    for (const b of BAIRROS) { s += Math.min(1, cov[b.id][c]) * S.bairros[b.id].pop; p += S.bairros[b.id].pop; }
    return s / p;
  }

  // ------------------------------------------------------------ promessas
  function statusPromessa(id, cov) {
    cov = cov || calcularCobertura();
    const t = S.termo, c = t.construidos;
    switch (id) {
      case 'hospital':  return (c.hospital || 0) >= 1 ? 'cumprida' : 'andamento';
      case 'creche':    return coberturaCidade(cov, 'creche') >= 0.9 ? 'cumprida' : 'andamento';
      case 'empregos':  return S.desemprego <= 6 ? 'cumprida' : 'andamento';
      case 'escolas':   return (c.escola || 0) >= 2 ? 'cumprida' : 'andamento';
      case 'seguranca': return coberturaCidade(cov, 'seguranca') >= 0.9 ? 'cumprida' : 'andamento';
      case 'iptu':      return iptuMedio() < t.iptuInicio - 0.001 ? 'cumprida' : 'andamento';
      case 'impostos':  return t.aumentou ? 'quebrada' : 'mantida';
      case 'bombeiros': return (c.bombeiros || 0) >= 1 ? 'cumprida' : 'andamento';
      case 'cultura':   return (c.cultura || 0) >= 1 ? 'cumprida' : 'andamento';
      case 'contas':    return t.mesNegativo ? 'quebrada' : 'mantida';
    }
    return 'andamento';
  }

  function efeitoPromessas(cov) {
    // efeito contínuo na aprovação por grupo
    const ef = {};
    GRUPOS.forEach(g => ef[g.id] = 0);
    for (const id of S.promessas) {
      const p = PROMESSAS.find(x => x.id === id);
      const st = statusPromessa(id, cov);
      if (st === 'cumprida') p.grupos.forEach(g => ef[g] += p.peso * 1.5);
      if (st === 'quebrada') GRUPOS.forEach(g => ef[g.id] -= p.peso * (p.grupos.includes(g.id) ? 3 : 1.2));
    }
    return ef;
  }

  // ------------------------------------------------------------ aprovação
  function calcularAlvos() {
    const cov = calcularCobertura();
    const imp = S.impostos;
    const efProm = efeitoPromessas(cov);
    const urb = (S.orcamento.urbano - 1) * 12;   // ruas, lixo, iluminação
    const adm = (S.orcamento.admin - 1) * 6;     // servidores
    const efE = Empresas.efeitos();
    const efL = Licitacoes.efeitos();
    const alvo = {};
    for (const b of BAIRROS) {
      alvo[b.id] = {};
      for (const g of GRUPOS) {
        const pr = PREFS[g.id];
        let v = 50;
        for (const c in pr.cat) v += pr.cat[c] * (cov[b.id][c] - 0.6) * 40;
        v -= pr.iptu * ((imp.iptu[b.id] - 1.0) / 1.0) * 22;
        v -= pr.iss * (imp.iss - 3.0) * 7;
        v -= pr.lixo * ((imp.lixo - 18) / 18) * 8;
        v -= pr.ind * ((imp.iptuInd - 1.5) / 1.5) * 14;
        v -= pr.desemprego * (S.desemprego - 8) * 1.8;
        v += efProm[g.id];
        v += S.humor.global + (S.humor.grupos[g.id] || 0) + (S.humor.bairros[b.id] || 0);
        v += urb + (g.id === 'trab' ? adm : 0);
        v += (efE.grupos[g.id] || 0) + (efE.bairros[b.id] || 0);
        v += (efL.grupos[g.id] || 0) + efL.todos + efL.urbano * 12;
        if (S.caixa < 0) v -= 4 + Math.min(10, -S.caixa / 1e6 * 2); // salários e fornecedores atrasados
        alvo[b.id][g.id] = clamp(v, 0, 100);
      }
    }
    return alvo;
  }

  function aprovBairro(id) {
    const b = bairroById(id);
    let s = 0;
    for (const g of GRUPOS) s += b.comp[g.id] * S.bairros[id].aprov[g.id];
    return s;
  }
  function aprovGrupo(gid) {
    let s = 0, p = 0;
    for (const b of BAIRROS) { const w = S.bairros[b.id].pop * b.comp[gid]; s += w * S.bairros[b.id].aprov[gid]; p += w; }
    return s / p;
  }
  function aprovCidade() {
    let s = 0, p = 0;
    for (const b of BAIRROS) { s += aprovBairro(b.id) * S.bairros[b.id].pop; p += S.bairros[b.id].pop; }
    return s / p;
  }

  // ------------------------------------------------------------- finanças
  function issMedioVizinhos() { return S.rivais.reduce((s, r) => s + r.iss, 0) / S.rivais.length; }

  function calcularFinancas(aplicar) {
    const imp = S.impostos, orc = S.orcamento;
    const pop = popTotal();
    const cov = calcularCobertura();
    const R = {}, D = {};

    // inadimplência sobe com imposto alto e desemprego
    let iptu = 0;
    for (const b of BAIRROS) {
      const inad = clamp(0.12 + (imp.iptu[b.id] - 1) * 0.08 + (S.desemprego - 8) * 0.01, 0.04, 0.45);
      iptu += domicilios(b.id) * BAIRROS.find(x => x.id === b.id).venal * imp.iptu[b.id] / 100 / 12 * (1 - inad);
    }
    R.iptu = iptu;
    R.iptuInd = 420e6 * imp.iptuInd / 100 / 12 * S.industria;
    R.iss = 40e6 * S.servicos * (pop / 25000) * imp.iss / 100;
    R.itbi = 14e6 * imp.itbi / 100 * clamp(1 - (imp.itbi - 2) * 0.15, 0.4, 1.3) * (0.8 + aprovCidade() / 250);
    R.lixo = (pop / 3) * imp.lixo * 0.9;
    R.fpm = pop >= 30564 ? 2.6e6 : 2.15e6;
    R.icms = 3.0e6 * S.industria * (0.6 + 0.4 * S.servicos);
    R.ipva = 0.65e6 * (pop / 25000);
    // FUNDEB: por matrícula atendida
    let matr = 0;
    for (const b of BAIRROS) {
      const p = S.bairros[b.id].pop;
      matr += Math.min(1, cov[b.id].educacao) * p * CATS.educacao.demanda;
      matr += Math.min(1, cov[b.id].creche) * p * CATS.creche.demanda * 1.3;
    }
    R.fundeb = matr * 400;
    const re = Empresas.receitaMensal();
    R.issEmp = re.iss; R.icmsEmp = re.icms; R.iptuEmp = re.iptu;
    R.convenios = Recursos.receitaMes();
    const temHospital = S.lotes.some(l => l.predio === 'hospital');
    R.sus = pop * 17 + (temHospital ? 900e3 : 0);

    // manutenção dos prédios por área
    const manut = { saude: 0, educacao: 0, seguranca: 0, cultura: 0 };
    // prédio de boa qualidade custa menos para manter
    for (const l of S.lotes) if (l.predio && PREDIOS[l.predio]) manut[PREDIOS[l.predio].area] += PREDIOS[l.predio].manut * (2 - (l.qualidade || 1));

    const mods = S.mods || {};
    D.admin = (mods.admin || 2.4e6) * orc.admin;
    D.saude = 1.25e6 * orc.saude + manut.saude;
    D.educacao = 1.6e6 * orc.educacao + manut.educacao;
    D.seguranca = 0.1e6 + manut.seguranca;
    D.urbano = 1.5e6 * (pop / 25000) * orc.urbano;
    D.cultura = 0.08e6 + manut.cultura;
    const dl = Licitacoes.despesas();
    D.saude += dl.saude; D.educacao += dl.educacao;
    D.urbano = Math.max(0, D.urbano - dl.economia);
    D.contratos = dl.urbano + dl.seguranca + dl.cultura;
    D.previdencia = mods.previdencia || 0.95e6;
    D.divida = mods.divida || 0.6e6;

    const receitaTotal = Object.values(R).reduce((a, b) => a + b, 0);
    D.camara = 0.06 * receitaTotal;   // duodécimo da Câmara
    // 13º salário em dezembro
    if (S.mes === 11) D.decimo = 0.5 * (D.admin + 1.25e6 * orc.saude + 1.6e6 * orc.educacao + manut.saude + manut.educacao + manut.seguranca);
    // parcelas de obras
    let obras = 0;
    for (const l of S.lotes) if (l.obra && !l.obra.parada) obras += l.obra.parcela;
    D.obras = obras;

    const despesaTotal = Object.values(D).reduce((a, b) => a + b, 0);
    // base para os mínimos constitucionais (impostos + transferências)
    const base = R.iptu + R.iptuInd + R.iss + R.itbi + R.fpm + R.icms + R.ipva + R.issEmp + R.icmsEmp + R.iptuEmp;
    const out = { R, D, receitaTotal, despesaTotal, saldo: receitaTotal - despesaTotal, base,
                  pctSaude: (D.saude) / base, pctEducacao: (D.educacao) / base };
    if (aplicar) {
      S.anoFiscal.baseCalculo += base;
      S.anoFiscal.saude += D.saude;
      S.anoFiscal.educacao += D.educacao;
    }
    return out;
  }

  // ---------------------------------------------------------- vereadores
  function novoPedido(v) {
    v.pedido = { texto: pick(PEDIDOS_VEREADOR), valor: Math.round(rnd(1.5, 4.5)) * 100e3 };
    v.pedidoEm = S.mesIndex;
  }

  function atenderPedido(vid) {
    const v = S.vereadores.find(x => x.id === vid);
    if (!v || !v.pedido) return;
    S.caixa -= v.pedido.valor;
    v.lealdade = clamp(v.lealdade + 18, 0, 100);
    S.humor.bairros[v.bairro] = (S.humor.bairros[v.bairro] || 0) + 1.5;
    noticia(1, `Ver. ${v.nome} comemora: "${v.pedido.texto}" foi atendido`, '');
    v.pedido = null; v.pedidoEm = S.mesIndex;
    emit('mudou');
  }

  function reuniao(vid) {
    const v = S.vereadores.find(x => x.id === vid);
    if (!v || v.reuniaoMes === S.mesIndex) return false;
    v.reuniaoMes = S.mesIndex;
    const ganho = v.lado === 'opos' ? 3 : 5;
    v.lealdade = clamp(v.lealdade + ganho, 0, 100);
    emit('mudou');
    return ganho;
  }

  // Projeto de lei de impostos
  const CAMPOS_IMPOSTO = {
    'iptu.centro':   { nome: 'IPTU Centro',              min: 0.3, max: 2.5, passo: 0.1, un: '%' },
    'iptu.operaria': { nome: 'IPTU Vila Operária',       min: 0.3, max: 2.5, passo: 0.1, un: '%' },
    'iptu.nobre':    { nome: 'IPTU Jardim Nobre',        min: 0.3, max: 2.5, passo: 0.1, un: '%' },
    'iptu.distrito': { nome: 'IPTU Distrito Industrial', min: 0.3, max: 2.5, passo: 0.1, un: '%' },
    'iptuInd':       { nome: 'IPTU de indústrias',       min: 0.5, max: 3.0, passo: 0.1, un: '%' },
    'iss':           { nome: 'ISS (serviços)',           min: 2.0, max: 5.0, passo: 0.25, un: '%' },
    'itbi':          { nome: 'ITBI (venda de imóveis)',  min: 1.0, max: 4.0, passo: 0.5, un: '%' },
    'lixo':          { nome: 'Taxa de lixo',             min: 0,   max: 40,  passo: 2,   un: 'R$' },
  };
  function lerImposto(campo, imp) {
    imp = imp || S.impostos;
    const [a, b] = campo.split('.');
    return b ? imp[a][b] : imp[a];
  }
  function gravarImposto(campo, valor) {
    const [a, b] = campo.split('.');
    if (b) S.impostos[a][b] = valor; else S.impostos[a] = valor;
  }
  function bairroDoCampo(campo) {
    if (campo.startsWith('iptu.')) return campo.split('.')[1];
    if (campo === 'iptuInd') return 'distrito';
    return null;
  }

  function proximaSessao() {
    const sess = [5, 12, 19, 26];
    for (const d of sess) if (d > S.dia) return { dia: d, mesIndex: S.mesIndex };
    return { dia: 5, mesIndex: S.mesIndex + 1 };
  }

  function enviarProjeto(mudancas) {
    if (S.projeto || !mudancas.length) return false;
    const sess = proximaSessao();
    S.projeto = { mudancas, sessao: sess };
    emit('mudou');
    return sess;
  }

  function preverVoto(v, mudancas) {
    let score = v.lealdade;
    for (const m of mudancas) {
      const rel = (m.para - m.de) / Math.max(0.5, m.de);
      const afeta = bairroDoCampo(m.campo);
      if (rel > 0) score -= 30 * rel * (afeta === v.bairro ? 1.6 : 1) + (v.lado === 'opos' ? 15 : 0);
      else score += 6 + (v.lado === 'opos' ? 6 : 0);
    }
    score += (aprovBairro(v.bairro) - 50) * 0.4;
    return score;
  }

  function votarProjeto() {
    const p = S.projeto;
    const votos = S.vereadores.map(v => {
      const sc = preverVoto(v, p.mudancas) + rnd(-10, 10);
      return { id: v.id, nome: v.nome, partido: v.partido, lado: v.lado, sim: sc >= 50 };
    });
    const sim = votos.filter(v => v.sim).length;
    const aprovado = sim >= 6;
    const resultado = { mudancas: p.mudancas, votos, sim, nao: votos.length - sim, aprovado, vigencias: [] };
    if (aprovado) {
      for (const m of p.mudancas) {
        if (m.para > m.de) {
          // anterioridade anual + noventena: vale no 1º dia do ano seguinte, mas no mínimo 3 meses depois
          const anoSeg = (S.ano + 1 - ANO_INICIAL) * 12;
          const efetivo = Math.max(anoSeg, S.mesIndex + 3);
          S.leisPendentes.push({ campo: m.campo, valor: m.para, mesIndex: efetivo });
          S.termo.aumentou = true;
          resultado.vigencias.push({ campo: m.campo, mesIndex: efetivo });
        } else {
          gravarImposto(m.campo, m.para);
          resultado.vigencias.push({ campo: m.campo, mesIndex: S.mesIndex });
        }
      }
      const sobe = p.mudancas.some(m => m.para > m.de);
      noticia(4, sobe ? 'Câmara aprova aumento de impostos por ' + sim + ' a ' + (11 - sim) : 'Câmara aprova redução de impostos por ' + sim + ' a ' + (11 - sim),
        sobe ? 'Oposição promete lembrar disso na eleição' : 'Comerciantes comemoram na Rua Direita');
      if (sobe) { S.candidato.forca = clamp(S.candidato.forca + 3, 0, 95); }
    } else {
      noticia(4, `Câmara rejeita projeto do prefeito: ${sim} a ${11 - sim}`, 'Derrota expõe a fragilidade da base aliada');
      S.vereadores.forEach(v => { if (v.lado === 'base') v.lealdade = clamp(v.lealdade - 2, 0, 100); });
    }
    S.projeto = null;
    emit('votacao', resultado);
    emit('mudou');
  }

  // --------------------------------------------------------------- obras
  // lance = proposta vencedora da licitação (ver licitacoes.js)
  function construir(loteId, tipo, lance, naoMenor) {
    const l = S.lotes.find(x => x.id === loteId);
    const t = PREDIOS[tipo];
    if (!l || l.predio || l.obra || l.empresa || !t) return false;
    lance = lance || { construtora: 'Prefeitura', perfil: 'media', valor: t.custo + (l.tipo === 'particular' ? l.desapropriacao : 0), meses: t.meses, qualidade: 1, riscos: null };
    const custo = lance.valor;
    l.obra = { tipo, mesesTotal: lance.meses, mesesRest: lance.meses, parcela: custo / lance.meses, custo, construtora: lance.construtora, perfil: lance.perfil,
               qualidade: lance.qualidade, riscos: lance.riscos, padrinho: lance.padrinho || null, eventos: [], atrasos: 0, diaInicio: S.mesIndex * 30 + S.dia };
    if (lance.padrinho) { const v = S.vereadores.find(x => x.id === lance.padrinho.id); if (v) v.lealdade = clamp(v.lealdade + 15, 0, 100); }
    if (naoMenor) { S.candidato.forca = clamp(S.candidato.forca + 1, 0, 95); noticia(2, 'Prefeitura não escolhe a proposta mais barata em licitação', 'Oposição pede explicações'); }
    Recursos.usarEmObra(l);
    noticia(2, `${lance.construtora} vence licitação: ${t.nome} no bairro ${bairroById(l.bairro).nome}`, `Contrato de ${fmtDinheiro(custo)} · ${lance.meses} meses`);
    emit('obra', l);
    emit('mudou');
    return true;
  }

  function progressoObra(l) {
    if (!l.obra) return 0;
    const feitos = l.obra.mesesTotal - l.obra.mesesRest;
    const frac = l.obra.parada ? 0 : (S.dia - 1) / diasNoMes(S.mes, S.ano);
    return clamp((feitos + frac) / l.obra.mesesTotal, 0, 1);
  }

  // --------------------------------------------------------------- tempo
  function duracaoDia() { return S.segDia || MES_SEGUNDOS / diasNoMes(S.mes, S.ano); }
  // hora do dia: o dia vai das 6h às 24h; dormir pula para a manhã seguinte
  function horaDoDia() { return S ? 6 + Math.min(1, S.tempoDia / duracaoDia()) * 18 : 12; }
  function dormir() {
    if (!S || S.fimDeJogo || S.pausaForcada) return;
    S.tempoDia = 0;
    proximoDia();
  }

  function avancar(segundos) {
    if (!S || S.fimDeJogo) return;
    S.tempoDia += segundos;
    let guard = 0;
    while (S.tempoDia >= duracaoDia() && guard++ < 40) {
      S.tempoDia -= duracaoDia();
      proximoDia();
      if (S.pausaForcada) { S.tempoDia = 0; break; }
    }
  }

  function proximoDia() {
    // aprovação caminha em direção ao alvo
    const alvo = calcularAlvos();
    for (const b of BAIRROS) for (const g of GRUPOS) {
      const a = S.bairros[b.id].aprov;
      a[g.id] += (alvo[b.id][g.id] - a[g.id]) * 0.035;
    }
    // sessão da Câmara
    if (S.projeto && S.projeto.sessao.mesIndex === S.mesIndex && S.projeto.sessao.dia === S.dia) votarProjeto();
    Empresas.votarPauta();
    Empresas.dia();

    S.dia++;
    if (S.dia > diasNoMes(S.mes, S.ano)) { fecharMes(); }
    // eleição: primeiro domingo de outubro do 2º ano do mandato
    if (!S.eleicaoFeita && S.mes === 9 && S.ano === S.inicioMandato + 1 && S.dia === 6) eleicao();
    emit('dia');
    salvar();
  }

  function pularMes() {
    // processa os dias restantes do mês de uma vez
    const mesAtual = S.mesIndex;
    let guard = 0;
    while (S.mesIndex === mesAtual && !S.fimDeJogo && !S.pausaForcada && guard++ < 40) proximoDia();
    S.tempoDia = 0;
  }

  // ------------------------------------------------------- fechamento mês
  function fecharMes() {
    const mesFechado = S.mes, anoFechado = S.ano;
    const fin = calcularFinancas(true);
    S.caixa += fin.saldo;
    S.ultimoFinanceiro = fin;
    Recursos.consumir();
    if (S.caixa < 0) {
      S.termo.mesNegativo = true;
      noticia(5, 'Caixa da prefeitura fica no vermelho', 'Fornecedores e servidores ameaçam greve');
      S.humor.global -= 3;
    }

    // obras
    for (const l of S.lotes) {
      if (!l.obra) continue;
      Licitacoes.obraMes(l);
      if (l.obra.parada) continue;
      l.obra.mesesRest--;
      if (l.obra.mesesRest <= 0) {
        const tipo = l.obra.tipo;
        l.qualidade = l.obra.qualidade || 1;
        l.predio = tipo; l.obra = null;
        S.termo.construidos[tipo] = (S.termo.construidos[tipo] || 0) + 1;
        S.humor.bairros[l.bairro] = (S.humor.bairros[l.bairro] || 0) + 3;
        noticia(6, `Inaugurado: ${PREDIOS[tipo].nome} no bairro ${bairroById(l.bairro).nome}`, 'Prefeito corta a fita sob aplausos');
        emit('inauguracao', l);
      }
    }

    // dezembro: prestação de contas ao Tribunal de Contas
    if (mesFechado === 11) {
      const a = S.anoFiscal;
      const ps = a.saude / a.baseCalculo, pe = a.educacao / a.baseCalculo;
      if (ps < 0.15 || pe < 0.25) {
        S.humor.global -= 8;
        S.candidato.forca = clamp(S.candidato.forca + 8, 0, 95);
        S.contasRejeitadasAte = S.mesIndex + 13;
        noticia(9, 'Tribunal de Contas rejeita as contas do prefeito',
          `Saúde: ${(ps * 100).toFixed(1)}% (mínimo 15%) · Educação: ${(pe * 100).toFixed(1)}% (mínimo 25%)`);
      } else {
        noticia(3, 'Tribunal de Contas aprova as contas de ' + anoFechado, `Saúde ${(ps * 100).toFixed(1)}% · Educação ${(pe * 100).toFixed(1)}%`);
      }
      S.anoFiscal = { baseCalculo: 0, saude: 0, educacao: 0 };
      noticia(2, '13º salário dos servidores pesa no caixa de dezembro', '');
    }

    // avança calendário
    S.mes++; S.dia = 1; S.mesIndex++;
    if (S.mes > 11) { S.mes = 0; S.ano++; }

    // leis que entram em vigor
    S.leisPendentes = S.leisPendentes.filter(lp => {
      if (lp.mesIndex <= S.mesIndex) {
        gravarImposto(lp.campo, lp.valor);
        noticia(3, `Entra em vigor: ${CAMPOS_IMPOSTO[lp.campo].nome} passa a ${fmtImposto(lp.campo, lp.valor)}`, 'Contribuintes reclamam do carnê');
        return false;
      }
      return true;
    });

    Empresas.mes();
    Licitacoes.mes();
    Recursos.mes();
    const popAntes = popTotal();
    economia();
    crescimentoNatural(popTotal() - popAntes);
    vizinhos();
    camara();
    oposicao();
    eventosCalendario();

    // humor esfria
    S.humor.global *= 0.7;
    for (const k in S.humor.grupos) S.humor.grupos[k] *= 0.7;
    for (const k in S.humor.bairros) S.humor.bairros[k] *= 0.7;

    const aprov = aprovCidade();
    S.historico.push({ mesIndex: S.mesIndex - 1, mes: mesFechado, ano: anoFechado, caixa: S.caixa, saldo: fin.saldo, aprov, pop: popTotal(), desemprego: S.desemprego });
    gerarJornal(mesFechado, anoFechado, fin, aprov);
    S.eventosMes = [];
    salvar();
    emit('mes', S.jornais[S.jornais.length - 1]);
  }

  // empregos públicos criados por prédios novos (os do começo já estão na taxa inicial)
  const FUNC_INICIAL = LOTES_INICIAIS.reduce((s, l) => s + (l.ocupado && PREDIOS[l.ocupado] ? PREDIOS[l.ocupado].func : 0), 0);
  function servidoresNovos() {
    const f = S.lotes.reduce((s, l) => s + (l.predio && PREDIOS[l.predio] ? PREDIOS[l.predio].func : 0), 0) - FUNC_INICIAL;
    return f / (popTotal() * 0.48) * 100 * 0.7;
  }

  // ------------------------------------------- estimativa de impacto
  // muda o estado de mentira, mede, e desfaz: assim toda ação mostra o efeito antes
  function alvoMedio(alvo) {
    let s = 0, p = 0;
    for (const b of BAIRROS) { const comp = b.comp; let ab = 0; for (const g of GRUPOS) ab += comp[g.id] * alvo[b.id][g.id]; s += ab * S.bairros[b.id].pop; p += S.bairros[b.id].pop; }
    return s / p;
  }
  function estimar(mudar) {
    const a0 = calcularAlvos(), f0 = calcularFinancas(false), c0 = calcularCobertura();
    const desfazer = mudar();
    const a1 = calcularAlvos(), f1 = calcularFinancas(false), c1 = calcularCobertura();
    desfazer();
    const grupos = {}, bairros = {};
    for (const g of GRUPOS) { let d = 0, p = 0; for (const b of BAIRROS) { const w = S.bairros[b.id].pop * b.comp[g.id]; d += (a1[b.id][g.id] - a0[b.id][g.id]) * w; p += w; } grupos[g.id] = d / p; }
    for (const b of BAIRROS) { let d = 0; for (const g of GRUPOS) d += b.comp[g.id] * (a1[b.id][g.id] - a0[b.id][g.id]); bairros[b.id] = d; }
    return { aprov: alvoMedio(a1) - alvoMedio(a0), grupos, bairros, saldo: f1.saldo - f0.saldo, receita: f1.receitaTotal - f0.receitaTotal,
             despesa: f1.despesaTotal - f0.despesaTotal, cov0: c0, cov1: c1, fin0: f0, fin1: f1 };
  }

  function economia() {
    const cov = calcularCobertura();
    const aprov = aprovCidade();
    const difIss = S.impostos.iss - issMedioVizinhos();
    const lazer = coberturaCidade(cov, 'lazer');
    const educ = coberturaCidade(cov, 'educacao');
    let incDistrito = cov.distrito.incendio;

    let ds = 0.003 * (aprov - 50) / 10 - 0.012 * difIss + 0.01 * (lazer - 0.5) + rnd(-0.003, 0.003);
    if (copaAno(S.ano) && (S.mes === 5 || S.mes === 6)) ds += 0.01;
    ds += Math.min(0.012, Empresas.turismoTotal() * 0.002);
    S.servicos = clamp(S.servicos * (1 + ds), 0.5, 2.2);

    let di = -0.012 * (S.impostos.iptuInd - 1.5) - 0.006 * difIss + 0.008 * (incDistrito - 0.5) + 0.004 * (educ - 0.6) + rnd(-0.003, 0.003);
    S.industria = clamp(S.industria * (1 + di), 0.5, 2.2);

    const negociosEmp = (S.negocios || []).length * 6 / (popTotal() * 0.48) * 100;
    S.desemprego = clamp(((S.mods && S.mods.desemprego) || 9) - negociosEmp - (S.industria - 1) * 25 - (S.servicos - 1) * 15 - Empresas.reducaoDesemprego() - Licitacoes.reducaoDesemprego() - servidoresNovos() + rnd(-0.2, 0.2), 2.5, 25);

    let covMed = 0; for (const c in CATS) covMed += coberturaCidade(cov, c); covMed /= Object.keys(CATS).length;
    const g = 0.0012 + 0.004 * (covMed - 0.6) - 0.0008 * (S.desemprego - 8) + 0.0005 * (aprov - 50) / 10;
    for (const b of BAIRROS) {
      const gb = g + 0.001 * (aprovBairro(b.id) - 50) / 10;
      S.bairros[b.id].pop = Math.round(S.bairros[b.id].pop * (1 + gb));
    }
    // migração de trabalhadores atraídos pelas empresas
    const mig = Empresas.migracao();
    if (mig > 0) { const peso = { operaria: .5, centro: .25, distrito: .15, nobre: .1 }; for (const b of BAIRROS) S.bairros[b.id].pop += Math.round(mig * peso[b.id]); }
  }

  // ------------------------------------------------ crescimento natural
  // casas novas surgem com o aumento da população; pequenos negócios
  // abrem quando a economia vai bem e fecham quando vai mal
  function sortearBairro(pesos) {
    let r = Math.random(), tot = 0;
    for (const k in pesos) tot += pesos[k];
    r *= tot;
    for (const k in pesos) { r -= pesos[k]; if (r <= 0) return k; }
    return 'operaria';
  }
  let uidCres = Date.now() % 100000;
  function crescimentoNatural(delta) {
    if (!S.crescimento) S.crescimento = [];
    if (!S.negocios) S.negocios = [];
    let novas = Math.floor(Math.max(0, delta) / 45);
    if (Math.random() < (Math.max(0, delta) % 45) / 45) novas++;
    novas = Math.min(novas, 4);
    for (let i = 0; i < novas; i++) {
      const bairro = sortearBairro({ operaria: .45, centro: .2, nobre: .15, distrito: .2 });
      const tipo = bairro === 'centro' ? 'sobrado' : bairro === 'nobre' && Math.random() < 0.5 ? 'mansao' : 'casa';
      S.crescimento.push({ id: 'n' + (uidCres++), tipo, bairro, x: null, y: null, seed: Math.floor(Math.random() * 1e6) });
    }
    if (novas) noticia(1, novas === 1 ? 'Uma casa nova fica pronta na cidade' : `${novas} casas novas ficam prontas na cidade`, 'Loteamentos crescem com a chegada de moradores');
    // pequenos negócios
    const clima = (aprovCidade() - 50) / 50 + (S.servicos - 1) * 3 - (S.impostos.iss - issMedioVizinhos()) * 0.5 - (S.desemprego - 8) * 0.03;
    if (Math.random() < 0.3 + clima * 0.3) {
      const usados = new Set(S.negocios.map(n => n.nome));
      const nome = pick(NEGOCIOS.filter(n => !usados.has(n)).concat(['Comércio Novo'])) ;
      const bairro = sortearBairro({ centro: .45, operaria: .35, nobre: .1, distrito: .1 });
      const id = 'n' + (uidCres++);
      S.negocios.push({ id, nome, bairro, desde: S.mesIndex });
      S.crescimento.push({ id, tipo: 'loja', bairro, x: null, y: null, seed: Math.floor(Math.random() * 1e6) });
      S.servicos = clamp(S.servicos * 1.004, 0.5, 2.2);
      noticia(2, `Abre ${nome} no bairro ${bairroById(bairro).nome}`, 'Comércio local cria novos empregos');
    } else if (S.negocios.length && Math.random() < 0.12 - clima * 0.25) {
      const n = pick(S.negocios);
      S.negocios = S.negocios.filter(x => x !== n);
      S.crescimento = S.crescimento.filter(x => x.id !== n.id);
      S.servicos = clamp(S.servicos * 0.997, 0.5, 2.2);
      noticia(3, `${n.nome} fecha as portas no bairro ${bairroById(n.bairro).nome}`, 'Dono culpa o movimento fraco e os impostos');
    }
    emit('crescimento');
  }

  function vizinhos() {
    for (const r of S.rivais) {
      r.aprov = clamp(r.aprov + rnd(-3, 3), 20, 85);
      r.pop = Math.round(r.pop * (1 + r.cresc + rnd(-0.001, 0.001)));
      if (Math.random() < 0.04) {
        const novo = clamp(r.iss + (Math.random() < 0.5 ? -0.25 : 0.25), 2, 5);
        if (novo !== r.iss) {
          noticia(2, `${r.nome} ${novo < r.iss ? 'reduz' : 'aumenta'} o ISS para ${novo.toFixed(2).replace('.', ',')}%`,
            novo < r.iss ? 'Comerciantes daqui olham com inveja' : 'Pode ser uma chance para o nosso comércio');
          r.iss = novo;
        }
      }
    }
    if (Math.random() < 0.12) {
      const r = pick(S.rivais);
      const manchetes = [
        `${r.nome} anuncia nova fábrica com 300 empregos`,
        `${r.nome} inaugura hospital-dia`,
        `Show de dupla sertaneja lota ${r.nome}`,
        `Prefeito de ${r.nome} é investigado por obra superfaturada`,
        `${r.nome} asfalta acesso à rodovia`,
      ];
      noticia(1, pick(manchetes), 'Região');
    }
  }

  function camara() {
    const aprov = aprovCidade();
    for (const v of S.vereadores) {
      const baseLado = v.lado === 'base' ? 72 : v.lado === 'indep' ? 50 : 22;
      v.lealdade += (baseLado - v.lealdade) * 0.06 + (aprov - 50) * 0.04;
      v.lealdade = clamp(v.lealdade, 0, 100);
      if (!v.pedido && S.mesIndex - v.pedidoEm >= 3 && Math.random() < 0.5) novoPedido(v);
    }
  }

  function oposicao() {
    const aprov = aprovCidade();
    const quebradas = S.promessas.filter(id => statusPromessa(id) === 'quebrada').length;
    let d = 0.6 + (50 - aprov) * 0.05 + quebradas * 0.5 + (S.caixa < 0 ? 1.5 : 0);
    const mesesAteEleicao = (S.inicioMandato + 1 - S.ano) * 12 + (9 - S.mes);
    if (mesesAteEleicao <= 6) d *= 1.5;
    S.candidato.forca = clamp(S.candidato.forca + d, 10, 95);
    if (Math.random() < 0.35) noticia(1, `${S.candidato.nome} (${S.candidato.partido}): "${S.candidato.bordao}"`, 'Oposição');
  }

  function copaAno(ano) { return (ano - 2030) % 4 === 0; }

  function eventosCalendario() {
    // S.mes já é o mês que começa
    const m = S.mes;
    if (m === 1) noticia(2, 'Carnaval movimenta bares do Centro', '');
    if (m === 5) {
      const comPraca = new Set(S.lotes.filter(l => l.predio === 'praca' || l.predio === 'cultura').map(l => l.bairro));
      for (const b of BAIRROS) S.humor.bairros[b.id] = (S.humor.bairros[b.id] || 0) + (comPraca.has(b.id) ? 3 : 0.5);
      noticia(3, 'Arraiá da cidade começa neste mês', comPraca.size ? 'Quadrilhas nas praças de ' + [...comPraca].map(id => bairroById(id).nome).join(', ') : 'Bairros sem praça reclamam da falta de espaço');
      if (copaAno(S.ano)) {
        S.humor.grupos.jovens = (S.humor.grupos.jovens || 0) + 3;
        S.humor.grupos.trab = (S.humor.grupos.trab || 0) + 2;
        noticia(4, 'Começa a Copa do Mundo: ruas pintadas de verde e amarelo', 'Repartições terão expediente reduzido em dias de jogo do Brasil');
      }
    }
    if (m === 7 && copaAno(S.ano)) {
      if (Math.random() < 0.22) { S.humor.global += 6; noticia(6, 'É CAMPEÃO! Cidade comemora o título mundial', 'Buzinaço tomou a avenida até de madrugada'); }
      else { S.humor.global -= 1.5; noticia(3, 'Brasil cai na Copa e cidade fica de luto', 'Telão da praça foi desligado no segundo tempo'); }
    }
    if (m === 7) { S.humor.global += 1; noticia(2, `Aniversário de ${S.cidade}: desfile cívico no dia 15`, ''); }
    if (m === 10) noticia(3, 'Servidores perguntam: vai ter 13º em dia?', 'Folha de dezembro costuma pesar o dobro');
    if (m === 11) noticia(2, 'Comércio aposta no Natal para fechar o ano', '');
  }

  // --------------------------------------------------------------- eleição
  function promessaPontos() {
    let pts = 0;
    const detalhe = [];
    for (const id of S.promessas) {
      const p = PROMESSAS.find(x => x.id === id);
      let st = statusPromessa(id);
      if (st === 'mantida') st = 'cumprida';
      if (st === 'andamento') st = 'quebrada';
      pts += st === 'cumprida' ? p.peso * 1.5 : -p.peso * 2.5;
      detalhe.push({ id, titulo: p.titulo, status: st });
    }
    return { pts, detalhe };
  }

  function intencaoVoto(final) {
    const pp = final ? promessaPontos().pts : promessaPontosParcial();
    const porBairro = {};
    let s = 0, p = 0;
    for (const b of BAIRROS) {
      const v = clamp(50 + (aprovBairro(b.id) - 50) * 0.85 + pp + 2 - (S.candidato.forca - 40) * 0.25, 5, 95);
      porBairro[b.id] = v;
      s += v * S.bairros[b.id].pop; p += S.bairros[b.id].pop;
    }
    return { total: s / p, porBairro };
  }
  function promessaPontosParcial() {
    let pts = 0;
    for (const id of S.promessas) {
      const p = PROMESSAS.find(x => x.id === id);
      const st = statusPromessa(id);
      if (st === 'cumprida') pts += p.peso * 1.5;
      if (st === 'quebrada') pts -= p.peso * 2.5;
    }
    return pts;
  }

  function pesquisa() {
    const iv = intencaoVoto(false);
    const ruido = rnd(-2.5, 2.5);
    const voce = clamp(iv.total + ruido, 3, 97);
    return { voce, rival: 100 - voce, margem: 3 };
  }

  function eleicao() {
    S.eleicaoFeita = true;
    const iv = intencaoVoto(true);
    const prom = promessaPontos();
    const total = clamp(iv.total + rnd(-1.5, 1.5), 1, 99);
    const venceu = total > 50;
    const res = { venceu, total, rival: 100 - total, porBairro: iv.porBairro, promessas: prom.detalhe,
                  candidato: { ...S.candidato }, ano: S.ano, mandato: S.mandato };
    S.ultimaEleicao = res;
    if (venceu) {
      noticia(10, `${S.prefeito} é reeleito com ${total.toFixed(1).replace('.', ',')}% dos votos`, `${S.candidato.nome} reconhece a derrota`);
    } else {
      noticia(10, `${S.candidato.nome} vence a eleição com ${(100 - total).toFixed(1).replace('.', ',')}%`, `Fim da era ${S.prefeito}`);
      S.fimDeJogo = true;
    }
    S.pausaForcada = true;
    emit('eleicao', res);
  }

  // chamado pela interface após escolher as novas promessas
  function novoMandato(promessas) {
    S.mandato++;
    S.inicioMandato += 2;
    const idx = S.mandato - 1;
    S.candidato = { ...CANDIDATOS_RIVAIS[idx % CANDIDATOS_RIVAIS.length], forca: 30 + Math.min(20, S.mandato * 3) };
    S.humor.global += 6;
    iniciarMandato(promessas);
    S.pausaForcada = false;
    salvar();
    emit('mudou');
  }

  // --------------------------------------------------------------- jornal
  function gerarJornal(mes, ano, fin, aprov) {
    const ev = S.eventosMes.slice().sort((a, b) => b.prioridade - a.prioridade);
    const ant = S.historico.length > 1 ? S.historico[S.historico.length - 2].aprov : aprov;
    const cov = calcularCobertura();
    // manchetes automáticas
    const piores = Object.keys(CATS).map(c => ({ c, v: coberturaCidade(cov, c) })).sort((a, b) => a.v - b.v);
    const pior = piores[Math.random() < 0.6 ? 0 : 1];
    const recl = {
      saude: ['Filas na UBS chegam a 6 horas', 'Pacientes viajam a Pedra Grande do Sul para fazer exames', 'Falta médico nos postos de saúde'],
      educacao: ['Faltam vagas nas escolas municipais', 'Salas de aula com 40 alunos', 'Pais acampam na porta da escola por uma vaga'],
      creche: ['Fila da creche passa de mil crianças', 'Mães sem creche deixam o emprego', 'Creche: Defensoria cobra vagas da prefeitura'],
      seguranca: ['Moradores pedem mais policiamento', 'Furtos de bicicleta assustam o comércio', 'Bairros fazem vaquinha para câmeras de segurança'],
      incendio: ['Incêndio espera 40 minutos por bombeiros de Cerrado Alto', 'Indústrias cobram posto de bombeiros na cidade', 'Galpão queima inteiro à espera de socorro'],
      lazer: ['Jovens reclamam: "não tem nada pra fazer aqui"', 'Fim de semana: famílias vão passear na cidade vizinha', 'Praças abandonadas viram ponto de lixo'],
    };
    if (Math.abs(aprov - ant) >= 2) ev.push({ prioridade: 3, texto: `Aprovação do prefeito ${aprov > ant ? 'sobe' : 'cai'} para ${Math.round(aprov)}%`, sub: 'Levantamento do Correio' });
    ev.push({ prioridade: 1.5, texto: recl[pior.c][Math.floor(Math.random() * recl[pior.c].length)], sub: 'Ouvidoria' });
    ev.push({ prioridade: 1, texto: `Desemprego na cidade está em ${S.desemprego.toFixed(1).replace('.', ',')}%`, sub: 'Economia' });
    ev.sort((a, b) => b.prioridade - a.prioridade);

    const mesesAteEleicao = (S.inicioMandato + 1 - S.ano) * 12 + (9 - S.mes);
    const j = {
      edicao: S.jornais.length + 1, mes, ano,
      manchete: ev[0], outras: ev.slice(1, 5),
      financas: { receita: fin.receitaTotal, despesa: fin.despesaTotal, saldo: fin.saldo, caixa: S.caixa },
      aprov, pesquisa: (!S.eleicaoFeita && mesesAteEleicao >= 0 && mesesAteEleicao <= 9) ? pesquisa() : null,
      mesesAteEleicao,
    };
    S.jornais.push(j);
    if (S.jornais.length > 36) S.jornais.shift();
  }

  // ------------------------------------------------------------ ouvidoria
  // o que pesa (para o bem ou para o mal) na opinião de um grupo num bairro
  function fatoresCelula(bid, gid, cov) {
    const pr = PREFS[gid], f = [];
    for (const c in pr.cat) f.push({ k: 'cat:' + c, v: pr.cat[c] * (cov[bid][c] - 0.6) * 40 });
    f.push({ k: 'iptu', v: -pr.iptu * (S.impostos.iptu[bid] - 1) * 22 });
    f.push({ k: 'iss', v: -pr.iss * (S.impostos.iss - 3) * 7 });
    f.push({ k: 'lixo', v: -pr.lixo * (S.impostos.lixo - 18) / 18 * 8 });
    f.push({ k: 'emprego', v: -pr.desemprego * (S.desemprego - 8) * 1.8 });
    f.push({ k: 'urbano', v: (S.orcamento.urbano - 1) * 12 + Licitacoes.efeitos().urbano * 12 });
    if (S.caixa < 0) f.push({ k: 'atraso', v: -(4 + Math.min(10, -S.caixa / 1e6 * 2)) });
    const pol = Empresas.poluicaoBairro(bid);
    if (pol) f.push({ k: 'poluicao', v: -pol * 3 });
    return f;
  }

  // resumo para a Ouvidoria: as maiores necessidades da cidade, ponderadas pela população
  function resumoNecessidades() {
    const cov = calcularCobertura();
    const agg = {};
    for (const b of BAIRROS) for (const g of GRUPOS) {
      const peso = S.bairros[b.id].pop * b.comp[g.id];
      if (!peso) continue;
      for (const f of fatoresCelula(b.id, g.id, cov)) {
        const a = agg[f.k] = agg[f.k] || { k: f.k, neg: 0, pos: 0, bairros: {}, grupos: {} };
        if (f.v < 0) { a.neg += -f.v * peso; a.bairros[b.id] = (a.bairros[b.id] || 0) - f.v * peso; a.grupos[g.id] = (a.grupos[g.id] || 0) - f.v * peso; }
        else a.pos += f.v * peso;
      }
    }
    const lista = Object.values(agg);
    const totalNeg = lista.reduce((s, a) => s + a.neg, 0) || 1;
    const totalPos = lista.reduce((s, a) => s + a.pos, 0) || 1;
    const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]);
    const problemas = lista.filter(a => a.neg / totalNeg > 0.04).sort((a, b) => b.neg - a.neg).slice(0, 5)
      .map(a => ({ k: a.k, peso: a.neg / totalNeg, bairros: top(a.bairros), grupos: top(a.grupos) }));
    const elogios = lista.filter(a => a.pos / totalPos > 0.08).sort((a, b) => b.pos - a.pos).slice(0, 3).map(a => ({ k: a.k, peso: a.pos / totalPos }));
    return { problemas, elogios, cov };
  }
  function ouvirTodos() {
    let n = 0;
    for (const m of S.ouvidoria) if (!m.ouvida) { m.ouvida = true; const a = S.bairros[m.bairro].aprov; a[m.grupo] = clamp(a[m.grupo] + 0.4, 0, 100); n++; }
    emit('mudou');
    return n;
  }

  function vozDoPovo() {
    const cov = calcularCobertura();
    // bairro sorteado pelo tamanho
    const total = popTotal();
    let r = Math.random() * total, b = BAIRROS[0];
    for (const x of BAIRROS) { r -= S.bairros[x.id].pop; if (r <= 0) { b = x; break; } }
    let r2 = Math.random(), g = GRUPOS[0];
    for (const x of GRUPOS) { r2 -= b.comp[x.id]; if (r2 <= 0) { g = x; break; } }
    const aprov = S.bairros[b.id].aprov[g.id];
    const fatores = fatoresCelula(b.id, g.id, cov);
    fatores.sort((a, c) => a.v - c.v);
    const positivo = aprov > 62 && Math.random() < 0.6;
    const f = positivo ? fatores[fatores.length - 1] : fatores[0];
    const T = positivo ? FRASES_BOAS : FRASES_RUINS;
    let texto = (T[f.k] || T.geral);
    if (Array.isArray(texto)) texto = pick(texto);
    texto = texto.replace('{bairro}', b.nome).replace('{rival}', pick(S.rivais).nome);
    const msg = { id: Date.now() + Math.random(), nome: pick(NOMES), bairro: b.id, grupo: g.id, texto, positivo, ouvida: false, data: `${S.dia}/${S.mes + 1}/${S.ano}` };
    S.ouvidoria.unshift(msg);
    if (S.ouvidoria.length > 30) S.ouvidoria.pop();
    return msg;
  }

  function ouvir(msg) {
    if (msg.ouvida) return;
    msg.ouvida = true;
    const a = S.bairros[msg.bairro].aprov;
    a[msg.grupo] = clamp(a[msg.grupo] + 0.6, 0, 100);
    emit('mudou');
  }

  const FRASES_RUINS = {
    'cat:saude': ['Esperei 6 horas na UBS e voltei pra casa sem consulta.', 'Pra fazer exame tem que ir até Pedra Grande do Sul!', 'Minha mãe precisa de cardiologista e a fila é de 8 meses.'],
    'cat:educacao': ['Meu filho estuda em sala com 40 alunos.', 'Não tem vaga na escola perto de casa no {bairro}.'],
    'cat:creche': ['Meu filho está na fila da creche faz um ano.', 'Não consigo trabalhar porque não tenho onde deixar a criança.', 'Creche no {bairro}? Só no papel.'],
    'cat:seguranca': ['Roubaram minha bicicleta de novo, na frente de casa.', 'À noite ninguém sai na rua aqui no {bairro}.', 'Cadê a ronda da Guarda Municipal?'],
    'cat:incendio': ['Se pegar fogo aqui, o bombeiro vem de Cerrado Alto. Absurdo!', 'O galpão do vizinho queimou inteiro esperando o caminhão.'],
    'cat:lazer': ['Não tem uma praça decente no {bairro}.', 'A molecada não tem nada pra fazer além de ficar na rua.', 'Fim de semana todo mundo vai passear em {rival}.'],
    'iptu': ['O carnê do IPTU veio um absurdo esse ano!', 'Pago IPTU de mansão pra morar em rua sem asfalto.'],
    'iss': ['Com esse ISS vou abrir a empresa em {rival}.', 'O ISS daqui é o mais caro da região!'],
    'lixo': ['Taxa de lixo cara e o caminhão passa uma vez por semana.'],
    'emprego': ['Estou desempregado há meses, prefeito.', 'Meu filho terminou o curso e não acha emprego aqui.', 'Todo mundo está indo trabalhar em {rival}.'],
    'atraso': ['Sou servidor e meu salário atrasou!', 'A prefeitura não pagou meu serviço até hoje.'],
    'poluicao': ['O cheiro que vem da fábrica é insuportável!', 'Minha roupa no varal fica cheia de fuligem.', 'Meu neto vive com tosse por causa da fumaça.'],
    geral: ['Prefeito, olha pelo {bairro}!'],
  };
  const FRASES_BOAS = {
    'cat:saude': ['Fui super bem atendido no posto de saúde!', 'Agora tem médico todo dia aqui no {bairro}.'],
    'cat:educacao': ['A escola do meu filho melhorou muito.'],
    'cat:creche': ['Consegui vaga na creche! Voltei a trabalhar.'],
    'cat:seguranca': ['A Guarda passa toda noite aqui na rua. Me sinto segura.'],
    'cat:incendio': ['Bombeiro na cidade, finalmente!'],
    'cat:lazer': ['A praça do {bairro} vive cheia no fim de semana!', 'Adorei a programação cultural.'],
    'iptu': ['O IPTU esse ano veio justo.'],
    'iss': ['Com esse ISS dá pra crescer o negócio aqui mesmo.'],
    'lixo': ['A coleta de lixo está funcionando bem.'],
    'emprego': ['Arrumei emprego aqui mesmo na cidade!'],
    geral: ['Estou gostando da gestão, prefeito!'],
  };

  // --------------------------------------------------------------- salvar
  // vários jogos salvos: um índice com o resumo de cada um + um registro por jogo
  const CHAVE_ANTIGA = 'prefeito8bit_save_v1', INDICE = 'prefeito_saves_v2', PREFIXO = 'prefeito_save_';
  function lerIndice() { try { return JSON.parse(localStorage.getItem(INDICE) || '[]'); } catch (e) { return []; } }
  function gravarIndice(l) { try { localStorage.setItem(INDICE, JSON.stringify(l)); } catch (e) {} }
  function resumo(o, aprov) {
    return { id: o.saveId, cidade: o.cidade, prefeito: o.prefeito, mes: o.mes, ano: o.ano, mandato: o.mandato,
             dificuldade: o.dificuldade || 'medio', ritmo: o.ritmo || null, aprov: aprov != null ? Math.round(aprov) : null,
             caixa: o.caixa, fim: !!o.fimDeJogo, atualizado: Date.now() };
  }
  function migrar() {
    try {
      const velho = localStorage.getItem(CHAVE_ANTIGA);
      if (!velho) return;
      const o = JSON.parse(velho);
      o.saveId = o.saveId || 's' + Date.now().toString(36);
      o.dificuldade = o.dificuldade || 'medio';
      localStorage.setItem(PREFIXO + o.saveId, JSON.stringify(o));
      gravarIndice([resumo(o)].concat(lerIndice()));
      localStorage.removeItem(CHAVE_ANTIGA);
    } catch (e) {}
  }
  function salvar() {
    if (!S || !S.saveId) return;
    try {
      localStorage.setItem(PREFIXO + S.saveId, JSON.stringify(S));
      gravarIndice([resumo(S, aprovCidade())].concat(lerIndice().filter(x => x.id !== S.saveId)));
    } catch (e) { /* sem armazenamento */ }
  }
  function listarSaves() { migrar(); return lerIndice(); }
  function carregar(id) {
    try {
      const o = JSON.parse(localStorage.getItem(PREFIXO + id) || 'null');
      if (!o || o.fimDeJogo) return false;
      S = o; S.pausaForcada = false;
      if (!S.crescimento) S.crescimento = [];
      if (!S.negocios) S.negocios = [];
      Empresas.garantirEstado(); Licitacoes.garantir(); Recursos.garantir();
      emit('inicio');
      return true;
    } catch (e) { return false; }
  }
  function apagarSave(id) {
    id = id || (S && S.saveId);
    try { localStorage.removeItem(PREFIXO + id); gravarIndice(lerIndice().filter(x => x.id !== id)); } catch (e) {}
  }

  // ------------------------------------------------------------ formatação
  function fmtDinheiro(v) {
    const neg = v < 0; v = Math.abs(v);
    let s;
    if (v >= 1e6) s = 'R$ ' + (v / 1e6).toFixed(v >= 1e7 ? 1 : 2).replace('.', ',') + ' mi';
    else if (v >= 1e3) s = 'R$ ' + Math.round(v / 1e3) + ' mil';
    else s = 'R$ ' + Math.round(v);
    return (neg ? '−' : '') + s;
  }
  function fmtImposto(campo, v) {
    const c = CAMPOS_IMPOSTO[campo];
    if (c.un === 'R$') return 'R$ ' + v + '/mês';
    return (Number.isInteger(v * 10) ? v.toFixed(1) : v.toFixed(2)).replace('.', ',') + '%';
  }
  function fmtMesIndex(mi) {
    const m = mi % 12, a = ANO_INICIAL + Math.floor(mi / 12);
    return MESES_CURTO[m] + '/' + a;
  }

  return {
    get S() { return S; },
    on, emit, noticia, novoJogo, novoMandato, avancar, pularMes,
    calcularCobertura, coberturaCidade, calcularFinancas, calcularAlvos,
    aprovBairro, aprovGrupo, aprovCidade, popTotal, issMedioVizinhos,
    statusPromessa, intencaoVoto, pesquisa,
    construir, progressoObra, estimar, servidoresNovos, enviarProjeto, preverVoto, atenderPedido, reuniao, proximaSessao,
    CAMPOS_IMPOSTO, lerImposto, bairroDoCampo,
    vozDoPovo, ouvir, ouvirTodos, resumoNecessidades,
    salvar, listarSaves, carregar, apagarSave, dormir, horaDoDia,
    fmtDinheiro, fmtImposto, fmtMesIndex, diasNoMes, duracaoDia, bairroById, clamp,
  };
})();
