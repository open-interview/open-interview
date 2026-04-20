/**
 * Local SQLite-backed Vector Store — drop-in replacement for Qdrant
 * Always used — QDRANT_URL is no longer required.
 *
 * Implements the same interface as qdrant.js:
 *   init, ensureCollection, upsert, search, findDuplicates,
 *   batchSearch, delete, deleteByFilter, getCollectionInfo,
 *   scroll, createPayloadIndex, getPoint, exists
 *
 * Vectors are stored as JSON blobs; similarity is cosine distance
 * computed in JS (fast enough for local dev / CI with <100k rows).
 */

import Database from 'better-sqlite3';
import crypto from 'crypto';

// RAG always uses local SQLite
const DB_PATH = 'local.db';

class LocalQdrantProvider {
  constructor() {
    this.db = null;
    this.initialized = false;
    this._ensuredCollections = new Set();
  }

  _getDb() {
    if (!this.db) {
      this.db = new Database(DB_PATH);
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('busy_timeout = 5000');
    }
    return this.db;
  }

  async init() {
    if (this.initialized) return;
    // Base table for all collections — one table per collection created lazily
    this.initialized = true;
    console.log('✅ Local SQLite vector store initialized');
  }

  _tableName(collectionName) {
    return `vec_${collectionName.replace(/[^a-z0-9_]/gi, '_')}`;
  }

  async ensureCollection(collectionName) {
    if (this._ensuredCollections.has(collectionName)) return true;
    await this.init();
    const t = this._tableName(collectionName);
    const db = this._getDb();
    db.exec(`
      CREATE TABLE IF NOT EXISTS ${t} (
        id TEXT PRIMARY KEY,
        original_id TEXT NOT NULL,
        vector TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${t}_oid ON ${t}(original_id)`);
    this._ensuredCollections.add(collectionName);
    console.log(`✅ Local collection ready: ${collectionName}`);
    return true;
  }

  stringToUUID(str) {
    const hash = crypto.createHash('md5').update(str).digest('hex');
    return `${hash.slice(0,8)}-${hash.slice(8,12)}-4${hash.slice(13,16)}-${hash.slice(16,20)}-${hash.slice(20,32)}`;
  }

  async upsert(collectionName, points) {
    await this.ensureCollection(collectionName);
    const t = this._tableName(collectionName);

    const valid = points.filter(p =>
      Array.isArray(p.vector) && p.vector.length > 0 &&
      p.vector.every(v => typeof v === 'number' && isFinite(v))
    );
    if (!valid.length) return { status: 'skipped' };

    const db = this._getDb();
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${t} (id, original_id, vector, payload) VALUES (?,?,?,?)`);
    for (const p of valid) {
      const uuid = this.stringToUUID(p.id);
      stmt.run(uuid, p.id, JSON.stringify(p.vector), JSON.stringify({ ...p.payload, originalId: p.id }));
    }
    return { status: 'ok', upserted: valid.length };
  }

  _cosine(a, b) {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom > 0 ? dot / denom : 0;
  }

  async search(collectionName, vector, options = {}) {
    await this.ensureCollection(collectionName);
    const { limit = 10, scoreThreshold = 0, filter = null, withPayload = true } = options;
    const t = this._tableName(collectionName);
    const db = this._getDb();

    const rows = db.prepare(`SELECT id, original_id, vector, payload FROM ${t}`).all();
    const scored = [];

    for (const row of rows) {
      const vec = JSON.parse(row.vector);
      const score = this._cosine(vector, vec);
      if (score < scoreThreshold) continue;
      const payload = JSON.parse(row.payload);

      if (filter) {
        if (filter.must) {
          const pass = filter.must.every(f => payload[f.key] === f.match?.value);
          if (!pass) continue;
        }
        if (filter.must_not) {
          const fail = filter.must_not.some(f => payload[f.key] === f.match?.value);
          if (fail) continue;
        }
      }

      scored.push({ id: row.id, score, payload: withPayload ? payload : {} });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  async findDuplicates(collectionName, vector, questionId, threshold = 0.85) {
    const results = await this.search(collectionName, vector, {
      limit: 20, scoreThreshold: threshold,
      filter: { must_not: [{ key: 'originalId', match: { value: questionId } }] }
    });
    return results.map(r => ({
      id: r.payload.originalId || r.payload.id,
      score: r.score,
      question: r.payload.question,
      channel: r.payload.channel
    }));
  }

  async batchSearch(collectionName, vectors, options = {}) {
    return Promise.all(vectors.map(v =>
      this.search(collectionName, v.vector, { ...options, filter: v.filter || null })
    ));
  }

  async delete(collectionName, ids) {
    await this.ensureCollection(collectionName);
    const t = this._tableName(collectionName);
    const db = this._getDb();
    const stmt = db.prepare(`DELETE FROM ${t} WHERE id = ?`);
    for (const id of ids) {
      stmt.run(this.stringToUUID(id));
    }
    return true;
  }

  async deleteByFilter(collectionName, filter) {
    console.warn('deleteByFilter: not fully implemented in local provider');
    return true;
  }

  async getCollectionInfo(collectionName) {
    await this.ensureCollection(collectionName);
    const t = this._tableName(collectionName);
    const db = this._getDb();
    const cnt = db.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).get().cnt;
    return { name: collectionName, vectorsCount: cnt, pointsCount: cnt, status: 'green' };
  }

  async scroll(collectionName, options = {}) {
    await this.ensureCollection(collectionName);
    const { limit = 100, withPayload = true } = options;
    const t = this._tableName(collectionName);
    const db = this._getDb();
    const rows = db.prepare(`SELECT * FROM ${t} LIMIT ?`).all(limit);
    return {
      points: rows.map(r => ({ id: r.id, payload: withPayload ? JSON.parse(r.payload) : {} })),
      nextOffset: null
    };
  }

  async createPayloadIndex(collectionName, fieldName) {
    return true;
  }

  async getPoint(collectionName, id) {
    await this.ensureCollection(collectionName);
    const t = this._tableName(collectionName);
    const db = this._getDb();
    const row = db.prepare(`SELECT * FROM ${t} WHERE id = ?`).get(this.stringToUUID(id));
    if (!row) return null;
    return { id: row.id, payload: JSON.parse(row.payload), vector: JSON.parse(row.vector) };
  }

  async exists(collectionName, id) {
    return (await this.getPoint(collectionName, id)) !== null;
  }
}

const localQdrant = new LocalQdrantProvider();
export default localQdrant;
export { localQdrant };
