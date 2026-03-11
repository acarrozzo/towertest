class Enemy {
  constructor(type, levelIndex) {
    const base = ENEMY_STATS[type];
    const scale = HP_SCALE[levelIndex] || 1;

    this.type = type;
    this.hp = Math.round(base.hp * scale);
    this.maxHp = this.hp;
    this.speed = base.speed;
    this.reward = base.reward;
    this.color = base.color;
    this.size = base.size;
    this.armorResist = base.armorResist;

    // Path traversal
    this.pathIndex = 0;
    const start = WORLD_PATH[0];
    this.x = start.x;
    this.y = start.y;

    this.dead = false;
    this.reached = false; // reached the end

    // Visual
    this.flashTimer = 0;
    this.slowTimer = 0;
    this.slowFactor = 1;
  }

  update(dt) {
    if (this.dead || this.reached) return;

    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }

    const target = WORLD_PATH[this.pathIndex + 1];
    if (!target) {
      this.reached = true;
      return;
    }

    const speed = this.speed * this.slowFactor;
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = speed * (dt / 16);

    if (step >= dist) {
      this.x = target.x;
      this.y = target.y;
      this.pathIndex++;
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    if (this.flashTimer > 0) this.flashTimer -= dt;
  }

  takeDamage(amount, ignoreArmor = false) {
    let dmg = amount;
    if (!ignoreArmor && this.armorResist > 0) {
      dmg = amount * (1 - this.armorResist);
    }
    this.hp -= dmg;
    this.flashTimer = 80;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dead = true;
    }
  }

  applySlow(factor, duration) {
    this.slowFactor = factor;
    this.slowTimer = duration;
  }

  // Progress along path (0–1) for targeting priority
  get progress() {
    return this.pathIndex + (this.distToNext() / this.segLength());
  }

  distToNext() {
    const target = WORLD_PATH[this.pathIndex + 1];
    if (!target) return 0;
    return Math.hypot(target.x - this.x, target.y - this.y);
  }

  segLength() {
    const a = WORLD_PATH[this.pathIndex];
    const b = WORLD_PATH[this.pathIndex + 1];
    if (!a || !b) return 1;
    return Math.hypot(b.x - a.x, b.y - a.y) || 1;
  }

  draw(ctx) {
    if (this.dead) return;

    const flashing = this.flashTimer > 0;
    const x = Math.round(this.x);
    const y = Math.round(this.y);
    const s = this.size;

    if (this.type === 'boss') {
      drawBoss(ctx, x, y, s, this.color, flashing);
    } else if (this.type === 'armored') {
      drawArmored(ctx, x, y, s, this.color, flashing);
    } else if (this.type === 'fast') {
      drawFast(ctx, x, y, s, this.color, flashing);
    } else {
      drawBasic(ctx, x, y, s, this.color, flashing);
    }

    // HP bar
    const barW = s * 2.5;
    const barH = 3;
    const barX = x - barW / 2;
    const barY = y - s - 7;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const pct = this.hp / this.maxHp;
    ctx.fillStyle = pct > 0.5 ? '#4f4' : pct > 0.25 ? '#ff4' : '#f44';
    ctx.fillRect(barX, barY, barW * pct, barH);

    // Slow indicator
    if (this.slowTimer > 0) {
      ctx.strokeStyle = '#88f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x - s, y - s, s * 2, s * 2);
    }
  }
}

function drawBasic(ctx, x, y, s, color, flash) {
  ctx.fillStyle = flash ? '#fff' : color;
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
  // Eyes
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 4, y - 2, 2, 2);
  ctx.fillRect(x + 2, y - 2, 2, 2);
}

function drawFast(ctx, x, y, s, color, flash) {
  ctx.fillStyle = flash ? '#fff' : color;
  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawArmored(ctx, x, y, s, color, flash) {
  // Body
  ctx.fillStyle = flash ? '#fff' : color;
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  // Armor plates
  ctx.fillStyle = flash ? '#ddd' : '#667';
  ctx.fillRect(x - s, y - s, s * 2, 4);
  ctx.fillRect(x - s, y + s - 4, s * 2, 4);
  ctx.fillRect(x - s, y - s, 4, s * 2);
  ctx.fillRect(x + s - 4, y - s, 4, s * 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}

function drawBoss(ctx, x, y, s, color, flash) {
  ctx.fillStyle = flash ? '#fff' : color;
  // Outer glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillRect(x - s, y - s, s * 2, s * 2);
  ctx.shadowBlur = 0;
  // Horns
  ctx.fillStyle = flash ? '#fff' : '#a00';
  ctx.fillRect(x - s, y - s - 6, 6, 6);
  ctx.fillRect(x + s - 6, y - s - 6, 6, 6);
  // Eyes
  ctx.fillStyle = '#ff0';
  ctx.fillRect(x - 6, y - 4, 4, 4);
  ctx.fillRect(x + 2, y - 4, 4, 4);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - s, y - s, s * 2, s * 2);
}
