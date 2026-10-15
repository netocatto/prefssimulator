// =====================================================================
//  PREFEITO — vida da cidade
//  • Avisos: tudo o que antes aparecia como notificação vai para uma
//    lista que o jogador lê quando quiser.
//  • Ocorrências: buracos, vazamentos, lixo, árvores caídas, incêndios,
//    acidentes e alagamentos aparecem no mapa. Resolver custa pouco;
//    deixar para lá irrita o bairro.
//  • Eventos: shows e festas na praça (sem precisar de centro cultural)
//    e shows grandes no Centro Cultural, com patrocínio das empresas.
// =====================================================================

const TIPOS_OCORRENCIA = {
  buraco:     { nome: 'Buraco na rua', custo: 25e3, dias: 2, prazo: 20, efeito: -1.5, local: 'rua', servico: 'asfalto', acao: 'Mandar tapar o buraco',
                desc: 'Um buraco enorme na rua. Carros desviam pela calçada e os moradores já colocaram um pneu dentro.' },
  vazamento:  { nome: 'Vazamento de água', custo: 18e3, dias: 1, prazo: 8, efeito: -2, local: 'rua', acao: 'Chamar a equipe de água e esgoto',
                desc: 'Cano estourado: água limpa descendo a rua e casas sem água na torneira.' },
  lixo:       { nome: 'Lixo acumulado', custo: 12e3, dias: 1, prazo: 10, efeito: -1.5, local: 'rua', servico: 'coleta', acao: 'Fazer um mutirão de limpeza',
                desc: 'A coleta não passou e os sacos de lixo se amontoam na esquina. Já tem cachorro rasgando.' },
  arvore:     { nome: 'Árvore caída', custo: 9e3, dias: 1, prazo: 10, efeito: -1, local: 'terreno', acao: 'Mandar cortar e remover',
                desc: 'O vento derrubou uma árvore sobre a calçada e os fios. A rua está parcialmente fechada.' },
  incendio:   { nome: 'Incêndio em terreno', custo: 35e3, dias: 1, prazo: 2, efeito: -3, local: 'terreno', predio: 'bombeiros', acao: 'Mandar a Defesa Civil com caminhão-pipa',
                desc: 'Fogo no mato de um terreno baldio, fumaça entrando nas casas vizinhas.' },
  acidente:   { nome: 'Acidente de trânsito', custo: 40e3, dias: 1, prazo: 3, efeito: -1, local: 'rua', acao: 'Sinalizar o cruzamento (placas e lombada)',
                desc: 'Batida entre dois carros no cruzamento. Ninguém se feriu gravemente, mas os moradores pedem sinalização.' },
  alagamento: { nome: 'Alagamento', custo: 60e3, dias: 2, prazo: 5, efeito: -2.5, local: 'rua', chuva: true, acao: 'Desentupir bueiros e bombear a água',
                desc: 'A chuva forte encheu a rua e a água entrou em algumas casas.' },
};

