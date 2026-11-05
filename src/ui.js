// Interface: painel lateral (créditos, minimapa, energia, botões de construção),
// barra superior, mensagens, dicas e telas de título, pausa e fim de partida.
// Tudo desenhado no canvas; os cliques são conferidos contra "uiHits".

let uiHits = [];      // áreas clicáveis do quadro atual { x, y, w, h, act, arg }
let messages = [];    // avisos na tela { text, color, t }
let uiHover = null;   // área sob o mouse (para destaque e dica)
let uiClock = 0;      // relógio dos avisos em ms: anda em tempo real, mas para na pausa

const UI_FONT = 'system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const PANEL_BG = '#15181d';
const PANEL_EDGE = '#2b3038';
const TEXT = '#e8e2d0';
const TEXT_DIM = '#8f8a7c';
const ACCENT = '#4fd6c4';

// Aviso na tela. kind 'alert' fica mais tempo e aparece sempre no topo.
// Avisos iguais se juntam ("Blindado pronto x3") em vez de empilhar.
function notify(text, color, kind) {
  const now = uiClock;
  const same = messages.find(m => m.text === text && now - m.t < 6000);
  if (same) {
    same.count++;
    same.t = now;
    return;
  }
  messages.push({ text, color: color || TEXT, t: now, kind: kind || 'info', count: 1 });
  if (messages.length > 8) messages.shift();
}

function addHit(x, y, w, h, act, arg, tip) {
  uiHits.push({ x, y, w, h, act, arg, tip });
}

function hitAt(mx, my) {
  for (let i = uiHits.length - 1; i >= 0; i--) {
    const h = uiHits[i];
    if (mx >= h.x && my >= h.y && mx < h.x + h.w && my < h.y + h.h) return h;
  }
  return null;
}

// Minimapa encolhe em telas baixas para os botões caberem
function minimapSize() {
  return clamp(camera.h - 420, 110, MINIMAP_MAX);
}

function minimapRect() {
  const s = minimapSize();
  return { x: camera.w + 10 + (MINIMAP_MAX - s) / 2, y: 34, w: s, h: s };
}

function minimapHit(sx, sy) {
  const r = minimapRect();
  return sx >= r.x && sy >= r.y && sx < r.x + r.w && sy < r.y + r.h;
}

function minimapToWorld(sx, sy) {
  const r = minimapRect();
  return {
    x: clamp((sx - r.x) / r.w * MAP_W, 0, MAP_W) * TILE,
    y: clamp((sy - r.y) / r.h * MAP_H, 0, MAP_H) * TILE,
  };
}

function formatTime(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return m + ':' + String(r).padStart(2, '0');
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.font = (weight || '') + ' ' + size + 'px ' + UI_FONT;
  ctx.fillStyle = color || TEXT;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

// Painel arredondado com degradê (vidro escuro) e borda
function panel(ctx, x, y, w, h, opts = {}) {
  const r = opts.r === undefined ? 6 : opts.r;
  rrect(ctx, x, y, w, h, r);
  const top = opts.top || 'rgba(34,40,50,0.94)', bottom = opts.bottom || 'rgba(16,19,24,0.94)';
  const gr = ctx.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bottom);
  ctx.fillStyle = gr;
  ctx.fill();
  if (opts.glow) {
    ctx.save();
    ctx.shadowColor = opts.glow;
    ctx.shadowBlur = 12;
    ctx.strokeStyle = opts.edge || opts.glow;
    ctx.lineWidth = opts.lw || 1.5;
    rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();
    ctx.restore();
  } else {
    ctx.strokeStyle = opts.edge || 'rgba(255,255,255,0.09)';
    ctx.lineWidth = opts.lw || 1;
    rrect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r);
    ctx.stroke();
  }
  // Filete de luz no topo
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, y + 1.5);
  ctx.lineTo(x + w - r, y + 1.5);
  ctx.stroke();
}

// Botão arredondado; "active" destaca como selecionado
function button(ctx, x, y, w, h, label, act, arg, opts = {}) {
  const hover = uiHover && uiHover.act === act && uiHover.arg === arg;
  if (opts.active) panel(ctx, x, y, w, h, { top: 'rgba(40,110,102,0.95)', bottom: 'rgba(22,62,60,0.95)', glow: 'rgba(79,214,196,0.8)', edge: ACCENT });
  else if (opts.primary) panel(ctx, x, y, w, h, { top: hover ? '#3f8f5a' : '#2f7a4a', bottom: hover ? '#1f5a36' : '#1a4a2c', glow: hover ? 'rgba(150,255,170,0.9)' : 'rgba(120,230,140,0.5)', edge: '#8cf0a0' });
  else panel(ctx, x, y, w, h, { top: hover ? 'rgba(52,62,78,0.96)' : 'rgba(36,42,52,0.94)', bottom: hover ? 'rgba(30,36,46,0.96)' : 'rgba(20,24,30,0.94)', edge: hover ? 'rgba(160,180,210,0.45)' : undefined });
  text(ctx, label, x + w / 2, y + h / 2 + 0.5, opts.size || 14, opts.color || TEXT, '600', 'center');
  addHit(x, y, w, h, act, arg, opts.tip);
}

// Ícone pequeno de unidade ou prédio para os botões
function drawIcon(ctx, kind, type, x, y, size, team) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  const bg = ctx.createRadialGradient(x + size * 0.4, y + size * 0.35, 1, x + size / 2, y + size / 2, size * 0.8);
  bg.addColorStop(0, '#3a4350');
  bg.addColorStop(1, '#161a20');
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, size, size);
  const c = TEAMS[team];
  if (kind === 'unit') {
    ctx.translate(x + size / 2, y + size / 2);
    const k = size / (UNIT_TYPES[type].radius * 2 + 14);
    ctx.scale(k * 1.2, k * 1.2);
    ctx.rotate(-Math.PI / 4);
    drawUnitBody(ctx, type, c, null);
  } else {
    const def = BUILDING_TYPES[type];
    const big = Math.max(def.w, def.h) * TILE;
    const k = (size - 4) / big;
    ctx.translate(x + 2 + (big - def.w * TILE) * k / 2, y + 2 + (big - def.h * TILE) * k / 2);
    ctx.scale(k, k);
    drawBuildingBody(ctx, { type, turret: -Math.PI / 4 }, c, def.w * TILE, def.h * TILE);
  }
  ctx.restore();
}

