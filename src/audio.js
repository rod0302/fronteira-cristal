// Som premium gerado por código com Web Audio (sem arquivos externos).
// O contexto de áudio só nasce depois do primeiro clique (regra dos navegadores).
//
// Mixagem:
//   cada som -> volume, filtro de distância e lado -> barramento (efeitos, locutor, música, ambiente)
//   efeitos -> compressor de "cola" -> geral -> limitador -> saída
//   envios: reverb de vale (cauda longa e escura) e eco das mesas de pedra (atraso estéreo filtrado)
// Os efeitos vêm do banco em sfxbank.js (gravados por código no começo, com variações).
// Sons no mapa têm volume, lado e brilho conforme a distância até a tela: explosões e canhões
// longe da tela ainda se ouvem, abafados, como uma batalha do outro lado do vale.

let audioCtx = null;
let audioOut = null;    // volume geral (mudo = 0)
let sfxBus = null;      // efeitos (abaixa enquanto o locutor ou a sirene falam)
let lightBus = null;    // tiros e impactos (abaixam quando um prédio ou veículo explode na tela)
let annBus = null;      // locutor e interface: nunca abaixa
let cueBus = null;      // sinais dos avisos (sirene, sino, radar, fanfarra): abaixam debaixo da voz
let musicBus = null;    // música (liga/desliga com N)
let musicDuck = null;   // abaixa a música nos avisos e no fim da partida
let musicSend = null;   // reverb da música (calado junto com ela quando N desliga)
let ambBus = null;      // ambiente (vento, zumbido da base, motores parados): fica mesmo sem música
let reverbSend = null;  // entrada do reverb de vale
let slapSend = null;    // entrada do eco das mesas de pedra
let sfxRevSend = null;  // reverb dos efeitos (volta pelo barramento de efeitos: abaixa junto com eles)
let noiseBuf = null;    // ruído branco reaproveitado
let muted = false;
let musicOn = true;
let silentSim = false;  // true durante __jogo.avancar (simulação rápida sem som)
const sfxLast = {};     // último instante em que cada som tocou (para não empilhar)
let activeVoices = 0;   // sons tocando agora (limite para batalhas grandes)
const MAX_VOICES = 44;
const MASTER_VOL = 0.9;
const sfxPlayLog = [];  // últimos sons tocados { name, t, vol, far } (lido pelos testes)

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return;
  }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const ctx = audioCtx;
    // Limitador final: segura os picos de batalhas grandes sem distorcer
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.12;
    // Teto em -1 dB: o compressor do navegador não é um limitador de parede e deixa passar um pouco
    const ceiling = ctx.createGain();
    ceiling.gain.value = 0.89;
    limiter.connect(ceiling);
    ceiling.connect(ctx.destination);
    audioOut = ctx.createGain();
    audioOut.gain.value = muted ? 0 : MASTER_VOL;
    audioOut.connect(limiter);

    // Compressor de cola dos efeitos: junta as camadas e dá "peso" às explosões
    const glue = ctx.createDynamicsCompressor();
    glue.threshold.value = -14;
    glue.knee.value = 10;
    glue.ratio.value = 2;
    glue.attack.value = 0.02;
    glue.release.value = 0.25;
    glue.connect(audioOut);
    // Tira o sub que não se ouve (abaixo de 35 Hz) e abaixa um pouco o grave: sobra espaço para os médios,
    // que é onde se entende a batalha (e o que sobrevive num alto-falante de notebook)
    const sub = ctx.createBiquadFilter();
    sub.type = 'highpass'; sub.frequency.value = 35; sub.Q.value = 0.7;
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'lowshelf'; shelf.frequency.value = 110; shelf.gain.value = -4;
    sub.connect(shelf); shelf.connect(glue);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_LEVEL;
    sfxBus.connect(sub);
    lightBus = ctx.createGain();
    lightBus.gain.value = 1;
    lightBus.connect(sfxBus);
    annBus = ctx.createGain();
    annBus.gain.value = 1;
    annBus.connect(audioOut);
    cueBus = ctx.createGain();
    cueBus.gain.value = 1;
    cueBus.connect(audioOut);
    musicDuck = ctx.createGain();
    musicDuck.gain.value = MUSIC_LEVEL;
    musicDuck.connect(audioOut);
    musicBus = ctx.createGain();
    musicBus.gain.value = musicOn ? 1 : 0;
    musicBus.connect(musicDuck);
    ambBus = ctx.createGain();
    ambBus.gain.value = AMB_LEVEL;
    ambBus.connect(audioOut);

    // Reverb de vale: cauda estéreo que escurece com o tempo
    const conv = ctx.createConvolver();
    conv.buffer = impulseResponse(2.6, 3.0);
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    conv.connect(wet);
    wet.connect(audioOut);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 1;
    reverbSend.connect(conv);
    musicSend = ctx.createGain();
    musicSend.gain.value = musicOn ? 1 : 0;
    musicSend.connect(reverbSend);
    // Reverb dos efeitos: o mesmo vale, mas a cauda volta pelos efeitos (abaixa com o locutor)
    const conv2 = ctx.createConvolver();
    conv2.buffer = conv.buffer;
    const wet2 = ctx.createGain();
    wet2.gain.value = 0.32;
    conv2.connect(wet2);
    wet2.connect(sfxBus);
    sfxRevSend = ctx.createGain();
    sfxRevSend.gain.value = 1;
    sfxRevSend.connect(conv2);

    // Eco das mesas de pedra: dois atrasos (esquerda e direita) escuros, com pouca realimentação
    slapSend = ctx.createGain();
    slapSend.gain.value = 1;
    const slapLp = ctx.createBiquadFilter();
    slapLp.type = 'lowpass';
    slapLp.frequency.value = 1800;
    slapSend.connect(slapLp);
    const merger = ctx.createChannelMerger(2);
    [[0.19, 0], [0.27, 1]].forEach(([time, ch]) => {
      const dl = ctx.createDelay(1);
      dl.delayTime.value = time;
      const fb = ctx.createGain();
      fb.gain.value = 0.22;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      slapLp.connect(dl);
      dl.connect(fb);
      fb.connect(dl);
      dl.connect(g);
      g.connect(merger, 0, ch);
    });
    merger.connect(sfxBus);

    const len = ctx.sampleRate * 2;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    const rng = makeRng(7);
    for (let i = 0; i < len; i++) data[i] = rng() * 2 - 1;
    startAmbience();
    // Grava o banco de efeitos e decodifica as falas em segundo plano
    buildSfxBank(ctx.sampleRate);
    if (typeof loadVoicePack === 'function') loadVoicePack();
  } catch (e) {
    audioCtx = null; // sem áudio: o jogo segue mudo
  }
}

