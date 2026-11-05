// Arte das unidades e dos prédios, desenhada por código e guardada em cache como imagens.
// Cada sprite é pintado uma vez (em resolução dobrada, nítido em telas retina) e depois só
// copiado e girado a cada quadro, o que é bem mais rápido do que redesenhar os vetores.
// A luz vem do noroeste: brilho em cima à esquerda, sombra projetada para baixo à direita.

const SPR_SCALE = 2;
const spriteCache = new Map();
const canFilter = (() => {
  const g = document.createElement('canvas').getContext('2d');
  return typeof g.filter === 'string';
})();

// Cria (ou pega do cache) um sprite. "draw" desenha em px lógicos com a origem em (ox, oy).
function sprite(key, w, h, ox, oy, draw, outline) {
  let s = spriteCache.get(key);
  if (s) return s;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * SPR_SCALE);
  c.height = Math.ceil(h * SPR_SCALE);
  const g = c.getContext('2d');
  g.scale(SPR_SCALE, SPR_SCALE);
  g.translate(ox, oy);
  draw(g);
  if (outline) addOutline(c, outline);
  s = { canvas: c, w, h, ox, oy };
  spriteCache.set(key, s);
  return s;
}

// Contorno escuro de ~1 px em volta do desenho: destaca a unidade sobre qualquer chão
function addOutline(c, color) {
  const tmp = document.createElement('canvas');
  tmp.width = c.width;
  tmp.height = c.height;
  const t = tmp.getContext('2d');
  t.drawImage(c, 0, 0);
  t.globalCompositeOperation = 'source-in';
  t.fillStyle = color;
  t.fillRect(0, 0, c.width, c.height);
  const orig = document.createElement('canvas');
  orig.width = c.width;
  orig.height = c.height;
  orig.getContext('2d').drawImage(c, 0, 0);
  const g = c.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, c.width, c.height);
  const d = SPR_SCALE * 0.9;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4;
    g.drawImage(tmp, Math.round(Math.cos(a) * d), Math.round(Math.sin(a) * d));
  }
  g.drawImage(orig, 0, 0);
}

// Sombra macia a partir do contorno de outro sprite
function shadowOf(key, src, blur = 2.5) {
  let s = spriteCache.get(key);
  if (s) return s;
  const pad = 6;
  const c = document.createElement('canvas');
  c.width = src.canvas.width + pad * 2 * SPR_SCALE;
  c.height = src.canvas.height + pad * 2 * SPR_SCALE;
  const g = c.getContext('2d');
  if (canFilter) g.filter = 'blur(' + blur * SPR_SCALE + 'px)';
  g.drawImage(src.canvas, pad * SPR_SCALE, pad * SPR_SCALE);
  g.filter = 'none';
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = 'rgba(0,0,0,0.42)';
  g.fillRect(0, 0, c.width, c.height);
  s = { canvas: c, w: src.w + pad * 2, h: src.h + pad * 2, ox: src.ox + pad, oy: src.oy + pad };
  spriteCache.set(key, s);
  return s;
}

// Sombra já girada (16 direções): desenhar fica barato, sem transformação a cada quadro
const SHADOW_DIRS = 16;
function rotatedShadow(key, src, angle, blur) {
  const b = ((Math.round(angle / (Math.PI * 2) * SHADOW_DIRS) % SHADOW_DIRS) + SHADOW_DIRS) % SHADOW_DIRS;
  const k = key + ':' + b;
  let s = spriteCache.get(k);
  if (s) return s;
  const half = Math.ceil(Math.hypot(src.w, src.h) / 2) + 6;
  const c = document.createElement('canvas');
  c.width = c.height = half * 2 * SPR_SCALE;
  const g = c.getContext('2d');
  if (canFilter) g.filter = 'blur(' + blur * SPR_SCALE + 'px)';
  g.translate(half * SPR_SCALE, half * SPR_SCALE);
  g.rotate(b / SHADOW_DIRS * Math.PI * 2);
  g.drawImage(src.canvas, -src.ox * SPR_SCALE, -src.oy * SPR_SCALE);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = 'none';
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = 'rgba(0,0,0,0.42)';
  g.fillRect(0, 0, c.width, c.height);
  s = { canvas: c, w: half * 2, h: half * 2, ox: half, oy: half };
  spriteCache.set(k, s);
  return s;
}

// Desenha o sprite com a origem no ponto atual do contexto (já transladado/girado)
function blit(ctx, s) {
  ctx.drawImage(s.canvas, -s.ox, -s.oy, s.w, s.h);
}

