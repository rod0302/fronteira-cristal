// Câmera: qual parte do mapa aparece na área de jogo (tela menos o painel lateral).
// w/h: tamanho da área de jogo na tela (px). zoom: px de tela por px do mundo.
// ww/wh: quanto do mundo cabe na área de jogo (w/h divididos pelo zoom).

const ZOOM_MIN = 0.7, ZOOM_MAX = 1.8;
const camera = {
  x: 0, y: 0, w: 800, h: 600, zoom: 1,
  get ww() { return this.w / this.zoom; },
  get wh() { return this.h / this.zoom; },
};

// Escala da interface conforme a altura da tela (em px CSS): 1 até ~970 px, 1,25 em 1080 p, 1,5 em 1440 p...
function uiScaleFor(screenH) {
  return clamp(Math.round(screenH / 860 * 4) / 4, 1, 2.5);
}

// Menor zoom permitido: nunca mostra mais mundo do que a largura/altura do mapa (sem faixa preta)
function minZoom() {
  return Math.min(1, Math.max(ZOOM_MIN, camera.w / (MAP_W * TILE), (camera.h - HUD_H) / (MAP_H * TILE)));
}

function clampCamera() {
  if (camera.zoom < minZoom()) camera.zoom = minZoom();
  camera.x = clamp(camera.x, 0, Math.max(0, MAP_W * TILE - camera.ww));
  camera.y = clamp(camera.y, -HUD_H / camera.zoom, Math.max(-HUD_H / camera.zoom, MAP_H * TILE - camera.wh));
}

function centerCameraOn(wx, wy) {
  camera.x = wx - camera.ww / 2;
  camera.y = wy - camera.wh / 2;
  clampCamera();
}

// Muda o zoom mantendo fixo o ponto do mundo sob (sx, sy) da tela
function setZoom(z, sx, sy) {
  z = clamp(z, minZoom(), ZOOM_MAX);
  if (Math.abs(z - 1) < 0.04) z = 1; // gruda no 100%
  const before = screenToWorld(sx, sy);
  camera.zoom = z;
  camera.x = before.x - sx / z;
  camera.y = before.y - sy / z;
  clampCamera();
}

function screenToWorld(sx, sy) {
  return { x: sx / camera.zoom + camera.x, y: sy / camera.zoom + camera.y };
}

function worldToScreen(wx, wy) {
  return { x: (wx - camera.x) * camera.zoom, y: (wy - camera.y) * camera.zoom };
}

function isPointOnScreen(wx, wy, margin = 0) {
  return wx >= camera.x - margin && wx <= camera.x + camera.ww + margin &&
    wy >= camera.y - margin && wy <= camera.y + camera.wh + margin;
}

// Move a câmera com as setas e com o mouse na borda da tela.
function updateCamera(dt) {
  let vx = 0, vy = 0;
  const k = input.keys;
  if (k.ArrowLeft) vx -= 1;
  if (k.ArrowRight) vx += 1;
  if (k.ArrowUp) vy -= 1;
  if (k.ArrowDown) vy += 1;

  // Rolagem pela borda só quando não está arrastando uma seleção
  // (só na área do mapa: perto do painel lateral não rola)
  if (input.inside && !input.dragging && !input.minimapDrag && input.mouseX < camera.w) {
    if (input.mouseX < EDGE_SIZE) vx -= 1;
    if (input.mouseX > camera.w - EDGE_SIZE) vx += 1;
    if (input.mouseY < EDGE_SIZE) vy -= 1;
    if (input.mouseY > camera.h - EDGE_SIZE) vy += 1;
  }

  vx = clamp(vx, -1, 1);
  vy = clamp(vy, -1, 1);
  camera.x += vx * CAM_SPEED * dt / camera.zoom;
  camera.y += vy * CAM_SPEED * dt / camera.zoom;
  clampCamera();
}
