// Entrada: mouse e teclado. Traduz cliques e teclas em seleção, ordens e comandos.

const input = {
  mouseX: 0,
  mouseY: 0,
  inside: false,      // mouse está sobre o canvas
  keys: {},           // teclas pressionadas, por e.code
  leftDown: false,
  dragging: false,    // arrastando caixa de seleção
  dragX: 0,
  dragY: 0,
  minimapDrag: false, // arrastando a câmera pelo minimapa
  hoverEnemy: null,   // inimigo sob o cursor (com unidades selecionadas)
  mode: null,         // null | 'place' (posicionando prédio) | 'amove' (atacar-movendo)
  lastGroup: null,    // último grupo chamado e quando (para centralizar com toque duplo)
  lastGroupTime: 0,
};

// Marcadores de ordem (círculo que some aos poucos)
let orderMarkers = [];
let controlGroups = {}; // '1'..'9' -> ids de unidades

function inWorldView(x, y) {
  return x < camera.w && y >= 0 && y < camera.h;
}

function initInput(canvas) {
  canvas.addEventListener('mousedown', e => {
    initAudio();
    readMouse(canvas, e);
    const mx = input.mouseX, my = input.mouseY;

    if (gameState !== 'playing') {
      if (e.button === 0) uiClick(mx, my, 0);
      return;
    }

    // Painel lateral
    if (mx >= camera.w) {
      if (minimapHit(mx, my)) {
        const w = minimapToWorld(mx, my);
        if (e.button === 0 && input.mode === 'amove') {
          orderAttackMove(getSelected(), w.x, w.y);
          orderMarkers.push({ x: w.x, y: w.y, t: 0, color: '255,176,58' });
          input.mode = null;
          sfx('click');
          unitAck(getSelected(), 'atk');
        } else if (e.button === 0) {
          input.minimapDrag = true;
          centerCameraOn(w.x, w.y);
        } else if (e.button === 2) {
          worldRightClick(w.x, w.y, true);
        }
        return;
      }
      uiClick(mx, my, e.button);
      return;
    }

    if (my < HUD_H) return; // barra superior
    const w = screenToWorld(mx, my);
    if (e.button === 0) {
      if (input.mode === 'place') {
        tryPlace(w.x, w.y);
        return;
      }
      if (input.mode === 'amove') {
        const group = getSelected();
        orderAttackMove(group, w.x, w.y);
        orderMarkers.push({ x: w.x, y: w.y, t: 0, color: '255,176,58' });
        input.mode = null;
        sfx('click');
        unitAck(group, 'atk');
        return;
      }
      input.leftDown = true;
      input.dragX = mx;
      input.dragY = my;
    } else if (e.button === 2) {
      if (input.mode) {
        input.mode = null; // botão direito cancela o modo (o prédio pronto continua pronto)
        return;
      }
      worldRightClick(w.x, w.y, false);
    }
  });

  window.addEventListener('mousemove', e => {
    readMouse(canvas, e);
    if (input.minimapDrag) {
      const w = minimapToWorld(input.mouseX, input.mouseY);
      centerCameraOn(w.x, w.y);
    } else if (input.leftDown && !input.dragging) {
      const d = Math.hypot(input.mouseX - input.dragX, input.mouseY - input.dragY);
      if (d > DRAG_MIN) input.dragging = true;
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button !== 0) return;
    readMouse(canvas, e);
    if (input.leftDown && gameState === 'playing') {
      if (input.dragging) boxSelect(e.shiftKey);
      else clickSelect(e.shiftKey);
    }
    input.leftDown = false;
    input.dragging = false;
    input.minimapDrag = false;
  });

  // Duplo clique: seleciona todas as unidades do mesmo tipo visíveis na tela
  canvas.addEventListener('dblclick', e => {
    if (gameState !== 'playing') return;
    readMouse(canvas, e);
    if (!inWorldView(input.mouseX, input.mouseY)) return;
    const u = unitAtScreen(input.mouseX, input.mouseY, 0);
    if (!u) return;
    units.forEach(o => {
      if (o.team === 0 && o.type === u.type && isPointOnScreen(o.x, o.y)) o.selected = true;
    });
    unitAck([u], 'sel');
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  // Roda do mouse: zoom no ponto do cursor (só sobre o mapa)
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    readMouse(canvas, e);
    if (!inWorldView(input.mouseX, input.mouseY)) return;
    setZoom(camera.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), input.mouseX, input.mouseY);
  }, { passive: false });
  canvas.addEventListener('mouseenter', () => { input.inside = true; });
  canvas.addEventListener('mouseleave', () => { input.inside = false; });

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', e => { input.keys[e.code] = false; });
  // Ao trocar de janela, solta tudo (evita câmera "presa" rolando)
  window.addEventListener('blur', () => {
    input.keys = {};
    input.inside = false;
  });
}

