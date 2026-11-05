# Crítica: mixagem, robustez e desempenho (som-r2)

**Nota: 5 de 10**

| Subitem | Nota | Rodada 1 |
|---|---|---|
| (a) Balanço entre efeitos, voz, música e ambiente | 5 | 4 |
| (b) Dinâmica e clareza | 6 | 4 |
| (c) Fadiga numa partida de 8 a 10 min | 3 | 5 |
| (d) Desempenho e memória | 4 | 5 |
| (e) Robustez e regressão | 7 | 8 |

**Veredito.** A mixagem melhorou bastante no que a rodada 1 cobrou:
- A cola não bombeia mais: no máximo 1,9 dB de redução, antes eram 10,6 dB.
- O final caiu de -11,3 para -15,0 LUFS na batalha.
- A música subiu: agora fica 11 LU abaixo do final, antes eram 22,6 LU.
- O alto-falante de notebook tira só 2,5 LU dos efeitos.
- As variações agora são de verdade.
- O mudo, a música (N) e o travamento estão consertados.
- Não há vazamento, e a simulação continua idêntica à versão anterior.

Mesmo assim, a nota não sobe, por três motivos:
1. **Surgiram bugs novos que um jogador nota na primeira partida.**
   - O locutor diz **"Unidades prontas" quando unidades MORREM** (3 a 4 vezes por partida de 10 min).
   - A sirene toca **a cada 1,5 s** enquanto houver 3 inimigos perto da base: 19 sirenes em 30 s.
   - O limite por classe não limita nada: 40 tiros pedidos de uma vez, 40 tocando, com limite de 16. Quando há mais de 44 vozes, **as explosões são descartadas** e os tiros continuam.
2. **A tabela de loudness, que é a base da mixagem nova, mede errado.** O medidor do jogo corta abaixo de 100 Hz. Por isso, sons graves de interface saíram de 7 a 9 LU acima do alvo. Na saída, a fanfarra de derrota fica 14 LU acima da maior explosão. O "energia restaurada" fica 9 LU acima. Até o bipe de erro fica acima. O canhão do blindado soa mais baixo que um fuzil.
3. **O custo de desempenho continua alto.**
   - Gravar o banco leva de 11,6 a 22 s, e a taxa de quadros cai pela metade nesse tempo.
   - A memória de áudio é de 54 MB, contra a meta de cerca de 25 MB.
   - O `voicepack.js` cresceu para 1,77 MB.
   - Os nós criados por segundo voltaram a 88/s, contra 52/s na rodada 1.

> **Pedido do Rodrigo, item por item (contado numa partida de 10 min com IA, 3 sementes):**
> - "Coletor pronto": toca, inclusive para o coletor que vem com a Refinaria (5 por partida).
> - "Torre pronta": toca como "Torre de defesa pronta" (4 por partida).
> - "Base sob ataque": toca como "Alerta! Base sob ataque!". O Whisper acertou essa fala dentro da mixagem, no meio da batalha.
> - "Inimigo detectado": toca como "Atenção, inimigo detectado" (2 por partida). O Whisper acertou depois da cadeia de rádio.
> - "Harvester deployed": **corrigido e tocando** quando o Coletor chega ao cristal (5 por partida, e passou no `fumaca.js`). Agora sai na mesma voz feminina do locutor.
> - **Novo defeito em cima do pedido:** "várias coisas assim" inclui "Unidade perdida", e essa fala foi **trocada por "Unidades prontas"** (problema 1).
> - **Sem o pacote de vozes**, "Coletor pronto", "Torre pronta" e "Inimigo detectado" continuam mudos (problema 9).
> - Som "premium AAA": **ainda não**. Os motivos estão abaixo.

---

## Pontos fortes (medidos)

- **A cola dos efeitos parou de bombear.** Na batalha de campo (64 unidades, 60 s), a redução do compressor de cola ficou em 0,1 dB de média e 1,9 dB de máximo. Na rodada 1 ficava acima de 6 dB em 26% do tempo.
- **O limitador quase não age e nada clipa.**
  - Saída final: pico verdadeiro de -0,65 dBTP no campo e -0,93 na base, sem nenhuma amostra acima de 1,0.
  - Redução real do limitador, com o atraso alinhado e a compensação de +2,28 dB descontada: p95 de 0,4 dB, máximo de 4,2 dB e 1 episódio acima de 3 dB.
