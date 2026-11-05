# Crítica: mixagem, robustez e desempenho (som-r3)

**Nota: 6 de 10**

| Subitem | Nota | Rodada 2 |
|---|---|---|
| (a) Balanço entre efeitos, voz, música e ambiente | 5 | 5 |
| (b) Dinâmica e clareza | 7 | 6 |
| (c) Fadiga numa partida de 8 a 10 min | 5 | 3 |
| (d) Desempenho e memória | 5 | 4 |
| (e) Robustez e regressão | 8 | 7 |

**Veredito.** Esta rodada fechou quase todos os defeitos graves da rodada 2, e eu conferi cada um medindo:
- "Unidade perdida" não vira mais "Unidades prontas".
- O limite por classe funciona: 40 tiros dão 16 tocando, 30 explosões dão 8.
- A sirene toca 1 vez em 30 s, contra 19 antes.
- A tabela de loudness bate com a BS.1770 a ±0,3 LU nos sons que não batem no teto de pico.
- O canhão fica 5,4 LU acima do fuzil na saída, e os sinais ficam abaixo das explosões grandes.
- O teto ficou em -1,6 dBTP.
- Os testes passam e a simulação continua idêntica.

Mas a correção do volume da voz foi longe demais. O efeito subiu cerca de 4 LU, a voz desceu 5,7 LU e o abaixamento ficou mais raso. Com isso, **no auge da batalha o locutor e as tropas ficam abaixo do tiroteio**: de -0,2 a -4,3 dB na banda da fala (1 a 4 kHz). Na rodada 2 eram de +5,3 a +9,3 dB. O Whisper confirma a perda:
- Na mesma bateria de 20 falas, 6 falas que ele entendia limpas saíram estragadas na mixagem, contra 1 de 19 na rodada 2.
- Entre elas está **"Coletor pronto" → "Coletor Pronsley"**, uma das frases do pedido do Rodrigo.
- As respostas das tropas no tiroteio somem: "Fogo à vontade!" → "Revoizontagem".

Isso não é AAA. Num RTS de estúdio, o locutor é a coisa mais clara da mixagem. O resto é custo e fadiga:
- Gravar o banco ainda leva de 8,5 a 12 s, e a taxa de quadros cai de 49 para 21 fps nesse tempo.
- O áudio usa 43 MB de memória.
- O locutor fala de 61 a 70 vezes em 10 minutos.
- Cada Refinaria gera 3 falas em 4 s.

> **Pedido do Rodrigo, item por item:**
> - **"Coletor pronto"**: toca 5 vezes por partida, agora com 2 tomadas. **Na batalha, o Whisper ouviu "Coletor Pronsley"** (problema 1).
> - **"Torre pronta"**: toca como "Torre de defesa pronta" (4 por partida). Inteligível na mixagem nas 2 vezes.
> - **"Base sob ataque"**: toca como "Alerta! A base está sob ataque!" ou "Atenção! Nossa base está sob ataque!". Inteligível no campo. **Na cena da base, o Whisper ouviu "Alerta à base da sub-ataque"** (0,36; só a voz dava 0,73).
> - **"Inimigo detectado"**: toca (2 por partida) e é inteligível. Mas sai **3 LU mais baixo** que as outras falas (-19,6 contra -16,5 LUFS na cadeia).
> - **"Harvester deployed"**: **corrigido e tocando.** Confirmei que passou no `fumaca.js` e que toca 5 vezes em cada partida de 10 min. É inteligível na mixagem nas 2 vezes que medi.
> - **Sem o pacote de vozes, "Coletor pronto", "Torre pronta" e "Inimigo detectado" continuam MUDOS** (`?semvozes` dá "sem voz"). Não mudou desde a rodada 1.
> - **Som "premium AAA": ainda não.** A hierarquia dos efeitos ficou boa, mas a voz perdeu a clareza no tiroteio.

---

## Pontos fortes (medidos)

