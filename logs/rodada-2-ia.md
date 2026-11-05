# Rodada 2 — Crítica de IA e equilíbrio (Fronteira Cristal)

Crítico: lente **IA e equilíbrio**. Cópia congelada usada: `/home/claude/criticos/rodada-2/jogo/`.
Scripts (Playwright + `window.__jogo`, nenhum arquivo do jogo editado): `/home/claude/criticos/rodada-2/ia/`.
Capturas: `/mnt/project-files/rts/logs/capturas/rodada-2-ia/`.

## Nota: **6 / 10**

O que funciona: a IA joga de verdade. Ela colhe, segue um plano de construção, reconstrói o que perde, ataca em ondas que crescem, recua quando a onda é dizimada e escolhe contra-unidades (mais foguetes e blindados quando o inimigo tem blindados). Os mapas têm simetria de ponto exata e o lado não importa (175 vitórias divididas 85 x 90). Em IA contra IA, o exército misto vence os exércitos de um tipo só.

Por que não passa de 6:
- **Difícil** ficou um muro: nenhuma vitória em 285 partidas (240 com bots de jogador, 45 com o jogador de referência).
- Uma facção é dominante: Âmbar vence 62% das partidas.
- Ordens de ataque deixam as unidades travadas no prédio enquanto morrem.
- Os números não batem com as descrições: o soldado vence o blindado, e o batedor perde para os soldados que deveria caçar.
- O obuseiro do jogador é inútil por causa da névoa, enquanto o da IA funciona.
- A IA trava para sempre se perder as refinarias.

Um jogador exigente nota quase tudo isso nas primeiras partidas.

---

## Metodologia (resumo)

| Bateria | Script | Partidas |
|---|---|---|
| 10 estratégias de jogador × 3 dificuldades × 3 mapas × 3 sementes (20 min) | `run.js m1.json` + `bot.js` | 270 |
| 4 estratégias "fortes" (com micro e reagrupamento) × 3 dif. × 3 mapas × 3 sementes | `run.js m3.json` | 108 (×3 versões do bot) |
| Bots econômicos (`ecoForte`, `ecoDuro`, `duroDefesa`, `duroTanqueTorre`, `torreRasteira`) | `run.js m4/m6/m7/m8.json` | 99 |
| IA contra IA, normal, 9 combinações de facção × 3 mapas × 4 sementes (40 min) | `run.js m2.json` | 108 |
| IA contra IA, normal, 6 combinações (sem espelho) × 3 mapas × 10 sementes | `run.js m5.json` | 180 |
| "Jogador de referência": a própria IA Normal **sem bônus** contra a IA de cada dificuldade | `referencia.js` | 135 (+144 testando números) |
| IA com só uma composição (monkeypatch na página) contra a IA padrão | `variante.js` | 96 |
| Duelos de mesmo custo em campo aberto (orçamentos de 1400, 2100, 4200 e 5600) | `duelo.js`, `duelo_nevoa.js` | 40 |
| Torres contra unidades, obuseiro com e sem névoa, travamento de alvo, recuperação, ondas, incursões, cristal, avanço com torres | `torre.js`, `arty.js`, `alvo.js`, `recupera*.js`, `onda.js`, `raid.js`, `cristal.js`, `creep.js`, `defesa.js` | — |

Para rodar: `cd /home/claude/criticos/rodada-2/ia && node run.js m1.json 4 > saida.json && python3 tab.py saida.json`

---

## Números de referência da IA

Jogador parado. Tempos médios em 9 partidas por dificuldade (3 mapas × 3 sementes):

| Dificuldade | 1ª onda sai | Chega à base | Tamanho das ondas (sem contar os guardas, ver P5) | Jogador parado morre aos |
|---|---|---|---|---|
| Fácil | 473 s (7,9 min) | 494 s | 4, 5, 6… (máx. 9) | 577 s (9,6 min) |
| Normal | 322 s (5,4 min) | 338 s | 7, 9, 11, 13 | 385 s (6,4 min) |
| Difícil | 232 s (3,9 min) | 248 s | 8, 11, 14 | 296 s (4,9 min) |

**A IA reconstrói?** Sim. Em IA contra IA, normal, aos 7 min, tirei do time 1 todas as fábricas e quartéis: ele reergueu tudo em menos de 1 min e o exército voltou de 1 para 13 unidades em 4 min. O mesmo vale para as usinas (tudo de volta em ~3 min) e para o exército inteiro (de 3 para 10 unidades em 6 min). Script: `recupera2.js`.
**Exceção grave:** a perda das refinarias (ver P6).

