import { Alquiler } from "@/domain/models/Alquiler";
import { format, differenceInMonths } from "date-fns";
import { es } from "date-fns/locale";

interface RentalContractTemplateProps {
    contract: Alquiler;
    signingCity: string;
    signingDate: Date;
}

export const RentalContractTemplate = ({ contract, signingCity, signingDate }: RentalContractTemplateProps) => {
    // Helper to bold placeholders
    const Field = ({ children, fallback = "________________" }: { children?: React.ReactNode, fallback?: string }) => (
        <span className="font-bold print:font-semibold text-gray-900 border-b border-gray-300 px-1 inline-block min-w-[50px] text-center">
            {children || fallback}
        </span>
    );

    const durationMonths = differenceInMonths(new Date(contract.fechaFin), new Date(contract.fechaInicio));

    return (
        <div className="max-w-[21cm] mx-auto bg-white p-[2cm] shadow-lg print:shadow-none print:p-0 text-justify font-serif text-[11pt] leading-relaxed text-gray-900">
            {/* Header */}
            <div className="text-center mb-8 font-bold uppercase border-b-2 border-black pb-2">
                Modelo de Contrato – Ley de Alquileres<br />
                CONTRATO DE LOCACIÓN DE INMUEBLE CON DESTINO HABITACIONAL
            </div>

            {/* Intro */}
            <p className="mb-4">
                En la ciudad de <Field>{signingCity}</Field>, a los <Field>{format(signingDate, 'd')}</Field> días del mes de <Field>{format(signingDate, 'MMMM', { locale: es })}</Field> de <Field>{format(signingDate, 'yyyy')}</Field>,
                entre <Field>{contract.nombrePropietario}</Field> con DNI N° <Field>{contract.dniPropietario}</Field>,
                con domicilio en la calle <Field>{contract.domicilioPropietario}</Field>,
                domicilio electrónico <Field>{contract.emailPropietario}</Field>,
                CUIT/CUIL N° <Field>{contract.cuitPropietario}</Field>,
                por una parte, en lo sucesivo denominado/a como <strong>“LOCADOR/A”</strong>;
                y por la otra <Field>{contract.nombreInquilino}</Field> DNI N° <Field>{contract.dniInquilino}</Field>,
                con domicilio en el inmueble locado,
                domicilio electrónico <Field>{contract.contactoInquilino}</Field>,
                CUIT/CUIL N° <Field>{contract.cuitInquilino}</Field>
                en adelante denominado/a como <strong>“LOCATARIO/A”</strong>,
                convienen en celebrar el presente contrato de LOCACIÓN de vivienda, sujeto a las cláusulas siguientes y a las disposiciones del Código Civil y Comercial:
            </p>

            {/* Clauses */}
            <div className="space-y-4">
                <p>
                    <strong>PRIMERA (OBJETO):</strong> EL/LA “LOCADOR/A” cede en locación al “LOCATARIO/A”, que acepta ocupar en tal carácter,
                    el inmueble ubicado en calle <Field>{contract.direccion}</Field>.
                    El LOCATARIO/A se obliga a destinar el inmueble locado para vivienda familiar, no pudiendo ello ser modificado, sin el consentimiento expreso del/la “LOCADOR/A”.
                </p>

                <p>
                    <strong>SEGUNDA (PLAZO):</strong> Las partes acuerdan que el plazo de vigencia de la locación será de <strong>{durationMonths}</strong> meses,
                    comenzando el día <Field>{format(new Date(contract.fechaInicio), "d 'de' MMMM 'de' yyyy", { locale: es })}</Field>
                    y finalizando el día <Field>{format(new Date(contract.fechaFin), "d 'de' MMMM 'de' yyyy", { locale: es })}</Field>.
                </p>

                <p>
                    <strong>TERCERA (PRECIO Y AJUSTE):</strong> El precio inicial del alquiler se fija en la suma de PESOS <Field>${contract.montoMensual?.toLocaleString('es-AR')}</Field> mensuales.
                    {contract.ajusteTipo !== 'manual' && (
                        <span>
                            {" "}Las partes acuerdan que este monto se ajustará {contract.ajusteFrecuencia ? `cada ${contract.ajusteFrecuencia} meses` : 'anualmente'}
                            utilizando el índice {contract.ajusteTipo?.toUpperCase()} publicado por el organismo oficial correspondiente.
                        </span>
                    )}
                </p>

                <p>
                    <strong>CUARTA (PAGO):</strong> El alquiler será abonado por mes adelantado, del 1 al {contract.diaVencimiento || 10} de cada mes.
                    Todo pago realizado fuera de término devengará un interés punitorio {contract.punitoriosTipo === 'porcentaje' ? `del ${contract.punitoriosValor}%` : 'diario'} sobre el monto adeudado.
                </p>

                <p>
                    <strong>QUINTA (GARANTÍA):</strong>
                    {contract.tipoGarantia === 'garante' && contract.garante ? (
                        <span>
                            {" "}Para garantizar el cumplimiento de sus obligaciones, el LOCATARIO presenta como CO-DEUDOR/A SOLIDARIO/A, LISO/A Y LLANO/A y principal pagador/a a
                            el/la Sr./Sra. <Field>{contract.garante.nombre}</Field>, DNI <Field>{contract.garante.dni}</Field>,
                            domicilio en <Field>{/* Dirección Garante no está en modelo simple, se asume conocido */}</Field>.
                        </span>
                    ) : contract.tipoGarantia === 'seguro_caucion' && contract.seguroCaucion ? (
                        <span>
                            {" "}El cumplimiento de las obligaciones es garantizado mediante Seguro de Caución N° <Field>{contract.seguroCaucion.numeroPoliza}</Field>
                            de la compañía <Field>{contract.seguroCaucion.compania}</Field>.
                        </span>
                    ) : (
                        <span>
                            {" "}Se establece como garantía... ___________________________
                        </span>
                    )}
                </p>

                {/* Additional Standard Clauses extracted/summarized from template */}
                <p>
                    <strong>DECIMACUARTA (PRIMER MES):</strong> El/LA LOCATARIO/A abona en este acto la cantidad de PESOS <Field>${contract.montoMensual?.toLocaleString('es-AR')}</Field>
                    en concepto del alquiler correspondiente al mes de <Field>{format(new Date(contract.fechaInicio), 'MMMM', { locale: es })}</Field> de <Field>{format(new Date(contract.fechaInicio), 'yyyy')}</Field>.
                    Por este primer canon, EL/ LA LOCADOR/A remitirá al LOCATARIO/A la correspondiente factura electrónica.
                </p>

                <p>
                    <strong>DECIMASÉPTIMA (RENOVACIÓN):</strong> Dentro de los últimos tres (3) meses del contrato cualquiera de las partes puede convocar,
                    mediante notificación fehaciente, a la otra a conversar sobre la renovación de la locación.
                </p>

                <p>
                    <strong>VIGÉSIMA (JURISDICCIÓN):</strong> Ante cualquier controversia, las partes se someten a la jurisdicción y competencia de la
                    Justicia Ordinaria de <Field>{signingCity}</Field>.
                </p>
            </div>

            {/* Signatures */}
            <div className="mt-20 grid grid-cols-2 gap-16">
                <div className="text-center">
                    <div className="mb-2 h-0 border-t border-black w-2/3 mx-auto"></div>
                    <p className="font-bold">LOCADOR</p>
                    <p className="text-sm">{contract.nombrePropietario}</p>
                </div>
                <div className="text-center">
                    <div className="mb-2 h-0 border-t border-black w-2/3 mx-auto"></div>
                    <p className="font-bold">LOCATARIO</p>
                    <p className="text-sm">{contract.nombreInquilino}</p>
                </div>
            </div>

            {contract.garante && (
                <div className="mt-16 text-center">
                    <div className="mb-2 h-0 border-t border-black w-1/3 mx-auto"></div>
                    <p className="font-bold">GARANTE / FIADOR</p>
                    <p className="text-sm">{contract.garante.nombre}</p>
                </div>
            )}
        </div>
    );
};
