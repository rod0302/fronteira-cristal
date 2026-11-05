// Arte do terreno: o mapa inteiro é pintado pixel a pixel uma vez, no começo da partida.
// Bordas orgânicas entre os terrenos, relevo com luz e sombra (luz vindo do noroeste),
// textura por material e uma camada separada de cristais (que se esgotam e são redesenhados).
// Nada aqui mexe na simulação: é só aparência.

let mapCanvas = null;     // terreno pintado (não muda durante a partida)
let terrainBase = null;   // terreno guardado por mapa: { seed, canvas }
let miniCanvas = null;    // minimapa (2 px por tile)
const MINI_SCALE = 2;

// ---------- Ruído ----------

// Textura de ruído de valor que se repete (período "size"), com várias oitavas.
// Fica em cache: as texturas são as mesmas em todas as partidas.
const noiseCache = {};
function noiseTexture(size, cells, seed) {
  const key = size + ':' + cells.join(',') + ':' + seed;
  if (noiseCache[key]) return noiseCache[key];
  const out = new Float32Array(size * size);
  const rng = makeRng(seed);
  let total = 0;
  cells.forEach((cell, oct) => {
    const n = size / cell;
    const grid = new Float32Array(n * n);
    for (let i = 0; i < grid.length; i++) grid[i] = rng();
    const amp = Math.pow(0.55, oct);
    total += amp;
    for (let y = 0; y < size; y++) {
      const gy = y / cell, iy = Math.floor(gy), fy = smoothStep(gy - iy);
      const y0 = (iy % n) * n, y1 = ((iy + 1) % n) * n;
      for (let x = 0; x < size; x++) {
        const gx = x / cell, ix = Math.floor(gx), fx = smoothStep(gx - ix);
        const x0 = ix % n, x1 = (ix + 1) % n;
        const a = grid[y0 + x0], b = grid[y0 + x1], c = grid[y1 + x0], d = grid[y1 + x1];
        out[y * size + x] += amp * ((a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy);
      }
    }
  });
  for (let i = 0; i < out.length; i++) out[i] /= total;
  noiseCache[key] = out;
  return out;
}

// ---------- Paleta dos materiais ----------

// Solo: mistura de capim e terra seca; planalto: pedra; penhasco: rocha escura
const SOIL_A = [86, 108, 56];    // capim
const SOIL_B = [132, 118, 78];   // terra seca
const SOIL_C = [64, 84, 46];     // capim escuro (manchas)
const STONE_A = [136, 132, 124];
const STONE_B = [112, 110, 106];
const ROCK_A = [92, 74, 62];
const ROCK_B = [58, 48, 44];

// Material visual de cada tile: 0 solo (inclui campos de cristal), 1 planalto, 2 penhasco
function tileMaterial(map, x, y) {
  x = clamp(x, 0, map.w - 1);
  y = clamp(y, 0, map.h - 1);
  const t = map.tiles[y * map.w + x];
  return t === TERRAIN.PLATEAU ? 1 : t === TERRAIN.CLIFF ? 2 : 0;
}

// Transição entre tiles: mais curta que a interpolação linear (bordas firmes mas macias)
function edgeCurve(f) {
  const k = clamp((f - 0.5) * 2.6 + 0.5, 0, 1);
  return k * k * (3 - 2 * k);
}

// ---------- Terreno ----------

const FIELD_STEP = 8; // px entre amostras dos campos de material

// Para cada material, quanto de cada ponto da grade (8 px) pertence a ele.
// Interpolação Catmull-Rom dos tiles: passa pelo valor de cada tile no centro (um penhasco
// de um tile só continua visível), arredonda cantos e desfaz os degraus das diagonais.
function materialFields(map) {
  const per = TILE / FIELD_STEP;
  const fw = map.w * per + 1;
  const fields = [new Float32Array(fw * fw), new Float32Array(fw * fw), new Float32Array(fw * fw)];
  const bs = t => { // pesos Catmull-Rom para fração t
    const t2 = t * t, t3 = t2 * t;
    return [(-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2];
  };
  for (let gy = 0; gy < fw; gy++) {
    const v = gy / per - 0.5, iy = Math.floor(v), wy = bs(v - iy);
    for (let gx = 0; gx < fw; gx++) {
      const u = gx / per - 0.5, ix = Math.floor(u), wx = bs(u - ix);
      const j = gy * fw + gx;
      for (let a = 0; a < 4; a++) {
        for (let b = 0; b < 4; b++) {
          fields[tileMaterial(map, ix - 1 + b, iy - 1 + a)][j] += wy[a] * wx[b];
        }
      }
    }
  }
  fields.fw = fw;
  return fields;
}

// Terreno da partida: pintado uma vez por mapa e guardado (os cristais são desenhados ao vivo por cima).
// A pintura pixel a pixel leva quase 1 s, então ela roda num Worker (fora da tela) quando o navegador
// deixa; enquanto isso aparece uma prévia em baixa resolução. Depois de pronto o primeiro mapa,
// os outros são pintados em segundo plano, e trocar de mapa fica instantâneo.
const terrainCache = new Map();  // semente do mapa -> canvas pintado
const terrainPending = new Map(); // semente -> mapa esperando o Worker
let terrainWorker = null;
let terrainWorkerFailed = false;
let terrainReadyCount = 0;        // quantos terrenos completos já ficaram prontos (lido pelos testes)

function buildMapCanvas(map) {
  const cached = terrainCache.get(map.seed);
  if (cached) return cached;
  if (requestTerrain(map)) return terrainPreview(map);
  return finishTerrain(map, terrainPixels(terrainInput(map, 1)));
}

// Dados que a pintura precisa (tudo em arrays simples, para poder ir ao Worker)
function terrainInput(map, sc) {
  const fields = materialFields(map);
  return {
    W: map.w * TILE, H: map.h * TILE, sc,
    fine: noiseTexture(512, [64, 32, 16, 8, 4, 2], 11),
    broad: noiseTexture(512, [256, 128, 64], 23),
    rough: noiseTexture(512, [32, 16, 8, 4], 37),
    f0: fields[0], f1: fields[1], f2: fields[2], FS: FIELD_STEP, FW: fields.fw,
    pal: { SOIL_A, SOIL_B, SOIL_C, STONE_A, STONE_B, ROCK_A, ROCK_B },
  };
}

// Completa o terreno: pixels pintados + pedrinhas, capim e manchas dos campos de cristal
function finishTerrain(map, pixels) {
  const W = map.w * TILE, H = map.h * TILE;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.putImageData(new ImageData(pixels, W, H), 0, 0);
  decorateTerrain(g, map);
  crystalStain(g, map);
  terrainCache.set(map.seed, c);
  terrainReadyCount++;
  return c;
}

// Prévia rápida: a mesma pintura em 1/4 da resolução, ampliada
function terrainPreview(map) {
  const inp = terrainInput(map, 4);
  const w = Math.ceil(inp.W / 4), h = Math.ceil(inp.H / 4);
  const small = document.createElement('canvas');
  small.width = w;
  small.height = h;
  small.getContext('2d').putImageData(new ImageData(terrainPixels(inp), w, h), 0, 0);
  const c = document.createElement('canvas');
  c.width = inp.W;
  c.height = inp.H;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(small, 0, 0, inp.W, inp.H);
  c.preview = true;
  return c;
}

// Pede a pintura ao Worker. Devolve false se não houver Worker (aí pinta na hora).
function requestTerrain(map) {
  if (terrainWorkerFailed || typeof Worker === 'undefined' || typeof Blob === 'undefined') return false;
  if (!terrainWorker) {
    try {
      const src = 'const clamp=(v,a,b)=>v<a?a:v>b?b:v;\n' + terrainPixels.toString() +
        '\nonmessage=e=>{const px=terrainPixels(e.data.inp);postMessage({seed:e.data.seed,px},[px.buffer]);};';
      terrainWorker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      terrainWorker.onmessage = e => {
        const m = terrainPending.get(e.data.seed);
        terrainPending.delete(e.data.seed);
        if (!m) return;
        const c = finishTerrain(m, e.data.px);
        if (gameMap && gameMap.seed === m.seed) mapCanvas = c;
        prepaintOtherMaps();
      };
      terrainWorker.onerror = () => {
        // Worker indisponível (alguns navegadores em file://): pinta o que faltar na hora
        terrainWorkerFailed = true;
        terrainPending.forEach(m => {
          const c = finishTerrain(m, terrainPixels(terrainInput(m, 1)));
          if (gameMap && gameMap.seed === m.seed) mapCanvas = c;
        });
        terrainPending.clear();
      };
    } catch (e) {
      terrainWorkerFailed = true;
      return false;
    }
  }
  if (!terrainPending.has(map.seed)) {
    terrainPending.set(map.seed, map);
    terrainWorker.postMessage({ seed: map.seed, inp: terrainInput(map, 1) });
  }
  return true;
}

// Pinta, um de cada vez, os mapas que ainda não estão guardados
function prepaintOtherMaps() {
  if (terrainPending.size || terrainWorkerFailed) return;
  const next = MAPS.find(m => !terrainCache.has(m.seed));
  if (next) requestTerrain(createMap(MAP_W, MAP_H, next.seed));
}

// Pintura pixel a pixel (função pura: roda também dentro do Worker).
// sc = 1 pinta em resolução cheia; sc = 4 pinta uma prévia com 1/4 dos pixels em cada eixo.
function terrainPixels(inp) {
  const { sc, fine, broad, rough, FS, FW } = inp;
  const fields = [inp.f0, inp.f1, inp.f2];
  const { SOIL_A, SOIL_B, SOIL_C, STONE_A, STONE_B, ROCK_A, ROCK_B } = inp.pal;
  const W = Math.ceil(inp.W / sc), H = Math.ceil(inp.H / sc);
  const WF = inp.W, HF = inp.H;
  const px = new Uint8ClampedArray(W * H * 4);
  const N = 512, M = N - 1;
  const height = new Float32Array(W * H);
  const w = [0, 0, 0];
  // 1ª passada: material (cor) e altura de cada pixel
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      const i = yy * W + xx;
      const x = xx * sc, y = yy * sc;
      // Deformação suave das bordas para nada parecer quadriculado
      const nb = broad[((y >> 1) & M) * N + ((x >> 1) & M)];
      const nb2 = broad[(((y >> 1) + 191) & M) * N + (((x >> 1) + 73) & M)];
      const ne = fine[((y + 300) & M) * N + ((x + 200) & M)];
      // Duas escalas de deformação: curvas largas e reentrâncias menores (bordas menos retas)
      const nm = broad[((y + 41) & M) * N + ((x + 157) & M)];
      const nm2 = broad[((y + 263) & M) * N + ((x + 311) & M)];
      const wx = clamp(x + (nb - 0.5) * 22 + (nm - 0.5) * 18, 0, WF - 1);
      const wy = clamp(y + (nb2 - 0.5) * 22 + (nm2 - 0.5) * 18, 0, HF - 1);
      // Campos suavizados (Catmull-Rom) amostrados numa grade de 8 px
      const gx = wx / FS, gy = wy / FS;
      const ix = Math.min(FW - 2, gx | 0), iy = Math.min(FW - 2, gy | 0);
      const fx = gx - ix, fy = gy - iy;
      const j = iy * FW + ix;
      for (let m = 0; m < 3; m++) {
        const f = fields[m];
        const v = (f[j] * (1 - fx) + f[j + 1] * fx) * (1 - fy) + (f[j + FW] * (1 - fx) + f[j + FW + 1] * fx) * fy;
        // Borda firme com um pouco de ruído
        const k = clamp((v - 0.5 + (ne - 0.5) * 0.25) * 5 + 0.5, 0, 1);
        w[m] = k * k * (3 - 2 * k) + 0.0001;
      }
      const sum = w[0] + w[1] + w[2];
      w[0] /= sum; w[1] /= sum; w[2] /= sum;

      const nf = fine[(y & M) * N + (x & M)];
      const nr = rough[((y + 97) & M) * N + ((x + 31) & M)];
      const grain = (fine[((y * 3 + 5) & M) * N + ((x * 3 + 11) & M)] - 0.5);

      // Solo: capim e terra seca misturados por manchas grandes
      const ms = clamp((nb - 0.35) * 2.2, 0, 1);
      const md = clamp((nf - 0.62) * 4, 0, 1);
      let sr = SOIL_A[0] + (SOIL_B[0] - SOIL_A[0]) * ms, sg = SOIL_A[1] + (SOIL_B[1] - SOIL_A[1]) * ms, sb = SOIL_A[2] + (SOIL_B[2] - SOIL_A[2]) * ms;
      sr += (SOIL_C[0] - sr) * md; sg += (SOIL_C[1] - sg) * md; sb += (SOIL_C[2] - sb) * md;
      // Planalto: placas de pedra com rachaduras finas
      const crack = Math.abs(nr - 0.5) < 0.006 ? 0.86 : 1;
      const mp = clamp((nr - 0.3) * 1.6, 0, 1);
      const pr = (STONE_A[0] + (STONE_B[0] - STONE_A[0]) * mp) * crack;
      const pg = (STONE_A[1] + (STONE_B[1] - STONE_A[1]) * mp) * crack;
      const pb = (STONE_A[2] + (STONE_B[2] - STONE_A[2]) * mp) * crack;
      // Penhasco: rocha com veios
      const mr = clamp(nr * 1.4 - 0.2, 0, 1);
      const rr = ROCK_A[0] + (ROCK_B[0] - ROCK_A[0]) * mr, rg = ROCK_A[1] + (ROCK_B[1] - ROCK_A[1]) * mr, rb = ROCK_A[2] + (ROCK_B[2] - ROCK_A[2]) * mr;

      const g8 = 1 + grain * 0.22;
      const o = i * 4;
      px[o] = (sr * w[0] + pr * w[1] + rr * w[2]) * g8;
      px[o + 1] = (sg * w[0] + pg * w[1] + rg * w[2]) * g8;
      px[o + 2] = (sb * w[0] + pb * w[1] + rb * w[2]) * g8;
      px[o + 3] = 255;
      // Altura: solo baixo e levemente ondulado, planalto com degrau, penhasco alto e rugoso
      const ridge = 1 - Math.abs(nr * 2 - 1);
      height[i] = w[0] * (nb * 3) + w[1] * (9 + nf * 1.2) + w[2] * (24 + ridge * 30 + nf * 10);
    }
  }

  // 2ª passada: luz pelo relevo (noroeste), sombra projetada dos penhascos e oclusão
  const lx = -0.6, ly = -0.6, lz = 0.53;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const hx = height[x < W - 1 ? i + 1 : i] - height[x > 0 ? i - 1 : i];
      const hy = height[y < H - 1 ? i + W : i] - height[y > 0 ? i - W : i];
      // Normal da superfície (escala menor = relevo mais marcado)
      let nx = -hx * 0.35 / sc, ny = -hy * 0.35 / sc, nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const lambert = (nx * lx + ny * ly + nz * lz) / len;
      let light = 0.55 + lambert * 0.75;
      // Sombra projetada: algo mais alto a noroeste encobre este ponto
      const h0 = height[i];
      let shadow = 0;
      const step = Math.max(1, 4 / sc);
      for (let s = step; s <= 16 / sc; s += step) {
        const sx = x - s, sy = y - s;
        if (sx < 0 || sy < 0) break;
        const d = height[sy * W + sx] - h0 - s * sc * 0.9;
        if (d > shadow) shadow = d;
      }
      light *= 1 - Math.min(0.42, shadow * 0.03);
      const o = i * 4;
      px[o] = Math.min(255, px[o] * light);
      px[o + 1] = Math.min(255, px[o + 1] * light);
      px[o + 2] = Math.min(255, px[o + 2] * light);
    }
  }
  return px;
}

