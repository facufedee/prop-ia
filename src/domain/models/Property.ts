export interface Property {
    id: string;
    url?: string;
    title: string;
    content?: string; // Descripción del inmueble

    // Clasificación
    type: PropertyOperation; // For Rent, For Sale, etc.
    property_type: PropertyType; // Casa, Departamento, etc.

    // Precio
    price: number;
    currency: 'USD' | 'ARS';
    expenses?: number; // Valor de expensas

    // Ubicación
    address: string; // Calle y altura
    address_name: string;
    address_number: string;
    address_floor?: string;
    address_apartment?: string;
    between_street_1?: string;
    between_street_2?: string;
    near_street?: string;
    hidden_address?: boolean;
    city: string;
    region?: string; // Partido o localidad
    country: string;
    postal_code?: string;
    location?: {
        latitude: number;
        longitude: number;
    };

    // Características Principales
    floor_area?: number; // Superficie cubierta
    plot_area?: number; // Superficie total
    land_area?: number; // Superficie terreno
    rooms?: number; // Habitaciones
    bathrooms?: number;
    condition?: PropertyCondition;
    year_built?: number; // Año de construcción
    is_new?: boolean;
    antiquity?: number; // Antigüedad

    // Características Adicionales
    floors?: number;
    orientation?: PropertyOrientation;
    disposition?: PropertyDisposition;

    // Medidas Terreno
    length?: number;
    width?: number;
    free_back?: string; // Fondo libre

    // Cocheras
    open_garages?: number;
    covered_garages?: number;
    garage_type?: string;
    garage_access?: string;
    garage_vehicle_size?: string;

    // Servicios y Amenities
    services?: string[]; // Agua corriente, Gas, etc.
    amenities?: string[]; // Parrilla, Pileta, etc.
    ambients?: PropertyAmbient[];

    // Detalles Constructivos
    ceilings_of?: string;
    walls_of?: string;
    floors_of?: string;
    roof_type?: string;

    // Aptos
    apto_credito?: boolean;
    apto_professional?: boolean;

    // Multimedia
    images: PropertyImage[];
    video_url?: string;
    tour_360_url?: string;

    // Metadatos
    created_at?: string;
    updated_at?: string;
    status: 'active' | 'inactive' | 'reserved' | 'sold';

    // Relaciones
    branchId?: string;
    real_estate_id?: string; // ID de la inmobiliaria en el sistema externo
    seller?: SellerInfo;
}

export interface PropertyImage {
    url: string;
    featured?: boolean;
    title?: string;
}

export interface PropertyAmbient {
    type: string;
    length?: number;
    width?: number;
    floor?: string;
}

export interface SellerInfo {
    full_name: string;
    email: string;
    phone?: string;
}

// Enums según estándar
export type PropertyOperation =
    | 'For Rent' | 'For Sale' | 'Parking For Rent' | 'Parking For Sale'
    | 'Office For Rent' | 'Office For Sale' | 'Land For Sale'
    | 'For Rent Local' | 'For Sale Local' | 'Transfer Local'
    | 'Country House Rentals' | 'Warehouse For Rent' | 'Warehouse For Sale';

export type PropertyType =
    | 'Casa' | 'Departamento' | 'Isla' | 'Quinta' | 'Terreno'
    | 'Tipo casa PH' | 'Campo' | 'Cochera' | 'Fondo de comercio'
    | 'Galpón' | 'Local' | 'Oficina' | 'Edificio' | 'Hotel' | 'Negocio Especial';

export type PropertyCondition =
    | 'Excelente' | 'Muy bueno' | 'Bueno' | 'Regular'
    | 'A refaccionar' | 'Reciclado' | 'A estrenar';

export type PropertyOrientation =
    | 'Este' | 'Oeste' | 'Norte' | 'Sur'
    | 'Nordoeste' | 'Sudeste' | 'Sudoeste' | 'Nordeste';

export type PropertyDisposition =
    | 'Al frente' | 'Contrafrente' | 'Interno' | 'Lateral';
