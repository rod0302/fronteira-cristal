# Rodada 3: crítica de IA e equilíbrio (Fronteira Cristal)

Crítico com a lente **IA e equilíbrio**. Usei a cópia congelada em `/home/claude/criticos/rodada-3/jogo/`.
Os scripts rodam em Playwright com `window.__jogo` e não editam nenhum arquivo do jogo. Ficam em `/home/claude/criticos/rodada-3/ia/`.
Capturas: `/mnt/project-files/rts/logs/capturas/rodada-3-ia/`.
Usei **sementes novas** (11 a 13, 21 a 25, 31 a 38, 41 e 42, 51 a 58), diferentes das usadas nas rodadas anteriores e nos testes do projeto.

## Nota: **6,5 / 10**

A IA melhorou de verdade desde a rodada 2. Medi cada correção:

- a guarda não vai mais junto com a onda;
- quem bate num prédio troca de alvo e revida;
- o obuseiro do jogador funciona com névoa;
- a IA se recupera sem refinaria;
- o Difícil deixou de ser um muro absoluto.

Ainda não chega a 8, por estes motivos:

- **O Fácil não consegue terminar uma partida.** Contra torres empata sempre. Em IA contra IA Fácil empatou **35 de 36** partidas, porque chega ao limite de 60 unidades e manda ondas de no máximo 9.
- **O degrau Normal → Difícil continua íngreme.** Só 1 de 17 estratégias de bot vence o Difícil, e a IA de referência perde **45 de 45**.
- **O Âmbar virou a facção fraca:** 36 vitórias em 96 partidas, contra 49 do Cobalto e 50 da Brasa.
- **As descrições das unidades continuam mentindo.** O soldado vence o batedor e o blindado por custo, e o batedor não consegue "caçar coletores".
- **A economia dos mapas 1 e 2 seca no meio da partida.** A IA nunca se expande, e as partidas viram inanição ou se arrastam por 27 minutos (mediana em IA contra IA).

---

## Baterias (como reproduzir)

Todos os comandos rodam em `cd /home/claude/criticos/rodada-3/ia`.

| Bateria | Comando | Partidas |
|---|---|---|
| 17 estratégias de jogador × 3 dificuldades × 3 mapas × 3 sementes, até 25 min | `python3 gen.py <estratégias> facil,normal,dificil 11,12,13 1500 > b1.json && node run.js b1.json 6 > b1.out.json && python3 tab.py b1.out.json` | 459 |
| IA contra IA no Normal: 9 combinações de facção (cada uma dos dois lados) × 3 mapas × 8 sementes, até 45 min | `node run.js b2.json 4 > b2.out.json` | 216 |
| IA contra IA no Fácil e no Difícil: 6 combinações × 3 mapas × 2 sementes | `node run.js b3.json 4` | 72 |
| Simetria de lado: espelho de facção, com e sem troca de cantos (`trocarCantos`) | `node run.js b4.json 4` | 96 |
| Jogador de referência: a IA Normal **sem bônus** contra cada dificuldade | `node referencia.js 21,22,23,24,25` | 135 |
| Difícil com outros números contra a referência | `node referencia2.js '<json>' dificil` | 216 |
| Duelos de mesmo custo em campo aberto | `node duelo.js 1400`, `node duelo.js 4200` | 44 |
| Sondas: torres, obuseiro com névoa, troca de alvo, guarda, ondas, recuperação, cristal, alcance a pé, caça a coletores | `torre.js`, `arty.js`, `alvo.js`, `defesa.js`, `onda.js`, `recupera3.js`, `cristal.js`, `alcance.js`, `caca_coletor.js`, `raid.js` | ~60 |

Nenhum erro de página (`pageerror`) em mais de 1.200 partidas simuladas.

---

## Números de referência da IA (jogador parado, 9 partidas por dificuldade)

