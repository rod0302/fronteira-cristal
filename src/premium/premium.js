// Modo Premium: o desenho do mundo em WebGL2. Junta terreno, modelos, partículas, luzes,
// sombras e pós-processamento, e desenha por cima (no canvas 2D) as barras de vida, marcadores
// e a interface de sempre.

const premium = {
  ok: false,          // contexto e recursos prontos
  failed: false,      // não deu para usar (fica no clássico)
  tier: 'gpu',        // 'gpu' ou 'software' (navegador sem placa de vídeo)
  maxLights: 32,
  bakeSize: 4096,
  shadowSize: 4096,
  samples: 4,
  scale: 1,           // resolução dinâmica (fração da resolução cheia)
  ema: 1 / 60,
  slow: 0,
  fast: 0,
  floatLinear: false,
  aniso: null,
  renderer: '',
  models: null,
  progs: null,
  targets: null,
  vaos: {},
  bufs: {},
  frameMs: 0,
  frames: 0,          // quadros desenhados (os testes esperam alguns antes de tirar print)
};

let graphicsMode = 'premium'; // 'premium' | 'classico' | 'leve'

function premiumActive() {
  return graphicsMode === 'premium' && premium.ok && !premium.failed;
}

// ---------- Inicialização ----------

function initPremium() {
  if (premium.ok) return true;
  if (premium.failed) return false;
  try {
    glCanvas = document.createElement('canvas');
    glCanvas.id = 'gl';
    glCanvas.style.cssText = 'position:absolute;left:0;top:0;z-index:0;display:block';
    document.body.insertBefore(glCanvas, document.body.firstChild);
    gl = glCanvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, stencil: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) throw new Error('sem WebGL2');
    if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('sem EXT_color_buffer_float');
    premium.floatLinear = !!gl.getExtension('OES_texture_float_linear');
    premium.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    premium.renderer = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    const soft = /swiftshader|llvmpipe|software|basic render|softpipe/i.test(premium.renderer) || params.has('premiumleve');
    premium.tier = soft ? 'software' : 'gpu';
    if (soft) {
      premium.maxLights = 12;
      premium.bakeSize = params.has('assar4k') ? 4096 : 2048;
      premium.shadowSize = 2048;
      premium.samples = 0;
      premium.scale = 0.8;
      pfxInit(1600);
    } else {
      premium.maxLights = 32;
      premium.bakeSize = 4096;
      premium.shadowSize = 4096;
      premium.samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
      premium.scale = 1;
      pfxInit(3200);
    }
    if (params.has('escalagl')) premium.scale = clamp(parseFloat(params.get('escalagl')) || 1, 0.3, 2);
    premium.fixedScale = params.has('escalagl');
    premiumPrograms();
    premium.models = buildAllModels();
    premiumStaticTextures();
    glCanvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      premium.failed = true;
      premium.ok = false;
      if (glCanvas) glCanvas.style.display = 'none';
      if (typeof notify === 'function') notify('Premium mode unavailable (graphics card). Using Classic.', '#ffb03a');
    });
    premium.ok = true;
    return true;
  } catch (err) {
    console.warn('Premium indisponível:', err && err.message);
    premium.failed = true;
    if (glCanvas) glCanvas.style.display = 'none';
    return false;
  }
}

function premiumPrograms() {
  const L = ['MAXL ' + premium.maxLights];
  premium.progs = {
    model: glProgram(MODEL_VS, MODEL_FS, L),
    modelShadow: glProgram(MODEL_VS, MODEL_FS, L.concat(['SHADOW'])),
    holo: glProgram(MODEL_VS, MODEL_FS, L.concat(['HOLO'])),
    xray: glProgram(MODEL_VS, MODEL_FS, L.concat(['XRAY'])),
    decalMul: glProgram(DECAL_VS, DECAL_FS, ['MULTIPLY']),
    decalAdd: glProgram(DECAL_VS, DECAL_FS),
    part: glProgram(PART_VS, PART_FS),
    down: glProgram(GLSL_FULL_VS, BLOOM_DOWN_FS),
    up: glProgram(GLSL_FULL_VS, BLOOM_UP_FS),
    comp: glProgram(GLSL_FULL_VS, COMPOSITE_FS),
    fxaa: glProgram(GLSL_FULL_VS, FXAA_FS),
    copy: glProgram(GLSL_FULL_VS, COPY_FS),
    fowBlur: glProgram(GLSL_FULL_VS, FOW_BLUR_FS),
    fowLerp: glProgram(GLSL_FULL_VS, FOW_LERP_FS),
    clouds: glProgram(GLSL_FULL_VS, CLOUDS_FS),
  };
  t3programs();
}

// Atlas de nuvens para fumaça (4 variações; rgb = normal da "bola" de fumaça, a = densidade)
function premiumAtlas() {
  const S = 128, c = document.createElement('canvas');
  c.width = c.height = S * 2;
  const g = c.getContext('2d');
  const img = g.createImageData(S * 2, S * 2);
  for (let v = 0; v < 4; v++) {
    const ox = (v % 2) * S, oy = (v >> 1) * S;
    const rng = makeRng(911 + v * 37);
    const blobs = [];
    for (let i = 0; i < 9; i++) {
      const a = rng() * 6.283, r = rng() * 0.42;
      blobs.push([Math.cos(a) * r, Math.sin(a) * r, 0.28 + rng() * 0.28]);
    }
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const u = (x + 0.5) / S * 2 - 1, w = (y + 0.5) / S * 2 - 1;
        let d = 0, nx = 0, ny = 0;
        blobs.forEach(([bx, by, br]) => {
          const dx = u - bx, dy = w - by;
          const k = Math.max(0, 1 - (dx * dx + dy * dy) / (br * br));
          d += k * k;
          nx += dx * k * k; ny += dy * k * k;
        });
        const n = t3fbm(u * 3.2 + v * 10, w * 3.2, 5 + v, 5);
        const fall = Math.max(0, 1 - Math.hypot(u, w));
        // Densidade macia: soma de bolhas, corroída pelo ruído, sem borda dura
        let a = clamp(d * 0.75 * (0.35 + n * 1.1) - 0.08, 0, 1) * Math.min(1, fall * 1.6);
        a = Math.pow(a, 1.25);
        const l = Math.hypot(nx, ny, 0.35) || 1;
        const N = [nx / l * 1.5, ny / l * 1.5, 0.6];
        const nl = Math.hypot(N[0], N[1], N[2]);
        const i = ((oy + y) * S * 2 + ox + x) * 4;
        img.data[i] = (N[0] / nl * 0.5 + 0.5) * 255;
        img.data[i + 1] = (N[1] / nl * 0.5 + 0.5) * 255;
        img.data[i + 2] = (N[2] / nl * 0.5 + 0.5) * 255;
        img.data[i + 3] = a * 255;
      }
    }
  }
  return glTexture(S * 2, S * 2, { data: new Uint8Array(img.data.buffer), filter: 'mip' });
}

