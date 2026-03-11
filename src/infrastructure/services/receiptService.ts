import jsPDF from 'jspdf';
import { Alquiler, Pago, Liquidacion } from "@/domain/models/Alquiler";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from '@/infrastructure/firebase/client';
import { doc, runTransaction } from 'firebase/firestore';

// ─── Agency profile shape ──────────────────────────────────────────────────────

export interface AgencyProfile {
    agencyName?: string;
    agencyLicense?: string;
    agencyManager?: string;
    agencyCuit?: string;
    agencyAddress?: string;
    agencyWhatsapp?: string;
    agencyWebsite?: string;
    logoUrl?: string;
    nombreComercial?: string;
    condicionIva?: string;
    firmante?: string;
    cargoFirmante?: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const parseSafeDate = (dateVal: any): Date => {
    if (!dateVal) return new Date();
    if (dateVal instanceof Date) return dateVal;
    if (typeof dateVal === 'object' && 'seconds' in dateVal) return new Date(dateVal.seconds * 1000);
    if (typeof dateVal === 'object' && 'toDate' in dateVal) return dateVal.toDate();
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? new Date() : d;
};

const fmtMoney = (amount: number) =>
    new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);

// ─── NUMBER → WORDS ───────────────────────────────────────────────────────────

const ONES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
    'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos',
    'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function twoDigits(n: number): string {
    if (n < 20) return ONES[n];
    const d = Math.floor(n / 10), u = n % 10;
    if (n === 20) return 'veinte';
    if (n < 30) return u === 0 ? 'veinte' : 'veinti' + ONES[u];
    return u === 0 ? TENS[d] : TENS[d] + ' y ' + ONES[u];
}

function threeDigits(n: number): string {
    if (n === 100) return 'cien';
    if (n === 0) return '';
    const h = Math.floor(n / 100), rest = n % 100;
    return [h > 0 ? HUNDREDS[h] : '', rest > 0 ? twoDigits(rest) : ''].filter(Boolean).join(' ');
}

function numberToWords(amount: number): string {
    const whole = Math.floor(amount);
    if (whole === 0) return 'cero pesos';
    const millions = Math.floor(whole / 1_000_000);
    const thousands = Math.floor((whole % 1_000_000) / 1_000);
    const remainder = whole % 1_000;
    const parts: string[] = [];
    if (millions > 0) parts.push(millions === 1 ? 'un millón' : threeDigits(millions) + ' millones');
    if (thousands > 0) parts.push(thousands === 1 ? 'mil' : threeDigits(thousands) + ' mil');
    if (remainder > 0) parts.push(threeDigits(remainder));
    return 'Pesos ' + parts.join(' ');
}

// ─── LOGO LOADER ──────────────────────────────────────────────────────────────

async function loadImageAsBase64(url: string): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> {
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve({ data: reader.result as string, format: blob.type.includes('png') ? 'PNG' : 'JPEG' });
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch { return null; }
}

// ─── SEQUENTIAL RECEIPT NUMBER ────────────────────────────────────────────────

async function getNextReceiptNumber(userId: string): Promise<string> {
    if (!db) return `0001-${Date.now().toString().slice(-8)}`;
    try {
        const counterRef = doc(db, 'users', userId, 'config', 'receiptCounter');
        let next = 1;
        await runTransaction(db, async (tx) => {
            const snap = await tx.get(counterRef);
            next = snap.exists() ? (snap.data().count ?? 0) + 1 : 1;
            tx.set(counterRef, { count: next });
        });
        return `0001-${next.toString().padStart(8, '0')}`;
    } catch {
        return `0001-${Date.now().toString().slice(-8)}`;
    }
}

// ─── PAYMENT INDEX ────────────────────────────────────────────────────────────

function getPaymentIndex(mes: string, contract: Alquiler): string {
    try {
        const start = parseSafeDate(contract.fechaInicio);
        const end = parseSafeDate(contract.fechaFin);
        const [year, month] = mes.split('-').map(Number);
        const current = (year - start.getFullYear()) * 12 + (month - start.getMonth() - 1) + 1;
        const total = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
        return `${current} / ${total}`;
    } catch { return ''; }
}

