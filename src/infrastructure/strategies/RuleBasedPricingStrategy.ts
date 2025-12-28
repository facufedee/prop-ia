import { PricingStrategy, PropertyData } from '../../domain/strategies/PricingStrategy';

export class RuleBasedPricingStrategy implements PricingStrategy {
    async calculate(data: PropertyData): Promise<number> {
        const {
            rooms,
            bathrooms,
            bedrooms,
            surface_total,
            property_type,
            location,
            description,
            expenses,
            construction_year,
            floor
        } = data;

        // Base prediction formula
        let prediction = (surface_total || 100) * 1000 + (rooms || 3) * 20000 + (bathrooms || 2) * 15000 + (bedrooms || 2) * 25000;

        // Add expenses impact
        if (expenses) prediction += expenses * 1;

        // Floor impact
        if (floor && property_type === 'Departamento') {
            if (floor >= 10) prediction *= 1.08;
            else if (floor >= 5) prediction *= 1.05;
            else if (floor >= 3) prediction *= 1.02;
        }

        // Construction year impact
        if (construction_year) {
            const age = new Date().getFullYear() - construction_year;
            if (age < 10) prediction *= 1.1;
            else if (age > 30) prediction *= 0.9;
        }

        // Features impact
        if (description) {
            const features = description.toLowerCase();
            if (features.includes('pileta')) prediction *= 1.15;
            if (features.includes('cochera')) prediction *= 1.10;
            if (features.includes('sum')) prediction *= 1.12;
            if (features.includes('seguridad')) prediction *= 1.08;
            if (features.includes('balcon')) prediction *= 1.05;
            if (features.includes('terraza')) prediction *= 1.06;
            if (features.includes('jardin')) prediction *= 1.07;
            if (features.includes('gimnasio')) prediction *= 1.04;
        }

        // Property type multiplier
        if (property_type === 'Casa') prediction *= 1.25;
        else if (property_type === 'PH') prediction *= 1.15;
        else if (property_type === 'Departamento') prediction *= 1.0;

        // Location multiplier
        let locationMultiplier = 1.0;
        if (location) {
            const loc = location.toLowerCase();
            if (loc.includes('capital federal') || loc.includes('palermo') || loc.includes('belgrano') || loc.includes('recoleta') || loc.includes('puerto madero')) {
                locationMultiplier = 1.2;
            } else if (loc.includes('buenos aires') || loc.includes('la plata') || loc.includes('mar del plata') || loc.includes('rosario') || loc.includes('córdoba')) {
                locationMultiplier = 1.0;
            } else if (loc.includes('mendoza') || loc.includes('bariloche') || loc.includes('salta') || loc.includes('ushuaia')) {
                locationMultiplier = 0.9;
            } else {
                locationMultiplier = 0.6;
            }
        }

        prediction *= locationMultiplier;

        return prediction;
    }
}
