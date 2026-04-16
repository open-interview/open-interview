/**
 * OpenCode Provider
 * Adapter for OpenCode CLI
 */

import { spawn } from 'child_process';
import os from 'os';
import config from '../config.js';

const TIMEOUT_MS = 300000; // 5 minutes

// Cap each OpenCode process to 512 MB so N parallel instances stay bounded.
// Total memory used = MEMORY_PER_PROCESS_MB * concurrency.
const MEMORY_PER_PROCESS_MB = parseInt(process.env.OPENCODE_MEMORY_MB || '512');

/**
 * How many parallel OpenCode processes are safe given available RAM.
 * Leaves 20% of total RAM free as headroom.
 */
export function safeConcurrency(requested = 10) {
  const freeMb  = Math.floor(os.freemem()  / 1024 / 1024);
  const totalMb = Math.floor(os.totalmem() / 1024 / 1024);
  const usableMb = Math.floor(totalMb * 0.8);
  const maxSafe  = Math.max(1, Math.floor(usableMb / MEMORY_PER_PROCESS_MB));
  return Math.min(requested, maxSafe);
}

/**
 * Run OpenCode CLI with a prompt
 */
export async function call(prompt, options = {}) {
  const model = options.model || config.defaultModel;

  // Inherit parent env but cap heap for this child process
  const childEnv = {
    ...process.env,
    NODE_OPTIONS: `--max-old-space-size=${MEMORY_PER_PROCESS_MB}`,
  };
  
  return new Promise((resolve, reject) => {
    let output = '';
    let resolved = false;
    
    const proc = spawn('opencode', ['run', '--model', model, '--format', 'json', prompt], {
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: childEnv,
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        reject(new Error('OpenCode timeout'));
      }
    }, TIMEOUT_MS);
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        if (output) {
          resolve(output);
        } else {
          reject(new Error(`OpenCode exited with code ${code}`));
        }
      }
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        reject(err);
      }
    });
  });
}

/**
 * Parse OpenCode JSON event stream response
 */
export function parseResponse(output) {
  if (!output) {
    console.log('⚠️ parseResponse: No output received');
    return null;
  }
  
  // Try to extract text from JSON events
  const lines = output.split('\n').filter(l => l.trim());
  let fullText = '';
  
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'text' && event.part?.text) {
        fullText += event.part.text;
      }
    } catch {
      // Not JSON, might be raw text
    }
  }
  
  const text = fullText || output;
  
  if (!text || text.trim().length === 0) {
    console.log('⚠️ parseResponse: No text extracted from events');
    console.log('   Raw output length:', output.length);
    console.log('   Lines found:', lines.length);
    return null;
  }
  
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(text.trim());
    return parsed;
  } catch (e) {
    console.log('⚠️ parseResponse: Direct JSON parse failed:', e.message);
    console.log('   Text preview:', text.substring(0, 200));
  }
  
  // Try to extract JSON from code blocks
  const codeBlockPatterns = [/```json\s*([\s\S]*?)\s*```/, /```\s*([\s\S]*?)\s*```/];
  for (const p of codeBlockPatterns) {
    const m = text.match(p);
    if (m) {
      try { return JSON.parse(m[1].trim()); } catch {}
    }
  }
  
  // Try to extract JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch {}
  }
  
  // Try to extract JSON array
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    try { return JSON.parse(text.substring(firstBracket, lastBracket + 1)); } catch {}
  }
  
  return null;
}

export default { call, parseResponse, safeConcurrency };
