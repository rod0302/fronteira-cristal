# Decisões de projeto

Registro curto do que foi decidido e por quê. A mais recente fica embaixo.

## Etapa 1

- **Nome e tema originais.** O jogo se chama *Fronteira Cristal*. O recurso é cristal, que brota em campos no solo. Os times por enquanto são só "Jogador" (azul) e "Inimigo" (vermelho); facções com nome ficam para depois.
- **Paleta própria.** Solo verde-oliva, planalto de pedra cinza, cristais ciano e penhascos marrom-escuros. Nada de deserto de areia, para não lembrar nenhum jogo existente.
- **Scripts clássicos, sem módulos.** Cada arquivo de `src/` declara globais (`const`, `let`, `function`). A ordem no `index.html` é: config, map, path, camera, units, input, render, main. Um arquivo só pode usar, no momento em que carrega, o que veio antes; dentro de funções chamadas depois, pode usar qualquer coisa.
- **Mapa em grade de tiles de 32 px, 64×64.** Gerado por ruído de valor com semente fixa (`MAP_SEED`), então é sempre o mesmo mapa. Quatro terrenos: solo, planalto, cristal (todos transitáveis) e penhasco (bloqueia).
- **Mapa sempre jogável.** O gerador limpa a área das duas bases, garante que uma alcança a outra por terra (abre um corredor se precisar) e transforma bolsões isolados em penhasco.
- **Mapa pré-desenhado.** O terreno é desenhado uma vez num canvas fora da tela e só recortado a cada quadro. Fica rápido mesmo com textura detalhada.
- **Movimento por A\*** em 8 direções, sem cortar quinas de penhasco, seguido de suavização por linha de visão (a unidade anda reto quando dá).
- **Formação simples.** Um grupo recebe tiles vizinhos ao ponto clicado (busca em largura), cada vaga vai para a unidade livre mais próxima. Uma unidade sozinha vai exatamente ao ponto clicado.
- **Colisão leve entre unidades.** Unidades sobrepostas se afastam; quem está parado cede mais espaço para quem está andando. Ninguém é empurrado para dentro de penhasco.
- **Controles no padrão clássico.** Esquerdo seleciona, direito dá ordem. WASD move a câmera junto com as setas; se WASD virar atalho no futuro, a câmera fica só nas setas e na borda.
- **Sem escala de DPI.** O canvas usa o tamanho da janela em pixels CSS. Em telas de alta densidade fica um pouco menos nítido, mas o código fica mais simples.
- **Passo de tempo variável, limitado a 50 ms por quadro.** Suficiente para um jogo só local. Se houver replay ou rede, passa a ser passo fixo.

## Etapa 2

- **Passo fixo de simulação a 60 Hz.** A simulação anda em passos de 1/60 s com acumulador; o desenho roda a cada quadro do navegador. Se o navegador travar, no máximo 10 passos por quadro e o resto é descartado. Substitui o passo variável da etapa 1. A câmera, o cursor e os marcadores de ordem são interface e seguem o tempo real.
- **Simulação sem sorteio.** Nada no combate usa `Math.random`: mesmas ordens dão exatamente o mesmo resultado. O teste de fumaça confere isso.
- **Ordem do passo:** pensar (escolher alvo, mirar, atirar), mover, resolver projéteis e mortes. Unidades mortas saem da lista só no fim do passo.
- **Projéteis teleguiados.** Seguem o alvo e sempre acertam se ele estiver vivo; se o alvo morrer no caminho, caem no último ponto. Mais simples e previsível que tiro balístico que erra.
- **Dois jeitos de ter alvo.** Ataque mandado pelo jogador persegue até matar. Alvo automático (unidade parada vendo inimigo a até 5–6 tiles, ou revide ao levar tiro) é largado se o inimigo se afastar mais de 1,6× esse raio.
- **Ordem de mover tem prioridade.** Unidade andando por ordem não para para lutar. Mover cancela o ataque.
- **Torre do blindado gira separada do casco**, então ele mira enquanto persegue. O batedor precisa virar o corpo para atirar.
- **Cursor de mira desenhado no canvas.** Sobre inimigo (com unidades selecionadas) o cursor do sistema some e aparece uma mira vermelha; sobre unidade própria vira a mãozinha.
- **Marcas de queimado** ficam no chão onde uma unidade morreu, no máximo 80 (as mais antigas somem).
- **window.\_\_jogo em português.** A interface de testes usa os nomes pedidos (`avancar`, `ordem`, `unidades`, `vida`...), mesmo com o código interno em inglês. Prédios, créditos e energia já existem na interface, valendo vazio/zero até as etapas deles.
- **`index.html?pausado`** começa com a simulação parada, para testes que precisam partir do estado inicial exato.
- **A ajuda de teclas na barra superior** só aparece em janelas com 1180 px ou mais, para não encavalar com o placar.