---

## Problemas, em ordem de gravidade

### ATRAPALHA (grave)

#### P1. "Difícil" é um muro: 0 vitórias em 285 partidas; o salto de Normal para Difícil é abrupto

- **Jogador de referência** (`node referencia.js`): a IA Normal, sem bônus de renda e velocidade, jogando contra a IA. São 45 partidas por dificuldade (3 mapas × 5 sementes × 3 pares de facção):
  - contra Fácil: **vence 39**, perde 4, empata 2;
  - contra Normal: **vence 21**, perde 18, empata 6. Equilibrado, como deve ser;
  - contra Difícil: **vence 0, perde 45**. Morre em média aos **9,3 min**.
- **Bots de jogador** contra Difícil: 240 partidas com 19 estratégias (as 10 da 1ª bateria, as 4 "fortes" em 3 versões e os 5 bots econômicos), **240 derrotas**. A melhor, `ecoForte`, vence o Normal em **9/9** (aos ~11,5 min) e perde para o Difícil em **9/9**.
- Exemplo de economia (`ecoForte`, mapa 0, semente 1): aos 4 min o bot colheu 9.608 contra **14.000** da IA difícil e tem 14 unidades contra 17. Aos 5 min tem 1 contra 12.
- Causa: o bônus multiplica (renda ×1,4 e produção ×1,3, ou seja ~1,8× de produção) e vem junto de ondas mais cedo e maiores, 6 coletores e guardas que acompanham a onda (P5).
- Mesmo com o bônus cortado, Difícil continua muito acima do Normal (`node referencia2.js '<json>' dificil`, 36 partidas cada):

  | renda / velocidade no Difícil | Vitórias da referência |
  |---|---|
  | 1,4 / 1,0 | 0/36 |
  | 1,25 / 1,15 | 0/36 |
  | 1,2 / 1,1 | 2/36 |
  | 1,15 / 1,0 | 3/36 |

**Sugestão:**
- Criar um degrau intermediário: o Difícil atual vira "Brutal" e entra um Difícil com `income: 1.15, buildSpeed: 1.0, firstWave: 270, waveGap: 150, waveStart: 7, waveGrow: 2, waveMax: 20, maxHarvesters: 5, keepHome: 0.3`.
- Corrigir antes o P5: hoje os guardas inflam as ondas sem que os números mostrem isso.

#### P2. Ordem de ataque trava a unidade no prédio: ela morre sem revidar (vale para o jogador e para a IA)

- `node alvo.js`: 12 soldados atacam a Central inimiga (com atacar-movendo ou com ataque direto). Chegam 2 blindados por trás e atiram neles.
  - Resultado nos dois modos: os **12 soldados morrem em 48 s, e os blindados terminam com vida cheia (472/472)**. Nenhum soldado troca de alvo.
- Causa no código:
  - Em `thinkUnit`, o alvo automático só é trocado se morrer ou sair de vista. Um prédio nunca "foge".
  - Em `damageEntity`, o revide só acontece se a unidade estiver **sem alvo e parada**.
- Efeito no equilíbrio:
  - Atacar uma base com atacar-movendo é suicídio.
  - O defensor sempre leva vantagem. Por isso as partidas IA contra IA duram até 40 min, com empates (a mediana é 14,7 min, o percentil 90 é 32,7 min).
  - Um jogador humano explora a IA: deixa a onda começar a bater nos prédios e ataca as unidades, que não reagem.
- Com uma "micro humana" no meu bot (trocar o alvo de prédio pela unidade armada mais próxima, `micro: true` em `bot.js`), o `blindadosForte` foi de 4/9 para 5/9 contra o Normal. Ganho pequeno porque o bot só corrige a cada 1 s.

**Sugestão:**
- Quem tem um prédio como alvo **não forçado** passa a mirar a unidade armada inimiga mais próxima dentro de `acquire`, verificando a cada 10 passos (o mesmo escalonamento que já existe).
- O revide deve valer também para quem está atirando num prédio.

#### P3. Âmbar é a facção dominante (62% das vitórias em IA contra IA)

`run.js m5.json`: 180 partidas, normal, 3 mapas × 10 sementes, cada par de facções jogando dos dois lados.

| Confronto | Vitórias |
|---|---|
| Âmbar x Cobalto | **38 x 20** |
| Âmbar x Brasa | **37 x 21** |
| Cobalto x Brasa | 31 x 28 |
| Total | Âmbar **75/120**, Cobalto 51/120, Brasa 49/120 |

