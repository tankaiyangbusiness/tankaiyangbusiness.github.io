/**
 * Collapsible in-game upgrade panel — spend banked level-ups without pausing.
 */
export class UpgradePanel {
    /**
     * @param {(key: string) => void} onSelect
     * @param {(type: 'stat'|'skill'|'ability') => void} [onCategorySelect]
     * @param {() => void} [onToggle]
     */
    constructor(onSelect, onCategorySelect, onToggle) {
        this.onSelect = onSelect;
        this.onCategorySelect = onCategorySelect;
        this.onToggle = onToggle;
        this.expanded = true;
        this._view = 'categories';

        this.els = {
            panel: document.getElementById('upgrade-panel'),
            toggle: document.getElementById('upgrade-panel-toggle'),
            badge: document.getElementById('upgrade-panel-count'),
            body: document.getElementById('upgrade-panel-body'),
            title: document.getElementById('upgrade-panel-title'),
            queue: document.getElementById('upgrade-panel-queue'),
            wrapper: document.getElementById('upgrade-button-wrapper')
        };

        this.els.toggle?.addEventListener('click', () => this.toggle());
        this._applyExpandedClasses();
    }

    _applyExpandedClasses() {
        this.els.panel?.classList.toggle('upgrade-panel-expanded', this.expanded);
        this.els.panel?.classList.toggle('upgrade-panel-collapsed', !this.expanded);
        this.els.toggle?.setAttribute('aria-expanded', String(this.expanded));
    }

    toggle(forceExpanded) {
        if (typeof forceExpanded === 'boolean') {
            this.expanded = forceExpanded;
        } else {
            this.expanded = !this.expanded;
        }
        this._applyExpandedClasses();
        this.onToggle?.();
    }

    isExpanded() {
        return this.expanded;
    }

    /** @param {number} count */
    updateBadge(count) {
        if (!this.els.badge) return;
        this.els.badge.textContent = String(count);
        this.els.badge.classList.toggle('upgrade-panel-badge-hidden', count <= 0);
        this.els.panel?.classList.toggle('upgrade-panel-has-pending', count > 0);
    }

    /** @param {{ stat: number, skill: number, ability: number }} counts */
    updateQueueSummary(counts, total) {
        if (!this.els.queue) return;
        if (total <= 0) {
            this.els.queue.textContent = 'No upgrades banked — keep fighting!';
            return;
        }

        const parts = [];
        if (counts.stat) parts.push(`${counts.stat} stat`);
        if (counts.skill) parts.push(`${counts.skill} skill`);
        if (counts.ability) parts.push(`${counts.ability} ability`);

        this.els.queue.textContent = `${total} banked (${parts.join(', ')})`;
    }

    /**
     * Step 1: pick which upgrade type to spend.
     * @param {{ stat: number, skill: number, ability: number }} counts
     */
    renderCategoryMenu(counts) {
        if (!this.els.wrapper) return;
        this._view = 'categories';

        if (this.els.title) {
            this.els.title.textContent = 'Spend Level-Up';
        }

        const categories = [
            { type: 'stat', label: 'Stat Upgrade', icon: '◆', css: 'upgrade-cat-stat', count: counts.stat },
            { type: 'skill', label: 'Active Skill', icon: '✦', css: 'upgrade-cat-skill', count: counts.skill },
            { type: 'ability', label: 'Passive Ability', icon: '★', css: 'upgrade-cat-ability', count: counts.ability }
        ].filter(c => c.count > 0);

        this.els.wrapper.innerHTML = '<div class="upgrade-category-grid"></div>';
        const grid = this.els.wrapper.querySelector('.upgrade-category-grid');

        if (!grid || categories.length === 0) {
            this.showEmptyState();
            return;
        }

        categories.forEach((cat, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `upgrade-category-btn choice-card ${cat.css}`;
            btn.innerHTML = `
                <span class="upgrade-choice-key">${index + 1}</span>
                <span class="upgrade-cat-icon">${cat.icon}</span>
                <span class="upgrade-cat-label">${cat.label}</span>
                <span class="upgrade-cat-count">${cat.count}</span>
            `;
            btn.addEventListener('click', () => this.onCategorySelect?.(cat.type));
            grid.appendChild(btn);
        });
    }

    /**
     * Step 2: pick an option for the chosen type.
     * @param {'stat' | 'skill' | 'ability'} choiceType
     * @param {Array<{ key: string, label: string, level: number }>} options
     * @param {() => void} [onBack]
     * @param {number} [remaining]
     */
    renderChoices(choiceType, options, onBack, remaining = 0) {
        if (!this.els.wrapper) return;
        this._view = 'choices';

        const titles = {
            stat: remaining > 0 ? `Pick a Stat (${remaining} left)` : 'Pick a Stat',
            ability: remaining > 0 ? `Pick a Passive (${remaining} left)` : 'Pick a Passive Ability',
            skill: remaining > 0 ? `Pick a Skill (${remaining} left)` : 'Pick an Active Skill'
        };
        if (this.els.title) {
            this.els.title.textContent = titles[choiceType] || 'Choose Upgrade';
        }

        this.els.wrapper.innerHTML = '';

        if (onBack) {
            const back = document.createElement('button');
            back.type = 'button';
            back.className = 'upgrade-back-btn';
            back.textContent = '← Back to categories';
            back.addEventListener('click', onBack);
            this.els.wrapper.appendChild(back);
        }

        if (options.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'upgrade-empty';
            empty.textContent = 'All options maxed for this type.';
            this.els.wrapper.appendChild(empty);
            return;
        }

        const choiceClass = `upgrade-choice-${choiceType}`;

        options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `upgrade-choice-btn choice-card ${choiceClass}`;
            btn.innerHTML = `
                <span class="upgrade-choice-key">${index + 1}</span>
                <span class="upgrade-choice-text">${opt.label}</span>
                <span class="upgrade-choice-level">${opt.level > 0 ? `Lv.${opt.level} → ${opt.level + 1}` : 'Unlock'}</span>
            `;
            btn.addEventListener('click', () => this.onSelect(opt.key));
            this.els.wrapper.appendChild(btn);
        });
    }

    showEmptyState() {
        this._view = 'empty';
        if (this.els.title) this.els.title.textContent = 'Upgrades';
        if (this.els.wrapper) {
            this.els.wrapper.innerHTML = '<p class="upgrade-empty">No pending upgrades.</p>';
        }
    }

    getChoiceButtons() {
        return this.els.wrapper?.querySelectorAll('.choice-card') ?? [];
    }

    getCategoryButtons() {
        if (this._view !== 'categories') return [];
        return this.els.wrapper?.querySelectorAll('.upgrade-category-btn') ?? [];
    }

    getView() {
        return this._view;
    }

    reset() {
        this.expanded = true;
        this._view = 'categories';
        this._applyExpandedClasses();
        this.els.panel?.classList.remove('upgrade-panel-has-pending');
        this.updateBadge(0);
        this.showEmptyState();
        if (this.els.queue) this.els.queue.textContent = '';
    }
}
