'use client';

import { MoveLeft } from 'lucide-react';
import { PrimaryCta } from '@/ui/sections/PhotoHero';

export default function NotFound() {
    return (
        <main className="flex-1">
            <section className="l-section s-status" aria-labelledby="not-found-title">
                <div className="s-status__inner">
                    {/* Main Error */}
                    <p className="s-status__code" aria-hidden="true">404</p>

                    {/* Message */}
                    <h1 id="not-found-title" className="s-page-title">
                        Página no encontrada
                    </h1>
                    <p className="s-page-lede">
                        Lo sentimos, no pudimos encontrar la página que estás buscando. Puede que haya sido movida o eliminada.
                    </p>

                    {/* Actions */}
                    <div className="s-status__actions">
                        <PrimaryCta href="/">Volver al inicio</PrimaryCta>

                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="l-btn l-btn--secondary cursor-pointer font-[inherit]"
                        >
                            <MoveLeft className="h-4 w-4" aria-hidden />
                            Regresar
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}
