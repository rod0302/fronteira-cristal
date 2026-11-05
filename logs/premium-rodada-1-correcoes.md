# Premium — correções após a rodada 1

Notas da rodada 1: arte 5/4/5/6/4 · efeitos 4/4/4/3/5/4,5 · jogo 5/8/4/6.

Feito:
- **Modo Leve em tela grande**: a camada da interface (`uiCanvas`) ganhou `z-index:2` (estava escondida sob o `#game`). Teste novo em `tests/fumaca.js`.
- **Sem placa de vídeo, o padrão é o Clássico** (Premium continua no botão Gráficos / F9). Com GPU, o padrão é o Premium.
- **Cores de time**: versões puras para o 3D (azul `#1f5fff`, vermelho `#e3121b`, âmbar `#f29a00`); tetos dos prédios com manta na cor do time; galpão do quartel e telhado da fábrica na cor do time; capacete da infantaria colorido.
- **Infantaria 35% maior** no Premium (alturas de tiro e barra de vida acompanham).
- **Planalto cinza de novo** (pedra cinza com pouca areia), com lábio claro e friso escuro na borda: dá para ver onde se constrói, e o texto "planalto cinza" volta a valer.
- **Explosões em fases**: clarão menor e curto, bola de fogo que cresce e desacelera e dura ~1 s, 1 a 4 explosões secundárias, fogo vira fuligem mais tarde, anel de poeira com ruído (não aparece na água).
- **Fumaça**: base mais clara, luz envolvente, densidade corroída por ruído com o tempo (fiapos), coluna sobe mais e é levada pelo vento conforme a altura; o sprite quase não é mais puxado para a frente da câmera.
- **Bug de partículas** (antes da rodada): o tipo da partícula era comparado com `==` depois de interpolado; em alguns drivers 3.0 vira 2.9999 e a fumaça saía como brilho de cristal. Agora arredonda.
- **Névoa de guerra**: o nunca visto vira um teto de nuvens baixas animadas com topo iluminado; borda em fiapos (consulta torcida por ruído); lembrança mais fria e escura.
- **Água**: reflexo das paredes do cânion (busca para o norte o ponto da parede que, com esta câmera, cai refletido ali), ondulação mais forte, faixa rasa turquesa com cáusticas, espuma quebrada que se move.
- **Cristais**: brilho concentrado nas pontas (passa do limiar do bloom), cintilar colorido e mais fraco.
- **Resolução dinâmica** com piso de 0,7 px de imagem por px de tela.
- **Título**: faixa escura atrás do menu no Premium; ajuda cita F9.
- **Clique**: faixa de cima dos prédios altos agora responde (fator 0,8 → 1,05).
- Paleta do solo puxada para oliva/ocre.
