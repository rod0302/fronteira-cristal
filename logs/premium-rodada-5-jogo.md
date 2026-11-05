# Premium, rodada 5: crítica de jogo (legibilidade, interação, modos, interface)

Revisor independente. Testes em Chromium sem GPU (SwiftShader). Não avaliei fps do Premium. Emulei o tier "gpu" sobrescrevendo `getParameter(UNMASKED_RENDERER)`. Os scripts e as capturas estão em `/tmp/q/` (cópia das capturas principais em `/tmp/q/cap/`).

## O que testei
- **Testes:** `node tests/fumaca.js` passou em tudo (sim idêntica, F9, Leve em tela grande, console sem erros). `node tests/partida.js` passou (a IA destrói o jogador parado aos 7 min).
- **Cenas no Premium:**
  - `s1.js`: as 6 unidades de Âmbar (jogador) e Brasa, no zoom 1 e no zoom 1,8, no tier gpu.
  - `s2.js`: grupo com vidas variadas, clique no centro visual de cada unidade, caixa e seleção.
  - `s3/s5.js`: marcadores de mover e de colher.
  - `s6.js`: holograma da Fábrica em lugar válido e inválido.
  - `s8.js`: soldado colado atrás de um blindado.
- **Clássico e Leve:** as mesmas cenas no Clássico. Leve em 1600x1000 com deviceScaleFactor 2 e ciclo F9 Leve → Premium → Clássico → Leve → Premium (`s7.js`).

## Notas
| Área | Nota |
|---|---|
| (a) legibilidade em jogo | **5,5** |
| (b) interação/clique | **6,5** |
| (c) troca de modos e robustez | **8,5** |
| (d) tela de título e interface | **7** |

- **(a)** A seleção lava as unidades de verde e o Âmbar continua cinza-ferrugem. O holograma segue uma laje.
- **(b)** O clique no centro visual acertou 9 de 9 unidades separadas, e a caixa funciona. Mas a regra "vale a da frente" rouba o clique da infantaria colada atrás de veículos.
- **(c)** Os testes passam, o F9 cicla os 3 modos sem erro e o Leve em retina fica nítido (canvas 1280 + interface 3200). Só aparecem avisos `GPU stall due to ReadPixels` do bake (inofensivos, vêm de `terrain3d.js:830`).
- **(d)** O título está bom e com contraste melhor. O objetivo do tutorial fala em "planalto cinza", que no Premium é bege.

## Problemas, por prioridade

### P1: unidade selecionada vira um fantasma verde, e some a cor do time
- **Como reproduzir:** `s2.js` (`s2-selp.png`, recorte `c3.png`). Selecione 9 unidades azuis no zoom 1.
- **O que acontece:**
  - Cada unidade fica coberta por um véu verde-claro. Não dá para dizer que é azul, nem distinguir o blindado do batedor ou do foguete.
  - No Clássico (`s2-selc.png`) as unidades continuam azuis e nítidas com o anel.
  - Ao selecionar, o anel do time também é removido (`premium.js` ~664-676). A unidade selecionada perde o único sinal de dono.
- **Causa provável:** o decal `add` do anel tem intensidade 1,6 e raio de `(r·1,15+7)·2`. Ele estoura no bloom e/ou a projeção do decal pega o casco.
- **Correção:**
  - Intensidade de ~0,8 a 0,9, fora do bloom (ou limitado antes do bloom).
  - Volume do decal só no chão (comparar com a profundidade do terreno e não da cena).
  - Anel de seleção fino (2 a 3 px de tela) e manter o anel do time por dentro.

### P2: o Âmbar continua sem cor de Âmbar, e o anel dele some na areia laranja
- **Como reproduzir:** `s1.js` com o jogador Âmbar contra a Brasa (`s1-z1.png`, `s1-z18.png`, recorte `c1.png`).
- **O que acontece:**
  - Os veículos âmbar são grafite com acento marrom-ferrugem e a infantaria é "cogumelo marrom". Ninguém lê isso como dourado ou laranja.
  - No zoom 1, âmbar (marrom-acinzentado) e Brasa (vinho) só se separam com esforço.
  - O anel âmbar de 0,32 é invisível na areia laranja, que domina o mapa. O anel vermelho se lê.
- **Correção:**
  - Acento âmbar mais claro e saturado (alvo de luminância ≈ do azul) e mais área pintada (teto da torre ou deck).
  - Anel do time com núcleo escuro e borda na cor do time (o mesmo truque do marcador), ou intensidade por time compensando o fundo.

