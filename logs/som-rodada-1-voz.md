# Crítica: Locutor e vozes (som-r1)

**Nota: 6 de 10**

| Subitem | Nota |
|---|---|
| (a) Inteligibilidade | 7 |
| (b) Naturalidade e caráter | 5 |
| (c) Cobertura e momento | 7 |
| (d) Fila, prioridade e frequência | 5 |
| (e) Respostas das tropas | 4 |
| (f) Robustez | 6 |

**Veredito.** O salto em relação à versão anterior é real. As falas agora vêm de um pacote neural embutido, e não da voz do navegador. Por isso "Harvester deployed" tocou de verdade, pelo pacote, nas duas sessões em tempo real: 2 vezes em 4 minutos com o mouse e 6 vezes em 8 minutos com a IA. Tocou tanto com o Coletor da Refinaria como com o da Fábrica. Todos os eventos que o Rodrigo pediu disparam, e só para o jogador. A cadeia de rádio também iguala o volume entre as falas: na saída, a diferença cai de 8,1 LU para 2,8 LU.

Isso ainda não é locutor AAA. É uma voz sintética única, sem urgência: "Base sob ataque!" sai mais devagar e com a mesma altura de uma fala neutra. A mixagem deixa a sirene, o sino de "pronto" e a fanfarra tocarem por cima da voz. A sirene cobre por inteiro um dos quatro avisos pedidos pelo Rodrigo, "Inimigo detectado" (relação fala/sirene de −0,8 dB). Na mixagem, "Inimigo detectado" é a fala pedida mais frágil: tirou 1,00 no WAV, mas no MP3 do jogo o reconhecedor ouve "e nem migo detectado". Em batalha grande a voz fica só +2 dB acima do combate. As tropas quase nunca respondem à ordem de mover quando o jogador seleciona e clica rápido, como todo jogador faz. Sem o pacote, 4 das 10 falas pedidas ficam mudas, e a voz robótica que sobra não se entende: "Harvester deployed" vira "Harlaster, need mine".

---

## Pontos fortes (medidos)

1. **"Harvester deployed" agora toca.**
   - Sessão com mouse em tempo real (`out/sessao_mouse.json`): a Refinaria foi posicionada em t=35,6 s; o efeito `deploy` tocou em 39,5 s e a fala, pelo pacote, em 40,2 s, quando o Coletor chegou ao cristal.
   - Coletor da Fábrica: "Coletor pronto" em 85,2 s e "Harvester deployed" em 92,2 s.
   - Partida de 8 minutos com a IA (`out/sessao_densidade.json`): 6 vezes, todas pelo pacote.
   - O inglês é bem entendido: o reconhecedor deu "Harvester Deployed" (nota 1,00) junto com o efeito `deploy` (`out/pares.json`).
2. **Todos os eventos pedidos disparam, na hora certa e só para o jogador.**
   - Momentos medidos: "Torre de defesa pronta" no instante em que a obra termina (80,7 s); "Energia baixa" ao posicionar o Radar (130 de energia gerada contra 205 usada); "Inimigo detectado" 0,5 s depois de os inimigos entrarem na visão; "Base sob ataque" 1,7 s depois; "Vitória" 1,0 s depois da fanfarra.
   - Nenhuma fala saiu mais de 1,5 s atrasada (`scripts/sobreposicao.py`).
   - Em 8 minutos, nenhuma fala disparou para o inimigo, que também construiu 63 coisas.
3. **Inteligibilidade com a fala limpa** (Whisper small, `out/asr_radio.txt`).
   - Média de 0,983 no WAV cru, 0,966 no MP3 que o Chrome decodifica e 0,968 depois da cadeia de rádio do locutor.
   - Nas mixagens com o som de batalha do próprio jogo, o erro por palavra (WER) agregado ficou em 0,064 (calmo), 0,064 (escaramuça), 0,088 (batalha) e 0,072 (batalha grande) (`out/mix.txt`).
4. **Volume entre falas igualado na saída.**
   - Arquivos crus: de −23,0 a −14,9 LUFS (8,1 LU de diferença).
   - Depois da cadeia do jogo: de −15,7 a −12,8 LUFS, com mediana de −13,8 LUFS (`out/niveis_radio.json`).
   - Pico na saída abaixo de −0,4 dBFS em todas as mixagens, sem amostras cortadas.
