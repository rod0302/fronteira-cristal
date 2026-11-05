# Fronteira Cristal (Crystal Frontier)

> O jogo (menus, textos e vozes) é todo em inglês: na tela ele se chama **Crystal Frontier**. Esta documentação continua em português.

RTS original para navegador, no espírito dos clássicos de estratégia em tempo real do começo dos anos 90:
colher cristal, erguer a base, montar um exército e destruir o inimigo.

Feito em HTML + JavaScript puro. Sem frameworks, sem build, sem instalar nada.
Todos os gráficos são desenhados por código no canvas e todos os sons são gerados com Web Audio.
Nenhuma imagem ou gravação externa: o terreno com relevo e luz, os prédios, as unidades, as explosões,
a música e o locutor são todos feitos por código.

### Gráficos: Premium, Clássico e Leve

O jogo tem três modos gráficos. A simulação é a mesma nos três (só o desenho muda).

- **Premium** (padrão em computador com placa de vídeo): o mundo em 3D com WebGL2, tudo gerado por código.
  Terreno com mesas de arenito em camadas, cânions com lagos que refletem as paredes, árvores, pedras e capim;
  unidades e prédios modelados em 3D com materiais físicos (metal, vidro, concreto), cor do time nos tetos e cascos;
  sol com sombras suaves, sombra de nuvens passando, luzes das explosões e dos tiros iluminando o cenário;
  explosões em fases (clarão, bola de fogo, explosões secundárias, coluna de fumaça, destroços, faíscas),
  cristais que brilham, névoa de guerra como um teto de nuvens baixas; HDR, bloom, ACES, gradação de cor e
  antisserrilhado. A resolução se ajusta sozinha para manter a fluidez.
- **Clássico** (*Classic*): o desenho 2D da versão anterior (canvas). Padrão quando o navegador não tem placa de vídeo.
- **Leve** (*Lite*): o Clássico com menos enfeites, para computador fraco.

Para trocar: botão **Graphics** na tela de título ou na pausa, ou a tecla **F9** a qualquer momento.
A escolha fica guardada. Endereços: `index.html?premium`, `?classico`, `?leve`.

### Visual e som (modo Clássico)

- Terreno pintado pixel a pixel com relevo, luz do noroeste, sombras dos penhascos e bordas orgânicas.
- Prédios e unidades com volume, sombras e partes animadas (radar girando, bandeira, luzes, fumaça).
- Explosões, fogo, fumaça, faíscas, rastros de foguete, marcas de esteira e um leve tremor de tela.
- **Som premium**: todos os efeitos são "gravados" por código no começo da partida (`src/sfxbank.js`),
  em camadas e com várias variações: cada arma tem a sua voz (fuzil, metralhadora, foguete, canhão,
  torre, obuseiro com o assobio da granada chegando), explosões por tamanho (o prédio desaba em cadeia),
  impacto diferente em terra e em metal, motores que seguem as unidades na tela, fogo nos prédios
  danificados, vento e zumbido da base. Reverb de vale, eco das mesas de pedra, som que abafa com a
  distância e volume de cada som por loudness (prédio > veículo > canhão > fuzil > interface).
- **Locutora e tropas com vozes sintetizadas** e embutidas no jogo (`src/voicepack.js`): falam igual
  em qualquer navegador, sem internet e sem voz instalada. tudo em inglês: "Defense turret ready",
  "Alert! The base is under attack!", "Attention, hostiles detected", "Power plant ready", "Power running low",
  "We lost a unit", vitória, derrota e outras, cada uma com o seu sinal (sirene, sino, pulso de radar).
  **"Harvester deployed"** toca na hora em que o Coletor é entregue (sai da Refinaria ou da Fábrica); é a única fala de Coletor pronto.
  Soldados e veículos respondem ao serem selecionados e ao receberem ordens. Locutora e tropas nunca
  falam juntas, perigo passa na frente e a batalha abaixa enquanto alguém fala.
  Sem o pacote, sai a voz do navegador e, sem ela, uma voz robótica de rádio.
