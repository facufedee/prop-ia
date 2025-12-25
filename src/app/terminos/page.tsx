import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Términos de Uso | PROP-IA',
    description: 'Términos y condiciones de uso de la plataforma PROP-IA.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white py-24 px-6 md:px-12">
            <div className="max-w-4xl mx-auto prose prose-indigo">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos de Uso</h1>
                <p className="text-gray-500 mb-8">Última actualización: {new Date().toLocaleDateString('es-AR')}</p>

                <h2>1. Aceptación de los Términos</h2>
                <p>
                    Al acceder o utilizar PROP-IA, usted acepta estar legalmente vinculado por estos Términos de Uso y todas las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, tiene prohibido utilizar o acceder a este sitio.
                </p>

                <h2>2. Licencia de Uso</h2>
                <p>
                    Se concede permiso para acceder y utilizar la plataforma de PROP-IA para su uso profesional o personal, sujeto a las restricciones establecidas en estos términos.
                </p>

                <h2>3. Restricciones</h2>
                <p>
                    Usted no puede:
                </p>
                <ul>
                    <li>Modificar o copiar los materiales.</li>
                    <li>Utilizar los materiales para cualquier propósito comercial fuera de la plataforma sin autorización.</li>
                    <li>Intentar descompilar o realizar ingeniería inversa de cualquier software contenido en PROP-IA.</li>
                    <li>Eliminar cualquier copyright u otra notación de propiedad de los materiales.</li>
                </ul>

                <h2>4. Descargo de Responsabilidad</h2>
                <p>
                    Los materiales y servicios en PROP-IA se proporcionan "tal cual". PROP-IA no ofrece garantías, expresas o implícitas, y por la presente renuncia y niega todas las demás garantías, incluidas, entre otras, las garantías implícitas o las condiciones de comerciabilidad.
                </p>

                <h2>5. Limitaciones</h2>
                <p>
                    En ningún caso PROP-IA o sus proveedores serán responsables de ningún daño (incluidos, entre otros, daños por pérdida de datos o beneficios, o debido a la interrupción del negocio) que surjan del uso o la imposibilidad de usar los materiales en PROP-IA.
                </p>

                <h2>6. Ley Aplicable</h2>
                <p>
                    Estos términos y condiciones se rigen e interpretan de acuerdo con las leyes de Argentina y usted se somete irrevocablemente a la jurisdicción exclusiva de los tribunales en esa ubicación.
                </p>
            </div>
        </div>
    );
}
