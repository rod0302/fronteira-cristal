// Geração e consulta do mapa de tiles.

// Gerador pseudo-aleatório com semente (LCG), para o mapa ser sempre igual.
function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Embaralha uma semente: sementes vizinhas (1, 2, 3...) passam a dar sequências sem relação
function mixSeed(n) {
  let h = n >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function smoothStep(t) {
  return t * t * (3 - 2 * t);
}

// Ruído de valor: sorteia números numa grade grossa e interpola suavemente.
// "cell" é o tamanho da célula em tiles (maior = manchas maiores).
function valueNoise(w, h, cell, rng) {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const grid = [];
  for (let i = 0; i < gw * gh; i++) grid.push(rng());

  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const gx = x / cell, gy = y / cell;
      const x0 = Math.floor(gx), y0 = Math.floor(gy);
      const fx = smoothStep(gx - x0), fy = smoothStep(gy - y0);
      const a = grid[y0 * gw + x0], b = grid[y0 * gw + x0 + 1];
      const c = grid[(y0 + 1) * gw + x0], d = grid[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = lerp(lerp(a, b, fx), lerp(c, d, fx), fy);
    }
  }
  return out;
}

function inBounds(map, tx, ty) {
  return tx >= 0 && ty >= 0 && tx < map.w && ty < map.h;
}

function tileAt(map, tx, ty) {
  return map.tiles[ty * map.w + tx];
}

function setTile(map, tx, ty, t) {
  if (inBounds(map, tx, ty)) map.tiles[ty * map.w + tx] = t;
}

// Transitável: dentro do mapa, sem penhasco e sem prédio em cima
function isWalkable(map, tx, ty) {
  if (!inBounds(map, tx, ty)) return false;
  const i = ty * map.w + tx;
  return map.tiles[i] !== TERRAIN.CLIFF && map.occ[i] === 0;
}

// Dá para construir: planalto livre
function isBuildable(map, tx, ty) {
  if (!inBounds(map, tx, ty)) return false;
  const i = ty * map.w + tx;
  return map.tiles[i] === TERRAIN.PLATEAU && map.occ[i] === 0;
}

// Pinta um círculo de terreno. "onlyOver" (opcional) limita a quais tipos substitui.
function stampCircle(map, cx, cy, r, t, onlyOver) {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!inBounds(map, x, y)) continue;
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue;
      if (onlyOver && !onlyOver.includes(tileAt(map, x, y))) continue;
      setTile(map, x, y, t);
    }
  }
}

// Busca em largura a partir de um tile; devolve um array 0/1 de alcançáveis.
function floodReachable(map, sx, sy) {
  const seen = new Uint8Array(map.w * map.h);
  const queue = [sy * map.w + sx];
  seen[queue[0]] = 1;
  for (let i = 0; i < queue.length; i++) {
    const cur = queue[i];
    const cx = cur % map.w, cy = (cur / map.w) | 0;
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of nb) {
      const nx = cx + dx, ny = cy + dy;
      if (!isWalkable(map, nx, ny)) continue;
      const ni = ny * map.w + nx;
      if (seen[ni]) continue;
      seen[ni] = 1;
      queue.push(ni);
    }
  }
  return seen;
}

// Abre um corredor de solo entre dois pontos (usado se as bases ficarem isoladas).
function carveCorridor(map, ax, ay, bx, by) {
  const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
  for (let i = 0; i <= steps; i++) {
    const x = Math.round(lerp(ax, bx, i / steps));
    const y = Math.round(lerp(ay, by, i / steps));
    stampCircle(map, x, y, 1, TERRAIN.GROUND, [TERRAIN.CLIFF]);
  }
}

