# Premium, rodada 6: crítica de efeitos (VFX, pós e atmosfera)

Revisor: diretor de VFX independente. Não alterei código do jogo.

**Material avaliado.** Capturas da rodada em `logs/capturas/premium-r6/` (04, 05, 06, 07, 07-sequência) e capturas próprias em `logs/capturas/premium-r6/efeitos-proprias/`. Todas as próprias foram feitas em 1280x720, com `escalagl=1`, mouse no centro e 4 s de bake. Não medi fps.

| Arquivo | Conteúdo |
|---|---|
| `land-*.png`, `land-seq.png`, `land-zoom.png` | Explosão grande (s = 16, big) em terra, na borda do cânion (960, 976). `fx3Update` foi congelado e avançado à mão até t = 0,03 / 0,12 / 0,3 / 0,6 / 1,0 / 1,6 / 2,5 / 4,0 s. O zoom mostra 1,0 s e 1,6 s. |
| `water-*.png`, `water-seq.png`, `water-zoom.png` | A mesma explosão no lago (1008, 1040; fundo a −50), nos mesmos instantes. O zoom mostra 0,03 s, 0,6 s e 1,6 s. |
| `batalha-1..4.png`, `batalha-zoom.png` | Batalha 16x16 (battle3) em câmera lenta 0,35x. |
| `cristais.png` | Maior campo de cristal, zoom 2,6. |
| `agua-zoom.png` | Recorte ampliado do lago de 05. |

## Notas

| Área | R1 | R2 | R3 | R4 | R5 | **R6** | Δ |
|---|---|---|---|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | 5,5 | 5,5 | 6 | **6,5/10** | +0,5 |
| (b) Fumaça e partículas | 4 | 4,5 | 4,5 | 5 | 5,5 | **6/10** | +0,5 |
| (c) Água e cristais | 4 | 5 | 5 | 5,5 | 5,5 | **6/10** | +0,5 |
| (d) Névoa de guerra e atmosfera | 3 | 6 | 6,5 | 6,5 | 6,5 | **6,5/10** | 0 |
| (e) Pós-processamento | 5 | 5 | 5,5 | 5,5 | 6 | **6/10** | 0 |
| (f) Impacto geral | 4,5 | 5 | 5,5 | 5,5 | 5,5 | **6/10** | +0,5 |

**Veredito:** a explosão finalmente conta uma história completa (clarão, fogo, fumaça, chamas no chão, cratera) e a da água fala a própria língua, mas o fogo virou "adesivo de desenho animado com contorno preto", os anéis na água parecem interface de sonar e água, cristais e pós ainda são de nível indie: bom e coerente, ainda longe do AAA.

## O que melhorou desde a R5

- **Fogo com estrutura interna.** Os dois fbm já recortam línguas e buracos (land-zoom 1,0 s). Não é mais o "pompom" liso.
- **Transição fogo → fumaça contínua.** Aos 1,6 s o fogo ainda queima *dentro* da fumaça escura. Aos 2,5 s sobra um foco laranja na base sob a coluna, e aos 4,0 s fica fuligem escura no chão. A leitura de peso melhorou muito.
- **Cratera queimada** com brasa na borda. As explosões secundárias dão irregularidade à forma.
- **Explosão na água própria.**
  - Não tem fogo nem fumaça escura.
  - Tem 3 anéis de onda, vapor branco, faíscas e uma mancha de espuma.
  - O reflexo do clarão no lago (water 0,03 s) é o quadro mais bonito da rodada.
- **Batalha:** a fumaça da batalha agora tem silhueta de coluna. A cratera com fogo residual junto ao tanque destruído (batalha-zoom) dá memória ao combate.

## O que vi, por área

### (a) Explosões e fogo: 6,5

