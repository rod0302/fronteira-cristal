# Crítica: Design dos efeitos sonoros (som-r1)

**Nota: 5 de 10**

| Subitem | Nota |
|---|---|
| (a) Impacto e peso | 5,5 |
| (b) Caráter de cada arma | 5 |
| (c) Variação | 3,5 |
| (d) Espaço (reverb, eco, distância, estéreo) | 5 |
| (e) Interface | 6 |
| (f) Motores e ambiente | 5 |

A versão anterior, na mesma régua, ficaria por volta de 3,5. Ela não tinha impacto de bala, de granada nem de foguete, não tinha morte de infantaria nem motores, e o tiro de fuzil tinha -37 LUFS de pico momentâneo. Esta rodada sobe de patamar. Ainda está longe de AAA.

## Veredito

O salto em relação à versão anterior é real e medível. Agora cada atirador tem um som próprio, há camada de impacto, o vento tem duas camadas, existem laços de motor e a mixagem tem cola, limitador, reverb e eco. O tiro do soldado ficou 15,6 LU mais alto (de -37,2 para -21,6 LUFS no pico momentâneo) e passou a se distinguir da metralhadora (distância espectral de 15 dB entre os dois).

Mas o "banco premium" tem três falhas de engenharia que um estúdio AAA não deixaria passar:

1. **As variações quase não variam.** Isso vem de um erro de semente no gerador aleatório. Os 5 sons de créditos são idênticos bit a bit, e os canhões e impactos têm correlação de 0,90 a 0,95 entre as próprias "variações".
2. **O limite por classe é "quem chegou primeiro leva".** Numa batalha típica, 46% dos sons somem, incluindo 5 de 7 disparos do obuseiro. Uma batalha fora da tela, quase inaudível, cala 5 de 12 tiros de blindado que estão na tela.
3. **A hierarquia de volume está quebrada.** A normalização por pico deixa o assobio de artilharia chegando (-7,0 LUFS) mais alto que a explosão de prédio (-8,3) e 4,8 LU acima do canhão (-11,8). Num alto-falante de notebook a diferença sobe para 13,9 LU.

O peso das explosões está quase todo abaixo de 80 Hz (de 78% a 91% da energia), com o pico 130 a 175 ms depois do início e um transiente que não se destaca do corpo (0 dB). Isso soa encorpado num fone, mas embolado e sem estalo, e encolhe de 5 a 10 LU num alto-falante pequeno.

**Sobre o pedido do Rodrigo.**
- "Harvester deployed" funciona. Verifiquei em partida real: o efeito `deploy` tocou em 84,35 s e a fala em 84,8 s, pelo pacote de vozes.
- **Porém o banco de efeitos demora a ficar pronto, e enquanto isso o jogo fica mudo para os efeitos.** Numa partida real, "Inimigo detectado" foi dito em 3,8 s, mas o pulso de radar que deveria acompanhar a fala não tocou: o `sfxPlayLog` estava vazio, porque o som `detect` só ficou pronto em 22,9 s com a máquina carregada.

## Pontos fortes (com medidas)

- **Cada atirador tem seu som.** Pela distância espectro-temporal (`variacao.txt`), fuzil e metralhadora ficam a 15,0 dB, e fuzil e foguete a 17,9 dB. Na versão anterior, soldado e batedor usavam o mesmo `bullet`.
- **Camadas de impacto novas.** `hit_bullet` tem 6 variações que realmente diferem (correlação de 0,09 a 0,25), com ricochete em metade delas. Também há `hit_shell`, `hit_rocket`, `hit_arty` e `death_inf`. Antes, só a artilharia tinha impacto (`boom`).
- **Corpo e presença muito maiores.** Com a cadeia completa, o pico momentâneo foi de -16,8 para -8,6 LUFS na explosão de veículo, de -14,3 para -8,3 no prédio e de -20,9 para -11,8 no canhão (`medidas_cadeia_*.txt`).
- **Sem estalos nem cortes.** Nenhum buffer termina cortado (todos caem a -180 dB no fim, menos a artilharia, de -62 a -70 dB). Não há amostra acima de 0,999 e, nos impulsos, só um degrau isolado foi encontrado (`arty_0` em 0,502 s). O limitador segura a batalha em -0,35 dBTP.
- **Bigboom, em parte.** Nele a variação existe: correlação de 0,31 a 0,38 entre versões, com 3 ou 4 explosões encadeadas. Também é o único som que se ouve de longe como prometido: a 1500 px da tela ainda dá -19,3 LUFS.
- **Estéreo e lado funcionam.** Um canhão 100 px à direita da tela fica 12,3 dB mais forte no canal direito. Na batalha, a correlação L/R é 0,78, contra 0,84 antes, um pouco mais larga.
- **Motores existem.** Três blindados andando dão -20,9 LUFS, no nível de uma rajada de fuzil (-21,6), uma proporção boa. A versão anterior não tinha nenhum motor.

