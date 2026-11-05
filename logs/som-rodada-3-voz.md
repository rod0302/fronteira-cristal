# Crítica: Locutor e vozes (som-r3)

**Nota: 6,5 de 10**

| Subitem | r3 | r2 |
|---|---|---|
| (a) Inteligibilidade | 6 | 8 |
| (b) Naturalidade e caráter | 5,5 | 5 |
| (c) Cobertura e momento | 7,5 | 6 |
| (d) Fila, prioridade e frequência | 6,5 | 6 |
| (e) Respostas das tropas | 5,5 | 7 |
| (f) Robustez | 7 | 6 |

**Veredito.** A lógica da fila melhorou de verdade, e os quatro defeitos graves da r2 estão resolvidos:
- "Base sob ataque" agora sai de 1,0 a 1,35 s depois do aviso na tela. Antes eram 6,5 s, e a fala vinha como a terceira da fila.
- Acabou a sirene repetida.
- "Unidade perdida" não vira mais "Unidades prontas".
- A abertura não se perde mais.

Todos os eventos que o Rodrigo pediu disparam, só para o jogador e na hora certa, incluindo "Harvester deployed" nas duas origens.

Mas a rodada abaixou a voz cerca de 6 a 8 dB (o autor diz de 4 a 5), com a batalha no mesmo nível. Resultado na batalha grande:
- a relação fala/batalha caiu de +12,0 para **+3,8 dB** no locutor e de +8,3 para **+1,1 dB** nas tropas;
- o Whisper nas respostas das tropas caiu de 0,97 para **0,82**.

A fila nova também **corta pela metade** as falas de prioridade 2. Um "sob ataque" que chega durante "Harvester deployed" deixa 0,62 s de "Harves…", e a fala nunca mais toca para aquele Coletor. Um "Blindado pronto" que esteja esperando na fila é jogado fora em silêncio.

O "escolhido entre 6 tomadas pelo Whisper" não existe: o Kokoro gera amostras idênticas bit a bit. A urgência dos perigos veio só da velocidade, e a altura deles ficou **abaixo** da altura das falas neutras.

É um bom locutor de jogo indie. Ainda não é AAA.

---

## Pontos fortes (medidos)

1. **"Base sob ataque" na hora (problema 1 da r2 resolvido).**
   - Teste `eventos.js` (`out/eventos.log`): três blindados colados na Central.
     - "Base sob ataque" aparece na tela em 21,252 s e a voz entra em 22,60 s (**1,35 s**).
     - O "Inimigo detectado", pedido 0,03 s antes, foi cortado 0,07 s antes de começar a soar.
     - "Se aproximando" saiu da fila. Houve uma sirene só.
   - `eventos2.js` (`out/eventos2.log`), partida normal com névoa:
     - "Coletor sob ataque": tela em 50,92 s, voz em 51,93 s (**1,01 s**);
     - um soldado atirando na Usina: tela em 63,58 s, voz em 64,59 s (**1,01 s**), sem "se aproximando".
   - `fila.js`: com "Inimigo detectado" e "Inimigos se aproximando" já pedidos, "Base sob ataque" entra em **1,14 s**.
2. **Sirene só junto com a fala (problema 2 resolvido).**
   - Sessão de 3,8 min com mouse (`out/sessao_analise.txt`): 13 pedidos de `inimigo_base`, 1 aceito, **1 sirene**. Na r2 eram 6 sirenes em 8 s.
   - O `cueOnly` não toca mais `alert` nem `detect` (voice.js:188).
3. **Agrupamento correto (problema 3 resolvido).**
   - `fila.js`, cenário `tres_soldados`: "Unidade perdida" tocou como "Unidade perdida" depois de "Unidades prontas".
   - A perda não atualiza mais `lastUnitReadyAt` (voice.js:191).
