/**
 * Procedural Web Audio manager — happy BGM (+ optional MP3 loop) + layered SFX.
 * Volumes are 0–100% (0 = mute).
 *
 * === How to use your own BGM (MP3) ===
 * 1. Put file at:    audio/bgm.mp3
 * 2. Or change path: BGM_MP3_PATH below (also documented in audio/README.md)
 * 3. Raise Music volume above 0%
 * The file loops automatically. If missing/unloadable, a soft pad plays.
 */

/** Drop your looping track here (relative to index.html / site root). */
export const BGM_MP3_PATH = 'audio/bgm.mp3';

const STORAGE_BGM_VOL = 'survivor-audio-bgm-vol';
const STORAGE_SFX_VOL = 'survivor-audio-sfx-vol';

/** Default: music 50%, SFX 100%. */
export const DEFAULT_BGM_VOLUME = 50;
export const DEFAULT_SFX_VOLUME = 100;

/** Wait this long before assuming MP3 failed (large files need time on first load). */
export const BGM_MP3_LOAD_TIMEOUT_MS = 15000;

/** Linear 0–100 → soft-ish gain curve (perceived loudness). */
export function volumePercentToGain(percent) {
    const p = clampVolume(percent) / 100;
    if (p <= 0) return 0;
    return Math.pow(p, 1.35) * 0.9;
}

