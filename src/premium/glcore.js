// Modo Premium: utilidades WebGL2 (shaders, buffers, texturas, alvos de desenho e matrizes).
// O modo Premium desenha o mundo em 3D de verdade (luz, sombras, HDR, bloom), mas numa
// projeção oblíqua que mantém o chão exatamente onde ele estava no 2D: o mouse, a câmera
// e toda a lógica do jogo continuam iguais. Nada aqui altera a simulação.

let gl = null;          // contexto WebGL2 do modo Premium (null se indisponível)
let glCanvas = null;

// ---------- Shaders ----------

function glShader(type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    const lines = src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n');
    console.warn(lines);
    throw new Error('shader: ' + log);
  }
  return s;
}

// Programa com cache de uniforms. "defs" vira #define no começo dos dois shaders.
function glProgram(vs, fs, defs) {
  const head = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2D;\n' +
    (defs || []).map(d => '#define ' + d + '\n').join('');
  const p = gl.createProgram();
  gl.attachShader(p, glShader(gl.VERTEX_SHADER, head + vs));
  gl.attachShader(p, glShader(gl.FRAGMENT_SHADER, head + fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
  const locs = {};
  const loc = n => (n in locs ? locs[n] : (locs[n] = gl.getUniformLocation(p, n)));
  const prog = {
    p,
    use() { gl.useProgram(p); return prog; },
    f(n, a, b, c, d) {
      const l = loc(n); if (l === null) return prog;
      if (d !== undefined) gl.uniform4f(l, a, b, c, d);
      else if (c !== undefined) gl.uniform3f(l, a, b, c);
      else if (b !== undefined) gl.uniform2f(l, a, b);
      else gl.uniform1f(l, a);
      return prog;
    },
    i(n, v) { const l = loc(n); if (l !== null) gl.uniform1i(l, v); return prog; },
    m4(n, m) { const l = loc(n); if (l !== null) gl.uniformMatrix4fv(l, false, m); return prog; },
    v4(n, arr) { const l = loc(n); if (l !== null) gl.uniform4fv(l, arr); return prog; },
    v3(n, arr) { const l = loc(n); if (l !== null) gl.uniform3fv(l, arr); return prog; },
    tex(n, unit, t, target) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(target || gl.TEXTURE_2D, t);
      const l = loc(n); if (l !== null) gl.uniform1i(l, unit);
      return prog;
    },
  };
  return prog;
}

// ---------- Buffers ----------

function glBuffer(data, target, usage) {
  const b = gl.createBuffer();
  gl.bindBuffer(target || gl.ARRAY_BUFFER, b);
  gl.bufferData(target || gl.ARRAY_BUFFER, data, usage || gl.STATIC_DRAW);
  return b;
}

// Atributo: { buf, loc, size, type, norm, stride, off, div }
function glAttrib(a) {
  gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
  gl.enableVertexAttribArray(a.loc);
  const type = a.type || gl.FLOAT;
  if (a.int) gl.vertexAttribIPointer(a.loc, a.size, type, a.stride || 0, a.off || 0);
  else gl.vertexAttribPointer(a.loc, a.size, type, !!a.norm, a.stride || 0, a.off || 0);
  gl.vertexAttribDivisor(a.loc, a.div || 0);
}

// Buffer dinâmico que cresce sozinho (instâncias, partículas)
function glDynBuffer() {
  return { buf: gl.createBuffer(), cap: 0 };
}

function glDynUpload(d, data, count) {
  gl.bindBuffer(gl.ARRAY_BUFFER, d.buf);
  const bytes = count * 4;
  if (bytes > d.cap) {
    d.cap = Math.max(bytes, d.cap * 2, 4096);
    gl.bufferData(gl.ARRAY_BUFFER, d.cap, gl.DYNAMIC_DRAW);
  }
  if (bytes) gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count);
}

// ---------- Texturas ----------

// opts: { internal, format, type, filter ('linear'|'nearest'|'mip'), wrap ('clamp'|'repeat'), data }
function glTexture(w, h, opts) {
  opts = opts || {};
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  const internal = opts.internal || gl.RGBA8;
  const format = opts.format || gl.RGBA;
  const type = opts.type || gl.UNSIGNED_BYTE;
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, opts.data || null);
  const f = opts.filter || 'linear';
  const minF = f === 'nearest' ? gl.NEAREST : f === 'mip' ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR;
  const magF = f === 'nearest' ? gl.NEAREST : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minF);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magF);
  const wr = opts.wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wr);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wr);
  if (f === 'mip' && opts.data) gl.generateMipmap(gl.TEXTURE_2D);
  t.w = w; t.h = h;
  return t;
}

