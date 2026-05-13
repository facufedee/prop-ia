"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";

const GoogleAuthPrompt = dynamic(() => import("./GoogleAuthPrompt"), {
    ssr: false,
});

// Wrapping in a mounted guard prevents the server/client Suspense boundary mismatch
// that happens when a Server Component renders a dynamic(ssr:false) Client Component
// without an explicit Suspense in the tree.
export default function GoogleAuthPromptLazy() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <Suspense fallback={null}>
            <GoogleAuthPrompt />
        </Suspense>
    );
}