// Resposta ao impulso: primeiras reflexões espalhadas e cauda que perde os agudos
function impulseResponse(seconds, decay) {
  const rate = audioCtx.sampleRate, len = Math.floor(rate * seconds);
  const buf = audioCtx.createBuffer(2, len, rate);
  const rng = makeRng(99);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const a = 0.65 - t * 0.6; // filtro passa-baixas que fecha ao longo da cauda
      lp = lp * a + (rng() * 2 - 1) * (1 - a);
      d[i] = lp * 2.2 * Math.pow(1 - t, decay) * (i < rate * 0.012 ? i / (rate * 0.012) : 1);
    }
    // Reflexões iniciais (paredes do cânion), diferentes em cada lado
    for (let r = 0; r < 7; r++) {
      const at = Math.floor(rate * (0.011 + rng() * 0.07));
      d[at] += (rng() < 0.5 ? -1 : 1) * (0.5 - r * 0.05);
    }
  }
  return buf;
}

function toggleMute() {
  muted = !muted;
  if (audioOut) audioOut.gain.setTargetAtTime(muted ? 0 : MASTER_VOL, audioCtx.currentTime, 0.05);
  if (muted && window.speechSynthesis) speechSynthesis.cancel();
  if (muted && typeof stopVoices === 'function') stopVoices();
  return muted;
}

function toggleMusic() {
  musicOn = !musicOn;
  if (musicBus) musicBus.gain.setTargetAtTime(musicOn ? 1 : 0, audioCtx.currentTime, 0.3);
  if (musicSend) musicSend.gain.setTargetAtTime(musicOn ? 1 : 0, audioCtx.currentTime, 0.3);
  return musicOn;
}

// Abaixa efeitos e música por alguns segundos, para um aviso se destacar no meio da batalha
const SFX_LEVEL = 0.42, MUSIC_LEVEL = 1.9, AMB_LEVEL = 0.8;
let duckEnd = 0;
// withCue: também abaixa os sinais de aviso (quando é a voz do locutor que vai falar)
function duck(seconds, depth = 0.4, delay = 0, withCue = false) {
  if (!audioCtx || !sfxBus) return;
  const t = audioCtx.currentTime + delay;
  const end = Math.max(duckEnd, t + seconds);
  duckEnd = end;
  const list = [[sfxBus.gain, SFX_LEVEL, depth], [ambBus.gain, AMB_LEVEL, Math.sqrt(depth)],
   [musicDuck.gain, MUSIC_LEVEL * (gameState === 'won' || gameState === 'lost' ? 0.45 : 1), depth]];
  if (withCue) {
    cueBus.gain.cancelScheduledValues(t);
    cueBus.gain.setTargetAtTime(0.28, t, 0.05);
    cueBus.gain.setTargetAtTime(1, t + seconds, 0.3);
  }
  list.forEach(([g, level, dp]) => {
    g.cancelScheduledValues(t);
    g.setTargetAtTime(level * dp, t, 0.04);
    g.setTargetAtTime(level, end, 0.35);
  });
}

