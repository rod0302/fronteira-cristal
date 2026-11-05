# Fronteira Cristal: resumo do ciclo de críticos

## Evolução das notas

| Lente | Rodada 1 | Rodada 2 | Rodada 3 |
|---|---|---|---|
| Jogabilidade e clareza | 6,5 | 7,0 | 7,5 |
| Bugs, desempenho e robustez | 6,5 | 7,5 | **8,0** |
| IA e equilíbrio | 4,0 | 6,0 | 6,5 |
| Média | 5,7 | 6,8 | 7,3 |

- Cada rodada usou três críticos novos, que não viram as rodadas anteriores. Eles jogaram com bots em Playwright: mais de 2.500 partidas simuladas no total, com mouse e teclado reais nas lentes de interface.
- O ciclo parou na rodada 3 porque é o máximo das regras.
- A regra de parada antecipada (todas as notas 8+ em duas rodadas seguidas) não foi atingida: só a lente de bugs chegou a 8.
- Todas as rodadas melhoraram todas as notas.
- As correções da rodada 3 foram feitas e testadas por mim, mas nenhum crítico as avaliou.

## O que foi corrigido (principais)

Detalhes em `rodada-1-correcoes.md`, `rodada-2-correcoes.md` e `rodada-3-correcoes.md`.

- **Justiça do mapa.** O mapa favorecia o canto do jogador (27 de 27 vitórias do time 0 em IA contra IA). Agora os 3 mapas têm simetria de ponto. Também saíram as vantagens escondidas no código: desempates de busca, ordem de processamento, sementes parecidas e ponto de encontro fora de centro. Na medição final o resultado é 46 x 46 com troca de cantos.
- **Equilíbrio.**
  - Nova unidade Foguete, contra barato do blindado.
  - Economia mais apertada e 3000 créditos iniciais.
  - Números de dano revistos três vezes.
  - Facções medidas e ajustadas: na última medição, 10, 11 e 14 vitórias em 24.
- **IA.** Foi reescrita:
  - prioriza refinaria e sai de qualquer trava econômica vendendo prédios;
  - deixa guarda em casa, manda ondas com o tamanho da vez e recua quando a onda é dizimada;
  - adapta a produção ao exército do jogador, faz incursões contra coletores e sorteia aberturas;
  - cada dificuldade tem personalidade: o Fácil é vencível por qualquer plano ativo, o Normal pede economia e o Difícil pede economia bem jogada.
- **Clareza.**
  - O Objetivo guia da primeira Usina até o ataque e ensina a crescer a renda (2ª Refinaria, 4 Coletores, exército de 15).
  - Avisos de produção parada, de cristal distante ou esgotado e de unidades atacadas fora da tela.
  - Botões Atacar e Parar no painel; o grupo anda junto; clicar num inimigo mostra o que ele é.
  - Seletor de inimigo e de mapa no título.
- **Robustez.**
  - Não se vende mais a Central, e toda venda pede confirmação.
  - Pausa de verdade: o painel e os avisos param.
  - A névoa lembra o que viu.
  - Coletores nunca param com cristal no mapa.
  - Portas de fábrica não podem ser tapadas.
  - Limite de 60 unidades por time; nitidez em telas retina; telas baixas suportadas.
  - 0 erros de console em todas as execuções dos críticos, memória estável e cerca de 60 fps com 80 a 116 unidades em combate.

## Problemas conhecidos que restam

Ditos com honestidade, com base nos relatórios da rodada 3:

