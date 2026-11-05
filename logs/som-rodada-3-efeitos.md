# Crítica: Design dos efeitos sonoros (som-r3)

**Nota: 6 de 10**

| Subitem | r3 | r2 | r1 |
|---|---|---|---|
| (a) Impacto e peso | **5** | 4,5 | 5,5 |
| (b) Caráter de cada arma | **6** | 6,5 | 5 |
| (c) Variação | **7** | 6,5 | 3,5 |
| (d) Espaço (reverb, eco, distância, estéreo) | **6,5** | 6 | 5 |
| (e) Interface | **5,5** | 5,5 | 6 |
| (f) Motores e ambiente | **5** | 4,5 | 5 |

Na mesma régua, a versão original (`/home/claude/w/orig/rts`, sem banco de efeitos) fica em cerca de 3,5.

## Veredito

A rodada 3 consertou a engenharia que a rodada 2 apontou, e eu conferi cada conserto com medida própria:

- **Medidor de loudness:** cada som que não bate no teto de pico fica a no máximo 0,1 LU da tabela.
- **Salto de 3 dB no centro da tela:** acabou. Fuzil, metralhadora e morte de soldado variam no máximo 0,2 LU entre 0, 1, 50 e 300 px do centro.
- **Roubo de vaga:** cada roubo agora corta uma voz só (1838 roubos para 1838 cortes) e nenhuma explosão é cortada.
- **Hierarquia dos sons isolados:** passou a fazer sentido. Canhão fica 5 LU acima do fuzil; assentar prédio, erro e "energia" ficam abaixo dos canhões.
- **Distância:** um canhão a 670 px fora da tela soa a -33 LUFS (r2: -52).
- **"Harvester deployed":** **o pedido do Rodrigo está atendido.** Em tempo real, "Coletor pronto" tocou em 87,2 s, e o efeito `deploy` e a frase em 90,6 s, pelo pacote de vozes.

**Mas o que o jogador ouve numa batalha quase não mudou, e é isso que separa este som de um RTS AAA.**

- **O prédio explodindo continua sumindo.** Na batalha grande, ele sobe **+0,2 LU e +0,0 LU** acima do tiroteio. O "momento" que abaixa as armas leves não resolve, porque quem enche a batalha são canhões, torres e granadas (-13,3 LUFS sozinhos), e esses não abaixam.
- **As quatro maiores explosões batem no teto de pico do banco** e ficam de 1,3 a 3,1 LU abaixo da própria tabela. O Coletor explodindo soa mais baixo que um blindado explodindo.
- **A interface afundou na batalha.** Clique, "pronto" e créditos ficam acima do fundo em 1, 0 e 0 de 21 bandas.
- **Dois problemas novos:**
  - o zumbido da base vibra com **29 dB de modulação** quando há prédios nas duas metades da tela, e fica mais alto que um blindado andando;
  - a torre perdeu metade da identidade que tinha (distância espectral para o canhão: 17,9 dB na r2, 8,1 dB agora).

## Pontos fortes (com medidas)

- **Tabela de loudness obedecida** (`efeitos/tabela_banco.txt`, BS.1770 independente, janelas cheias de 400 ms).
  - Dos 33 sons, 27 ficam a no máximo 0,1 LU do alvo.
  - Exemplos: canhão -16,0 (alvo -16), torre -15,5 (-15,5), fuzil -22,0 (-22), metralhadora -22,5 (-22,5), lança-foguetes -19,0 (-19), `deploy` -17,0 (-17).
  - O erro da r2 ia de -4,6 a +8,8 LU.
- **Hierarquia em jogo, cadeia completa** (`efeitos/hierarquia_cadeia.txt`, LUFS momentâneo máximo). r3 contra r2:

  | Som | r3 | r2 | O que mudou |
  |---|---|---|---|
  | Canhão | -22,3 | -23,4 | |
  | Fuzil | -27,3 | -21,3 | Canhão agora 5,0 LU acima do fuzil; na r2 ficava 2,1 abaixo |
  | Assentar prédio | -27,5 | -14,9 | Ficava acima da explosão de prédio, agora fica abaixo |
  | Erro | -31,1 | -16,1 | |
  | Energia restabelecida | -27,7 | -9,9 | |
  | Fanfarra de vitória | -20,7 | -8,7 | Agora abaixo da explosão de prédio (-15,4) |

