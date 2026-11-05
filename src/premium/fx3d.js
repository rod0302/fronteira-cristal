// Modo Premium: efeitos em 3D. Partículas (fogo, fumaça iluminada, faíscas com gravidade, poeira,
// vapor), destroços que voam e quicam, luzes dinâmicas, marcas no chão e ondas de choque.
// Tudo anda no tempo do quadro e usa Math.random à vontade: nada aqui altera a partida.

const PT_SMOKE = 0, PT_FIRE = 1, PT_SPARK = 2, PT_DUST = 3, PT_FLASH = 4, PT_GLINT = 5, PT_STEAM = 6, PT_DARK = 7, PT_TRACER = 8, PT_EMBER = 9;
const PFX_STRIDE = 16;

const pfx = {
  cap: 2600,
  n: 0,
  d: null,           // Float32Array cap * PFX_STRIDE
  debris: [],        // { x,y,z, vx,vy,vz, rx, rz, sr, s, life, t, k }
  lights: [],        // { x,y,z,r, c:[r,g,b], t, life, flick }
  tracks: [],        // { x,y,a,w,t,wheel }
  later: [],         // explosões secundárias agendadas { t, x, y, z, s }
  waves: [],         // { x,y,z,r0,r1,t,life,water }
  scorch: [],        // crateras de explosão { x,y,z,r,t,life,water }
  seen: new WeakSet(),
  projSeen: new WeakSet(),
  trail: new WeakMap(),
  ustate: new WeakMap(),
};

// Campos de cada partícula
// 0 x, 1 y, 2 z, 3 vx, 4 vy, 5 vz, 6 t, 7 life, 8 size, 9 grow, 10 type, 11 alpha, 12 drag, 13 lift(+z/s²), 14 rot, 15 seed
function pfxInit(cap) {
  pfx.cap = cap;
  pfx.d = new Float32Array(cap * PFX_STRIDE);
  pfx.n = 0;
}

function pfxReset() {
  pfx.n = 0;
  pfx.debris = [];
  pfx.lights = [];
  pfx.tracks = [];
  pfx.waves = [];
  pfx.scorch = [];
}

function pEmit(type, x, y, z, vx, vy, vz, life, size, grow, alpha, drag, lift) {
  if (pfx.n >= pfx.cap) {
    // Cheio: troca a partícula mais velha de um tipo comum por esta
    const i = (Math.random() * pfx.cap) | 0;
    pfx.n--;
    pfx.d.copyWithin(i * PFX_STRIDE, pfx.n * PFX_STRIDE, pfx.n * PFX_STRIDE + PFX_STRIDE);
  }
  const o = pfx.n++ * PFX_STRIDE, d = pfx.d;
  d[o] = x; d[o + 1] = y; d[o + 2] = z;
  d[o + 3] = vx; d[o + 4] = vy; d[o + 5] = vz;
  d[o + 6] = 0; d[o + 7] = life; d[o + 8] = size; d[o + 9] = grow || 0;
  d[o + 10] = type; d[o + 11] = alpha === undefined ? 1 : alpha; d[o + 12] = drag || 0; d[o + 13] = lift || 0;
  d[o + 14] = Math.random() * 6.283; d[o + 15] = Math.random();
}

function pLight(x, y, z, r, c, life, flick) {
  pfx.lights.push({ x, y, z, r, c, t: 0, life, flick: flick || 0 });
}

function rnd(a, b) { return a + Math.random() * (b - a); }

// ---------- Receitas ----------

