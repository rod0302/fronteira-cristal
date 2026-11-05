// Banco de efeitos sonoros premium.
// Cada som é "gravado" por código uma vez, no começo, com um OfflineAudioContext:
// várias camadas (estalo, corpo, grave, cauda, destroços) passam por filtros, saturação e
// envelopes, e o resultado vira um AudioBuffer. Cada som tem algumas variações, para nada
// soar repetido. No jogo, tocar um som é só disparar um buffer (barato mesmo em batalhas grandes).
// Nenhum arquivo de áudio é usado: tudo nasce dos osciladores e do ruído abaixo.

const SFX_BANK = {};          // nome -> [AudioBuffer, ...]
let sfxBankReady = false;
let sfxBankProgress = 0;      // 0..1 (lido pelos testes)

// Ruídos básicos (branco, rosa e marrom), estéreo e descorrelacionados, feitos uma vez por taxa
const NOISE_CACHE = {};
function bankNoise(sr, kind) {
  const key = kind + sr;
  if (NOISE_CACHE[key]) return NOISE_CACHE[key];
  // 'pinkL'/'whiteL': versões de 25 s (vento), para o padrão do ruído não se repetir
  const long = kind.endsWith('L');
  if (long) kind = kind.slice(0, -1);
  const len = sr * (long ? 13 : 3);
  const buf = new AudioBuffer({ length: len, sampleRate: sr, numberOfChannels: 2 });
  const rng = makeRng(kind === 'white' ? 11 : kind === 'pink' ? 23 : 37);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = rng() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else if (kind === 'pink') {
        b0 = 0.99765 * b0 + w * 0.099; b1 = 0.963 * b1 + w * 0.2965; b2 = 0.57 * b2 + w * 1.0527;
        d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
  }
  NOISE_CACHE[key] = buf;
  return buf;
}

// Ferramentas de síntese presas a um contexto (o offline de cada som)
function synthKit(ctx, rng) {
  const sr = ctx.sampleRate;
  const out = ctx.createGain();
  out.connect(ctx.destination);
  const k = { ctx, out, rng, sr };
  k.r = (a, b) => a + (b - a) * rng();

  // Envelope: sobe em "attack" e cai de forma exponencial até sumir em "dur"
  k.env = (param, t, vol, attack, dur, hold = 0) => {
    param.setValueAtTime(0, t);
    param.linearRampToValueAtTime(vol, t + attack);
    if (hold) param.setValueAtTime(vol, t + attack + hold);
    param.setTargetAtTime(0, t + attack + hold, Math.max(0.002, (dur - attack - hold) / 5));
  };
  k.gain = (vol = 1, to = out) => { const g = ctx.createGain(); g.gain.value = vol; g.connect(to); return g; };
  k.pan = (p, to = out) => { const n = ctx.createStereoPanner(); n.pan.value = clamp(p, -1, 1); n.connect(to); return n; };
  k.filter = (type, f, q = 0.7, to = out, gainDb = 0) => {
    const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; n.gain.value = gainDb; n.connect(to); return n;
  };
  // Saturação suave (tanh): engorda e "cola" as camadas
  k.drive = (amount, to = out) => {
    const n = ctx.createWaveShaper();
    const c = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; c[i] = Math.tanh(x * amount) / Math.tanh(amount); }
    n.curve = c; n.oversample = '2x'; n.connect(to); return n;
  };
  // Oscilador com glissando e envelope
  k.osc = (type, f0, f1, t, dur, vol, o = {}) => {
    const s = ctx.createOscillator(); s.type = type;
    s.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) {
      if (o.lin) s.frequency.linearRampToValueAtTime(f1, t + (o.glide || dur));
      else s.frequency.exponentialRampToValueAtTime(f1, t + (o.glide || dur));
    }
    if (o.detune) s.detune.value = o.detune;
    const g = ctx.createGain();
    k.env(g.gain, t, vol, o.attack || 0.002, dur, o.hold || 0);
    s.connect(g); g.connect(o.to || out);
    s.start(t); s.stop(t + dur + 0.05);
    return s;
  };
  // Ruído filtrado com o filtro deslizando de f0 para f1
  k.nz = (kind, t, dur, vol, o = {}) => {
    const s = ctx.createBufferSource(); s.buffer = bankNoise(sr, kind); s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'lowpass'; f.Q.value = o.q || 0.7;
    f.frequency.setValueAtTime(o.f0 || 2000, t);
    if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || dur));
    const g = ctx.createGain();
    k.env(g.gain, t, vol, o.attack || 0.002, dur, o.hold || 0);
    s.connect(f); f.connect(g); g.connect(o.to || out);
    s.start(t, kind.endsWith('L') ? rng() * 11 : rng() * 2); s.stop(t + dur + 0.05);
    return { src: s, f, g };
  };
  // Sino FM: metal, vidro, cristal (razão inarmônica = metal)
  k.bell = (f, t, dur, vol, ratio = 3.5, index = 2, o = {}) => {
    const car = ctx.createOscillator(), mod = ctx.createOscillator();
    const mg = ctx.createGain(), g = ctx.createGain();
    const ny = sr / 2 - 200;
    car.frequency.value = Math.min(f, ny); mod.frequency.value = Math.min(f * ratio, ny);
    mg.gain.setValueAtTime(f * index, t);
    mg.gain.exponentialRampToValueAtTime(Math.max(1, f * index * 0.05), t + dur);
    mod.connect(mg); mg.connect(car.frequency);
    k.env(g.gain, t, vol, o.attack || 0.002, dur);
    car.connect(g); g.connect(o.to || out);
    car.start(t); mod.start(t); car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
  };
  // Estalo de explosão: fora da saturação, para o ataque (0 a 5 ms) ficar acima do corpo
  k.crack = (t, vol, to = out) => {
    k.nz('white', t, 0.005, 2.2 * vol, { type: 'highpass', f0: 1100, to });
    k.nz('white', t, 0.014, 1.2 * vol, { type: 'bandpass', f0: k.r(2000, 3200), q: 0.8, to });
  };
  // Corpo da explosão nos médios (150 a 600 Hz): é o que se ouve num notebook
  k.body = (t, dur, vol, to = out) => {
    k.nz('pink', t, dur, vol, { type: 'bandpass', f0: k.r(260, 420), f1: 170, q: 0.55, attack: 0.003, to });
    k.nz('white', t, dur * 0.6, vol * 0.5, { type: 'bandpass', f0: k.r(500, 650), f1: 220, q: 0.7, attack: 0.002, to });
  };
  // Estalos espalhados (destroços, fogo, cascalho)
  k.crackle = (t, dur, vol, count, o = {}) => {
    for (let i = 0; i < count; i++) {
      const d = t + Math.pow(rng(), o.front ? 2 : 1) * dur;
      const fall = 1 - (d - t) / dur * (o.fade ?? 0.7);
      k.nz('white', d, k.r(0.006, 0.03), vol * k.r(0.3, 1) * fall,
        { type: 'bandpass', f0: k.r(o.lo || 900, o.hi || 5000), q: k.r(1.5, 5), to: o.to ? o.to : k.pan(k.r(-0.6, 0.6), o.bus || out) });
    }
  };
  // Tinidos metálicos (cápsulas, peças batendo)
  k.tinks = (t, dur, vol, count, o = {}) => {
    for (let i = 0; i < count; i++) {
      const d = t + rng() * dur;
      k.bell(k.r(o.lo || 1800, o.hi || 5200), d, k.r(0.05, 0.18), vol * k.r(0.3, 1), k.r(1.3, 2.9), k.r(0.6, 2),
        { to: k.pan(k.r(-0.7, 0.7)) });
    }
  };
  return k;
}