- **Hierarquia dos efeitos correta na saída** (`scripts/efetivo.py`, `out/nivel-efetivo.txt`, LUFS momentâneo máximo, com os ganhos `busK` de `audio.js:381`):

  | Som | LUFS | | Som | LUFS |
  |---|---|---|---|---|
  | bigboom | -19,5 | | cannon | -25,4 |
  | boom | -20,8 | | rifle | -30,8 |
  | win | -21,8 | | mg | -30,9 |
  | deploy | -22,3 | | error | -32,3 |
  | alert | -26,7 | | place | -32,7 |

  - O canhão fica 5,4 LU acima do fuzil. Na rodada 2, ficava abaixo.
  - A fanfarra de derrota (`lose`) caiu de -6,8 para -25,9 LUFS.
  - "Energia restaurada" (`powerup`) caiu de -11,9 para -28,8 LUFS.
- **A tabela agora mede certo** (`scripts/tabela_lufs.py`, `out/tabela-lufs.txt`). Corrigi meu script, que contava em dobro os sons mono exportados em 2 canais. Com isso:
  - 27 de 33 sons ficam a ±0,5 LU da tabela.
  - Os que ficam abaixo batem no teto de pico de 0,97: bigboom -2,7, boom_harv -2,9, alert -2,8, lose -2,9 e hit_shell -2,4.
- **Teto e limitador** (`scripts/limitador.py`, `out/limitador.txt`):
  - Pico verdadeiro de -1,59 dBTP no campo e -1,67 dBTP na base. A rodada 2 tinha -0,51.
  - Nenhuma amostra acima de 1,0.
  - O limitador tira p95 de 0,5 dB, com máximo de 3,3 dB e 1 episódio acima de 3 dB.
  - A cola dos efeitos tira no máximo 2,9 a 3,1 dB, sem bombear.
  - O barramento da música, que passava de 0 dBFS (+1,6) na rodada 2, agora fica em -9,3 dBFS.
- **O limite de vozes funciona** (`scripts/cap.js`, `out/cap.json`):
  - 40 tiros dão 16 tocando. Mais 40 canhões continuam dando 16.
  - 30 explosões dão 8, com `activeVoices` em 24.
  - Na batalha real, a classe `shot` ficou no máximo em 16 e `hit` em 12. Na rodada 2, chegavam a 29 e 17.
  - Nenhuma explosão descartada (`dropped` só tem 1 `hit_bullet` e 1 `hit_metal`).
- **Sirene uma vez por evento** (`scripts/sirene.js`, `out/sirene.json`): 4 blindados parados perto da Central por 30 s dão 1 sirene e 1 fala. Na rodada 2, eram 19 sirenes.
- **"Unidades prontas" não aparece mais depois de baixas:**
  - `scripts/fala_perdida.js`: só "unidade_perdida".
  - Batalha de campo: nenhuma "unidades_prontas", contra 2 a 3 na rodada 2.
  - Partida de 10 min: os casos que o meu script atribui a "unidade_perdida" são artefato da heurística dele. O código só agrupa quando `UNIT_TYPES[key.slice(8)]` existe (`voice.js:189`).
- **Robustez** (`scripts/robustez.js`, `out/robustez.json`; `scripts/mudo2.js`):
  - **Simulação idêntica:** `__jogo.estado()` sai igual nos 6 minutos de `avancar(60)` (semente 12345, IA nos dois times) entre a nova versão, a anterior (`orig/rts`) e a da rodada 2.
  - **Mudo e música:** o mudo cria 0 nós por segundo e não gasta o intervalo da fala ("energia_baixa" é aceita depois de desmutar). N desliga a música.
  - **Travamento:** depois de 4 s com a thread principal travada, só 1 fonte dispara.
  - **Sem vazamento:** IA contra IA por 133 s em tempo real, as fontes vivas ficaram entre 23 e 43. Depois de congelar, sobram 26 (13 laços e os osciladores da música), com `activeVoices` em 0.
  - **Testes e erros:** `tests/fumaca.js` (36 ok, "Tudo certo") e `tests/partida.js` (vencedor aos 22 min; o jogador parado cai aos 7 min) passaram a partir de uma cópia. Nenhum erro de console em file://, `?premium`, `?semvozes` ou `?vozrobo`. No Premium só aparecem avisos do driver GL.