function fx3Explosion(x, y, z, size, big) {
  const s = size;
  const g = terrainHeightAt(x, y);
  const wet = g < WATER_LEVEL + 0.5;
  if (g < WATER_LEVEL) z = Math.max(z, WATER_LEVEL + 4);
  pEmit(PT_FLASH, x, y, z + 4, 0, 0, 0, 0.08, s * 0.45, 0, 0.5);
  pLight(x, y, z + 14, s * 2 + 18, [3.2, 1.4, 0.4], big ? 0.24 : 0.18);
  // Bola de fogo: cresce rápido e desacelera (o crescimento decai no fx3Update). Na água não há fogo.
  const nf = wet ? 0 : big ? 10 : 6;
  for (let i = 0; i < nf; i++) {
    const a = Math.random() * 6.283, sp = rnd(5, 28) * (big ? 1.4 : 1), up = rnd(8, 50);
    pEmit(PT_FIRE, x + Math.cos(a) * s * 0.25, y + Math.sin(a) * s * 0.25, z + rnd(0, s * 0.4),
      Math.cos(a) * sp, Math.sin(a) * sp, up, big ? rnd(1.3, 1.9) : rnd(0.6, 1.0), rnd(0.95, 1.5) * s, s * 2.8, 1, 2.6, 30);
  }
  // Chamas baixas que ficam queimando no chão depois da bola de fogo
  if (!wet && (big || s >= 12)) for (let i = 0; i < (big ? 9 : 3); i++) {
    const a = Math.random() * 6.283, r = rnd(0.2, 1.1) * s;
    pEmit(PT_FIRE, x + Math.cos(a) * r, y + Math.sin(a) * r, g + 2, 0, 0, rnd(8, 18), rnd(1.4, 2.6), rnd(0.18, 0.32) * s, s * 0.15, 0.65, 2, 10);
  }
  // Cratera queimada (com borda em brasa que esfria) ou mancha de espuma na água
  if (big || s >= 9) {
    if (pfx.scorch.length > 60) pfx.scorch.shift();
    pfx.scorch.push({ x, y, z: wet ? WATER_LEVEL + 0.3 : g + 0.4, r: s * (big ? 2.2 : 1.5), t: 0, life: wet ? 1.6 : 30, water: wet });
  }
  // Explosões secundárias (combustível, munição) logo depois
  if (!wet && (big || s > 12)) {
    const k = big ? 2 + ((Math.random() * 3) | 0) : 1;
    for (let i = 0; i < k; i++) {
      const a = Math.random() * 6.283, r = rnd(0.4, 1.0) * s;
      pfx.later.push({ t: rnd(0.12, 0.55), x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: z + rnd(0, 6), s: s * rnd(0.4, 0.6) });
    }
  }
  // Coluna de fumaça: nasce um pouco depois (o fogo aparece primeiro)
  if (!wet) pfx.later.push({ t: rnd(0.12, 0.2), smoke: true, x, y, z, s, big });
  const nk = big ? 26 : 12;
  for (let i = 0; i < nk; i++) {
    const a = Math.random() * 6.283, sp = rnd(60, 200) * (big ? 1.3 : 1);
    pEmit(PT_SPARK, x, y, z + 3, Math.cos(a) * sp, Math.sin(a) * sp, rnd(40, 180), rnd(0.35, 0.9), rnd(0.9, 1.6), 0, 1, 1.2, -320);
  }
  for (let i = 0; i < (big ? 10 : 4); i++) {
    const a = Math.random() * 6.283, sp = rnd(10, 40);
    pEmit(PT_EMBER, x, y, z + 5, Math.cos(a) * sp, Math.sin(a) * sp, rnd(30, 90), rnd(1.2, 2.4), rnd(1, 1.8), 0, 1, 0.8, -40);
  }
  const nd = wet ? 0 : big ? 10 : (s > 10 ? 3 : 0);
  for (let i = 0; i < nd; i++) {
    const a = Math.random() * 6.283, sp = rnd(30, 110);
    pfx.debris.push({ x, y, z: z + 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, vz: rnd(60, 190), rx: Math.random() * 6, rz: Math.random() * 6,
      sr: rnd(-12, 12), s: rnd(1.4, 3.2) * (big ? 1.3 : 1), life: rnd(2.5, 4), t: 0, k: (Math.random() * 3) | 0, g });
  }
  // Na água: coluna d'água e respingos brancos em vez de poeira
  if (g < WATER_LEVEL + 0.5) {
    for (let i = 0; i < (big ? 16 : 9); i++) {
      const a = Math.random() * 6.283, sp = rnd(2, 12);
      pEmit(PT_STEAM, x + Math.cos(a) * 2, y + Math.sin(a) * 2, WATER_LEVEL + 0.5, Math.cos(a) * sp, Math.sin(a) * sp, rnd(110, 240) * (big ? 1.2 : 1),
        rnd(0.9, 1.5), rnd(3, 6), rnd(6, 14), 0.85, 1.2, -160);
    }
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * 6.283, sp = rnd(30, 90);
      pEmit(PT_SPARK, x, y, WATER_LEVEL + 1, Math.cos(a) * sp, Math.sin(a) * sp, rnd(60, 150), rnd(0.4, 0.8), 0.9, 0, 0.6, 0.5, -300);
    }
  }
  // Na água: anéis de onda brancos que se abrem na superfície
  if (wet) for (let i = 0; i < 3; i++) pfx.waves.push({ x, y, z: WATER_LEVEL + 0.4, r0: s * 0.4, r1: s * (5 - i * 1.2), t: -i * 0.18, life: 1.2, water: true });
  // Anel de poeira no chão (na água não: lá não levanta poeira)
  if (g > WATER_LEVEL + 2 && (big || s >= 12)) pfx.waves.push({ x, y, z: g + 0.8, r0: s * 0.5, r1: s * (big ? 4.2 : 2.8), t: 0, life: big ? 0.6 : 0.4 });
  for (let i = 0; i < (big ? 10 : 4); i++) {
    const a = Math.random() * 6.283, sp = rnd(15, 45);
    pEmit(PT_DUST, x, y, g + 2, Math.cos(a) * sp, Math.sin(a) * sp, rnd(2, 10), rnd(1.2, 2.2), s * 0.6, s * 1.4, 0.55, 1.6, 4);
  }
  if (gameState !== 'title' && fxNearScreen(x, y, 0)) {
    screenShake = Math.min(7, screenShake + (big ? 6 : s > 11 ? 2.5 : 0));
    // Clarão de tela inteira, curto, só nas explosões grandes
    if (big) premiumFlash = Math.min(0.12, premiumFlash + 0.08);
  }
}

