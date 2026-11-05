# Premium, rodada 7: crítica de efeitos (VFX, pós e atmosfera)

Revisor: diretor de VFX independente. Não alterei código do jogo. Não medi fps.

## Material avaliado

Avaliei as capturas da rodada em `logs/capturas/premium-r7/` (04 a 07) e capturas próprias em `logs/capturas/premium-r7/efeitos-proprias/`.

Como fiz as próprias:
- 1280x720, `escalagl=1`, `semnevoa`, mouse no centro.
- `fx3Update` congelado e avançado à mão em passos de 1/60 s (os scripts estão em `/home/claude/r7fx/`).

| Arquivo | Conteúdo |
|---|---|
| `land-*.png`, `land-seq.png`, `land-zoom.png` | Explosão grande (s = 16, big) em terra, na borda do cânion (960, 976). Instantes t = 0,03 / 0,12 / 0,3 / 0,6 / 1,0 / 1,6 / 2,5 / 4,0 s. O zoom mostra 0,3 s, 1,0 s e 1,6 s. |
| `water-*.png`, `water-seq.png`, `water-zoom.png` | A mesma explosão no lago (1008, 1040), nos mesmos instantes. O zoom mostra 0,12 s, 1,0 s e 2,5 s. |
| `batalha-1..4.png` | Batalha battle3 (16x16) a 0,35x. Quase não houve combate no enquadramento. |
| `batalha-perto-1..6.png`, `batalha-perto-seq.png`, `batalha-zoom.png` | Choque frontal 12x12 em (40, 20), zoom 2,0, câmera lenta 0,35x, um quadro a cada 0,7 s. |
| `cristais.png` | Maior campo de cristal (tile 63, 28), zoom 2,6. |
| `agua-zoom.png` | Lago parado, zoom 2,4. |

## Notas

| Área | R1 | R2 | R3 | R4 | R5 | R6 | **R7** | Δ |
|---|---|---|---|---|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | 5,5 | 5,5 | 6 | 6,5 | **6,5/10** | 0 |
| (b) Fumaça e partículas | 4 | 4,5 | 4,5 | 5 | 5,5 | 6 | **6,5/10** | +0,5 |
| (c) Água e cristais | 4 | 5 | 5 | 5,5 | 5,5 | 6 | **6,5/10** | +0,5 |
| (d) Névoa de guerra e atmosfera | 3 | 6 | 6,5 | 6,5 | 6,5 | 6,5 | **6,5/10** | 0 |
| (e) Pós-processamento | 5 | 5 | 5,5 | 5,5 | 6 | 6 | **6/10** | 0 |
| (f) Impacto geral | 4,5 | 5 | 5,5 | 5,5 | 5,5 | 6 | **6,5/10** | +0,5 |

**Veredito:** a rodada fez a limpeza que eu pedi (sem contorno de nanquim, sem crateras na fumaça, sem pedras saindo do lago, sem cortina na água) e a batalha de perto já parece guerra. Mas o fogo trocou o adesivo por gelatina laranja chapada, o clarão continua um sol sem forma, os anéis na água seguem de sonar e o pós segue parado: avançou em acabamento, não em ambição.

## O que melhorou desde a R6 (avanços reais)

- **Contorno preto do fogo eliminado.** Em `land-zoom` (1,0 e 1,6 s) não há mais anel escuro em volta das bolhas. Era o defeito mais visível da R6 e foi resolvido.
- **Fumaça sem as "crateras" redondas.** A coluna aos 1,6, 2,5 e 4,0 s é macia e tem camadas, com deriva para leste, e lê como gás. Na batalha de perto (`batalha-zoom`) a fumaça cinza se acumula e vira névoa de combate. Bom.
- **Explosão na água com linguagem certa.**
  - Não tem destroços nem secundárias, e os anéis extras desapareceram (agora são 3 concêntricos limpos).
  - As faíscas viram respingos dourados com o clarão.
  - A espuma não tem mais os buracos escuros "de óleo".
- **Água sem cortina.** As listras verticais periódicas sumiram (`agua-zoom`). A superfície agora é um ruído fino sem repetição evidente.
- **Cristais com paleta por aglomerado.** Ciano, verde-água, menta e azul convivem (`cristais.png`), com escala variada e núcleo claro. Já não é um clone em grade monocromático.
- **Batalha de perto com densidade.** Em 6 quadros vejo:
  - fogo em tanques atingidos;
  - fumaça subindo de vários focos;
  - destroços voando;
  - poeira e alguns traçantes curtos.

  É o melhor quadro de combate até agora.