// ---------- Receitas ----------
// Cada receita recebe o kit (k) e desenha o som a partir de t = 0.
// len = duração do buffer em segundos; n = variações; mono = só um canal (o lado vem no jogo).

const SFX_RECIPES = {
  // Rajada de fuzil (soldado): três disparos secos, estalo supersônico e eco curto
  rifle: { len: 0.7, n: 5, recipe(k) {
    const d = k.drive(2.2, k.filter('lowpass', 10000));
    const gap = k.r(0.07, 0.1), p0 = k.r(0.88, 1.12);
    for (let i = 0; i < 3; i++) {
      const t = i * gap + k.r(0, 0.012), v = 1 - i * k.r(0.04, 0.12), p = p0 * k.r(0.96, 1.04);
      k.nz('white', t, 0.005, 1.0 * v, { type: 'highpass', f0: 3000, to: d });
      k.nz('white', t, 0.045, 0.75 * v, { type: 'bandpass', f0: 1700 * p, f1: 800, q: 1.3, to: d });
      k.osc('sine', 190 * p, 70, t, 0.05, 0.45 * v, { to: d });
      k.nz('pink', t + 0.004, 0.2, 0.25 * v, { type: 'lowpass', f0: 2400, f1: 600, to: k.pan(k.r(-0.3, 0.3)) });
    }
    k.tinks(0.12, 0.45, 0.03, 2, { lo: 3500, hi: 6500 });
  } },
  // Metralhadora do batedor: cinco disparos rápidos, mais agudos, com mecânica metálica
  mg: { len: 0.8, n: 5, recipe(k) {
    const d = k.drive(2.8, k.filter('lowpass', 11000));
    const gap = k.r(0.048, 0.066), shots = 4 + ((k.rng() * 3) | 0), p0 = k.r(0.88, 1.12);
    for (let i = 0; i < shots; i++) {
      const t = i * gap + k.r(0, 0.006), p = p0 * k.r(0.95, 1.05);
      k.nz('white', t, 0.004, 0.9, { type: 'highpass', f0: 4500, to: d });
      k.nz('white', t, 0.03, 0.6, { type: 'bandpass', f0: 2600 * p, f1: 1300, q: 1.6, to: d });
      k.osc('square', 260 * p, 110, t, 0.025, 0.16, { to: d });
      k.bell(3600 * p, t + 0.008, 0.025, 0.06, 1.41, 0.8, { to: d });
    }
    k.nz('pink', 0, 0.4, 0.14, { type: 'lowpass', f0: 3000, f1: 700, attack: 0.02 });
  } },
  // Lança-foguetes: estouro de saída, ignição crepitando e o chiado do motor indo embora
  rocket: { len: 1.4, n: 4, recipe(k) {
    const d = k.drive(1.8);
    const p0 = k.r(0.85, 1.15);
    k.nz('white', 0, 0.035, 1.0, { type: 'bandpass', f0: 1500 * p0, q: 0.8, to: d });
    k.osc('sine', 150 * p0, 55, 0, 0.1, 0.6, { to: d });
    const p = k.pan(0, d);
    p.pan.setValueAtTime(k.r(-0.2, 0.2), 0); p.pan.linearRampToValueAtTime(k.r(-0.6, 0.6), 1.0);
    const m = k.nz('white', 0.012, 1.0, 0.8, { type: 'bandpass', f0: 700 * p0, f1: 3200 * p0, glide: k.r(0.35, 0.6), q: 1.1, attack: 0.03, to: p });
    const am = k.ctx.createGain(); am.gain.value = 0; m.g.disconnect(); m.g.connect(am); am.connect(p);
    for (let t = 0.02; t < 1.0; t += k.r(0.008, 0.025)) am.gain.setValueAtTime(k.r(0.3, 1), t);
    k.nz('pink', 0.02, 1.1, 0.3, { type: 'lowpass', f0: 1800, f1: 300, attack: 0.05, to: p });
    k.crackle(0.03, 0.6, 0.12, 10, { lo: 1500, hi: 6000 });
  } },
  // Canhão do blindado: seco e curto. Estalo forte, sopro médio, grave controlado, culatra
  cannon: { len: 1.5, n: 5, stereo: true, recipe(k) {
    const p = k.r(0.85, 1.15);
    const d = k.drive(2.4, k.filter('lowpass', 12000));
    k.nz('white', 0, 0.004, 1.6, { type: 'highpass', f0: 2000, to: d });               // estalo (0 a 4 ms)
    k.nz('white', 0, 0.012, 1.0, { type: 'bandpass', f0: 2600 * p, q: 0.9, to: d });
    k.nz('white', 0.002, 0.2, 0.9, { type: 'lowpass', f0: 3800 * p, f1: 300, glide: 0.18, to: d }); // sopro
    k.nz('pink', 0.002, 0.18, 0.6, { type: 'bandpass', f0: 420 * p, q: 0.9, to: d });  // corpo nos médios
    k.osc('sine', 110 * p, 45, 0, 0.3, 0.55, { to: d });
    k.bell(1250 * p, 0.08, 0.1, 0.06, 1.5, 1.6);                                          // culatra
    k.nz('brown', 0.02, 1.2, 0.35, { type: 'lowpass', f0: 1100, f1: 160, attack: 0.02, to: k.pan(k.r(-0.6, -0.2)) });
    k.nz('brown', 0.05, 1.3, 0.3, { type: 'lowpass', f0: 1000, f1: 150, attack: 0.03, to: k.pan(k.r(0.2, 0.6)) });
  } },
  // Torre: canhão de calibre maior num cano longo de metal: servo, estalo agudo e anel do cano
  turret: { len: 1.9, n: 4, stereo: true, recipe(k) {
    const p = k.r(0.88, 1.1);
    const servo = k.filter('bandpass', 1800, 4);
    k.osc('sawtooth', 300, 560, 0, 0.05, 0.09, { attack: 0.01, to: servo });         // servo travando (curto)
    k.osc('sawtooth', 560, 320, 0.5, 0.14, 0.07, { attack: 0.03, to: servo });        // e rearmando
    const t0 = 0.03;
    const d = k.drive(2.8, k.filter('lowpass', 13000));
    k.nz('white', t0, 0.003, 1.7, { type: 'highpass', f0: 3000, to: d });
    k.nz('white', t0, 0.02, 1.0, { type: 'bandpass', f0: 3400 * p, q: 1.2, to: d });
    k.nz('white', t0 + 0.002, 0.25, 0.8, { type: 'bandpass', f0: 2200 * p, f1: 500, q: 0.7, to: d });
    k.osc('sine', 130 * p, 55, t0, 0.25, 0.45, { to: d });
    k.bell(640 * p, t0, 0.7, 0.12, 2.76, 1.8);                                             // anel do cano
    k.bell(1520 * p, t0 + 0.01, 0.45, 0.07, 2.41, 1.4);
    k.nz('brown', t0 + 0.02, 1.4, 0.3, { type: 'lowpass', f0: 1300, f1: 200, attack: 0.02, to: k.pan(-0.4) });
    k.nz('brown', t0 + 0.05, 1.5, 0.28, { type: 'lowpass', f0: 1200, f1: 200, attack: 0.03, to: k.pan(0.4) });
  } },
  // Obuseiro: sopro longo de pressão (o "vuum" da carga grande) e a granada saindo assobiando
  arty: { len: 3.0, n: 4, stereo: true, recipe(k) {
    const p = k.r(0.88, 1.1);
    const d = k.drive(2.2, k.filter('lowpass', 9000));
    k.nz('white', 0, 0.006, 1.2, { type: 'highpass', f0: 1500, to: d });
    k.nz('white', 0, 0.6, 1.0, { type: 'lowpass', f0: 2200 * p, f1: 140, glide: 0.5, attack: 0.012, to: d }); // pressão
    k.nz('pink', 0, 0.5, 0.7, { type: 'bandpass', f0: 260 * p, q: 0.8, attack: 0.015, to: d });
    k.osc('sine', 75 * p, 30, 0, 0.8, 0.6, { to: d });
    // A granada se afastando: chiado que sobe e some
    k.nz('white', 0.05, 0.9, 0.18, { type: 'bandpass', f0: 1200, f1: 4200, q: 3, attack: 0.1, to: k.pan(k.r(-0.5, 0.5)) });
    k.nz('brown', 0.03, 2.7, 0.45, { type: 'lowpass', f0: 700, f1: 90, attack: 0.05, to: k.pan(-0.5) });
    k.nz('brown', 0.08, 2.8, 0.4, { type: 'lowpass', f0: 650, f1: 90, attack: 0.06, to: k.pan(0.5) });
    k.nz('pink', 0.42, 0.9, 0.16, { type: 'lowpass', f0: 1200, f1: 200, attack: 0.04, to: k.pan(k.r(-0.8, 0.8)) }); // eco
  } },
  // Projétil de artilharia chegando: assobio que desce de tom (toca antes do impacto)
  incoming: { len: 1.3, n: 3, recipe(k) {
    const f0 = k.r(2200, 3000);
    const s = k.osc('sine', f0, f0 * k.r(0.33, 0.45), 0, 1.2, 0.22, { attack: 0.5, hold: 0.55 });
    const vib = k.ctx.createOscillator(), vg = k.ctx.createGain();
    vib.frequency.value = k.r(9, 13); vg.gain.value = 18; vib.connect(vg); vg.connect(s.frequency);
    vib.start(0); vib.stop(1.3);
    k.nz('white', 0, 1.2, 0.08, { type: 'bandpass', f0: f0, f1: f0 * 0.4, q: 5, attack: 0.6, hold: 0.45 });
  } },
  // Bala acertando: terra espirrando e, às vezes, um ricochete
  hit_bullet: { len: 0.5, n: 6, recipe(k) {
    k.nz('white', 0, 0.05, 0.5, { type: 'bandpass', f0: k.r(1800, 3200), f1: 900, q: 1.2 });
    k.crackle(0.005, 0.12, 0.2, 5, { lo: 2000, hi: 7000, front: true });
    if (k.rng() < 0.5) {
      const f = k.r(2600, 4200);
      k.osc('sine', f, f * 0.55, 0.01, k.r(0.25, 0.4), 0.08, { attack: 0.004, to: k.pan(k.r(-0.5, 0.5)) });
    }
  } },
  // Bala acertando metal (veículo ou prédio): estalo seco e um tinido curto, sem terra
  hit_metal: { len: 0.4, n: 6, recipe(k) {
    k.nz('white', 0, 0.006, 0.8, { type: 'highpass', f0: 2500 });
    k.bell(k.r(1800, 3400), 0, k.r(0.08, 0.2), 0.16, k.r(1.3, 2.7), k.r(0.8, 1.6));
    k.bell(k.r(3500, 5500), 0.003, 0.06, 0.06, 1.41, 0.6);
    if (k.rng() < 0.4) k.osc('sine', k.r(3000, 4500), 1800, 0.01, 0.2, 0.05, { attack: 0.004 });
  } },
  // Granada de canhão explodindo: estalo, terra e pedra (médios fortes, grave curto)
  hit_shell: { len: 1.4, n: 5, stereo: true, recipe(k) {
    const p = k.r(0.85, 1.15);
    const d = k.drive(2.4, k.filter('lowpass', 10000));
    k.nz('white', 0, 0.004, 1.5, { type: 'highpass', f0: 1800, to: d });
    k.nz('white', 0, 0.35, 0.9, { type: 'lowpass', f0: 3000 * p, f1: 250, glide: 0.3, to: d });
    k.nz('pink', 0, 0.3, 0.7, { type: 'bandpass', f0: 350 * p, q: 0.8, to: d });
    k.osc('sine', 85 * p, 40, 0, 0.3, 0.30, { to: d });
    k.crack(0, 1); k.body(0, 0.5, 0.9);
    k.crackle(0.03, 0.9, 0.3, 16, { lo: 600, hi: 3000, front: true });  // terra e pedras
    k.nz('brown', 0.02, 1.1, 0.3, { type: 'lowpass', f0: 700, f1: 120, attack: 0.04, to: k.pan(k.r(-0.5, 0.5)) });
  } },
  // Foguete explodindo: estouro agudo e chiado de metal quente, quase sem terra
  hit_rocket: { len: 1.2, n: 5, stereo: true, recipe(k) {
    const p = k.r(0.85, 1.15);
    const d = k.drive(3.0, k.filter('lowpass', 13000));
    k.nz('white', 0, 0.004, 1.6, { type: 'highpass', f0: 3000, to: d });
    k.nz('white', 0, 0.22, 1.0, { type: 'bandpass', f0: 3200 * p, f1: 900, q: 0.8, to: d });
    k.nz('white', 0.01, 0.6, 0.25, { type: 'highpass', f0: 5000, f1: 2500, attack: 0.02, to: d }); // chiado
    k.osc('sine', 130 * p, 50, 0, 0.18, 0.4, { to: d });
    k.crackle(0.02, 0.5, 0.25, 14, { lo: 2500, hi: 8000, front: true });
    k.tinks(0.05, 0.5, 0.05, 3, { lo: 2500, hi: 5000 });
  } },
  // Impacto de artilharia: o maior dos impactos, pancada no peito e terra caindo depois
  hit_arty: { len: 3.0, n: 4, stereo: true, recipe(k) {
    const p = k.r(0.88, 1.12);
    const d = k.drive(2.6, k.filter('lowpass', 9500));
    k.nz('white', 0, 0.005, 1.6, { type: 'highpass', f0: 1500, to: d });
    k.nz('white', 0, 0.7, 1.0, { type: 'lowpass', f0: 3400 * p, f1: 160, glide: 0.5, attack: 0.002, to: d });
    k.nz('pink', 0, 0.5, 0.8, { type: 'bandpass', f0: 300 * p, q: 0.7, to: d });
    k.osc('sine', 62 * p, 26, 0, 0.8, 0.36, { to: d });
    k.crack(0, 1); k.body(0, 0.8, 0.9);
    k.crackle(0.2, 1.9, 0.22, 34, { lo: 500, hi: 3000, fade: 0.9 });  // terra e pedras caindo
    k.nz('brown', 0.03, 2.7, 0.45, { type: 'lowpass', f0: 600, f1: 80, attack: 0.05, to: k.pan(-0.5) });
    k.nz('brown', 0.07, 2.8, 0.4, { type: 'lowpass', f0: 550, f1: 80, attack: 0.06, to: k.pan(0.5) });
  } },
  // Veículo leve explodindo (batedor): estouro curto e muita peça de metal voando
  boom_small: { len: 2.0, n: 4, stereo: true, recipe(k) {
    const p = k.r(0.9, 1.15);
    const d = k.drive(2.8, k.filter('lowpass', 12000));
    k.nz('white', 0, 0.004, 1.6, { type: 'highpass', f0: 2200, to: d });
    k.nz('white', 0, 0.6, 1.0, { type: 'lowpass', f0: 5000 * p, f1: 250, glide: 0.5, to: d });
    k.nz('pink', 0, 0.4, 0.6, { type: 'bandpass', f0: 500 * p, q: 0.8, to: d });
    k.osc('sine', 90 * p, 35, 0, 0.5, 0.30, { to: d });
    k.crack(0, 1); k.body(0, 0.5, 0.9);
    k.tinks(0.1, 1.2, 0.08, 9, { lo: 1200, hi: 4200 });
    k.crackle(0.04, 1.2, 0.22, 16, { lo: 900, hi: 5000, front: true });
    k.nz('brown', 0.03, 1.8, 0.35, { type: 'lowpass', f0: 800, f1: 110, attack: 0.05, to: k.pan(k.r(-0.5, 0.5)) });
  } },
  // Veículo pesado explodindo (blindado, obuseiro): estalo, bola de fogo, munição detonando, destroços
  boom: { len: 3.2, n: 5, stereo: true, recipe(k) {
    const d = k.drive(2.8, k.filter('lowpass', 11000));
    const p = k.r(0.85, 1.12);
    k.nz('white', 0, 0.005, 1.7, { type: 'highpass', f0: 1800, to: d });                  // estalo
    k.nz('white', 0, 0.015, 1.0, { type: 'bandpass', f0: 2200 * p, q: 0.8, to: d });
    // Bola de fogo: ruído que começa claro e escurece, com corpo nos médios
    k.nz('white', 0, 1.0, 1.0, { type: 'lowpass', f0: 4500 * p, f1: 200, glide: 0.8, attack: 0.002, to: d });
    k.nz('pink', 0.01, 0.8, 0.8, { type: 'bandpass', f0: 380 * p, f1: 180, q: 0.7, attack: 0.01, to: d });
    k.nz('pink', 0.05, 1.6, 0.3, { type: 'bandpass', f0: 800, f1: 250, q: 0.6, attack: 0.08, to: k.pan(k.r(-0.4, 0.4)) });
    k.osc('sine', 70 * p, 26, 0, 0.9, 0.33, { to: d });
    k.crack(0, 1); k.body(0, 0.8, 0.9);
    // Explosões secundárias (munição)
    const n2 = 1 + ((k.rng() * 2) | 0);
    for (let i = 0; i < n2; i++) {
      const t2 = k.r(0.18, 0.9), pan = k.r(-0.6, 0.6);
      k.nz('white', t2, 0.004, 0.8, { type: 'highpass', f0: 2000, to: k.pan(pan, d) });
      k.nz('white', t2, 0.35, 0.55, { type: 'lowpass', f0: 3200, f1: 250, to: k.pan(pan, d) });
    }
    k.crackle(0.05, 1.6, 0.25, 24, { lo: 600, hi: 5000, front: true });
    k.tinks(0.3, 1.4, 0.06, 6, { lo: 900, hi: 3200 });
    k.nz('brown', 0.03, 3.0, 0.4, { type: 'lowpass', f0: 800, f1: 90, attack: 0.05, to: k.pan(-0.5) });
    k.nz('brown', 0.07, 3.0, 0.38, { type: 'lowpass', f0: 750, f1: 90, attack: 0.06, to: k.pan(0.5) });
  } },
  // Coletor explodindo: explosão pesada e a carga de cristal se estilhaçando
  boom_harv: { len: 3.4, n: 3, stereo: true, recipe(k) {
    const d = k.drive(2.8, k.filter('lowpass', 11000));
    const p = k.r(0.85, 1.05);
    k.nz('white', 0, 0.005, 1.7, { type: 'highpass', f0: 1800, to: d });
    k.nz('white', 0, 1.1, 1.0, { type: 'lowpass', f0: 4000 * p, f1: 180, glide: 0.9, attack: 0.002, to: d });
    k.nz('pink', 0.01, 0.9, 0.8, { type: 'bandpass', f0: 320 * p, f1: 160, q: 0.7, to: d });
    k.osc('sine', 60 * p, 24, 0, 1.0, 0.36, { to: d });
    k.crack(0, 1); k.body(0, 0.8, 0.9);
    // Cristal estilhaçando: muitos sinos vítreos agudos caindo
    for (let i = 0; i < 26; i++) {
      const t = 0.05 + Math.pow(k.rng(), 1.6) * 1.8;
      k.bell(k.r(2400, 6500), t, k.r(0.15, 0.6), k.r(0.03, 0.09), k.r(1.9, 3.3), k.r(0.5, 1.2), { to: k.pan(k.r(-0.8, 0.8)) });
    }
    k.crackle(0.05, 1.8, 0.22, 24, { lo: 600, hi: 5000, front: true });
    k.nz('brown', 0.03, 3.2, 0.42, { type: 'lowpass', f0: 750, f1: 90, attack: 0.05, to: k.pan(-0.5) });
    k.nz('brown', 0.07, 3.2, 0.4, { type: 'lowpass', f0: 700, f1: 90, attack: 0.06, to: k.pan(0.5) });
  } },
  // Prédio desabando: três ou quatro explosões encadeadas, ronco de estrutura e escombros
  bigboom: { len: 5.0, n: 4, stereo: true, recipe(k) {
    const d = k.drive(3.0, k.filter('lowpass', 10000));
    const booms = 3 + (k.rng() < 0.5 ? 1 : 0);
    let t = 0;
    for (let i = 0; i < booms; i++) {
      const v = i === 0 ? 1 : k.r(0.4, 0.65), pan = i === 0 ? 0 : k.r(-0.6, 0.6);
      const to = k.pan(pan, d);
      k.nz('white', t, 0.005, 1.6 * v, { type: 'highpass', f0: 1500, to });
      k.nz('white', t, 1.1, v, { type: 'lowpass', f0: 4200, f1: 160, glide: 0.9, to });
      k.nz('pink', t, 0.8, 0.7 * v, { type: 'bandpass', f0: k.r(250, 450), q: 0.7, to });
      k.osc('sine', k.r(50, 64), 22, t, 1.1, 0.38 * v, { to });
      k.crack(t, v, k.pan(pan)); k.body(t, 1.0, 0.9 * v, k.pan(pan));
      t += k.r(0.25, 0.6);
    }
    // Estrutura cedendo: gemido de metal grave e escombros por alguns segundos
    const groan = k.filter('bandpass', 260, 3, k.pan(k.r(-0.3, 0.3)));
    k.osc('sawtooth', k.r(85, 105), 48, 0.5, 1.8, 0.14, { attack: 0.4, to: groan });
    k.crackle(0.3, 3.8, 0.24, 60, { lo: 400, hi: 3500, fade: 0.85 });
    k.tinks(0.5, 2.5, 0.05, 8, { lo: 700, hi: 2600 });
    k.nz('brown', 0.04, 4.6, 0.55, { type: 'lowpass', f0: 600, f1: 70, attack: 0.08, to: k.pan(-0.55) });
    k.nz('brown', 0.1, 4.8, 0.5, { type: 'lowpass', f0: 550, f1: 70, attack: 0.1, to: k.pan(0.55) });
  } },
  // Soldado abatido: baque do corpo no chão e o equipamento chacoalhando (sem gritos)
  death_inf: { len: 0.6, n: 6, recipe(k) {
    const p = k.r(0.8, 1.25), t0 = k.r(0, 0.04);
    k.osc('sine', 110 * p, 50 * p, t0 + 0.02, k.r(0.09, 0.16), 0.5);
    k.nz('pink', t0 + 0.02, k.r(0.1, 0.18), 0.4, { type: 'lowpass', f0: 1200 * p, f1: 300 });
    if (k.rng() < 0.6) k.nz('pink', t0 + k.r(0.12, 0.2), 0.08, 0.22, { type: 'bandpass', f0: k.r(500, 900), q: 1 }); // segundo baque
    k.crackle(0.05, 0.25, 0.12, 5, { lo: 1500, hi: 4000 });
    k.tinks(0.06, 0.2, 0.03, 2, { lo: 2500, hi: 4500 });
  } },
  // Prédio assentado: servo descendo, pancada pesada no chão, travas e chiado hidráulico
  place: { len: 1.8, n: 3, stereo: true, recipe(k) {
    const servo = k.filter('lowpass', 1400, 2);
    const pr = k.r(0.85, 1.15);
    k.osc('sawtooth', 160 * pr, 420 * pr, 0, 0.32, 0.07, { attack: 0.05, to: servo });
    const d = k.drive(2.0);
    k.osc('sine', 72 * pr, 34, 0.32, 0.6, 0.55, { to: d });
    k.nz('pink', 0.32, 0.5, 0.6, { type: 'bandpass', f0: k.r(300, 500), f1: 200, q: 0.7, to: d });
    k.bell(190 * k.r(0.9, 1.1), 0.33, 0.9, 0.12, k.r(2.5, 2.9), 2.4);
    k.bell(310 * k.r(0.9, 1.1), 0.36, 0.6, 0.08, k.r(2.2, 2.6), 2.0);
    k.nz('white', 0.55, 0.06, 0.25, { type: 'bandpass', f0: 2500, q: 2 });     // trava 1
    k.nz('white', 0.68, 0.06, 0.22, { type: 'bandpass', f0: 2900, q: 2 });     // trava 2
    k.nz('white', 0.8, 0.7, 0.2, { type: 'highpass', f0: 4500, f1: 2200, attack: 0.02 }); // hidráulica soltando
    k.crackle(0.34, 0.5, 0.12, 10, { lo: 500, hi: 2500 });                     // cascalho
  } },
  // Venda: energia desligando, peças desmontando e a estrutura sendo recolhida
  sell: { len: 1.6, n: 2, stereo: true, recipe(k) {
    const f = k.filter('lowpass', 2200, 1.5);
    k.osc('sawtooth', 520, 70, 0, 0.9, 0.12, { attack: 0.01, to: f });
    k.osc('sine', 1040, 140, 0, 0.7, 0.06);
    k.nz('white', 0.1, 0.8, 0.18, { type: 'highpass', f0: 3000, f1: 1200, attack: 0.03 });
    k.tinks(0.3, 0.9, 0.05, 5, { lo: 800, hi: 2600 });
    k.osc('sine', 80, 40, 0.9, 0.5, 0.5);
    k.bell(1568, 0.05, 0.4, 0.05, 1.5, 0.8); k.bell(1318, 0.15, 0.4, 0.05, 1.5, 0.8);
  } },
  // Construção concluída: acorde de cristal com brilho que sobe (sinal da interface)
  ready: { len: 1.8, n: 1, stereo: true, recipe(k) {
    [[659, 0, -0.3], [988, 0.09, 0.3], [1319, 0.18, 0]].forEach(([f, t, p]) => {
      const to = k.pan(p);
      k.bell(f, t, 1.4, 0.16, 2.0, 1.1, { to });
      k.osc('sine', f * 2, f * 2, t, 0.9, 0.03, { to, attack: 0.02 });
    });
    k.nz('white', 0.2, 1.0, 0.03, { type: 'bandpass', f0: 6000, f1: 9000, q: 3, attack: 0.3 });
  } },
  // Unidade saindo da fábrica: porta hidráulica abrindo e motor acelerando
  unit: { len: 1.6, n: 2, recipe(k) {
    k.nz('white', 0, 0.35, 0.22, { type: 'highpass', f0: 3800, f1: 1800, attack: 0.02 });
    const p = k.r(0.85, 1.15);
    k.osc('sine', 90 * p, 60, 0.02, 0.25, 0.4);
    const eng = k.filter('lowpass', 900 * p, 1.5);
    k.osc('sawtooth', 45 * p, 95 * p, 0.25, k.r(0.9, 1.2), 0.3, { attack: 0.2, to: eng });
    k.osc('square', 30 * p, 62 * p, 0.25, 1.1, 0.12, { attack: 0.25, to: eng });
    k.bell(1600, 0.02, 0.08, 0.06, 1.5, 0.8); k.bell(2100, 0.1, 0.08, 0.05, 1.5, 0.8);
  } },
  // Coletor se implantando no campo: travas, pistões, braço de coleta descendo e rotor partindo
  deploy: { len: 2.2, n: 1, stereo: true, recipe(k) {
    k.nz('white', 0, 0.05, 0.6, { type: 'bandpass', f0: 1900, q: 1.5 });
    k.osc('square', 130, 55, 0, 0.12, 0.15);
    k.nz('white', 0.06, 0.55, 0.45, { type: 'highpass', f0: 5000, f1: 1500, attack: 0.03, to: k.pan(-0.3) });
    k.nz('white', 0.35, 0.5, 0.35, { type: 'highpass', f0: 4600, f1: 1400, attack: 0.03, to: k.pan(0.3) });
    const d = k.drive(1.8);
    k.osc('sine', 75, 38, 0.6, 0.4, 0.7, { to: d });                // braço tocando o chão
    k.bell(240, 0.6, 0.6, 0.07, 2.76, 2.2);
    const rot = k.filter('lowpass', 1200, 2);
    k.osc('sawtooth', 40, 140, 0.8, 1.3, 0.22, { attack: 0.3, glide: 0.9, to: rot }); // rotor girando
    k.crackle(0.95, 1.1, 0.1, 14, { lo: 2500, hi: 7000 });           // cristal sendo moído
  } },
  // Clique de interface: vidro curto, nítido, sem cansar
  click: { len: 0.12, n: 3, recipe(k) {
    k.nz('white', 0, 0.006, 0.5, { type: 'bandpass', f0: k.r(4500, 5500), q: 2 });
    k.osc('sine', k.r(2300, 2500), 1700, 0, 0.035, 0.18);
    k.osc('sine', 420, 300, 0, 0.03, 0.12);
  } },
  // Seleção: dois toques suaves subindo
  select: { len: 0.3, n: 2, recipe(k) {
    const p = k.r(0.97, 1.03);
    k.osc('sine', 880 * p, 880 * p, 0, 0.09, 0.14);
    k.osc('sine', 1320 * p, 1320 * p, k.r(0.045, 0.06), 0.12, 0.11);
    k.osc('sine', 160, 120, 0, 0.05, 0.12);
  } },
  // Erro: zumbido abafado duplo
  error: { len: 0.45, n: 1, recipe(k) {
    const f = k.filter('lowpass', 1300, 1);
    k.osc('triangle', 392, 370, 0, 0.11, 0.16, { to: f });
    k.osc('triangle', 294, 280, 0.13, 0.16, 0.16, { to: f });
  } },
  // Créditos entrando: tique de cristal curto e discreto
  credits: { len: 0.3, n: 5, recipe(k) {
    const f = k.r(2100, 3300);
    k.bell(f, 0, 0.14, 0.12, k.r(2.8, 3.2), 0.5);
    k.bell(f * 1.5, 0.05, 0.1, 0.05, 3.01, 0.4);
    k.nz('white', 0, 0.01, 0.12, { type: 'bandpass', f0: 3000, q: 2 });
  } },
  // Alarme da base: sirene de dois tons, curta (0,9 s), para a voz entrar logo depois
  alert: { len: 1.4, n: 1, stereo: true, recipe(k) {
    const hp = k.filter('highpass', 380, 0.7, k.filter('lowpass', 4200));
    for (let i = 0; i < 2; i++) {
      const t = i * 0.44;
      k.osc('square', 880, 880, t, 0.2, 0.13, { attack: 0.012, hold: 0.12, to: hp });
      k.osc('square', 660, 660, t + 0.22, 0.2, 0.13, { attack: 0.012, hold: 0.12, to: hp });
      k.osc('triangle', 1760, 1760, t, 0.2, 0.05, { attack: 0.012, hold: 0.12, to: hp });
    }
  } },
  // Inimigo detectado: pulso de radar (sonar) com eco
  detect: { len: 2.0, n: 1, stereo: true, recipe(k) {
    k.bell(1480, 0, 1.2, 0.16, 1.0, 0.6);
    k.osc('sine', 1480, 1400, 0, 1.0, 0.08, { attack: 0.005 });
    k.bell(1480, 0.32, 0.9, 0.05, 1.0, 0.5, { to: k.pan(-0.5) });
    k.bell(1480, 0.62, 0.8, 0.025, 1.0, 0.4, { to: k.pan(0.5) });
  } },
  // Reparo: catraca e solda
  repair: { len: 1.0, n: 2, recipe(k) {
    for (let i = 0; i < 4; i++) k.nz('white', i * 0.07, 0.03, 0.25, { type: 'bandpass', f0: 1900 + i * 150, q: 3 });
    k.bell(1100, 0.3, 0.2, 0.08, 1.41, 1.2);
    k.nz('white', 0.35, 0.5, 0.08, { type: 'bandpass', f0: 3200, q: 1.2, attack: 0.02 });
    k.crackle(0.35, 0.5, 0.12, 14, { lo: 1800, hi: 5000 });
  } },
  // Energia caindo: zumbido elétrico que desce e falha
  powerdown: { len: 1.6, n: 1, recipe(k) {
    const f = k.filter('lowpass', 1600, 2);
    k.osc('sawtooth', 240, 45, 0, 1.4, 0.18, { attack: 0.01, to: f });
    k.osc('sine', 120, 30, 0, 1.4, 0.3);
    k.crackle(0.1, 1.0, 0.1, 8, { lo: 3000, hi: 8000 });
  } },
  // Energia voltando: zumbido que sobe e estabiliza
  powerup: { len: 1.2, n: 1, recipe(k) {
    const f = k.filter('lowpass', 1800, 2);
    k.osc('sawtooth', 50, 240, 0, 0.8, 0.15, { attack: 0.3, hold: 0.2, to: f });
    k.osc('sine', 30, 120, 0, 0.8, 0.25, { attack: 0.3, hold: 0.2 });
  } },
  // Vitória: fanfarra de metais sintéticos e tímpano
  win: { len: 4.5, n: 1, stereo: true, recipe(k) {
    const brass = k.filter('lowpass', 2400, 1.2, k.drive(1.6));
    [[392, 0], [523, 0.22], [659, 0.44], [784, 0.66]].forEach(([f, t]) => {
      k.osc('sawtooth', f, f, t, 0.5, 0.09, { attack: 0.03, hold: 0.15, to: brass });
      k.osc('sawtooth', f, f, t, 0.5, 0.06, { attack: 0.03, hold: 0.15, detune: 9, to: brass });
    });
    [262, 330, 392, 523].forEach(f => {
      k.osc('sawtooth', f, f, 0.9, 3.2, 0.05, { attack: 0.15, hold: 1.3, to: brass });
      k.osc('sawtooth', f, f, 0.9, 3.2, 0.035, { attack: 0.15, hold: 1.3, detune: -8, to: brass });
    });
    [0.88, 0.94, 1.0].forEach(t => k.osc('sine', 98, 60, t, 0.9, 0.6));
    k.nz('pink', 0.9, 0.6, 0.25, { type: 'lowpass', f0: 3000, f1: 400 });
    k.bell(1568, 0.9, 2.5, 0.06, 2, 1);
  } },
  // Derrota: notas que descem e um grave que apaga
  lose: { len: 5.5, n: 1, stereo: true, recipe(k) {
    const f = k.filter('lowpass', 1500, 1);
    [392, 349, 311, 262].forEach((n, i) => {
      k.osc('sawtooth', n, n, i * 0.4, 0.9, 0.08, { attack: 0.05, hold: 0.3, to: f });
      k.osc('triangle', n / 2, n / 2, i * 0.4, 0.9, 0.12, { attack: 0.05, hold: 0.3 });
    });
    k.osc('sine', 65, 40, 1.5, 3.0, 0.5, { attack: 0.2 });
    k.osc('sawtooth', 131, 98, 1.5, 2.8, 0.04, { attack: 0.3, to: f });
  } },
};

