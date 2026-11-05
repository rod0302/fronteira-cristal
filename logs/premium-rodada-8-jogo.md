# Premium, rodada 8: crítica de jogo (legibilidade, interação, modos, interface)

Revisor independente. Chromium sem GPU (SwiftShader, `--use-gl=angle --enable-unsafe-swiftshader`), tier `software`. Não medi fps.

Scripts em `/tmp/r8/`: `h.js` e as cenas da rodada 7 (`s1, s2, s2b, s2b18, s6, s7, s8`), mais as novas `cor.js`, `cor6.js`, `holo.js`, `marc.js` e `dbg.js`. Capturas em `logs/capturas/premium-r8/jogo-proprias/`. Os recortes ampliados começam com `c-`, e as capturas com sufixo `-final` são da última passada.

**Atenção ao método.** O código mudou durante a revisão: `models.js` às 01:42, e `premium.js`, `shaders.js` e `fx3d.js` às 02:04. Por isso as cenas de cor, seleção e holograma foram refeitas no código das 02:04 (as capturas `-final`), e as notas valem para esse estado. A máquina também estava muito carregada por outros agentes: cada ação com captura levou de 15 a 20 s. Isso explica alguns tempos esgotados dos scripts, que não são travamentos do jogo.

## O que testei

**Testes automáticos**
- `node tests/fumaca.js`: ok, rodado duas vezes (antes e depois das mudanças das 02:04). Inclui "nenhum erro no console", F9 esconde o WebGL e simulação idêntica entre Clássico e Premium.
- `node tests/partida.js`: ok. A IA contra IA termina aos 22 min, e a IA destrói o jogador parado aos 7 min.

**Cenas no Premium**

| Cena | O que verifica | Resultado |
|---|---|---|
| `s2` (zoom 1; 1,4; 1,8) | clique no centro visual de 9 unidades e caixa | **9/9** nos três zooms. A caixa pega 8 (o coletor fica de fora, como deve) |
| `s2b18` F=0 e F=2 (zoom 1,8) | clique, e caixa que cobre só o corpo erguido | clique **6/6**. Caixa **6/6, inclusive soldado e foguete a 13 px do chão** (antes: 4/6) |
| `s8` | infantaria colada ao blindado, 9 posições, zoom 1 e 1,5 | **36/36** |
| `s1-final`, `cor`, `cor6` | 3 times em 3 pareamentos, zoom 1 e 1,8 | ver (a) |
| `s6-final`, `holo` | holograma da Fábrica e da Usina, válido e inválido | ver P1 |
| `s7` | título, botão JOGAR, F9 ×6, pausa | ok. Entrar no Premium ainda trava (P3) |
| `marc` | marcador de ordem em areia e em cristal | não deu para verificar visualmente (P5) |

**Console:**
- os 4 avisos `GPU stall due to ReadPixels` (`terrain3d.js:858`) de sempre;
- **uma vez**, numa carga de `s2b` com Âmbar: `pageerror: framebuffer incompleto: 36061` seguido de `CONTEXT_LOST_WEBGL` (P2). Não se repetiu em outras ~14 cargas.

## Notas

| Área | R7 | **R8** | Variação |
|---|---|---|---|
| (a) legibilidade em jogo | 7 | **8** | +1 |
| (b) interação/clique | 8 | **9** | +1 |
| (c) troca de modos e robustez | 8,5 | **8** | −0,5 |
| (d) tela de título e interface | 7,5 | **8** | +0,5 |

### (a) Legibilidade: 8

**O que melhorou**
- **Os times agora se leem pelo casco, não só pelo anel** (`c-s1-0x2-z1-final.png`, `cor6-2x1.png`, `c-cor-limpo-vs-jogar.png`):
  - Âmbar: casco amarelo-ouro;
  - Brasa: vermelho;
  - Cobalto: grafite com painéis azuis.

  No zoom 1, os três pareamentos se separam num relance. Este era o P5 da rodada 7. A primeira passada `s1`, feita antes das 01:42, ainda mostrava cascos grafite-cáqui, então a melhora veio das mudanças em `models.js`.
- **Seleção branca** (`c-s2b18-1sel-z1-f2.png`, `c-s2b18-todas-z1-f0.png`):
  - o anel branco-gelo com barra de vida não se confunde com nenhum time;
  - no Âmbar, selecionado e não selecionado agora são óbvios;
  - o "verde-limão" da rodada 7 acabou.
