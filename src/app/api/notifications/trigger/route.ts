import { NextResponse } from 'next/server';
import { emailNotificationService } from '@/infrastructure/services/emailNotificationService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, data, subject, message } = body;

        console.log(`[API] Notification trigger received for event: ${event}`, data);

        if (event === 'test') {
            const result = await emailNotificationService.sendTestEmail(data.recipients);
            return NextResponse.json({ success: result });
        }

        if (event === 'welcomeEmail') {
            const { email, name } = data;
            console.log(`[API] Processing welcomeEmail for: ${email}`);
            if (!email) {
                console.error('[API] Missing email for welcomeEmail');
                return NextResponse.json({ error: 'Missing email for welcome email' }, { status: 400 });
            }
            const result = await emailNotificationService.sendWelcomeEmail(email, name || '');
            console.log(`[API] sendWelcomeEmail result:`, result);
            if (result.success) {
                return NextResponse.json({ success: true });
            } else {
                return NextResponse.json({ success: false, error: result.error }, { status: 400 });
            }
        }

        if (!event || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Delegate to the service (which runs server-side here)
        await emailNotificationService.sendNotification(event, data, subject, message);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error triggering notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
