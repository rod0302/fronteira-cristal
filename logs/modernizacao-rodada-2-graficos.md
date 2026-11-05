# Crítica de GRÁFICOS E IDENTIDADE VISUAL: Fronteira Cristal (mod-r2)

**Nota: 7,0 / 10**

A modernização deu certo: o jogo saiu de um visual de "ladrilhos chapados + fonte monoespaçada" para um visual coeso, com relevo, luz, sombras e uma interface limpa. Ainda não chega a 8 por três razões. O modo leve automático deixa a imagem borrada em telas retina ou 1080p. Os efeitos vazam informação sob a névoa. E a infantaria e os prédios têm pouca identidade e pouca legibilidade na escala normal de jogo.

Metodologia: bots em Playwright (Chromium headless), com `window.__jogo` para montar as situações e mouse e teclado reais para os botões, o posicionamento, a roda do mouse (zoom de 70% a 180% confirmado) e a pausa (P). Quase todas as capturas usam qualidade alta forçada (`gfx.auto=false`), porque o headless ligaria o modo leve sozinho. O modo leve foi comparado à parte com `?leve`. Scripts em `/home/claude/criticos/mod-r2/scripts-graficos/` e capturas em `/home/claude/criticos/mod-r2/capturas/graficos/` (prefixos `novo-`, `base-` = versão aprovada e `leve-`). Nenhum erro de console em nenhuma execução.

## Pontos fortes

- **Salto grande frente à versão anterior.** O terreno agora tem bordas orgânicas, degraus com sombra, penhascos com volume e grama com textura. Compare `base-02-inicio.png` com `novo-02-inicio.png` e `base-03-unidades-f0-vs-f1-z100.png` com `novo-03-unidades-f0-vs-f1-z100.png`.
- **Interface moderna e legível.** Fonte sem serifa, cartões arredondados e hierarquia clara. A escala automática em 1080p (1,25) funciona bem (`novo-21-jogo-1920x1080.png`).
- **Times bem distintos.** Contorno escuro e cor saturada em todas as unidades separam azul, vermelho e âmbar, inclusive sobre o cristal (`novo-24-crop.png`, `novo-03-unidades-f2-vs-f1-z180.png`).
- **Efeitos de guerra bons.** Clarão, anel de choque, fumaça escura persistente, rachaduras e fogo em prédios danificados (`novo-13-predios-danificados-z160.png`, `novo-14-destruicao-0.png`).
- **Animações de base claras.** O prédio surge com uma linha de varredura (`novo-07-surgindo-4-factory.png`) e o fantasma de posicionamento mostra a área permitida e cada tile verde ou vermelho (`novo-06-fantasma-*.png`).
- **Arte original.** Nada copia arte de um jogo existente. A estrutura (barra lateral à direita, minimapa, refinaria e coletor) é convenção do gênero. O cristal ciano e os prédios "de prancheta" não imitam nenhum título.

## Problemas (por gravidade)

### Atrapalha

1. **O modo leve automático borra a tela inteira, inclusive o texto, em 1080p e em retina.**
   - Com `gfx.low`, `resize()` desenha o canvas a 1 px por px lógico e o navegador amplia a imagem.
   - Medido: a nitidez da barra lateral (variância do laplaciano) cai de **1243 para 157**, 8 vezes menos, em 1280x720 com deviceScaleFactor 2.
   - Em 1920x1080 o canvas cai de 1920 para 1536 px de largura.
   - O modo liga sozinho com menos de 52 fps, então muitos jogadores com notebook verão o jogo assim.
   - Em 1x (sem retina) o modo leve quase não muda nada (`leve-09-batalha-pequena-1.png` comparado com `novo-09-batalha-pequena-1.png`).
   - Reproduzir: `node s8_resol.js`. Comparar `novo-21-crop-1080-alta.png` com `novo-21-crop-1080-leve.png` e `novo-21-jogo-1280x720-dpr2-z180.png` com `...-dpr2-leve-z180.png`.

2. **Efeitos vazam informação sob a névoa (área explorada mas fora da visão).**
   - **(a)** A fábrica inimiga "lembrada" mostra faíscas de solda quando está produzindo. `drawBuildingLive` testa `b.queue.length` sem checar visibilidade. Medido com `s10_vazamento.js`: fila vazia deu 0/20 quadros com faísca; produzindo deu **13/20 quadros** (141 px), com o prédio `visivel:false`. Capturas: `novo-25-vazamento-fabrica.png` e `novo-17-crop-faisca.png`.
   - **(b)** Um veículo inimigo que morre sob a névoa deixa marca de queimado no chão. `drawDecals` só checa `tileExplored`. Captura: `novo-17-nevoa-sob-3.png`, mancha escura em (560,200) que não existia em `novo-17-nevoa-base-inimiga-lembrada.png`.
   - **(c)** Pelo código, os escombros de prédios inimigos destruídos sob a névoa também aparecem, até de prédios nunca vistos. A torre lembrada gira com o ângulo atual (`b.turret`) e as luzes da usina e do radar mostram o estado de energia ao vivo.
   - Reproduzir: `node s6_nevoa.js` e `node s10_vazamento.js`.

3. **A infantaria é pequena demais e tem pouca cor de time.**
   - Com zoom de 100%, o soldado ocupa cerca de 10 a 12 px, e a cor do time fica só num círculo de uns 5 px. O lança-foguetes (tubo verde-oliva neutro) é maior que o próprio soldado.
   - Com 70%, ou numa batalha de 120 ou mais unidades, a infantaria quase desaparece entre os tanques e as barras de vida.
   - Evidência: `novo-03-crop-z100.png`, `novo-03-unidades-f0-vs-f1-z70.png`, `novo-10-batalha-grande-1.png` e `novo-10-batalha-grande-z70.png`.