// ---------- Painel lateral ----------

function sidebarLayout() {
  const x0 = camera.w;
  const top = 34 + minimapSize() + 44;
  const rows = 6;
  const free = camera.h - top - 100;
  const rowH = clamp(Math.floor(free / rows) - 4, 26, 54);
  return { x0, top, rowH };
}

function drawSidebar(ctx) {
  const t = teams[0];
  const { x0, top, rowH } = sidebarLayout();
  const bg = ctx.createLinearGradient(x0, 0, x0 + SIDEBAR_W, 0);
  bg.addColorStop(0, '#11151b');
  bg.addColorStop(1, '#191e26');
  ctx.fillStyle = bg;
  ctx.fillRect(x0, 0, SIDEBAR_W, camera.h);
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x0, 0, 1, camera.h);
  ctx.fillStyle = 'rgba(120,200,230,0.18)';
  ctx.fillRect(x0 + 1, 0, 1, camera.h);

  // Créditos: cristal brilhante e número
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, 'teal', x0 + 18, 17, 13, 0.35 + Math.sin(performance.now() / 600) * 0.1);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.moveTo(x0 + 18, 7); ctx.lineTo(x0 + 24, 17); ctx.lineTo(x0 + 18, 27); ctx.lineTo(x0 + 12, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8fffa';
  ctx.beginPath();
  ctx.moveTo(x0 + 18, 7); ctx.lineTo(x0 + 12, 17); ctx.lineTo(x0 + 17, 17);
  ctx.closePath();
  ctx.fill();
  text(ctx, Math.floor(t.credits).toLocaleString('pt-BR'), x0 + 32, 17, 19, '#bff8ef', '700');
  text(ctx, 'créditos', x0 + SIDEBAR_W - 10, 18, 11, TEXT_DIM, '', 'right');

  drawMinimap(ctx);

  // Energia: barra de consumo sobre a geração
  const py = 34 + minimapSize() + 10;
  const low = t.powerUse > t.powerOut;
  text(ctx, 'Energia', x0 + 10, py + 2, 11, TEXT_DIM);
  text(ctx, t.powerUse + ' / ' + t.powerOut, x0 + SIDEBAR_W - 10, py + 2, 11, low ? '#ff7a6a' : '#9be36b', 'bold', 'right');
  const bw = SIDEBAR_W - 20;
  rrect(ctx, x0 + 10, py + 9, bw, 9, 4.5);
  ctx.fillStyle = '#07090c';
  ctx.fill();
  const cap = Math.max(t.powerOut, t.powerUse, 1);
  if (t.powerOut > 0) {
    rrect(ctx, x0 + 10, py + 9, bw * t.powerOut / cap, 9, 4.5);
    ctx.fillStyle = 'rgba(80,140,60,0.55)';
    ctx.fill();
  }
  if (t.powerUse > 0) {
    rrect(ctx, x0 + 11, py + 11, Math.max(5, (bw - 2) * t.powerUse / cap), 5, 2.5);
    const eg = ctx.createLinearGradient(0, py + 11, 0, py + 16);
    eg.addColorStop(0, low ? '#ff8a6a' : '#d4ff9a');
    eg.addColorStop(1, low ? '#c0302a' : '#5fb83a');
    ctx.fillStyle = eg;
    ctx.fill();
  }
  addHit(x0 + 10, py - 4, bw, 22, 'tip', null,
    'Energia: consumo / geração. Se o consumo passar da geração, a produção cai pela metade, as torres atiram devagar e o radar desliga. Construa Usinas.');

  // Cabeçalhos das colunas
  text(ctx, 'PRÉDIOS', x0 + 58, top - 9, 10, TEXT_DIM, '700', 'center');
  text(ctx, 'UNIDADES', x0 + 162, top - 9, 10, TEXT_DIM, '700', 'center');

  BUILD_MENU.forEach((type, i) => drawBuildButton(ctx, type, x0 + 8, top + i * (rowH + 4), 100, rowH));
  UNIT_MENU.forEach((type, i) => drawUnitButton(ctx, type, x0 + 112, top + i * (rowH + 4), 100, rowH));

  drawInfoPanel(ctx, x0, top + BUILD_MENU.length * (rowH + 4) + 6);
}