### P3: holograma ainda é uma laje, e o vermelho tampa o prédio que bloqueia
- **Como reproduzir:** `s6.js` no tier gpu (`c7.png`; à esquerda o lugar válido, à direita a Fábrica por cima do QG).
- **O que acontece:**
  - Em lugar válido aparece uma caixa verde lisa, sem a silhueta da Fábrica. O Clássico mostra o prédio fantasma.
  - Em lugar inválido os quadrados vermelhos ficam quase opacos POR CIMA do QG (a cúpula some). Os quadrados livres viram verde-amarelado.
  - O jogador não vê o que está bloqueando.
- **Correção:**
  - Desenhar os quadrados no chão com teste de profundidade, antes dos prédios.
  - Holograma com fresnel e linhas de borda (scanline), α≈0,45.
  - Só contorno nos quadrados válidos.

### P4: "vale o da frente" rouba o clique da infantaria colada atrás de veículos
- **Como reproduzir:** `s8.js`. O soldado fica 14 px ao norte do blindado e o clique é no centro visual do corpo do soldado.
- **O que acontece:** com 26, 22 e 18 px de distância o soldado é selecionado; com 14 e 10 px, o blindado.
- **Causa:** em `input.js:245` vale a unidade de maior `y` entre todas cujo círculo `r·1,15+4` contém o cursor. O círculo do blindado tem ~18 px e engole o corpo do soldado, que aparece atrás do casco.
- **Correção:**
  - Escolher primeiro pela distância normalizada `d/raio` (quem tem o cursor no "miolo").
  - Usar "o da frente" só para desempatar quando os dois estão no miolo.
  - Ou testar a silhueta projetada (OBB em tela).
- **Raio da infantaria:** a infantaria ficou 80% maior, mas o raio de clique dela usa o mesmo 1,15 dos veículos. Use a escala visual por tipo.

### P5: o planalto de construção não é "cinza" e o tutorial manda procurar "planalto cinza"
- **Como reproduzir:** `s6-okp.png`, objetivo "Clique no botão PRONTO e depois num lugar verde do planalto cinza".
- **O que acontece:**
  - No Premium o planalto é bege-claro e tem pouco contraste com a areia clara vizinha.
  - Com a grade de construção ativa, toda a área da base ganha um véu verde-claro que lava os prédios.
- **Correção:**
  - Um tom de planalto mais frio e cinza (ou texto do objetivo por modo).
  - Grade de construção com α menor e sem véu de preenchimento, só as linhas.

### P6: marcadores de ordem
- **Como reproduzir:** `s4.js`, `s5.js` (`c6.png`).
- **O que está bom:** com o traço grosso e o contorno escuro o marcador se lê na areia.
- **O que falta:**
  - O marcador ciano de colher sobre o campo de cristal ainda se perde.
  - As setas convergentes não aparecem em nenhum modo (triângulos de 3 px e α baixo).
  - A vida é contada em `dt` limitado a 0,25 s (`render.js:414`). Com quadros lentos o marcador some em 2 ou 3 quadros (medido: 0,25 → 0,5 → removido).
- **Correção:**
  - Marcador de colher em branco ou amarelo com contorno escuro, ou um ícone.
  - Setas de 5 a 6 px.
  - Vida medida por `performance.now()`.

### P7: a caixa de seleção ignora o corpo erguido e a escala visual (pelo código)
- **Onde:** `input.js:295` usa `u.x ± radius`, `u.y ± radius` no chão.
- **O que acontece:** no Premium o corpo aparece `K·midZ` px acima e 15 a 80% maior. Uma caixa que cobre só a parte de cima do modelo de uma unidade na borda inferior do grupo não a pega.
- **Correção:** a mesma regra do clique: testar também `y − PREMIUM_K·entityMidZ(u)` e `radius·escala`.

### P8: sinais fracos de robustez e polimento
- **Console:** o bake do terreno emite 4 avisos `GPU stall due to ReadPixels` a cada carga do Premium.
  - Os testes filtram, mas no console do jogador parecem erro.
  - Correção: ler a máscara com PBO e fence, ou fazer a máscara de enfeites na CPU.
- **Leve e Clássico:** no Leve, a 1600x1000 com dpr 2, o Clássico entra em resolução reduzida (canvas 1280) por causa da queda automática (`gfx.auto`).
  - Faz sentido em software, mas o botão "Gráficos: Clássico" não avisa que está reduzido.

## Veredito
Robusto e sem regressões nos modos 2D, mas no Premium a seleção verde que apaga as unidades, o Âmbar sem cor e o holograma-laje ainda impedem uma leitura de jogo AAA.
