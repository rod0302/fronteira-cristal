# Premium — Rodada 5 — Crítica de efeitos (VFX / pós / atmosfera)

Revisor: técnico de VFX independente (não construí o modo). Base: `logs/capturas/premium-r5/` (01, 04, 05, 06,
07-sequência) e capturas próprias 1280x720, `escalagl=1`, mouse no centro, 4 s de bake, em
`logs/capturas/premium-r5/efeitos-proprias/`:
- `land-m.png`: explosão grande (s = 16, big) em terra, `fx3Update` **congelado e avançado à mão** em
  t = 0,03 / 0,12 / 0,25 / 0,45 / 0,7 / 1,0 / 1,5 / 2,5 s; `zoom1.png` = recorte ampliado de 0,25 s e 1,0 s;
- `water-m.png`: a mesma explosão no ponto mais fundo da água, mesmos instantes;
- `batz.png`: recorte ampliado da batalha 16x16 (battle3) 5 s depois de criar as unidades;
- `cry.png`: campo de cristais ampliado (de 06-nevoa). Não avaliei fps.

## Notas

| Área | R1 | R2 | R3 | R4 | **R5** |
|---|---|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | 5,5 | 5,5 | **6/10** |
| (b) Fumaça e partículas | 4 | 4,5 | 4,5 | 5 | **5,5/10** |
| (c) Água e cristais | 4 | 5 | 5 | 5,5 | **5,5/10** |
| (d) Névoa de guerra e atmosfera | 3 | 6 | 6,5 | 6,5 | **6,5/10** |
| (e) Pós‑processamento | 5 | 5 | 5,5 | 5,5 | **6/10** |
| (f) Impacto geral | 4,5 | 5 | 5,5 | 5,5 | **5,5/10** |

**Veredito: o tonemap enfim deixa o fogo ser laranja e a explosão tem uma ordem certa (clarão → fogo → fumaça), mas o
fogo continua sendo "bolas de algodão laranja" sem textura nem fuligem, a explosão na água é igual à de terra e a
batalha não tem fogo cruzado legível — bom indie, ainda não AAA.**

## O que melhorou desde a R4
- **Tonemap híbrido** (45% pela luminância): aos 0,45–1,0 s o fogo tem laranja de verdade; antes era branco puro.
- **Ordem temporal correta**: clarão 0–0,25 s, bola de fogo 0,45–1,0 s, coluna de fumaça a partir de ~1,2 s que
  sobe para o norte da tela e é empurrada pelo vento. Faíscas agora são riscos amarelos em leque, legíveis.
- **Explosão na água nasce na superfície** e o reflexo do clarão no lago (05/04, `water-m` 0,03 s) é bonito.
- **Marca de queimado** no chão depois das mortes (bat2: decalque escuro irregular) — dá memória à batalha.
- Fumaça sem os "buracos pretos" da R4; a borda já rasga um pouco.

## O que vi, por área

### (a) Explosões e fogo — 6
- **0,03–0,25 s: ainda é um sol amarelo‑creme sem forma**, com a luz pontual pintando um disco amarelo de ~100 px
  no chão e um **anel circular fino de bloom/onda** em volta (zoom1 esquerda). Melhor que a R4 (não é mais branco),
  mas não há núcleo, não há "forma" de bola de fogo — é um glow.
- **0,7–1,0 s: o fogo de verdade são 6–9 discos laranja chapados** (zoom1 direita): contorno redondo nítido, cor
  quase uniforme (laranja 1,0/0,45/0,1), sem miolo amarelo, sem borda vermelho‑escura, sem fuligem preta entremeada.
  `turb` (fbm3 a 3,3) não aparece porque `smoothstep(0.25,0.75, turb + tex.a*0.45 - t*0.25)` satura em 1 no meio do
  sprite: o recorte só age na borda e a borda some no alfa. Resultado: "pompom", não "labareda".