function drawProductionButton(ctx, x, y, w, h, kind, type, state) {
  const hover = uiHover && uiHover.act === kind && uiHover.arg === type;
  if (state.ready) panel(ctx, x, y, w, h, { r: 5, top: 'rgba(40,90,50,0.95)', bottom: 'rgba(20,50,28,0.95)', glow: 'rgba(125,255,122,0.9)', edge: '#7dff7a' });
  else if (state.locked) panel(ctx, x, y, w, h, { r: 5, top: 'rgba(22,25,30,0.9)', bottom: 'rgba(16,18,22,0.9)', edge: 'rgba(255,255,255,0.05)' });
  else panel(ctx, x, y, w, h, { r: 5, top: hover ? 'rgba(54,64,80,0.97)' : 'rgba(36,42,52,0.95)', bottom: hover ? 'rgba(30,36,46,0.97)' : 'rgba(21,25,31,0.95)', edge: hover ? 'rgba(160,190,220,0.5)' : undefined });
  const icon = Math.min(h - 8, 26);
  ctx.globalAlpha = state.locked ? 0.62 : 1;
  drawIcon(ctx, kind === 'build' ? 'building' : 'unit', type, x + 4, y + (h - icon) / 2, icon, 0);
  const def = kind === 'build' ? BUILDING_TYPES[type] : UNIT_TYPES[type];
  const name = def.name;
  text(ctx, name, x + icon + 6, y + h / 2 - 7, 11, state.locked ? TEXT_DIM : TEXT, '600');
  const price = costOf(0, def);
  if (!state.ready && !(state.waiting && state.progress > 0)) text(ctx, '◆' + price, x + icon + 6, y + h / 2 + 8, 11, teams[0].credits >= price ? ACCENT : '#ff7a6a', '600');
  ctx.globalAlpha = 1;

  if (state.progress > 0 && !state.ready) {
    // Progresso: o botão vai se enchendo de baixo para cima, com uma linha brilhante na frente
    ctx.save();
    rrect(ctx, x, y, w, h, 5);
    ctx.clip();
    const py = y + h * (1 - state.progress);
    const pg = ctx.createLinearGradient(0, py, 0, y + h);
    pg.addColorStop(0, state.waiting ? 'rgba(255,120,80,0.35)' : 'rgba(79,214,196,0.35)');
    pg.addColorStop(1, state.waiting ? 'rgba(255,120,80,0.08)' : 'rgba(79,214,196,0.08)');
    ctx.fillStyle = pg;
    ctx.fillRect(x, py, w, h * state.progress);
    ctx.fillStyle = state.waiting ? 'rgba(255,150,110,0.9)' : 'rgba(150,255,240,0.9)';
    ctx.fillRect(x, py, w, 1.5);
    ctx.restore();
    // Na linha do preço, à direita (não cobre o nome)
    // Parado por falta de créditos: o aviso ocupa a linha do preço inteira (sem sobrepor números)
    if (state.waiting) text(ctx, 'sem créditos', x + icon + 6, y + h / 2 + 8, 10, '#ff9a7a', '700');
    else text(ctx, Math.floor(state.progress * 100) + '%', x + w - 5, y + h / 2 + 8, 10, '#d8fff8', '700', 'right');
  }
  if (state.ready) {
    const pulse = 0.18 + (Math.sin(performance.now() / 180) + 1) * 0.1;
    ctx.fillStyle = `rgba(125,255,122,${pulse})`;
    rrect(ctx, x, y, w, h, 5);
    ctx.fill();
    text(ctx, 'PRONTO', x + icon + 6, y + h / 2 + 8, 11, '#e0ffe0', '800');
  }
  if (state.count > 1) {
    rrect(ctx, x + w - 22, y + 2, 20, 14, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fill();
    text(ctx, 'x' + state.count, x + w - 12, y + 9.5, 10, TEXT, '700', 'center');
  }
  if (state.locked) text(ctx, '🔒', x + w - 10, y + h / 2 + 8, 10, TEXT_DIM, '', 'center'); // na linha do preço
  addHit(x, y, w, h, kind, type);
}

function drawBuildButton(ctx, type, x, y, w, h) {
  const c = teams[0].construct;
  const mine = c && c.type === type;
  const reason = buildReason(type);
  drawProductionButton(ctx, x, y, w, h, 'build', type, {
    locked: !!reason && !mine,
    progress: mine ? c.progress : 0,
    ready: mine && c.ready,
    waiting: mine && c.waiting,
    count: 0,
  });
}

function drawUnitButton(ctx, type, x, y, w, h) {
  const item = activeItem(0, type);
  drawProductionButton(ctx, x, y, w, h, 'unit', type, {
    locked: !!unitBlockReason(0, type),
    progress: item ? item.progress : 0,
    ready: false,
    waiting: item && item.waiting,
    count: queuedCount(0, type),
  });
}

// Motivo de não poder começar um prédio agora (ignorando "já tem outro em obra")
function buildReason(type) {
  if (!hasBuilding(0, 'hq')) return 'Sem Central';
  const miss = missingReq(0, BUILDING_TYPES[type]);
  return miss ? 'Requer ' + BUILDING_TYPES[miss].name : null;
}

// Painel de informações da seleção (embaixo dos botões)
function drawInfoPanel(ctx, x0, y) {
  const h = camera.h - y - 6;
  if (h < 40) return;
  panel(ctx, x0 + 8, y, SIDEBAR_W - 16, h, { r: 6, top: 'rgba(14,17,22,0.96)', bottom: 'rgba(10,12,16,0.96)' });
  const x = x0 + 16, w = SIDEBAR_W - 32;
  // Nada do painel passa da borda de baixo
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0 + 8, y, SIDEBAR_W - 16, h);
  ctx.clip();
  drawInfoContent(ctx, x, y, w, h);
  ctx.restore();
}

