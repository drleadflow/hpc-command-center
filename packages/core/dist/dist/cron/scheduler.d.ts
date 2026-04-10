export interface CronJob {
    id: string;
    name: string;
    schedule: string;
    task: string;
    repoUrl?: string;
    model?: string;
    enabled: boolean;
}
export declare function startScheduler(jobs: readonly CronJob[]): void;
export declare function stopScheduler(): void;
export declare function loadCronsFromFile(path: string): CronJob[];
//# sourceMappingURL=scheduler.d.ts.map