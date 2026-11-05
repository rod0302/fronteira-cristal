# Premium — Rodada 4 — Crítica de efeitos (VFX / pós / atmosfera)

Revisor: técnico de VFX independente (não construí o modo). Base: `logs/capturas/premium-r4/` (01, 04, 05, 06, 07,
07-sequência) e capturas próprias 1280x720, `escalagl=1`, mouse no centro, 4 s de bake:
- explosão grande (s = 16, big) com o `fx3Update` **congelado e avançado à mão** em t = 0,03 / 0,12 / 0,3 / 0,6 / 1,0 / 1,8 s
  (tempo de jogo exato, sem depender da lentidão do SwiftShader);
- explosão no ponto mais fundo do lago em t = 0,08 / 0,3 / 0,7 / 1,2 s;
- batalha 16x16 (2 tomadas, 6 s e 9 s depois de criar as unidades) + recorte ampliado;
- campo de cristais de perto (zoom 2,4) + recorte ampliado. Não avaliei fps.

## Notas

| Área | R1 | R2 | R3 | **R4** |
|---|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | 5,5 | **5,5/10** |
| (b) Fumaça e partículas | 4 | 4,5 | 4,5 | **5/10** |
| (c) Água e cristais | 4 | 5 | 5 | **5,5/10** |
| (d) Névoa de guerra e atmosfera | 3 | 6 | 6,5 | **6,5/10** |
| (e) Pós‑processamento | 5 | 5 | 5,5 | **5,5/10** |
| (f) Impacto geral | 4,5 | 5 | 5,5 | **5,5/10** |

**Veredito: a cena parada ficou mais rica (água, cristais, soft particles), mas o momento que deveria ser o "uau" — a
explosão — continua sendo uma bola branca estourada por meio segundo, depois discos laranja e um algodão cinza; ainda
está longe de "visualmente apaixonante".**

## O que melhorou desde a R3
- **Soft particles feitas** (`PART_FS`, `uDepth`): sumiram os cortes retos da fumaça em penhascos e no chão. Bom.
- **Fumaça atrasada** (`pfx.later … smoke`, 0,25–0,4 s): o fogo agora aparece antes do cinza; ordem certa.
- **Água**: ondas em escala maior, corpo mais fundo e escuro, margem turquesa com espuma, reflexo das explosões no
  lago continua sendo o melhor efeito do modo. O "alumínio martelado" diminuiu, mas não sumiu (05, 04).
- **Cristais** mais luminosos, com pontas mais claras, cintilação e veios no chão; leem melhor que na R3.
- Faíscas agora são riscos esticados (não mais quadradinhos); destroços escuros com rastro de fumaça.

## O que vi, por área

### (a) Explosões e fogo — 5,5
- **t = 0,03 a 0,6 s: bola branco‑creme estourada**, sem forma, sem laranja, com o chão num raio enorme pintado de
  amarelo‑holofote (sequência própria quadros 0–3; 07-explosao). O `PT_FLASH` diminuiu (0,9·s), mas o problema real
  agora é o **fogo**: 14 sprites aditivos com `fireRamp(heat) * 4.2` + miolo `*1.6`, e `fireRamp(0)` já é
  (1, 0,8, 0,5) — a soma passa de 10 em HDR e o ACES por canal leva tudo a branco. Junto, a luz pontual
  `s*5+36 ≈ 116` de raio com cor (4,2/2,0/0,7) por 0,9 s.
- **t ≈ 1,0 s: "discos laranja"** com contorno circular nítido, cor quase lisa; a turbulência (`fbm3(fu*3.3)`) não
  aparece. Não há borda vermelho‑escura nem fuligem entremeada. Dura pouco: aos 1,8 s já é só fumaça.
- O pico visual (fogo laranja com forma) e o pico de brilho (branco) estão **desencontrados**: quando o fogo tem cor,
  já não tem energia; quando tem energia, não tem cor.