// Detalhes desenhados por cima: pedrinhas e tufos de capim no solo, seixos no planalto
function decorateTerrain(g, map) {
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const t = tileAt(map, x, y);
      const rng = makeRng(map.seed * 7 + y * 977 + x * 131);
      const px = x * TILE, py = y * TILE;
      if (t === TERRAIN.GROUND || t === TERRAIN.CRYSTAL) {
        // Tufos de capim
        const n = (rng() * 4) | 0;
        for (let k = 0; k < n; k++) {
          const cx = px + 4 + rng() * (TILE - 8), cy = py + 4 + rng() * (TILE - 8);
          g.strokeStyle = rng() < 0.5 ? 'rgba(150,170,90,0.55)' : 'rgba(40,60,28,0.5)';
          g.lineWidth = 1;
          g.beginPath();
          for (let b = 0; b < 4; b++) {
            const a = -Math.PI / 2 + (rng() - 0.5) * 1.4;
            g.moveTo(cx, cy);
            g.lineTo(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4);
          }
          g.stroke();
        }
        if (rng() < 0.18) pebble(g, px + rng() * TILE, py + rng() * TILE, 1.5 + rng() * 2, [118, 112, 100]);
      } else if (t === TERRAIN.PLATEAU) {
        if (rng() < 0.35) pebble(g, px + rng() * TILE, py + rng() * TILE, 1 + rng() * 2.2, [150, 146, 138]);
      } else if (t === TERRAIN.CLIFF) {
        if (rng() < 0.5) pebble(g, px + rng() * TILE, py + rng() * TILE, 3 + rng() * 5, [104, 86, 74]);
      }
    }
  }
}

