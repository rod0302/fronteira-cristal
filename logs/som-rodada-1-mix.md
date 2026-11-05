# Crítica: mixagem, robustez e desempenho (som-r1)

**Nota: 5 de 10**

| Subitem | Nota |
|---|---|
| (a) Balanço entre efeitos, voz, música e ambiente | 4 |
| (b) Dinâmica e clareza na batalha | 4 |
| (c) Fadiga numa partida de 8 a 10 min | 5 |
| (d) Desempenho e memória | 5 |
| (e) Robustez e regressão | 8 |

**Veredito.** A parte técnica está bem feita. A saída não clipa, o limitador quase não trabalha, não há vazamento de nós, a simulação é idêntica à versão anterior, os testes passam e o locutor se entende no meio da batalha. A mixagem, porém, não é AAA. Ela soa como um banco de efeitos normalizado por pico, empurrado para -11 LUFS. Isso dá 8 LU acima da versão anterior. A energia fica quase toda abaixo de 150 Hz. A música fica 22 LU abaixo do resto em combate, então na prática não se ouve. O assobio da artilharia e a sirene soam mais alto que a maior explosão. As respostas das tropas não abaixam nada e são mascaradas pelos tiros. As "variações" são em boa parte falsas: um bug de semente faz os 5 sons de créditos saírem bit a bit iguais. O banco consome cerca de 60 MB de AudioBuffers e leva de 10 a 23 s para gravar. Nesse tempo a taxa de quadros cai uns 45% e as explosões e os motores ficam mudos. As frases que o Rodrigo pediu existem e tocam. Mas a cadeia de rádio piora o "Inimigo detectado" no reconhecedor (1,00 limpa, 0,33 depois do rádio). O "Coletor pronto" não toca para o coletor que vem com a Refinaria.

> **Pedido do Rodrigo, item por item:**
> - "Coletor pronto": toca, mas só quando o coletor sai da Fábrica. O coletor grátis da Refinaria não tem a fala (`src/buildings.js:232`).
> - "Torre pronta": toca como "Torre de defesa pronta".
> - "Base sob ataque": toca e se entende na mixagem. O Whisper acertou no meio da batalha, com +5 dB acima do resto.
> - **"Inimigo detectado": existe, mas a cadeia de rádio do locutor o deforma.** O Whisper ouve "e nem migo detectado" (0,33 contra 1,00 da fala limpa).
> - "Harvester deployed": está corrigido. Toca quando o coletor chega ao cristal (confirmado no `fumaca.js` e na partida IA contra IA, 3 vezes em 135 s). Só que sai numa voz masculina em inglês, enquanto todo o resto do locutor é uma voz feminina em português. Não há uma identidade de locutor.
> - Som "premium AAA": **não atendido** na mixagem (detalhes abaixo).

---

## Pontos fortes (medidos)

- **A saída final não clipa.** Medi a batalha de campo (64 unidades na tela, 60 s) e a base sob ataque (46 unidades, 51 s):
  - Nenhuma amostra acima de 1,0.
  - Pico verdadeiro de -0,43 dBTP (campo) e -0,39 dBTP (base).
  - Antes do limitador havia 38 e 78 amostras acima de 1,0, e o limitador segurou todas.
- **O limitador quase não age.** Depois de alinhar o atraso de lookahead (6 ms) e descontar a compensação automática do DynamicsCompressor (+1,71 dB), a redução na batalha de campo foi:
  - p95 de 0,5 dB, máximo de 2,9 dB;
  - nenhum episódio acima de 3 dB.

  Na versão anterior, no mesmo cenário: máximo de 4,8 dB e 32 episódios acima de 3 dB. Não há bombeamento do limitador.
