# Rodada 1: crítica de JOGABILIDADE E CLAREZA

Jogo avaliado: cópia congelada em `/home/claude/criticos/rodada-1/jogo/` ("Fronteira Cristal").
Scripts do bot (Playwright, mouse e teclado reais no painel e no mapa, `__jogo.avancar` só para acelerar o tempo): `/home/claude/criticos/rodada-1/jogabilidade/`.
Capturas: `/mnt/project-files/rts/logs/capturas/rodada-1-jogabilidade/`.

## Nota: 6,5 / 10

A base é boa e um jogador novo consegue começar sem ler nada: o quadro Objetivo, as dicas nos botões, o PRONTO piscando e o aviso de energia funcionam bem. A nota não passa de 6,5 por quatro motivos. Um clique errado estraga a partida sem volta. O clique direito, que a tela de ajuda apresenta como "mover / atacar", leva o exército à morte sem revidar. Os 3 primeiros minutos se passam com 0 créditos. E o Normal se vence com uma estratégia trivial (88 inimigos mortos contra 19 perdas).

## Partidas jogadas (bot, contra a IA)

| Partida | Estratégia | Resultado |
|---|---|---|
| Normal, `partida.js` | ordem de construção do Objetivo, tanques e soldados, ataque aos 7:00 com caixa de seleção + **clique direito no minimapa** | **Derrota aos 9:08**. O ataque saiu com 14 unidades, sobrou 1 em 60 s. Placar final: 25 mortos, 48 perdidos |
| Fácil, `partida2.js` | 2 refinarias + coletor extra, 2 torres, só blindados, ataque com **A + clique** | **Vitória aos 9:22** (47 mortos, 4 perdidos) |
| Normal, `partida2.js` | igual à anterior | **Vitória aos 11:05** (88 mortos, 19 perdidos) |
| Difícil, `partida2.js` | igual à anterior | **Derrota aos 7:39** (30 mortos, 32 perdidos) |
| Normal, `passivo.js` | só prédios e 2 torres, nenhuma unidade | 1º ataque aos ~5:00, derrota aos 11:43 |

O degrau de dificuldade existe. FPS: 60,3 no início e 60,2 numa batalha de 80 unidades (pior quadro: 16,8 ms), sem erros no console em nenhuma partida.

## Problemas, do mais grave ao menos grave

### BLOQUEIA A PARTIDA

**1. Vender a Central: um clique, sem confirmação, e a partida acaba na prática.**
- Passos: clicar na Central (é o primeiro prédio que o jogador clica) e depois em "Vender", que fica colado em "Reparar".
- Medido (`extremos.js`, caso E):
  - créditos 2500 antes e 2500 depois (a Central custa 0, então a venda devolve 0);
  - `hasBuilding(0,'hq') = false`;
  - `construir('power')` → "Sem Central não se constrói";
  - a Central não está no menu e não pode ser reconstruída;
  - todos os botões ficam com cadeado, e o Objetivo continua mandando "Construa uma Usina: clique nela no painel".
- Capturas: `13-central-selecionada.png`, `14-central-vendida.png`.
- Correção sugerida: não deixar vender a Central e pedir confirmação (2º clique) para vender qualquer prédio.

### ATRAPALHA

**2. O clique direito no chão (e no minimapa) é "mover puro": as unidades atravessam o inimigo sem atirar.**
- A ajuda da tela de título e da pausa diz "Clique direito: mover / atacar", e o jogador novo entende que o exército vai lutar.
- Experimento controlado (`mover_vs_amove.js`): 8 blindados contra 5 blindados parados no caminho, mesmo destino, 45 s.
  - `mover` (clique direito): **1/8 dos meus vivos**, 1/5 dos inimigos vivos.
  - `atacarMovendo` (A + clique): **7/8 dos meus vivos**, 0/5 dos inimigos vivos.
- Na partida Normal com clique direito no minimapa, 14 unidades foram para 1 em 60 s (tabela acima).
- Teste com 1 tanque (`extremos.js`, caso B): ele andou levando tiro até chegar ao destino e terminou com 100/460 de vida.
- Correção sugerida: a unidade que leva tiro enquanto anda deveria revidar, ou o clique direito no minimapa deveria ser atacar-movendo. No mínimo, a ajuda deveria explicar a diferença.

**3. Atacar-movendo não aceita o minimapa como destino.**
- Passos: selecionar unidades, apertar A e clicar no minimapa.
- Medido (`ui2.js`): `input.mode` continua 'amove', 0 unidades recebem a ordem e a câmera só pula.
- Consequência: para mandar o exército lutando até a base inimiga é preciso rolar a tela até lá e clicar numa área preta da névoa (`n2-ataque.png`). Somado ao item 2, a única ordem de longa distância cômoda (clique direito no minimapa) é justamente a que faz o exército morrer.

**4. Começo de partida sem dinheiro: cerca de 3 minutos com 0 créditos seguindo o próprio Objetivo.**
- A ordem que o Objetivo sugere (Usina 300 + Refinaria 1000 + Quartel 350 + Fábrica 1000) soma **2650**, e o crédito inicial é 2500.
- Um coletor rende cerca de 700 a cada 30 s (`cristal.js`: 1400 colhidos por minuto no começo).
- Medido nas 4 partidas: créditos = 0 nas amostras de 1:30, 2:00, 2:30, 4:00 e 4:30 (`partida.js` Normal: `cr:[0,…]` de 90 s a 270 s). Tudo fica parado em "esperando dinheiro" justamente na fase em que o jogador novo aprende.
- O Objetivo nunca sugere um segundo coletor ou uma segunda refinaria, que é o que resolve o problema (com 2 refinarias + 1 coletor, a vitória no Normal veio fácil).
- Correção sugerida: começar com 3000 ou incluir "Compre outro Coletor" no roteiro do Objetivo.

