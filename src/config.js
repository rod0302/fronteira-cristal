// Configurações e constantes globais do jogo.
// Carregado primeiro: os outros arquivos dependem destes valores.

const TILE = 32;            // tamanho de um tile em pixels
const MAP_W = 80;           // largura do mapa em tiles
const MAP_H = 80;           // altura do mapa em tiles
// Mapas: cada um é uma semente do gerador. O mapa é simétrico (as duas bases são iguais).
const MAPS = [
  { name: 'Planalto Gêmeo', seed: 1992 },
  { name: 'Vale Partido', seed: 7 },
  { name: 'Três Campos', seed: 4242 },
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
    id: 'cobalto', name: 'Liga Cobalto', bonus: 'Unidades com +18% de vida',
    color: '#3d8bfd', dark: '#1f4f9a', light: '#9cc4ff',
    hpMul: 1.18, rofMul: 1, costMul: 1,
  },
  {
    id: 'brasa', name: 'Clã Brasa', bonus: 'Armas atiram 18% mais rápido',
    color: '#d9533b', dark: '#7f2617', light: '#ffb09f',
    hpMul: 1, rofMul: 0.85, costMul: 1,
  },
  {
    id: 'ambar', name: 'Consórcio Âmbar', bonus: 'Unidades custam 10% menos',
    color: '#e0a526', dark: '#8a5f0c', light: '#ffe08a',
    hpMul: 1, rofMul: 1, costMul: 0.9,
  },
];

// Dificuldade da IA
//   income: multiplicador do cristal que a IA recebe; buildSpeed: velocidade de produção
//   firstWave/waveGap: segundos até o 1º ataque e entre ataques; waveStart/waveGrow: tamanho das ondas
const DIFFICULTIES = {
  facil:   { name: 'Fácil',   income: 0.75, buildSpeed: 0.8, firstWave: 480, waveGap: 240, waveStart: 4, waveGrow: 1, waveMax: 12, maxHarvesters: 3, factories: 1, keepHome: 0.4, artillery: false, waveShare: 0.4 },
  normal:  { name: 'Normal',  income: 0.95, buildSpeed: 1.0, firstWave: 330, waveGap: 170, waveStart: 7, waveGrow: 2, waveMax: 18, maxHarvesters: 5, factories: 2, keepHome: 0.2, raids: true, waveShare: 0.75 },
  dificil: { name: 'Difícil', income: 1.1,  buildSpeed: 1.0, firstWave: 300, waveGap: 160, waveStart: 7, waveGrow: 2, waveMax: 20, maxHarvesters: 6, factories: 2, keepHome: 0.3,  raids: true, waveShare: 0.6 },
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
