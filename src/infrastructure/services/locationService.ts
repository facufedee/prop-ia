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

export const locationService = {
    async getProvincias(): Promise<Provincia[]> {
        try {
            const response = await fetch(`${BASE_URL}/provincias?orden=nombre&max=50`);
            const data = await response.json();
            return data.provincias;
        } catch (error) {
            console.error("Error fetching provincias:", error);
            return [];
        }
    },

    async getLocalidades(provinciaId: string): Promise<Localidad[]> {
        try {
            // Fetch localities for a specific province
            const response = await fetch(`${BASE_URL}/localidades?provincia=${provinciaId}&orden=nombre&max=1000`);
            const data = await response.json();
            return data.localidades;
        } catch (error) {
            console.error("Error fetching localidades:", error);
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
