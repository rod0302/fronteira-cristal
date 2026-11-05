// IA do inimigo: colhe, constrói em ordem fixa (reconstrói o que perder),
// produz unidades, defende a base e ataca em ondas cada vez maiores.
// Joga com as mesmas regras do jogador, sem névoa. Pensa uma vez por segundo.

// Plano de construção: lido em ordem, cada entrada conta como "quero ter N desse tipo".
// Nas dificuldades com 2 fábricas, a segunda vem logo depois da segunda refinaria.
// Duas aberturas: quartel primeiro (infantaria cedo) ou fábrica primeiro (blindados cedo)
function aiPlan(factories, rng, earlyTurret) {
  const plan = rng() < 0.5
    ? ['power', 'refinery', 'barracks', 'power', 'factory', 'refinery']
    : ['power', 'refinery', 'factory', 'power', 'barracks', 'refinery'];
  if (factories >= 2) plan.push('power', 'factory');
  plan.push('radar', 'turret', 'power', 'refinery', 'turret', 'power', 'turret', 'power');
  if (factories < 2) plan.push('factory');
  plan.push('turret', 'power');
  // Normal e Difícil: uma Torre logo depois do Quartel (defesa antes da 1ª onda do jogador)
  if (earlyTurret) plan.splice(plan.indexOf('barracks') + 1, 0, 'turret');
  return plan;
}

let ais = [];

function createAI(team) {
  const diff = DIFFICULTIES[gameOptions.difficulty];
  const s = gameMap.starts[team];
  const c = { x: gameMap.w / 2, y: gameMap.h / 2 };
  // Sorteios da IA têm semente: a mesma semente repete a partida (testes);
  // pelo título, cada partida ganha uma semente nova
  const rng = makeRng(mixSeed(MAPS[gameOptions.map].seed * 31 + team * 977 + (gameOptions.aiSeed || 0) * 7919));
  return {
    team,
    rng,
    timer: 0,                                  // as duas IAs pensam no mesmo passo (justo)
    waveSize: diff.waveStart,
    nextWave: diff.firstWave + Math.round(rng() * 60 - 30), // primeira onda varia ±30 s
    nextRaid: diff.firstWave + 60,             // incursão de batedores contra coletores
    alert: null,                               // último ataque sofrido { x, y, t }
    lastDefend: -99,
    blocked: {},                               // tipo -> tempo até tentar de novo (sem lugar)
    plan: aiPlan(diff.factories, rng, diff.earlyTurret),
    waves: 0,                                  // ondas lançadas (para o aviso ao jogador)
    waveStartSize: 0,                          // tamanho da onda atual quando saiu
    broke: 0,                                  // segundos sem refinaria e sem dinheiro
    rally: {
      x: (s.x + 0.5 + (c.x - s.x - 0.5) * 0.32) * TILE, // +0.5: centro do tile (simetria exata);
      y: (s.y + 0.5 + (c.y - s.y - 0.5) * 0.32) * TILE, // 32% do caminho: fora da base, sem lotar
    },
  };
}

function aiFor(team) {
  return ais.find(a => a.team === team) || null;
}

function aiUnderAttack(team, e, attacker) {
  const ai = aiFor(team);
  if (!ai || attacker.hp <= 0) return;
  // Só chama a guarda quando o ataque é perto de casa (a onda lá fora se vira sozinha)
  const s = gameMap.starts[team];
  if (dist(e.x, e.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE) > TILE * 22) return;
  ai.alert = { x: attacker.x, y: attacker.y, t: gameTime };
}

function updateAIs(dt) {
  // As IAs pensam no mesmo passo, uma vez por segundo: quem vai primeiro alterna a cada segundo
  const order = Math.floor(gameTime) % 2 ? ais.slice().reverse() : ais;
  order.forEach(ai => {
    ai.timer += dt;
    if (ai.timer < 1) return;
    ai.timer -= 1;
    aiEconomy(ai);
    aiBuild(ai);
    aiPlace(ai);
    aiProduce(ai);
    aiArmy(ai);
  });
}

// Próximo prédio do plano que ainda falta
function aiNextBuilding(ai) {
  const counts = {};
  // Sem refinaria, reconstruí-la vem antes de tudo (depois da usina)
  if (!hasBuilding(ai.team, 'refinery') && hasBuilding(ai.team, 'power') && (ai.blocked.refinery || 0) <= gameTime) {
    return 'refinery';
  }
  for (const type of ai.plan) {
    counts[type] = (counts[type] || 0) + 1;
    if ((ai.blocked[type] || 0) > gameTime) continue;
    if (teamBuildings(ai.team, type).length >= counts[type]) continue;
    if (missingReq(ai.team, BUILDING_TYPES[type])) continue;
    return type;
  }
  return null;
}

