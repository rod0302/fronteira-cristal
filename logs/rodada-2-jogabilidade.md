# Rodada 2: crítica de JOGABILIDADE E CLAREZA

Jogo avaliado: cópia congelada em `/home/claude/criticos/rodada-2/jogo/` ("Fronteira Cristal").
Scripts do bot ficam em `/home/claude/criticos/rodada-2/jogabilidade/`. O bot usa Playwright com mouse e teclado reais no título, no painel, no posicionamento, na seleção em caixa, no clique direito, em A + minimapa, em Ctrl+1 e no Espaço. `__jogo.avancar` serve só para acelerar o tempo.
Capturas: `/mnt/project-files/rts/logs/capturas/rodada-2-jogabilidade/`.

## Nota: 7,0 / 10

A rodada 1 teve 6,5. Os bloqueios e armadilhas de interface daquela rodada foram corrigidos:
- a Central não se vende;
- vender pede confirmação;
- A + minimapa funciona;
- a ajuda explica que o clique direito é "mover (atira no caminho)".

Começar uma partida sem ler nada é fácil. Não achei erro de console em nenhuma das 12 execuções, e o jogo roda a 60 fps.

A nota não chega a 8 porque um jogador exigente bate em quatro coisas:
- **O guia do jogo leva à derrota no Normal.** O quadro Objetivo para de orientar a economia depois de 2 coletores, enquanto a IA chega a 5. Quem segue o Objetivo perde no Normal aos 8:16 e no Difícil aos 7:12.
- **Começo travado por falta de dinheiro.** Nos 6 primeiros minutos, 40% do tempo fica com produção parada esperando dinheiro, e a tela não diz isso com clareza.
- **O exército não anda junto.** Os rápidos chegam sozinhos e morrem.
- **Interface sem escala.** Atacar-movendo só existe no teclado, e a interface não acompanha telas grandes.

## Partidas jogadas (bot com mouse, contra a IA)

| Id | Dificuldade / mapa / facção | Estratégia | Resultado |
|---|---|---|---|
| n0 | Normal / Planalto Gêmeo / Cobalto | segue o Objetivo (2 coletores), ataque aos 7:00 | **Derrota 8:16**. Colhido 9 999 x **28 500**; 17 mortos x 37 perdidos |
| d2 | Difícil / Três Campos / Âmbar | segue o Objetivo | **Derrota 7:12**. Colhido 9 000 x **29 739** |
| f1 | Fácil / Vale Partido / Brasa | segue o Objetivo, ataque aos 7:00 | **Sem vencedor aos 10:40** (9 x 10 unidades vivas) |
| n2eco | Normal / Três Campos / Brasa | 2 refinarias, 3 coletores | sem vencedor aos 10:40, perdendo (0 x 21 unidades) |
| nforte | Normal / Planalto Gêmeo / Cobalto | 3 refinarias, 4 coletores, torres | sem vencedor aos 13:10 (4 x 19 unidades) |
| n1forte | Normal / Vale Partido / Âmbar | 3 refinarias, 3 coletores, torres | sem vencedor aos 13:10 (9 x 17 unidades) |
| fforte | Fácil / Três Campos / Cobalto | 4 coletores, ataque aos 8:00 | **Vitória 10:22** (35 mortos, 23 perdidos), captura `p-fforte-fim.png` |
| dforte | Difícil / Vale Partido / Brasa | 4 coletores, torres | **Derrota 10:12** |

Desempenho:
- FPS em 60 s de tempo real numa partida Normal (5:20 a 6:20) com as duas IAs ativas: **59,5 fps**, p99 de 16,8 ms, um único quadro de 333 ms.
- Batalha de cerca de 60 unidades: 60 fps (`f01-batalha-80-unidades.png`).
- Erros de console: **0** em todas as execuções.

## Problemas, do mais grave ao menos grave

### BLOQUEIA A PARTIDA

Nenhum encontrado nesta rodada.

### ATRAPALHA

**1. O quadro Objetivo leva o jogador novo à derrota no Normal: ele para de cuidar da economia em 2 coletores, e a IA vai a 5.**
- Passos: começar no Normal e fazer exatamente o que o Objetivo pede (`espera.js` e partidas n0, d2, f1).
- Por volta de 1:48, o Objetivo já está em "Monte um exército e destrua todos os prédios inimigos". Ele nunca sugere uma segunda refinaria nem um terceiro coletor (veja `currentGoal` e o log de `espera.js`).
- Economia da IA com o jogador parado (`economia.js`):
  - Normal: 4 coletores aos 4:00 e 5 coletores com 3 refinarias aos 6:00;
  - Difícil: 6 coletores aos 4:56.