function drawInfoContent(ctx, x, y, w, h) {
  const selB = buildings.find(b => b.selected);
  const selU = getSelected();
  if (selB) {
    const def = BUILDING_TYPES[selB.type];
    text(ctx, def.name, x, y + 12, 13, TEXT, 'bold');
    drawHealthBar(ctx, x, y + 24, w, selB.hp / selB.maxHp);
    text(ctx, Math.ceil(selB.hp) + '/' + selB.maxHp, x + w, y + 12, 10, TEXT_DIM, '', 'right');
    let info = def.power > 0 ? 'Gera ' + def.power + ' de energia' : def.power < 0 ? 'Consome ' + (-def.power) + ' de energia' : '';
    if (selB.type === 'factory' || selB.type === 'barracks') info = 'Botão direito no mapa: encontro';
    if (selB.queue.length) info = 'Fila: ' + UNIT_TYPES[selB.queue[0].type].name + (selB.queue.length > 1 ? ' +' + (selB.queue.length - 1) : '');
    text(ctx, info, x, y + 37, 11, TEXT_DIM);
    if (selB.team === 0 && y + 62 < camera.h) {
      const bw = (w - 6) / 2;
      button(ctx, x, y + 60, bw, 22, selB.repairing ? 'Parar' : 'Reparar', 'repair', selB.id,
        { size: 11, active: selB.repairing, tip: 'Reparar (R): recupera a vida aos poucos, gastando créditos.' });
      if (def.noSell) {
        text(ctx, 'não pode ser vendida', x + bw + 6 + bw / 2, y + 71, 10, TEXT_DIM, '', 'center');
      } else {
        const armed = selB.sellArmed && performance.now() - selB.sellArmed < 3000;
        button(ctx, x + bw + 6, y + 60, bw, 22, armed ? 'Confirmar?' : 'Vender', 'sell', selB.id,
          { size: 11, color: armed ? '#ff9a7a' : TEXT, tip: 'Vender: devolve metade do preço (proporcional à vida). Clique duas vezes (ou V duas vezes) para confirmar.' });
      }
    }
    return;
  }
  if (selU.length === 1) {
    const u = selU[0];
    const def = UNIT_TYPES[u.type];
    text(ctx, def.name, x, y + 12, 13, TEXT, 'bold');
    text(ctx, Math.ceil(u.hp) + '/' + u.maxHp, x + w, y + 12, 10, TEXT_DIM, '', 'right');
    drawHealthBar(ctx, x, y + 24, w, u.hp / u.maxHp);
    if (u.type === 'harvester') {
      const states = { idle: 'procurando cristal', toField: 'indo ao campo', harvest: 'colhendo', toRefinery: 'voltando à refinaria', unload: 'descarregando' };
      text(ctx, 'Carga ' + Math.floor(u.cargo) + '/' + def.capacity, x, y + 38, 10, ACCENT);
      text(ctx, u.manual ? 'parado (volta a colher em 3 s)' : states[u.hstate], x, y + 52, 10, TEXT_DIM);
    } else {
      const status = u.target ? 'atacando' : u.amove ? 'atacando-movendo' : u.path.length ? 'em movimento' : 'parado';
      text(ctx, status, x, y + 38, 10, TEXT_DIM);
      orderButtons(ctx, x, y + 48, w);
      wrapText(ctx, def.desc, x, y + 84, w, 12, 10, TEXT_DIM);
    }
    return;
  }
  if (selU.length > 1) {
    text(ctx, selU.length + ' unidades', x, y + 12, 13, TEXT, 'bold');
    const counts = {};
    selU.forEach(u => { counts[u.type] = (counts[u.type] || 0) + 1; });
    let cx = x;
    Object.keys(counts).forEach(type => {
      if (cx + 36 > x + w + 4) return;
      drawIcon(ctx, 'unit', type, cx, y + 24, 26, 0);
      text(ctx, 'x' + counts[type], cx + 13, y + 58, 10, TEXT, 'bold', 'center');
      cx += 36;
    });
    if (selU.some(hasWeapon)) orderButtons(ctx, x, y + 64, w);
    return;
  }
  if (inspected && inspected.hp > 0 && (inspected.kind === 'building' ? isExploredByPlayer(inspected) : isVisibleToPlayer(inspected))) {
    const def = inspected.kind === 'building' ? BUILDING_TYPES[inspected.type] : UNIT_TYPES[inspected.type];
    text(ctx, def.name, x, y + 12, 13, '#ff9a7a', 'bold');
    text(ctx, Math.ceil(inspected.hp) + '/' + inspected.maxHp, x + w, y + 12, 10, TEXT_DIM, '', 'right');
    drawHealthBar(ctx, x, y + 24, w, inspected.hp / inspected.maxHp);
    text(ctx, 'Inimigo (' + TEAMS[inspected.team].name + ')', x, y + 38, 10, TEXT_DIM);
    wrapText(ctx, def.desc, x, y + 54, w, 12, 10, TEXT_DIM);
    return;
  }
  text(ctx, 'Objetivo', x, y + 12, 11, TEXT_DIM, 'bold');
  wrapText(ctx, currentGoal(), x, y + 28, w, 13, 11, TEXT);
}

// Botões de ordem para as unidades selecionadas (os mesmos das teclas A e S)
function orderButtons(ctx, x, y, w) {
  const bw = (w - 6) / 2;
  button(ctx, x, y, bw + 20, 22, 'Atacar (A)', 'amove', null,
    { size: 11, active: input.mode === 'amove', tip: 'Atacar-movendo (A): clique no destino (mapa ou minimapa). O grupo anda junto e luta com o que encontrar.' });
  button(ctx, x + bw + 26, y, bw - 20, 22, 'Parar (S)', 'stop', null,
    { size: 11, tip: 'Parar (S): larga o caminho e o alvo.' });
}

function wrapText(ctx, str, x, y, maxW, lineH, size, color) {
  ctx.font = size + 'px ' + UI_FONT;
  const words = str.split(' ');
  let line = '';
  let yy = y;
  words.forEach(word => {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxW && line) {
      text(ctx, line, x, yy, size, color);
      line = word;
      yy += lineH;
    } else {
      line = test;
    }
  });
  if (line) text(ctx, line, x, yy, size, color);
}

// Próximo passo sugerido ao jogador
function currentGoal() {
  const t = teams[0];
  if (!hasBuilding(0, 'hq')) return 'Sem Central não dá para construir. Lute com o exército que restou.';
  if (t.construct && t.construct.ready) return 'Clique no botão PRONTO e depois num lugar verde do planalto cinza para colocar o prédio.';
  const goal = nextGoal();
  // O prédio sugerido já está em obra: diga isso, para o jogador não achar que o clique falhou
  if (goal.build && t.construct && t.construct.type === goal.build) {
    const name = BUILDING_TYPES[goal.build].name;
    const def = BUILDING_TYPES[goal.build];
    if (t.construct.waiting) return name + ' ' + genderize(def, 'parad') + ': sem créditos. Espere os Coletores trazerem cristal.';
    return name + ' em construção (' + Math.floor(t.construct.progress * 100) + '%).';
  }
  return goal.text;
}

function nextGoal() {
  const has = type => hasBuilding(0, type);
  if (!has('power')) return { build: 'power', text: 'Construa uma Usina: clique nela no painel PRÉDIOS. Ela gera energia para a base.' };
  if (lowPower(0)) return { build: 'power', text: 'Energia insuficiente! Construa mais Usinas.' };
  if (!has('refinery')) return { build: 'refinery', text: 'Construa uma Refinaria. Ela traz um Coletor que colhe cristal (o dinheiro do jogo).' };
  if (!has('barracks')) return { build: 'barracks', text: 'Construa um Quartel para treinar soldados e liberar a Torre de defesa.' };
  if (!has('factory')) return { build: 'factory', text: 'Construa uma Fábrica para produzir blindados e Coletores.' };
  const harvesters = units.filter(u => u.team === 0 && u.type === 'harvester').length + queuedCount(0, 'harvester');
  if (harvesters < 2) return { text: 'Compre um segundo Coletor na Fábrica: dobra a renda de cristal.' };
  if (teamBuildings(0, 'refinery').length < 2) return { build: 'refinery', text: 'Construa uma 2ª Refinaria (vem com mais um Coletor). Quem colhe mais, monta o exército maior.' };
  if (harvesters < 4) return { text: 'Tenha 4 Coletores (compre na Fábrica). O inimigo também colhe com vários.' };
  if (!has('radar')) return { build: 'radar', text: 'Construa um Radar para ver inimigos no minimapa e liberar o Obuseiro.' };
  const army = units.filter(u => u.team === 0 && hasWeapon(u)).length;
  if (army < 15) return { text: 'Monte um exército misto (Blindados e Foguetes, uns Soldados): ' + army + '/15. Até lá, defenda perto das Torres.' };
  return { text: 'Exército pronto: selecione e ataque com A + clique (o grupo anda junto). A base inimiga fica no canto oposto. Mantenha a produção.' };
}