- **O panner deixou de ter salto** (`efeitos/pan.txt`). O fuzil mede -27,3, -27,5, -27,3 e -27,5 a 0, 1, 50 e 300 px do centro; na r2, -21,3 no centro e -24,9 a 1 px.
- **Roubo de vaga correto** (`efeitos/grande_vitimas.txt` e `grande_descartes.txt`, batalha grande com 2456 eventos):
  - 1838 cortes para 1838 roubos (r2: 2094 cortes para 1045 vozes).
  - Nenhum `boom`, `boom_small`, `hit_arty`, `bigboom` ou `boom_harv` é cortado (r2: 26 explosões cortadas, uma com 96% do som por tocar).
  - Os sons cortados são tiros e impactos, quase todos já no fim do buffer: 7% restante no `hit_shell`, 17% no canhão.
- **Variação de verdade** (`efeitos/variacao.txt`, correlação máxima entre tomadas, mediana). Melhoras:

  | Som | r3 | r2 | Observação |
  |---|---|---|---|
  | `death_inf` | 0,80 | 0,96 | |
  | `place` | 0,37 | 0,98 | |
  | `unit` | 0,17 | 0,96 | |
  | `select` | 0,38 | 1,00 | Na r2, idênticas bit a bit |
  | `credits` | 5 distintas | 3 de 5 idênticas | |
  | `boom` | 0,32 | 0,54 | |
  | `bigboom` | 0,20 | — | |

  O impacto de bala em metal (`hit_metal`) é novo e tem correlação de 0,14 entre tomadas.
- **Distância muito melhor** (`efeitos/distancia_r3.txt`, contra `som-r2/efeitos/distancia_r2.txt`):

  | Som e distância fora da tela | r3 | r2 |
  |---|---|---|
  | Canhão a 470 px | -28,2 | -37,9 |
  | Canhão a 670 px | -33,3 | -52,2 |
  | Boom a 970 px | -35,9 | mudo |
  | Bigboom a 970 px | -23,6 | — |
  | Fuzil a 470 px | -50,6 | mudo |

  - O canhão perde brilho com a distância: o centroide vai de 575 Hz para 118 Hz.
  - Na borda, o lado do som chega a +10 a +14 dB.
- **Pico de envelope mais cedo e menos sub** (`efeitos/transientes.txt` contra `transientes_r2.txt`):
  - pico de envelope do bigboom em 188 ms (r2: 529 ms) e do boom em 13 ms (r2: 38 ms);
  - energia abaixo de 80 Hz no boom: 42% (r2: 64%); no bigboom: 58% (r2: 78%);
  - perda num notebook (passa-altas de 250 Hz): boom 0,6 LU, bigboom 0,8 LU, `hit_shell` 0,8 LU.
- **Motores mais presentes e laços limpos** (`efeitos/motores.txt`, `lacos.txt`):
  - um blindado andando: -25,0 LUFS (r2: -31,2); três blindados: -20,4 (r2: -26,4);
  - laços de 6 s sem estalo na emenda (salto abaixo do percentil 99,9 da derivada em todos);
  - vento com correlação L/R de 0,21 (r2: 0,80) e autocorrelação abaixo de 0,04 em todos os atrasos de 1 a 8 s.
- **Créditos agora soam durante a descarga** (`efeitos/coletor_real.txt`). Em tempo real: 5 tiques em 2,7 s (107,8; 108,5; 109,1; 109,9; 110,5 s). Na r2: 2 em 43 s. Em jogo, isolado, o tique mede -28,6 LUFS (r2: -34,3).
- **Pedido do Rodrigo, em tempo real** (`coletor_real.txt`):
  - `unidade_harvester` ("Coletor pronto") em 87,2 s, pelo pacote;
  - `deploy` em 90,58 s e `harvester_deployed` em 90,6 s, pelo pacote;
  - nenhum descarte (`sfxDropped` = {}).

  O `deploy` agora vai pelo barramento da interface (`audio.js:344`, `bus: 'ann'`), então a pancada do braço em 0,60 s não é mais abafada pela voz, que começa a abaixar os efeitos em 0,65 s.