1. **A interface não cresce em telas grandes.** Em 1920x1080 o texto continua com 11 px e o painel com 220 px, com espaço vazio. Abaixo de ~440 px de altura o painel de informações some; os atalhos de teclado continuam funcionando.
2. **O Difícil continua duro.** Dos bots simples, só a estratégia de economia forte vence. Recalibrei depois da rodada 3, mas ninguém mediu de forma independente.
3. **A IA não se expande.** Ela não constrói refinaria perto de outros campos. Em partidas longas nos mapas 1 e 2, a renda dos dois lados cai.
4. **Partidas IA contra IA entre forças iguais podem passar de 40 min.** O teste espera até 70 min.
5. **Defesa de torres empata no Fácil.** A IA Fácil não usa obuseiros, de propósito.
6. **Ordem para 50+ unidades gera um engasgo de ~40 ms** (um quadro).
7. **Unidades se sobrepõem um pouco em grupos muito grandes.**
8. **Detalhes visuais.** O mapa espelhado tem uma emenda reta no meio. Os efeitos de explosão aparecem mesmo sob a névoa.

## Arquivos

- Relatórios dos críticos: `rodada-N-jogabilidade.md`, `rodada-N-ia.md`, `rodada-N-bugs.md`.
- Versões congeladas: `rodada-N-versao.md`.
- Correções: `rodada-N-correcoes.md`.
- Capturas: `capturas/`.

---

# Ciclo 2: modernização visual e sonora

Pedido do Rodrigo: modernizar gráficos e efeitos de som, com a frase "Harvester deployed".

## Evolução das notas

| Lente | Rodada 1 | Rodada 2 |
|---|---|---|
| Gráficos e identidade visual | 7 | 7 |
| Som, música e locutor | 7 | 7 |
| Desempenho, robustez e regressão | 7 | 7 |

- Cada rodada usou três críticos novos, que não viram a rodada anterior.
- O ciclo parou na rodada 2 pela regra "se uma rodada não melhora nenhuma nota, parar e explicar".
- **Por que as notas não subiram:** os problemas da rodada 1 foram corrigidos (os críticos da rodada 2 confirmam
  sirene audível, demonstração muda, cristal sem grade, troca de mapa instantânea, tremor parado na pausa), mas
  cada crítico novo achou problemas novos do mesmo peso. A maior parte do peso vem de medir num Chromium sem
  placa de vídeo, onde pintar telas grandes custa muito mais que num navegador comum; o modo leve que resolve
  isso trazia uma imagem borrada, e isso pesou nas três lentes.
- As correções da rodada 2 (abaixo) foram feitas e testadas por mim, mas nenhum crítico as avaliou.

## O que foi feito

Detalhes em `modernizacao-rodada-1-correcoes.md` e `modernizacao-rodada-2-correcoes.md`.

- **Gráficos.** Terreno pintado pixel a pixel com relevo, luz do noroeste, sombras dos penhascos e bordas
  orgânicas; cristais em aglomerados soltos; prédios e unidades com volume, sombra, partes animadas, dano visível
  e cor do time; explosões, fogo, fumaça, poeira, rastros e marcas de esteira; névoa suave; zoom pela roda do mouse;
  interface nova que cresce em telas altas.
- **Som.** Efeitos com reverb, estéreo e volume pela distância; sirene que se destaca na batalha (o resto abaixa);
  música gerada com três progressões e percussão que acompanha a batalha.
- **"Harvester deployed".** Falada quando um Coletor seu sai da Refinaria nova ou da Fábrica, logo depois de um
  chiado hidráulico. Usa a voz do navegador em inglês; sem voz, um sintetizador de formantes próprio fala com
  timbre de rádio. Nenhuma gravação é usada.
- **Jogabilidade intacta.** O estado da simulação é idêntico byte a byte ao da versão aprovada (93 de 93 fotos de
  estado conferidas pelo crítico, mais as minhas), e 1040 verificações de mouse e teclado passaram.

## Problemas conhecidos que restam

1. **Telas grandes em computador sem aceleração de vídeo.** Em qualidade cheia, 2560x1440 ou retina ficam lentas;
   o modo leve liga sozinho e mantém ~50 a 60 fps, mas o mapa fica um pouco menos nítido (a interface não).
2. **240 unidades** (acima do limite real de 120) ainda derrubam o fps para ~45.
3. **Abertura:** o terreno final aparece ~1 s depois do primeiro quadro (antes disso, uma prévia borrada), e o
   jogo usa mais memória que a versão aprovada (~150 MB a mais, estável).
