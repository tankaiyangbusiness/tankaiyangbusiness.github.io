import { CHARACTERS } from '../config/characters.js';
import { SKILL_DEFINITIONS, SKILL_IDS, syncPlayerSkillLevels } from '../config/skills.js';
import { formatTime } from '../utils/math.js';
import { getCharacterPreviewHtml } from './entityModels.js';
import { getAchievementById, getCharacterRecord } from '../systems/metaProgress.js';
import {
    getCharacterPassive,
    formatPassiveTooltipHtml
} from '../config/characterPassives.js';

/** Reliable icons — emoji fallbacks for platforms missing glyphs. */
const SKILL_ICON_HTML = {
    illusion: '<span class="skill-icon-illusion" aria-hidden="true">IL</span>'
};

/**
 * Manages all UI overlays, HUD, and user interactions.
 */
export class UIManager {
    constructor() {
        this.els = {
            characterSelection: document.getElementById('character-selection'),
            characterList: document.getElementById('character-list'),
            gameContainer: document.getElementById('game-container'),
            gameUI: document.getElementById('game-ui'),
            playerAnchor: document.getElementById('player-anchor'),
            player: document.getElementById('player'),
            attackRange: document.getElementById('attack-range'),
            timer: document.getElementById('timer'),
            level: document.getElementById('level'),
            hpBarFill: document.getElementById('hp-bar-fill'),
            hpValue: document.getElementById('hp-value'),
            expBarFill: document.getElementById('exp-bar-fill'),
            expValue: document.getElementById('exp-value'),
            damage: document.getElementById('damage'),
            aoe: document.getElementById('aoe'),
            attackSpeed: document.getElementById('attack-speed'),
            hpRegen: document.getElementById('hp-regen'),
            defence: document.getElementById('defence'),
            evade: document.getElementById('evade'),
            critChance: document.getElementById('crit-chance'),
            critMultiplier: document.getElementById('crit-multiplier'),
            kills: document.getElementById('kill-count'),
            difficulty: document.getElementById('difficulty-level'),
            streak: document.getElementById('streak-count'),
            skillBar: document.getElementById('skill-bar'),
            pauseOverlay: document.getElementById('pause-overlay'),
            gameOverOverlay: document.getElementById('game-over-overlay'),
            gameOverStats: document.getElementById('game-over-stats'),
            achievementToast: document.getElementById('achievement-toast'),
            waveToast: document.getElementById('wave-toast'),
            gearLootToast: document.getElementById('gear-loot-toast'),
            characterPassiveBtn: document.getElementById('character-passive-btn'),
            characterPassiveIcon: document.getElementById('character-passive-icon'),
            characterPassiveTip: document.getElementById('character-passive-tip'),
            shieldRow: document.getElementById('shield-row'),
            shieldBarFill: document.getElementById('shield-bar-fill'),
            shieldValue: document.getElementById('shield-value'),
            buffBar: document.getElementById('buff-bar')
        };
        this._achievementTimer = null;
        this._waveTimer = null;
        this._gearLootTimer = null;
        this._lastStreak = 0;
        this._initPauseMenu();
    }

    _initPauseMenu() {
        this.els.pauseResume = document.getElementById('pause-resume');
        this.els.pauseRestart = document.getElementById('pause-restart');
        this.els.pauseCharacter = document.getElementById('pause-character');
    }

    /** @param {{ resume: () => void, restart: () => void, characterSelect: () => void }} handlers */
    bindPauseMenu(handlers) {
        this.els.pauseResume?.addEventListener('click', handlers.resume);
        this.els.pauseRestart?.addEventListener('click', handlers.restart);
        this.els.pauseCharacter?.addEventListener('click', handlers.characterSelect);
    }

