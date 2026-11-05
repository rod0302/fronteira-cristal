# Rodada 3: bugs, estados impossíveis, desempenho e robustez

- **Versão testada:** cópia congelada em `/home/claude/criticos/rodada-3/jogo/` (05:25 UTC).
- **Scripts:** `/home/claude/criticos/rodada-3/bugs/`. O auxiliar é `h.js` e as checagens de invariantes ficam em `inv.js`. Para rodar: `node tNN_*.js`.
- **Capturas:** `/mnt/project-files/rts/logs/capturas/rodada-3-bugs/`.
- **Como testei:** Playwright com Chromium headless, via `file://`. Usei mouse e teclado de verdade (botões do painel, posicionamento por clique, caixa de seleção, Ctrl+1, A + clique no minimapa, pausa, reinício e menu) e também `window.__jogo`. Ao todo foram cerca de 4 h de jogo simulado: IA contra IA nos 3 mapas, no Normal e no Difícil, de 25 a 30 min cada, mais 3 partidas de 12 min jogadas por um bot com mouse.

## Nota: 8,0 / 10

A robustez melhorou bastante desde a rodada 2 (7,5). Nenhum teste quebrou a partida e não houve nenhum erro de console em mais de 20 scripts.
Nenhum estado impossível apareceu nas checagens automáticas: crédito negativo, NaN, prédios sobrepostos, unidade dentro de penhasco ou prédio, mapa de ocupação incoerente ou limite de 60 unidades ultrapassado. A memória fica estável e o desempenho sobra.
Todas as correções prometidas da rodada 2 que conferi funcionam. São elas: painel travado na pausa, avisos que param na pausa, retina, coletor que busca cristal no mapa inteiro, refinaria que respeita o limite, obra pronta devolvida sem Central, `posicionar` que devolve o motivo da falha e prédios lembrados sob a névoa.
O que segura a nota abaixo de 8,5 são estes pontos:
- a IA trava de vez quando perde os coletores e fica sem dinheiro, o que gera partidas sem fim e vitórias de graça;
- a perseguição forçada atravessa a névoa com informação perfeita;
- algumas unidades ficam tremendo para sempre perto de um destino lotado;
- a porta de produção pode ser fechada pelos próprios prédios;
- na tela de 640x400 somem o painel de informações e um botão da tela de fim.

---

## O que funciona (medido)

| Área | Resultado | Script |
|---|---|---|
| Memória em partida longa | Heap JS de 1,2 MB no início e 2,3 a 2,5 MB aos 25 a 30 min, sem crescer, nos 3 mapas (com GC forçado pelo CDP). Com o desenho ligado (25 min no Difícil, mapa 1): de 1,17 a 2,38 MB. | t7, t15 |
| Reiniciar 40 vezes (pausa > Reiniciar, Menu > trocar mapa > JOGAR) | Heap de 1,1 a 1,9 MB e estável. Nós de DOM ficam em 61 e ouvintes em 12. Cada `novoJogo` leva cerca de 120 ms (um engasgo aceitável no clique). | t11 |
| Custo da simulação | Média de 0,15 ms por passo de 1/60 s em IA contra IA de 26 min. Os passos acima de 16 ms (de 3 a 7 por partida) caem em instantes diferentes a cada repetição, então são GC ou JIT, não algoritmo. | t9, t22 |
| FPS com 116 unidades em combate na tela | A 1280x720: 54 fps, quadro p50 de 16,7 ms, desenho em JS p50 de 1,6 ms e p95 de 4,3 ms. A 1920x1080: 49 fps, desenho p50 de 0,9 ms. | t10 |
| 55 unidades para o mesmo ponto | No centro dos 3 mapas, todas chegam em menos de 40 s e terminam a até 5 tiles do ponto. Não houve sobreposição nem unidade em tile bloqueado. A ordem leva de 2 a 16 ms. | t4 |
| Ordens para penhasco ou fora do mapa | Penhasco: o grupo vai até a borda mais próxima. Fora do mapa: a ordem é ignorada (só dá para fazer isso pela API). | t4 |
| Construir em lugar inválido | Devolve "Há unidades no caminho", "Só dá para construir no planalto de pedra", "Lugar ocupado". Fora do mapa também é recusado. | t2b |
| Cancelar e vender | Cancelar devolve 100% (200 de 200 em andamento, 500 de 500 pronta). Vender a fábrica com 3 na fila devolve 500 da venda mais 234 do que já foi pago na fila. | t2, t2b |
| Filas e limite | 5 por produtor ("Fila cheia"). O limite de 60 conta a fila ("Limite de 60 unidades atingido"). | t2b |
| Perder a energia | Consumo 90 contra geração 30: radar desliga e a produção fica em 0,5x. | t2 |
| Refinaria destruída com coletor descarregando | O coletor guarda a carga, completa no campo e descarrega em outra refinaria. Sem nenhuma refinaria ele espera e volta a trabalhar quando uma nova é construída. | t3 |
| Perder a Central | A obra é cancelada e o dinheiro volta. `construir` responde "Sem Central não se constrói". A produção de unidades continua. | t3 |
| Pausa | Cliques no painel e teclas A, S e H não fazem nada. O clique direito não dá ordem. O alerta continua na tela depois de 9 s pausado. | t12 |
| Redimensionar no meio da partida (800x600, 1024x500, 640x400, 1920x1080, 420x300) | Sem erros, câmera e canvas certos. Com DPR 2, o canvas fica em 2560x1440 para 1280x720 CSS. | t1, t20 |
| Esgotar o cristal | Aparece o aviso "O cristal perto da Refinaria está acabando…". A simulação não fica mais cara (de 20 a 90 ms por 10 s simulados). | t14 |
| Bot jogando só com mouse e teclado, 3 mapas, 12 min | 0 falhas de posicionamento por clique. Caixa de seleção, Ctrl+1 e A + minimapa funcionaram (de 7 a 18 unidades atacando-movendo). 0 erros. | t13 |