- **Fogo some aos ~1,2 s** e a bola vira algodão cinza num corte; falta a fase intermediária (fogo enrolado em fumaça
  escura, brasas no chão, chamas residuais no local) que vende peso.
- Sem **decalque de cratera/queimado** na explosão de teste (só aparece nas mortes de unidade).

### (b) Fumaça e partículas — 5,5
- Coluna: **um único bolo cinza‑acastanhado** com sombreamento de "pedra" (manchas mais escuras internas parecem
  rocha, não volume). Sem gradiente (base escura e quente → topo claro e frio), sem fiapos na borda, sem rolar
  (todas as partículas giram e crescem iguais). Na batalha (batz) são puffs cinza translúcidos que lavam os tanques.
- **Clarão de cano: pontinho amarelo redondo** (batz). Não vejo a "estrela" direcional nem fumacinha de boca.
  **Traçantes invisíveis**: em 4 quadros de batalha 16x16 não identifiquei nenhum risco de projétil. A troca de tiros
  não se lê; só os impactos.
- Faíscas OK (riscos), mas todas amarelo‑claro, curtas e da mesma espessura; sem rampa branco→laranja→vermelho e
  sem quique visível.
- Destroços: pedrinhas azul‑ardósia que parecem as pedras do mapa (mesma cor) — não leem como sucata de tanque.

### (c) Água e cristais — 5,5
- Água: reflexo do sol/explosões bom; margem turquesa com espuma boa. Mas o **corpo é um ruído fino de alta
  frequência uniforme** (efeito "lixa/alumínio martelado", bem visível em `water-m`), mesmo azul‑petróleo do raso ao
  fundo; sem cáusticas, sem gradiente de profundidade, sem ondas grandes direcionais.
- **Explosão na água = explosão de terra**: bola de fogo laranja, fumaça cinza e pipocas brancas sobre a água.
  Nenhuma coluna d'água, nenhum anel de onda/espuma na superfície, nenhum spray. Isso é um erro de linguagem visual.
- Cristais (cry): melhoraram de brilho, mas continuam **ciano‑bala idênticos**, mesmo tamanho e forma clonada em
  grade, sem variação de matiz (falta verde‑água/azul‑violeta), sem núcleo branco interno, sem refração; o halo é
  fraco e **não ilumina o chão** (só veios leitosos). Campo de cristais parece "tapete de ícones".

### (d) Névoa de guerra e atmosfera — 6,5
- Nuvens volumosas e com topo iluminado (06): o melhor elemento "uau" do modo. Borda com ruído funciona.
- Ainda sem atmosfera no mundo visível: sem poeira em suspensão, sem raios de luz, sem bruma no fundo do cânion
  (o fundo do vale fica tão nítido quanto o planalto), sem distorção de calor sobre fogo, sem sombras de nuvem
  correndo pelo chão.
- Terreno visível fica levemente borrado/lavado (04/bat0): parece um véu de bloom/grão; tira nitidez sem dar
  profundidade.

### (e) Pós‑processamento — 6
- Pipeline correto e o tonemap novo funciona. Bloom 0,62/limiar 1,25 pega fogo, sol na água e pontas de cristal.
- Falta **adaptação de exposição** ao clarão (a cena não "escurece" por um instante), **sem distorção de calor/onda
  de choque** em espaço de tela, sem lens dirt/flare no flash, sem **DOF/tilt‑shift** no jogo (só no título),
  sem AO de tela para colar unidades no chão (as sombras resolvem parte).
- Seleção: arcos azuis limpos e legíveis; barras de vida chapadas e pequenas, sem contorno — destoam do resto.

## Correções prioritárias (máx. 8)