export function clampVolume(percent) {
    const n = Number(percent);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * @typedef {'attack'|'hurt'|'kill'|'loot'|'levelup'|'ui'|
 *   'fireball'|'iceNova'|'lightningArc'|'poisonBottle'|'healingWave'|
 *   'frostbolt'|'righteousFire'|'spark'|'illusion'|'skill'} SfxId
 */

export class AudioManager {
    constructor() {
        /** @type {AudioContext|null} */
        this.ctx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        /** @type {Array<AudioNode>} */
        this._bgmNodes = [];
        /** @type {number|null} */
        this._bgmIntervalId = null;
        /** @type {AudioBuffer|null} */
        this._noiseBuffer = null;
        /** @type {HTMLAudioElement|null} */
        this._bgmAudioEl = null;
        /** @type {MediaElementAudioSourceNode|null} */
        this._bgmMediaSource = null;
        this._usingMp3 = false;
        /** @type {ReturnType<typeof setTimeout>|null} */
        this._mp3FallbackTimer = null;

        this.bgmVolume = DEFAULT_BGM_VOLUME;
        this.sfxVolume = DEFAULT_SFX_VOLUME;
        this._unlocked = false;
        this._bgmStep = 0;
        this._loadPrefs();
    }

    _loadPrefs() {
        try {
            const bgm = localStorage.getItem(STORAGE_BGM_VOL);
            const sfx = localStorage.getItem(STORAGE_SFX_VOL);
            if (bgm !== null) {
                this.bgmVolume = clampVolume(bgm);
            } else {
                const legacy = localStorage.getItem('survivor-audio-bgm-muted');
                this.bgmVolume = legacy === '0' ? 45 : DEFAULT_BGM_VOLUME;
            }
            if (sfx !== null) {
                this.sfxVolume = clampVolume(sfx);
            } else {
                const legacy = localStorage.getItem('survivor-audio-sfx-muted');
                this.sfxVolume = legacy === '1' ? 0 : DEFAULT_SFX_VOLUME;
            }
        } catch (_) { /* ignore */ }
    }

    _savePrefs() {
        try {
            localStorage.setItem(STORAGE_BGM_VOL, String(this.bgmVolume));
            localStorage.setItem(STORAGE_SFX_VOL, String(this.sfxVolume));
        } catch (_) { /* ignore */ }
    }

    getBgmVolume() {
        return this.bgmVolume;
    }

    getSfxVolume() {
        return this.sfxVolume;
    }

    isBgmMuted() {
        return this.bgmVolume <= 0;
    }

    isSfxMuted() {
        return this.sfxVolume <= 0;
    }

    isUsingMp3Bgm() {
        return this._usingMp3;
    }

    /**
     * @param {number} percent 0–100
     * @returns {number} applied volume
     */
    setBgmVolume(percent) {
        const next = clampVolume(percent);
        const wasSilent = this.bgmVolume <= 0;
        this.bgmVolume = next;
        this._savePrefs();
        this._applyVolumes();
        if (next > 0 && this._unlocked) {
            if (wasSilent || (!this._bgmNodes.length && !this._usingMp3)) this.startBgm();
        } else if (next <= 0) {
            this.stopBgm();
        }
        return this.bgmVolume;
    }

    /**
     * @param {number} percent 0–100
     * @returns {number} applied volume
     */
    setSfxVolume(percent) {
        this.sfxVolume = clampVolume(percent);
        this._savePrefs();
        this._applyVolumes();
        return this.sfxVolume;
    }

    /** Call after first user gesture to unlock AudioContext. */
    async unlock() {
        if (this._unlocked) {
            if (this.ctx?.state === 'suspended') {
                try { await this.ctx.resume(); } catch (_) { /* ignore */ }
            }
            this._ensureBgmPlaying();
            return this.ctx;
        }

        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;

        this.ctx = new AC();
        this.masterGain = this.ctx.createGain();
        this.bgmGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.masterGain.gain.value = 1;
        this._noiseBuffer = this._createNoiseBuffer(1.2);
        this._applyVolumes();
        this._unlocked = true;

        this._ensureBgmPlaying();
        return this.ctx;
    }

    /** Start or resume BGM when volume is up and audio is unlocked. */
    _ensureBgmPlaying() {
        if (!this._unlocked || this.bgmVolume <= 0) return;
        if (this._usingMp3 && this._bgmAudioEl && !this._bgmAudioEl.paused) return;
        if (this._usingMp3 && this._bgmAudioEl?.paused) {
            this._bgmAudioEl.play().catch(() => { /* ignore */ });
            return;
        }
        if (!this._usingMp3 && !this._bgmNodes.length) this.startBgm();
    }

    _applyVolumes() {
        if (!this.bgmGain || !this.sfxGain) return;
        this.bgmGain.gain.value = volumePercentToGain(this.bgmVolume) * 1.15;
        this.sfxGain.gain.value = volumePercentToGain(this.sfxVolume);
        if (this._bgmAudioEl) {
            this._bgmAudioEl.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
        }
    }

    _createNoiseBuffer(seconds = 1) {
        if (!this.ctx) return null;
        const len = Math.floor(this.ctx.sampleRate * seconds);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
        return buf;
    }

    /**
     * Prefer looping MP3 at BGM_MP3_PATH; fall back to fun procedural track.
     */
    startBgm() {
        if (!this.ctx || this.bgmVolume <= 0) return;
        if (this._usingMp3 || this._bgmNodes.length) return;
        this._tryStartMp3Bgm();
    }

    _clearMp3FallbackTimer() {
        if (this._mp3FallbackTimer != null) {
            clearTimeout(this._mp3FallbackTimer);
            this._mp3FallbackTimer = null;
        }
    }

    _tryStartMp3Bgm() {
        if (typeof Audio === 'undefined') {
            this._startProceduralHappyBgm();
            return;
        }

        let settled = false;
        const fail = () => {
            if (settled) return;
            settled = true;
            this._clearMp3FallbackTimer();
            if (this._bgmAudioEl) {
                try {
                    this._bgmAudioEl.pause();
                    this._bgmAudioEl.removeAttribute('src');
                    this._bgmAudioEl.load?.();
                } catch (_) { /* ignore */ }
                this._bgmAudioEl = null;
            }
            this._usingMp3 = false;
            this._startProceduralHappyBgm();
        };

        const el = new Audio(BGM_MP3_PATH);
        el.loop = true;
        el.preload = 'auto';
        el.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
        this._bgmAudioEl = el;

        const onPlaying = () => {
            if (settled) return;
            settled = true;
            this._clearMp3FallbackTimer();
            this._usingMp3 = true;
            el.volume = Math.min(1, volumePercentToGain(this.bgmVolume));
        };

        const tryPlay = () => {
            if (settled || this._usingMp3 || this.bgmVolume <= 0) return;
            try {
                const playPromise = el.play();
                if (playPromise && typeof playPromise.then === 'function') {
                    playPromise.then(onPlaying).catch(fail);
                } else {
                    onPlaying();
                }
            } catch (_) {
                fail();
            }
        };

        el.addEventListener('error', fail, { once: true });
        el.addEventListener('loadeddata', tryPlay, { once: true });
        el.addEventListener('canplay', tryPlay, { once: true });
        el.addEventListener('canplaythrough', tryPlay, { once: true });

        try {
            el.load();
        } catch (_) {
            fail();
            return;
        }

        this._clearMp3FallbackTimer();
        this._mp3FallbackTimer = setTimeout(() => {
            if (!this._usingMp3 && !this._bgmNodes.length && this.bgmVolume > 0 && !settled) {
                fail();
            }
        }, BGM_MP3_LOAD_TIMEOUT_MS);
    }

    /** Soft major-key pad only — no arpeggio beeps / noise (avoids machine tune). */
    _startProceduralHappyBgm() {
        if (!this.ctx || this.bgmVolume <= 0 || this._bgmNodes.length || this._usingMp3) return;

        const now = this.ctx.currentTime;

        // Very soft sine chord pad (laptop-speaker friendly)
        [
            { f: 130.81, g: 0.014 },
            { f: 196.00, g: 0.01 },
            { f: 261.63, g: 0.012 },
            { f: 329.63, g: 0.008 }
        ].forEach(({ f, g }) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            osc.type = 'sine';
            osc.frequency.value = f;
            filter.type = 'lowpass';
            filter.frequency.value = 650;
            filter.Q.value = 0.4;
            gain.gain.value = g;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.bgmGain);
            osc.start(now);
            this._bgmNodes.push(osc, filter, gain);
        });

        // Slow gentle swell on the highest pad — no discrete note ticks
        this._bgmStep = 0;
        this._bgmIntervalId = setInterval(() => this._swellHappyBgmPad(), 2400);
    }

    /** Soft amplitude swell — musical, not a beep metronome. */
    _swellHappyBgmPad() {
        if (!this.ctx || this.bgmVolume <= 0 || this._usingMp3 || !this.bgmGain) return;
        const t = this.ctx.currentTime;
        // Light secondary sine swell (not a short hard attack pluck)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.value = 392.00;
        filter.type = 'lowpass';
        filter.frequency.value = 900;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.012, t + 0.35);
        gain.gain.linearRampToValueAtTime(0.0001, t + 1.8);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(t);
        osc.stop(t + 1.9);
    }

    stopBgm() {
        this._clearMp3FallbackTimer();
        if (this._bgmIntervalId != null) {
            clearInterval(this._bgmIntervalId);
            this._bgmIntervalId = null;
        }
        if (this._bgmAudioEl) {
            try {
                this._bgmAudioEl.pause();
                this._bgmAudioEl.currentTime = 0;
            } catch (_) { /* ignore */ }
            this._bgmAudioEl = null;
        }
        this._usingMp3 = false;
        this._bgmNodes.forEach(node => {
            try {
                if ('stop' in node && typeof node.stop === 'function') node.stop();
                node.disconnect?.();
            } catch (_) { /* ignore */ }
        });
        this._bgmNodes = [];
    }

    /**
     * @param {SfxId|string} type
     */
    playSfx(type) {
        if (!this.ctx || this.sfxVolume <= 0) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (type) {
            case 'attack':
            case 'hit':
                this._sfxAttack();
                break;
            case 'hurt': this._sfxHurt(); break;
            case 'kill': this._sfxKill(); break;
            case 'loot': this._sfxLoot(); break;
            case 'levelup': this._sfxLevelUp(); break;
            case 'ui': this._sfxUi(); break;
            case 'fireball':
            case 'righteousFire':
                this._sfxFire();
                break;
            case 'iceNova':
            case 'frostbolt':
                this._sfxIce(type === 'iceNova');
                break;
            case 'lightningArc':
            case 'spark':
                this._sfxLightning();
                break;
            case 'poisonBottle':
            case 'poisonDagger':
                this._sfxPoison();
                break;
            case 'hammerSweep':
                this._sfxPhysicalImpact();
                break;
            case 'throwSpear':
                this._sfxSpear();
                break;
            case 'healingWave':
                this._sfxHeal();
                break;
            case 'illusion':
                this._sfxIllusion();
                break;
            case 'skill':
                this._sfxUi();
                break;
            default:
                break;
        }
    }

    /** @param {string} skillId */
    playSkillSfx(skillId) {
        this.playSfx(skillId);
    }

    // --- Layered SFX ---

    /** Realistic sword/arrow cut — slash noise + steel body. */
    _sfxAttack() {
        this._noiseBurst({ dur: 0.045, vol: 0.14, filterFreq: 3200, filterType: 'bandpass', slideFilter: 900 });
        this._tone({ freq: 220, dur: 0.08, type: 'sawtooth', vol: 0.12, slide: -0.45, filterFreq: 1600 });
        this._tone({ freq: 780, dur: 0.035, type: 'triangle', vol: 0.08, slide: -0.25, filterFreq: 4000, delay: 0.01 });
        this._noiseBurst({ dur: 0.03, vol: 0.06, filterFreq: 5000, filterType: 'highpass', delay: 0.02 });
    }

    /** Heavy hammer thud. */
    _sfxPhysicalImpact() {
        this._tone({ freq: 90, dur: 0.12, type: 'sine', vol: 0.16, slide: -0.35, filterFreq: 500 });
        this._noiseBurst({ dur: 0.08, vol: 0.12, filterFreq: 700, filterType: 'lowpass' });
        this._tone({ freq: 180, dur: 0.06, type: 'triangle', vol: 0.08, delay: 0.02, slide: -0.2 });
    }

    /** Spear whoosh + impact. */
    _sfxSpear() {
        this._noiseBurst({ dur: 0.07, vol: 0.1, filterFreq: 2800, filterType: 'bandpass', slideFilter: 1200 });
        this._tone({ freq: 340, dur: 0.09, type: 'triangle', vol: 0.11, slide: -0.3, filterFreq: 1800 });
        this._tone({ freq: 160, dur: 0.05, type: 'sine', vol: 0.07, delay: 0.04 });
    }

    _sfxHurt() {
        this._tone({ freq: 110, dur: 0.16, type: 'sine', vol: 0.14, slide: -0.25, filterFreq: 400 });
        this._noiseBurst({ dur: 0.1, vol: 0.05, filterFreq: 500, filterType: 'lowpass' });
    }

    _sfxKill() {
        this._tone({ freq: 360, dur: 0.06, type: 'triangle', vol: 0.12, slide: 0.15 });
        this._tone({ freq: 540, dur: 0.1, type: 'sine', vol: 0.1, slide: 0.2, delay: 0.04 });
    }

    _sfxLoot() {
        this._tone({ freq: 880, dur: 0.07, type: 'sine', vol: 0.11, slide: 0.05 });
        this._tone({ freq: 1175, dur: 0.1, type: 'triangle', vol: 0.09, delay: 0.05 });
        this._tone({ freq: 1480, dur: 0.12, type: 'sine', vol: 0.07, delay: 0.1 });
    }

    _sfxLevelUp() {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
            this._tone({ freq: f, dur: 0.16, type: 'sine', vol: 0.11 - i * 0.012, delay: i * 0.08 });
        });
    }

    _sfxUi() {
        this._tone({ freq: 720, dur: 0.04, type: 'sine', vol: 0.08 });
    }

    /** Fire whoosh + crackle. */
    _sfxFire() {
        this._noiseBurst({ dur: 0.2, vol: 0.18, filterFreq: 1200, filterType: 'bandpass', slideFilter: 3000 });
        this._tone({ freq: 140, dur: 0.14, type: 'sawtooth', vol: 0.11, slide: 0.55, filterFreq: 900 });
        this._noiseBurst({ dur: 0.09, vol: 0.08, filterFreq: 3500, filterType: 'highpass', delay: 0.04 });
    }

    /** Ice: crystalline ping + crunch. */
    _sfxIce(isNova) {
        this._tone({ freq: 920, dur: 0.08, type: 'sine', vol: 0.12, slide: -0.08 });
        this._tone({ freq: 1380, dur: 0.1, type: 'triangle', vol: 0.09, slide: -0.12, delay: 0.02 });
        this._noiseBurst({
            dur: isNova ? 0.14 : 0.08,
            vol: 0.11,
            filterFreq: 4200,
            filterType: 'bandpass',
            delay: 0.01
        });
        if (isNova) {
            this._tone({ freq: 640, dur: 0.14, type: 'sine', vol: 0.08, slide: -0.3, delay: 0.06 });
        }
    }

    _sfxLightning() {
        this._tone({ freq: 1800, dur: 0.04, type: 'square', vol: 0.1, slide: -0.5, filterFreq: 5000 });
        this._tone({ freq: 640, dur: 0.06, type: 'sawtooth', vol: 0.09, slide: -0.35, filterFreq: 2500 });
        this._noiseBurst({ dur: 0.05, vol: 0.1, filterFreq: 6000, filterType: 'highpass' });
    }

    _sfxPoison() {
        this._tone({ freq: 220, dur: 0.1, type: 'sine', vol: 0.12, slide: -0.2, filterFreq: 700 });
        this._tone({ freq: 140, dur: 0.14, type: 'triangle', vol: 0.09, delay: 0.04, slide: 0.15 });
        this._noiseBurst({ dur: 0.08, vol: 0.07, filterFreq: 900, filterType: 'lowpass', delay: 0.05 });
        this._noiseBurst({ dur: 0.05, vol: 0.05, filterFreq: 1600, filterType: 'bandpass', delay: 0.1 });
    }

    _sfxHeal() {
        this._tone({ freq: 523.25, dur: 0.18, type: 'sine', vol: 0.1 });
        this._tone({ freq: 659.25, dur: 0.2, type: 'sine', vol: 0.08, delay: 0.05 });
        this._tone({ freq: 783.99, dur: 0.22, type: 'triangle', vol: 0.06, delay: 0.1 });
    }

    _sfxIllusion() {
        this._tone({ freq: 480, dur: 0.12, type: 'triangle', vol: 0.09, slide: 0.25 });
        this._tone({ freq: 720, dur: 0.16, type: 'sine', vol: 0.07, delay: 0.05, slide: 0.2 });
        this._noiseBurst({ dur: 0.1, vol: 0.04, filterFreq: 2200, filterType: 'bandpass', delay: 0.02 });
    }

    /**
     * @param {object} opts
     */
    _tone(opts) {
        if (!this.ctx || !this.sfxGain) return;
        const {
            freq, dur, type = 'sine', vol = 0.1, slide = 0, delay = 0, filterFreq = 0
        } = opts;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slide) {
            osc.frequency.linearRampToValueAtTime(Math.max(20, freq * (1 + slide)), t + dur);
        }

        let node = /** @type {AudioNode} */ (osc);
        if (filterFreq > 0) {
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = filterFreq;
            osc.connect(filter);
            node = filter;
        }

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02, dur));
        node.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t);
        osc.stop(t + dur + 0.03);
    }

    /**
     * @param {object} opts
     */
    _noiseBurst(opts) {
        if (!this.ctx || !this.sfxGain || !this._noiseBuffer) return;
        const {
            dur = 0.1,
            vol = 0.1,
            filterFreq = 2000,
            filterType = 'bandpass',
            delay = 0,
            slideFilter = 0
        } = opts;

        const t = this.ctx.currentTime + delay;
        const src = this.ctx.createBufferSource();
        src.buffer = this._noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.setValueAtTime(filterFreq, t);
        if (slideFilter > 0) {
            filter.frequency.linearRampToValueAtTime(slideFilter, t + dur);
        }
        filter.Q.value = filterType === 'bandpass' ? 1.2 : 0.7;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.03, dur));
        src.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        src.start(t);
        src.stop(t + dur + 0.02);
    }
}