// Pedra pequena com luz de cima à esquerda e sombra embaixo à direita
function pebble(g, x, y, r, rgb) {
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.beginPath();
  g.ellipse(x + r * 0.45, y + r * 0.5, r, r * 0.8, 0, 0, Math.PI * 2);
  g.fill();
  const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, `rgb(${rgb[0] + 40},${rgb[1] + 40},${rgb[2] + 40})`);
  gr.addColorStop(1, `rgb(${rgb[0] - 30},${rgb[1] - 30},${rgb[2] - 30})`);
  g.fillStyle = gr;
  g.beginPath();
  g.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2);
  g.fill();
}

// ---------- Cristais ----------

// Chão dos campos de cristal: manchas contínuas de solo cristalizado (sem corredores retos).
// Ficam no terreno mesmo depois que o cristal acaba, como marca do campo.
function crystalStain(g, map) {
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (tileAt(map, x, y) !== TERRAIN.CRYSTAL) continue;
      const rng = makeRng(map.seed * 17 + y * 211 + x * 37);
      const cx = x * TILE + 16 + (rng() - 0.5) * 12, cy = y * TILE + 16 + (rng() - 0.5) * 12, r = 22 + rng() * 10;
      g.fillStyle = radGrad(g, cx, cy, 0, r, [[0, 'rgba(40,150,140,0.22)'], [0.6, 'rgba(40,140,130,0.1)'], [1, 'rgba(40,140,130,0)']]);
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
    }
  }
}

