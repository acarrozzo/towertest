// UI helpers — HUD updates and upgrade panel rendering

function updateHUD(state) {
  document.getElementById('lives').textContent = state.lives;
  document.getElementById('gold').textContent = state.gold;
  document.getElementById('level').textContent = state.level;
  document.getElementById('hud-status').textContent = state.statusText;
}

function showUpgradePanel(tower, gold, onUpgrade, onSell) {
  document.getElementById('tower-select').classList.add('hidden');
  const panel = document.getElementById('upgrade-panel');
  panel.classList.remove('hidden');

  const opts = tower.getUpgradeOptions();
  const info = document.getElementById('upgrade-info');
  info.innerHTML = `
    <strong>${tower.name}</strong> (T${tower.tier}${tower.branch || ''})<br>
    DMG: ${tower.damage} | RNG: ${tower.range}<br>
    Rate: ${(1000 / tower.fireRate).toFixed(1)}/s
    ${tower.splash ? `<br>Splash: ${tower.splash}` : ''}
    ${tower.ignoreArmor ? '<br><span style="color:#ff8">Armor Pierce</span>' : ''}
    ${tower.slow ? '<br><span style="color:#88f">Slows enemies</span>' : ''}
  `;

  const btnsDiv = document.getElementById('upgrade-buttons');
  btnsDiv.innerHTML = '';

  if (opts.length === 0) {
    btnsDiv.innerHTML = '<span style="color:#666;font-size:11px">Fully upgraded</span>';
  } else {
    for (const opt of opts) {
      const btn = document.createElement('button');
      btn.className = 'upgrade-btn';
      btn.innerHTML = `${opt.name}<span class="upg-cost">${opt.cost}g</span><br><small style="color:#888">${opt.desc}</small>`;
      btn.disabled = gold < opt.cost;
      btn.addEventListener('click', () => onUpgrade(opt.key, opt.cost));
      btnsDiv.appendChild(btn);
    }
  }

  const sellBtn = document.getElementById('sell-btn');
  sellBtn.textContent = `Sell (+${tower.getSellValue()}g)`;
  sellBtn.onclick = onSell;
}

function hideUpgradePanel() {
  document.getElementById('tower-select').classList.remove('hidden');
  document.getElementById('upgrade-panel').classList.add('hidden');
}

function showMessage(text, btnText, onContinue) {
  const box = document.getElementById('message-box');
  box.classList.remove('hidden');
  document.getElementById('message-text').innerHTML = text;
  const btn = document.getElementById('message-btn');
  btn.textContent = btnText;
  btn.onclick = () => {
    box.classList.add('hidden');
    onContinue();
  };
}

function hideMessage() {
  document.getElementById('message-box').classList.add('hidden');
}

function setStartWaveBtn(enabled, text) {
  const btn = document.getElementById('start-wave-btn');
  btn.disabled = !enabled;
  btn.textContent = text;
}

// Draw wave progress bar on canvas
function drawWaveProgress(ctx, spawned, total, level) {
  const barW = 200;
  const barH = 8;
  const x = COLS * TILE_SIZE / 2 - barW / 2;
  const y = ROWS * TILE_SIZE - 20;

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - 2, y - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, barW, barH);
  ctx.fillStyle = '#4f4';
  ctx.fillRect(x, y, barW * (spawned / total), barH);

  ctx.fillStyle = '#aaa';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Wave ${level}/5 — ${spawned}/${total}`, COLS * TILE_SIZE / 2, y - 5);
}

// Draw "START" overlay before wave begins
function drawReadyOverlay(ctx, levelDesc) {
  const cx = (COLS * TILE_SIZE) / 2;
  const cy = (ROWS * TILE_SIZE) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, COLS * TILE_SIZE, ROWS * TILE_SIZE);

  ctx.fillStyle = '#eee';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(levelDesc, cx, cy - 20);

  ctx.fillStyle = '#8f8';
  ctx.font = '14px monospace';
  ctx.fillText('Press "Start Wave" to begin', cx, cy + 20);
}