## Problemas (do mais grave ao menos grave)

1. **As variações são quase cópias, por um erro de semente.**
   - Onde: `src/sfxbank.js:541` usa `seed = 1000 + i*77 + name.length*13` com o LCG de `src/map.js:4-9`. Sementes vizinhas dão primeiros números quase iguais. Para `cannon`, o primeiro número sai 0,654, 0,684, 0,714 e 0,743, e o segundo 0,057, 0,041, 0,026 e 0,010. Ou seja, o tom do canhão (`p = k.r(0.9,1.08)`) varia só cerca de 1,6% entre as 4 variações.
   - Efeito medido (`variacao.txt`): `credits` tem 5 variações bit a bit idênticas. A nota sorteada é sempre o índice 3 (2349 Hz), uma **regressão**, porque a versão anterior sorteava entre 5 notas a cada tique. `select` tem correlação de 1,00 entre as duas variações. A correlação de pico entre variações é 0,98 em `place`, 0,97 em `death_inf`, 0,95 em `hit_shell`, 0,94 em `turret`, 0,94 em `hit_rocket`, 0,93 em `hit_arty`, 0,91 em `cannon` e 0,92 em `arty`. A diferença dentro do mesmo som (3,5 a 4,1 dB) é quase igual à diferença entre sons diferentes (veja o problema 5).
   - Também têm uma única gravação: `deploy`, `detect`, `alert`, `ready`, `error` e todos os laços.
   - Como reproduzir: `node scripts/dump_bank.js` e depois `python3 scripts/variacao.py wav`.

2. **O limite por classe descarta pela ordem de chegada, não pela importância nem pela distância.**
   - Onde: `src/audio.js:320` (`CLASS_CAP = {shot:14, hit:10, ...}`) e `:338`. O comentário diz "o excedente mais fraco não toca", mas o código descarta o que chegar depois, mesmo que seja o mais forte.
   - Os buffers são longos: canhão 2,2 s, torre 2,4 s, obuseiro 3,0 s. Eles ocupam as vagas por muito tempo.
   - Cena de batalha de 30 s (`batalha_nova/batalha_descartes.json`): de 1057 eventos, 491 foram descartados. O obuseiro perdeu 5 de 7 disparos e o assobio de chegada perdeu 4 de 7, ambos por `cap_shot`. A morte de infantaria perdeu 4 de 9 por `cap_hit`, abafada pelos impactos de bala. O fuzil perdeu 123 de 222, dos quais 101 pelo `gap` global de 40 ms por nome: seis soldados soam como três.
   - Cena `prioridade/`: uma batalha 600 a 1000 px fora da tela, quase inaudível, calou **5 de 12 tiros de blindado na tela**.
   - As distâncias de alcance agravam o problema: canhão 1300 px, obuseiro 1700 px e bigboom 2200 px, num mapa de 2560 px com tela de 1060 px (`audio.js:289-298`). Quase todo o mapa ocupa as vagas.

3. **A hierarquia de volume está quebrada, porque cada variação é normalizada pelo pico.**
   - Onde: `sfxbank.js:525` normaliza todo buffer para pico 0,9. Um seno puro, como o assobio, fica com loudness enorme (-1,9 LUFS no buffer cru). Com `vol: 0.32` (`audio.js:292`), o assobio chega a **-7,0 LUFS momentâneo**. Para comparar: explosão de prédio -8,3, explosão de veículo -8,6, impacto de artilharia -10,1, canhão -11,8 e fuzil -21,6.
   - Num notebook (passa-altas de 250 Hz, `altofalante.txt`), o assobio fica em -7,0, contra -20,9 do canhão e -17,7 do impacto que ele anuncia. O aviso fica 10,7 LU acima do próprio impacto.
   - Também invertidos: `place` (prédio assentado, -11,3) soa mais alto que o canhão do blindado (-11,8).

4. **As explosões são lama de graves sem estalo.**
   - Medidas (`transientes.txt`): em `boom`, `bigboom`, `hit_arty` e `arty`, o pico da amostra chega entre 130 e 175 ms. Os primeiros 15 ms não passam do corpo (de -0,2 a +0,4 dB). A versão anterior tinha `boom` com +5,0 dB de transiente.
   - A energia abaixo de 80 Hz vai de -0,4 a -1,1 dB do total, ou seja, de 78% a 91%.
   - Num notebook, perdem de 4,8 a 10,0 LU (artilharia -10,0, canhão -9,1, torre -9,7).
   - A batalha inteira sai em -10,6 LUFS integrados, com PLR de 10,3 dB e LRA de cerca de 2,5 LU. Isso é uma parede comprimida, contra -19,8 LUFS e PLR de 17,7 dB antes. Sobra pouco espaço dinâmico para o grande momento.

