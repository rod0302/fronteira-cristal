# Crítica: Design dos efeitos sonoros (som-r2)

**Nota: 5,5 de 10**

| Subitem | r2 | r1 |
|---|---|---|
| (a) Impacto e peso | **4,5** | 5,5 |
| (b) Caráter de cada arma | **6,5** | 5 |
| (c) Variação | **6,5** | 3,5 |
| (d) Espaço (reverb, eco, distância, estéreo) | **6** | 5 |
| (e) Interface | **5,5** | 6 |
| (f) Motores e ambiente | **4,5** | 5 |

Na mesma régua, a versão original fica em cerca de 3,5 e a rodada 1 em 5.

## Veredito

A rodada 2 consertou quase tudo o que a rodada 1 apontou como erro de engenharia:

- As variações agora variam: a correlação entre tomadas do canhão caiu de 0,91 para 0,73, e a do impacto de foguete de 0,94 para 0,36.
- O limite por classe parou de jogar fora o que importa: na batalha de referência, os descartes caíram de 491 para 23 de 1057 eventos, e os 12 tiros na tela tocam todos (antes, 7 de 12).
- Canhão, torre e obuseiro passaram a ter identidade própria: a distância espectral entre eles subiu de 4,9 dB para 11 a 18 dB.
- As explosões quase não perdem mais volume num notebook (de 0,9 a 1,5 LU, contra 5 LU antes).

Isso é trabalho real e medido.

**Mas o peso, que era o ponto forte, regrediu.** A tabela de loudness que deveria fixar a hierarquia (`SFX_LUFS`) é aplicada com um medidor interno errado: ele erra de -4,6 a +8,8 LU contra o BS.1770. Além disso, sons mono saem 3 dB mais baixos fora do centro exato da tela. Resultado em jogo:

- O canhão do blindado (-22,6 a -23,6 LUFS) soa no mesmo nível de uma rajada de fuzil (-24,8). Na rodada 1, o canhão ficava 9 LU acima.
- Assentar um prédio (-14,9) soa mais alto que o prédio explodindo (-16,2).
- "Energia restabelecida" (-9,9) soa 6 LU acima de qualquer explosão.
- Numa batalha grande, a explosão de prédio sobe só **+0,2 a +0,6 LU** acima do tiroteio: o maior evento do jogo some.

Motores e ambiente continuam fracos: um blindado andando dá -31 LUFS, o mesmo volume do vento, e os laços têm 2 s. Para AAA ainda falta muito.

**Sobre o pedido do Rodrigo** (medido em tempo real, `coletor_real.txt`):

- "Coletor pronto" tocou em 99,8 s.
- O sinal `deploy` e **"Harvester deployed" tocaram em 101,4 s**, pelo pacote de vozes, quando o Coletor chegou ao cristal. "Inimigo detectado" e o pulso de radar tocaram em 97,3 s.
- O pedido de frases está atendido. O efeito que acompanha a frase, porém, é abafado por ela: veja o problema 9.

## Pontos fortes (com medidas)

- **Variação de verdade nas armas e explosões** (`efeitos/variacao.txt`, contra `variacao_r1.txt`). Correlação média entre tomadas, r1 → r2:

  | Som | r1 | r2 |
  |---|---|---|
  | canhão | 0,91 | 0,73 |
  | torre | 0,94 | 0,68 |
  | obuseiro | 0,92 | 0,68 |
  | impacto de granada | 0,95 | 0,63 |
  | impacto de foguete | 0,94 | 0,36 |
  | impacto de artilharia | 0,93 | 0,59 |
  | assobio | 0,97 | 0,14 |
  | boom | 0,77 | 0,54 |

  Além disso, a distância espectral dentro do fuzil subiu de 4,9 para 10,2 dB e a da metralhadora de 3,6 para 11,7 dB.
