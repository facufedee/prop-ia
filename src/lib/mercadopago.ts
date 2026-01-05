import { MercadoPagoConfig, Preference } from 'mercadopago';

// Initialize the client
// NOTE: ACCESS_TOKEN must be kept secret and only used server-side.
// Do not import this file in Client Components.

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
    console.warn("MP_ACCESS_TOKEN is missing in environment variables.");
}

export const mpClient = new MercadoPagoConfig({
    accessToken: accessToken || 'TEST-00000000-0000-0000-0000-000000000000' // Fallback to avoid crash, but won't work
});

export const mpPreference = new Preference(mpClient);
