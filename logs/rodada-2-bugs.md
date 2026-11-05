# Rodada 2: bugs, estados impossíveis, desempenho e robustez

Este é o relatório de um crítico independente. Testei a cópia congelada em `/home/claude/criticos/rodada-2/jogo/`, aberta via `file://` no Chromium headless pelo Playwright. Usei mouse, teclado e `window.__jogo`, e também li as variáveis globais do jogo direto no `page.evaluate`.

- **Scripts:** `/home/claude/criticos/rodada-2/bugs/`. Vão de `t1_longa.js` a `t19_msgpausa.js`; o auxiliar é `h.js`.
- **Capturas:** `/mnt/project-files/rts/logs/capturas/rodada-2-bugs/`.

## Nota: 7,5 / 10

O motor está **muito robusto**. Em cerca de 30 horas de jogo simulado (IA x IA nos 3 mapas e nas 3 dificuldades, partidas de até 150 min) o resultado foi:
- nenhum erro de console;
- nenhum crédito negativo;
- nenhuma unidade presa, em penhasco, dentro de prédio ou com NaN;
- nenhum prédio sobreposto e nenhuma inconsistência no mapa de ocupação;
- memória estável;
- 60 fps com 250 unidades em combate a 1920x1080.

Os dois problemas que bloqueavam a partida na rodada 1 estão corrigidos: vender a Central e o "Menu principal" que não encerrava a partida.

A nota não chega a 8 por causa de vários defeitos menores que um jogador exigente nota:
- coletores param para sempre no fim de partidas longas, mesmo com cristal alcançável no mapa;
- a pausa e a tela de fim não bloqueiam o painel lateral;
- os alertas somem durante a pausa;
- a tela fica borrada em monitores de alta densidade (retina);
- a interface quebra em telas baixas;
- há vazamentos pela névoa;
- a unidade nova atravessa um muro de prédios;
- a refinaria fura o limite de unidades.

Nenhum desses defeitos encerra a partida.

---

## O que funciona (medido)

| Verificação | Resultado | Script |
|---|---|---|
| Erros de console (`pageerror`, `console.error`, avisos) | **0** em todos os 19 scripts | todos |
| IA x IA, 3 mapas x 3 dificuldades, até 25 min, invariantes checadas a cada 5 s | 0 créditos negativos (mínimo 0), 0 NaN, 0 fora do mapa, 0 em penhasco, 0 dentro de prédio, 0 prédios sobrepostos, 0 inconsistências em `gameMap.occ`, 0 coletores no mesmo estado (fora de "idle") por mais de 60 s | t1 |
| Detector estrito de unidades presas (40 s andando dentro de uma caixa de 2 tiles) e de "alvo há 40 s sem atirar" | 0 casos em 6 partidas de 20 min, com névoa (3 mapas x 2 sementes) | t14 |
| Memória em 24 min de IA x IA difícil, nos 3 mapas (heap depois de forçar a coleta de lixo) | 1,6 → 2,2 MB (mapa 0), 2,0 → 2,1 MB (mapa 1), 2,1 → 2,2 MB (mapa 2); 61 nós DOM e 12 listeners constantes; `decals` limitado a 80 | t5 |
| 40 reinícios seguidos pela API | heap de 2,19 → 2,11 MB; estado limpo (10 unidades, 2 prédios, ids reiniciados) | t5 |
| 20 reinícios pela pausa com o mouse | 4,7 s no total; 20 sementes de IA diferentes; mapa, dificuldade e facção preservados | t12 |
| Trocar o mapa 9 vezes seguidas no título, depois Menu principal pela pausa | título com demo IA x IA; Enter começa; nenhum resquício da partida anterior | t12 |
| fps com desenho a 1920x1080, 1024x500 e 800x600, batalha de cerca de 100 unidades | 60 fps, p95 de 16,8 ms, ritmo de jogo 1,0x | t6 |
| Estresse de 250 unidades atacando-movendo de canto a canto, 1920x1080 | 58 a 60 fps, ritmo 1,0x; simulação pura com 56 unidades: 19 ms por segundo de jogo | t13 |
| 51 unidades selecionadas por caixa e mandadas por clique direito ao centro, a um penhasco e ao canto inimigo | 0 pares sobrepostos; todas paradas em 30 a 40 s; espalhadas em até 8 tiles | t9 |
| Vender fábrica produzindo | reembolso exato (46117 = antes + gasto na fila + 50% x vida) | t2 |
| Sem energia (vendi todas as Usinas) | produção a 0,5x, radar desligado | t2 |
| Refinaria destruída com coletor descarregando | coletor fica com a carga e volta a descarregar quando surge uma refinaria nova | t7 |
| Construir em cima de unidade pelo mouse | recusado com "Há unidades no caminho" | t10 |
| Esgotamento natural (IA sozinha por 60 min) | coletores sem ficar parados enquanto há cristal por perto | t8 |

