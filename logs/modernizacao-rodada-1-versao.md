# Modernização, rodada 1: versão congelada

- Data: 2026-10-31 16:20 UTC
- Cópia entregue aos críticos: jogo sem docs/ e sem logs/, mais a versão aprovada anterior para comparação
- Arquivos: index.html, README.md, src/ (23 arquivos), tests/fumaca.js, tests/partida.js

## O que mudou desde a versão aprovada

Gráficos: terreno pintado com relevo, luz e sombra; bordas orgânicas; cristais facetados que cintilam; prédios e
unidades em sprites com volume, sombras e partes animadas; partículas de fogo, fumaça, faíscas e poeira; rastros;
marcas de esteira; tremor de tela; vinheta; interface com painéis de vidro e fonte sem serifa; zoom pela roda do mouse;
qualidade automática.

Som: compressor, reverb gerado, estéreo pela posição, volume que cai fora da tela, variação de altura, limite de vozes,
música gerada (N liga/desliga), locutor com "Harvester deployed" (voz do navegador, ou sintetizador de formantes
próprio quando não há voz) e avisos falados em português quando há voz em português.

## Testes no momento do congelamento

- tests/fumaca.js: tudo certo (61 fps com 82 unidades; locutor anunciou "Harvester deployed")
- tests/partida.js: tudo certo
- Simulação idêntica à versão aprovada em 4 partidas de 15 min com as mesmas sementes
