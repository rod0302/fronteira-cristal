# Som, rodada 2: correções

Notas da rodada 2: efeitos 5,5, locutor 6,5, mixagem 5.

## Volume e peso
- Medidor de loudness trocado pelo BS.1770 de verdade: filtro K completo (prateleira de 1681 Hz e passa-altas de 38 Hz) e só janelas cheias de 400 ms. Antes ele errava de -4,6 a +8,8 LU. Medido de novo contra o script do crítico: os sons que não batem no teto de pico ficam a 0,1 LU da tabela.
- Tabela refeita: prédio -8, veículo -11, canhão -16, fuzil -22, interface de -20 a -27. Canhão fica 6 LU acima do fuzil, e assentar um prédio, erro e "energia" ficam abaixo dos canhões.
- Sons mono sempre passam pelo panner. Acabou o salto de 3 dB entre o centro exato e o resto da tela.
- Sinais e interface agora na mesma régua dos efeitos (compensam o ganho de 0,42 do barramento dos efeitos). Fanfarra de fim de partida abaixo das explosões grandes.
- "Momento" de grande evento: quando um prédio, Coletor ou veículo explode na tela, as armas leves e os impactos de bala abaixam por cerca de 1 s. A explosão aparece por cima do tiroteio.
- Explosões com estalo fora da saturação (o ataque não é mais achatado pelo corpo) e uma camada de corpo de 150 a 600 Hz. Sub reduzido em 40%. No prédio, as explosões seguintes são mais fracas que a primeira, e o pico fica no começo.
- Teto da saída em -1 dB.

## Limite e roubo de vaga
- A voz roubada sai da lista na hora. Antes, a mesma voz era "roubada" várias vezes e o limite por classe não valia. Teste do crítico (`cap.js`): 40 tiros dão 16 tocando, 30 explosões dão 8.
- Com o limite geral cheio, o som novo rouba o mais fraco de qualquer classe: uma explosão toma a vaga de um tiro.
- Explosões no primeiro terço protegidas do roubo; quando cortadas, somem em 50 ms em vez de 12 ms.

## Efeitos
- Torre: o servo foi para depois do disparo (rearmando). O tiro sai junto com o clarão.
- Variações novas em morte de soldado, seleção, unidade pronta, prédio assentado e créditos (sorteados, sem tomadas idênticas).
- Impacto de bala em metal (veículo ou prédio): tinido seco, diferente da terra.
- Prédio pegando fogo (abaixo de metade da vida): laço de chamas com estalos.
- Laços de 6 s com batidas e tinidos sorteados (antes eram 2 s com padrão audível). Motores de 6 a 8 dB mais altos, e o zumbido da base com mais harmônicos médios.
- Vento descorrelacionado (cada lado começa num ponto diferente do ruído), com 12 s em vez de 24 s.
- Erro mais suave e mais baixo; créditos no agudo, com tiques mais frequentes.
- Alcances maiores e queda mais suave: canhão, obuseiro e explosões se ouvem do outro lado do vale.
- O som do Coletor se implantando não é mais abafado pela fala "Harvester deployed".
- Um erro numa receita não trava mais o banco.

## Locutor
- "Unidade perdida" não vira mais "Unidades prontas" (o agrupamento só pega as falas de unidade pronta).
- Sirene e radar só tocam junto com a fala. Uma fala recusada pelo intervalo não toca mais a sirene (antes eram 6 sirenes em 8 s).
- "Base sob ataque" e "Coletor sob ataque" tiram da fila "Inimigo detectado" e "Inimigos se aproximando" e cortam a fala de prioridade menor que estiver tocando. "Se aproximando" desceu para prioridade 2.
- Vitória e derrota limpam a fila, sem "Não podemos mais construir" antes da derrota.
- O limite de falas por minuto conta só as informativas: avisos importantes não calam mais "Blindado pronto".
- Perigos regravados com mais urgência (velocidade 1,1) e pausa: "Alerta! A base está sob ataque!" e "Alerta! O coletor está sob ataque!". Cada um ganhou uma segunda leitura ("Atenção! Nossa base está sob ataque!", "Atenção! Coletor sendo atacado!").
- Segundas leituras para "Usina pronta", "Blindado pronto", "Coletor pronto" e "Unidades prontas", sorteadas sem repetir a última.
- As tomadas agora são julgadas pelo Whisper sobre uma gravação de batalha do próprio jogo, não sobre ruído rosa.
- Testei "Harvester deployed" na voz da locutora (`pf_dora` com pronúncia em inglês): o Whisper ouviu "Carvister deployed". Ficou a voz `af_heart`, que ele reconhece sem erro.
- Voz de 4 a 5 dB mais baixa e ducking mais raso: 0,45 nos perigos, 0,6 no resto e 0,8 nas respostas das tropas. A batalha passa menos tempo abafada.
- Rádio dos veículos mais aberto: passa-baixas de 6,8 kHz e menos saturação.
- O chiado de fechamento de uma fala cortada também é cancelado.
- Falas decodificadas a 24 kHz (metade da memória). A abertura é decodificada primeiro.
- `tests/fumaca.js` espera o banco ficar pronto (até 40 s) em vez de conferir num instante fixo.

## Testes
`tests/fumaca.js` e `tests/partida.js` passam. A simulação continua idêntica à versão anterior (hash de `__jogo.estado()`).
