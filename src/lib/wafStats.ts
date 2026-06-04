/**
 * WAF istatistiklerini tutan singleton store.
 * Hem middleware.ts hem de API route tarafından import edilir.
 */

export interface WafStats {
    totalRequests: number;
    blockedRequests: number;
    ddosBlocks: number;
    sqlBlocks: number;
    xssBlocks: number;
    pathTraversalBlocks: number;
    botBlocks: number;
    rateLimitBlocks: number;
    lastReset: number;
}

// Global singleton (Next.js server process başına)
const stats: WafStats = {
    totalRequests: 0,
    blockedRequests: 0,
    ddosBlocks: 0,
    sqlBlocks: 0,
    xssBlocks: 0,
    pathTraversalBlocks: 0,
    botBlocks: 0,
    rateLimitBlocks: 0,
    lastReset: Date.now(),
};

export function incrementWafStat(key: keyof Omit<WafStats, 'lastReset'>): void {
    (stats[key] as number)++;
}

export function getWafStats(): WafStats {
    return { ...stats };
}

export function resetWafStats(): void {
    stats.totalRequests = 0;
    stats.blockedRequests = 0;
    stats.ddosBlocks = 0;
    stats.sqlBlocks = 0;
    stats.xssBlocks = 0;
    stats.pathTraversalBlocks = 0;
    stats.botBlocks = 0;
    stats.rateLimitBlocks = 0;
    stats.lastReset = Date.now();
}
