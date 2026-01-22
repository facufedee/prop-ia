'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

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
            <div className="text-center text-red-600">
                Link inválido. Faltan parámetros.
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            {verifying ? (
                <div className="text-xl">Verificando tu cuenta...</div>
            ) : (
                <div className="text-xl">Redirigiendo...</div>
            )}
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <VerifyContent />
        </Suspense>
    );
}
