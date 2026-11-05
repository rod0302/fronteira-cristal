# Parecer independente: grau de dificuldade (Fronteira Cristal)

Avaliação feita por um crítico independente, com a lente de RTS clássico de coleta e base (C&C, Warcraft II, StarCraft).
Nenhum arquivo do jogo foi alterado. Os scripts ficam fora do projeto, em
`/tmp/claude-0/-home-claude/7ac571b0-b44d-5d1e-83a6-a1e04b16adb5/scratchpad/critico/`:

- `bots.js`: jogadores scriptados, referência sem bônus e números alternativos injetados na página;
- `run.js`: executor Playwright com 4 páginas em paralelo;
- `tab.py`: tabelas.

Ao todo foram **648 partidas simuladas** pela API `window.__jogo`, no modo Clássico, com névoa, nos 3 mapas e com 4 sementes por caso. As facções giram com a semente. Cada partida vai até 30 min. Não houve nenhum `pageerror`.
Também joguei de verdade pela interface, em tempo real, os primeiros 2 minutos no Normal, clicando nos botões e posicionando com o mouse.

## Notas

| Nível | Nota (adequação) | Resumo |
|---|---|---|
| **Fácil** | **5,5 / 10** | Quem conhece o gênero vence com folga (12 de 12, em ~11 min). Um novato de verdade perde **10 de 12**: a 2ª onda salta de 4 para ~12 unidades. Quem se fecha em torres empata. |
| **Normal** (padrão do jogo) | **3,5 / 10** | É um muro para o jogador intermediário. Os 5 perfis "casual" venceram **3 de 60**, e o novato venceu 0 de 24. Só a economia otimizada vence (9 de 12). A 1ª onda do Normal é **maior** que a do Difícil. |
| **Difícil** | **6,5 / 10** | Bem calibrado para quem joga afiado: o bot "bom" vence 7 de 12, e a IA Difícil sem bônus vence 0 de 12. Mas fica perto demais do Normal, e a IA desaba contra um único ataque reagrupado aos 9–11 min. |
| **Geral** | **4,5 / 10** | A curva tem um penhasco entre Fácil e Normal e um degrau quase plano entre Normal e Difícil. A pendência "Difícil duro" do ROADMAP está desatualizada: hoje o problema é o **Normal**. |

## Perfis de jogador usados

| Perfil | O que faz | Equivale a |
|---|---|---|
| parado | Não faz nada. | Mede o ritmo puro da IA. |
| **novato** | Age a cada 8 s, 1 item por fila e só compra com o dinheiro na mão. Segue o Objetivo: 2 coletores, ordem Usina → Refinaria → Quartel → Fábrica, 2 torres. Ataca com 15 unidades (como o Objetivo manda). Reage a ataques com 10 s de atraso e não repara. | Primeira semana no gênero. |
| **casual** | Age a cada 4 s. Faz 2ª refinaria, 4 coletores, 2 torres e radar. Exército misto, com prioridade para a Fábrica. Defende a base, ataca com 15 e recua com 4. Repara. Sem micro. | Quem já jogou C&C ou Warcraft, sem ser competitivo. |
| variantes do casual | `casual_def` ataca só com 30. `casual_rapido` age a cada 2 s, tem 5 coletores, reagrupa e recua com 40%. `casual_torres` faz 5 torres e ataca com 25. | Testa se o casual perdia só por um detalhe do roteiro. |
| **bom** | Age a cada 1 s. Faz 3 refinarias, 6 coletores e 2 fábricas, e produz sem parar. Faz contra (foguetes contra blindados). Ataca com 22, reagrupando num ponto avançado, e recua com 35%. | Jogador experiente sem micro fino. |
| ref:X | A própria IA da dificuldade X jogando pelo jogador, **sem** os bônus de renda e produção. | Régua interna. |

## Números medidos

### Ritmo da IA (jogador parado; 12 partidas por nível, sementes 101–104)

