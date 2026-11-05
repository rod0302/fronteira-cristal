// Combate: escolha de alvo, perseguição, tiro, projéteis, dano, explosões e morte.

const MAX_DECALS = 80;     // marcas no chão (as mais antigas somem)

let projectiles = [];
let effects = [];   // clarões, impactos e explosões (somem sozinhos)
let decals = [];    // marcas de queimado e escombros
let pings = [];     // alertas piscando no minimapa { x, y, t }
let stepCount = 0;       // passos simulados (escalona buscas caras)
let alertLast = {};      // último aviso de cada tipo (base, coletor, unidades): um não cala o outro
let lastAlertPos = null; // onde foi o último ataque à base do jogador (Espaço leva até lá)

function weaponDef(e) {
  return e.kind === 'unit' ? UNIT_TYPES[e.type] : BUILDING_TYPES[e.type];
}

// Tempo entre tiros, com bônus da facção (e o dobro para torre sem energia)
function cooldownOf(e) {
  let c = weaponDef(e).cooldown * TEAMS[e.team].rofMul;
  if (e.kind === 'building' && lowPower(e.team)) c *= 2;
  return c;
}

// Dá para mirar nessa entidade? O jogador só mira no que está vendo.
function canTarget(team, e) {
  if (e.hp <= 0 || e.team === team) return false;
  if (team === 0 && gameOptions.fog && !isVisibleToPlayer(e)) return false;
  return true;
}

// Inimigo mais próximo dentro de um raio (px). Unidades têm prioridade sobre prédios.
function findNearestEnemy(x, y, team, radius) {
  let best = null, bestD = radius;
  units.forEach(o => {
    if (!canTarget(team, o)) return;
    const d = gapTo(x, y, o);
    if (d <= bestD) { best = o; bestD = d; }
  });
  if (best) return best;
  buildings.forEach(b => {
    if (!canTarget(team, b)) return;
    const d = gapTo(x, y, b);
    if (d <= bestD) { best = b; bestD = d; }
  });
  return best;
}

// Unidade inimiga armada mais perto (para largar um prédio e se defender)
function nearestArmedUnit(x, y, team, radius) {
  let best = null, bestD = radius;
  units.forEach(o => {
    if (!hasWeapon(o) || !canTarget(team, o)) return;
    const d = gapTo(x, y, o);
    if (d <= bestD) { best = o; bestD = d; }
  });
  return best;
}

// Ataque mandado pelo jogador: persegue até matar, sem desistir.
function orderAttack(group, target) {
  group.forEach(u => {
    if (!hasWeapon(u) || u.team === target.team) return;
    u.target = target;
    u.forced = true;
    u.amove = null;
    u.path = [];
    u.repath = 0;
  });
}