function premiumStaticTextures() {
  const P = premium.progs;
  premium.atlas = premiumAtlas();
  const ct = glTarget(256, 256, { color: [{ internal: gl.RGBA8, wrap: 'repeat' }] });
  glBind(ct);
  P.clouds.use();
  glFullscreen();
  premium.clouds = ct.tex[0];
  gl.bindTexture(gl.TEXTURE_2D, premium.clouds);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  // Névoa: textura crua (1 px por tile) e versões suavizadas
  premium.fowRaw = glTexture(MAP_W, MAP_H, { internal: gl.RG8, format: gl.RG, data: new Uint8Array(MAP_W * MAP_H * 2) });
  premium.fowRawData = new Uint8Array(MAP_W * MAP_H * 2);
  const F = MAP_W * 4;
  premium.fowBlur = glTarget(F, F, { color: [{ internal: gl.RGBA8 }] });
  premium.fowA = glTarget(F, F, { color: [{ internal: gl.RGBA8 }] });
  premium.fowB = glTarget(F, F, { color: [{ internal: gl.RGBA8 }] });
  premium.fowVersion = -1;
  premium.fowFresh = true;
  // Quadrado unitário para marcas e partículas
  premium.quad = glBuffer(new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]));
  // Sombra
  premium.shadow = glTarget(premium.shadowSize, premium.shadowSize, { depth: 'tex' });
}

// ---------- Alvos de desenho (mudam com o tamanho da tela) ----------

function premiumTargets(w, h) {
  const t = premium.targets;
  if (t && t.w === w && t.h === h) return t;
  if (t) {
    [t.msaa, t.scene, t.ldr].forEach(glFreeTarget);
    if (t.depthCopy) { gl.deleteFramebuffer(t.depthCopy.fb); gl.deleteTexture(t.depthCopy.tex); }
    t.bloom.forEach(glFreeTarget);
  }
  const hdr = { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT };
  const n = {
    w, h,
    msaa: premium.samples ? glTarget(w, h, { color: [hdr], depth: 'rb', samples: premium.samples }) : null,
    scene: glTarget(w, h, { color: [hdr], depth: 'rb' }),
    ldr: glTarget(w, h, { color: [{ internal: gl.RGBA8 }] }),
    bloom: [],
  };
  // Cópia da profundidade da cena (partículas suaves: somem onde encostam no chão, na água e nos modelos)
  {
    const fb = gl.createFramebuffer(), tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, tex, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    n.depthCopy = ok ? { fb, tex } : null;
  }
  let bw = w, bh = h;
  for (let i = 0; i < 6; i++) {
    bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1);
    n.bloom.push(glTarget(bw, bh, { color: [hdr] }));
  }
  premium.targets = n;
  return n;
}

// ---------- Câmera e luz ----------

const SUN_DIR = v3norm([-0.55, -0.45, 0.8]);
const SUN_COL = [1.0 * 2.45, 0.82 * 2.45, 0.6 * 2.45];
const SKY_COL = [0.2, 0.235, 0.31];
const GND_COL = [0.16, 0.12, 0.085];
const VIEW_DIR = v3norm([0, PREMIUM_K, 1]);

function premiumCamera(cx, cy, VW, VH, z) {
  const K = PREMIUM_K;
  const W = camera.w, H = camera.h;
  const dMin = K * (cy - 140) - 140, dMax = K * (cy + VH + 260) + 260;
  const R = dMax - dMin;
  return m4rows(
    [2 * z / W, 0, 0, -2 * z * cx / W - 1],
    [0, -2 * z / H, 2 * z * K / H, 2 * z * cy / H + 1],
    [0, -2 * K / R, -2 / R, 1 + 2 * dMin / R],
  );
}

function premiumLightMatrix(cx, cy, VW, VH) {
  const center = [cx + VW / 2, cy + VH / 2 + 30, 0];
  const Rr = 0.5 * Math.hypot(VW, VH + 60) + 150;
  const L = SUN_DIR;
  const f = [-L[0], -L[1], -L[2]];
  const s = v3norm(v3cross(f, [0, 0, 1]));
  const u = v3cross(s, f);
  // Centro preso à grade de texels (a sombra não "anda" quando a câmera rola)
  const texel = 2 * Rr / premium.shadowSize;
  let cs = v3dot(s, center), cu = v3dot(u, center);
  cs = Math.round(cs / texel) * texel; cu = Math.round(cu / texel) * texel;
  const near = -900, far = 900;
  const cf = v3dot(f, center);
  return m4rows(
    [s[0] / Rr, s[1] / Rr, s[2] / Rr, -cs / Rr],
    [u[0] / Rr, u[1] / Rr, u[2] / Rr, -cu / Rr],
    [2 * f[0] / (far - near), 2 * f[1] / (far - near), 2 * f[2] / (far - near), (-2 * cf - (far + near)) / (far - near)],
  );
}

// ---------- Luzes da cena ----------

const lightPos = new Float32Array(32 * 4), lightCol = new Float32Array(32 * 4);
let lightCount = 0;

function gatherLights(cx, cy, VW, VH) {
  const list = [];
  const mx = cx + VW / 2, my = cy + VH / 2;
  const add = (x, y, z, r, c, k) => {
    if (x < cx - r || x > cx + VW + r || y < cy - r - 40 || y > cy + VH + r + 60) return;
    list.push({ x, y, z, r, c, prio: k / (1 + dist(x, y, mx, my) / 600) });
  };
  pfx.lights.forEach(l => {
    const k = 1 - l.t / l.life;
    const f = l.flick ? 0.75 + Math.random() * 0.5 : 1;
    add(l.x, l.y, l.z, l.r * (0.6 + 0.4 * k), [l.c[0] * k * f, l.c[1] * k * f, l.c[2] * k * f], 10 * k);
  });
  projectiles.forEach(p => {
    if (!fxVisible(p.x, p.y)) return;
    if (p.kind === 'bullet') return;
    const z = projZ(p);
    if (p.kind === 'rocket') add(p.x, p.y, z, 70, [2.6, 1.4, 0.5], 4);
    else add(p.x, p.y, z, 55, [2.2, 1.3, 0.6], 3);
  });
  const t = performance.now() / 1000;
  buildings.forEach(b => {
    if (b.hp <= 0 || !isExploredByPlayer(b)) return;
    const vis = isVisibleToPlayer(b) || b.team === 0 || !gameOptions.fog || gameState === 'title';
    const g = terrainHeightAt(b.x, b.y);
    const f = b.hp / b.maxHp;
    if (vis && f < 0.25) add(b.x, b.y, g + 20, 110, [3.2 * (0.7 + 0.3 * Math.sin(t * 13 + b.id)), 1.4, 0.35], 6);
    if (!vis) return;
    const powered = !lowPower(b.team);
    const rot = doorOnTop(b) ? Math.PI : 0;
    const L = (lx, ly) => [b.x + Math.cos(rot) * lx - Math.sin(rot) * ly, b.y + Math.sin(rot) * lx + Math.cos(rot) * ly];
    if (b.type === 'refinery') { const p = L(28, -6); add(p[0], p[1], g + 30, 48, [0.2, 1.1, 0.95], 1.5); }
    else if (b.type === 'power' && powered) { const p = L(16, -4); add(p[0], p[1], g + 8, 60, [1.6, 1.2, 0.4], 1.2); }
    else if (b.type === 'factory' && b.queue.length) { const p = L(0, 30); add(p[0], p[1], g + 14, 70, [1.6, 1.1, 0.4], 1.2); }
    else if (b.type === 'hq') { const p = L(0, -10); add(p[0], p[1], g + 30, 80, [0.5, 1.0, 1.8], 1.4); }
  });
  list.sort((a, b) => b.prio - a.prio);
  lightCount = Math.min(list.length, premium.maxLights);
  for (let i = 0; i < lightCount; i++) {
    const l = list[i];
    lightPos.set([l.x, l.y, l.z, l.r], i * 4);
    lightCol.set([l.c[0], l.c[1], l.c[2], 0], i * 4);
  }
}

