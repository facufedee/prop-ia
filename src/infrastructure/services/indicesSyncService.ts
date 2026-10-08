import { adminDb } from "@/infrastructure/firebase/admin";
import { iclFromDetalle, ipcFromLevels, IndicesData } from "@/lib/financial/indices";

// IPC nivel general nacional (INDEC), served by datos.gob.ar
const INDEC_IPC_URL = "https://apis.datos.gob.ar/series/api/series/?ids=148.3_INIVELNAL_DICI_M_26&limit=1000&format=json";
// Variable 40 = Índice para Contratos de Locación (base 30.6.20 = 1)
const BCRA_ICL_URL = "https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/40";
const ICL_BASE_DATE = "2020-06-30";

const STALE_MS = 12 * 60 * 60 * 1000;
const MIN_FORCED_INTERVAL_MS = 10 * 60 * 1000;
const FETCH_TIMEOUT_MS = 20_000;

const docRef = () => adminDb.collection("configuration").doc("indices");

interface StoredIndices {
    ipc?: Record<string, Record<string, number>>;
    icl?: Record<string, number>;
    syncedAt?: string;
}

async function fetchJson(url: string): Promise<any> {
    const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), cache: "no-store" });
    if (!res.ok) throw new Error(`${new URL(url).hostname} respondió ${res.status}`);
    return res.json();
}

async function fetchIpc() {
    const json = await fetchJson(INDEC_IPC_URL);
    const years = ipcFromLevels(json.data);
    if (Object.keys(years).length === 0) throw new Error("INDEC no devolvió datos de IPC");
    return years;
}

async function fetchIcl(sinceISO: string) {
    const icl: Record<string, number> = {};
    const limit = 1000;
    for (let offset = 0; ; offset += limit) {
        const json = await fetchJson(`${BCRA_ICL_URL}?desde=${sinceISO}&limit=${limit}&offset=${offset}`);
        const detalle = json?.results?.[0]?.detalle ?? [];
        Object.assign(icl, iclFromDetalle(detalle));
        if (detalle.length < limit) break;
    }
    if (Object.keys(icl).length === 0) throw new Error("BCRA no devolvió datos de ICL");
    return icl;
}

function addDays(iso: string, days: number): string {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function toIndicesData(stored: StoredIndices | undefined): IndicesData {
    return {
        years: (stored?.ipc ?? {}) as IndicesData["years"],
        icl: stored?.icl ?? {},
        syncedAt: stored?.syncedAt,
    };
}

let inFlight: Promise<IndicesData> | null = null;

/**
 * Pulls IPC (INDEC) and ICL (BCRA) from their official APIs and stores them in
 * Firestore (configuration/indices). If one source fails the other is still
 * saved, so a BCRA outage never blocks IPC contracts and vice versa.
 */
export function syncIndices({ force = false }: { force?: boolean } = {}): Promise<IndicesData> {
    if (inFlight) return inFlight;

    inFlight = (async () => {
        const snap = await docRef().get();
        const stored = snap.data() as StoredIndices | undefined;

        const age = stored?.syncedAt ? Date.now() - new Date(stored.syncedAt).getTime() : Infinity;
        if (age < (force ? MIN_FORCED_INTERVAL_MS : STALE_MS)) return toIndicesData(stored);

        const storedDates = Object.keys(stored?.icl ?? {}).sort();
        const lastIcl = storedDates[storedDates.length - 1];
        const iclSince = lastIcl ? addDays(lastIcl, -7) : ICL_BASE_DATE;

        const [ipc, icl] = await Promise.allSettled([fetchIpc(), fetchIcl(iclSince)]);

        const update: StoredIndices = {};
        if (ipc.status === "fulfilled") update.ipc = ipc.value as unknown as StoredIndices["ipc"];
        else console.error("[indices] IPC sync failed:", ipc.reason?.message ?? ipc.reason);
        if (icl.status === "fulfilled") update.icl = icl.value;
        else console.error("[indices] ICL sync failed:", icl.reason?.message ?? icl.reason);

        if (Object.keys(update).length === 0) {
            throw new Error("No se pudo actualizar ningún índice (INDEC y BCRA fallaron)");
        }

        update.syncedAt = new Date().toISOString();
        await docRef().set(update, { merge: true });

        const merged = { ...stored, ...update, icl: { ...(stored?.icl ?? {}), ...(update.icl ?? {}) } };
        return toIndicesData(merged);
    })().finally(() => {
        inFlight = null;
    });

    return inFlight;
}

/**
 * Returns the stored indices, refreshing them first when they are older than
 * 12 hours. If the refresh fails it falls back to whatever is stored.
 */
export async function getIndices(): Promise<IndicesData & { stale?: boolean }> {
    try {
        return await syncIndices();
    } catch (err: any) {
        console.error("[indices] sync failed, serving stored data:", err?.message ?? err);
        const snap = await docRef().get();
        return { ...toIndicesData(snap.data() as StoredIndices | undefined), stale: true };
    }
}
