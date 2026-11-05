# Som, rodada 1: correções

Notas da rodada 1: efeitos 5, locutor 6, mixagem 5.

## Efeitos
- Variações de verdade: semente embaralhada (`mixSeed`) e primeiros números descartados. Antes, os 5 sons de créditos eram idênticos e os canhões repetiam com correlação de 0,9.
- Volume por loudness (tabela `SFX_LUFS` em `src/sfxbank.js`), não por pico: o assobio de artilharia ficou bem abaixo do impacto, e o prédio explodindo acima de tudo.
- Explosões com estalo de 0 a 5 ms e corpo nos médios (150 a 600 Hz), menos sub.
- Identidade por arma: canhão do blindado seco e curto; torre com servo, estalo agudo e anel de cano longo; obuseiro com sopro de pressão e a granada saindo; impacto de foguete agudo e sem terra. Explosões por tamanho: batedor (`boom_small`), blindado e obuseiro (`boom`), Coletor com o cristal estilhaçando (`boom_harv`), prédio (`bigboom`).
- Limite por classe com prioridade: o som novo toma a vaga do mais fraco tocando (importância x volume) em vez de ser descartado. Intervalo mínimo por som e por região (seis soldados soam como seis). Alcances menores fora da tela.
- Distância: sem degrau na borda da tela, filtro mais forte, menos som direto e mais eco de longe. O reverb dos efeitos volta pelo barramento dos efeitos (abaixa com a voz).
- Banco: uma variação de cada som primeiro, laços assim que ficam prontos, a 32 kHz, cauda muda cortada, ruídos liberados no fim, duas gravações em paralelo cedendo a vez ao jogo.
- Laços com conteúdo periódico exato (2,0 s: sem tropeço na emenda), vento de 24 s com ruído longo, zumbido e motor do Coletor com harmônicos médios (ouvem-se em notebook), duas vozes por tipo de motor (um de cada lado da tela) e partida/parada.
- Sirene abaixa os efeitos; reparo menos chiado; fim da derrota sem corte.

## Mixagem
- Batalha grande de -11,3 para cerca de -15 LUFS; música de -33,9 para cerca de -26 LUFS.
- Efeitos: passa-altas em 35 Hz e prateleira de -4 dB em 110 Hz; compressor de cola mais suave (limiar -14, razão 2).
- Música não é agendada com o som mudo e não dispara compassos atrasados depois de um travamento.

## Locutor e tropas
- Fila única: locutor e tropas nunca falam juntos. A resposta a uma ordem corta a resposta à seleção.
- Sinais (sirene, sino de pronto, pulso de radar, som do Coletor se implantando, energia, fanfarra) tocam na mesma entrada da fila, antes da voz, num barramento que abaixa enquanto ela fala.
- Duck mais fundo (0,3 nos perigos, 0,45 no resto); as respostas das tropas também abaixam a batalha.
- Cadeia de rádio mais limpa (pouca saturação) e voz entrando depois do chiado.
- MP3 de 56 para 96 kbps; as tomadas são escolhidas ouvindo o MP3, limpo e com ruído de batalha.
- "Atenção, inimigo detectado", "Alerta! Base sob ataque!", "Alerta! Coletor sob ataque!", perigos um pouco mais rápidos; "Harvester deployed" na voz feminina, combinando com a locutora.
- 6 respostas por tipo de ordem; veículos e Coletor com outra voz, pelo rádio.
- "Unidades prontas" agrupa unidades prontas em sequência; intervalos maiores para "Blindado pronto" e "Unidade perdida"; limite de falas informativas por minuto; "se aproximando" não sai depois de "sob ataque".
- "Coletor pronto" também para o Coletor que vem com a Refinaria.
- Falas esperam o pacote decodificar (perigos decodificados primeiro); o mudo não gasta o intervalo das falas.