// Fim da partida: música mais baixa para a fanfarra e o locutor aparecerem
function endMusic() {
  if (!audioCtx || !musicDuck) return;
  musicDuck.gain.cancelScheduledValues(audioCtx.currentTime);
  musicDuck.gain.setTargetAtTime(MUSIC_LEVEL * 0.45, audioCtx.currentTime, 0.4);
  musicTension = 0;
}
function restoreMusic() {
  if (!audioCtx || !musicDuck) return;
  musicDuck.gain.cancelScheduledValues(audioCtx.currentTime);
  musicDuck.gain.setTargetAtTime(MUSIC_LEVEL, audioCtx.currentTime, 0.5);
}

// ---------- Blocos de construção (usados pelo locutor de reserva e pela música) ----------

// Saída de um som: volume, posição estéreo e quanto vai para o reverb
function voiceOut(vol, pan, rev, bus) {
  const g = audioCtx.createGain();
  g.gain.value = vol;
  let node = g;
  if (pan && audioCtx.createStereoPanner) {
    const p = audioCtx.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    g.connect(p);
    node = p;
  }
  node.connect(bus || sfxBus);
  if (rev) {
    const s = audioCtx.createGain();
    s.gain.value = rev;
    node.connect(s);
    s.connect(reverbSend);
  }
  return g;
}

// Tom com envelope (ataque curto e queda exponencial) e glissando opcional
function tone(out, freq, dur, type, vol, freqEnd, delay = 0, attack = 0.004) {
  const t = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  return osc;
}

// Rajada de ruído filtrado, com o filtro deslizando de f0 para f1
function noise(out, dur, vol, filterType, f0, f1, delay = 0, q = 0.8, attack = 0.002) {
  const t = audioCtx.currentTime + delay;
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  const f = audioCtx.createBiquadFilter();
  f.type = filterType;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f);
  f.connect(g);
  g.connect(out);
  src.start(t, Math.random() * 1.5);
  src.stop(t + dur + 0.05);
  return src;
}

// ---------- Posição no mapa ----------

// Volume, lado e distância de um som no mapa (null = longe demais para ouvir).
// range: até quantos px fora da tela ainda se ouve (sons grandes vão mais longe).
// Na tela tudo soa cheio; fora dela o volume cai suave a partir do mesmo nível (sem degrau na borda).
function placeSound(x, y, range = 420) {
  if (x === undefined) return { vol: 1, pan: 0, dist: 0 };
  const left = camera.x, right = camera.x + camera.ww, top = camera.y, bottom = camera.y + camera.wh;
  const dx = x < left ? left - x : x > right ? x - right : 0;
  const dy = y < top ? top - y : y > bottom ? y - bottom : 0;
  const d = Math.hypot(dx, dy);
  if (d > range) return null;
  const vol = Math.pow(1 - d / range, 1.7) * (gameState === 'title' ? 0.35 : 1);
  // Lado: na tela vai de -0,7 a 0,7; fora dela continua até ±0,9 (o som vem "de lá")
  const rel = (x - camera.x) / Math.max(1, camera.ww) * 2 - 1;
  const pan = clamp(Math.abs(rel) <= 1 ? rel * 0.7 : Math.sign(rel) * (0.7 + Math.min(0.2, (Math.abs(rel) - 1) * 0.4)), -0.9, 0.9);
  return { vol, pan, dist: d / range, px: d };
}

// ---------- Efeitos ----------

