# Fronteira Cristal: modo Premium, rodada 9. Crítica de direção de arte

Revisor: diretor de arte independente.

Material:
- capturas `logs/capturas/premium-r9/01..09`, comparadas pixel a pixel com `premium-r8/`;
- o relatório da r8 e `premium-rodada-8-correcoes.md` (correção da normal invertida por `gl_FrontFacing` na projeção oblíqua).

Capturas próprias: `?premium&escalagl=1&jogar&semnevoa`, com o mouse no centro. Usei uma instância por vez, com os scripts em `/home/claude/tools/r9art/` e `/home/claude/tools/`. Ficaram em `logs/capturas/premium-r9/arte-proprias/`:

| Arquivo | Conteúdo |
|---|---|
| `unidades-z3.png`, `unidades-crop2x.png`, `unidades-esq-crop3x.png`, `unidades-z4.png` | 6 classes × 2 times, no mesmo enquadramento de `premium-r8/arte-proprias/unidades-crop2x.png` |
| `base-z3.png`, `base-crop.png`, `base-qg-fabrica-crop2x.png` | base azul completa e o recorte do QG e da Fábrica |
| `plato-z3.png`, `plato-crop.png` | topo do platô do cânion (árvores, pedras, encostas) |
| `lago-z25.png`, `lago-crop.png` | lago do cânion |
| `batalha.png`, `batalha-crop2x.png`, `batalha-tanques-crop3x.png` | 16 contra 16 na borda do cânion |

Nota: a primeira tentativa de `base-z3` falhou com `framebuffer incompleto: 36061`, porque havia outro Chromium de outro agente aberto. Na segunda tentativa funcionou. A falha conhecida continua lá, e o jogo ainda não volta sozinho para o Clássico.

## Medições objetivas (r8 → r9)

| Medida | r8 | r9 | Leitura |
|---|---|---|---|
| Luminância p5/p50/p95 em `05-paisagem` | 57/132/171 | 49/142/190 | Primeira mudança de gradação em 3 rodadas. A meta p95 ≥ 190 foi atingida; a meta p5 ≤ 40, ainda não |
| Luminância p5/p50/p95 em `04-batalha` | 57/139/174 | 46/151/193 | Mais contraste de verdade |
| Luminância p5/p50/p95 em `03-base-perto` | 70/169/198 | 59/192/223 | A mediana subiu 23 e o concreto quase estoura |
| Saturação média em `05` / `04` | 0,47 / 0,42 | 0,55 / 0,50 | +17%: passou do ponto (veja a seção "O que piorou") |
| Pixels com variação acima de 20 (02 / 03 / 04 / 05 / 09) | n/a | 48 / 62 / 43 / 34 / 55% | A maior mudança visual desde a r1 |
| Telhado da Fábrica × concreto do chão (`base-z3`) | n/a | (221,200,166) × (217,203,183) | **Telhado e chão têm o mesmo valor** |
| Água em `05`: centro | (45,74,88) | (31,69,88) | Um pouco mais saturada; fora isso, igual |
| Frame 1 da explosão com luminância acima de 235 | 5,7% | 12,3% | O clarão voltou a crescer na captura |

## Notas

| Área | r9 | r8 | Δ |
|---|---|---|---|
| (a) Terreno | **7,5/10** | 7 | +0,5 |
| (b) Modelos de unidades | **7,5/10** | 7 | +0,5 |
| (c) Prédios | **7/10** | 7 | = |
| (d) Iluminação e cor | **7,5/10** | 7 | +0,5 |
| (e) Impacto geral "AAA" | **7/10** | 6,5 | +0,5 |

## O que melhorou de verdade

- **A correção da normal foi a mais importante do projeto.** O diagnóstico estava certo: as críticas das rodadas 6 a 8 ("pedras lilás", "árvores cinza-sálvia", "casco lavado") eram sintomas de superfícies sem sol. Agora há luz direcional de verdade, com lado claro e lado escuro em cada objeto.
- **Platô** (`plato-crop`, `05`):
  - as pedras são ocre;
  - as copas são verdes, com volume e luz de topo, e algumas têm tronco escuro visível;
  - o topo da mesa ganhou leitura de relevo.
  - Lado a lado com a r8, a mudança é enorme: deixou de ser "maquete cinza" e virou cenário.
- **Unidades** (`unidades-crop2x` contra o da r8):
  - o vermelho deixou de ser rosado: o casco é grafite, com painéis vermelhos saturados, faróis e brilho de metal;
  - o azul enfim tem valor escuro no chassi;
  - as seis classes são distinguíveis a 2x pela silhueta e pela cor;
  - os foguetes têm tubos cáqui legíveis e o coletor tem faixa de perigo.
- **Prédios com luz.** O QG com cúpula, a Fábrica com portão listrado e as lâmpadas âmbar, e a Usina com torres e vapor agora têm sombra própria e projetada coerentes. As lâmpadas âmbar deram um ponto quente que faltava.
- **A gradação finalmente se mexeu.** Os pretos desceram (p5 de 57 para 49) e as luzes subiram. A vinheta é visível em `04` e `05`.
- **A névoa** (`06`) com nuvens volumétricas continua sendo uma das melhores imagens do jogo.

## O que piorou ou continua

1. **Saturação exagerada: o visual "mobile".**
   - A saturação média subiu 17%.
   - A areia virou laranja-gema, e a transição para o verde-limão (`05`, `09`) parece pintura de jogo de celular, não terreno.
   - O AAA de referência (Northgard, Company of Heroes 3, Age IV) dessatura o chão e guarda a saturação para os times e os efeitos.
   - Hoje o chão compete com as unidades.
