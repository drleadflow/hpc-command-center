import Dockerode from 'dockerode';
export declare function isDockerAvailable(): Promise<boolean>;
export declare function createContainer(name: string, workDir: string, env?: Record<string, string>): Promise<Dockerode.Container>;
export declare function startContainer(container: Dockerode.Container): Promise<void>;
export declare function execInContainer(container: Dockerode.Container, command: string[], timeout?: number): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
}>;
export declare function stopContainer(container: Dockerode.Container): Promise<void>;
export declare function removeContainer(container: Dockerode.Container): Promise<void>;
//# sourceMappingURL=container.d.ts.map