# Rodada 1: versão congelada

- Data: 2026-10-31 03:11 UTC
- Cópia entregue aos críticos: /home/claude/criticos/rodada-1/jogo (sem docs/, sem logs/)
- Arquivos: index.html, README.md, src/ (18 arquivos, 4235 linhas), tests/fumaca.js, tests/partida.js

## O que esta versão entrega

- Etapas 1 e 2: mapa gerado com semente, câmera, seleção, movimento com A*, combate com projéteis
- Etapa 3: cristal por tile que se esgota, coletor automático, créditos
- Etapa 4: seis prédios (Usina, Refinaria, Quartel, Fábrica, Radar, Torre) além da Central, só no planalto, painel lateral com fantasma verde/vermelho
- Etapa 5: filas de produção, ponto de encontro, energia
- Etapa 6: IA que colhe, constrói, defende e ataca em ondas; vitória e derrota
- Etapa 7: névoa de guerra
- Etapa 8: sons gerados, título com batalha de demonstração, pausa com ajuda, tela de fim com estatísticas, três facções, três dificuldades, grupos de controle, atacar-movendo, reparar e vender

## Testes no momento do congelamento

- tests/fumaca.js: 28 verificações, todas passando, ~61 fps com 90 unidades em batalha
- tests/partida.js: IA contra IA termina em ~8 min; jogador parado é destruído aos ~6 min (normal)
