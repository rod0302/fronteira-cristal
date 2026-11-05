# Premium, rodada 9: crítica de efeitos (VFX, pós e atmosfera)

Revisor: diretor de VFX independente. Não alterei código do jogo. Não medi fps.

## Material avaliado

- Capturas da rodada em `logs/capturas/premium-r9/` (01 a 09).
- Capturas próprias em `logs/capturas/premium-r9/efeitos-proprias/`, feitas com os mesmos scripts da R8 (só mudou o caminho de saída), para comparação direta quadro a quadro: `/home/claude/tools/r9fx-{seq,bat,misc}.js`.
  - 1280x720, `escalagl=1`, `semnevoa`, mouse no centro, uma instância do Chromium por vez (esperei os navegadores de outros agentes fecharem antes de cada script).
  - Explosão grande (s = 16, big): `fx3Update` congelado e avançado à mão em passos de 1/60 s.
  - Batalha: câmera lenta de 0,35x.

| Arquivo | Conteúdo |
|---|---|
| `land-*.png`, `land-seq.png` | Explosão em terra (960, 976) aos 0,03 / 0,12 / 0,3 / 0,6 / 1,0 / 1,6 / 2,5 / 4,0 s |
| `water-*.png`, `water-seq.png` | A mesma explosão no lago (1008, 1040) |
| `batalha-perto-1..6.png`, `batalha-perto-seq.png` | Choque 12x12 em (40, 20), zoom 2,0, 0,35x, um quadro a cada 0,7 s |
| `batalha-1..4.png` | Batalha 16x16 em (30, 30), zoom 1,5 |
| `cristais.png`, `agua-zoom.png` | Campo de cristal (63, 28) com zoom 2,6, e o lago parado com zoom 2,4 |

## Notas

| Área | R6 | R7 | R8 | **R9** | Δ |
|---|---|---|---|---|---|
| (a) Explosões e fogo | 6,5 | 6,5 | 7 | **7/10** | 0 |
| (b) Fumaça e partículas | 6 | 6,5 | 6,5 | **6,5/10** | 0 |
| (c) Água e cristais | 6 | 6,5 | 7 | **7/10** | 0 |
| (d) Névoa de guerra e atmosfera | 6,5 | 6,5 | 6,5 | **6,5/10** | 0 |
| (e) Pós-processamento | 6 | 6 | 6 | **6,5/10** | +0,5 |
| (f) Impacto geral | 6 | 6,5 | 7 | **7/10** | 0 |

**Veredito:** rodada de ajuste fino. O clarão já não lava a tela e a espuma some na hora certa, mas os primeiros 0,15 s de cada explosão continuam um disco luminoso com borda de bolha de vidro, e o tiroteio segue ilegível. Nada aqui muda a categoria do jogo.

## Avanços reais desde a R8

- **A exposição dinâmica funciona.** `uExposure = 1.06 - premiumFlash * 2.2` (`premium.js:897`). Em `land-0_03` da R9 contra o da R8, o halo creme que tomava 1/3 do quadro encolheu para cerca de 100 px, e areia e água ao redor mantêm a cor. É o primeiro movimento real do pós em quatro rodadas.
- **O clarão é menor e mais curto.** No mosaico `07-explosao-sequencia` (1º quadro), a bola amarela já não tem o "sol" difuso da R8 em volta.
- **A espuma na água foi corrigida.** Em `water-seq`, ela some até 1,6 s; na R8 ainda havia um decalque leitoso aos 2,5 s. Esse ponto está resolvido.
- **A fumaça velha tem base escura.** Aos 2,5 e 4,0 s (`land-seq`) a coluna é cinza-média em cima, e no pé fica uma mancha de fuligem quase preta, com brasa laranja. Lê como incêndio que sobra. Na R8 o pé era cinza uniforme.
- **A luz corrigida ajuda os efeitos.** Com a normal da face visível consertada, as carcaças e a fumaça em `batalha-perto-5` ganharam contraste contra o chão. O fogo nas carcaças se destaca mais que na R8, mesmo sem nenhuma mudança no fogo em si.