// Desenha em (x, y) girado de "a" sem save/restore
function blitAt(ctx, s, x, y, a) {
  const c = Math.cos(a), n = Math.sin(a);
  const m = ctx.getTransform();
  ctx.transform(c, n, -n, c, x, y);
  ctx.drawImage(s.canvas, -s.ox, -s.oy, s.w, s.h);
  ctx.setTransform(m);
}

// ---------- Cores ----------

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Clareia (k > 0) ou escurece (k < 0) uma cor
function tint(hex, k) {
  const c = hexRgb(hex);
  const f = v => Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  return `rgb(${f(c[0])},${f(c[1])},${f(c[2])})`;
}

function rgba(hex, a) {
  const c = hexRgb(hex);
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}

function linGrad(g, x0, y0, x1, y1, stops) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

function radGrad(g, x, y, r0, r1, stops, fx, fy) {
  const gr = g.createRadialGradient(fx === undefined ? x : fx, fy === undefined ? y : fy, r0, x, y, r1);
  stops.forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
  g.closePath();
}

// Chapa pintada com a cor do time: degradê, contorno escuro e filete de luz em cima
function teamPlate(g, c, x, y, w, h, r) {
  rrect(g, x, y, w, h, r);
  g.fillStyle = linGrad(g, x, y, x, y + h, [[0, tint(c.color, 0.28)], [0.5, c.color], [1, tint(c.color, -0.35)]]);
  g.fill();
  g.lineWidth = 0.8;
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.beginPath();
  g.moveTo(x + r, y + 0.7);
  g.lineTo(x + w - r, y + 0.7);
  g.stroke();
}

function metalPlate(g, x, y, w, h, r, base = '#7d838b') {
  rrect(g, x, y, w, h, r);
  g.fillStyle = linGrad(g, x, y, x + w * 0.3, y + h, [[0, tint(base, 0.25)], [1, tint(base, -0.35)]]);
  g.fill();
  g.lineWidth = 0.8;
  g.strokeStyle = 'rgba(0,0,0,0.55)';
  g.stroke();
}

// Esteira de veículo (vista de cima), com gomos; "phase" desloca os gomos (animação)
function track(g, x, y, w, h, phase) {
  rrect(g, x, y, w, h, h / 2.5);
  g.fillStyle = '#1d1f22';
  g.fill();
  g.save();
  rrect(g, x, y, w, h, h / 2.5);
  g.clip();
  g.fillStyle = '#3a3d42';
  const step = 3;
  for (let i = -step; i < w + step; i += step) g.fillRect(x + i + (phase % 1) * step, y + 0.6, 1.3, h - 1.2);
  g.fillStyle = 'rgba(255,255,255,0.08)';
  g.fillRect(x, y, w, h * 0.35);
  g.restore();
}

// ---------- Unidades (olhando para +x) ----------

const TRACK_FRAMES = 3;
const WALK_FRAMES = 4;

function tankBody(g, c, phase) {
  track(g, -14, -12, 28, 7, phase);
  track(g, -14, 5, 28, 7, phase);
  // Casco
  teamPlate(g, c, -13, -7.5, 26, 15, 3);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.fillRect(-12, -6.5, 5, 13); // grade do motor (traseira)
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 0.6;
  for (let i = 0; i < 4; i++) {
    g.beginPath();
    g.moveTo(-11.5 + i * 1.2, -5.5);
    g.lineTo(-11.5 + i * 1.2, 5.5);
    g.stroke();
  }
  // Placa frontal inclinada
  g.fillStyle = 'rgba(255,255,255,0.15)';
  poly(g, [9, -7, 13, -5, 13, 5, 9, 7]);
  g.fill();
}

function tankTurret(g, c) {
  // Cano com freio de boca
  g.fillStyle = linGrad(g, 0, -2, 0, 2, [[0, '#6a6f76'], [0.5, '#3b3f45'], [1, '#202327']]);
  g.fillRect(3, -1.6, 15, 3.2);
  g.fillStyle = '#2a2d31';
  g.fillRect(16.5, -2.4, 3, 4.8);
  // Torre
  g.beginPath();
  g.moveTo(-7, -6); g.lineTo(3, -6.5); g.lineTo(7, -3); g.lineTo(7, 3); g.lineTo(3, 6.5); g.lineTo(-7, 6); g.lineTo(-8.5, 0);
  g.closePath();
  g.fillStyle = radGrad(g, -1, -2, 1, 10, [[0, tint(c.color, 0.35)], [0.6, c.color], [1, tint(c.color, -0.45)]]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.65)';
  g.lineWidth = 0.9;
  g.stroke();
  // Escotilha
  g.fillStyle = tint(c.color, -0.5);
  g.beginPath(); g.arc(-2.5, 1.8, 2.2, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.3)';
  g.beginPath(); g.arc(-3, 1.3, 0.9, 0, Math.PI * 2); g.fill();
  g.fillStyle = c.light;
  g.fillRect(-6, -4.5, 3, 1.2);
}