## Problemas (do mais grave ao menos grave)

### 1. O prédio explodindo ainda não aparece na batalha; o "momento" não funciona

**Medida na batalha grande** (`efeitos/momento.txt`, `scripts/momento.py`; A = batalha completa, B = a mesma sem prédio e Coletor explodindo):

| Evento | Subida sobre o tiroteio | A − B | Explosão contra a batalha, 0 a 0,4 s |
|---|---|---|---|
| bigboom em 14 s | +0,2 LU | -0,0 LU | -3,0 dB |
| Coletor (`boom_harv`) em 18 s | +0,2 LU | -0,3 LU | -5,2 dB |
| bigboom em 21 s | -0,0 LU | -0,4 LU | -3,4 dB |

Na r2, as subidas eram de +0,3, +1,1 e +0,5 LU. Quer dizer: **acrescentar um prédio desabando à batalha não muda em nada o que se ouve.**

**Batalha de referência** (`efeitos/batalha.txt`): o bigboom sobe +1,4 LU (r2: +2,3, ou seja, piorou). As 7 explosões de blindado ficam entre -1,8 e +0,8 LU.

**Por quê:**

- **O "momento" só abaixa o barramento leve**: fuzil, metralhadora e impactos de bala (`audio.js:461-466`; `light: true` em `:320-321` e `:327-328`).
  - Na batalha grande, as armas leves sozinhas dão -15,2 LUFS, e as pesadas (canhão, torre, granada, foguete) dão -13,3 LUFS (`momento_detalhe.txt`). Abaixar só as leves em 8 dB tira menos de 1 LU da batalha.
  - O eco e o reverb das armas leves vão para `slapSend` e `sfxRevSend` (`:436-440`), fora do `lightBus`, e não abaixam.
- **As explosões grandes batem no teto de pico do banco** (`sfxbank.js:674`, `g = Math.min(g, 0.97 / peak)`). Medido no banco (`tabela_banco.txt`):

  | Som | Medido | Alvo | Abaixo da tabela |
  |---|---|---|---|
  | bigboom | -10,8 | -8 | -2,8 LU |
  | `boom_harv` | -13,1 | -10 | -3,1 LU |
  | `hit_arty` | -14,1 | -12 | -2,1 LU |
  | boom | -12,3 | -11 | -1,3 LU |
  | `hit_shell` | -18,0 | -15,5 | -2,5 LU |

  - O Coletor explodindo fica **mais baixo** que um blindado explodindo.
  - O topo da hierarquia se achata: bigboom, boom e obuseiro ficam dentro de 2,2 LU uns dos outros (-10,8, -12,3 e -13,0).
- **Em jogo, um bigboom isolado dá só -15,4 LUFS** (momentâneo máximo), com pico de -5,3 dBFS. Sobram 4 dB de margem que não são usados, enquanto a batalha grande está em -12,3 LUFS.

**Como reproduzir:**

```
node efeitos/scripts/render_scene.js som-r3/rts efeitos/cena_grande_partes.json efeitos/grande_r3
python3 efeitos/scripts/momento.py efeitos/grande_r3
```

### 2. Zumbido da base: vibração de 29 dB quando a base ocupa as duas metades da tela, e mais alto que um blindado (novo)