- **Prioridade corrigida.**
  - Batalha de referência de 30 s (`batalha_r2/batalha_descartes.json`): 23 descartes de 1057, todos `hit_bullet` por intervalo mínimo. Na r1 foram 491. O obuseiro toca 7 de 7 vezes (antes, 2 de 7).
  - Cena "batalha longe contra tiros na tela" (`prioridade_r2/`): os 12 tiros na tela tocam (r1: 7 de 12).
- **Caráter das armas pesadas** (`variacao.txt`, distância entre sons):

  | Par | r1 | r2 |
  |---|---|---|
  | canhão e torre | 4,9 dB | 17,9 dB |
  | canhão e obuseiro | 6,2 dB | 11,1 dB |
  | impacto de granada e de foguete | 6,4 dB | 18,1 dB |

  O impacto de foguete agora é agudo: centroide de 5,4 kHz, contra 300 Hz da granada. A torre tem um anel de cano visível no espectrograma (`efeitos/png/armas_r2.png`).
- **Sobrevive no notebook** (`transientes.txt`, passa-altas de 250 Hz). Perda r1 → r2:
  - canhão: de 9,3 para 2,8 LU
  - torre: de 9,7 para 1,8 LU
  - boom: de 5,0 para 0,9 LU
  - bigboom: de 4,8 para 1,5 LU

  A energia abaixo de 80 Hz no boom caiu de 89% para 54%.
- **Banco pronto cedo para o que importa** (`tempo_banco.txt`, carga 14,7 em 4 núcleos):
  - interface em 0,3 s, alerta e radar em 1,1 s, `place` em 1,4 s, `deploy` em 1,5 s, fuzil em 1,8 s;
  - todos os sons com uma tomada em 12,4 s, laços entre 12,7 e 15,9 s;
  - nenhum descarte por banco vazio (`sfxDropped` = {}). Na r1, o radar ficava pronto só em 22,9 s.
- **Estéreo e distância.**
  - Na borda da tela, o lado chega a +10 a +12 dB (`distancia_r2.txt`).
  - Fora da tela, o brilho cai com a distância: o centroide do canhão vai de 576 Hz para 231 Hz a 470 px.
  - A proporção cauda/direto cresce com a distância: canhão de -36 para -28,5 dB, fuzil de -42 para -29 dB. Na r1 ela não crescia.
  - O retorno do reverb agora passa pelo barramento de efeitos.
- **Sem estalos nas emendas dos laços.** Em todos os laços, o salto na emenda fica abaixo do percentil 99,9 da derivada (`lacos.txt`). O vento tem 24 s de ruído sem repetição: a autocorrelação fica em 0,000 a 0,006 em todos os atrasos testados (r1: 0,909 em 3 s).
- **A interface não "bombeia" o limitador.** O clique tem pico de -1,2 dBFS na cadeia, mas a batalha ao redor não perde nível (variação de -0,3 a +0,2 dB, `batalha.txt` e o cálculo da seção 5).

## Problemas (do mais grave ao menos grave)

### 1. A hierarquia de volume não é a da tabela, porque o medidor interno está errado (peso perdido)

- **Onde:** `src/sfxbank.js:575-600` (`loudnessOf`), aplicado em `:618-621`.
- **Duas falhas no medidor:**
  - **Janela parcial.** Em `:597`, `acc / Math.min(win, i + 1)` mede janelas de 100 a 300 ms no início do som, em vez de 400 ms. Isso infla o loudness de sons com ataque forte, que então são abaixados. O canhão mede -14,5 com a janela parcial e -20,4 só com janelas cheias (`loud_port.txt`, porta exata do código: reproduz o `loudnessOf` do jogo com erro de 0,0 dB).
  - **Filtro de ponderação errado.** O "filtro K" de `:580` é um passa-altas de 100 Hz de 2ª ordem. O BS.1770 corta em 38 Hz. Sons graves são medidos baixos demais e sobem.
- **Erro do medidor contra o BS.1770** (`hierarquia_banco.txt`):

  | Som | Erro |
  |---|---|
  | powerup | +8,8 LU |
  | lose | +8,1 LU |
  | place | +7,0 LU |
  | win | +3,9 LU |
  | detect | -4,6 LU |
  | hit_rocket | -4,5 LU |
  | hit_shell | -4,1 LU |
  | boom_small | -3,9 LU |
  | cannon | -3,8 LU |

