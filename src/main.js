// Ponto de entrada: monta a partida e roda o laço principal.
// A simulação anda em passos fixos de 1/60 s (partidas repetíveis);
// o desenho acontece uma vez por quadro do navegador.
//
// Parâmetros de endereço (úteis para testes):
//   ?jogar        pula a tela de título
//   ?pausado      pula o título e começa com a simulação congelada
//   ?semnevoa     desliga a névoa de guerra
//   ?dificuldade=facil|normal|dificil   ?faccao=0|1|2
//   ?premium | ?classico | ?leve   modo gráfico (o padrão é o Premium quando há WebGL2)

let canvas, ctx;
let uiCanvas = null, uiCtx = null; // camada da interface em resolução cheia (só no modo leve em tela grande)
let viewW = 0, viewH = 0; // tamanho da tela em px CSS (toda a lógica usa estes)
let lowRes = false;       // canvas em resolução reduzida (modo leve)
let pixelRatio = 1;       // px físicos por px lógico (retina e escala da interface)
let screenDpr = 1;        // devicePixelRatio da tela
let uiScale = 1;          // escala da interface: telas altas mostram tudo maior (texto, painel e mapa)
let lastTime = 0;
let simAccum = 0;     // tempo real acumulado ainda não simulado
let frozen = false;   // simulação congelada (testes); avancar() funciona mesmo assim
let demoMode = false; // partida IA contra IA rodando atrás da tela de título

const params = new URLSearchParams(location.search);

function resize() {
  // O canvas tem a resolução física da tela (nítido em retina); o desenho usa px CSS
  // Toda a lógica usa px lógicos (viewW x viewH). Numa tela de 1080 px de altura a escala é 1,25:
  // a interface e o mapa ficam do tamanho que teriam numa tela de 864 px, sem perder nitidez.
  screenDpr = window.devicePixelRatio || 1;
  uiScale = params.has('escala') ? clamp(parseFloat(params.get('escala')) || 1, 0.75, 2.5) : uiScaleFor(window.innerHeight);
  pixelRatio = screenDpr * uiScale;
  // Modo leve em tela grande ou retina: o canvas passa a ter 1 px por px lógico e o navegador amplia
  // a imagem pronta (bem menos pixels para pintar; fica um pouco menos nítido)
  lowRes = gfx.low && pixelRatio > 1.2;
  if (lowRes) pixelRatio = 1;
  viewW = window.innerWidth / uiScale;
  viewH = window.innerHeight / uiScale;
  canvas.width = lowRes ? Math.round(viewW) : Math.round(window.innerWidth * screenDpr);
  canvas.height = lowRes ? Math.round(viewH) : Math.round(window.innerHeight * screenDpr);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  // No modo leve o mapa fica em resolução menor, mas a interface (texto, painel) continua nítida numa
  // camada por cima, transparente aos cliques
  if (lowRes) {
    if (!uiCanvas) {
      uiCanvas = document.createElement('canvas');
      uiCanvas.style.cssText = 'position:absolute;left:0;top:0;z-index:2;pointer-events:none';
      document.body.appendChild(uiCanvas);
      uiCtx = uiCanvas.getContext('2d');
    }
    uiCanvas.width = Math.round(window.innerWidth * screenDpr);
    uiCanvas.height = Math.round(window.innerHeight * screenDpr);
    uiCanvas.style.width = window.innerWidth + 'px';
    uiCanvas.style.height = window.innerHeight + 'px';
    uiCanvas.style.display = 'block';
  } else if (uiCanvas) {
    uiCanvas.style.display = 'none';
    uiCanvas.width = uiCanvas.height = 1;
  }
  fitCamera();
}

// Área do mundo: tela inteira no título; tela menos o painel lateral durante o jogo
function fitCamera() {
  const w = gameState === 'title' ? viewW : Math.max(200, viewW - SIDEBAR_W);
  if (!camera.zoomSet) {
    camera.zoomSet = true;
    camera.zoom = params.has('zoom') ? clamp(parseFloat(params.get('zoom')) || 1, ZOOM_MIN, ZOOM_MAX) : 1;
  }
  if (camera.w === w && camera.h === viewH) return;
  camera.w = w;
  camera.h = viewH;
  clampCamera();
}