// Cria o mapa completo: terreno, bases iniciais e campos de cristal.
function createMap(w, h, seed) {
  const rng = makeRng(seed);
  const big = valueNoise(w, h, 12, rng);
  const small = valueNoise(w, h, 4, rng);
  const ore = valueNoise(w, h, 7, rng);

  const map = {
    w, h, seed,
    tiles: new Uint8Array(w * h),
    shade: new Float32Array(w * h),   // variação de cor por tile, só visual
    crystal: new Float32Array(w * h), // quantidade de cristal em cada tile
    occ: new Int32Array(w * h),       // id do prédio que ocupa o tile (0 = livre)
    starts: [{ x: 10, y: 10 }, { x: w - 11, y: h - 11 }],
    dirty: [],                        // tiles que mudaram e precisam ser redesenhados
  };

  // Terreno pela "altitude" do ruído
  for (let i = 0; i < w * h; i++) {
    const e = big[i] * 0.7 + small[i] * 0.3;
    map.shade[i] = small[i] * 0.6 + rng() * 0.4;
    if (e > 0.66) map.tiles[i] = TERRAIN.CLIFF;
    else if (e > 0.55) map.tiles[i] = TERRAIN.PLATEAU;
    else if (ore[i] > 0.68 && e < 0.48) map.tiles[i] = TERRAIN.CRYSTAL;
    else map.tiles[i] = TERRAIN.GROUND;
  }

  // Simetria de ponto: a metade de baixo é a de cima girada 180°, para as bases serem justas
  mirrorMap(map);

  // Campo rico no centro do mapa, disputado pelos dois lados
  const all = [TERRAIN.GROUND, TERRAIN.PLATEAU, TERRAIN.CLIFF];
  stampCircle(map, w >> 1, h >> 1, 4, TERRAIN.CRYSTAL, all);
  stampCircle(map, w >> 1, h >> 1, 6, TERRAIN.GROUND, [TERRAIN.CLIFF]);

  // Bases: área limpa, planalto para construir e dois campos de cristal perto
  map.starts.forEach((s, i) => {
    stampCircle(map, s.x, s.y, 12, TERRAIN.GROUND, [TERRAIN.CLIFF, TERRAIN.CRYSTAL]);
    stampCircle(map, s.x, s.y, 8, TERRAIN.PLATEAU);
    const d = i === 0 ? 1 : -1;
    stampCircle(map, s.x + d * 14, s.y + d * 3, 3, TERRAIN.CRYSTAL, [TERRAIN.GROUND, TERRAIN.CLIFF]);
    stampCircle(map, s.x + d * 3, s.y + d * 14, 3, TERRAIN.CRYSTAL, [TERRAIN.GROUND, TERRAIN.CLIFF]);
  });

  mirrorMap(map);

  // Garante que as duas bases se alcançam por terra
  const a = map.starts[0], b = map.starts[1];
  let reach = floodReachable(map, a.x, a.y);
  if (!reach[b.y * w + b.x]) {
    carveCorridor(map, a.x, a.y, b.x, b.y);
    reach = floodReachable(map, a.x, a.y);
  }

  // Bolsões isolados viram penhasco (evita unidades presas e caminhos impossíveis)
  for (let i = 0; i < w * h; i++) {
    if (!reach[i]) map.tiles[i] = TERRAIN.CLIFF;
  }

  // Quantidade de cristal: 250 a 500 por tile; o centro e os campos da base são mais ricos
  // (todo mapa tem uns 40 mil perto de cada base, para a economia não secar cedo)
  for (let i = 0; i < w * h; i++) {
    if (map.tiles[i] !== TERRAIN.CRYSTAL) continue;
    const x = i % w, y = (i / w) | 0;
    const center = Math.hypot(x - w / 2, y - h / 2) < 5;
    const home = map.starts.some(s => Math.hypot(x - s.x, y - s.y) < 18);
    map.crystal[i] = center ? 600 : home ? 650 : 250 + Math.round(ore[i] * 250);
  }
  mirrorMap(map);

  return map;
}

// Copia a metade de cima (até o meio) para a de baixo, girada 180°
function mirrorMap(map) {
  const n = map.w * map.h;
  for (let i = 0; i < n / 2; i++) {
    const j = n - 1 - i;
    map.tiles[j] = map.tiles[i];
    map.crystal[j] = map.crystal[i];
    map.shade[j] = map.shade[i];
  }
}

// Nível visual do cristal (quantos cristais desenhar no tile)
function crystalLevel(amount) {
  return Math.min(4, Math.ceil(amount / 100));
}

// Tira cristal de um tile. Devolve quanto conseguiu tirar.
// Quando o tile esgota, vira solo comum.
function takeCrystal(map, tx, ty, amount) {
  const i = ty * map.w + tx;
  if (map.tiles[i] !== TERRAIN.CRYSTAL) return 0;
  const before = map.crystal[i];
  const got = Math.min(before, amount);
  map.crystal[i] = before - got;
  if (map.crystal[i] <= 0.01) {
    map.crystal[i] = 0;
    map.tiles[i] = TERRAIN.GROUND;
    map.dirty.push(i);
  } else if (crystalLevel(map.crystal[i]) !== crystalLevel(before)) {
    map.dirty.push(i);
  }
  return got;
}

function isCrystal(map, tx, ty) {
  return inBounds(map, tx, ty) && tileAt(map, tx, ty) === TERRAIN.CRYSTAL;
}

// Procura o tile transitável mais próximo (em anéis crescentes).
// "team" só muda o desempate (o lado espelhado fica com o último empatado, que é o espelho do primeiro)
function nearestWalkable(map, tx, ty, maxR = 12, team) {
  if (isWalkable(map, tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= maxR; r++) {
    let best = null, bestD = Infinity;
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r) continue;
        if (!isWalkable(map, x, y)) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < bestD || (d === bestD && team !== undefined && sideFlip(team))) { bestD = d; best = { x, y }; }
      }
    }
    if (best) return best;
  }
  return null;
}
