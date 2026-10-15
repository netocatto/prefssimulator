// =====================================================================
//  PREFEITO — dados fixos do jogo
//  Tudo que é "conteúdo" (bairros, prédios, promessas, vereadores...)
//  fica aqui, separado da lógica, para facilitar ajustes e expansão.
// =====================================================================

const TILE = 32;          // pixels por tile (arte em alta resolução)
const MAP_W = 80;         // largura do mapa em tiles
const MAP_H = 50;         // altura do mapa em tiles
const MES_SEGUNDOS = 600; // 1 mês = 10 minutos reais (velocidade 1x)
const ANO_INICIAL = 2029;

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MESES_CURTO = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

// ---------------------------------------------------------------------
// Grupos da população
// ---------------------------------------------------------------------
const GRUPOS = [
  { id: 'trab',   nome: 'Trabalhadores', cor: '#e8a33c' },
  { id: 'com',    nome: 'Comerciantes',  cor: '#4aa8e8' },
  { id: 'emp',    nome: 'Empresários',   cor: '#a57be8' },
  { id: 'idosos', nome: 'Idosos',        cor: '#d9d4c7' },
  { id: 'jovens', nome: 'Jovens',        cor: '#5fd17a' },
  { id: 'fam',    nome: 'Famílias',      cor: '#f07a9a' },
];

// O que cada grupo valoriza (pesos de serviços) e quanto sente cada imposto
const PREFS = {
  trab:   { cat: { saude: .30, educacao: .10, creche: .10, seguranca: .30, incendio: .05, lazer: .15 }, iptu: 1.0, iss: 0.2, lixo: 1.0, ind: 0,   desemprego: 1.0 },
  com:    { cat: { saude: .15, educacao: .05, seguranca: .50, incendio: .20, lazer: .10 },              iptu: 0.8, iss: 1.6, lixo: 0.3, ind: 0,   desemprego: 0.4 },
  emp:    { cat: { saude: .10, educacao: .15, seguranca: .40, incendio: .35 },                          iptu: 1.0, iss: 1.2, lixo: 0.2, ind: 1.6, desemprego: 0.2 },
  idosos: { cat: { saude: .60, seguranca: .25, incendio: .05, lazer: .10 },                             iptu: 1.3, iss: 0,   lixo: 0.6, ind: 0,   desemprego: 0.2 },
  jovens: { cat: { saude: .15, educacao: .35, seguranca: .10, lazer: .40 },                             iptu: 0.3, iss: 0.1, lixo: 0.3, ind: 0,   desemprego: 1.6 },
  fam:    { cat: { saude: .25, educacao: .30, creche: .35, seguranca: .10 },                            iptu: 1.0, iss: 0,   lixo: 0.8, ind: 0,   desemprego: 0.7 },
};

// ---------------------------------------------------------------------
// Categorias de serviço público
//  base   = cobertura que já existe sem prédio municipal (estado, região)
//  demanda = fração da população que precisa do serviço
// ---------------------------------------------------------------------
const CATS = {
  saude:     { nome: 'Saúde',          base: 0.15, demanda: 1.00 },
  educacao:  { nome: 'Educação',       base: 0.08, demanda: 0.16 },
  creche:    { nome: 'Creches',        base: 0.05, demanda: 0.04 },
  seguranca: { nome: 'Segurança',      base: 0.35, demanda: 1.00 },
  incendio:  { nome: 'Bombeiros',      base: 0.30, demanda: 1.00 },
  lazer:     { nome: 'Lazer e cultura',base: 0.15, demanda: 1.00 },
};

// ---------------------------------------------------------------------
// Bairros  (rect = [x1, y1, x2, y2] em tiles, inclusivo)
// ---------------------------------------------------------------------
const BAIRROS = [
  { id: 'centro',   nome: 'Centro',              pop: 7000,  venal: 260000, rect: [28, 0, 46, 41],
    comp: { trab: .25, com: .25, emp: .05, idosos: .20, jovens: .12, fam: .13 } },
  { id: 'operaria', nome: 'Vila Operária',       pop: 11000, venal: 115000, rect: [0, 22, 26, 41],
    comp: { trab: .40, com: .05, emp: .01, idosos: .14, jovens: .18, fam: .22 } },
  { id: 'nobre',    nome: 'Jardim Nobre',        pop: 4200,  venal: 620000, rect: [0, 0, 26, 19],
    comp: { trab: .08, com: .15, emp: .25, idosos: .25, jovens: .10, fam: .17 } },
  { id: 'distrito', nome: 'Distrito Industrial', pop: 2800,  venal: 105000, rect: [48, 0, 67, 41],
    comp: { trab: .45, com: .05, emp: .20, idosos: .05, jovens: .15, fam: .10 } },
];

