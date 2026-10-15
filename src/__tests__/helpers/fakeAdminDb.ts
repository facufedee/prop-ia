/* eslint-disable @typescript-eslint/no-explicit-any -- loose test double of the firebase-admin API */
/**
 * Minimal in-memory stand-in for the firebase-admin Firestore API used by server
 * routes (collection/doc/add/set/update/delete/where('=='|'in')/orderBy/limit/get).
 * Documents are keyed by full path, e.g. "payments/p1" or "chat_sessions/s/messages/m".
 */
type Data = Record<string, any>;

export function createFakeAdminDb() {
    const docs = new Map<string, Data>();
    let autoId = 0;

    const sortValue = (v: any) =>
        v && typeof v.toMillis === "function" ? v.toMillis() : v instanceof Date ? v.getTime() : v;

    const snapshotOf = (path: string) => {
        const data = docs.get(path);
        const id = path.split("/").pop()!;
        return { id, exists: data !== undefined, data: () => (data ? { ...data } : undefined), ref: docRef(path) };
    };

    function docRef(path: string): any {
        return {
            id: path.split("/").pop(),
            path,
            get: async () => snapshotOf(path),
            set: async (data: Data, opts?: { merge?: boolean }) => {
                docs.set(path, opts?.merge ? { ...(docs.get(path) ?? {}), ...data } : { ...data });
            },
            update: async (data: Data) => {
                if (!docs.has(path)) throw Object.assign(new Error("NOT_FOUND"), { code: 5 });
                docs.set(path, { ...docs.get(path)!, ...data });
            },
            delete: async () => {
                docs.delete(path);
            },
            collection: (name: string) => collectionRef(`${path}/${name}`),
        };
    }

    function queryRef(
        path: string,
        filters: Array<[string, string, any]> = [],
        order: Array<[string, string]> = [],
        max?: number,
    ): any {
        return {
            where: (f: string, op: string, v: any) => {
                if (v === undefined) throw new Error(`Cannot use "undefined" as a Firestore value (field "${f}")`);
                return queryRef(path, [...filters, [f, op, v]], order, max);
            },
            orderBy: (f: string, dir = "asc") => queryRef(path, filters, [...order, [f, dir]], max),
            limit: (n: number) => queryRef(path, filters, order, n),
            get: async () => {
                const depth = path.split("/").length + 1;
                let matches = [...docs.keys()].filter(
                    (k) => k.startsWith(`${path}/`) && k.split("/").length === depth,
                );
                matches = matches.filter((k) => {
                    const d = docs.get(k)!;
                    return filters.every(([f, op, v]) => (op === "in" ? v.includes(d[f]) : d[f] === v));
                });
                for (const [f, dir] of [...order].reverse()) {
                    matches.sort((a, b) => {
                        const x = sortValue(docs.get(a)![f]);
                        const y = sortValue(docs.get(b)![f]);
                        const c = x < y ? -1 : x > y ? 1 : 0;
                        return dir === "desc" ? -c : c;
                    });
                }
                if (max !== undefined) matches = matches.slice(0, max);
                const list = matches.map(snapshotOf);
                return { empty: list.length === 0, size: list.length, docs: list };
            },
        };
    }

    function collectionRef(path: string): any {
        return {
            ...queryRef(path),
            doc: (id?: string) => docRef(`${path}/${id ?? `auto${++autoId}`}`),
            add: async (data: Data) => {
                const ref = docRef(`${path}/auto${++autoId}`);
                await ref.set(data);
                return ref;
            },
        };
    }

    return {
        docs,
        adminDb: { collection: (name: string) => collectionRef(name) },
        /** All documents directly under a collection path, as [id, data] pairs. */
        list: (path: string) =>
            [...docs.entries()]
                .filter(([k]) => k.startsWith(`${path}/`) && k.split("/").length === path.split("/").length + 1)
                .map(([k, v]) => [k.split("/").pop()!, v] as const),
    };
}

export const fakeTimestamp = {
    now: () => ({ __ts: "now", toMillis: () => Date.now(), toDate: () => new Date() }),
    fromDate: (d: Date) => ({ __ts: d.toISOString(), toMillis: () => d.getTime(), toDate: () => d }),
};
