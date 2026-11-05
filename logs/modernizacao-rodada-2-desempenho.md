# Fronteira Cristal (mod-r2): crítica de desempenho, robustez e regressão de jogabilidade

**Nota: 7 / 10**

A jogabilidade aprovada continua intacta: a simulação é idêntica bit a bit, todos os controles funcionam com o zoom e com a escala da interface, e não há erros nem vazamentos. O problema é o custo do visual novo. Em telas grandes e em retina ele fica várias vezes mais caro que a versão aprovada. A defesa automática (modo leve) evita a queda de fps, mas para isso desenha em resolução **menor** que a da versão antiga e, na prática, não desliga mais. Se a máquina for lenta de verdade (quadros acima de 200 ms), essa defesa nem chega a ligar. Um jogador exigente com tela de 1080p, 1440p ou retina e sem GPU forte percebe a diferença.

> Condições: Chromium headless sem GPU (rasterização por software), 4 núcleos. As medições foram feitas uma de cada vez, sempre comparando com a versão aprovada nas mesmas condições. Os números absolutos dependem da máquina, mas a diferença entre as duas versões vem do código. Scripts em `scripts-desempenho/`, registros `*.log` na mesma pasta e capturas em `capturas/desempenho/`.

## Pontos fortes
- **Simulação sem regressão:** 93 de 93 fotos de `__jogo.estado()` são idênticas às da aprovada. Testei 3 mapas, 3 dificuldades, 2 sementes, IA x IA até 20 min, jogador parado até a derrota e cenários com ordens do jogador (mover, atacar-movendo, parar, construir, posicionar, descarregar, atacar prédio, produzir) (`regressao.js`, `regressao.log`). O diff do código confirma: ai, units, harvest, path, map, defs e config não mudaram. As mudanças em buildings e combat só disparam falas e sons.
- **Controles sem regressão:** 1040 de 1040 verificações com mouse e teclado reais (`controles.js`, `controles-nova.log`). Cobrem 5 telas (800x600, 1280x720, 1920x1080, 2560x1440, 1024x500), 4 zooms (70%, 100%, 140%, 180%) e modo leve ligado e desligado. Clique, Shift, caixa, duplo clique, botão direito para mover, atacar, colher e descarregar, A, S, Ctrl+1 com 1 e 1 1, H, Espaço, setas, rolagem pela borda (lateral e inferior), minimapa (clique e arrasto), roda do mouse ancorada no cursor (limites de 0,7 a 1,8), P, Esc e M. O fantasma cai no tile certo e o prédio é posto nesse tile em todas as combinações (exemplo: `fantasma-nova-2560x1440-z1.8-leve.png`). Com devicePixelRatio 1,5 e 2 os cliques acertam 5 de 5 (`dpr.js`).
- **Testes do projeto passam:** `tests/fumaca.js` (tudo certo, 59,5 fps com 82 unidades) e `tests/partida.js` (tudo certo).
- **Sem vazamentos:** numa partida de 32 min em tempo real, o fps ficou em 59,5 a 59,8 do começo ao fim, o heap entre 10 e 14 MB e o RSS entre 600 e 700 MB, estável (`longa-nova.log`). Partículas ficaram sempre abaixo de 900, marcas de esteira abaixo de 700 e decals abaixo de 80. Trinta trocas de mapa e dez partidas seguidas também não fizeram a memória crescer.
- **Robustez:** zero erros ou avisos de console em todos os scripts. Redimensionei 6 vezes no meio da batalha, mudei o DPR para 2, 1,5 e 1, pausei no meio das explosões (as partículas e o tempo congelam de fato), perdi, ganhei, reiniciei e voltei ao menu 4 rodadas mais 5 ciclos Enter, Esc e menu (`robustez.js`).
- **Trocar de mapa no título ficou mais rápido:** 73 a 99 ms, contra 124 a 220 ms na aprovada, porque os terrenos ficam guardados.

## Problemas (em ordem de gravidade)

Nenhum problema bloqueia.

### Atrapalha