- **Onde:** `audio.js:517`. Cada laço tem uma voz por metade da tela, e a da direita toca com `playbackRate` 1,03 contra 1,00 da esquerda.
- **Batimento:** com prédios dos dois lados, 60 Hz e 61,8 Hz se somam e batem a 1,8 Hz. Medido (`efeitos/zumbido.txt`, `cena_zumbido.json`), a modulação do envelope fica em:

  | Harmônico | Com prédios dos dois lados | Com prédios de um lado só |
  |---|---|---|
  | 60 Hz | 29,2 dB | 0,2 dB |
  | 240 Hz | 23,1 dB | — |
  | 720 Hz | 16,6 dB | — |

  É um "uá-uá" de 1,8 Hz em toda a base.
- **A rotação muda com a contagem de prédios:** `:587` aplica `1 + min(0,06, n * 0,01)`. Então a altura do zumbido e a frequência do batimento mudam quando se constrói um prédio ou se rola a tela.
- **Volume:**
  - a base com 4 ou mais prédios num lado: **-20,7 LUFS** contínuo; dos dois lados, -17,7;
  - um blindado andando: -25,0; o vento: -30,1; uma rajada de fuzil: -27,3 (momentâneo);
  - o prédio pegando fogo (`loop_fire`): -29,8, ou seja, **9 LU abaixo do zumbido da própria base**. O som novo de fogo some justamente onde o fogo acontece;
  - 71% da energia do zumbido fica abaixo de 150 Hz, e ele perde 7,3 LU num notebook. Quem ouve em fone recebe um ronco grave contínuo.

### 3. A interface afunda na batalha

**Medida** (`efeitos/batalha.txt`, batalha de referência; bandas de 1/3 de oitava em que o som de interface fica acima da batalha):

| Som | r3 | r2 | r1 |
|---|---|---|---|
| click | 1/21 | 2/21 | 1/21 |
| select | 2/21 | 3/21 | 3/21 |
| ready | **0/21** | 3/21 | 5/21 |
| alert | 2/21 | 3/21 | 9/21 |
| error | 2/21 | 7/21 | 8/21 |
| credits | 0/21 | 0/21 | 1/21 |

- A relação sinal/batalha em banda larga é de -5,8 dB para o clique e -13,9 dB para o "pronto".
- **Causa:** a interface desceu junto com a correção de nível. O clique foi de -22,7 para -29,4 LUFS e o "pronto" de -17,7 para -25,8. Clique e seleção (`busK` 0,6, `audio.js:382`) ficam no nível de um único fuzil (-27,3), numa batalha de -14,7 LUFS.
- **O "pronto" sem voz não aparece.** Quando a fala é recusada pelo intervalo, o sinal toca sozinho, sem ducking (`voice.js:188`, `cueOnly`). Num RTS AAA, o clique de comando e o sinal de "pronto" se ouvem sempre: ficam num barramento próprio e levemente comprimido, ou ganham um ducking curto dos efeitos.

### 4. A torre perdeu identidade; obuseiro e blindado dividem motor e morte

- **Torre contra canhão** (`efeitos/variacao.txt`): distância espectral de 8,1 dB (r2: 17,9 dB).
  - A distância entre tomadas do mesmo som é de 4,1 dB nos dois. A diferença entre eles é só o dobro da variação de cada um.
  - O que separava a torre era o servo antes do tiro. Ele foi para 0,45 s, com volume de 0,05 (`sfxbank.js:201`), e quase não aparece (`png/armas_r3.png`).
  - Sobra um anel de cano em 640 Hz como única assinatura.
  - O certo era corrigir o atraso sem jogar fora o caráter: rotação audível depois do tiro, cano mais longo e mais metálico, ou um "clang" de culatra mais forte.
- **Obuseiro e blindado:**
  - usam o mesmo laço de motor (`audio.js:561`);
  - usam a mesma explosão (`:486`, os dois caem em `boom`);
  - o batedor e o Coletor têm explosão própria; o obuseiro, não.
- **O impacto do lança-foguetes quase não varia:** distância entre tomadas de 2,9 dB, a menor de todas as armas.

### 5. Explosões: o estalo ainda não se destaca do corpo e os médios continuam fracos

**Medida** (`efeitos/transientes.txt`): diferença entre o estalo (0 a 5 ms) e o corpo (20 a 120 ms).

