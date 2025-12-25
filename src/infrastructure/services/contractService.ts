import { Alquiler } from "@/domain/models/Alquiler";

export const contractService = {
    /**
     * Genera un contrato de alquiler en formato texto con todos los datos
     */
    generateContractText(alquiler: Alquiler, ownerData?: {
        nombre: string;
        dni: string;
        domicilio: string;
        email: string;
        cuit: string;
    }): string {
        const now = new Date();
        const monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        // Calcular duración en meses
        const fechaInicio = new Date(alquiler.fechaInicio);
        const fechaFin = new Date(alquiler.fechaFin);
        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

        // Datos del propietario (por defecto o proporcionados)
        const owner = ownerData || {
            nombre: "[NOMBRE DEL PROPIETARIO]",
            dni: "[DNI]",
            domicilio: "[DOMICILIO]",
            email: "[EMAIL]",
            cuit: "[CUIT]"
        };

        // Generar detalles de garantía
        let garantiaText = "";
        if (alquiler.tipoGarantia === 'garante' && alquiler.garante) {
            garantiaText = `Garantía de fianza a cargo de ${alquiler.garante.nombre}, DNI ${alquiler.garante.dni}, con domicilio en [DOMICILIO DEL GARANTE], teléfono ${alquiler.garante.telefono}, email ${alquiler.garante.email}.`;
        } else if (alquiler.tipoGarantia === 'seguro_caucion' && alquiler.seguroCaucion) {
            garantiaText = `Seguro de Caución emitido por ${alquiler.seguroCaucion.compania}, Póliza N° ${alquiler.seguroCaucion.numeroPoliza}, por un monto asegurado de $${alquiler.seguroCaucion.montoAsegurado.toLocaleString()}, con vencimiento el ${new Date(alquiler.seguroCaucion.fechaVencimiento).toLocaleDateString()}.`;
        }

        // Template del contrato
        const template = `
CONTRATO DE LOCACIÓN DE INMUEBLE CON DESTINO HABITACIONAL

⚠️ IMPORTANTE: Este es un modelo de referencia generado automáticamente.
Debe ser revisado y adaptado por un profesional legal antes de su uso.

═══════════════════════════════════════════════════════════════════════

En la Ciudad de [CIUDAD], a los ${now.getDate()} días del mes de ${monthNames[now.getMonth()]} de ${now.getFullYear()}, entre ${owner.nombre} con DNI N° ${owner.dni}, con domicilio en ${owner.domicilio}, domicilio electrónico ${owner.email}, CUIT/CUIL N° ${owner.cuit}, por una parte, en lo sucesivo denominado/a como "LOCADOR/A", y por la otra ${alquiler.nombreInquilino} DNI N° [DNI DEL INQUILINO], con domicilio en el inmueble locado, domicilio electrónico ${alquiler.contactoInquilino}, CUIT/CUIL N° [CUIT DEL INQUILINO] en adelante denominado/a como "LOCATARIO/A" convienen en celebrar el presente contrato de LOCACIÓN de vivienda, sujeto a las cláusulas siguientes y a las disposiciones del Código Civil y Comercial.

PRIMERA (OBJETO): EL/LA "LOCADOR/A" cede en locación al "LOCATARIO/A", que acepta ocupar en tal carácter, el inmueble ubicado en ${alquiler.direccion}. El LOCATARIO/A se obliga a destinar el inmueble locado para vivienda familiar, no pudiendo ello ser modificado, sin el consentimiento expreso del/la "LOCADOR/A".

SEGUNDA (PLAZO): Las partes acuerdan que el plazo de vigencia de la locación será de ${diffMonths} meses conforme lo establece Art. 1198 del Código Civil y Comercial, el mismo se inicia con fecha ${fechaInicio.toLocaleDateString()} por lo que su vencimiento se producirá de pleno derecho e indefectiblemente el día ${fechaFin.toLocaleDateString()}.

TERCERA (PRECIO Y AJUSTE): Las partes convienen un canon locativo de PESOS ${this.numberToWords(alquiler.montoMensual)} ($${alquiler.montoMensual.toLocaleString()}) mensuales para el primer año de contrato. El precio pactado será actualizado ${alquiler.ajusteTipo === 'ICL' ? 'anualmente utilizando el Índice para Contratos de Locación (ICL)' : `mediante ${alquiler.ajusteTipo}`} conforme lo estipula el Artículo 14 de la ley Nº 27551.

CUARTA (FECHA/LUGAR DE PAGO): EL/LA LOCATARIO/A se obliga a abonar el alquiler convenido por mes entero y adelantado, entre el 1 y el ${alquiler.diaVencimiento} de cada mes. El pago se efectuará por transferencia electrónica o depósito bancario en la cuenta indicada por el LOCADOR/A.

QUINTA (MORA): La mora en el pago de los alquileres se producirá de forma automática por el mero transcurso del tiempo y sin necesidad de interpelación ni gestión previa de ninguna naturaleza.

SEXTA (INTRANSFERIBILIDAD): El presente contrato de locación es intransferible. Le queda prohibido al LOCATARIO/A cederlo o subarrendarlo total o parcialmente, sin consentimiento del/la LOCADOR/A.

SÉPTIMA (LA CLÁUSULA DE GARANTÍA): De conformidad con el Art 13 de la Ley 27551, se presenta: ${garantiaText}

OCTAVA (OBLIGACIONES DE LAS PARTES): 
Son obligaciones del LOCATARIO/A:
a) El pago de los servicios de electricidad, gas, agua potable, cargas y contribuciones asociadas al destino de vivienda del inmueble.
b) Transferir la titularidad de los servicios a su nombre y cargo en un plazo no superior a los sesenta (60) días corridos.
c) Respetar la normativa local y exigencias de cualquier otra jurisdicción.

Son obligaciones del LOCADOR/A:
a) Realizar todas las reparaciones que requiera el inmueble para su normal funcionamiento.
b) Notificar al LOCATARIO/A con al menos 72 hs de antelación cualquier visita.
c) Abonar las expensas extraordinarias y el impuesto inmobiliario.

DÉCIMA (DEPÓSITO): En garantía de las obligaciones contraídas, el/la LOCATARIO/A da en depósito al LOCADOR/A la suma equivalente a un mes del precio de alquiler inicial ($${alquiler.montoMensual.toLocaleString()}).

DECIMASEGUNDA (INCUMPLIMIENTO): La violación por parte del LOCATARIO/A de cualquiera de las obligaciones dará derecho al LOCADOR/A para optar entre exigir su cumplimiento o dar por resuelto el contrato.

DECIMATERCERA (FALTA DE PAGO): La falta de pago de 2 meses de alquiler consecutivos dará derecho al LOCADOR/A a considerar rescindido el contrato.

DECIMASEXTA (RESCISIÓN ANTICIPADA): El/la LOCATARIO/A podrá, transcurridos los seis primeros meses de vigencia, resolver la contratación, debiendo notificar fehacientemente con una antelación mínima de treinta días.

DECIMAOCTAVA (DOMICILIOS DE LAS PARTES):
- LOCADOR/A: ${owner.domicilio}, domicilio electrónico: ${owner.email}
- LOCATARIO/A: en el inmueble locado, domicilio electrónico: ${alquiler.contactoInquilino}

═══════════════════════════════════════════════════════════════════════

En prueba de conformidad se firman tres ejemplares de un mismo tenor.

En [CIUDAD] a los ${now.getDate()} días del mes de ${monthNames[now.getMonth()]} del ${now.getFullYear()}.


_______________________          _______________________
LOCADOR/A                        LOCATARIO/A
${owner.nombre}                  ${alquiler.nombreInquilino}
DNI: ${owner.dni}                DNI: [DNI DEL INQUILINO]


═══════════════════════════════════════════════════════════════════════
⚠️ RECORDATORIO IMPORTANTE:
Este contrato es un modelo de referencia y debe ser revisado por un
profesional legal antes de su firma. Asegúrese de completar todos los
campos marcados entre corchetes [ ] con la información correcta.
═══════════════════════════════════════════════════════════════════════
`;

        return template.trim();
    },

    /**
     * Descarga el contrato como archivo de texto
     */
    downloadContract(alquiler: Alquiler, ownerData?: any): void {
        const contractText = this.generateContractText(alquiler, ownerData);

        // Crear blob con el contenido
        const blob = new Blob([contractText], { type: 'text/plain;charset=utf-8' });

        // Crear link de descarga
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contrato_${alquiler.direccion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;

        // Trigger descarga
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Helper: Convertir número a palabras (simplificado)
     */
    numberToWords(num: number): string {
        // Implementación simplificada - solo retorna el número formateado
        return num.toLocaleString('es-AR').toUpperCase();
    }
};
