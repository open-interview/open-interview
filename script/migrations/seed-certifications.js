#!/usr/bin/env node
/**
 * Seed Certifications Table
 * 
 * Creates the certifications table and populates it with all certification tracks.
 * This makes certifications dynamic and manageable from the database.
 */

import { dbClient } from '../utils.js';
import { certificationDomains } from '../ai/prompts/templates/certification-question.js';

// Create certifications table
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS certifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT DEFAULT 'award',
  color TEXT DEFAULT 'text-primary',
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  estimated_hours INTEGER DEFAULT 40,
  exam_code TEXT,
  official_url TEXT,
  domains TEXT,
  channel_mappings TEXT,
  tags TEXT,
  prerequisites TEXT,
  status TEXT DEFAULT 'active',
  question_count INTEGER DEFAULT 0,
  passing_score INTEGER DEFAULT 70,
  exam_duration INTEGER DEFAULT 90,
  created_at TEXT,
  last_updated TEXT
)`;

// All certifications data
const certificationsData = [
  // ==========================================
  // AWS Certifications
  // ==========================================
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
    passingScore: 72,
    examDuration: 130
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
    prerequisites: ['aws-saa'],
    passingScore: 75,
    examDuration: 180
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
    passingScore: 72,
    examDuration: 130
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
    passingScore: 72,
    examDuration: 130
  },
  {
    id: 'aws-devops-pro',
    name: 'AWS DevOps Engineer Professional',
    provider: 'Amazon Web Services',
    description: 'Implement and manage continuous delivery systems on AWS. SDLC automation and IaC.',
    icon: 'infinity',
    color: 'text-orange-600',
    difficulty: 'expert',
    category: 'devops',
    estimatedHours: 70,
    examCode: 'DOP-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-devops-engineer-professional/',
    prerequisites: ['aws-dva', 'aws-sysops'],
    passingScore: 75,
    examDuration: 180
  },
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
    passingScore: 72,
    examDuration: 130
  },
  {
    id: 'aws-ml-specialty',
    name: 'AWS Machine Learning Specialty',
    provider: 'Amazon Web Services',
    description: 'Build, train, and deploy ML models on AWS. SageMaker, feature engineering, and MLOps.',
    icon: 'brain',
    color: 'text-orange-600',
    difficulty: 'advanced',
    category: 'ai',
    estimatedHours: 60,
    examCode: 'MLS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-machine-learning-specialty/',
    passingScore: 75,
    examDuration: 180
  },
  {
    id: 'aws-security-specialty',
    name: 'AWS Security Specialty',
    provider: 'Amazon Web Services',
    description: 'Secure AWS workloads. IAM, encryption, logging, incident response, and compliance.',
    icon: 'shield',
    color: 'text-orange-600',
    difficulty: 'advanced',
    category: 'security',
    estimatedHours: 60,
    examCode: 'SCS-C02',
    officialUrl: 'https://aws.amazon.com/certification/certified-security-specialty/',
    prerequisites: ['aws-saa'],
    passingScore: 75,
    examDuration: 170
  },
  {
    id: 'aws-database-specialty',
    name: 'AWS Database Specialty',
    provider: 'Amazon Web Services',
    description: 'Design and maintain AWS database solutions. RDS, DynamoDB, Aurora, and migrations.',
    icon: 'database',
    color: 'text-orange-600',
    difficulty: 'advanced',
    category: 'data',
    estimatedHours: 50,
    examCode: 'DBS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-database-specialty/',
    prerequisites: ['aws-saa'],
    passingScore: 75,
    examDuration: 180
  },
  {
    id: 'aws-networking-specialty',
    name: 'AWS Advanced Networking Specialty',
    provider: 'Amazon Web Services',
    description: 'Design and implement AWS network architectures. VPC, Direct Connect, and hybrid connectivity.',
    icon: 'network',
    color: 'text-orange-600',
    difficulty: 'advanced',
    category: 'cloud',
    estimatedHours: 55,
    examCode: 'ANS-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-advanced-networking-specialty/',
    prerequisites: ['aws-saa'],
    passingScore: 75,
    examDuration: 170
  },
  {
    id: 'aws-ai-practitioner',
    name: 'AWS AI Practitioner',
    provider: 'Amazon Web Services',
    description: 'Foundational AI/ML concepts on AWS. Generative AI, responsible AI, and AI services.',
    icon: 'brain',
    color: 'text-orange-400',
    difficulty: 'beginner',
    category: 'ai',
    estimatedHours: 25,
    examCode: 'AIF-C01',
    officialUrl: 'https://aws.amazon.com/certification/certified-ai-practitioner/',
    passingScore: 70,
    examDuration: 90
  },

  // ==========================================
  // Kubernetes Core Certifications (CNCF)
  // ==========================================
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
    passingScore: 66,
    examDuration: 120
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
    passingScore: 66,
    examDuration: 120
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
    prerequisites: ['cka'],
    passingScore: 67,
    examDuration: 120
  },

  // ==========================================
  // Kubernetes Associate Certifications (CNCF)
  // ==========================================
  {
    id: 'kcna',
    name: 'Kubernetes and Cloud Native Associate',
    provider: 'CNCF',
    description: 'Foundational knowledge of Kubernetes and cloud native technologies.',
    icon: 'box',
    color: 'text-blue-300',
    difficulty: 'beginner',
    category: 'devops',
    estimatedHours: 25,
    examCode: 'KCNA',
    officialUrl: 'https://www.cncf.io/certification/kcna/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'kcsa',
    name: 'Kubernetes and Cloud Security Associate',
    provider: 'CNCF',
    description: 'Entry-level certification covering security principles in a cloud-native environment.',
    icon: 'shield',
    color: 'text-blue-400',
    difficulty: 'beginner',
    category: 'security',
    estimatedHours: 30,
    examCode: 'KCSA',
    officialUrl: 'https://www.cncf.io/certification/kcsa/',
    passingScore: 75,
    examDuration: 90
  },

  // ==========================================
  // CNCF Project-Specific Certifications
  // ==========================================
  {
    id: 'pca',
    name: 'Prometheus Certified Associate',
    provider: 'CNCF',
    description: 'Open-source monitoring and observability using Prometheus. PromQL, alerting, and dashboards.',
    icon: 'activity',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 35,
    examCode: 'PCA',
    officialUrl: 'https://www.cncf.io/certification/pca/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'otca',
    name: 'OpenTelemetry Certified Associate',
    provider: 'CNCF',
    description: 'Implementing and maintaining OpenTelemetry-based observability solutions.',
    icon: 'activity',
    color: 'text-cyan-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 35,
    examCode: 'OTCA',
    officialUrl: 'https://www.cncf.io/certification/otca/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'ica',
    name: 'Istio Certified Associate',
    provider: 'CNCF',
    description: 'Service mesh management and traffic networking with Istio.',
    icon: 'network',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 40,
    examCode: 'ICA',
    officialUrl: 'https://www.cncf.io/certification/ica/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'cca',
    name: 'Cilium Certified Associate',
    provider: 'CNCF',
    description: 'Cloud-native networking, security, and observability using Cilium.',
    icon: 'network',
    color: 'text-green-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 35,
    examCode: 'CCA',
    officialUrl: 'https://www.cncf.io/certification/cca/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'capa',
    name: 'Certified Argo Project Associate',
    provider: 'CNCF',
    description: 'Proficiency in the Argo ecosystem for GitOps and application delivery.',
    icon: 'git-branch',
    color: 'text-orange-400',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 35,
    examCode: 'CAPA',
    officialUrl: 'https://www.cncf.io/certification/capa/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'cgoa',
    name: 'GitOps Certified Associate',
    provider: 'CNCF',
    description: 'Principles and tools of GitOps for continuous delivery.',
    icon: 'git-branch',
    color: 'text-purple-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 30,
    examCode: 'CGOA',
    officialUrl: 'https://www.cncf.io/certification/cgoa/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'cba',
    name: 'Certified Backstage Associate',
    provider: 'CNCF',
    description: 'Mastery of the Backstage platform for building developer portals.',
    icon: 'layout',
    color: 'text-cyan-400',
    difficulty: 'intermediate',
    category: 'development',
    estimatedHours: 30,
    examCode: 'CBA',
    officialUrl: 'https://www.cncf.io/certification/cba/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'kca',
    name: 'Kyverno Certified Associate',
    provider: 'CNCF',
    description: 'Kubernetes policy management using Kyverno.',
    icon: 'shield',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'security',
    estimatedHours: 30,
    examCode: 'KCA',
    officialUrl: 'https://www.cncf.io/certification/kca/',
    passingScore: 75,
    examDuration: 90
  },

  // ==========================================
  // Advanced & Specialized CNCF Certifications
  // ==========================================
  {
    id: 'cnpa',
    name: 'Cloud Native Platform Engineering Associate',
    provider: 'CNCF',
    description: 'Skills required for modern platform engineering and developer experience.',
    icon: 'layers',
    color: 'text-purple-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 40,
    examCode: 'CNPA',
    officialUrl: 'https://www.cncf.io/certification/cnpa/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'ckne',
    name: 'Certified Kubernetes Network Engineer',
    provider: 'CNCF',
    description: 'Advanced Kubernetes networking including CNI plugins, service mesh, and troubleshooting.',
    icon: 'network',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'devops',
    estimatedHours: 50,
    examCode: 'CKNE',
    officialUrl: 'https://www.cncf.io/certification/ckne/',
    prerequisites: ['cka'],
    passingScore: 66,
    examDuration: 120
  },
  {
    id: 'cnf-certification',
    name: 'Cloud Native Network Functions Certification',
    provider: 'CNCF',
    description: 'Cloud Native Network Functions for telecommunications industry.',
    icon: 'network',
    color: 'text-indigo-500',
    difficulty: 'advanced',
    category: 'devops',
    estimatedHours: 60,
    examCode: 'CNF',
    officialUrl: 'https://www.cncf.io/certification/cnf/',
    passingScore: 70,
    examDuration: 120
  },

  // ==========================================
  // HashiCorp Certifications
  // ==========================================
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
    passingScore: 70,
    examDuration: 60
  },
  {
    id: 'vault-associate',
    name: 'HashiCorp Vault Associate',
    provider: 'HashiCorp',
    description: 'Secrets management fundamentals. Vault architecture, auth methods, and secrets engines.',
    icon: 'lock',
    color: 'text-purple-500',
    difficulty: 'intermediate',
    category: 'security',
    estimatedHours: 35,
    examCode: '002',
    officialUrl: 'https://www.hashicorp.com/certification/vault-associate',
    passingScore: 70,
    examDuration: 60
  },
  {
    id: 'consul-associate',
    name: 'HashiCorp Consul Associate',
    provider: 'HashiCorp',
    description: 'Service discovery and service mesh. Consul architecture, security, and operations.',
    icon: 'network',
    color: 'text-purple-500',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 30,
    examCode: '002',
    officialUrl: 'https://www.hashicorp.com/certification/consul-associate',
    passingScore: 70,
    examDuration: 60
  },

  // ==========================================
  // Google Cloud Certifications
  // ==========================================
  {
    id: 'gcp-cloud-engineer',
    name: 'Google Cloud Associate Cloud Engineer',
    provider: 'Google Cloud',
    description: 'Deploy applications and manage GCP resources. Compute Engine, GKE, and Cloud Functions.',
    icon: 'cloud',
    color: 'text-blue-500',
    difficulty: 'intermediate',
    category: 'cloud',
    estimatedHours: 40,
    officialUrl: 'https://cloud.google.com/certification/cloud-engineer',
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'gcp-cloud-architect',
    name: 'Google Cloud Professional Cloud Architect',
    provider: 'Google Cloud',
    description: 'Design and plan cloud solutions on GCP. Enterprise architecture and migration strategies.',
    icon: 'cloud',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'cloud',
    estimatedHours: 60,
    officialUrl: 'https://cloud.google.com/certification/cloud-architect',
    prerequisites: ['gcp-cloud-engineer'],
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'gcp-data-engineer',
    name: 'Google Cloud Professional Data Engineer',
    provider: 'Google Cloud',
    description: 'Design data processing systems on GCP. BigQuery, Dataflow, and Pub/Sub.',
    icon: 'database',
    color: 'text-blue-500',
    difficulty: 'advanced',
    category: 'data',
    estimatedHours: 55,
    officialUrl: 'https://cloud.google.com/certification/data-engineer',
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'gcp-ml-engineer',
    name: 'Google Cloud Professional ML Engineer',
    provider: 'Google Cloud',
    description: 'Design and build ML systems on GCP. Vertex AI, model deployment, and MLOps.',
    icon: 'brain',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'ai',
    estimatedHours: 60,
    officialUrl: 'https://cloud.google.com/certification/machine-learning-engineer',
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'gcp-devops-engineer',
    name: 'Google Cloud Professional DevOps Engineer',
    provider: 'Google Cloud',
    description: 'Build and operate services on GCP. CI/CD, SRE practices, and monitoring.',
    icon: 'infinity',
    color: 'text-blue-500',
    difficulty: 'advanced',
    category: 'devops',
    estimatedHours: 55,
    officialUrl: 'https://cloud.google.com/certification/cloud-devops-engineer',
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'gcp-security-engineer',
    name: 'Google Cloud Professional Security Engineer',
    provider: 'Google Cloud',
    description: 'Design and implement secure GCP solutions. IAM, network security, and compliance.',
    icon: 'shield',
    color: 'text-blue-600',
    difficulty: 'advanced',
    category: 'security',
    estimatedHours: 55,
    officialUrl: 'https://cloud.google.com/certification/cloud-security-engineer',
    passingScore: 70,
    examDuration: 120
  },

  // ==========================================
  // Azure Certifications
  // ==========================================
  {
    id: 'azure-fundamentals',
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
    passingScore: 70,
    examDuration: 60
  },
  {
    id: 'azure-administrator',
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
    prerequisites: ['azure-fundamentals'],
    passingScore: 70,
    examDuration: 100
  },
  {
    id: 'azure-developer',
    name: 'Azure Developer Associate',
    provider: 'Microsoft',
    description: 'Develop Azure compute solutions, storage, security, and connect services.',
    icon: 'code',
    color: 'text-sky-500',
    difficulty: 'intermediate',
    category: 'development',
    estimatedHours: 40,
    examCode: 'AZ-204',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-developer/',
    passingScore: 70,
    examDuration: 100
  },
  {
    id: 'azure-solutions-architect',
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
    prerequisites: ['azure-administrator'],
    passingScore: 70,
    examDuration: 100
  },
  {
    id: 'azure-devops-engineer',
    name: 'Azure DevOps Engineer Expert',
    provider: 'Microsoft',
    description: 'Design and implement DevOps practices on Azure. CI/CD, source control, and security.',
    icon: 'infinity',
    color: 'text-sky-600',
    difficulty: 'expert',
    category: 'devops',
    estimatedHours: 60,
    examCode: 'AZ-400',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/devops-engineer/',
    prerequisites: ['azure-administrator', 'azure-developer'],
    passingScore: 70,
    examDuration: 120
  },
  {
    id: 'azure-data-engineer',
    name: 'Azure Data Engineer Associate',
    provider: 'Microsoft',
    description: 'Design and implement data solutions on Azure. Synapse, Data Factory, and Databricks.',
    icon: 'database',
    color: 'text-sky-500',
    difficulty: 'intermediate',
    category: 'data',
    estimatedHours: 50,
    examCode: 'DP-203',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-data-engineer/',
    passingScore: 70,
    examDuration: 100
  },
  {
    id: 'azure-ai-engineer',
    name: 'Azure AI Engineer Associate',
    provider: 'Microsoft',
    description: 'Build AI solutions on Azure. Cognitive Services, Azure OpenAI, and ML solutions.',
    icon: 'brain',
    color: 'text-sky-600',
    difficulty: 'intermediate',
    category: 'ai',
    estimatedHours: 45,
    examCode: 'AI-102',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-ai-engineer/',
    passingScore: 70,
    examDuration: 100
  },
  {
    id: 'azure-security-engineer',
    name: 'Azure Security Engineer Associate',
    provider: 'Microsoft',
    description: 'Implement security controls on Azure. Identity, networking, and security operations.',
    icon: 'shield',
    color: 'text-sky-600',
    difficulty: 'intermediate',
    category: 'security',
    estimatedHours: 50,
    examCode: 'AZ-500',
    officialUrl: 'https://learn.microsoft.com/en-us/certifications/azure-security-engineer/',
    passingScore: 70,
    examDuration: 100
  },

  // ==========================================
  // Linux & DevOps Certifications
  // ==========================================
  {
    id: 'linux-foundation-sysadmin',
    name: 'Linux Foundation Certified System Administrator',
    provider: 'Linux Foundation',
    description: 'Linux system administration. Essential commands, networking, and service configuration.',
    icon: 'terminal',
    color: 'text-yellow-600',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 45,
    examCode: 'LFCS',
    officialUrl: 'https://training.linuxfoundation.org/certification/linux-foundation-certified-sysadmin-lfcs/',
    passingScore: 66,
    examDuration: 120
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
    passingScore: 70,
    examDuration: 150
  },
  {
    id: 'docker-dca',
    name: 'Docker Certified Associate',
    provider: 'Docker',
    description: 'Docker containerization skills. Image management, orchestration, and security.',
    icon: 'box',
    color: 'text-blue-400',
    difficulty: 'intermediate',
    category: 'devops',
    estimatedHours: 35,
    examCode: 'DCA',
    officialUrl: 'https://training.mirantis.com/certification/dca-certification-exam/',
    passingScore: 65,
    examDuration: 90
  },

  // ==========================================
  // Data & Analytics Certifications
  // ==========================================
  {
    id: 'databricks-data-engineer',
    name: 'Databricks Data Engineer Associate',
    provider: 'Databricks',
    description: 'Build data pipelines on Databricks. Lakehouse architecture, Spark, and Delta Lake.',
    icon: 'database',
    color: 'text-red-500',
    difficulty: 'intermediate',
    category: 'data',
    estimatedHours: 40,
    officialUrl: 'https://www.databricks.com/learn/certification/data-engineer-associate',
    passingScore: 70,
    examDuration: 90
  },
  {
    id: 'snowflake-core',
    name: 'Snowflake SnowPro Core',
    provider: 'Snowflake',
    description: 'Snowflake data platform fundamentals. Architecture, data loading, and performance.',
    icon: 'database',
    color: 'text-cyan-400',
    difficulty: 'intermediate',
    category: 'data',
    estimatedHours: 35,
    officialUrl: 'https://www.snowflake.com/certifications/',
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'dbt-analytics-engineer',
    name: 'dbt Analytics Engineering',
    provider: 'dbt Labs',
    description: 'Analytics engineering with dbt. Data modeling, testing, and documentation.',
    icon: 'database',
    color: 'text-orange-400',
    difficulty: 'intermediate',
    category: 'data',
    estimatedHours: 30,
    officialUrl: 'https://www.getdbt.com/certifications/analytics-engineering-certification',
    passingScore: 65,
    examDuration: 90
  },

  // ==========================================
  // Security Certifications
  // ==========================================
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
    passingScore: 75,
    examDuration: 90
  },
  {
    id: 'cissp',
    name: 'CISSP',
    provider: 'ISC2',
    description: 'Advanced security management. Security architecture, risk management, and operations.',
    icon: 'shield',
    color: 'text-red-600',
    difficulty: 'expert',
    category: 'security',
    estimatedHours: 100,
    officialUrl: 'https://www.isc2.org/certifications/cissp',
    passingScore: 70,
    examDuration: 180
  },

  // ==========================================
  // AI/ML Certifications
  // ==========================================
  {
    id: 'tensorflow-developer',
    name: 'TensorFlow Developer Certificate',
    provider: 'Google',
    description: 'Build ML models with TensorFlow. Neural networks, image classification, and NLP.',
    icon: 'brain',
    color: 'text-orange-500',
    difficulty: 'intermediate',
    category: 'ai',
    estimatedHours: 40,
    officialUrl: 'https://www.tensorflow.org/certificate',
    passingScore: 90,
    examDuration: 300
  }
];

/**
 * Insert or update a certification
 */
async function upsertCertification(cert) {
  const domains = certificationDomains[cert.id] || [];
  const now = new Date().toISOString();
  
  try {
    await dbClient.execute({
      sql: `INSERT OR REPLACE INTO certifications 
            (id, name, provider, description, icon, color, difficulty, category, 
             estimated_hours, exam_code, official_url, domains, prerequisites, 
             status, passing_score, exam_duration, created_at, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
      args: [
        cert.id,
        cert.name,
        cert.provider,
        cert.description,
        cert.icon || 'award',
        cert.color || 'text-primary',
        cert.difficulty,
        cert.category,
        cert.estimatedHours || 40,
        cert.examCode || null,
        cert.officialUrl || null,
        JSON.stringify(domains),
        JSON.stringify(cert.prerequisites || []),
        cert.passingScore || 70,
        cert.examDuration || 90,
        now,
        now
      ]
    });
    return true;
  } catch (error) {
    console.error(`Failed to insert ${cert.id}:`, error.message);
    return false;
  }
}