4. **Cobertura do pedido, em tempo real e com o mouse** (`sessao.js`, `eventos2.js`):

   | Evento | Situação | Pedido → voz |
   |---|---|---|
   | "Comandante, base operacional" | toca | 0,16 s |
   | "Usina pronta" (em duas leituras) | toca | 0,46 s, depois do sino |
   | "Torre de defesa pronta" | 2 de 2 | 0,46 s |
   | "Coletor pronto" | Refinaria e Fábrica | 0,85 s (com `lead`) e 0,16 s |
   | "Harvester deployed" | 2 de 2 na sessão (Refinaria e Fábrica), 6 de 6 na partida de 7 min | 0,71 s, com o som hidráulico 14% sob a voz |
   | "Energia baixa" | toca | 0,61 s |
   | "Blindado pronto" | 2 de 2 (a segunda vez na leitura "Blindado a postos") | 0,2 s |
   | "Vitória" | toca | 1,46 s, depois da fanfarra |
   | "Derrota" | toca | 1,66 s, depois da fanfarra |

   - Nenhuma fala para eventos do inimigo.
5. **Sinal e voz não brigam** (`render.js pares`, `out/pares.txt`):
   - a voz fica de **18,5 a 48,9 dB** acima do sinal na janela da fala;
   - o pior trecho de 300 ms fica em +15,1 dB ("Harvester deployed" com o som hidráulico);
   - Whisper deu 1,00 em 8 dos 12 pares, e no mínimo 0,94.
6. **Falas limpas se entendem.** Whisper small (`out/asr_falas.txt`):
   - média de 0,978 no WAV cru, **0,985 no MP3 que o Chrome decodifica** e 0,961 depois da cadeia de rádio;
   - todas as 43 falas do locutor ficaram em 0,90 ou mais depois da cadeia.
7. **Volume entre falas parelho e pontas limpas** (`out/medidas_falas.txt`):
   - locutor de −21,9 a −17,9 LUFS na saída da cadeia (4,0 LU de diferença);
   - true peak máximo de −4,3 dBFS;
   - primeira e última amostra em 0, silêncio inicial de 32 a 49 ms;
   - as leituras `_v2` ficam a até 1,1 LU da leitura principal.
8. **Robustez básica** (`out/robustez.log`):

   | Teste | Resultado |
   |---|---|
   | Demonstração do título | muda: 0 vozes e 0 efeitos em 20 s |
   | Mudo (M) | nada toca e a fila fica vazia; depois de religar, "Base sob ataque" toca de novo |
   | `avancar(240)` | 0 vozes durante a simulação |
   | Título → Começar | "Comandante…" toca em 3 de 3 vezes (na r2 se perdia). A abertura é decodificada primeiro (1ª fala pronta em 539 a 699 ms; pacote inteiro em 3,5 a 5,7 s) |
   | Pedidos 100 a 1500 ms depois do clique | esperam o pacote e saem pelo pacote |

9. **Locutor e tropas nunca falam juntos.**
   - Partida de 7 min com a IA (`out/densidade_analise.txt`): **0 sobreposições** acima de 120 ms, já descontando os cortes registrados pelo `stop()`.
   - A ordem corta a resposta à seleção em 6 de 6 testes com o mouse (espera de 250, 450 ou 700 ms).

---

## Problemas (do mais grave ao menos grave)

### 1. A voz ficou baixa demais para a batalha grande; as tropas se perdem (grave, regressão)
- **Causa:** voice.js:152-155 (`vol` 1,2 → 0,66 no locutor e 1,0 → 0,58 nas tropas), com o ducking mais raso (voice.js:297 e 369: 0,45 e 0,6 no locutor e 0,8 nas tropas).
- **Medida:** mesma batalha sorteada da r2, mixada no OfflineAudioContext com a cadeia real do jogo (`render.js mix`, `medir_mix.py`, saídas em `out/mix.txt` e `out/comparar_r2.txt`).
  - A parte "voz" caiu de −16,2 para −21,8 LUFS (**−5,6 a −7,7 LU** conforme o nível).
  - A batalha ficou igual: −20,0 contra −19,7 LUFS.
- Relação fala/batalha (mediana, ponderação K, só na janela da fala):

  | Nível | Locutor r2 | Locutor r3 | Tropas r2 | Tropas r3 | Whisper tropas r3 |
  |---|---|---|---|---|---|
  | Batalha | +15,9 | **+8,0** | +12,1 | **+4,2** | 0,945 |
  | Grande | +12,0 | **+3,8** (p10 +2,4) | +8,3 | **+1,1** (mín. −1,1) | **0,820**, 9 de 22 abaixo de 0,9 |

