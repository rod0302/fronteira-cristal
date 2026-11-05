# Premium, rodada 3: revisão de jogo (legibilidade, interação, regressões)

Revisor independente. Testei com Chromium + Playwright em SwiftShader (sem GPU), por isso não avaliei o fps do Premium.
- Capturas: `logs/capturas/premium-r3/jogo/`.
- Scripts: `logs/capturas/premium-r3/jogo/scripts/`. Eles gravam em `/tmp/r3/out`.
  - `hitviz.js`: mapa das áreas de clique.
  - `click.js`, `inter.js`, `box2.js`: clique, caixa e ordens.
  - `place.js`, `holo.js`: posicionamento.
  - `phantom.js`, `overlap.js`: clique fantasma.
  - `det.js`: determinismo.
  - `modes.js`, `sw.js`, `spam.js`: modos e troca de modo.
  - `boot.js`: abertura.
  - `mark*.js`: marcadores de ordem.
  - `pausebtn.js`: painel na pausa.

## Notas

| Item | Nota |
|---|---|
| (a) Legibilidade em jogo (Premium) | **7/10** (igual à rodada 2) |
| (b) Interação e clique (Premium) | **9/10** (era 8) |
| (c) Troca de modos e robustez | **9/10** (igual) |
| (d) Tela de título e interface | **7/10** (era 8: bug novo nos avisos durante a pausa) |

### O que foi verificado e funciona
- **Clique fantasma da rodada 2 corrigido** (`phantom.js`): o clique direito 24 px acima do QG inimigo agora dá ordem de mover (`target: null`).
- **Áreas de clique** (`hit-viz.png`): o mapa ponto a ponto acompanha bem a silhueta de todos os prédios e unidades.
- **Clique** em unidades no pé, meio e topo do modelo: todos acertam. Os 8 "erros" de `click.js` são cliques no topo das antenas, fora da nova faixa de 0,45·K·H, e por isso são esperados.
- **Caixa de seleção:**
  - Pegou 9 de 9 unidades e deixou o coletor de fora.
  - Uma caixa de ±9 px em volta do corpo visível pegou 11 de 11.
- **Ordens:** atacar deu 9/9 e mover deu 9/9. O cursor de mira aparece sobre o inimigo.
- **Posicionamento** (`place.js`):
  - Clique inválido em cima do QG é recusado e o prédio continua pronto.
  - Clique válido coloca o prédio em (5,5).
- **Pausa:** clicar num botão de construção na pausa não faz nada mais (era o P9).
- **Simulação igual:** hash -800151918 nos três modos (90 s de IA contra IA, com quadros desenhados).
- **Troca de modo:**
  - O botão "Gráficos:" no título e na pausa e o F9 em jogo fazem o ciclo completo, e o clique em unidade continua funcionando depois de cada troca.
  - 10 F9 seguidos no meio do posicionamento: sem erro, o modo de posicionar se mantém e o canvas GL some e volta direito.
  - Redimensionar para 900x600 e para 1600x1000 ajusta o GL.
- **Leve e Clássico** em 1600x1000 e com deviceScaleFactor 2: interface certa.
- **Console:** sem erros.
- **Testes:** `tests/fumaca.js` dá "Tudo certo" e `tests/partida.js` também ("Tudo certo").
- **Legibilidade:**
  - O Âmbar agora é dourado e se lê bem no planalto cinza.
  - A infantaria tem o capacete na cor do time, e o Foguete tem tubo próprio quando visto de perto (`crop-cry.png`).
  - A névoa (nuvem, memória e visível) está boa (`prem1600-dsf2.png`).

## Problemas, por prioridade

### P1: os avisos "Gráficos: X" ficam cortados e congelados na pausa
- **Como reproduzir:** jogue, aperte P e clique 3 vezes em "Gráficos:" (`sw.js`, `pause-2.png`).
- **O que acontece:**
  - Os avisos aparecem como "ráficos: Clássico", com a borda esquerda fora da tela, e ficam parados assim enquanto o jogo está pausado.
  - Eles se empilham, e ao voltar ao jogo os três somem de uma vez.
- **Causa:** `uiClock` não anda na pausa (main.js só soma em `playing`). O slide de entrada (`slide = (now - m.t)/180` em `drawMessageList`) fica preso em 0, com x = -22.
- **Correção:**
  - Fazer o relógio dos avisos andar também em `paused`, ou ignorar o slide quando a pausa estiver ativa.
  - Na pausa, mostrar o modo escolhido só no próprio botão e não criar o aviso.

### P2: o holograma de posicionamento continua sendo uma laje verde, sem a forma do prédio
- **Como reproduzir:** `holo.js`, zoom 2 (`holo-z2.png`).
- **O que acontece:**
  - Em lugar válido aparece uma caixa verde translúcida, com só um toco de chaminé. Não dá para ler o volume da Fábrica.
  - Em lugar inválido (`holo-z2-bad.png`), o holograma vermelho por cima dos quadrados verdes faz eles saírem **amarelos**. O jogador lê "aviso" onde o lugar está livre.
  - Os quadrados vermelhos são pintados sobre o telhado do QG e da usina, e não na base deles.
