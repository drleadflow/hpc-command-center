export interface WorkflowStep {
    id: string;
    employeeId: string;
    task: string;
    dependsOn?: string[];
    condition?: string;
}
export interface Workflow {
    id: string;
    name: string;
    description: string;
    trigger: 'manual' | 'webhook' | 'cron' | 'employee_handoff';
    steps: WorkflowStep[];
}
export interface StepResult {
    stepId: string;
    status: 'completed' | 'failed' | 'skipped';
    output: string;
    cost: number;
    durationMs: number;
}
export interface WorkflowRun {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'paused';
    stepResults: Record<string, StepResult>;
    startedAt: string;
    completedAt?: string;
    totalCost: number;
}
export declare function defineWorkflow(workflow: Workflow): void;
export declare function listWorkflows(): Workflow[];
export declare function getWorkflowRun(runId: string): WorkflowRun | undefined;
export declare function runWorkflow(workflowId: string, input?: Record<string, unknown>): Promise<WorkflowRun>;
//# sourceMappingURL=engine.d.ts.map