5. **Canhão, torre e obuseiro soam iguais. Granada e foguete também.**
   - Onde: as receitas de `cannon`, `turret` e `arty` (`sfxbank.js:172-211`) são a mesma estrutura (estalo, ruído em lowpass que desliza, seno grave, sino e duas caudas marrons), só que meio tom abaixo.
   - Distâncias medidas: cannon e turret ficam a 4,9 dB, quando a variação interna do canhão é 3,8 dB. Cannon e arty ficam a 6,2 dB. hit_shell e hit_rocket ficam a 6,4 dB, contra 4,0 dB de variação interna.
   - Os espectrogramas (`png/armas_pesadas.png`) mostram seis manchas quase idênticas.
   - Toda morte de veículo usa o mesmo `boom`: coletor, batedor, blindado e obuseiro (`combat.js:298`).
   - Não dá para saber pelo som se quem atirou foi a torre inimiga ou o seu blindado.

6. **O banco fica pronto tarde e não há reserva.**
   - Onde: `audio.js:340` (`if (!bank) return`) e os laços só começam depois do banco inteiro (`audio.js:120`).
   - Medido (`tempo_banco.txt`, com a máquina disputada, carga 11,6 em 4 núcleos): `rifle` em 2,4 s, `cannon` em 7,7 s, `boom` em 13,7 s, `bigboom` em 17,7 s, `place` em 20,8 s, `deploy` em 21,9 s, `detect` em 22,9 s, motores em 23,8 a 24,1 s e vento em 27,3 s. Com o jogo pausado, o total foi 5,5 s.
   - Na partida real (`partida_real.json`), "Inimigo detectado" foi dito em 3,8 s sem o pulso de radar. A versão anterior sintetizava ao vivo e nunca ficava muda.

7. **Os laços são curtos, repetem e emendam mal.**
   - Vento (`sfxbank.js:17` mais `:483`): o ruído base é um buffer de 3 s em laço, então o "vento de 12 s" é o mesmo ruído quatro vezes. A correlação do sinal com ele mesmo deslocado em 3,00 s é **0,909**, contra 0,007 a 2,98 s (`lacos.txt`). Um ouvido treinado percebe o padrão.
   - Motores: laços de 1,92 s (`seamLoop`, `sfxbank.js:504`). As esteiras do blindado batem a cada 0,125 s, mas na emenda o intervalo passa a 0,131 s e a batida em t=0 é apagada pelo cruzamento: tropeço rítmico a cada 1,92 s. Na metralhadora leve, o intervalo na emenda é 0,723 s.
   - Há um único laço por tipo, com o lado médio de todas as unidades (`audio.js:452-486`). Dois blindados em lados opostos viram um motor no centro.
   - Não existe marcha lenta, partida, parada ou rotação ligada à velocidade.
   - O zumbido da base (60 e 120 Hz) cai de -30,8 para -45,5 LUFS num notebook: praticamente some. O motor do coletor (centroide de 57 Hz) perde 8,8 LU.

8. **Num combate, a interface é mascarada** (`batalha.txt`, SNR em 21 bandas de 1/3 de oitava).
   - O clique fica acima da batalha em 1 de 21 bandas (SNR banda larga -15,2 dB). Na versão anterior ficava +2,5 dB acima, porque a batalha era mais baixa.
   - Créditos: 1 de 21 bandas. Seleção: 3 de 21.
   - Só a sirene (9 de 21) e o erro (8 de 21) atravessam.
   - A batalha subiu 9 LU e a interface não subiu junto.

9. **Distância e espaço são mais fracos do que o anúncio diz.**
   - O volume dá um degrau ao sair da tela. Na tela, a borda é atenuada em até 25% (`audio.js:270-273`). Fora dela, a queda começa de 1,0. Resultado: o canhão na borda dá -12,9 LUFS e 100 px fora da tela dá -12,4, mais alto.
   - O "abafado" quase não age em sons graves: a 600 px, o filtro está em 4,5 kHz e o centroide do canhão não muda (122 a 125 Hz).
   - Proporção entre cauda e som direto: -18,5 dB na borda e -20,3 dB a 1000 px, sem ganho com a distância. A cauda gravada no próprio buffer manda no resultado.
   - O eco das mesas no fuzil fica 29 dB abaixo do som direto (inaudível), e o reverb a 500 ms fica 50 dB abaixo.
   - O retorno do reverb (`audio.js:82`) vai direto para a saída geral e não abaixa quando o locutor abaixa os efeitos.

