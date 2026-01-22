import { CacheService } from "@/domain/services/CacheService";

interface CacheItem<T> {
    value: T;
    expiry: number;
}

export class InMemoryCacheService implements CacheService {
    private cache = new Map<string, CacheItem<any>>();

    async get<T>(key: string): Promise<T | null> {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    async set<T>(key: string, value: T, ttlSeconds: number = 60): Promise<void> {
        const expiry = Date.now() + ttlSeconds * 1000;
        this.cache.set(key, { value, expiry });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }
}
