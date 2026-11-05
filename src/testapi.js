// Interface de testes: window.__jogo.
// Permite ler o estado e controlar a partida sem mouse (Playwright, console do navegador).
// Os nomes seguem o pedido do projeto, em português.

function unitSnapshot(u) {
  const s = {
    id: u.id,
    tipo: u.type,
    time: u.team,
    x: Math.round(u.x * 10) / 10,
    y: Math.round(u.y * 10) / 10,
    vida: Math.round(u.hp * 10) / 10,
    vidaMax: u.maxHp,
    alvo: u.target ? u.target.id : null,
    andando: u.path.length > 0,
    selecionada: u.selected,
  };
  if (u.type === 'harvester') {
    s.carga = Math.round(u.cargo);
    s.estado = u.manual ? 'manual' : u.hstate;
  }
  return s;
}

function buildingSnapshot(b) {
  return {
    id: b.id,
    tipo: b.type,
    time: b.team,
    tx: b.tx, ty: b.ty, w: b.w, h: b.h,
    x: b.x, y: b.y,
    vida: Math.round(b.hp * 10) / 10,
    vidaMax: b.maxHp,
    fila: b.queue.map(q => ({ tipo: q.type, progresso: Math.round(q.progress * 100) / 100 })),
    selecionado: b.selected,
  };
}

