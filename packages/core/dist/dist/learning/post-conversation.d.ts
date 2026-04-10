import type { AgentMessage, ToolCallResult } from '../types.js';
/**
 * Extract learnings from a completed conversation and save them as memories.
 * Fire-and-forget: never throws, logs errors internally.
 */
export declare function extractLearnings(conversationId: string, messages: AgentMessage[], toolCalls: ToolCallResult[]): Promise<void>;
//# sourceMappingURL=post-conversation.d.ts.map