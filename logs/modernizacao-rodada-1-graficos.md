# Crítica de GRÁFICOS E IDENTIDADE VISUAL: Fronteira Cristal (mod-r1)

**Nota: 7/10**

O salto em relação à versão aprovada é grande e coerente. O terreno antes era quadriculado e chapado; agora tem relevo, luz e sombra. As unidades ganharam volume, sombras e cores de time bem distintas. A interface usa fonte moderna, cartões e brilhos. Ainda não chega a 8 porque vários elementos entregam "protótipo" a um jogador exigente:
- o dano nos prédios quase não aparece;
- os escombros são um retângulo com bolinhas;
- o cristal fica em grade de papel de parede;
- a névoa tem degraus de tile;
- o terreno fica borrado em zoom alto e em telas retina;
- a interface não acompanha telas grandes.

Scripts: `/home/claude/criticos/mod-r1/scripts-graficos/`. Capturas: `/home/claude/criticos/mod-r1/capturas/graficos/`. Os arquivos `z_*.png` são recortes ampliados das capturas.

## Pontos fortes
- **Antes e depois evidente.** Compare `01_titulo_base.png` com `01_titulo_novo.png`, e `02_inicio_base.png` com `02_inicio_novo.png`. O terreno pintado tem planalto com bordas arredondadas, grama com tufos e penhasco com sombra projetada. Os botões ficaram modernos e a tipografia legível.
- **Times bem separados.** Azul, vermelho e âmbar se distinguem bem em todas as unidades (`06_unidades_paradas_f0vs1_z180.png`, `06_unidades_paradas_f1vs2_z180.png`, `06_unidades_paradas_f2vs0_z100.png`). Os veículos têm silhuetas próprias (batedor, blindado, obuseiro, coletor).
- **Prédios surgem bem.** A animação de "escaneamento holográfico" é bonita e original (`z_montagem_surgir.png`).
- **Batalhas legíveis em zoom alto.** Fumaça, faíscas, anel de choque e rastro de foguete funcionam (`11_batalha_grande_7.png`, 128 unidades criadas).
- **Falta de energia fica clara.** As luzes das usinas apagam, a barra de energia fica vermelha e aparece "⚡ ENERGIA BAIXA" (`16_falta_energia.png`).
- **Pausa, vitória e derrota têm visual consistente** (`17_pausa.png`, `19_vitoria.png`, `19_derrota.png`).
- **Névoa correta.** Prédios inimigos lembrados ficam escurecidos e os construídos depois não aparecem (`14_base_inimiga_sob_nevoa.png`). Unidades, projéteis, fumaça de prédio e brilho do cristal respeitam a visibilidade, tanto no código quanto nas capturas. Não encontrei vazamento visual de informação.
- **Zoom pela roda funciona.** Vai de 1,12 em 1,12 até 1,80 e volta a 0,70 (medido em `12_zoom_leve.js`).

## Problemas (em ordem de gravidade)

Nenhum problema **bloqueia**.

### Atrapalha

1. **O dano nos prédios quase não aparece.**
   - **Passos:** `13_fumaca_predio.js`. Três blindados inimigos atacam a Refinaria; os atacantes recuam; espero 2,5 s em tempo real com zoom de 180%.
   - **Evidência:** com 35% de vida não há fumaça visível (`23_predio_fumaca_0.45.png`). Com 13,6% aparecem só faíscas de brilho, sem coluna de fumaça (`23_predio_fumaca_0.2.png`). Em combate, com 14%, também não há fumaça (`z_crop_refinaria_14pct.png`).
   - O sprite do prédio continua intacto: sem rachaduras, marcas de queimado ou partes faltando. Hoje o dano só se lê pela barra de vida.
   - A fumaça cinza sobre o planalto cinza tem pouco contraste. Isso explica parte do problema, mas não tudo.

2. **O terreno fica borrado em zoom alto e com deviceScaleFactor 2, e destoa das unidades nítidas.**
   - **Causa:** o terreno é um canvas em 1× (2560×2560, `terrain.js`). Com 180% de zoom e DPR 2 ele é esticado 3,6 vezes. Os sprites já vêm em 2× (`SPR_SCALE`), e a interface sai na resolução física.
   - **Evidência:** `z_crop_dsf2_z180_cristal.png` (cristais e grama sem foco) contra `z_crop_dsf2_z180_unidades_terreno.png` (unidades nítidas sobre chão borrado). Também aparece em `20_1280x720_dsf2_jogo_z180.png`.

