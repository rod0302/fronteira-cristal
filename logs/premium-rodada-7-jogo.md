# Premium, rodada 7: crítica de jogo (legibilidade, interação, modos, interface)

Revisor independente. Os testes rodaram em Chromium sem GPU (SwiftShader, `--use-gl=angle --enable-unsafe-swiftshader`). Não medi fps.

Rodei as cenas no tier `software` (o real desta máquina) e repeti as de cor e de holograma no tier `gpu`. Para o tier `gpu`, emulei sobrescrevendo `getParameter(UNMASKED_RENDERER)`.

Scripts de cena em `/tmp/r7/` (`h.js` + `s1, s2, s2b, s2b18, s6, s7, s8.js`). Capturas e recortes em `logs/capturas/premium-r7/jogo-proprias/` (os recortes ampliados começam com `c-`).

## O que testei

**Testes automáticos**
- `node tests/fumaca.js`: tudo ok. Inclui sim idêntica Clássico/Premium, F9 esconde o WebGL, Leve em tela grande e "nenhum erro no console".
- `node tests/partida.js`: ok. A IA contra IA termina aos 22 min, e a IA destrói o jogador parado aos 7 min.

**Cenas no Premium**

| Script | O que verifica | Capturas |
|---|---|---|
| `s1` | 6 tipos de unidade em 3 pareamentos (Âmbar×Brasa, Cobalto×Âmbar, Cobalto×Brasa), no zoom 1 e no 1,8, nos tiers software e gpu | `s1-*`, `c-s1-*` |
| `s2`, `s2b`, `s2b18` | clique no centro visual de cada unidade, caixa, seleção total de Cobalto e de Âmbar, e caixa que pega só o corpo erguido (zoom 1 e 1,8) | |
| `s6` | holograma da Fábrica em lugar válido e sobre o QG, nos tiers software e gpu | `c-s6-holo.png` |
| `s8` | soldado e foguete colados ao blindado em 9 posições (atrás, na frente, ao lado), no zoom 1 e no 1,5. Em cada posição: clique no corpo da infantaria e depois no do blindado | |
| `s7` | título no Premium, botão JOGAR, ciclo F9 ×6 (Premium → Clássico → Leve → Premium → …) e pausa | |

**Console:** nenhum erro. Só os 4 avisos `GPU stall due to ReadPixels` em toda carga do Premium (`terrain3d.js:856`).

## Notas

| Área | R5 | **R7** | Variação |
|---|---|---|---|
| (a) legibilidade em jogo | 5,5 | **7** | +1,5 |
| (b) interação/clique | 6,5 | **8** | +1,5 |
| (c) troca de modos e robustez | 8,5 | **8,5** | = |
| (d) tela de título e interface | 7 | **7,5** | +0,5 |

### (a) Legibilidade: 7

**O que melhorou**
- **O fantasma verde acabou.** Ver `c-s2-sel.png` e `c-s2b-sel.png`. O anel de seleção ficou fino, o casco continua com a cor e a forma, e o anel do time segue por baixo.
- **O Âmbar agora é amarelo.** Ver `c-s1-2x1-z1*.png`. O anel amarelo-ouro aparece até no zoom 1 sobre a areia laranja. A infantaria âmbar tem acento cáqui/ocre.
- **Os três times se separam no zoom 1** pelo anel e pelo acento:
  - Brasa: vermelho-rosado bem claro;
  - Cobalto: casco cinza-azulado com anel lavanda;
  - Âmbar: anel amarelo.

**O que ainda pesa**
- **Âmbar selecionado.** O anel verde de seleção sobre o anel amarelo vira verde-limão. Selecionado e não selecionado só se distinguem pela barra de vida (`c-s2b-sel.png`, em cima).
- **Cascos sem a cor do time.** Os cascos de Cobalto e Âmbar continuam quase o mesmo grafite. Quem diz o dono é o anel, não o veículo.
- **Unidades sobre o campo de cristal.** O cristal ciano com bloom fica por cima e em volta das unidades:
  - a infantaria azul some no cristal (`s2b18-todas-z1-f0.png`, `c-s2-sel.png`);
  - o halo dos cristais "lava" o contorno dos veículos.
- **Holograma.** Ainda é uma laje verde brilhante, sem silhueta lida (P2).

### (b) Interação/clique: 8