---

## Lista de problemas (por gravidade)

### BLOQUEIA A PARTIDA

Nenhum encontrado.

### ATRAPALHA

#### 1. A IA trava para sempre quando fica sem coletores e sem créditos (tem refinaria, não tem renda)
- **Caso natural** (`t17_ia_falida.js`): IA contra IA no mapa 2 (Três Campos), Normal, semente 13. Olhando o time 0:
  ```
  t=570 cred=0 col=2 armadas=15 ref=3 fab=2 pred=19 fila=4
  t=720 cred=0 col=0 armadas=10 ref=3 fab=2 pred=19 fila=4 colhido=24500
  ...
  t=900 cred=0 col=0 armadas=4  ref=3 fab=2 pred=19 fila=4 colhido=24500
  ```
  Aos 15 min a fábrica tem "Coletor 61% esperando" e o time tem 0,05 crédito. Ela nunca sai disso: são 19 prédios inteiros e nenhum é vendido. Captura: `t17-ia-falida-sem-coletor.png`, com o painel mostrando 0 créditos, "sem ◆" e "Produzindo Coletor (2 na fila)".
- **Caso forçado** (mesmo script): aos 6 min, matei os coletores da IA e zerei os créditos. Dez minutos depois ela continuava com 0 crédito, 0 coletor e a fila "tank(esperando)", com a obra "power" em `waiting`.
- **Causa:** `ai.js:167`. A venda de emergência (`aiEconomy`) só dispara quando **não há refinaria** (`!hasBuilding(team,'refinery') && …`). Com refinaria e sem coletor, a IA não tem saída. Além disso, `ai.js:202` (`if (f.queue.length >= 2) return`) deixa a fila presa em blindados que nunca terminam, e `ai.js:215` só põe um item na fila com 25% do preço em caixa.
- **Impacto:** uma incursão de batedores contra os coletores aleija a IA pelo resto da partida (vitória de graça para o jogador). Também ajuda a explicar as partidas IA contra IA sem vencedor: o mapa 0 Normal chegou aos 30 min sem fim (t7).
- **Correção sugerida:** tratar "nenhum coletor e créditos abaixo do preço de um coletor" como falência. Nesse caso a IA cancela a fila (o dinheiro volta) e vende o prédio dispensável mais barato até poder pagar um coletor, com o coletor sempre no topo da fila.

#### 2. O ataque forçado persegue o alvo pela névoa com informação perfeita
- **Reprodução** (`t6_perseguir.js`): um Soldado recebe ordem de atacar um Coletor inimigo, e o Coletor foge para o canto inimigo. Resultado: o alvo ficou invisível a partir de t=10 s e o soldado continuou atrás dele por 40 s, corrigindo a rota a cada 0,6 s pela posição **real** do alvo. Saiu de (35,19) e foi até (50,53), a 11 tiles do coletor que ninguém vê.
- **Causa:** `combat.js:76` só larga um alvo invisível quando a ordem não é forçada (`!u.forced && !canTarget`). Depois, `combat.js:142` faz `setUnitPath(u, t.x, t.y)` com a posição atual do alvo, que o jogador não conhece.
- **Impacto:** uma unidade sozinha "rastreia" o inimigo através da névoa e entra na base dele (morte certa, e ainda revela onde o alvo está). Clássicos do gênero param no último ponto visto.
- **Correção sugerida:** quando um alvo forçado sair da visão, trocar a ordem por "mover até a última posição vista" e largar o alvo ao chegar.