// O volume de cada som já vem do banco (loudness por tipo, ver SFX_LUFS em sfxbank.js).
// vol: ajuste fino; gap: ms mínimos entre dois iguais NO MESMO LUGAR; range: px fora da tela;
// rev: reverb de vale; slap: eco das mesas; cls: classe (limite de sons por classe);
// pri: importância (decide quem toca quando a classe está cheia); bus 'ann' = interface/avisos.
const SFX_DEFS = {
  rifle:      { gap: 45, range: 650, rev: 0.16, slap: 0.5, cls: 'shot', pri: 1, pitch: 0.06, light: true },
  mg:         { gap: 50, range: 650, rev: 0.16, slap: 0.5, cls: 'shot', pri: 1, pitch: 0.06, light: true },
  rocket:     { gap: 60, range: 800, rev: 0.22, slap: 0.5, cls: 'shot', pri: 2, pitch: 0.06 },
  cannon:     { gap: 55, range: 1300, rev: 0.3, slap: 0.6, cls: 'shot', pri: 3, pitch: 0.05 },
  turret:     { gap: 60, range: 1300, rev: 0.3, slap: 0.6, cls: 'shot', pri: 3, pitch: 0.04 },
  arty:       { gap: 80, range: 1700, rev: 0.4, slap: 0.7, cls: 'shot', pri: 4, pitch: 0.04 },
  incoming:   { gap: 150, range: 300, rev: 0.12, cls: 'shot', pri: 3, pitch: 0.03 },
  hit_bullet: { gap: 35, range: 300, rev: 0.06, cls: 'hit', pri: 0.5, pitch: 0.12, light: true },
  hit_metal:  { gap: 35, range: 300, rev: 0.06, cls: 'hit', pri: 0.6, pitch: 0.1, light: true },
  hit_shell:  { gap: 60, range: 1000, rev: 0.26, slap: 0.4, cls: 'hit', pri: 2, pitch: 0.06 },
  hit_rocket: { gap: 60, range: 850, rev: 0.26, slap: 0.4, cls: 'hit', pri: 2, pitch: 0.06 },
  death_inf:  { gap: 60, range: 400, rev: 0.08, cls: 'hit', pri: 2, pitch: 0.08 },
  hit_arty:   { gap: 80, range: 1700, rev: 0.4, slap: 0.6, cls: 'boom', pri: 4, pitch: 0.05 },
  boom_small: { gap: 70, range: 1300, rev: 0.35, slap: 0.5, cls: 'boom', pri: 4, pitch: 0.06 },
  boom:       { gap: 70, range: 1600, rev: 0.4, slap: 0.6, cls: 'boom', pri: 5, pitch: 0.06, moment: 0.75 },
  boom_harv:  { gap: 70, range: 1600, rev: 0.4, slap: 0.6, cls: 'boom', pri: 5, pitch: 0.04, moment: 0.5 },
  bigboom:    { gap: 120, range: 2400, rev: 0.5, slap: 0.7, cls: 'boom', pri: 6, pitch: 0.05, moment: 0.4 },
  click:      { gap: 30, bus: 'ann', cls: 'ui', pri: 9, pitch: 0.03 },
  select:     { gap: 60, bus: 'ann', cls: 'ui', pri: 9, pitch: 0.03 },
  error:      { gap: 250, bus: 'ann', cls: 'ui', pri: 9, pitch: 0.02 },
  place:      { gap: 200, range: 500, rev: 0.25, slap: 0.3, cls: 'ui', pri: 8 },
  sell:       { gap: 200, range: 500, rev: 0.2, cls: 'ui', pri: 8 },
  ready:      { gap: 300, bus: 'cue', rev: 0.3, cls: 'ui', pri: 10 },
  unit:       { gap: 200, range: 500, rev: 0.2, cls: 'ui', pri: 8 },
  deploy:     { gap: 300, range: 600, bus: 'ann', rev: 0.22, slap: 0.2, cls: 'ui', pri: 8 },
  credits:    { gap: 1100, range: 400, rev: 0.1, cls: 'ui', pri: 5, pitch: 0.04 },
  alert:      { gap: 1500, bus: 'cue', rev: 0.2, cls: 'ui', pri: 10 },
  detect:     { gap: 1500, bus: 'cue', rev: 0.35, cls: 'ui', pri: 10 },
  repair:     { gap: 400, range: 300, rev: 0.1, cls: 'ui', pri: 6, pitch: 0.05 },
  powerdown:  { gap: 1500, bus: 'cue', rev: 0.2, cls: 'ui', pri: 10 },
  powerup:    { gap: 1500, bus: 'cue', rev: 0.2, cls: 'ui', pri: 10 },
  win:        { gap: 1000, bus: 'cue', rev: 0.4, cls: 'ui', pri: 11 },
  lose:       { gap: 1000, bus: 'cue', rev: 0.4, cls: 'ui', pri: 11 },
};
// Nomes antigos (o tipo de tiro) -> som novo
const SFX_ALIAS = { bullet: 'rifle', shell: 'cannon' };
// Limite de sons simultâneos por classe. Cheia: o som novo toma o lugar do mais fraco tocando
// (importância x volume), se for mais forte que ele; senão não toca.
const CLASS_CAP = { shot: 16, hit: 12, boom: 8, ui: 10 };
const classActive = { shot: [], hit: [], boom: [], ui: [] };
const sfxDropped = {}; // nome -> quantos não tocaram (lido pelos testes)
let lastMoment = -99;  // último "momento" de grande evento (no máximo um a cada 2,5 s)
// Quanto cada som aumenta a tensão da música
const SFX_TENSION = { boom: 0.12, boom_small: 0.08, boom_harv: 0.12, bigboom: 0.35, hit_arty: 0.08, cannon: 0.03, turret: 0.03, rocket: 0.03, arty: 0.05, rifle: 0.012, mg: 0.012 };

