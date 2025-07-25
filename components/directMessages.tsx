import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { Input } from "./ui/input";
import { useState } from "react";

export const DirectMessages = () => {

    const [conversations, setConversations] = useState([
            {
                id: 1,
                name: "Marie Dubois",
                avatar: "/placeholder.svg?height=40&width=40",
                initials: "MD",
                lastMessage: "Merci pour les informations sur...",
                unreadCount: 2,
                isOnline: true,
                messages: [
                    {
                        id: 1,
                        text: "Bonjour ! J'ai vu que nous avons des ancêtres communs à Lyon.",
                        sender: "other",
                        timestamp: "10:30",
                    },
                    {
                        id: 2,
                        text: "Oui, c'est fascinant ! Pouvez-vous me dire plus sur la famille Dupont ?",
                        sender: "me",
                        timestamp: "10:35",
                    },
                ],
            },
    ])

    const [selectedConversation, setSelectedConversation] = useState(conversations[0])
 
    return (
        <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Messages</h1>
                <p className="text-gray-600">Communiquez avec d'autres généalogistes et familles</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-4">
                    <CardTitle>Conversations</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${selectedConversation?.id === conv.id ? "bg-blue-50 border-blue-200" : ""
                          }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <Avatar className="flex-shrink-0">
                              <AvatarImage src={conv.avatar || "/placeholder.svg"} />
                              <AvatarFallback>{conv.initials}</AvatarFallback>
                            </Avatar>
                            {conv.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold">{conv.name}</h3>
                            <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                          </div>
                          {conv.unreadCount > 0 && (
                            <Badge className="bg-blue-500 flex-shrink-0">{conv.unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="flex-shrink-0">
                          <AvatarImage src={selectedConversation?.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{selectedConversation?.initials}</AvatarFallback>
                        </Avatar>
                        {selectedConversation?.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <CardTitle>{selectedConversation?.name}</CardTitle>
                        <CardDescription>{selectedConversation?.isOnline ? "En ligne" : "Hors ligne"}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="h-96 flex flex-col pt-0">
                    <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
                      {selectedConversation?.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`rounded-lg p-3 max-w-xs ${message.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            <p className="text-sm">{message.text}</p>
                            <p
                              className={`text-xs mt-1 ${message.sender === "me" ? "text-blue-100" : "text-gray-500"}`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Input placeholder="Tapez votre message..." className="flex-1" />
                      <Button>Envoyer</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
    )
}