export default function PropertyDisclaimer() {
    return (
        <section className="border-t border-gray-100 pt-10 mt-16 max-w-5xl mx-auto pb-8">
            <h3 className="text-gray-400 font-bold text-xs uppercase mb-4 tracking-wider">
                Términos y Condiciones de Publicación - ZetaProp
            </h3>

            <div className="space-y-6 text-xs text-gray-400 text-justify leading-relaxed">
                <p>
                    <strong className="text-gray-500">ZetaProp</strong> es una plataforma tecnológica destinada exclusivamente a la difusión de avisos inmobiliarios y herramientas de gestión para profesionales del sector. En este sentido, se informa a los usuarios y público en general que:
                </p>

                <div className="space-y-2">
                    <h4 className="font-bold text-gray-500">1. Independencia de las Partes</h4>
                    <p>
                        <strong className="text-gray-500">ZetaProp</strong> no es una inmobiliaria ni ejerce el corretaje inmobiliario. Cada oficina, inmobiliaria, agente o martillero que utiliza nuestra aplicación es de <strong className="text-gray-500">propiedad y gestión independiente</strong>. La plataforma no interviene, participa ni percibe comisiones por las operaciones inmobiliarias resultantes.
                    </p>
                </div>

                <div className="space-y-2">
                    <h4 className="font-bold text-gray-500">2. Responsabilidad por el Contenido</h4>
                    <p>
                        Toda la información publicada en la aplicación (medidas, descripciones arquitectónicas, fotos, videos, valores de expensas, impuestos y precios) es suministrada exclusivamente por el anunciante.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li><strong className="text-gray-500">ZetaProp</strong> no valida ni garantiza la veracidad, exactitud o integridad de dichos datos.</li>
                        <li>Los valores y medidas son aproximados y pueden estar sujetos a modificaciones sin previo aviso por parte del anunciante.</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <h4 className="font-bold text-gray-500">3. Marco Legal y Corretaje</h4>
                    <p>
                        En cumplimiento de las leyes vigentes (<strong className="text-gray-500">Ley Nacional 25.028</strong>, <strong className="text-gray-500">Ley 22.802</strong> de Lealtad Comercial, <strong className="text-gray-500">Ley 24.240</strong> de Defensa al Consumidor y el <strong className="text-gray-500">Código Civil y Comercial de la Nación</strong>), se deja constancia de que:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>Los agentes o gestores que utilicen la plataforma <strong className="text-gray-500">no ejercen el corretaje inmobiliario</strong>.</li>
                        <li>Todas las operaciones deben ser intermediadas y concluidas por el <strong className="text-gray-500">corredor público inmobiliario matriculado</strong> responsable de la publicación, cuyos datos legales deben figurar obligatoriamente en el aviso.</li>
                    </ul>
                </div>

                <div className="space-y-2">
                    <h4 className="font-bold text-gray-500">4. Exención de Responsabilidad Contractual</h4>
                    <p>
                        <strong className="text-gray-500">ZetaProp</strong> no interviene ni es responsable por:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>La confección o firma de boletos de compraventa.</li>
                        <li>Escrituras traslativas de dominio.</li>
                        <li>Contratos de alquiler o cualquier otro documento legal entre las partes.</li>
                    </ul>
                </div>

                <div className="pt-4 border-t border-gray-100 italic">
                    <p>
                        Al utilizar esta plataforma, el usuario acepta que cualquier reclamo vinculado a la veracidad de los avisos o al éxito de la operación inmobiliaria deberá dirigirse exclusivamente al profesional matriculado responsable de la carga del aviso.
                    </p>
                </div>
            </div>
        </section>
    );
}
