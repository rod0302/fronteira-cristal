# Crítica: desempenho, robustez e regressão de jogabilidade (mod-r1)

**Nota: 7 / 10**

Não houve nenhuma regressão de regra nem de controle, e nenhum erro de console. O novo visual, porém, custa caro.
Nas mesmas condições (Chromium headless sem GPU), a versão aprovada fica cravada em 60 fps em todas as
resoluções. A nova cai para 39 a 57 fps em combates de tamanho real e para cerca de 50 fps numa partida
IA x IA comum em 1920x1080. Trocar de mapa trava a tela por cerca de 1 s, e a tela continua tremendo
enquanto o jogo está pausado. Um jogador exigente perceberia os engasgos.

## Pontos fortes

- **A simulação não mudou.** Testei 34 cenários (3 mapas x 3 dificuldades x 3 sementes em 60/240/600 s, jogador
  parado, partida de 30 min com facção 2, sem névoa e dois roteiros de ordens do jogador). Em todos, o `estado()` é
  idêntico byte a byte ao da aprovada, e o vencedor e as estatísticas também.
- **Os controles não mudaram, mesmo com zoom.** Rodei 640 de 640 verificações com mouse e teclado reais, em
  5 resoluções x 4 zooms (padrão, 70%, 125%, 180%), incluindo o fantasma de prédio no tile certo e cliques e caixas
  acertando as unidades. A roda mantém fixo o ponto sob o cursor (desvio 0,00 px) e respeita os limites de 70% e 180%.
- **Memória estável.** Fiz 30 trocas de mapa, 10 partidas seguidas e uma partida de 20 min até o fim (com GC):
  o heap fica entre 2 e 4,4 MB. Partículas (no máximo 900), marcas de esteira (no máximo 700) e destroços (no máximo
  80) têm teto. Os sprites ficam em cache (cerca de 230).
- Nenhum erro de console em nenhum teste. O jogo se ajusta bem ao redimensionar a janela (até 400x300) e a
  devicePixelRatio 2 no meio da partida: o clique continua acertando a unidade. Vitória, derrota e "Menu
  principal" funcionam 3 vezes seguidas.
- `tests/fumaca.js` passou em 21 s e `tests/partida.js` em 39 s.

## Problemas (do mais grave ao menos grave)

### 1. ATRAPALHA: fps caiu em combate. A aprovada fica em 60; a nova fica entre 28 e 57
Script: `scripts-desempenho/fps.js`. Dois exércitos frente a frente num campo aberto, sem névoa, mouse no meio
da tela, 8 s medidos com requestAnimationFrame. Capturas: `capturas/desempenho/combate-{nova,base}-N-TAM.png`.

- **Com 120 unidades** (o máximo real, já que o limite é 60 por time): a nova fez 46,1 / 53,3 (repetição: 48,8) /
  51,2 (repetição: 49,9) / 38,5 fps em 800x600 / 1280x720 / 1920x1080 / 2560x1440. A aprovada fez 60,1 / 59,0 /
  60,0 / 59,9. O p95 do quadro da nova é 33 a 50 ms; o da aprovada é 16,7 ms.
- **Numa partida real IA x IA** (`fps-partida.js`, mapa 1, difícil, 10 min, câmera na maior concentração, 39
  unidades perto): em 1920x1080, a nova fez **49,9 fps** (p95 33,4 ms) e a aprovada 59,3. Em 1280x720 as duas
  ficam empatadas (cerca de 59).
- **Com 240 unidades** (acima do limite, só como teste de estresse): a nova fez 27,7 fps em 2560x1440 (66 de 222
  quadros acima de 33 ms) e a aprovada 56,4.
- **Causa:** em 1920x1080 com 240 unidades, o tempo de JavaScript por quadro é baixo (renderWorld 2,8 ms; as
  unidades 0,8 ms). O gargalo é a rasterização. Desligando só `drawUnit`, o fps sobe de 32 para 49. Os sprites são
  guardados em escala 2x e desenhados girados e reduzidos a cada quadro, com suavização. Partículas, sombras e
  esteiras somam pouco: cerca de 6 fps, todos juntos.
