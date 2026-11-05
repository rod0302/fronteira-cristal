# Rodada 3: correções

Notas da rodada: jogabilidade e clareza 7,5 · bugs e robustez 8,0 · IA e equilíbrio 6,5.
Rodada 2: 7,0 · 7,5 · 6,0. As três notas subiram de novo.
Foi a última rodada permitida pelas regras (máximo 3). As correções abaixo foram feitas e testadas por mim, mas nenhum crítico as avaliou.

## IA e equilíbrio

| Problema | O que foi feito |
|---|---|
| A IA Fácil nunca fecha a partida: estoca 60 unidades em casa (IA 1) | Fácil: ondas até 12 (eram 9) e, com exército grande em casa, a onda leva até 40% dele. Uma onda atrasada já saía com o que tinha. |
| Salto de Normal para Difícil íngreme: a referência vence o Difícil 0 de 45 (IA 2) | Difícil: renda 1,1, produção 1,0, primeira onda aos 300 s, intervalo de 160 s, ondas até 20, 30% em casa. Bot "economia" agora vence o Difícil em 14 min com uma facção e empata com outra; blindados e misto ainda perdem. |
| Âmbar virou a facção fraca: 36 de 96 (IA 3) | Desconto nas unidades de 7% para 10%. IA contra IA, todas as combinações, 3 mapas, 2 sementes: Cobalto 10, Brasa 11, Âmbar 14 vitórias em 24, 1 empate. |
| Soldados vencem blindados; batedor não caça coletor (IA 4) | Bala contra blindagem pesada de 0,2 para 0,15. Batedor por 250 com 160 de vida. Coletor passa a ter blindagem leve, então bala e batedor o machucam de verdade (e as incursões da IA passam a valer). |
| Mapas 1 e 2 sem cristal perto da base no meio da partida (IA 5) | Cristal a até 18 tiles de cada base vale 650 por tile. Perto de cada base agora há 82 mil (mapa 0), 26 mil (mapa 1, eram 14 mil) e 30 mil (mapa 2, eram 18 mil). Os mapas continuam simétricos e conectados. |
| Normal virava trincheira: 30 de 32 unidades da IA em casa (jogabilidade 1) | Normal: 20% em casa (eram 30%), a onda leva até 75% de quem está em casa, renda 0,95. |

## Bugs e robustez

| Problema | O que foi feito |
|---|---|
| IA sem coletores e sem créditos trava para sempre (bugs 1) | Ter refinaria sem coletor e sem dinheiro para um conta como "sem renda": depois de 10 s a IA vende um prédio dispensável. A última Fábrica nunca é vendida nesse caso, porque é ela que faz coletores. |
| Ataque forçado persegue o alvo dentro da névoa (bugs 2) | Quando o alvo de uma ordem direta some na névoa, a unidade vai até onde ele foi visto por último e para. |
| Unidades tremendo perto de destino lotado; ponto de encontro da IA dentro da base (bugs 3) | Atacar-movendo dá a viagem por encerrada a até 2,5 tiles do destino ou depois de 3 tentativas. O ponto de encontro da IA foi para 32% do caminho até o centro (era 22%), fora da base. |
| Prédios do jogador fecham a porta do Quartel ou da Fábrica (bugs 4) | Não dá para construir em cima do tile da porta de Quartel, Fábrica ou Refinaria: "Bloquearia a porta de Fábrica". |
| 640x400: botões da tela de fim fora da tela (bugs 5) | Título e tela de fim em modo compacto. Em telas baixas os dois botões ficam lado a lado. |
| Refinaria no limite de unidades cobra e não dá coletor, sem avisar | Aviso: "Limite de unidades: a Refinaria veio sem o Coletor grátis". |
| Prédio inimigo vendido some na hora mesmo sob a névoa | Continua desenhado até o jogador voltar a ver o lugar, como o destruído. |
| Ctrl+número sem seleção apaga o grupo | Sem seleção, o grupo fica como estava. |
| Radar só mostrava inimigos já à vista | Com Radar funcionando, todas as unidades inimigas aparecem no minimapa, como o texto do Radar promete. |

## Jogabilidade e clareza

| Problema | O que foi feito |
|---|---|
| O Objetivo manda atacar cedo demais, sem dizer com o quê (jogabilidade 2) | O Objetivo conta o exército: "Monte um exército misto (Blindados e Foguetes, uns Soldados): 7/15. Até lá, defenda perto das Torres." Só com 15 unidades armadas ele manda atacar com A + clique. |
| Unidades atacadas fora da tela não avisam (jogabilidade 5) | "Unidades sob ataque! (Espaço: ir até lá)" quando a unidade está fora da tela, com o mesmo intervalo dos outros alertas. |
| "Radar parada", "Quartel parada" | Concordância pelo gênero do prédio. |
| Com energia baixa, o Objetivo pedia Coletor | Energia insuficiente passa na frente de tudo depois da primeira Usina. |
| Cristal do mapa inteiro acaba sem aviso | Aviso uma vez: "O cristal do mapa acabou: a renda parou." |
| "Produzindo…" cortado no painel | Texto curto: "Fila: Blindado +2". |

## Recusados ou adiados

- **Interface que cresce em telas grandes** (jogabilidade 4, pela segunda rodada). Adiado de novo, pelo mesmo motivo: pede refazer o layout do painel. Está no ROADMAP.
- **Nível "Brutal" com o Difícil antigo** (IA 2). Não criado. Preferi três níveis bem separados a quatro.
- **IA construindo refinaria encadeada rumo ao próximo campo** (IA 5). Não feito. Aumentei o cristal perto das bases para que isso só pese em partidas longas.
- **Produção parada sem créditos em 22% a 36% da partida** (jogabilidade 3). Mantido. É o ritmo da economia; a tela agora explica e o Objetivo ensina a crescer a renda.
- **640x400: painel de informações não cabe** (bugs 5, parte). Abaixo de ~440 px de altura o painel some. V/Delete vendem, R repara, A e S dão as ordens pelo teclado.

## Medições depois das correções

Bots de estratégia (facções 0 e 2):

| Estratégia | Fácil | Normal | Difícil |
|---|---|---|---|
| blindados | vitória 6–7 min | derrota 13 min | derrota 12 min |
| misto | vitória 11–14 min | derrota 10–13 min | derrota 10–12 min |
| economia | vitória 12 min | vitória 12–19 min | vitória 14 min / empate |
| novato | derrota 17 min | derrota 10 min | derrota 9 min |
| torres | empate 25 min | derrota 13 min | derrota 12 min |

Testes: `tests/fumaca.js` tudo certo (~61 fps com 80 unidades); `tests/partida.js` IA contra IA com vencedor aos 22 min, jogador parado destruído aos 7 min, nenhum erro.