## O que vi, por área

### (a) Explosões e fogo: 6,5 (=)

- **Fogo virou "gelatina/celofane".** Sem o contorno, o `smoothstep(0.05, 0.75, dens)` deixou a borda dura e o miolo chapado. Aos 1,0 s (`land-zoom` do meio) são cerca de 8 recortes laranja-amarelos translúcidos com contorno nítido e preenchimento uniforme, sem gradiente interno. A fuligem nova (`sootN`) **não aparece** em nenhum quadro: a máscara `smoothstep(0.5,0.75,fbm)·dens·smoothstep(0.35,0.85,t)` raramente passa de 0,3. O vermelho-escuro só aparece aos 1,6 s, e como um laranja-sólido de "massinha", sem brasa.
- **Fogo e fumaça separados no espaço.** Aos 1,6 s o fogo fica à esquerda e a fumaça à direita, lado a lado. Deveria ser fogo envolvido pela fumaça, saindo dela. Causa: o fogo é emitido com velocidade radial grande (`sp` de 14 a 77), mas a fumaça nasce no centro (`s*0.3`) e com 0,25 a 0,4 s de atraso.
- **Clarão ainda sem forma.** A vida da luz caiu para 0,24 s, mas o raio continua em `s*3.5+28`. Some o miolo branco-quente do fogo (`+vec3(1,.7,.35)*2`) e o bloom, e de 0,03 a 0,3 s o que se vê é **um disco branco-creme de cerca de 90 px**, sem silhueta de bola de fogo. A forma só se lê aos 0,6 s, ainda amarelo saturado. Não há estrela nem raios.
- Faíscas iguais: curtas, todas amarelo-claras. Destroços ainda são pedrinhas azul-ardósia, iguais às pedras do mapa, sem incandescência. Na batalha viram "confete escuro" espalhado.

### (b) Fumaça e partículas: 6,5 (+0,5)

- A fumaça está boa como gás, mas é **cinza uniforme**. Falta o gradiente vertical (base escura e quente, topo claro e iluminado) e a sombra da coluna no chão.
- A fuligem do chão aos 4,0 s é uma mancha escura com cara de fumaça rasteira. Funciona.
- **Fogo cruzado continua pouco legível.** Em 6 quadros a 0,35x conto de 0 a 3 traços curtos (cerca de 10 a 15 px) por quadro. O teste de aceitação da R6 (≥ 4 riscos legíveis) não passa. Os clarões de cano são **bolinhas brancas redondas** (`batalha-zoom`, abaixo do centro), não estrelas orientadas.

### (c) Água e cristais: 6,5 (+0,5)

- **Os anéis continuam vetoriais.** São círculos perfeitos de espessura constante, branco-leitosos (`water-zoom` 1,0 s), com cara de marcador de alvo. A correção da R6, que pedia a onda como perturbação da normal da água e raio irregular, não foi feita.
- **Vapor parece "pipoca facetada".** Aos 1,0 s são 5 ou 6 bolhas brancas poligonais agrupadas, baixas, deslocadas para o norte. Não há espigão vertical nem coroa de spray. Vista de cima, a coluna d'água não existe.
- **Superfície parada fosca demais.** Sem a cortina, o lago virou uma pintura teal com granulado fino:
  - não há reflexo visível das paredes do cânion nem especular do sol;
  - o gradiente do raso ao fundo é tímido (só a franja clara na margem).

  Parece mais "plástico fosco" que água.
- **Cristais.** Já há variação de cor, mas:
  - a distribuição é em grade regular (um tufo por tile, mesmo espaçamento);
  - o campo inteiro é lavado por uma névoa ciano uniforme (veios mais bloom), que dissolve as silhuetas;
  - falta contraste: alguns cristais quase apagados, poucos pontos muito brilhantes nas pontas.

### (d) Névoa de guerra e atmosfera: 6,5 (=)

- As nuvens da névoa (`06-nevoa.png`) seguem o melhor elemento do modo.
- No mundo visível nada mudou: sem bruma no fundo do cânion, sem sombras de nuvem correndo, sem poeira em suspensão, sem heat haze sobre o fogo.

### (e) Pós-processamento: 6 (=)

- `uExposure` continua fixo em 1,0 (premium.js:895). Não existe onda de choque nem refração em tela. O `premiumFlash` segue aditivo.
- O bloom lava o branco-quente em disco (ver (a)), em vez de destacar pontas finas.