#### 3. Unidades tremem para sempre perto de um destino lotado (e a IA lota a própria base)
- **Reprodução 1** (`t7_longa.js 25 dificil` e `t18_presa.js`): IA contra IA no mapa 0, Difícil, semente 11. O blindado #290 da IA fica de t=850 a t=880 s (40 s ou mais) entre (65,62) e (65,63). Ele refaz o caminho a cada 1 s e nunca para: o `path` alterna entre `[[65.5,63.5],[63,63]]` e `[[63,63]]`. O destino de atacar-movendo (63,63) está no meio de cerca de 40 unidades paradas. Captura: `t18-blindado-preso.png` mostra o ponto de encontro da IA espremido entre refinarias e usinas.
- **Reprodução 2** (`t19_base_cheia.js`): mandei 55 unidades do jogador para um ponto entre os prédios da própria base. 54 param, mas o Obuseiro #39 continua com caminho depois de 120 s (a contagem "andando" a cada 10 s foi `51,50,12,1,1,1,1,1,1,1,1,1`). Captura: `t19-base-cheia.png`.
- **Causa:**
  - Em `units.js:105-108`, sem progresso por 1 s, a viagem só termina se a unidade estiver a menos de 2,5 tiles do fim. Fora disso ela refaz o mesmo caminho, sem limite de tentativas.
  - Com `amove`, `combat.js:119` também refaz o caminho sempre que a distância passa de 1 tile.
  - O ponto de encontro da IA fica a 22% do caminho até o centro (`ai.js:42-43`). Em alguns mapas isso cai no meio da base, entre refinarias, e é ali que a onda se junta.
- **Impacto:** a unidade aparece como "atacando-movendo" ou "em movimento" para sempre, gira no lugar e empurra as vizinhas. A aglomeração da IA perto das docas pode atrasar os coletores dela.
- **Correção sugerida:** depois de N repaths sem progresso (ou ao chegar a menos de 2,5 tiles de um destino ocupado por unidades paradas), dar a viagem por encerrada e limpar `amove`. Ponto de encontro da IA fora da área de prédios.

#### 4. A porta do Quartel ou da Fábrica pode ser fechada pelos próprios prédios, e as unidades nascem presas sem aviso
- **Reprodução** (`t5_porta.js`): coloquei 6 Torres (1x1) nos tiles de planalto em volta da porta do Quartel, todos aceitos por `posicionar`. O caminho da porta até (30,30) volta vazio. Os 2 Soldados produzidos depois nascem em (7,11) e continuam lá 30 s depois da ordem de mover. Captura: `t5-porta-cercada.png`.
- **Causa:** `checkPlacement` não protege o tile da porta. `buildingExit` (`buildings.js:111`) usa `nearestWalkable` com raio 8, sem conferir se o tile de saída se liga ao resto do mapa. O problema já tinha sido apontado na rodada 2 e continua igual.
- **Impacto:** o dinheiro vai para unidades que não saem. O jogador não recebe nenhuma mensagem. O mesmo vale para a doca da Refinaria.
- **Correção sugerida:** recusar construir no tile da porta ou da doca ("Bloquearia a saída do Quartel"), ou escolher uma saída alcançável (A* ou flood até um tile fora da base).

#### 5. Telas baixas: a 640x400 somem o painel de informações e o botão "Menu principal" da tela de fim
- **Medido** (`t1_telas.js`):
  - **640x400, jogo:** com a Central ou um Blindado selecionado, `uiHits` não tem `repair`, `sell`, `amove` nem `stop`, e o quadro **Objetivo** também some (captura `t1-jogo-central-640x400.png`). Os botões de produção acabam em y=364. O painel precisaria de pelo menos 40 px e sobram 20. As teclas R, V, A e S ainda funcionam.
  - **640x400, fim de partida:** "Menu principal" ocupa y=370 a 410, fora da tela (captura `t1-fim-640x400.png`).
  - **640x400, título:** "ESCOLHA SUA FACÇÃO" fica colado ao nome do jogo e o rótulo "DIFICULDADE" sai cortado à esquerda (`t1-titulo-640x400.png`).
  - **640x400, pausa:** as linhas de controles saem cortadas nas laterais e embaixo (`t1-pausa-640x400.png`).
  - **800x600:** a faixa de Objetivo no topo corta a frase ("…Ela gera energia", `t1-jogo-unidade-800x600.png`).
  - **1024x500, 1920x1080 e DPR 2:** tudo cabe.