4. **Poluição de barras de vida em batalha grande.**
   - Toda unidade danificada mostra uma barra fixa. Com 124 unidades, as barras formam uma "grade" verde e amarela por cima das unidades, que chega a esconder a infantaria.
   - Evidência: `novo-10-batalha-grande-z180.png` e `novo-10-batalha-grande-2.png`.

5. **Os prédios têm pouca identidade de facção e pouca variedade.**
   - Todos são caixas cinza-azuladas com uma faixa de cor de cerca de 3 px. A base inimiga só se distingue pela faixa vermelha, e de longe parece a sua.
   - Os desenhos são os mesmos da versão anterior, agora com gradiente e sombra. A Usina parece "dois alto-falantes".
   - Evidência: `novo-08-base-cheia-z160.png`, `novo-17-nevoa-base-inimiga-lembrada.png` e `base-08-base-cheia.png`.

6. **Notificações empilhadas cobrem o mapa.**
   - Até 5 faixas ("X pronto: clique no botão...") ficam vários segundos sobre o canto superior esquerdo da área de jogo, por cima de prédios.
   - Evidência: `novo-21-jogo-1920x1080.png`, `novo-21-jogo-1280x720-dpr2-z180.png` (cobre a Central) e `novo-22-minimapa-radar.png`.

### Detalhe

7. **Escombros com corte reto.**
   - As manchas de queimado de `rubbleSprite` têm raio de até 24 px, mas a margem do sprite é de 14 px. O resultado são bordas retas, horizontais e verticais, visíveis no chão.
   - Evidência: `novo-14-crop-escombros.png` (aresta vertical à esquerda e horizontal embaixo) e `novo-14-escombros.png`.

8. **Falta de energia quase não se vê no mapa.**
   - Só o radar para e o brilho da Central baixa um pouco. As luzes dos demais prédios seguem iguais.
   - Evidência: `novo-15-sem-energia.png` comparado com `novo-08-base-cheia.png`.

9. **A barra de progresso no botão de produção risca o ícone e apaga o preço.**
   - A linha ciano atravessa o ícone e o preço fica ciano sobre ciano.
   - Evidência: `novo-21-crop-botao-800.png`.

10. **A seleção com 6 tipos de unidade mostra só 5 ícones**, embora o texto diga "6 unidades". O defeito vem da versão anterior.
    - Evidência: `novo-04-andando-f0-vs-f1-z180.png`.

11. **O texto de ajuda do título é pequeno (cerca de 11 px) e cinza sobre fundo escuro**, com contraste baixo.
    - Evidência: `novo-01-titulo.png`.

12. **A borda borrada da névoa escurece unidades que estão visíveis** na beira da visão, porque o desfoque invade os tiles visíveis.
    - Evidência: o tanque azul à direita em `novo-24-crop.png`.

13. **O terreno é pintado em 1x e fica macio quando ampliado** (zoom de 180% em tela retina). O grão compensa só em parte.
    - Evidência: o penhasco no alto à direita em `novo-21-jogo-1280x720-dpr2-z180.png`.

14. **O Coletor cheio some no campo de cristal**, porque a caçamba é ciano como o cristal.
    - Evidência: `novo-24-crop.png` e `novo-11-coletor-colhendo-z180.png`.

15. **As explosões variam pouco de escala.**
    - Com 100% ficam discretas na batalha grande. Com 180%, vários clarões somados estouram em manchas brancas.
    - Evidência: `novo-10-batalha-grande-z180.png`, em torno de (560,515).

16. **O painel de vitória e de derrota tem cerca de 80 px vazios embaixo dos botões.**
    - Evidência: `novo-19-vitoria.png`.

## Sugestões concretas

- **`main.js` (`resize`)**: no modo leve, usar um meio-termo (`pixelRatio = Math.min(1.5, screenDpr*uiScale)`) em vez de 1. Também dá para desenhar a interface (`renderUI`) num canvas separado sempre em resolução cheia e baixar só o mundo.
- **`render.js` (`drawBuildingLive`)**: com `b.team !== 0 && !isVisibleToPlayer(b)`, desenhar o prédio "congelado", sem faíscas, sem brilho de energia e com a torre no ângulo guardado ao ser vista (`seenTurret`).
- **`render.js` (`drawDecals`)**: guardar em cada decal se ele nasceu visível (`d.seen`) e só desenhá-lo se foi visto ou se o tile está visível agora.
- **`render.js` (`rubbleSprite`)**: aumentar `pad` para 26 ou limitar `r` a `pad`.
- **`sprites.js` (`trooperBody`)**:
  - Infantaria cerca de 30% maior.
  - Ombros e capacete inteiros na cor do time.
  - Tubo do lança-foguetes na cor escura do time em vez de verde-oliva.
  - Um anel ou sombra colorida sutil por baixo quando o zoom for menor que 1.
- **Barras de vida**: mostrar só para unidades selecionadas, sob o mouse ou atingidas nos últimos 3 s, ou deixá-las finas e semitransparentes quando houver mais de 40 na tela.
- **Prédios**:
  - Telhado ou painéis grandes na cor do time, não só a faixa.
  - Uma silhueta própria por facção: Brasa mais angulosa, Âmbar com cúpulas.
  - Luzes apagadas e janelas escuras sem energia.
- **Notificações**: no máximo 2 visíveis, vida mais curta, e alinhadas no topo ao centro, longe da base.
- **Botões**: progresso como barra fina na base do botão, sem cruzar o ícone e o preço.
- **Coletor**: caçamba com carga em tom mais quente ou mais claro, ou uma borda escura na caçamba.
- **Ajuda do título**: 12 a 13 px e cor `#b8c0c8`.
