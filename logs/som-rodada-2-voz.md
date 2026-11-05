# Crítica: Locutor e vozes (som-r2)

**Nota: 6,5 de 10**

| Subitem | Nota | r1 |
|---|---|---|
| (a) Inteligibilidade | 8 | 7 |
| (b) Naturalidade e caráter | 5 | 5 |
| (c) Cobertura e momento | 6 | 7 |
| (d) Fila, prioridade e frequência | 6 | 5 |
| (e) Respostas das tropas | 7 | 4 |
| (f) Robustez | 6 | 6 |

**Veredito.** A rodada 2 resolveu de verdade os três problemas mais graves da rodada 1:
- **Sinal e voz não brigam mais.** Os sinais (sirene, sino, radar) tocam antes da voz, na mesma entrada da fila. A voz fica 30 a 47 dB acima do sinal; antes ficava −0,8 dB em "Inimigo detectado" + sirene.
- **A voz passa por cima da batalha.** Na batalha grande a mediana ficou em +12,0 dB; antes era +2,2 dB.
- **A tropa responde à ordem.** Selecionar e dar a ordem rápido dá resposta em 6 de 6 testes; antes era 0.

"Harvester deployed" toca sempre: 2 de 2 na sessão com mouse, 6 de 6 na partida com a IA. Toca tanto com o Coletor da Refinaria como com o da Fábrica, e sai junto do som hidráulico.

Mas o estresse em tempo real achou falhas novas na lógica da fila. Elas atingem justamente o que o Rodrigo pediu:
1. **"Base sob ataque" chega 6,5 s atrasado**, como terceira fala, depois de "Inimigo detectado" e "Inimigos se aproximando da base".
2. **A sirene repete a cada 1,5 s por cima do locutor**: 6 sirenes em 8 s.
3. **"Unidade perdida" vira "Unidades prontas".**
4. **O limite de falas por minuto calou os dois "Blindado pronto"** da sessão.

No caráter, continua sendo uma voz sintética única. Cada fala existe em uma só versão, e os perigos têm a mesma altura das falas neutras. "Harvester deployed" sai em outra voz feminina, americana. Funciona e se entende. Ainda não é locutor AAA.

---

## Pontos fortes (medidos)

1. **Sinal antes da voz: problema 1 da r1 resolvido.** Medido com `render.js pares` e `medir_pares.py` (saída em `out/pares.txt`).
   - A voz fica acima do sinal na janela da fala, com ponderação K:

     | Par | Voz acima do sinal | Pior trecho de 300 ms |
     |---|---|---|
     | Base sob ataque + sirene | 47,3 dB | 42,7 dB |
     | Inimigo detectado + radar | 43,2 dB | 36,5 dB |
     | Torre de defesa pronta + sino | 32,5 dB | 27,2 dB |
     | Harvester deployed + `deploy` | 30,0 dB | 26,0 dB |
     | Vitória + fanfarra | 19,4 dB | 14,5 dB |
     | Derrota + fanfarra | 9,8 dB | 4,0 dB |

   - Whisper deu 1,00 em 11 dos 12 pares.
   - Custo da sequência: a voz entra 0,46 a 1,66 s depois do evento (0,46 s para o sino de "pronto", 1,01 s para a sirene, 1,66 s para a derrota). É aceitável.
2. **A voz se destaca na batalha.** Batalha sorteada com os efeitos do próprio banco e com o abaixamento real do jogo (`render.js mix`, `medir_mix.py`, saída em `out/mix.txt`). Relação fala/batalha, mediana:

   | Nível | Locutor | Tropas |
   |---|---|---|
   | Calmo | 22,4 dB | 18,8 dB |
   | Escaramuça | 20,2 dB | 16,3 dB |
   | Batalha | 15,9 dB | 12,1 dB |
   | Batalha grande | **12,0 dB** (p10 10,3) | 8,3 dB |

   - Na r1, a batalha grande tinha +2,2 dB.
   - Nota do Whisper na batalha grande: 0,960 para o locutor e 0,973 para as tropas.
   - Nenhuma amostra cortada; pico da mixagem de 0,91.
