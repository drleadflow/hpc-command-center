import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
function parseSkillYaml(filePath) {
    try {
        const raw = readFileSync(filePath, 'utf-8');
        const parsed = yaml.load(raw);
        if (!parsed.name || !parsed.description || !parsed.system_prompt) {
            return undefined;
        }
        const now = new Date().toISOString();
        return {
            id: parsed.name,
            name: parsed.name,
            description: parsed.description,
            version: parsed.version ?? 1,
            systemPrompt: parsed.system_prompt,
            tools: parsed.tools ?? [],
            examples: [],
            successRate: 0,
            totalUses: 0,
            source: 'builtin',
            createdAt: now,
            updatedAt: now,
        };
    }
    catch {
        return undefined;
    }
}
/**
 * Parse a skill YAML returning only name + description (systemPrompt set to empty string).
 * This saves context window by not loading all skill prompts upfront.
 */
function parseSkillYamlLite(filePath) {
    try {
        const raw = readFileSync(filePath, 'utf-8');
        const parsed = yaml.load(raw);
        if (!parsed.name || !parsed.description || !parsed.system_prompt) {
            return undefined;
        }
        const now = new Date().toISOString();
        return {
            id: parsed.name,
            name: parsed.name,
            description: parsed.description,
            version: parsed.version ?? 1,
            systemPrompt: '',
            tools: parsed.tools ?? [],
            examples: [],
            successRate: 0,
            totalUses: 0,
            source: 'builtin',
            createdAt: now,
            updatedAt: now,
        };
    }
    catch {
        return undefined;
    }
}
function findSkillYamlPaths(dir) {
    const paths = [];
    let entries;
    try {
        entries = readdirSync(dir);
    }
    catch {
        return paths;
    }
    for (const entry of entries) {
        const entryPath = join(dir, entry);
        try {
            const stat = statSync(entryPath);
            if (stat.isDirectory()) {
                const yamlPath = join(entryPath, 'skill.yaml');
                try {
                    statSync(yamlPath);
                    paths.push(yamlPath);
                }
                catch {
                    // No skill.yaml in this directory, skip
                }
            }
            else if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
                paths.push(entryPath);
            }
        }
        catch {
            // Skip entries we can't stat
        }
    }
    return paths;
}
/**
 * Load skills from a directory with ONLY name + description (systemPrompt set to empty string).
 * Use loadFullSkill() or getSkillPrompt() to load the full system prompt on-demand.
 */
export function loadSkillsFromDir(dir) {
    const skills = [];
    const paths = findSkillYamlPaths(dir);
    for (const yamlPath of paths) {
        const skill = parseSkillYamlLite(yamlPath);
        if (skill) {
            skills.push(skill);
        }
    }
    return skills;
}
/**
 * Load a full skill (including system prompt) from a YAML file path.
 */
export function loadFullSkill(skillPath) {
    return parseSkillYaml(skillPath);
}
/**
 * Load the full system prompt for a skill by name from the given skills directory.
 * Returns null if the skill is not found.
 */
export function getSkillPrompt(name, skillsDir) {
    const paths = findSkillYamlPaths(skillsDir);
    for (const yamlPath of paths) {
        const skill = parseSkillYaml(yamlPath);
        if (skill && skill.name === name) {
            return skill.systemPrompt;
        }
    }
    return null;
}
export function getSkillByName(name, skills) {
    return skills.find((s) => s.name === name);
}
//# sourceMappingURL=skill-loader.js.map