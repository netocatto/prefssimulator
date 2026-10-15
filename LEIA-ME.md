# Prefeito — versão 0.8

Jogo de gestão pública em pixel art no estilo "fazendinha" (alta resolução). Você é prefeito de uma cidade de 25 mil habitantes no interior paulista e precisa se reeleger a cada 2 anos.

## Como abrir

Dê dois cliques em `index.html`. Ele abre no navegador (Chrome ou Edge).
O jogo salva sozinho no fim de cada dia, no próprio navegador. Cada cidade tem o seu jogo salvo; ao abrir, escolha qual continuar ou comece um novo.
A fonte dos textos (Nunito) vem junto, na pasta `fonts`, e funciona sem internet. Só o título PREFEITO usa uma fonte pixelada do Google Fonts.

## Controles

- **Arrastar** o mapa para andar; **roda do mouse** ou **pinça** para zoom; **WASD/setas** também movem.
- **Clique num lote** para construir; clique num bairro para ver seus números.
- **Balões** sobre as casas são moradores falando com a prefeitura. Clique neles.
- A **barra de ícones** embaixo abre os painéis (passe o mouse para ver o nome). Teclas **1 a 9**, **0** e **R** também; **espaço** pausa.
- **M** liga/desliga a música e **N** os efeitos sonoros (também pelos botões ♫ e ♪ no relógio).
- Velocidade: pausa, 1x, 2x, 5x e **Próximo mês**. A duração de 1 dia depende do ritmo escolhido.
- **☾ Dormir** (ou tecla **Z**) encerra o dia e acorda às 6h do dia seguinte.
- **☰ Menu** salva e volta à lista de jogos salvos.

## O que já existe

- **Negociação mais justa:** as empresas aceitam contrapartidas com mais facilidade. Cada contrapartida mostra se é leve, média ou pesada para aquela empresa: uma creche pesa para uma academia, mas pouco para uma montadora.
  - O interesse das empresas pela cidade aparece na mesa e sobe com a população, a mão de obra disponível, a aprovação do prefeito e as empresas que já vieram.
  - Dificuldade: no Fácil as empresas cedem mais, têm mais paciência e cidades rivais aparecem menos; no Difícil cobram quase tudo o que pedem e disputam mais com as rivais.
  - Quanto maior a cidade, mais propostas chegam.
- **Recolher painéis:** o botão – / + no canto da placa da cidade e do relógio recolhe e expande cada um. Recolhidos, mostram só o essencial (cidade e aprovação; data, hora, pausa/play e caixa). Em telas pequenas já começam recolhidos, e a escolha fica salva.
- **v0.8, negociação flexível com empresas:**
  - Cada pedido é negociado em partes: IPTU com desconto de 25%, 50%, 80% ou isenção, e prazo de 1 a 10 anos; ISS com alíquota de 4%, 3%, 2,5% ou 2%, e prazo; terreno público pelo preço cheio, com 25%, 50% ou 75% de desconto, ou doado; obras de acesso de 25% a 125% do valor pedido; ITBI com 50% de desconto ou isento.
  - Prioridades: cada empresa mostra o que é Essencial, Importante ou Desejável para ela. Ceder no que é essencial vale mais; o que passa do pedido vale só metade.
  - Barra "Atende X% do pedido" em cada item.
  - Ofertas extras: dá para oferecer algo que a empresa não pediu (vale menos, mas ajuda).
  - **Perguntar o que falta** (2 vezes por negociação, sem gastar paciência): a empresa diz o que precisaria para fechar, e um botão coloca a sugestão na proposta.
  - Contrapropostas concretas: a empresa responde com valores no meio do caminho, por exemplo "80% de desconto no IPTU por 3 anos".
