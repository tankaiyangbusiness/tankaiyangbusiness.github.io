import { SKILL_IDS, SKILL_DEFINITIONS, getSkillDisplayRadius } from '../config/skills.js';

/**
 * Renders persistent skill range rings centered on the player anchor.
 * Rings are NOT children of the animated sprite — they stay fixed.
 */
export class SkillRangeDisplay {
    /** @param {HTMLElement} container @param {HTMLElement} layer */
    constructor(container, layer) {
        this.container = container;
        this.layer = layer;
        this.rings = {};
    }

    /** @param {object} skillList @param {number} [playerAttackRange] */
    update(skillList, playerAttackRange = 0) {
        if (!this.layer) return;

        SKILL_IDS.forEach(id => {
            const level = skillList[id]?.level || 0;
            const def = SKILL_DEFINITIONS[id];
            let ring = this.rings[id];

            if (level <= 0) {
                ring?.remove();
                delete this.rings[id];
                return;
            }

            const diameterPx = getSkillDisplayRadius(id, level, playerAttackRange) * 2;

            if (!ring) {
                ring = document.createElement('div');
                ring.className = `skill-range-ring skill-range-${def.element}`;
                ring.dataset.skill = id;
                const label = document.createElement('span');
                label.className = 'skill-range-label';
                label.textContent = def.name;
                ring.appendChild(label);
                this.layer.appendChild(ring);
                this.rings[id] = ring;
            }

            ring.style.width = `${diameterPx}px`;
            ring.style.height = `${diameterPx}px`;
        });
    }

    flash(skillId) {
        const ring = this.rings[skillId];
        if (!ring) return;
        ring.classList.remove('skill-range-cast');
        void ring.offsetWidth;
        ring.classList.add('skill-range-cast');
    }

    showImpactArea(px, py, radiusPx, element, durationMs = 700) {
        const el = document.createElement('div');
        el.className = `skill-impact-area skill-impact-${element}`;
        el.style.left = `${px}vw`;
        el.style.top = `${py}vh`;
        el.style.width = `${radiusPx * 2}px`;
        el.style.height = `${radiusPx * 2}px`;
        this.container.appendChild(el);
        requestAnimationFrame(() => el.classList.add('skill-impact-active'));
        setTimeout(() => el.remove(), durationMs);
    }

    clear() {
        Object.values(this.rings).forEach(r => r.remove());
        this.rings = {};
        this.layer?.replaceChildren();
    }
}
