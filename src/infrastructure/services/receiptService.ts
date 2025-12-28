import jsPDF from 'jspdf';
import { Alquiler, Pago } from "@/domain/models/Alquiler";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const receiptService = {
    generateReceipt(payment: Pago, contract: Alquiler) {
        const doc = new jsPDF();

        // Configuración
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let y = margin;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(63, 81, 181); // Indigo
        doc.text('Comprobante de Pago', pageWidth / 2, y, { align: 'center' });
        y += 15;

        // Info General
        doc.setFontSize(10);
        doc.setTextColor(100);
        const fechaEmision = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
        doc.text(`Fecha de Emisión: ${fechaEmision}`, pageWidth - margin, y - 10, { align: 'right' });

        doc.setLineWidth(0.5);
        doc.setDrawColor(200);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // Datos del Inquilino / Propiedad
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Detalles del Alquiler', margin, y);
        y += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Propiedad: ${contract.direccion}`, margin, y);
        y += 6;
        doc.text(`Inquilino: ${contract.nombreInquilino || '-'}`, margin, y);
        y += 15;

        // Datos del Pago
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Periodo Abonado: ${format(new Date(`${payment.mes}-02`), 'MMMM yyyy', { locale: es }).toUpperCase()}`, margin, y);
        y += 10;

        // Tabla de Conceptos (Simulada)
        const startX = margin;
        const col1 = startX;
        const col2 = pageWidth - margin - 40;

        doc.setFontSize(10);
        doc.setFillColor(245, 247, 250);
        doc.rect(startX, y - 5, pageWidth - (margin * 2), 8, 'F');
        doc.text('Concepto', col1 + 2, y);
        doc.text('Monto', col2, y);
        y += 10;

        const addItem = (label: string, value: number) => {
            if (value && value > 0) {
                doc.text(label, col1 + 2, y);
                doc.text(new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value), col2, y);
                y += 8;
            }
        };

        doc.setFont('helvetica', 'normal');
        addItem('Alquiler Base', payment.montoAlquiler || 0);

        if (payment.detalleServicios) {
            payment.detalleServicios.forEach(s => {
                addItem(`Servicio: ${s.concepto}`, s.monto);
            });
        }

        addItem('Punitorios / Intereses', payment.montoPunitorios || 0);
        addItem('Cargos Adicionales', (payment.cargosAdicionales || []).reduce((a, b) => a + b.monto, 0));

        if (payment.montoDescuento && payment.montoDescuento > 0) {
            doc.setTextColor(0, 150, 0);
            addItem('Descuentos', -payment.montoDescuento);
            doc.setTextColor(0);
        }

        y += 5;
        doc.setLineWidth(0.5);
        doc.line(col1, y, pageWidth - margin, y);
        y += 10;

        // Total
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Pagado', col1 + 2, y);
        const total = payment.monto;
        doc.text(new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total), col2, y);

        y += 20;

        // Footer Comprobante
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        doc.text('Este documento sirve como comprobante de pago válido.', pageWidth / 2, y, { align: 'center' });
        doc.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth / 2, y + 5, { align: 'center' });

        // Guardar
        doc.save(`Comprobante_Alquiler_${payment.mes}.pdf`);
    }
};
