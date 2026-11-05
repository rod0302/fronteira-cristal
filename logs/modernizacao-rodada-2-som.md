# Crítica: som, música e locutor. Fronteira Cristal (mod-r2)

**Nota: 7 de 10**

Funciona bem e cumpre o pedido principal: "Harvester deployed" sai na hora certa, pelos dois caminhos, só para coletores do jogador, e a voz robótica de reserva é tão inteligível quanto o espeak-ng. Um jogador exigente ainda vai notar quatro coisas: um aviso de "base sob ataque" que às vezes não toca, a sirene falando por cima do locutor, o tilintar de créditos quase sem parar e uma música grave e pouco variada. Nenhum problema bloqueia.

Tudo foi medido sem ouvir: renderização com OfflineAudioContext dentro da página, registro em tempo real dos sons aceitos e recusados, sessões de 8 min com IA, um jogador com mouse e reconhecimento de fala com pocketsphinx calibrado com espeak-ng.
Scripts: `/home/claude/criticos/mod-r2/scripts-som/`. Arquivos gerados: `/home/claude/criticos/mod-r2/capturas/som/`.

## Pontos fortes

- **Regras do projeto cumpridas.** Não há arquivo de áudio, `data:`, base64, `fetch` nem `decodeAudioData` no jogo (busca com grep). Todo som é feito com osciladores e ruído.
- **"Harvester deployed" no momento certo, verificado de verdade:**
  - Jogador com mouse (`humano.js`):
    - Refinaria colocada em 33,75 s, voz começa em 34,35 s (+0,60 s).
    - Coletor sai da Fábrica em 84,28 s, voz em 84,87 s (+0,59 s).
  - Sessões de 8 min com IA (`sessao_robo.json`, `sessao_vozes.json`): 5 coletores do jogador e 5 anúncios.
  - Nenhum anúncio para coletores do inimigo. Nenhum na demonstração do título: 90 s, 4 coletores, 0 falas (`titulo.js`).
  - Nenhum durante `__jogo.avancar(240)`: 4 coletores nasceram, 0 anúncios, e nenhum anúncio atrasado depois.
  - Com navegador em pt-BR, a frase continua em inglês, na voz inglesa. Nunca é lida por uma voz portuguesa.
- **A voz robótica é inteligível para o padrão do reconhecedor:**
  - Gramática fechada com 25 frases e distratores parecidos ("harvester destroyed", "harvester delayed", "harvest deployed"...): acerta 3/3 em três volumes, igual ao espeak-ng (`curtas.py`).
  - Misturada ao ruído de batalha do próprio jogo (8 trechos por nível), a voz do jogo acerta 8/8 (limpa), 7/8 (+10 dB), 6/8 (+5 dB), 4/8 (0 dB) e 2/8 (−5 dB). O espeak-ng acerta 8, 6, 5, 4 e 1 de 8 (`ruido_snr.py`).
- **Mixagem sem clipping.** O pico da batalha grande remixada é −2,6 dBFS, com 0 amostras saturadas (`batalha2_mix.wav`).
- **O limite de vozes segura.** No pico houve 31 efeitos por segundo e 20 vozes simultâneas, contra um limite de 28, que nunca foi atingido (`batalha2.json`).
- **Avisos se destacam no meio da batalha.** Efeitos e música abaixam (ducking) durante o aviso, e a sirene mais a voz ficam de 8 a 14 dB acima da batalha nas faixas médias. Em 9,3 s: +14 dB em 600–1000 Hz e +7,8 dB em 1–3 kHz. Em 29,5 s: +21,5 dB e +14,5 dB. No meio da batalha, o reconhecedor ainda escolhe "base under attack" (`voz_na_batalha.wav`).
- **Estéreo e distância corretos:**
  - O pan vai de −0,7 a +0,7 conforme a posição na tela, igual com zoom de 70%, 100% e 180%.
  - Fora da tela o volume cai suavemente: 0,61 a 100 px, 0,10 a 300 px e corte em 420 px (`posicao.js`).
- **Mudo (M) e música (N) funcionam:**
  - M zera tudo, de −31 dB para −120 dB, cancela a fala do navegador e registra `via: 'mudo'`.
  - A simulação rápida é muda.
  - Na vitória, a música abaixa cerca de 8 dB e a voz diz "Victory".

## Problemas (do mais grave ao menos grave)

### Atrapalha

