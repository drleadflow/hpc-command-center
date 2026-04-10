export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export declare const logger: {
    setLevel(level: LogLevel): void;
    debug(context: string, message: string, data?: unknown): void;
    info(context: string, message: string, data?: unknown): void;
    warn(context: string, message: string, data?: unknown): void;
    error(context: string, message: string, data?: unknown): void;
};
//# sourceMappingURL=logger.d.ts.map