| Som | r3 | r2 |
|---|---|---|
| bigboom | +0,1 dB | +0,2 dB |
| `boom_harv` | +1,1 dB | +0,4 dB |
| boom | +1,8 dB | +1,0 dB |
| `hit_arty` | +1,9 dB | +0,3 dB |
| `boom_small` | +2,8 dB | +1,8 dB |
| torre | +1,1 dB | — |
| fuzil (referência) | +10,6 dB | — |

- O anúncio prometia o "ataque acima do corpo". Melhorou menos de 1,5 dB.
- **A camada de corpo de 150 a 600 Hz** (`sfxbank.js:115-118`, `k.body`) leva só de 7% a 14% da energia das explosões. Abaixo de 80 Hz ainda ficam de 42% a 66%.
- **O bigboom é quatro cópias da mesma forma:** ruído branco com passa-baixas descendo (`sfxbank.js:346-357`), visível em `png/explosoes_r3.png`.
- **Faltam camadas de material:** concreto rachando, vidro, o "whoomp" de bola de fogo com sucção.

### 6. Motores sem dinâmica nem marcha lenta

- **A velocidade é ignorada:** `updateAudioWorld` soma `speedK` (`audio.js:555`), mas nunca lê esse valor (`:579`, `const [n, panSum]`).
  - A rotação sobe com o **número** de unidades, não com a velocidade: 6 blindados soam 6% mais agudos que um.
  - As esteiras batem a exatamente 8 por segundo (`sfxbank.js:535`, 48 batidas a cada 0,125 s ± 8 ms), parado ou correndo.
- **Unidade parada é muda:** o motor só soa com `path.length > 0` (`:559-563`). Um blindado esperando ordem não tem marcha lenta.
- **Unidade fora da tela é muda:** os motores não têm queda por distância (`:558`, só na tela com margem de 60 px).
- **Notebook:** blindado e Coletor perdem 6,3 e 6,4 LU (75% e 71% da energia abaixo de 150 Hz).

### 7. Espaço: o vale não se ouve na tela, e a distância do prédio não abafa

- **Reverb de vale na tela** (`distancia_r3.txt`): relação cauda/direto de -35,8 dB no canhão, -41,8 no fuzil e -34,4 na torre, iguais à r2. O vale e o eco das mesas de pedra continuam inaudíveis nas armas que o jogador vê.
- **O bigboom não abafa com a distância:** o centroide fica entre 1070 e 1160 Hz até 470 px fora da tela, e a relação cauda/direto fica parada em -5 a -8 dB. O filtro (`audio.js:420`) usa `dist / range` com range de 2400, então a 470 px o corte ainda está em cerca de 5 kHz.
- **O "momento" também dispara fora da tela:** `place.dist < 0.25` (`audio.js:461`) inclui um prédio explodindo até 600 px fora da tela (25% de 2400). Uma explosão que o jogador não vê abaixa o tiroteio que ele está vendo.

### 8. Variação e cobertura ainda incompletas

- **Ainda repetidos** (`variacao.txt`, correlação máxima entre tomadas):
  - `sell`: 0,94, igual à r2 (a receita `sfxbank.js:391-399` não usa o gerador aleatório);
  - `click`: 0,85;
  - `repair`: 0,74;
  - `death_inf`: 0,93 no par mais parecido.
- **A morte do soldado some num notebook:** perde 14,4 LU, porque o baque é uma senoide de 110 Hz (`sfxbank.js:369`).
- **Detecção de metal:** `impactSound` só marca "metal" se `target.hp > 0` (`audio.js:480`). O tiro que mata um veículo soa como terra.
- **Sons que um RTS AAA tem e este não tem:**
  - passos e equipamento de infantaria;
  - projétil em voo;
  - fábrica trabalhando;
  - reparo contínuo (hoje é um disparo só, ao ligar);
  - descarga mecânica do Coletor (só os tiques de crédito);
  - marcha lenta de motor;
  - morte própria do obuseiro.

## O que faria a nota subir (em ordem de impacto)