// Áreas que vão ser liberadas em versões futuras
const BLOQUEADOS = [
  { nome: 'Polo Leste',        rect: [68, 0, 79, 41] },
  { nome: 'Jardim das Flores', rect: [0, 45, 79, 49], rotulo: [18, 47.5] },
];

// ---------------------------------------------------------------------
// Tipos de prédio público
//  cap   = pessoas atendidas  | spill = quanto atende outros bairros (0-1)
//  custo = total da obra (pago em parcelas mensais) | manut = custo mensal
//  area  = em que área do orçamento a manutenção entra
// ---------------------------------------------------------------------
const PREDIOS = {
  ubs:       { nome: 'Posto de Saúde (UBS)',     curto: 'UBS',        cat: 'saude',     cap: 6000,  spill: .25, custo: 1.4e6, meses: 4,  manut: 140e3,  func: 25, area: 'saude',
               desc: 'Atendimento básico. Atende bem o próprio bairro e um pouco os vizinhos.' },
  hospital:  { nome: 'Hospital Municipal',       curto: 'Hospital',   cat: 'saude',     cap: 16000, spill: .85, custo: 18e6,  meses: 12, manut: 1.2e6,  func: 260, area: 'saude',
               desc: 'Atende a cidade inteira e aumenta o repasse do SUS. Obra cara e demorada.' },
  escola:    { nome: 'Escola Municipal (EMEF)',  curto: 'Escola',     cat: 'educacao',  cap: 900,   spill: .20, custo: 3.6e6, meses: 6,  manut: 260e3,  func: 45, area: 'educacao',
               desc: '900 vagas. Cada matrícula aumenta o repasse do FUNDEB.' },
  creche:    { nome: 'Creche (EMEI)',            curto: 'Creche',     cat: 'creche',    cap: 200,   spill: .20, custo: 1.6e6, meses: 4,  manut: 120e3,  func: 22, area: 'educacao',
               desc: '200 vagas para crianças pequenas. A fila da creche é o drama das famílias.' },
  guarda:    { nome: 'Base da Guarda Municipal', curto: 'Guarda',     cat: 'seguranca', cap: 9000,  spill: .30, custo: 1.9e6, meses: 4,  manut: 190e3,  func: 40, area: 'seguranca',
               desc: 'Patrulha o bairro e ajuda a Polícia Militar.' },
  bombeiros: { nome: 'Posto de Bombeiros',       curto: 'Bombeiros',  cat: 'incendio',  cap: 22000, spill: .85, custo: 4.2e6, meses: 6,  manut: 270e3,  func: 30, area: 'seguranca',
               desc: 'Hoje a cidade depende dos bombeiros de Cerrado Alto. Indústrias adoram.' },
  praca:     { nome: 'Praça com quadra',         curto: 'Praça',      cat: 'lazer',     cap: 5000,  spill: .15, custo: 0.7e6, meses: 2,  manut: 30e3,   func: 3, area: 'cultura',
               desc: 'Barata e rápida. Recebe a festa junina do bairro.' },
  cultura:   { nome: 'Centro Cultural',          curto: 'C. Cultural',cat: 'lazer',     cap: 12000, spill: .60, custo: 3.2e6, meses: 6,  manut: 150e3,  func: 18, area: 'cultura',
               desc: 'Teatro, oficinas e biblioteca. Atrai gente de outros bairros.' },
};

// Prédios especiais (não construíveis, só decoração com função)
const ESPECIAIS = {
  prefeitura: { nome: 'Prefeitura Municipal' },
  camara:     { nome: 'Câmara de Vereadores' },
  igreja:     { nome: 'Igreja Matriz' },
};

