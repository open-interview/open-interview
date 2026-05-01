/**
 * Practical Content Agent
 * Adds practical sections: Quick Reference, Common Pitfalls, Best Practices
 */

export async function addPracticalSections(blogContent, channel) {
  const additions = [];
  
  // Extract key points for Quick Reference
  const quickRef = extractQuickReference(blogContent);
  if (quickRef.length > 0) {
    additions.push({
      type: 'quick-reference',
      title: '⚡ Quick Reference',
      content: quickRef,
      placement: 'after-intro'
    });
  }
  
  // Generate Common Pitfalls
  const pitfalls = generateCommonPitfalls(blogContent, channel);
  if (pitfalls.length > 0) {
    additions.push({
      type: 'pitfalls',
      title: '⚠️ Common Pitfalls',
      content: pitfalls,
      placement: 'before-conclusion'
    });
  }
  
  // Generate Best Practices
  const practices = generateBestPractices(blogContent, channel);
  if (practices.length > 0) {
    additions.push({
      type: 'best-practices',
      title: '✅ Best Practices',
      content: practices,
      placement: 'before-conclusion'
    });
  }
  
  return {
    added: additions.length > 0,
    additions
  };
}

function extractQuickReference(blogContent) {
  const items = [];
  const content = JSON.stringify(blogContent);
  
  // Extract key terms and definitions
  const sections = blogContent.sections || [];
  sections.forEach(section => {
    const text = section.content || '';
    
    // Look for definition patterns
    const defMatches = text.match(/(\w+(?:\s+\w+){0,2})\s+(?:is|are|means|refers to)\s+([^.]{20,100})/gi);
    if (defMatches && defMatches.length > 0) {
      defMatches.slice(0, 2).forEach(match => {
        const parts = match.split(/\s+(?:is|are|means|refers to)\s+/i);
        if (parts.length === 2) {
          items.push({
            term: parts[0].trim(),
            definition: parts[1].trim()
          });
        }
      });
    }
  });
  
  return items.slice(0, 5);
}

function generateCommonPitfalls(blogContent, channel) {
  const pitfalls = [];
  const content = JSON.stringify(blogContent).toLowerCase();
  
  // Pattern-based pitfall detection
  const pitfallPatterns = [
    { pattern: /security|authentication|authorization/, pitfall: 'Not implementing proper authentication and authorization' },
    { pattern: /scale|performance|latency/, pitfall: 'Ignoring scalability considerations early in design' },
    { pattern: /error|exception|failure/, pitfall: 'Insufficient error handling and logging' },
    { pattern: /test|testing|qa/, pitfall: 'Skipping integration and load testing' },
    { pattern: /monitor|observability|metrics/, pitfall: 'Lack of proper monitoring and alerting' }
  ];
  
  pitfallPatterns.forEach(({ pattern, pitfall }) => {
    if (pattern.test(content)) {
      pitfalls.push(pitfall);
    }
  });
  
  return pitfalls.slice(0, 4);
}

function generateBestPractices(blogContent, channel) {
  const practices = [];
  const content = JSON.stringify(blogContent).toLowerCase();
  
  // Channel-specific best practices
  const practiceMap = {
    'aws': ['Use IAM roles instead of access keys', 'Enable CloudTrail for audit logging', 'Implement least privilege access'],
    'kubernetes': ['Use namespaces for resource isolation', 'Set resource limits and requests', 'Implement health checks'],
    'terraform': ['Use remote state with locking', 'Organize code with modules', 'Version your providers'],
    'docker': ['Use multi-stage builds', 'Run as non-root user', 'Scan images for vulnerabilities'],
    'devops': ['Automate everything possible', 'Version control all configurations', 'Implement CI/CD pipelines']
  };
  
  // Add channel-specific practices
  if (practiceMap[channel]) {
    practices.push(...practiceMap[channel].slice(0, 3));
  }
  
  // Add generic practices based on content
  if (content.includes('security')) {
    practices.push('Regularly update dependencies and patch vulnerabilities');
  }
  if (content.includes('performance')) {
    practices.push('Profile and benchmark before optimizing');
  }
  
  return practices.slice(0, 5);
}

export default { addPracticalSections };