- Exemplos na batalha grande:
  - "Entendido." → "Ainda em 30 anos." (0,24)
  - "Vou colher." → "So courteous!" (0,45)
  - "Alvo na mira!" → "Tausonariedade" (0,46)
  - "Aguardando ordens." → "Eu gosto de tantos ordens." (0,57)
  - "Energia baixa" → "Energia bíceps" (0,74)
  - "Quartel pronto" → "Quatro é o pronto?" (0,77)
- **"Base sob ataque"**, o aviso mais importante: +4,0 dB na batalha grande, com o pior trecho de 300 ms em **−3,3 dB**. Na batalha, o Whisper deu 0,87 ("Alerta a base da subataque").
- O locutor ainda passa no Whisper (média de 0,955). Só que o Whisper é mais tolerante que um ouvido cansado, e +2,4 dB no p10 não sobra nada para um alto-falante de notebook.
- Entendo que a crítica de mixagem da r2 pediu a voz de 3 a 6 LU acima da cama. O alvo foi atingido na média do locutor, mas:
  - as tropas ficaram abaixo dele;
  - o perigo ficou sem folga.

### 2. A fila de perigo corta pela metade "Harvester deployed" e "Coletor pronto", e joga fora "Blindado pronto" (grave, pedido do Rodrigo)
- **Causa:** voice.js:219-222. Um aviso de prioridade 3:
  - corta qualquer fala de prioridade **2 ou menos** que esteja tocando;
  - **descarta da fila tudo o que é prioridade 1 ou menos**.
- `voiceLast` já foi marcado no pedido (voice.js:211), então a fala descartada também gasta o intervalo dela.
- Teste `fila.js` (`out/fila.log`, registro de `start()` e `stop()` de cada buffer):

  | Cenário | O que acontece |
  |---|---|
  | `deployed_cortado_por_perigo` | "Harvester deployed" **cortado depois de 0,62 s** ("Harves…"), sirene, "Atenção! Nossa base está sob ataque!" |
  | `coletor_pronto_cortado` | "Coletor pronto" **cortado depois de 0,53 s** |
  | `blindado_na_fila_descartado` | "Usina pronta" cortada em **0,17 s** ("U…"); "Blindado pronto" estava na fila e **nunca tocou** |
  | `vitoria_por_cima` | "Torre de defesa pronta" cortada em 0,45 s |

- O "Harvester deployed" cortado não volta. O `harvDeployed` (voice.js:390-393) marca o Coletor antes de a fala tocar, e o Rodrigo nunca ouve a fala para aquele Coletor.
- O mesmo vale para a derrota (`eventos.js`): "Unidade perdida" é cortada em 0,26 s e "Central perdida" em 0,4 s, antes de "Derrota". São dois pedaços de palavra em 1 s.
- O certo: o perigo **espera a frase terminar** quando ela acaba em menos de cerca de 0,8 s, ou corta e põe a fala de prioridade 2 de volta na fila. E nunca descarta "unidade pronta".

### 3. "Escolhida entre 6 tomadas pelo Whisper" não acontece: o Kokoro é determinístico (sério, afirmação falsa)
- `scripts/determinismo.py`: três gerações seguidas de "Alerta! A base está sob ataque!" (`pf_dora`, 1,1) e de "Harvester deployed." (`af_heart`, 0,95) saíram **idênticas bit a bit** (diferença máxima de 0,0).
- O ruído de batalha do juiz é sorteado com semente fixa, `default_rng(n)` em gerar.py:85. Ele também não muda entre as tomadas.
- O laço de gerar.py:121-135 gera 6 vezes o mesmo áudio. O "relatório do reconhecedor" só **descreve** a única tomada que existe; ele não escolhe nada.
- Prova: `vatk_4`, "Pode deixar!":
  - relatório: 0,98;
  - WAV salvo: 0,64 ("Pod-de-Shal");
  - na cadeia do jogo: **0,61 ("Pod Judicial")**, o mesmo da r2.
