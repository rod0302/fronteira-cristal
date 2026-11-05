// Teste de partida completa (Playwright): simula partidas inteiras sem desenhar.
//   1. IA contra IA: alguém precisa vencer.
//   2. Jogador parado contra a IA (normal): a IA precisa destruir o jogador.
// Uso:  node tests/partida.js [pasta-do-jogo]
// Leva cerca de um minuto. Sai com código 1 se algo falhar.

const { chromium } = require('playwright');
const path = require('path');

const dir = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const url = 'file://' + path.join(dir, 'index.html');
const failures = [];
function check(ok, msg) {
  console.log((ok ? '  ok   ' : '  FALHA ') + msg);
  if (!ok) failures.push(msg);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  // Roda até alguém vencer (ou o limite) e devolve um resumo a cada minuto
  async function run(setup, limitMin) {
    await page.goto(url + '?pausado');
    await page.waitForTimeout(300);
    return page.evaluate(([setupSrc, limit]) => {
      eval(setupSrc);
      const log = [];
      for (let m = 1; m <= limit; m++) {
        __jogo.avancar(60);
        const p = __jogo.predios, u = __jogo.unidades;
        log.push(`${m}min  créditos ${__jogo.creditos.join('/')}  prédios ${p.filter(b => b.time === 0).length}/${p.filter(b => b.time === 1).length}  unidades ${u.filter(x => x.time === 0).length}/${u.filter(x => x.time === 1).length}`);
        if (__jogo.vencedor >= 0) break;
      }
      return { log, winner: __jogo.vencedor, time: __jogo.tempo, stats: __jogo.estatisticas };
    }, [setup, limitMin]);
  }

  console.log('IA contra IA (normal):');
  const a = await run("__jogo.ia(0, true);", 70);
  a.log.forEach(l => console.log('    ' + l));
  check(a.winner >= 0, `partida terminou com vencedor (time ${a.winner} aos ${Math.round(a.time / 60)} min)`);

  console.log('Jogador parado contra a IA (normal):');
  const b = await run('', 30);
  b.log.forEach(l => console.log('    ' + l));
  check(b.winner === 1, `IA destruiu o jogador parado (${b.winner === 1 ? 'aos ' + Math.round(b.time / 60) + ' min' : 'não conseguiu em 30 min'})`);

  check(errs.length === 0, 'nenhum erro' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await browser.close();
  console.log(failures.length ? `\n${failures.length} falha(s).` : '\nTudo certo.');
  process.exit(failures.length ? 1 : 0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
