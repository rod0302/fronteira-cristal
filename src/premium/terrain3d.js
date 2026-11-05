// Modo Premium: terreno 3D. Relevo, materiais "assados" na GPU, cristais em 3D e água nos cânions.
// O chão por onde as unidades andam fica praticamente plano (no máximo uns 3 px de diferença),
// então o mouse acerta o mesmo lugar que no 2D. Os penhascos (onde ninguém anda) viram
// mesas de rocha com estratos ou cânions com água.

const T3_STEP = 8;                    // px entre vértices do relevo
const T3_BORDER = 128;                // relevo além da borda do mapa (px)
const T3_N = (MAP_W * TILE + T3_BORDER * 2) / T3_STEP + 1; // vértices por lado
const T3_EXTENT = MAP_W * TILE + T3_BORDER * 2;
const WATER_LEVEL = -14;

let t3 = null; // { seed, heights, mesh, chunks, texHeight, texFields, texAlb, texDet, crystals, ... }

// ---------- Ruído em JS (só para montar o relevo) ----------

function t3hash(x, y, s) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function t3noise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = t3hash(ix, iy, s), b = t3hash(ix + 1, iy, s), c = t3hash(ix, iy + 1, s), d = t3hash(ix + 1, iy + 1, s);
  return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy;
}

function t3fbm(x, y, s, oct) {
  let sum = 0, amp = 0.5, tot = 0;
  for (let i = 0; i < (oct || 4); i++) {
    sum += amp * t3noise(x, y, s + i * 31);
    tot += amp;
    x *= 2.03; y *= 2.03; amp *= 0.5;
  }
  return sum / tot;
}

// Desfoque gaussiano separável de um campo (n x n)
function t3blur(src, n, sigma) {
  const r = Math.ceil(sigma * 2.5);
  const k = [];
  let tot = 0;
  for (let i = -r; i <= r; i++) { const v = Math.exp(-i * i / (2 * sigma * sigma)); k.push(v); tot += v; }
  for (let i = 0; i < k.length; i++) k[i] /= tot;
  const tmp = new Float32Array(n * n), out = new Float32Array(n * n);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * src[y * n + clamp(x + i, 0, n - 1)];
      tmp[y * n + x] = s;
    }
  }
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let s = 0;
      for (let i = -r; i <= r; i++) s += k[i + r] * tmp[clamp(y + i, 0, n - 1) * n + x];
      out[y * n + x] = s;
    }
  }
  return out;
}

// ---------- Relevo ----------

function t3tile(map, tx, ty) {
  return map.tiles[clamp(ty, 0, map.h - 1) * map.w + clamp(tx, 0, map.w - 1)];
}

// Monta as alturas a partir dos tiles. Também devolve os campos usados pelos materiais.
function t3buildHeights(map, origTiles) {
  const N = T3_N;
  const cliff = new Float32Array(N * N), plat = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const wx = i * T3_STEP - T3_BORDER, wy = j * T3_STEP - T3_BORDER;
      // O vértice fica na quina de tiles: média dos 4 vizinhos
      let c = 0, p = 0;
      for (let dy = -1; dy <= 0; dy++) for (let dx = -1; dx <= 0; dx++) {
        const tx = Math.floor((wx + dx * 0.5 + 0.25) / TILE), ty = Math.floor((wy + dy * 0.5 + 0.25) / TILE);
        const t = origTiles[clamp(ty, 0, map.h - 1) * map.w + clamp(tx, 0, map.w - 1)];
        if (t === TERRAIN.CLIFF) c += 0.25;
        if (t === TERRAIN.PLATEAU) p += 0.25;
      }
      cliff[j * N + i] = c;
      plat[j * N + i] = p;
    }
  }
  const mC = t3blur(cliff, N, 1.25);   // borda arredondada (~10 px)
  const mC2 = t3blur(cliff, N, 3.5);   // "quão dentro" do penhasco
  const mP = t3blur(plat, N, 0.9);
  const H = new Float32Array(N * N);
  const sel = new Float32Array(N * N);
  const W = MAP_W * TILE, Hh = MAP_H * TILE;
  const seed = map.seed;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const x = i * T3_STEP - T3_BORDER, y = j * T3_STEP - T3_BORDER;
      // Seletor simétrico (o espelho do mapa tem o mesmo relevo): mesa de rocha ou cânion com água
      const s = 0.5 * (t3fbm(x / 520, y / 520, seed, 3) + t3fbm((W - x) / 520, (Hh - y) / 520, seed, 3));
      sel[k] = s;
      const jit = (t3fbm(x / 26, y / 26, seed + 7, 3) - 0.5) * 0.22;
      const edge = clamp((mC[k] + jit - 0.42) / 0.4, 0, 1);
      const e = edge * edge * (3 - 2 * edge);
      const inner = clamp((mC2[k] - 0.55) / 0.4, 0, 1);
      const sym = (fx, fy, sd, o) => 0.5 * (t3fbm(fx(x) , fy(y), sd, o) + t3fbm(fx(W - x), fy(Hh - y), sd, o));
      const big = sym(v => v / 150, v => v / 150, seed + 3, 4);
      const rough = sym(v => v / 16, v => v / 16, seed + 5, 3);
      const mesa = (24 + 30 * big) * e + 22 * inner * big + (rough - 0.5) * 9 * e;
      const canyon = -(34 + 14 * big) * e - 6 * inner + (rough - 0.5) * 5 * e;
      const up = clamp((s - 0.44) / 0.12, 0, 1);
      let h = canyon + (mesa - canyon) * (up * up * (3 - 2 * up));
      // Planalto: degrau baixo de pedra (3 px); solo: ondulação mínima
      const pe = clamp((mP[k] - 0.3) / 0.45, 0, 1);
      h += 3 * pe * pe * (3 - 2 * pe) * (1 - e);
      h += (t3fbm(x / 70, y / 70, seed + 11, 3) - 0.5) * 2.0 * (1 - e);
      H[k] = h;
    }
  }
  // Oclusão do relevo (o quanto o horizonte em volta se ergue): pé de penhasco e fundo de cânion
  const AO = new Uint8Array(N * N);
  const dirs = [];
  for (let d = 0; d < 8; d++) { const a = d * Math.PI / 4 + 0.3; dirs.push([Math.cos(a), Math.sin(a)]); }
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const h0 = H[j * N + i];
      let occ = 0;
      for (const [dx, dy] of dirs) {
        let m = 0;
        for (let st = 1; st <= 6; st++) {
          const r = st * st * 3.5 + 4;
          const ii = clamp(Math.round(i + dx * r / T3_STEP), 0, N - 1), jj = clamp(Math.round(j + dy * r / T3_STEP), 0, N - 1);
          const dh = H[jj * N + ii] - h0;
          if (dh / r > m) m = dh / r;
        }
        occ += m / Math.sqrt(1 + m * m);
      }
      AO[j * N + i] = clamp(1 - occ / 8 * 1.25, 0.25, 1) * 255;
    }
  }
  return { H, mC, mC2, mP, sel, AO };
}

