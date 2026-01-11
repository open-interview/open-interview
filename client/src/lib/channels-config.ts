// All available channels with metadata
export interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'engineering' | 'data' | 'cloud' | 'security' | 'management' | 'mobile' | 'ai' | 'testing' | 'fundamentals' | 'certification';
  roles: string[]; // Which roles this channel is recommended for
  isCertification?: boolean; // Whether this is a certification prep channel
}

export const allChannelsConfig: ChannelConfig[] = [
  // ==========================================
  // CS FUNDAMENTALS (from coding-interview-university)
  // ==========================================
  {
    id: 'data-structures',
    name: 'Data Structures',
    description: 'Arrays, linked lists, stacks, queues, trees & hash tables',
    icon: 'boxes',
    color: 'text-emerald-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer', 'ml-engineer']
  },
  {
    id: 'complexity-analysis',
    name: 'Complexity Analysis',
    description: 'Big-O notation, time & space complexity, amortized analysis',
    icon: 'chart-line',
    color: 'text-blue-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer', 'ml-engineer']
  },
  {
    id: 'dynamic-programming',
    name: 'Dynamic Programming',
    description: 'Recursion, memoization, tabulation & optimization',
    icon: 'git-branch',
    color: 'text-violet-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer', 'ml-engineer']
  },
  {
    id: 'bit-manipulation',
    name: 'Bit Manipulation',
    description: 'Bitwise operations, binary math & bit tricks',
    icon: 'binary',
    color: 'text-cyan-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'mobile', 'security']
  },
  {
    id: 'design-patterns',
    name: 'Design Patterns',
    description: 'Creational, structural, behavioral patterns & SOLID',
    icon: 'puzzle',
    color: 'text-amber-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'architect']
  },
  {
    id: 'concurrency',
    name: 'Concurrency',
    description: 'Threads, locks, parallelism, deadlocks & synchronization',
    icon: 'git-merge',
    color: 'text-rose-500',
    category: 'fundamentals',
    roles: ['backend', 'fullstack', 'sre', 'platform', 'mobile']
  },
  {
    id: 'math-logic',
    name: 'Math & Logic',
    description: 'Combinatorics, probability, number theory & discrete math',
    icon: 'calculator',
    color: 'text-indigo-500',
    category: 'fundamentals',
    roles: ['backend', 'data-scientist', 'ml-engineer', 'data-engineer']
  },
  {
    id: 'low-level',
    name: 'Low-Level Programming',
    description: 'Memory management, compilers, CPU & garbage collection',
    icon: 'cpu',
    color: 'text-slate-500',
    category: 'fundamentals',
    roles: ['backend', 'sre', 'platform', 'security']
  },

  // ==========================================
  // Engineering Channels
  // ==========================================
  {
    id: 'system-design',
    name: 'System Design',
    description: 'Scalable architecture patterns & distributed systems',
    icon: 'cpu',
    color: 'text-cyan-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'architect', 'sre', 'devops']
  },
  {
    id: 'algorithms',
    name: 'Algorithms',
    description: 'Data structures, sorting, searching & optimization',
    icon: 'terminal',
    color: 'text-green-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer']
  },
  {
    id: 'frontend',
    name: 'Frontend',
    description: 'React, Vue, CSS, Performance & Web APIs',
    icon: 'layout',
    color: 'text-purple-500',
    category: 'engineering',
    roles: ['frontend', 'fullstack', 'mobile']
  },
  {
    id: 'backend',
    name: 'Backend',
    description: 'APIs, microservices, caching & server architecture',
    icon: 'server',
    color: 'text-blue-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'architect']
  },
  {
    id: 'database',
    name: 'Database',
    description: 'SQL, NoSQL, indexing & query optimization',
    icon: 'database',
    color: 'text-yellow-500',
    category: 'engineering',
    roles: ['backend', 'fullstack', 'data-engineer', 'dba']
  },
  
  // DevOps & Cloud
  {
    id: 'devops',
    name: 'DevOps',
    description: 'CI/CD, automation, containers & orchestration',
    icon: 'infinity',
    color: 'text-orange-500',
    category: 'cloud',
    roles: ['devops', 'sre', 'backend', 'platform']
  },
  {
    id: 'sre',
    name: 'SRE',
    description: 'Reliability, monitoring, incident response & SLOs',
    icon: 'activity',
    color: 'text-red-500',
    category: 'cloud',
    roles: ['sre', 'devops', 'platform']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration, pods, services & deployments',
    icon: 'box',
    color: 'text-blue-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'platform', 'backend']
  },
  {
    id: 'aws',
    name: 'AWS',
    description: 'EC2, S3, Lambda, RDS & cloud architecture',
    icon: 'cloud',
    color: 'text-orange-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'backend', 'architect', 'platform']
  },
  {
    id: 'terraform',
    name: 'Terraform',
    description: 'Infrastructure as Code, modules & state management',
    icon: 'layers',
    color: 'text-purple-400',
    category: 'cloud',
    roles: ['devops', 'sre', 'platform']
  },
  
  // Data & AI
  {
    id: 'data-engineering',
    name: 'Data Engineering',
    description: 'ETL, data pipelines, warehousing & streaming',
    icon: 'workflow',
    color: 'text-teal-500',
    category: 'data',
    roles: ['data-engineer', 'backend', 'ml-engineer']
  },
  {
    id: 'machine-learning',
    name: 'Machine Learning',
    description: 'ML algorithms, model training & deployment',
    icon: 'brain',
    color: 'text-pink-500',
    category: 'ai',
    roles: ['ml-engineer', 'data-scientist', 'ai-engineer']
  },
  {
    id: 'generative-ai',
    name: 'Generative AI',
    description: 'LLMs, RAG, fine-tuning, agents & prompt engineering',
    icon: 'sparkles',
    color: 'text-violet-500',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'backend']
  },
  {
    id: 'prompt-engineering',
    name: 'Prompt Engineering',
    description: 'Prompt design, optimization, safety & structured outputs',
    icon: 'message-circle',
    color: 'text-cyan-400',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'product']
  },
  {
    id: 'llm-ops',
    name: 'LLMOps',
    description: 'LLM deployment, optimization, monitoring & infrastructure',
    icon: 'server',
    color: 'text-orange-400',
    category: 'ai',
    roles: ['ai-engineer', 'ml-engineer', 'devops', 'sre']
  },
  {
    id: 'computer-vision',
    name: 'Computer Vision',
    description: 'Image classification, object detection & multimodal AI',
    icon: 'eye',
    color: 'text-blue-400',
    category: 'ai',
    roles: ['ml-engineer', 'ai-engineer', 'data-scientist']
  },
  {
    id: 'nlp',
    name: 'NLP',
    description: 'Text processing, embeddings, transformers & language models',
    icon: 'file-text',
    color: 'text-emerald-400',
    category: 'ai',
    roles: ['ml-engineer', 'ai-engineer', 'data-scientist']
  },
  {
    id: 'python',
    name: 'Python',
    description: 'Python fundamentals, libraries & best practices',
    icon: 'code',
    color: 'text-yellow-400',
    category: 'engineering',
    roles: ['backend', 'data-engineer', 'ml-engineer', 'data-scientist']
  },
  
  // Security
  {
    id: 'security',
    name: 'Security',
    description: 'Application security, OWASP, encryption & auth',
    icon: 'shield',
    color: 'text-red-400',
    category: 'security',
    roles: ['security', 'backend', 'fullstack', 'devops']
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'TCP/IP, DNS, load balancing & CDN',
    icon: 'network',
    color: 'text-indigo-500',
    category: 'engineering',
    roles: ['sre', 'devops', 'security', 'backend']
  },
  {
    id: 'operating-systems',
    name: 'Operating Systems',
    description: 'OS concepts, processes, memory & file systems',
    icon: 'monitor',
    color: 'text-slate-500',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform']
  },
  {
    id: 'linux',
    name: 'Linux',
    description: 'Linux administration, shell scripting & system tools',
    icon: 'terminal',
    color: 'text-yellow-600',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform', 'data-engineer']
  },
  {
    id: 'unix',
    name: 'Unix',
    description: 'Unix fundamentals, commands & system programming',
    icon: 'terminal',
    color: 'text-gray-500',
    category: 'engineering',
    roles: ['backend', 'sre', 'devops', 'security', 'platform']
  },
  
  // Mobile
  {
    id: 'ios',
    name: 'iOS',
    description: 'Swift, UIKit, SwiftUI & iOS architecture',
    icon: 'smartphone',
    color: 'text-gray-400',
    category: 'mobile',
    roles: ['mobile', 'ios']
  },
  {
    id: 'android',
    name: 'Android',
    description: 'Kotlin, Jetpack Compose & Android architecture',
    icon: 'smartphone',
    color: 'text-green-400',
    category: 'mobile',
    roles: ['mobile', 'android']
  },
  {
    id: 'react-native',
    name: 'React Native',
    description: 'Cross-platform mobile development with React',
    icon: 'smartphone',
    color: 'text-cyan-400',
    category: 'mobile',
    roles: ['mobile', 'frontend', 'fullstack']
  },
  
  // Testing & QA
  {
    id: 'testing',
    name: 'Testing',
    description: 'Unit testing, integration testing, TDD & test strategies',
    icon: 'check-circle',
    color: 'text-green-500',
    category: 'testing',
    roles: ['frontend', 'backend', 'fullstack', 'mobile', 'qa']
  },
  {
    id: 'e2e-testing',
    name: 'E2E Testing',
    description: 'Playwright, Cypress, Selenium & browser automation',
    icon: 'monitor',
    color: 'text-purple-500',
    category: 'testing',
    roles: ['frontend', 'fullstack', 'qa', 'sdet']
  },
  {
    id: 'api-testing',
    name: 'API Testing',
    description: 'REST API testing, contract testing & load testing',
    icon: 'zap',
    color: 'text-yellow-500',
    category: 'testing',
    roles: ['backend', 'fullstack', 'qa', 'sdet']
  },
  {
    id: 'performance-testing',
    name: 'Performance Testing',
    description: 'Load testing, stress testing, JMeter & k6',
    icon: 'gauge',
    color: 'text-orange-500',
    category: 'testing',
    roles: ['sre', 'backend', 'qa', 'sdet', 'devops']
  },

  // Management & Soft Skills
  {
    id: 'engineering-management',
    name: 'Engineering Management',
    description: 'Team leadership, 1:1s, hiring & project management',
    icon: 'users',
    color: 'text-amber-500',
    category: 'management',
    roles: ['manager', 'tech-lead', 'architect']
  },
  {
    id: 'behavioral',
    name: 'Behavioral',
    description: 'STAR method, leadership principles & soft skills',
    icon: 'message-circle',
    color: 'text-emerald-500',
    category: 'management',
    roles: ['all'] // Recommended for everyone
  },

  // ==========================================
  // AWS Certifications
  // ==========================================
  {
    id: 'aws-saa',
    name: 'AWS Solutions Architect Associate',
    description: 'SAA-C03 exam prep: architecture, security, resilience & cost optimization',
    icon: 'cloud',
    color: 'text-orange-500',
    category: 'certification',
    roles: ['architect', 'backend', 'devops', 'sre'],
    isCertification: true
  },
  {
    id: 'aws-sap',
    name: 'AWS Solutions Architect Professional',
    description: 'SAP-C02 exam prep: advanced architecture, migrations & organizational complexity',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['architect', 'backend', 'devops', 'sre'],
    isCertification: true
  },
  {
    id: 'aws-dva',
    name: 'AWS Developer Associate',
    description: 'DVA-C02 exam prep: development, deployment, security & troubleshooting',
    icon: 'cloud',
    color: 'text-orange-400',
    category: 'certification',
    roles: ['backend', 'fullstack', 'devops'],
    isCertification: true
  },
  {
    id: 'aws-sysops',
    name: 'AWS SysOps Administrator',
    description: 'SOA-C02 exam prep: monitoring, reliability, deployment & security',
    icon: 'cloud',
    color: 'text-orange-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'aws-devops-pro',
    name: 'AWS DevOps Engineer Professional',
    description: 'DOP-C02 exam prep: SDLC automation, IaC, monitoring & incident response',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'aws-data-engineer',
    name: 'AWS Data Engineer Associate',
    description: 'DEA-C01 exam prep: data ingestion, transformation, storage & governance',
    icon: 'cloud',
    color: 'text-orange-500',
    category: 'certification',
    roles: ['data-engineer', 'backend'],
    isCertification: true
  },
  {
    id: 'aws-ml-specialty',
    name: 'AWS Machine Learning Specialty',
    description: 'MLS-C01 exam prep: data engineering, modeling & ML implementation',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['ml-engineer', 'data-scientist', 'ai-engineer'],
    isCertification: true
  },
  {
    id: 'aws-security-specialty',
    name: 'AWS Security Specialty',
    description: 'SCS-C02 exam prep: threat detection, infrastructure & data protection',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['security', 'devops', 'sre'],
    isCertification: true
  },
  {
    id: 'aws-database-specialty',
    name: 'AWS Database Specialty',
    description: 'DBS-C01 exam prep: database design, migration, operations & security',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['backend', 'data-engineer', 'dba'],
    isCertification: true
  },
  {
    id: 'aws-networking-specialty',
    name: 'AWS Networking Specialty',
    description: 'ANS-C01 exam prep: network design, implementation & security',
    icon: 'cloud',
    color: 'text-orange-600',
    category: 'certification',
    roles: ['sre', 'devops', 'security'],
    isCertification: true
  },
  {
    id: 'aws-ai-practitioner',
    name: 'AWS AI Practitioner',
    description: 'AIF-C01 exam prep: AI/ML fundamentals, generative AI & responsible AI',
    icon: 'cloud',
    color: 'text-orange-400',
    category: 'certification',
    roles: ['ai-engineer', 'ml-engineer', 'backend', 'fullstack'],
    isCertification: true
  },

  // ==========================================
  // Kubernetes Certifications
  // ==========================================
  {
    id: 'cka',
    name: 'CKA - Kubernetes Administrator',
    description: 'CKA exam prep: cluster architecture, workloads, networking & troubleshooting',
    icon: 'box',
    color: 'text-blue-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'ckad',
    name: 'CKAD - Kubernetes Developer',
    description: 'CKAD exam prep: application design, deployment, observability & networking',
    icon: 'box',
    color: 'text-blue-400',
    category: 'certification',
    roles: ['backend', 'fullstack', 'devops'],
    isCertification: true
  },
  {
    id: 'cks',
    name: 'CKS - Kubernetes Security',
    description: 'CKS exam prep: cluster hardening, supply chain security & runtime security',
    icon: 'box',
    color: 'text-blue-600',
    category: 'certification',
    roles: ['security', 'devops', 'sre'],
    isCertification: true
  },
  {
    id: 'kcna',
    name: 'KCNA - Kubernetes Cloud Native',
    description: 'KCNA exam prep: K8s fundamentals, cloud native architecture & observability',
    icon: 'box',
    color: 'text-blue-300',
    category: 'certification',
    roles: ['backend', 'fullstack', 'devops', 'sre'],
    isCertification: true
  },

  // ==========================================
  // HashiCorp Certifications
  // ==========================================
  {
    id: 'terraform-associate',
    name: 'Terraform Associate',
    description: 'HashiCorp exam prep: IaC concepts, state management, modules & Terraform Cloud',
    icon: 'layers',
    color: 'text-purple-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'vault-associate',
    name: 'Vault Associate',
    description: 'HashiCorp exam prep: secrets management, auth methods, policies & encryption',
    icon: 'lock',
    color: 'text-purple-500',
    category: 'certification',
    roles: ['security', 'devops', 'sre'],
    isCertification: true
  },
  {
    id: 'consul-associate',
    name: 'Consul Associate',
    description: 'HashiCorp exam prep: service discovery, service mesh & Consul operations',
    icon: 'network',
    color: 'text-purple-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },

  // ==========================================
  // Google Cloud Certifications
  // ==========================================
  {
    id: 'gcp-cloud-engineer',
    name: 'GCP Associate Cloud Engineer',
    description: 'GCP exam prep: cloud setup, deployment, operations & security',
    icon: 'cloud',
    color: 'text-blue-500',
    category: 'certification',
    roles: ['devops', 'sre', 'backend'],
    isCertification: true
  },
  {
    id: 'gcp-cloud-architect',
    name: 'GCP Professional Cloud Architect',
    description: 'GCP exam prep: solution design, security, reliability & implementation',
    icon: 'cloud',
    color: 'text-blue-600',
    category: 'certification',
    roles: ['architect', 'backend', 'devops'],
    isCertification: true
  },
  {
    id: 'gcp-data-engineer',
    name: 'GCP Professional Data Engineer',
    description: 'GCP exam prep: data processing, storage, analysis & automation',
    icon: 'cloud',
    color: 'text-blue-500',
    category: 'certification',
    roles: ['data-engineer', 'backend'],
    isCertification: true
  },
  {
    id: 'gcp-ml-engineer',
    name: 'GCP Professional ML Engineer',
    description: 'GCP exam prep: ML architecture, model serving, pipelines & monitoring',
    icon: 'cloud',
    color: 'text-blue-600',
    category: 'certification',
    roles: ['ml-engineer', 'data-scientist', 'ai-engineer'],
    isCertification: true
  },
  {
    id: 'gcp-devops-engineer',
    name: 'GCP Professional DevOps Engineer',
    description: 'GCP exam prep: CI/CD, SRE practices, monitoring & performance',
    icon: 'cloud',
    color: 'text-blue-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'gcp-security-engineer',
    name: 'GCP Professional Security Engineer',
    description: 'GCP exam prep: access management, network security & data protection',
    icon: 'cloud',
    color: 'text-blue-600',
    category: 'certification',
    roles: ['security', 'devops', 'sre'],
    isCertification: true
  },

  // ==========================================
  // Azure Certifications
  // ==========================================
  {
    id: 'azure-fundamentals',
    name: 'Azure Fundamentals (AZ-900)',
    description: 'Azure exam prep: cloud concepts, architecture, management & pricing',
    icon: 'cloud',
    color: 'text-cyan-500',
    category: 'certification',
    roles: ['backend', 'fullstack', 'devops'],
    isCertification: true
  },
  {
    id: 'azure-administrator',
    name: 'Azure Administrator (AZ-104)',
    description: 'Azure exam prep: identities, storage, compute, networking & monitoring',
    icon: 'cloud',
    color: 'text-cyan-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'azure-developer',
    name: 'Azure Developer (AZ-204)',
    description: 'Azure exam prep: compute, storage, security & API management',
    icon: 'cloud',
    color: 'text-cyan-500',
    category: 'certification',
    roles: ['backend', 'fullstack'],
    isCertification: true
  },
  {
    id: 'azure-solutions-architect',
    name: 'Azure Solutions Architect (AZ-305)',
    description: 'Azure exam prep: identity, data storage, business continuity & infrastructure',
    icon: 'cloud',
    color: 'text-cyan-600',
    category: 'certification',
    roles: ['architect', 'backend', 'devops'],
    isCertification: true
  },
  {
    id: 'azure-devops-engineer',
    name: 'Azure DevOps Engineer (AZ-400)',
    description: 'Azure exam prep: source control, CI/CD pipelines, security & instrumentation',
    icon: 'cloud',
    color: 'text-cyan-500',
    category: 'certification',
    roles: ['devops', 'sre', 'platform'],
    isCertification: true
  },
  {
    id: 'azure-data-engineer',
    name: 'Azure Data Engineer (DP-203)',
    description: 'Azure exam prep: data storage, processing, security & integration',
    icon: 'cloud',
    color: 'text-cyan-500',
    category: 'certification',
    roles: ['data-engineer', 'backend'],
    isCertification: true
  },
  {
    id: 'azure-ai-engineer',
    name: 'Azure AI Engineer (AI-102)',
    description: 'Azure exam prep: computer vision, NLP, knowledge mining & generative AI',
    icon: 'cloud',
    color: 'text-cyan-600',
    category: 'certification',
    roles: ['ai-engineer', 'ml-engineer'],
    isCertification: true
  },
  {
    id: 'azure-security-engineer',
    name: 'Azure Security Engineer (AZ-500)',
    description: 'Azure exam prep: identity, networking, compute & security operations',
    icon: 'cloud',
    color: 'text-cyan-600',
    category: 'certification',
    roles: ['security', 'devops', 'sre'],
    isCertification: true
  },

  // ==========================================
  // Linux & DevOps Certifications
  // ==========================================
  {
    id: 'linux-foundation-sysadmin',
    name: 'Linux Foundation Sysadmin (LFCS)',
    description: 'LFCS exam prep: essential commands, networking, services & storage',
    icon: 'terminal',
    color: 'text-yellow-600',
    category: 'certification',
    roles: ['sre', 'devops', 'platform'],
    isCertification: true
  },
  {
    id: 'rhcsa',
    name: 'Red Hat Certified System Admin',
    description: 'RHCSA exam prep: essential tools, storage, file systems & security',
    icon: 'terminal',
    color: 'text-red-500',
    category: 'certification',
    roles: ['sre', 'devops', 'platform'],
    isCertification: true
  },
  {
    id: 'docker-dca',
    name: 'Docker Certified Associate',
    description: 'DCA exam prep: orchestration, images, networking, security & storage',
    icon: 'box',
    color: 'text-blue-400',
    category: 'certification',
    roles: ['devops', 'sre', 'backend'],
    isCertification: true
  },

  // ==========================================
  // Data & Analytics Certifications
  // ==========================================
  {
    id: 'databricks-data-engineer',
    name: 'Databricks Data Engineer Associate',
    description: 'Databricks exam prep: Lakehouse, Spark SQL, incremental processing & pipelines',
    icon: 'database',
    color: 'text-red-500',
    category: 'certification',
    roles: ['data-engineer', 'backend'],
    isCertification: true
  },
  {
    id: 'snowflake-core',
    name: 'Snowflake SnowPro Core',
    description: 'Snowflake exam prep: security, performance, data loading & transformation',
    icon: 'database',
    color: 'text-cyan-400',
    category: 'certification',
    roles: ['data-engineer', 'backend'],
    isCertification: true
  },
  {
    id: 'dbt-analytics-engineer',
    name: 'dbt Analytics Engineer',
    description: 'dbt exam prep: fundamentals, data modeling, testing & deployment',
    icon: 'database',
    color: 'text-orange-400',
    category: 'certification',
    roles: ['data-engineer', 'data-scientist'],
    isCertification: true
  },

  // ==========================================
  // Security Certifications
  // ==========================================
  {
    id: 'comptia-security-plus',
    name: 'CompTIA Security+',
    description: 'Security+ exam prep: threats, architecture, implementation & compliance',
    icon: 'shield',
    color: 'text-red-500',
    category: 'certification',
    roles: ['security', 'backend', 'devops'],
    isCertification: true
  },
  {
    id: 'cissp',
    name: 'CISSP',
    description: 'CISSP exam prep: security management, architecture, networking & operations',
    icon: 'shield',
    color: 'text-red-600',
    category: 'certification',
    roles: ['security', 'architect'],
    isCertification: true
  },

  // ==========================================
  // AI/ML Certifications
  // ==========================================
  {
    id: 'tensorflow-developer',
    name: 'TensorFlow Developer Certificate',
    description: 'TensorFlow exam prep: neural networks, image classification, NLP & time series',
    icon: 'brain',
    color: 'text-orange-500',
    category: 'certification',
    roles: ['ml-engineer', 'ai-engineer', 'data-scientist'],
    isCertification: true
  }
];

