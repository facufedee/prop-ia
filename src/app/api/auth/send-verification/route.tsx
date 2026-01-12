import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/infrastructure/firebase/admin';
import { postmarkClient } from '@/lib/email';
import { VerificationEmail } from '@/ui/emails/VerificationEmail';
import { renderToStaticMarkup } from 'react-dom/server';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const { uid, email, displayName } = await req.json();

        if (!uid || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!postmarkClient) {
            console.error('Postmark client not configured');
            return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
        }

        // 1. Generate a secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

        // 2. Save token to Firestore (users/{uid}/verification)
        await adminDb.collection('users').doc(uid).collection('verification').doc('email').set({
            token,
            expiresAt,
            createdAt: new Date(),
            verified: false
        });

        // 3. Generate verification link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/api/auth/verify?token=${token}&uid=${uid}`;

        // 4. Render email template
        const emailHtml = renderToStaticMarkup(
            <VerificationEmail verificationLink={ verificationLink } userName = { displayName } />
        );

        // 5. Send email via Postmark
        await postmarkClient.sendEmail({
            "From": "facundo@zetaprop.com.ar",
            "To": email,
            "Subject": "Verifica tu cuenta en ZetaProp",
            "HtmlBody": emailHtml,
            "MessageStream": "outbound"
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error sending verification email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
