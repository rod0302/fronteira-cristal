# Fronteira Cristal: modo Premium, rodada 10. Crítica de direção de arte

Revisor: diretor de arte independente.

Material:
- capturas `logs/capturas/premium-r10/01..09`, comparadas pixel a pixel com `premium-r9/`;
- o relatório da r9 (`premium-rodada-9-arte.md`) e `premium-rodada-9-correcoes.md`.

Capturas próprias: `?premium&escalagl=1&jogar&semnevoa`, com o mouse no centro e uma instância de navegador por vez. Os scripts estão em `/home/claude/tools/r10art/`, com os mesmos enquadramentos da r9 para permitir a comparação direta. As imagens estão em `logs/capturas/premium-r10/arte-proprias/`:

| Arquivo | Conteúdo |
|---|---|
| `unidades-z3.png`, `unidades-crop2x.png`, `unidades-esq-crop3x.png`, `unidades-z4.png` | 6 classes × 2 times, sobre o campo de cristal |
| `base-z3.png`, `base-qg-fabrica-crop2x.png` | base azul e o recorte do QG e da Fábrica |
| `plato-z3.png`, `plato-encosta-crop2x.png` | platô do cânion e a parede sul ampliada |
| `lago-z25.png`, `lago-crop2x.png` | lago do cânion |
| `batalha.png`, `batalha-tanques-crop3x.png` | 16 contra 16 na borda do cânion |

## Medições objetivas (r9 → r10)

| Medida | r9 | r10 | Leitura |
|---|---|---|---|
| Saturação média em `05` / `04` / `09` | 0,55 / 0,50 / 0,43 | 0,49 / 0,43 / 0,38 | **−12%, como foi pedido.** A meta (≤ 0,48 em `05`) ficou praticamente atingida |
| Luminância p5/p50/p95 em `05` | 50/143/190 | 51/144/191 | A gradação não mudou. A meta p5 ≤ 40 continua não atingida |
| Luminância p5/p50/p95 em `03` | 60/192/223 | 58/190/221 | A meta p50 ≤ 175 **não foi atingida**: o pátio continua quase estourado |
| Pixels com variação acima de 20 (02 / 03 / 04 / 05 / 09) | 48 / 62 / 43 / 34 / 55% | 5 / 10 / 15 / 6 / 14% | Foi uma rodada de ajuste fino, não de salto |
| Telhado da Fábrica × chão (`base-z3`) | (221,200,166) × (217,203,183) | (147,129,103) × (215–229, 202–216, 184–195) | **Separados.** A diferença de luminância é de cerca de 75 |
| Telhado do QG × chão | n/a | (188,184,173) × (~222,209,190) | A diferença é de cerca de 30: ainda é pouco |
| Laje de concreto dos prédios × chão | n/a | (220,202,167) × (~222,209,190) | **As lajes têm o mesmo valor do pátio** |
| Pixels acima de 245 / 235 em `unidades-z3` | 2656 / 8691 | 2512 / 8527 | Os "sóis" do campo de cristal mudaram muito pouco: ainda sobra um blob de cerca de 25 px |
| Chão do campo de cristal (amostra) | (169,196,165) | (172,192,164) | O véu leitoso continua o mesmo |

Observação: o relatório de correções diz que o concreto foi para `#8a7f6e`, mas o pátio medido continua entre 215 e 229. A mudança não chegou à tela, ou foi anulada pela iluminação e pela exposição. Vale verificar.

## Notas

| Área | r10 | r9 | Δ |
|---|---|---|---|
| (a) Terreno | **7,5/10** | 7,5 | = |
| (b) Modelos de unidades | **7,5/10** | 7,5 | = |
| (c) Prédios | **7/10** | 7 | = (a Fábrica melhorou; o conjunto, não) |
| (d) Iluminação e cor | **8/10** | 7,5 | +0,5 |
| (e) Impacto geral "AAA" | **7/10** | 7 | = |

## O que melhorou de verdade

- **A paleta amadureceu.**
  - A saturação caiu 12%, e a areia saiu do laranja-gema para um ocre mais terroso (`05`, `04`).
  - O capim ficou menos limão.
  - O chão parou de competir com os times. Em `04`, o vermelho e o azul agora são as cores mais fortes da imagem, como deve ser.
  - Foi a correção pedida, aplicada com a dose certa e sem lavar a imagem de novo.
  - É o motivo do +0,5 em (d).
- **O telhado da Fábrica se destaca do chão.**
  - A chapa escura (147,129,103) contra o pátio claro funciona, e a Fábrica enfim lê como volume a qualquer zoom (`02`, `03`, `base-z3`).
  - As faixas de claraboia escuras e o portão com lâmpadas âmbar formam o melhor prédio do jogo.
- **Tanque azul mais limpo** (`batalha-tanques-crop3x` contra o da r9).
  - O mosaico de manchas diminuiu: agora há placas azuis maiores sobre o grafite, mais próximas da regra do vermelho.
  - Em grupo, as silhuetas se separam melhor que na r9.
- **A explosão vista como imagem** (`07-explosao-sequencia`): a fumaça tem massa cinza com fuligem e o brasido fica no chão. Ficou mais crível que na r9. O detalhe fica para o crítico de efeitos.
- **A névoa** (`06`) continua sendo a imagem mais "cinematográfica" do jogo.