- **v0.7.1:** fonte nova e mais legível (Nunito) e jogo mais leve: menos nuvens, carros e pedestres, no máximo 60 quadros por segundo, luz do dia sem efeito de mistura pesado e pedido de placa de vídeo dedicada quando houver.
- **Novo na v0.7:**
  - Menu de jogos salvos: vários jogos ao mesmo tempo, com cidade, prefeito, data, dificuldade e aprovação. Jogar ou apagar (pede confirmação).
  - Ritmo do jogo: Rápido (1 dia = 30 s), Médio (1 dia = 1 min) ou Lento (1 dia = 10 min).
  - Dificuldade: Fácil (R$ 15 mi em caixa, Câmara amiga, oposição fraca), Médio (R$ 4,2 mi) ou Difícil (R$ 500 mil, dívidas maiores, desemprego alto, Câmara hostil).
  - Relógio com hora do dia, botão Dormir e luz que muda: amanhecer, entardecer e noite.
  - Termômetro da população em cada proposta de empresa: quanto cada grupo é a favor ou contra, e por quê (empregos, poluição, incentivos, contrapartidas). Fechar o acordo mexe no humor dos grupos; recusar uma empresa querida também custa.
  - 14 empresas novas (academia, clínica, cinema, escola de idiomas, software, posto, pet shop, restaurante, materiais de construção, móveis, transportadora, laticínio, cooperativa e olaria). Negócios pequenos alugam um ponto no bairro e não precisam de lote. Propostas chegam com mais frequência (até 3 na mesa).
  - Crescimento natural: casas, sobrados e mansões surgem sozinhos quando a população cresce; lojinhas abrem e fecham conforme a economia. As grandes decisões (obras, empresas, impostos) continuam com você.
- Tela inicial: nome da cidade, nome do prefeito, ritmo, dificuldade e 3 promessas de campanha.
- 4 bairros (Centro, Vila Operária, Jardim Nobre, Distrito Industrial) e 2 áreas bloqueadas para expansão.
- 14 lotes livres (alguns particulares, que exigem desapropriação) e 8 tipos de prédio público.
- Orçamento realista: IPTU por bairro, ISS, ITBI, taxa de lixo, FPM, cota do ICMS e do IPVA, FUNDEB, SUS, 13º salário em dezembro e repasse à Câmara.
- Mínimos constitucionais (15% saúde, 25% educação) conferidos pelo Tribunal de Contas em dezembro.
- Câmara com 11 vereadores (base, independentes e oposição), reuniões, pedidos e votação de projetos.
- Aumentos de imposto respeitam anterioridade e noventena.
- Aprovação por 6 grupos e por bairro, desemprego, migração do comércio para cidades vizinhas com ISS menor.
- 5 cidades rivais: Ribeirão Torto, Pedra Grande do Sul, Monte Raso, Cerrado Alto e Serra do Jacu.
- Jornal mensal "Correio de [sua cidade]", pesquisas eleitorais, candidato de oposição e eleição em outubro.
- Festa junina, Copa do Mundo, carnaval e aniversário da cidade.
- **Empresas (v0.3):** 39 empresas fictícias (indústrias, comércio, hotéis, faculdades, call center, data center, usinas, hospital particular, parque aquático, shopping, aeroporto...). Cada uma só aparece quando a cidade tem habitantes suficientes.
  - Propostas chegam a cada poucos meses; algumas são disputadas por uma cidade rival e expiram mais rápido.
  - Mesa de negociação: a empresa pede (isenção de IPTU, ISS reduzido, doação de terreno, obras, ITBI) e a prefeitura exige (mão de obra local, cursos, creche, posto de saúde, escolas, praça, cultura, compensação ambiental). Termômetro mostra o clima; cada proposta gasta paciência.
  - Incentivos fiscais e doação de terreno passam por votação na Câmara.
  - A empresa ocupa um lote, constrói e aparece no mapa. Gera empregos, ISS, ICMS, IPTU, atrai moradores, pode poluir e irritar o pequeno comércio.
  - Fiscalização: se a empresa não cumprir uma contrapartida, você escolhe multar, dar prazo ou processar. Empresa muito insatisfeita fecha as portas.
  - A primeira proposta chega nos primeiros dias. O botão **Prospectar empresas** (R$ 150 mil, a cada 3 meses) traz uma nova em cerca de 10 dias.
