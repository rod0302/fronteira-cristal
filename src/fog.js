// Névoa de guerra do jogador: preto onde nunca viu. Onde já viu, o terreno continua revelado
// para sempre (só um véu leve marca o que não está sendo visto agora; unidades inimigas ali somem).
// A IA não usa névoa (sabe onde fica a base do jogador, como nos clássicos).

const FOG_EVERY = 6; // recalcula a visão a cada 6 passos (10 vezes por segundo)
// Opacidade (0-255) do véu sobre o terreno já explorado e fora da visão: leve, o mapa continua conhecido
const EXPLORED_VEIL = 34;

let fog = null;
// Prédios inimigos destruídos fora da visão: o jogador continua vendo a última imagem
// deles até voltar a enxergar o lugar
let ghosts = [];

function createFog(w, h) {
  ghosts = [];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d');
  fog = {
    w, h,
    explored: new Uint8Array(w * h),
    visible: new Uint8Array(w * h),
    canvas, g,
    image: g.createImageData(w, h),
    counter: 0,
    circles: {}, // deslocamentos pré-calculados por raio
  };
  computeFog();
}

function circleOffsets(r) {
  if (fog.circles[r]) return fog.circles[r];
  const list = [];
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r) list.push([x, y]);
  }
  fog.circles[r] = list;
  return list;
}

function reveal(cx, cy, r) {
  const list = circleOffsets(r);
  for (const [dx, dy] of list) {
    const x = cx + dx, y = cy + dy;
    if (x < 0 || y < 0 || x >= fog.w || y >= fog.h) continue;
    const i = y * fog.w + x;
    fog.visible[i] = 1;
    fog.explored[i] = 1;
  }
}

// Recalcula o que o jogador vê e atualiza a imagem da névoa
function computeFog() {
  fog.visible.fill(0);
  if (!gameOptions.fog) {
    fog.visible.fill(1);
    fog.explored.fill(1);
  } else {
    units.forEach(u => {
      if (u.team === 0) reveal(Math.floor(u.x / TILE), Math.floor(u.y / TILE), UNIT_TYPES[u.type].sight);
    });
    buildings.forEach(b => {
      if (b.team === 0 && b.hp > 0) {
        reveal(b.tx + (b.w >> 1), b.ty + (b.h >> 1), BUILDING_TYPES[b.type].sight + (b.w >> 1));
      }
    });
    // Prédio inimigo visto agora fica "lembrado" (desenhado mesmo fora da visão)
    // e guarda a vida de quando foi visto pela última vez
    buildings.forEach(b => {
      if (b.team !== 0 && isVisibleToPlayer(b)) {
        b.seen = true;
        b.seenHp = b.hp;
      }
    });
    ghosts = ghosts.filter(g => !isVisibleToPlayer(g));
  }
  const data = fog.image.data;
  for (let i = 0; i < fog.w * fog.h; i++) {
    const a = fog.visible[i] ? 0 : fog.explored[i] ? EXPLORED_VEIL : 255;
    data[i * 4] = 0;
    data[i * 4 + 1] = 0;
    data[i * 4 + 2] = 0;
    data[i * 4 + 3] = a;
  }
  fog.g.putImageData(fog.image, 0, 0);
  fog.version = (fog.version || 0) + 1; // avisa o desenho que a névoa mudou (não afeta a partida)
}

function updateFog() {
  if (++fog.counter >= FOG_EVERY) {
    fog.counter = 0;
    computeFog();
  }
}

function tileVisible(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= fog.w || ty >= fog.h) return false;
  return fog.visible[ty * fog.w + tx] === 1;
}

function tileExplored(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= fog.w || ty >= fog.h) return false;
  return fog.explored[ty * fog.w + tx] === 1;
}

// O jogador está vendo esta entidade agora?
function isVisibleToPlayer(e) {
  if (e.team === 0 || !gameOptions.fog) return true;
  if (e.kind === 'building') {
    for (let y = e.ty; y < e.ty + e.h; y++) {
      for (let x = e.tx; x < e.tx + e.w; x++) if (tileVisible(x, y)) return true;
    }
    return false;
  }
  return tileVisible(Math.floor(e.x / TILE), Math.floor(e.y / TILE));
}

// Prédio inimigo já visto alguma vez (fica desenhado mesmo fora da visão).
// Prédios erguidos depois em área já explorada só aparecem quando vistos.
function isExploredByPlayer(b) {
  if (b.team === 0 || !gameOptions.fog) return true;
  return !!b.seen || isVisibleToPlayer(b);
}
