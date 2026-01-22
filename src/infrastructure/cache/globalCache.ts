import { InMemoryCacheService } from "../services/InMemoryCacheService";

// Global singleton instance for the application
// In a distributed environment (Vercel), this cache is per-instance (Lambda).
// For true shared caching, we would swap this with a RedisCacheService.
export const globalCache = new InMemoryCacheService();