function fx3Smoke(x, y, z, s, big) {
  const ns = big ? 18 : 9;
  for (let i = 0; i < ns; i++) {
    const a = Math.random() * 6.283, sp = rnd(5, 26);
    pEmit(big || i % 3 === 0 ? PT_DARK : PT_SMOKE, x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, z + rnd(2, s * 0.6),
      Math.cos(a) * sp, Math.sin(a) * sp - rnd(6, 16), rnd(14, 34), rnd(2.4, 4.2) * (big ? 1.3 : 1), rnd(0.5, 0.85) * s, Math.min(18, s * 1.0), 0.85, 0.9, 30);
  }
}

function fx3Hit(x, y, z, big) {
  if (big) {
    pEmit(PT_FLASH, x, y, z, 0, 0, 0, 0.12, 22, 0, 0.9);
    pLight(x, y, z + 8, 90, [5, 3.2, 1.6], 0.25);
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * 6.283, sp = rnd(8, 30);
      pEmit(PT_DUST, x, y, z, Math.cos(a) * sp, Math.sin(a) * sp, rnd(5, 20), rnd(0.6, 1.2), rnd(4, 7), 10, 0.75, 2, 6);
    }
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * 6.283, sp = rnd(50, 140);
      pEmit(PT_SPARK, x, y, z, Math.cos(a) * sp, Math.sin(a) * sp, rnd(30, 120), rnd(0.2, 0.5), 1.1, 0, 1, 2, -320);
    }
    pEmit(PT_FIRE, x, y, z, 0, 0, 20, 0.25, 9, 6, 1, 2, 0);
  } else {
    pEmit(PT_FLASH, x, y, z, 0, 0, 0, 0.07, 7, 0, 0.8);
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * 6.283, sp = rnd(40, 100);
      pEmit(PT_SPARK, x, y, z, Math.cos(a) * sp, Math.sin(a) * sp, rnd(20, 70), rnd(0.1, 0.25), 0.8, 0, 1, 3, -300);
    }
    pEmit(PT_DUST, x, y, z, rnd(-5, 5), rnd(-5, 5), 6, 0.5, 2.5, 6, 0.4, 2, 2);
  }
}

