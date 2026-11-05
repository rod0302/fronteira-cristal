// Prédios: posicionamento, energia, construção, produção de unidades, reparo e venda.

let buildings = [];

function spawnBuilding(type, team, tx, ty) {
  const def = BUILDING_TYPES[type];
  const b = {
    id: nextEntityId++,
    kind: 'building',
    type, team,
    tx, ty, w: def.w, h: def.h,
    x: (tx + def.w / 2) * TILE,
    y: (ty + def.h / 2) * TILE,
    radius: Math.max(def.w, def.h) * TILE / 2,
    hp: def.hp,
    maxHp: def.hp,
    born: gameTime,    // para a animação de surgimento
    queue: [],         // fila de produção: { type, progress, spent }
    rally: null,       // ponto de encontro das unidades produzidas
    repairing: false,
    selected: false,
    // Só a torre usa estes campos
    turret: sideFlip(team) ? -3 * Math.PI / 4 : Math.PI / 4,
    target: null,
    cooldown: 0,
    lastHit: -99,
  };
  setOcc(b, b.id);
  buildings.push(b);
  updatePower(team);
  return b;
}

function setOcc(b, value) {
  for (let y = b.ty; y < b.ty + b.h; y++) {
    for (let x = b.tx; x < b.tx + b.w; x++) gameMap.occ[y * gameMap.w + x] = value;
  }
}

function findEntity(id) {
  return units.find(u => u.id === id) || buildings.find(b => b.id === id) || null;
}

function teamBuildings(team, type) {
  return buildings.filter(b => b.team === team && b.hp > 0 && (!type || b.type === type));
}

function hasBuilding(team, type) {
  return buildings.some(b => b.team === team && b.hp > 0 && b.type === type);
}

// Primeiro pré-requisito que falta (ou null se está tudo certo)
function missingReq(team, def) {
  return (def.req || []).find(r => !hasBuilding(team, r)) || null;
}

// Distância (em tiles) entre dois retângulos de tiles
function rectGap(ax, ay, aw, ah, bx, by, bw, bh) {
  const dx = Math.max(0, bx - (ax + aw), ax - (bx + bw));
  const dy = Math.max(0, by - (ay + ah), ay - (by + bh));
  return Math.max(dx, dy);
}

// Distância de um ponto (px) até a borda de uma entidade
function gapTo(x, y, e) {
  if (e.kind === 'building') {
    const x0 = e.tx * TILE, y0 = e.ty * TILE, x1 = x0 + e.w * TILE, y1 = y0 + e.h * TILE;
    const dx = Math.max(x0 - x, 0, x - x1), dy = Math.max(y0 - y, 0, y - y1);
    return Math.hypot(dx, dy);
  }
  return Math.max(0, Math.hypot(e.x - x, e.y - y) - e.radius);
}

// Verifica se um prédio cabe em (tx, ty). Devolve { ok, reason, tiles }.
// "tiles" diz, tile a tile, se está bom (para o fantasma verde/vermelho).
function checkPlacement(team, type, tx, ty) {
  const def = BUILDING_TYPES[type];
  const tiles = [];
  let reason = null;
  for (let y = ty; y < ty + def.h; y++) {
    for (let x = tx; x < tx + def.w; x++) {
      let ok = isBuildable(gameMap, x, y);
      if (!ok && !reason) reason = gameMap.occ[(y * gameMap.w + x)] ? 'Space occupied' : 'You can only build on the stone plateau';
      // Nenhuma unidade com o corpo dentro do tile
      if (ok && units.some(u => u.x + u.radius > x * TILE && u.x - u.radius < (x + 1) * TILE &&
          u.y + u.radius > y * TILE && u.y - u.radius < (y + 1) * TILE)) {
        ok = false;
        if (!reason) reason = 'Units are in the way';
      }
      tiles.push({ x, y, ok });
    }
  }
  // Não pode tapar a porta de um prédio que solta unidades
  const doors = teamBuildings(team).filter(b => ['barracks', 'factory', 'refinery'].includes(b.type));
  for (const b of doors) {
    const d = doorTile(b);
    if (d.x >= tx && d.x < tx + def.w && d.y >= ty && d.y < ty + def.h) {
      tiles.forEach(t => { if (t.x === d.x && t.y === d.y) t.ok = false; });
      if (!reason) reason = 'Would block the door of the ' + BUILDING_TYPES[b.type].name;
    }
  }
  const near = teamBuildings(team).some(b => b.type !== 'turret' && rectGap(tx, ty, def.w, def.h, b.tx, b.ty, b.w, b.h) <= BUILD_RANGE);
  if (!near) {
    tiles.forEach(t => { t.ok = false; });
    if (!reason) reason = 'Too far from the base';
  }
  return { ok: !reason, reason, tiles };
}

