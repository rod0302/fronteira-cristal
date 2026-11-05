// Efeitos visuais só de desenho: partículas (fogo, fumaça, faíscas, poeira), marcas de esteira,
// tremor de tela e luzes. Andam no tempo do quadro, não da simulação, e usam Math.random à
// vontade: nada aqui altera a partida (que continua repetível).
// Os efeitos da simulação (tiros, impactos, explosões) são lidos de "effects" e "projectiles"
// e viram partículas na primeira vez que aparecem.

const MAX_PARTICLES = 900;
const MAX_TRACKS = 700;
let particles = [];
let trackMarks = [];
let screenShake = 0;
const fxSeen = new WeakSet();   // efeitos da simulação já transformados em partículas
const projTrail = new WeakMap(); // última posição de cada projétil (para o rastro)
const unitFx = new WeakMap();    // estado visual por unidade (odômetro da esteira, poeira)

function resetFx() {
  particles = [];
  trackMarks = [];
  screenShake = 0;
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

// Partícula: { x, y, vx, vy, life, max, r, grow, g (brilho), add (aditiva), a (alfa), drag, up }
function emit(p) {
  if (gfx.low && !p.add && !p.keep && Math.random() < 0.5) return; // modo leve: metade da fumaça e poeira
  if (particles.length >= MAX_PARTICLES) particles.shift();
  p.t = 0;
  p.vx = p.vx || 0;
  p.vy = p.vy || 0;
  p.grow = p.grow || 0;
  p.a = p.a === undefined ? 1 : p.a;
  p.drag = p.drag || 0;
  particles.push(p);
}

// O ponto está à vista do jogador? (efeitos sob a névoa não aparecem)
function fxVisible(x, y) {
  if (gameState === 'title' || !gameOptions.fog) return true;
  return tileVisible(Math.floor(x / TILE), Math.floor(y / TILE));
}

function fxNearScreen(x, y, m = 120) {
  return x > camera.x - m && x < camera.x + camera.ww + m && y > camera.y - m && y < camera.y + camera.wh + m;
}

// ---------- Receitas de efeitos ----------

function fxExplosion(x, y, size, big) {
  const n = big ? 16 : 9;
  // Clarão: menor e mais fraco quando já há muitos na tela (vários somados viravam um borrão branco)
  const flashes = particles.reduce((k, p) => k + (p.g === 'flash' ? 1 : 0), 0);
  emit({ x, y, life: 0.16, r: Math.min(40, size * 2), g: 'flash', add: true, a: flashes > 3 ? 0.35 : 0.75 });
  emit({ x, y, life: big ? 0.7 : 0.5, r: size * 0.8, grow: size * 3.2, ring: true, a: 0.5 });
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(10, 55) * (big ? 1.4 : 1);
    emit({ x: x + Math.cos(a) * size * 0.3, y: y + Math.sin(a) * size * 0.3, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10,
      life: rand(0.35, 0.8), r: rand(0.5, 0.9) * size, grow: -size * 0.4, g: 'fire', add: true, drag: 2.5 });
  }
  for (let i = 0; i < n * 0.6; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(5, 30);
    emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 12, life: rand(1.2, 2.4) * (big ? 1.3 : 1),
      r: rand(0.5, 0.9) * size, grow: Math.min(22, size * 1.2), g: big ? 'dark' : 'smoke', a: 0.85, drag: 1.2, up: 8 });
  }
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = rand(60, 190) * (big ? 1.3 : 1);
    emit({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.25, 0.6), r: rand(1.2, 2.4), g: 'yellow', add: true, drag: 3.5, spark: true });
  }
  if (gameState !== 'title' && fxNearScreen(x, y, 0)) screenShake = Math.min(7, screenShake + (big ? 6 : size > 11 ? 2.5 : 0));
}

function fxHit(e) {
  if (e.big) {
    emit({ x: e.x, y: e.y, life: 0.14, r: 14, g: 'flash', add: true, a: 0.8 });
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(8, 30);
      emit({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 6, life: rand(0.5, 1.0), r: rand(3, 6), grow: 8, g: 'dust', a: 0.8, drag: 2 });
    }
    for (let i = 0; i < 5; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(50, 120);
      emit({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.15, 0.35), r: 1.4, g: 'yellow', add: true, drag: 4, spark: true });
    }
  } else {
    emit({ x: e.x, y: e.y, life: 0.08, r: 5, g: 'yellow', add: true, a: 0.9 });
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2, s = rand(40, 90);
      emit({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rand(0.1, 0.25), r: 1, g: 'yellow', add: true, drag: 5, spark: true });
    }
  }
}

function fxMuzzle(e) {
  const ca = Math.cos(e.angle), sa = Math.sin(e.angle);
  emit({ x: e.x + ca * 3, y: e.y + sa * 3, life: 0.07, r: 7, g: 'flash', add: true });
  emit({ x: e.x + ca * 7, y: e.y + sa * 7, life: 0.06, r: 4.5, g: 'yellow', add: true });
  emit({ x: e.x, y: e.y, vx: ca * 18, vy: sa * 18 - 6, life: 0.7, r: 3, grow: 9, g: 'smoke', a: 0.45, drag: 2 });
}

