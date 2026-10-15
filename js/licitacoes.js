// =====================================================================
//  PREFEITO 8-BIT — licitações
//  1) Obras públicas: três construtoras disputam cada obra, com preço,
//     prazo e risco diferentes (aditivo, atraso, abandono).
//  2) Serviços: contratos mensais com empresas (coleta de lixo, ônibus,
//     merenda, LED, câmeras...) com custo fixo e benefícios.
// =====================================================================

const CONSTRUTORAS = [
  'Construtora Alicerce', 'Engeplan Obras', 'Concreto Forte Ltda.', 'Irmãos Bellini Construções', 'Sólida Engenharia',
  'Pilar Paulista Construtora', 'Edifica Interior', 'Tijolo & Cia', 'Construtora Horizonte', 'Mãos à Obra Engenharia',
];

// perfil das construtoras na licitação de obras
const PERFIS_OBRA = {
  barata: { rotulo: 'Preço baixo', preco: [0.78, 0.86], prazo: -1, qualidade: 0.85, aditivo: 0.40, atraso: 0.35, abandono: 0.10,
            desc: 'Menor preço, mas histórico de atrasos e pedidos de aditivo.' },
  media:  { rotulo: 'Equilibrada', preco: [0.93, 1.00], prazo: 0, qualidade: 1.0, aditivo: 0.15, atraso: 0.15, abandono: 0.02,
            desc: 'Preço justo e entregas razoáveis.' },
  solida: { rotulo: 'Alta qualidade', preco: [1.06, 1.14], prazo: 0, qualidade: 1.12, aditivo: 0.05, atraso: 0.05, abandono: 0,
            desc: 'Mais cara, entrega no prazo e o prédio custa menos para manter.' },
};