4. **Voz robótica** (só quando o navegador não tem voz): entende-se sabendo o que se espera ouvir; palavras curtas
   como "Victory" e "Defeat" são as mais fracas.
5. **Música:** variou bastante, mas ainda é um ciclo de ~4 min; quem joga muito pode desligar com N.
6. As correções da rodada 2 não passaram por crítico independente.

## Arquivos do ciclo

- Relatórios: `modernizacao-rodada-N-graficos.md`, `-som.md`, `-desempenho.md`.
- Versões congeladas: `modernizacao-rodada-N-versao.md`. Correções: `modernizacao-rodada-N-correcoes.md`.
- Capturas: `capturas/modernizacao-rodada-N-*/`.

# Ciclo 3: modo gráfico Premium (WebGL2)

Pedido do Rodrigo: gráficos "visualmente apaixonantes", nível AAA, sem se preocupar com placa de vídeo, mantendo a versão leve.

## O que foi feito

- **Modo Premium** novo, em WebGL2, tudo gerado por código (nenhuma imagem externa): mundo 3D com mesas de arenito em camadas, cânions com lagos que refletem as paredes, árvores, pedras e capim; modelos 3D de todas as unidades e prédios com materiais físicos e cor do time; sol com sombras suaves e sombra de nuvens; luzes de explosões e tiros; explosões em fases com explosões secundárias, fumaça, destroços e faíscas; cristais que brilham; névoa de guerra como teto de nuvens; HDR, bloom, ACES, gradação de cor, antisserrilhado e resolução dinâmica.
- **Clássico e Leve continuam** (o 2D de antes). Troca pelo botão Gráficos (título e pausa) ou F9. Padrão: Premium com placa de vídeo, Clássico sem.
- **Simulação idêntica** nos três modos (teste automático compara o estado). "Harvester deployed" continua igual.

## Evolução das notas (média de cada crítico)

| Rodada | Arte | Efeitos | Jogo/legibilidade |
|---|---|---|---|
| 1 | 4,8 | 4,1 | 5,8 |
| 2 | 5,4 | 5,1 | 8,0 |
| 3 | 5,7 | 5,4 | 8,0 |
| 4 | 6,3 | 5,5 | 7,5 |
| 5 | 6,4 | 5,8 | 6,9 |
| 6 | 6,7 | 6,2 | — |
| 7 | 6,8 | 6,4 | 7,8 |
| 8 | 6,9 | 6,7 | 8,3 |
| 9 | 7,3 | 6,8 | — |
| 10 | 7,4 | — | — |

Os críticos de arte e efeitos foram muito duros (régua de jogo AAA de estúdio) e avaliaram num navegador sem placa de vídeo.

Na rodada 10, as notas de arte foram:
- terreno: 7,5;
- unidades: 7,5;
- prédios: 7;
- iluminação e cor: 8;
- impacto geral: 7.

Depois do primeiro zip, Rodrigo pediu para continuar até ficar AAA, e vieram as rodadas 4 a 10. As maiores mudanças desse período:
- correção de um erro de iluminação, com faces visíveis iluminadas por trás (pedras lilás, árvores cinza, cascos lavados);
- infantaria em esquadrões;
- cascos grafite com painéis do time;
- trilhas, postes e contêineres na base;
- água com profundidade e cintilação;
- fogo com veios e fuligem, crateras em brasa e explosão própria na água;
- gradação de cor calibrada;
- seleção branca;
- holograma com a forma do prédio.

O ciclo parou com a nota geral "AAA" em 7 por duas rodadas seguidas. Daqui em diante, o que falta é geometria e material (encostas, chão de cristal, água parada, tiroteio), não ajuste de cor.

## Problemas conhecidos que restam

Ver `docs/ROADMAP.md`, seção "O que falta".

## Arquivos do ciclo

