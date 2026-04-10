import { NextResponse } from 'next/server';
import { emailNotificationService } from '@/infrastructure/services/emailNotificationService';
import { marketingEmailService } from '@/infrastructure/services/marketingEmailService';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { event, data, subject, message, recipientEmail } = body;

        console.log(`[API] Notification trigger received for event: ${event}`, { ...data, recipientEmail });

        if (event === 'test') {
            const result = await emailNotificationService.sendTestEmail(data.recipients || [recipientEmail]);
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

        if (event === 'marketingEmail') {
            const { email, name, templateKey } = data;
            console.log(`[API] Processing marketingEmail (${templateKey}) for: ${email}`);
            if (!email || !templateKey) {
                console.error('[API] Missing email or templateKey for marketingEmail');
                return NextResponse.json({ error: 'Missing email or templateKey' }, { status: 400 });
            }
            try {
                await marketingEmailService.sendCustomEmail(
                    email,
                    templateKey,
                    { userName: name || '' }
                );
                console.log(`[API] sendCustomEmail success for ${email}`);
                return NextResponse.json({ success: true });
            } catch (err: any) {
                console.error(`[API] sendCustomEmail error:`, err);
                return NextResponse.json({ success: false, error: err.message }, { status: 400 });
            }
        }

        if (!event || !subject || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Delegate to the service (which runs server-side here)
        await emailNotificationService.sendNotification(event, data, subject, message, recipientEmail);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[API] Error triggering notification:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