- **Correção:**
  - Desenhar o modelo real do prédio com fresnel e opacidade de ~0,5.
  - Desenhar os quadrados *depois* do holograma ou com profundidade, e usar só contorno nos quadrados ok.

### P3: o Âmbar ainda se confunde com a areia ocre, e os telhados grandes dos inimigos saem desbotados
- **Como reproduzir:** `?premium&jogar&semnevoa&inimigo=2` com a IA rodando 4 min (`crop-amb.png`, `roofs.png`).
- **O que acontece:**
  - Um blindado âmbar sobre a areia saiu RGB (147,150,52), oliva escuro, quase sem contraste com o chão.
  - Os telhados da Fábrica e da Refinaria âmbar ficam perto de (188,169,143), e a areia do planalto é (188,174,149). Só a base escura do prédio separa um do outro.
  - O vermelho dos telhados grandes saiu rosa-poeira, (173,130,128).
- **Correção:**
  - Decal ou anel de time emissivo sob unidades e prédios.
  - Mais saturação no material de time dos telhados grandes, que hoje parecem receber névoa/AO demais.
  - Contorno escuro nas unidades âmbar.

### P4: infantaria pequena no zoom 1 e escondida dentro do campo de cristais
- **Como reproduzir:** `crop-bat.png` (zoom 1, combate) e `crop-cry.png` (Foguete selecionado dentro dos cristais).
- **O que acontece:**
  - No zoom 1 os soldados têm ~10 px, e a fumaça e os clarões cobrem quase tudo.
  - No campo de cristal, as pontas ciano altas ficam na frente da unidade e do anel de seleção, que é branco-creme e some no ciano.
- **Correção:**
  - Tirar transparência ou baixar a altura dos cristais num raio pequeno em volta de unidades.
  - Ou desenhar a silhueta da unidade oclusa (x-ray).
  - Anel de seleção com contorno escuro.

### P5: os marcadores de ordem são finos e somem no terreno do Premium
- **Como reproduzir:** `mark5.js` (`mk5-both.png`; os marcadores foram congelados para comparar).
- **O que acontece:**
  - No Clássico o círculo verde/vermelho/ciano é bem visível.
  - No Premium o mesmo traço de 2 px some na textura da areia, e o marcador de colher (ciano) desaparece entre os cristais ciano.
  - Com GPU fraca (quadros longos), o marcador dura poucos quadros (vida de 0,7 s por dt).
- **Correção:**
  - No Premium, traço de 3 px com contorno escuro e um decal no chão (passe 3D).
  - Medir a vida do marcador em tempo real, e não em dt limitado.

### P6: o modo automático ainda monta todo o Premium em máquinas sem GPU, sem aviso (P7 e P8 da rodada 2, abertos)
- **Como reproduzir:** `boot.js`.
  - Sem parâmetro: primeiro quadro em 484 a 695 ms, com `premium.ok = true` e o modo final Clássico.
  - Com `?classico`: 399 a 449 ms.
- **O que acontece:** escolher Premium pelo botão em SwiftShader não mostra nenhum aviso de software (só existe `premium.tier`).
- **Correção:**
  - Sondar o tier com um contexto descartável.
  - Mostrar "Premium (sem placa de vídeo: pode ficar lento)".

### P7: a faixa de clique acima do QG ainda cobre ~13 px de chão vazio
- **Como reproduzir:** `hit-viz.png`, zoom 1,6.
- **O que acontece:** a área do QG começa ~20 px de tela acima do telhado, onde só há a antena fina do canto direito.
- **Observação:** é pequeno, mas um clique direito ali com tanques selecionados ainda ataca o QG inimigo, em vez de mover.
- **Correção:** altura de silhueta por tipo (HQ ≈ 0,2·H) em vez de 0,45·H fixo.

### P8: título e pausa com textos de baixo contraste
- **Como reproduzir:** `title-2.png`.
- **O que acontece:**
  - Sobre o fundo Premium (terreno claro desfocado), o subtítulo e as 5 linhas de ajuda são cinza fino sobre bege-claro, o pior contraste da tela.
  - O botão "Gráficos: Premium" não diz por que aquele modo foi escolhido.
  - `__jogo.botoes` ainda lista os botões do painel na pausa, embora o clique seja ignorado. É inofensivo, mas a lista engana testes.
- **Correção:**
  - Escurecer o fundo atrás do bloco (véu de 0,55) ou dar sombra ao texto.
  - Ajuda em `#c4ccd6`.
  - Rótulo "Clássico (sem GPU)" quando o modo veio do automático.

## Veredito
A interação no Premium agora é sólida: o clique fantasma morreu e a troca de modos está robusta. A legibilidade estacionou: o holograma ainda é uma laje, o Âmbar ainda some na areia, a infantaria some nos cristais e os marcadores de ordem são fracos. Na pausa apareceu um bug visual novo nos avisos.