// User roles with display names
export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const rolesConfig: RoleConfig[] = [
  { id: 'frontend', name: 'Frontend Engineer', description: 'React, Vue, CSS, Web Performance', icon: 'layout' },
  { id: 'backend', name: 'Backend Engineer', description: 'APIs, Databases, Server Architecture', icon: 'server' },
  { id: 'fullstack', name: 'Full Stack Engineer', description: 'End-to-end web development', icon: 'layers' },
  { id: 'mobile', name: 'Mobile Engineer', description: 'iOS, Android, React Native', icon: 'smartphone' },
  { id: 'devops', name: 'DevOps Engineer', description: 'CI/CD, Infrastructure, Automation', icon: 'infinity' },
  { id: 'sre', name: 'Site Reliability Engineer', description: 'Reliability, Monitoring, Incident Response', icon: 'activity' },
  { id: 'data-engineer', name: 'Data Engineer', description: 'ETL, Data Pipelines, Warehousing', icon: 'workflow' },
  { id: 'ml-engineer', name: 'ML Engineer', description: 'Machine Learning, Model Deployment', icon: 'brain' },
  { id: 'ai-engineer', name: 'AI Engineer', description: 'GenAI, LLMs, RAG, Prompt Engineering', icon: 'sparkles' },
  { id: 'data-scientist', name: 'Data Scientist', description: 'ML, Statistics, Data Analysis', icon: 'chart' },
  { id: 'security', name: 'Security Engineer', description: 'AppSec, Penetration Testing, Compliance', icon: 'shield' },
  { id: 'architect', name: 'Solutions Architect', description: 'System Design, Cloud Architecture', icon: 'cpu' },
  { id: 'manager', name: 'Engineering Manager', description: 'Team Leadership, Hiring, Strategy', icon: 'users' },
  { id: 'platform', name: 'Platform Engineer', description: 'Developer Experience, Internal Tools', icon: 'box' },
  { id: 'qa', name: 'QA Engineer', description: 'Testing, Quality Assurance, Test Automation', icon: 'check-circle' },
  { id: 'sdet', name: 'SDET', description: 'Software Development Engineer in Test', icon: 'code' }
];