- **Os laços chegam cedo:** na tela de título, eles entram aos 3,9 s e o banco termina aos 8 s (`robustez.json` → `primeiros`). Na rodada 2, os laços só entravam aos 12–13 s.
- **Memória menor** (`scripts/probe.js`, `out/probe.json`, na mesma execução):

  | Parte | Rodada 3 | Rodada 2 |
  |---|---|---|
  | SFX | 32,9 MB | 36,7 MB |
  | Falas | 10,4 MB (24 kHz) | 17,4 MB |
  | **Total** | **43,3 MB** | **54,1 MB** |

  A cauda abaixo de -50 dB do pico de cada som soma só 0,76 MB.

---

## Problemas (do mais grave ao menos grave)

### 1. No tiroteio, a voz ficou abaixo da batalha e o Whisper perde falas (balanço; regressão)

**Causas:**
- A cadeia do locutor sai com `vol: 0.66` e a das tropas com `0.58` (`voice.js:152-155`).
- O abaixamento vai a 0,6 (-4,4 dB) nas falas comuns (`voice.js:297`) e a 0,8 (-1,9 dB) nas respostas das tropas (`voice.js:369`).
- Os efeitos subiram cerca de 4 LU: o stem de efeitos foi de -20,5 para -16,4 LUFS integrado na mesma batalha de campo.

**Medido.** `scripts/batalha.js novo|r2 60 campo falas` força uma fala do locutor a cada 3 s, durante 60 s, numa batalha de 64 unidades. Saída em `out/batalha-*-falas.*`, `out/asr-mix-falas.txt` e `out/asr-mix-r2falas.raw`.

| | Rodada 3 | Rodada 2 |
|---|---|---|
| Stem do locutor, integrado | -16,9 LUFS | -11,2 LUFS |
| Mixagem final, integrada | -15,3 LUFS | -11,6 LUFS |
| Fala contra o resto, banda de 1 a 4 kHz, primeiros 13 s (tiroteio) | **-4,3 a -0,2 dB** | +5,5 a +9,4 dB |
| Mesma medida, mediana dos 60 s | +9,8 dB | +18,8 dB |
| Whisper: frase da mixagem igual à da voz sozinha | **14/20** | 18/19 |

Falas estragadas pela mixagem na versão nova:

| Tempo | Só a voz | Na mixagem |
|---|---|---|
| 4,5 s | "Coletor pronto." | **"Coletor Pronsley"** |
| 25,3 s | "blindado a postos." | "Blindado Apóstolos" |
| 53,0 s | "Alerta o coletor está sob ataque." | "…está suba ataque." |
| 58,4 s | "Quartel Pronsos" | "Quarta é o pronto!" |

**Batalha de campo normal** (`out/asr-mix.json`): 2 de 3 falas estragadas.
- "Unidade perdida." → "Unidade Benjiva".
- A resposta "Fogo à vontade!" saiu limpa da cadeia e virou **"Revoizontagem."** na mixagem.
- As 2 respostas "vatk" ficaram de **3,3 a 3,6 dB abaixo** do resto na banda da fala.

**Base sob ataque** (`out/batalha-novo-base*`): "Alerta! A base está sob ataque!" virou "Alerta à base da sub-ataque" (0,36; só a voz dava 0,73).

**Conclusão:** a rodada 2 recomendou baixar a voz para -16 a -18 LUFS **com a batalha onde estava**. A voz chegou lá, mas a batalha subiu junto. A meta certa é a diferença: voz pelo menos +4 a +6 dB acima do resto na banda de 1 a 4 kHz, no pior momento.

### 2. "Inimigo detectado" sai 3 LU mais baixo que o resto do locutor (balanço; pedido do Rodrigo)
- Na mesma cadeia e na mesma batalha, `inimigo_detectado` fica em **-19,6 LUFS** nas duas vezes. As outras falas do locutor ficam de -16,1 a -17,4 (`out/batalha-novo-falas.json` → `analisa_batalha.py novo-falas`).
- No tiroteio, ela ficou **4,3 dB abaixo** do resto na banda da fala, a pior relação da bateria. Ainda passou no Whisper.
- O MP3 do pacote já vem mais baixo: momentâneo máximo de -18,7 contra cerca de -15 nas outras falas (`out/banco.txt`).
- O pacote de falas não é normalizado por loudness: a variação passa de 3 LU entre falas do mesmo locutor.