- **Agravante:** buffers mono são medidos num canal só (`:612-614`). No jogo, sem panner, o mono sai nos dois canais (+3 dB); com qualquer panner, sai a -3 dB disso (veja o problema 3).
- **Em jogo** (cadeia completa, `hierarquia_cadeia.txt` e `pan.txt`, som fora do centro exato), comparado com a r1:

  | Som | r2 (LUFS) | r1 (LUFS) |
  |---|---|---|
  | powerup | -9,9 | -15,7 |
  | place | -14,9 | -11,3 |
  | erro | -16,1 | — |
  | bigboom | -16,2 | -9,6 |
  | boom | -18,2 | -9,0 |
  | canhão | -22,6 a -23,6 | -12,0 |
  | hit_shell | -24,1 | -14,0 |
  | fuzil | -24,8 | -21,2 |
  | hit_rocket | -25,2 | -15,0 |

  Resumo: o canhão e as explosões caíram de 7 a 11 LU, enquanto o fuzil ficou praticamente onde estava.
- **Como reproduzir:**
  - `node efeitos/scripts/loud_interno.js <rts> loud_interno.json`
  - `python3 efeitos/scripts/loud_port.py efeitos/wav`
  - `node efeitos/scripts/render_scene.js <rts> efeitos/cenas_unicas.json saida/`, seguido de `medir.py`

### 2. Numa batalha grande, a explosão de prédio não aparece

- **Cena:** `efeitos/cena_batalha_grande.json`, com 16 soldados, 6 batedores, 4 lança-foguetes, 8 blindados, 3 torres, 3 obuseiros e 2 prédios explodindo.
- **Medida:** a batalha dá -11,0 LUFS. O `bigboom` em 14 s sobe **+0,2 LU** e o de 21 s sobe +0,6 LU. A explosão do Coletor sobe +1,2 LU (`grande_descartes.txt`).
- **Causas:**
  - o problema 1 (o bigboom está só 6 LU acima de um fuzil);
  - a parede de tiros leves, com LRA de 2,2 LU na batalha de referência;
  - nenhuma regra de "momento" (abaixar armas leves quando um prédio cai).
- **Esperado num RTS AAA:** o prédio caindo fica de 6 a 10 LU acima da batalha.

### 3. Salto de 3 a 4 dB dos sons mono ao sair do centro da tela

- **Onde:** `src/audio.js:408`. A condição `if (place.pan)` faz o som com pan exatamente 0 não passar pelo `StereoPanner`.
- **Mecanismo:** o mono vai direto ao barramento estéreo e é duplicado em L e R (+3 dB). Com qualquer pan diferente de 0, o panner de potência constante aplica 0,707.
- **Medida** (`pan.txt`): fuzil a 0 px dá -21,3; a 1 px dá -24,9. Metralhadora: -22,3 contra -26,4. Morte de soldado: -26,2 contra -29,2. Canhão e boom, que são estéreo, não mudam.
- **Efeito:** todos os sons mono soam cerca de 3 dB abaixo do que a tabela promete, e quem estiver exatamente no centro "pula" 3 dB.
- **Sons mono afetados:** fuzil, metralhadora, lança-foguetes, `hit_bullet`, `death_inf` e `incoming`.

### 4. O roubo de vaga corta a mesma voz várias vezes e o limite por classe deixa de valer

- **Onde:** `src/audio.js:375-380` escolhe a vítima e `:430` faz o corte. Mas a vítima só sai de `classActive` no `onended` (`:434`), uns 60 ms depois.
- **Consequência:** nesse intervalo, a mesma voz agonizante é escolhida de novo como "a mais fraca", o som novo toca sem liberar vaga, e a classe passa do limite.
- **Medida na batalha grande** (`grande_vitimas.txt`, `kill()` instrumentado):
  - 2094 chamadas de `kill()` para 1045 vozes distintas, ou seja, **1049 roubos de uma vaga que já estava sendo liberada**;
  - 2094 dos 2367 sons tocados entraram com a classe cheia: a batalha vive saturada.