| Nível | 1ª onda sai (mín · mediana · máx) | Tamanho da 1ª onda | Chega à base | Jogador parado morre |
|---|---|---|---|---|
| Fácil | 467 · 486 · 510 s | 6 a 9 (mediana 6,5) | ~540 s | 544–601 s (9,6 min) |
| Normal | 316 · 335 · 359 s | **9 a 15 (mediana 12)** | ~390 s | 389–438 s (6,9 min) |
| Difícil | 286 · 305 · 329 s | **7 a 13 (mediana 10)** | ~360 s | 357–410 s (6,4 min) |

Ondas seguintes, medidas contra jogadores que resistem (medianas):

| Nível | 1ª onda | 2ª onda | 3ª onda |
|---|---|---|---|
| Fácil (contra o novato) | 4–6 aos ~8 min | **~12** (5 a 16) aos ~12 min | ~13 (6 a 21) aos ~16 min |
| Normal (contra o casual) | 7–14 | ~15,5 (7 a 20), +171 s | 15 a 26 |
| Difícil (contra o casual) | 7–13 | ~15,5 (9 a 19), +161 s | 12 a 24 |

Pico do exército da IA na partida (mediana): Fácil 15 a 40, conforme o jogador; Normal 29 a 35; Difícil 40 a 46.

Cristal colhido no fim, jogador × IA:

- novato × IA Fácil: ~27 mil × ~45 mil aos 18 min, mesmo com a IA recebendo só 75% da renda;
- casual × IA Normal: ~27 a 36 mil × 40 a 51 mil aos 12–13 min.

### Taxa de vitória (vitórias / derrotas / empates, com o tempo mediano)

Bateria principal (`b1`): 12 partidas por casa = 3 mapas × sementes 101–104.

| Jogador | Fácil | Normal | Difícil |
|---|---|---|---|
| parado | 0/12/0 · D 9,6 min | 0/12/0 · D 6,9 min | 0/12/0 · D 6,4 min |
| novato | **2/10/0** · D 20,4 min | 0/12/0 · D 10,3 min | 0/12/0 · D 9,7 min |
| casual | 12/0/0 · V 11,4 min | **0/12/0** · D 14,1 min | 0/12/0 · D 12,4 min |
| bom | 12/0/0 · V 7,7 min | 9/2/1 · V 10,4 min | **7/4/1** · V 11,1 min |
| ref:Fácil (sem bônus) | 5/0/7 | 0/5/7 | 0/12/0 |
| ref:Normal (sem bônus) | 12/0/0 | 8/4/0 | 1/9/2 |
| ref:Difícil (sem bônus) | 12/0/0 | 8/2/2 | 0/9/3 |

Bateria `b2`: variantes, sementes 201–204, 12 partidas por casa.