- **Campo de cristal mais calmo.** A infantaria azul e a vermelha continuam legíveis dentro do campo, e o véu leitoso sumiu.

**O que ainda pesa**
- **Holograma** sem silhueta legível (P1).
- **Cristais cruzam os modelos.** Cristais altos atravessam e cobrem parte do casco quando a unidade está no campo (`c-s2-sel.png`).
- **Ponto branco no campo.** Um brilho estourado aparece sempre no mesmo ponto do campo, perto do batedor (`c-s1-0x2-z1-final.png`, à esquerda). Parece unidade disparando, e não é.

### (b) Interação/clique: 9

**Tudo o que medi acertou:**
- clique: 9/9 em três zooms, 6/6 no zoom 1,8 e 36/36 com a infantaria colada;
- **a caixa agora pega o corpo erguido** (P3 da rodada 7, resolvido). Diagnóstico em `dbg.js`: a caixa de 24×37 px em volta do corpo do soldado pega o soldado no zoom 1,8.

**O que falta**
- O holograma válido não diz *que prédio* vai ser posto (P1).
- Não consegui ver o marcador de ordem nas capturas (P5).

### (c) Modos e robustez: 8

- **F9:** cicla 6 vezes, nesta ordem: Clássico → Leve → Premium → Clássico → Leve → Premium.
  - O `glCanvas` alterna entre `none` e `block` direito.
  - A partida segue em `playing`.
  - A pausa funciona.
  - O aviso "Gráficos: …" aparece.
- **Entrar no Premium ainda trava a simulação, sem aviso:**
  - de 9,517 para 10,45 s de jogo em 3,5 s de relógio;
  - de 19,083 para 19,867 s.
- **Perda de contexto (P2).** Houve uma perda de contexto com exceção não tratada. Depois dela, o Premium ficou desligado: a caixa voltou a falhar na infantaria, sinal de que `premiumActive()` passou a ser falso. A saída para o Clássico é aceitável, mas o erro escapa como `pageerror`. Desconto meio ponto por isso.

### (d) Título e interface: 8

- **Título** (`s7-titulo-premium.png`): igual à rodada 7. Limpo, com cartões de facção nas cores certas e "Gráficos: Premium" ao lado do JOGAR.
- **Planalto:** agora lê como pedra clara e acinzentada (`s7-jogo-premium.png`, `s6-valid-final.png`), e o texto "planalto cinza" deixou de contradizer a tela.
  - Amostra no Premium: RGB(221,208,190), com saturação de cerca de 14% (era 19%).
  - Amostra no Clássico e no Leve: (120,117,110).
  - Ainda é um pouco quente, mas não confunde mais com a areia.
- **Grade de construção:** sutil. O inválido mostra por célula onde bate e onde cabe (vermelho e verde), o que ajuda.

## Problemas, por prioridade

### P1: o holograma válido continua uma laje brilhante, sem a forma do prédio
- **Reprodução:** `s6.js` (Fábrica) e `holo.js` (Usina), recortes `c-s6-holo-final.png` e `c-holo-power.png`.
- **O que acontece:**
  - o válido sai branco-ciano estourado, RGB(215,255,246) em vez de verde, e lê quase como cristal;
  - na Usina só se adivinham os topos das torres, na borda de cima;
  - o inválido melhorou: vermelho, e o QG aparece por baixo.
- **Causa provável:** o bloom pega o `hc*(0.9*lam+fres*2.5+…)` acima de 1. Sobre o planalto claro, tudo satura.
- **Correção** (no `HOLO` de `shaders.js`):
  - limitar a cor de saída a `min(...,0.9)` para ficar abaixo do limiar do bloom, ou desenhar o holograma depois do bloom;
  - aresta por `fwidth(vL)` com α≈0,9 e corpo com α≈0,2;
  - sombrear o corpo por `vL.z`, para separar torres, teto e chaminés;
  - mais verde (0.25,0.95,0.4) no válido.