- **O locutor se entende na batalha.** Recortei a saída final (efeitos, música, ambiente e reverb juntos) em cada fala e passei no Whisper. Ele acertou 10 de 10 falas do locutor nas duas batalhas: "Unidade perdida", "Base sob ataque", "Central perdida, não podemos mais construir"... A fala fica de +1,1 a +23 LU acima do resto, com mediana de +8,9 dB na banda de 1 a 4 kHz no cenário da base.
- **Nós de áudio: menos que antes.** Na mesma batalha foram 52 nós criados por segundo em média (pico de 412/s), contra 89/s (pico de 544/s) na versão anterior. Tocar um buffer gravado é mais barato que sintetizar ao vivo.
- **Nenhum vazamento.** Rodei uma partida IA contra IA em tempo real por 135 s e depois congelei e esperei 8 s:
  - Fontes vivas: 21 no começo e 22 no fim, todas osciladores da música (pad, baixo, pluck).
  - `activeVoices` e todas as `classVoices` voltaram a 0.
  - Nenhuma fonte em laço ficou órfã.
- **Simulação idêntica à versão anterior.** Mapa 1, semente 12345, IA nos dois times, `avancar(60)` seis vezes: `__jogo.estado()` deu igual nos 6 minutos (6/6) entre `rts` e `orig/rts`, com o áudio ligado na versão nova.
- **Testes passam.** `tests/fumaca.js` passou inteiro, inclusive "locutor anunciou Harvester deployed (pacote)", o Premium e "nenhum erro no console". `tests/partida.js` passou: IA contra IA com vencedor, e jogador parado destruído aos 7 min. Rodei as cópias em `mix/tests/` para não escrever `tests/saida` na pasta congelada.
- **A carga da página não piorou**, apesar dos 710 KB do `voicepack.js` (515 KB com gzip). Mediana de 4 cargas intercaladas por file://:
  - load de 520 ms na nova contra 574 ms na anterior;
  - DOMContentLoaded de 101 ms nas duas;
  - heap JS de 14 MB contra 13 MB.
- **Funcionamento básico em ordem:**
  - file:// sem servidor e `?premium` abrem sem erro. No Premium só aparecem avisos do driver GL, nada de áudio.
  - M zera o geral (ganho 0,0002) e corta as falas.
  - N zera música e envio de reverb (0,002), e o agendamento cai para 0,8 nós/s.
- **Imagem estéreo mais larga que antes:** correlação L/R da saída de 0,87 na batalha, contra 0,98 na versão anterior.

---

## Problemas (do mais grave ao menos grave)

### 1. A mixagem está quente demais, a música some e o grave domina (balanço)
Cenário de batalha de campo, saída real gravada por barramento (`out/batalha-novo-*.wav`):

| Barramento | Nova | Anterior |
|---|---|---|
| Final, LUFS integrado | **-11,3** | -19,4 |
| Final, máximo curto (3 s) | -8,8 | -14,4 |
| Música | **-33,9** (22,6 LU abaixo do final) | -32,8 (13,4 LU abaixo) |
| Ambiente | -30,8 | (dentro da música) |

- **-11 LUFS é nível de master de música comercial.** Para jogos a referência costuma ficar entre -16 e -24 LUFS, conforme a plataforma. O jogo ficou 8 LU mais alto que a versão anterior, sem que a música subisse junto. O sistema de "tensão" da música (`audio.js:540`) trabalha para ninguém ouvir em combate.
- **Grave em excesso.** Na batalha, 83% da energia da saída fica abaixo de 150 Hz (bandas 20–60 Hz a -3,4 dB e 60–150 Hz a -4,3 dB do total). Na faixa de 1 a 6 kHz, onde se entende o que está acontecendo, o nível fica entre -17,6 e -18,8 dB.
  - `boom`, `bigboom`, `hit_arty`, `turret`, `arty`, `place` e `lose` têm entre 92% e 98% da energia entre 20 e 80 Hz (centroide de 70 a 120 Hz, `out/banco-medidas.json`).
  - Num alto-falante de notebook (simulado com passa-altas de 180 Hz), `cannon` perde 9,7 LU e `turret` perde 10,3 LU. O assobio `incoming` não perde nada.
