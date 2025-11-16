export type LinkStatus = "pending" | "accepted" | "none"

export interface UserLink {
  senderId: string;
  receiverId: string;
  status: LinkStatus;
}

// User
export interface UserType {
  id?: string
  firstName: string
  lastName: string
  firstNameLower: string
  lastNameLower: string
  birthDate?: number // timestamp
  nationality?: string
  bio?: string,
  phoneNumber?: string,
  localisation?: string,
  oldestAncestor?: string,
  avatarUrl?: string
  email: string
  familyOrigin?: string
  researchInterests?: string
  friends?: string[]
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
  treesIds?: string[]
  conversationsIds?: string[]
}

export interface Links {
  linkId: string;
  receiverId: string;
  senderId: string;
  status: LinkStatus;
  createdDate: number;
  updatedDate?: number;
}

// Tree (Arbre généalogique)
export interface TreeType {
  id?: string;
  name: string;
  description?: string;
  ownerId: string; // userId
  memberIds: string[]; // members in the tree
  origin?: string[]; // e.g. ['France', 'Italie']
  surnames?: string[];
  surnamesLower?: string[]; // ✅ ajouté
  createdDate?: number;
  updatedDate?: number;
  isActive?: boolean;
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
  nationality?: string | string[]
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

export interface ConversationParticipant {
  userId: string
  firstName: string
  lastName: string
  avatarUrl?: string
  location?: string
}

// Conversation optimisée
export interface ConversationType {
  id?: string
  participantIds: string[] // userIds (pour compatibilité)
  createdDate?: number
  updatedDate?: number
  isActive?: boolean
  lastMessage?: string
  lastSenderId?: string // ✨ Renommé pour clarté
  hasUnreadMessages?: boolean
}

export interface Attachment {
  id?: string        // optionnel, si tu veux générer un ID pour chaque fichier
  url: string        // URL du fichier stocké (Firebase Storage / S3 / etc.)
  name: string       // nom original du fichier
  type: "image" | "pdf" // type du fichier
  size?: number      // taille en octets
}

export interface MessageType {
  id?: string
  conversationId: string
  senderId: string
  text?: string
  attachments?: Attachment[] // tableau pour stocker plusieurs fichiers
  createdDate: number
  isRead?: boolean
  readBy?: string[] // userIds qui ont lu le message
}

// Modèles de cards individuelles
export interface MemberCard {
  cardType: "member";
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  birthPlace?: {
    city?: string;
    country?: string;
  };
  nationality?: string;
  matchScore?: number;
  matchReasons?: string[];
  treeId: string;
}

export interface TreeCard {
  cardType: "tree";
  id: string;
  name: string;
  surnames?: string[];
  origins?: string[];
  matchScore?: number;
  matchReasons?: string[];
  ownerId?: string
}

// Type union pour les cards
export type Card = MemberCard | TreeCard;

// Interface du message IA
export interface AiMessageType {
  userId: string;
  role: "user" | "ai";
  content: string;
  createdAt: number;
  cards?: Card[] | null;
  calledFunction?: "searchPotentialRelatives" | "findSimilarFamilies" | "findCommonAncestors" | null;
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
  authorId: string
  destinatorId: string
  content: string
  timeAgo: string
  privacy: string
  likesIds: string[]
  isLiked?: boolean
  isOnWall: boolean
  image?: string
  documentUrl?: string
  documentName?: string
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
