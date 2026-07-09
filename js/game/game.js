import { CHARACTERS } from '../config/characters.js';
import { usesMeleeBasicAttack } from '../config/combatStyles.js';
import { buildEnemyStats, pickEnemyType, ENEMY_TYPES } from '../config/enemies.js';
import { getEnemyTypeColor } from '../config/enemyColors.js';
import { syncPlayerSkillLevels } from '../config/skills.js';
import { GameState } from './gameState.js';
import { UIManager } from '../ui/manager.js';
import { EffectManager } from '../systems/effects.js';
import { SkillExecutor } from '../systems/skillExecutor.js';
import {
    bankExpLevelUps,
    consumePendingUpgradeByType,
    buildStatUpgradeOptions,
    buildStatUpgradeOptionsFromKeys,
    rollStatUpgradeKeys,
    buildSkillUpgradeOptions,
    buildSkillUpgradeOptionsFromKeys,
    rollSkillUpgradeKeys,
    buildAbilityUpgradeOptions,
    summarizeUpgradeQueue,
    formatAbilityDescription
} from '../systems/levelUp.js';
import {
    calculatePlayerDamage,
    calculatePlayerIncomingDamage,
    calculateEnemyHitDamageForReflect,
    applyReflectDamageToAttacker,
    calculateLifesteal,
    applyStatUpgrade,
    rollEnemyEvade
} from '../systems/combat.js';
import { getAbilityPercent } from '../config/abilityCombatScaling.js';
import { distanceVw, rollChance } from '../utils/math.js';
import { deepClone } from '../utils/clone.js';
import { applyPlayerModel, resetPlayerModel, buildEnemyModelHtml, buildTreasureChestModelHtml } from '../ui/entityModels.js';
import { flashPlayerSprite, shakePlayerAnchor } from '../ui/playerVisuals.js';
import { SkillRangeDisplay } from '../systems/skillRangeDisplay.js';
import { PoisonPoolManager } from '../systems/poisonPools.js';
import { UpgradePanel } from '../ui/upgradePanel.js';
import { BALANCE, getSpawnIntervalMs } from '../config/balance.js';
import {
    applyPlayerDamage,
    clampPlayerHp,
    resolvePlayerDefeat,
    tickPlayerRegen
} from '../systems/playerVitality.js';
import { EXP_CONFIG, calculateExpFromKill } from '../config/expProgression.js';
import { getWaveNumber, getDifficultyIndex } from '../config/waveProgression.js';
import { KillStreakTracker } from '../systems/killStreak.js';
import { TreasureEventManager } from '../systems/treasureEvents.js';
import { GearInventory } from '../systems/gearInventory.js';
import { GearPanel } from '../ui/gearPanel.js';
import { GearLootFilter } from '../systems/gearLootFilter.js';
import { EnemyPopulationManager } from '../systems/enemyPopulation.js';
import { IllusionCloneManager } from '../systems/illusionClone.js';
import { CharacterPassiveManager } from '../systems/characterPassives.js';
import { BuffTracker } from '../systems/buffTracker.js';
import { handleEnemyDeathEffects } from '../systems/enemyDeathEffects.js';
import {
    getSwarmGroupPositions,
    rollSwarmGroupSize,
    getEdgeSpawnAnchor
} from '../systems/enemySpawn.js';
import { isBossWave, rollBossWaveSwarmCount, BOSS_WAVE_HP_MULT } from '../config/bossWaves.js';
import {
    isFinalVictoryWave,
    isMidpointVictoryWave,
    isMilestoneBossWave,
    applyMilestoneBossCombatScaling,
    rollBossArmyCount,
    findLivingMilestoneBoss,
    getMidpointReinforcementIntervalMs,
    getMilestoneReinforcementIntervalMs,
    rollMidpointReinforcementSwarmSize,
    rollMilestoneReinforcementSwarmSize,
    MILESTONE_BOSS_SPAWN_OPTS,
    MILESTONE_BOSS_WORLD_LABELS,
    BOSS_HUD_LABELS,
    FINAL_VICTORY_WAVE,
    MIDPOINT_VICTORY_WAVE,
    milestoneBossGuaranteesUniqueLoot
} from '../config/milestoneBosses.js';
import { EnemyProjectileManager } from '../systems/enemyProjectiles.js';
import { EnemyGuidePanel } from '../ui/enemyGuidePanel.js';
import { BossHud } from '../ui/bossHud.js';
import {
    applyRuntimeEnemyScaling,
    getFinalVictoryReinforcementIntervalMs,
    rollFinalVictoryReinforcementSwarmSize
} from '../config/enemyScaling.js';
import { shouldDropGear } from '../config/gearRarity.js';
import { rollLootDrop, computeDropIlvl, rollGuaranteedUniqueDrop } from '../systems/gearGenerator.js';
import { RARITY_CONFIG } from '../config/gearRarity.js';
import {
    loadMetaProgress,
    evaluateAchievements,
    updateCharacterRecord,
    markCharacterVictory,
    recordCampaignVictoryIfPending
} from '../systems/metaProgress.js';
import { buildAchievementContext, reconcileMetaAchievements } from '../systems/achievementContext.js';
import { AudioManager } from '../systems/audioManager.js';
import { MobileHudController } from '../ui/mobileHud.js';
import {
    advanceGameClock,
    getLastSimDeltaMs,
    getElapsedSeconds,
    getSimulatedMs,
    getProjectedSimMs,
    initGameClock,
    scaleMovementSpeed,
    scaledRealTimeoutMs,
    syncClockAfterResume
} from '../systems/gameClock.js';
import { GameSpeedControls } from '../ui/gameSpeedControls.js';
import { bindExclusiveGearUpgradePanels, collapseSidePanelsOnPause } from '../ui/panelCoordinator.js';
import { StatsPanelController } from '../ui/statsPanelController.js';

export class Game {
    constructor() {
        this.state = new GameState();
        this.ui = new UIManager();
        this.audio = new AudioManager();
        this.mobileHud = new MobileHudController();
        this.effects = null;
        this.meta = loadMetaProgress();
        reconcileMetaAchievements(this.meta);
        this.killStreak = new KillStreakTracker();
        this._treasureGuideArrow = null;
        this._treasureGuideRing = null;
        this._pausedByTabHidden = false;
        this._bindEvents();
        this.ui.bindPauseMenu({
            resume: () => this.resumeGame(),
            restart: () => this.restartRun(),
            characterSelect: () => this.quitToCharacterSelect(),
            achievements: () => this.ui.openAchievementsPanel(this.meta)
        });
        this.mobileHud.bindMenuButton(() => this.handleMenuAction());
        this.ui.bindAudioControls(this.audio);
        this.ui.syncAudioVolumeUi(this.audio);
        this.mobileHud.setGameplayMenuVisible(false);
        this.ui.showCharacterSelection(name => this.selectCharacter(name), this.meta);
    }