- **Loudness geral razoável:**

  | Cena | Final, LUFS integrado | Música | Ambiente |
  |---|---|---|---|
  | Batalha de campo | -15,0 (rodada 1: -11,3) | -26,0 | -30,6 |
  | Base sob ataque | -12,4 | -28,0 | -31,9 |
  | Base calma | cerca de -25 sem falas (p10 -25,3) | -28,8 | -30,7 |

  A música agora se ouve em combate.
- **O grave não domina mais o que o notebook toca.** Simulei um alto-falante de notebook com passa-altas de 180 Hz, 4ª ordem. A perda foi de 0,6 LU no final e 2,5 LU nos efeitos. Na versão anterior eram 6,0 e 6,4 LU. O passa-altas de 35 Hz e a prateleira de -4 dB funcionam.
- **A voz se entende em batalha.** Recortei a saída final em cada fala e passei no Whisper: **12 de 13 falas perfeitas** nas duas batalhas. Isso inclui "Alerta base sob ataque", "Inimigos se aproximando da base", "Central perdida não podemos mais construir" e três respostas "vatk" no meio dos tiros. A relação fala/resto na banda de 1 a 4 kHz ficou com mínimo de +5,7 dB e mediana de +7,8 dB no campo, e mínimo de +8,5 dB e mediana de +15,9 dB na base. Na rodada 1, o pior caso era -1,9 dB.
- **Variações de verdade.** A semelhança de espectrograma entre variações caiu de cerca de 0,97 para 0,19–0,42: boom 0,19, rifle 0,19, mg 0,18, cannon 0,42, arty 0,33. Os 5 `credits` não são mais idênticos (0,52).
- **O zumbido da base não pulsa mais.** O envelope na emenda do `loop_hum` varia -0,3 dB, contra -3,6 dB na rodada 1, porque o laço tem 2,0 s, um número inteiro de ciclos de 60 Hz.
- **Correções de robustez confirmadas** (`out/robustez.json`):
  - O mudo não gasta mais o intervalo das falas: depois de desmutar, "Inimigo detectado" é aceita.
  - Com o mudo, 0 nós por segundo, contra 6,8/s na rodada 1. Sem música, também 0.
  - Depois de 4 s de travamento da thread principal, só 2 fontes disparam, contra 11 na rodada 1.
- **Nenhum vazamento.** A rodada 1 não contava `AudioBufferSourceNode`; corrigi o `lib.js` para contar.
  - IA contra IA em tempo real por cerca de 140 s: as fontes vivas oscilaram entre 21 e 31.
  - Depois de congelar e esperar 8 s: 24 fontes vivas (11 laços, 1 vento e o resto osciladores da música).
  - `activeVoices` e todas as classes voltaram a 0.
- **Simulação idêntica à versão anterior:** mapa 1, semente 12345, IA nos dois times, `avancar(60)` × 6. Os seis `__jogo.estado()` são iguais entre `rts` e `orig/rts`.
- **Testes, `tests/partida.js`:** passou. Teve vencedor no IA contra IA, e o jogador parado foi destruído aos 7 min.
- **`?premium`, file:// sem servidor e `?vozrobo`:** sem erros de console. No Premium só aparecem avisos do driver GL.
- **Carga da página igual à anterior.** Mediana de 4 cargas intercaladas com a máquina em carga 10: load de 1122 ms na nova contra 1061 ms na anterior, e heap de 17 MB contra 13 MB.

---

## Problemas (do mais grave ao menos grave)

### 1. O locutor diz "Unidades prontas" quando unidades morrem (fadiga e erro de informação)
- **Causa:** `voice.js:183` agrupa qualquer fala cujo nome começa com `unidade_` em "Unidades prontas", se outra `unidade_*` veio menos de 8 s antes:

  ```js
  if (key.startsWith('unidade_') && key !== 'unidade_harvester') {
    if (now - lastUnitReadyAt < 8) key = 'unidades_prontas';
  ```

  Só que `unidade_perdida` também começa com `unidade_`. A segunda baixa em menos de 8 s vira "Unidades prontas", e cada baixa ainda renova o `lastUnitReadyAt`.