## O que vi, por área

### (a) Explosões e fogo: 7 (=)

- **O clarão segue um disco, agora com contorno duro.** Aos 0,12 s (`land-0_12`, `water-0_12`), a bola é um disco amarelo-creme circundado por um **anel nítido**, como uma bolha de vidro ou lente. A causa provável é o decalque da onda de choque (`premium.js:569-571`): ele nasce em t = 0 com alfa alto, raio de cerca de 33 unidades e borda dura, e fica exatamente na borda do clarão. Ganhamos contenção, mas a forma piorou: o disco agora parece um objeto. Continua sem estrela, sem raios e sem silhueta irregular de bola de fogo.
- **As bolhas bege na base continuam.** Aos 1,0 s (`land-1`) há 4 ou 5 esferas creme translúcidas embaixo da chama. A linha da R8 está intacta: `col += vec3(1.0,0.4,0.1) * smoothstep(0.25,0.0,t) * 1.5 * tex.a` (`shaders.js:~391`). A correção 3 da R8 não foi feita.
- **O fogo velho melhorou pouco.** Aos 1,6 s (`land-1_6`) a lâmina é vermelho-tijolo em vez de laranja-néon, menos massinha, mas ainda é uma lâmina plana de borda dura colada na fumaça. Não há brasa pontilhada nem fiapos.
- **A fuligem dentro do fogo segue tímida.** `sootN = smoothstep(0.5, 0.75, ...)` não mudou (`shaders.js:405`).
- **O que funciona:** o quadro de 1,0 s (`07-explosao-sequencia`, 2º) segue sendo o melhor do projeto. Tem fogo dentro da fumaça, veios e destroços.

### (b) Fumaça e partículas: 6,5 (=)

- **A coluna ganhou base escura** (ver avanços), mas o meio e o topo seguem cinza uniforme, e a coluna não faz sombra no chão.
- **O fogo cruzado não mudou.** A 0,35x, em `batalha-perto-1..6`, o que domina continua sendo **bolinhas brancas** de clarão de cano (ex.: `batalha-perto-5`, cerca de 450, 375). Os traçantes têm 1 ou 2 riscos curtos por quadro, e ninguém lê uma troca de tiros. O teste de ≥ 4 riscos legíveis por quadro falha pela terceira rodada seguida.
- **Os destroços seguem confete.** São pontos escuros, sem incandescência nem rastro (`land-0_6`, `batalha-perto-5`).

### (c) Água e cristais: 7 (=)

- **Espuma:** resolvida, como dito acima.
- **Os anéis voltaram a ficar nítidos.** Em `water-0_3` e `water-0_6`, os 2 ou 3 anéis concêntricos estão finos, regulares e perfeitamente circulares, mais "marcador de alvo" que na R8. O disco de espuma central tem borda circular dura e não se desfaz em filamentos.
- **A coluna d'água** continua uma pilha de 4 a 6 bolhas brancas poligonais (`water-0_6`, `water-1`). Não há coroa de gotas nem respingo radial.
- **Água parada:** o shader já tem reflexo das paredes do cânion e cáusticas (`terrain3d.js:~545-562`), mas em `agua-zoom` (R9 contra R8) **não vejo diferença perceptível**: nenhuma faixa marrom refletida sob a parede norte e nenhuma luz dançando no raso. Se está ligado, está fraco demais para contar. O degradê de profundidade e o cintilar do sol (`04-batalha`) seguem bons.
- **Cristais:** idênticos à R8 (`cristais.png`). Seguem em grade regular, com brilho uniforme e nenhuma ponta estourando no bloom. Os veios no chão continuam bons.

### (d) Névoa de guerra e atmosfera: 6,5 (=)

- As nuvens de `06-nevoa` seguem o ponto alto: volume, borda iluminada e transição macia.
- No mundo visível nada mudou. Faltam:
  - bruma no fundo dos cânions;
  - sombras de nuvem perceptíveis no chão;
  - poeira em suspensão;
  - distorção de calor sobre o fogo.

  O cânion de `05-paisagem` tem a mesma luz do planalto, sem ar entre os níveis.