function terrainHeightAt(x, y) {
  if (!t3) return 0;
  const N = T3_N;
  const fx = clamp((x + T3_BORDER) / T3_STEP, 0, N - 1.001), fy = clamp((y + T3_BORDER) / T3_STEP, 0, N - 1.001);
  const i = Math.floor(fx), j = Math.floor(fy);
  const u = fx - i, v = fy - j;
  const H = t3.heights;
  const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], d = H[(j + 1) * N + i + 1];
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

// ---------- Malha ----------

const T3_CHUNK = 32; // quadrados por bloco (cada bloco é desenhado só se estiver à vista)

function t3buildMesh(H) {
  const N = T3_N;
  const pos = new Float32Array(N * N * 6);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const hx = H[j * N + Math.min(N - 1, i + 1)] - H[j * N + Math.max(0, i - 1)];
      const hy = H[Math.min(N - 1, j + 1) * N + i] - H[Math.max(0, j - 1) * N + i];
      const n = v3norm([-hx / (2 * T3_STEP), -hy / (2 * T3_STEP), 1]);
      pos[k * 6] = i * T3_STEP - T3_BORDER;
      pos[k * 6 + 1] = j * T3_STEP - T3_BORDER;
      pos[k * 6 + 2] = H[k];
      pos[k * 6 + 3] = n[0];
      pos[k * 6 + 4] = n[1];
      pos[k * 6 + 5] = n[2];
    }
  }
  const Q = N - 1;
  const idx = new Uint32Array(Q * Q * 6);
  const chunks = [];
  let p = 0;
  for (let cy = 0; cy < Q; cy += T3_CHUNK) {
    for (let cx = 0; cx < Q; cx += T3_CHUNK) {
      const first = p;
      let zmin = 1e9, zmax = -1e9;
      for (let j = cy; j < Math.min(Q, cy + T3_CHUNK); j++) {
        for (let i = cx; i < Math.min(Q, cx + T3_CHUNK); i++) {
          const a = j * N + i, b = a + 1, c = a + N, d = c + 1;
          // Diagonal alternada pela inclinação: menos serrilhado nas encostas
          if (Math.abs(H[a] - H[d]) < Math.abs(H[b] - H[c])) {
            idx[p++] = a; idx[p++] = c; idx[p++] = d;
            idx[p++] = a; idx[p++] = d; idx[p++] = b;
          } else {
            idx[p++] = a; idx[p++] = c; idx[p++] = b;
            idx[p++] = b; idx[p++] = c; idx[p++] = d;
          }
          zmin = Math.min(zmin, H[a], H[d]);
          zmax = Math.max(zmax, H[a], H[d]);
        }
      }
      chunks.push({
        first, count: p - first,
        x0: cx * T3_STEP - T3_BORDER, y0: cy * T3_STEP - T3_BORDER,
        x1: Math.min(Q, cx + T3_CHUNK) * T3_STEP - T3_BORDER, y1: Math.min(Q, cy + T3_CHUNK) * T3_STEP - T3_BORDER,
        zmin, zmax,
      });
    }
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vb = glBuffer(pos);
  glAttrib({ buf: vb, loc: 0, size: 3, stride: 24, off: 0 });
  glAttrib({ buf: vb, loc: 1, size: 3, stride: 24, off: 12 });
  const ib = glBuffer(idx, gl.ELEMENT_ARRAY_BUFFER);
  gl.bindVertexArray(null);
  return { vao, vb, ib, chunks };
}

// ---------- Shaders do terreno ----------

