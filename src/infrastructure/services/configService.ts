import { db } from "@/infrastructure/firebase/client";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import crypto from "crypto";

const CONFIG_COLLECTION = "configurations";
const MP_CONFIG_ID = "mercadopago";
const IV_LENGTH = 16;

function getEncryptionKey(): string {
    const key = process.env.DB_ENCRYPTION_KEY;
    if (!key || key.length < 32) {
        throw new Error("DB_ENCRYPTION_KEY env var must be set and at least 32 characters long");
    }
    return key;
}

export function encryptConfigValue(text: string): string {
    if (!text) return "";
    const ENCRYPTION_KEY = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptConfigValue(text: string): string {
    if (!text) return "";
    const ENCRYPTION_KEY = getEncryptionKey();
    const parts = text.split(":");
    const iv = Buffer.from(parts.shift()!, "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    return Buffer.concat([decipher.update(encryptedText), decipher.final()]).toString();
}

export interface MercadoPagoConfig {
    activeMode: "sandbox" | "production";
    sandbox: { publicKey: string; accessToken: string };
    production: { publicKey: string; accessToken: string };
    updatedAt?: Date;
}

export const configService = {
    getMercadoPagoConfig: async (decryptKeys = false): Promise<MercadoPagoConfig | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docSnap = await getDoc(doc(db, CONFIG_COLLECTION, MP_CONFIG_ID));
        if (!docSnap.exists()) return null;

        const data = docSnap.data();
        const resolve = (val: string) => (decryptKeys ? decryptConfigValue(val) : val);

        return {
            activeMode: data.activeMode ?? data.mode ?? "sandbox",
            sandbox: {
                publicKey:   resolve(data.sandbox?.publicKey   ?? (data.mode === "sandbox"    ? data.publicKey    : "")),
                accessToken: resolve(data.sandbox?.accessToken ?? (data.mode === "sandbox"    ? data.accessToken  : "")),
            },
            production: {
                publicKey:   resolve(data.production?.publicKey   ?? (data.mode === "production" ? data.publicKey    : "")),
                accessToken: resolve(data.production?.accessToken ?? (data.mode === "production" ? data.accessToken  : "")),
            },
            updatedAt: data.updatedAt?.toDate(),
        };
    },

    saveMercadoPagoConfig: async (config: MercadoPagoConfig): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");
        await setDoc(doc(db, CONFIG_COLLECTION, MP_CONFIG_ID), {
            activeMode: config.activeMode,
            sandbox: {
                publicKey:   encryptConfigValue(config.sandbox.publicKey),
                accessToken: encryptConfigValue(config.sandbox.accessToken),
            },
            production: {
                publicKey:   encryptConfigValue(config.production.publicKey),
                accessToken: encryptConfigValue(config.production.accessToken),
            },
            updatedAt: Timestamp.now(),
        });
    },
};