// Lê os efeitos novos da simulação e cria as partículas
function harvestSimEffects() {
  for (let i = 0; i < effects.length; i++) {
    const e = effects[i];
    if (fxSeen.has(e)) continue;
    fxSeen.add(e);
    if (!fxNearScreen(e.x, e.y) || !fxVisible(e.x, e.y)) continue;
    if (e.kind === 'muzzle') fxMuzzle(e);
    else if (e.kind === 'hit' && e.size) fxExplosion(e.x, e.y, e.size * 0.45, false);
    else if (e.kind === 'hit') fxHit(e);
    else if (e.kind === 'boom') fxExplosion(e.x, e.y, e.size, e.size > 20);
    else if (e.kind === 'dust') {
      for (let k = 0; k < 18; k++) {
        const a = Math.random() * Math.PI * 2, s = rand(10, 40);
        emit({ x: e.x + Math.cos(a) * e.size * 0.5, y: e.y + Math.sin(a) * e.size * 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          life: rand(0.8, 1.6), r: rand(6, 12), grow: 14, g: 'dust', a: 0.8, drag: 1.5 });
      }
    }
  }
}

// Rastros de foguete e de obus
function projectileTrails(dt) {
  projectiles.forEach(p => {
    const last = projTrail.get(p);
    projTrail.set(p, { x: p.x, y: p.y });
    if (!last || !fxNearScreen(p.x, p.y) || !fxVisible(p.x, p.y)) return;
    if (p.kind === 'rocket') {
      emit({ x: p.x, y: p.y, life: 0.6, r: 2.5, grow: 9, g: 'smoke', a: 0.55, up: 4 });
      emit({ x: (p.x + last.x) / 2, y: (p.y + last.y) / 2, life: 0.08, r: 4, g: 'fire', add: true });
    } else if (p.kind === 'arty' && Math.random() < 0.5) {
      const lift = artyLift(p);
      emit({ x: p.x, y: p.y - lift, life: 0.45, r: 1.5, grow: 5, g: 'smoke', a: 0.35 });
    }
  });
}

function artyLift(p) {
  const total = dist(p.sx, p.sy, p.tx, p.ty) || 1;
  const k = 1 - dist(p.x, p.y, p.tx, p.ty) / total;
  return Math.sin(k * Math.PI) * Math.min(60, total * 0.25);
}

// Esteiras, poeira e faíscas de cristal das unidades à vista
function unitTrails(dt) {
  units.forEach(u => {
    if (!fxNearScreen(u.x, u.y, 40)) return;
    let s = unitFx.get(u);
    if (!s) { s = { x: u.x, y: u.y, odo: 0, mark: 0 }; unitFx.set(u, s); }
    const d = dist(s.x, s.y, u.x, u.y);
    s.x = u.x; s.y = u.y;
    if (d > 40) return; // teleporte (unidade nova): ignora
    s.odo += d;
    const def = UNIT_TYPES[u.type];
    const vehicle = def.armor !== 'inf';
    if (!isVisibleToPlayer(u)) return;
    if (vehicle && d > 0) {
      s.mark += d;
      if (s.mark > 5) {
        s.mark = 0;
        if (trackMarks.length >= MAX_TRACKS) trackMarks.shift();
        trackMarks.push({ x: u.x, y: u.y, a: u.angle, w: u.radius * 0.75, t: 0, wheel: u.type === 'scout' });
        const t = tileAt(gameMap, Math.floor(u.x / TILE), Math.floor(u.y / TILE));
        if (t !== TERRAIN.PLATEAU && Math.random() < (u.type === 'scout' ? 0.6 : 0.25)) {
          emit({ x: u.x - Math.cos(u.angle) * u.radius, y: u.y - Math.sin(u.angle) * u.radius, vx: rand(-6, 6), vy: rand(-6, 6),
            life: rand(0.6, 1.1), r: rand(3, 5), grow: 8, g: 'dust', a: 0.4, drag: 1 });
        }
      }
    }
    if (u.type === 'harvester' && u.hstate === 'unload' && Math.random() < dt * 18) {
      // Cristal escorrendo da caçamba para a refinaria
      const bx = u.x - Math.cos(u.angle) * 6, by = u.y - Math.sin(u.angle) * 6;
      emit({ x: bx + rand(-5, 5), y: by + rand(-5, 5), vx: rand(-8, 8), vy: rand(-8, 8) + (u.y > by ? 0 : 0), life: rand(0.4, 0.8), r: rand(2, 3.5), g: 'teal', add: true, drag: 1, up: -10 });
    }
    if (u.type === 'harvester' && u.hstate === 'harvest' && Math.random() < dt * 14) {
      const fx = u.x + Math.cos(u.angle) * 16, fy = u.y + Math.sin(u.angle) * 16;
      emit({ x: fx + rand(-6, 6), y: fy + rand(-6, 6), vx: rand(-20, 20), vy: rand(-30, -5), life: rand(0.3, 0.7), r: rand(1.5, 3), g: 'teal', add: true, drag: 2 });
    }
  });
}

