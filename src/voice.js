// Locutor e falas das tropas.
//
// As falas vêm do pacote src/voicepack.js: geradas com um sintetizador de voz neural
// (tools/voz/gerar.py) e guardadas no próprio código. Por isso falam igual em qualquer navegador,
// sem internet e sem voz instalada. O jogo trata a voz ao vivo: filtro de rádio, compressão,
// chiado de abertura e fechamento do canal, e abaixa efeitos e música enquanto fala.
//
// Reservas (se o pacote faltar ou o navegador não decodificar MP3):
//   1. a voz do navegador (speechSynthesis), preferindo vozes locais;
//   2. o sintetizador de formantes daqui (voz robótica), para as frases que ele conhece.
//
// Fila do locutor: uma fala de cada vez, por prioridade. Avisos de perigo passam na frente
// (e interrompem uma fala pouco importante); falas que esperaram demais perdem a validade.

const voiceLog = [];         // falas pedidas { text, key, t, via } (lido pelos testes)
const voiceLast = {};        // último instante de cada fala (para não repetir em sequência)
const VOICE_BUF = {};        // chave -> AudioBuffer decodificado do pacote
let voicePackState = 'nada'; // 'nada' | 'carregando' | 'pronto' | 'falhou'
let voicesReady = false;
let voiceList = [];
let voiceBusyUntil = 0;
const forceRobot = new URLSearchParams(location.search).has('vozrobo');
const noPack = new URLSearchParams(location.search).has('semvozes'); // testa as reservas

function loadVoices() {
  if (!window.speechSynthesis) return;
  voiceList = speechSynthesis.getVoices() || [];
  voicesReady = voiceList.length > 0;
}
if (window.speechSynthesis) {
  loadVoices();
  if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', loadVoices);
}

// ---------- Catálogo ----------
// key: fala do pacote. p: prioridade (3 perigo, 2 importante, 1 normal, 0 detalhe).
// gap: segundos mínimos até repetir. wait: segundos que pode esperar na fila.
const LINES = {
  harvester_deployed: { p: 2, gap: 4, wait: 6, en: 'Harvester deployed' },
  inicio:             { p: 1, gap: 30, wait: 4 },
  construindo:        { p: 0, gap: 6, wait: 1.5 },
  construcao_pronta:  { p: 2, gap: 3, wait: 8 },
  pronto_power:       { p: 2, gap: 3, wait: 8 },
  pronto_refinery:    { p: 2, gap: 3, wait: 8 },
  pronto_barracks:    { p: 2, gap: 3, wait: 8 },
  pronto_factory:     { p: 2, gap: 3, wait: 8 },
  pronto_radar:       { p: 2, gap: 3, wait: 8 },
  pronto_turret:      { p: 2, gap: 3, wait: 8 },
  local_invalido:     { p: 0, gap: 4, wait: 1 },
  sem_creditos:       { p: 1, gap: 8, wait: 2 },
  treinando:          { p: 0, gap: 6, wait: 1.5 },
  unidade_trooper:    { p: 1, gap: 12, wait: 4 },
  unidade_rocketeer:  { p: 1, gap: 12, wait: 4 },
  unidade_scout:      { p: 1, gap: 12, wait: 4 },
  unidade_tank:       { p: 1, gap: 12, wait: 4 },
  unidade_artillery:  { p: 1, gap: 12, wait: 4 },
  unidades_prontas:   { p: 1, gap: 8, wait: 4 },
  base_ataque:        { p: 3, gap: 20, wait: 6, en: 'Base under attack' },
  coletor_ataque:     { p: 3, gap: 20, wait: 6, en: 'Harvester under attack' },
  unidades_ataque:    { p: 2, gap: 25, wait: 5 },
  inimigo_detectado:  { p: 2, gap: 30, wait: 4 },
  inimigo_base:       { p: 2, gap: 40, wait: 5 },
  energia_baixa:      { p: 2, gap: 25, wait: 6, en: 'Low power' },
  energia_ok:         { p: 1, gap: 10, wait: 4 },
  estrutura_perdida:  { p: 2, gap: 8, wait: 5 },
  coletor_perdido:    { p: 2, gap: 6, wait: 5 },
  unidade_perdida:    { p: 1, gap: 45, wait: 3 },
  central_perdida:    { p: 3, gap: 10, wait: 8 },
  vendido:            { p: 1, gap: 3, wait: 3 },
  reparando:          { p: 0, gap: 5, wait: 1.5 },
  limite:             { p: 1, gap: 10, wait: 3 },
  inimigo_destruido:  { p: 1, gap: 10, wait: 4 },
  encontro:           { p: 0, gap: 4, wait: 1.5 },
  vitoria:            { p: 3, gap: 1, wait: 10, en: 'Victory' },
  derrota:            { p: 3, gap: 1, wait: 10, en: 'Defeat' },
};

