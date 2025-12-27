import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-gray-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <img
                            src="/assets/img/logo_web_propia_fondoNegro.png"
                            alt="PROP-IA"
                            className="h-10 w-auto"
                        />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            La plataforma integral para inmobiliarias modernas. Tasaciones con IA, gestión de alquileres, CRM y sitios web automáticos. Todo lo que necesitas para escalar tu negocio en un solo lugar.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://instagram.com/propia.argentina" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition"><Instagram className="w-5 h-5" /></a>
                            <a href="https://www.linkedin.com/company/propia-arg" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Producto</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/#features" className="hover:text-white transition">Gestión de Propiedades</Link></li>
                            <li><Link href="/#features" className="hover:text-white transition">CRM Inmobiliario</Link></li>
                            <li><Link href="/#features" className="hover:text-white transition">Contratos Digitales</Link></li>
                            <li><Link href="/#features" className="hover:text-white transition">Agenda Inteligente</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Compañía</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/" className="hover:text-white transition">Inicio</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                            <li><Link href="/#contact" className="hover:text-white transition">Contacto</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/privacidad" className="hover:text-white transition">Privacidad</Link></li>
                            <li><Link href="/terminos" className="hover:text-white transition">Términos de Uso</Link></li>
                            <li><Link href="/cookies" className="hover:text-white transition">Política de Cookies</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} PROP-IA. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="text-right">
                            Creado por ingenieros expertos en el mercado inmobiliario <br />
                            Hecho con ❤️ en Buenos Aires, Argentina
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
