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
  Plus,
  Heart,
  MessageSquare,
  Share2,
  Bell,
  Home,
  User,
  Camera,
  MapPin,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  PinIcon,
  PinOffIcon,
  Menu,
  X,
  Settings,
  Save,
  Crown,
  Globe,
  FileText,
  Trash2,
  Users
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Feed } from "@/components/feed"
import { Notifications } from "@/components/notifications"
import { Tree } from "@/components/tree"

// Family Tree Data
interface FamilyMember {
  id: string
  name: string
  birthYear?: number
  deathYear?: number
  birthPlace?: string
  avatar?: string
  spouse?: string
  children?: string[]
  parents?: string[]
  gender: "male" | "female"
}

const familyData: Record<string, FamilyMember> = {
  "jean-dupont": {
    id: "jean-dupont",
    name: "Jean Dupont",
    birthYear: 1950,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "marie-martin",
    children: ["pierre-dupont", "sophie-dupont"],
    gender: "male",
  },
  "marie-martin": {
    id: "marie-martin",
    name: "Marie Martin",
    birthYear: 1952,
    birthPlace: "Lyon, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "jean-dupont",
    children: ["pierre-dupont", "sophie-dupont"],
    gender: "female",
  },
  "pierre-dupont": {
    id: "pierre-dupont",
    name: "Pierre Dupont",
    birthYear: 1975,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["jean-dupont", "marie-martin"],
    spouse: "claire-bernard",
    children: ["lucas-dupont"],
    gender: "male",
  },
  "sophie-dupont": {
    id: "sophie-dupont",
    name: "Sophie Dupont",
    birthYear: 1978,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["jean-dupont", "marie-martin"],
    gender: "female",
  },
  "claire-bernard": {
    id: "claire-bernard",
    name: "Claire Bernard",
    birthYear: 1977,
    birthPlace: "Marseille, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "pierre-dupont",
    children: ["lucas-dupont"],
    gender: "female",
  },
  "lucas-dupont": {
    id: "lucas-dupont",
    name: "Lucas Dupont",
    birthYear: 2005,
    birthPlace: "Paris, France",
    avatar: "/placeholder.svg?height=60&width=60",
    parents: ["pierre-dupont", "claire-bernard"],
    gender: "male",
  },
  "robert-dupont": {
    id: "robert-dupont",
    name: "Robert Dupont",
    birthYear: 1920,
    deathYear: 1995,
    birthPlace: "Bordeaux, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "louise-petit",
    children: ["jean-dupont"],
    gender: "male",
  },
  "louise-petit": {
    id: "louise-petit",
    name: "Louise Petit",
    birthYear: 1925,
    deathYear: 2010,
    birthPlace: "Toulouse, France",
    avatar: "/placeholder.svg?height=60&width=60",
    spouse: "robert-dupont",
    children: ["jean-dupont"],
    gender: "female",
  },
}