// Alvo de desenho: { fb, tex[], depth, w, h }. color: lista de { internal, format, type, filter }
// depth: 'tex' (textura de profundidade, para sombra), 'rb' (renderbuffer) ou nada.
// samples > 0: multiamostragem (só renderbuffers; resolve-se com glResolve).
function glTarget(w, h, o) {
  const t = { fb: gl.createFramebuffer(), tex: [], rbs: [], w, h, samples: o.samples || 0 };
  gl.bindFramebuffer(gl.FRAMEBUFFER, t.fb);
  (o.color || []).forEach((c, i) => {
    if (t.samples) {
      const rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, t.samples, c.internal, w, h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, rb);
      t.rbs.push(rb);
    } else {
      const tex = glTexture(w, h, c);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, tex, 0);
      t.tex.push(tex);
    }
  });
  if (o.color && o.color.length > 1) gl.drawBuffers(o.color.map((c, i) => gl.COLOR_ATTACHMENT0 + i));
  if (o.depth === 'tex') {
    const d = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, d);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, w, h, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, d, 0);
    t.depth = d;
  } else if (o.depth === 'rb') {
    const rb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
    if (t.samples) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, t.samples, gl.DEPTH_COMPONENT24, w, h);
    else gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
    t.rbs.push(rb);
  }
  const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('framebuffer incompleto: ' + st);
  return t;
}

function glFreeTarget(t) {
  if (!t) return;
  t.tex.forEach(x => gl.deleteTexture(x));
  t.rbs.forEach(x => gl.deleteRenderbuffer(x));
  if (t.depth) gl.deleteTexture(t.depth);
  gl.deleteFramebuffer(t.fb);
}

function glBind(t) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, t ? t.fb : null);
  if (t) gl.viewport(0, 0, t.w, t.h);
}

// Triângulo que cobre a tela (passes de pós-processamento)
let glFullVao = null;
function glFullscreen() {
  if (!glFullVao) {
    glFullVao = gl.createVertexArray();
    gl.bindVertexArray(glFullVao);
    const b = glBuffer(new Float32Array([-1, -1, 3, -1, -1, 3]));
    glAttrib({ buf: b, loc: 0, size: 2 });
    gl.bindVertexArray(null);
  }
  gl.bindVertexArray(glFullVao);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  gl.bindVertexArray(null);
}

const GLSL_FULL_VS = `
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// ---------- Matrizes (coluna maior, como o GL espera) ----------

function m4() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }

function m4mul(a, b) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

// Matriz a partir de linhas (mais fácil de ler na hora de montar)
function m4rows(r0, r1, r2, r3) {
  const m = new Float32Array(16);
  const rows = [r0, r1, r2, r3 || [0, 0, 0, 1]];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) m[c * 4 + r] = rows[r][c];
  return m;
}

function v3norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function v3cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function v3dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// Transformação de uma peça de modelo: matriz afim 3x4 (linhas) em Float32Array(12)
function a34() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]); }

function a34mul(a, b) {
  const o = new Float32Array(12);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      o[r * 4 + c] = a[r * 4] * b[c] + a[r * 4 + 1] * b[4 + c] + a[r * 4 + 2] * b[8 + c] + (c === 3 ? a[r * 4 + 3] : 0);
    }
  }
  return o;
}

function a34trs(x, y, z, rz, s) {
  const c = Math.cos(rz) * (s || 1), sn = Math.sin(rz) * (s || 1), k = s || 1;
  return new Float32Array([c, -sn, 0, x, sn, c, 0, y, 0, 0, k, z]);
}

function a34rotX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0]);
}

function a34rotY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0]);
}

function a34rotZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0]);
}

function a34trans(x, y, z) {
  return new Float32Array([1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z]);
}

function a34scale(x, y, z) {
  return new Float32Array([x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0]);
}

// sRGB (0..255) -> linear (0..1)
function srgb(r, g, b) {
  const f = v => Math.pow(v / 255, 2.2);
  return [f(r), f(g), f(b)];
}

function hexLinear(hex) {
  const n = parseInt(hex.slice(1), 16);
  return srgb((n >> 16) & 255, (n >> 8) & 255, n & 255);
}
