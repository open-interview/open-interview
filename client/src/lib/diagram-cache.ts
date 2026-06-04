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

export async function fetchCachedSvg(diagram: string): Promise<string | null> {
  const code = extractCode(diagram);
  if (!code) return null;

  const hash = await sha256Hex(code);
  const url = `/data/diagrams/${hash.slice(0, 2)}/${hash}.svg`;

  try {
    const res = await fetch(url);
    if (res.ok) return await res.text();
  } catch {
    /* cache miss */
  }

  return null;
}