// Tile livre de onde as unidades saem (embaixo do prédio, ou o mais perto disso)
// A porta fica no lado de baixo ou de cima, o que estiver virado para o centro do mapa
function exitSide(b) {
  return b.y < gameMap.h * TILE / 2 ? 'bottom' : 'top';
}

// Tile logo na frente da porta (coluna do meio; com largura par, o lado espelhado usa a do outro lado)
function doorTile(b) {
  const y = exitSide(b) === 'bottom' ? b.ty + b.h : b.ty - 1;
  const x = b.tx + (sideFlip(b.team) ? Math.ceil(b.w / 2) - 1 : Math.floor(b.w / 2));
  return { x, y };
}

function buildingExit(b) {
  const d = doorTile(b);
  return nearestWalkable(gameMap, d.x, d.y, 8, b.team);
}

// ---- Energia ----

function updatePower(team) {
  const t = teams[team];
  let out = 0, use = 0;
  buildings.forEach(b => {
    if (b.team !== team || b.hp <= 0) return;
    const p = BUILDING_TYPES[b.type].power || 0;
    if (p > 0) out += p; else use -= p;
  });
  const wasLow = t.powerUse > t.powerOut;
  t.powerOut = out;
  t.powerUse = use;
  if (team === 0 && gameState === 'playing' && !teams[0].isAI) {
    if (!wasLow && use > out) announce('energia_baixa', { cue: 'powerdown' });
    else if (wasLow && use <= out) announce('energia_ok', { cue: 'powerup' });
  }
  t.hasRadar = hasBuilding(team, 'radar') && use <= out;
}

// Velocidade de produção: metade sem energia; a IA ainda usa o fator da dificuldade
function productionSpeed(team) {
  let s = lowPower(team) ? 0.5 : 1;
  if (teams[team].isAI) s *= DIFFICULTIES[gameOptions.difficulty].buildSpeed;
  return s;
}

// Avança um item de produção, pagando aos poucos. Devolve true quando termina.
// Sem créditos, o item fica parado esperando (item.waiting = true).
function advanceItem(team, item, def, dt) {
  const total = costOf(team, def);
  const step = Math.min(1 - item.progress, productionSpeed(team) * dt / def.build);
  const price = total * step;
  if (teams[team].credits < price) {
    if (!item.waiting && team === 0 && !teams[0].isAI) announce('sem_creditos'); // só o aviso falado
    item.waiting = true;
    return false;
  }
  item.waiting = false;
  teams[team].credits -= price;
  item.spent += price;
  item.progress += step;
  return item.progress >= 0.9999;
}

// ---- Construção de prédios (uma por vez, pela Central) ----

// Começa a construir. Devolve null se deu certo ou o motivo de não poder.
function startConstruction(team, type) {
  const t = teams[team];
  const def = BUILDING_TYPES[type];
  if (!def || def.buildable === false) return "That can't be built";
  if (!hasBuilding(team, 'hq')) return 'No Headquarters: nothing can be built';
  if (t.construct) return 'A construction is already in progress';
  const miss = missingReq(team, def);
  if (miss) return 'Requer ' + BUILDING_TYPES[miss].name;
  t.construct = { type, progress: 0, spent: 0, ready: false, waiting: false };
  return null;
}

function cancelConstruction(team) {
  const t = teams[team];
  if (!t.construct) return;
  t.credits += t.construct.spent;
  t.construct = null;
}

