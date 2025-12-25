/**
 * Utilidades de validación para formularios argentinos
 */

export const validators = {
    /**
     * Valida DNI argentino (7-8 dígitos)
     */
    validateDNI(dni: string): { valid: boolean; message: string } {
        const cleaned = dni.replace(/\D/g, '');

        if (cleaned.length < 7 || cleaned.length > 8) {
            return { valid: false, message: 'El DNI debe tener 7 u 8 dígitos' };
        }

        return { valid: true, message: 'DNI válido' };
    },

    /**
     * Valida CUIT/CUIL argentino con dígito verificador
     */
    validateCUIT(cuit: string): { valid: boolean; message: string } {
        const cleaned = cuit.replace(/\D/g, '');

        if (cleaned.length !== 11) {
            return { valid: false, message: 'El CUIT debe tener 11 dígitos' };
        }

        // Validar dígito verificador
        const [tipo, dni, verificador] = [
            cleaned.substring(0, 2),
            cleaned.substring(2, 10),
            parseInt(cleaned.substring(10, 11))
        ];

        const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        let suma = 0;

        for (let i = 0; i < 10; i++) {
            suma += parseInt(cleaned.charAt(i)) * multiplicadores[i];
        }

        const resto = suma % 11;
        const digitoCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

        if (digitoCalculado !== verificador) {
            return { valid: false, message: 'CUIT inválido (dígito verificador incorrecto)' };
        }

        return { valid: true, message: 'CUIT válido' };
    },

    /**
     * Valida CBU argentino (22 dígitos con verificadores)
     */
    validateCBU(cbu: string): { valid: boolean; message: string } {
        const cleaned = cbu.replace(/\D/g, '');

        if (cleaned.length !== 22) {
            return { valid: false, message: 'El CBU debe tener exactamente 22 dígitos' };
        }

        // Validar primer bloque (banco + sucursal + dígito verificador)
        const bloque1 = cleaned.substring(0, 8);
        const dv1 = parseInt(cleaned.charAt(7));

        const suma1 =
            parseInt(bloque1.charAt(0)) * 7 +
            parseInt(bloque1.charAt(1)) * 1 +
            parseInt(bloque1.charAt(2)) * 3 +
            parseInt(bloque1.charAt(3)) * 9 +
            parseInt(bloque1.charAt(4)) * 7 +
            parseInt(bloque1.charAt(5)) * 1 +
            parseInt(bloque1.charAt(6)) * 3;

        const diferencia1 = 10 - (suma1 % 10);
        const dvCalculado1 = diferencia1 === 10 ? 0 : diferencia1;

        if (dvCalculado1 !== dv1) {
            return { valid: false, message: 'CBU inválido (primer dígito verificador incorrecto)' };
        }

        // Validar segundo bloque (cuenta + dígito verificador)
        const bloque2 = cleaned.substring(8, 22);
        const dv2 = parseInt(cleaned.charAt(21));

        const suma2 =
            parseInt(bloque2.charAt(0)) * 3 +
            parseInt(bloque2.charAt(1)) * 9 +
            parseInt(bloque2.charAt(2)) * 7 +
            parseInt(bloque2.charAt(3)) * 1 +
            parseInt(bloque2.charAt(4)) * 3 +
            parseInt(bloque2.charAt(5)) * 9 +
            parseInt(bloque2.charAt(6)) * 7 +
            parseInt(bloque2.charAt(7)) * 1 +
            parseInt(bloque2.charAt(8)) * 3 +
            parseInt(bloque2.charAt(9)) * 9 +
            parseInt(bloque2.charAt(10)) * 7 +
            parseInt(bloque2.charAt(11)) * 1 +
            parseInt(bloque2.charAt(12)) * 3;

        const diferencia2 = 10 - (suma2 % 10);
        const dvCalculado2 = diferencia2 === 10 ? 0 : diferencia2;

        if (dvCalculado2 !== dv2) {
            return { valid: false, message: 'CBU inválido (segundo dígito verificador incorrecto)' };
        }

        return { valid: true, message: 'CBU válido' };
    },

    /**
     * Valida email
     */
    validateEmail(email: string): { valid: boolean; message: string } {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regex.test(email)) {
            return { valid: false, message: 'Ingrese un email válido' };
        }

        if (email.length > 100) {
            return { valid: false, message: 'El email no puede superar los 100 caracteres' };
        }

        return { valid: true, message: 'Email válido' };
    },

    /**
     * Valida teléfono argentino
     */
    validatePhone(phone: string): { valid: boolean; message: string } {
        const cleaned = phone.replace(/\D/g, '');

        if (cleaned.length < 10 || cleaned.length > 15) {
            return { valid: false, message: 'El teléfono debe tener entre 10 y 15 dígitos' };
        }

        return { valid: true, message: 'Teléfono válido' };
    },

    /**
     * Valida alias bancario
     */
    validateAlias(alias: string): { valid: boolean; message: string } {
        const regex = /^[a-zA-Z0-9.]+$/;

        if (!regex.test(alias)) {
            return { valid: false, message: 'El alias solo puede contener letras, números y puntos' };
        }

        if (alias.length > 20) {
            return { valid: false, message: 'El alias no puede superar los 20 caracteres' };
        }

        return { valid: true, message: 'Alias válido' };
    }
};

/**
 * Formateadores automáticos
 */
export const formatters = {
    /**
     * Formatea CUIT con guiones: XX-XXXXXXXX-X
     */
    formatCUIT(input: string): string {
        const cleaned = input.replace(/\D/g, '');

        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10, 11)}`;
    },

    /**
     * Formatea CBU en bloques: XXXXXXXX XXXXXXXXXXXXXX
     */
    formatCBU(input: string): string {
        const cleaned = input.replace(/\D/g, '');

        if (cleaned.length <= 8) return cleaned;
        return `${cleaned.slice(0, 8)} ${cleaned.slice(8, 22)}`;
    },

    /**
     * Limpia y formatea DNI
     */
    formatDNI(input: string): string {
        return input.replace(/\D/g, '').slice(0, 8);
    },

    /**
     * Limpia y formatea teléfono
     */
    formatPhone(input: string): string {
        return input.replace(/\D/g, '').slice(0, 15);
    },

    /**
     * Limpia alias (solo alfanumérico y puntos)
     */
    formatAlias(input: string): string {
        return input.replace(/[^a-zA-Z0-9.]/g, '').slice(0, 20).toLowerCase();
    }
};

/**
 * Restricciones de input
 */
export const inputRestrictions = {
    /**
     * Solo permite números
     */
    onlyNumbers(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    },

    /**
     * Solo permite alfanuméricos y puntos
     */
    alphanumericDot(e: React.KeyboardEvent<HTMLInputElement>) {
        if (!/[a-zA-Z0-9.]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    }
};
