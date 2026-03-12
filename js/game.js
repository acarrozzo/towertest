// ============================================================
// Tower Test — Main Game Loop
// ============================================================

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const STATE = {
  READY:    'ready',
  PLAYING:  'playing',
  BETWEEN:  'between',
  GAMEOVER: 'gameover',
  VICTORY:  'victory'
};

let state = {
  phase: STATE.READY,
  lives: 10,
  gold: 100,
  level: 1,
  statusText: 'Place towers & start wave',

  enemies: [],
  towers: [],
  projectiles: [],

  spawned: 0,
  spawnTimer: 0,

  selectedTowerType: null,  // type to place
  selectedTower: null,      // placed tower being inspected
  hoverTile: null,

  speed: 1,
  paused: false
};

let lastTime = 0;

// ============================================================
// Input
// ============================================================

document.querySelectorAll('.tower-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (state.selectedTowerType === type) {
      state.selectedTowerType = null;
      btn.classList.remove('selected');
    } else {
      document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.selectedTowerType = type;
      deselectTower();
    }
  });
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  state.hoverTile = pixelToTile(mx, my);
});

canvas.addEventListener('mouseleave', () => {
  state.hoverTile = null;
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { col, row } = pixelToTile(mx, my);

  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return;

  // Click on existing tower
  const existing = state.towers.find(t => t.col === col && t.row === row);
  if (existing) {
    selectTower(existing);
    return;
  }

  // Place new tower
  if (state.selectedTowerType) {
    placeTower(state.selectedTowerType, col, row);
  } else {
    deselectTower();
  }
});

document.getElementById('start-wave-btn').addEventListener('click', () => {
  if (state.phase === STATE.READY || state.phase === STATE.BETWEEN) {
    startWave();
  }
});

document.getElementById('pause-btn').addEventListener('click', () => {
  if (state.phase !== STATE.PLAYING) return;
  state.paused = !state.paused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = state.paused ? '▶ Resume' : '⏸ Pause';
  btn.classList.toggle('active', state.paused);
});

document.getElementById('speed-btn').addEventListener('click', () => {
  state.speed = state.speed === 1 ? 2 : 1;
  const btn = document.getElementById('speed-btn');
  btn.textContent = state.speed === 2 ? '1x' : '⏩ 2x';
  btn.classList.toggle('active', state.speed === 2);
});

// ============================================================
// Tower placement / selection
// ============================================================

function placeTower(type, col, row) {
  if (isPathTile(col, row)) return;
  if (state.towers.find(t => t.col === col && t.row === row)) return;

  const cost = TOWER_DEFS[type].cost;
  if (state.gold < cost) return;

  state.gold -= cost;
  const t = new Tower(type, col, row);
  state.towers.push(t);
  updateHUD(state);
}

function selectTower(tower) {
  if (state.selectedTower) state.selectedTower.selected = false;
  state.selectedTower = tower;
  tower.selected = true;
  state.selectedTowerType = null;
  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));

  showUpgradePanel(
    tower,
    state.gold,
    (key, cost) => {
      if (state.gold < cost) return;
      state.gold -= cost;
      tower.upgrade(key);
      updateHUD(state);
      selectTower(tower); // refresh panel
    },
    () => {
      state.gold += tower.getSellValue();
      state.towers = state.towers.filter(t => t !== tower);
      deselectTower();
      updateHUD(state);
    }
  );
}

function deselectTower() {
  if (state.selectedTower) state.selectedTower.selected = false;
  state.selectedTower = null;
  hideUpgradePanel();
}

// ============================================================
// Wave management
// ============================================================

function startWave() {
  const lvl = LEVELS[state.level - 1];
  state.phase = STATE.PLAYING;
  state.paused = false;
  state.enemies = [];
  state.projectiles = [];
  state.spawned = 0;
  state.spawnTimer = 0;
  state.statusText = `Wave ${state.level} in progress`;
  setStartWaveBtn(false, 'Wave in progress...');
  setPauseBtn(true, false);
  updateHUD(state);
  updateWavePreview(state);
  deselectTower();
}

function spawnEnemy() {
  const lvl = LEVELS[state.level - 1];
  const type = lvl.enemyType;
  state.enemies.push(new Enemy(type, state.level - 1));
  state.spawned++;
}

function spawnBoss() {
  state.enemies.push(new Enemy('boss', state.level - 1));
}