- **O roubo também corta explosões no meio:**

  | Som | Vozes cortadas | Buffer restante (média) | Máximo |
  |---|---|---|---|
  | boom | 11 | 40% | 78% |
  | hit_arty | 11 | 53% | 96% (cortado logo depois de começar) |
  | boom_small | 4 | 32% | 60% |

  Os destroços e a cauda, que são o "peso", somem com um corte de 12 ms (`:430`).

### 5. Ataques fracos e corpo ainda no grave

- **Onde:** receitas de explosão em `src/sfxbank.js:258-342`.
- **Estalo contra corpo** (`transientes.txt`, cadeia: 0 a 5 ms contra 20 a 120 ms): boom -1,3 dB, bigboom -2,1, boom_harv -2,3, hit_arty -2,7, obuseiro -2,7, torre -1,1, canhão +2,5. O anúncio prometia "estalo de 0 a 5 ms", mas o estalo não se destaca do corpo. Para comparar, o fuzil tem +9,4 dB.
- **"Corpo nos médios" não aparece na medida:** a energia em 150 a 600 Hz fica entre 5% e 10% em todas as explosões. Abaixo de 80 Hz ainda ficam de 54% a 77%.
- **Picos de envelope tardios:** o pico do bigboom chega em 956 ms e o do boom_harv em 116 ms.

### 6. Variação ainda ausente em sons frequentes

Medidas de `variacao.txt`:

- **Morte de infantaria:** correlação de 0,93 a 0,98. A receita usa frequências fixas (`sfxbank.js:344-349`); só os estalos variam. É o mesmo erro da r1, sem correção.
- **`place`:** 0,98. **`unit`:** 0,96 (a receita `:385-392` não usa o gerador aleatório). **`sell`:** 0,94.
- **`select`:** as 2 variações são idênticas bit a bit (`:413-417`, sem `rng`).
- **`credits`:** 3 das 5 variações são idênticas bit a bit. A nota é sorteada de 5 opções na gravação (`:426`), e a mesma nota saiu três vezes.
- **Uma tomada só:** `deploy`, `detect`, `alert`, `ready`, `error`, `powerup`, `powerdown` e todos os laços.

### 7. Motores e ambiente quase inaudíveis e repetitivos

- **Volumes em jogo** (`motores.txt`, ganho de `audio.js:537`):

  | Laço | LUFS | Notebook |
  |---|---|---|
  | 1 blindado andando | -31,2 | -37,5 |
  | 3 blindados | -26,4 | — |
  | batedor | -30,7 | — |
  | Coletor | -32,6 | -39,1 |
  | moagem | -32,8 | — |
  | zumbido de 4 prédios | -27,0 | -37,4 (perde 10,4 LU) |
  | vento | -31,0 | — |

- **Comparações:**
  - Um blindado andando soa no mesmo nível do vento.
  - Na batalha de referência (-13,7 LUFS), os motores ficam 17 LU abaixo, ou seja, somem.
  - Na r1, três blindados davam -20,9 LUFS; agora dão -26,4.
- **Repetição:** os laços têm 2,0 s. A moagem tem 26 "tinidos aleatórios" que se repetem idênticos a cada 2 s (`sfxbank.js:531`), e o rangido do Coletor bate a cada 0,5 s. O padrão é audível.
- **Sem dinâmica de motor:** não há rotação ou carga ligada à velocidade, só ±6% de `playbackRate` (`audio.js:549`).
- **Vento estreito:** correlação L/R de 0,80. Os dois lados usam o mesmo ruído longo, a partir do mesmo ponto (`sfxbank.js:93`, com início 0 para os ruídos 'L', e `:536-538`). Um leito de ambiente deveria ficar abaixo de 0,3.

### 8. Interface: erro alto demais, créditos inaudíveis

