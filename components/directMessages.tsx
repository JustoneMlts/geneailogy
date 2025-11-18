"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import {
  listenUserConversations,
  listenConversationMessages,
  sendMessage as sendMessageCtrl,
  markConversationAsRead,
  createOrGetConversation,
} from "@/app/controllers/messagesController"
import { ConversationType, MessageType, UserType, ConversationParticipant, Attachment } from "@/lib/firebase/models"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"
import {
  Search,
  Send,
  MoreVertical,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  ThumbsUp,
  MessageCircle,
  ArrowLeft,
  Edit
} from "lucide-react"
import { markMessagesNotificationsAsRead } from "@/app/controllers/notificationsController"
import MessagesSkeleton from "./messagesSkeleton"
import { getUsersByFriendsIds, getUsersByIds } from "@/app/controllers/usersController"
import { motion, AnimatePresence } from "framer-motion"
import EmojiPicker from "emoji-picker-react"
import { uploadFileToStorage } from "@/lib/firebase/firebase-functions"
import { useAppSelector } from "@/lib/redux/hooks"
import { selectFriends } from "@/lib/redux/slices/friendsSlice"
import { set } from "lodash"

interface MessageWithAvatar extends MessageType {
  showAvatar: boolean
}


export const DirectMessages: React.FC = () => {
  const currentUser = useSelector(selectUser) as UserType | null
  const [conversations, setConversations] = useState<ConversationType[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [queryText, setQueryText] = useState<string>("")
  const [messageText, setMessageText] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false)
  const [isLoadingFriends, setIsLoadingFriends] = useState<boolean>(false)
  const [minimumDelayDone, setMinimumDelayDone] = useState<boolean>(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const friends = useAppSelector(selectFriends) as UserType[] | null;
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const hasSelectedInitial = useRef(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumDelayDone(true)
    }, 200);

    return () => clearTimeout(timer);
  }, [friends]);


  useEffect(() => {
    if (!currentUser?.id) return
    markMessagesNotificationsAsRead(currentUser.id)
  }, [currentUser?.id])

  useEffect(() => {
    if (!currentUser?.id) return

    const unsub = listenUserConversations(currentUser.id, (convs: ConversationType[]) => {
      setConversations(convs)
      setIsLoading(false)

      if (!hasSelectedInitial.current && convs.length > 0) {
        setSelectedConversation(convs[0])
        hasSelectedInitial.current = true
      } else if (selectedConversation) {
        const updated = convs.find((c) => c.id === selectedConversation.id)
        if (updated) setSelectedConversation(updated)
      }
    })

    return () => unsub()
  }, [currentUser?.id])

  useEffect(() => {
    console.log("Selected conversation changed:", selectedConversation)
  }, [selectedConversation])

  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) {
      setMessages([])
      return
    }

    const unsub = listenConversationMessages(selectedConversation.id, (msgs: MessageType[]) => {
      setMessages(msgs)
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth"
        })
      }, 50)
    })

    markConversationAsRead(selectedConversation.id, currentUser.id)
    markMessagesNotificationsAsRead(currentUser.id)
    return () => unsub()
  }, [selectedConversation?.id, currentUser?.id])

  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) return
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.senderId !== currentUser.id) {
      markConversationAsRead(selectedConversation.id, currentUser.id)
      markMessagesNotificationsAsRead(currentUser.id)
    }
  }, [messages, selectedConversation?.id, currentUser?.id])

  const messagesWithAvatarFlag = useMemo<MessageWithAvatar[]>(() => {
    return messages.map((m: MessageType, idx: number) => {
      const prev = messages[idx - 1]
      const showAvatar = !prev || prev.senderId !== m.senderId
      return { ...m, showAvatar }
    })
  }, [messages])

  const getOtherParticipant = (conv: ConversationType, userId: string): UserType | undefined => {
    const otherUserId = conv.participantIds?.find((otherUserId: string) => otherUserId !== userId)
    return friends?.find((f => f.id === otherUserId)) || undefined
  }

  const getSenderParticipant = (senderId: string): UserType | undefined => {
    return friends?.find((f => f.id === senderId)) || undefined
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handlePaperclipClick = () => {
    fileInputRef.current?.click()
  }

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const uploaded = await Promise.all(
      Array.from(files).map(async (file) => {
        const url = await uploadFileToStorage(file, file.type.startsWith("image/") ? "feed-images" : "feed-documents");
        return {
          url,
          name: file.name,
          type: mapFileType(file.type, file.name),
          size: file.size,
        } as Attachment;
      })
    );

    setAttachments((prev) => [...prev, ...uploaded])
    e.target.value = ""
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleEmojiClick = (emojiObject: any) => {
    setMessageText((prev) => prev + emojiObject.emoji)
    setShowEmojiPicker(false)
  }

  function mapFileType(mimeType: string, fileName: string): "image" | "pdf" {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType === "application/pdf") return "pdf";

    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "pdf";
    if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "jfif"].includes(ext || "")) return "image";

    throw new Error("Unsupported file type: " + fileName);
  }

  const handleSendMessage = async (): Promise<void> => {
    if ((!messageText.trim() && attachments.length === 0) || !selectedConversation || !currentUser?.id) return;

    const uploadedAttachments: Attachment[] = attachments.map((file) => ({
      url: file.url,
      name: file.name,
      type: mapFileType(file.type, file.name),
      size: file.size,
    }));

    const msg: Omit<MessageType, "id"> = {
      conversationId: selectedConversation.id!,
      senderId: currentUser.id,
      createdDate: Date.now(),
      attachments: uploadedAttachments,
      ...(messageText.trim() && { text: messageText.trim() }),
    };

    try {
      await sendMessageCtrl(msg);
      setMessageText("");
      setAttachments([]);
    } catch (err) {
      console.error("send message failed", err);
    }
  };

  const filteredConversations = useMemo<ConversationType[]>(() => {
    if (!queryText.trim()) return conversations
    const q = queryText.toLowerCase()
    return conversations.filter((conv: ConversationType) => {
      const other = getOtherParticipant(conv, currentUser?.id || "")
      if (!other) return false
      const fullName = `${other.firstName} ${other.lastName}`.toLowerCase()
      return fullName.includes(q)
    })
  }, [conversations, queryText, currentUser?.id])

  const filteredFriends = useMemo<UserType[] | null>(() => {
    if (!queryText.trim()) return friends
    if (!friends) return null
    const q = queryText.toLowerCase()
    return friends.filter((friend) => {
      const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase()
      return fullName.includes(q)
    })
  }, [friends, queryText])

  const formatLastMessageTime = (timestamp?: number): string => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    if (diffInHours < 1) return "À l'instant"
    if (diffInHours < 24) return `Il y a ${Math.floor(diffInHours)}h`
    if (diffInHours < 48) return "Hier"
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleStartConversation = async (friend: UserType): Promise<void> => {
    if (!currentUser?.id) return

    try {
      if (!friend.id) return;
      const conversation = await createOrGetConversation(currentUser.id, friend.id, {
        firstName: friend.firstName,
        lastName: friend.lastName,
        avatarUrl: friend.avatarUrl,
      })
      setSelectedConversation(conversation as ConversationType);
      setQueryText("")
      setIsSearchFocused(false)
    } catch (err) {
      console.error("Erreur création conversation:", err)
    }
  }

  const handleSearchFocus = () => {
    setIsSearchFocused(true)
  }

  const handleSearchBlur = () => {
    setTimeout(() => {
      if (!queryText.trim()) {
        setIsSearchFocused(false)
      }
    }, 200)
  }

  const handleBackToConversations = () => {
    setQueryText("")
    setIsSearchFocused(false)
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
  }
  
  const getLastMessageById = (conv: ConversationType, lastMessageId: string): MessageType | undefined => {
    return messages.find((msg) => msg.id === lastMessageId);
  }

  return (
    <div className="h-screen overflow-y-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {isLoading || !minimumDelayDone ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessagesSkeleton />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex overflow-hidden w-full md:p-6 md:gap-4 no-scrollbar"
          >
            <div className="flex-1 flex overflow-hidden w-full md:p-6 md:gap-4">
              {/* Liste des conversations - cachée sur mobile si conversation sélectionnée */}
              <div className={`w-full md:w-96 bg-white md:bg-white/80 md:backdrop-blur-sm md:rounded-2xl md:shadow-xl flex flex-col h-full md:h-5/6 overflow-y-auto md:border md:border-white/20 ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 md:p-6 border-b border-gray-200/50 bg-white md:bg-white/50">
                  {/* Header mobile avec avatar utilisateur et icône édition */}
                  <div className="flex items-center justify-between mb-4 md:hidden">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={currentUser?.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {currentUser?.firstName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <h1 className="text-2xl font-bold">Chats</h1>
                    </div>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Edit className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Titre desktop */}
                  <div className="hidden md:flex items-center gap-3 mb-3">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {isSearchFocused ? "Rechercher" : "Messages"}
                    </h1>
                  </div>

                  {/* Barre de recherche */}
                  <div className="flex items-center gap-2">
                    {isSearchFocused && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleBackToConversations}
                        className="rounded-full md:block"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                    )}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Rechercher"
                        value={queryText}
                        onChange={(e) => setQueryText(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        className="pl-10 bg-gray-100 md:bg-white/70 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Stories/Avatars des amis - visible uniquement sur mobile */}
                {!isSearchFocused && (
                  <div className="md:hidden px-4 py-3 border-b border-gray-200/50 overflow-x-auto">
                    <div className="flex gap-4">
                      {friends && friends.slice(0, 10).map((friend) => (
                        <div
                          key={friend.id}
                          className="flex flex-col items-center gap-1 cursor-pointer flex-shrink-0"
                          onClick={() => handleStartConversation(friend)}
                        >
                          <div className="relative">
                            <Avatar className="w-16 h-16 border-2 border-blue-500">
                              <AvatarImage src={friend.avatarUrl || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                {friend.firstName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <span className="text-xs text-gray-600 truncate max-w-[64px]">
                            {friend.firstName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  {isSearchFocused ? (
                    <>
                      {isLoadingFriends ? (
                        <div className="text-center py-8">
                          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-gray-500 text-sm mt-3">Chargement des contacts...</p>
                        </div>
                      ) : filteredFriends && filteredFriends.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Aucun contact trouvé</p>
                          <p className="text-gray-400 text-sm mt-1">Essayez une autre recherche</p>
                        </div>
                      ) : (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                            Vos contacts
                          </div>
                          {filteredFriends && filteredFriends.map((friend) => (
                            <div
                              key={friend.id}
                              className="px-4 py-3 hover:bg-gray-50 md:hover:bg-white/50 cursor-pointer transition-all md:rounded-xl md:mx-2 md:my-1"
                              onClick={() => handleStartConversation(friend)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="w-12 h-12 md:w-12 md:h-12">
                                  <AvatarImage src={friend.avatarUrl || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                    {friend.firstName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold truncate">
                                    {friend.firstName} {friend.lastName}
                                  </h3>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {filteredConversations.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">Aucune conversation</p>
                          <p className="text-gray-400 text-sm mt-1">Commencez à discuter avec vos connexions</p>
                        </div>
                      ) : (
                        filteredConversations.map((conv) => {
                          const other = getOtherParticipant(conv, currentUser?.id || "")
                          if (!other) return null
                          const isSelected = selectedConversation?.id === conv.id
                          const hasUnread = conv.lastSenderId !== currentUser?.id && getLastMessageById(conv, conv.lastMessageId || "") ?.isRead === false
                          const displayName = `${other.firstName} ${other.lastName}`

                          return (
                            <div
                              key={conv.id}
                              className={`px-4 py-3 hover:bg-gray-50 md:hover:bg-white/50 cursor-pointer transition-all relative md:rounded-xl md:mx-2 md:my-1 ${isSelected ? "md:bg-gradient-to-r md:from-blue-50 md:to-purple-50 md:shadow-md" : ""
                                }`}
                              onClick={() => setSelectedConversation(conv)}
                            >
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <Avatar className="w-14 h-14">
                                    <AvatarImage src={other.avatarUrl || "/placeholder.svg"} />
                                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                      {displayName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className={`text-sm truncate ${hasUnread ? "font-bold" : "font-semibold"}`}>
                                      {displayName}
                                    </h3>
                                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                      {formatLastMessageTime(conv.updatedDate)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm truncate flex-1 ${hasUnread ? "font-semibold text-gray-900" : "text-gray-500"}`}>
                                      {conv.lastMessage || "Démarrer la conversation"}
                                    </p>
                                    {hasUnread && (
                                      <div className="w-3 h-3 bg-blue-600 rounded-full flex-shrink-0"></div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Zone de messages - plein écran sur mobile quand sélectionnée */}
              <div className={`flex-1 flex flex-col bg-white md:bg-white/80 md:backdrop-blur-sm md:rounded-2xl md:shadow-xl h-full md:h-5/6 overflow-hidden md:border md:border-white/20 ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                  <>
                    {/* Header conversation */}
                    <div className="border-b border-gray-200/50 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between bg-white md:bg-white/50 flex-shrink-0">
                      <div className="flex items-center gap-3">
                        {/* Bouton retour mobile */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleBackToList}
                          className="md:hidden rounded-full"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </Button>

                        {(() => {
                          const other = getOtherParticipant(selectedConversation, currentUser?.id || "")
                          return other && other.firstName && other.lastName ? (
                            <>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={other.avatarUrl} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                                  {other.firstName[0] ?? "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h2 className="font-semibold text-gray-900 text-sm md:text-base">
                                  {other.firstName} {other.lastName}
                                </h2>
                                <p className="text-xs text-green-600 font-medium">Actif maintenant</p>
                              </div>
                            </>
                          ) : null
                        })()}
                      </div>

                      <div className="flex items-center gap-1 md:gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50">
                          <Phone className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50">
                          <Video className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50 hidden md:flex">
                          <Info className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 bg-transparent min-h-0">
                      <div className="space-y-2 max-w-full mx-auto">
                        {messagesWithAvatarFlag.map((m: MessageWithAvatar, idx: number) => {
                          const sender = getSenderParticipant(m.senderId)
                          const isCurrentUser = m.senderId === currentUser?.id
                          const nextMsg = messagesWithAvatarFlag[idx + 1]
                          const isLastInGroup = !nextMsg || nextMsg.senderId !== m.senderId

                          return (
                            <div
                              key={m.id}
                              className={`flex items-end gap-2 ${isCurrentUser ? "justify-end" : "justify-start"
                                }`}
                            >
                              {!isCurrentUser && isLastInGroup && sender && sender.firstName && (
                                <Avatar className="w-7 h-7 mb-1">
                                  <AvatarImage src={sender.avatarUrl} />
                                  <AvatarFallback className="text-xs">{sender.firstName[0] ?? "?"}</AvatarFallback>
                                </Avatar>
                              )}

                              {!isCurrentUser && !isLastInGroup && <div className="w-7"></div>}

                              <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                                <div
                                  className={`px-4 py-2 break-words flex flex-col gap-2 ${isCurrentUser
                                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl rounded-br-md"
                                    : "bg-gray-100 text-gray-900 rounded-3xl rounded-bl-md"
                                    }`}
                                >
                                  {m.text && <p className="text-sm leading-relaxed">{m.text}</p>}

                                  {m.attachments && m.attachments?.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                      {m.attachments.map((file, idx) => {
                                        const isImage = file.type === "image";
                                        const isPdf = file.type === "pdf";

                                        return (
                                          <div key={idx} className="relative">
                                            {isImage && (
                                              <img
                                                src={file.url}
                                                alt={file.name}
                                                className="w-40 h-40 object-cover rounded-md shadow"
                                              />
                                            )}
                                            {isPdf && (
                                              <a
                                                href={file.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-40 h-12 flex items-center justify-center bg-gray-200 rounded-md text-xs p-1 shadow"
                                              >
                                                {file.name}
                                              </a>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Input zone */}
                    <div className="border-t border-gray-200/50 px-4 md:px-6 py-3 md:py-4 bg-white md:bg-white/50 flex-shrink-0 flex flex-col gap-2">
                      {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((file, idx) => {
                            const isImage = file.type === "image"
                            const isPdf = file.type === "pdf"

                            return (
                              <div key={idx} className="relative">
                                {isImage && (
                                  <img
                                    src={file.url}
                                    alt={file.name}
                                    className="w-24 h-24 object-cover rounded-md shadow"
                                  />
                                )}
                                {isPdf && (
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-24 h-12 flex items-center justify-center bg-gray-200 rounded-md text-xs p-1 shadow"
                                  >
                                    {file.name}
                                  </a>
                                )}
                                <button
                                  onClick={() => handleRemoveAttachment(idx)}
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-xs"
                                >
                                  ×
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex items-end gap-2 relative">
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFilesSelected}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handlePaperclipClick}
                          className="rounded-full text-blue-600 hover:bg-blue-50/50"
                        >
                          <Paperclip className="w-5 h-5" />
                        </Button>

                        <div className="flex-1 relative">
                          <Input
                            placeholder="Aa"
                            value={messageText}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-gray-100 md:bg-white/70 border-0 rounded-full pr-10 focus:ring-2 focus:ring-blue-500 shadow-sm"
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full text-blue-600 hover:bg-blue-50/50"
                          >
                            <Smile className="w-5 h-5" />
                          </Button>

                          {showEmojiPicker && (
                            <div className="absolute bottom-14 right-0 z-50">
                              <EmojiPicker onEmojiClick={handleEmojiClick} />
                            </div>
                          )}
                        </div>

                        {messageText.trim() || attachments.length > 0 ? (
                          <Button
                            onClick={handleSendMessage}
                            size="icon"
                            className="rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMessageText("👍")}
                            className="rounded-full text-blue-600 hover:bg-blue-50/50"
                          >
                            <ThumbsUp className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center px-4">
                      <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <MessageCircle className="w-16 h-16 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">Vos messages</h3>
                      <p className="text-gray-600 max-w-md">
                        Sélectionnez une conversation pour commencer à discuter avec votre réseau
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}