- Música gerada com três progressões que se alternam, baixo e percussão que entram quando a batalha esquenta.
- Em computador lento o jogo reduz sozinho os enfeites mais caros para manter a fluidez; em tela grande
  ou retina, o modo leve também desenha o mapa em resolução menor (o mapa fica um pouco menos nítido; a
  interface continua nítida).
- O terreno é pintado em segundo plano (por alguns décimos de segundo aparece uma prévia borrada);
  os três mapas ficam guardados, então trocar de mapa é imediato.

## Como jogar

Dê duplo clique em `index.html`. Funciona direto via `file://`.

Na tela de título, escolha sua facção, a do inimigo, a dificuldade e um dos três mapas, e clique em **PLAY**.
Você começa com 3000 créditos, uma Central e um pequeno exército no canto superior esquerdo; o inimigo está no canto oposto.
Os mapas são simétricos (o lado do inimigo é o espelho do seu), então nenhum canto tem mais cristal.
A cada partida a IA sorteia uma abertura e o momento da primeira onda.
Vence quem destruir todos os prédios e unidades armadas do outro.

**Primeiros passos:** Usina → Refinaria (vem com um Coletor, que colhe sozinho) → Quartel → Fábrica.
O quadro **Objective**, no canto inferior direito, sempre sugere o próximo passo.

### Controles

| Ação | Comando |
|---|---|
| Selecionar | clique esquerdo; arrastar para seleção em caixa; Shift soma |
| Todas do mesmo tipo na tela | duplo clique numa unidade |
| Mover / atacar / colher | clique direito no mapa, num inimigo ou num campo de cristal |
| Descarregar coletor | clique direito na sua Refinaria |
| Atacar-movendo | A (ou botão Atacar no painel) e depois clique no destino (mapa ou minimapa); o grupo anda junto |
| Parar | S (ou botão Parar no painel) |
| Ponto de encontro | selecione Fábrica ou Quartel e clique direito no mapa |
| Construir prédio | clique no botão; quando aparecer READY, clique de novo e escolha o lugar |
| Pôr unidade na fila | clique no botão (direito tira da fila) |
| Reparar / vender prédio | selecione o prédio e use os botões no painel (R repara; V ou Delete vende; vender pede confirmação; a Central não se vende) |
| Grupos | Ctrl+1..9 cria, 1..9 chama, dois toques centralizam |
| Câmera | setas, mouse na borda, ou clicar/arrastar no minimapa; H volta à base |
| Zoom | roda do mouse sobre o mapa (de 70% a 180%) |
| Ir até o último alerta | Espaço |
| Pausa e ajuda | P ou Esc |
| Som (tudo) | M |
| Música | N |

### Regras rápidas

- **Cristal** é o dinheiro. Coletores levam o cristal até a Refinaria. Campos se esgotam.
- **Prédios** só no planalto de pedra cinza, a até 4 tiles de outro prédio seu.
- **Energia**: se o consumo passar da geração, a produção cai pela metade, as torres atiram devagar e o radar desliga.
- **Radar** mostra os inimigos no minimapa e libera o Obuseiro.
- **Névoa de guerra**: preto é o que você nunca viu. O que já foi explorado continua revelado para sempre; só um véu leve
  marca onde você não está vendo agora (unidades inimigas ali não aparecem).

| Unidade | Preço | Vida | Bom contra |
|---|---|---|---|
| Soldado | 100 | 70 | infantaria |
| Foguete | 180 | 60 | blindados, de longe (infantaria com lança-foguetes) |
| Batedor | 250 | 160 | infantaria, coletores; rápido, enxerga longe |
| Blindado | 700 | 400 | veículos |
| Obuseiro | 800 | 170 | prédios e grupos, de longe (dano em área) |
| Coletor | 700 | 650 | colhe cristal (sem arma) |