## Modo autônomo (31/10)

O Rodrigo pediu que o jogo fosse feito inteiro sem consultas: todas as etapas restantes (3 a 8), depois o ciclo de críticos independentes, com aviso só no final. As decisões abaixo foram tomadas sem consulta e ficam registradas aqui.

## Etapas 3 a 8

### Estrutura
- **Mais arquivos por assunto:** `defs.js` (catálogo e números de equilíbrio), `game.js` (estado da partida), `buildings.js`, `harvest.js`, `fog.js`, `ai.js`, `audio.js`, `ui.js`. Ordem no `index.html`: config, defs, game, map, path, camera, audio, units, buildings, harvest, combat, fog, ai, input, ui, render, testapi, main.
- **Mapa maior: 80×80** (era 64×64), para caber duas bases inteiras e um campo central disputado. Bases nos cantos opostos, cada uma com planalto de raio 8 e dois campos de cristal perto.
- **Unidades e prédios compartilham ids** (`nextEntityId`) e a forma básica (`kind`, `team`, `x`, `y`, `hp`), para que alvo, dano e seleção tratem os dois do mesmo jeito.
- **Prédios ocupam tiles** (`map.occ`): bloqueiam caminho, e uma unidade cujo caminho foi bloqueado por prédio novo recalcula a rota.

### Recurso e colheita
- **Cristal por tile** (250 a 500; 600 no campo central). O desenho do tile mostra de 1 a 4 cristais conforme o que resta; esgotado, vira solo. Sem recrescimento: o mapa tem cristal de sobra para partidas de 20–30 min.
- **Coletor automático** com cinco estados (procurando, indo, colhendo, voltando, descarregando). Coletores reservam o tile que vão colher para não se amontoarem. Capacidade 700, colhe 70/s, descarrega 250/s. Créditos 1:1 com cristal.
- **Coletor movido pelo jogador** para de colher; ao chegar, espera 3 s e volta a colher por perto sozinho (evita coletor esquecido parado).
- **Sem silos nem limite de créditos.** Menos uma coisa para gerenciar.

### Base e produção
- **Construção estilo clássico:** um prédio por vez, pela Central. Ao terminar, o botão pisca PRONTO e o jogador escolhe onde colocar. Pagamento aos poucos durante a obra (sem créditos, a obra espera); cancelar devolve o que foi pago.
- **Regras de posicionamento:** só em planalto livre, sem unidades em cima, a até 4 tiles de um prédio próprio. O fantasma mostra tile a tile em verde/vermelho e a mensagem diz o motivo.
- **Árvore de tecnologia curta:** Usina → Refinaria e Quartel → Fábrica e Radar; Quartel libera Torre; Radar libera Obuseiro. Sem Central não se constrói.
- **Energia:** consumo acima da geração deixa a produção na metade, a torre atira na metade da velocidade e o radar desliga.
- **Unidades:** fila de até 5 por prédio; o botão da unidade manda para o produtor menos ocupado. Ponto de encontro com clique direito no mapa com a Fábrica ou o Quartel selecionado. A Refinaria vem com um Coletor de graça.
- **Reparo e venda** pelo painel de informações: reparo gasta 40% do preço para ir de 0 a 100% em 20 s; venda devolve 50% (proporcional à vida).

