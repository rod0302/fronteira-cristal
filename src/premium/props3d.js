// Modo Premium: vegetação e pedras espalhadas pelo mapa (só enfeite).
// Árvores, arbustos e rochedos ficam só onde ninguém anda (penhascos, topo das mesas, cânions);
// no chão transitável há apenas tufos baixos de capim, por onde as unidades passam por cima.

const FX_LEAF = 11, FX_GRASS = 12, FX_ROCK = 13;

// Rocha irregular: icosaedro subdividido e amassado, faces planas
function rockMesh(seed, mat) {
  const t = (1 + Math.sqrt(5)) / 2;
  let v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v3norm);
  let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const mid = {};
  const midp = (a, b) => {
    const k = a < b ? a + ':' + b : b + ':' + a;
    if (mid[k] !== undefined) return mid[k];
    v.push(v3norm([(v[a][0] + v[b][0]) / 2, (v[a][1] + v[b][1]) / 2, (v[a][2] + v[b][2]) / 2]));
    return (mid[k] = v.length - 1);
  };
  const nf = [];
  f.forEach(([a, b, c]) => { const ab = midp(a, b), bc = midp(b, c), ca = midp(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); });
  f = nf;
  const rng = makeRng(seed);
  const sx = 0.8 + rng() * 0.5, sy = 0.7 + rng() * 0.5, sz = 0.45 + rng() * 0.35;
  v = v.map(p => {
    const k = 0.75 + rng() * 0.4;
    return [p[0] * k * sx, p[1] * k * sy, Math.max(-0.2, p[2] * k * sz + 0.25)];
  });
  const mb = new MeshBuilder();
  f.forEach(([a, b, c]) => mb.tri(v[a], v[b], v[c], mat, [0, 0, 0.2]));
  return mb;
}

function blob(mb, x, y, z, r, rz, mat, segs) {
  const prof = [];
  const n = 4;
  for (let i = -n; i <= n; i++) { const a = i / n * Math.PI / 2; prof.push([Math.cos(a) * r, Math.sin(a) * rz]); }
  mb.push(a34mul(a34trans(x, y, z), a34rotZ(x * 0.7 + y)));
  mb.lathe(prof, segs || 7, mat, { flat: true });
  mb.pop();
}