    _bindEvents() {
        document.addEventListener('keydown', (e) => this._onKeyDown(e));
        document.addEventListener('click', () => {
            this.audio?.unlock?.();
            if (this.state.gameOver && !this.state.gamePaused) this.restart();
        });
        document.addEventListener('pointerdown', () => this.audio?.unlock?.(), { once: false });
        this._onVisibilityChange = () => this._handleVisibilityChange();
        document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    /** Freeze gameplay when the tab is hidden so timers and spawns do not advance in the background. */
    _handleVisibilityChange() {
        const s = this.state;
        if (document.hidden) {
            if (!s.gamePaused && !s.gameOver && !s.characterSelection) {
                this._pausedByTabHidden = this.pauseGame({ silent: true });
            }
            return;
        }
        if (this._pausedByTabHidden) {
            this._pausedByTabHidden = false;
            this.resumeGame();
        }
    }

    _onKeyDown(event) {
        if (this.state.gameOver && !this.state.gamePaused) {
            this.restart();
            return;
        }
        if (event.key === 'Escape' && !this.state.characterSelection) {
            this.handleMenuAction();
            return;
        }
        if (event.key === 'u' || event.key === 'U') {
            if (!this.state.characterSelection && !this.state.gameOver) {
                this.upgradePanel?.toggle();
                if (this.upgradePanel?.isExpanded()) this._refreshUpgradePanel();
            }
            return;
        }
        if (event.key === 'g' || event.key === 'G') {
            if (!this.state.characterSelection && !this.state.gameOver) {
                this.gearPanel?.toggle();
                if (this.gearPanel?.isExpanded()) this.gearPanel.refresh();
            }
            return;
        }

        const charIdx = this._getCharacterKeyIndex(event);
        if (charIdx >= 0 && this.state.characterSelection) {
            const buttons = this.ui.getCharacterButtons();
            if (charIdx < buttons.length) buttons[charIdx].click();
            return;
        }

        if (
            this.upgradePanel?.isExpanded() &&
            !this.state.characterSelection &&
            !this.state.gameOver &&
            !this.state.gamePaused
        ) {
            const idx = parseInt(event.key, 10) - 1;
            if (idx >= 0 && idx <= 8) {
                const view = this.upgradePanel.getView();
                if (view === 'categories') {
                    const buttons = this.upgradePanel.getCategoryButtons();
                    if (idx < buttons.length) {
                        buttons[idx].click();
                        return;
                    }
                } else if (view === 'choices') {
                    const buttons = this.upgradePanel.getChoiceButtons();
                    if (idx < buttons.length) {
                        buttons[idx].click();
                        return;
                    }
                }
            }
        }
    }

    /** Map keyboard key to character list index (supports 11 heroes). */
    _getCharacterKeyIndex(event) {
        if (event.key >= '1' && event.key <= '9') return parseInt(event.key, 10) - 1;
        if (event.key === '0') return 9;
        if (event.key === '-' || event.key === '_') return 10;
        return -1;
    }

    selectCharacter(name) {
        this.audio?.unlock?.();
        const character = CHARACTERS.find(c => c.name === name);
        if (!character) return;

        this.state.fullCleanup();
        resetPlayerModel(this.ui.els.player);
        this.state.initForCharacter(deepClone(character.stats));
        this.state.selectedCharacterName = name;
        this.state.selectedModelClass = character.modelClass;
        this.state.itemsLooted = 0;
        this.killStreak.reset();
        this.gearInventory = new GearInventory();
        this.gearLootFilter = new GearLootFilter();
        this.enemyPopulation = new EnemyPopulationManager(this.state);
        this.treasureEvents = new TreasureEventManager(this);
        this.treasureEvents.reset();
        this.effects = new EffectManager(this.ui.els.gameContainer);
        this.skillExecutor = new SkillExecutor(this);
        this.illusionClone = new IllusionCloneManager(this);
        this.characterPassives = new CharacterPassiveManager(this);
        this.buffTracker = new BuffTracker();
        this.enemyProjectiles = new EnemyProjectileManager(this.state, this.ui.els.gameContainer);
        this.poisonPools = new PoisonPoolManager(this);
        this.skillRanges = new SkillRangeDisplay(
            this.ui.els.gameContainer,
            document.getElementById('skill-range-layer')
        );
        applyPlayerModel(this.ui.els.player, character.name);
        this._activeUpgradeCategory = null;
        this._upgradeOptionCache = { stat: null, skill: null };
        this.upgradePanel = new UpgradePanel(
            key => this._spendUpgrade(key),
            type => this._selectUpgradeCategory(type)
        );
        this.upgradePanel.reset();
        this.gearPanel = new GearPanel(
            this.gearInventory,
            id => this._equipGear(id),
            slot => this._unequipGear(slot),
            id => this._deleteGear(id),
            rarity => this._bulkDeleteGear(rarity),
            this.gearLootFilter
        );
        this.gearPanel.reset();
        this.enemyGuidePanel = new EnemyGuidePanel();
        this.bossHud = new BossHud();
        bindExclusiveGearUpgradePanels(this.gearPanel, this.upgradePanel);
        this.statsPanel = new StatsPanelController();
        this.gameSpeedControls = new GameSpeedControls(this.state);
        this.mobileHud.applyForGame({
            gearPanel: this.gearPanel,
            upgradePanel: this.upgradePanel,
            enemyGuidePanel: this.enemyGuidePanel
        });
        this.ui.showGame();
        this.mobileHud.setGameplayMenuVisible(true);
        this.ui.els.playerAnchor.style.left = '50vw';
        this.ui.els.playerAnchor.style.top = '50vh';
        this.ui.updateAttackRange(this.state.stats.attackRange);
        this.ui.updateStats(this.state.stats, this.state.skillList);
        this.ui.updateMeta(this.state.killCount, this.state.currentWave, this.killStreak.streak);
        this.ui.showWaveAnnouncement(this.state.currentWave);
        this.state.previousWave = this.state.currentWave;
        this.characterPassives?.activate(name);
        this._beginActiveRun();
    }

    /**
     * Unpause, reset the sim clock, refresh the timer UI, and start the main loop.
     * Must run at the end of character select / restart — keep free of optional side effects.
     */
    _beginActiveRun() {
        const s = this.state;
        s.gamePaused = false;
        s.gameOver = false;
        s.characterSelection = false;
        s.elapsedSeconds = 0;
        s.pauseTime = 0;
        initGameClock(s);
        this.ui.updateTimer(0);
        this._startGameLoop();
    }

    restart() {
        this.quitToCharacterSelect();
    }

    quitToCharacterSelect() {
        this.enemyGuidePanel?.setPausedHidden(false);
        this._endRun(false);
        this.state.characterSelection = true;
        this.state.gameOver = false;
        this.mobileHud.setGameplayMenuVisible(false);
        this.ui.hideGameOver();
        this.ui.showPause(false);
        this.ui.showCharacterSelection(name => this.selectCharacter(name), this.meta);
    }

    /** Restart the current character without returning to selection. */
    restartRun() {
        const name = this.state.selectedCharacterName;
        if (!name) {
            this.quitToCharacterSelect();
            return;
        }
        this.state.gamePaused = false;
        this.ui.showPause(false);
        this.enemyGuidePanel?.setPausedHidden(false);
        this._endRun(false);
        this.selectCharacter(name);
    }

    /** @param {boolean} died */
    _endRun(died) {
        const s = this.state;
        if (s.stats && s.selectedCharacterName) {
            recordCampaignVictoryIfPending(this.meta, s.selectedCharacterName, s);
            updateCharacterRecord(this.meta, {
                character: s.selectedCharacterName,
                level: s.stats.level,
                time: s.elapsedSeconds,
                kills: s.killCount,
                wave: s.currentWave
            });
        }
        if (died && s.stats) {
            /* record saved above */
        }
        s.fullCleanup();
        this._clearTreasureGuide();
        this.effects?.cleanup();
        this.poisonPools?.clear();
        this.skillRanges?.clear();
        this.upgradePanel?.reset();
        this.gearPanel?.reset();
        this.gearLootFilter?.reset();
        this.skillExecutor?.cleanup();
        this.illusionClone?.cleanup();
        this.characterPassives?.cleanup();
        this.buffTracker?.clear();
        this.ui?.updateBuffBar?.([]);
        this.enemyProjectiles?.clearAll();
        this.bossHud?.clear();
        this.gearInventory = null;
        if (died) s.gameOver = true;
    }

    /** Shared handler for Escape key and the mobile menu button. */
    handleMenuAction() {
        if (this.state.gameOver && !this.state.gamePaused) {
            this.restart();
            return;
        }
        if (this.state.characterSelection) return;
        if (this.ui.els.achievementsOverlay?.style.display === 'flex') {
            this.ui.closeAchievementsPanel();
            return;
        }
        this.togglePause();
    }

    togglePause() {
        if (this.state.gamePaused) this.resumeGame();
        else this.pauseGame();
    }

    /**
     * @param {{ silent?: boolean }} [opts] silent=true skips the pause overlay (tab-hidden freeze).
     * @returns {boolean} Whether pause was applied.
     */
    pauseGame(opts = {}) {
        const { silent = false } = opts;
        const s = this.state;
        if (s.gamePaused || s.gameOver) return false;
        s.gamePaused = true;
        s.pauseTime = Date.now();
        if (!silent) this.ui.showPause(true);
        collapseSidePanelsOnPause(this.gearPanel, this.upgradePanel);
        this.enemyGuidePanel?.collapse();
        this.enemyGuidePanel?.setPausedHidden(true);
        if (s.gameLoopId) {
            s.cancelAnimation(s.gameLoopId);
            s.gameLoopId = null;
        }
        s.cancelAllAnimations();
        this.enemyProjectiles?.clearAll();
        s.enemies.forEach(e => s.cancelAnimation(e.moveAnimationId));
        s.bullets.forEach(b => s.cancelAnimation(b.moveAnimationId));
        return true;
    }

    resumeGame() {
        const s = this.state;
        if (!s.gamePaused) return;
        s.gamePaused = false;
        this._pausedByTabHidden = false;
        this.ui.showPause(false);
        this.enemyGuidePanel?.setPausedHidden(false);

        const elapsed = Date.now() - s.pauseTime;
        syncClockAfterResume(s);
        if (this.treasureEvents?.lastSpawnTime != null) {
            this.treasureEvents.lastSpawnTime += elapsed;
        }
        s.enemies.forEach(e => {
            this._startEnemyMovement(e);
        });
        s.bullets.forEach(b => this._startBulletMovement(b));
        this._startGameLoop();
    }

    _startGameLoop() {
        if (this.state.gameLoopId) {
            this.state.cancelAnimation(this.state.gameLoopId);
            this.state.gameLoopId = null;
        }
        const loop = () => {
            this._tick();
            const prev = this.state.gameLoopId;
            this.state.gameLoopId = requestAnimationFrame(loop);
            this.state.trackAnimation(this.state.gameLoopId, prev);
        };
        loop();
    }

    _tick() {
        const s = this.state;
        if (s.gamePaused || s.gameOver) return;

        const realNow = Date.now();
        const simNow = advanceGameClock(s, realNow);
        const simDeltaMs = getLastSimDeltaMs(s);

        if (simNow - s.lastAttackTime >= 1000 / s.stats.attackSpeed) {
            const { x, y } = this.ui.getPlayerPosition();
            this._attackNearestEnemy(x, y);
        }

        this._tickBuffs(simNow);
        this.buffTracker?.tick(simNow);
        this.ui?.updateBuffBar?.(this.buffTracker?.getActiveBuffs(simNow) || []);
        this.effects?.setTimeScale(s.timeScale ?? 1);
        this.skillRanges?.setTimeScale(s.timeScale ?? 1);
        this.enemyProjectiles?.tick(simDeltaMs, {
            getPlayerPosition: () => this.ui.getPlayerPosition(),
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
        });
        this._tickTimer(simNow);
        this._tickSpawns(simNow);
        this._tickEnemyAttacks(simNow);
        this._tickStatusEffects(simNow);
        this.skillExecutor?.tick(simNow);
        this.characterPassives?.tick(simNow);
        this.illusionClone?.tick(simNow);
        this.poisonPools?.tick(simNow);
        this.treasureEvents?.tick(simNow);
        this.killStreak.tick(simNow);
        this.skillRanges?.update(s.skillList, s.stats.attackRange);

        this.enemyPopulation?.enforceCap(this);

        this.bossHud?.syncFromEnemies(s.enemies);

        tickPlayerRegen(s, simNow);

        if (this._resolvePlayerVitalityEndOfTick()) return;

        this.ui.updateStats(s.stats, s.skillList);
        this.ui.updateMeta(s.killCount, s.currentWave, this.killStreak.streak);
        this._checkAchievements();
    }

    _checkAchievements() {
        const unlocked = evaluateAchievements(this.meta, buildAchievementContext({
            state: this.state,
            killStreak: this.killStreak,
            treasureEvents: this.treasureEvents,
            gearInventory: this.gearInventory,
            meta: this.meta
        }));
        unlocked.forEach(id => this.ui.showAchievementUnlock(id));
    }

    _tickBuffs(now) {
        const s = this.state;
        const buffLevel = s.abilityList['Attack Speed Buff'].level;
        if (buffLevel <= 0) return;

        const elapsed = now - s.attackSpeedBuffTime;
        if (elapsed >= s.attackSpeedBuffInterval) {
            s.attackSpeedBuffTime = now;
            this._grantBuff('Attack Speed Buff', now);
        } else if (elapsed >= s.attackSpeedBuffDuration) {
            this._removeBuff('Attack Speed Buff');
        }
    }

    _grantBuff(name, now = Date.now()) {
        const s = this.state;
        if (s.stats.buffList[name]) this._removeBuff(name);
        if (name === 'Attack Speed Buff') {
            const level = s.abilityList[name].level;
            const displayPct = getAbilityPercent('attackSpeedBuff', level);
            const bonus = s.stats.attackSpeed * displayPct / 100;
            s.stats.buffList[name] = bonus;
            s.stats.attackSpeed += bonus;
            this.buffTracker?.apply({
                id: 'attack-speed-buff',
                name: 'Attack Speed Buff',
                icon: '⚡',
                description: `+${displayPct}% attack speed`,
                durationMs: s.attackSpeedBuffDuration,
                now
            });
        }
    }

    _removeBuff(name) {
        const s = this.state;
        if (!s.stats.buffList[name]) return;
        if (name === 'Attack Speed Buff') {
            s.stats.attackSpeed -= s.stats.buffList[name];
            this.buffTracker?.remove('attack-speed-buff');
        }
        delete s.stats.buffList[name];
    }

    _tickTimer(simNow) {
        const s = this.state;
        const elapsedSec = getElapsedSeconds(s);
        if (elapsedSec === s.elapsedSeconds) return;

        s.elapsedSeconds = elapsedSec;
        this.ui.updateTimer(s.elapsedSeconds);
        s.currentWave = getWaveNumber(s.elapsedSeconds);
        if (s.currentWave > (s.maxWaveReached || 1)) s.maxWaveReached = s.currentWave;
        s.currentDifficultyLevel = getDifficultyIndex(s.elapsedSeconds);

        const maxDiff = Math.min(s.currentDifficultyLevel, BALANCE.maxDifficultyForSpawn);
        if (s.previousWave !== s.currentWave) {
            this.ui.showWaveAnnouncement(s.currentWave);
            s.previousWave = s.currentWave;
            s.previousDifficultyLevel = s.currentDifficultyLevel;
            s.normalSpawnInterval = getSpawnIntervalMs('normal', maxDiff);
            s.rareEnemySpawnInterval = getSpawnIntervalMs('rare', maxDiff);
            s.eliteSpawnInterval = getSpawnIntervalMs('elite', maxDiff);
            s.bossSpawnInterval = getSpawnIntervalMs('boss', maxDiff);
            if (isMilestoneBossWave(s.currentWave) || isBossWave(s.currentWave)) {
                this._spawnBossWaveEvent(s.currentWave);
            }
        }
    }

    /**
     * Landmark boss encounter every 10 waves — bulky boss + mini swarm pack.
     * Wave 100 uses a unique final boss with a massive escort army.
     * @param {number} wave
     */
    _spawnBossWaveEvent(wave) {
        if (isMilestoneBossWave(wave)) {
            this._spawnTrackedBossEvent(wave);
            return;
        }

        const boss = this._spawnWithType('boss', pickEnemyType(this.state.currentDifficultyLevel));
        if (boss?.stats) {
            boss.stats.hp = Math.floor(boss.stats.hp * BOSS_WAVE_HP_MULT);
            boss.stats.maxHp = boss.stats.hp;
            boss.isWaveBoss = true;
            this._updateEnemyHealthBar(boss);
        }

        const pack = rollBossWaveSwarmCount();
        const edge = Math.floor(Math.random() * 4);
        const anchor = getEdgeSpawnAnchor(edge);
        for (let i = 0; i < pack; i++) {
            this._spawnEnemy('normal', 'swarm', {
                at: {
                    x: anchor.x + (Math.random() - 0.5) * 8,
                    y: anchor.y + (Math.random() - 0.5) * 8
                },
                skipGroup: true,
                bypassCap: true
            });
        }

        if (this.ui.els?.waveToast) {
            this.ui.els.waveToast.textContent = `Wave ${wave} Boss — Swarm incoming!`;
            this.ui.els.waveToast.classList.add('toast-visible');
            clearTimeout(this.ui._waveTimer);
            this.ui._waveTimer = setTimeout(() => {
                this.ui.els.waveToast.classList.remove('toast-visible');
            }, 2800);
        }
    }

    /**
     * Tracked milestone boss (waves 25, 50, 75, 100) — scaled HP, escort army, HUD.
     * @param {number} wave
     */
    _spawnTrackedBossEvent(wave) {
        this._spawnMilestoneBoss(wave);

        const difficulty = this.state.currentDifficultyLevel;
        const edges = [0, 1, 2, 3];
        this._spawnVictoryArmyPack(edges[0], rollBossArmyCount(wave, 'swarm'), 'normal', 'swarm');
        this._spawnVictoryArmyPack(edges[1], rollBossArmyCount(wave, 'grunt'), 'normal', 'grunt');
        this._spawnVictoryArmyPack(edges[2], rollBossArmyCount(wave, 'elite'), 'elite', pickEnemyType(difficulty));
        this._spawnVictoryArmyPack(edges[3], rollBossArmyCount(wave, 'swarm'), 'normal', 'swarm');

        if (isFinalVictoryWave(wave)) {
            this.ui.showFinalVictoryBossIncoming(wave);
        } else if (isMidpointVictoryWave(wave)) {
            this.ui.showMidpointVictoryBossIncoming(wave);
        } else {
            this.ui.showMiniBossIncoming(wave);
        }
    }

    /** @deprecated Use _spawnTrackedBossEvent */
    _spawnMidpointVictoryBossEvent(wave) {
        this._spawnTrackedBossEvent(wave);
    }

    /** @deprecated Use _spawnTrackedBossEvent */
    _spawnFinalVictoryBossEvent(wave) {
        this._spawnTrackedBossEvent(wave);
    }

    /**
     * Spawn a Wave 50 / Wave 100 milestone boss — bypasses population cap and applies HUD tracking.
     * @param {number} milestoneWave MIDPOINT_VICTORY_WAVE or FINAL_VICTORY_WAVE
     * @returns {object|null}
     */
    _spawnMilestoneBoss(milestoneWave) {
        const s = this.state;
        const difficulty = s.currentDifficultyLevel;
        const simNow = getSimulatedMs(s);
        const edge = Math.floor(Math.random() * 4);
        const anchor = getEdgeSpawnAnchor(edge);

        const boss = this._spawnEnemy('boss', pickEnemyType(difficulty), {
            ...MILESTONE_BOSS_SPAWN_OPTS,
            at: {
                x: anchor.x + (Math.random() - 0.5) * 8,
                y: anchor.y + (Math.random() - 0.5) * 8
            }
        });

        if (!boss?.stats) return null;

        applyMilestoneBossCombatScaling(boss.stats, milestoneWave);
        boss.milestoneBossWave = milestoneWave;
        boss.isWaveBoss = true;
        if (milestoneWave === FINAL_VICTORY_WAVE) {
            boss.isFinalVictoryBoss = true;
        }

        this._applyMilestoneBossPresentation(boss, milestoneWave);
        this._updateEnemyHealthBar(boss);
        this.bossHud.track(boss);
        s.milestoneBossReinforceTime = simNow;
        return boss;
    }

    /**
     * Larger in-world HP bar + label for milestone bosses (Wave 50 / 100).
     * @param {object} enemy
     * @param {number} milestoneWave
     */
    _applyMilestoneBossPresentation(enemy, milestoneWave) {
        enemy.element.classList.add('enemy-milestone-boss');
        const bar = enemy.element.querySelector('.enemy-health-bar');
        if (bar) {
            bar.classList.add('enemy-health-bar--milestone');
            const tag = bar.querySelector('.enemy-boss-label');
            if (tag) {
                tag.textContent = MILESTONE_BOSS_WORLD_LABELS[milestoneWave] || 'BOSS';
            }
        }
    }

    /**
     * @param {number} edge @param {number} count @param {string} rarity @param {string} enemyType
     */
    _spawnVictoryArmyPack(edge, count, rarity, enemyType) {
        const anchor = getEdgeSpawnAnchor(edge);
        for (let i = 0; i < count; i++) {
            this._spawnEnemy(rarity, enemyType, {
                at: {
                    x: anchor.x + (Math.random() - 0.5) * 10,
                    y: anchor.y + (Math.random() - 0.5) * 10
                },
                skipGroup: true,
                bypassCap: true
            });
        }
    }

    _onFinalVictoryBossDefeated() {
        const s = this.state;
        if (s.finalVictoryAchieved) return;
        s.finalBossDefeatedThisRun = true;
        s.finalVictoryAchieved = true;
        if (!s.campaignVictoryRecorded) {
            markCharacterVictory(this.meta, s.selectedCharacterName);
            s.campaignVictoryRecorded = true;
        }
        this.ui.showFinalVictoryCelebration(s.selectedCharacterName);
        this._checkAchievements();
    }

    /** Victory requires killing the Wave 100 boss — wave 101+ alone does not count. */
    _hasCampaignVictory() {
        return Boolean(this.state.finalVictoryAchieved);
    }

    _tickSpawns(now) {
        const s = this.state;
        const elapsed = s.elapsedSeconds;
        const pop = this.enemyPopulation;

        if (pop?.shouldSpawnNow('boss', elapsed, s.bossSpawnTime, s.bossSpawnInterval, now)) {
            s.bossSpawnTime = now;
            this._spawnWithType('boss', pickEnemyType(s.currentDifficultyLevel));
        }
        if (pop?.shouldSpawnNow('elite', elapsed, s.eliteSpawnTime, s.eliteSpawnInterval, now)) {
            s.eliteSpawnTime = now;
            this._spawnWithType('elite', pickEnemyType(s.currentDifficultyLevel));
        }
        if (pop?.shouldSpawnNow('rare', elapsed, s.rareEnemySpawnTime, s.rareEnemySpawnInterval, now)) {
            s.rareEnemySpawnTime = now;
            this._spawnWithType('rare', pickEnemyType(s.currentDifficultyLevel));
        }
        if (pop?.shouldSpawnNow('normal', elapsed, s.normalSpawnTime, s.normalSpawnInterval, now)) {
            s.normalSpawnTime = now;
            this._spawnWithType('normal', pickEnemyType(s.currentDifficultyLevel));
        }

        this._tickMilestoneBossReinforcements(now);
    }

    /** Ongoing reinforcements while a Wave 50 or Wave 100 milestone boss lives. */
    _tickMilestoneBossReinforcements(now) {
        const s = this.state;
        const boss = findLivingMilestoneBoss(s.enemies);
        if (!boss?.milestoneBossWave) return;
        if (s.currentWave < boss.milestoneBossWave) return;

        const milestoneWave = boss.milestoneBossWave;
        const interval = milestoneWave === FINAL_VICTORY_WAVE
            ? getFinalVictoryReinforcementIntervalMs(s.elapsedSeconds, s.currentWave)
            : getMilestoneReinforcementIntervalMs(milestoneWave);
        if (now - (s.milestoneBossReinforceTime || 0) < interval) return;
        s.milestoneBossReinforceTime = now;

        const difficulty = s.currentDifficultyLevel;
        const edge = Math.floor(Math.random() * 4);

        if (milestoneWave === FINAL_VICTORY_WAVE) {
            const swarmCount = rollFinalVictoryReinforcementSwarmSize(s.elapsedSeconds, s.currentWave);
            this._spawnVictoryArmyPack(edge, swarmCount, 'normal', 'swarm');

            if (Math.random() < 0.55) {
                const edge2 = (edge + 1 + Math.floor(Math.random() * 3)) % 4;
                this._spawnVictoryArmyPack(
                    edge2,
                    2 + Math.floor(Math.random() * 4),
                    Math.random() < 0.35 ? 'elite' : 'normal',
                    pickEnemyType(difficulty)
                );
            }
            return;
        }

        this._spawnVictoryArmyPack(edge, rollMilestoneReinforcementSwarmSize(milestoneWave), 'normal', 'swarm');
        if (Math.random() < 0.45) {
            const edge2 = (edge + 2) % 4;
            this._spawnVictoryArmyPack(
                edge2,
                2 + Math.floor(Math.random() * 3),
                'normal',
                Math.random() < 0.25 ? 'grunt' : 'swarm'
            );
        }
    }

    /** Routes swarm to group spawn; dasher and others always spawn solo. */
    _spawnWithType(rarity, enemyType) {
        if (enemyType === 'swarm') {
            return this._spawnSwarmGroup(rarity);
        }
        return this._spawnEnemy(rarity, enemyType, { skipGroup: true });
    }

    _spawnSwarmGroup(rarity) {
        const edge = Math.floor(Math.random() * 4);
        const anchor = getEdgeSpawnAnchor(edge);
        const count = rollSwarmGroupSize(this.state.currentDifficultyLevel);
        const positions = getSwarmGroupPositions(anchor.x, anchor.y, count);
        let lead = null;
        for (const at of positions) {
            const spawned = this._spawnEnemy(rarity, 'swarm', { at, skipGroup: true });
            if (spawned && !lead) lead = spawned;
        }
        return lead;
    }

    _tickEnemyAttacks(now) {
        const enemies = [...this.state.enemies];
        enemies.forEach(enemy => {
            if ((enemy.stats?.hp ?? 0) <= 0) return;
            const last = this.state.enemyAttackCooldown[enemy.id] || 0;
            if (now - last >= 1000 / enemy.stats.attackSpeed) {
                this.state.enemyAttackCooldown[enemy.id] = now;
                this._enemyAttackPlayer(enemy);
            }
        });
    }

    _tickRegen(now) {
        tickPlayerRegen(this.state, now);
    }

    /**
     * Apply incoming damage to the player, refresh the HP bar, and return damage dealt after passives.
     * Defeat is only resolved at end-of-tick after regen (see resolvePlayerDefeat).
     * @param {number} rawDamage
     * @returns {number}
     */
    dealPlayerDamage(rawDamage) {
        const s = this.state;
        const dealt = this.characterPassives?.absorbDamage(rawDamage) ?? rawDamage;
        applyPlayerDamage(s.stats, dealt);
        this._onPlayerDamaged();
        this.ui.syncPlayerHp(s.stats);
        return dealt;
    }

    /** @returns {boolean} True when defeat was triggered. */
    _resolvePlayerVitalityEndOfTick() {
        const s = this.state;
        if (!resolvePlayerDefeat(s.stats)) return false;
        this._triggerPlayerDefeat();
        return true;
    }

    _triggerPlayerDefeat() {
        const s = this.state;
        if (s.gameOver) return;

        s.gameOver = true;
        s.cancelAllAnimations();
        this.enemyProjectiles?.clearAll();
        this.effects?.cleanup();
        this.skillExecutor?.cleanup();
        updateCharacterRecord(this.meta, {
            character: s.selectedCharacterName,
            level: s.stats.level,
            time: s.elapsedSeconds,
            kills: s.killCount,
            wave: s.currentWave
        });
        this.mobileHud.setGameplayMenuVisible(false);
        this.ui.syncPlayerHp(s.stats);
        this.ui.showGameOver(s.stats, s.elapsedSeconds, s.killCount, s.currentWave);
    }

    _tickStatusEffects(now) {
        const s = this.state;
        Object.keys(s.statusEffects).forEach(enemyId => {
            const status = s.statusEffects[enemyId];
            const enemy = s.enemies.find(e => e.id === enemyId);
            if (!enemy) {
                delete s.statusEffects[enemyId];
                return;
            }

            if (status.burn && now < status.burn.endTime) {
                if (now - status.burn.lastTick >= 500) {
                    status.burn.lastTick = now;
                    let tickDmg = Math.max(1, Math.floor(status.burn.damagePerTick));
                    tickDmg = this.characterPassives?.modifySkillDamage(tickDmg, {
                        element: 'fire',
                        skillId: 'fireball',
                        tags: ['fire', 'elemental']
                    }) ?? tickDmg;
                    enemy.stats.hp -= tickDmg;
                    this.effects.spawnDamageNumber(
                        parseFloat(enemy.element.style.left),
                        parseFloat(enemy.element.style.top) - 2,
                        tickDmg, false, 'fire'
                    );
                    this._updateEnemyHealthBar(enemy);
                    if (enemy.stats.hp <= 0) this._removeEnemy(enemy);
                }
            } else if (status.burn) {
                this.effects.removeBurnAura(enemy.element);
                delete status.burn;
            }

            if (status.freeze && now >= status.freeze.endTime) {
                enemy.frozen = false;
                enemy.stats.moveSpeed = enemy.baseMoveSpeed;
                this.effects.removeFrostAura(enemy.element);
                delete status.freeze;
            }

            if (status.slow && now >= status.slow.endTime) {
                enemy.stats.moveSpeed = enemy.baseMoveSpeed;
                if (!status.freeze || now >= status.freeze.endTime) {
                    this.effects.removeFrostAura(enemy.element);
                }
                delete status.slow;
            }
        });
    }

    _spawnEnemy(rarity, enemyType, spawnOpts = {}) {
        const s = this.state;
        const earlyTypeConfig = ENEMY_TYPES[enemyType];
        if (earlyTypeConfig?.spawnable === false && !spawnOpts.splitFragment) return null;

        if (!spawnOpts.bypassCap && !spawnOpts.skipGroup && enemyType === 'swarm' && !spawnOpts.at) {
            return this._spawnSwarmGroup(rarity);
        }
        if (!spawnOpts.bypassCap && this.enemyPopulation?.isAtCap()) return null;

        if (!spawnOpts.at && spawnOpts.splitFragment) return null;

        let x;
        let y;
        if (spawnOpts.at) {
            x = spawnOpts.at.x;
            y = spawnOpts.at.y;
        } else {
            const edge = Math.floor(Math.random() * 4);
            switch (edge) {
                case 0: x = Math.random() * 100; y = -2; break;
                case 1: x = 102; y = Math.random() * 100; break;
                case 2: x = Math.random() * 100; y = 102; break;
                default: x = -2; y = Math.random() * 100; break;
            }
        }

        const { stats, typeConfig, rarityConfig } = buildEnemyStats(
            enemyType, rarity, s.currentDifficultyLevel
        );
        applyRuntimeEnemyScaling(stats, s.elapsedSeconds, s.currentWave);

        const el = document.createElement('div');
        el.id = `enemy-${s.nextEnemyId++}`;
        el.className = typeConfig.cssClass + rarityConfig.cssSuffix;
        el.dataset.enemyType = typeConfig.type;
        el.style.setProperty('--enemy-type-color', getEnemyTypeColor(typeConfig.type));
        el.style.left = `${x}vw`;
        el.style.top = `${y}vh`;
        el.title = `${typeConfig.label} (${rarity})`;
        el.insertAdjacentHTML('afterbegin', buildEnemyModelHtml(typeConfig));

        const healthBar = document.createElement('div');
        const isBoss = rarity === 'boss';
        const isElite = rarity === 'elite';
        healthBar.className = [
            'enemy-health-bar',
            isBoss ? 'enemy-health-bar--boss' : '',
            isElite ? 'enemy-health-bar--elite' : ''
        ].filter(Boolean).join(' ');
        const healthFill = document.createElement('div');
        healthFill.className = 'enemy-health-bar-fill';
        healthFill.style.width = '100%';
        healthBar.appendChild(healthFill);
        if (isBoss) {
            const bossTag = document.createElement('span');
            bossTag.className = 'enemy-boss-label';
            bossTag.textContent = 'BOSS';
            healthBar.appendChild(bossTag);
        }
        el.appendChild(healthBar);

        this.ui.els.gameContainer.appendChild(el);

        const enemy = {
            id: el.id,
            element: el,
            stats,
            typeConfig,
            rarity,
            spawnTime: Date.now(),
            moveAnimationId: null,
            frozen: false,
            lastDashTime: 0,
            dashing: false,
            baseMoveSpeed: stats.moveSpeed
        };

        s.enemies.push(enemy);
        s.enemyAttackCooldown[enemy.id] = 0;
        this.effects?.playEnemySpawn(el);
        this._startEnemyMovement(enemy);
        return enemy;
    }

    /** Spawn a bonus treasure enemy within attack range — player is stationary, so chest must come to them. */
    spawnTreasureChest() {
        const s = this.state;
        const { x: px, y: py } = this.ui.getPlayerPosition();
        const iw = window.innerWidth || 1000;
        const rangeVw = Math.max(6, (s.stats.attackRange / iw) * 100);

        // Spawn inside attack range so auto-attacks can reach without moving
        const distVw = Math.max(4, rangeVw * (0.35 + Math.random() * 0.25));
        const angle = Math.random() * Math.PI * 2;
        const x = Math.max(8, Math.min(92, px + Math.cos(angle) * distVw));
        const y = Math.max(12, Math.min(88, py + Math.sin(angle) * distVw));

        const enemy = this._spawnEnemy('rare', 'grunt', { at: { x, y }, bypassCap: true });
        if (!enemy) return;

        enemy.isTreasure = true;
        enemy.stats.exp = Math.floor(enemy.stats.exp * 5);
        enemy.stats.hp = Math.floor(enemy.stats.hp * 0.55);
        enemy.stats.maxHp = enemy.stats.hp;
        // Drift toward player faster — you defeat it like any enemy (no movement needed)
        enemy.stats.moveSpeed = Math.max(enemy.stats.moveSpeed * 1.65, enemy.baseMoveSpeed * 1.4);
        enemy.baseMoveSpeed = enemy.stats.moveSpeed;

        this._applyTreasureChestVisual(enemy);
        enemy.element.classList.add('enemy-treasure');
        enemy.element.style.zIndex = '8';
        enemy.element.title = 'Treasure Chest — defeat for bonus loot!';
        enemy.element.setAttribute('aria-label', 'Treasure Chest');

        // Clear chest label (replaces confusing floating beacon)
        if (!enemy.element.querySelector('.treasure-chest-label')) {
            const label = document.createElement('span');
            label.className = 'treasure-chest-label';
            label.textContent = 'CHEST';
            enemy.element.appendChild(label);
        }

        this._showTreasureGuide(px, py, x, y);
        this.effects?.spawnCastFlash?.(x, y, 'crit');
        this.ui.showTreasureHint(x, y, distVw);
    }

    /** Replace grunt model with a dedicated treasure chest sprite. */
    _applyTreasureChestVisual(enemy) {
        const el = enemy.element;
        el.classList.remove('enemy-grunt');
        el.classList.add('enemy-treasure-chest');
        el.querySelector('.enemy-model-25d')?.remove();
        el.querySelector('.enemy-type-badge')?.remove();
        el.insertAdjacentHTML('afterbegin', buildTreasureChestModelHtml());
    }

    /**
     * Arrow from player center toward the chest so stationary players know where to look.
     * @param {number} px @param {number} py @param {number} tx @param {number} ty
     */
    _showTreasureGuide(px, py, tx, ty) {
        const container = this.ui.els.gameContainer;
        if (!container) return;

        this._clearTreasureGuide();

        const iw = window.innerWidth || 1000;
        const ih = window.innerHeight || 1000;
        const dx = (tx - px) * iw / 100;
        const dy = (ty - py) * ih / 100;
        const len = Math.hypot(dx, dy) || 1;
        const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI;

        const arrow = document.createElement('div');
        arrow.className = 'treasure-guide-arrow';
        arrow.style.left = `${px}vw`;
        arrow.style.top = `${py}vh`;
        arrow.style.width = `${Math.min(len * 0.55, iw * 0.12)}px`;
        arrow.style.transform = `translate(-2px, -50%) rotate(${angleDeg}deg)`;
        arrow.setAttribute('aria-hidden', 'true');
        container.appendChild(arrow);
        this._treasureGuideArrow = arrow;

        const ring = document.createElement('div');
        ring.className = 'treasure-guide-ring';
        ring.style.left = `${tx}vw`;
        ring.style.top = `${ty}vh`;
        ring.setAttribute('aria-hidden', 'true');
        container.appendChild(ring);
        this._treasureGuideRing = ring;

        this.state.trackTimeout(setTimeout(() => this._clearTreasureGuide(), 12000));
    }

    _clearTreasureGuide() {
        this._treasureGuideArrow?.remove();
        this._treasureGuideRing?.remove();
        this._treasureGuideArrow = null;
        this._treasureGuideRing = null;
    }

    _startEnemyMovement(enemy) {
        const s = this.state;
        if (enemy.moveAnimationId) s.cancelAnimation(enemy.moveAnimationId);

        let ex = parseFloat(enemy.element.style.left);
        let ey = parseFloat(enemy.element.style.top);

        const animate = () => {
            if (s.gamePaused || s.gameOver) return;

            if (enemy.frozen) {
                const prevFrozen = enemy.moveAnimationId;
                enemy.moveAnimationId = requestAnimationFrame(animate);
                s.trackAnimation(enemy.moveAnimationId, prevFrozen);
                return;
            }

            const { x: px, y: py } = this.ui.getPlayerPosition();
            const behavior = enemy.typeConfig.behavior;
            const simNow = getProjectedSimMs(s);
            let speed = scaleMovementSpeed(s, enemy.stats.moveSpeed);

            if (behavior === 'dash' && !enemy.dashing && simNow - enemy.lastDashTime >= (enemy.typeConfig.dashCooldown || 3000)) {
                enemy.dashing = true;
                enemy.lastDashTime = simNow;
                speed *= enemy.typeConfig.dashSpeed || 2.5;
                const dashTimeout = setTimeout(() => { enemy.dashing = false; }, scaledRealTimeoutMs(s, 400));
                s.trackTimeout(dashTimeout);
            }

            const angle = Math.atan2(py - ey, px - ex);
            const dist = distanceVw(ex, ey, px, py, window.innerWidth, window.innerHeight);
            const stopRange = behavior === 'ranged'
                ? (enemy.typeConfig.rangedRange || 180) * 0.6
                : enemy.stats.attackRange;

            if (dist > stopRange) {
                ex += Math.cos(angle) * speed;
                ey += Math.sin(angle) * speed;
                enemy.element.style.left = `${ex}vw`;
                enemy.element.style.top = `${ey}vh`;
            }

            const prevMove = enemy.moveAnimationId;
            enemy.moveAnimationId = requestAnimationFrame(animate);
            s.trackAnimation(enemy.moveAnimationId, prevMove);
        };

        animate();
    }

    _attackNearestEnemy(fromX, fromY, excludeTarget = null, remainingBounce = null, attackOpts = {}) {
        const s = this.state;
        const rangeX = attackOpts.rangeCenterX ?? fromX;
        const rangeY = attackOpts.rangeCenterY ?? fromY;
        let nearest = null;
        let minDist = s.stats.attackRange;

        s.enemies.forEach(enemy => {
            if (excludeTarget && enemy.id === excludeTarget.id) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            const dist = distanceVw(rangeX, rangeY, ex, ey, window.innerWidth, window.innerHeight);
            if (dist <= s.stats.attackRange && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (!nearest) return;

        const forceProjectile = Boolean(attackOpts.forceProjectile || attackOpts.projectileClass);
        const isMelee = !forceProjectile && usesMeleeBasicAttack(s.selectedModelClass);

        if (!excludeTarget && !attackOpts.skipPlayerAnim) {
            s.lastAttackTime = getProjectedSimMs(s);
            const tx = parseFloat(nearest.element.style.left);
            const ty = parseFloat(nearest.element.style.top);
            if (isMelee) {
                this.effects.triggerMeleeAttackAnimation(this.ui.els.player, fromX, fromY, tx, ty);
            } else {
                this.effects.triggerAttackAnimation(this.ui.els.player);
            }
            this.effects.flashAttackRange(this.ui.els.attackRange);
            this.audio?.playSfx?.('attack');
        }

        if (isMelee) {
            this._dealDamageToEnemy(
                nearest,
                false,
                Boolean(excludeTarget),
                attackOpts.damageMultiplier ?? 1
            );
            // Bounce still chains with projectiles so chain shots keep working.
            const bounces = remainingBounce ?? s.abilityList.Bounce.level;
            if (bounces > 0) {
                this._attackNearestEnemy(fromX, fromY, nearest, bounces - 1, {
                    ...attackOpts,
                    forceProjectile: true
                });
            }
            return;
        }

        this._fireBullet(fromX, fromY, nearest, excludeTarget, remainingBounce, attackOpts);
    }

    _fireBullet(fromX, fromY, target, excludeTarget, remainingBounce, attackOpts = {}) {
        const s = this.state;

        const projectileClass = attackOpts.projectileClass || 'projectile-physical';
        const el = document.createElement('div');
        el.className = `projectile ${projectileClass}`;
        el.innerHTML = '<span class="projectile-core"></span><span class="projectile-tail"></span>';
        el.style.left = `${fromX}vw`;
        el.style.top = `${fromY}vh`;
        this.ui.els.gameContainer.appendChild(el);

        const bullet = {
            element: el,
            remainingBounce: remainingBounce ?? s.abilityList.Bounce.level,
            targetEnemy: target,
            excludeTarget,
            moveAnimationId: null,
            elementType: 'physical',
            damageMultiplier: attackOpts.damageMultiplier ?? 1,
            attackOpts
        };

        s.bullets.push(bullet);

        const timeoutId = setTimeout(() => {
            s.cancelAnimation(bullet.moveAnimationId);
            bullet.element.remove();
            const idx = s.bullets.indexOf(bullet);
            if (idx !== -1) s.bullets.splice(idx, 1);
            s.pendingTimeouts.delete(timeoutId);
        }, 5000);
        s.trackTimeout(timeoutId);

        this._startBulletMovement(bullet);
    }

    _startBulletMovement(bullet) {
        const s = this.state;
        const target = bullet.targetEnemy;
        if (!target || !target.element.parentElement) {
            bullet.element.remove();
            const idx = s.bullets.indexOf(bullet);
            if (idx !== -1) s.bullets.splice(idx, 1);
            return;
        }

        if (bullet.moveAnimationId) s.cancelAnimation(bullet.moveAnimationId);

        let bx = parseFloat(bullet.element.style.left);
        let by = parseFloat(bullet.element.style.top);
        const tx = parseFloat(target.element.style.left);
        const ty = parseFloat(target.element.style.top);
        const angle = Math.atan2(ty - by, tx - bx);
        const speed = 1.2;

        const animate = () => {
            if (s.gamePaused || s.gameOver) return;

            bx += Math.cos(angle) * speed;
            by += Math.sin(angle) * speed;
            bullet.element.style.left = `${bx}vw`;
            bullet.element.style.top = `${by}vh`;

            let hit = null;
            for (const enemy of s.enemies) {
                if (bullet.excludeTarget && enemy.id === bullet.excludeTarget.id) continue;
                const ex = parseFloat(enemy.element.style.left);
                const ey = parseFloat(enemy.element.style.top);
                const ew = enemy.element.offsetWidth * 100 / window.innerWidth;
                const eh = enemy.element.offsetHeight * 100 / window.innerHeight;
                if (Math.abs(bx - ex) < ew / 2 && Math.abs(by - ey) < eh / 2 && enemy.stats.hp > 0) {
                    hit = enemy;
                    break;
                }
            }

            if (hit) {
                this._dealDamageToEnemy(
                    hit,
                    false,
                    bullet.remainingBounce > 0,
                    bullet.damageMultiplier ?? 1
                );

                if (bullet.remainingBounce > 0) {
                    bullet.remainingBounce--;
                    this._attackNearestEnemy(bx, by, hit, bullet.remainingBounce, bullet.attackOpts || {});
                }

                s.cancelAnimation(bullet.moveAnimationId);
                bullet.element.remove();
                const idx = s.bullets.indexOf(bullet);
                if (idx !== -1) s.bullets.splice(idx, 1);
            } else {
                const prev = bullet.moveAnimationId;
                bullet.moveAnimationId = requestAnimationFrame(animate);
                s.trackAnimation(bullet.moveAnimationId, prev);
            }
        };

        animate();
    }

    _getAbilityLevels() {
        const a = this.state.abilityList;
        return {
            reflectLevel: a.Reflect.level,
            bounceLevel: a.Bounce.level,
            hpToDamageLevel: a['HP To Damage'].level,
            regenToDamageLevel: a['Regen To Damage'].level,
            lifestealLevel: a.Lifesteal.level,
            damageReductionLevel: a['Damage Reduction'].level
        };
    }

    _dealDamageToEnemy(hitEnemy, isReflect, isBounce, damageMultiplier = 1) {
        const s = this.state;
        if (rollEnemyEvade(hitEnemy.stats.evadeChance)) {
            const ex = parseFloat(hitEnemy.element.style.left);
            const ey = parseFloat(hitEnemy.element.style.top);
            this.effects.spawnDamageNumber(ex, ey - 2, 'MISS', false);
            return { damage: 0, isCritical: false, missed: true };
        }

        const abilities = this._getAbilityLevels();

        const { damage: rawDamage, isCritical } = calculatePlayerDamage({
            physicalDamage: Math.max(1, Math.floor(s.stats.physicalDamage * damageMultiplier)),
            targetArmour: hitEnemy.stats.armour,
            maxHp: s.stats.maxHp,
            hpRegen: s.stats.hpRegen,
            isReflect,
            isBounce,
            critChance: s.stats.critChance,
            critMultiplier: s.stats.critMultiplier,
            abilities
        });

        const damage = this.characterPassives?.modifyPhysicalDamage?.(rawDamage) ?? rawDamage;

        hitEnemy.stats.hp -= damage;
        const ex = parseFloat(hitEnemy.element.style.left);
        const ey = parseFloat(hitEnemy.element.style.top);

        this.effects.triggerEnemyHitAnimation(hitEnemy.element);
        this.effects.spawnHitEffect(ex, ey, isCritical ? 'crit' : 'physical');
        this.effects.spawnDamageNumber(ex, ey - 2, damage, isCritical, 'physical');

        this._updateEnemyHealthBar(hitEnemy);

        if (hitEnemy.stats.hp <= 0) {
            this._removeEnemy(hitEnemy);
        } else if (!isReflect && !isBounce) {
            const heal = calculateLifesteal({ damage, lifestealLevel: abilities.lifestealLevel });
            if (heal > 0) {
                s.stats.hp += heal;
            }
        }

        const result = { damage, isCritical };
        if (!isReflect && !isBounce) {
            this.characterPassives?.onBasicHit(hitEnemy, result);
        }
        return result;
    }

    /** Skill damage — bypasses bounce penalty, uses element for visuals */
    _dealSkillDamageToEnemy(hitEnemy, damage, element, isCrit = false, skillId = null) {
        const s = this.state;
        if (rollEnemyEvade(hitEnemy.stats.evadeChance)) {
            const ex = parseFloat(hitEnemy.element.style.left);
            const ey = parseFloat(hitEnemy.element.style.top);
            this.effects.spawnDamageNumber(ex, ey - 2, 'MISS', false);
            return { damage: 0, missed: true };
        }

        damage = this.characterPassives?.modifySkillDamage(damage, { element, skillId }) ?? damage;
        damage = Math.max(1, Math.floor(damage));
        hitEnemy.stats.hp -= damage;

        const ex = parseFloat(hitEnemy.element.style.left);
        const ey = parseFloat(hitEnemy.element.style.top);

        this.effects.triggerEnemyHitAnimation(hitEnemy.element);
        this.effects.spawnHitEffect(ex, ey, element);
        this.effects.spawnDamageNumber(ex, ey - 2, damage, isCrit, element);
        this._updateEnemyHealthBar(hitEnemy);

        if (hitEnemy.stats.hp <= 0) {
            this._removeEnemy(hitEnemy);
        }
    }

    _applyBurn(enemy, totalBurnDamage, duration) {
        if (totalBurnDamage <= 0) return;
        const s = this.state;
        const simNow = getProjectedSimMs(s);
        this.effects.applyBurnAura(enemy.element);
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].burn = {
            damagePerTick: totalBurnDamage / 6,
            endTime: simNow + duration,
            lastTick: simNow
        };
    }

    _applySlow(enemy, slowPercent, duration) {
        const s = this.state;
        const simNow = getProjectedSimMs(s);
        this.effects.applyFrostAura(enemy.element);
        enemy.stats.moveSpeed = enemy.baseMoveSpeed * (1 - slowPercent / 100);
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].slow = { endTime: simNow + duration };
    }

    _applyFreeze(enemy, duration) {
        const s = this.state;
        const simNow = getProjectedSimMs(s);
        enemy.frozen = true;
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].freeze = { endTime: simNow + duration };
    }

    _enemyAttackPlayer(enemy) {
        if ((enemy.stats?.hp ?? 0) <= 0) return;

        const s = this.state;
        const { x: px, y: py } = this.ui.getPlayerPosition();
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        const dist = distanceVw(ex, ey, px, py, window.innerWidth, window.innerHeight);

        if (enemy.typeConfig.behavior === 'ranged' && dist <= (enemy.typeConfig.rangedRange || 220)) {
            this.effects.triggerEnemyAttackAnimation(enemy.element, px, py);
            this._fireEnemyProjectile(enemy);
            return;
        }

        if (dist <= enemy.stats.attackRange) {
            this.effects.triggerEnemyAttackAnimation(enemy.element, px, py);
            if (rollChance(s.stats.evade)) return;

            const abilities = this._getAbilityLevels();
            const reflectBasis = calculateEnemyHitDamageForReflect({
                enemyDamage: enemy.stats.physicalDamage,
                elapsedSeconds: s.elapsedSeconds
            });
            const damage = calculatePlayerIncomingDamage({
                enemyDamage: enemy.stats.physicalDamage,
                playerArmour: s.stats.armour,
                damageReductionLevel: abilities.damageReductionLevel,
                ignoreArmour: Boolean(enemy.stats.ignoreArmour),
                elapsedSeconds: s.elapsedSeconds
            });

            this.dealPlayerDamage(damage);
            this._applyReflectDamage(enemy, reflectBasis);
        }
    }

    /**
     * Return-damage Reflect: deals % of pre-mitigation enemy hit back to the attacker.
     * Works for melee and ranged; does not miss or crit.
     * @param {object} enemy
     * @param {number} hitDamage Pre-mitigation enemy attack damage
     */
    _applyReflectDamage(enemy, hitDamage) {
        const s = this.state;
        if (!enemy) return;
        const { reflectLevel } = this._getAbilityLevels();
        const { reflected, remainingHp } = applyReflectDamageToAttacker(
            hitDamage,
            reflectLevel,
            enemy.stats?.hp ?? 0
        );
        if (reflected <= 0) return;

        enemy.stats.hp = remainingHp;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        this.effects.triggerEnemyHitAnimation(enemy.element);
        if (!this.effects.isCosmeticThrottled()) {
            this.effects.spawnHitEffect(ex, ey, 'reflect');
        }
        this.effects.spawnDamageNumber(ex, ey - 2, reflected, false, 'reflect');
        this._updateEnemyHealthBar(enemy);
        if (enemy.stats.hp <= 0) this._removeEnemy(enemy);
    }

    _fireEnemyProjectile(enemy) {
        if ((enemy.stats?.hp ?? 0) <= 0) return;

        const s = this.state;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        const ignoreArmour = Boolean(enemy.stats.ignoreArmour);
        const damage = enemy.stats.physicalDamage;
        const ownerId = enemy.id;

        this.enemyProjectiles.spawn({
            x: ex,
            y: ey,
            ownerId,
            onHit: () => {
                if (!s.enemies.some(e => e.id === ownerId && (e.stats?.hp ?? 0) > 0)) return;
                if (rollChance(s.stats.evade)) return;
                const abilities = this._getAbilityLevels();
                const reflectBasis = calculateEnemyHitDamageForReflect({
                    enemyDamage: damage,
                    elapsedSeconds: s.elapsedSeconds
                });
                this.dealPlayerDamage(calculatePlayerIncomingDamage({
                    enemyDamage: damage,
                    playerArmour: s.stats.armour,
                    damageReductionLevel: abilities.damageReductionLevel,
                    ignoreArmour,
                    elapsedSeconds: s.elapsedSeconds
                }));
                const attacker = s.enemies.find(e => e.id === ownerId);
                if (attacker?.stats?.hp > 0) this._applyReflectDamage(attacker, reflectBasis);
            }
        });
    }

    _removeEnemy(enemy) {
        this._forceRemoveEnemy(enemy, true);
    }

    /** @param {object} enemy @param {boolean} grantRewards */
    _forceRemoveEnemy(enemy, grantRewards) {
        const s = this.state;
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);

        if (grantRewards) {
            s.killCount++;
            if (enemy.rarity === 'elite') s.elitesKilled = (s.elitesKilled || 0) + 1;
            if (enemy.rarity === 'boss') s.bossesKilled = (s.bossesKilled || 0) + 1;
            this.audio?.playSfx?.('kill');
            const now = Date.now();
            const streakBonus = this.killStreak.recordKill(
                now,
                EXP_CONFIG.streakBonusPerKill,
                EXP_CONFIG.streakBonusCap
            );
            const expGain = calculateExpFromKill(
                enemy.stats.exp,
                this.characterPassives?.modifyExpGain(s.stats.expGain) ?? s.stats.expGain,
                streakBonus,
                {
                    waveIndex: s.currentDifficultyLevel,
                    enemyType: enemy.typeConfig?.type || enemy.element?.dataset?.enemyType || 'grunt'
                }
            );
            s.stats.exp += expGain;
            this.effects.spawnExpOrbs(ex, ey);
            this.ui.flashHudBar('exp');

            if (enemy.isTreasure) {
                this.treasureEvents?.recordOpen();
                this._clearTreasureGuide();
            }
            if (enemy.isFinalVictoryBoss) {
                this._onFinalVictoryBossDefeated();
            }
            this._tryDropGear(enemy, ex, ey);

            if (s.stats.exp >= s.stats.expThreshold) this._afterExpChange();
            this._checkAchievements();
        }

        this.effects.spawnDeathExplosion(ex, ey, enemy.rarity);
        delete s.statusEffects[enemy.id];

        handleEnemyDeathEffects(this, enemy, ex, ey, grantRewards);

        if (enemy.milestoneBossWave) {
            this.bossHud.onBossDeath(enemy, s.enemies);
        }

        s.cancelAnimation(enemy.moveAnimationId);
        delete s.enemyAttackCooldown[enemy.id];
        this.enemyProjectiles?.removeForOwner(enemy.id);
        enemy.element.remove();
        const idx = s.enemies.indexOf(enemy);
        if (idx !== -1) s.enemies.splice(idx, 1);
    }