- O jogador que segue o Objetivo colhe cerca de **1/3** do que a IA colhe: 9 999 x 28 500 no Normal e 9 000 x 29 739 no Difícil, e perde as duas (tabela).
- O mesmo jogador no Fácil não termina a partida em 10:40. Com 4 coletores, venceu o Fácil em 10:22 e empatou no Normal. A economia é o que decide, e o jogo não ensina isso.
- Correção sugerida: depois da Fábrica, o Objetivo deveria pedir "2ª Refinaria" e "3 a 4 Coletores" antes de "Monte um exército". Também ajudaria um aviso quando a renda da IA (vista pelo radar) for muito maior.

**2. Começo de partida travado por falta de dinheiro, sem aviso claro.**
- Medido em `espera.js`, seguindo o Objetivo (Fácil e Normal, mesmos números):
  - nos primeiros 360 s, algum item ficou parado esperando créditos durante **143 s (40%)**;
  - os créditos ficaram abaixo de 50 durante **155 s**.
- Nas partidas com mouse, os créditos ficam perto de 0 de 1:30 a 7:00. Por exemplo, em f1: `cr=0` em todas as amostras de 150 s a 420 s.
- Como a tela mostra a espera (`e11-sem-dinheiro-dica.png`, com 0 créditos, a Fábrica a 11% e um Soldado a 37%, os dois parados):
  - a barra de progresso fica levemente avermelhada e os preços ficam vermelhos;
  - a dica do botão diz só "Em construção" e nunca "parado: sem créditos";
  - não sai nenhuma mensagem.
- Para o jogador novo, a obra parece lenta, e não parada.
- Correção sugerida: mostrar "sem créditos" no botão e na dica, e dar um aviso único do tipo "Sem créditos: construa mais Coletores".

**3. O exército não anda junto: em atacar-movendo, os rápidos chegam sozinhos e morrem.**
- Passos (`extremos.js`, caso D): 11 unidades misturadas recebem atacar-movendo até a Central inimiga.
- Espalhamento da coluna: **37 tiles aos 15 s**, depois 23, 25 e 16 tiles. Os 2 Batedores sumiram da lista aos 30 s, porque chegaram sozinhos e morreram. Captura `e07-coluna-espalhada.png`: Blindados já na Central inimiga e Foguetes muito atrás.
- Na partida f1, 40 s depois do ataque com 24 unidades, a seleção tinha só 9 Soldados e 7 Foguetes. Os Blindados tinham ido na frente e morrido (`p-f1-ataque.png`). Placar 40 s depois: 7 mortos x 8 perdidos. Aos 7:50: 9 x 24.
- O clique direito no chão continua sendo a ordem padrão, e numa luta ele perde. Teste com 5 Blindados contra 5 Blindados parados no caminho, 45 s (`mover.js`):
  - mover: **0/5 meus vivos e 3/5 inimigos vivos**;
  - atacar-movendo: **2/5 meus vivos e 0/5 inimigos vivos**.
- A ajuda agora explica a diferença, mas o reflexo do jogador é o clique direito.
- Correção sugerida: o grupo em atacar-movendo deveria andar na velocidade da unidade mais lenta, ou parar de vez em quando para se reagrupar.

**4. Atacar-movendo e parar só existem no teclado.**
- Os únicos botões clicáveis do painel durante a partida são `build`, `unit` e `tip` (`interface.js`, campo `hitsComOrdens`). Não há botão de ordem para as unidades selecionadas.
- A ordem que mais importa no jogo (item 3) depende de o jogador ler a linha cinza de 11 px no topo ("A: atacar-movendo").
- Correção sugerida: com unidades selecionadas, o painel de informações poderia mostrar os botões [Atacar-movendo] e [Parar].

**5. A interface não acompanha o tamanho da tela.**
- Em 1920x1080 (`08-1920x1080.png`):
  - o texto do painel continua com 11 px;
  - o Soldado tem cerca de 12 px de diâmetro;
  - o painel continua com 220 px, e metade dele fica vazia abaixo do Objetivo.
