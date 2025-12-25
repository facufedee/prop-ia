import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-gray-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white">PROP-IA</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            La plataforma de inteligencia artificial líder para tasaciones inmobiliarias en Argentina.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white transition"><Facebook className="w-5 h-5" /></a>
                            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white transition"><Twitter className="w-5 h-5" /></a>
                            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white transition"><Instagram className="w-5 h-5" /></a>
                            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Producto</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/#features" className="hover:text-white transition">Características</Link></li>
                            <li><Link href="/#pricing" className="hover:text-white transition">Precios</Link></li>
                            <li><Link href="/dashboard/tasacion" className="hover:text-white transition">Tasador IA</Link></li>
                            <li><Link href="/api-docs" className="hover:text-white transition">API</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-white mb-4">Compañía</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li><Link href="/about" className="hover:text-white transition">Sobre Nosotros</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition">Carreras</Link></li>
                            <li><Link href="/contact" className="hover:text-white transition">Contacto</Link></li>
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
                        <span>Hecho con ❤️ en Buenos Aires</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