3. **O cristal parece papel de parede em grade.**
   - Há um tufo por tile, sempre no centro, com corredores retos entre linhas e colunas.
   - **Evidência:** `z_crop_cristal_grade_z70.png` e `06_unidades_paradas_f0vs1_z70.png`.
   - É o elemento mais "artificial" do mapa, e ficou igual ao da versão aprovada (`02_inicio_base.png`).

4. **Os escombros são um retângulo de borda dura com "bolinhas de gude".**
   - **Causa:** o gradiente do `rubbleSprite` (`render.js:278`) é cortado pela borda do canvas e forma um quadrado escuro. As pedras são círculos com brilho especular.
   - **Passos:** `05_danos.js`. Seis blindados inimigos destroem a Refinaria.
   - **Evidência:** `12_refinaria_destruida_b.png` e o recorte `z_crop_escombros.png`.

5. **A borda da névoa tem degraus do tamanho de um tile.**
   - **Causa:** a névoa é uma imagem de 1 pixel por tile, ampliada com suavização. Com zoom acima de 100% aparecem blocos borrados em escada.
   - **Evidência:** `z_crop_nevoa_degraus_z160.png` (zoom de 160%, degraus de cerca de 51 px) e `z_crop_nevoa_borda.png` (100%).

6. **Explosões somadas viram um borrão branco que esconde as unidades.**
   - **Causa:** o brilho aditivo (`lighter`) satura.
   - **Passos:** `04_batalha.js` com 64 contra 64 unidades, 1 s depois do encontro, zoom 100%.
   - **Evidência:** 1.878 pixels praticamente brancos (todos os canais acima de 245) num disco de cerca de 50 px. Ver `11_batalha_grande_0.png` e o recorte `z_crop_flash_saturado.png`.

7. **A interface não escala em telas grandes.**
   - Em 1920×1080 o painel continua com 220 px de largura e textos de 11–12 px. O minimapa fica em 200 px.
   - Abaixo da seleção sobra uma faixa vazia de cerca de 350 px de altura (`20_1920x1080_jogo.png`).
   - As unidades ficam pequenas em relação à tela, mesmo com o zoom inicial automático de 1,25.

8. **Infantaria minúscula; Soldado e Foguete se confundem.**
   - Em 100% de zoom o soldado tem cerca de 9 px. O Foguete só se distingue por um tubo com ponta laranja de 1–2 px (`z_crop_unidades_f2_z100.png`).
   - Em 70% são pontos (`06_unidades_paradas_f0vs1_z70.png`).
   - Sobre o campo de cristal, a infantaria azul some entre os tufos azul-esverdeados (`09_sobre_cristal_f0vs1_z100.png`).
   - A infantaria âmbar sobre a grama oliva também tem pouco contraste (`06_unidades_paradas_f2vs0_z100.png`).

### Detalhe

9. **Botões bloqueados quase ilegíveis.** O texto mais claro mede (63,63,61) sobre fundo (18,21,26), contraste de cerca de 1,7:1. O jogador não consegue ler o que vai liberar (`02_inicio_novo.png`, coluna UNIDADES).
10. **Avisos empilhados cobrem a área de jogo.**
    - Em 800×600 quatro avisos escondem a Usina no topo (`20_800x600_jogo.png`). Em `22_comparacao_normal.png` escondem a Central.
    - Na vitória e na derrota, o aviso fica congelado no meio da animação de saída, cortado na borda: "nidades sob ataque!", "entral destruída" (`19_vitoria_b.png`, `19_derrota.png`).
11. **"PRONTO" espremido sob o preço**, encostando em "◆300" (`z_crop_botao_pronto.png`).
12. **Prédios inimigos e aliados são iguais, exceto por uma faixa fina de cor.** Em 70% de zoom isso fica difícil de ler (`14_base_inimiga_visivel.png`). As unidades usam cor no corpo inteiro; os prédios poderiam fazer o mesmo, ao menos no teto ou em detalhes maiores.
13. **Penhascos com contorno de blocos.** Bordas retas longas, alinhadas aos tiles e só com cantos arredondados, apesar de o README falar em "bordas orgânicas" (`z_crop_penhasco_z70.png`).
14. **Coleta e descarga sem efeito visível nos quadros capturados.** Não aparece faixa nem fluxo de cristal entre o Coletor e a Refinaria (`15_coletor_colhendo.png`, `15_coletor_descarregando.png`).
15. **O modo leve piora o visual de forma moderada.** Ele perde as sombras das unidades, a vinheta e o brilho do cristal, e passa a desenhar o terreno sem suavização quando o zoom passa de 100%. As bordas ficam serrilhadas (`22_comparacao_normal.png` contra `22_comparacao_leve.png`; `z_comp_leve_vs_normal_z180.png`). No headless ele liga sozinho cerca de 3 s depois de começar uma batalha de 128 unidades.
16. **Lembrança de jogo existente.** O formato geral lembra o clássico do gênero, mas isso já estava na versão aprovada e não vem de arte copiada: painel lateral com colunas Prédios/Unidades, botão que vira "PRONTO", campos de cristal verde-água colhidos por coletor e refinaria. Os gráficos novos (estilo, ícones, fontes) são originais.

