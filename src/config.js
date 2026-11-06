// Configurações e constantes globais do jogo.
// Carregado primeiro: os outros arquivos dependem destes valores.

const TILE = 32;            // tamanho de um tile em pixels
const MAP_W = 80;           // largura do mapa em tiles
const MAP_H = 80;           // altura do mapa em tiles
// Mapas: cada um é uma semente do gerador. O mapa é simétrico (as duas bases são iguais).
const MAPS = [
  { name: 'Twin Plateau', seed: 1992 },
  { name: 'Broken Valley', seed: 7 },
  { name: 'Three Fields', seed: 4242 },
];

const CAM_SPEED = 800;      // velocidade da câmera em px/s
const EDGE_SIZE = 12;       // faixa da borda da tela que rola a câmera (px)
const DRAG_MIN = 5;         // arrasto mínimo (px) para virar seleção em caixa
const HUD_H = 28;           // altura da barra superior (px)
const SIDEBAR_W = 220;      // largura do painel lateral direito (px)
const MINIMAP_MAX = 200;    // lado máximo do minimapa (px); encolhe em telas baixas
const UNIT_CAP = 60;        // limite de unidades por time (inclui coletores)

const SIM_HZ = 60;          // passos de simulação por segundo (passo fixo)
const SIM_STEP = 1 / SIM_HZ;
const MAX_STEPS_PER_FRAME = 10; // evita "espiral da morte" se o navegador travar

// Tipos de terreno
const TERRAIN = {
  GROUND: 0,   // solo comum, transitável
  PLATEAU: 1,  // planalto de pedra, transitável; só aqui se constrói
  CRYSTAL: 2,  // campo de cristal, transitável; recurso colhível
  CLIFF: 3,    // penhasco, bloqueia o movimento
};

// Facções originais. Cada uma tem cor própria e uma pequena vantagem.
//   hpMul: vida das unidades; rofMul: tempo entre tiros (menor = mais rápido); costMul: preço
const FACTIONS = [
  {
    id: 'cobalto', name: 'House Cavenaugh', bonus: 'Units have +18% health',
    color: '#3d8bfd', dark: '#1f4f9a', light: '#9cc4ff',
    hpMul: 1.18, rofMul: 1, costMul: 1,
  },
  {
    id: 'brasa', name: 'House Hundolf', bonus: 'Weapons fire 18% faster',
    color: '#d9533b', dark: '#7f2617', light: '#ffb09f',
    hpMul: 1, rofMul: 0.85, costMul: 1,
  },
  {
    id: 'ambar', name: 'House Tander', bonus: 'Units cost 10% less',
    color: '#e0a526', dark: '#8a5f0c', light: '#ffe08a',
    hpMul: 1, rofMul: 1, costMul: 0.9,
  },
];

// Dificuldade da IA
//   income: multiplicador do cristal que a IA recebe; buildSpeed: velocidade de produção
//   firstWave/waveGap: segundos até o 1º ataque e entre ataques; waveStart/waveGrow: tamanho das ondas
// earlyTurret: torre logo depois do Quartel; recall: onda volta quando a base sofre ataque grande;
//   lateArtillery: segundos até liberar obuseiros (só onde artillery é false); warnAllWaves: avisa toda onda
// Calibrado em 05/11/2026 por simulação (logs/dificuldade-critico.md e logs/dificuldade-ajuste.md)
const DIFFICULTIES = {
  facil:   { name: 'Easy',   income: 0.6,  buildSpeed: 0.7, firstWave: 600, waveGap: 300, waveStart: 3, waveGrow: 1, waveMax: 8,  maxHarvesters: 2, factories: 1, keepHome: 0.4,  artillery: false, lateArtillery: 1200, waveShare: 0.25, warnAllWaves: true },
  normal:  { name: 'Normal', income: 0.8,  buildSpeed: 0.9, firstWave: 420, waveGap: 200, waveStart: 5, waveGrow: 1, waveMax: 14, maxHarvesters: 4, factories: 1, keepHome: 0.3,  raids: true, waveShare: 0.4, earlyTurret: true, recall: true },
  dificil: { name: 'Hard',   income: 1.1,  buildSpeed: 1.0, firstWave: 330, waveGap: 165, waveStart: 7, waveGrow: 2, waveMax: 20, maxHarvesters: 6, factories: 2, keepHome: 0.25, raids: true, waveShare: 0.6, earlyTurret: true, recall: true },
};

// Facção de cada time, definida no início da partida (0 = jogador, 1 = inimigo)
let TEAMS = [FACTIONS[0], FACTIONS[1]];

// Utilitários matemáticos usados em vários arquivos
function clamp(v, min, max) {
  return v < min ? min : v > max ? max : v;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}