function checkWaveEnd() {
  const lvl = LEVELS[state.level - 1];
  const totalExpected = lvl.count + (lvl.boss ? 1 : 0);
  const allSpawned = state.spawned >= totalExpected;
  const allGone = state.enemies.every(e => e.dead || e.reached);

  if (!allSpawned || !allGone) return;

  // Wave complete
  if (state.lives <= 0) return; // already game over

  if (state.level >= 5) {
    // Victory
    state.phase = STATE.VICTORY;
    state.statusText = 'Victory!';
    setPauseBtn(false, false);
    updateWavePreview(state);
    showMessage(
      '🏆 You Win!<br><small>All 5 levels conquered!</small>',
      'Play Again',
      resetGame
    );
  } else {
    state.phase = STATE.BETWEEN;
    state.statusText = `Level ${state.level} complete!`;
    const bonus = 25 + state.level * 10;
    state.gold += bonus;
    setPauseBtn(false, false);
    updateHUD(state);
    updateWavePreview(state);
    showMessage(
      `Level ${state.level} Complete!<br><small>+${bonus}g bonus gold</small>`,
      `Next Level →`,
      () => {
        state.level++;
        state.statusText = LEVELS[state.level - 1].description;
        updateHUD(state);
        updateWavePreview(state);
        setStartWaveBtn(true, `Start Level ${state.level}`);
      }
    );
  }
}

// ============================================================
// Main loop
// ============================================================

function update(dt) {
  if (state.phase !== STATE.PLAYING) return;

  const lvl = LEVELS[state.level - 1];
  const normalCount = lvl.count;
  const hasBoss = lvl.boss;

  // Spawn regular enemies
  if (state.spawned < normalCount) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.spawnTimer = lvl.spawnInterval;
    }
  }

  // Spawn boss after all regular enemies are dead/gone
  if (hasBoss && state.spawned === normalCount) {
    const allRegularGone = state.enemies.every(e => e.dead || e.reached);
    if (allRegularGone) {
      spawnBoss();
      state.spawned++; // prevents re-spawning
    }
  }

  // Update enemies
  for (const e of state.enemies) {
    e.update(dt);
    if (e.reached) {
      e.reached = false;
      e.dead = true;
      state.lives--;
      updateHUD(state);
      if (state.lives <= 0) {
        state.phase = STATE.GAMEOVER;
        state.statusText = 'Game Over';
        setPauseBtn(false, false);
        updateWavePreview(state);
        showMessage(
          'Game Over<br><small>Your base was overrun!</small>',
          'Try Again',
          resetGame
        );
        return;
      }
    }
    if (e.dead && !e._rewarded) {
      e._rewarded = true;
      state.gold += e.reward;
      updateHUD(state);
    }
  }

  // Update towers
  const aliveEnemies = state.enemies.filter(e => !e.dead && !e.reached);
  for (const t of state.towers) {
    t.update(dt, aliveEnemies, state.projectiles);
  }

  // Update projectiles
  for (const p of state.projectiles) {
    p.update(dt, aliveEnemies);
  }
  state.projectiles = state.projectiles.filter(p => !p.done);

  // Clean dead enemies
  state.enemies = state.enemies.filter(e => !(e.dead && e._rewarded));

  checkWaveEnd();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawMap(ctx, state.towers);

  // Hover highlight + range preview
  if (state.hoverTile && state.selectedTowerType) {
    const { col, row } = state.hoverTile;
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      const onPath = isPathTile(col, row);
      const occupied = state.towers.some(t => t.col === col && t.row === row);
      const canAfford = state.gold >= TOWER_DEFS[state.selectedTowerType].cost;
      drawTileHighlight(ctx, col, row, !onPath && !occupied && canAfford);

      // Range circle preview
      const range = TOWER_DEFS[state.selectedTowerType].base.range;
      const px = col * TILE_SIZE + TILE_SIZE / 2;
      const py = row * TILE_SIZE + TILE_SIZE / 2;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(px, py, range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  for (const e of state.enemies) e.draw(ctx);
  for (const p of state.projectiles) p.draw(ctx);
  for (const t of state.towers) t.draw(ctx);

  if (state.phase === STATE.PLAYING) {
    const lvl = LEVELS[state.level - 1];
    const total = lvl.count + (lvl.boss ? 1 : 0);
    drawWaveProgress(ctx, state.spawned, total, state.level);
  }

  if (state.phase === STATE.READY || state.phase === STATE.BETWEEN) {
    drawReadyOverlay(ctx, LEVELS[state.level - 1].description);
  }
}

function loop(timestamp) {
  const dt = Math.min(timestamp - lastTime, 100);
  lastTime = timestamp;
  if (!state.paused) update(dt * state.speed);
  draw();
  requestAnimationFrame(loop);
}

// ============================================================
// Init / Reset
// ============================================================

function resetGame() {
  state.phase = STATE.READY;
  state.lives = 10;
  state.gold = 100;
  state.level = 1;
  state.statusText = 'Place towers & start wave';
  state.enemies = [];
  state.towers = [];
  state.projectiles = [];
  state.spawned = 0;
  state.spawnTimer = 0;
  state.selectedTowerType = null;
  state.selectedTower = null;
  state.speed = 1;
  state.paused = false;

  document.querySelectorAll('.tower-btn').forEach(b => b.classList.remove('selected'));
  hideUpgradePanel();
  hideMessage();
  setStartWaveBtn(true, 'Start Wave');
  setPauseBtn(false, false);
  setSpeedBtn(1);
  updateHUD(state);
  updateWavePreview(state);
}

// Boot
resetGame();
requestAnimationFrame(ts => { lastTime = ts; requestAnimationFrame(loop); });