### 3. Gravar o banco ainda custa caro: tempo, quadros e memória (desempenho)
- **Tempo** (`scripts/banco_tempo.js`, `out/banco-tempo.json`): 4 aberturas intercaladas, nova, r2, nova, r2, com carga de 4 a 5.

  | | Rodada 3 | Rodada 2 |
  |---|---|---|
  | Banco gravado | 10,8 e 12,1 s | 10,1 e 15,6 s |
  | Falas decodificadas | 5,6 e 5,7 s | 5,9 e 8,0 s |

  Com carga baixa (`out/probe.json`), foram 8,5 s contra 15,2 s.
- **Taxa de quadros:**
  - Durante a gravação, **19,5 a 21,7 fps**, contra 34 a 49 fps depois.
  - Foram de 54 a 73 tarefas longas, somando 3,9 a 5,0 s, ou de 35% a 41% do tempo.
  - A tarefa mais longa durou de 163 a 189 ms. Com carga 7 (`out/bankbuild.json`), chegou a 482 ms, com 18,3 s de banco.
  - A meta da rodada 2 era menos de 4 s, sem tarefa acima de 100 ms. Não foi cumprida.
- **Memória:** 43,3 MB, contra a meta de cerca de 25 MB. Os maiores:

  | Som | MB |
  |---|---|
  | bigboom | 3,9 |
  | loop_wind | 2,9 |
  | boom | 2,6 |
  | arty | 2,2 |
  | hit_arty | 2,1 |

- **O pacote cresceu:** `src/voicepack.js` tem 1,93 MB (1,41 MB com gzip), contra 1,76 MB (1,29 MB) na rodada 2.
- **Nós criados por segundo na batalha:** média de 93, pico de 560. Na rodada 2, eram 83 e 504.
- **O comentário ainda não bate com o código:** `sfxbank.js:712` diz "Três gravações em paralelo", mas `sfxbank.js:727` roda duas.

### 4. O "momento" das explosões vira abaixamento quase contínuo das armas leves (dinâmica)
- `audio.js:461-466`: cada `boom`, `boom_small` ou `bigboom` na tela abaixa o `lightBus` para 0,6–0,7, por 0,8 a 1,1 s.
- Na batalha de campo (`out/batalha-novo.json` → `mon.lb`), o fuzil, a metralhadora e os impactos de bala ficaram de **-3 a -4,4 dB em 25% dos 60 s**. Nos primeiros 17 s, foi **quase sem parar**:

  ```
  .....########++########++.#########+.......###########+#######+###++
  ```

  Cada caractere vale 0,25 s: `#` é abaixo de 0,7 e `+` é abaixo de 0,9.
- Um destaque que fica ligado o tempo todo deixa de ser destaque e só tira as armas leves do clímax. Falta um tempo mínimo entre momentos (por exemplo, 3 s) ou um limite de quantos podem se encadear.

### 5. Fadiga: o locutor fala mais que antes, e o Coletor gera 3 falas em 4 s
Medido em `scripts/fadiga2.js` (`out/fadiga2.json`): partida de 10 min com IA nos dois times, 3 sementes e a fila real.

- **Falas por partida:**

  | Semente | Falas | Rodada 2 |
  |---|---|---|
  | 7 | 61 | 54 a 62 |
  | 99 | 70 | |
  | 2024 | 67 | |

  - No pior minuto, foram 11 a 13 falas: o limite de 7 por minuto vale só para as informativas.
  - "Unidades prontas" tocou de 12 a 15 vezes, agora com 2 tomadas.
  - "Usina pronta" tocou 7 vezes, com 2 tomadas.
