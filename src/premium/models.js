// Modo Premium: modelos 3D de todas as unidades e prédios, montados por código.
// Eixos do modelo: +x é a frente da unidade, +y a direita (sul quando o ângulo é 0), +z para cima.
// Prédios: origem no centro da área ocupada, no chão; a porta/saída fica no lado +y (sul).

// Paleta (sRGB)
const MAT = {
  paint: M('#e2e2e2', { team: 1, rough: 0.5, metal: 0.08 }),
  paintDark: M('#9a9a9a', { team: 1, rough: 0.55, metal: 0.08 }),
  gun: M('#3b4148', { rough: 0.38, metal: 0.75 }),
  steel: M('#8d949c', { rough: 0.3, metal: 0.9 }),
  dark: M('#24272b', { rough: 0.6, metal: 0.4 }),
  rubber: M('#1d1e20', { rough: 0.85, fx: FX_TREAD }),
  tire: M('#1f2022', { rough: 0.8, fx: FX_WHEEL }),
  concrete: M('#8a7f6e', { rough: 0.88 }),
  concreteDark: M('#6a6052', { rough: 0.9 }),
  panel: M('#9d978a', { rough: 0.55, metal: 0.15 }),
  panelDark: M('#6f6b64', { rough: 0.6, metal: 0.2 }),
  olive: M('#5d6244', { rough: 0.85 }),
  sand: M('#a99a74', { rough: 0.95 }),
  skin: M('#c8956c', { rough: 0.7 }),
  glass: M('#1c2c36', { rough: 0.06, metal: 0.2, emit: 0.18, fx: FX_GLASS }),
  glassWarm: M('#ffcf8a', { rough: 0.1, emit: 0.55, fx: FX_GLASS }),
  glassTeal: M('#46f0d8', { rough: 0.05, emit: 0.9, fx: FX_GLASS }),
  dome: M('#7fd2ff', { rough: 0.05, metal: 0.2, emit: 0.22, fx: FX_GLASS }),
  sky: M('#8fd8ff', { rough: 0.1, emit: 0.3, fx: FX_ACTIVE }),
  core: M('#ffd27a', { rough: 0.2, emit: 1.0, fx: FX_POWER }),
  headlight: M('#fff2cc', { rough: 0.2, emit: 0.8 }),
  red: M('#ff3b2e', { rough: 0.3, emit: 1.0, fx: FX_BLINK }),
  green: M('#5dff7a', { rough: 0.3, emit: 1.0, fx: FX_BLINK }),
  amber: M('#ffb22e', { rough: 0.3, emit: 1.0, fx: FX_BLINK }),
  eye: M('#ff4433', { rough: 0.2, emit: 0.85 }),
  teamGlow: M('#ffffff', { team: 1, rough: 0.3, emit: 0.7, fx: FX_TEAMGLOW }),
  hazard: M('#e8b52a', { rough: 0.6, fx: FX_HAZARD }),
  cargo: M('#3ff2d6', { rough: 0.1, emit: 0.8, fx: FX_CARGO }),
  cloth: M('#f0f0f0', { team: 1, rough: 0.85, fx: FX_CLOTH }),
  chunk: M('#8c877e', { rough: 0.9 }),
  chunkDark: M('#4a4642', { rough: 0.7, metal: 0.4 }),
  hot: M('#ffb35a', { rough: 0.4, emit: 1.0 }),
  roofTeam: M('#8a8a8a', { team: 1, rough: 0.7, metal: 0.05 }),
  armor: M('#454644', { rough: 0.6, metal: 0.15 }),
  roofMetal: M('#4f4d49', { rough: 0.55, metal: 0.25 }),
  armorDark: M('#393a38', { rough: 0.65, metal: 0.2 }),
};

function buildingPad(mb, w, h) {
  // Laje baixa e chanfrada (quase rente ao chão) com juntas de dilatação
  // Rampa larga e baixa (chanfro) que funde a laje no terreno
  mb.box(-w / 2 - 1, -h / 2 - 1, -1.6, w / 2 + 1, h / 2 + 1, 0.2, MAT.concreteDark, 2.6);
  mb.box(-w / 2 + 2, -h / 2 + 2, -1, w / 2 - 2, h / 2 - 2, 1.1, MAT.concreteDark, 1.8);
  mb.box(-w / 2 + 4, -h / 2 + 4, 0.6, w / 2 - 4, h / 2 - 4, 1.5, MAT.concrete, 0.7);
  for (let x = -w / 2 + 16; x < w / 2 - 6; x += 16) mb.box(x - 0.25, -h / 2 + 4, 1.45, x + 0.25, h / 2 - 4, 1.6, MAT.concreteDark);
  if (w < 64) return;
  // Poste de luz no canto sudeste (braço e luminária acesa)
  const px = w / 2 - 4.5, py = h / 2 - 4.5;
  mb.cyl(px, py, 1.5, 0.45, 0.35, 17, 'z', 6, MAT.steel);
  mb.box(px - 4, py - 0.3, 17.8, px + 0.3, py + 0.3, 18.4, MAT.steel);
  mb.box(px - 4.6, py - 0.8, 17.2, px - 2.6, py + 0.8, 18.2, MAT.headlight);
  // Pilha de contêineres e tambores no canto sudoeste
  const cx = -w / 2 + 6, cy = h / 2 - 5;
  mb.box(cx - 3, cy - 2.6, 1.5, cx + 7, cy + 2.6, 6.5, MAT.panelDark, 0.3);
  mb.box(cx - 2.6, cy - 2.2, 6.5, cx + 6.6, cy + 2.2, 6.9, MAT.paint, 0.2);
  for (let i = 0; i < 3; i++) mb.cyl(cx + 9.5 + (i % 2) * 2.3, cy - 1.5 + i * 1.4, 1.5, 1.05, 1.05, 3.4, 'z', 8, i === 1 ? MAT.hazard : MAT.olive);
}

