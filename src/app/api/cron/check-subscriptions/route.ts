import { NextResponse } from 'next/server';
import { adminDb } from '@/infrastructure/firebase/admin';
import { marketingEmailService } from '@/infrastructure/services/marketingEmailService';

/**
 * Cron job: Check subscriptions expiring in 7 days and send reminder emails.
 * Call this endpoint daily via a cron service (e.g., Vercel Cron, GitHub Actions).
 * GET /api/cron/check-subscriptions
 */
export async function GET(request: Request) {
    try {
        // Optional: Verify cron secret header for security
        // const cronSecret = request.headers.get('x-cron-secret');
        // if (cronSecret !== process.env.CRON_SECRET) {
        //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const now = new Date();
        // Target: subscriptions expiring in exactly 7 days (±12h window)
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const windowStart = new Date(sevenDaysFromNow);
        windowStart.setHours(0, 0, 0, 0);

        const windowEnd = new Date(sevenDaysFromNow);
        windowEnd.setHours(23, 59, 59, 999);

        // Query active subscriptions ending in the 7-day window
        const { Timestamp } = await import('firebase-admin/firestore');

        const subscriptionsSnap = await adminDb
            .collection('subscriptions')
            .where('status', '==', 'active')
            .where('endDate', '>=', Timestamp.fromDate(windowStart))
            .where('endDate', '<=', Timestamp.fromDate(windowEnd))
            .get();

        let notifiedCount = 0;
        const errors: string[] = [];

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
                    daysLeft: 7,
                });

                notifiedCount++;
                console.log(`[Cron check-subscriptions] Sent expiry reminder to ${email} for user ${userId}`);
            } catch (err: any) {
                console.error(`[Cron check-subscriptions] Error for user ${userId}:`, err.message);
                errors.push(userId);
            }
        }

        return NextResponse.json({
            success: true,
            checked: subscriptionsSnap.size,
            notified: notifiedCount,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error: any) {
        console.error('[Cron check-subscriptions] Fatal error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