// Uniforms de luz/sombra/névoa comuns a todos os shaders iluminados
function setLit(p, fr) {
  p.m4('uVP', fr.vp).m4('uLightVP', fr.lvp)
    .f('uSunDir', SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]).f('uSunCol', SUN_COL[0], SUN_COL[1], SUN_COL[2])
    .f('uSkyCol', SKY_COL[0], SKY_COL[1], SKY_COL[2]).f('uGndCol', GND_COL[0], GND_COL[1], GND_COL[2])
    .f('uViewDir', VIEW_DIR[0], VIEW_DIR[1], VIEW_DIR[2])
    .f('uShadowTexel', 1 / premium.shadowSize).f('uMapSize', MAP_W * TILE, MAP_H * TILE)
    .f('uTime', fr.time).f('uFowOn', fr.fowOn).i('uNumLights', lightCount)
    .tex('uShadow', 8, premium.shadow.depth).tex('uFow', 9, fr.fowTex).tex('uClouds', 10, premium.clouds);
  if (lightCount) {
    p.v4('uLightPos[0]', lightPos.subarray(0, lightCount * 4)).v4('uLightCol[0]', lightCol.subarray(0, lightCount * 4));
  }
}

// ---------- Névoa de guerra na GPU ----------

function updateFowTexture(dt) {
  const P = premium.progs;
  if (fog && fog.version !== premium.fowVersion) {
    premium.fowVersion = fog.version;
    const d = premium.fowRawData;
    for (let i = 0; i < MAP_W * MAP_H; i++) {
      d[i * 2] = fog.visible[i] ? 255 : 0;
      d[i * 2 + 1] = fog.explored[i] ? 255 : 0;
    }
    gl.bindTexture(gl.TEXTURE_2D, premium.fowRaw);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MAP_W, MAP_H, gl.RG, gl.UNSIGNED_BYTE, d);
    glBind(premium.fowBlur);
    P.fowBlur.use().tex('uSrc', 0, premium.fowRaw).f('uTexel', 1 / MAP_W, 1 / MAP_H);
    glFullscreen();
  }
  // Transição suave (ou instantânea numa partida nova)
  const a = premium.fowA, b = premium.fowB;
  glBind(b);
  P.fowLerp.use().tex('uPrev', 0, a.tex[0]).tex('uTarget', 1, premium.fowBlur.tex[0]).f('uK', premium.fowFresh ? 1 : clamp(dt * 5, 0, 1));
  glFullscreen();
  premium.fowFresh = false;
  premium.fowA = b; premium.fowB = a;
  return premium.fowA.tex[0];
}

// ---------- Instâncias ----------

const INST = 20;
function instSet() { return {}; }
function instPush(set, key, m, team, dmg, clip, act, odo, seed) {
  let b = set[key];
  if (!b) b = set[key] = { a: new Float32Array(INST * 32), n: 0 };
  if ((b.n + 1) * INST > b.a.length) { const na = new Float32Array(b.a.length * 2); na.set(b.a); b.a = na; }
  const o = b.n++ * INST, a = b.a;
  a.set(m, o);
  a[o + 12] = team[0]; a[o + 13] = team[1]; a[o + 14] = team[2]; a[o + 15] = dmg;
  a[o + 16] = clip; a[o + 17] = act; a[o + 18] = odo; a[o + 19] = seed;
}

function modelVao(key, setName) {
  const id = key + ':' + setName;
  let v = premium.vaos[id];
  if (v) return v;
  const mesh = premium.models[key];
  const buf = glDynBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  mesh.bindAttribs();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf.buf);
  gl.bufferData(gl.ARRAY_BUFFER, 4096, gl.DYNAMIC_DRAW);
  buf.cap = 4096;
  for (let k = 0; k < 5; k++) glAttrib({ buf: buf.buf, loc: 4 + k, size: 4, stride: INST * 4, off: k * 16, div: 1 });
  gl.bindVertexArray(null);
  v = premium.vaos[id] = { vao, buf, mesh };
  return v;
}

function uploadSet(set, name) {
  for (const key in set) {
    const b = set[key];
    if (!b.n) continue;
    const v = modelVao(key, name);
    glDynUpload(v.buf, b.a, b.n * INST);
    b.v = v;
  }
}

// keys: só estas; skip: todas menos estas
function drawSet(set, keys, skip) {
  for (const key in set) {
    const b = set[key];
    if (!b.n || (keys && !keys[key]) || (skip && skip[key])) continue;
    gl.bindVertexArray(b.v.vao);
    gl.drawElementsInstanced(gl.TRIANGLES, b.v.mesh.count, b.v.mesh.itype, 0, b.n);
  }
  gl.bindVertexArray(null);
}

const teamLinCache = {};
// No 3D a luz e o ACES lavam as cores: cada facção ganha uma versão mais pura e saturada
const PREMIUM_TEAM_HEX = { '#3d8bfd': '#2a4ea8', '#d9533b': '#e3121b', '#e0a526': '#ffc21a' };
function teamLin(team) {
  const hex = PREMIUM_TEAM_HEX[TEAMS[team].color] || TEAMS[team].color;
  return teamLinCache[hex] || (teamLinCache[hex] = hexLinear(hex));
}

const UNIT_KEYS = { tank_hull: 1, tank_turret: 1, tank_barrel: 1, scout_body: 1, scout_wheel: 1, arty_hull: 1, arty_gun: 1,
  harv_body: 1, harv_drum: 1, harv_cargo: 1, trooper_body: 1, rocketeer_body: 1, leg: 1 };