// ---------------------------------------------------------------------
// Lotes (3x3 tiles). tipo: 'publico' ou 'particular' (exige desapropriação)
// ---------------------------------------------------------------------
const LOTES_INICIAIS = [
  // prédios que já existem no começo
  { id: 'P1', x: 40, y: 17, bairro: 'centro',   ocupado: 'prefeitura' },
  { id: 'P2', x: 43, y: 17, bairro: 'centro',   ocupado: 'camara' },
  { id: 'P3', x: 29, y: 6,  bairro: 'centro',   ocupado: 'igreja' },
  // a Praça Central ocupa um quarteirão inteiro, de frente para a igreja e ao lado da prefeitura
  { id: 'P4', x: 28, y: 10, w: 9, h: 10, bairro: 'centro', ocupado: 'praca', central: true },
  { id: 'P5', x: 29, y: 22, bairro: 'centro',   ocupado: 'escola' },
  { id: 'P6', x: 33, y: 22, bairro: 'centro',   ocupado: 'ubs' },
  { id: 'P7', x: 40, y: 22, bairro: 'centro',   ocupado: 'creche' },
  { id: 'P8', x: 43, y: 22, bairro: 'centro',   ocupado: 'guarda' },
  { id: 'P9', x: 2,  y: 22, bairro: 'operaria', ocupado: 'escola' },
  { id: 'P10',x: 6,  y: 22, bairro: 'operaria', ocupado: 'ubs' },
  { id: 'P11',x: 2,  y: 17, bairro: 'nobre',    ocupado: 'escola' },
  // lotes livres
  { id: 'L1', x: 16, y: 17, bairro: 'nobre',    tipo: 'publico' },
  { id: 'L2', x: 20, y: 6,  bairro: 'nobre',    tipo: 'particular', desapropriacao: 2.4e6 },
  { id: 'L3', x: 2,  y: 6,  bairro: 'nobre',    tipo: 'publico' },
  { id: 'L4', x: 16, y: 22, bairro: 'operaria', tipo: 'publico' },
  { id: 'L5', x: 2,  y: 32, bairro: 'operaria', tipo: 'publico' },
  { id: 'L6', x: 16, y: 32, bairro: 'operaria', tipo: 'publico' },
  { id: 'L7', x: 21, y: 38, bairro: 'operaria', tipo: 'particular', desapropriacao: 0.6e6 },
  { id: 'L8', x: 29, y: 32, bairro: 'centro',   tipo: 'publico' },
  { id: 'L9', x: 40, y: 32, bairro: 'centro',   tipo: 'particular', desapropriacao: 1.3e6 },
  { id: 'L10',x: 33, y: 6,  bairro: 'centro',   tipo: 'particular', desapropriacao: 1.5e6 },
  { id: 'L11',x: 43, y: 6,  bairro: 'centro',   tipo: 'publico' },
  { id: 'L12',x: 49, y: 22, bairro: 'distrito', tipo: 'publico' },
  { id: 'L13',x: 60, y: 22, bairro: 'distrito', tipo: 'publico' },
  { id: 'L14',x: 49, y: 32, bairro: 'distrito', tipo: 'particular', desapropriacao: 0.5e6 },
];

// ---------------------------------------------------------------------
// Cidades vizinhas rivais
// ---------------------------------------------------------------------
const RIVAIS = [
  { id: 'ribeirao', nome: 'Ribeirão Torto',      dir: 'Oeste',    km: 14, pop: 31000, iss: 2.50, aprov: 52, cresc: 0.0010,
    perfil: 'Agrícola, com ISS baixo para atrair comércio.', prefeito: 'Aldo Fonseca' },
  { id: 'pedra',    nome: 'Pedra Grande do Sul', dir: 'Sul',      km: 22, pop: 58000, iss: 3.50, aprov: 47, cresc: 0.0012,
    perfil: 'Polo regional de saúde. Tem o hospital regional que atende sua cidade.', prefeito: 'Heloísa Vidal' },
  { id: 'monte',    nome: 'Monte Raso',          dir: 'Norte',    km: 18, pop: 27000, iss: 2.75, aprov: 61, cresc: 0.0040,
    perfil: 'Rival ambiciosa, crescendo rápido e de olho nas suas empresas.', prefeito: 'Renato Siqueira' },
  { id: 'cerrado',  nome: 'Cerrado Alto',        dir: 'Leste',    km: 16, pop: 44000, iss: 3.00, aprov: 50, cresc: 0.0015,
    perfil: 'Industrial. O posto de bombeiros regional fica lá.', prefeito: 'Marcos Tavares' },
  { id: 'serra',    nome: 'Serra do Jacu',       dir: 'Nordeste', km: 25, pop: 19000, iss: 3.25, aprov: 55, cresc: 0.0008,
    perfil: 'Estância turística, forte em festas e eventos.', prefeito: 'Lúcia Amaral' },
];

