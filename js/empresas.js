// =====================================================================
//  PREFEITO 8-BIT — empresas: propostas, negociação, instalação,
//  efeitos na cidade e fiscalização das contrapartidas.
//  Catálogo no topo (fácil de editar), lógica embaixo.
// =====================================================================

// ---------------------------------------------------------------------
// Catálogo. minPop = população mínima para a empresa se interessar.
//  local: 'distrito' (lote no Distrito Industrial), 'urbano' (lote em
//  bairro residencial/Centro) ou 'rural' (fora do mapa, sem lote).
//  iss = faturamento mensal sujeito a ISS · icms = cota-parte mensal
//  venal = valor do imóvel para IPTU · pede = o que a empresa quer
// ---------------------------------------------------------------------
const SETORES = {
  industria:  'Indústria', comercio: 'Comércio', servicos: 'Serviços', turismo: 'Turismo e hotelaria',
  educacao:   'Educação', logistica: 'Logística', energia: 'Energia', saude: 'Saúde', lazer: 'Lazer', infra: 'Infraestrutura',
};

const CATALOGO_EMPRESAS = [
  { id: 'calcados', nome: 'Calçados Passo Firme', setor: 'industria', sprite: 'fabrica', cor: '#c4483a', empregos: 350, invest: 18e6, meses: 8, minPop: 15000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0, icms: 110e3, venal: 22e6, pede: { isencaoIPTU: 5, infra: 0.9e6, doacaoTerreno: true }, efeitos: { trab: 2 }, seriedade: 0.8,
    desc: 'Fábrica de calçados femininos que quer vender para todo o Brasil.', negociador: 'Sr. Ademir Rossi, diretor industrial' },
  { id: 'biscoitos', nome: 'Biscoitos Doce Lar', setor: 'industria', sprite: 'fabrica', cor: '#e0a82e', empregos: 300, invest: 25e6, meses: 9, minPop: 15000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0, icms: 140e3, venal: 28e6, pede: { isencaoIPTU: 5, infra: 1.4e6 }, efeitos: { trab: 2, fam: 1 }, seriedade: 0.85,
    desc: 'Indústria de biscoitos e massas que procura mão de obra e água boa.', negociador: 'Dra. Sandra Okada, gerente de expansão' },
  { id: 'tecelagem', nome: 'Tecelagem Fio de Ouro', setor: 'industria', sprite: 'fabrica', cor: '#9b5bc9', empregos: 250, invest: 12e6, meses: 6, minPop: 12000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0, icms: 70e3, venal: 15e6, pede: { isencaoIPTU: 2, doacaoTerreno: true }, efeitos: { trab: 2 }, seriedade: 0.7,
    desc: 'Tecelagem de médio porte vinda da capital, fugindo dos custos altos.', negociador: 'Sr. Paulo Mendes, sócio' },
  { id: 'frigorifico', nome: 'Frigorífico Boi Bom', setor: 'industria', sprite: 'fabrica', cor: '#8a3a2a', empregos: 450, invest: 40e6, meses: 10, minPop: 18000, local: 'distrito', poluicao: 2, turismo: 0,
    iss: 0, icms: 200e3, venal: 35e6, pede: { isencaoIPTU: 10, infra: 2.0e6, doacaoTerreno: true }, efeitos: { trab: 3, idosos: -1 }, seriedade: 0.65,
    desc: 'Muitos empregos, mas o cheiro e o tratamento de efluentes preocupam os vizinhos.', negociador: 'Sr. Jairo Vilela, diretor de operações' },
  { id: 'usina', nome: 'Usina Canavial Paulista', setor: 'energia', sprite: null, cor: '#5ea83d', empregos: 600, invest: 120e6, meses: 14, minPop: 20000, local: 'rural', poluicao: 2, turismo: 0,
    iss: 0, icms: 380e3, venal: 0, pede: { isencaoITBI: true, infra: 3.5e6 }, efeitos: { trab: 3, idosos: -1, fam: -1 }, seriedade: 0.7,
    desc: 'Usina de etanol e açúcar na zona rural. Gera muito ICMS, mas a queimada da cana incomoda.', negociador: 'Sr. Augusto Prado Neto, conselheiro' },
  { id: 'cervejaria', nome: 'Cervejaria Serra Dourada', setor: 'industria', sprite: 'fabrica', cor: '#d9a83a', empregos: 280, invest: 60e6, meses: 10, minPop: 24000, local: 'distrito', poluicao: 1, turismo: 1,
    iss: 0.2e6, icms: 260e3, venal: 40e6, pede: { isencaoIPTU: 5, infra: 1.5e6 }, efeitos: { trab: 2, jovens: 1 }, seriedade: 0.85,
    desc: 'Cervejaria com visitação turística. Precisa de muita água tratada.', negociador: 'Sra. Helena Brandt, presidente' },
  { id: 'cd', nome: 'Rota Log Distribuição', setor: 'logistica', sprite: 'logistica', cor: '#3d8bd1', empregos: 220, invest: 30e6, meses: 8, minPop: 20000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0.8e6, icms: 90e3, venal: 30e6, pede: { isencaoIPTU: 5, reducaoISS: 5, infra: 2.5e6 }, efeitos: { trab: 2 }, seriedade: 0.8,
    desc: 'Centro de distribuição perto da rodovia. Caminhões vão encher a avenida.', negociador: 'Sr. Fábio Teixeira, diretor de logística' },
  { id: 'datacenter', nome: 'Nuvem Paulista Data Center', setor: 'servicos', sprite: 'escritorio', cor: '#2a3f73', empregos: 45, invest: 60e6, meses: 9, minPop: 20000, local: 'distrito', poluicao: 0, turismo: 0,
    iss: 2.8e6, icms: 0, venal: 50e6, pede: { isencaoIPTU: 10, infra: 1.5e6 }, efeitos: { jovens: 1, emp: 1 }, seriedade: 0.9,
    desc: 'Poucos empregos, mas muito ISS. Precisa de energia firme e fibra ótica.', negociador: 'Eng. Rafael Kato, head de infraestrutura' },
  { id: 'supermercado', nome: 'Supermercado Bom Preço', setor: 'comercio', sprite: 'mercado', cor: '#d64b4b', empregos: 120, invest: 8e6, meses: 5, minPop: 10000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 0.1e6, icms: 70e3, venal: 10e6, pede: { isencaoITBI: true, infra: 0.4e6 }, efeitos: { fam: 2, com: -2 }, seriedade: 0.85,
    desc: 'Rede regional de supermercados. Preços melhores, mas os mercadinhos sofrem.', negociador: 'Sr. Wagner Lima, gerente regional' },
  { id: 'atacarejo', nome: 'Atacarejo Compra Certa', setor: 'comercio', sprite: 'mercado', cor: '#e07a2e', empregos: 220, invest: 22e6, meses: 7, minPop: 22000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 0.15e6, icms: 130e3, venal: 20e6, pede: { isencaoIPTU: 5, doacaoTerreno: true }, efeitos: { fam: 3, com: -3 }, seriedade: 0.8,
    desc: 'Atacado e varejo num só lugar. Atrai gente das cidades vizinhas.', negociador: 'Sra. Cláudia Rocha, diretora de expansão' },
  { id: 'concessionaria', nome: 'Concessionária Rodar Bem', setor: 'comercio', sprite: 'mercado', cor: '#3466c2', empregos: 40, invest: 5e6, meses: 4, minPop: 15000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 0.3e6, icms: 40e3, venal: 6e6, pede: { isencaoITBI: true }, efeitos: { emp: 1 }, seriedade: 0.9,
    desc: 'Revenda de carros e oficina. Pequena, mas paga em dia.', negociador: 'Sr. Marcelo Dias, proprietário' },
  { id: 'callcenter', nome: 'Fala Brasil Telesserviços', setor: 'servicos', sprite: 'escritorio', cor: '#3fa45b', empregos: 500, invest: 6e6, meses: 4, minPop: 20000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 3.5e6, icms: 0, venal: 8e6, pede: { reducaoISS: 5, isencaoIPTU: 2 }, efeitos: { jovens: 3 }, seriedade: 0.65,
    desc: 'Primeiro emprego para muitos jovens. Salários baixos e alta rotatividade.', negociador: 'Sra. Patrícia Gomes, diretora de RH' },
  { id: 'ead', nome: 'Polo UniSaber EAD', setor: 'educacao', sprite: 'escritorio', cor: '#e66a8a', empregos: 25, invest: 1e6, meses: 2, minPop: 10000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 0.4e6, icms: 0, venal: 2e6, pede: { reducaoISS: 2 }, efeitos: { jovens: 3, fam: 1 }, seriedade: 0.85,
    desc: 'Polo de ensino a distância. Faculdade sem sair da cidade.', negociador: 'Prof. Renata Sales, coordenadora' },
  { id: 'faculdade', nome: 'Faculdade do Vale', setor: 'educacao', sprite: 'faculdade', cor: '#2f5592', empregos: 160, invest: 20e6, meses: 10, minPop: 24000, local: 'urbano', poluicao: 0, turismo: 1,
    iss: 2.2e6, icms: 0, venal: 25e6, pede: { doacaoTerreno: true, isencaoIPTU: 10, reducaoISS: 5 }, efeitos: { jovens: 7, fam: 3, com: 2 }, seriedade: 0.8,
    desc: 'Cursos de Direito, Enfermagem e Engenharia. Traz estudantes de toda a região.', negociador: 'Reitor Dr. Álvaro Cunha' },
  { id: 'tecnica', nome: 'Instituto Técnico Paulista', setor: 'educacao', sprite: 'faculdade', cor: '#c33a2f', empregos: 60, invest: 9e6, meses: 8, minPop: 20000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 0, icms: 0, venal: 0, pede: { doacaoTerreno: true, infra: 0.8e6 }, efeitos: { jovens: 5, trab: 3 }, qualificacao: 0.8, seriedade: 0.95,
    desc: 'Escola técnica sem fins lucrativos mantida pelas indústrias. Qualifica a mão de obra.', negociador: 'Sr. Osvaldo Nakamura, diretor regional' },
  { id: 'pousada', nome: 'Pousada Rio Manso', setor: 'turismo', sprite: 'hotel', cor: '#4e7a45', empregos: 25, invest: 3e6, meses: 4, minPop: 8000, local: 'urbano', poluicao: 0, turismo: 1,
    iss: 0.35e6, icms: 0, venal: 4e6, pede: { isencaoIPTU: 2 }, efeitos: { com: 1 }, seriedade: 0.9,
    desc: 'Pousada charmosa para quem vem a trabalho ou para as festas da cidade.', negociador: 'Dona Lúcia Ferraz, proprietária' },
  { id: 'hotel', nome: 'Hotel Viajante Executivo', setor: 'turismo', sprite: 'hotel', cor: '#2a3f73', empregos: 70, invest: 15e6, meses: 8, minPop: 22000, local: 'urbano', poluicao: 0, turismo: 2,
    iss: 1.2e6, icms: 0, venal: 14e6, pede: { isencaoIPTU: 5, reducaoISS: 2 }, efeitos: { com: 2 }, seriedade: 0.85,
    desc: 'Hotel de rede para executivos e eventos. Movimenta restaurantes e comércio.', negociador: 'Sr. Thomas Weber, diretor de novos hotéis' },
  { id: 'solar', nome: 'Usina Solar Sol do Interior', setor: 'energia', sprite: null, cor: '#3d6cb3', empregos: 35, invest: 45e6, meses: 6, minPop: 12000, local: 'rural', poluicao: 0, turismo: 0,
    iss: 0.5e6, icms: 60e3, venal: 0, pede: { isencaoITBI: true, infra: 0.6e6 }, efeitos: { jovens: 1 }, seriedade: 0.9,
    desc: 'Fazenda de painéis solares na zona rural. Energia limpa e poucos empregos.', negociador: 'Eng. Bianca Alves, desenvolvedora de projetos' },
  { id: 'hospitalpart', nome: 'Hospital Santa Luzia', setor: 'saude', sprite: 'hospital', cor: '#2c9a8a', empregos: 220, invest: 35e6, meses: 12, minPop: 30000, local: 'urbano', poluicao: 0, turismo: 0,
    iss: 3e6, icms: 0, venal: 30e6, pede: { isencaoIPTU: 5, doacaoTerreno: true }, efeitos: { idosos: 4, emp: 1 }, cobertura: { cat: 'saude', cap: 5000 }, seriedade: 0.85,
    desc: 'Hospital particular com convênios. Alivia a fila do SUS.', negociador: 'Dr. Henrique Salgado, presidente' },
  { id: 'aquatico', nome: 'Parque Aquático Águas Claras', setor: 'lazer', sprite: null, cor: '#3ab0d8', empregos: 180, invest: 40e6, meses: 12, minPop: 35000, local: 'rural', poluicao: 0, turismo: 3,
    iss: 1.5e6, icms: 0, venal: 0, pede: { isencaoIPTU: 10, infra: 3e6 }, efeitos: { jovens: 5, fam: 4, com: 3 }, seriedade: 0.8,
    desc: 'Toboáguas e piscinas de ondas. Turistas no verão inteiro.', negociador: 'Sr. Gilberto Matos, empreendedor' },
  { id: 'shopping', nome: 'Shopping Regional', setor: 'comercio', sprite: 'mercado', cor: '#7b4fa0', empregos: 900, invest: 150e6, meses: 18, minPop: 60000, local: 'urbano', poluicao: 0, turismo: 2,
    iss: 4e6, icms: 300e3, venal: 120e6, pede: { isencaoIPTU: 10, doacaoTerreno: true, infra: 5e6 }, efeitos: { jovens: 5, com: -4, fam: 2 }, seriedade: 0.8,
    desc: 'Cinema, praça de alimentação e grandes lojas.', negociador: 'Sr. Ricardo Amaral, incorporador' },
  { id: 'montadora', nome: 'AgroMáquinas Tratores', setor: 'industria', sprite: null, cor: '#e0a82e', empregos: 1500, invest: 400e6, meses: 20, minPop: 45000, local: 'rural', poluicao: 2, turismo: 0,
    iss: 0, icms: 900e3, venal: 0, pede: { isencaoIPTU: 10, isencaoITBI: true, infra: 8e6 }, efeitos: { trab: 5, emp: 3 }, seriedade: 0.85,
    desc: 'Montadora de tratores e colheitadeiras. Transforma a economia da região.', negociador: 'Mr. John Becker, vice-presidente' },
  { id: 'universidade', nome: 'Campus da Universidade Federal', setor: 'educacao', sprite: 'faculdade', cor: '#2c9a48', empregos: 400, invest: 120e6, meses: 24, minPop: 70000, local: 'urbano', poluicao: 0, turismo: 1,
    iss: 0, icms: 0, venal: 0, pede: { doacaoTerreno: true, infra: 6e6 }, efeitos: { jovens: 10, fam: 3, com: 3 }, seriedade: 0.95,
    desc: 'Ensino gratuito e pesquisa. O sonho de qualquer cidade do interior.', negociador: 'Reitora Profa. Marta Lins' },
  { id: 'diversao', nome: 'Parque Mundo Mágico', setor: 'lazer', sprite: null, cor: '#e66a8a', empregos: 600, invest: 300e6, meses: 24, minPop: 80000, local: 'rural', poluicao: 0, turismo: 3,
    iss: 6e6, icms: 0, venal: 0, pede: { isencaoIPTU: 10, infra: 15e6 }, efeitos: { jovens: 6, fam: 5, com: 4 }, seriedade: 0.8,
    desc: 'Parque de diversões temático com montanha-russa e hotel próprio.', negociador: 'Sra. Débora Leal, CEO' },
  { id: 'aeroporto', nome: 'Aeroporto Regional', setor: 'infra', sprite: null, cor: '#9a9aa6', empregos: 300, invest: 250e6, meses: 24, minPop: 100000, local: 'rural', poluicao: 1, turismo: 3,
    iss: 3e6, icms: 0, venal: 0, pede: { infra: 20e6 }, efeitos: { emp: 5, com: 3 }, seriedade: 0.9,
    desc: 'Voos para a capital e outras regiões. Exige uma cidade grande.', negociador: 'Consórcio Aerovias do Interior' },
  // ---- v0.7: negócios menores (local 'pequeno' = ponto comercial alugado num bairro, sem lote) e mais indústrias
  { id: 'academia', nome: 'Academia Corpo em Forma', setor: 'servicos', sprite: null, cor: '#e0503a', empregos: 20, invest: 1.2e6, meses: 2, minPop: 8000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.15e6, icms: 0, venal: 1.5e6, pede: { isencaoIPTU: 2 }, efeitos: { jovens: 2 }, seriedade: 0.85,
    desc: 'Rede de academias com mensalidade baixa e aulas de dança.', negociador: 'Sr. Diego Prates, franqueado' },
  { id: 'clinica', nome: 'Clínica Popular Bem Estar', setor: 'saude', sprite: null, cor: '#2c9a8a', empregos: 35, invest: 2.5e6, meses: 3, minPop: 10000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.5e6, icms: 0, venal: 2.5e6, pede: { reducaoISS: 2 }, efeitos: { idosos: 2, fam: 1 }, cobertura: { cat: 'saude', cap: 1500 }, seriedade: 0.85,
    desc: 'Consultas e exames a preço popular. Tira gente da fila da UBS.', negociador: 'Dra. Fernanda Lopes, sócia' },
  { id: 'idiomas', nome: 'Escola de Idiomas Fala Fácil', setor: 'educacao', sprite: null, cor: '#3d8bd1', empregos: 15, invest: 0.6e6, meses: 2, minPop: 8000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.12e6, icms: 0, venal: 1e6, pede: { reducaoISS: 2 }, efeitos: { jovens: 2 }, seriedade: 0.9,
    desc: 'Inglês e espanhol para jovens e profissionais.', negociador: 'Sra. Mônica Reis, franqueada' },
  { id: 'cinema', nome: 'Cine Paulista 3 Salas', setor: 'lazer', sprite: null, cor: '#7b4fa0', empregos: 30, invest: 4e6, meses: 4, minPop: 18000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.3e6, icms: 0, venal: 4e6, pede: { isencaoIPTU: 5 }, efeitos: { jovens: 3, fam: 2, com: 1 }, seriedade: 0.8,
    desc: 'O primeiro cinema da cidade em vinte anos.', negociador: 'Sr. Celso Antunes, exibidor' },
  { id: 'materiais', nome: 'Casa & Obra Materiais', setor: 'comercio', sprite: null, cor: '#e07a2e', empregos: 45, invest: 3e6, meses: 3, minPop: 10000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.05e6, icms: 35e3, venal: 3e6, pede: { isencaoITBI: true }, efeitos: { emp: 1 }, seriedade: 0.85,
    desc: 'Loja de materiais de construção com entrega na obra.', negociador: 'Sr. Nelson Barros, proprietário' },
  { id: 'software', nome: 'CodaSul Software', setor: 'servicos', sprite: null, cor: '#2a3f73', empregos: 40, invest: 1.5e6, meses: 2, minPop: 15000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 1.1e6, icms: 0, venal: 1.5e6, pede: { reducaoISS: 5 }, efeitos: { jovens: 3 }, seriedade: 0.8,
    desc: 'Empresa de software que quer fugir do aluguel caro da capital.', negociador: 'Sra. Júlia Tanaka, fundadora' },
  { id: 'posto', nome: 'Auto Posto Estrada Real', setor: 'comercio', sprite: null, cor: '#d64b4b', empregos: 18, invest: 2e6, meses: 3, minPop: 8000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.02e6, icms: 45e3, venal: 2e6, pede: { isencaoITBI: true }, efeitos: {}, seriedade: 0.8,
    desc: 'Posto de combustível com loja de conveniência 24 horas.', negociador: 'Sr. Valdir Couto, revendedor' },
  { id: 'petshop', nome: 'Pet Center Amigo Fiel', setor: 'comercio', sprite: null, cor: '#4aa86a', empregos: 12, invest: 0.5e6, meses: 2, minPop: 8000, local: 'pequeno', poluicao: 0, turismo: 0,
    iss: 0.06e6, icms: 8e3, venal: 0.8e6, pede: { isencaoIPTU: 2 }, efeitos: { fam: 1 }, seriedade: 0.9,
    desc: 'Banho e tosa, veterinário e ração.', negociador: 'Sra. Camila Duarte, veterinária' },
  { id: 'restaurante', nome: 'Restaurante Sabor da Roça', setor: 'turismo', sprite: null, cor: '#b5652a', empregos: 22, invest: 0.8e6, meses: 2, minPop: 8000, local: 'pequeno', poluicao: 0, turismo: 1,
    iss: 0.05e6, icms: 12e3, venal: 1e6, pede: { isencaoIPTU: 2 }, efeitos: { com: 1 }, seriedade: 0.85,
    desc: 'Comida caipira no fogão a lenha. Atrai gente da estrada.', negociador: 'Dona Cida Moraes, cozinheira e dona' },
  { id: 'moveis', nome: 'Móveis Serra Nova', setor: 'industria', sprite: 'fabrica', cor: '#8a5a2a', empregos: 180, invest: 9e6, meses: 6, minPop: 12000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0, icms: 55e3, venal: 10e6, pede: { isencaoIPTU: 5, doacaoTerreno: true }, efeitos: { trab: 2 }, seriedade: 0.8,
    desc: 'Fábrica de móveis planejados. Usa madeira de reflorestamento.', negociador: 'Sr. Ivo Bertoldi, sócio-gerente' },
  { id: 'transportadora', nome: 'Transportadora Rápido Paulista', setor: 'logistica', sprite: 'logistica', cor: '#3466c2', empregos: 120, invest: 6e6, meses: 4, minPop: 14000, local: 'distrito', poluicao: 1, turismo: 0,
    iss: 0.6e6, icms: 20e3, venal: 7e6, pede: { reducaoISS: 2, infra: 0.5e6 }, efeitos: { trab: 1 }, seriedade: 0.75,
    desc: 'Garagem de caminhões e depósito. Muitos motoristas e ajudantes.', negociador: 'Sr. Roberto Saad, diretor' },
  { id: 'laticinio', nome: 'Laticínios Vale Verde', setor: 'industria', sprite: null, cor: '#e8e2c8', empregos: 140, invest: 10e6, meses: 6, minPop: 10000, local: 'rural', poluicao: 1, turismo: 0,
    iss: 0, icms: 75e3, venal: 0, pede: { isencaoITBI: true, infra: 0.8e6 }, efeitos: { trab: 2 }, seriedade: 0.85,
    desc: 'Queijos e iogurtes com leite dos sítios da região.', negociador: 'Sr. Hélio Gaspar, presidente' },
  { id: 'cooperativa', nome: 'Cooperativa Agro Unida', setor: 'industria', sprite: null, cor: '#5ea83d', empregos: 90, invest: 5e6, meses: 5, minPop: 8000, local: 'rural', poluicao: 0, turismo: 0,
    iss: 0.1e6, icms: 50e3, venal: 0, pede: { infra: 0.4e6 }, efeitos: { trab: 1, idosos: 1 }, seriedade: 0.95,
    desc: 'Armazém e beneficiamento de grãos dos pequenos produtores.', negociador: 'Seu Antônio Brito, presidente da cooperativa' },
  { id: 'olaria', nome: 'Cerâmica Barro Forte', setor: 'industria', sprite: null, cor: '#b5452a', empregos: 70, invest: 2.5e6, meses: 4, minPop: 8000, local: 'rural', poluicao: 1, turismo: 0,
    iss: 0, icms: 18e3, venal: 0, pede: { isencaoITBI: true }, efeitos: { trab: 1 }, seriedade: 0.7,
    desc: 'Tijolos e telhas. A fumaça dos fornos incomoda quem mora perto.', negociador: 'Sr. Zé Carlos Pires, dono' },
];