---

## Lista de problemas (por gravidade)

### BLOQUEIA A PARTIDA

Nenhum encontrado.

### ATRAPALHA

**1. Coletores param para sempre com cristal alcançável no mapa.** Eles ficam em "procurando cristal" sem nenhum aviso.

- **Causa:** `harvest.js:10` e `:35`. `findCrystalNear` faz uma busca em largura limitada a `HARVEST_SEARCH_NODES = 2500` tiles, a partir do último campo. Quando o cristal restante fica mais longe que isso (cerca de 28 tiles de raio em área aberta), o coletor nunca o encontra. Ele repete a busca a cada 2 s, para sempre.

- **Reprodução natural** (`t8c_fim.js`): mapa 1 ("Vale Partido"), a IA joga sozinha pelo time 0 e a Central inimiga é invulnerável.

  | min | cristal no mapa | tiles | colhido | estados dos 5 coletores |
  |---|---|---|---|---|
  | 70 | 7513 | 18 | 139500 | toRefinery, toField, harvest, toField, toRefinery |
  | 75 | 3528 | 8 | 144570 | idle, idle, idle, idle, idle |
  | 150 | 3528 | 8 | 144570 | idle, idle, idle, idle, idle |

  O cristal que sobra fica nos tiles (69..72, 0..2), no canto superior direito.

- **A sobra é alcançável** (`t8d_alcance.js`):
  - `floodReachable` confirma que os 8 tiles estão conectados;
  - a busca até lá precisa de **4500 nós**, contra o limite de 2500;
  - uma ordem manual de colher (`t8e_trajeto.js`) chega e colhe normalmente.

- **Caso forçado** (`t7_coletor.js`): deixei só um campo a cerca de 45 tiles da base. Resultado: **6 de 7 coletores ficaram em "idle" por mais de 6 min**.

- **Impacto:** em partida longa, ou num mapa com campos espalhados, a renda zera em silêncio. O painel só diz "procurando cristal".

- **Correção sugerida:** quando a busca local falhar, fazer uma busca sem limite (ou pelo mapa inteiro) a cada N segundos. Ou avisar o jogador: "Coletor sem cristal por perto".

**2. A pausa e a tela de fim não bloqueiam o painel lateral.** Com o jogo pausado dá para começar obras, pôr e tirar unidades da fila, ligar o reparo e vender (dois cliques). Na tela de VITÓRIA ou DERROTA também.

- **Reprodução** (`t4_pausa.js`):
  1. Abra com `?jogar` e aperte P.
  2. Clique no botão Usina, que fica visível à direita sob o escurecimento. Medido: `construcao[0] = { tipo: 'power', progresso: 0 }`.
  3. Force a vitória e clique em Soldado. Medido: a fila vai de 0 para 1.
