// User
export interface UserType {
  id?: string
  firstName: string
  lastName: string
  firstNameLower: string
  lastNameLower: string
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
  links: UserLink[]
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
  treesIds?: string[]
}

export type LinkStatus = "pending" | "accepted"

export interface UserLink {
  userId: string        // l'autre utilisateur
  status: LinkStatus
  senderId: string      // qui a envoyé la demande
}

// Tree (Arbre généalogique)
export interface TreeType {
  id?: string
  name: string
  description?: string
  ownerId: string // userId
  memberIds: string[] // members in the tree
  origin?: string[] // e.g. ['France', 'Italie']
  surnames?: string[]
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
  deathPlace?: string,
  birthPlace?: LocationData 
  gender?: "male" | "female" | "other"
  avatar?: string
  bio?: string
  nationality?: string | string []
  treeId: string
  mariageId?: string
  isMarried?: boolean

  parentsIds?: string[]
  childrenIds?: string[]
  brothersIds?: string[]

  createdDate?: number
  updatedDate?: number
  isActive?: boolean
}

export interface LocationData {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    displayName: string;
    countryCode?: string;
    region?: string;
    postcode?: string;
}

// Conversation (entre deux ou plusieurs users)
export interface ConversationType {
  id?: string
  participantIds: string[] // userIds
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
  lastMessage?: string
  lastMessageSenderId?: string
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
  readBy?: string[] // userIds qui ont lu le message
}

// AiMessage
export interface AiMessageType {
  id?: string
  userId: string
  role: "user" | "ai"
  content: string
  createdAt: number
}

export interface CommentDisplayType {
  author: {
    name: string
    avatar: string
  }
  content: string
  timeAgo: string
}

export interface FeedPostType {
  id?: string
  author: {
    id: string
    firstName: string
    lastName: string
    avatar: string
  }
  destinator: {
    id: string
    firstName: string
    lastName: string
    avatar: string
  }
  content: string
  timeAgo: string
  privacy: string
  likesIds: string []
  isLiked?: boolean
  isOnWall: boolean
  image?: string
  location?: string
  comments: CommentDisplayType[]
  createdAt: number
}

// Notification
export interface NotificationType {
  id?: string
  recipientId: string // userId
  senderId?: string // optional
  senderName?: string // 🔹 "Prénom Nom"
  senderAvatarUrl?: string // 🔹 photo du sender
  type: "suggestion" | "message" | "connection" | "update" | "like" | "comment"
  title: string
  message: string  
  relatedId?: string // postId, memberId, etc.
  unread: boolean
  createdDate: number
  timestamp: number
}

export interface ConnexionType {
  id: string
  senderId: string
  receiverId: string
  status: "pending" | "accepted" | "none"
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