// Texto de cada fala (do pacote; sem pacote, um texto fixo para as reservas)
function lineText(key) {
  if (typeof VOICE_PACK !== 'undefined' && VOICE_PACK[key]) return VOICE_PACK[key].t.replace(/[.!]$/, '');
  return key;
}

// ---------- Pacote de vozes ----------

function b64ToBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// Decodifica as falas (uma vez, depois do primeiro clique). As do locutor primeiro.
function loadVoicePack() {
  if (voicePackState !== 'nada' || !audioCtx || noPack || typeof VOICE_PACK === 'undefined') {
    if (voicePackState === 'nada' && (noPack || typeof VOICE_PACK === 'undefined')) voicePackState = 'falhou';
    return;
  }
  voicePackState = 'carregando';
  // Ordem: abertura, depois perigos e avisos (as respostas das tropas e as leituras extras por último)
  const pr = k => k === 'inicio' ? 9 : (LINES[k] || { p: -1 }).p;
  const keys = Object.keys(VOICE_PACK).sort((a, b) => pr(b) - pr(a));
  let ok = 0, bad = 0;
  // Decodifica a 24 kHz (a taxa das vozes): metade da memória de decodificar na taxa da placa
  let dec = audioCtx;
  try { dec = new OfflineAudioContext(1, 1, 24000); } catch (e) { dec = audioCtx; }
  const decode = key => new Promise(res => {
    let done = false;
    const fin = buf => { if (done) return; done = true; if (buf) { VOICE_BUF[key] = buf; ok++; } else bad++; res(); };
    try {
      const p = dec.decodeAudioData(b64ToBuffer(VOICE_PACK[key].a), fin, () => fin(null));
      if (p && p.catch) p.catch(() => fin(null));
    } catch (e) { fin(null); }
  });
  keys.reduce((p, k) => p.then(() => decode(k)), Promise.resolve()).then(() => {
    voicePackState = ok > 0 ? 'pronto' : 'falhou';
  });
}

// ---------- Cadeia de rádio (tratamento ao vivo da voz) ----------

let annChain = null;  // entrada da cadeia do locutor
let ackChains = null; // { inf, veh }: tropas (infantaria quase limpa, veículos pelo rádio)
function radioChain(o) {
  const ctx = audioCtx;
  const out = ctx.createGain();
  out.gain.value = o.vol;
  out.connect(annBus);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -22; comp.knee.value = 8; comp.ratio.value = 2.5; comp.attack.value = 0.005; comp.release.value = 0.15;
  comp.connect(out);
  const sat = ctx.createWaveShaper();
  const c = new Float32Array(512);
  for (let i = 0; i < 512; i++) { const x = i / 255.5 - 1; c[i] = Math.tanh(x * o.drive) / Math.tanh(o.drive); }
  sat.curve = c;
  sat.connect(comp);
  const pres = ctx.createBiquadFilter();
  pres.type = 'peaking'; pres.frequency.value = o.presence; pres.Q.value = 0.9; pres.gain.value = o.presenceDb;
  pres.connect(sat);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.lp; lp.Q.value = 0.6;
  lp.connect(pres);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = o.hp; hp.Q.value = 0.7;
  hp.connect(lp);
  // Um pouco de sala (a voz não fica "colada" no ouvido)
  const rs = ctx.createGain(); rs.gain.value = o.room; comp.connect(rs); rs.connect(reverbSend);
  return hp;
}
function ensureChains() {
  if (annChain || !audioCtx) return;
  // Pouca saturação (ela come consoantes); a cor de rádio vem mais da faixa de frequências
  annChain = radioChain({ vol: 1.0, hp: 130, lp: 10000, presence: 3200, presenceDb: 2.5, drive: 1.05, room: 0.05 });
  ackChains = {
    inf: radioChain({ vol: 1.0, hp: 180, lp: 8000, presence: 2800, presenceDb: 2.5, drive: 1.1, room: 0.04 }),
    veh: radioChain({ vol: 1.0, hp: 300, lp: 6800, presence: 2200, presenceDb: 3, drive: 1.1, room: 0.03 }),
  };
}

// Chiado de rádio (abertura e fechamento do canal): curto e discreto
function radioChirp(delay, close, vol = 1) {
  if (!audioCtx || muted) return;
  const o = voiceOut(0.22 * vol, 0, 0.03, annBus);
  return [noise(o, close ? 0.06 : 0.08, 0.2, 'bandpass', 2600, 1700, delay, 1.5),
    tone(o, close ? 1250 : 1750, 0.04, 'sine', 0.1, 0, delay + (close ? 0 : 0.03))];
}