- **Capturas:** `t4-pausa-clique-painel.png` e `t4-tela-fim.png`.
- **Causa:**
  - `input.js:33-35` manda todo clique esquerdo para `uiClick` quando a fase não é `playing`.
  - `ui.js:601-604` desenha o painel lateral, e registra os botões dele em `uiHits`, antes de desenhar a pausa ou o fim.
  - `hitAt` só dá prioridade aos botões da pausa. O resto do painel continua clicável.
- **Correção sugerida:** em `uiClick`, ignorar as ações `build`, `unit`, `repair` e `sell` quando a fase não for `playing`. Ou limpar `uiHits` antes de desenhar a sobreposição.

**3. Os alertas expiram em tempo real, inclusive durante a pausa.**

- **Reprodução** (`t19_msgpausa.js`):
  1. Gere o alerta "Base sob ataque!" e pause logo em seguida (havia 2 mensagens).
  2. Espere 8,5 s com o jogo pausado (tempo de jogo parado em 0,38 s).
  3. Medido: **0 mensagens**.
- **Captura:** `t19-alerta-sumiu-na-pausa.png`.
- **Impacto:** o jogador que pausa para ler o que aconteceu perde o aviso.
- **Causa:** `ui.js:424` filtra as mensagens por `performance.now() - m.t`, e não pelo tempo de jogo.

**4. Tela borrada em monitor de alta densidade (retina, DPR 2).**

- **Medido** (`t11_telas.js`): com DPR 2, o canvas tem 900x600 pixels para uma área CSS de 900x600, ou seja, metade da resolução física.
- **Captura:** `t11-dpr2-borrado.png`. Os créditos e o minimapa saem visivelmente borrados.
- **Causa:** `main.js:20` usa `canvas.width = window.innerWidth`, sem `devicePixelRatio`. Hoje a maioria dos notebooks e telas Mac é assim.

### DETALHE

**5. A refinaria fura o limite de unidades.**

- **Reprodução** (`t3_limite.js`):
  1. Encha o exército até 60. Medido: `produzir` responde "Limite de 60 unidades atingido".
  2. Construa 3 Refinarias. Medido: **63 unidades** (com `UNIT_CAP = 60`).
- **Causa:** `buildings.js:205` cria o Coletor grátis sem checar `unitCount`. A IA também constrói 3 ou mais refinarias e pode passar do limite.

**6. Prédio "PRONTO" com a Central destruída fica preso para sempre, sem aviso.**

- **Reprodução** (`t3_limite.js`):
  1. Usina pronta.
  2. A Central é destruída.
  3. Medido 60 s depois: `construcao[0] = { tipo: 'power', progresso: 1, pronto: true }`.
- **O que o jogador vê:**
  - Clicar em PRONTO entra no modo de posicionar.
  - Clicar no mapa não faz nada: nenhuma mensagem, nenhum som.
  - O dinheiro fica preso até ele descobrir que o botão direito cancela.
- **A IA perde esse dinheiro de vez:** `aiPlace` tenta posicionar a cada segundo e nunca cancela.
- **Causas:**
  - `buildings.js:178` retorna antes de checar a Central quando `c.ready`.
  - `buildings.js:197` falha em silêncio.
- **Erro na interface de testes:** `testapi.js:161` devolve `null` ("deu certo") mesmo quando `placeConstruction` falha. Medido: `posicionar: null` e as usinas continuaram 3 → 3.

**7. Vazamentos pela névoa.**

- **O problema:** um prédio inimigo já visto continua sendo desenhado com o estado ao vivo. Isso inclui a barra de vida, a fumaça abaixo de 50% e o fogo abaixo de 25%, e a torre gira mirando. Quando o prédio é destruído fora da visão, ele some na hora do mapa e do minimapa.
- **Reprodução** (`t15_nevoa.js`):
  1. O batedor vê a Central inimiga e volta. Medido: `visivel: false`, `desenhada: true`.
  2. Baixe a vida dela para 20%.
  3. A barra vermelha aparece através da névoa (`t15-predio-lembrado-com-fogo-ao-vivo.png`).
  4. Destrua a Central. Medido: `someDoMapa: true`.
