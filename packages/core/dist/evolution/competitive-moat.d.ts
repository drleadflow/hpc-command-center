export interface UsageReport {
    totalConversations: number;
    totalToolCalls: number;
    totalMemories: number;
    totalSkillsLearned: number;
    totalEvolutionEvents: number;
    topSkills: {
        name: string;
        uses: number;
    }[];
    topTools: {
        name: string;
        uses: number;
    }[];
    streakDays: number;
    level: string;
    uniqueInsight: string;
}
/**
 * Generate a comprehensive usage/value report showing how much Blade
 * has learned about the user. This creates switching cost awareness.
 * Never throws.
 */
export declare function generateUsageReport(): UsageReport;
//# sourceMappingURL=competitive-moat.d.ts.map