5. **Pontas limpas.** As falas começam e terminam em zero (amostra inicial e final = 0,00000). O silêncio inicial vai de 27 a 55 ms, e o final de 42 a 118 ms, com exceção de `harvester_deployed`, que tem 214 ms. Não há clique de corte (`out/medidas_cru.json`).
6. **Mudo e simulação.**
   - Com M apertado, nenhuma voz toca, e uma fala em andamento ("Central perdida…") é cortada.
   - `avancar(240)` não tocou nenhuma voz.
   - A demonstração do título ficou muda por 20 s, com 0 falas e 0 respostas (`out/robustez.json`).
7. **Fluxo normal do título.** No caminho título → Começar, "Comandante, base operacional" sai pelo pacote (o pacote ainda estava sendo decodificado, mas essa fala é das primeiras).

---

## Problemas (do mais grave ao menos grave)

### 1. Efeitos de aviso tocam por cima da voz no barramento que nunca abaixa (grave)
`alert`, `ready`, `powerdown`, `win` e `lose` vão para `annBus` (audio.js:305, 309, 312, 314-315), que o `duck()` não abaixa. Nada coordena esses efeitos com a fila do locutor. Medi cada par, gravado exatamente como o jogo dispara (`scripts/pares.js` + `scripts/medir_pares.py`, saída em `out/pares.json`). A relação é fala/efeito na janela da fala, com ponderação K:

| Par | Fala/efeito | Pior trecho de 300 ms |
|---|---|---|
| **"Inimigo detectado" + sirene `alert`** (sequência real, quando a base é atacada logo depois) | **−0,8 dB** | −4,2 dB |
| "Derrota" + `lose` | **0,7 dB** | −3,4 dB |
| "Vitória" + `win` | 7,6 dB | 3,2 dB |
| "Usina pronta" + `ready` (sem atraso, buildings.js:211-212) | 7,6 dB | 5,1 dB |
| "Torre de defesa pronta" + `ready` | 9,9 dB | 5,1 dB |
| "Harvester deployed" + `deploy` | 13,0 dB | 8,6 dB |
| "Energia baixa" + `powerdown` (sem atraso, buildings.js:142) | 13,6 dB | 9,4 dB |

- Na sessão real, a sirene de combat.js:275 começou em 166,70 s, 0,2 s depois de "Inimigo detectado" começar (166,50 s). Ficou 1,2 s por cima. A fala que o Rodrigo pediu sai coberta pela sirene.
- Contagem na partida de 8 minutos: 57 vezes em que um efeito de aviso tocou por cima da voz (mais de 100 ms de sobreposição). Foram 25 `ready`, 23 `unit`, 6 `deploy` e 3 `detect`.
- Para reproduzir: `node scripts/pares.js sirene; python3 scripts/medir_pares.py sirene`.

### 2. Na mixagem, "Inimigo detectado" é o aviso pedido mais frágil; as falas foram escolhidas no WAV, e não no que o jogo toca (grave para o pedido)
- Notas do reconhecedor em cada formato:
  - WAV cru: 1,00.
  - MP3 a 56 kbps decodificado pelo Chrome: 0,81 ("e nem migo detectado").
  - Depois da cadeia de rádio: 0,70 ("e em um amigo detectado").
  - Na mixagem, tanto no calmo como na batalha grande: "Enemigos detectados".
- Mesmo padrão em outras falas:
  - `atk_2` "Fogo!": no MP3 vira "Fala bom", na cadeia de infantaria "Muito bom!" (0,31).
  - `col_mov` "Vou colher.": vira "Voculier" (0,67).
  - `unidade_tank`: na cadeia do locutor vira "Plim dado pronso" (0,77).
- Causa: tools/voz/gerar.py:65-80 escolhe a melhor de 5 tomadas pelo Whisper ouvindo o float antes do MP3. Depois o arquivo é codificado (gerar.py:94-95, `-b:a 56k`) e passa pelo filtro de rádio, e nada disso foi avaliado.
- Viés de seleção: o mesmo reconhecedor escolhe e avalia, por isso o relatório de 1,00 do autor é otimista. Na minha nova execução, sobre os WAV salvos em 16 bits, `pronto_barracks` já cai para 0,84 ("Quarta é o pronto!") e `harvester_deployed` para 0,94 ("Harvester Deploy", sem o /d/ final, também no MP3 e no rádio).

