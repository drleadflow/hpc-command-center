interface PullRequestResult {
    prUrl: string;
    prNumber: number;
}
export declare function createPullRequest(params: {
    owner: string;
    repo: string;
    title: string;
    body: string;
    head: string;
    base: string;
    githubToken: string;
}): Promise<PullRequestResult>;
export declare function commentOnPR(params: {
    owner: string;
    repo: string;
    prNumber: number;
    body: string;
    githubToken: string;
}): Promise<void>;
/**
 * Parse a GitHub repo URL into owner and repo name.
 * Supports: https://github.com/owner/repo, git@github.com:owner/repo.git
 */
export declare function parseRepoUrl(url: string): {
    owner: string;
    repo: string;
};
export {};
//# sourceMappingURL=pr-creator.d.ts.map