- **Contorno de nanquim.** A fuligem (`soot`, PART_FS l.396) é calculada como faixa de densidade `smoothstep(0.6, 0.15, dens)`. Por isso ela vira um **anel escuro fino em volta de cada bolha** (land-zoom 1,0 s e 1,6 s; batalha-zoom). Lê como cel-shading, como adesivo, e não como fuligem misturada ao fogo. É o defeito novo mais visível da rodada.
- **Paleta de fogo achatada no amarelo-mostarda.** Os sprites são quase aditivos (alfa 0,25 no início) com ganho de 2,6. Somados, saturam em amarelo-creme, e não aparece o vermelho-escuro e o marrom da rampa. Falta contraste de valor entre miolo e borda: tudo fica entre 70 e 90% de brilho.
- **Clarão longo e grande demais.** De 0,03 a 0,6 s a tela inteira do recorte (cerca de 250 px de raio) fica lavada em amarelo pela luz pontual (`s*3.5+28`, vida 0,5) somada ao bloom. São 0,6 s de "sol" sem forma, mais longos que a própria bola de fogo legível. Uma explosão AAA tem flash de 2 a 4 quadros e depois a forma.
- Faíscas ainda curtas e todas da mesma cor. Os destroços continuam pedrinhas azul-ardósia, iguais às pedras do mapa.

### (b) Fumaça e partículas: 6

- A coluna tem mais variação interna e boa deriva com o vento (land 2,5 s e 4,0 s).
- **Manchas circulares escuras dentro da fumaça:** o sombreamento por normal do atlas cria "crateras" redondas (land-zoom 1,6 s; batalha-zoom à direita). O efeito parece rocha ou espuma de poliuretano, não gás.
- Falta o gradiente vertical (base escura e quente, topo claro), a sombra da coluna no chão e fiapos nas bordas.
- **Fogo cruzado ainda pouco legível.** Em 4 quadros de batalha a 0,35x quase não se distinguem traçantes. O que se lê são impactos e fumaça. O clarão de cano é um ponto.

### (c) Água e cristais: 6

- **Os anéis de onda são círculos vetoriais perfeitos**, de espessura constante, brancos e opacos (water 0,3 a 1,0 s). Parecem marcador de alvo ou sonar, não água deslocada. Os 2 aneizinhos internos vêm das **explosões secundárias**, que também caem na água.
- **A espuma tem buracos escuros** (water-zoom 0,03 s e 1,6 s). O decal tipo 10 usa a máscara recortada da cratera. Os buracos ficam mais escuros que a água em volta e leem como manchas de óleo.
- **Destroços de pedra saem da água** (water-zoom 0,6 s): um erro de linguagem visual.
- A coluna de vapor é baixa e redonda. Vista de cima, é um monte de algodão, sem o "espigão" vertical esticado nem uma coroa de spray.
- **Superfície da água.**
  - As 7 ondas trocaram a "lixa" por **listras verticais periódicas** (agua-zoom). O leque de direções é estreito (`0.6 ± 0.9` rad) e os comprimentos vão só de 8 a 30 px, então o padrão se repete como cortina.
  - O lago tem 50 de profundidade, mas `exp(-depth*0.07)` satura cedo: o corpo é um azul-petróleo chapado, sem gradiente visível do raso ao fundo.
  - O reflexo das paredes do cânion quase não aparece.
- **Cristais iguais à R5** (`cristais.png`):
  - mesmo ciano saturado e a mesma forma clonada em grade;
  - sem variação de matiz ou escala e sem núcleo interno;
  - os veios no chão são o único "glow".

### (d) Névoa de guerra e atmosfera: 6,5

- Sem mudança. As nuvens da névoa (06) continuam o melhor elemento.
- Continua faltando atmosfera no mundo visível: bruma no fundo do cânion, sombras de nuvem correndo no chão, poeira em suspensão e distorção de calor sobre o fogo.

### (e) Pós-processamento: 6

- O CAS leve ajudou um pouco a nitidez do terreno.
- `uExposure` continua fixo em 1,0 (premium.js:895). Falta o mergulho de exposição no clarão, a onda de choque ou refração em tela e o heat haze.
- O `premiumFlash` aditivo lava a cena em vez de "estourar e voltar".

## Correções prioritárias (máx. 8)

