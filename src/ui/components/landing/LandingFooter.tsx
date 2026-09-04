import Link from "next/link";

export default function LandingFooter() {
    return (
        <footer className="l-footer">
            <div className="l-footer__row">
                <span className="l-footer__word">Zeta Prop — Gestión Inteligente para Inmobiliarias</span>
                <ul className="l-footer__links">
                    <li><Link href="/precios">Precios</Link></li>
                    <li><Link href="/terminos">Términos</Link></li>
                    <li><Link href="/privacidad">Privacidad</Link></li>
                    <li>© {new Date().getFullYear()}</li>
                </ul>
            </div>
        </footer>
    );
}