### Combate
- **Tipos de dano x blindagem** (rajada, canhão, artilharia x infantaria, leve, pesada, prédio), em `DAMAGE_MOD`. Cada unidade tem um papel claro: soldado e batedor contra infantaria, blindado contra veículos, obuseiro contra prédios e grupos.
- **Artilharia cai no ponto mirado** (não persegue), em arco, com dano em área que só atinge inimigos (sem fogo amigo, para não frustrar).
- **Atacar-movendo** (A + clique): anda e luta com o que encontrar; ao matar, retoma o caminho. Usado também pela IA.
- **Prioridade de alvo automático:** unidades antes de prédios.
- **Anti-travamento:** se uma unidade fica 1 s sem se aproximar do ponto atual (empurra-empurra com outra), pula o ponto ou encerra a viagem se já está perto. Corrigiu dois coletores que se travavam de frente na doca.

### IA
- **Mesmas regras do jogador** (créditos, energia, pré-requisitos, posicionamento), sem névoa: sabe onde fica a base do jogador, como nos clássicos.
- **Plano de construção fixo** lido como "quero ter N de cada", o que faz a IA reconstruir o que perdeu. Antes de algo que consome energia, garante energia. Deixa 1 tile de folga entre prédios para não se trancar.
- **Produção:** 2 coletores por refinaria (até 4), depois blindados, batedores e obuseiros por sorteio com semente; soldados até 10.
- **Defesa e ataque:** quem está em casa corre para onde a base foi atacada; ondas de ataque com tamanho crescente, primeira onda aos 6/4:40/3:30 min (fácil/normal/difícil).
- **Dificuldade** muda o rendimento do cristal da IA (0,7×/1×/1,35×), a velocidade de produção dela e o ritmo e tamanho das ondas.

### Névoa de guerra
- Só para o jogador. Imagem de 1 pixel por tile, ampliada com suavização: bordas macias de graça. Recalculada 10 vezes por segundo, dentro do passo de simulação (o jogador só mira no que vê, então a névoa faz parte da simulação e precisa ser repetível).
- Prédios inimigos ficam desenhados depois de descobertos; unidades inimigas só quando visíveis. O minimapa só mostra unidades inimigas com Radar funcionando.

### Acabamento
- **Três facções originais**, cada uma com cor e uma vantagem pequena: Liga Cobalto (+15% de vida), Clã Brasa (tiro 15% mais rápido), Consórcio Âmbar (12% mais barato). O inimigo usa a facção seguinte à escolhida.
- **Tela de título com uma partida IA contra IA rodando ao fundo**, escolha de facção e dificuldade.
- **Sons sintetizados** (Web Audio): tiros, explosões, aviso de base atacada, prédio pronto, unidade pronta, vitória e derrota. Só tocam se o ponto estiver na tela; M liga/desliga. Silêncio durante `__jogo.avancar`.
- **Atalhos:** WASD deixou de mover a câmera (A e S viraram atacar-movendo e parar), como previsto na etapa 1. Câmera pelas setas, borda e minimapa; H volta à base.
- **Quadro "Objetivo"** no painel, quando nada está selecionado, sugere o próximo passo (Usina, Refinaria, Quartel...). Dicas ao passar o mouse nos botões mostram preço, tempo, energia, função e o que falta.
- **Vitória/derrota:** perde quem fica sem prédios e sem unidades armadas (coletores não contam). Tela final com estatísticas dos dois lados.
- **`?jogar`, `?semnevoa`, `?dificuldade=`, `?faccao=`** na URL, e `__jogo` ganhou leitura de prédios, créditos, energia, fase e vencedor, e comandos de construção, produção, IA e névoa, para os testes e os críticos.
- **`tests/partida.js`**: IA contra IA até alguém vencer, e jogador parado contra a IA (que precisa destruí-lo). Garante que existe uma partida completa e que a IA ameaça.

## Correções da rodada 1 de críticos

Detalhe de cada item em `logs/rodada-1-correcoes.md`. As decisões que mudam o desenho do jogo:

