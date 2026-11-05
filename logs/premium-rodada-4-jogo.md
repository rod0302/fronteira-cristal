# Premium, rodada 4: revisão de jogo (legibilidade, interação, regressões)

Sou revisor independente e não construí o jogo. Testei com Chromium + Playwright em SwiftShader, sem GPU, por isso não avaliei o fps do Premium.

Para ver o que vê um jogador com placa de vídeo (tier `gpu`, com sucata e mais enfeites), usei `hg.js`. Ele finge um renderizador de GPU no `getParameter`.

- **Scripts:** `/tmp/r4/*.js`, sendo `h.js` o modo SwiftShader e `hg.js` o tier gpu fingido.
- **Capturas:** `/tmp/r4/out/`.

## Notas

| Item | Nota |
|---|---|
| (a) Legibilidade em jogo (Premium) | **6/10** (era 7) |
| (b) Interação e clique (Premium) | **8/10** (era 9) |
| (c) Troca de modos e robustez | **9/10** (igual) |
| (d) Tela de título e interface | **7/10** (igual) |

### O que foi verificado e funciona
- **Simulação igual nos 3 modos.** `det.js` roda 90 s de IA contra IA com quadros desenhados. O hash deu -800151918 em Premium, Clássico e Leve, o mesmo da rodada 3. As mudanças visuais não tocaram a simulação.
- **Testes:** `tests/fumaca.js` deu "Tudo certo" e `tests/partida.js` também (rodados um de cada vez).
- **Console:** sem erros. Só aparecem os avisos de ReadPixels do SwiftShader.
- **Clique** (`click.js`):
  - Pé, meio e topo de todas as unidades acertam.
  - As 8 falhas são todas "topo+3" de prédios, fora da faixa de 0,45·H. É o mesmo comportamento esperado da rodada 3.
- **Caixa de seleção:** uma caixa justa (±9 px) no corpo visível pegou 11 de 11 (`box2.js`).
- **Clique nas bordas do casco** (`edge.js`, zoom 1,6):
  - Pontos na frente, na traseira e na lateral do casco 1,25×: 25 de 27 acertos.
  - Os 2 erros aconteceram com outro veículo encostado, e o clique pegou o vizinho (ver P2).
- **Clique fantasma** acima do QG inimigo: dá ordem de mover (`target: null`).
- **Posicionamento** (`place.js`):
  - Clique inválido é recusado e o prédio continua pronto.
  - Clique válido coloca o prédio em (5,5).
- **Troca de modos** (`sw.js`):
  - O botão no título e na pausa e o F9 fazem o ciclo completo. Depois de cada troca o clique em unidade funciona e o GL se ajusta ao redimensionar para 1600x1000.
  - **O P1 da rodada 3 foi corrigido:** na pausa não aparecem mais os avisos "ráficos: …" cortados.
- **Leve e Clássico** em 1600x1000 e com deviceScaleFactor 2 (`modes.js`): interface certa e nítida.
  - O Clássico em software cai sozinho para a qualidade baixa (`gfx.low`). É a qualidade automática, não um defeito.
- **Anel de time:** ajuda a identificar o dono, sobretudo o Âmbar (anel amarelo forte) e o Vermelho. É a primeira vez que um tanque âmbar na areia se lê sem esforço no zoom 1.
- **Enfeites da planície** (pedras, arbustos secos, sucata): não mexem no clique, porque são só malha e o `buildingAt`/`unitAtScreen` os ignora.

## Problemas, por prioridade

### P1: o anel de seleção ficou escondido debaixo dos veículos 25% maiores
- **Como reproduzir:**
  - `groupg.js premium 1`: 23 unidades selecionadas no zoom 1 (`crop-G-group.png`).
  - `read.js 2 1 a` (`crop-read-a.png`).
- **O que acontece:**
  - O anel verde é um decal no chão de raio `radius+5`, que dá 17 no tanque.
  - O casco do tanque agora tem meio-comprimento de ≈17 e o cano passa disso (`buildTank`: x de -13 a 14, × `UNIT_VIS_SCALE` 1,25). O anel fica coberto quase todo e sobram só pontas verde-claras nos lados.
  - No zoom 1 dá para saber quem está selecionado só pela barra de vida. Um tanque selecionado e com vida cheia mostra uma barra verde, igual à de um tanque ferido não selecionado.
  - Na areia clara, o anel verde em modo aditivo vira um verde-menta pálido. Ao lado do anel de time azul em aditivo (lilás-claro), as duas cores ficam muito parecidas na infantaria.
- **Correção:**
  - Raio do anel = raio visual (`radius*UNIT_VIS_SCALE*1.45`, ou o comprimento do casco).
  - Desenhar o anel de seleção também como contorno de tela por cima do modelo (ou com profundidade desligada na metade de baixo).
  - Usar mistura normal com borda escura, e não aditiva.
  - O anel de time pode ficar como está.

### P2: veículos 1,25× sem mudar a colisão fazem os grupos virarem uma massa só, e o clique pega o vizinho
- **Como reproduzir:**
  - `fog.js` (`crop-fog.png`): 4 blindados azuis em tiles vizinhos e 3 âmbar.
  - `groupg.js` depois de uma ordem de mover.