// Decide o que cada unidade armada faz neste passo: procurar alvo, perseguir ou atirar.
function thinkUnit(u, dt) {
  if (!hasWeapon(u)) return;
  const def = UNIT_TYPES[u.type];
  u.cooldown = Math.max(0, u.cooldown - dt);

  if (u.target && (u.target.hp <= 0 || (!u.forced && !canTarget(u.team, u.target)))) {
    u.target = null;
    u.forced = false;
  }
  // Alvo de ordem direta sumiu na névoa: vai até onde foi visto por último e para
  if (u.target && u.forced && u.target.kind === 'unit' && !canTarget(u.team, u.target)) {
    setUnitPath(u, u.target.x, u.target.y);
    u.target = null;
    u.forced = false;
  }

  // Andando por ordem de mover: não para, mas atira no que passar ao alcance
  if (!u.target && u.path.length > 0 && !u.amove) {
    const e = findNearestEnemy(u.x, u.y, u.team, def.range);
    if (!e) {
      if (def.turretTurn) u.turret = turnToward(u.turret, u.angle, def.turretTurn * dt);
      return;
    }
    const want = Math.atan2(e.y - u.y, e.x - u.x);
    if (def.turretTurn) u.turret = turnToward(u.turret, want, def.turretTurn * dt);
    const aim = def.turretTurn ? u.turret : u.angle;
    if (u.cooldown === 0 && Math.abs(angleDiff(aim, want)) < 0.3) {
      fire(u, e, aim);
      u.cooldown = cooldownOf(u);
    }
    return;
  }

  // Parada (ou atacando-movendo) e sem alvo: procura quem estiver perto.
  // A busca roda a cada 10 passos por unidade (escalonada pelo id), para poupar CPU.
  if (!u.target && (u.path.length === 0 || u.amove) && (stepCount + u.id) % 10 === 0) {
    const e = findNearestEnemy(u.x, u.y, u.team, def.acquire);
    if (e) {
      u.target = e;
      u.forced = false;
      u.repath = 0;
    }
  }

  // Batendo num prédio por conta própria: se um inimigo armado chegar perto, ele vira o alvo
  if (u.target && u.target.kind === 'building' && !u.forced && (stepCount + u.id) % 10 === 0) {
    const e = nearestArmedUnit(u.x, u.y, u.team, def.acquire);
    if (e) u.target = e;
  }

  const t = u.target;
  if (!t) {
    // Atacando-movendo e o alvo morreu: retoma o caminho até o destino
    // (destino lotado: perto o bastante, ou depois de 3 tentativas, dá por chegado)
    if (u.amove && u.path.length === 0) {
      u.amoveTries = (u.amoveTries || 0) + 1;
      if (dist(u.x, u.y, u.amove.x, u.amove.y) > TILE * 2.5 && u.amoveTries <= 3) setUnitPath(u, u.amove.x, u.amove.y);
      else { u.amove = null; u.amoveTries = 0; }
    }
    if (def.turretTurn) u.turret = turnToward(u.turret, u.angle, def.turretTurn * dt);
    return;
  }

  const gap = gapTo(u.x, u.y, t);
  const want = Math.atan2(t.y - u.y, t.x - u.x);

  // Alvo automático que fugiu para longe: desiste
  if (!u.forced && gap > def.acquire * 1.6) {
    u.target = null;
    u.path = [];
    return;
  }

  if (def.turretTurn) u.turret = turnToward(u.turret, want, def.turretTurn * dt);

  if (gap > def.range) {
    // Fora de alcance: persegue, recalculando o caminho de tempos em tempos
    u.repath -= dt;
    if (u.repath <= 0 || u.path.length === 0) {
      setUnitPath(u, t.x, t.y);
      u.repath = 0.6;
    }
    return;
  }

  // No alcance: para, mira e atira
  u.path = [];
  let aim;
  if (def.turretTurn) {
    aim = u.turret;
  } else {
    u.angle = turnToward(u.angle, want, def.turn * dt);
    aim = u.angle;
  }
  if (u.cooldown === 0 && Math.abs(angleDiff(aim, want)) < 0.15) {
    fire(u, t, aim);
    u.cooldown = cooldownOf(u);
  }
}

// Torre de defesa: gira e atira no inimigo mais próximo dentro do alcance
function thinkTurret(b, dt) {
  const def = BUILDING_TYPES[b.type];
  b.cooldown = Math.max(0, b.cooldown - dt);
  if (b.target && (!canTarget(b.team, b.target) || gapTo(b.x, b.y, b.target) > def.range)) b.target = null;
  if (!b.target) b.target = findNearestEnemy(b.x, b.y, b.team, def.acquire);
  if (!b.target) return;
  const want = Math.atan2(b.target.y - b.y, b.target.x - b.x);
  b.turret = turnToward(b.turret, want, def.turretTurn * dt);
  if (b.cooldown === 0 && Math.abs(angleDiff(b.turret, want)) < 0.12) {
    fire(b, b.target, b.turret);
    b.cooldown = cooldownOf(b);
  }
}

function fire(e, target, aim) {
  const def = weaponDef(e);
  const muzzle = def.shot === 'bullet' ? e.radius + 2 : 17;
  const x = e.x + Math.cos(aim) * muzzle, y = e.y + Math.sin(aim) * muzzle;
  projectiles.push({
    kind: def.shot,
    x, y, sx: x, sy: y,
    tx: target.x, ty: target.y,
    target, owner: e, team: e.team,
    damage: def.damage,
    splash: def.splash || 0,
  });
  effects.push({ kind: 'muzzle', x, y, angle: aim, t: 0, dur: 0.08 });
  shotSound(e, x, y);
  if (def.shot === 'arty') incomingSound(target.x, target.y, Math.hypot(target.x - x, target.y - y) / SHOTS.arty.speed);
}

// Tiros diretos perseguem o alvo; artilharia cai no ponto mirado e atinge em área.
function updateProjectiles(dt) {
  projectiles.forEach(p => {
    const homing = p.kind !== 'arty';
    if (homing && p.target.hp > 0) { p.tx = p.target.x; p.ty = p.target.y; }
    const dx = p.tx - p.x, dy = p.ty - p.y;
    const d = Math.hypot(dx, dy);
    const step = SHOTS[p.kind].speed * dt;
    if (d > step) {
      p.x += dx / d * step;
      p.y += dy / d * step;
      return;
    }
    p.done = true;
    if (p.splash) {
      effects.push({ kind: 'hit', x: p.tx, y: p.ty, big: true, size: p.splash, t: 0, dur: 0.45 });
      impactSound(p.kind, p.tx, p.ty);
      const victims = units.concat(buildings).filter(e => e.hp > 0 && e.team !== p.team);
      victims.forEach(e => {
        const g = gapTo(p.tx, p.ty, e);
        if (g <= p.splash) damageEntity(e, p.damage * (1 - 0.5 * g / p.splash), p.owner, p.kind);
      });
    } else {
      effects.push({ kind: 'hit', x: p.tx, y: p.ty, big: p.kind !== 'bullet', t: 0, dur: 0.3 });
      impactSound(p.kind, p.tx, p.ty, p.target);
      if (p.target.hp > 0) damageEntity(p.target, p.damage, p.owner, p.kind);
    }
  });
  projectiles = projectiles.filter(p => !p.done);
}