// Get recommended channels for a role
export function getRecommendedChannels(roleId: string): ChannelConfig[] {
  return allChannelsConfig.filter(
    channel => channel.roles.includes(roleId) || channel.roles.includes('all')
  );
}

// Get channels by category
export function getChannelsByCategory(category: string): ChannelConfig[] {
  return allChannelsConfig.filter(channel => channel.category === category);
}

// Categories for grouping
export const categories = [
  { id: 'fundamentals', name: 'CS Fundamentals', icon: 'book-open' },
  { id: 'engineering', name: 'Engineering', icon: 'code' },
  { id: 'cloud', name: 'Cloud & DevOps', icon: 'cloud' },
  { id: 'data', name: 'Data', icon: 'database' },
  { id: 'ai', name: 'AI & ML', icon: 'brain' },
  { id: 'testing', name: 'Testing & QA', icon: 'check-circle' },
  { id: 'security', name: 'Security', icon: 'shield' },
  { id: 'mobile', name: 'Mobile', icon: 'smartphone' },
  { id: 'management', name: 'Management', icon: 'users' },
  { id: 'certification', name: 'Certifications', icon: 'award' }
];

// Get certification channels
export function getCertificationChannels(): ChannelConfig[] {
  return allChannelsConfig.filter(channel => channel.isCertification === true);
}

// Get certification channels by provider
export function getCertificationsByProvider(provider: 'aws' | 'gcp' | 'azure' | 'kubernetes' | 'hashicorp' | 'linux' | 'data' | 'security' | 'ai'): ChannelConfig[] {
  const prefixes: Record<string, string[]> = {
    aws: ['aws-'],
    gcp: ['gcp-'],
    azure: ['azure-'],
    kubernetes: ['cka', 'ckad', 'cks', 'kcna'],
    hashicorp: ['terraform-', 'vault-', 'consul-'],
    linux: ['linux-', 'rhcsa', 'docker-'],
    data: ['databricks-', 'snowflake-', 'dbt-'],
    security: ['comptia-', 'cissp'],
    ai: ['tensorflow-']
  };
  
  const patterns = prefixes[provider] || [];
  return allChannelsConfig.filter(channel => 
    channel.isCertification && patterns.some(p => channel.id.startsWith(p) || channel.id === p)
  );
}
