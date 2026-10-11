// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { canonicalLinkHeader } from '@/lib/seo/canonical';

const MAIN = 'zetaprop.com.ar';

describe('canonicalLinkHeader', () => {
    it('lets pages on the main domain declare their own canonical', () => {
        expect(canonicalLinkHeader({ host: MAIN, pathname: '/blog', mainDomain: MAIN, isAgencySite: false })).toBeNull();
    });

    it('points agency subdomains to themselves, using the public path', () => {
        expect(
            canonicalLinkHeader({ host: 'garcia.zetaprop.com.ar', pathname: '/propiedades', mainDomain: MAIN, isAgencySite: true }),
        ).toBe('<https://garcia.zetaprop.com.ar/propiedades>; rel="canonical"');
    });

    it('points verified custom domains to themselves', () => {
        expect(
            canonicalLinkHeader({ host: 'garciapropiedades.com.ar', pathname: '/', mainDomain: MAIN, isAgencySite: true }),
        ).toBe('<https://garciapropiedades.com.ar/>; rel="canonical"');
    });

    it('normalizes host case and strips the port', () => {
        expect(
            canonicalLinkHeader({ host: 'Garcia.ZetaProp.com.ar:443', pathname: '/x', mainDomain: MAIN, isAgencySite: true }),
        ).toBe('<https://garcia.zetaprop.com.ar/x>; rel="canonical"');
    });

    it('points platform aliases (www, previews) to the main domain', () => {
        for (const host of ['www.zetaprop.com.ar', 'prop-ia--abc.us-central1.hosted.app', 'prop-ia.vercel.app']) {
            expect(canonicalLinkHeader({ host, pathname: '/precios', mainDomain: MAIN, isAgencySite: false })).toBe(
                '<https://zetaprop.com.ar/precios>; rel="canonical"',
            );
        }
    });

    it('returns null when the host is unknown', () => {
        expect(canonicalLinkHeader({ host: '', pathname: '/', mainDomain: MAIN, isAgencySite: false })).toBeNull();
    });
});
