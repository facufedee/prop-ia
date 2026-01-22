export interface Provincia {
    id: string;
    nombre: string;
}

export interface Localidad {
    id: string;
    nombre: string;
    departamento: {
        id: string;
        nombre: string;
    };
    provincia: {
        id: string;
        nombre: string;
    };
}

const BASE_URL = "https://apis.datos.gob.ar/georef/api";

const FALLBACK_PROVINCIAS: Provincia[] = [
    { id: "02", nombre: "Ciudad Autónoma de Buenos Aires" },
    { id: "06", nombre: "Buenos Aires" },
    { id: "10", nombre: "Catamarca" },
    { id: "14", nombre: "Córdoba" },
    { id: "18", nombre: "Corrientes" },
    { id: "22", nombre: "Chaco" },
    { id: "26", nombre: "Chubut" },
    { id: "30", nombre: "Entre Ríos" },
    { id: "34", nombre: "Formosa" },
    { id: "38", nombre: "Jujuy" },
    { id: "42", nombre: "La Pampa" },
    { id: "46", nombre: "La Rioja" },
    { id: "50", nombre: "Mendoza" },
    { id: "54", nombre: "Misiones" },
    { id: "58", nombre: "Neuquén" },
    { id: "62", nombre: "Río Negro" },
    { id: "66", nombre: "Salta" },
    { id: "70", nombre: "San Juan" },
    { id: "74", nombre: "San Luis" },
    { id: "78", nombre: "Santa Cruz" },
    { id: "82", nombre: "Santa Fe" },
    { id: "86", nombre: "Santiago del Estero" },
    { id: "90", nombre: "Tucumán" },
    { id: "94", nombre: "Tierra del Fuego, Antártida e Islas del Atlántico Sur" }
];

export const locationService = {
    async getProvincias(): Promise<Provincia[]> {
        try {
            const response = await fetch(`${BASE_URL}/provincias?orden=nombre&max=50`);
            if (!response.ok) throw new Error("API response not ok");
            const data = await response.json();
            return data.provincias;
        } catch (error) {
            console.warn("⚠️ API Georef caída o bloqueada. Usando datos locales.", error);
            return FALLBACK_PROVINCIAS;
        }
    },

    async getLocalidades(provinciaId: string): Promise<Localidad[]> {
        try {
            // Fetch localities for a specific province
            const url = `${BASE_URL}/localidades?provincia=${provinciaId}&orden=nombre&max=5000`;
            console.log("Fetching localities from:", url);

            const response = await fetch(url);
            if (!response.ok) {
                console.warn("⚠️ API Georef no disponible para localidades");
                return [];
            }
            const data = await response.json();
            console.log(`API returned ${data.localidades?.length} localities`);
            return data.localidades || [];
        } catch (error) {
            console.warn("⚠️ Error de red al cargar localidades. Continuando sin localidades.", error);
            return [];
        }
    },

    async searchDireccion(direccion: string): Promise<any[]> {
        try {
            const response = await fetch(`${BASE_URL}/direcciones?direccion=${encodeURIComponent(direccion)}&max=5`);
            const data = await response.json();
            return data.direcciones;
        } catch (error) {
            console.error("Error searching address:", error);
            return [];
        }
    }
};
