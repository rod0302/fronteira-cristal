// Unidades: criação, movimento, formação e ordens básicas.
// Os tipos (vida, arma, preço) ficam em defs.js.

let units = [];
let nextEntityId = 1; // ids únicos para unidades e prédios
let gameMap = null;   // definido em main.js

function spawnUnit(type, team, tx, ty) {
  const def = UNIT_TYPES[type];
  const angle = sideFlip(team) ? -3 * Math.PI / 4 : Math.PI / 4;
  const hp = Math.round(def.hp * TEAMS[team].hpMul);
  const u = {
    id: nextEntityId++,
    kind: 'unit',
    type, team,
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
    angle,
    turret: angle,  // ângulo da torre (blindado)
    radius: def.radius,
    hp,
    maxHp: hp,
    path: [],       // pontos (px) a percorrer
    selected: false,
    target: null,   // entidade inimiga que está atacando
    forced: false,  // true = ataque mandado pelo jogador (não desiste da perseguição)
    amove: null,    // destino de "atacar movendo" { x, y }
    cooldown: 0,    // tempo até poder atirar de novo
    repath: 0,      // tempo até recalcular o caminho de perseguição
    stuck: 0,       // tentativas seguidas de desviar de um bloqueio
    bestD: Infinity, // menor distância já alcançada até o ponto atual do caminho
    noProgress: 0,  // tempo sem se aproximar do ponto atual
    lastHit: -99,   // tempo do último dano recebido
  };
  if (type === 'harvester') {
    u.cargo = 0;
    u.hstate = 'idle'; // ver harvest.js
    u.field = null;    // tile de cristal preferido
    u.manual = false;  // true = jogador mandou mover; para de colher sozinho
    u.wait = 0;
    u.claim = -1;      // índice do tile de cristal reservado
  }
  units.push(u);
  return u;
}

function getSelected() {
  return units.filter(u => u.selected);
}

function clearSelection() {
  units.forEach(u => { u.selected = false; });
  buildings.forEach(b => { b.selected = false; });
}

function unitTile(u) {
  return { x: Math.floor(u.x / TILE), y: Math.floor(u.y / TILE) };
}

function hasWeapon(e) {
  const def = e.kind === 'unit' ? UNIT_TYPES[e.type] : BUILDING_TYPES[e.type];
  return !!def.damage;
}

// Diferença de ângulo normalizada para o intervalo (-PI, PI]
function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Gira um ângulo em direção a outro, no máximo "maxTurn" radianos
function turnToward(a, want, maxTurn) {
  return a + clamp(angleDiff(a, want), -maxTurn, maxTurn);
}

function nextWaypoint(u) {
  u.path.shift();
  u.bestD = Infinity;
  u.noProgress = 0;
}

// Segue o caminho: gira em direção ao próximo ponto e anda.
function moveUnit(u, dt) {
  if (u.path.length === 0) return;
  const def = UNIT_TYPES[u.type];
  const wp = u.path[0];
  const dx = wp.x - u.x, dy = wp.y - u.y;
  const d = Math.hypot(dx, dy);
  // Pontos intermediários não precisam ser atingidos com precisão
  if (d < 2 || (u.path.length > 1 && d < 10)) {
    nextWaypoint(u);
    return;
  }

  // Sem progresso por 1 s (empurra-empurra com outra unidade): pula o ponto,
  // ou dá a viagem por encerrada se já está perto do destino final
  if (d < u.bestD - 1) {
    u.bestD = d;
    u.noProgress = 0;
  } else if ((u.noProgress += dt) > 1) {
    u.noProgress = 0;
    if (u.path.length > 1) nextWaypoint(u);
    else if (d < TILE * 2.5) u.path = [];
    else {
      u.bestD = Infinity;
      setUnitPath(u, wp.x, wp.y);
    }
    return;
  }

  const want = Math.atan2(dy, dx);
  const diff = angleDiff(u.angle, want);
  u.angle = turnToward(u.angle, want, def.turn * dt);

  // Curva fechada: gira quase parado antes de acelerar
  const factor = Math.abs(diff) > 1.2 ? 0.15 : 1;
  // Em grupo (e sem alvo para perseguir), anda no passo do mais lento
  const speed = u.groupSpeed && !u.target ? Math.min(def.speed, u.groupSpeed) : def.speed;
  const step = Math.min(d, speed * factor * dt);
  const nx = u.x + Math.cos(want) * step, ny = u.y + Math.sin(want) * step;

  // Caminho bloqueado (ex.: prédio novo no meio): recalcula até o destino final
  if (!isWalkable(gameMap, Math.floor(nx / TILE), Math.floor(ny / TILE))) {
    const goal = u.path[u.path.length - 1];
    u.stuck++;
    if (u.stuck > 3) {
      u.path = [];
      u.stuck = 0;
    } else {
      setUnitPath(u, goal.x, goal.y);
    }
    return;
  }
  u.stuck = 0;
  u.x = nx;
  u.y = ny;
}

