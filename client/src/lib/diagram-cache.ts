async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function extractCode(diagram: string): string | null {
  if (!diagram) return null;
  const trimmed = diagram.trim();
  const match = trimmed.match(/^```mermaid\s*\n([\s\S]*?)```/);
  return match ? match[1].trim() : trimmed;
}

const special = /[()\[\]{}]/;

function wrapLabel(line: string): string {
  let result = '';
  let i = 0;
  while (i < line.length) {
    if (line[i] === '[' || line[i] === '{') {
      const close = line[i] === '[' ? ']' : '}';
      let depth = 1;
      let j = i + 1;
      while (j < line.length && depth > 0) {
        if (line[j] === line[i]) depth++;
        else if (line[j] === close) depth--;
        if (depth > 0) j++;
      }
      const label = line.slice(i + 1, j);
      if (label && !label.startsWith('"') && !label.startsWith("'") && special.test(label)) {
        result += line[i] === '[' ? `["${label}"]` : `{"${label}"}`;
      } else {
        result += line.slice(i, j + 1);
      }
      i = j + 1;
    } else {
      result += line[i];
      i++;
    }
  }
  return result;
}

export function fixMermaidSyntax(code: string): string {
  return code.split('\n').map(wrapLabel).join('\n');
}

export async function fetchCachedSvg(diagram: string): Promise<string | null> {
  const code = extractCode(diagram);
  if (!code) return null;

  const fixed = fixMermaidSyntax(code);
  const hash = await sha256Hex(fixed);
  const url = `/data/diagrams/${hash.slice(0, 2)}/${hash}.svg`;

  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
  } catch {
    /* cache miss */
  }

  return null;
}
