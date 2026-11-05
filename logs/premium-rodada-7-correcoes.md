# Premium, rodada 7: correções aplicadas

Base: `premium-rodada-7-arte.md`, `premium-rodada-7-efeitos.md` e `premium-rodada-7-jogo.md`.

## Arte
- **Água:**
  - a profundidade é contínua, com o raso turquesa indo até o fundo azul-petróleo;
  - a faixa ciano da margem e a espuma ficaram mais fracas;
  - o sol cintila em todo o lago.
- **Casco:** grafite mais escuro (`#454644`), e o tom do time se lê só nos painéis e no anel.
- **Vegetação e pedras:** folhagem em oliva quente e pedras em ocre (sem lilás).
- **Planalto:** pedra dessaturada e levemente fria, de modo que lê como cinza sob o sol quente (o tutorial fala em "planalto cinza").
- **Cristais:** brilho cerca de 30% menor, sem véu leitoso sobre as unidades.

## Efeitos
- **Fogo:**
  - borda suave (`pow(dens, 0.8)`);
  - veios quentes por dentro;
  - a fuligem não depende mais da densidade;
  - a chama se espalha na metade da velocidade, e a fumaça nasce junto (0,12 a 0,2 s).
- **Clarão:** menor (0,6 s do tamanho) e mais curto (0,08 s). A luz pontual tem raio `s*2+18`.
- **Água:**
  - anéis mais fracos, levemente ovais e quebrados por ruído que anda;
  - coluna de vapor vertical (subida de 110 a 240, pouco espalhamento).
- **Traçantes de bala:** com 0,5 da velocidade, ficam com 25 px ou mais.

## Jogo
- **Seleção:** o anel de unidade selecionada é branco-gelo e não se confunde com nenhum dos três times (no Âmbar, o verde virava limão).
- **Holograma:** a laje baixa fica quase transparente e aparece a forma do prédio.
- **Caixa de seleção:** no Premium também pega o corpo visível, que fica acima do chão.
- **Marcadores de ordem:** a duração é contada em tempo real.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam.