**O que funciona**
- **Clique no centro visual:**
  - zoom 1,4: 9/9;
  - zoom 1: 6/6;
  - zoom 1,8: 6/6.
- **Infantaria colada ao blindado: 36/36 acertos.** Soldado e foguete, a ±10 a 26 px atrás e na frente e a 12 e 16 px ao lado, no zoom 1 e no 1,5:
  - o clique no corpo da infantaria seleciona a infantaria;
  - o clique no blindado seleciona o blindado.

  O P4 da rodada 5 (que falhava a 14 e 10 px) está **resolvido**.
- **Caixa:** pega as 8 unidades de combate. O coletor fica de fora quando há combatentes, como deve.

**O que falta**
- **A caixa ainda ignora o corpo erguido (P7 da rodada 5, não corrigido).** No zoom 1,8, uma caixa que cobre o corpo visível de soldado e foguete (13 px acima do chão) **não os pega**. Os veículos (7 a 9 px) passam.
- **Infantaria escondida.** Com o soldado colado atrás do blindado, o esquadrão fica quase todo escondido sob o casco (`c-s8.png`). O clique acerta, mas o jogador não vê o que clicou.

### (c) Modos e robustez: 8,5

- **F9:** cicla 6 vezes sem erro, nesta ordem: Clássico → Leve → Premium → Clássico → Leve → Premium.
  - O `glCanvas` é escondido e mostrado direito.
  - A partida segue em `playing`.
  - A pausa funciona no Premium.
- **Ao voltar ao Premium no software,** a simulação andou só ~0,8 s em 3,5 s de relógio (de 9,77 para 10,53 s de jogo). O bake trava a thread principal por alguns segundos a cada entrada no Premium. Em software isso é esperado, mas é perceptível, e não há aviso "preparando gráficos…".
- **Avisos no console:** os 4 `GPU stall due to ReadPixels` continuam (P8 da rodada 5).
- **Marcadores de ordem:** a vida ainda é contada em `dt` (`render.js:414`).

### (d) Título e interface: 7,5

- **Título** (`s7-titulo-premium.png`):
  - limpo, com boa hierarquia e cartões de facção coloridos;
  - o cartão Âmbar já usa amarelo coerente com o jogo;
  - "Gráficos: Premium" fica visível ao lado do JOGAR.
- **Planalto:** ficou mais distinto da areia laranja (bom para ler o construível), mas no Premium **ainda é bege**, não cinza:
  - amostra do planalto no Premium: RGB(208,193,169), bege quente;
  - no Clássico e no Leve: (123,121,114), cinza de verdade.

  O objetivo ("lugar verde do planalto cinza") e a ajuda da pausa ("planalto de pedra cinza") continuam descrevendo o Clássico.
- **Grade de construção:** agora é sutil e não lava os prédios (`s6-valid.png`). Melhorou.

## Problemas, por prioridade

### P1: o anel de seleção verde se confunde com o anel do time Âmbar
- **Reprodução:** `s2b.js` com F=2 (`c-s2b-sel.png`, em cima). O anel verde (seleção) sobre o amarelo (time) vira um disco verde-limão. Selecionado e não selecionado só se separam pela barra de vida.
- **Correção:**
  - seleção em **branco/ciano-claro** com contorno escuro, num matiz que nenhum time usa;
  - ou desenhar a seleção como **colchetes de canto** (4 arcos curtos) num raio maior que o anel do time, sem somar cor sobre ele.

### P2: o holograma de posicionamento ainda lê como laje, sem a forma do prédio
- **Reprodução:** `s6.js`, tiers software e gpu (`c-s6-holo.png`). A Fábrica válida aparece como um retângulo verde-menta liso. A visão é quase de cima, então o teto plano recebe o mesmo `lam` e o fresnel não acende. Só um toco de antena denuncia que há um modelo.
- **O que já melhorou no inválido:** o QG fica visível sob o véu vermelho.
- **Correção** (no `HOLO` de `shaders.js:79`):
  - linha de aresta por derivada (`fwidth` de `vL` ou da normal), com α≈0,9;
  - corpo com α≈0,2;
  - modular o `lam` pela altura local (`vL.z`) para separar teto, tanques e chaminés;
  - opcional: mostrar a pegada de saída da Fábrica (porta) em seta no chão.