### 3. As tropas não respondem à ordem quando a seleção foi há menos de cerca de 1 s (grave para o item "e")
- voice.js:268 cala a nova resposta enquanto a anterior toca. voice.js:269 exige 0,8 s desde a última resposta, e a resposta à seleção conta. Selecionar e clicar com o botão direito logo em seguida é o gesto normal, e a ordem fica sem resposta.
- Teste (`scripts/ack_teste.js`, `out/ack_teste.txt`):

| Tempo até o botão direito | Respostas |
|---|---|
| 300 ms | `sel_1`, sem resposta à ordem |
| 600 ms | `sel_4`, sem resposta à ordem |
| 1000 ms | `sel_3` + `mov_2` (só porque `sel_3` é curta) |

- Na sessão com mouse: 4 ordens de mover, 0 respostas de mover. Ordem de atacar com resposta `atk_*`: 0 em toda a sessão.
- O certo é a ordem ter prioridade: cortar a resposta à seleção e tocar a da ordem.

### 4. Locutor e tropas falam ao mesmo tempo
- A tropa só se cala se o locutor estiver numa fala de prioridade 2 ou mais (voice.js:271). O locutor nunca espera a tropa (`pumpAnnouncer`, voice.js:196-212, não olha `ackNow`).
- Partida de 8 minutos: **13 sobreposições de duas vozes**, de até 1,06 s. Exemplos: `sel_4` sobre "Usina pronta" em 341,3 s (1,06 s); `sel_1` sobre "Refinaria pronta" em 30,8 s (1,01 s); `sel_2` sobre "Blindado pronto" (1,0 s); `sel_2` sobre "Unidade perdida" (0,8 s).
- As respostas das tropas também não abaixam a batalha (só `playLine` chama `duck`, voice.js:231). Na batalha grande elas ficam com relação fala/batalha de −2,3 a −0,5 dB, e 6 das 14 erram no reconhecedor: "Fogo!" vira "Só ali.", "Entendido." vira "Ainda não sei o que é do…" (`out/mix_linhas.json`).

### 5. Voz baixa demais em batalha
Relação fala/batalha medida em cada fala, com o abaixamento real do jogo: `duck` a 0,55 (−5,2 dB) e 0,4 (−8 dB) nos perigos. Incluí música, vento e motores (`scripts/render.js` + `scripts/medir_mix.py`):

| Nível | Mediana | p10 | Pior |
|---|---|---|---|
| Calmo | 23,1 dB | — | — |
| Escaramuça | 16,8 dB | — | — |
| Batalha | 4,7 dB | −0,9 dB | — |
| Batalha grande | **2,2 dB** | **−1,7 dB** | −2,9 dB |

- O Whisper aguenta (WER de 0,07), mas é muito mais robusto do que um ouvido cansado. Na batalha grande, 12 das 51 falas ficaram abaixo de 0,9: "Que se naria pronta", "Lindado Pronsi", "Coletor Sobataki".
- Para um locutor AAA, a voz deveria ficar pelo menos 8 a 10 dB acima da batalha nos avisos de perigo.
- Atenção: os eventos de batalha foram sorteados por um processo de Poisson com os efeitos do próprio banco, e não capturados de uma partida.

### 6. Prosódia sem urgência e caráter genérico
- Um só sintetizador (Kokoro `pf_dora`) faz todo o locutor, com uma voz masculina em inglês só para "Harvester deployed" (`am_onyx`). Um único ator (`pm_alex`) faz todas as tropas, diferenciadas só por velocidade e altura de 0,92 a 1,04 (voice.js:285).
- Medidas (`out/medidas_cru.json`, `out/velocidade_fala.txt`):
  - Altura média (F0) dos avisos de perigo igual à das falas neutras: `base_ataque` 185 Hz, `coletor_ataque` 179 Hz, `pronto_power` 195 Hz, `unidade_tank` 197 Hz. A variação de altura é a mesma, cerca de 3,5 semitons.
  - "Base sob ataque!" sai a 4,3 sílabas/s, mais devagar que a mediana do locutor (5,1). "Inimigos se aproximando da base" sai a 6,9.
  - O "!" do texto não vira ênfase: o reconhecedor transcreve "Base sob ataque." com ponto.
- Pronúncia: o reconhecedor ouve repetidamente "Enemigos", "Collector", "caiu → Caio/caíra" e "derrotados". "Quartel, pronto." tem uma vírgula artificial (falas.json) que cria uma pausa estranha.
- Não há respiração nem variação de leitura: cada fala existe em uma só versão.

