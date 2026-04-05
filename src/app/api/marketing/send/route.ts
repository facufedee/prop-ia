import { NextRequest, NextResponse } from "next/server";
import { marketingEmailService, EmailTemplateType } from "@/infrastructure/services/marketingEmailService";
import { verifyAdmin } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
    const authResult = await verifyAdmin(req);
    if (authResult.error) return authResult.error;

    try {
        const body = await req.json();
        const { type, to, data } = body as {
            type: EmailTemplateType;
            to: string;
            data: Record<string, any>;
        };

        if (!type || !to) {
            return NextResponse.json({ error: "Missing type or to" }, { status: 400 });
        }

        switch (type) {
            case "welcome":
                await marketingEmailService.sendWelcomeEmail(to, data);
                break;
            case "payment_confirmed":
                await marketingEmailService.sendPaymentConfirmedEmail(to, data);
                break;
            case "payment_expiring":
                await marketingEmailService.sendPaymentExpiringEmail(to, data);
                break;
            case "new_lead":
                await marketingEmailService.sendNewLeadEmail(to, data);
                break;
            default:
                await marketingEmailService.sendCustomEmail(to, type, data);
                break;
        }

        return NextResponse.json({ success: true, type });
    } catch (error: any) {
        console.error("[API /marketing/send] Error:", error.message);
        return NextResponse.json({ error: "Error enviando email" }, { status: 500 });
    }
}
