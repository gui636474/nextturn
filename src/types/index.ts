// =====================================================================
// NEXTTURN — TIPOS E INTERFACES TYPESCRIPT
// =====================================================================

export type UserRole = 'user' | 'admin' | 'superadmin'
export type RoomType = 'public' | 'private' | 'restricted'
export type RoomStatus = 'active' | 'expired' | 'closed'
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected'
export type ReportPriority = 'low' | 'medium' | 'high'
export type ReportTarget = 'user' | 'character' | 'message' | 'room' | 'community' | 'content'
export type MemberRole = 'owner' | 'admin' | 'moderator' | 'member'
export type MessageMode = 'character' | 'narrator'
export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'url' | 'image'
export type Pronoun = 'Ele/Dele' | 'Ela/Dela' | 'Eles/Deles' | 'Qualquer' | string

export interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  banner_url: string | null
  role: UserRole
  is_suspended: boolean
  suspended_until: string | null
  suspend_reason?: string | null
  is_banned: boolean
  ban_reason?: string | null
  created_at: string
  updated_at: string
}

export interface Character {
  id: string
  user_id: string
  name: string
  surname: string | null
  nickname: string | null
  age: number
  pronoun: Pronoun
  avatar_url: string | null
  personality: string | null
  appearance: string | null
  history: string | null
  biography: string | null
  extra_info: string | null
  is_public: boolean
  created_at: string
  updated_at: string
  profile?: Profile
}

export interface SchemaFieldOption {
  label: string
  value: string
}

export interface SchemaField {
  id: string
  name: string
  label: string
  type: FieldType
  required: boolean
  description: string | null
  placeholder: string | null
  options: string[] | null
  max_length: number | null
  section: string | null
  order: number
}

export interface CommunitySheetSchema {
  id: string
  community_id: string
  version: number
  name: string
  description: string | null
  fields: SchemaField[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CommunitySheetSubmission {
  id: string
  character_id: string
  community_id: string
  schema_id: string
  schema_version: number
  schema_snapshot: SchemaField[]
  data: Record<string, any>
  is_public: boolean
  created_at: string
  updated_at: string
  character?: Character
  schema?: CommunitySheetSchema
}

export interface Community {
  id: string
  name: string
  slug: string
  description: string | null
  avatar_url: string | null
  cover_url: string | null
  category: string
  fandom: string | null
  rules: string | null
  owner_id: string
  member_count: number
  is_active: boolean
  created_at: string
  updated_at: string
  owner?: Profile
  user_role?: MemberRole | null
  active_schema?: CommunitySheetSchema | null
}

export interface CommunityMember {
  id: string
  community_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
}

export interface Room {
  id: string
  name: string
  description: string | null
  cover_url: string | null
  community_id: string | null
  category: string
  type: RoomType
  status: RoomStatus
  max_participants: number
  participant_count: number
  owner_id: string
  expires_at: string
  created_at: string
  updated_at: string
  owner?: Profile
  community?: Community
  user_character?: Character | null
  user_is_member?: boolean
}

export interface RoomMember {
  id: string
  room_id: string
  user_id: string
  character_id: string
  joined_at: string
  profile?: Profile
  character?: Character
}

export interface MessageReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

export interface Message {
  id: string
  room_id: string
  user_id: string
  character_id: string | null
  mode: MessageMode
  content: string
  reply_to_id: string | null
  mentions: string[]
  is_edited: boolean
  is_deleted: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  character?: Character | null
  profile?: Profile
  reply_to?: Message | null
  reactions?: MessageReaction[]
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  target_type: ReportTarget
  target_id: string
  category: string
  reason: string
  description: string | null
  status: ReportStatus
  priority: ReportPriority
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  reporter?: Profile
  target_details?: any
}

export interface ModerationAction {
  id: string
  report_id: string | null
  moderator_id: string
  target_type: string
  target_id: string
  action: string
  reason: string
  expires_at: string | null
  created_at: string
  moderator?: Profile
}
