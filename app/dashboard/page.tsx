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
} from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

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
      className={`w-48 cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${
        member.gender === "male" ? "border-blue-200 bg-blue-50" : "border-pink-200 bg-pink-50"
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
      className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${
        isExpanded ? "w-64" : "w-16"
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
              className={`text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
              }`}
            >
              GeneAIlogy
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${
              shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
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
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span
                  className={`whitespace-nowrap transition-all duration-200 ${
                    shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  }`}
                >
                  {item.label}
                </span>
                {item.badge && (
                  <Badge
                    className={`ml-auto bg-red-500 text-white text-xs transition-all duration-200 ${
                      shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
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
            className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${
              activeTab === "profile"
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
              className={`whitespace-nowrap transition-all duration-200 ${
                shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
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
                className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${
                  activeTab === item.id
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
            <div className="space-y-6">
              {/* Create Post */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex space-x-4">
                    <Avatar className="flex-shrink-0">
                      <AvatarImage src="/placeholder.svg?height=40&width=40" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Input placeholder="Partagez une découverte familiale..." className="mb-4" />
                      <div className="flex justify-between items-center">
                        <div className="flex space-x-3">
                          <Button variant="outline" size="sm">
                            <Camera className="mr-2 h-4 w-4" />
                            Photo
                          </Button>
                          <Button variant="outline" size="sm">
                            <MapPin className="mr-2 h-4 w-4" />
                            Lieu
                          </Button>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                          Publier
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feed Posts */}
              {[1, 2, 3].map((post) => (
                <Card key={post} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback>MD</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Marie Dubois</h3>
                        <p className="text-sm text-gray-500">Il y a 2 heures</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="mb-4 leading-relaxed">
                      J'ai découvert un acte de naissance de mon arrière-grand-père ! Il était né à Lyon en 1890.
                      Quelqu'un d'autre a des ancêtres de cette région ?
                    </p>
                    <img
                      src="/placeholder.svg?height=300&width=500"
                      alt="Acte de naissance ancien"
                      className="w-full rounded-lg mb-4"
                    />
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex space-x-4">
                        <Button variant="ghost" size="sm">
                          <Heart className="mr-2 h-4 w-4" />
                          12
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="mr-2 h-4 w-4" />5
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Share2 className="mr-2 h-4 w-4" />
                          Partager
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === "tree" && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Mon arbre généalogique</h1>
                  <p className="text-gray-600">Explorez votre histoire familiale de génération en génération</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                  <div className="flex items-center space-x-2 bg-white/50 rounded-lg p-2">
                    <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium px-2 min-w-[60px] text-center">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setZoom(1)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowFamilySettings(true)}
                    className="bg-white/50 w-full sm:w-auto"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres famille
                  </Button>
                  <Link href="/add-member">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter membre
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Tree Visualization */}
              <div className="relative overflow-auto bg-white/50 rounded-xl p-4 md:p-8 min-h-[600px]">
                <div
                  className="relative mx-auto max-w-6xl"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center top",
                  }}
                >
                  <div className="space-y-8">
                    {/* Arrière-grands-parents */}
                    <div className="text-center space-y-4">
                      <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {isOwner ? "Vos arrière-grands-parents" : `Les arrière-grands-parents de ${treeOwner}`}
                      </h2>
                      <div className="flex justify-center gap-4">
                        {["robert-dupont", "louise-petit"].map((memberId) => {
                          const member = familyData[memberId]
                          if (!member) return null
                          return (
                            <div key={memberId}>
                              <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Ligne de connexion vers grands-parents */}
                    <div className="flex justify-center">
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>

                    {/* Grands-parents */}
                    <div className="text-center space-y-4">
                      <h2 className="text-xl font-bold text-gray-800 mb-4">
                        {isOwner ? "Vos grands-parents" : `Les grands-parents de ${treeOwner}`}
                      </h2>
                      <div className="flex justify-center gap-4">
                        {["jean-dupont", "marie-martin"].map((memberId) => {
                          const member = familyData[memberId]
                          if (!member) return null
                          return (
                            <div key={memberId}>
                              <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Ligne de connexion vers la génération suivante */}
                    <div className="flex justify-center">
                      <div className="w-px h-8 bg-gray-300"></div>
                    </div>

                    {/* Parents et Oncles/Tantes côte à côte */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                      {/* Section Parents */}
                      <div className="text-center space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                          {isOwner ? "Vos parents" : `Les parents de ${treeOwner}`}
                        </h2>
                        <div className="flex justify-center gap-4">
                          {["pierre-dupont", "claire-bernard"].map((memberId) => {
                            const member = familyData[memberId]
                            if (!member) return null
                            return (
                              <div key={memberId}>
                                <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
                              </div>
                            )
                          })}
                        </div>

                        {/* Ligne vers enfants */}
                        <div className="flex justify-center pt-4">
                          <div className="w-px h-8 bg-gray-300"></div>
                        </div>

                        {/* Enfants (vous) */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-700">{isOwner ? "Vous" : "Enfants"}</h3>
                          <div className="flex justify-center gap-4">
                            {["lucas-dupont"].map((memberId) => {
                              const member = familyData[memberId]
                              if (!member) return null
                              return (
                                <div key={memberId}>
                                  <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Section Oncles/Tantes */}
                      <div className="text-center space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                          {isOwner ? "Vos oncles et tantes" : `Les oncles et tantes de ${treeOwner}`}
                        </h2>
                        <div className="flex justify-center gap-4">
                          {["sophie-dupont"].map((memberId) => {
                            const member = familyData[memberId]
                            if (!member) return null
                            return (
                              <div key={memberId}>
                                <FamilyMemberCard member={member} onClick={() => setSelectedMember(member)} />
                              </div>
                            )
                          })}
                        </div>

                        {/* Ligne vers cousins */}
                        <div className="flex justify-center pt-4">
                          <div className="w-px h-8 bg-gray-300"></div>
                        </div>

                        {/* Cousins */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold text-gray-700">
                            {isOwner ? "Vos cousins" : `Les cousins de ${treeOwner}`}
                          </h3>
                          <div className="flex justify-center gap-4">
                            {/* Ici on peut ajouter les cousins quand ils existent */}
                            <div className="text-center py-8">
                              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <User className="w-6 h-6 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-500 mb-2">Aucun cousin ajouté</p>
                              <Link href="/add-member">
                                <Button variant="outline" size="sm">
                                  <Plus className="mr-1 h-3 w-3" />
                                  Ajouter
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Member Details Panel - Version améliorée */}
              {selectedMember && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedMember(null)}
                >
                  <Card
                    className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CardHeader className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-8 w-8"
                        onClick={() => setSelectedMember(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6 pt-2">
                        <Avatar className="w-24 h-24 flex-shrink-0">
                          <AvatarImage src={selectedMember.avatar || "/placeholder.svg"} />
                          <AvatarFallback
                            className={`text-2xl ${selectedMember.gender === "male" ? "bg-blue-100" : "bg-pink-100"}`}
                          >
                            {selectedMember.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>

                        <div className="text-center md:text-left flex-1">
                          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">{selectedMember.name}</CardTitle>
                          <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                            <Badge
                              variant="outline"
                              className={
                                selectedMember.gender === "male"
                                  ? "border-blue-200 text-blue-700"
                                  : "border-pink-200 text-pink-700"
                              }
                            >
                              {selectedMember.gender === "male" ? "Homme" : "Femme"}
                            </Badge>
                            {selectedMember.deathYear && <Badge variant="secondary">Décédé(e)</Badge>}
                            {selectedMember.spouse && (
                              <Badge variant="outline" className="border-red-200 text-red-700">
                                Marié(e)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Informations personnelles */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Informations personnelles
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                          {selectedMember.birthYear && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600">Date de naissance</p>
                                <p className="font-medium">{selectedMember.birthYear}</p>
                              </div>
                            </div>
                          )}

                          {selectedMember.deathYear && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600">Date de décès</p>
                                <p className="font-medium">{selectedMember.deathYear}</p>
                              </div>
                            </div>
                          )}

                          {selectedMember.birthPlace && (
                            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg md:col-span-2">
                              <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <div>
                                <p className="text-sm text-gray-600">Lieu de naissance</p>
                                <p className="font-medium">{selectedMember.birthPlace}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Relations familiales */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                          <Heart className="w-5 h-5 mr-2" />
                          Relations familiales
                        </h3>
                        <div className="space-y-3">
                          {selectedMember.spouse && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <Heart className="w-5 h-5 text-red-500" />
                                <div>
                                  <p className="text-sm text-gray-600">Conjoint(e)</p>
                                  <p className="font-medium">{familyData[selectedMember.spouse]?.name}</p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedMember(familyData[selectedMember.spouse])}
                              >
                                Voir le profil
                              </Button>
                            </div>
                          )}

                          {selectedMember.parents && selectedMember.parents.length > 0 && (
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <p className="text-sm text-gray-600">Parents</p>
                              </div>
                              <div className="space-y-2">
                                {selectedMember.parents.map((parentId) => {
                                  const parent = familyData[parentId]
                                  if (!parent) return null
                                  return (
                                    <div key={parentId} className="flex items-center justify-between">
                                      <p className="font-medium">{parent.name}</p>
                                      <Button variant="outline" size="sm" onClick={() => setSelectedMember(parent)}>
                                        Voir
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {selectedMember.children && selectedMember.children.length > 0 && (
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center space-x-2 mb-2">
                                <User className="w-5 h-5 text-green-500" />
                                <p className="text-sm text-gray-600">
                                  Enfant{selectedMember.children.length > 1 ? "s" : ""} (
                                  {selectedMember.children.length})
                                </p>
                              </div>
                              <div className="space-y-2">
                                {selectedMember.children.map((childId) => {
                                  const child = familyData[childId]
                                  if (!child) return null
                                  return (
                                    <div key={childId} className="flex items-center justify-between">
                                      <p className="font-medium">{child.name}</p>
                                      <Button variant="outline" size="sm" onClick={() => setSelectedMember(child)}>
                                        Voir
                                      </Button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t pt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                            <User className="mr-2 h-4 w-4" />
                            Modifier les informations
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter une relation
                          </Button>
                          <Button variant="outline" className="flex-1 bg-transparent">
                            <Camera className="mr-2 h-4 w-4" />
                            Ajouter une photo
                          </Button>
                        </div>
                      </div>

                      {/* Statistiques rapides */}
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Statistiques</h4>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <p className="text-2xl font-bold text-blue-600">
                              {selectedMember.birthYear && selectedMember.deathYear
                                ? selectedMember.deathYear - selectedMember.birthYear
                                : selectedMember.birthYear
                                  ? new Date().getFullYear() - selectedMember.birthYear
                                  : "?"}
                            </p>
                            <p className="text-xs text-gray-600">Âge{selectedMember.deathYear ? " au décès" : ""}</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-green-600">{selectedMember.children?.length || 0}</p>
                            <p className="text-xs text-gray-600">
                              Enfant{(selectedMember.children?.length || 0) > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-purple-600">
                              {(selectedMember.parents?.length || 0) + (selectedMember.children?.length || 0)}
                            </p>
                            <p className="text-xs text-gray-600">Relations</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Family Settings Modal */}
              {showFamilySettings && (
                <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={() => setShowFamilySettings(false)}
                >
                  <div
                    className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <Settings className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800">Paramètres de la famille</h2>
                            <p className="text-gray-600">Gérez les informations globales de votre famille</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowFamilySettings(false)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="p-6 space-y-8">
                      {/* Informations générales */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Crown className="h-5 w-5 text-yellow-600" />
                            <span>Informations générales</span>
                          </CardTitle>
                          <CardDescription>Nom de famille et informations de base</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="familyName">Nom de famille principal</Label>
                              <Input id="familyName" defaultValue="Dupont" placeholder="Nom de famille" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="familyMotto">Devise familiale (optionnel)</Label>
                              <Input id="familyMotto" placeholder="Ex: Honneur et Courage" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="familyDescription">Description de la famille</Label>
                            <Textarea
                              id="familyDescription"
                              placeholder="Décrivez l'histoire et les caractéristiques de votre famille..."
                              defaultValue="La famille Dupont est une famille française avec des racines remontant au 18ème siècle. Originaire de Normandie, elle s'est ensuite installée dans différentes régions de France."
                              className="min-h-[80px]"
                            />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Origines et nationalités */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Globe className="h-5 w-5 text-green-600" />
                            <span>Origines et nationalités</span>
                          </CardTitle>
                          <CardDescription>
                            Précisez les origines de votre famille pour améliorer les suggestions de recherche
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            {origins.map((origin, index) => (
                              <div key={origin.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                  <div className="space-y-2">
                                    <Label>Pays</Label>
                                    <Select defaultValue={origin.country}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un pays" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {countries.map((country) => (
                                          <SelectItem key={country} value={country}>
                                            {country}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Région/Province</Label>
                                    <Input defaultValue={origin.region} placeholder="Ex: Normandie" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Pourcentage estimé</Label>
                                    <div className="flex items-center space-x-2">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        defaultValue={origin.percentage}
                                        className="w-20"
                                      />
                                      <span className="text-sm text-gray-500">%</span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeOrigin(origin.id)}
                                    className="bg-transparent hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button variant="outline" onClick={addOrigin} className="w-full bg-transparent">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter une origine
                          </Button>

                          {/* Visualisation des pourcentages */}
                          <div className="space-y-3">
                            <Label>Répartition des origines</Label>
                            <div className="space-y-2">
                              {origins.map((origin) => (
                                <div key={origin.id} className="flex items-center space-x-3">
                                  <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span>
                                        {origin.country} {origin.region && `(${origin.region})`}
                                      </span>
                                      <span>{origin.percentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                        style={{ width: `${origin.percentage}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Lieux de résidence */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <MapPin className="h-5 w-5 text-red-600" />
                            <span>Lieux de résidence historiques</span>
                          </CardTitle>
                          <CardDescription>Ajoutez les différents lieux où votre famille a vécu</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            {locations.map((location, index) => (
                              <div key={location.id} className="p-4 bg-gray-50 rounded-lg">
                                <div className="grid md:grid-cols-4 gap-4 items-end">
                                  <div className="space-y-2">
                                    <Label>Lieu</Label>
                                    <Input defaultValue={location.place} placeholder="Ex: Paris, France" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Période</Label>
                                    <Input defaultValue={location.period} placeholder="Ex: 1950 - Présent" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select defaultValue={location.type}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Type de lieu" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {locationTypes.map((type) => (
                                          <SelectItem key={type} value={type}>
                                            {type}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeLocation(location.id)}
                                    className="bg-transparent hover:bg-red-50 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <Button variant="outline" onClick={addLocation} className="w-full bg-transparent">
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter un lieu
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Traditions et faits marquants */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <span>Traditions et faits marquants</span>
                          </CardTitle>
                          <CardDescription>
                            Documentez les traditions familiales, métiers récurrents, et événements importants
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="traditions">Traditions familiales</Label>
                              <Textarea
                                id="traditions"
                                placeholder="Ex: Réunion familiale annuelle à Noël, recettes traditionnelles..."
                                className="min-h-[100px]"
                                defaultValue="Réunion familiale annuelle le 15 août, transmission de la recette du coq au vin de génération en génération."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="professions">Métiers récurrents</Label>
                              <Textarea
                                id="professions"
                                placeholder="Ex: Artisans, agriculteurs, enseignants..."
                                className="min-h-[100px]"
                                defaultValue="Nombreux artisans menuisiers, quelques instituteurs, tradition militaire côté paternel."
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="events">Événements marquants</Label>
                            <Textarea
                              id="events"
                              placeholder="Ex: Participation à des événements historiques, migrations importantes..."
                              className="min-h-[100px]"
                              defaultValue="Migration de Normandie vers Paris en 1920 suite à la Première Guerre mondiale. Participation de plusieurs membres à la Résistance."
                            />
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="characteristics">Caractéristiques physiques récurrentes</Label>
                              <Textarea
                                id="characteristics"
                                placeholder="Ex: Yeux bleus, grande taille, cheveux roux..."
                                className="min-h-[60px]"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="languages">Langues parlées dans la famille</Label>
                              <Input id="languages" placeholder="Ex: Français, Italien, Espagnol..." />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Paramètres de recherche */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <Search className="h-5 w-5 text-blue-600" />
                            <span>Paramètres de recherche</span>
                          </CardTitle>
                          <CardDescription>
                            Ces informations aideront l'IA à vous proposer des suggestions plus pertinentes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="searchRadius">Rayon de recherche géographique</Label>
                              <Select defaultValue="national">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="local">Local (même région)</SelectItem>
                                  <SelectItem value="national">National (même pays)</SelectItem>
                                  <SelectItem value="continental">Continental (même continent)</SelectItem>
                                  <SelectItem value="global">Mondial</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="timeRange">Période de recherche prioritaire</Label>
                              <Select defaultValue="19th-20th">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="18th">18ème siècle</SelectItem>
                                  <SelectItem value="19th">19ème siècle</SelectItem>
                                  <SelectItem value="19th-20th">19ème-20ème siècle</SelectItem>
                                  <SelectItem value="20th">20ème siècle</SelectItem>
                                  <SelectItem value="all">Toutes périodes</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">💡 Conseil</h4>
                            <p className="text-sm text-blue-700">
                              Plus vous renseignez d'informations précises, plus l'IA pourra vous proposer des
                              suggestions de liens familiaux pertinentes et vous connecter avec d'autres familles ayant
                              des origines similaires.
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Footer avec actions */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <div className="flex space-x-3">
                          <Button variant="outline" className="bg-transparent">
                            Réinitialiser
                          </Button>
                          <Button variant="outline" className="bg-transparent">
                            Aperçu
                          </Button>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                          <Save className="mr-2 h-4 w-4" />
                          Enregistrer les paramètres
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "ai" && (
            <div className="space-y-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Suggestions IA</h1>
                <p className="text-gray-600">
                  L'intelligence artificielle analyse vos données pour vous proposer des liens familiaux potentiels
                </p>
              </div>

              <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    <CardTitle className="text-purple-800">Nouvelles suggestions</CardTitle>
                  </div>
                  <CardDescription>L'IA a analysé vos données et trouvé des liens potentiels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestions.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">Aucune nouvelle suggestion</h3>
                      <p className="text-gray-600">
                        L'IA analyse constamment vos données pour trouver de nouveaux liens familiaux.
                      </p>
                    </div>
                  ) : (
                    suggestions.map((suggestion) => (
                      <Card
                        key={suggestion.id}
                        className={`bg-white transition-all duration-300 ease-in-out ${
                          suggestion.isRemoving
                            ? "transform translate-x-full opacity-0"
                            : "transform translate-x-0 opacity-100"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
                            <div className="flex items-center space-x-4">
                              <Avatar className="flex-shrink-0">
                                <AvatarImage src={suggestion.avatar || "/placeholder.svg"} />
                                <AvatarFallback>{suggestion.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold mb-1">{suggestion.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  {suggestion.relationship} - {suggestion.match}% de correspondance
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  {suggestion.badges.map((badge, index) => (
                                    <Badge key={index} variant="secondary">
                                      {badge}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2 w-full md:w-auto">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 md:flex-none bg-transparent hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                onClick={() => handleIgnoreSuggestion(suggestion.id)}
                                disabled={suggestion.isRemoving}
                              >
                                Ignorer
                              </Button>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700 flex-1 md:flex-none"
                                onClick={() => handleContactSuggestion(suggestion)}
                                disabled={suggestion.isRemoving}
                              >
                                Contacter
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "search" && (
            <div className="space-y-6">
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
            <div className="space-y-6">
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
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-blue-50 border-blue-200" : ""
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
                            className={`rounded-lg p-3 max-w-xs ${
                              message.sender === "me" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
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
            <div className="space-y-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Notifications</h1>
                <p className="text-gray-600">Restez informé des dernières activités sur votre arbre généalogique</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    type: "suggestion",
                    title: "Nouvelle suggestion IA",
                    message: "3 nouveaux liens familiaux potentiels ont été trouvés",
                    time: "Il y a 2 heures",
                    unread: true,
                  },
                  {
                    type: "message",
                    title: "Nouveau message",
                    message: "Marie Dubois vous a envoyé un message",
                    time: "Il y a 4 heures",
                    unread: true,
                  },
                  {
                    type: "connection",
                    title: "Nouvelle connexion",
                    message: "Pierre Martin a accepté votre demande de connexion",
                    time: "Hier",
                    unread: false,
                  },
                  {
                    type: "update",
                    title: "Mise à jour d'arbre",
                    message: "Sophie Dupont a ajouté de nouvelles informations",
                    time: "Il y a 2 jours",
                    unread: false,
                  },
                ].map((notification, index) => (
                  <Card key={index} className={`${notification.unread ? "border-blue-200 bg-blue-50" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {notification.type === "suggestion" && <Sparkles className="h-5 w-5 text-purple-600" />}
                          {notification.type === "message" && <MessageCircle className="h-5 w-5 text-blue-600" />}
                          {notification.type === "connection" && <User className="h-5 w-5 text-green-600" />}
                          {notification.type === "update" && <TreePine className="h-5 w-5 text-orange-600" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{notification.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">{notification.time}</p>
                        </div>
                        {notification.unread && <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