- **Mapas com simetria de ponto** (`tile(x,y) = tile(79−x, 79−y)`). É o jeito mais simples de garantir justiça: o que um lado tem, o outro tem espelhado. A emenda reta no meio do mapa é o custo visual, e aceitei.
- **Três mapas fixos** em vez de semente aleatória: cada um é conferido (simétrico, conectado, bases com planalto e dois campos de cristal). Escolha no título.
- **Nada no código pode favorecer um time pelo índice.** Desempates de busca são espelhados para quem começa no canto de baixo (`sideFlip`). A ordem de processamento das listas alterna a cada passo (`fairEach`). As duas IAs pensam no mesmo passo e a vez alterna a cada segundo. Medido em 216 partidas IA contra IA: 97 a 115.
- **Foguete** (soldado com lança-foguetes) como contra barato do blindado: o triângulo agora é soldado < batedor < foguete < blindado < soldado em massa/obuseiro.
- **Economia mais apertada** (coletor com 500 de carga, 40/s) e **3000 créditos iniciais**: o dinheiro importa a partida inteira, mas o começo não trava.
- **Dificuldade como personalidade**: o Fácil tem 1 fábrica, sem obuseiro, sem incursão, ondas pequenas e tardias; o Difícil colhe 40% a mais, produz 30% mais rápido e manda ondas maiores e mais cedo.
- **Semente da IA sorteada a cada partida** pelo título (Math.random fora da simulação). Com a mesma semente a partida se repete, então os testes continuam determinísticos (`__jogo.novoJogo({ semente })`).
- **Unidades atiram enquanto andam** com ordem de mover: mover continua sendo mover (não para para lutar), mas ninguém atravessa o inimigo sem revidar.
- **Facção do inimigo escolhível** no título (padrão: a seguinte à do jogador).

## Correções da rodada 2 de críticos

Detalhe em `logs/rodada-2-correcoes.md`. Decisões de desenho:

- **Grupo anda junto**: ordem de mover ou atacar-movendo para um grupo usa a velocidade do mais lento. Quem acha um alvo persegue na sua velocidade. É a regra mais simples que resolve "os rápidos chegam sozinhos e morrem".
- **Prédio é alvo de segunda classe**: quem bate num prédio por conta própria larga o prédio para enfrentar uma unidade armada que chegue perto.
- **Desconto do Âmbar só em unidades** (7%): desconto em prédios e coletores virava vantagem econômica que crescia a partida inteira.
- **Difícil mais humano**: renda 1,2 e produção 1,1. Vencível com boa economia.
- **Torres não estendem a área de construção**: impede "andar" com torres até a base inimiga.
- **Névoa lembra o que viu**: prédio inimigo fora da visão mostra a vida da última vez e continua no mapa até o jogador ver que foi destruído.
- **Canvas na resolução física** (`devicePixelRatio`), lógica em px CSS (`viewW`/`viewH`).
- **Objetivo ensina economia**: 2ª Refinaria e 4 Coletores antes de mandar montar exército.
- **Venda por tecla** (V ou Delete, com confirmação), botões de Atacar e Parar no painel.

## Correções da rodada 3 (última)

Detalhe em `logs/rodada-3-correcoes.md`.

- **Objetivo conta o exército** (15 unidades armadas) antes de mandar atacar.
- **Coletor com blindagem leve**: é presa de verdade para batedores, o que dá sentido às incursões.
- **Campos da base mais ricos** (650 por tile a até 18 tiles da base) em vez de mexer no gerador: os mapas continuam iguais na forma.
- **Porta de fábrica protegida**: não se constrói no tile da porta.
- **Radar mostra todas as unidades inimigas no minimapa**, como prometido.

## Modernização visual e sonora