- **Reproduzido em tempo real** (`scripts/fala_perdida.js` → `out/fala-perdida.json`). Matei 3 soldados com `killEntity`, um a cada 2,5 s. O locutor tocou `19 unidade_perdida` e depois `20.7 unidades_prontas`. A terceira baixa sumiu, porque o intervalo do agrupamento é de 8 s, não os 45 s de "Unidade perdida".
- **Na batalha gravada:**
  - Campo: "Unidade perdida" aos 1,8 s, depois **"Unidades prontas" aos 3,6 s, 10,2 s e 19,6 s**, sem nenhuma produção.
  - Base: "Unidade perdida" aos 3,5 s e "Unidades prontas" aos 5,3 s.
  - O Whisper confirma a frase na mixagem.
- **Numa partida de 10 min** (`scripts/fadiga2.js`, fila do locutor ligada e relógio do jogo; detalhes no problema 4):

  | Semente | "Unidades prontas" tocadas | Causadas por baixa | Pedidos de "Unidade perdida" | "Unidade perdida" falada |
  |---|---|---|---|---|
  | 7 | 11 | **3** | 15 | 1 vez |
  | 2024 | 12 | **4** | 37 | 1 vez |

  O jogador perde unidades e o jogo comemora.

### 2. O limite por classe não limita, e as explosões é que somem (dinâmica)
- **Causa:** `audio.js:375-380`. Com a classe cheia, o som novo "rouba" a vaga do mais fraco com `weakest.kill()`. Mas o morto **continua na lista** até o `onended`, com a mesma prioridade. O próximo som acha o mesmo "mais fraco", mata de novo (sem efeito) e entra também. Resultado: depois de cheio, quase tudo entra.
- Quando `activeVoices >= MAX_VOICES` (44) e a classe do som novo está vazia, `weakest` é `null` e o som é descartado. Isso pega justamente as explosões, que são poucas e da classe `boom`.
- **Medido** (`scripts/cap.js` → `out/cap.json`):

  | Teste | Limite | Tocando |
  |---|---|---|
  | 40 `rifle` em regiões diferentes da tela, num mesmo quadro | 16 | **40** |
  | Mais 40 `cannon` | 16 | **80** na classe `shot` |
  | `activeVoices` depois dos canhões | 44 | 80 |
  | 30 `boom` logo depois | | **0 tocados, 30 descartados** |

- **Na batalha real de campo:** `shot` chegou a 29 vozes (limite 16), `hit` a 17 (limite 12) e `activeVoices` a 48. Em cada um desses momentos, uma explosão nova seria descartada. É a hierarquia invertida: o tiroteio cala as explosões.

### 3. A tabela de loudness mede errado: interface e sinais mais altos que as explosões (balanço)
- **O medidor do jogo** (`sfxbank.js:575-600`, `loudnessOf`) usa um passa-altas de 2ª ordem em **100 Hz**, enquanto o filtro K da BS.1770 corta em 38 Hz. Ele subestima tudo que é grave, e o ganho calculado sobe esses sons.
- Reimplementei o medidor do jogo em Python (`scripts/tabela_lufs.py`). Ele reproduz a tabela: bigboom -10,0, boom -12,0, cannon -14,5. A mesma medida pela BS.1770 de verdade (momentâneo máximo, janela de 400 ms) dá outra coisa:

  | Som | Tabela | BS.1770 | Desvio |
  |---|---|---|---|
  | `lose` | -14 | -5,8 | **+8,2** |
  | `powerup` | -20 | -11,0 | **+9,0** |
  | `place` | -16 | -8,9 | **+7,1** |
  | `win` | -14 | -9,8 | +4,2 |
  | `cannon` | -14,5 | -18,2 | -3,7 |
  | `hit_shell` | -15 | -19,0 | -4,0 |
  | `hit_rocket` | -15,5 | -19,9 | -4,4 |
  | `detect` | -18 | -22,1 | -4,1 |

  O comentário da tabela promete "Prédio > veículo > canhões > impactos > fuzil > interface". Medido, `cannon` (-18,2) fica **abaixo** de `rifle` (-17,2) e de `mg` (-18,3).