- **Causa:** `render.js:760` e `fog.js:110` desenham o objeto vivo. Não há uma "foto" do prédio no momento em que foi visto pela última vez.

**8. Unidade nova atravessa um muro de prédios.**

- **Reprodução** (`t18_porta.js`):
  1. Construa uma Fábrica em (13,12) e cerque-a com um anel completo de 16 Torres.
  2. Produza um Blindado. Medido: ele aparece em (14,16), **do lado de fora** do anel.
- **Captura:** `t18-porta-fechada.png`.
- **Causa:** `buildingExit` (`buildings.js:107-111`) usa `nearestWalkable` com raio 8 e não verifica se o tile de saída se liga à porta.

**9. Interface em telas baixas ou estreitas.**

As medidas vêm de `t11_telas.js`, e as capturas são `t11-*.png`.

- **640x400:** o botão JOGAR fica em y = 402..446, fora da tela (só Enter começa a partida). O rótulo "DIFICULDADE" sai cortado (`t11-titulo-640x400.png`).
- **Alturas abaixo de cerca de 440 px:** os botões Reparar e Vender não são desenhados (condição `y + 62 < camera.h` em `ui.js:262`), e Vender não tem atalho de teclado. Abaixo de cerca de 410 px o painel de informações some (`ui.js:245`).
- **800x600:** a faixa "Objetivo" no topo fica cortada no meio da frase ("…Ela gera energia", `t11-jogo-800x600.png`). O mesmo texto aparece inteiro no painel de baixo, então é só estético.
- **1024x500 e 1920x1080:** OK. A pausa a 1024x500 cabe por pouco: a última linha de dicas fica em y = 492 (`t11-pausa-1024x500.png`).

**10. Engasgo ao dar ordem para muitas unidades de uma vez.**

- **Medido:** `orderMove` com 45 unidades até o canto oposto leva 47 ms (t6). Com 250 unidades, um quadro de 192 ms (t13).
- **Causa:** um A* por unidade, que pode explorar até 7000 nós num mapa de 6400.
- **Impacto:** dentro do limite de 60 unidades, é um engasgo de 3 quadros no clique. Aceitável, mas daria para calcular um caminho por grupo.

---

## Observações sem gravidade (não pesaram na nota)

- **Ordens para fora do mapa ou para dentro de um bloco grande de penhasco são ignoradas em silêncio.** Isso acontece com `nearestWalkable` de raio 12 em `formationSlots`. Só ocorre pela API: o minimapa e o clique no mundo ficam sempre dentro do mapa.
- **Ponto de encontro fora do mapa:** as unidades param na porta da fábrica (t10). Só é possível pela API.
- **Partidas IA x IA sem vencedor:** 4 de 6 partidas de 20 min terminaram sem vencedor (t14), e uma de 25 min no mapa 1 difícil (t1). Isso é equilíbrio da IA, não um bug.
- **A IA acumula créditos sem gastar:** sem oposição, chegou a 119 mil créditos aos 60 min (t8), presa no limite de unidades.

---

## Os 5 mais graves

1. **Coletores param para sempre** quando o cristal restante fica a mais de 2500 nós de busca. Reproduzido naturalmente no mapa 1 aos 75 min: 5 de 5 coletores parados com 3528 de cristal alcançável no mapa.
2. **A pausa e a tela de fim deixam o painel clicável:** dá para construir, pôr na fila e vender com o jogo pausado ou já encerrado.
3. **Os alertas expiram em tempo real durante a pausa:** 0 mensagens depois de 8,5 s pausado.
4. **Sem `devicePixelRatio`:** a tela fica borrada em monitores retina.
5. **Telas baixas:** abaixo de cerca de 440 px somem os botões de Vender e Reparar; a 640x400 o botão JOGAR fica fora da tela. Em seguida vêm a refinaria furando o limite de unidades (63 de 60) e o prédio PRONTO preso sem Central.
