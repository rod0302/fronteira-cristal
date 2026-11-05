# Premium — Rodada 2 — Crítica de efeitos (VFX / pós / atmosfera)

Revisor: técnico de VFX independente (não construí o modo). Base: capturas `logs/capturas/premium-r2/` (01, 04, 05, 06, 07)
e capturas próprias em 1280x720 com `escalagl=1`, mouse no centro e 4 s de espera para o bake:
explosão grande (s = 18) filmada a 25% da velocidade em 6 momentos; batalha 5x5 encenada (tanque, foguete, obuseiro,
batedor, soldado) em 6 quadros; lago de perto; explosão sobre a água; campo de cristais de perto; recorte da borda da névoa.
Não avaliei fps (SwiftShader).

## Notas

| Área | R1 | **R2** |
|---|---|---|
| (a) Explosões e fogo | 4 | **5/10** |
| (b) Fumaça e partículas | 4 | **4,5/10** |
| (c) Água e cristais | 4 | **5/10** |
| (d) Névoa de guerra e atmosfera | 3 | **6/10** |
| (e) Pós-processamento | 5 | **5/10** |
| (f) Impacto geral | 4,5 | **5/10** |

**Veredito: subiu de "protótipo" para "indie caprichado" — a névoa em nuvens e a explosão em fases são avanços reais,
mas fumaça de algodão cinza, anéis de choque com cara de interface, água de piscina e uma batalha que de longe vira
"poeira cinza" ainda impedem o "visualmente apaixonante".**

## O que vi, por área

### (a) Explosões e fogo — 5
Melhorou: agora há fases (clarão → bola de fogo → coluna), sub‑explosões atrasadas (`pfx.later`), destroços que
quicam e luz pontual que pinta o chão. O quadro de 0,7 s (bola de fogo + fumaça nascendo + faíscas) é o melhor
momento do modo.

Ainda errado:
- **Anéis perfeitos no primeiro quadro.** Cada sub‑explosão empilha seu próprio decal tipo 4 (aditivo, cor
  (1, 0,6, 0,3), alfa 0,8): no zoom vê‑se 2–3 círculos finos e nítidos sobrepostos ao clarão — leitura de "círculo de
  mira", não de onda de choque. O problema da R1 persiste, só ficou laranja.
- **Bola de fogo = pilha de discos.** Com 12–22 sprites de raio 0,55–1,0·s, a silhueta lê como bolinhas laranja
  separadas (lóbulos circulares visíveis), sem núcleo branco‑quente contínuo. O recorte por `fbm3` a 1,7 é grosso
  demais para desenhar labaredas; não há distorção UV/rolagem interna.
- **Fogo some cedo demais em relação à fumaça.** Em ~1,6 s (tempo real 0,4 s) só resta um bloco cinza; a proporção
  fogo:fumaça na tela é ~1:6 em área‑tempo. Explosões de RTS AAA (CoH, SupCom, BAR) vivem do fogo nos primeiros 0,3–0,8 s.
- **Explosão na água** (captura própria): nenhuma coluna d'água, anel de espuma ou respingo — só fogo flutuando e um
  disco leitoso enorme no lago inteiro (ver água).
- Clarão de cano (`fx3Muzzle`) ainda é ponto gaussiano redondo de 6–13 px; na batalha encenada, a 1,8x de zoom, quase
  não se vê. Traçantes de bala existem (`premium.js:854`, tamanho 1,0, vel × 0,5 × 0,035), mas ficam com ~1 px de largura e poucos px de comprimento: na batalha encenada não os enxerguei.

### (b) Fumaça e partículas — 4,5
- **Algodão sujo.** A coluna escura vira um bloco cinza‑marrom único, de borda macia, com "buracos" escuros internos
  (normais do atlas lidas como sombra), 3–4x o tamanho da explosão, parado por 4+ s. Erosão por ruído existe
  (`smoothstep(t*0.55, ...)`), mas a frequência (`vUv*1.6`) é baixa: não há fiapos, a borda continua gaussiana.
- **Sem luz própria interessante:** `diff*0.6+0.4` + `uSkyCol*1.1` deixa a fumaça quase chapada; não há lado do sol
  claro / lado oposto azulado, nem sombra própria. O brilho de fogo de dentro (`smoothstep(0.25,0,t)*1.5`) dura pouco.
- **Sem partículas suaves (soft particles).** O programa de partículas não lê a profundidade; fumaça e poeira cortam
  em linha reta na beira do penhasco (quadro 3 da sequência) e passam por cima de unidades. `c.z -= size*0.0012` é
  remendo.
- **Faíscas** são pontos brancos de 1–2 px, curtos (esticados por `vel*0.035`); com 0,35–0,9 s de vida e gravidade
  -320 caem como confete. Falta temperatura (branco→laranja→vermelho escuro) e cauda mais longa.
