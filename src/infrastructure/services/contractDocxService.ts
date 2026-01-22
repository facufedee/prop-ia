import { Document, Paragraph, TextRun, AlignmentType, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";
import { Alquiler } from "@/domain/models/Alquiler";

export const contractDocxService = {
    /**
     * Genera y descarga un contrato en formato DOCX
     */
    async generateAndDownload(alquiler: Alquiler): Promise<void> {
        const doc = this.createContractDocument(alquiler);

        const blob = await Packer.toBlob(doc);
        const fileName = `Contrato_${alquiler.direccion.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

        saveAs(blob, fileName);
    },

    /**
     * Crea el documento Word del contrato
     */
    createContractDocument(alquiler: Alquiler): Document {
        const now = new Date();
        const monthNames = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];

        const fechaInicio = new Date(alquiler.fechaInicio);
        const fechaFin = new Date(alquiler.fechaFin);

        // Calcular duración en meses
        const diffTime = Math.abs(fechaFin.getTime() - fechaInicio.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));

        // Generar detalles de garantía
        let garantiaText = "";
        if (alquiler.tipoGarantia === 'garante' && alquiler.garante) {
            garantiaText = `Garantía de fianza a cargo de ${alquiler.garante.nombre}, DNI ${alquiler.garante.dni}, teléfono ${alquiler.garante.telefono}, email ${alquiler.garante.email}.`;
        } else if (alquiler.tipoGarantia === 'seguro_caucion' && alquiler.seguroCaucion) {
            garantiaText = `Seguro de Caución emitido por ${alquiler.seguroCaucion.compania}, Póliza N° ${alquiler.seguroCaucion.numeroPoliza}, por un monto asegurado de $${alquiler.seguroCaucion.montoAsegurado.toLocaleString()}.`;
        }

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    // Título
                    new Paragraph({
                        text: "CONTRATO DE LOCACIÓN DE INMUEBLE CON DESTINO HABITACIONAL",
                        heading: HeadingLevel.TITLE,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Advertencia
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "⚠️ IMPORTANTE: ",
                                bold: true,
                                color: "FF6B00"
                            }),
                            new TextRun({
                                text: "Este es un modelo de referencia generado automáticamente. Debe ser revisado y adaptado por un profesional legal antes de su uso.",
                                italics: true,
                                color: "666666"
                            })
                        ],
                        spacing: { after: 400 }
                    }),

                    // Separador
                    new Paragraph({
                        text: "═══════════════════════════════════════════════════════════════════════",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),

                    // Encabezado del contrato
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `En la Ciudad de ${alquiler.direccion.split(',')[1]?.trim() || '[CIUDAD]'}, a los ${now.getDate()} días del mes de ${monthNames[now.getMonth()]} de ${now.getFullYear()}, entre `,
                            }),
                            new TextRun({
                                text: alquiler.nombrePropietario || "[NOMBRE DEL PROPIETARIO]",
                                bold: true
                            }),
                            new TextRun({
                                text: ` con DNI N° ${alquiler.dniPropietario || "[DNI]"}, con domicilio en ${alquiler.domicilioPropietario || "[DOMICILIO]"}, domicilio electrónico ${alquiler.emailPropietario || "[EMAIL]"}, CUIT/CUIL N° ${alquiler.cuitPropietario || "[CUIT]"}, por una parte, en lo sucesivo denominado/a como `,
                            }),
                            new TextRun({
                                text: '"LOCADOR/A"',
                                bold: true
                            }),
                            new TextRun({
                                text: `, y por la otra `,
                            }),
                            new TextRun({
                                text: alquiler.nombreInquilino,
                                bold: true
                            }),
                            new TextRun({
                                text: ` DNI N° ${alquiler.dniInquilino || "[DNI DEL INQUILINO]"}, con domicilio en el inmueble locado, domicilio electrónico ${alquiler.contactoInquilino}, CUIT/CUIL N° ${alquiler.cuitInquilino || "[CUIT DEL INQUILINO]"} en adelante denominado/a como `,
                            }),
                            new TextRun({
                                text: '"LOCATARIO/A"',
                                bold: true
                            }),
                            new TextRun({
                                text: ` convienen en celebrar el presente contrato de LOCACIÓN de vivienda, sujeto a las cláusulas siguientes y a las disposiciones del Código Civil y Comercial.`,
                            })
                        ],
                        spacing: { after: 300 }
                    }),

                    // PRIMERA (OBJETO)
                    ...this.createClause(
                        "PRIMERA (OBJETO)",
                        `EL/LA "LOCADOR/A" cede en locación al "LOCATARIO/A", que acepta ocupar en tal carácter, el inmueble ubicado en ${alquiler.direccion}. El LOCATARIO/A se obliga a destinar el inmueble locado para vivienda familiar, no pudiendo ello ser modificado, sin el consentimiento expreso del/la "LOCADOR/A".`
                    ),

                    // SEGUNDA (PLAZO)
                    ...this.createClause(
                        "SEGUNDA (PLAZO)",
                        `Las partes acuerdan que el plazo de vigencia de la locación será de ${diffMonths} meses conforme lo establece Art. 1198 del Código Civil y Comercial, el mismo se inicia con fecha ${fechaInicio.toLocaleDateString()} por lo que su vencimiento se producirá de pleno derecho e indefectiblemente el día ${fechaFin.toLocaleDateString()}.`
                    ),

                    // TERCERA (PRECIO Y AJUSTE)
                    ...this.createClause(
                        "TERCERA (PRECIO Y AJUSTE)",
                        `Las partes convienen un canon locativo de PESOS ${this.numberToWords(alquiler.montoMensual)} ($${alquiler.montoMensual.toLocaleString()}) mensuales para el primer año de contrato. El precio pactado será actualizado ${alquiler.ajusteTipo === 'ICL' ? 'anualmente utilizando el Índice para Contratos de Locación (ICL)' : `mediante ${alquiler.ajusteTipo}`} conforme lo estipula el Artículo 14 de la ley Nº 27551.`
                    ),

                    // CUARTA (FECHA/LUGAR DE PAGO)
                    ...this.createClause(
                        "CUARTA (FECHA/LUGAR DE PAGO)",
                        `EL/LA LOCATARIO/A se obliga a abonar el alquiler convenido por mes entero y adelantado, entre el 1 y el ${alquiler.diaVencimiento} de cada mes. El pago se efectuará por transferencia electrónica o depósito bancario en ${alquiler.banco ? `el ${alquiler.banco}` : 'la cuenta indicada'}, ${alquiler.cbu ? `CBU ${alquiler.cbu}` : ''} ${alquiler.alias ? `Alias: ${alquiler.alias}` : ''}.`
                    ),

                    // SÉPTIMA (GARANTÍA)
                    ...this.createClause(
                        "SÉPTIMA (LA CLÁUSULA DE GARANTÍA)",
                        `De conformidad con el Art 13 de la Ley 27551, se presenta: ${garantiaText}`
                    ),

                    // DÉCIMA (DEPÓSITO)
                    ...this.createClause(
                        "DÉCIMA (DEPÓSITO)",
                        `En garantía de las obligaciones contraídas, el/la LOCATARIO/A da en depósito al LOCADOR/A la suma equivalente a un mes del precio de alquiler inicial ($${alquiler.montoMensual.toLocaleString()}). Al momento de restitución del inmueble, el LOCADOR/A deberá devolver el depósito actualizado.`
                    ),

                    // Estado del inmueble
                    ...(alquiler.estadoInmueble ? this.createClause(
                        "DECIMAPRIMERA (ESTADO DEL INMUEBLE)",
                        `El LOCATARIO/A declara que ha visitado el inmueble y comprobado su estado de conservación: ${alquiler.estadoInmueble}`
                    ) : []),

                    // Separador final
                    new Paragraph({
                        text: "═══════════════════════════════════════════════════════════════════════",
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 400, after: 200 }
                    }),

                    // Firmas
                    new Paragraph({
                        text: "En prueba de conformidad se firman tres ejemplares de un mismo tenor.",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    new Paragraph({
                        text: `En ${alquiler.direccion.split(',')[1]?.trim() || '[CIUDAD]'} a los ${now.getDate()} días del mes de ${monthNames[now.getMonth()]} del ${now.getFullYear()}.`,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 600 }
                    }),

                    // Líneas de firma
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "_______________________          _______________________",
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "LOCADOR/A                        LOCATARIO/A",
                                bold: true
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `${alquiler.nombrePropietario || '[NOMBRE]'}                  ${alquiler.nombreInquilino}`,
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: `DNI: ${alquiler.dniPropietario || '[DNI]'}            DNI: ${alquiler.dniInquilino || '[DNI]'}`,
                            })
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 }
                    }),

                    // Recordatorio final
                    new Paragraph({
                        text: "═══════════════════════════════════════════════════════════════════════",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "⚠️ RECORDATORIO IMPORTANTE:",
                                bold: true,
                                color: "FF6B00"
                            })
                        ],
                        spacing: { after: 100 }
                    }),

                    new Paragraph({
                        children: [
                            new TextRun({
                                text: "Este contrato es un modelo de referencia y debe ser revisado por un profesional legal antes de su firma. Asegúrese de completar todos los campos marcados entre corchetes [ ] con la información correcta.",
                                italics: true
                            })
                        ],
                        spacing: { after: 200 }
                    })
                ]
            }]
        });

        return doc;
    },

    /**
     * Helper para crear cláusulas
     */
    createClause(title: string, content: string): Paragraph[] {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: title,
                        bold: true,
                        size: 24
                    })
                ],
                spacing: { before: 300, after: 150 }
            }),
            new Paragraph({
                text: content,
                spacing: { after: 200 }
            })
        ];
    },

    /**
     * Helper: Convertir número a palabras (simplificado)
     */
    numberToWords(num: number): string {
        return num.toLocaleString('es-AR').toUpperCase();
    }
};
