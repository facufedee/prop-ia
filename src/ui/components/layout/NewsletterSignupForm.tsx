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
            <p className="text-sm text-green-400" role="status">
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
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                <input
                    type="email"
                    name="email"
                    required
                    aria-label="Tu email"
                    placeholder="Tu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
            </div>
            <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors"
            >
                {status === "submitting" ? "Enviando..." : "Suscribirme"}
            </button>
            {status === "error" && (
                <p className="text-sm text-red-400" role="alert">
                    {errorMsg}
                </p>
            )}
        </form>
    );
}
