// Busca de caminho A* na grade de tiles (8 direções, sem cortar quinas de penhasco).

const PATH_MAX_NODES = 7000; // limite de nós expandidos por busca

// Buffers reaproveitados entre buscas (evita criar arrays grandes a cada chamada).
// "stamp" marca em qual busca o valor de g foi escrito; "closed" idem para nós fechados.
let pathBuf = null;

function getPathBuffers(size) {
  if (!pathBuf || pathBuf.size !== size) {
    pathBuf = {
      size,
      g: new Float32Array(size),
      from: new Int32Array(size),
      stamp: new Uint32Array(size),
      closed: new Uint32Array(size),
      id: 0,
    };
  }
  pathBuf.id++;
  return pathBuf;
}

// Fila de prioridade mínima (heap binário) guardando índices de tile.
function MinHeap() {
  this.ids = [];
  this.pri = [];
}

MinHeap.prototype.size = function () {
  return this.ids.length;
};

MinHeap.prototype.push = function (id, p) {
  const ids = this.ids, pri = this.pri;
  let i = ids.length;
  ids.push(id);
  pri.push(p);
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (pri[parent] <= p) break;
    ids[i] = ids[parent]; pri[i] = pri[parent];
    i = parent;
  }
  ids[i] = id; pri[i] = p;
};

MinHeap.prototype.pop = function () {
  const ids = this.ids, pri = this.pri;
  const top = ids[0];
  const lastId = ids.pop(), lastP = pri.pop();
  const n = ids.length;
  if (n > 0) {
    let i = 0;
    while (true) {
      let c = i * 2 + 1;
      if (c >= n) break;
      if (c + 1 < n && pri[c + 1] < pri[c]) c++;
      if (pri[c] >= lastP) break;
      ids[i] = ids[c]; pri[i] = pri[c];
      i = c;
    }
    ids[i] = lastId; pri[i] = lastP;
  }
  return top;
};

// Distância "octil": custo exato em grade de 8 direções sem obstáculos.
function octile(ax, ay, bx, by) {
  const dx = Math.abs(ax - bx), dy = Math.abs(ay - by);
  return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy);
}

const DIRS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// Quem começa no canto de baixo percorre as direções espelhadas: com o mapa simétrico,
// empates em buscas se resolvem do mesmo jeito para os dois lados
const DIRS8_FLIP = DIRS8.map(([dx, dy]) => [-dx, -dy]);
function sideFlip(team) {
  const s = gameMap && gameMap.starts[team];
  return !!s && s.x > gameMap.w / 2;
}
function dirsFor(team) {
  return sideFlip(team) ? DIRS8_FLIP : DIRS8;
}

// Devolve uma lista de tiles {x, y} do início (exclusive) até o alvo.
// Se o alvo for inalcançável, devolve o caminho até o ponto mais próximo dele.
function findPath(map, sx, sy, tx, ty, team = 0) {
  const goalTile = nearestWalkable(map, tx, ty, 24, team);
  if (!goalTile) return [];
  tx = goalTile.x; ty = goalTile.y;
  if (sx === tx && sy === ty) return [];

  const w = map.w;
  const B = getPathBuffers(map.w * map.h);
  const id = B.id, g = B.g, from = B.from, stamp = B.stamp, closed = B.closed;
  const heap = new MinHeap();
  const start = sy * w + sx, goal = ty * w + tx;

  g[start] = 0;
  stamp[start] = id;
  from[start] = -1;
  heap.push(start, octile(sx, sy, tx, ty));
  let best = start, bestH = Infinity, expanded = 0;

  while (heap.size() > 0) {
    const cur = heap.pop();
    if (closed[cur] === id) continue;
    closed[cur] = id;
    const cx = cur % w, cy = (cur / w) | 0;
    const hc = octile(cx, cy, tx, ty);
    if (hc < bestH) { bestH = hc; best = cur; }
    if (cur === goal || ++expanded > PATH_MAX_NODES) break;

    for (const [dx, dy] of dirsFor(team)) {
      const nx = cx + dx, ny = cy + dy;
      if (!isWalkable(map, nx, ny)) continue;
      // Na diagonal, os dois vizinhos retos precisam estar livres
      if (dx && dy && (!isWalkable(map, cx + dx, cy) || !isWalkable(map, cx, cy + dy))) continue;
      const ni = ny * w + nx;
      if (closed[ni] === id) continue;
      const ng = g[cur] + (dx && dy ? 1.4142 : 1);
      if (stamp[ni] !== id || ng < g[ni]) {
        g[ni] = ng;
        stamp[ni] = id;
        from[ni] = cur;
        heap.push(ni, ng + octile(nx, ny, tx, ty));
      }
    }
  }

  const path = [];
  for (let c = best; c !== start && c !== -1; c = from[c]) {
    path.push({ x: c % w, y: (c / w) | 0 });
  }
  return path.reverse();
}

// Verifica se dá para andar em linha reta entre dois pontos (em px)
// sem encostar em penhasco, considerando a largura da unidade.
function hasLineOfSight(map, ax, ay, bx, by, radius) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1) return true;
  const nx = -dy / len * radius, ny = dx / len * radius; // perpendicular
  const steps = Math.ceil(len / 8);
  for (let i = 0; i <= steps; i++) {
    const px = ax + dx * i / steps, py = ay + dy * i / steps;
    for (const side of [-1, 0, 1]) {
      const sx = px + nx * side, sy = py + ny * side;
      if (!isWalkable(map, Math.floor(sx / TILE), Math.floor(sy / TILE))) return false;
    }
  }
  return true;
}

// Converte o caminho em pontos (px) e remove os desnecessários (atalhos em linha reta).
function smoothPath(map, startX, startY, tiles, radius) {
  const pts = tiles.map(t => ({ x: t.x * TILE + TILE / 2, y: t.y * TILE + TILE / 2 }));
  const out = [];
  let ax = startX, ay = startY, i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !hasLineOfSight(map, ax, ay, pts[j].x, pts[j].y, radius)) j--;
    out.push(pts[j]);
    ax = pts[j].x; ay = pts[j].y;
    i = j + 1;
  }
  return out;
}
