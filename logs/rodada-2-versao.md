# Rodada 2: versão congelada

- Data: 2026-10-31 04:18 UTC
- Cópia entregue aos críticos: /home/claude/criticos/rodada-2/jogo (sem docs/, sem logs/)
- Arquivos: index.html, README.md, src/ (18 arquivos, 4619 linhas), tests/fumaca.js, tests/partida.js

## O que mudou desde a rodada 1

Todas as correções de `rodada-1-correcoes.md`: mapas simétricos (3 mapas), Foguete, economia e preços novos,
IA reescrita (economia, recuperação, ondas com guarda em casa, recuo, incursões, duas aberturas),
dificuldades com personalidade, seletor de inimigo e de mapa, semente da IA por partida, justiça de processamento entre times,
venda com confirmação, Central não vendável, correções de névoa, painel em telas baixas, limite de unidades e muitas outras.

## Testes no momento do congelamento

- tests/fumaca.js: todas as verificações passando, ~61 fps com ~80 unidades em batalha
- tests/partida.js: IA contra IA termina com vencedor; jogador parado é destruído aos ~6 min (normal)
- 216 partidas IA contra IA (mesma facção): 97 x 115 entre os lados