- **A Refinaria dispara uma sequência fixa:** "Refinaria pronta", depois "Coletor pronto" com +2,0 s e "Harvester deployed" com +3,7 a 4,5 s. São 3 falas e 3 sinais para um único acontecimento, 3 vezes por partida, e sempre na mesma ordem. Também apareceu na partida real IA contra IA (`robustez.json`: 43,1, 45,2 e 47,4 s).
- **Créditos:** o intervalo caiu de 2000 para 650 ms (`audio.js:345`). Com a Refinaria na tela, isso dá cerca de 5 tiques por descarga (500 de carga ÷ 160 por segundo = 3,1 s de descarga), contra cerca de 1,5 antes.
  - Pedidos por partida: de 10 381 a 14 476, ou de 173 a 241 s de descarga.
  - O nível é baixo: -31,2 LUFS na saída.
- **Variações quase iguais nos sons de interface mais repetidos.** É a semelhança média de espectrograma entre as variações (`out/banco.txt`):

  | Som | Rodada 3 | Rodada 2 |
  |---|---|---|
  | `click` | **0,97** | 0,35 |
  | `select` | 0,93 | 1,0 |
  | `place` | 0,905 | 0,92 |
  | `sell` | 0,915 | 0,92 |
  | `credits` | 0,67 | 0,52 |

  O resumo do autor diz "variações novas em seleção, prédio assentado e créditos", mas as medidas mal se mexem. No `click`, as variações ficaram mais parecidas.

### 6. Cena calma: o zumbido de 60 Hz da base passou a música (balanço)
- Na base calma (`out/batalha-novo-calmo-*`), o ambiente ficou em **-25,6 LUFS** e a música em **-27,8 LUFS**. Na rodada 2, o ambiente ficava em -30,7 e a música em -28,8.
- **No ambiente, a faixa de 50 a 70 Hz fica só 4,7 dB abaixo do total.** É um tom fixo de 60 Hz que toca o tempo todo enquanto o jogador está na base. No fone, cansa. No notebook, some: o ambiente perde 4,0 LU com um passa-altas de 180 Hz (`out/notebook.txt`).
- A mixagem final perde 2,2 LU no notebook, contra 1,1 LU na rodada 2. A fatia de grave (20 a 60 Hz) subiu de -7,8 para -6,2 dB, apesar do "sub reduzido em 40%".

### 7. O compressor da voz ainda passa de 6 dB
Na batalha (`analisa_batalha.py`), o compressor da cadeia do locutor chegou a **9,6 dB** de redução, e o dos veículos a 8,2 dB (9,7 dB na cena calma). Os ajustes continuam os da rodada 2: limiar -22, razão 2,5 (`voice.js:131`). A média é de 3,9 dB no locutor. Isso dá espaço para baixar o limiar menos e subir o volume da cadeia (ver problema 1).

### 8. As reservas continuam mudas para três das frases do pedido (robustez)
Com `?semvozes` ou `?vozrobo`, e sem voz pt-BR no navegador (caso do Chromium no Linux), três frases do pedido saem como "sem voz": `unidade_harvester` ("Coletor pronto"), `pronto_turret` ("Torre pronta") e `inimigo_detectado` (`robustez.json` → `reserva_*`). O robô só tem fonemas para 4 frases em inglês (`voice.js:533`). É o terceiro relatório seguido que aponta isso.

---

## O que faria a nota subir (em ordem de impacto)

1. **Devolver a voz para cima da batalha, sem subir o volume geral.**
   - Subir as cadeias em +4 a +5 dB (`voice.js:152-155`: `vol` de 0,66 para cerca de 1,1 no locutor, e de 0,58 para cerca de 0,95 nas tropas). Ou baixar os efeitos 3 dB no clímax.
   - Abaixar a batalha a 0,5 nas falas comuns e a 0,65 nas respostas.
   - Teste de aceitação: `batalha.js novo 60 campo falas` com a banda de 1 a 4 kHz em pelo menos +4 dB em todas as falas, e o Whisper com 19 de 20 iguais à voz sozinha.