- **Ressalva:** sem GPU, a rasterização é feita por software. Com GPU o custo absoluto deve ser menor, mas a
  aprovada nas mesmas condições não perde nenhum quadro.

### 2. ATRAPALHA: trocar de mapa trava a tela por cerca de 1 s, e abrir o jogo ficou de 4 a 5 vezes mais lento
Scripts: `tempo-mapa.js` (cada versão sozinha, 2 rodadas) e `memoria.js`.

- Uma chamada a `novoJogo` num mapa diferente leva 720 a 1030 ms na nova; na aprovada leva 80 a 140 ms. Só o
  primeiro mapa sai rápido (cerca de 200 ms), porque o terreno-base fica em cache, mas apenas para **um** mapa
  (`terrainBase` em `terrain.js`).
- **No título, com cliques reais:** cada clique num mapa congela a tela por **810 a 1220 ms** até o 2º quadro
  (30 cliques medidos). Na aprovada são 113 a 177 ms. Quem passeia pelos três mapas sente o jogo travar três vezes.
- Abrir o jogo leva 1,2 a 1,4 s até o evento load na nova, contra 0,16 a 0,19 s na aprovada.
- A demo do título também recomeça com `newGame({demo:true})` a cada fim de partida ou a cada 1500 s, e cada vez
  causa o mesmo engasgo de cerca de 1 s.
- Ideia de correção: guardar o terreno-base dos 3 mapas, ou pintar em partes entre os quadros.

### 3. ATRAPALHA: a tela continua tremendo enquanto o jogo está pausado
Script: `robustez.js`. Captura: `capturas/desempenho/pausa-explosao-nova.png`.

- Passos: comece uma batalha, aperte P durante uma explosão grande e espere.
- **Medição:** `screenShake` = 2,60 no momento da pausa e **continua 2,60 três segundos depois**. Comparando dois
  instantes da tela pausada (amostra de 200x100 px), 1869 e 1158 pixels mudam de um quadro para o outro. Na
  aprovada, 0.
- **Causa:** `updateFx(0)` retorna logo no começo quando dt = 0, então o tremor não diminui. Mesmo assim,
  `renderWorld` sorteia um deslocamento novo a cada quadro (`render.js` linhas 574-575). O mapa atrás do diálogo
  de pausa treme sem parar até o jogador despausar.

### 4. ATRAPALHA: o modo gráfico leve automático não resolve, e há uma faixa morta entre 45 e 57 fps
- O modo leve só liga quando a média passa de 22 ms (abaixo de 45 fps). Na partida real em 1920x1080, a nova
  fica em **49,9 fps com `graficosLeves = false`**: o p95 de 33 ms (quadros alternando entre 16 e 33 ms, ou
  seja, trepidação) nunca liga o modo leve.
- Quando liga, ajuda pouco. Com `?leve` forçado, em 1920x1080 com 240 unidades, foram 38,3 fps (sem `?leve`,
  33,9). Em 2560x1440 com 120 unidades, 43,2 fps. O modo leve tira sombras, brilhos e vinheta e metade da fumaça,
  mas não toca no principal custo, que são os sprites das unidades (problema 1).
- Para desligar o modo leve, são precisos 12 s seguidos acima de 57 fps. Na prática ele não volta durante uma
  batalha.

### 5. DETALHE: em 2560x1440 com zoom de 70%, aparece uma faixa preta de 548 px à direita
Script: `zoom-capturas.js`. Captura: `capturas/desempenho/zoom-2560x1440-0.7.png`.

- A 70%, a área de jogo mostra 3343 px de mundo, mas o mapa tem 2560 px de largura. Por isso a câmera fica presa
  em x = 0 e sobram 548 px de preto entre o mapa e o painel.
- O zoom mínimo deveria depender da tela, por exemplo `max(0,7, largura_da_área / 2560)`. Em 1920x1080 e
  resoluções menores isso não acontece.

