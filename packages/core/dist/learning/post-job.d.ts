import type { AgentLoopResult } from '../types.js';
/**
 * Extract learnings from a completed coding job and save as memories.
 * Fire-and-forget: never throws.
 */
export declare function extractJobLearnings(jobId: string, title: string, description: string, result: AgentLoopResult): Promise<void>;
//# sourceMappingURL=post-job.d.ts.map