import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/infrastructure/firebase/admin';
import { marketingEmailService, EmailTemplateType } from '@/infrastructure/services/marketingEmailService';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, to, data } = body as {
            type: EmailTemplateType;
            to: string;
            data: Record<string, any>;
        };

        if (!type || !to) {
            return NextResponse.json({ error: 'Missing type or to' }, { status: 400 });
        }

        switch (type) {
            case 'welcome':
                await marketingEmailService.sendWelcomeEmail(to, data);
                break;
            case 'payment_confirmed':
                await marketingEmailService.sendPaymentConfirmedEmail(to, data);
                break;
            case 'payment_expiring':
                await marketingEmailService.sendPaymentExpiringEmail(to, data);
                break;
            case 'new_lead':
                await marketingEmailService.sendNewLeadEmail(to, data);
                break;
            default:
                await marketingEmailService.sendCustomEmail(to, type, data);
                break;
        }

        return NextResponse.json({ success: true, type });
    } catch (error: any) {
        console.error('[API /marketing/send] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
}
