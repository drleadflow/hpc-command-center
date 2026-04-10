export interface RankedMemory {
    id: string;
    content: string;
    type: string;
    tags: string[];
    relevanceScore: number;
}
/**
 * Retrieve memories relevant to a query, re-ranked by a composite score
 * combining FTS5 match rank, confidence, recency, and access frequency.
 */
export declare function retrieveRelevant(query: string, limit?: number): RankedMemory[];
//# sourceMappingURL=retriever.d.ts.map