- **Na saída** (`scripts/efetivo.py`: buffer × barramento × geral 0,9; nos efeitos também ×0,42, passa-altas de 35 Hz e prateleira), em LUFS momentâneo máximo:

  | Som | Barramento | LUFS |
  |---|---|---|
  | `lose` | sinais | **-6,8** |
  | `win` | sinais | -10,7 |
  | `powerup` | sinais | **-11,9** |
  | `powerdown` | sinais | -17,2 |
  | `alert` | sinais | -17,8 |
  | `error` | interface | **-18,2** |
  | `ready` | sinais | -19,5 |
  | `bigboom` | efeitos | **-20,9** |
  | `click` | interface | -22,3 |
  | `boom` | efeitos | -23,3 |
  | `cannon` | efeitos | -27,7 |

  - O bipe de erro fica 2,7 LU acima do prédio explodindo.
  - O clique de interface fica acima de um blindado explodindo.
  - "Energia restaurada" (`powerup`) fica 9 LU acima da maior explosão.

  O barramento de sinais (`cueBus`) não passa pela atenuação dos efeitos (0,42, ou -7,5 dB) nem pela prateleira de grave. Por isso os sinais saem 7,5 dB acima de tudo, mais o erro da tabela.
- **A voz domina tudo.** Pela cadeia de rádio real (`scripts/cadeia2.js`), o locutor sai a -10,9 LUFS de mediana, com faixa de -13,5 a -9,8 e momentâneo de até -7,6. Isso fica 10 LU acima da maior explosão. Numa mixagem de RTS de estúdio, a voz fica de 3 a 6 LU acima da cama da batalha, não 10 a 19 LU acima (Δ medido de +9 a +19 dB na base).

### 4. Fadiga: a sirene repete, as falas não têm tomada alternativa e cada ordem abaixa a batalha
- **Sirene a cada 1,5 s.** O vigia (`voice.js:397`) pede `announce('inimigo_base', {cue:'alert'})` a cada 0,5 s enquanto houver 3 ou mais inimigos perto dos prédios. Dentro do intervalo de 40 s da fala, o `cueOnly()` (`voice.js:181`) toca **só a sirene**, limitada apenas pelo `gap` de 1500 ms do som.
  - Medido (`scripts/sirene.js` → `out/sirene.json`): 4 blindados parados perto da Central, 30 s, **19 sirenes e 1 fala**.
  - Na partida de 10 min da semente 2024, foram 57 pedidos de `inimigo_base` e 56 pedidos de sirene, para 2 falas.
  - A sirene sai a -17,8 LUFS pelo barramento de sinais, que não abaixa sem voz.
- **Uma tomada por fala do locutor.** O `voicepack.js` tem 38 falas do locutor, cada uma com uma tomada. Só as respostas das tropas têm 6 variações. Numa partida de 10 min (`out/fadiga2.json`, 3 sementes):

  | Medida | Valor |
  |---|---|
  | Falas por partida | 54 a 62 (5 a 7 por minuto) |
  | "Unidades prontas" | **11 a 17 vezes**, sempre a mesma gravação |
  | "Usina pronta" | 7 vezes |
  | "Coletor pronto" e "Harvester deployed" | 5 vezes cada |
  | Pedidos do som de créditos | 10 381 a 14 476 (17 a 24 por segundo de jogo) |

  O som de créditos só toca de fato 1 vez a cada 2 s por região de 160 px (`gap: 2000`). Mesmo assim, são até 30 tiques por minuto com a Refinaria na tela. O nível é baixo, -37,8 LUFS.