- A primeira bateria (`m2.json`, 108 partidas) confirma: Âmbar 28/48, Cobalto 21/48, Brasa 19/48.
- Curiosamente, em duelo de exércitos do mesmo custo o Âmbar **perde** (`duelo.js`). Com 4.200 de blindados, Cobalto termina com 1.700 de valor contra 0, e Brasa com 1.321 contra 0. Ou seja, a vantagem do Âmbar é toda econômica: os 8% valem também para refinaria, coletor, usina e reparo, e isso se acumula na partida inteira.

**Sugestão:** Âmbar com `costMul: 0.95` só nas unidades (prédios e coletor a preço cheio). Alternativa: manter 0,92 e reforçar os outros dois (Cobalto `hpMul 1.22`, Brasa `rofMul 0.82`). Depois, refazer as 180 partidas e mirar entre 45% e 55% para cada facção.

#### P4. Os números não batem com as descrições: o soldado vence o blindado, o batedor é inútil

Duelos de mesmo custo em campo aberto, os dois lados com atacar-movendo (`node duelo.js 4200`; os resultados se repetem em 1400, 2100 e 5600):

| Confronto (4.200 créditos de cada lado) | Valor que sobra no fim |
|---|---|
| 42 Soldados x 6 Blindados | **Soldados ficam com 2.678 (64%)**, Blindados 0 |
| 42 Soldados x 14 Batedores | Soldados 1.633, Batedores 0 |
| 23 Foguetes x 14 Batedores | Batedores 1.867, Foguetes 0 |
| 14 Batedores x 6 Blindados | Blindados 2.678, Batedores 0 |
| 6 Blindados x 5 Obuseiros | Blindados 1.356, Obuseiros 0 |

- O texto da unidade diz "Soldado: fraca contra blindados". Na prática, o soldado vence o blindado com folga, por custo, em todo orçamento. Conta por segundo:
  - 42 soldados × 8 × 0,3 / 0,7 = 144 de dano por segundo contra blindados;
  - 6 blindados × 45 × 0,45 / 1,5 = 81 de dano por segundo contra infantaria.
- O texto diz "Batedor: caça soldados". Na prática, perde para soldados por custo (também em 1.400: 14 soldados contra 4 batedores, sobram 763 de soldados) e só vence o foguete. Em IA contra IA com só batedores (`variante.js`), venceu **1 de 12**.
- Ressalva honesta: nas partidas contra a IA, exércitos só de soldados perdem (`variante.js`: só soldados venceu 1/12). Obuseiros, torres e o fato de o quartel não fazer coletores seguram a infantaria. A composição mais forte foi **blindado + soldado (10/12)**. O problema é sobretudo de coerência: o jogador que segue as dicas do jogo escolhe errado.

**Sugestão:**
- `DAMAGE_MOD.bullet.heavy` de 0,3 para **0,15** e `shell.inf` de 0,45 para **0,6**. O blindado passa a vencer o soldado por custo, e o foguete continua sendo o anti-blindado.
- Batedor com `damage` de 11 para **14** ou custo de 300 para **250**. A meta é vencer o soldado por custo, para fazer jus a "caça soldados".

#### P5. A "guarda" da IA vai junto com a onda até a base do jogador; a base dela fica vazia e as ondas são maiores que o configurado

- O alerta de defesa (`aiUnderAttack`) dispara quando **qualquer** unidade da IA leva dano, inclusive as da onda dentro da base do jogador. Então os guardas (`keepHome`) atacam-movendo até lá.
- Medido com `node defesa.js`: máximo de guardas da IA (unidades fora da onda) a menos de 20 tiles da Central do jogador:

  | Partida | Guardas na base do jogador |
  |---|---|
  | torres, normal | **10 de 14** e 7 de 11 |
  | torres, difícil | 8 de 12 e 5 de 8 |
  | blindadosForte, normal | **11 de 19** e 12 de 15 |

- Captura de exemplo, difícil, 4:50 (`dificil-1a-onda.png`): as **9** unidades da IA na base do jogador são todas guardas, nenhuma está marcada como onda.
- Consequências:
  - A primeira onda "de 7" chega na prática com 15 a 20 unidades.
  - A base da IA fica sem defesa justo quando ela ataca, o que é fácil de explorar com um contra-ataque.
  - A onda seguinte pega "os mais longe da base", que são os guardas já parados na base do jogador. Por isso ela chega em pedaços: entre a primeira e a última unidade, **41 a 65 tiles** de distância (`node onda.js`, 2ª onda no normal e no difícil).

