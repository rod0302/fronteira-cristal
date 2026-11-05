# Premium — Rodada 1 — Crítica de efeitos (VFX / pós / atmosfera)

Revisor: técnico de VFX independente. Base: capturas `logs/capturas/premium-r1/` (01, 04, 05, 06, 07) e capturas próprias
(explosão grande a 25% da velocidade em 6 momentos, batalha 16x16 com zoom 1,9, lago e cristais com zoom 2,6–2,8,
névoa de guerra com zoom 1,0 e 0,6). Não avaliei fps (SwiftShader).

## Notas

| Área | Nota |
|---|---|
| (a) Explosões e fogo | **4/10** |
| (b) Fumaça e partículas | **4/10** |
| (c) Água e cristais | **4/10** |
| (d) Névoa de guerra e atmosfera | **3/10** |
| (e) Pós-processamento | **5/10** |
| (f) Impacto geral | **4,5/10** |

O que já funciona: o pipeline HDR → bloom 13 amostras → ACES está correto; as luzes pontuais das explosões e o
reflexo especular do clarão no lago (07) são o melhor momento do modo; faíscas esticadas pela velocidade e destroços
que quicam têm boa base; o "fogo recortado por ruído" no shader é a ideia certa. Mas o resultado na tela ainda é de
um protótipo competente, não de algo "visualmente apaixonante".

### O que vi, por área

**Explosões (07 e sequência própria).** Quadro 1: bola laranja pequena e um anel branco perfeito, fino, flutuando
por cima de tudo (inclusive da água) — parece um círculo de interface, não uma onda de choque. Já em ~0,17 s de jogo
o fogo acabou e virou fuligem marrom. Dali em diante só existe uma mancha escura redonda, sem forma interna, que
cresce até ~3x o tamanho da explosão e fica 4–5 s parada ali como um borrão desfocado. Não há fase de "bola de fogo
crescendo", explosões secundárias, coluna subindo nem brasas no chão. Em batalha, as explosões de unidade são lidas
como "pó cinza".

**Fumaça.** `PT_DARK` com base 0,05 e iluminação quase só ambiente → mancha preta chapada. O fade é por alfa global
(não por erosão da densidade), então a borda é uma gaussiana macia: "blob". O crescimento (`grow` até 30 u/s por 3–5 s)
deixa as nuvens enormes. Sem depth fade: sprites cortam no chão e, com `c.z -= size*0.004`, a fumaça passa por cima de
unidades que estão na frente dela.

**Faíscas/disparos/traçantes.** Clarão do cano é um ponto branco redondo (gaussiana), sem forma de cone/estrela e sem
direção. Traçantes de bala são riscos de ~1 px, curtos (velocidade × 0,035), quase invisíveis no zoom 1,5. Impacto
em blindagem e impacto no chão usam a mesma receita.

**Água (05, lago no zoom 2,6).** Plano verde-azulado chapado. Com a câmera quase de cima, o Fresnel fica em ~0,02
e a água não reflete nada (nem céu, nem paredões). As ondas (normal × 0,22) não aparecem. Não há faixa rasa
turquesa na margem nem refração do fundo; a "espuma" virou um contorno branco de 1 px, como traço vetorial.
O paredão do cânion entra na água sem continuidade.

**Cristais.** Plástico ciano opaco. A emissão (`core * glow * 0.75`, até ~1,4) fica abaixo do limiar do bloom (1,6),
então não há halo nem luz projetada no chão. Pior: a cintilação (`tw * 2.5` branco) estoura as pontas em branco puro,
o que parece defeito. Os veios no chão são legais, mas finos demais e sem brilho.

**Névoa de guerra (06, captura própria).** Não explorado = vazio azul-marinho quase preto, com um fbm imperceptível.
A área visível é um "buraco de lanterna" de borda gaussiana lisa, e a transição passa por um marrom/laranja queimado
(escurecimento sem dessaturação antes) que parece papel queimado. Não tem volume, nuvem nem relevo sugerido.
A área explorada mas fora da visão (cinza-azul frio) é a ideia certa, mas o contraste com o não explorado é pequeno.

**Atmosfera.** A sombra de nuvem existe (mínimo 0,62, escala 2400), mas quase não se vê em nenhuma captura.
Não há bruma por altura nos cânions, perspectiva aérea, poeira no ar nem variação de luz. O fundo dos cânions tem
a mesma nitidez e contraste do planalto, então a profundidade some.

**Pós.** ACES + gradação + vinheta 0,85 + grão: corretos, mas o bloom só pega explosões (limiar 1,6, `uBloomK 0.55`).
`uFlash` está ligado no shader, mas sempre recebe 0. Não há distorção de calor, exposição dinâmica nem LUT/clima por
mapa. A vinheta forte somada à névoa escura deixa as bordas da tela "sujas". Tilt-shift só no título: OK.