### P3: a caixa de seleção não pega o corpo erguido (infantaria no zoom alto)
- **Reprodução:** `s2b18.js`. A caixa cobre o corpo visível do esquadrão, que fica 13 px acima do chão no zoom 1,8. **Não seleciona** soldado nem foguete.
- **Correção** (em `boxSelect`, `input.js`):
  - também aceitar se `(u.x, u.y − PREMIUM_K·entityMidZ(u))` cair na caixa;
  - usar o raio visual `u.radius·UNIT_VIS_SCALE·(1,6 para infantaria)` no Premium, como `unitAtScreen` já faz.

### P4: unidades sobre o campo de cristal perdem contraste
- **Reprodução:** `s2b18-todas-z1-f0.png`, `c-s2-sel.png`. A infantaria azul e o batedor somem entre cristais ciano com bloom. O halo do cristal cobre o casco.
- **Correção:**
  - escurecer e reduzir o bloom dos cristais num raio de ~1 tile em volta de unidades (máscara por instância);
  - ou desenhar as unidades depois do bloom dos cristais;
  - rim light da cor do time nas unidades (fresnel fraco), para recortar a silhueta de qualquer fundo.

### P5: casco sem a cor do time e infantaria escondida atrás de veículos
- **Casco:** Cobalto e Âmbar têm o mesmo casco grafite (`c-s1-0x2-z1*.png`). Sem o anel, só um olho treinado separa os dois.
  - **Correção:** pintar a cor do time numa área maior e visível de cima (teto da torre, faixa no deck), com luminância parecida entre os times.
- **Infantaria:** o esquadrão colado atrás do blindado fica coberto pelo casco (`c-s8.png`).
  - **Correção:** silhueta em raio-X (o `XRAY` já existe para prédios) para a infantaria encoberta por veículos.

### P6: o planalto do Premium é bege, e o texto manda achar o "planalto cinza"
- **Reprodução:** `s7-jogo-premium.png`.
  - Planalto (208,193,169) contra (123,121,114) no Clássico.
  - Objetivo (`ui.js:431`) e ajuda (`ui.js:749`).
- **Correção** (uma das duas):
  - texto por modo: "planalto claro de pedra" no Premium;
  - ou esfriar o albedo do planalto no Premium (saturação < 8%, um pouco mais escuro), para ele virar cinza-concreto. Esta é a melhor opção, porque também separa da areia clara.

### P7: entrar no Premium trava a simulação alguns segundos, sem aviso
- **Reprodução:** `s7.js`. No F9 Leve → Premium, o tempo de jogo anda ~0,8 s em 3,5 s.
- **Correção:**
  - pausar a partida explicitamente e mostrar "Preparando gráficos…" durante o bake;
  - ou fazer o bake em pedaços por quadro.
- **Na mesma fila:** os avisos `GPU stall due to ReadPixels` (`terrain3d.js:856`). Correção: ler com PBO e fence, ou gerar a máscara na CPU.

### P8: marcadores de ordem ainda contam a vida em `dt` limitado
- **Onde:** `render.js:414` (P6 da rodada 5).
- **O que acontece:** com quadros lentos o marcador some em 2 ou 3 quadros.
- **Correção:**
  - medir a vida com `performance.now()`;
  - marcador de colher em branco ou amarelo com contorno escuro sobre o cristal.

## Variação em relação à rodada 5

| Problema da rodada 5 | Situação |
|---|---|
| P1 seleção "fantasma verde" | **Resolvido** |
| P2 Âmbar sem cor | **Resolvido no anel e no acento.** O casco ainda é neutro, e surgiu a confusão com o anel de seleção (P1 novo) |
| P3 holograma | **Parcial.** O inválido melhorou, o válido continua laje |
| P4 clique na infantaria | **Resolvido** (36/36) |
| P5 planalto cinza | **Parcial.** Distinto da areia e com a grade sutil, mas bege |
| P6 marcadores | **Não mexido** |
| P7 caixa | **Não mexido.** Confirmado: falha na infantaria no zoom 1,8 |
| P8 ReadPixels | **Não mexido** |

## Veredito
O Premium deu um salto real de jogabilidade: a seleção ficou limpa, o Âmbar ficou amarelo e o clique na infantaria está certeiro. O que ainda o separa de uma leitura AAA são a seleção verde sobre o anel amarelo, o holograma sem forma, a caixa que não pega o esquadrão no zoom alto e as unidades que somem no cristal.
