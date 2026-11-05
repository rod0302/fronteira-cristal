# Ajuste de dificuldade (05/11/2026)

Aplicadas as recomendações de `logs/dificuldade-critico.md`. Medido com os mesmos bots e sementes do crítico
(216 partidas no modo Clássico com névoa, 3 mapas x 4 sementes por caso, 0 erros). V/D/E = vitórias/derrotas/empates do jogador.

| Perfil | Fácil | Normal | Difícil |
|---|---|---|---|
| novato | 21V/1D/2E (antes 3V/20D/1E) | 2V/21D/1E (antes 0/24) | - |
| novato que se fecha em torres | 7V/1D/4E (antes 0V/7D/5E) | - | - |
| casual | 12V/0D/0E | 10V/8D/6E (antes 0/12) | 0V/24D/0E |
| casual defensivo | - | 8V/2D/2E (antes 2V/10D) | 0V/12D/0E |
| bom | - | 12V/0D/0E (antes 9V/2D/1E) | 7V/4D/1E |
| IA Normal sem bônus | - | - | 1V/6D/5E |

Jogador parado: morre aos ~11,7 min no Fácil, ~8,6 no Normal e ~7,0 no Difícil.
1ª onda: Fácil ~606 s com 4 unidades; Normal ~426 s com 6; Difícil ~335 s com 9-10 (as ondas agora crescem de nível para nível).

Contra os alvos do crítico: Fácil (novato >= 70%: 88%), Normal (casual 40-60%: 42%; bom >= 90%: 100%),
Difícil (casual <= 15%: 0%; bom 40-60%: 58%; IA Normal sem bônus 10-25%: 8%, um pouco abaixo). Todos atingidos ou muito perto.
Limite: os bots não fazem micro fino; um humano experiente rende mais que o "bom" no Difícil.
