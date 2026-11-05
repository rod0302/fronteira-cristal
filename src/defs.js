// Catálogo do jogo: armas, unidades e prédios.
// Os números de equilíbrio ficam todos aqui.

const START_CREDITS = 3000;  // créditos iniciais de cada time
const BUILD_RANGE = 4;       // distância máxima (tiles) de um prédio novo até um prédio próprio
const QUEUE_MAX = 5;         // fila máxima de unidades por prédio produtor
const SELL_REFUND = 0.5;     // fração do preço devolvida ao vender
const REPAIR_TIME = 20;      // segundos para reparar um prédio de 0 a 100%
const REPAIR_COST = 0.4;     // fração do preço gasta num reparo completo

// Multiplicador de dano: tipo de tiro x blindagem do alvo
const DAMAGE_MOD = {
  bullet: { inf: 1.4, light: 1.0, heavy: 0.15, bldg: 0.25 },
  rocket: { inf: 0.3, light: 1.0, heavy: 1.3, bldg: 0.7 },
  shell:  { inf: 0.6,  light: 0.9, heavy: 1.0, bldg: 0.8 },
  arty:   { inf: 0.7, light: 0.9, heavy: 0.6, bldg: 1.2 },
};

// Velocidade dos projéteis (px/s)
const SHOTS = {
  bullet: { speed: 620 },
  shell: { speed: 380 },
  rocket: { speed: 320 },
  arty: { speed: 260 },
};

// range/acquire em px; sight em tiles; cooldown e build em segundos
const UNIT_TYPES = {
  trooper: {
    name: 'Trooper', desc: 'Cheap infantry. Good against infantry, weak against armor.',
    cost: 100, build: 6, from: 'barracks', armor: 'inf',
    speed: 36, turn: 12, radius: 6, hp: 70, sight: 5,
    range: 3 * TILE, acquire: 4.5 * TILE, cooldown: 0.7, damage: 8, shot: 'bullet',
  },
  rocketeer: {
    name: 'Rocketeer', desc: 'Trooper with a rocket launcher. Strong against armor, weak against infantry.',
    cost: 180, build: 8, from: 'barracks', armor: 'inf',
    speed: 32, turn: 10, radius: 6, hp: 60, sight: 5,
    range: 4.5 * TILE, acquire: 5 * TILE, cooldown: 2.0, damage: 32, shot: 'rocket',
  },
  scout: {
    name: 'Scout', desc: 'Fast and sees far. Hunts troopers and harvesters.',
    cost: 250, build: 9, from: 'factory', armor: 'light',
    speed: 115, turn: 9, radius: 9, hp: 160, sight: 8,
    range: 3.5 * TILE, acquire: 5 * TILE, cooldown: 0.45, damage: 14, shot: 'bullet',
  },
  tank: {
    name: 'Tank', desc: 'Main battle tank. Tough and strong against vehicles.',
    cost: 700, build: 15, from: 'factory', armor: 'heavy',
    speed: 60, turn: 4, radius: 12, hp: 400, sight: 6,
    range: 4.5 * TILE, acquire: 5.5 * TILE, cooldown: 1.5, damage: 45, shot: 'shell', turretTurn: 5,
  },
  artillery: {
    name: 'Howitzer', desc: 'Long-range artillery with splash damage. Fragile up close.',
    cost: 800, build: 18, from: 'factory', req: ['radar'], armor: 'light',
    speed: 42, turn: 3, radius: 12, hp: 170, sight: 8,
    range: 8 * TILE, acquire: 8 * TILE, cooldown: 3.5, damage: 75, shot: 'arty', splash: 36,
  },
  harvester: {
    name: 'Harvester', desc: 'Gathers crystal and hauls it to the Refinery. Unarmed.',
    cost: 700, build: 15, from: 'factory', req: ['refinery'], armor: 'light',
    speed: 50, turn: 3.5, radius: 13, hp: 650, sight: 4,
    capacity: 500, harvestRate: 40, unloadRate: 160,
  },
};

// w/h em tiles; power positivo gera, negativo consome; fem = nome feminino (para "pronta"/"destruída")
const BUILDING_TYPES = {
  hq: {
    name: 'Headquarters', desc: 'Heart of the base. Without it, nothing can be built.', repairBase: 1500,
    w: 3, h: 3, hp: 2000, power: 30, cost: 0, build: 0, sight: 7, buildable: false, fem: true, noSell: true,
  },
  power: {
    name: 'Power Plant', desc: 'Generates 100 power. Without enough power, everything slows down.',
    w: 2, h: 2, hp: 600, power: 100, cost: 300, build: 10, sight: 4, fem: true,
  },
  refinery: {
    name: 'Refinery', desc: 'Receives crystal from harvesters. Comes with a free Harvester.', sellBase: 300,
    w: 3, h: 2, hp: 1000, power: -30, cost: 1000, build: 18, req: ['power'], sight: 5, fem: true,
  },
  barracks: {
    name: 'Barracks', desc: 'Trains infantry. Unlocks the Turret.',
    w: 2, h: 2, hp: 700, power: -20, cost: 350, build: 10, req: ['power'], sight: 5,
  },
  factory: {
    name: 'Factory', desc: 'Builds vehicles: scout, tank, howitzer and harvester.',
    w: 3, h: 3, hp: 1200, power: -40, cost: 1000, build: 20, req: ['refinery'], sight: 5, fem: true,
  },
  radar: {
    name: 'Radar', desc: 'Shows enemies on the minimap and unlocks the Howitzer.',
    w: 2, h: 2, hp: 700, power: -40, cost: 700, build: 14, req: ['refinery'], sight: 9,
  },
  turret: {
    name: 'Turret', desc: 'Fixed cannon defense. Without power, fires at half speed.',
    w: 1, h: 1, hp: 800, power: -25, cost: 500, build: 10, req: ['barracks'], sight: 7, fem: true,
    range: 6 * TILE, acquire: 6 * TILE, cooldown: 1.3, damage: 40, shot: 'shell', turretTurn: 4,
  },
};

// Ordem dos botões no painel lateral
const BUILD_MENU = ['power', 'refinery', 'barracks', 'factory', 'radar', 'turret'];
const UNIT_MENU = ['trooper', 'rocketeer', 'scout', 'tank', 'artillery', 'harvester'];

// Exército inicial de cada time (além da Central)
const START_ARMY = ['tank', 'scout', 'trooper', 'trooper', 'trooper'];
