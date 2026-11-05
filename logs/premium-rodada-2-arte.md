# Fronteira Cristal: modo Premium, rodada 2. Crítica de direção de arte

Revisor: diretor de arte independente. Usei as capturas `logs/capturas/premium-r2/01..08` e duas extras com `escalagl=1`:
- `/tmp/ad/u2.png` e o recorte ampliado `/tmp/ad/u2c.png`: as 6 classes de unidade dos dois times lado a lado, ao lado do QG vermelho.
- `/tmp/ad/e.png`: o QG inimigo isolado.

Também usei o recorte ampliado `/tmp/ad/bc.png`, que é a base azul de 03 ampliada.

## Notas

| Área | Nota | Δ vs r1 |
|---|---|---|
| (a) Terreno | **6/10** | +1 |
| (b) Modelos de unidades | **5/10** | +1 |
| (c) Prédios | **5/10** | = |
| (d) Iluminação e cor | **6/10** | = |
| (e) Impacto geral "AAA" | **5/10** | +1 |

Resumo: a identidade de time foi resolvida. O azul `#1f5fff` e o vermelho `#e3121b` agora se leem de longe (u2c, e.png), e esse era o maior defeito da r1. O lago ganhou espuma de borda, a névoa virou nuvem volumétrica (06), muito melhor que o halo laranja, e o cânion estratificado continua sendo o melhor momento visual.

Ainda não é AAA nem "apaixonante":
- As unidades são miniaturas de 15 a 30 px, com sombras maiores que elas.
- Os prédios são placas cinza com tampa azul chapada.
- 60% da tela continua sendo bege pontilhado vazio.
- A explosão estoura num disco branco tipo flare de câmera.

Hoje parece um "diorama de brinquedo bem iluminado", não uma cena de jogo de estúdio.

## Correções priorizadas

1. **As unidades são pequenas demais e estão dominadas pelas sombras.**
   - **Onde:** u2c e 03 (canto inferior direito).
   - **O que está errado:** o soldado tem uns 8 px de largura e projeta uma sombra 3 a 4 vezes maior que ele. O tanque e o blindado são blocos com a mesma cor do casco à torre, e o Coletor parece uma caixa aberta com o interior rosa/azul claro.
   - **Como deveria ficar:** escala visual das unidades em 1,3 a 1,5x, mantendo a colisão.
   - **Contraste de material por camada:** casco em grafite `#2b2f36`, placas da cor do time em 35% da área (tampa da torre e saias laterais) e esteiras/rodas quase pretas com highlight de borda.
   - **Infantaria:** ombreiras e capacete do time, e uma arma visível de 1 px escuro.
   - **Sombra:** suba o sol (SUN_DIR com z de 0,6 para ~0,85) ou limite o comprimento da sombra das unidades pequenas. Hoje a sombra é a forma mais legível da infantaria, e isso está errado.
   - **Leitura:** um rim light frio fraco (fresnel × 0,25, `#9fc4ff`) para a silhueta descolar do chão bege.

2. **Os prédios são "placa cinza + tampa azul chapada".**
   - **Onde:** bc.png, e.png.
   - **O que está errado:** cada prédio fica sobre uma laje cinza-escura `#4a4c52` retangular, com borda dura e clara, bem maior que o volume. Ela lê como um tile de UI colado no chão. Os telhados são planos inteiros de azul (ou vermelho) saturado sem material, todos o mesmo azul.
   - **Fábrica e Quartel:** a Fábrica se resume a 3 tubos fluorescentes brancos (lê como luminária, não como fábrica), e o Quartel é um cubo azul.
   - **Como deveria ficar:** laje reduzida a uma faixa de 4 a 6 px com chanfro, mais um decal de terra pisada e manchas de óleo que se dissolve no terreno com ruído, sem borda reta.
   - **Telhados:** chapa metálica cinza com nervuras (linhas a cada 4 px), variação de rugosidade, manchas de chuva e ferrugem. A cor do time vira acento (faixas diagonais, beirais, logotipo, painéis de 25 a 35%) e não pintura total.
   - **Silhueta de cada tipo:** a Fábrica com claraboias serrilhadas (sheds em dente de serra), guindaste/pórtico e portão com luz amarela. O Quartel com telhado de duas águas, bandeira e sacos de areia. A Usina já funciona com as torres de resfriamento, e é o modelo de referência para os outros.

3. **A planície está vazia e tem o padrão de "pontinhos".**
   - **Onde:** 02, 03, e.png.
   - **O que está errado:** o pontilhado uniforme do bege e do cinza parece pegadas ou um carimbo de ruído. Não há macrovariação, props nem marcas de uso. As manchas de material têm bordas de bolha com um contorno claro (cinza/areia), como num cartoon.
   - **Como deveria ficar:**
     - Elimine o stipple ou reduza-o a 20% e substitua-o por cascalho com relevo (normal map procedural tipo Voronoi).
     - FBM de baixa frequência modulando o albedo em ±10%.
     - Height-blend nas transições, sem o contorno claro.
     - Props instanciados: pedras em 3 tamanhos, tufos secos, sucata e destroços, com densidade maior nas bordas de material e nos caminhos.
     - Trilhas escurecidas e compactadas entre as bases (decal procedural seguindo o pathfinding ou só o eixo base-base).

