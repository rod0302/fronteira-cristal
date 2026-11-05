# Rodada 2: correções

Notas da rodada: jogabilidade e clareza 7,0 · bugs e robustez 7,5 · IA e equilíbrio 6,0.
Rodada 1: 6,5 · 6,5 · 4. As três notas subiram.
Nenhum crítico achou problema que bloqueie a partida. Corrigi do mais grave para o menos grave.

## IA e equilíbrio

| Problema | O que foi feito |
|---|---|
| Difícil é um muro: 0 vitórias em 285 partidas (IA 1) | Difícil refeito: renda 1,2 (era 1,4), produção 1,1 (era 1,3), primeira onda aos 270 s, ondas de 7 crescendo 2. Com os bots do crítico da rodada 1, a estratégia economia vence o Difícil (22 min) e empata; blindados e misto ainda perdem. |
| Quem ataca prédio fica travado e morre sem revidar (IA 2) | A unidade que bate num prédio por conta própria troca de alvo para a unidade armada inimiga mais perto (verificado a cada 10 passos) e revida quem atirar nela. Ordem direta do jogador num prédio continua valendo. |
| Âmbar domina pela economia (IA 3) | Desconto só nas unidades, 7%. IA contra IA, todas as combinações, 3 mapas: Cobalto 13/24, Brasa 11/24, Âmbar 9/24, 3 empates em 36. |
| Soldados vencem blindados; batedor não caça soldado (IA 4) | Bala contra blindagem pesada de 0,3 para 0,2. Canhão contra infantaria de 0,45 para 0,6. Batedor com dano 14 (era 11). |
| Obuseiro do jogador cego por causa da névoa (IA 5) | Visão do obuseiro de 5 para 8: ele enxerga até onde atira. |
| Guarda da IA vai junto com a onda (IA 5) | O alarme de defesa só dispara quando o ataque acontece a até 22 tiles da base da IA. |
| IA sem refinaria espera dinheiro para sempre (IA 5) | Uma refinaria em obra mas parada por falta de dinheiro também conta como "sem dinheiro": depois de 10 s a IA vende um prédio dispensável. |
| Torres rendem demais e dá para encadear torres até a base inimiga (detalhes) | Torre com 800 de vida (era 900). Torres não estendem mais a área de construção. |
| Partidas IA contra IA empatadas por exército parado | Uma onda atrasada mais de um intervalo sai com o que tiver (no mínimo 4). No Normal e no Difícil a onda leva até 60% de quem está em casa. Empates em 45 min caíram de 12/36 para 3/36. |

## Bugs e robustez

| Problema | O que foi feito |
|---|---|
| Coletores param para sempre com cristal alcançável longe (bugs 1) | Quando a busca local não acha cristal, o coletor procura o tile de cristal livre mais próximo no mapa inteiro. |
| Pausa e tela de fim não bloqueiam o painel (bugs 2) | Pausado ou no fim, construir, produzir, reparar, vender e as ordens do painel não respondem. |
| Alertas somem durante a pausa (bugs 3) | Os avisos usam um relógio que para na pausa. |
| Tela borrada em retina (bugs 4) | O canvas usa a resolução física (`devicePixelRatio`) e o desenho continua em px CSS. Reajusta se a janela mudar de monitor. |
| Telas baixas: sem Vender, JOGAR fora da tela em 640x400 (bugs 5) | Teclas V ou Delete vendem o prédio selecionado (com confirmação). O painel de informações recorta o conteúdo na borda. O título tem modo compacto abaixo de 520 px: JOGAR fica em y=300 a 640x400. |
| A Refinaria fura o limite de unidades | Não dá o Coletor grátis quando o time está no limite. |
| Prédio PRONTO preso sem Central; `posicionar` diz sucesso quando falha | Sem Central, a obra (mesmo pronta) é cancelada e o dinheiro volta, com aviso. `posicionar` devolve o motivo quando falha. |
| Prédio inimigo lembrado mostra vida e fogo ao vivo e some quando destruído fora da visão | Fora da visão, ele aparece com a vida da última vez em que foi visto. Destruído fora da visão, continua desenhado (no mapa e no minimapa) até o jogador voltar a ver o lugar. |

