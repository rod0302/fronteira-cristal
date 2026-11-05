# Fronteira Cristal: modo Premium, rodada 6. Crítica de direção de arte

Revisor: diretor de arte independente. Material: capturas `logs/capturas/premium-r6/01..09`, comparadas com `premium-r5/` e com o relatório da rodada 5. Também fiz capturas próprias com `escalagl=1` e o mouse no centro da tela, salvas em `logs/capturas/premium-r6/arte-proprias/`:

| Arquivo | Conteúdo |
|---|---|
| `unidades-z3.png` + `unidades-crop2x.png` | 6 classes × 2 times, recorte ampliado 2x |
| `base-z3.png` + `base-crop2x.png` / `base-crop2x-b.png` | base azul completa; recortes do QG, Quartel, Usina, Refinaria, Fábrica e Torre |
| `batalha-propria.png` + `batalha-propria-crop2x.png` | 16×16 em combate, ao lado do lago |
| `batalha-crop3x.png` | recorte ampliado 3x de `04-batalha` |
| `canion-crop2x.png` | recorte ampliado 2x do platô e do cânion de `05-paisagem` |

Amostrei cores de pixel nas capturas próprias. A média 5×5 está entre parênteses.

## Notas

| Área | Nota r6 | r5 | Δ |
|---|---|---|---|
| (a) Terreno | **6,5/10** | 6,5 | = |
| (b) Modelos de unidades | **6,5/10** | 6 | +0,5 |
| (c) Prédios | **7/10** | 6,5 | +0,5 |
| (d) Iluminação e cor | **7/10** | 7 | = |
| (e) Impacto geral "AAA" | **6,5/10** | 6 | +0,5 |

## O que melhorou de verdade
- **As barras verticais de clarão sumiram.** Em nenhuma captura (04, 09, batalha própria) aparece coluna amarela atravessando a tela. Esse era o defeito nº 1 e foi resolvido. O clarão agora é um ponto quente na boca do cano.
- **Telhados.** Comparando 03 r5 com 03 r6:
  - as placas azuis chapadas do Quartel e da Fábrica viraram chapa metálica com filete;
  - a base deixou de parecer "LEGO azul", e a cor do time agora pontua em vez de gritar;
  - o filete emissivo na mureta sul do QG e da Refinaria é elegante.
  - É a melhor mudança da rodada.
- **Infantaria em esquadrão de 3.** Agora se lê como grupo e não como peão solitário.
- **Trilhas com sulco de roda entre os prédios** (`base-crop2x-b`). São sutis, mas dão vida e direção à base.
- **Areia.** Os grãos agrupados em manchas quebram a repetição do pontilhado. Em 02 e 03 a areia está mais crível.
- **Sombras.** Estão mais suaves e não ficam mais pretas. As sombras das árvores no cânion continuam fortes, mas já não são buracos.

## O que ainda separa de um 8 (e de "AAA")
1. **Água.** É hoje o elemento mais fraco da tela (05, 07, batalha própria).
   - A superfície é um padrão de estrias verticais repetidas, que parece cortina ou chuva escorrendo.
   - O azul-petróleo é uniforme do raso ao fundo: não há gradiente de profundidade nem cáustica.
   - Na margem há só uma linha ciano fina e contínua, como um contorno de vetor. Falta espuma e falta escurecimento por umidade na pedra.
   - O reflexo do sol em 04 é bom; o resto não acompanha.
2. **As unidades azuis continuam lavanda.**
   - O material `armor` é cinza neutro (`#5a5d5f`), mas o casco azul renderiza em (105,110,124) e o vermelho em (95,93,90).
   - O metal (0,35) reflete um ambiente/céu azul, e no azul isso se soma à cor do time. O resultado é um time inteiro "azul-acinzentado lavado", sem valor escuro.
   - Em `batalha-propria-crop2x`, o bolo de 10 blindados é uma massa periwinkle onde não se separa um tanque do outro.
   - O vermelho, por contraste, lê bem.
