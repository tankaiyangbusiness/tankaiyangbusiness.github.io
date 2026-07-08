import { CHARACTERS } from '../config/characters.js';
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
    calculateLifesteal,
    applyStatUpgrade,
    rollEnemyEvade
} from '../systems/combat.js';
import { distanceVw, rollChance } from '../utils/math.js';
import { deepClone } from '../utils/clone.js';
import { applyPlayerModel, resetPlayerModel, buildEnemyModelHtml } from '../ui/entityModels.js';
import { flashPlayerSprite, shakePlayerAnchor } from '../ui/playerVisuals.js';
import { SkillRangeDisplay } from '../systems/skillRangeDisplay.js';
import { PoisonPoolManager } from '../systems/poisonPools.js';
import { UpgradePanel } from '../ui/upgradePanel.js';
import { BALANCE, getSpawnIntervalMs } from '../config/balance.js';
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
import { EnemyProjectileManager } from '../systems/enemyProjectiles.js';
import { EnemyGuidePanel } from '../ui/enemyGuidePanel.js';
import { shouldDropGear } from '../config/gearRarity.js';
import { rollLootDrop, computeDropIlvl } from '../systems/gearGenerator.js';
import { RARITY_CONFIG } from '../config/gearRarity.js';
import {
    loadMetaProgress,
    evaluateAchievements,
    updateCharacterRecord
} from '../systems/metaProgress.js';

export class Game {
    constructor() {
        this.state = new GameState();
        this.ui = new UIManager();
        this.effects = null;
        this.meta = loadMetaProgress();
        this.killStreak = new KillStreakTracker();
        this._bindEvents();
        this.ui.bindPauseMenu({
            resume: () => this.resumeGame(),
            restart: () => this.restartRun(),
            characterSelect: () => this.quitToCharacterSelect()
        });
        this.ui.showCharacterSelection(name => this.selectCharacter(name), this.meta);
    }

    _bindEvents() {
        document.addEventListener('keydown', (e) => this._onKeyDown(e));
        document.addEventListener('click', () => {
            if (this.state.gameOver && !this.state.gamePaused) this.restart();
        });
    }