// Teto de prédio: mureta com faixa na cor do time, emendas das placas, máquinas de ar com
// ventoinha, tubulação e um emblema do time (losango). Dá escala e leitura de "quem é o dono".
function roofKit(mb, x0, y0, x1, y1, z, seed, o = {}) {
  let r = seed * 9301 + 49297;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const t = 1.1;
  // Mureta e faixa do time
  mb.box(x0, y0, z, x1, y0 + t, z + 1.8, MAT.panelDark, 0.2);
  mb.box(x0, y1 - t, z, x1, y1, z + 1.8, MAT.panelDark, 0.2);
  mb.box(x0, y0, z, x0 + t, y1, z + 1.8, MAT.panelDark, 0.2);
  mb.box(x1 - t, y0, z, x1, y1, z + 1.8, MAT.panelDark, 0.2);
  mb.box(x0 - 0.15, y1 - t - 0.15, z + 1.0, x1 + 0.15, y1 + 0.15, z + 1.9, MAT.paint);
  mb.box(x0 - 0.15, y0 - 0.15, z + 1.0, x1 + 0.15, y0 + t + 0.15, z + 1.9, MAT.paint);
  // Filete de luz na cor do time no topo da mureta sul (lê o dono também no escuro da névoa)
  mb.box(x0 + 2, y1 - t * 0.7, z + 1.9, x1 - 2, y1 - t * 0.2, z + 2.15, MAT.teamGlow);
  // Telhado de chapa metálica ondulada (nervuras) com uma faixa larga na cor do time no lado sul
  if (o.membrane !== false) {
    const band = y1 - t - (y1 - y0) * 0.16;
    mb.box(x0 + t, y0 + t, z - 0.2, x1 - t, band, z + 0.12, MAT.roofMetal);
    mb.box(x0 + t, band, z - 0.2, x1 - t, y1 - t, z + 0.14, MAT.roofTeam);
    for (let x = x0 + t + 1.4; x < x1 - t - 0.5; x += 2.2) mb.box(x - 0.35, y0 + t, z + 0.1, x + 0.35, band, z + 0.42, MAT.roofMetal);
  }
  // Emendas das placas do teto
  const w = x1 - x0, h = y1 - y0;
  const n = Math.max(2, Math.round(w / 9));
  for (let i = 1; i < n; i++) {
    const x = x0 + i * w / n;
    mb.box(x - 0.25, y0 + t, z, x + 0.25, y1 - t, z + 0.3, MAT.panelDark);
  }
  // Máquinas de ar
  const units = o.units === undefined ? Math.max(1, Math.round(w * h / 500)) : o.units;
  for (let k = 0; k < units; k++) {
    const ux = x0 + 4 + rnd() * (w - 13), uy = y0 + 4 + rnd() * (h - 12);
    if (o.avoid && o.avoid(ux + 3, uy + 3)) continue;
    mb.box(ux, uy, z, ux + 7, uy + 6, z + 2.6, MAT.panel, 0.4);
    mb.cyl(ux + 3.5, uy + 3, z + 2.6, 2.2, 2.2, 0.3, 'z', 12, MAT.dark);
    mb.box(ux + 1.3, uy + 2.7, z + 2.9, ux + 5.7, uy + 3.3, z + 3.1, MAT.gun);
  }
  // Tubo ao longo de um lado
  if (o.pipe !== false) {
    const py = y0 + t + 1.6;
    mb.cyl(x0 + 2, py, z + 1.0, 0.7, 0.7, w - 4, 'x', 8, MAT.steel);
    for (let x = x0 + 4; x < x1 - 3; x += 8) mb.box(x - 0.4, py - 0.8, z, x + 0.4, py + 0.8, z + 1.0, MAT.gun);
  }
  // Emblema do time
  if (o.emblem) {
    const [ex, ey, es] = o.emblem;
    mb.prism([[ex, ey - es], [ex + es * 0.8, ey], [ex, ey + es], [ex - es * 0.8, ey]], z, z + 0.25, MAT.paint, 'xy');
    mb.prism([[ex, ey - es * 0.5], [ex + es * 0.4, ey], [ex, ey + es * 0.5], [ex - es * 0.4, ey]], z + 0.25, z + 0.4, MAT.dark, 'xy');
  }
}

// Pilares finos nas fachadas (marcam a altura e quebram a parede lisa)
function facadeRibs(mb, x0, y0, x1, y1, z0, z1, step, mat = MAT.panelDark, windows) {
  // Janelas em faixa entre os pilares (fachadas sul e leste/oeste)
  if (windows) {
    const wz0 = z0 + (z1 - z0) * 0.45, wz1 = z0 + (z1 - z0) * 0.72;
    for (let x = x0; x < x1 - step * 0.5; x += step) mb.box(x + 1.4, y1 - 0.1, wz0, x + step - 1.4, y1 + 0.3, wz1, (Math.floor(x * 7.3) & 3) === 0 ? MAT.glassWarm : MAT.glass);
    for (let y = y0; y < y1 - step * 0.5; y += step) for (const xx of [x0 - 0.3, x1 + 0.1]) mb.box(xx, y + 1.4, wz0, xx + 0.2, y + step - 1.4, wz1, MAT.glass);
  }
  for (let x = x0 + step; x < x1 - 1; x += step) {
    mb.box(x - 0.6, y1 - 0.2, z0, x + 0.6, y1 + 0.6, z1, mat);
    mb.box(x - 0.6, y0 - 0.6, z0, x + 0.6, y0 + 0.2, z1, mat);
  }
  for (let y = y0 + step; y < y1 - 1; y += step) {
    mb.box(x1 - 0.2, y - 0.6, z0, x1 + 0.6, y + 0.6, z1, mat);
    mb.box(x0 - 0.6, y - 0.6, z0, x0 + 0.2, y + 0.6, z1, mat);
  }
}

