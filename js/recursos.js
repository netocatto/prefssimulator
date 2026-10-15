// =====================================================================
//  PREFEITO 8-BIT — recursos federais e estaduais
//  • A prefeitura pede verba a programas do governo (paga o projeto e
//    espera a resposta) ou recebe emendas de deputados.
//  • Quando a verba é aprovada vira uma OFERTA: aceitar ou recusar.
//  • Aceita, vira um CONVÊNIO: paga parte de uma obra ou de um contrato
//    de serviço do tipo combinado. Se não for usado no prazo, é perdido.
//  • Regras reais simplificadas: contrapartida municipal, prefeitura
//    inadimplente fica bloqueada (CAUC) e há vedação eleitoral nos
//    3 meses antes da eleição.
// =====================================================================

const PROGRAMAS = [
  { id: 'creche_fed',  nome: 'Programa Creche para Todos',      esfera: 'federal',  tipo: 'predio',  alvo: 'creche',    valor: [1.1e6, 1.6e6],   contra: 0.10, prazo: 12, chance: 0.55, projeto: 80e3 },
  { id: 'escola_sp',   nome: 'Escola Nova SP',                  esfera: 'estadual', tipo: 'predio',  alvo: 'escola',    valor: [2.4e6, 3.6e6],   contra: 0.15, prazo: 12, chance: 0.50, projeto: 90e3 },
  { id: 'ubs_fed',     nome: 'Saúde na Comunidade',             esfera: 'federal',  tipo: 'predio',  alvo: 'ubs',       valor: [0.9e6, 1.4e6], contra: 0.10, prazo: 10, chance: 0.60, projeto: 50e3 },
  { id: 'hosp_sp',     nome: 'Hospital Regional Paulista',      esfera: 'estadual', tipo: 'predio',  alvo: 'hospital',  valor: [8e6, 14e6],    contra: 0.25, prazo: 18, chance: 0.30, projeto: 250e3 },
  { id: 'praca_fed',   nome: 'Praças da Juventude',             esfera: 'federal',  tipo: 'predio',  alvo: 'praca',     valor: [0.4e6, 0.7e6], contra: 0.10, prazo: 10, chance: 0.65, projeto: 30e3 },
  { id: 'cultura_fed', nome: 'Cultura Viva',                    esfera: 'federal',  tipo: 'predio',  alvo: 'cultura',   valor: [1.8e6, 3e6],   contra: 0.15, prazo: 12, chance: 0.45, projeto: 70e3 },
  { id: 'bomb_sp',     nome: 'Bombeiro Presente',               esfera: 'estadual', tipo: 'predio',  alvo: 'bombeiros', valor: [2.5e6, 4e6],   contra: 0.20, prazo: 14, chance: 0.40, projeto: 90e3 },
  { id: 'guarda_fed',  nome: 'Segurança Cidadã',                esfera: 'federal',  tipo: 'predio',  alvo: 'guarda',    valor: [1.0e6, 1.6e6], contra: 0.15, prazo: 10, chance: 0.50, projeto: 50e3 },
  { id: 'asfalto_sp',  nome: 'Pavimenta SP',                    esfera: 'estadual', tipo: 'servico', alvo: 'asfalto',   valor: [1.5e6, 3e6],   contra: 0.10, prazo: 8,  chance: 0.55, projeto: 40e3 },
  { id: 'onibus_fed',  nome: 'Mobilidade Urbana',               esfera: 'federal',  tipo: 'servico', alvo: 'onibus',    valor: [1.5e6, 2.5e6], contra: 0.20, prazo: 8,  chance: 0.40, projeto: 50e3 },
  { id: 'led_fed',     nome: 'Luz Eficiente',                   esfera: 'federal',  tipo: 'servico', alvo: 'led',       valor: [1.0e6, 2e6],   contra: 0.10, prazo: 8,  chance: 0.50, projeto: 40e3 },
  { id: 'merenda_fed', nome: 'Alimentação Escolar Reforçada',   esfera: 'federal',  tipo: 'servico', alvo: 'merenda',   valor: [1.0e6, 2e6],   contra: 0.10, prazo: 8,  chance: 0.60, projeto: 30e3 },
];
const DEPUTADOS = [
  { nome: 'Dep. Federal Cláudio Matarazzo', partido: 'MCV' }, { nome: 'Dep. Estadual Rita Camargo', partido: 'AP' },
  { nome: 'Dep. Estadual Wilson Prado', partido: 'PTR' }, { nome: 'Dep. Federal Sérgio Abdalla', partido: 'PVA' },
  { nome: 'Dep. Estadual Márcia Toledo', partido: 'FLP' }, { nome: 'Dep. Federal Joel Bittencourt', partido: 'AP' },
];
const ALIADOS = ['AP', 'MCV'], OPOSICAO = ['FLP'];
const CHEFES = {
  federal: ['Pres. Arthur Monteiro', 'Pres. Helena Cardoso', 'Pres. Ricardo Valença', 'Pres. Lúcia Fontoura'],
  estadual: ['Gov. Sílvia Arantes', 'Gov. Paulo Bastos', 'Gov. Marina Quintela', 'Gov. Rogério Salim'],
};