// Caixa de dica perto do mouse
function drawTooltip(ctx) {
  if (!uiHover) return;
  let lines = null;
  const a = uiHover.act, type = uiHover.arg;
  if (a === 'build') {
    const def = BUILDING_TYPES[type];
    lines = [def.name, '◆' + costOf(0, def) + '   ' + def.build + ' s   ' + (def.power > 0 ? '+' : '') + def.power + ' energia', def.desc];
    const why = buildReason(type);
    if (why) lines.push('⚠ ' + why);
    const c = teams[0].construct;
    if (c && c.type === type) lines.push(c.ready ? 'Clique para posicionar. Botão direito: cancelar.' : c.waiting ? '⚠ Parado: sem créditos. Botão direito: cancelar.' : 'Em construção. Botão direito: cancelar.');
    else if (c) lines.push('Espere a construção atual terminar.');
    else lines.push('Clique para construir.');
  } else if (a === 'unit') {
    const def = UNIT_TYPES[type];
    lines = [def.name, '◆' + costOf(0, def) + '   ' + def.build + ' s   vida ' + def.hp, def.desc];
    const why = unitBlockReason(0, type);
    const item = activeItem(0, type);
    if (why) lines.push('⚠ ' + why);
    else if (item && item.waiting) lines.push('⚠ Parado: sem créditos. Botão direito: tirar da fila.');
    else lines.push('Clique: pôr na fila. Botão direito: tirar da fila.');
  } else if (uiHover.tip) {
    lines = [uiHover.tip];
  }
  if (!lines) return;
  ctx.font = '11px ' + UI_FONT;
  const maxW = 260;
  // Quebra as linhas longas
  const out = [];
  lines.forEach((l, i) => {
    const words = l.split(' ');
    let line = '';
    words.forEach(wd => {
      const test = line ? line + ' ' + wd : wd;
      if (ctx.measureText(test).width > maxW && line) { out.push([line, i]); line = wd; } else line = test;
    });
    out.push([line, i]);
  });
  const w = maxW + 16, h = out.length * 15 + 10;
  // Dica do painel lateral fica à esquerda dele (não cobre os outros botões)
  let x = uiHover.x >= camera.w ? camera.w - w - 8 : uiHover.x - w - 8, y = uiHover.y;
  if (x < 4) x = uiHover.x + uiHover.w + 8;
  if (x + w > viewW) x = viewW - w - 4;
  y = clamp(y, 4, camera.h - h - 4);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 4;
  panel(ctx, x, y, w, h, { r: 6, top: 'rgba(24,29,37,0.97)', bottom: 'rgba(12,14,18,0.97)', edge: 'rgba(120,150,190,0.4)' });
  ctx.restore();
  out.forEach(([l, i], n) => {
    const color = i === 0 ? TEXT : l.startsWith('⚠') ? '#ff9a7a' : i === 1 ? ACCENT : TEXT_DIM;
    text(ctx, l, x + 8, y + 12 + n * 15, 11, color, i === 0 ? 'bold' : '');
  });
}

// ---------- Barra superior e mensagens ----------

function drawHud(ctx) {
  const hg = ctx.createLinearGradient(0, 0, 0, HUD_H);
  hg.addColorStop(0, 'rgba(22,27,35,0.92)');
  hg.addColorStop(1, 'rgba(10,12,16,0.88)');
  ctx.fillStyle = hg;
  ctx.fillRect(0, 0, camera.w, HUD_H);
  ctx.fillStyle = 'rgba(120,200,230,0.16)';
  ctx.fillRect(0, HUD_H - 1, camera.w, 1);
  const f = teams[0].faction;
  rrect(ctx, 8, 8, 12, 12, 3);
  ctx.fillStyle = f.color;
  ctx.fill();
  ctx.strokeStyle = f.light;
  ctx.lineWidth = 1;
  ctx.stroke();
  text(ctx, f.name, 26, HUD_H / 2, 13, TEXT, '700');
  text(ctx, formatTime(gameTime), 200, HUD_H / 2, 13, TEXT_DIM, '600');
  if (lowPower(0) && Math.floor(performance.now() / 500) % 2) {
    text(ctx, '⚡ ENERGIA BAIXA', 270, HUD_H / 2, 13, '#ff7a6a', '800');
  }
  if (camera.w > 900) {
    text(ctx, (muted ? '🔇 ' : '') + 'P: pausa e ajuda   A: atacar-movendo   S: parar   H: base',
      camera.w - 10, HUD_H / 2, 11, TEXT_DIM, '', 'right');
  }
}

function messageLife(m) {
  return m.kind === 'alert' ? 8000 : 4000;
}

function drawMessages(ctx) {
  const now = uiClock;
  messages = messages.filter(m => now - m.t < messageLife(m));
  // Objetivo fixo logo abaixo da barra superior, quando o painel está ocupado com a seleção
  const panelShowsGoal = !buildings.some(b => b.selected) && getSelected().length === 0 && !inspected;
  if (!panelShowsGoal) drawGoalLine(ctx);
  drawMessageList(ctx, now, panelShowsGoal ? HUD_H + 8 : HUD_H + 32);
}

function drawGoalLine(ctx) {
  ctx.font = '12px ' + UI_FONT;
  const goal = 'Objetivo: ' + currentGoal();
  const gw = Math.min(camera.w - 16, ctx.measureText(goal).width + 16);
  rrect(ctx, 8, HUD_H + 6, gw, 20, 4);
  ctx.fillStyle = 'rgba(6,10,14,0.6)';
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.rect(8, HUD_H + 6, gw, 20);
  ctx.clip();
  text(ctx, goal, 16, HUD_H + 16, 12, '#c9e6df');
  ctx.restore();
}