1. **Tirar o contorno de nanquim do fogo** (`PART_FS`, tipo 1).
   - A fuligem não deve depender da faixa de `dens`. Use uma máscara de baixa frequência: `soot = smoothstep(0.4,0.8,t) * smoothstep(0.55,0.35,f2) * body`. Assim ela vira **manchas largas por dentro**, e não anel na borda.
   - A rampa deve ficar com o vermelho-escuro: `heat = 1.0 - pow(dens, 0.6)` e ganho 1,7 (não 2,6).
   - Suba o alfa para `0.45 + 0.4*t` para que os sprites sobrepostos ocluam em vez de somar para amarelo.
2. **Clarão curto e com forma.**
   - Luz da explosão com decaimento `f = (1 - t/life)^3`, vida de 0,22 s (big) e raio `s*2.2 + 20`.
   - PT_FLASH com vida de 0,06 s.
   - Somar uma estrela de 4 a 6 raios aditiva de 0,1 s, para que a bola de fogo apareça já aos 0,12 s.
   - Junto disso, `uExposure = 1 - 0.25*premiumFlashEnv` por 0,3 s (escurece e volta).
3. **Explosão na água: linguagem certa.** Em `fx3Explosion`, com `wet`:
   - **não** gerar `pfx.debris` (troque por 20 gotas brancas PT_SPARK com gravidade);
   - não agendar secundárias em `pfx.later`;
   - ondas com raio irregular (`r * (1 + 0.08*noise(ângulo*5))`), espessura que afina e alfa que cai com o raio. Melhor ainda: aplicar a onda como **perturbação da normal da água** (uniform com até 4 anéis: `N.xy += dir * sin(40*(d - r)) * exp(-abs(d - r)*0.2) * amp`) em vez de decal branco;
   - espuma (decal 10) com máscara fbm suave, sem os buracos da cratera;
   - vapor esticado na vertical (sprite com `stretch` pela velocidade, `vz` de 250 a 380), mais uma coroa de spray em anel.
4. **Fogo cruzado legível.**
   - Traçante PT_TRACER com largura de 4 a 5 e comprimento de cerca de 0,035 s × velocidade, com bloom forte.
   - Clarão de cano como **um único sprite em estrela** de 3 pétalas, orientado, com vida ≥ 2 quadros.
   - Teste de aceitação: num quadro qualquer de battle3 a 0,35x devem aparecer ≥ 4 riscos de projétil.
5. **Água sem cortina.**
   - Espalhar as direções das ondas (`ang = 0.6 + (fract(fi*0.618) - 0.5) * 3.6`) e os comprimentos (de 18 a 160 px, em progressão geométrica).
   - Coeficiente de profundidade `0.025` (gradiente visível até −50).
   - Reflexo das paredes com mistura de 0,85 também no fresnel baixo.
   - Cáusticas além de 5 de profundidade (até cerca de 15) com intensidade 0,25.
6. **Cristais vivos.** Por instância:
   - matiz de ±0,08 (ciano, verde-água, azul-violeta), escala de ±35% e rotação aleatória;
   - núcleo emissivo por fresnel invertido e pulso dessincronizado;
   - decal aditivo ciano no chão (raio 1,5x o aglomerado, força 0,35);
   - pontas com emissão acima do limiar de bloom.
7. **Fumaça sem crateras.**
   - Limitar o sombreamento da normal (`diff = max(dot(N,L)*0.25 + 0.75, 0.0)`).
   - Gradiente por altura e idade: base `0.08`, quente; topo `0.5`, frio e iluminado.
   - Rotação lenta por partícula, mais erosão em 2 escalas no fim da vida e um decal de sombra multiplicativo da coluna no chão.
8. **Destroços e pós de impacto.**
   - Destroços em metal escuro (`0.12`), com borda laranja incandescente que esfria em 1 s e um rastro curto de fumaça.
   - Refração radial de onda de choque em tela (0,4 s, amostrando `uScene` com offset senoidal).
   - Heat haze sobre os focos de fogo residual.