**Sugestão:**
- Só tratar como alerta o dano sofrido a menos de ~18 tiles da própria Central ou de um coletor.
- Na defesa, nunca perseguir além de 20 tiles de casa.
- A onda deve se reagrupar num ponto a ~60% do caminho antes do ataque final.

#### P6. A IA trava para sempre se perder refinarias e coletores, mesmo tendo o que vender

- `node recupera3.js`: fácil, jogador fechado em torres, aos 7 min. Destruí as 3 refinarias e os coletores da IA.
  - Por **6 minutos seguidos**: `constr refinery (esperando $)`, créditos **1**, 2 fábricas de pé (500 cada na venda), colheita 0. Ela nunca vende nada.
- Causa: em `aiEconomy` existe a lógica de vender para pagar uma refinaria, mas ela é pulada quando `t.construct.type === 'refinery'`. A refinaria começa a ser construída sem dinheiro e fica esperando para sempre.
- Também em IA contra IA, normal (`recupera2.js`): depois da perda econômica, a IA terminou a **torre** que estava construindo antes de começar a refinaria (tinha 1.205 créditos e gastou em torre). Ela só começou a refinaria sem dinheiro.

**Sugestão:**
- Se faltar refinaria e a obra atual não for a refinaria, cancelar a obra (o dinheiro volta).
- Se a refinaria estiver "esperando $" por mais de 10 s, vender o prédio dispensável mais barato, como já está previsto.

#### P7. O obuseiro do jogador é inútil por causa da névoa; o da IA não sofre isso

- `node arty.js`: 2 obuseiros atacam-movendo contra 1 torre energizada:
  - jogador com névoa: **0/2 obuseiros vivos, a torre fica com 360 de vida**;
  - IA, ou jogador sem névoa: torre destruída, **2/2 obuseiros vivos**.
- Causa: o obuseiro tem alcance de 8 tiles e visão de 5, e a torre tem alcance de 6. O jogador só pode mirar no que vê, então o obuseiro precisa entrar no alcance da torre. A IA não tem névoa.
- O radar não revela o mapa, só mostra inimigos no minimapa, então não resolve.

**Sugestão:**
- Obuseiro com `sight: 8`. Ou permitir que o jogador mire em prédios já vistos e "lembrados" (`b.seen`).
- Em IA contra IA o obuseiro já é fraco sozinho (só obuseiros: 0/12 vitórias), então não há risco de ficar forte demais.

### ATRAPALHA (moderado)

#### P8. Torres têm custo-benefício absurdo na defesa; a IA Fácil nunca rompe uma defesa de torres

- `node torre.js`: unidades de mesmo valor (torre 500 + ¼ de usina = 575) atacam torres energizadas:

  | Ataque | Resultado |
  |---|---|
  | 5 soldados x 1 torre | soldados morrem, torre fica com 684/900 |
  | 3 foguetes x 1 torre | foguetes morrem, torre com 631 |
  | 17 soldados x 3 torres | soldados morrem, torres com 432 / 900 / 900 |
  | 9 foguetes x 3 torres | foguetes morrem, torres com 228 / 900 / 900 |
  | 2 obuseiros x 3 torres | obuseiros morrem, torres com 360 / 900 / 900 (as torres se cobrem) |

  **Nenhum tipo de unidade derruba sequer uma torre gastando o mesmo valor.**
- Estratégia `torres` contra o Fácil: **9 empates em 9**. Depois de 20 min a IA ainda manda ondas de 4 a 9 unidades que morrem nas torres. Ela não faz obuseiros no Fácil (`artillery: false`) e nunca muda de plano.
- Avanço com torres (`torreRasteira`, `creep.js`):
  - nos mapas 0 e 2, dá para encadear torres pelo planalto até **encostar na Central inimiga** (distância mínima 0);
  - contra o Fácil, venceu 2/6 e empatou 4/6. Captura: `torre-rasteira-facil.png`.
  - contra o Normal, perdeu 6/6. Não é dominante, mas é uma tática degenerada que a IA não sabe responder.

**Sugestão:**
- Torre com `hp` 900 → **650** e custo 500 → **600**.
- A IA do Fácil deve fazer 1 ou 2 obuseiros depois de duas ondas fracassadas.
- `BUILD_RANGE` só a partir de prédios que não sejam torre (torres não estendem a área de construção).

#### P9. Incursões de batedores praticamente não existem

