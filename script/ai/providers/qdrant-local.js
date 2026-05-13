import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VECTOR_STORE_DIR = path.join(__dirname, '..', '..', '..', 'data', 'vectors');

class FileVectorProvider {
  constructor() {
    this._ensuredCollections = new Set();
  }

  _collectionFile(name) {
    return path.join(VECTOR_STORE_DIR, `${name}.json`);
  }

  _loadCollection(name) {
    const file = this._collectionFile(name);
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
  }

  _saveCollection(name, points) {
    if (!fs.existsSync(VECTOR_STORE_DIR)) {
      fs.mkdirSync(VECTOR_STORE_DIR, { recursive: true });
    }
    fs.writeFileSync(this._collectionFile(name), JSON.stringify(points, null, 2));
  }

  async init() {
    console.log('✅ File-based vector store initialized');
  }

  async ensureCollection(name) {
    if (this._ensuredCollections.has(name)) return true;
    this._loadCollection(name);
    this._ensuredCollections.add(name);
    return true;
  }

  _uuid(str) {
    const h = crypto.createHash('md5').update(str).digest('hex');
    return `${h.slice(0,8)}-${h.slice(8,12)}-4${h.slice(13,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
  }

  _cosineSimilarity(a, b) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return magA * magB === 0 ? 0 : dot / (magA * magB);
  }

  async upsert(name, points) {
    await this.ensureCollection(name);
    const valid = points.filter(p =>
      Array.isArray(p.vector) && p.vector.length > 0 &&
      p.vector.every(v => typeof v === 'number' && isFinite(v))
    );
    if (!valid.length) return { status: 'skipped' };

    const collection = this._loadCollection(name);
    for (const p of valid) {
      const idx = collection.findIndex(c => c.id === this._uuid(p.id));
      const entry = { id: this._uuid(p.id), originalId: p.id, vector: p.vector, payload: { ...p.payload, originalId: p.id } };
      if (idx >= 0) collection[idx] = entry;
      else collection.push(entry);
    }
    this._saveCollection(name, collection);
    return { status: 'ok', upserted: valid.length };
  }

  async search(name, vector, options = {}) {
    await this.ensureCollection(name);
    const { limit = 10, scoreThreshold = 0, filter = null, withPayload = true } = options;
    const collection = this._loadCollection(name);

    let results = collection.map(p => ({
      id: p.id,
      score: this._cosineSimilarity(vector, p.vector),
      payload: withPayload ? p.payload : {}
    }));

    if (filter?.must?.length) {
      for (const f of filter.must) {
        results = results.filter(r => r.payload[f.key] === f.match?.value);
      }
    }
    if (filter?.must_not?.length) {
      for (const f of filter.must_not) {
        results = results.filter(r => r.payload[f.key] !== f.match?.value);
      }
    }

    results = results.filter(r => r.score >= scoreThreshold);
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
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
    const collection = this._loadCollection(name);
    const idSet = new Set(ids.map(id => this._uuid(id)));
    const filtered = collection.filter(p => !idSet.has(p.id));
    this._saveCollection(name, filtered);
    return true;
  }

  async deleteByFilter(name, filter) {
    await this.ensureCollection(name);
    this._saveCollection(name, []);
    return true;
  }

  async getCollectionInfo(name) {
    await this.ensureCollection(name);
    const collection = this._loadCollection(name);
    return { name, vectorsCount: collection.length, pointsCount: collection.length, status: 'green' };
  }

  async scroll(name, options = {}) {
    await this.ensureCollection(name);
    const { limit = 100, withPayload = true } = options;
    const collection = this._loadCollection(name);
    return {
      points: collection.slice(0, limit).map(p => ({ id: p.id, payload: withPayload ? p.payload : {} })),
      nextOffset: null
    };
  }

  async createPayloadIndex() { return true; }

  async getPoint(name, id) {
    await this.ensureCollection(name);
    const collection = this._loadCollection(name);
    const p = collection.find(c => c.id === this._uuid(id));
    return p || null;
  }

  async exists(name, id) {
    return (await this.getPoint(name, id)) !== null;
  }
}

const fileVector = new FileVectorProvider();
export default fileVector;
export { fileVector };