function tracks(mb, x0, x1, yIn, yOut, h) {
  for (const s of [-1, 1]) {
    const ya = s > 0 ? yIn : -yOut, yb = s > 0 ? yOut : -yIn;
    mb.box(x0, ya, 0, x1, yb, h, MAT.rubber, 1.6);
    // Rodas e tampas
    for (let x = x0 + 3.5; x < x1 - 2; x += (x1 - x0 - 7) / 3) {
      mb.cyl(x, s > 0 ? yOut - 0.2 : -yOut + 0.2, h * 0.45, 1.7, 1.7, 0.6 * s, 'y', 10, MAT.gun);
    }
    mb.box(x0 - 0.4, ya - 0.3 * s, h, x1 + 0.4, yb + 0.3 * s, h + 0.8, MAT.armorDark, 0.3);
    // Friso fino na cor do time na borda externa do para-lama
    mb.box(x0 + 1, (s > 0 ? yb : ya) - 0.6, h + 0.5, x1 - 1, (s > 0 ? yb : ya) + 0.6, h + 1.0, MAT.paint);
  }
}

// ---------- Unidades ----------

function buildTank() {
  const hull = new MeshBuilder();
  tracks(hull, -13, 13, 5.2, 9, 5.2);
  hull.prism([[-12.5, 2], [11.5, 2], [14, 4.6], [10.5, 7.6], [-10.5, 7.6], [-12.5, 5.6]], -5.4, 5.4, MAT.armor, 'xz');
  // Faixas do time no glacis e no deck
  hull.box(9.2, -5.5, 6.4, 11.6, 5.5, 7.75, MAT.paint, 0.2);
  hull.box(-4.5, -5.5, 7.55, 7.5, -3.2, 7.75, MAT.paint);
  hull.box(-4.5, 3.2, 7.55, 7.5, 5.5, 7.75, MAT.paint);
  hull.box(-11, -4.2, 7.4, -5, 4.2, 8.3, MAT.dark, 0.4);
  for (const s of [-1, 1]) hull.box(-12.6, s > 0 ? 8.6 : -9.4, 2.4, 12.2, s > 0 ? 9.4 : -8.6, 5.6, MAT.armorDark, 0.3);
  hull.box(8, -4.6, 6.6, 11, 4.6, 7.0, MAT.gun, 0.2);
  for (let i = 0; i < 4; i++) hull.box(-10.5 + i * 1.4, -3.8, 8.2, -9.9 + i * 1.4, 3.8, 8.5, MAT.gun);
  // Carga no deck traseiro: caixas, galões e lona
  hull.box(-12.2, -5.2, 7.6, -9.6, -2.6, 9.4, MAT.olive, 0.3);
  hull.box(-12.2, 2.8, 7.6, -10.2, 5.2, 9.0, MAT.sand, 0.5);
  hull.cyl(-11.2, 0, 7.6, 0.9, 0.9, 1.6, 'z', 8, MAT.armorDark);
  for (const s of [-1, 1]) {
    hull.cyl(-12.6, s * 3.2, 5.6, 0.9, 0.8, -1.6, 'x', 8, MAT.dark);
    hull.box(13.1, s * 4.3 - 0.8, 4.6, 13.9, s * 4.3 + 0.8, 5.5, MAT.headlight);
    hull.box(-4, s * 7.2 - 1.2, 6, 2, s * 7.2 + 1.2, 7.6, MAT.olive, 0.4);
  }
  const turret = new MeshBuilder();
  turret.prism([[7, -3.2], [4.5, -5.8], [-4.5, -6], [-7.5, -4], [-7.5, 4], [-4.5, 6], [4.5, 5.8], [7, 3.2]], 0, 4.4, MAT.armor, 'xy', 0.82);
  turret.box(5.4, -2.6, 0.6, 8.2, 2.6, 3.8, MAT.gun, 0.6);
  turret.cyl(-2, 1.9, 4.3, 1.9, 1.7, 0.8, 'z', 10, MAT.gun);
  // Comandante na escotilha (capacete na cor do time)
  turret.box(-2.8, 1.2, 5.0, -1.2, 2.6, 6.6, MAT.olive, 0.3);
  turret.sphere(-2, 1.9, 7.1, 0.85, 8, MAT.paint, true);
  turret.box(1.5, -3.4, 4.2, 3.2, -1.8, 5.4, MAT.dark, 0.3);
  turret.box(-9.2, -3.6, 0.6, -7.4, 3.6, 3.2, MAT.dark, 0.3);
  turret.cyl(-5.6, -3.8, 4.3, 0.28, 0.12, 10, 'z', 5, MAT.dark);
  turret.box(-6.2, 2.6, 4.3, -4.6, 4.2, 4.9, MAT.teamGlow);
  turret.box(-5.8, -4.3, 4.25, 3.6, 4.3, 4.7, MAT.paint, 0.3);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) turret.cyl(4.6 - i * 1.1, s * 5.4, 2.6, 0.45, 0.45, 1.6 * s, 'y', 6, MAT.gun);
    turret.box(-7.2, s * 4.6 - 0.9, 1, -2, s * 4.6 + 0.9, 3.6, MAT.olive, 0.4);
  }
  const barrel = new MeshBuilder();
  barrel.cyl(0, 0, 0, 1.2, 1.0, 12.5, 'x', 10, MAT.steel);
  barrel.cyl(3.5, 0, 0, 1.6, 1.6, 3, 'x', 10, MAT.gun);
  barrel.box(11.8, -1.5, -1.15, 14.2, 1.5, 1.15, MAT.gun, 0.4);
  return { tank_hull: hull, tank_turret: turret, tank_barrel: barrel };
}