function poseUnit(set, u) {
  const s = unitVis(u);
  const z = terrainHeightAt(u.x, u.y);
  // Veículos 25% maiores que a escala real (leitura de longe; colisão e regras não mudam)
  const W = a34trs(u.x, u.y, z, u.angle, UNIT_VIS_SCALE);
  const tc = teamLin(u.team);
  const f = u.hp / u.maxHp;
  const dmg = f < 0.6 ? clamp((0.6 - f) * 1.3, 0, 0.75) : 0;
  const P = (key, m) => instPush(set, key, m, tc, dmg, 1e4, 1, s.odo, s.seed);
  switch (u.type) {
    case 'tank': {
      P('tank_hull', W);
      const T = a34mul(W, a34mul(a34trans(-1, 0, 7.6), a34rotZ(u.turret - u.angle)));
      P('tank_turret', T);
      P('tank_barrel', a34mul(T, a34trans(7.4 - s.recoil * 3.2, 0, 2.2)));
      break;
    }
    case 'scout': {
      P('scout_body', W);
      const spin = s.odo / 3.1;
      for (const wx of [-6.3, 6.3]) for (const wy of [-5.4, 5.4]) {
        P('scout_wheel', a34mul(W, a34mul(a34trans(wx, wy, 3.1), a34rotY(spin))));
      }
      break;
    }
    case 'artillery': {
      P('arty_hull', W);
      P('arty_gun', a34mul(W, a34mul(a34trans(-3, 0, 9.4), a34mul(a34rotY(-0.42), a34trans(-s.recoil * 4, 0, 0)))));
      break;
    }
    case 'harvester': {
      P('harv_body', W);
      P('harv_drum', a34mul(W, a34mul(a34trans(16.2, 0, 4), a34rotY(s.drum))));
      const k = clamp(u.cargo / UNIT_TYPES.harvester.capacity, 0, 1);
      if (k > 0.03) P('harv_cargo', a34mul(W, a34mul(a34trans(0, 0, 6.5), a34scale(1, 1, 0.3 + k * 1.15))));
      break;
    }
    default: {
      // Infantaria um terço maior que a escala real: senão some no meio dos blindados
      // Esquadrão de três (só desenho: a unidade continua uma só na simulação)
      const walking = u.path && u.path.length;
      const key = u.type === 'rocketeer' ? 'rocketeer_body' : 'trooper_body';
      const off = [[3.8, 0], [-3.1, -4.4], [-2.8, 4.6]];
      for (let m = 0; m < 3; m++) {
        const Wi = a34mul(W, a34mul(a34trans(off[m][0], off[m][1], 0), a34scale(1.55, 1.55, 1.55)));
        const sw = walking ? Math.sin(s.odo * 0.42 + m * 2.1) * 0.65 : 0;
        P(key, Wi);
        P('leg', a34mul(Wi, a34mul(a34trans(0, -1.05, 5.3), a34rotY(sw))));
        P('leg', a34mul(Wi, a34mul(a34trans(0, 1.05, 5.3), a34rotY(-sw))));
      }
    }
  }
}

function poseBuilding(set, holoSet, b, ghost) {
  const z = terrainHeightAt(b.x, b.y);
  const rot = doorOnTop(b) ? Math.PI : 0;
  const W = a34trs(b.x, b.y, z, rot);
  const tc = teamLin(b.team);
  const hp = b.team !== 0 && b.seenHp !== undefined && !isVisibleToPlayer(b) ? b.seenHp : b.hp;
  const f = hp / b.maxHp;
  const dmg = f < 0.5 ? 0.25 + (0.5 - f) * 1.4 : 0;
  const grow = clamp((gameTime - b.born) / 1.4, 0, 1);
  const H = BUILDING_HEIGHT[b.type] || 30;
  const clip = grow >= 1 ? 1e4 : -1 + grow * (H + 2);
  const powered = !teams[b.team] || !lowPower(b.team);
  const act = b.type === 'factory' ? (b.queue && b.queue.length ? 1 : 0.12) : b.type === 'power' ? (powered ? 1 : 0.1) : 1;
  const seed = (b.id || 1) * 1.37;
  const P = (key, m) => instPush(set, key, m, tc, dmg, clip, act, 0, seed);
  const t = gameTime;
  switch (b.type) {
    case 'hq': P('hq', W); break;
    case 'power': P('power', W); break;
    case 'refinery': P('refinery', W); break;
    case 'factory': P('factory', W); break;
    case 'barracks':
      P('barracks', W);
      P('flag', a34mul(W, a34trans(-20.6, -21, 31.6)));
      break;
    case 'radar':
      P('radar', W);
      P('radar_dish', a34mul(W, a34mul(a34trans(-2, -4, 24), a34rotZ(powered ? t * 1.5 : 0.6))));
      break;
    case 'turret':
      P('turret_base', W);
      P('turret_head', a34mul(W, a34mul(a34trans(0, 0, 9), a34rotZ((b.turret || 0) - rot))));
      break;
  }
}

// ---------- Quadro ----------

const decalData = { mul: new Float32Array(12 * 512), add: new Float32Array(12 * 256) };
let decalMulN = 0, decalAddN = 0;
function decal(kind, x, y, z, ang, w, h, type, alpha, r, g, b, seed) {
  const add = kind === 'add';
  let arr = add ? decalData.add : decalData.mul;
  let n = add ? decalAddN : decalMulN;
  if ((n + 1) * 12 > arr.length) {
    const na = new Float32Array(arr.length * 2); na.set(arr);
    if (add) decalData.add = na; else decalData.mul = na;
    arr = na;
  }
  arr.set([x, y, z, ang, w, h, type, alpha, r, g, b, seed], n * 12);
  if (add) decalAddN++; else decalMulN++;
}

function decalVao(name) {
  const id = 'decal:' + name;
  let v = premium.vaos[id];
  if (v) return v;
  const buf = glDynBuffer();
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  glAttrib({ buf: premium.quad, loc: 0, size: 2 });
  gl.bindBuffer(gl.ARRAY_BUFFER, buf.buf);
  gl.bufferData(gl.ARRAY_BUFFER, 4096, gl.DYNAMIC_DRAW);
  buf.cap = 4096;
  for (let k = 0; k < 3; k++) glAttrib({ buf: buf.buf, loc: 4 + k, size: 4, stride: 48, off: k * 16, div: 1 });
  gl.bindVertexArray(null);
  v = premium.vaos[id] = { vao, buf };
  return v;
}

const decalSeen3 = new WeakSet();

function collectDecals(onScreen) {
  decalMulN = 0; decalAddN = 0;
  // Queimados e escombros da simulação
  decals.forEach((d, i) => {
    if (gameOptions.fog && gameState !== 'title' && !decalSeen3.has(d)) {
      if (!fxVisible(d.x, d.y)) return;
      decalSeen3.add(d);
    }
    if (!onScreen(d.x, d.y, 120)) return;
    const z = terrainHeightAt(d.x, d.y) + 0.5;
    if (d.rubble) decal('mul', d.x, d.y, z, 0, d.w * TILE * 1.25, d.h * TILE * 1.25, 6, 1, 0.08, 0.07, 0.06, (d.x * 7 + d.y) % 10);
    else decal('mul', d.x, d.y, z, d.angle || 0, d.r * 2.8, d.r * 2.6, 0, 1, 0.05, 0.04, 0.035, (d.x * 3 + d.y * 5) % 10);
  });
  // Marcas de esteira
  pfx.tracks.forEach(m => {
    if (!onScreen(m.x, m.y, 20)) return;
    const k = 1 - m.t / 12;
    decal('mul', m.x, m.y, terrainHeightAt(m.x, m.y) + 0.3, m.a, 5, m.w * 2.6, 1, k * (m.wheel ? 0.6 : 1), 0.12, 0.09, 0.06, 0);
  });
  // Ondas de choque
  pfx.waves.forEach(w => {
    if (w.t < 0) return;
    const k = w.t / w.life;
    const r = w.r0 + (w.r1 - w.r0) * Math.sqrt(k);
    if (w.water) decal('add', w.x, w.y, w.z, w.x % 6.28, r * 2, r * 2.15, 4, (1 - k) * (1 - k) * 0.28, 0.75, 0.88, 0.95, 0);
    else decal('add', w.x, w.y, w.z, 0, r * 2, r * 2, 4, Math.min(1, w.t / 0.06) * (1 - k) * (1 - k) * 0.4, 0.9, 0.62, 0.38, 0);
  });
  // Crateras: chão queimado com brasa na borda nos primeiros segundos; na água, espuma que se desfaz
  pfx.scorch.forEach(c => {
    if (!onScreen(c.x, c.y, 60)) return;
    const k = c.t / c.life;
    const seed = (c.x * 3 + c.y * 5) % 10;
    if (c.water) { decal('add', c.x, c.y, c.z, 0, c.r * 1.4, c.r * 1.4, 10, (1 - k) * 0.3, 0.75, 0.85, 0.9, seed); return; }
    decal('mul', c.x, c.y, c.z, seed, c.r * 2, c.r * 2, 0, Math.min(1, c.t * 6) * (1 - k * k), 0.06, 0.05, 0.04, seed);
    const hot = Math.max(0, 1 - c.t / 3.5);
    if (hot > 0) decal('add', c.x, c.y, c.z + 0.1, seed, c.r * 1.7, c.r * 1.7, 11, hot * hot, 1.0, 0.35, 0.08, seed);
  });
}

