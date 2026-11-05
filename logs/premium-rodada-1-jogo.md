# Premium, rodada 1: revisão de jogo (legibilidade, interação, regressões)

Revisor independente. Tudo foi testado com Chromium + Playwright (SwiftShader, sem GPU). Não avaliei o fps do Premium.
Scripts de apoio ficam em /tmp/rv (t2: cliques, t3: caixa e batalha, t4: posicionamento, t5: determinismo, t6: troca de modos).

## Notas

| Item | Nota |
|---|---|
| (a) Legibilidade em jogo (Premium) | **5/10** |
| (b) Interação e clique (Premium) | **8/10** |
| (c) Troca de modos e robustez | **4/10** (há uma regressão grave no Leve, ver P1) |
| (d) Tela de título e interface | **6/10** |

### O que funciona
- **Clique em unidades no Premium:** 30 de 30 acertos. Testei 10 unidades, cada uma clicada no corpo, no pé e no topo do modelo.
- **Clique em prédios no Premium:** acerta no meio do telhado, no centro e na base. Só a faixa dos 20% de cima do telhado não responde (ver P8).
- **Caixa de seleção, clique direito e posicionamento:** a caixa seleciona; o clique direito no inimigo dá ordem de ataque (11 de 11 unidades). O clique de posicionamento recusa fora do planalto com a mensagem certa.
- **Simulação igual nos 3 modos:** o hash do estado é idêntico (114669156) após 120 s de IA contra IA, com quadros desenhados entre os passos.
- **Troca de modo:** F9 (na partida e na pausa) e o botão "Gráficos:" (no título e na pausa) trocam o modo. A escolha fica salva em localStorage e não aparece nenhum erro no console. Só aparece o aviso "GPU stall due to ReadPixels", uma vez só, no bake (terrain3d.js:792).
- **Testes:** `tests/fumaca.js` e `tests/partida.js` passam ("Tudo certo").

## Problemas, por prioridade

### P1 (grave, regressão): no modo Leve, em tela grande ou retina, a interface inteira some
- **Como reproduzir:**
  1. Abra `index.html?leve&jogar` numa janela com 1600x1000 (ou qualquer altura de pelo menos ~970 px, ou devicePixelRatio 2).
  2. Não aparecem o painel lateral, a barra superior, o minimapa nem o menu de pausa.
  3. O mesmo acontece ao trocar para Leve com F9 ou pelo botão da pausa: a tela fica sem interface e o jogador não consegue voltar pelo botão. Captura: /tmp/rv/leve-1600.png e /tmp/rv/pause.png.
- **Agravante:** no Clássico, a qualidade automática (`gfx.auto` só vale no Clássico) liga `gfx.low` quando o fps cai. Num PC lento em 1080p, a interface pode sumir no meio da partida.
- **Causa:**
  - O `#game` ganhou `z-index: 1` no index.html para ficar acima do canvas WebGL (`z-index: 0`).
  - O `uiCanvas` do modo Leve (main.js, `resize`) é criado com `position:absolute` e **sem z-index**, então fica embaixo do `#game`, que é opaco.
- **Correção:** dar `z-index:2` ao `uiCanvas` no `cssText`.
- **Teste que falta:** incluir um caso no fumaca.js com `?leve` em 1600x1000, conferindo os pixels do painel lateral. O teste atual força o Clássico em 1280x720 e não pega isso.

### P2: no Premium, não dá para distinguir planalto (onde se constrói) de chão comum
- **Como reproduzir:** compare /tmp/rv/cmp1.png (em cima o Premium, embaixo o Clássico, mesma área).
- **O que acontece:**
  - No Clássico, o planalto é pedra cinza com borda escura, e o chão é verde.
  - No Premium, o chão comum vira areia amarela pontilhada e o planalto vira areia amarronzada: mesmo matiz, pouco contraste e borda difusa.
  - Na base inicial o planalto é marrom; em outros pontos do mapa é areia clara. Não há uma identidade única.
  - O jogador só descobre onde pode construir pela grade verde do modo de posicionamento.
- **Correção:**
  - Dar ao PLATEAU um material próprio e constante (pedra/laje mais fria e cinza-azulada, com um degrau ou rebordo visível de 1 a 2 px de altura).
  - Puxar o chão comum para o verde/oliva, como no Clássico.
  - Ou desenhar uma linha de contorno sutil na borda do planalto.

### P3: as cores dos times estão fracas; o inimigo é rosa-acinzentado, não vermelho, e os prédios quase não têm cor de time
- **Como reproduzir:** `?premium&jogar&semnevoa`, câmera na base inimiga (/tmp/rv/enemy-p.png), ou o combate do tools/battle.js (/tmp/rv/crop2.png).
- **O que acontece:**
  - Os tanques inimigos saem malva/salmão e se confundem com a areia e com os cristais.
  - Os prédios dos dois lados são cinza-chumbo idênticos, com só um filete de cor. A base inimiga não "lê" como inimiga à primeira vista.
  - No Clássico, prédios e unidades têm moldura e tinta fortes do time.
