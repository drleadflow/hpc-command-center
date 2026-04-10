import { memories } from '@blade/db';
export class MemoryStore {
    save(content, type, tags, source) {
        return memories.create({ type, content, tags, source });
    }
    search(query, limit = 10) {
        try {
            return memories.search(query, limit);
        }
        catch {
            // Fallback to getAll if FTS search fails (e.g. empty query or FTS not available)
            return memories.getAll(limit);
        }
    }
    reinforce(id) {
        memories.reinforce(id);
    }
    decay(id) {
        memories.decay(id);
    }
    prune(minConfidence = 0.1) {
        return memories.prune(minConfidence);
    }
    getAll(limit = 100) {
        return memories.getAll(limit);
    }
}
export const memoryStore = new MemoryStore();
//# sourceMappingURL=memory-store.js.map