"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Footer newsletter signup (double opt-in). Posts to /api/newsletter/subscribe;
 * the API answers the same for every valid address, so success always means
 * "check your inbox".
 */
export default function NewsletterSignupForm() {
    const [email, setEmail] = useState("");
    const [website, setWebsite] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (status === "submitting") return;
        setStatus("submitting");
        setErrorMsg("");

        try {
            const res = await fetch("/api/newsletter/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, website }),
            });

            if (res.ok) {
                setStatus("success");
                setEmail("");
                return;
            }

            setStatus("error");
            setErrorMsg(
                res.status === 400
                    ? "Revisá que el email esté bien escrito."
                    : "No pudimos procesar tu suscripción. Intentá de nuevo en unos minutos."
            );
        } catch {
            setStatus("error");
            setErrorMsg("No pudimos procesar tu suscripción. Intentá de nuevo en unos minutos.");
        }
    };

    if (status === "success") {
        return (
            <p className="text-sm text-[var(--color-positive)]" role="status">
                ¡Listo! Revisá tu correo para confirmar la suscripción.
            </p>
        );
    }

    return (
        <form className="space-y-3" onSubmit={handleSubmit}>
            {/* Honeypot: hidden from people, bots that fill it are ignored by the API. */}
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>
                    Sitio web
                    <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                    />
                </label>
            </div>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[var(--color-muted)]" aria-hidden />
                <input
                    type="email"
                    name="email"
                    required
                    aria-label="Tu email"
                    placeholder="Tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full rounded-full border border-[var(--color-rule)] bg-[var(--color-paper-3)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-accent)] focus:outline-none"
                />
            </div>
            <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-[var(--color-accent-ink)] transition-colors hover:bg-[var(--color-accent-2)] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {status === "submitting" ? "Enviando..." : "Suscribirme"}
            </button>
            {status === "error" && (
                <p className="text-sm text-[var(--color-danger)]" role="alert">
                    {errorMsg}
                </p>
            )}
        </form>
    );
}