function buildScout() {
  const body = new MeshBuilder();
  body.box(-8.5, -3.6, 1.4, 8.5, 3.6, 2.8, MAT.dark, 0.5);
  body.prism([[-9.5, 2.4], [8.5, 2.4], [10.6, 4.2], [8, 6.2], [-1, 6.6], [-9.5, 6]], -4.6, 4.6, MAT.armor, 'xz');
  body.box(1.5, -4.75, 5.9, 8.4, 4.75, 6.75, MAT.paint, 0.3); // capô na cor do time
  for (const s of [-1, 1]) body.box(-9.4, s * 4.6 - 0.25, 3.2, 8.4, s * 4.6 + 0.25, 4.6, MAT.paint);
  body.box(-6, -3.4, 6.3, -1.5, 3.4, 7, MAT.dark, 0.3); // bancos
  // Gaiola
  for (const s of [-1, 1]) {
    body.cyl(-1.5, s * 3.8, 6.3, 0.38, 0.38, 4.2, 'z', 6, MAT.gun, false);
    body.cyl(-7.5, s * 3.8, 6, 0.38, 0.38, 4.2, 'z', 6, MAT.gun, false);
    body.cyl(-7.5, s * 3.8, 10.2, 0.38, 0.38, 6, 'x', 6, MAT.gun, false);
    body.box(9.6, s * 3.2 - 0.7, 4.4, 10.5, s * 3.2 + 0.7, 5.2, MAT.headlight);
  }
  body.cyl(-1.5, -3.8, 10.2, 0.38, 0.38, 7.6, 'y', 6, MAT.gun, false);
  body.cyl(-7.5, -3.8, 10.2, 0.38, 0.38, 7.6, 'y', 6, MAT.gun, false);
  body.quad([1.2, -3.4, 6.4], [1.2, 3.4, 6.4], [-0.6, 3.4, 9.2], [-0.6, -3.4, 9.2], MAT.glass);
  // Metralhadora dupla no arco
  body.box(-3, -0.9, 10.4, 1.5, 0.9, 11.6, MAT.gun, 0.3);
  body.cyl(1.5, -0.45, 11, 0.36, 0.33, 6, 'x', 6, MAT.steel);
  body.cyl(1.5, 0.45, 11, 0.36, 0.33, 6, 'x', 6, MAT.steel);
  body.box(-9.8, -3, 3.5, -8.8, 3, 5.6, MAT.gun, 0.3);
  const wheel = new MeshBuilder();
  wheel.cyl(0, -1.25, 0, 3.1, 3.1, 2.5, 'y', 14, MAT.tire);
  wheel.cyl(0, -1.4, 0, 1.6, 1.6, 2.8, 'y', 8, MAT.steel);
  return { scout_body: body, scout_wheel: wheel };
}

function buildArtillery() {
  const hull = new MeshBuilder();
  tracks(hull, -12, 12, 5, 8.6, 5);
  hull.box(-11, -6, 2, 7, 6, 8.4, MAT.armor, 1.2);
  hull.box(-10, -2, 8.2, 6, 2, 8.9, MAT.paint, 0.3);
  hull.prism([[7, 2], [12.5, 2], [13.2, 4.5], [10.5, 7.2], [7, 7.2]], -6, 6, MAT.paintDark, 'xz');
  hull.box(10.2, -5, 5.2, 11.8, 5, 6.6, MAT.glass);
  hull.box(-12, -5, 3, -11, 5, 7.5, MAT.dark, 0.3);
  hull.box(-9, -6.6, 8.2, 3, -5, 9, MAT.olive, 0.3);
  for (const s of [-1, 1]) hull.box(12.4, s * 4.2 - 0.7, 3.6, 13.2, s * 4.2 + 0.7, 4.4, MAT.headlight);
  const gun = new MeshBuilder();
  gun.box(-3.5, -3.4, -1.5, 4, 3.4, 2.8, MAT.gun, 0.8);
  gun.cyl(2, 0, 0.8, 1.5, 1.25, 21, 'x', 10, MAT.steel);
  gun.cyl(2, 0, 0.8, 2.1, 2.1, 5, 'x', 10, MAT.gun);
  gun.box(21, -1.7, -0.9, 23.6, 1.7, 2.5, MAT.gun, 0.4);
  for (const s of [-1, 1]) gun.cyl(1, s * 2, -0.2, 0.6, 0.6, 7, 'x', 6, MAT.steel);
  return { arty_hull: hull, arty_gun: gun };
}

function buildHarvester() {
  const body = new MeshBuilder();
  tracks(body, -15, 12, 7, 11, 6);
  body.box(-15, -7.2, 2, 13, 7.2, 6.4, MAT.gun, 0.8);
  // Cabine
  body.box(4, -10.6, 6, 12.6, -1.5, 14, MAT.paint, 1.2);
  body.box(12.4, -9.8, 8.6, 13, -2.4, 12.4, MAT.glassWarm);
  body.box(5, -10.9, 9, 11, -10.4, 12.2, MAT.glassWarm);
  body.cyl(8, -6, 14, 1.1, 1.1, 1.4, 'z', 8, MAT.amber);
  body.cyl(2.6, 5.5, 6, 1, 0.8, 11, 'z', 8, MAT.dark);
  // Caçamba
  body.box(-16, -8.6, 6, -0.5, 8.6, 7.2, MAT.paintDark, 0.4);
  body.box(-16, -8.6, 6, -14.6, 8.6, 13, MAT.armor, 0.4);
  body.box(-2, -8.6, 6, -0.5, 8.6, 13, MAT.armor, 0.4);
  body.box(-16, -8.6, 6, -0.5, -7.2, 13, MAT.armor, 0.4);
  body.box(-16, 7.2, 6, -0.5, 8.6, 13, MAT.armor, 0.4);
  for (const s of [-1, 1]) body.box(-14, s * 8.7 - 0.2, 7.5, -2.5, s * 8.7 + 0.2, 10.5, MAT.paint);
  body.box(-16.2, -8.8, 12.6, -0.3, -7.6, 13.4, MAT.hazard);
  body.box(-16.2, 7.6, 12.6, -0.3, 8.8, 13.4, MAT.hazard);
  body.box(1, 0, 6, 4, 6.5, 9, MAT.dark, 0.4);
  // Braço do cortador
  for (const s of [-1, 1]) body.box(11, s * 7.6 - 1, 2.5, 16, s * 7.6 + 1, 5.5, MAT.gun, 0.4);
  const drum = new MeshBuilder();
  drum.cyl(0, -7, 0, 3.2, 3.2, 14, 'y', 12, MAT.steel);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    drum.push(a34rotY(a));
    for (let k = 0; k < 4; k++) drum.box(3, -6 + k * 3.4 + (i % 2) * 1.5, -0.5, 4.4, -5 + k * 3.4 + (i % 2) * 1.5, 0.5, MAT.hazard);
    drum.pop();
  }
  const cargo = new MeshBuilder();
  const rng = makeRng(77);
  for (let i = 0; i < 14; i++) {
    const x = -14 + rng() * 11.5, y = -6 + rng() * 12, h = 1.5 + rng() * 2.5, r = 0.9 + rng() * 1.1;
    cargo.push(a34mul(a34trans(x, y, 0), a34mul(a34rotZ(rng() * 6), a34rotY((rng() - 0.5) * 0.9))));
    cargo.prism([[r, 0], [r * 0.5, r * 0.87], [-r * 0.5, r * 0.87], [-r, 0], [-r * 0.5, -r * 0.87], [r * 0.5, -r * 0.87]], 0, h, MAT.cargo, 'xy', 0.3);
    cargo.pop();
  }
  cargo.box(-14.6, -7.2, -0.5, -2, 7.2, 0.4, MAT.cargo);
  return { harv_body: body, harv_drum: drum, harv_cargo: cargo };
}