const T3_BAKE_FS = GLSL_NOISE + `
uniform sampler2D uHeight;
uniform sampler2D uFields;
uniform sampler2D uTiles;
uniform vec2 uOrigin;
uniform float uExtent;
uniform float uN;
in vec2 vUv;
layout(location=0) out vec4 oAlb;
layout(location=1) out vec4 oBump;

vec3 C(float r, float g, float b) { return pow(vec3(r, g, b) / 255.0, vec3(2.2)); }
vec3 C(int r, int g, int b) { return C(float(r), float(g), float(b)); }
vec2 huv(vec2 P) { return ((P - uOrigin) / ${T3_STEP.toFixed(1)} + 0.5) / uN; }
float hAt(vec2 P) { return texture(uHeight, huv(P)).r; }

void main() {
  vec2 P = uOrigin + vUv * uExtent;
  vec2 warp = (vec2(fbm3(P * 0.021), fbm3(P * 0.021 + 7.3)) - 0.5) * 18.0;
  float h = hAt(P);
  float hx = hAt(P + vec2(4.0, 0.0)) - hAt(P - vec2(4.0, 0.0));
  float hy = hAt(P + vec2(0.0, 4.0)) - hAt(P - vec2(0.0, 4.0));
  float slope = length(vec2(hx, hy)) / 8.0;
  vec4 F = texture(uFields, huv(P + warp * 0.4));
  vec4 T = texture(uTiles, (P + warp) / ${(TILE * MAP_W).toFixed(1)});
  float bump = 0.0;
  float rough = 0.9;

  // ---- Solo: capim seco, terra, tufos e pedrinhas ----
  float n1 = fbm(P * 0.0032), n2 = fbm(P * 0.011 + 3.1), n3 = fbm(P * 0.045 + 1.7);
  vec3 grass = mix(C(96, 102, 64), C(120, 124, 80), n2);
  vec3 dry = mix(C(140, 120, 88), C(150, 130, 96), n3);
  vec3 soil = mix(C(132, 104, 70), C(108, 84, 58), n3);
  float gm = smoothstep(0.38, 0.62, n1 + (n2 - 0.5) * 0.6 + (vnoise(P * 0.16) - 0.5) * 0.14);
  vec3 ground = mix(soil, mix(dry, grass, smoothstep(0.42, 0.66, n2)), gm);
  float tuft = smoothstep(0.62, 0.86, vnoise(P * 0.42)) * gm * 0.6;
  ground *= 1.0 - tuft * 0.25;
  // Manchas médias de umidade e de terra queimada pelo sol (quebra a planície lisa)
  float pm = fbm3(P * 0.006 + 31.0);
  ground = mix(ground, ground * vec3(0.82, 0.8, 0.78), smoothstep(0.55, 0.75, pm) * 0.6);
  ground = mix(ground, ground * vec3(1.08, 1.02, 0.92), smoothstep(0.4, 0.2, pm) * 0.5);
  // Cascalho fino com relevo
  vec3 cv = voronoi(P * 0.35);
  float grit = smoothstep(0.32, 0.1, cv.x) * step(0.6, cv.z) * (1.0 - gm) * smoothstep(0.55, 0.8, fbm3(P * 0.012 + 2.0));
  ground *= 1.0 - grit * 0.18;
  bump += grit * 0.8;
  bump += tuft * 0.9 + vnoise(P * 0.9) * 0.25;
  vec3 vo = voronoi(P * 0.12);
  float peb = smoothstep(0.3, 0.12, vo.x) * step(0.94, vo.z) * (1.0 - gm * 0.85) * 0.7;
  ground = mix(ground, C(124, 98, 72) * (0.75 + 0.5 * fract(vo.z * 13.0)), peb * 0.8);
  bump += peb * (1.0 - vo.x * 2.5) * 1.4;
  // Trilhas de terra batida (desenho, não regra)
  float trail = smoothstep(0.03, 0.0, abs(fbm(P * 0.0024 + 9.0) - 0.5)) * 0.6;
  ground = mix(ground, C(150, 122, 86), trail * (1.0 - peb));

  // ---- Planalto: laje de arenito escuro e quente, gasta pelo vento, com areia acumulada
  //      nas depressões, fendas raras e finas e cascalho escuro ----
  vec3 sv = voronoi(P * 0.016 + warp * 0.03);
  float crackMask = smoothstep(0.56, 0.74, fbm(P * 0.009 + 3.0));
  float crack = (1.0 - smoothstep(0.002, 0.012, sv.y)) * crackMask * 0.55;
  float fine = abs(fbm(P * 0.05 + 9.0) - 0.5);
  float hair = (1.0 - smoothstep(0.0, 0.012, fine)) * smoothstep(0.55, 0.75, fbm(P * 0.02 + 1.0)) * 0.4;
  float lay = fbm(vec2(P.x * 0.012 + P.y * 0.004, P.y * 0.05) + 6.0);
  // Pedra cinza (o jogo chama de "planalto cinza": tem de se distinguir do chão de terra)
  vec3 stone = mix(C(126, 124, 120), C(100, 100, 100), fbm(P * 0.0055));
  stone = mix(stone, C(138, 130, 118), smoothstep(0.4, 0.7, lay) * 0.45);
  stone *= 0.88 + 0.22 * fbm(P * 0.045 + 2.0);
  stone *= 0.96 + 0.08 * sv.z;
  stone *= 0.95 + 0.1 * vnoise(P * 0.9);
  // Areia nas depressões: suaviza a laje em manchas largas
  float drift = smoothstep(0.5, 0.75, fbm(P * 0.007 + 11.0) + (vnoise(P * 0.08) - 0.5) * 0.25);
  vec3 sandP = mix(C(150, 140, 122), C(134, 126, 112), vnoise(P * 0.05));
  stone = mix(stone, sandP, drift * 0.22);
  // Mais cinza e um pouco fria: o planalto tem de ler como "cinza" sob o sol quente
  stone = mix(vec3(dot(stone, vec3(0.3, 0.55, 0.15))), stone, 0.6) * vec3(0.95, 0.98, 1.04) * 0.78;
  float lichen = smoothstep(0.74, 0.82, fbm(P * 0.04 + 5.0)) * (1.0 - crack) * (1.0 - drift);
  stone = mix(stone, mix(C(140, 118, 66), C(96, 104, 68), step(0.5, sv.z)), lichen * 0.3);
  vec3 gv = voronoi(P * 0.18);
  float grav = smoothstep(0.22, 0.08, gv.x) * step(0.6, gv.z) * (1.0 - drift) * smoothstep(0.5, 0.72, fbm3(P * 0.012 + 4.0));
  stone = mix(stone, C(84, 74, 64) * (0.8 + 0.4 * fract(gv.z * 7.0)), grav * 0.6);
  stone *= 1.0 - crack * (1.0 - drift) * 0.45 - hair * 0.15;
  float pbump = (lay - 0.5) * 1.4 + (sv.z - 0.5) * 0.6 - crack * 1.4 - hair * 0.5 + fbm(P * 0.12) * 0.8
    + vnoise(P * 0.7) * 0.25 + grav * (1.0 - gv.x * 4.0) * 1.2;
  pbump = mix(pbump, fbm(P * 0.25) * 0.4 + vnoise(vec2(P.x * 0.6, P.y * 0.15)) * 0.25, drift);
  float platM = smoothstep(0.45, 0.62, T.r);
  // Borda do planalto: pedras soltas e sombra
  float rim = platM * (1.0 - smoothstep(0.62, 0.9, T.r));

  // ---- Rocha: estratos de arenito, fraturas ----
  float zz = h + fbm(P * 0.025) * 18.0 + fbm(P * 0.09) * 4.0 + P.x * 0.01;
  float band = fract(zz / 8.5);
  vec3 rock = mix(C(170, 102, 66), C(198, 146, 98), smoothstep(0.15, 0.45, band));
  rock = mix(rock, C(126, 74, 52), smoothstep(0.55, 0.85, band));
  rock = mix(rock, C(214, 176, 128), smoothstep(0.9, 0.98, band) * 0.7);
  rock *= 0.82 + 0.32 * fbm(P * 0.06 + 4.0);
  rock = mix(vec3(dot(rock, vec3(0.3, 0.55, 0.15))), rock, 0.8);
  float rvn = abs(fbm(P * 0.028 + vec2(0.0, h * 0.04)) - 0.5);
  float frac2 = (1.0 - smoothstep(0.0, 0.04, rvn)) * 0.8;
  rock *= 1.0 - frac2 * 0.45;
  float rbump = (1.0 - frac2) * 2.2 + band * 1.2 + fbm(P * 0.15) * 1.0;
  // Faixas de arenito só nas encostas; onde é plano, rocha lisa e gasta
  vec3 flatRock = mix(C(132, 102, 78), C(112, 88, 68), fbm(P * 0.03 + 6.0));
  rock = mix(flatRock, mix(flatRock, rock, 0.8), smoothstep(0.3, 0.85, slope));
  // Topo das mesas: cerrado seco sobre a rocha
  vec3 scrub = mix(C(122, 110, 66), C(94, 96, 54), fbm(P * 0.03 + 2.0));
  float top = smoothstep(0.35, 0.12, slope) * smoothstep(8.0, 20.0, h);
  // Topo das mesas: terra escura e cerrado (as faixas de arenito ficam só nas paredes)
  vec3 topEarth = mix(C(112, 86, 62), C(92, 74, 56), fbm(P * 0.05 + 3.0));
  rock = mix(rock, mix(topEarth, scrub, smoothstep(0.35, 0.6, fbm(P * 0.02 + 8.0))), top * 0.92);
  // Cânion: rocha molhada e escura perto da água, areia na margem
  float wet = smoothstep(-2.0, -12.0, h);
  rock = mix(rock, rock * vec3(0.55, 0.52, 0.5), wet);
  vec3 sand = mix(C(170, 150, 108), C(120, 104, 76), smoothstep(-9.0, -14.0, h));
  float shore = smoothstep(-6.0, -10.0, h) * smoothstep(0.5, 0.15, slope);

  // ---- Mistura ----
  float rockM = max(smoothstep(0.18, 0.45, slope), smoothstep(0.45, 0.7, F.r + (T.g - 0.5) * 0.2));
  rockM = max(rockM, smoothstep(5.0, 9.0, h));
  rockM = max(rockM, smoothstep(-2.5, -5.0, h));
  vec3 col = mix(ground, stone, platM);
  bump = mix(bump, pbump, platM);
  rough = mix(0.92, 0.72, platM);
  // Pé do penhasco: cascalho
  float talus = smoothstep(0.15, 0.4, F.r) * (1.0 - rockM);
  vec3 tv = voronoi(P * 0.2);
  col = mix(col, mix(C(140, 110, 84), C(110, 92, 76), tv.z) * (1.1 - tv.x * 0.6), talus * 0.8);
  bump += talus * (1.0 - tv.x * 2.0);
  // Borda do planalto: lábio de pedra clara e um friso escuro logo dentro (limite nítido de onde se constrói)
  float lip = platM * (1.0 - smoothstep(0.5, 0.6, T.r + (vnoise(P * 0.2) - 0.5) * 0.04));
  col = mix(col, col * 0.7, rim * 0.5);
  col = mix(col, C(156, 152, 144), lip * 0.45);
  bump += lip * 1.2;
  col = mix(col, rock, rockM);
  bump = mix(bump, rbump, rockM);
  rough = mix(rough, mix(0.82, 0.35, wet), rockM);
  col = mix(col, sand, shore);
  bump = mix(bump, fbm(P * 0.3) * 0.5, shore);
  // Variação larga de tom (manchas de sol e de umidade)
  col *= 0.9 + 0.2 * fbm(P * 0.0012 + 20.0);
#ifdef MASK
  // Máscara para espalhar capim e pedras (lida pela CPU)
  oAlb = vec4(gm * (1.0 - platM) * (1.0 - rockM) * (1.0 - talus), platM * (1.0 - rockM), rockM, top);
  oBump = vec4(0.0);
#else
  oAlb = vec4(col, rough);
  oBump = vec4(bump, 0.0, 0.0, 1.0);
#endif
}
`;

