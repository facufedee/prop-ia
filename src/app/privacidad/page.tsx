import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Política de Privacidad | PROP-IA',
    description: 'Política de privacidad y protección de datos de PROP-IA.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white py-24 px-6 md:px-12">
            <div className="max-w-4xl mx-auto prose prose-indigo">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
                <p className="text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

                <p>
                    En PROP-IA, nos tomamos muy en serio su privacidad. Esta Política de Privacidad describe cómo recopilamos, usamos y compartimos su información personal cuando utiliza nuestro sitio web y nuestros servicios de tasación inmobiliaria con inteligencia artificial.
                </p>

                <h2>1. Información que recopilamos</h2>
                <p>
                    Recopilamos información que usted nos proporciona directamente, como su nombre, dirección de correo electrónico, información de facturación y los datos de las propiedades que carga en la plataforma.
                </p>

                <h2>2. Uso de la información</h2>
                <p>
                    Utilizamos la información recopilada para:
                </p>
                <ul>
                    <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
                    <li>Procesar sus transacciones y enviarle confirmaciones.</li>
                    <li>Enviarle avisos técnicos, actualizaciones de seguridad y mensajes de soporte.</li>
                    <li>Responder a sus comentarios y preguntas.</li>
                </ul>

                <h2>3. Compartir información</h2>
                <p>
                    No compartimos su información personal con terceros, excepto cuando es necesario para proporcionar nuestros servicios (por ejemplo, procesamiento de pagos) o cuando lo exige la ley.
                </p>

                <h2>4. Seguridad</h2>
                <p>
                    Tomamos medidas razonables para proteger su información personal contra pérdida, robo, uso indebido y acceso no autorizado.
                </p>

                <h2>5. Contacto</h2>
                <p>
                    Si tiene alguna pregunta sobre esta Política de Privacidad, contáctenos en <a href="mailto:privacidad@prop-ia.com.ar">privacidad@prop-ia.com.ar</a>.
                </p>
            </div>
        </div>
    );
}
