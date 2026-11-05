# Fronteira Cristal: modo Premium, rodada 4. Crítica de direção de arte

Revisor: diretor de arte independente. Usei as capturas `logs/capturas/premium-r4/01..08` e uma extra com `escalagl=1`:
- `/tmp/ad4/u.png`: as 6 classes de unidade dos dois times sobre o campo de cristal (`units6.js`).
- `/tmp/ad4/uc.png`: recorte ampliado 2x de `u.png`.
- `/tmp/ad4/bc.png`: recorte da base azul de 03.

## Notas

| Área | Nota | Δ vs r3 |
|---|---|---|
| (a) Terreno | **6,5/10** | +0,5 |
| (b) Modelos de unidades | **5,5/10** | +0,5 |
| (c) Prédios | **6,5/10** | +1 |
| (d) Iluminação e cor | **7/10** | +0,5 |
| (e) Impacto geral "AAA" | **6/10** | +0,5 |

### O que avançou
- **Prédios (bc.png).** É o maior salto da rodada.
  - O telhado tem nervuras.
  - A Fábrica ganhou claraboias com caixilho e um portão listrado preto e amarelo.
  - A Refinaria tem silos e um núcleo ciano emissivo.
  - O QG tem cúpula gomada e janelas acesas.
  - Já parecem "prédios de RTS" e não caixas.
- **Água.** Continua sendo o melhor material da tela: profundidade, borda clara na margem e reflexo quente da explosão (04, 07).
- **Explosão (07-sequência).** Agora tem progressão real: flash, fogo laranja, fumaça cinza volumosa e detritos. O frame 1 ainda estoura em branco demais.
- **Luz.** As sombras projetadas têm peso, a cena tem contraste e o sol quente funciona. A névoa volumétrica (06) segue linda.
- **Sucata e pedras na planície.** Quebram um pouco a monotonia.

### O que ainda separa de um 8
1. **Unidades ainda de brinquedo.**
   - A promessa era "casco grafite com cor do time como acento", mas na prática os tanques azuis continuam ~70% azul saturado vistos de cima (uc.png). O vermelho lê melhor.
   - As silhuetas são caixas chanfradas, sem saia lateral, sem detalhe de lagarta legível e sem cargas no deck.
   - A infantaria são cápsulas de ~10 px sem pose. Ao lado do cristal, que é maior, ninguém lê "soldado".
2. **Planície bege.** Nas telas de base (02, 03), 50% da área é areia lisa com "pegadas" pontilhadas repetidas. Não há rastro de lagarta, trilha entre prédios, variação de albedo em escala média nem microssombra.
3. **Platô/cânion (05).**
   - As curvas de nível laranja-sobre-laranja parecem topografia de mapa, não rocha.
   - As árvores são esferas idênticas, todas com a mesma sombra.
   - As pedras puxam para lilás.
4. **Capim.** As manchas verde-limão chapadas (02, 04, u.png) têm saturação e estilo diferentes do resto, como se fossem cel-shading colado sobre um terreno PBR.
5. **Desfoque de borda (tilt-shift).** Em 04 e 05 ele borra os cantos a ponto de parecer bug de foco. Em RTS o jogador olha a tela inteira.
6. **Prédios sem ancoragem.** Lajes cinza retangulares de borda dura direto na areia, sem rampa, poeira acumulada, AO de contato, cabos, cercas ou postes entre prédios. A base não "mora" no terreno.
7. **Clarões de cano em u.png.** Aparecem como barras brancas verticais longas, que leem como bug, não como tiro.

## Correções priorizadas (máx. 8)

