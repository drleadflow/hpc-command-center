interface OptimizationResult {
    original: string;
    optimized: string;
    changes: string[];
}
/**
 * Analyze an employee's recent conversations and suggest an improved system prompt.
 * Returns null if no improvement needed or insufficient data.
 * Never throws.
 */
export declare function optimizeEmployeePrompt(employeeId: string): Promise<OptimizationResult | null>;
export {};
//# sourceMappingURL=prompt-optimizer.d.ts.map