// Segundo passe: normal fina (do relevo "pintado") e oclusão do relevo
const T3_DETAIL_FS = GLSL_NOISE + `
uniform sampler2D uBump;
uniform sampler2D uHeight;
uniform sampler2D uAO;
uniform vec2 uOrigin;
uniform float uExtent;
uniform float uN;
uniform float uTexel;
in vec2 vUv;
out vec4 oDet;
vec2 huv(vec2 P) { return ((P - uOrigin) / ${T3_STEP.toFixed(1)} + 0.5) / uN; }
float hAt(vec2 P) { return texture(uHeight, huv(P)).r; }
void main() {
  vec2 P = uOrigin + vUv * uExtent;
  float px = uExtent * uTexel;
  float bx = texture(uBump, vUv + vec2(uTexel, 0.0)).r - texture(uBump, vUv - vec2(uTexel, 0.0)).r;
  float by = texture(uBump, vUv + vec2(0.0, uTexel)).r - texture(uBump, vUv - vec2(0.0, uTexel)).r;
  vec3 n = normalize(vec3(-bx / (2.0 * px), -by / (2.0 * px), 1.0));
  float ao = texture(uAO, huv(P)).r;

  // Cavidades do relevo fino também escurecem um pouco
  float b0 = texture(uBump, vUv).r;
  float bavg = 0.25 * (texture(uBump, vUv + vec2(uTexel * 3.0, 0.0)).r + texture(uBump, vUv - vec2(uTexel * 3.0, 0.0)).r +
    texture(uBump, vUv + vec2(0.0, uTexel * 3.0)).r + texture(uBump, vUv - vec2(0.0, uTexel * 3.0)).r);
  float cav = clamp(1.0 + (b0 - bavg) * 0.35, 0.6, 1.0);
  oDet = vec4(n.xy * 0.5 + 0.5, ao, cav);
}
`;

// Textura de detalhe fino que se repete (grão para o zoom alto e ondas da água)
const T3_MICRO_FS = GLSL_NOISE + `
in vec2 vUv;
out vec4 o;
float tileNoise(vec2 p, float per) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash12(mod(i, per)), b = hash12(mod(i + vec2(1, 0), per));
  float c = hash12(mod(i + vec2(0, 1), per)), d = hash12(mod(i + vec2(1, 1), per));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float tfbm(vec2 p) {
  float s = 0.0, a = 0.5, per = 16.0;
  for (int i = 0; i < 5; i++) { s += a * tileNoise(p * per / 16.0, per); per *= 2.0; p *= 2.0; a *= 0.5; }
  return s;
}
void main() {
  vec2 p = vUv * 16.0;
  float e = 1.0 / 512.0 * 16.0;
  float h = tfbm(p);
  float hx = tfbm(p + vec2(e, 0.0)) - tfbm(p - vec2(e, 0.0));
  float hy = tfbm(p + vec2(0.0, e)) - tfbm(p - vec2(0.0, e));
  vec2 n = vec2(-hx, -hy) * 6.0;
  float grain = tileNoise(vUv * 256.0, 256.0);
  o = vec4(h * 0.7 + grain * 0.3, clamp(n * 0.5 + 0.5, 0.0, 1.0), tfbm(p + 31.0));
}
`;

const T3_VS = `
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
uniform mat4 uVP;
out vec3 vP;
out vec3 vN;
void main() {
  vP = aPos;
  vN = aNrm;
  gl_Position = uVP * vec4(aPos, 1.0);
}
`;

const T3_SHADOW_FS = `
void main() {}
`;

