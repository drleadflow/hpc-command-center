export interface Document {
    id: string;
    title: string;
    content: string;
    chunks: DocumentChunk[];
    source: string;
    createdAt: string;
}
export interface DocumentChunk {
    id: string;
    documentId: string;
    content: string;
    index: number;
}
/**
 * Ingest a document by splitting it into chunks and storing in SQLite with FTS5 indexing.
 */
export declare function ingestDocument(title: string, content: string, source: string): Document;
/**
 * Search across all document chunks using FTS5 full-text search.
 */
export declare function searchDocuments(query: string, limit?: number): DocumentChunk[];
/**
 * List all ingested documents (without full content/chunks for performance).
 */
export declare function listDocuments(): Document[];
/**
 * Delete a document and all its chunks (cascade via FK or manual).
 */
export declare function deleteDocument(id: string): void;
//# sourceMappingURL=document-store.d.ts.map