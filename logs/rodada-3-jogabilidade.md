# Rodada 3: crítica de JOGABILIDADE E CLAREZA

Jogo avaliado: cópia congelada em `/home/claude/criticos/rodada-3/jogo/` ("Fronteira Cristal").
Scripts do bot: `/home/claude/criticos/rodada-3/jogabilidade/`. Saída de cada partida em `out-*.txt`, na mesma pasta.
Capturas: `/mnt/project-files/rts/logs/capturas/rodada-3-jogabilidade/`.

Como o bot jogou:
- **`partida.js`** usa mouse e teclado reais para:
  - escolher facção, dificuldade e mapa na tela de título e clicar em JOGAR;
  - clicar nos botões do painel (prédios e unidades);
  - clicar em PRONTO e posicionar o prédio com o mouse;
  - marcar o ponto de encontro com clique no prédio e clique direito no mapa;
  - selecionar em caixa, clicar no botão **Atacar (A)** do painel e depois no minimapa.

  A estratégia é a de um jogador novo: **fazer o que o quadro Objetivo manda** e, quando ele diz "Monte um exército… e ataque", produzir e atacar.
- **`bom.js`** é um jogador "experiente", jogado só pela API:
  - até 6 coletores e 3 refinarias, depois blindados e obuseiros;
  - ataques em massa a partir de 10 ou 12 min.
- `__jogo.avancar` serve só para acelerar o tempo.

## Nota: 7,5 / 10

Na rodada 2 a nota foi 7,0. Quase tudo que pedi foi corrigido e conferido com o mouse:
- **o grupo anda junto:** 47 unidades misturadas em atacar-movendo ficaram com 8 a 19 tiles de espalhamento, e cada tipo ficou a no máximo 4 tiles da média;
- **botões no painel:** Atacar (A) e Parar (S) existem;
- **Objetivo:** pede a 2ª Refinaria e 4 Coletores, e mostra "X em construção (49%)" e "parada: sem créditos";
- **aviso sem créditos:** sai o aviso "Sem créditos: a produção está parada…";
- **inimigo clicado:** mostra tipo e vida;
- **desempenho:** 0 erros de console em todas as execuções, 60 fps.

A nota não chega a 8 porque um jogador exigente tropeça no seguinte:
- **O Normal no mapa padrão vira trincheira.**
  - O jogador que segue o Objetivo perdeu **5 de 5** partidas no Normal, e nenhuma no Fácil (venceu 3 de 3 com folga).
  - No Planalto Gêmeo, que vem marcado no título, ataques com mais unidades que a IA perdem: 54 contra 36 e 60 contra 50.
  - As partidas passam de 20 minutos sem vencedor.
- **O Objetivo manda atacar cedo demais.**
- **Produção parada sem créditos:** cerca de 1/3 do tempo de cada partida.
- **A interface não escala em telas grandes.**

## Partidas jogadas

| Id | Dificuldade / mapa / facção | Estratégia | Resultado |
|---|---|---|---|
| f1 | Fácil / Vale Partido / Brasa | segue o Objetivo, ataque aos 7:00 | **Vitória 11:35** (45 destruídos x 30 perdidos) |
| f0 | Fácil / Planalto Gêmeo / Cobalto | segue o Objetivo, ataque aos 8:00 | **Vitória 10:21** (45 x 17), `p-f0-fim.png` |
| bom-f2 | Fácil / Três Campos / Brasa | experiente | **Vitória 12:08** |
| n0 | Normal / Planalto Gêmeo / Cobalto | segue o Objetivo, ataque aos 8:00 | sem vencedor aos 11:40, perdendo (30 x 51 unidades) |
| n0b | Normal / Planalto Gêmeo / Cobalto | idem, até 16 min | perdendo aos 16:00 (3 x 50 unidades; 65 destruídos x 124 perdidos) |
| n1 | Normal / Vale Partido / Brasa | idem, até 16 min | perdendo aos 16:00 (7 x 22 unidades) |
| n2late | Normal / Três Campos / Âmbar | segue o Objetivo, só ataca aos 12:00 | **Derrota 16:04** |
| n0late | Normal / Planalto Gêmeo / Brasa | idem, até 22 min | perdendo aos 22:00 (0 unidades e 4 prédios x 50 unidades e 19 prédios) |
| bom-n0 | Normal / Planalto Gêmeo / Cobalto | experiente, ataque aos 10:00 | **Derrota 18:52**, depois de atacar com 54 x 36 unidades |
| bom-n0b | Normal / Planalto Gêmeo / Âmbar | experiente, ataque aos 12:00 | sem vencedor aos 21:40 (60 x 50 unidades no ataque; a IA ficou com os 19 prédios) |
| bom-n1 | Normal / Vale Partido / Brasa | experiente | **Vitória 12:50** |
| bom-n2 | Normal / Três Campos / Cobalto | experiente | vantagem aos 20 min (IA com 1 unidade e 8 prédios), sem fim |
| d2 | Difícil / Três Campos / Âmbar | segue o Objetivo | perdendo aos 10:40 (5 x 36 unidades) |
| d0 | Difícil / Planalto Gêmeo / Cobalto | segue o Objetivo | **Derrota 12:15** |
| bom-d2 | Difícil / Três Campos / Brasa | experiente | **Derrota 11:50** |