const Recursos = (() => {
  const S = () => Sim.S;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const prog = id => PROGRAMAS.find(p => p.id === id);
  const nomeAlvo = (tipo, alvo) => tipo === 'predio' ? PREDIOS[alvo].nome : Licitacoes.serv(alvo).nome;
  let uid = Date.now() % 100000;

  function garantir() {
    const s = S();
    if (!s.governos) s.governos = {
      federal: { chefe: pick(CHEFES.federal), partido: pick(['PTR', 'MCV', 'FLP', 'PVA']) },
      estadual: { chefe: pick(CHEFES.estadual), partido: pick(['MCV', 'FLP', 'PTR', 'AP']) },
    };
    if (!s.pedidosRecursos) s.pedidosRecursos = [];
    if (!s.ofertasRecursos) s.ofertasRecursos = [];
    if (!s.convenios) s.convenios = [];
    if (s.proxEmenda == null) s.proxEmenda = s.mesIndex + 3;
    if (!s.recusasRecursos) s.recusasRecursos = {};
  }

  // ------------------------------------------------------------- regras
  function alinhamento(esfera) {
    const p = S().governos[esfera].partido;
    if (ALIADOS.includes(p)) return { txt: 'Aliado', mod: 0.2, tom: 'pos' };
    if (OPOSICAO.includes(p)) return { txt: 'Oposição', mod: -0.2, tom: 'neg' };
    return { txt: 'Neutro', mod: 0, tom: '' };
  }
  function mesesAteEleicao() { const s = S(); return (s.inicioMandato + 1 - s.ano) * 12 + (9 - s.mes); }
  // motivo pelo qual a cidade não pode receber verba agora (ou null)
  function bloqueio() {
    const s = S();
    if (s.caixa < 0) return 'Prefeitura inadimplente (caixa negativo): bloqueada no cadastro federal (CAUC)';
    if (s.contasRejeitadasAte && s.mesIndex < s.contasRejeitadasAte) return 'Contas rejeitadas pelo Tribunal de Contas: bloqueada no CAUC por 12 meses';
    const m = mesesAteEleicao();
    if (!s.eleicaoFeita && m >= 0 && m <= 3) return 'Vedação eleitoral: sem transferências voluntárias nos 3 meses antes da eleição';
    return null;
  }
  function chance(p) {
    const s = S();
    let c = p.chance + alinhamento(p.esfera).mod;
    c += (Sim.aprovCidade() - 50) / 200; // prefeito popular tem mais força política
    if (p.minPop && Sim.popTotal() < p.minPop) c -= 0.25;
    return clamp(c, 0.05, 0.9);
  }
  function podePedir(p) {
    const s = S(); garantir();
    const b = bloqueio(); if (b) return { ok: false, motivo: b };
    if (s.pedidosRecursos.some(x => x.progId === p.id)) return { ok: false, motivo: 'Pedido em análise' };
    if (s.ofertasRecursos.some(x => x.progId === p.id) || s.convenios.some(x => x.progId === p.id && x.status === 'aceito')) return { ok: false, motivo: 'Já existe verba deste programa' };
    if (s.recusasRecursos[p.id] && s.mesIndex < s.recusasRecursos[p.id]) return { ok: false, motivo: `Pedido negado; novo pedido a partir de ${Sim.fmtMesIndex(s.recusasRecursos[p.id])}` };
    if (s.pedidosRecursos.length >= 3) return { ok: false, motivo: 'Máximo de 3 pedidos em análise' };
    return { ok: true };
  }

  // --------------------------------------------------------- pedir verba
  function pedir(id) {
    const s = S(), p = prog(id);
    if (!podePedir(p).ok) return false;
    s.caixa -= p.projeto;
    s.pedidosRecursos.push({ id: 'r' + (uid++), progId: id, resposta: s.mesIndex + 1 + Math.floor(Math.random() * 2), chance: chance(p) });
    Sim.noticia(2, `Prefeitura pede verba ao ${p.esfera === 'federal' ? 'Governo Federal' : 'Governo do Estado'}: ${p.nome}`, `Projeto técnico custou ${Sim.fmtDinheiro(p.projeto)}`);
    Sim.emit('mudou');
    return true;
  }

  function criarOferta(dados) {
    const s = S();
    const of = { id: 'o' + (uid++), expira: s.mesIndex + 2, ...dados };
    s.ofertasRecursos.push(of);
    Sim.emit('ofertaRecurso', of);
    return of;
  }

  function aceitar(ofId) {
    const s = S(); const of = s.ofertasRecursos.find(x => x.id === ofId); if (!of) return;
    if (bloqueio()) { Sim.emit('mudou'); return false; }
    s.ofertasRecursos = s.ofertasRecursos.filter(x => x !== of);
    s.convenios.push({ ...of, id: 'cv' + (uid++), status: 'aceito', prazoMes: s.mesIndex + of.prazo });
    Sim.noticia(5, `Cidade garante ${Sim.fmtDinheiro(of.valor)} ${of.origem} para ${nomeAlvo(of.tipo, of.alvo).toLowerCase()}`, `Prazo para usar: ${of.prazo} meses`);
    s.humor.global += 1;
    Sim.emit('mudou');
    return true;
  }
  function recusar(ofId) {
    const s = S(); const of = s.ofertasRecursos.find(x => x.id === ofId); if (!of) return;
    s.ofertasRecursos = s.ofertasRecursos.filter(x => x !== of);
    Sim.noticia(2, `Prefeitura recusa ${Sim.fmtDinheiro(of.valor)} ${of.origem}`, 'Dinheiro volta para outros municípios');
    Sim.emit('mudou');
  }

  // ---------------------------------------------- uso em obras/contratos
  function convenioPara(tipo, alvo) {
    const s = S(); if (!s.convenios) return null;
    return s.convenios.find(c => c.status === 'aceito' && c.tipo === tipo && c.alvo === alvo) || null;
  }
  // quanto a verba cobre de um custo total (respeitando a contrapartida)
  function cobertura(cv, custoTotal) { return Math.min(cv.valor, custoTotal * (1 - cv.contra)); }

  function usarEmObra(l) {
    const cv = convenioPara('predio', l.obra.tipo); if (!cv) return 0;
    const coberto = cobertura(cv, l.obra.custo);
    // a sobra continua valendo para outra obra do mesmo tipo
    cv.valor -= coberto; cv.status = cv.valor > 50e3 ? 'aceito' : 'usado';
    l.obra.convenio = { id: cv.id, nome: cv.nome, resta: coberto };
    l.obra.eventos.push(`${Sim.fmtDinheiro(coberto)} pagos por ${cv.nome}`);
    return coberto;
  }
  function usarEmContrato(c, meses) {
    const cv = convenioPara('servico', c.servId); if (!cv) return 0;
    const coberto = cobertura(cv, c.custoMes * meses);
    cv.valor -= coberto; cv.status = cv.valor > 50e3 ? 'aceito' : 'usado';
    c.convenio = { id: cv.id, nome: cv.nome, resta: coberto, mes: coberto / meses };
    return coberto;
  }

  // dinheiro do convênio que entra neste mês (receita)
  function receitaMes() {
    const s = S(); let r = 0;
    for (const l of s.lotes) if (l.obra && l.obra.convenio && !l.obra.parada && l.obra.mesesRest > 0) r += Math.min(l.obra.parcela, l.obra.convenio.resta / l.obra.mesesRest);
    for (const c of (s.contratos || [])) if (c.convenio && c.convenio.resta > 0) r += Math.min(c.custoMes, c.convenio.mes, c.convenio.resta);
    return r;
  }
  // desconta do saldo dos convênios o que foi pago (chamado no fim do mês)
  function consumir() {
    const s = S();
    for (const l of s.lotes) if (l.obra && l.obra.convenio && !l.obra.parada && l.obra.mesesRest > 0) l.obra.convenio.resta -= Math.min(l.obra.parcela, l.obra.convenio.resta / l.obra.mesesRest);
    for (const c of (s.contratos || [])) if (c.convenio && c.convenio.resta > 0) c.convenio.resta -= Math.min(c.custoMes, c.convenio.mes, c.convenio.resta);
  }

  // ------------------------------------------------------------ mês a mês
  function mes() {
    const s = S(); garantir();
    // respostas dos pedidos
    for (const pd of s.pedidosRecursos.slice()) {
      if (s.mesIndex < pd.resposta) continue;
      s.pedidosRecursos = s.pedidosRecursos.filter(x => x !== pd);
      const p = prog(pd.progId);
      const b = bloqueio();
      if (!b && Math.random() < pd.chance) {
        const valor = Math.round(rnd(...p.valor) * rnd(0.75, 1) / 1e4) * 1e4;
        criarOferta({ progId: p.id, nome: p.nome, esfera: p.esfera, origem: p.esfera === 'federal' ? 'do Governo Federal' : 'do Governo do Estado',
          tipo: p.tipo, alvo: p.alvo, valor, contra: p.contra, prazo: p.prazo });
        Sim.noticia(5, `${p.esfera === 'federal' ? 'Governo Federal' : 'Governo do Estado'} aprova ${Sim.fmtDinheiro(valor)} para a cidade`, p.nome);
      } else {
        s.recusasRecursos[p.id] = s.mesIndex + 6;
        Sim.noticia(3, `Pedido negado: ${p.nome}`, b || 'Falta de verba no orçamento, diz o ministério');
        Sim.emit('recursoNegado', p);
      }
    }
    // emendas de deputados
    if (s.mesIndex >= s.proxEmenda && !bloqueio()) {
      s.proxEmenda = s.mesIndex + 4 + Math.floor(Math.random() * 4);
      const dep = pick(DEPUTADOS);
      const p = pick(PROGRAMAS.filter(x => x.tipo === 'predio' && x.alvo !== 'hospital'));
      const valor = Math.round(rnd(0.4, 1.2) * Math.min(p.valor[0], PREDIOS[p.alvo].custo) / 1e4) * 1e4;
      criarOferta({ progId: null, nome: `Emenda do ${dep.nome}`, esfera: 'emenda', origem: `em emenda do ${dep.nome} (${dep.partido})`,
        tipo: 'predio', alvo: p.alvo, valor, contra: 0, prazo: 12, deputado: dep });
      Sim.noticia(4, `${dep.nome} destina emenda de ${Sim.fmtDinheiro(valor)} à cidade`, `Para ${PREDIOS[p.alvo].nome.toLowerCase()}`);
    }
    // ofertas que ninguém respondeu
    for (const of of s.ofertasRecursos.slice()) if (s.mesIndex >= of.expira) {
      s.ofertasRecursos = s.ofertasRecursos.filter(x => x !== of);
      Sim.noticia(3, `Prefeitura perde prazo e ${Sim.fmtDinheiro(of.valor)} ${of.origem} vão para outra cidade`, '');
    }
    // convênios não usados no prazo
    for (const cv of s.convenios) if (cv.status === 'aceito' && s.mesIndex >= cv.prazoMes) {
      cv.status = 'perdido';
      Sim.noticia(6, `Cidade perde ${Sim.fmtDinheiro(cv.valor)} por não usar a verba a tempo`, `${cv.nome} · oposição fala em incompetência`);
      s.humor.global -= 2; s.candidato.forca = clamp(s.candidato.forca + 2, 0, 95);
    }
    // eleições gerais (presidente e governador) em outubro de 2030, 2034...
    if (s.mes === 10 && (s.ano - 2030) % 4 === 0) {
      for (const esf of ['federal', 'estadual']) { s.governos[esf] = { chefe: pick(CHEFES[esf]), partido: pick(['PTR', 'MCV', 'FLP', 'PVA', 'AP']) }; }
      Sim.noticia(5, `Eleições gerais: ${s.governos.federal.chefe} (${s.governos.federal.partido}) e ${s.governos.estadual.chefe} (${s.governos.estadual.partido}) vencem`, 'Novos governos tomam posse em janeiro');
    }
  }

  return { PROGRAMAS, garantir, alinhamento, bloqueio, chance, podePedir, pedir, aceitar, recusar, convenioPara, cobertura,
           usarEmObra, usarEmContrato, receitaMes, consumir, mes, nomeAlvo, prog };
})();