1. **Um aviso menos importante cala o aviso "Base sob ataque" por 20 s.**
   - O tempo de espera `teams[0].lastAlert` é um só para todos os avisos (`src/combat.js`, `onAttacked`).
   - Teste (`alerta_prioridade.js`):
     - Um tanque meu fora da tela é atacado e a sirene toca em 0,4 s.
     - A partir de 4,3 s, três tanques atacam a Central. Em 14 s a vida dela cai de 2000 para 920 (−54%) sem sirene e sem voz (`falas: []`).
   - É exatamente o aviso que precisa se destacar. O defeito já existia na base aprovada, mas agora há locutor e o jogador espera ouvi-lo.

2. **A sirene toca por cima da frase falada.**
   - `sfx('alert')` e `say('Base sob ataque')` saem no mesmo quadro, com `lead` 0. A sirene dura 1,47 s e a voz começa 0,16 s depois (0,14 s com a voz do navegador).
   - O `duck()` não abaixa o barramento `annBus`, onde a sirene toca.
   - Medido em `sirene_sobre_voz_Base_under_attack.wav`: a sirene fica cerca de 10 dB abaixo da voz durante quase toda a frase, de 0,1 s a 1,4 s.
   - Pelo reconhecedor de fonemas, o erro sobe de 0,45 para 0,82 ("Base under attack") e de 0,50 para 0,62 ("Harvester under attack") (`fones.py`).
   - Na batalha, o reconhecimento livre passa de "based on user that sad" para "those are a dead". Os dois sons se atropelam em vez de um anunciar o outro.

3. **O tilintar de créditos toca quase sem parar.**
   - `sfx('credits')` é chamado a cada passo de descarga (`src/harvest.js`, `case 'unload'`) e só o intervalo de 350 ms segura.
   - Na sessão de 8 min com a câmera na base (`sessao_robo.json`):
     - 442 tilintares tocados e 10.340 recusados pelo intervalo.
     - 41 rajadas com média de 10,8 notas em 3,6 s.
     - Tilintar em 164 s de 430 s (38% do tempo), chegando a 89 por minuto no 6º minuto.
   - Cada nota sai em volume cheio (sinos FM de 1,5 a 2,6 kHz, com reverb), justamente onde a música não tem nada. A diferença para a música é de +35 a +40 dB numa banda de 1/3 de oitava (`ui_credits_com.wav`).
   - Na base aprovada era um "tic" senoidal de 30 ms com ganho 0,05. Agora é um sino de 0,4 s com ganho 0,18 e reverb. Em partidas de 5 a 10 minutos é o som que mais cansa.

4. **A música é grave e pouco variada.**
   - Renderização de 300 s (`musica_300s.wav`):
     - 80–90% da energia fica abaixo de 150 Hz (baixo em 55 Hz e pads em 110 Hz).
     - Acima de 200 Hz o nível é só −38 dBFS, contra −28 dBFS no total. Em alto-falante de notebook a música quase some.
   - A "intensidade que acompanha a batalha" muda pouco o volume: calmo −28,5 dBFS, escaramuça −28,7 e batalha −26,9 (+1,6 dB). O que muda é a entrada de chimbal e bumbo.
   - A ordem das seções `SECTION_ORDER` repete a cada 256 s. A progressão A aparece em 3 de 8 seções, ou seja, cerca de 7 vezes numa partida de 10 min.
   - Em batalha grande, a tensão bate em 1,0 e fica cravada lá durante todo o combate (`batalha2.json`, `per[].mt`).

### Detalhe

5. **Com a música desligada (N), o reverb da música continua tocando.**
   - `pad()` e `pluck()` mandam sinal para o reverb antes de passar pelo `musicBus`.
   - Medido com N desligado: `musicBus` a −120 dB, mas a entrada do reverb continua a −38 dB, igual a com música. A saída fica em −60 dB (mediana) e −56 dB (máximo), um "fantasma" da música (`controles2.js`).

6. **Com voz do navegador, o locutor tem duas vozes e "Construção concluída" fala demais.**
   - Os avisos em português usam a voz pt-BR, e "Harvester deployed" usa a voz inglesa, com timbre diferente.
   - Na sessão com vozes simuladas (`sessao_vozes.json`), "Construção concluída" foi dita 18 vezes em 8 min.
   - Quando vem logo antes de um coletor, "Harvester deployed" atrasa 1,46 a 1,70 s (campo `speak[].delay`).
   - Sem voz no navegador, "Construção concluída" fica muda (`via: 'sem voz'`). O comportamento muda conforme a máquina.