### 6. DETALHE: o teste de fps de `tests/fumaca.js` não pega essa regressão
- O teste exige só fps >= 30, em 1280x720 e com 82 unidades. Ele passou com 61,5 fps, enquanto em 1920x1080
  o jogo perde 10 fps (problema 1). Seria bom medir também o p95 e uma resolução Full HD, comparando com 55 fps.

### 7. DETALHE: o zoom à distância diminui a área de clique
- A tolerância do clique é `raio + 4` em px do mundo. Com zoom de 70%, a área de clique de um soldado fica com
  cerca de 30% menos pixels de tela. Os testes passaram mesmo clicando a 1 px da borda do sprite, então é só uma
  questão de conforto.
- A ajuda da pausa (captura `pausa-explosao-nova.png`) não menciona o zoom pela roda do mouse.

## Tabela de medições (nova x aprovada, Chromium headless sem GPU, mesma máquina)

| Medição | Aprovada | Nova |
|---|---|---|
| Regressão de `estado()`: 34 cenários (IA x IA, jogador parado, ordens, 30 min) | referência | **34/34 idênticos** |
| Controles com mouse e teclado reais (5 resoluções; a nova também com 4 zooms) | 145/145 | **640/640** |
| `tests/fumaca.js` / `tests/partida.js` | — | ok (21 s) / ok (39 s) |
| fps, 50 unidades, 800x600 / 1280x720 / 1920x1080 / 2560x1440 | 60,1 / 60,0 / 60,1 / 59,4 | 59,9 / 59,8 / **47,2** / 55,6 |
| fps, 120 unidades, mesmas resoluções | 60,1 / 59,0 / 60,0 / 59,9 | **46,1 / 53,3 / 51,2 / 38,5** |
| fps, 240 unidades (estresse), mesmas resoluções | 59,9 / 58,9 / 59,3 / 56,4 | 50,7 / 49,5 / 33,9 / **27,7** |
| p95 do quadro, 120 unidades, 1920x1080 | 16,8 ms | 33,4 ms |
| fps, 120 unidades, 1920x1080, zoom 70% / 180% | — | 44,6 / 40,9 |
| fps, partida IA x IA real (10 min), 1920x1080 | 59,3 | **49,9** (modo leve não ligou) |
| fps, partida IA x IA real (10 min), 1280x720 | 59,0 | 58,8 |
| fps com `?leve`, 240 unidades, 1920x1080 / 2560x1440 | — | 38,3 / 27,7 |
| fps parado (só a base), 2560x1440 | 60,1 | 56,5 (o modo leve ligou sozinho) |
| Abrir o jogo (evento load) | 0,16 a 0,19 s | **1,03 a 1,21 s** |
| `novoJogo` com troca de mapa | 80 a 140 ms | **720 a 1030 ms** |
| Clique num mapa no título até o 2º quadro (30 cliques) | 113 a 177 ms | **810 a 1220 ms** |
| `avancar(300)` (só simulação) | 424 a 572 ms | 473 a 639 ms (igual) |
| Heap JS após GC: início / 30 trocas de mapa / 10 partidas / 20 min de partida | 1,5 / 1,9 / 2,8 / 3,1 MB | 1,8 / 2,4 / 3,3 / 4,1 MB (estável) |
| Partículas / esteiras / destroços ao longo de 20 min | — / — / ≤80 | ≤52 / ≤700 / ≤80 (com teto) |
| Erros de console (todas as situações testadas) | 0 | 0 |
| Tela tremendo durante a pausa (pixels mudando entre quadros) | 0 | **1869 de 20000** |
| Faixa preta, 2560x1440 com zoom 70% | n/a | **548 px** |

Scripts em `/home/claude/criticos/mod-r1/scripts-desempenho/`: regressao.js, controles.js, fps.js,
fps-partida.js, perfil.js, tempo-mapa.js, memoria.js, robustez.js, vitoria.js e zoom-capturas.js. As saídas
estão nos arquivos *.txt da mesma pasta. As capturas estão em `/home/claude/criticos/mod-r1/capturas/desempenho/`.
