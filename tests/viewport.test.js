import { describe, it, expect } from 'vitest';
import {
    MOBILE_BREAKPOINT_PX,
    isMobileViewport,
    panelsStartCollapsed
} from '../js/utils/viewport.js';

describe('viewport utils', () => {
    it('defines mobile breakpoint at 768px', () => {
        expect(MOBILE_BREAKPOINT_PX).toBe(768);
    });

    it('detects mobile viewport width', () => {
        expect(isMobileViewport(768)).toBe(true);
        expect(isMobileViewport(375)).toBe(true);
        expect(isMobileViewport(769)).toBe(false);
        expect(isMobileViewport(1920)).toBe(false);
    });

    it('panels start collapsed only on mobile widths', () => {
        expect(panelsStartCollapsed(500)).toBe(true);
        expect(panelsStartCollapsed(768)).toBe(true);
        expect(panelsStartCollapsed(1024)).toBe(false);
    });
});