- **Erro:** -16,1 LUFS, mais alto que a explosão de prédio (-16,2) e 7 LU acima do clique. Repetido (clicar sem dinheiro), cansa. A versão original tinha -38.
- **Créditos:** -34,3 LUFS, com intervalo mínimo de 2 s (`audio.js:335`). Numa partida real, foram 2 tiques em 43 s (`coletor_real.txt`). Na batalha: 0 de 21 bandas acima do fundo (`batalha.txt`; r1: 1 de 21). O "dinheiro entrando" clássico de RTS não existe.
- **Clique e seleção na batalha:** 2 e 3 de 21 bandas acima do fundo. A melhora sobre a r1 (1 e 3) é pequena. A sirene caiu de 9 para 3 de 21 bandas, e `ready` de 5 para 3.
- **Assentar prédio:** 93% da energia abaixo de 80 Hz. É o efeito mais alto em fone (-14,9) e perde 12 LU num notebook.

### 9. Sincronia e o efeito do "Harvester deployed"

- **Torre atrasada:** a torre dispara 84 ms depois do clarão na tela, porque o servo vem antes (`sfxbank.js:192`, `t0 = 0.08`). Um atraso de áudio acima de cerca de 45 ms já se percebe.
- **`deploy` abafado pela voz:**
  - O braço do Coletor bate no chão em 0,60 s (`sfxbank.js:400`).
  - A voz abaixa os efeitos para 0,45 (-7 dB) a partir de 0,65 s (`voice.js:173` com `CUE_LEAD.deploy = 0.55`, mais 0,1 s em `:269`).
  - O `deploy` vai pelo barramento de efeitos (`audio.js:334`, sem `bus`), então é abafado junto.
  - O resultado: a pancada e o rotor do momento pedido pelo Rodrigo tocam 7 dB abaixo.
- **Respostas das tropas abaixam os efeitos:** cada resposta a seleção ou ordem abaixa os efeitos para 0,6 (-4,4 dB) durante a fala (`voice.js:341`). Em micro ativo, isso pode chegar a uma vez por segundo: as armas passam a batalha abafadas.

### 10. Distância curta e reverb inaudível na tela

Medidas de `distancia_r2.txt`:

- **Alcance:**
  - O canhão a 470 px fora da tela fica 15,6 LU abaixo, e a 670 px dá -52 LUFS: inaudível.
  - O boom some (MUDO) a 970 px.
  - O fuzil some a 470 px.
  - "Uma batalha do outro lado do vale" só se ouve para prédios (bigboom a -21,5 LUFS a 470 px).
- **Reverb do vale na tela:** cauda/direto de -36 dB no canhão e -42 dB no fuzil. Para armas na tela, o reverb do vale é inaudível.
- **Bordas:** o fuzil na borda fica 3,5 LU abaixo do fuzil no centro, por causa do problema 3.

### 11. Faltam sons que um RTS AAA tem

- passos e equipamento de infantaria;
- projétil em voo (canhão, granada);
- prédio pegando fogo ou danificado: a fumaça e o fogo estão em `fx.js:183-197` e `render.js:241-245`, sem som;
- fábrica trabalhando;
- descarga do Coletor e processamento da refinaria;
- reparo contínuo (hoje só um disparo ao ligar);
- impacto por material: bala em blindado soa igual a bala na terra (`combat.js:220/228`, `audio.js:447`);
- morte diferente para o obuseiro e o blindado (os dois usam `boom`).

## O que faria a nota subir (em ordem de impacto)