// Começa uma partida nova. Com { demo: true }, as duas bases são da IA (fundo do título).
function newGame(opts = {}) {
  demoMode = !!opts.demo;
  if (opts.faction !== undefined) gameOptions.faction = opts.faction;
  if (opts.difficulty) gameOptions.difficulty = opts.difficulty;
  gameOptions.fog = demoMode ? false : opts.fog !== undefined ? opts.fog : !params.has('semnevoa');

  if (opts.enemy !== undefined) gameOptions.enemy = opts.enemy;
  gameOptions.mirror = !!opts.mirror; // mesma facção dos dois lados (só testes)
  gameOptions.aiSeed = opts.aiSeed || 0; // muda os sorteios da IA
  if (opts.map !== undefined) gameOptions.map = opts.map;
  TEAMS = [FACTIONS[gameOptions.faction], FACTIONS[enemyFaction()]];
  teams = [createTeam(0, TEAMS[0], demoMode), createTeam(1, TEAMS[1], true)];

  units = [];
  buildings = [];
  projectiles = [];
  effects = [];
  resetFx();
  if (typeof restoreMusic === "function") restoreMusic();
  if (typeof gfx !== 'undefined') gfx.locked = false; // cada partida tenta de novo a qualidade cheia
  decals = [];
  pings = [];
  orderMarkers = [];
  messages = [];
  controlGroups = {};
  nextEntityId = 1;
  stepCount = 0;
  fairFlip = false;
  lastAlertPos = null;
  alertLast = {};
  resetAnnouncer();
  gameTime = 0;
  simAccum = 0;
  winner = -1;
  input.mode = null;
  inspected = null;

  gameMap = createMap(MAP_W, MAP_H, MAPS[gameOptions.map].seed);
  mapCanvas = buildMapCanvas(gameMap);
  miniCanvas = buildMinimap(gameMap);
  terrainWithCrystals(); // monta já a camada de cristais (evita um engasgo no primeiro quadro)
  if (opts.swapStarts) gameMap.starts.reverse(); // troca os cantos (só testes de simetria)

  // Cada lado começa com a Central e um pequeno exército
  const order = opts.spawnReverse ? [1, 0] : [0, 1]; // ordem de criação (só testes de simetria)
  order.forEach(team => {
    const s = gameMap.starts[team];
    const hq = spawnBuilding('hq', team, s.x - 1, s.y - 1);
    hq.born = -10;
    // O exército começa na diagonal da Central, fora do lugar natural do 2º prédio
    const d = sideFlip(team) ? -1 : 1;
    const slots = formationSlots(gameMap, s.x + d * 6, s.y + d * 6, START_ARMY.length, team);
    START_ARMY.forEach((type, i) => spawnUnit(type, team, slots[i].x, slots[i].y));
  });

  ais = demoMode ? [createAI(0), createAI(1)] : [createAI(1)];
  createFog(MAP_W, MAP_H);

  const home = gameMap.starts[0];
  centerCameraOn(home.x * TILE, home.y * TILE + TILE * 3);
  gameState = demoMode ? 'title' : 'playing';
  lastBrokeWarning = -999;
  lastFarCrystalWarning = -999;
  mapEmptyWarned = false;
}

// Semente nova para a IA a cada partida começada pelo jogador.
// Math.random fica fora da simulação: com a mesma semente, a partida se repete.
function freshSeed() {
  return 1 + Math.floor(Math.random() * 999999);
}

// Partida acabou? Sem prédios e sem unidades armadas, o time perde.
function checkVictory() {
  if (Math.round(gameTime * SIM_HZ) % SIM_HZ !== 0 || winner >= 0) return;
  const alive = team => buildings.some(b => b.team === team && b.hp > 0) ||
    units.some(u => u.team === team && u.hp > 0 && hasWeapon(u));
  const a0 = alive(0), a1 = alive(1);
  if (a0 && a1) return;
  winner = a0 ? 0 : 1;
  if (demoMode) return;
  gameState = winner === 0 ? 'won' : 'lost';
  clearSelection();
  input.mode = null;
  if (!announce(winner === 0 ? 'vitoria' : 'derrota', { cue: winner === 0 ? 'win' : 'lose' })) sfx(winner === 0 ? 'win' : 'lose');
}