3. **Falas limpas se entendem**, com Whisper small (`asr_falas.py`, saída em `out/asr_falas.txt`).
   - Média: 0,978 no WAV cru, 0,980 no MP3 que o Chrome decodifica e 0,963 depois da cadeia de rádio.
   - No locutor, todas as falas ficaram em 0,90 ou mais depois da cadeia, menos "Treinando" (0,80).
   - "Inimigo detectado" foi corrigido: 1,00 nos três formatos (na r1, o MP3 dava 0,81).
   - "Harvester deployed": 1,00 nos três formatos, com o /d/ final presente.
4. **Volume entre falas parelho na saída** (`medir_falas.py`, saída em `out/medidas_falas.txt`).
   - Locutor: de −15,6 a −12,0 LUFS (3,6 LU de diferença), mediana −13,0.
   - True peak máximo de −0,3 dBFS.
   - Pontas limpas: primeira e última amostra em 0, silêncio inicial de 32 a 49 ms.
5. **A ordem corta a resposta à seleção** (`sessao.js`, saída em `out/sessao.log`).
   - Seleção com o mouse e botão direito depois de 250, 450 ou 700 ms: **6 de 6 com resposta à ordem**. Exemplos: `vsel_6`→`vmov_6`, `sel_6`→`mov_1`.
   - Na r1 eram 0 de 3.
   - Seis frases por tipo de ordem, em duas vozes (`pm_alex` para a infantaria, `pm_santa` para os veículos).
6. **Locutor e tropas nunca falam juntos.**
   - Em 4 min com mouse e 6 min com a IA, não houve nenhuma fala do locutor por cima de uma resposta das tropas.
   - As 33 "sobreposições" do registro de buffers são todas uma seleção cortada pela ordem, com fade de 15 ms, ou uma resposta cortada pelo locutor.
   - Na r1 foram 13 sobreposições reais.
7. **Frequência sob controle.**
   - Partida de 6 min com a IA no difícil: 6,9 falas por minuto, falando 15,4% do tempo (na r1: 8,7 por minuto e 19,3%).
   - "Unidades prontas" agrupa as unidades. "Construindo" e "Treinando" saíram 0 vezes em 13 pedidos.
8. **Robustez básica** (`robustez.js`, saída em `out/robustez.json`).
   - A demonstração do título fica muda: 0 vozes e 0 efeitos em 20 s.
   - Mudo (M): nada toca e a fila esvazia. Depois de religar o som, "Base sob ataque" toca de novo; o mudo não gasta mais o intervalo entre falas.
   - `avancar(240)` não tocou nenhuma voz.
   - Pedidos feitos 100 a 1500 ms depois do clique esperam o pacote e saem pelo pacote. "Base sob ataque" saiu 3 s depois, em vez de cair na reserva.

---

## Problemas (do mais grave ao menos grave)

### 1. "Base sob ataque" chega 6,5 s atrasado, como a terceira de três falas (grave, pedido do Rodrigo)
- Teste `eventos.js` (saída em `out/eventos.json`): três blindados inimigos aparecem colados na Central e atacam.
- Linha do tempo (tempo do AudioContext, em s):

  | Tempo | O que acontece |
  |---|---|
  | 54,02 | Pedido de "Inimigo detectado" (prioridade 2) e de "Inimigos se aproximando da base" (prioridade 3, voice.js:397) |
  | 54,43 | A tela mostra "Base sob ataque!" (combat.js:276) |
  | 54,53 | Voz: "Atenção, inimigo detectado" |
  | 56,71 | Sirene, depois "Inimigos se aproximando da base" |
  | 59,90 | Sirene de novo |
  | **60,91** | **"Alerta! Base sob ataque!"** |

