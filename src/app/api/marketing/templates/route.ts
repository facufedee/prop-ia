import { NextRequest, NextResponse } from "next/server";
import { marketingEmailService } from "@/infrastructure/services/marketingEmailService";
import { verifyAdmin } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
    const authResult = await verifyAdmin(request);
    if (authResult.error) return authResult.error;

    try {
        const [templates, stats, logs] = await Promise.all([
            marketingEmailService.getTemplates(),
            marketingEmailService.getEmailStats(),
            marketingEmailService.getEmailLogs(20),
        ]);
        return NextResponse.json({ templates, stats, logs });
    } catch (error: any) {
        console.error("[API /marketing/templates] GET error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const authResult = await verifyAdmin(req);
    if (authResult.error) return authResult.error;

    try {
        const body = await req.json();
        const { type, name, subject, html, updatedBy } = body;

        if (!type || !subject || !html) {
            return NextResponse.json({ error: "Missing type, subject, or html" }, { status: 400 });
        }

        const id = await marketingEmailService.saveTemplate(
            { type, name: name || type, subject, html },
            updatedBy
        );
        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error("[API /marketing/templates] POST error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const authResult = await verifyAdmin(req);
    if (authResult.error) return authResult.error;

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Missing id" }, { status: 400 });
        }

        await marketingEmailService.deleteTemplate(id);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[API /marketing/templates] DELETE error:", error.message);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