function scoutBody(g, c) {
  // Rodas
  [[-7, -9], [5, -9], [-7, 6], [5, 6]].forEach(([x, y]) => {
    rrect(g, x, y, 6, 3.4, 1.4);
    g.fillStyle = '#1b1c1e';
    g.fill();
    g.fillStyle = '#4a4d52';
    g.fillRect(x + 1.5, y + 0.8, 3, 0.9);
  });
  // Chassi em cunha
  g.beginPath();
  g.moveTo(12, 0); g.lineTo(6, -6.5); g.lineTo(-9, -6); g.lineTo(-10, 0); g.lineTo(-9, 6); g.lineTo(6, 6.5);
  g.closePath();
  g.fillStyle = linGrad(g, 0, -6, 0, 6, [[0, tint(c.color, 0.3)], [0.5, c.color], [1, tint(c.color, -0.4)]]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.lineWidth = 0.8;
  g.stroke();
  // Para-brisa
  g.beginPath();
  g.moveTo(5.5, -4); g.lineTo(8.5, 0); g.lineTo(5.5, 4); g.lineTo(2, 3.5); g.lineTo(2, -3.5);
  g.closePath();
  g.fillStyle = linGrad(g, 2, -4, 8, 4, [[0, '#9fd8ff'], [0.4, '#2c4a63'], [1, '#101a24']]);
  g.fill();
  // Santo-antônio e metralhadora
  g.strokeStyle = '#2b2d31';
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(-1, -5); g.lineTo(-1, 5); g.stroke();
  g.fillStyle = '#26282c';
  g.fillRect(-4, -0.9, 9, 1.8);
  g.fillStyle = c.light;
  g.fillRect(-8, -1, 3, 2);
}

function trooperBody(g, c, frame, rocket) {
  const swing = Math.sin(frame / WALK_FRAMES * Math.PI * 2) * 2.2;
  // Pés (passos)
  g.fillStyle = '#26221e';
  rrect(g, -1.5 + swing, -3.6, 3.2, 1.8, 0.8); g.fill();
  rrect(g, -1.5 - swing, 1.8, 3.2, 1.8, 0.8); g.fill();
  // Mochila
  rrect(g, -5, -2.6, 2.8, 5.2, 1);
  g.fillStyle = tint(c.color, -0.55);
  g.fill();
  // Ombros
  g.beginPath();
  g.ellipse(0, 0, 3.3, 4.8, 0, 0, Math.PI * 2);
  g.fillStyle = radGrad(g, -0.8, -1.5, 0.5, 5, [[0, tint(c.color, 0.3)], [1, tint(c.color, -0.35)]]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.6)';
  g.lineWidth = 0.6;
  g.stroke();
  if (rocket) {
    // Lança-foguetes grosso no ombro, com ogiva laranja, e mochila de foguetes
    g.fillStyle = '#e08a3a';
    poly(g, [-6.5, 3.2, -4.5, 2.4, -4.5, 4.4]);
    g.fill();
    poly(g, [-6.5, -0.4, -4.5, -1.2, -4.5, 0.8]);
    g.fill();
    g.fillStyle = linGrad(g, 0, -6, 0, -2, [[0, '#9aa88a'], [1, '#3c463c']]);
    rrect(g, -6, -6, 15, 3.8, 1.2);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)';
    g.lineWidth = 0.6;
    g.stroke();
    g.fillStyle = '#ff9a3a';
    poly(g, [9, -6, 11.5, -4.1, 9, -2.2]);
    g.fill();
  } else {
    // Fuzil
    g.fillStyle = '#1e2022';
    g.fillRect(1, 0.9, 8.5, 1.4);
  }
  // Capacete
  g.beginPath();
  g.arc(0.6, 0, 2.6, 0, Math.PI * 2);
  // Capacete na cor do time (clara), para o time se ler mesmo de longe
  g.fillStyle = radGrad(g, 0, -0.8, 0.2, 2.8, [[0, tint(c.color, 0.55)], [1, tint(c.color, -0.1)]]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.stroke();
}

function artilleryBody(g, c, phase) {
  track(g, -13, -11, 24, 6, phase);
  track(g, -13, 5, 24, 6, phase);
  teamPlate(g, c, -12, -6.5, 22, 13, 2.5);
  // Pás de apoio na traseira
  g.fillStyle = '#3a3c40';
  g.fillRect(-15, -5, 3, 2);
  g.fillRect(-15, 3, 3, 2);
  // Plataforma e cano longo
  g.beginPath(); g.arc(-2, 0, 5.5, 0, Math.PI * 2);
  g.fillStyle = radGrad(g, -3, -2, 1, 6, [[0, '#8a8f96'], [1, '#383b40']]);
  g.fill();
  g.fillStyle = linGrad(g, 0, -2.4, 0, 2.4, [[0, '#70757c'], [0.5, '#3e4247'], [1, '#1f2226']]);
  g.fillRect(0, -2.2, 21, 4.4);
  g.fillStyle = '#26292d';
  g.fillRect(19, -3, 3.5, 6);
  g.fillRect(6, -2.8, 2, 5.6);
  g.fillStyle = c.light;
  g.fillRect(-10, -1.2, 3, 2.4);
}

function harvesterBody(g, c, phase) {
  track(g, -15, -13, 28, 7, phase);
  track(g, -15, 6, 28, 7, phase);
  // Chassi
  metalPlate(g, -14, -8, 27, 16, 2, '#6d7178');
  // Caçamba (o cristal é desenhado por cima, ao vivo)
  rrect(g, -13, -7, 15, 14, 1.5);
  g.fillStyle = linGrad(g, -13, -7, -13, 7, [[0, '#2b2e33'], [1, '#17191c']]);
  g.fill();
  g.strokeStyle = '#8b9097';
  g.lineWidth = 1;
  g.stroke();
  // Cabine
  teamPlate(g, c, 2, -8.5, 10, 17, 2);
  g.fillStyle = linGrad(g, 8, -5, 11, 5, [[0, '#a6dcff'], [0.5, '#2b4a62'], [1, '#0e1822']]);
  rrect(g, 7.5, -5.5, 3.6, 11, 1);
  g.fill();
  // Suporte da colhedeira
  g.fillStyle = '#4b4f55';
  g.fillRect(12, -10.5, 2, 21);
  // Faixas de alerta
  g.fillStyle = '#e0c030';
  for (let i = 0; i < 3; i++) g.fillRect(3, -7.5 + i * 6, 1.6, 3);
}

// Chave do sprite de uma unidade
function unitSprite(type, c, frame) {
  const key = 'u:' + type + ':' + c.id + ':' + frame;
  const sizes = { tank: 44, scout: 30, trooper: 36, rocketeer: 40, artillery: 44, harvester: 40 };
  const s = sizes[type] || 40;
  return sprite(key, s, s, s / 2, s / 2, g => {
    if (type === 'tank') tankBody(g, c, frame / TRACK_FRAMES);
    else if (type === 'scout') scoutBody(g, c);
    else if (type === 'trooper') { g.scale(1.6, 1.6); trooperBody(g, c, frame, false); }
    else if (type === 'rocketeer') { g.scale(1.6, 1.6); trooperBody(g, c, frame, true); }
    else if (type === 'artillery') artilleryBody(g, c, frame / TRACK_FRAMES);
    else if (type === 'harvester') harvesterBody(g, c, frame / TRACK_FRAMES);
  }, 'rgba(8,10,12,0.75)');
}

function turretSprite(c) {
  return sprite('t:' + c.id, 44, 30, 15, 15, g => tankTurret(g, c));
}

// Cutucada da colhedeira (gira quando trabalha) e cristal na caçamba: desenhados ao vivo
function drawHarvesterLive(ctx, cargoFrac, working, t) {
  if (cargoFrac > 0) {
    const w = 13 * Math.min(1, cargoFrac);
    ctx.fillStyle = '#2fb3a5';
    ctx.fillRect(-12, -6, w, 12);
    ctx.fillStyle = 'rgba(190,255,248,0.6)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-11.5 + (i * 3.3) % w, -4.5 + (i % 2) * 6, 1.6, 1.6);
  }
  // Tambor cortador
  ctx.fillStyle = '#8c9198';
  ctx.fillRect(13.5, -10, 3.5, 20);
  ctx.fillStyle = '#2a2d31';
  const k = working ? (t * 24) % 4 : 0;
  for (let i = -10; i < 10; i += 4) ctx.fillRect(13.5, i + k, 3.5, 1.2);
}

// ---------- Prédios ----------

const BMARGIN = 4;   // margem do sprite (à esquerda e em cima)
const BSHADOW = 14;  // margem para a sombra (à direita e embaixo)

// Base de concreto com borda chanfrada e marcas de canto
function foundation(g, w, h) {
  rrect(g, 1, 1, w - 2, h - 2, 3);
  g.fillStyle = linGrad(g, 0, 0, w, h, [[0, '#8d9096'], [1, '#5d6066']]);
  g.fill();
  rrect(g, 3, 3, w - 6, h - 6, 2);
  g.fillStyle = linGrad(g, 0, 0, 0, h, [[0, '#7a7d83'], [1, '#686b71']]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 1;
  rrect(g, 1, 1, w - 2, h - 2, 3);
  g.stroke();
  // Juntas das placas
  g.strokeStyle = 'rgba(0,0,0,0.12)';
  for (let x = TILE; x < w; x += TILE) { g.beginPath(); g.moveTo(x, 3); g.lineTo(x, h - 3); g.stroke(); }
  for (let y = TILE; y < h; y += TILE) { g.beginPath(); g.moveTo(3, y); g.lineTo(w - 3, y); g.stroke(); }
}

// Bloco com "altura": teto em degradê e parede sul mais escura
function block(g, x, y, w, h, wall, roof) {
  g.fillStyle = tint(roof, -0.5);
  g.fillRect(x, y + h - wall, w, wall);
  rrect(g, x, y, w, h - wall, 2);
  g.fillStyle = linGrad(g, x, y, x + w * 0.4, y + h, [[0, tint(roof, 0.22)], [1, tint(roof, -0.18)]]);
  g.fill();
  g.strokeStyle = 'rgba(0,0,0,0.5)';
  g.lineWidth = 1;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.strokeStyle = 'rgba(255,255,255,0.25)';
  g.beginPath(); g.moveTo(x + 1, y + h - wall - 1); g.lineTo(x + 1, y + 1); g.lineTo(x + w - 1, y + 1); g.stroke();
}

function stripe(g, c, x, y, w, h) {
  g.fillStyle = linGrad(g, x, y, x, y + h, [[0, tint(c.color, 0.25)], [1, tint(c.color, -0.3)]]);
  g.fillRect(x, y, w, h);
}

function hazard(g, x, y, w, h) {
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  g.fillStyle = '#d9b62c';
  g.fillRect(x, y, w, h);
  g.fillStyle = '#1e1e1e';
  for (let i = -h; i < w + h; i += 6) {
    g.beginPath();
    g.moveTo(x + i, y + h); g.lineTo(x + i + 3, y + h); g.lineTo(x + i + 3 + h, y); g.lineTo(x + i + h, y);
    g.closePath(); g.fill();
  }
  g.restore();
}

function vent(g, x, y, w, h) {
  g.fillStyle = '#2b2e33';
  g.fillRect(x, y, w, h);
  g.fillStyle = '#596068';
  for (let i = 1; i < h; i += 2) g.fillRect(x + 1, y + i, w - 2, 0.8);
}

function windowRow(g, x, y, n, gap) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = linGrad(g, 0, y, 0, y + 3, [[0, '#a8d8ff'], [1, '#2a4560']]);
    g.fillRect(x + i * gap, y, gap - 2, 3);
  }
}