function premiumFrame(ctx, dt) {
  const t0 = performance.now();
  premium.frames++;
  refreshDirtyTiles();
  buildTerrain3D(gameMap);
  updateTerrainLive();
  const paused = gameState === 'paused';
  fx3Update(paused ? 0 : dt);

  // Tamanho
  const cssW = Math.round(camera.w * uiScale), cssH = Math.round(camera.h * uiScale);
  const dpr = Math.min(2, screenDpr) * premium.scale;
  const w = Math.max(64, Math.round(cssW * dpr)), h = Math.max(64, Math.round(cssH * dpr));
  if (glCanvas.width !== w || glCanvas.height !== h) { glCanvas.width = w; glCanvas.height = h; }
  if (glCanvas.style.width !== cssW + 'px') glCanvas.style.width = cssW + 'px';
  if (glCanvas.style.height !== cssH + 'px') glCanvas.style.height = cssH + 'px';
  if (glCanvas.style.display !== 'block') glCanvas.style.display = 'block';
  const T = premiumTargets(w, h);

  // Câmera (com tremor)
  const z = camera.zoom;
  const shx = screenShake > 0.3 ? (Math.random() - 0.5) * screenShake : 0;
  const shy = screenShake > 0.3 ? (Math.random() - 0.5) * screenShake : 0;
  const cx = camera.x + shx, cy = camera.y + shy;
  const VW = camera.ww, VH = camera.wh;
  const time = performance.now() / 1000;
  const fowOn = gameOptions.fog && gameState !== 'title' ? 1 : 0;
  const fr = {
    vp: premiumCamera(cx, cy, VW, VH, z),
    lvp: premiumLightMatrix(cx, cy, VW, VH),
    time, fowOn,
  };
  fr.fowTex = updateFowTexture(dt);
  gatherLights(cx, cy, VW, VH);

  // O que aparece
  const onScreen = (x, y, m) => x > cx - m && x < cx + VW + m && y > cy - m && y < cy + VH + m + 40;
  const set = instSet(), holo = instSet();
  const shownB = buildings.filter(b => onScreen(b.x, b.y, 130) && isExploredByPlayer(b));
  const shownG = ghosts.filter(b => onScreen(b.x, b.y, 130));
  const shownU = units.filter(u => onScreen(u.x, u.y, 50) && isVisibleToPlayer(u));
  shownG.forEach(b => poseBuilding(set, holo, b, true));
  shownB.forEach(b => poseBuilding(set, holo, b, false));
  shownU.forEach(u => poseUnit(set, u));
  // Destroços de prédios (pedaços espalhados) e destroços voando
  decals.forEach(d => {
    if (!d.rubble || !decalSeen3.has(d) && gameOptions.fog && gameState !== 'title' || !onScreen(d.x, d.y, 100)) return;
    const rng = makeRng(Math.round(d.x * 13 + d.y));
    const n = d.w * d.h * 6;
    const g = terrainHeightAt(d.x, d.y);
    for (let i = 0; i < n; i++) {
      const x = d.x + (rng() - 0.5) * d.w * TILE * 0.9, y = d.y + (rng() - 0.5) * d.h * TILE * 0.9;
      const sc = 2 + rng() * 4.5;
      const m = a34mul(a34trs(x, y, g + 1.5 - rng() * 1.5, rng() * 6.3, sc), a34rotX((rng() - 0.5) * 0.8));
      instPush(set, 'chunk' + (i % 3), m, [0.3, 0.3, 0.3], 0.5 * rng(), 1e4, 1, 0, rng() * 10);
    }
  });
  pfx.debris.forEach(c => {
    if (!onScreen(c.x, c.y, 30)) return;
    const k = c.t > c.life ? 1 - (c.t - c.life) / 6 : 1;
    const m = a34mul(a34trs(c.x, c.y, c.z - (1 - k) * 2, c.rz, c.s), a34rotX(c.rx));
    instPush(set, 'chunk' + c.k, m, [0.3, 0.3, 0.3], 0.6, 1e4, 1, 0, 0);
  });
  // Projéteis com corpo (foguete e obus)
  projectiles.forEach(p => {
    if ((p.kind !== 'rocket' && p.kind !== 'arty') || !onScreen(p.x, p.y, 30) || !fxVisible(p.x, p.y)) return;
    const zz = projZ(p);
    const a = Math.atan2(p.ty - p.y, p.tx - p.x);
    instPush(set, p.kind === 'rocket' ? 'rocket' : 'shell', a34trs(p.x, p.y, zz, a, p.kind === 'rocket' ? 1.1 : 1.3), [0.5, 0.5, 0.5], 0, 1e4, 1, 0, 0);
  });
  // Fantasma do prédio a posicionar (holograma)
  const ghost = placementInfo();
  if (ghost) {
    const def = BUILDING_TYPES[ghost.type];
    const gb = { type: ghost.type, team: 0, tx: ghost.x, ty: ghost.y, w: def.w, h: def.h, x: (ghost.x + def.w / 2) * TILE, y: (ghost.y + def.h / 2) * TILE, hp: 1, maxHp: 1, born: -99, id: 7 };
    const tmp = instSet();
    poseBuilding(tmp, null, gb, false);
    for (const k in tmp) {
      const b = tmp[k];
      for (let i = 0; i < b.n; i++) {
        const a = b.a.subarray(i * INST, i * INST + INST);
        instPush(holo, k, a.subarray(0, 12), [0.2, 1, 0.5], 0, 1e4, ghost.ok ? 1 : 2, 0, 0);
      }
    }
  }
  collectDecals(onScreen);
  // Sombras de contato e anéis de seleção
  shownU.forEach(u => {
    const g = terrainHeightAt(u.x, u.y) + 0.35;
    decal('mul', u.x + 1, u.y + 1, g, u.angle, u.radius * 2.6, u.radius * 2.1, 3, 0.85, 0.02, 0.02, 0.02, 0);
    if (u.selected) {
      // Anel de seleção do tamanho do modelo, com sombra escura por baixo para destacar na areia
      const rr = (u.radius * UNIT_VIS_SCALE + 5) * 2;
      decal('mul', u.x, u.y, g + 0.05, 0, rr * 1.08, rr * 1.08, 3, 0.45, 0.05, 0.05, 0.05, 0);
      decal('add', u.x, u.y, g + 0.1, 0, rr, rr, 2, 0.6, 0.85, 1.0, 0.9, 0);
    }
    {
      // Anel fraco na cor do time sob cada unidade (lê o dono mesmo sobre areia, cristal ou fumaça)
      const tc = teamLin(u.team);
      decal('add', u.x, u.y, g + 0.1, 0, (u.radius + 3) * 2, (u.radius + 3) * 2, 2, 0.45, tc[0], tc[1], tc[2], 0);
    }
  });
  // Trilhas de terra batida ligando cada prédio ao vizinho mais perto do QG (rede em árvore por time)
  [0, 1, 2].forEach(team => {
    const own = buildings.filter(b => b.team === team && isExploredByPlayer(b) && onScreen(b.x, b.y, 600));
    if (own.length < 2) return;
    const hq = own.find(b => b.type === 'hq') || own[0];
    const dHq = b => Math.hypot(b.x - hq.x, b.y - hq.y);
    own.forEach(b => {
      if (b === hq) return;
      let best = hq, bd = dHq(b);
      own.forEach(o => {
        if (o === b || dHq(o) >= dHq(b)) return;
        const d = Math.hypot(o.x - b.x, o.y - b.y);
        if (d < bd) { bd = d; best = o; }
      });
      if (bd > TILE * 14 || !onScreen(b.x, b.y, 300) && !onScreen(best.x, best.y, 300)) return;
      const mx = (b.x + best.x) / 2, my = (b.y + best.y) / 2;
      const z = Math.max(terrainHeightAt(b.x, b.y), terrainHeightAt(best.x, best.y), terrainHeightAt(mx, my)) + 0.2;
      decal('mul', mx, my, z, Math.atan2(best.y - b.y, best.x - b.x), bd + 24, 30, 9, 1, 0.72, 0.6, 0.47, (b.id % 13) * 0.61);
    });
  });
  shownB.forEach(b => {
    const g = terrainHeightAt(b.x, b.y) + 0.3;
    // Chão pisado e sujo em volta (borda irregular): o prédio assenta no terreno
    if (b.type === 'turret') {
      // Torre: base redonda, sombra de contato redonda (um quadrado escuro lia como buraco)
      decal('mul', b.x + 2, b.y + 3, g, 0, 44, 44, 3, 0.7, 0.05, 0.05, 0.05, 0);
    } else {
      decal('mul', b.x, b.y + 4, g - 0.05, 0, b.w * TILE + 34, b.h * TILE + 34, 6, 0.85, 0.62, 0.52, 0.42, (b.id % 17) * 0.37);
      decal('mul', b.x + 3, b.y + 3, g, 0, b.w * TILE + 12, b.h * TILE + 12, 5, 1, 0.03, 0.03, 0.03, 0);
    }
    if (b.selected) decal('add', b.x, b.y, g + 2.6, 0, b.w * TILE + 8, b.h * TILE + 8, 7, 1, 0.35, 1.0, 0.4, 0);
  });
  if (input.hoverEnemy) {
    const e = input.hoverEnemy;
    const g = terrainHeightAt(e.x, e.y) + 0.5;
    if (e.kind === 'building') decal('add', e.x, e.y, g + 2.6, 0, e.w * TILE + 8, e.h * TILE + 8, 7, 1, 1.0, 0.25, 0.15, 0);
    else decal('add', e.x, e.y, g, 0, (e.radius + 5) * 2, (e.radius + 5) * 2, 2, 1, 1.0, 0.25, 0.15, 0);
  }
  if (ghost) {
    // Área onde dá para construir
    const own = teamBuildings(0);
    const x0 = Math.max(0, Math.floor(cx / TILE)), y0 = Math.max(0, Math.floor(cy / TILE));
    const x1 = Math.min(MAP_W - 1, Math.ceil((cx + VW) / TILE)), y1 = Math.min(MAP_H - 1, Math.ceil((cy + VH) / TILE));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!isBuildable(gameMap, x, y)) continue;
      if (!own.some(b => b.type !== 'turret' && rectGap(x, y, 1, 1, b.tx, b.ty, b.w, b.h) <= BUILD_RANGE)) continue;
      decal('add', x * TILE + 16, y * TILE + 16, terrainHeightAt(x * TILE + 16, y * TILE + 16) + 0.6, 0, 32, 32, 8, 0.8, 0.3, 1.0, 0.5, 0);
    }
  }

  uploadSet(set, 'main');
  uploadSet(holo, 'holo');

  // ---- Sombra ----
  const P = premium.progs, TP = t3programs();
  glBind(premium.shadow);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  gl.disable(gl.CULL_FACE);
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(1.6, 3.0);
  const lightRange = [cx - 300, cy - 300, cx + VW + 300, cy + VH + 300];
  TP.shadow.use().m4('uVP', fr.lvp);
  drawTerrainChunks(terrainChunksIn(lightRange[0], lightRange[1], lightRange[2], lightRange[3]));
  P.modelShadow.use().m4('uVP', fr.lvp).f('uTime', time);
  drawSet(set);
  drawProps(lightRange[0], lightRange[1], lightRange[2], lightRange[3], true);
  if (t3.crystalCount) {
    TP.crystalShadow.use().m4('uVP', fr.lvp).tex('uLive', 0, t3.texLive);
    gl.bindVertexArray(t3.crystalVao);
    gl.drawElementsInstanced(gl.TRIANGLES, t3.shard.count, t3.shard.itype, 0, t3.crystalCount);
    gl.bindVertexArray(null);
  }
  gl.disable(gl.POLYGON_OFFSET_FILL);

  // ---- Cena principal (HDR) ----
  const main = T.msaa || T.scene;
  glBind(main);
  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const viewChunks = terrainChunksIn(cx - 40, cy - 60, cx + VW + 40, cy + VH + 120);
  TP.terrain.use();
  setLit(TP.terrain, fr);
  TP.terrain.tex('uAlb', 0, t3.texAlb).tex('uDet', 1, t3.texDet).tex('uMicro', 2, t3micro).tex('uLive', 3, t3.texLive).tex('uTiles', 4, t3.texTiles)
    .f('uOrigin', -T3_BORDER, -T3_BORDER).f('uExtent', T3_EXTENT).f('uZoomDetail', clamp((z * dpr - 1) * 0.8, 0, 1));
  drawTerrainChunks(viewChunks);
  if (t3.hasWater) {
    TP.water.use();
    setLit(TP.water, fr);
    TP.water.tex('uHeightTex', 0, t3.texHeight).tex('uAlb', 1, t3.texAlb).tex('uMicro', 2, t3micro)
      .f('uOrigin', -T3_BORDER, -T3_BORDER).f('uExtent', T3_EXTENT).f('uN', T3_N);
    gl.bindVertexArray(t3.waterVao);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }
  // Marcas no chão
  gl.depthMask(false);
  gl.enable(gl.BLEND);
  gl.enable(gl.POLYGON_OFFSET_FILL);
  gl.polygonOffset(-1, -4);
  if (decalMulN) {
    const v = decalVao('mul');
    glDynUpload(v.buf, decalData.mul, decalMulN * 12);
    gl.blendFunc(gl.ZERO, gl.SRC_COLOR);
    P.decalMul.use().m4('uVP', fr.vp).f('uTime', time);
    gl.bindVertexArray(v.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, decalMulN);
  }
  if (decalAddN) {
    const v = decalVao('add');
    glDynUpload(v.buf, decalData.add, decalAddN * 12);
    gl.blendFunc(gl.ONE, gl.ONE);
    P.decalAdd.use().m4('uVP', fr.vp).f('uTime', time);
    gl.bindVertexArray(v.vao);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, decalAddN);
  }
  gl.bindVertexArray(null);
  gl.disable(gl.POLYGON_OFFSET_FILL);
  gl.disable(gl.BLEND);
  gl.depthMask(true);
  // Cristais
  if (t3.crystalCount) {
    TP.crystal.use();
    setLit(TP.crystal, fr);
    TP.crystal.tex('uLive', 0, t3.texLive);
    gl.bindVertexArray(t3.crystalVao);
    gl.drawElementsInstanced(gl.TRIANGLES, t3.shard.count, t3.shard.itype, 0, t3.crystalCount);
    gl.bindVertexArray(null);
  }
  // Modelos
  P.model.use();
  setLit(P.model, fr);
  P.model.f('uGroundAO', 0.55).f('uShadowPush', 0);
  drawSet(set, null, UNIT_KEYS);
  P.model.f('uShadowPush', 3.5);
  drawProps(cx - 60, cy - 60, cx + VW + 60, cy + VH + 160, false);
  P.model.f('uShadowPush', 0);
  // Unidades atrás de prédios e mesas: silhueta (antes das unidades, para não marcar a própria unidade)
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  gl.depthFunc(gl.GREATER);
  P.xray.use();
  setLit(P.xray, fr);
  drawSet(set, UNIT_KEYS);
  gl.depthFunc(gl.LEQUAL);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
  P.model.use();
  drawSet(set, UNIT_KEYS);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);
  // Holograma do prédio a posicionar
  if (ghost) {
    P.holo.use();
    setLit(P.holo, fr);
    drawSet(holo);
  }
  gl.depthMask(true);
  gl.disable(gl.BLEND);

  // Resolve a multiamostragem
  if (T.msaa) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, T.msaa.fb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, T.scene.fb);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }

  // Copia a profundidade para as partículas suaves
  if (T.depthCopy) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, T.scene.fb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, T.depthCopy.fb);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
  }
  premium.depthTex = T.depthCopy ? T.depthCopy.tex : null;
  // ---- Partículas (transparentes, ordenadas de trás para a frente) ----
  glBind(T.scene);
  drawParticles3D(fr, cx, cy, VW, VH, z);

  // ---- Pós-processamento ----
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  let src = T.scene.tex[0], sw = w, sh = h;
  T.bloom.forEach((bt, i) => {
    glBind(bt);
    P.down.use().tex('uSrc', 0, src).f('uTexel', 1 / sw, 1 / sh).f('uPrefilter', i === 0 ? 1 : 0);
    glFullscreen();
    src = bt.tex[0]; sw = bt.w; sh = bt.h;
  });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  for (let i = T.bloom.length - 1; i > 0; i--) {
    const from = T.bloom[i], to = T.bloom[i - 1];
    glBind(to);
    P.up.use().tex('uSrc', 0, from.tex[0]).f('uTexel', 1 / from.w, 1 / from.h).f('uRadius', 1);
    glFullscreen();
  }
  gl.disable(gl.BLEND);
  const useFxaa = !premium.samples;
  glBind(useFxaa ? T.ldr : null);
  if (!useFxaa) gl.viewport(0, 0, w, h);
  P.comp.use().tex('uScene', 0, T.scene.tex[0]).tex('uBloom', 1, T.bloom[0].tex[0]).f('uTexel', 1 / w, 1 / h)
    .f('uExposure', 1.06 - premiumFlash * 2.2).f('uBloomK', 0.62).f('uTime', time).f('uTilt', gameState === 'title' ? 1 : 0)
    .f('uVignette', 0.6).f('uFlash', premiumFlash);
  glFullscreen();
  if (useFxaa) {
    glBind(null);
    gl.viewport(0, 0, w, h);
    P.fxaa.use().tex('uSrc', 0, T.ldr.tex[0]).f('uTexel', 1 / w, 1 / h);
    glFullscreen();
  }

  // ---- Por cima, no canvas 2D: barras, marcadores, caixa de seleção ----
  ctx.clearRect(0, 0, viewW, viewH);
  premiumOverlay(ctx, dt, cx, cy, z, shownB, shownG, shownU);
  premium.frameMs = performance.now() - t0;
}