    showCharacterSelection(onSelect, meta = null) {
        this.els.characterSelection.style.display = 'grid';
        this.els.gameOverOverlay.style.display = 'none';
        this.els.gameUI.style.display = 'none';
        this.els.gameContainer.style.display = 'none';

        this.els.characterList.innerHTML = '';
        CHARACTERS.forEach((char, index) => {
            const record = meta ? getCharacterRecord(meta, char.name) : null;
            const hasRecord = record && record.level > 0;
            const bestText = hasRecord
                ? `Best: Lv.${record.level} · Wave ${record.wave} · ${record.kills} kills · ${formatTime(record.time)}`
                : 'No record yet';

            const passive = getCharacterPassive(char.name);
            const passiveChip = passive
                ? `<span class="character-passive-chip" title="${passive.name}">
                        <span aria-hidden="true">${passive.icon}</span>
                        <span>${passive.name}</span>
                        <span class="chip-tip"><strong>${passive.name}</strong><br>${passive.description}</span>
                   </span>`
                : '';

            const card = document.createElement('button');
            card.className = 'character-card';
            card.dataset.character = char.name;
            const keyHint = index < 9 ? index + 1 : (index === 9 ? '0' : '-');
            card.innerHTML = `
                <span class="character-index">${keyHint}</span>
                ${getCharacterPreviewHtml(char.name)}
                <div class="character-card-body">
                    <h3>${char.name}</h3>
                    <span class="character-role">${char.role}</span>
                    <p class="character-desc">${char.description}</p>
                    ${passiveChip}
                    <div class="character-stats-line">
                        <span class="char-stat" title="Hit Points"><span class="char-stat-ico char-stat-hp">♥</span>${char.stats.maxHp}</span>
                        <span class="char-stat-sep">·</span>
                        <span class="char-stat" title="Damage"><span class="char-stat-ico char-stat-dmg">⚔</span>${char.stats.physicalDamage}</span>
                        <span class="char-stat-sep">·</span>
                        <span class="char-stat" title="Attack Range"><span class="char-stat-ico char-stat-aoe">◎</span>${char.stats.attackRange}</span>
                        <span class="char-stat-sep">·</span>
                        <span class="char-stat" title="Defence"><span class="char-stat-ico char-stat-def">🛡</span>${char.stats.armour}</span>
                    </div>
                    <span class="character-best-run ${hasRecord ? 'has-record' : ''}">${bestText}</span>
                </div>
            `;
            card.addEventListener('click', () => onSelect(char.name));
            this.els.characterList.appendChild(card);
        });
    }

    showGame() {
        this.els.characterSelection.style.display = 'none';
        this.els.gameUI.style.display = 'flex';
        this.els.gameContainer.style.display = 'flex';
    }

    updateAttackRange(range) {
        const size = range * 2;
        this.els.attackRange.style.width = `${size}px`;
        this.els.attackRange.style.height = `${size}px`;
    }

    updateStats(stats, skillList) {
        if (stats.hp > stats.maxHp) stats.hp = stats.maxHp;

        const fmt = (n, dec = 2) => Number(n).toFixed(dec).replace(/\.?0+$/, '');

        this.els.hpBarFill.style.width = `${(stats.hp / stats.maxHp) * 100}%`;
        this.els.hpValue.textContent = `${Math.max(0, Math.floor(stats.hp))} / ${stats.maxHp}`;
        this.els.expBarFill.style.width = `${(stats.exp / stats.expThreshold) * 100}%`;
        this.els.expValue.textContent = `${stats.exp} / ${stats.expThreshold}`;
        this.els.level.textContent = `Lv. ${stats.level}`;
        this.els.damage.textContent = String(stats.physicalDamage);
        this.els.aoe.textContent = String(stats.attackRange);
        this.els.attackSpeed.textContent = fmt(stats.attackSpeed);
        this.els.hpRegen.textContent = String(stats.hpRegen);
        this.els.defence.textContent = String(stats.armour);
        this.els.evade.textContent = `${fmt(stats.evade)}%`;
        this.els.critChance.textContent = `${fmt(stats.critChance)}%`;
        this.els.critMultiplier.textContent = `${stats.critMultiplier}%`;

        syncPlayerSkillLevels(stats.skills, skillList);
        this.updateSkillBar(stats.skills, skillList);
    }

