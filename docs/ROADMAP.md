# Roadmap

Cada etapa termina com o jogo abrindo e jogável, `tests/fumaca.js` passando e este arquivo atualizado.
A cada etapa, `window.__jogo` e os testes crescem junto com o que a etapa traz.

## ✅ Etapa 1: mapa, câmera, seleção e movimento
- Mapa gerado por código com quatro terrenos e minimapa
- Câmera por teclado, borda da tela e minimapa
- Seleção por clique, caixa, Shift e duplo clique
- Movimento com A\*, formação e colisão leve entre unidades

## ✅ Etapa 2: combate
- Ataque com clique direito sobre inimigo (alcance, recarga, dano)
- Projéteis e explosões desenhados por código
- Morte de unidades; ataque automático e revide
- Cursor de mira sobre inimigo
- Passo fixo de 60 Hz, `window.__jogo` e `tests/fumaca.js`

## ✅ Etapa 3: recurso e colheita
- Cristal por tile que se esgota (desenho acompanha o que resta)
- Coletor automático: campo → refinaria → campo, com reserva de tile
- Créditos no painel; `__jogo.creditos` e teste de colheita

## ✅ Etapa 4: construção de base
- Central (inicial), Usina, Refinaria, Quartel, Fábrica, Radar, Torre
- Só no planalto, perto da base; fantasma verde/vermelho tile a tile, com motivo
- Painel lateral com botões, progresso, PRONTO, dicas; pagamento aos poucos; cancelar devolve
- Reparo e venda

## ✅ Etapa 5: produção de unidades
- Soldado, Batedor, Blindado, Obuseiro, Coletor; fila de 5 por prédio
- Ponto de encontro; energia (sem energia: produção lenta, torres lentas, radar desligado)
- Tipos de dano x blindagem

## ✅ Etapa 6: inimigo com IA
- IA colhe, constrói em ordem fixa, reconstrói, defende e ataca em ondas crescentes
- Três dificuldades; vitória e derrota com tela de estatísticas
- `tests/partida.js`: IA contra IA e jogador parado contra IA

## ✅ Etapa 7: névoa de guerra
- Preto (nunca visto) e escurecido (visto antes), bordas suaves, minimapa junto
- Raio de visão por unidade e prédio; jogador só mira no que vê

## ✅ Etapa 8: acabamento
- Sons gerados por Web Audio
- Tela de título com batalha de demonstração, pausa com ajuda, fim de partida
- Três facções originais com vantagens; grupos de controle; atacar-movendo; parar; H para a base
- Quadro de objetivo para jogador novo

## ✅ Etapa 9: modernização visual e sonora
- Terreno com relevo, luz e sombra; bordas orgânicas; cristais facetados que cintilam
- Prédios e unidades com volume, sombras e partes animadas; interface com painéis de vidro
- Partículas (fogo, fumaça, faíscas, poeira), rastros, marcas de esteira, tremor de tela
- Zoom pela roda do mouse; qualidade automática em computador lento
- Sons com reverb e estéreo, música gerada, locutor com "Harvester deployed"

## ✅ Etapa 10: modo gráfico Premium (WebGL2)
- Mundo em 3D gerado por código: terreno com mesas e cânions, água com reflexo, vegetação, cristais em 3D
- Modelos 3D de todas as unidades e prédios com materiais físicos e cor do time
- Sol com sombras suaves, nuvens, luzes dinâmicas; explosões em fases, fumaça, destroços
- Névoa de guerra como teto de nuvens; HDR, bloom, ACES, gradação, antisserrilhado, resolução dinâmica
- Três modos (Premium, Clássico, Leve) com a mesma simulação; F9 e botão Gráficos

## ✅ Etapa 11: som premium e vozes
- Banco de efeitos gravado por código (camadas, variações, loudness BS.1770), mixagem com prioridade e distância
- Locutora e tropas com vozes sintetizadas embutidas; "Harvester deployed" ao começar a colher
- Fila única de vozes com sinais, perigo na frente e ducking

## Ciclo de críticos independentes
- Rodada 1: notas 6,5 (jogabilidade), 6,5 (bugs), 4 (IA). Correções feitas (`logs/rodada-1-correcoes.md`)
- Rodada 2: notas 7,0 (jogabilidade), 7,5 (bugs), 6,0 (IA). Correções feitas (`logs/rodada-2-correcoes.md`)
- Rodada 3: notas 7,5 (jogabilidade), 8,0 (bugs), 6,5 (IA). Correções feitas (`logs/rodada-3-correcoes.md`)
- Ciclo encerrado (máximo de 3 rodadas). Resumo em `logs/RESUMO.md`

