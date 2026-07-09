import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ENEMY_GUIDE_ENTRIES, getEnemyGuideEntry } from '../js/config/enemyGuide.js';
import { ENEMY_TYPES } from '../js/config/enemies.js';
import { EnemyGuidePanel } from '../js/ui/enemyGuidePanel.js';

function createMockGuideDom() {
    const classes = new Set();
    const root = {
        classList: {
            add: (cls) => classes.add(cls),
            remove: (...names) => names.forEach(name => classes.delete(name)),
            toggle: (cls, on) => (on ? classes.add(cls) : classes.delete(cls))
        },
        get classes() {
            return classes;
        }
    };
    const toggleBtn = {
        setAttribute: vi.fn(),
        addEventListener: vi.fn(),
        getBoundingClientRect: () => ({ left: 900, right: 934, top: 20, bottom: 54 })
    };
    const body = { innerHTML: '' };
    return { root, toggleBtn, body, classes };
}

describe('enemy guide', () => {
    it('documents every spawnable enemy type with color and behavior', () => {
        const typeKeys = Object.keys(ENEMY_TYPES).filter(
            type => ENEMY_TYPES[type].spawnable !== false
        );
        expect(ENEMY_GUIDE_ENTRIES.length).toBe(typeKeys.length);
        typeKeys.forEach(type => {
            const entry = getEnemyGuideEntry(type);
            expect(entry.label).toBeTruthy();
            expect(entry.color).toMatch(/^#[0-9a-f]{6}$/i);
            expect(entry.description.length).toBeGreaterThan(5);
        });
    });

    it('returns fallback for unknown types', () => {
        const entry = getEnemyGuideEntry('unknown');
        expect(entry.type).toBe('unknown');
    });

    it('hides the panel while paused', () => {
        const panel = Object.create(EnemyGuidePanel.prototype);
        panel.expanded = false;
        panel._pausedHidden = false;
        panel.root = { classList: { toggle: () => {}, remove: () => {} } };
        panel.toggleBtn = { setAttribute: () => {} };

        panel.setPausedHidden(true);
        expect(panel.isPausedHidden()).toBe(true);
        panel.setPausedHidden(false);
        expect(panel.isPausedHidden()).toBe(false);
    });

    it('clears stale pause-hidden class when constructed after ESC pause', () => {
        const { root, toggleBtn, body, classes } = createMockGuideDom();
        classes.add('enemy-guide-panel--paused-hidden');
        classes.add('expanded');

        vi.stubGlobal('document', {
            getElementById: (id) => {
                if (id === 'enemy-guide-panel') return root;
                if (id === 'enemy-guide-toggle') return toggleBtn;
                if (id === 'enemy-guide-body') return body;
                return null;
            }
        });

        const panel = new EnemyGuidePanel();
        expect(classes.has('enemy-guide-panel--paused-hidden')).toBe(false);
        expect(classes.has('expanded')).toBe(false);
        expect(panel.isPausedHidden()).toBe(false);

        vi.unstubAllGlobals();
    });

    it('prefers right-side placement on desktop when space allows', () => {
        const { root, toggleBtn } = createMockGuideDom();
        const panel = Object.create(EnemyGuidePanel.prototype);
        panel.root = root;
        panel.toggleBtn = toggleBtn;

        panel._updateBodyPlacement(1280);
        expect(root.classes.has('placement-right')).toBe(true);
    });

    it('centers the panel on mobile-width viewports', () => {
        const { root, toggleBtn } = createMockGuideDom();
        const panel = Object.create(EnemyGuidePanel.prototype);
        panel.root = root;
        panel.toggleBtn = toggleBtn;

        panel._updateBodyPlacement(480);
        expect(root.classes.has('placement-center')).toBe(true);
    });
});