function FamilyMemberCard({ member, onClick }: { member: FamilyMember; onClick: () => void }) {
  return (
    <Card
      className={`w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"
        }`}
      onClick={onClick}
    >
      <CardContent className="p-4 text-center">
        <Avatar className="w-16 h-16 mx-auto mb-3">
          <AvatarImage src={member.avatar || "/placeholder.svg"} />
          <AvatarFallback className={member.gender === "male" ? "bg-blue-100" : "bg-pink-100"}>
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-sm mb-2">{member.name}</h3>
        <div className="space-y-1 text-xs text-gray-600">
          {member.birthYear && (
            <div className="flex items-center justify-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>
                {member.birthYear}
                {member.deathYear && ` - ${member.deathYear}`}
              </span>
            </div>
          )}
          {member.birthPlace && (
            <div className="flex items-center justify-center space-x-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{member.birthPlace}</span>
            </div>
          )}
        </div>
        {member.deathYear && (
          <Badge variant="secondary" className="mt-2 text-xs">
            Décédé(e)
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

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
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [showFamilySettings, setShowFamilySettings] = useState(false)
  const [origins, setOrigins] = useState([
    { id: 1, country: "France", region: "Normandie", percentage: 60 },
    { id: 2, country: "Italie", region: "Toscane", percentage: 30 },
    { id: 3, country: "Espagne", region: "Andalousie", percentage: 10 },
  ])
  const [locations, setLocations] = useState([
    { id: 1, place: "Paris, France", period: "1950 - Présent", type: "Résidence principale" },
    { id: 2, place: "Lyon, France", period: "1920 - 1950", type: "Résidence familiale" },
    { id: 3, place: "Bordeaux, France", period: "1890 - 1920", type: "Lieu de naissance" },
  ])

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

  // Ajouter ces fonctions helper
  const addOrigin = () => {
    const newOrigin = {
      id: Date.now(),
      country: "",
      region: "",
      percentage: 0,
    }
    setOrigins([...origins, newOrigin])
  }

  const removeOrigin = (id: number) => {
    setOrigins(origins.filter((origin) => origin.id !== id))
  }

  const addLocation = () => {
    const newLocation = {
      id: Date.now(),
      place: "",
      period: "",
      type: "",
    }
    setLocations([...locations, newLocation])
  }

  const removeLocation = (id: number) => {
    setLocations(locations.filter((location) => location.id !== id))
  }

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

  const countries = [
    "France",
    "Italie",
    "Espagne",
    "Allemagne",
    "Royaume-Uni",
    "Portugal",
    "Brésil",
    "Argentine",
    "Mexique",
    "États-Unis",
    "Canada",
    "Japon",
    "Chine",
    "Inde",
    "Maroc",
    "Algérie",
    "Tunisie",
    "Sénégal",
    "Côte d'Ivoire",
    "Cameroun",
    "Autre",
  ]

  const locationTypes = ["Résidence principale", "Résidence familiale", "Lieu de naissance", "Lieu de travail", "Autre"]

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

  const familySections = [
    {
      id: "great-grandparents",
      title: isOwner ? "Vos arrière-grands-parents" : `Les arrière-grands-parents de ${treeOwner}`,
      members: ["robert-dupont", "louise-petit"],
    },
    {
      id: "grandparents",
      title: isOwner ? "Vos grands-parents" : `Les grands-parents de ${treeOwner}`,
      members: ["jean-dupont", "marie-martin"],
    },
    {
      id: "parents-uncles",
      title: isOwner ? "Vos parents et oncles/tantes" : `Les parents et oncles/tantes de ${treeOwner}`,
      members: ["pierre-dupont", "sophie-dupont", "claire-bernard"],
    },
    {
      id: "siblings-cousins",
      title: isOwner ? "Vos frères/sœurs et cousins" : `Les frères/sœurs et cousins de ${treeOwner}`,
      members: ["lucas-dupont"],
    },
  ]

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
            <Feed activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {activeTab === "tree" && (
            <Tree />
          )}

          {activeTab === "ai" && (
            <div className="animate-fade-in">
              <h1 className="text-3xl font-bold mb-6 animate-slide-up">Suggestions IA</h1>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Connexions potentielles</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">IA</Badge>
                      </div>
                      <CardDescription>
                        Personnes qui pourraient être liées à votre arbre généalogique, basées sur l'analyse IA
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.id}
                            className={`bg-white border border-gray-100 rounded-lg p-4 transition-all duration-300 animate-slide-up ${
                              suggestion.isRemoving ? "opacity-0 transform translate-x-full" : ""
                            }`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="animate-scale-in">
                                  <AvatarImage src={suggestion.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>{suggestion.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-semibold">{suggestion.name}</div>
                                  <div className="text-xs text-gray-500 flex items-center">
                                    <span>{suggestion.relationship}</span>
                                    <span className="mx-2">•</span>
                                    <span className="text-blue-600 font-medium">
                                      {suggestion.match}% de correspondance
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-gray-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors duration-200 bg-transparent"
                                  onClick={() => handleIgnoreSuggestion(suggestion.id)}
                                >
                                  Ignorer
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-colors duration-200"
                                  onClick={() => handleContactSuggestion(suggestion)}
                                >
                                  Contacter
                                </Button>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {suggestion.badges.map((badge, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs bg-gray-100 text-gray-700 animate-scale-in"
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Informations manquantes</CardTitle>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">IA</Badge>
                      </div>
                      <CardDescription>
                        L'IA a identifié des informations qui pourraient compléter votre arbre généalogique
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-white border border-gray-100 rounded-lg p-4 animate-slide-up animate-stagger-1">
                          <div className="flex items-start space-x-3">
                            <div className="bg-amber-100 p-2 rounded-full">
                              <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Date de naissance manquante</div>
                              <div className="text-sm text-gray-600 mt-1">
                                La date de naissance de <span className="font-medium">Sophie Dupont</span> est
                                manquante. Basé sur d'autres informations, elle est probablement née entre 1975 et 1980.
                              </div>
                              <div className="mt-3">
                                <Button size="sm" className="transition-colors duration-200">
                                  Ajouter cette information
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-lg p-4 animate-slide-up animate-stagger-2">
                          <div className="flex items-start space-x-3">
                            <div className="bg-blue-100 p-2 rounded-full">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-semibold">Lieu de naissance manquant</div>
                              <div className="text-sm text-gray-600 mt-1">
                                Le lieu de naissance de <span className="font-medium">Lucas Dupont</span> est manquante.
                                Basé sur les résidences familiales, il est probablement né à Paris ou Marseille.
                              </div>
                              <div className="mt-3">
                                <Button size="sm" className="transition-colors duration-200">
                                  Ajouter cette information
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Statistiques IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between animate-slide-up animate-stagger-1">
                          <div className="text-sm text-gray-600">Suggestions totales</div>
                          <div className="font-semibold">24</div>
                        </div>
                        <div className="flex items-center justify-between animate-slide-up animate-stagger-2">
                          <div className="text-sm text-gray-600">Suggestions acceptées</div>
                          <div className="font-semibold">16</div>
                        </div>
                        <div className="flex items-center justify-between animate-slide-up animate-stagger-3">
                          <div className="text-sm text-gray-600">Précision</div>
                          <div className="font-semibold">87%</div>
                        </div>
                        <div className="flex items-center justify-between animate-slide-up animate-stagger-4">
                          <div className="text-sm text-gray-600">Nouvelles suggestions</div>
                          <div className="font-semibold text-blue-600">3</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-0 animate-slide-up animate-stagger-2 card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Paramètres IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2 animate-slide-up animate-stagger-1">
                          <Label htmlFor="match-threshold">Seuil de correspondance minimum</Label>
                          <Select defaultValue="70">
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un seuil" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50">50% (Plus de suggestions)</SelectItem>
                              <SelectItem value="70">70% (Équilibré)</SelectItem>
                              <SelectItem value="90">90% (Haute précision)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 animate-slide-up animate-stagger-2">
                          <Label htmlFor="suggestion-types">Types de suggestions</Label>
                          <Select defaultValue="all">
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner les types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes les suggestions</SelectItem>
                              <SelectItem value="connections">Connexions familiales uniquement</SelectItem>
                              <SelectItem value="missing">Informations manquantes uniquement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="pt-2 animate-slide-up animate-stagger-3">
                          <Button className="w-full transition-colors duration-200">Appliquer les paramètres</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-md border-0 animate-slide-up animate-stagger-3 card-hover">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Abonnement Premium</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center animate-scale-in">
                          <Crown className="h-6 w-6 text-white" />
                        </div>
                        <div className="animate-slide-up animate-stagger-1">
                          <h3 className="font-semibold">Débloquez toutes les fonctionnalités IA</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Accédez à des suggestions illimitées et à des analyses avancées
                          </p>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white transition-colors duration-200 animate-slide-up animate-stagger-2">
                          Passer à Premium
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
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