    /** @param {object} enemy @param {number} x @param {number} y */
    _tryDropGear(enemy, x, y) {
        const ilvl = computeDropIlvl(
            this.state.stats.level,
            this.state.currentDifficultyLevel
        );

        if (enemy.milestoneBossWave && milestoneBossGuaranteesUniqueLoot(enemy.milestoneBossWave)) {
            this._grantGearItem(rollGuaranteedUniqueDrop(ilvl), x, y);
            return;
        }

        const category = enemy.isTreasure ? 'treasure' : enemy.rarity;
        if (!shouldDropGear(category, this.state.currentWave)) return;

        this._grantGearItem(rollLootDrop(category, ilvl), x, y);
    }

    /** @param {object} item @param {number} x @param {number} y */
    _grantGearItem(item, x, y) {
        if (this.gearLootFilter?.shouldAutoDelete(item.rarity)) return;
        if (!this.gearInventory.addItem(item)) return;

        this.state.itemsLooted += 1;
        this.effects.spawnLootBurst(x, y);
        this.audio?.playSfx?.('loot');
        const r = RARITY_CONFIG[item.rarity];
        this.ui.showGearLoot(item.name, r.cssClass);
        this.gearPanel?.pulseNewLoot();
        this.gearPanel?.refresh();
    }