    /** @param {import('../config/characterPassives.js').CharacterPassiveDef|null} passive */
    setCharacterPassive(passive) {
        const btn = this.els.characterPassiveBtn;
        const icon = this.els.characterPassiveIcon;
        const tip = this.els.characterPassiveTip;
        if (!btn || !icon || !tip) return;

        if (!passive) {
            btn.hidden = true;
            tip.innerHTML = '';
            btn.classList.remove('passive-tip-open');
            return;
        }

        btn.hidden = false;
        icon.textContent = passive.icon || '★';
        btn.setAttribute('aria-label', `Passive: ${passive.name}`);
        tip.innerHTML = formatPassiveTooltipHtml(passive);

        // Robust hover/focus (game-ui uses pointer-events tricks)
        if (!btn.dataset.passiveBound) {
            btn.dataset.passiveBound = '1';
            const open = () => btn.classList.add('passive-tip-open');
            const close = () => btn.classList.remove('passive-tip-open');
            btn.addEventListener('mouseenter', open);
            btn.addEventListener('mouseleave', close);
            btn.addEventListener('focus', open);
            btn.addEventListener('blur', close);
        }
    }

    clearCharacterPassive() {
        this.setCharacterPassive(null);
        if (this.els.shieldRow) this.els.shieldRow.hidden = true;
        if (this.els.shieldBarFill) this.els.shieldBarFill.style.width = '0%';
        if (this.els.shieldValue) this.els.shieldValue.textContent = '0 / 0';
    }

    /** @param {{ shield?: number, shieldMax?: number, frenzyActive?: boolean }} state */
    updatePassiveHud(state = {}) {
        const max = state.shieldMax || 0;
        const cur = Math.max(0, Math.floor(state.shield || 0));
        if (this.els.shieldRow) {
            this.els.shieldRow.hidden = max <= 0;
        }
        if (this.els.shieldBarFill && max > 0) {
            this.els.shieldBarFill.style.width = `${Math.min(100, (cur / max) * 100)}%`;
        }
        if (this.els.shieldValue && max > 0) {
            this.els.shieldValue.textContent = `${cur} / ${max}`;
        }
        this.els.characterPassiveBtn?.classList.toggle('passive-frenzy-active', Boolean(state.frenzyActive));
    }

    /**
     * PoE-style buff icons — depleting dark overlay from top as duration expires.
     * Updates in place so hover tooltips aren't destroyed every frame.
     * @param {Array<{ id: string, name: string, icon: string, description: string, remainingMs: number, remainingRatio: number }>} buffs
     */
    updateBuffBar(buffs = []) {
        const bar = this.els.buffBar;
        if (!bar) return;

        const nextIds = new Set(buffs.map(b => b.id));
        [...bar.querySelectorAll('.buff-icon')].forEach(el => {
            if (!nextIds.has(el.dataset.buffId)) el.remove();
        });

        buffs.forEach(b => {
            let el = bar.querySelector(`.buff-icon[data-buff-id="${b.id}"]`);
            const secs = Number.isFinite(b.remainingMs)
                ? (b.remainingMs / 1000).toFixed(1)
                : '∞';
            const cover = Math.max(0, Math.min(100, (1 - b.remainingRatio) * 100));

            if (!el) {
                el = document.createElement('div');
                el.className = 'buff-icon';
                el.dataset.buffId = b.id;
                el.innerHTML = `
                    <span class="buff-icon-timer"></span>
                    <span class="buff-icon-glyph"></span>
                    <div class="buff-icon-tip">
                        <strong class="buff-tip-name"></strong>
                        <p class="buff-tip-desc"></p>
                        <span class="buff-tip-time"></span>
                    </div>
                `;
                el.querySelector('.buff-icon-glyph').textContent = b.icon;
                el.querySelector('.buff-tip-name').textContent = b.name;
                el.querySelector('.buff-tip-desc').textContent = b.description;
                bar.appendChild(el);
            }

            const timer = el.querySelector('.buff-icon-timer');
            if (timer) timer.style.height = `${cover}%`;
            const tipTime = el.querySelector('.buff-tip-time');
            if (tipTime) tipTime.textContent = `${secs}s remaining`;
            const tipDesc = el.querySelector('.buff-tip-desc');
            if (tipDesc && tipDesc.textContent !== b.description) {
                tipDesc.textContent = b.description;
            }
        });
    }

    updateSkillBar(skills, skillList) {
        this.els.skillBar.innerHTML = SKILL_IDS.map(id => {
            const def = SKILL_DEFINITIONS[id];
            const level = skills[id] || 0;
            const maxed = skillList[id]?.level >= skillList[id]?.maxLevel;
            const levelBadge = level > 0
                ? `<span class="skill-level-badge">${level}</span>`
                : '';
            const iconHtml = SKILL_ICON_HTML[id] || `<span class="skill-icon">${def.icon}</span>`;
            return `
                <div class="skill-slot skill-${def.element} ${level > 0 ? 'skill-active' : 'skill-locked'} ${maxed ? 'skill-maxed' : ''}"
                     title="${def.name}: ${def.description}">
                    ${iconHtml}
                    ${levelBadge}
                </div>
            `;
        }).join('');
    }

