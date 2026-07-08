/**
 * Visual effect factory — creates and manages transient DOM effects.
 */
export class EffectManager {
    /** @param {HTMLElement} container */
    constructor(container) {
        this.container = container;
        this.activeEffects = [];
        this.maxEffects = 120;
    }

    _trimEffects() {
        while (this.activeEffects.length > this.maxEffects) {
            const old = this.activeEffects.shift();
            if (old) {
                clearTimeout(old.id);
                old.el?.remove();
            }
        }
    }

    /** @param {number} x @param {number} y @param {string} type */
    spawnHitEffect(x, y, type = 'physical') {
        const el = document.createElement('div');
        el.className = `hit-effect hit-effect-${type} particle-25d`;
        el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        this._trimEffects();
        const id = setTimeout(() => {
            el.remove();
            this.activeEffects = this.activeEffects.filter(e => e.el !== el);
        }, 600);
        this.activeEffects.push({ el, id });
        return el;
    }

    /** @param {number} x1 @param {number} y1 @param {number} x2 @param {number} y2 @param {boolean} [enhanced] */
    spawnLightningBolt(x1, y1, x2, y2, enhanced = false) {
        const el = document.createElement('div');
        el.className = enhanced ? 'lightning-bolt lightning-bolt-enhanced' : 'lightning-bolt';
        const dx = (x2 - x1) * window.innerWidth / 100;
        const dy = (y2 - y1) * window.innerHeight / 100;
        const length = Math.hypot(dx, dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        el.style.left = `${x1}vw`;
        el.style.top = `${y1}vh`;
        el.style.width = `${length}px`;
        el.style.transform = `rotate(${angle}deg)`;
        this.container.appendChild(el);
        this._trimEffects();
        const id = setTimeout(() => {
            el.remove();
            this.activeEffects = this.activeEffects.filter(e => e.el !== el);
        }, enhanced ? 450 : 300);
        this.activeEffects.push({ el, id });
        return el;
    }

    /** @param {HTMLElement} enemyEl */
    applyBurnAura(enemyEl) {
        if (!enemyEl.querySelector('.status-burn')) {
            const aura = document.createElement('div');
            aura.className = 'status-burn';
            enemyEl.appendChild(aura);
        }
    }

    removeBurnAura(enemyEl) {
        enemyEl.querySelector('.status-burn')?.remove();
    }

    /** @param {HTMLElement} enemyEl */
    applyFrostAura(enemyEl) {
        enemyEl.classList.add('status-frozen');
        const aura = enemyEl.querySelector('.status-frost') || document.createElement('div');
        aura.className = 'status-frost';
        if (!aura.parentElement) enemyEl.appendChild(aura);
    }

    removeFrostAura(enemyEl) {
        enemyEl.classList.remove('status-frozen');
        enemyEl.querySelector('.status-frost')?.remove();
    }

    /** @param {HTMLElement} playerEl */
    triggerAttackAnimation(playerEl) {
        const sprite = playerEl.querySelector('.player-sprite') || playerEl;
        sprite.classList.remove('player-attacking');
        void sprite.offsetWidth;
        sprite.classList.add('player-attacking');
        setTimeout(() => sprite.classList.remove('player-attacking'), 220);
    }

    /** @param {HTMLElement} enemyEl */
    triggerEnemyHitAnimation(enemyEl) {
        enemyEl.classList.remove('enemy-hit');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-hit');
    }

    /** @param {HTMLElement} enemyEl @param {number} [targetX] @param {number} [targetY] */
    triggerEnemyAttackAnimation(enemyEl, targetX, targetY) {
        const ex = parseFloat(enemyEl.style.left);
        const ey = parseFloat(enemyEl.style.top);
        const tx = targetX ?? ex;
        const ty = targetY ?? ey;
        const dx = (tx - ex) * window.innerWidth / 100;
        const dy = (ty - ey) * window.innerHeight / 100;
        const len = Math.hypot(dx, dy) || 1;
        const lungePx = 10;
        enemyEl.style.setProperty('--lunge-x', `${(dx / len) * lungePx}px`);
        enemyEl.style.setProperty('--lunge-y', `${(dy / len) * lungePx}px`);

        enemyEl.classList.remove('enemy-attacking');
        void enemyEl.offsetWidth;
        enemyEl.classList.add('enemy-attacking');
        setTimeout(() => enemyEl.classList.remove('enemy-attacking'), 360);
    }

    spawnDeathExplosion(x, y, type = 'normal') {
        const el = document.createElement('div');
        el.className = `death-explosion death-explosion-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        const id = setTimeout(() => el.remove(), 700);
        this.activeEffects.push({ el, id });
    }

    spawnMegaExplosion(x, y, type) {
        const el = document.createElement('div');
        el.className = `mega-explosion mega-explosion-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        const id = setTimeout(() => el.remove(), 900);
        this.activeEffects.push({ el, id });
    }

    spawnCastFlash(x, y, type) {
        const el = document.createElement('div');
        el.className = `cast-flash cast-flash-${type}`;
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        const id = setTimeout(() => el.remove(), 500);
        this.activeEffects.push({ el, id });
    }

    spawnDamageNumber(x, y, damage, isCrit, element = null) {
        const el = document.createElement('div');
        let className = 'damage-number';
        if (isCrit) className += ' damage-crit';
        if (element) className += ` damage-${element}`;
        el.className = className;
        el.textContent = String(damage);
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        this._trimEffects();

        requestAnimationFrame(() => {
            el.classList.add('damage-float');
        });

        const id = setTimeout(() => {
            el.remove();
            this.activeEffects = this.activeEffects.filter(e => e.el !== el);
        }, 1200);
        this.activeEffects.push({ el, id });
        return el;
    }

    /** @param {number} x @param {number} y */
    spawnLootBurst(x, y) {
        const el = document.createElement('div');
        el.className = 'world-loot-burst';
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        this.container.appendChild(el);
        const id = setTimeout(() => el.remove(), 700);
        this.activeEffects.push({ el, id });
    }

    /** @param {number} x @param {number} y @param {number} [count] */
    spawnExpOrbs(x, y, count = 3) {
        for (let i = 0; i < count; i++) {
            const el = document.createElement('div');
            el.className = 'world-exp-orb particle-25d';
            el.innerHTML = '<span class="particle-25d-face"></span><span class="particle-25d-shadow"></span>';
            const ox = (Math.random() - 0.5) * 4;
            el.style.left = `${x + ox}vw`;
            el.style.top = `${y}vh`;
            el.style.animationDelay = `${i * 0.08}s`;
            this.container.appendChild(el);
            const id = setTimeout(() => el.remove(), 800);
            this.activeEffects.push({ el, id });
        }
    }

    /** @param {HTMLElement} enemyEl */
    playEnemySpawn(enemyEl) {
        enemyEl.classList.add('enemy-spawn-in');
        setTimeout(() => enemyEl.classList.remove('enemy-spawn-in'), 500);
    }

    /** @param {HTMLElement} rangeEl */
    flashAttackRange(rangeEl) {
        if (!rangeEl) return;
        rangeEl.classList.remove('player-attacking-range');
        void rangeEl.offsetWidth;
        rangeEl.classList.add('player-attacking-range');
    }

    cleanup() {
        this.activeEffects.forEach(({ el, id }) => {
            clearTimeout(id);
            el.remove();
        });
        this.activeEffects = [];
    }
}