// ---------------------------------------------------------------------
// Câmara de Vereadores (11 cadeiras: cidade de 15 a 30 mil habitantes)
// lado: base (aliados), indep (independentes), opos (oposição)
// ---------------------------------------------------------------------
const PARTIDOS = {
  AP:  'Aliança Popular',
  MCV: 'Movimento Cidade Viva',
  PTR: 'Partido Trabalhista Regional',
  PVA: 'Partido Verde-Amarelo',
  FLP: 'Frente Liberal Paulista',
};
const PARTIDO_PREFEITO = 'AP';

const VEREADORES = [
  { id: 'v1',  nome: 'Tonhão Ribeiro',        partido: 'AP',  bairro: 'operaria', lado: 'base',  lealdade: 78 },
  { id: 'v2',  nome: 'Cida Moraes',           partido: 'AP',  bairro: 'centro',   lado: 'base',  lealdade: 75 },
  { id: 'v3',  nome: 'Jorge Takeda',          partido: 'MCV', bairro: 'nobre',    lado: 'base',  lealdade: 70 },
  { id: 'v4',  nome: 'Neusa Prado',           partido: 'MCV', bairro: 'operaria', lado: 'base',  lealdade: 68 },
  { id: 'v5',  nome: 'Prof. Elias Nunes',     partido: 'PTR', bairro: 'operaria', lado: 'indep', lealdade: 52 },
  { id: 'v6',  nome: 'Dr. Fábio Lacerda',     partido: 'PVA', bairro: 'nobre',    lado: 'indep', lealdade: 48 },
  { id: 'v7',  nome: 'Rosângela Duarte',      partido: 'PTR', bairro: 'centro',   lado: 'indep', lealdade: 50 },
  { id: 'v8',  nome: 'Valdir da Padaria',     partido: 'FLP', bairro: 'centro',   lado: 'opos',  lealdade: 28 },
  { id: 'v9',  nome: 'Marta Quintino',        partido: 'FLP', bairro: 'distrito', lado: 'opos',  lealdade: 24 },
  { id: 'v10', nome: 'Edson Bragança',        partido: 'FLP', bairro: 'nobre',    lado: 'opos',  lealdade: 15 },
  { id: 'v11', nome: 'Zé Carlos do Sindicato',partido: 'PTR', bairro: 'distrito', lado: 'opos',  lealdade: 30 },
];

const PEDIDOS_VEREADOR = [
  'Recapear a rua principal do bairro',
  'Reformar a quadra de esportes',
  'Trocar a iluminação da praça por LED',
  'Ônibus circular aos domingos',
  'Mutirão de limpeza de terrenos',
  'Construir uma academia ao ar livre',
  'Reformar o velório municipal',
  'Ampliar o horário do posto de saúde',
  'Cobrir o ponto de ônibus da avenida',
  'Patrocinar o campeonato de futebol amador',
  'Instalar lombadas perto da escola',
  'Reformar o banheiro da rodoviária',
];

// Candidatos da oposição (um por eleição)
const CANDIDATOS_RIVAIS = [
  { nome: 'Otávio Bragança',  partido: 'FLP', bordao: 'A cidade está parada.' },
  { nome: 'Regina Salles',    partido: 'PTR', bordao: 'Quem trabalha não pode pagar a conta.' },
  { nome: 'Coronel Moacir',   partido: 'FLP', bordao: 'Ordem e trabalho de verdade.' },
  { nome: 'Dra. Beatriz Leme',partido: 'PVA', bordao: 'Gestão com ciência e transparência.' },
  { nome: 'Juninho Pimenta',  partido: 'MCV', bordao: 'Renovação já!' },
];

