
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
  createOrUpdateConversation,
  createConversationParticipants,
} from "@/app/controllers/messagesController"
import { ConversationType, MessageType, UserType } from "@/lib/firebase/models"
import { getUserById } from "@/app/controllers/usersController"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"

export const DirectMessages = () => {
  const currentUser = useSelector(selectUser)
  const [conversations, setConversations] = useState<ConversationType[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [queryText, setQueryText] = useState("")
  const [messageText, setMessageText] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 1️⃣ Écouter conversations en temps réel
  useEffect(() => {
    if (!currentUser?.id) return

    const unsub = listenUserConversations(currentUser.id, (convs) => {
      setConversations(convs)

      if (!selectedConversation && convs.length > 0) {
        setSelectedConversation(convs[0])
      } else if (selectedConversation) {
        const updated = convs.find(c => c.id === selectedConversation.id)
        if (updated) setSelectedConversation(updated)
      }
    })
    return () => unsub()
  }, [currentUser?.id])

  // 2️⃣ Écouter messages d'une conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }
    const unsub = listenConversationMessages(selectedConversation.id!, (msgs) => {
      setMessages(msgs)
      setTimeout(() => scrollRef.current?.scrollTo({ 
        top: scrollRef.current.scrollHeight, 
        behavior: "smooth" 
      }), 50)
    })
    if (currentUser?.id) markConversationAsRead(selectedConversation.id!, currentUser.id)
    return () => unsub()
  }, [selectedConversation?.id, currentUser?.id])

  // 3️⃣ Messages avec flag pour avatar
  const messagesWithAvatarFlag = useMemo(() => {
    if (!messages.length) return []

    return messages.map((m, idx) => {
      const prev = messages[idx - 1]
      const showAvatar = !prev || prev.senderId !== m.senderId
      return { ...m, showAvatar }
    })
  }, [messages])

  // 4️⃣ Obtenir les infos du participant (depuis la conversation directement)
  const getOtherParticipant = (conv: ConversationType) => {
    return conv.participants?.find(p => p.userId !== currentUser?.id)
  }

  // 5️⃣ Envoi d'un message
  const handleSendMessage = async () => {
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

  // 6️⃣ Filtrage recherche
  const filteredConversations = useMemo(() => {
    if (!queryText.trim()) return conversations
    const q = queryText.toLowerCase()
    return conversations.filter(conv => {
      const other = getOtherParticipant(conv)
      if (!other) return false
      const fullName = `${other.firstName} ${other.lastName}`.toLowerCase()
      return fullName.includes(q)
    })
  }, [conversations, queryText, currentUser?.id])

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      <div className="h-full max-w-7xl mx-auto px-6 flex flex-col">
        <div className="mb-2 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
          <p className="text-gray-600">Communiquez avec d'autres généalogistes et familles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* ---- Conversations ---- */}
          <Card className="lg:col-span-1 flex flex-col h-screen overflow-hidden">
            <CardHeader className="pb-2 pt-4 px-4 flex-shrink-0">
              <CardTitle>Conversations</CardTitle>
              <div className="mt-3">
                <Input 
                  placeholder="Rechercher..." 
                  value={queryText} 
                  onChange={(e) => setQueryText(e.target.value)} 
                />
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 overflow-y-auto min-h-0">
              {filteredConversations.length === 0 ? (
                <p className="text-sm text-gray-500 px-4 py-2">Aucune conversation</p>
              ) : (
                filteredConversations.map(conv => {
                  const other = getOtherParticipant(conv)
                  if (!other) return null

                  const isSelected = selectedConversation?.id === conv.id
                  const displayName = `${other.firstName} ${other.lastName}`

                  return (
                    <div
                      key={conv.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="flex-shrink-0">
                          <AvatarImage src={other.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{displayName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{displayName}</h3>
                          <p className="text-sm text-gray-600 truncate">{conv.lastMessage || ""}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {conv.lastSenderId && conv.lastSenderId !== currentUser?.id && (
                            <Badge className="bg-yellow-400 text-black text-xs">À ton tour</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* ---- Messages ---- */}
          <Card className="lg:col-span-2 flex flex-col min-h-0">
            <CardHeader className="pb-2 flex-shrink-0">
              <div className="flex items-center space-x-3">
                {selectedConversation && (() => {
                  const other = getOtherParticipant(selectedConversation)
                  return other ? (
                    <>
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={other.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{other.firstName[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-sm">
                          {other.firstName} {other.lastName}
                        </CardTitle>
                        {other.location && (
                          <p className="text-xs text-gray-500">{other.location}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <CardTitle className="text-sm">Conversation</CardTitle>
                  )
                })()}
                {!selectedConversation && (
                  <CardTitle className="text-sm">Sélectionnez une conversation</CardTitle>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex flex-col flex-1 pt-0 min-h-0">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
                {messagesWithAvatarFlag.map(m => {
                  const sender = selectedConversation?.participants?.find(
                    p => p.userId === m.senderId
                  )

                  return (
                    <div
                      key={m.id}
                      className={`flex items-center ${
                        m.senderId === currentUser?.id ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.senderId !== currentUser?.id && m.showAvatar && sender && (
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage src={sender.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{sender.firstName[0]}</AvatarFallback>
                        </Avatar>
                      )}

                      <div className="max-w-[70%]">
                        <div
                          className={`px-3 py-2 ${
                            m.text && m.text.length < 50
                              ? "rounded-full"
                              : m.text && m.text.length < 150
                              ? "rounded-3xl"
                              : "rounded-2xl"
                          } ${
                            m.senderId === currentUser?.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{m.text}</p>
                        </div>
                      </div>

                      {m.senderId === currentUser?.id && m.showAvatar && (
                        <Avatar className="w-8 h-8 ml-2">
                          <AvatarImage src={currentUser?.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>
                            {handleGetUserNameInitials(currentUser) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="px-4 py-3 border-t flex-shrink-0">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Tapez votre message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage()
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage}>Envoyer</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}