function aiBuild(ai) {
  const t = teams[ai.team];
  if (t.construct || !hasBuilding(ai.team, 'hq')) return;
  let type = aiNextBuilding(ai);
  if (!type) {
    // Plano cumprido: com sobra de dinheiro, mais torres e usinas
    if (t.credits < 2000) return;
    type = t.powerOut - t.powerUse < 40 ? 'power' : 'turret';
  }
  // Antes de algo que consome energia, garante energia sobrando
  const p = BUILDING_TYPES[type].power || 0;
  if (p < 0 && t.powerOut - t.powerUse + p < 0) type = 'power';
  startConstruction(ai.team, type);
}

function aiPlace(ai) {
  const c = teams[ai.team].construct;
  if (!c || !c.ready) return;
  const spot = findBuildSpot(ai.team, c.type);
  if (spot) {
    placeConstruction(ai.team, spot.x, spot.y);
  } else {
    ai.blocked[c.type] = gameTime + 60;
    cancelConstruction(ai.team);
  }
}

// Lugar para um prédio: válido, com 1 tile de folga de outros prédios (passagem livre).
// Torres ficam do lado que dá para o inimigo; o resto, o mais perto da Central.
function findBuildSpot(team, type) {
  const def = BUILDING_TYPES[type];
  const own = teamBuildings(team);
  if (own.length === 0) return null;
  const anchor = own.find(b => b.type === 'hq') || own[0];
  const foe = gameMap.starts[enemyOf(team)];
  let best = null, bestScore = Infinity;
  const R = 13;
  // O lado espelhado varre de trás para frente: empates caem no lugar espelhado do outro
  const flip = sideFlip(team), n = R * 2 + 1;
  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      const y = flip ? anchor.ty + R - iy : anchor.ty - R + iy;
      const x = flip ? anchor.tx + R - ix : anchor.tx - R + ix;
      if (!hasMargin(x, y, def.w, def.h)) continue;
      if (!checkPlacement(team, type, x, y).ok) continue;
      const cx = x + def.w / 2, cy = y + def.h / 2;
      const score = type === 'turret'
        ? dist(cx, cy, foe.x + 0.5, foe.y + 0.5) + dist(cx, cy, anchor.x / TILE, anchor.y / TILE) * 0.6
        : dist(cx, cy, anchor.x / TILE, anchor.y / TILE);
      if (score < bestScore) { bestScore = score; best = { x, y }; }
    }
  }
  return best;
}

// Nenhum prédio encostado em volta do retângulo
function hasMargin(tx, ty, w, h) {
  for (let y = ty - 1; y <= ty + h; y++) {
    for (let x = tx - 1; x <= tx + w; x++) {
      if (!inBounds(gameMap, x, y)) return false;
      if (gameMap.occ[y * gameMap.w + x]) return false;
    }
  }
  return true;
}

// Economia: reparar prédios, e vender algo se ficou sem refinaria e sem dinheiro
function aiEconomy(ai) {
  const team = ai.team;
  const t = teams[team];
  teamBuildings(team).forEach(b => {
    if (b.hp < b.maxHp * 0.5 && t.credits > 500) b.repairing = true;
  });
  // Sem renda e sem dinheiro para voltar a ter (sem refinaria, ou sem nenhum coletor): vende algo
  const refineryCost = costOf(team, BUILDING_TYPES.refinery);
  const noRefinery = !hasBuilding(team, 'refinery') && t.credits < refineryCost &&
      !(t.construct && t.construct.type === 'refinery' && !t.construct.waiting);
  const harvesters = units.filter(u => u.team === team && u.type === 'harvester').length;
  const noHarvester = hasBuilding(team, 'refinery') && harvesters === 0 &&
      t.credits < costOf(team, UNIT_TYPES.harvester);
  if (noRefinery || noHarvester) {
    ai.broke++;
    if (ai.broke >= 10) {
      // Vende o prédio dispensável mais barato até poder pagar a refinaria (ou o coletor).
      // Quando o que falta é coletor, a última Fábrica fica (é ela que faz coletores).
      const factories = teamBuildings(team, 'factory').length;
      const spare = teamBuildings(team).filter(b => ['turret', 'radar', 'barracks', 'factory'].includes(b.type) &&
          !(noHarvester && b.type === 'factory' && factories <= 1))
        .sort((a, b) => BUILDING_TYPES[a.type].cost - BUILDING_TYPES[b.type].cost)[0];
      if (spare) sellBuilding(spare);
      ai.broke = 0;
    }
  } else {
    ai.broke = 0;
  }
}

