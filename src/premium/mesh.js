// Modo Premium: montador de malhas 3D por código (caixas chanfradas, cilindros, tornos, prismas).
// Cada vértice leva: posição, normal, cor (rgb + máscara da cor do time) e material
// (aspereza, metal, brilho próprio, efeito especial).

// Efeitos especiais de material (o shader de modelos sabe desenhar cada um)
const FX_NONE = 0, FX_TREAD = 1, FX_GLASS = 2, FX_BLINK = 3, FX_TEAMGLOW = 4, FX_CLOTH = 5,
  FX_CARGO = 6, FX_HAZARD = 7, FX_ACTIVE = 8, FX_WHEEL = 9, FX_POWER = 10;

// Material: cor em hex (sRGB), team = parte pintada com a cor do time (0..1)
function M(hex, o) {
  o = o || {};
  const n = parseInt(hex.slice(1), 16);
  return {
    c: [(n >> 16) & 255, (n >> 8) & 255, n & 255],
    t: o.team || 0, r: o.rough === undefined ? 0.6 : o.rough, m: o.metal || 0, e: o.emit || 0, f: o.fx || 0,
  };
}

class MeshBuilder {
  constructor() {
    this.data = [];   // floats: pos(3) nrm(3)
    this.cols = [];   // bytes: col(4) mat(4)
    this.idx = [];
    this.M = a34();
    this.stack = [];
  }

  push(m) { this.stack.push(this.M); this.M = a34mul(this.M, m); return this; }
  pop() { this.M = this.stack.pop(); return this; }

  xf(p) {
    const m = this.M;
    return [m[0] * p[0] + m[1] * p[1] + m[2] * p[2] + m[3], m[4] * p[0] + m[5] * p[1] + m[6] * p[2] + m[7], m[8] * p[0] + m[9] * p[1] + m[10] * p[2] + m[11]];
  }

  xn(n) {
    const m = this.M;
    return v3norm([m[0] * n[0] + m[1] * n[1] + m[2] * n[2], m[4] * n[0] + m[5] * n[1] + m[6] * n[2], m[8] * n[0] + m[9] * n[1] + m[10] * n[2]]);
  }

  // Vértice já no espaço do modelo (sem transformar)
  rawVert(p, n, mat) {
    const i = this.data.length / 6;
    this.data.push(p[0], p[1], p[2], n[0], n[1], n[2]);
    this.cols.push(mat.c[0], mat.c[1], mat.c[2], Math.round(mat.t * 255),
      Math.round(clamp(mat.r, 0, 1) * 255), Math.round(clamp(mat.m, 0, 1) * 255), Math.round(clamp(mat.e, 0, 1) * 255), mat.f);
    return i;
  }

  // Triângulo plano. "center" (opcional, espaço local) garante a normal para fora.
  tri(a, b, c, mat, center) {
    let A = this.xf(a), B = this.xf(b), C = this.xf(c);
    let n = v3cross([B[0] - A[0], B[1] - A[1], B[2] - A[2]], [C[0] - A[0], C[1] - A[1], C[2] - A[2]]);
    if (center) {
      const ce = this.xf(center);
      const mid = [(A[0] + B[0] + C[0]) / 3 - ce[0], (A[1] + B[1] + C[1]) / 3 - ce[1], (A[2] + B[2] + C[2]) / 3 - ce[2]];
      if (v3dot(n, mid) < 0) { const t = B; B = C; C = t; n = [-n[0], -n[1], -n[2]]; }
    }
    n = v3norm(n);
    const i0 = this.rawVert(A, n, mat), i1 = this.rawVert(B, n, mat), i2 = this.rawVert(C, n, mat);
    this.idx.push(i0, i1, i2);
    return this;
  }

  quad(a, b, c, d, mat, center) {
    let A = this.xf(a), B = this.xf(b), C = this.xf(c), D = this.xf(d);
    let n = v3cross([C[0] - A[0], C[1] - A[1], C[2] - A[2]], [D[0] - B[0], D[1] - B[1], D[2] - B[2]]);
    if (center) {
      const ce = this.xf(center);
      const mid = [(A[0] + C[0]) / 2 - ce[0], (A[1] + C[1]) / 2 - ce[1], (A[2] + C[2]) / 2 - ce[2]];
      if (v3dot(n, mid) < 0) { let t = B; B = D; D = t; n = [-n[0], -n[1], -n[2]]; }
    }
    n = v3norm(n);
    const i0 = this.rawVert(A, n, mat), i1 = this.rawVert(B, n, mat), i2 = this.rawVert(C, n, mat), i3 = this.rawVert(D, n, mat);
    this.idx.push(i0, i1, i2, i0, i2, i3);
    return this;
  }