/**
 * Update question counts for all certifications
 */
async function updateQuestionCounts() {
  console.log('\n📊 Updating question counts...');
  
  for (const cert of certificationsData) {
    try {
      const result = await dbClient.execute({
        sql: `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status != 'deleted'`,
        args: [cert.id]
      });
      
      const count = result.rows[0]?.count || 0;
      
      await dbClient.execute({
        sql: `UPDATE certifications SET question_count = ?, last_updated = ? WHERE id = ?`,
        args: [count, new Date().toISOString(), cert.id]
      });
      
      if (count > 0) {
        console.log(`   ${cert.id}: ${count} questions`);
      }
    } catch (e) {
      // Ignore errors for missing tables
    }
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🎓 SEED CERTIFICATIONS TABLE');
  console.log('═'.repeat(60));
  
  // Create table
  console.log('\n📋 Creating certifications table...');
  try {
    await dbClient.execute(CREATE_TABLE_SQL);
    console.log('   ✅ Table created/verified');
  } catch (error) {
    console.error('   ❌ Failed to create table:', error.message);
    return;
  }
  
  // Insert certifications
  console.log(`\n📝 Inserting ${certificationsData.length} certifications...`);
  let inserted = 0;
  
  for (const cert of certificationsData) {
    const success = await upsertCertification(cert);
    if (success) {
      inserted++;
      console.log(`   ✅ ${cert.id}`);
    }
  }
  
  // Update question counts
  await updateQuestionCounts();
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 MIGRATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total certifications: ${inserted}`);
  console.log('═'.repeat(60));
}

// Run
main().catch(console.error);
