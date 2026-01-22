import { RateLimiter } from "@/domain/security/RateLimiter";

interface Options {
    interval: number; // Interval window in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

export class InMemoryRateLimiter implements RateLimiter {
    private tokenCache = new Map<string, number[]>();
    private lastInterval = Date.now();
    private options: Options;

    constructor(options: Options) {
        this.options = options;
    }

    check(token: string, limit: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const now = Date.now();

            // Reset cache if interval passed
            if (now - this.lastInterval > this.options.interval) {
                this.tokenCache.clear();
                this.lastInterval = now;
            }

            const tokenCount = this.tokenCache.get(token) || [0];
            const currentUsage = tokenCount[0];

            if (currentUsage >= limit) {
                return reject();
            }

            this.tokenCache.set(token, [currentUsage + 1]);
            return resolve();
        });
    }
}