## Ciclo de críticos da modernização
- Rodada 1: gráficos 7, som 7, desempenho 7. Correções em `logs/modernizacao-rodada-1-correcoes.md`
- Rodada 2: gráficos 7, som 7, desempenho 7. Correções em `logs/modernizacao-rodada-2-correcoes.md`
- Ciclo encerrado (rodada sem melhora de nota). Resumo em `logs/RESUMO.md`

## Ciclo de críticos do Premium
- Rodada 1: arte 4,8 · efeitos 4,1 · jogo 5,8. Correções em `logs/premium-rodada-1-correcoes.md`
- Rodada 2: arte 5,4 · efeitos 5,1 · jogo 8,0. Correções em `logs/premium-rodada-2-correcoes.md`
- Rodada 3: arte 5,7 · efeitos 5,4 · jogo 8,0. Correções em `logs/premium-rodada-3-correcoes.md`
- Rodada 3: correções entregues no primeiro zip do Premium
- Segundo ciclo, a pedido do Rodrigo ("só parar quando estiver AAA"), com críticos novos a cada rodada:
  - Rodada 4: arte 6,3 · efeitos 5,5 · jogo 7,5
  - Rodada 5: arte 6,4 · efeitos 5,8 · jogo 6,9
  - Rodada 6: arte 6,7 · efeitos 6,2
  - Rodada 7: arte 6,8 · efeitos 6,4 · jogo 7,8
  - Rodada 8: arte 6,9 · efeitos 6,7 · jogo 8,3
  - Rodada 9: arte 7,3 · efeitos 6,8. Nesta rodada foi corrigida a normal invertida pela projeção oblíqua, o maior salto do ciclo
  - Rodada 10: arte 7,4 (iluminação e cor 8). Ciclo parado porque a nota geral "AAA" ficou em 7 duas rodadas seguidas
- Resumo em `logs/RESUMO.md`. Correções de cada rodada em `logs/premium-rodada-N-correcoes.md`

## Ciclo de críticos do som
- Rodada 1: efeitos 5 · voz 6 · mix 5. Correções em `logs/som-rodada-1-correcoes.md`
- Rodada 2: efeitos 5,5 · voz 6,5 · mix 5. Correções em `logs/som-rodada-2-correcoes.md`
- Rodada 3: efeitos 6 · voz 6,5 · mix 6. Correções (sem nova avaliação) em `logs/som-rodada-3-correcoes.md`
- Ciclo encerrado (máximo de 3 rodadas). Resumo em `logs/RESUMO.md` (Ciclo 4)

## O que falta (problemas conhecidos)
- Som: banco leva de 8 a 12 s para ficar pronto e ocupa ~40 MB; motores sem rotação ligada à velocidade
- Som: estalo das explosões pouco destacado; faltam passos de infantaria e voo de projéteis
- Vozes: sintéticas (sem interpretação de locutora gravada); perigos sem altura mais aguda; voicepack.js ~1,9 MB
- Premium: encostas das mesas em degraus (precisam de normais suavizadas e mais subdivisão onde a inclinação é alta)
- Premium: chão do campo de cristal ainda leitoso; água parada sem reflexo das margens bem visível
- Premium: tiroteio pouco legível no zoom 1 (traçantes curtos); fogo velho ainda vira massa laranja
- Premium: entrar no Premium pelo F9 trava a partida por cerca de 3 s (o terreno é preparado na hora), sem aviso
- Premium: 4 avisos de ReadPixels no console ao preparar o terreno
- Painel de informações some em telas com menos de 440 px de altura
- Telas grandes sem aceleração de vídeo dependem do modo leve (mapa menos nítido)
- 240 unidades derrubam o fps para ~45; terreno final aparece ~1 s depois de abrir
- IA que se expande (refinaria perto de outros campos)
- ~~Difícil ainda duro para quem não domina a economia~~ (05/11: o problema era o Normal; níveis recalibrados, ver logs/dificuldade-ajuste.md)
- Ondas do Difícil mirarem coletores e refinaria em vez do prédio mais perto
- Texto curto por nível na tela de título ("Fácil: para aprender...")
- Divisão de caminho entre unidades do mesmo grupo (ordem para 50+ unidades custa ~40 ms)

## Ideias soltas (sem etapa definida)
- Salvar e carregar partida (localStorage)
- Escala para telas de alta densidade (DPI)
