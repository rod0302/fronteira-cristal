# Premium, rodada 2: revisão de jogo (legibilidade, interação, regressões)

Revisor independente. Testei com Chromium + Playwright em SwiftShader (sem GPU), por isso não avaliei o fps do Premium.
- Capturas desta revisão: `logs/capturas/premium-r2/jogo/`.
- Scripts: `logs/capturas/premium-r2/jogo/scripts/`.
  - `click.js`: cliques em unidades e prédios.
  - `inter.js`: caixa, ataque e movimento.
  - `place.js`: posicionamento.
  - `modes.js`: Leve e Clássico em tela grande e com dsf 2.
  - `sw.js`: troca de modo.
  - `det.js`: determinismo.
  - `phantom.js`: área de clique fantasma.
  - `boot.js`: custo do modo automático na abertura.

## Notas

| Item | Nota |
|---|---|
| (a) Legibilidade em jogo (Premium) | **7/10** (era 5) |
| (b) Interação e clique (Premium) | **8/10** |
| (c) Troca de modos e robustez | **9/10** (era 4) |
| (d) Tela de título e interface | **8/10** (era 6) |

### O que foi verificado e funciona
- **Clique (Premium):** 61 de 62 acertos. Testei 9 unidades (pé, meio e topo do modelo) e 8 prédios (topo, telhado, centro e base). O único "erro" é o clique em cima do QG selecionar a usina atrás dele. Ali está, de fato, o telhado da usina, então o comportamento está certo e o erro foi do meu teste.
- **Ordens:**
  - Caixa de seleção: pegou as 9 unidades de combate e deixou o coletor de fora.
  - Clique direito no inimigo: 9 de 9 unidades receberam a ordem de atacar.
  - Clique direito no chão: as 9 unidades andaram.
- **Posicionamento:**
  - Clique em lugar inválido (sobre o QG) é recusado e a construção continua pronta.
  - Clique em lugar válido coloca a Fábrica em (5,5).
- **Simulação igual nos 3 modos:** hash -800151918 nos três, após 90 s de IA contra IA com quadros desenhados entre os passos.
- **Troca de modo:**
  - O botão "Gráficos:" (no título e na pausa) e o F9 (em jogo) passam por Premium → Clássico → Leve → Premium.
  - O WebGL é escondido e reaparece direito, e o modo fica salvo em localStorage.
  - Depois de cada troca, o clique em unidade continua funcionando.
  - Redimensionar a janela para 1600x1000 no Premium ajusta o canvas GL (1325 px de largura = 1060 × 1,25).
- **Leve e Clássico em 1600x1000 e com deviceScaleFactor 2:** a interface, o painel, o minimapa e a pausa aparecem certos. A regressão P1 da rodada 1 foi corrigida.
- **Console:** sem erros. Só aparece o aviso "GPU stall due to ReadPixels" (3 vezes, no bake do terreno).
- **Testes:** `tests/fumaca.js` passa ("Tudo certo", com casos novos de Premium e de Leve em tela grande) e `tests/partida.js` também passa.
- **Legibilidade que melhorou de verdade:**
  - O planalto cinza agora se separa bem do chão ocre/oliva.
  - O vermelho do inimigo virou vermelho (era rosa), nas unidades e nos telhados.
  - Os cristais ciano saltam do chão.
  - A névoa ficou boa: o nunca visto vira nuvem, e o já visto fica azul-acinzentado escuro, distinto do visível.
  - Os anéis de seleção e as barras de vida estão nítidos (`selected_c.png`).

## Problemas, por prioridade

### P1: área de clique fantasma acima dos prédios (dá ordem de ataque ou seleciona clicando em chão vazio)
- **Como reproduzir:** rode `scripts/phantom.js`.
  1. Selecione um tanque.
  2. Com zoom 1,6, ponha o mouse ~24 px do mundo acima da borda de cima do QG inimigo. Ali é areia vazia.
  3. O cursor vira a mira de ataque, e o clique direito dá `target: 'hq'` em vez de mover (`phantom_c.png`).
- **O que acontece:** o clique esquerdo no mesmo ponto também selecionaria o prédio.
- **Causa:** `buildingAt` (input.js) estende a área de clique em `PREMIUM_K * BUILDING_HEIGHT * 1.05` (~37 px no QG). Mas o modelo do QG quase não passa da sua área no chão: a caixa principal vai de y=-36 a z=20, então o topo fica só ~2 px acima. Os valores de `BUILDING_HEIGHT` incluem antenas e chaminés, e não a silhueta.
- **Correção:**
  - Usar uma altura de silhueta por tipo, só onde o modelo realmente sobe (torres da usina, antena do radar).
  - Ou calcular, no build do modelo, o máximo de `y - K·z` dos vértices e guardar como `HIT_TOP[type]`.
  - Para o QG, ~4 px bastam.

### P2: a facção Âmbar (como inimigo ou aliado) some no chão ocre
- **Como reproduzir:** `?premium&jogar&semnevoa&inimigo=2`, IA rodando 4 min e câmera na base inimiga (`s-amber.png`, `amb_c.png`).
- **O que acontece:**
  - Tanques e batedores âmbar saem marrom-caramelo, com o mesmo valor e o mesmo matiz da areia ocre e das encostas laranja.
  - Os telhados âmbar parecem terracota, e não dá para ler "inimigo" de longe.
  - O vermelho e o azul já resolveram, mas o âmbar não.
- **Correção:**
  - Subir a luminância e a saturação do âmbar (amarelo-ouro `#ffc21a`) no material das unidades.
  - Pôr um decal ou anel de time sob cada unidade com cor pura e emissiva (independente da luz do sol).
  - Opcional: um contorno (rim) escuro nas unidades âmbar.

