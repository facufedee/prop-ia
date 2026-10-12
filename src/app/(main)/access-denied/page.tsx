import Link from "next/link";
import { PrimaryCta } from "@/ui/sections/PhotoHero";

export default function AccessDeniedPage() {
    return (
        <main className="flex-1">
            <section className="l-section s-status" aria-labelledby="access-denied-title">
                <div className="s-status__inner">
                    <h1 id="access-denied-title" className="s-page-title">Acceso Denegado</h1>
                    <p className="s-page-lede">
                        Necesitas iniciar sesión o registrarte para acceder a esta página.
                    </p>
                    <div className="s-status__actions">
                        <PrimaryCta href="/login">Iniciar sesión</PrimaryCta>
                        <Link href="/register" className="l-btn l-btn--secondary">
                            Registrarse
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
