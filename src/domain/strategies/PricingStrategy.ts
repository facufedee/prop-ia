export interface PropertyData {
    rooms?: number;
    bathrooms?: number;
    bedrooms?: number;
    surface_total?: number;
    property_type?: string;
    location?: string;
    description?: string;
    expenses?: number;
    construction_year?: number;
    floor?: number;
}

export interface PricingStrategy {
    calculate(data: PropertyData): Promise<number>;
}