1. **Fogo com corpo** (`PART_FS`, tipo 1): trocar o recorte por densidade *multiplicativa* e mais contrastada —
   `float d = tex.a * pow(saturate(turb*1.6 - 0.3 + (1.0-r)*0.5), 1.5);` usar **dois fbm deslizando em direções
   opostas** (`fu*3.3 + t*1.5` e `fu*6.0 - t*2.7`) e `heat = 1.0 - d` para que o miolo seja amarelo‑branco (rampa 0)
   e a borda vermelho‑escura (rampa 0,7). Misturar **fuligem preta alfa‑blended** nas bordas a partir de t > 0,4
   (`col = mix(col, vec3(0.03), smoothstep(0.4,0.9,t)*(1.0-d))`, alfa maior). Usar flipbook procedural (fase
   `t*4` no ruído) em vez de sprite crescendo.
2. **Transição fogo→fumaça contínua**: emitir PT_DARK *dentro* da bola de fogo aos 0,3 s (não 0,25–0,4 s ao lado),
   e deixar 2–3 sprites de fogo pequenos por 2–3 s na base (chamas residuais) + brasas PT_EMBER no chão; estender
   vida do fogo big para 1,4–2,0 s com intensidade decaindo. Adicionar decalque de cratera queimada à `fx3Explosion`
   (o mesmo das mortes), com borda alaranjada aditiva que esfria em 3 s.
3. **Explosão na água própria**: se `g < WATER_LEVEL`, **não** emitir PT_FIRE/fumaça escura; emitir coluna vertical
   de 20–30 PT_STEAM esticados (velocidade 200–320 para cima, `lift −400`), coroa de spray em anel, 2 ondas
   concêntricas aditivas brancas na superfície (`pfx.waves` com `r1 = s*5`, vida 1,2 s) e um decalque de espuma
   que dura 4 s. Bonus: empurrar a normal da água no shader com um anel senoidal `sin(30*(d - t*k))*exp(-..)`.
4. **Fogo cruzado legível**: traçantes 3–4x mais largos e longos (`PT_TRACER` tamanho 4–5, comprimento = velocidade
   × 0,04 s, núcleo branco + borda laranja, bloom forte), clarão de cano como **estrela de 3–4 pétalas orientada**
   em um único sprite procedural (não partículas de 0,08 s que caem entre quadros), vida mínima de 2 quadros
   (`life = max(0.06, 2*dt)`), e uma baforada de fumaça cinza clara na boca.
5. **Fumaça com volume**: gradiente vertical por idade (nasce marrom‑escuro quente 0,12, vai a cinza 0,45 com o
   topo iluminado pelo sol e base em sombra), rotação lenta por partícula (`rot += sign(seed-0.5)*0.4*dt`),
   tamanhos mais variados (0,4–1,4× s), erosão em 2 escalas mais forte nos últimos 40% da vida, e **sombra da coluna
   no chão** (decalque multiplicativo seguindo a nuvem, 0,7 de força).
6. **Cristais vivos**: matiz por aglomerado (`hue ± 0.08` entre ciano, verde‑água e azul), escala ± 35% e rotação
   aleatória por instância, núcleo emissivo interno (fresnel invertido) + pulso lento dessincronizado; **luz no
   chão**: decalque aditivo ciano de raio 1,5× o aglomerado com força 0,35 (barato, efeito enorme), e veios com
   emissão > limiar de bloom.
7. **Água**: substituir o ruído fino por 2–3 camadas de normal de ondas direcionais (escala 40/90/180 px, vento
   comum), gradiente raso→fundo pela profundidade (`mix(turquesa, azul‑marinho, smoothstep(0,40,depth))`), cáusticas
   suaves no raso, reflexo dos paredões com fresnel. Hoje o lago é a maior área de tela e tem a textura mais barata.
8. **Pós com resposta à ação**: exposição adaptativa curta (`uExposure` cai para 0,75 por 0,3 s após `premiumFlash`),
   distorção de calor / onda de choque em tela (refração radial de 0,5 s centrada na explosão, sampleando `uScene`
   com offset senoidal), bruma de profundidade nos cânions (mistura com azul‑acinzentado por `gndH < 0`) e
   tilt‑shift leve também no jogo (k = 0,3). Barras de vida com contorno escuro e segmentos.