function buildInfantry(rocket) {
  const body = new MeshBuilder();
  body.box(-1.5, -2.2, 5, 1.5, 2.2, 5.7, MAT.dark, 0.3);
  body.box(-1.45, -2.15, 5.5, 1.45, 2.15, 8.8, MAT.sand, 0.7);
  for (const s of [-1, 1]) body.box(-0.9, s * 2.15 - 0.25, 7.2, 0.9, s * 2.15 + 0.25, 8.6, MAT.paint); // ombreiras do time
  body.box(-2.7, -1.6, 5.8, -1.2, 1.6, 8.4, MAT.olive, 0.5);
  body.sphere(0.25, 0, 9.9, 1.45, 8, MAT.skin);
  body.sphere(0, 0, 10.1, 1.95, 10, MAT.paint, true);
  body.box(-0.3, -1.95, 9.7, 0.3, 1.95, 10.15, MAT.paintDark);
  if (rocket) {
    // Lança-foguetes grosso no ombro, com ogiva laranja: lê de cima como "tubo", não fuzil
    body.cyl(-6, 1.9, 9.6, 1.75, 1.75, 13, 'x', 10, MAT.olive);
    body.cyl(3.4, 1.9, 9.6, 1.95, 1.95, 1.4, 'x', 10, MAT.paint);
    body.cyl(4.6, 1.9, 9.6, 1.2, 0.3, 2.4, 'x', 10, MAT.hot);
    body.cyl(-6.4, 1.9, 9.6, 1.95, 1.95, 1.4, 'x', 10, MAT.dark);
    body.box(0.5, 0.8, 7.2, 3, 2.4, 8.1, MAT.olive, 0.3);
  } else {
    body.box(0.8, -0.35, 6.9, 9, 0.35, 7.8, MAT.gun, 0.15);
    // Mochila de rádio com antena
    body.box(-3.6, -1.4, 6.2, -2.4, 1.4, 9.2, MAT.olive, 0.4);
    body.cyl(-3.2, 1.0, 9.2, 0.12, 0.08, 6, 'z', 4, MAT.dark);
    body.box(1.5, -0.4, 6.2, 2.6, 0.4, 7, MAT.gun);
    for (const s of [-1, 1]) body.box(0.2, s * 1.8 - 0.55, 7, 3.2, s * 1.8 + 0.55, 7.9, MAT.olive, 0.3);
  }
  return body;
}

function buildLeg() {
  const leg = new MeshBuilder();
  leg.box(-0.8, -0.8, -5, 0.8, 0.8, 0.2, MAT.olive, 0.35);
  leg.box(-0.9, -0.85, -5.3, 1.5, 0.85, -4.2, MAT.dark, 0.3);
  return leg;
}

// ---------- Prédios ----------

