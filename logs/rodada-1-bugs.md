# Rodada 1: crítica de bugs, estados impossíveis, desempenho e robustez

Crítico independente. Testei a cópia congelada em `/home/claude/criticos/rodada-1/jogo/`.
Usei Playwright/Chromium headless via `file://`, com mouse, teclado e `window.__jogo`.
Os scripts estão em `/home/claude/criticos/rodada-1/bugs/` (`t1_longa.js` … `t10_hud.js`, mais o auxiliar `h.js`).
As capturas estão em `/mnt/project-files/rts/logs/capturas/rodada-1-bugs/`.

## Nota: 6,5 / 10

O motor é sólido. Em todos os testes não houve nenhum erro de console, os créditos nunca ficaram negativos e nenhuma unidade ficou presa. Não há vazamento de memória e o jogo roda a 60 fps numa batalha de 200 unidades.

O que tira pontos são dois problemas que **acabam com a partida** por uma ação comum do jogador:
- vender a Central com um clique;
- ir ao "Menu principal" pela pausa.

Há também um vazamento de informação pela névoa e problemas de layout em telas baixas. Um jogador exigente cairia em pelo menos um desses.

---

## O que funciona (medido)

| Verificação | Resultado | Script |
|---|---|---|
| Erros de console / `pageerror` | **0** em todos os 10 scripts | todos |
| Créditos mínimos (IA x IA, normal e difícil) | nunca abaixo de 0 (`minC` = 0, nunca negativo) | t1 |
| Unidades dentro de prédio, em penhasco, fora do mapa ou com NaN | 0 em todas as amostras de 1 min | t1 |
| Detector de presas (caminho > 0 e parada por 8 s) em IA x IA de 474 s | 0 unidades presas, 0 coletores no mesmo estado por mais de 45 s | t6 |
| 160 unidades mandadas para o mesmo tile | caminhos em 6 ms; todas paradas em 40 s; 0 pares muito sobrepostos | t6 |
| Memória em 25 min de IA x IA (371 unidades no fim) | heap de 1,1 MB para 2,1 MB, estável; 61 nós DOM e 12 listeners constantes | t3 |
| 30 reinícios seguidos | 3,3 s no total; estado limpo (10 unidades, 2 prédios, ids reiniciados) | t2 |
| fps com desenho: batalha de 200 unidades, 1920x1080 | 59,7 fps, p95 16,8 ms, tempo de jogo em 1,0x | t8 |
| Redimensionar 10 vezes durante a partida | canvas e câmera corretos | t4 |
| Vender fábrica com 5 blindados na fila | reembolso exato (714 = 500 + 214 gastos) | t2 |
| Cancelar obra ou fila | devolve exatamente o que foi gasto | t2 |
| Refinaria destruída com coletor descarregando | coletor fica parado com a carga e retoma ao surgir refinaria nova | t2 |
| Partida inteira pelo mouse (botões, posicionar, ponto de encontro, caixa, Ctrl+1, A+clique) | tudo respondeu como esperado | t5 |

---

## Lista de problemas (por gravidade)

### BLOQUEIA A PARTIDA

**1. Vender a Central é um clique sem confirmação, devolve 0 e não tem volta.** Depois disso nunca mais se constrói nada.
- **Reprodução** (`t7_central.js`):
  1. Clique na Central.
  2. Clique em "Vender" no painel.
- **Medido:** `devolvido: 0`, `temCentral: false`. `construir('power')` responde "Sem Central não se constrói" e os 6 botões de prédio ficam com cadeado.
- **Capturas:** `t7-central-selecionada.png` (botão Vender ao lado de Reparar, sem aviso) e `t7-sem-central.png`.
- **Causa:**
  - `ui.js` `drawInfoPanel` mostra Vender para qualquer prédio próprio.
  - `sellBuilding` (buildings.js) não tem exceção.
  - `hq` tem `buildable: false` e `cost: 0`.
- **Correção sugerida:** não permitir vender a Central, ou pedir confirmação.

**2. "Menu principal" na pausa não encerra a partida.**
- **O que acontece:** a partida abandonada continua rodando atrás da tela de título, com o time do jogador parado. Minutos depois a tela de título é trocada sozinha por **DERROTA**.
- **Reprodução** (`t4_menu_tela.js`):
  1. Partida com `?jogar`.
  2. Aperte P e clique em "Menu principal".
- **Estado logo depois:** `{fase:'title', demo:false, ais:[1], jogadorIA:false, nevoa:true}`.
- **Medido:** acelerando a simulação, aos 5:48 a fase passou de `title` para `lost`.
- **Capturas:** `t4-menu-apos-pausa.png`, depois `t4-titulo-vira-derrota.png` (DERROTA por cima do menu).
- **Causa:** `ui.js` `uiClick`, `case 'menu': gameState = 'title'` não chama `newGame({ demo: true })`. O laço em `main.js` só troca para a demo quando `winner >= 0`. `checkVictory` com `demoMode=false` põe a fase em `'lost'`.

### ATRAPALHA

**3. A névoa mostra prédios inimigos novos e o estado ao vivo de áreas já exploradas.**
- **Reprodução** (`t9_nevoa.js`):
  1. Um batedor passa pela base inimiga quando só existe a Central, e morre.
  2. Avance 3 min.
- **Medido:** os 6 prédios novos (usinas, refinaria, quartel, fábrica, torre) aparecem desenhados com `visivel:false, desenhado:true`, no mundo e no minimapa. Nenhuma unidade do jogador estava a menos de 15 tiles.
- **Captura:** `t9-nevoa-predios-novos-visiveis.png`.
- **Causa:**
  - `render.js` `renderWorld` e `drawMinimap` desenham `buildings` vivos sempre que `isExploredByPlayer(b)`.
  - Não há "memória" do que foi visto, então prédios destruídos também somem sem visão.