function onKeyDown(e) {
  input.keys[e.code] = true;
  if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  initAudio();

  // F9 troca o modo gráfico (Premium / Clássico / Leve) em qualquer tela
  if (e.code === 'F9') { e.preventDefault(); cycleGraphicsMode(); return; }

  if (gameState === 'title') {
    if (e.code === 'Enter') newGame({ aiSeed: freshSeed() });
    return;
  }
  if (e.code === 'KeyP' || e.code === 'Pause') {
    if (gameState === 'playing' || gameState === 'paused') setPaused(gameState === 'playing');
    return;
  }
  if (gameState === 'paused') {
    if (e.code === 'Escape') setPaused(false);
    return;
  }
  if (gameState !== 'playing') return;

  const sel = getSelected();
  const digit = e.code.startsWith('Digit') ? e.code.slice(5) : null;

  if (e.code === 'Escape') {
    if (input.mode) input.mode = null;
    else if (sel.length || buildings.some(b => b.selected)) clearSelection();
    else setPaused(true);
  } else if (e.code === 'KeyA') {
    if (sel.some(hasWeapon)) input.mode = 'amove';
  } else if (e.code === 'KeyS') {
    orderStop(sel);
  } else if (e.code === 'KeyH') {
    const hq = teamBuildings(0, 'hq')[0] || teamBuildings(0)[0] || units.find(u => u.team === 0);
    if (hq) centerCameraOn(hq.x, hq.y);
  } else if (e.code === 'Space') {
    if (lastAlertPos) centerCameraOn(lastAlertPos.x, lastAlertPos.y);
  } else if (e.code === 'KeyM') {
    notify(toggleMute() ? 'Som desligado' : 'Som ligado');
  } else if (e.code === 'KeyN') {
    notify(toggleMusic() ? 'Música ligada' : 'Música desligada');
  } else if (e.code === 'KeyR') {
    const b = buildings.find(x => x.selected && x.team === 0);
    if (b) { b.repairing = !b.repairing; if (b.repairing) { sfx('repair', b.x, b.y); announce('reparando'); } }
  } else if (e.code === 'Delete' || e.code === 'KeyV') {
    trySell(buildings.find(x => x.selected && x.team === 0));
  } else if (digit && digit !== '0') {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!sel.length) return; // sem seleção não apaga o grupo
      controlGroups[digit] = sel.map(u => u.id);
      if (sel.length) notify('Grupo ' + digit + ': ' + sel.length + ' unidades');
    } else {
      selectGroup(digit);
    }
  }
}

function selectGroup(key) {
  const ids = controlGroups[key];
  if (!ids) return;
  const list = ids.map(id => units.find(u => u.id === id)).filter(u => u && u.hp > 0);
  controlGroups[key] = list.map(u => u.id);
  if (list.length === 0) return;
  clearSelection();
  list.forEach(u => { u.selected = true; });
  sfx('select');
  unitAck(list, 'sel');
  const now = performance.now();
  if (input.lastGroup === key && now - input.lastGroupTime < 400) {
    const cx = list.reduce((s, u) => s + u.x, 0) / list.length;
    const cy = list.reduce((s, u) => s + u.y, 0) / list.length;
    centerCameraOn(cx, cy);
  }
  input.lastGroup = key;
  input.lastGroupTime = now;
}

function setPaused(on) {
  gameState = on ? 'paused' : 'playing';
  simAccum = 0;
}

function readMouse(canvas, e) {
  const r = canvas.getBoundingClientRect();
  input.mouseX = (e.clientX - r.left) / uiScale; // px lógicos (ver uiScale em main.js)
  input.mouseY = (e.clientY - r.top) / uiScale;
  input.inside = input.mouseX >= 0 && input.mouseY >= 0 &&
    input.mouseX < viewW && input.mouseY < viewH;
}