function fx3Muzzle(x, y, z, angle, heavy) {
  const ca = Math.cos(angle), sa = Math.sin(angle);
  pEmit(PT_FLASH, x + ca * 2, y + sa * 2, z, 0, 0, 0, 0.09, heavy ? 6 : 3, 0, 0.8);
  // Labareda do cano: estrela alongada na direção do tiro (traços esticados pela velocidade)
  const n = heavy ? 5 : 3;
  for (let i = 0; i < n; i++) {
    const da = i === 0 ? 0 : (i % 2 ? 1 : -1) * (heavy ? rnd(0.25, 0.9) : rnd(0.3, 0.7));
    const sp = (i === 0 ? 380 : 200) * (heavy ? 1.3 : 0.9);
    pEmit(PT_SPARK, x + ca * 3, y + sa * 3, z, Math.cos(angle + da) * sp, Math.sin(angle + da) * sp, 0, 0.1, heavy ? 2.6 : 1.6, 0, 1, 0, 0);
  }
  pEmit(PT_FIRE, x + ca * 4, y + sa * 4, z, ca * 60, sa * 60, 0, 0.07, heavy ? 6 : 3, 0, 1, 6, 0);
  pLight(x, y, z + 3, heavy ? 80 : 40, heavy ? [6, 4, 2] : [3, 2.5, 1.2], heavy ? 0.1 : 0.06);
  if (heavy) {
    for (let i = 0; i < 3; i++) pEmit(PT_SMOKE, x, y, z, ca * rnd(15, 30) + rnd(-6, 6), sa * rnd(15, 30) + rnd(-6, 6), rnd(4, 10), rnd(0.8, 1.4), 3.5, 12, 0.5, 2, 6);
  } else {
    pEmit(PT_SMOKE, x, y, z, ca * 14, sa * 14, 5, 0.6, 2, 6, 0.3, 2, 4);
  }
}

// Altura do cano de cada tipo (de onde sai o tiro)
const GUN_Z = { tank: 10.9, scout: 12.7, artillery: 18.4, trooper: 12.5, rocketeer: 16.5, turret: 12 };
const BODY_Z = { tank: 6.9, scout: 5.8, artillery: 6.9, harvester: 8, trooper: 10, rocketeer: 10 };

function entityMidZ(e) {
  if (!e) return 5;
  if (e.kind === 'building') return terrainHeightAt(e.x, e.y) + (BUILDING_HEIGHT[e.type] || 20) * 0.4;
  return terrainHeightAt(e.x, e.y) + (BODY_Z[e.type] || 5);
}

// Altura de um projétil ao longo do caminho (sobe do cano até o alvo; o obus faz um arco)
function projZ(p) {
  const total = dist(p.sx, p.sy, p.tx, p.ty) || 1;
  const k = clamp(1 - dist(p.x, p.y, p.tx, p.ty) / total, 0, 1);
  const owner = p.owner;
  const z0 = (owner ? terrainHeightAt(p.sx, p.sy) : 0) + (owner ? (owner.kind === 'building' ? GUN_Z.turret : GUN_Z[owner.type] || 8) : 8);
  const z1 = p.kind === 'arty' ? terrainHeightAt(p.tx, p.ty) : entityMidZ(p.target);
  let z = z0 + (z1 - z0) * k;
  if (p.kind === 'arty') z += Math.sin(k * Math.PI) * Math.min(110, total * 0.42);
  return z;
}

// ---------- Leitura da simulação ----------