function buildHQ() {
  const mb = new MeshBuilder();
  buildingPad(mb, 96, 96);
  mb.box(-34, -36, 2, 34, 20, 20, MAT.panel, 2.5);
  mb.box(-34.6, -36.6, 13, 34.6, 20.6, 15.6, MAT.paint, 0.6);
  facadeRibs(mb, -34, -36, 34, 20, 2, 13, 8.5, MAT.panelDark, true);
  roofKit(mb, -34, -36, 34, 20, 20, 3, { units: 0, pipe: false, emblem: [6, 13, 5] });
  mb.box(-46, -24, 2, -34, 12, 12, MAT.panelDark, 1.5);
  mb.box(34, -24, 2, 46, 12, 12, MAT.panelDark, 1.5);
  for (let i = 0; i < 3; i++) { mb.box(46, -20 + i * 11, 6, 46.6, -14 + i * 11, 9, MAT.glassWarm); mb.box(-46.6, -20 + i * 11, 6, -46, -14 + i * 11, 9, MAT.glassWarm); }
  // Entrada
  mb.box(-12, 20, 2, 12, 30, 11, MAT.gun, 1.2);
  mb.box(-8, 29.8, 2.5, 8, 30.6, 9, MAT.glassWarm);
  mb.box(-13, 18, 11, 13, 31, 12.4, MAT.paint, 0.5);
  // Cúpula de vidro com anel
  mb.cyl(0, -10, 20, 17, 17, 2, 'z', 24, MAT.gun);
  mb.push(a34trans(0, -10, 22));
  const dome = [];
  for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; dome.push([Math.cos(a) * 15, Math.sin(a) * 13]); }
  mb.lathe(dome, 24, MAT.dome);
  for (let i = 0; i < 6; i++) {
    mb.push(a34rotZ(i / 6 * Math.PI));
    mb.lathe(dome.map(p => [p[0] + 0.25, p[1] + 0.1]), 2, MAT.gun, { a0: -0.03, a1: 0.03 });
    mb.lathe(dome.map(p => [p[0] + 0.25, p[1] + 0.1]), 2, MAT.gun, { a0: Math.PI - 0.03, a1: Math.PI + 0.03 });
    mb.pop();
  }
  mb.pop();
  // Mastro de comunicação e luz
  mb.cyl(26, -28, 20, 1.4, 0.6, 28, 'z', 8, MAT.steel);
  mb.cyl(26, -28, 30, 3.5, 3.5, 0.6, 'z', 10, MAT.gun);
  mb.sphere(26, -28, 48.5, 1.3, 8, MAT.red);
  // Antena parabólica pequena
  mb.push(a34mul(a34trans(-24, -28, 20), a34rotY(-0.7)));
  mb.lathe([[0, 0], [3, 0.6], [6, 2.4]], 14, MAT.paint, { capBottom: false });
  mb.cyl(0, 0, 0, 0.4, 0.3, 5, 'z', 6, MAT.gun);
  mb.pop();
  mb.cyl(-24, -28, 17, 1.2, 1.2, 4, 'z', 8, MAT.gun);
  // Saídas de ar e caixas no teto
  mb.box(14, -32, 20, 28, -20, 23, MAT.panelDark, 0.8);
  mb.box(-30, 4, 20, -16, 16, 22.5, MAT.panelDark, 0.8);
  for (let i = 0; i < 4; i++) mb.box(15 + i * 3.3, -31, 23, 16.6 + i * 3.3, -21, 23.5, MAT.dark);
  // Postes de luz da praça
  for (const s of [-1, 1]) {
    mb.cyl(s * 30, 40, 2, 0.6, 0.5, 12, 'z', 6, MAT.gun);
    mb.box(s * 30 - 1.5, 38.5, 13.5, s * 30 + 1.5, 41.5, 14.5, MAT.headlight);
  }
  // Heliponto
  mb.cyl(-28, 36, 2, 9, 9, 0.5, 'z', 20, MAT.dark);
  mb.push(a34trans(-28, 36, 2.6));
  mb.lathe([[7.2, 0], [8.2, 0]], 20, MAT.hazard);
  mb.pop();
  for (const s of [-1, 1]) mb.box(-28 + s * 3 - 0.6, 32.5, 2.5, -28 + s * 3 + 0.6, 39.5, 2.75, MAT.hazard);
  mb.box(-31, 35.4, 2.5, -25, 36.6, 2.75, MAT.hazard);
  return { hq: mb };
}

function coolingTower(mb, x, y) {
  mb.push(a34trans(x, y, 0));
  mb.lathe([[13, 2], [12, 6], [11.6, 8, MAT.paint], [10.9, 10.5], [9, 18], [8.6, 23], [9.2, 28], [10.2, 32]], 20, MAT.concrete);
  mb.lathe([[10.2, 32], [9.4, 32]], 20, MAT.concreteDark);
  mb.lathe([[9.4, 32], [8.4, 24]], 20, MAT.dark, { inside: true });
  mb.disc(8.4, 24, 16, MAT.dark, 1);
  mb.pop();
}

function buildPower() {
  const mb = new MeshBuilder();
  buildingPad(mb, 64, 64);
  coolingTower(mb, -12, -10);
  coolingTower(mb, 12, 10);
  mb.box(4, -29, 2, 29, -4, 13, MAT.panel, 1.2);
  mb.box(4.5, -4.6, 5, 28.5, -3.6, 10, MAT.core);
  mb.box(28.6, -26, 5, 29.6, -8, 10, MAT.core);
  roofKit(mb, 4, -29, 29, -4, 13, 7, { units: 1, emblem: [22, -12, 4.5] });
  facadeRibs(mb, 4, -29, 29, -4, 2, 13, 6.3);
  mb.box(-29, 4, 2, -4, 29, 10, MAT.panelDark, 1.2);
  mb.box(-28.6, 4.5, 8, -4.4, 28.6, 9, MAT.paint, 0.3);
  // Canos
  mb.cyl(-2, -10, 6, 1.6, 1.6, 6, 'x', 10, MAT.steel);
  mb.cyl(12, 0, 6, 1.6, 1.6, -4, 'y', 10, MAT.steel);
  mb.cyl(-12, 4, 5, 1.4, 1.4, 4, 'y', 10, MAT.steel);
  for (let i = 0; i < 3; i++) mb.box(-26 + i * 8, 26, 10, -22 + i * 8, 28, 12, MAT.amber);
  return { power: mb };
}

function buildRefinery() {
  const mb = new MeshBuilder();
  buildingPad(mb, 96, 64);
  for (const x of [-35, -17]) {
    mb.push(a34trans(x, -13, 0));
    mb.lathe([[9, 2], [9, 10, MAT.paint], [9, 13], [9, 26], [7.5, 29.5], [3.5, 31.5], [0, 32]], 18, MAT.panel);
    mb.pop();
    mb.box(x - 1, -4.5, 2, x + 1, -2, 20, MAT.gun);
  }
  mb.cyl(-35, -13, 27, 1, 1, 14, 'x', 8, MAT.steel);
  mb.box(-6, -28, 2, 42, 4, 19, MAT.panel, 1.5);
  mb.box(-6.5, -28.5, 14, 42.5, 4.5, 16.5, MAT.paint, 0.5);
  mb.box(4, -26, 19, 20, -12, 23, MAT.panelDark, 0.8);
  roofKit(mb, -6, -28, 42, 4, 19, 11, { units: 1, avoid: (x, y) => (x > 3 && x < 21 && y < -11) || Math.hypot(x - 28, y + 6) < 9, emblem: [-1, -6, 4] });
  facadeRibs(mb, -6, -28, 42, 4, 2, 14, 8, MAT.panelDark, true);
  // Tanque de cristal brilhante
  mb.cyl(28, -6, 19, 5.5, 5.5, 1, 'z', 16, MAT.gun);
  mb.cyl(28, -6, 20, 4.8, 4.8, 10, 'z', 16, MAT.glassTeal);
  mb.cyl(28, -6, 30, 5.5, 4, 1.5, 'z', 16, MAT.gun);
  for (let i = 0; i < 3; i++) mb.box(-4 + i * 12, 4.2, 6, 4 + i * 12, 4.8, 10, MAT.glassWarm);
  // Doca de descarga ao sul
  mb.box(-34, 6, 1.6, 6, 31, 2.6, MAT.dark, 0.4);
  mb.box(-34, 6, 2.2, -31, 31, 2.9, MAT.hazard);
  mb.box(3, 6, 2.2, 6, 31, 2.9, MAT.hazard);
  mb.prism([[-20, 2], [-6, 2], [-6, 12], [-16, 9]], 6, 14, MAT.gun, 'xz');
  mb.prism([[-10, 6], [-2, 6], [-2, 13], [-10, 13]], -4, 6, MAT.panelDark, 'xy');
  mb.cyl(-2, -2, 9, 1.3, 1.3, 10, 'x', 8, MAT.steel);
  return { refinery: mb };
}