// Unidade sob o cursor. "team" = 0 só do jogador, 1 só inimigas (e visíveis).
// Se houver várias, fica a mais próxima do cursor.
function unitAtScreen(sx, sy, team) {
  const w = screenToWorld(sx, sy);
  let best = null, bestD = Infinity;
  units.forEach(u => {
    if (u.team !== team || !isVisibleToPlayer(u)) return;
    let d = Math.hypot(u.x - w.x, u.y - w.y);
    // No Premium o corpo da unidade aparece K·altura px acima do chão: vale clicar nele também
    if (premiumActive()) d = Math.min(d, Math.hypot(u.x - w.x, u.y - PREMIUM_K * entityMidZ(u) - w.y));
    if (premiumActive()) {
      // No Premium os modelos são maiores que o círculo de colisão (a infantaria é um esquadrão):
      // vale o mais perto em relação ao próprio tamanho; "o desenhado na frente" só desempata
      const vr = u.radius * UNIT_VIS_SCALE * (u.type === 'trooper' || u.type === 'rocketeer' ? 1.6 : 1) + 4;
      const sc = d / vr;
      if (sc <= 1 && (!best || sc < bestD - 0.15 || (Math.abs(sc - bestD) <= 0.15 && u.y > best.y))) { best = u; bestD = sc; }
    } else if (d <= u.radius + 4 && d < bestD) { best = u; bestD = d; }
  });
  return best;
}

// Prédio cujo retângulo contém o ponto do mundo
function buildingAt(wx, wy) {
  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  const hit = buildings.find(b => b.hp > 0 && tx >= b.tx && ty >= b.ty && tx < b.tx + b.w && ty < b.ty + b.h &&
    isExploredByPlayer(b));
  if (hit || !premiumActive()) return hit || null;
  // No Premium o prédio sobe na tela: a parte de cima dele fica acima da área que ele ocupa no chão
  return buildings.find(b => b.hp > 0 && tx >= b.tx && tx < b.tx + b.w && isExploredByPlayer(b) &&
    wy < b.ty * TILE && wy >= b.ty * TILE - PREMIUM_K * (BUILDING_HEIGHT[b.type] || 20) * 0.45) || null;
}

// Inimigo clicado: só para ver tipo e vida no painel (não dá para dar ordens a ele)
let inspected = null;

function clickSelect(add) {
  if (!inWorldView(input.mouseX, input.mouseY)) return;
  inspected = null;
  const u = unitAtScreen(input.mouseX, input.mouseY, 0);
  if (add) {
    if (u) {
      buildings.forEach(b => { b.selected = false; });
      u.selected = !u.selected;
    }
    return;
  }
  clearSelection();
  if (u) {
    u.selected = true;
    sfx('select');
    unitAck([u], 'sel');
    return;
  }
  const w = screenToWorld(input.mouseX, input.mouseY);
  const b = buildingAt(w.x, w.y);
  if (b && b.team === 0) b.selected = true;
  else inspected = unitAtScreen(input.mouseX, input.mouseY, 1) || b;
}

function boxSelect(add) {
  const a = screenToWorld(input.dragX, input.dragY);
  const b = screenToWorld(clamp(input.mouseX, 0, camera.w), clamp(input.mouseY, HUD_H, camera.h));
  const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
  const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
  if (!add) clearSelection();
  inspected = null;
  buildings.forEach(bb => { bb.selected = false; });
  // No Premium o corpo aparece K·altura acima do chão: a caixa vale tanto para o chão quanto para o corpo
  const lift = u => premiumActive() ? PREMIUM_K * entityMidZ(u) : 0;
  const inBox = units.filter(u => u.team === 0 &&
    u.x + u.radius >= x0 && u.x - u.radius <= x1 && u.y + u.radius >= y0 && u.y - lift(u) - u.radius <= y1);
  // Se a caixa pegou unidades de combate, os coletores ficam de fora
  const fighters = inBox.filter(hasWeapon);
  const picked = fighters.length ? fighters : inBox;
  picked.forEach(u => { u.selected = true; });
  if (picked.length) { sfx('select'); unitAck(picked, 'sel'); }
}

