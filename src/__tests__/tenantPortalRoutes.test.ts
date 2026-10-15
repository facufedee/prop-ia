// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- reads the fake store exposed by the mocked module */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { createFakeAdminDb } from './helpers/fakeAdminDb';

vi.mock('server-only', () => ({}));
vi.mock('firebase-admin/firestore', async () => {
    const { fakeTimestamp } = await import('./helpers/fakeAdminDb');
    return { Timestamp: fakeTimestamp };
});
vi.mock('@/infrastructure/firebase/admin', async () => {
    const { createFakeAdminDb } = await import('./helpers/fakeAdminDb');
    const fake = createFakeAdminDb();
    return { adminDb: fake.adminDb, adminAuth: {}, __fake: fake };
});

let fake: ReturnType<typeof createFakeAdminDb>;
const ts = (iso: string) => ({ toDate: () => new Date(iso) });

function accessRequest(body: unknown, ip = '203.0.113.1') {
    return new NextRequest('https://zetaprop.com.ar/api/inquilino/acceso', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify(body),
    });
}

function detailRequest(id: string, token?: string) {
    return new NextRequest(`https://zetaprop.com.ar/api/inquilino/${id}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
    });
}

describe('tenant portal API (Admin SDK)', () => {
    beforeEach(async () => {
        vi.useRealTimers();
        process.env.PORTAL_JWT_SECRET = 'test-portal-secret';
        fake = ((await import('@/infrastructure/firebase/admin')) as any).__fake;
        fake.docs.clear();
        fake.docs.set('alquileres/rent1', {
            userId: 'owner1',
            codigoAlquiler: 'ROJAS-207',
            dniInquilino: '30123456',
            nombreInquilino: 'Ana Pérez',
            nombrePropietario: 'Juan Gómez',
            emailPropietario: 'juan@example.com',
            direccion: 'Rojas 207',
            propiedadTipo: 'Departamento',
            estado: 'activo',
            montoMensual: 250000,
            diaVencimiento: 10,
            fechaInicio: ts('2026-01-01T12:00:00Z'),
            fechaFin: ts('2028-01-01T12:00:00Z'),
            cbuPropietario: '0000003100000000000001',
            garantes: [{ nombre: 'G', dni: '1' }],
            historialPagos: [
                {
                    id: 'p1',
                    mes: '2026-01',
                    monto: 250000,
                    estado: 'pagado',
                    fechaVencimiento: ts('2026-01-10T12:00:00Z'),
                    fechaPago: ts('2026-01-08T12:00:00Z'),
                    nroComprobante: 'X-1',
                },
            ],
        });
    });

    it('valid code (any case, padded) + DNI returns a token, then the detail returns only portal fields', async () => {
        const { POST } = await import('../app/api/inquilino/acceso/route');
        const res = await POST(accessRequest({ codigo: '  rojas-207 ', dni: '30123456' }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.alquilerId).toBe('rent1');
        expect(Object.keys(body).sort()).toEqual(['alquilerId', 'token']);

        const { GET } = await import('../app/api/inquilino/[id]/route');
        const detail = await GET(detailRequest('rent1', body.token), { params: Promise.resolve({ id: 'rent1' }) });
        expect(detail.status).toBe(200);
        const rental = await detail.json();
        expect(rental).toMatchObject({
            id: 'rent1',
            codigoAlquiler: 'ROJAS-207',
            direccion: 'Rojas 207',
            nombreInquilino: 'Ana Pérez',
            dniInquilino: '30123456',
            fechaInicio: '2026-01-01T12:00:00.000Z',
            montoMensual: 250000,
        });
        expect(rental.historialPagos).toEqual([
            {
                id: 'p1',
                mes: '2026-01',
                monto: 250000,
                estado: 'pagado',
                fechaVencimiento: '2026-01-10T12:00:00.000Z',
                fechaPago: '2026-01-08T12:00:00.000Z',
            },
        ]);
        expect(rental).not.toHaveProperty('cbuPropietario');
        expect(rental).not.toHaveProperty('garantes');
        expect(rental).not.toHaveProperty('userId');
    });

    it('wrong code and wrong DNI get the same 401 response', async () => {
        vi.useFakeTimers();
        const { POST } = await import('../app/api/inquilino/acceso/route');

        const wrongCodeP = POST(accessRequest({ codigo: 'NOPE-1', dni: '30123456' }, '203.0.113.2'));
        await vi.advanceTimersByTimeAsync(1000);
        const wrongCode = await wrongCodeP;

        const wrongDniP = POST(accessRequest({ codigo: 'ROJAS-207', dni: '99999999' }, '203.0.113.2'));
        await vi.advanceTimersByTimeAsync(1000);
        const wrongDni = await wrongDniP;

        expect(wrongCode.status).toBe(401);
        expect(wrongDni.status).toBe(401);
        expect(await wrongCode.json()).toEqual({ error: 'Datos incorrectos' });
        expect(await wrongDni.json()).toEqual({ error: 'Datos incorrectos' });
    });

    it('rate limits repeated attempts from one IP', async () => {
        vi.useFakeTimers();
        const { POST } = await import('../app/api/inquilino/acceso/route');
        let last: Response | undefined;
        for (let i = 0; i < 11; i++) {
            const p = POST(accessRequest({ codigo: 'NOPE', dni: '1' }, '203.0.113.9'));
            await vi.advanceTimersByTimeAsync(1000);
            last = await p;
        }
        expect(last!.status).toBe(429);
    });

    it('detail rejects a missing token, a forged token and a token for another rental', async () => {
        fake.docs.set('alquileres/rent2', { codigoAlquiler: 'OTRO-1', dniInquilino: '1', historialPagos: [] });
        const { GET } = await import('../app/api/inquilino/[id]/route');
        const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

        expect((await GET(detailRequest('rent1'), ctx('rent1'))).status).toBe(401);
        expect((await GET(detailRequest('rent1', 'not-a-jwt'), ctx('rent1'))).status).toBe(401);

        const { signTenantToken } = await import('@/infrastructure/services/server/tenantPortalAccess');
        const tokenForRent2 = await signTenantToken('rent2');
        expect((await GET(detailRequest('rent1', tokenForRent2), ctx('rent1'))).status).toBe(401);

        process.env.PORTAL_JWT_SECRET = 'another-secret';
        const forged = await signTenantToken('rent1');
        process.env.PORTAL_JWT_SECRET = 'test-portal-secret';
        expect((await GET(detailRequest('rent1', forged), ctx('rent1'))).status).toBe(401);
    });
});
