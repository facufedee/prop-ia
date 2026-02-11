import { NextResponse } from 'next/server';
import { emailNotificationService } from '@/infrastructure/services/emailNotificationService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, data, subject, message } = body;

        if (event === 'test') {
            const result = await emailNotificationService.sendTestEmail(data.recipients);
            return NextResponse.json({ success: result });
        }

        if (!event || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Delegate to the service (which runs server-side here)
        await emailNotificationService.sendNotification(event, data, subject, message);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error triggering notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