- **Batalha:** de longe, tiros de tanque = puff cinza de 10 px; foguetes deixam rastro curto. A batalha é legível,
  mas não "pega fogo".

### (c) Água e cristais — 5
Água:
- No ângulo de jogo o lago é um plano azul‑petróleo uniforme com granulado fino; o gradiente raso→fundo e a faixa
  turquesa quase não aparecem. A margem é um contorno claro fino e regular ao longo de todo o perímetro (lê como
  traço vetorial, não espuma).
- O reflexo das paredes do cânion (busca de 14 passos) não se nota nas capturas: o plano fica do mesmo tom de ponta a ponta.
- O brilho do sol (04, 07) é bonito, mas é a única coisa viva na água.
- **Bug visual:** luzes de explosão somam `uLightCol * f² * 0.15` como difuso na água. Com a luz de explosão
  (cor 4,5/2,6/1,1, raio s·8+50 ≈ 190) o lago inteiro vira um disco branco‑leitoso. Água não tem difuso; isso deveria
  ser quase só especular + um pouco de dispersão sob a superfície.

Cristais:
- Bons em forma (aglomerados inclinados, veios no chão), mas ainda leem como **plástico ciano**. A emissão
  (`glow*pulse*0.75`, ~2,1 só na ponta) quase não passa do limiar do bloom (1,6): não há halo, e os campos de cristal
  não projetam luz no chão nem nas unidades. Os veios ciano no chão são finos e sem brilho.
- Sem refração/transmissão interna, sem facetas com reflexo nítido, sem "pó" brilhante no ar sobre o campo.

### (d) Névoa de guerra e atmosfera — 6 (maior avanço)
- O não explorado virou camada de nuvens com topo iluminado e borda desfiada por ruído — muito melhor que o vazio
  azul‑marinho da R1. A borda com warping (`w*46`) funciona.
- Problemas: as nuvens são **cinza neutro sujo** (0,11 → mid‑grey após ACES) e lembram fumaça de incêndio; sem
  tingimento do céu nem lado de sombra frio. Como é aplicada por superfície (`applyFow`), não tem altura: cristais e
  prédios na borda são cortados pela mesma linha do chão, sem parallax de volume. Não vi variação na faixa
  "explorado mas fora de visão" que a separe bem do visível.
- Atmosfera geral: sombra de nuvem ainda imperceptível; não há bruma no fundo dos cânions nem poeira no ar; a
  vinheta forte mais o escuro da névoa sujam as bordas da tela.

### (e) Pós‑processamento — 5
- Pipeline correto (HDR, bloom 13 amostras, ACES, gradação, grão, FXAA), mas **parado**: `uExposure` 1,0 fixo,
  `uBloomK` 0,55 fixo, `uFlash` **ainda sempre 0** (mesma crítica da R1), sem distorção de calor, sem exposição
  dinâmica, sem LUT por mapa.
- Limiar 1,6 faz o bloom pegar só explosões e o sol na água; cristais, luzes de prédio e faixas de equipe não brilham.
- Aberração cromática + vinheta 0,85 empurram para "filtro de celular". Tilt‑shift só no título: certo.

### Seleção e marcas
- Anel de seleção continua sendo um **halo verde borrado** (anel 0,1 + halo 0,3·0,35, ×2,2 aditivo) que lê como
  poça de luz e polui a leitura em grupo. Rastros de esteira e cantos de prédio estão bons.

## Correções prioritárias (máx. 10)

1. **Onda de choque sem cara de UI** (`fx3d.js fx3Explosion`, `shaders.js DECAL_FS type 4`, `premium.js:547`).
   Só a explosão principal emite onda (não as `later`). Trocar o anel aditivo laranja por decal *multiply* de poeira
   + um anel de partículas `PT_DUST` rentes ao chão (16–24, vel. radial 140–200, drag 3, alfa 0,4).
   No shader: `ring = smoothstep(0.35,0.0,abs(r-k))*smoothstep(0.25,0.7,fbm3(vec2(ang*4.0, r*2.0)))`, cor da areia,
   largura que aumenta e alfa ≤ 0,3. Distorção de tela no lugar do brilho (item 6).
2. **Bola de fogo contínua e quente** (`PART_FS type 1`). Usar no máximo 6–8 sprites maiores (1,1–1,6·s) com UV
   rolante: `uv += (fbm3(uv*3.0 + seed + t*2.0)-0.5)*0.35`; densidade com ruído de frequência 3–4 (não 1,7); núcleo
   branco‑amarelo HDR 10–14 em `dens>0.7` nos primeiros 30% da vida; `heat` guiado por `t` e por `1-dens`. Estender
   vida para 0,9–1,4 s e manter emissão até t = 0,6. Fumaça só começa a dominar depois de 0,5 s.
