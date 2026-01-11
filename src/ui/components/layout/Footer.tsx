import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Github, Mail, ArrowRight } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-black border-t border-gray-800 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Brand & Description */}
                    <div className="space-y-6">
                        <img
                            src="/assets/img/logo_web_ZetaProp_fondonegro.png"
                            alt="Zeta Prop"
                            className="h-10 w-auto"
                        />
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Impulsando el futuro del Real Estate con tecnología avanzada. Potenciamos inmobiliarias con Inteligencia Artificial, automatización y herramientas de gestión integral para escalar tu negocio.
                        </p>
                        <div className="flex flex-col gap-4">
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/zeta_prop" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition"><Instagram className="w-5 h-5" /></a>
                                <a href="https://www.linkedin.com/company/zetaprop" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
                            </div>
                            <div className="space-y-2 text-sm text-gray-400">
                                <a href="mailto:facundo@zetaprop.com.ar" className="flex items-center gap-2 hover:text-white transition">
                                    <Mail size={16} /> facundo@zetaprop.com.ar
                                </a>
                                <a href="https://wa.me/5491124000769" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition">
                                    <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-4 h-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all" /> +54 9 11 2400-0769
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Explorar</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/servicios" className="hover:text-white transition flex items-center gap-2"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Servicios</Link></li>
                            <li><Link href="/precios" className="hover:text-white transition flex items-center gap-2"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Precios</Link></li>
                            <li><Link href="/nosotros" className="hover:text-white transition flex items-center gap-2"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Nosotros</Link></li>
                            <li><Link href="/contacto" className="hover:text-white transition flex items-center gap-2"><ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" /> Contacto</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-gray-400">
                            <li><Link href="/privacidad" className="hover:text-white transition">Privacidad</Link></li>
                            <li><Link href="/terminos" className="hover:text-white transition">Términos de Uso</Link></li>
                            <li><Link href="/cookies" className="hover:text-white transition">Política de Cookies</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-white mb-6">Newsletter</h4>
                        <p className="text-gray-400 text-sm mb-4">
                            Suscribite para recibir las últimas novedades del mercado y actualizaciones de la plataforma.
                        </p>
                        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                                <input
                                    type="email"
                                    placeholder="Tu email"
                                    className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg text-sm transition-colors">
                                Suscribirme
                            </button>
                        </form>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} Zeta Prop. Todos los derechos reservados.
                    </p>
                    <div className="text-sm text-gray-500 text-center md:text-right">
                        Hecho con ❤️ en Ituzaingó, Buenos Aires
                    </div>
                </div>
            </div>
        </footer>
    );
}