// O que a prefeitura pode exigir (custo = esforço para a empresa)
const CONTRAPARTIDAS = {
  maoDeObra: { nome: 'Contratar 80% de moradores da cidade', custo: 9,  prazo: 0,  desc: 'Mais empregos ficam com quem mora aqui.' },
  cursos:    { nome: 'Cursos profissionalizantes gratuitos', custo: 7,  prazo: 3,  desc: 'Qualifica jovens e desempregados.' },
  creche:    { nome: 'Construir uma creche para a comunidade', custo: 12, prazo: 8,  desc: '+150 vagas de creche no bairro.' },
  ubs:       { nome: 'Construir e doar um posto de saúde', custo: 15, prazo: 10, desc: 'Atende 5 mil pessoas no bairro.' },
  escola:    { nome: 'Reformar e ampliar escolas do bairro', custo: 9,  prazo: 6,  desc: '+250 vagas escolares no bairro.' },
  praca:     { nome: 'Reformar a praça e a quadra do bairro', custo: 5,  prazo: 4,  desc: 'Lazer para 3 mil moradores.' },
  cultura:   { nome: 'Patrocinar os eventos culturais da cidade', custo: 6, prazo: 0, desc: 'Shows e festas com a marca da empresa.' },
  ambiental: { nome: 'Filtros e compensação ambiental', custo: 10, prazo: 0, desc: 'Reduz bastante a poluição.', soPoluente: true },
};