- **Atraso de 6,5 s** entre a tela e a voz, com duas sirenes.
- O locutor diz "se aproximando" quando a base já está levando tiro. A trava de voice.js:189 só olha se "Base sob ataque" já *foi dito*, e não se está na fila.
- Na ordenação de voice.js:232, prioridade empatada → o pedido mais antigo ganha, e "se aproximando" foi pedido antes. Um perigo também não corta uma fala de prioridade 2 em andamento (voice.js:209 só corta prioridade 1 ou menos).
- O certo seria:
  - "Base sob ataque" substitui e descarta "se aproximando" e "inimigo detectado" que estejam na fila ou tocando.
  - Uma única sirene.
  - Meta de menos de 1,2 s entre o primeiro tiro e a voz.

### 2. A sirene dispara a cada 1,5 s por 40 s enquanto há 3 ou mais inimigos perto da base (grave)
- `updateAnnouncer` pede `inimigo_base` a cada 0,5 s (voice.js:397).
- Quando a fala é recusada pelo intervalo de 40 s, `cueOnly()` (voice.js:181) toca **a sirene sozinha**. O limite do efeito (`alert`, 1500 ms, audio.js) a deixa passar a cada 1,5 s.
- Sessão com mouse (`out/sessao.json`, `alog`): sirenes em 209,09, 210,88, 212,46, 214,01, 215,55 e 217,21 s. São **6 sirenes em 8 s**:
  - por cima de "Inimigos se aproximando da base" (210,1 a 212,0 s);
  - por cima de "Unidade perdida" (212,5 a 213,9 s);
  - por cima de "Unidades prontas" (214,3 a 215,7 s).
- Os registros mostram 18 pedidos de `inimigo_base`, 1 aceito e 17 sirenes pedidas.
- Cada sirene também chama `duck(1.1, 0.5)`, que mexe no abaixamento da fala em andamento.
- O mesmo `cueOnly` vale para todo aviso com sinal recusado pelo intervalo. Só não aparece mais porque os outros são pedidos por eventos, e não a cada 0,5 s.
- O sinal de um aviso recusado deveria ficar mudo.

### 3. "Unidade perdida" vira "Unidades prontas" (bug de sentido)
- voice.js:183 testa `key.startsWith('unidade_')`, e isso pega também `unidade_perdida`.
- Duas perdas em menos de 8 s → a segunda é trocada por "Unidades prontas". Na sessão: "Unidade perdida" em 212,5 s e **"Unidades prontas" em 214,3 s, com o inimigo matando nossas tropas**.
- Uma perda também atualiza `lastUnitReadyAt`, então a próxima unidade pronta, até 8 s depois, também vira "Unidades prontas".
- Correção: testar uma lista explícita de chaves `unidade_<tipo>` de produção.

### 4. O limite de 7 falas por minuto calou "Blindado pronto", e os avisos importantes contam para esse limite (sério, pedido "unidade pronta")
- voice.js:198-199: `annHistory` conta **todas** as falas, incluindo as de prioridade 2 ("Usina pronta", "Harvester deployed", "Energia baixa"). Uma fala de prioridade 1 é descartada quando o total chega a 7.
- Na sessão com mouse, os **dois** "Blindado pronto" foram recusados, em 123,4 s e 157,2 s. Antes de cada um houve 7 falas nos 60 s anteriores, todas de construção.
- O jogador nunca ouviu que o blindado ficou pronto.
- Na partida de 6 min com a IA:

  | Fala | Pedidos | Tocou |
  |---|---|---|
  | "Blindado pronto" | 13 | 4 |
  | "Unidade perdida" | 9 | 0 |

  Duas falas "aceitas" de blindado e batedor expiraram na fila (espera de 4 s).
- O limite deveria contar só falas da mesma prioridade, ou agrupar em vez de descartar ("Unidades prontas" no lugar do silêncio).