Desempenho (`fps.js`, tempo real):
- Partida Normal com as duas IAs aos 6 min: **59,6 fps**, p99 de 16,8 ms, pior quadro de 67 ms.
- Batalha com 86 unidades (`f01-batalha.png`): **58,4 fps**, p99 de 33 ms, pior quadro de 150 ms.
- Erros de console: **0** em todas as execuções.

## Problemas, do mais grave ao menos grave

### BLOQUEIA A PARTIDA

Nenhum. Não houve travamento, erro de console nem ação impossível.

### ATRAPALHA

**1. No Normal, o mapa padrão (Planalto Gêmeo) vira trincheira: ataques com vantagem numérica perdem e as partidas passam de 20 min sem vencedor.**
- Passos: título com Normal e Planalto Gêmeo (que já vem marcado) e jogar até 10 ou 12 min. Partidas n0, n0b, n0late, bom-n0 e bom-n0b.
- **A IA guarda quase tudo em casa.** Em `fortaleza.js` (IA contra IA, Normal, Planalto Gêmeo, 10:00), **30 das 32** unidades armadas da IA estavam a até 20 tiles da Central: 9 blindados, 7 obuseiros e 4 torres. Captura `g01-base-ia-normal-10min.png`.
- **Os ataques morrem na entrada da base.**
  - Em n0b, 32 unidades chegam juntas à entrada (`p-n0b-ataque-500.png`, espalhamento de 13 tiles).
  - Em 10 s caem de 25 para 1 unidade: 38 perdidas contra 21 destruídas (`p-n0b-ataque-530.png`, a bola vermelha na entrada).
- **Vantagem numérica não basta.**
  - bom-n0 atacou com **54 x 36** unidades aos 10:00. Aos 12:00 tinha 19 x 23 e perdeu aos 18:52.
  - bom-n0b atacou com **60 x 50** aos 12:00. Aos 14:00 tinha 20 x 23, e aos 21:40 a IA ainda tinha os 19 prédios.
- **O Fácil é o oposto.** As 3 partidas terminaram em 10 a 12 min, com 45 x 17, 45 x 30 e 42 x 28 de destruídos x perdidos. Entre Fácil e Normal não existe meio-termo para o jogador novo.
- **Resultado do jogador que segue o Objetivo:** venceu **0 de 5** partidas no Normal. O experiente venceu 1 de 4, e foi no Vale Partido.
- Sugestões:
  - a guarda da IA no Normal sai de casa ou é menor (`keepHome` 0,3 deixa demais quando o exército está parado);
  - limitar as torres;
  - ou dar ao Planalto Gêmeo uma segunda entrada.

**2. O Objetivo manda atacar aos 4 minutos, e quem obedece perde.**
- Em todas as partidas, o quadro passa a dizer "Monte um exército misto e ataque com A + clique…" entre 3:40 e 4:05 (log de objetivos no fim de cada `out-*.txt`: 220 a 245 s).
- O primeiro ataque do jogador novo (n0, n0b, n1, d0, d2), feito entre 7 e 8 min com 21 a 37 unidades, terminou sempre em perda desigual:
  - n0b: 21 destruídos x 38 perdidos;
  - n1: 19 x 17, mas sem nenhum prédio inimigo destruído;
  - d0: 24 x 29;
  - d2: 19 x 23.
- O Objetivo não dá nenhum parâmetro: nem quantas unidades, nem que torres pedem obuseiros, nem que convém esperar a primeira onda da IA.
- Sugestão: um passo intermediário, como "Defenda a primeira onda", ou "Junte cerca de 20 unidades com obuseiros: eles derrubam torres de longe".

**3. A produção ainda fica parada sem créditos durante cerca de 1/3 da partida.**
- Medido em `partida.js`, contando os segundos em que a obra ou a cabeça de alguma fila estava em `waiting`:

  | Partida | Parado | Duração | Fração |
  |---|---|---|---|
  | f1 | 210 s | 695 s | 30% |
  | n0b | 215 s | 960 s | 22% |
  | n1 | 315 s | 960 s | 33% |
  | n2late | 345 s | 964 s | 36% |
  | d2 | 220 s | 640 s | 34% |

- Créditos abaixo de 50 durante 190 a 390 s por partida.
- O aviso existe, mas sai no máximo uma vez por minuto (`p-n2late-420s.png`).
- O botão mostra "sem ◆" e a dica diz "Parado: sem créditos". Isso resolve a clareza (era o item 2 da rodada 2).
- O ritmo, porém, continua sendo esperar: quem segue o Objetivo tem 4 coletores aos 4 min e mesmo assim zera o caixa a cada obra de 1000.
- É mais equilíbrio do que interface, por isso ficou abaixo dos itens 1 e 2.