| Dificuldade | 1ª onda sai | Chega à base | Tamanho da 1ª onda | 2ª onda | Jogador parado morre aos |
|---|---|---|---|---|---|
| Fácil | 477 s (8,0 min) | 528 s | sempre 4 | 5 (+241 s) | 618 s (10,3 min) |
| Normal | 326 s (5,4 min) | 380 s | 7 a 13 (mapa 0: 10 a 13; mapas 1 e 2: 7 a 10) | 17 a 24 (+171 s) | 411 s (6,9 min) |
| Difícil | 266 s (4,4 min) | 317 s | 7 a 12 | 15 a 21 (+151 s) | 349 s (5,8 min) |

- **Coesão das ondas** (`onda.js`): na chegada, a distância entre a primeira e a última unidade é de **3 a 7 tiles** na 1ª onda e de **8 a 11** na 2ª. Na rodada 2 eram até 65 tiles. Corrigido.
- **Guarda** (`defesa.js`): no máximo **2 a 3** guardas da IA na base do jogador, num total de 13 a 26. Na rodada 2 eram 10 de 14. Corrigido.
- **Troca de alvo** (`alvo.js`): 12 soldados atacam-movendo uma Central e chegam 2 blindados. Os soldados agora revidam: um blindado termina com **168 de 472** de vida. Na rodada 2 os dois terminavam com 472. Corrigido para atacar-movendo. A ordem direta de ataque ainda trava, de propósito.
- **Obuseiro com névoa** (`arty.js`): 2 obuseiros do jogador destroem uma torre sem perdas, com e sem névoa. Corrigido.
- **Reconstrução** (`recupera3.js`, Fácil, aos 7 min):
  - sem refinarias e coletores, a IA vende as fábricas, refaz a refinaria em menos de 2 min e tem 2 refinarias e 3 coletores aos 6 min. Corrigido;
  - sem o exército: de 2 para 29 unidades em 6 min;
  - sem as usinas: tudo reconstruído em ~3 min.
- **A IA ameaça?**
  - No Normal e no Difícil, sim: um jogador passivo morre em menos de 7 min, e a 2ª onda já chega com 15 a 24 unidades.
  - No Fácil, só um jogador que não constrói nada morre (aos 10 min). Ver P1.

---

## Taxa de vitória das estratégias de jogador (bots)

Vitórias / derrotas / empates; 9 partidas por casa (3 mapas × sementes 11 a 13), limite de 25 min. Bateria `b1`.