- **Cada resposta das tropas abaixa os efeitos em 4,4 dB** (`voice.js:341`, `duck(..., 0.6)`), com intervalo mínimo de 0,9 s entre ordens. Um jogador que dá 40 ordens por minuto deixa a batalha "respirando" o tempo todo. Na batalha de campo, os efeitos ficaram abaixados 7 dB ou mais em **22% do tempo**, e na base em **34%**, com 21% em -10,5 dB.

### 5. Gravar o banco ainda custa caro: tempo, quadros e memória (desempenho)
- **Tempo**, medido 2 vezes com a máquina em carga de cerca de 10 (`out/desempenho.txt` e `banco-tempo.json`):

  | | Carga 2 (`out/probe.json`) | Carga 10 |
  |---|---|---|
  | Banco gravado | 11,6 s | 21,0–22,3 s |
  | Falas decodificadas | 6,6 s | 10,9–13,1 s |

  Com carga 18 (`out/bankbuild.json`), o banco levou 40 s.
- **Taxa de quadros na carga 10:**

  | | fps | Quadro mais longo |
  |---|---|---|
  | Durante a gravação | 10,2–11,7 | 700–717 ms |
  | Depois | 22,8–24,3 | |

  Foram 131–146 tarefas longas, somando 13,7–15,5 s, ou **cerca de 70% do tempo de gravação** com a thread principal ocupada. A tarefa mais longa durou 383–461 ms; com carga 18, chegou a 953 ms. O banco "grava fora da linha principal" só em parte: a montagem dos grafos e o pós-processamento em JS (loudness, corte da cauda, cópia) rodam nela.
- **O código não faz o que diz:** o comentário `sfxbank.js:659` fala em "Três gravações em paralelo", mas o código roda duas (`sfxbank.js:673`).
- **Os laços chegam tarde:** só começam por volta de 12–13 s na tela de título com a máquina carregada (`robustez.json` → `primeiros`), porque estão depois da primeira variação dos 32 sons.
- **Memória dos AudioBuffers** (`out/probe.json`): **54 MB**, contra 61 MB na rodada 1, e a meta sugerida era de cerca de 25 MB.

  | Parte | MB | Detalhe |
  |---|---|---|
  | SFX_BANK | 36,7 | 104 buffers a 32 kHz |
  | `loop_wind` | 5,9 | sozinho: 24 s em estéreo |
  | bigboom | 4,5 | |
  | boom | 3,3 | |
  | Amostras abaixo de -50 dB do pico | 8,7 | ainda guardadas |
  | Falas | **17,4** | 78 falas, 103,5 s, decodificadas a 44,1 kHz float32 |

  As falas sairiam por 10 MB a 24 kHz.
- **`src/voicepack.js` tem 1,77 MB** (1,29 MB com gzip), contra 0,71 MB na rodada 1, ou 2,5 vezes mais.
- **Nós criados por segundo na batalha:** média de 88/s, pico de 536/s, contra 52/s na rodada 1. Cada efeito monta até 7 nós: fonte, ganho, filtro de distância, panorâmico, direto, envio de reverb e envio de eco.

### 6. O compressor da voz trabalha demais
- Na batalha, o compressor da cadeia do locutor chegou a 8,9–9,2 dB de redução, e o dos veículos a 9,6 dB (limiar -22, razão 2,5). A rodada 1 recomendou no máximo 6 dB.
- **A cadeia ainda estraga falas que saem limpas do MP3.** Comparei em pares com o Whisper, a mesma fala decodificada limpa contra a mesma fala depois da cadeia do jogo (`out/asr-radio2.json` e `asr-limpa-subset.txt`):

  | Fala | Limpa | Depois da cadeia |
  |---|---|---|
  | `col_mov_1` | "Vou colher" | "Vau Collier" |
  | `vatk_3` | "Alvo na mira" | "Auf una Mide" |
  | `treinando` | "treinando" | "Trinandos" |
  | `mov_3` | "Positivo" | "Posicivo" |
  | `pronto_power` | "Usina pronta" | "Usa a pronta" |
  | `vsel_5` | "Sim, Comandante" | "Cinco comandante" |

- Acerto médio depois da cadeia: locutor 0,89, infantaria 0,72 e veículos 0,70. Na rodada 1 eram 0,89, 0,67 e 0,81, ou seja, sem ganho.

