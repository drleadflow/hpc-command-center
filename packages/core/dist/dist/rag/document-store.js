import { getDb } from '@blade/db';
import crypto from 'node:crypto';
const CHUNK_SIZE = 500; // words
const CHUNK_OVERLAP = 50; // words
function splitIntoChunks(content) {
    const words = content.split(/\s+/).filter(Boolean);
    const chunks = [];
    if (words.length <= CHUNK_SIZE) {
        chunks.push(words.join(' '));
        return chunks;
    }
    let start = 0;
    while (start < words.length) {
        const end = Math.min(start + CHUNK_SIZE, words.length);
        chunks.push(words.slice(start, end).join(' '));
        if (end >= words.length)
            break;
        start = end - CHUNK_OVERLAP;
    }
    return chunks;
}
/**
 * Ingest a document by splitting it into chunks and storing in SQLite with FTS5 indexing.
 */
export function ingestDocument(title, content, source) {
    const db = getDb();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const textChunks = splitIntoChunks(content);
    const chunks = [];
    const insertDoc = db.prepare('INSERT INTO documents (id, title, content, source, created_at) VALUES (?, ?, ?, ?, ?)');
    const insertChunk = db.prepare('INSERT INTO document_chunks (id, document_id, content, chunk_index) VALUES (?, ?, ?, ?)');
    const insertFts = db.prepare('INSERT INTO document_chunks_fts (rowid, content) VALUES (?, ?)');
    const transaction = db.transaction(() => {
        insertDoc.run(id, title, content, source, createdAt);
        for (let i = 0; i < textChunks.length; i++) {
            const chunkId = crypto.randomUUID();
            insertChunk.run(chunkId, id, textChunks[i], i);
            // Get the rowid of the inserted chunk for FTS
            const row = db.prepare('SELECT rowid FROM document_chunks WHERE id = ?').get(chunkId);
            insertFts.run(row.rowid, textChunks[i]);
            chunks.push({
                id: chunkId,
                documentId: id,
                content: textChunks[i],
                index: i,
            });
        }
    });
    transaction();
    return { id, title, content, chunks, source, createdAt };
}
/**
 * Search across all document chunks using FTS5 full-text search.
 */
export function searchDocuments(query, limit = 10) {
    const db = getDb();
    const rows = db.prepare(`
    SELECT dc.id, dc.document_id as documentId, dc.content, dc.chunk_index as "index"
    FROM document_chunks_fts fts
    JOIN document_chunks dc ON dc.rowid = fts.rowid
    WHERE document_chunks_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit);
    return rows;
}
/**
 * List all ingested documents (without full content/chunks for performance).
 */
export function listDocuments() {
    const db = getDb();
    const docs = db.prepare(`
    SELECT id, title, content, source, created_at as createdAt
    FROM documents
    ORDER BY created_at DESC
  `).all();
    return docs.map(doc => ({ ...doc, chunks: [] }));
}
/**
 * Delete a document and all its chunks (cascade via FK or manual).
 */
export function deleteDocument(id) {
    const db = getDb();
    const transaction = db.transaction(() => {
        // Delete FTS entries for chunks of this document
        db.prepare(`
      DELETE FROM document_chunks_fts
      WHERE rowid IN (SELECT rowid FROM document_chunks WHERE document_id = ?)
    `).run(id);
        db.prepare('DELETE FROM document_chunks WHERE document_id = ?').run(id);
        db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    });
    transaction();
}
//# sourceMappingURL=document-store.js.map