// Um passo de simulação. A ordem importa: decidir, produzir, colher, pensar, mover, resolver.
function simStep() {
  gameTime += SIM_STEP;
  fairFlip = !fairFlip;
  updateAIs(SIM_STEP);
  updateBuildings(SIM_STEP);
  updateHarvesters(SIM_STEP);
  updateCombat(SIM_STEP);
  updateUnits(SIM_STEP);
  resolveCombat(SIM_STEP);
  updateFog();
  checkVictory();
}

// Qualidade automática: se o computador não dá conta (menos de ~45 quadros por segundo por
// alguns segundos), desliga os enfeites mais caros; volta quando sobra folga.
const gfx = { low: params.has('leve'), ema: 1 / 60, slowFor: 0, fastFor: 0, auto: !params.has('leve'), raisedAt: -1e9, locked: false };
function updateQuality(frameDt) {
  if (premiumActive()) return; // o Premium ajusta a própria resolução
  // Quadros muito longos (aba escondida, depuração) não contam; quadros lentos de verdade contam
  if (!gfx.auto || frameDt <= 0 || frameDt > 1) return;
  frameDt = Math.min(frameDt, 0.2);
  gfx.ema += (frameDt - gfx.ema) * 0.05;
  // Liga o modo leve se a média passa de ~19 ms (abaixo de ~52 fps) por 2 s
  if (gfx.ema > 1 / 52) { gfx.slowFor += frameDt; gfx.fastFor = 0; } else if (gfx.ema < 1 / 57) { gfx.fastFor += frameDt; gfx.slowFor = 0; }
  if (!gfx.low && gfx.slowFor > 2) {
    gfx.low = true; gfx.slowFor = 0;
    // Voltou à qualidade cheia há pouco e ficou lento de novo: fica no leve até o fim da partida
    if (performance.now() - gfx.raisedAt < 15000) gfx.locked = true;
    resize();
  } else if (gfx.low && !gfx.locked && gfx.fastFor > 10) {
    // Sobra folga: tenta a qualidade cheia outra vez
    gfx.low = false; gfx.fastFor = 0; gfx.raisedAt = performance.now();
    resize();
  }
}

function loop(time) {
  const frameDt = Math.min(0.25, (time - lastTime) / 1000 || 0);
  lastTime = time;
  updateQuality(frameDt);
  updateAudioWorld(frameDt);
  updateAnnouncer(frameDt);

  const running = gameState === 'playing' || gameState === 'title';
  if (running && !frozen) {
    simAccum += frameDt;
    let steps = 0;
    while (simAccum >= SIM_STEP && steps < MAX_STEPS_PER_FRAME) {
      simStep();
      simAccum -= SIM_STEP;
      steps++;
    }
    if (steps === MAX_STEPS_PER_FRAME) simAccum = 0; // atrasou demais: descarta o resto
  }

  if (gameState === 'title') {
    // Fundo do título: câmera passeando sobre a batalha das IAs; recomeça quando acaba
    const t = time / 1000;
    centerCameraOn((MAP_W / 2 + Math.sin(t * 0.05) * 22) * TILE, (MAP_H / 2 + Math.cos(t * 0.04) * 22) * TILE);
    if (winner >= 0 || gameTime > 1500) newGame({ demo: true });
  } else if (gameState === 'playing') {
    uiClock += frameDt * 1000;
    updateCamera(frameDt);
  }

  fitCamera();
  updateCursor(canvas);
  if (window.devicePixelRatio && window.devicePixelRatio !== screenDpr) resize(); // janela mudou de monitor
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  let premiumOk = premiumActive();
  if (premiumOk) {
    try {
      premiumAdapt(frameDt);
      premiumFrame(ctx, frameDt);
    } catch (e) {
      // Falha do WebGL no meio do jogo (ex.: framebuffer incompleto por falta de memória de vídeo):
      // volta para o Clássico com aviso em vez de deixar a tela preta
      console.warn('Premium desligado:', e.message);
      premium.failed = true; premium.ok = false;
      applyGraphicsMode('classico', true);
      if (gameState === 'playing') notify('Gráficos Premium indisponíveis: voltando ao Clássico');
      premiumOk = false;
    }
  }
  if (!premiumOk) {
    if (glCanvas && glCanvas.style.display !== 'none') glCanvas.style.display = 'none';
    renderWorld(ctx, frameDt);
  }
  if (lowRes && uiCtx) {
    const r = screenDpr * uiScale;
    uiCtx.setTransform(1, 0, 0, 1, 0, 0);
    uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
    uiCtx.setTransform(r, 0, 0, r, 0, 0);
    renderUI(uiCtx);
  } else {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    renderUI(ctx);
  }

  requestAnimationFrame(loop);
}