### 7. A frequência cansa
- Partida de 8 minutos com a IA no nível difícil: **70 falas do locutor (8,7 por minuto, pico de 15 no minuto 5)**. Ele fica falando 19,3% do tempo.
- "Blindado pronto" saiu 18 vezes e "Obuseiro pronto" 8 vezes, quase sempre como pares repetidos a cada 15 s. "Construindo" saiu 7 vezes em 4 minutos na sessão com mouse.
- Faltam agrupamento ("Unidades prontas") e um limite por tipo de fala.

### 8. Ordem lógica e sincronia com os efeitos
- "Inimigos se aproximando da base" saiu 6 s **depois** de "Base sob ataque" (160,2 s e depois 166,3 s, na sessão com mouse). voice.js:348 não verifica se o ataque já foi anunciado.
- O efeito hidráulico `deploy` e a fala "Harvester deployed" se separaram em 2,3 s quando a fila estava ocupada (efeito em 94,47 s, fala em 96,73 s): o efeito sai na hora e a fala espera na fila.

### 9. Reservas fracas (?semvozes)
Teste com headless sem vozes no navegador (`out/robustez.json`):
- **"Coletor pronto", "Torre de defesa pronta", "Inimigo detectado" e "Blindado pronto" ficam mudos** (via = "sem voz"). Só as 6 falas com `en:` caem na voz robótica (voice.js:409).
- A voz robótica fala inglês ("Victory") para uma interface em português.
- A voz robótica não se entende (`out/asr_robo.txt`):

| Frase | O que o reconhecedor ouviu |
|---|---|
| Harvester deployed | **"Harlaster, need mine."** |
| Base under attack | "Maze under attack." |
| Low power | "Long timeer." |
| Victory | "Mystery!" |
| Defeat | "Let's see." |

- As respostas das tropas ficam caladas sem o pacote.

### 10. Falas perdidas enquanto o pacote é decodificado
- As 51 falas são decodificadas uma de cada vez depois do primeiro clique: de 1,25 a 1,86 s numa máquina livre, mais com a CPU disputada.
- Qualquer fala nesse intervalo vai para a reserva (voice.js:217 e voice.js:235). Na máquina do Rodrigo isso significa outra voz, a do navegador.
- Medido: com `?jogar`, "Comandante, base operacional" saiu como "sem voz". No teste do mudo, "Central perdida" pedida cerca de 1,7 s depois do clique também saiu como "sem voz".
- Outro detalhe: um aviso pedido com o som mudo grava `voiceLast` (voice.js:173). Depois de religar o som, "Base sob ataque" ficou bloqueado por 20 s.

### Por que o Rodrigo nunca ouviu "Harvester deployed" na versão anterior
- A versão anterior dependia só do `speechSynthesis`.
- `pickVoice` dava preferência a "Google UK English Male" (orig/voice.js:31), uma **voz de rede** do Chrome. Essas vozes falham sem aviso (sem internet, depois de cerca de 15 s de fala, às vezes em `file://`), e o código antigo não tinha `onerror` para cair numa reserva (orig/voice.js:96-105).
- Sem voz instalada, que foi o que aconteceu neste Chromium: 0 vozes, via = "robo" (`out/antigo_harvester.json`). A voz robótica é ininteligível: "Harlaster, need mine."
- Ou seja, ou não saía som nenhum, ou saía algo que ninguém reconhece como "Harvester deployed". Não consigo provar qual dos dois aconteceu na máquina dele, mas os dois caminhos estão demonstrados.

**Agora o caminho principal está garantido**: pacote embutido, decodificado no próprio jogo, tocado 8 vezes em 8 de 8 eventos nas sessões. Restam quatro furos:
1. Os primeiros cerca de 2 s depois do clique (problema 10).
2. A fala tem prioridade 2 e pode esperar no máximo 6 s na fila (voice.js:39); se perder a vez numa sequência de perigos, é descartada.
3. Um Coletor que nunca chega a um tile de cristal (harvest.js:140-145) nunca fala.
4. Sem o pacote, a reserva é ininteligível.

---

## O que faria a nota subir (em ordem de impacto)