### P2: perda de contexto WebGL vaza como exceção não tratada
- **Reprodução:** 1 vez em ~15 cargas, com a máquina carregada: `pageerror: framebuffer incompleto: 36061` (`FRAMEBUFFER_UNSUPPORTED`, `glcore.js:161`) e depois `CONTEXT_LOST_WEBGL`. Depois disso o Premium fica desligado.
- **Correção:**
  - antes de `glTarget` no redimensionamento ou no quadro (`premium.js:196-219`), checar `gl.isContextLost()`;
  - envolver a recriação dos alvos em `try/catch` que marca `premium.failed` e chama `notify`;
  - tratar `webglcontextrestored` para recompilar e voltar ao Premium sem recarregar a página.

### P3: entrar no Premium trava a simulação ~3 s, sem aviso (igual à rodada 7)
- **Reprodução:** `s7.js`. O jogo anda ~0,8 a 0,9 s em 3,5 s.
- **Correção:**
  - pausar e mostrar "Preparando gráficos…" durante o bake;
  - ou fazer o bake em pedaços por quadro.

### P4: cristais atravessam as unidades, e há um brilho estourado fixo no campo
- **Reprodução:** `c-s2-sel.png`, `c-s1-0x2-z1-final.png`. Os cristais altos furam o casco, e um ponto branco com bloom fica sempre no mesmo lugar.
- **Correção:**
  - encolher em z (ou esconder) as instâncias de cristal num raio de ~0,6 tile de cada unidade;
  - limitar a intensidade do brilho dos cristais (`min(spark, 1.2)` antes do bloom).

### P5: com quadros lentos, o marcador de ordem pode nunca aparecer
- **Onde:** `render.js:415-417`. A vida agora é contada em tempo real (`performance.now()`) e dura 0,7 s.
- **O que acontece:** com quadros de mais de 0,7 s (software sob carga, ou logo depois do bake), o marcador nasce e morre sem ser desenhado. Em `marc.js` havia 0 marcadores na captura seguinte ao clique direito, tanto na areia quanto no cristal.
- **Correção:** garantir no mínimo 3 quadros desenhados, por exemplo `m.frames++` e só remover quando `m.t ≥ 0.7 && m.frames ≥ 3`.

### P6: infantaria Cobalto dentro do campo ainda tem o contraste mais baixo dos três times
- **O que acontece:** o capacete azul sobre o cristal ciano é o pior caso (`c-s1-0x2-z1-final.png`, fila de cima). Âmbar e Brasa não sofrem com isso.
- **Correção:** rim light fraca na cor do time (fresnel 0,15 a 0,25) só nas unidades, ou uma sombra de contato mais escura sob a infantaria.

### P7: o planalto do Premium ainda é quente
- **Medida:** (221,208,190) no Premium contra (120,117,110) no Clássico.
- **Impacto:** já funciona como "pedra clara" e o texto não destoa mais. O holograma verde-claro sobre ele, porém, tem pouco contraste (ver P1).
- **Correção:** baixar mais 4 a 6 pontos de saturação e cerca de 8% de luminância no albedo do planalto.

### P8: avisos `GPU stall due to ReadPixels` a cada carga do Premium
- **Onde:** `terrain3d.js:858`. Os 4 avisos continuam.
- **Correção:** ler com PBO e fence, ou gerar a máscara na CPU.

## Variação em relação à rodada 7

| Problema da rodada 7 | Situação na rodada 8 |
|---|---|
| P1 seleção verde sobre o Âmbar | **Resolvido.** A seleção é branca |
| P2 holograma sem forma | **Não resolvido na prática.** A laje ficou mais transparente, mas o bloom estoura tudo em branco-ciano (P1) |
| P3 caixa ignora o corpo erguido | **Resolvido** (6/6 no zoom 1,8) |
| P4 unidades somem no cristal | **Bem melhor.** Sobram os cristais que atravessam o casco, o brilho fixo e a infantaria Cobalto (P4, P6) |
| P5 casco sem a cor do time | **Resolvido** (amarelo, vermelho e grafite com painéis azuis) |
| P6 planalto bege contra o texto "cinza" | **Quase resolvido** (P7) |
| P7 trava ao entrar no Premium | **Não mexido** (P3) |
| P8 marcadores contados em `dt` | **Mexido.** Agora em tempo real, mas surgiu o caso do quadro lento (P5) |
| (novo) | Perda de contexto não tratada (P2) |

## Veredito
O Premium agora se joga com confiança: os três times se leem pelo casco, a seleção é inequívoca e clique e caixa acertaram tudo o que testei. Faltam o holograma, que ainda não mostra que prédio vai ser posto, e a robustez a perda de contexto e ao trava do bake.