**1. O modo leve automático liga em telas de 1080p ou maiores e em retina, e não volta mais. A imagem fica com resolução menor que a da versão aprovada.**
- Passos: abrir `index.html` em 1920x1080 sem nenhuma unidade extra (`traco-leve.js`). Em 3 de 3 repetições o modo leve já estava ligado **na tela de título** e continuava ligado depois de 60 s de partida parada. Em 1280x720 não ligou nenhuma vez.
- Efeito na resolução do canvas (`abertura.js`, `dpr.js`, `robustez.js`):

  | Tela | Aprovada | Nova (automático) |
  |---|---|---|
  | 1920x1080 | 1920 px | 1536 px |
  | 2560x1440 | 2560 px | 1463 px |
  | 1280x720 com DPR 2 | 2560 px | 1280 px |
  | 1920x1080 com DPR 2 | 3840 px | 1536 px |

  Nessa mesma máquina a versão aprovada roda a 60 fps na resolução cheia. Ou seja, quem tem tela grande ou retina recebe uma imagem menos nítida que a da versão antiga.
- Causa (main.js, `updateQuality`): basta a média passar de 19 ms por 2 s para ligar o modo leve. Para desligar são precisos 30 s seguidos com média abaixo de 17,2 ms (acima de 58 fps). Quadros isolados de 33 a 83 ms, que aparecem também na aprovada, zeram essa contagem, então na prática o modo leve não desliga mais.

**2. Em qualidade cheia, o visual novo custa de 4 a 10 vezes mais em telas grandes.** Medi com o modo leve automático desligado à força (`fps.js`, variante `nova-cheio`, `fps3.log` e `fps-dpr2.log`):

| Tela | Unidades | Aprovada | Nova cheia |
|---|---|---|---|
| 2560x1440 | 50 | 59,4 fps | 15,7 fps |
| 2560x1440 | 240 | 58,7 fps | 10,7 fps |
| 1920x1080 | 120 | 59,9 fps | 32,7 fps |
| 1920x1080 | 240 | 58,8 fps | 23,9 fps |
| 1920x1080 com DPR 2 | 50 | 36,6 fps | 6,3 fps |
| 1920x1080 com DPR 2 | 240 | 26,9 fps | 4,7 fps |

- No último caso o **jogo anda a 0,80x do tempo real**, porque o limite de 10 passos por quadro descarta tempo.
- O JavaScript de desenho mede só 3 a 6 ms por quadro. O resto é rasterização: tarefas longas de 90 a 220 ms.
- `custo-efeitos.js` mostra que nenhum efeito sozinho é o culpado. Em 2560x1440 tirar o grão do terreno ou a névoa sobe de 12,3 para 16,5 fps. Tirar todos os enfeites leva a 38 fps, ainda abaixo dos 59 da aprovada. O custo vem do conjunto: o terreno ampliado pela escala da interface (1,75x), a névoa suavizada e o grão em tela cheia.

**3. A proteção automática não liga justamente quando a máquina é muito lenta.** Em `updateQuality`, `if (... frameDt > 0.2) return;` descarta todo quadro com mais de 200 ms.
- Teste com a CPU 4x mais lenta via CDP, 80 blindados, 2560x1440 com DPR 2 (`auto-lento.js`). Na nova: 0,8 fps, mediana de 1417 ms por quadro, jogo a 0,13x, e o modo leve **nunca ligou** (canvas continua com 5120 px). Na aprovada, nas mesmas condições: 1,9 fps e jogo a 0,32x.
- Em 1920x1080 com DPR 2 e CPU 4x mais lenta: nova com 1,2 fps e jogo a 0,20x; aprovada com 3,3 fps e jogo a 0,54x.

**4. Com 240 unidades em combate, o fps cai mesmo no modo automático.**
- 1920x1080: 43 a 53 fps, contra 57,8 a 58,8 na aprovada. Quadros acima de 33 ms em 10 s: 7 a 25, contra 2 a 5.
- 2560x1440: 44 a 47 fps, contra 54 na aprovada.
- 1280x720 com áudio ligado: 52,6 fps (36,7 em qualidade cheia), contra 59,5 (`fps-audio.log`).
- Os piores quadros chegam a 100 a 117 ms em várias linhas da nova. Na aprovada costumam ficar em até 50 a 67 ms, com alguns picos isolados por ruído da máquina (`fps.log`, `fps2.log`).

### Detalhe

**5. Abrir o jogo ficou mais lento e engasga** (`abertura.js`, `autoleve.js`).
- Primeiro quadro: 496 a 552 ms, contra 277 a 311 ms.
- Tarefa longa na abertura: 267 a 283 ms, contra 116 a 136 ms.
- Terreno final pronto só em cerca de 1,5 s. Até lá aparece uma prévia borrada.
- Nos primeiros 2 s há quadros de 183 ms, e é esse engasgo que ajuda a ligar o modo leve do problema 1.

