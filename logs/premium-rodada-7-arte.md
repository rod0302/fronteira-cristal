# Fronteira Cristal: modo Premium, rodada 7. Crítica de direção de arte

Revisor: diretor de arte independente. Material: capturas `logs/capturas/premium-r7/01..09`, comparadas lado a lado com `premium-r6/` e com o relatório e as correções da rodada 6. Fiz capturas próprias com `?premium&escalagl=1&jogar&semnevoa` e o mouse no centro (script `/home/claude/tools/arte7.js`), salvas em `logs/capturas/premium-r7/arte-proprias/`:

| Arquivo | Conteúdo |
|---|---|
| `unidades-z3.png` + `unidades-crop2x.png` | 6 classes × 2 times, recorte ampliado 2x |
| `base-z3.png` + `base-crop2x.png` + `base-crop3x-torre.png` | base azul; QG, Quartel, Usina, Refinaria e Fábrica; Torre e esquadrões |
| `lago-z25.png` + `agua-crop2x.png` | lago e cânion; recorte 2x da água |
| `agua-batalha-crop2x.png`, `batalha-crop3x-r7.png` / `-r6.png` | água e combate, r7 contra r6 com o mesmo enquadramento |
| `canion-crop3x.png` | topo do platô: árvores, pedras, curvas de nível |
| `cristais-crop3x.png` / `cristais-r6-crop3x.png` | campo de cristal, r7 contra r6 |

Observação: `zoomar(3)` fica limitado ao mesmo enquadramento de cerca de 1,8. Por isso os detalhes foram vistos com ampliação via PIL.

## Notas

| Área | Nota r7 | r6 | Δ |
|---|---|---|---|
| (a) Terreno | **6,5/10** | 6,5 | = |
| (b) Modelos de unidades | **7/10** | 6,5 | +0,5 |
| (c) Prédios | **7/10** | 7 | = |
| (d) Iluminação e cor | **7/10** | 7 | = |
| (e) Impacto geral "AAA" | **6,5/10** | 6,5 | = |

Foi uma rodada de consertos pontuais e corretos, mas pequenos. A leitura geral da tela, a 1 m do monitor, é quase idêntica à da r6.

## O que melhorou de verdade
- **Infantaria legível** (`base-crop3x-torre`, `batalha-crop3x-r7`). Agora há ombro cáqui mais largo que o capacete, fuzil comprido projetado para a frente e antena de rádio. O Foguete tem o tubo grosso no ombro. Deixou de ser "trevo de três esferas", e Soldado e Foguete já se distinguem sem seleção. É o maior ganho da rodada.
- **As estrias da água sumiram.** A "cortina" vertical da r6 acabou. Em `04-batalha`, com a câmera mais alta, aparece um gradiente do raso, mais claro na margem, para o fundo, e o reflexo do sol continua bonito.
- **A Torre perdeu o quadrado escuro.** Agora assenta numa base circular e se integra ao chão (compare `03` r6 e r7, embaixo à direita).
- **Cristais com mais variação.** Paleta por aglomerado, tamanhos variados e veio claro interno. De perto, cada aglomerado é mais rico.
- **Casco.** Escureceu um pouco: o vermelho deixou de parecer rosado e os painéis da cor do time pontuam melhor sobre o cinza.

## O que continua (ou piorou)
1. **A água ficou certa, mas sem graça** (`agua-crop2x`, `lago-z25`).
   - Trocou-se um defeito por uma superfície fosca, opaca e uniforme: (64,105,105) no centro e (71,99,97) na margem, praticamente o mesmo valor.
   - Parece tinta de piscina ou gelatina. Não há especular fora do ponto do sol, não há reflexo das paredes do cânion, não há cáustica nem espuma.
   - A margem ainda é o mesmo contorno ciano fino de 1 a 2 px.
   - Perto da margem sul aparecem anéis concêntricos de "curva de nível" (banding da profundidade quantizada).
   - Na vista baixa do lago (05), o gradiente de profundidade some.
2. **Explosão** (`07-explosao-sequencia`).
   - Frame 1: ainda um blob amarelo-limão saturado de cerca de 100 px, sem núcleo nem estrutura.
   - Frame 3: um disco laranja chapado com contorno nítido, que parece decal de desenho e destoa da fumaça boa em volta.
   - A luz no chão continua imperceptível.
3. **O casco azul ainda é azul-acinzentado** (95,104,117). A massa de blindados em combate (`batalha-crop3x-r7`) continua um bloco periwinkle uniforme, sem valor escuro, sem desgaste de aresta e sem sombra de contato. O vermelho lê muito melhor.
4. **Platô e vegetação intocados** (`canion-crop3x`, idêntico à r6).
   - Árvores: pirulitos teal frios.
   - Pedras: blobs cinza-lilás facetados, pousados.
   - Pontos lilás espalhados.
   - Curvas de nível em degrau no topo plano.
   - Sombras de árvore descoladas: a sombra grande fica bem ao lado da copa, como se a árvore flutuasse.
   - Foram 4 dos 8 itens da r6 sem resposta.
5. **Cristais "leitosos".** O bloom subiu e o campo inteiro ganha um véu branco-ciano que lava o chão e as unidades por cima (`unidades-crop2x`): o vermelho sobre o cristal fica rosa. Nos campos grandes (02, 06), o cristal virou a coisa mais clara da tela, e mais clara que a seleção e os FX.
6. **Props quase invisíveis.** O poste e a pilha de contêineres prometidos ficam dentro da laje e, na escala de jogo, viram 2 ou 3 pixels. A base ainda é uma grade de caixas sobre areia limpa, sem cerca, sem catenária e sem nada entre os prédios. A borda da laje continua cinza-violeta.
7. **Gradação global sem mudança.** Luminância p5/p50/p95 = 57/134/172 (r6: 51/134/174). Não há sombra de nuvem, split-tone nem vinheta. Os médios continuam achatados.
8. **Grão de terreno pixelado.** Nas encostas do cânion, a malha tem degraus de "voxel" visíveis (`canion-crop3x`, à direita). Isso denuncia a resolução da heightmap.

