import Dockerode from 'dockerode';
import { logger } from '@blade/shared';
const docker = new Dockerode();
const SANDBOX_IMAGE = 'blade-sandbox:latest';
const DEFAULT_TIMEOUT = 120_000;
export async function isDockerAvailable() {
    try {
        await docker.ping();
        return true;
    }
    catch {
        return false;
    }
}
export async function createContainer(name, workDir, env = {}) {
    logger.info('Docker', `Creating container: ${name}`);
    const envArray = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    const container = await docker.createContainer({
        Image: SANDBOX_IMAGE,
        name,
        Cmd: ['sleep', 'infinity'],
        WorkingDir: '/workspace',
        Env: envArray,
        HostConfig: {
            Binds: [`${workDir}:/workspace`],
            Memory: 2 * 1024 * 1024 * 1024, // 2GB
            NanoCpus: 2_000_000_000, // 2 CPUs
            NetworkMode: 'bridge',
            // Security hardening
            ReadonlyRootfs: false,
            CapDrop: ['ALL'],
            CapAdd: ['CHOWN', 'DAC_OVERRIDE', 'FOWNER', 'SETGID', 'SETUID'],
            SecurityOpt: ['no-new-privileges'],
            Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=256m' },
        },
    });
    return container;
}
export async function startContainer(container) {
    await container.start();
    logger.info('Docker', `Container started: ${(await container.inspect()).Name}`);
}
export async function execInContainer(container, command, timeout = DEFAULT_TIMEOUT) {
    const exec = await container.exec({
        Cmd: command,
        AttachStdout: true,
        AttachStderr: true,
        WorkingDir: '/workspace',
    });
    const stream = await exec.start({ hijack: true, stdin: false });
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Command timed out after ${timeout}ms: ${command.join(' ')}`));
        }, timeout);
        let stdout = '';
        let stderr = '';
        // Dockerode multiplexes stdout/stderr
        docker.modem.demuxStream(stream, {
            write: (chunk) => { stdout += chunk.toString(); },
        }, {
            write: (chunk) => { stderr += chunk.toString(); },
        });
        stream.on('end', async () => {
            clearTimeout(timer);
            const info = await exec.inspect();
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: info.ExitCode ?? 1,
            });
        });
        stream.on('error', (err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
export async function stopContainer(container) {
    try {
        await container.stop({ t: 5 });
        logger.info('Docker', 'Container stopped');
    }
    catch (err) {
        // Already stopped
        logger.debug('Docker', `Stop: ${err instanceof Error ? err.message : String(err)}`);
    }
}
export async function removeContainer(container) {
    try {
        await container.remove({ force: true });
        logger.info('Docker', 'Container removed');
    }
    catch (err) {
        logger.debug('Docker', `Remove: ${err instanceof Error ? err.message : String(err)}`);
    }
}
//# sourceMappingURL=container.js.map