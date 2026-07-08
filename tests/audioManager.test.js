import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    AudioManager,
    clampVolume,
    volumePercentToGain,
    DEFAULT_BGM_VOLUME,
    DEFAULT_SFX_VOLUME,
    BGM_MP3_PATH,
    BGM_MP3_LOAD_TIMEOUT_MS
} from '../js/systems/audioManager.js';

function createMockAudioContext() {
    const nodes = [];
    const createGain = () => {
        const g = {
            gain: {
                value: 0,
                setValueAtTime() {},
                linearRampToValueAtTime() {},
                exponentialRampToValueAtTime() {}
            },
            connect() { return g; },
            disconnect() {}
        };
        nodes.push(g);
        return g;
    };
    const createOscillator = () => {
        const o = {
            type: 'sine',
            frequency: {
                value: 440,
                setValueAtTime() {},
                linearRampToValueAtTime() {}
            },
            connect() { return o; },
            disconnect() {},
            start() {},
            stop() {}
        };
        nodes.push(o);
        return o;
    };
    const createBiquadFilter = () => {
        const f = {
            type: 'lowpass',
            Q: { value: 1 },
            frequency: {
                value: 1000,
                setValueAtTime() {},
                linearRampToValueAtTime() {}
            },
            connect() { return f; },
            disconnect() {}
        };
        nodes.push(f);
        return f;
    };
    const createBufferSource = () => {
        const s = {
            buffer: null,
            connect() { return s; },
            start() {},
            stop() {}
        };
        nodes.push(s);
        return s;
    };

    return class MockAudioContext {
        constructor() {
            this.state = 'running';
            this.currentTime = 0;
            this.destination = {};
            this.sampleRate = 44100;
            this._nodes = nodes;
        }
        createGain = createGain;
        createOscillator = createOscillator;
        createBiquadFilter = createBiquadFilter;
        createBufferSource = createBufferSource;
        createBuffer(channels, length, rate) {
            return {
                getChannelData: () => new Float32Array(length)
            };
        }
        resume() { this.state = 'running'; return Promise.resolve(); }
    };
}

describe('audio volume helpers', () => {
    it('clamps volume to 0–100', () => {
        expect(clampVolume(-10)).toBe(0);
        expect(clampVolume(150)).toBe(100);
        expect(clampVolume(42.6)).toBe(43);
        expect(clampVolume(NaN)).toBe(0);
    });

    it('maps 0% to silent gain and 100% to audible gain', () => {
        expect(volumePercentToGain(0)).toBe(0);
        expect(volumePercentToGain(100)).toBeGreaterThan(0.5);
        expect(volumePercentToGain(50)).toBeGreaterThan(0);
        expect(volumePercentToGain(50)).toBeLessThan(volumePercentToGain(100));
    });

    it('defaults music to 50% and sfx to 100%', () => {
        expect(DEFAULT_BGM_VOLUME).toBe(50);
        expect(DEFAULT_SFX_VOLUME).toBe(100);
    });
});

describe('AudioManager', () => {
    beforeEach(() => {
        vi.stubGlobal('localStorage', {
            store: {},
            getItem(k) { return this.store[k] ?? null; },
            setItem(k, v) { this.store[k] = String(v); }
        });
        const MockAC = createMockAudioContext();
        vi.stubGlobal('window', {
            AudioContext: MockAC,
            webkitAudioContext: undefined
        });
        // Force procedural BGM path in unit tests (no real MP3).
        vi.stubGlobal('Audio', undefined);
        vi.useFakeTimers();
    });

    it('exposes a stable MP3 drop path and generous load timeout', () => {
        expect(BGM_MP3_PATH).toBe('audio/bgm.mp3');
        expect(BGM_MP3_LOAD_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
    });

    it('defaults background music to 50% and sfx to 100%', () => {
        const audio = new AudioManager();
        expect(audio.getBgmVolume()).toBe(50);
        expect(audio.isBgmMuted()).toBe(false);
        expect(audio.getSfxVolume()).toBe(100);
    });

    it('persists volume percent values', async () => {
        const audio = new AudioManager();
        await audio.unlock();
        audio.setBgmVolume(55);
        audio.setSfxVolume(30);
        const audio2 = new AudioManager();
        expect(audio2.getBgmVolume()).toBe(55);
        expect(audio2.getSfxVolume()).toBe(30);
    });

    it('starts happy procedural bgm when music volume rises above 0', async () => {
        const audio = new AudioManager();
        audio.setBgmVolume(0);
        await audio.unlock();
        expect(audio._bgmNodes.length).toBe(0);
        audio.setBgmVolume(40);
        expect(audio._bgmNodes.length).toBeGreaterThan(0);
        expect(audio.isUsingMp3Bgm()).toBe(false);
        audio.setBgmVolume(0);
        expect(audio._bgmNodes.length).toBe(0);
    });

    it('plays skill-specific and combat sfx without throwing', async () => {
        const audio = new AudioManager();
        await audio.unlock();
        audio.setSfxVolume(80);
        const ids = [
            'attack', 'hurt', 'kill', 'loot', 'levelup', 'ui',
            'fireball', 'iceNova', 'lightningArc', 'poisonBottle',
            'healingWave', 'frostbolt', 'righteousFire', 'spark', 'illusion',
            'poisonDagger', 'hammerSweep', 'throwSpear'
        ];
        ids.forEach(id => {
            expect(() => audio.playSfx(id)).not.toThrow();
        });
        expect(() => audio.playSkillSfx('fireball')).not.toThrow();
        expect(() => audio.playSkillSfx('poisonBottle')).not.toThrow();
        expect(() => audio.playSkillSfx('hammerSweep')).not.toThrow();
    });

    it('silences sfx at 0%', async () => {
        const audio = new AudioManager();
        await audio.unlock();
        audio.setSfxVolume(0);
        expect(() => audio.playSfx('attack')).not.toThrow();
        expect(audio.isSfxMuted()).toBe(true);
    });

    it('does not throw before unlock', () => {
        const audio = new AudioManager();
        expect(() => audio.playSfx('ui')).not.toThrow();
        expect(() => audio.playSkillSfx('iceNova')).not.toThrow();
    });
});
