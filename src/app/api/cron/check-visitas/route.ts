import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/infrastructure/firebase/admin";
import { Timestamp } from "firebase-admin/firestore";
import { sendEmailWithResend } from "@/lib/resend";
import { verifyCronSecret } from "@/lib/apiAuth";

/**
 * Cron: recordatorios de visitas agendadas.
 * Corre diariamente a las 9 AM ARG (12:00 UTC).
 * GET /api/cron/check-visitas
 * Header requerido: x-cron-secret: <CRON_SECRET>
 *
 * Envía dos recordatorios por visita:
 *  - 24h antes → email al agente + campanita
 *  - Mismo día →                    campanita
 */
export async function GET(request: NextRequest) {
    const authError = verifyCronSecret(request);
    if (authError) return authError;

    const now = new Date();
    const results = { notified24h: 0, notifiedHoy: 0, errors: [] as string[] };

    // ── Helpers ───────────────────────────────────────────────────────────────

    const formatFecha = (d: Date) =>
        d.toLocaleDateString("es-AR", {
            weekday: "long", day: "numeric", month: "long",
            timeZone: "America/Argentina/Buenos_Aires",
        });

    const formatHora = (d: Date) =>
        d.toLocaleTimeString("es-AR", {
            hour: "2-digit", minute: "2-digit",
            timeZone: "America/Argentina/Buenos_Aires",
        });

    const createNotification = (userId: string, title: string, message: string, link: string) =>
        adminDb.collection("notifications").add({
            title, message,
            type: "info",
            targetUserId: userId,
            targetRole: null,
            readBy: [],
            createdAt: new Date(),
            link,
        });

    const getAgentEmail = async (userId: string): Promise<string | null> => {
        const snap = await adminDb.collection("users").doc(userId).get();
        return snap.exists ? snap.data()?.email ?? null : null;
    };

    // ── 1. Recordatorio 24h antes ─────────────────────────────────────────────
    // Ventana: visitas entre 23h y 25h a partir de ahora
    const snap24h = await adminDb
        .collection("visitas")
        .where("fechaHora", ">=", Timestamp.fromDate(new Date(now.getTime() + 23 * 3600_000)))
        .where("fechaHora", "<=", Timestamp.fromDate(new Date(now.getTime() + 25 * 3600_000)))
        .where("recordatorioEnviado", "==", false)
        .get();

    for (const doc of snap24h.docs) {
        const v = doc.data();
        if (v.estado === "cancelada" || v.estado === "completada") continue;

        const fechaHora: Date = v.fechaHora?.toDate?.() ?? new Date(v.fechaHora);
        const fecha = formatFecha(fechaHora);
        const hora  = formatHora(fechaHora);

        try {
            // Email al agente
            const agentEmail = await getAgentEmail(v.userId);
            if (agentEmail) {
                await sendEmailWithResend({
                    to: agentEmail,
                    subject: `📅 Visita mañana: ${v.propiedadDireccion} con ${v.clienteNombre}`,
                    html: `
                        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#111827">
                            <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;border-radius:16px 16px 0 0">
                                <h1 style="color:white;margin:0;font-size:20px">📅 Visita programada para mañana</h1>
                                <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px">Recordatorio automático — ZetaProp</p>
                            </div>
                            <div style="background:#fff;padding:28px 32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px">
                                <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
                                    <tr><td style="padding:8px 0;color:#6b7280;width:110px;font-size:14px">📍 Propiedad</td><td style="padding:8px 0;font-weight:600">${v.propiedadDireccion}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">👤 Cliente</td><td style="padding:8px 0;font-weight:600">${v.clienteNombre}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">📞 Teléfono</td><td style="padding:8px 0">${v.clienteTelefono || "—"}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">📅 Fecha</td><td style="padding:8px 0;font-weight:600">${fecha}</td></tr>
                                    <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">🕐 Horario</td><td style="padding:8px 0;font-weight:600">${hora} hs</td></tr>
                                    ${v.notasPrevias ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px">📝 Notas</td><td style="padding:8px 0;color:#4b5563;font-style:italic">${v.notasPrevias}</td></tr>` : ""}
                                </table>
                                <a href="https://zetaprop.com.ar/dashboard/calendario/${doc.id}"
                                   style="display:inline-block;padding:12px 24px;background:#4f46e5;color:white;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
                                    Ver detalle de la visita →
                                </a>
                            </div>
                        </div>
                    `,
                });
            }

            // Campanita in-app
            await createNotification(
                v.userId,
                "📅 Visita mañana",
                `${v.clienteNombre} visita ${v.propiedadDireccion} mañana a las ${hora} hs`,
                `/dashboard/calendario/${doc.id}`
            );

            await doc.ref.update({ recordatorioEnviado: true });
            results.notified24h++;

        } catch (err: any) {
            console.error(`[check-visitas] Error 24h para ${doc.id}:`, err.message);
            results.errors.push(`24h:${doc.id}`);
        }
    }

    // ── 2. Recordatorio mismo día ─────────────────────────────────────────────
    // Ventana: visitas que ocurren en las próximas 12h (resto del día de hoy)
    const snapHoy = await adminDb
        .collection("visitas")
        .where("fechaHora", ">=", Timestamp.fromDate(now))
        .where("fechaHora", "<=", Timestamp.fromDate(new Date(now.getTime() + 12 * 3600_000)))
        .where("recordatorioMismoDiaEnviado", "==", false)
        .get();

    for (const doc of snapHoy.docs) {
        const v = doc.data();
        if (v.estado === "cancelada" || v.estado === "completada") continue;

        const fechaHora: Date = v.fechaHora?.toDate?.() ?? new Date(v.fechaHora);
        const hora = formatHora(fechaHora);

        try {
            // Solo campanita (sin email para no saturar)
            await createNotification(
                v.userId,
                "🗓 Visita hoy",
                `${v.clienteNombre} visita ${v.propiedadDireccion} hoy a las ${hora} hs`,
                `/dashboard/calendario/${doc.id}`
            );

            await doc.ref.update({ recordatorioMismoDiaEnviado: true });
            results.notifiedHoy++;

        } catch (err: any) {
            console.error(`[check-visitas] Error mismo día para ${doc.id}:`, err.message);
            results.errors.push(`hoy:${doc.id}`);
        }
    }

    console.log("[check-visitas]", results);
    return NextResponse.json({ success: true, ...results });
}