3. **A infantaria ainda é "três capacetes".**
   - Vista de cima, o esquadrão é um trevo de 3 esferas na cor do time.
   - Não se vê arma, ombro, mochila ou perna.
   - O Foguete e o Soldado são indistinguíveis sem a seleção.
4. **Explosões.**
   - O frame 1 (07) ainda é um disco branco estourado de ~120 px, com raios em estrela.
   - Em combate (04), a bola de fogo são 5 ou 6 esferas amarelo-laranja chapadas, com pouca variação de valor: lê como pipoca de desenho animado.
   - A fumaça dos frames 3 e 4 é boa.
   - Falta a luz da explosão iluminar o chão e as unidades vizinhas.
5. **Transições de terreno.**
   - A borda dos bolsões de capim tem halo laranja-dourado contínuo, com largura constante (`base-crop2x-b`, direita), que lembra recorte com contorno.
   - No cânion, as curvas de nível continuam parecendo mapa topográfico no topo plano do platô.
   - Ainda há pontinhos lilás espalhados pelo platô (`canion-crop2x`).
6. **Prédios ainda "pousados".**
   - A borda externa visível da laje é cinza-violeta (93,91,101), não o concreto quente pedido.
   - O avental da Fábrica é um retângulo marrom-escuro chapado.
   - A Torre fica sobre um quadrado escuro duro (03 e `base-z3`, embaixo à direita).
   - Não há nenhum prop entre os prédios: postes, contêineres, cercas, barris ou antenas. A base é uma grade de caixas sobre areia limpa.
7. **Vegetação e pedras.**
   - As árvores são "pirulitos" verde-azulados (teal), frios demais para a paleta quente do deserto.
   - As pedras grandes são blobs cinza facetados de low-poly, sem estratificação e sem integração com o chão.
8. **Gradação global.**
   - A imagem tem médios achatados: areia, laje e cascalho caem todos em 150 a 185 de luminância.
   - Falta contraste de valor e uma separação quente/frio clara entre luz e sombra.
   - Não há variação em macroescala, como sombras de nuvem ou manchas de umidade, que é o que faz um mapa RTS "AAA" parecer um lugar.

## Correções priorizadas (máx. 8)

1. **Reescrever a superfície da água** (`terrain3d.js`/`fx3d.js`, shader da água).
   - Cor por profundidade: `mix(#3fb6b0, #0d2f45, smoothstep(0, 6, depth))`, usando a altura do terreno sob a água.
   - Normal com 3 octavas de ruído gradiente em direções não alinhadas (rotações de 0°, 37° e 113°), no lugar das ondas que estão gerando estrias verticais.
   - Fresnel `pow(1-NdotV,5)` com céu quente no horizonte.
   - Espuma na margem: `smoothstep(0.6, 0, depth)*noise(uv*8 + t*0.3)` com recorte, branco a 70%, no lugar da linha ciano.
   - Cáustica animada no raso (voronoi `abs` de 2 camadas) até 1,5 u de profundidade.
   - Faixa molhada mais escura (−25% de albedo) na pedra até 0,4 u acima da linha d'água.
2. **Tirar o azul lavado do casco.**
   - Em `premium.js`/`shaders.js`, a reflexão de ambiente dos metais deve usar `mix(skyColor, groundColor_quente, 0.55)` e não o céu puro.
   - Baixar o `metal` de `armor`/`armorDark` para 0,15 e o `rough` para 0,45.
   - Escurecer o `armor` para `#4a4b4a`.
   - Desgaste de borda por curvatura falsa: no `MeshBuilder.box` com chanfro, pintar via cor de vértice as arestas +18% e mais claras.
   - Sombra de contato (blob elíptico com alpha 0,45) sob cada veículo.
   - Meta: casco azul abaixo de (90,90,95) na mesma luz do vermelho.