**6. Memória maior, mas estável.** Na sessão de trocas de mapa e partidas (`memoria.js`): RSS do navegador de 650 a 824 MB, contra 454 a 620 MB, e heap JS de 33 MB, contra 10 MB. Não há crescimento ao longo da sessão.

**7. A simulação ficou cerca de 20% mais cara com o som ligado:** 1,20 ms por passo, contra 1,00 ms, com 240 unidades (`fps-audio.log`). São as chamadas de som e fala dentro do passo. Não afeta o resultado da partida.

**8. Em zoom 70% a área de clique de uma unidade encolhe na tela,** porque a tolerância é de raio + 4 px **do mundo**. Os testes acertaram, mas um soldado a 70% fica com cerca de 7 px de raio clicável.

## Tabela de medições (nova x aprovada)

Mesmas condições, uma medição de cada vez. Nas linhas de fps o primeiro valor é a média e entre parênteses vêm os quadros acima de 33 ms em 10 s.

| Medição | Aprovada | Nova (automático) | Nova (qualidade cheia) |
|---|---|---|---|
| Estado igual (93 fotos) | referência | 93/93 iguais | n/a |
| Controles reais (verificações) | 120/120 | 1040/1040 | n/a |
| 1280x720, 50 unidades | 59,7 fps (2) | 59,9 fps (0) | 60,0 fps (0) |
| 1280x720, 120 unidades | 59,6 fps (1) | 59,9 fps (0) | 55,6 fps (8) |
| 1280x720, 240 unidades | 59,8 fps (0) | 56,1 fps (5) | 42,4 fps (18) |
| 1920x1080, 50 unidades | 59,9 fps | 59,7 fps (canvas 1536) | 44,4 fps |
| 1920x1080, 120 unidades | 59,9 fps | 59,5 fps (canvas 1536) | 32,7 fps |
| 1920x1080, 240 unidades | 58,8 fps (3) | 52,8 fps (7) | 23,9 fps (125) |
| 2560x1440, 50 unidades | 59,4 fps | 59,4 fps (canvas 1463) | 15,7 fps |
| 2560x1440, 120 unidades | 59,2 fps | 58,2 fps (canvas 1463) | 13,2 fps |
| 2560x1440, 240 unidades | 58,7 fps | 46,3 fps (18) | 10,7 fps |
| 1280x720 DPR 2, 240 unidades | 54,9 fps | 54,4 fps (canvas 1280) | 11,0 fps |
| 1920x1080 DPR 2, 50 unidades | 36,6 fps | 59,9 fps (canvas 1536) | 6,3 fps |
| 1920x1080 DPR 2, 240 unidades | 26,9 fps, jogo 1,00x | 48,0 fps | 4,7 fps, jogo 0,80x |
| CPU 4x mais lenta, 2560x1440 DPR 2 | 1,9 fps, jogo 0,32x | 0,8 fps, jogo 0,13x, modo leve não liga | n/a |
| JS de desenho por quadro, mediana (1080p, 240 unidades) | 1,8 a 2,0 ms | 2,6 ms | 3,6 ms |
| Simulação por passo, 240 unidades, com áudio | 1,00 ms | 1,20 ms | 1,16 ms |
| Abertura até o 1º quadro | 277 a 311 ms | 496 a 552 ms | n/a |
| Terreno final pronto | n/a | 1442 a 1536 ms | n/a |
| Trocar de mapa no título | 124 a 220 ms | 73 a 171 ms | n/a |
| Começar a partida (Enter) | 180 a 190 ms | 125 a 188 ms | n/a |
| Partida de 32 min em tempo real (1280x720) | n/a | 59,3 a 59,9 fps, heap de 10 a 14 MB, RSS de 600 a 705 MB, sem vazamento | n/a |
| Sessão longa: RSS / heap | 454 a 620 MB / 10 MB | 651 a 824 MB / 33 MB | n/a |
| Erros de console (todos os scripts) | 0 | 0 | 0 |
| tests/fumaca.js e tests/partida.js | passam | passam | n/a |

## O que eu corrigiria primeiro
1. O modo leve não deveria reduzir a resolução abaixo da que a versão aprovada usava. Melhor desligar primeiro os enfeites caros (grão, névoa suavizada, cristais ao vivo) e só depois reduzir a resolução.
2. A volta da qualidade precisa de histerese realista, por exemplo média abaixo de 18 ms por 10 s, tolerando picos isolados. O engasgo da abertura e da troca de mapa não deveria contar.
3. Contar também os quadros acima de 200 ms, limitados (por exemplo `Math.min(frameDt, 0.2)`), em vez de ignorá-los.
