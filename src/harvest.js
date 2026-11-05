// Coletores: ciclo automático campo de cristal -> refinaria -> campo.
//
// Estados (u.hstate):
//   idle        procurando cristal ou esperando
//   toField     indo até um tile de cristal
//   harvest     colhendo no tile atual
//   toRefinery  levando a carga
//   unload      descarregando na refinaria

const HARVEST_SEARCH_NODES = 2500; // limite da busca por cristal

function nearestRefinery(u) {
  let best = null, bestD = Infinity;
  teamBuildings(u.team, 'refinery').forEach(r => {
    const d = dist(u.x, u.y, r.x, r.y);
    if (d < bestD) { bestD = d; best = r; }
  });
  return best;
}

function tileCenter(t) {
  return { x: t.x * TILE + TILE / 2, y: t.y * TILE + TILE / 2 };
}

// Tile de cristal mais próximo (por caminho) a partir de um ponto,
// evitando tiles que outro coletor já reservou.
function findCrystalNear(u, sx, sy) {
  const map = gameMap;
  const claimed = new Set();
  units.forEach(o => { if (o !== u && o.type === 'harvester' && o.claim >= 0) claimed.add(o.claim); });
  const start = nearestWalkable(map, sx, sy, 12, u.team);
  if (!start) return null;
  const seen = new Set([start.y * map.w + start.x]);
  const queue = [start];
  for (let i = 0; i < queue.length && i < HARVEST_SEARCH_NODES; i++) {
    const t = queue[i];
    const idx = t.y * map.w + t.x;
    if (map.tiles[idx] === TERRAIN.CRYSTAL && !claimed.has(idx)) return t;
    for (const [dx, dy] of dirsFor(u.team)) {
      const nx = t.x + dx, ny = t.y + dy;
      const key = ny * map.w + nx;
      if (seen.has(key) || !isWalkable(map, nx, ny)) continue;
      seen.add(key);
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

// Busca de reserva, quando não há cristal perto: o tile de cristal livre mais próximo
// em linha reta no mapa inteiro (o caminho até lá é por conta do A*)
function findCrystalAnywhere(u) {
  const map = gameMap;
  const claimed = new Set();
  units.forEach(o => { if (o !== u && o.type === 'harvester' && o.claim >= 0) claimed.add(o.claim); });
  const ut = unitTile(u);
  let best = null, bestD = Infinity;
  for (let i = 0; i < map.w * map.h; i++) {
    if (map.tiles[i] !== TERRAIN.CRYSTAL || claimed.has(i)) continue;
    const x = i % map.w, y = (i / map.w) | 0;
    if (!isWalkable(map, x, y)) continue;
    const d = (x - ut.x) ** 2 + (y - ut.y) ** 2;
    if (d < bestD) { bestD = d; best = { x, y }; }
  }
  return best;
}

// Vai descarregar na refinaria mais próxima (ou na indicada)
function goUnload(u, refinery) {
  const r = refinery && refinery.hp > 0 ? refinery : nearestRefinery(u);
  u.claim = -1;
  if (!r) {
    u.hstate = 'idle';
    u.wait = 3;
    return;
  }
  u.refinery = r;
  const dock = buildingExit(r);
  if (!dock) {
    u.hstate = 'idle';
    u.wait = 2;
    return;
  }
  const c = tileCenter(dock);
  setUnitPath(u, c.x, c.y);
  u.hstate = 'toRefinery';
  u.tries = (u.tries || 0) + 1;
}

function updateHarvester(u, dt) {
  const def = UNIT_TYPES.harvester;

  // Movido pelo jogador: ao chegar, espera 3 s e volta a colher por perto
  if (u.manual) {
    if (u.path.length > 0) {
      u.wait = 0;
      return;
    }
    u.wait -= dt;
    if (u.wait > -3) return;
    u.manual = false;
    u.field = unitTile(u);
    u.hstate = 'idle';
    u.wait = 0;
  }

  switch (u.hstate) {
    case 'idle': {
      u.wait -= dt;
      if (u.wait > 0) return;
      if (u.cargo >= def.capacity) {
        goUnload(u);
        return;
      }
      const from = u.field || unitTile(u);
      const t = findCrystalNear(u, from.x, from.y) || findCrystalNear(u, unitTile(u).x, unitTile(u).y) ||
        findCrystalAnywhere(u);
      if (!t) {
        if (u.team === 0 && !mapEmptyWarned && !gameMap.tiles.includes(TERRAIN.CRYSTAL)) {
          mapEmptyWarned = true;
          notify('The crystal on the map has run out: income has stopped. Make the most of what you have.', '#ffcf6a');
        }
        if (u.cargo > 0) goUnload(u);
        else u.wait = 2;
        return;
      }
      u.claim = t.y * gameMap.w + t.x;
      u.field = t;
      if (u.team === 0) warnFarCrystal(u, t);
      const c = tileCenter(t);
      setUnitPath(u, c.x, c.y);
      u.hstate = 'toField';
      return;
    }

    case 'toField': {
      if (u.path.length > 0) return;
      const ut = unitTile(u);
      if (isCrystal(gameMap, ut.x, ut.y)) {
        u.claim = ut.y * gameMap.w + ut.x;
        u.hstate = 'harvest';
        if (u.team === 0) announceHarvester(u); // primeira vez no cristal: "Harvester deployed"
      } else {
        u.hstate = 'idle';
      }
      return;
    }

    case 'harvest': {
      const ut = unitTile(u);
      const room = def.capacity - u.cargo;
      const got = takeCrystal(gameMap, ut.x, ut.y, Math.min(room, def.harvestRate * dt));
      u.cargo += got;
      if (u.cargo >= def.capacity - 0.01) {
        u.cargo = def.capacity;
        u.tries = 0;
        goUnload(u);
      } else if (got === 0) {
        u.field = ut;
        u.claim = -1;
        u.hstate = 'idle';
      }
      return;
    }

    case 'toRefinery': {
      const r = u.refinery;
      if (!r || r.hp <= 0) {
        goUnload(u);
        return;
      }
      if (u.path.length > 0) return;
      const dock = buildingExit(r);
      const c = dock ? tileCenter(dock) : { x: r.x, y: r.y };
      const near = dist(u.x, u.y, c.x, c.y) < TILE * 1.5 || gapTo(u.x, u.y, r) < TILE * 1.2;
      if (near || (u.tries > 3 && gapTo(u.x, u.y, r) < TILE * 3)) {
        u.hstate = 'unload';
        u.tries = 0;
      } else if (u.tries > 6) {
        // Doca inalcançável: espera um pouco e tenta de novo
        u.tries = 0;
        u.hstate = 'idle';
        u.wait = 3;
      } else {
        goUnload(u, r);
      }
      return;
    }

    case 'unload': {
      const r = u.refinery;
      if (!r || r.hp <= 0) {
        u.hstate = 'idle';
        return;
      }
      const amount = Math.min(u.cargo, def.unloadRate * dt);
      u.cargo -= amount;
      const t = teams[u.team];
      const mul = t.isAI ? DIFFICULTIES[gameOptions.difficulty].income : 1;
      t.credits += amount * mul;
      t.stats.harvested += amount * mul;
      if (u.team === 0) sfx('credits', u.x, u.y);
      if (u.cargo <= 0.01) {
        u.cargo = 0;
        u.hstate = 'idle';
        u.wait = 0;
      }
      return;
    }
  }
}

// Aviso ao jogador quando o cristal perto das refinarias acabou (no máximo a cada 2 min)
let lastFarCrystalWarning = -999;
let mapEmptyWarned = false;
function warnFarCrystal(u, t) {
  const r = nearestRefinery(u);
  if (!r || gameTime - lastFarCrystalWarning < 120) return;
  const c = tileCenter(t);
  if (dist(c.x, c.y, r.x, r.y) < TILE * 18) return;
  lastFarCrystalWarning = gameTime;
  notify('Crystal near the Refinery is running out: Harvesters must travel far. Build a Refinery near another field.', '#ffcf6a');
}

function updateHarvesters(dt) {
  fairEach(units, u => {
    if (u.type === 'harvester' && u.hp > 0) updateHarvester(u, dt);
  });
}

// Ordem do jogador: colher a partir de um tile de cristal
function orderHarvest(group, tx, ty) {
  group.forEach(u => {
    if (u.type !== 'harvester') return;
    u.manual = false;
    u.field = { x: tx, y: ty };
    u.claim = -1;
    u.hstate = 'idle';
    u.wait = 0;
    u.path = [];
  });
}

// Ordem do jogador: voltar e descarregar numa refinaria
function orderReturn(group, refinery) {
  group.forEach(u => {
    if (u.type !== 'harvester') return;
    u.manual = false;
    u.tries = 0;
    goUnload(u, refinery);
  });
}