    _onPlayerDamaged() {
        flashPlayerSprite(this.ui.els.player, 'player-hit', 200);
        shakePlayerAnchor(this.ui.els.playerAnchor);
        this.ui.flashHudBar('hp');
        this.audio?.playSfx?.('hurt');
    }

    _equipGear(itemId) {
        if (!this.gearInventory?.equip(itemId, this.state.stats)) return;
        this.ui.updateStats(this.state.stats, this.state.skillList);
        this.ui.updateAttackRange(this.state.stats.attackRange);
        this.gearPanel?.refresh();
        this._checkAchievements();
    }

    _unequipGear(slot) {
        if (!this.gearInventory?.unequip(slot, this.state.stats)) return;
        this.ui.updateStats(this.state.stats, this.state.skillList);
        this.ui.updateAttackRange(this.state.stats.attackRange);
        this.gearPanel?.refresh();
    }

    _deleteGear(itemId) {
        if (!this.gearInventory?.removeItem(itemId)) return;
        this.gearPanel?.refresh();
    }

    _bulkDeleteGear(rarity) {
        const removed = this.gearInventory?.removeByRarities([rarity]) ?? 0;
        if (removed > 0) this.gearPanel?.refresh();
    }

    /** Bank earned levels and refresh the non-blocking upgrade panel. */
    _afterExpChange() {
        const s = this.state;
        const before = s.pendingUpgrades?.length || 0;
        bankExpLevelUps(s);
        if ((s.pendingUpgrades?.length || 0) > before) {
            this.audio?.playSfx?.('levelup');
        }
        this._refreshUpgradePanel();
        this.ui.updateStats(s.stats, s.skillList);
    }

