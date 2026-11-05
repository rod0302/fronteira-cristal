# Crítica de SOM, MÚSICA E LOCUTOR: Fronteira Cristal (mod-r1)

Avaliado por leitura de `src/audio.js`, `src/voice.js` e dos pontos que chamam `sfx`/`say`, e por medição:
sons renderizados com OfflineAudioContext dentro da página, gravação da saída real (um ScriptProcessor
entre o compressor e o alto-falante), partidas jogadas em tempo real com Playwright e `window.__jogo`
(incluindo 8 min de IA contra IA com a câmera seguindo a ação), e reconhecimento de fala com pocketsphinx,
calibrado com espeak-ng.
Scripts: `/home/claude/criticos/mod-r1/scripts-som/`. Arquivos gerados: `/home/claude/criticos/mod-r1/capturas/som/`.

## Nota: 7 / 10

O pedido principal do dono foi atendido e está bem feito: "Harvester deployed" sai na hora certa, só para o jogador,
não repete demais e se ouve no meio da batalha. A mixagem não satura. O que impede a nota 8: o alarme de ataque
some na batalha e ficou bem mais fraco que na versão aprovada; o locutor fala "Construção concluída" na tela de título;
sem voz no navegador, o jogador perde todos os avisos falados menos um. Um jogador exigente notaria os três.

## Pontos fortes

- **Harvester deployed no momento certo.** Toca quando a Refinaria nova é posicionada e quando um Coletor sai da Fábrica.
  Nunca toca para coletores do inimigo (6 coletores inimigos em 8 min, nenhum anunciado), nem na demonstração do título,
  nem durante `avancar`. Atraso medido: 0,15 s com a voz do navegador e 0,16 s com a voz robótica (`fluxo_coletores.log`, `voz_navegador_simulada.log`).
- **Não repete demais.** Foram 5 anúncios em 8 min de partida, um para cada Coletor do jogador. Com duas Fábricas
  entregando Coletores no mesmo instante, sai um anúncio só (intervalo de 4 s).
- **Ouve-se na batalha.** No meio de uma batalha com 78 unidades, a frase sobe a faixa de 300 Hz a 3 kHz em cerca de 12 dB,
  e o reconhecedor ainda escolhe "harvester deployed" entre 26 frases parecidas (`voz_na_batalha.wav`).
- **Sem arquivos de áudio.** Não há wav, mp3, ogg, `data:audio`, base64, `atob`, `fetch` nem `decodeAudioData`.
  Tudo é Web Audio ou speechSynthesis.
- **Mixagem sem distorção.** Na batalha grande, pico de -2,4 a -2,6 dBFS na saída real e 0 amostras cortadas em 25 s e em 8 min.
  O limite de 28 vozes nunca foi atingido (máximo de 19 a 21 simultâneas em duas rodadas), porque o intervalo por tipo de som já segura a densidade:
  23 a 30 sons por segundo tocados.
- **Estéreo funciona.** Explosão na borda esquerda sai 12 dB mais alta no canal esquerdo; a 1/4 da tela, 5 dB.
  O volume cai fora da tela e zera a 260 px (`pos_boom_*.wav`).
- **Controles funcionam.**
  - M zera a saída (-180 dB) e cancela a fala em andamento.
  - N tira a música.
  - Na pausa (P) nenhum efeito toca; a música continua baixa (-31 a -38 dB RMS).
  - `avancar(30)`: 13 sons pedidos, 0 tocados.
- **Comparado à versão aprovada**, os sons têm corpo de verdade: grave, reverb, estalos e variação de altura.
  A música acompanha a tensão da batalha.

## Problemas (do mais grave para o mais leve)

Nenhum problema bloqueia o jogo.

### Atrapalha

**1. O alarme de "base sob ataque" some na batalha e ficou mais fraco que na versão aprovada.**
- Medido sozinho: a sirene (`sfx('alert')`) tem pico de -23,8 dBFS e sonoridade máxima de -40,7 dB. A explosão comum chega a -21,3 dB. A distância entre os dois é de 19,4 dB.
- Na versão aprovada o alarme tinha -38,4 dB e a explosão -27,6 dB: distância de 10,8 dB. O alarme perdeu uns 9 dB em relação às explosões.
- Numa batalha em tempo real, a sirene tocou no segundo 9 da gravação. Na faixa dela (400 Hz a 1,8 kHz), o segundo da sirene ficou 3,5 a 4,8 dB mais **baixo** que os segundos de batalha anteriores. Ela não aparece.
- O reconhecedor de fonemas só ouve ruído nesse trecho.
- Sem voz em português, a sirene é o único aviso de ataque.
- Arquivos: `alerta_na_batalha.wav`, `batalha_com_anuncio.wav`, `sfx_alert.wav`, `base_sfx_alert.wav`.

