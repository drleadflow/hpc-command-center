const LEVEL_PRIORITY = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
let currentLevel = 'info';
function shouldLog(level) {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel];
}
function formatMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    return `${timestamp} [${level.toUpperCase()}] [${context}] ${message}`;
}
export const logger = {
    setLevel(level) {
        currentLevel = level;
    },
    debug(context, message, data) {
        if (!shouldLog('debug'))
            return;
        console.debug(formatMessage('debug', context, message), data ?? '');
    },
    info(context, message, data) {
        if (!shouldLog('info'))
            return;
        console.info(formatMessage('info', context, message), data ?? '');
    },
    warn(context, message, data) {
        if (!shouldLog('warn'))
            return;
        console.warn(formatMessage('warn', context, message), data ?? '');
    },
    error(context, message, data) {
        if (!shouldLog('error'))
            return;
        console.error(formatMessage('error', context, message), data ?? '');
    },
};
//# sourceMappingURL=logger.js.map