/**
 * Seed data generator for new channels based on coding-interview-university
 * 
 * This script creates initial question data for the new CS fundamentals channels:
 * - data-structures
 * - complexity-analysis
 * - dynamic-programming
 * - bit-manipulation
 * - design-patterns
 * - concurrency
 * - math-logic
 * - low-level
 * 
 * And certification prep channels for:
 * - AWS, GCP, Azure certifications
 * - Kubernetes (CKA, CKAD, CKS, KCNA)
 * - HashiCorp (Terraform, Vault, Consul)
 * - Linux, Docker, Security certifications
 * - Data & Analytics certifications
 * - AI/ML certifications
 */

const newChannelTopics = {
  'data-structures': {
    name: 'Data Structures',
    subChannels: ['arrays', 'linked-lists', 'stacks-queues', 'hash-tables', 'trees', 'heaps', 'tries', 'graphs'],
    sampleQuestions: [
      {
        subChannel: 'arrays',
        difficulty: 'beginner',
        question: 'Implement a dynamic array that automatically resizes when full. What is the amortized time complexity of append operations?',
        topics: ['dynamic-array', 'amortized-analysis', 'resizing']
      },
      {
        subChannel: 'linked-lists',
        difficulty: 'beginner',
        question: 'Implement a singly linked list with insert, delete, and search operations. What are the time complexities?',
        topics: ['singly-linked-list', 'pointers', 'traversal']
      },
      {
        subChannel: 'linked-lists',
        difficulty: 'intermediate',
        question: 'Detect if a linked list has a cycle using Floyd\'s cycle detection algorithm. Explain why it works.',
        topics: ['cycle-detection', 'floyd-algorithm', 'two-pointers']
      },
      {
        subChannel: 'stacks-queues',
        difficulty: 'beginner',
        question: 'Implement a stack using two queues. What are the time complexities for push and pop?',
        topics: ['stack', 'queue', 'data-structure-conversion']
      },
      {
        subChannel: 'hash-tables',
        difficulty: 'intermediate',
        question: 'Implement a hash table with chaining for collision resolution. How do you handle load factor and resizing?',
        topics: ['hash-table', 'collision-resolution', 'chaining', 'load-factor']
      },
      {
        subChannel: 'heaps',
        difficulty: 'intermediate',
        question: 'Implement a min-heap with insert, extractMin, and heapify operations. Explain the heap property.',
        topics: ['min-heap', 'heap-property', 'priority-queue']
      },
      {
        subChannel: 'tries',
        difficulty: 'intermediate',
        question: 'Implement a Trie for autocomplete functionality. How does it compare to a hash map for prefix searches?',
        topics: ['trie', 'prefix-tree', 'autocomplete']
      }
    ]
  },
  
  'complexity-analysis': {
    name: 'Complexity Analysis',
    subChannels: ['big-o-basics', 'time-complexity', 'space-complexity', 'amortized-analysis', 'master-theorem'],
    sampleQuestions: [
      {
        subChannel: 'big-o-basics',
        difficulty: 'beginner',
        question: 'Explain Big-O, Big-Omega, and Big-Theta notation. When would you use each?',
        topics: ['big-o', 'asymptotic-analysis', 'notation']
      },
      {
        subChannel: 'time-complexity',
        difficulty: 'beginner',
        question: 'What is the time complexity of binary search? Prove it mathematically.',
        topics: ['binary-search', 'logarithmic', 'proof']
      },
      {
        subChannel: 'space-complexity',
        difficulty: 'intermediate',
        question: 'Calculate the space complexity of recursive fibonacci vs iterative. How does the call stack affect memory?',
        topics: ['recursion', 'call-stack', 'memory']
      },
      {
        subChannel: 'amortized-analysis',
        difficulty: 'advanced',
        question: 'Explain amortized analysis using the dynamic array example. What is the aggregate method vs accounting method?',
        topics: ['amortized', 'aggregate-method', 'accounting-method']
      },
      {
        subChannel: 'master-theorem',
        difficulty: 'advanced',
        question: 'Use the Master Theorem to analyze the time complexity of merge sort. What are the three cases?',
        topics: ['master-theorem', 'divide-conquer', 'recurrence']
      }
    ]
  },
  
  'dynamic-programming': {
    name: 'Dynamic Programming',
    subChannels: ['recursion', 'backtracking', 'memoization', 'tabulation', 'classic-problems'],
    sampleQuestions: [
      {
        subChannel: 'recursion',
        difficulty: 'beginner',
        question: 'Explain the difference between recursion and iteration. When is recursion preferred?',
        topics: ['recursion', 'iteration', 'base-case']
      },
      {
        subChannel: 'backtracking',
        difficulty: 'intermediate',
        question: 'Solve the N-Queens problem using backtracking. What is the time complexity?',
        topics: ['n-queens', 'backtracking', 'constraint-satisfaction']
      },
      {
        subChannel: 'memoization',
        difficulty: 'intermediate',
        question: 'Convert a recursive fibonacci solution to use memoization. What is the time/space improvement?',
        topics: ['memoization', 'top-down', 'caching']
      },
      {
        subChannel: 'tabulation',
        difficulty: 'intermediate',
        question: 'Solve the 0/1 Knapsack problem using tabulation. Explain the state transition.',
        topics: ['knapsack', 'tabulation', 'bottom-up']
      },
      {
        subChannel: 'classic-problems',
        difficulty: 'advanced',
        question: 'Find the longest common subsequence of two strings. Can you optimize space to O(min(m,n))?',
        topics: ['lcs', 'string-dp', 'space-optimization']
      }
    ]
  },
  
  'bit-manipulation': {
    name: 'Bit Manipulation',
    subChannels: ['bitwise-basics', 'bit-tricks', 'binary-math', 'common-problems'],
    sampleQuestions: [
      {
        subChannel: 'bitwise-basics',
        difficulty: 'beginner',
        question: 'Explain AND, OR, XOR, NOT, left shift, and right shift operations with examples.',
        topics: ['bitwise-operators', 'binary', 'basics']
      },
      {
        subChannel: 'bit-tricks',
        difficulty: 'intermediate',
        question: 'Check if a number is a power of 2 using bit manipulation. Explain why n & (n-1) works.',
        topics: ['power-of-two', 'bit-trick', 'optimization']
      },
      {
        subChannel: 'binary-math',
        difficulty: 'intermediate',
        question: 'Explain two\'s complement representation. How do you negate a number using bits?',
        topics: ['twos-complement', 'signed-integers', 'negation']
      },
      {
        subChannel: 'common-problems',
        difficulty: 'intermediate',
        question: 'Find the single number in an array where every other number appears twice using XOR.',
        topics: ['xor', 'single-number', 'array']
      }
    ]
  },
  
  'design-patterns': {
    name: 'Design Patterns',
    subChannels: ['creational', 'structural', 'behavioral', 'solid-principles'],
    sampleQuestions: [
      {
        subChannel: 'creational',
        difficulty: 'intermediate',
        question: 'Implement the Singleton pattern in a thread-safe manner. What are the pros and cons?',
        topics: ['singleton', 'thread-safety', 'lazy-initialization']
      },
      {
        subChannel: 'creational',
        difficulty: 'intermediate',
        question: 'When would you use Factory Method vs Abstract Factory pattern? Provide examples.',
        topics: ['factory', 'abstract-factory', 'object-creation']
      },
      {
        subChannel: 'structural',
        difficulty: 'intermediate',
        question: 'Explain the Adapter pattern. How does it differ from the Facade pattern?',
        topics: ['adapter', 'facade', 'interface-conversion']
      },
      {
        subChannel: 'behavioral',
        difficulty: 'intermediate',
        question: 'Implement the Observer pattern for a notification system. What are the memory considerations?',
        topics: ['observer', 'pub-sub', 'event-driven']
      },
      {
        subChannel: 'solid-principles',
        difficulty: 'beginner',
        question: 'Explain the SOLID principles with practical examples. Why is Dependency Inversion important?',
        topics: ['solid', 'dependency-inversion', 'clean-code']
      }
    ]
  },
  
  'concurrency': {
    name: 'Concurrency',
    subChannels: ['threads-processes', 'locks-mutexes', 'deadlocks', 'parallel-patterns', 'async-programming'],
    sampleQuestions: [
      {
        subChannel: 'threads-processes',
        difficulty: 'beginner',
        question: 'What is the difference between a process and a thread? When would you use each?',
        topics: ['process', 'thread', 'context-switch']
      },
      {
        subChannel: 'locks-mutexes',
        difficulty: 'intermediate',
        question: 'Explain the difference between mutex and semaphore. When would you use a counting semaphore?',
        topics: ['mutex', 'semaphore', 'synchronization']
      },
      {
        subChannel: 'deadlocks',
        difficulty: 'intermediate',
        question: 'What are the four conditions for deadlock? How can you prevent or detect deadlocks?',
        topics: ['deadlock', 'coffman-conditions', 'prevention']
      },
      {
        subChannel: 'parallel-patterns',
        difficulty: 'advanced',
        question: 'Implement the producer-consumer pattern using a bounded buffer. Handle edge cases.',
        topics: ['producer-consumer', 'bounded-buffer', 'condition-variables']
      },
      {
        subChannel: 'async-programming',
        difficulty: 'intermediate',
        question: 'Explain async/await vs callbacks vs promises. What is the event loop?',
        topics: ['async-await', 'promises', 'event-loop']
      }
    ]
  },
  
  'math-logic': {
    name: 'Math & Logic',
    subChannels: ['combinatorics', 'probability', 'number-theory', 'discrete-math'],
    sampleQuestions: [
      {
        subChannel: 'combinatorics',
        difficulty: 'intermediate',
        question: 'Calculate the number of ways to choose k items from n items (n choose k). Implement it efficiently.',
        topics: ['combinations', 'binomial-coefficient', 'pascal-triangle']
      },
      {
        subChannel: 'probability',
        difficulty: 'intermediate',
        question: 'Implement reservoir sampling to select k random items from a stream of unknown size.',
        topics: ['reservoir-sampling', 'random-selection', 'streaming']
      },
      {
        subChannel: 'number-theory',
        difficulty: 'intermediate',
        question: 'Implement the Euclidean algorithm for GCD. How does it relate to the Extended Euclidean algorithm?',
        topics: ['gcd', 'euclidean-algorithm', 'modular-arithmetic']
      },
      {
        subChannel: 'discrete-math',
        difficulty: 'advanced',
        question: 'Prove that the sum of degrees in a graph equals twice the number of edges.',
        topics: ['graph-theory', 'handshaking-lemma', 'proof']
      }
    ]
  },
  
  'low-level': {
    name: 'Low-Level Programming',
    subChannels: ['memory-management', 'compilers', 'cpu-architecture', 'garbage-collection', 'caching'],
    sampleQuestions: [
      {
        subChannel: 'memory-management',
        difficulty: 'intermediate',
        question: 'Explain stack vs heap memory allocation. When would you use each?',
        topics: ['stack', 'heap', 'memory-allocation']
      },
      {
        subChannel: 'compilers',
        difficulty: 'advanced',
        question: 'Describe the stages of compilation: lexing, parsing, semantic analysis, code generation.',
        topics: ['compiler', 'lexer', 'parser', 'ast']
      },
      {
        subChannel: 'cpu-architecture',
        difficulty: 'intermediate',
        question: 'Explain CPU cache levels (L1, L2, L3). How does cache locality affect performance?',
        topics: ['cpu-cache', 'cache-locality', 'performance']
      },
      {
        subChannel: 'garbage-collection',
        difficulty: 'intermediate',
        question: 'Compare mark-and-sweep vs reference counting garbage collection. What are the trade-offs?',
        topics: ['gc', 'mark-sweep', 'reference-counting']
      },
      {
        subChannel: 'caching',
        difficulty: 'intermediate',
        question: 'Explain cache eviction policies: LRU, LFU, FIFO. When would you use each?',
        topics: ['cache-eviction', 'lru', 'lfu']
      }
    ]
  }
};