- **Explosão na água: o fogo e o clarão nascem debaixo d'água** (`fx3Harvest` usa `g + 4`, e no lago `g ≈ −50`),
  então somem atrás da superfície. O que se vê é uma pilha de **pipocas brancas** (`PT_STEAM` 3–6 de tamanho, sem
  erosão) e, depois, bolinhas vermelhas soltas. Nenhum anel de onda, nenhuma espuma na superfície.
- Anel de poeira no chão: discreto, aceitável. Destroços: bons.

### (b) Fumaça e partículas — 5
- Coluna ainda é **um algodão cinza único** com manchas escuras internas (normais do atlas lidas como buracos), borda
  borrada uniforme. Erosão continua em `fbm3(vUv*1.6)` — fiapos não aparecem. Sem lado quente/lado frio.
- A fumaça não "sobe": numa câmera quase de cima, altura deveria virar deslocamento para o norte na tela; a bola só
  engorda no lugar. Na batalha (recorte) são duas nuvens cinzentas idênticas cobrindo os tanques.
- Faíscas melhoraram (riscos), mas são brancas e curtas; falta rampa branco→laranja→vermelho e vida mais longa.
- **Clarão de cano: um ponto branco pequeno**; a "estrela alongada" (`fx3Muzzle`, vida 0,05 s) quase nunca cai num
  quadro. **Traçantes** (`premium.js:887`, tamanho 1,5) praticamente invisíveis na batalha: a troca de tiros ainda não
  se lê como fogo cruzado.

### (c) Água e cristais — 5,5
- Água: melhor. Ainda falta: gradiente raso→fundo mais legível no meio do lago (fica azul‑petróleo chapado),
  reflexo do paredão pouco visível, e o ruído das ondas tem uma só "assinatura" (sem direção de vento, sem rajadas).
- Cristais: **ciano‑bala uniforme** — facetas quase não se distinguem, todas as pedras com a mesma cor e brilho; cada
  aglomerado projeta **sombra preta dura** (cristal que emite luz não deveria ter sombra tão escura) e **não ilumina
  o chão** nem as unidades vizinhas. Veios do chão leitosos/brancos, não brilham. O bloom quase não pega (só nas
  cintilações).

### (d) Névoa de guerra e atmosfera — 6,5
- Nuvens com relevo e topo iluminado (06): bonitas. A borda torcida por ruído funciona.
- Ainda pesadas: azul‑marinho quase preto ocupando 40% da tela; faixa "lembrança" (`mem … *0.5`) vira anel sujo.
- Atmosfera inexistente fora da névoa: sem poeira no ar, sem bruma no fundo do cânion, sem distorção de calor sobre
  fogo, sem sombra de nuvem perceptível em movimento.

### (e) Pós‑processamento — 5,5
- Pipeline correto (HDR, bloom 13 amostras, ACES, gradação, FXAA, grão). Mas: `uExposure = 1.0` e `uBloomK = 0.55`
  fixos, limiar 1,6; ACES aplicado por canal **dessatura o fogo para branco**; bloom só pega explosões e o sol na água.
  Nenhuma resposta de exposição ao clarão, nenhum halo nos cristais/janelas.
- Seleção: anéis azuis finos e limpos (OK). Barras de vida chapadas, sem integração com a cena.

## Correções prioritárias (máx. 8)

1. **Fogo com cor, não branco** (`PART_FS` tipo 1, `fx3Explosion`). `fireRamp(0)` → (1,0, 0,62, 0,22); multiplicador
   4,2 → 2,0; miolo `*1.6` → `*0.8` só em `r < 0.3`; trocar 14 sprites aditivos por 7–8 maiores com **alfa
   pré‑multiplicado desde t = 0** (`a = dens*alpha*0.55`, não `smoothstep(0.35,1,t)`), para que se ocultem em vez de
   somar. Luz: raio `s*5+36` → `s*3.5+28`, cor (4,2/2,0/0,7) → (2,6/1,2/0,35), vida 0,9 → 0,45 com queda `(1-t)²`.
   Meta: laranja saturado legível de 0,05 a 0,9 s, branco só num miolo de poucos px nos 2–3 primeiros quadros.