10. **Detalhes menores.**
    - O alarme não abaixa mais os efeitos sozinho, ao contrário da versão anterior (`duck(1.8)`). Agora depende da fala.
    - `repair` tem centroide de 12 kHz: chiado fino.
    - `lose` é cortado em -45 dB no fim do buffer.
    - Faltam sons esperados num RTS AAA: passos de infantaria, voo do projétil, prédio pegando fogo ou danificado, descarga do coletor na refinaria, construção em andamento e morte diferente por tamanho de veículo.

## O que faria a nota subir (em ordem de impacto)

1. **Sementes de verdade.** Embaralhar a semente (hash, como o `map.js:12` já faz) ou descartar os primeiros números. Corrigir `credits` para sortear a nota no momento de tocar. Depois, conferir com `variacao.py` que a correlação entre variações fica abaixo de 0,7.
2. **Prioridade de vozes.** Calcular a prioridade como importância do tipo vezes o volume efetivo (distância), roubar a voz mais fraca em vez de descartar a nova, reservar vagas para o que está na tela, encurtar as caudas e mandar a cauda distante para um laço de "batalha ao longe". Trocar o `gap` global por nome por um `gap` por unidade ou por região.
3. **Normalizar por loudness, não por pico.** Escrever uma tabela de alvos em LUFS por classe (por exemplo, prédio > veículo > canhão > impactos > fuzil > interface) e corrigir o `incoming` para ficar 6 a 10 LU abaixo do impacto.
4. **Transiente e médios nas explosões.** Uma camada de estalo de 0 a 5 ms com +6 dB sobre o corpo, energia em 150 a 600 Hz para sobreviver em notebook, e menos sub. Mirar em -16 a -18 LUFS na batalha.
5. **Uma identidade por arma.** Torre com servo e cano metálico mais agudo, obuseiro com sopro longo e pressão, blindado mais seco, foguete com impacto agudo, e morte de veículo por tamanho.
6. **Gerar efeitos ao vivo até o banco ficar pronto.** Ou gravar primeiro o que é usado nos primeiros 30 s (`detect`, armas, `place`, `deploy`).
7. **Laços melhores.** Ruído-base com 15 s ou mais (ou gerado por segmento), laços de motor com número inteiro de batidas, um laço por unidade próxima, rotação ligada à velocidade e dois harmônicos acima de 200 Hz no zumbido e no coletor.
8. **Interface acima da batalha.** Subir clique, créditos e seleção na faixa de 2 a 5 kHz, ou abaixar levemente os efeitos durante cada clique.

## Scripts e saídas

Tudo fica em `/home/claude/criticos/som-r1/efeitos/`:

- **Banco de efeitos.**
  - `scripts/dump_bank.js` exporta o `SFX_BANK` para `wav/` (87 buffers).
  - `scripts/medir.py` mede pico, LUFS, crista, ataque, cauda, bandas e correlação, e gera `medidas_banco.txt`.
  - `scripts/variacao.py` mede a variação dentro de cada som e a distância entre sons, e gera `variacao.txt`.
- **Cadeia completa do jogo.**
  - `scripts/render_scene.js` grava a saída real do jogo num OfflineAudioContext, com `Math.random` semeado e a contagem de descartes por motivo.
  - Saídas: `cadeia_nova/` e `cadeia_antiga/` (som isolado), `batalha_nova/` e `batalha_antiga/` (batalha), `dist_nova/` (distância), `prioridade/` (batalha distante contra tiros na tela) e `motores/`.
  - As cenas vêm de `scripts/cenas_batalha.py` e dos arquivos `cenas_*.json`.
- **Análises.**
  - `scripts/batalha.py` gera `batalha.txt`.
  - `scripts/altofalante.py` gera `altofalante.txt`.
  - `scripts/lacos.py` gera `lacos.txt`.
  - `scripts/estalos.py` procura degraus e estalos.
  - A análise de transientes está em `transientes.txt`.
- **Testes em tempo real.**
  - `scripts/tempo_banco.js` gera `tempo_banco.txt`.
  - `scripts/partida_real.js` gera `partida_real.json`.
  - `scripts/coletor_real.js` gera `coletor_real.txt`.
- **Espectrogramas.** `scripts/espectrogramas.py` gera `png/armas_pesadas.png` e `png/armas_leves.png`.

Ressalva: os tempos de `tempo_banco.txt` foram medidos com a CPU disputada por outros críticos. O valor absoluto vale como um pior caso realista. A ordem e a ausência de reserva valem sempre.