// Sons em laço (motores, coleta, ambiente). Gerados com conteúdo periódico para emendar sem estalo.
const LOOP_RECIPES = {
  // Laços: o conteúdo periódico cabe exatamente em 6,0 s (frequências inteiras: ciclos inteiros);
  // gravam 6,08 s e os 80 ms finais se cruzam com o começo (emenda sem tropeço).
  // Batidas e tinidos têm volume, altura e tempo sorteados: o padrão não se repete a cada 2 s.
  // Blindado: motor diesel pulsando, harmônicos médios e o clac-clac das esteiras
  loop_tank: { len: 6.08, recipe(k) {
    const f = k.filter('lowpass', 520, 1.2, k.drive(1.6));
    k.osc('sawtooth', 38, 38, 0, 6.2, 0.35, { attack: 0.001, hold: 6.1, to: f });
    k.osc('square', 19, 19, 0, 6.2, 0.15, { attack: 0.001, hold: 6.1, to: f });
    const mid = k.filter('bandpass', 240, 1.3);
    k.osc('sawtooth', 76, 76, 0, 6.2, 0.18, { attack: 0.001, hold: 6.1, to: mid });       // aparece em notebook
    k.osc('sawtooth', 114, 114, 0, 6.2, 0.07, { attack: 0.001, hold: 6.1, to: mid });
    for (let i = 0; i < 48; i++) k.nz('white', Math.max(0, i * 0.125 + k.r(-0.008, 0.008)), 0.03, 0.14 * k.r(0.45, 1), { type: 'bandpass', f0: k.r(1150, 1650), q: 3 });
    for (let i = 0; i < 6; i++) k.tinks(k.r(0.1, 5.8), 0.05, 0.03, 1, { lo: 1500, hi: 3000 });   // corrente batendo
    k.nz('brown', 0, 6.1, 0.25, { type: 'lowpass', f0: 300, attack: 0.001, hold: 6.0 });
  } },
  // Batedor: motor leve, mais agudo, com chacoalhar da suspensão
  loop_light: { len: 6.08, recipe(k) {
    const f = k.filter('lowpass', 1100, 1.5);
    k.osc('sawtooth', 92, 92, 0, 6.2, 0.22, { attack: 0.001, hold: 6.1, to: f });
    k.osc('sawtooth', 46, 46, 0, 6.2, 0.12, { attack: 0.001, hold: 6.1, to: f });
    for (let i = 0; i < 70; i++) k.nz('white', k.r(0, 5.95), 0.02, 0.05 * k.r(0.4, 1), { type: 'bandpass', f0: k.r(1800, 3400), q: 4 });
    k.nz('pink', 0, 6.1, 0.08, { type: 'bandpass', f0: 600, q: 0.8, attack: 0.001, hold: 6.0 });
  } },
  // Coletor: motor pesado e lento, harmônicos médios e o ranger do chassi
  loop_harv: { len: 6.08, recipe(k) {
    const f = k.filter('lowpass', 420, 1.4, k.drive(1.5));
    k.osc('sawtooth', 30, 30, 0, 6.2, 0.4, { attack: 0.001, hold: 6.1, to: f });
    k.osc('square', 15, 15, 0, 6.2, 0.15, { attack: 0.001, hold: 6.1, to: f });
    const mid = k.filter('bandpass', 260, 1.4);
    k.osc('sawtooth', 90, 90, 0, 6.2, 0.16, { attack: 0.001, hold: 6.1, to: mid });
    k.nz('brown', 0, 6.1, 0.3, { type: 'lowpass', f0: 250, attack: 0.001, hold: 6.0 });
    for (let i = 0; i < 7; i++) k.nz('white', k.r(0.05, 5.85), k.r(0.06, 0.14), 0.05 * k.r(0.5, 1), { type: 'bandpass', f0: k.r(700, 1100), q: 6, attack: 0.03 });
  } },
  // Coletor colhendo: rotor moendo cristal, com tinidos vítreos
  loop_grind: { len: 6.08, recipe(k) {
    const f = k.filter('bandpass', 700, 0.8);
    k.osc('sawtooth', 55, 55, 0, 6.2, 0.25, { attack: 0.001, hold: 6.1, to: f });
    k.nz('white', 0, 6.1, 0.14, { type: 'bandpass', f0: 1800, q: 1, attack: 0.001, hold: 6.0 });
    for (let i = 0; i < 70; i++) k.bell(k.r(2600, 5200), Math.min(5.85, k.rng() * 5.9), k.r(0.04, 0.1), k.r(0.015, 0.05), k.r(1.3, 2.4), 0.8, { to: k.pan(k.r(-0.4, 0.4)) });
  } },
  // Prédio pegando fogo: ronco grave das chamas e estalos espalhados
  loop_fire: { len: 6.08, recipe(k) {
    k.nz('brown', 0, 6.1, 0.4, { type: 'lowpass', f0: 500, attack: 0.001, hold: 6.0 });
    k.nz('pink', 0, 6.1, 0.12, { type: 'bandpass', f0: 900, q: 0.7, attack: 0.001, hold: 6.0 });
    k.crackle(0, 5.9, 0.35, 120, { lo: 800, hi: 4500, fade: 0 });
  } },
  // Vento do deserto: duas camadas (grave e assobio) com rajadas, sobre ruído longo (sem padrão repetido).
  // Cada lado começa num ponto diferente do ruído (os dois lados não soam iguais).
  loop_wind: { len: 12.08, stereo: true, longNoise: true, recipe(k) {
    const L = k.pan(-0.85), R = k.pan(0.85);
    [[L, 0.3], [R, 0.9]].forEach(([to, ph]) => {
      const w = k.nz('pinkL', 0, 12.2, 0.5, { type: 'lowpass', f0: 380, attack: 0.001, hold: 12.1, to });
      const h = k.nz('whiteL', 0, 12.2, 0.035, { type: 'bandpass', f0: 1400, q: 3, attack: 0.001, hold: 12.1, to });
      // Rajadas: volume e brilho oscilam num ciclo que fecha em 12 s
      for (let t = 0; t <= 12.08; t += 0.25) {
        const u = t / 12;
        const g = 0.6 + 0.4 * Math.sin(u * Math.PI * 2 * 3 + ph) * Math.sin(u * Math.PI * 2 * 5 + ph * 2);
        w.f.frequency.linearRampToValueAtTime(260 + g * 320, t);
        h.f.frequency.linearRampToValueAtTime(900 + g * 1100, t);
      }
    });
  } },
  // Zumbido da base: transformadores, ventilação e um apito elétrico leve (ouve-se até em notebook)
  loop_hum: { len: 6.08, recipe(k) {
    [60, 120, 180, 240, 360, 480, 720].forEach((f, i) => k.osc('sine', f, f, 0, 6.2, [0.1, 0.07, 0.05, 0.04, 0.035, 0.025, 0.012][i], { attack: 0.001, hold: 6.1 }));
    k.nz('pink', 0, 6.1, 0.08, { type: 'bandpass', f0: 900, q: 0.6, attack: 0.001, hold: 6.0 });
  } },
};