| Jogador | Fácil | Normal | Difícil |
|---|---|---|---|
| novato (outras sementes) | 1/10/1 | 0/12/0 | – |
| novato com 5 torres, ataca com 30 | 0/7/**5** (empata em torres) | 0/12/0 | – |
| casual | – | 0/12/0 | 0/12/0 |
| casual_def (ataca com 30) | – | 2/10/0 | 0/12/0 |
| casual_rapido (2 s, 5 coletores, reagrupa) | – | 0/12/0 | 0/12/0 |
| casual_torres (5 torres) | – | 1/11/0 | 0/12/0 |

No Normal, os perfis casuais somam **3 vitórias em 60**. No Difícil, **0 em 48**.

### Números alternativos testados

Os números foram injetados na página, sem alterar arquivos. Sementes 301–304, 401–404 e 501–504, com 12 partidas por casa.

| Proposta | novato | casual | casual_def | bom | ref:Fácil | ref:Normal |
|---|---|---|---|---|---|---|
| Normal atual | 0/12 | 0/12 | 2/10 | 9/2/1 | 0/5/7 | 8/4 |
| N1: só ondas mais lentas e menores (1ª aos 420 s, intervalo 200, início 5, `waveShare` 0,5, `keepHome` 0,3, renda 0,9) | 0/12 | 0/12 | – | 12/0 | – | – |
| N2: N1 + `maxHarvesters` 4 | 0/12 | 2/9/1 | – | 11/1 | – | – |
| N4: 1 fábrica, renda 0,8, produção 0,9 | 0/12 | 3/9 | 6/3/3 | 12/0 | – | – |
| **N5: N4 + `waveGrow` 1, `waveMax` 14, `waveShare` 0,4** | 0/12 | **3/5/4** | **7/2/3** | 12/0 (8,6 min) | 0/1/11 | 8/0/4 |
| Fácil F1: 1ª aos 540 s, intervalo 270, início 3, máx. 10, `waveShare` 0,3, 2 coletores, renda 0,7 | **7/4/1** | 12/0 | – | – | – | – |
| **Fácil F2: 1ª aos 600 s, intervalo 300, máx. 8, `waveShare` 0,25, 2 coletores, renda 0,6, produção 0,7** | **9/2/1** | 12/0 | – | – | – | – |

Conclusão das baterias: mexer só no ritmo das ondas (N1) não ajuda o jogador intermediário. O que pesa é a **economia da IA**: 5 coletores, 2 fábricas e produção contínua. A IA Normal colhe 40–60% mais que um humano mediano.

### Jogo de verdade, pela interface (Normal, tempo real)

Cliquei como um jogador atento, esperando ~3 s antes de cada decisão:

| Tempo | Marco |
|---|---|
| 18 s | Usina |
| 43 s | Refinaria |
| 58 s | Quartel |
| 84 s | Fábrica (créditos zerados) |
| 116 s | Torre |

- O Objetivo guia bem cada passo, e o locutor confirma cada prédio.
- O começo não estressa: a IA não aparece antes de ~5,5 min.
- O estresse vem depois. A 1ª onda chega com ~12 unidades aos 6,5 min, e a 2ª chega aos 9 min com ~16 a 20.
- Nesse ponto o Objetivo ainda está em "compre o 2º coletor" ou "faça a 2ª refinaria". Ele nunca manda construir uma Torre, embora diga "defenda perto das suas Torres" (`src/ui.js:456`).

## Problemas, por ordem de gravidade

### 1. (Grave) O Normal, que é o nível padrão, é um muro para o jogador intermediário
- **Evidência:**
  - os perfis casuais venceram 3 de 60 partidas no Normal, contra 60 de 60 no Fácil (tabelas `b1` e `b2`);
  - o novato venceu 0 de 24;
  - só a economia otimizada (bom, 9 de 12) ou a própria IA vencem.
- **Onde está:** `src/game.js:6` define `difficulty: 'normal'` como padrão.
- **Efeito:** quem abre o jogo e aperta PLAY enfrenta um nível que só vence quem otimiza a economia como um jogador competitivo.
- **Causa:**
  - a IA Normal é quase justa (renda 0,95, produção 1,0, em `src/config.js:59`), mas joga com uma eficiência que o humano mediano não tem: 5 coletores (`maxHarvesters: 5`), 2 fábricas logo cedo (`src/ai.js:12`) e produção que nunca para;
  - ela colhe 40 a 51 mil contra 27 a 36 mil do casual aos 12–13 min;
  - a 2ª onda (~16 a 20 unidades aos 8,5 min) derruba o primeiro prédio do casual entre 7 e 10 min, em quase todas as partidas.
- **No gênero:** o "Normal" dos clássicos é vencível por quem conhece o básico (base, 2 refinarias, exército misto, defesa).

### 2. (Grave) A curva entre os níveis está desalinhada: penhasco entre Fácil e Normal, quase nada entre Normal e Difícil
- **Do Fácil para o Normal:** o casual vai de 12/0 para 0/12, e a IA de referência Fácil vai de 5/0/7 para 0/5/7.
- **Do Normal para o Difícil:** para o bot "bom" quase não muda (9 de 12 → 7 de 12), e a referência Normal sem bônus vai de 8 de 12 para 1 de 12.
- **Ondas invertidas:**
  - a **1ª onda do Normal é maior que a do Difícil**: mediana 12 contra 10, e máximo 15 contra 13;
  - a causa é que o Normal tem `waveShare: 0.75` e `keepHome: 0.2`, contra 0,6 e 0,3 no Difícil (`src/config.js:59-60`, `src/ai.js:287` e `src/ai.js:298`);
  - as 2as ondas têm a mesma mediana (~15,5) nos dois níveis.
- **Resultado:** o Normal fica mais agressivo no começo que o Difícil, e o Difícil ganha só no fim, com renda 1,1 e `maxHarvesters` 6.

### 3. (Médio) O Fácil não é "para novato"
- **Evidência:**
  - o novato perde 10 de 12 (`b1`) e 10 de 12 de novo com outras sementes (`b2`). A derrota vem entre 18 e 27 min;
  - a 1ª onda é mansa (4–6 aos 8 min), mas a 2ª salta para **~12** (até 16), por causa de `waveShare: 0.4` sobre um exército de 30 a 40 parado em casa (`src/ai.js:298`);
  - a IA Fácil colhe mais que o novato (45 mil contra 27 mil), mesmo com renda 0,75, porque usa 3 a 4 coletores e não para de produzir.
- **Turtle:** o novato que se fecha em 5 torres **empata** 5 de 12 (a IA Fácil não tem obuseiro: `artillery: false`). Só o adia: perde as outras 7.
- **No gênero:** o Fácil deve ser vencível por quem acabou de aprender os controles. Aqui ele pune quem joga devagar, mais do que ensina.

### 4. (Médio) A IA desaba contra um único ataque reagrupado; o Difícil é vencido cedo
- **Evidência:**
  - o bot "bom" vence o Difícil aos 8,5–16 min (mediana 11,1) e o Normal aos 8–14 min (mediana 10,4), com **um ou dois ataques** de ~22 unidades reagrupadas;
  - nas derrotas do "bom", a partida se arrasta até 22–30 min.
- **Causa:**
  - a defesa da IA é só o que sobra em casa: 20–30% (`keepHome`);
  - as torres entram tarde no plano, depois do Radar e da 2ª Fábrica (`src/ai.js:13`);
  - a IA não segura a onda de volta quando a base é atacada: a guarda vai até o alerta, mas a onda lá fora continua.
- **Efeito para o experiente:** existe um "botão de vitória" previsível (ataque grande aos 8–9 min, logo depois de repelir a 1ª onda). A partida perde tensão: ou acaba cedo, ou vira uma longa guerra de desgaste.

### 5. (Médio) O Objetivo não prepara o jogador para a 1ª onda
- O Objetivo segue pela economia até o Radar (`src/ui.js:445-456`) e só então pede 15 unidades.
- A 1ª onda do Normal (~12 unidades aos 5,5–6,5 min) chega quando ele ainda pede o 2º coletor ou a 2ª refinaria.
- Ele nunca sugere construir uma Torre, mas diz "defenda perto das suas Torres".
- Também não avisa que um ataque se aproxima.
- No gênero, os primeiros níveis costumam anunciar a primeira ofensiva, ou o tutorial manda montar defesa antes dela.

### 6. (Leve) A IA não se expande, e as partidas entre forças iguais viram desgaste longo
- As partidas "bom × Normal ou Difícil" que não acabam cedo vão de 22 a 30 min, com empates aos 30 min.
- A IA não constrói refinaria longe da base. Isso já está no ROADMAP.
- Não muda a nota de dificuldade, mas reduz a pressão no fim e deixa o defensor bem fechado em vantagem.

### 7. (Leve) Pequenos números que não fazem o que prometem
- O comentário do plano diz "a 2ª fábrica logo depois da 2ª refinaria" (`src/ai.js:5`), e é isso que torna o Normal tão forte cedo.
- O Fácil limita `maxHarvesters: 3`, mas mede-se até 4 coletores: a refinaria grátis entra por fora da regra em `src/ai.js:214`.

## Recomendações (priorizadas)

### 1. Rebaixar o Normal para "vencível por quem conhece o gênero"
Alvo: o casual vence cerca de 50%, e o bot "bom" vence quase sempre.
Números testados (N5), que levaram o casual a **3/5/4** e o casual_def a **7/2/3**:

```js
normal: { name: 'Normal', income: 0.8, buildSpeed: 0.9, firstWave: 420, waveGap: 200, waveStart: 5, waveGrow: 1,
          waveMax: 14, maxHarvesters: 4, factories: 1, keepHome: 0.3, raids: true, waveShare: 0.4 },
```

- O que mais pesa é `factories: 1` + `maxHarvesters: 4` + renda 0,8. Só o ritmo de ondas (N1) não mudou nada.
- O Normal atual pode virar o novo Difícil (próxima recomendação).

### 2. Reescalonar o Difícil e tirar a inversão de ondas
- **Novo Difícil = Normal atual com o bônus atual do Difícil:**
  ```js
  dificil: { income: 1.1, buildSpeed: 1.0, firstWave: 330, waveGap: 165, waveStart: 7, waveGrow: 2, waveMax: 20,
             maxHarvesters: 6, factories: 2, keepHome: 0.25, waveShare: 0.6, raids: true }
  ```
- Garantir sempre que `waveShare` e o tamanho da 1ª onda **cresçam** de nível para nível.
- Somar a isso as melhorias de IA da recomendação 4. Elas deixam o Difícil exigente sem precisar de mais trapaça.
- Se quiserem manter o desafio máximo de hoje, criar um 4º nível "Brutal" com renda 1,25. O pedido já tinha sido recusado em `logs/rodada-3-correcoes.md`, mas com 3 níveis bem separados ele deixa de ser necessário.

### 3. Fácil "de novato"
Números testados (F2), com os quais o novato vence **9/2/1** e o casual continua vencendo 12 de 12 em ~9 min:

```js
facil: { income: 0.6, buildSpeed: 0.7, firstWave: 600, waveGap: 300, waveStart: 3, waveGrow: 1, waveMax: 8,
         maxHarvesters: 2, factories: 1, keepHome: 0.4, artillery: false, waveShare: 0.25 },
```

- Para acabar com o empate em torres, liberar 1–2 obuseiros depois de ~20 min ou depois de 3 ondas fracassadas.
- Outra opção: fazer a onda atrasada sair com tudo depois de 25 min.

### 4. IA: defesa e reação, que dão dificuldade justa em vez de bônus
Em ordem de impacto:

- **Torre mais cedo no plano**, logo depois do Quartel, nos níveis Normal e Difícil. Uma 2ª torre depois da 2ª refinaria. Em `src/ai.js:8-15`.
- **Chamar a onda de volta** quando a base sofre um ataque grande, por exemplo mais de 8 inimigos a até 22 tiles. Hoje só a guarda reage (`src/ai.js:276-281`).
- **No Difícil, atacar o ponto fraco:** coletores e refinaria em vez do prédio mais perto (`aiPickTarget`, `src/ai.js:234`). Também mandar incursões maiores (4–5 batedores) quando o jogador tiver poucas unidades.
- **Expansão** (já no ROADMAP): uma refinaria perto do 2º campo depois de ~12 min, nos níveis Normal e Difícil.

### 5. Objetivo e avisos
- Inserir "Construa uma Torre de defesa" no `nextGoal` logo depois do Quartel, em `src/ui.js:448`.
- Avisar a primeira onda: "Inimigos a caminho!" quando a onda sair, pelo menos no Fácil e no Normal.
- Mostrar na tela de título uma linha curta por nível, por exemplo: "Fácil: para aprender. Normal: conhece RTS. Difícil: economia afiada."

### 6. Medir de novo depois das mudanças
Rodar as baterias deste parecer, `node run.js b1.json 4` com `tab.py`, no scratchpad acima. Os alvos:

| Perfil | Fácil | Normal | Difícil |
|---|---|---|---|
| novato | ≥ 70% | – | – |
| casual | 100% | 40–60% | ≤ 15% |
| bom | – | ≥ 90% | 40–60% |
| ref Normal sem bônus contra o Difícil | – | – | 10–25% |

## Limites deste parecer
- Os bots não fazem micro fino: não focam fogo, não puxam unidades feridas e não usam o obuseiro com cuidado.
- Por isso, um humano experiente rende mais que o "bom", e o Difícil é provavelmente **um pouco mais fácil** do que a tabela sugere para esse público.
- Um humano casual erra de jeitos que o bot não erra (perde tempo na interface, esquece a produção), e o Normal é provavelmente **ainda mais duro** para ele.
- As duas correções reforçam as conclusões acima.
- Tamanho das amostras: 12 partidas por casa. As diferenças grandes (0/12 contra 12/12) são robustas. As pequenas (7 contra 9 de 12) são indicativas.