    _refreshUpgradePanel() {
        const s = this.state;
        const pendingList = s.pendingUpgrades || [];
        const count = pendingList.length;
        const summary = summarizeUpgradeQueue(pendingList);

        this.upgradePanel?.updateBadge(count);
        this.upgradePanel?.updateQueueSummary(summary, count);

        if (count <= 0) {
            this._activeUpgradeCategory = null;
            this._upgradeOptionCache = { stat: null, skill: null };
            this.upgradePanel?.showEmptyState();
            return;
        }

        if (this._activeUpgradeCategory) {
            const options = this._buildUpgradeOptions(this._activeUpgradeCategory);
            const remaining = summary[this._activeUpgradeCategory] || 0;
            if (options.length === 0 || remaining <= 0) {
                this._clearUpgradeCache(this._activeUpgradeCategory);
                this._activeUpgradeCategory = null;
            } else {
                this.upgradePanel?.renderChoices(
                    this._activeUpgradeCategory,
                    options,
                    () => {
                        this._clearUpgradeCache(this._activeUpgradeCategory);
                        this._activeUpgradeCategory = null;
                        this._refreshUpgradePanel();
                    },
                    remaining
                );
                return;
            }
        }

        this.upgradePanel?.renderCategoryMenu(summary);
    }

    /** @param {'stat'|'skill'|'ability'} type */
    _buildUpgradeOptions(type) {
        const s = this.state;
        if (type === 'stat') {
            if (this._upgradeOptionCache?.stat) {
                return buildStatUpgradeOptionsFromKeys(s.statsList, this._upgradeOptionCache.stat);
            }
            return buildStatUpgradeOptions(s.statsList);
        }
        if (type === 'skill') {
            if (this._upgradeOptionCache?.skill) {
                return buildSkillUpgradeOptionsFromKeys(s.skillList, this._upgradeOptionCache.skill);
            }
            return buildSkillUpgradeOptions(s.skillList);
        }
        return buildAbilityUpgradeOptions(s.abilityList, name =>
            formatAbilityDescription(s.abilityList[name])
        );
    }

