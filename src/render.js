// Desenho do mundo: mapa, prédios, unidades, efeitos, névoa e minimapa.
// Tudo é desenhado por código, sem imagens externas.

// ---------- Unidades ----------

// Quadro de animação da esteira (pelo odômetro) ou do passo (infantaria)
function unitFrame(u) {
  if (!u) return 0;
  const s = unitFx.get(u);
  const odo = s ? s.odo : 0;
  if (u.type === 'trooper' || u.type === 'rocketeer') {
    return u.path.length ? Math.floor(odo / 3) % WALK_FRAMES : 0;
  }
  if (u.type === 'scout') return 0;
  return Math.floor(odo / 1.2) % TRACK_FRAMES;
}

// Corpo da unidade na origem (contexto já girado). Usado no mapa, nos ícones e no título.
function drawUnitBody(ctx, type, c, u) {
  blit(ctx, unitSprite(type, c, unitFrame(u)));
  if (type === 'tank') {
    ctx.save();
    ctx.rotate(u ? angleDiff(u.angle, u.turret) : 0);
    blit(ctx, turretSprite(c));
    ctx.restore();
  } else if (type === 'harvester') {
    drawHarvesterLive(ctx, u ? u.cargo / UNIT_TYPES.harvester.capacity : 0.6, u && u.hstate === 'harvest', gameTime);
  }
}

// Mantido para a tela de título (cartões de facção)
function drawTank(ctx, c, turret) {
  blit(ctx, unitSprite('tank', c, 0));
  ctx.save();
  ctx.rotate(turret || 0);
  blit(ctx, turretSprite(c));
  ctx.restore();
}

function drawHealthBar(ctx, x, y, w, frac) {
  frac = clamp(frac, 0, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(x - 1, y - 1, w + 2, 5);
  const col = frac > 0.5 ? ['#7af06a', '#3aa83a'] : frac > 0.25 ? ['#ffe066', '#c89a22'] : ['#ff7a5a', '#c0302a'];
  ctx.fillStyle = col[1];
  ctx.fillRect(x, y, w * frac, 3);
  ctx.fillStyle = col[0];
  ctx.fillRect(x, y, w * frac, 1.5);
  // Marcas a cada 25%
  if (w > 24) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    for (let i = 1; i < 4; i++) ctx.fillRect(x + Math.round(w * i / 4), y, 1, 3);
  }
}

// Sombra macia de cada unidade (sempre para baixo à direita, como o sol)
function drawUnitShadow(ctx, u) {
  const c = TEAMS[u.team];
  const sh = rotatedShadow('us:' + u.type + ':' + c.id, unitSprite(u.type, c, 0), u.angle, u.radius > 8 ? 2 : 1.2);
  const off = u.radius > 8 ? 3.5 : 2;
  ctx.drawImage(sh.canvas, u.x + off - sh.ox, u.y + off * 1.2 - sh.oy, sh.w, sh.h);
}

function drawSelectionRing(ctx, u) {
  const r = u.radius + 4;
  ctx.strokeStyle = 'rgba(125,255,122,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(u.x, u.y + 1, r, r * 0.86, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(125,255,122,0.25)';
  ctx.lineWidth = 4;
  ctx.stroke();
}

function drawUnit(ctx, u) {
  ctx.save();
  ctx.translate(u.x, u.y);
  ctx.rotate(u.angle);
  drawUnitBody(ctx, u.type, TEAMS[u.team], u);
  ctx.restore();
}

// Barra de vida: sempre nas selecionadas; nas outras só logo depois de levar dano ou quando
// a vida está baixa (numa batalha grande as barras não viram uma grade sobre as unidades)
const barSeen = new WeakMap(); // unidade -> { hp, t }
function drawUnitBar(ctx, u) {
  const now = performance.now();
  let s = barSeen.get(u);
  if (!s) { s = { hp: u.hp, t: -1e9 }; barSeen.set(u, s); }
  if (u.hp < s.hp) s.t = now;
  s.hp = u.hp;
  const recent = now - s.t < 2500;
  if (u.selected || (u.hp < u.maxHp && (recent || u.hp < u.maxHp * 0.35))) {
    const w = Math.max(14, u.radius * 2 + 2);
    ctx.globalAlpha = u.selected || recent ? 1 : 0.75;
    drawHealthBar(ctx, u.x - w / 2, u.y - u.radius - 9, w, u.hp / u.maxHp);
    ctx.globalAlpha = 1;
  }
}