function fx3Harvest(dt) {
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (pfx.seen.has(e)) continue;
    pfx.seen.add(e);
    if (!fxNearScreen(e.x, e.y, 160) || !fxVisible(e.x, e.y)) continue;
    const g = terrainHeightAt(e.x, e.y);
    if (e.kind === 'muzzle') {
      // De quem é o tiro? O projétil criado no mesmo ponto diz.
      const p = projectiles.find(q => q.sx === e.x && q.sy === e.y);
      const o = p && p.owner;
      const z = o ? g + (o.kind === 'building' ? GUN_Z.turret : GUN_Z[o.type] || 8) : g + 8;
      fx3Muzzle(e.x, e.y, z, e.angle, p && p.kind !== 'bullet');
    } else if (e.kind === 'hit' && e.size) {
      fx3Explosion(e.x, e.y, g + 2, e.size * 0.45, false);
    } else if (e.kind === 'hit') {
      fx3Hit(e.x, e.y, g + rnd(4, 9), e.big);
    } else if (e.kind === 'boom') {
      fx3Explosion(e.x, e.y, g + 4, e.size, e.size > 20);
    } else if (e.kind === 'dust') {
      for (let k = 0; k < 22; k++) {
        const a = Math.random() * 6.283, sp = rnd(10, 40);
        pEmit(PT_DUST, e.x + Math.cos(a) * e.size * 0.5, e.y + Math.sin(a) * e.size * 0.5, g + rnd(2, 14),
          Math.cos(a) * sp, Math.sin(a) * sp, rnd(4, 14), rnd(1, 2), rnd(8, 14), 16, 0.75, 1.4, 4);
      }
    }
  }
  // Recuo do cano e rastro dos projéteis
  projectiles.forEach(p => {
    if (!pfx.projSeen.has(p)) {
      pfx.projSeen.add(p);
      if (p.owner) { const s = unitVis(p.owner); s.recoil = 1; }
    }
    if (!fxNearScreen(p.x, p.y, 60) || !fxVisible(p.x, p.y)) return;
    const z = projZ(p);
    const last = pfx.trail.get(p);
    pfx.trail.set(p, { x: p.x, y: p.y, z });
    if (!last) return;
    if (p.kind === 'rocket') {
      pEmit(PT_SMOKE, p.x, p.y, z, rnd(-4, 4), rnd(-4, 4), rnd(2, 6), rnd(0.7, 1.1), 2.2, 9, 0.55, 1.5, 3);
      pEmit(PT_FIRE, (p.x + last.x) / 2, (p.y + last.y) / 2, (z + last.z) / 2, 0, 0, 0, 0.09, 4, 0, 1);
    } else if (p.kind === 'arty') {
      pEmit(PT_SMOKE, p.x, p.y, z, rnd(-3, 3), rnd(-3, 3), 2, 0.8, 1.6, 6, 0.4, 1.5, 2);
      pEmit(PT_EMBER, p.x, p.y, z, rnd(-10, 10), rnd(-10, 10), rnd(-5, 10), 0.3, 1.0, 0, 1, 1, -30);
    }
  });
}

// Estado visual de cada entidade (odômetro, recuo, giro das rodas)
function unitVis(e) {
  let s = pfx.ustate.get(e);
  if (!s) { s = { x: e.x, y: e.y, odo: 0, mark: 0, recoil: 0, drum: 0, seed: Math.random() * 100, hit: 0, hp: e.hp }; pfx.ustate.set(e, s); }
  return s;
}

function fx3Units(dt) {
  units.forEach(u => {
    const s = unitVis(u);
    const d = dist(s.x, s.y, u.x, u.y);
    s.x = u.x; s.y = u.y;
    if (u.hp < s.hp) s.hit = 1;
    s.hp = u.hp;
    s.hit = Math.max(0, s.hit - dt * 6);
    s.recoil = Math.max(0, s.recoil - dt * 4);
    if (d > 40) return;
    s.odo += d;
    if (u.type === 'harvester' && u.hstate === 'harvest') s.drum += dt * 9;
    if (!fxNearScreen(u.x, u.y, 60) || !isVisibleToPlayer(u)) return;
    const def = UNIT_TYPES[u.type];
    if (def.armor !== 'inf' && d > 0) {
      s.mark += d;
      if (s.mark > 4) {
        s.mark = 0;
        if (pfx.tracks.length > 900) pfx.tracks.shift();
        pfx.tracks.push({ x: u.x, y: u.y, a: u.angle, w: u.radius * 0.7, t: 0, wheel: u.type === 'scout' });
        const t = tileAt(gameMap, Math.floor(u.x / TILE), Math.floor(u.y / TILE));
        if (t !== TERRAIN.PLATEAU && Math.random() < (u.type === 'scout' ? 0.7 : 0.35)) {
          const bx = u.x - Math.cos(u.angle) * u.radius, by = u.y - Math.sin(u.angle) * u.radius;
          pEmit(PT_DUST, bx + rnd(-3, 3), by + rnd(-3, 3), terrainHeightAt(bx, by) + 2, rnd(-6, 6), rnd(-6, 6), rnd(4, 10),
            rnd(0.8, 1.5), rnd(3, 5), 10, 0.45, 1.2, 3);
        }
      }
    }
    if (u.type === 'harvester') {
      const g = terrainHeightAt(u.x, u.y);
      if (u.hstate === 'harvest' && Math.random() < dt * 22) {
        const fx = u.x + Math.cos(u.angle) * 17, fy = u.y + Math.sin(u.angle) * 17;
        pEmit(PT_GLINT, fx + rnd(-7, 7), fy + rnd(-7, 7), g + rnd(2, 6), rnd(-20, 20), rnd(-20, 20), rnd(20, 60), rnd(0.3, 0.7), rnd(1.4, 2.6), 0, 1, 2, -120);
        if (Math.random() < 0.4) pEmit(PT_DUST, fx, fy, g + 3, rnd(-8, 8), rnd(-8, 8), rnd(5, 15), rnd(0.6, 1.2), rnd(3, 6), 10, 0.4, 1.5, 4);
      }
      if (u.hstate === 'unload' && Math.random() < dt * 20) {
        const bx = u.x - Math.cos(u.angle) * 8, by = u.y - Math.sin(u.angle) * 8;
        pEmit(PT_GLINT, bx + rnd(-5, 5), by + rnd(-5, 5), g + 13, rnd(-8, 8), rnd(-8, 8), rnd(10, 30), rnd(0.4, 0.8), rnd(1.5, 2.8), 0, 1, 1, -60);
      }
    }
  });
}

