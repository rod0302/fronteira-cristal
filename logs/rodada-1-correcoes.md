# Rodada 1: correções

Notas da rodada: jogabilidade e clareza 6,5 · bugs e robustez 6,5 · IA e equilíbrio 4.
Corrigi do mais grave para o menos grave. Cada item aponta o problema do relatório do crítico.

## Bloqueiam a partida

| Problema | O que foi feito |
|---|---|
| Vender a Central com um clique (jogabilidade 1, bugs 1) | A Central não pode ser vendida ("não pode ser vendida" no painel). Qualquer venda pede confirmação: o botão vira "Confirmar?" por 3 s. |
| "Menu principal" na pausa deixa a partida rodando, que depois vira DERROTA por cima do título (bugs 2) | O botão agora começa a partida de demonstração (IA contra IA), como na abertura do jogo. |
| Mapa favorece o canto do jogador: a IA tem metade do cristal (IA 1) | Mapa gerado com simetria de ponto: `tile(x,y) = tile(79−x, 79−y)`, conferido tile a tile (diferença 0) nos 3 mapas. A porta da Refinaria e a saída das fábricas ficam viradas para o centro do mapa. |
| Blindados vencem tudo; o blindado não tem contra de mesmo custo (IA 2 e 3) | Novo soldado **Foguete** (180, lança-foguetes, alcance 4,5, bom contra blindados). Bala contra blindagem pesada caiu de 0,5 para 0,3. Blindado subiu de 600 para 700. A IA passa a produzir mais Foguetes quando o inimigo tem muitos blindados. |

## Atrapalham

| Problema | O que foi feito |
|---|---|
| Clique direito é "mover puro": o exército atravessa o inimigo sem atirar (jogabilidade 2) | Unidade em movimento atira no que estiver ao alcance sem parar (mover continua sendo mover, mas ninguém mais morre sem revidar). A ajuda explica a diferença para atacar-movendo. |
| Atacar-movendo não aceita o minimapa (jogabilidade 3) | A + clique no minimapa dá atacar-movendo. |
| 3 minutos com 0 créditos no começo (jogabilidade 4) | Crédito inicial de 2500 para 3000. O Objetivo sugere o 2º Coletor. |
| Economia sobra demais (IA 4) | Coletor: carga 700 → 500, colheita 70 → 40 por s, descarga 250 → 160 por s. |
| IA não se recupera quando perde a Refinaria (IA 5) | A Refinaria vira prioridade; sem refinaria a IA para de produzir unidades e guarda dinheiro; depois de 10 s sem dinheiro vende o prédio dispensável mais barato. Repara prédios abaixo de 50% quando tem mais de 500. |
| Ondas levam o exército inteiro, composição ruim, sem adaptação (IA 6, jogabilidade 5) | Parte do exército fica em casa (40/30/25% conforme a dificuldade). A onda sai com o tamanho da vez e recua quando cai abaixo de 35% de quem saiu. Infantaria limitada a 30% do exército. Mais Foguetes e menos batedores contra muitos blindados. |
| Dificuldade quase só muda o relógio (IA 7) | Cada dificuldade muda agora: rendimento do cristal (0,75/1,0/1,4), velocidade de produção, número de fábricas (1/2/2), coletores máximos (3/5/6), primeira onda, intervalo, tamanho e crescimento das ondas, quanto fica em casa, obuseiros (não no Fácil) e incursões (não no Fácil). |
| Equilíbrio das facções (IA 8) | Medido em 72 partidas IA contra IA e ajustado: Cobalto +18% de vida, Brasa tiro 18% mais rápido, Âmbar 8% mais barato (a 12% o Âmbar vencia 20 de 24). |
| Névoa mostra prédios inimigos novos (bugs 3) | Prédio inimigo só aparece depois de visto (`seen`), e fica como foi visto. |
| Telas baixas cortam o painel (bugs 4) | Minimapa encolhe e as linhas de botões comprimem (26 a 54 px) para caber em 500 px de altura. |
| Rolagem pela borda dispara sobre o painel e a barra (bugs 5, jogabilidade 14) | Só rola com o mouse dentro da área do mapa. |
| Sem limite de unidades; custo quadrático (bugs 6) | Limite de 60 unidades por time; procura de alvo de quem está parado a cada 10 passos, escalonada pelo id. |
| Reparar a Central é de graça (bugs 7) | Reparo da Central custa como um prédio de 1500. |
| Avisos empilham e cobrem o mapa (jogabilidade 6) | Avisos iguais se juntam ("x3"); no máximo 5 na tela; alertas ficam por cima e duram 8 s. |
| Mensagem errada com outro prédio PRONTO esperando lugar (jogabilidade 7) | O clique verifica primeiro o motivo do bloqueio e só depois o prédio pronto. |

## Detalhes

