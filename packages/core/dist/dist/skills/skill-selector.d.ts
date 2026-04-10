import type { Skill } from '../types.js';
/**
 * Select the best matching skill for a given task description
 * using simple keyword matching. Returns null if no skill matches
 * well enough (threshold: 2 matching words).
 *
 * Intentionally simple — can be upgraded to LLM-based matching later.
 */
export declare function selectSkill(taskDescription: string, availableSkills: Skill[]): Skill | null;
//# sourceMappingURL=skill-selector.d.ts.map