2. **Tonemap que preserve matiz** (`COMPOSITE_FS`): aplicar ACES sobre a luminância e reescalar a cor
   (`col *= aces(L)/max(L,1e-4)`, misturando 30–50% com o ACES por canal), ou ACES "fitted" de Hill. Limiar de bloom
   1,6 → 1,1, `knee` 0,8 → 0,5, `uBloomK` 0,55 → 0,7 (depois do item 1). Exposição que cai 15–20% durante
   `premiumFlash` (adaptação rápida) em vez de somar branco.
3. **Fumaça com forma e subida** (`PART_FS` tipo 0/7, `fx3Smoke`). Erosão `fbm3(vUv*3.5)*0.6 + vnoise(vUv*9)*0.4`
   com distorção de UV que gira devagar (`vUv += curl(vUv*2 + t)*0.15`); `diff = dot(N,L)*0.35 + 0.65` (tira os
   buracos pretos); cor `mix(uSkyCol*0.55, uSunCol*1.15, wrap)` + `fireCol*smoothstep(0.5,0,t)*(1-vUv.y)`;
   na emissão, `vy −= rnd(10,25)` (norte da tela) e `grow` maior para o topo — vira coluna inclinada pelo vento, não bola.
4. **Explosão na água** (`fx3Harvest`/`fx3Explosion`): `z = max(g, WATER_LEVEL) + 4`; clarão curto acima da
   superfície; `PT_STEAM` maior (8–14, `grow` 20) com a mesma erosão da fumaça e alfa 0,6 (acaba a "pipoca");
   2 anéis decal tipo 4 brancos (`r1 = s*3`, vida 0,8 e 1,4 s) e uma mancha de espuma que dura 3 s.
5. **Disparos legíveis** (`fx3Muzzle`, `premium.js:887`): clarão de cano com vida 0,05 → 0,09 s e 2 quadros (estrela
   + bola menor); traçante tamanho 1,5 → 2,4, cor HDR ×12 com cabeça branca e cauda laranja; luz do cano raio 40 → 60.
   Faíscas: rampa `mix(vec3(1,0.95,0.8), vec3(1,0.35,0.05), t)`, vida 0,5–1,1 s.
6. **Cristais que iluminam** (`T3_CRYSTAL_FS`, `T3_FS`, `gatherLights`): emissão na ponta chegando a 3–4 (passa do
   limiar → halo de bloom); variação por faceta `hue += hash(floor(N*4))*0.15` e gradiente interno escuro→claro;
   sombra dos cristais a 40% (`sh = mix(1, sh, 0.4)`); no chão, termo `stain * vec3(0.03,0.25,0.22) * pulso` como luz
   ciano difusa; veios com pulso correndo `fract(dist*0.05 - uTime*0.4)` e cor ciano HDR 1,5 (não branco‑leite);
   1 luz ciano fraca (raio 90) por aglomerado visível, até 4.
7. **Atmosfera** (pós/`applyFow`): distorção de calor sobre fogo (offset de UV por ruído em volta das luzes ativas,
   amplitude 2–3 px); partículas de poeira/pólen flutuando (PT_DUST alfa 0,1, 40 unidades na tela); bruma azulada no
   fundo dos cânions por altura (`mix(col, haze, smoothstep(-10,-50,z)*0.35)`); sombras de nuvem visíveis (30%).
8. **Névoa mais leve** (`applyFow`): base da nuvem 0,016 → 0,045, memória `*0.5` → `*0.68`, e uma borda iluminada
   fina `smoothstep(0.35,0.5,expl)*smoothstep(0.65,0.5,expl)*0.08*uSunCol` para trocar o anel sujo por contorno de nuvem.
