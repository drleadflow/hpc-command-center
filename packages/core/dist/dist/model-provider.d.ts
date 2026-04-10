import type { ToolDefinition, ModelConfig, ModelResponse, ContentBlock } from './types.js';
import type { AgentMessage } from './types.js';
export declare function callModel(config: ModelConfig, systemPrompt: string, messages: AgentMessage[], tools: ToolDefinition[], maxTokens?: number): Promise<ModelResponse>;
export declare function streamModel(config: ModelConfig, systemPrompt: string, messages: AgentMessage[], tools: ToolDefinition[], maxTokens?: number): AsyncGenerator<{
    type: 'text_delta';
    text: string;
} | {
    type: 'content_block_stop';
    block: ContentBlock;
} | {
    type: 'message_done';
    response: ModelResponse;
}>;
export type TaskComplexity = 'light' | 'standard' | 'heavy';
/**
 * Resolve the best model config based on task complexity.
 * - light: memory extraction, skill generation, simple questions → OpenRouter (cheap)
 * - standard: normal chat, tool use → Claude subscription or OpenRouter
 * - heavy: coding pipeline, complex analysis → Claude subscription (best quality)
 *
 * Priority: OpenRouter for light tasks (saves subscription limits),
 * Claude CLI for standard/heavy (best quality, uses subscription).
 * Falls back through: OpenRouter → OpenAI → Claude CLI
 */
export declare function resolveSmartModelConfig(complexity?: TaskComplexity): ModelConfig;
export declare function resolveModelConfig(modelId?: string): ModelConfig;
//# sourceMappingURL=model-provider.d.ts.map