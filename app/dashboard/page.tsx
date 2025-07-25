"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TreePine,
  MessageCircle,
  Search,
  Sparkles,
  Bell,
  Home,
  User,
  MapPin,
  Calendar,
  PinIcon,
  PinOffIcon,
  Menu,
  X,
  Crown,
  Users
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Feed } from "@/components/feed"
import { Notifications } from "@/components/notifications"
import { Tree } from "@/components/tree"
import { Ai } from "@/components/ai"

function DesktopSidebar({
  activeTab,
  setActiveTab,
  isExpanded,
  setIsExpanded,
  isPinned,
  setIsPinned,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  isPinned: boolean
  setIsPinned: (pinned: boolean) => void
}) {
  const [showText, setShowText] = useState(isPinned)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "tree", label: "Mon arbre", icon: TreePine },
    { id: "ai", label: "Suggestions IA", icon: Sparkles },
    { id: "search", label: "Recherche", icon: Search },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ]

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true)
      // Délai pour que la sidebar se déploie avant l'apparition du texte
      setTimeout(() => setShowText(true), 200)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      // Les textes disparaissent immédiatement
      setShowText(false)
      // La sidebar se replie après un court délai
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  const handlePinToggle = () => {
    const newPinnedState = !isPinned
    setIsPinned(newPinnedState)

    if (newPinnedState) {
      // Pin: déployer immédiatement
      setIsExpanded(true)
      setTimeout(() => setShowText(true), 200)
    } else {
      // Unpin: replier avec animation
      setShowText(false)
      setTimeout(() => setIsExpanded(false), 150)
    }
  }

  // Synchroniser showText avec isPinned au montage
  useEffect(() => {
    if (isPinned) {
      setIsExpanded(true)
      setShowText(true)
    } else {
      setShowText(false)
      setIsExpanded(false)
    }
  }, [isPinned])

  // Condition pour afficher le texte : sidebar dépliée ET (épinglée OU texte activé)
  const shouldShowText = isExpanded && (isPinned || showText)

  return (
    <div
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-16"
        } fixed left-0 top-0 z-40 shadow-lg`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 min-h-[73px] flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <TreePine className="h-8 w-8 text-blue-600 flex-shrink-0" />
            <span
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
            >
              GeneAIlogy
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
              }`}
          >
            {isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <nav className="space-y-2 px-2">
          {menuItems.map((item) => (
            <Link key={item.id} href={item.id === "family-settings" ? "/family-settings" : "/dashboard"}>
              <button
                onClick={() => {
                  if (item.id !== "family-settings") {
                    setActiveTab(item.id)
                  }
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                    }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    className={`ml-auto bg-red-500 text-white text-xs transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
                      }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-gray-200">
        <Link href="/profile">
          <button
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === "profile"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
          >
            <div className="flex justify-center w-5">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
            <span
              className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
            >
              Jean Dupont
            </span>
          </button>
        </Link>
      </div>
    </div>
  )
}

function MobileHeader({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const menuItems = [
    { id: "feed", label: "Feed", icon: Home },
    { id: "notifications", label: "Notifications", icon: Bell, badge: 3 },
    { id: "tree", label: "Mon arbre", icon: TreePine },
    { id: "ai", label: "Suggestions IA", icon: Sparkles },
    { id: "search", label: "Recherche", icon: Search },
    { id: "connections", label: "Connexions", icon: Users, href: "/connections" },
    { id: "messages", label: "Messages", icon: MessageCircle },
  ]

  const handleMenuItemClick = (tabId: string) => {
    setActiveTab(tabId)
    setIsMenuOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <TreePine className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            GeneAIlogy
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
          <nav className="py-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
              </button>
            ))}
            <Link href="/profile">
              <button className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900">
                <User className="h-5 w-5" />
                <span>Profil</span>
              </button>
            </Link>
          </nav>
        </div>
      )}
    </>
  )
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("feed")
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)

  // Ajouter après les autres états
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      name: "Pierre Dupont",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "PD",
      relationship: "Possible cousin",
      match: 85,
      badges: ["Même nom de famille", "Région similaire"],
      isRemoving: false,
    },
    {
      id: 2,
      name: "Marie Dubois",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "MD",
      relationship: "Possible tante",
      match: 78,
      badges: ["Même région", "Période similaire"],
      isRemoving: false,
    },
    {
      id: 3,
      name: "Jean Martin",
      avatar: "/placeholder.svg?height=40&width=40",
      initials: "JM",
      relationship: "Possible grand-oncle",
      match: 72,
      badges: ["Même ville", "Métier similaire"],
      isRemoving: false,
    },
  ])

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

  // Ajouter après les autres fonctions helper
  const handleIgnoreSuggestion = (suggestionId: number) => {
    // Marquer la suggestion comme en cours de suppression pour déclencher l'animation
    setSuggestions((prev) =>
      prev.map((suggestion) => (suggestion.id === suggestionId ? { ...suggestion, isRemoving: true } : suggestion)),
    )

    // Supprimer définitivement après l'animation
    setTimeout(() => {
      setSuggestions((prev) => prev.filter((suggestion) => suggestion.id !== suggestionId))
    }, 300)
  }

  const handleContactSuggestion = (suggestion: any) => {
    // Vérifier si une conversation existe déjà
    const existingConversation = conversations.find((conv) => conv.name === suggestion.name)

    if (existingConversation) {
      // Si la conversation existe, la sélectionner et aller aux messages
      setSelectedConversation(existingConversation)
      setActiveTab("messages")
    } else {
      // Créer une nouvelle conversation
      const newConversation = {
        id: Date.now(),
        name: suggestion.name,
        avatar: suggestion.avatar,
        initials: suggestion.initials,
        lastMessage: "Nouvelle conversation",
        unreadCount: 0,
        isOnline: false,
        messages: [
          {
            id: 1,
            text: `Bonjour ${suggestion.name} ! J'ai vu votre profil dans les suggestions IA. Nous semblons avoir des liens familiaux potentiels (${suggestion.relationship.toLowerCase()}, ${suggestion.match}% de correspondance). J'aimerais en savoir plus sur votre famille.`,
            sender: "me",
            timestamp: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          },
        ],
      }

      // Ajouter la nouvelle conversation
      setConversations((prev) => [newConversation, ...prev])
      setSelectedConversation(newConversation)

      // Supprimer la suggestion de la liste
      setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id))

      // Aller à l'onglet messages
      setActiveTab("messages")
    }
  }

  // Calculer la marge gauche dynamiquement
  const getLeftMargin = () => {
    if (isExpanded || isPinned) {
      return "md:ml-64" // 256px
    }
    return "md:ml-16" // 64px
  }

  // Remplace les générations existantes par :
  const treeOwner = "Jean Dupont" // Nom du propriétaire de l'arbre
  const isOwner = true // À déterminer selon l'utilisateur connecté

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isExpanded={isExpanded}
        setIsExpanded={setIsExpanded}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
      />

      {/* Mobile Header */}
      <MobileHeader activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className={`min-h-screen transition-all duration-300 ease-in-out ${getLeftMargin()}`}>
        <div className="p-6">
          {activeTab === "feed" && (
            <Feed setActiveTab={setActiveTab} />
          )}

          {activeTab === "tree" && (
            <Tree />
          )}

          {activeTab === "ai" && (
            <Ai setActiveTab={setActiveTab} />
          )}

          {activeTab === "search" && (
            <div className="animate-fade-in">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Recherche de familles</h1>
                <p className="text-gray-600">Trouvez d'autres familles et découvrez des connexions potentielles</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <Input placeholder="Nom de famille" />
                    <Input placeholder="Prénom" />
                    <Input placeholder="Lieu de naissance" />
                    <Input placeholder="Période (ex: 1800-1900)" />
                    <Input placeholder="Nationalité" />
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 lg:col-span-1">
                      <Search className="mr-2 h-4 w-4" />
                      Rechercher
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((family) => (
                  <Card key={family} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarImage src="/placeholder.svg?height=48&width=48" />
                          <AvatarFallback>FM</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">Famille Martin</CardTitle>
                          <CardDescription>Lyon, France • 15 membres</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        Famille originaire de Lyon avec des racines remontant au 18ème siècle...
                      </p>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                        <Badge variant="outline">Public</Badge>
                        <div className="flex space-x-2 w-full sm:w-auto">
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none bg-transparent">
                            Voir l'arbre
                          </Button>
                          <Button size="sm" className="flex-1 sm:flex-none">
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "messages" && (
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
          )}

          {activeTab === "notifications" && (
           <Notifications />
          )}
        </div>
      </div>
    </div>
  )
}
