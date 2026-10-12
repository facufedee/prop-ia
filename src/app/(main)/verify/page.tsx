'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { AlertCircle, Loader2 } from 'lucide-react';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const uid = searchParams.get('uid');
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        if (!token || !uid) {
            setVerifying(false);
            return;
        }

        const verifyToken = async () => {
            try {
                const res = await fetch('/api/auth/verify-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, uid }),
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Error verificando token');
                }

                toast.success('Email verificado correctamente');
                // Force reload or redirect to update auth state
                window.location.href = '/dashboard?verified=true';
            } catch (error: any) {
                console.error(error);
                toast.error(error.message);
                router.push('/login');
            } finally {
                setVerifying(false);
            }
        };

        verifyToken();
    }, [token, uid, router]);

    if (!token || !uid) {
        return (
            <main className="s-util s-util--center">
                <section className="s-util-card" role="alert">
                    <div className="s-util-mark s-util-mark--danger">
                        <AlertCircle aria-hidden="true" />
                    </div>
                    <h1 className="s-util-title">Link inválido. Faltan parámetros.</h1>
                </section>
            </main>
        );
    }

    return (
        <main className="s-util s-util--center">
            <section className="s-util-card" aria-live="polite">
                <div className="s-util-mark">
                    <Loader2 className="animate-spin" aria-hidden="true" />
                </div>
                {verifying ? (
                    <h1 className="s-util-title">Verificando tu cuenta...</h1>
                ) : (
                    <h1 className="s-util-title">Redirigiendo...</h1>
                )}
            </section>
        </main>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="s-util-loading">Cargando...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
