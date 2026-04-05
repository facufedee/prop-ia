import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PricingStrategy } from "../../../domain/strategies/PricingStrategy";
import { RuleBasedPricingStrategy } from "../../../infrastructure/strategies/RuleBasedPricingStrategy";
import { MLPricingStrategy } from "../../../infrastructure/strategies/MLPricingStrategy";

const PredictionSchema = z.object({
    rooms: z.number().min(0).max(50).optional(),
    bathrooms: z.number().min(0).max(20).optional(),
    bedrooms: z.number().min(0).max(20).optional(),
    surface_total: z.number().positive().max(100000).optional(),
    property_type: z.string().regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s/]+$/).max(50).optional(),
    location: z.string().max(200).optional(),
    description: z.string().max(5000).optional(),
    expenses: z.number().min(0).optional(),
    construction_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
    floor: z.number().min(-5).max(200).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const validation = PredictionSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }
        const safeBody = validation.data;

        const url = new URL(request.url);
        const useML = url.searchParams.get("useML") === "true";

        let strategy: PricingStrategy;
        if (useML) {
            strategy = new MLPricingStrategy();
        } else {
            strategy = new RuleBasedPricingStrategy();
        }

        try {
            const prediction = await strategy.calculate(safeBody);
            return NextResponse.json({ prediction });
        } catch (strategyError: unknown) {
            console.error("Strategy execution failed:", strategyError);
            return NextResponse.json({ error: "Error calculando predicción" }, { status: 500 });
        }
    } catch (error: unknown) {
        console.error("[predict] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
