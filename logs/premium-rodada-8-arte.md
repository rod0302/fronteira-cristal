# Fronteira Cristal: modo Premium, rodada 8. Crítica de direção de arte

Revisor: diretor de arte independente.

Material:
- capturas `logs/capturas/premium-r8/01..09`, comparadas pixel a pixel com `premium-r7/`;
- o relatório da r7 e `premium-rodada-7-correcoes.md`.

Capturas próprias: `?premium&escalagl=1&jogar&semnevoa`, com o mouse no centro (script `/home/claude/tools/arte8.js`). Ficaram em `logs/capturas/premium-r8/arte-proprias/`:

| Arquivo | Conteúdo |
|---|---|
| `unidades-z3.png`, `unidades-crop2x.png` | 6 classes × 2 times; ao lado, `unidades-r7-crop2x.png` com o mesmo enquadramento na r7 |
| `base-z3.png`, `base-crop2x.png` | base azul completa |
| `lago-z25.png`, `agua-crop2x.png` | lago do cânion e recorte 2x da água |
| `plato-crop3x.png` | topo do platô (árvores, pedras, curvas de nível), mesmo recorte de `premium-r7/arte-proprias/canion-crop3x.png` |
| `batalha.png`, `batalha-crop2x.png` | 5 blindados + 4 esquadrões por lado, com a borda do cânion |

## Medições objetivas (r7 → r8)

| Medida | r7 | r8 | Leitura |
|---|---|---|---|
| Água em `05`: centro / margem | (60,103,103) / (58,98,99) | (44,74,89) / (47,94,103) | Agora existe gradiente real de profundidade (ganho) |
| Luminância p5/p50/p95 em `05-paisagem` | 55/133/171 | 56/131/170 | Gradação **idêntica** |
| Luminância p5/p50/p95 em `04-batalha` | 56/140/176 | 56/138/173 | idem |
| Pixels de `05` que mudaram fora do lago | n/a | 2,6% | O platô praticamente não mudou |
| Pixels de `03-base-perto` que mudaram | n/a | 5% | Base praticamente igual |
| Laranja chapado no frame 3 da explosão | 2152 px | 199 px | O decal laranja acabou (ganho) |
| Pixels saturados (>240) no frame 1 | 21% | 17% | Clarão um pouco menor, ainda estourado |
| Realce do casco azul (`09`) | (109,131,180) | (108,129,179) | Sem mudança perceptível |

## Notas

| Área | r8 | r7 | Δ |
|---|---|---|---|
| (a) Terreno | **7/10** | 6,5 | +0,5 |
| (b) Modelos de unidades | **7/10** | 7 | = |
| (c) Prédios | **7/10** | 7 | = |
| (d) Iluminação e cor | **7/10** | 7 | = |
| (e) Impacto geral "AAA" | **6,5/10** | 6,5 | = |

## O que melhorou de verdade

- **A água deixou de ser placa de tinta** (`05-paisagem`, `agua-crop2x`).
  - O raso turquesa (47,94,103) na margem passa para azul-petróleo (44,74,89) no centro, com transição contínua e sem os anéis de banding da r7.
  - O contorno ciano grosso virou um fio claro de espuma, mais discreto.
  - Na vista de batalha (`04`), o reflexo do sol tem halo largo e convincente.
  - Lado a lado com a r7, `05` é a captura mais melhorada do pacote, e foi por ela que o terreno subiu meio ponto.
- **A explosão perdeu o "disco de desenho"** (`07-explosao-sequencia`).
  - O frame 3 não tem mais a mancha laranja sólida: o laranja chapado caiu de 2152 px para 199 px.
  - O fogo do frame 2 agora tem veios e borda erodida, e se mistura à fumaça.
  - É a correção mais visível da rodada.
- **Árvores menos "teal".** A copa saiu do verde-azulado saturado e foi para um cinza-sálvia (`plato-crop3x` contra `canion-crop3x` da r7). Ficou menos falsa, mas também mais apagada (veja o item 3 abaixo).
- **Cristais um pouco mais contidos.** O véu leitoso sobre as unidades diminuiu (`unidades-crop2x`): o vermelho em cima do campo fica menos rosado que na r7. Ainda assim, o cristal continua sendo o elemento mais claro da tela.

## O que continua (ou piorou)

1. **A gradação global está congelada há duas rodadas.**
   - p5/p50/p95 = 56/131/170, a mesma da r6 e da r7.
   - Não há sombra de nuvem, split-tone nem vinheta.
   - O preto mais escuro de uma cena de paisagem é 56. Por isso tudo parece "lavado por uma janela fosca", e é o motivo nº 1 de o jogo não parecer AAA.
2. **O casco azul segue periwinkle.**
   - A correção diz "grafite `#454644`", mas no realce o tanque azul mede (108,129,179), igual à r7.
   - Em `batalha-crop2x`, a fileira azul é um bloco azul-lavanda claro, sem valor escuro, enquanto a vermelha tem casco grafite e painéis da cor do time.
   - Os dois times não seguem a mesma regra de material, e o azul é o time do jogador: é o que ele mais vê.
3. **O platô é o mesmo da r6** (`plato-crop3x`).
   - **Pedras:** os pontos lilás continuam lá: (109,82,80) a ~(105,95,115) nos blobs pequenos. A correção "pedras em ocre" não chegou à tela, ou só valeu para as pedras grandes.
   - **Árvores:** a copa cinza-sálvia é sem graça e não é o oliva quente pedido. Não há tronco visível nem variação de matiz por instância.
   - **Sombras:** continuam descoladas, com a sombra grande a um diâmetro de distância da copa. As árvores parecem balões.
   - **Encostas:** as curvas de nível em degrau no topo plano e o "voxel" nas encostas continuam idênticos.
   - É o terceiro relatório seguido com esses itens.