function armorOf(e) {
  return e.kind === 'building' ? 'bldg' : UNIT_TYPES[e.type].armor;
}

function damageEntity(e, raw, attacker, kind) {
  if (e.hp <= 0) return;
  e.hp -= raw * DAMAGE_MOD[kind][armorOf(e)];
  e.lastHit = gameTime;
  onAttacked(e, attacker);
  if (e.hp <= 0) {
    e.hp = 0;
    killEntity(e, attacker);
    return;
  }
  // Atacada enquanto parada e sem alvo, ou batendo num prédio por conta própria: revida
  const busyWithBuilding = e.target && e.target.kind === 'building' && !e.forced;
  if (e.kind === 'unit' && hasWeapon(e) && attacker && attacker.hp > 0 &&
      ((!e.target && e.path.length === 0) || (busyWithBuilding && attacker.kind === 'unit'))) {
    e.target = attacker;
    e.forced = false;
  }
}

// Avisos de ataque: alerta para o jogador, chamada de defesa para a IA
function onAttacked(e, attacker) {
  if (!attacker) return;
  const t = teams[e.team];
  if (t.isAI) {
    aiUnderAttack(e.team, e, attacker);
    return;
  }
  // Prédio e coletor sempre avisam; unidade de combate só quando está fora da tela
  const important = e.kind === 'building' || e.type === 'harvester';
  const kind = e.kind === 'building' ? 'base' : e.type === 'harvester' ? 'coletor' : 'unidades';
  if (e.team === 0 && (important || !isPointOnScreen(e.x, e.y)) && gameTime - (alertLast[kind] ?? -999) > 20) {
    alertLast[kind] = gameTime;
    t.lastAlert = gameTime;
    const what = e.kind === 'building' ? 'Base sob ataque!' : e.type === 'harvester' ? 'Coletor sob ataque!' : 'Unidades sob ataque!';
    notify(what + ' (Espaço: ir até lá)', '#ff7a6a', 'alert');
    lastAlertPos = { x: e.x, y: e.y };
    // A sirene e a voz saem juntas pela fila do locutor: a sirene toca, a voz entra logo depois dela
    announce(kind === 'base' ? 'base_ataque' : kind === 'coletor' ? 'coletor_ataque' : 'unidades_ataque', { cue: 'alert' });
    pings.push({ x: e.x, y: e.y, t: 0 });
  }
}

function killEntity(e, attacker) {
  teams[e.team].stats.lost++;
  if (attacker && teams[attacker.team]) teams[attacker.team].stats.killed++;
  if (e.kind === 'building') {
    destroyBuilding(e);
    if (e.team === 0) {
      const def = BUILDING_TYPES[e.type];
      notify(def.name + ' ' + genderize(def, 'destruíd'), '#ff7a6a', 'alert');
    }
    return;
  }
  effects.push({ kind: 'boom', x: e.x, y: e.y, size: e.radius, t: 0, dur: 0.8 });
  if (UNIT_TYPES[e.type].armor !== 'inf') {
    decals.push({ x: e.x, y: e.y, r: e.radius + 6, angle: e.angle });
    if (decals.length > MAX_DECALS) decals.shift();
  }
  deathSound(e);
  if (e.team === 0) announce(e.type === 'harvester' ? 'coletor_perdido' : 'unidade_perdida');
}

function updateEffects(dt) {
  effects.forEach(e => { e.t += dt; });
  effects = effects.filter(e => e.t < e.dur);
  pings.forEach(p => { p.t += dt; });
  pings = pings.filter(p => p.t < 3);
}

function removeDeadEntities() {
  if (units.some(u => u.hp <= 0)) units = units.filter(u => u.hp > 0);
  if (buildings.some(b => b.hp <= 0)) buildings = buildings.filter(b => b.hp > 0);
}

// Combate em duas partes: pensar (antes de mover) e resolver tiros e mortes (depois).
function updateCombat(dt) {
  stepCount++;
  fairEach(units, u => thinkUnit(u, dt));
  fairEach(buildings, b => { if (b.type === 'turret' && b.hp > 0) thinkTurret(b, dt); });
}

function resolveCombat(dt) {
  updateProjectiles(dt);
  updateEffects(dt);
  removeDeadEntities();
}
