// Estado geral da partida: times, tempo e fase do jogo.

let teams = [];
let gameTime = 0;           // tempo de jogo em segundos
let gameState = 'title';    // 'title' | 'playing' | 'paused' | 'won' | 'lost'
let gameOptions = { faction: 0, enemy: -1, difficulty: 'normal', fog: true, map: 0 };
// enemy: facção do inimigo (-1 = a seguinte à do jogador); map: índice em MAPS
let winner = -1;            // time vencedor, -1 enquanto a partida corre

function createTeam(index, faction, isAI) {
  return {
    index,
    isAI,
    faction,
    credits: START_CREDITS,
    powerOut: 0,      // energia gerada
    powerUse: 0,      // energia consumida
    hasRadar: false,  // radar de pé e com energia
    construct: null,  // prédio em construção: { type, progress, spent, ready }
    lastAlert: -999,  // último aviso de "base sob ataque"
    stats: { built: 0, lost: 0, killed: 0, harvested: 0 },
  };
}

// Preço de algo para um time, já com o desconto da facção (o desconto vale só para unidades)
function costOf(team, def) {
  const mul = def.from ? teams[team].faction.costMul : 1;
  return Math.round(def.cost * mul);
}

function lowPower(team) {
  const t = teams[team];
  return t.powerUse > t.powerOut;
}

// "pronta"/"pronto", "destruída"/"destruído" conforme o nome do prédio
function genderize(def, word) {
  return def.fem ? word + 'a' : word + 'o';
}

// Percorre a lista alternando o sentido a cada passo de simulação.
// Assim nenhum time leva vantagem por agir sempre primeiro (ordem no array).
let fairFlip = false;
function fairEach(list, fn) {
  if (fairFlip) {
    for (let i = list.length - 1; i >= 0; i--) fn(list[i], i);
  } else {
    const n = list.length; // itens criados durante a volta ficam para o próximo passo
    for (let i = 0; i < n; i++) fn(list[i], i);
  }
}

// Facção do inimigo: a escolhida no título, ou a seguinte à do jogador
function enemyFaction() {
  const e = gameOptions.enemy;
  return e >= 0 && (e !== gameOptions.faction || gameOptions.mirror) ? e : (gameOptions.faction + 1) % FACTIONS.length;
}

function enemyOf(team) {
  return 1 - team;
}
