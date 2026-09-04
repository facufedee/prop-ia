"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const LINKS = [
    { href: "/precios", label: "Precios" },
    { href: "/servicios", label: "Servicios" },
    { href: "/nosotros", label: "Nosotros" },
];

export default function LandingNav() {
    const [open, setOpen] = useState(false);

    return (
        <>
            <nav className="l-nav" aria-label="Principal">
                <div className="l-nav__pill">
                    <Link href="/" className="l-nav__word">
                        Zeta<span>Prop</span>
                    </Link>
                    <ul className="l-nav__links">
                        {LINKS.map((l) => (
                            <li key={l.href}>
                                <Link href={l.href}>{l.label}</Link>
                            </li>
                        ))}
                        <li>
                            <Link href="/login">Iniciar sesión</Link>
                        </li>
                    </ul>
                    <Link href="/register" className="l-nav__cta">
                        Probar gratis
                    </Link>
                    <button
                        type="button"
                        className="l-nav__toggle"
                        onClick={() => setOpen((o) => !o)}
                        aria-label={open ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={open}
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {open && (
                <div className="l-nav__sheet" role="menu">
                    {LINKS.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} role="menuitem">
                            {l.label}
                        </Link>
                    ))}
                    <Link href="/login" onClick={() => setOpen(false)} role="menuitem">
                        Iniciar sesión
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} role="menuitem">
                        Probar gratis
                    </Link>
                </div>
            )}
        </>
    );
}
