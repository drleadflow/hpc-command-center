export interface EvolutionEvent {
    type: 'skill_improved' | 'new_skill_created' | 'tool_discovered' | 'prompt_optimized' | 'pattern_learned';
    description: string;
    before?: string;
    after?: string;
    impact?: string;
    timestamp: string;
}
/**
 * Run a full self-evolution cycle. Analyzes failures, optimizes skills,
 * discovers tools, and learns patterns. Never throws.
 */
export declare function runEvolutionCycle(): Promise<EvolutionEvent[]>;
//# sourceMappingURL=self-evolve.d.ts.map