import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
const DEFAULT_CONFIG = {
    defaultModel: 'claude-sonnet-4-20250514',
    codingModel: 'claude-sonnet-4-20250514',
    maxIterations: 25,
    costBudget: 0,
    port: 3000,
    skillsDir: join(homedir(), '.blade', 'skills'),
    databasePath: join(homedir(), '.blade', 'blade.db'),
};
export function loadConfig(configPath) {
    const path = configPath ?? join(homedir(), '.blade', 'config.json');
    if (!existsSync(path)) {
        return { ...DEFAULT_CONFIG };
    }
    const raw = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
}
//# sourceMappingURL=config.js.map