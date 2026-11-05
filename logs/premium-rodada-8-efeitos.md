# Premium, rodada 8: crítica de efeitos (VFX, pós e atmosfera)

Revisor: diretor de VFX independente. Não alterei código do jogo. Não medi fps.

## Material avaliado

- Capturas da rodada em `logs/capturas/premium-r8/`, de 01 a 09.
- Capturas próprias em `logs/capturas/premium-r8/efeitos-proprias/`, feitas com os mesmos scripts da R7, só com outro caminho de saída. Os scripts estão em `/home/claude/tools/r8fx-{seq,bat,misc}.js`.
  - Configuração: 1280x720, `escalagl=1`, `semnevoa`, mouse no centro.
  - `fx3Update` foi congelado e avançado à mão, em passos de 1/60 s.
  - Na batalha, usei câmera lenta de 0,35x.

Uma observação técnica: com três instâncias do Chromium rodando em paralelo (SwiftShader), o premium lançou `framebuffer incompleto: 36061` e as capturas saíram pretas. Rodando uma de cada vez, tudo funcionou. Provavelmente é limite de memória do SwiftShader, não um defeito do jogo. Ainda assim, convém que o jogo caia para o modo clássico com aviso, em vez de mostrar tela preta.

| Arquivo | Conteúdo |
|---|---|
| `land-*.png`, `land-seq.png`, `land-zoom.png` | Explosão grande (s = 16, big) em terra (960, 976), nos instantes 0,03 / 0,12 / 0,3 / 0,6 / 1,0 / 1,6 / 2,5 / 4,0 s. O zoom mostra 0,12, 1,0 e 1,6 s. |
| `water-*.png`, `water-seq.png`, `water-zoom.png` | A mesma explosão no lago (1008, 1040). O zoom mostra 0,12, 1,0 e 2,5 s. |
| `batalha-perto-1..6.png`, `batalha-perto-seq.png` | Choque 12x12 em (40, 20), zoom 2,0, a 0,35x, um quadro a cada 0,7 s. |
| `batalha-1..4.png` | Batalha 16x16 em (30, 30), zoom 1,5. |
| `cristais.png`, `agua-zoom.png` | Campo de cristal (63, 28) com zoom 2,6, e o lago parado com zoom 2,4. |

## Notas

| Área | R1 | R2 | R3 | R4 | R5 | R6 | R7 | **R8** | Δ |
|---|---|---|---|---|---|---|---|---|---|
| (a) Explosões e fogo | 4 | 5 | 5,5 | 5,5 | 6 | 6,5 | 6,5 | **7/10** | +0,5 |
| (b) Fumaça e partículas | 4 | 4,5 | 4,5 | 5 | 5,5 | 6 | 6,5 | **6,5/10** | 0 |
| (c) Água e cristais | 4 | 5 | 5 | 5,5 | 5,5 | 6 | 6,5 | **7/10** | +0,5 |
| (d) Névoa de guerra e atmosfera | 3 | 6 | 6,5 | 6,5 | 6,5 | 6,5 | 6,5 | **6,5/10** | 0 |
| (e) Pós-processamento | 5 | 5 | 5,5 | 5,5 | 6 | 6 | 6 | **6/10** | 0 |
| (f) Impacto geral | 4,5 | 5 | 5,5 | 5,5 | 5,5 | 6 | 6,5 | **7/10** | +0,5 |

**Veredito:** é a primeira rodada em que a bola de fogo aos 1,0 s parece fogo dentro de fumaça e o lago parece água funda, mas o clarão inicial continua um sol branco sem forma, o fogo velho ainda vira massinha laranja e o pós-processamento segue parado.

## Avanços reais desde a R7

- **O fogo está dentro da fumaça.** Em `land-zoom` (1,0 s) a chama sai por baixo e por entre os rolos de fumaça cinza, em vez de ficar ao lado deles. A correção 2 da R7 foi resolvida, e esse é o melhor quadro de explosão do projeto até agora.
- **O fogo tem valor interno.** Aos 1,0 s convivem dentro do mesmo sprite:
  - veios amarelos;
  - corpo laranja;
  - algumas manchas mais escuras.

  A "gelatina" chapada da R7 sumiu na maior parte da vida da chama, e a borda ficou macia.