    updateTimer(seconds) {
        this.els.timer.textContent = formatTime(seconds);
    }

    updateMeta(kills, difficulty, streak) {
        this.els.kills.textContent = String(kills);
        this.els.difficulty.textContent = String(difficulty);
        if (this.els.streak) {
            this.els.streak.textContent = streak > 1 ? `×${streak}` : '—';
            this.els.streak.classList.toggle('streak-active', streak > 4);
            if (streak > this._lastStreak && streak > 1) {
                this.els.streak.classList.remove('kill-streak-pop');
                void this.els.streak.offsetWidth;
                this.els.streak.classList.add('kill-streak-pop');
            }
            this._lastStreak = streak;
        }
    }

    showPause(show) {
        this.els.pauseOverlay.style.display = show ? 'flex' : 'none';
        this.els.gameContainer.classList.toggle('game-paused', show);
    }

    showGameOver(stats, elapsedSeconds, kills, wave) {
        this.els.gameOverStats.innerHTML = `
            <p>Survived: <strong>${formatTime(elapsedSeconds)}</strong></p>
            <p>Level reached: <strong>${stats.level}</strong></p>
            <p>Wave reached: <strong>${wave}</strong></p>
            <p>Enemies defeated: <strong>${kills}</strong></p>
        `;
        this.els.gameOverOverlay.style.display = 'flex';
    }

    hideGameOver() {
        this.els.gameOverOverlay.style.display = 'none';
    }

    getCharacterButtons() {
        return this.els.characterList.querySelectorAll('.character-card');
    }

    getPlayerPosition() {
        const anchor = this.els.playerAnchor;
        return {
            x: parseFloat(anchor?.style.left) || 50,
            y: parseFloat(anchor?.style.top) || 50
        };
    }

    /** @param {string} achievementId */
    showAchievementUnlock(achievementId) {
        const def = getAchievementById(achievementId);
        if (!def || !this.els.achievementToast) return;
        this.els.achievementToast.innerHTML = `🏆 <strong>${def.title}</strong> — ${def.description}`;
        this.els.achievementToast.classList.add('toast-visible');
        clearTimeout(this._achievementTimer);
        this._achievementTimer = setTimeout(() => {
            this.els.achievementToast.classList.remove('toast-visible');
        }, 3200);
    }

    /** @param {number} wave */
    showWaveAnnouncement(wave) {
        if (!this.els.waveToast || wave <= 0) return;
        this.els.waveToast.textContent = `Wave ${wave} — Difficulty rising!`;
        this.els.waveToast.classList.add('toast-visible');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible');
        }, 2200);
    }

    showTreasureHint() {
        if (!this.els.waveToast) return;
        this.els.waveToast.textContent = '✨ Treasure chest appeared!';
        this.els.waveToast.classList.add('toast-visible');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible');
        }, 2800);
    }

    /** Brief HUD flash when HP or EXP changes. @param {'hp'|'exp'} type */
    flashHudBar(type) {
        const panel = this.els.gameUI?.querySelector('.stats-panel');
        if (!panel) return;
        const cls = type === 'hp' ? 'hud-flash-hp' : 'hud-flash-exp';
        panel.classList.remove('hud-flash-hp', 'hud-flash-exp');
        void panel.offsetWidth;
        panel.classList.add(cls);
        setTimeout(() => panel.classList.remove(cls), 500);
    }

    /** @param {string} itemName @param {string} rarityClass */
    showGearLoot(itemName, rarityClass) {
        if (!this.els.gearLootToast) return;
        this.els.gearLootToast.textContent = `Loot: ${itemName}`;
        this.els.gearLootToast.className = `gear-loot-toast toast-visible ${rarityClass}`;
        clearTimeout(this._gearLootTimer);
        this._gearLootTimer = setTimeout(() => {
            this.els.gearLootToast.classList.remove('toast-visible');
        }, 2200);
    }
}