function buildBarracks() {
  const mb = new MeshBuilder();
  buildingPad(mb, 64, 64);
  // Galpão arredondado deitado ao longo de x
  mb.push(a34mul(a34trans(-2, -2, 2), a34rotY(Math.PI / 2)));
  const prof = [[15, -21], [15, -10, MAT.paint], [15.4, -10], [15.4, -6, MAT.olive], [15, -6], [15, 19]];
  mb.lathe(prof.map(p => [p[0], p[1], p[2]]), 16, MAT.roofMetal, { a0: Math.PI / 2, a1: Math.PI * 1.5 });
  mb.disc(15, -21, 16, MAT.olive, -1, Math.PI / 2, Math.PI * 1.5);
  mb.disc(15, 19, 16, MAT.olive, 1, Math.PI / 2, Math.PI * 1.5);
  mb.pop();
  // Porta (lado leste) com luz
  mb.box(17, -8, 2, 17.8, 4, 12, MAT.dark);
  mb.box(17.2, -6.5, 12.5, 18.6, 2.5, 13.4, MAT.headlight);
  // Sacos de areia na frente
  for (let i = 0; i < 7; i++) mb.box(-26 + i * 6.6, 20, 2, -20.4 + i * 6.6, 25, 5.2, MAT.sand, 1.6);
  for (let i = 0; i < 6; i++) mb.box(-23 + i * 6.6, 20.6, 5, -17.4 + i * 6.6, 24.4, 7.6, MAT.sand, 1.5);
  // Mastro
  mb.cyl(-21, -21, 2, 0.55, 0.45, 30, 'z', 8, MAT.steel);
  mb.sphere(-21, -21, 32.2, 0.8, 6, MAT.steel);
  mb.box(20, -26, 2, 28, -16, 8, MAT.olive, 0.8);
  const flag = new MeshBuilder();
  // Bandeira: malha subdividida (o shader faz tremular)
  const W = 12, H = 7, nx = 8, ny = 3;
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x0 = i / nx * W, x1 = (i + 1) / nx * W, z0 = -j / ny * H, z1 = -(j + 1) / ny * H;
    flag.quad([x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1], MAT.cloth);
  }
  return { barracks: mb, flag };
}

function buildFactory() {
  const mb = new MeshBuilder();
  buildingPad(mb, 96, 96);
  mb.box(-42, -40, 2, 42, 26, 22, MAT.panel, 1.5);
  mb.box(-42.6, -40.6, 15, 42.6, 26.6, 17.6, MAT.paint, 0.5);
  facadeRibs(mb, -42, -40, 42, 26, 2, 15, 10.5, MAT.panelDark, true);
  // Telhado em dente de serra com claraboias
  for (let i = 0; i < 3; i++) {
    const y0 = -40 + i * 22, y1 = y0 + 22;
    mb.prism([[y0, 22], [y1, 22], [y1, 31]], -41, 41, MAT.roofMetal, 'yz');
    if (i === 1) mb.box(-41, y1 - 1.6, 29.2, 41, y1 - 0.2, 31.2, MAT.paint);
    mb.box(-38, y1 - 0.4, 22.4, 38, y1 + 0.3, 30, MAT.glass);
    for (let x = -36; x <= 36; x += 6) mb.box(x - 0.3, y1 - 0.6, 22.4, x + 0.3, y1 + 0.5, 30.4, MAT.gun);
  }
  // Portão
  mb.box(-21, 24, 2, 21, 29, 21, MAT.gun, 1);
  mb.box(-17, 28.6, 2.2, 17, 29.4, 17, MAT.dark);
  for (let i = 0; i < 6; i++) mb.box(-16.5, 29.2, 3 + i * 2.4, 16.5, 29.6, 3.6 + i * 2.4, MAT.panelDark);
  mb.box(-20, 28.8, 2, -17.5, 29.8, 18, MAT.hazard);
  mb.box(17.5, 28.8, 2, 20, 29.8, 18, MAT.hazard);
  mb.box(-17, 28.8, 17.2, 17, 29.8, 19, MAT.hazard);
  for (const s of [-1, 1]) mb.box(s * 24 - 1.5, 28, 18, s * 24 + 1.5, 30, 19.5, MAT.amber);
  // Chaminé
  mb.push(a34trans(32, -31, 22));
  mb.lathe([[4.5, 0], [4.2, 8, MAT.paint], [4.2, 11], [3.8, 22], [4.4, 23]], 14, MAT.concrete);
  mb.pop();
  // Pórtico do guindaste a oeste
  mb.box(-46, -36, 2, -44, -33, 30, MAT.gun);
  mb.box(-46, 18, 2, -44, 21, 30, MAT.gun);
  mb.box(-47, -36, 30, -43, 21, 32.5, MAT.hazard);
  mb.box(-46.5, -6, 24, -43.5, -2, 30, MAT.dark);
  return { factory: mb };
}