function fx3Buildings(dt) {
  buildings.forEach(b => {
    if (b.hp <= 0 || !fxNearScreen(b.x, b.y, 100) || !isExploredByPlayer(b)) return;
    const vis = isVisibleToPlayer(b) || b.team === 0 || gameState === 'title' || !gameOptions.fog;
    if (!vis) return;
    const f = b.hp / b.maxHp;
    const w = b.w * TILE, h = b.h * TILE;
    const g = terrainHeightAt(b.x, b.y);
    const H = BUILDING_HEIGHT[b.type] || 20;
    if (f < 0.5 && Math.random() < dt * (f < 0.25 ? 14 : 7)) {
      pEmit(PT_DARK, b.x + rnd(-w * 0.3, w * 0.3), b.y + rnd(-h * 0.3, h * 0.3), g + H * rnd(0.4, 0.8), rnd(-3, 3) + 6, rnd(-3, 3), rnd(14, 26),
        rnd(2.2, 3.6), rnd(6, 9), f < 0.25 ? 20 : 14, f < 0.25 ? 0.9 : 0.7, 0.3, 2);
    }
    if (f < 0.25 && Math.random() < dt * 22) {
      const fx = b.x + rnd(-w * 0.3, w * 0.3), fy = b.y + rnd(-h * 0.25, h * 0.25);
      pEmit(PT_FIRE, fx, fy, g + H * rnd(0.3, 0.6), rnd(-4, 4), rnd(-4, 4), rnd(14, 34), rnd(0.3, 0.6), rnd(5, 8), -3, 1, 0.5, 20);
      if (Math.random() < 0.3) pEmit(PT_EMBER, fx, fy, g + H * 0.6, rnd(-10, 10), rnd(-10, 10), rnd(20, 50), rnd(1, 2), 1.2, 0, 1, 0.6, -10);
    }
    const rot = doorOnTop(b) ? Math.PI : 0;
    const L = (lx, ly) => [b.x + Math.cos(rot) * lx - Math.sin(rot) * ly, b.y + Math.sin(rot) * lx + Math.cos(rot) * ly];
    const powered = !lowPower(b.team);
    if (b.type === 'power' && powered && Math.random() < dt * 5) {
      const k = Math.random() < 0.5 ? L(-12, -10) : L(12, 10);
      pEmit(PT_STEAM, k[0] + rnd(-4, 4), k[1] + rnd(-4, 4), g + 32, rnd(2, 6), rnd(-2, 2), rnd(12, 22), rnd(2.5, 4), rnd(6, 8), 14, 0.35, 0.3, 3);
    }
    if (b.type === 'factory' && b.queue.length && Math.random() < dt * 6) {
      const k = L(32, -31);
      pEmit(PT_SMOKE, k[0] + rnd(-2, 2), k[1] + rnd(-2, 2), g + 45, rnd(3, 7), rnd(-2, 2), rnd(14, 24), rnd(2, 3), 4, 13, 0.55, 0.3, 3);
    }
    if (b.type === 'refinery' && Math.random() < dt * 1.5) {
      const k = L(-26, -13);
      pEmit(PT_STEAM, k[0], k[1], g + 33, rnd(2, 4), 0, rnd(8, 14), rnd(2, 3), 3, 9, 0.25, 0.3, 2);
    }
  });
}

