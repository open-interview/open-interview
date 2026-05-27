import type { UserEnrollment } from '@/types/enrollment'

const ENROLLMENT_KEY = 'oi-user-enrollment'
const ENROLLMENT_VERSION_KEY = 'oi-enrollment-version'

export const CHANNELS_WITH_DATA = [
  'algorithms', 'backend', 'behavioral', 'database',
  'devops', 'frontend', 'generative-ai', 'system-design',
]

const DEFAULT_ENROLLMENT: UserEnrollment = {
  enrolledChannels: [],
  enrolledCerts: [],
  droppedChannels: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

export function getEnrollment(): UserEnrollment {
  try {
    const raw = localStorage.getItem(ENROLLMENT_KEY)
    if (raw) {
      const enrollment = { ...DEFAULT_ENROLLMENT, ...JSON.parse(raw) }
      migrateEnrollment(enrollment)
      return enrollment
    }
  } catch {}

  const enrollment = { ...DEFAULT_ENROLLMENT }
  enrollment.enrolledChannels = [...CHANNELS_WITH_DATA]
  localStorage.setItem(ENROLLMENT_VERSION_KEY, '1')
  saveEnrollment(enrollment)
  return enrollment
}

function migrateEnrollment(e: UserEnrollment) {
  if (localStorage.getItem(ENROLLMENT_VERSION_KEY)) return
  for (const ch of CHANNELS_WITH_DATA) {
    if (!e.enrolledChannels.includes(ch) && !e.droppedChannels.includes(ch)) {
      e.enrolledChannels.push(ch)
    }
  }
  localStorage.setItem(ENROLLMENT_VERSION_KEY, '1')
}

export function saveEnrollment(enrollment: UserEnrollment) {
  enrollment.updatedAt = new Date().toISOString()
  localStorage.setItem(ENROLLMENT_KEY, JSON.stringify(enrollment))
}

export function enrollChannel(channelId: string) {
  const e = getEnrollment()
  if (!e.enrolledChannels.includes(channelId)) {
    e.enrolledChannels.push(channelId)
  }
  e.droppedChannels = e.droppedChannels.filter(id => id !== channelId)
  saveEnrollment(e)
}

export function dropChannel(channelId: string) {
  const e = getEnrollment()
  e.enrolledChannels = e.enrolledChannels.filter(id => id !== channelId)
  if (!e.droppedChannels.includes(channelId)) {
    e.droppedChannels.push(channelId)
  }
  saveEnrollment(e)
}

export function enrollCert(certId: string) {
  const e = getEnrollment()
  if (!e.enrolledCerts.includes(certId)) {
    e.enrolledCerts.push(certId)
  }
  saveEnrollment(e)
}

export function dropCert(certId: string) {
  const e = getEnrollment()
  e.enrolledCerts = e.enrolledCerts.filter(id => id !== certId)
  saveEnrollment(e)
}

export function isEnrolled(channelId: string): boolean {
  return getEnrollment().enrolledChannels.includes(channelId)
}

export function isCertEnrolled(certId: string): boolean {
  return getEnrollment().enrolledCerts.includes(certId)
}

export function getEnrolledChannels(): string[] {
  return getEnrollment().enrolledChannels
}

export function getEnrolledCerts(): string[] {
  return getEnrollment().enrolledCerts
}