- **O lago tem profundidade.** Em `agua-zoom` e `05-paisagem` ele vai do raso turquesa na margem ao azul-petróleo no meio, em degradê contínuo. Em `04-batalha`, o sol cintila e há um lóbulo especular claro perto da borda norte. Deixou de ser "plástico fosco".
- **Os anéis na água deixaram de parecer interface.** Comparando `water-seq` da R8 com o da R7, os anéis estão mais fracos e difusos, levemente quebrados, e já não lembram um marcador de alvo.
- **A coluna d'água existe.** Dos 0,3 aos 0,6 s sobe um espigão branco fino e vertical, que lê como vapor e respingo.
- **Os cristais respiram.** Com o glow cerca de 30% menor, o véu ciano diminuiu, as silhuetas se separam e o chão entre elas aparece (`cristais.png` da R8 contra o da R7).
- **A batalha está boa.** Em `batalha-perto-5` aparecem juntos:
  - carcaças em chamas;
  - fumaça subindo e se acumulando;
  - marcas de esteira;
  - destroços e clarões.

  Lê como combate.

## O que vi, por área

### (a) Explosões e fogo: 7 (+0,5)

- **O clarão segue um disco.** Aos 0,03 e aos 0,12 s (`land-seq` e `water-seq`) o que se vê é um disco branco-creme de cerca de 90 a 100 px, agora com faíscas curtas por cima. Não há silhueta de bola de fogo, estrela nem raios. A forma só aparece entre 0,3 e 0,6 s, e ainda como uma massa amarela estourada.
- **O fogo velho vira "massinha".** Aos 1,6 s (`land-zoom`, à direita) a chama é vermelho-alaranjada saturada, com borda dura e lâminas planas, e uma "lasca" laranja solta à esquerda. Falta virar brasa: escurecer, ganhar pontos incandescentes e se esfiapar.
- **A fuligem é tímida.** `sootN = smoothstep(0.5, 0.75, fbm)` continua com o limiar alto que critiquei na R7 (`shaders.js:403`). Aos 1,0 s há algum escurecimento, mas não as manchas marrom-escuras pedidas.
- **Há bolhas "de sabão" na base.** Em `07-explosao-sequencia` (3º quadro) e em `land-zoom` aparecem bolhas bege-claras redondas e translúcidas na borda do cânion. É a fumaça recém-nascida acesa por `+ vec3(1,.4,.1)*...*1.5` mais a poeira. Elas leem como espuma, não como poeira.

### (b) Fumaça e partículas: 6,5 (=)

- **Coluna de fumaça boa, mas sem gradiente.** Aos 1,6 e 2,5 s tem volume e camadas. Ainda é cinza uniforme: falta base escura e quente com topo claro, e não há sombra da coluna no chão.
- **Fogo cruzado continua fraco.** A 0,35x conto de 1 a 3 traçantes por quadro, e só um com núcleo e cauda reconhecíveis (`batalha-perto-5`, perto de 450, 375). O que domina são **bolinhas brancas** de clarão de cano. O teste de ≥ 4 riscos legíveis por quadro não passa de novo.
- **Destroços são confete.** São pedrinhas escuras, sem brilho, espalhadas em leque (`batalha-perto-5`, acima do centro). Nenhum tem incandescência nem rastro.

### (c) Água e cristais: 7 (+0,5)

- **A mancha de espuma ficou leitosa e demora a sumir.** Entre 1,0 e 2,5 s fica um disco azul-leitoso de cerca de 100 px, com buracos de ruído, parado como um decalque. Ele chama mais atenção que os anéis. Deveria se desfazer em filamentos e sumir em cerca de 1,2 s.
- **O vapor degenera.** Aos 1,0 s viram 4 ou 5 bolhas brancas soltas, ainda poligonais. Não há coroa de gotas em anel nem segunda onda na queda.
- **A água parada ainda não reflete nada.** Não há reflexo das paredes do cânion, e o especular só aparece em certos ângulos (`04`). Também não há cáusticas na faixa rasa.
- **Cristais:**
  - a distribuição continua em grade (um tufo por tile, mesmo espaçamento);
  - faltam pontas que estourem no bloom, e o brilho está uniforme;
  - os veios no chão leem bem.