// serviços que a prefeitura pode contratar
//  area = onde o gasto entra no orçamento (saude/educacao contam para os mínimos)
//  economia = quanto a prefeitura deixa de gastar por mês com a própria estrutura
//  efeitos = aprovação por grupo · cobertura = vagas/atendimento extra por bairro
const SERVICOS = [
  { id: 'coleta', nome: 'Coleta de lixo e limpeza urbana', area: 'urbano', custo: 650e3, economia: 600e3, urbano: 0.15,
    desc: 'Uma empresa assume a coleta e a varrição. A prefeitura economiza com a própria frota.', beneficio: 'Cidade mais limpa: todos os grupos aprovam' },
  { id: 'onibus', nome: 'Ônibus circular municipal', area: 'urbano', custo: 280e3, efeitos: { trab: 3, jovens: 2, idosos: 2 }, desemprego: 0.3,
    desc: 'Linhas ligando os bairros ao Centro e ao Distrito Industrial, com tarifa subsidiada.', beneficio: 'Trabalhadores, jovens e idosos aprovam; ajuda quem procura emprego' },
  { id: 'merenda', nome: 'Merenda escolar reforçada', area: 'educacao', custo: 220e3, efeitos: { fam: 3, jovens: 1 }, cobertura: { cat: 'educacao', cap: 80 },
    desc: 'Cardápio com nutricionista e produtos da agricultura familiar.', beneficio: 'Famílias aprovam; conta para o mínimo de 25% da educação' },
  { id: 'led', nome: 'Iluminação pública em LED (PPP)', area: 'urbano', custo: 160e3, economia: 120e3, cobertura: { cat: 'seguranca', cap: 1200 }, efeitos: { com: 1 },
    desc: 'Troca de todas as lâmpadas por LED, pago em parcelas mensais.', beneficio: 'Ruas mais claras e seguras; conta de energia menor' },
  { id: 'cameras', nome: 'Monitoramento por câmeras', area: 'seguranca', custo: 140e3, cobertura: { cat: 'seguranca', cap: 2000 }, efeitos: { com: 2, idosos: 1 },
    desc: 'Central de monitoramento integrada à Guarda Municipal.', beneficio: 'Mais segurança em todos os bairros' },
  { id: 'asfalto', nome: 'Programa tapa-buraco e recapeamento', area: 'urbano', custo: 380e3, todos: 2.5, duracaoMax: 12,
    desc: 'Mutirão de asfalto em todas as ruas por um ano.', beneficio: 'Todo mundo nota a diferença' },
  { id: 'wifi', nome: 'Wi-Fi grátis nas praças', area: 'cultura', custo: 35e3, efeitos: { jovens: 2 },
    desc: 'Internet livre nas praças e no Centro.', beneficio: 'Jovens aprovam; custo baixo' },
  { id: 'os_saude', nome: 'Gestão das UBS por Organização Social', area: 'saude', custo: 300e3, cobertura: { cat: 'saude', cap: 1500 }, efeitos: { idosos: 2 },
    desc: 'Uma OS contrata médicos e amplia o horário dos postos.', beneficio: 'Mais atendimento; conta para o mínimo de 15% da saúde' },
  { id: 'farmacia', nome: 'Farmácia popular municipal', area: 'saude', custo: 120e3, efeitos: { idosos: 3, fam: 1 },
    desc: 'Remédios de uso contínuo de graça, com gestão terceirizada.', beneficio: 'Idosos aprovam muito' },
  { id: 'jardinagem', nome: 'Manutenção de praças e jardins', area: 'cultura', custo: 70e3, cobertura: { cat: 'lazer', cap: 800 }, efeitos: { fam: 1 },
    desc: 'Poda, jardinagem e pequenos reparos nas áreas verdes.', beneficio: 'Praças bonitas e usadas' },
];
// empresas que disputam cada tipo de serviço
const EMPRESAS_SERVICO = {
  coleta:     ['LimpaCidade Serviços', 'Ambiental Paulista', 'Coleta Já', 'Urbaniza Limpeza'],
  onibus:     ['Trans Interior', 'Viação Bandeirantes do Oeste', 'Expresso Rio Manso', 'Circular Bom Jesus'],
  merenda:    ['Nutrir Alimentação', 'Sabor da Escola', 'Merenda Viva', 'Cozinha Industrial Paulista'],
  led:        ['LuzViva PPP', 'Ilumina Cidades', 'Brilho LED Concessões', 'Energia Pública S.A.'],
  cameras:    ['Vigia Tecnologia', 'Olho Vivo Monitoramento', 'Segura Cidade', 'Sentinela Sistemas'],
  asfalto:    ['Pavimenta Brasil', 'Asfalto Forte', 'Via Nova Obras', 'Terraplenagem Irmãos Costa'],
  wifi:       ['ConectaJá', 'Interior Net', 'WiFi Livre Brasil', 'Fibra do Vale'],
  os_saude:   ['Instituto Saúde Mais', 'OS Vida Plena', 'Associação Bem Cuidar', 'Instituto Sanitas'],
  farmacia:   ['Farma Pública Gestão', 'Remédio Certo', 'Instituto Cuidar', 'Drogaria Popular Serviços'],
  jardinagem: ['Verde Urbano', 'Jardins do Interior', 'Paisagismo Ipê', 'Cooperativa Mãos na Terra'],
};
const PERFIS_SERVICO = {
  barato: { rotulo: 'Preço baixo', preco: [0.78, 0.86], qualidade: 0.65, falha: 0.08 },
  medio:  { rotulo: 'Equilibrada', preco: [0.94, 1.0],  qualidade: 0.85, falha: 0.035 },
  bom:    { rotulo: 'Alta qualidade', preco: [1.08, 1.15], qualidade: 1.0, falha: 0.01 },
};