### 5. "Alerta! Base sob ataque!", o aviso mais importante, é a fala pedida mais frágil na batalha (sério)
- Na mixagem, com o abaixamento de perigo (0,3):
  - batalha a +18,7 dB e batalha grande a +15,8 dB: Whisper deu **0,76, "Alerta Basis Obataki"** (`out/mix.json`, `batalha_g0` e `grande_g0`);
  - "Coletor sob ataque", com a mesma relação fala/batalha: 1,00.
- O texto emenda "base sob" em "Basisob". Faltam pausa e ênfase em "BASE".
- Outros que caem na batalha grande:
  - "Coletor pronto" → "Coletor Bronzul" (0,76);
  - "Energia baixa" → "Energia bíceps" (0,74).
- "Inimigo detectado" é a fala mais baixa do pacote: −15,6 LUFS na saída, 2,6 LU abaixo da mediana. É também a de menor relação fala/batalha entre as pedidas: +9,0 dB, com o pior trecho de 300 ms em +5,0 dB, no nível grande.
- Limite da medida: o Whisper é mais tolerante que um ouvido cansado, e só há uma amostra de batalha por nível.

### 6. Caráter: voz única, sem urgência, sem variações; "Harvester deployed" é outra pessoa (sério para o "premium AAA")
Medidas em `out/medidas_falas.txt` e `out/elenco.txt`:
- **Perigos com a mesma altura das falas neutras.** F0 de 178 a 192 Hz nos perigos contra 176 a 197 Hz nas neutras. A faixa de altura também é igual: de 7 a 12 semitons nos dois grupos.
- **Pouca diferença de ritmo.** Os perigos saem a 4,5–7,1 sílabas/s (base 5,2) contra uma mediana de 4,8. A urgência vem só da palavra "Alerta!".
- **Uma só tomada por fala.** "Blindado pronto" soa idêntico em todas as vezes (4 vezes em 6 min), e "Usina pronta" saiu 6 vezes. Um RTS AAA grava de 2 a 4 leituras para as falas frequentes.
- **"Harvester deployed" em `af_heart`** (americana), apresentada como "para combinar com a locutora":
  - F0 de 213 Hz contra 184 Hz da `pf_dora`, ou +2,5 semitons;
  - espectro médio a 3,9 dB da `pf_dora`, mais longe do que qualquer fala da própria `pf_dora` (p90 de 2,6 dB);
  - é perceptivelmente outra mulher.
- **Os veículos são todos o mesmo `pm_santa`.** Blindado, batedor e obuseiro só mudam o `playbackRate` (de 0,96 a 1,04, voice.js:330), o que muda velocidade e altura juntas. O Coletor tem só 2 frases de seleção e 2 de movimento.
- **Sem brilho acima de ~9,6 kHz.** O MP3 de 24 kHz (gerar.py:85 e 128) tem um corte seco nessa faixa (espectrogramas em `png/`). A saturação da cadeia gera um pouco de distorção acima de 12 kHz nas sibilantes (`png/base_ataque__cadeia.png`, cerca de −45 dB). Não é grave, mas tira o "ar" de locutor de estúdio.

### 7. Respostas dos veículos pela cadeia de rádio perdem clareza
- Whisper depois da cadeia `veh` (`out/asr_falas.txt`):

  | Frase | Reconhecido | Nota |
  |---|---|---|
  | "Pode deixar!" (`vatk_4`) | "Pod Judicial" | 0,61 |
  | "Alvo na mira!" (`vatk_3`) | "Auf und amire!" | 0,56 |
  | "Deixa comigo." (`vmov_5`) | "Tei, Chaco, Migo!" | 0,69 |
  | "Às ordens!" (`sel_1`, infantaria) | "como ordens" | 0,70 |

- O relatório do gerador dava 0,98 para `vatk_4`. Com o WAV salvo, o cru já dá 0,64: o mesmo juiz escolheu e avaliou, então o número é otimista.
- O passa-baixas de 5 kHz com saturação 1,5 da cadeia `veh` (voice.js, `ensureChains`) come as consoantes.
- Na mixagem, a resposta a uma ordem chega a ficar a +5,7 dB da batalha grande.

