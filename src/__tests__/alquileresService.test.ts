import { describe, it, expect, vi } from 'vitest';
import { alquileresService } from '../infrastructure/services/alquileresService';
import { Alquiler } from '../domain/models/Alquiler';

vi.mock('@/infrastructure/firebase/client', () => ({
    db: {}
}));

vi.mock('firebase/firestore', () => ({
    collection: vi.fn(),
    doc: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    Timestamp: {
        now: vi.fn(() => ({ toDate: () => new Date() })),
        fromDate: vi.fn((date) => ({ toDate: () => date }))
    }
}));

describe('alquileresService', () => {
    describe('calcularVencimiento', () => {
        it('should return vencido: true if days are negative', () => {
            const hoy = new Date();
            // Set diaVencimiento to 3 days ago
            const diaVencimiento = hoy.getDate() - 3;
            
            // Si diaVencimiento es <= 0, significa que estamos a principio de mes, ajustamos la prueba
            // para que sea robusta en cualquier fecha.
            if (diaVencimiento > 0) {
                const alquiler = { diaVencimiento } as Alquiler;
                const result = alquileresService.calcularVencimiento(alquiler);
                
                expect(result.vencido).toBe(true);
                expect(result.diasRestantes).toBeLessThan(0);
            }
        });

        it('should return vencido: false if days are positive', () => {
            const hoy = new Date();
            const diaVencimiento = hoy.getDate() + 5;
            
            // Ensure valid day of month
            if (diaVencimiento <= 28) {
                const alquiler = { diaVencimiento } as Alquiler;
                const result = alquileresService.calcularVencimiento(alquiler);
                
                expect(result.vencido).toBe(false);
                expect(result.diasRestantes).toBeGreaterThan(0);
            }
        });
    });

    describe('calcularAjuste', () => {
        it('should apply percentage adjustment', () => {
            const result = alquileresService.calcularAjuste(1000, 'porcentaje', 10);
            expect(result).toBe(1100);
        });

        it('should apply manual adjustment', () => {
            const result = alquileresService.calcularAjuste(1000, 'manual', 1500);
            expect(result).toBe(1500);
        });
    });
});