| Facção | Vantagem |
|---|---|
| Liga Cobalto | unidades com +18% de vida |
| Clã Brasa | armas atiram 18% mais rápido |
| Consórcio Âmbar | unidades custam 10% menos |

## Estrutura

```
index.html        carrega os scripts na ordem certa
src/config.js     constantes, terrenos, facções, dificuldades, utilitários
src/defs.js       catálogo: unidades, prédios, armas e números de equilíbrio
src/game.js       estado da partida: times, tempo, fase
src/map.js        gerador do mapa (ruído com semente), cristal e consultas de tile
src/path.js       busca de caminho A* e suavização do trajeto
src/camera.js     câmera, rolagem e zoom
src/terrain.js    pintura do terreno (relevo, luz, texturas), cristais e minimapa
src/audio.js      mixagem, efeitos posicionados, motores, reverb, estéreo e música gerados com Web Audio
src/sfxbank.js    banco de efeitos gravados por código no começo (receitas, variações, loudness)
src/voicepack.js  falas sintetizadas (MP3 em base64), geradas por tools/voz/gerar.py
src/voice.js      fila de vozes: locutora, respostas das tropas, sinais e reservas
src/units.js      movimento, formação e ordens básicas
src/buildings.js  posicionamento, energia, construção, produção, reparo e venda
src/harvest.js    ciclo automático dos coletores
src/combat.js     alvo, perseguição, tiro, projéteis, dano e morte
src/fog.js        névoa de guerra
src/ai.js         IA do inimigo
src/input.js      mouse e teclado
src/ui.js         painel lateral, barra superior, mensagens, telas de título/pausa/fim
src/sprites.js    arte de unidades e prédios desenhada por código e guardada como imagens
src/fx.js         partículas, marcas de esteira e tremor de tela (só desenho, fora da simulação)
src/render.js     desenho do mundo em camadas, minimapa e atmosfera
src/testapi.js    window.__jogo, interface para testes automáticos
src/premium/      modo Premium (WebGL2), só desenho:
  glcore.js       utilitários de WebGL2 (programas, buffers, texturas, alvos) e matrizes
  glsl.js         trechos de shader comuns: ruído, luz física, sombra, nuvens, névoa de guerra
  mesh.js         construtor de malhas por código (caixas chanfradas, tornos, prismas...)
  terrain3d.js    relevo, pintura do terreno na GPU, água, cristais em 3D
  props3d.js      árvores, arbustos, pedras e capim espalhados
  models.js       modelos 3D de todas as unidades e prédios
  fx3d.js         partículas, destroços, luzes dinâmicas e receitas de explosão
  shaders.js      shaders dos modelos, decalques, partículas e pós-processamento
  premium.js      montagem do quadro (sombras, cena, partículas, bloom, composição) e sobreposição 2D
src/main.js       inicialização e laço principal (passo fixo de 60 Hz)
tests/fumaca.js   teste de fumaça com Playwright
tests/partida.js  partidas completas simuladas (IA contra IA, IA contra jogador parado)
docs/DECISOES.md  decisões de projeto
docs/ROADMAP.md   etapas e o que falta
logs/             relatórios dos críticos independentes
```

Os arquivos não usam `import`/`export` (que não funcionam em `file://`).
Cada script define funções e variáveis globais, e a ordem das tags `<script>` no `index.html` importa.

## Testes

Os testes precisam de Node e Playwright (só para testar; o jogo em si não precisa de nada):

```
node tests/fumaca.js     # ~30 s: título, seleção, construção, colheita, produção, combate, IA, pausa, repetibilidade, fps
node tests/partida.js    # ~1 min: partidas inteiras simuladas
```

Capturas de tela vão para `tests/saida/`.