## Correções priorizadas (máx. 8)

1. **Água com profundidade, reflexo e margem** (shader da água em `terrain3d.js`/`fx3d.js`).
   - Profundidade contínua, sem quantização: amostrar a altura do terreno com filtro bilinear. A cor deve variar de verdade: `mix(#4fc3b5, #0b2a3d, smoothstep(0.0, 4.0, depth))`. Hoje a variação é menor que 10 níveis.
   - Reflexo de céu/cânion por Fresnel `0.02 + 0.98*pow(1-NdotV,5)`, somando um "falso SSR": cor média do terreno vizinho deslocada pela normal (`texture(terrainColor, uv + N.xz*0.02)`), escurecida a 60%.
   - Especular GGX com rugosidade de 0,08 em todo o lago, e não só no ponto do sol: microbrilhos na normal de 3 oitavas.
   - Espuma: `smoothstep(0.5, 0.0, depth) * step(0.55, fbm(uv*10 + t*0.2))`, em branco a 75%, no lugar do contorno ciano.
   - Faixa molhada: −25% de albedo na pedra até 0,4 u acima da linha d'água.
2. **Explosão: matar o decal laranja e dar estrutura ao clarão** (`fx3d.js`).
   - Frame 1: núcleo branco-quente pequeno (raio 0,3), com halo `#ffb347` que cai com `exp(-r*4)`. Saturação máxima de 0,75 para tirar o amarelo-limão.
   - Frames 2 e 3: as bolhas de fogo usam alfa por `fbm(p*4 + t)`, com borda erodida (`smoothstep(0.3, 0.6, n - age)`) e nunca disco sólido. A cor segue a rampa `#fff2c0 → #ff9a3c → #b23a0e → #2a2420` em função de `age + n*0.3`.
   - Luz pontual (raio de 3 tiles e intensidade 2,5, com decaimento de 0,3 s) aplicada também no terreno. Hoje não se vê.
3. **Casco: valor, desgaste e contato** (`models.js`/`shaders.js`).
   - Cor do time só nos painéis (cerca de 25% da área), com o casco em `#3f4140`.
   - Escurecimento de cavidade por cor de vértice (−20% nas faces inferiores e internas) e realce de aresta (+15%) nos chanfros.
   - Blob de sombra de contato elíptico (alpha 0,5, 1,2× a pegada) sob cada veículo e esquadrão.
   - Meta: casco azul abaixo de (80,82,88).
4. **Platô e vegetação** (`terrain3d.js`, `props3d.js`).
   - Folhagem em oliva quente (`#6f7a3a` a `#8a8f4a`) com ±10% de matiz por instância e tronco visível em 50% das árvores. Misturar arbustos baixos e touceiras secas.
   - Pedras: deslocamento de vértice por ruído (15%), estrato `fract(y*3)` no albedo, enterradas 30% no chão, com anel de AO. Cor puxada para ocre/cinza quente, removendo o `b > r` que gera o lilás.
   - Estratos do cânion multiplicados por `pow(1 - N.y, 2)`, para que o topo plano fique liso.
   - Corrigir a direção ou o deslocamento da sombra das árvores: a sombra deve tocar a base do tronco.
5. **Domar o bloom do cristal** (`premium.js`, pós).
   - Bloom com limiar mais alto (luminância > 0,85) e intensidade −35% só para o material cristal.
   - Glow do chão sob o campo (o "véu") em no máximo 15% de alfa, com falloff de 1 tile em vez de cobrir o campo inteiro.
   - Unidades em cima do cristal não recebem o glow aditivo, ou recebem com `depthTest`: o bloom não pode lavar a cor do time.
6. **Props entre prédios, legíveis na escala de jogo** (`props3d.js`).
   - Gerar fora das lajes, por seed, ao longo das trilhas:
     - postes com catenária (6 segmentos) entre Usina e prédios;
     - pilhas de 2 a 4 contêineres de 1,5 × 0,6 u na cor de time dessaturada;
     - cerca baixa em 30% do perímetro da base;
     - barris em grupos de 3.
   - Borda da laje em `#8a7a64` com faixa de poeira em gradiente de 1 u sobre a areia.
7. **Gradação e macrovariação** (pós em `premium.js`).
   - Sombras de nuvem: fbm em escala de 20 tiles, deriva de 0,5 u/s, −18% na luz do sol do terreno e das unidades.
   - Split-tone: sombras para `#3a4a6a` a 6% e luzes para `#ffe2b0` a 5%.
   - Contraste +8% em torno de 0,45.
   - Vinheta de 12%.
   - Meta: p5 abaixo de 45 e p95 acima de 185 em `05-paisagem`.
8. **Suavizar a malha das encostas** (`terrain3d.js`).
   - Normais por diferença central sobre a heightmap filtrada (bicúbica ou Catmull-Rom) e não por célula, para eliminar os degraus de "voxel" nas paredes do cânion.
   - Se for barato, subdividir 2× apenas os quads com `|∇h|` alto.

## Veredito
A rodada 7 consertou com competência o que estava quebrado (estrias da água, infantaria ilegível, quadrado da Torre), mas não acrescentou beleza: a água agora é uma placa fosca, a explosão continua decal, o platô e a gradação estão intocados, e o jogo segue "indie bonito e polido" (6,5/10), sem nenhum elemento ainda que faça alguém dizer "AAA".
