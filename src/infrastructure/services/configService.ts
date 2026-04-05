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

function encrypt(text: string) {
    if (!text) return "";
    const ENCRYPTION_KEY = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
    if (!text) return "";
    const ENCRYPTION_KEY = getEncryptionKey();
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

export interface MercadoPagoConfig {
    activeMode: 'sandbox' | 'production';
    sandbox: {
        publicKey: string;
        accessToken: string;
    };
    production: {
        publicKey: string;
        accessToken: string;
    };
    updatedAt?: Date;
}

export const configService = {
    getMercadoPagoConfig: async (decryptKeys = false): Promise<MercadoPagoConfig | null> => {
        if (!db) throw new Error("Firestore not initialized");
        const docSnap = await getDoc(doc(db, CONFIG_COLLECTION, MP_CONFIG_ID));

        if (!docSnap.exists()) return null;

        const data = docSnap.data();

        // Handle migration from old structure if necessary
        const config: MercadoPagoConfig = {
            activeMode: data.activeMode || data.mode || 'sandbox',
            sandbox: {
                publicKey: decryptKeys ? decrypt(data.sandbox?.publicKey || (data.mode === 'sandbox' ? data.publicKey : '')) : (data.sandbox?.publicKey || (data.mode === 'sandbox' ? data.publicKey : '')),
                accessToken: decryptKeys ? decrypt(data.sandbox?.accessToken || (data.mode === 'sandbox' ? data.accessToken : '')) : (data.sandbox?.accessToken || (data.mode === 'sandbox' ? data.accessToken : ''))
            },
            production: {
                publicKey: decryptKeys ? decrypt(data.production?.publicKey || (data.mode === 'production' ? data.publicKey : '')) : (data.production?.publicKey || (data.mode === 'production' ? data.publicKey : '')),
                accessToken: decryptKeys ? decrypt(data.production?.accessToken || (data.mode === 'production' ? data.accessToken : '')) : (data.production?.accessToken || (data.mode === 'production' ? data.accessToken : ''))
            },
            updatedAt: data.updatedAt?.toDate()
        };

        return config;
    },

    saveMercadoPagoConfig: async (config: MercadoPagoConfig): Promise<void> => {
        if (!db) throw new Error("Firestore not initialized");

        const dataToSave = {
            activeMode: config.activeMode,
            sandbox: {
                publicKey: encrypt(config.sandbox.publicKey),
                accessToken: encrypt(config.sandbox.accessToken)
            },
            production: {
                publicKey: encrypt(config.production.publicKey),
                accessToken: encrypt(config.production.accessToken)
            },
            updatedAt: Timestamp.now()
        };

        await setDoc(doc(db, CONFIG_COLLECTION, MP_CONFIG_ID), dataToSave);
    }
};