// ---------- Fila do locutor ----------
// Locutor e tropas dividem um só "canal": nunca duas vozes ao mesmo tempo.
// Cada fala pode trazer um sinal sonoro (cue: sirene, sino de pronto, pulso de radar...), que toca
// antes dela, na mesma entrada da fila: o sinal anuncia, a voz fala por cima de um sinal já abaixado.

let annQueue = [];       // { key, p, at, wait, cue }
let annNow = null;       // { key, p, src, end }
let annTimer = null;
const annHistory = [];   // instantes em que o locutor falou (para não falar demais)
let lastUnitReadyAt = -99;
// Quanto cada sinal toca antes da voz entrar (s)
const CUE_LEAD = { alert: 0.85, ready: 0.3, detect: 0.35, deploy: 0.55, powerdown: 0.45, powerup: 0.35, win: 1.3, lose: 1.5 };

// Pede uma fala do locutor (chave do catálogo). Devolve true se entrou na fila.
// opts: lead (s de espera), gap (troca o intervalo mínimo), cue (sinal antes da fala), cueX/cueY (posição do sinal)
function announce(key, opts = {}) {
  let L = LINES[key];
  if (!L || demoMode) return false;
  const now = performance.now() / 1000;
  // Fala recusada: o sinal ainda toca (o prédio ficou pronto mesmo), menos sirene e radar, que só valem
  // junto com a fala (senão a sirene repete a cada ataque)
  const cueOnly = () => { if (opts.cue && opts.cue !== 'alert' && opts.cue !== 'detect') sfx(opts.cue, opts.cueX, opts.cueY); return false; };
  // Várias unidades prontas em seguida: uma fala só ("Unidades prontas")
  // (só as falas de unidade pronta: "unidade_perdida" não entra)
  if (key.startsWith('unidade_') && UNIT_TYPES[key.slice(8)]) {
    if (now - lastUnitReadyAt < 8) key = 'unidades_prontas';
    lastUnitReadyAt = now;
    L = LINES[key];
  }
  // "Se aproximando" depois de "sob ataque" não faz sentido
  if (key === 'inimigo_base' && voiceLast.base_ataque && now - voiceLast.base_ataque < 40) return false;
  // "Inimigo detectado" logo depois de um "sob ataque" está fora de contexto
  if (key === 'inimigo_detectado' && ['base_ataque', 'coletor_ataque'].some(k => voiceLast[k] && now - voiceLast[k] < 20)) return cueOnly();
  if (voiceLast[key] && now - voiceLast[key] < (opts.gap ?? L.gap)) return cueOnly();
  const text = lineText(key);
  if (!audioCtx || muted || silentSim) {
    voiceLog.push({ text, key, t: Math.round(gameTime * 10) / 10, via: 'mudo' });
    if (voiceLog.length > 80) voiceLog.shift();
    return false;
  }
  // Locutor falando demais: o que é só informativo fica de fora
  // (só as falas informativas contam para o limite: avisos importantes não calam "Blindado pronto")
  const recent = annHistory.filter(h => h.p <= 1 && now - h.t < 60).length;
  if ((L.p <= 1 && recent >= 7 && key !== 'inicio') || (L.p === 0 && annHistory.some(h => now - h.t < 8))) return cueOnly();
  // A mesma fala já esperando: não duplica
  if (annQueue.some(q => q.key === key) || (annNow && annNow.key === key)) return cueOnly();
  voiceLast[key] = now;
  annQueue.push({ key, p: L.p, at: now + (opts.lead || 0), wait: L.wait + (opts.lead || 0), cue: opts.cue, cueX: opts.cueX, cueY: opts.cueY });
  if (annQueue.length > 5) {
    annQueue.sort((a, b) => b.p - a.p || a.at - b.at);
    annQueue.length = 5;
  }
  // Perigo: o que é só aviso de contato sai da fila (o "sob ataque" diz mais), e a fala de
  // prioridade menor que esteja no meio é cortada. Vitória e derrota limpam a fila inteira.
  if (L.p >= 3) {
    const end = key === 'vitoria' || key === 'derrota';
    annQueue = annQueue.filter(q => q.key === key || (!end && !DANGER_SUPERSEDES.includes(q.key)));
    // A fala pedida pelo Rodrigo ("Harvester deployed") termina; o perigo entra logo depois
    if (annNow && annNow.src && (end ? annNow.key !== key : annNow.p <= 2 && !NEVER_CUT.includes(annNow.key))) cutLine();
  }
  if (!annTimer) annTimer = setInterval(pumpAnnouncer, 40);
  pumpAnnouncer();
  return true;
}