4. **A água está boa vista de cima, mas ainda não é água de AAA.**
   - Não há reflexo das paredes do cânion, faixa molhada na pedra nem cáustica.
   - O especular só existe perto do ponto do sol.
   - Na vista baixa (`lago-z25`), o lago parece um tecido aveludado: o ruído de cintilação fica estático e pontilhado, com grão de "feltro".
5. **O clarão da explosão ainda estoura.** No frame 1, 17% do quadro fica acima de 240, num blob amarelo-branco sem núcleo definido. Não se vê luz no chão: a areia ao redor não esquenta.
6. **Base sem vida entre os prédios** (`base-crop2x`).
   - Continua sendo uma grade de lajes sobre areia limpa.
   - Os únicos "props" ficam dentro das lajes: o mesmo poste e as mesmas caixinhas de 2 a 3 px.
   - Não há cerca, cabos, contêineres nem marcas de pneu entre os prédios (só as trilhas finas que já existiam).
   - A borda das lajes continua cinza-violeta.
7. **Os prédios não evoluíram.** Os modelos são bons (QG com cúpula, fábrica com portão listrado, usina com torres e vapor). Mas o telhado é cinza-claro chapado, com pouca sujeira e nenhuma variação. Sob o sol forte, eles leem como maquete de papelão cinza.

## Correções priorizadas (máx. 8)

1. **Gradação e macrovariação** (pós em `premium.js`). É o item mais barato com o maior ganho, e está pendente desde a r6.
   - Curva de contraste em S em torno de 0,45 (+10%).
   - Split-tone: sombras para `#2f3e5c` a 7% e luzes para `#ffe0a8` a 5%.
   - Vinheta de 12 a 15%.
   - Sombra de nuvem: fbm em escala de cerca de 20 tiles, deriva lenta, −18% de sol no terreno e nas unidades.
   - Meta mensurável em `05-paisagem`: p5 ≤ 40 e p95 ≥ 190.
2. **Unificar o material do casco nos dois times** (`models.js`/`shaders.js`).
   - Aplicar ao azul exatamente a mesma regra do vermelho: corpo em grafite e cor do time só nos painéis.
   - Verificar se o tint do time não está multiplicando o casco inteiro (o azul hoje "tinge" tudo).
   - Meta: realce do casco azul abaixo de (85,88,96) em `09-unidades`, com painéis `#3d6fd6` legíveis.
   - Somar o blob de sombra de contato (alfa 0,5, 1,2× a pegada).
3. **Platô: cumprir de fato o que já foi prometido** (`props3d.js`, `terrain3d.js`).
   - Pedras pequenas: achar a fonte do lilás (provavelmente uma paleta ou instância separada das pedras grandes) e trocar para ocre ou cinza quente, com `b < g < r`.
   - Árvores: copa em `#6f7a3a`–`#8a8f4a` com ±10% de matiz por instância, e tronco visível em 50% delas.
   - Sombra ancorada na base do tronco: hoje há deslocamento de cerca de 1 diâmetro.
   - Estratos do cânion multiplicados por `pow(1-N.y, 2)`, para que o topo plano fique liso.
4. **Água, passo 2** (shader da água).
   - Reflexo falso das margens: amostrar a cor do terreno deslocada pela normal, escurecida a 60%, com peso de Fresnel.
   - Faixa molhada: −25% de albedo na pedra até 0,4 u acima da linha d'água.
   - Microbrilhos de GGX (rugosidade 0,08) no lago inteiro, animados, e não só no ponto do sol.
   - Trocar o ruído "feltro" estático por normais de 2 a 3 oitavas que andam.
5. **Clarão com núcleo e luz no chão** (`fx3d.js`).
   - Núcleo branco-quente com raio 0,3 e halo `#ffb347` em `exp(-r*4)`.
   - Limitar a área acima de 240 a menos de 6% do frame 1.
   - Luz pontual que aquece de fato a areia num raio de cerca de 3 tiles, com decaimento de 0,3 s. Meta: +40 de luminância na areia a 1 tile do centro.
6. **Props entre prédios, na escala de jogo** (`props3d.js`).
   - Fora das lajes, por seed:
     - postes com catenária entre a Usina e os prédios;
     - pilhas de 2 a 4 contêineres de 1,5 × 0,6 u;
     - cerca baixa em 30% do perímetro;
     - barris em grupos de 3;
     - marcas de pneu escuras saindo da Fábrica.
   - Borda da laje em `#8a7a64`, com faixa de poeira em gradiente.
7. **Telhados com material** (`models.js`).
   - Sujeira de escorrimento vertical (gradiente de 15% mais escuro na base das paredes).
   - Variação de ±6% por painel de telhado.
   - Cavidade escura nos encaixes.
   - Albedo do telhado no máximo 0,6, para que o cinza deixe de estourar ao sol.
8. **Suavizar as encostas** (`terrain3d.js`).
   - Normais por diferença central sobre a heightmap filtrada (bicúbica), em vez de por célula.
   - Subdividir 2× os quads com `|∇h|` alto, para acabar com os degraus de "voxel" nas paredes do cânion.

## Veredito

A rodada 8 entregou duas melhorias reais e visíveis: a água ganhou profundidade e a explosão perdeu o decal. Mas a gradação, o casco azul e o platô seguem idênticos pela terceira rodada, e o jogo continua "indie bonito e polido" (6,5/10), ainda longe de AAA.