1. **Consertar `loudnessOf`.** Usar só janelas cheias de 400 ms (ou o máximo de curto prazo de verdade) e o filtro K real (prateleira de 1681 Hz e passa-altas de 38 Hz). Somar +3 dB para buffers mono. Depois, conferir com `loud_port.py` que o erro fica abaixo de 1 LU, e refazer a tabela para canhão ≥ fuzil + 6 LU, prédio ≥ canhão + 6 LU, `place`, `powerup` e `error` abaixo do canhão.
2. **Panner sempre.** Ligar o `StereoPanner` mesmo com pan 0 (`audio.js:408`), ou fazer os buffers do banco em estéreo.
3. **Roubo de vaga correto.** Tirar a vítima de `classActive` no momento do `kill()`. Não roubar sons com menos de 30% de reprodução numa classe "boom". Reservar 2 vagas de "boom" para prédios e veículos.
4. **Momento do grande evento.** Quando tocar bigboom, boom_harv ou boom na tela, abaixar armas leves e impactos de bala de 4 a 6 dB por cerca de 1 s.
5. **Estalo real nas explosões e médios de verdade.** Camada de 0 a 5 ms com +6 dB sobre o corpo, 150 a 600 Hz acima de 20% da energia e menos sub.
6. **Motores.** Subir de 6 a 8 LU, alongar os laços para 6 a 8 s com eventos aleatórios separados (os tinidos como disparos avulsos), descorrelacionar o vento (outro ponto do ruído por lado) e dar harmônicos acima de 200 Hz ao zumbido.
7. **Variação** em `death_inf`, `select`, `credits` (sortear na hora de tocar), `unit`, `place` e `deploy`.
8. **Interface.** `error` de 6 a 8 LU mais baixo. `credits` mais presente, em 2 a 4 kHz, com tiques mais frequentes durante a descarga. Tirar o servo da frente da torre, ou atrasar o servo para antes do disparo. Mandar `deploy` pelo `cueBus`.
9. **Sons ausentes.** Fogo em prédio, passos, voo de projétil e impacto em metal.

## Scripts e saídas

Tudo fica em `/home/claude/criticos/som-r2/efeitos/`.

- **Banco de efeitos.**
  - `scripts/dump_bank.js` exporta o banco, com a taxa de 32 kHz do próprio buffer, para `wav/` (r2, 104 buffers) e `wav_r1/`.
  - `scripts/medir.py` gera `medidas_banco.txt`.
  - `scripts/variacao.py` gera `variacao.txt` e `variacao_r1.txt`.
- **Medidor interno.**
  - `scripts/loud_interno.js` gera `loud_interno.json`.
  - `scripts/loud_port.py` gera `loud_port.txt`.
  - O resumo está em `hierarquia_banco.txt`.
- **Cadeia completa** (`scripts/render_scene.js`: grava a saída real do jogo em `OfflineAudioContext`, com `Math.random` semeado, conta descartes e roubos de vaga e registra as vozes cortadas).
  - Sons isolados: cenas em `cenas_unicas.json`, saídas em `cadeia_r2/` e `cadeia_r1/`, resumo em `hierarquia_cadeia.txt`.
  - Batalha de referência: `cenas_batalha.json`, saídas em `batalha_r2/` e `batalha_r1/`, análise em `batalha.txt` (via `scripts/batalha.py`).
  - Batalha grande: `cena_batalha_grande.json`, saídas em `grande_r2/`, `grande_descartes.txt` e `grande_vitimas.txt`.
  - Prioridade: `prioridade_r2/` e `prioridade_r1/`.
  - Distância: `cenas_dist2.json`, saídas em `dist_r2/`, análise em `distancia_r2.txt` (via `scripts/distancia.py`).
  - Pan: `cenas_pan.json`, saídas em `pan_r2/`, resumo em `pan.txt`.
  - Motores: `cenas_motores.json`, saídas em `motores_r2/`, resumo em `motores.txt`.
- **Outras análises.**
  - `scripts/transientes.py` gera `transientes.txt`.
  - `scripts/lacos_r2.py` gera `lacos.txt`.
  - `scripts/espectrogramas.py` gera `png/armas_r2.png` e `png/explosoes_r2.png`.
- **Tempo real.**
  - `scripts/tempo_banco.js` gera `tempo_banco.txt`.
  - `scripts/coletor_real.js` gera `coletor_real.txt`.

**Ressalva.** A máquina estava com carga de 12 a 15 durante as medidas. Os tempos de `tempo_banco.txt` são um pior caso. As cenas offline não dependem da carga.