### 8. "Comandante, base operacional" se perde com a máquina carregada
- `inicio` só pode esperar 4 s na fila (voice.js:40). O pacote leva de 4,0 a 4,6 s para decodificar com a máquina livre, e de 14 a 18,6 s com a CPU disputada (`out/robustez.json`, `titulo_comecar`). As falas de prioridade 1 vêm depois das de prioridade 2 e 3 na ordem de decodificação.
- Em `eventos.js`, o pedido foi feito em 6,24 s e **a fala nunca tocou**: expirou sem registro. Nas outras execuções saiu de 2,7 a 2,9 s atrasada.
- O pacote ficou 53% maior que na r1 (78 falas a 96 kbps, 1,25 MB de MP3), e a decodificação ficou mais lenta.
- A fala de boas-vindas deveria ser decodificada primeiro e esperar o pacote, sem prazo.

### 9. Chiado órfão quando um perigo corta uma fala
- `cutLine()` (voice.js:215) para a fonte, mas o chiado de fechamento agendado em voice.js:267 continua tocando.
- Teste `robustez.js orfao`: "Blindado pronto" foi cortado; o chiado de fechamento tocou em 23,895 s, no meio da sirene (de 23,16 a 24,05 s), e o de abertura de "Base sob ataque" veio em 24,012 s.
- Resultado: dois chiados em 0,12 s. Na derrota acontece o mesmo: "Unidade perdida" é cortada por "Central perdida".

### 10. Sequência de derrota desajeitada
- Ordem medida (`out/eventos.json`):
  1. "Unidade perdida" cortada depois de 0,36 s;
  2. "Central perdida! Não podemos mais construir." (2,7 s);
  3. fanfarra;
  4. "Derrota" **5,0 s depois do fim**.
- No fim da partida, "não podemos mais construir" sobra.

### 11. Reservas sem pacote iguais às da r1 (`?semvozes`)
- "Coletor pronto", "Torre de defesa pronta", "Inimigo detectado" e "Blindado pronto" ficam **mudos** (`via: "sem voz"`).
- Os outros avisos caem na voz robótica, cujo código não mudou (diff vazio). Na r1 ela já era ininteligível: "Harvester deployed" virou "Harlaster, need mine".
- As tropas ficam caladas.
- O risco é baixo, porque o pacote vem embutido e o MP3 decodifica em qualquer navegador.

**Sobre as gravações em tempo real:** gravei a saída do jogo (`gravador.js`), mas com a CPU disputada (carga de 11 a 20) os ScriptProcessors perderam e escorregaram blocos. O Whisper sobre essas gravações deu lixo ("C C C C"), o que não corresponde ao que sai no alto-falante. Por isso as relações fala/batalha e as notas da sessão real (`out/sessao_analise.txt`) **não servem como medida**; uso dessas sessões só os tempos e os registros de eventos. A inteligibilidade vem das mixagens em OfflineAudioContext, montadas com a cadeia real do jogo.

---

## Pedido do Rodrigo: situação

| Pedido | Situação |
|---|---|
| Coletor pronto | OK: Refinaria e Fábrica, 1,0 s depois do aviso na tela. Na batalha grande, Whisper deu 0,76. |
| Torre pronta | OK: "Torre de defesa pronta" no instante em que a obra termina (0,46 s, depois do sino). |
| **Base sob ataque** | **Dispara, mas 6,5 s atrasado** quando o inimigo aparece atacando (problema 1), e é a fala mais frágil na batalha (problema 5). |
| Inimigo detectado | OK: 2,5 s depois de o inimigo sair da névoa. É a fala mais baixa do pacote. |
| Harvester deployed | **OK, resolvido**: 8 de 8 eventos, nas duas origens, com o som `deploy` junto. |
| "Premium AAA, muito, muito bom" | **Ainda não.** Voz sintética única, sem variações nem urgência, e com os bugs de fila dos problemas 1 a 4. |

---

## O que faria a nota subir (em ordem de impacto)

