export interface Subtopic {
  id: string
  name: string
  description: string
  questionIds: string[]
}

export interface ChannelPlan {
  channelId: string
  name: string
  description: string
  icon: string
  color: string
  category: string
  prerequisites: string[]
  subtopics: Subtopic[]
  estimatedWeeks: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
}

export interface UserEnrollment {
  enrolledChannels: string[]
  enrolledCerts: string[]
  droppedChannels: string[]
  createdAt: string
  updatedAt: string
}