| Estratégia | Fácil | Normal | Difícil |
|---|---|---|---|
| parado | 0/9/0 | 0/9/0 | 0/9/0 |
| rush com o exército inicial | 0/9/0 | 0/9/0 | 0/9/0 |
| rush de soldados | 3/6/0 | 1/8/0 | 0/9/0 |
| massa de blindados (ataques em gotas) | 9/0/0 | 2/7/0 | 0/9/0 |
| blindadosForte (micro e reagrupamento) | 9/0/0 | 4/5/0 | 0/9/0 |
| só batedores | 3/3/3 | 0/9/0 | 0/9/0 |
| só obuseiros | 9/0/0 | 0/8/1 | 0/9/0 |
| só torres | 0/0/**9** | 0/8/1 | 0/9/0 |
| avanço com torres | 0/0/**9** | 0/8/1 | 0/9/0 |
| economia (8 coletores, sem micro) | 9/0/0 | 1/5/3 | 0/9/0 |
| **ecoForte** (8 coletores, micro e reagrupamento) | 9/0/0 | **8/0/1** | **3/4/2** |
| misto | 8/0/1 | 0/9/0 | 0/9/0 |
| mistoForte (6 coletores, micro) | 9/0/0 | 1/8/0 | 0/9/0 |
| soldadosForte | 1/3/5 | 0/9/0 | 0/9/0 |
| torres e soldados | 0/0/9 | 0/9/0 | 0/9/0 |
| infantaria mista | 6/0/3 | 1/8/0 | 0/9/0 |
| blindados e torres | 6/0/3 | 0/8/1 | 0/9/0 |

O rush não funciona, e isso é saudável. Nenhuma estratégia é degenerada no sentido de "sempre vence". O problema é o contrário: no Normal e no Difícil, **só uma** estratégia funciona, a de economia máxima com micro. Ver P2.

---

## Problemas, em ordem de gravidade

Nenhum problema bloqueia a partida.

### ATRAPALHA (grave)

#### P1. A IA Fácil não consegue fechar uma partida: chega ao limite de unidades e manda ondas de no máximo 9

- **Contra torres:** as estratégias `torres`, `torreRasteira` e `torresSoldados` empatam **27 de 27** partidas no Fácil.
  - As ondas saem de 4 em 4 min com 4, 5, 6, 7, 8 e 9 unidades e morrem nas torres. Ondas de `torres`, mapa 0, semente 11: 496 s / 4, 737 s / 5, 978 s / 6, 1219 s / 7, 1460 s / 8.
  - Enquanto isso, a IA chega a **60 unidades** paradas em casa (`comp1`: 25 blindados, 19 batedores, 8 soldados, 4 foguetes, 4 coletores). 60 é o `UNIT_CAP`, então ela para de produzir.
  - Captura: `facil-60-unidades-paradas.png` (20:00, a massa vermelha parada no ponto de encontro).
- **IA contra IA Fácil** (`b3`): **35 empates em 36** partidas de 45 min.
  - Exemplo: mapa 0, semente 41. Aos 41 min são 56 x 47 unidades armadas e 27 x 18 prédios, e as ondas continuam em 9.
- **Causa:**
  - Não há `waveShare` no Fácil, então a onda nunca leva mais que `waveMax: 9`.
  - Sem obuseiros (`artillery: false`), nada derruba torres.
- **Por que atrapalha:** o iniciante que se fecha em torres nunca perde e nunca é empurrado a atacar. A partida fica parada indefinidamente. A IA parece "quebrada", com 50 tanques parados.
- **Sugestão:**
  - Fácil com `waveMax: 12` e `waveShare: 0.4`. Com exército em casa acima de 25, a onda leva 40% dele.
  - Liberar 1 ou 2 obuseiros depois de 20 min ou de 3 ondas fracassadas (`artillery: 'tarde'`).
  - Depois de 30 min, `waveGap` cai de 240 para 150.

#### P2. O degrau Normal → Difícil continua íngreme; Difícil só cede a uma única estratégia

- **Jogador de referência** (a própria IA Normal sem bônus, `node referencia.js 21,22,23,24,25`, 45 partidas por linha):

  | Contra | Vitórias da referência | Derrotas | Empates |
  |---|---|---|---|
  | Fácil | **45** | 0 | 0 (vence aos 15,5 min) |
  | Normal | 20 | 23 | 2 (equilibrado) |
  | Difícil | **0** | **45** | 0 (morre aos 18,6 min) |

- **Bots:** 1 de 17 estratégias vence o Difícil (`ecoForte`, 3 de 9). Na rodada 2 eram 0 em 240, então houve progresso. Ainda assim, quem não joga com 8 coletores e micro perde **sempre**. O `mistoForte` (6 coletores, micro, reagrupamento) perde 9 de 9.
- **Não é só o bônus.** Com o bônus de renda e produção zerado, o comportamento do Difícil sozinho ainda vence a referência (`node referencia2.js '<json>' dificil`, 36 partidas, sementes 21 a 24):

  | Difícil com | Referência vence / perde / empata |
  |---|---|
  | números atuais (renda 1,2 e produção 1,1) | 0 / 45 / 0 (bateria de 45) |
  | renda 1,15, produção 1,05, `firstWave` 300 | 0 / 34 / 2 |
  | renda 1,1, produção 1,0 | 2 / 34 / 0 |
  | renda 1,1, produção 1,0, `maxHarvesters` 5, `waveGap` 170 | 2 / 32 / 2 |
  | renda 1,1, produção 1,0, `maxHarvesters` 5, `firstWave` 300, `waveGap` 165, `keepHome` 0,3 | 5 / 28 / 3 |
  | renda 1,0, produção 1,0 (só comportamento) | 6 / 28 / 2 |
  | renda 1,0, produção 1,0, `maxHarvesters` 5 | 6 / 24 / 6 |

  O que pesa é a combinação de onda mais cedo (270 s), intervalo curto (150 s), `waveMax` 22 e `keepHome` 0,25. Isso nega ao defensor o tempo de crescer.
- **Sugestão:** um Difícil "vencível por quem joga bem", com alvo de 15 a 25% de vitórias para a referência:
  - `income: 1.1, buildSpeed: 1.0, firstWave: 300, waveGap: 170, waveStart: 7, waveGrow: 2, waveMax: 20, maxHarvesters: 6, keepHome: 0.3`;
  - o Difícil atual pode virar um 4º nível, "Brutal".
  - Como a última linha da tabela ainda dá 5 a 6 de 36, o intervalo maior (170) pesa mais que a renda.

#### P3. O Âmbar virou a facção fraca: 37,5% das partidas, contra ~51% das outras duas

`b2`: IA contra IA no Normal, 216 partidas, cada par de facções dos dois lados, 3 mapas × 8 sementes (31 a 38).

| Confronto | Vitórias | Empates |
|---|---|---|
| Cobalto x Brasa | 22 x 22 | 4 |
| Cobalto x **Âmbar** | **27 x 18** | 3 |
| Brasa x **Âmbar** | **28 x 18** | 2 |
| Total (96 partidas por facção, fora os espelhos) | Cobalto 49, Brasa 50, **Âmbar 36** | |

- **Duelos de mesmo custo** (`node duelo.js 4200`): o Âmbar perde **todos** os confrontos de massa de um tipo só.
  - 6 blindados Cobalto x 6 Âmbar: sobram 1.700 x 0;
  - 42 soldados Brasa x 45 soldados Âmbar: sobram 956 x 0.
  - Com 7% de desconto, ele compra só 0 a 2 unidades a mais, o que não compensa +18% de vida ou de cadência.
- Na rodada 2 o desconto de 8% em tudo dava 62%. O ajuste passou do ponto.
- **Sugestão:**
  - Âmbar com `costMul: 0.90` só nas unidades, mais 5% de velocidade de produção. Ou desconto de 10% também na Refinaria, sem o coletor.
  - Refazer a bateria `b2` e mirar entre 45% e 55% para cada facção.
- **No Difícil** (`b3`, 36 partidas) as três ficaram parelhas: 10, 12 e 11 vitórias. A amostra é pequena.

#### P4. As descrições das unidades continuam erradas: o soldado vence o blindado e o batedor, e o batedor não caça coletores

Duelos de mesmo custo em campo aberto, os dois lados atacando-movendo (`node duelo.js 4200`; em 1.400 o padrão se repete, menos para soldado x blindado):

| 4.200 créditos de cada lado | Valor que sobra no fim | O texto do jogo diz |
|---|---|---|
| 42 Soldados x 6 Blindados | **Soldados 402**, Blindados 0 (78 s) | Soldado: "fraca contra blindados" |
| 42 Soldados x 14 Batedores | **Soldados 964**, Batedores 0 | Batedor: "caça soldados" |
| 14 Batedores x 6 Blindados | Blindados 2.910, Batedores 0 | |
| 23 Foguetes x 14 Batedores | Batedores 2.525, Foguetes 0 | ok |
| 23 Foguetes x 6 Blindados | Foguetes 2.700, Blindados 0 | ok |

- **Batedor contra coletor** (`node caca_coletor.js`): 4 batedores do jogador atacam coletores da IA no Normal aos 10 min, nos 3 mapas com 2 sementes cada.
  - Em 90 s matam **0 ou 1 coletor** e morrem **todos** (6 de 6 tentativas).
  - Conta: o coletor tem blindagem pesada (650 de vida) e a bala faz 0,2 contra pesado. 4 batedores × 14 × 0,2 / 0,45 = **25 de dano por segundo**, ou seja **26 s por coletor** (31 s contra Cobalto).
  - A descrição "Caça soldados e coletores" é falsa, e as incursões de batedores da IA sofrem do mesmo mal: com 2 ou 3 batedores, 40 a 58 s por coletor.
- **Conta do batedor contra o soldado:** dano por segundo × vida, a cada 100 créditos:
  - soldado contra blindagem leve: 11,4 × 70 = **800**;
  - batedor contra infantaria: 14,5 × 46,7 = **678**.
- **Sugestão:**
  - `DAMAGE_MOD.bullet.heavy` de 0,2 para **0,15**: o blindado passa a vencer o soldado por custo em qualquer tamanho.
  - Batedor com **custo 250 e vida 160**. Pela mesma conta, ~1.000 contra os 800 do soldado.
  - Coletor com blindagem `light` e 750 de vida, ou um modificador próprio de bala contra coletor de 0,6. Com isso, 4 batedores levam ~9 s por coletor, e incursão vira uma ameaça real.

### ATRAPALHA (moderado)

#### P5. Economia diferente entre os mapas, e inanição no meio da partida nos mapas 1 e 2 (a IA nunca se expande)

`node cristal.js` (IA contra IA) e `node alcance.js` (cristal por distância a pé da Central):

| Mapa | Cristal a ≤20 tiles a pé | 21 a 35 | 36 a 50 | Acaba perto da base aos |
|---|---|---|---|---|
| Planalto Gêmeo (0) | **53.921** | 16.881 | 44.576 | nunca em 13 min |
| Vale Partido (1) | 14.148 | 14.401 | 27.900 | **8 min** |
| Três Campos (2) | 18.470 | **3.812** | 52.463 | **9 a 10 min** |

- Todo o cristal é alcançável e os dois lados são idênticos. O mapa é justo **entre os lados**.
- **Mapa 2:** depois dos 10 min, a colheita de um dos lados cai de 3.000 por minuto para **0 a 500 por minuto**, com 150 mil de cristal ainda no mapa. Os coletores morrem no meio, e a IA não constrói refinaria perto de outro campo (`findBuildSpot` só procura num raio de 13 tiles da Central).
- **Partidas que viram inanição** (`b1`):
  - `economia` x Normal, mapa 2, semente 13: aos 23 a 25 min a colheita está parada em 30.000 x 29.000, com **0 crédito** e 1 a 3 unidades de cada lado. Empate;
  - `soObuseiros`, mapa 2: a IA termina com 1 coletor e 0 de exército.
- **1ª onda do Normal:** 10 a 13 unidades no mapa 0 contra 7 a 10 nos mapas 1 e 2. A dificuldade muda conforme o mapa.
- **Conta:** coletor com capacidade de 500, a 50 px/s.
  - campo a 10 tiles: ~28 s por viagem, ~1.070 por minuto;
  - campo a 45 tiles: ~74 s por viagem, **~405 por minuto** (−62%).
- **Sugestão:**
  - Garantir **35 a 45 mil** de cristal a até 20 tiles de cada base em todos os mapas.
  - Na IA: quando o campo mais perto da refinaria estiver a mais de 18 tiles, construir refinaria encadeada naquela direção. Basta aumentar o raio de `findBuildSpot` para a refinaria e pontuar pela distância ao cristal.

#### P6. Partidas longas e empatadas em IA contra IA

- `b2` (Normal, 216 partidas):
  - duração **mediana de 26,7 min**, percentil 90 de **39,7 min**, a mais curta 12,5 min;
  - **17 empates** no limite de 45 min (8%).
- `b4` (espelho, 96 partidas): 4 empates.
- **Causas prováveis:** ondas de no máximo 18 unidades, o limite de 60 unidades, inanição dos mapas (P5) e torres. Contra o jogador isso pesa menos, mas o mesmo motor faz as partidas contra o Normal irem a 14 a 18 min (`ecoForte` vence em média aos 13,9 min; `blindadosForte` aos 14,7 min).
- **Sugestão:** depois de 25 min, `waveMax` +6 e `waveShare` 0,75. A IA também deve escolher como alvo a refinaria ou a fábrica, não "o prédio mais perto", que costuma ser uma torre.

### DETALHE

- **P7. Torres ainda rendem muito contra tropas diretas, mas o obuseiro resolve.** Unidades de mesmo valor contra torres energizadas (`torre.js`):
  - 5 soldados x 1 torre: a torre fica com 638;
  - 9 foguetes x 3 torres: sobram 2 torres;
  - 2 blindados x 3 torres: as 3 torres ficam de pé;
  - **2 obuseiros (1.600) x 3 torres (1.725): destroem as 3 sem perda.**

  Hoje o contra existe. Só a IA Fácil não o usa (ver P1).
- **P8. A IA travada com só a Central não cancela a obra para recuperar o dinheiro.**
  - `recupera3.js`, cenário "tudo menos a Central": por 6 min fica em `constr factory (esperando $)`, com crédito 1.
  - Cancelar a obra devolveria o já gasto e talvez desse para uma Usina.
  - O cenário é raro. Sugestão: sem refinaria, cancelar qualquer obra que não seja usina ou refinaria.
- **P9. Incursões de batedores existem, mas são raras e inofensivas.** `raid.js`, 12 partidas IA contra IA de 17 a 25 min:
  - entre 0 e 9 batedores em incursão por partida, com 2 partidas sem nenhuma;
  - contra o jogador (`onda.js`), 0 a 2 em 10 min;
  - e não matam (P4).
- **P10. O lado do mapa é justo.** `b4`, espelho de facção, 96 partidas:
  - sem troca de cantos: time 0 venceu 24, time 1 venceu 22;
  - com troca de cantos: 22 x 24;
  - total 46 x 46.

  O 87 x 112 da bateria `b2` é ruído. Nada a corrigir.
- **P11. O Fácil é fácil demais para quem ataca.** A referência vence 45 de 45, e 8 estratégias vencem 9 de 9. Isso é aceitável para iniciantes, mas, somado a P1, o Fácil nunca pressiona: só mata quem não constrói nada.

---

## O que melhorou desde a rodada 2 (medido)

| Problema da rodada 2 | Rodada 3 |
|---|---|
| Guarda indo junto com a onda: 10 de 14 na base do jogador | 2 a 3. Corrigido |
| Onda chegando em pedaços: até 65 tiles | 3 a 11 tiles. Corrigido |
| Soldados morrendo sem revidar | Revidam. Corrigido |
| Obuseiro do jogador inútil com névoa | Destrói torres sem perdas. Corrigido |
| IA sem refinaria travada | Vende e reconstrói em menos de 2 min. Corrigido |
| Difícil: 0 vitórias em 240 partidas de bot | 3 de 9 com `ecoForte`, ainda 0 nas outras 16 estratégias. Melhorou, mas falta |
| Âmbar com 62% | **37,5%**: passou do ponto |
| Soldado vence blindado | Ainda vence em 4.200 (sobram 402 contra 2.678 antes). Melhorou, mas falta |

## Arquivos

- Scripts: `/home/claude/criticos/rodada-3/ia/` (`bot.js`, `run.js`, `gen.py`, `tab.py`, `referencia.js`, `referencia2.js`, `duelo.js`, `torre.js`, `arty.js`, `alvo.js`, `defesa.js`, `onda.js`, `recupera3.js`, `cristal.js`, `alcance.js`, `caca_coletor.js`, `raid.js`, `foto.js`)
- Saídas brutas: `b1.out.json` a `b4.out.json`, `ref.out`, `ref2.out` e `ref3.out`, na mesma pasta
- Capturas: `facil-60-unidades-paradas.png` e `normal-1a-onda-6min.png`