// Aglomerados de cristal prontos (sprites), em variações de forma e três tamanhos
const CRYSTAL_VARIANTS = 12;
function crystalSprite(variant, size) {
  return sprite('cx:' + variant + ':' + size, 30, 30, 15, 20, g => {
    crystalCluster(g, 0, 0, 0.55 + size * 0.18, makeRng(1000 + variant * 7919));
  });
}

// Onde ficam os aglomerados de um tile: posições soltas (passam da borda do tile), tamanho pelo que resta
function crystalSpots(map, x, y) {
  const i = y * map.w + x;
  if (!map.crystalSpots) map.crystalSpots = [];
  let sp = map.crystalSpots[i];
  if (sp) return sp;
  const rng = makeRng(map.seed * 13 + y * 389 + x * 71);
  sp = [];
  for (let k = 0; k < 4; k++) {
    sp.push({ x: x * TILE + 16 + (rng() - 0.5) * 30, y: y * TILE + 18 + (rng() - 0.5) * 28, v: (rng() * CRYSTAL_VARIANTS) | 0, s: rng() });
  }
  sp.sort((a, b) => a.y - b.y);
  map.crystalSpots[i] = sp;
  return sp;
}

// Desenha os cristais visíveis (do fundo para a frente)
// Cristais do mapa. Desenhar cada aglomerado a cada quadro custa caro (centenas de imagens),
// então em zoom normal eles ficam "assados" numa cópia do terreno, refeita só no tile cujo nível
// muda quando é colhido. Com zoom alto (ou tela retina) são desenhados ao vivo, nítidos.
let crystalLayer = null; // { map, base, canvas, dirty: [] }

