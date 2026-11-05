# Fronteira Cristal: modo Premium, rodada 5. Crítica de direção de arte

Revisor: diretor de arte independente. Usei as capturas `logs/capturas/premium-r5/01..09` e duas extras com `escalagl=1`:
- `/tmp/ad5/u.png`: as 6 classes de unidade, gerada com `units6.js`. O recorte ampliado 2x está em `/tmp/ad5/uc.png`.
- `/tmp/ad5/bc.png`: recorte ampliado da base azul de 03.

## Notas

| Área | Nota | Δ vs r4 |
|---|---|---|
| (a) Terreno | **6,5/10** | = |
| (b) Modelos de unidades | **6/10** | +0,5 |
| (c) Prédios | **6,5/10** | = |
| (d) Iluminação e cor | **7/10** | = |
| (e) Impacto geral "AAA" | **6/10** | = |

### O que avançou
- **Unidades: o casco grafite chegou.**
  - No time vermelho a leitura melhorou bastante: casco escuro, acentos vermelhos e luz de esteira.
  - O Coletor é o melhor modelo. Tem caçamba, cabine, faróis e volume convincente.
  - O Obuseiro tem cano longo e lê bem.
- **Cor do time nos prédios.** Está mais contida em faixas, mas ainda há placas chapadas: o telhado do Quartel e a faixa central da Fábrica.
- **Explosão (07-seq).** O frame 1 está mais laranja e menos estourado. A fumaça cinza dos frames 3 e 4 é volumosa e boa.
- **Água, névoa volumétrica e brilho dos cristais.** Continuam sendo os pontos de "wow" da tela. A névoa de 06 é nível comercial.

### O que ainda separa de um 8
1. **Clarão de cano em barras verticais (uc.png).** Continua sem correção: o batedor azul dispara colunas amarelas verticais que atravessam metade da tela. Isso lê como bug. É o problema mais visível de todos.
2. **Infantaria.**
   - Continua um boneco único de ~12 px: cápsula com capacete.
   - Ao lado de um cristal, que é maior, não lê como "soldado".
   - Não há esquadrão nem pose de arma.
3. **O azul continua dominante nas unidades azuis.** Batedor e Blindado azuis ainda têm ~50% da área de topo em azul saturado. O vermelho do inimigo é mais elegante.
4. **Prédios em lajes cinza de borda dura.**
   - Os prédios ficam sobre retângulos cinza enormes, sem chanfro, rampa, poeira ou AO de contato.
   - Entre os prédios só há areia lisa: nenhuma trilha, cabo, cerca, contêiner ou poste.
   - A luz ciano da Refinaria vaza em um quadrado duro sobre a laje (bc.png).
5. **Planície.**
   - O pontilhado de "pegadas" se repete igual em toda a areia (02, 03).
   - A borda entre areia clara e laranja tem um halo amarelo-limão em forma de pincelada, que lembra pintura de recorte.
   - O capim continua verde-limão chapado (04, 09).
6. **Cânion (05).**
   - As curvas de nível laranja continuam parecendo mapa topográfico.
   - As árvores são esferas iguais com sombras pretas enormes, mais escuras que qualquer outra sombra da cena.
   - As pedras puxam para lilás.
7. **Tilt-shift.** Ainda borra os cantos inferiores (09 embaixo à esquerda, e 04 e 05). Em RTS isso parece desfoque de bug.

## Correções priorizadas (máx. 8)

1. **Matar as barras verticais de clarão.**
   - Desenhar o clarão como quad deitado no plano XZ, orientado pelo yaw da arma, com comprimento ≤ 0,6 u e vida de 2 frames.
   - Cor `#ffd27a` com gradiente radial até alpha 0.
   - Se for um traçante, usar segmento curto (0,8 u) que viaja até o alvo, nunca billboard de tela.
   - Conferir em `fx3d.js` se algum sprite usa `up=(0,1,0)` de tela.
2. **Infantaria em esquadrão.**
   - Escala visual de 1,8x.
   - 3 bonecos por unidade com offsets fixos de ±0,25 u.
   - Cada boneco tem capacete na cor do time, torso cáqui `#6b6a4e`, mochila e arma preta projetada à frente, em pose de tiro (torso inclinado 15°).
   - Animação de passo com bob vertical de 0,03 u.
   - Foguete: tubo grosso no ombro.
3. **Unidades azuis no mesmo padrão das vermelhas.**
   - Limitar o azul a ≤ 25% do topo: faixa da torre, 2 listras no glacis e insígnia.
   - Escurecer o azul do time para `#2f5fd0` no albedo e manter o azul vivo só no emissivo e no anel.
   - Somar rim light fresnel `pow(1-NdotV,3)*0.3*teamColor` para destacar do chão.
   - Pôr cargas no deck: caixote, galão e antena.
4. **Ancorar os prédios.**
   - Laje com chanfro de 45° e altura de ~0,15 u, na cor concreto quente `#8a8478` em vez de cinza-azulado.
   - Decal de AO de contato radial com alpha 0.35, 0,4 tile para fora da laje.
   - Gradiente de poeira nos 15% inferiores das paredes.
   - Trilhas batidas por SDF entre os prédios e até os campos de cristal.
   - Postes com catenária da Usina até os prédios, e alguns contêineres e cercas.
   - Clamp na luz pontual da Refinaria, com atenuação suave em vez de quadrado.
5. **Planície e capim.**
   - Trocar o pontilhado repetido por cascalho com normal procedural (voronoi) e albedo em 3 oitavas (±8%).
   - Transição areia/laranja com máscara de ruído e sem halo amarelo.
   - Capim dessaturado para `#8a9a4a`/`#6f7f3c`, com tufos 3D instanciados nas manchas.
   - Rastros de lagarta como decal que some em 60 s.
6. **Cânion e vegetação.**
   - Estratificação `fract(h*6+noise*0.3)` só nas faces verticais (peso `1-N.y`).
   - Topo do platô em terra e capim seco.
   - Pedras em cinza quente `#7d736a`.
   - Árvores com 3 a 5 lóbulos deformados, escala de 0,7 a 1,3, matiz ±10% e tronco.
   - A sombra das árvores deve usar a mesma densidade das outras: hoje está ~2x mais escura.
7. **Pós-processamento.**
   - Tilt-shift só na faixa superior de 15% (horizonte) e com 30% da força atual. Nada embaixo nem nas laterais.
   - CAS/sharpen 0.3 após o bloom.
   - Na explosão, o frame 2 tem blobs laranja chapados: dar textura de ruído e gradiente para o núcleo `#ffb347`.
8. **Telhados com cor de time chapada.**
   - Trocar as placas azuis do Quartel e a faixa da Fábrica por material metálico escuro com painéis.
   - Levar a cor do time para bandeiras, painéis verticais e luzes de borda emissivas, que também ficam lindas no escuro da névoa.

## Veredito
Água, névoa e cristais já são de jogo comercial, mas os clarões em barra vertical, a infantaria minúscula e as lajes cinza soltas na areia seguram o conjunto em "indie bonito" (6/10): a rodada 5 refinou, mas não deu o salto.
