# Premium, rodada 6: correções aplicadas

Base: `premium-rodada-6-arte.md` e `premium-rodada-6-efeitos.md`, mais as correções de jogo da rodada 5 (ver o fim de `premium-rodada-5-correcoes.md`).

## Arte
- **Casco sem tom lavanda:** o blindado agora é `#55534e`, com metal 0,15 (antes 0,35), e reflete menos o céu azul. A luz rebatida quente da rodada 5 compensa.
- **Infantaria:**
  - escala 1,55 com o esquadrão mais aberto;
  - o soldado ganhou fuzil longo e mochila de rádio com antena;
  - o foguete ganhou um lança-foguetes grosso de ombro com ogiva laranja, e por isso os dois se distinguem de cima.
- **Props entre prédios:** os prédios grandes ganharam poste de luz aceso e pilha de contêiner com tambores na laje.
- **Halo dourado do capim:** a faixa "seca" entre terra e capim ficou perto da cor da terra.
- **Clarão da explosão:** menor, mais laranja e com cerca de metade da intensidade, sem o disco branco estourado.

## Efeitos
- **Fogo:**
  - a fuligem vem de manchas largas de ruído por dentro da chama, sem o contorno preto em volta das bolhas;
  - o ganho caiu para 1,8 e o alfa subiu, e aparecem vermelho e marrom.
- **Chamas no chão:** chamas menores e mais numerosas, sem as bolhas laranja chapadas.
- **Luz da explosão:** vida de 0,24 s (antes 0,5 s), sem lavar a tela.
- **Explosão na água:**
  - sem destroços nem explosões secundárias;
  - espuma com máscara suave, sem buracos.
- **Traçantes:** mais largos (3,2 a 3,6).
- **Água:**
  - ondas em leque largo, com comprimentos de 160 a cerca de 27 px;
  - ruído em 3 oitavas com eixos girados;
  - coeficiente de profundidade de 0,025, e o gradiente do raso ao fundo aparece;
  - sem a "cortina" de listras.
- **Cristais:**
  - paleta por aglomerado (verde-água, ciano, azul, menta);
  - tamanho ±40%;
  - veio de núcleo interno claro.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam.