function crystalsLive() {
  // No modo leve os cristais ficam sempre assados (bem mais barato)
  return !gfx.low && camera.zoom * (typeof pixelRatio === 'number' ? pixelRatio : 1) > 1.55;
}

// Terreno com os cristais por cima (usado no lugar de mapCanvas quando os cristais não são ao vivo)
function terrainWithCrystals() {
  const m = gameMap;
  if (!crystalLayer || crystalLayer.map !== m || crystalLayer.base !== mapCanvas) {
    let c = crystalLayer && crystalLayer.canvas;
    if (!c || c.width !== mapCanvas.width || c.height !== mapCanvas.height) {
      c = document.createElement('canvas');
      c.width = mapCanvas.width;
      c.height = mapCanvas.height;
    }
    const g = c.getContext('2d');
    g.drawImage(mapCanvas, 0, 0);
    drawCrystalTiles(g, 0, 0, m.w - 1, m.h - 1);
    crystalLayer = { map: m, base: mapCanvas, canvas: c, dirty: [] };
  }
  if (crystalLayer.dirty.length) {
    const g = crystalLayer.canvas.getContext('2d');
    crystalLayer.dirty.forEach(i => {
      const x = i % m.w, y = (i / m.w) | 0;
      const rx = (x - 1) * TILE, ry = (y - 1) * TILE, rs = TILE * 3;
      g.save();
      g.beginPath();
      g.rect(rx, ry, rs, rs);
      g.clip();
      g.clearRect(rx, ry, rs, rs);
      g.drawImage(mapCanvas, rx, ry, rs, rs, rx, ry, rs, rs);
      drawCrystalTiles(g, x - 2, y - 2, x + 2, y + 2);
      g.restore();
    });
    crystalLayer.dirty = [];
  }
  return crystalLayer.canvas;
}

