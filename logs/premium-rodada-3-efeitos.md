# Premium — Rodada 3 — Crítica de efeitos (VFX / pós / atmosfera)

Revisor: técnico de VFX independente (não construí o modo). Base: `logs/capturas/premium-r3/` (01, 04, 05, 06, 07) e
capturas próprias 1280x720, `escalagl=1`, mouse no centro, 4 s de bake (cópias em `logs/capturas/premium-r3-efeitos/`):
explosão grande (s = 16, big) a 25% da velocidade em 7 momentos; explosão no lago; batalha 12x12 com ordem de
atacar‑movendo a 50% (6 quadros + recorte ampliado); campo de cristais de perto; borda da névoa. Não avaliei fps.

## Notas

| Área | R1 | R2 | **R3** |
|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | **5,5/10** |
| (b) Fumaça e partículas | 4 | 4,5 | **4,5/10** |
| (c) Água e cristais | 4 | 5 | **5/10** |
| (d) Névoa de guerra e atmosfera | 3 | 6 | **6,5/10** |
| (e) Pós‑processamento | 5 | 5 | **5,5/10** |
| (f) Impacto geral | 4,5 | 5 | **5,5/10** |

**Veredito: a batalha em movimento já tem momentos bonitos (fogo + luz no chão + reflexo no lago), mas a explosão
ainda é "clarão estourado → discos laranja → algodão cinza", e metade das correções de efeitos da R2 (traçantes,
clarão de cano, cristais, explosão na água, soft particles) não foi feita.**

## O que melhorou desde a R2
- Anel de choque com cara de UI sumiu de vez. Bom.
- Luz das explosões no lago agora é reflexo especular (04, 07, batalha): é o melhor efeito do modo hoje.
- Na batalha de verdade (b3z) há fogo, fumaça, luz quente pintando o chão, marcas de queimado no chão (decals)
  e destroços: de longe lê como "combate". `uFlash` ligado. Vinheta/aberração mais contidas.
- Névoa com tom azulado e topo quente: as nuvens ficaram mais bonitas.

## O que vi, por área

### (a) Explosões e fogo — 5,5
- **Quadro 0 (boomzoom, esquerda): bolha branca‑amarela estourada**, sem gradiente de temperatura nem forma: o
  `PT_FLASH` (1,4·s, HDR 5) + miolo branco (`*5.0`) + luz pontual de raio s·8+50 ≈ 180 px de mundo saturam tudo.
  O chão num raio enorme fica amarelo chapado (cara de holofote, não de explosão).
- **Quadro 0,15 s de jogo (boomzoom, direita): a fumaça escura cobre a bola de fogo.** `PT_DARK` nasce no mesmo
  instante e lugar do fogo, com `fade = smoothstep(0,0.12,t)` (aparece em ~0,3 s de vida de 3–5 s → quase
  imediato) e é misturada por alfa por cima do fogo, que é aditivo. Resultado: lóbulos laranja espiando por baixo de
  um bolo cinza. O fogo nunca "domina" a tela; aos 0,35 s de jogo já é só fumaça (boomgrid quadro 3).
- **Fogo = discos laranja lisos** (lóbulos circulares nítidos, cor quase uniforme `fireRamp` laranja). Falta
  borda escura vermelho‑marrom, núcleo amarelo pequeno e contraste interno; a turbulência a 3,3 quase não se vê.
- **Explosão no lago (aguaz): sprites cortados em fatias horizontais pelo plano da água** — prova direta de que não
  há soft particles. Nenhuma coluna d'água, espuma ou respingo (correção 9 da R2 não feita).
- Sem cratera/queimado sob a explosão grande filmada (só aparece nas mortes de unidades na batalha).

### (b) Fumaça e partículas — 4,5 (parado)
- A coluna continua "algodão sujo": bloco cinza com buracos escuros internos (normais do atlas lidos como sombra),
  borda gaussiana. A erosão usa `fbm3(vUv*1.6)` — frequência baixa demais para fiapos (a R2 pediu 3,2 + 8).
- Iluminação chapada: `diff*0.6+0.4` + céu; sem lado frio/lado quente, sem brilho do fogo por baixo depois de
  t = 0,25.
- **Faíscas são quadradinhos brancos de 1–2 px** (sem esticamento visível, sem rampa branco→laranja→vermelho):
  leem como confete/ruído digital, não como metal incandescente.
- **Traçantes e clarão de cano idênticos à R2** (`premium.js:854` tamanho 1,0 e esticamento ×0,5; `fx3Muzzle` ponto
  gaussiano redondo). Na batalha vi um único traço branco; a troca de tiros não é legível.
- Rastros de esteira são escadinhas regulares que, com várias unidades, viram listras horizontais paralelas
  (parecem rastro de movimento/ghosting).

### (c) Água e cristais — 5
- Água: superfície com granulado fino e uniforme ("lixa"/alumínio martelado) sem escala de ondas, sem gradiente
  raso→fundo perceptível; margem = linha clara regular. O reflexo especular do sol e das explosões é bom.
  Reflexo das paredes do cânion não se nota.
- Cristais (cristal.png): **plástico ciano sem brilho** — nenhum halo de bloom, nenhuma luz no chão ou nas unidades
  vizinhas, veios no chão finos e apagados. `glow*pulse*0.75` (`terrain3d.js:658`) continua abaixo do limiar 1,6.
  Correção 7 da R2 não feita. Para um jogo chamado *Fronteira Cristal*, é o maior desperdício visual.