- Para ter variação de verdade:
  - variar a velocidade (0,95 / 1,0 / 1,05), a pontuação ou o texto;
  - ou misturar estilos de voz (o Kokoro aceita um vetor de estilo misturado);
  - e escolher a tomada depois da cadeia `veh`.

### 4. Os perigos não soam urgentes: são mais rápidos, porém mais graves e mais baixos que as falas neutras (sério, "premium AAA")
`out/medidas_falas.txt`:
- **Altura.** "Alerta! A base está sob ataque!" tem F0 de **175 Hz** e "O coletor…" de 180 Hz. As falas neutras ficam de 176 a 197 Hz ("Usina pronta" 195, "Blindado pronto" 197). A urgência veio só da velocidade: 6,7 sílabas/s contra 4,85 na mediana.
- **Volume.** Na saída, "Base sob ataque" fica em **−20,4 LUFS**, 1,3 LU abaixo da mediana do locutor (−19,1). O aviso mais importante é mais baixo que "Construindo" (−18,6).
- **"Atenção, inimigo detectado"** continua sendo a fala mais baixa do pacote: **−21,9 LUFS**, 2,8 LU abaixo da mediana. É o mesmo defeito da r2 (−15,6 contra −13,0). Na batalha grande ficou em **+0,7 dB** sobre a batalha.
- **A palavra de perigo também se diluiu.** As segundas leituras dos perigos começam com "Atenção!", a mesma palavra do aviso de contato ("Atenção, inimigo detectado"). O "Alerta!" deixa de ser exclusivo do perigo.
- **Sobra pronúncia errada.** "Derrota. Nossa base caiu." é ouvido como "caíva" ou "caíra" (0,94) no WAV cru, no MP3 e na cadeia.

### 5. A resposta à ordem é engolida por qualquer aviso de prioridade 2 (sério, tropas)
- voice.js:265-267: um aviso de prioridade 2 ("Usina pronta") **corta** a resposta da tropa.
- voice.js:333-334: enquanto o locutor fala, a ordem seguinte fica **sem resposta nenhuma**.
- `fila.js`, cenário `tropa_e_locutor`: `vsel_6` cortado em 0,25 s por "Usina pronta", e a ordem de mover 0,4 s depois **não teve resposta**.
- Numa base que constrói o tempo todo (13 falas por minuto no pico, problema 7), o jogador dá ordens e a tropa fica muda.
- A resposta à ordem é retorno de controle. Ela deveria passar na frente da fala informativa, ou pelo menos ficar esperando na fila.

### 6. "Inimigo detectado" chega depois de "sob ataque", fora de contexto
- `eventos2.js`: um batedor aparece da névoa atacando o Coletor.
  - Em 50,92 s: "Alerta! O coletor está sob ataque!".
  - Em 51,23 s: o vigia pede "Inimigo detectado" (voice.js:415-417), que **toca em 54,71 s** com o pulso de radar.
- O problema da r2 foi resolvido só para a ordem contrária. A trava de voice.js:197 vale para `inimigo_base`, mas não para `inimigo_detectado`.
- Em `eventos.js`, o radar (`detect`, em 21,25 s) e a sirene (em 21,59 s) tocam com 0,34 s de diferença. São dois sinais para uma fala só.

### 7. Frequência: o limite por minuto ainda cala "Blindado pronto", e o pico passou de 12 falas por minuto
- O limite (voice.js:207-208) agora conta só as falas de prioridade 0 e 1. Mas "unidade pronta" **também é prioridade 1**, e briga com "Estrutura vendida", "Créditos insuficientes", "Limite de unidades" e "Estrutura inimiga destruída".
- `fila.js`, cenário `limite_por_minuto`: depois de 7 falas desse tipo, **"Blindado pronto", "Obuseiro pronto" e "Batedor pronto" foram recusados**.
- O agrupamento também cala:
  - Em `tres_soldados`, "Blindado pronto", 5 s depois de dois soldados, virou um "Unidades prontas" recusado pelo intervalo de 8 s. O blindado ficou sem fala.
  - O `lastUnitReadyAt` é atualizado mesmo quando a fala é recusada, e o próximo também cai.