const Licitacoes = (() => {
  const S = () => Sim.S;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const serv = id => SERVICOS.find(x => x.id === id);
  function garantir() { const s = S(); if (!s.contratos) s.contratos = []; }

  // -------------------------------------------------------------- obras
  function lancesObra(loteId, tipo, restante) {
    const s = S(), l = s.lotes.find(x => x.id === loteId), t = PREDIOS[tipo];
    const base = restante ? restante.valor : t.custo + (l.tipo === 'particular' ? l.desapropriacao : 0);
    const meses = restante ? restante.meses : t.meses;
    const nomes = CONSTRUTORAS.slice().sort(() => Math.random() - 0.5);
    // às vezes uma das construtoras é "indicada" por um vereador
    const padrinho = Math.random() < 0.35 ? pick(s.vereadores.filter(v => v.lado !== 'opos')) : null;
    const lances = ['barata', 'media', 'solida'].map((perfil, i) => {
      const P = PERFIS_OBRA[perfil];
      return {
        construtora: nomes[i], perfil, valor: Math.round(base * rnd(...P.preco) / 1e4) * 1e4,
        meses: Math.max(1, meses + P.prazo), qualidade: P.qualidade,
        riscos: { aditivo: P.aditivo, atraso: P.atraso, abandono: P.abandono },
        padrinho: null,
      };
    });
    if (padrinho) { const lc = lances[Math.random() < 0.6 ? 0 : 1]; lc.padrinho = { id: padrinho.id, nome: padrinho.nome }; }
    return lances.sort((a, b) => a.valor - b.valor);
  }

  // eventos de obra, chamados todo fim de mês para cada obra em andamento
  function obraMes(l) {
    const o = l.obra, s = S();
    if (!o.riscos || o.parada) return;
    const n = Math.max(1, o.mesesTotal);
    const nome = PREDIOS[o.tipo].nome;
    if (!o.teveAditivo && Math.random() < o.riscos.aditivo / n) {
      o.teveAditivo = true;
      const extra = Math.round(o.custo * rnd(0.1, 0.25) / 1e4) * 1e4; // a lei limita aditivos a 25%
      o.custo += extra;
      o.parcela = (o.parcela * o.mesesRest + extra) / Math.max(1, o.mesesRest);
      o.eventos.push(`Aditivo de ${Sim.fmtDinheiro(extra)} pedido pela construtora`);
      Sim.noticia(4, `${o.construtora} pede aditivo de ${Sim.fmtDinheiro(extra)} na obra do ${nome}`, 'Oposição quer CPI na Câmara');
      s.candidato.forca = clamp(s.candidato.forca + 1, 0, 95);
    }
    if (o.atrasos < 2 && Math.random() < o.riscos.atraso / n) {
      o.atrasos++;
      const m = 1 + Math.floor(Math.random() * 2);
      o.mesesRest += m; o.mesesTotal += m; o.parcela = o.parcela * (o.mesesRest - m) / o.mesesRest;
      o.eventos.push(`Atraso de ${m} ${m === 1 ? 'mês' : 'meses'}`);
      Sim.noticia(3, `Obra do ${nome} atrasa ${m} ${m === 1 ? 'mês' : 'meses'}`, `${o.construtora} culpa a chuva e a falta de material`);
      s.humor.bairros[l.bairro] = (s.humor.bairros[l.bairro] || 0) - 1.5;
    }
    if (Math.random() < o.riscos.abandono / n) {
      o.parada = true;
      o.eventos.push('A construtora abandonou a obra');
      Sim.noticia(7, `${o.construtora} abandona a obra do ${nome}`, 'Esqueleto vira símbolo de desperdício · prefeitura precisa fazer nova licitação');
      s.humor.global -= 2; s.candidato.forca = clamp(s.candidato.forca + 3, 0, 95);
      Sim.emit('obraParada', l);
    }
    if (o.padrinho && !o.escandalo && Math.random() < 0.25 / n) {
      o.escandalo = true;
      Sim.noticia(8, `Ministério Público investiga contrato da ${o.construtora}`, `Empresa seria ligada ao vereador ${o.padrinho.nome}`);
      s.humor.global -= 4; s.candidato.forca = clamp(s.candidato.forca + 5, 0, 95);
    }
  }

  // nova licitação para terminar uma obra abandonada
  function lancesRetomada(l) {
    const o = l.obra;
    const restante = o.custo * (o.mesesRest / o.mesesTotal) * 1.15;
    return lancesObra(l.id, o.tipo, { valor: restante, meses: o.mesesRest + 1 });
  }
  function retomar(loteId, lance) {
    const l = S().lotes.find(x => x.id === loteId); if (!l || !l.obra) return;
    const o = l.obra;
    Object.assign(o, {
      construtora: lance.construtora, perfil: lance.perfil, qualidade: lance.qualidade, riscos: lance.riscos,
      parada: false, mesesRest: lance.meses, mesesTotal: (o.mesesTotal - o.mesesRest) + lance.meses,
      parcela: lance.valor / lance.meses, custo: o.custo + lance.valor - o.parcela * o.mesesRest, teveAditivo: false, atrasos: 0,
    });
    o.eventos.push(`Obra retomada por ${lance.construtora}`);
    Sim.noticia(4, `Obra do ${PREDIOS[o.tipo].nome} é retomada por ${lance.construtora}`, '');
    Sim.emit('mudou');
  }

  // ----------------------------------------------------------- serviços
  function lancesServico(id) {
    const sv = serv(id);
    const nomes = EMPRESAS_SERVICO[id].slice().sort(() => Math.random() - 0.5);
    return ['barato', 'medio', 'bom'].map((perfil, i) => {
      const P = PERFIS_SERVICO[perfil];
      return { empresa: nomes[i], perfil, custoMes: Math.round(sv.custo * rnd(...P.preco) / 1e3) * 1e3, qualidade: P.qualidade, falha: P.falha };
    }).sort((a, b) => a.custoMes - b.custoMes);
  }
  function descontoDuracao(meses) { return meses >= 48 ? 0.9 : meses >= 24 ? 0.95 : 1; }
  function contratar(id, lance, meses) {
    garantir();
    const s = S(), sv = serv(id);
    meses = Math.min(meses, sv.duracaoMax || 48);
    const c = { id: 'c' + Date.now() % 1e7, servId: id, empresa: lance.empresa, perfil: lance.perfil, qualidade: lance.qualidade, falha: lance.falha,
      custoMes: Math.round(lance.custoMes * descontoDuracao(meses) / 1e3) * 1e3, inicio: s.mesIndex, fim: s.mesIndex + meses };
    s.contratos.push(c);
    Recursos.usarEmContrato(c, meses);
    Sim.noticia(4, `Prefeitura assina contrato: ${sv.nome}`, `${lance.empresa} · ${Sim.fmtDinheiro(c.custoMes)}/mês por ${meses} meses`);
    Sim.emit('mudou');
    return c;
  }
  function multaRescisao(c) { return c.custoMes * 3; }
  function rescindir(cid) {
    const s = S(); garantir();
    const c = s.contratos.find(x => x.id === cid); if (!c) return;
    s.caixa -= multaRescisao(c);
    s.contratos = s.contratos.filter(x => x !== c);
    Sim.noticia(3, `Prefeitura rompe contrato de ${serv(c.servId).nome}`, `Multa de ${Sim.fmtDinheiro(multaRescisao(c))} para ${c.empresa}`);
    Sim.emit('mudou');
  }
  function ativos() { const s = S(); return (s && s.contratos) || []; }
  function contratoAtivo(id) { return ativos().find(c => c.servId === id); }

  function mes() {
    const s = S(); garantir();
    for (const c of s.contratos.slice()) {
      const sv = serv(c.servId);
      if (s.mesIndex >= c.fim) {
        s.contratos = s.contratos.filter(x => x !== c);
        Sim.noticia(3, `Termina o contrato de ${sv.nome}`, 'A prefeitura pode abrir nova licitação');
        continue;
      }
      if (Math.random() < c.falha) {
        c.falhas = (c.falhas || 0) + 1;
        Sim.noticia(3, `Reclamações contra ${c.empresa}: ${sv.nome.toLowerCase()} falhou este mês`, 'Moradores cobram fiscalização do contrato');
        s.humor.global -= 1.2;
      }
    }
  }

  // ------------------------------------------------- efeitos na cidade
  function despesas() {
    const out = { saude: 0, educacao: 0, seguranca: 0, cultura: 0, urbano: 0, economia: 0 };
    for (const c of ativos()) { const sv = serv(c.servId); out[sv.area] += c.custoMes; out.economia += sv.economia || 0; }
    return out;
  }
  function efeitos() {
    const g = {}; let urbano = 0, todos = 0;
    for (const c of ativos()) {
      const sv = serv(c.servId), q = c.qualidade;
      for (const k in (sv.efeitos || {})) g[k] = (g[k] || 0) + sv.efeitos[k] * q;
      if (sv.urbano) urbano += sv.urbano * q;
      if (sv.todos) todos += sv.todos * q;
    }
    return { grupos: g, urbano, todos };
  }
  function coberturaExtra() {
    const out = [];
    for (const c of ativos()) {
      const sv = serv(c.servId); if (!sv.cobertura) continue;
      for (const b of BAIRROS) out.push({ bairro: b.id, cat: sv.cobertura.cat, cap: sv.cobertura.cap * c.qualidade * (S().bairros[b.id].pop / 6250), local: true });
    }
    return out;
  }
  function reducaoDesemprego() { return ativos().reduce((s, c) => s + (serv(c.servId).desemprego || 0) * c.qualidade, 0); }

  return { lancesObra, obraMes, lancesRetomada, retomar, lancesServico, contratar, rescindir, multaRescisao, ativos, contratoAtivo,
           descontoDuracao, mes, despesas, efeitos, coberturaExtra, reducaoDesemprego, serv, garantir };
})();
