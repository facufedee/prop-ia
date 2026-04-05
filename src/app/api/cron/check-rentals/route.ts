import { NextRequest, NextResponse } from 'next/server';
import { alquileresService } from '@/infrastructure/services/alquileresService';
import { notificationService } from '@/infrastructure/services/notificationService';
import { verifyCronSecret } from '@/lib/apiAuth';

export async function GET(request: NextRequest) {
    const authError = verifyCronSecret(request);
    if (authError) return authError;
    try {
        const alquileres = await alquileresService.getAllActiveAlquileres();
        let count = 0;

        // Strip out the time to only compare at the start of the current day
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const alquiler of alquileres) {
            if (!alquiler.fechaFin) continue;

            const fechaFin = new Date(alquiler.fechaFin);
            fechaFin.setHours(0, 0, 0, 0);

            // Calculate remaining days
            const diasRestantes = Math.round((fechaFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            // Notify exactly when they are 30, 15, 5 or 0 days away
            if (diasRestantes === 30 || diasRestantes === 15 || diasRestantes === 5 || diasRestantes === 0 || diasRestantes === -1) {
                const message = diasRestantes <= 0 ?
                    `El contrato de "${alquiler.direccion}" ha vencido o vence el día de hoy. Por favor, regulariza la situación con el inquilino.` :
                    `El contrato de "${alquiler.direccion}" vence el ${alquiler.fechaFin.toLocaleDateString()}. Faltan ${diasRestantes} días.`;

                await notificationService.createNotification(
                    diasRestantes <= 0 ? "Contrato Vencido" : `Contrato por Vencer (${diasRestantes} días)`,
                    message,
                    diasRestantes <= 5 ? 'error' : 'warning',
                    undefined,
                    `/dashboard/alquileres`, // Links to Rentals dashboard for easy access
                    alquiler.userId
                );

                count++;
            }
        }

        return NextResponse.json({ success: true, checked: alquileres.length, notifiedCount: count });
    } catch (error) {
        console.error('[API Cron] Error checking expiring contracts:', error);
        return NextResponse.json({ error: 'Failed to check contracts' }, { status: 500 });
    }
}