// ─── DRAW ONE RECEIPT (faithful replica of Müller layout) ────────────────────

async function drawReceiptSection(
    pdf: jsPDF,
    payment: Pago,
    contract: Alquiler,
    profile: AgencyProfile,
    logoImg: { data: string; format: 'JPEG' | 'PNG' } | null,
    receiptNumber: string,
    label: 'ORIGINAL' | 'DUPLICADO',
    yBase: number,
    sectionHeight: number
) {
    const pW = pdf.internal.pageSize.width;
    const M = 14;           // page margin
    const innerW = pW - M * 2;
    const borderX = M;
    const borderY = yBase + 2;

    // ── OUTER BORDER ─────────────────────────────────────────────────────────
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.4);
    pdf.rect(borderX, borderY, innerW, sectionHeight - 6, 'S');

    // ── WATERMARK: logo image (if available) or agency name text, very faint ──
    const centerX = M + innerW / 2;
    const centerY = yBase + sectionHeight / 2;
    pdf.saveGraphicsState();
    (pdf as any).setGState((pdf as any).GState({ opacity: 0.08 }));
    if (logoImg) {
        // Logo image watermark — large, centered in the body
        const wmW = 90;
        const wmH = 60;
        try {
            pdf.addImage(logoImg.data, logoImg.format, centerX - wmW / 2, centerY - wmH / 2, wmW, wmH);
        } catch { }
    } else {
        // Fallback: agency name text
        const wmName = (profile.agencyName || profile.nombreComercial || 'ZETA PROP').toUpperCase();
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(200, 200, 200);
        pdf.setFontSize(40);
        pdf.text(wmName, centerX, centerY, { align: 'center', maxWidth: innerW - 20 });
    }
    pdf.restoreGraphicsState();

    // ── HEADER (3 columns) ────────────────────────────────────────────────────
    const hH = 46;
    const hHeaderBottom = borderY + hH;
    const col1X = borderX;
    const col1W = innerW * 0.40;  // symmetric proportions 40/20/40
    const col2X = borderX + col1W;
    const col2W = innerW * 0.20;  // X section exactly centered
    const col3X = col2X + col2W;
    const col3W = innerW - col1W - col2W;

    // Only horizontal separator under header
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.35);
    pdf.line(borderX, hHeaderBottom, borderX + innerW, hHeaderBottom);

    // ── COL 1: Logo + agency name (right of logo), contact below logo ─────────
    // --- COL 1: Logo + Datos centrados verticalmente ---
    const col1CenterY = borderY + (hH / 2); // Centro vertical de la franja del header
    const logoW = 22;
    const logoH = 18;
    const logoLeft = col1X + 4;
    // Calculamos el inicio del bloque para que el conjunto (logo+nombre) quede centrado
    const logoTop = col1CenterY - 15;

    if (logoImg) {
        try { pdf.addImage(logoImg.data, logoImg.format, logoLeft, logoTop, logoW, logoH); } catch { }
    }

    const agName = (profile.agencyName || profile.nombreComercial || 'INMOBILIARIA').toUpperCase();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(logoImg ? 9 : 11);
    // Alineado al mismo margen que el logo
    pdf.text(agName, logoLeft, logoTop + logoH + 4, { maxWidth: col1W - 8 });

    // Removed the "By manager" line from header per request

    // Thin separator line before contact info
    const sepY = borderY + 31;
    pdf.setDrawColor(170, 170, 170);
    pdf.setLineWidth(0.2);
    pdf.line(col1X + 3, sepY, col2X - 3, sepY);

    // Contact info from left margin (NOT indented by logo)
    const infoLines = [
        profile.agencyAddress,
        profile.agencyCuit ? `CUIT: ${profile.agencyCuit}` : null,
        profile.agencyWhatsapp ? `Tel/WA: ${profile.agencyWhatsapp}` : null,
        profile.condicionIva ? `Resp. ${profile.condicionIva}` : null,
    ].filter(Boolean) as string[];
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.3);
    pdf.setTextColor(20, 20, 20);
    infoLines.forEach((line, i) => {
        pdf.text(line, col1X + 4, sepY + 4 + i * 3.8, { maxWidth: col1W - 8 });
    });

    // ── COL 2: X in thin square box, exactly centered ─────────────────────────
    const xCenterX = col2X + col2W / 2;
    const headerMidY = borderY + hH / 2;

    const boxW = 13;
    const boxH = 17;
    const boxX = xCenterX - boxW / 2;
    const boxY = headerMidY - boxH / 2 - 5;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.35);
    pdf.rect(boxX, boxY, boxW, boxH, 'S');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('X', xCenterX, boxY + boxH - 3, { align: 'center' });

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.5);
    pdf.setTextColor(20, 20, 20);
    const txtY = boxY + boxH + 4;
    pdf.text('DOCUMENTO', xCenterX, txtY, { align: 'center' });
    pdf.text('NO VÁLIDO', xCenterX, txtY + 3.8, { align: 'center' });
    pdf.text('COMO FACTURA', xCenterX, txtY + 7.6, { align: 'center' });

    // ── COL 3: RECIBO — free text, no box, more air at top ────────────────────
    // --- COL 3: RECIBO alineado ---
    const recCenterX = col3X + col3W / 2;
    // Bajamos el inicio para que el título RECIBO esté alineado visualmente con el logo o la X
    const recTop = borderY + 12;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('RECIBO', recCenterX, recTop, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9); // Un punto más grande para legibilidad
    pdf.text(receiptNumber, recCenterX, recTop + 9, { align: 'center' });
    pdf.text(format(new Date(), 'dd/MM/yyyy'), recCenterX, recTop + 15, { align: 'center' });

    if (profile.agencyCuit) {
        pdf.setFontSize(7.5);
        pdf.text(`C.U.I.T.: ${profile.agencyCuit}`, recCenterX, recTop + 21, { align: 'center' });
    }
    // ── "COBRO POR CUENTA..." — simple italic text, no gray fill ─────────────
    let y = hHeaderBottom;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.2);
    pdf.line(borderX, y + 6, borderX + innerW, y + 6);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(6);
    pdf.setTextColor(40, 40, 40);
    pdf.text(
        'COBRO POR CUENTA Y ORDEN DE TERCEROS, IMPORTE PARA SER ENTREGADO AL PROPIETARIO O A QUIEN CORRESPONDA',
        borderX + innerW / 2, y + 4, { align: 'center', maxWidth: innerW - 4 }
    );
    y += 8;

    // ── LABEL + VALUE HELPER ──────────────────────────────────────────────────
    const lbl = (key: string, val: string, x: number, cy: number, maxW = 80) => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.setTextColor(0, 0, 0);
        pdf.text(key, x, cy);
        const kw = pdf.getTextWidth(key);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);
        pdf.text(val || '-', x + kw + 0.5, cy, { maxWidth: maxW });
    };

    const mesDate = parseSafeDate(new Date(`${payment.mes}-02`));
    const cuotaStr = getPaymentIndex(payment.mes, contract);
    const fechaInicio = parseSafeDate(contract.fechaInicio);
    const fechaFin = parseSafeDate(contract.fechaFin);

    const lcX = borderX + 4;
    const rcX = borderX + innerW * 0.5 + 4;
    const rowH = 5.5;

    const hline = (cy: number) => {
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.2);
        pdf.line(borderX, cy, borderX + innerW, cy);
    };

    // Client section — no gray fills, just rows
    y += 4;
    lbl('Cliente: ', contract.nombreInquilino || '-', lcX, y, innerW * 0.43);
    lbl('C.U.I.T.: ', contract.cuitInquilino || '', rcX, y, innerW * 0.43);
    y += rowH;

    lbl('Dirección: ', contract.domicilioInquilino || contract.direccion || '-', lcX, y, innerW * 0.43);
    lbl('Localidad: ', '', rcX, y, innerW * 0.43);
    y += rowH;

    lbl('I.V.A.: ', profile.condicionIva || 'Consumidor Final', lcX, y, innerW * 0.43);
    y += rowH;

    lbl('Propietario: ', contract.nombrePropietario || '-', lcX, y, innerW - 10);
    y += rowH;

    hline(y); y += 4;

    // Contract section
    lbl('Contrato: ', 'Alquiler', lcX, y);
    lbl('Inicio: ', format(fechaInicio, 'dd/MM/yyyy'), lcX + 36, y);
    lbl('Fin: ', format(fechaFin, 'dd/MM/yyyy'), lcX + 74, y);
    if (cuotaStr) lbl('Pago: ', cuotaStr, lcX + 118, y);
    y += rowH;

    lbl('En concepto de: ', 'ALQUILER', lcX, y);
    y += rowH;

    lbl('Dirección inmueble: ', contract.direccion || '-', lcX, y, innerW - 50);
    y += rowH;

    lbl('Propietario: ', contract.nombrePropietario || '-', lcX, y, innerW - 40);
    y += rowH;

    hline(y); y += 4;

    // Period + table
    const periodoStr = format(mesDate, "MMMM 'de' yyyy", { locale: es });
    lbl('Correspondiente al mes de: ', periodoStr.charAt(0).toUpperCase() + periodoStr.slice(1), lcX, y);
    y += 5;

    // Table header — no fill, just bold text + underline
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(0, 0, 0);
    pdf.text('CONCEPTO', borderX + 4, y);
    pdf.text('MONTO', borderX + innerW - 4, y, { align: 'right' });
    y += 1.5;
    hline(y + 1); y += 4;

    const addRow = (desc: string, amount: number, isSubtitle = false) => {
        pdf.setDrawColor(180, 180, 180);
        pdf.setLineWidth(0.15);
        pdf.line(borderX, y + 3, borderX + innerW, y + 3);
        if (isSubtitle) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(7);
            pdf.setTextColor(30, 30, 30);
            pdf.text(desc, borderX + 4, y);
        } else {
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(20, 20, 20);
            pdf.text(desc, borderX + 10, y);
            pdf.text(`$ ${fmtMoney(amount)}`, borderX + innerW - 4, y, { align: 'right' });
        }
        y += 5.5;
    };

    const mesCapitalized = format(mesDate, 'MMMM yyyy', { locale: es });
    const baseAlquiler = payment.montoAlquiler || payment.monto || 0;
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.15);
    pdf.line(borderX, y + 3, borderX + innerW, y + 3);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(20, 20, 20);
    pdf.text(`Alquiler Mensual — ${mesCapitalized.charAt(0).toUpperCase() + mesCapitalized.slice(1)}`, borderX + 4, y);
    pdf.text(`$ ${fmtMoney(baseAlquiler)}`, borderX + innerW - 4, y, { align: 'right' });
    y += 5.5;

    const hasExtras = (payment.detalleServicios?.length || 0) > 0 || (payment.cargosAdicionales?.length || 0) > 0;
    if (hasExtras) {
        addRow('Otros conceptos:', 0, true);
        payment.detalleServicios?.forEach(s => addRow(s.concepto.toUpperCase(), s.monto));
        payment.cargosAdicionales?.forEach(c => addRow(c.concepto.toUpperCase(), c.monto));
    }
    if (payment.montoPunitorios && payment.montoPunitorios > 0) addRow('INTERESES POR MORA', payment.montoPunitorios);
    if (payment.montoDescuento && payment.montoDescuento > 0) addRow('DESCUENTO', -payment.montoDescuento);

    // ── TOTAL BAR ─────────────────────────────────────────────────────────────
    y += 1;
    pdf.setFillColor(25, 28, 45);
    pdf.rect(borderX, y - 4, innerW, 9, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('TOTAL RECIBIDO', borderX + 4, y + 1);

    // Dotted line between label and amount
    pdf.setDrawColor(150, 150, 180);
    pdf.setLineWidth(0.3);
    pdf.setLineDashPattern([0.5, 1.5], 0);
    pdf.line(borderX + 48, y, borderX + innerW - 28, y + 1);
    pdf.setLineDashPattern([], 0);

    pdf.text(`$ ${fmtMoney(payment.monto)}`, borderX + innerW - 4, y + 1, { align: 'right' });
    y += 11;

    // ── FOOTER BLOCK ──────────────────────────────────────────────────────────
    // Signature line (left)
    const sigY = borderY + sectionHeight - 18;
    pdf.setDrawColor(80, 80, 80);
    pdf.setLineWidth(0.3);
    pdf.setLineDashPattern([1, 1], 0);
    pdf.line(borderX + 3, sigY, borderX + 58, sigY);
    pdf.setLineDashPattern([], 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(60, 60, 60);
    const firmanteStr = profile.firmante || profile.agencyManager || '';
    pdf.text(firmanteStr, borderX + 3, sigY + 4);
    pdf.setFontSize(6);
    pdf.text('Firma y aclaración', borderX + 3, sigY + 8);

    // Center: "no válido"
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(6);
    pdf.text('Documento no válido como factura', borderX + innerW / 2, sigY + 4, { align: 'center' });

    // Right: generated date + amount
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generado el ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, borderX + innerW - 3, sigY + 4, { align: 'right' });

    // Amount in words + Forma de pago
    const wordsY = y + 1;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Recibi(mos) la suma de:', borderX + 4, wordsY);
    pdf.setFont('helvetica', 'normal');
    const words = numberToWords(payment.monto);
    const wordLines = pdf.splitTextToSize(words + ' ._____', innerW - 55);
    pdf.text(wordLines, borderX + 48, wordsY);

    if (payment.metodoPago) {
        const metodoY = wordsY + 5;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text('Forma de pago:', borderX + 4, metodoY);
        pdf.setFont('helvetica', 'normal');
        const metodoStr = payment.metodoPago === 'efectivo' ? 'Efectivo'
            : payment.metodoPago === 'transferencia' ? `Transferencia${payment.nroComprobante ? ` — Comp. ${payment.nroComprobante}` : ''}`
                : payment.metodoPago;
        pdf.text(metodoStr, borderX + 34, metodoY);
    }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

export const receiptService = {
    async generateReceipt(payment: Pago, contract: Alquiler, profile?: AgencyProfile, userId?: string) {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pW = pdf.internal.pageSize.width;
        const pH = pdf.internal.pageSize.height;

        const receiptNumber = userId
            ? await getNextReceiptNumber(userId)
            : `0001-${Date.now().toString().slice(-8)}`;

        const logoImg = profile?.logoUrl ? await loadImageAsBase64(profile.logoUrl) : null;

        // ── Estimate required height per receipt ──────────────────────────────
        const BASE_HEIGHT_MM = 145;
        const ROW_MM = 6;

        const extraRows =
            ((payment.detalleServicios?.length ?? 0) > 0 ? 1 : 0) +
            (payment.detalleServicios?.length ?? 0) +
            (payment.cargosAdicionales?.length ?? 0) +
            (payment.montoPunitorios && payment.montoPunitorios > 0 ? 1 : 0) +
            (payment.montoDescuento && payment.montoDescuento > 0 ? 1 : 0);

        const estimatedH = BASE_HEIGHT_MM + extraRows * ROW_MM;
        const twoPerPage = estimatedH * 2 + 10 < pH;

        if (twoPerPage) {
            // ── 2 copies on one A4 page ─────────────────────────────────────
            const halfH = Math.floor(pH / 2) - 5;

            await drawReceiptSection(pdf, payment, contract, profile ?? {}, logoImg, receiptNumber, 'ORIGINAL', 0, halfH);

            const midY = halfH + 2;
            pdf.setDrawColor(120, 120, 140);
            pdf.setLineWidth(0.35);
            pdf.setLineDashPattern([2, 2], 0);
            pdf.line(14, midY, pW - 14, midY);
            pdf.setLineDashPattern([], 0);
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(6.5);
            pdf.setTextColor(130, 130, 150);
            pdf.text('✂  CORTAR AQUÍ', pW / 2, midY + 3, { align: 'center' });

            await drawReceiptSection(pdf, payment, contract, profile ?? {}, logoImg, receiptNumber, 'DUPLICADO', midY + 5, halfH);

        } else {
            // ── 1 copy per page ──────────────────────────────────────────────
            const fullH = pH - 6;
            await drawReceiptSection(pdf, payment, contract, profile ?? {}, logoImg, receiptNumber, 'ORIGINAL', 0, fullH);
            pdf.addPage();
            await drawReceiptSection(pdf, payment, contract, profile ?? {}, logoImg, receiptNumber, 'DUPLICADO', 0, fullH);
        }


        // ── Save ────────────────────────────────────────────────────────────
        const mesFormatted = format(
            parseSafeDate(new Date(`${payment.mes}-02`)),
            'MMMM_yyyy', { locale: es }
        );
        const safeName = contract.direccion?.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-áéíóúüñÁÉÍÓÚÜÑ]/g, '') ?? 'Alquiler';
        pdf.save(`Recibo_${safeName}_${mesFormatted}.pdf`);
    },

    generateLiquidacionReceipt(liquidacion: Liquidacion, contract: Alquiler, profile?: AgencyProfile) {
        const pdf = new jsPDF();
        const pW = pdf.internal.pageSize.width;
        const M = 14;
        let y = M;

        pdf.setFillColor(25, 28, 45);
        pdf.rect(M, y, pW - M * 2, 22, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(12);
        pdf.text('Liquidación al Propietario', pW / 2, y + 12, { align: 'center' });
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(6.5);
        pdf.setTextColor(190, 195, 220);
        if (profile?.agencyName || profile?.nombreComercial) {
            pdf.text(profile.agencyName ?? profile.nombreComercial ?? '', pW / 2, y + 18, { align: 'center' });
        }
        y += 28;

        pdf.setTextColor(60, 65, 90);
        pdf.setFontSize(8.5);
        pdf.setFont('helvetica', 'normal');
        const fechaEmision = format(parseSafeDate(liquidacion.fechaEmision), "dd 'de' MMMM 'de' yyyy", { locale: es });
        pdf.text(`Fecha de Emisión: ${fechaEmision}`, pW - M, y, { align: 'right' });
        pdf.text(`Propiedad: ${contract.direccion}`, M, y); y += 5;
        pdf.text(`Propietario: ${contract.nombrePropietario || '-'}`, M, y); y += 5;
        pdf.text(`Período: ${format(parseSafeDate(new Date(`${liquidacion.mes}-02`)), 'MMMM yyyy', { locale: es }).toUpperCase()}`, M, y); y += 10;

        pdf.setFillColor(230, 233, 245);
        pdf.rect(M, y - 4, pW - M * 2, 8, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(40, 45, 80);
        pdf.text('Concepto', M, y);
        pdf.text('Monto', pW - M, y, { align: 'right' });
        y += 7;

        liquidacion.detalles.forEach(d => {
            const isEgreso = d.tipo === 'egreso';
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
            pdf.setTextColor(isEgreso ? 180 : 30, isEgreso ? 40 : 32, isEgreso ? 40 : 50);
            pdf.text(d.concepto, M, y);
            pdf.text(`${isEgreso ? '-' : ''}$ ${fmtMoney(d.monto)}`, pW - M, y, { align: 'right' });
            pdf.setDrawColor(220, 222, 235);
            pdf.line(M, y + 2, pW - M, y + 2);
            y += 8;
        });

        y += 2;
        pdf.setFillColor(25, 28, 45);
        pdf.rect(M, y - 4, pW - M * 2, 10, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        pdf.text('NETO A PAGAR', M, y + 1);
        pdf.text(`$ ${fmtMoney(liquidacion.netoAPagar)}`, pW - M, y + 1, { align: 'right' });
        y += 16;

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 170);
        pdf.text('Documento no válido como factura', pW / 2, y, { align: 'center' });

        pdf.save(`Liquidacion_${contract.direccion}_${liquidacion.mes}.pdf`);
    }
};
