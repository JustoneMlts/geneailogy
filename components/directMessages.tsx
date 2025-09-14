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
} from "@/app/controllers/messagesController"
import { ConversationType, MessageType, UserType, UserLink } from "@/lib/firebase/models"
import { format } from "date-fns"
import { getConnexionsByUserId, getUserById } from "@/app/controllers/usersController"
import { handleGetUserNameInitials } from "@/app/helpers/userHelper"

export const DirectMessages = () => {
  const currentUser = useSelector(selectUser)
  const [conversations, setConversations] = useState<ConversationType[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ConversationType | null>(null)
  const [messages, setMessages] = useState<MessageType[]>([])
  const [queryText, setQueryText] = useState("")
  const [messageText, setMessageText] = useState("")
  const [acceptedConnections, setAcceptedConnections] = useState<string[]>([])
  const [acceptedFriends, setAcceptedFriends] = useState<UserType[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // 1️⃣ Récupérer connexions acceptées et profils
  useEffect(() => {
    const fetchConnectionsAndProfiles = async () => {
      if (!currentUser?.id) return
      try {
        const links: UserLink[] = await getConnexionsByUserId(currentUser.id)
        const acceptedLinks = links.filter(l => l.status === "accepted")
        const ids = acceptedLinks.map(l => l.userId)
        setAcceptedConnections(ids)

        if (!ids.length) {
          setAcceptedFriends([])
          return
        }

        const profiles = await Promise.all(ids.map(id => getUserById(id)))
        const validProfiles = profiles.filter(Boolean) as UserType[]
        setAcceptedFriends(validProfiles)
      } catch (err) {
        console.error("Erreur fetchConnectionsAndProfiles", err)
      }
    }
    fetchConnectionsAndProfiles()
  }, [currentUser?.id])

  // 2️⃣ Écouter conversations en temps réel
  useEffect(() => {
    if (!currentUser?.id) return
    const unsub = listenUserConversations(currentUser.id, (convs) => {
      const filtered = acceptedConnections.length === 0
        ? convs
        : convs.filter(c =>
          c.participantIds.some((id: string) => acceptedConnections.includes(id))
        )
      setConversations(filtered)

      if (!selectedConversation && filtered.length > 0) {
        setSelectedConversation(filtered[0])
      } else if (selectedConversation) {
        const updated = filtered.find(c => c.id === selectedConversation.id)
        if (updated) setSelectedConversation(updated)
      }
    })
    return () => unsub()
  }, [currentUser?.id, acceptedConnections])

  // 3️⃣ Écouter messages d'une conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([])
      return
    }
    const unsub = listenConversationMessages(selectedConversation.id!, (msgs) => {
      setMessages(msgs)
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50)
    })
    if (currentUser?.id) markConversationAsRead(selectedConversation.id!, currentUser.id)
    return () => unsub()
  }, [selectedConversation?.id, currentUser?.id])

  // 4️⃣ Map participants pour avatars et noms
  const participantsMap = useMemo(() => {
    if (!selectedConversation) return {}
    return selectedConversation.participantIds.reduce<Record<string, UserType>>((acc, id) => {
      const user = acceptedFriends.find(f => f.id === id)
      if (user) acc[id] = user
      return acc
    }, {})
  }, [selectedConversation, acceptedFriends])

  // 5️⃣ Messages avec flag pour avatar et read
  const messagesWithAvatarFlag = useMemo(() => {
    if (!messages.length) return []

    return messages.map((m, idx) => {
      const prev = messages[idx - 1]
      const showAvatar = !prev || prev.senderId !== m.senderId
      const isSeen = m.readBy?.includes(currentUser?.id!) ?? false
      return { ...m, showAvatar, isSeen }
    })
  }, [messages, currentUser?.id])

  // 6️⃣ Formattage heure
  const formatTime = (ts: number) => {
    try { return format(new Date(ts), "HH:mm") }
    catch { return "" }
  }

  // 7️⃣ Nom des participants
  const getParticipantDisplay = (conv: ConversationType) => {
    if (!conv) return ""
    return conv.participantIds
      .filter(id => id !== currentUser?.id)
      .map(id => {
        const user = acceptedFriends.find(f => f.id === id)
        if (!user) return "Utilisateur"
        return `${user.firstName} ${user.lastName || ""}`.trim()
      })
      .join(", ")
  }


  // 8️⃣ Sélection ou création conversation
  const handleClickFriend = async (friend: UserType) => {
    if (!currentUser?.id || !friend.id) return;

    const friendId = friend.id

    const existing = conversations.find(c => c.participantIds.includes(friendId));
    if (existing) {
      setSelectedConversation(existing);
      return;
    }

    const newConvId = await createOrUpdateConversation(undefined, {
      participantIds: [currentUser.id, friendId],
      createdDate: Date.now(),
      updatedDate: Date.now(),
      isActive: true,
    });

    if (!newConvId) return;

    const newConv: ConversationType = { id: newConvId, participantIds: [currentUser.id, friendId] };
    setSelectedConversation(newConv);
  }

  // 9️⃣ Envoi d'un message
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

  // 10️⃣ Combinaison conversations + amis sans conversation
  const combinedConversations = useMemo(() => {
    if (!currentUser?.id) return []

    const activeConversations = conversations
      .filter(c => c.isActive)
      .map(c => ({ type: "conversation" as const, data: c }))

    const friendsWithoutConversation = acceptedFriends
      .filter(friend => friend.id)
      .filter(friend => !conversations.some(c =>
        c.participantIds.some(id => id && id === friend.id)
      ))
      .map(friend => ({ type: "friend" as const, data: friend }))

    return [...activeConversations, ...friendsWithoutConversation]
  }, [conversations, acceptedFriends, currentUser?.id])

  // 11️⃣ Filtrage recherche
  const filteredConversations = useMemo(() => {
    if (!queryText.trim()) return combinedConversations
    const q = queryText.toLowerCase()
    return combinedConversations.filter(item => {
      if (item.type === "conversation") {
        return getParticipantDisplay(item.data).toLowerCase().includes(q)
      } else {
        const friend = item.data
        const fullName = `${friend.firstName} ${friend.lastName}`.toLowerCase()
        return fullName.includes(q)
      }
    })
  }, [combinedConversations, queryText])

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
        <p className="text-gray-600">Communiquez avec d'autres généalogistes et familles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ---- Conversations ---- */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle>Conversations</CardTitle>
            <div className="mt-3">
              <Input placeholder="Rechercher..." value={queryText} onChange={(e) => setQueryText(e.target.value)} />
            </div>
          </CardHeader>

          <CardContent className="p-0 max-h-[520px] overflow-auto">
            {filteredConversations.length === 0 ? (
              <p className="text-sm text-gray-500 px-4 py-2">Aucune conversation</p>
            ) : (
              filteredConversations.map(item => {
                if (item.type === "conversation") {
                  const conv = item.data;
                  const otherName = getParticipantDisplay(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  const lastMsgObj = messages
                    .filter(m => m.conversationId === conv.id)
                    .sort((a, b) => b.createdDate - a.createdDate)[0] // dernier message
                  const lastMessage = lastMsgObj?.text || ""
                  const lastSenderId = lastMsgObj?.senderId


                  return (
                    <div key={conv.id}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border-blue-200" : ""}`}
                      onClick={() => setSelectedConversation(conv)}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="flex-shrink-0">
                          <AvatarImage src={participantsMap[conv.participantIds.find(id => id !== currentUser?.id)!]?.avatarUrl || "/placeholder.svg"} />
                          <AvatarFallback>{otherName?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate">{otherName}</h3>
                          <p className="text-sm text-gray-600 truncate">{lastMessage}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {lastSenderId && lastSenderId !== currentUser?.id && (
                            <Badge className="bg-yellow-400 text-black text-xs">À ton tour</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const friend = item.data;
                  return (
                    <div key={friend.id}
                      className="p-4 border-b hover:bg-gray-50 cursor-pointer flex items-center space-x-3"
                      onClick={() => handleClickFriend(friend)}
                    >
                      <Avatar className="flex-shrink-0">
                        <AvatarImage src={friend.avatarUrl || "/placeholder.svg"} />
                        <AvatarFallback>{(friend.firstName?.[0] || "?") + (friend.lastName?.[0] || "")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{friend.firstName} {friend.lastName}</div>
                        <div className="text-xs text-gray-500 truncate">{friend.email}</div>
                      </div>
                    </div>
                  );
                }
              })
            )}
          </CardContent>
        </Card>

        {/* ---- Messages ---- */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-3">
              <Avatar className="flex-shrink-0">
                <AvatarImage src={selectedConversation ? participantsMap[selectedConversation.participantIds.find(id => id !== currentUser?.id)!]?.avatarUrl || "/placeholder.svg" : "/placeholder.svg"} />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm">{selectedConversation ? getParticipantDisplay(selectedConversation) : "Sélectionnez une conversation"}</CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="h-96 flex flex-col pt-0">
            <div ref={scrollRef} className="flex-1 space-y-4 mb-4 overflow-y-auto px-4 py-3">
              {messagesWithAvatarFlag.map(m => (
                <div key={m.id} className={`flex items-center ${m.senderId === currentUser?.id ? "justify-end" : "justify-start"}`}>
                  {m.senderId !== currentUser?.id && m.showAvatar && (
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage src={participantsMap[m.senderId]?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{participantsMap[m.senderId] && handleGetUserNameInitials(participantsMap[m.senderId]) || "?"}</AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`max-w-[70%] relative`}>
                    <div className={`flex items-center justify-center rounded-full px-3 py-2 ${m.senderId === currentUser?.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                      <p className="text-sm">{m.text}</p>
                      {/* <div className="flex justify-end items-center space-x-1 text-xs mt-1">
                        <span>{formatTime(m.createdDate)}</span>
                        {m.senderId === currentUser?.id && m.isSeen && <span>✓</span>}
                      </div> */}
                    </div>
                  </div>

                  {m.senderId === currentUser?.id && m.showAvatar && (
                    <Avatar className="w-8 h-8 ml-2">
                      <AvatarImage src={currentUser?.avatarUrl || "/placeholder.svg"} />
                      <AvatarFallback>{handleGetUserNameInitials(currentUser) || "?"}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t">
              <div className="flex space-x-2">
                <Input
                  placeholder="Tapez votre message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage() }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>Envoyer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