// Export for use in question generation scripts
export { newChannelTopics, certificationTopics };

// Certification topics for exam prep content
const certificationTopics = {
  // AWS Certifications
  'aws-saa': {
    name: 'AWS Solutions Architect Associate',
    domains: ['design-secure', 'design-resilient', 'design-performant', 'design-cost'],
    sampleQuestions: [
      {
        domain: 'design-secure',
        difficulty: 'intermediate',
        question: 'A company needs to ensure that all data stored in S3 is encrypted at rest. Which combination of services provides the most secure solution?',
        topics: ['s3-encryption', 'kms', 'security']
      },
      {
        domain: 'design-resilient',
        difficulty: 'intermediate',
        question: 'An application requires 99.99% availability across multiple AWS regions. Which architecture pattern should be used?',
        topics: ['multi-region', 'route53', 'failover']
      }
    ]
  },
  'aws-sap': {
    name: 'AWS Solutions Architect Professional',
    domains: ['design-solutions', 'design-new-solutions', 'continuous-improvement', 'accelerate-migration'],
    sampleQuestions: [
      {
        domain: 'design-solutions',
        difficulty: 'advanced',
        question: 'A multinational company needs to implement a hybrid cloud architecture with consistent identity management. How should you design the solution?',
        topics: ['hybrid-cloud', 'identity-federation', 'directory-service']
      }
    ]
  },
  
  // Kubernetes Certifications
  'cka': {
    name: 'Certified Kubernetes Administrator',
    domains: ['cluster-arch', 'workloads', 'services', 'storage', 'troubleshoot'],
    sampleQuestions: [
      {
        domain: 'cluster-arch',
        difficulty: 'intermediate',
        question: 'How do you configure etcd for high availability in a Kubernetes cluster?',
        topics: ['etcd', 'ha', 'cluster-setup']
      },
      {
        domain: 'troubleshoot',
        difficulty: 'advanced',
        question: 'A pod is stuck in CrashLoopBackOff state. What steps would you take to diagnose and resolve the issue?',
        topics: ['debugging', 'logs', 'pod-lifecycle']
      }
    ]
  },
  'ckad': {
    name: 'Certified Kubernetes Application Developer',
    domains: ['app-design', 'app-deployment', 'app-observability', 'app-environment', 'services-networking'],
    sampleQuestions: [
      {
        domain: 'app-design',
        difficulty: 'intermediate',
        question: 'How do you implement a multi-container pod pattern for a sidecar logging solution?',
        topics: ['sidecar', 'multi-container', 'logging']
      }
    ]
  },
  
  // HashiCorp Certifications
  'terraform-associate': {
    name: 'Terraform Associate',
    domains: ['iac-concepts', 'terraform-basics', 'terraform-state', 'modules', 'workflow', 'terraform-cloud'],
    sampleQuestions: [
      {
        domain: 'terraform-state',
        difficulty: 'intermediate',
        question: 'How do you migrate Terraform state from local to remote backend without losing existing resources?',
        topics: ['state-migration', 'backend', 'terraform-init']
      },
      {
        domain: 'modules',
        difficulty: 'intermediate',
        question: 'What are the best practices for structuring reusable Terraform modules?',
        topics: ['module-structure', 'inputs', 'outputs']
      }
    ]
  },
  'vault-associate': {
    name: 'Vault Associate',
    domains: ['vault-architecture', 'vault-tokens', 'vault-leases', 'auth-methods', 'vault-policies', 'secrets-engines'],
    sampleQuestions: [
      {
        domain: 'secrets-engines',
        difficulty: 'intermediate',
        question: 'How do you configure dynamic database credentials using Vault?',
        topics: ['database-secrets', 'dynamic-credentials', 'rotation']
      }
    ]
  },
  
  // GCP Certifications
  'gcp-cloud-engineer': {
    name: 'GCP Associate Cloud Engineer',
    domains: ['cloud-projects', 'planning-configuring', 'deploying-implementing', 'operations', 'access-security'],
    sampleQuestions: [
      {
        domain: 'deploying-implementing',
        difficulty: 'intermediate',
        question: 'How do you deploy a containerized application to Google Kubernetes Engine with auto-scaling?',
        topics: ['gke', 'deployment', 'hpa']
      }
    ]
  },
  'gcp-cloud-architect': {
    name: 'GCP Professional Cloud Architect',
    domains: ['design-plan', 'manage-provision', 'security-compliance', 'technical-processes', 'implementation', 'reliability'],
    sampleQuestions: [
      {
        domain: 'design-plan',
        difficulty: 'advanced',
        question: 'Design a multi-region disaster recovery solution for a critical application on GCP.',
        topics: ['dr', 'multi-region', 'spanner']
      }
    ]
  },
  
  // Azure Certifications
  'azure-administrator': {
    name: 'Azure Administrator (AZ-104)',
    domains: ['manage-identities', 'implement-storage', 'deploy-manage-compute', 'implement-networking', 'monitor-backup'],
    sampleQuestions: [
      {
        domain: 'manage-identities',
        difficulty: 'intermediate',
        question: 'How do you implement Conditional Access policies in Azure AD for secure application access?',
        topics: ['conditional-access', 'azure-ad', 'mfa']
      }
    ]
  },
  'azure-solutions-architect': {
    name: 'Azure Solutions Architect (AZ-305)',
    domains: ['design-identity', 'design-data-storage', 'design-business-continuity', 'design-infrastructure'],
    sampleQuestions: [
      {
        domain: 'design-infrastructure',
        difficulty: 'advanced',
        question: 'Design a hub-and-spoke network topology for a multi-subscription Azure environment.',
        topics: ['hub-spoke', 'vnet-peering', 'azure-firewall']
      }
    ]
  },
  
  // Security Certifications
  'comptia-security-plus': {
    name: 'CompTIA Security+',
    domains: ['threats-attacks', 'architecture-design', 'implementation', 'operations-incident', 'governance-compliance'],
    sampleQuestions: [
      {
        domain: 'threats-attacks',
        difficulty: 'intermediate',
        question: 'What is the difference between a SQL injection and a cross-site scripting (XSS) attack?',
        topics: ['sql-injection', 'xss', 'web-security']
      }
    ]
  },
  
  // Data Certifications
  'databricks-data-engineer': {
    name: 'Databricks Data Engineer Associate',
    domains: ['lakehouse-arch', 'elt-spark', 'incremental-processing', 'production-pipelines', 'data-governance'],
    sampleQuestions: [
      {
        domain: 'lakehouse-arch',
        difficulty: 'intermediate',
        question: 'Explain the medallion architecture (bronze, silver, gold) in a Databricks Lakehouse.',
        topics: ['medallion', 'delta-lake', 'data-quality']
      }
    ]
  },
  
  // AI/ML Certifications
  'tensorflow-developer': {
    name: 'TensorFlow Developer Certificate',
    domains: ['tensorflow-basics', 'building-models', 'image-classification', 'nlp-models', 'time-series'],
    sampleQuestions: [
      {
        domain: 'building-models',
        difficulty: 'intermediate',
        question: 'How do you implement transfer learning using a pre-trained model in TensorFlow?',
        topics: ['transfer-learning', 'fine-tuning', 'keras']
      }
    ]
  }
};

console.log('New channel topics defined:');
Object.keys(newChannelTopics).forEach(channel => {
  const config = newChannelTopics[channel];
  console.log(`\n${channel}:`);
  console.log(`  Name: ${config.name}`);
  console.log(`  Sub-channels: ${config.subChannels.join(', ')}`);
  console.log(`  Sample questions: ${config.sampleQuestions.length}`);
});

console.log('\n\nCertification topics defined:');
Object.keys(certificationTopics).forEach(cert => {
  const config = certificationTopics[cert];
  console.log(`\n${cert}:`);
  console.log(`  Name: ${config.name}`);
  console.log(`  Domains: ${config.domains.join(', ')}`);
  console.log(`  Sample questions: ${config.sampleQuestions.length}`);
});