function buildRadar() {
  const mb = new MeshBuilder();
  buildingPad(mb, 64, 64);
  mb.box(-24, -20, 2, 20, 24, 13, MAT.panel, 1.5);
  mb.box(-24.5, -20.5, 9, 20.5, 24.5, 11, MAT.paint, 0.4);
  mb.box(-20, 8, 13, -6, 20, 16, MAT.panelDark, 0.6);
  roofKit(mb, -24, -20, 20, 24, 13, 5, { units: 0, pipe: false, emblem: [-15, -11, 5] });
  facadeRibs(mb, -24, -20, 20, 24, 2, 9, 7.3, MAT.panelDark, true);
  mb.box(4, 10, 13, 16, 20, 15, MAT.dark, 0.4);
  for (let i = 0; i < 3; i++) mb.box(-18 + i * 4.4, 24.2, 4, -15 + i * 4.4, 24.8, 8, MAT.glassWarm);
  mb.cyl(-2, -4, 13, 4.5, 3, 11, 'z', 12, MAT.steel);
  mb.sphere(14, -14, 14.5, 1, 6, MAT.green);
  const dish = new MeshBuilder();
  dish.box(-2.5, -2.5, -1, 2.5, 2.5, 2, MAT.gun, 0.5);
  dish.push(a34mul(a34trans(1, 0, 2), a34rotY(-1.0)));
  const prof = [];
  for (let i = 0; i <= 5; i++) { const r = i / 5 * 14; prof.push([r, r * r / 40]); }
  dish.lathe(prof, 20, MAT.paint);
  dish.lathe(prof.map(p => [p[0], p[1] - 0.4]), 20, MAT.panelDark, { inside: true });
  dish.cyl(0, 0, 0, 0.5, 0.4, 9, 'z', 6, MAT.gun);
  dish.sphere(0, 0, 9.2, 1.1, 6, MAT.gun);
  dish.pop();
  dish.box(-7, -1.5, 0, -3, 1.5, 3, MAT.dark, 0.4);
  return { radar: mb, radar_dish: dish };
}

function buildTurret() {
  const mb = new MeshBuilder();
  mb.lathe([[14.5, -1], [14.5, 2], [13, 3], [11.6, 5, MAT.paint], [11.1, 7], [10.4, 9]], 12, MAT.concrete, { capTop: true, flat: true });
  const head = new MeshBuilder();
  head.prism([[7, -4], [3, -7], [-6, -7], [-8.4, -4], [-8.4, 4], [-6, 7], [3, 7], [7, 4]], 0, 6, MAT.paint, 'xy', 0.8);
  head.box(4.5, -4.2, 1, 8, 4.2, 5, MAT.gun, 0.8);
  for (const s of [-1, 1]) {
    head.cyl(7, s * 2.2, 3, 1.1, 0.9, 12, 'x', 10, MAT.steel);
    head.box(18.2, s * 2.2 - 1.2, 1.9, 20, s * 2.2 + 1.2, 4.1, MAT.gun, 0.3);
  }
  head.box(1, -2, 5.8, 4, 2, 7.2, MAT.dark, 0.4);
  head.box(3.6, -1.2, 6.1, 4.2, 1.2, 6.9, MAT.eye);
  head.box(-8, -3, 1, -6.5, 3, 5, MAT.dark, 0.3);
  return { turret_base: mb, turret_head: head };
}

function buildMisc() {
  const chunks = [];
  for (let v = 0; v < 3; v++) {
    const mb = new MeshBuilder();
    const rng = makeRng(31 + v * 17);
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + rng() * 0.6; const r = 0.7 + rng() * 0.5; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    mb.prism(pts, 0, 0.6 + rng() * 0.6, v === 2 ? MAT.chunkDark : MAT.chunk, 'xy', 0.7, [rng() * 0.2, rng() * 0.2]);
    chunks.push(mb);
  }
  const rocket = new MeshBuilder();
  rocket.cyl(-3, 0, 0, 0.75, 0.75, 4.5, 'x', 8, MAT.olive);
  rocket.cyl(1.5, 0, 0, 0.75, 0.05, 2, 'x', 8, MAT.paint);
  for (let i = 0; i < 4; i++) {
    rocket.push(a34rotX(i * Math.PI / 2));
    rocket.quad([-3, 0, 0], [-1.8, 0, 0], [-2.4, 0, 1.6], [-3.2, 0, 1.6], MAT.dark);
    rocket.pop();
  }
  const shell = new MeshBuilder();
  shell.cyl(-2, 0, 0, 0.9, 0.9, 3, 'x', 8, MAT.hot);
  shell.cyl(1, 0, 0, 0.9, 0.1, 1.6, 'x', 8, MAT.hot);
  return { chunk0: chunks[0], chunk1: chunks[1], chunk2: chunks[2], rocket, shell };
}

// Monta e envia todos os modelos. Devolve { nome: malha }
function buildAllModels() {
  const all = Object.assign({}, buildTank(), buildScout(), buildArtillery(), buildHarvester(), buildHQ(), buildPower(),
    buildRefinery(), buildBarracks(), buildFactory(), buildRadar(), buildTurret(), buildMisc());
  all.trooper_body = buildInfantry(false);
  all.rocketeer_body = buildInfantry(true);
  all.leg = buildLeg();
  const out = {};
  for (const k in all) out[k] = all[k].upload();
  return out;
}

// Altura máxima de cada prédio (montagem sobe do chão até aqui)
const BUILDING_HEIGHT = { hq: 50, power: 33, refinery: 33, barracks: 33, factory: 46, radar: 34, turret: 18 };
// Altura visual das unidades (barra de vida e clique)
const UNIT_VIS_SCALE = 1.15;
const UNIT_HEIGHT = { tank: 14, scout: 14, artillery: 16, harvester: 17.5, trooper: 18, rocketeer: 18 };
