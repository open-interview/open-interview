/**
 * Certification Track Configuration
 * Popular IT certifications with mapped channels and topics
 */

export interface CertificationConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'cloud' | 'devops' | 'security' | 'data' | 'ai' | 'development' | 'management';
  estimatedHours: number;
  examCode?: string;
  officialUrl?: string;
  // Maps to existing channels and their sub-channels
  channelMappings: {
    channelId: string;
    subChannels?: string[]; // specific sub-channels, or all if empty
    weight: number; // percentage of questions from this channel (0-100)
  }[];
  // Specific tags to filter questions
  tags?: string[];
  prerequisites?: string[]; // other certification IDs
}

export const certificationsConfig: CertificationConfig[] = [
  // AWS Certifications
  {
    id: 'aws-saa',
    name: 'AWS Solutions Architect Associate',
    provider: 'Amazon Web Services',
    description: 'Design distributed systems on AWS. Covers compute, storage, networking, databases, and security.',
    icon: 'cloud',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 40,
    examCode: 'SAA-C03',
    officialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
    channelMappings: [
      { channelId: 'aws', weight: 50 },
      { channelId: 'system-design', weight: 20 },
      { channelId: 'networking', weight: 15 },
      { channelId: 'security', weight: 15 }
    ]
  },
  {
    id: 'aws-sap',
    name: 'AWS Solutions Architect Professional',
    provider: 'Amazon Web Services',
    description: 'Advanced AWS architecture for complex enterprise solutions. Multi-account strategies and migrations.',
    icon: 'cloud',
    color: 'text-orange-600',
    difficulty: 'expert',
    category: 'cloud',
    estimatedHours: 80,
    examCode: 'SAP-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
    channelMappings: [
      { channelId: 'aws', weight: 55 },
      { channelId: 'system-design', weight: 25 },
      { channelId: 'security', weight: 10 },
      { channelId: 'networking', weight: 10 }
    ],
    prerequisites: ['aws-saa']
  },
  {
    id: 'aws-dva',
    name: 'AWS Developer Associate',
    provider: 'Amazon Web Services',
    description: 'Develop and maintain AWS applications. Lambda, API Gateway, DynamoDB, and CI/CD.',
    icon: 'code',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 35,
    examCode: 'DVA-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-developer-associate/',
    channelMappings: [
      { channelId: 'aws', weight: 45 },
      { channelId: 'backend', weight: 25 },
      { channelId: 'devops', weight: 20 },
      { channelId: 'database', weight: 10 }
    ]
  },

  {
    id: 'aws-sysops',
    name: 'AWS SysOps Administrator Associate',
    provider: 'Amazon Web Services',
    description: 'Deploy, manage, and operate scalable systems on AWS. Monitoring, automation, and security.',
    icon: 'server',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 40,
    examCode: 'SOA-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-sysops-admin-associate/',
    channelMappings: [
      { channelId: 'aws', weight: 45 },
      { channelId: 'devops', weight: 25 },
      { channelId: 'sre', weight: 20 },
      { channelId: 'linux', weight: 10 }
    ]
  },

  // Kubernetes Certifications
  {
    id: 'cka',
    name: 'Certified Kubernetes Administrator',
    provider: 'CNCF',
    description: 'Kubernetes cluster administration. Installation, networking, storage, and troubleshooting.',
    icon: 'box',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 50,
    examCode: 'CKA',
    officialUrl: 'https://www.cncf.io/certification/cka/',
    channelMappings: [
      { channelId: 'kubernetes', weight: 60 },
      { channelId: 'devops', weight: 20 },
      { channelId: 'linux', weight: 10 },
      { channelId: 'networking', weight: 10 }
    ]
  },
  {
    id: 'ckad',
    name: 'Certified Kubernetes Application Developer',
    provider: 'CNCF',
    description: 'Design, build, and deploy cloud-native applications on Kubernetes.',
    icon: 'box',
    color: 'text-blue-400',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 40,
    examCode: 'CKAD',
    officialUrl: 'https://www.cncf.io/certification/ckad/',
    channelMappings: [
      { channelId: 'kubernetes', weight: 55 },
      { channelId: 'backend', weight: 20 },
      { channelId: 'devops', weight: 15 },
      { channelId: 'docker', weight: 10 }
    ]
  },
  {
    id: 'cks',
    name: 'Certified Kubernetes Security Specialist',
    provider: 'CNCF',
    description: 'Kubernetes security best practices. Cluster hardening, network policies, and runtime security.',
    icon: 'shield',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'security',
    estimatedHours: 60,
    examCode: 'CKS',
    officialUrl: 'https://www.cncf.io/certification/cks/',
    channelMappings: [
      { channelId: 'kubernetes', weight: 45 },
      { channelId: 'security', weight: 35 },
      { channelId: 'devops', weight: 10 },
      { channelId: 'networking', weight: 10 }
    ],
    prerequisites: ['cka']
  },

  // Terraform
  {
    id: 'terraform-associate',
    name: 'HashiCorp Terraform Associate',
    provider: 'HashiCorp',
    description: 'Infrastructure as Code fundamentals. Terraform workflow, state management, and modules.',
    icon: 'layers',
    color: 'text-purple-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 30,
    examCode: '003',
    officialUrl: 'https://www.hashicorp.com/certification/terraform-associate',
    channelMappings: [
      { channelId: 'terraform', weight: 60 },
      { channelId: 'devops', weight: 20 },
      { channelId: 'aws', weight: 20 }
    ]
  },

  // Google Cloud
  {
    id: 'gcp-ace',
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google Cloud',
    description: 'Deploy applications and manage GCP resources. Compute Engine, GKE, and Cloud Functions.',
    icon: 'cloud',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 40,
    officialUrl: 'https://cloud.google.com/certification/cloud-engineer',
    channelMappings: [
      { channelId: 'system-design', weight: 30 },
      { channelId: 'devops', weight: 25 },
      { channelId: 'kubernetes', weight: 25 },
      { channelId: 'networking', weight: 20 }
    ]
  },
  {
    id: 'gcp-pca',
    name: 'Google Cloud Professional Cloud Architect',
    provider: 'Google Cloud',
    description: 'Design and plan cloud solutions on GCP. Enterprise architecture and migration strategies.',
    icon: 'cloud',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'cloud',
    estimatedHours: 60,
    officialUrl: 'https://cloud.google.com/certification/cloud-architect',
    channelMappings: [
      { channelId: 'system-design', weight: 40 },
      { channelId: 'devops', weight: 20 },
      { channelId: 'security', weight: 20 },
      { channelId: 'database', weight: 20 }
    ],
    prerequisites: ['gcp-ace']
  },

  // Azure Certifications
  {
    id: 'az-900',
    name: 'Azure Fundamentals',
    provider: 'Microsoft',
    description: 'Cloud concepts and Azure services fundamentals. Great starting point for Azure journey.',
    icon: 'cloud',
    color: 'text-sky-500',
    difficulty: 'beginner',
    category: 'cloud',
    estimatedHours: 20,
    examCode: 'AZ-900',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-fundamentals/',
    channelMappings: [
      { channelId: 'system-design', weight: 40 },
      { channelId: 'networking', weight: 30 },
      { channelId: 'security', weight: 30 }
    ]
  },
  {
    id: 'az-104',
    name: 'Azure Administrator Associate',
    provider: 'Microsoft',
    description: 'Manage Azure identities, governance, storage, compute, and virtual networks.',
    icon: 'server',
    color: 'text-sky-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 45,
    examCode: 'AZ-104',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-administrator/',
    channelMappings: [
      { channelId: 'devops', weight: 30 },
      { channelId: 'networking', weight: 25 },
      { channelId: 'security', weight: 25 },
      { channelId: 'linux', weight: 20 }
    ],
    prerequisites: ['az-900']
  },
  {
    id: 'az-305',
    name: 'Azure Solutions Architect Expert',
    provider: 'Microsoft',
    description: 'Design solutions on Azure. Identity, governance, data, applications, and infrastructure.',
    icon: 'cpu',
    color: 'text-sky-600',
    difficulty: 'expert',
    category: 'cloud',
    estimatedHours: 70,
    examCode: 'AZ-305',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-solutions-architect/',
    channelMappings: [
      { channelId: 'system-design', weight: 40 },
      { channelId: 'security', weight: 25 },
      { channelId: 'database', weight: 20 },
      { channelId: 'networking', weight: 15 }
    ],
    prerequisites: ['az-104']
  },

  // Security Certifications
  {
    id: 'comptia-security-plus',
    name: 'CompTIA Security+',
    provider: 'CompTIA',
    description: 'Foundational cybersecurity skills. Threats, vulnerabilities, cryptography, and risk management.',
    icon: 'shield',
    color: 'text-red-500',
    difficulty: 'intermediate',
    category: 'security',
    estimatedHours: 50,
    examCode: 'SY0-701',
    officialUrl: 'https://www.comptia.org/certifications/security',
    channelMappings: [
      { channelId: 'security', weight: 60 },
      { channelId: 'networking', weight: 25 },
      { channelId: 'linux', weight: 15 }
    ]
  },
  {
    id: 'aws-security',
    name: 'AWS Security Specialty',
    provider: 'Amazon Web Services',
    description: 'Secure AWS workloads. IAM, encryption, logging, incident response, and compliance.',
    icon: 'shield',
    color: 'text-orange-500',
    difficulty: 'advanced',
    category: 'security',
    estimatedHours: 60,
    examCode: 'SCS-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-security-specialty/',
    channelMappings: [
      { channelId: 'aws', weight: 40 },
      { channelId: 'security', weight: 40 },
      { channelId: 'networking', weight: 20 }
    ],
    prerequisites: ['aws-saa']
  },

  // Data & AI Certifications
  {
    id: 'aws-data-engineer',
    name: 'AWS Data Engineer Associate',
    provider: 'Amazon Web Services',
    description: 'Design and implement data pipelines on AWS. Glue, Redshift, Kinesis, and Lake Formation.',
    icon: 'database',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'data',
    estimatedHours: 45,
    examCode: 'DEA-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-data-engineer-associate/',
    channelMappings: [
      { channelId: 'aws', weight: 35 },
      { channelId: 'data-engineering', weight: 35 },
      { channelId: 'database', weight: 30 }
    ]
  },
  {
    id: 'aws-ml-specialty',
    name: 'AWS Machine Learning Specialty',
    provider: 'Amazon Web Services',
    description: 'Build, train, and deploy ML models on AWS. SageMaker, feature engineering, and MLOps.',
    icon: 'brain',
    color: 'text-orange-500',
    difficulty: 'advanced',
    category: 'ai',
    estimatedHours: 60,
    examCode: 'MLS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/',
    channelMappings: [
      { channelId: 'machine-learning', weight: 40 },
      { channelId: 'aws', weight: 30 },
      { channelId: 'data-engineering', weight: 20 },
      { channelId: 'python', weight: 10 }
    ]
  },

  // Linux & DevOps
  {
    id: 'linux-plus',
    name: 'CompTIA Linux+',
    provider: 'CompTIA',
    description: 'Linux system administration. Command line, scripting, security, and troubleshooting.',
    icon: 'terminal',
    color: 'text-yellow-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 40,
    examCode: 'XK0-005',
    officialUrl: 'https://www.comptia.org/certifications/linux',
    channelMappings: [
      { channelId: 'linux', weight: 50 },
      { channelId: 'operating-systems', weight: 25 },
      { channelId: 'networking', weight: 15 },
      { channelId: 'security', weight: 10 }
    ]
  },
  {
    id: 'rhcsa',
    name: 'Red Hat Certified System Administrator',
    provider: 'Red Hat',
    description: 'Core system administration skills for Red Hat Enterprise Linux environments.',
    icon: 'terminal',
    color: 'text-red-600',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 50,
    examCode: 'EX200',
    officialUrl: 'https://www.redhat.com/en/services/certification/rhcsa',
    channelMappings: [
      { channelId: 'linux', weight: 55 },
      { channelId: 'operating-systems', weight: 25 },
      { channelId: 'networking', weight: 20 }
    ]
  },

  // Development
  {
    id: 'psd',
    name: 'Professional Scrum Developer',
    provider: 'Scrum.org',
    description: 'Agile software development practices. TDD, CI/CD, and working in Scrum teams.',
    icon: 'users',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'development',
    estimatedHours: 25,
    examCode: 'PSD I',
    officialUrl: 'https://www.scrum.org/professional-scrum-developer-certification',
    channelMappings: [
      { channelId: 'testing', weight: 30 },
      { channelId: 'devops', weight: 30 },
      { channelId: 'backend', weight: 20 },
      { channelId: 'behavioral', weight: 20 }
    ]
  },

  // Database
  {
    id: 'aws-database',
    name: 'AWS Database Specialty',
    provider: 'Amazon Web Services',
    description: 'Design and maintain AWS database solutions. RDS, DynamoDB, Aurora, and migrations.',
    icon: 'database',
    color: 'text-orange-500',
    difficulty: 'advanced',
    category: 'data',
    estimatedHours: 50,
    examCode: 'DBS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-database-specialty/',
    channelMappings: [
      { channelId: 'database', weight: 45 },
      { channelId: 'aws', weight: 35 },
      { channelId: 'system-design', weight: 20 }
    ],
    prerequisites: ['aws-saa']
  },

  // Networking
  {
    id: 'ccna',
    name: 'Cisco CCNA',
    provider: 'Cisco',
    description: 'Network fundamentals, IP connectivity, security, and automation.',
    icon: 'network',
    color: 'text-cyan-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 60,
    examCode: '200-301',
    officialUrl: 'https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html',
    channelMappings: [
      { channelId: 'networking', weight: 70 },
      { channelId: 'security', weight: 20 },
      { channelId: 'linux', weight: 10 }
    ]
  },
  {
    id: 'aws-networking',
    name: 'AWS Advanced Networking Specialty',
    provider: 'Amazon Web Services',
    description: 'Design and implement AWS network architectures. VPC, Direct Connect, and hybrid connectivity.',
    icon: 'network',
    color: 'text-orange-500',
    difficulty: 'advanced',
    category: 'cloud',
    estimatedHours: 55,
    examCode: 'ANS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-advanced-networking-specialty/',
    channelMappings: [
      { channelId: 'aws', weight: 40 },
      { channelId: 'networking', weight: 40 },
      { channelId: 'security', weight: 20 }
    ],
    prerequisites: ['aws-saa']
  }
];

