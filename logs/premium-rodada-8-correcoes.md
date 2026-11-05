# Premium, rodada 8: correções aplicadas

Base: `premium-rodada-8-arte.md`, `premium-rodada-8-efeitos.md` e o relatório de jogo da rodada 8, quando chegar.

## Erro de iluminação (a maior mudança visual desde a rodada 1)
Os críticos apontavam pedras "lilás", árvores "cinza-sálvia" e casco azul "lavado" que não mudavam, mesmo depois de trocar as cores.

A investigação mostrou a causa:
- a projeção oblíqua inverte a orientação da tela;
- por isso, `gl_FrontFacing` invertia a normal de muitas faces visíveis;
- essas superfícies recebiam só céu e borda, sem sol.

A correção foi fazer a normal visível sempre apontar para a câmera (`if (dot(N, V) < 0.0) N = -N`).

Resultado:
- pedras em ocre;
- copas verdes com volume;
- prédios e unidades com luz de sol de verdade.

## Arte
- **Gradação:**
  - curva em S mais forte (0,5);
  - pé da curva mais baixo (pretos mais densos);
  - exposição 1,06;
  - vinheta 0,6.
- **Azul do time:** mais escuro (`#2a4ea8`).
- **Pontos de cascalho e seixos:** em marrom quente, não em cinza.
- **Concreto das lajes:** mais escuro (`#968a78`), para não se fundir com o planalto agora iluminado.
- **Pedras pequenas:** sombra mínima garantida (o mapa de sombra é grosso demais para elas) e sem sujeira escura de base.
- **Objetos pequenos:** recebem um empurrão extra no teste de sombra e não se sombreiam por inteiro.

## Efeitos
- **Exposição dinâmica:** cai até cerca de 25% durante o clarão e volta com ele.
- **Clarão:** menor (0,45 s), com núcleo branco mais fraco no fogo novo.
- **Espuma na água:** cerca de 40% do tamanho anterior, e dura 1,6 s.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam.

## Pendente, sem correção nesta rodada
Com três Chromium sem GPU abertos ao mesmo tempo, o Premium pode falhar com `framebuffer incompleto` e mostrar tela preta. Na prática é um limite do renderizador por software, mas o ideal seria voltar sozinho para o Clássico com um aviso.
