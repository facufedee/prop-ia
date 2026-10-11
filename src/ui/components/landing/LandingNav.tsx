"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { LayoutDashboard, LogOut, Menu, Settings, User as UserIcon, X } from "lucide-react";
import { auth } from "@/infrastructure/firebase/client";
import { useAuth } from "@/ui/context/AuthContext";

const LINKS = [
    { href: "/servicios", label: "Servicios" },
    { href: "/precios", label: "Precios" },
    { href: "/propiedades", label: "Propiedades" },
    { href: "/blog", label: "Blog" },
    { href: "/nosotros", label: "Nosotros" },
];

export default function LandingNav() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!profileOpen) return;
        const onClick = (event: MouseEvent) => {
            if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setProfileOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileOpen]);

    const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
    const displayName = user?.displayName || user?.email?.split("@")[0] || "Usuario";
    const handleSignOut = () => {
        setProfileOpen(false);
        setOpen(false);
        if (auth) signOut(auth);
    };

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
                                <Link href={l.href} aria-current={isActive(l.href) ? "page" : undefined}>
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                        {!user && (
                            <li>
                                <Link href="/login">Iniciar sesión</Link>
                            </li>
                        )}
                    </ul>

                    {user ? (
                        <div className="l-nav__profile" ref={profileRef}>
                            <button
                                type="button"
                                className="l-nav__avatar"
                                onClick={() => setProfileOpen((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={profileOpen}
                                aria-label={`Cuenta de ${displayName}`}
                            >
                                {user.photoURL ? (
                                    <Image src={user.photoURL} alt="" width={32} height={32} />
                                ) : (
                                    <UserIcon size={16} aria-hidden />
                                )}
                            </button>
                            {profileOpen && (
                                <div className="l-nav__menu" role="menu">
                                    <div className="l-nav__menu-head">
                                        <p>{displayName}</p>
                                        {user.email && <p>{user.email}</p>}
                                    </div>
                                    <Link href="/dashboard" role="menuitem" onClick={() => setProfileOpen(false)}>
                                        <LayoutDashboard size={16} aria-hidden />
                                        Ir al panel
                                    </Link>
                                    <Link href="/dashboard/cuenta" role="menuitem" onClick={() => setProfileOpen(false)}>
                                        <Settings size={16} aria-hidden />
                                        Modificar datos
                                    </Link>
                                    <button type="button" role="menuitem" onClick={handleSignOut} className="is-danger">
                                        <LogOut size={16} aria-hidden />
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}

                    <Link href={user ? "/dashboard" : "/register"} className="l-nav__cta">
                        {user ? "Ir al panel" : "Probar gratis"}
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
                    {user ? (
                        <>
                            <Link href="/dashboard/cuenta" onClick={() => setOpen(false)} role="menuitem">
                                Modificar datos
                            </Link>
                            <button type="button" onClick={handleSignOut} role="menuitem">
                                Cerrar sesión
                            </button>
                        </>
                    ) : (
                        <Link href="/login" onClick={() => setOpen(false)} role="menuitem">
                            Iniciar sesión
                        </Link>
                    )}
                </div>
            )}
        </>
    );
}