function drawCrystals(ctx, x0, y0, x1, y1) {
  if (crystalsLive()) drawCrystalTiles(ctx, x0 - 1, y0 - 1, x1 + 1, y1 + 1);
}

// Desenha os aglomerados de cada tile de cristal da faixa (ao vivo)
function drawCrystalTiles(ctx, x0, y0, x1, y1) {
  const m = gameMap;
  for (let y = Math.max(0, y0); y <= Math.min(m.h - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(m.w - 1, x1); x++) {
      const i = y * m.w + x;
      if (m.tiles[i] !== TERRAIN.CRYSTAL) continue;
      const level = crystalLevel(m.crystal[i]);
      if (level <= 0) continue;
      const sp = crystalSpots(m, x, y);
      for (let k = 0; k < level; k++) {
        const p = sp[k];
        const size = Math.min(2, Math.floor(p.s * 1.5 + (level - 1) * 0.5));
        const s = crystalSprite(p.v, size);
        ctx.drawImage(s.canvas, p.x - s.ox, p.y - s.oy, s.w, s.h);
      }
    }
  }
}

function crystalCluster(g, cx, cy, s, rng) {
  // Sombra no chão
  g.fillStyle = 'rgba(0,20,25,0.35)';
  g.beginPath();
  g.ellipse(cx + 3 * s, cy + 2 * s, 7 * s, 3.2 * s, 0, 0, Math.PI * 2);
  g.fill();
  const n = 2 + ((rng() * 2) | 0);
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k - (n - 1) / 2) * 0.5 + (rng() - 0.5) * 0.3;
    const len = (6 + rng() * 5) * s * (k === 1 ? 1.3 : 1);
    const wid = (3 + rng() * 1.4) * s;
    prism(g, cx + (k - (n - 1) / 2) * 2.2 * s, cy, a, len, wid);
  }
}