const T3_FS = GLSL_NOISE + GLSL_LIGHT + `
uniform sampler2D uAlb;
uniform sampler2D uDet;
uniform sampler2D uMicro;
uniform sampler2D uLive;    // cristal que resta em cada tile (0..1)
uniform sampler2D uTiles;
uniform vec2 uOrigin;
uniform float uExtent;
uniform float uZoomDetail;
in vec3 vP;
in vec3 vN;
out vec4 oCol;
void main() {
  vec2 tuv = (vP.xy - uOrigin) / uExtent;
  vec4 A = texture(uAlb, tuv);
  vec4 D = texture(uDet, tuv);
  vec3 alb = A.rgb;
  float rough = A.a;
  vec2 nd = D.xy * 2.0 - 1.0;
  // Grão fino (aparece no zoom alto)
  vec4 m1 = texture(uMicro, vP.xy / 97.0);
  vec4 m2 = texture(uMicro, vP.xy / 23.0 + 0.37);
  alb *= 0.9 + 0.2 * mix(m1.r, m2.r, 0.5);
  nd += ((m1.gb * 2.0 - 1.0) * 0.18 + (m2.gb * 2.0 - 1.0) * 0.22 * uZoomDetail);
  vec3 N = normalize(normalize(vN) + vec3(nd, 0.0) * 1.1);
  float ao = D.z * D.w;
  // Campo de cristal: chão tingido com veios que brilham; some aos poucos quando o cristal acaba
  vec2 warp = (vec2(fbm3(vP.xy * 0.03), fbm3(vP.xy * 0.03 + 5.0)) - 0.5) * 22.0;
  float live = texture(uLive, (vP.xy + warp) / ${(TILE * MAP_W).toFixed(1)}).r;
  float was = texture(uTiles, (vP.xy + warp) / ${(TILE * MAP_W).toFixed(1)}).b;
  float stain = smoothstep(0.04, 0.5, live);
  float scar = smoothstep(0.2, 0.6, was) * (1.0 - stain);
  alb = mix(alb, alb * vec3(0.3, 0.36, 0.42) + vec3(0.002, 0.012, 0.016), stain * 0.85);
  alb = mix(alb, alb * vec3(0.8, 0.78, 0.82), scar * 0.6);
  float v = abs(fbm(vP.xy * 0.035 + 2.0) - 0.5);
  float vein = (1.0 - smoothstep(0.0, 0.035, v)) * stain;
  float pulse = 0.65 + 0.35 * sin(uTime * 1.7 + vP.x * 0.02 + vP.y * 0.013);
  vec3 emis = vec3(0.15, 0.95, 0.85) * vein * pulse * 0.4 + vec3(0.01, 0.05, 0.05) * stain;
  rough = mix(rough, 0.55, stain);
  // Sombra no chão não chega ao preto (céu aberto do deserto)
  float sh = mix(0.2, 1.0, shadowAt(vP, N)) * cloudShadow(vP);
  vec3 col = shade(vP, N, alb, rough, 0.0, ao, sh) + emis;
  oCol = vec4(applyFow(col, vP), 1.0);
}
`;

// Água dos cânions: ondas, reflexo do céu, brilho do sol, espuma na margem
const T3_WATER_FS = GLSL_NOISE + GLSL_LIGHT + `
uniform sampler2D uHeightTex;
uniform sampler2D uAlb;
uniform sampler2D uMicro;
uniform vec2 uOrigin;
uniform float uExtent;
uniform float uN;
in vec3 vP;
in vec3 vN;
out vec4 oCol;
void main() {
  float th = texture(uHeightTex, ((vP.xy - uOrigin) / ${T3_STEP.toFixed(1)} + 0.5) / uN).r;
  float depth = ${WATER_LEVEL.toFixed(1)} - th;
  if (depth < -0.3) discard;
  vec2 t = vec2(uTime);
  vec4 w1 = texture(uMicro, vP.xy / 420.0 + t * vec2(0.006, 0.004));
  vec4 w2 = texture(uMicro, vP.xy / 210.0 - t * vec2(0.005, 0.009));
  vec4 w3 = texture(uMicro, vP.xy / 95.0 + t * vec2(-0.012, 0.008));
  // Ondas direcionais com o mesmo vento (soma de senos com derivada analítica) + um pouco de ruído
  vec2 nn = vec2(0.0);
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float ang = 0.6 + (fract(fi * 0.618) - 0.5) * 3.2;
    vec2 dir = vec2(cos(ang), sin(ang));
    float wl = 160.0 * pow(0.75, fi);
    float kk = 6.2831 / wl;
    float amp = 0.02;
    float ph = dot(dir, vP.xy) * kk + uTime * sqrt(9.8 * kk) * 2.2 + fi * 1.7 + (w1.r - 0.5) * 5.0;
    nn += dir * cos(ph) * amp;
  }
  // Ruído em 3 oitavas com eixos girados (sem direção dominante na tela)
  const mat2 r1 = mat2(0.80, 0.60, -0.60, 0.80), r2 = mat2(0.34, -0.94, 0.94, 0.34);
  vec4 q1 = texture(uMicro, r1 * vP.xy / 160.0 + t * vec2(0.004, -0.007));
  vec4 q2 = texture(uMicro, r2 * vP.xy / 61.0 - t * vec2(0.009, 0.004));
  nn += ((w2.gb * 2.0 - 1.0) * 0.35 + (r1 * (q1.gb * 2.0 - 1.0)) * 0.4 + (r2 * (q2.gb * 2.0 - 1.0)) * 0.25) * 0.16;
  vec3 N = normalize(vec3(nn * 0.6, 1.0));
  vec3 V = uViewDir;
  float sh = shadowAt(vP, vec3(0.0, 0.0, 1.0)) * cloudShadow(vP);
  // Corpo da água: raso turquesa, fundo azul-esverdeado escuro
  vec3 bed = texture(uAlb, (vP.xy - uOrigin) / uExtent).rgb;
  float k = 1.0 - exp(-max(depth, 0.0) * 0.025);
  vec3 shallow = vec3(0.04, 0.24, 0.21);
  vec3 deep = vec3(0.003, 0.022, 0.045);
  vec3 body = mix(bed * vec3(0.5, 0.75, 0.8) * (uSkyCol + uSunCol * 0.25 * sh), mix(shallow, deep, smoothstep(0.0, 0.75, k)), smoothstep(0.0, 0.25, k));
  body *= 0.6 + 0.4 * sh;
  // Reflexo: céu pelo Fresnel, sol forte e afiado
  vec3 R = reflect(-V, N);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 refl = envColor(R) * 0.9;
  // Reflexo das paredes do cânion: com esta câmera, um ponto da parede na altura h aparece
  // refletido K·(h − nível) mais abaixo na tela; procura para o norte a parede que cai aqui
  float WL = ${WATER_LEVEL.toFixed(1)};
  vec2 rp = vP.xy + N.xy * 14.0;
  for (int i = 1; i <= 14; i++) {
    float s = float(i) * 4.0;
    vec2 Q = rp - vec2(0.0, s);
    float hq = texture(uHeightTex, ((Q - uOrigin) / ${T3_STEP.toFixed(1)} + 0.5) / uN).r;
    if (${PREMIUM_K.toFixed(2)} * (hq - WL) >= s) {
      vec3 wall = texture(uAlb, (Q - uOrigin) / uExtent).rgb * (uSkyCol * 1.4 + uSunCol * 0.45);
      refl = mix(refl, wall, 0.85);
      break;
    }
  }
  vec3 H = normalize(uSunDir + V);
  float spec = pow(max(dot(N, H), 0.0), 500.0) * 10.0 + pow(max(dot(N, H), 0.0), 60.0) * 0.2;
  vec3 col = mix(body, refl * 0.7, clamp(0.08 + fres * 1.6, 0.0, 1.0)) + uSunCol * spec * sh;
  // Raso junto à margem: faixa turquesa com cáusticas (luz dançando no fundo)
  float sh2 = smoothstep(9.0, 0.5, depth);
  float cau = pow(1.0 - abs(w3.g - w2.b), 6.0);
  col = mix(col, vec3(0.08, 0.34, 0.3) * (uSkyCol + uSunCol * 0.35 * sh) * 1.6 + cau * uSunCol * 0.12 * sh, sh2 * 0.32);
  // Espuma na margem
  float foamN = w2.a * 0.6 + w3.r * 0.4;
  float foam = smoothstep(2.2, 0.2, depth) * smoothstep(0.42, 0.62, foamN + 0.3 * sin(uTime * 1.6 + depth * 2.2 + w1.r * 6.0));
  col = mix(col, vec3(0.9, 0.95, 0.95) * (uSkyCol + uSunCol * 0.5 * sh) * 0.9, foam * 0.45);
  // Cintilação do sol em todo o lago: picos finos onde a micro-onda vira o sol para a câmera
  float glit = smoothstep(0.86, 0.97, q2.r * 0.6 + w3.g * 0.4) * pow(max(dot(N, H), 0.0), 40.0);
  col += uSunCol * glit * 1.6 * sh;
  // Luzes das explosões refletidas
  for (int i = 0; i < MAXL; i++) {
    if (i >= uNumLights) break;
    vec3 d = uLightPos[i].xyz - vP;
    float r = uLightPos[i].w, dist = length(d);
    if (dist > r) continue;
    float f = 1.0 - dist / r;
    col += uLightCol[i].rgb * f * f * (0.012 + pow(max(dot(N, normalize(normalize(d) + V)), 0.0), 60.0) * 2.0);
  }
  oCol = vec4(applyFow(col, vP), 1.0);
}
`;

