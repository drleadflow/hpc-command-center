import type { Skill } from '../types.js';
/**
 * Generate a reusable skill definition from a completed job.
 * Returns the new Skill if one was created, or null if an existing skill already covers it.
 * Never throws.
 */
export declare function generateSkillFromJob(jobTitle: string, jobDescription: string, toolsUsed: string[], wasSuccessful: boolean, existingSkills: Skill[]): Promise<Skill | null>;
//# sourceMappingURL=skill-generator.d.ts.map