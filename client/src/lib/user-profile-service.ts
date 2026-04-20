/**
 * User Profile Service - Manages user job title and company preferences
 * Stored in localStorage for static site deployment
 */

export interface UserProfile {
  jobTitle: string;
  targetCompany?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'staff' | 'principal';
  interests: string[]; // channels they're interested in
  createdAt: string;
  updatedAt: string;
}

export interface JobTitleConfig {
  id: string;
  title: string;
  category: 'engineering' | 'data' | 'product' | 'design' | 'management';
  requiredChannels: string[]; // Must-know topics
  recommendedChannels: string[]; // Nice-to-have topics
  certifications: string[]; // Relevant certifications
  experienceLevels: {
    entry: { channels: string[]; difficulty: string[] };
    mid: { channels: string[]; difficulty: string[] };
    senior: { channels: string[]; difficulty: string[] };
    staff: { channels: string[]; difficulty: string[] };
    principal: { channels: string[]; difficulty: string[] };
  };
}

// Job title configurations with learning path mappings
export const JOB_TITLES: Record<string, JobTitleConfig> = {
  'frontend-engineer': {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    category: 'engineering',
    requiredChannels: ['javascript', 'react', 'html-css', 'frontend', 'web-performance'],
    recommendedChannels: ['typescript', 'testing', 'accessibility', 'design-patterns'],
    certifications: [],
    experienceLevels: {
      entry: { 
        channels: ['javascript', 'html-css', 'react'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['react', 'typescript', 'frontend', 'web-performance', 'testing'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['frontend', 'system-design', 'web-performance', 'architecture'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'architecture', 'leadership', 'frontend'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'backend-engineer': {
    id: 'backend-engineer',
    title: 'Backend Engineer',
    category: 'engineering',
    requiredChannels: ['nodejs', 'python', 'databases', 'api-design', 'system-design'],
    recommendedChannels: ['microservices', 'caching', 'message-queues', 'security'],
    certifications: [],
    experienceLevels: {
      entry: { 
        channels: ['python', 'nodejs', 'databases', 'api-design'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['databases', 'api-design', 'microservices', 'caching'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['system-design', 'microservices', 'distributed-systems', 'databases'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'distributed-systems', 'architecture', 'leadership'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'fullstack-engineer': {
    id: 'fullstack-engineer',
    title: 'Full Stack Engineer',
    category: 'engineering',
    requiredChannels: ['javascript', 'react', 'nodejs', 'databases', 'api-design'],
    recommendedChannels: ['typescript', 'system-design', 'devops', 'testing'],
    certifications: [],
    experienceLevels: {
      entry: { 
        channels: ['javascript', 'react', 'nodejs', 'databases'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['react', 'nodejs', 'databases', 'api-design', 'typescript'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['system-design', 'frontend', 'backend', 'architecture'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'devops-engineer': {
    id: 'devops-engineer',
    title: 'DevOps Engineer',
    category: 'engineering',
    requiredChannels: ['docker', 'kubernetes', 'ci-cd', 'linux', 'networking'],
    recommendedChannels: ['terraform', 'ansible', 'monitoring', 'security'],
    certifications: ['aws-solutions-architect', 'cka', 'terraform-associate'],
    experienceLevels: {
      entry: { 
        channels: ['linux', 'docker', 'ci-cd', 'git'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['kubernetes', 'docker', 'terraform', 'ci-cd', 'monitoring'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['kubernetes', 'system-design', 'sre', 'security'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'sre', 'architecture', 'leadership'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'sre': {
    id: 'sre',
    title: 'Site Reliability Engineer',
    category: 'engineering',
    requiredChannels: ['sre', 'monitoring', 'incident-response', 'system-design', 'linux'],
    recommendedChannels: ['kubernetes', 'databases', 'networking', 'security'],
    certifications: ['aws-solutions-architect', 'cka'],
    experienceLevels: {
      entry: { 
        channels: ['linux', 'monitoring', 'scripting', 'networking'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['sre', 'monitoring', 'incident-response', 'kubernetes'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['sre', 'system-design', 'distributed-systems', 'capacity-planning'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'sre', 'architecture', 'leadership'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'data-engineer': {
    id: 'data-engineer',
    title: 'Data Engineer',
    category: 'data',
    requiredChannels: ['sql', 'python', 'data-pipelines', 'etl', 'databases'],
    recommendedChannels: ['spark', 'kafka', 'airflow', 'data-modeling'],
    certifications: ['aws-data-analytics', 'gcp-data-engineer'],
    experienceLevels: {
      entry: { 
        channels: ['sql', 'python', 'databases', 'etl'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['data-pipelines', 'etl', 'spark', 'kafka', 'airflow'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['data-architecture', 'system-design', 'data-modeling', 'optimization'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['data-architecture', 'system-design', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['data-architecture', 'system-design', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'ml-engineer': {
    id: 'ml-engineer',
    title: 'ML Engineer',
    category: 'data',
    requiredChannels: ['machine-learning', 'python', 'algorithms', 'data-structures'],
    recommendedChannels: ['deep-learning', 'mlops', 'model-deployment', 'feature-engineering'],
    certifications: ['aws-ml-specialty', 'tensorflow-developer'],
    experienceLevels: {
      entry: { 
        channels: ['python', 'machine-learning', 'algorithms', 'statistics'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['machine-learning', 'deep-learning', 'mlops', 'model-deployment'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['ml-systems', 'system-design', 'model-optimization', 'research'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['ml-architecture', 'system-design', 'leadership', 'research'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['ml-architecture', 'system-design', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  },
  'cloud-architect': {
    id: 'cloud-architect',
    title: 'Cloud Architect',
    category: 'engineering',
    requiredChannels: ['aws', 'system-design', 'networking', 'security'],
    recommendedChannels: ['kubernetes', 'terraform', 'cost-optimization', 'compliance'],
    certifications: ['aws-solutions-architect', 'azure-solutions-architect', 'gcp-architect'],
    experienceLevels: {
      entry: { 
        channels: ['aws', 'networking', 'security', 'linux'], 
        difficulty: ['beginner', 'intermediate'] 
      },
      mid: { 
        channels: ['aws', 'system-design', 'networking', 'security', 'terraform'], 
        difficulty: ['intermediate', 'advanced'] 
      },
      senior: { 
        channels: ['system-design', 'cloud-architecture', 'security', 'cost-optimization'], 
        difficulty: ['advanced'] 
      },
      staff: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      },
      principal: { 
        channels: ['system-design', 'architecture', 'leadership', 'strategy'], 
        difficulty: ['advanced'] 
      }
    }
  }
};

const PROFILE_KEY = 'user-profile';

/**
 * Get user profile from localStorage
 */
export function getUserProfile(): UserProfile | null {
  try {
    const data = localStorage.getItem(PROFILE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Error loading user profile:', e);
    return null;
  }
}

/**
 * Save user profile to localStorage
 */
export function saveUserProfile(profile: UserProfile): void {
  try {
    const updated = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving user profile:', e);
  }
}

/**
 * Create a new user profile
 */
export function createUserProfile(
  jobTitle: string,
  experienceLevel: UserProfile['experienceLevel'],
  targetCompany?: string,
  interests: string[] = []
): UserProfile {
  const profile: UserProfile = {
    jobTitle,
    targetCompany,
    experienceLevel,
    interests,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  saveUserProfile(profile);
  return profile;
}

/**
 * Update user profile
 */
export function updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
  const current = getUserProfile();
  if (!current) return null;
  
  const updated = { ...current, ...updates };
  saveUserProfile(updated);
  return updated;
}

/**
 * Clear user profile
 */
export function clearUserProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * Get personalized learning path based on job title and experience
 */
export function getPersonalizedLearningPath(profile: UserProfile): {
  channels: string[];
  difficulty: string[];
  certifications: string[];
  priority: 'required' | 'recommended';
}[] {
  const jobConfig = JOB_TITLES[profile.jobTitle];
  if (!jobConfig) {
    return [];
  }
  
  const levelConfig = jobConfig.experienceLevels[profile.experienceLevel];
  
  return [
    {
      channels: jobConfig.requiredChannels.filter(ch => 
        levelConfig.channels.includes(ch)
      ),
      difficulty: levelConfig.difficulty,
      certifications: jobConfig.certifications,
      priority: 'required' as const
    },
    {
      channels: jobConfig.recommendedChannels.filter(ch => 
        levelConfig.channels.includes(ch)
      ),
      difficulty: levelConfig.difficulty,
      certifications: [],
      priority: 'recommended' as const
    }
  ];
}

/**
 * Get all available job titles
 */
export function getAvailableJobTitles(): JobTitleConfig[] {
  return Object.values(JOB_TITLES);
}

/**
 * Get job title config by ID
 */
export function getJobTitleConfig(jobTitleId: string): JobTitleConfig | null {
  return JOB_TITLES[jobTitleId] || null;
}