**5. A IA do Normal é fácil de explorar e as ondas morrem nas torres.**
- `partida2.js` Normal: 88 mortos contra 19 perdidos. Entre 6:00 e 10:00 o exército inimigo caiu de 14 para 0 enfrentando só 2 torres e uma pilha de blindados parados.
- A IA ataca em ondas, perde tudo e não muda de tática. Um jogador exigente ganha no Normal sem sair de casa até ter 20 tanques.

**6. Os avisos empilham e cobrem o canto do mapa.**
- Cada unidade pronta gera um aviso que fica 5 s na tela. Com produção contínua, a coluna fica cheia de "Blindado pronto" x5 (`partida-n-240s.png`, `19-saida-fabrica.png`, `n2-final.png`), ocupando ~150 px do canto superior esquerdo.
- "Base sob ataque!" e "Refinaria destruída" se perdem no meio da lista (`partida-n-360s.png`, `n2-ataque.png`). Não há tecla para ir ao local do último alerta, e não há aviso quando uma unidade de combate morre.

**7. Mensagem errada ao clicar num prédio bloqueado quando há outro PRONTO esperando lugar.**
- Passos: Usina fica PRONTA, e o jogador clica em Quartel.
- Medido (`extremos.js`, caso G): aparece "Espere a construção atual terminar". Mas nada vai terminar: a Usina já está pronta e espera o clique para ser posicionada. O motivo real (Quartel requer Usina, e é preciso posicionar a Usina primeiro) não aparece.

### DETALHE

8. **O quadro Objetivo some** sempre que há algo selecionado (o painel de informação ocupa o lugar). O jogador novo seleciona o tempo todo, então o guia some quando mais ajuda (`13-central-selecionada.png`, `21-coletor-selecionado.png`).
9. **Concordância** nos avisos: "Quartel pronta: escolha onde colocar" e "Radar pronta" (o certo é "pronto"). Visto em `ui2.js` e em `partida-n-240s.png`.
10. **Saída da fábrica**: sem ponto de encontro, cada unidade anda 2 tiles para baixo e todas param no mesmo ponto. Formam uma fila colada que entra no corredor entre a Central e o Quartel (`19-saida-fabrica.png`, `partida-n-240s.png`). Mais tarde isso atrapalha a passagem de coletores e reforços.
11. **Exército inicial no lugar de construir**: ele fica logo abaixo da Central, que é o lugar mais natural para o 2º prédio. Tentar construir ali dá "Há unidades no caminho" (`s3.js`, 2 tentativas recusadas).
12. **Sem indicação do alcance de construção** (4 tiles): o fantasma só fica vermelho e a mensagem diz "Longe demais da base". Não há contorno da área válida.
13. **Fonte pequena**: nomes e preços em 10 px, descrições em 9 px, painel fixo de 220 px. Em 1920x1080 tudo continua minúsculo (`18-tela-1920x1080.png`). Em 800x600 o mapa fica com só 580 px de largura (`18-tela-800x600.png`).
14. **Rolagem pela borda** dispara com o mouse a 12 px da borda direita do painel e da barra superior: a câmera se mexe quando o jogador só quer usar a interface.
15. **Unidades se sobrepõem** em grupos grandes. No combate de 80 unidades os blindados vermelhos aparecem desenhados uns sobre os outros (`17-batalha-grande.png`).

## O que está bom (curto)

- **Entrar no jogo**:
  - a tela de título é clara (facção com vantagem descrita, dificuldade, JOGAR) e a lista de controles está na tela (`01-titulo.png`);
  - a mensagem inicial e o quadro Objetivo levam o jogador passo a passo até a Fábrica;
  - a dica de cada botão mostra preço, tempo, energia, pré-requisito e o que o clique faz.
- **Botões de construção**: o fluxo de construir é claro. O botão enche com a porcentagem e pisca PRONTO, o fantasma fica verde ou vermelho tile a tile e a recusa explica o motivo ("Só dá para construir no planalto", "Há unidades no caminho", "Longe demais da base"). Clique direito ou Esc cancela.
- **Energia**: "⚡ ENERGIA BAIXA" pisca, a barra fica vermelha (180/130), a usina apaga, o Objetivo muda e a produção cai pela metade (blindado: 14 s → 28 s). Captura `12-sem-energia.png`.
- **Cristal**: o coletor trabalha sozinho e procura campos mais longe quando o perto acaba. O mapa tem 305 mil de cristal e ~62 mil no quadrante da base, então não acaba numa partida normal e o coletor nunca travou em 40 min simulados.
- **Mover grupos**:
  - 29 unidades mandadas ao mesmo ponto chegaram todas em ~50 s;
  - nenhuma ficou presa e o grupo terminou espalhado num raio de 4,6 tiles (`10-todos-mesmo-ponto.png`);
  - duplo clique, Ctrl+1 / 1 e seleção em caixa sem coletores funcionam.
- **Fim de partida e desempenho**: tela de vitória ou derrota com estatísticas e "Jogar de novo" (`n2-final.png`), 60 fps estáveis e nenhum erro de console.
