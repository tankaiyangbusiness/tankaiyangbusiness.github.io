import { describe, it, expect } from 'vitest';
import { computeTooltipPlacement } from '../js/utils/tooltipClamp.js';

describe('computeTooltipPlacement', () => {
    const bounds = { left: 100, right: 500, top: 50, bottom: 400, width: 400, height: 350 };

    it('shifts tooltip right when clipped on the left edge', () => {
        const tip = { left: 80, right: 280, top: 200, bottom: 260, width: 200, height: 60 };
        const { shiftX, placement } = computeTooltipPlacement(tip, bounds, 10);
        expect(shiftX).toBe(30);
        expect(placement).toBe('below');
    });

    it('shifts tooltip left when clipped on the right edge', () => {
        const tip = { left: 420, right: 520, top: 200, bottom: 260, width: 100, height: 60 };
        const { shiftX } = computeTooltipPlacement(tip, bounds, 10);
        expect(shiftX).toBe(-30);
    });

    it('flips above when clipped on the bottom edge', () => {
        const tip = { left: 200, right: 400, top: 360, bottom: 420, width: 200, height: 60 };
        const { placement } = computeTooltipPlacement(tip, bounds, 10);
        expect(placement).toBe('above');
    });
});