**2. A demonstração do título faz o locutor falar e toca sons de interface sem atenuação.**
- Passos: abrir `index.html` sem parâmetros, clicar num canto e esperar.
- Em 150 s: 6 vezes "Construção concluída" no registro de falas (`via: 'sem voz'` no headless), 6 sinos de "pronto", 6 baques de "prédio posicionado" e 1 "unidade pronta". Nenhum desses sons é posicionado, então ignoram a redução de 0,35 que o título aplica aos outros. Eles aparecem como picos de -24 dB sobre a música de -32 dB (`titulo.log`).
- Com uma voz pt-BR simulada no speechSynthesis, o locutor realmente diz "Construção concluída" aos 12 s e aos 31 s do título (`voz_navegador_simulada.log`).
- Causa: `buildings.js` (cerca da linha 204, `if (team === 0) { sfx('ready'); say(...) }`) e `placeConstruction` (`sfx('place')`) não verificam `demoMode`. O time 0 é uma IA durante a demonstração.
- A parte dos sinos já existia na versão aprovada; a fala é nova.

**3. Sem voz no navegador, o jogador perde todos os avisos falados menos um, e a voz robótica de reserva é áspera.**
- `ROBOT_PHRASES` só tem "Harvester deployed". "Base sob ataque", "Coletor sob ataque", "Energia baixa", "Construção concluída", "Vitória" e "Derrota" ficam com `via: 'sem voz'`: não sai nada falado. Em 8 min de partida, 18 "Construção concluída" ficaram mudos (`partida_longa.log`). Somado ao problema 1, o aviso de ataque praticamente não existe nessa situação.
- Qualidade da voz robótica (`voz_robo_seco.wav`, `espectro_voz_robo_seco.png` comparado com `espectro_ref_espeak_harvester_deployed.png`):
  - O volume fica em -13 ± 2 dB quase sem quedas entre sílabas; o espeak cai a -30 dB entre sílabas. Soa como um zumbido contínuo.
  - O segundo e o terceiro formantes saem 5 e 10 dB abaixo do primeiro (ganhos 1 / 0,55 / 0,3).
  - O "s" é cortado pelo filtro passa-baixa de 3,8 kHz: 49% da energia acima de 4 kHz, contra 87% no espeak.
  - O "d" final é uma rajada de ruído tão forte quanto o "s" e pode soar como "deploy-ts".
  - Em `robotSpeak`, `nf.Q.value` é atribuído na hora do agendamento, então todos os fonemas ficam com o Q do último.
- Inteligibilidade estimada:
  - Na escolha entre 26 frases (incluindo "harvester destroyed" e "vehicle deployed"), o reconhecedor acerta "harvester deployed" com a voz robótica, como acerta com o espeak. As versões tocadas de trás para frente não casam com nenhuma frase, o que mostra que o teste discrimina.
  - Na transcrição livre, a voz robótica vira "cause us to do to read" ou "just as detroit"; o espeak vira "are the third lloyd".
  - Leitura: dá para entender sabendo o que se espera ouvir; "harvester" é a parte mais fraca.

**4. Vários sons ficaram tão baixos que não se ouvem na partida.**

Sonoridade máxima medida em janelas de 400 ms (`sfx_*.wav`):

| Som | dB |
|---|---|
| Voz robótica | -12,7 |
| Explosão grande | -15,8 |
| Explosão | -21,3 |
| Canhão | -29,6 |
| Pronto | -30,8 |
| Alarme | -40,7 |
| Unidade pronta | -43,7 |
| Foguete | -46,6 |
| Tilintar de cristal | -52,9 |
| Clique | -57 |

- A música calma fica em -30 dB e a batalha em -14 a -17 dB RMS.
- O foguete soa 17 dB abaixo do canhão: o soldado de lança-foguetes quase não tem som de tiro.
- O tilintar de cristal (pico de -42,5 dBFS, cerca de 60 por minuto com 3 a 5 coletores) e o clique (pico de -32 dBFS) somem debaixo da música.
- O som hidráulico de implantação (pico de -19 dBFS) começa 0,16 s antes da voz (pico de -4,4 dBFS) e é coberto por ela: `anuncio_harvester_completo.wav` mede igual à voz sozinha.

### Detalhe

