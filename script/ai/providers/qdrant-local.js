/**
 * Postgres-backed Vector Store — drop-in replacement for qdrant-local.js
 *
 * Stores vectors as REAL[] in Postgres and computes cosine similarity in SQL.
 * No external dependencies beyond the existing pg-client.
 *
 * Implements the same interface as the old LocalQdrantProvider:
 *   init, ensureCollection, upsert, search, findDuplicates,
 *   batchSearch, delete, deleteByFilter, getCollectionInfo,
 *   scroll, createPayloadIndex, getPoint, exists
 */

import { getPool } from '../../db/pg-client.js';
import crypto from 'crypto';

class PgVectorProvider {
  constructor() {
    this._ensuredCollections = new Set();
  }

  _pool() { return getPool(); }

  _table(name) { return `vec_${name.replace(/[^a-z0-9_]/gi, '_')}`; }

  async init() {
    console.log('✅ Postgres vector store initialized');
  }

  async ensureCollection(name) {
    if (this._ensuredCollections.has(name)) return true;
    const t = this._table(name);
    await this._pool().query(`
      CREATE TABLE IF NOT EXISTS ${t} (
        id          TEXT PRIMARY KEY,
        original_id TEXT NOT NULL,
        vector      REAL[] NOT NULL,
        payload     JSONB NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await this._pool().query(`CREATE INDEX IF NOT EXISTS idx_${t}_oid ON ${t}(original_id)`);
    this._ensuredCollections.add(name);
    console.log(`✅ Postgres vector collection ready: ${name}`);
    return true;
  }

  _uuid(str) {
    const h = crypto.createHash('md5').update(str).digest('hex');
    return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
  }

  async upsert(name, points) {
    await this.ensureCollection(name);
    const t = this._table(name);
    const valid = points.filter(p =>
      Array.isArray(p.vector) && p.vector.length > 0 &&
      p.vector.every(v => typeof v === 'number' && isFinite(v))
    );
    if (!valid.length) return { status: 'skipped' };

    const pool = this._pool();
    for (const p of valid) {
      await pool.query(
        `INSERT INTO ${t} (id, original_id, vector, payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET vector = EXCLUDED.vector, payload = EXCLUDED.payload`,
        [this._uuid(p.id), p.id, p.vector, { ...p.payload, originalId: p.id }]
      );
    }
    return { status: 'ok', upserted: valid.length };
  }

  /**
   * Cosine similarity in SQL:
   *   dot(a,b) / (||a|| * ||b||)
   * Postgres doesn't have a built-in, so we use array operators.
   */
  async search(name, vector, options = {}) {
    await this.ensureCollection(name);
    const { limit = 10, scoreThreshold = 0, filter = null, withPayload = true } = options;
    const t = this._table(name);
    const pool = this._pool();

    // Build WHERE clause from filter
    const conditions = [`score >= $2`];
    const params = [vector, scoreThreshold];

    // We compute similarity as a subquery so we can filter on it
    let filterSql = '';
    if (filter?.must?.length) {
      for (const f of filter.must) {
        params.push(f.match?.value);
        filterSql += ` AND payload->>'${f.key}' = $${params.length}`;
      }
    }
    if (filter?.must_not?.length) {
      for (const f of filter.must_not) {
        params.push(f.match?.value);
        filterSql += ` AND payload->>'${f.key}' != $${params.length}`;
      }
    }

    params.push(limit);
    const limitParam = params.length;

    const sql = `
      SELECT id, original_id, payload,
        (
          (SELECT SUM(a*b) FROM UNNEST(vector, $1::REAL[]) AS t(a,b))
          /
          NULLIF(
            SQRT((SELECT SUM(a*a) FROM UNNEST(vector) AS t(a))) *
            SQRT((SELECT SUM(b*b) FROM UNNEST($1::REAL[]) AS t(b))),
            0
          )
        ) AS score
      FROM ${t}
      WHERE (
          (SELECT SUM(a*b) FROM UNNEST(vector, $1::REAL[]) AS t(a,b))
          /
          NULLIF(
            SQRT((SELECT SUM(a*a) FROM UNNEST(vector) AS t(a))) *
            SQRT((SELECT SUM(b*b) FROM UNNEST($1::REAL[]) AS t(b))),
            0
          )
        ) >= $2
        ${filterSql}
      ORDER BY score DESC
      LIMIT $${limitParam}
    `;

    const res = await pool.query(sql, params);
    return res.rows.map(r => ({
      id: r.id,
      score: parseFloat(r.score) || 0,
      payload: withPayload ? r.payload : {}
    }));
  }

  async findDuplicates(name, vector, questionId, threshold = 0.85) {
    const results = await this.search(name, vector, {
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

  async batchSearch(name, vectors, options = {}) {
    return Promise.all(vectors.map(v =>
      this.search(name, v.vector, { ...options, filter: v.filter || null })
    ));
  }

  async delete(name, ids) {
    await this.ensureCollection(name);
    const t = this._table(name);
    for (const id of ids) {
      await this._pool().query(`DELETE FROM ${t} WHERE id = $1`, [this._uuid(id)]);
    }
    return true;
  }

  async deleteByFilter(name, filter) {
    console.warn('deleteByFilter: not implemented in pg provider');
    return true;
  }

  async getCollectionInfo(name) {
    await this.ensureCollection(name);
    const t = this._table(name);
    const res = await this._pool().query(`SELECT COUNT(*) AS cnt FROM ${t}`);
    const cnt = parseInt(res.rows[0].cnt);
    return { name, vectorsCount: cnt, pointsCount: cnt, status: 'green' };
  }

  async scroll(name, options = {}) {
    await this.ensureCollection(name);
    const { limit = 100, withPayload = true } = options;
    const t = this._table(name);
    const res = await this._pool().query(`SELECT id, payload FROM ${t} LIMIT $1`, [limit]);
    return {
      points: res.rows.map(r => ({ id: r.id, payload: withPayload ? r.payload : {} })),
      nextOffset: null
    };
  }

  async createPayloadIndex() { return true; }

  async getPoint(name, id) {
    await this.ensureCollection(name);
    const t = this._table(name);
    const res = await this._pool().query(
      `SELECT id, payload, vector FROM ${t} WHERE id = $1`, [this._uuid(id)]
    );
    if (!res.rows.length) return null;
    const r = res.rows[0];
    return { id: r.id, payload: r.payload, vector: r.vector };
  }

  async exists(name, id) {
    return (await this.getPoint(name, id)) !== null;
  }
}

const pgVector = new PgVectorProvider();
export default pgVector;
export { pgVector };