**Seleção e marcas no chão.** O anel de seleção é uma poça verde desfocada (halo de 0,3 de largura + anel de 0,1) que
parece mancha de luz, não um anel nítido. A marca de queimado (multiply 0,82) vira um buraco preto sem borda quente.
Os destroços pequenos espalhados pelo chão viram ruído escuro.

## Correções prioritárias (máx. 10)

1. **Reescrever a explosão em fases** (`fx3d.js: fx3Explosion`, `shaders.js PART_FS type 1/4`).
   - *Problema:* o fogo morre em ~0,2 s, a bola é pequena, não há sub-explosões e o anel branco é "de UI".
   - *Como deve ser:* clarão 0,06–0,1 s com 3× o tamanho e HDR alto (core 12–20, para estourar o bloom); bola de fogo
     de 0,6–1,1 s com crescimento ease-out (`size = s*(0.4+1.6*(1-pow(1-t,3)))` em vez de `grow` linear);
     2 a 4 sub-explosões atrasadas 0,05–0,3 s e deslocadas 0,3–0,6·s; transição fogo→fumaça entre t = 0,45 e 0,75 com
     rampa de corpo negro (branco-amarelo → laranja → vermelho → fuligem), em vez de começar a escurecer em t = 0,3.
     Fogo com `drag 1.2` e `lift 60` (sobe, não se espalha).
   - *Onda de choque:* trocar o anel branco aditivo por (i) anel de poeira no chão, cor da areia, alfa ≤ 0,35, quebrado
     por ruído angular forte (`ring *= smoothstep(0.3,0.7,vnoise(...))`); (ii) 12–20 partículas `PT_DUST` em anel
     rente ao chão, velocidade radial 120–180; e (iii) distorção de tela (ver item 8). Não desenhar sobre água: na água,
     fazer um anel de espuma.
   - *Chão:* queimado com brasas: o decal tipo 0 recebe emissão laranja (`ember = (1-t/4)*smoothstep(.6,.9,noise)`) por 3–4 s.

2. **Fumaça com forma, luz e dissolução** (`PART_FS` tipos 0/7, `fx3d.js`).
   - *Problema:* blob gaussiano preto, uniforme, sem lado iluminado.
   - *Como deve ser:* dissolver por erosão em vez de alfa global: `a = smoothstep(t*0.7, t*0.7+0.25, tex.a)`; distorcer
     a UV do atlas com fbm animado (`auv += (fbm3(vUv*2+t)-0.5)*0.08`); iluminação wrap
     `diff = clamp((dot(N,L)+0.4)/1.4,0,1)` com peso 1,0 do sol e sombra própria pela densidade
     (`col *= mix(0.45,1.0,1.0-tex.a*0.7)`).
   - `PT_DARK`: base 0,05 → (0,11; 0,095; 0,085); opacidade de pico ≤ 0,6.
   - Tamanho: limitar `grow` (máx. ~2,5× o tamanho inicial) e subir a coluna: `lift 25–35`, `drag 0.6`, vento que cresce
     com a altura (`vx += (4 + z*0.08)*dt`). A fumaça precisa *subir e inclinar* com a projeção oblíqua (K = 0,7), não ficar
     parada como uma poça.

3. **Partículas suaves (depth fade) e fim do "puxa pra frente"** (`premium.js drawParticles3D`, `PART_VS`).
   - Copiar a profundidade da cena (já há blit de profundidade para `T.scene`) para uma textura e, no `PART_FS`,
     `a *= clamp((sceneZ - fragZ) * k, 0, 1)` (e o mesmo para `col`).
   - Remover `c.z -= size*0.004`, que faz a fumaça passar por cima de unidades que estão na frente dela.
   - Isso corrige os cortes duros no chão e nos paredões e é o que mais separa "amador" de "AAA" em partículas.

4. **Névoa de guerra com volume, não um buraco preto** (`glsl.js applyFow`, `FOW_*`).
   - Não explorado: em vez de `dark = 0.006…`, uma camada de nuvem estilizada: fbm com domain warp animado, topo
     iluminado pelo sol (`nuvem = mix(vec3(0.05,0.07,0.11), vec3(0.32,0.36,0.45), n*n)`) e leve paralaxe (amostrar em
     `P.xy + vec2(0, 40*K)`), para parecer um teto de nuvens acima do terreno.
   - Borda: distorcer a busca na textura da névoa com ruído
     (`f = texture(uFow, (P.xy + (fbm3(P.xy*0.02+uTime*0.05)-0.5)*48.0)/uMapSize)`) para fazer fiapos, não um círculo liso.
   - Matar o anel marrom: aplicar primeiro dessaturação/esfriamento (`mem`) e só depois escurecer; acrescentar uma
     faixa fina de bruma clara na borda (`edge = vis*(1-vis)*4` → `+ skyCol*0.08*edge`).
   - A área explorada mas fora da visão deve ser legível (luminância ×0,55, não ×0,42) para separar bem de "nunca visto".

