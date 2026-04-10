import crypto from 'node:crypto';
// Global singleton registry (survives module reloads)
const REGISTRY_KEY = '__blade_tool_registry__';
const _registry = globalThis[REGISTRY_KEY]
    ?? (globalThis[REGISTRY_KEY] = new Map());
// Scoped tool maps — isolated per job/session
const _scopes = new Map();
export function registerTool(definition, handler) {
    _registry.set(definition.name, { definition, handler });
}
export function getTool(name) {
    return _registry.get(name);
}
export function getAllToolDefinitions() {
    return [..._registry.values()].map(r => r.definition);
}
export function getToolsByCategory(category) {
    return [..._registry.values()]
        .filter(r => r.definition.category === category)
        .map(r => r.definition);
}
export function hasDocker() {
    return [..._registry.values()]
        .filter(r => r.definition.requiresDocker)
        .map(r => r.definition);
}
export function createToolScope() {
    const id = crypto.randomUUID();
    _scopes.set(id, new Map());
    return id;
}
export function registerScopedTool(scopeId, definition, handler) {
    const scope = _scopes.get(scopeId);
    if (!scope)
        throw new Error(`Tool scope ${scopeId} not found`);
    scope.set(definition.name, { definition, handler });
}
export function getScopedToolDefinitions(scopeId) {
    const scope = _scopes.get(scopeId);
    if (!scope)
        return [];
    return [...scope.values()].map(r => r.definition);
}
export function destroyToolScope(scopeId) {
    _scopes.delete(scopeId);
}
export async function executeTool(name, toolUseId, input, context) {
    // Check scoped tools first
    if (context.toolScopeId) {
        const scope = _scopes.get(context.toolScopeId);
        if (scope?.has(name)) {
            const registration = scope.get(name);
            const start = performance.now();
            try {
                const result = await registration.handler(input, context);
                return {
                    ...result,
                    toolUseId,
                    durationMs: Math.round(performance.now() - start),
                };
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                return {
                    toolUseId,
                    toolName: name,
                    input,
                    success: false,
                    data: null,
                    display: `Tool "${name}" error: ${message}`,
                    durationMs: Math.round(performance.now() - start),
                    timestamp: new Date().toISOString(),
                };
            }
        }
    }
    // Fall back to global registry
    const registration = _registry.get(name);
    if (!registration) {
        return {
            toolUseId,
            toolName: name,
            input,
            success: false,
            data: null,
            display: `Tool "${name}" not found`,
            durationMs: 0,
            timestamp: new Date().toISOString(),
        };
    }
    const start = performance.now();
    try {
        const result = await registration.handler(input, context);
        return {
            ...result,
            toolUseId,
            durationMs: Math.round(performance.now() - start),
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
            toolUseId,
            toolName: name,
            input,
            success: false,
            data: null,
            display: `Tool "${name}" error: ${message}`,
            durationMs: Math.round(performance.now() - start),
            timestamp: new Date().toISOString(),
        };
    }
}
export function clearRegistry() {
    _registry.clear();
}
//# sourceMappingURL=tool-registry.js.map