function updateConstruction(team, dt) {
  const t = teams[team];
  const c = t.construct;
  if (!c) return;
  // Sem Central não se constrói: a obra (mesmo pronta) é cancelada e o dinheiro volta
  if (!hasBuilding(team, 'hq')) {
    cancelConstruction(team);
    if (team === 0) notify('No Headquarters: construction canceled and credits refunded.', '#ff7a6a');
    return;
  }
  if (c.ready) return;
  if (advanceItem(team, c, BUILDING_TYPES[c.type], dt)) {
    c.ready = true;
    if (team === 0 && !demoMode) {
      const def = BUILDING_TYPES[c.type];
      notify(def.name + ' ' + 'ready: click the button and choose where to place it', '#c8ffc6', 'ready');
      announce(LINES['pronto_' + c.type] ? 'pronto_' + c.type : 'construcao_pronta', { cue: 'ready' });
    }
  }
}

// Coloca o prédio pronto no mapa. Devolve o prédio ou null.
function placeConstruction(team, tx, ty) {
  const t = teams[team];
  const c = t.construct;
  if (!c || !c.ready || !hasBuilding(team, 'hq')) return null;
  if (!checkPlacement(team, c.type, tx, ty).ok) return null;
  const b = spawnBuilding(c.type, team, tx, ty);
  t.construct = null;
  t.stats.built++;
  // A Refinaria já vem com um Coletor
  if (b.type === 'refinery' && unitCount(team) >= UNIT_CAP && team === 0) {
    notify('Unit limit reached: the Refinery came without its free Harvester.', '#ffcf6a');
  } else if (b.type === 'refinery') {
    const exit = buildingExit(b);
    if (exit) {
      const h = spawnUnit('harvester', team, exit.x, exit.y);
      announceHarvester(h, 0.8); // "Harvester deployed" na hora em que o Coletor sai da Refinaria
    }
  }
  if (team === 0 && !demoMode) sfx('place', b.x, b.y);
  return b;
}

// ---- Produção de unidades ----

function producersFor(team, unitType) {
  return teamBuildings(team, UNIT_TYPES[unitType].from);
}

// Motivo de não poder produzir (ou null)
function unitBlockReason(team, type) {
  const def = UNIT_TYPES[type];
  if (!hasBuilding(team, def.from)) return 'Requer ' + BUILDING_TYPES[def.from].name;
  const miss = missingReq(team, def);
  if (miss) return 'Requer ' + BUILDING_TYPES[miss].name;
  return null;
}

// Põe uma unidade na fila do produtor menos ocupado. Devolve null ou o motivo.
function unitCount(team) {
  let n = units.filter(u => u.team === team).length;
  buildings.forEach(b => { if (b.team === team) n += b.queue.length; });
  return n;
}

function queueUnit(team, type) {
  const why = unitBlockReason(team, type);
  if (why) return why;
  if (unitCount(team) >= UNIT_CAP) return 'Unit limit of ' + UNIT_CAP + ' reached';
  const prods = producersFor(team, type).sort((a, b) => a.queue.length - b.queue.length);
  const p = prods[0];
  if (p.queue.length >= QUEUE_MAX) return 'Fila cheia';
  p.queue.push({ type, progress: 0, spent: 0, waiting: false });
  return null;
}

// Tira da fila a última unidade desse tipo, devolvendo o que já foi pago.
function cancelUnit(team, type) {
  const prods = producersFor(team, type);
  for (const p of prods) {
    for (let i = p.queue.length - 1; i >= 0; i--) {
      if (p.queue[i].type !== type) continue;
      teams[team].credits += p.queue[i].spent;
      p.queue.splice(i, 1);
      return true;
    }
  }
  return false;
}

function queuedCount(team, type) {
  let n = 0;
  producersFor(team, type).forEach(p => p.queue.forEach(q => { if (q.type === type) n++; }));
  return n;
}

// Item em produção agora desse tipo (o primeiro da fila de algum produtor)
function activeItem(team, type) {
  for (const p of producersFor(team, type)) {
    if (p.queue.length && p.queue[0].type === type) return p.queue[0];
  }
  return null;
}