    /** @param {'stat'|'skill'|'ability'} type */
    _clearUpgradeCache(type) {
        if (!this._upgradeOptionCache) return;
        if (type === 'stat') this._upgradeOptionCache.stat = null;
        if (type === 'skill') this._upgradeOptionCache.skill = null;
    }

    /** @param {'stat'|'skill'|'ability'} type */
    _ensureUpgradeCache(type) {
        if (!this._upgradeOptionCache) {
            this._upgradeOptionCache = { stat: null, skill: null };
        }
        const s = this.state;
        if (type === 'stat' && !this._upgradeOptionCache.stat) {
            this._upgradeOptionCache.stat = rollStatUpgradeKeys(s.statsList);
        }
        if (type === 'skill' && !this._upgradeOptionCache.skill) {
            this._upgradeOptionCache.skill = rollSkillUpgradeKeys(s.skillList);
        }
    }

    /** @param {'stat'|'skill'|'ability'} type */
    _selectUpgradeCategory(type) {
        const summary = summarizeUpgradeQueue(this.state.pendingUpgrades || []);
        if (!summary[type]) return;
        this._ensureUpgradeCache(type);
        this._activeUpgradeCategory = type;
        this._refreshUpgradePanel();
    }

    /** Spend one banked upgrade point while the game keeps running. */
    _spendUpgrade(choiceKey) {
        const s = this.state;
        const type = this._activeUpgradeCategory;
        if (!type) return;

        const consumed = consumePendingUpgradeByType(s, type);
        if (!consumed) return;

        if (type === 'stat') {
            applyStatUpgrade(choiceKey, s.stats, s.originalStats, s.statsList);
        } else if (type === 'ability') {
            s.abilityList[choiceKey].level += 1;
        } else if (type === 'skill') {
            s.skillList[choiceKey].level += 1;
            syncPlayerSkillLevels(s.stats.skills, s.skillList);
        }

        const summary = summarizeUpgradeQueue(s.pendingUpgrades || []);
        // Always re-roll the listed choices after spending one point (stat & skill).
        this._clearUpgradeCache(type);
        if (!summary[type]) {
            this._activeUpgradeCategory = null;
        } else if (type === 'stat' || type === 'skill') {
            this._ensureUpgradeCache(type);
        }

        this.ui.updateAttackRange(s.stats.attackRange);
        this._refreshUpgradePanel();
        this.ui.updateStats(s.stats, s.skillList);

        if (s.stats.exp >= s.stats.expThreshold) {
            this._afterExpChange();
        }
    }

    _updateEnemyHealthBar(enemy) {
        const fill = enemy.element.querySelector('.enemy-health-bar-fill');
        if (fill) {
            fill.style.width = `${(enemy.stats.hp / enemy.stats.maxHp) * 100}%`;
        }
        if (enemy.milestoneBossWave) {
            this.bossHud.update(enemy);
        }
    }
}