**4. Telas com menos de ~560 px de altura cortam o painel lateral.**
- **Medido** (`t4_menu_tela.js`):
  - Em 1024x500 e 640x480, o botão **Torre** sai da tela (`foraDaTela: ["build:turret"]`).
  - O painel de informações, com **Vender/Reparar**, não é desenhado (`SEM BOTÃO VENDER`).
- **Captura:** `t4-jogo-1024x500.png`.
- **Causa:** `sidebarLayout()` fixa `rowH` em pelo menos 34 e não rola nem compacta. `drawInfoPanel` desiste com `h < 40`.

**5. A rolagem pela borda dispara dentro do painel lateral.**
- **Medido:** em 800x600, com o mouse parado na parte de baixo do botão "Vender" (y = 592; a faixa de rolagem começa em 588), a câmera desceu de y=116 para 689 em 0,7 s.
- **Captura:** `t4-jogo-800x600.png` (botão Vender em y 572–594).
- **Causa:** `camera.js` `updateCamera` usa `input.mouseY > camera.h - EDGE_SIZE` e `mouseX > canvas.width - EDGE_SIZE` sem excluir o painel.

**6. Não há limite de unidades, e o custo da simulação cresce de forma quadrática.**
- **Medido** (`t3_exercitos.js`, IA x IA difícil, ondas desligadas por 25 min): 371 unidades no fim, e a IA continua produzindo.

  | Unidades | ms de CPU por segundo de jogo |
  |---|---|
  | 66 | 7,5 |
  | 162 | 50 |
  | 259 | 124 |
  | 371 | 253 |
  | 298, no início da batalha | 483 |

- **Picos:** passos isolados de 31–34 ms.
- **fps real:** 54,6 (p95 33 ms) com 372 unidades. 300 tanques parados em 1920x1080 dão 40,5 fps (`t8_fps.js`).
- **Em uso normal:** com até ~200 unidades está tudo bem (60 fps).
- **Causa:** em `combat.js` `thinkUnit`, toda unidade parada sem alvo chama `findNearestEnemy` a cada passo, varrendo todas as unidades (com `isVisibleToPlayer`). `separateUnits` também é O(n²).
- **Sugestão:** limite de população, ou procurar alvo a cada ~0,25 s e com grade espacial.

**7. Reparar a Central é de graça.**
- **Medido** (`t7_central.js`): com 0 créditos, a Central foi de 200 a 2000 de vida em 25 s, gastando 0.
- **Causa:** `updateRepair` calcula o preço por `costOf(hq) = 0`.

### DETALHE

**8. Comprar e vender refinaria dá coletor barato.** Quatro ciclos deram 4 coletores por 2000 créditos (500 cada, contra 700 na fábrica). Causa: `placeConstruction` dá o coletor e `sellBuilding` devolve 50% (`t7_central.js`).

**9. Prédio pronto pode ser colocado sem Central.** Depois de destruir a Central, `construir()` recusa, mas `posicionar()` do prédio já pronto aceita (resultado `null`). `placeConstruction` não confere `hq` (`t2_casos.js`, caso 9).

**10. Prédio pode ser posto em cima do corpo de uma unidade.** `checkPlacement` só testa o tile do centro da unidade. Um blindado com o centro 2 px fora ficou 10 px dentro da usina (`t2_casos.js`, caso 5).

**11. Ordem em penhasco profundo ou fora do mapa é ignorada sem aviso.** Clicando no penhasco em (61,0), a 16 tiles do chão andável mais próximo, 0 de 6 unidades receberam caminho, mas o marcador de ordem aparece. Causa: `formationSlots` → `nearestWalkable(maxR=12)` devolve vazio (`t2_casos.js`, caso 7).

**12. Clique na barra superior passa para o mundo.** Clique direito sobre a barra (y=12) virou ordem para o mundo atrás dela (destino y=292 com a barra cobrindo até 308). `input.js` não exclui `HUD_H` (`t10_hud.js`).

**13. Seleção em caixa arrastada sobre o painel lateral seleciona unidades escondidas atrás dele.** O teste selecionou um batedor fora da área visível (`foraDaVista: true`, `t10_hud.js`).

**14. Coletor descarrega sem chegar na refinaria.** Com a refinaria cercada por torres, o coletor descarregou a 1,5 tile do lado de fora depois de 4 tentativas e rendeu 2100 créditos em 90 s. Causa: `harvest.js`, `if (near || u.tries > 3)`. É benigno, mas é um "teletransporte" de carga (`t2_casos.js`, caso 1).

**15. Texto cortado no painel.** "Clique direito no mapa: ponto de encontro" é cortado na borda do painel de informações ao selecionar Quartel ou Fábrica (`t4-jogo-800x600.png`).

---

## Outras observações (fora da minha lente, sem ação exigida)

- Nas duas partidas IA x IA (normal e difícil), o time 0 (Liga Cobalto) venceu as duas: aos 7:54 e aos 6:42. O time 1 (Clã Brasa) mandou o exército inteiro e ficou com 0–1 unidade. Vale o crítico de equilíbrio olhar se há assimetria de posição ou de facção (`t1.log`).
- Nos primeiros 2–3 min, as duas IAs ficam com 0 créditos por longos trechos (`t1.log`, t=120 s: `cred [0,0]`).