function buildPropMeshes() {
  const bark = M('#5a4636', { rough: 0.9 });
  const leaf = M('#d8d8d8', { team: 1, rough: 0.75, fx: FX_LEAF });
  const leafDark = M('#a8a8a8', { team: 1, rough: 0.8, fx: FX_LEAF });
  const rockM = M('#d0d0d0', { team: 1, rough: 0.92, fx: FX_ROCK });
  const grass = M('#e0e0e0', { team: 1, rough: 0.8, fx: FX_GRASS });
  const out = {};
  // Acácia: tronco torto e copa achatada em camadas
  {
    const mb = new MeshBuilder();
    mb.cyl(0, 0, 0, 1.3, 0.8, 10, 'z', 6, bark);
    mb.push(a34mul(a34trans(0, 0, 9.5), a34rotY(0.45)));
    mb.cyl(0, 0, 0, 0.8, 0.5, 9, 'z', 5, bark);
    mb.pop();
    mb.push(a34mul(a34trans(0, 0, 9.5), a34rotY(-0.55)));
    mb.cyl(0, 0, 0, 0.7, 0.45, 8, 'z', 5, bark);
    mb.pop();
    blob(mb, 3.5, 0.5, 17.5, 8.5, 2.2, leafDark, 9);
    blob(mb, -3.5, -0.5, 16.5, 7.5, 2.0, leafDark, 9);
    blob(mb, 2.5, 0.5, 19.2, 6.5, 1.8, leaf, 8);
    blob(mb, -2.6, -0.4, 18.2, 5.8, 1.7, leaf, 8);
    blob(mb, 0, 2.5, 18.6, 5, 1.6, leaf, 7);
    out.tree_acacia = mb;
  }
  // Árvore redonda
  {
    const mb = new MeshBuilder();
    mb.cyl(0, 0, 0, 1.1, 0.7, 9, 'z', 6, bark);
    blob(mb, 0, 0, 12, 6.5, 5.5, leafDark, 9);
    blob(mb, 2.8, 1.5, 14.5, 4.6, 4, leaf, 8);
    blob(mb, -2.4, 1.2, 15, 4.2, 3.8, leaf, 8);
    blob(mb, 0.4, -2.4, 16, 4, 3.6, leaf, 8);
    out.tree_round = mb;
  }
  // Árvore de copa irregular: 5 lóbulos de tamanhos diferentes em volta de um tronco bifurcado
  {
    const mb = new MeshBuilder();
    mb.cyl(0, 0, 0, 1.2, 0.7, 8, 'z', 6, bark);
    mb.push(a34mul(a34trans(0, 0, 7.5), a34rotX(0.5)));
    mb.cyl(0, 0, 0, 0.7, 0.45, 6, 'z', 5, bark);
    mb.pop();
    mb.push(a34mul(a34trans(0, 0, 7.5), a34rotX(-0.45)));
    mb.cyl(0, 0, 0, 0.65, 0.4, 6, 'z', 5, bark);
    mb.pop();
    blob(mb, 0, 3.2, 12.5, 5.2, 3.6, leafDark, 8);
    blob(mb, 0.8, -3.4, 12, 4.6, 3.4, leafDark, 8);
    blob(mb, -2.6, 0.4, 14.5, 4.2, 3.2, leaf, 7);
    blob(mb, 2.6, 1.2, 15.2, 3.6, 3, leaf, 7);
    blob(mb, 0.6, -1.0, 16.6, 3.4, 2.6, leaf, 7);
    out.tree_lobe = mb;
  }
  // Árvore seca
  {
    const mb = new MeshBuilder();
    mb.cyl(0, 0, 0, 1.2, 0.5, 13, 'z', 6, bark);
    [[0.7, 0.3, 6], [-0.6, 2.2, 8], [0.5, 4, 10], [-0.8, 1, 11]].forEach(([ry, rz, z]) => {
      mb.push(a34mul(a34trans(0, 0, z), a34mul(a34rotZ(rz), a34rotY(ry))));
      mb.cyl(0, 0, 0, 0.45, 0.15, 6, 'z', 4, bark);
      mb.pop();
    });
    out.tree_dead = mb;
  }
  // Arbusto
  {
    const mb = new MeshBuilder();
    blob(mb, 0, 0, 1.5, 3.6, 2.6, leafDark, 7);
    blob(mb, 2, 1, 2.5, 2.6, 2.2, leaf, 6);
    blob(mb, -1.6, 1.2, 2.4, 2.4, 2.0, leaf, 6);
    out.bush = mb;
  }
  // Rochas
  for (let i = 0; i < 3; i++) out['rock' + i] = rockMesh(101 + i * 57, rockM);
  // Tufo de capim: lâminas finas em leque
  {
    const mb = new MeshBuilder();
    const rng = makeRng(5);
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * Math.PI * 2 + rng() * 0.5;
      const lean = 0.35 + rng() * 0.4, h = 2.6 + rng() * 2.2;
      const bx = Math.cos(a) * 0.5, by = Math.sin(a) * 0.5;
      const tx = bx + Math.cos(a) * h * lean, ty = by + Math.sin(a) * h * lean;
      const px = -Math.sin(a) * 0.45, py = Math.cos(a) * 0.45;
      mb.tri([bx - px, by - py, 0], [bx + px, by + py, 0], [tx, ty, h], grass);
      mb.tri([bx + px, by + py, 0], [bx - px, by - py, 0], [tx, ty, h], grass);
    }
    out.tuft = mb;
  }
  // Sucata: tambor enferrujado tombado e uma chapa torta (restos de batalhas antigas)
  {
    const mb = new MeshBuilder();
    const rust = M('#7a4a2e', { rough: 0.85, metal: 0.4 }), steel = M('#5d5f5c', { rough: 0.6, metal: 0.6 });
    mb.cyl(-2, 0, 1.4, 1.4, 1.4, 4, 'x', 10, rust);
    mb.cyl(-2.2, 0, 1.4, 1.5, 1.5, 0.35, 'x', 10, steel);
    mb.push(a34mul(a34trans(2.2, 1.2, 0.2), a34rotX(0.35)));
    mb.box(-1.8, -2.2, 0, 1.8, 2.2, 0.35, steel);
    mb.pop();
    out.scrap = mb;
  }
  const up = {};
  for (const k in out) up[k] = out[k].upload();
  return up;
}

