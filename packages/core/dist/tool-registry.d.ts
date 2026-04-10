import type { ToolDefinition, ToolHandler, ToolRegistration, ToolCallResult, ExecutionContext } from './types.js';
export declare function registerTool(definition: ToolDefinition, handler: ToolHandler): void;
export declare function getTool(name: string): ToolRegistration | undefined;
export declare function getAllToolDefinitions(): ToolDefinition[];
export declare function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[];
export declare function hasDocker(): ToolDefinition[];
export declare function createToolScope(): string;
export declare function registerScopedTool(scopeId: string, definition: ToolDefinition, handler: ToolHandler): void;
export declare function getScopedToolDefinitions(scopeId: string): ToolDefinition[];
export declare function destroyToolScope(scopeId: string): void;
export declare function executeTool(name: string, toolUseId: string, input: Record<string, unknown>, context: ExecutionContext): Promise<ToolCallResult>;
export declare function clearRegistry(): void;
//# sourceMappingURL=tool-registry.d.ts.map