- **A hierarquia dos sons está errada.** Volume efetivo = LUFS do buffer + ganho em `SFX_DEFS`:

  | Som | Volume efetivo | Por quê |
  |---|---|---|
  | `alert` | **-9,1 LUFS** | buffer de -6,6 LUFS × 0,75 no barramento do locutor, que nunca abaixa |
  | `bigboom` | -10,1 LUFS | |
  | `incoming` | **-11,3 LUFS** | quase um tom puro em 1–4 kHz, buffer de -1,4 LUFS × 0,32 |
  | `boom` | -12,5 LUFS | |
  | `hit_arty` | -15,2 LUFS | |
  | `cannon` | -18,5 LUFS | |

  O assobio de artilharia chegando soa mais alto que o impacto da artilharia, e cai bem na banda da fala. A sirene soa mais alto que um prédio explodindo.
  - Arquivos: `audio.js:292` (incoming), `audio.js:309` (alert), `sfxbank.js:525` (normalização por pico).
- **Reproduzir:** `node mix/scripts/batalha.js novo 60` e depois `python3 -I mix/scripts/analisa_batalha.py novo`. A gravação precisa de `python3 -m http.server 8765 --directory /home/claude/criticos/som-r1`, porque o AudioWorklet por blob não carrega em file://.

### 2. As respostas das tropas são mascaradas e a cadeia de rádio piora a inteligibilidade (clareza)
- **As respostas não abaixam nada.** `unitAck` (`voice.js:262-295`) não chama `duck()`, e as respostas saem 1 a 4,6 LU abaixo do resto. Na banda de 1 a 4 kHz, a relação fala/resto foi:

  | Resposta | Relação na banda 1–4 kHz |
  |---|---|
  | `atk_2` "Fogo!" | **-1,9 dB** |
  | `atk_2` em outro momento | +1,2 dB |
  | `atk_3` | +5,7 dB |
  | `atk_4` | +6,0 dB |

  Na saída final, o Whisper ouviu "Fogo!" como **"Sou eu Guu"** (`out/asr-mix.json`).
- **A cadeia de rádio do próprio jogo deforma as falas.** Passei as 51 falas por `radioChain` num OfflineAudioContext (`scripts/cadeia_radio.js`) e comparei com a fala limpa decodificada do MP3:

  | Cadeia | Acerto, fala limpa | Acerto, depois do rádio |
  |---|---|---|
  | Locutor | 0,95 | 0,89 |
  | Infantaria | 0,81 | **0,67** |
  | Veículo | 0,81 | 0,81 |

  - Pioram: **"Inimigo detectado" → "e nem migo detectado"**, "Treinando" → "Crenando-os", "Atacando!" → "Está sacando" (infantaria), "Construindo" → "construindo-o".
  - Os parâmetros ficam em `voice.js:145-148`: saturação de 1,3 a 2,6, e o compressor de cada cadeia chega a 11–12 dB de redução na batalha.
  - Ressalva: o Whisper erra palavras isoladas mesmo em áudio limpo. O que vale aqui é a comparação em pares.
- **O MP3 de 56 kbps estraga uma fala.** No WAV, `col_mov` é "Vou colher." (Whisper correto). Depois do MP3 (`tools/voz/gerar.py:97`, `-b:a 56k`, 24 kHz), vira "Vocolier", tanto limpa quanto pelo rádio. O relatório do gerador (`relatorio-reconhecimento.txt`) mediu os WAVs, não o que vai no jogo.
- **O retorno de reverb não abaixa com o duck.** Ele vai direto para o geral (`audio.js:82`, `wet.connect(audioOut)`). Explosões longe da tela mandam até `rev × 2,5` para o reverb (bigboom: 1,25), e essa cauda continua cheia por baixo da voz.

### 3. Gravar o banco custa caro: 60 MB, 10 a 23 s e taxa de quadros pela metade (desempenho)
- **Memória** (`out/probe.json`):
  - SFX_BANK: **45,2 MB** (87 buffers, 154 s de áudio float32 a 44,1 kHz);
  - falas decodificadas: **12,0 MB** (51 buffers, 71 s);
  - ruídos do banco (`NOISE_CACHE`, que fica vivo à toa): 3,0 MB;
  - reverb: cerca de 0,9 MB.

  Total ≈ **61 MB**, contra cerca de 0 na versão anterior. Só 30,6 MB dos 44 MB ficam acima de -40 dB do pico, o resto é cauda quase muda.