// Avisos que um "sob ataque" torna desnecessários
const DANGER_SUPERSEDES = ['inimigo_detectado', 'inimigo_base', 'unidades_ataque'];
// Falas curtas que não são cortadas por um perigo
const NEVER_CUT = ['harvester_deployed'];
function cutLine() {
  try { annNow.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02); annNow.src.stop(audioCtx.currentTime + 0.1); } catch (e) { /* já parou */ }
  // O chiado de fechamento agendado para o fim da fala cortada também sai
  if (annNow.chirp) try { annNow.chirp.forEach(n => n.stop(audioCtx.currentTime + 0.05)); } catch (e) { /* já parou */ }
  annNow.end = audioCtx.currentTime + 0.1;
}
// Nível de cada fala igualado pelo RMS só dos trechos com voz (acima de -40 dB do pico):
// o pacote não vem normalizado, e "Inimigo detectado" saía 3 dB abaixo das outras
const SPEECH_REF = 0.14; // mediana do pacote
function speechGain(buf) {
  if (buf._g) return buf._g;
  const d = buf.getChannelData(0);
  let pk = 1e-6;
  for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > pk) pk = v; }
  let acc = 0, n = 0;
  const thr = pk * 0.01;
  for (let i = 0; i < d.length; i += 4) { const v = d[i]; if (Math.abs(v) > thr) { acc += v * v; n++; } }
  const rms = n ? Math.sqrt(acc / n) : SPEECH_REF;
  buf._g = clamp(SPEECH_REF / rms, 0.6, 1.6);
  return buf._g;
}
// Leituras alternativas de uma fala (chave_v2, chave_v3): não repete a última
const lastTake = {};
function pickTake(key) {
  const takes = [key, key + '_v2', key + '_v3'].filter(k => VOICE_BUF[k]);
  if (takes.length <= 1) return VOICE_BUF[key];
  let i = (Math.random() * takes.length) | 0;
  if (takes[i] === lastTake[key]) i = (i + 1) % takes.length;
  lastTake[key] = takes[i];
  return VOICE_BUF[takes[i]];
}

function pumpAnnouncer() {
  if (!audioCtx) return;
  const ctxNow = audioCtx.currentTime, now = performance.now() / 1000;
  if (annNow && ctxNow < annNow.end) return;
  if (speechBusy()) return; // a voz do navegador ainda falando
  annNow = null;
  annQueue = annQueue.filter(q => now - q.at < q.wait);
  const ready = annQueue.filter(q => q.at <= now);
  if (!ready.length) {
    if (!annQueue.length) { clearInterval(annTimer); annTimer = null; }
    return;
  }
  ready.sort((a, b) => b.p - a.p || a.at - b.at);
  const item = ready[0];
  // Pacote ainda decodificando esta fala: espera (em vez de cair na voz de reserva)
  if (voicePackState === 'carregando' && !VOICE_BUF[item.key]) return;
  // Uma tropa respondendo: perigo corta; o resto espera ela terminar
  if (ackNow && ctxNow < ackEnd) {
    if (item.p >= 3) { try { ackGain.gain.setTargetAtTime(0, ctxNow, 0.015); ackNow.stop(ctxNow + 0.06); } catch (e) { /* já parou */ } ackEnd = ctxNow; }
    else return;
  }
  annQueue = annQueue.filter(q => q !== item);
  playLine(item);
}

function playLine(item) {
  const text = lineText(item.key);
  const entry = { text, key: item.key, t: Math.round(gameTime * 10) / 10, via: 'sem voz' };
  const buf = VOICE_BUF[item.key] ? pickTake(item.key) : null;
  const ctx = audioCtx;
  // O sinal toca primeiro; a voz entra quando o principal dele já passou
  let lead = 0;
  if (item.cue) { sfx(item.cue, item.cueX, item.cueY); lead = CUE_LEAD[item.cue] || 0.3; }
  annHistory.push({ t: performance.now() / 1000, p: item.p });
  if (annHistory.length > 30) annHistory.shift();
  if (buf && !forceRobot) {
    ensureChains();
    const t = ctx.currentTime + lead + 0.16; // a voz entra depois do chiado, sem encostar nele
    radioChirp(lead, false, 0.7);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = speechGain(buf);
    src.connect(g);
    g.connect(annChain);
    src.start(t);
    const end = t + buf.duration;
    const chirp = radioChirp(end - ctx.currentTime + 0.04, true, 0.7);
    // Abaixa efeitos, música e o próprio sinal enquanto a voz fala (perigo abaixa mais)
    duck(buf.duration + 0.25, item.p >= 3 ? 0.35 : 0.5, lead + 0.1, true);
    annNow = { key: item.key, p: item.p, src, gain: g, end: end + 0.22, chirp };
    entry.via = 'pacote';
  } else {
    entry.via = fallbackSpeak(item.key, text);
    annNow = { key: item.key, p: item.p, end: voiceBusyUntil };
  }
  voiceLog.push(entry);
  if (voiceLog.length > 80) voiceLog.shift();
}