7. **Um segundo coletor dentro de 4 s não é anunciado.**
   - Teste com Refinaria colocada e Coletor da Fábrica cerca de 2 s depois (`dois_coletores.js`): 2 coletores, 1 só "Harvester deployed". O intervalo `say(..., 4)` fica em `announceHarvester`.
   - O som hidráulico `deploy` toca nas duas vezes, então o jogador ouve o chiado sem a frase.

8. **Pouco retorno sonoro das ordens:**
   - Selecionar unidades não faz som. O efeito `select` existe em `audio.js`, mas nenhum código o chama.
   - Mover, atacar e colher tocam o mesmo `click`.
   - Impacto de tiro não tem som próprio. `hit` está em `SFX_GAP`, mas não há `case 'hit'`.
   - Para um RTS "modernizado", falta resposta das unidades.

9. **Sons de erro e venda baixos:**
   - Nível curto de `error` −40,6 dBFS e de `sell` −37,8 dBFS. A música calma fica perto de −28 dBFS.
   - Sobre a música, o `error` fica 13 dB abaixo no total (`ui_error_com.wav`). Só se ouve pelos harmônicos agudos da onda quadrada, e a fundamental (165–220 Hz) cai em cima do pad.

10. **As frases curtas da voz robótica não puderam ser confirmadas.**
    - "Low power", "Victory" e "Defeat" deram 0/3 no reconhecedor. A referência espeak também deu 0/3, então o resultado é inconclusivo.
    - O espectrograma (`espectro_robo_harvester.png` contra `espectro_espeak_harvester.png`) mostra F2 e F3 bem mais fracos que no espeak e um zumbido de harmônicos em todas as frequências. Soa de propósito como rádio, mas é áspero.

11. **Na pausa, a música e o vento seguem no mesmo volume:** −31 dB contra −31 dB jogando (`controles.js`). A fala já enfileirada também continua. Não é erro, mas abaixar na pausa seria mais polido.

## Sugestões concretas

- **`src/combat.js`, `onAttacked`:**
  - Separar o tempo de espera por tipo de aviso (`lastAlert.base`, `.coletor`, `.unidades`).
  - Deixar o aviso de base furar a espera de um aviso de unidade.
- **`src/combat.js` e `src/voice.js`:**
  - Falar depois da sirene: `say('Base sob ataque', 'pt-BR', 20, 1.0)`, ou encurtar a sirene para 1 ciclo quando houver frase.
  - Ou fazer `speakNow` abaixar também a sirene. Para isso, a sirene precisa ter um ganho próprio que a voz possa reduzir.
- **`src/harvest.js` e `src/audio.js` (`credits`):**
  - Tocar o tilintar uma vez por descarga, no começo ou no fim. Ou subir `SFX_GAP.credits` para cerca de 1500 ms.
  - Baixar o ganho para cerca de 0,08 e tirar o reverb.
- **`src/audio.js`, música:**
  - Subir o pad uma oitava (`note(s)` em vez de `note(s - 12)`), baixar o baixo em cerca de 6 dB e abrir o filtro.
  - Criar mais seções ou variar a ordem com uma semente por partida.
  - Fazer a tensão mexer no volume e no brilho, por exemplo `lp.frequency` proporcional à tensão.
- **`src/audio.js`, envio para o reverb:** ligar o envio do `pad()` e do `pluck()` depois do `musicBus`, por exemplo um `musicSend` alimentado pelo `musicBus`, para que N e o ducking calem também a cauda.
- **`src/voice.js`:**
  - Escolher para os avisos em português uma voz com timbre parecido com a inglesa, ou usar a mesma voz inglesa para tudo, com as frases de `EN_FALLBACK`.
  - Em `announceHarvester`, reduzir o intervalo para cerca de 1,5 s, ou enfileirar o segundo anúncio em vez de descartá-lo.
  - Subir `say('Construção concluída', ..., 6)` para cerca de 20 s.
- **`src/input.js` e `src/audio.js`:**
  - Usar `select` ao selecionar.
  - Dar sons diferentes para atacar (mais seco) e mover.
  - Criar um `hit` curto nos impactos.
  - Subir o `error` em cerca de 10 dB e levá-lo para 400–800 Hz.
- **`src/input.js`, `setPaused`:** abaixar `musicDuck` em cerca de 6 dB na pausa.