| Problema | O que foi feito |
|---|---|
| Objetivo some com algo selecionado (jogabilidade 8) | Linha "Objetivo:" fixa embaixo da barra superior. |
| "Quartel pronta", "Radar pronta" (jogabilidade 9) | Gênero de cada prédio no catálogo; avisos concordam ("pronto/pronta", "destruído/destruída"). |
| Unidades novas param todas no mesmo ponto (jogabilidade 10) | Cada unidade nova vai para uma vaga livre perto do ponto de encontro (ou 3 tiles para fora da porta). |
| Exército inicial no lugar natural do 2º prédio (jogabilidade 11) | Exército começa na diagonal da Central, voltado para o centro. |
| Sem indicação do alcance de construção (jogabilidade 12) | Em modo de posicionar, a área válida fica destacada. |
| Comprar e vender refinaria dá coletor barato (bugs 8) | A Refinaria vende como se valesse 300 (o coletor que veio junto já foi aproveitado). |
| Prédio pronto colocado sem Central (bugs 9) | `placeConstruction` também exige a Central. |
| Prédio em cima do corpo de unidade (bugs 10) | A verificação usa o corpo inteiro (raio) da unidade. |
| Ordem em penhasco profundo ignorada (bugs 11) | Busca de chão livre até 24 tiles. |
| Clique na barra superior passa para o mundo (bugs 12) | Cliques na barra são ignorados. |
| Seleção em caixa pega unidades atrás do painel (bugs 13) | Caixa limitada à área do mapa; com unidades de combate na caixa, coletores ficam de fora. |
| Coletor descarrega de longe (bugs 14) | Só descarrega encostado na doca ou, depois de 4 tentativas, a até 3 tiles da refinaria. |
| Texto cortado no painel (bugs 15, jogabilidade 13) | Ícones menores e fonte de 11 px nos botões; textos medidos para caber. |
| Partidas sempre iguais (IA 9) | 3 mapas (Planalto Gêmeo, Vale Partido, Três Campos) escolhidos no título. Cada partida começada pelo título sorteia uma semente para a IA: abertura (quartel ou fábrica primeiro) e primeira onda ±30 s. Com a mesma semente a partida se repete (testes). |
| IA não faz incursão nem caça coletores (IA 11) | No Normal e no Difícil, a cada 2,5 a 3,5 min, até 3 batedores em casa vão caçar o coletor inimigo mais próximo e voltam. |
| Não dá para escolher a facção do inimigo | Linha "INIMIGO" no título. |

## Problemas encontrados por mim durante as correções

- **Vantagem de lado escondida no código.** Com o mapa simétrico, IA contra IA ainda dava 8 de 9 vitórias ao time 0. Causas encontradas e corrigidas:
  - desempates de buscas (lugar de prédio, cristal, A*, vagas) sempre a favor do canto de cima;
  - intervalo da IA defasado em 0,5 s entre os times;
  - ponto de encontro e alvo da IA calculados no canto do tile e não no centro;
  - unidades novas do time de baixo mandadas para dentro do prédio;
  - sementes vizinhas do gerador davam sorteios parecidos para as duas IAs;
  - o time 0 sofria névoa no teste;
  - a ordem de processamento dava a vez sempre ao mesmo time, e agora alterna a cada passo.
- **Obuseiro matava soldado com um tiro em área** (75 de dano contra 70 de vida). Dano contra infantaria de 1,0 para 0,7.

## Recusados ou adiados

- **Fonte maior em telas grandes** (jogabilidade 13, parte). Adiado. O painel tem largura fixa de 220 px e escalar tudo pede refazer o layout. Melhorei o que estava cortado.
- **Unidades se sobrepõem em grupos grandes** (jogabilidade 15). Mantido como está. Já há duas passadas de separação por passo; mais que isso pesa no desempenho com 120 unidades.
- **Semente de mapa aleatória a cada partida** (IA 9). Recusado. Os mapas precisam ser simétricos, conectados e com bases boas. Preferi 3 mapas conferidos a mapas aleatórios sem garantia. A variedade vem da escolha de mapa e da semente da IA.

## Medições depois das correções

Bots de estratégia do crítico de IA, rodados contra a versão nova (facção 0):

| Estratégia | Fácil | Normal | Difícil |
|---|---|---|---|
| blindados (ataca com 8) | vitória 7 min | derrota 17 min | derrota 7 min |
| misto | vitória 16 min | derrota 14 min | derrota 7 min |
| economia | vitória 11 min | vitória 12 min | derrota 19 min |
| torres | empate 25 min | derrota 13 min | derrota 8 min |
| novato | derrota 13 min | derrota 9 min | derrota 6 min |
| parado | derrota 8 min | derrota 7 min | derrota 5 min |

- Antes, blindados vencia nas três dificuldades e misto também. Agora o Fácil é vencido por qualquer plano ativo e o Normal pede economia. O Difícil não foi vencido por nenhum bot simples.
- IA contra IA, mesma facção dos dois lados, 3 mapas × 3 facções × 24 sementes (216 partidas, normal): time de cima 97, time de baixo 115, 4 empates. Cada lote de 8 sementes pende para um lado ou outro (41/29, 25/45, 31/41): quem decide é o sorteio da IA (abertura e momento da onda), não o lado. Antes das correções: 27 de 27 para o time 0.
- Facções (IA contra IA, todas as combinações, 3 mapas, 2 sementes): Cobalto 13/36, Brasa 22/36, Âmbar 18/36 antes do ajuste fino do Brasa (0,82 → 0,85).