function updateProduction(b, dt) {
  const item = b.queue[0];
  if (!item) return;
  const def = UNIT_TYPES[item.type];
  if (item.progress < 0.9999 && !advanceItem(b.team, item, def, dt)) return;
  // Pronta: sai pela porta (se a porta estiver livre)
  const exit = buildingExit(b);
  if (!exit) return;
  b.queue.shift();
  const u = spawnUnit(item.type, b.team, exit.x, exit.y);
  teams[b.team].stats.built++;
  if (item.type !== 'harvester') {
    const out = exitSide(b) === 'bottom' ? 3.5 : -2.5; // 3 tiles para fora da porta
    const r = b.rally || { x: (exit.x + 0.5) * TILE, y: (exit.y + out) * TILE };
    const slot = freeSlotNear(r.x, r.y, b.team);
    if (slot) setUnitPath(u, slot.x, slot.y);
  }
  if (b.team === 0 && !demoMode) {
    sfx('unit', b.x, b.y);
    if (item.type === 'harvester') announceHarvester(u); // "Harvester deployed" na hora em que sai da Fábrica
    else announce('unidade_' + item.type); // "Tank ready"...
    notify(def.name + ' ready', null, 'unit');
  }
}

// ---- Reparo e venda ----

function updateRepair(b, dt) {
  if (!b.repairing) return;
  if (b.hp >= b.maxHp) {
    b.repairing = false;
    return;
  }
  const heal = Math.min(b.maxHp - b.hp, b.maxHp * dt / REPAIR_TIME);
  const def = BUILDING_TYPES[b.type];
  const base = def.repairBase || costOf(b.team, def);
  const price = base * REPAIR_COST * heal / b.maxHp;
  if (teams[b.team].credits < price) return;
  teams[b.team].credits -= price;
  b.hp += heal;
}

// Vaga livre perto de um ponto (px), para unidades novas não pararem empilhadas
function freeSlotNear(x, y, team = 0) {
  const slots = formationSlots(gameMap, Math.floor(x / TILE), Math.floor(y / TILE), 24, team);
  for (const s of slots) {
    const cx = s.x * TILE + TILE / 2, cy = s.y * TILE + TILE / 2;
    if (!units.some(u => u.path.length === 0 && Math.abs(u.x - cx) < TILE * 0.6 && Math.abs(u.y - cy) < TILE * 0.6)) {
      return { x: cx, y: cy };
    }
  }
  return slots.length ? { x: slots[0].x * TILE + TILE / 2, y: slots[0].y * TILE + TILE / 2 } : null;
}

function sellBuilding(b) {
  if (b.hp <= 0 || BUILDING_TYPES[b.type].noSell) return false;
  const def = BUILDING_TYPES[b.type];
  // A Refinaria vale menos na venda: o Coletor que veio junto já foi aproveitado
  const base = def.sellBase !== undefined ? def.sellBase : costOf(b.team, def);
  teams[b.team].credits += Math.round(base * SELL_REFUND * b.hp / b.maxHp);
  b.queue.forEach(q => { teams[b.team].credits += q.spent; });
  b.hp = 0;
  b.sold = true;
  setOcc(b, 0);
  if (b.team !== 0 && b.seen && gameOptions.fog && !isVisibleToPlayer(b)) {
    ghosts.push(Object.assign({}, b, { selected: false, repairing: false }));
  }
  effects.push({ kind: 'dust', x: b.x, y: b.y, size: b.radius, t: 0, dur: 0.8 });
  if (b.team === 0 && !demoMode) { sfx('sell', b.x, b.y); announce('vendido'); }
  updatePower(b.team);
  return true;
}

// Prédio destruído em combate
function destroyBuilding(b) {
  setOcc(b, 0);
  if (b.team !== 0 && b.seen && gameOptions.fog && !isVisibleToPlayer(b)) {
    ghosts.push(Object.assign({}, b, { selected: false, repairing: false }));
  }
  effects.push({ kind: 'boom', x: b.x, y: b.y, size: b.radius * 0.8, t: 0, dur: 1.1 });
  decals.push({ x: b.x, y: b.y, r: b.radius, angle: 0, rubble: true, w: b.w, h: b.h });
  if (decals.length > MAX_DECALS) decals.shift();
  sfx('bigboom', b.x, b.y);
  if (b.team === 0) announce(b.type === 'hq' ? 'central_perdida' : 'estrutura_perdida');
  else if (isVisibleToPlayer(b)) announce('inimigo_destruido', { lead: 0.8 });
  updatePower(b.team);
}

function updateBuildings(dt) {
  fairEach(teams, (t, i) => {
    updatePower(i);
    updateConstruction(i, dt);
  });
  fairEach(buildings, b => {
    if (b.hp <= 0) return;
    updateProduction(b, dt);
    updateRepair(b, dt);
  });
}
