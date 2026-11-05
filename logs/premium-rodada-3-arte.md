# Fronteira Cristal: modo Premium, rodada 3. Crítica de direção de arte

Revisor: diretor de arte independente. Usei as capturas `logs/capturas/premium-r3/01..08` e três extras com `escalagl=1`:
- `/tmp/ad3/u2.png` e o recorte `u2c.png`: as 6 classes de unidade dos dois times lado a lado, junto ao QG vermelho.
- `/tmp/ad3/e.png`: o QG inimigo isolado.
- `/tmp/ad3/b3.png` e o recorte `b3c.png`: a batalha do `battle3.js` com a explosão em curso.

Também usei `bc.png`, que é a base azul de 03 recortada.

## Notas

| Área | Nota | Δ vs r2 |
|---|---|---|
| (a) Terreno | **6/10** | = |
| (b) Modelos de unidades | **5/10** | = |
| (c) Prédios | **5,5/10** | +0,5 |
| (d) Iluminação e cor | **6,5/10** | +0,5 |
| (e) Impacto geral "AAA" | **5,5/10** | +0,5 |

### O que avançou
- **Explosão em combate (b3c):** agora tem bola de fogo laranja, fumaça cinza, faíscas e detritos. Lê como fogo. Mas a captura 07 ainda mostra um núcleo branco estourado com raios finos, ou seja, os primeiros frames continuam como flare de câmera.
- **Água:** tem textura de ondulação e um especular quente que pega a luz da explosão (04, 07). É o elemento mais "next-gen" da tela.
- **Quartel:** virou um hangar arredondado com bandeira e sacos de areia, uma silhueta mais legível que o cubo da r2.
- **Névoa (06):** as nuvens volumétricas continuam boas.
- **Identidade de time:** continua clara.

### O que não mudou (e era o grosso da crítica da r2)
- **Unidades:** cascos 100% cor do time, sem grafite nem contraste de material. A infantaria segue com uns 8 px de largura e sombra 3x maior que o corpo (u2c), e o obuseiro tem uma sombra de cano que parece um poste.
- **Prédios:** continuam em lajes cinza retangulares de borda dura, com telhado azul/vermelho chapado. A Fábrica ainda são 3 tubos fluorescentes. No QG, o glifo circular na frente-esquerda segue lá (bc, e.png).
- **Planície:** o mesmo bege com stipple de "pegadas" cobre 50 a 60% da tela, sem props nem trilhas (e.png é literalmente um prédio num mar bege).
- **Platô:** curvas de nível laranja no topo, pedras lilás e árvores-bolinha idênticas (05).
- **Capim:** as manchas verdes têm um shading em "escadinha" de baixa resolução (b3c, canto superior direito), e os tufos escuros parecem sujeira no sensor.

## Correções priorizadas (máx. 8)

1. **Dar material e escala às unidades.**
   - Escala visual de 1,3 a 1,5x, mantendo a colisão.
   - Casco grafite `#2b2f36`, com a cor do time só na torre, nas saias e numa faixa (30 a 35% da área). Esteiras/rodas quase pretas.
   - Rim light frio fraco (`#9fc4ff`, fresnel × 0,25).
   - Limitar o comprimento da sombra das unidades pequenas (ou subir o sol para z ≈ 0,85).
   - Blob AO de contato sob cada unidade.

2. **Matar a "laje cinza + tampa chapada" dos prédios.**
   - A laje vira uma faixa chanfrada de 4 a 6 px, mais um decal de terra pisada com borda de ruído.
   - Telhados em chapa metálica com nervuras, sujeira e ferrugem, e a cor do time só como acento.
   - A Fábrica precisa de sheds em dente de serra, pórtico e portão iluminado.
   - Remover o glifo circular do QG.

3. **Planície: tirar o stipple e povoar.**
   - Stipple a ≤20%, FBM de baixa frequência em ±10% do albedo e cascalho em normal map Voronoi.
   - Props instanciados: pedras em 3 tamanhos, tufos, sucata.
   - Trilhas escurecidas entre as bases e AO de 1 a 2 tiles em volta dos prédios.

4. **Corrigir os primeiros frames da explosão (07).**
   - Clamp de luminância por partícula (≤ 4 HDR) e threshold de bloom mais alto, para que o núcleo comece em `#ffd27a` e não em branco.
   - Tirar os raios finos tipo lens flare.
   - Decal de chão queimado de 20 a 30 s.

5. **Platô e paleta.**
   - Estratos só nas faces verticais (peso `1 - n.z`).
   - Topo do platô em terra dessaturada `#8f6a48` com capim oliva `#6E7F3A`.
   - Pedras na cor da rocha local, não lilás.
   - Grading com sombras teal leves e saturação −10%, deixando o ciano dos cristais como o único acento saturado.

6. **Capim e transições de material.**
   - Subir a resolução (ou filtrar) a máscara do capim para eliminar a escadinha.
   - Height-blend nas bordas no lugar do contorno claro de "bolha".
   - Trocar os tufos pretos por tufos com luz (ponta quente, base escura).

7. **Cristais com hierarquia.**
   - Clusters de 3 a 7 prismas com alturas variadas e um cristal-herói a cada ~15 clusters.
   - Veias de chão só entre os clusters grandes, pulsando devagar. Hoje é confete uniforme com "interferência".
   - Cristais esgotados menores e opacos.

8. **Vegetação do platô.**
   - 2 ou 3 espécies (acácia de copa achatada), escala de 0,7 a 1,4x e matiz ±10°.
   - Copa com topo quente e sombra azulada, no lugar das bolas cinza-esverdeadas idênticas.

## Veredito
A rodada 3 refinou o fogo e a água, mas não tocou nos três problemas estruturais (unidades de cor chapada e minúsculas, prédios "tampa sobre laje", planície bege vazia): 5,5/10, ainda um diorama de brinquedo bem iluminado, não AAA.