- Na partida de 7 min com a IA no difícil (`out/densidade_analise.txt`):
  - **8,4 falas por minuto** (na r2 eram 6,9), falando 18,7% do tempo;
  - **12 e 13 falas** nos minutos 4 e 5, porque "Usina pronta", "Coletor pronto" e "Harvester deployed" (prioridade 2) não têm teto;
  - `unidade_tank`: 17 pedidos e 11 falas.

### 8. Rádio dos veículos e elenco
- **Cadeia `veh`.** Abrir o passa-baixas para 6,8 kHz não mudou o Whisper (correlação de 0,98 com a saída da r2):

  | Frase | Reconhecido | Nota |
  |---|---|---|
  | "Pode deixar!" | "Pod Judicial" | 0,61 |
  | "Alvo na mira!" | "Auf una Mira!" | 0,75 |
  | "Positivo." | "Pozytivo" | 0,75 |
  | "Deixa comigo." | "Teixa com igu" | 0,80 |

  O problema está na tomada (problema 3), e não no filtro.
- **Mesmo tripulante em todos os veículos.** Blindado, batedor e obuseiro continuam sendo o mesmo `pm_santa`, diferenciado só pelo `playbackRate` (voice.js:358). O Coletor tem 2 frases de seleção e 2 de movimento.
- **"Harvester deployed" ainda é outra mulher** (`out/elenco.txt`):
  - `af_heart` tem F0 de 213 Hz contra 183 Hz da `pf_dora` (+2,6 semitons);
  - o espectro médio fica a 4,0 dB da `pf_dora`, além do p90 da própria `pf_dora` (2,8 dB).
  - Testei 10 vozes inglesas (`out/alternativas_hd.txt`). A **`af_sarah`** fica a 1,9 dB, com +1,5 semitons, e o Whisper dá 1,00. Essa medida foi feita na voz crua, sem o tratamento do gerador.
- **Teto de banda.** O MP3 a 24 kHz corta em 10,2 a 11,3 kHz (`scripts/banda.py`). Fica sem o "ar" de estúdio.

### 9. Reservas sem o pacote (`?semvozes`) iguais às da r1
- "Coletor pronto", "Torre de defesa pronta", "Inimigo detectado" e "Blindado pronto" continuam com `via: "sem voz"`.
- O resto cai na voz robótica, com o código sem mudança (`out/robustez.log`).
- O risco é baixo, porque o pacote vem embutido.

**Limites destas medidas:**
- Não ouvi nada. A inteligibilidade é a do Whisper small.
- A batalha das mixagens foi sorteada com os efeitos do próprio banco (mesmo gerador da r2), e não gravada de uma partida.
- As sessões em tempo real rodaram com a CPU disputada (carga de 7 a 12). Delas uso só os tempos e os registros, e não as gravações.

**Correção de medida:** na primeira passada, as mixagens e os pares davam −1 dB de voz sobre o sinal em "Base sob ataque". Era um vazamento do meu script: a `pickTake` sorteava a leitura `_v2`, que não estava silenciada. Corrigi `offline_helper.js` (silencia todas as leituras e sorteia com uma semente própria) e refiz tudo. Os números acima são os corrigidos.

---

## Pedido do Rodrigo: situação

| Pedido | Situação |
|---|---|
| Coletor pronto | **OK**: Refinaria e Fábrica, com duas leituras. **Mas é cortado depois de 0,53 s** se chegar um perigo (problema 2), e na batalha o Whisper ouviu "Coletor Bronzu" (0,79). |
| Torre pronta | **OK**: "Torre de defesa pronta", 0,46 s depois de a obra terminar. |
| Base sob ataque | **OK no momento**: 1,0 a 1,35 s depois da tela, sem "se aproximando" antes. **Frágil no som**: é mais baixa e mais grave que as falas neutras, e na batalha grande o pior trecho fica a −3,3 dB. |
| Inimigo detectado | Dispara, mas é a fala mais baixa do pacote e chega **depois** de "sob ataque" (problema 6). |
| **Harvester deployed** | **Toca**: 6 de 6 e 2 de 2, nas duas origens. **Mas um perigo o corta em "Harves…" e ele não volta** (problema 2). |
| "Premium AAA, muito, muito bom" | **Ainda não.** Uma só voz sintética por papel, perigos sem urgência na altura, tomadas que não existem e cortes no meio de palavras. |