  // Caixa de (x0,y0,z0) a (x1,y1,z1), com chanfro opcional nas arestas
  box(x0, y0, z0, x1, y1, z1, mat, bevel) {
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
    const a = [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
    const e = Math.min(bevel || 0, a[0] * 0.45, a[1] * 0.45, a[2] * 0.45);
    const P = (v) => [c[0] + v[0], c[1] + v[1], c[2] + v[2]];
    const ax = (i, va, j, vb, k, vc) => { const v = [0, 0, 0]; v[i] = va; v[j] = vb; v[k] = vc; return P(v); };
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3, k = (i + 2) % 3;
      for (const s of [-1, 1]) {
        const bj = a[j] - e, bk = a[k] - e;
        this.quad(ax(i, s * a[i], j, -bj, k, -bk), ax(i, s * a[i], j, bj, k, -bk), ax(i, s * a[i], j, bj, k, bk), ax(i, s * a[i], j, -bj, k, bk), mat, c);
      }
    }
    if (e <= 0) return this;
    // Chanfros das arestas
    for (let i = 0; i < 3; i++) {
      const j = (i + 1) % 3, k = (i + 2) % 3;
      for (const si of [-1, 1]) for (const sj of [-1, 1]) {
        const bk = a[k] - e;
        this.quad(ax(i, si * a[i], j, sj * (a[j] - e), k, -bk), ax(i, si * (a[i] - e), j, sj * a[j], k, -bk),
          ax(i, si * (a[i] - e), j, sj * a[j], k, bk), ax(i, si * a[i], j, sj * (a[j] - e), k, bk), mat, c);
      }
    }
    // Quinas
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      this.tri(P([sx * a[0], sy * (a[1] - e), sz * (a[2] - e)]), P([sx * (a[0] - e), sy * a[1], sz * (a[2] - e)]), P([sx * (a[0] - e), sy * (a[1] - e), sz * a[2]]), mat, c);
    }
    return this;
  }

  // Sólido de revolução em torno de z. profile: [[raio, z], ...] de baixo para cima.
  // Normais suaves em volta e marcadas entre os degraus do perfil.
  lathe(profile, segs, mat, o) {
    o = o || {};
    const a0 = o.a0 || 0, a1 = o.a1 === undefined ? Math.PI * 2 : o.a1;
    const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
    for (let p = 0; p < profile.length - 1; p++) {
      const [r0, z0] = profile[p], [r1, z1] = profile[p + 1];
      let nr = z1 - z0, nz = -(r1 - r0);
      const l = Math.hypot(nr, nz) || 1;
      nr /= l; nz /= l;
      if (o.inside) { nr = -nr; nz = -nz; }
      const m = profile[p][2] || mat;
      for (let s = 0; s < segs; s++) {
        const t0 = a0 + (a1 - a0) * s / segs, t1 = a0 + (a1 - a0) * (s + 1) / segs;
        const c0 = Math.cos(t0), s0 = Math.sin(t0), c1 = Math.cos(t1), s1 = Math.sin(t1);
        const pts = [[r0 * c0, r0 * s0, z0], [r0 * c1, r0 * s1, z0], [r1 * c1, r1 * s1, z1], [r1 * c0, r1 * s0, z1]];
        const ns = o.flat ? null : [[nr * c0, nr * s0, nz], [nr * c1, nr * s1, nz], [nr * c1, nr * s1, nz], [nr * c0, nr * s0, nz]];
        if (ns) {
          const ids = pts.map((pt, q) => this.rawVert(this.xf(pt), this.xn(ns[q]), m));
          if (o.inside) this.idx.push(ids[0], ids[2], ids[1], ids[0], ids[3], ids[2]);
          else this.idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
        } else {
          this.quad(pts[0], pts[1], pts[2], pts[3], m);
        }
      }
    }
    // Tampas
    if (o.capBottom && profile[0][0] > 0) this.disc(profile[0][0], profile[0][1], segs, mat, -1, a0, a1);
    if (o.capTop && profile[profile.length - 1][0] > 0) this.disc(profile[profile.length - 1][0], profile[profile.length - 1][1], segs, o.topMat || mat, 1, a0, a1);
    if (!full && o.capSides) { /* não usado */ }
    return this;
  }

  disc(r, z, segs, mat, dir, a0, a1) {
    a0 = a0 || 0; a1 = a1 === undefined ? Math.PI * 2 : a1;
    const n = this.xn([0, 0, dir]);
    const c = this.rawVert(this.xf([0, 0, z]), n, mat);
    for (let s = 0; s < segs; s++) {
      const t0 = a0 + (a1 - a0) * s / segs, t1 = a0 + (a1 - a0) * (s + 1) / segs;
      const i0 = this.rawVert(this.xf([r * Math.cos(t0), r * Math.sin(t0), z]), n, mat);
      const i1 = this.rawVert(this.xf([r * Math.cos(t1), r * Math.sin(t1), z]), n, mat);
      if (dir > 0) this.idx.push(c, i0, i1); else this.idx.push(c, i1, i0);
    }
    return this;
  }

  // Cilindro (ou tronco de cone) de (x,y,z) ao longo de um eixo
  cyl(x, y, z, r0, r1, len, axis, segs, mat, caps) {
    const rot = axis === 'x' ? a34rotY(Math.PI / 2) : axis === 'y' ? a34rotX(-Math.PI / 2) : a34();
    this.push(a34mul(a34trans(x, y, z), rot));
    this.lathe([[r0, 0], [r1, len]], segs || 12, mat, { capBottom: caps !== false, capTop: caps !== false });
    this.pop();
    return this;
  }

  sphere(x, y, z, r, segs, mat, half) {
    const prof = [];
    const n = Math.max(3, Math.round(segs / 2));
    const start = half ? 0 : -n;
    for (let i = start; i <= n; i++) {
      const a = i / n * Math.PI / 2;
      prof.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    this.push(a34trans(x, y, z));
    this.lathe(prof, segs, mat);
    this.pop();
    return this;
  }

  // Prisma: polígono convexo [[u,v],...] extrudado de w0 a w1. plane 'xy' (extrude em z),
  // 'xz' (perfil lateral, extrude em y), 'yz' (extrude em x). topScale encolhe a face de cima.
  prism(poly, w0, w1, mat, plane, topScale, topOff) {
    plane = plane || 'xy';
    const ts = topScale || 1;
    const to = topOff || [0, 0];
    const cu = poly.reduce((s, p) => s + p[0], 0) / poly.length, cv = poly.reduce((s, p) => s + p[1], 0) / poly.length;
    const map = (u, v, w) => plane === 'xy' ? [u, v, w] : plane === 'xz' ? [u, w, v] : [w, u, v];
    const top = poly.map(p => [cu + (p[0] - cu) * ts + to[0], cv + (p[1] - cv) * ts + to[1]]);
    const center = map(cu, cv, (w0 + w1) / 2);
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n], ta = top[i], tb = top[(i + 1) % n];
      this.quad(map(a[0], a[1], w0), map(b[0], b[1], w0), map(tb[0], tb[1], w1), map(ta[0], ta[1], w1), mat, center);
    }
    for (let i = 1; i < n - 1; i++) {
      this.tri(map(poly[0][0], poly[0][1], w0), map(poly[i][0], poly[i][1], w0), map(poly[i + 1][0], poly[i + 1][1], w0), mat, center);
      this.tri(map(top[0][0], top[0][1], w1), map(top[i][0], top[i][1], w1), map(top[i + 1][0], top[i + 1][1], w1), mat, center);
    }
    return this;
  }

  // Envia para a GPU. Devolve { vbo, cbo, ibo, count, bindAttribs() }
  upload() {
    const vbo = glBuffer(new Float32Array(this.data));
    const cbo = glBuffer(new Uint8Array(this.cols));
    const big = this.data.length / 6 > 65535;
    const ibo = glBuffer(big ? new Uint32Array(this.idx) : new Uint16Array(this.idx), gl.ELEMENT_ARRAY_BUFFER);
    const mesh = {
      vbo, cbo, ibo, count: this.idx.length, itype: big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      bindAttribs() {
        glAttrib({ buf: vbo, loc: 0, size: 3, stride: 24, off: 0 });
        glAttrib({ buf: vbo, loc: 1, size: 3, stride: 24, off: 12 });
        glAttrib({ buf: cbo, loc: 2, size: 4, type: gl.UNSIGNED_BYTE, norm: true, stride: 8, off: 0 });
        glAttrib({ buf: cbo, loc: 3, size: 4, type: gl.UNSIGNED_BYTE, norm: true, stride: 8, off: 4 });
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
      },
    };
    return mesh;
  }
}