// ---------- Prédios ----------

// Lado da porta/doca do prédio (sprite com a porta em cima ou embaixo)
function doorOnTop(b) {
  return b.tx !== undefined && (b.type === 'refinery' || b.type === 'factory') && exitSide(b) === 'top';
}

// Desenha um prédio com o canto superior esquerdo na origem. "b" pode ser um prédio
// de verdade ou um objeto simples { type, team, turret } (ícones e fantasma).
function drawBuildingBody(ctx, b, c, w, h) {
  blit(ctx, buildingSprite(b.type, c, doorOnTop(b)));
  drawBuildingLive(ctx, b, c, w, h);
}

// Partes animadas: luzes, radar girando, torre, bandeira
function drawBuildingLive(ctx, b, c, w, h) {
  const real = b.tx !== undefined;
  const powered = !real || !teams[b.team] || !lowPower(b.team);
  const t = real ? performance.now() / 1000 : 0;
  const type = b.type;
  if (type === 'turret') {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(b.turret || 0);
    blit(ctx, turretHeadSprite(c));
    ctx.restore();
  } else if (type === 'radar') {
    ctx.save();
    ctx.translate(w / 2, h / 2 - 2);
    ctx.rotate(powered ? (real ? gameTime : 0) * 1.5 : 0.6);
    blit(ctx, radarDishSprite());
    ctx.restore();
  }
  if (!real) return;
  ctx.globalCompositeOperation = 'lighter';
  if (type === 'power' && powered) {
    const p = 0.75 + Math.sin(t * 3 + b.id) * 0.25;
    drawGlow(ctx, 'yellow', w * 0.3, h * 0.36, w * 0.17, p);
    drawGlow(ctx, 'yellow', w * 0.7, h * 0.64, w * 0.17, p);
  } else if (type === 'refinery') {
    drawGlow(ctx, 'teal', w * 0.79, h * 0.42, 16, 0.35 + Math.sin(t * 2 + b.id) * 0.15);
  } else if (type === 'hq') {
    if (Math.sin(t * 4 + b.id) > 0.3) drawGlow(ctx, 'red', w - 9, 2, 5, 0.9);
    drawGlow(ctx, 'blue', w / 2, h / 2 + 3, 13, powered ? 0.25 + Math.sin(t * 1.5) * 0.08 : 0.08);
  } else if (type === 'radar' && powered) {
    if (Math.sin(t * 6 + b.id) > 0.6) drawGlow(ctx, 'green', w / 2, h / 2 - 2, 5, 0.9);
  } else if (type === 'factory' && b.queue && b.queue.length && (!real || b.team === 0 || !gameOptions.fog || isVisibleToPlayer(b))) {
    // Faíscas de solda nas claraboias enquanto produz
    const by = doorOnTop(b) ? 12 : 5;
    if (Math.random() < 0.5) drawGlow(ctx, 'blue', 14 + Math.random() * (w - 30), by + 8 + Math.random() * (h - 36), 5, 0.8);
  } else if (type === 'barracks') {
    drawGlow(ctx, 'yellow', w / 2, h - 9, 6, 0.25);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (type === 'barracks') {
    // Bandeira tremulando
    ctx.strokeStyle = '#d6d8dc';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(11, 12);
    ctx.lineTo(11, -6);
    ctx.stroke();
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.moveTo(11, -6);
    for (let i = 0; i <= 4; i++) ctx.lineTo(11 + i * 3, -6 + Math.sin(t * 6 + i * 0.9) * 1.3);
    for (let i = 4; i >= 0; i--) ctx.lineTo(11 + i * 3, 1 + Math.sin(t * 6 + i * 0.9) * 1.3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBuilding(ctx, b) {
  const w = b.w * TILE, h = b.h * TILE;
  const x = b.tx * TILE, y = b.ty * TILE;
  const c = TEAMS[b.team];
  const grow = clamp((gameTime - b.born) / 0.9, 0, 1); // surge do chão, de baixo para cima
  ctx.save();
  ctx.translate(x, y);
  if (grow >= 1) {
    ctx.translate(5, 6);
    blit(ctx, buildingShadow(b.type, c, doorOnTop(b)));
    ctx.translate(-5, -6);
    drawBuildingBody(ctx, b, c, w, h);
    const hp = b.team !== 0 && b.seenHp !== undefined && !isVisibleToPlayer(b) ? b.seenHp : b.hp;
    const f = hp / b.maxHp;
    if (f < 0.5) blit(ctx, damageSprite(b.type, f < 0.25 ? 2 : 1));
  } else {
    const top = h * (1 - grow);
    ctx.save();
    ctx.beginPath();
    ctx.rect(-BMARGIN, top, w + BMARGIN + BSHADOW, h - top + BSHADOW);
    ctx.clip();
    ctx.globalAlpha = 0.5 + grow * 0.5;
    drawBuildingBody(ctx, b, c, w, h);
    ctx.restore();
    // Linha de montagem: brilho que sobe
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(120,220,255,0.55)';
    ctx.fillRect(0, top - 1, w, 2);
    ctx.fillStyle = 'rgba(120,220,255,0.12)';
    ctx.fillRect(0, 0, w, top);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(120,220,255,0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);
  }
  ctx.restore();

  if (b.selected) {
    // Cantoneiras de seleção
    ctx.strokeStyle = '#7dff7a';
    ctx.lineWidth = 2;
    const L = 9;
    [[x - 2, y - 2, 1, 1], [x + w + 2, y - 2, -1, 1], [x - 2, y + h + 2, 1, -1], [x + w + 2, y + h + 2, -1, -1]].forEach(([cx, cy, sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * L, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + sy * L);
      ctx.stroke();
    });
  }
}

function drawBuildingBar(ctx, b) {
  const hp = b.team !== 0 && b.seenHp !== undefined && !isVisibleToPlayer(b) ? b.seenHp : b.hp;
  const f = hp / b.maxHp;
  const w = b.w * TILE, x = b.tx * TILE, y = b.ty * TILE;
  if (b.selected || hp < b.maxHp) drawHealthBar(ctx, x + 4, y - 8, w - 8, f);
  if (b.repairing) {
    const k = (performance.now() / 600) % 1;
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = '#7dff7a';
    ctx.font = 'bold 16px ' + UI_FONT;
    ctx.textAlign = 'center';
    ctx.fillText('+', b.x, b.y - k * 16);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  // Fogo vivo nos prédios muito danificados (luz que tremula)
  if (f < 0.25 && (isVisibleToPlayer(b) || b.team === 0 || !gameOptions.fog)) {
    ctx.globalCompositeOperation = 'lighter';
    drawGlow(ctx, 'fire', b.x + w * 0.12, b.y, 12 + Math.sin(performance.now() / 70) * 3, 0.7);
    ctx.globalCompositeOperation = 'source-over';
  }
}

// Fantasma do prédio a posicionar: verde onde pode, vermelho onde não pode
function drawPlacementGhost(ctx) {
  const c = teams[0].construct;
  if (input.mode !== 'place' || !c || !c.ready) return;
  const def = BUILDING_TYPES[c.type];
  // Área onde dá para construir (planalto livre perto da base), levemente destacada
  const own = teamBuildings(0);
  const x0 = Math.max(0, Math.floor(camera.x / TILE)), y0 = Math.max(0, Math.floor(camera.y / TILE));
  const x1 = Math.min(MAP_W - 1, Math.ceil((camera.x + camera.ww) / TILE));
  const y1 = Math.min(MAP_H - 1, Math.ceil((camera.y + camera.wh) / TILE));
  ctx.fillStyle = 'rgba(120,255,160,0.10)';
  ctx.strokeStyle = 'rgba(120,255,160,0.16)';
  ctx.lineWidth = 1;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!isBuildable(gameMap, x, y)) continue;
      if (!own.some(b => b.type !== 'turret' && rectGap(x, y, 1, 1, b.tx, b.ty, b.w, b.h) <= BUILD_RANGE)) continue;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
    }
  }
  const spot = placementSpot(def);
  const check = checkPlacement(0, c.type, spot.x, spot.y);
  ctx.save();
  ctx.globalAlpha = 0.6;
  ctx.translate(spot.x * TILE, spot.y * TILE);
  const ghost = { type: c.type, team: 0 };
  if (c.type === 'refinery' || c.type === 'factory') ghost.tx = spot.x, ghost.ty = spot.y, ghost.w = def.w, ghost.h = def.h, ghost.x = (spot.x + def.w / 2) * TILE, ghost.y = (spot.y + def.h / 2) * TILE;
  blit(ctx, buildingSprite(c.type, TEAMS[0], doorOnTop(ghost)));
  if (c.type === 'turret' || c.type === 'radar') drawBuildingLive(ctx, { type: c.type, team: 0 }, TEAMS[0], def.w * TILE, def.h * TILE);
  ctx.restore();
  check.tiles.forEach(t => {
    ctx.fillStyle = t.ok ? 'rgba(80,255,90,0.28)' : 'rgba(255,60,50,0.42)';
    ctx.fillRect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = t.ok ? 'rgba(140,255,150,0.8)' : 'rgba(255,110,90,0.9)';
    ctx.strokeRect(t.x * TILE + 1.5, t.y * TILE + 1.5, TILE - 3, TILE - 3);
  });
}

// ---------- Efeitos ----------

const rubbleCache = new WeakMap();

function rubbleSprite(d) {
  let s = rubbleCache.get(d);
  if (s) return s;
  const w = d.w * TILE, h = d.h * TILE, pad = 14;
  const c = document.createElement('canvas');
  c.width = (w + pad * 2) * 2;
  c.height = (h + pad * 2) * 2;
  const g = c.getContext('2d');
  g.scale(2, 2);
  const rng = makeRng(Math.round(d.x * 13 + d.y));
  g.translate(pad, pad);
  // Chão queimado: várias manchas macias, sem borda reta
  for (let i = 0; i < d.w * d.h * 3; i++) {
    const x = rng() * w, y = rng() * h, r = 10 + rng() * 14;
    g.fillStyle = radGrad(g, x, y, 0, r, [[0, 'rgba(14,11,9,0.55)'], [0.6, 'rgba(22,18,14,0.3)'], [1, 'rgba(22,18,14,0)']]);
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Destroços angulosos: placas de concreto e chapas de metal
  const tones = [[118, 116, 112], [92, 90, 88], [70, 66, 62], [58, 62, 68]];
  for (let i = 0; i < d.w * d.h * 6; i++) {
    const x = 3 + rng() * (w - 6), y = 3 + rng() * (h - 6), r = 2 + rng() * 4.5;
    const t = tones[(rng() * tones.length) | 0];
    const n = 3 + ((rng() * 3) | 0), a0 = rng() * Math.PI;
    const pts = [];
    for (let k = 0; k < n; k++) {
      const a = a0 + k / n * Math.PI * 2, rr = r * (0.6 + rng() * 0.5);
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
    }
    g.fillStyle = 'rgba(0,0,0,0.35)';
    poly(g, pts.map((v, k) => v + (k % 2 ? 1.5 : 1.2)));
    g.fill();
    poly(g, pts);
    g.fillStyle = `rgb(${t[0]},${t[1]},${t[2]})`;
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(pts[0], pts[1]);
    g.lineTo(pts[2], pts[3]);
    g.stroke();
  }
  // Vigas retorcidas
  g.strokeStyle = 'rgba(38,34,32,0.95)';
  g.lineWidth = 1.6;
  for (let i = 0; i < d.w * 2; i++) {
    let x = rng() * w, y = rng() * h;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 2; k++) { x += (rng() - 0.5) * 16; y += (rng() - 0.5) * 16; g.lineTo(x, y); }
    g.stroke();
  }
  s = { canvas: c, w: w + pad * 2, h: h + pad * 2, pad };
  rubbleCache.set(d, s);
  return s;
}

// Marcas no chão só aparecem depois que o jogador vê o lugar (nada se revela sob a névoa)
const decalSeen = new WeakSet();
function drawDecals(ctx) {
  decals.forEach(d => {
    if (gameOptions.fog && gameState !== 'title' && !decalSeen.has(d)) {
      if (!fxVisible(d.x, d.y)) return;
      decalSeen.add(d);
    }
    if (!fxNearScreen(d.x, d.y, 80)) return;
    if (d.rubble) {
      const s = rubbleSprite(d);
      ctx.drawImage(s.canvas, d.x - d.w * TILE / 2 - s.pad, d.y - d.h * TILE / 2 - s.pad, s.w, s.h);
      return;
    }
    // Marca de queimado
    const s = glow('scorch');
    ctx.drawImage(s.canvas, d.x - d.r * 1.3, d.y - d.r * 1.1, d.r * 2.6, d.r * 2.2);
  });
}

function drawProjectiles(ctx) {
  ctx.globalCompositeOperation = 'lighter';
  projectiles.forEach(p => {
    if (!fxNearScreen(p.x, p.y, 20) || !fxVisible(p.x, p.y)) return;
    const a = Math.atan2(p.ty - p.y, p.tx - p.x);
    const ca = Math.cos(a), sa = Math.sin(a);
    if (p.kind === 'shell') {
      ctx.strokeStyle = 'rgba(255,200,110,0.8)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - ca * 12, p.y - sa * 12);
      ctx.stroke();
      drawGlow(ctx, 'fire', p.x, p.y, 6);
    } else if (p.kind === 'arty') {
      const lift = artyLift(p);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 'fire', p.x, p.y - lift, 8);
    } else if (p.kind === 'rocket') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#3a3d42';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - ca * 6, p.y - sa * 6);
      ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      drawGlow(ctx, 'fire', p.x - ca * 7, p.y - sa * 7, 7);
    } else {
      ctx.strokeStyle = 'rgba(255,240,170,0.9)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - ca * 9, p.y - sa * 9);
      ctx.stroke();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}

function drawOrderMarkers(ctx, dt) {
  // Duração em tempo real (não no dt limitado): com quadros lentos o marcador não some em 2 quadros
  const now = performance.now() / 1000;
  orderMarkers.forEach(m => { if (m.t0 === undefined) m.t0 = now - m.t; m.t = now - m.t0; });
  orderMarkers = orderMarkers.filter(m => m.t < 0.7);
  orderMarkers.forEach(m => {
    const k = m.t / 0.7;
    const rgb = m.color || '125,255,122';
    // Contorno escuro por baixo: o marcador se lê sobre areia clara e sobre cristal
    ctx.beginPath();
    ctx.ellipse(m.x, m.y, 4 + k * 13, (4 + k * 13) * 0.8, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,0,0,${0.55 * (1 - k)})`;
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.strokeStyle = `rgba(${rgb},${1 - k})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Setas convergindo para o ponto
    const d = 14 * (1 - k) + 4;
    ctx.fillStyle = `rgba(${rgb},${1 - k})`;
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + Math.PI / 4;
      const x = m.x + Math.cos(a) * d, y = m.y + Math.sin(a) * d * 0.8;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4);
      ctx.lineTo(x + Math.cos(a + 2.4) * 3, y + Math.sin(a + 2.4) * 3);
      ctx.lineTo(x + Math.cos(a - 2.4) * 3, y + Math.sin(a - 2.4) * 3);
      ctx.closePath();
      ctx.fill();
    }
  });
}

// Linha até o ponto de encontro do prédio selecionado
function drawRally(ctx) {
  buildings.forEach(b => {
    if (!b.selected || !b.rally) return;
    ctx.strokeStyle = 'rgba(125,255,122,0.6)';
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -performance.now() / 60;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.rally.x, b.rally.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
    ctx.fillStyle = '#d6d8dc';
    ctx.fillRect(b.rally.x - 1, b.rally.y - 15, 2, 15);
    ctx.fillStyle = '#7dff7a';
    const t = performance.now() / 1000;
    ctx.beginPath();
    ctx.moveTo(b.rally.x + 1, b.rally.y - 15);
    ctx.lineTo(b.rally.x + 10, b.rally.y - 13 + Math.sin(t * 6) * 1.2);
    ctx.lineTo(b.rally.x + 1, b.rally.y - 9);
    ctx.closePath();
    ctx.fill();
  });
}

// Mira no lugar do cursor quando ele está sobre um inimigo (ou no modo atacar-movendo)
function drawReticle(ctx, x, y, color) {
  const t = performance.now() / 1000;
  const r = 9 + Math.sin(t * 8) * 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 4;
  reticlePath(ctx, x, y, r);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  reticlePath(ctx, x, y, r);
  ctx.stroke();
}

function reticlePath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.moveTo(x - r - 6, y); ctx.lineTo(x - r + 4, y);
  ctx.moveTo(x + r - 4, y); ctx.lineTo(x + r + 6, y);
  ctx.moveTo(x, y - r - 6); ctx.lineTo(x, y - r + 4);
  ctx.moveTo(x, y + r - 4); ctx.lineTo(x, y + r + 6);
}