---

## O que faria a nota subir (em ordem de impacto)

1. **Voz de volta acima da batalha só quando ela está alta.** Abaixar a batalha por um compressor com sidechain da voz é melhor que subir o fader da voz.
   - Meta: locutor a +8 dB e tropas a +6 dB sobre a batalha grande, no p10.
   - Perigo com +2 a +3 dB extras e ducking mais fundo (0,35).
   - Subir "Inimigo detectado" e "Base sob ataque" até a mediana do pacote.
2. **Perigo sem cortar palavras.**
   - Espera o fim da frase em andamento, ou corta e põe as falas de prioridade 2 de volta na fila.
   - "Harvester deployed" só marca o Coletor depois de **tocar**.
   - Não descarta "unidade pronta".
   - Na derrota, nada de pedaços de "Unidade perdida" e "Central perdida".
3. **Tomadas de verdade e urgência de verdade.**
   - Gerar variando a velocidade e o estilo de voz, porque o Kokoro repete bit a bit.
   - Perigos +2 a +3 semitons por mudança de altura depois da síntese.
   - "Alerta!" só nos perigos.
   - Escolher a tomada depois da cadeia `veh` e da batalha.
4. **A resposta à ordem tem a vez.** Ela não é cortada por fala de prioridade 2 e não some enquanto o locutor fala: espera até 1 s.
5. **"Inimigo detectado" não toca até 15 s depois de um "sob ataque"**, e um só sinal por contato.
6. **Teto de falas por minuto contando também as de prioridade 2**, com "unidade pronta" fora do limite ou agrupada, e nunca muda.
7. **Elenco:** "Harvester deployed" em `af_sarah` (ou a própria `pf_dora` com fonemas escritos), um tripulante por tipo de veículo e mais frases para o Coletor.

---

## Scripts e saídas

Pasta: `/home/claude/criticos/som-r3/voz/`

**Scripts** (`scripts/`; os da r2 com os caminhos ajustados):

| Script | O que faz |
|---|---|
| `render.js` + `offline_helper.js` | Falas, pares e mixagens no OfflineAudioContext com a cadeia real. Corrigido para silenciar as leituras `_v2` e sortear a leitura com semente própria. |
| `asr_falas.py`, `asr.py` | Whisper no WAV cru, no MP3 decodificado e na cadeia |
| `medir_falas.py` | LUFS, F0, sílabas/s e pontas |
| `medir_pares.py` | Sinal + voz |
| `medir_mix.py` | Fala/batalha e Whisper na mixagem |
| `comparar_r2.py` | Voz e batalha, r2 contra r3 |
| `elenco.py`, `alternativas_hd.py` | Timbre do elenco e vozes alternativas para "Harvester deployed" |
| `banda.py` | Banda útil do MP3 |
| `determinismo.py` | Prova de que as tomadas do Kokoro são idênticas |
| `fila.js` + `instrumento2.js` | Cenários da fila em tempo real, com registro de corte |
| `eventos.js`, `eventos2.js`, `sessao.js`, `densidade2.js` + `analisar_densidade.py` | Partidas em tempo real |
| `robustez.js` | Testes de robustez |

**Saídas** (`out/`):
- `asr_falas.txt`, `medidas_falas.txt`, `pares.txt`, `mix.txt`/`mix.json`, `comparar_r2.txt`
- `fila.log`, `eventos.log`, `eventos2.log`, `sessao_analise.txt`, `densidade_analise.txt`
- `robustez.log`, `elenco.txt`, `alternativas_hd.txt`

**Áudio:** `wav_radio/` (falas pela cadeia), `wav_mix/` (pares e batalhas) e `wav/` (vozes alternativas).
