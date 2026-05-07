export type Role = 'engineer' | 'healthcare' | 'admin'

export type PostStatus = 'draft' | 'active' | 'meeting_scheduled' | 'closed' | 'expired'

export type ConfidentialityLevel = 'public_pitch' | 'meeting_only'

export type ProjectStage =
  | 'idea'
  | 'concept_validation'
  | 'prototype_developed'
  | 'pilot_testing'
  | 'pre_deployment'

export type CollaborationType = 'advisor' | 'co_founder' | 'research_partner'

export type ExpertiseRequired = 'medical' | 'engineering'

export type User = {
  id: string
  email: string
  name: string
  role: Role
  verified: boolean
  suspended: boolean
  createdAt: string
}

export type Post = {
  id: string
  ownerUserId: string
  ownerRole: Exclude<Role, 'admin'>
  title: string
  expertiseRequired: ExpertiseRequired
  workingDomain: string
  shortExplanation: string
  desiredExpertise: string
  commitmentLevel: string
  highLevelIdea: string
  collaborationType: CollaborationType
  confidentialityLevel: ConfidentialityLevel
  expiryDate: string // ISO date
  autoClose: boolean
  projectStage: ProjectStage
  country: string
  city: string
  status: PostStatus
  createdAt: string
  updatedAt: string
  lifecycle: Array<{ at: string; byUserId: string; to: PostStatus }>
}

export type InterestMessage = {
  id: string
  postId: string
  fromUserId: string
  toUserId: string
  message: string
  createdAt: string
}

export type MeetingRequestStatus = 'pending' | 'accepted' | 'declined' | 'cancelled'

export type MeetingRequest = {
  id: string
  postId: string
  fromUserId: string
  toUserId: string
  ndaAccepted: boolean
  proposedSlots: string[] // ISO datetime strings
  selectedSlot?: string // ISO datetime string
  status: MeetingRequestStatus
  createdAt: string
  updatedAt: string
}

export type ChatMessage = {
  id: string
  meetingId: string
  fromUserId: string
  text: string
  createdAt: string
}

export type AuditActionType =
  | 'login'
  | 'logout'
  | 'failed_login'
  | 'register'
  | 'verify_email'
  | 'post_create'
  | 'post_edit'
  | 'post_status_change'
  | 'meeting_request_create'
  | 'meeting_request_update'
  | 'admin_post_remove'
  | 'admin_user_suspend'
  | 'admin_user_unsuspend'
  | 'security_event'

export type AuditLog = {
  id: string
  at: string
  userId?: string
  role?: Role
  actionType: AuditActionType
  targetEntity?: string
  result: 'success' | 'failure'
  ipAddress?: string
  details?: string
}