### P3: o holograma de posicionamento ainda sai lavado
- **Como reproduzir:** `scripts/place.js` (Fábrica pronta, clicar no botão e passar o mouse no planalto); veja `place_z.png`.
- **O que acontece:**
  - Em lugar válido, só aparecem os quadrados verdes e uma tampa verde-pálida quase invisível. O jogador não vê a forma nem a altura do prédio.
  - Em lugar inválido, os quadrados vermelhos são pintados *em cima* do telhado do QG, em coordenadas de chão. Ficam deslocados da silhueta e confundem sobre o que está bloqueando.
- **Correção:**
  - Holograma com mais opacidade (~0,45) e borda fresnel forte.
  - Pulsar suavemente.
  - Desenhar os quadrados inválidos com contorno espesso e sem preenchimento sobre modelos (ou desenhá-los no passe 3D, com profundidade).

### P4: a infantaria continua difícil de ler no zoom 1, e não dá para distinguir Soldado de Foguete
- **Como reproduzir:** `s-batalha-z1.png` / `bz_c.png` (zoom 1, combate em 30,30).
- **O que acontece:**
  - Os soldados medem ~8 a 10 px e o tubo do Foguete não forma silhueta própria.
  - Com o clarão dos tiros e a fumaça, os soldados quase desaparecem.
  - Melhorou com os +35% e o capacete colorido, mas no zoom padrão ainda é o elo fraco.
- **Correção:**
  - Dar ao Foguete um tubo claro bem marcado (ou um acento laranja).
  - Desenhar o decal de time sob a infantaria.
  - Considerar mais ~15% de escala só no zoom ≤ 1.

### P5: em combate, o bloom das explosões apaga as unidades
- **Como reproduzir:** `logs/capturas/premium-r2/04-batalha.png`. A explosão no centro estoura para branco num raio de ~60 px e esconde tanques, barras e projéteis por alguns quadros.
- **Correção:**
  - Limitar a intensidade do bloom das explosões (clamp do HDR antes do bloom).
  - Ou reduzir a área do clarão quando há unidades por perto.
  - A legibilidade da batalha deve ganhar do espetáculo.

### P6: as barras de vida dos prédios flutuam acima do telhado
- **O que acontece:**
  - A barra usa `K·min(34, H·0,75)` (premium.js, `premiumOverlay`). No QG fica ~24 px acima do topo real do modelo; na usina, ~17 px.
  - Com vários prédios juntos, a barra parece pertencer ao prédio de trás (veja a usina recém-colocada atrás do QG no teste de sobreposição).
- **Correção:** usar a mesma altura de silhueta do P1, com a barra 4 a 6 px acima dela.

### P7: o modo automático cria todo o Premium mesmo quando escolhe o Clássico
- **Como reproduzir:** `scripts/boot.js`.
  - Sem parâmetro: primeiro quadro em ~500 a 580 ms, com `premium.ok = true` e o canvas GL escondido.
  - Com `?classico`: ~400 ms.
- **O que acontece:**
  - Para descobrir o tier, `initPremium` compila todos os shaders, monta todos os modelos e cria texturas.
  - Isso acontece justamente nas máquinas sem GPU, e o contexto WebGL fica vivo, ocupando memória, a partida inteira.
- **Correção:** detectar o tier com um contexto WebGL2 descartável (só `WEBGL_debug_renderer_info`) e só chamar o `initPremium` completo se o modo final for Premium.

### P8: o Premium escolhido numa máquina sem GPU fica salvo sem nenhum aviso
- **Como reproduzir:**
  1. Numa máquina sem GPU (o padrão aqui é o Clássico), aperte o botão Gráficos até o Premium.
  2. O localStorage passa a guardar "premium", e toda abertura futura vai direto ao Premium em software, sem nenhum aviso.
- **Correção:**
  - Ao trocar para o Premium com `tier === 'software'`, mostrar "Gráficos: Premium (sem placa de vídeo: pode ficar lento)".
  - Se a escala ficar no piso por mais de ~15 s, sugerir voltar ao Clássico.

### P9: botões do painel lateral continuam clicáveis durante a pausa
- **Como reproduzir:** pause com Esc ou P e leia `__jogo.botoes`. A lista tem `build` e `unit` além de `resume`, `restart`, `menu` e `graphics` (`sw.js`).
- **O que acontece:** dá para enfileirar produção com o jogo pausado, e o painel aparece esmaecido mas aceita cliques.
- **Observação:** pode ser intencional. Se for, falta deixar isso claro na interface (o esmaecimento sugere que o painel está desligado).
- **Correção:** escolher um dos dois caminhos.
  - Se o painel deve aceitar cliques na pausa, não esmaecer.
  - Se não deve, filtrar `uiHits` na pausa.

### P10: detalhes da tela de título
- **Como reproduzir:** `t_title16.png` (1600x1000, dsf 2).
- **O que acontece:**
  - O bloco ocupa só os 70% de cima e deixa a parte de baixo vazia.
  - As 5 linhas de ajuda são cinza e pequenas sobre o fundo escuro. Leem, mas no limite.
  - O botão "Gráficos:" não diz por que aquele modo foi escolhido (por exemplo "Clássico (sem GPU)").
- **Correção:**
  - Centralizar o bloco na vertical.
  - Ajuda com ~1 px a mais e cor `#b8c0cc`.
  - Rótulo do botão com o motivo quando o modo veio do automático.

## Veredito
O Premium agora é jogável e legível nos dois times principais, e os modos 2D voltaram a funcionar. Os pontos fracos que sobram são a área de clique fantasma acima dos prédios, o Âmbar camuflado e o holograma de posicionamento apagado.