// ---------- Minimapa ----------

function drawMinimap(ctx) {
  const r = minimapRect();
  ctx.fillStyle = '#05070a';
  ctx.fillRect(r.x - 3, r.y - 3, r.w + 6, r.h + 6);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(miniCanvas, r.x, r.y, r.w, r.h);
  const s = r.w / MAP_W;

  buildings.concat(ghosts).forEach(b => {
    if (b.hp > 0 ? !isExploredByPlayer(b) : !b.seen) return;
    ctx.fillStyle = TEAMS[b.team].color;
    ctx.fillRect(r.x + b.tx * s, r.y + b.ty * s, b.w * s, b.h * s);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + b.tx * s + 0.5, r.y + b.ty * s + 0.5, b.w * s - 1, b.h * s - 1);
  });
  // Com Radar funcionando, todas as unidades inimigas aparecem no minimapa
  const radar = teams[0].hasRadar;
  units.forEach(u => {
    if (u.team !== 0 && !radar) return;
    ctx.fillStyle = TEAMS[u.team].light;
    ctx.fillRect(r.x + u.x / TILE * s - 1.5, r.y + u.y / TILE * s - 1.5, 3, 3);
  });

  if (gameOptions.fog) {
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(fog.canvas, r.x, r.y, r.w, r.h);
  }

  pings.forEach(p => {
    const k = (p.t * 2) % 1;
    ctx.strokeStyle = `rgba(255,80,60,${1 - k})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(r.x + p.x / TILE * s, r.y + p.y / TILE * s, 3 + k * 12, 0, Math.PI * 2);
    ctx.stroke();
  });

  const k = s / TILE;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    r.x + Math.max(0, camera.x) * k + 0.5,
    r.y + Math.max(0, camera.y) * k + 0.5,
    Math.min(camera.ww, MAP_W * TILE) * k - 1,
    Math.min(camera.wh - Math.max(0, -camera.y), MAP_H * TILE) * k - 1
  );
  if (!radar) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(r.x, r.y + r.h - 16, 64, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px ' + UI_FONT;
    ctx.textBaseline = 'middle';
    ctx.fillText('sem radar', r.x + 5, r.y + r.h - 8);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.strokeRect(r.x - 2.5, r.y - 2.5, r.w + 5, r.h + 5);
}

// ---------- Atmosfera: brilho do cristal e vinheta ----------

let vignette = null;

// Bordas da tela levemente escurecidas. Só as faixas das bordas são desenhadas
// (o centro fica de fora), o que poupa preenchimento de tela.
function drawVignette(ctx) {
  const W = camera.w, H = camera.h;
  if (!vignette || vignette.w !== W || vignette.h !== H) {
    const mk = (w, h, x0, y0, x1, y1) => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w));
      c.height = Math.max(1, Math.ceil(h));
      const g = c.getContext('2d');
      g.fillStyle = linGrad(g, x0, y0, x1, y1, [[0, 'rgba(0,0,8,0.34)'], [0.45, 'rgba(0,0,8,0.12)'], [1, 'rgba(0,0,8,0)']]);
      g.fillRect(0, 0, c.width, c.height);
      return c;
    };
    const bw = Math.round(W * 0.14), bh = Math.round(H * 0.16);
    vignette = {
      w: W, h: H, bw, bh,
      left: mk(bw, 1, 0, 0, bw, 0), right: mk(bw, 1, bw, 0, 0, 0),
      top: mk(1, bh, 0, 0, 0, bh), bottom: mk(1, bh, 0, bh, 0, 0),
    };
  }
  const v = vignette;
  ctx.drawImage(v.left, 0, 0, v.bw, H);
  ctx.drawImage(v.right, W - v.bw, 0, v.bw, H);
  ctx.drawImage(v.top, 0, 0, W, v.bh);
  ctx.drawImage(v.bottom, 0, H - v.bh, W, v.bh);
}

// Cintilar dos cristais à vista
function drawCrystalSparkles(ctx, cx, cy) {
  const t = performance.now() / 1000;
  const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
  const x1 = Math.min(MAP_W - 1, Math.floor((cx + camera.ww) / TILE)), y1 = Math.min(MAP_H - 1, Math.floor((cy + camera.wh) / TILE));
  ctx.globalCompositeOperation = 'lighter';
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (gameMap.tiles[y * MAP_W + x] !== TERRAIN.CRYSTAL) continue;
      const h = (x * 73856093 ^ y * 19349663) >>> 0;
      const phase = (h % 1000) / 1000;
      const k = (t * 0.35 + phase) % 1;
      if (k > 0.12) continue;
      if (gameOptions.fog && gameState !== 'title' && !tileVisible(x, y)) continue;
      const a = Math.sin(k / 0.12 * Math.PI);
      const sx = x * TILE + 8 + (h >> 10) % 16, sy = y * TILE + 6 + (h >> 16) % 14;
      drawGlow(ctx, 'teal', sx, sy, 6 * a + 1, a);
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.fillRect(sx - 3 * a, sy - 0.5, 6 * a, 1);
      ctx.fillRect(sx - 0.5, sy - 3 * a, 1, 6 * a);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- Névoa suave ----------
// A névoa da partida tem 1 pixel por tile. Para desenhar, ela é ampliada para 8 px por tile e
// desfocada: borda macia e sem degraus mesmo com zoom. As bordas do mapa são repetidas antes do
// desfoque, para o preto de fora não "vazar" para dentro.
const FOG_RES = 8;
let smoothFog = null;

function fogImage() {
  if (!canFilter) return { canvas: fog.canvas, k: 1, pad: 0 };
  if (!smoothFog || smoothFog.w !== fog.w) {
    const pad = 2;
    const src = document.createElement('canvas');
    src.width = fog.w + pad * 2;
    src.height = fog.h + pad * 2;
    const big = document.createElement('canvas');
    big.width = src.width * FOG_RES;
    big.height = src.height * FOG_RES;
    smoothFog = { w: fog.w, src, big, pad, version: -1 };
  }
  const f = smoothFog;
  if (f.version !== fog.version) {
    f.version = fog.version;
    const s = f.src.getContext('2d');
    const p = f.pad, W = fog.w, H = fog.h;
    s.clearRect(0, 0, f.src.width, f.src.height);
    s.drawImage(fog.canvas, p, p);
    s.drawImage(fog.canvas, 0, 0, W, 1, p, 0, W, p);          // borda de cima
    s.drawImage(fog.canvas, 0, H - 1, W, 1, p, H + p, W, p);  // de baixo
    s.drawImage(f.src, p, 0, 1, H + p * 2, 0, 0, p, H + p * 2);          // esquerda
    s.drawImage(f.src, W + p - 1, 0, 1, H + p * 2, W + p, 0, p, H + p * 2); // direita
    const g = f.big.getContext('2d');
    g.clearRect(0, 0, f.big.width, f.big.height);
    g.imageSmoothingEnabled = true;
    g.filter = 'blur(' + FOG_RES * 0.55 + 'px)';
    g.drawImage(f.src, 0, 0, f.big.width, f.big.height);
    g.filter = 'none';
  }
  return { canvas: f.big, k: FOG_RES, pad: f.pad };
}

function drawFog(ctx) {
  const f = fogImage();
  ctx.imageSmoothingEnabled = true;
  const p = f.pad * f.k;
  ctx.drawImage(f.canvas, p, p, MAP_W * f.k, MAP_H * f.k, 0, 0, MAP_W * TILE, MAP_H * TILE);
}

// ---------- Quadro completo do mundo ----------

// Grão de detalhe do terreno: pontinhos claros e escuros, pedrinhas e fiapos de capim em 2x,
// presos ao mundo (andam com o mapa). Só aparece quando o terreno estaria ampliado.
let grainPattern = null;
function drawTerrainGrain(ctx, x, y, w, h, density) {
  if (!grainPattern) {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const g = c.getContext('2d');
    const rng = makeRng(4242);
    for (let i = 0; i < 2600; i++) {
      const px = rng() * S, py = rng() * S, light = rng() < 0.45;
      g.fillStyle = light ? `rgba(255,248,225,${0.05 + rng() * 0.08})` : `rgba(10,8,4,${0.08 + rng() * 0.12})`;
      const r = 0.5 + rng() * 0.9;
      g.fillRect(px, py, r, r);
    }
    // Pedrinhas com luz a noroeste
    for (let i = 0; i < 70; i++) {
      const px = rng() * S, py = rng() * S, r = 0.8 + rng() * 1.6;
      g.fillStyle = 'rgba(0,0,0,0.16)';
      g.beginPath(); g.ellipse(px + 0.6, py + 0.7, r, r * 0.75, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,245,220,0.12)';
      g.beginPath(); g.ellipse(px - 0.3, py - 0.3, r * 0.7, r * 0.5, 0, 0, Math.PI * 2); g.fill();
    }
    // Fiapos finos
    g.lineWidth = 0.6;
    for (let i = 0; i < 160; i++) {
      const px = rng() * S, py = rng() * S, a = -Math.PI / 2 + (rng() - 0.5) * 1.2, l = 1.5 + rng() * 2.5;
      g.strokeStyle = rng() < 0.5 ? 'rgba(20,16,6,0.14)' : 'rgba(230,240,190,0.08)';
      g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); g.stroke();
    }
    grainPattern = ctx.createPattern(c, 'repeat');
  }
  if (grainPattern.setTransform && typeof DOMMatrix !== 'undefined') grainPattern.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
  ctx.globalAlpha = clamp((density - 1.5) * 1.5 + 0.45, 0.45, 1);
  ctx.fillStyle = grainPattern;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
}

function renderWorld(ctx, dt) {
  refreshDirtyTiles();
  updateFx(gameState === 'paused' ? 0 : dt);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, camera.w, camera.h);

  // Tremor de tela nas explosões grandes (só no desenho)
  const z = camera.zoom;
  const shx = screenShake > 0.3 ? (Math.random() - 0.5) * screenShake : 0;
  const shy = screenShake > 0.3 ? (Math.random() - 0.5) * screenShake : 0;
  // Posição arredondada ao pixel da tela (sem tremeluzir ao rolar)
  const cx = Math.round((camera.x + shx) * z) / z, cy = Math.round((camera.y + shy) * z) / z;
  const VW = camera.ww, VH = camera.wh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, camera.w, camera.h);
  ctx.clip();
  ctx.scale(z, z);
  const sx = Math.max(0, cx), sy = Math.max(0, cy);
  const sw = Math.min(VW - (sx - cx), mapCanvas.width - sx);
  const sh = Math.min(VH - (sy - cy), mapCanvas.height - sy);
  const ground = crystalsLive() ? mapCanvas : terrainWithCrystals();
  if (sw > 0 && sh > 0) ctx.drawImage(ground, sx, sy, sw, sh, sx - cx, sy - cy, sw, sh);
  ctx.imageSmoothingEnabled = true;
  ctx.translate(-cx, -cy);
  // Com zoom alto ou tela retina o terreno (pintado em 1x) é esticado: um grão fino em 2x devolve a nitidez
  if (!gfx.low && z * pixelRatio >= 1.5) drawTerrainGrain(ctx, cx, cy, VW, VH, z * pixelRatio);
  drawCrystals(ctx, Math.floor(cx / TILE), Math.floor(cy / TILE), Math.floor((cx + VW) / TILE), Math.floor((cy + VH) / TILE));
  if (!gfx.low) drawCrystalSparkles(ctx, cx, cy);
  drawDecals(ctx);
  drawTrackMarks(ctx);
  drawOrderMarkers(ctx, dt);

  const onScreen = (x, y, m) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m;
  const shownB = buildings.filter(b => onScreen(b.x, b.y, 110) && isExploredByPlayer(b));
  const shownG = ghosts.filter(b => onScreen(b.x, b.y, 110));
  shownG.forEach(b => drawBuilding(ctx, b));
  shownB.forEach(b => drawBuilding(ctx, b));
  drawRally(ctx);
  const shownU = units.filter(u => onScreen(u.x, u.y, 40) && isVisibleToPlayer(u));
  if (!gfx.low) shownU.forEach(u => drawUnitShadow(ctx, u));
  shownU.forEach(u => { if (u.selected) drawSelectionRing(ctx, u); });
  // Infantaria por baixo dos veículos
  shownU.forEach(u => { if (u.radius <= 6) drawUnit(ctx, u); });
  shownU.forEach(u => { if (u.radius > 6) drawUnit(ctx, u); });
  if (input.hoverEnemy) {
    const e = input.hoverEnemy;
    ctx.strokeStyle = '#ff4a3a';
    ctx.lineWidth = 1.5;
    if (e.kind === 'building') {
      ctx.strokeRect(e.tx * TILE, e.ty * TILE, e.w * TILE, e.h * TILE);
    } else {
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  drawProjectiles(ctx);
  drawParticles(ctx);
  shownB.forEach(b => drawBuildingBar(ctx, b));
  shownG.forEach(b => drawBuildingBar(ctx, b));
  shownU.forEach(u => drawUnitBar(ctx, u));
  ctx.restore();

  ctx.save();
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  // Névoa: imagem de 1 pixel por tile, ampliada com suavização (bordas macias)
  if (gameOptions.fog) drawFog(ctx);
  drawPlacementGhost(ctx);
  ctx.restore();
  if (!gfx.low) drawVignette(ctx);

  // Caixa de seleção
  if (input.dragging) {
    const x = Math.min(input.dragX, input.mouseX), y = Math.min(input.dragY, input.mouseY);
    const w = Math.abs(input.mouseX - input.dragX), h = Math.abs(input.mouseY - input.dragY);
    ctx.fillStyle = 'rgba(125,255,122,0.1)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = '#7dff7a';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
  }
}
