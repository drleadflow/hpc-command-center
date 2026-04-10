import type { Skill } from '../types.js';
/**
 * Load skills from a directory with ONLY name + description (systemPrompt set to empty string).
 * Use loadFullSkill() or getSkillPrompt() to load the full system prompt on-demand.
 */
export declare function loadSkillsFromDir(dir: string): Skill[];
/**
 * Load a full skill (including system prompt) from a YAML file path.
 */
export declare function loadFullSkill(skillPath: string): Skill | undefined;
/**
 * Load the full system prompt for a skill by name from the given skills directory.
 * Returns null if the skill is not found.
 */
export declare function getSkillPrompt(name: string, skillsDir: string): string | null;
export declare function getSkillByName(name: string, skills: Skill[]): Skill | undefined;
//# sourceMappingURL=skill-loader.d.ts.map