1. **Unidades: material e silhueta (maior ganho).**
   - Casco e lagartas em `#2a2e35`/`#3a3f47`, com roughness 0.55 e metal 0.6. A cor do time fica em no máximo 25% da área visível de cima: faixa no topo da torre, duas listras no glacis e insígnia. O azul do time escurece para `#2f5fd0`.
   - Saias laterais como caixas finas com 3 segmentos e leve inclinação.
   - Lagartas com textura procedural de sapatas (bandas escuras/claras a cada 0,08 u em UV, deslocadas pela velocidade).
   - Cargas no deck: 2 caixotes, galão, antena com bola, escotilha com comandante (esfera + cilindro).
   - Rim light de 1 px na cor do time: fresnel `pow(1-NdotV,3)*0.35*teamColor`, somado no shader de unidade para separar do chão.
2. **Infantaria legível.**
   - Escala visual 1,8x da atual.
   - Corpo em 3 peças: capacete esférico na cor do time, torso cáqui `#6b6a4e` e arma preta saindo 0,6 corpo à frente.
   - Agrupar em esquadrão de 3 bonecos por unidade, com offsets fixos.
   - Sombra limitada a 1,2x a pegada do corpo.
3. **Planície com história.**
   - Decalques de rastros de lagarta: par de faixas escuras com alpha 0.25 deixadas pelos veículos e esmaecidas em 60 s.
   - Trilhas batidas entre prédios e entre a refinaria e os campos de cristal: máscara SDF de segmentos, albedo `-12%` e menos granulação.
   - Ruído de albedo em 3 oitavas (escalas de 40, 8 e 1,5 tiles) com amplitude de ±8% de luminância.
   - Substituir o pontilhado de "pegadas" por cascalho com normal map procedural (voronoi).
4. **Capim integrado.**
   - Dessaturar para `#8a9a4a`/`#6f7f3c`.
   - Borda com dithering por ruído e fade em 1,5 tile.
   - Tufos 3D instanciados (3 quads cruzados, cor da base mais escura para mais clara, balanço por vento `sin(t+pos.x*0.3)*0.05`) com densidade proporcional à máscara.
   - Remover o shading em escadinha: filtrar a máscara com bicúbica ou suavizar com `smoothstep` em vez de `step`.
5. **Rocha do platô e vegetação.**
   - Trocar as curvas de nível por estratificação: `fract(height*6 + noise*0.3)`, modulando albedo entre `#a5643a` e `#c98a55` só nas faces verticais (peso `1-N.y`).
   - Topo plano com terra e capim seco.
   - Pedras em cinza quente `#7d736a`, nunca lilás.
   - Árvores: copas de 3 a 5 esferas deformadas por ruído, escala aleatória de 0,7 a 1,3, matiz ±10% e tronco visível em parte delas.
6. **Prédios ancorados.**
   - Laje com chanfro de 45° e altura de 0,15 u.
   - Faixa de AO de contato: textura radial escura com alpha 0.35, 0,4 tile para fora.
   - Poeira acumulada na base das paredes (gradiente de albedo areia nos 15% inferiores).
   - Props de conexão: postes com cabos (catenária em linha fina) entre usina e prédios, cerca baixa e contêineres empilhados.
   - Cor do time em painéis verticais e bandeiras, não em placas de telhado grandes e chapadas.
7. **Desfoque e pós-processamento.**
   - Reduzir o tilt-shift a no máximo 30% do valor atual e aplicá-lo só no topo da tela (horizonte), nunca nas laterais nem embaixo.
   - Adicionar sharpen leve (CAS 0.3) depois do bloom.
   - Limitar o bloom do flash da explosão no frame 1: clamp de HDR em 4.0 antes do bloom e núcleo laranja `#ffb347` em vez de branco.
8. **Clarão de cano e traçantes.**
   - Comprimento máximo de 0,6 u e duração de 2 frames.
   - Cor `#ffd27a` com gradiente para transparente.
   - Orientar sempre no plano XZ da arma: nunca billboard vertical na tela, que é o que gera as barras brancas verticais vistas em u.png.

## Veredito
Os prédios e a água já parecem de jogo comercial, mas unidades de brinquedo, planície vazia e capim com cara de outro estilo ainda puxam o conjunto para "indie bonito" (6/10), não AAA.