let premiumFlash = 0; // clarão de tela (somado no pós-processamento)

function fx3Update(dt) {
  if (dt <= 0) { screenShake = 0; return; }
  fx3Harvest(dt);
  if (gameState === 'playing' || gameState === 'title') {
    fx3Units(dt);
    fx3Buildings(dt);
  }
  const d = pfx.d;
  let n = pfx.n;
  for (let i = 0; i < n; i++) {
    const o = i * PFX_STRIDE;
    d[o + 6] += dt;
    if (d[o + 6] >= d[o + 7]) {
      n--;
      if (i < n) { d.copyWithin(o, n * PFX_STRIDE, n * PFX_STRIDE + PFX_STRIDE); i--; }
      continue;
    }
    const k = Math.max(0, 1 - d[o + 12] * dt);
    d[o + 3] *= k; d[o + 4] *= k;
    d[o + 5] = d[o + 5] * k + d[o + 13] * dt;
    d[o + 3] += 6 * dt; // vento leve para leste
    d[o] += d[o + 3] * dt;
    d[o + 1] += d[o + 4] * dt;
    d[o + 2] += d[o + 5] * dt;
    const type = d[o + 10];
    if (type === PT_SPARK || type === PT_EMBER) {
      const g = terrainHeightAt(d[o], d[o + 1]);
      if (d[o + 2] < g) { d[o + 2] = g; d[o + 5] = Math.abs(d[o + 5]) * 0.35; d[o + 3] *= 0.6; d[o + 4] *= 0.6; }
    }
    d[o + 8] = Math.max(0.1, d[o + 8] + d[o + 9] * dt);
    // Fogo cresce rápido e desacelera; fumaça é levada mais pelo vento quanto mais alto está
    if (type === PT_FIRE) d[o + 9] *= Math.max(0, 1 - 3.2 * dt);
    else if (type === PT_SMOKE || type === PT_DARK) d[o] += Math.min(40, d[o + 2]) * 0.25 * dt;
  }
  pfx.n = n;
  for (let i = pfx.later.length - 1; i >= 0; i--) {
    const e = pfx.later[i];
    e.t -= dt;
    if (e.t <= 0) { pfx.later.splice(i, 1); if (e.smoke) fx3Smoke(e.x, e.y, e.z, e.s, e.big); else fx3Explosion(e.x, e.y, e.z, e.s, false); }
  }
  pfx.debris.forEach(c => {
    c.t += dt;
    if (c.z > c.g + 0.3 || c.vz > 0) {
      c.vz -= 380 * dt;
      c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt;
      c.rx += c.sr * dt; c.rz += c.sr * 0.7 * dt;
      if (Math.random() < dt * 25 && c.t < 1) pEmit(PT_SMOKE, c.x, c.y, c.z, 0, 0, 4, 0.6, 1.4, 5, 0.45, 1, 2);
      const g = terrainHeightAt(c.x, c.y);
      c.g = g;
      if (c.z < g) {
        c.z = g;
        if (Math.abs(c.vz) > 50) { c.vz = -c.vz * 0.3; c.vx *= 0.5; c.vy *= 0.5; c.sr *= 0.5; }
        else { c.vz = 0; c.vx = 0; c.vy = 0; c.sr = 0; }
      }
    }
  });
  pfx.debris = pfx.debris.filter(c => c.t < c.life + 6);
  pfx.lights.forEach(l => { l.t += dt; });
  pfx.lights = pfx.lights.filter(l => l.t < l.life);
  pfx.tracks.forEach(m => { m.t += dt; });
  if (pfx.tracks.length && pfx.tracks[0].t > 12) pfx.tracks = pfx.tracks.filter(m => m.t < 12);
  pfx.waves.forEach(w => { w.t += dt; });
  pfx.waves = pfx.waves.filter(w => w.t < w.life);
  pfx.scorch.forEach(c => { c.t += dt; });
  if (pfx.scorch.length && pfx.scorch[0].t > pfx.scorch[0].life) pfx.scorch = pfx.scorch.filter(c => c.t < c.life);
  screenShake = Math.max(0, screenShake - dt * 18);
  premiumFlash = Math.max(0, premiumFlash - dt * 0.5);
}
