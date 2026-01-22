import { Metadata } from 'next';
import { Cookie, Info, Settings, ShieldCheck, BarChart3, Globe, ToggleRight, MousePointerClick } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Política de Cookies | Zeta Prop',
    description: 'Información detallada sobre el uso de cookies en Zeta Prop. Transparencia sobre cómo y por qué utilizamos tecnologías de rastreo.',
    alternates: {
        canonical: 'https://zetaprop.com.ar/cookies',
    },
};

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
                        <Cookie className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900">Política de Cookies</h1>
                    <p className="text-gray-500">
                        Última actualización: {new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>

                {/* Intro */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-gray-600 leading-relaxed">
                    <p className="mb-4">
                        En <strong>Zeta Prop</strong>, creemos en ser claros y abiertos sobre cómo recopilamos y usamos los datos relacionados con usted. Esta política de cookies proporciona información detallada sobre cómo y cuándo utilizamos cookies.
                    </p>
                    <p>
                        Al continuar navegando por nuestro sitio web o utilizar nuestros servicios, usted acepta el uso de cookies y tecnologías similares para los fines que describimos en esta política.
                    </p>
                </div>

                {/* Sections */}
                <div className="grid gap-8">

                    {/* 1. ¿Qué es una cookie? */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                <Info size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">1. ¿Qué es una cookie?</h2>
                        </div>
                        <p className="text-gray-600 leading-relaxed">
                            Una "cookie" es un pequeño archivo de texto que se almacena en su computadora, tableta o teléfono inteligente cuando visita un sitio web. Las cookies permiten que el sitio web recuerde sus acciones y preferencias (como inicio de sesión, idioma, tamaño de fuente y otras preferencias de visualización) durante un período de tiempo, para que no tenga que volver a ingresarlas cada vez que regrese al sitio o navegue de una página a otra.
                        </p>
                    </section>

                    {/* 2. ¿Qué tipos de cookies utilizamos? */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                <Globe size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">2. Tipos de Cookies que Utilizamos</h2>
                        </div>
                        <p className="text-gray-600 mb-6">Utilizamos los siguientes tipos de cookies en nuestra plataforma:</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Esenciales */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3 text-gray-900 font-bold">
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                    Cookies Esenciales
                                </div>
                                <p className="text-sm text-gray-600">
                                    Son estrictamente necesarias para el funcionamiento del sitio. Sin ellas, no podríamos ofrecerle servicios básicos como el inicio de sesión seguro o el acceso a su panel de control.
                                </p>
                            </div>

                            {/* Funcionalidad */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3 text-gray-900 font-bold">
                                    <Settings className="w-5 h-5 text-indigo-600" />
                                    Cookies de Funcionalidad
                                </div>
                                <p className="text-sm text-gray-600">
                                    Permiten que el sitio web recuerde las elecciones que usted hace (como su nombre de usuario, idioma o la región en la que se encuentra) para ofrecer funcionalidades mejoradas y personalizadas.
                                </p>
                            </div>

                            {/* Analíticas */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3 text-gray-900 font-bold">
                                    <BarChart3 className="w-5 h-5 text-blue-600" />
                                    Cookies de Análisis
                                </div>
                                <p className="text-sm text-gray-600">
                                    Nos ayudan a entender cómo los visitantes interactúan con el sitio web, recopilando y reportando información de forma anónima. Usamos estos datos para mejorar nuestro rendimiento y diseño.
                                </p>
                            </div>

                            {/* Publicidad */}
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-3 text-gray-900 font-bold">
                                    <MousePointerClick className="w-5 h-5 text-orange-600" />
                                    Cookies de Marketing
                                </div>
                                <p className="text-sm text-gray-600">
                                    Se utilizan para rastrear a los visitantes a través de los sitios web. La intención es mostrar anuncios que sean relevantes y atractivos para el usuario individual.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* 3. Control de Cookies */}
                    <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                                <ToggleRight size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">3. Cómo Controlar las Cookies</h2>
                        </div>
                        <p className="text-gray-600 mb-4 leading-relaxed">
                            Usted tiene el derecho de aceptar o rechazar las cookies. Puede controlar y/o eliminar las cookies según lo desee. Puede eliminar todas las cookies que ya están en su computadora y puede configurar la mayoría de los navegadores para evitar que se coloquen.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            Sin embargo, si hace esto, es posible que tenga que ajustar manualmente algunas preferencias cada vez que visite un sitio y que algunos servicios y funcionalidades no funcionen correctamente (por ejemplo, mantener su sesión iniciada).
                        </p>
                    </section>

                    {/* Link to Privacy */}
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">
                            Para más información sobre cómo protegemos sus datos, consulte nuestra:
                        </p>
                        <a
                            href="/privacidad"
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-6 py-3 rounded-full transition-colors"
                        >
                            <ShieldCheck size={18} />
                            Política de Privacidad
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