- **Tempo:** a gravação é **serial** (`sfxbank.js:546`, um `startRendering` por vez). Mediu 10,3–10,6 s com a máquina em carga média 3–4, e 19,5–23 s com carga 7–11. A montagem dos grafos na thread principal soma 834 ms. O resto é a renderização em si: bigboom 2,3 s, rocket 1,9 s, boom 1,7 s, wind 1,5 s (`out/perfil-banco.json`).
- **Taxa de quadros durante a gravação** (`out/banco-tempo.json`, partida rodando):

  | | Durante a gravação | Depois |
  |---|---|---|
  | fps | 24–26 | 43–50 |
  | Quadro mais longo | **317–417 ms** | |
  | Tarefas longas | 54–56, somando 3,7–4,2 s | |

  Com a máquina disputada, o pior quadro chegou a 1167 ms (`out/bankbuild.json`).
- **Silêncio no começo:** até o banco ficar pronto, `sfx()` devolve sem tocar nada (`audio.js:340`).
  - `boom`, `bigboom` e `hit_*` saem entre a 13ª e a 15ª posição de 29 sons e só chegam por volta de 5–10 s.
  - Os laços de motor, coleta, zumbido e o vento do banco só começam com **o banco inteiro** pronto: `loops: 0` aos 14,2 s no título (`out/robustez.json` → `primeiros`).
  - Na tela de título, nenhum efeito tocou nos primeiros 14 s (`tocados: 0`).
- **As falas:** 51 decodificações em série, de 3 a 6 s. O "inicio" chega a tempo porque o locutor é decodificado primeiro (`out/inicio-rapido.json`).

### 4. As variações são falsas e as falas se repetem (fadiga)
- **Bug de semente.** `seed: 1000 + i*77 + name.length*13` (`sfxbank.js:541`) com o LCG de `makeRng` (`map.js:4`) faz o primeiro sorteio de cada variação cair numa faixa estreita: 0,659 / 0,689 / 0,719 / 0,748 / 0,778 para `credits`.
  - Resultado: **os 5 buffers de `credits` são idênticos bit a bit** (diferença máxima 0,0). O índice `(rng*5)|0` (`sfxbank.js:382`) dá sempre 3, ou seja 2349 Hz.
  - Os 2 buffers de `select` também são idênticos (a receita não sorteia nada).
  - Semelhança de espectrograma entre variações: arty 0,971, cannon 0,972, turret 0,970, click 0,977, unit 0,976. A variação é quase só o `playbackRate` de ±5–8%.
  - Sons com o mesmo tamanho de nome recebem as mesmas sementes: `rifle` e `click`, `cannon` e `select`. O projeto já tem `mixSeed` em `map.js` e não usa.
- **A normalização por pico desequilibra as variações.** `hit_bullet` varia **7,0 LU** de uma variação para outra, `rifle` 2,4 LU, `death_inf` 2,0 LU (`sfxbank.js:525`). Um tiro sai mais alto que o outro ao acaso.
- **Uma tomada por fala, e falas que voltam toda hora.** Numa partida de 10 min com o relógio do jogo substituindo o relógio real (`out/fadiga.json`):

  | Semente | Falas do locutor | Por minuto, no fim | "Blindado pronto" | "Unidade perdida" |
  |---|---|---|---|---|
  | 7 | 53 | ~7 | 11 vezes | |
  | 99 | 72 | ~8 | **20 vezes** | 7 vezes |

  - Todas as vezes é exatamente a mesma tomada.
  - Na batalha de campo, "Unidade perdida" tocou aos 1,8 s e aos 21,9 s. O intervalo de 15 s (`voice.js:67`) é curto para uma fala que só informa.
  - As respostas têm 4 frases por grupo. Com o limite de uma a cada 0,8 s, um jogador que dá 40 ordens por minuto ouve cada "mov" cerca de 10 vezes por minuto.
- **O zumbido da base oscila na emenda.** O envelope do `loop_hum` cai **-3,6 dB** a cada 1,92 s, enquanto o resto do laço varia só ±0,5 dB (`scripts/lacos.py`). O cruzamento de 80 ms (`sfxbank.js:504`) junta senoides de 60, 120, 180 e 240 Hz fora de fase, porque 1,92 s não é um número inteiro de ciclos de 60 Hz. Num som contínuo, a queda vira um pulso periódico.

