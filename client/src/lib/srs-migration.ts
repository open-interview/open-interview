const OLD_SRS_KEY = 'code-reels-srs';
const OLD_FC_SRS_KEY = 'code-reels-fc-srs';
const NEW_SRS_KEY = 'oi-srs-v2';
const MIGRATED_FLAG = 'oi-srs-migrated';

export function migrateSRSStores(): void {
  try {
    if (localStorage.getItem(MIGRATED_FLAG)) return;

    const old1 = JSON.parse(localStorage.getItem(OLD_SRS_KEY) ?? '{}');
    const old2 = JSON.parse(localStorage.getItem(OLD_FC_SRS_KEY) ?? '{}');
    const merged = { ...old1, ...old2 };

    const existing = JSON.parse(localStorage.getItem(NEW_SRS_KEY) ?? '{}');
    const final = { ...merged, ...existing };

    localStorage.setItem(NEW_SRS_KEY, JSON.stringify(final));
    localStorage.setItem(MIGRATED_FLAG, '1');
  } catch {
    // silent fail — migration is best-effort
  }
}

export function getUnifiedSRS(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem(NEW_SRS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export function saveUnifiedSRS(data: Record<string, any>): void {
  localStorage.setItem(NEW_SRS_KEY, JSON.stringify(data));
}
