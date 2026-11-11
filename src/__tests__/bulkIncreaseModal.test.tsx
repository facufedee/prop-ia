import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const updateAlquiler = vi.fn();
vi.mock('@/infrastructure/services/alquileresService', () => ({
    alquileresService: { updateAlquiler: (...args: unknown[]) => updateAlquiler(...args) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import BulkIncreaseModal from '@/app/(main)/dashboard/alquileres/components/BulkIncreaseModal';

const contract = (overrides: Record<string, unknown> = {}) => ({
    id: 'a',
    estado: 'activo',
    direccion: 'Coronel Paulino Rojas 207',
    nombreInquilino: 'Facundo',
    fechaInicio: new Date(2026, 7, 1),
    fechaFin: new Date(2028, 6, 31),
    diaVencimiento: 10,
    montoMensual: 100000,
    ajusteTipo: 'IPC',
    ajusteValor: 0,
    ajusteFrecuencia: 3,
    historialPagos: [],
    ...overrides,
} as any);

describe('BulkIncreaseModal', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date(2026, 10, 12));
        updateAlquiler.mockReset().mockResolvedValue(undefined);
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ years: { 2026: { 8: 2, 9: 3, 10: 1 } } }) }));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('prefills the official IPC and saves the new rent for every selected contract', async () => {
        const onApplied = vi.fn();
        render(<BulkIncreaseModal contracts={[contract(), contract({ id: 'b', direccion: 'Rodríguez Peña 2380' })]} onClose={vi.fn()} onApplied={onApplied} />);

        expect(await screen.findByLabelText('Porcentaje para Coronel Paulino Rojas 207')).toHaveValue('6,1');
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar 2 aumentos' }));

        await waitFor(() => expect(onApplied).toHaveBeenCalled());
        expect(updateAlquiler).toHaveBeenCalledTimes(2);
        expect(updateAlquiler).toHaveBeenCalledWith('a', expect.objectContaining({ montoMensual: 106100 }));
    });

    it('skips unchecked contracts and keeps going when one fails', async () => {
        updateAlquiler.mockRejectedValueOnce(new Error('permission-denied'));
        const onApplied = vi.fn();
        render(<BulkIncreaseModal contracts={[contract(), contract({ id: 'b', direccion: 'Rodríguez Peña 2380' }), contract({ id: 'c', direccion: 'Wenceslao de Tata 4672' })]} onClose={vi.fn()} onApplied={onApplied} />);

        fireEvent.click(await screen.findByLabelText('Aplicar aumento a Wenceslao de Tata 4672'));
        fireEvent.click(screen.getByRole('button', { name: 'Aplicar 2 aumentos' }));

        await waitFor(() => expect(updateAlquiler).toHaveBeenCalledTimes(2));
        expect(updateAlquiler.mock.calls.map(c => c[0])).toEqual(['a', 'b']);
        expect(await screen.findByLabelText('No se pudo aplicar')).toBeInTheDocument();
        expect(onApplied).not.toHaveBeenCalled();
    });
});