// Prédio pronto sendo posicionado: onde e se pode
function placementInfo() {
  const c = teams[0] && teams[0].construct;
  if (input.mode !== 'place' || !c || !c.ready || gameState !== 'playing') return null;
  const def = BUILDING_TYPES[c.type];
  const spot = placementSpot(def);
  const check = checkPlacement(0, c.type, spot.x, spot.y);
  return { type: c.type, x: spot.x, y: spot.y, ok: check.ok, tiles: check.tiles };
}

// Partículas: instâncias ordenadas pela profundidade
let partBuf = null, partVao = null, partArr = new Float32Array(12 * 1024), partIdx = new Uint32Array(1024), partKey = new Float32Array(1024);

function drawParticles3D(fr, cx, cy, VW, VH, zoom) {
  const d = pfx.d;
  const n = pfx.n;
  // Traçantes das balas e cartuchos (vivem um quadro)
  const extra = [];
  projectiles.forEach(p => {
    if (!fxVisible(p.x, p.y) || p.x < cx - 30 || p.x > cx + VW + 30 || p.y < cy - 30 || p.y > cy + VH + 60) return;
    const a = Math.atan2(p.ty - p.y, p.tx - p.x);
    const sp = SHOTS[p.kind].speed;
    const z = projZ(p);
    if (p.kind === 'bullet') extra.push([p.x, p.y, z, 3.2, PT_TRACER, 0, 1.0, 0, Math.cos(a) * sp * 0.65, Math.sin(a) * sp * 0.65, 0, 0]);
    else if (p.kind === 'shell') {
      extra.push([p.x, p.y, z, 3.6, PT_TRACER, 0, 1.0, 0, Math.cos(a) * sp * 0.4, Math.sin(a) * sp * 0.4, 0, 0]);
      extra.push([p.x, p.y, z, 6, PT_FLASH, 0.5, 0.5, 0, 0, 0, 0, 0]);
    } else if (p.kind === 'rocket') {
      extra.push([p.x - Math.cos(a) * 4, p.y - Math.sin(a) * 4, z, 5, PT_FLASH, 0.4, 0.8, 0, 0, 0, 0, 0]);
    } else extra.push([p.x, p.y, z, 7, PT_FLASH, 0.5, 0.6, 0, 0, 0, 0, 0]);
  });
  const total = n + extra.length;
  if (!total) return;
  if (partArr.length < total * 12) { partArr = new Float32Array(total * 24); partIdx = new Uint32Array(total * 2); partKey = new Float32Array(total * 2); }
  let m = 0;
  for (let i = 0; i < n; i++) {
    const o = i * PFX_STRIDE;
    const x = d[o], y = d[o + 1];
    if (x < cx - 60 || x > cx + VW + 60 || y < cy - 60 || y > cy + VH + 140) continue;
    partIdx[m] = i; partKey[m] = PREMIUM_K * y + d[o + 2]; m++;
  }
  const order = Array.from(partIdx.subarray(0, m)).map((v, k) => k);
  const keys = partKey;
  order.sort((a, b) => keys[a] - keys[b]);
  let q = 0;
  for (let k = 0; k < order.length; k++) {
    const i = partIdx[order[k]], o = i * PFX_STRIDE;
    const life = d[o + 7], t = d[o + 6] / life;
    partArr.set([d[o], d[o + 1], d[o + 2], d[o + 8], d[o + 10], t, d[o + 11], d[o + 14] + t * (d[o + 15] - 0.5) * 2, d[o + 3], d[o + 4], d[o + 5], d[o + 15]], q * 12);
    q++;
  }
  extra.forEach(e => { partArr.set(e, q * 12); q++; });
  if (!partVao) {
    partBuf = glDynBuffer();
    partVao = gl.createVertexArray();
    gl.bindVertexArray(partVao);
    glAttrib({ buf: premium.quad, loc: 0, size: 2 });
    gl.bindBuffer(gl.ARRAY_BUFFER, partBuf.buf);
    gl.bufferData(gl.ARRAY_BUFFER, 4096, gl.DYNAMIC_DRAW);
    partBuf.cap = 4096;
    for (let k = 0; k < 3; k++) glAttrib({ buf: partBuf.buf, loc: 4 + k, size: 4, stride: 48, off: k * 16, div: 1 });
    gl.bindVertexArray(null);
  }
  glDynUpload(partBuf, partArr, q * 12);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.depthMask(false);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const P = premium.progs.part;
  P.use().m4('uVP', fr.vp).f('uView', camera.w, camera.h).f('uZoom', zoom)
    .f('uSunDir', SUN_DIR[0], SUN_DIR[1], SUN_DIR[2]).f('uSunCol', SUN_COL[0], SUN_COL[1], SUN_COL[2])
    .f('uSkyCol', SKY_COL[0], SKY_COL[1], SKY_COL[2]).f('uGndCol', GND_COL[0], GND_COL[1], GND_COL[2])
    .f('uMapSize', MAP_W * TILE, MAP_H * TILE).f('uFowOn', fr.fowOn)
    .tex('uAtlas', 0, premium.atlas).tex('uFow', 9, fr.fowTex)
    .f('uSoft', premium.depthTex ? 1 : 0).f('uDepthR', PREMIUM_K * (VH + 400) + 400).f('uRes', premium.targets.w, premium.targets.h);
  if (premium.depthTex) P.tex('uDepth', 11, premium.depthTex);
  gl.bindVertexArray(partVao);
  gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, q);
  gl.bindVertexArray(null);
  gl.depthMask(true);
  gl.disable(gl.BLEND);
}