function stopVoices() {
  annQueue = [];
  if (annNow && annNow.src) { try { annNow.src.stop(); } catch (e) { /* já parou */ } }
  annNow = null;
  if (ackNow) { try { ackNow.stop(); } catch (e) { /* já parou */ } ackNow = null; }
}

// ---------- Falas das tropas (respostas a seleção e ordens) ----------
// Infantaria: um soldado com rádio de mão. Veículos e Coletor: outro tripulante, pelo rádio do veículo.

const ACKS = {};
function ackPool(name) {
  if (!ACKS[name]) ACKS[name] = Object.keys(typeof VOICE_PACK !== 'undefined' ? VOICE_PACK : {}).filter(k => k.replace(/_\d+$/, '') === name);
  return ACKS[name];
}
let ackNow = null, ackGain = null, ackEnd = 0, ackKind = '', ackLastKey = '', ackLastAt = 0;
const ackLog = []; // { key, t } (lido pelos testes)

// group: unidades que receberam a ordem; kind: 'sel' | 'mov' | 'atk'
function unitAck(group, kind) {
  if (!audioCtx || muted || silentSim || demoMode || !group || !group.length) return;
  if (!group.some(u => u.team === 0)) return;
  const ctx = audioCtx;
  const now = performance.now() / 1000;
  // O locutor tem a vez: com ele falando (ou prestes a falar), a tropa fica quieta
  if (annNow && ctx.currentTime < annNow.end) return;
  if (annQueue.some(q => q.at <= now)) return;
  const playing = ackNow && ctx.currentTime < ackEnd - 0.1;
  if (kind === 'sel') {
    // Seleções seguidas não falam toda vez
    if (playing || now - ackLastAt < 1.6) return;
  } else if (playing) {
    // A ordem vale mais que a resposta à seleção: corta a seleção e responde à ordem
    if (ackKind !== 'sel' && now - ackLastAt < 1.2) return;
    try { ackGain.gain.setTargetAtTime(0, ctx.currentTime, 0.015); ackNow.stop(ctx.currentTime + 0.05); } catch (e) { /* já parou */ }
  } else if (ackKind !== 'sel' && now - ackLastAt < 0.9) return;
  const lead = group.find(u => u.type !== 'harvester') || group[0];
  const harv = lead.type === 'harvester';
  const veh = !harv && lead.type !== 'trooper' && lead.type !== 'rocketeer';
  const pool = ackPool(harv ? (kind === 'sel' ? 'col_sel' : 'col_mov') : (veh ? 'v' : '') + kind);
  if (!pool.length) return;
  let key = pool[(Math.random() * pool.length) | 0];
  if (pool.length > 1 && key === ackLastKey) key = pool[(pool.indexOf(key) + 1) % pool.length];
  const buf = VOICE_BUF[key];
  ackLastAt = now;
  if (!buf) return;
  ensureChains();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  // Cada tipo de unidade com um timbre um pouco diferente do mesmo tripulante
  src.playbackRate.value = { trooper: 1.0, rocketeer: 0.97, scout: 1.04, tank: 0.96, artillery: 0.98, harvester: 0.97 }[lead.type] || 1;
  const g = ctx.createGain();
  g.gain.value = speechGain(buf);
  src.connect(g);
  g.connect(veh || harv ? ackChains.veh : ackChains.inf);
  const t = ctx.currentTime + (veh || harv ? 0.12 : 0.04);
  if (veh || harv) radioChirp(0, false, 0.5);
  src.start(t);
  ackNow = src;
  ackGain = g;
  ackKind = kind;
  ackEnd = t + buf.duration / src.playbackRate.value;
  duck(ackEnd - ctx.currentTime + 0.1, 0.7, 0.02); // a resposta se ouve sem abafar a batalha
  ackLastKey = key;
  ackLog.push({ key, t: Math.round(gameTime * 10) / 10 });
  if (ackLog.length > 40) ackLog.shift();
}

// ---------- Compatibilidade: say(texto) dos avisos antigos ----------
const SAY_KEYS = {
  'Base under attack': 'base_ataque', 'Harvester under attack': 'coletor_ataque', 'Low power': 'energia_baixa',
  'Construction finished': 'construcao_pronta', 'Victory': 'vitoria', 'Defeat': 'derrota',
  'Harvester deployed': 'harvester_deployed',
};
function say(text, lang, gap, lead) {
  const key = SAY_KEYS[text];
  if (key) announce(key, { lead, gap });
}

// ---------- Eventos do jogo -> falas ----------

