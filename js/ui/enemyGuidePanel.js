import { ENEMY_GUIDE_ENTRIES } from '../config/enemyGuide.js';

/**
 * Collapsible enemy-type hint panel (collapsed by default).
 */
export class EnemyGuidePanel {
    constructor() {
        this.root = document.getElementById('enemy-guide-panel');
        this.toggleBtn = document.getElementById('enemy-guide-toggle');
        this.body = document.getElementById('enemy-guide-body');
        this.expanded = false;

        if (!this.root) return;

        this._renderEntries();
        this.toggleBtn?.addEventListener('click', () => this.toggle());
    }

    _renderEntries() {
        if (!this.body) return;
        this.body.innerHTML = ENEMY_GUIDE_ENTRIES.map(entry => `
            <div class="enemy-guide-row" data-type="${entry.type}">
                <span class="enemy-guide-swatch" style="background:${entry.color}"></span>
                <div class="enemy-guide-text">
                    <div class="enemy-guide-title">
                        <strong style="color:${entry.color}">${entry.label}</strong>
                        <span class="enemy-guide-tag">${entry.tag}</span>
                    </div>
                    <p class="enemy-guide-desc">${entry.description}</p>
                </div>
            </div>
        `).join('');
    }

    toggle() {
        this.expanded = !this.expanded;
        this.root?.classList.toggle('expanded', this.expanded);
        if (this.toggleBtn) {
            this.toggleBtn.setAttribute('aria-expanded', String(this.expanded));
        }
    }

    collapse() {
        this.expanded = false;
        this.root?.classList.remove('expanded');
        this.toggleBtn?.setAttribute('aria-expanded', 'false');
    }
}
