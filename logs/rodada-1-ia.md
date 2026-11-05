# Rodada 1: crítica de IA e equilíbrio

**Nota: 4/10**

A IA pressiona bem um jogador parado ou lento: ele morre entre 5 e 7 minutos. Mas qualquer push simples de blindados vence a IA no difícil em 5 a 7 minutos, e a IA nem chega perto da base do jogador. Três coisas tiram a graça da partida: o mapa favorece o canto do jogador, o dinheiro sobra demais e o blindado não tem contra.

Scripts em `/home/claude/criticos/rodada-1/ia/`, todos com Playwright e `window.__jogo`, simulando com `avancar(1)` e o bot decidindo 1 vez por segundo:
- `bot.js`: bot do jogador e métricas da IA (ondas, contato, economia por minuto).
- `estrategias.js`: as estratégias de jogador.
- `lote.js`: estratégia × dificuldade × facção, até 25 min. Saída em `lote1.txt` e `resultados-*.json`.
- `iaxia.js` e `matriz.js`: IA contra IA com a facção de cada lado escolhida.
- `colheita.js`: cristal e ciclo de colheita de cada base.
- `duelos.js`: combates de mesmo custo em campo aberto.
- `reconstrucao.js`: a IA reconstrói?
- `defesa.js`: a IA defende a base?
- `capturas.js`: capturas de tela.

Capturas em `/mnt/project-files/rts/logs/capturas/rodada-1-ia/`.

O jogo é determinístico (semente fixa do mapa e da IA). Cada combinação estratégia × dificuldade × facção dá um único resultado. Por isso a "taxa de vitória" abaixo conta as 3 facções.

## Tabela de resultados (jogador-bot contra a IA, 3 facções por célula)

| Estratégia do jogador | Fácil | Normal | Difícil |
|---|---|---|---|
| parado (não faz nada) | 0/3, morre aos 7 min | 0/3, 6 min | 0/3, 5 min |
| rushInicial (exército inicial + soldados desde t=0) | 0/3 | 0/3 | 0/3 |
| rushSoldados (2 quartéis, ataca com 12) | 0/3 | 0/3 | 0/3 |
| **blindados** (usina, refinaria, fábrica; só blindado; ataca com 8) | **3/3, 4–5 min** | **3/3, 5–6 min** | **3/3, 5–7 min** |
| blindados atacando com 3, 4, 5, 6, 10 ou 14 | – | – | **18/18**, 6–11 min |
| obuseiros só | 3/3 | 1/3 | 0/3 |
| batedores só | 1/3 | 0/3 | 0/3 |
| misto (blindado, obuseiro, batedor, soldado; ataca com 14) | 3/3 | 3/3 | 3/3 |
| economia (3 refinarias, 6 coletores, 1 ataque aos 10 min) | 3/3, 11 min | 3/3, 11 min | 3/3, 12 min |
| torres (só torres, nunca ataca) | empate em 25 min | empate em 25 min | 0/3 |
| novato (decide a cada 20 s, nunca ataca) | 0/3, 14–18 min | 0/3, 8–13 min | 0/3, 6–8 min |

Tempo até o primeiro ataque da IA: fácil 361 s, normal 281 s, difícil 211 s. É sempre o mesmo segundo em toda partida. Primeira onda: 15 a 17 unidades, das quais 11 são soldados (ex.: normal: 3 blindados, 2 batedores, 11 soldados). Ondas seguintes: 9 a 30 unidades.

Na estratégia blindados, a IA nunca chegou a 18 tiles da Central do jogador (`contato null` nas 9 partidas).

## Problemas, do mais grave ao menos grave

### Bloqueia a partida (tira o sentido do jogo)

**1. O mapa favorece o jogador: a base da IA tem metade do cristal e colhe na metade do ritmo.**
- Script: `node colheita.js`.
- Cristal a até 20 tiles da base:
  - jogador (canto superior esquerdo): 56.632 em 132 tiles;
  - IA: 27.963 em 71 tiles.