### 7. O teto ainda fica acima de -1 dBTP
O pico verdadeiro foi de -0,65 dBTP no campo. Isso dá pouca folga para gravação de tela e streaming, que comprimem com perda. O barramento da música sozinho passou de 0 dBFS (+0,56 dBFS, com 10 amostras acima de 1,0 antes do limitador) com a tensão alta, por causa de `MUSIC_LEVEL = 1.9` (`audio.js:188`).

### 8. `tests/fumaca.js` falha com a máquina carregada
Rodei 2 vezes, a partir de uma cópia em `mix/tests/`, com carga entre 10 e 18:
- 1ª execução: 3 falhas, em "pacote de vozes decodificado (77 falas)", "banco de efeitos gravado" e "tempo avança em tempo real".
- 2ª execução: 2 falhas, em "banco de efeitos gravado" e "fps aceitável (>= 30)".

As falhas vêm de tempo. O teste confere o banco num instante fixo (`fumaca.js:121-122`), mas a gravação leva de 20 a 40 s nessa carga. Isso não é regressão de lógica: "Harvester deployed" e o resto passaram. Mesmo assim, mostra que o banco ainda não está pronto 20 s depois do clique numa máquina fraca.

### 9. As reservas continuam mudas para as frases do pedido
Com `?semvozes` e sem voz pt-BR no navegador (caso do Chromium no Linux), "Coletor pronto", "Torre de defesa pronta" e "Inimigo detectado" saem como "sem voz". Só "Harvester deployed", "Base under attack", "Low power" e "Victory" sobram pelo robô (`robustez.json` → `reserva_semvozes`). Isso não mudou desde a rodada 1.

---

## O que faria a nota subir (em ordem de impacto)

1. **Corrigir o agrupamento** em `voice.js:183`: agrupar só as chaves de unidade pronta (por exemplo, testar `LINES[key]` contra uma lista de prontas, ou renomear para `pronta_*`). Ao mesmo tempo, agrupar várias baixas em "Unidades perdidas".
2. **Consertar o roubo de vaga** em `audio.js:375-380`:
   - Ao matar, tirar a voz da lista (ou marcá-la `dead`) e decrementar `activeVoices` na hora.
   - Com o limite global cheio, roubar a vaga do mais fraco **de qualquer classe**, para que uma explosão tire o lugar de um tiro.
   - Teste de aceitação: `cap.js` com no máximo 16 tiros e 30 booms tocando até 8.
3. **Trocar o medidor da tabela pela BS.1770 de verdade** (filtro K em 38 Hz) e recalibrar a hierarquia na saída, não no buffer:
   - Explosões grandes de -14 a -16 LUFS momentâneo na saída, canhão acima de fuzil.
   - Sinais e interface pelo menos 3 a 6 LU abaixo das explosões grandes. A fanfarra de fim de partida pode ser a exceção, mas não 14 LU acima.
   - Passar os sinais pela mesma prateleira de grave.
4. **Voz 4 a 6 LU mais baixa** (alvo de cerca de -16 a -18 LUFS na saída) e duck mais raso, por volta de -4 a -6 dB, com o perigo um pouco mais fundo. A inteligibilidade sobra: a relação fala/resto mínima medida foi de +5,7 dB. Isso devolve o peso da batalha, que hoje passa de 22% a 34% do tempo abaixada 7 dB ou mais.
5. **Sirene de perigo uma vez por evento:** `cueOnly` não deve tocar a sirene quando a fala foi recusada pelo intervalo; para `inimigo_base`, pode ficar no máximo um pulso de radar a cada 10–15 s. Além disso, 2 a 3 tomadas por fala frequente ("Unidades prontas", "Usina pronta", "Coletor pronto", "Harvester deployed").
6. **Banco mais leve:**
   - Vento de 24 s em mono ou de 8 s com variação de filtro ao vivo.
   - Corte de cauda em -50 dB.
   - Falas decodificadas num OfflineAudioContext de 24 kHz.
   - Pós-processamento em blocos, com `requestIdleCallback`.
   - Laços antes dos sons raros.
   - Meta: no máximo 25 MB, menos de 4 s e nenhuma tarefa acima de 100 ms.
