import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/infrastructure/firebase/admin';
import { marketingEmailService } from '@/infrastructure/services/marketingEmailService';
import { verifyCronSecret } from '@/lib/apiAuth';

/**
 * Cron job: Check subscriptions expiring in 7 days and send reminder emails.
 * Call this endpoint daily via a cron service (e.g., Vercel Cron, GitHub Actions).
 * GET /api/cron/check-subscriptions
 * Requires header: x-cron-secret: <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
    const authError = verifyCronSecret(request);
    if (authError) return authError;

    try {

        const now = new Date();
        const intervals = [7, 3];

        let notifiedCount = 0;
        const errors: string[] = [];
        const { Timestamp } = await import('firebase-admin/firestore');

        for (const daysLeft of intervals) {
            const targetDate = new Date(now);
            targetDate.setDate(targetDate.getDate() + daysLeft);

            const windowStart = new Date(targetDate);
            windowStart.setHours(0, 0, 0, 0);

            const windowEnd = new Date(targetDate);
            windowEnd.setHours(23, 59, 59, 999);

            // Query active subscriptions ending in the specific window
            const subscriptionsSnap = await adminDb
                .collection('subscriptions')
                .where('status', '==', 'active')
                .where('endDate', '>=', Timestamp.fromDate(windowStart))
                .where('endDate', '<=', Timestamp.fromDate(windowEnd))
                .get();

            for (const subDoc of subscriptionsSnap.docs) {
                const sub = subDoc.data();
                const userId = sub.userId;
                const planName = sub.planId || 'Plan ZetaProp';
                const endDate = sub.endDate?.toDate();

                if (!userId || !endDate) continue;

                try {
                    // Get user email and name from Firestore
                    const userSnap = await adminDb.collection('users').doc(userId).get();
                    if (!userSnap.exists) continue;

                    const userData = userSnap.data();
                    const email = userData?.email;
                    const displayName = userData?.displayName || userData?.name;

                    if (!email) continue;

                    const expiryDateFormatted = endDate.toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    });

                    await marketingEmailService.sendPaymentExpiringEmail(email, {
                        userName: displayName,
                        planName,
                        expiryDate: expiryDateFormatted,
                        daysLeft,
                    });

                    notifiedCount++;
                    console.log(`[Cron check-subscriptions] Sent ${daysLeft}-day expiry reminder to ${email} for user ${userId}`);
                } catch (err: any) {
                    console.error(`[Cron check-subscriptions] Error for user ${userId}:`, err.message);
                    errors.push(userId);
                }
            }
        }

        return NextResponse.json({
            success: true,
            notified: notifiedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error('[Cron check-subscriptions] Fatal error:', error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