    _onKeyDown(event) {
        if (this.state.gameOver && !this.state.gamePaused) {
            this.restart();
            return;
        }
        if (event.key === 'Escape' && !this.state.characterSelection) {
            this.togglePause();
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
        const character = CHARACTERS.find(c => c.name === name);
        if (!character) return;

        this.state.fullCleanup();
        resetPlayerModel(this.ui.els.player);
        this.state.initForCharacter(deepClone(character.stats));
        this.state.selectedCharacterName = name;
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
        this.enemyProjectiles = new EnemyProjectileManager(this.state);
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
        this.ui.showGame();
        this.ui.els.playerAnchor.style.left = '50vw';
        this.ui.els.playerAnchor.style.top = '50vh';
        this.ui.updateAttackRange(this.state.stats.attackRange);
        this.ui.updateStats(this.state.stats, this.state.skillList);
        this.ui.updateMeta(this.state.killCount, this.state.currentWave, this.killStreak.streak);
        this.ui.showWaveAnnouncement(this.state.currentWave);
        this.state.previousWave = this.state.currentWave;
        this.characterPassives?.activate(name);
        this._startGameLoop();
    }

    restart() {
        this.quitToCharacterSelect();
    }

    quitToCharacterSelect() {
        this._endRun(false);
        this.state.characterSelection = true;
        this.state.gameOver = false;
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
        this._endRun(false);
        this.selectCharacter(name);
    }

    /** @param {boolean} died */
    _endRun(died) {
        const s = this.state;
        if (s.stats && s.selectedCharacterName) {
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
        this.gearInventory = null;
        if (died) s.gameOver = true;
    }

    togglePause() {
        if (this.state.gamePaused) this.resumeGame();
        else this.pauseGame();
    }

    pauseGame() {
        const s = this.state;
        if (s.gamePaused || s.gameOver) return;
        s.gamePaused = true;
        s.pauseTime = Date.now();
        this.ui.showPause(true);
        s.cancelAllAnimations();
        this.enemyProjectiles?.clearAll();
        s.enemies.forEach(e => s.cancelAnimation(e.moveAnimationId));
        s.bullets.forEach(b => s.cancelAnimation(b.moveAnimationId));
    }

    resumeGame() {
        const s = this.state;
        if (!s.gamePaused) return;
        s.gamePaused = false;
        this.ui.showPause(false);

        const elapsed = Date.now() - s.pauseTime;
        s.lastAttackTime += elapsed;
        s.timerStart += elapsed;
        s.bossSpawnTime += elapsed;
        s.eliteSpawnTime += elapsed;
        s.rareEnemySpawnTime += elapsed;
        s.normalSpawnTime += elapsed;
        s.attackSpeedBuffTime += elapsed;
        s.healthRegenTime += elapsed;
        if (this.treasureEvents) this.treasureEvents.lastSpawnTime += elapsed;
        s.enemies.forEach(e => {
            s.enemyAttackCooldown[e.id] = (s.enemyAttackCooldown[e.id] || 0) + elapsed;
            this._startEnemyMovement(e);
        });
        s.bullets.forEach(b => this._startBulletMovement(b));
        this._startGameLoop();
    }

    _startGameLoop() {
        if (this.state.gameLoopId) cancelAnimationFrame(this.state.gameLoopId);
        const loop = () => {
            this._tick();
            this.state.gameLoopId = requestAnimationFrame(loop);
            this.state.trackAnimation(this.state.gameLoopId);
        };
        loop();
    }

    _tick() {
        const s = this.state;
        if (s.gamePaused || s.gameOver) return;

        const now = Date.now();

        if (now - s.lastAttackTime >= 1000 / s.stats.attackSpeed) {
            const { x, y } = this.ui.getPlayerPosition();
            this._attackNearestEnemy(x, y);
        }

        this._tickBuffs(now);
        this.buffTracker?.tick(now);
        this.ui?.updateBuffBar?.(this.buffTracker?.getActiveBuffs(now) || []);
        this._tickTimer(now);
        this._tickSpawns(now);
        this._tickEnemyAttacks(now);
        this._tickRegen(now);
        this._tickStatusEffects(now);
        this.skillExecutor?.tick(now);
        this.characterPassives?.tick(now);
        this.illusionClone?.tick(now);
        this.poisonPools?.tick(now);
        this.treasureEvents?.tick(now);
        this.killStreak.tick(now);
        this.skillRanges?.update(s.skillList);

        this.enemyPopulation?.enforceCap(this);

        if (s.stats.hp <= 0) {
            s.gameOver = true;
            s.cancelAllAnimations();
            this.enemyProjectiles?.clearAll();
            updateCharacterRecord(this.meta, {
                character: s.selectedCharacterName,
                level: s.stats.level,
                time: s.elapsedSeconds,
                kills: s.killCount,
                wave: s.currentWave
            });
            this.ui.showGameOver(s.stats, s.elapsedSeconds, s.killCount, s.currentWave);
            return;
        }

        this.ui.updateStats(s.stats, s.skillList);
        this.ui.updateMeta(s.killCount, s.currentWave, this.killStreak.streak);
        this._checkAchievements();
    }

    _checkAchievements() {
        const s = this.state;
        const equipped = this.gearInventory?.equipped || {};
        const equippedRareCount = Object.values(equipped).filter(i => i && (i.rarity === 'rare' || i.rarity === 'unique')).length;
        const unlocked = evaluateAchievements(this.meta, {
            killCount: s.killCount,
            level: s.stats.level,
            elapsedSeconds: s.elapsedSeconds,
            bestStreak: this.killStreak.bestStreak,
            treasuresOpened: this.treasureEvents?.treasuresOpened ?? 0,
            itemsLooted: s.itemsLooted ?? 0,
            equippedRareCount,
            equippedGearCount: this.gearInventory?.getEquippedCount() ?? 0
        });
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
            const bonus = s.abilityList[name].level * s.stats.attackSpeed * 16 / 100;
            s.stats.buffList[name] = bonus;
            s.stats.attackSpeed += bonus;
            const pct = Math.round(s.abilityList[name].level * 16);
            this.buffTracker?.apply({
                id: 'attack-speed-buff',
                name: 'Attack Speed Buff',
                icon: '⚡',
                description: `+${pct}% attack speed`,
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

    _tickTimer(now) {
        const s = this.state;
        if (now - s.timerStart < 1000) return;

        s.elapsedSeconds = Math.floor((now - s.timerStart) / 1000);
        this.ui.updateTimer(s.elapsedSeconds);
        s.currentWave = getWaveNumber(s.elapsedSeconds);
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
        }
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
        const count = rollSwarmGroupSize();
        const positions = getSwarmGroupPositions(anchor.x, anchor.y, count);
        let lead = null;
        for (const at of positions) {
            const spawned = this._spawnEnemy(rarity, 'swarm', { at, skipGroup: true });
            if (spawned && !lead) lead = spawned;
        }
        return lead;
    }

    _tickEnemyAttacks(now) {
        this.state.enemies.forEach(enemy => {
            const last = this.state.enemyAttackCooldown[enemy.id] || 0;
            if (now - last >= 1000 / enemy.stats.attackSpeed) {
                this.state.enemyAttackCooldown[enemy.id] = now;
                this._enemyAttackPlayer(enemy);
            }
        });
    }

    _tickRegen(now) {
        const s = this.state;
        const regenBoost = s.abilityList['Regen To Damage'].level > 0
            ? s.abilityList['Regen To Damage'].level * 20 / 100 : 0;
        const interval = s.healthRegenInterval / (1 + regenBoost);
        if (now - s.healthRegenTime >= interval) {
            s.healthRegenTime = now;
            s.stats.hp += s.stats.hpRegen;
        }
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
                    const tickDmg = Math.max(1, Math.floor(status.burn.damagePerTick));
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
        healthBar.className = 'enemy-health-bar';
        const healthFill = document.createElement('div');
        healthFill.className = 'enemy-health-bar-fill';
        healthBar.appendChild(healthFill);
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

    /** Spawn a bonus treasure enemy with high rewards. */
    spawnTreasureChest() {
        const s = this.state;
        const angle = Math.random() * Math.PI * 2;
        const x = 50 + Math.cos(angle) * 38;
        const y = 50 + Math.sin(angle) * 38;

        const enemy = this._spawnEnemy('rare', 'grunt');
        if (!enemy) return;

        enemy.isTreasure = true;
        enemy.stats.exp = Math.floor(enemy.stats.exp * 5);
        enemy.stats.hp = Math.floor(enemy.stats.hp * 0.6);
        enemy.stats.maxHp = enemy.stats.hp;
        enemy.element.classList.add('enemy-treasure');
        enemy.element.style.left = `${x}vw`;
        enemy.element.style.top = `${y}vh`;
        enemy.element.title = 'Treasure Chest';
        this.ui.showTreasureHint();
    }

    _startEnemyMovement(enemy) {
        const s = this.state;
        if (enemy.moveAnimationId) s.cancelAnimation(enemy.moveAnimationId);

        let ex = parseFloat(enemy.element.style.left);
        let ey = parseFloat(enemy.element.style.top);

        const animate = () => {
            if (s.gamePaused || s.gameOver) return;

            if (enemy.frozen) {
                enemy.moveAnimationId = requestAnimationFrame(animate);
                s.trackAnimation(enemy.moveAnimationId);
                return;
            }

            const { x: px, y: py } = this.ui.getPlayerPosition();
            const behavior = enemy.typeConfig.behavior;
            const now = Date.now();
            let speed = enemy.stats.moveSpeed;

            if (behavior === 'dash' && !enemy.dashing && now - enemy.lastDashTime >= (enemy.typeConfig.dashCooldown || 3000)) {
                enemy.dashing = true;
                enemy.lastDashTime = now;
                speed *= enemy.typeConfig.dashSpeed || 2.5;
                const dashTimeout = setTimeout(() => { enemy.dashing = false; }, 400);
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

            enemy.moveAnimationId = requestAnimationFrame(animate);
            s.trackAnimation(enemy.moveAnimationId);
        };

        animate();
    }

    _attackNearestEnemy(fromX, fromY, excludeTarget = null, remainingBounce = null, attackOpts = {}) {
        const s = this.state;
        let nearest = null;
        let minDist = s.stats.attackRange;

        s.enemies.forEach(enemy => {
            if (excludeTarget && enemy.id === excludeTarget.id) return;
            const ex = parseFloat(enemy.element.style.left);
            const ey = parseFloat(enemy.element.style.top);
            const dist = distanceVw(fromX, fromY, ex, ey, window.innerWidth, window.innerHeight);
            if (dist <= s.stats.attackRange && dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });

        if (!nearest) return;

        if (!excludeTarget && !attackOpts.skipPlayerAnim) {
            s.lastAttackTime = Date.now();
            this.effects.triggerAttackAnimation(this.ui.els.player);
            this.effects.flashAttackRange(this.ui.els.attackRange);
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
                bullet.moveAnimationId = requestAnimationFrame(animate);
                s.trackAnimation(bullet.moveAnimationId);
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

        const { damage, isCritical } = calculatePlayerDamage({
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

        hitEnemy.stats.hp -= damage;
        const ex = parseFloat(hitEnemy.element.style.left);
        const ey = parseFloat(hitEnemy.element.style.top);

        this.effects.triggerEnemyHitAnimation(hitEnemy.element);
        this.effects.spawnHitEffect(ex, ey, isCritical ? 'crit' : 'physical');
        this.effects.spawnDamageNumber(ex, ey - 2, damage, isCritical);

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
    _dealSkillDamageToEnemy(hitEnemy, damage, element, isCrit = false) {
        const s = this.state;
        if (rollEnemyEvade(hitEnemy.stats.evadeChance)) {
            const ex = parseFloat(hitEnemy.element.style.left);
            const ey = parseFloat(hitEnemy.element.style.top);
            this.effects.spawnDamageNumber(ex, ey - 2, 'MISS', false);
            return { damage: 0, missed: true };
        }

        damage = this.characterPassives?.modifySkillDamage(damage, element) ?? damage;
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
        this.effects.applyBurnAura(enemy.element);
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].burn = {
            damagePerTick: totalBurnDamage / 6,
            endTime: Date.now() + duration,
            lastTick: Date.now()
        };
    }

    _applySlow(enemy, slowPercent, duration) {
        const s = this.state;
        this.effects.applyFrostAura(enemy.element);
        enemy.stats.moveSpeed = enemy.baseMoveSpeed * (1 - slowPercent / 100);
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].slow = { endTime: Date.now() + duration };
    }

    _applyFreeze(enemy, duration) {
        const s = this.state;
        enemy.frozen = true;
        if (!s.statusEffects[enemy.id]) s.statusEffects[enemy.id] = {};
        s.statusEffects[enemy.id].freeze = { endTime: Date.now() + duration };
    }

    _enemyAttackPlayer(enemy) {
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
            const damage = calculatePlayerIncomingDamage({
                enemyDamage: enemy.stats.physicalDamage,
                playerArmour: s.stats.armour,
                damageReductionLevel: abilities.damageReductionLevel,
                ignoreArmour: Boolean(enemy.stats.ignoreArmour)
            });

            s.stats.hp -= this.characterPassives?.absorbDamage(damage) ?? damage;
            this._onPlayerDamaged();

            if (s.abilityList.Reflect.level > 0) {
                this._dealDamageToEnemy(enemy, true, false);
            }
        }
    }

    _fireEnemyProjectile(enemy) {
        const s = this.state;
        const el = document.createElement('div');
        el.className = 'enemy-projectile';
        const ex = parseFloat(enemy.element.style.left);
        const ey = parseFloat(enemy.element.style.top);
        el.style.left = `${ex}vw`;
        el.style.top = `${ey}vh`;
        this.ui.els.gameContainer.appendChild(el);

        const ignoreArmour = Boolean(enemy.stats.ignoreArmour);

        this.enemyProjectiles.track(el, () => {
            const { x: px, y: py } = this.ui.getPlayerPosition();
            const bx = parseFloat(el.style.left);
            const by = parseFloat(el.style.top);
            const angle = Math.atan2(py - by, px - bx);
            const nx = bx + Math.cos(angle) * 1.5;
            const ny = by + Math.sin(angle) * 1.5;
            el.style.left = `${nx}vw`;
            el.style.top = `${ny}vh`;

            const dist = distanceVw(nx, ny, px, py, window.innerWidth, window.innerHeight);
            if (dist < 30) {
                if (!rollChance(s.stats.evade)) {
                    const abilities = this._getAbilityLevels();
                    const damage = calculatePlayerIncomingDamage({
                        enemyDamage: enemy.stats.physicalDamage,
                        playerArmour: s.stats.armour,
                        damageReductionLevel: abilities.damageReductionLevel,
                        ignoreArmour
                    });
                    s.stats.hp -= this.characterPassives?.absorbDamage(damage) ?? damage;
                    this._onPlayerDamaged();
                }
                return false;
            }
            return true;
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

            if (enemy.isTreasure) this.treasureEvents?.recordOpen();
            this._tryDropGear(enemy, ex, ey);

            if (s.stats.exp >= s.stats.expThreshold) this._afterExpChange();
            this._checkAchievements();
        }

        this.effects.spawnDeathExplosion(ex, ey, enemy.rarity);
        delete s.statusEffects[enemy.id];

        handleEnemyDeathEffects(this, enemy, ex, ey, grantRewards);

        s.cancelAnimation(enemy.moveAnimationId);
        delete s.enemyAttackCooldown[enemy.id];
        enemy.element.remove();
        const idx = s.enemies.indexOf(enemy);
        if (idx !== -1) s.enemies.splice(idx, 1);
    }

    /** @param {object} enemy @param {number} x @param {number} y */
    _tryDropGear(enemy, x, y) {
        const category = enemy.isTreasure ? 'treasure' : enemy.rarity;
        if (!shouldDropGear(category)) return;

        const ilvl = computeDropIlvl(
            this.state.stats.level,
            this.state.currentDifficultyLevel
        );
        const item = rollLootDrop(category, ilvl);

        if (this.gearLootFilter?.shouldAutoDelete(item.rarity)) {
            return;
        }

        if (!this.gearInventory.addItem(item)) return;

        this.state.itemsLooted += 1;
        this.effects.spawnLootBurst(x, y);
        const r = RARITY_CONFIG[item.rarity];
        this.ui.showGearLoot(item.name, r.cssClass);
        this.gearPanel?.pulseNewLoot();
        this.gearPanel?.refresh();
    }

    _onPlayerDamaged() {
        flashPlayerSprite(this.ui.els.player, 'player-hit', 200);
        shakePlayerAnchor(this.ui.els.playerAnchor);
        this.ui.flashHudBar('hp');
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
        bankExpLevelUps(s);
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
    }
}
