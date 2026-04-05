"use client";

import dynamic from "next/dynamic";

// Deferred: keeps Firebase auth iframe out of the critical render path
const GoogleAuthPrompt = dynamic(() => import("./GoogleAuthPrompt"), {
    ssr: false,
    loading: () => null,
});

export default function GoogleAuthPromptLazy() {
    return <GoogleAuthPrompt />;
}
