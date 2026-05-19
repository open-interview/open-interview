/**
 * OpenCode HTTP Provider
 * Uses opencode serve HTTP API (ACP / Agent Client Protocol) — no process spawning.
 *
 * Requires "OpenCode AI Server" workflow to be running:
 *   opencode serve --port 4200 --hostname 127.0.0.1
 *
 * Env overrides:
 *   OPENCODE_SERVER_URL   default: http://127.0.0.1:4200
 *   OPENCODE_MODEL        default: opencode/big-pickle  (free, no login)
 */

import os from 'os';
import config from '../config.js';

const SERVER_URL = (process.env.OPENCODE_SERVER_URL || 'http://127.0.0.1:4200').replace(/\/$/, '');
const TIMEOUT_MS      = 300_000;  // 5 min max for AI to respond
const POLL_INTERVAL   = 1_500;    // 1.5s between polls
const REQUEST_TIMEOUT = 10_000;   // 10s for each HTTP call

/**
 * All tool IDs that exist in opencode — we disable every one for content
 * generation so the AI only outputs text / JSON without touching the repo.
 */
const ALL_TOOLS_DISABLED = Object.fromEntries(
  ['invalid','question','bash','read','glob','grep','edit','write',
   'task','webfetch','todowrite','websearch','skill','apply_patch']
  .map(t => [t, false])
);

// ── helpers ──────────────────────────────────────────────────────────────────

function safeConcurrencyInner(requested) {
  const totalMb  = Math.floor(os.totalmem() / 1024 / 1024);
  const usableMb = Math.floor(totalMb * 0.8);
  const maxSafe  = Math.max(1, Math.floor(usableMb / 64));
  return Math.min(requested, maxSafe);
}

export function safeConcurrency(requested = 10) {
  return safeConcurrencyInner(requested);
}

async function fetchJSON(url, init = {}, timeoutMs = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    // 204 No Content — nothing to parse
    if (res.status === 204) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

// ── server check ─────────────────────────────────────────────────────────────

async function checkServer() {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${SERVER_URL}/session`, { signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  }
}

// ── session lifecycle ─────────────────────────────────────────────────────────

async function createSession() {
  return fetchJSON(`${SERVER_URL}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
}

function deleteSession(sessionId) {
  // fire-and-forget cleanup
  fetch(`${SERVER_URL}/session/${sessionId}`, { method: 'DELETE' }).catch(() => {});
}

// ── prompt + poll ─────────────────────────────────────────────────────────────

/**
 * Send a prompt to a session and wait until the AI has fully responded.
 *
 * Message schema from the API:
 *   { info: { id, role, time: { created, completed? }, error? }, parts: [...] }
 *
 * Parts schema:
 *   { type: "text"|"reasoning"|"step-start"|"step-finish"|..., text? }
 */
async function sendPrompt(sessionId, prompt, model) {
  const [providerID, modelID] = model.includes('/')
    ? model.split('/')
    : ['opencode', model];

  // Send prompt — returns immediately (async)
  await fetchJSON(
    `${SERVER_URL}/session/${sessionId}/prompt_async`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:   { providerID, modelID },
        noReply: false,
        tools:   ALL_TOOLS_DISABLED,
        parts:   [{ type: 'text', text: prompt }],
      }),
    },
    REQUEST_TIMEOUT,
  );

  // Poll until a completed assistant message appears
  const deadline = Date.now() + TIMEOUT_MS;

  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, POLL_INTERVAL));

    let messages;
    try {
      messages = await fetchJSON(`${SERVER_URL}/session/${sessionId}/message`);
    } catch {
      continue; // retry on transient errors
    }

    if (!Array.isArray(messages)) continue;

    // Each item is { info: {...}, parts: [...] }
    const assistantMsgs = messages.filter(
      m => m?.info?.role === 'assistant' && m?.info?.time?.completed,
    );

    if (assistantMsgs.length === 0) continue;

    const last = assistantMsgs[assistantMsgs.length - 1];

    // Surface provider errors
    if (last.info?.error) {
      const e = last.info.error;
      throw new Error(`AI error: ${e?.data?.message || e?.name || JSON.stringify(e)}`);
    }

    // Extract all text parts
    const textParts = (last.parts || []).filter(p => p.type === 'text');
    if (textParts.length === 0) {
      // Parts not yet populated — keep polling a bit longer
      continue;
    }

    return textParts.map(p => p.text).join('');
  }

  throw new Error(
    `Timeout: no completed AI response after ${TIMEOUT_MS / 1000}s (session ${sessionId})`,
  );
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Send a prompt and return the raw text response.
 * Creates a fresh isolated session per call, then deletes it.
 */
export async function call(prompt, options = {}) {
  const model = options.model || config.defaultModel;

  if (!(await checkServer())) {
    throw new Error(
      `OpenCode server not reachable at ${SERVER_URL}. ` +
      `Start the "OpenCode AI Server" workflow, or run: ` +
      `opencode serve --port 4200 --hostname 127.0.0.1`,
    );
  }

  const session = await createSession();
  try {
    return await sendPrompt(session.id, prompt, model);
  } finally {
    deleteSession(session.id);
  }
}

/**
 * Parse the raw text response into structured JSON (or null).
 * Mirrors the same extraction logic used by the rest of the AI framework.
 */
export function parseResponse(output) {
  if (!output) return null;

  const text = typeof output === 'string' ? output : JSON.stringify(output);
  if (!text.trim()) return null;

  // Detect AI refusals
  const refusals = [
    /^i('m| am) sorry[,.]? but i (can'?t|cannot|am unable)/i,
    /^i (can'?t|cannot|am unable) (assist|help|provide|generate)/i,
    /^i('m| am) not able to (assist|help|provide|generate)/i,
  ];
  if (refusals.some(p => p.test(text.trim()))) {
    const err = new Error(`AI_REFUSAL: ${text.slice(0, 100)}`);
    err.isRefusal = true;
    throw err;
  }

  // Direct JSON parse
  try { return JSON.parse(text.trim()); } catch {}

  // JSON in code fence
  for (const re of [/```json\s*([\s\S]*?)\s*```/, /```\s*([\s\S]*?)\s*```/]) {
    const m = text.match(re);
    if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  }

  // Bare JSON object
  const ob = text.indexOf('{'), cb = text.lastIndexOf('}');
  if (ob !== -1 && cb > ob) { try { return JSON.parse(text.slice(ob, cb + 1)); } catch {} }

  // Bare JSON array
  const oa = text.indexOf('['), ca = text.lastIndexOf(']');
  if (oa !== -1 && ca > oa) { try { return JSON.parse(text.slice(oa, ca + 1)); } catch {} }

  return null;
}

export default { call, parseResponse, safeConcurrency };
