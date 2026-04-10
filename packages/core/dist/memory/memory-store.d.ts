interface MemoryRecord {
    id: string;
    type: string;
    content: string;
    tagsJson: string;
    source: string;
    confidence: number;
    accessCount: number;
    createdAt: string;
}
export declare class MemoryStore {
    save(content: string, type: string, tags: string[], source: string): {
        id: string;
    };
    search(query: string, limit?: number): MemoryRecord[];
    reinforce(id: string): void;
    decay(id: string): void;
    prune(minConfidence?: number): number;
    getAll(limit?: number): MemoryRecord[];
}
export declare const memoryStore: MemoryStore;
export {};
//# sourceMappingURL=memory-store.d.ts.map