// Toca um efeito. Com posição (x, y), o volume, o lado e o brilho dependem de onde ele está.
// opts.delay: segundos até tocar; opts.vol: multiplicador de volume.
function sfx(name, x, y, opts) {
  if (!audioCtx || muted || silentSim) return;
  name = SFX_ALIAS[name] || name;
  const def = SFX_DEFS[name];
  if (!def) return;
  const place = placeSound(x, y, def.range || 420);
  if (!place || place.vol < 0.02) return;
  const bank = SFX_BANK[name];
  if (!bank || !bank.length) { sfxDropped[name] = (sfxDropped[name] || 0) + 1; return; }
  // Intervalo mínimo por som E por região (tiros iguais em lugares diferentes tocam os dois)
  const now = performance.now();
  const gkey = x === undefined ? name : name + ':' + Math.floor(x / 160) + ':' + Math.floor(y / 160);
  if (sfxLast[gkey] && now - sfxLast[gkey] < def.gap) return;
  const cls = def.cls || 'ui';
  // Sinais e interface não passam pelo barramento dos efeitos (que tem ganho 0,42): o fator abaixo os
  // põe na mesma régua da tabela de loudness, abaixo das explosões grandes
  const busK = def.bus === 'cue' ? 0.6 : def.bus === 'ann' ? 0.85 : 1;
  const vol = (def.vol || 1) * busK * place.vol * ((opts && opts.vol) || 1);
  const prio = (def.pri || 1) * (0.25 + vol);
  const ctx = audioCtx;
  // Classe cheia: rouba a vaga do som mais fraco (que some em 40 ms), se o novo for mais importante
  const list = classActive[cls];
  if (list.length >= CLASS_CAP[cls] || activeVoices >= MAX_VOICES) {
    // Classe cheia: o mais fraco da classe. Limite geral cheio: o mais fraco de qualquer classe
    // (uma explosão toma o lugar de um tiro, não é descartada)
    const pool = list.length >= CLASS_CAP[cls] ? list : [].concat(...Object.values(classActive));
    let weakest = null, wv = 0;
    for (const v of pool) { const s = v.strength(); if (!weakest || s < wv) { weakest = v; wv = s; } }
    if (!weakest || wv >= prio) { sfxDropped[name] = (sfxDropped[name] || 0) + 1; return; }
    weakest.kill(); // sai da lista na hora (não pode ser roubada de novo enquanto some)
  }
  sfxLast[gkey] = now;
  if (Object.keys(sfxLast).length > 600) for (const k in sfxLast) if (now - sfxLast[k] > 3000) delete sfxLast[k];

  const tens = SFX_TENSION[name];
  if (tens && gameState !== 'title') musicTension = Math.min(1, musicTension + tens * place.vol);

  // Variação: buffer sorteado (sem repetir o último) e altura levemente diferente
  let idx = (Math.random() * bank.length) | 0;
  if (bank.length > 1 && idx === bank.lastIdx) idx = (idx + 1) % bank.length;
  bank.lastIdx = idx;
  const buf = bank[idx];
  const t = ctx.currentTime + ((opts && opts.delay) || 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = 1 + (Math.random() * 2 - 1) * (def.pitch || 0);
  const g = ctx.createGain();
  g.gain.value = vol;
  src.connect(g);
  let node = g;
  // Longe da tela: perde os agudos (o ar e as pedras filtram) e fica mais "de eco" que direto
  if (place.dist > 0) {
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 9000 * Math.pow(1 - place.dist, 2.5) + 300;
    node.connect(lp);
    node = lp;
  }
  {
    // Sempre pelo panner, mesmo no centro: mono sai a 0,707 em cada lado em qualquer posição (sem salto de 3 dB)
    const p = ctx.createStereoPanner();
    p.pan.value = place.pan;
    node.connect(p);
    node = p;
  }
  const direct = ctx.createGain();
  direct.gain.value = 1 - place.dist * 0.45; // de longe chega menos som direto...
  node.connect(direct);
  direct.connect(def.bus === 'ann' ? annBus : def.bus === 'cue' ? cueBus : (cls === 'shot' || cls === 'hit') ? lightBus : sfxBus);
  const far = 1 + place.dist * 2.5;          // ...e mais reflexão
  if (def.rev) {
    const s = ctx.createGain(); s.gain.value = def.rev * far; node.connect(s); s.connect(def.bus ? reverbSend : sfxRevSend);
  }
  if (def.slap) {
    const s = ctx.createGain(); s.gain.value = def.slap * far; node.connect(s); s.connect(slapSend);
  }
  src.start(t);
  const dur = buf.duration / src.playbackRate.value;
  const voice = {
    prio, start: t, dur, gone: false,
    // Força para o roubo de vaga: som no fim vale menos; explosão no começo é protegida (o peso está na cauda)
    strength() {
      const f = clamp((ctx.currentTime - this.start) / this.dur, 0, 1);
      return this.prio * clamp(1 - f, 0.05, 1) * (cls === 'boom' && f < 0.35 ? 3 : 1);
    },
    release() { if (this.gone) return; this.gone = true; activeVoices--; const i = list.indexOf(this); if (i >= 0) list.splice(i, 1); },
    kill() {
      this.release();
      try { g.gain.setTargetAtTime(0, ctx.currentTime, cls === 'boom' ? 0.05 : 0.015); src.stop(ctx.currentTime + (cls === 'boom' ? 0.25 : 0.08)); } catch (e) { /* já parou */ }
    },
  };
  list.push(voice);
  activeVoices++;
  src.onended = () => voice.release();
  // Grande evento na tela: tiros e impactos abaixam por ~1 s (a explosão aparece por cima do tiroteio)
  if (def.moment && place.dist < 0.25 && t - lastMoment > 2.5) {
    lastMoment = t;
    const lg = lightBus.gain, depth = def.moment;
    lg.cancelScheduledValues(t);
    lg.setTargetAtTime(Math.min(lg.value, depth), t, 0.015);
    lg.setTargetAtTime(1, t + 0.5 + (1 - depth), 0.35);
  }
  sfxPlayLog.push({ name, t: Math.round(gameTime * 100) / 100, vol: Math.round(vol * 1000) / 1000, far: Math.round(place.dist * 100) / 100 });
  if (sfxPlayLog.length > 400) sfxPlayLog.shift();
  if (name === 'win' || name === 'lose') endMusic();
  if (name === 'alert') duck(1.1, 0.5);
}

// Som de tiro conforme quem atira (o tipo do projétil sozinho não diz se é fuzil ou metralhadora)
const SHOOTER_SFX = { trooper: 'rifle', scout: 'mg', rocketeer: 'rocket', tank: 'cannon', artillery: 'arty', turret: 'turret' };
function shotSound(shooter, x, y) {
  sfx(SHOOTER_SFX[shooter.type] || 'rifle', x, y);
}
// Impacto conforme o projétil
function impactSound(kind, x, y, target) {
  const metal = target && target.hp > 0 && (target.kind === 'building' || (UNIT_TYPES[target.type] && UNIT_TYPES[target.type].armor !== 'inf'));
  sfx(kind === 'bullet' ? (metal ? 'hit_metal' : 'hit_bullet') : 'hit_' + kind, x, y);
}
// Explosão de unidade conforme o tamanho
function deathSound(e) {
  const t = e.type;
  sfx(UNIT_TYPES[t].armor === 'inf' ? 'death_inf' : t === 'scout' ? 'boom_small' : t === 'harvester' ? 'boom_harv' : 'boom', e.x, e.y);
}
// Assobio da artilharia chegando: começa ~1 s antes do impacto
function incomingSound(x, y, flight) {
  if (flight < 1.1) return;
  sfx('incoming', x, y, { delay: flight - 1.1 });
}

// ---------- Laços: motores, coleta e zumbido da base ----------
// Cada motor tem duas vozes, uma para cada metade da tela: dois blindados em lados opostos
// soam dos dois lados, não como um só no meio.

const loops = {};   // nome -> { src, gain, pan, level }
const LOOP_NAMES = ['loop_tank', 'loop_light', 'loop_harv', 'loop_grind', 'loop_hum', 'loop_fire'];
function startLoops() {
  if (!audioCtx) return;
  LOOP_NAMES.forEach(name => {
    const bank = SFX_BANK[name];
    if (!bank || loops[name + 'L']) return;
    // O zumbido é feito de senos puros: duas cópias com rotações diferentes vibrariam (batimento). Uma voz só, no centro
    (name === 'loop_hum' ? ['L'] : ['L', 'R']).forEach(side => {
      const src = audioCtx.createBufferSource();
      src.buffer = bank[0];
      src.loop = true;
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      const pan = audioCtx.createStereoPanner();
      pan.pan.value = side === 'L' ? -0.4 : 0.4;
      src.connect(gain);
      gain.connect(pan);
      pan.connect(name === 'loop_hum' ? ambBus : sfxBus);
      // Começos diferentes e rotação levemente diferente: os dois lados não batem juntos
      src.playbackRate.value = side === 'L' ? 1 : 1.03;
      src.start(audioCtx.currentTime + 0.05, side === 'L' ? 0 : bank[0].duration * 0.47);
      loops[name + side] = { src, gain, pan, level: 0, base: src.playbackRate.value };
    });
  });
  // Vento do banco substitui o vento simples do começo
  const wind = SFX_BANK.loop_wind;
  if (wind && !loops.loop_wind) {
    const src = audioCtx.createBufferSource();
    src.buffer = wind[0];
    src.loop = true;
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.24, audioCtx.currentTime, 1.5);
    src.connect(gain);
    gain.connect(ambBus);
    src.start();
    loops.loop_wind = { src, gain, level: 0.24 };
    if (simpleWind) { simpleWind.src.stop(audioCtx.currentTime + 4); simpleWind.lfo.stop(audioCtx.currentTime + 4); simpleWind = null; }
  }
}