## Jogabilidade e clareza

| Problema | O que foi feito |
|---|---|
| O Objetivo leva à derrota no Normal: para de falar de economia em 2 coletores (jogabilidade 1) | Depois da Fábrica, o Objetivo pede a 2ª Refinaria e 4 Coletores antes de "Monte um exército". O último passo ensina a atacar com A + clique. |
| Começo travado por falta de dinheiro sem aviso (jogabilidade 2) | O botão parado mostra "sem ◆" em vez da porcentagem. A dica diz "Parado: sem créditos". O Objetivo diz "Fábrica parada: sem créditos". Um aviso, no máximo a cada minuto, sugere mais Coletores e Refinarias. |
| O exército não anda junto (jogabilidade 3) | Grupo com ordem de mover ou atacar-movendo anda na velocidade da unidade mais lenta. Quem acha um alvo persegue na velocidade normal. Vale também para as ondas da IA. |
| Atacar-movendo e parar só no teclado (jogabilidade 4) | Com unidades selecionadas, o painel mostra os botões "Atacar (A)" e "Parar (S)". |
| Interface em telas de vários tamanhos (jogabilidade 5) | O cadeado foi para a linha do preço e não cobre mais o nome. "Botão direito no mapa: encontro" virou a linha de informação da Fábrica e do Quartel e não é mais cortado. O painel recorta o que não cabe. |
| O mesmo passo três vezes na tela (jogabilidade 6) | A linha de Objetivo do topo só aparece quando o painel está ocupado com uma seleção. A mensagem inicial "Comandante, construa uma Usina" saiu. |
| Objetivo não percebe a obra em andamento (jogabilidade 7) | Mostra "Fábrica em construção (11%)". |
| A dica da coluna UNIDADES cobre a coluna PRÉDIOS (jogabilidade 8) | Dicas do painel aparecem à esquerda dele, sobre o mapa. |
| Cristal perto da base acaba sem aviso (jogabilidade 9) | Aviso, no máximo a cada 2 min: quando o coletor vai buscar cristal a mais de 18 tiles da refinaria, o jogo sugere uma refinaria perto de outro campo. |
| Clicar num inimigo não mostra nada (jogabilidade 10) | Mostra nome, vida, facção e descrição do inimigo no painel. |

## Recusados ou adiados

- **Interface que cresce em telas grandes** (jogabilidade 5, parte). Adiado. Em 1920x1080 o texto continua com 11 px e o painel com 220 px. Escalar a interface inteira pede refazer o layout do painel, e não quis arriscar a robustez a esta altura. A nitidez em retina foi resolvida.
- **Unidade nova nasce fora de um anel de torres** (bugs, detalhe). Mantido. A unidade sai pela vaga livre mais próxima da porta, e cercar a própria fábrica é escolha do jogador.
- **Engasgo de 40 a 190 ms ao dar ordem a 50+ unidades** (bugs, detalhe). Medi 44 ms para 55 unidades numa ordem de canto a canto (um A* por unidade). É um quadro isolado, e deixei como está.
- **Incursões de batedores raras** (IA, detalhe). Mantido. A incursão depende de a IA ter 2 batedores em casa. Ela produz poucos de propósito, porque batedor perde para Foguete e blindado.
- **Fácil nunca rompe uma defesa de torres** (IA, detalhe). Mantido. No Fácil a IA não usa obuseiros, de propósito, e empatar se defendendo no Fácil é aceitável.
- **Partida IA contra IA de força igual pode passar de 40 min.** O teste `tests/partida.js` agora espera até 70 min. Na execução de referência terminou aos 51 min.

## Testes

- `tests/fumaca.js`: tudo certo, ~61 fps com 80 unidades.
- `tests/partida.js`: IA contra IA com vencedor (51 min, mapa 0, semente 0); jogador parado destruído aos 7 min.