// Afasta unidades sobrepostas (sem empurrar ninguém para dentro de penhasco ou prédio).
function separateUnits() {
  // A ordem dos pares alterna a cada passo (ver fairEach): ninguém é sempre empurrado primeiro
  const n = units.length;
  for (let ii = 0; ii < n; ii++) {
    const i = fairFlip ? n - 1 - ii : ii;
    const a = units[i];
    for (let jj = ii + 1; jj < n; jj++) {
      const b = units[fairFlip ? n - 1 - jj : jj];
      const dx = b.x - a.x, dy = b.y - a.y;
      const min = a.radius + b.radius;
      if (dx > min || dx < -min || dy > min || dy < -min) continue;
      const d2 = dx * dx + dy * dy;
      if (d2 >= min * min) continue;
      const d = Math.sqrt(d2) || 0.01;
      const push = (min - d) / 2;
      // Sobreposição exata: separa numa direção fixa (pelo id), sem sorteio
      const nx = d2 ? dx / d : (a.id % 2 ? 1 : -1), ny = d2 ? dy / d : 0;
      // Quem está parado cede mais espaço para quem está andando
      const aMoving = a.path.length > 0, bMoving = b.path.length > 0;
      const wa = aMoving && !bMoving ? 0.3 : !aMoving && bMoving ? 1.7 : 1;
      tryNudge(a, -nx * push * wa, -ny * push * wa);
      tryNudge(b, nx * push * (2 - wa), ny * push * (2 - wa));
    }
  }
}

function tryNudge(u, dx, dy) {
  const nx = u.x + dx, ny = u.y + dy;
  if (isWalkable(gameMap, Math.floor(nx / TILE), Math.floor(ny / TILE))) {
    u.x = nx;
    u.y = ny;
  }
}

function updateUnits(dt) {
  fairEach(units, u => moveUnit(u, dt));
  // Duas passadas de separação: grupos grandes se espalham melhor
  separateUnits();
  separateUnits();
}

// Calcula e aplica o caminho de uma unidade até um ponto (px).
// Se o ponto cair num lugar bloqueado, para no tile livre mais perto dele.
function setUnitPath(u, goalX, goalY) {
  const start = unitTile(u);
  const gtx = Math.floor(goalX / TILE), gty = Math.floor(goalY / TILE);
  const tiles = findPath(gameMap, start.x, start.y, gtx, gty, u.team);
  const pts = smoothPath(gameMap, u.x, u.y, tiles, u.radius * 0.8);
  const goalFree = isWalkable(gameMap, gtx, gty);
  if (goalFree) {
    if (pts.length) pts[pts.length - 1] = { x: goalX, y: goalY };
    else pts.push({ x: goalX, y: goalY });
  }
  u.path = pts;
  u.bestD = Infinity;
  u.noProgress = 0;
}

// Tiles livres em volta de um ponto, do mais perto ao mais longe (busca em largura).
// Serve para espalhar um grupo em formação sem todos brigarem pelo mesmo tile.
function formationSlots(map, tx, ty, count, team = 0) {
  const start = nearestWalkable(map, tx, ty, 12, team);
  if (!start) return [];
  const slots = [];
  const seen = new Set([start.y * map.w + start.x]);
  const queue = [start];
  for (let i = 0; i < queue.length && slots.length < count; i++) {
    const t = queue[i];
    slots.push(t);
    for (const [dx, dy] of dirsFor(team)) {
      const nx = t.x + dx, ny = t.y + dy;
      const key = ny * map.w + nx;
      if (seen.has(key) || !isWalkable(map, nx, ny)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return slots;
}

// Distribui um grupo em vagas ao redor de um ponto e chama "assign(u, x, y)" para cada um.
function spreadGroup(group, wx, wy, assign) {
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const slots = formationSlots(gameMap, tx, ty, group.length, group[0] ? group[0].team : 0);
  const free = group.slice();
  // Cada vaga (da mais central para fora) fica com a unidade livre mais próxima
  slots.forEach(slot => {
    const sx = slot.x * TILE + TILE / 2, sy = slot.y * TILE + TILE / 2;
    let bi = 0, bd = Infinity;
    free.forEach((u, i) => {
      const d = (u.x - sx) ** 2 + (u.y - sy) ** 2;
      if (d < bd) { bd = d; bi = i; }
    });
    const u = free.splice(bi, 1)[0];
    // Unidade sozinha vai exatamente ao ponto clicado, se ele for transitável
    if (group.length === 1 && isWalkable(gameMap, tx, ty)) assign(u, wx, wy);
    else assign(u, sx, sy);
  });
}

// Ordem de movimento para um grupo, rumo a um ponto do mundo (px).
// Cancela ataque em andamento; coletores param de colher sozinhos.
// Grupo anda junto: todos na velocidade do mais lento (0 = cada um na sua)
function groupSpeedOf(group) {
  const list = group.filter(u => u.type !== 'harvester');
  if (list.length < 2) return 0;
  return Math.min(...list.map(u => UNIT_TYPES[u.type].speed));
}

function orderMove(group, wx, wy) {
  if (group.length === 0) return;
  const gs = groupSpeedOf(group);
  spreadGroup(group, wx, wy, (u, x, y) => {
    u.groupSpeed = u.type === 'harvester' ? 0 : gs;
    u.target = null;
    u.forced = false;
    u.amove = null;
    if (u.type === 'harvester') u.manual = true;
    setUnitPath(u, x, y);
  });
}

// Atacar movendo: anda até o ponto e luta com o que encontrar no caminho.
function orderAttackMove(group, wx, wy) {
  const fighters = group.filter(hasWeapon);
  if (fighters.length === 0) return;
  const gs = groupSpeedOf(fighters);
  spreadGroup(fighters, wx, wy, (u, x, y) => {
    u.groupSpeed = gs;
    u.target = null;
    u.forced = false;
    u.amove = { x, y };
    u.amoveTries = 0;
    setUnitPath(u, x, y);
  });
}

// Ordem de parar: larga caminho e alvo.
function orderStop(group) {
  group.forEach(u => {
    u.path = [];
    u.groupSpeed = 0;
    u.target = null;
    u.forced = false;
    u.amove = null;
    if (u.type === 'harvester') u.manual = true;
  });
}