// A cada quadro: quanto de cada motor se ouve, conforme as unidades em movimento na tela.
// Só lê o estado do jogo (não muda nada da simulação).
let loopClock = 0;
function updateAudioWorld(dt) {
  if (!audioCtx) return;
  loopClock += dt;
  if (loopClock < 0.1) return; // 10 vezes por segundo basta
  loopClock = 0;
  const live = (gameState === 'playing' || gameState === 'title') && !muted;
  const acc = {};
  LOOP_NAMES.forEach(n => { acc[n + 'L'] = [0, 0, 0]; acc[n + 'R'] = [0, 0, 0]; });
  if (live) {
    const cx = camera.x + camera.ww / 2, w = Math.max(1, camera.ww);
    const add = (key, x, speedK) => {
      const rel = clamp((x - cx) / w * 2, -1, 1);
      const a = acc[key + (rel < 0 || key === 'loop_hum' ? 'L' : 'R')];
      a[0] += 1; a[1] += rel; a[2] += speedK;
    };
    units.forEach(u => {
      if (u.hp <= 0 || !isPointOnScreen(u.x, u.y, 60) || !isVisibleToPlayer(u)) return;
      const moving = u.path.length > 0;
      if (u.type === 'harvester') { if (u.hstate === 'harvest') add('loop_grind', u.x, 0); else if (moving) add('loop_harv', u.x, 1); }
      else if ((u.type === 'tank' || u.type === 'artillery') && moving) add('loop_tank', u.x, 1);
      else if (u.type === 'scout' && moving) add('loop_light', u.x, 1);
    });
    buildings.forEach(b => {
      if (b.team !== 0 || b.hp <= 0 || !isPointOnScreen(b.x, b.y, 40)) return;
      add('loop_hum', b.x, 0);
    });
    // Prédios em chamas (abaixo de metade da vida), de qualquer time, visíveis na tela
    buildings.forEach(b => {
      if (b.hp <= 0 || b.hp > b.maxHp * 0.5 || !isPointOnScreen(b.x, b.y, 60) || !isVisibleToPlayer(b)) return;
      add('loop_fire', b.x, 0);
    });
  }
  const scale = gameState === 'title' ? 0.35 : 1;
  const LEVEL = { loop_tank: 0.55, loop_light: 0.45, loop_harv: 0.55, loop_grind: 0.6, loop_hum: 0.07, loop_fire: 0.45 };
  Object.keys(acc).forEach(key => {
    const L = loops[key];
    if (!L) return;
    const [n, panSum] = acc[key];
    const base = key.slice(0, -1);
    // Vários motores juntos somam como ruído (raiz), não como volume
    const target = n ? LEVEL[base] * Math.min(2.0, Math.sqrt(n)) * scale : 0;
    const now = audioCtx.currentTime;
    L.gain.gain.setTargetAtTime(target, now, target > L.level ? 0.2 : 0.45);
    if (n) L.pan.pan.setTargetAtTime(clamp(panSum / n * 0.75, -0.85, 0.85), now, 0.3);
    // Partida e parada: o motor acelera ao começar a andar e desacelera ao parar
    L.src.playbackRate.setTargetAtTime(L.base * (n ? 1 + Math.min(0.06, n * 0.01) : 0.88), now, n ? 0.35 : 0.6);
    L.level = target;
  });
}