1. **Explosão grande acima da batalha:**
   - soft-clip ou limitador na gravação do banco, para bigboom, boom, `boom_harv`, `hit_arty` e `hit_shell` chegarem à tabela em vez de pararem no teto de pico;
   - o "momento" abaixando todo o barramento de efeitos, menos a própria explosão (canhões também, de 6 a 8 dB por 0,8 s), e não só as armas leves;
   - meta: bigboom +6 LU sobre a batalha grande, medido com `momento.py`.
2. **Zumbido da base:** a mesma rotação nos dois lados (ou outro buffer e outro deslocamento em vez de 1,03), sem ligar a rotação à contagem de prédios, e de 8 a 10 LU mais baixo que hoje. O fogo deve ficar acima dele.
3. **Interface que se ouve no tiroteio:** barramento de interface com ducking curto dos efeitos (2 a 3 dB por 150 ms no clique e por 1 s no "pronto"), ou subir clique e seleção de 4 a 6 dB com conteúdo em 2 a 5 kHz. Meta: pelo menos 6 de 21 bandas acima da batalha de referência.
4. **Torre com identidade:** servo e rotação audíveis depois do tiro, cano longo metálico mais forte. Explosão e laço de motor próprios para o obuseiro. Meta: distância para o canhão de 15 dB ou mais.
5. **Estalo das explosões +6 dB acima do corpo**, médios entre 150 e 600 Hz com pelo menos 20% da energia, e camadas de material (concreto, vidro, sucção) no bigboom.
6. **Motores ligados à velocidade** (ler `speedK`), marcha lenta para unidades paradas, queda por distância e ritmo de esteira proporcional à velocidade.
7. **Cobertura:** passos, projétil em voo, fábrica, reparo contínuo e variação em `sell` e `click`. Reverb de vale audível na tela: relação cauda/direto de -20 a -25 dB no canhão.

## Scripts e saídas

Tudo fica em `/home/claude/criticos/som-r3/efeitos/`. Os scripts estão em `scripts/`; parte deles foi adaptada da rodada 2.

- **Banco de efeitos.**
  - `dump_bank.js` exporta o banco para `wav/` (113 buffers, 32 kHz). As comparações usam `wav_r2` e `wav_r1`.
  - `tabela.py` confere a tabela com BS.1770 independente e gera `tabela_banco.txt`.
  - `variacao.py` gera `variacao.txt`, `variacao_ui.txt` e `variacao_impactos.txt`.
  - `transientes.py` gera `transientes.txt` e `transientes_r2.txt`.
  - `lacos_r2.py` gera `lacos.txt`.
  - `espectrogramas.py` gera `png/armas_r3.png` e `png/explosoes_r3.png`.
- **Cadeia completa do jogo** (`render_scene.js`, `OfflineAudioContext` com sorteio semeado).
  - Sons isolados: `cadeia_r3/`, analisados por `cadeia.py`, resumo em `hierarquia_cadeia.txt` (com r2 e r1).
  - Pan: `pan_r3/`, resumo em `pan.txt`.
  - Distância: `dist_r3/`, analisada por `distancia.py`, resumo em `distancia_r3.txt`.
  - Motores: `cenas_motores_r3.json`, saídas em `motores_r3/`, resumo em `motores.txt`.
  - Zumbido: `cena_zumbido.json`, saídas em `zumbido_r3/`, resumo em `zumbido.txt`.
  - Batalha de referência: `batalha_r3/`, analisada por `batalha.py`, resumo em `batalha.txt`.
  - Batalha grande: `grande_r3/` e `grande_r2/`, com `cena_grande_partes.json`; análise de `momento.py` em `momento.txt`, mais `momento_detalhe.txt`, `grande_descartes.txt` e `grande_vitimas.txt`.
- **Tempo real.** `coletor_real.js` gera `coletor_real.txt`.

**Ressalva.** A máquina estava com carga de 8 a 11 durante as medidas. As cenas offline não dependem da carga. No tempo real, só a ordem e o intervalo dos eventos importam, e eles estão certos.