// Espalha as plantas e pedras e monta os blocos (só os blocos à vista são desenhados)
function buildProps(map, orig, f, mask) {
  if (!premium.propMeshes) premium.propMeshes = buildPropMeshes();
  const N = T3_N;
  const rng = makeRng(map.seed * 31 + 7);
  const CH = T3_CHUNK * T3_STEP;
  const nch = Math.ceil((N - 1) / T3_CHUNK);
  const per = {}; // key -> [chunk] -> floats
  const soft = premium.tier === 'software';
  const add = (key, x, y, z, rot, s, tint, sway) => {
    const cx = clamp(Math.floor((x + T3_BORDER) / CH), 0, nch - 1), cy = clamp(Math.floor((y + T3_BORDER) / CH), 0, nch - 1);
    const ci = cy * nch + cx;
    const arr = (per[key] || (per[key] = []))[ci] || (per[key][ci] = []);
    const m = a34trs(x, y, z, rot, s);
    for (let i = 0; i < 12; i++) arr.push(m[i]);
    arr.push(tint[0], tint[1], tint[2], 0, 1e4, 1, 0, sway);
  };
  const tile = (x, y) => orig[clamp(Math.floor(y / TILE), 0, map.h - 1) * map.w + clamp(Math.floor(x / TILE), 0, map.w - 1)];
  const leafTints = [srgb(98, 112, 50), srgb(114, 120, 56), srgb(88, 104, 48), srgb(130, 124, 62), srgb(104, 114, 52), srgb(120, 112, 58)];
  const rockTints = [srgb(184, 128, 84), srgb(168, 116, 76), srgb(192, 148, 100), srgb(158, 112, 78), srgb(176, 136, 94)];
  const grassTints = [srgb(126, 136, 64), srgb(150, 146, 80), srgb(102, 124, 56), srgb(170, 154, 96)];
  const groundRock = [srgb(168, 136, 100), srgb(152, 122, 90), srgb(178, 146, 108), srgb(142, 114, 86)];
  const dryTints = [srgb(124, 116, 66), srgb(110, 100, 60), srgb(138, 124, 78)];
  const pick = list => list[(rng() * list.length) | 0];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      const x = i * T3_STEP - T3_BORDER + (rng() - 0.5) * T3_STEP, y = j * T3_STEP - T3_BORDER + (rng() - 0.5) * T3_STEP;
      const h = terrainHeightAt(x, y);
      const mC = f.mC[k];
      const g = mask[k * 4] / 255, top = mask[k * 4 + 3] / 255, rock = mask[k * 4 + 2] / 255;
      const tl = tile(x, y);
      const inMap = x > 0 && y > 0 && x < MAP_W * TILE && y < MAP_H * TILE;
      if (tl === TERRAIN.CLIFF && mC > 0.82) {
        if (h > 10 && top > 0.4) {
          const r = rng();
          if (r < 0.035) add(['tree_acacia', 'tree_round', 'tree_lobe'][(rng() * 3) | 0], x, y, h - 0.5, rng() * 6.3, 0.7 + rng() * 0.6, pick(leafTints), rng() * 10);
          else if (r < 0.045) add('tree_dead', x, y, h - 0.5, rng() * 6.3, 0.8 + rng() * 0.5, [0.3, 0.3, 0.3], rng() * 10);
          else if (r < 0.1) add('bush', x, y, h - 0.3, rng() * 6.3, 0.8 + rng() * 0.7, pick(leafTints), rng() * 10);
          else if (r < 0.13) add('rock' + ((rng() * 3) | 0), x, y, h - 1, rng() * 6.3, 1.6 + rng() * 2.4, pick(rockTints), 0);
        } else if (h > WATER_LEVEL + 1) {
          const r = rng();
          if (r < 0.06) add('rock' + ((rng() * 3) | 0), x, y, h - 1.2, rng() * 6.3, 1.8 + rng() * 2.8, pick(rockTints), 0);
          else if (r < 0.085 && h > 0) add('bush', x, y, h - 0.3, rng() * 6.3, 0.7 + rng() * 0.6, pick(leafTints), rng() * 10);
        }
      } else if (tl === TERRAIN.CLIFF && mC > 0.55 && h > 2) {
        if (rng() < 0.05) add('rock' + ((rng() * 3) | 0), x, y, h - 1, rng() * 6.3, 1.6 + rng() * 2.5, pick(rockTints), 0);
      } else if (inMap && tl === TERRAIN.GROUND && g > 0.35 && h > -2) {
        // Capim baixo (as unidades passam por cima)
        const dens = soft ? 0.22 : 0.55;
        if (rng() < g * dens) add('tuft', x, y, h - 0.2, rng() * 6.3, 0.8 + rng() * 0.7, pick(grassTints), rng() * 10);
        if (!soft && rng() < g * 0.25) add('tuft', x + (rng() - 0.5) * 6, y + (rng() - 0.5) * 6, h - 0.2, rng() * 6.3, 0.6 + rng() * 0.5, pick(grassTints), rng() * 10);
      } else if (inMap && tl === TERRAIN.GROUND && rock < 0.1) {
        // Planície: grupos de pedras, arbustos secos e um pouco de sucata (só enfeite: unidades passam)
        const r = rng();
        if (r < 0.006) {
          const n = 1 + ((rng() * 3) | 0);
          for (let q = 0; q < n; q++) add('rock' + ((rng() * 3) | 0), x + (rng() - 0.5) * 7, y + (rng() - 0.5) * 7, h - 0.6, rng() * 6.3, 1.1 + rng() * 1.6, pick(groundRock), 0);
        } else if (r < 0.04) add('bush', x, y, h - 0.4, rng() * 6.3, 0.45 + rng() * 0.35, pick(dryTints), rng() * 10);
        else if (r < 0.042 && !soft) add('scrap', x, y, h - 0.3, rng() * 6.3, 0.9 + rng() * 0.4, [0.5, 0.5, 0.5], 0);
      }
    }
  }
  // Envia: um buffer por tipo, um VAO por bloco
  const props = { nch, CH, kinds: {} };
  for (const key in per) {
    const chunks = per[key];
    let total = 0;
    const starts = [];
    for (let c = 0; c < nch * nch; c++) { starts.push(total); total += chunks[c] ? chunks[c].length / INST : 0; }
    const data = new Float32Array(total * INST);
    for (let c = 0; c < nch * nch; c++) if (chunks[c]) data.set(chunks[c], starts[c] * INST);
    const buf = glBuffer(data);
    const mesh = premium.propMeshes[key];
    const list = [];
    for (let c = 0; c < nch * nch; c++) {
      const n = chunks[c] ? chunks[c].length / INST : 0;
      if (!n) { list.push(null); continue; }
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      mesh.bindAttribs();
      for (let q = 0; q < 5; q++) glAttrib({ buf, loc: 4 + q, size: 4, stride: INST * 4, off: starts[c] * INST * 4 + q * 16, div: 1 });
      gl.bindVertexArray(null);
      list.push({ vao, n });
    }
    props.kinds[key] = { buf, mesh, list, shadow: key !== 'tuft' };
  }
  if (t3.props) freeProps(t3.props);
  t3.props = props;
}

