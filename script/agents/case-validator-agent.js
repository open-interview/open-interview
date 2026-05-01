/**
 * Real-World Case Validator Agent
 * Validates that real-world cases have specific metrics, company names, and verifiable details
 */

export async function validateCase(realWorldCase) {
  const issues = [];
  const score = { total: 0, max: 100 };

  // Check for company name (20 points)
  if (!realWorldCase.company || realWorldCase.company.length < 3) {
    issues.push('Missing or vague company name');
  } else {
    score.total += 20;
  }

  // Check for specific metrics/numbers (30 points)
  const hasMetrics = /\d+(%|ms|GB|TB|users|requests|hours|minutes|seconds|million|billion|thousand)/i.test(
    JSON.stringify(realWorldCase)
  );
  if (!hasMetrics) {
    issues.push('No specific metrics or numbers found');
  } else {
    score.total += 30;
  }

  // Check for verifiable source (30 points)
  if (!realWorldCase.source || !realWorldCase.source.startsWith('http')) {
    issues.push('Missing verifiable source URL');
  } else {
    score.total += 30;
  }

  // Check for outcome/impact (20 points)
  const description = realWorldCase.description || realWorldCase.reason || '';
  const hasOutcome = /(reduced|increased|improved|saved|prevented|achieved|resulted)/i.test(description);
  if (!hasOutcome) {
    issues.push('No clear outcome or impact described');
  } else {
    score.total += 20;
  }

  return {
    valid: score.total >= 70,
    score: score.total,
    issues,
    enhanced: score.total >= 70 ? realWorldCase : null
  };
}

export default { validateCase };