// ---------------------------------------------------------------------
// Promessas de campanha
//  peso  = quanto vale na eleição (mais difícil, mais votos)
//  tipo  = 'meta' (precisa acontecer) ou 'manter' (não pode quebrar)
// ---------------------------------------------------------------------
const PROMESSAS = [
  { id: 'hospital',   titulo: 'Construir o Hospital Municipal', peso: 3, tipo: 'meta',
    desc: 'Entregar um hospital funcionando até a eleição.', grupos: ['idosos','fam','trab'] },
  { id: 'creche',     titulo: 'Zerar a fila das creches',       peso: 3, tipo: 'meta',
    desc: 'Cobertura de creches de pelo menos 90% na cidade.', grupos: ['fam'] },
  { id: 'empregos',   titulo: 'Gerar empregos',                 peso: 3, tipo: 'meta',
    desc: 'Desemprego em 6% ou menos.', grupos: ['trab','jovens'] },
  { id: 'escolas',    titulo: 'Construir 2 escolas',            peso: 2, tipo: 'meta',
    desc: 'Inaugurar duas escolas municipais neste mandato.', grupos: ['fam','jovens'] },
  { id: 'seguranca',  titulo: 'Cidade mais segura',             peso: 2, tipo: 'meta',
    desc: 'Cobertura de segurança de pelo menos 90% na cidade.', grupos: ['com','idosos','emp'] },
  { id: 'iptu',       titulo: 'Baixar o IPTU',                  peso: 2, tipo: 'meta',
    desc: 'IPTU médio menor do que no início do mandato.', grupos: ['idosos','fam','trab'] },
  { id: 'impostos',   titulo: 'Nenhum imposto novo',            peso: 2, tipo: 'manter',
    desc: 'Não aprovar nenhum aumento de imposto ou taxa.', grupos: ['com','emp'] },
  { id: 'bombeiros',  titulo: 'Posto de bombeiros próprio',     peso: 1, tipo: 'meta',
    desc: 'Parar de depender de Cerrado Alto.', grupos: ['emp','com'] },
  { id: 'cultura',    titulo: 'Cultura para todos',             peso: 1, tipo: 'meta',
    desc: 'Inaugurar um Centro Cultural.', grupos: ['jovens'] },
  { id: 'contas',     titulo: 'Contas no azul',                 peso: 1, tipo: 'manter',
    desc: 'Nunca fechar um mês com o caixa negativo.', grupos: ['emp','com'] },
];

// ---------------------------------------------------------------------
// Nomes para a população (Ouvidoria)
// ---------------------------------------------------------------------
const NOMES = ['Dona Maria','Seu João','Dona Lurdes','Seu Antônio','Ana Paula','Carlos','Fernanda','Dona Benedita','Seu Sebastião','Juliana','Marcos','Patrícia','Seu Valdomiro','Gabriel','Larissa','Dona Aparecida','Rafael','Camila','Seu Osvaldo','Bruna','Diego','Dona Iracema','Thiago','Vanessa','Seu Nelson','Letícia','Dona Zilda','Rodrigo','Seu Jair','Tainá'];

// ---------------------------------------------------------------------
// Ritmo do jogo (duração de um dia em segundos reais, na velocidade 1x)
// ---------------------------------------------------------------------
const RITMOS = {
  rapido: { nome: 'Rápido', seg: 30,  desc: '1 dia = 30 segundos · 1 mês ≈ 15 minutos' },
  medio:  { nome: 'Médio',  seg: 60,  desc: '1 dia = 1 minuto · 1 mês ≈ 30 minutos' },
  lento:  { nome: 'Lento',  seg: 600, desc: '1 dia = 10 minutos · para jogar com calma' },
};

// ---------------------------------------------------------------------
// Dificuldade: situação que o prefeito herda
// ---------------------------------------------------------------------
const DIFICULDADES = {
  facil:   { nome: 'Fácil',   desc: 'Cofre cheio, dívidas pequenas, Câmara amiga e oposição fraca.',
             caixa: 15e6, admin: 2.32e6, previdencia: 0.88e6, divida: 0.3e6, humor: 16, rival: 25, lealdade: 10, desemprego: 7.5, industria: 1.04 },
  medio:   { nome: 'Médio',   desc: 'Contas equilibradas, mas sem folga. Cada escolha pesa.',
             caixa: 4.2e6, admin: 2.4e6, previdencia: 0.95e6, divida: 0.6e6, humor: 10, rival: 35, lealdade: 0, desemprego: 9, industria: 1 },
  dificil: { nome: 'Difícil', desc: 'Cofre quase vazio, precatórios atrasados, Câmara hostil e oposição forte.',
             caixa: 0.5e6, admin: 2.5e6, previdencia: 1.05e6, divida: 0.85e6, humor: 2, rival: 48, lealdade: -12, desemprego: 11.5, industria: 0.94 },
};

// Pequenos negócios que abrem (e fecham) sozinhos conforme a economia
const NEGOCIOS = ['Padaria Pão Quente', 'Lanchonete do Zé', 'Mercadinho Bom Lugar', 'Salão Beleza Pura', 'Farmácia Saúde Já', 'Pet Shop Patinhas',
  'Loja de Roupas Estilo', 'Pizzaria Forno a Lenha', 'Barbearia Navalha', 'Açougue Boi Gordo', 'Papelaria Lápis de Cor', 'Sorveteria Gelato',
  'Bar do Português', 'Oficina do Tião', 'Doceria Brigadeiro', 'Lava-Rápido Brilho', 'Loja de Celulares Conecta', 'Floricultura Ipê', 'Hortifruti Fresquinho', 'Ótica Visão'];