// O que a empresa pode pedir. Cada item é negociável em partes:
//  IPTU: % de desconto × anos · ISS: alíquota × anos · terreno: % de desconto no preço
//  obras: valor · ITBI: % de desconto. "prioridade" = quanto aquilo pesa para a empresa.
const PEDIDOS_EMPRESA = {
  isencaoIPTU:   { nome: 'Desconto no IPTU', curto: 'IPTU', fiscal: true },
  reducaoISS:    { nome: 'ISS reduzido', curto: 'ISS', fiscal: true },
  doacaoTerreno: { nome: 'Terreno público', curto: 'terreno', fiscal: true },
  infra:         { nome: 'Obras de acesso, asfalto e redes', curto: 'obras' },
  isencaoITBI:   { nome: 'Desconto no ITBI', curto: 'ITBI', fiscal: true },
};
const OPCOES_NEG = {
  pct: [0, 0.25, 0.5, 0.8, 1],            // desconto de IPTU
  terreno: [0, 0.25, 0.5, 0.75, 1],       // desconto no preço do terreno (1 = doação)
  itbi: [0, 0.5, 1],
  infra: [0, 0.25, 0.5, 0.75, 1, 1.25],   // fração do valor pedido
  taxasISS: [2, 2.5, 3, 4],
  anosMax: 10,
};
const PRIORIDADES = { 1.5: 'Essencial', 1: 'Importante', 0.6: 'Desejável', 0.5: 'Extra' };

const VALOR_LOTE = { centro: 1.5e6, operaria: 0.6e6, nobre: 2.2e6, distrito: 0.8e6 };