function freeProps(p) {
  for (const k in p.kinds) {
    gl.deleteBuffer(p.kinds[k].buf);
    p.kinds[k].list.forEach(c => c && gl.deleteVertexArray(c.vao));
  }
}

// Desenha as plantas e pedras dos blocos dentro do retângulo
function drawProps(x0, y0, x1, y1, shadowPass) {
  const p = t3 && t3.props;
  if (!p) return;
  const c0 = clamp(Math.floor((x0 + T3_BORDER) / p.CH), 0, p.nch - 1), c1 = clamp(Math.floor((x1 + T3_BORDER) / p.CH), 0, p.nch - 1);
  const r0 = clamp(Math.floor((y0 + T3_BORDER) / p.CH), 0, p.nch - 1), r1 = clamp(Math.floor((y1 + T3_BORDER) / p.CH), 0, p.nch - 1);
  for (const key in p.kinds) {
    const k = p.kinds[key];
    if (shadowPass && !k.shadow) continue;
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const ch = k.list[r * p.nch + c];
      if (!ch) continue;
      gl.bindVertexArray(ch.vao);
      gl.drawElementsInstanced(gl.TRIANGLES, k.mesh.count, k.mesh.itype, 0, ch.n);
    }
  }
  gl.bindVertexArray(null);
}