// ---------- Cristais em 3D ----------

// Fragmento de cristal: prisma hexagonal com ponta (altura 1, raio 1, base em z = 0)
function t3shardMesh() {
  const mb = new MeshBuilder();
  const n = 6, pos = [], H = 0.72;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2 + 0.3;
    pos.push([Math.cos(a) * (0.9 + (i % 2) * 0.1), Math.sin(a) * (0.9 + (i % 2) * 0.1)]);
  }
  const mat = { c: [1, 1, 1] };
  for (let i = 0; i < n; i++) {
    const a = pos[i], b = pos[(i + 1) % n];
    // Lado do prisma (um pouco mais largo embaixo)
    const p0 = [a[0], a[1], -0.1], p1 = [b[0], b[1], -0.1], p2 = [b[0] * 0.86, b[1] * 0.86, H], p3 = [a[0] * 0.86, a[1] * 0.86, H];
    mb.quad(p0, p1, p2, p3, mat);
    // Ponta: pirâmide um pouco torta
    mb.tri(p3, p2, [0.12, 0.05, 1.0], mat);
  }
  return mb.upload();
}

function t3buildCrystals(map, origTiles) {
  const inst = [];
  const N = map.w;
  for (let ty = 0; ty < map.h; ty++) {
    for (let tx = 0; tx < map.w; tx++) {
      const i = ty * N + tx;
      if (origTiles[i] !== TERRAIN.CRYSTAL) continue;
      const rng = makeRng(map.seed * 7 + ty * 977 + tx * 131);
      // Aglomerados: 2 a 3 centros por tile, cada um com 3 a 5 fragmentos inclinados para fora
      const clusters = 2 + (rng() < 0.5 ? 1 : 0);
      for (let c = 0; c < clusters; c++) {
        const cx = tx * TILE + 6 + rng() * 20, cy = ty * TILE + 6 + rng() * 20;
        const n = 3 + Math.floor(rng() * 3);
        const big = 0.6 + rng() * 0.85;
        const hue = rng();
        for (let k = 0; k < n; k++) {
          const ang = rng() * Math.PI * 2;
          const off = k === 0 ? 0 : 1.5 + rng() * 3.5;
          const x = cx + Math.cos(ang) * off, y = cy + Math.sin(ang) * off;
          const h = (k === 0 ? 11 + rng() * 7 : 5 + rng() * 7) * big;
          const r = (k === 0 ? 2.6 : 1.5 + rng() * 1.0) * big;
          const tilt = k === 0 ? rng() * 0.2 : 0.3 + rng() * 0.45;
          const thr = clamp((c * 0.27 + k * 0.13 + rng() * 0.15) * 0.85, 0, 0.9);
          inst.push(x, y, terrainHeightAt(x, y) - 0.5, i, ang, tilt, r, h, rng() * Math.PI * 2, thr, hue, rng());
        }
      }
    }
  }
  const data = new Float32Array(inst);
  return { data, count: data.length / 12 };
}

const T3_CRYSTAL_VS = `
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
layout(location=4) in vec4 iA; // x, y, z, tile
layout(location=5) in vec4 iB; // ângulo da inclinação, inclinação, raio, altura
layout(location=6) in vec4 iC; // giro, limiar, matiz, semente
uniform mat4 uVP;
uniform sampler2D uLive;
uniform float uTime;
out vec3 vP;
out vec3 vN;
out vec3 vLocal;
out vec3 vSeed;
void main() {
  float tile = iA.w;
  vec2 tc = (vec2(mod(tile, ${MAP_W.toFixed(1)}), floor(tile / ${MAP_W.toFixed(1)})) + 0.5) / ${MAP_W.toFixed(1)};
  float live = textureLod(uLive, tc, 0.0).r;
  float s = smoothstep(iC.y, iC.y + 0.18, live);
  vec3 p = aPos * vec3(iB.z, iB.z, iB.w) * vec3(s, s, s);
  vec3 n = aNrm / vec3(iB.z, iB.z, iB.w);
  // Giro no próprio eixo, inclinação para fora e posição
  float c = cos(iC.x), si = sin(iC.x);
  p.xy = mat2(c, si, -si, c) * p.xy; n.xy = mat2(c, si, -si, c) * n.xy;
  float ct = cos(iB.y), st = sin(iB.y);
  p.xz = mat2(ct, -st, st, ct) * p.xz; n.xz = mat2(ct, -st, st, ct) * n.xz;
  float ca = cos(iB.x), sa = sin(iB.x);
  p.xy = mat2(ca, sa, -sa, ca) * p.xy; n.xy = mat2(ca, sa, -sa, ca) * n.xy;
  vP = p + iA.xyz;
  vN = normalize(n);
  vLocal = vec3(aPos.z, s, live);
  vSeed = iC.zwy;
  gl_Position = uVP * vec4(vP, 1.0);
}
`;

