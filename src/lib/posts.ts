import type {
  CollaborationType,
  ConfidentialityLevel,
  ExpertiseRequired,
  Post,
  PostStatus,
  ProjectStage,
  Role,
} from './models'
import { audit } from './audit'
import { db } from './db'
import { nowIso, uid } from './utils'

export function createPost(params: {
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
}) {
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
  db.update((d) => {
    d.posts.unshift(post)
  })
  audit({ userId: params.userId, role: params.role, actionType: 'post_create', result: 'success', targetEntity: post.id })
  return post
}

export function updatePost(postId: string, userId: string, role: Role, patch: Partial<Omit<Post, 'id' | 'ownerUserId' | 'ownerRole'>>) {
  const at = nowIso()
  db.update((d) => {
    const idx = d.posts.findIndex((p) => p.id === postId)
    if (idx < 0) throw new Error('Post not found.')
    const cur = d.posts[idx]
    if (role !== 'admin' && cur.ownerUserId !== userId) throw new Error('You can only edit your own posts.')
    d.posts[idx] = { ...cur, ...patch, updatedAt: at }
  })
  audit({ userId, role, actionType: 'post_edit', result: 'success', targetEntity: postId })
}

export function changePostStatus(postId: string, userId: string, role: Role, status: PostStatus) {
  const at = nowIso()
  db.update((d) => {
    const idx = d.posts.findIndex((p) => p.id === postId)
    if (idx < 0) throw new Error('Post not found.')
    const cur = d.posts[idx]
    if (role !== 'admin' && cur.ownerUserId !== userId) throw new Error('You can only change status for your own posts.')
    d.posts[idx] = {
      ...cur,
      status,
      updatedAt: at,
      lifecycle: [...cur.lifecycle, { at, byUserId: userId, to: status }],
    }
  })
  audit({ userId, role, actionType: 'post_status_change', result: 'success', targetEntity: `${postId}:${status}` })
}

export function removePostAdmin(postId: string, adminUserId: string) {
  db.update((d) => {
    d.posts = d.posts.filter((p) => p.id !== postId)
  })
  audit({ userId: adminUserId, role: 'admin', actionType: 'admin_post_remove', result: 'success', targetEntity: postId })
}