### 5. O compressor de cola bombeia os efeitos (dinâmica)
- No compressor de cola (`audio.js:53-58`: limiar -18 dB, razão 3, ataque 10 ms, liberação 200 ms), a redução ficou acima de **6 dB em 26% do tempo** na batalha de campo (p90 8,5 dB, máximo 10,6 dB) e em 18% na base.
- O detector é de banda larga e o grave domina (problema 1). Cada explosão abaixa fuzis e canhões em até 10 dB por uns 200 ms. As explosões não "ganham espaço": tiram o espaço dos outros sons.

### 6. Problemas menores de robustez
- **Sem o pacote de vozes, as frases-chave do Rodrigo ficam mudas.** Com `?semvozes` e sem voz pt-BR no navegador (caso comum no Linux), "Coletor pronto", "Torre de defesa pronta" e "Inimigo detectado" saem como "sem voz". Só as 6 frases em inglês do robô sobram (`voice.js` `ROBOT_PHRASES`; `out/robustez.json` → `reserva_semvozes`).
- **O mudo gasta o intervalo das falas.** `voiceLast[key] = now` (`voice.js:173`) é gravado antes de checar `muted`. Depois de desmutar, a mesma fala é recusada durante o intervalo dela (30 s para "Inimigo detectado"). Medido: `desmudo_fala.aceita = false`.
- **A música continua sendo agendada no mudo:** 6,8 nós/s contra 9/s em silêncio normal. É gasto pequeno, mas inútil.
- **A música se acumula depois de um travamento.** Depois de 4 s com a thread principal travada, `scheduleMusic` (`audio.js:543`) agenda os compassos atrasados de uma vez: 11 fontes disparadas em menos de 0,4 s, com início no passado. O problema já existia na versão anterior (mesmo laço, `orig/rts/src/audio.js:456`). O travamento de até 417 ms durante a gravação do banco piora a situação.
- **A fala de ataque deixa o coletor da Refinaria de fora.** Ele não ganha "Coletor pronto" (`buildings.js:232`), só o "Harvester deployed" quando chega ao cristal.
- **O assobio atrasado ocupa uma vaga de tiro.** O `incoming` com `delay` conta em `activeVoices` e na classe `shot` desde o pedido, não desde o começo do som (`audio.js:382-385`). Um assobio de 1–2 s de voo tira uma das 14 vagas de tiro.
- **Pico verdadeiro de -0,4 dBTP:** pouca folga para conversões com perda (streaming, gravação de tela). O mais comum é -1 dBTP.

---

## O que faria a nota subir (em ordem de impacto)

1. **Normalizar o banco por loudness, não por pico, e refazer a hierarquia.**
   - Alvo de cerca de -18 LUFS no final em batalha e -23 em calma.
   - Explosões acima de tiros, e tiros acima de assobio, sirene e interface.
   - Cortar o `incoming` em 8–10 dB, passar a sirene para o barramento de efeitos ou abaixá-la em 6 dB.
   - Subir a música em 8–10 dB, com um duck dela pelo nível dos efeitos (sidechain), em vez de deixá-la 22 LU abaixo.
2. **Tratar o grave.**
   - Passa-altas de 30–35 Hz no barramento de efeitos e um filtro em prateleira para cortar o grave antes do detector da cola, ou detector com passa-altas.
   - Uma camada de 150 Hz a 2 kHz em cada explosão, que sobreviva em alto-falante pequeno.
   - Meta: `cannon` e `turret` perdendo menos de 5 LU com passa-altas de 180 Hz.
3. **Clareza das vozes.**
   - Duck leve, de 3 a 4 dB, também nas respostas das tropas.
   - Duck também no retorno de reverb (`audio.js:82`).
   - Saturação de rádio mais leve (drive ≤ 1,3) e compressor da voz com no máximo 6 dB de redução.
   - Passar o MP3 para 96 kbps ou mais (em bytes, `col_mov` pesa pouco).
   - Validar com o Whisper **depois da cadeia do jogo e dentro da mixagem** (os scripts estão prontos em `mix/scripts/`), não no WAV.