- **O que acontece:**
  - Com raio de colisão 12, as unidades param a ~24 px umas das outras, mas o casco visual mede ~34 px de comprimento.
  - Em fila ou coluna os cascos se atravessam: 4 tanques parecem um trem de 2 ou 3, e não dá para contar o grupo nem achar o ferido.
  - No Clássico (`crop-group-classico.png`) os mesmos grupos se separam bem.
  - No `edge.js`, clicar na frente visível do tanque que estava por cima selecionou o veículo de trás, porque `unitAtScreen` usa o "centro mais próximo" e não o que está na frente.
- **Correção:**
  - Escala 1,15 em veículos, ou separar os veículos no desenho, ou aumentar a distância de chegada em formação só no Premium. Esta última não serve, porque mudaria a simulação.
  - No clique, em empate de distância < raio, preferir a unidade com maior y (desenhada na frente).

### P3: o holograma de posicionamento continua uma laje verde, sem nenhuma mudança desde a rodada 3
- **Como reproduzir:** `holo.js` (`holo-z2.png`, `holo-z2-bad.png`).
- **O que acontece:**
  - Em lugar válido aparece uma caixa verde com um toco. Em lugar inválido, o verde por cima do vermelho fica amarelo.
  - Os quadrados vermelhos ainda saem no telhado do QG e não na base dele.
- **Correção:** a mesma da rodada 3.
  - Modelo real do prédio, com fresnel e opacidade 0,5.
  - Quadrados com profundidade, ou desenhados depois do holograma, e só contorno nos quadrados válidos.

### P4: o casco grafite apagou a cor do Âmbar (o Azul continua forte)
- **Como reproduzir:** `readg.js 2 1.6 a` (`readG-a-i2-z1.6.png`) e `crop-G-amb.png` (zoom 1, planalto cinza).
- **O que acontece:**
  - Os blindados e o coletor âmbar saem cinza-cáqui: o acento dourado é pequeno e escuro. Sem o anel amarelo, parecem sucata neutra.
  - O Azul tem as faixas grandes e muito saturadas e se lê de longe. A assimetria entre os times favorece o jogador azul.
  - A infantaria âmbar dentro do campo de cristal (`crop-fog.png`) é cáqui sobre ocre e ciano, e some.
- **Correção:**
  - Mais área de cor do time no teto da torre e no deck, com o mesmo brilho percebido para todas as facções.
  - Normalizar a luminância do `MAT.paint` por time (o âmbar está ~30% mais escuro que o azul depois da curva de contraste).

### P5: os marcadores de ordem continuam finos (sem mudança), e o ciano de colher some nos cristais
- **Como reproduzir:** `mark5.js` (`mk5-both.png`, com Premium em cima e Clássico embaixo).
- **O que acontece:** o marcador ciano de colher é quase invisível no Premium.
- **Correção:**
  - Traço de 3 px com contorno escuro, ou um decal 3D.
  - Vida do marcador medida em tempo real.

### P6: os enfeites da planície viraram "pimenta" no zoom 1
- **Como reproduzir:** `groupG-premium-z1.png` e `fog.png`, no tier gpu.
- **O que acontece:**
  - Arbustos secos, pedrinhas e sucata são centenas de manchinhas escuras de 2 a 5 px, espalhadas por igual em todo o chão.
  - No zoom 1 a infantaria tem ~8 a 10 px e a sombra dela tem o mesmo tom. O olho tem mais ruído para filtrar quando procura soldados inimigos.
  - Os enfeites são assados uma vez (`buildProps`) e não respeitam prédios construídos depois. Pedras e arbustos pequenos podem ficar por baixo da laje ou aparecer na borda do chão pisado.
- **Correção:**
  - Agrupar em menos manchas maiores e mais claras (pedras de cor da areia, não escuras).
  - Densidade ~50% menor no planalto de construção e perto das bases.
  - Esconder os enfeites dentro do retângulo dos prédios.

### P7: o automático ainda monta o Premium inteiro em máquinas sem GPU antes de escolher o Clássico (P6 da rodada 3 aberto)
- **Como reproduzir:** `boot.js`.
  - Sem parâmetro: primeiro quadro em 585 a 720 ms.
  - Com `?classico`: 425 a 464 ms.
- **O que acontece:**
  - Quando o modo vem do automático, o botão "Gráficos:" não explica a escolha.
  - Escolher Premium em software não dá nenhum aviso.
- **Correção:**
  - Sondar o tier com um contexto descartável.
  - Rótulo "Clássico (sem placa de vídeo)" e aviso ao entrar no Premium em software.

### P8: textos de ajuda do título com pouco contraste (P8 da rodada 3 aberto)
- **Como reproduzir:** `title-2.png`.
- **O que acontece:**
  - As 5 linhas de ajuda continuam cinza fino sobre o fundo desfocado do terreno claro.
  - `__jogo.botoes` na pausa ainda lista os botões de construção e de unidade, que não respondem.
- **Correção:**
  - Véu escuro de 0,55 atrás do bloco ou sombra no texto, e cor `#c4ccd6`.
  - Limpar `uiHits` do painel quando o jogo estiver pausado.

## Veredito
A simulação, os testes e a troca de modos estão sólidos, e o P1 da rodada 3 foi corrigido. Mas o aumento de 25% dos veículos sem ajustar o anel de seleção nem a ordem de clique piorou a leitura de grupos e de seleção. O grafite apagou o Âmbar, e o holograma e os marcadores seguem sem conserto.