- Com IA nos dois lados, descargas nos primeiros 240 s: time 0 = 13, time 1 = 7.
- A porta da Refinaria fica sempre embaixo. Na base da IA ela aponta para a borda do mapa, enquanto os campos dela ficam acima e à esquerda (captura `05-iaxia-4min-base-time1.png`, comparar com a `04`).
- IA contra IA (`node matriz.js`): o time 0 venceu **27 de 27** partidas (3 dificuldades × 9 pares de facção), entre 6 e 14 min.
- `node iaxia.js normal 0 0`, cristal colhido aos 5 min: 14.612 contra 8.400.
- Consequência: no normal a IA colhe cerca de 0,43× o que colhe um jogador com 4 a 5 coletores. No difícil, mesmo com o bônus de 1,35×, fica em 0,70–0,86× (min 8, estratégias economia e misto). No fácil, 0,24×.
- **Correção:** gerar o mapa com simetria de ponto, `tile(x,y) = tile(79−x, 79−y)`, ou seja, gerar metade e espelhar. Pôr a porta da Refinaria no lado voltado para o centro do mapa. Critério de aceite: IA contra IA com a mesma facção perto de 50%.

**2. Um push de blindados vence a IA no difícil em 5 a 7 min, sem micro.**
- Comando: `node lote.js blindados,blindados3,blindados4,blindados5,blindados6,blindados10,blindados14 dificil`.
- Resultado: **27/27 vitórias**. Mesmo atacando com 3 unidades desde t=0, vence em 6 a 9 min.
- Causas medidas:
  - (a) a IA gasta metade do exército em soldados, que tiram só 0,2× de dano em blindado (`aiProduce` mantém 10 soldados sempre);
  - (b) a IA só usa 1 fábrica no começo;
  - (c) o item 1.
- Captura `01-blindados-x-dificil-175s-base-ia.png`: os blindados do jogador limpam os soldados da IA no campo ao norte da base dela.

**3. O blindado não tem contra de mesmo custo.**
- Script: `node duelos.js`. Valor que sobra para o vencedor:
  - 1 blindado contra 6 soldados (600 cada lado): o blindado vence e sobra 266.
  - 6 blindados contra 36 soldados (3.600 cada lado): sobram 3 blindados (1.656).
  - 6 blindados contra 12 batedores (3.600 cada lado): sobram os 6 blindados (3.182 de 3.600).
  - 4 blindados contra 3 obuseiros (2.400 cada lado): sobram os 4 blindados.
  - 1 blindado contra 2 batedores: sobra 523 de 600.
- Batedor só serve contra soldado (2 batedores contra 6 soldados: o batedor perde). Não existe unidade antiblindado.
- **Correções sugeridas:**
  - bala contra pesado de 0,2 para 0,3;
  - preço do blindado de 600 para 700, ou vida de 400 para 340;
  - dano do batedor de 9 para 12, com cooldown de 0,45;
  - de preferência, um soldado de foguete (cerca de 150 créditos, tiro "rocket" com modificador ~1,3 contra pesado e 0,3 contra infantaria).

### Atrapalha

**4. A economia sobra demais: o dinheiro deixa de importar a partir do minuto 4.**
- 4 coletores rendem cerca de 5.600 por minuto (`economia normal`: 59.742 colhidos aos 10 min).
- Uma fábrica gasta no máximo cerca de 2.570 por minuto em blindados (600 a cada 14 s).
- Exemplos de saldo parado:
  - estratégia economia: 13.598 créditos parados aos 10 min, com 51 unidades;
  - só batedores com 1 fábrica: 22.845 parados aos 9 min.
- Um coletor (700) se paga em cerca de 30 s. Isso também anula o bônus do Consórcio Âmbar (desconto não ajuda quem tem dinheiro sobrando).
- **Correção:** colheita por coletor perto de 700 por minuto, usando `capacity` de 700 para 500, `harvestRate` de 70 para 35 e `unloadRate` de 250 para 150. Repetir o lote e mirar em 4 coletores ≈ 1 fábrica + 1 quartel produzindo sem parar.

**5. A IA não se recupera quando perde a Refinaria.**
- Script: `node reconstrucao.js`. Aos 170 s, 14 blindados criados por `criar` destroem fábrica, refinaria e quartel da IA e depois são removidos.
- Nas 3 dificuldades a IA fica com **0 créditos e não reconstrói nada em 240 s**. Os coletores não têm onde descarregar e ela trava para sempre.
- Outros pontos:
  - a IA não guarda reserva de dinheiro;
  - não vende prédios para levantar caixa;
  - não repara prédios (não há código de reparo em `ai.js`);
  - o teto de coletores é `min(refinarias×2, 4)`, então a IA nunca passa de 4.
- **Correção:**
  - prioridade máxima para reconstruir refinaria e fábrica;
  - se créditos < custo, vender torre ou quartel;
  - teto de coletores = refinarias×2 até 6;
  - terceira refinaria no plano;
  - reparar prédios abaixo de 50% quando créditos > 500.