4. **A explosão é um flare branco estourado.**
   - **Onde:** 07, e 04 no centro.
   - **O que está errado:** um disco branco de ~120 px com raios finos, clipado pelo ACES, que parece o sol ou um flash de câmera e não fogo. Não há fumaça, nem chão queimado, nem onda de choque.
   - **Como deveria ficar:** núcleo `#ffd27a` → `#ff7a1a` → fumaça marrom `#5a4030` → cinza, em 0,6 s.
   - **Bloom:** threshold mais alto e clamp de luminância por partícula (≤ 4 em HDR) para não virar branco. Bloom de explosão tingido de laranja.
   - **Extras:** anel de choque de distorção/poeira no chão, decal de queimado que dura 20 a 30 s e debris escuros. O reflexo no lago deve ser laranja, não branco.

5. **O platô do cânion parece um mapa topográfico e a paleta não está unificada.**
   - **Onde:** 04, 05 e 07.
   - **O que está errado:** o topo do platô usa as mesmas faixas laranja saturadas `#E08A30` das paredes, e elas formam anéis concêntricos, que leem como curvas de nível e não como rocha. Isso compete com o capim mostarda/verde-ácido e com o bege pálido.
   - **Como deveria ficar:** os estratos só nas faces verticais (peso pela normal: `1 - n.z`). O topo do platô fica em rocha/terra mais escura e dessaturada `#8f6a48` com capim oliva `#6E7F3A`.
   - **Grading:** sombras levemente teal, médios quentes e saturação global −10%. Os cristais ciano devem ser o acento mais saturado da tela, e só eles.

6. **Os cristais são confete espalhado, sem hierarquia.**
   - **Onde:** 02, 06.
   - **O que está errado:** centenas de flocos ciano do mesmo tamanho, com "veias elétricas" brilhantes no chão. A ideia das veias é boa, mas está ruidosa demais e lê como interferência.
   - **Como deveria ficar:** clusters de 3 a 7 prismas com alturas variadas, 1 cristal gigante a cada ~15 clusters (foco de composição), glow de chão suave por cluster e veias só entre os clusters grandes, pulsando devagar. Os cristais esgotados (colhidos) devem ficar visivelmente menores e mais opacos.

7. **A água melhorou, mas continua chapada.**
   - **Onde:** 05, u.png.
   - **O que está errado:** o azul `#2a6f8f` é uniforme. A espuma é uma linha branca de largura constante, que parece um contorno. Não se vê o reflexo do paredão nem gradiente de profundidade junto ao penhasco.
   - **Como deveria ficar:** cor por profundidade (raso `#3fa7a0` a fundo `#0e3550`) e Fresnel com a cor do céu. Espuma com largura e opacidade moduladas por ruído animado, quebrando a linha. Reflexo barato do penhasco (espelhar a cor do terreno vizinho pela normal) e um brilho especular do sol permanente, não só durante a explosão.

8. **A vegetação e as pedras do platô são pirulitos e confete roxo.**
   - **Onde:** 05.
   - **O que está errado:** as árvores são bolas cinza-esverdeadas idênticas e as pedras estão roxas/lilás, uma cor que não existe na paleta.
   - **Como deveria ficar:** 2 ou 3 espécies (acácia de copa achatada combina com a savana), escala de 0,7 a 1,4x, matiz ±10°, copa com luz de sol quente e sombra azulada. As pedras na cor da rocha local, com AO de contato.

9. **Falta integração ao chão: oclusão de contato e marcas.**
   - **Onde:** u2c, 03.
   - **O que está errado:** as unidades e as lajes não têm escurecimento de contato. Os veículos parados não deixam rastro, e tudo parece pousado.
   - **Como deveria ficar:**
     - Blob AO elíptico sob cada unidade (escurece 35%, raio de 0,6 do footprint).
     - AO pré-calculado de 1 a 2 tiles em volta dos prédios.
     - Rastros de esteira que somem em 10 s (ring buffer de decals).
     - Pó levantado atrás dos veículos em movimento.

10. **Há detalhes de acabamento nos prédios e na névoa.**
    - **Prédios:** em bc.png há um glifo branco em forma de "1" num círculo, na frente-esquerda do QG. Lê como bug, então substitua-o por um poste/holofote com cone de luz no chão. As lâmpadas de janela amarelas estão boas, mas são iguais em todos os prédios: varie a temperatura (algumas frias `#bfe0ff`).
    - **Névoa (06):** as nuvens são boas, mas cinza-chumbo uniformes e muito borradas em comparação com o terreno nítido. Dê a elas iluminação do sol (topo quente, base fria), um leve movimento e uma borda de revelação um pouco mais definida (penumbra de ~1 tile).

## Veredito
A rodada 2 consertou a identidade de time e a névoa, e o cânion tem charme. Mas unidades minúsculas, prédios "tampa azul sobre placa cinza", a planície pontilhada vazia e a explosão em flare branco mantêm o modo Premium no nível de um protótipo estilizado bem iluminado: 5/10, ainda longe do AAA.