4. **Banco mais leve e mais rápido.**
   - Gravar em paralelo, com 3–4 contextos ao mesmo tempo, ou em blocos com `requestIdleCallback`.
   - Cortar as caudas abaixo de -50 dB e guardar em mono o que tem correlação L/R acima de 0,95.
   - Soltar `NOISE_CACHE` no fim.
   - Começar os laços assim que o próprio laço estiver pronto, sem esperar o banco todo.
   - Meta: ≤ 25 MB e menos de 3 s.
5. **Variação de verdade.**
   - Sementes embaralhadas com `mixSeed(hash(nome) + i)`.
   - Corrigir `credits` (índice de nota) e `select` (receita sem sorteio).
   - 2–3 tomadas por fala do locutor, e intervalo maior para "X pronto" e "Unidade perdida". Por exemplo, agrupar várias unidades prontas em uma só fala, ou só falar quando a câmera está longe da fábrica.
   - Emenda do `loop_hum` com duração igual a um número inteiro de ciclos de 60 Hz.
6. **Pequenos ajustes:**
   - Gravar `voiceLast` só quando a fala de fato entra na fila.
   - Não agendar a música no mudo e descartar compassos já vencidos em `scheduleMusic`.
   - "Coletor pronto" também para o coletor da Refinaria.
   - Uma única identidade de locutor, ou uma voz em inglês para tudo, se essa for a escolha.
   - Teto em -1 dBTP.

---

## Scripts e saídas

Todos ficam em `/home/claude/criticos/som-r1/mix/`.

**Scripts** (`mix/scripts/`):

| Script | O que faz |
|---|---|
| `lib.js` | Instrumentação: contagem de nós criados por tipo, fontes iniciadas/terminadas/vivas com a pilha de chamadas, gravação de barramentos por AudioWorklet |
| `probe.js` | Carga, memória dos AudioBuffers, tempo do banco e das falas |
| `dump.js` | Exporta o SFX_BANK e o VOICE_BUF para WAV |
| `perfil_banco.js` | Tempo de montagem e de renderização de cada receita |
| `banco_tempo.js` | Tempo do banco, tarefas longas e fps durante a gravação |
| `batalha.js` | Grava a saída real do jogo em stems (final, geral, efeitos, locutor, música, ambiente); cenários `campo`, `base` e `calmo` |
| `analisa_batalha.py` | Loudness, bandas, relação fala/resto e eventos das gravações |
| `limitador.py` | Redução real do limitador, com atraso alinhado e compensação descontada. Use este, e não a linha "limitador" do `analisa_batalha.py`, que não desconta o atraso nem a compensação |
| `analisa_banco.py` | LUFS, bandas, picos e semelhança entre variações do banco |
| `lacos.py` | Emendas dos laços |
| `asr_mix.py` | Whisper na saída final, em cada fala da batalha |
| `cadeia_radio.js` + `asr_radio.py` | As falas pela `radioChain` real do jogo, depois o Whisper |
| `fadiga.js` | Partida de 10 min com o relógio do jogo, contagem de falas |
| `robustez.js` | Determinismo novo contra antigo, M, N, travamento, vazamento, `?semvozes`, `?vozrobo`, `?premium`, primeiros segundos |
| `inicio_rapido.js` | Jogador que clica em JOGAR logo depois de ligar o áudio |
| `carga.js` | Carga por file:// |

**Saídas** (`mix/out/`):
- Gravações: `batalha-{novo,novo-base,novo-calmo,antigo}-*.wav` e os `.json` correspondentes.
- Medidas: `banco-medidas.json`, `banco-semelhanca.json`, `perfil-banco.json`, `banco-tempo.json`, `bankbuild.json`, `probe.json`, `carga.json`, `robustez.json`, `fadiga.json`, `inicio-rapido.json`.
- Reconhecedor: `asr-mix.json`, `asr-radio.json`, `asr-voz-limpa.txt`, `asr-limpa.json`.
- Áudio exportado: `bank/*.wav`, `voz/*.wav`, `radio/*.wav`.
- Testes: `mix/fumaca.txt`, `mix/partida.txt`.

**Ressalva de medição:** outros críticos usavam a mesma máquina (4 núcleos, carga média de 3 a 11). Por isso os tempos absolutos (banco, fps) variam. As comparações entre versões foram feitas intercaladas ou na mesma execução.