window.__jogo = {
  // ---- Leitura do estado ----
  get unidades() { return units.map(unitSnapshot); },
  get predios() { return buildings.filter(b => b.hp > 0).map(buildingSnapshot); },
  get creditos() { return teams.map(t => Math.floor(t.credits)); },  // [jogador, inimigo]
  get energia() { return teams.map(t => ({ gerada: t.powerOut, usada: t.powerUse })); },
  get tempo() { return Math.round(gameTime * 1000) / 1000; },
  get projeteis() { return projectiles.length; },
  get fase() { return gameState; },     // 'title' | 'playing' | 'paused' | 'won' | 'lost'
  get vencedor() { return winner; },     // -1 enquanto ninguém venceu
  get construcao() {
    return teams.map(t => t.construct ? { tipo: t.construct.type, progresso: Math.round(t.construct.progress * 100) / 100, pronto: t.construct.ready } : null);
  },
  get estatisticas() { return teams.map(t => ({ ...t.stats })); },
  get congelado() { return frozen; },
  get zoom() { return camera.zoom; },
  get graficosLeves() { return gfx.low; },   // qualidade automática reduzida (computador lento)
  get terrenoPronto() { return !!mapCanvas && !mapCanvas.preview; }, // terreno final pintado (não a prévia)
  zoomar(z) { setZoom(z, camera.w / 2, camera.h / 2); },
  get escalaInterface() { return uiScale; },  // px CSS por px lógico (telas altas: > 1)
  // Botões da interface no quadro atual, em px CSS: { acao, arg, x, y, w, h }
  get botoes() { return uiHits.map(h => ({ acao: h.act, arg: h.arg, x: h.x * uiScale, y: h.y * uiScale, w: h.w * uiScale, h: h.h * uiScale })); },
  // Conversões em px CSS da página (os que o Playwright usa em page.mouse), já com zoom e escala
  telaParaMundo(sx, sy) { return screenToWorld(sx / uiScale, sy / uiScale); },
  mundoParaTela(wx, wy) { const s = worldToScreen(wx, wy); return { x: s.x * uiScale, y: s.y * uiScale }; },
  get falas() { return voiceLog.map(v => ({ ...v })); },       // frases do locutor { text, lang, t, via }
  get som() { return { ativo: !!audioCtx, mudo: muted, musica: musicOn, vozes: voiceList.length }; },
  get mapa() {
    return { largura: MAP_W, altura: MAP_H, tile: TILE, bases: gameMap.starts.map(s => ({ ...s })) };
  },

  // Foto completa do estado, útil para comparar duas partidas
  estado() {
    return {
      tempo: this.tempo,
      fase: this.fase,
      unidades: this.unidades,
      predios: this.predios,
      creditos: this.creditos,
      energia: this.energia,
      projeteis: this.projeteis,
    };
  },

  // Tipo de terreno de um tile: 'solo' | 'planalto' | 'cristal' | 'penhasco'
  terreno(tx, ty) {
    return ['solo', 'planalto', 'cristal', 'penhasco'][tileAt(gameMap, tx, ty)];
  },
  cristalNoTile(tx, ty) {
    return Math.round(gameMap.crystal[ty * gameMap.w + tx]);
  },

  // ---- Controle da partida ----
  // Nova partida: { faccao: 0..2, inimigo: 0..2, dificuldade: 'facil'|'normal'|'dificil', mapa: 0..2, nevoa: true|false }
  novoJogo(op = {}) {
    newGame({ faction: op.faccao, enemy: op.inimigo, difficulty: op.dificuldade, map: op.mapa, fog: op.nevoa, mirror: op.espelho, aiSeed: op.semente, swapStarts: op.trocarCantos });
    return this.fase;
  },

  // Simula N segundos de jogo na hora, sem desenhar e sem som. Devolve o tempo de jogo.
  // Para sozinho se a partida acabar.
  avancar(segundos) {
    const n = Math.round(segundos * SIM_HZ);
    silentSim = true;
    for (let i = 0; i < n; i++) {
      simStep();
      if (winner >= 0 && !demoMode) break;
    }
    silentSim = false;
    return this.tempo;
  },

  // Congela (true) ou solta (false) a simulação em tempo real.
  pausar(valor = true) {
    frozen = !!valor;
    simAccum = 0;
    return frozen;
  },

  // Liga ou desliga a IA no time do jogador (para partidas IA contra IA)
  ia(time, ligado = true) {
    ais = ais.filter(a => a.team !== time);
    teams[time].isAI = !!ligado;
    if (ligado) ais.push(createAI(time));
    return ais.map(a => a.team);
  },

  revelar(valor = true) {
    gameOptions.fog = !valor;
    computeFog();
  },

  // ---- Ordens para unidades, por id ----
  //   ordem([1, 2], 'mover', { x: 800, y: 600 })        destino em px do mundo
  //   ordem([1, 2], 'atacarMovendo', { x: 800, y: 600 })
  //   ordem([1, 2], 'atacar', 7)                        id da unidade ou prédio alvo
  //   ordem([3], 'colher', { tx: 20, ty: 14 })          coletor, tile de cristal
  //   ordem([3], 'descarregar', 9)                      coletor, id da refinaria
  //   ordem([1, 2], 'parar')
  // Devolve true se a ordem foi aceita.
  ordem(ids, acao, dados) {
    const group = [].concat(ids).map(id => units.find(u => u.id === id)).filter(Boolean);
    if (group.length === 0) return false;
    if (acao === 'mover') orderMove(group, dados.x, dados.y);
    else if (acao === 'atacarMovendo') orderAttackMove(group, dados.x, dados.y);
    else if (acao === 'atacar') {
      const target = findEntity(dados);
      if (!target) return false;
      orderAttack(group, target);
    } else if (acao === 'colher') orderHarvest(group, dados.tx, dados.ty);
    else if (acao === 'descarregar') {
      const r = findEntity(dados);
      if (!r || r.type !== 'refinery') return false;
      orderReturn(group, r);
    } else if (acao === 'parar') orderStop(group);
    else return false;
    return true;
  },

  // ---- Base (sempre pelas regras do jogo; devolvem null se deu certo ou o motivo) ----
  construir(tipo, time = 0) { return startConstruction(time, tipo); },
  cancelarConstrucao(time = 0) { cancelConstruction(time); },
  // Posiciona o prédio pronto. Sem tx/ty, procura sozinho um lugar válido perto da base.
  posicionar(tx, ty, time = 0) {
    const c = teams[time].construct;
    if (!c) return 'Nada em construção';
    if (!c.ready) return 'Ainda não está pronto';
    if (tx === undefined) {
      const spot = findBuildSpot(time, c.type);
      if (!spot) return 'Sem lugar válido';
      tx = spot.x; ty = spot.y;
    }
    const check = checkPlacement(time, c.type, tx, ty);
    if (!check.ok) return check.reason;
    return placeConstruction(time, tx, ty) ? null : 'Não foi possível posicionar';
  },
  lugarValido(tipo, time = 0) { return findBuildSpot(time, tipo); },
  produzir(tipo, time = 0) { return queueUnit(time, tipo); },
  cancelarProducao(tipo, time = 0) { return cancelUnit(time, tipo); },
  vender(id) {
    const b = findEntity(id);
    if (!b || b.kind !== 'building') return false;
    sellBuilding(b);
    return true;
  },
  reparar(id, ligado = true) {
    const b = findEntity(id);
    if (!b || b.kind !== 'building') return false;
    b.repairing = !!ligado;
    return true;
  },
  pontoDeEncontro(id, x, y) {
    const b = findEntity(id);
    if (!b) return false;
    b.rally = { x, y };
    return true;
  },

  // Seleciona unidades por id (como se fosse com o mouse)
  selecionar(ids) {
    clearSelection();
    [].concat(ids).map(findEntity).filter(Boolean).forEach(e => { e.selected = true; });
  },

  // Cria uma unidade num tile (atalho de teste, fora das regras). Devolve o id.
  criar(tipo, time, tx, ty) {
    if (!UNIT_TYPES[tipo] || !isWalkable(gameMap, tx, ty)) return null;
    return spawnUnit(tipo, time, tx, ty).id;
  },
  darCreditos(valor, time = 0) {
    teams[time].credits += valor;
    return Math.floor(teams[time].credits);
  },

  // Centraliza a câmera num ponto (px do mundo)
  camera(x, y) {
    centerCameraOn(x, y);
  },
};
