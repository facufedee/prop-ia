'use client';

import { Suspense, useEffect, useState } from 'react';
import { auth } from '@/infrastructure/firebase/client';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth'; // Import this
import { toast } from 'sonner';
import { Mail } from 'lucide-react';

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
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-labelledby="verify-email-title">
                <div className="s-util-mark">
                    <Mail aria-hidden="true" />
                </div>
                <h1 id="verify-email-title" className="s-util-title">Verifica tu correo electrónico</h1>
                <p className="s-util-text">
                    Te hemos enviado un enlace de confirmación a tu correo.
                    Por favor, revísalo para activar tu cuenta.
                </p>
                <div className="s-util-actions">
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={sending}
                        className="s-auth-submit"
                    >
                        {sending ? 'Enviando...' : 'Reenviar Email'}
                    </button>
                    <button type="button" onClick={() => router.push('/login')} className="s-util-link">
                        Volver al login
                    </button>
                </div>
            </section>
        </main>
    );
}