**4. A interface continua sem escala em telas grandes (item 5 da rodada 2, não corrigido).**
- Em 1920x1080 (`i-1920x1080.png`):
  - o painel continua com 220 px e os botões com 100x54;
  - o texto tem 11 px;
  - o Soldado tem cerca de 12 px de diâmetro;
  - do y 632 para baixo (448 px, 41% da altura), o painel fica vazio.
- Em 1024x600 (`i-1024x600.png`), a porcentagem de produção encosta no nome: "Soldado83%" e "Blindado33%".
- Nas três resoluções, a linha "Produzindo Blindado (2 na fila" sai cortada na borda do painel.

**5. Unidades atacadas fora da tela não geram aviso.**
- Passos (`interface.js`): mover um Blindado para o centro do mapa, com a câmera longe, e criar 2 Blindados inimigos ao lado.
- Em 6 s a vida cai de 400 para **22**, sem nenhuma mensagem.
- `onAttacked` só avisa quando o alvo é prédio ou coletor (`combat.js`, linha 254).
- O jogador que deixou o exército no ponto de encontro só descobre a perda pela contagem.
- Para prédios o alerta funciona: "Base sob ataque! (Espaço: ir até lá)", e o Espaço leva a câmera até lá (`i-alerta.png`, `i-espaco.png`).

### DETALHE

**6. Concordância errada no Objetivo: "Radar parada" e "Quartel parada".**
- Aparece em `out-f0.txt` ("160s Radar parada: sem créditos"), em `out-d0.txt` e em `out-d2.txt`.
- `currentGoal` usa "parada" fixo, sem `genderize`, que já existe e é usado nos avisos de pronto e destruído.

**7. Sem energia, o Objetivo fala de outra coisa.**
- Passos (`extremos.js`, caso C): energia em **180/130**, em vermelho.
- O quadro diz "Compre um segundo Coletor…", porque a checagem de energia vem depois da de coletores em `nextGoal` (`e04-sem-energia.png`).
- O efeito em si funciona: o Blindado levou **30 s** em vez de 15, e a barra fica vermelha.

**8. Quando o cristal do mapa acaba, nada avisa.**
- Passos (`esgotar.js`): remover todo o cristal.
- Os coletores ficam em "procurando cristal" por 60 s ou mais, com créditos parados, sem mensagem, e o Objetivo continua igual.
- Com cerca de 300 mil de cristal por mapa, isso só acontece em partidas muito longas. Mas o item 1 faz partidas longas acontecerem.
- O aviso de "cristal perto acabando" existe e saiu corretamente quando os campos próximos esgotaram (`extremos.js`, caso D).

**9. Com uma fila em produção, a Fábrica e o Quartel deixam de mostrar a dica "Botão direito no mapa: encontro".**
- A linha "Produzindo…" toma o lugar dela (`i-1366x768.png`).

## Casos extremos conferidos (sem problema)

- **Selecionar tudo e mandar ao mesmo ponto** (`extremos.js`, caso A): 47 de 47 unidades selecionadas com caixa e clique direito a 24 tiles.
  - todas paradas em 25 s, a no máximo 4,2 tiles do ponto;
  - **0 pares sobrepostos** (`e01-todos-mesmo-ponto.png`).
- **Atacar-movendo com 47 unidades** pelo botão do painel e pelo minimapa: espalhamento entre 8 e 19 tiles em 60 s (`e02-coluna-atacar-movendo.png`).
- **Posicionar em lugar inválido** com o mouse. O fantasma fica vermelho, o motivo aparece e o modo de posicionar continua ativo:
  - "Requer Usina";
  - "Só dá para construir no planalto de pedra" (cristal, penhasco, solo, sobre um tanque);
  - "Longe demais da base";
  - "Lugar ocupado" (sobre a Central) (`05-fantasma-sobre-central.png`, `e03`).
- **Clique em inimigo:** o painel mostra "Blindado 400/400 · Inimigo (Clã Brasa)" com a descrição (`i-inimigo-clicado.png`).
- **Pausa (P):** mostra controles e regras (`i-pausa.png`). A tela de fim tem estatísticas e "Jogar de novo" (`p-f0-fim.png`).

## O que está bom

- **Título:** claro, com facção e vantagem, inimigo, dificuldade, mapa e controles numa tela só (`01-titulo.png`). Dá para começar sem ler nada.
- **Começo guiado:**
  - o Objetivo ensina a ordem certa e mostra a obra em andamento;
  - PRONTO pisca, o fantasma fica verde ou vermelho e o motivo da recusa aparece.
- **Ordens:** os botões Atacar e Parar estão no painel, o grupo anda junto e o ponto de encontro tem bandeira.
- **Alertas:** de base e de coletor, com o Espaço levando a câmera até lá.
- **Partida:** o Fácil é vencível em 10 a 12 min com um jogo simples, e é divertido ver a coluna andar junta e varrer a base.
- **Estabilidade:** 60 fps e 0 erros de console.