- **A simulação não muda.** Todo o visual novo (partículas, marcas de esteira, tremor, luzes) roda no tempo do quadro e lê o estado da partida sem escrever nele. Conferido: com as mesmas sementes, 15 minutos de IA contra IA dão um estado idêntico ao da versão anterior, byte a byte.
- **Terreno pintado uma vez por mapa.** Cada pixel recebe material, altura e luz: os tiles são interpolados (Catmull-Rom) para bordas orgânicas sem degraus, a altura gera relevo com luz do noroeste e sombra projetada dos penhascos. Penhasco de um tile só continua visível (a interpolação passa pelo valor do tile no centro).
- **Pintura do terreno num Worker.** Pintar leva quase 1 s; a função de pintura é pura e vai para um Worker criado a partir de um Blob (funciona em file://). Enquanto isso aparece uma prévia em 1/4 da resolução. Depois os outros mapas são pintados em segundo plano e guardados (cerca de 26 MB cada), então trocar de mapa é imediato. Sem Worker, pinta na hora como antes.
- **Cristais "assados" numa cópia do terreno** em zoom normal: desenhar centenas de aglomerados por quadro custava ~15 fps sem GPU. Quando um tile muda de nível, só a vizinhança dele é refeita. Com zoom alto (ou tela retina) eles são desenhados ao vivo, nítidos. Um grão fino em 2x por cima do terreno disfarça a ampliação nesses casos.
- **Modo leve em tela grande** reduz a resolução do canvas para 1 px por px lógico e deixa o navegador ampliar. Fica um pouco menos nítido, mas em 2560x1440 sem GPU sai de ~33 para ~58 fps. A interface (painel, textos, telas) fica numa segunda camada por cima, em resolução cheia, transparente aos cliques: só o mapa perde nitidez. O modo liga quando o jogo está lento (abaixo de ~52 fps por 2 s), tenta voltar depois de 10 s com folga e, se ficar lento de novo logo em seguida, fica no leve até o fim da partida.
- **Nada aparece sob a névoa:** marcas de queimado e escombros só surgem depois que o jogador vê o lugar; animações de prédios inimigos lembrados ficam paradas.
- **Barras de vida só quando importam** (selecionada, dano recente, vida baixa), para batalhas grandes não virarem uma grade.
- **Sprites em cache.** Unidades e prédios são desenhados por código uma vez (em resolução dobrada, nítidos em retina) e depois só copiados e girados. As sombras das unidades são pré-giradas em 16 direções. Partes animadas (torre do blindado, antena do radar, bandeira, luzes) são desenhadas por cima a cada quadro.
- **Efeitos sob a névoa não aparecem** (resolve um problema conhecido da versão anterior).
- **Zoom pela roda do mouse** (70% a 180%). A câmera guarda o tamanho na tela (w/h) e o tamanho no mundo (ww/wh).
- **Escala da interface em telas altas** (resolve o problema conhecido "interface não cresce"): a lógica toda trabalha em px lógicos, e numa tela de 1080 px de altura cada px lógico vale 1,25 px (1,75 em 1440p). Texto, painel e mapa crescem juntos, nítidos, sem mexer no layout. O mouse é convertido na entrada.
- **Qualidade automática.** Se o quadro passa de ~19 ms por 2 segundos, o jogo desliga o cintilar dos cristais, as sombras das unidades, a vinheta e metade da fumaça; volta sozinho quando sobra folga. Sombras de nuvens foram testadas e tiradas: custavam caro em máquinas sem aceleração.
- **Som com espaço:** compressor no fim da cadeia, reverb com resposta ao impulso gerada por código, posição estéreo pela posição na tela, volume que cai fora da tela (ouve-se a batalha logo ao lado), variação de altura a cada tiro e limite de sons simultâneos.
- **Música gerada**: três progressões com timbres próprios que se alternam, baixo, arpejo e percussão que cresce com a batalha (explosões e tiros na tela). Baixa e desligável com N.
- **Avisos se destacam:** sirene, locutor e sons de interface passam por um barramento próprio; enquanto a sirene ou o locutor tocam, efeitos e música abaixam (ducking). A sirene ocupa a faixa de 1 a 3 kHz, onde a batalha é fraca.
- **Cada tipo de aviso de ataque tem sua espera**, e a voz entra depois da sirene.
- **A demonstração do título não fala** nem toca sinos de construção: o time 0 ali é uma IA.
- **Locutor.** "Harvester deployed" é pedido do Rodrigo e sai em inglês com a voz do navegador; nunca uma gravação. Sem voz instalada, um sintetizador de formantes próprio fala a frase com timbre de rádio (testado com um reconhecedor de fala, que escolheu a frase certa entre doze parecidas). Os outros avisos falados são em português; sem voz em português saem em inglês com a voz inglesa (para não sair português com sotaque de máquina inglesa), e sem voz nenhuma a voz robótica fala "Base under attack", "Harvester under attack", "Low power", "Victory" e "Defeat". O som hidráulico do Coletor toca antes da voz, para os dois serem ouvidos.

## Modo Premium (WebGL2)

- **Três modos, uma simulação.** O Premium só desenha: lê o estado da partida e nunca escreve nele. Conferido por teste (`tests/fumaca.js`): as mesmas ordens dão o mesmo estado no Clássico e no Premium. Os efeitos usam `Math.random` próprio, fora do sorteio da simulação.
- **Câmera oblíqua, chão no mesmo lugar.** Em vez de perspectiva, uma projeção oblíqua: cada px de altura sobe K = 0,7 px na tela. O chão (altura 0) cai exatamente onde caía no 2D, então câmera, minimapa, seleção em caixa e posicionamento continuam iguais. Só o clique em unidades e prédios ganhou uma folga para cima (o corpo aparece acima do pé).
- **Chão jogável quase plano.** Relevo de verdade só onde o mapa já é bloqueado (penhascos viram mesas de arenito ou cânions com água). Assim nenhuma regra muda e nada fica escondido atrás de morro.
- **Terreno pintado na GPU uma vez por mapa** (textura de 4096 com placa de vídeo, 2048 por software), com oclusão de ambiente calculada na CPU a partir do relevo. Uma máscara lida de volta diz onde pôr capim, árvores e pedras.
- **Modelos montados por código** (`MeshBuilder`): caixas chanfradas, tornos, prismas. Cada modelo é uma malha com material por vértice (cor, rugosidade, metal, brilho, efeito); as instâncias vão em lote (uma chamada por tipo de peça).
- **Cor do time no 3D** (azul `#2a4ea8`, vermelho `#e3121b`, âmbar `#ffc21a`). O casco é grafite e a cor do time só aparece em painéis e faixas, além de um anel no chão sob cada unidade. Nos telhados, a chapa é metálica escura e a cor do time só aparece em filetes e em luz na mureta. A seleção usa um anel branco-gelo, que não se confunde com nenhum time.
- **Infantaria em esquadrão de 3 soldados** (só desenho; na simulação é uma unidade), cada um 55% maior que a escala real, e **planalto em pedra cinza** com borda marcada: legibilidade antes de realismo.
- **Névoa de guerra** em textura 80x80 suavizada na GPU e interpolada no tempo; o nunca visto vira um teto de nuvens, a lembrança fica fria e escura.
- **Tipos comparados com arredondamento nos shaders.** Um valor constante interpolado pode chegar como 2,9999 em alguns drivers; `type == 3.0` falhava e a fumaça saía como brilho de cristal.
- **Padrão automático.** Sem escolha salva, o jogo usa o Premium só se o navegador tem placa de vídeo; desenhando por software (SwiftShader, llvmpipe) fica no Clássico. Sem WebGL2, ou se o contexto se perde, volta sozinho para o Clássico.
- **Resolução dinâmica** no Premium (passo de 0,1, piso de 0,7 px de imagem por px da tela). `?escalagl=X` fixa.
- **Testes**: as checagens de jogo e de fps rodam no Clássico (o navegador de teste não tem placa de vídeo); o Premium tem um bloco próprio que confere que liga, desenha a cena, não muda a simulação e troca de modo com F9.
- **A normal visível sempre aponta para a câmera.** A projeção oblíqua inverte a orientação da tela, e `gl_FrontFacing` passava a virar a normal de faces visíveis: pedras, copas e partes dos cascos recebiam só céu. Isso deixava as pedras lilás e as árvores cinza. A solução foi `if (dot(N, V) < 0.0) N = -N`.
- **Luz rebatida quente e sombra no chão que não chega ao preto.** É o deserto com céu aberto: as sombras ficam coloridas.
- **Exposição que reage ao clarão.** Cai até cerca de 25% durante o clarão, para a explosão não lavar a tela.
- **Se o WebGL falhar no meio do jogo, volta para o Clássico com aviso**, em vez de tela preta.

## Som premium e vozes (novembro de 2026)

- **Por que "Harvester deployed" não tocava.** A versão anterior dependia só da voz do navegador e preferia "Google UK English Male", uma voz de rede do Chrome que falha calada (sem internet, em `file://`, depois de alguns segundos de fala) e não tinha reserva quando dava erro. Sem voz instalada, a frase saía pelo sintetizador de formantes, que um reconhecedor de fala ouve como "Harlaster, need mine". Ou não saía nada, ou saía algo irreconhecível.
- **Vozes pré-sintetizadas dentro do código.** As falas são geradas uma vez, fora do jogo, pelo sintetizador de voz neural Kokoro (licença Apache 2.0, vozes sintéticas, nenhuma gravação de pessoa), e guardadas em `src/voicepack.js` como MP3 em base64. Assim falam igual em qualquer navegador, sem internet, sem voz instalada e por `file://`. O gerador é `tools/voz/gerar.py`, com o catálogo em `tools/voz/falas.json`.
- **Cada fala é escolhida por um reconhecedor de fala.** O sintetizador varia a cada geração; o gerador faz até 6 tomadas de cada fala e fica com a que o Whisper (via sherpa-onnx) entende melhor, ouvindo o MP3 que vai para o jogo, limpo e com ruído de batalha por baixo. Quando a pronúncia automática erra (o "r" forte de "Torre" e "Radar" no começo da frase, "Inimigo", "Quartel", "caiu"), o catálogo leva os fonemas escritos à mão.
- **Elenco.** Locutora em português (voz feminina, a "central" da base) e "Harvester deployed" em inglês na mesma linha de voz feminina, porque é a frase-assinatura que o Rodrigo pediu em inglês. Infantaria e tripulantes de veículos têm vozes masculinas diferentes; veículos e Coletor falam pelo rádio.
- **"Harvester deployed" quando o Coletor começa a colher pela primeira vez** (o momento em que ele se "implanta" no campo, com o som hidráulico). Na saída da Fábrica ou com a Refinaria nova, a locutora diz "Coletor pronto".
- **Uma fila só para as vozes.** Locutor e tropas nunca falam juntos. Avisos de perigo passam na frente e cortam falas pouco importantes; falas que esperaram demais perdem a validade; várias unidades prontas viram "Unidades prontas"; o informativo fica de fora quando o locutor já falou muito no último minuto. A sirene, o sino de pronto, o pulso de radar e a fanfarra tocam na mesma entrada da fila, antes da voz, e abaixam enquanto ela fala.
- **Respostas das tropas** ao selecionar, mover e atacar. A resposta a uma ordem corta a resposta à seleção. Enquanto falam, a batalha abaixa um pouco.
- **Reservas.** Sem o pacote (ou se o navegador não decodificar MP3): voz do navegador, preferindo vozes locais, com reserva para a voz robótica se ela der erro.
- **Efeitos gravados por código no começo** (`src/sfxbank.js`): cada som é montado em camadas (estalo, corpo nos médios, grave, cauda, destroços) num OfflineAudioContext, com várias variações de verdade (semente embaralhada), e o volume de cada um segue uma tabela de loudness (prédio > veículo > canhões > impactos > fuzil > interface), não o pico. A 32 kHz, com a cauda muda cortada, para economizar memória. Primeiro sai uma variação de cada som; o resto vem depois.
- **Cada arma com identidade:** fuzil em rajada, metralhadora rápida e metálica, foguete com motor crepitando, canhão seco do blindado, torre com servo e anel de cano longo, obuseiro com sopro de pressão e o assobio da granada chegando antes do impacto. Explosões por tamanho (batedor, blindado, Coletor com o cristal estilhaçando, prédio desabando em cadeia).
- **Espaço:** reverb de vale, eco estéreo das mesas de pedra, som que perde agudos e ganha eco com a distância, e explosões grandes que se ouvem fora da tela, abafadas.
- **Limite de sons por classe com prioridade:** quando a classe enche, o som novo toma a vaga do mais fraco tocando (importância vezes volume), em vez de "quem chegou primeiro leva".
- **Motores e ambiente:** laços de motor para blindado, batedor e Coletor (duas vozes por tipo, uma de cada lado da tela, com partida e parada), moenda do Coletor colhendo, zumbido da base e vento de 24 s.
- **Mixagem:** filtro que tira o sub inaudível e abaixa um pouco o grave dos efeitos (sobra espaço para os médios, que é onde se entende a batalha e o que um alto-falante de notebook toca), compressor de cola suave, limitador no fim, música mais presente.
- **A simulação não muda:** o som só lê o estado do jogo. Conferido comparando `__jogo.estado()` com a versão anterior, com as mesmas sementes.

### Ajustes depois das rodadas 1 e 2 de críticos do som
- **Loudness medido pelo BS.1770 de verdade** (filtro K completo, janelas cheias de 400 ms). O medidor aproximado da rodada 1 errava até 9 LU e desmontava a hierarquia (canhão soava como fuzil). Sons mono passam sempre pelo panner, para o loudness medido ser o mesmo do jogo em qualquer posição.
- **"Momento" de grande evento:** explosão de prédio, Coletor ou veículo na tela abaixa armas leves por cerca de 1 s. Sem isso, a maior explosão do jogo sumia na parede de tiros.
- **Roubo de vaga:** a voz roubada sai da lista na hora; com o limite geral cheio, rouba-se de qualquer classe; explosões no começo ficam protegidas.
- **Voz mais baixa e ducking mais raso** (0,45 perigo, 0,6 resto, 0,8 tropas). A inteligibilidade sobrava, e a batalha ficava abafada 7 dB em um quarto do tempo.
- **Perigo limpa a fila:** "sob ataque" tira "inimigo detectado" e "se aproximando" da fila e corta falas menores; sirene só com a fala.
- **Leituras alternativas** (`chave_v2`) para as falas mais frequentes e para os perigos, sorteadas sem repetir.
- **"Harvester deployed" ficou na voz `af_heart`:** testada na voz da locutora, o reconhecedor ouviu "Carvister deployed". A clareza da frase pedida vale mais que o elenco perfeito.
- **Juiz das tomadas ouve uma batalha do jogo** (variável `RUIDO_WAV` do gerador), não ruído rosa.

### Mapa explorado continua revelado (04/11/2026)
- **Pedido do Rodrigo:** o que uma unidade já revelou não volta a ficar escondido quando ela sai dali. O terreno explorado agora fica à mostra para sempre, nos três modos (Clássico/Leve: véu de 34/255 em vez de 130; Premium: cor quase cheia, só 14% mais escura e levemente fria, em vez de cinza-azulado pela metade).
- **O véu leve fica de propósito:** unidades inimigas e efeitos fora da visão atual continuam invisíveis (o jogador só mira no que vê, e a simulação não mudou); sem nenhuma marca, um tanque inimigo "sumiria" em terreno claro sem explicação.
- Prédios inimigos já vistos continuam lembrados como antes.

### Jogo todo em inglês, sem fala duplicada do Coletor (05/11/2026)
- **Pedido do Rodrigo:** o Coletor dizia "Coletor pronto" e, segundos depois, "Harvester deployed", que significam a mesma coisa. Agora só existe **"Harvester deployed"**, que toca **na hora em que o Coletor é entregue** (sai da Refinaria ou da Fábrica), como o antigo "Coletor pronto". Na primeira versão em inglês ela esperava o Coletor chegar ao cristal e o Rodrigo achou que demorava demais. As chaves `unidade_harvester` e `unidade_harvester_v2` saíram do catálogo e do pacote.
- **Tudo em inglês:** menus, painel, dicas, objetivos, avisos, nomes de unidades, prédios, facções e mapas, e todas as falas (locutora `af_heart`, infantaria `am_michael`, veículos e Coletor `am_fenrir`, todas en-us). O título na tela passou a **CRYSTAL FRONTIER**. As chaves internas das falas continuam em português (só identificadores).
- **Textos originais**, escritos para este jogo; evitamos de propósito bordões conhecidos de outros jogos (ex.: "Construction finished", "Not enough credits", "We can't build there").
- `genderize()` ficou neutro (em inglês o adjetivo não muda) e a voz de reserva do navegador usa sempre en-US.
- Comentários do código e documentação continuam em português, como antes.