### (f) Impacto geral: 6,5 (+0,5)

- A batalha de perto, com fumaça acumulada, fogo em carcaças e destroços, finalmente vende escala.
- Em quadro parado, porém, cada efeito isolado ainda é de nível "indie competente": fogo chapado, água fosca, anéis de interface.

## Correções prioritárias (máx. 8)

1. **Fogo com valor interno, não gelatina** (`PART_FS`, tipo 1).
   - Troque o `dens = smoothstep(0.05, 0.75, dens)` por `dens = pow(dens, 0.8)`, que é mais suave na borda.
   - Module o calor por um terceiro ruído de alta frequência: `heat = clamp(1.0 - dens*(0.6+0.4*f2) + t*0.55, 0, 1)`. Isso cria veios amarelos dentro de corpo laranja-vermelho.
   - Para a fuligem aparecer, use `sootN = smoothstep(0.35, 0.6, fbm)` e `soot = smoothstep(0.25, 0.7, t) * sootN`, sem multiplicar por `dens`, com mistura de até 0,9.
   - Aceite quando, aos 1,0 s, se virem ao mesmo tempo manchas marrom-escuras, um corpo laranja-vermelho e veios amarelos dentro do mesmo sprite.
2. **Fogo dentro da fumaça.**
   - Corte a velocidade radial do fogo pela metade (`sp = rnd(6, 30)`).
   - Emita parte da fumaça (6 sprites PT_DARK) **junto** com o fogo em t = 0, nas mesmas posições e com `up` maior.
   - A coluna atrasada de 0,25 s fica para o volume.
3. **Clarão com forma e exposição.**
   - Raio da luz da explosão em `s*2.0 + 18`, decaimento `(1-t/life)^3`.
   - Miolo branco-quente do fogo só até t = 0,08 (`smoothstep(0.08, 0.0, t)`).
   - Uma estrela aditiva de 5 raios (PT_FLASH com variante em cruz, 0,08 s).
   - `uExposure = 1 - 0.3*premiumFlash/0.12` decaindo em 0,3 s.
   - Aceite quando, aos 0,12 s, já houver silhueta de bola de fogo legível sobre o chão.
4. **Anéis de onda como água, não interface.**
   - Remova o decal branco e passe até 4 anéis por uniform ao `T3_WATER_FS`, perturbando a normal: `N.xy += dir * sin(0.5*(d - r)) * exp(-abs(d - r)*0.15) * amp*(1-t/life)`.
   - O que deve ficar branco é só uma fina franja de espuma quebrada por fbm no primeiro anel.
5. **Coluna d'água e spray.**
   - O vapor deve sair esticado na vertical (sprite com stretch pela velocidade, `vz` de 250 a 380, vida de 0,7 s), com sombreamento suave em vez de bolhas facetadas.
   - Some uma coroa de 24 gotas PT_SPARK brancas em anel (velocidade radial de 80 a 140, `vz` de 120 a 200) que caem em 0,6 s.
   - Na queda, uma segunda onda menor deve ser emitida.
6. **Fogo cruzado legível.**
   - PT_TRACER com comprimento de cerca de 0,04 s × velocidade (≥ 25 px em zoom 1,5), núcleo branco e ganho acima do limiar de bloom.
   - Clarão de cano como estrela de 3 pétalas orientada na direção do tiro (substituindo a bolinha), vida ≥ 2 quadros.
   - Repita o teste: ≥ 4 riscos por quadro em `batalha-perto` a 0,35x.
7. **Água parada com reflexo e profundidade.**
   - Reflexo das paredes do cânion e do céu com mistura mínima de 0,35 mesmo no fresnel baixo.
   - Especular do sol com lóbulo alongado (pow 200 + pow 20 × 0,2).
   - Escureça o fundo para `vec3(0.02, 0.10, 0.13)` nos trechos com profundidade acima de 30.
   - Cáusticas visíveis na faixa rasa (0 a 12).
8. **Cristais com hierarquia e destroços com vida.**
   - Cristais:
     - jitter de posição de ±10 px e 1 a 3 tufos por tile, para quebrar a grade;
     - reduza o glow dos veios em 40%, para o campo não virar névoa ciano;
     - 1 em cada 6 cristais com ponta acima do limiar de bloom.
   - Destroços:
     - metal escuro (0,12) com borda laranja que esfria em 1 s e rastro curto de fumaça;
     - na batalha, reduzir em 50% os destroços de impactos pequenos para acabar com o "confete".
