export interface BladeConfig {
    /** Default AI model for chat */
    defaultModel: string;
    /** Default AI model for coding jobs */
    codingModel: string;
    /** Max iterations for agent loop */
    maxIterations: number;
    /** Cost budget per task (USD), 0 = unlimited */
    costBudget: number;
    /** Web UI port */
    port: number;
    /** Path to skills directory */
    skillsDir: string;
    /** Path to SQLite database */
    databasePath: string;
}
export declare function loadConfig(configPath?: string): BladeConfig;
//# sourceMappingURL=config.d.ts.map