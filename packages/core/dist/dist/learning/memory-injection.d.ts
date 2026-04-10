/**
 * Augment a base system prompt with relevant memories from the memory store.
 * Searches memories using the user's message as query and appends a
 * "## Your Memory" section if relevant memories are found.
 *
 * This is synchronous-safe since memoryStore.search uses synchronous SQLite.
 */
export declare function buildMemoryAugmentedPrompt(basePrompt: string, userMessage: string): string;
//# sourceMappingURL=memory-injection.d.ts.map