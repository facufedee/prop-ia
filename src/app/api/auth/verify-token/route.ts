import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/infrastructure/firebase/admin';

export async function POST(req: Request) {
    try {
        const { token, uid } = await req.json();

        if (!token || !uid) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const verificationRef = adminDb.collection('users').doc(uid).collection('verification').doc('email');
        const docSnap = await verificationRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 400 });
        }

        const data = docSnap.data();

        if (!data || data.token !== token) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
        }

        if (data.verified) {
            return NextResponse.json({ message: 'Ya verificado' });
        }

        const now = new Date();
        const expiresAt = data.expiresAt.toDate(); // Firestore Timestamp

        if (now > expiresAt) {
            return NextResponse.json({ error: 'El token ha expirado' }, { status: 400 });
        }

        // Token is valid!
        // 1. Update Firestore verification status
        await verificationRef.update({
            verified: true,
            verifiedAt: new Date()
        });

        // 2. Update User Document
        await adminDb.collection('users').doc(uid).update({
            emailVerified: true
        });

        // 3. Update Firebase Auth verification status
        await adminAuth.updateUser(uid, {
            emailVerified: true
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error verifying token:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
