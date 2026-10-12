// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
    absolutePropertyUrl,
    propertyIdFromSlug,
    propertyOperationSegment,
    propertyPath,
    propertySlug,
} from '@/lib/seo/propertyUrl';

describe('propertySlug', () => {
    it('lowercases and joins words with dashes', () => {
        expect(propertySlug('Casa en Venta Moreno')).toBe('casa-en-venta-moreno');
    });

    it('strips accents instead of dropping the accented letters', () => {
        expect(propertySlug('Gestión Ñandú Café')).toBe('gestion-nandu-cafe');
    });

    it('collapses punctuation and repeated separators and trims dashes', () => {
        expect(propertySlug('  ¡Dueño vende! -- 3 amb. / cochera  ')).toBe('dueno-vende-3-amb-cochera');
    });

    it('caps the slug length without leaving a trailing dash', () => {
        const slug = propertySlug('departamento '.repeat(20));
        expect(slug.length).toBeLessThanOrEqual(80);
        expect(slug.endsWith('-')).toBe(false);
        expect(slug.startsWith('departamento-departamento')).toBe(true);
    });

    it('falls back to a generic word when the title has no usable characters', () => {
        expect(propertySlug('')).toBe('propiedad');
        expect(propertySlug('!!!')).toBe('propiedad');
        expect(propertySlug(undefined)).toBe('propiedad');
    });
});

describe('propertyOperationSegment', () => {
    it('maps sale and rent operations', () => {
        expect(propertyOperationSegment('Venta')).toBe('venta');
        expect(propertyOperationSegment('Alquiler')).toBe('alquiler');
    });

    it('treats temporary rentals as rentals', () => {
        expect(propertyOperationSegment('Alquiler Temporal')).toBe('alquiler');
        expect(propertyOperationSegment('temporario')).toBe('alquiler');
    });

    it('defaults anything else to venta', () => {
        expect(propertyOperationSegment(undefined)).toBe('venta');
        expect(propertyOperationSegment('')).toBe('venta');
        expect(propertyOperationSegment('Permuta')).toBe('venta');
    });
});

describe('propertyPath', () => {
    it('builds /{operation}/{slug}-{id}', () => {
        expect(propertyPath({ id: 'abc123XYZ', title: 'Casa en Gestión', operation_type: 'Alquiler' }))
            .toBe('/alquiler/casa-en-gestion-abc123XYZ');
    });

    it('round-trips the id through propertyIdFromSlug', () => {
        const path = propertyPath({ id: 'K9fz2LmQ', title: 'PH 3 ambientes', operation_type: 'Venta' });
        const slug = path.split('/')[2];
        expect(propertyIdFromSlug(slug)).toBe('K9fz2LmQ');
    });

    it('builds the absolute URL on the main domain', () => {
        expect(absolutePropertyUrl({ id: 'id1', title: 'Lote', operation_type: 'Venta' }))
            .toBe('https://zetaprop.com.ar/venta/lote-id1');
    });
});

describe('propertyIdFromSlug', () => {
    it('returns the last dash-separated token', () => {
        expect(propertyIdFromSlug('casa-en-moreno-abc')).toBe('abc');
        expect(propertyIdFromSlug('abc')).toBe('abc');
    });
});
