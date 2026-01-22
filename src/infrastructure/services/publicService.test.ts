import { describe, it, expect, vi } from 'vitest';

// Mock Firebase Client to avoid initialization errors
vi.mock('@/infrastructure/firebase/client', () => ({
    db: {},
    storage: {},
    auth: {}
}));

import { publicService } from './publicService';

describe('publicService', () => {
    describe('slugify', () => {
        it('should convert text to lowercase', () => {
            expect(publicService.slugify('Hello World')).toBe('hello-world');
        });

        it('should replace spaces with dashes', () => {
            expect(publicService.slugify(' departamento en palermo ')).toBe('departamento-en-palermo');
        });

        it('should remove special characters', () => {
            expect(publicService.slugify('Dueño vende: ¡Increíble Oportunidad!')).toBe('dueno-vende-increible-oportunidad');
        });

        it('should handle multiple dashes', () => {
            expect(publicService.slugify('propiedad -  venta -- urgente')).toBe('propiedad-venta-urgente');
        });

        it('should handle empty strings', () => {
            expect(publicService.slugify('')).toBe('');
        });

        it('should handle accents correctly', () => {
            // Basic slugify usually removes accents or normalizes them. 
            // Let's verify our specific implementation behavior.
            // If the current implementation doesn't normalize accents (e.g. 'á' -> 'a'), 
            // this test might fail or need adjustment. 
            // Based on previous view, it replaced non-word chars. 
            // Let's assume standard behavior or we will fix the implementation.
            expect(publicService.slugify('bambú')).toBe('bambu');
            expect(publicService.slugify('café')).toBe('cafe');
        });
    });
});