### (d) Névoa de guerra e atmosfera: 6,5 (=)

- As nuvens da névoa (`06-nevoa.png`) continuam bonitas: volumosas, com borda iluminada.
- No mundo visível nada mudou. Faltam:
  - bruma no fundo do cânion;
  - sombras de nuvem;
  - poeira em suspensão;
  - distorção de calor sobre o fogo.

### (e) Pós-processamento: 6 (=)

- `uExposure` passou de 1,0 para 1,06, mas continua **fixo** (`premium.js:897`). Não há adaptação ao clarão, onda de choque em tela, refração nem aberração. O bloom segue lavando o clarão em disco, em vez de destacar pontas finas.

### (f) Impacto geral: 7 (+0,5)

- Explosão aos 1,0 s, lago e batalha de perto já sustentam quadro parado em nível de "indie bom".
- O que separa isto de AAA está nos primeiros 0,3 s de cada impacto (o clarão), na morte do fogo e no pós estático.

## Correções prioritárias (máx. 8)

1. **Dar forma ao clarão nos primeiros 0,15 s.**
   - Reduza o PT_FLASH a no máximo `s*1.2` de raio e limite a intensidade a 1,2.
   - Some uma estrela aditiva de 4 a 6 raios finos (0,06 s) e faça a bola de fogo nascer já em t = 0 com 40% do tamanho final.
   - Aceite quando, aos 0,12 s, se vir uma silhueta laranja com borda irregular, e não um disco creme.
2. **Exposição dinâmica.**
   - `uExposure = 1.06 * (1 - 0.3 * clamp(premiumFlash/0.12, 0, 1))`, com retorno em 0,3 s.
   - Abaixe o limiar do bloom só para as faíscas e os traçantes, não para o disco.
3. **O fogo deve morrer em brasa, não em massinha.**
   - A partir de t = 0,5, multiplique o alfa do fogo por `1 - smoothstep(0.5, 1.0, t) * (1 - vein)`, para que ele se esfiape.
   - Leve `fireRamp` para vermelho-escuro (0,35, 0,06, 0,02) mais pontos de brasa.
   - Baixe o limiar de `sootN` para `smoothstep(0.35, 0.6, ...)`.
   - Elimine as bolhas bege: o brilho da fumaça recém-nascida deve ser `* 0.6` e alaranjado, não creme.
4. **Fogo cruzado legível.**
   - Troque a bolinha de cano por uma estrela de 3 pétalas orientada, com 2 quadros de vida.
   - O traçante precisa medir 35 px ou mais em zoom 2,0, com 2 traçantes por disparo de metralhadora.
   - Repita o teste: ≥ 4 riscos legíveis por quadro em `batalha-perto` a 0,35x.
5. **Espuma da água: menor e mais curta.**
   - Reduza o decal de espuma para 60% e a vida para 1,2 s, e faça-o se dissolver por fbm em filamentos (`step(t, fbm)`).
   - Some uma coroa de 20 a 24 gotas brancas em anel, que caem em 0,6 s e geram uma segunda onda fraca.
6. **Destroços com vida.**
   - Metal escuro com borda laranja que esfria em 1 s e um rastro curto de fumaça.
   - Reduza em 50% os destroços de impactos pequenos, para acabar com o confete.
7. **Reflexo na água parada.**
   - Reflexo das paredes do cânion e do céu com mistura mínima de 0,3.
   - Cáusticas animadas na faixa rasa, onde a profundidade é menor que 12.
8. **Cristais e atmosfera.**
   - Cristais: jitter de ±10 px, 1 a 3 tufos por tile e 1 em cada 6 com ponta acima do limiar de bloom.
   - Atmosfera: bruma azulada no fundo do cânion (por altura) e distorção de calor leve sobre o fogo ativo.
