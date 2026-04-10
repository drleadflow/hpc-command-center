const SENSITIVE_PATTERNS = [
    /_KEY$/i,
    /_SECRET$/i,
    /_TOKEN$/i,
    /_PASSWORD$/i,
    /^API_KEY$/i,
    /^SECRET$/i,
    /^TOKEN$/i,
    /^PASSWORD$/i,
];
function isSensitiveKey(key) {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key));
}
export function getSanitizedEnv() {
    const sanitized = {};
    for (const [key, value] of Object.entries(process.env)) {
        if (value === undefined) {
            continue;
        }
        sanitized[key] = isSensitiveKey(key) ? '[FILTERED]' : value;
    }
    return sanitized;
}
//# sourceMappingURL=env-filter.js.map