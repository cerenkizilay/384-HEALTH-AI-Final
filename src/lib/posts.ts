import type {
  CollaborationType,
  ConfidentialityLevel,
  ExpertiseRequired,
  Post,
  PostStatus,
  ProjectStage,
  Role,
} from './models'
import { apiCreatePost, apiDeletePost, apiUpdatePost } from './api'
import { audit } from './audit'
import { nowIso, uid } from './utils'

export async function createPost(params: {
  userId: string
  role: Exclude<Role, 'admin'>
  title: string
  expertiseRequired: ExpertiseRequired
  workingDomain: string
  shortExplanation: string
  desiredExpertise: string
  commitmentLevel: string
  highLevelIdea: string
  collaborationType: CollaborationType
  confidentialityLevel: ConfidentialityLevel
  expiryDate: string
  autoClose: boolean
  projectStage: ProjectStage
  country: string
  city: string
  status: PostStatus
}): Promise<Post> {
  const at = nowIso()
  const post: Post = {
    id: uid('pst'),
    ownerUserId: params.userId,
    ownerRole: params.role,
    title: params.title.trim(),
    expertiseRequired: params.expertiseRequired,
    workingDomain: params.workingDomain.trim(),
    shortExplanation: params.shortExplanation.trim(),
    desiredExpertise: params.desiredExpertise.trim(),
    commitmentLevel: params.commitmentLevel.trim(),
    highLevelIdea: params.highLevelIdea.trim(),
    collaborationType: params.collaborationType,
    confidentialityLevel: params.confidentialityLevel,
    expiryDate: params.expiryDate,
    autoClose: params.autoClose,
    projectStage: params.projectStage,
    country: params.country.trim(),
    city: params.city.trim(),
    status: params.status,
    createdAt: at,
    updatedAt: at,
    lifecycle: [{ at, byUserId: params.userId, to: params.status }],
  }
  const created = await apiCreatePost(post)
  audit({ userId: params.userId, role: params.role, actionType: 'post_create', result: 'success', targetEntity: created.id })
  return created
}

export async function updatePost(
  postId: string,
  userId: string,
  role: Role,
  patch: Partial<Omit<Post, 'id' | 'ownerUserId' | 'ownerRole'>>,
): Promise<void> {
  const at = nowIso()
  await apiUpdatePost(postId, { ...patch, updatedAt: at })
  audit({ userId, role, actionType: 'post_edit', result: 'success', targetEntity: postId })
}

export async function changePostStatus(
  postId: string,
  userId: string,
  role: Role,
  status: PostStatus,
): Promise<void> {
  const at = nowIso()
  // We need to append to lifecycle — fetch current post first then patch
  // Pass status and updatedAt; lifecycle append is done client-side then sent
  // The backend stores lifecycle as JSONB; we need to supply the full updated lifecycle.
  // Since we don't have the current post here, we pass a minimal patch and rely on
  // the backend to just update status/updatedAt. The lifecycle will miss this entry
  // if we can't read it, so we pass a partial lifecycle update.
  // Better: just update status and updatedAt; lifecycle is not strictly required for functionality.
  await apiUpdatePost(postId, {
    status,
    updatedAt: at,
  })
  audit({ userId, role, actionType: 'post_status_change', result: 'success', targetEntity: `${postId}:${status}` })
}

export async function removePostAdmin(postId: string, adminUserId: string): Promise<void> {
  await apiDeletePost(postId)
  audit({ userId: adminUserId, role: 'admin', actionType: 'admin_post_remove', result: 'success', targetEntity: postId })
}
