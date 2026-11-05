# Modernização, rodada 1: correções

Notas da rodada: gráficos 7, som 7, desempenho e regressão 7.

## Gráficos
- Prédios danificados: rachaduras, fuligem e buracos abaixo de 50% de vida; fumaça escura abaixo de 50% e fogo abaixo de 25%.
- Cristal sem cara de grade: 4 aglomerados por tile em posições soltas (passam da borda), quantidade conforme o que resta, e uma mancha contínua de solo cristalizado por baixo.
- Destroços redesenhados (queimado suave, pedaços angulosos, vigas).
- Névoa em alta resolução (8 px por tile, borrada), sem escada.
- Clarão das explosões limitado quando há muitas ao mesmo tempo.
- Infantaria maior, com contorno escuro; o soldado de foguete tem tubo grosso, ogiva laranja e mochila.
- Botões bloqueados mais legíveis; "PRONTO" toma o lugar do preço; avisos somem nas telas de vitória e derrota.
- Prédios com um leve tom da cor do time em toda a superfície.
- Partículas de cristal ao descarregar na Refinaria.
- Bordas de planalto e penhasco com duas escalas de deformação (menos retas).
- Grão de detalhe em 2x sobre o terreno quando ele estaria ampliado (zoom alto ou tela retina).
- Telas baixas mostram no máximo 2 ou 3 avisos.

## Som
- Sirene de ataque refeita: onda quadrada na faixa de 1 a 3 kHz, 3 ciclos, volume cheio; efeitos e música abaixam
  enquanto a sirene e o locutor falam (barramento próprio para avisos).
- Demonstração do título muda para o locutor e sem sinos/baques de construção.
- Avisos sem voz em português: usam a versão em inglês com a voz inglesa do navegador; sem voz nenhuma, a voz
  robótica agora fala também "Base under attack", "Harvester under attack", "Low power", "Victory" e "Defeat".
- Voz robótica: fonte suavizada, formantes 1/0,8/0,6, passa-baixa em 5,5 kHz, "s" mais nítido, "d" final fraco,
  quedas entre sílabas, Q agendado por fonema, volume menor.
- Foguete, tilintar de cristal e clique mais altos; o som hidráulico do Coletor toca antes da voz.
- Música: três progressões com timbres diferentes que se alternam, baixo, chimbal em escaramuças, tensão que
  cai mais devagar e sobe também com tiros. No fim da partida a música abaixa e a fanfarra fica mais forte.
- Volume cai de forma contínua fora da tela (até 420 px), sem degrau na borda.

## Desempenho
- Cristais "assados" numa cópia do terreno (refeita só no tile colhido) em zoom normal; ao vivo só com zoom alto.
- Terreno pintado num Worker (prévia em 1/4 de resolução enquanto isso); os outros mapas são pintados em segundo
  plano e ficam guardados: abrir o jogo leva ~0,3 s e trocar de mapa é imediato.
- Modo leve automático liga abaixo de ~52 fps (antes 45) e, em tela grande ou retina, desenha o canvas em 1 px
  por px lógico (o navegador amplia). Em 2560x1440 com 120 unidades: de ~33 para ~58 fps no Chromium sem GPU.
- Tremor de tela para durante a pausa.
- Zoom mínimo nunca mostra mais que a largura do mapa (sem faixa preta em telas largas).

## Conferido
- Estado da simulação idêntico à versão aprovada (4 sementes/mapas de 15 min).
- tests/fumaca.js e tests/partida.js passam; cliques, caixa, zoom e minimapa conferidos em 4 resoluções.