const T3_CRYSTAL_FS = GLSL_NOISE + GLSL_LIGHT + `
in vec3 vP;
in vec3 vN;
in vec3 vLocal;
in vec3 vSeed;
out vec4 oCol;
void main() {
  if (vLocal.y < 0.02) discard;
  vec3 N = normalize(cross(dFdx(vP), dFdy(vP)));
  if (dot(N, vN) < 0.0) N = -N;
  vec3 V = uViewDir;
  float hue = vSeed.x;
  // Paleta por aglomerado (verde-água, ciano, azul, menta) com variação por faceta
  float hv = clamp(hue + (hash12(floor(vN.xy * 3.0 + vSeed.y * 9.0)) - 0.5) * 0.18, 0.0, 1.0);
  vec3 core = hv < 0.33 ? mix(vec3(0.05, 0.95, 0.72), vec3(0.08, 0.85, 1.0), hv * 3.0)
            : hv < 0.66 ? mix(vec3(0.08, 0.85, 1.0), vec3(0.22, 0.5, 1.0), (hv - 0.33) * 3.0)
            : mix(vec3(0.3, 1.0, 0.62), vec3(0.05, 0.95, 0.72), (hv - 0.66) * 3.0);
  vec3 alb = core * 0.12;
  float sh = mix(0.4, 1.0, shadowAt(vP, N) * cloudShadow(vP));
  vec3 col = shade(vP, N, alb, 0.12, 0.0, 1.0, sh);
  // Brilho interno: mais forte na ponta; pulsa devagar; cintila de vez em quando
  float glow = 0.2 + 4.0 * vLocal.x * vLocal.x * vLocal.x;
  float pulse = 0.75 + 0.25 * sin(uTime * 1.3 + vSeed.y * 20.0);
  float tw = pow(max(0.0, sin(uTime * 0.9 + vSeed.y * 40.0)), 60.0) * 1.3;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.5);
  col += core * (glow * pulse * 0.7 + fres * 0.6) + (core * 0.8 + 0.1) * tw * vLocal.x;
  // Núcleo interno: veio claro que aparece de frente (onde a faceta não reflete)
  col += mix(core, vec3(0.85, 1.0, 1.0), 0.5) * (1.0 - fres) * smoothstep(0.2, 0.9, vLocal.x) * 0.55 * pulse;
  oCol = vec4(applyFow(col, vP), 1.0);
}
`;

// ---------- Montagem ----------

let t3progs = null;

function t3programs() {
  if (t3progs) return t3progs;
  const lightDefs = ['MAXL ' + premium.maxLights];
  t3progs = {
    bake: glProgram(GLSL_FULL_VS, T3_BAKE_FS),
    bakeMask: glProgram(GLSL_FULL_VS, T3_BAKE_FS, ['MASK']),
    detail: glProgram(GLSL_FULL_VS, T3_DETAIL_FS),
    micro: glProgram(GLSL_FULL_VS, T3_MICRO_FS),
    terrain: glProgram(T3_VS, T3_FS, lightDefs),
    water: glProgram(T3_VS, T3_WATER_FS, lightDefs),
    shadow: glProgram(T3_VS, T3_SHADOW_FS),
    crystal: glProgram(T3_CRYSTAL_VS, T3_CRYSTAL_FS, lightDefs),
    crystalShadow: glProgram(T3_CRYSTAL_VS, T3_SHADOW_FS),
  };
  return t3progs;
}

let t3micro = null;
function t3microTexture() {
  if (t3micro) return t3micro;
  const P = t3programs();
  const tg = glTarget(512, 512, { color: [{ internal: gl.RGBA8, filter: 'linear', wrap: 'repeat' }] });
  glBind(tg);
  P.micro.use();
  glFullscreen();
  t3micro = tg.tex[0];
  gl.bindTexture(gl.TEXTURE_2D, t3micro);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return t3micro;
}

function t3free() {
  if (!t3) return;
  gl.deleteBuffer(t3.mesh.vb);
  gl.deleteBuffer(t3.mesh.ib);
  gl.deleteVertexArray(t3.mesh.vao);
  [t3.texHeight, t3.texFields, t3.texTiles, t3.texLive, t3.texAlb, t3.texDet].forEach(t => t && gl.deleteTexture(t));
  if (t3.crystalBuf) gl.deleteBuffer(t3.crystalBuf);
  if (t3.crystalVao) gl.deleteVertexArray(t3.crystalVao);
  t3 = null;
}