// Prisma: duas faces (uma iluminada, outra na sombra), ponta clara e contorno
function prism(g, x, y, a, len, wid) {
  const dx = Math.cos(a), dy = Math.sin(a);
  const nx = -dy, ny = dx;
  const tipX = x + dx * len, tipY = y + dy * len;
  const midX = x + dx * len * 0.72, midY = y + dy * len * 0.72;
  const lx = x + nx * wid, ly = y + ny * wid, rx = x - nx * wid, ry = y - ny * wid;
  const mlx = midX + nx * wid, mly = midY + ny * wid, mrx = midX - nx * wid, mry = midY - ny * wid;
  // Face esquerda (luz)
  let gr = g.createLinearGradient(x, y, tipX, tipY);
  gr.addColorStop(0, '#2aa79a');
  gr.addColorStop(1, '#a8fff2');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(lx, ly); g.lineTo(mlx, mly); g.lineTo(tipX, tipY); g.closePath();
  g.fill();
  // Face direita (sombra)
  gr = g.createLinearGradient(x, y, tipX, tipY);
  gr.addColorStop(0, '#126a68');
  gr.addColorStop(1, '#3fcfc0');
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(rx, ry); g.lineTo(mrx, mry); g.lineTo(tipX, tipY); g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(8,50,52,0.75)';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(lx, ly); g.lineTo(mlx, mly); g.lineTo(tipX, tipY); g.lineTo(mrx, mry); g.lineTo(rx, ry);
  g.stroke();
  // Brilho na aresta
  g.strokeStyle = 'rgba(230,255,252,0.85)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(x + dx * len * 0.2, y + dy * len * 0.2);
  g.lineTo(tipX, tipY);
  g.stroke();
}

// ---------- Minimapa ----------

const MINI_CRYSTAL = '#3fd0bf';

function buildMinimap(map) {
  const c = document.createElement('canvas');
  c.width = map.w * MINI_SCALE;
  c.height = map.h * MINI_SCALE;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.drawImage(mapCanvas, 0, 0, c.width, c.height);
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      if (tileAt(map, x, y) === TERRAIN.CRYSTAL) miniCrystal(g, map, x, y);
    }
  }
  return c;
}

function miniCrystal(g, map, x, y) {
  const lv = crystalLevel(map.crystal[y * map.w + x]);
  g.globalAlpha = 0.45 + lv * 0.14;
  g.fillStyle = MINI_CRYSTAL;
  g.fillRect(x * MINI_SCALE, y * MINI_SCALE, MINI_SCALE, MINI_SCALE);
  g.globalAlpha = 1;
}

// Redesenha os tiles que mudaram (cristal colhido)
function refreshDirtyTiles() {
  if (gameMap.dirty.length === 0) return;
  const mg = miniCanvas.getContext('2d');
  gameMap.dirty.forEach(i => {
    if (crystalLayer && crystalLayer.map === gameMap) crystalLayer.dirty.push(i);
    const x = i % gameMap.w, y = (i / gameMap.w) | 0;
    mg.drawImage(mapCanvas, x * TILE, y * TILE, TILE, TILE, x * MINI_SCALE, y * MINI_SCALE, MINI_SCALE, MINI_SCALE);
    if (tileAt(gameMap, x, y) === TERRAIN.CRYSTAL) miniCrystal(mg, gameMap, x, y);
  });
  gameMap.dirty = [];
}