// Clique direito no mundo (ou no minimapa): a ordem depende do que está embaixo.
function worldRightClick(wx, wy, fromMinimap) {
  const group = getSelected();
  const selB = buildings.find(b => b.selected && b.team === 0);

  if (group.length === 0) {
    // Prédio produtor selecionado: define o ponto de encontro
    if (selB && (selB.type === 'factory' || selB.type === 'barracks')) {
      selB.rally = { x: wx, y: wy };
      orderMarkers.push({ x: wx, y: wy, t: 0 });
      sfx('click');
      announce('encontro');
    }
    return;
  }

  const harvesters = group.filter(u => u.type === 'harvester');
  const others = group.filter(u => u.type !== 'harvester');

  if (!fromMinimap) {
    const s = worldToScreen(wx, wy);
    const enemy = unitAtScreen(s.x, s.y, 1) || enemyBuildingAt(wx, wy);
    if (enemy && others.length) {
      orderAttack(others, enemy);
      orderMarkers.push({ x: enemy.x, y: enemy.y, t: 0, color: '255,80,60' });
      sfx('click');
      unitAck(others, 'atk');
      return;
    }
    const b = buildingAt(wx, wy);
    if (b && b.team === 0 && b.type === 'refinery' && harvesters.length) {
      orderReturn(harvesters, b);
      if (others.length) orderMove(others, wx, wy);
      orderMarkers.push({ x: b.x, y: b.y, t: 0 });
      sfx('click');
      unitAck(others.length ? others : harvesters, 'mov');
      return;
    }
  }

  const tx = Math.floor(wx / TILE), ty = Math.floor(wy / TILE);
  if (harvesters.length && isCrystal(gameMap, tx, ty) && tileExplored(tx, ty)) {
    orderHarvest(harvesters, tx, ty);
    if (others.length) orderMove(others, wx, wy);
    orderMarkers.push({ x: wx, y: wy, t: 0, color: '79,214,196' });
    sfx('click');
    unitAck(harvesters, 'mov');
    return;
  }

  orderMove(group, wx, wy);
  orderMarkers.push({ x: wx, y: wy, t: 0 });
  sfx('click');
  unitAck(group, 'mov');
}

function enemyBuildingAt(wx, wy) {
  const b = buildingAt(wx, wy);
  return b && b.team !== 0 ? b : null;
}

// Canto superior esquerdo do prédio a posicionar, centralizado no mouse
function placementSpot(def) {
  const w = screenToWorld(input.mouseX, input.mouseY);
  return {
    x: Math.floor(w.x / TILE - def.w / 2 + 0.5),
    y: Math.floor(w.y / TILE - def.h / 2 + 0.5),
  };
}

function tryPlace() {
  const c = teams[0].construct;
  if (!c || !c.ready) {
    input.mode = null;
    return;
  }
  const spot = placementSpot(BUILDING_TYPES[c.type]);
  const check = checkPlacement(0, c.type, spot.x, spot.y);
  if (!check.ok) {
    notify(check.reason, '#ff9a7a');
    sfx('error');
    announce('local_invalido');
    return;
  }
  placeConstruction(0, spot.x, spot.y);
  input.mode = null;
}

// Ajusta o cursor a cada quadro conforme o que está embaixo do mouse.
function updateCursor(canvas) {
  input.hoverEnemy = null;
  let cursor = 'default';
  if (gameState === 'playing' && input.inside && !input.dragging && inWorldView(input.mouseX, input.mouseY)) {
    cursor = 'crosshair';
    if (input.mode === 'place' || input.mode === 'amove') {
      cursor = input.mode === 'place' ? 'default' : 'none';
    } else {
      const hasSel = units.some(u => u.selected && hasWeapon(u));
      const w = screenToWorld(input.mouseX, input.mouseY);
      const enemy = hasSel ? (unitAtScreen(input.mouseX, input.mouseY, 1) || enemyBuildingAt(w.x, w.y)) : null;
      if (enemy) {
        input.hoverEnemy = enemy;
        cursor = 'none'; // a mira vermelha é desenhada em ui.js
      } else if (unitAtScreen(input.mouseX, input.mouseY, 0) || (buildingAt(w.x, w.y) || {}).team === 0) {
        cursor = 'pointer';
      }
    }
  } else if (input.inside && uiHover) {
    cursor = 'pointer';
  }
  if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
}