const TIPOS_EVENTO = {
  show_local:     { nome: 'Show local na praça', custo: 45e3, prep: 3, publico: [800, 2000], local: 'praca', intervalo: 10, gasto: 20,
                    efeitos: { jovens: 3, fam: 2, com: 2, idosos: 1 }, desc: 'Banda da cidade e artistas da região num palco montado na praça.' },
  quermesse:      { nome: 'Quermesse na praça', custo: 70e3, prep: 5, publico: [1500, 3000], local: 'praca', intervalo: 20, gasto: 30, meses: [5, 6],
                    efeitos: { fam: 3, idosos: 3, com: 2, jovens: 1 }, desc: 'Barracas de comida, quadrilha e bingo. Em junho e julho vira festa junina e rende mais.' },
  feira_cultural: { nome: 'Feira de artesanato e food trucks', custo: 30e3, prep: 4, publico: [1000, 2500], local: 'praca', intervalo: 10, gasto: 35,
                    efeitos: { com: 3, fam: 2, jovens: 1 }, desc: 'Artesãos e food trucks na praça. O comércio adora.' },
  show_regional:  { nome: 'Show sertanejo regional', custo: 280e3, prep: 10, publico: [4000, 8000], local: 'central', intervalo: 30, gasto: 45, minPop: 20000, risco: true,
                    efeitos: { jovens: 5, trab: 3, fam: 2, com: 3, idosos: -1 }, desc: 'Dupla sertaneja conhecida no interior. Lota a praça e precisa de segurança.' },
  show_nacional:  { nome: 'Show nacional', custo: 1.3e6, prep: 30, publico: [15000, 25000], local: 'central', intervalo: 60, gasto: 70, minPop: 30000, risco: true,
                    efeitos: { jovens: 8, fam: 4, com: 6, trab: 3 }, desc: 'Artista famoso do Brasil num palco gigante na Praça Central. Com Centro Cultural na cidade, a produção é melhor e vem mais gente.' },
  show_internacional: { nome: 'Show internacional', custo: 5e6, prep: 60, publico: [35000, 50000], local: 'central', intervalo: 120, gasto: 120, minPop: 60000, risco: true,
                    efeitos: { jovens: 12, fam: 5, com: 9, trab: 4, emp: 3 }, desc: 'Turnê internacional passando pela cidade. Vira notícia no país inteiro.' },
};