// Fumaça e fogo dos prédios danificados; vapor das usinas; fumaça da fábrica produzindo
function buildingEmitters(dt) {
  buildings.forEach(b => {
    if (b.hp <= 0 || !fxNearScreen(b.x, b.y, 60) || !isExploredByPlayer(b)) return;
    const vis = isVisibleToPlayer(b) || b.team === 0 || gameState === 'title' || !gameOptions.fog;
    const f = b.hp / b.maxHp;
    const w = b.w * TILE;
    // Fumaça escura (contrasta com o planalto cinza), mais grossa quanto pior o dano
    if (vis && f < 0.5 && Math.random() < dt * (f < 0.25 ? 16 : 9)) {
      emit({ x: b.x + rand(-w * 0.3, w * 0.3), y: b.y + rand(-w * 0.2, w * 0.2), vx: rand(-4, 4) + 7, vy: -rand(16, 28),
        life: rand(1.8, 3), r: rand(5, 8), grow: f < 0.25 ? 22 : 16, g: 'dark', a: f < 0.25 ? 0.95 : 0.8, drag: 0.3, keep: true });
    }
    if (vis && f < 0.25 && Math.random() < dt * 18) {
      emit({ x: b.x + rand(-w * 0.25, w * 0.25), y: b.y + rand(-w * 0.2, w * 0.2), vx: rand(-5, 5), vy: -rand(10, 30),
        life: rand(0.3, 0.6), r: rand(4, 7), grow: -4, g: 'fire', add: true });
    }
    if (!vis) return;
    const powered = !lowPower(b.team);
    if (b.type === 'power' && powered && Math.random() < dt * 3) {
      const k = Math.random() < 0.5;
      emit({ x: b.tx * TILE + w * (k ? 0.3 : 0.7), y: b.ty * TILE + b.h * TILE * (k ? 0.36 : 0.64), vx: 5, vy: -12,
        life: 2.2, r: 4, grow: 16, g: 'smoke', a: 0.22, drag: 0.2 });
    }
    if (b.type === 'factory' && b.queue.length && Math.random() < dt * 4) {
      const top = exitSide(b) === 'top';
      emit({ x: b.tx * TILE + w - 14, y: b.ty * TILE + (top ? 12 : 5) + 8, vx: 5, vy: -14, life: 2, r: 3, grow: 14, g: 'smoke', a: 0.45, drag: 0.2 });
    }
  });
}

function updateFx(dt) {
  if (dt <= 0) { screenShake = 0; return; } // pausado: a tela para de tremer
  harvestSimEffects();
  projectileTrails(dt);
  if (gameState === 'playing' || gameState === 'title') {
    unitTrails(dt);
    buildingEmitters(dt);
  }
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.t += dt;
    const k = Math.max(0, 1 - p.drag * dt);
    p.vx *= k;
    p.vy *= k;
    if (p.up) p.vy -= p.up * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.r = Math.max(0.1, p.r + p.grow * dt);
  }
  particles = particles.filter(p => p.t < p.life);
  trackMarks.forEach(m => { m.t += dt; });
  if (trackMarks.length && trackMarks[0].t > TRACK_LIFE) trackMarks = trackMarks.filter(m => m.t < TRACK_LIFE);
  screenShake = Math.max(0, screenShake - dt * 18);
}

const TRACK_LIFE = 9;

function drawTrackMarks(ctx) {
  ctx.fillStyle = 'rgb(28,24,18)';
  trackMarks.forEach(m => {
    if (!fxNearScreen(m.x, m.y, 20)) return;
    ctx.globalAlpha = 0.22 * (1 - m.t / TRACK_LIFE);
    const c = Math.cos(m.a), s = Math.sin(m.a);
    const ox = -s * m.w, oy = c * m.w;
    const sz = m.wheel ? 1.6 : 2.6;
    ctx.fillRect(m.x + ox - sz / 2, m.y + oy - sz / 2, sz, sz);
    ctx.fillRect(m.x - ox - sz / 2, m.y - oy - sz / 2, sz, sz);
  });
  ctx.globalAlpha = 1;
}

// Partículas: primeiro as normais (fumaça, poeira), depois as aditivas (fogo, luz)
function drawParticles(ctx) {
  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1) ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!!p.add !== (pass === 1)) continue;
      const k = p.t / p.life;
      if (p.ring) {
        ctx.strokeStyle = `rgba(255,230,190,${p.a * (1 - k)})`;
        ctx.lineWidth = 2.5 * (1 - k) + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.stroke();
        continue;
      }
      // Fumaça aparece suave e some devagar; fogo some rápido
      const a = p.add ? p.a * (1 - k) : p.a * Math.min(1, k * 6) * (1 - k);
      if (a <= 0.01) continue;
      const s = glow(p.g);
      ctx.globalAlpha = a;
      if (p.spark) {
        // Faísca: risco na direção do movimento
        ctx.strokeStyle = 'rgba(255,220,140,1)';
        ctx.lineWidth = p.r;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else {
        ctx.drawImage(s.canvas, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.globalCompositeOperation = 'source-over';
}
