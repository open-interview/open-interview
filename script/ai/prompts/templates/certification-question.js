/**
 * Certification Question Bot Prompt Template
 * Generates exam-aligned MCQ questions for specific certifications
 */

import { jsonOutputRule, markdownFormattingRules } from './base.js';

export const schema = {
  id: "cert-xxx-001",
  certificationId: "aws-saa",
  domain: "design-secure",
  question: "Question text ending with ?",
  options: [
    { id: "a", text: "Option A (plain text, no markdown)", isCorrect: false },
    { id: "b", text: "Option B (plain text, no markdown)", isCorrect: true },
    { id: "c", text: "Option C (plain text, no markdown)", isCorrect: false },
    { id: "d", text: "Option D (plain text, no markdown)", isCorrect: false }
  ],
  explanation: "Detailed explanation with proper markdown formatting. Use ## for headings, - for lists, and proper code blocks.",
  difficulty: "intermediate",
  tags: ["tag1", "tag2"]
};

export const certificationDomains = {
  // ==========================================
  // AWS Certifications
  // ==========================================
  'aws-saa': [
    { id: 'design-secure', name: 'Design Secure Architectures', weight: 30 },
    { id: 'design-resilient', name: 'Design Resilient Architectures', weight: 26 },
    { id: 'design-performant', name: 'Design High-Performing Architectures', weight: 24 },
    { id: 'design-cost', name: 'Design Cost-Optimized Architectures', weight: 20 }
  ],
  'aws-sap': [
    { id: 'design-solutions', name: 'Design Solutions for Organizational Complexity', weight: 26 },
    { id: 'design-new-solutions', name: 'Design for New Solutions', weight: 29 },
    { id: 'continuous-improvement', name: 'Continuous Improvement for Existing Solutions', weight: 25 },
    { id: 'accelerate-migration', name: 'Accelerate Workload Migration and Modernization', weight: 20 }
  ],
  'aws-dva': [
    { id: 'development', name: 'Development with AWS Services', weight: 32 },
    { id: 'security', name: 'Security', weight: 26 },
    { id: 'deployment', name: 'Deployment', weight: 24 },
    { id: 'troubleshooting', name: 'Troubleshooting and Optimization', weight: 18 }
  ],
  'aws-sysops': [
    { id: 'monitoring-logging', name: 'Monitoring, Logging, and Remediation', weight: 20 },
    { id: 'reliability', name: 'Reliability and Business Continuity', weight: 16 },
    { id: 'deployment-provisioning', name: 'Deployment, Provisioning, and Automation', weight: 18 },
    { id: 'security-compliance', name: 'Security and Compliance', weight: 16 },
    { id: 'networking', name: 'Networking and Content Delivery', weight: 18 },
    { id: 'cost-optimization', name: 'Cost and Performance Optimization', weight: 12 }
  ],
  'aws-devops-pro': [
    { id: 'sdlc-automation', name: 'SDLC Automation', weight: 22 },
    { id: 'config-management', name: 'Configuration Management and IaC', weight: 17 },
    { id: 'resilient-deployments', name: 'Resilient Cloud Solutions', weight: 15 },
    { id: 'monitoring-logging', name: 'Monitoring and Logging', weight: 15 },
    { id: 'incident-response', name: 'Incident and Event Response', weight: 14 },
    { id: 'security-compliance', name: 'Security and Compliance', weight: 17 }
  ],
  'aws-data-engineer': [
    { id: 'data-ingestion', name: 'Data Ingestion and Transformation', weight: 34 },
    { id: 'data-store-management', name: 'Data Store Management', weight: 26 },
    { id: 'data-operations', name: 'Data Operations and Support', weight: 22 },
    { id: 'data-security', name: 'Data Security and Governance', weight: 18 }
  ],
  'aws-ml-specialty': [
    { id: 'data-engineering', name: 'Data Engineering', weight: 20 },
    { id: 'exploratory-analysis', name: 'Exploratory Data Analysis', weight: 24 },
    { id: 'modeling', name: 'Modeling', weight: 36 },
    { id: 'ml-implementation', name: 'ML Implementation and Operations', weight: 20 }
  ],
  'aws-security-specialty': [
    { id: 'threat-detection', name: 'Threat Detection and Incident Response', weight: 14 },
    { id: 'security-logging', name: 'Security Logging and Monitoring', weight: 18 },
    { id: 'infrastructure-security', name: 'Infrastructure Security', weight: 20 },
    { id: 'identity-access', name: 'Identity and Access Management', weight: 16 },
    { id: 'data-protection', name: 'Data Protection', weight: 18 },
    { id: 'management-governance', name: 'Management and Security Governance', weight: 14 }
  ],
  'aws-database-specialty': [
    { id: 'workload-requirements', name: 'Workload-Specific Database Design', weight: 26 },
    { id: 'deployment-migration', name: 'Deployment and Migration', weight: 20 },
    { id: 'management-operations', name: 'Management and Operations', weight: 18 },
    { id: 'monitoring-troubleshooting', name: 'Monitoring and Troubleshooting', weight: 18 },
    { id: 'database-security', name: 'Database Security', weight: 18 }
  ],
  'aws-networking-specialty': [
    { id: 'network-design', name: 'Network Design', weight: 30 },
    { id: 'network-implementation', name: 'Network Implementation', weight: 26 },
    { id: 'network-management', name: 'Network Management and Operations', weight: 20 },
    { id: 'network-security', name: 'Network Security, Compliance, and Governance', weight: 24 }
  ],

  // ==========================================
  // Kubernetes Core Certifications (CNCF)
  // ==========================================
  'cka': [
    { id: 'cluster-arch', name: 'Cluster Architecture, Installation & Configuration', weight: 25 },
    { id: 'workloads', name: 'Workloads & Scheduling', weight: 15 },
    { id: 'services', name: 'Services & Networking', weight: 20 },
    { id: 'storage', name: 'Storage', weight: 10 },
    { id: 'troubleshoot', name: 'Troubleshooting', weight: 30 }
  ],
  'ckad': [
    { id: 'app-design', name: 'Application Design and Build', weight: 20 },
    { id: 'app-deployment', name: 'Application Deployment', weight: 20 },
    { id: 'app-observability', name: 'Application Observability and Maintenance', weight: 15 },
    { id: 'app-environment', name: 'Application Environment, Configuration and Security', weight: 25 },
    { id: 'services-networking', name: 'Services and Networking', weight: 20 }
  ],
  'cks': [
    { id: 'cluster-setup', name: 'Cluster Setup', weight: 10 },
    { id: 'cluster-hardening', name: 'Cluster Hardening', weight: 15 },
    { id: 'system-hardening', name: 'System Hardening', weight: 15 },
    { id: 'minimize-vulnerabilities', name: 'Minimize Microservice Vulnerabilities', weight: 20 },
    { id: 'supply-chain', name: 'Supply Chain Security', weight: 20 },
    { id: 'monitoring-logging', name: 'Monitoring, Logging and Runtime Security', weight: 20 }
  ],

  // ==========================================
  // Kubernetes Associate Certifications (CNCF)
  // ==========================================
  'kcna': [
    { id: 'k8s-fundamentals', name: 'Kubernetes Fundamentals', weight: 46 },
    { id: 'container-orchestration', name: 'Container Orchestration', weight: 22 },
    { id: 'cloud-native-arch', name: 'Cloud Native Architecture', weight: 16 },
    { id: 'cloud-native-observability', name: 'Cloud Native Observability', weight: 8 },
    { id: 'cloud-native-delivery', name: 'Cloud Native Application Delivery', weight: 8 }
  ],
  'kcsa': [
    { id: 'cloud-native-security', name: 'Overview of Cloud Native Security', weight: 14 },
    { id: 'k8s-cluster-security', name: 'Kubernetes Cluster Component Security', weight: 22 },
    { id: 'k8s-security-fundamentals', name: 'Kubernetes Security Fundamentals', weight: 22 },
    { id: 'k8s-threat-model', name: 'Kubernetes Threat Model', weight: 16 },
    { id: 'platform-security', name: 'Platform Security', weight: 16 },
    { id: 'compliance-security', name: 'Compliance and Security Frameworks', weight: 10 }
  ],

  // ==========================================
  // CNCF Project-Specific Certifications
  // ==========================================
  'pca': [
    { id: 'observability-fundamentals', name: 'Observability Fundamentals', weight: 18 },
    { id: 'prometheus-fundamentals', name: 'Prometheus Fundamentals', weight: 20 },
    { id: 'promql', name: 'PromQL', weight: 28 },
    { id: 'alerting-dashboards', name: 'Alerting and Dashboards', weight: 18 },
    { id: 'service-discovery', name: 'Service Discovery', weight: 16 }
  ],
  'otca': [
    { id: 'observability-concepts', name: 'Observability Concepts', weight: 20 },
    { id: 'otel-fundamentals', name: 'OpenTelemetry Fundamentals', weight: 25 },
    { id: 'instrumentation', name: 'Instrumentation', weight: 25 },
    { id: 'collector', name: 'OpenTelemetry Collector', weight: 20 },
    { id: 'backends-integration', name: 'Backends and Integration', weight: 10 }
  ],
  'ica': [
    { id: 'istio-installation', name: 'Istio Installation, Upgrade & Configuration', weight: 7 },
    { id: 'traffic-management', name: 'Traffic Management', weight: 40 },
    { id: 'resilience-fault', name: 'Resilience and Fault Injection', weight: 20 },
    { id: 'security-istio', name: 'Securing Workloads', weight: 20 },
    { id: 'observability-istio', name: 'Advanced Scenarios', weight: 13 }
  ],
  'cca': [
    { id: 'cilium-architecture', name: 'Architecture', weight: 20 },
    { id: 'network-policy', name: 'Network Policy', weight: 25 },
    { id: 'service-mesh-cilium', name: 'Service Mesh', weight: 20 },
    { id: 'cluster-mesh', name: 'Cluster Mesh', weight: 15 },
    { id: 'observability-cilium', name: 'Observability', weight: 20 }
  ],
  'capa': [
    { id: 'argo-cd', name: 'Argo CD', weight: 35 },
    { id: 'argo-workflows', name: 'Argo Workflows', weight: 25 },
    { id: 'argo-rollouts', name: 'Argo Rollouts', weight: 20 },
    { id: 'argo-events', name: 'Argo Events', weight: 10 },
    { id: 'gitops-principles', name: 'GitOps Principles', weight: 10 }
  ],
  'cgoa': [
    { id: 'gitops-terminology', name: 'GitOps Terminology', weight: 20 },
    { id: 'gitops-principles', name: 'GitOps Principles', weight: 25 },
    { id: 'related-practices', name: 'Related Practices', weight: 20 },
    { id: 'gitops-patterns', name: 'GitOps Patterns', weight: 20 },
    { id: 'tooling', name: 'Tooling', weight: 15 }
  ],
  'cba': [
    { id: 'backstage-fundamentals', name: 'Backstage Fundamentals', weight: 25 },
    { id: 'software-catalog', name: 'Software Catalog', weight: 25 },
    { id: 'software-templates', name: 'Software Templates', weight: 20 },
    { id: 'techdocs', name: 'TechDocs', weight: 15 },
    { id: 'plugins-customization', name: 'Plugins and Customization', weight: 15 }
  ],
  'kca': [
    { id: 'kyverno-fundamentals', name: 'Kyverno Fundamentals', weight: 25 },
    { id: 'policy-types', name: 'Policy Types', weight: 30 },
    { id: 'policy-management', name: 'Policy Management', weight: 20 },
    { id: 'policy-reporting', name: 'Policy Reporting', weight: 15 },
    { id: 'advanced-features', name: 'Advanced Features', weight: 10 }
  ],

  // ==========================================
  // Advanced & Specialized CNCF Certifications
  // ==========================================
  'cnpa': [
    { id: 'platform-engineering', name: 'Platform Engineering Fundamentals', weight: 25 },
    { id: 'developer-experience', name: 'Developer Experience', weight: 20 },
    { id: 'platform-capabilities', name: 'Platform Capabilities', weight: 25 },
    { id: 'platform-operations', name: 'Platform Operations', weight: 20 },
    { id: 'platform-security', name: 'Platform Security', weight: 10 }
  ],
  'ckne': [
    { id: 'k8s-networking-fundamentals', name: 'Kubernetes Networking Fundamentals', weight: 25 },
    { id: 'cni-plugins', name: 'CNI Plugins', weight: 20 },
    { id: 'service-networking', name: 'Service Networking', weight: 20 },
    { id: 'ingress-gateway', name: 'Ingress and Gateway API', weight: 20 },
    { id: 'network-troubleshooting', name: 'Network Troubleshooting', weight: 15 }
  ],
  'cnf-certification': [
    { id: 'cnf-fundamentals', name: 'Cloud Native Network Functions Fundamentals', weight: 25 },
    { id: 'cnf-architecture', name: 'CNF Architecture', weight: 25 },
    { id: 'cnf-deployment', name: 'CNF Deployment', weight: 20 },
    { id: 'cnf-operations', name: 'CNF Operations', weight: 20 },
    { id: 'cnf-security', name: 'CNF Security', weight: 10 }
  ],

  // ==========================================
  // HashiCorp Certifications
  // ==========================================
  'terraform-associate': [
    { id: 'iac-concepts', name: 'IaC Concepts', weight: 15 },
    { id: 'terraform-basics', name: 'Terraform Basics', weight: 20 },
    { id: 'terraform-state', name: 'Terraform State', weight: 15 },
    { id: 'modules', name: 'Modules', weight: 15 },
    { id: 'workflow', name: 'Core Workflow', weight: 15 },
    { id: 'terraform-cloud', name: 'Terraform Cloud', weight: 10 },
    { id: 'read-generate-modify', name: 'Read, Generate, and Modify Configuration', weight: 10 }
  ],
  'vault-associate': [
    { id: 'vault-architecture', name: 'Vault Architecture', weight: 15 },
    { id: 'vault-tokens', name: 'Vault Tokens', weight: 15 },
    { id: 'vault-leases', name: 'Vault Leases', weight: 10 },
    { id: 'auth-methods', name: 'Authentication Methods', weight: 15 },
    { id: 'vault-policies', name: 'Vault Policies', weight: 15 },
    { id: 'secrets-engines', name: 'Secrets Engines', weight: 20 },
    { id: 'encryption', name: 'Encryption as a Service', weight: 10 }
  ],
  'consul-associate': [
    { id: 'consul-architecture', name: 'Consul Architecture', weight: 20 },
    { id: 'service-discovery', name: 'Service Discovery', weight: 20 },
    { id: 'service-mesh', name: 'Service Mesh', weight: 20 },
    { id: 'consul-security', name: 'Consul Security', weight: 20 },
    { id: 'consul-operations', name: 'Consul Operations', weight: 20 }
  ],

  // ==========================================
  // Google Cloud Certifications
  // ==========================================
  'gcp-cloud-engineer': [
    { id: 'cloud-projects', name: 'Setting up a Cloud Solution Environment', weight: 17 },
    { id: 'planning-configuring', name: 'Planning and Configuring a Cloud Solution', weight: 18 },
    { id: 'deploying-implementing', name: 'Deploying and Implementing a Cloud Solution', weight: 22 },
    { id: 'operations', name: 'Ensuring Successful Operation of a Cloud Solution', weight: 21 },
    { id: 'access-security', name: 'Configuring Access and Security', weight: 22 }
  ],
  'gcp-cloud-architect': [
    { id: 'design-plan', name: 'Designing and Planning a Cloud Solution Architecture', weight: 24 },
    { id: 'manage-provision', name: 'Managing and Provisioning a Solution Infrastructure', weight: 15 },
    { id: 'security-compliance', name: 'Designing for Security and Compliance', weight: 18 },
    { id: 'technical-processes', name: 'Analyzing and Optimizing Technical and Business Processes', weight: 18 },
    { id: 'implementation', name: 'Managing Implementation', weight: 11 },
    { id: 'reliability', name: 'Ensuring Solution and Operations Reliability', weight: 14 }
  ],
  'gcp-data-engineer': [
    { id: 'design-data-systems', name: 'Designing Data Processing Systems', weight: 22 },
    { id: 'ingest-process', name: 'Ingesting and Processing Data', weight: 25 },
    { id: 'store-data', name: 'Storing Data', weight: 20 },
    { id: 'prepare-use', name: 'Preparing and Using Data for Analysis', weight: 15 },
    { id: 'maintain-automate', name: 'Maintaining and Automating Data Workloads', weight: 18 }
  ],
  'gcp-ml-engineer': [
    { id: 'architect-ml', name: 'Architecting Low-code ML Solutions', weight: 12 },
    { id: 'data-prep', name: 'Collaborating within and across Teams to Manage Data and Models', weight: 16 },
    { id: 'scaling-automation', name: 'Scaling Prototypes into ML Models', weight: 18 },
    { id: 'serving-scaling', name: 'Serving and Scaling Models', weight: 19 },
    { id: 'automate-orchestrate', name: 'Automating and Orchestrating ML Pipelines', weight: 21 },
    { id: 'monitoring', name: 'Monitoring ML Solutions', weight: 14 }
  ],
  'gcp-devops-engineer': [
    { id: 'bootstrap-gcp', name: 'Bootstrapping a Google Cloud Organization', weight: 17 },
    { id: 'build-delivery', name: 'Building and Implementing CI/CD Pipelines', weight: 23 },
    { id: 'site-reliability', name: 'Applying Site Reliability Engineering Practices', weight: 23 },
    { id: 'service-monitoring', name: 'Implementing Service Monitoring Strategies', weight: 20 },
    { id: 'optimize-performance', name: 'Optimizing Service Performance', weight: 17 }
  ],
  'gcp-security-engineer': [
    { id: 'access-management', name: 'Configuring Access within a Cloud Solution Environment', weight: 27 },
    { id: 'network-security', name: 'Managing Network Security', weight: 21 },
    { id: 'data-protection', name: 'Ensuring Data Protection', weight: 20 },
    { id: 'operations-security', name: 'Managing Operations in a Cloud Solution Environment', weight: 15 },
    { id: 'compliance', name: 'Ensuring Compliance', weight: 17 }
  ],

  // ==========================================
  // Azure Certifications
  // ==========================================
  'azure-fundamentals': [
    { id: 'cloud-concepts', name: 'Describe Cloud Concepts', weight: 25 },
    { id: 'azure-architecture', name: 'Describe Azure Architecture and Services', weight: 35 },
    { id: 'management-governance', name: 'Describe Azure Management and Governance', weight: 30 },
    { id: 'pricing-support', name: 'Describe Azure Pricing, SLAs, and Lifecycle', weight: 10 }
  ],
  'azure-administrator': [
    { id: 'manage-identities', name: 'Manage Azure Identities and Governance', weight: 20 },
    { id: 'implement-storage', name: 'Implement and Manage Storage', weight: 15 },
    { id: 'deploy-manage-compute', name: 'Deploy and Manage Azure Compute Resources', weight: 20 },
    { id: 'implement-networking', name: 'Implement and Manage Virtual Networking', weight: 20 },
    { id: 'monitor-backup', name: 'Monitor and Maintain Azure Resources', weight: 15 },
    { id: 'deploy-manage-resources', name: 'Deploy and Manage Azure Resources', weight: 10 }
  ],
  'azure-developer': [
    { id: 'develop-compute', name: 'Develop Azure Compute Solutions', weight: 25 },
    { id: 'develop-storage', name: 'Develop for Azure Storage', weight: 15 },
    { id: 'implement-security', name: 'Implement Azure Security', weight: 20 },
    { id: 'monitor-troubleshoot', name: 'Monitor, Troubleshoot, and Optimize Azure Solutions', weight: 15 },
    { id: 'connect-consume', name: 'Connect to and Consume Azure Services and Third-party Services', weight: 15 },
    { id: 'implement-api', name: 'Implement API Management', weight: 10 }
  ],
  'azure-solutions-architect': [
    { id: 'design-identity', name: 'Design Identity, Governance, and Monitoring Solutions', weight: 25 },
    { id: 'design-data-storage', name: 'Design Data Storage Solutions', weight: 20 },
    { id: 'design-business-continuity', name: 'Design Business Continuity Solutions', weight: 15 },
    { id: 'design-infrastructure', name: 'Design Infrastructure Solutions', weight: 30 },
    { id: 'design-migrations', name: 'Design Migrations', weight: 10 }
  ],
  'azure-devops-engineer': [
    { id: 'configure-processes', name: 'Configure Processes and Communications', weight: 10 },
    { id: 'design-source-control', name: 'Design and Implement Source Control', weight: 15 },
    { id: 'design-build-release', name: 'Design and Implement Build and Release Pipelines', weight: 40 },
    { id: 'develop-security', name: 'Develop a Security and Compliance Plan', weight: 10 },
    { id: 'implement-instrumentation', name: 'Implement an Instrumentation Strategy', weight: 10 },
    { id: 'design-dependency', name: 'Design and Implement a Dependency Management Strategy', weight: 15 }
  ],
  'azure-data-engineer': [
    { id: 'design-data-storage', name: 'Design and Implement Data Storage', weight: 15 },
    { id: 'design-data-processing', name: 'Design and Develop Data Processing', weight: 40 },
    { id: 'design-data-security', name: 'Design and Implement Data Security', weight: 10 },
    { id: 'monitor-optimize', name: 'Monitor and Optimize Data Storage and Data Processing', weight: 15 },
    { id: 'design-data-integration', name: 'Design and Implement Data Integration', weight: 20 }
  ],
  'azure-ai-engineer': [
    { id: 'plan-manage', name: 'Plan and Manage an Azure AI Solution', weight: 25 },
    { id: 'implement-vision', name: 'Implement Computer Vision Solutions', weight: 20 },
    { id: 'implement-nlp', name: 'Implement Natural Language Processing Solutions', weight: 20 },
    { id: 'implement-knowledge', name: 'Implement Knowledge Mining and Document Intelligence Solutions', weight: 15 },
    { id: 'implement-generative', name: 'Implement Generative AI Solutions', weight: 20 }
  ],
  'azure-security-engineer': [
    { id: 'manage-identity', name: 'Manage Identity and Access', weight: 25 },
    { id: 'secure-networking', name: 'Secure Networking', weight: 20 },
    { id: 'secure-compute', name: 'Secure Compute, Storage, and Databases', weight: 20 },
    { id: 'manage-security-ops', name: 'Manage Security Operations', weight: 25 },
    { id: 'secure-data-apps', name: 'Secure Data and Applications', weight: 10 }
  ],

  // ==========================================
  // Linux & DevOps Certifications
  // ==========================================
  'linux-foundation-sysadmin': [
    { id: 'essential-commands', name: 'Essential Commands', weight: 25 },
    { id: 'operation-running', name: 'Operation of Running Systems', weight: 20 },
    { id: 'user-group', name: 'User and Group Management', weight: 10 },
    { id: 'networking', name: 'Networking', weight: 12 },
    { id: 'service-config', name: 'Service Configuration', weight: 20 },
    { id: 'storage-management', name: 'Storage Management', weight: 13 }
  ],
  'rhcsa': [
    { id: 'essential-tools', name: 'Understand and Use Essential Tools', weight: 20 },
    { id: 'operate-systems', name: 'Operate Running Systems', weight: 20 },
    { id: 'configure-storage', name: 'Configure Local Storage', weight: 15 },
    { id: 'file-systems', name: 'Create and Configure File Systems', weight: 15 },
    { id: 'deploy-configure', name: 'Deploy, Configure, and Maintain Systems', weight: 15 },
    { id: 'manage-users', name: 'Manage Users and Groups', weight: 10 },
    { id: 'manage-security', name: 'Manage Security', weight: 5 }
  ],
  'docker-dca': [
    { id: 'orchestration', name: 'Orchestration', weight: 25 },
    { id: 'image-creation', name: 'Image Creation, Management, and Registry', weight: 20 },
    { id: 'installation-config', name: 'Installation and Configuration', weight: 15 },
    { id: 'networking', name: 'Networking', weight: 15 },
    { id: 'security', name: 'Security', weight: 15 },
    { id: 'storage-volumes', name: 'Storage and Volumes', weight: 10 }
  ],

  // ==========================================
  // Data & Analytics Certifications
  // ==========================================
  'databricks-data-engineer': [
    { id: 'lakehouse-arch', name: 'Databricks Lakehouse Platform', weight: 24 },
    { id: 'elt-spark', name: 'ELT with Spark SQL and Python', weight: 29 },
    { id: 'incremental-processing', name: 'Incremental Data Processing', weight: 22 },
    { id: 'production-pipelines', name: 'Production Pipelines', weight: 16 },
    { id: 'data-governance', name: 'Data Governance', weight: 9 }
  ],
  'snowflake-core': [
    { id: 'account-access', name: 'Account Access and Security', weight: 20 },
    { id: 'performance-optimization', name: 'Performance Optimization', weight: 20 },
    { id: 'data-loading', name: 'Data Loading and Unloading', weight: 20 },
    { id: 'data-transformation', name: 'Data Transformation', weight: 20 },
    { id: 'data-protection', name: 'Data Protection and Sharing', weight: 20 }
  ],
  'dbt-analytics-engineer': [
    { id: 'dbt-fundamentals', name: 'dbt Fundamentals', weight: 25 },
    { id: 'data-modeling', name: 'Data Modeling', weight: 25 },
    { id: 'testing-documentation', name: 'Testing and Documentation', weight: 20 },
    { id: 'deployment-environments', name: 'Deployment and Environments', weight: 15 },
    { id: 'advanced-features', name: 'Advanced dbt Features', weight: 15 }
  ],

  // ==========================================
  // Security Certifications
  // ==========================================
  'comptia-security-plus': [
    { id: 'threats-attacks', name: 'Threats, Attacks, and Vulnerabilities', weight: 24 },
    { id: 'architecture-design', name: 'Architecture and Design', weight: 21 },
    { id: 'implementation', name: 'Implementation', weight: 25 },
    { id: 'operations-incident', name: 'Operations and Incident Response', weight: 16 },
    { id: 'governance-compliance', name: 'Governance, Risk, and Compliance', weight: 14 }
  ],
  'cissp': [
    { id: 'security-risk', name: 'Security and Risk Management', weight: 15 },
    { id: 'asset-security', name: 'Asset Security', weight: 10 },
    { id: 'security-architecture', name: 'Security Architecture and Engineering', weight: 13 },
    { id: 'communication-network', name: 'Communication and Network Security', weight: 13 },
    { id: 'identity-access', name: 'Identity and Access Management', weight: 13 },
    { id: 'security-assessment', name: 'Security Assessment and Testing', weight: 12 },
    { id: 'security-operations', name: 'Security Operations', weight: 13 },
    { id: 'software-security', name: 'Software Development Security', weight: 11 }
  ],

  // ==========================================
  // AI/ML Certifications
  // ==========================================
  'tensorflow-developer': [
    { id: 'tensorflow-basics', name: 'TensorFlow Developer Skills', weight: 25 },
    { id: 'building-models', name: 'Building and Training Neural Network Models', weight: 30 },
    { id: 'image-classification', name: 'Image Classification', weight: 20 },
    { id: 'nlp-models', name: 'Natural Language Processing', weight: 15 },
    { id: 'time-series', name: 'Time Series, Sequences, and Predictions', weight: 10 }
  ],
  'aws-ai-practitioner': [
    { id: 'ai-ml-fundamentals', name: 'Fundamentals of AI and ML', weight: 20 },
    { id: 'generative-ai-fundamentals', name: 'Fundamentals of Generative AI', weight: 24 },
    { id: 'ai-ml-applications', name: 'Applications of Foundation Models', weight: 28 },
    { id: 'responsible-ai', name: 'Guidelines for Responsible AI', weight: 14 },
    { id: 'security-compliance', name: 'Security, Compliance, and Governance for AI Solutions', weight: 14 }
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

export const explanationFormat = `## Correct Answer

Brief statement of the correct answer and why.

## Why Other Options Are Wrong

- Option A: Why it's incorrect
- Option C: Why it's incorrect
- Option D: Why it's incorrect

## Key Concepts

- Concept 1
- Concept 2

## Real-World Application

How this applies in practice.`;

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

${markdownFormattingRules}

FIELD-SPECIFIC RULES:
- "question": Plain text, ends with ?
- "options[].text": Plain text ONLY, NO markdown, NO bold (**)
- "explanation": Well-formatted markdown following this structure:

${explanationFormat}

Return a JSON array:
${JSON.stringify([schema], null, 2)}

GUIDELINES:
${guidelines.map(g => `- ${g}`).join('\n')}

${jsonOutputRule}`;
}

export default { schema, certificationDomains, guidelines, explanationFormat, build };
