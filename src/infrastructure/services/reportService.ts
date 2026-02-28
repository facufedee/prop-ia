import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Alquiler, Pago, Liquidacion } from "@/domain/models/Alquiler";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const reportService = {
    generateContractReport(contract: Alquiler, payments: Pago[]) {
        const doc = new jsPDF();

        // --- Helper formatting ---
        const currency = (amount: number, currencyCode: string = 'ARS') =>
            new Intl.NumberFormat('es-AR', { style: 'currency', currency: currencyCode }).format(amount);

        const date = (d: Date | string) => {
            const dateObj = typeof d === 'string' ? new Date(d) : d;
            return format(dateObj, 'dd/MM/yyyy', { locale: es });
        };

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(63, 81, 181); // Indigo
        doc.text('Informe de Contrato de Alquiler', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}`, 14, 30);

        // --- Contract Details ---
        let y = 45;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Detalles del Contrato', 14, y);
        y += 8;

        doc.setFontSize(10);
        const details = [
            [`Propiedad:`, contract.direccion],
            [`Inquilino:`, contract.nombreInquilino],
            [`Propietario:`, contract.nombrePropietario || '-'],
            [`Vigencia:`, `${date(contract.fechaInicio)} al ${date(contract.fechaFin)}`],
            [`Valor Actual:`, `${contract.monedaAlquiler} ${contract.montoMensual.toLocaleString()}`],
        ];

        autoTable(doc, {
            startY: y,
            body: details,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        });

        // --- Payments Table ---
        // @ts-ignore
        y = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.text('Estado de Pagos', 14, y);
        y += 6;

        const tableData = payments.map(p => {
            const isPaid = p.estado === 'pagado';
            const statusLabel = isPaid ? 'PAGADO' : 'PENDIENTE';
            return [
                format(new Date(`${p.mes}-02`), 'MMMM yyyy', { locale: es }).toUpperCase(), // Periodo
                currency(p.monto, contract.monedaAlquiler), // Monto
                date(p.fechaVencimiento), // Vencimiento
                isPaid && p.fechaPago ? date(p.fechaPago) : '-', // Fecha Pago
                statusLabel
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Periodo', 'Monto', 'Vencimiento', 'Fecha Pago', 'Estado']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            styles: { fontSize: 9 },
            columnStyles: {
                4: { fontStyle: 'bold' } // Status column
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 4) {
                    const status = data.cell.raw;
                    if (status === 'PAGADO') {
                        data.cell.styles.textColor = [0, 128, 0]; // Green
                    } else {
                        data.cell.styles.textColor = [200, 0, 0]; // Red
                    }
                }
            }
        });

        // --- Footer ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        doc.save(`Informe_Alquiler_${contract.nombreInquilino.replace(/\s+/g, '_')}.pdf`);
    },

    generateLiquidacionesReport(contract: Alquiler, liquidaciones: Liquidacion[]) {
        const doc = new jsPDF();

        // --- Helper formatting ---
        const currency = (amount: number, currencyCode: string = 'ARS') =>
            new Intl.NumberFormat('es-AR', { style: 'currency', currency: currencyCode }).format(amount);

        const date = (d: any) => {
            if (!d) return '-';
            let dateObj: Date;
            if (d instanceof Date) {
                dateObj = d;
            } else if (typeof d === 'object' && 'seconds' in d) {
                dateObj = new Date(d.seconds * 1000);
            } else if (typeof d === 'object' && 'toDate' in d) {
                dateObj = d.toDate();
            } else {
                dateObj = new Date(d);
            }
            if (isNaN(dateObj.getTime())) return '-';
            return format(dateObj, 'dd/MM/yyyy', { locale: es });
        };

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(63, 81, 181); // Indigo
        doc.text('Historial de Liquidaciones', 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generado el: ${format(new Date(), "dd 'de' MMMM, yyyy HH:mm", { locale: es })}`, 14, 30);

        // --- Contract Details ---
        let y = 45;

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Detalles de la Propiedad', 14, y);
        y += 8;

        doc.setFontSize(10);
        const details = [
            [`Propiedad:`, contract.direccion],
            [`Propietario:`, contract.nombrePropietario || '-'],
            [`Inquilino:`, contract.nombreInquilino || '-'],
            [`Vigencia:`, `${date(contract.fechaInicio)} al ${date(contract.fechaFin)}`],
        ];

        autoTable(doc, {
            startY: y,
            body: details,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 1 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } },
        });

        // --- Liquidations Table ---
        // @ts-ignore
        y = doc.lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.text('Estado de Liquidaciones', 14, y);
        y += 6;

        // Sort descending
        const sorted = [...liquidaciones].sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());

        const tableData = sorted.map(liq => {
            const isPaid = liq.estado === 'pagado';
            const statusLabel = isPaid ? 'PAGADO' : 'PENDIENTE';
            return [
                format(new Date(`${liq.mes}-02`), 'MMMM yyyy', { locale: es }).toUpperCase(), // Periodo
                currency(liq.TotalCobradoInquilino, contract.monedaAlquiler), // Ingreso
                currency(liq.honorariosA + liq.detalles.filter(d => d.tipo === 'egreso' && d.concepto !== 'Honorarios Inmobiliaria').reduce((acc, d) => acc + d.monto, 0), contract.monedaAlquiler), // Deducciones
                currency(liq.netoAPagar, contract.monedaAlquiler), // Neto a Pagar
                isPaid && liq.fechaPago ? date(liq.fechaPago) : '-', // Fecha Pago
                statusLabel
            ];
        });

        autoTable(doc, {
            startY: y,
            head: [['Periodo', 'Cobrado Inq.', 'Deducciones', 'Neto a Pagar', 'Fecha Pago', 'Estado']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [63, 81, 181] },
            styles: { fontSize: 9 },
            columnStyles: {
                5: { fontStyle: 'bold' } // Status column
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 5) {
                    const status = data.cell.raw;
                    if (status === 'PAGADO') {
                        data.cell.styles.textColor = [0, 128, 0]; // Green
                    } else {
                        data.cell.styles.textColor = [200, 0, 0]; // Red
                    }
                }
            }
        });

        // --- Resumen Totales ---
        // @ts-ignore
        let yResumen = doc.lastAutoTable.finalY + 15;
        const totalNeto = liquidaciones.reduce((acc, liq) => acc + liq.netoAPagar, 0);
        const totalPagado = liquidaciones.filter(l => l.estado === 'pagado').reduce((acc, liq) => acc + liq.netoAPagar, 0);
        const totalPendiente = liquidaciones.filter(l => l.estado === 'pendiente').reduce((acc, liq) => acc + liq.netoAPagar, 0);

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('Resumen de Saldos', 14, yResumen);

        yResumen += 8;
        doc.setFontSize(10);

        doc.text(`Total Histórico Generado: ${currency(totalNeto, contract.monedaAlquiler)}`, 14, yResumen);
        yResumen += 6;
        doc.text(`Total Abonado al Propietario: `, 14, yResumen);
        doc.setTextColor(0, 128, 0);
        doc.text(`${currency(totalPagado, contract.monedaAlquiler)}`, 65, yResumen);

        yResumen += 6;
        doc.setTextColor(0);
        doc.text(`Saldo Pendiente de Pago: `, 14, yResumen);
        doc.setTextColor(200, 0, 0);
        doc.text(`${currency(totalPendiente, contract.monedaAlquiler)}`, 61, yResumen);
        doc.setTextColor(0);

        // --- Footer ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
        }

        doc.save(`Historial_Liquidaciones_${contract.nombrePropietario?.replace(/\s+/g, '_') || contract.direccion.replace(/\s+/g, '_')}.pdf`);
    }
};
