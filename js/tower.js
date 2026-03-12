// Upgrade tree definitions
// Each tower has: base stats, and upgrades keyed by tier+branch
// upgradeTree: { '2A': {...}, '2B': {...}, '3A': {...}, '3B': {...} }
// tier 1 = base, tier 2 branches into A/B, tier 3 continues chosen branch

const TOWER_DEFS = {
  arrow: {
    name: 'Arrow',
    cost: 50,
    color: '#7df',
    base: { damage: 15, range: 120, fireRate: 600, splash: 0 },
    upgradeTree: {
      '2A': { name: 'Rapid Fire', cost: 60, desc: '+speed, +dmg', damage: 20, range: 120, fireRate: 350, splash: 0, multi: false },
      '2B': { name: 'Sniper',     cost: 60, desc: '+range, +dmg', damage: 35, range: 180, fireRate: 700, splash: 0, multi: false },
      '3A': { name: 'Multishot',  cost: 100, desc: 'Hits 3 targets', damage: 20, range: 130, fireRate: 350, splash: 0, multi: 3 },
      '3B': { name: 'Armor Pierce', cost: 100, desc: 'Ignores armor', damage: 50, range: 200, fireRate: 700, splash: 0, ignoreArmor: true }
    }
  },
  bomb: {
    name: 'Bomb',
    cost: 75,
    color: '#f84',
    base: { damage: 40, range: 110, fireRate: 1800, splash: 55 },
    upgradeTree: {
      '2A': { name: 'Big Blast',      cost: 60, desc: '+splash radius', damage: 50, range: 120, fireRate: 1800, splash: 85 },
      '2B': { name: 'Chain Reaction', cost: 60, desc: 'Fires 2 bombs', damage: 40, range: 110, fireRate: 1800, splash: 55, chain: 2 },
      '3A': { name: 'Mega Bomb',      cost: 100, desc: 'Massive AoE', damage: 80, range: 130, fireRate: 2200, splash: 130 },
      '3B': { name: 'Cluster Bomb',   cost: 100, desc: '3 bombs, wider', damage: 40, range: 120, fireRate: 1800, splash: 55, chain: 3 }
    }
  },
  ice: {
    name: 'Ice',
    cost: 100,
    color: '#9ef',
    base: { damage: 12, range: 130, fireRate: 1500, splash: 0, slowFactor: 0.5, slowDuration: 1200 },
    upgradeTree: {
      '2A': { name: 'Deep Freeze',  cost: 75,  desc: 'Stronger slow',    damage: 20, range: 140, fireRate: 1100, splash: 0,   slowFactor: 0.3, slowDuration: 2000 },
      '2B': { name: 'Ice Shards',   cost: 75,  desc: 'AoE slow',         damage: 10, range: 125, fireRate: 1800, splash: 65,  slowFactor: 0.5, slowDuration: 1200 },
      '3A': { name: 'Permafrost',   cost: 110, desc: 'Near-freeze',       damage: 30, range: 155, fireRate: 900,  splash: 0,   slowFactor: 0.15, slowDuration: 3000 },
      '3B': { name: 'Blizzard',     cost: 110, desc: 'Massive AoE slow',  damage: 15, range: 140, fireRate: 2000, splash: 110, slowFactor: 0.4, slowDuration: 1800 }
    }
  },
  laser: {
    name: 'Laser',
    cost: 125,
    color: '#f4f',
    base: { damage: 80, range: 160, fireRate: 2000, splash: 0 },
    upgradeTree: {
      '2A': { name: 'Overcharge', cost: 60, desc: '+dmg, armor pierce',    damage: 140, range: 160, fireRate: 2500, splash: 0, ignoreArmor: true },
      '2B': { name: 'Sweep',      cost: 60, desc: 'Hits 2 enemies',        damage: 70,  range: 170, fireRate: 1800, splash: 0, sweep: 2 },
      '3A': { name: 'Death Ray',  cost: 100, desc: 'Extreme single dmg',   damage: 260, range: 180, fireRate: 2800, splash: 0, ignoreArmor: true },
      '3B': { name: 'Grid Lock',  cost: 100, desc: 'High-speed multi-target', damage: 100, range: 195, fireRate: 1400, splash: 0, sweep: 3 }
    }
  }
};

class Tower {
  constructor(type, col, row) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = col * TILE_SIZE + TILE_SIZE / 2;
    this.y = row * TILE_SIZE + TILE_SIZE / 2;

    const def = TOWER_DEFS[type];
    this.name = def.name;
    this.color = def.color;
    this.cost = def.cost;

    // Current stats (start at base)
    this.applyStats(def.base);

    // Upgrade state
    this.tier = 1;       // 1, 2, or 3
    this.branch = null;  // 'A' or 'B'