- `node raid.js`, 12 partidas IA contra IA (normal e difícil, até 25 min): no total, **9 batedores** saíram em incursão nas duas IAs somadas, e 8 das 12 partidas não tiveram nenhuma.
- Contra o jogador (`onda.js`, 6 partidas): **0**.
- Causa: a incursão exige ≥2 batedores **ociosos em casa**, mas eles são sorteados só em 18% (5% se o inimigo tem muitos blindados) e quase sempre já entraram numa onda ou na defesa.

**Sugestão:** reservar batedores para a incursão (não entram na onda) e baixar para 1 o mínimo exigido.

#### P10. Ritmo econômico muito diferente entre os mapas

`node cristal.js` mede o cristal a menos de 20 tiles de cada base:

| Mapa | Cristal perto da base | Esgota | Cristal total no mapa |
|---|---|---|---|
| Planalto Gêmeo (0) | **56.632** | nunca em 13 min | 300k |
| Vale Partido (1) | **14.148** | aos **8 min** | 148k |
| Três Campos (2) | **18.470** | aos **9 min** | 209k |

- Depois que o cristal perto da base acaba, a colheita por coletor cai ~40% (as viagens ficam longas).
- A IA nunca constrói refinaria longe da base; o jogador pode, encadeando prédios.

**Sugestão:**
- Garantir uma reserva mínima perto de cada base, por exemplo campos de raio 4 em vez de 3 e 400 a 600 de cristal por tile.
- Na IA, depois de esgotar o campo local, construir uma refinaria encadeada na direção do campo mais próximo.

### DETALHE

- **P11.** A IA nunca muda de estratégia diante de uma defesa: alvo é sempre "o prédio inimigo mais perto da base dela" e o ataque é sempre atacar-movendo. Contra torres avançadas, a onda bate na primeira torre e morre.
- **P12.** Velocidades misturadas sem formação: o batedor (115) chega antes do blindado (60) e do soldado (36). Na 1ª onda, a distância entre a primeira e a última unidade é de 3 a 23 tiles (`onda.js`).
- **P13.** O lado do mapa é justo: 85 x 90 vitórias (canto superior esquerdo x inferior direito) em 180 partidas, e 50 x 54 na outra bateria. Os mapas são espelhados de verdade. Nada a corrigir.
- **P14.** Fácil é adequado para iniciante: a referência vence 87%, e o bot de blindados vence 9/9 aos ~8 min. Normal é justo: a referência vence 47%, e o `ecoForte` (bot com 8 coletores e micro) vence 9/9. O problema é só o degrau seguinte (P1).

---

## Taxa de vitória das estratégias do jogador (bots)

Resultado em vitórias / derrotas / empates; 9 partidas por casa (3 mapas × 3 sementes), limite de 20 a 30 min.

| Estratégia | Fácil | Normal | Difícil |
|---|---|---|---|
| parado | 0/9/0 | 0/9/0 | 0/9/0 |
| rush com o exército inicial | 0/9/0 | 0/9/0 | 0/9/0 |
| rush de soldados | 0/9/0 | 0/9/0 | 0/9/0 |
| massa de blindados (ataques em gotas) | 9/0/0 | 0/7/2 | 0/9/0 |
| blindadosForte (micro e reagrupamento) | 9/0/0 | 5/4/0 | 0/9/0 |
| só batedores | 1/7/1 | 0/9/0 | 0/9/0 |
| só obuseiros | 4/2/3 | 0/9/0 | 0/9/0 |
| só torres | 0/0/**9** | 0/6/3 | 0/9/0 |
| avanço com torres | 2/0/4 (6 partidas) | 0/6/0 | 0/6/0 |
| economia (8 coletores) | 9/0/0 | 5/3/1 | 0/9/0 |
| ecoForte (economia, micro e reagrupamento) | — | **9/0/0** | 0/9/0 |
| misto bem jogado | 9/0/0 | 1/7/1 | 0/9/0 |

Rush não funciona em nenhuma dificuldade, porque a IA começa com o mesmo exército e defende. Isso é saudável.

## Arquivos

- Scripts: `/home/claude/criticos/rodada-2/ia/` (`bot.js`, `run.js`, `tab.py`, `referencia.js`, `referencia2.js`, `variante.js`, `duelo.js`, `torre.js`, `arty.js`, `alvo.js`, `recupera2.js`, `recupera3.js`, `defesa.js`, `onda.js`, `raid.js`, `cristal.js`, `creep.js`, `foto.js`)
- Saídas brutas: `m1.out.json` … `m8.out.json`, `ref2.out`, na mesma pasta
- Capturas: `dificil-1a-onda.png`, `onda-normal-guardas-juntos.png`, `torre-rasteira-facil.png`, `soldados-*.png`, `sold3-*.png`