// Certification categories for filtering
export const certificationCategories = [
  { id: 'cloud', name: 'Cloud', icon: 'cloud' },
  { id: 'devops', name: 'DevOps', icon: 'infinity' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'data', name: 'Data', icon: 'database' },
  { id: 'ai', name: 'AI & ML', icon: 'brain' },
  { id: 'development', name: 'Development', icon: 'code' },
  { id: 'management', name: 'Management', icon: 'users' }
];

// Certification providers for filtering
export const certificationProviders = [
  { id: 'aws', name: 'Amazon Web Services', color: 'text-orange-500' },
  { id: 'google', name: 'Google Cloud', color: 'text-blue-500' },
  { id: 'microsoft', name: 'Microsoft', color: 'text-sky-500' },
  { id: 'cncf', name: 'CNCF', color: 'text-blue-400' },
  { id: 'hashicorp', name: 'HashiCorp', color: 'text-purple-500' },
  { id: 'comptia', name: 'CompTIA', color: 'text-red-500' },
  { id: 'cisco', name: 'Cisco', color: 'text-cyan-500' },
  { id: 'redhat', name: 'Red Hat', color: 'text-red-600' },
  { id: 'scrum', name: 'Scrum.org', color: 'text-blue-500' }
];

// Helper functions
export function getCertificationById(id: string): CertificationConfig | undefined {
  return certificationsConfig.find(cert => cert.id === id);
}

export function getCertificationsByCategory(category: string): CertificationConfig[] {
  return certificationsConfig.filter(cert => cert.category === category);
}

export function getCertificationsByProvider(provider: string): CertificationConfig[] {
  return certificationsConfig.filter(cert => 
    cert.provider.toLowerCase().includes(provider.toLowerCase())
  );
}

export function getCertificationsByDifficulty(difficulty: string): CertificationConfig[] {
  return certificationsConfig.filter(cert => cert.difficulty === difficulty);
}

export function getPrerequisiteCertifications(certId: string): CertificationConfig[] {
  const cert = getCertificationById(certId);
  if (!cert?.prerequisites) return [];
  return cert.prerequisites
    .map(id => getCertificationById(id))
    .filter((c): c is CertificationConfig => c !== undefined);
}

export function getCertificationsRequiring(certId: string): CertificationConfig[] {
  return certificationsConfig.filter(cert => 
    cert.prerequisites?.includes(certId)
  );
}