function drawMessageList(ctx, now, top) {
  // Alertas primeiro, depois os demais; no máximo 5 na tela
  // Em telas baixas cabem menos avisos, para não cobrir a base
  const max = camera.h < 560 ? 2 : camera.h < 760 ? 3 : 4;
  const list = messages.filter(m => m.kind === 'alert').concat(messages.filter(m => m.kind !== 'alert')).slice(0, max);
  list.forEach((m, i) => {
    const a = clamp((messageLife(m) - (now - m.t)) / 800, 0, 1);
    const str = m.count > 1 ? m.text + '  x' + m.count : m.text;
    ctx.globalAlpha = a;
    ctx.font = '600 13px ' + UI_FONT;
    const w = ctx.measureText(str).width + 20;
    const y = top + i * 23;
    // Entra deslizando da esquerda
    const slide = Math.min(1, (now - m.t) / 180);
    const x = 8 - (1 - slide) * 30;
    rrect(ctx, x, y, w, 20, 4);
    ctx.fillStyle = m.kind === 'alert' ? 'rgba(96,16,8,0.82)' : 'rgba(8,11,15,0.72)';
    ctx.fill();
    ctx.fillStyle = m.kind === 'alert' ? '#ff6a50' : m.kind === 'ready' ? '#7dff7a' : m.kind === 'unit' ? ACCENT : 'rgba(255,255,255,0.35)';
    ctx.fillRect(x, y + 3, 2.5, 14);
    text(ctx, str, x + 11, y + 10.5, 13, m.color, '600');
    ctx.globalAlpha = 1;
  });
}

// ---------- Telas: título, pausa, fim ----------