- Em 1024x600 (`07-1024x600.png`), o cadeado fica em cima dos nomes ("Refinari🔒", "Blindado🔒").
- Em 1280x720 (`i01-fabrica-ponto-encontro.png`), a linha "Botão direito no mapa: encontro" sai cortada no pé do painel.

### DETALHE

**6. O mesmo passo aparece três vezes ao mesmo tempo.**
- O Objetivo aparece na linha do topo e no quadro do painel, e no começo ainda há a mensagem "Comandante, construa uma Usina…" (`03-inicio-partida.png`).
- A linha do topo poderia sair quando o quadro está visível.

**7. O Objetivo não percebe a obra em andamento.**
- Ele diz "Construa uma Fábrica para produzir blindados" com a Fábrica já a 11% (`e11-sem-dinheiro-dica.png`).
- O jogador pode achar que o clique não funcionou.

**8. A dica dos botões da coluna UNIDADES cobre a coluna PRÉDIOS inteira.**
- Ela esconde Usina e Refinaria enquanto o mouse está na coluna da direita (`p-n0-300s.png`, `p-n1forte-480s.png`).

**9. Esgotar o cristal perto da base não gera aviso.**
- Passos (`esgotar.js`): zerar os 139 tiles de cristal num raio de 22 tiles da base.
- O coletor acha campos mais longe sozinho, o que é bom. Mas a renda cai de cerca de 1 000/min para cerca de 700/min (2 500 colhidos de 65 s a 275 s) sem nenhuma mensagem.
- Com 300 mil de cristal no mapa e 52 mil perto da base, isso só aparece em partidas longas.

**10. Clicar num inimigo não mostra informação dele.**
- O clique tira a seleção das suas unidades e o painel volta para o Objetivo (`i05-clique-inimigo.png`).
- Não dá para ver a vida nem o tipo do inimigo.

**11. Um quadro de 333 ms em 60 s de jogo em tempo real.**
- O p99 ficou em 16,8 ms (`tempo-real.js`).
- Pode ser do ambiente sem tela; fica como observação.

Itens que testei e que não são problema:
- **Mensagens empilhadas nas minhas capturas aceleradas:** são efeito do `avancar`. Em tempo real, durante 60 s com ataque, houve no máximo 2 mensagens simultâneas.
- **Posicionamento:**
  - colocar sobre a Central, no solo, no cristal ou sobre um tanque é recusado com o motivo certo, e o fantasma fica vermelho (`e01`, `e02`, `e03`);
  - o modo de posicionar continua ativo depois do erro, então dá para tentar de novo.
- **Selecionar tudo e mandar ao mesmo ponto:** 45 unidades com caixa de seleção e clique direito no minimapa chegaram todas em 40 s, sem sobreposição (`e06-todos-mesmo-ponto.png`).
- **Ficar sem energia:** depois de vender a única Usina, a energia ficou 180/30 em vermelho, o Objetivo voltou para "Construa uma Usina", o Blindado levou 30 s em vez de 15 e o radar desligou (`e05-sem-energia.png`).
- **Limite de unidades:** aparece a mensagem "Limite de 60 unidades atingido".

## O que está bom

- **Tela de título:** clara, com as escolhas (facção com vantagem, inimigo, dificuldade, mapa) e os controles à vista. O mapa de fundo muda ao escolher outro mapa.
- **Construir sem ler nada:**
  - o botão PRONTO pisca;
  - o fantasma verde ou vermelho mostra a área válida destacada;
  - as dicas dos botões trazem preço, tempo, energia e o requisito que falta;
  - o cadeado mostra o que ainda está bloqueado.
- **Correções da rodada 1 conferidas com mouse:**
  - vender pede 2 cliques;
  - a Central não tem botão Vender;
  - A + minimapa funciona: 24 de 24 unidades em atacar-movendo na partida f1.
- **Ponto de encontro:** tem bandeira e linha tracejada. A fila de produção tem contador (x3) e o clique direito tira um item da fila.
- **Atalhos:** o duplo clique seleciona todas do mesmo tipo, e Ctrl+1 e 1 funcionam.
- **Alertas:** "Base sob ataque" e "Coletor sob ataque" aparecem, e o Espaço leva a câmera até o alerta.
- **Fim de partida:** a tela de vitória e derrota mostra estatísticas úteis.
- **Desempenho e estabilidade:** 60 fps e 0 erros de console.
- **Dificuldade:** o degrau existe e o Fácil é vencível.
