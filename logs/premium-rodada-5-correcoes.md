# Premium, rodada 5: correções aplicadas

Base: relatórios `premium-rodada-5-arte.md` e `premium-rodada-5-efeitos.md`.

## Arte
- **Barras verticais de clarão:** traçantes encurtados (comprimento 0,35 da velocidade da bala, 0,4 do obus), mais largos e com núcleo branco.
- **Infantaria:** cada unidade virou um esquadrão de 3 soldados (escala 1,3 cada), com passos defasados e capacete na cor do time.
- **Azul do time:** albedo `#2f5fd0`. A cor do time ficou nas faixas; o casco é grafite.
- **Prédios ancorados:**
  - laje com rampa larga e chanfrada em concreto quente (`#b4a48a` / `#7e705c`);
  - trilhas de terra batida com sulcos de roda ligando cada prédio ao vizinho mais perto do QG (decal tipo 9);
  - a luz ciano da Refinaria ficou menor e mais fraca, para não desenhar um quadrado na laje.
- **Telhados:**
  - a faixa do time cobre 16% do telhado (antes, 32%);
  - o galpão do Quartel e o dente central da Fábrica agora são de chapa metálica, com só um filete pintado;
  - filete emissivo na cor do time na mureta sul.
- **Terreno:**
  - cascalho do planalto e grãos da planície agrupados em manchas (antes, pontilhado uniforme);
  - capim mais oliva e menos limão;
  - estratos do cânion com mais ruído e só nas encostas íngremes.
- **Vegetação e pedras:**
  - nova árvore de copa irregular em 5 lóbulos, com tamanhos de 0,7 a 1,3;
  - folhas mais claras;
  - pedras menores e em tons quentes (antes, lilás).
- **Sombras:**
  - luz rebatida quente (5,5% do sol) em todo material;
  - a sombra no chão não passa de 80% de escuridão;
  - as sombras das árvores deixaram de ser pretas.
- **Pós-processamento:** nitidez leve estilo CAS na composição. O tilt-shift já só existia na tela de título.

## Efeitos
- **Fogo:**
  - dois ruídos turbulentos em sentidos opostos multiplicam a densidade;
  - o calor vem da densidade: miolo amarelo-branco, borda vermelho-escura;
  - a borda vira fuligem na segunda metade da vida;
  - a bola grande dura 1,3 a 1,9 s.
- **Chamas no chão:** chamas baixas continuam queimando por 2 a 3 s depois de explosões grandes.
- **Cratera:** decal de chão queimado que dura 30 s, com brasa na borda que esfria em 3,5 s.
- **Explosão na água:** sem fogo e sem fumaça. Tem coluna de vapor, 3 anéis de onda brancos e espuma por 4 s.
- **Clarão de cano:** dura no mínimo cerca de 2 quadros (0,09 a 0,1 s).
- **Água:** 7 ondas direcionais com o mesmo vento (derivada analítica) mais ruído fino. Substituem o ruído com cara de lixa.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam. A simulação no Premium é idêntica à do Clássico.

## Jogo (relatório `premium-rodada-5-jogo.md`, chegou depois das capturas da rodada 6)
- **Seleção:**
  - o anel verde ficou menor (raio do modelo + 5) e com metade da intensidade, o que acaba com o véu de brilho sobre a unidade;
  - o anel do time continua por baixo também quando a unidade está selecionada.
- **Âmbar:** o time agora é `#ffc21a` (amarelo-âmbar), separado do vermelho e da areia laranja. O anel do time ficou mais forte (0,45).
- **Posicionamento:**
  - as casas válidas só têm contorno, sem preenchimento verde por cima do holograma 3D;
  - as bloqueadas têm um véu vermelho leve, e o prédio que atrapalha continua visível;
  - o véu da área construível ficou 4x mais fraco.
- **Clique:**
  - vale a unidade mais perto em relação ao próprio tamanho;
  - o raio da infantaria acompanha o esquadrão (x1,6);
  - "o da frente" só desempata.
- **Planalto:** com menos areia acumulada, o planalto fica mais cinza (o tutorial fala em "planalto cinza").
- **Torre:** a sombra de contato agora é redonda (o quadrado escuro lia como buraco).
