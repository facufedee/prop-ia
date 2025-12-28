export interface RateLimiter {
    check(token: string, limit: number): Promise<void>;
}