window.addEventListener('load', () => {
  canvas = document.getElementById('game');
  ctx = canvas.getContext('2d');
  graphicsMode = initialGraphicsMode();
  applyGraphicsMode(graphicsMode, true);
  resize();
  window.addEventListener('resize', resize);
  initInput(canvas);

  if (params.has('faccao')) gameOptions.faction = clamp(parseInt(params.get('faccao'), 10) || 0, 0, FACTIONS.length - 1);
  if (DIFFICULTIES[params.get('dificuldade')]) gameOptions.difficulty = params.get('dificuldade');
  if (params.has('mapa')) gameOptions.map = clamp(parseInt(params.get('mapa'), 10) || 0, 0, MAPS.length - 1);
  if (params.has('inimigo')) gameOptions.enemy = clamp(parseInt(params.get('inimigo'), 10) || 0, 0, FACTIONS.length - 1);
  if (params.has('jogar') || params.has('pausado')) {
    frozen = params.has('pausado');
    newGame();
  } else {
    newGame({ demo: true });
  }

  requestAnimationFrame(t => {
    lastTime = t;
    requestAnimationFrame(loop);
  });
});

// ---------- Modo gráfico: Premium (WebGL 3D), Clássico (2D) ou Leve (2D econômico) ----------

function initialGraphicsMode() {
  if (params.has('leve')) return 'leve';
  if (params.has('classico')) return 'classico';
  if (params.has('premium')) return 'premium';
  try {
    const saved = localStorage.getItem('fronteira.graficos');
    if (saved === 'premium' || saved === 'classico' || saved === 'leve') return saved;
  } catch (e) { /* sem armazenamento local: segue o padrão */ }
  // Sem escolha salva: Premium se houver placa de vídeo; desenhando por software, o Clássico
  // (o Premium continua disponível no botão Gráficos / F9)
  return 'auto';
}

const GRAPHICS_NAMES = { premium: 'Premium', classico: 'Clássico', leve: 'Leve' };

function applyGraphicsMode(mode, quiet) {
  if (mode === 'auto') mode = initPremium() && premium.tier === 'gpu' ? 'premium' : 'classico';
  if (mode === 'premium' && !initPremium()) mode = 'classico';
  graphicsMode = mode;
  gfx.low = mode === 'leve';
  gfx.auto = mode === 'classico';
  gfx.locked = false;
  if (glCanvas) glCanvas.style.display = mode === 'premium' ? 'block' : 'none';
  if (!quiet) {
    try { localStorage.setItem('fronteira.graficos', mode); } catch (e) { /* ignora */ }
    resize();
  }
  return mode;
}

// Troca para o próximo modo (botão na pausa/título e tecla F9)
function cycleGraphicsMode() {
  const order = ['premium', 'classico', 'leve'];
  let i = order.indexOf(graphicsMode);
  for (let k = 0; k < 3; k++) {
    i = (i + 1) % 3;
    if (order[i] !== 'premium' || !premium.failed) break;
  }
  const m = applyGraphicsMode(order[i]);
  // Na pausa e no título o próprio botão mostra o modo (e os avisos ficam parados na pausa)
  if (typeof notify === 'function' && gameState === 'playing') {
    messages = messages.filter(x => !String(x.text).startsWith('Gráficos: '));
    notify('Gráficos: ' + GRAPHICS_NAMES[m]);
  }
  return m;
}
