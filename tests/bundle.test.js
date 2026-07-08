import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const bundlePath = path.join(root, 'game.bundle.js');

describe('browser bundle', () => {
    it('game.bundle.js exists (run npm run build if missing)', () => {
        expect(existsSync(bundlePath)).toBe(true);
    });

    it('bundle is a self-contained IIFE without ES module imports', () => {
        const bundle = readFileSync(bundlePath, 'utf-8');
        expect(bundle.length).toBeGreaterThan(1000);
        expect(bundle).not.toMatch(/import\s+/);
        expect(bundle).not.toMatch(/export\s+/);
        expect(bundle).toContain('DOMContentLoaded');
        expect(bundle).toContain('Adventurer');
        expect(bundle).toContain('bankExpLevelUps');
        expect(bundle).toContain('UpgradePanel');
        expect(bundle).toContain('Summoner');
        expect(bundle).toContain('GearInventory');
        expect(bundle).toContain('generateGearItem');
    });

    it('index.html references the bundle, not ES modules', () => {
        const html = readFileSync(path.join(root, 'index.html'), 'utf-8');
        expect(html).toContain('game.bundle.js');
        expect(html).not.toContain('type="module"');
    });
});