- **Licitações (v0.4):**
  - Toda obra pública vai a licitação: três construtoras (preço baixo, equilibrada, alta qualidade) com valor, prazo, manutenção futura e riscos de aditivo, atraso e abandono. Às vezes uma delas é indicada por um vereador.
  - Obra abandonada fica parada até uma nova licitação.
  - Contratos de serviço com custo fixo mensal (12, 24 ou 48 meses): coleta de lixo, ônibus circular, merenda, LED, câmeras, tapa-buraco, Wi-Fi, gestão de UBS por OS, farmácia popular e jardinagem. Romper custa multa de 3 meses.
- **Ouvidoria (v0.5):** resumo das 5 maiores necessidades da população, com peso nas queixas, bairros e grupos mais afetados e o que resolve. Botão para responder todas as mensagens.
- **Recursos federais e estaduais (v0.5):** 12 programas (creche, escola, UBS, hospital regional, praça, cultura, bombeiros, guarda, asfalto, ônibus, LED, merenda).
  - Pedir custa o projeto técnico; a resposta sai em 1 a 2 meses. A chance depende do alinhamento político com o presidente e o governador e da aprovação do prefeito.
  - Deputados oferecem emendas de tempos em tempos.
  - Toda verba aprovada chega como oferta: aceitar ou recusar. Aceita, paga parte da obra ou do contrato daquele tipo (com contrapartida). Não usada no prazo, é perdida.
  - Bloqueios reais: caixa negativo ou contas rejeitadas (CAUC) e vedação eleitoral nos 3 meses antes da eleição. Eleições gerais trocam presidente e governador.
- **Visual (v0.6):** arte em alta resolução (desenho suavizado em 2x com Scale2x, grama com folhas, sombras macias, textura), sombras de nuvens, brilho no rio e luz ambiente. Interface com molduras de madeira e pergaminho, placa da cidade, relógio com caixa e barra de ícones embaixo.
- **Som (v0.5):** música de fundo 8-bit em ritmo de baião e efeitos sonoros, gerados por código (sem arquivos de áudio).
- **Impactos antes de agir (v0.4):** obras, contratos, pedidos de vereador, orçamento, impostos e prospecção mostram custo inicial, manutenção, efeito no saldo mensal, população atendida, empregos e efeito estimado na aprovação.

## Estrutura dos arquivos

| Arquivo | O que tem |
| --- | --- |
| `js/data.js` | Conteúdo: bairros, prédios, lotes, vereadores, promessas, cidades rivais |
| `js/sim.js` | Regras: finanças, aprovação, Câmara, eleição, jornal |
| `js/empresas.js` | Catálogo de empresas, negociação, instalação, efeitos e fiscalização |
| `js/licitacoes.js` | Construtoras, licitação de obras, contratos de serviço e seus efeitos |
| `js/recursos.js` | Programas federais e estaduais, emendas, ofertas e convênios |
| `js/som.js` | Música e efeitos sonoros (Web Audio) |
| `js/art.js` | Pixel art gerada por código, versão em alta resolução, ícones e moldura de madeira |
| `js/map.js` | Mapa e cena do Phaser: câmera, trânsito, balões, inaugurações |
| `js/ui.js` | Painéis, jornal, votação, eleição e tela inicial |
| `css/style.css` | Visual da interface |
| `lib/phaser.min.js` | Motor Phaser 3.80.1 (funciona sem internet) |

## Próximos passos sugeridos

1. Eventos culturais: show local, nacional e internacional, com patrocínio.
2. Reuniões com secretários (competência, lealdade, honestidade).
3. Eventos aleatórios: enchente, greve, surto de dengue.
4. Liberar os bairros Polo Leste e Jardim das Flores (o Polo Leste pode receber as grandes indústrias).
5. Versão para celular e tablet (Capacitor), em modo paisagem.