function dimScreen(ctx, a) {
  const g = ctx.createRadialGradient(viewW / 2, camera.h * 0.4, 50, viewW / 2, camera.h * 0.5, Math.max(viewW, camera.h) * 0.75);
  g.addColorStop(0, `rgba(8,12,18,${a * 0.85})`);
  g.addColorStop(1, `rgba(2,3,6,${Math.min(1, a * 1.15)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, viewW, camera.h);
}

function drawLogo(ctx, cx, y, size) {
  // Cristal estilizado + nome do jogo
  const t = performance.now() / 1000;
  ctx.globalCompositeOperation = 'lighter';
  drawGlow(ctx, 'teal', cx, y - size * 0.55, size * (1.3 + Math.sin(t * 1.6) * 0.08), 0.55);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.moveTo(cx, y - size * 1.1);
  ctx.lineTo(cx + size * 0.5, y - size * 0.4);
  ctx.lineTo(cx, y);
  ctx.lineTo(cx - size * 0.5, y - size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b8fff4';
  ctx.beginPath();
  ctx.moveTo(cx, y - size * 1.1);
  ctx.lineTo(cx - size * 0.5, y - size * 0.4);
  ctx.lineTo(cx - size * 0.1, y - size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e9fffb';
  ctx.beginPath();
  ctx.moveTo(cx, y - size * 1.1);
  ctx.lineTo(cx - size * 0.12, y - size * 0.6);
  ctx.lineTo(cx, y - size * 0.4);
  ctx.closePath();
  ctx.fill();
  // Título com brilho que passa pelas letras
  ctx.save();
  ctx.font = '800 ' + Math.round(size * 0.78) + 'px ' + UI_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(79,214,196,0.55)';
  ctx.shadowBlur = 18;
  const tw = ctx.measureText('FRONTEIRA CRISTAL').width;
  const sweep = cx - tw / 2 + ((t * 0.25) % 1.6) * tw - tw * 0.3;
  const tg = ctx.createLinearGradient(sweep - 60, 0, sweep + 60, 0);
  tg.addColorStop(0, '#e8e2d0');
  tg.addColorStop(0.5, '#ffffff');
  tg.addColorStop(1, '#e8e2d0');
  ctx.fillStyle = tg;
  ctx.fillText('FRONTEIRA CRISTAL', cx, y + size * 0.55);
  ctx.restore();
}

const CONTROLS_HELP = [
  'Clique esquerdo: selecionar  ·  arrastar: seleção em caixa',
  'Clique direito: mover (atira no caminho) · sobre inimigo: atacar · cristal: colher',
  'A + clique (ou minimapa): atacar-movendo, para e luta  ·  S: parar  ·  H: base  ·  Espaço: último alerta',
  'Ctrl+1..9: criar grupo  ·  1..9: chamar grupo (2x centraliza)',
  'Setas ou mouse na borda: câmera  ·  M: som  ·  N: música  ·  P/Esc: pausa  ·  F9: gráficos',
];

function drawTitle(ctx) {
  const W = viewW, H = camera.h;
  // No Premium a batalha 3D do fundo aparece mais (o texto continua legível sobre o escuro do meio)
  const prem = typeof premiumActive === 'function' && premiumActive();
  dimScreen(ctx, prem ? 0.6 : 0.78);
  const cx = W / 2;
  if (prem) {
    // Faixa escura atrás do menu: o fundo 3D aparece nas laterais, e o texto fica legível
    const g = ctx.createLinearGradient(cx - 470, 0, cx + 470, 0);
    g.addColorStop(0, 'rgba(4,7,12,0)');
    g.addColorStop(0.18, 'rgba(4,7,12,0.55)');
    g.addColorStop(0.82, 'rgba(4,7,12,0.55)');
    g.addColorStop(1, 'rgba(4,7,12,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 470, 0, 940, H);
  }
  const compact = H < 520; // telas baixas: sem a frase e com menos espaço
  let y = compact ? 34 : Math.max(70, H * 0.11);
  drawLogo(ctx, cx, y, compact ? 28 : 40);
  y += compact ? 30 : 46;
  if (!compact) {
    text(ctx, 'Colha cristal, erga sua base e destrua o inimigo.', cx, y, 14, TEXT_DIM, '', 'center');
    y += 32;
  }
  text(ctx, 'ESCOLHA SUA FACÇÃO', cx, y, 12, TEXT_DIM, 'bold', 'center');
  y += 16;
  const cardW = Math.min(220, (W - 60) / 3), cardH = 84, gap = 12;
  const x0 = cx - (cardW * 3 + gap * 2) / 2;
  FACTIONS.forEach((f, i) => {
    const x = x0 + i * (cardW + gap);
    const sel = gameOptions.faction === i;
    const hover = uiHover && uiHover.act === 'faction' && uiHover.arg === i;
    if (sel) panel(ctx, x, y, cardW, cardH, { r: 8, top: rgba(f.color, 0.28), bottom: 'rgba(16,20,26,0.95)', glow: f.color, edge: f.color, lw: 2 });
    else panel(ctx, x, y, cardW, cardH, { r: 8, top: hover ? 'rgba(40,48,60,0.95)' : 'rgba(26,31,39,0.92)', bottom: 'rgba(14,17,22,0.92)', edge: hover ? rgba(f.color, 0.6) : undefined });
    ctx.save();
    ctx.translate(x + 30, y + cardH / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.scale(1.4, 1.4);
    drawTank(ctx, f, 0);
    ctx.restore();
    text(ctx, f.name, x + 58, y + 26, 13, TEXT, 'bold');
    wrapText(ctx, f.bonus, x + 58, y + 46, cardW - 64, 13, 11, f.light);
    addHit(x, y, cardW, cardH, 'faction', i);
  });

  // Linhas de opções: rótulo à esquerda, botões à direita
  const bw = 150, rowX = cx - (bw * 3 + 20) / 2;
  const optionRow = (label, items) => {
    y += compact ? 38 : 44;
    text(ctx, label, rowX - 12, y + 15, 12, TEXT_DIM, 'bold', 'right');
    items.forEach((it, i) => button(ctx, rowX + i * (bw + 10), y, bw, 30, it.label, it.act, it.arg, { active: it.active, size: 13 }));
  };
  y += cardH - 30;
  optionRow('INIMIGO', FACTIONS.map((f, i) => i).filter(i => i !== gameOptions.faction).map(i => ({
    label: FACTIONS[i].name, act: 'enemy', arg: i, active: enemyFaction() === i,
  })));
  optionRow('DIFICULDADE', Object.keys(DIFFICULTIES).map(k => ({
    label: DIFFICULTIES[k].name, act: 'diff', arg: k, active: gameOptions.difficulty === k,
  })));
  optionRow('MAPA', MAPS.map((m, i) => ({ label: m.name, act: 'map', arg: i, active: gameOptions.map === i })));

  y += 52;
  button(ctx, cx - 110, y, 220, 44, 'JOGAR', 'start', null, { size: 19, color: '#eaffea', primary: true });
  graphicsButton(ctx, cx + 126, y + 7, 150, 30);

  y += 66;
  CONTROLS_HELP.slice(0, Math.max(1, Math.floor((H - y) / 18))).forEach((l, i) => text(ctx, l, cx, y + i * 18, 11, typeof premiumActive === 'function' && premiumActive() ? TEXT : TEXT_DIM, '', 'center'));
}

function drawPause(ctx) {
  const W = viewW, H = camera.h;
  dimScreen(ctx, 0.7);
  const cx = W / 2;
  let y = H * 0.22;
  panel(ctx, cx - 330, y - 40, 660, Math.min(H - y + 20, 470), { r: 12, top: 'rgba(24,30,38,0.88)', bottom: 'rgba(10,13,17,0.9)' });
  text(ctx, 'PAUSADO', cx, y, 30, TEXT, '800', 'center');
  y += 50;
  button(ctx, cx - 110, y, 220, 38, 'Continuar', 'resume');
  button(ctx, cx - 110, y + 48, 220, 38, 'Reiniciar partida', 'restart');
  button(ctx, cx - 110, y + 96, 220, 38, 'Menu principal', 'menu');
  graphicsButton(ctx, cx + 126, y + 4, 150, 30);
  y += 170;
  text(ctx, 'CONTROLES', cx, y, 12, TEXT_DIM, 'bold', 'center');
  CONTROLS_HELP.forEach((l, i) => text(ctx, l, cx, y + 24 + i * 18, 11, TEXT, '', 'center'));
  y += 24 + CONTROLS_HELP.length * 18 + 16;
  [
    'Dinheiro vem do cristal: a Refinaria traz um Coletor, que colhe sozinho.',
    'Prédios só no planalto de pedra cinza, perto da sua base.',
    'Soldados vencem soldados; blindados vencem veículos; obuseiros destroem bases de longe.',
  ].forEach((l, i) => text(ctx, l, cx, y + i * 18, 11, TEXT_DIM, '', 'center'));
}

function drawEnd(ctx) {
  const W = viewW, H = camera.h;
  dimScreen(ctx, 0.75);
  const cx = W / 2;
  let y = H < 520 ? 40 : H * 0.2;
  const won = gameState === 'won';
  panel(ctx, cx - 260, y - 46, 520, Math.min(H - (y - 46) - 10, 460), { r: 12, top: 'rgba(24,30,38,0.9)', bottom: 'rgba(10,13,17,0.92)', glow: won ? 'rgba(155,227,107,0.6)' : 'rgba(255,122,106,0.6)' });
  ctx.save();
  ctx.shadowColor = won ? 'rgba(155,227,107,0.8)' : 'rgba(255,122,106,0.8)';
  ctx.shadowBlur = 22;
  text(ctx, won ? 'VITÓRIA' : 'DERROTA', cx, y, 40, won ? '#b6f08a' : '#ff8a7a', '800', 'center');
  ctx.restore();
  y += 40;
  text(ctx, won ? 'A base inimiga caiu. A fronteira é sua.' : 'Sua base foi destruída.', cx, y, 14, TEXT_DIM, '', 'center');
  y += 30;
  text(ctx, 'Tempo de partida: ' + formatTime(gameTime), cx, y, 12, TEXT, '', 'center');
  y += 34;
  const cols = [cx - 150, cx + 40, cx + 150];
  text(ctx, TEAMS[0].name, cols[1], y, 12, TEAMS[0].light, 'bold', 'center');
  text(ctx, TEAMS[1].name, cols[2], y, 12, TEAMS[1].light, 'bold', 'center');
  const rows = [['Produzidos', 'built'], ['Perdidos', 'lost'], ['Destruídos', 'killed'], ['Cristal colhido', 'harvested']];
  rows.forEach(([label, key], i) => {
    const yy = y + 24 + i * 22;
    text(ctx, label, cols[0], yy, 12, TEXT_DIM);
    text(ctx, String(Math.floor(teams[0].stats[key])), cols[1], yy, 12, TEXT, 'bold', 'center');
    text(ctx, String(Math.floor(teams[1].stats[key])), cols[2], yy, 12, TEXT, 'bold', 'center');
  });
  y += 24 + rows.length * 22 + 24;
  // Telas baixas: os dois botões lado a lado
  if (y + 90 > H) {
    button(ctx, cx - 230, y, 220, 40, 'Jogar de novo', 'restart');
    button(ctx, cx + 10, y, 220, 40, 'Menu principal', 'menu');
  } else {
    button(ctx, cx - 110, y, 220, 40, 'Jogar de novo', 'restart');
    button(ctx, cx - 110, y + 50, 220, 40, 'Menu principal', 'menu');
  }
}

// Botão do modo gráfico (Premium / Clássico / Leve)
function graphicsButton(ctx, x, y, w, h) {
  const name = typeof GRAPHICS_NAMES !== 'undefined' ? GRAPHICS_NAMES[graphicsMode] : 'Clássico';
  button(ctx, x, y, w, h, 'Gráficos: ' + name, 'graphics', null, { size: 12 });
}

// Desenha toda a interface por cima do mundo
function renderUI(ctx) {
  uiHits = [];
  if (gameState === 'title') {
    drawTitle(ctx);
  } else {
    drawHud(ctx);
    if (gameState === 'playing') checkBrokeWarning();
    if (gameState !== 'won' && gameState !== 'lost') drawMessages(ctx);
    drawSidebar(ctx);
    if (input.hoverEnemy) drawReticle(ctx, input.mouseX, input.mouseY, '#ff4a3a');
    if (input.mode === 'amove' && input.mouseX < camera.w) drawReticle(ctx, input.mouseX, input.mouseY, '#ffb03a');
    if (gameState === 'paused') drawPause(ctx);
    if (gameState === 'won' || gameState === 'lost') drawEnd(ctx);
  }
  uiHover = input.inside ? hitAt(input.mouseX, input.mouseY) : null;
  if (gameState === 'playing') drawTooltip(ctx);
}

// Venda pede confirmação: o primeiro pedido arma, o segundo (em até 3 s) vende
function trySell(b) {
  if (!b || b.team !== 0 || BUILDING_TYPES[b.type].noSell) return;
  if (!b.sellArmed || performance.now() - b.sellArmed > 3000) {
    b.sellArmed = performance.now();
    notify('Vender ' + BUILDING_TYPES[b.type].name + '? Repita para confirmar.', '#ff9a7a');
    sfx('click');
    return;
  }
  if (sellBuilding(b)) {
    const def = BUILDING_TYPES[b.type];
    notify(def.name + ' ' + genderize(def, 'vendid'));
    sfx('click');
  }
}

// Produção parada por falta de créditos: um aviso, no máximo a cada minuto de jogo
let lastBrokeWarning = -999;
function checkBrokeWarning() {
  const t = teams[0];
  const waiting = (t.construct && t.construct.waiting) ||
    buildings.some(b => b.team === 0 && b.queue.length && b.queue[0].waiting);
  if (!waiting || gameTime - lastBrokeWarning < 60) return;
  lastBrokeWarning = gameTime;
  notify('Sem créditos: a produção está parada. Mais Coletores e Refinarias aumentam a renda.', '#ffcf6a');
}

// Clique numa área da interface. Devolve true se tratou o clique.
function uiClick(mx, my, button) {
  const h = hitAt(mx, my);
  if (!h) return false;
  // Pausado ou na tela de fim, o painel de comando não responde (só os botões da tela)
  if (gameState !== 'playing' && ['build', 'unit', 'repair', 'sell', 'amove', 'stop'].includes(h.act)) return true;
  const t = teams[0];
  switch (h.act) {
    case 'faction': gameOptions.faction = h.arg; sfx('click'); break;
    case 'diff': gameOptions.difficulty = h.arg; sfx('click'); break;
    case 'enemy': gameOptions.enemy = h.arg; sfx('click'); break;
    case 'map': gameOptions.map = h.arg; sfx('click'); newGame({ demo: true }); break;
    case 'start': sfx('click'); newGame({ aiSeed: freshSeed() }); break;
    case 'resume': setPaused(false); break;
    case 'graphics': sfx('click'); cycleGraphicsMode(); break;
    case 'restart': newGame({ aiSeed: freshSeed() }); break;
    case 'menu': sfx('click'); newGame({ demo: true }); break;
    case 'amove': if (getSelected().some(hasWeapon)) input.mode = 'amove'; sfx('click'); break;
    case 'stop': orderStop(getSelected()); sfx('click'); break;
    case 'build': {
      const c = t.construct;
      if (button === 2) {
        if (c && c.type === h.arg) {
          cancelConstruction(0);
          input.mode = null;
          notify('Construção cancelada');
        }
        break;
      }
      const reason = buildReason(h.arg);
      if (c && c.type === h.arg && c.ready) {
        input.mode = 'place';
        sfx('click');
      } else if (reason) {
        notify(reason, '#ff9a7a');
        sfx('error');
      } else if (c && c.ready) {
        notify('Primeiro posicione ' + BUILDING_TYPES[c.type].name + ' (botão PRONTO)', '#ff9a7a');
        sfx('error');
      } else if (!c) {
        const why = startConstruction(0, h.arg);
        if (why) { notify(why, '#ff9a7a'); sfx('error'); } else { sfx('click'); announce('construindo'); }
      } else if (c.type !== h.arg) {
        notify('Espere a construção atual terminar', '#ff9a7a');
        sfx('error');
      }
      break;
    }
    case 'unit': {
      if (button === 2) {
        cancelUnit(0, h.arg);
        break;
      }
      const why = queueUnit(0, h.arg);
      if (why) { notify(why, '#ff9a7a'); sfx('error'); if (why.startsWith('Limite')) announce('limite'); }
      else { sfx('click'); announce('treinando'); }
      break;
    }
    case 'repair': {
      const b = findEntity(h.arg);
      if (b) { b.repairing = !b.repairing; if (b.repairing) { sfx('repair', b.x, b.y); announce('reparando'); } }
      sfx('click');
      break;
    }
    case 'sell': trySell(findEntity(h.arg)); break;
    default:
      return h.act !== 'tip' ? false : true;
  }
  return true;
}