// Emenda as pontas do laço (cruzamento de 80 ms) para não estalar ao repetir
function seamLoop(buf) {
  const sr = buf.sampleRate, fade = Math.floor(sr * 0.08), n = buf.length - fade;
  const out = new AudioBuffer({ length: n, sampleRate: sr, numberOfChannels: buf.numberOfChannels });
  for (let ch = 0; ch < buf.numberOfChannels; ch++) {
    const s = buf.getChannelData(ch), d = out.getChannelData(ch);
    for (let i = 0; i < n; i++) d[i] = s[i];
    for (let i = 0; i < fade; i++) { const a = i / fade; d[i] = s[i] * a + s[n + i] * (1 - a); }
  }
  return out;
}

// Volume de cada som em loudness BS.1770 (máximo momentâneo: janelas cheias de 400 ms, com
// o filtro K de verdade). A hierarquia é fixa e não depende do pico:
// prédio > veículo > canhões (>= fuzil + 6) > impactos > fuzil > interface.
// Sons mono são medidos num canal: no jogo passam sempre pelo panner (0,707 em cada lado), o que dá o mesmo loudness.
const SFX_LUFS = {
  bigboom: -8, boom_harv: -10, boom: -11, hit_arty: -12, arty: -13, turret: -15.5, cannon: -16, boom_small: -14,
  hit_shell: -15.5, hit_rocket: -16, rocket: -19, rifle: -22, mg: -22.5, hit_bullet: -27, hit_metal: -25, death_inf: -24,
  incoming: -24, place: -21, sell: -22, ready: -20, unit: -21, deploy: -17, click: -23, select: -23, error: -27,
  credits: -23, alert: -17, detect: -19, repair: -25, powerdown: -21, powerup: -22, win: -15, lose: -16,
};
// Sons que podem passar pela saturação suave para chegar ao volume da tabela (ver renderRecipe)
const SOFT_CLIP = { bigboom: 1, boom_harv: 1, boom: 1, hit_arty: 1, boom_small: 1, hit_shell: 1 };
// Coeficientes de um biquad (fórmulas do RBJ), normalizados por a0
function kBiquad(type, f, q, gainDb, sr) {
  const w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === 'shelf') {
    const A = Math.pow(10, gainDb / 40), sA = 2 * Math.sqrt(A) * al;
    b0 = A * ((A + 1) + (A - 1) * cw + sA); b1 = -2 * A * ((A - 1) + (A + 1) * cw); b2 = A * ((A + 1) + (A - 1) * cw - sA);
    a0 = (A + 1) - (A - 1) * cw + sA; a1 = 2 * ((A - 1) - (A + 1) * cw); a2 = (A + 1) - (A - 1) * cw - sA;
  } else {
    b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = (1 + cw) / 2; a0 = 1 + al; a1 = -2 * cw; a2 = 1 - al;
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function loudnessOf(buf) {
  const sr = buf.sampleRate, n = buf.length, ms = new Float64Array(n);
  // Filtro K do BS.1770: prateleira de +4 dB em 1681 Hz e passa-altas RLB em 38 Hz
  const S = kBiquad('shelf', 1681.97, 0.70718, 3.99984, sr), H = kBiquad('hp', 38.1355, 0.50033, 0, sr);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const x = buf.getChannelData(c);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0, u1 = 0, u2 = 0, z1 = 0, z2 = 0;
    for (let i = 0; i < n; i++) {
      const y = S[0] * x[i] + S[1] * x1 + S[2] * x2 - S[3] * y1 - S[4] * y2;
      x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
      const z = H[0] * y + H[1] * u1 + H[2] * u2 - H[3] * z1 - H[4] * z2;
      u2 = u1; u1 = y; z2 = z1; z1 = z;
      ms[i] += z * z;
    }
  }
  // Janelas cheias de 400 ms (o começo e o fim contam como silêncio), passo de 25 ms
  const win = Math.floor(sr * 0.4), hop = Math.max(1, Math.floor(sr * 0.025));
  let acc = 0, best = 1e-12;
  for (let i = 0; i < n + win; i++) {
    if (i < n) acc += ms[i];
    if (i >= win && i - win < n) acc -= ms[i - win];
    if (i % hop === 0) best = Math.max(best, acc / win);
  }
  return -0.691 + 10 * Math.log10(best);
}

