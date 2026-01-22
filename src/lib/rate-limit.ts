interface Options {
    interval: number; // Interval window in milliseconds
    uniqueTokenPerInterval: number; // Max number of unique tokens per interval
}

interface RateLimit {
    check: (limit: number, token: string) => Promise<void>;
}

export function rateLimit(options: Options): RateLimit {
    const tokenCache = new Map<string, number[]>();
    let lastInterval = Date.now();

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const now = Date.now();

                // Reset cache if interval passed
                if (now - lastInterval > options.interval) {
                    tokenCache.clear();
                    lastInterval = now;
                }

                const tokenCount = tokenCache.get(token) || [0];
                const currentUsage = tokenCount[0];

                if (currentUsage >= limit) {
                    return reject();
                }

                tokenCache.set(token, [currentUsage + 1]);
                return resolve();
            }),
    };
}