**6. As ondas da IA levam o exército inteiro, a composição é ruim e a IA não se adapta.**
- `aiArmy` marca **todas** as unidades de casa como onda, e a base fica sem exército. Em `defesa.js` (normal, t=300 s, logo depois da onda), restava 1 unidade em casa.
- Os obuseiros vão em atacar-movendo junto com o bolo e não ficam no alcance máximo.
- A IA continua mandando ondas contra torres sem mudar nada. Em torres normal: a IA perdeu 210 unidades em 25 min, o jogador perdeu 68, e terminou empatado.
- **Correção:**
  - deixar 30% do exército em casa;
  - soldados no máximo 25% do exército;
  - chance de blindado de 0,5 para 0,65;
  - se o jogador tiver mais de 50% de blindados, produzir blindados e obuseiros;
  - obuseiro parar a 7 tiles do alvo;
  - recuar a onda quando cair abaixo de 35% do tamanho inicial.

**7. A dificuldade quase só muda o relógio.**
- Na prática, fácil, normal e difícil mudam o momento da primeira onda (361, 281 e 211 s). O tamanho das ondas é parecido (15 a 17).
- Jogador parado: morre aos 7, 6 e 5 min.
- Jogador focado: vence as três dificuldades.
- Não existe uma dificuldade que um jogador competente sinta como desafio.
- **Correção, depois de corrigir o item 1:**
  - difícil: income 1,4 e buildSpeed 1,3, com 2 fábricas antes da primeira torre e primeira onda de ≥ 6 blindados;
  - fácil: firstWave 420, soldados no máximo 6.

**8. Equilíbrio das facções.**
- Não dá para medir em IA contra IA: o item 1 domina e o time 0 vence sempre.
- Duelos de mesmo custo (`duelos.js`):
  - 8 blindados Cobalto contra 8 Brasa: Cobalto vence (sobram 3). No espelho, vence de novo (sobram 2).
  - 9 Âmbar contra 8 Brasa: Âmbar vence (sobram 4).
  - 9 Âmbar contra 8 Cobalto: Âmbar vence (sobram 2).
  - Controle com a mesma facção: empate técnico.
- **O Clã Brasa é o mais fraco.** Sugestão: `rofMul` de 0,87 para 0,82.
- O Âmbar só pesa no começo (item 4).
- O jogador não escolhe o inimigo: é sempre a facção seguinte (`(pf+1)%3`). Então Cobalto sempre enfrenta Brasa, que é o par mais fácil. Sugestão: sortear a facção inimiga ou deixar escolher.

### Detalhe

**9. Partidas sempre iguais.**
- Semente do mapa fixa (1992) e RNG da IA com semente: o mesmo mapa, a mesma ordem de construção e a primeira onda sempre no mesmo segundo. Isso tira o valor de jogar de novo.
- Sugestão:
  - semente aleatória por partida, com `?semente=` para os testes;
  - 2 ou 3 variações de `AI_PLAN`;
  - ±30 s de variação em `firstWave`.

**10. Torres.**
- 2 obuseiros destroem 3 torres sem sofrer dano, porque o alcance de 8 é maior que o de 6. É um contra válido, mas a IA nunca usa.
- Torres puras empatam no fácil e no normal (a IA não consegue quebrar) e perdem no difícil. Não é degenerado, mas o empate eterno é chato. A correção do item 6 resolve.

**11. A IA não faz incursão, não caça coletores e não usa batedor para explorar.** O alvo da onda é sempre o prédio do jogador mais perto da base da IA.

## O que está bom
- A IA defende: reage em 1 a 10 s a um ataque na base (`defesa.js`). 4 blindados morrem em 25 a 44 s contra o exército e as torres dela.
- A IA continua produzindo e mandando ondas depois de perder exércitos: em torres, 5 a 7 ondas em 25 min.
- Jogador parado ou novato perde em todas as dificuldades. Existe ameaça para quem joga mal.
- Soldado contra soldado, batedor contra soldado e obuseiro contra infantaria (3 obuseiros eliminam 24 soldados) funcionam como a descrição promete.
- Nenhum erro de JavaScript em mais de 150 partidas simuladas.

## Limitações do teste
- Os bots são simples: bolo em atacar-movendo e decisão 1 vez por segundo. Um humano faria melhor que eles.
- Por isso as vitórias contra a IA são um piso, não um teto.
- As derrotas de "obuseiros", "batedores" e "torresObus" vêm em parte de limitação do bot (atacar-movendo com artilharia, créditos parados). Não as conto como defeito do jogo.
