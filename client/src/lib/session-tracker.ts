/**
 * Session Tracker - Utilities for tracking active sessions
 * Updates lastAccessedAt timestamps for resume functionality
 */

/**
 * Update the lastAccessedAt timestamp for a session
 */
export function updateSessionTimestamp(sessionKey: string, additionalData?: Record<string, any>): void {
  try {
    const existing = localStorage.getItem(sessionKey);
    if (!existing) return;
    
    const data = JSON.parse(existing);
    const updated = {
      ...data,
      ...additionalData,
      lastAccessedAt: new Date().toISOString()
    };
    
    localStorage.setItem(sessionKey, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update session timestamp:', e);
  }
}

/**
 * Create or update a test session
 */
export function saveTestSession(
  channelId: string,
  channelName: string,
  questions: any[],
  currentQuestionIndex: number,
  answers: Record<string, string[]>
): void {
  try {
    const sessionKey = `test-session-${channelId}`;
    const sessionData = {
      channelId,
      channelName,
      questions,
      currentQuestionIndex,
      answers,
      lastAccessedAt: new Date().toISOString(),
      startedAt: new Date().toISOString()
    };
    
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save test session:', e);
  }
}

/**
 * Update test session progress
 */
export function updateTestSession(
  channelId: string,
  currentQuestionIndex: number,
  answers: Record<string, string[]>
): void {
  try {
    const sessionKey = `test-session-${channelId}`;
    const existing = localStorage.getItem(sessionKey);
    if (!existing) return;
    
    const data = JSON.parse(existing);
    const updated = {
      ...data,
      currentQuestionIndex,
      answers,
      lastAccessedAt: new Date().toISOString()
    };
    
    localStorage.setItem(sessionKey, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update test session:', e);
  }
}

/**
 * Create or update a certification session
 */
export function saveCertificationSession(
  certificationId: string,
  certificationName: string,
  questions: any[],
  currentQuestionIndex: number,
  answers: Record<string, string[]>
): void {
  try {
    const sessionKey = `certification-session-${certificationId}`;
    const sessionData = {
      certificationId,
      certificationName,
      questions,
      currentQuestionIndex,
      answers,
      lastAccessedAt: new Date().toISOString(),
      startedAt: new Date().toISOString()
    };
    
    localStorage.setItem(sessionKey, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save certification session:', e);
  }
}

/**
 * Update certification session progress
 */
export function updateCertificationSession(
  certificationId: string,
  currentQuestionIndex: number,
  answers: Record<string, string[]>
): void {
  try {
    const sessionKey = `certification-session-${certificationId}`;
    const existing = localStorage.getItem(sessionKey);
    if (!existing) return;
    
    const data = JSON.parse(existing);
    const updated = {
      ...data,
      currentQuestionIndex,
      answers,
      lastAccessedAt: new Date().toISOString()
    };
    
    localStorage.setItem(sessionKey, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update certification session:', e);
  }
}

/**
 * Clear a session when completed
 */
export function clearSession(sessionKey: string): void {
  try {
    localStorage.removeItem(sessionKey);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}
