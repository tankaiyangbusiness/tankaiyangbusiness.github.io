import { CHARACTERS } from '../config/characters.js';
import { SKILL_DEFINITIONS, SKILL_IDS, syncPlayerSkillLevels, formatSkillTooltipHtml } from '../config/skills.js';
import { formatTime } from '../utils/math.js';
import { CharacterSelectTooltips } from './characterSelectTooltips.js';
import { buildCharacterCard } from './characterSelectCard.js';
import { getAchievementById } from '../systems/metaProgress.js';
import { ACHIEVEMENTS, getAchievementTooltipText } from '../config/achievements.js';
import { FINAL_VICTORY_WAVE, MIDPOINT_VICTORY_WAVE, MINI_BOSS_WAVES } from '../config/milestoneBosses.js';
import { computeTooltipPlacement } from '../utils/tooltipClamp.js';
import { formatPassiveTooltipHtml } from '../config/characterPassives.js';
import { clampPlayerHp } from '../systems/playerVitality.js';

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
            buffBar: document.getElementById('buff-bar'),
            achievementsOverlay: document.getElementById('achievements-overlay'),
            achievementsGrid: document.getElementById('achievements-grid'),
            achievementsProgress: document.getElementById('achievements-progress'),
            achievementsClose: document.getElementById('achievements-close'),
            treasurePing: null
        };
        this._achievementTimer = null;
        this._waveTimer = null;
        this._gearLootTimer = null;
        this._treasurePingTimer = null;
        this._lastStreak = 0;
        this.characterSelectTooltips = new CharacterSelectTooltips();
        this._initPauseMenu();
    }

    _initPauseMenu() {
        this.els.pauseResume = document.getElementById('pause-resume');
        this.els.pauseRestart = document.getElementById('pause-restart');
        this.els.pauseCharacter = document.getElementById('pause-character');
        this.els.pauseAchievements = document.getElementById('pause-achievements');
        this.els.audioMusicSliderChar = document.getElementById('audio-music-slider-char');
        this.els.audioMusicSliderPause = document.getElementById('audio-music-slider-pause');
        this.els.audioSfxSliderChar = document.getElementById('audio-sfx-slider-char');
        this.els.audioSfxSliderPause = document.getElementById('audio-sfx-slider-pause');
        this.els.audioMusicValueChar = document.getElementById('audio-music-value-char');
        this.els.audioMusicValuePause = document.getElementById('audio-music-value-pause');
        this.els.audioSfxValueChar = document.getElementById('audio-sfx-value-char');
        this.els.audioSfxValuePause = document.getElementById('audio-sfx-value-pause');
        this.els.achievementsClose?.addEventListener('click', () => this.closeAchievementsPanel());
    }

    /**
     * @param {{
     *   resume: () => void,
     *   restart: () => void,
     *   characterSelect: () => void,
     *   achievements?: () => void
     * }} handlers
     */
    bindPauseMenu(handlers) {
        this.els.pauseResume?.addEventListener('click', handlers.resume);
        this.els.pauseRestart?.addEventListener('click', handlers.restart);
        this.els.pauseCharacter?.addEventListener('click', handlers.characterSelect);
        this.els.pauseAchievements?.addEventListener('click', () => handlers.achievements?.());
    }

    /**
     * Renders the full achievement grid (locked + unlocked) with hover tips.
     * @param {{ unlockedAchievements?: string[] }} meta
     */
    openAchievementsPanel(meta) {
        const unlocked = new Set(meta?.unlockedAchievements || []);
        const grid = this.els.achievementsGrid;
        const overlay = this.els.achievementsOverlay;
        if (!grid || !overlay) return;

        const done = unlocked.size;
        const total = ACHIEVEMENTS.length;
        if (this.els.achievementsProgress) {
            this.els.achievementsProgress.textContent = `${done} / ${total} completed`;
        }

        grid.innerHTML = ACHIEVEMENTS.map(def => {
            const isOn = unlocked.has(def.id);
            const tip = getAchievementTooltipText(def);
            const safeTip = tip.replace(/"/g, '&quot;');
            return `
                <button type="button" class="achievement-icon-btn ${isOn ? 'achievement-unlocked' : 'achievement-locked'}"
                    role="listitem"
                    data-id="${def.id}"
                    title="${safeTip}"
                    aria-label="${def.title}: ${safeTip}">
                    <span class="achievement-icon-emoji" aria-hidden="true">${def.icon || '🏅'}</span>
                    <span class="achievement-icon-title">${def.title}</span>
                    <span class="achievement-hover-tip">${tip}</span>
                </button>
            `;
        }).join('');

        this._bindAchievementTooltipLayout(grid);

        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
    }

    /**
     * Clamp achievement hover tips inside the panel — flip above at bottom rows, shift at sides.
     * @param {HTMLElement} grid
     */
    _bindAchievementTooltipLayout(grid) {
        if (!grid) return;

        const panel = grid.closest('.achievements-panel');

        const resetTip = (tip) => {
            tip.classList.remove('achievement-hover-tip--above');
            tip.style.transform = 'translateX(-50%)';
            tip.style.left = '50%';
        };

        const positionTip = (btn) => {
            const tip = btn.querySelector('.achievement-hover-tip');
            if (!tip) return;

            resetTip(tip);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const bounds = (panel || grid).getBoundingClientRect();
                    let tipRect = tip.getBoundingClientRect();
                    let { shiftX, placement } = computeTooltipPlacement(tipRect, bounds, 10);

                    if (placement === 'above') {
                        tip.classList.add('achievement-hover-tip--above');
                        tipRect = tip.getBoundingClientRect();
                        const adjusted = computeTooltipPlacement(tipRect, bounds, 10);
                        shiftX = adjusted.shiftX;
                    }

                    if (shiftX !== 0) {
                        tip.style.transform = `translateX(calc(-50% + ${shiftX}px))`;
                    }
                });
            });
        };

        grid.querySelectorAll('.achievement-icon-btn').forEach(btn => {
            btn.addEventListener('mouseenter', () => positionTip(btn));
            btn.addEventListener('focus', () => positionTip(btn));
            btn.addEventListener('mouseleave', () => {
                const tip = btn.querySelector('.achievement-hover-tip');
                if (tip) resetTip(tip);
            });
            btn.addEventListener('blur', () => {
                const tip = btn.querySelector('.achievement-hover-tip');
                if (tip) resetTip(tip);
            });
        });
    }

    closeAchievementsPanel() {
        const overlay = this.els.achievementsOverlay;
        if (!overlay) return;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
    }

    /** @param {import('../systems/audioManager.js').AudioManager} audio */
    bindAudioControls(audio) {
        const sync = () => this.syncAudioVolumeUi(audio);

        const bindSlider = (slider, setter) => {
            if (!slider) return;
            const onInput = () => {
                audio.unlock?.();
                setter(Number(slider.value));
                sync();
            };
            slider.addEventListener('input', onInput);
            slider.addEventListener('change', () => {
                audio.unlock?.();
                audio.playSfx?.('ui');
            });
        };

        bindSlider(this.els.audioMusicSliderChar, v => audio.setBgmVolume(v));
        bindSlider(this.els.audioMusicSliderPause, v => audio.setBgmVolume(v));
        bindSlider(this.els.audioSfxSliderChar, v => audio.setSfxVolume(v));
        bindSlider(this.els.audioSfxSliderPause, v => audio.setSfxVolume(v));
        sync();
    }

    /** @param {import('../systems/audioManager.js').AudioManager} audio */
    syncAudioVolumeUi(audio) {
        const bgm = audio.getBgmVolume();
        const sfx = audio.getSfxVolume();
        const apply = (slider, label, value) => {
            if (slider) {
                slider.value = String(value);
                slider.setAttribute('aria-valuenow', String(value));
            }
            if (label) label.textContent = `${value}%`;
        };
        apply(this.els.audioMusicSliderChar, this.els.audioMusicValueChar, bgm);
        apply(this.els.audioMusicSliderPause, this.els.audioMusicValuePause, bgm);
        apply(this.els.audioSfxSliderChar, this.els.audioSfxValueChar, sfx);
        apply(this.els.audioSfxSliderPause, this.els.audioSfxValuePause, sfx);
    }

    /** @deprecated Use syncAudioVolumeUi */
    syncAudioToggleLabels(audio) {
        this.syncAudioVolumeUi(audio);
    }

    showCharacterSelection(onSelect, meta = null) {
        this.els.characterSelection.style.display = 'grid';
        this.els.gameOverOverlay.style.display = 'none';
        this.els.gameUI.style.display = 'none';
        this.els.gameContainer.style.display = 'none';

        this.els.characterList.innerHTML = '';
        CHARACTERS.forEach((char, index) => {
            this.els.characterList.appendChild(buildCharacterCard(char, index, meta, onSelect));
        });
        this.characterSelectTooltips.bind(this.els.characterList);
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
        clampPlayerHp(stats);

        const fmt = (n, dec = 2) => Number(n).toFixed(dec).replace(/\.?0+$/, '');
        const maxHp = Math.max(1, stats.maxHp || 1);
        const displayHp = Math.max(0, Math.floor(stats.hp));
        const hpPct = Math.min(100, Math.max(0, (displayHp / maxHp) * 100));

        this.els.hpBarFill.style.width = `${hpPct}%`;
        this.els.hpValue.textContent = `${displayHp} / ${maxHp}`;
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

    /** Lightweight HP bar refresh after mid-tick damage (before end-of-tick regen). */
    syncPlayerHp(stats) {
        if (!stats || !this.els.hpBarFill || !this.els.hpValue) return;
        clampPlayerHp(stats);
        const maxHp = Math.max(1, stats.maxHp || 1);
        const displayHp = Math.max(0, Math.floor(stats.hp));
        const pct = Math.min(100, Math.max(0, (displayHp / maxHp) * 100));
        this.els.hpBarFill.style.width = `${pct}%`;
        this.els.hpValue.textContent = `${displayHp} / ${maxHp}`;
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
        const bar = this.els.skillBar;
        if (!bar) return;

        SKILL_IDS.forEach(id => {
            const def = SKILL_DEFINITIONS[id];
            const level = skills[id] || 0;
            const maxed = skillList[id]?.level >= skillList[id]?.maxLevel;
            let slot = bar.querySelector(`[data-skill-id="${id}"]`);

            if (!slot) {
                slot = document.createElement('div');
                slot.className = 'skill-slot';
                slot.dataset.skillId = id;
                slot.tabIndex = 0;
                slot.innerHTML = `
                    <span class="skill-slot-icon-wrap"></span>
                    <span class="skill-level-badge" hidden></span>
                    <div class="skill-slot-tip" role="tooltip"></div>
                `;
                const open = () => slot.classList.add('skill-tip-open');
                const close = () => slot.classList.remove('skill-tip-open');
                slot.addEventListener('mouseenter', open);
                slot.addEventListener('mouseleave', close);
                slot.addEventListener('focus', open);
                slot.addEventListener('blur', close);
                bar.appendChild(slot);
            }

            slot.className = `skill-slot skill-${def.element} ${level > 0 ? 'skill-active' : 'skill-locked'} ${maxed ? 'skill-maxed' : ''}`;

            const iconWrap = slot.querySelector('.skill-slot-icon-wrap');
            if (iconWrap) {
                iconWrap.innerHTML = SKILL_ICON_HTML[id] || `<span class="skill-icon">${def.icon}</span>`;
            }

            const badge = slot.querySelector('.skill-level-badge');
            if (badge) {
                if (level > 0) {
                    badge.hidden = false;
                    badge.textContent = String(level);
                } else {
                    badge.hidden = true;
                }
            }

            const tip = slot.querySelector('.skill-slot-tip');
            if (tip) tip.innerHTML = formatSkillTooltipHtml(def, level);
        });
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
        if (!show) this.closeAchievementsPanel();
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
        const icon = def.icon ? `${def.icon} ` : '🏆 ';
        this.els.achievementToast.innerHTML = `${icon}<strong>${def.title}</strong> — ${def.description}`;
        this.els.achievementToast.classList.add('toast-visible');
        clearTimeout(this._achievementTimer);
        this._achievementTimer = setTimeout(() => {
            this.els.achievementToast.classList.remove('toast-visible');
        }, 3200);
    }

    /** @param {number} wave */
    showWaveAnnouncement(wave) {
        if (!this.els.waveToast || wave <= 0) return;
        if (wave === FINAL_VICTORY_WAVE) {
            this.els.waveToast.textContent = `Wave ${wave} — The Final Boss approaches!`;
        } else if (wave === MIDPOINT_VICTORY_WAVE) {
            this.els.waveToast.textContent = `Wave ${wave} — Midpoint Boss approaches!`;
        } else if (MINI_BOSS_WAVES.includes(wave)) {
            this.els.waveToast.textContent = `Wave ${wave} — Mini Boss approaches!`;
        } else {
            this.els.waveToast.textContent = `Wave ${wave} — Difficulty rising!`;
        }
        this.els.waveToast.classList.remove('toast-victory', 'toast-boss-final');
        this.els.waveToast.classList.add('toast-visible');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible');
        }, 2200);
    }

    /** @param {number} wave Mini-boss waves 25 & 75 */
    showMiniBossIncoming(wave) {
        if (!this.els.waveToast) return;
        this.els.waveToast.textContent =
            `⚠️ Wave ${wave} MINI BOSS — 20× HP · Escorts incoming!`;
        this.els.waveToast.classList.remove('toast-victory');
        this.els.waveToast.classList.add('toast-visible', 'toast-boss-final');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible', 'toast-boss-final');
        }, 3600);
    }

    /** @param {number} wave */
    showMidpointVictoryBossIncoming(wave) {
        if (!this.els.waveToast) return;
        this.els.waveToast.textContent =
            `⚠️ Wave ${wave} MIDPOINT BOSS — 50× HP · Army incoming!`;
        this.els.waveToast.classList.remove('toast-victory');
        this.els.waveToast.classList.add('toast-visible', 'toast-boss-final');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible', 'toast-boss-final');
        }, 3800);
    }

    /** @param {number} wave */
    showFinalVictoryBossIncoming(wave) {
        if (!this.els.waveToast) return;
        this.els.waveToast.textContent =
            `⚠️ Wave ${wave} FINAL BOSS — 50× HP · 2× damage · Army incoming!`;
        this.els.waveToast.classList.remove('toast-victory');
        this.els.waveToast.classList.add('toast-visible', 'toast-boss-final');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible', 'toast-boss-final');
        }, 4200);
    }

    /** @param {string} characterName */
    showFinalVictoryCelebration(characterName) {
        if (!this.els.waveToast) return;
        this.els.waveToast.textContent =
            `🏆 VICTORY! ${characterName} defeated Wave ${FINAL_VICTORY_WAVE}! Campaign complete — keep fighting!`;
        this.els.waveToast.classList.remove('toast-boss-final');
        this.els.waveToast.classList.add('toast-visible', 'toast-victory');
        clearTimeout(this._waveTimer);
        this._waveTimer = setTimeout(() => {
            this.els.waveToast.classList.remove('toast-visible', 'toast-victory');
        }, 6500);
    }

    /** @param {number} [x] @param {number} [y] @param {number} [distVw] */
    showTreasureHint(x, y, distVw) {
        if (this.els.waveToast) {
            const rangeNote = Number.isFinite(distVw)
                ? ` (${Math.round(distVw)} units away)`
                : '';
            this.els.waveToast.textContent =
                `🎁 Treasure chest spawned${rangeNote}! Defeat the golden CHEST enemy — it walks toward you.`;
            this.els.waveToast.classList.add('toast-visible');
            clearTimeout(this._waveTimer);
            this._waveTimer = setTimeout(() => {
                this.els.waveToast.classList.remove('toast-visible');
            }, 4500);
        }

        // Screen ping at spawn location so the chest can't be missed
        if (Number.isFinite(x) && Number.isFinite(y) && this.els.gameContainer) {
            this.els.treasurePing?.remove();
            const ping = document.createElement('div');
            ping.className = 'treasure-screen-ping';
            ping.style.left = `${x}vw`;
            ping.style.top = `${y}vh`;
            ping.setAttribute('aria-hidden', 'true');
            this.els.gameContainer.appendChild(ping);
            this.els.treasurePing = ping;
            clearTimeout(this._treasurePingTimer);
            this._treasurePingTimer = setTimeout(() => {
                ping.remove();
                if (this.els.treasurePing === ping) this.els.treasurePing = null;
            }, 2800);
        }
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
