class Projectile {
  constructor(type, x, y, target, damage, opts = {}) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.done = false;
    this.opts = opts; // splashRadius, ignoreArmor, slow, etc.

    // Arrow / bomb / ice: move toward target
    this.speed = type === 'bomb' ? 3.5 : type === 'ice' ? 5 : 7;
    this.color = type === 'arrow' ? '#7df' : type === 'bomb' ? '#f84' : type === 'ice' ? '#9ef' : '#f4f';

    // Laser: instant line that persists briefly
    if (type === 'laser') {
      this.tx = target.x;
      this.ty = target.y;
      this.life = 80; // ms
    }

    // Explosion animation
    this.exploding = false;
    this.explodeTimer = 0;
    this.explodeRadius = 0;
    this.maxExplodeRadius = opts.splashRadius || 0;
  }

  update(dt, enemies) {
    if (this.done) return;

    if (this.type === 'laser') {
      this.life -= dt;
      if (this.life <= 0) this.done = true;
      return;
    }

    if (this.exploding) {
      this.explodeTimer += dt;
      this.explodeRadius = (this.explodeTimer / 200) * this.maxExplodeRadius;
      if (this.explodeTimer >= 200) this.done = true;
      return;
    }

    if (!this.target || this.target.dead || this.target.reached) {
      this.done = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * (dt / 16);

    if (step >= dist) {
      // Hit
      this.x = this.target.x;
      this.y = this.target.y;
      this.onHit(enemies);
    } else {
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }
  }

  onHit(enemies) {
    if (this.type === 'bomb' || this.opts.splashRadius) {
      // Splash damage
      const radius = this.opts.splashRadius || 40;
      for (const e of enemies) {
        if (e.dead || e.reached) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= radius) {
          e.takeDamage(this.damage, this.opts.ignoreArmor || false);
          if (this.opts.slowFactor) e.applySlow(this.opts.slowFactor, this.opts.slowDuration || 1200);
        }
      }
      this.exploding = true;
    } else {
      // Single target
      if (!this.target.dead && !this.target.reached) {
        this.target.takeDamage(this.damage, this.opts.ignoreArmor || false);
        if (this.opts.slow) this.target.applySlow(0.4, 1500);
        if (this.opts.slowFactor) this.target.applySlow(this.opts.slowFactor, this.opts.slowDuration || 1200);
      }
      this.done = true;
    }
  }

  draw(ctx) {
    if (this.done) return;

    if (this.type === 'laser') {
      const alpha = Math.max(0, this.life / 80);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.opts.color || '#f4f';
      ctx.lineWidth = 3;
      ctx.shadowColor = this.opts.color || '#f4f';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.tx, this.ty);
      ctx.stroke();
      // Inner bright core
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
      return;
    }

    if (this.exploding) {
      const alpha = 1 - (this.explodeTimer / 200);
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = this.type === 'ice' ? '#9ef' : '#f84';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = this.type === 'ice' ? '#aff' : '#ff4';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      return;
    }

    ctx.save();
    if (this.type === 'arrow') {
      ctx.fillStyle = '#7df';
      ctx.shadowColor = '#7df';
      ctx.shadowBlur = 4;
      const dx = this.target ? this.target.x - this.x : 1;
      const dy = this.target ? this.target.y - this.y : 0;
      const angle = Math.atan2(dy, dx);
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.fillRect(-6, -1.5, 10, 3);
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-2, -4);
      ctx.lineTo(-2, 4);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'bomb') {
      ctx.fillStyle = '#f84';
      ctx.shadowColor = '#f84';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'ice') {
      ctx.fillStyle = '#9ef';
      ctx.shadowColor = '#aff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x - 1, this.y - 1, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