- **Causa:** `ui.js:247` (`if (h < 40) return`), `ui.js:647` (posições fixas na tela de fim) e o título em `ui.js:547`, que só compacta a altura e não a largura.

### DETALHE

#### 6. Refinaria construída no limite de unidades cobra 1000 e não dá o Coletor, sem nenhum aviso
- **Reprodução** (`t21_detalhes.js`): com `unitCount = 60`, a refinaria foi construída e posicionada (`posicionar` devolveu `null`). Foram pagos 1000, os coletores continuaram 1 → 1 e a única mensagem foi "Refinaria pronta…". A dica do botão continua prometendo "Vem com um Coletor de graça".
- **Causa:** `buildings.js:206` pula o coletor em silêncio. O valor de venda (`sellBase: 300`) também supõe que o coletor veio junto.
- **Sugestão:** avisar ("Limite de unidades: a Refinaria veio sem Coletor") ou guardar o coletor para quando abrir vaga.

#### 7. Prédio inimigo vendido some do mapa na hora, mesmo sob a névoa (vazamento de informação)
- **Reprodução** (`t21_detalhes.js`): um batedor vê uma Usina inimiga e morre, e a usina fica "lembrada". A IA vende a usina e ela some na hora do mapa e do minimapa: `fantasmas: 0`, `aindaDesenhado: false`.
- **Causa:** `sellBuilding` (`buildings.js:335`) não cria o "fantasma" que `destroyBuilding` cria.

#### 8. Ctrl+número sem nada selecionado apaga o grupo
- **Reprodução** (`t21_detalhes.js`): o grupo 1 tinha 5 unidades. Depois de Esc (limpa a seleção) e Ctrl+1, ficou com 0.
- **Causa:** `input.js:179` grava a seleção vazia por cima do grupo.

#### 9. O modo de posicionar continua ativo depois que a obra é cancelada por perda da Central
- **Reprodução** (`t3_extremos2.js`, caso H): `input.mode` continua `'place'` com `construct: null`. O próximo clique só limpa o modo. É só cosmético.

#### 10. O radar no minimapa só mostra inimigos que já estão à vista
- `render.js:703` desenha uma unidade inimiga no minimapa só se `radar && isVisibleToPlayer(u)`. O README diz "Radar mostra os inimigos no minimapa", mas na prática o radar só põe no minimapa o que as suas unidades já veem. Fica a dúvida se é intencional. Em todo caso, o benefício do Radar fica pequeno.

---

## Observações sem gravidade (não pesaram na nota)

- **DPR 2 a 1920x1080 no headless:** 12 fps, mas o desenho em JS é de 1,3 ms. O resto é rasterização por software de um canvas de 3840x2160 sem GPU, então o número não é conclusivo para uma máquina real. Com DPR 1 na mesma resolução: 49 fps.
- **Partidas IA contra IA sem vencedor:** mapa 0 Normal aos 30 min e mapa 0 Difícil aos 25 min. É em parte efeito do problema 1.
- **O jogo não pausa sozinho ao perder o foco da janela.** Com a aba oculta o `requestAnimationFrame` para, então na prática o jogo para.
- **Ordens para fora do mapa pela API** são ignoradas em silêncio (pelo mouse isso não acontece).
- Com `?pausado`, o estado `frozen` continua valendo depois de "Reiniciar" pela pausa. Isso só afeta o modo de teste.

---

## Os 5 mais graves

1. **A IA trava para sempre sem coletores e sem créditos.** Ela tem refinaria, então nunca vende nada. No mapa 2 ficou 0 crédito e 0 coletor de 12 a 15 min e não se recuperou (`ai.js:167`, `:202`, `:215`).
2. **O ataque forçado persegue o alvo pela névoa com a posição real dele.** O soldado seguiu um coletor invisível por 40 s até a base inimiga (`combat.js:76`, `:142`).
3. **Unidades tremem para sempre perto de um destino lotado.** Um blindado da IA ficou 40 s ou mais no lugar e um obuseiro do jogador 120 s ou mais. O ponto de encontro da IA fica no meio da base (`units.js:105-108`, `combat.js:119`, `ai.js:42`).
4. **Porta do Quartel ou da Fábrica fechável pelos próprios prédios.** As unidades nascem presas sem aviso (`buildings.js:111`), como já apontado na rodada 2.
5. **640x400:** sem painel de informações (Reparar, Vender, Atacar, Parar e Objetivo) e com o "Menu principal" da tela de fim fora da tela.
