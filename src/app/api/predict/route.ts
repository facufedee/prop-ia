import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PricingStrategy } from '../../../domain/strategies/PricingStrategy';
import { RuleBasedPricingStrategy } from '../../../infrastructure/strategies/RuleBasedPricingStrategy';
import { MLPricingStrategy } from '../../../infrastructure/strategies/MLPricingStrategy';

// Input Validation Schema (Injection Protection)
const PredictionSchema = z.object({
  rooms: z.number().min(0).max(50).optional(),
  bathrooms: z.number().min(0).max(20).optional(),
  bedrooms: z.number().min(0).max(20).optional(),
  surface_total: z.number().positive().max(100000).optional(),
  property_type: z.string().regex(/^[a-zA-Z\s]+$/).max(50).optional(),
  location: z.string().max(200).optional(),
  description: z.string().max(5000).optional(),
  expenses: z.number().min(0).optional(),
  construction_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  floor: z.number().min(-5).max(200).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate Input
    const validation = PredictionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      );
    }
    const safeBody = validation.data;

    // Check if we should use ML model (query param ?useML=true)
    const url = new URL(request.url);
    const useML = url.searchParams.get('useML') === 'true';

    // Strategy Selection
    let strategy: PricingStrategy;

    if (useML) {
      strategy = new MLPricingStrategy();
    } else {
      strategy = new RuleBasedPricingStrategy();
    }

    try {
      const prediction = await strategy.calculate(safeBody);
      return NextResponse.json({ prediction: prediction });
    } catch (strategyError: unknown) {
      console.error('Strategy execution failed:', strategyError);
      return NextResponse.json(
        { error: strategyError instanceof Error ? strategyError.message : 'Strategy error' },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}