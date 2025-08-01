// User
export interface UserType {
  id?: string
  firstName: string
  lastName: string
  birthDate?: number // timestamp
  nationality?: string
  bio? : string,
  phoneNumber?: string,
  localisation?: string,
  oldestAncestor?: string,
  avatarUrl?: string
  email: string
  familyOrigin? : string
  researchInterests?: string
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
}

// Tree (Arbre généalogique)
export interface TreeType {
  id?: string
  name: string
  description?: string
  ownerId: string // userId
  memberIds: string[] // members in the tree
  origin?: string[] // e.g. ['France', 'Italie']
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
}

// Family Member (nœud de l'arbre)
export interface MemberType {
  id?: string
  firstName: string
  lastName: string
  birthDate?: number
  deathDate?: number
  birthPlace?: string
  gender?: "male" | "female" | "other"
  avatar?: string
  bio?: string
  nationality?: string
  treeId: string
  mariageId?: string
  isMarried: boolean

  parentsIds?: string[]
  childrenIds?: string[]
  brothersIds?: string[]

  createdDate?: number
  updatedDate?: number
  isActive?: boolean
}

// Conversation (entre deux ou plusieurs users)
export interface ConversationType {
  id?: string
  participantIds: string[] // userIds
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
}

// Message
export interface MessageType {
  id?: string
  conversationId: string
  senderId: string
  text?: string
  mediaUrl?: string
  createdDate: number
  isRead?: boolean
}

// Feed post (publication de l’utilisateur)
export interface FeedPostType {
  id?: string
  authorId: string
  text?: string
  mediaUrls?: string[]
  createdDate: number
  updatedDate?: number
  likes?: string[] // userIds
  comments?: CommentType[]
  isActive?: boolean
}

// Commentaire dans un post
export interface CommentType {
  userId: string
  text: string
  createdDate: number
}

// Notification
export interface NotificationType {
  id?: string
  recipientId: string // userId
  senderId?: string // optional
  type: "message" | "tree-invite" | "connection" | "like" | "comment"
  content: string
  relatedId?: string // postId, memberId, etc.
  isRead: boolean
  createdDate: number
}

export interface Files {
  id: string
  associatedFolder: string
  createdBy: string
  fileUrl: string
  fileName: string
  fileType: string
  size: number
}
