# Modernização, rodada 2: correções

Notas da rodada: gráficos 7, som 7, desempenho e regressão 7 (iguais às da rodada 1).
Pela regra do ciclo ("se uma rodada não melhora nenhuma nota, parar e explicar"), não houve rodada 3.
As correções abaixo foram feitas e testadas por mim, mas nenhum crítico as avaliou.

## Gráficos
- Modo leve não borra mais a interface: o mapa fica em resolução menor, mas o painel, os textos e as telas
  ficam numa camada por cima em resolução cheia (transparente aos cliques).
- Nada vaza sob a névoa: as faíscas da Fábrica inimiga lembrada não aparecem, e marcas de queimado e
  escombros só aparecem depois que o jogador vê o lugar.
- Infantaria 23% maior, com capacete na cor do time.
- Barras de vida só nas unidades selecionadas, logo depois de levar dano (2,5 s) ou com vida baixa:
  numa batalha grande não formam mais uma grade.
- Prédios com cantoneiras na cor do time nos quatro cantos e banho de cor um pouco mais forte.
- No máximo 4 avisos na tela (3 em telas até 760 px de altura, 2 abaixo de 560 px).

## Som
- Cada tipo de aviso de ataque (base, coletor, unidades) tem a sua espera: um ataque a unidades fora da tela
  não cala mais o aviso de "Base sob ataque".
- A voz do aviso entra 1,5 s depois da sirene, sem uma cobrir a outra.
- Tilintar de créditos curto e discreto, no máximo um a cada 1,4 s.
- Música menos grave: pad uma oitava acima, baixo mais baixo, arpejo mais alto; em batalha o pad fica mais
  presente e brilhante e a percussão mais forte.
- Com a música desligada (N), o reverb da música também cala.
- "Construção concluída" no máximo uma vez a cada 25 s.

## Desempenho
- Modo leve automático: tenta voltar à qualidade cheia depois de 10 s com folga; se ficar lento de novo em
  menos de 15 s, fica no leve até o fim da partida (sem ficar trocando).
- Quadros lentos de verdade (até 1 s) agora contam para ligar o modo leve; antes, quadros acima de 200 ms eram
  ignorados e uma máquina muito lenta nunca ligava a proteção.
- Medido em Chromium sem GPU com 120 unidades em combate: 1920x1080 ~60 fps, 2560x1440 ~50 a 55 fps.

## Conferido
- tests/fumaca.js e tests/partida.js passam; cliques, caixa, zoom, posicionamento e minimapa em 1280x720,
  2560x1440 (também com ?leve) e 1024x500; estado da simulação idêntico à versão aprovada.