// Fração de blindados no exército inimigo (para a IA escolher o contra)
function enemyHeavyShare(team) {
  const army = units.filter(u => u.team === enemyOf(team) && hasWeapon(u));
  if (army.length === 0) return 0;
  return army.filter(u => UNIT_TYPES[u.type].armor === 'heavy').length / army.length;
}

function aiProduce(ai) {
  const team = ai.team;
  const t = teams[team];
  const diff = DIFFICULTIES[gameOptions.difficulty];
  // Sem refinaria, guarda tudo para reconstruí-la
  if (!hasBuilding(team, 'refinery')) return;
  // Guarda dinheiro para o prédio em andamento
  if (t.construct && !t.construct.ready && t.credits < 300) return;

  const mine = units.filter(u => u.team === team);
  const army = mine.filter(hasWeapon);
  const heavy = enemyHeavyShare(team);
  teamBuildings(team, 'factory').forEach(f => {
    if (f.queue.length >= 2) return;
    const harvesters = mine.filter(u => u.type === 'harvester').length + queuedCount(team, 'harvester');
    const refineries = teamBuildings(team, 'refinery').length;
    let type;
    if (harvesters < Math.min(refineries * 2, diff.maxHarvesters)) {
      type = 'harvester';
    } else {
      const r = ai.rng();
      // Fácil: sem obuseiro até lateArtillery, e depois no máximo 2 (desfaz o empate em torres)
      const lateArty = diff.artillery === false && diff.lateArtillery && gameTime >= diff.lateArtillery &&
          mine.filter(u => u.type === 'artillery').length + queuedCount(team, 'artillery') < 2;
      const arty = (diff.artillery !== false || lateArty) && !missingReq(team, UNIT_TYPES.artillery);
      // Contra muitos blindados, mais blindados e obuseiros; senão, alguns batedores
      const scout = heavy > 0.4 ? 0.05 : 0.18;
      type = r < scout ? 'scout' : r < 0.72 ? 'tank' : arty ? 'artillery' : 'tank';
    }
    if (t.credits >= costOf(team, UNIT_TYPES[type]) * 0.25) queueUnit(team, type);
  });
  teamBuildings(team, 'barracks').forEach(b => {
    if (b.queue.length >= 2) return;
    // Infantaria no máximo 30% do exército (e até 12)
    const infantry = army.filter(u => UNIT_TYPES[u.type].armor === 'inf').length + b.queue.length;
    if (infantry >= 12 || (army.length > 6 && infantry > army.length * 0.3)) return;
    const type = ai.rng() < (heavy > 0.3 ? 0.75 : 0.4) ? 'rocketeer' : 'trooper';
    if (t.credits >= costOf(team, UNIT_TYPES[type])) queueUnit(team, type);
  });
}

// Alvo das ondas: prédio inimigo mais perto da base da IA (ou unidade, se não houver prédio)
function aiPickTarget(ai) {
  const home = gameMap.starts[ai.team];
  const hx = (home.x + 0.5) * TILE, hy = (home.y + 0.5) * TILE;
  let best = null, bestD = Infinity;
  const foe = enemyOf(ai.team);
  buildings.forEach(b => {
    if (b.team !== foe || b.hp <= 0) return;
    const d = dist(hx, hy, b.x, b.y);
    if (d < bestD) { bestD = d; best = b; }
  });
  if (best) return best;
  units.forEach(u => {
    if (u.team !== foe) return;
    const d = dist(hx, hy, u.x, u.y);
    if (d < bestD) { bestD = d; best = u; }
  });
  return best;
}

function nearestEnemyHarvester(team, from) {
  let best = null, bestD = Infinity;
  units.forEach(u => {
    if (u.team === team || u.type !== 'harvester' || u.hp <= 0) return;
    const d = dist(from.x, from.y, u.x, u.y);
    if (d < bestD) { bestD = d; best = u; }
  });
  return best;
}

function isIdle(u) {
  return !u.target && u.path.length === 0;
}

