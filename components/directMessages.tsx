"use client"

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input"
import { useEffect, useMemo, useRef, useState } from "react"
import { useSelector } from "react-redux"
import { selectUser } from "@/lib/redux/slices/currentUserSlice"
import {
  listenUserConversations,
  listenConversationMessages,
  sendMessage as sendMessageCtrl,
  markConversationAsRead,
} from "@/app/controllers/messagesController"
import { ConversationType, MessageType, UserType, ConversationParticipant } from "@/lib/firebase/models"
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
  MessageCircle
} from "lucide-react"
import { markMessagesNotificationsAsRead } from "@/app/controllers/notificationsController"
import MessagesSkeleton from "./messagesSkeleton"

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
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const hasSelectedInitial = useRef(false)

  // ✅ Marquer toutes les notifications "message" comme lues à l'ouverture
  useEffect(() => {
    if (!currentUser?.id) return
    markMessagesNotificationsAsRead(currentUser.id)
  }, [currentUser?.id])

  // ✅ Écoute des conversations de l'utilisateur
  useEffect(() => {
    if (!currentUser?.id) return

    const unsub = listenUserConversations(currentUser.id, (convs: ConversationType[]) => {
      setConversations(convs)
      setIsLoading(false)

      // ✅ Sélectionne la première conversation au premier rendu
      if (!hasSelectedInitial.current && convs.length > 0) {
        setSelectedConversation(convs[0])
        hasSelectedInitial.current = true
      } else if (selectedConversation) {
        // ✅ Met à jour la conversation si elle existe encore
        const updated = convs.find((c) => c.id === selectedConversation.id)
        if (updated) setSelectedConversation(updated)
      }
    })

    return () => unsub()
  }, [currentUser?.id, selectedConversation])

  // ✅ Écoute des messages d'une conversation
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

    // ✅ Marquer la conversation comme lue à l'ouverture
    markConversationAsRead(selectedConversation.id, currentUser.id)

    // ✅ Marquer notif message correspondante comme lue
    markMessagesNotificationsAsRead(currentUser.id)
    return () => unsub()
  }, [selectedConversation?.id, currentUser?.id])

  // ✅ Quand un nouveau message arrive → marquer comme lu si reçu pendant qu'on est dessus
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) return
    if (messages.length === 0) return

    const lastMsg = messages[messages.length - 1]
    if (lastMsg.senderId !== currentUser.id) {
      markConversationAsRead(selectedConversation.id, currentUser.id)
      markMessagesNotificationsAsRead(currentUser.id)
    }
  }, [messages, selectedConversation?.id, currentUser?.id])

  // ✅ Flag pour avatar groupé
  const messagesWithAvatarFlag = useMemo<MessageWithAvatar[]>(() => {
    return messages.map((m: MessageType, idx: number) => {
      const prev = messages[idx - 1]
      const showAvatar = !prev || prev.senderId !== m.senderId
      return { ...m, showAvatar }
    })
  }, [messages])

  // ✅ Trouver l'autre participant
  const getOtherParticipant = (conv: ConversationType): ConversationParticipant | undefined => {
    return conv.participants?.find((p: ConversationParticipant) => p.userId !== currentUser?.id)
  }

  // ✅ Envoi d'un message
  const handleSendMessage = async (): Promise<void> => {
    if (!messageText.trim() || !selectedConversation || !currentUser?.id) return

    const msg: Omit<MessageType, "id"> = {
      conversationId: selectedConversation.id!,
      senderId: currentUser.id,
      text: messageText.trim(),
      createdDate: Date.now(),
    }

    try {
      await sendMessageCtrl(msg)
      setMessageText("")
    } catch (err) {
      console.error("send message failed", err)
    }
  }

  // ✅ Filtrage des conversations
  const filteredConversations = useMemo<ConversationType[]>(() => {
    if (!queryText.trim()) return conversations
    const q = queryText.toLowerCase()
    return conversations.filter((conv: ConversationType) => {
      const other = getOtherParticipant(conv)
      if (!other) return false
      const fullName = `${other.firstName} ${other.lastName}`.toLowerCase()
      return fullName.includes(q)
    })
  }, [conversations, queryText, currentUser?.id])

  // ✅ Format date
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

  // ✅ Envoi via Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen overflow-y-hidden flex flex-col">
      {isLoading && <MessagesSkeleton />}

      <div className="flex-1 flex overflow-hidden w-full p-6 gap-4">
        {/* ✅ Liste des conversations */}
        <div className="w-full md:w-96 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl flex flex-col h-5/6 overflow-y-auto border border-white/20">
          <div className="p-6 border-b border-gray-200/50 bg-white/50">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Messages
            </h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher dans Messenger"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                className="pl-10 bg-white/70 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full shadow-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Aucune conversation</p>
                <p className="text-gray-400 text-sm mt-1">Commencez à discuter avec vos connexions</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv)
                if (!other) return null
                const isSelected = selectedConversation?.id === conv.id

                // ✨ Utilisation du champ hasUnreadMessages + vérification que ce n'est pas l'user actuel qui a envoyé
                const hasUnread = conv.hasUnreadMessages && conv.lastSenderId !== currentUser?.id

                const displayName = `${other.firstName} ${other.lastName}`

                return (
                  <div
                    key={conv.id}
                    className={`px-4 py-3 hover:bg-white/50 cursor-pointer transition-all relative rounded-xl mx-2 my-1 ${
                      isSelected ? "bg-gradient-to-r from-blue-50 to-purple-50 shadow-md" : ""
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
          </div>
        </div>

        {/* ✅ Zone de messages */}
        <div className="flex-1 flex flex-col bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl h-5/6 overflow-hidden border border-white/20">
          {selectedConversation ? (
            <>
              {/* Header conversation */}
              <div className="border-b border-gray-200/50 px-6 py-4 flex items-center justify-between bg-white/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {(() => {
                    const other = getOtherParticipant(selectedConversation)
                    return other ? (
                      <>
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={other.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                            {other.firstName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            {other.firstName} {other.lastName}
                          </h2>
                          <p className="text-xs text-green-600 font-medium">Actif maintenant</p>
                        </div>
                      </>
                    ) : null
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50">
                    <Info className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 bg-transparent min-h-0">
                <div className="space-y-2 max-w-4xl mx-auto">
                  {messagesWithAvatarFlag.map((m: MessageWithAvatar, idx: number) => {
                    const sender = selectedConversation?.participants?.find(
                      (p: ConversationParticipant) => p.userId === m.senderId
                    )
                    const isCurrentUser = m.senderId === currentUser?.id
                    const nextMsg = messagesWithAvatarFlag[idx + 1]
                    const isLastInGroup = !nextMsg || nextMsg.senderId !== m.senderId

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-2 ${
                          isCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        {/* Avatar à gauche pour les autres */}
                        {!isCurrentUser && isLastInGroup && sender && (
                          <Avatar className="w-7 h-7 mb-1">
                            <AvatarImage src={sender.avatarUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs">{sender.firstName[0]}</AvatarFallback>
                          </Avatar>
                        )}

                        {/* Espace pour aligner les messages groupés */}
                        {!isCurrentUser && !isLastInGroup && <div className="w-7"></div>}

                        {/* Message bubble */}
                        <div className={`max-w-[70%] ${isCurrentUser ? "items-end" : "items-start"} flex flex-col`}>
                          <div
                            className={`px-4 py-2 break-words ${
                              isCurrentUser
                                ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-3xl rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-3xl rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{m.text}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Input zone */}
              <div className="border-t border-gray-200/50 px-6 py-4 bg-white/50 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="rounded-full text-blue-600 hover:bg-blue-50/50">
                      <Paperclip className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex-1 relative">
                    <Input
                      placeholder="Aa"
                      value={messageText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="bg-white/70 border-0 rounded-full pr-10 focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-blue-600 hover:bg-blue-50/50"
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                  </div>

                  {messageText.trim() ? (
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
                      className="rounded-full text-blue-600 hover:bg-blue-50/50"
                    >
                      <ThumbsUp className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Empty state */
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
    </div>
  )
}