### (d) Névoa de guerra e atmosfera — 6,5
- Nuvens com relevo, topo quente e borda torcida: bonitas e animadas.
- Problemas: há um **anel escuro "sujo"** entre o visível e a nuvem (memória `col*0.5` azul‑cinza + base de
  nuvem 0,016 quase preta) — lê como vinheta borrada, não como borda de nuvem iluminada. Nuvens azul‑marinho escuras
  demais no conjunto (06): pesam 40% da tela. Sem altura/parallax: cristais na borda são cortados pela linha do chão.
- Atmosfera: sem bruma no fundo do cânion, sem poeira no ar, sem distorção de calor. Sombra de nuvem imperceptível.

### (e) Pós‑processamento — 5,5
- Pipeline correto (HDR, bloom, ACES, FXAA, grão) e `uFlash` agora ligado; vinheta mais leve. Mas `uExposure` e
  `uBloomK` fixos, limiar 1,6 fixo: o bloom só pega explosões e sol na água (que saturam), nada de cristais/luzes de
  prédio. Explosões estouram para branco — falta exposição/tonemap que preserve a cor do fogo.
- Tilt‑shift do título (01) bonito; ali o fundo borrado está bom.

### Seleção e decais
- Anel de seleção ficou nítido (OK). Barras de vida chapadas, sem integração. Queimados no chão nas mortes: bons.

## Correções prioritárias (máx. 8)

1. **Fogo na frente, fumaça depois** (`fx3d.js fx3Explosion`, `shaders.js PART_FS`, `premium.js drawParticles3D`).
   Emitir `PT_DARK`/`PT_SMOKE` da explosão via `pfx.later` com atraso 0,25–0,4 s (ou `fade = smoothstep(0.08, 0.25, t)`
   só para tipo 7 em explosões), e desenhar os aditivos (fogo, faísca, clarão) **numa segunda passada depois** das
   partículas com alfa. Meta: fogo ocupando a tela de 0,05 a 0,7 s.
2. **Soft particles** (`PART_FS`): amostrar a profundidade da cena já resolvida,
   `a *= clamp((sceneZ - fragZ) / (0.03*size), 0, 1)` (e o mesmo fator em `col`). Mata as fatias no lago e o corte
   em penhascos/unidades. Pedido desde a R1.
3. **Clarão e luz sem estourar** (`fx3Explosion`): `PT_FLASH` 1,4·s → 0,8·s, vida 0,12 → 0,07; miolo branco `*5.0` →
   `*2.5` e raio `smoothstep(0.3,0,r)`; luz pontual raio `s*8+50` → `s*4.5+30`, cor (4,5/2,6/1,1) → (3/1,6/0,6) com
   queda quadrática. Mantém o laranja legível em vez de "tela branca".
4. **Fogo com forma** (`PART_FS type 1`): rampa com borda escura `mix(vec3(0.35,0.05,0.01), fireRamp(heat), smoothstep(0.1,0.5,dens))`;
   turbulência 3,3 → 5 com segunda oitava `vnoise(fu*9.0 - t*4.0)*0.3`; `heat` mais dependente de `1-dens` (0,6 → 1,0)
   para núcleo pequeno amarelo e bordas vermelhas; 6–8 sprites maiores em vez de 14.
5. **Disparos legíveis** (repetido da R2, não feito): traçante `premium.js:854` tamanho 1,0 → 1,8, esticamento ×0,5 →
   ×1,6, cor ×12; `fx3Muzzle` com sprite direcional em cone/estrela (2–3 quadros, HDR 8). **Faíscas**: esticar pela
   velocidade (comprimento ≥ 6 px), rampa `mix(vec3(1,0.95,0.8), vec3(1,0.3,0.05), t)`, vida 0,5–1,1.
6. **Cristais que brilham** (`terrain3d.js:654–658`, `gatherLights`): emissão no miolo 2,5–4 (passar do limiar),
   transmissão `pow(1-NdV,1.5)*core*1.5`, luz ciano fraca (raio 90) por aglomerado visível (até 4), veios no chão com
   pulso correndo `fract(dist*0.05 - uTime*0.4)` e `PT_GLINT` lentos sobre o campo.
7. **Fumaça com fiapos e luz** (`PART_FS type 0/7`): erosão `fbm3(vUv*3.2)*0.6 + vnoise(vUv*8.0)*0.4`; reduzir o peso
   das normais do atlas (buracos pretos) com `diff = dot(N,L)*0.35+0.65`; cor `mix(uSkyCol*0.6, uSunCol*1.2, wrap)`;
   brilho de fogo por baixo até t = 0,5 (`col += fireCol * smoothstep(0.5,0,t) * (1-vUv.y)*…`). Alfa máx. 0,6.
8. **Água e névoa** (`T3_WATER_FS`, `fx3Explosion`, `applyFow`): explosão na água com coluna de `PT_STEAM` branca
   (vz 120–220, g −300), gotas e anel de espuma, sem `PT_DARK`; ondas em duas escalas (grande lenta + fina) e
   gradiente raso→fundo `k = 1-exp(-depth*0.06)`; na névoa, clarear a base da nuvem (0,016 → 0,04) e trocar a faixa
   de memória `*0.5` por `*0.7` com uma borda iluminada fina `smoothstep(0.35,0.5,expl)*smoothstep(0.65,0.5,expl)*0.06*uSunCol`
   para tirar o anel escuro sujo.