1. **Coordenar os efeitos de aviso com a fila do locutor.** A sirene, o `detect`, o `ready`, o `powerdown` e a fanfarra devem esperar a fala acabar, ou abaixar 10 dB enquanto ela toca. Ou então emendar o efeito antes da fala, na mesma entrada da fila. A fanfarra deve baixar 10 a 12 dB debaixo de "Vitória" e "Derrota".
2. **Escolher a tomada no que o jogo toca.** Avaliar cada tomada depois do MP3 e da cadeia de rádio, com um ruído de batalha de +3 dB por cima. Subir o MP3 para 96 kbps, ou usar Opus. Corrigir a pronúncia de "Inimigo", "Coletor", "caiu" e "Quartel" com fonemas escritos à mão, e regravar "Harvester deployed" com o /d/ final claro.
3. **Respostas das tropas:** a ordem tem prioridade sobre a resposta à seleção (cortar a de seleção). Abaixar a batalha cerca de 4 dB debaixo da resposta. Dar uma voz a cada tipo de unidade (outra voz neural, e não só a velocidade de leitura). Ter de 6 a 8 falas por categoria.
4. **Uma fila única para as duas vozes.** O locutor espera ou corta a tropa; nunca duas vozes juntas.
5. **Abaixar mais em batalha:** 0,3 nos perigos e 0,45 no resto, com a meta de +8 dB de fala sobre a batalha. Medir com o mesmo `render.js`.
6. **Gravar versões urgentes** dos perigos: velocidade 1,1 e outra voz ou estilo, com 2 ou 3 variações por fala.
7. **Frequência:** agrupar "pronto" iguais em 10 s ("Unidades prontas") e limitar o locutor a cerca de 6 falas por minuto fora de combate. Não dizer "se aproximando" depois de "sob ataque".
8. **Reservas:** decodificar primeiro os avisos críticos e segurá-los (não mandar para a reserva) enquanto o pacote decodifica. Com `?semvozes`, usar a voz do navegador em português para todas as falas. Tirar a voz robótica ou deixá-la só para efeito.

---

## Scripts e saídas

Pasta: `/home/claude/criticos/som-r1/voz/`

**Scripts** (`scripts/`):

| Script | O que faz |
|---|---|
| `medir_cru.py` (+ `medir_cru_lib.py`) | LUFS, pico, true peak, silêncio nas pontas, F0, banda |
| `tom_residual.py` | Procura tom fixo nas pausas: nenhum encontrado acima de −37 dB |
| `espectro.py` | Não usado: falta matplotlib; os PNG saíram do ffmpeg |
| `asr.py`, `asr_radio.py` | Whisper no WAV cru, no MP3 decodificado, no locutor e nas cadeias de infantaria e veículo |
| `offline_helper.js` | Reconstrói a mixagem real (`initAudio`, `radioChain`, `playLine`, `sfx`, `duck`, música) num OfflineAudioContext |
| `render.js` | Falas pela cadeia real e mixagens com batalha em 4 níveis, em 3 stems |
| `medir_mix.py` | Relação fala/batalha e Whisper por fala e por trecho |
| `pares.js`, `medir_pares.py` | Pares efeito de aviso + fala |
| `instrumento.js` | Registra cada início de buffer, voz do navegador e oscilador |
| `sessao_mouse.js` | 4 minutos em tempo real com mouse |
| `sessao_densidade.js` | 8 minutos em tempo real com a IA |
| `sobreposicao.py` | Sobreposições e falas por minuto |
| `ack_teste.js` | Seleção seguida de ordem |
| `robustez.js` | Título, ?semvozes, mudo, simulação rápida |
| `robo_e_antigo.js` | Voz robótica e versão anterior |

**Saídas:**
- `out/`: `medidas_cru.json`, `velocidade_fala.txt`, `asr_cru.txt`, `asr_radio.txt`/`.json`, `niveis_radio.json`, `pares.json`, `pares_sirene.json`, `mix.txt`, `mix_linhas.json`, `sessao_mouse.json`, `sessao_densidade.json`, `ack_teste.txt`, `robustez.json`, `asr_robo.txt`, `antigo_harvester.json`, `sfx_duracoes.json`
- Áudio: `wav_radio/` (falas pela cadeia do jogo e voz robótica) e `wav_mix/` (mixagens e pares)
- `png/`: espectrogramas das falas cruas

**Limites:** não ouvi nada. A inteligibilidade é a do Whisper small, mais tolerante que um ouvido humano em ruído. A batalha das mixagens foi sorteada com os efeitos do próprio banco, e não capturada. A máquina estava com a CPU disputada (carga entre 5 e 12) durante as sessões em tempo real.