2. **Normalizar o pacote de falas por loudness** no `gerar.py`: todas as falas do locutor a ±1 LU, a começar por `inimigo_detectado` (+3 dB).
3. **Encadear melhor as falas da Refinaria e do Coletor.** Quando "Coletor pronto" vem até 6 s depois de "Refinaria pronta", cortar uma das duas ou juntar numa fala só ("Refinaria pronta, coletor a caminho"). Deixar "Harvester deployed" só para o primeiro Coletor ou para os Coletores feitos na Fábrica.
4. **Limitar os momentos das explosões:** no máximo 1 a cada 3 s, ou só para `bigboom` e `boom_harv` quando houver vários `boom` em sequência.
5. **Banco mais leve.** A meta continua: até 4 s, nenhuma tarefa acima de 100 ms e até 25 MB.
   - Gravar `bigboom`, `boom`, `arty` e `hit_arty` em mono, com o estéreo dado pelo reverb e pelo eco.
   - Vento de 12 s em mono.
   - Pós-processamento (loudness e corte) em blocos com `requestIdleCallback`.
6. **Zumbido da base 4 a 6 dB abaixo, com o fundamental em 120 Hz** em vez de 60 Hz. Ou dar mais peso aos harmônicos e menos ao fundamental.
7. **Variações reais de verdade** em `click`, `select`, `place` e `sell` (semelhança abaixo de 0,6), e créditos com intervalo de 1200 ms.
8. **Pequenos ajustes:**
   - Reserva do robô para "Coletor pronto", "Torre pronta" e "Inimigo detectado" (pode ser em inglês: "Harvester ready", "Turret ready", "Enemy detected").
   - Compressor da voz com no máximo 6 dB.
   - Comentário de `sfxbank.js:712` igual ao código.

---

## Scripts e saídas

Todos ficam em `/home/claude/criticos/som-r3/mix/`. Os scripts da rodada 2 foram copiados para `scripts/`, com caminhos novos. Servidores http: 8785 (rodada 3), 8786 (`orig/rts`) e 8787 (rodada 2, para comparar na mesma execução), porque o AudioWorklet por blob não carrega em file://.

**Mudanças nos scripts herdados:**
- `lib.js` tem o alvo `R2`.
- `batalha.js` tem o modo `falas`, que pede uma fala a cada 3 s com `gap: 0`. Também registra a tomada que tocou de verdade (`pickTake`) e os ganhos do `lightBus` e do `cueBus`.
- `efetivo.py` e `tabela_lufs.py` tratam os sons mono certo e aplicam o `busK`.
- `robustez.js` compara o determinismo também com a rodada 2.
- `mudo2.js` é novo: testa o mudo com uma fala nunca dita.

**Scripts usados:**
- Batalhas: `batalha.js` (cenas campo, base, calmo e campo-falas, na versão nova e na r2), com `analisa_batalha.py`, `limitador.py`, `notebook.py` e `asr_mix.py`.
- Níveis e banco: `efetivo.py`, `tabela_lufs.py`, `analisa_banco.py`, `dump.js`.
- Lógica do áudio: `cap.js`, `sirene.js`, `fala_perdida.js`, `fadiga2.js`, `robustez.js`, `mudo2.js`.
- Desempenho: `probe.js`, `banco_tempo.js`.

**Saídas** (`out/`):
- Gravações: `batalha-{novo,r2,novo-base,novo-calmo,novo-falas,r2-falas}-*.wav` e os `.json` correspondentes.
- Análises: `analise-batalhas.txt`, `limitador.txt`, `notebook.txt`.
- Reconhecedor: `asr-mix.json`, `asr-mix-falas.txt`, `asr-mix-r2falas.raw`.
- Níveis e banco: `nivel-efetivo.txt`, `tabela-lufs.txt`, `banco.txt`, e os WAVs exportados em `bank/` e `voz/`.
- Lógica e desempenho: `cap.json`, `sirene.json`, `fala-perdida.json`, `fadiga2.json`, `robustez.json`, `mudo2.json`, `probe.json`, `banco-tempo.json`, `bankbuild.json`.
- Testes: `partida.txt` e `fumaca.txt`, os dois passaram. Rodaram a partir de `mix/copia/rts`.

**Ressalvas de medição:**
- Outros críticos usavam a máquina ao mesmo tempo, com carga entre 1 e 8. Por isso, os tempos foram comparados na mesma execução, com as versões intercaladas.
- Os WAVs de `voz/` foram exportados com a taxa errada (44,1 kHz, quando as falas estão a 24 kHz). Não usei a duração deles. O loudness das falas foi medido na cadeia real do jogo.