**5. A música é um ciclo único de 32 s que se repete a partida inteira.**
- São 4 acordes (Lá menor, Fá, Dó, Sol), 8 s cada, sempre com o mesmo timbre. O arpejo é aleatório, mas a harmonia não muda.
- A percussão só entra com tensão acima de 0,25. Isso aconteceu em apenas 8,9% do tempo dos 8 min, porque a tensão perde 0,06 por segundo e cada explosão soma só 0,12.
- Fora das batalhas, o jogador ouve o mesmo ciclo umas 15 vezes em 8 min, com volume estável (-32 dB ± 1 no título, `titulo.log`).
- Arquivos: `musica_calma_64s.wav`, `musica_batalha_64s.wav`.

**6. O volume dá um salto na borda da tela.**
- Um som na borda tem volume 1; 10 px para fora, 0,53. São 5,5 dB de diferença de pico (`pos_boom_direita_borda.wav` a -9,9 contra `pos_boom_fora_dir_10px.wav` a -15,1).
- Fora da tela, o som zera a 260 px. Uma briga a 9 tiles da tela é totalmente muda.

**7. O fim da partida tem pouco destaque.**
- A fanfarra de vitória mede -26,5 dB, cerca de 4 dB acima da música, que continua igual depois do fim (-31 a -40 dB RMS nos 11 s seguintes, `controles_mudo_musica_pausa.log`).
- "Vitória" não é falado sem voz em português.

**8. A voz robótica é a coisa mais alta do jogo.**
- Ela fica 3 dB acima da explosão grande e 18 a 28 dB acima dos sons de interface. Na calma, sobe a saída de -50 para -16 dB RMS (`musica_mais_voz.wav`).
- Para um bordão é aceitável, mas destoa do resto. Com a voz do navegador nem dá para equilibrar, porque speechSynthesis não passa pelo Web Audio. Isso não foi medido.

## Sugestões concretas

1. **Alarme** (`audio.js`, `case 'alert'`):
   - Subir para `voiceOut(1.0, ...)` e usar tons de 0,22 a 0,25.
   - Abrir o passa-baixa para 3 a 4 kHz ou usar onda quadrada, para ocupar a faixa de 1 a 3 kHz onde a batalha é fraca.
   - Tocar 3 ciclos.
   - Abaixar o barramento de efeitos em 6 a 8 dB por 1,5 s enquanto a sirene ou o locutor tocam (`sfxBus.gain.setTargetAtTime`). Vale o mesmo dentro de `speakNow`.
2. **Demonstração** (`buildings.js`: aviso de construção pronta e `placeConstruction`): trocar `team === 0` por `team === 0 && !demoMode` antes de `sfx('ready')`, `say(...)`, `sfx('place')`, `sfx('unit')` e `sfx('sell')`. Ou fazer `say()` retornar logo se `demoMode`.
3. **Avisos sem voz** (`voice.js`):
   - Acrescentar a `ROBOT_PHRASES` pelo menos "Base under attack" / "Harvester under attack", ou as versões em português.
   - Ou criar sinais próprios e reconhecíveis para cada aviso: base atacada, coletor atacado, energia baixa.
4. **Voz robótica** (`robotSpeak`):
   - Ganhos dos formantes de cerca de 1 / 0,8 / 0,6.
   - Passa-baixa a 5 a 6 kHz.
   - Baixar o vozeamento para 0,15 a 0,25 nas consoantes, para criar quedas entre sílabas.
   - Encurtar e enfraquecer o "D" final (`n` de 0,3 para 0,1).
   - Agendar `nf.Q` com `setValueAtTime`.
   - Baixar `voiceOut(0.9)` para cerca de 0,6.
5. **Equilíbrio dos sons** (`sfx`): foguete com cerca de +12 dB (`voiceOut(v*1.2)` e ruído de 0,7), cristal com cerca de +15 dB (`voiceOut(v*0.9)`, sino de 0,15), clique com cerca de +8 dB. Atrasar `sfx('deploy')` para depois da voz, ou tirá-lo quando a voz fala.
6. **Música** (`scheduleMusic`):
   - Ter 2 ou 3 progressões que se alternam a cada 4 ciclos.
   - Variar o timbre do pad por seção.
   - Fazer a tensão cair mais devagar (0,004 por ciclo) e subir também com tiros, para a percussão aparecer em escaramuças.
   - No fim da partida, baixar `musicBus` e tocar a fanfarra mais forte.
7. **Volume na borda** (`placeSound`): substituir o degrau por `vol = 1 - 0.75 * (d/m)` contínuo e aumentar o alcance para cerca de 400 px.