// Grava uma variação de um som num contexto offline
function renderRecipe(def, seed, sr, name) {
  const ch = def.stereo ? 2 : 1;
  const ctx = new OfflineAudioContext(2, Math.ceil(def.len * sr), sr);
  // Semente embaralhada e primeiros números descartados: variações realmente diferentes
  const rng = makeRng(mixSeed(seed));
  for (let i = 0; i < 8; i++) rng();
  const k = synthKit(ctx, rng);
  def.recipe(k);
  return ctx.startRendering().then(buf => {
    const out = new AudioBuffer({ length: buf.length, sampleRate: sr, numberOfChannels: ch });
    if (ch === 2) for (let c = 0; c < 2; c++) out.getChannelData(c).set(buf.getChannelData(c));
    else { const a = buf.getChannelData(0), b = buf.getChannelData(1), d = out.getChannelData(0); for (let i = 0; i < a.length; i++) d[i] = (a[i] + b[i]) * 0.5; }
    // Ajusta o volume para o loudness da tabela; o pico nunca passa de 0,97
    let peak = 1e-6;
    for (let c = 0; c < ch; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; } }
    const target = SFX_LUFS[name] ?? -18;
    // Laços (motores, vento) são graves contínuos: o filtro K exageraria o volume deles; ficam pelo pico
    let g = def.loopEnd ? 0.85 / peak : Math.pow(10, (target - loudnessOf(out)) / 20);
    // Explosões grandes que bateriam no teto de pico: passam por uma saturação suave acima de 0,6
    // (só os picos são arredondados) para chegar ao loudness da tabela sem estourar
    const soft = !def.loopEnd && SOFT_CLIP[name] && g * peak > 0.97;
    if (!soft) g = Math.min(g, 0.97 / peak);
    const knee = 0.6, room = 0.97 - knee;
    const shape = v => { const a = Math.abs(v); return a <= knee ? v : Math.sign(v) * (knee + room * Math.tanh((a - knee) / room)); };
    for (let pass = 0; pass < (soft ? 2 : 1); pass++) {
      for (let c = 0; c < ch; c++) { const d = out.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] = soft ? shape(d[i] * g) : d[i] * g; }
      // A saturação tira um pouco de loudness: uma segunda passada pequena completa
      if (soft) g = Math.min(1.6, Math.pow(10, (target - loudnessOf(out)) / 20));
      if (soft && g < 1.02) break;
    }
    if (def.loopEnd) return out;
    // Corta a cauda que ficou abaixo de -50 dB do pico (memória) e termina sem degrau
    let end = out.length;
    const thr = 0.97 * 0.00316;
    for (let c = 0, last = 0; c < ch; c++) {
      const d = out.getChannelData(c);
      for (let i = d.length - 1; i > last; i--) if (Math.abs(d[i]) > thr) { last = i; break; }
      end = c === 0 ? last : Math.max(end, last);
    }
    end = Math.min(out.length, end + Math.floor(sr * 0.02));
    const cut = new AudioBuffer({ length: Math.max(1, end), sampleRate: sr, numberOfChannels: ch });
    const f = Math.min(end, Math.floor(sr * 0.03));
    for (let c = 0; c < ch; c++) {
      const d = cut.getChannelData(c);
      d.set(out.getChannelData(c).subarray(0, end));
      for (let i = 0; i < f; i++) d[end - 1 - i] *= i / f;
    }
    return cut;
  });
}