- Relatórios: `premium-rodada-N-arte.md`, `-efeitos.md`, `-jogo.md`; correções: `premium-rodada-N-correcoes.md`.
- Capturas: `capturas/premium-r1/` a `premium-r10/` e `capturas/premium-final/`.

# Ciclo 4: som premium e vozes (novembro de 2026)

Pedido do Rodrigo: efeitos sonoros premium AAA; falas como "Coletor pronto", "Torre pronta", "Base sob ataque" e "Inimigo detectado"; e "Harvester deployed", que ele tinha pedido antes e nunca ouviu.

## O que foi feito
- **"Harvester deployed" corrigido.** A versão anterior dependia da voz do navegador, que falhava calada no PC do Rodrigo. Agora todas as falas são sintetizadas uma vez fora do jogo (Kokoro, Apache 2.0) e embutidas em `src/voicepack.js` como MP3. Falam igual em qualquer navegador, sem internet e por `file://`. A frase toca quando o Coletor chega ao cristal e começa a colher pela primeira vez. `tests/fumaca.js` confere que ela sai pelo pacote.
- **Locutora com 38 falas** ("Coletor pronto", "Torre de defesa pronta", "Alerta! A base está sob ataque!", "Atenção, inimigo detectado", "Usina pronta", "Energia baixa", "Unidade perdida", vitória, derrota e outras), cada uma com o seu sinal (sirene, sino, radar, som do Coletor se implantando, fanfarra). Seis delas têm uma segunda leitura. As tropas têm 40 respostas ao selecionar, mover e atacar, com outra voz para os veículos, pelo rádio.
- **Fila única de vozes:** locutora e tropas nunca falam juntas, perigo passa na frente e a batalha abaixa enquanto alguém fala.
- **Banco de efeitos gravado por código no começo** (`src/sfxbank.js`): armas com identidade própria, explosões por tamanho, impacto em terra e em metal, motores que seguem as unidades na tela, fogo nos prédios, vento e zumbido da base. Volume de cada som pelo loudness BS.1770, reverb de vale, eco das mesas, distância, prioridade e "momento" de grande evento.
- Cada fala foi escolhida pelo reconhecedor Whisper, ouvindo o MP3 sobre uma batalha gravada do próprio jogo.

## Evolução das notas

| Rodada | Efeitos | Locutor e vozes | Mixagem |
|---|---|---|---|
| 1 | 5 | 6 | 5 |
| 2 | 5,5 | 6,5 | 5 |
| 3 | 6 | 6,5 | 6 |

Régua dos críticos: 10 é áudio de RTS AAA de estúdio atual, 7 é um bom jogo indie, 5 é aceitável. Eles não ouvem: medem loudness, espectro, fila e reconhecimento de fala em gravações da saída real do jogo.

O ciclo parou no máximo de 3 rodadas. As correções da rodada 3 (`som-rodada-3-correcoes.md`) não foram avaliadas por críticos. A principal delas devolve a voz para cima da batalha: a rodada 2 a tinha abaixado demais.

## Problemas conhecidos que restam
- O banco leva de 8 a 12 s para ficar pronto, com a taxa de quadros caindo nesse tempo, e o áudio ocupa uns 40 MB.
- Motores sem rotação ligada à velocidade e sem marcha lenta.
- O estalo das explosões ainda se destaca pouco do corpo.
- Faltam passos de infantaria e o voo dos projéteis.
- A voz é sintética: clara, mas sem a interpretação de uma locutora gravada. Os perigos não têm altura mais aguda.
- `voicepack.js` tem cerca de 1,9 MB.

## Arquivos do ciclo
- Relatórios: `som-rodada-N-efeitos.md`, `-voz.md`, `-mix.md`; correções: `som-rodada-N-correcoes.md`.
- Gerador das falas: `tools/voz/gerar.py`, catálogo `tools/voz/falas.json`, relatório do reconhecedor `tools/voz/relatorio-reconhecimento.txt`.