// =====================================================================
const Empresas = (() => {
  const S = () => Sim.S;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const cat = id => CATALOGO_EMPRESAS.find(c => c.id === id);
  let uid = Date.now() % 100000;

  function garantirEstado() {
    const s = S();
    if (!s.propostas) s.propostas = [];
    if (!s.empresas) s.empresas = [];
    if (!s.empresasUsadas) s.empresasUsadas = [];
    if (s.proxProposta == null) s.proxProposta = s.mesIndex;
    if (s.prospeccao == null) s.prospeccao = -99;
    if (!s.cobrancas) s.cobrancas = [];
    for (const p of s.propostas) migrarProposta(p);
  }

  // ------------------------------------------------------------ catálogo
  function lotesCompativeis(local) {
    if (local === 'rural' || local === 'pequeno') return [];
    const bairros = local === 'distrito' ? ['distrito'] : ['centro', 'operaria', 'nobre'];
    return S().lotes.filter(l => !l.ocupado && !l.predio && !l.obra && !l.empresa && bairros.includes(l.bairro));
  }
  function disponiveis() {
    const s = S(), pop = Sim.popTotal();
    return CATALOGO_EMPRESAS.filter(c => pop >= c.minPop && !s.empresasUsadas.includes(c.id) &&
      !s.propostas.some(p => p.catId === c.id) && (c.local === 'rural' || c.local === 'pequeno' || lotesCompativeis(c.local).length));
  }
  function futuras() {
    const pop = Sim.popTotal();
    return CATALOGO_EMPRESAS.filter(c => c.minPop > pop).sort((a, b) => a.minPop - b.minPop);
  }
  function multCusto(empregos) { return 1.3 - Math.min(1, empregos / 1000) * 0.7; }

  // ------------------------------------------------------------ propostas
  function gerarProposta(forcarId) {
    garantirEstado();
    const s = S();
    const lista = forcarId ? [cat(forcarId)] : disponiveis();
    if (!lista.length) return null;
    const c = lista[Math.floor(Math.random() * lista.length)];
    const lotes = lotesCompativeis(c.local);
    // a empresa prefere terreno público (para pedir doação) quando pede doação
    let lote = null;
    if (lotes.length) lote = (c.pede.doacaoTerreno ? lotes.find(l => l.tipo === 'publico') : null) || lotes[0];
    const pedidos = montarPedidos(c);
    const rivalCidade = Math.random() < 0.35 ? s.rivais[Math.floor(Math.random() * s.rivais.length)] : null;
    const p = {
      id: 'p' + (uid++), catId: c.id, nome: c.nome, setor: c.setor, empregos: c.empregos,
      pedidos, exigidas: [], loteId: lote ? lote.id : null,
      bairro: c.local === 'pequeno' ? escolherBairroPequeno() : null,
      interesse: 50, paciencia: 3, ruido: Math.round(rnd(-3, 3)),
      rival: rivalCidade ? { id: rivalCidade.id, nome: rivalCidade.nome } : null,
      chegou: s.mesIndex, expira: s.mesIndex + (rivalCidade ? 2 : 3),
      falas: [{ quem: 'empresa', txt: abertura(c, rivalCidade, pedidos) }], sondagens: 2,
    };
    s.propostas.push(p);
    Sim.noticia(5, `${c.nome} quer se instalar na cidade e promete ${c.empregos} empregos`, rivalCidade ? `${rivalCidade.nome} também está na disputa` : SETORES[c.setor]);
    Sim.emit('proposta', p);
    return p;
  }
  // pequenos negócios alugam um ponto no bairro onde há mais gente e menos concorrência
  function escolherBairroPequeno() {
    const op = ['centro', 'operaria', 'nobre'];
    const pesos = op.map(b => Math.max(1, (S().bairros[b] ? S().bairros[b].pop : 1000)) * (b === 'centro' ? 1.3 : 1));
    let r = Math.random() * pesos.reduce((a, b) => a + b, 0);
    for (let i = 0; i < op.length; i++) { r -= pesos[i]; if (r <= 0) return op[i]; }
    return 'centro';
  }
  // pedidos no formato negociável, com prioridade para a empresa
  function normalizar(tipo, v) {
    switch (tipo) {
      case 'isencaoIPTU': return { pct: 1, anos: v };
      case 'reducaoISS': return { taxa: 2, anos: v };
      case 'doacaoTerreno': return { pct: 1 };
      case 'infra': return { valor: v };
      case 'isencaoITBI': return { pct: 1 };
    }
  }
  function vazio(tipo) {
    switch (tipo) {
      case 'isencaoIPTU': return { pct: 0, anos: 0 };
      case 'reducaoISS': return { taxa: null, anos: 0 };
      case 'infra': return { valor: 0 };
      default: return { pct: 0 };
    }
  }
  function montarPedidos(c) {
    const lista = Object.entries(c.pede).map(([tipo, v]) => ({ tipo, pedido: normalizar(tipo, v), peso: 1 }));
    lista.forEach(x => x.dado = { ...x.pedido });
    // o item mais valioso (com um pouco de sorte) é o essencial; os outros, importantes ou desejáveis
    const ordem = lista.slice().sort((a, b) => ptsBruto(b.tipo, b.pedido) * rnd(0.6, 1.4) - ptsBruto(a.tipo, a.pedido) * rnd(0.6, 1.4));
    ordem.forEach((x, i) => x.peso = i === 0 ? 1.5 : (i === 1 || Math.random() < 0.4) ? 1 : 0.6);
    return lista;
  }
  // pedidos antigos (jogos salvos antes da v0.8) viram o formato novo
  function migrarProposta(p) {
    for (const ped of p.pedidos) {
      if (ped.pedido && typeof ped.pedido === 'object') continue;
      ped.pedido = normalizar(ped.tipo, ped.pedido === true ? 1 : ped.pedido);
      ped.dado = ped.dado ? { ...ped.pedido } : vazio(ped.tipo);
      ped.peso = ped.peso || 1;
    }
    if (p.sondagens == null) p.sondagens = 2;
  }
  function abertura(c, rival, pedidos) {
    const lista = (pedidos || montarPedidos(c));
    const desc = lista.map(x => descPedido(x.tipo, x.pedido)).join(', ');
    const ess = lista.find(x => x.peso >= 1.5);
    let t = `Bom dia, prefeito. Queremos investir ${Sim.fmtDinheiro(c.invest)} e gerar ${c.empregos} empregos aqui. Para isso, precisamos de: ${desc}.`;
    if (ess && lista.length > 1) t += ` O que mais pesa para nós é ${minus(PEDIDOS_EMPRESA[ess.tipo].nome)}; o resto dá para conversar.`;
    if (rival) t += ` Serei franco: ${rival.nome} nos ofereceu condições muito boas.`;
    return t;
  }
  const minus = t => t[0].toLowerCase() + t.slice(1);
  const pctTxt = v => Math.round(v * 100) + '%';
  function descPedido(tipo, v) {
    if (v == null || typeof v !== 'object') v = normalizar(tipo, v === true ? 1 : v);
    switch (tipo) {
      case 'isencaoIPTU': return !v.pct || !v.anos ? 'IPTU cheio' : v.pct >= 1 ? `isenção de IPTU por ${v.anos} ${v.anos === 1 ? 'ano' : 'anos'}` : `${pctTxt(v.pct)} de desconto no IPTU por ${v.anos} ${v.anos === 1 ? 'ano' : 'anos'}`;
      case 'reducaoISS': return !v.taxa || !v.anos ? 'ISS normal' : `ISS de ${String(v.taxa).replace('.', ',')}% por ${v.anos} ${v.anos === 1 ? 'ano' : 'anos'}`;
      case 'doacaoTerreno': return !v.pct ? 'terreno pelo preço cheio' : v.pct >= 1 ? 'doação do terreno' : `${pctTxt(v.pct)} de desconto no terreno`;
      case 'infra': return !v.valor ? 'sem obras pagas pela prefeitura' : `obras de acesso (${Sim.fmtDinheiro(v.valor)})`;
      case 'isencaoITBI': return !v.pct ? 'ITBI cheio' : v.pct >= 1 ? 'isenção do ITBI' : `${pctTxt(v.pct)} de desconto no ITBI`;
    }
    return '';
  }

  // ------------------------------------------------------------ avaliação
  function loteDe(p) { return p.loteId ? S().lotes.find(l => l.id === p.loteId) : null; }
  function pedidoAplica(p, ped) {
    if (ped.tipo === 'doacaoTerreno') { const l = loteDe(p); return !!(l && l.tipo === 'publico'); }
    return true;
  }
  // quanto um item vale para a empresa (pontos de negociação), sem a prioridade
  function ptsBruto(tipo, v) {
    if (!v || typeof v !== 'object') return 0;
    switch (tipo) {
      case 'isencaoIPTU': return (v.pct || 0) * (v.anos || 0) * 3;
      case 'reducaoISS': {
        const iss = S() ? S().impostos.iss : 4;
        if (!v.taxa || !v.anos || v.taxa >= iss) return 0;
        return Math.min(1, (iss - v.taxa) / Math.max(0.5, iss - 2)) * v.anos * 3;
      }
      case 'doacaoTerreno': return (v.pct || 0) * 16;
      case 'infra': return (v.valor || 0) / 1e5;
      case 'isencaoITBI': return (v.pct || 0) * 3;
    }
    return 0;
  }
  // o que passa do pedido vale metade; itens que a empresa nem pediu valem pouco
  function ptsItem(ped, v) {
    const pedido = ptsBruto(ped.tipo, ped.pedido), dado = ptsBruto(ped.tipo, v === undefined ? ped.dado : v);
    return (Math.min(dado, pedido) + Math.max(0, dado - pedido) * 0.5) * (ped.peso || 1);
  }
  function ptsPedido(ped, valor) { return ptsBruto(ped.tipo, valor); }
  // quanto do pedido está atendido (0 a 1+)
  function atendido(ped) { const t = ptsBruto(ped.tipo, ped.pedido); return t ? ptsBruto(ped.tipo, ped.dado) / t : (ptsBruto(ped.tipo, ped.dado) ? 1 : 0); }
  function avaliar(p) {
    const c = cat(p.catId);
    let total = 0, dado = 0;
    migrarProposta(p);
    for (const ped of p.pedidos) {
      if (!pedidoAplica(p, ped)) continue;
      total += ptsBruto(ped.tipo, ped.pedido) * (ped.peso || 1);
      dado += ptsItem(ped);
    }
    const mult = multCusto(c.empregos);
    const custo = p.exigidas.reduce((s, id) => s + CONTRAPARTIDAS[id].custo * mult, 0);
    const exigencia = p.interesse + total * 0.6 - 4 + (p.rival ? 8 : 0);
    const score = p.interesse + dado - custo;
    const margem = score - exigencia;
    const visto = margem + p.ruido;
    let termo;
    if (visto >= 8) termo = { txt: 'Fechariam agora', nivel: 4 };
    else if (visto >= 2) termo = { txt: 'Provável acordo', nivel: 3 };
    else if (visto >= -4) termo = { txt: 'Indecisos', nivel: 2 };
    else if (visto >= -12) termo = { txt: 'Insatisfeitos', nivel: 1 };
    else termo = { txt: 'Prestes a desistir', nivel: 0 };
    return { margem, visto, termo, ...impacto(p) };
  }

  // estimativas que aparecem na mesa
  function impacto(p) {
    const c = cat(p.catId), s = S();
    const l = loteDe(p);
    const ip = dadoDe(p, 'isencaoIPTU'), is = dadoDe(p, 'reducaoISS'), ter = dadoDe(p, 'doacaoTerreno'), inf = dadoDe(p, 'infra');
    const issNormal = c.iss * s.impostos.iss / 100;
    const iss = is && is.taxa && is.anos && is.taxa < s.impostos.iss ? c.iss * is.taxa / 100 : issNormal;
    const iptuRate = taxaIPTU(c, l ? l.bairro : p.bairro || null);
    const iptuCheio = c.venal * iptuRate / 100 / 12;
    const iptu = iptuCheio * (1 - (ip && ip.anos ? ip.pct || 0 : 0));
    const custoUnico = inf ? inf.valor || 0 : 0;
    let vendaLote = 0;
    if (l && l.tipo === 'publico') vendaLote = Math.round((VALOR_LOTE[l.bairro] || 1e6) * (1 - (ter ? ter.pct || 0 : 0)));
    const local = p.exigidas.includes('maoDeObra') ? 0.85 : 0.55;
    return {
      receitaMes: iss + c.icms + iptu, receitaMesCheia: issNormal + c.icms + iptuCheio,
      custoUnico, vendaLote, empregosLocais: Math.round(c.empregos * local),
      precisaCamara: p.pedidos.some(ped => PEDIDOS_EMPRESA[ped.tipo].fiscal && pedidoAplica(p, ped) && ptsBruto(ped.tipo, ped.dado) > 0),
    };
  }
  function dadoDe(p, tipo) { const ped = p.pedidos.find(x => x.tipo === tipo); return ped && pedidoAplica(p, ped) ? ped.dado : null; }
  // mantido para compatibilidade: valor numérico simples do que foi concedido
  function valorDado(p, tipo) { const d = dadoDe(p, tipo); return d ? ptsBruto(tipo, d) : 0; }
  function taxaIPTU(c, bairro) {
    if (!bairro) return 0;
    if (['industria', 'logistica', 'energia'].includes(c.setor) || bairro === 'distrito') return S().impostos.iptuInd;
    return S().impostos.iptu[bairro];
  }


  // ----------------------------------------------- termômetro da população
  // o que cada grupo acha da vinda da empresa nas condições que estão na mesa (0 a 100)
  function opiniao(p) {
    const s = S(), c = cat(p.catId);
    const g = {}; GRUPOS.forEach(x => g[x.id] = 50);
    const add = (k, v) => g[k] += v;
    const motivos = [];
    const exige = id => p.exigidas.includes(id);
    // empregos (pesam mais com desemprego alto)
    const fd = clamp(s.desemprego / 9, 0.6, 1.6);
    const j = Math.min(26, 3 + c.empregos / 18) * fd * (exige('maoDeObra') ? 1.25 : 1);
    add('trab', j); add('jovens', j * 0.7); add('fam', j * 0.5); add('emp', j * 0.35); add('com', j * 0.3); add('idosos', j * 0.2);
    motivos.push([j, `${num(c.empregos)} empregos${s.desemprego > 9 ? ' com desemprego alto' : ''}`]);
    for (const k in c.efeitos) add(k, c.efeitos[k] * 4);
    if (c.efeitos.com < 0) motivos.push([c.efeitos.com * 4, 'concorre com o comércio local']);
    if (c.turismo) { add('com', c.turismo * 4); add('emp', c.turismo * 2); motivos.push([c.turismo * 3, 'traz visitantes']); }
    if (c.poluicao) {
      const pol = c.poluicao * (exige('ambiental') ? 0.4 : 1) * (c.local === 'urbano' ? 1.4 : 1);
      add('idosos', -pol * 15); add('fam', -pol * 12); add('jovens', -pol * 6); add('com', -pol * 4); add('trab', -pol * 3);
      motivos.push([-pol * 9, exige('ambiental') ? 'polui, mas com filtros' : 'poluição e cheiro']);
    }
    // incentivos: "o pequeno paga imposto, o grande não"
    let pts = 0, infra = 0, doacao = false;
    migrarProposta(p);
    for (const ped of p.pedidos) {
      if (!pedidoAplica(p, ped) || !ptsBruto(ped.tipo, ped.dado)) continue;
      if (ped.tipo === 'infra') infra = ped.dado.valor || 0;
      else if (ped.tipo === 'doacaoTerreno') { pts += (ped.dado.pct || 0) * 10; doacao = (ped.dado.pct || 0) >= 1; }
      else pts += ptsBruto(ped.tipo, ped.dado);
    }
    const inc = pts * 0.35 + (doacao ? 5 : 0) + infra / 1e6 * 2.5;
    if (inc > 0.5) {
      GRUPOS.forEach(x => add(x.id, -inc * (x.id === 'com' ? 1.4 : x.id === 'emp' ? 0.3 : 0.6)));
      motivos.push([-inc * 0.8, doacao ? 'terreno público doado e incentivos' : infra && !pts ? 'obras pagas pela prefeitura' : 'incentivos fiscais']);
    }
    // contrapartidas que a prefeitura exige
    const CP = { creche: { fam: 6, trab: 2 }, ubs: { idosos: 7, fam: 4 }, escola: { fam: 5, jovens: 2 }, praca: { jovens: 4, fam: 3, idosos: 2 },
      cursos: { jovens: 5, trab: 3 }, cultura: { jovens: 3, fam: 2, com: 2 }, maoDeObra: { trab: 4 }, ambiental: { idosos: 3, fam: 3 } };
    let somaCp = 0;
    for (const id of p.exigidas) for (const k in CP[id] || {}) { add(k, CP[id][k]); somaCp += CP[id][k] / 3; }
    if (somaCp) motivos.push([somaCp, 'contrapartidas exigidas']);
    if (p.rival) { add('emp', 3); add('trab', 2); }
    if (c.local === 'pequeno') { GRUPOS.forEach(x => add(x.id, 3)); motivos.push([2, 'negócio novo no bairro']); }
    GRUPOS.forEach(x => g[x.id] = clamp(Math.round(g[x.id]), 3, 97));
    // média ponderada pelo tamanho de cada grupo na cidade
    const peso = { trab: 0.3, com: 0.1, emp: 0.05, idosos: 0.18, jovens: 0.17, fam: 0.2 };
    const total = Math.round(GRUPOS.reduce((sum, x) => sum + g[x.id] * peso[x.id], 0));
    const nivel = total >= 70 ? 4 : total >= 58 ? 3 : total >= 45 ? 2 : total >= 33 ? 1 : 0;
    const txt = ['Muito contra', 'Contra', 'Dividida', 'A favor', 'Muito a favor'][nivel];
    motivos.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
    return { total, grupos: g, nivel, txt, motivos: motivos.slice(0, 4).map(([v, t]) => ({ positivo: v >= 0, txt: t })) };
  }
  // aplica o humor dos grupos quando a prefeitura decide
  function reagirOpiniao(p, decisao) {
    const s = S(), o = opiniao(p);
    for (const k in o.grupos) {
      const d = decisao === 'aceita' ? (o.grupos[k] - 50) / 12 : -Math.max(0, o.grupos[k] - 50) / 15;
      s.humor.grupos[k] = (s.humor.grupos[k] || 0) + d;
    }
    return o;
  }
  const num = v => Math.round(v).toLocaleString('pt-BR');

  // ------------------------------------------------------------ rodada
  function proporRodada(p) {
    const c = cat(p.catId);
    const av = avaliar(p);
    p.falas.push({ quem: 'prefeitura', txt: resumoProposta(p) });
    if (av.margem >= 0) {
      p.falas.push({ quem: 'empresa', txt: av.margem > 10 ? 'Excelente! Temos um acordo. Aperto de mão?' : 'Fechado. Não é o que queríamos, mas dá para trabalhar.' });
      fechar(p);
      return 'aceita';
    }
    p.interesse -= 2;
    if (av.margem >= -12 && p.paciencia > 1) {
      p.paciencia--;
      // contraproposta: tira a contrapartida mais cara, ou insiste num pedido
      if (p.exigidas.length) {
        const mult = multCusto(c.empregos);
        const cara = p.exigidas.slice().sort((a, b) => CONTRAPARTIDAS[b].custo - CONTRAPARTIDAS[a].custo)[0];
        p.exigidas = p.exigidas.filter(x => x !== cara);
        p.falas.push({ quem: 'empresa', txt: `Não conseguimos assumir "${CONTRAPARTIDAS[cara].nome.toLowerCase()}". Tirando isso, podemos conversar.` });
      } else {
        // contraproposta concreta no item que mais pesa e está mais longe do pedido
        const alvo = p.pedidos.filter(x => pedidoAplica(p, x) && atendido(x) < 0.999)
          .sort((a, b) => (ptsBruto(b.tipo, b.pedido) - ptsBruto(b.tipo, b.dado)) * b.peso - (ptsBruto(a.tipo, a.pedido) - ptsBruto(a.tipo, a.dado)) * a.peso)[0];
        if (alvo) {
          alvo.dado = meioTermo(alvo);
          p.falas.push({ quem: 'empresa', txt: `Nossa contraproposta: ${descPedido(alvo.tipo, alvo.dado)}. Menos que isso não fecha a conta.` });
        } else p.falas.push({ quem: 'empresa', txt: 'Precisamos de um gesto da prefeitura. Pense melhor.' });
      }
      return 'contra';
    }
    p.paciencia -= av.margem < -12 ? 2 : 1;
    if (p.paciencia <= 0) { desistir(p, 'negociação'); return 'desiste'; }
    p.falas.push({ quem: 'empresa', txt: 'Assim fica muito longe do que precisamos. Última chance, prefeito.' });
    return 'contra';
  }
  // valor no meio do caminho entre o oferecido e o pedido (arredondado às opções da mesa)
  function meioTermo(ped) {
    const d = ped.dado || vazio(ped.tipo), q = ped.pedido;
    const perto = (lista, v) => lista.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
    const acima = (lista, v) => lista.find(x => x >= v - 1e-9) ?? lista[lista.length - 1];
    switch (ped.tipo) {
      case 'isencaoIPTU': return { pct: acima(OPCOES_NEG.pct, ((d.pct || 0) + q.pct) / 2), anos: Math.max(1, Math.ceil(((d.anos || 0) + q.anos) / 2)) };
      case 'reducaoISS': {
        const iss = S().impostos.iss, atual = d.taxa && d.anos ? d.taxa : iss;
        const taxas = OPCOES_NEG.taxasISS.filter(t => t < iss).sort((a, b) => b - a);
        const meio = (atual + q.taxa) / 2;
        return { taxa: taxas.find(t => t <= meio + 1e-9) ?? q.taxa, anos: Math.max(1, Math.ceil(((d.anos || 0) + q.anos) / 2)) };
      }
      case 'doacaoTerreno': return { pct: acima(OPCOES_NEG.terreno, ((d.pct || 0) + q.pct) / 2) };
      case 'infra': { const f = acima(OPCOES_NEG.infra, ((d.valor || 0) / q.valor + 1) / 2); return { valor: Math.round(q.valor * f / 1e4) * 1e4 }; }
      case 'isencaoITBI': return { pct: acima(OPCOES_NEG.itbi, ((d.pct || 0) + q.pct) / 2) };
    }
    return { ...q };
  }
  // "o que falta para fechar?": procura a menor melhora num item que já fecharia o acordo
  function sondar(p) {
    migrarProposta(p);
    if (p.sondagens <= 0) return { txt: 'Já dissemos o que precisamos, prefeito. Agora é com o senhor.' };
    p.sondagens--;
    const av = avaliar(p);
    if (av.margem >= 0) { const t = 'Do jeito que está, a gente fecha hoje.'; p.falas.push({ quem: 'empresa', txt: t }); return { txt: t }; }
    const candidatos = [];
    for (const ped of p.pedidos.filter(x => pedidoAplica(p, x))) {
      for (const v of opcoesDe(p, ped)) {
        if (ptsBruto(ped.tipo, v) <= ptsBruto(ped.tipo, ped.dado)) continue;
        const ganho = ptsItem(ped, v) - ptsItem(ped);
        if (ganho + av.margem >= 0) candidatos.push({ ped, v, custo: ptsBruto(ped.tipo, v) - ptsBruto(ped.tipo, ped.dado) });
      }
    }
    candidatos.sort((a, b) => a.custo - b.custo);
    let txt;
    if (candidatos.length) {
      const c0 = candidatos[0];
      txt = `Se a prefeitura topar ${descPedido(c0.ped.tipo, c0.v)}, fechamos hoje.`;
      p.falas.push({ quem: 'empresa', txt });
      return { txt, sugestao: [{ tipo: c0.ped.tipo, v: c0.v }] };
    }
    // nenhum item sozinho resolve: junta os pedidos por ordem de prioridade
    let falta = -av.margem; const mudas = [];
    for (const ped of p.pedidos.filter(x => pedidoAplica(p, x) && !x.extra).sort((a, b) => b.peso - a.peso)) {
      const ganho = ptsItem(ped, ped.pedido) - ptsItem(ped);
      if (ganho <= 0.01) continue;
      mudas.push({ tipo: ped.tipo, v: { ...ped.pedido } }); falta -= ganho;
      if (falta <= 0) break;
    }
    if (falta <= 0) {
      txt = `Precisamos de ${mudas.map(m => descPedido(m.tipo, m.v)).join(' e ')}. Com isso, fechamos.`;
      p.falas.push({ quem: 'empresa', txt });
      return { txt, sugestao: mudas };
    }
    const cara = p.exigidas.slice().sort((a, b) => CONTRAPARTIDAS[b].custo - CONTRAPARTIDAS[a].custo)[0];
    txt = cara ? `Mesmo com tudo o que pedimos, as contrapartidas ficam pesadas demais. Teria que sair "${CONTRAPARTIDAS[cara].nome.toLowerCase()}".`
      : 'Mesmo com tudo o que pedimos, a conta ainda não fecha. Precisaríamos de algo a mais da prefeitura.';
    p.falas.push({ quem: 'empresa', txt });
    return { txt };
  }
  // valores possíveis de cada item na mesa
  function opcoesDe(p, ped) {
    const out = [], q = ped.pedido, anosMax = Math.max(OPCOES_NEG.anosMax, q.anos || 0);
    switch (ped.tipo) {
      case 'isencaoIPTU': for (const pct of OPCOES_NEG.pct) for (let a = 1; a <= anosMax; a++) out.push({ pct, anos: a }); break;
      case 'reducaoISS': for (const taxa of OPCOES_NEG.taxasISS.filter(t => t < S().impostos.iss)) for (let a = 1; a <= anosMax; a++) out.push({ taxa, anos: a }); break;
      case 'doacaoTerreno': OPCOES_NEG.terreno.forEach(pct => out.push({ pct })); break;
      case 'infra': if (q.valor) OPCOES_NEG.infra.forEach(f => out.push({ valor: Math.round(q.valor * f / 1e4) * 1e4 })); else [0, 250e3, 500e3, 1e6, 2e6].forEach(v => out.push({ valor: v })); break;
      case 'isencaoITBI': OPCOES_NEG.itbi.forEach(pct => out.push({ pct })); break;
    }
    return out;
  }
  // a prefeitura oferece algo que a empresa não pediu (vale menos, mas ajuda)
  function oferecerExtra(p, tipo) {
    migrarProposta(p);
    if (p.pedidos.some(x => x.tipo === tipo)) return;
    const taxaExtra = Math.max(2, ...OPCOES_NEG.taxasISS.filter(t => t < S().impostos.iss));
    const base = { isencaoIPTU: { pct: 0.5, anos: 2 }, reducaoISS: { taxa: taxaExtra, anos: 2 }, infra: { valor: 300e3 }, isencaoITBI: { pct: 1 }, doacaoTerreno: { pct: 0.5 } }[tipo];
    const ped = { tipo, pedido: vazio(tipo), dado: base, peso: 0.5, extra: true };
    if (tipo === 'infra') ped.pedido = { valor: 0 };
    p.pedidos.push(ped);
  }
  function removerExtra(p, tipo) { p.pedidos = p.pedidos.filter(x => !(x.extra && x.tipo === tipo)); }
  function resumoProposta(p) {
    const dados = p.pedidos.filter(x => pedidoAplica(p, x)).map(x => descPedido(x.tipo, x.dado));
    const ex = p.exigidas.map(id => CONTRAPARTIDAS[id].nome.toLowerCase());
    return `Oferecemos: ${dados.join(', ') || 'nada além do terreno'}.` + (ex.length ? ` Em troca, exigimos: ${ex.join('; ')}.` : '');
  }
  function desistir(p, motivo) {
    const s = S();
    const o = reagirOpiniao(p, 'perdida');
    s.propostas = s.propostas.filter(x => x !== p);
    s.empresasUsadas.push(p.catId);
    const destino = p.rival ? p.rival.nome : s.rivais[Math.floor(Math.random() * s.rivais.length)].nome;
    p.falas.push({ quem: 'empresa', txt: `Infelizmente vamos seguir com ${destino}. Obrigado pelo tempo.` });
    Sim.noticia(5, `${p.nome} desiste da cidade e vai para ${destino}`, `${p.empregos} empregos perdidos · ${o.total >= 55 ? 'população lamenta e oposição critica a prefeitura' : 'parte da população comemora'}`);
    s.candidato.forca = clamp(s.candidato.forca + (p.empregos >= 300 ? 3 : 1), 0, 95);
    s.humor.grupos.trab = (s.humor.grupos.trab || 0) - (p.empregos >= 300 ? 2 : 0.5);
    Sim.emit('mudou');
  }
  function recusar(p) {
    const s = S();
    const o = reagirOpiniao(p, 'recusada');
    s.propostas = s.propostas.filter(x => x !== p);
    s.empresasUsadas.push(p.catId);
    Sim.noticia(3, `Prefeitura recusa a vinda de ${p.nome}`, o.total >= 55 ? 'Moradores queriam a empresa e cobram explicações' : o.total < 44 ? 'Moradores apoiam a decisão' : 'Empresa deve procurar outra cidade da região');
    Sim.emit('mudou');
  }

  // ------------------------------------------------------- acordo fechado
  function fechar(p) {
    const s = S(), c = cat(p.catId);
    const im = impacto(p);
    const op = reagirOpiniao(p, 'aceita');
    s.propostas = s.propostas.filter(x => x !== p);
    s.empresasUsadas.push(p.catId);
    const l = loteDe(p);
    const e = {
      id: 'e' + (uid++), catId: c.id, nome: c.nome, setor: c.setor, empregos: c.empregos, cor: c.cor, sprite: c.sprite,
      loteId: l ? l.id : null, bairro: l ? l.bairro : (p.bairro || 'rural'), pequeno: c.local === 'pequeno', status: im.precisaCamara ? 'camara' : 'instalacao',
      mesesRest: c.meses, mesesTotal: c.meses, inicio: null, satisfacao: 70, seriedade: c.seriedade,
      incentivos: incentivosDe(p),
      incentivoPts: p.pedidos.filter(x => PEDIDOS_EMPRESA[x.tipo].fiscal && pedidoAplica(p, x)).reduce((sum, x) => sum + ptsBruto(x.tipo, x.dado), 0),
      vendaLote: im.vendaLote,
      contrapartidas: p.exigidas.map(id => ({ id, status: 'pendente', prazo: null, chance: c.seriedade })),
      sessao: im.precisaCamara ? Sim.proximaSessao() : null,
      opiniao: op.total,
    };
    s.empresas.push(e);
    if (l) l.empresa = e.id;
    // negócio pequeno ocupa um ponto comercial no bairro (aparece no mapa)
    if (e.pequeno) { if (!s.crescimento) s.crescimento = []; s.crescimento.push({ id: 'c' + (uid++), tipo: 'loja', bairro: e.bairro, x: null, y: null, seed: Math.floor(Math.random() * 1e6), empresa: e.id, cor: c.cor }); }
    if (e.status === 'instalacao') iniciarInstalacao(e);
    else Sim.noticia(4, `Acordo com ${c.nome} vai à votação na Câmara`, 'Incentivos fiscais precisam de aprovação dos vereadores');
    Sim.emit('acordo', e);
    Sim.emit('mudou');
    return e;
  }
  function incentivosDe(p) {
    const ip = dadoDe(p, 'isencaoIPTU') || {}, is = dadoDe(p, 'reducaoISS') || {}, ter = dadoDe(p, 'doacaoTerreno') || {}, it = dadoDe(p, 'isencaoITBI') || {}, inf = dadoDe(p, 'infra') || {};
    const temIptu = (ip.pct || 0) > 0 && (ip.anos || 0) > 0, temIss = ptsBruto('reducaoISS', is) > 0;
    return {
      iptuPct: temIptu ? ip.pct : 0, iptuAnos: temIptu ? ip.anos : 0,
      issTaxa: temIss ? is.taxa : null, issAnos: temIss ? is.anos : 0,
      terrenoDesc: ter.pct || 0, doacao: (ter.pct || 0) >= 1,
      itbiPct: it.pct || 0, itbi: (it.pct || 0) > 0, infra: inf.valor || 0,
    };
  }
  function iniciarInstalacao(e) {
    const s = S();
    s.caixa -= e.incentivos.infra;
    s.caixa += e.vendaLote;
    e.status = 'instalacao';
    Sim.noticia(6, `${e.nome} começa a construir sua sede na cidade`, `${e.empregos} empregos previstos · obra de ${e.mesesTotal} meses` + (e.vendaLote ? ` · terreno vendido por ${Sim.fmtDinheiro(e.vendaLote)}` : ''));
    s.humor.grupos.trab = (s.humor.grupos.trab || 0) + 2;
    s.humor.grupos.emp = (s.humor.grupos.emp || 0) + 2;
    Sim.emit('obra');
  }

  // votação na Câmara (chamada todo dia pela simulação)
  function votarPauta() {
    const s = S(); garantirEstado();
    for (const e of s.empresas) {
      if (e.status !== 'camara' || !e.sessao || e.sessao.mesIndex !== s.mesIndex || e.sessao.dia !== s.dia) continue;
      const c = cat(e.catId);
      const votos = s.vereadores.map(v => {
        const sc = notaVereador(v, e.empregos, e.incentivoPts, c.poluicao, e.bairro) + rnd(-8, 8);
        return { nome: v.nome, partido: v.partido, lado: v.lado, sim: sc >= 50 };
      });
      const sim = votos.filter(v => v.sim).length;
      const res = { empresa: e, votos, sim, nao: votos.length - sim, aprovado: sim >= 6 };
      if (res.aprovado) {
        Sim.noticia(5, `Câmara aprova incentivos para ${e.nome} por ${sim} a ${11 - sim}`, 'Obra deve começar ainda este mês');
        iniciarInstalacao(e);
      } else {
        Sim.noticia(6, `Câmara barra incentivos e ${e.nome} desiste da cidade`, `Placar: ${sim} a ${11 - sim}`);
        e.status = 'cancelada';
        liberarLote(e);
        s.candidato.forca = clamp(s.candidato.forca + 2, 0, 95);
      }
      Sim.emit('votacaoEmpresa', res);
      Sim.emit('mudou');
    }
  }
  function notaVereador(v, empregos, incentivoPts, poluicao, bairro) {
    return v.lealdade + Math.min(40, empregos / 15) - (v.lado === 'opos' ? 12 : 0) - incentivoPts * 0.3
      - poluicao * 6 * (v.bairro === bairro ? 1 : 0.3);
  }
  // quantos vereadores devem votar a favor (sem o fator sorte)
  function preverCamara(p) {
    const c = cat(p.catId), l = loteDe(p);
    const pts = p.pedidos.filter(x => PEDIDOS_EMPRESA[x.tipo].fiscal && pedidoAplica(p, x)).reduce((sum, x) => sum + ptsBruto(x.tipo, x.dado), 0);
    return S().vereadores.filter(v => notaVereador(v, c.empregos, pts, c.poluicao, l ? l.bairro : (p.bairro || 'rural')) >= 50).length;
  }
  function liberarLote(e) {
    const s = S(), l = s.lotes.find(x => x.id === e.loteId); if (l && l.empresa === e.id) l.empresa = null;
    if (s.crescimento) s.crescimento = s.crescimento.filter(x => x.empresa !== e.id);
  }

  // ------------------------------------------------------------ mês a mês
  function mes() {
    const s = S(); garantirEstado();
    // propostas que ninguém respondeu
    for (const p of s.propostas.slice()) if (s.mesIndex >= p.expira) desistir(p, 'prazo');
    // chegada de novas propostas

    for (const e of s.empresas) {
      if (e.status === 'instalacao') {
        e.mesesRest--;
        if (e.mesesRest <= 0) {
          e.status = 'operando'; e.inicio = s.mesIndex;
          for (const cp of e.contrapartidas) {
            const pz = CONTRAPARTIDAS[cp.id].prazo;
            if (pz === 0) cp.status = 'cumprida'; else cp.prazo = s.mesIndex + pz;
          }
          Sim.noticia(7, `${e.nome} inaugura e abre ${e.empregos} vagas`, 'Fila de currículos dobra o quarteirão');
          s.humor.global += 2;
          Sim.emit('inauguracaoEmpresa', e);
        }
      } else if (e.status === 'operando') {
        // fim dos incentivos
        const idade = s.mesIndex - e.inicio;
        if (e.incentivos.iptuAnos && idade === e.incentivos.iptuAnos * 12) { Sim.noticia(3, `Acaba o desconto de IPTU de ${e.nome}`, 'Empresa passa a pagar imposto normalmente'); e.satisfacao -= 8; }
        if (e.incentivos.issAnos && idade === e.incentivos.issAnos * 12) { Sim.noticia(3, `Termina o ISS reduzido de ${e.nome}`, ''); e.satisfacao -= 8; }
        // fiscalização das contrapartidas
        for (const cp of e.contrapartidas) {
          if (cp.status !== 'pendente' || cp.prazo == null || s.mesIndex < cp.prazo) continue;
          if (Math.random() < cp.chance) {
            cp.status = 'cumprida';
            Sim.noticia(4, `${e.nome} entrega: ${CONTRAPARTIDAS[cp.id].nome.toLowerCase()}`, 'Contrapartida cumprida no prazo');
            s.humor.bairros[bairroEfeito(e)] = (s.humor.bairros[bairroEfeito(e)] || 0) + 2;
          } else {
            cp.status = 'atrasada';
            s.cobrancas.push({ empresaId: e.id, cp: cp.id });
            Sim.noticia(5, `${e.nome} não cumpre o prometido: ${CONTRAPARTIDAS[cp.id].nome.toLowerCase()}`, 'Moradores cobram a prefeitura');
            Sim.emit('cobranca', { empresa: e, cp });
          }
        }
        // empresa insatisfeita vai embora
        if (e.satisfacao < 15 && Math.random() < 0.3) {
          e.status = 'fechou';
          liberarLote(e);
          Sim.noticia(8, `${e.nome} fecha as portas e deixa a cidade`, `${e.empregos} trabalhadores demitidos`);
          s.humor.grupos.trab = (s.humor.grupos.trab || 0) - 4;
          s.candidato.forca = clamp(s.candidato.forca + 4, 0, 95);
          Sim.emit('mudou');
        }
        e.satisfacao = clamp(e.satisfacao + 0.5, 0, 100);
      }
    }
  }

  // chamado todo dia: propostas chegam espalhadas pelo mês
  function dia() {
    const s = S(); garantirEstado();
    // a primeira proposta do jogo chega logo nos primeiros dias
    const primeira = !s.empresas.length && !s.empresasUsadas.length && !s.propostas.length && s.mesIndex === 0 && s.dia >= 4;
    if (primeira || (s.mesIndex >= s.proxProposta && s.propostas.length < 3 && Math.random() < 1 / 10)) {
      if (gerarProposta()) s.proxProposta = s.mesIndex + (Math.random() < 0.6 ? 0 : 1);
    }
    if (s.prospeccaoDia && s.prospeccaoDia <= s.mesIndex * 31 + s.dia && s.propostas.length < 4) {
      s.prospeccaoDia = null;
      if (!gerarProposta()) Sim.noticia(2, 'Missão de prospecção volta sem interessados', 'Nenhuma empresa compatível com o porte da cidade');
    }
  }
  const CUSTO_PROSPECCAO = 150e3;
  function podeProspectar() { const s = S(); garantirEstado(); return s.mesIndex - s.prospeccao >= 3 && !s.prospeccaoDia; }
  // gasta dinheiro para trazer uma proposta em ~10 dias
  function prospectar() {
    const s = S(); if (!podeProspectar()) return false;
    s.caixa -= CUSTO_PROSPECCAO; s.prospeccao = s.mesIndex;
    s.prospeccaoDia = s.mesIndex * 31 + s.dia + 8 + Math.floor(Math.random() * 6);
    Sim.noticia(2, 'Prefeitura leva estande da cidade a feira de investimentos na capital', '');
    Sim.emit('mudou');
    return true;
  }

  function decidirCobranca(empresaId, cpId, escolha) {
    const s = S();
    const e = s.empresas.find(x => x.id === empresaId); if (!e) return;
    const cp = e.contrapartidas.find(x => x.id === cpId); if (!cp) return;
    s.cobrancas = s.cobrancas.filter(x => !(x.empresaId === empresaId && x.cp === cpId));
    const c = cat(e.catId);
    if (escolha === 'multar') {
      const multa = Math.round(c.invest * 0.02 / 1e4) * 1e4;
      s.caixa += multa; e.satisfacao -= 25; cp.status = 'pendente'; cp.prazo = s.mesIndex + 6; cp.chance = Math.min(0.95, cp.chance + 0.2);
      Sim.noticia(4, `Prefeitura multa ${e.nome} em ${Sim.fmtDinheiro(multa)}`, 'Empresa tem 6 meses para cumprir o acordo');
      s.humor.global += 1;
      return { multa };
    }
    if (escolha === 'prazo') {
      cp.status = 'pendente'; cp.prazo = s.mesIndex + 6; e.satisfacao += 5;
      s.humor.global -= 1;
      Sim.noticia(2, `Prefeitura dá mais 6 meses para ${e.nome}`, 'Oposição fala em "prefeito frouxo"');
      return {};
    }
    if (escolha === 'justica') {
      cp.status = 'pendente'; cp.prazo = s.mesIndex + 12; cp.chance = 0.92; e.satisfacao -= 15;
      Sim.noticia(3, `Prefeitura processa ${e.nome} na Justiça`, 'Juiz deve decidir em até um ano');
      return {};
    }
  }

  // ------------------------------------------------- efeitos na cidade
  const ativas = () => (S().empresas || []).filter(e => e.status === 'operando');
  function bairroEfeito(e) { return e.bairro === 'rural' ? 'operaria' : e.bairro; }
  function isento(e, tipo) {
    const anos = tipo === 'iptu' ? e.incentivos.iptuAnos : e.incentivos.issAnos;
    return !!anos && (S().mesIndex - e.inicio) < anos * 12;
  }
  // fator do IPTU que a empresa paga (1 = cheio) e alíquota de ISS em vigor
  function fatorIPTU(e) { return isento(e, 'iptu') ? 1 - (e.incentivos.iptuPct == null ? 1 : e.incentivos.iptuPct) : 1; }
  function aliquotaISS(e) { const n = S().impostos.iss; return isento(e, 'iss') ? Math.min(n, e.incentivos.issTaxa || 2) : n; }

  function receitaMensal() {
    const s = S(); let iss = 0, icms = 0, iptu = 0;
    for (const e of s.empresas || []) {
      const c = cat(e.catId);
      if (e.status === 'instalacao') iss += c.invest * 0.3 / c.meses * s.impostos.iss / 100; // ISS da construção
      if (e.status !== 'operando') continue;
      iss += c.iss * aliquotaISS(e) / 100;
      icms += c.icms;
      iptu += c.venal * taxaIPTU(c, e.bairro === 'rural' ? null : e.bairro) / 100 / 12 * fatorIPTU(e);
    }
    return { iss, icms, iptu };
  }

  function reducaoDesemprego() {
    const s = S(); const forca = Sim.popTotal() * 0.48;
    let red = 0;
    for (const e of s.empresas || []) {
      const c = cat(e.catId);
      if (e.status === 'instalacao') red += e.empregos * 0.25 / forca * 100;
      if (e.status !== 'operando') continue;
      const local = e.contrapartidas.some(x => x.id === 'maoDeObra' && x.status === 'cumprida') ? 0.85 : 0.55;
      red += e.empregos * local / forca * 100 * 0.65;
      if (e.contrapartidas.some(x => x.id === 'cursos' && x.status === 'cumprida')) red += 0.4;
      if (c.qualificacao) red += c.qualificacao;
    }
    return red;
  }

  function poluicaoBairro(bairro) {
    let p = 0;
    for (const e of ativas()) {
      const c = cat(e.catId); if (!c.poluicao) continue;
      const fator = e.contrapartidas.some(x => x.id === 'ambiental' && x.status === 'cumprida') ? 0.4 : 1;
      if (e.bairro === bairro) p += c.poluicao * fator;
      else if (e.bairro === 'distrito' && bairro === 'centro') p += c.poluicao * fator * 0.3;
      else if (e.bairro === 'rural') p += c.poluicao * fator * 0.25;
    }
    return p;
  }

  function efeitos() {
    const g = {}, b = {};
    const add = (obj, k, v) => obj[k] = (obj[k] || 0) + v;
    let n = 0, isencoes = 0;
    for (const e of ativas()) {
      const c = cat(e.catId); n++;
      for (const k in c.efeitos) add(g, k, c.efeitos[k]);
      if (c.turismo) add(g, 'com', c.turismo);
      if (isento(e, 'iptu') || isento(e, 'iss')) isencoes++;
      if (e.contrapartidas.some(x => x.id === 'cursos' && x.status === 'cumprida')) { add(g, 'jovens', 1.5); add(g, 'trab', 1); }
      if (e.contrapartidas.some(x => x.id === 'cultura' && x.status === 'cumprida')) { add(g, 'jovens', 1); add(g, 'fam', 1); }
      for (const cp of e.contrapartidas) if (cp.status === 'atrasada') add(b, bairroEfeito(e), -2);
    }
    add(g, 'emp', Math.min(6, n));
    add(g, 'com', -0.7 * isencoes); // "o pequeno paga, o grande não"
    for (const bb of BAIRROS) { const p = poluicaoBairro(bb.id); if (p) add(b, bb.id, -p * 3); }
    return { grupos: g, bairros: b };
  }

  function coberturaExtra() {
    const out = [];
    for (const e of ativas()) {
      const c = cat(e.catId), bairro = bairroEfeito(e);
      if (c.cobertura) out.push({ bairro, cat: c.cobertura.cat, cap: c.cobertura.cap });
      for (const cp of e.contrapartidas) {
        if (cp.status !== 'cumprida') continue;
        if (cp.id === 'creche') out.push({ bairro, cat: 'creche', cap: 150 });
        if (cp.id === 'ubs') out.push({ bairro, cat: 'saude', cap: 5000 });
        if (cp.id === 'escola') out.push({ bairro, cat: 'educacao', cap: 250 });
        if (cp.id === 'praca') out.push({ bairro, cat: 'lazer', cap: 3000 });
        if (cp.id === 'cultura') out.push({ bairro: 'centro', cat: 'lazer', cap: 1500 });
      }
    }
    return out;
  }

  // turismo e migração (chamado na economia mensal)
  function turismoTotal() { return ativas().reduce((s, e) => s + (cat(e.catId).turismo || 0), 0); }
  function migracao() {
    const s = S(); let m = 0;
    for (const e of ativas()) if (s.mesIndex - e.inicio < 18) m += e.empregos * 0.03;
    return m;
  }

  return {
    cat, garantirEstado, disponiveis, futuras, lotesCompativeis, gerarProposta, avaliar, proporRodada, recusar, desistir,
    pedidoAplica, ptsPedido, ptsBruto, descPedido, preverCamara, valorDado, loteDe, atendido, opcoesDe, sondar, oferecerExtra, removerExtra, migrarProposta, fatorIPTU, aliquotaISS, taxaIPTU, PRIORIDADES, multCusto, votarPauta, mes, decidirCobranca,
    dia, prospectar, podeProspectar, CUSTO_PROSPECCAO, opiniao, escolherBairroPequeno,
    receitaMensal, reducaoDesemprego, poluicaoBairro, efeitos, coberturaExtra, turismoTotal, migracao, ativas, isento,
  };
})();
