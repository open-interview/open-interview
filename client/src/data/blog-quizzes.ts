export interface BlogQuizQuestion {
  id: string;
  prompt: string;
  hint: string;
}

export interface BlogQuiz {
  slug: string;
  questions: BlogQuizQuestion[];
}

export const blogQuizzes: Record<string, BlogQuiz> = {
  'aws-solutions-architect-tips': {
    slug: 'aws-solutions-architect-tips',
    questions: [
      {
        id: 'q1',
        prompt: 'Name three core pillars of the AWS Well-Architected Framework and briefly explain each one.',
        hint: 'Think: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization.',
      },
      {
        id: 'q2',
        prompt: 'What is the difference between horizontal and vertical scaling on AWS? Give an example of each.',
        hint: 'Horizontal = add more instances (EC2 Auto Scaling). Vertical = upgrade instance size (e.g., t3.medium → m5.large).',
      },
      {
        id: 'q3',
        prompt: 'Explain the purpose of an Availability Zone and why distributing resources across multiple AZs matters.',
        hint: 'AZs are isolated data centres within a region. Multi-AZ protects against single-point failures.',
      },
    ],
  },
  'blog-1766674305590-ncl9qn': {
    slug: 'blog-1766674305590-ncl9qn',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the key structural difference between a REST API and a GraphQL API?',
        hint: 'REST uses multiple endpoints, one per resource. GraphQL exposes a single endpoint and lets the client specify exactly which fields it needs.',
      },
      {
        id: 'q2',
        prompt: 'Describe a situation where you would prefer REST over GraphQL.',
        hint: 'Think: simple CRUD, caching needs (HTTP cache), public APIs, or teams unfamiliar with GraphQL.',
      },
      {
        id: 'q3',
        prompt: 'What is the N+1 query problem in GraphQL and how is it typically solved?',
        hint: 'N+1 = fetching a list, then making one extra DB call per item. Solved by DataLoader (batching) or server-side query planning.',
      },
    ],
  },
  'blog-1766675309405-7p8k4s': {
    slug: 'blog-1766675309405-7p8k4s',
    questions: [
      {
        id: 'q1',
        prompt: 'Name two common algorithms for implementing rate limiting and describe how they differ.',
        hint: 'Token Bucket (bursty traffic OK) vs Leaky Bucket (smooth output) vs Sliding Window (precise per-period).',
      },
      {
        id: 'q2',
        prompt: 'How do distributed systems typically share rate-limit state across multiple servers?',
        hint: 'Central counter store (Redis), sticky sessions, or a sidecar/gateway layer.',
      },
      {
        id: 'q3',
        prompt: 'What HTTP status code should a rate-limited request return and which header conveys retry information?',
        hint: '429 Too Many Requests. The Retry-After header tells the client when to try again.',
      },
    ],
  },
  'blog-1766676477930-9i8oki': {
    slug: 'blog-1766676477930-9i8oki',
    questions: [
      {
        id: 'q1',
        prompt: 'What problem does Docker solve compared to traditional VM-based deployment?',
        hint: 'Containers share the host OS kernel — lighter than VMs, faster to start, consistent across environments.',
      },
      {
        id: 'q2',
        prompt: 'What is the difference between a Docker image and a Docker container?',
        hint: 'Image = read-only blueprint. Container = a running instance of that image.',
      },
      {
        id: 'q3',
        prompt: 'Explain the purpose of a multi-stage Docker build.',
        hint: 'Separate build dependencies from runtime dependencies — results in much smaller final images.',
      },
    ],
  },
  'blog-1766680384332-d5ry73': {
    slug: 'blog-1766680384332-d5ry73',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the fundamental difference between a relational (SQL) database and a document (NoSQL) database?',
        hint: 'SQL: structured tables, fixed schema, ACID. Document: flexible schema, nested data, horizontal scale.',
      },
      {
        id: 'q2',
        prompt: 'Describe a workload that would benefit from a time-series database over a general-purpose one.',
        hint: 'Metrics, IoT sensor data, financial ticks — data is always inserted in time order and queried by time range.',
      },
      {
        id: 'q3',
        prompt: 'What is CAP theorem and which two of the three properties can a distributed database guarantee?',
        hint: 'Consistency, Availability, Partition Tolerance — pick any two under network partitions.',
      },
    ],
  },
  'kubernetes-for-developers': {
    slug: 'kubernetes-for-developers',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the role of a Kubernetes Pod and how does it differ from a container?',
        hint: 'A Pod is the smallest deployable unit. It wraps one or more containers that share network namespace and storage.',
      },
      {
        id: 'q2',
        prompt: 'Explain the purpose of a Kubernetes Service and name two common Service types.',
        hint: 'Services provide stable network endpoints. Types: ClusterIP (internal), NodePort (host port), LoadBalancer (cloud LB).',
      },
      {
        id: 'q3',
        prompt: 'What does a Kubernetes Deployment manage and what happens when you update an image tag?',
        hint: 'Deployments manage ReplicaSets. An image update triggers a rolling rollout — new pods come up, old ones go down.',
      },
    ],
  },
  'gh-103': {
    slug: 'gh-103',
    questions: [
      {
        id: 'q1',
        prompt: 'What is a self-healing system and name two mechanisms Kubernetes uses to achieve it?',
        hint: 'Liveness probes restart failing containers. Replica controllers reschedule pods on healthy nodes.',
      },
      {
        id: 'q2',
        prompt: 'How does circuit breaking prevent cascading failures in a distributed system?',
        hint: 'A circuit breaker detects repeated failures and short-circuits calls to the failing service, giving it time to recover.',
      },
      {
        id: 'q3',
        prompt: 'What is exponential backoff and why is it preferred over fixed-interval retries?',
        hint: 'Exponential backoff doubles the wait time on each retry, reducing thundering herd problems on overloaded services.',
      },
    ],
  },
  'da-156': {
    slug: 'da-156',
    questions: [
      {
        id: 'q1',
        prompt: 'What is the difference between TRUNCATE and DELETE in SQL, and why does the distinction matter for safety?',
        hint: 'TRUNCATE cannot be easily rolled back, removes all rows instantly, and bypasses row-level triggers. DELETE is transactional.',
      },
      {
        id: 'q2',
        prompt: 'Name two database-level controls that can prevent accidental destructive operations.',
        hint: 'Role-based permissions, read-only replicas for analytics, confirm flags, or requiring two-phase approval for DDL.',
      },
      {
        id: 'q3',
        prompt: 'How does a backup retention policy reduce the blast radius of a data loss incident?',
        hint: 'Point-in-time recovery and snapshot frequency determine how far back you can restore and how much data you can lose (RPO).',
      },
    ],
  },
};