2. **Os telhados se fundem ao chão.**
   - A Fábrica (221,200,166) está sobre o concreto (217,203,183), o mesmo valor e quase a mesma cor.
   - Em `03`, os prédios só se destacam pela sombra e pelos frisos azuis.
   - O concreto do pátio está quase estourado (p95 = 223).
   - O problema saiu do "papelão cinza" da r8 e foi para o "papelão creme".
3. **O camuflado azul ficou ruidoso** (`batalha-tanques-crop3x`).
   - O tanque azul é um mosaico de manchas azul-saturado sobre cáqui e grafite.
   - Em grupo, vira ruído azul e as silhuetas se perdem.
   - O vermelho tem a regra mais limpa (grafite com painéis) e lê melhor. Os dois times ainda não seguem a mesma regra.
   - A infantaria azul tem corpo cáqui-oliva quase da cor da areia, e só o capacete azul identifica o time.
4. **As encostas continuam em degrau e "voxel"** (`plato-crop`, base das paredes). A faixa marrom-escura borrada e em blocos ao pé do platô é idêntica à da r6–r8. Agora que a luz funciona, o defeito aparece **mais**.
5. **O campo de cristal continua sendo um véu leitoso** (`unidades-crop2x`).
   - O chão sob os cristais é uma névoa clara bege-ciano.
   - Há pontos de bloom estourados (dois sóis brancos de cerca de 30 px no meio do campo).
   - As unidades em cima dele perdem contraste.
6. **A água está parada** (`lago-crop`). Nada mudou desde a r8: não há reflexo das margens, faixa molhada nem microbrilho. O grão de "feltro" continua.
7. **Base sem props.** Continua sendo uma grade de lajes sobre um pátio limpo: sem cabos, contêineres, cercas ou marcas de pneu.
8. **O clarão da explosão** cobre 12% do frame 1 acima de 235. O blob amarelo-branco continua sem núcleo definido. A exposição dinâmica ajuda, mas o blob em si não mudou.

## Correções priorizadas (máx. 8)

1. **Calibrar a cor depois da nova luz** (pós em `premium.js` e albedos do terreno).
   - Saturação global −12%.
   - Albedo da areia de `~#e0a040` para `~#c89a5c`, com menos amarelo.
   - Verde do capim −20% de saturação, puxado para oliva.
   - Teto de albedo do concreto em 0,62.
   - Metas em `05`: saturação média ≤ 0,48, p5 ≤ 40, p95 entre 185 e 200; em `03`, p50 ≤ 175.
2. **Separar os telhados do chão** (`models.js`).
   - Telhados em cinza-grafite médio (`#6b6a66` a `#7a776f`), com variação de ±6% por painel.
   - Escorrimento escuro na base das paredes.
   - Alternativa: escurecer o pátio de concreto para `#8c8478` e deixar o telhado claro.
   - Meta: diferença de luminância ≥ 40 entre telhado e chão em `base-z3`.
3. **Mesma regra de material nos dois times** (`models.js`/`shaders.js`).
   - Tirar o camuflado azul em manchas.
   - Casco em grafite (`#3c3e42`), com a cor do time só em 2 ou 3 painéis grandes, igual ao vermelho.
   - Na infantaria, a cor do time também no tronco ou na mochila, não só no capacete.
   - Meta: em `batalha-tanques-crop3x`, cada tanque com contorno legível e no máximo 35% da área do casco na cor do time.
4. **Encostas lisas** (`terrain3d.js`). Pendente desde a r6, e agora a luz evidencia o defeito.
   - Normais por diferença central sobre a heightmap filtrada.
   - Subdivisão 2x onde `|∇h|` é alto.
   - Estratos ponderados por `pow(1-N.y, 2)`.
   - Oclusão de ambiente na base da parede, em vez da faixa marrom borrada.
5. **Chão do campo de cristal** (terreno e bloom).
   - Trocar o véu claro por um solo escuro mineral (`#3a4a50`), com veios ciano finos e emissivos.
   - Limitar o bloom dos cristais a 1,0 de luminância antes do limiar.
   - Remover as fontes pontuais que viram "sol" de 30 px.
   - Meta: nenhum blob acima de 245 com mais de 8 px de raio em `unidades-z3`.
6. **Água, passo 2** (é o mesmo pedido da r8):
   - reflexo falso das margens com Fresnel;
   - faixa molhada de −25% de albedo na pedra;
   - normais de 2 a 3 oitavas que andam, em vez do ruído estático;
   - microbrilho GGX no lago inteiro.
7. **Props na base** (`props3d.js`), fora das lajes e por seed:
   - postes com catenária;
   - pilhas de contêineres;
   - barris;
   - cerca baixa em 30% do perímetro;
   - marcas de pneu saindo da Fábrica.
8. **Clarão com núcleo** (`fx3d.js`).
   - Núcleo branco de raio 0,3 e halo `#ffb347` em `exp(-r*4)`.
   - Área acima de 235 menor que 6% no frame 1.
   - Manter a luz quente no chão, que agora já aparece.

## Veredito

A correção das normais foi o maior salto do projeto: pela primeira vez o mundo tem sol, volume e cor de verdade. Mas o jogo passou do "lavado" para o "saturado de celular", com telhado e chão do mesmo valor e encostas em degrau. Está em "indie muito bonito" (7/10), e a próxima rodada precisa ser de calibração fina, não de mais cor.