const Vida = (() => {
  const S = () => Sim.S;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  let uid = Date.now() % 100000;
  const noB = id => (id === 'operaria' ? 'na ' : 'no ') + Sim.bairroById(id).nome;
  const hoje = () => S().mesIndex * 31 + S().dia;
  const DIF = { facil: 0.7, medio: 1, dificil: 1.4 };

  function garantir() {
    const s = S();
    if (!s.avisos) s.avisos = [];
    if (!s.ocorrencias) s.ocorrencias = [];
    if (!s.eventos) s.eventos = [];
    if (!s.ultimoEvento) s.ultimoEvento = {};
  }

  // ------------------------------------------------------------ avisos
  function aviso(txt, tipo, alvo) {
    const s = S(); if (!s) return;
    garantir();
    s.avisos.unshift({ id: 'a' + (uid++), txt, tipo: tipo || '', data: `${s.dia}/${s.mes + 1}`, lido: false, alvo: alvo || null });
    if (s.avisos.length > 60) s.avisos.length = 60;
    Sim.emit('aviso');
  }
  function naoLidos() { const s = S(); return s && s.avisos ? s.avisos.filter(a => !a.lido).length : 0; }
  function marcarLidos() { const s = S(); if (!s || !s.avisos || !s.avisos.some(a => !a.lido)) return; s.avisos.forEach(a => a.lido = true); Sim.emit('aviso'); }

  // ------------------------------------------------------- ocorrências
  const temPredio = t => S().lotes.some(l => l.predio === t);
  const contrato = id => typeof Licitacoes !== 'undefined' && Licitacoes.contratoAtivo && Licitacoes.contratoAtivo(id);

  function novaOcorrencia(forcarTipo) {
    const s = S(); garantir();
    const chuva = [11, 0, 1, 2].includes(s.mes);
    const pesos = { buraco: 3, vazamento: 2, lixo: contrato('coleta') ? 0.5 : 2.5, arvore: chuva ? 2 : 1, incendio: chuva ? 0.3 : 1.5,
                    acidente: 2 / (1 + (s.sinalizacao || 0) * 0.3), alagamento: chuva ? 2 : 0 };
    let tipo = forcarTipo;
    if (!tipo) {
      let r = Math.random() * Object.values(pesos).reduce((a, b) => a + b, 0);
      for (const k in pesos) { r -= pesos[k]; if (r <= 0) { tipo = k; break; } }
    }
    const t = TIPOS_OCORRENCIA[tipo];
    // bairro sorteado pela população
    let r = Math.random() * Sim.popTotal(), bairro = BAIRROS[0].id;
    for (const b of BAIRROS) { r -= s.bairros[b.id].pop; if (r <= 0) { bairro = b.id; break; } }
    const o = { id: 'oc' + (uid++), tipo, bairro, x: null, y: null, criada: hoje(), status: 'aberta', fim: null, seed: Math.floor(Math.random() * 1e6) };
    s.ocorrencias.push(o);
    // resolvidas sozinhas por serviços contratados ou prédios
    if (t.servico && contrato(t.servico)) { o.status = 'reparo'; o.fim = hoje() + t.dias; o.auto = 'contrato'; }
    if (t.predio && temPredio(t.predio)) { o.status = 'reparo'; o.fim = hoje() + 1; o.auto = 'bombeiros'; }
    if (tipo === 'acidente') { o.fim = hoje() + 1; }   // os carros saem no dia seguinte
    aviso(o.auto ? `${t.nome} ${noB(bairro)}: ${o.auto === 'bombeiros' ? 'os bombeiros da cidade já estão no local' : 'a empresa contratada já está resolvendo'}.`
                 : `${t.nome} ${noB(bairro)}. Clique no alerta no mapa para resolver.`, o.auto ? '' : 'alerta', { ocorrencia: o.id });
    Sim.emit('ocorrencia', o);
    return o;
  }

  function resolver(id) {
    const s = S(), o = s.ocorrencias.find(x => x.id === id); if (!o || o.status !== 'aberta') return false;
    const t = TIPOS_OCORRENCIA[o.tipo];
    s.caixa -= t.custo;
    o.status = 'reparo'; o.fim = hoje() + t.dias;
    if (o.tipo === 'acidente') s.sinalizacao = (s.sinalizacao || 0) + 1;
    s.humor.bairros[o.bairro] = (s.humor.bairros[o.bairro] || 0) + 0.8;
    Sim.emit('ocorrencia', o); Sim.emit('mudou');
    return true;
  }

  function diaOcorrencias() {
    const s = S(), d = hoje();
    for (const o of s.ocorrencias.slice()) {
      const t = TIPOS_OCORRENCIA[o.tipo];
      if (o.status === 'reparo' && d >= o.fim) {
        s.ocorrencias = s.ocorrencias.filter(x => x !== o);
        Sim.emit('ocorrencia', o);
      } else if (o.status === 'aberta' && o.tipo === 'acidente' && d >= o.fim && !o.carrosSairam) {
        o.carrosSairam = true; Sim.emit('ocorrencia', o);   // fica só o pedido de sinalização
      }
      if (o.status === 'aberta' && d >= o.criada + t.prazo) {
        s.ocorrencias = s.ocorrencias.filter(x => x !== o);
        s.humor.bairros[o.bairro] = (s.humor.bairros[o.bairro] || 0) + t.efeito;
        if (o.tipo === 'incendio') s.humor.global -= 1;
        Sim.noticia(3, `${t.nome} ${noB(o.bairro)}: moradores reclamam do descaso`, 'Prefeitura não apareceu');
        aviso(`${t.nome} ${noB(o.bairro)} ficou sem solução. O bairro ficou irritado.`, 'ruim');
        Sim.emit('ocorrencia', o);
      }
    }
    const abertas = s.ocorrencias.length;
    const chance = 0.12 * (DIF[s.dificuldade] || 1) * (1 + Sim.popTotal() / 60000);
    if (abertas < 5 && Math.random() < chance) novaOcorrencia();
  }

  // ------------------------------------------------------------ eventos
  // a Praça Central recebe tudo; as praças de bairro só os eventos pequenos
  function locais(tipo) {
    const t = TIPOS_EVENTO[tipo];
    return S().lotes.filter(l => l.predio === 'praca' && !l.obra && (t.local !== 'central' || l.central))
      .sort((a, b) => (b.central ? 1 : 0) - (a.central ? 1 : 0))
      .map(l => ({ loteId: l.id, nome: l.central ? 'Praça Central' : `${PREDIOS[l.predio].nome} (${Sim.bairroById(l.bairro).nome})`, bairro: l.bairro }));
  }
  function patrocinio(tipo) {
    const t = TIPOS_EVENTO[tipo], s = S();
    const nomes = []; let frac = 0;
    for (const e of (s.empresas || []).filter(x => x.status === 'operando')) {
      const cultura = e.contrapartidas.some(c => c.id === 'cultura' && c.status === 'cumprida');
      frac += cultura ? 0.2 : 0.06; nomes.push(e.nome);
    }
    frac = Math.min(0.6, frac);
    return { valor: Math.round(t.custo * frac / 1e3) * 1e3, nomes: nomes.slice(0, 3), mais: Math.max(0, nomes.length - 3) };
  }
  function verba(tipo) {
    if (typeof Recursos === 'undefined') return { cv: null, valor: 0 };
    const cv = Recursos.convenioPara('evento', 'evento');
    if (!cv) return { cv: null, valor: 0 };
    const t = TIPOS_EVENTO[tipo], pat = patrocinio(tipo).valor;
    return { cv, valor: Math.round(Math.min(cv.valor, (t.custo - pat) * (1 - cv.contra))) };
  }
  function podeAgendar(tipo) {
    const t = TIPOS_EVENTO[tipo], s = S(); garantir();
    if (t.minPop && Sim.popTotal() < t.minPop) return { ok: false, motivo: `Precisa de ${t.minPop.toLocaleString('pt-BR')} habitantes` };
    if (!locais(tipo).length) return { ok: false, motivo: 'Precisa de uma praça' };
    if (s.eventos.some(e => e.tipo === tipo && e.status === 'agendado')) return { ok: false, motivo: 'Já está agendado' };
    const ult = s.ultimoEvento[tipo];
    if (ult != null && hoje() - ult < t.intervalo) return { ok: false, motivo: `Pode repetir em ${t.intervalo - (hoje() - ult)} dias` };
    return { ok: true };
  }
  // quantos eventos aconteceram nos últimos 30 dias (público cansa de festa toda semana)
  function cansaco() { const s = S(); return (s.eventos || []).filter(e => e.status === 'feito' && hoje() - e.dia < 30).length; }
  function previsao(tipo) {
    const t = TIPOS_EVENTO[tipo];
    const fator = 1 / (1 + 0.4 * cansaco()) * ((t.meses || []).includes(S().mes) ? 1.5 : 1);
    const efeitos = {}; for (const k in t.efeitos) efeitos[k] = Math.round(t.efeitos[k] * fator * 10) / 10;
    const pat = patrocinio(tipo), vb = verba(tipo);
    return { custo: t.custo, patrocinio: pat, verba: vb.valor, liquido: Math.max(0, t.custo - pat.valor - vb.valor), efeitos, fator,
             publico: Math.round((t.publico[0] + t.publico[1]) / 2 * Math.min(2, 0.7 + Sim.popTotal() / 80000)) };
  }
  function agendar(tipo, loteId) {
    const s = S(); garantir();
    const t = TIPOS_EVENTO[tipo];
    if (!podeAgendar(tipo).ok) return null;
    const loc = locais(tipo).find(l => l.loteId === loteId) || locais(tipo)[0];
    const pv = previsao(tipo), vb = verba(tipo);
    s.caixa -= pv.liquido;
    if (vb.cv && vb.valor) { vb.cv.valor -= vb.valor; vb.cv.status = vb.cv.valor > 20e3 ? 'aceito' : 'usado'; }
    const ev = { id: 'ev' + (uid++), tipo, loteId: loc.loteId, bairro: loc.bairro, local: loc.nome, dia: hoje() + t.prep, status: 'agendado',
                 pago: pv.liquido, patrocinio: pv.patrocinio.valor, verba: vb.valor, quando: dataDe(hoje() + t.prep) };
    s.eventos.push(ev);
    s.ultimoEvento[tipo] = hoje();
    Sim.noticia(3, `Prefeitura anuncia: ${t.nome.toLowerCase()} no dia ${ev.quando}`, `${loc.nome}${pv.patrocinio.valor ? ' · com patrocínio de empresas da cidade' : ''}`);
    aviso(`${t.nome} agendado para ${ev.quando} em ${loc.nome}.`, 'ouro', { lote: loc.loteId });
    Sim.emit('evento', ev); Sim.emit('mudou');
    return ev;
  }
  // data "12/3" de um dia absoluto (mesIndex*31+dia), aproximada
  function dataDe(abs) {
    const s = S();
    let mi = Math.floor(abs / 31), d = abs - mi * 31;
    if (d === 0) { mi--; d = 31; }
    let m = s.mes + (mi - s.mesIndex), a = s.ano;
    while (m > 11) { m -= 12; a++; }
    const dm = Sim.diasNoMes(m, a);
    if (d > dm) { d -= dm; m++; if (m > 11) { m = 0; a++; } }
    return `${d}/${m + 1}`;
  }
  function diaEventos() {
    const s = S(), d = hoje();
    for (const ev of s.eventos) {
      if (ev.status === 'acontecendo' && d > ev.dia) { ev.status = 'feito'; Sim.emit('evento', ev); }
      if (ev.status !== 'agendado' || d < ev.dia) continue;
      const t = TIPOS_EVENTO[ev.tipo];
      const pv = previsao(ev.tipo);
      const chuva = Math.random() < ([11, 0, 1, 2].includes(s.mes) ? 0.25 : 0.1);
      const cultura = t.local === 'central' && S().lotes.some(l => l.predio === 'cultura') ? 1.25 : 1;
      let publico = Math.round(rnd(...t.publico) * Math.min(2, 0.7 + Sim.popTotal() / 80000) * (chuva ? 0.5 : 1) * cultura);
      const f = pv.fator * (chuva ? 0.5 : 1);
      for (const k in t.efeitos) s.humor.grupos[k] = (s.humor.grupos[k] || 0) + t.efeitos[k] * f;
      s.humor.bairros[ev.bairro] = (s.humor.bairros[ev.bairro] || 0) + 1 * f;
      const renda = publico * t.gasto * 0.06;   // ISS e taxas do comércio que vendeu
      s.caixa += renda;
      let extra = chuva ? 'A chuva espantou parte do público' : `Comércio vendeu bem: ${Sim.fmtDinheiro(renda)} em impostos`;
      if (t.risco) {
        const seg = Sim.coberturaCidade(Sim.calcularCobertura(), 'seguranca');
        if (Math.random() < (seg < 0.6 ? 0.35 : 0.08)) {
          s.humor.grupos.idosos = (s.humor.grupos.idosos || 0) - 2; s.humor.grupos.fam = (s.humor.grupos.fam || 0) - 1.5;
          extra = 'Briga no fim do show e falta de policiamento viram assunto na cidade';
        }
      }
      ev.status = 'acontecendo'; ev.publico = publico; ev.chuva = chuva;
      Sim.noticia(t.custo >= 1e6 ? 8 : 4, `${t.nome} reúne ${publico.toLocaleString('pt-BR')} pessoas em ${ev.local}`, extra);
      aviso(`Hoje tem ${t.nome.toLowerCase()} em ${ev.local}: ${publico.toLocaleString('pt-BR')} pessoas.${chuva ? ' Choveu.' : ''}`, 'ouro', { lote: ev.loteId });
      Sim.emit('evento', ev); Sim.emit('mudou');
    }
    if (s.eventos.length > 30) s.eventos = s.eventos.filter(e => e.status !== 'feito' || d - e.dia < 60);
  }
  function eventoHoje() { const s = S(); return s && s.eventos ? s.eventos.find(e => e.status === 'acontecendo') : null; }


  // ---------------------------------------------------------- protestos
  // quando um grupo está muito insatisfeito, ele vai para a Praça Central
  const TEMAS = {
    'cat:saude': { tema: 'saúde', slogans: ['Queremos saúde!', 'Mais médicos já!', 'Fila de 8 meses não!'], faixa: 'SAÚDE JÁ' },
    'cat:educacao': { tema: 'escolas', slogans: ['Escola de qualidade!', 'Sala com 40 alunos não!'], faixa: 'EDUCAÇÃO JÁ' },
    'cat:creche': { tema: 'creches', slogans: ['Vaga na creche já!', 'Mãe precisa trabalhar!'], faixa: 'CRECHE PARA TODOS' },
    'cat:seguranca': { tema: 'segurança', slogans: ['Queremos segurança!', 'Cadê a Guarda?'], faixa: 'PAZ NO BAIRRO' },
    'cat:incendio': { tema: 'bombeiros', slogans: ['Bombeiro aqui já!', 'Não dá pra esperar Cerrado Alto!'], faixa: 'BOMBEIROS JÁ' },
    'cat:lazer': { tema: 'lazer', slogans: ['Praça e quadra pra molecada!', 'Lazer é direito!'], faixa: 'LAZER JÁ' },
    'iptu': { tema: 'IPTU', slogans: ['IPTU abusivo!', 'Abaixa o IPTU!'], faixa: 'IPTU JUSTO' },
    'iss': { tema: 'impostos', slogans: ['Imposto alto fecha loja!', 'Menos ISS!'], faixa: 'MENOS IMPOSTO' },
    'emprego': { tema: 'emprego', slogans: ['Queremos emprego!', 'Trabalho já!', 'Cadê as fábricas?'], faixa: 'EMPREGO JÁ' },
    'geral': { tema: 'a gestão', slogans: ['Fora, prefeito!', 'Cadê as promessas?', 'Prefeitura não ouve!'], faixa: 'QUEREMOS MUDANÇA' },
  };
  function temaAtual(grupo) {
    const s = S();
    if (Sim.aprovCidade() < 40 && Math.random() < 0.3) return 'geral';
    if (grupo === 'com' && s.impostos.iss > 3.5 && Math.random() < 0.6) return 'iss';
    const conv = k => TEMAS[k] ? k : /iptu/.test(k) ? 'iptu' : null;
    try {
      const probs = Sim.resumoNecessidades().problemas;
      // o problema que mais pesa para esse grupo; às vezes o segundo
      const doGrupo = probs.filter(p => p.grupos.includes(grupo) && conv(p.k)).map(p => conv(p.k));
      if ((grupo === 'trab' || grupo === 'jovens') && s.desemprego > 10) doGrupo.unshift('emprego');
      if (doGrupo.length) return doGrupo[Math.random() < 0.65 ? 0 : Math.min(doGrupo.length - 1, 1)];
      const qualquer = probs.map(p => conv(p.k)).filter(Boolean);
      if (qualquer.length) return qualquer[0];
    } catch (e) {}
    return 'geral';
  }
  function checarProtesto() {
    const s = S(), d = hoje();
    if (s.protesto && s.protesto.status === 'ativo') {
      if (d >= s.protesto.fim) encerrarProtesto('acabou');
      return;
    }
    if (s.protestoProx && d < s.protestoProx) return;
    if (eventoHoje()) return;
    // grupo mais irritado
    let pior = null, valor = 100;
    for (const g of GRUPOS) { const v = Sim.aprovGrupo(g.id); if (v < valor) { valor = v; pior = g.id; } }
    const geral = Sim.aprovCidade();
    const chance = (Math.max(0, 40 - valor) / 250 + Math.max(0, 45 - geral) / 300) * (DIF[s.dificuldade] || 1);
    if (Math.random() < chance) iniciarProtesto(pior);
  }
  function iniciarProtesto(grupo, temaForcado) {
    const s = S(); garantir();
    const k = temaForcado || temaAtual(grupo);
    const t = TEMAS[k] || TEMAS.geral;
    const raiva = Math.max(0, 50 - Sim.aprovGrupo(grupo));
    const pessoas = Math.round(clamp(150 + raiva * 40 + Sim.popTotal() / 200, 150, 3000));
    s.protesto = { id: 'pr' + (uid++), grupo, tema: k, nomeTema: t.tema, faixa: t.faixa, slogans: t.slogans, pessoas, inicio: hoje(), fim: hoje() + 2, status: 'ativo' };
    s.protestoProx = hoje() + 25;
    const nomeG = GRUPOS.find(g => g.id === grupo).nome.toLowerCase();
    Sim.noticia(5, `Protesto na Praça Central: ${pessoas.toLocaleString('pt-BR')} pessoas cobram ${t.tema}`, `Maioria de ${nomeG} · "${t.slogans[0]}"`);
    aviso(`Protesto na Praça Central: ${pessoas.toLocaleString('pt-BR')} pessoas cobram ${t.tema}. Clique na praça para responder.`, 'alerta', { lote: 'P4' });
    Sim.emit('protesto', s.protesto); Sim.emit('mudou');
    return s.protesto;
  }
  // respostas do prefeito
  function responderProtesto(acao) {
    const s = S(), p = s.protesto; if (!p || p.status !== 'ativo') return null;
    const gh = (g, v) => s.humor.grupos[g] = (s.humor.grupos[g] || 0) + v;
    let txt;
    if (acao === 'comissao') {
      gh(p.grupo, 2.5); s.humor.global += 0.5;
      txt = `Prefeito recebe comissão de manifestantes e promete estudar as reivindicações sobre ${p.nomeTema}`;
      p.resposta = 'comissao'; p.fim = hoje() + 1;
    } else if (acao === 'discurso') {
      const bom = Math.random() < clamp(Sim.aprovCidade() / 80, 0.25, 0.8);
      gh(p.grupo, bom ? 3.5 : -2); s.humor.global += bom ? 1 : -1;
      if (!bom) s.candidato.forca = clamp(s.candidato.forca + 2, 0, 95);
      txt = bom ? `Prefeito desce até a praça, fala com os manifestantes e é aplaudido` : `Prefeito tenta discursar na praça e é vaiado pelos manifestantes`;
      p.resposta = bom ? 'aplauso' : 'vaia'; p.fim = hoje() + 1;
    } else if (acao === 'guarda') {
      gh(p.grupo, -4); gh('jovens', -2); s.humor.global -= 1.5;
      s.candidato.forca = clamp(s.candidato.forca + 3, 0, 95);
      txt = `Guarda Municipal dispersa protesto na Praça Central; oposição fala em truculência`;
      p.resposta = 'guarda';
      encerrarProtesto('disperso');
    }
    Sim.noticia(5, txt, p.faixa);
    aviso(txt + '.', acao === 'guarda' || p.resposta === 'vaia' ? 'ruim' : 'ouro', { lote: 'P4' });
    Sim.emit('protesto', p); Sim.emit('mudou');
    return p.resposta;
  }
  function encerrarProtesto(motivo) {
    const s = S(), p = s.protesto; if (!p) return;
    if (motivo === 'acabou' && !p.resposta) {
      // ninguém da prefeitura apareceu
      s.humor.grupos[p.grupo] = (s.humor.grupos[p.grupo] || 0) - 2;
      if (p.pessoas > 800) s.candidato.forca = clamp(s.candidato.forca + 1.5, 0, 95);
      Sim.noticia(3, `Manifestantes deixam a praça sem resposta da prefeitura`, `Protesto por ${p.nomeTema}`);
    }
    p.status = 'encerrado';
    s.protesto = null;
    Sim.emit('protesto', p);
  }
  function protestoAtivo() { const s = S(); return s && s.protesto && s.protesto.status === 'ativo' ? s.protesto : null; }

  // -------------------------------------------------------- ganchos
  function dia() { garantir(); diaOcorrencias(); diaEventos(); checarProtesto(); }

  return { garantir, aviso, naoLidos, marcarLidos, novaOcorrencia, resolver, dia, locais, patrocinio, verba, podeAgendar, previsao, agendar,
           eventoHoje, dataDe, hoje, TIPOS_OCORRENCIA, TIPOS_EVENTO, iniciarProtesto, responderProtesto, protestoAtivo, TEMAS };
})();