## Sugestões concretas
- **Dano nos prédios (`render.js` `drawBuilding`, `fx.js` `buildingEmitters`):**
  - sobrepor ao sprite uma camada de dano em 2 níveis (abaixo de 50% e de 25%): rachaduras, manchas de queimado e luzes apagadas;
  - fumaça escura (`dark`) já abaixo de 50%, mais opaca e maior, para contrastar com o planalto cinza.
- **Nitidez do terreno (`terrain.js` `buildMapCanvas`):** pintar o terreno em 2× (5120² é pesado; dá para fatiar em blocos de 512 px e criar sob demanda) ou ao menos na escala `pixelRatio×zoom` máxima de forma preguiçosa. Uma alternativa barata é sobrepor uma textura de detalhe em alta resolução, repetida.
- **Cristal (`terrain.js`):**
  - deslocar cada tufo aleatoriamente dentro do tile (±8 px);
  - variar a escala e a quantidade de 1 a 3 aglomerados;
  - pintar sob o campo uma "mancha" de solo cristalizado contínua, para apagar os corredores retos.
- **Escombros (`render.js:278`):**
  - usar máscara com contorno irregular, em vez do gradiente cortado no retângulo;
  - trocar as esferas por placas e polígonos angulosos com tons de metal e concreto, alguns com a cor do time;
  - acrescentar marcas de queimado em volta.
- **Névoa (`fog.js`/`render.js`):** gerar a imagem da névoa em 4–8 px por tile com desfoque (`filter: blur`) ou suavizar com interpolação bilinear nos cantos, como no marching squares. Também vale animar levemente a borda.
- **Brilho de explosão (`fx.js` `fxExplosion`):** limitar o alfa somado, por exemplo reduzindo o `flash` quando há muitas partículas na tela, ou usar `screen` em vez de `lighter`. Reduzir também o raio do `flash` (hoje até 60 px).
- **Infantaria (`sprites.js` `trooperBody`):**
  - aumentar 30–40%;
  - dar ao Foguete uma silhueta própria: tubo mais longo e grosso, mochila;
  - pôr um contorno escuro de 1 px em todas as unidades, para destacar sobre cristal e grama.
- **Interface:**
  - escalar o painel e as fontes com a altura da tela (por exemplo 1,25× acima de 900 px);
  - aumentar o minimapa e ocupar o espaço vazio;
  - texto bloqueado com contraste de pelo menos 3:1;
  - "PRONTO" como selo sobre o ícone;
  - avisos limitados a 2–3, empurrados para a direita do painel ou com fundo mais transparente;
  - na tela de fim, terminar ou apagar a animação dos avisos.
- **Prédios:** a cor do time no teto e nas faixas maiores, não só numa faixa fina.

---

## Resumo
Nota 7/10. Problemas mais graves:
1. Prédio danificado sem fumaça nem marcas: com 35% e 14% de vida só a barra mostra o dano (`23_predio_fumaca_0.45.png`, `z_crop_refinaria_14pct.png`).
2. Terreno em 1× fica borrado com zoom de 180% e DPR 2, enquanto unidades e interface ficam nítidas (`z_crop_dsf2_z180_cristal.png`).
3. Campos de cristal em grade regular de um tufo por tile, iguais à versão antiga (`z_crop_cristal_grade_z70.png`).
4. Escombros são um retângulo escuro de borda dura com "bolinhas de gude" (`z_crop_escombros.png`).
5. A névoa tem degraus do tamanho do tile em zoom alto (`z_crop_nevoa_degraus_z160.png`), e explosões somadas viram um borrão branco de cerca de 1.900 px (`z_crop_flash_saturado.png`).
