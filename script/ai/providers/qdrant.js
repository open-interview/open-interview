/**
 * Qdrant provider — now backed by local SQLite (qdrant-local.js).
 * QDRANT_URL is no longer required; all vector storage is local.
 */

import localQdrant from './qdrant-local.js';

// Collection names (kept for compatibility with importers)
const COLLECTIONS = {
  QUESTIONS: 'questions',
  QUESTION_CHUNKS: 'question_chunks'
};

// Vector dimensions (kept for compatibility)
const VECTOR_DIMENSIONS = {
  'all-MiniLM-L6-v2': 384,
  'nomic-embed-text': 768,
  'mxbai-embed-large': 1024,
  'default': 384
};

export default localQdrant;
export { COLLECTIONS, VECTOR_DIMENSIONS };
