export declare function runCodingPipeline(params: {
    jobId: string;
    title: string;
    description: string;
    repoUrl: string;
    baseBranch: string;
    agentModel: string;
    githubToken: string;
    onStatus?: (status: string, message: string) => void;
}): Promise<{
    prUrl: string;
    prNumber: number;
    totalCost: number;
}>;
//# sourceMappingURL=coding-pipeline.d.ts.map