// ---------- Camada 2D por cima do 3D ----------

function premiumOverlay(ctx, dt, cx, cy, z, shownB, shownG, shownU) {
  const K = PREMIUM_K;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, camera.w, camera.h);
  ctx.clip();
  ctx.scale(z, z);
  ctx.translate(-cx, -cy);
  drawOrderMarkers(ctx, dt);
  drawRally(ctx);
  // Posicionamento: quadrados verdes/vermelhos sob o holograma
  const ghost = placementInfo();
  if (ghost) {
    ghost.tiles.forEach(t => {
      // Só contorno (e um véu leve no que está bloqueado): o holograma 3D fica visível por cima
      if (!t.ok) {
        ctx.fillStyle = 'rgba(255,60,50,0.14)';
        ctx.fillRect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
      }
      ctx.strokeStyle = t.ok ? 'rgba(140,255,150,0.55)' : 'rgba(255,90,70,0.95)';
      ctx.lineWidth = 1;
      ctx.strokeRect(t.x * TILE + 1.5, t.y * TILE + 1.5, TILE - 3, TILE - 3);
    });
  }
  // Barras de vida acima dos modelos
  shownB.concat(shownG).forEach(b => {
    const hp = b.team !== 0 && b.seenHp !== undefined && !isVisibleToPlayer(b) ? b.seenHp : b.hp;
    const f = hp / b.maxHp;
    const wpx = b.w * TILE;
    const lift = K * (terrainHeightAt(b.x, b.y) + (BUILDING_HEIGHT[b.type] || 30) * 0.45);
    const top = b.ty * TILE - lift;
    if (b.selected || hp < b.maxHp) drawHealthBar(ctx, b.tx * TILE + 4, top - 6, wpx - 8, f);
    if (b.repairing) {
      const k = (performance.now() / 600) % 1;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#7dff7a';
      ctx.font = 'bold 16px ' + UI_FONT;
      ctx.textAlign = 'center';
      ctx.fillText('+', b.x, top + 18 - k * 16);
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }
  });
  shownU.forEach(u => {
    const now = performance.now();
    let s = barSeen.get(u);
    if (!s) { s = { hp: u.hp, t: -1e9 }; barSeen.set(u, s); }
    if (u.hp < s.hp) s.t = now;
    s.hp = u.hp;
    const recent = now - s.t < 2500;
    if (u.selected || (u.hp < u.maxHp && (recent || u.hp < u.maxHp * 0.35))) {
      const w = Math.max(14, u.radius * 2 + 2);
      const lift = K * (terrainHeightAt(u.x, u.y) + (UNIT_HEIGHT[u.type] || 12));
      ctx.globalAlpha = u.selected || recent ? 1 : 0.75;
      drawHealthBar(ctx, u.x - w / 2, u.y - lift - u.radius * 0.5 - 6, w, u.hp / u.maxHp);
      ctx.globalAlpha = 1;
    }
  });
  ctx.restore();
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

// ---------- Resolução dinâmica ----------

// Com a placa de vídeo sobrando, sobe a resolução; quando aperta, desce (nunca abaixo de 50%)
function premiumAdapt(frameDt) {
  if (premium.fixedScale || frameDt <= 0 || frameDt > 0.5) return;
  premium.ema += (frameDt - premium.ema) * 0.05;
  if (premium.ema > 1 / 40) { premium.slow += frameDt; premium.fast = 0; } else if (premium.ema < 1 / 56) { premium.fast += frameDt; premium.slow = 0; }
  const max = premium.tier === 'software' ? 0.8 : 1;
  // Piso: nunca abaixo de 0,7 px de imagem por px da tela (abaixo disso a imagem fica borrada demais)
  const min = Math.max(0.35, Math.ceil(0.7 / Math.min(2, screenDpr) * 10) / 10);
  if (premium.slow > 1.5 && premium.scale > min) { premium.scale = Math.max(min, Math.round((premium.scale - 0.1) * 10) / 10); premium.slow = 0; }
  else if (premium.fast > 4 && premium.scale < max) { premium.scale = Math.min(max, Math.round((premium.scale + 0.1) * 10) / 10); premium.fast = 0; }
}