### (e) Pós-processamento: 6,5 (+0,5)

- **Ganho:** a exposição dinâmica (ver avanços). É modesta, mas real e visível.
- **Falta:**
  - onda de choque em tela ou refração;
  - bloom seletivo: o bloom ainda realça o disco e não as faíscas e traçantes;
  - aberração cromática ou grão no impacto;
  - LUT por clima.

  A volta da exposição é linear com `premiumFlash` (decai a 0,5/s), então o escurecimento dura cerca de 0,25 s. Está correto.

### (f) Impacto geral: 7 (=)

- Quadro parado bom em paisagem, explosão aos 1,0 s e batalha de perto, no nível de indie caprichado.
- O que o separa de AAA continua o mesmo da R8:
  - o nascimento da explosão;
  - o tiroteio;
  - os destroços;
  - a falta de atmosfera.

  Três das oito correções da R8 foram atacadas. A exposição e a espuma ficaram boas; o clarão ficou só menor, sem forma.

## Correções prioritárias (máx. 8)

1. **Tirar a "bolha de vidro" do clarão e dar forma a ele.**
   - A onda de choque (terra e água) deve nascer com alfa 0 e subir até o máximo entre 0,04 e 0,06 s. A borda tem de ser macia (perfil gaussiano de cerca de 25% do raio), não uma linha.
   - Some uma estrela aditiva de 4 a 6 raios finos e assimétricos, com 0,06 s de vida.
   - A bola de fogo nasce em t = 0 com 40% do tamanho final.
   - Aceite quando `land-0_12` mostrar silhueta laranja irregular, sem círculo perfeito em lugar nenhum.
2. **Fogo cruzado legível (pendente desde a R6).**
   - Troque a bolinha branca do cano por uma estrela de 3 pétalas, orientada e com 2 quadros de vida.
   - Traçante com 35 px ou mais em zoom 2,0, núcleo branco e cauda laranja, e 2 por rajada de metralhadora.
   - Teste: ≥ 4 riscos legíveis por quadro em `batalha-perto` a 0,35x.
3. **Acabar com as bolhas bege.**
   - O brilho da fumaça recém-nascida (`shaders.js`, `* 1.5`) deve ir para `* 0.5`, com cor `(1.0, 0.35, 0.08)` e restrito ao miolo (`* tex.a * tex.a`).
   - A fumaça só pode aparecer depois de 0,15 s.
4. **O fogo deve morrer em brasa.**
   - Da metade da vida em diante, alfa do fogo `*= 1 - smoothstep(0.5, 1.0, t) * (1 - vein)`.
   - `sootN` deve ir para `smoothstep(0.35, 0.6, ...)`.
   - Some pontos de brasa (PT_EMBER) que nascem do fogo a partir de 0,8 s.
5. **Destroços com vida.**
   - Borda laranja que esfria em cerca de 1 s e rastro curto de fumaça nos 3 a 4 maiores.
   - Metade da quantidade nos impactos pequenos.
6. **Água: anéis irregulares e respingo de verdade.**
   - Anéis com espessura e alfa modulados por ruído angular (quebrados, não circulares).
   - O disco de espuma deve se desfazer por `step(t, fbm)` em filamentos.
   - Some uma coroa de 20 a 24 gotas brancas em anel, que caem em 0,6 s, no lugar da pilha de bolhas.
7. **Tornar visível o reflexo que já existe.**
   - Suba a mistura do reflexo da parede para que se veja uma faixa ocre-escura de 15 a 25 px sob as paredes norte do lago em zoom 2,4.
   - Cáusticas com cerca de 3x a intensidade atual (`* 0.12` vai para `* 0.35`) na faixa com menos de 6 de profundidade.
   - Aceite comparando `agua-zoom` antes e depois: a diferença tem de ser óbvia.
8. **Atmosfera e cristais.**
   - Bruma azulada por altura no fundo dos cânions e distorção de calor leve sobre fogo ativo.
   - Cristais: jitter de ±10 px, 1 a 3 tufos por tile e 1 em cada 6 com ponta acima do limiar de bloom.
