// Teste de fumaça (Playwright): abre o jogo via file:// e confere o básico de cada sistema.
// Uso:  node tests/fumaca.js [pasta-do-jogo]
// Sai com código 1 se algo falhar. Capturas de tela vão para tests/saida/.

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const dir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const outDir = path.join(__dirname, 'saida');
const url = 'file://' + path.join(dir, 'index.html');

const failures = [];
function check(ok, msg) {
  console.log((ok ? '  ok   ' : '  FALHA ') + msg);
  if (!ok) failures.push(msg);
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  // As checagens de jogo e de fps rodam no modo Clássico (o Premium é testado no fim, à parte,
  // porque sem placa de vídeo o navegador de teste desenha WebGL por software, bem devagar)
  await page.addInitScript(() => { try { localStorage.setItem('fronteira.graficos', 'classico'); } catch (e) { /* ok */ } });
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const shot = name => page.screenshot({ path: path.join(outDir, name) });
  const clickHit = async (act, arg) => {
    const h = await ev(([a, g]) => uiHits.find(x => x.act === a && (g === undefined || x.arg === g)), [act, arg]);
    if (!h) return false;
    await page.mouse.click(h.x + h.w / 2, h.y + h.h / 2);
    return true;
  };

  // 1. Tela de título desenhada, com a batalha de demonstração no fundo
  console.log('Abrindo', url);
  await page.goto(url);
  await page.waitForTimeout(1500);
  await shot('1-titulo.png');
  const colored = await ev(() => {
    const c = document.getElementById('game');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 400) if (d[i] + d[i + 1] + d[i + 2] > 30) n++;
    return n / (d.length / 400);
  });
  check(colored > 0.3, `título desenhado (${Math.round(colored * 100)}% de pixels não pretos)`);
  check(await ev(() => typeof window.__jogo === 'object' && __jogo.fase === 'title'), 'window.__jogo existe e a fase é "title"');

  // 2. Botão JOGAR começa a partida
  await clickHit('start');
  await page.waitForTimeout(300);
  check(await ev(() => __jogo.fase) === 'playing', 'clicar em JOGAR começa a partida');
  const t0 = await ev(() => __jogo.tempo);
  await page.waitForTimeout(1000);
  const t1 = await ev(() => __jogo.tempo);
  check(t1 - t0 > 0.5, `tempo avança em tempo real (${t0} -> ${t1})`);

  // 3. Névoa: a base inimiga começa escondida
  check(await ev(() => !isVisibleToPlayer(buildings.find(b => b.team === 1))), 'base inimiga escondida pela névoa no início');

  // 4. Seleção em caixa com o mouse + clique direito para mover
  await ev(() => __jogo.pausar(true));
  const box = await ev(() => {
    const mine = __jogo.unidades.filter(u => u.time === 0);
    const xs = mine.map(u => u.x - camera.x), ys = mine.map(u => u.y - camera.y);
    return { x0: Math.min(...xs) - 20, y0: Math.min(...ys) - 20, x1: Math.max(...xs) + 20, y1: Math.max(...ys) + 20, n: mine.length };
  });
  await page.mouse.move(box.x0, box.y0);
  await page.mouse.down();
  await page.mouse.move(box.x1, box.y1, { steps: 5 });
  await page.mouse.up();
  const nSel = await ev(() => __jogo.unidades.filter(u => u.selecionada).length);
  check(nSel === box.n, `seleção em caixa pegou ${nSel} de ${box.n} unidades`);
  const before = await ev(() => __jogo.unidades.filter(u => u.time === 0).map(u => [u.x, u.y]));
  await page.mouse.click(box.x1 + 60, box.y1 + 80, { button: 'right' });
  await ev(() => __jogo.avancar(3));
  const after = await ev(() => __jogo.unidades.filter(u => u.time === 0).map(u => [u.x, u.y]));
  const moved = after.filter((p, i) => Math.hypot(p[0] - before[i][0], p[1] - before[i][1]) > 20).length;
  check(moved === box.n, `clique direito moveu ${moved} de ${box.n} unidades`);

  // 5. Construção pelo painel: Usina -> PRONTO -> colocar com o mouse
  await clickHit('build', 'power');
  check(await ev(() => __jogo.construcao[0] && __jogo.construcao[0].tipo === 'power'), 'clicar na Usina começa a construção');
  await ev(() => __jogo.avancar(11));
  await page.waitForTimeout(100);
  check(await ev(() => __jogo.construcao[0].pronto), 'Usina fica pronta');
  await clickHit('build', 'power');
  check(await ev(() => input.mode === 'place'), 'clicar em PRONTO entra no modo de posicionar');
  const spot = await ev(() => { const s = __jogo.lugarValido('power'); return { x: (s.x + 1) * 32 - camera.x, y: (s.y + 1) * 32 - camera.y }; });
  await page.mouse.move(spot.x, spot.y);
  await page.waitForTimeout(100);
  await shot('2-posicionando.png');
  await page.mouse.click(spot.x, spot.y);
  check(await ev(() => __jogo.predios.some(b => b.time === 0 && b.tipo === 'power')), 'Usina colocada no mapa com o mouse');
  check(await ev(() => __jogo.energia[0].gerada === 130), 'energia gerada subiu para 130');

  // 6. Colheita: Refinaria traz Coletor, que colhe e gera créditos
  const build = tipo => ev(t => {
    const why = __jogo.construir(t);
    if (why) return why;
    for (let i = 0; i < 90 && !__jogo.construcao[0].pronto; i++) __jogo.avancar(1);
    return __jogo.posicionar();
  }, tipo);
  check(await build('refinery') === null, 'Refinaria construída');
  check(await ev(() => __jogo.unidades.some(u => u.time === 0 && u.tipo === 'harvester')), 'Refinaria veio com um Coletor');
  // "Harvester deployed" sai quando o Coletor chega ao cristal e começa a colher (em tempo real)
  let fala = null;
  await ev(() => __jogo.pausar(false)); // o teste congela o tempo real; solta só para o Coletor andar
  for (let i = 0; i < 40 && !fala; i++) {
    await page.waitForTimeout(500);
    fala = await ev(() => __jogo.falas.find(f => f.key === 'harvester_deployed'));
  }
  await ev(() => __jogo.pausar(true));
  if (!fala) console.log(await ev(() => JSON.stringify({ falas: __jogo.falas, h: units.filter(u => u.type === 'harvester' && u.team === 0).map(u => u.hstate), fase: gameState, t: gameTime })));
  check(!!fala && fala.via !== 'mudo', 'locutor anunciou "Harvester deployed" (' + (fala ? fala.via : 'nada') + ')');
  check(await ev(() => voicePackState === 'pronto' && Object.keys(VOICE_BUF).length === Object.keys(VOICE_PACK).length),
    'pacote de vozes decodificado (' + await ev(() => Object.keys(VOICE_BUF).length) + ' falas)');
  // O banco é gravado em segundo plano: espera até 40 s (máquina carregada)
  for (let i = 0; i < 80 && !(await ev(() => sfxBankReady)); i++) await page.waitForTimeout(500);
  check(await ev(() => sfxBankReady && Object.keys(SFX_BANK).length >= 30), 'banco de efeitos gravado');
  const harvested = await ev(() => { __jogo.avancar(60); return __jogo.estatisticas[0].harvested; });
  check(harvested > 0, `Coletor trouxe cristal (${Math.round(harvested)} créditos em 60 s)`);

  // 7. Produção: Quartel e Fábrica produzem unidades
  check(await build('barracks') === null, 'Quartel construído');
  await ev(() => __jogo.darCreditos(3000));
  check(await build('factory') === null, 'Fábrica construída');
  const n0 = await ev(() => __jogo.unidades.filter(u => u.time === 0).length);
  check(await ev(() => __jogo.produzir('tank')) === null && await ev(() => __jogo.produzir('trooper')) === null, 'blindado e soldado entram na fila');
  await ev(() => __jogo.avancar(20));
  const n1 = await ev(() => __jogo.unidades.filter(u => u.time === 0).length);
  check(n1 >= n0 + 2, `unidades produzidas (${n0} -> ${n1})`);
  await page.waitForTimeout(100);
  await shot('3-base.png');

  // 8. Combate: clique direito num inimigo visível vira ataque, e alguém morre
  const enemy = await ev(() => {
    const me = __jogo.unidades.find(u => u.time === 0 && u.tipo === 'tank');
    const id = __jogo.criar('tank', 1, Math.floor(me.x / 32) + 3, Math.floor(me.y / 32) + 2);
    __jogo.avancar(0.2);
    __jogo.selecionar(__jogo.unidades.filter(u => u.time === 0 && u.tipo !== 'harvester').map(u => u.id));
    const e = findEntity(id);
    __jogo.camera(e.x, e.y);
    return { id, sx: e.x - camera.x, sy: e.y - camera.y };
  });
  await page.mouse.move(enemy.sx, enemy.sy);
  await page.waitForTimeout(100);
  check(await ev(() => document.getElementById('game').style.cursor) === 'none', 'cursor vira mira sobre inimigo');
  await page.mouse.click(enemy.sx, enemy.sy, { button: 'right' });
  check(await ev(id => __jogo.unidades.filter(u => u.selecionada).every(u => u.alvo === id), enemy.id), 'clique direito no inimigo deu ordem de ataque');
  const dead = await ev(id => { __jogo.avancar(25); return !__jogo.unidades.some(u => u.id === id); }, enemy.id);
  check(dead, 'inimigo destruído em combate');

  // 9. A IA joga: constrói e produz
  const ai = await ev(() => ({ b: __jogo.predios.filter(b => b.time === 1).length, u: __jogo.unidades.filter(u => u.time === 1).length }));
  check(ai.b >= 4, `IA construiu a base (${ai.b} prédios, ${ai.u} unidades)`);

  // 10. Pausa pelo teclado
  await ev(() => __jogo.pausar(false));
  await page.keyboard.press('KeyP');
  check(await ev(() => __jogo.fase) === 'paused', 'P pausa');
  await shot('4-pausa.png');
  await page.keyboard.press('KeyP');
  check(await ev(() => __jogo.fase) === 'playing', 'P retoma');

  // 11. Repetibilidade: duas partidas com as mesmas ordens terminam iguais
  async function scriptedRun() {
    await page.goto(url + '?pausado');
    await page.waitForTimeout(300);
    return ev(() => {
      __jogo.ia(0, true);
      __jogo.avancar(150);
      return JSON.stringify(__jogo.estado());
    });
  }
  const runA = await scriptedRun();
  const runB = await scriptedRun();
  check(runA === runB, 'mesmas ordens geram exatamente o mesmo estado (passo fixo)');

  // 12. Desempenho com a tela cheia de unidades
  await page.goto(url + '?jogar&semnevoa');
  await page.waitForTimeout(400);
  await ev(() => {
    for (let i = 0; i < 60; i++) {
      __jogo.criar(['tank', 'scout', 'trooper'][i % 3], 0, 30 + (i % 10), 30 + (i / 10 | 0));
      __jogo.criar(['tank', 'scout', 'trooper'][i % 3], 1, 42 + (i % 10), 36 + (i / 10 | 0));
    }
    __jogo.camera(40 * 32, 36 * 32);
  });
  await page.waitForTimeout(2500);
  const fps = await ev(() => new Promise(r => {
    let n = 0; const t0 = performance.now();
    (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(n / 2); })();
  }));
  await shot('5-batalha.png');
  console.log('  fps ~', fps, 'com', await ev(() => units.length), 'unidades em batalha');
  check(fps >= 30, 'fps aceitável (>= 30)');

  // 13. Modo Premium (WebGL2): liga, desenha, não muda a simulação e não dá erro
  const pp = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  pp.on('console', m => { if (m.type() === 'error') errs.push('premium console: ' + m.text()); });
  pp.on('pageerror', e => errs.push('premium pageerror: ' + e.message));
  await pp.goto(url + '?premium&pausado');
  await pp.waitForTimeout(500);
  const mode = await pp.evaluate(() => graphicsMode);
  if (mode !== 'premium') {
    console.log('  (WebGL2 indisponível neste navegador: o jogo caiu para', mode + ', como deveria)');
  } else {
    const runP = await pp.evaluate(() => {
      __jogo.ia(0, true);
      __jogo.avancar(150);
      return JSON.stringify(__jogo.estado());
    });
    check(runP === runA, 'simulação idêntica no modo Premium (mesmo estado do Clássico)');
    await pp.goto(url + '?premium');
    await pp.waitForFunction(() => premium.ok && premium.frames > 3, null, { timeout: 60000 }).catch(() => {});
    await pp.waitForTimeout(1500);
    const png = await pp.screenshot({ path: path.join(outDir, '6-premium-titulo.png') });
    const lit = await pp.evaluate(async b64 => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      let n = 0, sat = 0;
      for (let i = 0; i < d.length; i += 400) {
        if (d[i] + d[i + 1] + d[i + 2] > 30) n++;
        if (Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) > 25) sat++;
      }
      return { lit: n / (d.length / 400), sat: sat / (d.length / 400) };
    }, png.toString('base64'));
    check(lit.lit > 0.5 && lit.sat > 0.1, `Premium desenha a cena 3D (${Math.round(lit.lit * 100)}% acesos, ${Math.round(lit.sat * 100)}% coloridos)`);
    check(await pp.evaluate(() => document.getElementById('gl').style.display !== 'none'), 'canvas WebGL visível no Premium');
    await pp.keyboard.press('F9');
    await pp.waitForTimeout(400);
    check(await pp.evaluate(() => graphicsMode === 'classico' && document.getElementById('gl').style.display === 'none'),
      'F9 troca para o Clássico e esconde o WebGL');
  }
  await pp.close();

  // 14. Modo Leve em tela grande: a camada da interface fica por cima do mapa
  const pl = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  pl.on('pageerror', e => errs.push('leve pageerror: ' + e.message));
  await pl.goto(url + '?leve&jogar');
  await pl.waitForTimeout(800);
  check(await pl.evaluate(() => {
    if (!uiCanvas) return true; // sem camada separada nesta tela
    const z = c => +(getComputedStyle(c).zIndex) || 0;
    return z(uiCanvas) > z(document.getElementById('game'));
  }), 'modo Leve em tela grande: interface por cima do mapa');
  await pl.close();

  check(errs.length === 0, 'nenhum erro no console' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();

  console.log(failures.length ? `\n${failures.length} falha(s).` : '\nTudo certo.');
  console.log('Capturas em', outDir);
  process.exit(failures.length ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
