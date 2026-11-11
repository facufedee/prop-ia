import { addDays, addMonths, format, startOfDay, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { Alquiler } from "@/domain/models/Alquiler";
import { getContractAlerts } from "@/lib/financial/contractAlerts";

type SummaryContract = Pick<
    Alquiler,
    | "id" | "estado" | "direccion" | "fechaInicio" | "fechaFin" | "diaVencimiento" | "montoMensual"
    | "ajusteTipo" | "ajusteValor" | "ajusteFrecuencia" | "historialPagos" | "historialLiquidaciones"
>;

interface PendingItem {
    alquilerId: string;
    direccion: string;
    mes: string;
}

export interface PendingSummary {
    /** Unpaid months whose due date passed. */
    overdue: PendingItem[];
    /** Unpaid months due within the next 7 days. */
    upcoming: (PendingItem & { dueDate: Date })[];
    /** Paid months with no settlement to the owner yet. */
    toSettle: PendingItem[];
    /** Settlements issued but not paid to the owner. */
    pendingSettlements: number;
    increases: { alquilerId: string; direccion: string; month: string; status: "due" | "upcoming" }[];
    total: number;
}

const UPCOMING_DAYS = 7;

export function buildPendingSummary(contracts: SummaryContract[], today: Date = new Date()): PendingSummary {
    const summary: PendingSummary = { overdue: [], upcoming: [], toSettle: [], pendingSettlements: 0, increases: [], total: 0 };
    const todayStart = startOfDay(today);
    const upcomingLimit = addDays(todayStart, UPCOMING_DAYS);

    for (const contract of contracts.filter(c => c.estado === "activo")) {
        const base = { alquilerId: contract.id, direccion: contract.direccion };
        const pagos = contract.historialPagos || [];
        const liquidaciones = contract.historialLiquidaciones || [];
        const alerts = getContractAlerts(contract, today);

        summary.overdue.push(...alerts.overdueMonths.map(mes => ({ ...base, mes })));
        if (alerts.adjustment) summary.increases.push({ ...base, ...alerts.adjustment });

        const dueDay = contract.diaVencimiento && contract.diaVencimiento > 0 && contract.diaVencimiento <= 31 ? contract.diaVencimiento : 10;
        const end = startOfMonth(new Date(contract.fechaFin));
        for (let month = startOfMonth(today); month <= addMonths(startOfMonth(today), 1) && month <= end; month = addMonths(month, 1)) {
            const mes = format(month, "yyyy-MM");
            if (pagos.some(p => p.mes === mes && p.estado === "pagado")) continue;
            const dueDate = new Date(month.getFullYear(), month.getMonth(), dueDay);
            if (dueDate >= todayStart && dueDate <= upcomingLimit) summary.upcoming.push({ ...base, mes, dueDate });
        }

        pagos
            .filter(p => p.estado === "pagado" && !liquidaciones.some(l => l.mes === p.mes))
            .forEach(p => summary.toSettle.push({ ...base, mes: p.mes }));
        summary.pendingSettlements += liquidaciones.filter(l => l.estado === "pendiente").length;
    }

    summary.total = summary.overdue.length + summary.upcoming.length + summary.toSettle.length
        + summary.pendingSettlements + summary.increases.length;
    return summary;
}

const monthName = (mes: string) => format(new Date(`${mes}-01T12:00:00`), "MMMM", { locale: es });
const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
const listItems = <T,>(items: T[], render: (item: T) => string) => {
    const shown = items.slice(0, 3).map(render).join(", ");
    return items.length > 3 ? `${shown} y ${items.length - 3} más` : shown;
};

/** Markdown greeting for the assistant chat with what the user has pending. */
export function formatPendingGreeting(summary: PendingSummary): string {
    if (summary.total === 0) {
        return "¡Hola! Soy **Capi** 🦫 Está todo al día 👌 ¿En qué te ayudo?";
    }

    const lines: string[] = [];
    if (summary.overdue.length > 0) {
        lines.push(`- 🔴 **${plural(summary.overdue.length, "cobro vencido", "cobros vencidos")}**: ${listItems(summary.overdue, i => `${i.direccion} (${monthName(i.mes)})`)}. [Ver agenda](/dashboard/agenda-cobros)`);
    }
    if (summary.upcoming.length > 0) {
        lines.push(`- 📅 **Cobros de esta semana**: ${listItems(summary.upcoming, i => `${i.direccion} vence el ${format(i.dueDate, "dd/MM")}`)}.`);
    }
    if (summary.toSettle.length > 0 || summary.pendingSettlements > 0) {
        const parts: string[] = [];
        if (summary.toSettle.length > 0) {
            parts.push(`**${plural(summary.toSettle.length, "cobro para liquidar", "cobros para liquidar")}** al propietario: ${listItems(summary.toSettle, i => `${i.direccion} (${monthName(i.mes)})`)}.`);
        }
        if (summary.pendingSettlements > 0) {
            const text = plural(summary.pendingSettlements, "liquidación sin pagar", "liquidaciones sin pagar");
            parts.push(summary.toSettle.length > 0 ? `También tenés ${text}.` : `**${text}** al propietario.`);
        }
        lines.push(`- 💸 ${parts.join(" ")} [Ver liquidaciones](/dashboard/liquidaciones)`);
    }
    for (const increase of summary.increases.slice(0, 3)) {
        lines.push(increase.status === "due"
            ? `- 📈 **Aumento pendiente** en [${increase.direccion}](/dashboard/alquileres/${increase.alquilerId}): corresponde desde ${monthName(increase.month)}. Entrá y tocá **Aumentar**.`
            : `- 🗓️ **Aumento en ${monthName(increase.month)}** para [${increase.direccion}](/dashboard/alquileres/${increase.alquilerId}).`);
    }

    return `¡Hola! Soy **Capi** 🦫 Esto es lo que tenés pendiente:\n\n${lines.join("\n")}`;
}
