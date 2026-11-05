# Premium, rodada 9: correções aplicadas

Base: `premium-rodada-9-arte.md` e `premium-rodada-9-efeitos.md`.

## Arte: calibração depois da nova luz
- **Saturação:** o reforço global de 1,12 caiu para 0,98. Em `05`, a saturação média foi de 0,55 para 0,49.
- **Telhado e chão separados:**
  - chapa do telhado em `#4f4d49`, com metal 0,25 (refletia o horizonte claro);
  - concreto em `#8a7f6e`;
  - telhado da Fábrica em (146,128,103), contra (235,221,200) no chão.
- **Poeira nas faces de cima:** caiu de 0,22 para 0,1.
- **Cristais:** brilho e cintilação menores (sem "sóis" de bloom de 30 px).

## Efeitos
- **Onda de choque:** entra suave em 0,06 s, com borda mais macia e mais fraca. Era a "bolha de vidro" do primeiro décimo de segundo.
- **Fumaça recém-nascida:** o brilho laranja aparece só no miolo e a 1/3 da força (sem as bolhas bege na base do fogo).
- **Fuligem:** limiar mais baixo (0,35 a 0,6), então aparece de fato.
- **Clarão de cano:** menor (6 e 3), com mais peso nos riscos em estrela.
- **Traçantes de bala:** 0,65 da velocidade, com 35 px ou mais.
- **Destroços:** cerca de metade nos impactos pequenos.

## Robustez
Se o WebGL falhar no meio do jogo (por exemplo, `framebuffer incompleto` por falta de memória de vídeo), o jogo desliga o Premium e volta para o Clássico com o aviso "Gráficos Premium indisponíveis". A tela não fica mais preta.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam.

## Jogo (relatório `premium-rodada-8-jogo.md`)
- **Holograma:** a cor ficou abaixo do limiar do bloom e a borda Fresnel mais fraca. A forma do prédio aparece, em vez de uma laje branco-ciano estourada.
- **Perda do WebGL:**
  - no meio do jogo, volta sozinho para o Clássico com aviso (ver "Robustez");
  - na inicialização, o erro já fazia o jogo cair no Clássico.
- **Pátio do planalto:** pedra 22% mais escura, com mediana de luminância de 190 para 174 em `03-base-perto`. As lajes dos prédios se destacam do chão (pedido da rodada 10 de arte).
