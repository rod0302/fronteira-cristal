# Rodada 3: versão congelada

- Data: 2026-10-31 05:25 UTC
- Cópia entregue aos críticos: /home/claude/criticos/rodada-3/jogo (sem docs/, sem logs/)
- Arquivos: index.html, README.md, src/ (18 arquivos, 4803 linhas), tests/fumaca.js, tests/partida.js

## O que mudou desde a rodada 2

Todas as correções de `rodada-2-correcoes.md`: grupo anda junto, botões Atacar/Parar, Objetivo que ensina economia,
avisos de produção parada e de cristal distante, informação de inimigo clicado, Difícil recalibrado, Âmbar com desconto só em unidades,
números de dano, visão do obuseiro, guarda da IA fica em casa, IA sai da trava econômica, torres não estendem a construção,
coletor busca cristal no mapa inteiro, painel bloqueado na pausa, avisos param na pausa, nitidez em retina,
venda por tecla, título compacto em telas baixas, névoa que lembra prédios.

## Testes no momento do congelamento

- tests/fumaca.js: tudo certo
- tests/partida.js: IA contra IA com vencedor aos 51 min; jogador parado destruído aos 7 min