- **Correção:**
  - Saturar e clarear a cor do time nos materiais (vermelho puro e não rosado; o azul também pode subir).
  - Aplicar a cor do time em áreas maiores dos prédios (faixas no telhado, painéis, bandeira).
  - Opcional: um anel/decal de time sob cada unidade, como as sombras de contato que já existem.

### P4: a infantaria é quase invisível e não dá para distinguir Soldado de Foguete
- **Como reproduzir:** combate do battle.js no Premium, zoom 1,4 (/tmp/rv/crop2.png).
- **O que acontece:**
  - Soldados e foguetes são manchas de 5 a 6 px, iguais entre si.
  - O soldado inimigo isolado (embaixo, no centro) é um ponto rosa: só a barra de vida denuncia que ele existe.
  - Com o desfoque do software (ver P7), fica pior.
- **Correção:**
  - Aumentar a escala da infantaria em ~1,3x no Premium.
  - Dar silhueta própria ao Foguete (tubo no ombro bem marcado, cor de destaque).
  - Desenhar sempre o decal de time sob a infantaria.

### P5: o texto do objetivo fala em "planalto cinza", mas no Premium o planalto não é cinza
- **Como reproduzir:** comece uma partida no Premium e chegue ao passo do posicionamento. O painel Objetivo diz "Clique no botão PRONTO e depois num lugar verde do planalto **cinza**" (/tmp/rv/place-premium.png).
- **Correção:**
  - Trocar para "planalto de pedra", ou mudar o texto conforme o modo.
  - Ou resolver junto com o P2, deixando o planalto cinza também no Premium.

### P6: na tela de título do Premium, a ajuda e o subtítulo ficam ilegíveis
- **Como reproduzir:** abra `index.html` (Premium é o padrão) em 1280x720. Captura: logs/capturas/premium-r1/01-titulo.png.
- **O que acontece:**
  - O fundo 3D é muito claro (areia, sol) e o véu escuro é mais fraco que o do Clássico (/tmp/rv/title-0.png).
  - As 5 linhas de atalhos e o "Colha cristal..." somem sobre a areia.
  - O rótulo "ESCOLHA SUA FACÇÃO" também perde contraste.
- **Correção:**
  - Escurecer mais o fundo do título no Premium (véu de ~0,55 a 0,65, ou vinheta mais forte no centro).
  - Ou pôr um painel escuro translúcido atrás do bloco de opções e da ajuda.

### P7: no Premium em software, a imagem toda fica borrada
- **O que acontece:** a resolução dinâmica desce até 0,6 (log do shot.js: `scale: 0.6`) e o resultado é um borrão generalizado. O texto 2D continua nítido, mas os modelos ficam "embaçados", o que agrava os P3 e P4.
- **Robustez:** o Premium é o padrão mesmo quando `premium.tier === 'software'`, e não há volta automática para o Clássico.
- **Correção:**
  - Com tier software (ou com a escala presa em 0,5 por mais de ~10 s), sugerir ou fazer a troca para o Clássico, com aviso "Gráficos: Clássico (sem placa de vídeo)".
  - Ou não escolher o Premium como padrão nesse caso.

### P8: a faixa de cima dos prédios altos não responde ao clique
- **Como reproduzir:** no Premium, clique ~3 px abaixo do topo projetado de prédios altos (QG, usina, quartel, fábrica). Nada é selecionado (t2.js: 7 de 8 prédios falharam nesse ponto; o meio do telhado funciona).
- **Causa:** `buildingAt` usa `PREMIUM_K * BUILDING_HEIGHT * 0.8`.
- **Ressalva:** pelas capturas, parte disso é chaminé ou antena acima do telhado, então é um problema menor.
- **Correção:** usar o fator 1,0 (ou a altura real do modelo) e aceitar 2 a 3 px de folga.

### P9: o F9 não aparece na ajuda
- **O que acontece:**
  - A ajuda do título e a da pausa não mencionam o F9.
  - O comentário em main.js (`cycleGraphicsMode`) ainda fala em "tecla G".
- **Correção:** acrescentar "F9: gráficos" na linha de atalhos e corrigir o comentário.

### P10: sobre o fantasma de posicionamento no Premium
- **O que funciona:** a grade verde/vermelha no chão é clara e acompanha o mouse.
- **O que falha:**
  - O holograma do prédio sai pálido e "lavado" sobre a areia (/tmp/rv/crop3.png). Quando a posição é inválida, ele vira um borrão salmão difícil de ler como "proibido".
  - A barra de vida e o retângulo de seleção dos prédios ficam na área do chão, enquanto o telhado está mais acima. É aceitável, mas desalinhado.
- **Correção:**
  - Dar ao holograma um contorno (rim/fresnel) mais forte e mais opacidade.
  - Usar vermelho saturado quando a posição é inválida.
  - Subir o retângulo de seleção até o topo do modelo.

## Veredito
O Premium é jogável e o clique funciona, mas hoje ele lê pior que o Clássico: o planalto não se separa do chão, o vermelho virou rosa e a infantaria some. Além disso, a mudança de z-index quebrou o modo Leve em telas grandes (a interface some), e isso precisa ser corrigido antes de qualquer outra coisa.