3. **Soft particles** (`premium.js drawParticles3D`, `PART_FS`). Resolver a profundidade antes (já há blit de DEPTH) e
   amostrá‑la: `a *= clamp((sceneZ - fragZ) * K, 0, 1)` com K ≈ 1/(0,03·size). Resolve corte na beira do penhasco e
   sprites atravessando unidades; retirar o `c.z -= size*0.0012`.
4. **Fumaça com forma e luz** (`PART_FS type 0/7`, `fx3Explosion`). Erosão em duas oitavas
   (`ero = fbm3(vUv*3.2+...)*0.6 + vnoise(vUv*8.0+...)*0.4`) e limiar `smoothstep(t*0.7, t*0.7+0.15, ...)` para fiapos;
   iluminação `mix(uSkyCol*0.6 (frio), uSunCol*1.2 (quente), wrap)` com `wrap = dot(N,L)*0.5+0.5` e
   `thin*0.6` de luz atravessada; `grow` de fumaça escura limitado a s·0,6/s (hoje até 18) e alfa máximo 0,6.
   Interior iluminado pelo fogo por 0,6 s (não 0,25).
5. **Água de verdade** (`T3_WATER_FS`). (i) Luzes de explosão: tirar o 0,15 difuso → `0.01` + especular; (ii) amplitude
   da normal 0,32 → 0,5 e escala w1 260→400 para ondas legíveis; (iii) profundidade mais visível:
   `k = 1-exp(-depth*0.06)`, raso `vec3(0.1,0.42,0.38)`; (iv) espuma quebrada:
   `foam *= step(0.55, w3.r + 0.3*sin(uTime*1.3 + depth*3.0))` e largura variável; (v) reflexo das paredes com
   `mix` 0,85→ tingido pela altura e borrado, e escurecimento (oclusão) da água junto ao paredão.
6. **Pós vivo** (`premium.js:814`). Ligar `uFlash` (decai em 0,08 s, 0,15 por explosão grande próxima do centro);
   exposição dinâmica leve (média do bloom mip mais baixo → `uExposure` entre 0,85 e 1,1); distorção de calor:
   desenhar partículas de distorção num buffer RG e deslocar `uv` em `COMPOSITE_FS` (anel de choque + coluna quente).
   Reduzir vinheta para 0,5 e aberração para 0,003.
7. **Cristais que iluminam** (`T3_CRYSTAL_FS`, `gatherLights`). Emissão 2,5–4 no miolo para passar o limiar
   (ou baixar o limiar para 1,2 com `knee` 0,6); transmissão falsa `pow(1-NdV,1.5)*core*1.5` + facetas com
   especular afiado (rough 0,05); uma luz ciano fraca (raio 90, cor (0,2,0,9,0,8)) por aglomerado visível, até 4;
   veios no chão aditivos com pulso que corre (`fract(dist*0.05 - uTime*0.4)`); 1–2 `PT_GLINT` lentos por tile visível.
8. **Disparos e traçantes legíveis** (`fx3Muzzle`, `fx3Harvest`). Clarão em estrela/cone direcional: novo tipo com
   `g = exp(-abs(uv.y)*8)*smoothstep(1,0,uv.x)` orientado pela arma, 2–3 quadros, HDR 8. Traçante de bala (`premium.js:854`): tamanho 1,0 → 1,8, velocidade usada no esticamento × 0,5 → × 1,6 (comprimento ≈ 25–40 px), cor (1, 0,8, 0,45) × 12 para pegar bloom. Impacto em blindagem com faíscas
   amarelas + respingo de metal; no chão, poeira cor do terreno.
9. **Explosão na água** (`fx3Explosion`, ramo `g <= WATER_LEVEL+2`). Coluna d'água: 10–14 `PT_STEAM` brancos com
   vel. vertical 120–220 e gravidade -300, anel de espuma (decal aditivo branco 0,4 que se abre), 20 gotas `PT_SPARK`
   azul‑claro; nada de `PT_DARK`; fogo reduzido a 30%.
10. **Névoa com cor e volume** (`applyFow`). Tingir as nuvens: topo `uSunCol*0.18`, vale `vec3(0.03,0.04,0.07)`;
    deslocar a consulta por altura (`P.xy + vec2(0, P.z*0.7)`) para que prédios/cristais entrem no volume; uma faixa
    clara fina na borda (`smoothstep(0.35,0.5,expl)*smoothstep(0.65,0.5,expl)*0.06*uSunCol`) para "borda iluminada";
    e anel de seleção nítido: `ring = smoothstep(0.03,0.0,abs(r-0.86))*1.6 + halo*0.12` (corta o halo 3x).
