'use client';

import { Suspense, useEffect, useState } from 'react';
import { auth } from '@/infrastructure/firebase/client';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth'; // Import this
import { toast } from 'sonner';

export default function VerifyEmailPage() {
    const [sending, setSending] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // If user is verified, redirect to dashboard
        const unsubscribe = auth?.onAuthStateChanged((user) => {
            if (user?.emailVerified) {
                router.replace('/dashboard');
            }
        });
        return () => unsubscribe && unsubscribe();
    }, [router]);

    const handleResend = async () => {
        const user = auth?.currentUser;
        if (!user) return;

        setSending(true);
        try {
            const res = await fetch('/api/auth/send-verification', {
                method: 'POST',
                body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Usuario'
                }),
            });

            if (!res.ok) throw new Error('Error sending email');
            toast.success('Email enviado correctamente');
        } catch (error) {
            toast.error('Error al enviar el email');
            console.error(error);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-900">Verifica tu correo electrónico</h2>
                <p className="text-gray-600">
                    Te hemos enviado un enlace de confirmación a tu correo.
                    Por favor, revísalo para activar tu cuenta.
                </p>
                <div className="mt-6">
                    <button
                        onClick={handleResend}
                        disabled={sending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {sending ? 'Enviando...' : 'Reenviar Email'}
                    </button>
                </div>
                <div className="mt-4 text-sm">
                    <button onClick={() => router.push('/login')} className="text-blue-600 hover:underline">
                        Volver al login
                    </button>
                </div>
            </div>
        </div>
    );
}