function aiArmy(ai) {
  const diff = DIFFICULTIES[gameOptions.difficulty];
  const army = units.filter(u => u.team === ai.team && hasWeapon(u));
  const home = army.filter(u => !u.wave && !u.raid);
  const wave = army.filter(u => u.wave);

  // Ataque grande perto de casa: a onda que está fora volta para defender (Normal e Difícil)
  if (diff.recall && wave.length && ai.alert && gameTime - ai.alert.t < 8) {
    const s0 = gameMap.starts[ai.team];
    const hx = (s0.x + 0.5) * TILE, hy = (s0.y + 0.5) * TILE;
    const raiders = units.filter(u => u.team !== ai.team && u.hp > 0 && hasWeapon(u) && dist(u.x, u.y, hx, hy) < TILE * 22);
    if (raiders.length > 8) {
      wave.forEach(u => { u.wave = false; });
      orderAttackMove(wave, ai.alert.x, ai.alert.y);
      ai.waveStartSize = 0;
      home.push(...wave);
      wave.length = 0;
    }
  }

  // Defesa: quem está em casa vai até onde a base foi atacada
  if (ai.alert && gameTime - ai.alert.t < 8 && gameTime - ai.lastDefend > 4) {
    const defenders = home.filter(u => !u.target);
    if (defenders.length) orderAttackMove(defenders, ai.alert.x, ai.alert.y);
    ai.lastDefend = gameTime;
  } else {
    // Sem ameaça: quem está parado longe se junta no ponto de encontro
    const far = home.filter(u => isIdle(u) && !u.amove && dist(u.x, u.y, ai.rally.x, ai.rally.y) > TILE * 6);
    if (far.length) orderAttackMove(far, ai.rally.x, ai.rally.y);
  }

  // Ataque em onda: parte do exército fica em casa para defender
  const goers = home.length - Math.floor(home.length * diff.keepHome);
  // Sai quando junta o tamanho da vez; se demorar demais (economia secou), sai com o que tem
  const overdue = gameTime >= ai.nextWave + diff.waveGap && goers >= 4;
  if (gameTime >= ai.nextWave && (goers >= ai.waveSize || overdue)) {
    const target = aiPickTarget(ai);
    if (target) {
      // Vão os mais longe da base; os mais perto ficam de guarda
      const s = gameMap.starts[ai.team];
      const sorted = home.slice().sort((a, b) =>
        dist(b.x, b.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE) - dist(a.x, a.y, (s.x + 0.5) * TILE, (s.y + 0.5) * TILE));
      // A onda tem pelo menos o tamanho da vez; com exército grande parado, leva mais (sem estocar até o limite)
      const size = Math.min(goers, Math.max(ai.waveSize, Math.floor(home.length * (diff.waveShare || 0))));
      const group = sorted.slice(0, size);
      group.forEach(u => { u.wave = true; });
      orderAttackMove(group, target.x, target.y);
      ai.waveStartSize = group.length;
      ai.waves++;
      // Aviso ao jogador humano: sempre na 1ª onda; no Fácil, em todas
      if (target.team === 0 && !teams[0].isAI && !demoMode && (ai.waves === 1 || diff.warnAllWaves)) {
        notify('Enemy attack on the way! Gather your army near the Turrets.', '#ff7a6a', 'alert');
      }
      ai.nextWave = gameTime + diff.waveGap;
      ai.waveSize = Math.min(diff.waveMax, ai.waveSize + diff.waveGrow);
    }
  }

  // Incursão: batedores em casa vão caçar um coletor inimigo (não no Fácil)
  if (diff.raids && gameTime >= ai.nextRaid) {
    ai.nextRaid = gameTime + 150 + ai.rng() * 60;
    const scouts = home.filter(u => u.type === 'scout' && isIdle(u));
    const prey = scouts.length >= 2 && nearestEnemyHarvester(ai.team, scouts[0]);
    if (prey) {
      scouts.slice(0, 3).forEach(u => { u.raid = true; });
      orderAttackMove(scouts.slice(0, 3), prey.x, prey.y);
    }
  }
  // Incursão terminada (alvo morto ou perdido): volta para casa
  const raiders = army.filter(u => u.raid && isIdle(u));
  if (raiders.length) {
    raiders.forEach(u => { u.raid = false; });
    orderAttackMove(raiders, ai.rally.x, ai.rally.y);
  }

  // Onda dizimada (menos de 35% de quem saiu): recua para casa
  if (wave.length && ai.waveStartSize && wave.length < ai.waveStartSize * 0.35) {
    wave.forEach(u => { u.wave = false; });
    orderMove(wave, ai.rally.x, ai.rally.y);
    ai.waveStartSize = 0;
    return;
  }

  // Onda que ficou sem alvo segue para o próximo
  const lost = wave.filter(isIdle);
  if (lost.length) {
    const target = aiPickTarget(ai);
    if (target) orderAttackMove(lost, target.x, target.y);
  }
}