3. **Infantaria legível de cima.**
   - Escala de 1,6 por soldado e espaçamento triangular de 0,4 u.
   - Arma como caixa fina preta com o dobro do comprimento atual, projetada 0,5 u à frente do torso.
   - Ombros (caixa larga em cáqui `#6b6a4e`) mais largos que o capacete, para a silhueta deixar de ser esfera.
   - Mochila escura atrás.
   - O Foguete leva um tubo grosso (raio 0,18) ao longo do ombro, com boca laranja.
   - Capacete na cor do time só em 40% da área: aba escura.
4. **Explosão com valor e luz.**
   - Frame 1: limitar o clarão a ~0,6 da área atual, com brilho de pico ≤ 1,6 antes do tonemap, e sem os raios em estrela.
   - Bola de fogo: multiplicar a densidade por `fbm(p*3 + t)` e mapear o calor para a rampa `#fff2c0 → #ffb347 → #c2410c → #3a2a22`, com a borda fuliginosa já a partir de 35% da vida.
   - Luz pontual temporária (raio de 3 tiles, cor `#ffa040`, decaimento de 0,4 s) somada no shader de terreno e de unidades.
   - 6 a 10 detritos (caixas pequenas) em parábola com rastro de fumaça.
5. **Transições e cânion** (`terrain3d.js`).
   - Remover o halo de borda do capim. Usar a máscara `smoothstep(0.45, 0.55, mask + (fbm(p*0.8)-0.5)*0.35)` e, na borda, só −10% de valor (umidade), sem matiz dourado.
   - Estratos do cânion: multiplicar por `pow(1 - N.y, 2)`, para que o topo plano fique liso com terra e capim seco.
   - Encontrar e remover os pontinhos lilás do platô: provavelmente o tom de algum decal ou ruído de cascalho com `b > r`. Fazer clamp do matiz para o quente.
6. **Ancorar a base com props procedurais** (`props3d.js` + `models.js`).
   - Borda externa da laje em `concreteDark` quente `#8a7a64` (hoje sai cinza-violeta), com faixa de poeira em gradiente de 1 u sobre a areia.
   - Avental da Fábrica com faixas de concreto e junta de dilatação, no lugar do marrom chapado.
   - Trocar o quadrado escuro da Torre por um disco de laje chanfrada.
   - Espalhar por seed, ao longo das trilhas existentes:
     - postes com catenária (curva com 6 segmentos) entre a Usina e os prédios;
     - 2 a 4 contêineres (caixas com nervuras) por prédio;
     - cerca baixa em 30% do perímetro;
     - barris.
7. **Vegetação e pedras.**
   - Folhagem para oliva quente (`#6f7a3a` a `#8a8f4a`, ±10% de matiz) e tronco visível em 50% das árvores.
   - Variar a silhueta entre árvore, arbusto baixo e touceira seca.
   - Pedras: aplicar ruído de deslocamento no vértice (amplitude de 15%) e estrato horizontal `fract(y*3)` no albedo.
   - Enterrar as pedras 30% no chão, com anel de AO.
8. **Gradação e macrovariação** (pós em `premium.js`).
   - Tonemap ACES com contraste +8% e split-tone: sombras para `#3a4a6a` a 6% e luzes para `#ffe2b0` a 5%.
   - Vinheta de 12%.
   - Sombras de nuvem: ruído fbm de baixa frequência (escala de 20 tiles, deriva de 0,5 u/s, escurecimento de 18%) multiplicado na luz do sol do terreno e das unidades. É barato e dá muita "vida de lugar".

## Veredito
A rodada 6 limpou os erros que pareciam bug (clarões, telhados chapados) e deixou a base elegante, mas a água em estrias, os tanques azuis lavados, a infantaria de três capacetes e a falta de props e de gradação ainda mantêm o jogo em "indie bonito e polido" (6,5/10), longe de AAA.