1. **Corrigir a fila de perigo.**
   - "Base sob ataque" e "Coletor sob ataque" descartam "Inimigos se aproximando" e "Inimigo detectado" da fila e cortam a fala de prioridade 2 em andamento.
   - Uma sirene por aviso.
   - `cueOnly` não toca o sinal de um aviso recusado pelo intervalo.
   - Meta: menos de 1,2 s entre o tiro e a voz.
2. **Corrigir `startsWith('unidade_')`** e fazer o limite por minuto contar só falas de prioridade 1, agrupando em vez de calar.
3. **Regravar os perigos com urgência**:
   - 2 a 3 tomadas por fala;
   - texto com pausa ("Alerta! A base está sob ataque!");
   - F0 de +2 a +3 semitons e velocidade cerca de 1,1;
   - testar no Whisper com a batalha grande do jogo como ruído, e não com ruído rosa a +6 dB (gerar.py).
4. **Variações nas falas frequentes**: 2 a 3 leituras de "Usina pronta", "Blindado pronto" e "Coletor pronto".
5. **Coerência do elenco.** "Harvester deployed" com a própria `pf_dora` (fonemas em inglês) ou uma voz mais próxima. Uma voz ou um timbre de verdade por tipo de veículo, sem usar o `playbackRate`.
6. **Cadeia `veh`**: passa-baixas de 6,5 a 7 kHz e saturação de 1,1, e escolher as tomadas já passadas pela cadeia.
7. **Abertura e reservas.**
   - Decodificar `inicio` primeiro e sem prazo.
   - Cancelar o chiado de fechamento no `cutLine`.
   - Derrota sem "Não podemos mais construir".
   - `?semvozes` com a voz do navegador para todas as falas.

---

## Scripts e saídas

Pasta: `/home/claude/criticos/som-r2/voz/`

**Scripts** (`scripts/`):

| Script | O que faz |
|---|---|
| `offline_helper.js` | Mixagem real do jogo num OfflineAudioContext, com verificação das substituições |
| `render.js` | `falas`, `pares` e `mix` |
| `asr_falas.py`, `asr.py` | Whisper small no WAV cru, no MP3 decodificado e na cadeia |
| `medir_falas.py`, `medir_cru_lib.py` | LUFS, true peak, pontas, F0, sílabas/s |
| `medir_pares.py` | Sinal + voz |
| `medir_mix.py` | Fala/batalha e Whisper por fala |
| `elenco.py` | Espectro médio e F0 por voz |
| `sessao.js` | 4 min com mouse em tempo real |
| `densidade.js` | 6 min com a IA |
| `eventos.js` | Perigo e derrota em tempo real |
| `robustez.js` | Título, demonstração, `?semvozes`, mudo, simulação rápida, pedidos cedo, chiado órfão |
| `ganchos.js` | Registra `announce`, `playLine`, `unitAck`, `notify` e `sfx` |
| `instrumento.js` | Registra o início de cada buffer |
| `gravador.js` | Gravação em tempo real (pouco confiável sob carga) |
| `analisar_sessao.py` | Análise das sessões |

**Saídas** (`out/`):
- `asr_falas.txt`, `medidas_falas.txt`, `pares.txt`, `mix.txt`/`mix.json`, `elenco.txt`
- `sessao.json`/`sessao.log`/`sessao_analise.txt`, `densidade.json`, `eventos.json`/`eventos.log`, `robustez.json`

**Áudio:**
- `wav_radio/`: cada fala `__mp3dec` e `__cadeia`
- `wav_mix/`: pares e mixagens com batalha
- `wav_sessao/`: gravações em tempo real
- `png/`: espectrogramas

**Limites:** não ouvi nada. A inteligibilidade é a do Whisper small. A batalha das mixagens foi sorteada com os efeitos do próprio banco. As sessões em tempo real rodaram com a CPU disputada (carga de 11 a 20), e o jogo andou cerca de 17% mais devagar que o relógio.