const BUILDING_ART = {
  hq(g, c, w, h) {
    block(g, 8, 10, w - 16, h - 18, 6, '#8e939b');
    stripe(g, c, 8, 10, w - 16, 7);
    // Domo de comando
    g.beginPath(); g.arc(w / 2, h / 2 + 3, 15, 0, Math.PI * 2);
    g.fillStyle = '#4d5157'; g.fill();
    g.beginPath(); g.arc(w / 2, h / 2 + 3, 12, 0, Math.PI * 2);
    g.fillStyle = radGrad(g, w / 2, h / 2 + 3, 1, 12, [[0, '#cbe9ff'], [0.35, '#4c86b8'], [1, '#13253a']], w / 2 - 4, h / 2 - 1);
    g.fill();
    g.strokeStyle = rgba(c.color, 0.9); g.lineWidth = 2;
    g.beginPath(); g.arc(w / 2, h / 2 + 3, 13.5, 0, Math.PI * 2); g.stroke();
    windowRow(g, 14, h - 18, 4, 6);
    windowRow(g, w - 38, h - 18, 4, 6);
    vent(g, 12, 21, 10, 10);
    vent(g, w - 22, 21, 10, 10);
    // Mastro da antena
    g.strokeStyle = '#c8ccd2'; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(w - 15, 14); g.lineTo(w - 9, 1); g.stroke();
    g.beginPath(); g.moveTo(w - 13, 9); g.lineTo(w - 7, 7); g.stroke();
  },
  power(g, c, w, h) {
    // Duas torres de resfriamento e tubulação
    g.strokeStyle = '#5a5e64'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(w * 0.3, h * 0.36); g.lineTo(w * 0.7, h * 0.64); g.stroke();
    [[w * 0.3, h * 0.36], [w * 0.7, h * 0.64]].forEach(([x, y]) => {
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath(); g.arc(x + 2, y + 3, w * 0.22, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(x, y, w * 0.22, 0, Math.PI * 2);
      g.fillStyle = radGrad(g, x, y, 2, w * 0.22, [[0, '#9ea3aa'], [0.8, '#7c8188'], [1, '#4e5258']], x - 4, y - 4);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.stroke();
      g.beginPath(); g.arc(x, y, w * 0.13, 0, Math.PI * 2);
      g.fillStyle = '#1d1f22'; g.fill();
    });
    stripe(g, c, 5, h - 9, w - 10, 4);
  },
  refinery(g, c, w, h, dockTop) {
    const dockY = dockTop ? 3 : h - 10;
    const bodyY = dockTop ? 12 : 5;
    block(g, 5, bodyY, w * 0.56, h - 17, 5, '#8a8f97');
    stripe(g, c, 5, bodyY, w * 0.56, 5);
    // Telhado ondulado
    g.strokeStyle = 'rgba(0,0,0,0.18)'; g.lineWidth = 1;
    for (let x = 9; x < 5 + w * 0.56 - 2; x += 4) { g.beginPath(); g.moveTo(x, bodyY + 6); g.lineTo(x, bodyY + h - 23); g.stroke(); }
    // Silo de cristal
    const sx = w * 0.79, sy = h * 0.42;
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.arc(sx + 2, sy + 3, 15, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(sx, sy, 15, 0, Math.PI * 2);
    g.fillStyle = radGrad(g, sx, sy, 2, 15, [[0, '#9aa0a8'], [1, '#4b4f55']], sx - 5, sy - 5);
    g.fill();
    g.beginPath(); g.arc(sx, sy, 10, 0, Math.PI * 2);
    g.fillStyle = radGrad(g, sx, sy, 1, 10, [[0, '#c9fff6'], [0.5, '#35c4b4'], [1, '#0f5a57']], sx - 3, sy - 3);
    g.fill();
    // Doca listrada onde o coletor descarrega
    hazard(g, w / 2 - 18, dockY, 36, 7);
    g.strokeStyle = 'rgba(0,0,0,0.5)'; g.strokeRect(w / 2 - 18 + 0.5, dockY + 0.5, 35, 6);
  },
  barracks(g, c, w, h) {
    block(g, 6, 8, w - 12, h - 15, 5, '#7b8768');
    // Telhado em duas águas
    g.fillStyle = 'rgba(255,255,255,0.12)';
    g.fillRect(7, 9, w - 14, (h - 20) / 2);
    g.strokeStyle = 'rgba(0,0,0,0.35)';
    g.beginPath(); g.moveTo(7, 8 + (h - 20) / 2); g.lineTo(w - 7, 8 + (h - 20) / 2); g.stroke();
    // Porta
    g.fillStyle = '#25282b';
    g.fillRect(w / 2 - 5, h - 12, 10, 6);
    stripe(g, c, 6, h - 7, w - 12, 2.5);
    vent(g, w - 18, 12, 8, 6);
  },
  factory(g, c, w, h, doorTop) {
    const by = doorTop ? 12 : 5;
    block(g, 5, by, w - 10, h - 17, 6, '#8a8f97');
    // Telhado em dente de serra com claraboias
    const n = 4, sw = (w - 18) / n;
    for (let i = 0; i < n; i++) {
      const x = 9 + i * sw;
      g.fillStyle = linGrad(g, x, 0, x + sw, 0, [[0, '#a3a8af'], [1, '#6c7178']]);
      g.fillRect(x, by + 4, sw - 3, h - 32);
      g.fillStyle = linGrad(g, 0, by + 4, 0, by + h - 28, [[0, '#9fd2f5'], [1, '#2e4a62']]);
      g.fillRect(x + sw - 6, by + 5, 2.5, h - 34);
    }
    stripe(g, c, 5, by, w - 10, 4);
    // Portão de saída com faixa de alerta
    const dy = doorTop ? 3 : h - 15;
    g.fillStyle = '#2d3035';
    g.fillRect(w / 2 - 17, dy, 34, 11);
    g.fillStyle = '#4a4e54';
    for (let i = 0; i < 4; i++) g.fillRect(w / 2 - 16, dy + 1 + i * 2.6, 32, 1.2);
    hazard(g, w / 2 - 17, doorTop ? dy + 10 : dy - 2, 34, 2);
    // Chaminé
    g.fillStyle = '#4a4e54';
    g.beginPath(); g.arc(w - 14, by + 8, 4.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#151618';
    g.beginPath(); g.arc(w - 14, by + 8, 2.6, 0, Math.PI * 2); g.fill();
  },
  radar(g, c, w, h) {
    block(g, 7, 7, w - 14, h - 13, 5, '#868b93');
    stripe(g, c, 7, h - 11, w - 14, 3);
    g.beginPath(); g.arc(w / 2, h / 2 - 2, 7, 0, Math.PI * 2);
    g.fillStyle = '#4b4f55'; g.fill();
    vent(g, 11, 10, 7, 6);
  },
  turret(g, c, w, h) {
    // Base octogonal
    const r = w * 0.46, cx = w / 2, cy = h / 2;
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + i * Math.PI / 4;
      pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    poly(g, pts);
    g.fillStyle = linGrad(g, 0, 0, w, h, [[0, '#8c9198'], [1, '#4c5056']]);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = rgba(c.color, 0.8); g.lineWidth = 1.5;
    g.beginPath(); g.arc(cx, cy, r * 0.72, 0, Math.PI * 2); g.stroke();
  },
};

// Sprite do prédio (sem as partes animadas). "variant" troca o lado da porta.
function buildingSprite(type, c, variant) {
  const def = BUILDING_TYPES[type];
  const w = def.w * TILE, h = def.h * TILE;
  const key = 'b:' + type + ':' + c.id + ':' + (variant ? 1 : 0);
  return sprite(key, w + BMARGIN + BSHADOW, h + BMARGIN + BSHADOW, BMARGIN, BMARGIN, g => {
    if (type !== 'turret') foundation(g, w, h);
    BUILDING_ART[type](g, c, w, h, variant);
    // Leve banho da cor do time no prédio inteiro: aliado e inimigo se distinguem de longe
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = rgba(c.color, 0.22);
    g.fillRect(-BMARGIN, -BMARGIN, w + BMARGIN + BSHADOW, h + BMARGIN + BSHADOW);
    g.globalCompositeOperation = 'source-over';
    // Cantoneiras na cor do time nos quatro cantos do prédio (identidade forte sem esconder o desenho)
    if (type !== 'turret') {
      const k = Math.min(w, h) * 0.22, m = 2.5;
      g.lineWidth = 3;
      g.lineCap = 'round';
      g.strokeStyle = 'rgba(0,0,0,0.55)';
      const corners = () => {
        g.beginPath();
        g.moveTo(m, m + k); g.lineTo(m, m); g.lineTo(m + k, m);
        g.moveTo(w - m - k, m); g.lineTo(w - m, m); g.lineTo(w - m, m + k);
        g.moveTo(m, h - m - k); g.lineTo(m, h - m); g.lineTo(m + k, h - m);
        g.moveTo(w - m - k, h - m); g.lineTo(w - m, h - m); g.lineTo(w - m, h - m - k);
      };
      corners(); g.stroke();
      g.lineWidth = 1.8;
      g.strokeStyle = tint(c.color, 0.25);
      corners(); g.stroke();
    }
  });
}

// Camada de dano por cima do prédio: 1 (abaixo de 50%) rachaduras e fuligem; 2 (abaixo de 25%) mais e buracos
function damageSprite(type, level) {
  const def = BUILDING_TYPES[type];
  const w = def.w * TILE, h = def.h * TILE;
  return sprite('d:' + type + ':' + level, w, h, 0, 0, g => {
    const rng = makeRng(type.length * 977 + level * 31);
    const n = (def.w * def.h) * (level === 1 ? 1 : 2);
    for (let i = 0; i < n; i++) {
      const x = 6 + rng() * (w - 12), y = 6 + rng() * (h - 12), r = 6 + rng() * 9 * level;
      g.fillStyle = radGrad(g, x, y, 0, r, [[0, 'rgba(15,12,10,0.75)'], [0.6, 'rgba(25,20,16,0.35)'], [1, 'rgba(25,20,16,0)']]);
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    g.strokeStyle = 'rgba(12,10,9,0.85)';
    g.lineWidth = 1.1;
    for (let i = 0; i < n * 2; i++) {
      let x = 6 + rng() * (w - 12), y = 6 + rng() * (h - 12);
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) {
        x += (rng() - 0.5) * 12;
        y += (rng() - 0.5) * 12;
        g.lineTo(clamp(x, 3, w - 3), clamp(y, 3, h - 3));
      }
      g.stroke();
    }
    if (level === 2) {
      for (let i = 0; i < def.w; i++) {
        const x = 8 + rng() * (w - 16), y = 8 + rng() * (h - 16), r = 3 + rng() * 3;
        g.fillStyle = '#0d0b0a';
        g.beginPath();
        g.ellipse(x, y, r * 1.3, r, rng() * 3, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(255,140,60,0.5)';
        g.stroke();
      }
    }
  });
}

function buildingShadow(type, c, variant) {
  return shadowOf('bs:' + type + ':' + c.id + ':' + (variant ? 1 : 0), buildingSprite(type, c, variant), 3);
}

function turretHeadSprite(c) {
  return sprite('th:' + c.id, 40, 24, 12, 12, g => {
    g.fillStyle = linGrad(g, 0, -2.2, 0, 2.2, [[0, '#6a6f76'], [0.5, '#3b3f45'], [1, '#1f2226']]);
    g.fillRect(2, -2, 17, 4);
    g.fillStyle = '#26292d';
    g.fillRect(17, -2.8, 3, 5.6);
    g.beginPath(); g.arc(0, 0, 8.5, 0, Math.PI * 2);
    g.fillStyle = radGrad(g, 0, 0, 1, 8.5, [[0, tint(c.color, 0.35)], [0.6, c.color], [1, tint(c.color, -0.45)]], -2.5, -2.5);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(0,0,0,0.3)';
    g.fillRect(-5, -1, 4, 2);
  });
}

function radarDishSprite() {
  return sprite('dish', 40, 20, 20, 10, g => {
    g.beginPath(); g.ellipse(0, 0, 17, 6.5, 0, 0, Math.PI * 2);
    g.fillStyle = linGrad(g, 0, -6, 0, 6, [[0, '#eef2f6'], [0.6, '#aab0b8'], [1, '#6d737b']]);
    g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(0,0,0,0.2)';
    g.beginPath(); g.moveTo(-14, 0); g.lineTo(14, 0); g.stroke();
    g.fillStyle = '#3a3d42';
    g.fillRect(-1.5, -1.5, 3, 3);
  });
}

// Sprites de brilho (radiais) para luzes e partículas, um por cor
function glowSprite(name, stops) {
  return sprite('g:' + name, 32, 32, 16, 16, g => {
    g.fillStyle = radGrad(g, 0, 0, 0, 16, stops);
    g.fillRect(-16, -16, 32, 32);
  });
}

const GLOWS = {};
function glow(name) {
  if (GLOWS[name]) return GLOWS[name];
  const defs = {
    fire: [[0, 'rgba(255,250,220,1)'], [0.25, 'rgba(255,200,90,0.9)'], [0.6, 'rgba(255,110,30,0.35)'], [1, 'rgba(255,60,0,0)']],
    flash: [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,240,200,0.7)'], [1, 'rgba(255,200,120,0)']],
    smoke: [[0, 'rgba(90,88,84,0.75)'], [0.6, 'rgba(70,68,64,0.35)'], [1, 'rgba(60,58,55,0)']],
    dark: [[0, 'rgba(34,32,30,0.65)'], [0.6, 'rgba(28,27,25,0.3)'], [1, 'rgba(20,20,20,0)']],
    dust: [[0, 'rgba(170,155,125,0.6)'], [0.6, 'rgba(150,138,110,0.25)'], [1, 'rgba(140,130,100,0)']],
    teal: [[0, 'rgba(220,255,250,1)'], [0.3, 'rgba(90,240,220,0.7)'], [1, 'rgba(40,200,190,0)']],
    yellow: [[0, 'rgba(255,255,220,1)'], [0.3, 'rgba(255,230,110,0.7)'], [1, 'rgba(255,200,40,0)']],
    red: [[0, 'rgba(255,220,210,1)'], [0.3, 'rgba(255,70,50,0.75)'], [1, 'rgba(255,30,20,0)']],
    green: [[0, 'rgba(230,255,230,1)'], [0.3, 'rgba(120,255,120,0.7)'], [1, 'rgba(60,255,60,0)']],
    blue: [[0, 'rgba(230,240,255,1)'], [0.3, 'rgba(110,170,255,0.7)'], [1, 'rgba(60,120,255,0)']],
    scorch: [[0, 'rgba(12,10,8,0.7)'], [0.5, 'rgba(20,16,12,0.45)'], [1, 'rgba(20,16,12,0)']],
  };
  GLOWS[name] = glowSprite(name, defs[name]);
  return GLOWS[name];
}

// Desenha um brilho centrado em (x, y) com raio r
function drawGlow(ctx, name, x, y, r, alpha = 1) {
  const s = glow(name);
  ctx.globalAlpha = alpha;
  ctx.drawImage(s.canvas, x - r, y - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}