7. **Teto em -1 dBTP** (limitador em -5 dB ou com ganho de saída) e compressor da voz com no máximo 6 dB. Validar as respostas `col_mov`, `vatk_3` e `treinando` depois da cadeia, não no WAV.
8. **Pequenos ajustes:**
   - Reserva do robô para as frases do pedido ("Coletor pronto", "Torre pronta", "Inimigo detectado"), em inglês se for preciso.
   - `fumaca.js` esperando o banco com `waitForFunction`, em vez de conferir num instante fixo.
   - Comentário de `sfxbank.js:659` igual ao código.

---

## Scripts e saídas

Todos ficam em `/home/claude/criticos/som-r2/mix/`. Os scripts da rodada 1 foram reaproveitados, com caminhos e portas trocados. As portas http são 8775 (nova) e 8776 (anterior), porque o AudioWorklet por blob não carrega em file://. Mudanças nos scripts herdados:
- `lib.js` agora conta também as `AudioBufferSourceNode`. O da rodada 1 só contava osciladores, então o "nenhum vazamento" de lá não cobria os buffers.
- `batalha.js` grava também o barramento `sinais` (`cueBus`), registra os ganhos de efeitos e música, a ocupação por classe e os descartes, e usa o atraso real da voz (`lead` + 0,16 s).
- `dump.js` grava o banco a 32 kHz. O da rodada 1 usava a taxa do contexto.

**Scripts** (`mix/scripts/`):

| Script | O que mede |
|---|---|
| `batalha.js` + `analisa_batalha.py` + `limitador.py` | Saída real em stems, cenários campo, base e calmo, novo e antigo |
| `asr_mix.py` | Whisper na mixagem final |
| `notebook.py` | Perda com passa-altas de 180 Hz |
| `tabela_lufs.py` | Tabela SFX_LUFS contra BS.1770 e contra a réplica do medidor do jogo |
| `efetivo.py` | Nível de cada som na saída |
| `cap.js` | Limite por classe |
| `fala_perdida.js` | Bug do "Unidades prontas" |
| `sirene.js` | Sirene repetida |
| `fadiga2.js` | 10 min com a fila do locutor ligada e os relógios trocados pelo do jogo |
| `cadeia2.js` + `asr_radio2.py` | Falas pela cadeia de rádio real e Whisper |
| `probe.js`, `banco_tempo.js`, `dump.js`, `carga.js`, `inicio_rapido.js` | Memória, tempo do banco, fps, exportação e carga |
| `robustez.js` | Determinismo, M, N, travamento, vazamento, reservas, Premium e primeiros segundos |
| `analisa_banco.py`, `lacos.py` | Banco e emendas dos laços |

**Saídas** (`mix/out/`):
- Gravações: `batalha-{novo,novo-base,novo-calmo,antigo}-*.wav` e os `.json` correspondentes.
- Medidas: `tabela-lufs.json`, `nivel-efetivo.json`, `cap.json`, `fala-perdida.json`, `sirene.json`, `fadiga2*.json`, `robustez.json`, `probe.json`, `banco-tempo.json`, `bankbuild.json`, `carga.json`, `desempenho.txt`, `banco.txt`, `banco-medidas.json`, `banco-semelhanca.json`, `radio2-loudness.json`.
- Reconhecedor: `asr-radio2.{txt,json}`, `asr-limpa-subset.txt`.
- Áudio exportado: `bank/`, `voz/`, `radio2/`.
- Testes: `mix/partida.txt` (passou), `mix/fumaca.txt` e `mix/fumaca2.txt` (falhas de tempo com a máquina carregada).

**Ressalva de medição:** outros críticos usavam a máquina ao mesmo tempo (4 núcleos, carga entre 2 e 18). Por isso os tempos absolutos (banco, fps, carga) variam muito. As comparações foram feitas na mesma execução, ou a carga está indicada junto. As medidas de nível, loudness, lógica de fila e limite não dependem da carga.