// ---------- Ambiente e música gerados ----------

let musicTension = 0;   // sobe com explosões e tiros, desce devagar: a música acompanha a batalha
let musicTimer = null;
let musicNext = 0;
let musicStep = 0;
// Três progressões (semitons a partir de Lá 220 Hz) que se alternam; cada uma tem um timbre de pad.
// A: Lám Fá Dó Sol (aberta)  B: Lám7 Sol Fá Mi (tensa)  C: Rém7 Lám9 Fá9 Mi7 (sombria)
const PROGRESSIONS = [
  { chords: [[0, 3, 7, 12], [-4, 0, 3, 8], [3, 7, 10, 15], [-2, 2, 5, 10]], wave: 'sawtooth', bright: 1100 },
  { chords: [[0, 3, 7, 10], [-2, 2, 5, 9], [-4, 0, 3, 7], [-5, -1, 2, 7]], wave: 'square', bright: 800 },
  { chords: [[5, 8, 12, 15], [0, 3, 7, 14], [-4, 0, 3, 10], [-5, -1, 2, 5]], wave: 'triangle', bright: 1600 },
];
const SECTION_ORDER = [0, 0, 1, 2, 0, 1, 2, 2]; // seção = 32 s (4 acordes de 8 s)
const note = s => 220 * Math.pow(2, s / 12);

let simpleWind = null; // vento simples do primeiro segundo (o do banco entra por cima)
function startAmbience() {
  // Vento: ruído filtrado com oscilação lenta
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  src.loop = true;
  const f = audioCtx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = 420;
  const g = audioCtx.createGain();
  g.gain.value = 0.035;
  const lfo = audioCtx.createOscillator();
  const lg = audioCtx.createGain();
  lfo.frequency.value = 0.07;
  lg.gain.value = 0.02;
  lfo.connect(lg);
  lg.connect(g.gain);
  const lfo2 = audioCtx.createOscillator();
  const lg2 = audioCtx.createGain();
  lfo2.frequency.value = 0.11;
  lg2.gain.value = 180;
  lfo2.connect(lg2);
  lg2.connect(f.frequency);
  src.connect(f);
  f.connect(g);
  g.connect(ambBus);
  simpleWind = { src, lfo };
  src.start();
  lfo.start();
  lfo2.start();
  musicNext = audioCtx.currentTime + 0.5;
  musicTimer = setInterval(scheduleMusic, 200);
}

