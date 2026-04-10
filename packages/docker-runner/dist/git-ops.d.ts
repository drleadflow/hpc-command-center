export declare function cloneRepo(repoUrl: string, shallow?: boolean): string;
export declare function createBranch(repoDir: string, branchName: string): void;
/**
 * Stage all changes and commit incrementally with the given message.
 * Returns true if a commit was made, false if there was nothing to commit.
 * Uses execFileSync (safe, no shell injection).
 */
export declare function commitIncremental(repoDir: string, message: string): boolean;
export declare function commitAndPush(repoDir: string, message: string, branch: string, githubToken?: string): void;
//# sourceMappingURL=git-ops.d.ts.map