/**
 * Certification Question Bot Prompt Template
 * Generates exam-aligned MCQ questions for specific certifications
 */

import { jsonOutputRule } from './base.js';

export const schema = {
  id: "cert-xxx-001",
  certificationId: "aws-saa",
  domain: "design-secure",
  question: "Question text ending with ?",
  options: [
    { id: "a", text: "Option A", isCorrect: false },
    { id: "b", text: "Option B", isCorrect: true },
    { id: "c", text: "Option C", isCorrect: false },
    { id: "d", text: "Option D", isCorrect: false }
  ],
  explanation: "Detailed explanation with reasoning",
  difficulty: "intermediate",
  tags: ["tag1", "tag2"]
};

export const certificationDomains = {
  'aws-saa': [
    { id: 'design-secure', name: 'Design Secure Architectures', weight: 30 },
    { id: 'design-resilient', name: 'Design Resilient Architectures', weight: 26 },
    { id: 'design-performant', name: 'Design High-Performing Architectures', weight: 24 },
    { id: 'design-cost', name: 'Design Cost-Optimized Architectures', weight: 20 }
  ],
  'cka': [
    { id: 'cluster-arch', name: 'Cluster Architecture', weight: 25 },
    { id: 'workloads', name: 'Workloads & Scheduling', weight: 15 },
    { id: 'services', name: 'Services & Networking', weight: 20 },
    { id: 'storage', name: 'Storage', weight: 10 },
    { id: 'troubleshoot', name: 'Troubleshooting', weight: 30 }
  ],
  'terraform-associate': [
    { id: 'iac-concepts', name: 'IaC Concepts', weight: 15 },
    { id: 'terraform-basics', name: 'Terraform Basics', weight: 20 },
    { id: 'terraform-state', name: 'Terraform State', weight: 15 },
    { id: 'modules', name: 'Modules', weight: 15 },
    { id: 'workflow', name: 'Core Workflow', weight: 15 }
  ]
};


export const guidelines = [
  'Questions must align with official exam objectives',
  'Use scenario-based questions for intermediate/advanced difficulty',
  'All 4 options must be plausible - avoid obviously wrong answers',
  'Exactly ONE correct answer per question',
  'Explanation should reference why wrong options are incorrect',
  'Include relevant AWS/K8s/Terraform service names in tags',
  'Difficulty should match domain complexity',
  'Questions should test practical knowledge, not memorization'
];

export function build(context) {
  const { certificationId, domain, difficulty, count = 5 } = context;
  
  const domains = certificationDomains[certificationId] || [];
  const targetDomain = domains.find(d => d.id === domain);
  
  return `You are an expert certification exam question writer. Generate ${count} high-quality MCQ questions.

CERTIFICATION: ${certificationId.toUpperCase()}
DOMAIN: ${targetDomain?.name || domain} (${targetDomain?.weight || 0}% of exam)
DIFFICULTY: ${difficulty}

Generate questions that:
- Test practical, real-world knowledge
- Use scenario-based format for intermediate/advanced
- Have exactly 4 options with ONE correct answer
- Include detailed explanations

Return a JSON array:
${JSON.stringify([schema], null, 2)}

GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}

${jsonOutputRule}`;
}

export default { schema, certificationDomains, guidelines, build };