// Agenda os próximos compassos (2 s cada): pad, baixo, arpejo e percussão conforme a tensão
function scheduleMusic() {
  if (!audioCtx || audioCtx.state !== 'running') return;
  // Mudo: não agenda nada; depois de um travamento, não dispara os compassos atrasados de uma vez
  if (muted) { musicNext = Math.max(musicNext, audioCtx.currentTime + 0.3); return; }
  if (musicNext < audioCtx.currentTime - 0.1) musicNext = audioCtx.currentTime + 0.1;
  musicTension = Math.max(0, musicTension - 0.004);
  while (musicNext < audioCtx.currentTime + 0.6) {
    const t = musicNext;
    const section = Math.floor(musicStep / 16);
    const prog = PROGRESSIONS[SECTION_ORDER[section % SECTION_ORDER.length]];
    const chord = prog.chords[Math.floor(musicStep / 4) % 4];
    const tense = gameState === 'playing' ? musicTension : 0;
    if (musicStep % 4 === 0) {
      pad(chord, t, 8, prog);
      bass(note(chord[0] - 24), t, 8, section % 2 === 1 || tense > 0.15);
    }
    // Arpejo esparso, mais denso quando a tensão sobe; em algumas seções vira um padrão regular
    const steady = section % 3 === 2;
    for (let k = 0; k < 4; k++) {
      const hit = steady ? (k % 2 === 0 || Math.random() < tense) : Math.random() < 0.28 + tense * 0.4;
      if (hit) pluck(note(chord[(k + musicStep) % chord.length] + 12 + (Math.random() < 0.3 ? 12 : 0)), t + k * 0.5);
    }
    // Percussão: chimbal leve já em escaramuças, bumbo e caixa quando a batalha esquenta
    if (tense > 0.08 || (section % 4 === 3 && gameState === 'playing')) {
      const k0 = Math.max(0.3, tense);
      for (let k = 0; k < 8; k++) hat(t + k * 0.25, k0 * (k % 2 ? 0.6 : 1));
    }
    if (tense > 0.2) {
      for (let k = 0; k < 4; k++) drum(t + k * 0.5, tense, k % 2 === 0);
      if (tense > 0.55 && Math.random() < 0.5) drum(t + 1.75, tense * 0.7, true);
    }
    musicStep++;
    musicNext += 2;
  }
}

// Baixo: nota longa e grave (pulsa em colcheias nas seções agitadas)
function bass(freq, t, dur, pulse) {
  const o = audioCtx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  if (pulse) {
    for (let i = 0; i < dur * 2; i++) {
      const ti = t + i * 0.5;
      g.gain.setValueAtTime(0.0001, ti);
      g.gain.exponentialRampToValueAtTime(0.055, ti + 0.02);
      g.gain.exponentialRampToValueAtTime(0.012, ti + 0.45);
    }
  } else {
    g.gain.exponentialRampToValueAtTime(0.035, t + 1);
    g.gain.setValueAtTime(0.035, t + dur - 1);
  }
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
  o.connect(g);
  g.connect(musicBus);
  o.start(t);
  o.stop(t + dur + 0.4);
}

function hat(t, k) {
  const src = audioCtx.createBufferSource();
  src.buffer = noiseBuf;
  const f = audioCtx.createBiquadFilter();
  f.type = 'highpass';
  f.frequency.value = 7000;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.025 * k, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(f);
  f.connect(g);
  g.connect(musicBus);
  src.start(t, Math.random());
  src.stop(t + 0.07);
}

function pad(chord, t, dur, prog) {
  const out = audioCtx.createGain();
  out.gain.setValueAtTime(0.0001, t);
  // Em batalha o pad fica mais presente e mais brilhante
  const lvl = 0.035 * (1 + (gameState === 'playing' ? musicTension : 0) * 0.6);
  out.gain.exponentialRampToValueAtTime(lvl, t + 2);
  out.gain.setValueAtTime(lvl, t + dur - 2);
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(500, t);
  lp.frequency.linearRampToValueAtTime(prog.bright * (1 + (gameState === 'playing' ? musicTension : 0)), t + dur / 2);
  lp.frequency.linearRampToValueAtTime(500, t + dur);
  lp.connect(out);
  out.connect(musicBus);
  const send = audioCtx.createGain();
  send.gain.value = 0.8;
  out.connect(send);
  send.connect(musicSend);
  chord.forEach(s => {
    [-6, 6].forEach(det => {
      const o = audioCtx.createOscillator();
      o.type = prog.wave;
      o.frequency.value = note(s);  // pad no registro médio (antes uma oitava abaixo: grave demais)
      o.detune.value = det;
      const g = audioCtx.createGain();
      g.gain.value = { sawtooth: 0.25, square: 0.18, triangle: 0.42 }[prog.wave];
      o.connect(g);
      g.connect(lp);
      o.start(t);
      o.stop(t + dur + 0.6);
    });
  });
}

function pluck(freq, t) {
  const o = audioCtx.createOscillator();
  o.type = 'triangle';
  o.frequency.value = freq;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
  o.connect(g);
  g.connect(musicBus);
  const send = audioCtx.createGain();
  send.gain.value = 1.2;
  g.connect(send);
  send.connect(musicSend);
  o.start(t);
  o.stop(t + 1.3);
}

function drum(t, k, kick) {
  const g = audioCtx.createGain();
  g.connect(musicBus);
  if (kick) {
    const o = audioCtx.createOscillator();
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12 * k, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.35);
  } else {
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    const f = audioCtx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055 * k, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(f);
    f.connect(g);
    src.start(t, Math.random());
    src.stop(t + 0.15);
  }
}