// Monta o banco inteiro em segundo plano. Devolve uma Promise.
// Ordem: primeiro uma variação de cada som (o jogo já soa completo), depois laços e as outras variações.
function buildSfxBank(ctxRate) {
  if (typeof OfflineAudioContext === 'undefined') return Promise.resolve(false);
  // 32 kHz bastam (nada útil acima de 16 kHz nestes sons) e economizam um terço da memória e do tempo
  const sr = Math.min(ctxRate, 32000);
  const first = ['click', 'select', 'error', 'ready', 'alert', 'detect', 'place', 'deploy', 'unit', 'rifle', 'mg', 'cannon', 'hit_bullet'];
  const names = first.concat(Object.keys(SFX_RECIPES).filter(n => !first.includes(n)));
  const jobs = [];
  const maxN = Math.max(...names.map(n => SFX_RECIPES[n].n));
  const seedOf = (name, i) => (name.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7) >>> 0) + i * 7919;
  names.forEach(name => jobs.push({ name, def: SFX_RECIPES[name], seed: seedOf(name, 0) }));
  Object.keys(LOOP_RECIPES).forEach(name => jobs.push({ name, def: LOOP_RECIPES[name], seed: seedOf(name, 0), loop: true }));
  for (let i = 1; i < maxN; i++) names.forEach(name => { if (i < SFX_RECIPES[name].n) jobs.push({ name, def: SFX_RECIPES[name], seed: seedOf(name, i) }); });
  let done = 0, next = 0;
  // Três gravações em paralelo (o navegador grava fora da linha principal)
  const worker = () => {
    if (next >= jobs.length) return Promise.resolve();
    const j = jobs[next++];
    if (j.loop) j.def.loopEnd = true;
    // Um erro numa receita não pode travar o banco: vira só um som a menos
    return Promise.resolve().then(() => renderRecipe(j.def, j.seed, sr, j.name)).then(buf => {
      (SFX_BANK[j.name] = SFX_BANK[j.name] || []).push(j.loop ? seamLoop(buf) : buf);
      if (j.loop && typeof startLoops === 'function') startLoops();
    }).catch(() => {}).then(() => {
      sfxBankProgress = ++done / jobs.length;
      // Cede a vez ao jogo entre uma gravação e outra (a montagem dos nós roda na linha principal)
      return new Promise(r => setTimeout(r, 8)).then(worker);
    });
  };
  return Promise.all([worker(), worker()]).then(() => {
    for (const k in NOISE_CACHE) delete NOISE_CACHE[k]; // os ruídos só servem para gravar
    sfxBankReady = true;
    return true;
  });
}