// Coletor implantado no campo de cristal pela primeira vez: "Harvester deployed"
// (o som hidráulico e a voz saem juntos, na mesma entrada da fila)
const harvDeployed = new WeakSet();
function announceHarvester(u) {
  if (demoMode || !u || u.team !== 0 || harvDeployed.has(u)) return;
  harvDeployed.add(u);
  if (silentSim) return;
  announce('harvester_deployed', { cue: 'deploy', cueX: u.x, cueY: u.y });
}

// Vigia de situações (só lê o estado do jogo): inimigo à vista, inimigo perto da base.
let watchClock = 0;
let enemySeenUntil = -999;  // até quando o último contato conta como "o mesmo"
const announcedStart = { done: false };
function updateAnnouncer(dt) {
  if (!audioCtx || demoMode || gameState !== 'playing') return;
  watchClock += dt;
  if (watchClock < 0.5) return;
  watchClock = 0;
  if (!announcedStart.done && gameTime > 1.2) {
    announcedStart.done = true;
    announce('inicio');
  }
  // Inimigos armados visíveis agora
  const foes = units.filter(u => u.team !== 0 && u.hp > 0 && hasWeapon(u) && isVisibleToPlayer(u));
  if (foes.length) {
    // Contato novo depois de 25 s sem ver ninguém: pulso do radar e "Inimigo detectado"
    if (gameTime > enemySeenUntil) {
      const f = foes[0];
      announce('inimigo_detectado', { cue: 'detect' });
      lastAlertPos = { x: f.x, y: f.y };
      pings.push({ x: f.x, y: f.y, t: 0 });
    }
    enemySeenUntil = gameTime + 25;
    // Grupo inimigo (3 ou mais) perto dos prédios do jogador
    const mine = buildings.filter(b => b.team === 0 && b.hp > 0);
    const near = foes.filter(f => mine.some(b => Math.hypot(f.x - b.x, f.y - b.y) < 9 * TILE));
    if (near.length >= 3) announce('inimigo_base', { cue: 'alert' });
  }
}
function resetAnnouncer() {
  announcedStart.done = false;
  enemySeenUntil = -999;
  annQueue = [];
  lastUnitReadyAt = -99;
}

// ---------- Reserva 1: voz do navegador ----------

// Melhor voz para o idioma: locais e naturais primeiro (as vozes de rede falham sem aviso)
function pickVoice(lang) {
  const base = lang.slice(0, 2);
  const list = voiceList.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(base));
  if (!list.length) return null;
  const local = list.filter(v => v.localService !== false);
  const pool = local.length ? local : list;
  const prefs = base === 'en'
    ? [/natural/i, /daniel|guy|davis|andrew|ryan|christopher|alex|fred|david|mark/i]
    : [/natural/i, /antonio|daniel|ricardo|felipe/i, /luciana|francisca|maria/i];
  for (const re of prefs) {
    const v = pool.find(x => re.test(x.name));
    if (v) return v;
  }
  return pool.find(v => (v.lang || '').toLowerCase().replace('_', '-') === lang.toLowerCase()) || pool[0];
}

let speechUntil = 0;
const liveUtterances = []; // guarda as falas em andamento (o Chrome perde o fim delas se forem coletadas)
function speechBusy() {
  return window.speechSynthesis && performance.now() / 1000 < speechUntil && speechSynthesis.speaking;
}

// Fala sem o pacote. Devolve por onde saiu.
function fallbackSpeak(key, text) {
  const L = LINES[key] || {};
  // Todas as falas são em inglês: a reserva usa sempre uma voz en-US
  const voice = forceRobot ? null : pickVoice('en-US');
  const spoken = text, lang = 'en-US';
  if (voice && window.speechSynthesis) {
    radioChirp(0, false);
    const len = 0.4 + spoken.length * 0.075;
    voiceBusyUntil = audioCtx.currentTime + len;
    speechUntil = performance.now() / 1000 + len + 2;
    duck(len, 0.5, 0.05);
    try {
      if (speechSynthesis.paused) speechSynthesis.resume();
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = lang; u.voice = voice; u.rate = 1.0; u.pitch = 0.9; u.volume = 1;
      u.onend = () => { speechUntil = 0; liveUtterances.splice(liveUtterances.indexOf(u), 1); if (audioCtx && !muted) radioChirp(0, true); };
      // Se a voz falhar (comum nas vozes de rede), cai para a voz robótica
      u.onerror = () => { speechUntil = 0; const r = ROBOT_PHRASES[L.en || spoken]; if (r && audioCtx && !muted) robotLine(L.en || spoken); };
      liveUtterances.push(u);
      setTimeout(() => { if (!muted) speechSynthesis.speak(u); }, 120);
      return 'navegador';
    } catch (e) { /* segue para a robótica */ }
  }
  const phrase = key === 'harvester_deployed' ? 'Harvester deployed' : L.en;
  if (phrase && ROBOT_PHRASES[phrase]) { robotLine(phrase); return 'robo'; }
  return 'sem voz';
}

