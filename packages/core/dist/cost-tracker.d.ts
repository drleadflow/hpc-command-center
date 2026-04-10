import type { CostEntry } from './types.js';
export declare function calculateCost(model: string, inputTokens: number, outputTokens: number): CostEntry;
export declare function formatCost(usd: number): string;
export declare function isWithinBudget(spent: number, budget: number): boolean;
//# sourceMappingURL=cost-tracker.d.ts.map