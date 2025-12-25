import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Cookies | PROP-IA',
    description: 'Información sobre el uso de cookies en PROP-IA.',
};

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-white py-24 px-6 md:px-12">
            <div className="max-w-4xl mx-auto prose prose-indigo">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Cookies</h1>
                <p className="text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

                <h2>1. ¿Qué son las cookies?</h2>
                <p>
                    Una cookie es un pequeño archivo de texto que un sitio web guarda en su computadora o dispositivo móvil cuando usted visita el sitio. Permite que el sitio recuerde sus acciones y preferencias (como inicio de sesión, idioma, tamaño de fuente y otras preferencias de visualización) durante un período de tiempo.
                </p>

                <h2>2. ¿Cómo usamos las cookies?</h2>
                <p>
                    Utilizamos cookies para:
                </p>
                <ul>
                    <li>Mantenerlo conectado a la plataforma.</li>
                    <li>Recordar sus preferencias y configuraciones.</li>
                    <li>Analizar cómo utiliza nuestro sitio web para mejorarlo.</li>
                </ul>

                <h2>3. Tipos de cookies que utilizamos</h2>
                <ul>
                    <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento del sitio web.</li>
                    <li><strong>Cookies de funcionalidad:</strong> Nos permiten recordar sus preferencias.</li>
                    <li><strong>Cookies de análisis:</strong> Nos ayudan a entender cómo los visitantes interactúan con el sitio.</li>
                </ul>

                <h2>4. Control de cookies</h2>
                <p>
                    Puede controlar y/o eliminar las cookies como desee. Puede eliminar todas las cookies que ya están en su computadora y puede configurar la mayoría de los navegadores para que impidan que se coloquen.
                </p>
            </div>
        </div>
    );
}