function robotLine(phrase) {
  const now = audioCtx.currentTime;
  radioChirp(0, false);
  const len = robotSpeak(ROBOT_PHRASES[phrase], 0.16);
  voiceBusyUntil = now + 0.2 + len;
  duck(len + 0.3, 0.45);
  radioChirp(voiceBusyUntil - now, true);
}

// ---------- Reserva 2: sintetizador de formantes ----------
// Fonte vozeada (dente de serra) passa por três filtros de formante; fricativas e plosivas
// usam ruído filtrado. Cada fonema: duração e alvos [F1, F2, F3], vozeamento e ruído.

const PHONEMES = {
  HH: { f: [730, 1090, 2440], v: 0, n: 0.3, nf: 1500, nq: 0.6 },
  AA: { f: [730, 1090, 2440], v: 1 },
  AE: { f: [660, 1720, 2410], v: 1 },
  AH: { f: [640, 1190, 2390], v: 0.9 },
  EY: { f: [530, 1840, 2480], v: 1, to: [390, 2100, 2650] },
  IH: { f: [390, 1990, 2550], v: 0.9 },
  IY: { f: [280, 2250, 2950], v: 0.9 },
  ER: { f: [490, 1350, 1690], v: 1 },
  OY: { f: [570, 840, 2410], v: 1, to: [320, 2100, 2850] },
  OW: { f: [520, 900, 2400], v: 1, to: [380, 780, 2300] },
  R: { f: [460, 1190, 1600], v: 0.7 },
  L: { f: [360, 1000, 2700], v: 0.6 },
  W: { f: [300, 700, 2200], v: 0.6 },
  N: { f: [280, 1650, 2600], v: 0.45 },
  M: { f: [280, 1000, 2300], v: 0.45 },
  V: { f: [300, 1200, 2300], v: 0.2, n: 0.2, nf: 4200, nq: 1 },
  F: { f: [300, 1200, 2300], v: 0, n: 0.3, nf: 5200, nq: 0.9 },
  S: { f: [400, 1600, 2600], v: 0, n: 0.75, nf: 6500, nq: 1.6 },
  CL: { f: [400, 1600, 2600], v: 0 },                        // oclusão (silêncio)
  VB: { f: [300, 1600, 2600], v: 0.12 },                     // barra de vozeamento (oclusão sonora)
  T: { f: [400, 1700, 2600], v: 0, n: 0.45, nf: 4500, nq: 1 }, // soltura do T
  D: { f: [300, 1700, 2600], v: 0.2, n: 0.12, nf: 3200, nq: 1 },
  K: { f: [400, 1800, 2400], v: 0, n: 0.45, nf: 2200, nq: 1.2 },
  P: { f: [400, 900, 2300], v: 0, n: 0.4, nf: 1100, nq: 0.8 },
  B: { f: [300, 900, 2300], v: 0.2, n: 0.1, nf: 900, nq: 0.8 },
  SIL: { f: [500, 1500, 2500], v: 0 },                       // pausa entre palavras
};

// Frases que a voz robótica sabe dizer: [fonema, duração em s]
const ROBOT_PHRASES = {
  'Harvester deployed': [
    ['HH', 0.07], ['AA', 0.13], ['R', 0.06], ['V', 0.06], ['AH', 0.05], ['S', 0.12], ['CL', 0.04], ['T', 0.03],
    ['ER', 0.15], ['SIL', 0.08], ['VB', 0.04], ['D', 0.03], ['IH', 0.07], ['CL', 0.06], ['P', 0.03],
    ['L', 0.07], ['OY', 0.24], ['VB', 0.04], ['D', 0.03],
  ],
  'Base under attack': [
    ['VB', 0.03], ['B', 0.03], ['EY', 0.16], ['S', 0.13], ['SIL', 0.06],
    ['AH', 0.08], ['N', 0.06], ['VB', 0.03], ['D', 0.03], ['ER', 0.12], ['SIL', 0.05],
    ['AH', 0.06], ['CL', 0.05], ['T', 0.04], ['AE', 0.16], ['CL', 0.06], ['K', 0.06],
  ],
  'Harvester under attack': [
    ['HH', 0.07], ['AA', 0.12], ['R', 0.06], ['V', 0.06], ['AH', 0.05], ['S', 0.11], ['CL', 0.04], ['T', 0.03],
    ['ER', 0.13], ['SIL', 0.06],
    ['AH', 0.08], ['N', 0.06], ['VB', 0.03], ['D', 0.03], ['ER', 0.12], ['SIL', 0.05],
    ['AH', 0.06], ['CL', 0.05], ['T', 0.04], ['AE', 0.16], ['CL', 0.06], ['K', 0.06],
  ],
  'Low power': [
    ['L', 0.07], ['OW', 0.22], ['SIL', 0.06], ['CL', 0.04], ['P', 0.04], ['AA', 0.1], ['W', 0.07], ['ER', 0.2],
  ],
  'Victory': [
    ['V', 0.07], ['IH', 0.09], ['CL', 0.05], ['K', 0.05], ['T', 0.03], ['ER', 0.09], ['IY', 0.22],
  ],
  'Defeat': [
    ['VB', 0.03], ['D', 0.03], ['IH', 0.07], ['F', 0.11], ['IY', 0.2], ['CL', 0.06], ['T', 0.05],
  ],
};