## O que continua ou piorou

1. **O pátio da base continua estourado e engole as lajes** (`base-z3`, `03`).
   - O chão está entre 215 e 229, e as lajes dos prédios estão em 220.
   - Só a Fábrica ganhou contraste. O QG, a Refinaria, o Quartel e as Usinas continuam como "papelão creme sobre papel creme".
   - Leitura: 4 de 7 prédios ainda dependem só da sombra projetada para existir.
2. **A textura do telhado da Fábrica é ruído, não chapa.**
   - De perto (`base-qg-fabrica-crop2x`), o telhado é um pontilhado bege e cinza de baixa frequência, que lembra camuflado ou cascalho.
   - Falta o que dá leitura de metal industrial: nervuras paralelas, junta de placa, escorrimento e mancha de ferrugem nas bordas.
3. **As encostas continuam em degrau** (`plato-encosta-crop2x`).
   - A parede sul do platô é uma faixa marrom de blocos verticais borrados, igual desde a r6.
   - É hoje o defeito mais "barato" visível na tela, porque o topo do platô (árvores, pedras e luz) ficou bom e a parede quebra a ilusão.
4. **O campo de cristal ainda é um véu leitoso com sol de bloom.**
   - O chão sob os cristais está em (172,192,164), claro e esverdeado, sem leitura mineral.
   - Ainda há um blob acima de 245 com cerca de 25 px entre o tanque e o batedor azuis.
   - As unidades em cima do campo perdem contraste.
5. **A água continua parada** (`lago-crop2x`).
   - É idêntica à da r8 e da r9: azul liso com grão de feltro, sem reflexo das margens e sem faixa molhada.
   - Novidade em `04`: o clarão dos disparos aparece como dois borrões brancos sobre a água. É um reflexo plausível, mas sem forma (são discos, não rastros alongados).
6. **A infantaria azul continua cáqui**, com só o capacete azul. A dos dois times continua lendo como "bolinhas coloridas" a 1x.
7. **Base sem props.** Nada mudou: o pátio é limpo, sem cabos, contêineres ou marcas de pneu. A base parece de maquete.
8. **Gradação sem pretos.** p5 = 51 em `05`. Falta ancoragem escura: oclusão de ambiente nos cantos dos prédios, nas fendas do cânion e nos pés das árvores.

## Correções priorizadas (máx. 8)

1. **Escurecer o pátio e separar as lajes** (terreno e `models.js`).
   - Confirmar por que o concreto `#8a7f6e` não chegou à tela.
   - Meta: pátio entre 150 e 175 de luminância em `base-z3`, e p50 ≤ 175 em `03`.
   - Laje dos prédios 20 a 30 pontos acima ou abaixo do pátio, com borda chanfrada escura.
   - Telhado do QG no mesmo esquema da Fábrica (chapa média, frisos azuis).
2. **Encostas lisas, estratificadas e com oclusão de ambiente** (`terrain3d.js`). É o pedido nº 4 da r9 e está pendente desde a r6.
   - Normais por diferença central sobre a heightmap filtrada.
   - Subdivisão 2x onde `|∇h|` é alto.
   - Estratos horizontais ponderados por `pow(1-N.y, 2)`.
   - Oclusão de ambiente escura no pé da parede.
3. **Campo de cristal mineral** (terreno e bloom).
   - Solo escuro (`#3a4a50`) com veios ciano finos.
   - Limitar a luminância dos cristais a 1,0 antes do limiar do bloom.
   - Meta: nenhum blob acima de 245 com mais de 8 px de raio em `unidades-z3`.
4. **Água, passo 2.** É o terceiro pedido igual:
   - reflexo falso das margens com Fresnel;
   - faixa molhada de −25% de albedo na pedra;
   - normais de 2 a 3 oitavas em movimento;
   - reflexos de clarão alongados em direção à câmera, não discos.
5. **Material do telhado industrial** (`models.js`/`shaders.js`).
   - Trocar o ruído pontilhado por nervuras paralelas (período de cerca de 4 px a zoom 3) e junta de placa a cada 1/3.
   - Escorrimento escuro a partir das bordas e das claraboias.
   - Rugosidade variável para dar microbrilho de metal.
6. **Infantaria com cor de time no tronco ou na mochila**, e capacete com 2 tons (topo claro, aba escura). No tanque azul, terminar a limpeza: tirar as manchas oliva que sobraram sobre as placas azuis.
7. **Props na base** (`props3d.js`): postes com catenária, contêineres, barris, cerca baixa em parte do perímetro e marcas de pneu saindo da Fábrica. Por seed, fora das lajes.
8. **Ancoragem escura**: SSAO barato, ou oclusão de ambiente fixa no terreno e nos pés dos prédios e das árvores. Meta: p5 ≤ 40 em `05` sem baixar p50.

## Veredito

A r10 acertou a calibração de cor que a r9 pedia e a Fábrica enfim tem telhado, mas foi uma rodada de ajuste fino (5% a 15% dos pixels mudaram), e as pendências estruturais seguem intocadas: pátio estourado, encostas em degrau, véu de cristal, água parada e base sem props. O jogo continua em "indie muito bonito" (7/10), e o salto para AAA agora depende de geometria e material, não de mais gradação.
