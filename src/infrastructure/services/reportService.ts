import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Alquiler, Pago } from "@/domain/models/Alquiler";
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
    }
};