// Agenda a frase e devolve a duração em segundos
function robotSpeak(phones, delay) {
  const ctx = audioCtx;
  const t0 = ctx.currentTime + delay;
  const k = 1.1; // fala um pouco mais devagar (mais clara no rádio)
  const total = phones.reduce((s, p) => s + p[1], 0) * k;
  // Rádio: faixa de 260 Hz a 5,5 kHz e uma saturação leve
  const out = voiceOut(0.6, 0, 0.12, annBus);
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 260;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5500;
  const sat = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i++) { const x = i / 127.5 - 1; curve[i] = Math.tanh(x * 1.6) / Math.tanh(1.6); }
  sat.curve = curve;
  hp.connect(lp); lp.connect(sat); sat.connect(out);

  // Fonte vozeada: dente de serra suavizado (menos zumbido) com vibrato leve
  const src = ctx.createOscillator();
  src.type = 'sawtooth';
  const soft = ctx.createBiquadFilter(); soft.type = 'lowpass'; soft.frequency.value = 3000; soft.Q.value = 0.5;
  const vib = ctx.createOscillator();
  const vibG = ctx.createGain();
  vib.frequency.value = 5.5;
  vibG.gain.value = 2;
  vib.connect(vibG);
  vibG.connect(src.frequency);
  const voiced = ctx.createGain();
  voiced.gain.value = 0;
  src.connect(soft);
  soft.connect(voiced);
  const formants = [[1, 90], [0.8, 110], [0.6, 170]].map(([gain, bw]) => {
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    const g = ctx.createGain();
    g.gain.value = gain * 3.4;
    voiced.connect(f);
    f.connect(g);
    g.connect(hp);
    return { f, bw };
  });
  // Ruído (fricativas e plosivas)
  const nsrc = ctx.createBufferSource();
  nsrc.buffer = noiseBuf;
  nsrc.loop = true;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  const ng = ctx.createGain();
  ng.gain.value = 0;
  nsrc.connect(nf); nf.connect(ng); ng.connect(hp);

  let t = t0;
  // Entonação: cada palavra começa um pouco mais alta e cai; a frase inteira desce
  let word = 0, wordStart = t0;
  const f0 = (tt, w) => 132 - w * 6 - tt * 45;
  src.frequency.setValueAtTime(130, t0);
  phones.forEach(([name, dur]) => {
    const p = PHONEMES[name];
    const d = dur * k;
    if (name === 'SIL') { word++; wordStart = t + d; }
    const ramp = Math.min(0.025, d * 0.4);
    formants.forEach((fm, j) => {
      fm.f.frequency.setTargetAtTime(p.f[j], t, ramp / 2);
      fm.f.Q.setValueAtTime(p.f[j] / fm.bw, t);
      if (p.to) fm.f.frequency.setTargetAtTime(p.to[j], t + d * 0.35, d * 0.25);
    });
    // Vogais entram e saem com pequenas quedas, para as sílabas se separarem
    const v = p.v * 0.5;
    voiced.gain.setTargetAtTime(v, t, 0.01);
    if (v > 0.3 && d > 0.08) voiced.gain.setTargetAtTime(v * 0.55, t + d - 0.03, 0.015);
    ng.gain.setTargetAtTime((p.n || 0) * 0.9, t, 0.005);
    if (p.n) ng.gain.setTargetAtTime(0, t + d * 0.8, 0.01);
    if (p.nf) { nf.frequency.setValueAtTime(p.nf, t); nf.Q.setValueAtTime(p.nq || 1, t); }
    const local = (t + d - wordStart) / 0.6;
    src.frequency.linearRampToValueAtTime(Math.max(85, f0(clamp(local, 0, 1), word)), t + d);
    t += d;
  });
  voiced.gain.setTargetAtTime(0, t, 0.02);
  ng.gain.setTargetAtTime(0, t, 0.01);
  [src, vib, nsrc].forEach(n => { n.start(t0); n.stop(t + 0.3); });
  return total;
}
