# Som, rodada 3 (última): correções

Notas da rodada 3: efeitos 6, locutor 6,5, mixagem 6. Como nos ciclos anteriores, estas correções vieram depois da última rodada e não foram avaliadas por críticos. Os testes passam e a simulação continua idêntica.

## Voz de volta acima da batalha
- A rodada 2 abaixou a voz demais: na batalha grande ela ficava só +1 a +4 dB acima do tiroteio, e o Whisper errava 6 de 20 falas. Agora a voz está de 3 a 4,5 dB mais alta (tropas um pouco mais), e o ducking voltou a ficar mais fundo: 0,35 nos perigos, 0,5 no resto e 0,7 nas respostas das tropas. Fica entre a rodada 2, com a voz alta demais, e a rodada 3, com a voz baixa demais.
- O nível de cada fala é igualado pelo RMS dos trechos com voz (a mediana do pacote é a referência, com ajuste limitado a -4,4 / +4 dB). "Inimigo detectado" saía de 3 a 6 dB abaixo das outras.

## Fila
- Um perigo não corta mais "Harvester deployed" nem "Coletor pronto": a fala termina e o perigo entra logo depois.
- Um perigo só tira da fila os avisos de contato ("Inimigo detectado", "se aproximando", "unidades sob ataque"). "Blindado pronto" não é mais descartado.
- "Inimigo detectado" não sai nos 20 s seguintes a um "sob ataque".
- A resposta das tropas a uma ordem só é cortada por perigo, não por avisos de prioridade 2.
- As segundas leituras dos perigos começam com "Alerta!": "Alerta! Nossa base está sob ataque!" e "Alerta! Coletor sendo atacado!". "Atenção" fica só para o aviso de contato.

## Tomadas
- O crítico mostrou que o Kokoro é determinístico: a mesma entrada dá o mesmo áudio, e as "6 tomadas" eram iguais. Agora cada tomada muda um pouco a velocidade (de 0,92 a 1,08), e o Whisper escolhe entre leituras diferentes de verdade. As falas regeradas assim: "Pode deixar!" dos veículos (de 0,61 para 1,00), "Atenção, inimigo detectado" (1,00) e as segundas leituras dos perigos (0,98 e 1,00). As outras falas continuam com a tomada única da rodada anterior.

## Efeitos e mixagem
- O "momento" do grande evento abaixa todos os tiros e impactos (antes só as armas leves, mas quem enchia a batalha eram as pesadas). Dispara no máximo a cada 2,5 s, e só para prédio, Coletor e veículo pesado: deixou de ser um abaixamento quase contínuo.
- As explosões grandes passam por uma saturação suave nos picos e chegam ao volume da tabela. Antes ficavam de 1,3 a 3,1 LU abaixo por causa do teto de pico, e o Coletor explodindo soava mais baixo que um blindado. Medido: prédio -8,0, Coletor -10,0, blindado -11,0 LUFS (BS.1770).
- O zumbido da base usa uma voz só, no centro. As duas cópias com rotações diferentes vibravam a 1,8 Hz. O volume caiu para menos da metade: ficava acima de um blindado andando e da música na cena calma.
- A torre recuperou a identidade: servo curto travando antes do tiro (30 ms, abaixo do limite de percepção de atraso) e de novo rearmando depois.
- Interface e sinais um pouco mais altos (o clique e o "pronto" afundavam na batalha). Créditos com intervalo de 1,1 s (tocavam 3 vezes mais que na rodada 2).