5. **Água que reflete** (`terrain3d.js T3_WATER_FS`).
   - *Problema:* vista de cima, o Fresnel ≈ 0 e o resultado é tinta chapada.
   - *Truque barato e certo para esta projeção oblíqua:* o reflexo de um ponto à altura h aparece deslocado na tela em
     2·K·(h − nível da água). Depois de desenhar o terreno, copiar a cena e amostrar na água em
     `uv + vec2(0, 2*K*(hEstimada)/telaH) + N.xy*0.02`. Isso já dá o paredão refletido. Piso de Fresnel 0,12–0,2
     (estilizado), não 0,02.
   - Normal das ondas de 0,22 → 0,45 na escala pequena, com duas direções cruzadas.
   - Margem: faixa rasa turquesa larga (profundidade 0–5) com cáusticas por voronoi (`pow(1-voronoi(p*0.08+t).y, 8)`);
     refração do fundo (`bed` amostrado com `+ N.xy*depth*0.6`).
   - Espuma: faixa de 3–8 u quebrada por ruído que "respira" (`sin(uTime*1.5 - depth*2)`), não o contorno de 1 px.

6. **Cristais que brilham de verdade** (`T3_CRYSTAL_FS`, `T3_FS`).
   - Emissão em HDR acima do limiar: ponta 3–6, base 0,6 (`glow = 0.6 + 5.0*pow(vLocal.x,2.0)`), para o bloom pegar.
   - Translucidez fake: `col += core * pow(clamp(dot(-N, uSunDir),0,1),2) * 1.5` mais um gradiente interno.
   - Cintilação colorida (`vec3(0.6,1,1)*tw*0.8`), não branco ×2,5, que estoura.
   - No chão: decal aditivo radial ciano por aglomerado (raio ~1,2 tile, 0,15–0,3) e veios mais largos (`smoothstep(0,0.06,v)`)
     com emissão 1,2. Partículas `PT_GLINT` ocasionais subindo do campo (1–2 por tile a cada poucos segundos).

7. **Clarão de cano, traçantes e impactos** (`fx3Muzzle`, `PART_VS/FS` tipos 4 e 8).
   - Clarão com forma: um quad orientado pelo ângulo, alongado 2,5:1, com 3–4 "pétalas"
     (`g *= 0.6+0.4*cos(atan(uv.y,uv.x)*4 + seed*6)`), giro aleatório por tiro e núcleo branco HDR 10+ → corpo laranja.
   - Traçante: comprimento = velocidade × 0,06–0,08, largura 1,5–2 px com núcleo HDR 15 e halo laranja; visível em todo quadro.
   - Impacto em blindagem: faíscas brancas-azuladas + flash curto; impacto no chão: poeira e terra (cor do albedo do terreno),
     não o mesmo `fx3Hit`.

8. **Pós-processamento: usar o que já está ligado** (`premium.js` composição, `COMPOSITE_FS`, `BLOOM_DOWN_FS`).
   - Limiar do bloom 1,6 → 1,0 (knee 0,5) e `uBloomK` 0,55 → 0,8, com mais um nível de mip, para um halo largo e suave.
   - Ligar `uFlash` nas explosões grandes (0,08–0,15, decaindo em 0,15 s) e uma variação curta de exposição (+0,15 EV).
   - Distorção de calor: um alvo meia resolução onde fogo/clarão escrevem um deslocamento; na composição,
     `uv += (tex(dist).rg-0.5)*0.008`.
   - Vinheta 0,85 → 0,5 (somada à névoa escura, está pesada).

9. **Anel de seleção nítido** (`DECAL_FS` tipo 2).
   - Trocar o halo largo (0,3) por um anel antisserrilhado com `fwidth`:
     `ring = 1 - smoothstep(0, fwidth(r)*1.5, abs(r-0.86) - 0.025)`; halo interno ≤ 0,12 de intensidade.
   - 4 arcos que giram devagar, um pulso de 0,25 s ao selecionar e cor por time/aliado/inimigo.
   - Hoje parece uma poça verde no chão.

10. **Atmosfera e profundidade** (`glsl.js shade/applyFow`, `T3_FS`).
    - Bruma por altura: `haze = clamp((zRef - P.z)/80, 0, 1)*0.35`, misturando em `skyCol*0.7` — fundo de cânion azulado e
      mais suave, planalto nítido. É o que vai dar escala ao mapa.
    - Sombras de nuvem mais presentes: mínimo 0,62 → 0,45, borda mais definida (`smoothstep(0.5,0.62,c)`) e escala 1600.
    - Poeira no ar: 30–60 partículas ambiente lentas na área da câmera, brilhando contra o sol.
    - Destroços pequenos somem em ~20 s; hoje viram ruído escuro.
    - Queimado com borda queimada marrom (não preto 0,82 chapado).

## Veredito

Base técnica correta (HDR, ACES, luzes dinâmicas), mas os efeitos que deveriam encantar (explosão, fumaça, água,
cristais, névoa) ainda leem como borrões e superfícies chapadas: hoje é "bonito para um jogo de navegador", ainda
longe de "visualmente apaixonante".
