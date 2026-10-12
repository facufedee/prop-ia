import Link from "next/link";
import { Instagram, Linkedin, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/ui/icons/WhatsAppIcon";
import NewsletterSignupForm from "./NewsletterSignupForm";

const EXPLORE = [
    { href: "/alquileres", label: "Gestión de alquileres" },
    { href: "/propiedades-gestion", label: "Administración de propiedades" },
    { href: "/pagina-web", label: "Página web" },
    { href: "/precios", label: "Precios" },
    { href: "/blog", label: "Blog" },
];

const COMPANY = [
    { href: "/nosotros", label: "Nosotros" },
    { href: "/contacto", label: "Contacto" },
    { href: "/faqs", label: "Preguntas frecuentes" },
];

const LEGAL = [
    { href: "/terminos", label: "Términos de uso" },
    { href: "/privacidad", label: "Privacidad" },
    { href: "/cookies", label: "Cookies" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string }[] }) {
    return (
        <div>
            <h2 className="l-site-footer__title">{title}</h2>
            <ul className="l-site-footer__list">
                {links.map((link) => (
                    <li key={link.href}>
                        <Link href={link.href}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function Footer() {
    return (
        <footer className="l-site-footer">
            <div className="l-site-footer__inner">
                <div className="l-site-footer__grid">
                    <div className="l-site-footer__brand">
                        <Link href="/" className="l-nav__word">
                            Zeta<span>Prop</span>
                        </Link>
                        <p>Software para inmobiliarias: alquileres, propiedades y tu propia web en un solo lugar.</p>
                        <div className="l-site-footer__contact">
                            <a href="mailto:zetaprop.com.ar@gmail.com">
                                <Mail size={16} aria-hidden /> zetaprop.com.ar@gmail.com
                            </a>
                            <a href="https://wa.me/5491123889745" target="_blank" rel="noopener noreferrer">
                                <WhatsAppIcon className="h-4 w-4" /> +54 9 11 2388-9745
                            </a>
                        </div>
                        <div className="l-site-footer__social">
                            <a href="https://www.instagram.com/zeta_prop" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.linkedin.com/company/zetaprop" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <Linkedin size={18} />
                            </a>
                        </div>
                    </div>

                    <Column title="Producto" links={EXPLORE} />
                    <Column title="Empresa" links={COMPANY} />

                    <div>
                        <h2 className="l-site-footer__title">Newsletter</h2>
                        <p className="l-site-footer__note">Novedades del mercado y de la plataforma, sin spam.</p>
                        <NewsletterSignupForm />
                    </div>
                </div>

                <div className="l-site-footer__bottom">
                    <p>© {new Date().getFullYear()} Zeta Prop. Hecho en Ituzaingó, Buenos Aires.</p>
                    <ul className="l-site-footer__legal">
                        {LEGAL.map((link) => (
                            <li key={link.href}>
                                <Link href={link.href}>{link.label}</Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
}
