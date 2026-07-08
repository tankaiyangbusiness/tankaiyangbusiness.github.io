import { describe, it, expect } from 'vitest';
import { getCompanionSvg, COMPANION_SVGS } from '../js/ui/svgSprites.js';
import { buildCompanionModelHtml } from '../js/ui/entityModels.js';

describe('companion models', () => {
    it('provides svg for zombie, bear, and illusion', () => {
        expect(Object.keys(COMPANION_SVGS).sort()).toEqual(['bear', 'illusion', 'zombie']);
        ['zombie', 'bear', 'illusion'].forEach(type => {
            const svg = getCompanionSvg(type);
            expect(svg).toContain('<svg');
            expect(svg).toContain('entity-svg');
        });
    });

    it('builds companion model html shells', () => {
        const zombie = buildCompanionModelHtml('zombie');
        expect(zombie).toContain('companion-zombie');
        expect(zombie).toContain('companion-sprite-zombie');
        expect(zombie).toContain('<svg');

        const bear = buildCompanionModelHtml('bear');
        expect(bear).toContain('companion-bear');

        const illu = buildCompanionModelHtml('illusion', { ranger: true });
        expect(illu).toContain('companion-illusion');
        expect(illu).toContain('companion-illusion-ranger');
    });
});