Endereços úteis: `index.html?jogar` pula o título, `?pausado` começa congelado (testes repetíveis),
`?semnevoa` desliga a névoa, `?dificuldade=facil|normal|dificil`, `?faccao=0|1|2`,
`?zoom=1.25` fixa o zoom inicial, `?escala=1.5` fixa a escala da interface (em telas altas ela cresce sozinha), `?premium` / `?classico` / `?leve` escolhem o modo gráfico, `?escalagl=1` fixa a resolução do Premium (sem ajuste automático), `?vozrobo` força a voz robótica de reserva.

### window.\_\_jogo

Pelo console do navegador ou pelo Playwright:

```js
// Leitura
__jogo.unidades      // [{ id, tipo, time, x, y, vida, vidaMax, alvo, andando, selecionada, carga?, estado? }]
__jogo.predios       // [{ id, tipo, time, tx, ty, w, h, x, y, vida, vidaMax, fila, selecionado }]
__jogo.creditos      // [jogador, inimigo]
__jogo.energia       // [{ gerada, usada }, ...]
__jogo.tempo         // segundos de jogo simulados
__jogo.fase          // 'title' | 'playing' | 'paused' | 'won' | 'lost'
__jogo.vencedor      // -1, 0 ou 1
__jogo.construcao    // prédio em obra de cada time
__jogo.estatisticas  // [{ built, lost, killed, harvested }, ...]
__jogo.mapa          // { largura, altura, tile, bases }
__jogo.terreno(tx, ty), __jogo.cristalNoTile(tx, ty)
__jogo.falas         // frases do locutor [{ text, lang, t, via, spoken }]; via: 'navegador' | 'robo' | 'sem voz' | 'mudo'; spoken = o que foi dito
__jogo.som           // { ativo, mudo, musica, vozes }
__jogo.zoom, __jogo.graficosLeves, __jogo.terrenoPronto
__jogo.zoomar(1.5)
__jogo.escalaInterface  // 1 até ~970 px de altura; 1,25 em 1080p; 1,75 em 1440p
__jogo.botoes        // botões da interface em px CSS [{ acao, arg, x, y, w, h }]
__jogo.telaParaMundo(sx, sy), __jogo.mundoParaTela(wx, wy)   // px CSS da página <-> mundo (com zoom e escala)
__jogo.estado()      // foto de tudo

// Partida
__jogo.novoJogo({ faccao: 0, inimigo: 1, dificuldade: 'normal', mapa: 0, nevoa: true, semente: 1 })
__jogo.avancar(10)            // simula 10 s na hora, sem desenhar
__jogo.pausar(true)           // congela/solta o tempo real
__jogo.ia(0, true)            // põe a IA para jogar pelo time 0
__jogo.revelar()              // tira a névoa

// Ordens (ids de unidades)
__jogo.ordem([1, 2], 'mover', { x: 900, y: 700 })          // px do mundo
__jogo.ordem([1, 2], 'atacarMovendo', { x: 900, y: 700 })
__jogo.ordem([1, 2], 'atacar', 7)                          // id do alvo
__jogo.ordem([3], 'colher', { tx: 20, ty: 14 })
__jogo.ordem([3], 'descarregar', 9)                        // id da refinaria
__jogo.ordem([1, 2], 'parar')

// Base (pelas regras do jogo; devolvem null se deu certo ou o motivo)
__jogo.construir('power')     // começa a obra
__jogo.posicionar()           // coloca o prédio pronto (sem tx, ty: acha um lugar válido)
__jogo.posicionar(14, 9)
__jogo.lugarValido('factory')
__jogo.produzir('tank'), __jogo.cancelarProducao('tank')
__jogo.vender(id), __jogo.reparar(id), __jogo.pontoDeEncontro(id, x, y)
__jogo.selecionar([1, 2]), __jogo.camera(x, y)

// Atalhos de teste (fora das regras)
__jogo.criar('tank', 1, 30, 30)   // tipo, time, tile x, tile y
__jogo.darCreditos(1000)
```