    this.cooldown = 0;
    this.selected = false;
    this.animTimer = 0;
  }

  applyStats(stats) {
    this.damage      = stats.damage;
    this.range       = stats.range;
    this.fireRate    = stats.fireRate;
    this.splash      = stats.splash || 0;
    this.ignoreArmor = stats.ignoreArmor || false;
    this.multi       = stats.multi || false;
    this.chain       = stats.chain || false;
    this.sweep       = stats.sweep || false;
    this.slow        = stats.slow || false;
    this.slowFactor  = stats.slowFactor || 0;
    this.slowDuration = stats.slowDuration || 0;
  }

  // Returns available upgrade options from current state
  getUpgradeOptions() {
    const tree = TOWER_DEFS[this.type].upgradeTree;
    if (this.tier === 1) {
      return [
        { key: '2A', ...tree['2A'] },
        { key: '2B', ...tree['2B'] }
      ];
    }
    if (this.tier === 2) {
      const nextKey = `3${this.branch}`;
      return tree[nextKey] ? [{ key: nextKey, ...tree[nextKey] }] : [];
    }
    return []; // tier 3, fully upgraded
  }

  upgrade(key) {
    const tree = TOWER_DEFS[this.type].upgradeTree;
    const upg = tree[key];
    if (!upg) return false;
    this.applyStats(upg);
    this.tier = parseInt(key[0]);
    this.branch = key[1];
    return true;
  }

  getSellValue() {
    let total = this.cost;
    const tree = TOWER_DEFS[this.type].upgradeTree;
    if (this.tier >= 2) total += tree[`2${this.branch}`].cost;
    if (this.tier >= 3) total += tree[`3${this.branch}`].cost;
    return Math.floor(total * 0.6);
  }

  update(dt, enemies, projectiles) {
    this.cooldown -= dt;
    this.animTimer += dt;
    if (this.cooldown > 0) return;

    const targets = this.findTargets(enemies);
    if (targets.length === 0) return;

    this.cooldown = this.fireRate;
    this.shoot(targets, projectiles);
  }

  findTargets(enemies) {
    const inRange = enemies.filter(e =>
      !e.dead && !e.reached &&
      Math.hypot(e.x - this.x, e.y - this.y) <= this.range
    );
    if (inRange.length === 0) return [];

    // Sort by progress (furthest along path first)
    inRange.sort((a, b) => b.progress - a.progress);

    if (this.multi) return inRange.slice(0, this.multi);
    if (this.sweep) return inRange.slice(0, this.sweep);
    if (this.chain) return inRange.slice(0, this.chain);
    return [inRange[0]];
  }

  shoot(targets, projectiles) {
    const opts = {
      splashRadius: this.splash || 0,
      ignoreArmor: this.ignoreArmor,
      slow: this.slow,
      slowFactor: this.slowFactor,
      slowDuration: this.slowDuration,
      color: this.color
    };

    if (this.type === 'laser') {
      for (const t of targets) {
        t.takeDamage(this.damage, this.ignoreArmor);
        if (this.slow) t.applySlow(0.4, 1500);
        const p = new Projectile('laser', this.x, this.y, t, this.damage, opts);
        projectiles.push(p);
      }
      return;
    }

    if (this.type === 'bomb' && this.chain) {
      // Fire multiple bombs at different nearby targets
      const bombTargets = targets.slice(0, this.chain);
      const inRange = /* re-use targets list extended */ bombTargets;
      for (let i = 0; i < this.chain; i++) {
        const tgt = inRange[i % inRange.length];
        projectiles.push(new Projectile('bomb', this.x, this.y, tgt, this.damage, opts));
      }
      return;
    }

    for (const t of targets) {
      projectiles.push(new Projectile(this.type, this.x, this.y, t, this.damage, opts));
    }
  }

  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const pulse = Math.sin(this.animTimer / 300) * 2;

    ctx.save();

    if (this.selected) {
      // Range circle
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, this.range, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.type === 'arrow') drawArrowTower(ctx, x, y, this.tier, this.color, pulse);
    else if (this.type === 'bomb')  drawBombTower(ctx, x, y, this.tier, this.color, pulse);
    else if (this.type === 'ice')   drawIceTower(ctx, x, y, this.tier, this.color, pulse);
    else if (this.type === 'laser') drawLaserTower(ctx, x, y, this.tier, this.color, pulse);

    // Tier badge
    if (this.tier > 1) {
      ctx.fillStyle = '#fd3';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.tier + (this.branch || ''), x + 10, y - 10);
    }

    ctx.restore();
  }
}

function drawArrowTower(ctx, x, y, tier, color, pulse) {
  const s = 14 + (tier - 1) * 2;
  // Base platform
  ctx.fillStyle = '#334';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // Tower body
  ctx.fillStyle = color;
  ctx.fillRect(x - 6, y - 8, 12, 16);
  // Bow
  ctx.strokeStyle = tier >= 2 ? '#ff8' : '#9cf';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + 6, y, 10, -Math.PI / 2.5, Math.PI / 2.5);
  ctx.stroke();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 7);
  ctx.lineTo(x + 6, y + 7);
  ctx.stroke();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}

function drawBombTower(ctx, x, y, tier, color, pulse) {
  const s = 14 + (tier - 1) * 2;
  ctx.fillStyle = '#443';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // Cannon barrel
  ctx.fillStyle = '#666';
  ctx.fillRect(x - 3, y - 12, 6, 18);
  // Cannon base
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + 4, 9, 0, Math.PI * 2);
  ctx.fill();
  // Fuse spark
  ctx.fillStyle = '#ff0';
  ctx.beginPath();
  ctx.arc(x, y - 12, 2 + pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}

function drawIceTower(ctx, x, y, tier, color, pulse) {
  const s = 14 + (tier - 1) * 2;
  ctx.fillStyle = '#0d2a2a';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // Snowflake: 3 crossing lines
  ctx.save();
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 5 + pulse;
  ctx.lineWidth = 2;
  const r = 9 + pulse * 0.3;
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI / 3) * i;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    ctx.lineTo(x - Math.cos(angle) * r, y - Math.sin(angle) * r);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Center crystal
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#1a4040';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}

function drawLaserTower(ctx, x, y, tier, color, pulse) {
  const s = 14 + (tier - 1) * 2;
  ctx.fillStyle = '#303';
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // Emitter crystal
  ctx.shadowColor = color;
  ctx.shadowBlur = 6 + pulse;
  ctx.fillStyle = color;
  // Hexagon
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    const r = 9 + pulse * 0.3;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  // Center dot
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#505';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}