// Monta tudo para o mapa atual (uma vez por partida; o mesmo mapa é reaproveitado)
function buildTerrain3D(map) {
  if (t3 && t3.map === map) return;
  if (t3 && t3.seed === map.seed && t3.mapRef === map.tiles.length) {
    // Mesmo mapa de novo: só recomeça o cristal
    t3.map = map;
    t3.liveSig = -1;
    return;
  }
  t3free();
  const t0 = performance.now();
  const P = t3programs();
  // Tiles originais (antes de qualquer colheita): os tiles esgotados viram solo na simulação
  const orig = new Uint8Array(map.tiles);
  for (let i = 0; i < orig.length; i++) if (map.crystal[i] > 0) orig[i] = TERRAIN.CRYSTAL;
  const f = t3buildHeights(map, orig);
  t3 = { map, seed: map.seed, mapRef: map.tiles.length, heights: f.H, liveSig: -1 };
  t3.mesh = t3buildMesh(f.H);
  const N = T3_N;
  t3.texHeight = glTexture(N, N, { internal: gl.R32F, format: gl.RED, type: gl.FLOAT, data: f.H, filter: premium.floatLinear ? 'linear' : 'nearest' });
  if (!premium.floatLinear) {
    // Sem filtro em float32: usa meia precisão (sempre filtrável)
    gl.deleteTexture(t3.texHeight);
    const half = new Uint16Array(N * N);
    for (let i = 0; i < half.length; i++) half[i] = toHalf(f.H[i]);
    t3.texHeight = glTexture(N, N, { internal: gl.R16F, format: gl.RED, type: gl.HALF_FLOAT, data: half });
  }
  const fields = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    fields[i * 4] = clamp(f.mC[i] * 255, 0, 255);
    fields[i * 4 + 1] = clamp(f.mP[i] * 255, 0, 255);
    fields[i * 4 + 2] = clamp(f.sel[i] * 255, 0, 255);
    fields[i * 4 + 3] = clamp(f.mC2[i] * 255, 0, 255);
  }
  t3.texFields = glTexture(N, N, { data: fields });
  const tiles = new Uint8Array(map.w * map.h * 4);
  for (let i = 0; i < map.w * map.h; i++) {
    tiles[i * 4] = orig[i] === TERRAIN.PLATEAU ? 255 : 0;
    tiles[i * 4 + 1] = orig[i] === TERRAIN.CLIFF ? 255 : 0;
    tiles[i * 4 + 2] = orig[i] === TERRAIN.CRYSTAL ? 255 : 0;
    tiles[i * 4 + 3] = clamp(map.shade[i] * 255, 0, 255);
  }
  t3.texTiles = glTexture(map.w, map.h, { data: tiles });
  t3.liveData = new Uint8Array(map.w * map.h);
  t3.texLive = glTexture(map.w, map.h, { internal: gl.R8, format: gl.RED, data: t3.liveData });

  // Materiais assados na GPU
  const S = premium.bakeSize;
  const bakeT = glTarget(S, S, { color: [{ internal: gl.SRGB8_ALPHA8 }, { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT }] });
  glBind(bakeT);
  P.bake.use().tex('uHeight', 0, t3.texHeight).tex('uFields', 1, t3.texFields).tex('uTiles', 2, t3.texTiles)
    .f('uOrigin', -T3_BORDER, -T3_BORDER).f('uExtent', T3_EXTENT).f('uN', N);
  glFullscreen();
  const detT = glTarget(S, S, { color: [{ internal: gl.RGBA8 }] });
  glBind(detT);
  const texAO = glTexture(N, N, { internal: gl.R8, format: gl.RED, data: f.AO });
  P.detail.use().tex('uBump', 0, bakeT.tex[1]).tex('uHeight', 1, t3.texHeight).tex('uAO', 2, texAO)
    .f('uOrigin', -T3_BORDER, -T3_BORDER).f('uExtent', T3_EXTENT).f('uN', N).f('uTexel', 1 / S);
  glFullscreen();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  t3.texAlb = bakeT.tex[0];
  t3.texDet = detT.tex[0];
  [t3.texAlb, t3.texDet].forEach(t => {
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    if (premium.aniso) gl.texParameterf(gl.TEXTURE_2D, premium.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
  });
  // Os alvos da montagem podem sair; as texturas ficam
  gl.deleteTexture(bakeT.tex[1]);
  gl.deleteTexture(texAO);
  gl.deleteFramebuffer(bakeT.fb);
  gl.deleteFramebuffer(detT.fb);
  t3microTexture();

  // Cristais
  const cr = t3buildCrystals(map, orig);
  t3.crystalCount = cr.count;
  t3.crystalData = cr.data;
  t3.shard = t3shardMesh();
  t3.crystalVao = gl.createVertexArray();
  gl.bindVertexArray(t3.crystalVao);
  t3.shard.bindAttribs();
  t3.crystalBuf = glBuffer(cr.data);
  for (let k = 0; k < 3; k++) glAttrib({ buf: t3.crystalBuf, loc: 4 + k, size: 4, stride: 48, off: k * 16, div: 1 });
  gl.bindVertexArray(null);

  // Água: um quadrado no nível da água cobrindo o mapa (só aparece onde o chão está abaixo)
  const e0 = -T3_BORDER, e1 = MAP_W * TILE + T3_BORDER;
  const wv = new Float32Array([e0, e0, WATER_LEVEL, 0, 0, 1, e1, e0, WATER_LEVEL, 0, 0, 1, e1, e1, WATER_LEVEL, 0, 0, 1, e0, e1, WATER_LEVEL, 0, 0, 1]);
  t3.waterVao = gl.createVertexArray();
  gl.bindVertexArray(t3.waterVao);
  const wb = glBuffer(wv);
  glAttrib({ buf: wb, loc: 0, size: 3, stride: 24, off: 0 });
  glAttrib({ buf: wb, loc: 1, size: 3, stride: 24, off: 12 });
  glBuffer(new Uint16Array([0, 1, 2, 0, 2, 3]), gl.ELEMENT_ARRAY_BUFFER);
  gl.bindVertexArray(null);
  t3.hasWater = f.H.some(h => h < WATER_LEVEL);
  // Máscara de vegetação (pequena, lida de volta para espalhar plantas e pedras)
  const mT = glTarget(N, N, { color: [{ internal: gl.RGBA8 }, { internal: gl.RGBA8 }] });
  glBind(mT);
  P.bakeMask.use().tex('uHeight', 0, t3.texHeight).tex('uFields', 1, t3.texFields).tex('uTiles', 2, t3.texTiles)
    .f('uOrigin', -T3_BORDER - T3_STEP / 2, -T3_BORDER - T3_STEP / 2).f('uExtent', T3_EXTENT + T3_STEP).f('uN', N);
  glFullscreen();
  const mask = new Uint8Array(N * N * 4);
  gl.readBuffer(gl.COLOR_ATTACHMENT0);
  gl.readPixels(0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, mask);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  glFreeTarget(mT);
  buildProps(map, orig, f, mask);
  t3.buildMs = performance.now() - t0;
}

function toHalf(v) {
  const f = new Float32Array([v]), i = new Uint32Array(f.buffer)[0];
  const s = (i >> 16) & 0x8000, e = ((i >> 23) & 0xff) - 112, m = i & 0x7fffff;
  if (e <= 0) return s;
  if (e >= 31) return s | 0x7c00;
  return s | (e << 10) | (m >> 13);
}

// Cristal que resta em cada tile (atualiza a textura só quando algo muda)
function updateTerrainLive() {
  const m = gameMap, d = t3.liveData;
  let changed = t3.liveSig < 0;
  for (let i = 0; i < m.w * m.h; i++) {
    const v = m.tiles[i] === TERRAIN.CRYSTAL ? clamp(Math.round(m.crystal[i] / 650 * 255), 8, 255) : 0;
    if (d[i] !== v) { d[i] = v; changed = true; }
  }
  if (changed) {
    t3.liveSig = 1;
    gl.bindTexture(gl.TEXTURE_2D, t3.texLive);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, m.w, m.h, gl.RED, gl.UNSIGNED_BYTE, d);
  }
}

// Blocos do terreno dentro de um retângulo do mundo (com margem para a altura)
function terrainChunksIn(x0, y0, x1, y1) {
  return t3.mesh.chunks.filter(c => c.x1 >= x0 && c.x0 <= x1 && c.y1 >= y0 && c.y0 <= y1);
}

function drawTerrainChunks(list) {
  gl.bindVertexArray(t3.mesh.vao);
  // Blocos vizinhos na lista viram uma chamada só
  let i = 0;
  while (i < list.length) {
    let first = list[i].first, count = list[i].count;
    while (i + 1 < list.length && list[i + 1].first === first + count) { count += list[i + 1].count; i++; }
    gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_INT, first * 4);
    i++;
  }
  gl.bindVertexArray(null);
}
